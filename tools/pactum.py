#!/usr/bin/env python3
"""
PACTUM — table de jeu hors navigateur.

À QUOI ÇA SERT : permettre à une IA sans navigateur (ChatGPT en conversation,
par exemple) de LANCER UNE PARTIE et de la jouer réellement, choix par choix,
au lieu de seulement relire des parties enregistrées.

CE QUI EST VRAI, CE QUI NE L'EST PAS — à lire avant d'écrire un rapport :
  • Le CONTENU est celui du jeu, mot pour mot : scènes, narrations, libellés
    de choix, les quatre issues écrites de chaque jet, points d'intérêt,
    phrases de marche, citations du Geôlier. Tout vient de `run-kit.json`,
    extrait des sources par `tools/export_run_kit.py`.
  • Le MOTEUR est une réplique simplifiée du vrai (`components/Scene.tsx`) :
    dé d20 contre seuil, cinq paliers de résolution, santé invisible,
    traversée par liaisons, points d'intérêt, mort permanente. Ne sont PAS
    répliqués : les images, le geste tactile du dé, les minutages, la
    mémoire inter-vies (Registre, reliques, saisons du Geôlier), les besoins,
    les témoins, les chapitres du Bailli, les surprises.
  ⇒ Juge le TEXTE et l'ENCHAÎNEMENT sur ce que tu lis ici. Pour tout ce qui
    touche à la mise en scène ou aux systèmes non répliqués, appuie-toi sur
    les parties enregistrées du dossier `transcripts/`.

USAGE (une commande = un écran ; l'état vit dans `partie.json`) :
    python3 pactum.py nouvelle          lance une vie neuve
    python3 pactum.py 2                 prend le choix n° 2
    python3 pactum.py                   réaffiche l'écran courant
    python3 pactum.py etat              montre les rouages cachés (pour ton
                                        rapport : santé, soupçon, seuils vus)
    python3 pactum.py journal           réimprime toute la partie depuis le début
"""

from __future__ import annotations

import json
import random
import re
import sys
import textwrap
from pathlib import Path

ICI = Path(__file__).resolve().parent
KIT = next(
    (p for p in (ICI / "run-kit.json", ICI.parent / "data" / "run-kit.json") if p.exists()),
    None,
)
SAUVE = ICI / "partie.json"
# LA MÉMOIRE DU COMPTE — ce qui survit à la mort du héros (vague 4).
# Le jeu la porte depuis longtemps ; la réplique ne l'avait pas, et c'est
# pourquoi les testeurs du panel du 9/08 ont conclu que « la vie 2 est une
# relecture » : sans passé de compte, aucun signal inter-vies ne peut tomber.
# Volontairement minuscule : les passages par lieu, les morts, les noms.
COMPTE = ICI / "compte.json"


AXES = ("courage", "ruse", "instinct", "empathie")

# LA TABLE DE LECTURE DES JETS — portage verbatim de `lib/profil.ts`.
# ⚠️ Sans elle, la réplique tirait quatre stats au hasard à la création du
# héros : un relecteur mesurait donc un dé influencé dès le premier jet, alors
# que le jeu réel a un modificateur de ZÉRO tant que le Geôlier n'a pas
# dessiné. C'est le biais corrigé six fois depuis le 09/08.
LECTURE_DU_JET = {
    "COURAGE": {"physique": {"courage": 3, "instinct": -1},
                "social": {"courage": 3, "ruse": -1},
                "exploration": {"courage": 2, "instinct": 1},
                "surnaturel": {"courage": 3, "ruse": -1}},
    "RUSE": {"physique": {"ruse": 3, "courage": -1},
             "social": {"ruse": 3, "empathie": -1},
             "exploration": {"ruse": 2, "instinct": 1},
             "surnaturel": {"ruse": 2, "instinct": 1}},
    "INSTINCT": {"physique": {"instinct": 3, "ruse": 1},
                 "social": {"instinct": 2, "empathie": 1},
                 "exploration": {"instinct": 3, "ruse": 1},
                 "surnaturel": {"instinct": 3, "courage": -1}},
    "EMPATHIE": {"physique": {"empathie": 3, "courage": 1},
                 "social": {"empathie": 3, "ruse": -1},
                 "exploration": {"empathie": 2, "instinct": 1},
                 "surnaturel": {"empathie": 2, "courage": 1}},
}

DECISIONS_MINIMUM = 3
SEUIL_EVIDENCE = 15

# Le portrait de clôture — portage de `lib/prologue-data.ts`. Sans lui, un
# relecteur du kit verrait la révélation sans ce qu'elle DIT du héros.
PORTRAIT_DOMINANTE = {
    "courage": "Tu avances avant de comprendre.",
    "ruse": "Tu regardes les serrures avant les portes.",
    "instinct": "Ton corps décide avant toi, et il se trompe peu.",
    "empathie": "Les gens te parlent, même quand ils ne veulent pas.",
}
PORTRAIT_FRAGILE = {
    "courage": "Devant l'irrémédiable, ta main hésite.",
    "ruse": "Les détours t'ennuient : tu forces.",
    "instinct": "Tu veux des preuves. Elles arrivent tard.",
    "empathie": "Les autres restent un bruit de fond. Ça te coûtera.",
}
PORTRAIT_PLAT = {
    3: "Tu t'engages à chaque fois. Rien ne dépasse chez toi parce que rien ne manque.\nLe dé n'aura pas grand-chose à rattraper.",
    2: "Tu fais ce qu'il faut, à chaque fois. Ni plus.\nRien ne dépasse chez toi. Le dé fera le reste.",
    1: "Rien ne dépasse chez toi : tu traverses les mains dans les poches.\nLe dé n'aura rien à corriger, et rien à aider.",
}


def portrait(st: dict, p: dict) -> str:
    vals = [st[a] for a in AXES]
    if max(vals) - min(vals) <= 1:
        moy = (sum(p["t"][a] for a in AXES) / p["n"]) if p["n"] else 0
        return PORTRAIT_PLAT[3 if moy >= 2 else 1 if moy <= 0.5 else 2]
    dom = max(AXES, key=lambda a: st[a])
    frg = min(AXES, key=lambda a: st[a])
    if frg == dom:
        frg = next(a for a in AXES if a != dom)
    return PORTRAIT_DOMINANTE[dom] + "\n" + PORTRAIT_FRAGILE[frg]


def profil_neuf() -> dict:
    return {"t": {a: 0 for a in AXES}, "n": 0, "revele": False}


def lire_le_geste(c: dict, scene: dict) -> dict | None:
    """Ce qu'un geste apprend sur celui qui l'a fait — ou None.

    Rendre None est la moitié du travail : un « Continuer », une orientation
    ne disent rien de personne, et les compter ferait tomber la révélation
    sur du bruit.
    """
    if c.get("tendances"):
        return c["tendances"]
    if c.get("stat"):
        nature = c.get("nature") or ("physique" if scene.get("combat") else "social")
        return LECTURE_DU_JET.get(c["stat"], {}).get(nature)
    if c.get("serment") == "jure":
        return {"empathie": 2, "courage": 1, "ruse": -1}
    if c.get("serment") == "faux":
        return {"ruse": 3, "empathie": -2}
    if c.get("serment") == "refuse":
        return {"courage": 3, "ruse": -1, "empathie": -1}
    if c.get("observe"):
        return {"instinct": 2, "ruse": 1}
    if "fuite" in (c.get("tags") or []):
        return {"instinct": 2, "courage": -1}
    if (c.get("soupcon") or 0) > 0:
        return {"courage": 1, "ruse": -1}
    if c.get("demiTour"):
        return {"instinct": 3, "courage": -2}
    # EXAMINER EST UNE DÉCISION (voir le commentaire de `lib/profil.ts`) :
    # sans elle, un joueur qui explore sans jamais engager le dé n'est lu par
    # rien. Une sortie ou une orientation, elles, ne disent toujours rien.
    if c.get("consequence") and not c.get("sortie") and not c.get("dest"):
        return {"instinct": 1, "ruse": 1}
    return None


def evidence(p: dict) -> float:
    axes = len([a for a in AXES if abs(p["t"][a]) >= 1])
    total = sum(abs(p["t"][a]) for a in AXES)
    return total * (0.6 + 0.2 * axes)


def stats_depuis_tendances(p: dict) -> dict:
    moy = sum(p["t"][a] for a in AXES) / len(AXES)
    ecart = max(max(abs(p["t"][a] - moy) for a in AXES), 1)
    amp = min(1.0, evidence(p) / (SEUIL_EVIDENCE * 1.5))
    return {a: max(1, min(5, round(3 + ((p["t"][a] - moy) / ecart) * 2 * amp))) for a in AXES}


def lire_compte() -> dict:
    if COMPTE.exists():
        try:
            c = json.loads(COMPTE.read_text(encoding="utf-8"))
        except Exception:
            c = {}
    else:
        c = {}
    c.setdefault("morts", 0)
    c.setdefault("tombes", [])   # [{nom, cause}] — le plus récent en tête
    c.setdefault("visites", {})  # lieu -> nombre de passages du COMPTE
    # LE SCEAU DES LANDES (14/08) : combien de fois ce compte a franchi la
    # Descente vivant. C'est la seule chose que la SURVIE laisse au compte —
    # la mort, elle, forge une relique.
    c.setdefault("sceau", 0)
    # Ce que le JOUEUR a compris, par-delà ses morts (`discovery`).
    c.setdefault("decouvertes", [])
    return c


def ecrire_compte(c: dict) -> None:
    COMPTE.write_text(json.dumps(c, ensure_ascii=False), encoding="utf-8")
LARGEUR = 74

# Coûts de santé par palier — repris de components/Scene.tsx.
# ⚠️ Depuis le 9/08, la NATURE du jet décide : seul un échec PHYSIQUE coûte de
# la santé. Un échec social coûte du Soupçon, un échec d'exploration coûte un
# rien de plus (le texte porte la perte), un échec surnaturel laisse un état. On ne meurt donc que d'un danger
# physique — la mort doit être compréhensible dans la fiction.
# Barème DURCI le 2/09, le 7/09, puis le 11/09 (miroir de `coutSante`,
# scene-data). Repère : QUATRE échecs ordinaires tuent, TROIS laissent au
# seuil. Avant le 11/09 il en fallait cinq.
COUT = {"malediction": 0.55, "critique": 0.46, "echec": 0.32, "justesse": 0.14}
# LE KARMA DU PRUDENT (11/09) — miroir de `LIGNES_AVANT_RECOUSU` dans
# components/Scene.tsx : combien de lieux d'affilée on peut quitter sans rien
# y engager avant que le Domaine envoie solder le compte.
LIGNES_AVANT_RECOUSU = 3


def tension_traversee(visites: int, cible: int) -> int:
    """Miroir de `tensionTraversee` (scene-data) — la courbe de difficulté de
    la traversée, en crans de seuil. Rien ne s'affiche : c'est l'Anneau qui
    montre moins d'encoches pleines à l'approche de la Descente."""
    if cible <= 0:
        return 0
    if visites >= cible - 1:
        return 3
    if visites >= -(-cible * 2 // 3):
        return 2
    if visites >= -(-cible // 3):
        return 1
    return 0


def entree_douce(morts: int) -> int:
    """Miroir d'`entrySoftening` (player-memory) : le seuil est abaissé les
    toutes premières morts d'un compte, sans aucun affichage."""
    if morts <= 0:
        return 2
    if morts <= 2:
        return 1
    return 0
MOTS = {
    "destin": "DESTIN", "eclatante": "RÉUSSITE ÉCLATANTE", "reussite": "RÉUSSITE",
    "justesse": "DE JUSTESSE", "echec": "ÉCHEC", "critique": "FUNESTE",
    "malediction": "MALÉDICTION",
}
# Les paliers intermédiaires réutilisent les quatre textes écrits : c'est le
# verdict qui porte la nuance, pas une cinquième prose (règle du jeu, 13/07).
PROSE = {
    "destin": "critique", "eclatante": "reussite", "reussite": "reussite",
    "justesse": "reussite", "echec": "echec", "critique": "echec",
    "malediction": "funeste",
}


def kit() -> dict:
    if KIT is None:
        sortir("run-kit.json introuvable : il doit être à côté de ce script.")
    return json.loads(KIT.read_text(encoding="utf-8"))


def sortir(msg: str) -> None:
    print(msg)
    sys.exit(1)


# ── rendu ────────────────────────────────────────────────────────────────────

def barre(sante: float) -> str:
    """Le cadre s'effrite quand la santé baisse : le jeu n'affiche jamais de
    barre de vie ni de chiffre, l'état se lit à l'usure de l'interface."""
    if sante > 0.75:
        return "─" * LARGEUR
    if sante > 0.5:
        return ("─" * 6 + "╌") * (LARGEUR // 7)
    if sante > 0.25:
        return ("─╌" * (LARGEUR // 2))
    return ("╌ " * (LARGEUR // 2)).rstrip()


def para(t: str, marge: str = "") -> str:
    return "\n".join(textwrap.fill(l, LARGEUR - len(marge), initial_indent=marge,
                                   subsequent_indent=marge) for l in t.split("\n"))


def anneau(seuil: int, mod: int) -> str:
    """L'anneau du dé : vingt encoches, pleines pour les faces qui réussissent.
    C'est la seule information de probabilité que le jeu donne — et il la
    donne bien ainsi, en encoches, jamais en pourcentage."""
    m = ""
    for f in range(1, 21):
        if f == 20:
            m += "◆"
        elif f == 1:
            m += "·"
        else:
            m += "◆" if (f + mod) >= seuil else "·"
    return m


# ── moteur ───────────────────────────────────────────────────────────────────

class Partie:
    def __init__(self, d: dict):
        self.d = d
        self.k = kit()
        # Une partie d'avant le 06/09 n'a pas de profil : elle en prend un
        # neuf. ⚠️ On n'INVENTE plus de stats — pas de stats veut dire « le
        # Geôlier n'a pas encore assez vu », et c'est un état légitime.
        self.d.setdefault("profil", profil_neuf())

    # -- création
    @classmethod
    def neuve(cls, graine: int | None = None, nom: str | None = None) -> "Partie":
        k = kit()
        g = graine if graine is not None else random.randrange(10**9)
        rng = random.Random(g)
        noms = ["Cendre", "Le Muet", "Sans-Nom", "Corbeau", "Le Tardif", "Braise",
                "L'Onzième", "Suie"]
        d = {
            "graine": g, "nom": nom or rng.choice(noms), "jour": 1, "sante": 1.0,
            "pas": 0, "phase": "scene", "scene": k["entree"], "visites": [],
            "cible": 7 + rng.randrange(2), "options": None, "soupcon": 0,
            "etats": {}, "besace": [], "poiVus": [], "geolierVus": [],
            "ambiancesVues": [], "poiOuvert": False, "morte": False, "famVus": [],
            "soupconVu": 0, "routeAFermer": False, "menace": None,
            "lignesOuvertes": 0,
            "des": [], "journal": [], "sortie": None, "hameauEntree": False,
            "hameauSorti": False, "procesVu": False, "savoirs": [],
            # ⚠️ AUCUNE STAT AU DÉPART (V2 du prologue, 06/09). Elles pèsent
            # sur le dé (`stat − 3`) et décident quelle VARIANTE de choix
            # existe (`exigeDominante`) — mais elles n'existent qu'à partir de
            # la RÉVÉLATION. Avant : modificateur 0, aucune variante de
            # dominante, exactement comme le jeu.
            "stats": None,
            "profil": profil_neuf(),
        }
        p = cls(d)
        p.entrer(k["entree"], premier=True)
        # LE SCEAU SE PORTE À MÊME LA MAIN : la marque rapportée de la vie
        # d'avant se lit dès la Borne, avant tout choix.
        n = lire_compte().get("sceau", 0)
        ouv = k.get("sceau", {}).get("ouverture", [])
        if n > 0 and ouv:
            p.dit(ouv[min(n, len(ouv)) - 1], "narration")
        # LA TRANSFORMATION DU 3e PASSAGE : le Geôlier constate, une seule fois,
        # qu'il n'a plus rien à compter. Il est le seul à voir les chiffres —
        # donc le seul à pouvoir dire qu'un chiffre a cessé d'en être un.
        geo = k.get("sceau", {}).get("geolier", [])
        if n == 3 and geo:
            p.dit(geo[0], "geolier")
        return p

    # -- accès
    def scene(self, sid: str | None = None) -> dict:
        """La scène EFFECTIVE : une variante peut se jouer à sa place.

        ⚠️ La réplique jouait toujours l'originale, donc sept scènes entières
        n'existaient pas dans le kit — le Veilleur demandait au lieu de noter,
        la Fille n'était jamais au Moulin. Un relecteur en concluait que ces
        contenus n'existent pas (le biais du 9/08). Mêmes conditions que le
        jeu : une découverte de compte (`has`) ou un compteur (`gte`), la
        première variante satisfaite l'emporte.
        """
        sid = sid or self.d["scene"]
        for s in self.k["scenes"].values():
            r = s.get("remplace")
            if not r or r.get("scene") != sid:
                continue
            si = r.get("si") or {}
            if "has" in si:
                if si["has"] in lire_compte().get("decouvertes", []):
                    return s
            elif "id" in si and self.compteur(si["id"]) >= si.get("gte", 1):
                return s
        return self.k["scenes"][sid]

    def compteur(self, nom: str) -> int:
        """Les compteurs qu'une condition de variante sait lire."""
        if nom == "soupcon":
            return int(self.d.get("soupcon", 0))
        if nom == "c.fille":
            # Le compteur dérivé des découvertes sur la Fille (jeu : tenu à la
            # source pour ne pas diverger de la liste).
            dec = lire_compte().get("decouvertes", [])
            return sum(1 for x in dec if "fille" in x or "temoin" in x)
        return 0

    def rng(self, sel: str = "") -> random.Random:
        """Graine reproductible. `sel` distingue deux tirages d'un même écran :
        sans lui, deux choix risqués proposés côte à côte sortiraient le même
        chiffre — ce qui rendrait le dé devinable."""
        s = self.d["graine"] * 7919 + self.d["pas"] * 104729
        for ch in sel:
            s = s * 131 + ord(ch)
        return random.Random(s)

    def nomDuLieu(self, s: dict) -> str:
        """Le nom du LIEU, pas celui de la scène : les scènes « -2 » portent un
        libellé de production (« Campement 2 — beat 2 ») qui n'est pas du jeu."""
        lieu = s.get("lieu")
        if lieu:
            nom = self.k.get("lieux", {}).get(lieu)
            if nom:
                return nom
            for autre in self.k["scenes"].values():
                if autre.get("lieu") == lieu and autre.get("nom") and "beat" not in autre["nom"]:
                    return autre["nom"]
        nom = s.get("nom") or ""
        return "" if "beat" in nom else nom

    def dit(self, texte: str, style: str = "") -> None:
        self.d["journal"].append({"style": style, "texte": texte})

    def ambiance_de_marche(self, r, dans_village: bool, origine: str = "") -> str:
        """Le texte de marche — et c'est là que vit L'ÉCHELLE DU SOUPÇON.

        ⚠️ La réplique ne tirait que dans le FOND : les treize barreaux de
        l'escalade sociale n'existaient pas dans le kit, donc un relecteur
        pouvait jouer deux vies sans jamais voir le système qu'on lui demandait
        de juger. Même règle que le jeu (`pickLiaisonAmbiance`) :
          1. éligibles (provenance, Soupçon, santé, jamais déjà servi) ;
          2. la SPÉCIFICITÉ maximale ;
          3. puis LE BARREAU LE PLUS HAUT atteint — sans ce dernier tri, tous
             les barreaux sont à égalité et le monde sert du bruit au lieu
             d'une progression (c'était le défaut corrigé le 14/08) ;
          4. tirage seedé parmi ce qui reste.
        """
        soup = int(self.d.get("soupcon", 0))
        sante = float(self.d.get("sante", 1.0))
        vues = self.d["ambiancesVues"]
        elig = []
        for v in self.k.get("variantesMarche", []):
            t, c = v.get("texte", ""), v.get("conditions", {})
            if not t or t in vues:
                continue
            frm = c.get("from")
            if frm:
                # `HAMEAU_INTERIOR` est exporté comme une constante nommée.
                dedans = "HAMEAU_INTERIOR" in frm
                if dedans:
                    if not dans_village:
                        continue
                else:
                    # ⚠️ UNE PROVENANCE NOMMÉE EST UNE LISTE DE LIEUX, pas un
                    # simple « hors village » (verdict du 15/08, point B) : la
                    # réplique servait « Tu laisses le combat derrière toi »
                    # au départ de la Borne, et les cordes de la Chapelle au
                    # départ du Moulin. Le jeu, lui, teste `from.includes(a)`.
                    # Sans origine connue (ouverture), on n'invente pas : on
                    # écarte toute variante à provenance nommée.
                    if not origine or origine not in frm:
                        continue
            # `dehors` (02/09) : pleine lande seulement, jamais depuis une rue.
            if c.get("dehors") and dans_village:
                continue
            if "minSoupcon" in c and soup < c["minSoupcon"]:
                continue
            if "maxSoupcon" in c and soup > c["maxSoupcon"]:
                continue
            if "maxHealth" in c and sante > c["maxHealth"]:
                continue
            # Les axes que la réplique ne porte pas (chapitre, objet porté,
            # serment, Fille) : on écarte plutôt que de servir à tort.
            if any(x in c for x in ("chapter", "carrying", "serment", "minFille", "to")):
                continue
            elig.append((v, c))
        if elig:
            # ⚠️ La spécificité du JEU compte un AXE, pas un champ : `minSoupcon`
            # et `maxSoupcon` valent UN point à eux deux. Les compter séparément
            # ferait gagner une variante bornée des deux côtés contre une plus
            # pertinente — la réplique aurait servi une autre échelle que le jeu.
            def spec_de(c):
                n = 0
                if "from" in c:
                    n += 1
                if "minSoupcon" in c or "maxSoupcon" in c:
                    n += 1
                if "maxHealth" in c:
                    n += 1
                return n
            spec = max(spec_de(c) for _, c in elig)
            top = [(v, c) for v, c in elig if spec_de(c) == spec]
            haut = max(c.get("minSoupcon", 0) for _, c in top)
            sommet = [(v, c) for v, c in top if c.get("minSoupcon", 0) == haut] or top
            amb = r.choice(sommet)[0]["texte"]
        else:
            fond = list(self.k["ambiances"]) + (
                [] if dans_village else list(self.k["ambiancesLande"]))
            frais = [t for t in fond if t not in vues] or fond
            amb = r.choice(frais)
        return amb

    # -- ouverture d'un écran
    def entrer(self, sid: str, premier: bool = False, orientation: bool = False) -> None:
        # ⚠️ `self.scene(sid)` et non l'accès direct : sinon la variante ne se
        # joue jamais (elle est résolue ici, une fois, à l'ouverture).
        s = self.scene(sid)
        self.d["scene"] = sid
        self.d["poiOuvert"] = False
        self.d["pas"] += 1
        if orientation:
            appr = self.k["approcheNarration"].get(sid)
            if appr:
                self.dit(appr, "approche")
            radical = sid.replace("-2", "")
            if radical not in self.d["visites"]:
                self.d["visites"].append(radical)
            # Le COMPTE, lui, se souvient d'une vie à l'autre.
            c = lire_compte()
            c["visites"][radical] = c["visites"].get(radical, 0) + 1
            ecrire_compte(c)
            # LE JOUR SE GAGNE (correction Patrick 10/08) : il avance tous
            # les trois lieux OÙ L'ON A TENTÉ QUELQUE CHOSE. La version d'avant
            # faisait PAYER un jour au joueur qui ne risquait rien — à
            # l'envers, le Jour étant le score du Grand Registre.
            if self.d.get("engageIci", False):
                self.d["lieuxEngages"] = self.d.get("lieuxEngages", 0) + 1
                if self.d["lieuxEngages"] % 3 == 0:
                    self.d["jour"] += 1
                    self.dit(f"JOUR {self.d['jour']}", "jour")
                # Payé quelque part : l'ardoise repart de zéro.
                self.d["lignesOuvertes"] = 0
            else:
                # ═══ LE KARMA DU PRUDENT (11/09) — miroir de `lieuxEngages`.
                # Quitter un lieu sans y avoir rien engagé laisse une ligne
                # ouverte ; à trois d'affilée, le Domaine envoie le Recousu
                # solder le compte. Sans ce bloc, un relecteur du kit mesurerait
                # un prudent que rien ne vient jamais chercher — le biais
                # corrigé huit fois depuis le 9/08.
                self.d["lignesOuvertes"] = self.d.get("lignesOuvertes", 0) + 1
                # La comptabilité PASSE DEVANT un contournement (voir le
                # commentaire du même bloc dans Scene.tsx) : sinon le créneau
                # est pris par la Bête dans presque toutes les vies prudentes.
                if (self.d["lignesOuvertes"] >= LIGNES_AVANT_RECOUSU
                        and (self.d.get("menace") or {}).get("id") != "recousu"):
                    self.d["menace"] = {"id": "recousu",
                                        "poseeA": len(self.d["visites"]), "traces": 0}
            self.d["engageIci"] = False
            self.d["poiIci"] = 0
            if sid in self.k["hameauInterieur"] or sid.startswith("hameau-") or sid == "serment-hameau":
                self.d["hameauEntree"] = True
            # LE MONDE RECONNAÎT LA MARQUE : une ligne à l'arrivée, sur les
            # lieux où quelqu'un est là pour la voir.
            nSceau = lire_compte().get("sceau", 0)
            if nSceau > 0:
                sc = self.k.get("sceau", {})
                # Au-delà de deux traversées, le monde ne regarde plus la main :
                # ces lignes REMPLACENT la reconnaissance, elles ne s'ajoutent pas
                # (le budget d'un seul rappel par arrivée vaut aussi pour elles).
                rec = (sc.get("transforme", {}).get(radical) if nSceau >= 3 else None) \
                    or sc.get("reconnu", {}).get(radical)
                if rec:
                    self.dit(rec, "narration")
        if sid == "la-descente":
            self.cloturer_traversee()
        if s.get("savoir") and s["savoir"] not in self.d.get("savoirs", []):
            self.d.setdefault("savoirs", []).append(s["savoir"])
        if s.get("decouverte"):
            cp = lire_compte()
            if s["decouverte"] not in cp.setdefault("decouvertes", []):
                cp["decouvertes"].append(s["decouverte"])
                ecrire_compte(cp)
        if s.get("combat"):
            self.dit("• RENCONTRE • " + (s.get("adversaireNom") or s.get("nom") or ""), "rencontre")
        # L'AIGUILLAGE (9/08) : la scène chaînée lit le dé qui l'a précédée.
        # `dernierRate` est posé à la résolution ; on le CONSOMME ici pour que
        # l'écran suivant (une liaison, une arrivée) reparte à neuf.
        rate = self.d.pop("dernierRate", False)
        # LA STRATE DE FAMILIARITÉ : une ligne de plus à partir du 2e passage
        # du COMPTE par ce lieu, une autre à partir du 4e. Le héros ne se
        # souvient de rien — c'est le monde qui porte la trace.
        #
        # Calculée AVANT la narration : elle peut REMPLACER un paragraphe
        # (`remplace`) au lieu de s'y ajouter, et ne se joue que sur SON écran
        # (`sur`). Une ligne de mémoire écrite comme un remplacement et
        # injectée comme un ajout est le défaut le plus rapporté du 10/08.
        lieu = sid.replace("-2", "")
        fam = self.k.get("familiarite", {}).get(lieu)
        if fam and (fam.get("sur") or lieu) != sid:
            fam = None
        ligne = None
        if fam and lieu not in self.d.get("famVus", []):
            n = lire_compte()["visites"].get(lieu, 0)
            ligne = fam.get("4") if n >= 4 and fam.get("4") else (fam.get("2") if n >= 2 else None)
            if ligne:
                self.d.setdefault("famVus", []).append(lieu)
        remplace = fam.get("remplace") if (fam and ligne) else None
        paras = list(s.get("narrationEchec") if rate and s.get("narrationEchec") else s.get("narration", []))
        # 03/09 — l'arrivée ratée se dit aux choix aussi (voir `exigeEchecArrivee`).
        self.d["arriveeRatee"] = bool(rate and s.get("narrationEchec"))
        # CE QU'ON APPORTE AU PROCÈS SE DIT (comme dans le jeu, après le premier
        # paragraphe). ⚠️ La réplique baissait le seuil en silence : elle
        # récompensait la préparation sans jamais la RACONTER, donc le procès
        # paraissait subi alors que le jeu, lui, dit ce que ta trajectoire a
        # déposé dans la salle. Un bénéfice que rien ne raconte n'existe pas.
        if s.get("procesFixation"):
            lignes = self.k.get("apportsProces", {})
            paras[1:1] = [lignes[c] for c in self.apports_proces() if c in lignes]
        if remplace is not None and remplace < len(paras):
            paras[remplace] = ligne
            ligne = None
        for p in paras:
            self.dit(p, "narration")
        if ligne:
            self.dit(ligne, "narration")
        # L'AUBE VIENT QU'ON AIT DORMI OU VEILLÉ (10/08) : une scène de nuit
        # avance le Jour une fois, quel que soit le choix. Mesuré sur 64 vies :
        # « Dormir » donnait +1 Jour et « Veiller » rien — le choix sûr battait
        # le choix risqué sur l'écran même qui pose la question.
        # `sansNuit` : le choix pris à l'écran précédent disait qu'on ne
        # s'attardait pas — aucune nuit ne passe (voir `Choice.sansNuit`).
        # ⚠️ 03/09 — le Jour de la nuit se prend en QUITTANT la scène de
        # nuit (comme dans le jeu), plus à l'arrivée : « — JOUR 3 — » tombait
        # en bas de l'écran d'entrée du Moulin, AVANT qu'on propose de dormir
        # (trois testeurs). Voir le haut de `entrer`.
        if s.get("registre"):
            self.dit(
                "[Le Grand Registre défile : cent noms classés par lieux "
                "franchis, la première ligne grattée jusqu'à la pierre. Ta ligne "
                "s'y inscrit, quelque part dans le bas du livre.]",
                "narration",
            )
        # ⚠️ LE COMMENTAIRE AMBIANT DU GEÔLIER EST RETIRÉ (arbitrage du
        # 12/08) : sur les 24 prises de parole des quatre vies enregistrées,
        # 3 seulement étaient ce tirage à 12 % sur une arrivée ordinaire.
        # Il reste événementiel — palier de Soupçon, jet critique, traversée
        # sans risque. La réplique doit dire la même chose que le jeu, sinon
        # une IA testeuse juge une version périmée.

    def soupconSeLit(self) -> None:
        """Un palier franchi se voit TOUJOURS — dehors comme dedans (vague 5).

        Le Soupçon monte sur des actes commis en pleine lande, et les cinq
        manifestations écrites mettent des villageois en scène : servies
        dehors, elles téléportaient le village. La craie est la piste de
        rechange — une marque, personne. Sans elle, le joueur découvrait sa
        jauge au moment du procès.
        """
        n = min(5, self.d["soupcon"])
        if n <= self.d.get("soupconVu", 0):
            return
        self.d["soupconVu"] = n
        dedans = self.d["scene"] in self.k["hameauInterieur"]
        pool = self.k.get("soupconPaliers" if dedans else "soupconCraie", {})
        ligne = pool.get(str(n))
        if ligne:
            self.dit(ligne, "narration")
        mot = self.k.get("soupconGeolier", {}).get(str(n))
        if mot:
            self.dit(mot, "geolier")

    def geolierSurJet(self, naturel: int) -> None:
        if naturel not in (1, 20):
            return
        cle = "critFail" if naturel == 1 else "critSuccess"
        pool = self.k["geolier"]["amuse"][cle]
        frais = [t for t in pool if t not in self.d["geolierVus"]] or pool
        g = self.rng("geolier").choice(frais)
        self.d["geolierVus"].append(g)
        self.dit(g.replace("{n}", str(naturel)), "geolier")

    # -- la sortie du village (24/08) : une transition JOUÉE, miroir du jeu.
    # Depuis une rue, la Croisée n'offre jamais un lieu de lande : elle offre
    # le portillon, et le franchir sert CET écran — la couture du
    # franchissement d'abord, PUIS deux directions de lande avec leurs
    # indices. Sortir, ensuite choisir : dans cet ordre.
    def sortie_hameau(self) -> None:
        self.d["hameauSorti"] = True
        r = self.rng()
        libres = [x for x in self.k["pool"] if x not in self.d["visites"]
                  and x != "serment-hameau" and x not in self.k["hameauInterieur"]]
        # LE RECOUSU T'ATTEND AU BOUT (11/09) — miroir du jeu : passé la
        # cible il n'y a plus de Croisée, donc un compte ouvert tard n'avait
        # plus nulle part où se solder. Il se tient sur la route qui sort.
        m0 = self.d.get("menace") or {}
        if (len(self.d["visites"]) >= self.d["cible"] and m0.get("id") == "recousu"
                and m0.get("traces", 0) >= 1
                and "menace-retour-recousu" in self.k["scenes"]):
            self.d["menace"] = None
            self.d["lignesOuvertes"] = 0
            self.d["options"] = None
            self.d["phase"] = "scene"
            self.entrer("menace-retour-recousu")
            return
        if len(libres) < 2 or len(self.d["visites"]) >= self.d["cible"]:
            self.d["phase"] = "scene"
            if "palissade-sud" in self.k["scenes"] and "palissade-sud" not in self.d["visites"]:
                self.entrer("palissade-sud", orientation=True)
            else:
                self.entrer("la-descente")
            return
        opts = r.sample(libres, 2)
        ferme = self.d.pop("routeAFermer", False)
        if ferme:
            opts = opts[:1]
        self.d["phase"] = "liaison"
        self.d["options"] = opts
        self.d["pas"] += 1
        self.d["poiOuvert"] = False
        cout = self.k.get("franchitSortie") or []
        self.dit(cout[self.d["pas"] % len(cout)] if cout else
                 "Tu repasses la limite du village. La lande reprend.", "narration")
        if ferme and self.k.get("routeFermee"):
            pool = self.k["routeFermee"]
            if isinstance(pool, dict):  # 03/09 : un tableau par cause
                pool = pool.get(self.d.get("routeFermeeCause") or "echec") or sum(pool.values(), [])
            self.dit(r.choice(pool), "narration")
        else:
            ia = self.k["indiceRoute"].get(opts[0], "")
            ib = self.k["indiceRoute"].get(opts[1], "") if len(opts) > 1 else ""
            if ia and ib:
                self.dit(f"D'un côté, {ia}. De l'autre, {ib}.", "narration")

    # -- liaison
    def revelation(self) -> None:
        """« ÇA Y EST. JE COMMENCE À TE VOIR. »

        ⚠️ Le déclencheur n'est PAS un compteur (§7 du brief) : il croise assez
        de décisions révélatrices, assez d'évidence — qui pèse la DIVERSITÉ
        autant que la quantité — et un moment sûr. Le moment sûr est la
        MARCHE : la seule transition sans adversaire ni décision suspendue.
        """
        p = self.d.setdefault("profil", profil_neuf())
        if p["revele"] or p["n"] < DECISIONS_MINIMUM or evidence(p) < SEUIL_EVIDENCE:
            return
        st = stats_depuis_tendances(p)
        self.dit("Attends.", "geolier")
        m = lire_compte()
        passes = m.get("profils", [])
        if not passes:
            self.dit("Ça y est. Je commence à te voir.", "geolier")
        else:
            d = sum(abs(st[a] - passes[-1].get(a, 3)) for a in AXES)
            if len(passes) == 1:
                self.dit("Les mêmes réflexes. Intéressant." if d <= 3
                         else "Non. Tu n'es pas comme le précédent.", "geolier")
            elif all(sum(abs(st[a] - q.get(a, 3)) for a in AXES) <= 4 for q in passes):
                self.dit("Toujours pareil. Peu importe le visage.", "geolier")
            else:
                self.dit(f"{len(passes) + 1} vies. Et tu changes encore.", "geolier")
        for ligne in portrait(st, p).split("\n"):
            self.dit(ligne, "narration")
        self.dit("Continue. J'ai peut-être tort.", "geolier")
        self.d["stats"] = st
        p["revele"] = True
        m.setdefault("profils", []).append(st)
        ecrire_compte(m)

    def liaison(self) -> None:
        self.revelation()
        # LE PROCÈS (comme le vrai moteur) : Soupçon au comble → la traversée
        # est DÉROUTÉE, on vient te chercher. Sans ça, la réplique laissait le
        # Soupçon monter sans conséquence et faussait tout jugement du coût
        # social (panel 9/08).
        if self.d["soupcon"] >= 6 and not self.d.get("procesVu") and "proces-du-heros" in self.k["scenes"]:
            self.d["procesVu"] = True
            self.d["phase"] = "scene"
            self.entrer("proces-du-heros")
            return
        libres = [x for x in self.k["pool"] if x not in self.d["visites"]]
        # L'ENCLAVE À TROIS ÉTATS (12/08, jamais portée à la réplique) + LE
        # PORTILLON (24/08) : pas entré → l'intérieur est fermé ; DEDANS → la
        # Croisée n'offre qu'une rue + le portillon (jamais un lieu de lande
        # depuis une ruelle — le Pendu Mal Fixé « à deux pas du Puits » venait
        # de là) ; SORTI → ni la porte ni les rues ne reviennent.
        rad0 = re.sub(r"-\d+$", "", self.d["scene"])
        dans_vill = (rad0 in self.k["hameauInterieur"] or rad0.startswith("hameau-")
                     or rad0 in ("serment-hameau", "femme-seuil", "gamin-murets"))
        dedans = (self.d.get("hameauEntree") and not self.d.get("hameauSorti")
                  and dans_vill)
        if not self.d["hameauEntree"]:
            libres = [x for x in libres if x not in self.k["hameauInterieur"]]
        elif not dedans:
            libres = [x for x in libres if x != "serment-hameau"
                      and x not in self.k["hameauInterieur"]]
        else:
            libres = [x for x in libres if x != "serment-hameau"]
        # LE RECOUSU T'ATTEND AU BOUT (11/09) — miroir du jeu : passé la
        # cible il n'y a plus de Croisée, donc un compte ouvert tard n'avait
        # plus nulle part où se solder. Il se tient sur la route qui sort.
        m0 = self.d.get("menace") or {}
        if (len(self.d["visites"]) >= self.d["cible"] and m0.get("id") == "recousu"
                and m0.get("traces", 0) >= 1
                and "menace-retour-recousu" in self.k["scenes"]):
            self.d["menace"] = None
            self.d["lignesOuvertes"] = 0
            self.d["options"] = None
            self.d["phase"] = "scene"
            self.entrer("menace-retour-recousu")
            return
        if len(libres) < 2 or len(self.d["visites"]) >= self.d["cible"]:
            # Fin de traversée : par la PALISSADE, jamais direct à la Descente
            # (le raccourci « coupait la scène » — grief unanime du panel 9/08,
            # qui était un artefact de CETTE réplique, pas du jeu).
            self.d["phase"] = "scene"
            # ⚠️ LA HALTE AU HAMEAU MANQUAIT ENTIÈREMENT (14/08). Le jeu, en
            # fin de traversée, fait d'abord faire HALTE au village à qui y est
            # entré : cinq beats, la nuit, la grange, le repos — c'est le toit
            # que le Serment promet. La réplique sautait droit à la sortie.
            # Six testeurs sur huit ont donc rapporté « aucun repos n'existe »,
            # « le toit juré n'arrive jamais », « Entrer dans le hameau
            # m'envoie à la Palissade Sud ». Tout le contenu de la halte était
            # invisible. Variante `dehors` si le Serment a été refusé : aucune
            # porte ne s'ouvre à qui n'a pas juré.
            if self.d.get("hameauEntree") and not self.d.get("halteFaite"):
                dehors = self.d.get("serment") == "refuse"
                cible = "hameau-halte-dehors" if dehors else "hameau-halte-1"
                if cible in self.k["scenes"]:
                    self.entrer(cible)
                    return
            if "palissade-sud" in self.k["scenes"] and "palissade-sud" not in self.d["visites"]:
                self.entrer("palissade-sud", orientation=True)
            else:
                self.entrer("la-descente")
            return
        if dedans:
            # LA CROISÉE DE RUE (24/08) : une rue inconnue + LE PORTILLON.
            # Plus une rue → la marche suivante EST la sortie (couture + deux
            # directions de lande sur le même écran, cf. sortie_hameau).
            rues = [x for x in libres if x in self.k["hameauInterieur"]]
            if not rues:
                self.sortie_hameau()
                return
            r = self.rng()
            self.d["phase"] = "liaison"
            self.d["options"] = [r.choice(rues), "sortie-hameau"]
            self.d["pas"] += 1
            self.d["poiOuvert"] = False
            amb = self.ambiance_de_marche(r, True, rad0)
            self.d["ambiancesVues"].append(amb)
            self.dit(amb, "narration")
            ia = self.k["indiceRoute"].get(self.d["options"][0], "")
            ib = self.k["indiceRoute"].get(self.d["options"][1], "")
            if ia and ib:
                self.dit(f"D'un côté, {ia}. De l'autre, {ib}.", "narration")
            return
        r = self.rng()
        # ═══ LE RETOUR DE LA MENACE (17/08 §2-4) — miroir du jeu. Une menace
        # contournée revient UNE fois, en déroutage de marche, hors du
        # village, à ≥ 2 lieux de sa pose (les traces ont eu le temps de se
        # lire). Elle se consomme au retour, gagné ou perdu.
        men = self.d.get("menace")
        rad0 = re.sub(r"-\d+$", "", self.d["scene"])
        en_lande = not (
            rad0 in self.k["hameauInterieur"]
            or rad0.startswith("hameau-")
            or rad0 in ("serment-hameau", "femme-seuil", "gamin-murets")
        )
        # LE RECOUSU EST CERTAIN une fois ses deux traces lues (11/09) : ce
        # n'est pas une malchance évitable, c'est un compte qui se solde.
        est_recousu = (men or {}).get("id") == "recousu"
        # Une trace lue suffit (la causalité se lit avant la conséquence) et un
        # seul lieu de distance : son armement a déjà pris trois lieux.
        assez = (men["traces"] >= 1) if (men and est_recousu) else (r.random() < 0.45)
        if (men and en_lande
                and len(self.d["visites"]) - men["poseeA"] >= (1 if est_recousu else 2)
                and assez
                and "menace-retour-" + men["id"] in self.k["scenes"]):
            self.d["menace"] = None
            # Le compte est soldé par la rencontre : sans ça, il se réarmerait
            # à la Croisée suivante et l'avertissement deviendrait du harcèlement.
            self.d["lignesOuvertes"] = 0
            self.d["options"] = None
            self.entrer("menace-retour-" + men["id"])
            return
        opts = r.sample(libres, 2)
        # UN ÉCHEC DUR DÉPENSE QUELQUE CHOSE DU MONDE (vague 5) : hors séjour
        # il n'y avait pas d'option à retirer, alors la Croisée se resserre.
        ferme = self.d.pop("routeAFermer", False)
        if ferme:
            opts = opts[:1]
        self.d["phase"] = "liaison"
        self.d["options"] = opts
        self.d["pas"] += 1
        self.d["poiOuvert"] = False
        # ⚠️ Le test du village doit être celui du JEU, pas une version
        # étroite : la séquence d'entrée (`hameau-…`) et le Seuil comptent
        # comme village. Sans ça, sortir de « Entrer dans le hameau » servait
        # une ambiance de pleine lande — « Tu marches. La lande ne finit
        # pas. » — juste après avoir franchi la porte du village. Vu dans
        # cinq vies sur cinq par un testeur du panel du 10/08, qui a cessé
        # de croire ses choix à cet endroit précis.
        radical = re.sub(r"-\d+$", "", self.d["scene"])
        dans_village = (
            radical in self.k["hameauInterieur"]
            or radical.startswith("hameau-")
            or radical in ("serment-hameau", "femme-seuil", "gamin-murets")
        )
        # L'origine est le RADICAL du lieu qu'on quitte : `pickLiaisonAmbiance`
        # la reçoit normalisée dans le jeu (le suffixe -2 d'un écran-événement
        # n'est pas un autre lieu).
        amb = self.ambiance_de_marche(r, dans_village, radical)
        self.d["ambiancesVues"].append(amb)
        self.dit(amb, "narration")
        # LES TRACES DE LA MENACE (17/08) : la première tombe TOUJOURS avant
        # tout retour possible — la causalité se lit avant la conséquence.
        traces = self.k.get("tracesMenace", {}).get((men or {}).get("id"), [])
        if men and en_lande and men["traces"] < len(traces):
            self.dit(traces[men["traces"]], "narration")
            men["traces"] += 1
        if ferme and self.k.get("routeFermee"):
            pool = self.k["routeFermee"]
            if isinstance(pool, dict):  # 03/09 : un tableau par cause
                pool = pool.get(self.d.get("routeFermeeCause") or "echec") or sum(pool.values(), [])
            self.dit(r.choice(pool), "narration")
        else:
            # LA CROISÉE FIDÈLE (17/08). La réplique tirait ici une
            # bifurcation AU HASARD à chaque Croisée — or le vrai jeu sert
            # « D'un côté, X. De l'autre, Y. » (les indices des deux routes,
            # couverts 18/18) et ne retombe sur le pool de bifurcations que
            # si un indice MANQUE, c'est-à-dire jamais en pratique. Résultat
            # mesuré par le panel de 20 : « Une pierre plantée marque la
            # fourche » servie 43 fois dans 60 vies, 19 agents sur 20 — un
            # grief entier fabriqué par l'infidélité de la table. Un panel
            # teste d'abord l'outil qu'on lui donne.
            opts = self.d.get("options") or []
            ia = self.k["indiceRoute"].get(opts[0], "") if len(opts) > 0 else ""
            ib = self.k["indiceRoute"].get(opts[1], "") if len(opts) > 1 else ""
            if ia and ib:
                routes = f"D'un côté, {ia}. De l'autre, {ib}."
                premiere = len(self.d.get("ambiancesVues") or []) <= 1
                self.dit(("Deux directions s'ouvrent. " + routes) if premiere else routes,
                         "narration")
            else:
                self.dit(r.choice(self.k["bifurcations"]), "narration")
        # Idem en Croisée : plus de commentaire ambiant, il ne parle que sur
        # un événement (voir le retrait ci-dessus).

    # -- les choix offerts par l'écran courant
    def choix(self) -> list[dict]:
        if self.d["phase"] == "liaison":
            return [
                {"kind": "aller", "dest": o,
                 "label": self.k["approche"].get(o, "Vers " + o),
                 "indice": self.k["indiceRoute"].get(o, "")}
                for o in self.d["options"]
            ]
        s = self.scene()
        pois = [p for p in s.get("pointsInteret", []) if p["id"] not in self.d["poiVus"]]
        if self.d["poiOuvert"]:
            return [{"kind": "poi", "poi": p, "label": p["label"]} for p in pois] + [
                {"kind": "fermer", "label": "Ne rien regarder de plus"}]
        out: list[dict] = []
        # ⚠️ 13/08 : les 29 derniers points d'intérêt sont devenus des ACTIONS
        # directes — il n'en reste aucun dans la zone. Le sous-menu ne peut
        # donc plus s'ouvrir sur rien, mais la branche reste : elle servira à
        # la prochaine zone si le procédé y revient.
        if pois:
            out.append({"kind": "ouvrir", "label": "Observer les alentours",
                        "note": f"{len(pois)} chose(s) à regarder"})
        u = s.get("usageObjet")
        if (u and u.get("objet") in self.d.get("besace", [])
                and f"usage:{u.get('cle')}" not in self.d.get("choixFaits", [])):
            out.append({"kind": "usage", "u": u, "label": u.get("label") or "Utiliser"})
        for c in s.get("choix", []):
            if c["type"] == "verrouille":
                continue
            # La réplique ne trace pas le Savoir, les Découvertes ni les états
            # requis : un choix qui en exige est retiré plutôt qu'offert à
            # tort (« fuites de Savoir », grief 4/4 du panel 9/08 — c'était
            # cette réplique ; le vrai jeu filtre avant l'affichage).
            # ⚠️ 14/08 : la réplique SUIT désormais le Savoir et les
            # Découvertes (elle se contentait de retirer ces choix, ce qui
            # rendait « explorer prépare » invisible dans le kit). Les états
            # et les contradictions, eux, ne sont toujours pas répliqués.
            if c.get("exigeEtat") or c.get("exigeContradiction"):
                continue
            if c.get("exigeSavoir") and c["exigeSavoir"] not in self.d.get("savoirs", []):
                continue
            if c.get("exigeDecouverte") and c["exigeDecouverte"] not in lire_compte().get("decouvertes", []):
                continue
            # 24/08 — `miniJeuDemo` : un mini-jeu tactile posé sur ce choix en
            # MODE DÉMO uniquement. La réplique joue le jeu COMPLET, où le
            # champ est inerte : rien à simuler ici, et c'est un choix assumé
            # (un geste tactile n'a pas d'équivalent en réplique textuelle).
            # Si un jour la démo doit être répliquée, le mini-jeu se simule
            # comme un jet à ~70 % de réussite — noté, pas fait.
            # 13/08 : « ce qu'on porte ouvre une porte ». La réplique, elle,
            # SUIT la Besace — le choix est donc offert seulement si l'objet
            # y est vraiment, comme dans le jeu.
            # La Besace de la réplique stocke les CLÉS d'objet telles quelles.
            if c.get("exigeObjet") and c["exigeObjet"] not in self.d.get("besace", []):
                continue
            # LE SCEAU (14/08) : ces conversations n'existent que pour un
            # compte qui a déjà franchi la Descente vivant.
            if c.get("exigeSceau") and lire_compte().get("sceau", 0) <= 0:
                continue
            # L'OBJET QUI TRANSFORME LA SCÈNE (12/08) : portée ÉCRAN, le jeton
            # vit dans `choixFaits`. Sans ce garde, la réplique proposait
            # « Descendre par la corde » à qui n'avait pas amarré de corde
            # (playtest 14/08).
            faits = self.d.get("choixFaits", [])
            # 03/09 — l'arrivée ratée et le Serment vu par le village.
            if c.get("exigeEchecArrivee") and not self.d.get("arriveeRatee"):
                continue
            if c.get("masqueSiEchecArrivee") and self.d.get("arriveeRatee"):
                continue
            es = c.get("exigeSerment")
            if es == "tenu" and self.d.get("sermentRompu"):
                continue
            if es == "rompu" and not self.d.get("sermentRompu"):
                continue
            if c.get("exigeUsage") and f"usage:{c['exigeUsage']}" not in faits:
                continue
            if c.get("masqueSiUsage") and f"usage:{c['masqueSiUsage']}" in faits:
                continue
            # EXPLORER PRÉPARE (14/08) : l'option aveugle disparaît quand la
            # préparation est là. C'est ce qui tient le budget de trois
            # actions — un combat préparé n'en offre pas une de plus, il en
            # offre une AUTRE.
            mq = c.get("masqueSi") or {}
            if mq.get("savoir") and mq["savoir"] in self.d.get("savoirs", []):
                continue
            if mq.get("objet") and mq["objet"] in self.d.get("besace", []):
                continue
            if mq.get("decouverte") and mq["decouverte"] in lire_compte().get("decouvertes", []):
                continue
            # LES VARIANTES DE PROFIL : au plus UNE par écran, celle du héros.
            if c.get("exigeDominante") and c["exigeDominante"] != self.dominante():
                continue
            es = c.get("exigeStat")
            if es and (self.d.get("stats") or {}).get(es["stat"].lower(), 3) < es["min"]:
                continue
            # SÉJOUR : ce qui a déjà été fait ici ne se refait pas.
            # UNE FOIS PAR VIE (01/09) : le demi-tour ne se rejoue pas.
            if c.get("uneFoisParVie") and c["uneFoisParVie"] in self.d.get("uneFois", []):
                continue
            if s.get("sejour") and c["id"] in self.d.get("choixFaits", []):
                continue
            # REMPLACER PAR SÉQUENCE (14/08) : on ne répond pas au jugement
            # d'un pendu avant de l'avoir entendu.
            # ⚠️ `exigeChoixFait` peut être un id OU une liste (01/09) — il
            # suffit alors qu'UN d'entre eux ait été joué sur cet écran.
            ecf = c.get("exigeChoixFait")
            if isinstance(ecf, list):
                if not any(x in faits for x in ecf):
                    continue
            elif ecf and ecf not in faits:
                continue
            out.append({"kind": "choix", "c": c, "label": c["label"]})
        # UNE OPTION CONDITIONNELLE PREND LA PLACE DE L'AVEUGLE (verdict des
        # panels, 14/08). Ordre de déclaration = priorité, et un choix déjà
        # retiré ne retire plus rien — même résolution que Scene.tsx, sinon
        # la réplique afficherait quatre à huit boutons là où le jeu en montre
        # trois, et un relecteur conclurait que le correctif n'a pas été fait.
        pris: set[str] = set()
        for o in out:
            cid = o["c"]["id"]
            if cid in pris:
                continue
            for cible in o["c"].get("prendLaPlaceDe") or []:
                pris.add(cible)
        if pris:
            out = [o for o in out if o["c"]["id"] not in pris]
        return out

    # -- jouer un choix
    def jouer(self, n: int) -> None:
        opts = self.choix()
        if not (1 <= n <= len(opts)):
            sortir(f"Il n'y a pas de choix n° {n} sur cet écran.")
        o = opts[n - 1]
        self.dit(o["label"], "action")

        if o["kind"] == "ouvrir":
            self.d["poiOuvert"] = True
            # ⚠️ Sans cette ligne l'écran suivant est VIDE (aucun beat n'est
            # émis) — dans le vrai jeu, le texte de la scène reste affiché
            # sous les choix. Un écran blanc se lit comme un blocage et se
            # fait signaler comme un bug par les IA testeuses.
            self.dit("Tu t'arrêtes, et tu prends le temps de regarder.", "narration")
            return
        if o["kind"] == "usage":
            # L'OBJET AGIT SUR PLACE (12/08 §2) : il ne fait pas passer le
            # temps, il transforme la scène — la conséquence s'écrit, l'objet
            # est consommé, et les options qu'il ouvre apparaissent ici même.
            u = o["u"]
            self.d.setdefault("choixFaits", []).append(f"usage:{u.get('cle')}")
            if u.get("objet") in self.d.get("besace", []):
                self.d["besace"].remove(u["objet"])
            if u.get("consequence"):
                self.dit(u["consequence"], "narration")
            return
        if o["kind"] == "fermer":
            self.d["poiOuvert"] = False
            return
        if o["kind"] == "poi":
            p = o["poi"]
            self.d["poiVus"].append(p["id"])
            self.d["poiIci"] = self.d.get("poiIci", 0) + 1
            self.d["poiOuvert"] = False
            self.d["pas"] += 1
            self.dit(p["approche"], "narration")
            self.dit(p["examen"], "narration")
            if p.get("soupcon"):
                self.d["soupcon"] = min(6, self.d["soupcon"] + p["soupcon"])
                self.soupconSeLit()
            if p.get("donneObjet"):
                self.gagner(p["donneObjet"])
            if p.get("ouvreSur"):
                self.entrer(p["ouvreSur"])
            return
        if o["kind"] == "aller":
            # LE PORTILLON (24/08) : pas une destination — la sortie JOUÉE.
            if o["dest"] == "sortie-hameau":
                self.d["options"] = None
                self.sortie_hameau()
                return
            # LA ROUTE DES LOUPS REFUSÉE (17/08 §2) : l'indice annonçait des
            # silhouettes grises — choisir l'autre direction est un vrai
            # contournement, et il ne les efface pas. Une seule menace à la
            # fois ; marcher VERS la meute l'apure (on n'est pas suivi par ce
            # qu'on affronte). Miroir exact de la branche toDest du jeu.
            offert = self.d.get("options") or []
            if ("meute-grise-1" in offert and o["dest"] != "meute-grise-1"
                    and not self.d.get("menace")):
                self.d["menace"] = {"id": "meute",
                                    "poseeA": len(self.d["visites"]), "traces": 0}
            elif (o["dest"] == "meute-grise-1"
                    and (self.d.get("menace") or {}).get("id") == "meute"):
                self.d["menace"] = None
            self.d["phase"] = "scene"
            self.d["options"] = None
            self.entrer(o["dest"], orientation=True)
            return

        c = o["c"]
        # IL TE REGARDE FAIRE (V2 du prologue, 06/09) : le geste est lu à la
        # SÉLECTION, comme le Soupçon — ce qui dit quelque chose de quelqu'un,
        # c'est ce qu'il a DÉCIDÉ, pas ce que le dé en fait ensuite. Silencieux
        # sans exception : rien ne s'affiche.
        geste = lire_le_geste(c, self.k["scenes"].get(self.d["scene"], {}))
        if geste:
            pr = self.d.setdefault("profil", profil_neuf())
            for a in AXES:
                pr["t"][a] += geste.get(a, 0)
            pr["n"] += 1
            # §6 : après la révélation, la forme continue de bouger — sans
            # qu'aucun écran ne le signale.
            if pr["revele"]:
                self.d["stats"] = stats_depuis_tendances(pr)
        if c.get("serment"):
            self.d["serment"] = c["serment"]
        # LE SERMENT SE ROMPT PAR UN GESTE (14/08). Sans ça, la réplique
        # accorderait au procès la défense du Serment à un héros qui a parlé à
        # un pendu — et un relecteur conclurait que jurer n'engage à rien.
        # Seulement si le Serment a DÉJÀ été prêté : la Femme au Seuil se joue
        # avant le muret, on ne rompt pas une promesse qu'on n'a pas faite.
        if c.get("rompLeSerment") and self.d.get("serment"):
            self.d["sermentRompu"] = True
        # LA MENACE LAISSÉE ACTIVE (17/08) : se dérober à un danger ne
        # l'efface pas du monde — au plus UNE à la fois (garde-fou du
        # document). Et CHOIX CERTAIN = PRIX CERTAIN : la sortie sûre qui le
        # déclare referme la Croisée suivante, comme un échec dur.
        if c.get("laisseMenace") and not self.d.get("menace"):
            self.d["menace"] = {"id": c["laisseMenace"],
                                "poseeA": len(self.d["visites"]), "traces": 0}
        if c.get("fermeLaRoute"):
            self.d["routeAFermer"] = True
            # 03/09 : la Croisée fermée nomme sa cause (meute / bete ; l'échec
            # dur laisse la valeur par défaut « echec »).
            self.d["routeFermeeCause"] = c["fermeLaRoute"] if isinstance(c["fermeLaRoute"], str) else "echec"
        # Ce qu'un choix ENSEIGNE se pose à la sélection (comme le Soupçon) :
        # poser la question vaut lire une trace.
        if c.get("donneSavoir"):
            self.d.setdefault("savoirs", []).append(c["donneSavoir"])
        if c.get("donneDecouverte"):
            cp = lire_compte()
            if c["donneDecouverte"] not in cp.setdefault("decouvertes", []):
                cp["decouvertes"].append(c["donneDecouverte"])
                ecrire_compte(cp)
        if c.get("soupcon"):
            self.d["soupcon"] = min(6, self.d["soupcon"] + c["soupcon"])
            # 03/09 — sur un jet, la marque se LIT après le dé (comme dans le
            # jeu, à l'arrivée suivante) : la conséquence tombait avant l'acte.
            if c["type"] != "risque":
                self.soupconSeLit()
        if c["type"] == "risque":
            self.resoudre(c)
            if not self.d.get("sortie"):
                self.soupconSeLit()
        else:
            if c.get("sansNuit"):
                self.d["sansNuit"] = True
            if c.get("consequence"):
                self.dit(c["consequence"], "narration")
            elif self.scene().get("registre"):
                # Un choix « suite » sans conséquence sur une scène de Registre,
                # c'est LE geste de lire le livre : dans le jeu, la table
                # s'affiche. Sans cette ligne, la réplique rendait un écran
                # vide, lu comme un blocage par un testeur.
                self.dit(
                    "[Tu lis. Cent noms classés par lieux franchis, la "
                    "première ligne grattée jusqu'à la pierre. Ta ligne est "
                    "quelque part dans le bas du livre.]",
                    "narration",
                )
            # LES LIGNES CALCULÉES DE LA BORNE, après la conséquence (l'ordre
            # compte : l'examen POSE la question « qui a gravé côté sud ? »,
            # la marque du prédécesseur et le Sceau y RÉPONDENT).
            if c.get("borneSud"):
                for ligne in self.borne_sud():
                    self.dit(ligne, "narration")
            if c.get("donneObjet"):
                self.gagner(c["donneObjet"])
            # L'OBJET RESTE SUR PLACE (Falaise 24/08) : miroir de
            # `Choice.laisseObjet` — une instance quitte la besace, le prix
            # est dit par la conséquence du choix.
            if c.get("laisseObjet") and c["laisseObjet"] in self.d.get("besace", []):
                self.d["besace"].remove(c["laisseObjet"])
            if c.get("repos"):
                # 03/09 — la nuit se raconte (trois testeurs : « Dormir » ne
                # fait rien lire).
                self.dit("Tu dors d'un bloc. L'aube est grise au ras des volets, et ton corps répond un peu mieux qu'hier.", "narration")
                # ⚠️ LE JOUR DE LA NUIT EST DÉJÀ PRIS À L'AFFICHAGE de la
                # scène `nuit` (voir plus haut) — le rajouter ici donnait
                # DEUX jours au dormeur contre un au veilleur, soit
                # exactement l'asymétrie que le correctif du 10/08 supprime
                # dans le jeu réel. Un agent qui mesurait sur la réplique
                # concluait donc « le passif gagne », l'inverse de la vérité.
                # Le repos SOIGNE ; c'est la nuit qui fait le jour.
                # ⚠️ Les TROIS qualités de repos, comme le jeu (11/09) : la
                # réplique servait un +0,15 plat, donc la maison crochetée —
                # le seul soin complet de la démo, et le seul qui se GAGNE sur
                # un jet — ne valait pas plus qu'un muret.
                if c["repos"] == "complet":
                    self.d["sante"] = 1.0
                    self.d["etats"].pop("entaille", None)
                elif c["repos"] == "partiel":
                    self.d["sante"] = min(1.0, self.d["sante"] + 0.15)
                else:
                    self.d["sante"] = min(1.0, self.d["sante"] + 0.08)
            self.suite(c)

    def gagner(self, oid: str) -> None:
        """L'objet est nommé par son NOM, jamais par son identifiant."""
        self.d["besace"].append(oid)
        nom = self.k.get("objets", {}).get(oid) or oid.replace("-", " ")
        self.dit("OBTENU — " + nom, "obtenu")

    def dominante(self) -> str | None:
        """⚠️ None tant que le Geôlier n'a pas dessiné : aucune variante de
        profil ne s'affiche alors, exactement comme en jeu (`dominanteMirror`
        est nul et le filtre écarte la variante)."""
        st = self.d.get("stats") or {}
        return max(st, key=lambda k: st[k]).upper() if st else None

    def modificateur(self, stat: str | None = None) -> int:
        m = 0
        # LA STAT ENGAGÉE (promesse n°1 du 4/08) : échelle 1..5 → −2..+2, jamais
        # affichée — c'est l'Anneau qui le montre. Deux héros n'ont donc pas les
        # mêmes chances sur le même choix.
        if stat:
            m += (self.d.get("stats") or {}).get(stat.lower(), 3) - 3
        for e, tours in self.d["etats"].items():
            if tours <= 0:
                continue
            m += 2 if e == "aguerri" else -2 if e == "entaille" else -1 if e == "ebranle" else 0
        # LA PRÉPARATION (panel 10/08) : ce qu'on a REGARDÉ dans ce lieu ouvre
        # l'Anneau, d'un cran par point d'intérêt, au plus deux. C'est le seul
        # levier par lequel ce que le joueur TENTE change ses chances.
        m += min(2, self.d.get("poiIci", 0))
        # ⚠️ LES OBJETS PORTÉS, absents de la réplique jusqu'au 11/09 — le trou
        # le plus coûteux de tous : quinze passifs sur dix-huit donnent un
        # cran, et un explorateur en porte deux. Toute mesure de létalité
        # jugeait donc un jeu où ramasser ne change rien. Miroir exact de
        # `passiveMod` (besace.ts) : le MEILLEUR applicable, jamais la somme
        # (changé le 11/09 — l'addition rendait la fin de traversée gratuite).
        m += self.mod_passif(combat=bool(
            self.k["scenes"].get(self.d.get("scene") or "", {}).get("combat")))
        return m

    def mod_passif(self, combat: bool) -> int:
        """Le meilleur bonus applicable des objets PORTÉS."""
        table = self.k.get("objetsPassifs", {})
        # La dague de départ est dans TOUTE vie (besace.ts) et vit hors de la
        # table des Landes : la réplique l'a en main comme le jeu.
        best = 1 if combat else 0
        for oid in self.d.get("besace", []):
            o = table.get(oid)
            if not o or not o.get("mod"):
                continue
            if o.get("scope") == "all" or (o.get("scope") == "combat" and combat):
                best = max(best, int(o["mod"]))
        return best

    def apports_proces(self) -> list[str]:
        """Ce qu'on APPORTE au procès, miroir d'`apportsProces` (scene-data).

        ⚠️ Le kit ne le jouait pas du tout : le procès y était un jet à seuil
        fixe, donc un relecteur mesurait « se préparer ne sert à rien » — le
        biais du 9/08, sur la scène qui est justement la vitrine d'« explorer
        prépare ». Aucun chiffre affiché : seul l'Anneau bouge.
        """
        out = []
        # ⚠️ Jamais de borne sur le Soupçon ici : le procès ne se déclenche qu'à
        # 6 et le Soupçon y est plafonné à 6 — une telle borne rendrait cette
        # défense inatteignable par construction (défaut corrigé le 14/08).
        if self.d.get("serment") == "jure" and not self.d.get("sermentRompu"):
            out.append("serment")
        sav = self.d.get("savoirs", [])
        if any("femme" in x for x in sav):
            out.append("alliee")
        noms = self.k.get("objets", {})
        if any(re.search(r"registre|carnet|ordonnance|sceau|d[ée]nonciation",
                         noms.get(oid, oid), re.I)
               for oid in self.d.get("besace", [])):
            out.append("papier")
        if any(re.search(r"bailli|ordonnance|registre", x, re.I) for x in sav):
            out.append("bailli")
        return out[:3]

    def resoudre_geste(self, c: dict) -> None:
        """Miroir de `finirMinigame` (Scene.tsx) pour un geste `horsDemo`.

        Aucun dé n'est tiré : le geste décide. La réussite sert l'issue écrite
        de RÉUSSITE (le jeu la rejoue en conséquence passive) ; l'échec sert le
        texte d'échec dédié, et `echecBlesse` fait payer le corps exactement
        comme en jeu (−0,12 planché à 0,08, ENTAILLÉ persistant).
        """
        stat = (c.get("stat") or "COURAGE").lower()
        val = (self.d.get("stats") or {}).get(stat, 3)
        # Le taux suit la stat comme la tolérance de courbure en jeu : une main
        # sûre tranche net. Bornes lâches — ce n'est pas un jet déguisé.
        taux = min(0.85, max(0.40, 0.45 + 0.12 * (val - 2)))
        ok = self.rng(c["id"] + "|geste").random() < taux
        # ⚠️ 03/09 — STYLE DÉDIÉ, ET C'ÉTAIT UN PLANTAGE. Cette ligne partait
        # sous le style « de », dont le rendu fait `t.split("|")` en trois :
        # une ligne sans barre verticale levait un ValueError et TUAIT la
        # partie au premier geste tactile — le climax de la Falaise et la
        # corde de la Chapelle étaient injouables dans le paquet.
        self.dit("geste " + ("net" if ok else "manqué"), "geste")
        if ok:
            texte = (c.get("issues") or {}).get("reussite") or ""
            texte = texte.split(" ♦")[0].strip()
            self.dit(texte, "narration")
            if c.get("donneObjet"):
                self.gagner(c["donneObjet"])
        else:
            self.dit(c.get("miniJeuEchec") or "Le geste manque.", "narration")
            # L'ÉCHEC EST UN PRIX, JAMAIS UNE PERTE : quand la prose dit que
            # l'objet reste au poignet, il entre bien en besace — et ce qui se
            # paie, c'est le bruit (le Soupçon) et parfois la chair.
            if c.get("miniJeuEchecGardeLoot") and c.get("donneObjet"):
                self.gagner(c["donneObjet"])
            if c.get("miniJeuEchecSoupcon"):
                self.d["soupcon"] = min(6, self.d["soupcon"] + int(c["miniJeuEchecSoupcon"]))
                self.soupconSeLit()
            if c.get("miniJeuEchecBlesse"):
                self.d["sante"] = max(0.08, round(self.d["sante"] - 0.12, 3))
                self.d["etats"]["entaille"] = 999
        # Tenter au doigt reste TENTER : le lieu compte comme engagé.
        self.d["engageIci"] = True
        self.d["dernierRate"] = not ok
        # ⚠️ ET SURTOUT : RENDRE LA MAIN. `resoudre()` finit toujours par
        # `suite()` — le raccourci du geste sortait avant, donc le choix
        # n'était jamais consommé (`choixFaits`) et la scène le reproposait
        # indéfiniment. C'est la boucle « Prendre la corde coupée » signalée
        # le 03/09 : un lieu dont on ne pouvait plus sortir.
        self.suite(c)

    def resoudre(self, c: dict) -> None:
        # ⚠️ 01/09 — LE GESTE REMPLACE LE DÉ (`horsDemo`). Sur ces choix-là le
        # jeu ne lance rien : le doigt tranche ou rate. Lancer un dé ici ferait
        # juger au relecteur une mécanique qui n'existe plus (le biais mesuré
        # six fois depuis le 9/08). On simule donc le geste — pas de suspense
        # jouable en texte, mais le MODÈLE est fidèle : réussite = l'issue
        # écrite de réussite, échec = le texte d'échec dédié + son prix.
        # Le taux suit la stat, comme la tolérance de courbure en jeu.
        # 2/09 : plus de mode démo — un geste posé sur un choix se joue dans
        # TOUTES les vies (le jeu ne gate plus les mini-jeux). Le kit garde
        # `miniJeuHorsDemo` pour les anciens paquets, il n'est plus décisif.
        if c.get("miniJeuDemo"):
            return self.resoudre_geste(c)
        seuil = int(c.get("seuil") or 11)
        sc = self.k["scenes"].get(self.d.get("scene") or "", {})
        if sc.get("procesFixation"):
            seuil = max(2, seuil - len(self.apports_proces()))
        # ⚠️ LES DEUX COURBES INVISIBLES, absentes de la réplique jusqu'au
        # 07/09 : sans elles, une mesure de létalité jugeait une fin de
        # traversée plus molle que le jeu, et un début plus dur.
        seuil = max(
            2,
            seuil
            - entree_douce(lire_compte().get("morts", 0))
            + tension_traversee(len(self.d.get("visites", [])), self.d.get("cible", 0)),
        )
        mod = self.modificateur(c.get("stat"))
        r = self.rng(c["id"])
        naturel = r.randrange(1, 21)
        effectif = naturel + mod
        if naturel == 20:
            palier = "destin"
        elif naturel == 1:
            palier = "malediction"
        else:
            marge = effectif - seuil
            palier = ("eclatante" if marge >= 5 else "reussite" if marge >= 2
                      else "justesse" if marge >= 0 else "echec" if marge > -5 else "critique")
        self.d["des"].append({"pas": self.d["pas"], "stat": c.get("stat"), "seuil": seuil,
                              "naturel": naturel, "palier": palier})
        self.dit(f"anneau {anneau(seuil, mod)}|face {naturel}|{MOTS[palier]}", "de")
        issues = c.get("issues") or {}
        texte = issues.get(PROSE[palier]) or ""
        # « 20 naturel. » / « 1 naturel. » et « ♦ −2 » sont des marqueurs
        # d'écriture, retirés à l'affichage par le jeu.
        for pref in ("20 naturel. ", "1 naturel. "):
            if texte.startswith(pref):
                texte = texte[len(pref):]
        texte = texte.split(" ♦")[0].strip()
        self.dit(texte, "narration")
        # Tu as TENTÉ quelque chose ici : quitter ce lieu ne coûtera pas de
        # jour. Ce qui compte est d'avoir lancé, pas d'avoir réussi.
        self.d["engageIci"] = True

        s = self.scene()
        nature = c.get("nature") or ("physique" if s.get("combat") else "social")
        dur = palier in ("critique", "malediction")
        rate = palier in ("echec", "critique", "malediction")
        # LOT 3 (14/08) : sur l'option PRÉPARÉE d'un combat, l'échec est hors de
        # portée — la préparation ne rend pas le jet plus facile, elle change ce
        # qu'on risque. Aucun coût au corps, aucune blessure (miroir exact de
        # `coutSante(..., horsDePortee)` et de la garde d'ENTAILLÉ, scene-data.
        # ⚠️ Conséquence assumée : sur ce choix-là, on ne peut pas mourir.
        hors = bool(c.get("horsDePortee"))
        # Miroir de `coutSante` : le SURNATUREL passe par la même porte que le
        # physique (sinon il échappe au paiement de la préparation, défaut
        # trouvé en jeu le 14/08).
        if hors:
            cout = 0.0
        elif nature == "physique":
            cout = COUT.get(palier, 0.0)
        elif nature == "surnaturel" and palier in ("echec", "critique", "malediction"):
            cout = 0.28 if palier == "malediction" else 0.18  # 2/09, 7/09, 11/09
            # L'EFFROI NE TUE PAS (verdict panel 17/08, restaure la règle du
            # 9/08 « on ne meurt que d'un échec physique ou du procès ») : le
            # surnaturel use le corps mais laisse AU SEUIL — miroir exact de
            # `coutSanteBorne` (scene-data). Deux agents du panel sont morts
            # sur « Rien n'attaque » ; ce n'était pas un artefact de la
            # réplique, le vrai jeu vient d'être corrigé au même endroit.
            cout = min(cout, max(0.0, self.d["sante"] - 0.05))
        else:
            cout = 0.0
        if cout:
            self.d["sante"] = max(0.0, round(self.d["sante"] - cout, 3))
        # ON T'A VU (10/08) : un échec d'exploration dont la prose nomme un
        # témoin se paie comme un échec social.
        if rate and c.get("vuSiEchec") and nature != "social":
            # Quand l'acte a DÉJÀ payé à la sélection, le ratage n'ajoute
            # qu'un cran (sinon un seul geste montait à 3 sur 6).
            deja = (c.get("soupcon") or 0) > 0
            vu = (2 if deja else 3) if palier == "malediction" else (1 if deja else 2) if dur else 1
            self.d["soupcon"] = min(6, self.d["soupcon"] + vu)
        if rate and nature == "social" and not s.get("combat"):
            # MALÉDICTION strictement pire que FUNESTE (panel 9/08) : la pire
            # face du dé ne peut pas coûter la même chose qu'un échec dur.
            vu = 3 if palier == "malediction" else 2 if dur else 1
            self.d["soupcon"] = min(6, self.d["soupcon"] + vu)
        # SURNATUREL : étendu à l'échec simple (10/08) — s'en tirer indemne
        # après avoir touché ce qu'il ne faut pas vide le mot de son sens.
        # ⚠️ Le surnaturel ne pose plus HANTÉ ni MARQUÉ (états supprimés du vrai
        # jeu par la Phase A du 11/08) : son coût tombe dans la CHAIR, et il est
        # pris plus haut, avec tous les autres.
        if s.get("combat"):
            if palier in ("echec", "critique", "malediction") and not hors:
                self.d["etats"]["entaille"] = 999
                self.dit("ÉTAT — Entaillé", "etat")
            elif palier in ("destin", "eclatante", "reussite") and c.get("stat") in ("COURAGE", "INSTINCT"):
                # Gagner sans se battre n'affûte pas les gestes de guerre
                # (règle du vrai jeu — la réplique l'ignorait, panel 9/08).
                self.d["etats"]["aguerri"] = 3
                self.dit("ÉTAT — Aguerri", "etat")
        elif palier == "malediction" and not hors:
            # Miroir du contrecoup de malédiction hors combat (corrigé 24/08 :
            # il suit la NATURE du jet, pas sa stat — une malédiction sociale
            # ne pose plus une plaie). Physique → Entaillé 3 ; sinon Ébranlé 2.
            if nature == "physique":
                self.d["etats"]["entaille"] = 3
                self.dit("ÉTAT — Entaillé", "etat")
            else:
                self.d["etats"]["ebranle"] = 2
                self.dit("ÉTAT — Ébranlé", "etat")
        self.geolierSurJet(naturel)

        for e in list(self.d["etats"]):
            if self.d["etats"][e] < 999:
                self.d["etats"][e] -= 1
                if self.d["etats"][e] <= 0:
                    del self.d["etats"][e]

        if not rate and c.get("donneObjet"):
            self.gagner(c["donneObjet"])
        # LE DESTIN DONNE TOUJOURS QUELQUE CHOSE (panel 10/08) — la réplique
        # ne donnait RIEN sur un 20 naturel : trois testeurs ont conclu que le
        # meilleur résultat du jeu était vide. Elle ne porte pas le catalogue
        # de la Besace, donc l'objet est nommé génériquement ; ce qui compte
        # est que le moment le plus rare du jeu ne se solde pas par rien.
        if palier == "destin":
            # 03/09 — un objet RÉEL en besace (un testeur a vu « OBTENU » puis
            # `besace —` à l'écran `etat`).
            self.gagner("trouvaille-rare")
        if s.get("procesFixation") and rate:
            self.mourir(texte or "Le hameau a jugé.")
            return
        if s.get("procesFixation"):
            # Relaxe : 4, pas 3 — une relaxe coûte, mais deux manifestations
            # se rejouent avant un second procès (arbitrage 9/08).
            self.d["soupcon"] = 4
        if self.d["sante"] <= 0:
            self.mourir(texte)
            return
        self.d["dernierRate"] = rate
        # Hors séjour, l'échec dur n'a pas d'option à retirer : il arme la
        # Croisée qui vient (une route de moins). Le séjour, lui, consomme
        # déjà le choix tenté — on n'y ajoute pas un second coût.
        if dur and not s.get("sejour"):
            self.d["routeAFermer"] = True
            self.d["routeFermeeCause"] = "echec"
        self.suite(c)

    def suite(self, choix: dict | None = None) -> None:
        s = self.scene()
        # L'AUBE VIENT QU'ON AIT DORMI OU VEILLÉ (10/08, déplacé le 03/09) :
        # le Jour d'une scène de nuit se prend au moment où l'on en SORT (ou
        # qu'on y a veillé), jamais à l'arrivée — « — JOUR 3 — » tombait en bas
        # de l'écran d'entrée du Moulin avant qu'on ait proposé de dormir.
        sid_nuit = self.d.get("scene") or ""
        if s.get("nuit") and not self.d.pop("sansNuit", False) \
                and sid_nuit not in self.d.get("nuitsVues", []):
            self.d.setdefault("nuitsVues", []).append(sid_nuit)
            self.d["jour"] += 1
            self.dit(f"JOUR {self.d['jour']}", "jour")
        # SÉJOUR (9/08) : un lieu qui retient ne se quitte que par un choix
        # portant `sortie`. Le choix résolu est consommé et disparaît ; on
        # redonne la main sur ce qui reste, sans rejouer l'arrivée.
        # ⚠️ UNE RENCONTRE S'OUVRE DEPUIS N'IMPORTE QUEL LIEU (14/08). Ce bloc
        # ne lisait `sortie.toScene` que sur un SÉJOUR — or les cinq choix qui
        # mènent à quelqu'un (l'homme immobile de la Borne, le Marcheur, la
        # Femme au Seuil, le Gamin, les Époux) sont posés sur des lieux
        # ordinaires. Résultat mesuré par trois testeurs indépendants : « je
        # choisis d'aller vers un personnage et il a disparu à l'écran
        # suivant », cinq fois par vie. Tout le contenu des rencontres était
        # INJOUABLE dans la réplique, et invisible dans les rapports.
        if choix is not None and not s.get("sejour"):
            ouvre = choix.get("sortie")
            if isinstance(ouvre, dict) and ouvre.get("toScene"):
                self.entrer(ouvre["toScene"])
                return
        # LE DEMI-TOUR (01/09) : rallonge la traversée et rend la main au
        # tirage au lieu de descendre. Posé avant la sortie du séjour — sans
        # lui, la réplique redescendrait droit sur la sortie de zone et un
        # relecteur conclurait que le demi-tour ne fait rien.
        if choix is not None and choix.get("demiTour"):
            self.d["cible"] = self.d.get("cible", 7) + int(choix["demiTour"].get("lieux", 3))
        if choix is not None and choix.get("uneFoisParVie"):
            self.d.setdefault("uneFois", []).append(choix["uneFoisParVie"])
        if s.get("sejour") and choix is not None:
            sortie = choix.get("sortie")
            self.d.setdefault("choixFaits", []).append(choix.get("id"))
            # ⚠️ `sortie` peut valoir {} — un choix qui fait PARTIR sans nommer
            # de destination (le cas de 13 des sorties de la zone). En
            # JavaScript {} est vrai, en Python il est FAUX : un `if not
            # sortie` enfermait donc le joueur dans tous les lieux qui
            # retiennent, alors que le jeu, lui, le laissait sortir. C'est ce
            # piège qui a rendu six vies sur sept injouables au panel du
            # 10/08. Ne tester QUE l'absence.
            if sortie is None:
                return
            if isinstance(sortie, dict) and sortie.get("toScene"):
                self.entrer(sortie["toScene"])
                return
        # La halte est finie : on ressort par la Palissade, comme dans le jeu.
        if s.get("hameauHalte"):
            self.d["halteFaite"] = True
            self.d["phase"] = "scene"
            if "palissade-sud" in self.k["scenes"] and "palissade-sud" not in self.d["visites"]:
                self.entrer("palissade-sud", orientation=True)
            else:
                self.entrer("la-descente")
            return
        if s.get("terminal"):
            if self.d["scene"] == "la-descente":
                self.cloturer_traversee()
            self.d["sortie"] = "descente" if self.d["scene"] == "la-descente" else "renoncement"
            return
        if s.get("suite"):
            self.entrer(s["suite"])
            return
        self.liaison()

    def cloturer_traversee(self) -> None:
        """LA SEULE PORTE DE SORTIE VIVANTE. Idempotente.

        ⚠️ Défaut trouvé au playtest global du 15/08 (point A) : le Sceau
        n'était pris que dans la branche `terminal` de `suite()`, donc
        UNIQUEMENT si le joueur appuyait sur « Repartir de la Borne ». Un
        testeur qui lançait `nouvelle` depuis l'écran de la Descente — le
        geste naturel, la vie est finie — ne le prenait jamais : la marque
        s'annonçait à l'écran et le compte ne la portait pas. La ligne de
        sortie était en plus affichée DEUX fois quand on appuyait vraiment.

        Trois entrées (arrivée à la Descente, choix terminal, `nouvelle`)
        passent maintenant par ici, et le drapeau garantit qu'on ne compte
        qu'une traversée par vie.
        """
        if self.d.get("traverseeClose"):
            return
        self.d["traverseeClose"] = True
        c = lire_compte()
        c["sceau"] = c.get("sceau", 0) + 1
        # ⚠️ 12/09 (vie multi-zones, décision Patrick) : un survivant n'entre
        # PLUS au Registre — « le Registre est le livre des morts ». Le vrai
        # jeu (`recordSortieVivante`) garde le nom À PART, pour que la Borne
        # puisse encore relire « celui-là est revenu » ; `mourir` le périme.
        c["dernierSurvivant"] = self.d["nom"]
        ecrire_compte(c)
        textes = self.k.get("sceau", {}).get("sortie", [])
        if textes:
            self.dit(textes[min(c["sceau"], len(textes)) - 1], "narration")

    def borne_sud(self) -> list[str]:
        """Le côté sud de la Borne : le prédécesseur, puis le Sceau.

        L'incarnation d'avant est le survivant (`dernierSurvivant`, posé par
        la clôture de traversée) s'il y en a un, sinon `tombes[0]` — depuis le
        12/09 un survivant n'entre plus au Registre, le vrai jeu le garde à part.
        C'est cette distinction qui porte tout le sens : un nom gravé par
        quelqu'un qui EST revenu contredit la règle que l'examen vient
        d'énoncer.
        """
        b = self.k.get("borneSud", {})
        cas, mots = b.get("cas", []), b.get("mots", [])
        c = lire_compte()
        out: list[str] = []
        tombes, morts = c.get("tombes", []), c.get("morts", 0)
        # Miroir de `predecesseur` (player-memory, 12/09) : l'incarnation
        # d'avant est le survivant s'il y en a un, sinon la dernière tombe.
        p = ({"nom": c["dernierSurvivant"], "cause": "a franchi la Descente"}
             if c.get("dernierSurvivant") else (tombes[0] if tombes else None))
        if cas and p:
            nom = p.get("nom", "").upper()
            if "franchi" in (p.get("cause") or ""):
                out.append(cas[0].replace("{nom}", nom))
            elif morts <= 1:
                out.append(cas[1].replace("{nom}", nom))
            else:
                compte = (f"tu les comptes : {mots[morts]}" if morts < len(mots)
                          else "tu renonces à les compter")
                out.append(cas[2].replace("{nom}", nom).replace("{compte}", compte))
        borne = self.k.get("sceau", {}).get("borne", [])
        if c.get("sceau", 0) > 0 and borne:
            out.append(borne[0])
        return out

    def mourir(self, dernier: str) -> None:
        self.d["morte"] = True
        self.d["sortie"] = "mort"
        c = lire_compte()
        c["morts"] += 1
        # ⚠️ La cause doit rester lisible : couper la prose à 60 signes rendait
        # parfois une cause absurde — un testeur du panel 10/08 a vu sa
        # première mort inscrite avec pour cause « , ». On coupe à la phrase.
        phrase = (dernier or "").strip().split(".")[0].strip(" ,;—«»")
        cause = phrase if len(phrase) >= 8 else "les Landes"
        c["tombes"].insert(0, {"nom": self.d["nom"], "cause": cause[:70]})
        c.pop("dernierSurvivant", None)  # une mort périme le survivant (12/09)
        ecrire_compte(c)
        tenus = sum(1 for x in self.d["des"] if x["palier"] in ("destin", "eclatante", "reussite", "justesse"))
        self.dit("MORT", "mort")
        # ⚠️ La prose du jet fatal vient d'être affichée par la résolution :
        # la reprendre en épitaphe la fait lire DEUX FOIS d'affilée, au moment
        # le plus solennel du jeu (relevé par un testeur du panel 10/08). Le
        # vrai jeu ne l'affiche qu'une fois — il masque la prose sur le dé
        # fatal et la garde pour l'épitaphe.
        deja = [e["texte"] for e in self.d["journal"][-4:]]
        if dernier not in deja:
            self.dit(dernier, "epitaphe")
        self.dit(
            f"Jour {self.d['jour']} · Les Landes · {len(self.d['visites'])} lieux traversés · "
            f"{len(self.d['des'])} dés lancés dont {tenus} tenus",
            "bilan",
        )

    # -- affichage
    def ecran(self) -> str:
        j = self.d["journal"]
        # on ne réaffiche que ce qui suit la dernière action prise
        dep = 0
        for i in range(len(j) - 1, -1, -1):
            if j[i]["style"] == "action":
                dep = i + 1
                break
        return self.rendu(j[dep:], entete=True)

    def rendu(self, blocs: list[dict], entete: bool) -> str:
        out: list[str] = []
        if entete:
            s = self.scene()
            titre = f"  JOUR {self.d['jour']}"
            if self.d["phase"] == "liaison":
                titre += "  ·  en chemin"
            else:
                lieu = self.nomDuLieu(s)
                if lieu:
                    titre += f"  ·  {lieu}"
            out += ["═" * LARGEUR, titre, barre(self.d["sante"])]
        for b in blocs:
            st, t = b["style"], b["texte"]
            if st in ("narration", "approche", "epitaphe"):
                out += [para(t), ""]
            elif st == "geolier":
                out += ["  ◉ LE GEÔLIER", para(t, "    "), ""]
            elif st == "jour":
                out += [f"  — {t} —", ""]
            elif st in ("lieu", "rencontre"):
                if t:
                    out += [f"  {t.upper()}", ""]
            elif st in ("obtenu", "etat"):
                out += [f"  {t}", ""]
            elif st == "action":
                out += [f"  › {t}", ""]
            elif st == "geste":
                out += [f"  {t}", ""]
            elif st == "de":
                # Filet : un jour où une ligne sans barre repasserait par ici,
                # elle s'affiche au lieu de tuer la partie.
                if "|" not in t:
                    out += [f"  {t}", ""]
                    continue
                an, face, mot = t.split("|")
                out += ["  " + an.replace("anneau ", "")]
                if len(self.d["des"]) <= 1:
                    out += ["  (l'anneau du dé : encoches pleines = faces qui réussissent)"]
                out += [f"  le dé montre {face.replace('face ', '')}   →   {mot}", ""]
            elif st == "mort":
                out += ["", "  " + " ".join("MORT"), ""]
            elif st == "bilan":
                out += [para(t, "  "), ""]
        if self.d["sortie"]:
            fin = {"mort": "Cette vie est finie. `python3 pactum.py nouvelle` en ouvre une autre.",
                   "descente": "Tu as traversé les Landes vivant. `python3 pactum.py nouvelle` pour une autre vie.",
                   "renoncement": "Tu as renoncé. `python3 pactum.py nouvelle` pour une autre vie."}
            out += [barre(self.d["sante"]), "  " + fin[self.d["sortie"]], "═" * LARGEUR]
            return "\n".join(out)
        out += [barre(self.d["sante"])]
        for i, o in enumerate(self.choix(), 1):
            lab = o["label"]
            tag = ""
            if o["kind"] == "choix" and o["c"].get("stat"):
                tag = f"   [{o['c']['stat']}]"
            if o["kind"] == "ouvrir":
                tag = f"   ({o['note']})"
            # (17/08) Plus de rappel d'indice sur le bouton : la Croisée les
            # sert désormais en narration comme le vrai jeu — les garder ici
            # les ferait lire DEUX fois sur le même écran.
            out.append(f"  {i}) {lab}{tag}")
        out += ["═" * LARGEUR, "  → python3 pactum.py <numéro>"]
        return "\n".join(out)


# ── ligne de commande ────────────────────────────────────────────────────────

def main(argv: list[str]) -> int:
    arg = argv[1] if len(argv) > 1 else ""
    if arg == "nouvelle":
        graine = None
        nom = None
        for a in argv[2:]:
            if a.startswith("--graine="):
                graine = int(a.split("=")[1])
            if a.startswith("--nom="):
                nom = a.split("=", 1)[1]
        # ⚠️ La TROISIÈME porte de sortie (verdict du 15/08) : ouvrir une vie
        # neuve depuis l'écran de la Descente est le geste naturel — la vie
        # est finie, on ne repasse pas par le bouton. Sans ce rattrapage, la
        # traversée n'était jamais enregistrée et la vie suivante s'ouvrait
        # sans la marque, alors que l'écran venait de l'annoncer.
        if SAUVE.exists():
            try:
                ancienne = Partie(json.loads(SAUVE.read_text(encoding="utf-8")))
                if ancienne.d.get("scene") == "la-descente":
                    ancienne.cloturer_traversee()
            except (ValueError, KeyError):
                pass  # une sauvegarde illisible ne doit pas empêcher de rejouer
        p = Partie.neuve(graine, nom)
        SAUVE.write_text(json.dumps(p.d, ensure_ascii=False), encoding="utf-8")
        k = p.k
        print(f"PACTUM v{k['version']} — Les Landes.  Héros : {p.d['nom']}.  "
              f"Graine {p.d['graine']} (rejouable à l'identique).")
        print(p.ecran())
        return 0

    if not SAUVE.exists():
        sortir("Aucune partie en cours. Lance : python3 pactum.py nouvelle")
    p = Partie(json.loads(SAUVE.read_text(encoding="utf-8")))

    if arg == "etat":
        d = p.d
        print("LES ROUAGES CACHÉS (le joueur ne voit rien de ceci)")
        print(f"  santé      {d['sante']:.2f}   soupçon {d['soupcon']}   jour {d['jour']}")
        print(f"  états      {d['etats'] or '—'}")
        print(f"  besace     {d['besace'] or '—'}")
        print(f"  traversée  {len(d['visites'])}/{d['cible']} lieux : {', '.join(d['visites'])}")
        print(f"  dés        {len(d['des'])} lancés")
        for x in d["des"]:
            print(f"     {x['stat'] or '—':9} seuil {x['seuil']:2}  dé {x['naturel']:2}  {x['palier']}")
        return 0
    if arg == "journal":
        print(p.rendu(p.d["journal"], entete=False))
        return 0
    if arg == "":
        print(p.ecran())
        return 0
    if not arg.isdigit():
        sortir(__doc__ or "")
    if p.d["sortie"]:
        sortir("Cette vie est finie. `python3 pactum.py nouvelle` en ouvre une autre.")
    p.jouer(int(arg))
    SAUVE.write_text(json.dumps(p.d, ensure_ascii=False), encoding="utf-8")
    print(p.ecran())
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
