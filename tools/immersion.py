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

# ── lexiques de présupposition ────────────────────────────────────────────────
# Des GENS sont là (quelqu'un d'autre que le héros agit/regarde/parle).
GENS = re.compile(
    r"(un homme|une femme|un enfant|une mère|un vieux|le vieux\b|la Doyenne"
    r"|des gens|les gens|un voisin|un passant|le barrage|trois hommes"
    r"|on te (?:parle|répond|suit|regarde|dit|adresse)|on t'adresse"
    r"|te croise|son salut|son panier|son quignon|coupe son quignon"
    r"|pose un bol|conversation|quelqu'un (?:ralentit|est passé|fait ta route)"
    r"|personne ne relève|volets? se referm|une écuelle)",
    re.IGNORECASE,
)
# Le décor est le VILLAGE (bâti, rues, seuils).
VILLAGE = re.compile(
    r"(muret|ruelle|volet|hameau|village|chapelle|cloche\b|grange|pavé"
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
    j = src.find("[", i)
    if j < 0:
        return ""
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

    # — états : manifestation (servie à l'ACQUISITION, n'importe où),
    #   réactions (village sauf indices reactionsPartout), intruses (partout),
    #   guérison (n'importe où).
    for m in re.finditer(r'\{\s*id:\s*"([a-z]+)",\s*nom:', etats_src):
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
                "garde": {"partout"},
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

    # — ambiances de liaison (fond) : servies sur TOUTE liaison, village
    #   compris quand les variantes de village sont épuisées (anti-répétition).
    for i, t in enumerate(chaines_de_tableau(bloc_tableau(scene_src, "const LIAISON_AMBIANCES"))):
        out.append({"pool": f"liaison ambiance {i}", "garde": {"partout"}, "textes": [t]})

    # — bifurcations : phrase de Croisée, partout.
    for i, t in enumerate(chaines_de_tableau(bloc_tableau(scene_src, "const BIFURCATIONS"))):
        out.append({"pool": f"bifurcation {i}", "garde": {"partout"}, "textes": [t]})

    # — la loi du Domaine : liaison, n'importe où.
    for i, t in enumerate(chaines_de_tableau(bloc_tableau(loi_src, "manifestations:"))):
        out.append({"pool": f"loi manifestation {i}", "garde": {"partout"}, "textes": [t]})

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
