#!/usr/bin/env python3
"""
AUDIT IMAGE ↔ TEXTE — l'image à l'écran dit-elle la même chose que le texte ?

Retour Patrick (04/09) : « l'un des plus gros soucis sur Pactum est le manque
de cohérence entre l'image et le texte. Ici j'ai la bête en image mais le texte
ne correspond pas. Corrige cela, pas seulement pour cette scène mais
l'entièreté des scènes du jeu. »

⚠️ CE QUE CET OUTIL FAIT, ET CE QU'IL NE FAIT PAS.
Il ne juge pas une image : il ne sait pas ce qu'elle montre. Il reconstitue,
depuis les sources, QUELLE image est à l'écran au moment où CHAQUE texte est
servi — c'est le point aveugle qu'aucun autre outil ne couvrait — puis il
signale les couples où le texte AFFIRME quelque chose que l'image contredit
mécaniquement. Le tri final reste éditorial.

LA RÈGLE DU MOTEUR, reconstituée (components/Scene.tsx, bloc image) :
  • une conséquence de choix dont la suite est une LIAISON se lit sur l'image
    de la scène qu'on quitte (règle du 7/08 : « l'image du combat tient
    pendant sa conséquence ») ;
  • une conséquence dont la suite est une SCÈNE (chainNext, sortie) se lit sur
    l'image de cette scène-là.

D'où la famille de défauts qu'on traque ici : une conséquence qui raconte le
DÉPART de la créature, servie sur l'image de la créature. Le joueur lit « le
souffle se retire » en regardant la bête dans son creux.
"""
from __future__ import annotations
import json, re, sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
TS = RACINE / "aldenhar/lib/scene-data.ts"

# ⚠️ CE QU'ON CHERCHE N'EST PAS « la créature s'en va » — elle peut reculer,
# s'asseoir, refluer, et rester parfaitement dans le cadre. C'est le HÉROS
# QUI S'EST DÉPLACÉ : à partir de là, l'image de la créature montre un endroit
# où il n'est plus. Un lexique large sur le départ de la bête rendait 17
# signalements dont 15 justes-mais-inutiles ; celui-ci vise le déplacement.
DEPLACEMENT = [
    "hors de tout", "hors de ses murs", "fera le tour", "le grand tour",
    "tu quittes la route", "tu montes au", "t'a coûté la matinée",
    "t’a coûté la matinée", "jusqu'à la bruyère", "jusqu’à la bruyère",
    "tu marches au-dessus", "le détour t'a", "le détour t’a",
    "tu t'assois", "tu t’assois", "tu pars sans", "tu t'éloignes", "tu t’éloignes",
]
# …et on ne signale que si l'image à l'écran est celle d'une CRÉATURE.
CREATURE = re.compile(r"assets/monstre_")

# Exemptions ÉCRITES, avec leur raison — la créature est encore le sujet de la
# phrase, donc son image est juste (règle du 7/08, « l'image du combat tient
# pendant sa conséquence »).
EXEMPTS = {
    ("pendu-mal-fixe", "esquiver-corde"): "il s'emmêle sous tes yeux : il est dans le cadre",
    ("meute-grise-2", "reculer-face"): "on recule EN LES REGARDANT : elles sont face à toi",
    ("pendu-mal-fixe", "emmeler"): "il est ligoté À TES PIEDS pendant que tu pars : encore dans le cadre",
}


def sans_commentaires(src: str) -> str:
    """Neutralise les commentaires en préservant les index (piège récurrent :
    un garde qui lit un commentaire signale du texte qui n'existe pas)."""
    out = list(src)
    i, n = 0, len(src)
    chaine = None
    while i < n:
        c = src[i]
        if chaine:
            if c == "\\":
                i += 2
                continue
            if c == chaine:
                chaine = None
            i += 1
            continue
        if c in "\"'`":
            chaine = c
            i += 1
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "/":
            j = src.index("\n", i) if "\n" in src[i:] else n
            for k in range(i, j):
                out[k] = " "
            i = j
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "*":
            j = src.find("*/", i) + 2
            if j < 2:
                j = n
            for k in range(i, j):
                if src[k] != "\n":
                    out[k] = " "
            i = j
            continue
        i += 1
    return "".join(out)


def scenes(src: str) -> list[tuple[str, str]]:
    """(id, corps) pour chaque scène du tableau SCENES, découpé sur les id."""
    idx = [(m.start(), m.group(1)) for m in re.finditer(r'\n    id: "([a-z0-9é\-]+)",', src)]
    out = []
    for k, (pos, sid) in enumerate(idx):
        fin = idx[k + 1][0] if k + 1 < len(idx) else len(src)
        out.append((sid, src[pos:fin]))
    return out


def champ(corps: str, nom: str) -> str | None:
    m = re.search(nom + r': "([^"]+)"', corps)
    return m.group(1) if m else None


def chaines(bloc: str) -> str:
    """Recolle une valeur concaténée sur plusieurs lignes."""
    return "".join(re.findall(r'"((?:[^"\\]|\\.)*)"', bloc)).replace('\\"', '"')


def main() -> int:
    brut = TS.read_text(encoding="utf-8")
    src = sans_commentaires(brut)
    tout = scenes(src)
    par_id = {sid: corps for sid, corps in tout}

    # L'illustration servie par une scène (héritée si elle n'en déclare pas :
    # le moteur garde alors l'image précédente — on ne peut pas la deviner,
    # donc on ne conclut rien sur ces scènes-là).
    illo = {sid: champ(c, "illustration") for sid, c in tout}

    signalements: list[tuple[str, str, str, str]] = []
    combats = 0
    couples = 0

    for sid, corps in tout:
        est_combat = "combat: true" in corps
        if not est_combat:
            # Hors combat, l'image tenue est celle d'un LIEU : le héros qui s'y
            # déplace ne la contredit pas.
            continue
        combats += 1
        image = illo.get(sid)
        chain = champ(corps, "chainNext")

        # Chaque conséquence de choix passif + chaque issue de jet.
        for m in re.finditer(r"\n      \{\n(.*?)(?=\n      \{\n|\n    \],)", corps, re.S):
            ch = m.group(1)
            cid = champ(ch, "id") or "?"
            suite = champ(ch, "toScene") or chain
            # Où se lit ce texte : sur l'image de la scène suivante si elle en
            # déclare une, sinon sur celle qu'on quitte (règle du moteur).
            vue = illo.get(suite) if suite else None
            vue = vue or image
            if not vue:
                continue
            textes: list[str] = []
            mc = re.search(r"consequence:(.*?)(?=\n        \}|\n        [a-zA-Z]+:)", ch, re.S)
            if mc:
                textes.append(chaines(mc.group(1)))
            mo = re.search(r"outcomes\((.*?)\n          \),", ch, re.S)
            if mo:
                for bout in re.findall(r'"((?:[^"\\]|\\.)*)"(?:\s*\+\s*)?', mo.group(1)):
                    textes.append(bout)
            for t in textes:
                if len(t) < 25:
                    continue
                couples += 1
                if not CREATURE.search(vue):
                    continue
                if "consequenceAilleurs" in ch:
                    continue  # déjà déclaré : l'écran rend la main au lieu
                if (sid, cid) in EXEMPTS:
                    continue
                bas = t.lower()
                marqueur = next((p for p in DEPLACEMENT if p in bas), None)
                if marqueur:
                    signalements.append((sid, cid, marqueur, t[:150]))

    print(f"AUDIT IMAGE ↔ TEXTE — {len(tout)} scènes, {combats} combats, {couples} textes servis sur l'image d'une créature")
    if not signalements:
        print("Rien à signaler : aucun texte ne déplace le héros hors du cadre qu'il regarde.")
        return 0
    print(f"\n{len(signalements)} signalement(s) — la créature est à l'écran, le héros est ailleurs :\n")
    for sid, cid, marq, extrait in signalements:
        print(f"  {sid} · {cid}   [« {marq} »]")
        print(f"      {extrait}…\n")
    return 1 if "--strict" in sys.argv else 0


if __name__ == "__main__":
    raise SystemExit(main())
