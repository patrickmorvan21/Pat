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
    """(id, corps) pour chaque entrée de `SCENES` — découpage par accolades.

    ⚠️ Ne PAS exiger `id:` juste après l'accolade : une scène sur trois porte
    un commentaire de plusieurs lignes avant son id (« Événement du lieu… »).
    La première version le faisait et le garde était silencieusement aveugle à
    trois séjours sur onze — un garde plus faible que ce qu'il annonce est pire
    qu'absent, puisqu'on cesse de chercher.
    """
    out: list[tuple[str, str]] = []
    for m in re.finditer(r"\n  \{", src):
        i = m.end() - 1
        prof = 0
        for k in range(i, len(src)):
            if src[k] == "{":
                prof += 1
            elif src[k] == "}":
                prof -= 1
                if prof == 0:
                    corps = src[i : k + 1]
                    mid = re.search(r'^\s*id: "([a-z0-9\-]+)"', corps, re.M)
                    if mid:
                        out.append((mid.group(1), corps))
                    break
    return out


def tableau_nomme(src: str, nom: str) -> str:
    """Le corps d'un `const NOM: Choice[] = [ ... ]` de premier niveau.

    ⚠️ Une scène peut PARTAGER son tableau de choix avec sa variante (le
    Chemin du Sud, 01/09) : `choices: CHOIX_CHEMIN_DU_SUD`. Sans cette
    résolution, le garde lisait « aucun choix » — c'est-à-dire qu'il aurait
    déclaré enfermé un séjour parfaitement sortable, ou pire, laissé passer un
    vrai enfermement. Même classe que le champ renseigné par une constante
    attrapé le 14/08 : ce qu'un extracteur ne résout pas, il l'invente.
    """
    m = re.search(r"\bconst\s+" + re.escape(nom) + r"\s*:[^=]*=\s*\[", src)
    if not m:
        return ""
    # ⚠️ PAS `src.index("[", m.start())` : le TYPE `Choice[]` contient déjà des
    # crochets, donc on tomberait sur le `[` de l'annotation et le tableau
    # rendu ferait deux caractères. Le motif se termine sur le vrai `[`.
    debut = m.end() - 1
    prof = 0
    for k in range(debut, len(src)):
        if src[k] == "[":
            prof += 1
        elif src[k] == "]":
            prof -= 1
            if prof == 0:
                return src[debut : k + 1]
    return ""


def choix_du_bloc(corps: str, src: str = "") -> list[str]:
    """Les choix de premier niveau. On repart des `id:` situés dans `choices`
    plutôt que d'un découpage récursif : les issues du dé contiennent des
    accolades et des apostrophes en pagaille, et c'est exactement le genre de
    parsing malin qui a déjà menti trois fois sur ce fichier."""
    i = corps.find("choices:")
    if i < 0:
        return []
    # `choices: NOM_DE_CONSTANTE,` — tableau partagé : on va le chercher.
    ref = re.match(r"choices:\s*([A-Z_][A-Z0-9_]*)\s*,", corps[i:])
    if ref:
        bloc = tableau_nomme(src, ref.group(1))
        if not bloc:
            return []
        bornes = [m.start() for m in re.finditer(r'\bid:\s*"[a-z0-9\-]+"', bloc)]
        return [bloc[a : (bornes[n + 1] if n + 1 < len(bornes) else len(bloc))]
                for n, a in enumerate(bornes)]
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
        sorties = [c for c in choix_du_bloc(corps, src) if "sortie:" in c]
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
