#!/usr/bin/env python3
"""Outil de couverture visuelle PACTUM — rapport + édition.

Journal Notion 25/07 « Outil de couverture visuelle » : voir d'un coup d'œil
quelle image est attachée à quelle scène, repérer les manques et les remplacer.

    python3 tools/coverage.py              # écrit data/couverture_visuelle.html
    python3 tools/coverage.py --serve      # + serveur d'édition sur :8765

Le rapport est GÉNÉRÉ, jamais écrit à la main : il croise

  • aldenhar/lib/scene-data.ts   → l'image RÉELLEMENT affichée en jeu
  • data/zones/*.json           → la matière de production (lieu_attache)
  • data/scene-meta.json        → description + prompt_image par scène
  • aldenhar/public/assets/     → existence des fichiers, et orphelins

⚠️ Pourquoi lire le .ts et pas seulement les JSON de zone : c'est
`lib/scene-data.ts` que le jeu exécute. `data/zones/landes.json` est de la
matière de production qui n'est PAS lue au runtime — s'y fier ferait mentir la
colonne « image affichée en jeu ». Les divergences entre les deux sont
justement une des choses que ce rapport doit montrer.

Le parsing du .ts est volontairement textuel (regex) : pas de dépendance à un
toolchain TypeScript pour un outil de production, et le format des scènes est
stable et régulier.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCENE_TS = ROOT / "aldenhar" / "lib" / "scene-data.ts"
ZONES_DIR = ROOT / "data" / "zones"
META_JSON = ROOT / "data" / "scene-meta.json"
ASSETS = ROOT / "aldenhar" / "public" / "assets"
MANIFEST = ASSETS / "manifest.json"


def load_manifest() -> dict:
    """Le manifeste des assets (`npm run gen:manifest`).

    Donne à chaque fichier son hash court, sa taille, sa date et un drapeau
    « récent » (touché par l'un des N derniers commits). Sert à TROIS choses
    ici, à ne pas confondre :
      • le hash dans l'URL de la vignette — pour qu'un fichier modifié sous le
        même nom ne puisse plus être servi depuis un cache ;
      • le hash AFFICHÉ — deux vignettes au même hash = même fichier réutilisé ;
      • le filtre « Introuvable » — un `illustration` qui pointe vers un fichier
        absent du manifeste doit crier, pas se taire.
    Absent (première exécution, script pas encore lancé) → dégradation propre :
    la page marche, sans hash ni filtres de fraîcheur."""
    if not MANIFEST.exists():
        return {"genere": "", "commit": "", "fichiers": {}}
    try:
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    except Exception:
        return {"genere": "", "commit": "", "fichiers": {}}
OUT_HTML = ROOT / "data" / "couverture_visuelle.html"
VERDICTS_JSON = ROOT / "data" / "couverture-verdicts.json"

PORTAL = "assets/dithering-portal.jpg"

# Statuts (4 couleurs, comme la maquette de référence).
DEDIEE, HERITEE, FALLBACK, MANQUANTE = "dediee", "heritee", "fallback", "manquante"

# ⚠️ Libellés en FRANÇAIS CLAIR : « dédiée / héritée / fallback » était du
# jargon que j'avais inventé, incompréhensible pour le seul utilisateur de
# l'outil (retour Patrick 26/07). Les clés internes ne changent pas — elles
# servent aux filtres et aux verdicts déjà enregistrés.
STATUT_LABEL = {
    DEDIEE: "son image",
    HERITEE: "image empruntée",
    FALLBACK: "vue générique",
    MANQUANTE: "aucune image",
}

# ── Icônes de rôle : la grammaire du panneau de calques de FIGMA ────────────
# Retour Patrick 26/07 : « la navigation est confuse, mets une icône comme
# Figma pour le composant principal et sa variante pour les variantes ».
# On reprend donc littéralement les deux pictogrammes qu'il a déjà sous les
# yeux tous les jours :
#   • 4 losanges  = le COMPOSANT — l'image principale de la scène ;
#   • 1 losange creux = une VARIANTE (élément observé, autre moment du lieu).
# Posées à GAUCHE du nom, comme dans l'arbre de calques.
ICON_PRINCIPALE = (
    '<svg class="ico principale" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">'
    '<path d="M7 .6 9 2.6 7 4.6 5 2.6Z"/><path d="M11.4 5 13.4 7 11.4 9 9.4 7Z"/>'
    '<path d="M7 9.4 9 11.4 7 13.4 5 11.4Z"/><path d="M2.6 5 4.6 7 2.6 9 .6 7Z"/>'
    "</svg>"
)
ICON_VARIANTE = (
    '<svg class="ico variante" viewBox="0 0 14 14" fill="none" stroke="currentColor" '
    'stroke-width="1.2" aria-hidden="true"><path d="M7 1.4 12.6 7 7 12.6 1.4 7Z"/></svg>'
)

# Explication affichée dans la page, sous les compteurs.
STATUT_AIDE = {
    DEDIEE: "cette scène a une image qui n'appartient qu'à elle",
    HERITEE: "elle réutilise l'image d'une autre scène",
    FALLBACK: "elle montre une vue d'ambiance de la zone, pas son lieu",
    MANQUANTE: "rien à afficher — c'est le portail par défaut qui sort",
}

# ⚠️ Le VERDICT est une notion distincte du STATUT, et il ne faut pas les
# confondre : le statut dit si une image est CÂBLÉE (dédiée/héritée/fallback/
# manquante), le verdict dit si elle est BONNE. Une scène peut très bien être
# « dédiée » (donc techniquement complète) et « à remplacer » (l'image ne
# raconte pas la bonne chose — le Moulin sans Ailes qui a encore ses ailes en
# est l'exemple canonique). Le verdict est du jugement humain, jamais déduit.
#
# Il vit dans un JSON SUIVI PAR GIT, donc il traverse les machines : marquer une
# image sur l'iMac la fait apparaître marquée sur le MacBook après un pull.
A_REMPLACER, OK = "a_remplacer", "ok"


def load_verdicts() -> dict[str, dict]:
    if not VERDICTS_JSON.exists():
        return {}
    try:
        return json.loads(VERDICTS_JSON.read_text(encoding="utf-8")).get("verdicts", {})
    except (json.JSONDecodeError, OSError):
        return {}


def save_verdict(item_id: str, verdict: str, note: str = "") -> None:
    """Pose ou retire un verdict. `verdict` vide = on efface l'avis."""
    verdicts = load_verdicts()
    if verdict:
        entry = {"v": verdict}
        if note:
            entry["note"] = note
        verdicts[item_id] = entry
    else:
        verdicts.pop(item_id, None)
    VERDICTS_JSON.parent.mkdir(parents=True, exist_ok=True)
    VERDICTS_JSON.write_text(
        json.dumps(
            {
                "_comment": "Jugement humain sur la QUALITÉ des illustrations "
                "(distinct du statut de câblage). Écrit par tools/coverage.py "
                "--serve. Suivi par git pour synchroniser les deux postes.",
                "verdicts": dict(sorted(verdicts.items())),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


DEFAULT_ZONE = "Les Landes"


def zone_index() -> tuple[dict[str, str], dict[str, str], dict[str, str]]:
    """Lit `data/zones/*.json` et renvoie trois index : id → zone, id → LIEU,
    id → nom lisible.

    ⚠️ Le regroupement du 26/07 (matin) appelait « lieu » l'id de scène privé
    de son suffixe — mais `hesitant` n'est pas un lieu, c'est une RENCONTRE qui
    a lieu à la Borne. D'où « encore plus confusant » (retour Patrick). Les
    vrais lieux sont la collection `lieux` ; rencontres, créatures et objets
    s'y rattachent par `lieu_attache`.
    """
    zones: dict[str, str] = {}
    lieu_de: dict[str, str] = {}
    nom_de: dict[str, str] = {}
    for z in sorted(ZONES_DIR.glob("*.json")):
        try:
            data = json.loads(z.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        zone_nom = (data.get("zone") or {}).get("nom") or z.stem.replace("_", " ").title()
        lieux = {e["id"]: (e.get("nom") or e["id"]) for e in data.get("lieux", []) if e.get("id")}
        for lid, lnom in lieux.items():
            k = lid.replace("_", "-")
            zones[k] = zone_nom
            lieu_de[k] = lnom
            nom_de[k] = lnom
        for coll in ("rencontres", "creatures", "objets"):
            for e in data.get(coll, []):
                if not e.get("id"):
                    continue
                k = e["id"].replace("_", "-")
                zones[k] = zone_nom
                nom_de[k] = e.get("nom") or k
                att = e.get("lieu_attache")
                # Un errant (lieu_attache null) est rangé à part : il n'a pas
                # de lieu, et le prétendre serait un mensonge.
                lieu_de[k] = lieux.get(att, ERRANTS) if att else ERRANTS
    return zones, lieu_de, nom_de


ERRANTS = "Sans lieu fixe"
EN_CHEMIN = "En chemin"

# Le rôle d'une carte qui n'est pas l'image principale de son lieu.
ROLE_KIND = {
    "poi": "élément observé",
    "interaction": "ce que montre une action",
    "transition": "écran de marche",
    "scene": "autre moment du lieu",
}

# Rattachements que les données de zone ne portent pas : séquences scriptées
# (Hameau), scènes de structure (Descente, procès) et rencontres dont l'id de
# scène ne colle pas à celui de landes.json. À écrit à la main faute de mieux —
# à déplacer dans landes.json quand ces séquences y seront décrites.
LIEU_MANUEL = {
    "borne-frontiere": "La Borne frontière",
    "hesitant": "La Borne frontière",
    "chemin-creux": "Le Chemin Creux",
    "marcheur": "Le Chemin Creux",
    "bete-chemins-creux": "Le Chemin Creux",
    "serment-hameau": "Le Hameau des Renonçants",
    "hameau-entree": "Le Hameau des Renonçants",
    "hameau-halte": "Le Hameau des Renonçants",
    "hameau-halte-dehors": "Le Hameau des Renonçants",
    "femme-seuil": "Le Hameau des Renonçants",
    "proces-du-heros": "Le Hameau des Renonçants",
    "campement": "Le Moulin Arrêté",
    "epoux": "Le Verger Noir",
    "veilleur": "La Palissade Sud",
    "palissade-sud": "La Palissade Sud",
    "la-descente": "La Descente",
}

# Noms lisibles des scènes que landes.json ne nomme pas (séquences scriptées et
# rencontres dont l'id de scène diffère de celui des données de zone).
NOM_MANUEL = {
    "hameau-entree": "L'entrée au Hameau",
    "hameau-halte": "La halte au Hameau",
    "hameau-halte-dehors": "La nuit dehors (Serment refusé)",
    "serment-hameau": "L'approche du Hameau",
    "proces-du-heros": "Le procès du héros",
    "femme-seuil": "La Femme au Seuil",
    "campement": "Le Moulin Arrêté",
    "veilleur": "Le Veilleur de la Palissade",
    "marcheur": "Le Marcheur à rebours",
    "epoux": "Les Époux du Verger",
    "bete-chemins-creux": "La Bête des Chemins Creux",
}


@dataclass
class Item:
    """Une carte du rapport : une scène, ou un point d'intérêt."""

    id: str
    kind: str  # "scene" | "poi"
    image: str | None
    statut: str
    parent: str = ""  # scène porteuse (POI) ou source de l'héritage
    description: str = ""
    prompt: str = ""
    categorie: str = "scene"  # scene | monstre | objet | liaison
    notes: list[str] = field(default_factory=list)
    verdict: str = ""  # "" | a_remplacer | ok  — jugement humain
    verdict_note: str = ""
    # ─── Regroupement (26/07) ─────────────────────────────────────────────
    # `zone` : le rapport était une grille à plat, or d'autres zones arrivent.
    # `group` : le LIEU auquel la carte appartient. Une scène « hesitant-2 » ou
    # un point d'intérêt appartiennent au même lieu que « hesitant-1 » / que
    # leur scène porteuse — sans ça on ne voyait pas quelle image était la
    # principale et lesquelles étaient ses variantes (retour Patrick 26/07).
    zone: str = "Les Landes"
    group: str = ""
    # Le LIEU réel (« La Borne frontière »), distinct du `group` qui n'est que
    # la clé technique de la ligne. Et le nom lisible de la scène de la ligne.
    lieu: str = ""
    scene_nom: str = ""
    # Carte principale de son groupe (l'image « au repos » du lieu).
    principale: bool = False


# ─────────────────────────────────────────────────────────── parsing scene-data


def read_scenes(src: str) -> list[dict]:
    """Découpe SCENES[] en blocs de scène, chacun avec son id, son illustration
    et ses points d'intérêt."""
    start = src.index("export const SCENES")
    blk = src[start:]
    marks = [(m.start(), m.group(1)) for m in re.finditer(r'\n    id: "([^"]+)",\n', blk)]
    marks.append((len(blk), None))
    scenes = []
    for i in range(len(marks) - 1):
        a, sid = marks[i]
        body = blk[a : marks[i + 1][0]]
        illo = re.search(r'\n    illustration: "([^"]+)"', body)
        pois = []
        if "pointsInteret:" in body:
            ps = body.index("pointsInteret:")
            end = body.index("\n    choices:", ps) if "\n    choices:" in body[ps:] else len(body)
            for pm in re.finditer(r'\n      \{\n(.*?)(?=\n      \},|\n    \])', body[ps:end], re.S):
                pbody = pm.group(1)
                pid = re.search(r'id: "([^"]+)"', pbody)
                if not pid or "approche:" not in pbody:
                    continue  # c'est un choix, pas un point d'intérêt
                pillo = re.search(r'illustration: "([^"]+)"', pbody)
                pois.append({"id": pid.group(1), "illustration": pillo.group(1) if pillo else None})
        # ── LES INTERACTIONS (ex-points d'intérêt) ────────────────────────
        # ⚠️ Le 13/08, les 34 points d'intérêt sont devenus des ACTIONS : leur
        # image a migré de `PointInteret.illustration` vers `Choice.illustration`.
        # L'extracteur ne lisant que les points, ces 70 images se sont retrouvées
        # SANS AUCUNE FICHE — invisibles ici comme dans le Studio, donc
        # impossibles à juger. Trois verdicts déjà posés par Patrick pointaient
        # dans le vide pour cette seule raison (`croix-ombres`, `potences-cercle`).
        # Un choix qui porte une image EST un écran : il se regarde comme tel.
        inters = []
        if "\n    choices:" in body:
            cs = body.index("\n    choices:")
            for cm in re.finditer(r'\n      \{\n(.*?)(?=\n      \},|\n    \])', body[cs:], re.S):
                cbody = cm.group(1)
                cid = re.search(r'id: "([^"]+)"', cbody)
                cillo = re.search(r'illustration: "([^"]+)"', cbody)
                if not cid or not cillo:
                    continue
                clab = re.search(r'label:\s*"((?:[^"\\]|\\.)*)"', cbody)
                inters.append(
                    {
                        "id": cid.group(1),
                        "label": clab.group(1) if clab else cid.group(1),
                        "illustration": cillo.group(1),
                    }
                )
        scenes.append(
            {
                "id": sid,
                "illustration": illo.group(1) if illo else None,
                "pois": pois,
                "interactions": inters,
            }
        )
    # ── LA DESCENTE ────────────────────────────────────────────────────────
    # Elle vit HORS de `SCENES[]` (c'est le nœud terminal, `DESCENTE_SCENE`),
    # donc aucun outil ne la voyait — alors que c'est le seul écran où l'on
    # sort vivant de la zone, et que Patrick l'avait déjà marquée à remplacer.
    mterm = re.search(r"const DESCENTE_SCENE[^=]*=\s*\{([\s\S]*?)\n\};", src)
    if mterm and '\n  id: "la-descente"' in mterm.group(1):
        timg = re.search(r'\n  illustration: "([^"]+)"', mterm.group(1))
        scenes.append(
            {
                "id": "la-descente",
                "illustration": timg.group(1) if timg else None,
                "pois": [],
                "interactions": [],
            }
        )
    return scenes


# Les vues de MARCHE, avec la règle qui les choisit (`pickWalkImage`). Ce sont
# les écrans de TRANSITION : entre deux lieux, le héros marche, et c'est ce
# qu'il voit. Elles n'appartiennent à aucune scène de `SCENES[]` — sans cette
# table elles n'ont, elles non plus, aucune fiche où être jugées.
REGLE_MARCHE = {
    "HAMEAU_WALK": "quand on marche vers le hameau, ou d'une ruelle à l'autre",
    "LANDES_WALK": "marche ordinaire dans la lande (tirage)",
    "LANDES_GENERIC": "marche ordinaire dans la lande (tirage)",
}


def read_transitions(src: str) -> list[dict]:
    """Les images des écrans de marche, chacune avec la règle qui la sert."""
    out: dict[str, str] = {}
    for nom in ("HAMEAU_WALK", "LANDES_WALK", "LANDES_GENERIC"):
        m = re.search(nom + r"\s*[:=][^=]*?\[(.*?)\]", src, re.S)
        if not m:
            continue
        for img in re.findall(r'"(assets/[^"]+)"', m.group(1)):
            out.setdefault(img, REGLE_MARCHE[nom])
    # Les deux vues CONTEXTUELLES, retournées en dur par `pickWalkImage` : elles
    # ne sont dans aucun tableau, donc un balayage des pools les rate.
    for m in re.finditer(
        r'offered\.includes\("([^"]+)"\)\) return "(assets/[^"]+)"', src
    ):
        out[m.group(2)] = f"quand une des deux directions est « {m.group(1)} »"
    return [{"image": k, "regle": v} for k, v in out.items()]


def pool_images(src: str) -> set[str]:
    """Images des vues de MARCHE : ce sont des fallbacks de zone, jamais des
    images dédiées à une scène.

    ⚠️ Une seule définition, partagée avec `read_transitions` : l'ancienne
    version ne lisait que les TABLEAUX (`LANDES_WALK`…) et ratait les deux vues
    contextuelles retournées en dur par `pickWalkImage`. Conséquence mesurée :
    la Descente, qui emprunte `scene_landes_liaison_sud_c`, passait pour ayant
    son image propre — donc l'écran de sortie de zone n'apparaissait dans
    aucune liste de ce qui reste à produire.
    """
    return {t["image"] for t in read_transitions(src)}


def categorie(image: str | None, sid: str) -> str:
    if image:
        base = image.split("/")[-1]
        if base.startswith("monstre_"):
            return "monstre"
        if base.startswith("objet_"):
            return "objet"
    return "scene"


def classify(image: str | None, owners: dict[str, str], sid: str, pools: set[str]) -> tuple[str, str]:
    """Retourne (statut, source de l'héritage)."""
    if not image or image == PORTAL:
        return MANQUANTE, ""
    if image in pools:
        return FALLBACK, "pool de marche"
    owner = owners.get(image)
    if owner and owner != sid:
        return HERITEE, owner
    return DEDIEE, ""


def build_items() -> tuple[list[Item], dict, list[str]]:
    src = SCENE_TS.read_text(encoding="utf-8")
    scenes = read_scenes(src)
    pools = pool_images(src)
    meta = json.loads(META_JSON.read_text(encoding="utf-8"))["scenes"] if META_JSON.exists() else {}

    # Propriétaire d'une image : la scène dont l'id colle au nom du fichier.
    # Les autres qui l'affichent en HÉRITENT (typiquement les beats « -2 »).
    owners: dict[str, str] = {}
    for sc in scenes:
        img = sc["illustration"]
        if not img or img == PORTAL or img in pools:
            continue
        stem = img.split("/")[-1].rsplit(".", 1)[0]
        key = sc["id"].replace("-", "_")
        if key in stem and (img not in owners or len(sc["id"]) > len(owners[img])):
            owners[img] = sc["id"]
    # Une image affichée par une seule scène lui appartient, même sans
    # correspondance de nom (ex. monstre_juge_de_cendre_c sur serment-hameau).
    seen: dict[str, list[str]] = {}
    for sc in scenes:
        img = sc["illustration"]
        if img and img != PORTAL and img not in pools:
            seen.setdefault(img, []).append(sc["id"])
    for img, sids in seen.items():
        if img not in owners and len(sids) == 1:
            owners[img] = sids[0]

    verdicts = load_verdicts()

    items: list[Item] = []
    for sc in scenes:
        sid, img = sc["id"], sc["illustration"]
        statut, parent = classify(img, owners, sid, pools)
        m = meta.get(sid, {})
        notes = []
        if img and img != PORTAL and not (ASSETS / img.split("/", 1)[1]).exists():
            notes.append("FICHIER ABSENT DU DISQUE")
        v = verdicts.get(sid, {})
        items.append(
            Item(
                id=sid,
                kind="scene",
                image=img,
                statut=statut,
                parent=parent,
                description=m.get("description", ""),
                prompt=m.get("prompt_image", ""),
                categorie=categorie(img, sid),
                notes=notes,
                verdict=v.get("v", ""),
                verdict_note=v.get("note", ""),
            )
        )
        for poi in sc["pois"]:
            pimg = poi["illustration"]
            pstatut = DEDIEE if pimg else FALLBACK
            pnotes = []
            if pimg and not (ASSETS / pimg.split("/", 1)[1]).exists():
                pnotes.append("FICHIER ABSENT DU DISQUE")
            pv = verdicts.get(poi["id"], {})
            items.append(
                Item(
                    id=poi["id"],
                    kind="poi",
                    image=pimg,
                    statut=pstatut,
                    parent=sid,
                    description=(
                        "Élément que le héros va observer de près, en s'en approchant."
                        if pimg
                        else "Élément à observer — AUCUNE image dédiée : l'écran garde "
                        "l'image du lieu, il faut produire l'image de cet élément."
                    ),
                    prompt="",
                    categorie=categorie(pimg, poi["id"]),
                    notes=pnotes,
                    verdict=pv.get("v", ""),
                    verdict_note=pv.get("note", ""),
                )
            )
        # Les INTERACTIONS : une action qui porte une image est un écran à part
        # entière (le héros s'approche, et l'écran montre l'élément lui-même).
        for it in sc["interactions"]:
            iimg = it["illustration"]
            istatut, iparent = classify(iimg, owners, sid, pools)
            if istatut == DEDIEE:
                iparent = sid  # sa scène porteuse, pour le regroupement
            inotes = []
            if iimg and not (ASSETS / iimg.split("/", 1)[1]).exists():
                inotes.append("FICHIER ABSENT DU DISQUE")
            iv = verdicts.get(it["id"], {})
            items.append(
                Item(
                    id=it["id"],
                    kind="interaction",
                    image=iimg,
                    statut=istatut,
                    parent=iparent,
                    description=f"Action « {it['label']} » — ce que l'écran montre "
                    "quand le héros s'en approche.",
                    prompt="",
                    categorie=categorie(iimg, it["id"]),
                    notes=inotes,
                    verdict=iv.get("v", ""),
                    verdict_note=iv.get("note", ""),
                )
            )

    # Les écrans de MARCHE (transitions entre deux lieux).
    for tr in read_transitions(src):
        timg = tr["image"]
        tid = "marche:" + timg.split("/")[-1].rsplit(".", 1)[0]
        tnotes = []
        if not (ASSETS / timg.split("/", 1)[1]).exists():
            tnotes.append("FICHIER ABSENT DU DISQUE")
        tv = verdicts.get(tid, {})
        items.append(
            Item(
                id=tid,
                kind="transition",
                image=timg,
                statut=FALLBACK,
                parent="",
                description=f"Écran de marche — servi {tr['regle']}.",
                prompt="",
                categorie="scene",
                notes=tnotes,
                verdict=tv.get("v", ""),
                verdict_note=tv.get("note", ""),
            )
        )

    # ── Regroupement par zone puis par lieu ───────────────────────────────
    # Le lieu d'une carte : son id privé de son suffixe de beat (« -2 », « -3 »),
    # et pour un point d'intérêt celui de sa scène porteuse. La PREMIÈRE carte
    # d'un groupe (celle qui porte l'id nu) est la principale.
    zones, lieu_de, nom_de = zone_index()
    for i in items:
        if i.kind == "transition":
            # La marche n'appartient à aucun lieu — c'est justement ce qu'elle
            # est : l'entre-deux. Lui inventer un lieu serait un mensonge.
            i.group, i.zone, i.lieu, i.scene_nom = "marche", DEFAULT_ZONE, EN_CHEMIN, EN_CHEMIN
            continue
        base = i.parent if i.kind in ("poi", "interaction") else i.id
        i.group = re.sub(r"-\d+$", "", base)
        key = i.group.replace("_", "-")
        i.zone = zones.get(key, DEFAULT_ZONE)
        # Le LIEU réel : les données de zone d'abord, la table manuelle ensuite.
        i.lieu = lieu_de.get(key) or LIEU_MANUEL.get(key) or ERRANTS
        if i.lieu == ERRANTS and key in LIEU_MANUEL:
            i.lieu = LIEU_MANUEL[key]
        # Titre de la LIGNE : le nom lisible de la scène, pas son id technique.
        i.scene_nom = NOM_MANUEL.get(key) or nom_de.get(key) or key.replace("-", " ")
    seen_group: set[str] = set()
    for i in items:
        if i.kind == "scene" and i.group not in seen_group:
            seen_group.add(i.group)
            i.principale = True

    # Assets orphelins : présents sur disque, référencés NULLE PART.
    # ⚠️ « nulle part » se juge sur tout le code, pas seulement sur les champs
    # `illustration` de scène : une icône d'objet est référencée dans besace.ts,
    # et certaines vues de marche le sont directement dans `pickWalkImage`. Ne
    # regarder que les scènes produisait des orphelins fantômes.
    referenced = {i.image for i in items if i.image} | pools | {PORTAL}
    code_dirs = [SCENE_TS.parent, SCENE_TS.parent.parent / "components"]
    for d in code_dirs:
        for f in sorted(d.rglob("*.ts")) + sorted(d.rglob("*.tsx")):
            referenced |= set(re.findall(r'"(assets/[^"]+)"', f.read_text(encoding="utf-8")))
    for z in sorted(ZONES_DIR.glob("*.json")):
        referenced |= set(re.findall(r'"(assets/[^"]+)"', z.read_text(encoding="utf-8")))
    # Assets d'interface (logo, portrait du Geôlier, franges…) : jamais des
    # illustrations de scène, ils n'ont rien à faire dans les orphelins.
    UI = ("pactum_logo", "geolier_", "accueil_demon", "frange_", "croix_menu",
          "banner-edge", "bande_dissolution", "etat_", "dithering-demon")
    orphans = sorted(
        f"assets/{p.name}"
        for p in ASSETS.iterdir()
        if p.is_file()
        and p.suffix.lower() in (".png", ".jpg", ".jpeg", ".svg")
        and f"assets/{p.name}" not in referenced
        and not any(p.name.startswith(u) for u in UI)
    )

    counts = {
        "statut": {k: sum(1 for i in items if i.statut == k) for k in STATUT_LABEL},
        "categorie": {},
        "prompts_manquants": sum(1 for i in items if i.kind == "scene" and not i.prompt),
        "total": len(items),
        "scenes": sum(1 for i in items if i.kind == "scene"),
        "pois": sum(1 for i in items if i.kind == "poi"),
        "interactions": sum(1 for i in items if i.kind == "interaction"),
        "transitions": sum(1 for i in items if i.kind == "transition"),
        "a_remplacer": sum(1 for i in items if i.verdict == A_REMPLACER),
        "valides": sum(1 for i in items if i.verdict == OK),
        # ⚠️ Un avis dont l'écran a disparu depuis (une action coupée, un point
        # d'intérêt passé en narration). Il ne doit PAS s'évaporer en silence :
        # c'est du jugement de Patrick, et il porte souvent sur une image qui
        # dort maintenant en réserve — donc encore réutilisable, et encore
        # fausse. On les remonte pour qu'il décide.
        "verdicts_perimes": [
            {"id": k, "note": v.get("note", "")}
            for k, v in sorted(verdicts.items())
            if k not in {i.id for i in items}
        ],
    }
    for i in items:
        counts["categorie"][i.categorie] = counts["categorie"].get(i.categorie, 0) + 1
    return items, counts, orphans


# ────────────────────────────────────────────────────────────────────── rapport

CSS = """
:root{--charbon:#1c1a16;--orange:#e0632a;--blanc:#fff;--b50:rgba(255,255,255,.5);
--b20:rgba(255,255,255,.2)}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--charbon);color:var(--blanc);
font:13px/1.5 "Roboto Mono",ui-monospace,monospace;padding:26px 24px 36vh}
/* Le panneau #log est fixe en bas à droite (fidèle à la maquette) ; la
   maquette n'a qu'une quinzaine de cartes (jamais de recouvrement), mais ce
   rapport en a des dizaines — sans cette marge basse, les dernières cartes
   passeraient sous le panneau et deviendraient impossibles à cliquer. */
h1{font:400 32px/1 "Instrument Serif",Georgia,serif;letter-spacing:3px}
.sub{font-size:11px;color:var(--b50);margin-top:6px;letter-spacing:1px}
canvas.rule{display:block;width:100%;height:2px;image-rendering:pixelated;margin:14px 0}

/* ---------- compteurs (chiffre Instrument Serif + libellé capitales) ---------- */
.stats{display:flex;flex-wrap:wrap;gap:26px;margin:16px 0 4px}
.stat .n{font:400 30px/1 "Instrument Serif",Georgia,serif}
.stat .l{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--b50);margin-top:4px}
.stat.ok .n{color:var(--orange)}
.stat.ko .n{color:var(--blanc)}
.stat.mid .n{color:var(--b50)}

/* ---------- filtres — une seule rangée, statut + catégorie mélangés ---------- */
.filters{display:flex;gap:7px;flex-wrap:wrap;margin:18px 0 4px}
.filters button{background:none;border:1px solid var(--b20);color:var(--b50);
font-family:inherit;font-size:10px;letter-spacing:1px;text-transform:uppercase;
padding:7px 12px;cursor:pointer}
.filters button.on{background:var(--orange);border-color:var(--orange);color:var(--charbon)}

/* ---------- légende des statuts ---------- */
.legende{display:flex;flex-wrap:wrap;gap:8px 22px;margin-top:16px}
.leg{display:flex;align-items:center;gap:8px}
.leg .tag{position:static;top:auto;left:auto}
.leg-txt{font-size:10.5px;color:var(--b50)}

/* ---------- sections zone / lieu ---------- */
.zone{margin-top:34px}
.zone-head{display:flex;align-items:baseline;gap:12px;font:400 26px/1.2 "Instrument Serif",Georgia,serif;
letter-spacing:2px;margin:0 0 4px}
.zone-n{font:400 10px/1 "Roboto Mono",monospace;letter-spacing:1.5px;text-transform:uppercase;color:var(--b50)}
.lieu{margin-top:20px}
.lieu-head{display:flex;align-items:baseline;flex-wrap:wrap;gap:10px;
font:400 12px/1.2 "Roboto Mono",monospace;letter-spacing:1px;color:var(--blanc);margin:0}
.lieu-n{font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--b50)}
.lieu-warn{font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;
background:var(--blanc);color:var(--charbon);padding:2px 6px}
/* Un lieu / une ligne dont TOUTES les cartes sont filtrées se replie. */
.lieu.vide{display:none}
.zone.vide{display:none}
.ligne.vide{display:none}

/* ---------- une LIGNE = une scène : principale à gauche, variantes à droite ---------- */
.ligne{margin-top:16px;padding-left:12px;border-left:1px solid var(--b20)}
.ligne-head{display:flex;align-items:baseline;flex-wrap:wrap;gap:9px;margin:0 0 8px;
font:400 13px/1.2 "Roboto Mono",monospace;color:var(--blanc)}
.ligne-id{font-size:9.5px;color:var(--b20)}
.ligne-n{font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--b50)}
/* Rangée horizontale : elle défile dans son propre conteneur, le corps de page
   ne part JAMAIS en scroll latéral. */
.rangee{display:flex;gap:12px;align-items:flex-start;overflow-x:auto;padding-bottom:6px}
.rangee .card{flex:0 0 218px}
/* L'image principale de la scène : plus large, liseré orange. */
.rangee .card.principale{flex:0 0 248px;border-color:var(--orange)}

/* ---------- grille (orphelins, listes à plat) ---------- */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;margin-top:10px}
.card.principale{border-color:var(--orange)}
.card{border:1px solid var(--b20);padding:10px}
.card.drag{border-color:var(--orange)}
.card.hidden,.ocard.hidden{display:none!important}
.thumb{position:relative;width:100%;aspect-ratio:1/1;background:#000 center/cover no-repeat;
overflow:hidden;image-rendering:pixelated}
.thumb.none{display:flex;align-items:center;justify-content:center;
font-size:10px;letter-spacing:2px;color:var(--b20);text-transform:uppercase}
.tag{position:absolute;top:6px;left:6px;font-size:9px;letter-spacing:1.5px;
text-transform:uppercase;padding:3px 6px}
.tag.dediee{background:var(--orange);color:var(--charbon)}
.tag.heritee{background:none;color:var(--orange);box-shadow:inset 0 0 0 1px var(--orange)}
.tag.fallback{background:none;color:var(--b50);box-shadow:inset 0 0 0 1px var(--b20)}
.tag.manquante{background:var(--blanc);color:var(--charbon)}

/* ---------- verdict (jugement de QUALITÉ, distinct du statut) ----------
   Position et forme DIFFÉRENTES du badge de statut pour qu'on ne les confonde
   jamais : le statut est une puce en haut à gauche, le verdict une bande pleine
   largeur en bas de la vignette. */
.vbar{position:absolute;left:0;right:0;bottom:0;font-size:9px;letter-spacing:1.5px;
text-transform:uppercase;padding:4px 6px;text-align:center}
.vbar.a_remplacer{background:var(--blanc);color:var(--charbon)}
.vbar.ok{background:var(--orange);color:var(--charbon)}
.card.a_remplacer{border-color:var(--blanc)}
.vnote{font-size:10px;color:var(--blanc);margin-top:5px;line-height:1.4}
.verdict{display:flex;gap:5px;margin-top:8px}
.verdict button{flex:1;background:none;border:1px solid var(--b20);color:var(--b50);
font:inherit;font-size:10px;letter-spacing:.5px;padding:6px 4px;cursor:pointer}
.verdict button:hover{border-color:var(--b50);color:var(--blanc)}
.verdict button.on-ko{background:var(--blanc);border-color:var(--blanc);color:var(--charbon)}
.verdict button.on-ok{background:var(--orange);border-color:var(--orange);color:var(--charbon)}
/* Le pont marquage → moi : c'est l'action principale de la version web, donc
   c'est le seul bloc plein orange de la page. */
.copybar{display:block;width:100%;margin-top:16px;background:var(--orange);
border:none;color:var(--charbon);font:inherit;font-size:12px;letter-spacing:1px;
padding:12px;cursor:pointer;text-align:center}
.copybar:hover{filter:brightness(1.08)}
/* Second bouton : même action, sortie plus courte — donc secondaire. */
.copybar-2{margin-top:8px;background:none;color:var(--b50);
box-shadow:inset 0 0 0 1px var(--b20);font-size:11px;padding:9px}
.copybar-2:hover{color:var(--blanc);filter:none}

.cat{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--b50);margin-top:9px}
.id{font-size:12px;margin-top:2px;word-break:break-all;display:flex;align-items:flex-start;gap:6px}
.id .poi{color:var(--b50)}
/* ---------- icônes de rôle (grammaire du panneau de calques Figma) ----------
   4 losanges = le COMPOSANT, c'est-à-dire l'image principale de la scène ;
   1 losange creux = une VARIANTE. Même code visuel que Figma, donc lisible
   sans avoir à lire l'étiquette (demande Patrick 26/07). */
.ico{flex:0 0 14px;width:14px;height:14px;margin-top:1px}
.ico.principale{color:var(--orange)}
.ico.variante{color:var(--b50)}
.ligne-head .ico{margin-top:0;transform:translateY(2px)}
.meta{font-size:10px;color:var(--b50);margin-top:3px;min-height:2.4em}
.desc{font-size:10.5px;color:var(--b50);line-height:1.45;margin-top:2px}
.warn{font-size:10px;color:var(--blanc);letter-spacing:.5px;margin-top:4px}
.act{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.act button{background:none;border:1px solid var(--b20);color:var(--b50);
font:inherit;font-size:10.5px;padding:4px 8px;cursor:pointer}
.act button:hover{border-color:var(--orange);color:var(--orange)}
.act .todo{border-style:dashed;cursor:default;color:var(--b20)}

select{width:100%;margin-top:8px;background:var(--charbon);color:var(--blanc);
border:1px solid var(--b20);font-family:inherit;font-size:11px;padding:6px}
.drop{margin-top:6px;border:1px dashed var(--b20);color:var(--b50);
font-size:10px;letter-spacing:1px;text-align:center;padding:8px;cursor:pointer}
.drop.on{border-color:var(--orange);color:var(--orange)}
.detach{background:none;border:none;color:var(--b50);font-family:inherit;font-size:10px;
text-decoration:underline;text-underline-offset:3px;cursor:pointer;margin-top:7px;padding:0}
.detach:hover{color:var(--orange)}

/* ---------- orphelins ---------- */
h2{font:400 20px/1.2 "Instrument Serif",Georgia,serif;letter-spacing:2px;margin-top:34px}
.orph{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px}
.orph > div{border:1px solid var(--b20);padding:6px 10px;font-size:11px;color:var(--b50)}
.ocard{width:132px;margin:0}
.ocard .thumb{width:132px;height:132px}
.ocard figcaption{margin-top:5px;font-size:9.5px;line-height:1.35;color:var(--b50);word-break:break-all}

/* ---------- fraîcheur : à quel instant correspond ce que je regarde ---------- */
.fraicheur{display:flex;flex-wrap:wrap;gap:18px;margin:14px 0 0;font-size:10.5px;
  letter-spacing:.6px;text-transform:uppercase;color:var(--b50)}
.fraicheur b{color:var(--cream);font-weight:400}
.fraicheur .perime{color:var(--orange)}

/* ---------- pastille de hash sur la vignette ----------
   Diagnostic pur : deux vignettes au même hash sont le MÊME fichier réutilisé.
   Posée en bas à droite pour ne pas heurter la puce de statut (haut gauche). */
.thumb{position:relative}
.hash{position:absolute;right:5px;bottom:5px;padding:2px 4px;font-size:9px;
  letter-spacing:.5px;background:var(--charbon);color:var(--b50);
  border:1px solid var(--b20);pointer-events:none}
.hash.neuf{color:var(--charbon);background:var(--orange);border-color:var(--orange)}
.thumb.introuvable{background:var(--cream);color:var(--charbon);font-weight:700;
  display:flex;align-items:center;justify-content:center;text-align:center;
  font-size:10px;letter-spacing:1px;padding:8px}

/* ---------- instructions de pipeline ---------- */
.log-static{margin-top:12px;font-size:11.5px;color:var(--b50)}
.log-static ol{padding-left:20px}
.log-static code{color:var(--orange)}

#toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);
background:var(--orange);color:var(--charbon);padding:9px 16px;font-size:12px;
letter-spacing:.5px;opacity:0;transition:opacity .2s;pointer-events:none;z-index:11}
#toast.on{opacity:1}

/* ---------- agrandi : l'image ORIGINALE, pleine résolution ----------
   C'est le cœur de l'usage (juger si une image marche), donc on sert le PNG
   1000×1000 tel quel, jamais une vignette rééchantillonnée. */
.thumb{cursor:zoom-in}
#zoom{position:fixed;inset:0;background:rgba(10,9,7,.95);display:none;
align-items:center;justify-content:center;flex-direction:column;gap:12px;
padding:24px;cursor:zoom-out;z-index:9}
#zoom.on{display:flex}
#zoom img{max-width:min(92vw,900px);max-height:80vh;image-rendering:pixelated;
border:1px solid var(--b20)}
#zoom .cap{font-size:11px;color:var(--b50);letter-spacing:1px;text-align:center}
#zoom .cap b{color:var(--orange);font-weight:400}

/* ---------- journal d'écriture — panneau fixe, jamais une popup ---------- */
#log{position:fixed;right:0;bottom:0;width:340px;max-height:34vh;overflow-y:auto;
background:var(--charbon);border-top:1px solid var(--b20);border-left:1px solid var(--b20);
padding:10px 12px;font-size:10px;color:var(--b50)}
#log b{color:var(--orange);font-weight:400}
#log .hd{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--b50);margin-bottom:6px}
"""

JS = """
"use strict";

/* ---------- séparateur tramé (jamais un filet net — règle DA) ---------- */
function rule(cv){
  const w=cv.clientWidth; cv.width=w; cv.height=2;
  const x=cv.getContext("2d");
  for(let i=0;i<w;i++){
    if(Math.random()<.7){x.fillStyle="rgba(255,255,255,.26)";x.fillRect(i,0,1,1);}
    if(Math.random()<.13){x.fillStyle="rgba(255,255,255,.14)";x.fillRect(i,1,1,1);}
  }
}
addEventListener("load",()=>document.querySelectorAll("canvas.rule").forEach(rule));

/* ---------- filtres — une rangée unique, statut + catégorie ---------- */
let filter="tous";

/* Images utilisées par PLUS D'UNE carte. Calculé sur `data-img` (le nom de
   fichier), pas sur le hash : deux noms différents au même contenu, c'est un
   doublon de FICHIER (le manifeste le signale à la génération) ; le même nom
   sur deux scènes, c'est une image RÉUTILISÉE — et c'est ça qu'on veut voir
   ici, pour distinguer les réemplois voulus des oublis. */
const usages={};
document.querySelectorAll(".card[data-img]").forEach(c=>{
  const n=c.dataset.img; if(!n)return; usages[n]=(usages[n]||0)+1;
});
document.querySelectorAll(".card[data-img]").forEach(c=>{
  if(usages[c.dataset.img]>1) c.dataset.doublon="1";
});

function applyFilter(){
  document.querySelectorAll(".card").forEach(c=>{
    const ok=filter==="tous"||c.dataset.statut===filter||c.dataset.cat===filter
      ||c.dataset.verdict===filter
      ||(filter==="doublons"&&c.dataset.doublon==="1")
      ||(filter==="neuf"&&c.dataset.neuf==="1")
      ||(filter==="introuvable"&&c.dataset.introuvable==="1");
    c.classList.toggle("hidden",!ok);
  });
  // La RÉSERVE suit les mêmes filtres quand ils la concernent, et disparaît
  // sinon : un orphelin n'a ni statut, ni catégorie, ni verdict.
  document.querySelectorAll(".ocard").forEach(o=>{
    const ok=filter==="tous"||(filter==="neuf"&&o.dataset.neuf==="1");
    o.classList.toggle("hidden",!ok);
  });
  // Replier lignes, puis lieux, puis zones dont plus aucune carte n'est
  // visible : sinon le filtre laissait des titres vides partout.
  document.querySelectorAll(".ligne").forEach(r=>{
    r.classList.toggle("vide",!r.querySelector(".card:not(.hidden)"));
  });
  document.querySelectorAll(".lieu").forEach(l=>{
    l.classList.toggle("vide",!l.querySelector(".card:not(.hidden)"));
  });
  document.querySelectorAll(".zone").forEach(z=>{
    z.classList.toggle("vide",!z.querySelector(".lieu:not(.vide)"));
  });
}
document.getElementById("filters").onclick=e=>{
  const b=e.target.closest("button"); if(!b)return;
  document.querySelectorAll("#filters button").forEach(x=>x.classList.remove("on"));
  b.classList.add("on"); filter=b.dataset.f; applyFilter();
};

/* Le manifeste SERVI, avec un cache-buster : c'est la seule façon de savoir si
   cette page est à jour ou si je regarde une version plus vieille que les
   assets. Le service worker du jeu a pour portée tout /Pat/aldenhar/ — cette
   page est dedans, donc sans le `?t=` on relirait le manifeste en cache, ce
   qui viderait le contrôle de tout son sens. */
(async function fraicheurLive(){
  const el=document.getElementById("fr-live"); if(!el)return;
  try{
    const r=await fetch("assets/manifest.json?t="+Date.now(),{cache:"no-store"});
    if(!r.ok)return;
    const m=await r.json();
    const cuit=document.getElementById("fraicheur").textContent;
    if(m.commit && !cuit.includes(m.commit)){
      el.className="perime";
      el.textContent="⚠ les assets ont bougé depuis (commit "+m.commit+") — recharge après le prochain déploiement";
    }else{
      el.textContent="à jour";
    }
  }catch(_){}
})();

function toast(m){const t=document.getElementById('toast');t.textContent=m;
  t.classList.add('on');setTimeout(()=>t.classList.remove('on'),1800);}

/* ---------- agrandi sur l'image d'origine (pleine résolution) ---------- */
const zoom=document.getElementById("zoom");
const zoomImg=zoom.querySelector("img"), zoomCap=zoom.querySelector(".cap");
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-zoom]"); if(!t)return;
  zoomImg.src=t.dataset.zoom;            // le serveur renvoie le PNG 1000×1000
  zoomCap.innerHTML=t.dataset.zoom.replace("assets/","")+
    ' — <b>'+(t.dataset.zoomId||"")+"</b> · Échap ou clic pour fermer";
  zoom.classList.add("on");
});
function closeZoom(){zoom.classList.remove("on");zoomImg.src="";}
zoom.addEventListener("click",closeZoom);
addEventListener("keydown",e=>{if(e.key==="Escape")closeZoom();});

/* ---------- verdict de qualité ————————————————————————————————
   Contrairement au câblage, un verdict ne change le statut d'AUCUNE autre
   carte : pas besoin de recharger la page, on met à jour sur place.

   Deux façons de le ranger selon le mode :
   • outil local  → POST /api/verdict, écrit dans un JSON suivi par git
   • version web  → localStorage, donc PROPRE AU NAVIGATEUR. Un lien ne peut pas
     écrire dans le dépôt ; le bouton « copier la liste » sert de pont (coller
     dans un message ou dans Notion). C'est une limite du web, pas un oubli. */
const VKEY="pactum-verdicts";
function webVerdicts(){
  try{return JSON.parse(localStorage.getItem(VKEY)||"{}");}catch{return {};}
}
async function persistVerdict(id,verdict,note){
  if(window.__COVERAGE_WEB__){
    const all=webVerdicts();
    if(verdict){all[id]={v:verdict};if(note)all[id].note=note;}else{delete all[id];}
    localStorage.setItem(VKEY,JSON.stringify(all));
    return;
  }
  const r=await fetch("/api/verdict",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id,verdict,note})});
  const j=await r.json();
  if(!j.ok)throw new Error(j.error||"échec");
}
/* ⚠️ Sélecteur volontairement précis : la CARTE porte aussi `data-verdict`
   (le filtre en a besoin). Un `[data-verdict]` nu attacherait le gestionnaire
   à la carte ET au bouton — le clic remonterait à la carte, qui se relancerait
   avec un verdict vide et effacerait aussitôt le marquage. */
document.querySelectorAll(".verdict button[data-verdict]").forEach(btn=>{
  btn.addEventListener("click",async()=>{
    const id=btn.dataset.verdict, want=btn.dataset.v;
    const card=btn.closest(".card");
    const already=btn.classList.contains("on-ko")||btn.classList.contains("on-ok");
    const verdict=already?"":want;      // recliquer le même bouton retire l'avis
    let note="";
    if(verdict==="a_remplacer"){
      note=prompt("Pourquoi elle ne marche pas ? (facultatif)","")||"";
    }
    try{
      await persistVerdict(id,verdict,note);
      applyVerdict(card,verdict,note);
      log(`<b>verdict</b> · ${id} → `+(verdict||"avis retiré")+
        (note?` (« ${note} »)`:""));
      toast(verdict==="a_remplacer"?"Marquée à remplacer":
            verdict==="ok"?"Marquée bonne":"Avis retiré");
    }catch(e){log(`<span style="color:#fff">ÉCHEC verdict</span> · ${id} · ${e.message}`);}
  });
});

/* En mode web, les marquages du navigateur sont réappliqués au chargement, et
   « copier la liste » les sort en texte lisible pour les rapatrier. */
if(window.__COVERAGE_WEB__){
  const stored=webVerdicts();
  for(const [id,v] of Object.entries(stored)){
    const btn=document.querySelector(
      `.verdict button[data-verdict="${CSS.escape(id)}"]`);
    const card=btn&&btn.closest(".card");
    if(card)applyVerdict(card,v.v,v.note||"");
  }
  /* ---------- « Générer les prompts » ------------------------------------
     Pour chaque carte marquée à remplacer, un bloc prêt à me coller : le lieu,
     la scène, le rôle de l'image dans sa ligne, la description, la raison du
     rejet, le nom de fichier attendu, et surtout l'IMAGE PRINCIPALE de la
     ligne en RÉFÉRENCE — c'est elle qui tient la cohérence de décor et de
     personnage entre l'image principale et ses variantes. */
  async function toClipboard(txt){
    try{await navigator.clipboard.writeText(txt);}
    catch{
      const ta=document.createElement("textarea");ta.value=txt;
      document.body.append(ta);ta.select();document.execCommand("copy");ta.remove();
    }
  }
  const gp=document.getElementById("copy-prompts");
  if(gp)gp.addEventListener("click",async()=>{
    const all=webVerdicts();
    const ids=Object.entries(all).filter(([,v])=>v.v==="a_remplacer").map(([id])=>id);
    if(!ids.length){toast("Rien n'est marqué à remplacer");return;}
    let out="Images à refaire — couverture visuelle PACTUM\\n";
    out+=ids.length+" image(s). Pour chacune : garder la référence visuelle "
      +"indiquée (même décor, même lumière, même personnage), ne changer que "
      +"ce que dit « à produire ».\\n";
    let n=0;
    for(const id of ids){
      const card=document.querySelector(`.card[data-p-id="${CSS.escape(id)}"]`);
      if(!card)continue;
      n++;
      const d=card.dataset;
      out+="\\n────────────────────────────────\\n";
      out+=`${n}. ${d.pFichier}\\n`;
      out+=`   lieu      : ${d.pLieu}\\n`;
      out+=`   scène     : ${d.pScene}  (${d.pId})\\n`;
      out+=`   rôle      : ${d.pRole}\\n`;
      // Le message dépend du RÔLE, pas d'une comparaison de fichiers : quand
      // une variante réutilise encore l'image principale (le cas le plus
      // fréquent aujourd'hui), comparer les fichiers disait « c'est elle-même »
      // — vrai au fichier près, mais trompeur.
      const memeFichier = d.pRef && d.pRef.endsWith(d.pFichier);
      if(d.pRole==="principale")
        out+=`   référence : c'est l'image principale de la ligne — la refaire redéfinit le décor de ses variantes\\n`;
      else if(d.pRef)
        out+=`   référence : ${d.pRef}   ← garder ce décor, cette lumière, ce personnage`
          +(memeFichier?"   (la variante réutilise encore cette image, d'où le besoin)":"")+"\\n";
      if(d.pRefdesc)out+=`   la principale montre : ${d.pRefdesc}\\n`;
      if(d.pDesc)out+=`   à produire: ${d.pDesc}\\n`;
      if(d.pRefdesc)out+="   ⚠ dire en UNE image ce qui change par rapport à la principale\\n";
      const note=(all[id]||{}).note;
      if(note)out+=`   pourquoi la remplacer : ${note}\\n`;
    }
    await toClipboard(out);
    toast(n+" prompt(s) copié(s)");
    log("<b>prompts générés</b> · "+n+" image(s) à refaire");
  });

  const cp=document.getElementById("copy-verdicts");
  if(cp)cp.addEventListener("click",async()=>{
    const all=webVerdicts();
    const ko=Object.entries(all).filter(([,v])=>v.v==="a_remplacer");
    const ok=Object.entries(all).filter(([,v])=>v.v==="ok");
    if(!ko.length&&!ok.length){toast("Rien de marqué");return;}
    let txt="Couverture visuelle — mes marquages\\n";
    if(ko.length){txt+="\\nÀ REMPLACER\\n"+ko.map(([id,v])=>
      "- "+id+(v.note?" : "+v.note:"")).join("\\n")+"\\n";}
    if(ok.length){txt+="\\nÇA MARCHE\\n"+ok.map(([id])=>"- "+id).join("\\n")+"\\n";}
    try{await navigator.clipboard.writeText(txt);toast("Liste copiée");}
    catch{
      const ta=document.createElement("textarea");ta.value=txt;
      document.body.append(ta);ta.select();document.execCommand("copy");
      ta.remove();toast("Liste copiée");
    }
    log("<b>liste copiée</b> · "+ko.length+" à remplacer, "+ok.length+" validées");
  });
}
function applyVerdict(card,verdict,note){
  card.dataset.verdict=verdict;
  card.classList.toggle("a_remplacer",verdict==="a_remplacer");
  const thumb=card.querySelector(".thumb");
  let bar=thumb&&thumb.querySelector(".vbar");
  if(verdict&&thumb){
    if(!bar){bar=document.createElement("span");thumb.appendChild(bar);}
    bar.className="vbar "+verdict;
    bar.textContent=verdict==="a_remplacer"?"à remplacer":"validée";
  }else if(bar){bar.remove();}
  let nEl=card.querySelector(".vnote");
  if(verdict==="a_remplacer"&&note){
    if(!nEl){nEl=document.createElement("p");nEl.className="vnote";
      card.querySelector(".verdict").before(nEl);}
    nEl.textContent="⚠ "+note;
  }else if(nEl){nEl.remove();}
  card.querySelectorAll("[data-verdict]").forEach(b=>{
    b.classList.remove("on-ko","on-ok");
    if(b.dataset.v===verdict)b.classList.add(verdict==="a_remplacer"?"on-ko":"on-ok");
  });
  refreshVerdictCounts();
}
function refreshVerdictCounts(){
  const all=[...document.querySelectorAll(".card")];
  const n=v=>all.filter(c=>c.dataset.verdict===v).length;
  const a=document.getElementById("n-remplacer"), b=document.getElementById("n-valides");
  if(a)a.textContent=n("a_remplacer");
  if(b)b.textContent=n("ok");
}
document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=async()=>{
  try{await navigator.clipboard.writeText(b.dataset.prompt);toast('Prompt copié');}
  catch{const t=document.createElement('textarea');t.value=b.dataset.prompt;
    document.body.append(t);t.select();document.execCommand('copy');t.remove();
    toast('Prompt copié');}});

/* ---------- journal d'écriture — persistant (localStorage), jamais une popup.
   Une action écrit sur le disque puis recharge la page (les statuts d'AUTRES
   cartes peuvent changer — une image détachée peut redonner une carte à
   "manquante" ailleurs — donc seul un recalcul serveur complet est fiable).
   Le journal survit au reload en passant par localStorage. */
const LOG_KEY="pactum-coverage-log";
function loadLog(){try{return JSON.parse(localStorage.getItem(LOG_KEY)||"[]");}catch{return [];}}
function renderLog(){
  const body=document.getElementById("logbody");
  const entries=loadLog();
  body.innerHTML=entries.length
    ? entries.map(e=>`<div>${e.t} — ${e.msg}</div>`).join("")
    : "En attente d'une action…";
}
function log(msg){
  const entries=loadLog();
  entries.unshift({t:new Date().toLocaleTimeString("fr-FR"),msg});
  localStorage.setItem(LOG_KEY,JSON.stringify(entries.slice(0,60)));
  renderLog();
}
renderLog();

/* ——— Édition inline (mode --serve seulement) ————————————————————————
   Trois voies directement sur la carte, comme la maquette : un <select> pour
   rattacher un asset déjà tramé, une zone de glisser-déposer pour importer un
   fichier brut (passe par le dithering canonique avant assets/), et un lien
   « détacher » (dédiées uniquement) qui retire l'image dédiée. */
if(window.__COVERAGE_EDITABLE__){
  async function post(url,body){
    const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify(body)});
    const j=await r.json();
    if(!j.ok)throw new Error(j.error||"échec");
    return j;
  }
  async function afterWrite(msg){
    log(msg);
    await new Promise(res=>setTimeout(res,400));
    location.reload();
  }

  fetch("/api/assets").then(r=>r.json()).then(assets=>{
    document.querySelectorAll("[data-select]").forEach(sel=>{
      const cur=sel.dataset.current||"";
      let opts='<option value="">— aucune (hérite / fallback) —</option>';
      for(const a of assets) opts+=`<option${a===cur?" selected":""}>${a}</option>`;
      sel.innerHTML=opts;
    });
  });

  document.querySelectorAll("[data-select]").forEach(sel=>{
    sel.addEventListener("change",async()=>{
      const id=sel.dataset.select, poi=sel.dataset.poi==="1", asset=sel.value;
      try{
        const j=await post("/api/wire",{id,asset,poi});
        await afterWrite(`<b>${poi?"point d'intérêt":"scène"}</b> · ${id} → `+
          (asset?asset:"détaché")+` (écrit : ${j.touched.join(", ")})`);
      }catch(e){log(`<span style="color:#fff">ÉCHEC</span> · ${id} · ${e.message}`);}
    });
  });

  document.querySelectorAll("[data-drop]").forEach(dz=>{
    const card=dz.closest(".card");
    dz.ondragover=e=>{e.preventDefault();dz.classList.add("on");card.classList.add("drag");};
    dz.ondragleave=()=>{dz.classList.remove("on");card.classList.remove("drag");};
    dz.ondrop=async e=>{
      e.preventDefault();dz.classList.remove("on");card.classList.remove("drag");
      const f=e.dataTransfer.files[0]; if(!f)return;
      const id=dz.dataset.drop, poi=dz.dataset.poi==="1";
      const name=prompt("Nom du fichier dans assets/ :",dz.dataset.defaultName);
      if(!name)return;
      const data=await new Promise(res=>{const fr=new FileReader();
        fr.onload=()=>res(fr.result);fr.readAsDataURL(f);});
      try{
        const j=await post("/api/import",{id,poi,name,data});
        await afterWrite(`<b>dithering</b> → <b>${j.asset}</b> · ${id} `+
          `(Floyd-Steinberg 182 / 151%, écrit : ${j.touched.join(", ")})`);
      }catch(e){log(`<span style="color:#fff">ÉCHEC import</span> · ${id} · ${e.message}`);}
    };
  });

  document.querySelectorAll("[data-detach]").forEach(btn=>{
    btn.addEventListener("click",async()=>{
      const id=btn.dataset.detach, poi=btn.dataset.poi==="1";
      try{
        const j=await post("/api/wire",{id,asset:"",poi});
        await afterWrite(`<b>détaché</b> · ${id} (écrit : ${j.touched.join(", ")})`);
      }catch(e){log(`<span style="color:#fff">ÉCHEC</span> · ${id} · ${e.message}`);}
    });
  });
}
"""


def esc(s: str) -> str:
    return (
        s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
    )


# Étiquettes de catégorie pour le filtre (accord/majuscule) — la maquette de
# référence catégorise par rôle narratif (lieu/rencontre/creature/liaison),
# mais ce rôle n'existe pas proprement dans les données parsées : une liaison
# n'est jamais une entrée statique de SCENES[], elle est générée à l'exécution
# par `makeLiaison()` — il n'y a donc rien à lister sous ce nom. On garde la
# catégorisation par TYPE D'IMAGE (scene/monstre/objet) déjà en place : c'est
# elle qui pilote la recette de prompt Leonardo (portrait vs paysage) dans
# data/scene-meta.json, donc ce qui compte réellement pour le pipeline.
CAT_LABEL = {"scene": "Scènes", "monstre": "Monstres", "objet": "Objets"}


def render(
    items: list[Item], counts: dict, orphans: list[str], editable: bool, web: bool = False
) -> str:
    # Image de référence par ligne = l'image de la carte PRINCIPALE. Injectée
    # dans chaque prompt pour que les variantes partagent le décor, la lumière
    # et le personnage de l'image principale.
    ref_image = {i.group: (i.image or "") for i in items if i.principale and i.image}
    # La description de l'image principale part aussi dans le prompt : sans
    # elle, « selon l'issue, il rentre ou s'assied » ne dit pas EN QUOI la
    # variante diffère de la principale (retour Patrick 26/07).
    ref_desc = {i.group: i.description for i in items if i.principale}
    # `web` = version déployée sur GitHub Pages, posée à côté du jeu dans
    # aldenhar/ : les assets y sont DÉJÀ publics, donc on les référence en
    # relatif (aucun réencodage, les PNG 1000×1000 d'origine sont servis tels
    # quels). Pas d'édition possible — un lien n'écrit pas sur le disque — mais
    # le marquage de qualité fonctionne, rangé dans le navigateur.
    rel = "" if web else "../aldenhar/public/"

    MANIF = load_manifest().get("fichiers", {})

    def card(i: Item) -> str:
        basename = i.image.split("/", 1)[1] if i.image else ""
        fiche = MANIF.get(basename) if basename else None
        h = fiche["hash"] if fiche else ""
        # Le hash DANS l'URL : un fichier modifié sous le même nom change d'URL,
        # donc aucun cache (navigateur ou service worker) ne peut servir
        # l'ancienne version. C'est la cure ; la pastille ci-dessous n'est que
        # le diagnostic.
        ver = f"?v={h}" if h else ""
        if i.image and not fiche:
            # Câblé vers un fichier ABSENT du manifeste : c'est la cause la plus
            # probable d'une « image fantôme ». Ça doit crier.
            thumb_open = '<div class="thumb none introuvable">'
            thumb_inner = "FICHIER INTROUVABLE"
        elif i.image:
            # data-zoom pointe sur l'image D'ORIGINE (pleine résolution) : c'est
            # ce qu'on veut regarder pour juger si elle marche.
            pastille = f'<span class="hash{" neuf" if fiche and fiche.get("recent") else ""}">{h}</span>' if h else ""
            thumb_open = (
                f'<div class="thumb" style="background-image:url(\'{rel}{i.image}{ver}\')"'
                f' data-zoom="{rel}{i.image}{ver}" data-zoom-id="{esc(i.id)}"'
                f' title="Agrandir — {esc(basename)}">'
            )
            thumb_inner = pastille
        else:
            thumb_open = '<div class="thumb none">'
            thumb_inner = "AUCUNE IMAGE"
        tag = f'<span class="tag {i.statut}">{STATUT_LABEL[i.statut]}</span>'
        if i.verdict:
            vlabel = "à remplacer" if i.verdict == A_REMPLACER else "validée"
            tag += f'<span class="vbar {i.verdict}">{vlabel}</span>'

        parent_html = (
            f' <span class="poi">← {esc(i.parent)}</span>'
            if i.kind in ("poi", "interaction") and i.parent
            else ""
        )
        if i.statut == HERITEE:
            meta = f'hérite de <b>{esc(i.parent)}</b>'
        elif i.statut == FALLBACK:
            meta = "ambiance générique de zone"
        elif i.statut == MANQUANTE:
            meta = "aucune image ni héritage"
        else:
            meta = esc(basename)

        desc = f'<div class="desc">{esc(i.description)}</div>' if i.description else ""
        warn = "".join(f'<div class="warn">⚠ {esc(n)}</div>' for n in i.notes)

        # Les prompts Leonardo ne partent PAS sur la version publique : ce sont
        # les recettes de génération, la seule vraie matière sensible ici (les
        # illustrations, elles, sont déjà servies publiquement par le jeu).
        acts = []
        if i.kind == "scene" and not web:
            if i.prompt:
                acts.append(f'<button data-prompt="{esc(i.prompt)}">Copier le prompt Leonardo</button>')
            else:
                acts.append('<button class="todo" disabled>prompt à écrire</button>')
        act_html = f'<div class="act">{"".join(acts)}</div>' if acts else ""

        edit_html = ""
        if editable:
            poi_flag = "1" if i.kind == "poi" else "0"
            default_name = basename or f"{i.categorie}_{i.id.replace('-', '_')}.png"
            detach_html = (
                f'<button class="detach" data-detach="{esc(i.id)}" data-poi="{poi_flag}">détacher</button>'
                if i.statut == DEDIEE
                else ""
            )
            edit_html = (
                f'<select data-select="{esc(i.id)}" data-poi="{poi_flag}" '
                f'data-current="{esc(i.image or "")}"></select>'
                f'<div class="drop" data-drop="{esc(i.id)}" data-poi="{poi_flag}" '
                f'data-default-name="{esc(default_name)}">glisser une image ici</div>'
                f"{detach_html}"
            )

        vnote = (
            f'<p class="vnote">⚠ {esc(i.verdict_note)}</p>'
            if i.verdict == A_REMPLACER and i.verdict_note
            else ""
        )
        verdict_html = ""
        # Le marquage existe dans les DEUX modes : c'est la raison d'être de la
        # version web (juger), là où l'édition de câblage, elle, reste locale.
        #
        # ⚠️ Un SEUL bouton (26/07) : « ça marche » est retiré — ne pas toucher
        # une carte vaut déjà approbation, un second bouton ne demandait qu'un
        # clic de plus pour dire la même chose. Le verdict OK reste géré côté
        # code pour ne pas perdre les marquages déjà enregistrés.
        if (editable or web) and i.image:
            ko_on = " on-ko" if i.verdict == A_REMPLACER else ""
            verdict_html = (
                f'<div class="verdict">'
                f'<button class="{ko_on.strip()}" data-verdict="{esc(i.id)}" '
                f'data-v="{A_REMPLACER}">à remplacer</button>'
                f"</div>"
            )

        # Données embarquées pour la génération de prompts : la carte porte tout
        # ce qu'il faut, y compris l'IMAGE PRINCIPALE de sa scène — c'est elle
        # qui garantit la cohérence de décor et de personnage entre variantes
        # (demande Patrick 26/07).
        prompt_data = (
            f' data-p-id="{esc(i.id)}"'
            f' data-p-lieu="{esc(i.lieu)}"'
            f' data-p-scene="{esc(i.scene_nom)}"'
            f' data-p-role="{"principale" if i.principale else ROLE_KIND.get(i.kind, "variante")}"'
            f' data-p-desc="{esc(i.description)}"'
            f' data-p-fichier="{esc(basename or (i.categorie + "_" + i.id.replace("-", "_") + "_a.png"))}"'
            f' data-p-ref="{esc(ref_image.get(i.group, ""))}"'
            f' data-p-refdesc="{esc("" if i.principale else ref_desc.get(i.group, ""))}"'
        )
        card_cls = "card" + (" a_remplacer" if i.verdict == A_REMPLACER else "")
        if i.principale:
            card_cls += " principale"
        # Étiquette de rôle : c'est ce qui manquait pour distinguer l'image du
        # lieu de ses variantes (retour Patrick 26/07).
        role = (
            "image du lieu"
            if i.principale
            # « plan rapproché » est abandonné (26/07) : ce n'est plus un zoom
            # dans l'image du lieu, le héros se déplace et l'écran montre
            # l'élément lui-même.
            else ROLE_KIND.get(i.kind, "autre moment du lieu")
        )
        # Icône de rôle à gauche du nom : composant (4 losanges) pour l'image
        # principale, variante (losange creux) pour les autres — grammaire Figma.
        ico = ICON_PRINCIPALE if i.principale else ICON_VARIANTE
        neuf = "1" if fiche and fiche.get("recent") else "0"
        introuvable = "1" if (i.image and not fiche) else "0"
        return f"""<article class="{card_cls}" data-statut="{i.statut}" data-cat="{i.categorie}" data-kind="{i.kind}" data-verdict="{i.verdict}" data-img="{esc(basename)}" data-hash="{h}" data-neuf="{neuf}" data-introuvable="{introuvable}"{prompt_data}>
  {thumb_open}{thumb_inner}{tag}</div>
  <div class="cat">{i.categorie} · {role}</div>
  <div class="id">{ico}<span>{esc(i.id)}{parent_html}</span></div>
  <div class="meta">{meta}</div>
  {desc}
  {warn}
  {vnote}
  {verdict_html}
  {act_html}
  {edit_html}
</article>"""

    stats = f"""
<div class="stat ok"><div class="n">{counts["statut"][DEDIEE]}</div><div class="l">ont leur image</div></div>
<div class="stat"><div class="n" style="color:var(--orange)">{counts["statut"][HERITEE]}</div><div class="l">image empruntée</div></div>
<div class="stat mid"><div class="n">{counts["statut"][FALLBACK]}</div><div class="l">vue générique</div></div>
<div class="stat ko"><div class="n">{counts["statut"][MANQUANTE]}</div><div class="l">aucune image</div></div>
<div class="stat ko"><div class="n" id="n-remplacer">{counts["a_remplacer"]}</div><div class="l">à remplacer</div></div>
<div class="stat mid"><div class="n">{len(orphans)}</div><div class="l">orphelins</div></div>
<div class="stat mid"><div class="n">{counts["prompts_manquants"]}</div><div class="l">prompts à écrire</div></div>
"""

    # ── Sections : une par ZONE, puis un bloc par LIEU ────────────────────
    # Le lieu porte son nom et son compte ; sa carte principale vient en tête,
    # ses variantes derrière. C'est ce qui rend lisible « quelle est l'image
    # principale, quelles sont ses variantes » (retour Patrick 26/07).
    # Hiérarchie à TROIS niveaux (retour Patrick 26/07, 2e passe) :
    #   zone → LIEU (nom réel) → une LIGNE par scène
    # et sur chaque ligne : l'image principale à gauche, ses variantes à droite.
    par_zone: dict[str, dict[str, dict[str, list[Item]]]] = {}
    for i in items:
        par_zone.setdefault(i.zone, {}).setdefault(i.lieu, {}).setdefault(i.group, []).append(i)

    def alertes(cartes: list[Item]) -> str:
        out = ""
        m = sum(1 for c in cartes if c.statut == MANQUANTE)
        a = sum(1 for c in cartes if c.verdict == A_REMPLACER)
        if m:
            out += f' <span class="lieu-warn">{m} sans image</span>'
        if a:
            out += f' <span class="lieu-warn">{a} à remplacer</span>'
        return out

    blocs = []
    for zone in sorted(par_zone):
        lieux = par_zone[zone]
        n_cartes = sum(len(g) for lg in lieux.values() for g in lg.values())
        corps = []
        # « Sans lieu fixe » en dernier : ce sont les errants, pas un lieu.
        for lieu in sorted(lieux, key=lambda x: (x == ERRANTS, x)):
            lignes_src = lieux[lieu]
            lignes = []
            for gid in sorted(lignes_src):
                cartes = sorted(
                    lignes_src[gid], key=lambda x: (not x.principale, x.kind != "scene", x.id)
                )
                titre = cartes[0].scene_nom or gid
                n_var = len(cartes) - 1
                lignes.append(
                    f'<section class="ligne" data-ligne="{esc(gid)}">'
                    # La LIGNE elle-même est le composant : elle porte donc
                    # l'icône du composant, ses cartes portent la leur.
                    f'<h4 class="ligne-head">{ICON_PRINCIPALE}{esc(titre)}'
                    f'<span class="ligne-id">{esc(gid)}</span>'
                    + (
                        f'<span class="ligne-n">+ {n_var} variante{"s" if n_var > 1 else ""}</span>'
                        if n_var
                        else '<span class="ligne-n">image seule</span>'
                    )
                    + f"{alertes(cartes)}</h4>"
                    f'<div class="rangee">{"".join(card(c) for c in cartes)}</div>'
                    f"</section>"
                )
            tout = [c for g in lignes_src.values() for c in g]
            corps.append(
                f'<section class="lieu" data-lieu="{esc(lieu)}">'
                f'<h3 class="lieu-head">{esc(lieu)}'
                f'<span class="lieu-n">{len(lignes_src)} scène{"s" if len(lignes_src) > 1 else ""}'
                f" · {len(tout)} images</span>{alertes(tout)}</h3>"
                f'{"".join(lignes)}</section>'
            )
        blocs.append(
            f'<section class="zone">'
            f'<h2 class="zone-head">{esc(zone)}'
            f'<span class="zone-n">{len(lieux)} lieux · {n_cartes} images</span></h2>'
            f'{"".join(corps)}</section>'
        )
    groups_html = "".join(blocs)

    # Légende : les quatre mots expliqués en clair, dans la page — sans ça les
    # compteurs ne veulent rien dire pour qui n'a pas écrit le code.
    legende = (
        # Le code des icônes, dit une fois : c'est celui de Figma, mais autant
        # l'écrire noir sur blanc plutôt que de compter sur la reconnaissance.
        f'<div class="leg">{ICON_PRINCIPALE}'
        f'<span class="leg-txt">l\'image principale de la scène — le décor de référence</span></div>'
        f'<div class="leg">{ICON_VARIANTE}'
        f'<span class="leg-txt">une variante : un élément observé, ou un autre moment du même lieu</span></div>'
    ) + "".join(
        f'<div class="leg"><span class="tag {k}">{STATUT_LABEL[k]}</span>'
        f'<span class="leg-txt">{STATUT_AIDE[k]}</span></div>'
        for k in (DEDIEE, HERITEE, FALLBACK, MANQUANTE)
    )

    cats = sorted(counts["categorie"])
    filter_defs = [("tous", "Tous"), (DEDIEE, "Son image"), (HERITEE, "Empruntées"),
                   (FALLBACK, "Génériques"), (MANQUANTE, "Sans image"),
                   (A_REMPLACER, "À remplacer")]
    filter_defs += [("doublons", "Doublons"), ("neuf", "Nouveautés"),
                    ("introuvable", "Introuvable")]
    filter_defs += [(c, CAT_LABEL.get(c, c.capitalize())) for c in cats]
    filters_html = "".join(
        f'<button class="{"on" if f == "tous" else ""}" data-f="{f}">{label}</button>'
        for f, label in filter_defs
    )

    # La RÉSERVE : les fichiers présents dans assets/ qu'aucune scène n'utilise.
    # Affichés en vignettes (et plus en liste de noms) : on ne décide pas de
    # garder ou de jeter une image sans la voir.
    def carte_orph(chemin: str) -> str:
        nom = chemin.split("/", 1)[1]
        f = MANIF.get(nom)
        h = f["hash"] if f else ""
        ver = f"?v={h}" if h else ""
        pastille = f'<span class="hash{" neuf" if f and f.get("recent") else ""}">{h}</span>' if h else ""
        return (
            f'<figure class="ocard" data-neuf="{"1" if f and f.get("recent") else "0"}">'
            f'<div class="thumb" style="background-image:url(\'{rel}{chemin}{ver}\')" '
            f'data-zoom="{rel}{chemin}{ver}" data-zoom-id="{esc(nom)}" title="Agrandir — {esc(nom)}">'
            f"{pastille}</div><figcaption>{esc(nom)}</figcaption></figure>"
        )

    orph = (
        "".join(carte_orph(o) for o in orphans)
        if orphans
        else '<div>Aucun. Tout fichier de assets/ est référencé.</div>'
    )

    if web:
        mode = "marque ce qui ne va pas, puis « copier ma liste » — je fais les remplacements"
    elif editable:
        mode = "édition active — le serveur écrit sur le disque"
    else:
        mode = "lecture seule — relancer avec --serve pour éditer"

    copy_btn = (
        '<button class="copybar" id="copy-prompts">Générer les prompts des images à remplacer '
        "→ à me coller</button>"
        '<button class="copybar copybar-2" id="copy-verdicts">Copier seulement la liste</button>'
        if web
        else ""
    )

    # Le rappel du pipeline n'a de sens que côté outil local (c'est une consigne
    # d'écriture). Sur la version web, ce qui compte c'est comment le marquage
    # revient jusqu'à moi.
    footer = (
        """<h2>Comment ça revient jusqu'à moi</h2>
<div class="log-static"><ol>
  <li>Tu marques les images qui ne vont pas, avec la raison si tu l'as en tête.
      Les marquages restent dans ce navigateur, même après fermeture.</li>
  <li>Tu cliques <b>Copier ma liste</b> en haut, et tu me la colles en message.</li>
  <li>Je regénère ou je recâble, je pousse, et cette page se met à jour.</li>
</ol>
<p style="margin-top:10px">Un lien ne peut pas écrire dans le dépôt : c'est le
navigateur qui l'interdit, pas un manque de l'outil. Comme c'est moi qui câble
les illustrations à chaque séance, ton marquage suffit — inutile que tu touches
au code.</p></div>"""
        if web
        else """<h2>Ordre d'écriture obligatoire</h2>
<div class="log-static"><ol>
  <li><code>dither_batch.py</code> — l'image brute passe par le dithering canonique
      (Floyd-Steinberg, seuil 182, contraste 151 %, Charbon/Orange). Jamais d'image
      brute en jeu.</li>
  <li><code>aldenhar/public/assets/</code> — le PNG tramé y est déposé sous son nom
      <code>{categorie}_{sujet}.png</code>.</li>
  <li><code>lib/scene-data.ts</code> puis <code>data/zones/*.json</code> — le champ
      <code>illustration</code> est mis à jour. Le .ts fait foi pour le jeu ; le JSON
      suit pour la production.</li>
</ol></div>"""
    )

    # Bandeau de fraîcheur : à quel instant et à quel commit correspond ce que
    # tu regardes. Sans lui, impossible de distinguer « rien n'a changé » de
    # « je regarde une vieille page ». Le JS le complète en comparant au
    # manifeste SERVI (voir `fraicheurLive` dans le script).
    _m = load_manifest()
    _d = (_m.get("genere") or "").replace("T", " ").replace("Z", " UTC")
    fraicheur = (
        f'<span>Manifeste : <b>{esc(_d) or "jamais généré"}</b></span>'
        f'<span>commit <b>{esc(_m.get("commit") or "?")}</b></span>'
        f'<span>{len(_m.get("fichiers", {}))} fichiers dans assets/</span>'
        '<span id="fr-live"></span>'
    )

    return f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PACTUM — Couverture visuelle</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>
<h1>COUVERTURE VISUELLE</h1>
<div class="sub">{counts["scenes"]} scènes · {counts["pois"]} points d'intérêt · Les Landes · {mode}</div>
<canvas class="rule"></canvas>

<div class="fraicheur" id="fraicheur">{fraicheur}</div>
<div class="stats">{stats}</div>
<div class="legende">{legende}</div>
{copy_btn}

<div class="filters" id="filters">{filters_html}</div>

{groups_html}

<h2>Assets orphelins</h2>
<div class="sub">Présents dans assets/, référencés par aucune scène — en réserve, ou à supprimer.</div>
<div class="orph">{orph}</div>

{footer}

<div id="zoom" role="dialog" aria-modal="true" aria-label="Image en pleine résolution">
  <img alt=""><p class="cap"></p>
</div>
<div id="log"><div class="hd">Journal d'écriture</div><div id="logbody">En attente d'une action…</div></div>
<div id="toast"></div>
<script>window.__COVERAGE_EDITABLE__={str(editable).lower()};
window.__COVERAGE_WEB__={str(web).lower()};</script>
<script>{JS}</script>
</body></html>
"""


# ─────────────────────────────────────────────────────────── serveur d'édition


def wire_image(scene_id: str, asset: str | None, is_poi: bool) -> list[str]:
    """Écrit `illustration: "assets/…"` sur une scène ou un point d'intérêt,
    dans scene-data.ts ET dans les JSON de zone qui le mentionnent.

    Détachement (bouton « détacher » de la maquette) : `asset` vide/None. Le
    champ `illustration?: string` du .ts n'accepte pas `null` — la ligne est
    donc RETIRÉE entièrement (la scène retombe sur l'héritage/fallback existant
    du jeu). Le JSON de zone, lui, garde la convention déjà en place dans
    `landes.json` (beaucoup d'entrées y valent explicitement `null` en attente
    d'écriture) : on y écrit `null` plutôt que de supprimer la clé."""
    touched = []
    src = SCENE_TS.read_text(encoding="utf-8")
    indent = "      " if is_poi else "    "
    pat = re.compile(r'(\n' + indent + r'id: "' + re.escape(scene_id) + r'",\n)'
                     r'(' + indent + r'illustration: "[^"]+",\n)?')
    m = pat.search(src)
    if not m:
        raise KeyError(f"id introuvable dans scene-data.ts : {scene_id}")
    repl = m.group(1) + (f'{indent}illustration: "{asset}",\n' if asset else "")
    src = src[: m.start()] + repl + src[m.end() :]
    SCENE_TS.write_text(src, encoding="utf-8")
    touched.append(str(SCENE_TS.relative_to(ROOT)))

    for z in sorted(ZONES_DIR.glob("*.json")):
        data = json.loads(z.read_text(encoding="utf-8"))
        changed = False

        def walk(node):
            nonlocal changed
            if isinstance(node, dict):
                if node.get("id") == scene_id and "illustration" in node:
                    node["illustration"] = asset or None
                    changed = True
                for v in node.values():
                    walk(v)
            elif isinstance(node, list):
                for v in node:
                    walk(v)

        walk(data)
        if changed:
            z.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            touched.append(str(z.relative_to(ROOT)))
    return touched


def dither_into_assets(raw: bytes, target_name: str) -> str:
    """Passe une image brute par le dithering canonique puis la dépose dans
    assets/. JAMAIS d'image brute en jeu (§ pipeline verrouillé)."""
    if not target_name.endswith(".png"):
        target_name += ".png"
    with tempfile.TemporaryDirectory() as tmp:
        tmpd = Path(tmp)
        src = tmpd / target_name
        src.write_bytes(raw)
        outdir = tmpd / "out"
        outdir.mkdir()
        cmd = [
            sys.executable,
            str(ROOT / "tools" / "dither_batch.py"),
            str(src),
            "--dest",
            str(outdir),
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        produced = list(outdir.rglob("*.png"))
        if not produced:
            raise RuntimeError(
                "dither_batch.py n'a rien produit.\n"
                + (res.stdout or "")
                + (res.stderr or "")
            )
        dest = ASSETS / target_name
        shutil.copy2(produced[0], dest)
        return f"assets/{dest.name}"


def serve(port: int = 8765) -> None:
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
    import base64

    class Handler(BaseHTTPRequestHandler):
        def _send(self, code, body, ctype="application/json; charset=utf-8"):
            data = body if isinstance(body, bytes) else body.encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, *a):  # silence
            pass

        def do_GET(self):
            path = self.path.split("?")[0]
            if path in ("/", "/index.html"):
                items, counts, orphans = build_items()
                html = render(items, counts, orphans, editable=True)
                # servi depuis la racine : les assets sont sous /assets/…
                html = html.replace("../aldenhar/public/assets/", "assets/")
                return self._send(200, html, "text/html; charset=utf-8")
            if path.startswith("/assets/"):
                f = ASSETS / path[len("/assets/") :]
                if f.is_file():
                    ext = f.suffix.lower()
                    ctype = {
                        ".png": "image/png",
                        ".jpg": "image/jpeg",
                        ".jpeg": "image/jpeg",
                        ".svg": "image/svg+xml",
                    }.get(ext, "application/octet-stream")
                    return self._send(200, f.read_bytes(), ctype)
            if path == "/api/assets":
                names = sorted(
                    f"assets/{p.name}"
                    for p in ASSETS.iterdir()
                    if p.is_file() and p.suffix.lower() in (".png", ".jpg", ".jpeg")
                )
                return self._send(200, json.dumps(names))
            self._send(404, json.dumps({"error": "not found"}))

        def do_POST(self):
            n = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(n) or b"{}")
            try:
                if self.path == "/api/wire":
                    touched = wire_image(
                        payload["id"], payload["asset"], bool(payload.get("poi"))
                    )
                    return self._send(200, json.dumps({"ok": True, "touched": touched}))
                if self.path == "/api/import":
                    raw = base64.b64decode(payload["data"].split(",")[-1])
                    asset = dither_into_assets(raw, payload["name"])
                    touched = wire_image(
                        payload["id"], asset, bool(payload.get("poi"))
                    )
                    return self._send(
                        200, json.dumps({"ok": True, "asset": asset, "touched": touched})
                    )
                if self.path == "/api/verdict":
                    v = payload.get("verdict", "")
                    if v not in ("", A_REMPLACER, OK):
                        raise ValueError(f"verdict inconnu : {v}")
                    save_verdict(payload["id"], v, payload.get("note", ""))
                    return self._send(
                        200,
                        json.dumps(
                            {"ok": True, "touched": [str(VERDICTS_JSON.relative_to(ROOT))]}
                        ),
                    )
            except Exception as exc:  # renvoyé tel quel à la page
                return self._send(500, json.dumps({"ok": False, "error": str(exc)}))
            self._send(404, json.dumps({"error": "not found"}))

    print(f"Couverture visuelle — édition active : http://localhost:{port}/")
    print("Ordre d'écriture : dithering → assets/ → scene-data.ts + zones/*.json")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()


def main() -> None:
    items, counts, orphans = build_items()
    if "--web" in sys.argv:
        # Version déployable à côté du jeu sur GitHub Pages : les assets y sont
        # déjà publics, donc la page ne pèse rien et sert les PNG d'origine.
        dest = Path(sys.argv[sys.argv.index("--web") + 1])
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(render(items, counts, orphans, editable=False, web=True), encoding="utf-8")
        kb = dest.stat().st_size / 1024
        print(f"{dest} écrit — {kb:.0f} Ko (images servies depuis assets/, non embarquées)")
        return
    if "--serve" in sys.argv:
        OUT_HTML.write_text(render(items, counts, orphans, editable=False), encoding="utf-8")
        port = 8765
        if "--port" in sys.argv:
            port = int(sys.argv[sys.argv.index("--port") + 1])
        serve(port)
        return
    OUT_HTML.write_text(render(items, counts, orphans, editable=False), encoding="utf-8")
    st = counts["statut"]
    print(f"{OUT_HTML.relative_to(ROOT)} écrit")
    print(
        f"  {counts['scenes']} scènes · {counts['interactions']} interactions "
        f"· {counts['transitions']} écrans de marche\n"
        f"  dédiée {st[DEDIEE]} · héritée {st[HERITEE]} · fallback {st[FALLBACK]} "
        f"· manquante {st[MANQUANTE]}\n"
        f"  {counts['prompts_manquants']} prompts à écrire · {len(orphans)} assets orphelins"
    )
    for i in items:
        for n in i.notes:
            print(f"  ⚠ {i.id} : {n}")


if __name__ == "__main__":
    main()
