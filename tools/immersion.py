#!/usr/bin/env python3
"""
AUDIT D'IMMERSION — les textes injectables face à leur contexte réel.

Née du playtest du 7/08 : toutes les ruptures d'immersion relevées par Patrick
appartenaient à la MÊME famille — un texte écrit pour un contexte (le village,
des gens autour, un combat) servi dans un autre (la lande vide, une bête).
Cette famille se détecte mécaniquement : c'est le rôle de ce script, pour que
la détection n'attende plus une capture d'écran.

Principe :
  1. Chaque POOL de textes injectés à l'exécution est extrait du code avec le
     GARDE que le code lui applique réellement (village / partout / liaison /
     combat exclu…).
  2. Chaque texte est classé par ce qu'il PRÉSUPPOSE, au lexique : des GENS
     (un homme, une mère, on te répond…), le VILLAGE (muret, ruelle, volet…),
     ou rien (jouable partout).
  3. Un texte qui présuppose plus que son garde ne garantit = une rupture
     d'immersion possible → signalée.

Heuristique, donc : liste d'EXEMPTIONS explicites en bas de fichier (chaque
exemption doit dire POURQUOI). Un signalement n'est pas toujours un bug — mais
il doit toujours être regardé.

Usage : python3 tools/immersion.py [--strict]
  --strict : sort en erreur si un signalement non exempté existe (pour le build).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
LIB = RACINE / "aldenhar" / "lib"
# Les pools injectés à l'exécution ne vivent pas tous dans lib/ : ceux qui
# n'appartiennent à aucune donnée (la porte qui se ferme) vivent dans le
# composant qui les sert.
COMPOSANTS = RACINE / "aldenhar" / "components"

# ── lexiques de présupposition ────────────────────────────────────────────────
# Des GENS sont là (quelqu'un d'autre que le héros agit/regarde/parle).
GENS = re.compile(
    r"(un homme|une femme|un enfant|une mère|un vieux|le vieux\b|la Doyenne"
    r"|des gens|les gens|un voisin|un passant|le barrage|trois hommes"
    # « on NE te parle plus » présuppose autant de monde que « on te parle » —
    # la négation avait fait passer la manifestation de FIXÉ sous le radar.
    r"|on (?:ne )?te (?:parle|répond|suit|regarde|dit|adresse)|on t'adresse"
    r"|on parle devant toi"
    r"|te croise|son salut|son panier|son quignon|coupe son quignon"
    r"|pose un bol|conversation|quelqu'un (?:ralentit|est passé|fait ta route)"
    r"|personne ne relève|volets? se referm|une écuelle)",
    re.IGNORECASE,
)
# Le décor est le VILLAGE (bâti, rues, seuils).
# NB : « muret » n'y est PAS — dans ce monde les murets courent en pleine
# lande (« ils suivent des tracés qui ne mènent nulle part », le Gamin des
# Murets y rôde) : un muret ne présuppose pas le village.
# ⚠️ FAUX AMI connu : « la porte » attrape aussi le VERBE (« quand on la
# porte »). Un signalement sur ce mot se relit avant d'être cru — c'est arrivé
# le 10/08 sur la craie du Soupçon, où le texte était parfaitement en contexte.
VILLAGE = re.compile(
    r"(ruelle|volet|hameau|village|chapelle|cloche\b|grange|pavé"
    r"|une porte\b|la porte\b|un seuil|le seuil|toits?\b|linge|maison)",
    re.IGNORECASE,
)
# La LANDE ouverte (l'inverse : un texte de lande servi DANS le village).
LANDE = re.compile(r"(la lande|bruyère|le plateau\b|les Landes\b)", re.IGNORECASE)


def classer(texte: str) -> set[str]:
    besoins: set[str] = set()
    if GENS.search(texte):
        besoins.add("gens")
    if VILLAGE.search(texte):
        besoins.add("village")
    if LANDE.search(texte):
        besoins.add("lande")
    return besoins


# ── extraction des pools et de leurs gardes réels ─────────────────────────────

def empreinte(texte: str) -> str:
    """Trois premiers mots significatifs — un identifiant de pool qui suit le
    TEXTE et non son rang, pour que les exemptions ne se décalent jamais."""
    mots = [m for m in re.findall(r"[a-zà-ÿ]{4,}", texte.lower())][:3]
    return " ".join(mots) if mots else texte[:24]


def chaines_de_tableau(bloc: str) -> list[str]:
    """Les chaînes d'un littéral TS, en recollant les concaténations `+`."""
    morceaux = re.findall(r'"((?:[^"\\]|\\.)*)"', bloc)
    # recoller : une entrée du tableau = tout jusqu'à la virgule de niveau 0 ;
    # approximation robuste ici — les pools sont des listes plates de chaînes
    # concaténées, donc on recolle les fragments qui ne finissent pas par
    # une ponctuation forte.
    entrees: list[str] = []
    cour = ""
    for m in morceaux:
        cour += m.replace('\\"', '"').replace("\\'", "'")
        # une entrée se termine sur ponctuation finale (.!?») éventuellement
        # suivie d'espace ; les fragments de concaténation finissent en plein mot
        if re.search(r"[.!?»…]\s*$", cour) or len(cour) > 400:
            entrees.append(cour.strip())
            cour = ""
    if cour.strip():
        entrees.append(cour.strip())
    return entrees


def bloc_tableau(src: str, ancre: str) -> str:
    """Le contenu du PREMIER tableau [...] qui suit l'ancre."""
    i = src.find(ancre)
    if i < 0:
        return ""
    # ⚠️ Sauter les `[]` d'ANNOTATION DE TYPE : `const X: string[] = [` a un
    # premier crochet qui se referme aussitôt. Ce piège rendait muets, sans
    # rien signaler, tous les pools typés (ambiances, bifurcations, variantes
    # de liaison) — trouvé le 8/08 en branchant le Geôlier sur l'audit.
    j = i
    while True:
        j = src.find("[", j)
        if j < 0:
            return ""
        if src[j + 1 :].lstrip()[:1] != "]":
            break
        j += 1
    prof = 0
    for k in range(j, len(src)):
        if src[k] == "[":
            prof += 1
        elif src[k] == "]":
            prof -= 1
            if prof == 0:
                return src[j + 1 : k]
    return ""


def pools() -> list[dict]:
    """Chaque pool : nom, textes, et le garde que le CODE applique vraiment.

    ⚠️ À tenir à jour quand un nouveau pool d'injection apparaît — c'est le
    prix de l'audit. Le garde déclaré ici doit décrire le code, pas l'intention.
    """
    out: list[dict] = []
    etats_src = (LIB / "etats.ts").read_text(encoding="utf-8")
    scene_src = (LIB / "scene-data.ts").read_text(encoding="utf-8")
    loi_src = (LIB / "loi-substitution.ts").read_text(encoding="utf-8")
    scene_tsx = (COMPOSANTS / "Scene.tsx").read_text(encoding="utf-8")

    # — états : manifestation (servie à l'ACQUISITION, n'importe où),
    #   réactions (village sauf indices reactionsPartout), intruses (partout),
    #   guérison (n'importe où).
    # ⚠️ NE PAS EXIGER `id:` JUSTE APRÈS L'ACCOLADE (repasse du 10/08) :
    # `accompagne` porte un docblock de 19 lignes entre `{` et `id:`, et
    # échappait donc entièrement à l'audit — sa manifestation, ses deux
    # réactions et sa guérison n'ont jamais été examinées. `sejour.py` avait
    # déjà documenté ce piège et l'avait corrigé POUR LUI SEUL : la leçon
    # n'avait pas traversé. Le nombre d'états trouvés est contrôlé plus bas.
    for m in re.finditer(r'\{\s*(?:/\*(?:[^*]|\*(?!/))*\*/\s*|//[^\n]*\n\s*)*id:\s*"([a-z]+)",\s*nom:', etats_src):
        eid = m.group(1)
        debut = m.start()
        fin = etats_src.find('\n  {', debut + 10)
        bloc = etats_src[debut : fin if fin > 0 else len(etats_src)]
        manif = bloc_tableau(bloc, "manifestation:") or ""
        # manifestation est une chaîne simple, pas un tableau :
        mm = re.search(r"manifestation:\s*((?:\"(?:[^\"\\]|\\.)*\"\s*\+?\s*)+)", bloc)
        if mm:
            out.append({
                "pool": f"etat {eid} · manifestation",
                # FIXÉ ne se pose plus qu'au VILLAGE depuis le 7/08 (pose de
                # jet gardée par dansLeVillage + pose différée à l'arrivée,
                # Scene.tsx) : sa manifestation est couverte par ce garde-là.
                # Les autres états se posent n'importe où.
                "garde": {"village", "gens"} if eid == "fixe" else {"partout"},
                "textes": ["".join(re.findall(r'"((?:[^"\\]|\\.)*)"', mm.group(1)))],
            })
        reactions = chaines_de_tableau(bloc_tableau(bloc, "reactions:"))
        partout = [int(x) for x in re.findall(r"\d+", (re.search(r"reactionsPartout:\s*\[([^\]]*)\]", bloc) or re.match(r"", ""))
                   .group(1))] if re.search(r"reactionsPartout:", bloc) else []
        for i, t in enumerate(reactions):
            out.append({
                "pool": f"etat {eid} · réaction {i}",
                "garde": {"partout"} if i in partout else {"village", "gens"},
                "textes": [t],
            })
        intruses = chaines_de_tableau(bloc_tableau(bloc, "lignesIntruses:"))
        for i, t in enumerate(intruses):
            out.append({"pool": f"etat {eid} · intruse {i}", "garde": {"partout"}, "textes": [t]})
        gm = re.search(r"guerison:\s*((?:\"(?:[^\"\\]|\\.)*\"\s*\+?\s*)+)", bloc)
        if gm:
            out.append({
                "pool": f"etat {eid} · guérison",
                "garde": {"partout"},
                "textes": ["".join(re.findall(r'"((?:[^"\\]|\\.)*)"', gm.group(1)))],
            })

    # — paliers du Soupçon : gardés VILLAGE depuis le 7/08 (Scene.tsx,
    #   dansLeVillage(nextScene.id) dans la condition du manifest).
    paliers = re.search(r"SOUPCON_PALIERS[^=]*=\s*\{(.*?)\n\};", scene_src, re.S)
    if paliers:
        for i, t in enumerate(chaines_de_tableau(paliers.group(1))):
            out.append({"pool": f"soupçon palier {i + 1}", "garde": {"village", "gens"}, "textes": [t]})

    # — LA CRAIE : l'autre piste du même palier, servie quand on est DEHORS
    #   (Scene.tsx : dansLeVillage(…) ? PALIERS : CRAIE). Elle ne doit donc
    #   présupposer aucun bâti — c'est toute sa raison d'être.
    craie = re.search(r"SOUPCON_CRAIE[^=]*=\s*\{(.*?)\n\};", scene_src, re.S)
    if craie:
        for i, t in enumerate(chaines_de_tableau(craie.group(1))):
            out.append({"pool": f"soupçon craie {i + 1}", "garde": {"lande", "gens"}, "textes": [t]})

    # — LA NUIT (10/08) : servie au campement, qui est le Moulin sans Ailes —
    #   un abri, donc un toit et des poutres sont acquis. En revanche aucun
    #   VILLAGE : le Moulin est en pleine lande.
    for nom, ancre in (("nuit ouverture", "const NUIT_OUVERTURE"), ):
        for i, t in enumerate(chaines_de_tableau(bloc_tableau(scene_src, ancre))):
            out.append({"pool": f"{nom} {i + 1}", "garde": {"lande"}, "textes": [t]})
    mnc = re.search(r"NUIT_CORPS[^=]*=\s*\{(.*?)\n\};", scene_src, re.S)
    if mnc:
        for i, t in enumerate(chaines_de_tableau(mnc.group(1))):
            out.append({"pool": f"nuit corps {i + 1}", "garde": {"lande"}, "textes": [t]})

    # — LA SORTIE DE ZONE (10/08) : jouée à la Descente, au bout des Landes.
    #   Le hameau peut y être NOMMÉ (on le laisse derrière soi, il est loin) :
    #   c'est un souvenir de la traversée, pas un décor présent.
    # ⚠️ Extraire le CORPS de la fonction, par comptage d'accolades. La
    # première version cherchait `.*?\n\}` : le non-gourmand s'arrêtait à
    # l'accolade du TYPE du paramètre `ctx`, et l'audit examinait donc
    # « jurefauxrefuse » — les littéraux du type — au lieu des quatre
    # paragraphes. Un garde muet est pire que pas de garde : il rassure.
    ideb = scene_src.find("export function traceDeSortie(")
    if ideb >= 0:
        # ⚠️ Le `{` de la SIGNATURE est celui du type du paramètre `ctx`, pas
        # celui du corps : partir de lui referme sur le type et on réaudite
        # « jurefauxrefuse ». On saute donc jusqu'après la parenthèse
        # fermante des paramètres.
        par, k0 = 0, ideb
        for k in range(ideb, len(scene_src)):
            if scene_src[k] == "(":
                par += 1
            elif scene_src[k] == ")":
                par -= 1
                if par == 0:
                    k0 = scene_src.find("{", k)
                    break
        prof, fin = 0, ideb
        for k in range(k0, len(scene_src)):
            if scene_src[k] == "{":
                prof += 1
            elif scene_src[k] == "}":
                prof -= 1
                if prof == 0:
                    fin = k
                    break
        # ⚠️ NOMMER PAR LE CONTENU, JAMAIS PAR LE RANG (relecture par agents,
        # 10/08). Ces pools s'appelaient « sortie de zone 1 / 2 » et leurs
        # exemptions étaient indexées dessus : insérer un paragraphe en tête de
        # `traceDeSortie` décalait tout, et les exemptions atterrissaient
        # silencieusement sur les MAUVAIS textes — exemptant un vrai défaut et
        # signalant un texte juste. Une empreinte de contenu suit le texte.
        # ⚠️ N'AUDITER QUE LES ARGUMENTS DE `push(...)`, pas le corps entier
        # (relecture par agents, 10/08). Le corps contient les comparaisons
        # `ctx.serment === "jure"` : le collecteur de chaînes les recollait à
        # la prose voisine et le garde auditait « jurePersonne ne t'a suivi… ».
        # Sans effet sur la classification lexicale, mais un rapport illisible
        # — et le jour où quelqu'un lit la sortie du garde pour arbitrer, il
        # lit du texte corrompu.
        corps = scene_src[k0:fin]
        for m in re.finditer(r"push\(", corps):
            pr, deb = 0, m.end() - 1
            for k in range(deb, len(corps)):
                if corps[k] == "(":
                    pr += 1
                elif corps[k] == ")":
                    pr -= 1
                    if pr == 0:
                        for t in chaines_de_tableau(corps[deb : k + 1]):
                            out.append(
                                {"pool": f"sortie de zone ({empreinte(t)})", "garde": {"lande"}, "textes": [t]}
                            )
                        break

    # — LE GEÔLIER QUI COMPTE (10/08) : il parle de partout.
    sr = re.search(r"JAILER_SANS_RISQUE\s*=\s*((?:\s*\"(?:[^\"\\]|\\.)*\"\s*\+?)+)", scene_src)
    if sr:
        out.append({
            "pool": "geôlier sans risque",
            "garde": {"partout"},
            "textes": ["".join(re.findall(r'"((?:[^"\\]|\\.)*)"', sr.group(1)))],
        })

    # — SECOND PROCÈS (10/08) : toujours au Petit Tribunal, donc le village
    #   et ses gens sont acquis.
    sp = re.search(r"SECOND_PROCES\s*=\s*((?:\s*\"(?:[^\"\\]|\\.)*\"\s*\+?)+)", scene_src)
    if sp:
        out.append({
            "pool": "second procès",
            "garde": {"village", "gens"},
            "textes": ["".join(re.findall(r'"((?:[^"\\]|\\.)*)"', sp.group(1)))],
        })

    # — le Geôlier qui nomme le palier franchi : il parle de partout.
    geol = re.search(r"SOUPCON_GEOLIER[^=]*=\s*\{(.*?)\n\};", scene_src, re.S)
    if geol:
        for i, t in enumerate(chaines_de_tableau(geol.group(1))):
            out.append({"pool": f"soupçon geôlier {i + 1}", "garde": {"partout"}, "textes": [t]})

    # — la route fermée par un échec dur : jouée sur une liaison, où qu'elle
    #   soit (une ruelle du hameau est une liaison comme une autre).
    for i, t in enumerate(chaines_de_tableau(bloc_tableau(scene_src, "const ROUTE_FERMEE"))):
        out.append({"pool": f"route fermée {i}", "garde": {"partout"}, "textes": [t]})

    # — ambiances de liaison (fond) : servies sur TOUTE liaison, village
    #   compris quand les variantes de village sont épuisées (anti-répétition).
    for i, t in enumerate(chaines_de_tableau(bloc_tableau(scene_src, "const LIAISON_AMBIANCES"))):
        out.append({"pool": f"liaison ambiance {i}", "garde": {"partout"}, "textes": [t]})

    # — LA PORTE QUI SE FERME (9/08) : dite quand un échec dur consomme une
    #   possibilité du lieu. Un séjour peut être n'importe où — la Colline, le
    #   Marché, la berge de la Mare : ces lignes ne peuvent rien présupposer.
    for i, t in enumerate(chaines_de_tableau(bloc_tableau(scene_tsx, "const PORTE_QUI_SE_FERME"))):
        out.append({"pool": f"porte qui se ferme {i}", "garde": {"partout"}, "textes": [t]})

    # — LE GEÔLIER. Deux pools, servis exactement là où le dé tombe et où la
    #   marche passe : c'est-à-dire N'IMPORTE OÙ (pleine lande, combat, ruelle
    #   du hameau). Aucune de ses phrases ne peut donc présupposer un décor.
    jdeb = scene_src.find("export const JAILER_BY_POSTURE")
    jobj = scene_src[jdeb : scene_src.find("\n};", jdeb)] if jdeb >= 0 else ""
    postures = [m for m in re.finditer(r"\n  (amuse|interesse|respectueux):\s*\{", jobj)]
    for n, m in enumerate(postures):
        bloc = jobj[m.start() : postures[n + 1].start() if n + 1 < len(postures) else len(jobj)]
        for cle in ("fail", "critFail", "critSuccess"):
            for i, t in enumerate(chaines_de_tableau(bloc_tableau(bloc, f"{cle}:"))):
                out.append({"pool": f"geôlier {m.group(1)}·{cle} {i}", "garde": {"partout"}, "textes": [t]})
    for i, t in enumerate(chaines_de_tableau(bloc_tableau(scene_src, "const LIAISON_JAILER"))):
        out.append({"pool": f"geôlier liaison {i}", "garde": {"partout"}, "textes": [t]})

    # Le village tel que le MOTEUR le délimite — sert à plusieurs pools.
    interieur = set(re.findall(r'"([a-z-]+)"', bloc_tableau(scene_src, "export const HAMEAU_INTERIOR")))
    def village_scene(sid: str) -> bool:
        return sid in interieur or bool(re.match(r"^(serment-hameau|hameau-|femme-seuil|gamin-murets)", sid))

    # — PHRASES D'ARRIVÉE (APPROACH_NARRATION) : servies en posant le pied sur
    #   la destination, quelle que soit la provenance. Le garde vient donc de
    #   la DESTINATION seule : arriver dans un lieu du village autorise le
    #   village, arriver ailleurs garantit la pleine lande — et rien d'autre.
    #   (Ajouté le 9/08 : « Tu quittes les toits » accueillait au Moulin, qui
    #   est en pleine lande, quelle que soit la route empruntée.)
    appr = re.search(r"export const APPROACH_NARRATION[^=]*=\s*\{(.*?)\n\};", scene_src, re.S)
    if appr:
        for m in re.finditer(
            r'(?:"([a-z0-9\-]+)"|([a-zA-Z][a-zA-Z0-9\-]*))\s*:\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+)',
            appr.group(1),
        ):
            dest = m.group(1) or m.group(2)
            texte = "".join(re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(3))).replace('\\"', '"')
            out.append({
                "pool": f"arrivée {dest}",
                "garde": {"village", "gens"} if village_scene(dest) else {"lande", "gens"},
                "textes": [texte],
            })

    # — STRATE DE FAMILIARITÉ (vague 4) : une ligne de plus à l'arrivée, à
    #   partir du 2e passage du COMPTE par le lieu. Même garde que la phrase
    #   d'arrivée — elle est servie AU MÊME ENDROIT, donc elle présuppose
    #   exactement ce que la destination autorise, ni plus.
    fam = re.search(r"export const FAMILIARITE[^=]*=\s*\{(.*?)\n\};", scene_src, re.S)
    if fam:
        # Chaque entrée est un objet { deux: …, quatre?: … } : on découpe sur
        # les clés de lieu (colonne 2), puis on prend toutes les chaînes du
        # bloc. Un texte hors contexte est signalé sous le nom de son lieu.
        blocs = re.split(r'\n  (?:"([a-z0-9\-]+)"|([a-z][a-zA-Z0-9\-]*)):\s*\{', fam.group(1))
        # split rend [préambule, cle1a, cle1b, corps1, cle2a, cle2b, corps2, …]
        for i in range(1, len(blocs) - 2, 3):
            dest = blocs[i] or blocs[i + 1]
            corps = blocs[i + 2]
            for strate in ("deux", "quatre"):
                m = re.search(
                    rf'{strate}:\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+)', corps
                )
                if not m:
                    continue
                texte = "".join(
                    re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(1))
                ).replace('\\"', '"')
                out.append({
                    "pool": f"familiarité {dest} ({strate})",
                    "garde": {"village", "gens"} if village_scene(dest) else {"lande", "gens"},
                    "textes": [texte],
                })

    # — LE SCEAU DES LANDES (14/08). Deux familles de textes :
    #   • SCEAU_RECONNU est indexé PAR LIEU et servi à l'arrivée, exactement
    #     comme APPROACH_NARRATION — le garde se dérive donc de la
    #     destination, ni plus ni moins.
    #   • les trois lignes calculées (ouverture à la Borne, réponse du côté
    #     sud, prise du Sceau à la Descente) sont servies à des endroits fixes
    #     de PLEINE LANDE : aucune ne peut poser de bâti ni de foule.
    sceaux_src = (LIB / "sceaux.ts").read_text(encoding="utf-8")
    rec = re.search(r"export const SCEAU_RECONNU[^=]*=\s*\{(.*?)\n\};", sceaux_src, re.S)
    if rec:
        for m in re.finditer(
            r'(?:"([a-z0-9\-]+)"|([a-zA-Z][a-zA-Z0-9\-]*))\s*:\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+)',
            rec.group(1),
        ):
            dest = m.group(1) or m.group(2)
            texte = "".join(re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(3))).replace('\\"', '"')
            out.append({
                "pool": f"sceau reconnu {dest}",
                "garde": {"village", "gens"} if village_scene(dest) else {"lande", "gens"},
                "textes": [texte],
            })
    for fn, garde in (
        ("ligneSceauOuverture", {"lande", "gens"}),
        ("ligneSceauBorne", {"lande"}),
        ("ligneSceauSortie", {"lande"}),
    ):
        d = sceaux_src.find(f"export function {fn}")
        corps = sceaux_src[d : sceaux_src.find("\n}", d)] if d >= 0 else ""
        for i, t in enumerate(
            "".join(re.findall(r'"((?:[^"\\]|\\.)*)"', bloc))
            for bloc in re.findall(r"return\s*\(?((?:\s*\"(?:[^\"\\]|\\.)*\"\s*\+?)+)", corps)
        ):
            out.append({"pool": f"{fn} {i}", "garde": garde, "textes": [t]})

    # — bifurcations : phrase de Croisée, partout.
    for i, t in enumerate(chaines_de_tableau(bloc_tableau(scene_src, "const BIFURCATIONS"))):
        out.append({"pool": f"bifurcation {i}", "garde": {"partout"}, "textes": [t]})

    # — la loi du Domaine : liaison, n'importe où.
    # ⚠️ EXTRACTEUR MUET CORRIGÉ (repasse du 10/08). L'ancre "manifestations:"
    # n'existe NULLE PART dans loi-substitution.ts (le tableau s'appelle
    # MANIFESTATIONS_LANDES et ses textes vivent dans des champs `texte:`).
    # `bloc_tableau` rendait "" sans rien dire : zéro pool généré, zéro
    # signalement possible, depuis toujours. C'est le 4e extracteur muet du
    # projet. RÈGLE : après avoir écrit un extracteur, COMPTER ce qu'il rend
    # et le comparer à la source — un pool à 0 entrée est une alarme, jamais
    # un succès.
    for i, t in enumerate(re.findall(r'texte:\s*((?:\s*"(?:[^"\\]|\\.)*"\s*\+?)+)', loi_src)):
        txt = "".join(re.findall(r'"((?:[^"\\]|\\.)*)"', t))
        out.append({"pool": f"loi manifestation ({empreinte(txt)})", "garde": {"partout"}, "textes": [txt]})

    # — AMORCES de chapitre : jouées à la PREMIÈRE liaison, donc en pleine
    #   lande. Une silhouette isolée y est permise (le personnel du décor :
    #   Marcheur, berger, vieux au muret) → garde « gens » accordé ; du BÂTI,
    #   non (trou vu au playtest auto 7/08 : « une femme au seuil d'une
    #   maison basse » servie entre la Borne et le premier lieu).
    chap_src = (LIB / "chapters-data.ts").read_text(encoding="utf-8")
    for m in re.finditer(r'id:\s*"([a-z-]+)"', chap_src):
        cid = m.group(1)
        fin = chap_src.find('\n  {', m.start() + 10)
        bloc = chap_src[m.start() : fin if fin > 0 else len(chap_src)]
        for i, t in enumerate(chaines_de_tableau(bloc_tableau(bloc, "amorce:"))):
            out.append({
                "pool": f"chapitre {cid} · amorce {i}",
                # « lande » (pas « partout ») : la PREMIÈRE Croisée précède
                # toujours toute entrée possible au village — nommer la lande
                # y est donc sûr, contrairement aux pools qui y jouent aussi.
                "garde": {"lande", "gens"},
                "textes": [t],
            })

    # — VARIANTES de liaison (57 au 10/08 — le compte n'est pas figé) : le garde dérive de leur condition `from`.
    #   Réservée aux départs du village (from: HAMEAU_INTERIOR ou liste de
    #   lieux intérieurs) → elle peut mettre le village en scène ; sinon elle
    #   joue en pleine lande — silhouettes permises, bâti interdit.
    vbloc = bloc_tableau(scene_src, "const LIAISON_VARIANTS")
    # découpe des objets { … } au niveau 1 du tableau
    objets, prof, deb = [], 0, -1
    for k, ch in enumerate(vbloc):
        if ch == "{":
            if prof == 0:
                deb = k
            prof += 1
        elif ch == "}":
            prof -= 1
            if prof == 0 and deb >= 0:
                objets.append(vbloc[deb : k + 1])
    for i, o in enumerate(objets):
        tm = re.search(r'text:\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+)', o)
        if not tm:
            continue
        texte = "".join(re.findall(r'"((?:[^"\\]|\\.)*)"', tm.group(1))).replace('\\"', '"')
        if re.search(r"from:\s*HAMEAU_INTERIOR", o):
            garde = {"village", "gens"}
        else:
            fm = re.search(r"from:\s*\[([^\]]*)\]", o)
            froms = re.findall(r'"([a-z-]+)"', fm.group(1)) if fm else []
            # Une variante conditionnée par sa PROVENANCE hérite du garde de
            # cette provenance : partir d'un lieu du village autorise le
            # village, partir d'un lieu extérieur GARANTIT la pleine lande.
            # Sans `from`, elle joue partout et ne peut rien présupposer.
            if froms and all(village_scene(s) for s in froms):
                garde = {"village", "gens"}
            elif froms and not any(village_scene(s) for s in froms):
                garde = {"lande", "gens"}
            else:
                garde = {"partout", "gens"}
        # ⚠️ CLÉ PAR LE CONTENU, PAS PAR LE RANG (correctif du 14/08). Ces
        # pools étaient nommés « liaison variante <i> » : insérer une variante
        # dans le tableau décalait tous les rangs suivants et faisait GLISSER
        # les exemptions sur le mauvais texte — le garde tirait alors sur un
        # texte parfaitement exempté, et se taisait sur celui qui ne l'était
        # plus. Le fichier documentait déjà la règle (`empreinte`) pour
        # `traceDeSortie` ; elle n'avait pas été appliquée ici.
        out.append(
            {"pool": f"liaison variante ({empreinte(texte)})", "garde": garde, "textes": [texte]}
        )

    return out


# ── EXEMPTIONS : chaque entrée doit dire pourquoi. ───────────────────────────
EXEMPT: dict[str, str] = {
    "etat affame · manifestation":
        "« Tu regardes les mains des gens avant leur visage » décrit une "
        "HABITUDE du héros, pas des gens présents dans la scène — la phrase "
        "reste vraie lue seul au milieu de la lande.",
    "etat hante · intruse 4":
        "« à la vitesse d'un homme qui marche » est une COMPARAISON de "
        "vitesse, pas une présence — la chute (« rien ne marche nulle part ») "
        "fonctionne précisément parce qu'il n'y a personne.",
    # ⚠️ Clés NOMMÉES PAR LE CONTENU (empreinte des 3 premiers mots longs) et
    # non par le rang : insérer un paragraphe dans `traceDeSortie` ne peut plus
    # faire glisser une exemption sur le mauvais texte.
    "sortie de zone (derrière très loin)":
        "Jouée à la DESCENTE, qui surplombe la zone qu'on vient de quitter : "
        "« le chemin du hameau » y est un souvenir de traversée, pas un décor "
        "présent. Le héros regarde en arrière — c'est le sujet même de l'écran.",
    "sortie de zone (personne suivi jusqu)":
        "Même écran, même raison : la grange et la barre posée dehors sont ce "
        "qu'on LAISSE derrière soi. ⚠️ Ces deux exemptions n'existaient pas "
        "avant le 10/08 parce que le garde n'extrayait pas ce pool (il "
        "auditait les littéraux du type du paramètre) — un garde muet qui "
        "rassure. Exemptions écrites maintenant qu'il voit vraiment.",
    "familiarité chien-du-bailli (quatre)":
        "La MAISON du Bailli est un bâtiment isolé à l'ouest, hors du hameau "
        "(décision 7/08) : sa scène POSE elle-même la bâtisse et son seuil. "
        "Le mot « porte » y désigne la porte de CETTE maison, que le joueur a "
        "sous les yeux — pas un village. Faux ami déjà documenté au-dessus du "
        "lexique VILLAGE.",
    "arrivée chien-du-bailli":
        "Une phrase d'ARRIVÉE décrit sa destination : celle-ci POSE elle-même "
        "la bâtisse (« une haute toiture SEULE au-dessus de la bruyère ») "
        "avant d'en nommer le seuil. Le bâti n'est pas présupposé, il est "
        "introduit — et la Maison du Bailli est bien isolée, à l'ouest.",
    "liaison variante (trois corbeaux toit)":
        "« Trois corbeaux sur ton toit » est un DICTON que la Fille récite en "
        "passant — le héros n'a pas de toit, et la phrase n'affirme rien du "
        "décor autour de lui : c'est du discours rapporté, pas une description.",
    "liaison variante (loin cloche muette)":
        "« AU LOIN, une cloche muette » place explicitement la source "
        "ailleurs — un son de chapelle porte jusqu'en pleine lande, et rien "
        "n'est affirmé sur ce qui entoure le héros.",
    "etat fixe · guérison":
        "« Le hameau détourne son attention » : le hameau est le SUJET du "
        "propos, pas le décor exigé — la phrase se lit de n'importe où, et la "
        "guérison de FIXÉ tombe de toute façon au procès (village) ou à la "
        "sortie de zone.",
}


def main() -> int:
    strict = "--strict" in sys.argv
    signalements = []
    for p in pools():
        for t in p["textes"]:
            besoins = classer(t)
            garde = p["garde"]
            # un texte qui présuppose des gens/le village doit être gardé ainsi
            manque = {b for b in besoins if b in {"gens", "village"} and b not in garde}
            # un texte de LANDE servi dans un pool qui joue AUSSI au village
            lande_au_village = "lande" in besoins and "partout" in garde
            if (manque or lande_au_village) and p["pool"] not in EXEMPT:
                signalements.append((p["pool"], sorted(besoins), sorted(garde), t))
    print(f"AUDIT D'IMMERSION — {len(signalements)} signalement(s)\n")
    for pool, besoins, garde, t in signalements:
        print(f"⚠ {pool}")
        print(f"   présuppose {besoins} · garde réel {garde}")
        print(f"   « {t[:140]}{'…' if len(t) > 140 else ''} »\n")
    if not signalements:
        print("Rien à signaler : chaque texte injectable est couvert par son garde.")
    return 1 if (strict and signalements) else 0


if __name__ == "__main__":
    sys.exit(main())
