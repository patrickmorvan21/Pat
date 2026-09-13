#!/usr/bin/env python3
"""Contrôle d'intégrité d'un fichier de zone (data/zones/<zone>.json).

    python3 tools/verifier_zone.py data/zones/salines.json

Ce qu'il vérifie — et pourquoi chacun compte :
  • ids uniques dans chaque collection (un doublon = deux fiches qui divergent) ;
  • toute référence résout : `lieu_attache`, `environnement`, `fragments`,
    `rencontres`, `objets`, `combats` d'un lieu, `lieux` d'une créature ou d'un
    fragment, `sert` d'un objet, `entree`/`fin` d'un environnement — une
    référence morte est la « promesse sans consommateur » que ce projet a payée
    cinq fois ;
  • la forme des environnements passe l'audit de `lib/etages.ts` (même règle,
    portée en Python : doublon entre étapes, tirages impossibles, étape sans
    entrée ni pool) ;
  • chaque fragment a au moins un lieu, chaque objet un lieu de ramassage et
    au moins un lieu d'usage HORS de celui-ci (« se ramasse dans un lieu du pool
    et sert dans au moins deux autres » — la bible) ; un objet sans usage est
    SIGNALÉ, pas refusé : la Lanterne du Noyé est une promesse assumée pour
    l'Acte II ;
  • les comptes annoncés par la bible, s'ils sont déclarés dans
    `zone.comptes_annonces`, sont comparés aux comptes réels et l'écart est DIT.

Code de sortie 1 sur une référence morte ou un doublon ; les signalements
« mous » (objet sans usage, compte différent de l'annonce) n'échouent pas.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def verifier(chemin: Path) -> int:
    z = json.loads(chemin.read_text(encoding="utf-8"))
    erreurs: list[str] = []
    notes: list[str] = []

    def ids(coll: str) -> set[str]:
        vus: set[str] = set()
        for e in z.get(coll, []):
            i = e.get("id")
            if not i:
                erreurs.append(f"{coll} : une entrée sans id ({e.get('nom')!r})")
                continue
            if i in vus:
                erreurs.append(f"{coll} : id en double « {i} »")
            vus.add(i)
        return vus

    lieux = ids("lieux")
    rencontres = ids("rencontres")
    creatures = ids("creatures")
    objets = ids("objets")
    fragments = ids("fragments")
    envs = ids("environnements")

    def ref(ou: str, champ: str, val, cible: set[str], nom_cible: str) -> None:
        if val is None:
            return
        vals = val if isinstance(val, list) else [val]
        for v in vals:
            if v not in cible:
                erreurs.append(f"{ou} · {champ} = « {v} » : aucun {nom_cible} de cet id")

    # ── lieux. Depuis le tri du 13/09, un lieu peut être RETIRÉ, FUSIONNÉ dans
    # un autre, ou n'être qu'un BEAT D'ARRIVÉE d'environnement (le Fossé) :
    # il reste dans le fichier (la matière est gardée) mais il n'est plus
    # un lieu de la traversée — ni compté, ni tirable.
    ROLES_JOUES = ("entree", "pool", "fin")
    joues = {L["id"] for L in z.get("lieux", []) if L.get("role") in ROLES_JOUES}
    for L in z.get("lieux", []):
        ou = f"lieu {L['id']}"
        if L.get("role") not in ROLES_JOUES + ("arrivee", "retire", "fusionne"):
            erreurs.append(f"{ou} : role « {L.get('role')} » inconnu")
        if L.get("role") == "fusionne":
            ref(ou, "fusionne_dans", L.get("fusionne_dans"), joues, "lieu joué")
            if not L.get("fusionne_dans"):
                erreurs.append(f"{ou} : fusionné sans `fusionne_dans`")
        if L.get("role") in ("retire", "fusionne", "arrivee") and not L.get("raison"):
            erreurs.append(f"{ou} : role={L['role']} sans `raison` (une décision se dit)")
        ref(ou, "environnement", L.get("environnement"), envs, "environnement")
        ref(ou, "lieu_attache", L.get("lieu_attache"), lieux, "lieu")
        ref(ou, "fragments", L.get("fragments", []), fragments, "fragment")
        ref(ou, "rencontres", L.get("rencontres", []), rencontres, "rencontre")
        ref(ou, "objets", L.get("objets", []), objets, "objet")
        ref(ou, "combats", L.get("combats", []), creatures, "créature")
        for c in L.get("combats", []):
            cr = next((x for x in z["creatures"] if x["id"] == c), None)
            if cr and not cr.get("hostile"):
                erreurs.append(f"{ou} · combats : « {c} » n'est pas déclarée hostile")

    # ── rencontres / créatures / objets
    for r in z.get("rencontres", []):
        ref(f"rencontre {r['id']}", "lieu_attache", r.get("lieu_attache"), lieux, "lieu")
        if r.get("gardien") and not r.get("etats"):
            erreurs.append(f"rencontre {r['id']} : gardien sans `etats`")
    for c in z.get("creatures", []):
        ref(f"créature {c['id']}", "lieux", c.get("lieux", []), lieux, "lieu")
    for o in z.get("objets", []):
        ou = f"objet {o['id']}"
        ref(ou, "lieu_attache", o.get("lieu_attache"), lieux, "lieu")
        ref(ou, "sert", o.get("sert", []), lieux, "lieu")
        if not o.get("lieu_attache"):
            erreurs.append(f"{ou} : aucun lieu de ramassage")
        usages = [s for s in o.get("sert", []) if s != o.get("lieu_attache")]
        if o.get("usage_sur_place"):
            pass  # décision d'auteur : l'objet se dépense là où on le trouve (le Battant)
        elif not usages:
            notes.append(f"{ou} : aucun lieu d'usage hors de son lieu de ramassage (promesse à écrire ou à assumer)")
        elif len(usages) < 2:
            notes.append(f"{ou} : un seul lieu d'usage — la bible en demande « au moins deux »")
    for f in z.get("fragments", []):
        ou = f"fragment {f['id']}"
        ref(ou, "lieux", f.get("lieux", []), lieux, "lieu")
        ref(ou, "eclaire_a", f.get("eclaire_a", []), lieux, "lieu")
        if not f.get("lieux"):
            erreurs.append(f"{ou} : aucun lieu")
        # un fragment doit être PORTÉ par un lieu (le lieu le déclare aussi) —
        # sinon le graphe et le routage ne le verront pas
        porteurs = [L["id"] for L in z["lieux"] if f["id"] in L.get("fragments", [])]
        for l in f.get("lieux", []):
            if l in lieux and l not in joues:
                erreurs.append(f"{ou} : porté par « {l} », qui n'est plus un lieu joué")
        for l in f.get("lieux", []):
            if l not in porteurs:
                erreurs.append(f"{ou} : le lieu « {l} » ne le déclare pas dans ses `fragments`")

    # ── environnements : la même forme que lib/etages.ts (auditerEtages)
    vus: dict[str, str] = {}

    def note_env(i: str, ou: str) -> None:
        if i in vus:
            erreurs.append(f"étages : « {i} » apparaît deux fois ({vus[i]} et {ou})")
        vus[i] = ou

    for e in z.get("environnements", []):
        pool = [L["id"] for L in z["lieux"] if L.get("environnement") == e["id"] and L.get("role") == "pool"]
        if e.get("entree") is None and not pool:
            erreurs.append(f"étape {e['id']} : ni entrée ni pool")
        lo, hi = e.get("tirages", [0, 0])
        if lo > hi:
            erreurs.append(f"étape {e['id']} : tirages min > max")
        if hi > len(pool):
            erreurs.append(f"étape {e['id']} : tirages max ({hi}) > pool ({len(pool)})")
        if e.get("arrivee"):
            ref(f"étape {e['id']}", "arrivee", e["arrivee"], lieux, "lieu")
            A = next((x for x in z["lieux"] if x["id"] == e["arrivee"]), None)
            if A and (A.get("role") != "arrivee" or A.get("environnement") != e["id"]):
                erreurs.append(f"étape {e['id']} : « {e['arrivee']} » n'est pas déclaré role=arrivee de cette étape")
        if e.get("entree"):
            ref(f"étape {e['id']}", "entree", e["entree"], lieux, "lieu")
            note_env(e["entree"], f"{e['id']}/entree")
            L = next((x for x in z["lieux"] if x["id"] == e["entree"]), None)
            if L and (L.get("role") != "entree" or L.get("environnement") != e["id"]):
                erreurs.append(f"étape {e['id']} : « {e['entree']} » n'est pas déclaré role=entree de cette étape")
        for p in pool:
            note_env(p, f"{e['id']}/pool")
        for fid in e.get("fin", []):
            ref(f"étape {e['id']}", "fin", fid, lieux, "lieu")
            note_env(fid, f"{e['id']}/fin")
            L = next((x for x in z["lieux"] if x["id"] == fid), None)
            if L and (L.get("role") != "fin" or L.get("environnement") != e["id"]):
                erreurs.append(f"étape {e['id']} : « {fid} » n'est pas déclaré role=fin de cette étape")
    # tout lieu à role entree/fin doit être cité par son environnement
    for L in z.get("lieux", []):
        if L.get("role") in ("entree", "fin"):
            e = next((x for x in z["environnements"] if x["id"] == L.get("environnement")), None)
            cite = e and (e.get("entree") == L["id"] or L["id"] in e.get("fin", []))
            if not cite:
                erreurs.append(f"lieu {L['id']} : role={L['role']} mais son environnement ne le cite pas")

    # ── comptes
    comptes = {
        "lieux": len(joues), "obligatoires": sum(1 for L in z["lieux"] if L.get("statut") == "obligatoire"),
        "rencontres": len(rencontres), "creatures": len(creatures), "objets": len(objets),
        "fragments": len(fragments), "environnements": len(envs),
    }
    annonce = (z.get("zone") or {}).get("comptes_annonces") or {}
    for k, v in annonce.items():
        if comptes.get(k) != v:
            notes.append(f"compte « {k} » : la bible annonce {v}, le fichier en porte {comptes.get(k)}")

    print(f"{chemin.name} — " + " · ".join(f"{k} {v}" for k, v in comptes.items()))
    for n in notes:
        print(f"  ~ {n}")
    for e in erreurs:
        print(f"  ✗ {e}")
    print("  ✓ aucune référence morte, aucun doublon" if not erreurs else f"  {len(erreurs)} erreur(s)")
    return 1 if erreurs else 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(verifier(Path(sys.argv[1])))
