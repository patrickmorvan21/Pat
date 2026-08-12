#!/usr/bin/env python3
"""
LES TUNNELS DE LECTURE — trouver ce qu'il faut couper, et RIEN d'autre.

Consigne (ChatGPT + Patrick, 12/08) : « ne pas uniformiser PACTUM en
micro-textes, mais supprimer les tunnels de lecture. On peut conserver
occasionnellement une scène longue lorsqu'elle constitue un véritable moment
narratif exceptionnel. Ce qui ne doit plus arriver, c'est 3-5 écrans
successifs de narration avant que je puisse de nouveau jouer. »

⚠️ CE QUE LA CIBLE « écrans > 45 mots » VEUT DIRE EN PRATIQUE.
Le moteur assemble jusqu'à `MOTS_PAR_ECRAN = 90` par écran (Scene.tsx). Un
paragraphe ramené à 45 mots ne raccourcit donc PAS l'écran : le découpeur en
empile simplement deux. Le levier réel est ailleurs, et il est double :

  1. le VOLUME TOTAL d'une scène — c'est lui qui fixe le nombre d'écrans de
     lecture avant la prochaine décision (≈ volume / 90) ;
  2. les paragraphes de PLUS DE 90 mots — le découpeur ne coupe jamais au
     milieu d'un paragraphe, donc un tel bloc occupe un écran à lui seul.

⚠️ MESURÉ LE 12/08, ET ÇA CORRIGE LA CIBLE : il n'existe AUCUN paragraphe
au-dessus de 90 mots dans les sources. Le levier n°2 est donc vide, et le
n°1 fait tout le travail. Les « écrans à 87-92 mots » vus en jeu ne sont pas
des paragraphes monstres : c'est le découpeur qui remplit jusqu'au plafond.
Un écran de lecture de plus n'apparaît que quand le VOLUME d'une scène passe
un multiple de 90 — c'est là, et seulement là, qu'on gagne un tap.

Cible retenue : ramener chaque scène hors pic sous ~70 mots de narration,
pour qu'elle tienne en UN écran une fois l'approche et les rappels ajoutés.

⚠️ ET LA RÈGLE QUI PRIME SUR LES CHIFFRES : un pic narratif a le droit
d'être long. Ce qu'on coupe, c'est le texte de TRANSITION qui se comporte
comme un pic. Les scènes marquées « pic » ici sont exemptées par défaut et
doivent être justifiées une par une, jamais coupées pour faire tomber une
moyenne.

Usage : python3 tools/tunnels.py [--tout]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / "tools"))
from audit_boucle import sans_commentaires  # noqa: E402

SD = RACINE / "aldenhar/lib/scene-data.ts"
BUDGET = 90  # MOTS_PAR_ECRAN, Scene.tsx

# Les PICS — un moment qui mérite qu'on s'arrête. Exemptés par défaut : ce
# sont eux que la règle protège. Motifs sur l'id de scène.
PICS = re.compile(
    r"proces-du-heros|temoin-toit|grand-temoin|pendu-qui-parle|la-descente|"
    r"hameau-entree-4|serment|geryon|meute-grise|fille-moulin"
)
# Les TRANSITIONS — arriver, marcher, franchir, repartir. Aucune n'a de
# raison d'être longue : c'est exactement la cible.
TRANSITIONS = re.compile(r"liaison|approche|croisee|sortie|depart|marche")


def mots(t: str) -> int:
    return len(t.split())


def textes_de(bloc: str) -> list[tuple[str, str]]:
    """(rôle, texte) de tout ce qui s'AFFICHE dans une scène."""
    out: list[tuple[str, str]] = []
    for champ, role in (
        ("narration", "narration"),
        ("narrationEchec", "narration d'échec"),
        ("timeoutNarration", "expiration"),
    ):
        m = re.search(rf'\b{champ}:\s*(\[[\s\S]*?\n    \]|"(?:[^"\\]|\\.)*")', bloc)
        if m:
            for t in re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(1)):
                # Les morceaux concaténés par + appartiennent au même paragraphe :
                # le champ les rend déjà groupés, on les recolle.
                out.append((role, t))
    # Recoller les morceaux d'un même paragraphe (écrits en "…" + "…").
    fusion: list[tuple[str, str]] = []
    for m in re.finditer(
        r'\b(narration|narrationEchec|timeoutNarration):\s*\[([\s\S]*?)\n    \]', bloc):
        role = {"narration": "narration", "narrationEchec": "narration d'échec",
                "timeoutNarration": "expiration"}[m.group(1)]
        for para in re.split(r'",\s*\n', m.group(2)):
            t = " ".join(re.findall(r'"((?:[^"\\]|\\.)*)"', para + '"'))
            if t.strip():
                fusion.append((role, t))
    return fusion or out


def scenes_avec_textes(src: str) -> list[dict]:
    bornes = [(m.start(), m.group(1)) for m in re.finditer(r'\n    id: "([a-z0-9-]+)"', src)]
    out = []
    for i, (pos, sid) in enumerate(bornes):
        fin = bornes[i + 1][0] if i + 1 < len(bornes) else len(src)
        bloc = src[pos:fin]
        ts = textes_de(bloc)
        if ts:
            # ⚠️ ON NE VOIT QU'UNE BRANCHE. `narration` et `narrationEchec`
            # sont EXCLUSIVES (réussite ou échec du jet d'accès), et
            # `timeoutNarration` remplace le flux normal quand le temps
            # expire. Les additionner gonflait le volume d'une scène du
            # double — et aurait fait couper de la prose sur un chiffre que
            # le joueur ne rencontre jamais. On prend la branche la PLUS
            # LONGUE : c'est le pire cas réellement jouable.
            par_role: dict[str, int] = {}
            for role, t in ts:
                par_role[role] = par_role.get(role, 0) + mots(t)
            out.append({"id": sid, "textes": ts, "total": max(par_role.values()),
                        "branches": par_role})
    return out


def classe(sid: str) -> str:
    if PICS.search(sid):
        return "PIC"
    if TRANSITIONS.search(sid):
        return "transition"
    return "lieu"


def main() -> int:
    src = sans_commentaires(SD.read_text(encoding="utf8"))
    S = scenes_avec_textes(src)
    if not S:
        print("⚠️ analyseur cassé — ne rien conclure.")
        return 2

    paras = [(mots(t), sid["id"], role, t) for sid in S for role, t in sid["textes"]]
    monstres = sorted([p for p in paras if p[0] > BUDGET], reverse=True)
    lourds = sorted([p for p in paras if 70 < p[0] <= BUDGET], reverse=True)
    moyens = [p for p in paras if 45 < p[0] <= 70]

    print(f"LES TUNNELS DE LECTURE — {len(S)} scènes, {len(paras)} paragraphes\n")

    print(f"■ paragraphes > {BUDGET} mots : {len(monstres)}   "
          f"· 71-{BUDGET} : {len(lourds)}   · 46-70 : {len(moyens)}")
    if not monstres:
        print("   Aucun bloc ne monopolise un écran : le levier est le VOLUME, pas le pavé.\n")

    # ─── LA LISTE DE TRAVAIL ────────────────────────────────────────────────
    # Une scène tient en UN écran de lecture si sa narration reste sous ~70
    # mots : le découpeur ajoute ensuite l'approche et le rappel d'arrivée
    # sans franchir le plafond de 90.
    SEUIL = 70
    a_couper = [s for s in S if s["total"] > SEUIL and classe(s["id"]) != "PIC"]
    a_couper.sort(key=lambda s: -s["total"])
    pics_longs = [s for s in S if s["total"] > SEUIL and classe(s["id"]) == "PIC"]

    print(f"■ À COUPER — {len(a_couper)} scènes au-dessus de {SEUIL} mots (hors pics)")
    print(f"   Chacune coûte un écran de lecture de plus avant de pouvoir rejouer.\n")
    for s in a_couper:
        ec = max(1, -(-s["total"] // BUDGET))
        print(f"   {s['total']:4d} mots → {ec} écran(s) · {s['id']:26s} "
              f"[{classe(s['id'])}]  couper ~{s['total'] - SEUIL} mots")

    print(f"\n■ EXEMPTÉS — {len(pics_longs)} pics narratifs, longs à dessein")
    for s in pics_longs:
        print(f"   {s['total']:4d} mots · {s['id']}")

    tot = sum(s["total"] for s in S)
    dette = sum(s["total"] - SEUIL for s in a_couper)
    print(f"\n   volume total {tot} mots · à retirer {dette} mots "
          f"({100*dette/tot:.0f} %) pour que tout tienne en un écran")
    print(f"   scènes déjà dans la cible : "
          f"{sum(1 for s in S if s['total'] <= SEUIL)}/{len(S)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
