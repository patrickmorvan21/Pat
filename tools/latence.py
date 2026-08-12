#!/usr/bin/env python3
"""
LA LATENCE POST-DÉCISION — ce qu'on lit APRÈS avoir choisi.

Recadrage validé le 12/08 : « le problème n'est plus *trop de descriptions*,
mais *trop de texte après que le joueur a déjà pris sa décision*. »
Mesuré sur les sources : les issues de jet pèsent 49 % du texte lu et les
conséquences 19 %, contre 21 % pour la narration de scène.

Cet outil liste ce qu'il faut réécrire, avec les PICS exclus du plafond.

    Conséquence standard   20-45 mots
    Conséquence lourde     45-60 mots   (si elle transforme la situation)
    Issue de jet standard  15-35 mots
    Issue importante       35-50 mots   (blessure, complication, découverte)
    Pic exceptionnel       > 60 possible — mort, révélation majeure, Grand
                           Témoin, confrontation, bascule de chapitre.

⚠️ RÈGLE QUI PRIME SUR LE PLAFOND : « ne pas confondre concision et
sécheresse — PACTUM doit garder sa voix, mais rendre la main plus vite. »
Un texte n'est coupé que s'il fait perdre du temps SANS fonction ajoutée.

Usage : python3 tools/latence.py [--issues]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / "tools"))
from audit_boucle import sans_commentaires  # noqa: E402

SD = RACINE / "aldenhar/lib/scene-data.ts"
PLAFOND = 60

# Les PICS — un moment qui MÉRITE le ralentissement. Exclus du plafond.
# Mort, révélation majeure, Grand Témoin, confrontation, bascule de chapitre.
PICS = re.compile(
    r"proces-du-heros|temoin-toit|temoin-ruelle|grand-temoin|la-descente|"
    r"meute-grise|fille-moulin|pendu-qui-parle|hameau-entree-4|renoncer"
)


def texte_concat(m: str) -> str:
    return " ".join(re.findall(r'"((?:[^"\\]|\\.)*)"', m))


def contexte(src: str, pos: int) -> tuple[str, str]:
    """(scène, choix) qui CONTIENNENT cette position.

    ⚠️ NE JAMAIS prendre « le dernier id vu avant ». L'id d'un choix précède
    sa conséquence dans le même objet, donc pour tout choix suivant le
    dernier id vu reste celui d'AVANT. Cette erreur, commise le 12/08 dans
    un script de réécriture, a écrasé trois conséquences différentes avec
    le même texte — dont un pic exempté. On cherche l'objet ENGLOBANT.
    """
    av = src[:pos]
    scenes = re.findall(r'\n    id: "([a-z0-9-]+)"', av)
    debut = av.rfind("\n      {")
    bloc = src[debut:pos] if debut >= 0 else ""
    m = re.search(r'\n\s*id: "([a-z0-9-]+)"', bloc)
    return (scenes[-1] if scenes else "?"), (m.group(1) if m else "?")


def main() -> int:
    src = sans_commentaires(SD.read_text(encoding="utf8"))

    cons = []
    for m in re.finditer(
            r'\bconsequence:\s*("(?:[^"\\]|\\.)*"(?:\s*\+\s*"(?:[^"\\]|\\.)*")*)', src):
        t = texte_concat(m.group(1))
        sid, cid = contexte(src, m.start())
        cons.append((len(t.split()), sid, cid, t))

    issues = []
    for m in re.finditer(r'outcomes\(([\s\S]*?)\n\s*\),', src):
        sid, cid = contexte(src, m.start())
        # L'ordre est verrouillé : critique · réussite · échec · funeste.
        for i, t in enumerate(re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(1))):
            palier = ["critique", "réussite", "échec", "funeste"][i] if i < 4 else "?"
            issues.append((len(t.split()), sid, cid, palier, t))

    def pic(sid: str) -> bool:
        return bool(PICS.search(sid))

    gros_c = sorted([c for c in cons if c[0] > PLAFOND], reverse=True)
    gros_i = sorted([i for i in issues if i[0] > PLAFOND], reverse=True)

    print(f"LA LATENCE POST-DÉCISION — plafond {PLAFOND} mots\n")
    print(f"■ CONSÉQUENCES > {PLAFOND} mots : {len(gros_c)} "
          f"(sur {len(cons)}) · cible 20-45\n")
    for n, sid, cid, t in gros_c:
        marque = "  ← PIC, exempté" if pic(sid) else ""
        print(f"   {n:3d} · {sid:24s} {cid:26s}{marque}")

    print(f"\n■ ISSUES DE JET > {PLAFOND} mots : {len(gros_i)} "
          f"(sur {len(issues)}) · cible 15-35\n")
    for n, sid, cid, palier, t in gros_i:
        marque = "  ← PIC, exempté" if pic(sid) else ""
        print(f"   {n:3d} · {palier:9s} {sid:24s} {cid:24s}{marque}")

    a_faire_c = [c for c in gros_c if not pic(c[1])]
    a_faire_i = [i for i in gros_i if not pic(i[1])]
    print(f"\n   à réécrire : {len(a_faire_c)} conséquences · {len(a_faire_i)} issues")
    print(f"   exemptés   : {len(gros_c)-len(a_faire_c)} + {len(gros_i)-len(a_faire_i)} pics")

    if "--issues" in sys.argv:
        print("\n" + "═" * 70)
        for n, sid, cid, t in a_faire_c:
            print(f"\n### CONSÉQUENCE {n} mots · {sid} / {cid}\n{t}")
        for n, sid, cid, palier, t in a_faire_i:
            print(f"\n### ISSUE {n} mots · {palier} · {sid} / {cid}\n{t}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
