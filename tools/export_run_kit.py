#!/usr/bin/env python3
"""
KIT DE PARTIE — le contenu du jeu, extrait pour être JOUÉ hors navigateur.

Pourquoi : une IA sans navigateur (ChatGPT en conversation, par exemple) ne
peut pas ouvrir PACTUM — c'est une application React, une simple récupération
d'URL ne rend qu'une coquille vide. Elle peut en revanche exécuter du Python.
Ce script produit `data/run-kit.json`, que `tools/pactum.py` sait jouer.

RÈGLE : ce kit ne contient AUCUN texte réécrit. Tout vient des sources du jeu
(via `data/studio-data.json`, lui-même extrait de `lib/scene-data.ts`) ou des
constantes lues directement dans `scene-data.ts`. Le moteur de `pactum.py` est
une réplique — le CONTENU, lui, est celui que le joueur voit.

Usage : python3 tools/export_run_kit.py
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
LIB = RACINE / "aldenhar" / "lib"
DATA = RACINE / "data"
sys.path.insert(0, str(RACINE / "tools"))
from immersion import bloc_tableau, chaines_de_tableau  # noqa: E402


def record(src: str, ancre: str) -> dict[str, str]:
    """Un `Record<string, string> = { clef: "valeur", … }` en dict.

    ⚠️ Les clefs ne sont pas toutes entre guillemets (`campement:` l'est sans),
    et les valeurs sont parfois concaténées sur plusieurs lignes.
    """
    i = src.find(ancre)
    if i < 0:
        return {}
    j = src.find("{", i)
    prof, fin = 0, len(src)
    for k in range(j, len(src)):
        if src[k] == "{":
            prof += 1
        elif src[k] == "}":
            prof -= 1
            if prof == 0:
                fin = k
                break
    corps = src[j + 1 : fin]
    out: dict[str, str] = {}
    for m in re.finditer(
        r'(?:"([a-z0-9\-]+)"|([a-zA-Z][a-zA-Z0-9\-]*))\s*:\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+)',
        corps,
    ):
        clef = m.group(1) or m.group(2)
        val = "".join(re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(3)))
        out[clef] = val.replace('\\"', '"').replace("\\'", "'")
    return out


def main() -> int:
    studio = DATA / "studio-data.json"
    if not studio.exists():
        subprocess.run([sys.executable, str(RACINE / "tools" / "studio_data.py")], check=True)
    d = json.loads(studio.read_text(encoding="utf-8"))
    src = (LIB / "scene-data.ts").read_text(encoding="utf-8")

    # — les pools du Geôlier, posture par posture
    jdeb = src.find("export const JAILER_BY_POSTURE")
    jobj = src[jdeb : src.find("\n};", jdeb)]
    postures = list(re.finditer(r"\n  (amuse|interesse|respectueux):\s*\{", jobj))
    geolier: dict[str, dict[str, list[str]]] = {}
    for n, m in enumerate(postures):
        bloc = jobj[m.start() : postures[n + 1].start() if n + 1 < len(postures) else len(jobj)]
        geolier[m.group(1)] = {
            cle: chaines_de_tableau(bloc_tableau(bloc, f"{cle}:"))
            for cle in ("fail", "critFail", "critSuccess")
        }

    # La ligne du Geôlier propre à chaque scène (12 % de chance d'être servie)
    # n'est pas dans studio-data : on l'apparie ici, chaque `jailerLine` allant
    # au dernier `id:` rencontré avant elle.
    lignes: dict[str, str] = {}
    for m in re.finditer(r'\n    id: "([a-z0-9\-]+)"|jailerLine:\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+)', src):
        if m.group(1):
            dernier = m.group(1)
        elif "dernier" in dir():
            lignes[dernier] = "".join(
                re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(2))
            ).replace('\\"', '"').replace("\\'", "'")

    scenes = {}
    for s in d["scenes"]:
        scenes[s["id"]] = {
            k: s[k]
            for k in (
                "id", "nom", "lieu", "narration", "choix", "pointsInteret", "suite",
                "combat", "adversaireNom", "terminal", "registre", "hameauEntree",
                "hameauHalte", "chronometree", "procesFixation", "butin",
                # ⚠️ Liste BLANCHE : un champ neuf de `Scene` ne voyage pas tant
                # qu'il n'est pas nommé ici. `sejour` l'a appris à ses dépens —
                # la réplique laissait quitter la Palissade au premier geste.
                "sejour",
            )
            if k in s
        }
        if s["id"] in lignes:
            scenes[s["id"]]["geolier"] = lignes[s["id"]]

    # La Descente ne vit pas dans SCENES (elle est construite à part) : sans
    # elle, une traversée réussie n'aurait pas d'écran de sortie.
    dd = src.find("export const DESCENTE_SCENE")
    dbloc = src[dd : src.find("\n};", dd)]
    scenes["la-descente"] = {
        "id": "la-descente",
        "nom": "La Descente",
        "narration": chaines_de_tableau(bloc_tableau(dbloc, "narration:")),
        "choix": [{"id": "recommencer-descente", "label": "Repartir de la Borne", "type": "suite"}],
        "pointsInteret": [],
        "terminal": True,
    }

    kit = {
        "version": (RACINE / "aldenhar" / "lib" / "version.ts").read_text(encoding="utf-8"),
        "genere": d.get("genere"),
        "commit": d.get("commit"),
        "entree": d["entree"],
        "pool": d["pool"],
        "scenes": scenes,
        "etats": d.get("etats", []),
        "approche": record(src, "const APPROACH: Record<string, string>"),
        "approcheNarration": record(src, "export const APPROACH_NARRATION: Record<string, string>"),
        "indiceRoute": record(src, "const INDICE_ROUTE: Record<string, string>"),
        "ambiances": chaines_de_tableau(bloc_tableau(src, "const LIAISON_AMBIANCES:")),
        "ambiancesLande": chaines_de_tableau(bloc_tableau(src, "const LIAISON_AMBIANCES_LANDE")),
        "bifurcations": chaines_de_tableau(bloc_tableau(src, "const BIFURCATIONS")),
        "geolierLiaison": chaines_de_tableau(bloc_tableau(src, "const LIAISON_JAILER")),
        "geolier": geolier,
        # Noms RÉELS des objets (le kit affichait l'identifiant brut,
        # « craie condamne » — relevé par tout le panel du 9/08).
        "objets": {
            m.group(1): m.group(2)
            for m in re.finditer(
                r'"([a-z0-9\-]+)":\s*\{[^}]*?name:\s*"([^"]+)"',
                (LIB / "besace.ts").read_text(encoding="utf-8"),
                re.S,
            )
        },
        "lieux": {
            l["id"]: l["nom"]
            for l in json.loads((DATA / "zones" / "landes.json").read_text(encoding="utf-8")).get("lieux", [])
            if l.get("id") and l.get("nom")
        },
        "hameauInterieur": re.findall(
            r'"([a-z\-]+)"', bloc_tableau(src, "export const HAMEAU_INTERIOR")
        ),
    }
    # la version : on ne garde que le numéro
    m = re.search(r'APP_VERSION = "([^"]+)"', kit["version"])
    kit["version"] = m.group(1) if m else "?"

    sortie = DATA / "run-kit.json"
    sortie.write_text(json.dumps(kit, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    n_choix = sum(len(s.get("choix", [])) for s in scenes.values())
    n_poi = sum(len(s.get("pointsInteret", [])) for s in scenes.values())
    n_geol = sum(len(v) for p in geolier.values() for v in p.values()) + len(kit["geolierLiaison"])
    print(f"run-kit.json — v{kit['version']} · {len(scenes)} scènes · {n_choix} choix "
          f"· {n_poi} points · {len(kit['pool'])} destinations · {n_geol} citations du Geôlier")
    manquant = [c for c in ("approche", "approcheNarration", "indiceRoute", "ambiances",
                            "bifurcations", "geolierLiaison", "hameauInterieur") if not kit[c]]
    if manquant:
        print("⚠️ extraction VIDE pour :", ", ".join(manquant))
        return 1
    print(f"   {sortie.stat().st_size // 1024} Ko")
    return 0


if __name__ == "__main__":
    sys.exit(main())
