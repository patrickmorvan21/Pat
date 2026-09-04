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


def apports_proces(src: str) -> dict[str, str]:
    """Les quatre lignes que le procès DIT selon ce qu'on lui apporte.

    Elles vivent dans le corps de `apportsProces()`, pas dans une table — on
    lit donc les `out.push({ cle, ligne })` du bloc de la fonction. Contrôle
    de compte plus bas : un extracteur qui rend zéro entrée est une alarme,
    jamais un succès (la règle la plus chèrement payée de ce projet).
    """
    i = src.find("export function apportsProces")
    if i < 0:
        return {}
    # ⚠️ NE PAS borner sur le premier `\n}` : la signature de la fonction porte
    # un type d'objet inline (`r: { hameau?…; soupcon?… }`) qui se ferme par un
    # `}` en colonne 0 — le bloc faisait alors 201 caractères et zéro `push`.
    # On borne sur le corps réel : de la déclaration de `out` à son `return`.
    debut = src.find("const out: ApportProces[]", i)
    fin = src.find("return out", debut)
    if debut < 0 or fin < 0:
        return {}
    bloc = src[debut:fin]
    paires = re.findall(
        r'out\.push\(\{\s*cle:\s*"([^"]+)",\s*ligne:\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+)\}', bloc)
    def recoller(v: str) -> str:
        return "".join(re.findall(r'"((?:[^"\\]|\\.)*)"', v)).replace('\\"', '"')
    return {c: recoller(v) for c, v in paires}


def route_fermee(src: str) -> dict[str, list[str]]:
    """Les lignes de Croisée fermée, PAR CAUSE (03/09 : la fermeture nomme
    l'acte qui l'a fermée). Même découpage que `traces_menace` : le segment du
    Record, puis un sous-tableau par clé. Compte contrôlé."""
    i = src.find("export const ROUTE_FERMEE")
    if i < 0:
        return {}
    seg = src[i : src.find("};", i)]
    out = {cle: chaines_de_tableau(bloc_tableau(seg, cle + ":")) for cle in ("echec", "meute", "bete")}
    assert all(out.values()), f"ROUTE_FERMEE : une cause sans texte ({out})"
    return out


def traces_menace(src: str) -> dict[str, list[str]]:
    """Les traces de `TRACES_MENACE` (Record clé → tableau de chaînes).

    Compte contrôlé à l'appel (règle des extracteurs muets) : une clé à zéro
    trace ferait revenir la menace SANS avertissement dans la réplique.
    """
    i = src.find("export const TRACES_MENACE")
    if i < 0:
        return {}
    seg = src[i : src.find("};", i)]
    return {cle: chaines_de_tableau(bloc_tableau(seg, cle + ":")) for cle in ("meute", "bete")}


def record(src: str, ancre: str) -> dict[str, str]:
    """Un `Record<string, string> = { clef: "valeur", … }` en dict.

    ⚠️ Les clefs ne sont pas toutes entre guillemets (`campement:` l'est sans),
    et les valeurs sont parfois concaténées sur plusieurs lignes. Certaines
    sont des NOMBRES (`Record<number, string>`, les paliers du Soupçon) : les
    exclure rendait un dict vide sans le moindre avertissement.
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
        r'(?:"([a-z0-9\-]+)"|([a-zA-Z][a-zA-Z0-9\-]*)|(\d+))\s*:\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+)',
        corps,
    ):
        clef = m.group(1) or m.group(2) or m.group(3)
        val = "".join(re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(4)))
        out[clef] = val.replace('\\"', '"').replace("\\'", "'")
    return out


def sceau_textes() -> dict:
    """Les textes du Sceau (lib/sceaux.ts), pour que la réplique les joue.

    Les trois lignes calculées sont des `return` successifs dans leur fonction,
    du cas le plus faible au plus fort : l'ordre de lecture EST l'ordre des
    passages, donc une liste suffit (index 0 = premier passage).
    """
    src = (LIB / "sceaux.ts").read_text(encoding="utf-8")

    def lignes(fn: str) -> list[str]:
        d = src.find(f"export function {fn}")
        if d < 0:
            return []
        corps = src[d : src.find("\n}", d)]
        return [
            "".join(re.findall(r'"((?:[^"\\]|\\.)*)"', bloc)).replace('\\"', '"').replace("\\'", "'")
            for bloc in re.findall(r"return\s*\(?((?:\s*\"(?:[^\"\\]|\\.)*\"\s*\+?)+)", corps)
        ]

    return {
        "ouverture": lignes("ligneSceauOuverture"),
        "borne": lignes("ligneSceauBorne"),
        "sortie": lignes("ligneSceauSortie"),
        "reconnu": record(src, "export const SCEAU_RECONNU"),
        # LA TRANSFORMATION DU 3e PASSAGE (15/08) : ces lignes REMPLACENT les
        # reconnaissances au-delà de deux traversées, elles ne s'y ajoutent
        # pas. Sans elles, la réplique ferait juger une croissance purement
        # quantitative — exactement ce que la règle du 14/08 interdit.
        "transforme": record(src, "export const SCEAU_TRANSFORME"),
        "geolier": lignes("ligneSceauGeolier"),
    }


def borne_sud_gabarits() -> dict:
    """Les trois retours de `ligneBorneSud`, avec leurs interpolations.

    L'ordre de lecture de la fonction EST l'ordre des cas : revenu vivant,
    puis une seule vie perdue, puis plusieurs (avec le comptage en toutes
    lettres). Les `${…}` deviennent des jetons nommés, que la réplique
    substitue — recopier la prose ici la ferait diverger au premier correctif.

    ⚠️ Ces textes sont écrits en GABARITS (backticks), pas en littéraux
    doubles : un extracteur qui ne lit que `"…"` rendait des phrases coupées
    au milieu. On compte donc ce qu'on extrait avant de rendre.
    """
    src = (LIB / "scene-data.ts").read_text(encoding="utf-8")
    d = src.find("export function ligneBorneSud")
    if d < 0:
        return {}
    corps = src[d : src.find("\n}\n", d)]
    cas: list[str] = []
    for m in re.finditer(r"return\s*\(", corps):
        # bloc équilibré depuis la parenthèse du return
        prof, j = 0, m.end() - 1
        while j < len(corps):
            if corps[j] == "(":
                prof += 1
            elif corps[j] == ")":
                prof -= 1
                if prof == 0:
                    break
            j += 1
        bloc = corps[m.end() : j]
        morceaux = [a or b for a, b in re.findall(r'"((?:[^"\\]|\\.)*)"|`([^`]*)`', bloc)]
        t = "".join(morceaux).replace('\\"', '"').replace("\\'", "'")
        t = t.replace("${nom}", "{nom}").replace("${compte}", "{compte}")
        if t.strip():
            cas.append(t)
    # ⚠️ Un simple `findall` ici, PAS `chaines_de_tableau` : celui-ci recolle
    # les concaténations, donc il rendait les treize mots collés en un seul
    # (« aucununedeux… »). Le contrôle de compte ci-dessous l'a attrapé.
    mots = re.findall(r'"([^"]+)"', bloc_tableau(src, "const CORBEAUX_MOTS"))
    if len(cas) != 3 or len(mots) < 5:
        print(f"   ⚠ borneSud : {len(cas)} cas / {len(mots)} mots — extracteur à revoir")
    return {"cas": cas, "mots": mots}


def main() -> int:
    studio = DATA / "studio-data.json"
    # ⚠️ Régénéré dès que la SOURCE est plus récente — pas seulement s'il
    # manque. C'est le défaut « auditer un instantané » corrigé le 10/08 pour
    # aiguillage.py et strates.py, retrouvé ICI le 17/08 : le kit a livré des
    # scènes de la veille (les retours de menace absents, `laisseMenace`
    # invisible) en annonçant un export réussi.
    sd_ts = LIB / "scene-data.ts"
    if not studio.exists() or studio.stat().st_mtime < sd_ts.stat().st_mtime:
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
            # ⚠️ DÉCODER LES `\\uXXXX` ICI AUSSI (panel du 10/08). Cette branche
            # assemble ses chaînes à la main au lieu de passer par `chaines()`,
            # et oubliait le décodage : 19 répliques du Geôlier partaient dans
            # le kit avec des « l\\u2019outil » littéraux à l'écran. Le jeu, lui,
            # est sain (c'est un échappement TypeScript valide) — c'est l'OUTIL
            # de test qui servait du texte corrompu aux relecteurs.
            brut = "".join(re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(2)))
            brut = brut.replace('\\"', '"').replace("\\'", "'")
            lignes[dernier] = re.sub(
                r"\\u([0-9a-fA-F]{4})", lambda x: chr(int(x.group(1), 16)), brut
            )

    scenes = {}
    for s in d["scenes"]:
        scenes[s["id"]] = {
            k: s[k]
            for k in (
                "id", "nom", "lieu", "narration", "choix", "pointsInteret", "suite",
                "combat", "adversaireNom", "terminal", "registre", "hameauEntree",
                "hameauHalte", "chronometree", "procesFixation", "butin",
                # L'OBJET QUI TRANSFORME LA SCÈNE (12/08) : sans lui, la
                # réplique ne peut pas amarrer la corde, donc l'option qu'elle
                # ouvre resterait à jamais injouable dans le kit.
                "usageObjet",
                # Les sources de SAVOIR/DÉCOUVERTE portées par la scène elle-même
                # (le Marcheur enseigne la Bête en parlant). Sans elles, la
                # réplique ne peut pas jouer « explorer prépare ».
                "savoir", "decouverte",
                # ⚠️ Liste BLANCHE : un champ neuf de `Scene` ne voyage pas tant
                # qu'il n'est pas nommé ici. `sejour` l'a appris à ses dépens —
                # la réplique laissait quitter la Palissade au premier geste.
                "sejour", "narrationEchec", "nuit",
                # LA SCÈNE-VARIANTE (14/08) : elle se joue À LA PLACE d'une
                # autre. Sans ce champ, la réplique jouait toujours l'originale
                # — le Veilleur demandait au lieu de noter, la Fille n'était
                # jamais au Moulin, la Veuve ne savait jamais. Sept scènes
                # entières restaient invisibles au relecteur.
                "remplace",
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
        # LA STRATE DE FAMILIARITÉ (vague 4) : ce qu'un lieu dit de plus à qui
        # y revient. Sans elle, la réplique rejoue la vie 2 mot pour mot — le
        # défaut même que la vague corrige, et que le kit ferait passer pour
        # non corrigé (piège documenté le 9/08 : « ce n'est pas le testeur qui
        # a mal regardé, c'est le kit qui ne montre pas »).
        "familiarite": {
            f["scene"]: {
                **{str(st["passages"]): st["texte"] for st in f["strates"]},
                **({"sur": f["sur"]} if f.get("sur") else {}),
                **({"remplace": f["remplace"]} if f.get("remplace") is not None else {}),
            }
            for f in d.get("familiarite", [])
        },
        "approche": record(src, "const APPROACH: Record<string, string>"),
        "approcheNarration": record(src, "export const APPROACH_NARRATION: Record<string, string>"),
        "indiceRoute": record(src, "const INDICE_ROUTE: Record<string, string>"),
        "ambiances": chaines_de_tableau(bloc_tableau(src, "const LIAISON_AMBIANCES:")),
        "ambiancesLande": chaines_de_tableau(bloc_tableau(src, "const LIAISON_AMBIANCES_LANDE")),
        "bifurcations": chaines_de_tableau(bloc_tableau(src, "const BIFURCATIONS")),
        # ⚠️ LES VARIANTES DE MARCHE, ET C'EST TOUTE L'ÉCHELLE DU SOUPÇON.
        # La réplique ne tirait que dans le FOND : les treize barreaux de
        # l'escalade sociale (« un volet se ferme », « on ne croise plus
        # personne », « trois hommes à la limite du regard ») n'existaient pas
        # dans le kit. Un relecteur pouvait donc jouer deux vies entières sans
        # voir le système qu'on lui demandait de juger, et conclure que rien
        # n'avait changé — le biais du 9/08, sur le lot précisément à valider.
        "variantesMarche": d.get("transitions", {}).get("variantes", []),
        # CE QU'ON APPORTE AU PROCÈS, dit en fiction. ⚠️ Sans ces lignes, la
        # réplique baissait bien le seuil mais ne DISAIT rien — or c'est
        # exactement ce qui fait qu'un procès paraît mérité plutôt que subi.
        # Un relecteur aurait jugé « le procès arrive sans que rien ne l'ait
        # préparé » sur une réplique muette, pas sur le jeu.
        "apportsProces": apports_proces(src),
        # LE SOUPÇON LISIBLE (vague 5) : sans ces trois pools la réplique
        # laissait le Soupçon monter en silence jusqu'au procès — exactement
        # le défaut que la vague corrige dans le jeu.
        "soupconPaliers": record(src, "export const SOUPCON_PALIERS: Record<number, string>"),
        "soupconCraie": record(src, "export const SOUPCON_CRAIE: Record<number, string>"),
        "soupconGeolier": record(src, "export const SOUPCON_GEOLIER: Record<number, string>"),
        # 03/09 — la fermeture nomme sa cause : un tableau par cause
        # (echec / meute / bete), lu sur les sous-tableaux du Record.
        "routeFermee": route_fermee(src),
        # LA SORTIE DU VILLAGE JOUÉE (24/08) : la couture du franchissement
        # ouvre l'écran de sortie (portillon). Sans elle, la réplique ferait
        # « sortir » le joueur d'un tap muet — exactement la téléportation que
        # ce lot corrige dans le jeu.
        "franchitSortie": chaines_de_tableau(bloc_tableau(src, "export const FRANCHIT_SORTIE")),
        # LA MENACE LAISSÉE ACTIVE (17/08) : les traces voyagent avec le kit —
        # sans elles, la réplique ferait revenir la Meute SANS avertissement,
        # et un relecteur jugerait le retour arbitraire (la causalité lisible
        # est la condition n°1 du document).
        "tracesMenace": traces_menace(src),
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
        # LE SCEAU DES LANDES (14/08). Sans ces textes, la réplique ferait
        # croire à un relecteur que survivre ne rapporte rien — exactement le
        # biais mesuré le 9/08, où six griefs du panel venaient du kit et non
        # du jeu. On exporte les trois lignes calculées ET les reconnaissances
        # par lieu ; le gabarit d'index vaut le nombre de passages.
        "sceau": sceau_textes(),
        # LE CÔTÉ SUD DE LA BORNE : la marque du prédécesseur. Trois gabarits
        # (revenu vivant / une seule vie perdue / plusieurs), avec `{nom}` et
        # `{compte}` à substituer. Sans eux, le kit fait croire que la Borne
        # ne se souvient de personne — et c'est justement l'écran où le Sceau
        # répond à sa question.
        "borneSud": borne_sud_gabarits(),
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
                            "bifurcations", "geolierLiaison", "hameauInterieur",
                            "franchitSortie") if not kit[c]]
    # Les traces de menace : chaque clé doit rendre ses textes (extracteur muet
    # = la Meute reviendrait sans avertissement dans la réplique).
    manquant += [f"tracesMenace.{k}" for k in ("meute", "bete")
                 if not kit["tracesMenace"].get(k)]
    if manquant:
        print("⚠️ extraction VIDE pour :", ", ".join(manquant))
        return 1
    print(f"   {sortie.stat().st_size // 1024} Ko")
    return 0


if __name__ == "__main__":
    sys.exit(main())
