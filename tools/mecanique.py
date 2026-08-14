#!/usr/bin/env python3
"""AUDIT DU LOT 4 — les phrases qui EXPLIQUENT une règle que le monde montre.

Cadrage de Patrick (14/08) : « retirer les phrases qui expliquent à nouveau une
mécanique que l'Anneau, le corps, l'objet ou le monde viennent déjà de montrer ».
Ce n'est PAS une passe de réécriture générale.

Ce que l'outil fait, et rien de plus : il liste les textes RÉELLEMENT AFFICHÉS
pendant une run qui contiennent un mot de moteur. Il ne décide rien — le tri
GARDER / RÉÉCRIRE / COUPER est éditorial et se fait à la main, ligne par ligne.

⚠️ Il n'est PAS branché dans `prebuild` : le vocabulaire mécanique est parfois
LÉGITIME (le tutoriel enseigne la règle, le Geôlier est le seul à voir les
chiffres, une métaphore peut emprunter le mot sans expliquer le moteur). Un
garde qui interdirait ces mots ferait plus de mal que de bien.

    python3 tools/mecanique.py            # tout
    python3 tools/mecanique.py --fichier scene-data.ts
"""
from __future__ import annotations
import re, sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
LIB = RACINE / "aldenhar" / "lib"
COMPO = RACINE / "aldenhar" / "components"

# Les sources dont la prose s'affiche PENDANT la run. Les archives
# (`data/archive-*.md`), la matière de production (`data/zones/*.json`,
# `scene-meta.json`) et les textes morts en sont exclus par construction :
# le lot ne juge que ce que le joueur lit.
SOURCES = [
    LIB / n for n in (
        "scene-data.ts", "besace.ts", "etats.ts", "reliques.ts",
        "loi-substitution.ts", "temoins.ts", "perception.ts", "contradictions.ts",
        "surprises.ts", "jailer-quotes.ts", "sceaux.ts", "prologue-data.ts",
        "chapters-data.ts", "registre-data.ts",
    )
] + [COMPO / n for n in ("Scene.tsx", "Intro.tsx", "DeathScreen.tsx", "Prologue.tsx")]

# Le vocabulaire de moteur, dans l'ordre du cadrage. Chaque motif est une
# QUESTION posée au texte, pas un verdict.
MOTIFS = {
    "un jet nommé":      r"\b(prochain jet|ton jet|le jet|un jet|tes chances|ta chance de)\b",
    "une facilité":      r"\b(plus facile|plus sûr|plus sûre|plus difficile|moins risqué)\b",
    # ⚠️ « seuil » est HORS de cette liste, et volontairement : dans ce jeu le
    # mot désigne presque toujours une PIERRE DE PORTE (« couché contre le
    # seuil », « le Seuil du Hameau », le prologue « Le Seuil »). Le chercher
    # rendait 30 faux positifs pour zéro trouvaille — même piège d'homonyme que
    # « porte » dans `immersion.py` le 10/08.
    "un chiffre caché":  r"\b(malus|bonus|modificateur|pénalit|pénalise|avantage de)\b",
    "une durée":         r"\b(pendant un temps|pour un temps|quelques scènes|trois scènes|deux scènes|un moment encore|un certain temps)\b",
    "un état nommé":     r"\b(ton état|l'état|un état|cet état)\b",
    "une stat nommée":   r"\b(ta stat|de stat|ton courage sera|ta ruse sera)\b",
    "le dé comme règle": r"\b(l'Anneau|la face du dé)\b",
    # Les périphrases qui disent la même chose sans le mot : c'est là que la
    # plupart des explications se cachent réellement.
    "un effet expliqué": (
        r"(joue pour toi|joue contre toi|tes gestes portent|tu t'en sors mieux|"
        r"plus facilement|tant qu'il tient|tant que tu (?:la|le|les) portes|"
        r"rend des forces|te sera utile|t'aidera)"
    ),
}

# Les textes qui ont le DROIT d'expliquer : le tutoriel enseigne les clauses du
# Pacte, et le Geôlier est le seul personnage qui voit les chiffres.
TOLERE = {"Intro.tsx"}


def chaines(src: str) -> list[tuple[int, str]]:
    """Les littéraux de chaîne, hors commentaires — avec leur ligne."""
    hors = []
    i, n = 0, len(src)
    while i < n:
        if src.startswith("//", i):
            j = src.find("\n", i)
            i = n if j < 0 else j
        elif src.startswith("/*", i):
            j = src.find("*/", i)
            i = n if j < 0 else j + 2
        elif src[i] in '"`':
            q = src[i]
            j = i + 1
            while j < n and src[j] != q:
                if src[j] == "\\":
                    j += 1
                j += 1
            hors.append((src.count("\n", 0, i) + 1, src[i + 1:j]))
            i = j + 1
        else:
            i += 1
    return hors


def main() -> int:
    seul = None
    if "--fichier" in sys.argv:
        seul = sys.argv[sys.argv.index("--fichier") + 1]

    total = 0
    for f in SOURCES:
        if seul and f.name != seul:
            continue
        if not f.exists():
            print(f"  (absent : {f.name})")
            continue
        trouve = []
        src = f.read_text()
        for ligne, t in chaines(src):
            # De la PROSE, pas une classe CSS ni un identifiant.
            if len(t) < 30 or " " not in t.strip():
                continue
            # Le catalogue des surprises porte des champs de DOCUMENTATION
            # (`contexte`, `garde`) affichés dans le Studio, jamais en run :
            # le cadrage dit d'auditer ce que le joueur lit.
            if re.search(r'\b(garde|contexte):\s*$|\b(garde|contexte):\s*"$',
                         src[:src.find(t)][-40:] or ""):
                continue
            for quoi, motif in MOTIFS.items():
                if re.search(motif, t, re.I):
                    trouve.append((ligne, quoi, t))
                    break
        if trouve:
            marque = "  (tutoriel — a le droit d'enseigner)" if f.name in TOLERE else ""
            print(f"\n=== {f.name} — {len(trouve)} ligne(s){marque}")
            for ligne, quoi, t in trouve:
                print(f"  {f.name}:{ligne}  [{quoi}]")
                print(f"      « {t[:180]}{'…' if len(t) > 180 else ''} »")
            total += len(trouve)

    print(f"\n{total} ligne(s) à trancher à la main (GARDER / RÉÉCRIRE / COUPER).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
