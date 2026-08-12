#!/usr/bin/env python3
"""
AUDIT FEEDBACK + FLUIDITÉ — les six relevés exigés par le §12 du chantier.

    2) les scènes à plus d'UN tap de lecture avant décision
    3) les reliquats du sous-menu « Observer »
    4) les CTA trop longs (candidats à la troncature)
    5) la logique d'entrée / sortie / revisite des lieux uniques
    6) le tableau Action → Feedback immédiat → Effet/flag → Consommateur futur

⚠️ Ce script ne modifie RIEN. Le §12 exige l'audit avant toute correction.

⚠️ Deux limites à connaître avant de lire les chiffres :
  • le nombre de taps est calculé sur la narration ÉCRITE. À l'exécution,
    l'arrivée ajoute des blocs (phrase d'approche, franchissement du village,
    puce Jour, carte d'état, rumeur…) : le tap réel est donc ≥ celui-ci.
  • la troncature d'un CTA ne se prouve QUE dans le navigateur (`FitLabel`
    réduit la police jusqu'à 8 px avant d'élider). La longueur listée ici est
    un signalement, pas une preuve — voir la vérification DOM.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / "tools"))
from audit_boucle import BUDGET_ECRAN, bloc, chaines, champ, sans_commentaires, scenes, tableau  # noqa: E402

SD = RACINE / "aldenhar/lib/scene-data.ts"
SC = RACINE / "aldenhar/components/Scene.tsx"
# Longueur au-delà de laquelle un libellé descend sous 10 px avec son tag de
# stat sur 390 px — seuil de SIGNALEMENT, la preuve se fait au DOM.
LONG_SUR = 34


def chunks(paras: list[str]) -> int:
    mots, n = 0, 1
    for p in paras:
        m = len(p.split())
        if mots and mots + m > BUDGET_ECRAN:
            n += 1
            mots = m
        else:
            mots += m
    return n


def main() -> int:
    brut = SD.read_text(encoding="utf8")
    src = sans_commentaires(brut)
    sc = SC.read_text(encoding="utf8")
    S = scenes(src)
    if not S:
        print("⚠️ analyseur cassé — ne rien conclure.")
        return 2
    print(f"AUDIT FEEDBACK + FLUIDITÉ — {len(S)} scènes\n")

    # ── 2) taps de lecture avant décision ────────────────────────────────
    lourds = []
    for s in S:
        if not s["choix"]:
            continue
        n = chunks(s["narration"])
        if n - 1 > 1:
            lourds.append((n - 1, s["id"], len(" ".join(s["narration"]).split())))
    lourds.sort(reverse=True)
    tot_dec = len([s for s in S if s["choix"]])
    print(f"■ 2. TAPS AVANT DÉCISION (cible : ≤ 1) — {len(lourds)} scène(s) au-dessus "
          f"sur {tot_dec} scènes à décision")
    for t, sid, m in lourds[:20]:
        print(f"     {t} taps · {m:4d} mots · {sid}")
    if not lourds:
        print("     aucune, sur la narration écrite")
    print("     ⚠️ à l'exécution l'arrivée AJOUTE des blocs : le tap réel est ≥ celui-ci.\n")

    # ── 3) reliquats du sous-menu Observer ───────────────────────────────
    avec_poi = [(len(s["pois"]), s["id"]) for s in S if s["pois"]]
    avec_poi.sort(reverse=True)
    total_poi = sum(n for n, _ in avec_poi)
    ui = len(re.findall(r'Observer les alentours', sc))
    print(f"■ 3. RELIQUATS « OBSERVER » — {len(avec_poi)} scène(s) portent encore "
          f"des points d'intérêt ({total_poi} au total)")
    for n, sid in avec_poi:
        print(f"     {n} point(s) · {sid}")
    print(f"     le libellé générique existe encore {ui}× dans Scene.tsx "
          f"(il n'apparaît que si une scène a des points)\n")

    # ── 4) CTA candidats à la troncature ─────────────────────────────────
    longs = []
    for s in S:
        for c in s["choix"]:
            lab = c["label"]
            if len(lab) > LONG_SUR:
                longs.append((len(lab), s["id"], lab, c["risky"]))
    longs.sort(reverse=True)
    print(f"■ 4. CTA LONGS (> {LONG_SUR} car.) — {len(longs)} signalement(s)")
    for n, sid, lab, risky in longs[:24]:
        tag = " +tag de stat" if risky else ""
        print(f"     {n:3d} car.{tag:13s} « {lab} »  ({sid})")
    print()

    # ── 5) lieux uniques : entrée / sortie / revisite ────────────────────
    print("■ 5. LIEUX UNIQUES — entrée, sortie, revisite")
    hameau_int = re.search(r'HAMEAU_INTERIOR = \[(.*?)\]', src, re.S)
    membres = re.findall(r'"([a-z0-9-]+)"', hameau_int.group(1)) if hameau_int else []
    print(f"     intérieur du Hameau : {', '.join(membres)}")
    gate = re.search(r'HAMEAU_GATE = "([a-z-]+)"', src)
    print(f"     porte d'entrée : {gate.group(1) if gate else '?'}")
    for quoi, motif in [
        ("le pool exclut-il un lieu déjà visité ?", r"lieuDejaVisite\(visited"),
        ("la séquence d'arrivée est-elle retirée après l'entrée ?", r"hameauEntree.*?HAMEAU_GATE|HAMEAU_GATE.*?hameauEntree"),
        ("existe-t-il un beat de sortie du village ?", r"FRANCHIT_SORTIE"),
        ("un drapeau marque-t-il la halte faite ?", r"hameauHalte"),
    ]:
        ok = bool(re.search(motif, src, re.S)) or bool(re.search(motif, sc, re.S))
        print(f"     {'oui' if ok else 'NON'}  {quoi}")
    print()

    # ── 6) Action → Feedback → Effet → Consommateur ──────────────────────
    lus_savoir = set(re.findall(r'requiresSavoir:\s*"([^"]+)"', src))
    lus_dec = set(re.findall(r'requiresDecouverte:\s*"([^"]+)"', src))
    lus_dec |= set(re.findall(r'has:\s*"(d\.[^"]+)"', src))
    lus_dec |= set(re.findall(r'"(d\.[a-z_]+)"', sc))
    for m in re.finditer(r'export const ([A-Z_]+)\s*=\s*\[([^\]]*)\]', src):
        membres_l = {f"d.{x}" for x in re.findall(r'D\("([a-z_]+)"\)', m.group(2))}
        if membres_l and (len(re.findall(rf'\b{m.group(1)}\b', src)) > 1 or m.group(1) in sc):
            lus_dec |= membres_l
    lus_flag = set(re.findall(r'envFlags\["([^"]+)"\]', brut + sc))
    besace = (RACINE / "aldenhar/lib/besace.ts").read_text(encoding="utf8")

    print("■ 6. ACTION → FEEDBACK IMMÉDIAT → EFFET → CONSOMMATEUR FUTUR")
    muettes, sans_conso = [], []
    for s in S:
        for c in s["choix"]:
            # ce que l'action POSE
            b = None
            for mm in re.finditer(rf'id: "{re.escape(c["id"])}"', src):
                b = bloc(src, src.rindex("{", 0, mm.start()))
                break
            if not b:
                continue
            effets = []
            for f in ("grantsLoot", "grantsSavoir", "decouverte", "setsEnvFlag", "debt"):
                v = champ(b, f)
                if v:
                    effets.append((f, v))
            if re.search(r'\bsoupcon:\s*-?\d', b):
                effets.append(("soupcon", ""))
            if not effets:
                continue
            # FEEDBACK IMMÉDIAT : une conséquence écrite, ou les issues d'un jet
            feedback = bool(re.search(r'\bconsequence:', b)) or c["risky"]
            # CONSOMMATEUR FUTUR
            conso = []
            for f, v in effets:
                if f == "grantsSavoir":
                    conso.append(v in lus_savoir)
                elif f == "decouverte":
                    conso.append(v in lus_dec)
                elif f == "setsEnvFlag":
                    conso.append(v in lus_flag)
                elif f == "grantsLoot":
                    conso.append(f'"{v}"' in besace)
                else:
                    conso.append(True)
            if not feedback:
                muettes.append((s["id"], c["label"], [f for f, _ in effets]))
            if not any(conso):
                sans_conso.append((s["id"], c["label"],
                                   [f"{f}={v}" for (f, v), k in zip(effets, conso) if not k]))
    print(f"     actions SANS feedback immédiat écrit : {len(muettes)}")
    for sid, lab, fs in muettes[:14]:
        print(f"       « {lab[:40]} » ({sid}) pose {', '.join(fs)}")
    print(f"     actions dont AUCUN effet n'a de consommateur : {len(sans_conso)}")
    for sid, lab, fs in sans_conso[:14]:
        print(f"       « {lab[:40]} » ({sid}) → {', '.join(fs)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
