#!/usr/bin/env python3
"""
GARDE DE BUILD — l'aiguillage échec/réussite (panel du 9/08, chantier n°1).

Une scène chaînée reçoit le même texte quel que soit le dé qui l'a précédée.
`Scene.narrationEchec` donne la version « pas tenu ». Ce contrôle ne juge PAS
si un texte présuppose son issue — ça, seule la lecture le dit, et 22 des 31
scènes chaînées se lisent très bien dans les deux cas. Il attrape les deux
erreurs qui, elles, sont mécaniques :

  1. une `narrationEchec` IDENTIQUE à la `narration` (copier-coller non modifié :
     le champ existe, le défaut reste, et plus personne ne le cherchera) ;
  2. une `narrationEchec` sur une scène qu'AUCUN jet ne précède — du texte
     écrit qui ne s'affichera jamais.

Et il imprime l'inventaire : combien de scènes chaînées suivent un jet, combien
sont aiguillées. Ce nombre est le seul suivi honnête du chantier.

Usage : python3 tools/aiguillage.py [--strict]
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
EXPORT = RACINE / "data" / "studio-data.json"


SOURCE = RACINE / "aldenhar" / "lib" / "scene-data.ts"


def export_a_jour() -> None:
    """⚠️ CE GARDE LIT UN INSTANTANÉ, PAS LA SOURCE (repasse du 10/08).

    Il ne régénérait `studio-data.json` que s'il était ABSENT — et rien dans
    `prebuild` ne le régénère. Prouvé dans les deux sens : un doublon injecté
    dans l'instantané le fait tirer, le même doublon injecté dans
    `scene-data.ts` sans régénérer le laisse aveugle. Autrement dit le garde
    pouvait valider un texte qui n'existait plus et rater celui qu'on venait
    d'écrire. On régénère donc dès que la source est plus récente.
    """
    if not EXPORT.exists() or (SOURCE.exists() and SOURCE.stat().st_mtime > EXPORT.stat().st_mtime):
        subprocess.run([sys.executable, str(RACINE / "tools" / "studio_data.py")], check=True,
                       stdout=subprocess.DEVNULL)


def main() -> int:
    export_a_jour()
    d = json.loads(EXPORT.read_text(encoding="utf-8"))
    par_id = {s["id"]: s for s in d["scenes"]}

    # Les scènes qu'un JET peut précéder : celles vers qui pointe un `suite`
    # depuis une scène portant au moins un choix risqué.
    apres_jet: set[str] = set()
    for s in d["scenes"]:
        if s.get("suite") and any(c.get("type") == "risque" for c in s.get("choix", [])):
            apres_jet.add(s["suite"])

    soucis: list[str] = []
    aiguillees = 0
    for s in d["scenes"]:
        echec = s.get("narrationEchec")
        if not echec:
            continue
        aiguillees += 1
        if echec == s.get("narration"):
            soucis.append(f"{s['id']} : `narrationEchec` IDENTIQUE à `narration` — copier-coller non modifié")
        if s["id"] not in apres_jet:
            soucis.append(
                f"{s['id']} : `narrationEchec` sur une scène qu'aucun jet ne précède — "
                "ce texte ne s'affichera jamais"
            )

    manquantes = sorted(apres_jet - {s for s in par_id if par_id[s].get("narrationEchec")})
    print(f"scènes chaînées derrière un jet : {len(apres_jet)}")
    print(f"  aiguillées (deux versions)    : {aiguillees}")
    print(f"  une seule version             : {len(manquantes)}")
    print("  (une seule version n'est pas un défaut en soi : la plupart de ces")
    print("   textes se lisent dans les deux cas. À relire quand on y touche.)")
    for s in soucis:
        print("  ⚠️", s)
    if soucis:
        return 1 if "--strict" in sys.argv else 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
