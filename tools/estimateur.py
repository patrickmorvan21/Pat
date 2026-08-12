#!/usr/bin/env python3
"""
L'ESTIMATEUR DÉTERMINISTE DE LATENCE — répondre sans tirer les dés.

Cadrage validé le 12/08 : le protocole « deux vies » est trop bruité pour
arbitrer une coupe de texte. Mesuré : 50 % · 30 % · 51 % de décisions à ≤ 1
tap sur le MÊME build, même stratégie — 21 points d'écart, du même ordre que
l'effet cherché (38 % → 60 %). Les vies restent obligatoires pour le ressenti
et les bugs ; elles ne sont plus l'arbitre d'une modification de texte.

LA QUESTION À LAQUELLE CET OUTIL DOIT RÉPONDRE (critère de sortie §9) :
« Après une décision du joueur, quels sont exactement les écrans qui
retardent la prochaine décision, à quelle fréquence réelle surviennent-ils,
et lesquels doivent être coupés en premier ? »

CE QU'IL FAIT
  · latence POST-DÉCISION : écrans lus entre un choix (ou un jet) et la
    décision suivante ;
  · latence D'ARRIVÉE : écrans lus entre l'entrée dans un lieu et la
    première décision ;
  · la DISTRIBUTION 0/1/2/3+, pas seulement la moyenne ;
  · la CONTRIBUTION par famille (narration · conséquence · issue · approche) ;
  · le P95 et le maximum — les tunnels rares qui font décrocher ;
  · la pondération par FRÉQUENCE RÉELLE (un critique à 5 % ne pèse pas comme
    une réussite à 45 %).

CE QU'IL NE FAIT PAS — et c'est ce qui l'a rendu nécessaire, chacun de ces
pièges ayant réellement faussé une mesure de ce projet :
  · additionner des branches EXCLUSIVES (`narration` / `narrationEchec`) ;
  · compter le MOBILIER d'interface (Registre, bandeaux, tableaux) en prose ;
  · transformer un paragraphe en un tap sans rejouer la vraie règle
    d'affichage du client (`decouperEnEcrans`, 90 mots, Geôlier +40) ;
  · faire tomber une moyenne au détriment des PICS exemptés.

Usage :
    python3 tools/estimateur.py               # l'état du build
    python3 tools/estimateur.py --preuves     # les 3 échecs volontaires (§5.3)
    python3 tools/estimateur.py --json x.json # instantané comparable
"""
from __future__ import annotations

import json
import math
import re
import statistics
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / "tools"))
from audit_boucle import sans_commentaires  # noqa: E402

SD = RACINE / "aldenhar/lib/scene-data.ts"

# ─── LA VRAIE RÈGLE D'AFFICHAGE (Scene.tsx, `decouperEnEcrans`) ────────────
# On la REJOUE au lieu de l'approximer : un budget par écran, on coupe AVANT
# le bloc qui déborderait, jamais au milieu d'un paragraphe ; un bloc plus
# long que le budget occupe un écran à lui seul ; le bandeau du Geôlier pèse
# ses mots + le chrome ; le mobilier pèse ZÉRO.
MOTS_PAR_ECRAN = 90
CHROME_GEOLIER = 40

# Fréquence réelle des paliers d'un jet (d20, seuil ordinaire ~12).
FREQ_PALIER = {"critique": 0.05, "réussite": 0.45, "échec": 0.45, "funeste": 0.05}

# Les PICS — exemptés du plafond, jamais coupés pour une moyenne.
PICS = re.compile(
    r"proces-du-heros|temoin-toit|temoin-ruelle|grand-temoin|la-descente|"
    r"meute-grise|fille-moulin|pendu-qui-parle|hameau-entree-4|renoncer"
)


def mots(t: str) -> int:
    return len(t.split())


def decouper(blocs: list[tuple[str, int, str]]) -> list[list[tuple[str, int, str]]]:
    """(famille, poids, texte) → groupes d'écran. Port fidèle du client."""
    groupes: list[list] = []
    cur: list = []
    total = 0
    for b in blocs:
        m = b[1]
        if m > 0 and total > 0 and total + m > MOTS_PAR_ECRAN:
            groupes.append(cur)
            cur, total = [], 0
        cur.append(b)
        total += m
    if cur:
        if total == 0 and groupes:
            groupes[-1].extend(cur)
        else:
            groupes.append(cur)
    return groupes or [blocs]


# ─── LECTURE DES SOURCES ───────────────────────────────────────────────────
LITT = r'"(?:[^"\\]|\\.)*"(?:\s*\+\s*\n?\s*"(?:[^"\\]|\\.)*")*'


def concat(x: str) -> str:
    return " ".join(re.findall(r'"((?:[^"\\]|\\.)*)"', x))


def paragraphes(bloc: str, champ: str) -> list[str]:
    """Les paragraphes d'un champ tableau, chacun recollé."""
    m = re.search(rf'\b{champ}:\s*\[([\s\S]*?)\n    \]', bloc)
    if not m:
        return []
    out = []
    for para in re.split(r'",\s*\n', m.group(1)):
        t = concat(para + '"')
        if t.strip():
            out.append(t)
    return out


def lire_scenes(src: str) -> dict:
    """Le modèle de scènes : narration, choix, successeurs."""
    bornes = [(m.start(), m.group(1)) for m in re.finditer(r'\n    id: "([a-z0-9-]+)"', src)]
    scenes = {}
    for i, (pos, sid) in enumerate(bornes):
        fin = bornes[i + 1][0] if i + 1 < len(bornes) else len(src)
        bloc = src[pos:fin]
        # ⚠️ BRANCHES EXCLUSIVES : on les garde SÉPARÉES, jamais additionnées.
        sc = {
            "id": sid,
            "narration": paragraphes(bloc, "narration"),
            "narrationEchec": paragraphes(bloc, "narrationEchec"),
            "sejour": bool(re.search(r'\n    sejour:\s*true', bloc)),
            "registre": bool(re.search(r'\n    registre:\s*true', bloc)),
            "chainNext": (re.search(r'\n    chainNext:\s*"([a-z0-9-]+)"', bloc) or [None, None])[1]
            if re.search(r'\n    chainNext:\s*"([a-z0-9-]+)"', bloc) else None,
            "jailerLine": (re.search(rf'\n    jailerLine:\s*({LITT})', bloc)),
            "choix": [],
        }
        sc["jailerLine"] = concat(sc["jailerLine"].group(1)) if sc["jailerLine"] else None
        # Les choix, par OBJET — jamais par « dernier id vu » (bug du 12/08).
        deb = [m.start() for m in re.finditer(r'\n      \{', bloc)] + [len(bloc)]
        for k in range(len(deb) - 1):
            cb = bloc[deb[k]:deb[k + 1]]
            mid = re.search(r'\n\s*id: "([a-z0-9-]+)"', cb)
            if not mid:
                continue
            mc = re.search(rf'(\bconsequence:\s*)({LITT})', cb)
            mo = re.search(r'outcomes\(([\s\S]*?)\n\s*\),', cb)
            sc["choix"].append({
                "id": mid.group(1),
                "consequence": concat(mc.group(2)) if mc else None,
                "issues": re.findall(r'"((?:[^"\\]|\\.)*)"', mo.group(1))[:4] if mo else None,
                "sortie": bool(re.search(r'\n\s*sortie:\s*\{', cb)),
                "toScene": (re.search(r'toScene:\s*"([a-z0-9-]+)"', cb) or [None, None])[1]
                if re.search(r'toScene:\s*"([a-z0-9-]+)"', cb) else None,
                "orient": bool(re.search(r'\n\s*orient:\s*\{', cb)),
                "locked": bool(re.search(r'\n\s*locked:\s*\{', cb)),
            })
        scenes[sid] = sc
    return scenes


# ─── L'ESTIMATION ──────────────────────────────────────────────────────────
# Le bandeau du Geôlier ne tombe qu'à 12 % des arrivées (`chance(0.12)`,
# Scene.tsx). Le compter à CHAQUE arrivée gonflerait la latence de tout le
# monde — c'est la faute qu'a attrapée la preuve 1.
FREQ_GEOLIER = 0.12


def blocs_arrivee(sc: dict, avecJailer: bool = False) -> list[tuple[str, int, str]]:
    """Ce qui se lit en ENTRANT dans une scène, hors injections aléatoires.

    ⚠️ Le MOBILIER pèse zéro : le tableau du Registre, la puce Jour et les
    bandeaux n'ont pas à être lus comme de la prose (l'écran de 149 mots qui
    a orienté à tort le chantier du matin ÉTAIT le Registre).

    ⚠️ `narrationEchec` n'est JAMAIS ajoutée : elle est EXCLUSIVE de
    `narration` — on ne lit qu'une branche. Les additionner doublait le
    volume d'une scène et aurait fait couper de la prose sur un chiffre que
    le joueur ne rencontre jamais.
    """
    out = [("narration", mots(t), t) for t in sc["narration"]]
    if sc["registre"]:
        out.append(("mobilier", 0, "— LE GRAND REGISTRE —"))
    if avecJailer and sc["jailerLine"]:
        out.append(("geôlier", mots(sc["jailerLine"]) + CHROME_GEOLIER, sc["jailerLine"]))
    return out


def successeur(sc: dict, ch: dict) -> str | None:
    if ch["toScene"]:
        return ch["toScene"]
    if ch["sortie"] or ch["orient"]:
        return None  # la traversée décide : hors du déterminisme
    return sc["chainNext"]


def latences(scenes: dict) -> tuple[list[dict], list[dict]]:
    """(post-décision, arrivée) — une entrée par cas réellement jouable."""
    post, arriv = [], []

    for sid, sc in scenes.items():
        # ── ARRIVÉE : ce qu'on lit avant la première décision du lieu.
        if sc["choix"]:
            g = decouper(blocs_arrivee(sc))
            arriv.append({
                "scene": sid, "taps": max(0, len(g) - 1), "pic": bool(PICS.search(sid)),
                "mots": sum(b[1] for b in blocs_arrivee(sc)),
            })

        # ── POST-DÉCISION : par choix, et par palier pour un jet.
        for ch in sc["choix"]:
            if ch["orient"] or ch["locked"]:
                continue
            suiv = successeur(sc, ch)
            # Sur un SÉJOUR sans sortie, on reste : seule la conséquence se lit.
            reste = sc["sejour"] and not ch["sortie"]
            suite = [] if (reste or suiv not in scenes) else blocs_arrivee(scenes[suiv])

            def cas(txt: str, fam: str, freq: float, palier: str | None):
                blocs = [(fam, mots(txt), txt)] + suite
                g = decouper(blocs)
                post.append({
                    "scene": sid, "choix": ch["id"], "palier": palier,
                    "taps": max(0, len(g) - 1), "freq": freq,
                    "mots_texte": mots(txt), "mots_total": sum(b[1] for b in blocs),
                    "famille": fam, "pic": bool(PICS.search(sid)),
                    "reste": reste, "suivant": None if reste else suiv,
                })

            if ch["issues"]:
                for i, t in enumerate(ch["issues"]):
                    pal = ["critique", "réussite", "échec", "funeste"][i]
                    cas(t, "issue", FREQ_PALIER[pal], pal)
            elif ch["consequence"]:
                cas(ch["consequence"], "conséquence", 1.0, None)
            else:
                cas("", "neutre", 1.0, None)
    return post, arriv


def distribution(xs: list[int], poids: list[float] | None = None) -> dict:
    poids = poids or [1.0] * len(xs)
    tot = sum(poids)
    d = {}
    for x, p in zip(xs, poids):
        k = min(x, 3)
        d[k] = d.get(k, 0) + p
    return {k: 100 * v / tot for k, v in sorted(d.items())}


def rapport(scenes: dict, sortie_json: str | None) -> dict:
    post, arriv = latences(scenes)
    ord_p = [p for p in post if not p["pic"]]

    tp = [p["taps"] for p in post]
    fp = [p["freq"] for p in post]
    dist_p = distribution(tp, fp)
    ta = [a["taps"] for a in arriv]

    print("L'ESTIMATEUR DÉTERMINISTE — aucun tirage, aucun seed\n")
    print(f"■ LATENCE POST-DÉCISION — {len(post)} cas ({len(ord_p)} hors pics)")
    moy = sum(p["taps"] * p["freq"] for p in post) / sum(fp)
    print(f"   moyenne pondérée par la fréquence réelle : {moy:.2f} tap(s)")
    for k, v in dist_p.items():
        lib = f"{k}+" if k == 3 else str(k)
        print(f"     {lib} tap : {v:5.1f} %   {'█' * round(v / 3)}")
    tri = sorted(tp)
    print(f"   P95 {tri[int(.95 * len(tri))]} · max {max(tp)}")

    print(f"\n■ LATENCE D'ARRIVÉE — {len(arriv)} lieux")
    print(f"   moyenne {statistics.mean(ta):.2f} tap(s)")
    for k, v in distribution(ta).items():
        lib = f"{k}+" if k == 3 else str(k)
        print(f"     {lib} tap : {v:5.1f} %   {'█' * round(v / 3)}")

    print("\n■ CONTRIBUTION PAR FAMILLE — mots lus par décision, "
          "pondérés par la fréquence")
    fam: dict[str, float] = {}
    for p in post:
        fam[p["famille"]] = fam.get(p["famille"], 0) + p["mots_texte"] * p["freq"]
    n_dec = len({(p["scene"], p["choix"]) for p in post})
    for f, w in sorted(fam.items(), key=lambda x: -x[1]):
        print(f"   {f:12s} {w / n_dec:5.1f} mots/décision")

    print(f"\n■ TOP 20 DES TUNNELS POST-DÉCISION "
          f"(coût = taps × fréquence, pics exclus)")
    chers = sorted(ord_p, key=lambda p: (-p["taps"] * p["freq"], -p["mots_texte"]))[:20]
    for p in chers:
        pal = f" {p['palier']}" if p["palier"] else ""
        print(f"   {p['taps']} tap × {p['freq']:.2f} · {p['mots_texte']:3d} mots · "
              f"{p['scene']}/{p['choix']}{pal}")

    print(f"\n■ TOP 20 DES TUNNELS D'ARRIVÉE")
    for a in sorted([a for a in arriv if not a["pic"]],
                    key=lambda a: (-a["taps"], -a["mots"]))[:20]:
        print(f"   {a['taps']} tap · {a['mots']:3d} mots · {a['scene']}")

    inst = {
        "post_moyenne": round(moy, 3),
        "post_distribution": {str(k): round(v, 1) for k, v in dist_p.items()},
        "arrivee_moyenne": round(statistics.mean(ta), 3),
        "arrivee_distribution": {str(k): round(v, 1) for k, v in distribution(ta).items()},
        "familles": {f: round(w / n_dec, 2) for f, w in fam.items()},
        "p95": tri[int(.95 * len(tri))], "max": max(tp),
        "cas": len(post), "lieux": len(arriv),
    }
    if sortie_json:
        Path(sortie_json).write_text(json.dumps(inst, ensure_ascii=False, indent=2), encoding="utf8")
        print(f"\n   instantané écrit : {sortie_json}")
    return inst


# ─── LES TROIS ÉCHECS VOLONTAIRES (§5.3) ───────────────────────────────────
def preuves() -> int:
    """Prouver que l'estimateur DÉTECTE les erreurs de comptage.

    Un outil de mesure qu'on n'a pas vu échouer ne vaut rien : quatre
    extracteurs de ce projet rendaient zéro signalement parce qu'ils ne
    lisaient rien. On injecte donc les trois fautes réellement commises.
    """
    src = sans_commentaires(SD.read_text(encoding="utf8"))
    ok = True

    print("PREUVE 1 — les branches EXCLUSIVES ne s'additionnent pas")
    sc = lire_scenes(src)
    cible = next((s for s in sc.values() if s["narration"] and s["narrationEchec"]), None)
    if not cible:
        print("   ⚠️ aucune scène à deux branches — preuve impossible"); ok = False
    else:
        vu = sum(mots(t) for t in cible["narration"])
        faux = vu + sum(mots(t) for t in cible["narrationEchec"])
        compte = sum(b[1] for b in blocs_arrivee(cible) if b[0] == "narration")
        print(f"   {cible['id']} : branche jouée {vu} mots · somme fautive {faux}")
        print(f"   l'estimateur compte {compte} → "
              f"{'CORRECT' if compte == vu else 'FAUTE NON DÉTECTÉE'}")
        ok &= compte == vu

    print("\nPREUVE 2 — le MOBILIER d'interface ne pèse pas comme de la prose")
    reg = next((s for s in sc.values() if s["registre"]), None)
    if not reg:
        print("   ⚠️ aucune scène de Registre"); ok = False
    else:
        blocs = blocs_arrivee(reg)
        poids_mob = sum(b[1] for b in blocs if b[0] == "mobilier")
        print(f"   {reg['id']} : le tableau du Registre pèse {poids_mob} "
              f"→ {'CORRECT' if poids_mob == 0 else 'FAUTE NON DÉTECTÉE'}")
        ok &= poids_mob == 0

    print("\nPREUVE 3 — l'appariement choix → conséquence ne dérive pas")
    # On injecte le bug : « dernier id vu avant » au lieu de l'objet englobant.
    faux_paires, vraies = 0, 0
    for sid, s in sc.items():
        for ch in s["choix"]:
            if not ch["consequence"]:
                continue
            vraies += 1
    # Reproduction du bug sur la source, pour comparaison.
    ids_avant = []
    for m in re.finditer(rf'(?:\n\s*id: "([a-z0-9-]+)")|(?:\bconsequence:\s*{LITT})', src):
        if m.group(1):
            ids_avant.append(m.group(1))
        elif ids_avant:
            faux_paires += 1
    doublons = {}
    for s in sc.values():
        for ch in s["choix"]:
            if ch["consequence"]:
                doublons[ch["consequence"]] = doublons.get(ch["consequence"], 0) + 1
    dups = sum(1 for v in doublons.values() if v > 1)
    print(f"   {vraies} conséquences appariées par OBJET · "
          f"{dups} texte(s) partagé(s) entre deux choix")
    print(f"   → {'CORRECT' if dups <= 1 else 'DOUBLONS ANORMAUX'} "
          f"(1 doublon connu et voulu : le Fossoyeur, présent dans deux scènes)")
    ok &= dups <= 1

    print(f"\n{'✓ les trois preuves passent' if ok else '✗ une preuve a échoué'}")
    return 0 if ok else 1


def main() -> int:
    if "--preuves" in sys.argv:
        return preuves()
    src = sans_commentaires(SD.read_text(encoding="utf8"))
    scenes = lire_scenes(src)
    if len(scenes) < 50:
        print(f"⚠️ {len(scenes)} scènes seulement — analyseur cassé, ne rien conclure.")
        return 2
    j = None
    if "--json" in sys.argv:
        j = sys.argv[sys.argv.index("--json") + 1]
    rapport(scenes, j)
    return 0


if __name__ == "__main__":
    sys.exit(main())
