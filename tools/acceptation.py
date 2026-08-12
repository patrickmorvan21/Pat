#!/usr/bin/env python3
"""
LES TESTS D'ACCEPTATION — 8e garde de build (plan d'élagage du 11/08, §19).

Le mémo « reset » finissait sur dix tests d'acceptation. Ils valaient mieux
qu'une check-list de fin de lot : ce sont des INVARIANTS. Ce garde tient ceux
qui sont mécaniquement prouvables sur les sources, pour qu'un contenu futur
qui les violerait casse le build au lieu d'attendre un playtest.

⚠️ Il ne couvre PAS les dix. Les tests de RESSENTI (« environ 5 à 8 jets par
vie », « la deuxième incarnation montre vite une différence », « le jeu reste
compréhensible sans le Codex ») ne se prouvent pas sur du texte source : ils
restent au playtest, et le garde le dit à chaque passage plutôt que de laisser
croire à une couverture totale.

Usage : python3 tools/acceptation.py [--strict]
"""
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SD = RACINE / "aldenhar/lib/scene-data.ts"
SC = RACINE / "aldenhar/components/Scene.tsx"

LIT = r'"(?:[^"\\]|\\.)*"(?:\s*\+\s*\n?\s*"(?:[^"\\]|\\.)*")*'


def sans_commentaires(src: str) -> str:
    """⚠️ Piège d'analyseur récurrent du projet : un garde qui lit les
    COMMENTAIRES signale les défauts qu'on vient d'y documenter. Ce garde
    a tiré trois fois dessus à sa première exécution — sur la ligne même
    qui explique la suppression de `coutJour`, et sur celle qui rappelle
    où le Jour s'incrémente. On neutralise les commentaires en gardant les
    positions (espaces) pour que les index restent valides."""
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c == '"':  # chaîne : on la garde telle quelle
            j = i + 1
            while j < n and src[j] != '"':
                j += 2 if src[j] == "\\" else 1
            out.append(src[i:j + 1]); i = j + 1
        elif src.startswith("//", i):
            j = src.find("\n", i)
            j = n if j < 0 else j
            out.append(" " * (j - i)); i = j
        elif src.startswith("/*", i):
            j = src.find("*/", i)
            j = n if j < 0 else j + 2
            out.append("".join(ch if ch == "\n" else " " for ch in src[i:j])); i = j
        else:
            out.append(c); i += 1
    return "".join(out)


def sans_chaines(src: str) -> str:
    """Vide le CONTENU des chaînes en gardant les positions.

    ⚠️ `sans_commentaires` ne suffit pas pour chercher un NOM DE CHAMP : la
    prose du jeu contient « L'échange se fait : trois clous… », et un regex
    `\\bfait\\s*:` y voit une déclaration de champ. C'est ce faux positif qui a
    fait accuser `troc-colporteur` à tort. Pour toute recherche de champ,
    passer par ici ; pour extraire un libellé, garder le texte intact."""
    out, i, n = [], 0, len(src)
    while i < n:
        if src[i] == '"':
            j = i + 1
            while j < n and src[j] != '"':
                j += 2 if src[j] == "\\" else 1
            out.append('""' + " " * max(0, j - i - 1)); i = j + 1
        else:
            out.append(src[i]); i += 1
    return "".join(out)


def bloc_depuis(src: str, i: int) -> str:
    """Le bloc { … } qui commence à l'index i (accolades équilibrées)."""
    d = 0
    for q in range(i, len(src)):
        if src[q] == "{":
            d += 1
        elif src[q] == "}":
            d -= 1
            if d == 0:
                return src[i:q + 1]
    return ""


def choix_de(src: str):
    """Chaque objet de choix de premier niveau, avec sa scène englobante."""
    scenes = [(m.start(), m.group(1)) for m in re.finditer(r'\n    id: "([a-z0-9-]+)"', src)]

    def scene_at(pos):
        prev = "?"
        for p, sid in scenes:
            if p > pos:
                break
            prev = sid
        return prev

    for m in re.finditer(r'\n      \{\n(?:\s*(?:/\*[\s\S]*?\*/|//[^\n]*)\n)*\s*id: "([a-z0-9-]+)",', src):
        yield scene_at(m.start()), m.group(1), bloc_depuis(src, m.start() + 7)


def main() -> int:
    sd = sans_commentaires(SD.read_text(encoding="utf8"))
    sc = sans_commentaires(SC.read_text(encoding="utf8"))
    sd_brut = SD.read_text(encoding="utf8")  # A8/A-nature lisent les libellés
    manques: list[str] = []

    # ─── A1. « Un échec social ne peut pas tuer le héros. » ──────────────
    # Prouvable : la santé n'a qu'UNE source de coût, `coutSante`, et elle
    # rend 0 pour toute nature autre que physique. Si quelqu'un ajoutait un
    # barème par nature, la garde saute ici avant le playtest.
    m = re.search(r'export function coutSante\([\s\S]{0,600}?\n\}', sd)
    if not m:
        manques.append("A1 — `coutSante` introuvable : le barème de santé n'a plus de source unique.")
    elif 'if (nature !== "physique") return 0;' not in m.group(0):
        manques.append(
            "A1 — `coutSante` ne rend plus 0 d'emblée hors nature physique : "
            "un échec social pourrait coûter de la santé, donc tuer."
        )

    # ─── A2. « Un échec ordinaire ne fait pas avancer le jour. » ─────────
    # Deux preuves : le champ `coutJour` n'existe plus (supprimé le 10/08 —
    # le Jour est un SCORE, jamais une sanction), et les sites qui touchent
    # `run.day` sont exactement ceux de la liste blanche.
    if re.search(r'\bcoutJour\b', sd) or re.search(r'\bcoutJour\b', sc):
        manques.append(
            "A2 — le champ `coutJour` est réapparu. Le Grand Registre classe par "
            "jours survécus : un Jour retiré en sanction récompense le passif."
        )
    sites = [sc[max(0, m.start() - 260):m.start()] for m in re.finditer(r'run\.day \+= 1', sc)]
    if len(sites) != 2:
        manques.append(
            f"A2 — {len(sites)} site(s) incrémentent `run.day` (2 attendus : la marche "
            "engagée dans advance(), la nuit au campement). Tout nouveau site doit "
            "être justifié ici avant d'être ajouté à la liste blanche."
        )
    else:
        if not any("jourDeMarche" in s for s in sites):
            manques.append("A2 — le Jour de MARCHE (advance) a disparu de ses sites connus.")
        if not any("usure" in s or "horloge" in s for s in sites):
            manques.append("A2 — le Jour de NUIT (campement) a disparu de ses sites connus.")

    # ─── A4. « Le joueur qui passe n'est pas secrètement puni. » ─────────
    # Le versant prouvable de la doctrine du 8/08 : le Soupçon naît d'un ACTE,
    # jamais du REGARD. Un point d'intérêt est le plus souvent une observation
    # — mais pas toujours : trois d'entre eux portent un geste (toucher la
    # craie d'un condamné, poser LA question interdite à la Doyenne, fouiller
    # sous l'autel). Ceux-là paient, et c'est juste. Le garde ne les interdit
    # donc pas : il exige qu'ils soient DÉCLARÉS ici, avec la raison. Tout
    # nouveau point qui ferait monter le Soupçon sans passer par cette liste
    # est une observation qu'on taxe — exactement ce que l'arbitrage refuse.
    ACTES = {
        "croix-craie": "toucher la craie qui marque un condamné",
        "pourquoi-trois-aubes": "poser LA question au muret, devant témoins",
        "autel-renverse": "fouiller sous l'autel de la Chapelle",
    }
    for m in re.finditer(r'pointsInteret:\s*\[', sd):
        blocs = bloc_depuis(sd, sd.index("[", m.start()) - 0) if False else None
        # portée : jusqu'à la fermeture du tableau
        d, fin = 0, m.end() - 1
        for q in range(m.end() - 1, len(sd)):
            if sd[q] == "[":
                d += 1
            elif sd[q] == "]":
                d -= 1
                if d == 0:
                    fin = q
                    break
        seg = sd[m.end():fin]
        for mm in re.finditer(r'\bsoupcon:\s*\d', seg):
            pid = re.findall(r'id: "([a-z0-9-]+)"', seg[:mm.start()])
            nom = pid[-1] if pid else "?"
            if nom not in ACTES:
                manques.append(
                    f"A4 — le point d'intérêt « {nom} » fait monter le Soupçon sans "
                    "être déclaré comme un ACTE. Observer est gratuit (arbitrage "
                    "8/08) : si c'est bien un geste, ajoute-le à ACTES avec sa raison."
                )

    # ─── A8. « Les choix restent lisibles en quelques secondes. » ────────
    # FitLabel rétrécit la police jusqu'à 8px ; au-delà d'une certaine
    # longueur, le libellé devient illisible sur un écran de 390 px.
    MAX = 46
    for sid, cid, b in choix_de(sd):
        lab = re.search(r'label: "([^"]+)"', b)
        if lab and len(lab.group(1)) > MAX:
            manques.append(
                f"A8 — libellé de {len(lab.group(1))} car. sur « {cid} » ({sid}) : "
                f"plus de {MAX}, il ne se lit plus d'un coup d'œil."
            )

    # ─── A-supplément. Une charge de point d'intérêt ne va pas sur un jet. ──
    # `chapterFragment`, `fait` et `corbeaux` ont été ajoutés à `Choice` par le
    # chantier du 11/08 pour que « Observer » puisse disparaître sans rien
    # perdre. Ils sont servis à la SÉLECTION, donc uniquement pour les choix
    # sans dé : sur un choix risqué ils s'afficheraient avant qu'on sache si
    # l'action a réussi. Sans ce garde, poser l'un d'eux sur un jet donnerait
    # un champ silencieusement inerte — le défaut que le §12 du chantier
    # appelle « considérer un flag stocké comme une fonctionnalité terminée ».
    for sid, cid, b in choix_de(sd):
        bc = sans_chaines(b)  # sinon la PROSE fait passer « se fait : » pour un champ
        if re.search(r'\brisky:\s*\{', bc):
            for f in ("chapterFragment", "fait", "corbeaux"):
                if re.search(rf'\n\s*{f}\s*:', bc):
                    manques.append(
                        f"A-supplément — le jet « {cid} » ({sid}) porte `{f}`, "
                        "qui n'est servi que pour les choix SANS dé. Déplace-le "
                        "sur une action sans jet, ou le contenu ne s'affichera jamais."
                    )

    # ─── A-nature. Tout jet déclare la nature de son échec. ──────────────
    # Sans elle, le défaut prudent décide à la place de l'auteur — et c'est
    # exactement ce que le §5 du mémo interdit (« chaque issue ne déclare que
    # les effets que son texte justifie »).
    for sid, cid, b in choix_de(sd):
        if re.search(r'\brisky:\s*\{', b) and not re.search(r'\bnature:\s*"', b):
            manques.append(
                f"A-nature — le jet « {cid} » ({sid}) ne déclare pas sa `nature` : "
                "le coût de son échec serait deviné, pas écrit."
            )

    print(f"TESTS D'ACCEPTATION — {len(manques)} signalement(s)\n")
    for x in manques:
        print("  ⚠️ " + x)
    if not manques:
        print("  A1 un échec non physique ne peut pas coûter de santé  ✓")
        print("  A2 aucun Jour n'est jamais retiré en sanction          ✓")
        print(f"  A4 seuls {len(ACTES)} gestes déclarés font monter le Soupçon  ✓")
        print("  A8 tous les libellés de choix se lisent d'un coup      ✓")
        print("  chaque jet déclare la nature de son échec              ✓")
    print(
        "\n  Restent au PLAYTEST (non prouvables sur les sources) : le nombre de\n"
        "  jets par vie, ce que l'exploration prépare réellement, la lisibilité\n"
        "  de la 2e incarnation, et la compréhension sans Codex."
    )
    if manques and "--strict" in sys.argv:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
