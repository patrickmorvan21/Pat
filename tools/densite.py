#!/usr/bin/env python3
"""
AUDIT DE DENSITÉ DE TEXTE — la doctrine du 4/08, mesurée au lieu d'être débattue.

Deux règles à vérifier, jamais à l'œil :
  1. La grille de la spec (§C 4/08, en SIGNES) : arrivée 350-500 · beat 200-350
     · résolution 100-250 · examen de point 250-450.
  2. La règle des micro-beats (retour externe 4/08, en MOTS) : jamais plus de
     100-120 mots ininterrompus avant un geste. L'unité de lecture ininterrompue
     est L'ÉCRAN (les paragraphes s'enchaînent seuls à la frappe) — pas le
     paragraphe.

La profondeur OPTIONNELLE (examens de points d'intérêt) a le droit d'être
riche : elle est mesurée à part et ne compte jamais comme dépassement.

Usage : python3 tools/densite.py [--verbose]
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import studio_data as sd  # noqa: E402  (le parseur .ts éprouvé)

TS = Path(__file__).resolve().parent.parent / "aldenhar/lib/scene-data.ts"

# Seuil de la règle des micro-beats, en mots, par écran OBLIGATOIRE.
SEUIL_ECRAN = 120


def mots(t: str) -> int:
    return len(t.split())


def main() -> int:
    verbose = "--verbose" in sys.argv
    src = TS.read_text(encoding="utf-8")
    bloc = sd.bloc_apres(src, r"const SCENES: Scene\[\] =")
    assert bloc, "SCENES introuvable"

    ecrans: list[tuple[str, int, int, int]] = []  # (id, mots, signes, nb paragraphes)
    examens: list[tuple[str, int]] = []
    paragraphes_longs: list[tuple[str, int]] = []

    for o in sd.objets_de_haut_niveau(bloc[0], 0):
        sid = sd.texte_de(o, "id")
        if not sid:
            continue
        narr = sd.bloc_apres(o, r"\n {4}narration:\s*")
        if narr:
            paras = sd.paragraphes(narr[0])
            total = " ".join(paras)
            ecrans.append((sid, mots(total), len(total), len(paras)))
            for i, p in enumerate(paras):
                if mots(p) > SEUIL_ECRAN:
                    paragraphes_longs.append((f"{sid} ¶{i + 1}", mots(p)))
        for p in sd.lire_pois(o):
            if p.get("examen"):
                examens.append((p["id"], mots(p["examen"])))
            # L'approche d'un point est un écran obligatoire une fois choisi.
            if p.get("approche") and mots(p["approche"]) > SEUIL_ECRAN:
                paragraphes_longs.append((f"{p['id']} (approche)", mots(p["approche"])))

    ecrans.sort(key=lambda e: -e[1])
    depassements = [e for e in ecrans if e[1] > SEUIL_ECRAN]
    tous = [e[1] for e in ecrans]
    from statistics import median

    print(f"ÉCRANS OBLIGATOIRES (narration) — {len(ecrans)} écrans")
    print(f"  médiane {median(tous):.0f} mots · max {max(tous)} · seuil micro-beats {SEUIL_ECRAN}")
    print(f"  au-dessus du seuil : {len(depassements)} écran(s)")
    for sid, m, c, n in depassements:
        print(f"    {sid:28s} {m:>4} mots · {c:>4} signes · {n} ¶")
    if paragraphes_longs:
        print(f"\n  paragraphes seuls > {SEUIL_ECRAN} mots : {len(paragraphes_longs)}")
        for sid, m in paragraphes_longs:
            print(f"    {sid:34s} {m:>4} mots")

    ex = sorted((m for _, m in examens), reverse=True)
    print(f"\nEXAMENS DE POINTS (optionnels, droit d'être riches) — {len(examens)}")
    if ex:
        print(f"  médiane {median(ex):.0f} mots · max {ex[0]} (grille spec : 250-450 signes ≈ 40-75 mots)")

    if verbose:
        print("\nTOUS LES ÉCRANS (mots, décroissant) :")
        for sid, m, c, n in ecrans:
            marque = " ⚠" if m > SEUIL_ECRAN else ""
            print(f"  {sid:30s} {m:>4} mots · {n} ¶{marque}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
