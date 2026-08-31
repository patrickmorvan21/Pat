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
    "HAMEAU_WALK": (
        "d'une ruelle du hameau à l'autre, ou quand une des deux directions "
        "offertes est le village (le hameau grossit à l'horizon)"
    ),
    "LANDES_WALK": (
        "en pleine lande, entre deux lieux extérieurs — tirée par la graine "
        "du pas : ni la provenance ni la destination ne la choisissent"
    ),
    "LANDES_GENERIC": (
        "en pleine lande, entre deux lieux extérieurs — tirée par la graine "
        "du pas : ni la provenance ni la destination ne la choisissent"
    ),
}

# Les vues de marche dont la règle est écrite AILLEURS que dans `pickWalkImage`
# (retour Patrick 25/08 : « savoir d'où on venait, où on s'apprête à aller »).
# Sans cette table, l'écran de transition le plus chargé de sens du jeu — la
# sortie du village — n'a aucune fiche où être jugé.
MARCHE_HORS_POOL = {
    "SORTIE_DEUX_CHEMINS": (
        "AU SORTIR DU HAMEAU : le muret d'enceinte vient d'être franchi, le "
        "village est dans le dos, et deux routes de lande s'ouvrent devant"
    ),
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
        # Le NOM du lieu, pas son identifiant : la fiche se lit, elle ne se
        # débogue pas (retour Patrick 25/08 sur le contexte des transitions).
        nm = re.search(r'"?%s"?\s*:\s*"([^"]+)"' % re.escape(m.group(1)), src)
        dest = nm.group(1) if nm else m.group(1)
        out[m.group(2)] = (
            f"quand une des deux directions offertes est « {dest} » — "
            f"on marche déjà vers ce lieu-là"
        )
    # La sortie du village : sa vue est posée par `habillageSortie` dans
    # `components/Scene.tsx`, pas par `pickWalkImage`. Le garde `assetExiste`
    # la replie sur la marche de lande tant que le fichier n'est pas déposé —
    # elle apparaît donc ici comme « FICHIER ABSENT DU DISQUE », ce qui est
    # exactement l'information utile.
    scn = ROOT / "aldenhar" / "components" / "Scene.tsx"
    if scn.exists():
        stx = scn.read_text(encoding="utf-8")
        for nom, regle in MARCHE_HORS_POOL.items():
            m2 = re.search(nom + r'\s*=\s*"(assets/[^"]+)"', stx)
            if m2:
                out[m2.group(1)] = regle
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


# ─────────────────────────────────────────────────────────────────────────────
# LA PAGE DE COUVERTURE A ÉTÉ SUPPRIMÉE (31/08, décision Patrick) — le Graphe
# la remplace, comme il avait déjà remplacé Pactum Studio le 30/08.
#
# ⚠️ Ce qui reste ici est une BIBLIOTHÈQUE, pas un outil : `build_items()` est
# le seul endroit du projet qui sache dire d'une image si elle est DÉDIÉE,
# HÉRITÉE, servie par une vue générique ou MANQUANTE. `studio_data.py`
# l'importe pour poser ce statut dans `studio-data.json`, que le Graphe lit.
# Le réécrire ailleurs ferait diverger deux définitions du même mot.
#
# Sont partis avec la page : le rendu HTML, le serveur d'édition `--serve`,
# l'export `--web`, le câblage `wire_image` et l'import dithéré. Le câblage
# d'images se fait aujourd'hui par `cabler_landes.py` (qui écrit via
# `atelier.reporter_dans_ts`) et par le rapport que le Graphe me recolle.
#
# `save_verdict` est conservée juste au-dessus : les verdicts « à refaire » de
# Patrick vivent dans `data/couverture-verdicts.json`, sont LUS par
# `build_items` et remontent dans le Graphe. Le fichier ne doit pas disparaître
# avec la page qui l'écrivait.
