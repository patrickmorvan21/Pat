#!/usr/bin/env python3
"""
LE GRAPHE DE PACTUM — toutes les scènes du jeu, en constellation.

Une page à part, dans l'esprit de la vue graphe d'Obsidian : des points, des
liens, rien d'autre. On survole, on clique, et le panneau montre L'IMAGE de la
scène et son TEXTE EXACT — celui que le joueur lit, jamais un résumé.

⚠️ NE REMPLACE PAS PACTUM STUDIO. Le Studio est l'établi : mécanique des choix,
seuils, issues, systèmes, édition. Le graphe est la carte de lecture : où sont
les scènes, comment elles s'enchaînent, ce qu'elles disent, à quoi elles
ressemblent. Deux outils, deux questions.

SENS DE LECTURE : c'est un EXPORT, il se regénère et ne s'édite pas. La source
reste `aldenhar/lib/scene-data.ts`, lue par `tools/studio_data.py`.

MISE À JOUR AUTOMATIQUE : la page ne contient AUCUNE donnée. Elle va chercher
`graphe-data.json` à côté d'elle au chargement. Le workflow
`.github/workflows/graphe.yml` régénère ce JSON à chaque push et le dépose sur
gh-pages — donc la page suit le jeu sans qu'on la reconstruise.

Sorties :
  data/graphe-data.json          — les nœuds, les liens, les textes (les Landes)
  data/graphe-data-<zone>.json   — une zone dont le ROUTAGE est validé mais
                                   dont aucune scène n'est écrite (les Salines
                                   depuis le 13/09) : ses lieux, ses
                                   environnements en groupes ORDONNÉS, et les
                                   liens VRAIS de la traversée à étages
  data/pactum-graphe.html        — la coquille (statique, ne change presque jamais)

La page lit `?zone=<id>` et va chercher le JSON correspondant ; sans paramètre,
les Landes. La liste des zones disponibles voyage DANS chaque JSON
(`zonesDisponibles`) — la coquille ne connaît aucune zone par son nom.
"""

from __future__ import annotations

import json
import subprocess
import sys
from collections import deque
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from style_image import CLAUSE  # noqa: E402  (la recette d'image, source unique)

RACINE = Path(__file__).resolve().parent.parent
STUDIO = RACINE / "data/studio-data.json"
SORTIE_JSON = RACINE / "data/graphe-data.json"
ZONES_DIR = RACINE / "data/zones"
SORTIE_HTML = RACINE / "data/pactum-graphe.html"

# Le dépôt sert de filet quand une image n'est pas encore déployée sur gh-pages
# (un asset neuf arrive dans la branche avant le prochain déploiement du jeu).
BRANCHE = "claude/3d-tactile-prototype-dhd5mi"
BRUT = f"https://raw.githubusercontent.com/patrickmorvan21/Pat/{BRANCHE}/aldenhar/public/assets/"


def court(txt: str, n: int = 4) -> str:
    """Les premiers mots d'un texte — sert de nom à une transition anonyme."""
    mots = txt.replace("\n", " ").split()
    bout = " ".join(mots[:n])
    return bout + ("…" if len(mots) > n else "")


def img(scene: dict) -> dict | None:
    im = scene.get("image") or {}
    f = im.get("fichier")
    if not f:
        return None
    return {"f": f, "h": im.get("hash") or "", "ok": bool(im.get("existe"))}


def construire() -> dict:
    d = json.loads(STUDIO.read_text(encoding="utf-8"))
    scenes = {s["id"]: s for s in d["scenes"]}
    zones = d.get("zones", [])
    regions = d.get("regions", [])

    # ---- de quel lieu relève chaque scène, et comment s'appelle ce lieu -----
    lieu_de = {}
    lieux_meta = {}
    for z in zones:
        for L in z.get("lieux", []):
            lieux_meta[L["id"]] = L
            for sid in L.get("scenes", []):
                lieu_de[sid] = L["id"]
    region_de = {}
    for r in regions:
        for lid in r.get("lieux", []) + r.get("lieuxEnPlus", []):
            region_de[lid] = r["nom"]

    # ⚠️ 35 scènes n'ont AUCUN lieu dans les données de zone : les rencontres,
    # les variantes conditionnelles (celles du Grand Témoin, entre autres) et
    # les nœuds hors pool. Elles se jouent pourtant bien quelque part — une
    # variante remplace un écran DANS son lieu, une suite enchaîne sur place.
    # Sans ce rattrapage elles flottent loin de leur village et deviennent
    # introuvables. Le lieu déduit est marqué comme tel : on ne le fait jamais
    # passer pour une donnée de zone.
    adj: dict[str, set[str]] = {sid: set() for sid in scenes}
    for sid, sc in scenes.items():
        for autre in (sc.get("suite"), (sc.get("remplace") or {}).get("scene")):
            if autre in adj:
                adj[sid].add(autre)
                adj[autre].add(sid)
    file = deque(sid for sid in scenes if sid in lieu_de)
    deduit: dict[str, str] = {}
    while file:
        cur = file.popleft()
        source = lieu_de.get(cur) or deduit.get(cur)
        if not source:
            continue
        for v in adj[cur]:
            if v not in lieu_de and v not in deduit:
                deduit[v] = source
                file.append(v)

    noeuds: list[dict] = []
    liens: list[dict] = []
    vus = set()

    def lien(a: str, b: str, t: str):
        if a == b or a not in vus or b not in vus:
            return
        cle = (a, b, t)
        if cle in lien.faits:
            return
        lien.faits.add(cle)
        liens.append({"a": a, "b": b, "t": t})

    lien.faits = set()

    # ---------------------------- LES LIEUX ---------------------------------
    for lid, L in lieux_meta.items():
        nid = "lieu:" + lid
        vus.add(nid)
        noeuds.append({
            "id": nid,
            "nom": L.get("nom") or lid,
            "cat": "lieu",
            "note": L.get("note") or "",
            "region": region_de.get(lid, ""),
            "image": {"f": L["illustration"], "h": "", "ok": True} if L.get("illustration") else None,
            "prompt": "",
            "desc": [],
            "meta": [f"{L.get('nbScenes', 0)} scènes"] + ([L["note"]] if L.get("note") else []),
        })

    # ---------------------------- LES SCÈNES --------------------------------
    CAT = {"arrivee": "arrivee", "moment": "scene"}
    for sid, s in scenes.items():
        vus.add(sid)
        cat = CAT.get(s.get("typeScene") or "", "scene")
        if s.get("combat") or s.get("adversaire"):
            cat = "rencontre"
        if s.get("terminal"):
            cat = "terminal"

        meta = []
        lid = lieu_de.get(sid) or deduit.get(sid) or (s.get("lieu") or "")
        herite = sid not in lieu_de and sid in deduit
        if lid and lid in lieux_meta:
            meta.append(lieux_meta[lid]["nom"] + (" (rattachée)" if herite else ""))
        if s.get("adversaireNom"):
            meta.append(s["adversaireNom"])
        for drapeau, mot in (
            ("sejour", "séjour"), ("nuit", "nuit"), ("chronometree", "chronométrée"),
            ("registre", "registre"), ("procesFixation", "procès"), ("sejour", None),
        ):
            if mot and s.get(drapeau):
                meta.append(mot)
        if s.get("acces") and s["acces"] not in ("lien",):
            meta.append(s["acces"])

        noeuds.append({
            "id": sid,
            "nom": s.get("nom") or sid,
            "cat": cat,
            "lieu": lid,
            "lieuHerite": herite,
            "region": region_de.get(lid, ""),
            "image": img(s),
            # LA DESCRIPTION EXACTE : la narration telle que le joueur la lit.
            "desc": list(s.get("narration") or []),
            "descEchec": list(s.get("narrationEchec") or []),
            "resume": s.get("description") or "",
            "prompt": s.get("promptImage") or "",
            "meta": meta,
            "sorties": [
                {"label": c.get("label", ""), "vers": (c.get("sortie") or {}).get("toScene") or c.get("dest") or ""}
                for c in s.get("choix", [])
            ],
        })

    # ---------------------------- LES ACTIONS -------------------------------
    # Depuis le 13/08 les points d'intérêt sont devenus des CHOIX, et leur
    # image a migré de `PointInteret.illustration` vers `Choice.illustration`.
    # L'extracteur ne lisait que les scènes : ces écrans-là — le plan
    # rapproché de la Borne, la corde de la Chapelle, le manteau du Chemin du
    # Sud — avaient donc disparu du graphe SANS UN MOT, et rien ne permettait
    # de les juger ni de leur demander une image.
    # On ne prend que les actions qui PORTENT une image : les autres gardent
    # volontairement l'image de leur lieu (une scène = une image), et les
    # lister toutes tripleraient le nombre de nœuds pour rien.
    for sid, s in scenes.items():
        lid = lieu_de.get(sid) or deduit.get(sid) or (s.get("lieu") or "")
        for c in s.get("choix", []):
            fiche = c.get("image")
            if not fiche:
                continue
            nid = f"act:{sid}:{c.get('id', '')}"
            vus.add(nid)
            n = {
                "id": nid,
                "nom": c.get("label") or c.get("id") or "",
                "cat": "action",
                "lieu": lid,
                "region": region_de.get(lid, ""),
                "image": {"f": fiche["fichier"], "h": fiche.get("hash") or "",
                          "ok": bool(fiche.get("existe"))},
                # Ce que le joueur LIT sur cet écran, mot pour mot.
                "desc": [c.get("consequence")] if c.get("consequence") else [],
                "meta": ["action · " + (s.get("nom") or sid)],
            }
            if fiche.get("statut") == "heritee" and fiche.get("herite"):
                n["meta"].append("image partagée avec " + fiche["herite"])
            noeuds.append(n)
            lien(sid, nid, "appartient")

    # --------------------------- LES TRANSITIONS ----------------------------
    # Elles n'existent nulle part comme scènes : une liaison est fabriquée à
    # l'exécution. Ce sont pourtant les écrans les plus VUS d'une vie.
    # L'enclave du village : la seule région de la zone. Son id sert à ranger
    # DANS son cercle les textes de marche qui ne se jouent que dedans.
    groupe_enclave = next((r["id"] for r in regions if len(r.get("lieux", [])) > 1), "")

    T = d.get("transitions", {})
    for i, txt in enumerate(T.get("fond", [])):
        nid = f"trans:fond:{i}"
        vus.add(nid)
        noeuds.append({"id": nid, "nom": court(txt), "cat": "transition",
                       "image": None, "desc": [txt],
                       "meta": ["marche · fond", "jouée des deux côtés"]})
    for i, txt in enumerate(T.get("fondLande", [])):
        nid = f"trans:fondLande:{i}"
        vus.add(nid)
        noeuds.append({"id": nid, "nom": court(txt), "cat": "transition",
                       "image": None, "desc": [txt],
                       "meta": ["marche · fond de pleine lande", "hors du village"]})
    for i, b in enumerate(T.get("bifurcations", [])):
        nid = f"trans:bif:{i}"
        vus.add(nid)
        noeuds.append({"id": nid, "nom": court(b), "cat": "transition",
                       "image": None, "desc": [b],
                       "meta": ["marche · bifurcation", "jouée des deux côtés"]})
    for i, v in enumerate(T.get("variantes", [])):
        nid = f"trans:var:{i}"
        cond = v.get("conditions") or {}
        vus.add(nid)
        etiq = []
        for k, val in cond.items():
            if k == "from":
                continue
            etiq.append(f"{k} {val if not isinstance(val, list) else ' / '.join(map(str, val))}")
        # Une transition peut porter SON image (31/08). Sans ça le graphe la
        # dirait « sans image » alors qu'elle en sert une en jeu.
        ill = v.get("illustration")
        f = ill.split("/")[-1] if ill else None
        # OÙ cette marche se joue, d'après sa seule condition de PROVENANCE
        # (`ou_se_joue`, studio_data). Une transition gardée sur l'intérieur du
        # village n'est pas « jouée partout » : elle appartient à l'enclave, au
        # même titre que ses lieux — d'où le `groupe`, qui la place DANS le
        # cercle. On ne lui invente pour autant aucun lien vers un lieu précis :
        # elle se joue d'une ruelle à l'autre, pas depuis une porte nommée.
        ou = v.get("ou") or "partout"
        n = {"id": nid, "nom": court(v.get("texte", "")), "cat": "transition",
             "image": ({"f": f, "h": "", "ok": True} if f else None),
             "desc": [v.get("texte", "")],
             "meta": ["marche · variante",
                      {"hameau": "dans le village", "lande": "hors du village",
                       "partout": "jouée des deux côtés"}[ou]] + etiq}
        if ou == "hameau" and groupe_enclave:
            n["groupe"] = groupe_enclave
        noeuds.append(n)

    # -------------------------- LES VUES DE MARCHE --------------------------
    for m in d.get("ecransDeMarche", []):
        nid = m["id"]
        vus.add(nid)
        noeuds.append({
            "id": nid, "nom": m["fichier"].replace(".png", ""), "cat": "marche",
            "image": {"f": m["fichier"], "h": m.get("hash") or "", "ok": bool(m.get("existe"))},
            "desc": [], "resume": m.get("regle") or "", "meta": ["vue de marche"],
        })

    # ------------------------------ LES LIENS -------------------------------
    for sid, s in scenes.items():
        if s.get("suite"):
            lien(sid, s["suite"], "suite")
        if (s.get("remplace") or {}).get("scene"):
            lien(s["remplace"]["scene"], sid, "variante")
        for c in s.get("choix", []):
            vers = (c.get("sortie") or {}).get("toScene") or c.get("dest")
            if vers:
                lien(sid, vers, "sortie")
        for p in s.get("pointsInteret", []):
            if p.get("mèneVers"):
                lien(sid, p["mèneVers"], "sortie")
        # appartenance : c'est elle qui fait apparaître les grappes
        lid = lieu_de.get(sid) or deduit.get(sid)
        if lid:
            lien("lieu:" + lid, sid, "appartient")

    for i, v in enumerate(T.get("variantes", [])):
        for f in (v.get("conditions") or {}).get("from", []) or []:
            # ⚠️ `from: HAMEAU_INTERIOR` sort de l'export sous le NOM de la
            # constante (la réplique en dépend). Ce n'est pas un id de scène :
            # le lien serait mort. Ces variantes-là sont rangées par `groupe`.
            if f == "HAMEAU_INTERIOR":
                continue
            lien(f"trans:var:{i}", f, "contexte")

    # les vues de marche gravitent autour du lieu qu'elles annoncent
    for m in d.get("ecransDeMarche", []):
        for lid, L in lieux_meta.items():
            racine = lid.replace("_", "")
            if racine[:9] and racine[:9] in m["fichier"].replace("_", ""):
                lien(m["id"], "lieu:" + lid, "contexte")

    degres = {n["id"]: 0 for n in noeuds}
    for l in liens:
        degres[l["a"]] += 1
        degres[l["b"]] += 1
    for n in noeuds:
        n["deg"] = degres[n["id"]]

    try:
        commit = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=RACINE,
                                capture_output=True, text=True).stdout.strip()
    except Exception:
        commit = ""

    # Le Hameau est la seule enclave géographique réelle de la zone : ses lieux
    # sont VOISINS dans la fiction, alors que le reste de la lande n'a aucune
    # adjacence (la traversée tire au sort). On l'exporte donc comme groupe pour
    # que la page puisse le rassembler et l'entourer — sans inventer de chemin.
    groupes = []
    for r in regions:
        membres = ["lieu:" + l for l in (r.get("lieux", []) + r.get("lieuxEnPlus", []))
                   if l in lieux_meta]
        if len(membres) > 1:
            groupes.append({"id": r["id"], "nom": r["nom"], "lieux": membres})

    return {
        "groupes": groupes,
        "genere": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "commit": commit,
        "brut": BRUT,
        "clauseStyle": CLAUSE,
        "noeuds": noeuds,
        "liens": liens,
        "totaux": {
            "scenesRattachees": len(deduit),
            "scenes": len(scenes),
            "lieux": len(lieux_meta),
            "transitions": (len(T.get("fond", [])) + len(T.get("fondLande", []))
                            + len(T.get("variantes", [])) + len(T.get("bifurcations", []))),
            "marches": len(d.get("ecransDeMarche", [])),
            "actions": sum(1 for n in noeuds if n["cat"] == "action"),
            "liens": len(liens),
        },
    }


def construire_routage(z: dict) -> dict:
    """Le graphe d'une zone dont le ROUTAGE est validé mais dont aucune scène
    n'est écrite. Il n'a rien à lire dans studio-data (qui ne connaît que les
    scènes) : il se bâtit depuis la matière de production elle-même.

    Ce qu'il dessine, et pourquoi c'est vrai — contrairement aux Landes, où
    « aucun chemin n'existe entre les lieux » (la traversée tire au sort), une
    zone à étages a un ORDRE : les environnements se traversent toujours dans
    le même sens, l'entrée d'une étape se joue avant son pool, ses fins se
    jouent après et dans l'ordre. Les liens tracés sont donc ceux du moteur
    (`prochainPas`, lib/etages.ts) :
      · entrée (ou beat d'arrivée) → chaque lieu du pool : un tirage possible
      · chaque lieu du pool → la première fin (ou l'étape suivante)
      · fin → fin suivante, dernière fin → entrée de l'étape suivante
      · un pool vers un pool (étape sans entrée) : n'importe lequel vers
        n'importe lequel — tracé en lien FAIBLE, sinon c'est une pelote.
    """
    zz = z["zone"]
    L = {l["id"]: l for l in z["lieux"]}
    envs = sorted(z["environnements"], key=lambda e: e["ordre"])
    nom_r = {r["id"]: r["nom"] for r in z.get("rencontres", [])}
    nom_c = {c["id"]: c["nom"] for c in z.get("creatures", [])}
    nom_o = {o["id"]: o["nom"] for o in z.get("objets", [])}
    frag = {f["id"]: f for f in z.get("fragments", [])}
    env_nom = {e["id"]: e["nom"] for e in envs}
    JOUES = ("entree", "pool", "fin")
    e_fins = {e["id"]: list(e.get("fin") or []) for e in envs}
    ROLE = {"entree": "entrée de l'étape", "pool": "tiré au sort", "fin": "obligatoire, en fin d'étape",
            "arrivee": "beat d'arrivée — pas un lieu, ne crédite rien"}
    noeuds: list[dict] = []
    liens: list[dict] = []
    vus: set[str] = set()
    faits: set[tuple] = set()

    def nid(i: str) -> str:
        return "lieu:" + i

    def lien(a: str, b: str, t: str):
        if a == b or a not in vus or b not in vus or (a, b, t) in faits:
            return
        faits.add((a, b, t))
        liens.append({"a": a, "b": b, "t": t})

    for l in z["lieux"]:
        if l["role"] not in JOUES + ("arrivee",):
            continue
        meta = [env_nom.get(l["environnement"], l["environnement"]), ROLE[l["role"]]]
        if l.get("campement"):
            meta.append("campement")
        for c in l.get("combats", []):
            meta.append("combat · " + nom_c.get(c, c))
        for r in l.get("rencontres", []):
            meta.append(nom_r.get(r, r))
        for f in l.get("fragments", []):
            g = frag.get(f, {})
            meta.append(f"fragment {g.get('ordre', '?')}" + (" (garanti)" if g.get("lieu_garanti") == l["id"] else ""))
        if l.get("fragments_exclusifs"):
            meta.append("un seul des deux fragments par passage")
        for o in l.get("objets", []):
            meta.append("objet · " + nom_o.get(o, o))
        for m in l.get("minijeux", []):
            meta.append("geste · " + m)
        vus.add(nid(l["id"]))
        noeuds.append({
            "id": nid(l["id"]), "nom": l["nom"],
            "cat": "arrivee" if l["role"] == "arrivee" else "lieu",
            # le RÔLE dans l'étape : c'est lui qui place le nœud sur l'anneau
            # de son environnement (tête à gauche, fins à droite, pool entre)
            "role": l["role"],
            "rang": e_fins[l["environnement"]].index(l["id"]) if l["role"] == "fin" else None,
            "groupe": l["environnement"], "lieu": l["environnement"],
            "image": None, "prompt": "",
            # LA NOTE DE LA BIBLE, telle quelle : c'est tout ce qui est écrit.
            "desc": [l.get("note", "")],
            "meta": meta,
        })
    # La matière ABSORBÉE par le tri (Broyeuse → Forge, Bassin comble →
    # Passerelle) : montrée rattachée à son lieu d'accueil, jamais perdue.
    for l in z["lieux"]:
        if l["role"] != "fusionne":
            continue
        vus.add(nid(l["id"]))
        noeuds.append({
            "id": nid(l["id"]), "nom": l["nom"], "cat": "action",
            "groupe": l["environnement"], "lieu": l["environnement"],
            "image": None, "desc": [l.get("note", "")],
            "meta": ["fusionné dans " + L[l["fusionne_dans"]]["nom"], l.get("raison", "")],
        })
        lien(nid(l["fusionne_dans"]), nid(l["id"]), "appartient")

    sorties_prec: list[str] = []
    for e in envs:
        pool = [l["id"] for l in z["lieux"] if l["environnement"] == e["id"] and l["role"] == "pool"]
        fins = list(e.get("fin") or [])
        tete = e.get("arrivee") or e.get("entree")
        entrees = [tete] if tete else pool
        # d'une étape à la suivante
        # un vers un = la suite obligée ; plusieurs vers un = une sortie ;
        # plusieurs vers plusieurs = faible, sinon c'est une pelote
        t_ = "suite" if (tete and len(sorties_prec) == 1) else ("sortie" if tete else "contexte")
        for a in sorties_prec:
            for b in entrees:
                lien(nid(a), nid(b), t_)
        apres_pool = fins[0] if fins else None
        if tete:
            for p_ in pool:
                lien(nid(tete), nid(p_), "sortie")
            if apres_pool and (e.get("tirages") or [1])[0] == 0:
                lien(nid(tete), nid(apres_pool), "sortie")   # zéro tirage possible
        if apres_pool:
            for p_ in pool:
                lien(nid(p_), nid(apres_pool), "sortie")
        for a, b in zip(fins, fins[1:]):
            lien(nid(a), nid(b), "suite")
        sorties_prec = [fins[-1]] if fins else pool

    degres = {n["id"]: 0 for n in noeuds}
    for l in liens:
        degres[l["a"]] += 1
        degres[l["b"]] += 1
    for n in noeuds:
        n["deg"] = degres[n["id"]]

    groupes = [{
        "id": e["id"], "nom": e["nom"], "ordre": e["ordre"], "sous": e.get("sous_titre", ""),
        "lieux": [nid(l["id"]) for l in z["lieux"]
                  if l["environnement"] == e["id"] and l["role"] in JOUES + ("arrivee",)],
    } for e in envs]
    nb_lieux = sum(1 for n in noeuds if n["cat"] == "lieu")
    return {
        "mode": "routage",
        "zone": {"id": zz["id"], "nom": zz["nom"], "statut": zz.get("statut", "")},
        "groupes": groupes,
        "brut": BRUT, "clauseStyle": CLAUSE,
        "noeuds": noeuds, "liens": liens,
        "totaux": {"scenes": 0, "lieux": nb_lieux, "etapes": len(envs),
                   "actions": sum(1 for n in noeuds if n["cat"] == "action"),
                   "transitions": 0, "marches": 0, "liens": len(liens), "scenesRattachees": 0,
                   "retires": sum(1 for l in z["lieux"] if l["role"] == "retire")},
    }


def zones_en_routage() -> list[tuple[str, dict]]:
    """Les zones dont le routage est validé sans qu'une scène soit écrite."""
    out = []
    for zf in sorted(ZONES_DIR.glob("*.json")):
        z = json.loads(zf.read_text(encoding="utf-8"))
        if (z.get("zone") or {}).get("statut") == "routage_valide" and not z.get("scenes"):
            out.append((zf.stem, z))
    return out


def main() -> int:
    if not STUDIO.exists():
        print("data/studio-data.json manquant — lance d'abord tools/studio_data.py", file=sys.stderr)
        return 1
    routage = zones_en_routage()
    # la liste des zones voyage dans CHAQUE JSON : la coquille n'en connaît aucune
    dispo = [{"id": "", "nom": "Les Landes"}] + [{"id": stem, "nom": z["zone"]["nom"]} for stem, z in routage]
    commun = {"genere": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
              "zonesDisponibles": dispo}
    try:
        commun["commit"] = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=RACINE,
                                          capture_output=True, text=True).stdout.strip()
    except Exception:
        commun["commit"] = ""
    g = construire()
    g.update(commun)
    SORTIE_JSON.write_text(json.dumps(g, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    for stem, z in routage:
        gz = construire_routage(z)
        gz.update(commun)
        sortie = SORTIE_JSON.with_name(f"graphe-data-{stem}.json")
        sortie.write_text(json.dumps(gz, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        tz = gz["totaux"]
        print(f"{sortie.relative_to(RACINE)} — {tz['lieux']} lieux · {tz['etapes']} environnements · "
              f"{tz['actions']} fusionnés · {tz['retires']} retiré(s) · {tz['liens']} liens "
              f"({sortie.stat().st_size // 1024} Ko)")
    gabarit = Path(__file__).resolve().parent / "graphe_page.html"
    SORTIE_HTML.write_text(gabarit.read_text(encoding="utf-8"), encoding="utf-8")
    t = g["totaux"]
    print(f"data/graphe-data.json   — {t['scenes']} scènes · {t['lieux']} lieux · "
          f"{t['actions']} actions illustrées · "
          f"{t['transitions']} transitions · {t['marches']} vues de marche · {t['liens']} liens "
          f"({t['scenesRattachees']} scènes rattachées à leur lieu par déduction) "
          f"({SORTIE_JSON.stat().st_size // 1024} Ko)")
    print(f"data/pactum-graphe.html — {SORTIE_HTML.stat().st_size // 1024} Ko")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
