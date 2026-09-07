#!/usr/bin/env python3
"""MESURER LA LÉTALITÉ — combien de vies finissent comment, et par quel canal.

Retour Patrick du 07/09 : « c'est toujours facile, je ne meurs jamais sauf à
cause des soupçons. » Avant de toucher au moindre barème, on compte : la
mesure du 02/09 avait déjà corrigé deux intuitions fausses, et deux vies ne
prouvent rien (leçon du 12/08 — le bruit est de la taille de l'effet).

⚠️ IL MESURE LA RÉPLIQUE (`pactum.py`), PAS LE JEU. Elle porte le vrai modèle
de coût, la vraie traversée et le vrai enchaînement, mais pas les images, les
gestes tactiles ni les minutages. Ce qu'on lit ici est l'ÉCONOMIE, pas la
sensation.

⚠️ Le compte de la réplique (`compte.json`) est isolé par exécution : sinon
`entrySoftening` (l'adoucissement des trois premières morts) contamine les
mesures d'un lot à l'autre — défaut mesuré le 10/08.

Usage :  python3 tools/letalite.py [--vies=12]
"""
from __future__ import annotations

import json
import pathlib
import random
import sys
import tempfile

ICI = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ICI))


def charger(dossier: pathlib.Path):
    """Importe la réplique en redirigeant ses deux fichiers d'état."""
    import importlib

    import pactum

    importlib.reload(pactum)
    pactum.SAUVE = dossier / "partie.json"
    pactum.COMPTE = dossier / "compte.json"
    return pactum


# Les stratégies contrastées. Chacune décrit COMMENT on choisit sur un écran.
def _risque(o) -> bool:
    """L'option arme-t-elle le dé ? (la stat vit dans `o["c"]`, pas à la racine)"""
    return bool(o.get("kind") == "choix" and (o.get("c") or {}).get("type") == "risque")


def strat_prudent(opts, rng):
    """Ne lance jamais le dé s'il existe une autre issue."""
    sans = [i for i, o in enumerate(opts) if not _risque(o)]
    return (rng.choice(sans) if sans else rng.randrange(len(opts))) + 1


def strat_temeraire(opts, rng):
    """Lance le dé dès que c'est possible."""
    avec = [i for i, o in enumerate(opts) if _risque(o)]
    return (rng.choice(avec) if avec else rng.randrange(len(opts))) + 1


def strat_curieux(opts, rng):
    """Regarde ce qui ne coûte rien, engage le dé une fois sur trois."""
    obs = [i for i, o in enumerate(opts) if not _risque(o) and o["kind"] != "aller"]
    avec = [i for i, o in enumerate(opts) if _risque(o)]
    if avec and rng.random() < 0.34:
        return rng.choice(avec) + 1
    return (rng.choice(obs) if obs else rng.randrange(len(opts))) + 1


STRATEGIES = {
    "prudent": strat_prudent,
    "téméraire": strat_temeraire,
    "curieux": strat_curieux,
}


def une_vie(pactum, graine: int, choisir) -> dict:
    rng = random.Random(graine * 7919 + 13)
    p = pactum.Partie.neuve(graine)
    ecrans = 0
    while ecrans < 500:
        ecrans += 1
        if p.d.get("morte"):
            break
        if p.d.get("sortie"):
            break
        opts = p.choix()
        if not opts:
            break
        try:
            p.jouer(choisir(opts, rng))
        except SystemExit:
            break
        except Exception as exc:  # noqa: BLE001 — un plantage est une donnée
            return {"fin": "PLANTAGE", "erreur": repr(exc)[:120], "ecrans": ecrans}
    des = p.d.get("des", [])
    return {
        "fin": "mort" if p.d.get("morte") else (p.d.get("sortie") or "inachevée"),
        "cause": (p.d.get("scene") or ""),
        "sante": round(p.d.get("sante", 0), 2),
        "soupcon": p.d.get("soupcon", 0),
        "jour": p.d.get("jour", 0),
        "des": len(des),
        "ecrans": ecrans,
        "lieux": len(p.d.get("visites", [])),
    }


def main() -> int:
    vies = 12
    for a in sys.argv[1:]:
        if a.startswith("--vies="):
            vies = int(a.split("=")[1])

    print(f"LÉTALITÉ — {vies} vies par stratégie, comptes isolés\n")
    total = {}
    for nom, fn in STRATEGIES.items():
        with tempfile.TemporaryDirectory() as tmp:
            d = pathlib.Path(tmp)
            pactum = charger(d)
            res = [une_vie(pactum, g, fn) for g in range(1, vies + 1)]
        morts = [r for r in res if r["fin"] == "mort"]
        plantages = [r for r in res if r["fin"] == "PLANTAGE"]
        sorties = [r for r in res if r["fin"] == "descente"]
        sante = [r["sante"] for r in res if r["fin"] != "PLANTAGE"]
        des = [r["des"] for r in res if r["fin"] != "PLANTAGE"]
        soup = [r["soupcon"] for r in res if r["fin"] != "PLANTAGE"]
        causes: dict[str, int] = {}
        for m in morts:
            c = "procès (Soupçon)" if "proces" in m["cause"] else "corps"
            causes[c] = causes.get(c, 0) + 1
        total[nom] = {
            "morts": len(morts),
            "sorties": len(sorties),
            "causes": causes,
            "sante_moy": round(sum(sante) / max(1, len(sante)), 2),
            "des_moy": round(sum(des) / max(1, len(des)), 1),
            "soupcon_moy": round(sum(soup) / max(1, len(soup)), 1),
            "plantages": len(plantages),
        }
        t = total[nom]
        print(
            f"  {nom:11s} morts {t['morts']:2d}/{vies}  sorties {t['sorties']:2d}"
            f"  santé fin {t['sante_moy']:.2f}  dés {t['des_moy']:4.1f}"
            f"  soupçon {t['soupcon_moy']:.1f}  causes {t['causes'] or '—'}"
        )
        if plantages:
            print(f"    ⚠️ {len(plantages)} plantage(s) : {plantages[0]['erreur']}")

    print(json.dumps(total, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
