#!/usr/bin/env python3
"""
LE RYTHME D'UNE VIE ENTIÈRE — la mesure que le banc ne sait pas faire.

`tools/mesure_boucle.mjs` pose le héros DANS un lieu : il ne joue jamais
d'arrivée, donc il ne mesure ni l'assemblage d'arrivée ni les objets. Or la
métrique que le chantier réclame (§5 du mémo : « le nombre de taps avant la
prochaine décision significative ») ne se lit que sur une vie complète.

Cet outil lit les transcripts produits par `tools/joueur.mjs` — des parties
réellement jouées sur le build publié — et en tire :

    · taps de LECTURE avant chaque décision (le chiffre du §5)
    · mots par écran, et la queue des écrans les plus lourds
    · les écrans où l'on tapote sans rien décider (les « rafales »)
    · ce que le monde a retenu : objets gagnés puis sortis, découvertes
      qui rouvrent une option, retours de choix

⚠️ Ce que cet outil NE dit PAS : la sensation. Il donne les chiffres sur
lesquels un humain juge. Le verdict reste à Patrick, manette en main.

Usage : python3 tools/rythme.py data/transcripts/v179-*.md
"""
from __future__ import annotations

import re
import statistics
import sys
from pathlib import Path

# Un écran de lecture pure : le joueur a tapé pour faire défiler, rien d'autre.
LECTURE = "(touche pour continuer)"
STAT = re.compile(r"\b(COURAGE|RUSE|INSTINCT|EMPATHIE)\b")


def ecrans(md: str) -> list[dict]:
    """Découpe un transcript en écrans {texte, choix[], action}."""
    out: list[dict] = []
    for bloc in re.split(r"^### Écran \d+\s*$", md, flags=re.M)[1:]:
        choix = re.findall(r"^- (.+)$", bloc, flags=re.M)
        act = re.search(r"^→ \*(.+)\*$", bloc, flags=re.M)
        # Le corps = tout ce qui précède la liste des choix / la flèche.
        corps = re.split(r"\n\*\*Choix proposés|\n→ \*", bloc)[0].strip()
        out.append({
            "texte": corps,
            "mots": len(corps.split()),
            "choix": choix,
            "action": act.group(1).strip() if act else "",
        })
    return out


def rythme(es: list[dict]) -> dict:
    """Taps de lecture avant chaque décision, et les rafales."""
    avant, courant, rafales = [], 0, []
    # ⚠️ Nommer la rafale par l'écran de DÉCISION ne dit rien : sur un séjour
    # il vaut « (même écran, choix suivant) ». Ce qu'on veut voir, c'est le
    # texte que le joueur était en train de faire défiler.
    dernier_lu = ""
    for e in es:
        # Un dé lancé n'est pas un tap de lecture : c'est la décision qui se
        # résout. Un écran sans action non plus s'il ferme la vie.
        if e["texte"].startswith("[ dé lancé") or e["texte"].startswith("—"):
            continue
        if e["action"] and e["action"] != LECTURE:
            avant.append(courant)
            if courant >= 3:
                rafales.append((courant, dernier_lu[:70]))
            courant = 0
        else:
            courant += 1
            if e["mots"] > 3:
                dernier_lu = e["texte"].replace("\n", " ")
    return {"avant": avant, "rafales": rafales}


def memoire_du_monde(md: str) -> dict:
    """Ce que le monde a retenu, tel qu'il apparaît DANS le transcript."""
    return {
        "objets gagnés": len(re.findall(r"OBTENU", md)),
        "objets sortis": len(re.findall(r"→ \*(?:Utiliser|Amarrer|Sortir)", md)),
        "jets lancés": len(re.findall(r"\[ dé lancé", md)),
        "Destin / Malédiction": len(re.findall(r"DESTIN|MALÉDICTION", md)),
        "le Geôlier parle": len(re.findall(r"le geôlier|Geôlier", md, re.I)),
        "sous-menus « Observer »": len(re.findall(r"Observer les alentours", md)),
    }


def rapport(chemin: Path) -> dict:
    md = chemin.read_text(encoding="utf8")
    es = ecrans(md)
    r = rythme(es)
    mots = [e["mots"] for e in es if e["mots"] > 3]
    decisions = [e for e in es if e["action"] and e["action"] != LECTURE]
    lectures = [e for e in es if e["action"] == LECTURE]
    avant = r["avant"] or [0]

    print(f"\n╔══ {chemin.name}")
    print(f"║  {len(es)} écrans · {len(decisions)} décisions · {len(lectures)} taps de lecture")
    print(f"║")
    print(f"║  TAPS DE LECTURE AVANT UNE DÉCISION  (la métrique du §5)")
    print(f"║    médiane {statistics.median(avant):.0f} · moyenne {statistics.mean(avant):.2f} · pire {max(avant)}")
    par = {k: avant.count(k) for k in sorted(set(avant))}
    total = len(avant)
    for k, v in par.items():
        barre = "█" * round(28 * v / total)
        print(f"║    {k} tap(s) : {v:3d} décision(s)  {barre} {100*v/total:.0f} %")
    tenu = 100 * sum(1 for a in avant if a <= 1) / total
    print(f"║    → {tenu:.0f} % des décisions arrivent après AU PLUS UN tap "
          f"(cible §10 : « la majorité »)")
    print(f"║")
    print(f"║  LONGUEUR DES ÉCRANS")
    print(f"║    médiane {statistics.median(mots):.0f} mots · moyenne {statistics.mean(mots):.0f} "
          f"· 9e décile {sorted(mots)[int(.9*len(mots))]}")
    lourds = sorted(mots, reverse=True)[:5]
    print(f"║    les 5 plus lourds : {', '.join(str(m) for m in lourds)} mots")
    trop = sum(1 for m in mots if m > 45)
    print(f"║    → {trop} écran(s) sur {len(mots)} au-dessus de 45 mots "
          f"({100*trop/len(mots):.0f} %) — cible ChatGPT : 30-45")
    if r["rafales"]:
        print(f"║")
        print(f"║  RAFALES — là où l'on tapote 3 fois ou plus sans rien décider")
        for n, t in r["rafales"][:8]:
            print(f"║    {n} taps → « {t}… »")
    print(f"║")
    print(f"║  CE QUE LE MONDE A RETENU")
    for k, v in memoire_du_monde(md).items():
        print(f"║    {k:26s} {v}")
    print("╚" + "═" * 62)
    return {"avant": avant, "mots": mots}


def main(args: list[str]) -> int:
    fichiers = [Path(a) for a in args] or sorted(Path("data/transcripts").glob("v179-*.md"))
    fichiers = [f for f in fichiers if f.exists()]
    if not fichiers:
        print("aucun transcript — lancer tools/joueur.mjs d'abord.")
        return 2
    tous_avant: list[int] = []
    tous_mots: list[int] = []
    for f in fichiers:
        d = rapport(f)
        tous_avant += d["avant"]
        tous_mots += d["mots"]
    if len(fichiers) > 1:
        tenu = 100 * sum(1 for a in tous_avant if a <= 1) / len(tous_avant)
        print(f"\nTOTAL SUR {len(fichiers)} VIES · {len(tous_avant)} décisions")
        print(f"  {statistics.mean(tous_avant):.2f} tap(s) de lecture avant décision "
              f"· {tenu:.0f} % à un tap ou moins")
        print(f"  {statistics.median(tous_mots):.0f} mots par écran (médiane) · "
              f"{100*sum(1 for m in tous_mots if m > 45)/len(tous_mots):.0f} % au-dessus de 45")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
