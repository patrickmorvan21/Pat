#!/usr/bin/env python3
"""
L'ATELIER — éditer les scènes de PACTUM, et que ça compte vraiment.

    npm run atelier        (depuis aldenhar/)
    python3 tools/atelier.py [--port 8770]

Ce que ça sert : `data/atelier.html`, alimenté par `data/zones/*.json`.

═══ La règle qui gouverne tout ce fichier ═══

Le jeu ne lit PAS les JSON de zone : il lit `aldenhar/lib/scene-data.ts`.
Un atelier qui n'écrirait que dans le JSON donnerait l'illusion d'éditer le
jeu sans rien changer à l'écran — le pire résultat possible.

Donc chaque écriture va à DEUX endroits, dans cet ordre :
  1. `data/zones/<zone>.json` — la matière d'auteur (texte, description,
     prompt, graphe). C'est là que vit le travail d'écriture.
  2. `aldenhar/lib/scene-data.ts` — pour les champs que le jeu connaît
     (`narration` et `illustration`). Sans cette seconde écriture, rien
     n'apparaît en jeu.

Si la seconde échoue, la première est conservée et l'atelier le DIT. On ne
perd jamais un texte, et on ne ment jamais sur ce qui est arrivé en jeu.

Les écritures sont ATOMIQUES : fichier temporaire dans le même dossier, puis
`os.replace` (atomique sur le même système de fichiers). Une frappe pendant
une sauvegarde ne peut pas tronquer le fichier. Une copie `.bak` de la
version précédente est gardée à côté.
"""

from __future__ import annotations

import json
import os
import re
import sys
import tempfile
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
ZONES = RACINE / "data/zones"
PAGE = RACINE / "data/atelier.html"
TS = RACINE / "aldenhar/lib/scene-data.ts"
ASSETS = RACINE / "aldenhar/public/assets"
DITHER = RACINE / "tools/dither_batch.py"

CHAMPS_TEXTE = {"texte", "description", "prompt_image", "nom", "illustration"}


# ─────────────────────────────── écriture sûre ───────────────────────────────
def ecrire_atomique(chemin: Path, contenu: str) -> None:
    """Écrit sans jamais laisser le fichier à moitié écrit."""
    chemin.parent.mkdir(parents=True, exist_ok=True)
    if chemin.exists():
        # Le .bak est la corde de rappel : ces textes n'existent nulle part
        # ailleurs une fois édités.
        chemin.with_suffix(chemin.suffix + ".bak").write_bytes(chemin.read_bytes())
    fd, tmp = tempfile.mkstemp(dir=str(chemin.parent), prefix=".atelier-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(contenu)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, chemin)  # atomique
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise


def charger_zone(nom: str) -> tuple[Path, dict]:
    p = ZONES / f"{nom}.json"
    if not p.exists():
        raise FileNotFoundError(f"zone inconnue : {nom}")
    return p, json.loads(p.read_text(encoding="utf-8"))


def sauver_zone(chemin: Path, zone: dict) -> None:
    # indent=2 + ensure_ascii=False : le formatage du dépôt, pour que les diffs
    # git restent lisibles ligne à ligne.
    ecrire_atomique(chemin, json.dumps(zone, ensure_ascii=False, indent=2) + "\n")


# ──────────────────────── report dans scene-data.ts ──────────────────────────
def echapper_ts(txt: str) -> str:
    return txt.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")


def bloc_scene(src: str, sid: str) -> tuple[int, int] | None:
    """Bornes du bloc d'une scène de premier niveau dans SCENES[]."""
    m = re.search(r'^\s{4}id: "%s",$' % re.escape(sid), src, re.M)
    if not m:
        return None
    suivant = re.search(r'^\s{4}id: "[\w-]+",$', src[m.end() :], re.M)
    return m.start(), (m.end() + suivant.start()) if suivant else len(src)


def bloc_poi(src: str, pid: str) -> tuple[int, int] | None:
    """Bornes du bloc d'un point d'intérêt (indenté à 6 espaces)."""
    m = re.search(r'^\s{8}id: "%s",$' % re.escape(pid), src, re.M)
    if not m:
        return None
    fin = src.find("\n      },", m.end())
    return (m.start(), fin) if fin > 0 else None


def rendre_narration(paras: list[str]) -> str:
    """Réécrit un tableau `narration:` lisible, à l'indentation du fichier."""
    lignes = ["    narration: ["]
    for p in paras:
        lignes.append(f'      "{echapper_ts(p)}",')
    lignes.append("    ],")
    return "\n".join(lignes)



def remplacer_cle(bloc: str, cle: str, valeur: str) -> str:
    """
    Remplace la valeur de `cle:` dans un bloc de point d'intérêt.

    La valeur court de la ligne `        <cle>:` jusqu'à la ligne, incluse,
    qui termine par une virgule à profondeur de parenthèses nulle. On avance
    ligne à ligne : c'est le seul moyen fiable quand les valeurs sont
    écrites en morceaux « a » + « b » sur plusieurs lignes.
    """
    lignes = bloc.split("\n")
    debut = next((i for i, l in enumerate(lignes) if l.strip().startswith(f"{cle}:")), None)
    if debut is None:
        return bloc
    i, prof = debut, 0
    while i < len(lignes):
        prof += lignes[i].count("(") - lignes[i].count(")")
        if lignes[i].rstrip().endswith(",") and prof == 0 and i >= debut:
            break
        i += 1
    remplacement = [f"        {cle}:", f'          "{echapper_ts(valeur)}",']
    return "\n".join(lignes[:debut] + remplacement + lignes[i + 1 :])


def reporter_dans_ts(sid: str, champ: str, valeur) -> str:
    """
    Reporte un champ dans scene-data.ts. Renvoie un compte rendu lisible —
    l'atelier l'affiche tel quel, y compris quand il n'y avait rien à faire.
    """
    if champ not in ("texte", "illustration"):
        return "JSON seulement (le jeu ne lit pas ce champ)"
    src = TS.read_text(encoding="utf-8")

    bs = bloc_scene(src, sid)
    bp = None if bs else bloc_poi(src, sid)
    if not bs and not bp:
        return f"⚠ « {sid} » est absent de scene-data.ts — écrit dans le JSON seulement"

    debut, fin = bs or bp
    bloc = src[debut:fin]
    neuf = bloc

    if champ == "illustration":
        ligne = f'    illustration: "assets/{valeur}",' if bs else f'        illustration: "assets/{valeur}",'
        m = re.search(r'^\s*illustration: "assets/[\w.]+",$', bloc, re.M)
        if valeur:
            if m:
                neuf = bloc[: m.start()] + ligne + bloc[m.end() :]
            else:
                # Juste après la ligne d'id, comme partout ailleurs dans le fichier.
                mid = re.search(r'^\s*id: "[\w-]+",$', bloc, re.M)
                neuf = bloc[: mid.end()] + "\n" + ligne + bloc[mid.end() :]
        elif m:
            neuf = bloc[: m.start()].rstrip("\n") + bloc[m.end() :]

    elif champ == "texte":
        paras = [p for p in valeur if p.strip()]
        if bs:
            m = re.search(r"^    narration: \[.*?^    \],$", bloc, re.S | re.M)
            if not m:
                return "⚠ pas de bloc narration à remplacer — JSON écrit, jeu inchangé"
            neuf = bloc[: m.start()] + rendre_narration(paras) + bloc[m.end() :]
        else:
            # Point d'intérêt : premier paragraphe = approche, second = examen.
            # ⚠️ Découpage par LIGNES et non par regex multiligne : la valeur
            # d'une clé s'étend sur plusieurs lignes concaténées par `+`, et
            # les clés ne sont pas dans un ordre fixe (`savoir` peut s'insérer
            # entre `approche` et `examen`). Une regex non gourmande rate la
            # seconde clé dès que l'ordre change — vu au test du 27/07.
            neuf = remplacer_cle(neuf, "approche", paras[0] if paras else "")
            if len(paras) > 1:
                neuf = remplacer_cle(neuf, "examen", paras[1])

    if neuf == bloc:
        return "scene-data.ts déjà à jour"
    ecrire_atomique(TS, src[:debut] + neuf + src[fin:])
    return "reporté dans scene-data.ts ✓"


# ─────────────────────────── image → dithering → assets ──────────────────────
def importer_image(nom_fichier: str, octets: bytes) -> tuple[str, str]:
    """
    Passe une image brute par le pipeline canonique et la dépose dans assets/.

    JAMAIS d'image brute dans le dépôt. Le dithering (recadrage carré, 1000px
    sans upscale, Floyd-Steinberg seuil 182, contraste 151 % pivot 128, palette
    Charbon/Orange, grain ×3) est VERROUILLÉ par le skill pactum-style, et
    c'est `dither_batch.py` qui le porte.

    On importe ses fonctions plutôt que d'appeler son CLI : le CLI est fait
    pour ranger dans le Drive, avec des dossiers temporaires à lui. Passer par
    `square_crop` / `prepare_for_dither` / `dither` garantit exactement le même
    traitement, sans le rangement dont on n'a pas besoin ici.
    """
    sys.path.insert(0, str(DITHER.parent))
    try:
        import dither_batch as db
    except ImportError as e:
        raise RuntimeError(f"pipeline de dithering indisponible : {e}") from e
    try:
        from PIL import Image
    except ImportError as e:
        raise RuntimeError("Pillow manquant — python3 -m pip install pillow") from e

    nom = re.sub(r"[^a-z0-9_]+", "_", Path(nom_fichier).stem.lower()).strip("_")
    if not re.match(r"^(scene|monstre|objet)_", nom):
        nom = "scene_" + nom
    cible = f"{nom}.png"

    with tempfile.TemporaryDirectory() as tmp:
        entree = Path(tmp) / "entree"
        entree.write_bytes(octets)
        with Image.open(entree) as im:
            im.load()
            # RGB obligatoire : `dither` lit des triplets (r, g, b).
            # `prepare_for_dither` fait lui-même le recadrage carré.
            # ⚠️ `prepare_for_dither` renvoie (image de travail, CÔTÉ de la
            # grille) — pas un facteur de bloc. Le bloc-up se fait avec
            # PIXEL_SIZE_DEFAULT, exactement comme dans le CLI.
            bloc = db.PIXEL_SIZE_DEFAULT
            petit, cote = db.prepare_for_dither(im.convert("RGB"), bloc)
            tramee = db.dither(petit)
            if bloc > 1:
                tramee = tramee.resize((cote * bloc, cote * bloc), Image.NEAREST)
            sortie = Path(tmp) / cible
            tramee.save(sortie, "PNG", optimize=True)
        ASSETS.mkdir(parents=True, exist_ok=True)
        ecrire_octets(ASSETS / cible, sortie.read_bytes())
    return cible, f"dithering appliqué ({tramee.width}×{tramee.height})"


def ecrire_octets(chemin: Path, data: bytes) -> None:
    fd, tmp = tempfile.mkstemp(dir=str(chemin.parent), prefix=".atelier-", suffix=".tmp")
    with os.fdopen(fd, "wb") as f:
        f.write(data)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, chemin)


# ─────────────────────────────────────────────────────────────────────────────
# LA PAGE DE L'ATELIER A ÉTÉ SUPPRIMÉE (31/08, décision Patrick) — le Graphe
# la remplace.
#
# ⚠️ Ce qui reste est une BIBLIOTHÈQUE d'ÉCRITURE : `reporter_dans_ts()` sait
# poser un champ dans `lib/scene-data.ts` en visant le bloc d'une scène ou d'un
# point d'intérêt, sans toucher au reste du fichier. `cabler_landes.py` s'en
# sert pour appliquer un manifeste de lot d'images — c'est le chemin par lequel
# passent tous les câblages depuis le 28/07.
#
# Sont partis avec la page : le serveur, la carte, le rendu et l'export `--web`.
