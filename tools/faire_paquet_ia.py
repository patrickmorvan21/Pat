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
    # ⚠️ ON COMPARE DES VERSIONS, PAS DES CHAÎNES (03/09). Le tri prenait le
    # max LEXICOGRAPHIQUE du préfixe : « v198 » (1.98.0) bat « v1282 », donc
    # dès que la version a passé 1.99 le paquet ré-embarquait en SILENCE les
    # vies périmées — précisément ce que ce bloc existe pour empêcher. On lit
    # les chiffres du préfixe et on les compare comme des nombres.
    # Le nom d'un transcript commence par sa version POINTÉE : `v1.128.2-…`.
    # ⚠️ L'ancien nommage collé (`v198` pour 1.98.0) est intrinsèquement
    # ambigu — « 198 » se compare à « 1 » et gagne. Les fichiers d'alors ont
    # été renommés ; un nom qui ne porte pas de point est donc un reliquat, et
    # il passe en DERNIER plutôt que de rafler la sélection en silence.
    def version_du(nom: str) -> tuple[int, ...]:
        prefixe = nom.split("-")[0].lstrip("v")
        if "." not in prefixe:
            return (-1,)
        return tuple(int(m) for m in re.findall(r"\d+", prefixe)) or (-1,)

    trans = [Path(a) for a in argv[1:]]
    if not trans:
        tous = sorted((RACINE / "data" / "transcripts").glob("v*.md"))
        if tous:
            plus_recent = max(version_du(f.name) for f in tous)
            trans = [f for f in tous if version_du(f.name) == plus_recent]
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

    # LE CONTEXTE DE DESIGN — intentions, règles verrouillées, systèmes
    # existants, ce qui est délibéré, ce qui a déjà été refusé.
    # ⚠️ IL EST RANGÉ DANS `_orchestrateur/`, ET C'EST DÉLIBÉRÉ. Quand tous les
    # agents du panel jouent EN AVEUGLE, un fichier posé à la racine finit par
    # être ouvert « pour se documenter » — et un agent qui l'a lu ne rend plus
    # un ressenti, il rend une note de conformité. Le sous-dossier et son nom
    # font la barrière que l'avant-propos seul ne faisait pas.
    (pack / "_orchestrateur").mkdir()
    shutil.copy(
        RACINE / "data" / "contexte-panel-informe.md",
        pack / "_orchestrateur" / "CONTEXTE-DESIGN.md",
    )
    # La consigne du panel voyage avec le paquet : sans elle, le zip ouvert
    # trois semaines plus tard ne dit plus pour quel protocole il a été bâti.
    brief = (RACINE / "data" / "brief-panel-20-aveugle.md").read_text(encoding="utf-8")
    (pack / "_orchestrateur" / "CONSIGNE-PANEL-20.md").write_text(
        brief.replace("{VERSION}", version), encoding="utf-8"
    )

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
