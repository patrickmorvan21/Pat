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
import sys
import textwrap
from pathlib import Path

ICI = Path(__file__).resolve().parent
KIT = next(
    (p for p in (ICI / "run-kit.json", ICI.parent / "data" / "run-kit.json") if p.exists()),
    None,
)
SAUVE = ICI / "partie.json"
LARGEUR = 74

# Coûts de santé par palier — repris de components/Scene.tsx.
# ⚠️ Depuis le 9/08, la NATURE du jet décide : seul un échec PHYSIQUE coûte de
# la santé. Un échec social coûte du Soupçon, un échec d'exploration coûte un
# Jour, un échec surnaturel laisse un état. On ne meurt donc que d'un danger
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
            "ambiancesVues": [], "poiOuvert": False, "morte": False,
            "des": [], "journal": [], "sortie": None, "hameauEntree": False,
        }
        p = cls(d)
        p.entrer(k["entree"], premier=True)
        return p

    # -- accès
    def scene(self, sid: str | None = None) -> dict:
        return self.k["scenes"][sid or self.d["scene"]]

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

    # -- ouverture d'un écran
    def entrer(self, sid: str, premier: bool = False, orientation: bool = False) -> None:
        s = self.k["scenes"][sid]
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
            # Le Jour avance en MARCHANT : un jour tous les trois lieux.
            if len(self.d["visites"]) % 3 == 0:
                self.d["jour"] += 1
                self.dit(f"JOUR {self.d['jour']}", "jour")
            if sid in self.k["hameauInterieur"] or sid.startswith("hameau-") or sid == "serment-hameau":
                self.d["hameauEntree"] = True
        if s.get("combat"):
            self.dit("• RENCONTRE • " + (s.get("adversaireNom") or s.get("nom") or ""), "rencontre")
        for p in s.get("narration", []):
            self.dit(p, "narration")
        self.geolierPeutParler(s)

    def geolierPeutParler(self, s: dict) -> None:
        """Rare (12 %), et jamais deux fois la même phrase dans une vie.

        En liaison il puise dans un pool commun ; ailleurs, chaque scène a SA
        phrase — si elle est déjà tombée, il se tait plutôt que de se répéter.
        """
        r = self.rng()
        if r.random() >= 0.12:
            return
        if self.d["phase"] == "liaison":
            pool = [t for t in self.k["geolierLiaison"] if t not in self.d["geolierVus"]]
            if not pool:
                return
            t = r.choice(pool)
        else:
            t = s.get("geolier")
            if not t or t in self.d["geolierVus"]:
                return
        self.d["geolierVus"].append(t)
        self.dit(t, "geolier")

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
        libres = [x for x in self.k["pool"] if x not in self.d["visites"]]
        if not self.d["hameauEntree"]:
            libres = [x for x in libres if x not in self.k["hameauInterieur"]]
        else:
            libres = [x for x in libres if x != "serment-hameau"]
        if len(libres) < 2 or len(self.d["visites"]) >= self.d["cible"]:
            self.d["phase"] = "scene"
            self.entrer("la-descente")
            return
        r = self.rng()
        opts = r.sample(libres, 2)
        self.d["phase"] = "liaison"
        self.d["options"] = opts
        self.d["pas"] += 1
        self.d["poiOuvert"] = False
        dans_village = self.d["scene"] in self.k["hameauInterieur"]
        fond = list(self.k["ambiances"]) + ([] if dans_village else list(self.k["ambiancesLande"]))
        frais = [t for t in fond if t not in self.d["ambiancesVues"]] or fond
        amb = r.choice(frais)
        self.d["ambiancesVues"].append(amb)
        self.dit(amb, "narration")
        self.dit(r.choice(self.k["bifurcations"]), "narration")
        self.geolierPeutParler({})

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
        if pois:
            out.append({"kind": "ouvrir", "label": "Observer les alentours",
                        "note": f"{len(pois)} chose(s) à regarder"})
        for c in s.get("choix", []):
            if c["type"] == "verrouille":
                continue
            out.append({"kind": "choix", "c": c, "label": c["label"]})
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
            return
        if o["kind"] == "fermer":
            self.d["poiOuvert"] = False
            return
        if o["kind"] == "poi":
            p = o["poi"]
            self.d["poiVus"].append(p["id"])
            self.d["poiOuvert"] = False
            self.d["pas"] += 1
            self.dit(p["approche"], "narration")
            self.dit(p["examen"], "narration")
            if p.get("soupcon"):
                self.d["soupcon"] += p["soupcon"]
            if p.get("donneObjet"):
                self.d["besace"].append(p["donneObjet"])
                self.dit("OBTENU — " + p["donneObjet"].replace("-", " "), "obtenu")
            if p.get("ouvreSur"):
                self.entrer(p["ouvreSur"])
            return
        if o["kind"] == "aller":
            self.d["phase"] = "scene"
            self.d["options"] = None
            self.entrer(o["dest"], orientation=True)
            return

        c = o["c"]
        if c.get("soupcon"):
            self.d["soupcon"] += c["soupcon"]
        if c["type"] == "risque":
            self.resoudre(c)
        else:
            if c.get("consequence"):
                self.dit(c["consequence"], "narration")
            if c.get("donneObjet"):
                self.d["besace"].append(c["donneObjet"])
                self.dit("OBTENU — " + c["donneObjet"].replace("-", " "), "obtenu")
            if c.get("repos"):
                self.d["jour"] += 1
                self.d["sante"] = min(1.0, self.d["sante"] + 0.35)
                self.dit(f"JOUR {self.d['jour']}", "jour")
            self.suite()

    def modificateur(self) -> int:
        m = 0
        for e, tours in self.d["etats"].items():
            if tours <= 0:
                continue
            m += 2 if e == "aguerri" else -2 if e == "entaille" else 0
        return m

    def resoudre(self, c: dict) -> None:
        seuil = int(c.get("seuil") or 11)
        mod = self.modificateur()
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

        s = self.scene()
        nature = c.get("nature") or ("physique" if s.get("combat") else "social")
        dur = palier in ("critique", "malediction")
        rate = palier in ("echec", "critique", "malediction")
        cout = COUT.get(palier, 0.0) if nature == "physique" else 0.0
        if cout:
            self.d["sante"] = max(0.0, round(self.d["sante"] - cout, 3))
        if rate and nature == "social" and not s.get("combat"):
            self.d["soupcon"] += 2 if dur else 1
        if dur and nature == "surnaturel":
            self.d["etats"]["hante" if palier == "critique" else "marque"] = 999
            self.dit("ÉTAT — " + ("Hanté" if palier == "critique" else "Marqué"), "etat")
        if s.get("combat"):
            if palier in ("echec", "critique", "malediction"):
                self.d["etats"]["entaille"] = 999
                self.dit("ÉTAT — Entaillé", "etat")
            elif palier in ("destin", "eclatante", "reussite"):
                self.d["etats"]["aguerri"] = 3
                self.dit("ÉTAT — Aguerri", "etat")
        elif dur and nature == "exploration":
            # Le seul cas où le temps est diégétique : on a tourné des heures.
            self.d["jour"] += 1
            self.dit(f"JOUR {self.d['jour']}", "jour")
        self.geolierSurJet(naturel)

        for e in list(self.d["etats"]):
            if self.d["etats"][e] < 999:
                self.d["etats"][e] -= 1
                if self.d["etats"][e] <= 0:
                    del self.d["etats"][e]

        if self.d["sante"] <= 0:
            self.mourir(texte)
            return
        self.suite()

    def suite(self) -> None:
        s = self.scene()
        if s.get("terminal"):
            self.d["sortie"] = "descente" if self.d["scene"] == "la-descente" else "renoncement"
            return
        if s.get("suite"):
            self.entrer(s["suite"])
            return
        self.liaison()

    def mourir(self, dernier: str) -> None:
        self.d["morte"] = True
        self.d["sortie"] = "mort"
        tenus = sum(1 for x in self.d["des"] if x["palier"] in ("destin", "eclatante", "reussite", "justesse"))
        self.dit("MORT", "mort")
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
