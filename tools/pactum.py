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


def profil_de_heros(rng) -> dict:
    """Quatre stats de 1 à 5, une dominante et une faiblesse — comme le Seuil.

    Le jeu les fixe par les souvenirs du prologue ; le kit ne joue pas le
    prologue, donc il les tire. Ce qui compte pour le playtest est qu'elles
    EXISTENT et qu'une seule domine.
    """
    stats = {k: rng.choice([2, 3, 3, 4]) for k in ("courage", "ruse", "instinct", "empathie")}
    cles = list(stats)
    rng.shuffle(cles)
    stats[cles[0]] = 5
    stats[cles[1]] = min(stats[cles[1]], 2)
    return stats


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
COUT = {"malediction": 0.30, "critique": 0.26, "echec": 0.16, "justesse": 0.08}
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
        # Une partie commencée AVANT que la réplique ne connaisse les stats
        # n'en a pas : on lui en donne, dérivées de sa graine, plutôt que de
        # la faire jouer avec un profil vide (elle verrait alors toujours la
        # même variante de choix). Rien d'autre de sa sauvegarde ne bouge.
        if not self.d.get("stats"):
            self.d["stats"] = profil_de_heros(random.Random(self.d.get("graine", 0)))

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
            "soupconVu": 0, "routeAFermer": False,
            "des": [], "journal": [], "sortie": None, "hameauEntree": False,
            "procesVu": False, "savoirs": [],
            # LES STATS DU HÉROS (verdict du Seuil dans le jeu, tirage ici).
            # Elles pèsent sur le dé (`stat − 3`, promesse n°1 du 4/08) et
            # décident quelle VARIANTE de choix existe (`exigeDominante`).
            # Sans elles, la réplique offrait les quatre variantes du gamin
            # d'un coup — six CTA dans la ruelle, relevé au playtest du 14/08.
            "stats": profil_de_heros(rng),
        }
        p = cls(d)
        p.entrer(k["entree"], premier=True)
        # LE SCEAU SE PORTE À MÊME LA MAIN : la marque rapportée de la vie
        # d'avant se lit dès la Borne, avant tout choix.
        n = lire_compte().get("sceau", 0)
        ouv = k.get("sceau", {}).get("ouverture", [])
        if n > 0 and ouv:
            p.dit(ouv[min(n, len(ouv)) - 1], "narration")
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

    def ambiance_de_marche(self, r, dans_village: bool) -> str:
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
                if dedans != dans_village:
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
            self.d["engageIci"] = False
            self.d["poiIci"] = 0
            if sid in self.k["hameauInterieur"] or sid.startswith("hameau-") or sid == "serment-hameau":
                self.d["hameauEntree"] = True
            # LE MONDE RECONNAÎT LA MARQUE : une ligne à l'arrivée, sur les
            # lieux où quelqu'un est là pour la voir.
            if lire_compte().get("sceau", 0) > 0:
                rec = self.k.get("sceau", {}).get("reconnu", {}).get(radical)
                if rec:
                    self.dit(rec, "narration")
        if sid == "la-descente":
            # L'ANNONCE DU SCEAU se lit sur l'écran de la Descente, entre la
            # trace de sortie et le livre — c'est le moment de récompense.
            textes = self.k.get("sceau", {}).get("sortie", [])
            n = lire_compte().get("sceau", 0) + 1
            if textes:
                self.dit(textes[min(n, len(textes)) - 1], "narration")
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
        if s.get("nuit") and not self.d.pop("sansNuit", False) \
                and sid not in self.d.get("nuitsVues", []):
            self.d.setdefault("nuitsVues", []).append(sid)
            self.d["jour"] += 1
            self.dit(f"JOUR {self.d['jour']}", "jour")
        if s.get("registre"):
            self.dit(
                "[Le Grand Registre défile : cent noms classés par jours de "
                "survie, la première ligne grattée jusqu'à la pierre. Ta ligne "
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

    # -- liaison
    def liaison(self) -> None:
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
        if not self.d["hameauEntree"]:
            libres = [x for x in libres if x not in self.k["hameauInterieur"]]
        else:
            libres = [x for x in libres if x != "serment-hameau"]
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
        r = self.rng()
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
        amb = self.ambiance_de_marche(r, dans_village)
        self.d["ambiancesVues"].append(amb)
        self.dit(amb, "narration")
        if ferme and self.k.get("routeFermee"):
            self.dit(r.choice(self.k["routeFermee"]), "narration")
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
            if s.get("sejour") and c["id"] in self.d.get("choixFaits", []):
                continue
            # REMPLACER PAR SÉQUENCE (14/08) : on ne répond pas au jugement
            # d'un pendu avant de l'avoir entendu.
            if c.get("exigeChoixFait") and c["exigeChoixFait"] not in faits:
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
            self.d["phase"] = "scene"
            self.d["options"] = None
            self.entrer(o["dest"], orientation=True)
            return

        c = o["c"]
        if c.get("serment"):
            self.d["serment"] = c["serment"]
        # LE SERMENT SE ROMPT PAR UN GESTE (14/08). Sans ça, la réplique
        # accorderait au procès la défense du Serment à un héros qui a parlé à
        # un pendu — et un relecteur conclurait que jurer n'engage à rien.
        # Seulement si le Serment a DÉJÀ été prêté : la Femme au Seuil se joue
        # avant le muret, on ne rompt pas une promesse qu'on n'a pas faite.
        if c.get("rompLeSerment") and self.d.get("serment"):
            self.d["sermentRompu"] = True
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
            self.soupconSeLit()
        if c["type"] == "risque":
            self.resoudre(c)
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
                    "[Tu lis. Cent noms classés par jours de survie, la "
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
            if c.get("repos"):
                # ⚠️ LE JOUR DE LA NUIT EST DÉJÀ PRIS À L'AFFICHAGE de la
                # scène `nuit` (voir plus haut) — le rajouter ici donnait
                # DEUX jours au dormeur contre un au veilleur, soit
                # exactement l'asymétrie que le correctif du 10/08 supprime
                # dans le jeu réel. Un agent qui mesurait sur la réplique
                # concluait donc « le passif gagne », l'inverse de la vérité.
                # Le repos SOIGNE ; c'est la nuit qui fait le jour.
                self.d["sante"] = min(1.0, self.d["sante"] + 0.35)
            self.suite(c)

    def gagner(self, oid: str) -> None:
        """L'objet est nommé par son NOM, jamais par son identifiant."""
        self.d["besace"].append(oid)
        nom = self.k.get("objets", {}).get(oid) or oid.replace("-", " ")
        self.dit("OBTENU — " + nom, "obtenu")

    def dominante(self) -> str:
        st = self.d.get("stats") or {}
        return max(st, key=lambda k: st[k]).upper() if st else "COURAGE"

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
            m += 2 if e == "aguerri" else -2 if e == "entaille" else 0
        # LA PRÉPARATION (panel 10/08) : ce qu'on a REGARDÉ dans ce lieu ouvre
        # l'Anneau, d'un cran par point d'intérêt, au plus deux. C'est le seul
        # levier par lequel ce que le joueur TENTE change ses chances.
        m += min(2, self.d.get("poiIci", 0))
        return m

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

    def resoudre(self, c: dict) -> None:
        seuil = int(c.get("seuil") or 11)
        sc = self.k["scenes"].get(self.d.get("scene") or "", {})
        if sc.get("procesFixation"):
            seuil = max(2, seuil - len(self.apports_proces()))
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
        cout = COUT.get(palier, 0.0) if nature == "physique" else 0.0
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
        # ⚠️ CORRIGÉ LE 14/08 (repéré par Patrick au playtest v1.82, et il a eu
        # raison de ne pas l'imputer au build) : la réplique posait encore
        # HANTÉ et MARQUÉ, deux états SUPPRIMÉS du vrai jeu par la Phase A du
        # 11/08. Elle faisait donc juger une mécanique qui n'existe plus. Le
        # coût tombe dans la CHAIR, comme dans Scene.tsx.
        if rate and nature == "surnaturel":
            self.d["sante"] = max(
                0.0, round(self.d["sante"] - (0.16 if palier == "malediction" else 0.10), 3)
            )
        if s.get("combat"):
            if palier in ("echec", "critique", "malediction"):
                self.d["etats"]["entaille"] = 999
                self.dit("ÉTAT — Entaillé", "etat")
            elif palier in ("destin", "eclatante", "reussite") and c.get("stat") in ("COURAGE", "INSTINCT"):
                # Gagner sans se battre n'affûte pas les gestes de guerre
                # (règle du vrai jeu — la réplique l'ignorait, panel 9/08).
                self.d["etats"]["aguerri"] = 3
                self.dit("ÉTAT — Aguerri", "etat")
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
            self.dit("OBTENU — une trouvaille rare (Destin)", "obtenu")
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
        self.suite(c)

    def suite(self, choix: dict | None = None) -> None:
        s = self.scene()
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
                # LE SCEAU SE PREND ICI (arbitrage 10/08) : sortir vivant
                # laisse enfin quelque chose au compte.
                c = lire_compte()
                c["sceau"] += 1
                # Le nom entre au livre avec sa mention, comme `recordTraversee`
                # le fait au Grand Registre — c'est ce que la Borne relira.
                c["tombes"].insert(0, {"nom": self.d["nom"], "cause": "a franchi la Descente"})
                ecrire_compte(c)
                textes = self.k.get("sceau", {}).get("sortie", [])
                if textes:
                    self.dit(textes[min(c["sceau"], len(textes)) - 1], "narration")
            self.d["sortie"] = "descente" if self.d["scene"] == "la-descente" else "renoncement"
            return
        if s.get("suite"):
            self.entrer(s["suite"])
            return
        self.liaison()

    def borne_sud(self) -> list[str]:
        """Le côté sud de la Borne : le prédécesseur, puis le Sceau.

        `tombes[0]` est l'incarnation d'avant — morte, ou revenue vivante
        (le franchissement l'y inscrit comme le vrai jeu le fait au Registre).
        C'est cette distinction qui porte tout le sens : un nom gravé par
        quelqu'un qui EST revenu contredit la règle que l'examen vient
        d'énoncer.
        """
        b = self.k.get("borneSud", {})
        cas, mots = b.get("cas", []), b.get("mots", [])
        c = lire_compte()
        out: list[str] = []
        tombes, morts = c.get("tombes", []), c.get("morts", 0)
        if cas and tombes:
            p = tombes[0]
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
            elif st == "de":
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
            if o["kind"] == "aller" and o.get("indice"):
                tag = f"   — {o['indice']}"
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
