#!/usr/bin/env python3
"""
Migration : construit la collection `scenes` de data/zones/<zone>.json.

À lancer UNE FOIS (idempotent — relançable sans dégât : les champs déjà
remplis dans le JSON gagnent sur la source, pour ne jamais écraser un texte
édité depuis l'atelier).

    python3 tools/atelier_migrate.py

D'où viennent les données :
  • `aldenhar/lib/scene-data.ts` — les TEXTES réels, ceux que le jeu affiche
    aujourd'hui. C'est la seule source fiable : les textes de la maquette
    d'atelier ont été écrits sans accès au dépôt, avec des ids inventés
    (« colline-1 », « bete »…) dont 42 sur 62 ne correspondent à aucune scène.
  • `data/scene-meta.json` — description de production + prompt Leonardo.
  • la maquette — le RATTACHEMENT à un lieu et les coordonnées de la carte,
    seul apport de données qu'elle contienne qui vaille d'être gardé.

Schéma d'une scène (aligné sur le modèle de la maquette) :
    {id, type, nom, lieu, parent, mene_a[], texte[], description,
     prompt_image, illustration}
  type : "arrivee" (entrée dans un lieu) · "moment" (beat suivant, chainNext)
         · "observe" (point d'intérêt) · "rencontre" (beat de rencontre)
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
TS = RACINE / "aldenhar/lib/scene-data.ts"
META = RACINE / "data/scene-meta.json"
ZONE = RACINE / "data/zones/landes.json"

# Rattachement scène → lieu. Relevé sur la carte Figma 2112:325 et repris de la
# maquette d'atelier ; les lieux, eux, existent déjà dans landes.json.
# Rattachement scène → lieu. La CLÉ est l'id réel du lieu dans landes.json
# (`chapelle_des_cordes`, pas `chapelle`) : sans ça la carte de l'atelier ne
# retrouve aucun nœud, chaque lieu s'ouvre vide. Vu au test du 27/07.
LIEU_DE = {
    "hameau_des_renoncants": ["serment-hameau", "hameau-entree", "hameau-halte", "femme-seuil", "proces-du-heros"],
    "colline_aux_gibets": ["colline-aux-gibets", "pendu-qui-parle"],
    "champ_des_fixes": ["champ-des-fixes", "pendu-mal-fixe"],
    "moulin_sans_ailes": ["campement"],
    "mare_aux_regards": ["mare-aux-regards"],
    "chapelle_des_cordes": ["chapelle-des-cordes"],
    "maison_du_bailli": ["chien-du-bailli"],
    "petit_tribunal": ["petit-tribunal"],
    "puits_condamne": ["puits-condamne"],
    "marche_muet": ["marche-muet"],
    "verger_noir": ["verger-noir", "epoux-"],
    "chemin_creux": ["chemin-creux", "bete-chemins-creux", "marcheur-"],
    "borne_frontiere": ["borne-frontiere", "hesitant-"],
    "palissade_sud": ["palissade-sud", "veilleur-"],
    # Les errants n'ont pas de lieu : la Meute Grise tombe où elle veut.
    # `horslieu` n'existe pas dans landes.json — c'est volontaire, la carte
    # de l'atelier lui fabrique une colonne « Sans lieu fixe ».
    "horslieu": ["meute-grise"],
}



def lieu_de(scene_id: str) -> str | None:
    """Le lieu auquel une scène appartient — préfixe le plus long qui matche."""
    best, best_len = None, 0
    for lieu, prefixes in LIEU_DE.items():
        for p in prefixes:
            if scene_id == p or scene_id.startswith(p):
                if len(p) > best_len:
                    best, best_len = lieu, len(p)
    return best


def lire_scenes_ts(src: str) -> list[dict]:
    """
    Extrait les scènes du .ts. On ne parse pas du TypeScript : on découpe sur
    les entrées de premier niveau du tableau SCENES, ce qui suffit largement
    pour les champs plats qu'on veut (id, illustration, chainNext, narration).
    """
    debut = src.index("const SCENES")
    corps = src[debut:]
    # Chaque scène commence par une ligne `    id: "…",` à 4 espaces.
    bornes = [m.start() for m in re.finditer(r'^\s{4}id: "([\w-]+)",$', corps, re.M)]
    bornes.append(len(corps))
    out = []
    for i in range(len(bornes) - 1):
        bloc = corps[bornes[i] : bornes[i + 1]]
        sid = re.match(r'\s*id: "([\w-]+)"', bloc).group(1)
        scene = {"id": sid, "bloc": bloc}
        m = re.search(r'\n    illustration: "assets/([\w.]+)"', bloc)
        scene["illustration"] = m.group(1) if m else None
        m = re.search(r'\n    chainNext: "([\w-]+)"', bloc)
        scene["chainNext"] = m.group(1) if m else None
        scene["narration"] = extraire_narration(bloc)
        scene["pois"] = extraire_pois(bloc)
        out.append(scene)
    return out


def concat_ts(expr: str) -> str:
    """Recompose une chaîne TypeScript écrite en morceaux « a » + « b »."""
    morceaux = re.findall(r'"((?:[^"\\]|\\.)*)"', expr)
    txt = "".join(morceaux)
    return txt.replace('\\"', '"').replace("\\'", "'").replace("\\n", "\n")


def extraire_narration(bloc: str) -> list[str]:
    m = re.search(r"\n    narration: \[(.*?)\n    \],", bloc, re.S)
    if not m:
        return []
    # Un paragraphe par élément du tableau : on coupe sur les virgules de fin
    # de ligne qui suivent une chaîne fermée.
    brut = m.group(1)
    paras, courant, prof = [], [], 0
    for ligne in brut.split("\n"):
        courant.append(ligne)
        prof += ligne.count("(") - ligne.count(")")
        if ligne.rstrip().endswith(",") and prof == 0 and '"' in "".join(courant):
            paras.append(concat_ts("\n".join(courant)))
            courant = []
    if courant and '"' in "".join(courant):
        paras.append(concat_ts("\n".join(courant)))
    return [p for p in (x.strip() for x in paras) if p]


def extraire_pois(bloc: str) -> list[dict]:
    m = re.search(r"\n    pointsInteret: \[(.*?)\n    \],", bloc, re.S)
    if not m:
        return []
    out = []
    for pm in re.finditer(r'\n      \{\n\s*id: "([\w-]+)",(.*?)\n      \},', m.group(1) + "\n      },", re.S):
        pid, corps = pm.group(1), pm.group(2)
        lab = re.search(r'\n\s*label:\s*((?:"[^"]*"\s*\+?\s*)+)', corps)
        app = re.search(r"\n\s*approche:\s*((?:.|\n)*?),\n\s*(?:examen|illustration|savoir|soupcon|leadsTo|grantsLoot|chapterFragment|corbeaux|setsEnvFlag):", corps)
        exa = re.search(r"\n\s*examen:\s*((?:.|\n)*?),\n\s*(?:illustration|savoir|soupcon|leadsTo|grantsLoot|chapterFragment|corbeaux|setsEnvFlag|\})", corps)
        illo = re.search(r'\n\s*illustration: "assets/([\w.]+)"', corps)
        mene = re.search(r'\n\s*leadsTo: "([\w-]+)"', corps)
        out.append(
            {
                "id": pid,
                "nom": concat_ts(lab.group(1)) if lab else pid,
                "texte": [t for t in (concat_ts(app.group(1)) if app else "", concat_ts(exa.group(1)) if exa else "") if t],
                "illustration": illo.group(1) if illo else None,
                "leadsTo": mene.group(1) if mene else None,
            }
        )
    return out


def nom_lisible(sid: str, typ: str, lieux: dict[str, str], autres: dict[str, str]) -> str:
    """
    Un nom affichable par défaut. Le .ts n'en porte pas — il n'en a pas besoin,
    le jeu ne montre jamais d'id. La carte de l'atelier, si : mieux vaut « Le
    Chemin Creux — l'événement » que « chemin-creux-2 ». Patrick le réécrit
    depuis la fiche, c'est justement à ça que sert l'atelier.
    """
    base, _, suffixe = sid.rpartition("-")
    if suffixe.isdigit() and base:
        racine, rang = base, int(suffixe)
    else:
        racine, rang = sid, 0
    nom = lieux.get(racine) or autres.get(racine) or autres.get(sid) or lieux.get(sid)
    if not nom:
        nom = sid.replace("-", " ").capitalize()
    if rang >= 2:
        return f"{nom} — beat {rang}"
    return nom


def main() -> int:
    if not TS.exists() or not ZONE.exists():
        print("✗ scene-data.ts ou landes.json introuvable", file=sys.stderr)
        return 1

    # scene-meta.json indexe ses scènes par id : {"scenes": {"<id>": {...}}}
    meta = json.loads(META.read_text(encoding="utf-8")) if META.exists() else {}
    metas = meta.get("scenes", {}) if isinstance(meta, dict) else {}

    scenes_ts = lire_scenes_ts(TS.read_text(encoding="utf-8"))
    zone = json.loads(ZONE.read_text(encoding="utf-8"))
    # Les noms déjà écrits dans la zone servent de vocabulaire aux défauts.
    noms_lieux = {}
    for l in zone.get("lieux", []):
        for cle in (l.get("id"), (l.get("id") or "").replace("_", "-")):
            if cle:
                noms_lieux[cle] = l.get("nom") or cle
    autres = {}
    for coll in ("rencontres", "creatures", "objets"):
        for e in zone.get(coll, []):
            cid = (e.get("id") or "").replace("_", "-")
            if cid:
                autres[cid] = e.get("nom") or cid
    # Les scènes déjà migrées gagnent : relancer la migration ne doit JAMAIS
    # écraser un texte édité depuis l'atelier.
    deja = {s["id"]: s for s in zone.get("scenes", [])}

    scenes = []
    for s in scenes_ts:
        sid = s["id"]
        m = metas.get(sid, {})
        anc = deja.get(sid, {})
        # Le type se lit dans la forme de l'id et le graphe, pas dans une table.
        if s["pois"]:
            typ = "arrivee"
        elif re.search(r"-\d$", sid):
            typ = "moment"
        else:
            typ = "arrivee"
        scene = {
            "id": sid,
            "type": anc.get("type") or typ,
            "nom": anc.get("nom") or nom_lisible(sid, typ, noms_lieux, autres),
            "lieu": anc.get("lieu") or lieu_de(sid),
            "parent": anc.get("parent"),
            "mene_a": anc.get("mene_a") or ([s["chainNext"]] if s["chainNext"] else []),
            "texte": anc.get("texte") or s["narration"],
            "description": anc.get("description") or m.get("description"),
            "prompt_image": anc.get("prompt_image") or m.get("prompt_image"),
            "illustration": anc.get("illustration") or s["illustration"],
        }
        scenes.append(scene)
        # Les points d'intérêt deviennent des nœuds « observe » rattachés.
        for p in s["pois"]:
            pid = p["id"]
            anc = deja.get(pid, {})
            mp = metas.get(pid, {})
            scenes.append(
                {
                    "id": pid,
                    "type": "observe",
                    "nom": anc.get("nom") or p["nom"],
                    "lieu": anc.get("lieu") or lieu_de(sid),
                    "parent": anc.get("parent") or sid,
                    "mene_a": anc.get("mene_a") or ([p["leadsTo"]] if p["leadsTo"] else []),
                    "texte": anc.get("texte") or p["texte"],
                    "description": anc.get("description") or mp.get("description"),
                    "prompt_image": anc.get("prompt_image") or mp.get("prompt_image"),
                    "illustration": anc.get("illustration") or p["illustration"],
                }
            )

    zone["scenes"] = scenes
    ZONE.write_text(json.dumps(zone, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    sans_lieu = [s["id"] for s in scenes if not s["lieu"]]
    sans_texte = [s["id"] for s in scenes if not s["texte"]]
    print(f"✓ {len(scenes)} scènes écrites dans {ZONE.relative_to(RACINE)}")
    print(f"  avec texte      : {sum(1 for s in scenes if s['texte'])}")
    print(f"  avec image      : {sum(1 for s in scenes if s['illustration'])}")
    print(f"  avec prompt     : {sum(1 for s in scenes if s['prompt_image'])}")
    print(f"  points d'intérêt: {sum(1 for s in scenes if s['type'] == 'observe')}")
    if sans_lieu:
        print(f"  ⚠ sans lieu ({len(sans_lieu)}) : {', '.join(sans_lieu)}")
    if sans_texte:
        print(f"  ⚠ sans texte ({len(sans_texte)}) : {', '.join(sans_texte[:8])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
