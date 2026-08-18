#!/usr/bin/env python3
"""
AUDIT RISQUE/PRUDENCE + TAPS MORTS — §5 et §6 du compte rendu du 17/08.

Quatre relevés, AVANT tout code (l'ordre imposé par le document) :

  1. SÛR+RAPIDE+GRATUIT : les choix passifs qui sortent d'une scène à risque
     sans rien payer ni laisser (ni Soupçon, ni dette, ni état, ni serment,
     ni menace). C'est la combinaison que le document interdit — pas les
     choix sûrs en général.
  2. MENACES QUI S'ÉVAPORENT : les combats de la zone × leurs évitements —
     ce qui reste dans le monde quand on les contourne (aujourd'hui : rien).
  3. TAPS MORTS : les scènes dont l'unique action est un « continuer »
     (fusion candidates §6) — en excluant les beats à tap MÉRITÉ listés par
     le document (mort, Sceau, révélation, bascule du Hameau, chapitre).
  4. L'OUVERTURE : mots de narration avant le premier choix, compte frais et
     compte vétéran (le budget d'écran est de 90 mots — au-delà, chaque
     tranche de 90 est un tap de plus avant la première décision).

Lecture : data/studio-data.json (regénéré si plus vieux que scene-data.ts,
même règle que aiguillage.py/strates.py).
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SD = RACINE / "aldenhar" / "lib" / "scene-data.ts"
EXPORT = RACINE / "data" / "studio-data.json"

# Les charges qu'un choix peut porter : s'il en porte UNE, il n'est pas
# « gratuit ». (Champs de l'export Studio — un champ absent de cette liste
# ET de l'export serait invisible : la liste blanche est le point de fuite
# habituel, vérifier studio_data.py avant d'accuser le jeu.)
CHARGES = (
    "soupcon", "dette", "serment", "poseEtat", "poseEtatSiEchec", "fait",
    "donneSavoir", "donneDecouverte", "donneObjet", "grantsLoot", "rompLeSerment",
    "citable", "sortie", "orient", "useItem", "exigeUsage", "laisseMenace",
    # « Choix certain = prix certain » (17/08) : une sortie qui referme la
    # Croisée suivante PAIE — la lister « gratuite » ferait mentir l'audit.
    "fermeLaRoute",
)

# Libellés de continuation pure (minuscule, sans accents normalisés grossiers).
CONTINUER = re.compile(
    r"^(continuer|repartir|avancer|poursuivre|reprendre la route|"
    r"reprendre le chemin|passer son chemin|s'?éloigner|partir|sortir|"
    r"quitter|redescendre|rejoindre|retourner|laisser|longer)\b",
    re.I,
)

# Taps MÉRITÉS (§6) : jamais des candidats à la fusion.
MERITES = {"la-descente", "renoncer", "proces-du-heros"}


def export_a_jour() -> dict:
    if not EXPORT.exists() or EXPORT.stat().st_mtime < SD.stat().st_mtime:
        subprocess.run([sys.executable, str(RACINE / "tools" / "studio_data.py")],
                       check=True, capture_output=True)
    return json.loads(EXPORT.read_text(encoding="utf8"))


def mots(txt) -> int:
    if isinstance(txt, list):
        return sum(mots(t) for t in txt)
    return len(re.findall(r"\S+", txt or ""))


def main() -> int:
    d = export_a_jour()
    scenes = {s["id"]: s for s in d["scenes"]}
    src = SD.read_text(encoding="utf8")

    # ── 1. sûr + rapide + gratuit sur une scène À RISQUE ─────────────────
    print("── 1. SORTIES SÛRES ET GRATUITES DE SCÈNES À RISQUE ──")
    gratuits = []
    for s in d["scenes"]:
        choix = s.get("choix") or []
        risques = [c for c in choix if c.get("type") == "risqué" or c.get("stat")]
        if not risques:
            continue  # pas une scène à risque : un passif y est normal
        for c in choix:
            if c.get("type") != "passif":
                continue
            if any(c.get(ch) for ch in CHARGES):
                continue
            gratuits.append((s["id"], c.get("label", "?")))
    for sid, lab in gratuits:
        print(f"   {sid:28s} « {lab} »")
    print(f"   → {len(gratuits)} sortie(s) sûre(s) gratuite(s) face à un jet.\n")

    # ── 2. les menaces qui s'évaporent ───────────────────────────────────
    print("── 2. MENACES CONTOURNABLES QUI DISPARAISSENT DU MONDE ──")
    combats = [s for s in d["scenes"] if "combat" in json.dumps(s.get("etat") or {})
               or re.search(rf'id: "{s["id"]}"[\s\S]{{0,600}}?combat: true', src)]
    for s in combats:
        evits = [c.get("label") for c in (s.get("choix") or [])
                 if c.get("type") == "passif" and not any(c.get(ch) for ch in CHARGES)]
        if evits:
            print(f"   {s['id']:28s} évitement(s) : {evits}")
    print("   (+ le contournement de CROISÉE : une menace offerte en indice de")
    print("    route et refusée ne laisse aujourd'hui AUCUNE trace.)\n")

    # ── 3. taps morts : l'unique action est « continuer » ────────────────
    print("── 3. ÉCRANS À CONTINUATION PURE (candidats à la fusion §6) ──")
    morts = []
    for s in d["scenes"]:
        if s["id"] in MERITES:
            continue
        choix = s.get("choix") or []
        if len(choix) == 1 and choix[0].get("type") == "passif" \
                and CONTINUER.match(choix[0].get("label", "")) \
                and not any(choix[0].get(ch) for ch in CHARGES if ch not in ("sortie",)):
            morts.append((s["id"], choix[0].get("label"), mots(s.get("narration"))))
    for sid, lab, n in morts:
        print(f"   {sid:28s} « {lab} » ({n} mots de narration)")
    print(f"   → {len(morts)} écran(s) dont l'unique action tourne la page.\n")

    # ── 4. l'ouverture ───────────────────────────────────────────────────
    print("── 4. L'OUVERTURE (budget d'écran : 90 mots) ──")
    borne = scenes.get("borne-frontiere", {})
    base = mots(borne.get("narration"))
    # Les injections d'ouverture (à lire dans Scene.tsx — approximation par
    # les pools : marque du Sceau ~35 mots, trace de mort ~25).
    print(f"   narration de la Borne : {base} mots")
    print(f"   + compte vétéran (Sceau ~35 + trace ~25) : ~{base + 60} mots")
    print(f"   écrans avant la première décision : frais ~{-(-base // 90)}, "
          f"vétéran ~{-(-(base + 60) // 90)} (cible §6 : décision à l'écran 2)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
