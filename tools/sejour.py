#!/usr/bin/env python3
"""
GARDE DE BUILD — les scènes `sejour` ne doivent jamais enfermer le joueur.

Une scène `sejour` ne se quitte QUE par un choix portant `sortie` (panel du
9/08 : « la partie se termine sur un geste qui n'est pas partir »). Le prix de
cette règle est un risque nouveau et silencieux : si tous les choix de sortie
sont conditionnels — verrou de stat, savoir, découverte, état — un héros qui
ne remplit aucune condition reste bloqué sur l'écran, définitivement, avec une
run qu'il ne peut plus terminer autrement qu'en effaçant sa progression.

Ce contrôle l'interdit :
  1. toute scène `sejour` porte au moins UNE sortie INCONDITIONNELLE ;
  2. une `sortie` qui nomme une scène nomme une scène qui existe ;
  3. aucune scène `sejour` ne porte aussi `chainNext` (les deux se
     contrediraient : l'un retient, l'autre enchaîne).

Usage : python3 tools/sejour.py [--strict]
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SRC = RACINE / "aldenhar" / "lib" / "scene-data.ts"

# Ce qui rend un choix conditionnel — s'il en porte un, il peut ne pas exister
# à l'écran, donc il ne compte pas comme issue garantie.
CONDITIONS = (
    "locked:",
    "requiresSavoir:",
    "requiresDecouverte:",
    "requiresEtat:",
    "requiresContradiction:",
    "renonce:",
)


def blocs_de_scene(src: str) -> list[tuple[str, str]]:
    """(id, corps) pour chaque entrée de `SCENES` — découpage par accolades."""
    out: list[tuple[str, str]] = []
    for m in re.finditer(r'\n  \{\n    id: "([a-z0-9\-]+)"', src):
        debut = m.start()
        prof, i = 0, src.index("{", debut)
        for k in range(i, len(src)):
            if src[k] == "{":
                prof += 1
            elif src[k] == "}":
                prof -= 1
                if prof == 0:
                    out.append((m.group(1), src[i : k + 1]))
                    break
    return out


def choix_du_bloc(corps: str) -> list[str]:
    """Les choix de premier niveau. On repart des `id:` situés dans `choices`
    plutôt que d'un découpage récursif : les issues du dé contiennent des
    accolades et des apostrophes en pagaille, et c'est exactement le genre de
    parsing malin qui a déjà menti trois fois sur ce fichier."""
    i = corps.find("choices:")
    if i < 0:
        return []
    prof, debut = 0, corps.index("[", i)
    fin = len(corps)
    for k in range(debut, len(corps)):
        if corps[k] == "[":
            prof += 1
        elif corps[k] == "]":
            prof -= 1
            if prof == 0:
                fin = k
                break
    bloc = corps[debut : fin + 1]
    # Un choix commence à `id: "..."` en tête d'objet ; on découpe là-dessus.
    bornes = [m.start() for m in re.finditer(r'\bid:\s*"[a-z0-9\-]+"', bloc)]
    return [bloc[a : (bornes[n + 1] if n + 1 < len(bornes) else len(bloc))]
            for n, a in enumerate(bornes)]


def main() -> int:
    src = SRC.read_text(encoding="utf-8")
    ids = {i for i, _ in blocs_de_scene(src)} | {"la-descente"}
    soucis: list[str] = []
    sejours = 0

    for sid, corps in blocs_de_scene(src):
        if not re.search(r"\n    sejour:\s*true", corps):
            continue
        sejours += 1
        if re.search(r"\n    chainNext:", corps):
            soucis.append(f"{sid} : porte `sejour` ET `chainNext` — l'un retient, l'autre enchaîne")
        sorties = [c for c in choix_du_bloc(corps) if "sortie:" in c]
        if not sorties:
            soucis.append(f"{sid} : scène `sejour` sans AUCUN choix `sortie` — le joueur y reste enfermé")
            continue
        for c in sorties:
            m = re.search(r'sortie:\s*\{[^}]*toScene:\s*"([a-z0-9\-]+)"', c)
            if m and m.group(1) not in ids:
                cid = re.search(r'id:\s*"([a-z0-9\-]+)"', c)
                soucis.append(
                    f"{sid} / {cid.group(1) if cid else '?'} : `sortie` vers « {m.group(1) } », "
                    "qui n'est pas une scène connue"
                )
        garanties = [c for c in sorties if not any(k in c for k in CONDITIONS)]
        if not garanties:
            soucis.append(
                f"{sid} : toutes ses sorties sont CONDITIONNELLES — un héros qui ne remplit "
                "aucune condition n'a plus aucun moyen de quitter l'écran"
            )

    print(f"séjours contrôlés : {sejours}")
    for s in soucis:
        print("  ⚠️", s)
    if soucis:
        print(f"\n{len(soucis)} problème(s).")
        return 1 if "--strict" in sys.argv else 0
    print("  aucun enfermement possible.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
