#!/usr/bin/env python3
"""
Assemble `pactum-playtest.zip` — le paquet remis aux IA sans navigateur.

Contenu :
  jouer/        la table de jeu (pactum.py + run-kit.json) : l'IA LANCE une
                partie et la joue, choix par choix.
  transcripts/  des parties réelles enregistrées sur le build publié — la
                référence sans dérive (le vrai moteur, les vraies images).
  sources/      le contenu et les règles, pour vérifier une intuition.

Usage : python3 tools/faire_paquet_ia.py [transcripts…]
"""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
APP = RACINE / "aldenhar"
SORTIE = RACINE / "aldenhar" / "public" / "pactum-playtest.zip"
SCRATCH = Path("/tmp/paquet-ia")


def main(argv: list[str]) -> int:
    version = re.search(
        r'APP_VERSION = "([^"]+)"', (APP / "lib" / "version.ts").read_text(encoding="utf-8")
    ).group(1)
    subprocess.run([sys.executable, str(RACINE / "tools" / "export_run_kit.py")], check=True)

    if SCRATCH.exists():
        shutil.rmtree(SCRATCH)
    pack = SCRATCH / "pack"
    (pack / "jouer").mkdir(parents=True)
    (pack / "transcripts").mkdir()
    (pack / "sources" / "lib").mkdir(parents=True)
    (pack / "sources" / "components").mkdir()

    shutil.copy(RACINE / "tools" / "pactum.py", pack / "jouer" / "pactum.py")
    shutil.copy(RACINE / "data" / "run-kit.json", pack / "jouer" / "run-kit.json")
    # ⚠️ LE GARDE VOYAGE AVEC LA TABLE (réserve du playtest du 15/08 : « le zip
    # ne contient pas protocole_sceau.py, donc je n'ai pas pu exécuter ton
    # garde lui-même »). Un relecteur qui doit re-dériver les assertions d'un
    # garde ne le vérifie pas : il en écrit un autre, et les deux peuvent
    # diverger. Il tourne tel quel depuis `jouer/` — il copie `pactum.py` et
    # `run-kit.json` dans des tables isolées, tous deux présents ici.
    shutil.copy(RACINE / "tools" / "protocole_sceau.py", pack / "jouer" / "protocole_sceau.py")
    for f in sorted((APP / "lib").glob("*.ts")):
        shutil.copy(f, pack / "sources" / "lib" / f.name)
    for f in sorted((APP / "components").glob("*.tsx")):
        shutil.copy(f, pack / "sources" / "components" / f.name)

    # ⚠️ Les transcripts venaient UNIQUEMENT de la ligne de commande. Le jour
    # où l'outil qui les enregistrait a disparu (il vivait dans un scratchpad
    # de session), plus personne ne les a passés — et le paquet a continué de
    # se construire sans un mot, en promettant dans son LISEZMOI des « parties
    # réelles enregistrées » qu'il ne contenait plus. Ils vivent maintenant
    # dans le dépôt, et l'absence se DIT au lieu de passer inaperçue.
    # ⚠️ ET ON NE LIVRE QUE LES VIES DU BUILD COURANT. Le dossier garde les
    # anciennes (elles sont l'état « avant » d'un chantier), mais les mettre
    # dans le paquet ferait juger une version périmée : un relecteur qui lit
    # une vie d'avant le démontage des états conclut que des systèmes ont
    # disparu. C'est arrivé le 9/08, sur des transcripts de dix-sept versions
    # en arrière. On prend le préfixe de build le plus récent, et lui seul.
    trans = [Path(a) for a in argv[1:]]
    if not trans:
        tous = sorted((RACINE / "data" / "transcripts").glob("v1[0-9]*.md"))
        if tous:
            dernier = max(f.name.split("-")[0] for f in tous)
            trans = [f for f in tous if f.name.startswith(dernier + "-")]
    for t in trans:
        if t.exists():
            shutil.copy(t, pack / "transcripts" / t.name)
    n_trans = len(list((pack / "transcripts").glob("*.md")))
    if n_trans == 0:
        print(
            "⚠️  AUCUN TRANSCRIPT dans le paquet — or le LISEZMOI en promet.\n"
            "    Enregistres-en avec `node tools/joueur.mjs --sortie "
            "data/transcripts/<nom>.md` (le jeu doit être servi en local)."
        )

    # LE CONTEXTE DU PANEL INFORMÉ (14/08) : intentions, règles verrouillées,
    # systèmes existants, ce qui est délibéré, ce qui a déjà été refusé. Il
    # voyage AVEC le paquet parce qu'un panel « qui connaît tout du jeu » ne
    # peut pas se reconstituer à partir des sources seules — et son avant-
    # propos dit explicitement au panel aveugle de ne pas l'ouvrir.
    shutil.copy(RACINE / "data" / "contexte-panel-informe.md", pack / "CONTEXTE-INFORME.md")

    lisez = (RACINE / "data" / "paquet-ia-LISEZMOI.md").read_text(encoding="utf-8")
    lisez = lisez.replace("{VERSION}", version).replace("{NTRANS}", str(n_trans))
    (pack / "LISEZMOI.md").write_text(lisez, encoding="utf-8")

    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(SORTIE, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in sorted(pack.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(SCRATCH))
    ko = SORTIE.stat().st_size // 1024
    print(f"{SORTIE.relative_to(RACINE)} — v{version} · {n_trans} transcript(s) · {ko} Ko")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
