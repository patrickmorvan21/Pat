#!/usr/bin/env python3
"""CONTRADICTION DE STRATE — une ligne injectée qui nie ce que sa scène affirme.

Prototypé pendant le panel du 10/08, où il a rendu UN signalement : la strate
du Chien du Bailli (« la bête grise ne se lève pas ») servie sur un écran dont
la narration écrit « le chien se lève du seuil ». Six testeurs l'ont rapporté ;
aucun des cinq gardes existants ne pouvait le voir, parce qu'ils vérifient OÙ
un texte s'affiche, jamais CE QU'IL AFFIRME.

Le principe est étroit à dessein : on ne cherche pas « deux textes qui se
ressemblent », on cherche une NÉGATION dans la strate dont le verbe est
affirmé par la scène sur laquelle elle tombe. Un garde qui crie au loup finit
par ne plus être lu.

  python3 tools/strates.py [--strict]
"""

from __future__ import annotations

import json
import re
import sys

sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
STUDIO = RACINE / "data" / "studio-data.json"
TS = RACINE / "aldenhar" / "lib" / "scene-data.ts"

# « ne se lève pas », « ne bouge plus », « n'aboie pas »… On capte le VERBE.
NEGATION = re.compile(r"\bne\s+(?:se\s+|te\s+|s'|t')?([a-zàâçéèêëîïôûùüÿœ]{3,})\s+(?:pas|plus|jamais)\b", re.I)
NEG_ELIDE = re.compile(r"\bn'(?:y\s+)?([a-zàâçéèêëîïôûùüÿœ]{3,})\s+(?:pas|plus|jamais)\b", re.I)


# Formes qui sont AUSSI des noms courants du jeu : « un harnais qu'elle ne
# PORTE plus » (verbe) contre « la PORTE » (nom). Les compter produirait un
# signalement juste par accident et un garde qu'on finit par ignorer.
AMBIGUS = {"port", "plac", "march", "gard", "rest", "tour", "cour", "somm", "sui"}


def radical_verbe(v: str) -> str:
    """Racine grossière : « lève » et « levait » partagent « lev »."""
    v = v.lower()
    for suf in ("ent", "ons", "ez", "ait", "aient", "era", "e", "es", "s", "t"):
        if v.endswith(suf) and len(v) - len(suf) >= 3:
            return v[: len(v) - len(suf)]
    return v


def strates() -> dict[str, dict]:
    """Lit FAMILIARITE dans le .ts — la source que le moteur exécute."""
    src = TS.read_text(encoding="utf-8")
    i = src.find("export const FAMILIARITE")
    if i < 0:
        return {}
    bloc = src[i : src.find("\n};", i)]
    out: dict[str, dict] = {}
    for m in re.finditer(r'\n  "([a-z0-9\-]+)":\s*\{(.*?)\n  \}', bloc, re.S):
        lieu, corps = m.group(1), m.group(2)
        e: dict = {}
        sur = re.search(r'sur:\s*"([^"]+)"', corps)
        if sur:
            e["sur"] = sur.group(1)
        rem = re.search(r"remplace:\s*(\d+)", corps)
        if rem:
            e["remplace"] = int(rem.group(1))
        for champ in ("deux", "quatre"):
            c = re.search(champ + r":\s*((?:\s*\"(?:[^\"\\\\]|\\\\.)*\"\s*\+?)+)", corps)
            if c:
                e[champ] = "".join(re.findall(r'"((?:[^"\\\\]|\\\\.)*)"', c.group(1)))
        out[lieu] = e
    return out


def main() -> int:
    strict = "--strict" in sys.argv
    # ⚠️ Même dépendance à un instantané que `aiguillage.py` (repasse du
    # 10/08) : sans ce rafraîchissement, le garde audite l'export de la
    # dernière génération et ignore les textes écrits depuis.
    from aiguillage import export_a_jour  # noqa: PLC0415

    export_a_jour()
    if not STUDIO.exists():
        print("studio-data.json absent — lancer tools/studio_data.py d'abord.")
        return 0
    scenes = {s["id"]: s for s in json.load(STUDIO.open(encoding="utf-8"))["scenes"]}

    signalements: list[str] = []
    n = 0
    for lieu, e in strates().items():
        cible = e.get("sur", lieu)
        sc = scenes.get(cible)
        if sc is None:
            signalements.append(f"{lieu} : sa strate vise « {cible} », qui n'existe pas.")
            continue
        # ⚠️ La contradiction du Chien du Bailli traverse DEUX écrans : la
        # strate tombait à l'arrivée, l'affirmation deux touchers plus loin.
        # On lit donc toute la CHAÎNE du lieu — c'est l'unité que le joueur
        # lit d'affilée, pas l'écran isolé. (Un garde qui ne regarde qu'un
        # écran ne voit pas ce défaut : vérifié, il rendait 0 signalement sur
        # le cas même qui l'a fait écrire.)
        chaine = [sc]
        vus_ids = {cible}
        while chaine[-1].get("suite") and chaine[-1]["suite"] not in vus_ids:
            nxt = scenes.get(chaine[-1]["suite"])
            if nxt is None:
                break
            vus_ids.add(nxt["id"])
            chaine.append(nxt)
        paras: list[str] = []
        for i, x in enumerate(chaine):
            for j, p in enumerate(x.get("narration") or []):
                # Un paragraphe REMPLACÉ n'est plus lu : il ne contredit plus.
                if i == 0 and e.get("remplace") == j:
                    continue
                paras.append(p)
        narration = " ".join(paras)
        mots_scene = {radical_verbe(w) for w in re.findall(r"[a-zàâçéèêëîïôûùüÿœ']{3,}", narration.lower())}
        for champ in ("deux", "quatre"):
            texte = e.get(champ)
            if not texte:
                continue
            n += 1
            verbes = [m.group(1) for m in NEGATION.finditer(texte)]
            verbes += [m.group(1) for m in NEG_ELIDE.finditer(texte)]
            for v in verbes:
                r = radical_verbe(v)
                if r in AMBIGUS:
                    continue
                if r in mots_scene:
                    signalements.append(
                        f"{lieu} · strate « {champ} » sur l'écran « {cible} » :\n"
                        f"    la strate NIE « {v} », que la scène AFFIRME.\n"
                        f"    → soit la strate se joue sur un autre écran (`sur`),\n"
                        f"      soit elle REMPLACE le paragraphe concerné (`remplace`)."
                    )

    print(f"CONTRADICTION DE STRATE — {len(signalements)} signalement(s) sur {n} strate(s)\n")
    for s in signalements:
        print("  " + s)
    if not signalements:
        print("Aucune strate ne contredit l'écran sur lequel elle tombe.")
    return 1 if (strict and signalements) else 0


if __name__ == "__main__":
    raise SystemExit(main())
