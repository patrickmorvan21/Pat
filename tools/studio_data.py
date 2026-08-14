#!/usr/bin/env python3
"""
LES DONNÉES DE PACTUM STUDIO — tout le contenu du jeu, dans un seul JSON.

Pourquoi ce script existe : la MÉCANIQUE du jeu (les choix, les stats engagées,
les seuils de dé, les issues, les conséquences) n'existe QUE dans
`aldenhar/lib/scene-data.ts`. `data/zones/landes.json` n'en porte rien — il ne
connaît que la narration, les images et le graphe. Patrick ne lit pas le code :
tant que les choix ne sortent pas du .ts, il ne peut pas voir la moitié de son
propre jeu.

Ce script LIT le .ts (la source de vérité du jeu, celle que le moteur exécute)
et en sort un export complet, croisé avec :
  • data/zones/*.json          — noms lisibles, lieux, coordonnées de la carte
  • data/scene-meta.json       — descriptions + prompts Leonardo
  • public/assets/manifest.json — hash, taille et récence de chaque image

⚠️ SENS DE LECTURE, à ne jamais inverser : ce fichier est un EXPORT. Il se
regénère, il ne s'édite pas. Toute modification faite dans le Studio part dans
un journal de modifications côté navigateur, que Patrick me recolle — c'est moi
qui écris dans le dépôt. Le Studio ne touche jamais à git.

Sortie : data/studio-data.json
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
TS = RACINE / "aldenhar/lib/scene-data.ts"
ZONES = RACINE / "data/zones"
META = RACINE / "data/scene-meta.json"
MANIFEST = RACINE / "aldenhar/public/assets/manifest.json"
# Les systèmes du 5/08 vivent dans leurs propres modules — le Studio doit les
# montrer, sinon Patrick ne voit pas la moitié de ce qui pèse sur ses scènes.
TS_TEMOINS = RACINE / "aldenhar/lib/temoins.ts"
TS_RELIQUES = RACINE / "aldenhar/lib/reliques.ts"
TS_FAITS = RACINE / "aldenhar/lib/contradictions.ts"
TS_PERCEPTION = RACINE / "aldenhar/lib/perception.ts"
TS_LOI = RACINE / "aldenhar/lib/loi-substitution.ts"
TS_SCEAUX = RACINE / "aldenhar/lib/sceaux.ts"
# Les CONSTANTES que le contenu utilise à la place d'un littéral. Un champ
# renseigné par une constante ressortait VIDE de l'export (voir
# `constante_de`) : cette table est ce qui rend la valeur réelle lisible.
CONSTANTES_CONNUES: dict[str, str] = {
    m.group(1): m.group(2)
    for m in __import__("re").finditer(
        r'export const ([A-Z][A-Z0-9_]*)\s*=\s*"([^"]+)"',
        TS_SCEAUX.read_text(encoding="utf-8"),
    )
}
# Les ÉTATS et BESOINS (spec 5/08 « le Domaine se souvient ») : le Studio doit
# montrer ce qu'un état change réellement, sinon on ne peut pas juger s'il est
# « un fait auquel le monde réagit » ou seulement un modificateur déguisé.
TS_ETATS = RACINE / "aldenhar/lib/etats.ts"
# ⚠️ lib/besoins.ts a été SUPPRIMÉ (Phase A du plan d'élagage, 11/08) :
# les Besoins ne se manifestaient que par un état, et les états sont
# partis. L'export garde la clé `besoins` à vide pour ne pas casser les
# pages qui la lisent.
SORTIE = RACINE / "data/studio-data.json"


# ───────────────────────────────────────────────────────── lecture du TypeScript
#
# ⚠️ PIÈGE qui a déjà fait mentir un audit : les commentaires du fichier sont en
# FRANÇAIS et contiennent des apostrophes (« l'entrée »). Un parseur qui ne
# traite pas les commentaires prend cette apostrophe pour une ouverture de
# chaîne et perd tout le comptage. Les commentaires sont donc gérés dans la
# MÊME machine à états que les chaînes.


def objets_de_haut_niveau(src: str, debut: int) -> list[str]:
    """Découpe un tableau `[ {...}, {...} ]` en ses objets de premier niveau."""
    prof = 0
    j = debut
    out: list[str] = []
    cur: int | None = None
    mode: str | None = None
    q = ""
    esc = False
    while j < len(src):
        c = src[j]
        n = src[j + 1] if j + 1 < len(src) else ""
        if mode == "str":
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == q:
                mode = None
        elif mode == "line":
            if c == "\n":
                mode = None
        elif mode == "block":
            if c == "*" and n == "/":
                mode = None
                j += 1
        else:
            if c == "/" and n == "/":
                mode = "line"
                j += 1
            elif c == "/" and n == "*":
                mode = "block"
                j += 1
            elif c in "\"'`":
                mode = "str"
                q = c
            elif c in "[{":
                if prof == 1 and c == "{":
                    cur = j
                prof += 1
            elif c in "]}":
                prof -= 1
                if prof == 1 and c == "}" and cur is not None:
                    out.append(src[cur : j + 1])
                    cur = None
                if prof == 0:
                    break
        j += 1
    return out


def bloc_apres(src: str, motif: str) -> tuple[str, int] | None:
    """Le tableau/objet qui suit `motif`, équilibré. Renvoie (texte, position)."""
    m = re.search(motif, src)
    if not m:
        return None
    i = m.end() - 1
    while i < len(src) and src[i] not in "[{":
        i += 1
    if i >= len(src):
        return None
    ouvre, ferme = ("[", "]") if src[i] == "[" else ("{", "}")
    prof = 0
    j = i
    while j < len(src):
        if src[j] == ouvre:
            prof += 1
        elif src[j] == ferme:
            prof -= 1
            if prof == 0:
                return src[i : j + 1], i
        j += 1
    return None


def chaines(txt: str) -> list[str]:
    """La LISTE des littéraux entre guillemets doubles, un par élément.

    ⚠️ Décode aussi les `\\uXXXX` : le .ts en contient (« l\\u2019avance ») et
    les laisser en clair fait fuir l'échappement jusqu'aux joueurs du kit
    (panel de testeurs 9/08 : 92 occurrences à l'écran)."""
    out = []
    for s in re.findall(r'"((?:[^"\\]|\\.)*)"', txt):
        s = s.replace('\\"', '"').replace("\\'", "'").replace("\\n", "\n")
        s = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), s)
        out.append(s)
    return out


# Un littéral de chaîne, et une suite de littéraux recollés par `+`.
LITTERAL = r'"(?:[^"\\]|\\.)*"'
CONCAT = rf"{LITTERAL}(?:\s*\+\s*{LITTERAL})*"


def chaines_de_tableau(bloc: str) -> list[str]:
    """Les éléments d'un tableau de TEXTES, concaténations recollées.

    ⚠️ Pas `chaines()` : un élément écrit « "a " + "b" » y compterait pour DEUX
    entrées, et une réaction du monde se retrouverait coupée en deux moitiés.
    On découpe donc sur les virgules de premier niveau d'abord."""
    interieur = bloc[1:-1] if bloc.startswith("[") else bloc
    return [recoller(a) for a in args_de_haut_niveau(interieur) if '"' in a]


def recoller(txt: str) -> str:
    """Recolle « "abc " + "def" » en « abc def ».

    ⚠️ Sans espace ajoutée : le .ts coupe ses longues lignes en laissant
    TOUJOURS l'espace à la fin du fragment (vérifié : 562 fragments sur 562).
    Joindre avec une espace produirait une double espace partout."""
    return "".join(chaines(txt))


def texte_de(txt: str, champ: str) -> str | None:
    """La valeur texte d'un champ, concaténations comprises.

    ⚠️ PIÈGE qui a coupé tout un export (relevé par Patrick le 03/08 : « je
    n'ai pas tout le texte ») : le .ts écrit ses textes longs en plusieurs
    morceaux, « "…" + "…" + "…" ». Une regex qui ne capture qu'un littéral
    rend le PREMIER morceau et perd le reste — silencieusement, avec une
    phrase qui s'arrête au milieu. Il faut capturer toute la chaîne."""
    m = re.search(rf"{champ}:\s*({CONCAT})", txt)
    return recoller(m.group(1)) if m else None


def constante_de(txt: str, champ: str, connues: dict[str, str]) -> str | None:
    """La valeur d'un champ écrit avec une CONSTANTE (`requiresSceau: SCEAU_LANDES`).

    ⚠️ `texte_de` ne voit que les littéraux : un champ renseigné par une
    constante importée en ressortait VIDE, sans le moindre avertissement — et
    le Studio comme la réplique auraient alors offert à tout le monde des
    options réservées. C'est la variante « identifiant » du piège d'extracteur
    muet du projet ; toujours compter ce qu'on extrait.
    """
    m = re.search(rf"{champ}:\s*([A-Z][A-Z0-9_]*)\s*,", txt)
    if m:
        return connues.get(m.group(1), m.group(1))
    return texte_de(txt, champ)


def nombre_de(txt: str, champ: str) -> float | None:
    m = re.search(rf"{champ}:\s*(-?\d+(?:\.\d+)?)", txt)
    return float(m.group(1)) if m else None


def booleen_de(txt: str, champ: str) -> bool:
    return bool(re.search(rf"{champ}:\s*true", txt))


# ───────────────────────────────────────────────────────────────── les choix

STATS = ("COURAGE", "RUSE", "INSTINCT", "EMPATHIE")


def args_de_haut_niveau(txt: str) -> list[str]:
    """Découpe une liste d'arguments sur les virgules de premier niveau.

    ⚠️ Les COMMENTAIRES doivent être traversés comme du texte inerte. Sans ça,
    l'apostrophe d'un commentaire français (« qu'il ait appris ») ouvre une
    fausse chaîne et tout ce qui suit part de travers : trois des quatre
    issues du jet « Prendre le hameau à témoin » sortaient vides ou réduites à
    une virgule, et un testeur du panel du 10/08 est mort avec pour épitaphe
    « , ». C'est le même piège que celui corrigé le 9/08 dans `paragraphes()`
    — il vivait encore ici, dans la fonction voisine.
    """
    out, cur, prof, mode, q, esc = [], "", 0, None, "", False
    i, n = 0, len(txt)
    while i < n:
        c = txt[i]
        suiv = txt[i + 1] if i + 1 < n else ""
        if mode == "str":
            cur += c
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == q:
                mode = None
            i += 1
            continue
        if mode == "ligne":
            cur += c
            if c == "\n":
                mode = None
            i += 1
            continue
        if mode == "bloc":
            cur += c
            if c == "*" and suiv == "/":
                cur += suiv
                i += 2
                mode = None
                continue
            i += 1
            continue
        if c == "/" and suiv == "/":
            mode = "ligne"
            cur += c
        elif c == "/" and suiv == "*":
            mode = "bloc"
            cur += c
        elif c in "\"'`":
            mode, q = "str", c
            cur += c
        elif c in "([{":
            prof += 1
            cur += c
        elif c in ")]}":
            prof -= 1
            cur += c
        elif c == "," and prof == 0:
            out.append(cur)
            cur = ""
        else:
            cur += c
        i += 1
    if cur.strip():
        out.append(cur)
    return out


def lire_outcomes(txt: str) -> dict:
    """`outcomes(crit, réussite, échec, funeste)` → les quatre proses.

    ⚠️ La fonction prend QUATRE arguments (piège relevé en session : on croit
    souvent qu'elle en prend deux). Les paliers intermédiaires réutilisent ces
    textes, c'est le mot de verdict et le visuel qui portent la nuance."""
    b = bloc_apres(txt, r"outcomes\(")
    if not b:
        m = re.search(r"outcomes\(([\s\S]*?)\),?\s*(?:highStakes|\})", txt)
        brut = m.group(1) if m else txt
    else:
        brut = b[0]
    # ⚠️ Découper par ARGUMENT, pas par littéral : une issue écrite en deux
    # morceaux (« "…" + "…" ») compterait pour deux et décalerait toutes les
    # suivantes — l'échec passerait pour la réussite. Aucun appel ne le fait
    # aujourd'hui, mais le jour où ça arrive l'erreur serait invisible.
    parts = [recoller(a) for a in args_de_haut_niveau(brut) if '"' in a]
    cles = ["critique", "reussite", "echec", "funeste"]
    return {k: (parts[i] if i < len(parts) else "") for i, k in enumerate(cles)}



# ───────────────────────────────────────────── les systèmes transverses (5/08)


def lire_temoins() -> dict[str, dict]:
    """TEMOINS : id d'acte → {nom, deposition, lieu}. Clé = id du choix/point.

    ⚠️ `objets_de_haut_niveau` attend le conteneur ENTIER (`{ … }` ou `[ … ]`)
    et rend ses objets de profondeur 1, dans l'ordre du document. On apparie
    donc les clés (trouvées par regex) aux valeurs par position — pas en
    relançant le découpeur sur une sous-chaîne, qui ne trouve rien.
    """
    if not TS_TEMOINS.exists():
        return {}
    src = TS_TEMOINS.read_text(encoding="utf-8")
    b = bloc_apres(src, r"export const TEMOINS[^=]*=")
    if not b:
        return {}
    cles = re.findall(r"\n  \"?([a-zA-Z0-9_-]+)\"?:\s*\{", b[0])
    valeurs = objets_de_haut_niveau(b[0], 0)
    out: dict[str, dict] = {}
    for cle, c in zip(cles, valeurs):
        out[cle] = {
            "nom": texte_de(c, "nom") or "",
            "deposition": texte_de(c, "deposition") or "",
            "lieu": texte_de(c, "lieu") or "",
        }
    return out


def lire_reliques() -> list[dict]:
    if not TS_RELIQUES.exists():
        return []
    b = bloc_apres(TS_RELIQUES.read_text(encoding="utf-8"), r"export const RELIQUES_LANDES: RelicLandes\[\] =")
    if not b:
        return []
    out = []
    for c in objets_de_haut_niveau(b[0], 0):
        out.append(
            {
                "id": texte_de(c, "id"),
                "nom": texte_de(c, "nom"),
                "rarete": texte_de(c, "rarete"),
                "don": texte_de(c, "don"),
                "dette": texte_de(c, "dette"),
                "mort": texte_de(c, "mort"),
                "fonction": texte_de(c, "fonction"),
                "cout": texte_de(c, "cout"),
                "murmure": texte_de(c, "murmure"),
            }
        )
    return out


def lire_faits() -> list[dict]:
    if not TS_FAITS.exists():
        return []
    b = bloc_apres(TS_FAITS.read_text(encoding="utf-8"), r"export const FAITS: Fait\[\] =")
    if not b:
        return []
    out = []
    for c in objets_de_haut_niveau(b[0], 0):
        vb = bloc_apres(c, r"\n    versions:\s*")
        versions = []
        if vb:
            for v in objets_de_haut_niveau(vb[0], 0):
                versions.append({"id": texte_de(v, "id"), "texte": texte_de(v, "texte")})
        out.append(
            {
                "id": texte_de(c, "id"),
                "sujet": texte_de(c, "sujet"),
                "accusation": texte_de(c, "accusation"),
                "versions": versions,
            }
        )
    return out


def lire_perceptions() -> dict[str, dict]:
    """PERCEPTIONS : id de scène → {stat: ligne}. Même appariement clé/valeur."""
    if not TS_PERCEPTION.exists():
        return {}
    b = bloc_apres(TS_PERCEPTION.read_text(encoding="utf-8"), r"export const PERCEPTIONS[^=]*=")
    if not b:
        return {}
    cles = re.findall(r"\n  \"?([a-zA-Z0-9_-]+)\"?:\s*\{", b[0])
    valeurs = objets_de_haut_niveau(b[0], 0)
    out: dict[str, dict] = {}
    for cle, c in zip(cles, valeurs):
        lignes = {}
        for stat in ("courage", "ruse", "instinct", "empathie"):
            v = texte_de(c, stat)
            if v:
                lignes[stat] = v
        if lignes:
            out[cle] = lignes
    return out


def lire_etats() -> list[dict]:
    """Les ÉTATS + ce qu'ils changent RÉELLEMENT.

    Le Studio doit permettre de trancher la question de la spec : « un état
    n'est pas un modificateur déguisé, c'est un fait auquel le monde réagit ».
    On exporte donc, à côté du texte, la liste EXPLICITE de ses effets
    mécaniques — s'il n'y en a qu'un et qu'il est chiffré, ça se voit.
    """
    if not TS_ETATS.exists():
        return []
    b = bloc_apres(TS_ETATS.read_text(encoding="utf-8"), r"export const ETATS: Etat\[\] =")
    if not b:
        return []
    out = []
    for c in objets_de_haut_niveau(b[0], 0):
        # Les réactions du monde et les lignes intruses : des tableaux de texte.
        rb = bloc_apres(c, r"\n    reactions:\s*")
        reactions = chaines_de_tableau(rb[0]) if rb else []
        ib = bloc_apres(c, r"\n    lignesIntruses:\s*")
        intruses = chaines_de_tableau(ib[0]) if ib else []
        # Les effets mécaniques, nommés en clair plutôt qu'en champs bruts.
        effets = []
        seuil = nombre_de(c, "seuilTous")
        if seuil:
            effets.append(f"seuil de tous les jets {'+' if seuil > 0 else ''}{seuil:g}")
        jb = bloc_apres(c, r"\n    jets:\s*")
        jets = {}
        if jb:
            for stat in STATS:
                v = nombre_de(jb[0], stat)
                if v is not None:
                    jets[stat] = v
                    effets.append(f"{stat.lower()} {'+' if v > 0 else ''}{v:g}")
        for champ, libelle in (
            ("cacheFuite", "retire les choix de fuite"),
            ("ouvreVol", "ouvre « voler » là où il y a à voler"),
            ("soupconDouble", "le Soupçon monte deux fois plus vite"),
            ("ouvreConfidences", "ceux qui portent la même croix te parlent"),
        ):
            if booleen_de(c, champ):
                effets.append(libelle)
        usure = nombre_de(c, "usureParJour")
        if usure:
            effets.append(f"use le corps chaque jour ({usure:g})")
        if intruses:
            effets.append(f"{len(intruses)} lignes intruses")
        out.append(
            {
                "id": texte_de(c, "id"),
                "nom": texte_de(c, "nom"),
                "groupe": texte_de(c, "groupe"),
                "source": texte_de(c, "source"),
                "manifestation": texte_de(c, "manifestation"),
                "reactions": reactions,
                "remede": texte_de(c, "remede"),
                "guerison": texte_de(c, "guerison"),
                "hint": texte_de(c, "hint"),
                "jets": jets,
                "effets": effets,
                "lignesIntruses": intruses,
            }
        )
    return out


def lire_besoins() -> list[dict]:
    """Les Besoins ont été retirés (Phase A) — voir data/archive-etats.md."""
    return []

def lire_familiarite() -> list[dict]:
    """LA STRATE DE FAMILIARITÉ — ce qu'un lieu dit de plus à qui y revient.

    Comme les textes de marche, ces lignes ne sont dans AUCUNE scène : elles
    sont injectées à l'arrivée depuis une table de `scene-data.ts`. Sans cet
    export, on écrirait la réponse au « 60 % de relecture verbatim » sans
    qu'aucune de ces phrases soit visible dans l'éditeur.

    Le seuil est le nombre de passages du COMPTE par le lieu : 2 pour la
    familiarité, 4 pour la recontextualisation.
    """
    src = TS.read_text(encoding="utf-8")
    m = re.search(r"export const FAMILIARITE[^=]*=\s*\{(.*?)\n\};", src, re.S)
    if not m:
        return []
    blocs = re.split(r'\n  (?:"([a-z0-9\-]+)"|([a-z][a-zA-Z0-9\-]*)):\s*\{', m.group(1))
    sorties: list[dict] = []
    for i in range(1, len(blocs) - 2, 3):
        cle = blocs[i] or blocs[i + 1]
        corps = blocs[i + 2]
        entree: dict = {"scene": cle, "strates": []}
        # `sur` / `remplace` (10/08) : une strate peut se jouer sur un AUTRE
        # écran du lieu et REMPLACER un paragraphe au lieu de s'y ajouter.
        # Sans ces deux champs, la réplique rejouerait la contradiction que
        # le jeu vient de corriger — le piège de la liste blanche.
        msur = re.search(r'sur:\s*"([^"]+)"', corps)
        if msur:
            entree["sur"] = msur.group(1)
        mrem = re.search(r"remplace:\s*(\d+)", corps)
        if mrem:
            entree["remplace"] = int(mrem.group(1))
        for strate, seuil in (("deux", 2), ("quatre", 4)):
            mm = re.search(rf'{strate}:\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+)', corps)
            if not mm:
                continue
            entree["strates"].append(
                {"passages": seuil, "texte": "".join(chaines(mm.group(1)))}
            )
        if entree["strates"]:
            sorties.append(entree)
    return sorties


def lire_surprises():
    """Le catalogue des éléments-surprises (lib/surprises.ts, 6/08) : nom,
    contexte, garde-fou. Le rationnement (1/run max) est rappelé côté page."""
    src = (RACINE / "aldenhar/lib/surprises.ts").read_text(encoding="utf-8")
    out = []
    pat = (
        r'"?([a-z-]+)"?:\s*\{\s*nom:\s*"([^"]+)",\s*'
        r'contexte:\s*((?:"[^"]*"\s*\+?\s*)+),\s*'
        r'garde:\s*((?:"[^"]*"\s*\+?\s*)+),'
    )
    for m in re.finditer(pat, src):
        ctx = "".join(re.findall(r'"([^"]*)"', m.group(3)))
        garde = "".join(re.findall(r'"([^"]*)"', m.group(4)))
        out.append({"id": m.group(1), "nom": m.group(2), "contexte": ctx, "garde": garde})
    return out


def lire_transitions() -> dict:
    """Les TEXTES DE MARCHE — ce qu'on lit entre deux lieux.

    C'est le texte le plus vu du jeu, et il était le seul système à n'exister
    NULLE PART dans le Studio : une liaison n'est pas une entrée de `SCENES[]`,
    elle est fabriquée à l'exécution par `makeLiaison()`. Résultat, on pouvait
    écrire quatorze vignettes de vie de village sans qu'aucune soit visible
    dans l'éditeur. On lit donc directement les deux pools de scene-data.ts.

    Chaque variante porte ses CONDITIONS en clair (provenance, destination,
    Soupçon, santé, chapitre, objet porté, serment) : c'est ce qui permet de
    juger si une vignette est atteignable, et à qui elle est réservée.
    """
    src = TS.read_text(encoding="utf-8")
    fond = []
    b = bloc_apres(src, r"const LIAISON_AMBIANCES: string\[\] =")
    if b:
        fond = chaines_de_tableau(b[0])
    variantes = []
    b = bloc_apres(src, r"const LIAISON_VARIANTS: LiaisonVariant\[\] =")
    if b:
        for c in objets_de_haut_niveau(b[0], 0):
            cond = {}
            # ⚠️ PAS `bloc_apres` ici : il rend le PROCHAIN bloc crocheté, où
            # qu'il soit. Sur « from: HAMEAU_INTERIOR, serment: ["jure"] » il
            # rendait donc le tableau du serment comme valeur de `from` — deux
            # vignettes de village sont sorties de l'export sans un mot. On lit
            # la valeur qui suit IMMÉDIATEMENT le champ, tableau ou identifiant.
            for champ in ("from", "to", "serment"):
                m = re.search(rf"\b{champ}:\s*\[([^\]]*)\]", c)
                if m:
                    cond[champ] = chaines_de_tableau("[" + m.group(1) + "]")
                    continue
                m = re.search(rf"\b{champ}:\s*([A-Za-z_][A-Za-z0-9_]*)", c)
                if m:
                    cond[champ] = [m.group(1)]  # une constante, ex. HAMEAU_INTERIOR
            for champ in ("minSoupcon", "maxSoupcon", "maxHealth"):
                v = nombre_de(c, champ)
                if v is not None:
                    cond[champ] = v
            for champ in ("chapter", "carrying"):
                v = texte_de(c, champ)
                if v:
                    cond[champ] = v
            variantes.append({"texte": texte_de(c, "text") or "", "conditions": cond})
    bif = []
    b = bloc_apres(src, r"const BIFURCATIONS: string\[\] =")
    if b:
        bif = chaines_de_tableau(b[0])
    return {"fond": fond, "variantes": variantes, "bifurcations": bif}


def lire_loi() -> dict:
    if not TS_LOI.exists():
        return {}
    src = TS_LOI.read_text(encoding="utf-8")
    m = re.search(r"export const LOI_DU_DOMAINE =\s*((?:\"(?:[^\"\\\\]|\\\\.)*\"(?:\s*\+\s*\n?\s*)?)+)", src)
    loi = recoller(m.group(1)) if m else ""
    b = bloc_apres(src, r"export const MANIFESTATIONS_LANDES: ManifestationLoi\[\] =")
    manifs = []
    if b:
        for c in objets_de_haut_niveau(b[0], 0):
            manifs.append({"registre": texte_de(c, "registre"), "texte": texte_de(c, "texte")})
    return {"loi": loi, "manifestations": manifs}


TEMOINS = lire_temoins()

def lire_choix(bloc: str) -> list[dict]:
    b = bloc_apres(bloc, r"\n {4}choices:\s*")
    if not b:
        return []
    out = []
    for i, c in enumerate(objets_de_haut_niveau(b[0], 0)):
        ch: dict = {
            "id": texte_de(c, "id") or f"choix-{i}",
            "label": texte_de(c, "label") or "",
        }
        if "risky:" in c:
            stat = next((s for s in STATS if f'"{s}"' in c), None)
            ch["type"] = "risque"
            ch["stat"] = stat
            ch["seuil"] = int(nombre_de(c, "threshold") or 0)
            ch["hautEnjeu"] = booleen_de(c, "highStakes")
            ch["issues"] = lire_outcomes(c)
            # La NATURE décide du coût de l'échec (9/08) — elle doit voyager
            # jusqu'au Studio et au kit hors navigateur, sinon la réplique
            # jouée par les IA testeuses garde l'ancien modèle de coût.
            m_nat = re.search(r'nature:\s*"(physique|social|exploration|surnaturel)"', c)
            if m_nat:
                ch["nature"] = m_nat.group(1)
            # Le Jour perdu, déclaré texte par texte (9/08) : même raison de
            # voyager que la nature — sans lui la réplique ne facture rien.
            # ON T'A VU (10/08) : sans ce champ, la réplique jouerait un
            # modèle de coût plus doux que le jeu — le piège de la liste
            # blanche, retrouvé une fois de plus.
            if booleen_de(c, "vuSiEchec"):
                ch["vuSiEchec"] = True
        elif "locked:" in c:
            ch["type"] = "verrouille"
            ch["stat"] = next((s for s in STATS if f'"{s}"' in c), None)
        elif "passive:" in c:
            ch["type"] = "passif"
            ch["consequence"] = texte_de(c, "consequence") or ""
        elif "orient:" in c:
            ch["type"] = "orientation"
            ch["dest"] = texte_de(c, "dest")
            # Le mode est posé à l'exécution par makeLiaison (une route franche,
            # une couverte, tirées par la graine) — jamais écrit dans les données.
            ch["modeArrivee"] = "tire a l execution"
        elif booleen_de(c, "renonce"):
            ch["type"] = "renoncement"
        elif booleen_de(c, "rest"):
            ch["type"] = "repos"
        else:
            # Ni dé, ni conséquence écrite, ni orientation : c'est un choix de
            # CONTINUATION — il fait simplement avancer à l'écran suivant de la
            # séquence (`chainNext`). Le nommer « autre » n'apprenait rien.
            ch["type"] = "suite"
        # LE CHOIX QUI DIT QU'ON PART (9/08) — orthogonal au type : un passif
        # comme un jet peut être la sortie d'une scène `sejour`. Lu APRÈS la
        # chaîne de types, jamais dedans, pour ne pas la couper.
        m_sort = re.search(r'sortie:\s*\{[^}]*toScene:\s*"([a-z0-9\-]+)"', c)
        if m_sort:
            ch["sortie"] = {"toScene": m_sort.group(1)}
        elif re.search(r"\bsortie:\s*\{", c):
            ch["sortie"] = {}
        for champ, cle in (
            ("serment", "serment"),
            ("grantsLoot", "donneObjet"),
            ("grantsSavoir", "donneSavoir"),
            ("requiresSavoir", "exigeSavoir"),
            # Refonte du lore 6/08 : la DÉCOUVERTE est ce que le JOUEUR a
            # compris, pas le héros. Elle survit à la mort — d'où son rôle de
            # clé pour les scènes-variantes et l'arc du Grand Témoin.
            ("decouverte", "donneDecouverte"),
            ("requiresDecouverte", "exigeDecouverte"),
            ("setsEnvFlag", "poseFlag"),
            ("defense", "defense"),
            # États & besoins (spec 5/08) : d'où vient un état, et ce qui le lève.
            ("poseEtat", "poseEtat"),
            ("poseEtatSiEchec", "poseEtatSiEchec"),
            ("repondBesoin", "repondBesoin"),
            ("requiresEtat", "exigeEtat"),
            # 13/08 : « ce qu'on porte ouvre une porte ». Sans ce champ, la
            # réplique offrirait à tout le monde les options réservées à qui
            # a trouvé l'objet — et un relecteur conclurait que l'exploration
            # ne prépare rien (le biais mesuré le 9/08, exactement).
            ("requiresObjet", "exigeObjet"),
            # 14/08 : le SCEAU, ce qu'on rapporte d'une traversée réussie.
            # Même raison qu'`exigeObjet` de le déclarer ici : sans ce champ,
            # le Studio ne montrerait pas ces conversations et la réplique les
            # offrirait à un compte qui n'a jamais survécu.
            ("requiresSceau", "exigeSceau"),
        ):
            v = constante_de(c, champ, CONSTANTES_CONNUES)
            if v:
                ch[cle] = v
        tb = bloc_apres(c, r"\n        tags:\s*")
        if tb:
            t = chaines_de_tableau(tb[0])
            if t:
                ch["tags"] = t
        if booleen_de(c, "requiresContradiction"):
            ch["exigeContradiction"] = True
        if booleen_de(c, "renonce"):
            ch["renonce"] = True
        s = nombre_de(c, "soupcon")
        if s is not None:
            ch["soupcon"] = int(s)
            # LE TÉMOIN (5/08) : un Soupçon qui monte a quelqu'un qui l'a vu.
            t = TEMOINS.get(ch["id"])
            if s > 0 and t:
                ch["temoin"] = t
        if booleen_de(c, "rest"):
            ch["repos"] = True
        # ⚠️ SANS CE CHAMP, LA RÉPLIQUE JOUE L'ANCIENNE RÈGLE : `sansNuit` dit
        # qu'un choix quitte une scène de nuit sans qu'une nuit passe. Un kit
        # qui l'oublie fait mesurer aux agents un Jour gratuit qui n'existe
        # plus dans le jeu (leçon du 10/08 : deux listes blanches, ici et dans
        # export_run_kit.py, à nourrir en même temps que le type `Choice`).
        if booleen_de(c, "sansNuit"):
            ch["sansNuit"] = True
        if "debt:" in c:
            ch["dette"] = {"id": texte_de(c, "id"), "texte": texte_de(c, "text")}
        out.append(ch)
    return out


def lire_pois(bloc: str) -> list[dict]:
    b = bloc_apres(bloc, r"\n {4}pointsInteret:\s*")
    if not b:
        return []
    out = []
    for p in objets_de_haut_niveau(b[0], 0):
        poi = {
            "id": texte_de(p, "id") or "",
            "label": texte_de(p, "label") or "",
            "approche": texte_de(p, "approche") or "",
            "examen": texte_de(p, "examen") or "",
            "illustration": texte_de(p, "illustration"),
        }
        for champ, cle in (("savoir", "savoir"), ("grantsLoot", "donneObjet"),
                           ("leadsTo", "ouvreSur"), ("setsEnvFlag", "poseFlag"),
                           ("decouverte", "donneDecouverte"),
                           ("poseEtat", "poseEtat")):
            v = texte_de(p, champ)
            if v:
                poi[cle] = v
        v = texte_de(p, "fait")
        if v:
            poi["fait"] = v
        s = nombre_de(p, "soupcon")
        if s is not None:
            poi["soupcon"] = int(s)
            t = TEMOINS.get(poi["id"])
            if s > 0 and t:
                poi["temoin"] = t
        if booleen_de(p, "chapterFragment"):
            poi["fragmentChapitre"] = True
        if booleen_de(p, "corbeaux"):
            poi["corbeaux"] = True
        # ⚠️ LISTE BLANCHE À TENIR À JOUR (repasse du 10/08). `borneSud` et
        # `troupeau` étaient déclarés, posés et LUS en jeu, mais absents d'ici :
        # donc invisibles dans le Studio et absents de la réplique — un agent
        # qui mesure sur le kit conclut que la mémoire de la Borne et le
        # comptage du troupeau n'existent pas. Même piège que `sansNuit`.
        if booleen_de(p, "borneSud"):
            poi["borneSud"] = True
        if booleen_de(p, "troupeau"):
            poi["troupeau"] = True
        out.append(poi)
    return out


_CONSTANTES = {
    "COMPTEUR_FILLE": "découvertes sur la Fille",
    "SEUIL_MOULIN": "3",
}


def _const(nom: str) -> str:
    """Rend lisible une constante du .ts citée dans une condition."""
    return _CONSTANTES.get(nom, nom)


def lire_scenes() -> list[dict]:
    src = TS.read_text(encoding="utf-8")
    tete = src.index("export const SCENES: Scene[] = [")
    debut = src.index("[", tete + len("export const SCENES: Scene[] ="))
    scenes = []
    for bloc in objets_de_haut_niveau(src, debut):
        sid = texte_de(bloc, "id")
        if not sid:
            continue
        narr = bloc_apres(bloc, r"\n {4}narration:\s*")
        s = {
            "id": sid,
            "illustration": (re.search(r'\n    illustration: "([^"]+)"', bloc) or [None, None])[1]
            if re.search(r'\n    illustration: "([^"]+)"', bloc)
            else None,
            "narration": chaines(narr[0]) if narr else [],
            "choix": lire_choix(bloc),
            "pointsInteret": lire_pois(bloc),
        }
        # Recoller les concaténations « "…" + "…" » d'un même paragraphe : le
        # .ts coupe les longues lignes, ce sont bien DEUX morceaux d'un seul
        # paragraphe, pas deux paragraphes.
        if narr:
            s["narration"] = paragraphes(narr[0])
        # L'AIGUILLAGE (9/08) : la version servie quand le jet précédent a raté.
        # Elle doit voyager jusqu'au Studio ET au kit — sinon Patrick ne voit
        # qu'une moitié de la scène, et la réplique en joue une autre.
        ne = bloc_apres(bloc, r"\n    narrationEchec:\s*")
        if ne:
            s["narrationEchec"] = paragraphes(ne[0])
        for champ, cle in (
            ("chainNext", "suite"),
            ("foe", "adversaire"),
            ("foeName", "adversaireNom"),
            ("approach", "approche"),
            ("loot", "butin"),
            ("savoir", "savoir"),
            ("decouverte", "donneDecouverte"),
            ("setsEnvFlag", "poseFlag"),
        ):
            v = texte_de(bloc, champ)
            if v:
                s[cle] = v
        # SCÈNE-VARIANTE (refonte du lore 6/08) : elle se joue À LA PLACE
        # d'une autre quand une découverte est acquise. C'est l'information la
        # plus importante à voir dans l'éditeur — sans elle, on croit avoir
        # deux scènes concurrentes alors qu'on en a une conditionnelle.
        m = re.search(r'\n    remplace: \{ scene: "([^"]+)", si: \{ ([^}]+)\} \}', bloc)
        if m:
            cond = m.group(2).strip().rstrip(",")
            has = re.search(r'has:\s*"([^"]+)"', cond)
            gte = re.search(r'id:\s*([A-Za-z_][\w"\.]*)\s*,\s*gte:\s*([A-Za-z_\d][\w]*)', cond)
            s["remplace"] = {
                "scene": m.group(1),
                "condition": has.group(1) if has
                else (f"{_const(gte.group(1))} ≥ {_const(gte.group(2))}" if gte else cond),
            }
        for champ, cle in (("combat", "combat"), ("registre", "registre"),
                           ("terminal", "terminal"), ("liaison", "liaison"),
                           ("hameauEntree", "hameauEntree"), ("hameauHalte", "hameauHalte"),
                           ("fixationTrial", "procesFixation"), ("sejour", "sejour"),
                           ("nuit", "nuit")):
            if booleen_de(bloc, champ):
                s[cle] = True
        # AFFORDANCES de la scène : ce sont elles qui décident si un état ouvre
        # quelque chose ici (AFFAMÉ n'ouvre « voler » que sur `food_available`).
        tb = bloc_apres(bloc, r"\n    tags:\s*")
        if tb:
            t = chaines_de_tableau(tb[0])
            if t:
                s["tags"] = t
        if "timed:" in bloc:
            s["chronometree"] = int(nombre_de(bloc, "ms") or 0)
        sa = nombre_de(bloc, "soupconOnArrival")
        if sa is not None:
            s["soupconArrivee"] = int(sa)
        scenes.append(s)
    return scenes


def _sans_commentaires(brut: str) -> str:
    """Retire les commentaires // et /* */ HORS chaînes."""
    out, i, n, mode = [], 0, len(brut), None
    while i < n:
        c = brut[i]
        if mode == "str":
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(brut[i + 1]); i += 2; continue
            if c == mode_q[0]:
                mode = None
            i += 1; continue
        if c in '"`':
            mode, mode_q = "str", c
            out.append(c); i += 1; continue
        if c == "/" and i + 1 < n and brut[i + 1] == "/":
            while i < n and brut[i] != "\n":
                i += 1
            continue
        if c == "/" and i + 1 < n and brut[i + 1] == "*":
            i = brut.find("*/", i + 2)
            i = n if i < 0 else i + 2
            continue
        out.append(c); i += 1
    return "".join(out)


def paragraphes(brut: str) -> list[str]:
    """Un paragraphe par élément du tableau — les `"…" + "…"` sont recollés.

    ⚠️ Deux pièges appris le 9/08 (le Serment sortait en « + , + » et ses trois
    clauses disparaissaient du kit) : (1) un COMMENTAIRE // peut vivre DANS le
    tableau — on le retire d'abord, hors chaînes ; (2) l'apostrophe d'un mot
    français n'ouvre pas une chaîne — seuls `"` et le backtick comptent, le
    .ts n'écrit jamais ses textes entre quotes simples."""
    brut = _sans_commentaires(brut)
    out: list[str] = []
    prof = 0
    cur = ""
    mode = None
    q = ""
    esc = False
    for j, c in enumerate(brut):
        if mode == "str":
            cur += c
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == q:
                mode = None
            continue
        if c in '"`':
            mode = "str"
            q = c
            cur += c
        elif c == "[":
            prof += 1
        elif c == "]":
            prof -= 1
            if prof == 0:
                if cur.strip():
                    out.append(recoller(cur))
                break
        elif c == "," and prof == 1:
            if cur.strip():
                out.append(recoller(cur))
            cur = ""
        else:
            cur += c
    return [p for p in out if p]


# ─────────────────────────────────────────────────────────────── assemblage


def main() -> int:
    if not TS.exists():
        print(f"ERREUR : {TS} introuvable", file=sys.stderr)
        return 1

    scenes = lire_scenes()
    par_id = {s["id"]: s for s in scenes}

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {"fichiers": {}}
    fichiers = manifest.get("fichiers", {})
    meta = json.loads(META.read_text(encoding="utf-8")).get("scenes", {}) if META.exists() else {}

    zones = []
    zones_json = {}
    for zf in sorted(ZONES.glob("*.json")):
        z = json.loads(zf.read_text(encoding="utf-8"))
        zones_json[zf.stem] = z
        noms = {s["id"]: s for s in z.get("scenes", [])}
        lieux = z.get("lieux", [])
        # Nom lisible + lieu + type, depuis la matière de production.
        for s in scenes:
            j = noms.get(s["id"])
            if j:
                s.setdefault("nom", j.get("nom") or s["id"])
                s.setdefault("lieu", j.get("lieu") or "")
                s.setdefault("typeScene", j.get("type") or "")
        for p in (p for s in scenes for p in s["pointsInteret"]):
            j = noms.get(p["id"])
            if j:
                p.setdefault("nom", j.get("nom") or p["label"])
        zones.append(
            {
                "id": zf.stem,
                "nom": z.get("zone", {}).get("nom", zf.stem),
                "acte": z.get("zone", {}).get("acte"),
                "lieux": [
                    {
                        "id": l["id"],
                        "nom": l.get("nom", l["id"]),
                        "illustration": (l.get("illustration") or "").replace("assets/", "") or None,
                        "x": l.get("x"),
                        "y": l.get("y"),
                        "note": l.get("note", ""),
                    }
                    # ⚠️ Un enregistrement `region: true` est un CADRE, pas un
                    # lieu : le dessiner aussi comme carte produisait « Le Hameau
                    # des Renonçants » DANS « Le Hameau des Renonçants » (retour
                    # Patrick 6/08). Les scènes vivent dans les lieux membres.
                    for l in lieux
                    if not l.get("region")
                ],
            }
        )

    def fiche_image(nom: str | None) -> dict | None:
        if not nom:
            return None
        n = nom.replace("assets/", "")
        f = fichiers.get(n)
        return {
            "fichier": n,
            "hash": f["hash"] if f else None,
            "taille": f["taille"] if f else None,
            "recent": bool(f and f.get("recent")),
            "existe": bool(f),
        }

    # ── LIENS explicites. On ne trace QUE ce qui est écrit : la suite d'une
    # chaîne (`chainNext`), un point d'intérêt qui ouvre sur une rencontre
    # (`leadsTo`), et les orientations d'une liaison. Les déplacements de
    # traversée (n'importe quel lieu vers n'importe quel autre) ne sont PAS des
    # liens : les tracer donnerait une pelote illisible et mensongère.
    liens = []
    for s in scenes:
        if s.get("suite") and s["suite"] in par_id:
            liens.append({"de": s["id"], "vers": s["suite"], "type": "principal"})
        for p in s["pointsInteret"]:
            if p.get("ouvreSur") and p["ouvreSur"] in par_id:
                liens.append({"de": s["id"], "vers": p["ouvreSur"], "type": "secondaire", "par": p["id"]})
        for c in s["choix"]:
            if c.get("dest"):
                liens.append({"de": s["id"], "vers": c["dest"], "type": "conditionnel", "par": c["id"]})

    entrants: dict[str, list[str]] = {}
    for l in liens:
        entrants.setdefault(l["vers"], []).append(l["de"])

    for s in scenes:
        s["image"] = fiche_image(s.get("illustration"))
        m = meta.get(s["id"], {})
        s["description"] = m.get("description", "")
        s["promptImage"] = m.get("prompt_image", "")
        s["mèneVers"] = sorted({l["vers"] for l in liens if l["de"] == s["id"]})
        s["mèneIci"] = sorted(set(entrants.get(s["id"], [])))
        for p in s["pointsInteret"]:
            p["image"] = fiche_image(p.get("illustration"))
            pm = meta.get(p["id"], {})
            p["description"] = pm.get("description", "")
            p["promptImage"] = pm.get("prompt_image", "")
        s.pop("illustration", None)
        for p in s["pointsInteret"]:
            p.pop("illustration", None)

    # Réserve : les fichiers d'assets qu'aucune scène ni POI n'utilise.
    utilisees = {s["image"]["fichier"] for s in scenes if s["image"]}
    utilisees |= {p["image"]["fichier"] for s in scenes for p in s["pointsInteret"] if p["image"]}
    # ⚠️ Une image peut être référencée AILLEURS que sur une scène : icônes
    # d'objets (`besace.ts`), vues de marche (`pickWalkImage`), habillage des
    # menus. Les compter comme orphelines ferait croire à 80 fichiers morts là
    # où il y en a bien moins (piège déjà rencontré sur la page de couverture).
    for d in ("aldenhar/lib", "aldenhar/components"):
        for f in (RACINE / d).rglob("*.ts*"):
            utilisees |= {
                m.replace("assets/", "")
                for m in re.findall(r'"(assets/[^"]+)"', f.read_text(encoding="utf-8"))
            }
    # ⚠️ `relique_` : le chemin est DÉRIVÉ à l'exécution (`assets/relique_{id}.png`
    # dans lib/reliques.ts), jamais littéral dans le code — sans cette entrée,
    # les 8 icônes de reliques passaient pour orphelines (attrapé le 6/08).
    UI = ("pactum_logo", "geolier_", "accueil_demon", "frange_", "croix_menu",
          "banner-edge", "bande_dissolution", "etat_", "relique_", "dithering-demon", "mort_",
          "objet_couronne", "objet_dague_os", "objet_fiole", "objet_grimoire",
          "objet_grand_registre", "scene_landes_frise")
    # ── CLASSEMENT DE LA RÉSERVE EN TROIS GROUPES (tâche du journal 6/08) ──
    # 1. « attend » — le fichier nomme un sujet du LORE (créature, lieu,
    #    rencontre, objet de landes.json) qui n'a pas encore de scène : il
    #    attend qu'on l'écrive.
    # 2. « brancher » — une scène EXISTANTE parle du même sujet mais pointe
    #    vers une autre image (ou aucune) : rattachable en un clic.
    # 3. « doublon » — plusieurs fichiers pour la même racine de nom
    #    (suffixes _v1/_v2/_a.._d) : en désigner un, archiver les autres.
    # 4. « autre » — rien de tout ça (filet, jamais caché).
    def _racine(nom: str) -> str:
        """`monstre_pendu_mal_fixe_v1_b.png` → `pendu_mal_fixe`."""
        r = re.sub(r"\.png$", "", nom)
        r = re.sub(r"^(monstre|scene|objet|etat|relique)_", "", r)
        r = re.sub(r"(_v\d+)?(_[a-d])?(_[a-d])?$", "", r)
        return r

    # Les sujets du lore (landes.json) et leurs slugs de nom de fichier.
    zone_json = json.loads((RACINE / "data/zones/landes.json").read_text(encoding="utf-8"))
    import unicodedata
    def _slug(txt: str) -> str:
        t = unicodedata.normalize("NFD", txt.lower())
        t = "".join(c for c in t if not unicodedata.combining(c))
        return re.sub(r"[^a-z0-9]+", "_", t).strip("_")
    sujets_lore: set[str] = set()
    for coll in ("lieux", "rencontres", "creatures", "objets"):
        for e in zone_json.get(coll, []):
            sujets_lore.add(_slug(e.get("nom", "")))
            sujets_lore.add(e.get("id", "").replace("-", "_"))

    # Les sujets DÉJÀ mis en scène (racines des images réellement câblées).
    racines_en_jeu = {_racine(u) for u in utilisees}

    def _groupe(nom: str, doublons: set[str]) -> str:
        rac = _racine(nom)
        if rac in doublons:
            return "doublon"
        if rac in racines_en_jeu:
            return "brancher"
        # « attend sa scène » : la racine (ou un préfixe net) nomme un sujet
        # du lore. Match par inclusion dans les deux sens — `la_fille` ⊂
        # `monstre_la_fille`, `troupeau_sans_berger` = `troupeau_sans_berger`.
        if any(rac == s2 or (len(s2) > 5 and (s2 in rac or rac in s2)) for s2 in sujets_lore):
            return "attend"
        return "autre"

    libres = [n for n in sorted(fichiers)
              if n not in utilisees and not any(n.startswith(u) for u in UI)]
    from collections import Counter
    cnt = Counter(_racine(n) for n in libres)
    doublons = {r for r, c in cnt.items() if c > 1}
    reserve = [
        {
            "fichier": n,
            "hash": fichiers[n].get("hash"),
            "taille": fichiers[n].get("taille"),
            "recent": bool(fichiers[n].get("recent")),
            "groupe": _groupe(n, doublons),
            "racine": _racine(n),
        }
        for n in libres
    ]

    # RÉGIONS : le seul groupement géographique RÉEL du jeu — le Hameau des
    # Renonçants, dont l'intérieur n'est atteignable qu'après y être entré
    # (`HAMEAU_INTERIOR` dans le .ts). Tout le reste de la zone est un pool :
    # la traversée tire les destinations, il n'y a PAS de chemins fixes entre
    # les lieux. Ne jamais en inventer sur la carte : ce serait un mensonge.
    src_ts = TS.read_text(encoding="utf-8")
    mreg = re.search(r"export const HAMEAU_INTERIOR = \[([\s\S]*?)\];", src_ts)
    regions = []
    if mreg:
        # ⚠️ `HAMEAU_INTERIOR` est une liste de GAMEPLAY : les lieux que la
        # traversée ne peut pas tirer tant qu'on n'est pas entré au village. Le
        # Hameau lui-même n'y figure PAS — il est la porte d'entrée, il doit
        # rester tirable avant. Le prendre pour une liste géographique laissait
        # « Le Hameau des Renonçants » (15 scènes) hors de son propre cadre.
        # La région du Studio ajoute donc le lieu qui porte la séquence
        # d'entrée / de halte (`hameauEntree` · `hameauHalte`).
        interieur = re.findall(r'"([^"]+)"', mreg.group(1))
        porte = {
            s.get("lieu")
            for s in scenes
            if (s.get("hameauEntree") or s.get("hameauHalte")) and s.get("lieu")
        }
        reg = {"id": "hameau", "nom": "Le Hameau des Renonçants",  # nom du JSON plus bas s'il existe
               "scenes": interieur, "lieuxEnPlus": sorted(porte)}
        # Le cadre du Hameau vient du Figma (frame 2112:328), pas d'un calcul :
        # un rectangle déduit après coup des membres englobe fatalement des
        # lieux qui n'en sont pas. La boîte AUTORITAIRE est dans le JSON de
        # zone, à côté des coordonnées des lieux — mêmes unités.
        jreg = next((r for r in (zones_json.get("landes", {}).get("regions") or [])
                     if r.get("id") == "hameau"), None)
        if jreg and jreg.get("boite"):
            reg["boite"] = jreg["boite"]
            reg["lieux"] = jreg.get("lieux") or []
        regions.append(reg)

    # ── LA TAXONOMIE EN QUATRE DIMENSIONS (spec Patrick 30/07) ──────────
    # Elles ne doivent JAMAIS être confondues :
    #   A. NATURE      — ce que l'élément EST (lieu, scène, rencontre, point).
    #   B. RÔLE        — sa fonction dans le parcours (entrée, sortie, pivot,
    #                    optionnel, verrouillé). Un point d'entrée n'est pas un
    #                    type de lieu : c'est un badge posé sur un lieu.
    #   C. ÉTAT        — où en est la PRODUCTION (validé, à compléter, brouillon).
    #   D. ALERTE      — ce qui est CASSÉ (orphelin, lien mort, image absente).
    entree = re.search(r'export const ENTRY_SCENE = "([^"]+)"', src_ts)
    entree = entree.group(1) if entree else None
    mapp = re.search(r"const APPROACH: Record<string, string> = \{([\s\S]*?)\n\};", src_ts)
    pool = re.findall(r'^\s{2}"([^"]+)":', mapp.group(1), re.M) if mapp else []
    # La SORTIE DE ZONE n'est pas tirable (9/08) : elle se rejoint au bout de
    # la traversée. L'exclure ici, sinon la carte et le kit la présentent
    # comme une destination possible alors que le moteur ne l'offre jamais.
    m_sortie = re.search(r'export const SORTIE_DE_ZONE = "([^"]+)"', src_ts)
    if m_sortie:
        pool = [x for x in pool if x != m_sortie.group(1)]

    ids = {s["id"] for s in scenes}
    via_poi = {l["vers"] for l in liens if l["type"] == "secondaire"}
    sortants = {}
    for l in liens:
        sortants.setdefault(l["de"], set()).add(l["vers"])

    for s in scenes:
        # ── B. RÔLES
        r = []
        if s["id"] == entree:
            r.append("entree")
        if any("Descente" in c.get("label", "") for c in s["choix"]):
            r.append("sortie")
        if len(sortants.get(s["id"], ())) >= 2:
            r.append("pivot")
        if s["id"] in via_poi:
            r.append("optionnel")
        if any(c["type"] == "verrouille" for c in s["choix"]):
            r.append("verrouille")
        s["roles"] = r

        # ── COMMENT ON Y ARRIVE. Un lien explicite n'est pas le seul chemin :
        # la traversée TIRE ses destinations, et certaines scènes sont routées
        # par le code (la halte du Hameau, le procès au Soupçon 6). Sans ça,
        # quatre scènes parfaitement jouables ressortaient « orphelines ».
        if s["mèneIci"]:
            s["acces"] = "lien"
        elif s["id"] in pool:
            s["acces"] = "traversée"
        elif s["id"] == entree:
            s["acces"] = "entrée de zone"
        elif s.get("hameauEntree") or s.get("hameauHalte") or s["id"].startswith("hameau-"):
            s["acces"] = "séquence du Hameau"
        elif s.get("procesFixation"):
            s["acces"] = "procès (Soupçon au maximum)"
        elif s["id"] == "bete-chemins-creux":
            # 7/08 : la Bête n'est plus dans le pool — elle embusque la route
            # du Chemin Creux (branche toDest d'advance()).
            s["acces"] = "embuscade (route du Chemin Creux)"
        elif s.get("remplace"):
            # Une scène-variante se joue À LA PLACE d'une autre quand sa
            # condition tient — elle n'est jamais orpheline (faux positifs du
            # 7/08 : fossoyeur-trou-1, femme-savoir-1, fille-moulin-1…).
            s["acces"] = "variante conditionnelle"
        elif s["id"] == "renoncer":
            s["acces"] = "portillon de la Halte (Serment tenu)"
        elif s["id"] == "troupeau-sans-berger":
            s["acces"] = "déroutage en marchant (boucle est)"
        else:
            s["acces"] = "aucun"

        # ── C. ÉTAT DE PRODUCTION (éditorial, jamais structurel)
        if not s["image"] or not s["image"]["existe"]:
            s["etat"] = "acompleter"
        elif not s["narration"]:
            s["etat"] = "brouillon"
        else:
            s["etat"] = "valide"

        # ── D. ALERTES D'AUDIT (structurel, jamais éditorial)
        a = []
        if s["acces"] == "aucun":
            a.append("orpheline")
        if not s["image"]:
            a.append("imageManquante")
        elif not s["image"]["existe"]:
            a.append("imageIntrouvable")
        for v in sortants.get(s["id"], ()):
            if v not in ids:
                a.append("lienCasse")
        s["alertes"] = a
        for p in s["pointsInteret"]:
            p["etat"] = "acompleter" if (not p["image"] or not p["image"]["existe"]) else "valide"
            p["alertes"] = [] if p["image"] and p["image"]["existe"] else ["imageManquante"]

    # ── AGRÉGATS PAR LIEU : le lieu devient le nœud dominant de la carte, il
    # doit se lire seul (combien de scènes, de rencontres, de points, par où
    # on y entre et par où on en sort).
    for z in zones:
        for l in z["lieux"]:
            dedans = [s for s in scenes if s.get("lieu") == l["id"]]
            arr = next((s for s in dedans if s.get("typeScene") == "arrivee"), dedans[0] if dedans else None)
            ext = lambda i: (next((x for x in scenes if x["id"] == i), {}) or {}).get("lieu")
            l["scenes"] = [s["id"] for s in dedans]
            l["nbScenes"] = len(dedans)
            l["nbRencontres"] = sum(1 for s in dedans if s.get("combat") or s.get("adversaire"))
            l["nbPois"] = sum(len(s["pointsInteret"]) for s in dedans)
            l["entrees"] = sorted({ext(i) for s in dedans for i in s["mèneIci"] if ext(i) and ext(i) != l["id"]})
            l["sorties"] = sorted({ext(i) for s in dedans for i in s["mèneVers"] if ext(i) and ext(i) != l["id"]})
            l["roles"] = sorted({r for s in dedans for r in s["roles"]} & {"entree", "sortie"})
            l["dansPool"] = bool(arr and arr["id"] in pool)
            l["alertes"] = sorted({a for s in dedans for a in s["alertes"]})
            l["aCompleter"] = sum(1 for s in dedans if s["etat"] != "valide")
            if arr:
                l["scenePrincipale"] = arr["id"]
                if arr["image"]:
                    l["illustration"] = arr["image"]["fichier"]

    donnees = {
        "regions": regions,
        "entree": entree,
        "pool": pool,
        "genere": manifest.get("genere", ""),
        "commit": manifest.get("commit", ""),
        "zones": zones,
        "scenes": scenes,
        "liens": liens,
        "reserve": reserve,
        # LES SYSTÈMES TRANSVERSES (5/08) : ils ne vivent dans aucune scène,
        # mais ils pèsent sur toutes. Exportés à part pour que le Studio puisse
        # les montrer comme des catalogues.
        "reliques": lire_reliques(),
        "faits": lire_faits(),
        "perceptions": lire_perceptions(),
        "loiDuDomaine": lire_loi(),
        "temoins": TEMOINS,
        "etats": lire_etats(),
        "besoins": lire_besoins(),
        "transitions": lire_transitions(),
        "familiarite": lire_familiarite(),
        "surprises": lire_surprises(),
        "totaux": {
            "scenes": len(scenes),
            "pointsInteret": sum(len(s["pointsInteret"]) for s in scenes),
            "choix": sum(len(s["choix"]) for s in scenes),
            "illustrations": len(fichiers),
            "sansImage": sum(1 for s in scenes if not s["image"]),
            "imagesIntrouvables": sum(
                1 for s in scenes if s["image"] and not s["image"]["existe"]
            ),
            "reserve": len(reserve),
            "reliques": len(lire_reliques()),
            "faits": len(lire_faits()),
            "perceptions": len(lire_perceptions()),
            "temoins": len(TEMOINS),
            "etats": len(lire_etats()),
            "besoins": len(lire_besoins()),
            "transitions": len(lire_transitions()["fond"]) + len(lire_transitions()["variantes"]),
            "familiarite": sum(len(f["strates"]) for f in lire_familiarite()),
        },
    }
    SORTIE.write_text(json.dumps(donnees, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    t = donnees["totaux"]
    print(f"{SORTIE.relative_to(RACINE)} — {SORTIE.stat().st_size // 1024} Ko")
    print(f"   {t['scenes']} scènes · {t['pointsInteret']} points d'intérêt · {t['choix']} choix")
    print(f"   {len(liens)} liens · {t['reserve']} en réserve · {t['imagesIntrouvables']} images introuvables")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
