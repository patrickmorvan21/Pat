#!/usr/bin/env python3
"""
COMPARAISON AVANT / APRÈS — les cinq métriques du chantier de simplification.

Usage : python3 tools/comparer_boucle.py AVANT.json APRES.json

⚠️ DÉFINITION STRICTE DE « DÉCISION », et pourquoi elle compte.
Un écran ne compte comme décision que si l'action prise CHANGE LE MONDE.
Ouvrir « Observer les alentours », le refermer, ou examiner un point d'intérêt
sont des taps d'exploration, pas des décisions.

Sans cette règle, la mesure se retourne contre le chantier : chaque sous-menu
ouvert comptait pour un « écran à décision », donc SUPPRIMER les sous-menus
faisait BAISSER le score. On mesurerait une amélioration comme une régression.

Les deux instantanés doivent avoir été produits par `tools/mesure_boucle.mjs`
sur le MÊME profil de héros (voir la note sur les minuscules dans ce fichier).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

OBS = "Observer les alentours"
FER = "Ne rien regarder de plus"


def strictes(r: dict) -> int:
    return len([e for e in r["log"] if e["pris"] not in (OBS, FER) and not e["sousMenu"]])


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    av = json.loads(Path(sys.argv[1]).read_text(encoding="utf8"))
    ap = json.loads(Path(sys.argv[2]).read_text(encoding="utf8"))
    lieux = [k for k in av if k in ap and not k.startswith("_")]

    print(f"{'lieu':20s} {'profil':9s} {'écrans':>13} {'% décision':>16} "
          f"{'taps/déc':>15} {'arrivée':>11} {'sous-menus':>12} {'POI':>9}")
    print("─" * 112)
    tot = {"eA": 0, "eP": 0, "dA": 0, "dP": 0, "sA": 0, "sP": 0, "pA": 0, "pP": 0}
    for lieu in lieux:
        for prof in ("curieuse", "pressee"):
            a, b = av[lieu][prof], ap[lieu][prof]
            da, db = strictes(a), strictes(b)
            ea, eb = a["ecrans"], b["ecrans"]
            ta = (ea - da) / max(1, da)
            tb = (eb - db) / max(1, db)
            print(f"{lieu:20s} {prof:9s} {ea:5d} → {eb:<5d} "
                  f"{100*da/ea:5.0f}% → {100*db/eb:<6.0f}% "
                  f"{ta:6.2f} → {tb:<6.2f} "
                  f"{a['actionsArrivee'] or 0:4d} → {b['actionsArrivee'] or 0:<4d} "
                  f"{a['sousMenus']:5d} → {b['sousMenus']:<5d} "
                  f"{a['poiConsultes']:3d} → {b['poiConsultes']:<3d}")
            tot["eA"] += ea; tot["eP"] += eb
            tot["dA"] += da; tot["dP"] += db
            tot["sA"] += a["sousMenus"]; tot["sP"] += b["sousMenus"]
            tot["pA"] += a["poiConsultes"]; tot["pP"] += b["poiConsultes"]
    print("─" * 112)
    print(f"{'TOTAL':30s} {tot['eA']:5d} → {tot['eP']:<5d} "
          f"{100*tot['dA']/tot['eA']:5.0f}% → {100*tot['dP']/tot['eP']:<6.0f}% "
          f"{(tot['eA']-tot['dA'])/tot['dA']:6.2f} → {(tot['eP']-tot['dP'])/tot['dP']:<6.2f} "
          f"{'':11s}{tot['sA']:5d} → {tot['sP']:<5d} {tot['pA']:3d} → {tot['pP']:<3d}")

    # ── les six critères bloquants, sur ce que la mesure peut prouver ──────
    print("\nCRITÈRES BLOQUANTS — ce que CETTE mesure démontre")
    arrivees = [ap[l][p]["actionsArrivee"] or 0 for l in lieux for p in ("curieuse", "pressee")]
    verdicts = [
        ("A. plus de sous-menu « Observer »", tot["sP"] == 0,
         f"{tot['sP']} ouverture(s) sur le lot"),
        ("B. au plus 3 décisions à l'arrivée", max(arrivees) <= 3,
         f"maximum observé : {max(arrivees)}"),
        ("F. moins d'écrans avant décision", tot["dP"] and
         (tot["eP"] - tot["dP"]) / tot["dP"] < (tot["eA"] - tot["dA"]) / tot["dA"],
         f"{(tot['eA']-tot['dA'])/tot['dA']:.2f} → {(tot['eP']-tot['dP'])/tot['dP']:.2f} tap(s)"),
    ]
    for nom, ok, detail in verdicts:
        print(f"  {'PASS' if ok else 'FAIL'}  {nom:38s} {detail}")
    print("\n  C (exclusivité), D (utilité de l'exploration) et E (états) ne se")
    print("  prouvent pas par ce banc : voir `tools/audit_boucle.py` pour D,")
    print("  et une vérification en jeu pour C et E.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
