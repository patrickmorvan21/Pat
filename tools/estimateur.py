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
from attribution import mesures  # noqa: E402

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





def lire_points(src: str) -> dict[str, list[tuple[int, int]]]:
    """{scène → [(mots de la marche, mots de l'examen)]}.

    Un point d'intérêt est une SÉQUENCE À PART ENTIÈRE : on le choisit (c'est
    une décision), puis on marche jusqu'à lui et on l'examine (ce sont des
    taps), puis on revient à l'écran du lieu. Les oublier ôtait du modèle les
    séquences les plus longues de la zone — l'examen pèse en moyenne 49 mots,
    plus que n'importe quelle autre famille sauf la narration.
    """
    bornes = [(m.start(), m.group(1)) for m in re.finditer(r'\n    id: "([a-z0-9-]+)"', src)]
    out: dict[str, list[tuple[int, int]]] = {}
    for i, (pos, sid) in enumerate(bornes):
        fin = bornes[i + 1][0] if i + 1 < len(bornes) else len(src)
        bloc = src[pos:fin]
        pts = []
        for m in re.finditer(r'\n\s+approche:\s*(' + LITT + r')[\s\S]*?'
                             r'\n\s+examen:\s*(' + LITT + r')', bloc):
            pts.append((mots(concat(m.group(1))), mots(concat(m.group(2)))))
        if pts:
            out[sid] = pts
    return out


# ═══ LA CALIBRATION — mesurée sur les vies enregistrées, jamais postulée ═══
#
# ⚠️ CONVENTION DE COMPTAGE, à tenir des deux côtés sous peine de décalage
# d'une unité sur TOUTE mesure : un « tap » est un écran de TEXTE. Le dernier
# écran d'une séquence porte les choix, et le joueur le touche quand même pour
# finir la frappe. C'est ce que comptent les transcripts, donc c'est ce que
# compte l'estimateur. (Un joueur très patient qui attend la fin de la frappe
# en dépense un de moins ; la borne haute est la bonne pour un outil qui
# cherche les tunnels.)
#
# ⚠️ CE QUE LA CALIBRATION VAUT. Les fréquences d'injection reposent sur
# 25 arrivées : ±15 points d'incertitude chacune. Elles PONDÈRENT, elles
# n'affirment pas. Le chiffre qui valide le modèle est l'agrégat, assis sur
# 122 séquences — et c'est lui qu'on compare en fin de rapport.

FIXES = {
    "arrivée": {"approche", "narration"},
    "croisée": {"croisée", "conséquence", "issue"},
    "sur place": {"narration", "conséquence", "issue", "point · marche", "point · examen"},
}


def options(m: dict, typ: str) -> list[tuple[str, float, int]]:
    """Les blocs OPTIONNELS d'un type de séquence : (famille, fréquence, mots).

    Tout ce que la mesure a vu apparaître et que le modèle ne pose pas
    lui-même. « ? » est écarté : ce sont les 3 % de paragraphes composés à
    l'exécution qu'on n'a pas su rattacher — les compter serait ajouter du
    poids sans savoir lequel.
    """
    out = []
    for fam, fr in sorted(m["types"][typ]["freq"].items(), key=lambda x: -x[1]):
        if fam in FIXES[typ] or fam == "?":
            continue
        w = round(m["mots_quand_present"].get(fam, 25))
        if fam == "geôlier":
            w += CHROME_GEOLIER
        out.append((fam, fr, w))
    return out


def loi(fixes: list, opts: list[tuple[str, float, int]]) -> dict[int, float]:
    """La LOI du nombre d'écrans, en énumérant les 2^n mondes possibles.

    ⚠️ On rend une DISTRIBUTION, pas une moyenne — et c'est le correctif qui
    a fait converger la part « à un tap ou moins ». Comparer une espérance
    ARRONDIE (1,4 → 1) à des réalisations entières est une faute de méthode :
    elle écrasait 22 points d'écart en donnant 52 % de séquences à un tap là
    où les vies en comptent 29 %. Une séquence qui coûte 1,4 tap en moyenne
    ne coûte JAMAIS 1,4 tap : elle en coûte 1 six fois sur dix et 2 le reste
    du temps, et c'est cette forme-là qu'on compare.

    ⚠️ On ne multiplie JAMAIS un écran par une probabilité. Un bloc qui tombe
    à 12 % et fait basculer un écran ne coûte pas 0,12 écran partout : il
    coûte un écran entier, 12 % du temps. La différence change le classement
    des tunnels, donc ce qu'on irait couper.

    Approximation assumée : les blocs optionnels sont empilés APRÈS les blocs
    fixes, alors que le client en insère certains au milieu. Ça ne change le
    nombre d'écrans que sur les rares cas à la frontière du budget.
    """
    d: dict[int, float] = {}
    for masque in range(1 << len(opts)):
        p = 1.0
        blocs = list(fixes)
        for i, (fam, fr, w) in enumerate(opts):
            if masque >> i & 1:
                p *= fr
                blocs.append((fam, w, ""))
            else:
                p *= 1 - fr
        if p > 1e-9:
            n = len(decouper(blocs))
            d[n] = d.get(n, 0.0) + p
    return d


def moyenne(d: dict[int, float]) -> float:
    return sum(n * p for n, p in d.items()) / (sum(d.values()) or 1)


def successeur(sc: dict, ch: dict) -> str | None:
    if ch["toScene"]:
        return ch["toScene"]
    if ch["sortie"] or ch["orient"]:
        return None  # la traversée décide : c'est une Croisée
    return sc["chainNext"]


def latences(scenes: dict, points: dict, m: dict) -> dict[str, list[dict]]:
    """Les trois latences, séparées — les mélanger ferait couper le mauvais texte.

      · ARRIVÉE   — de la direction choisie à la première décision du lieu ;
      · SUR PLACE — d'un choix résolu à la décision suivante, sans quitter ;
      · CROISÉE   — d'un choix de sortie aux deux boutons d'orientation.
    Un POINT D'INTÉRÊT est compté à part : il est choisi comme une action,
    mais ce qu'il rend est une marche et un examen.
    """
    o = {t: options(m, t) for t in FIXES}
    seqs: dict[str, list[dict]] = {"arrivée": [], "sur place": [], "croisée": [], "point": []}

    for sid, sc in scenes.items():
        pic = bool(PICS.search(sid))
        if sc["choix"]:
            fixes = [("approche", round(m["mots_quand_present"]["approche"]), "")]
            fixes += [("narration", mots(t), t) for t in sc["narration"]]
            seqs["arrivée"].append({
                "scene": sid, "loi": loi(fixes, o["arrivée"]), "freq": 1.0,
                "fixes": fixes, "opts": o["arrivée"],
                "mots": sum(b[1] for b in fixes), "famille": "narration", "pic": pic})
        for marche, examen in points.get(sid, []):
            fixes = [("point · marche", marche, ""), ("point · examen", examen, "")]
            seqs["point"].append({
                "scene": sid, "loi": loi(fixes, o["sur place"]), "freq": 1.0,
                "fixes": fixes, "opts": o["sur place"],
                "mots": marche + examen, "famille": "point · examen", "pic": pic})

        for ch in sc["choix"]:
            if ch["orient"] or ch["locked"]:
                continue
            suiv = successeur(sc, ch)
            if sc["sejour"] and not ch["sortie"]:
                typ, suite = "sur place", []
            elif suiv in scenes:
                typ = "sur place"
                suite = [("narration", mots(t), t) for t in scenes[suiv]["narration"]]
            else:
                typ = "croisée"
                suite = [("croisée", round(m["mots_quand_present"]["croisée"]), "")]

            def cas(txt: str, fam: str, freq: float, palier: str | None) -> None:
                fixes = [(fam, mots(txt), txt)] + suite
                seqs[typ].append({
                    "scene": sid, "choix": ch["id"], "palier": palier, "famille": fam,
                    "loi": loi(fixes, o[typ]), "freq": freq,
                    "fixes": fixes, "opts": o[typ],
                    "mots": mots(txt), "pic": pic})

            if ch["issues"]:
                for i, t in enumerate(ch["issues"]):
                    pal = ["critique", "réussite", "échec", "funeste"][i]
                    cas(t, "issue", FREQ_PALIER[pal], pal)
            elif ch["consequence"]:
                cas(ch["consequence"], "conséquence", 1.0, None)
            else:
                cas("", "neutre", 1.0, None)
    return seqs


def distribution(xs: list[float], poids: list[float]) -> dict[int, float]:
    tot = sum(poids) or 1
    d: dict[int, float] = {}
    for x, p in zip(xs, poids):
        d[min(int(round(x)), 4)] = d.get(min(int(round(x)), 4), 0) + p
    return {k: 100 * v / tot for k, v in sorted(d.items())}


def rapport(scenes: dict, points: dict, m: dict, sortie_json: str | None) -> dict:
    seqs = latences(scenes, points, m)
    print("L'ESTIMATEUR DÉTERMINISTE — espérance de latence, aucun tirage\n")

    print("■ LES TROIS LATENCES — modèle contre vies enregistrées")
    print(f"   {'':12s}  {'modèle':>8s}  {'mesuré':>8s}  {'écart':>7s}   (n)")
    corresp = {"arrivée": "arrivée", "croisée": "croisée",
               "sur place": "sur place", "point": "sur place"}
    inst_types = {}
    for typ, L in seqs.items():
        if not L:
            continue
        mod = (sum(moyenne(x["loi"]) * x["freq"] for x in L)
               / sum(x["freq"] for x in L))
        obs = m["types"][corresp[typ]]["taps_moyens"]
        n = m["types"][corresp[typ]]["n"]
        marque = "  ← même mesure que « sur place »" if typ == "point" else ""
        print(f"   {typ:12s}  {mod:8.2f}  {obs:8.2f}  {mod-obs:+7.2f}   ({n}){marque}")
        inst_types[typ] = round(mod, 3)

    # L'agrégat : on pondère les types par leur fréquence OBSERVÉE dans les
    # vies. C'est la seule pondération honnête — le modèle sait ce que coûte
    # chaque type, il ne sait pas à quelle fréquence une vie les enchaîne.
    parts = poids_des_types(m)
    d: dict[int, float] = {}
    poids_tot = 0.0
    for typ, L in seqs.items():
        if not L:
            continue
        w = parts[typ] / len(L)
        for x in L:
            pw = x["freq"] * w
            poids_tot += pw
            for n, p in x["loi"].items():
                d[min(n, 4)] = d.get(min(n, 4), 0.0) + pw * p
    d = {k: 100 * v / poids_tot for k, v in sorted(d.items())}
    glob = sum(k * v for k, v in d.items()) / 100
    un = sum(v for k, v in d.items() if k <= 1)
    g = m["global"]
    print(f"\n■ AGRÉGAT — {glob:.2f} tap(s) contre {g['taps_moyens']:.2f} mesuré "
          f"({glob - g['taps_moyens']:+.2f})")
    print(f"   à un tap ou moins : {un:.1f} % contre {100*g['part_1_ou_moins']:.1f} % "
          f"({un - 100*g['part_1_ou_moins']:+.1f} pt)")
    for k, v in d.items():
        obs = 100 * g["distribution"].get(k, 0)
        lib = f"{k}+" if k == 4 else str(k)
        print(f"     {lib} tap : modèle {v:5.1f} %  · mesuré {obs:5.1f} %   {'█'*round(v/3)}")

    print("\n■ CE QUE COÛTE CHAQUE FAMILLE — mots lus par séquence, "
          "pondérés par la fréquence du palier")
    fam: dict[str, float] = {}
    for L in seqs.values():
        for x in L:
            fam[x["famille"]] = fam.get(x["famille"], 0) + x["mots"] * x["freq"]
    n_seq = sum(len(L) for L in seqs.values())
    for f, w in sorted(fam.items(), key=lambda x: -x[1]):
        print(f"   {f:16s} {w / n_seq:5.1f} mots/séquence")

    print("\n■ LES TUNNELS — coût = espérance de taps × fréquence réelle "
          "(pics exclus)")
    for typ, L in seqs.items():
        chers = sorted([x for x in L if not x["pic"]],
                       key=lambda x: (-moyenne(x["loi"]) * x["freq"], -x["mots"]))[:8]
        print(f"\n   ── {typ.upper()}")
        for x in chers:
            qui = x.get("choix", "—")
            pal = f" {x['palier']}" if x.get("palier") else ""
            print(f"      {moyenne(x['loi']):.2f} tap × {x['freq']:.2f} · {x['mots']:3d} mots · "
                  f"{x['scene']}/{qui}{pal}")

    inst = {"agregat": round(glob, 3), "part_1_ou_moins": round(un, 1),
            "mesure": {"agregat": round(g["taps_moyens"], 3),
                       "part_1_ou_moins": round(100 * g["part_1_ou_moins"], 1)},
            "types": inst_types,
            "familles": {f: round(w / n_seq, 2) for f, w in fam.items()}}
    if sortie_json:
        Path(sortie_json).write_text(json.dumps(inst, ensure_ascii=False, indent=2),
                                     encoding="utf8")
        print(f"\n   instantané écrit : {sortie_json}")
    return inst


# ─── LES ÉCHECS VOLONTAIRES ────────────────────────────────────────────────
def preuves() -> int:
    """Prouver que l'outil DÉTECTE les fautes — sinon il ne vaut rien.

    Quatre extracteurs de ce projet ont rendu zéro signalement parce qu'ils ne
    lisaient rien. On injecte donc les fautes réellement commises, et on
    vérifie que chacune se voit.
    """
    src = sans_commentaires(SD.read_text(encoding="utf8"))
    sc = lire_scenes(src)
    ok = True

    print("PREUVE 1 — les branches EXCLUSIVES ne s'additionnent pas")
    cible = next((s for s in sc.values() if s["narration"] and s["narrationEchec"]), None)
    if not cible:
        print("   ⚠️ aucune scène à deux branches — preuve impossible"); ok = False
    else:
        vu = sum(mots(t) for t in cible["narration"])
        faux = vu + sum(mots(t) for t in cible["narrationEchec"])
        compte = sum(mots(t) for t in cible["narration"])
        print(f"   {cible['id']} : branche jouée {vu} mots · somme fautive {faux} · "
              f"compté {compte} → {'CORRECT' if compte == vu else 'FAUTE NON DÉTECTÉE'}")
        ok &= compte == vu

    print("\nPREUVE 2 — le MOBILIER ne pèse pas comme de la prose")
    prose = [("narration", 88, "")]
    avec = decouper(prose + [("mobilier", 0, "")])
    faux = decouper(prose + [("mobilier", 30, "")])
    print(f"   88 mots + un tableau : {len(avec)} écran(s) si le mobilier pèse 0, "
          f"{len(faux)} s'il pèse 30")
    print(f"   → {'CORRECT' if len(avec) == 1 and len(faux) == 2 else 'FAUTE NON DÉTECTÉE'}")
    ok &= len(avec) == 1 and len(faux) == 2

    print("\nPREUVE 3 — l'appariement choix → conséquence ne dérive pas")
    doublons: dict[str, int] = {}
    for s in sc.values():
        for ch in s["choix"]:
            if ch["consequence"]:
                doublons[ch["consequence"]] = doublons.get(ch["consequence"], 0) + 1
    dups = sum(1 for v in doublons.values() if v > 1)
    print(f"   {sum(doublons.values())} conséquences appariées par OBJET · "
          f"{dups} texte(s) partagé(s) → "
          f"{'CORRECT' if dups <= 1 else 'DOUBLONS ANORMAUX'}")
    print("   (1 doublon connu et voulu : le Fossoyeur, présent dans deux scènes)")
    ok &= dups <= 1

    print("\nPREUVE 4 — la calibration porte réellement le résultat")
    # Si l'on retire les injections mesurées, l'agrégat doit S'EFFONDRER. Sans
    # ce contrôle, on ne saurait pas si le modèle converge grâce à sa
    # calibration ou malgré elle.
    m = mesures()
    pts = lire_points(src)
    vrai = agregat(latences(sc, pts, m), m)
    m_nu = json.loads(json.dumps(m))
    for t in m_nu["types"]:
        m_nu["types"][t]["freq"] = {f: v for f, v in m_nu["types"][t]["freq"].items()
                                    if f in FIXES.get(t, set())}
    nu = agregat(latences(sc, pts, m_nu), m_nu)
    ecart = vrai - nu
    print(f"   avec les injections {vrai:.2f} tap · sans elles {nu:.2f} tap "
          f"(écart {ecart:+.2f})")
    print(f"   → {'CORRECT' if ecart > 0.25 else 'LA CALIBRATION NE SERT À RIEN'}")
    ok &= ecart > 0.25

    print("\nPREUVE 5 — la vérification séquence par séquence est SÉLECTIVE")
    # Un contrôle qui passerait quel que soit le réglage ne prouverait rien.
    # On fausse le budget d'écran et l'on exige que le taux s'effondre.
    import io
    import contextlib
    global MOTS_PAR_ECRAN
    vrai = MOTS_PAR_ECRAN
    taux = {}
    for b in (70, 90, 110):
        MOTS_PAR_ECRAN = b
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            verifier()
        taux[b] = float(re.search(r"\((\d+) %\)", buf.getvalue()).group(1))
    MOTS_PAR_ECRAN = vrai
    print(f"   budget 70 → {taux[70]:.0f} % · budget 90 (le vrai) → {taux[90]:.0f} % "
          f"· budget 110 → {taux[110]:.0f} %")
    sel = taux[90] == 100 and taux[70] < 80 and taux[110] < 80
    print(f"   → {'CORRECT' if sel else 'LE CONTRÔLE NE DISCRIMINE RIEN'}")
    ok &= sel

    print(f"\n{'✓ les cinq preuves passent' if ok else '✗ une preuve a échoué'}")
    return 0 if ok else 1


def poids_des_types(m: dict) -> dict[str, float]:
    """La part de chaque type de séquence dans une vie, mesurée.

    ⚠️ Le piège corrigé ici : les séquences d'examen d'un point d'intérêt
    SONT comptées par les transcripts parmi les « sur place ». Donner la part
    entière des sur-place à la fois à la liste des choix et à celle des points
    doublait la masse du type le moins coûteux, et tirait tout l'agrégat vers
    le bas. On la PARTAGE selon la proportion mesurée de séquences où un
    examen apparaît.
    """
    p = {t: m["types"][t]["n"] / m["global"]["sequences"] for t in FIXES}
    r = m["types"]["sur place"]["freq"].get("point · examen", 0.0)
    return {"arrivée": p["arrivée"], "croisée": p["croisée"],
            "sur place": p["sur place"] * (1 - r), "point": p["sur place"] * r}


def agregat(seqs: dict, m: dict) -> float:
    parts = poids_des_types(m)
    num = den = 0.0
    for typ, L in seqs.items():
        if not L:
            continue
        w = parts[typ] / len(L)
        for x in L:
            num += moyenne(x["loi"]) * x["freq"] * w
            den += x["freq"] * w
    return num / den




# ─── LA VÉRIFICATION SÉQUENCE PAR SÉQUENCE ─────────────────────────────────
def verifier(n_max: int = 0) -> int:
    """Rejouer chaque séquence RÉELLE dans la règle de découpage du client.

    C'est le contrôle le plus dur du dispositif, et le plus utile : il ne
    dépend d'AUCUNE probabilité. On prend les paragraphes exactement tels
    qu'ils sont tombés dans la vie enregistrée, on les passe dans
    `decouper()`, et on exige le même nombre d'écrans que le joueur a
    réellement touchés. Si ça tombe juste, la pagination du modèle est exacte
    et la seule incertitude qui reste est la calibration des injections.
    """
    import attribution as A
    idx = A.index_sources()
    total = exact = 0
    ecarts: list[tuple[str, int, int, list[str]]] = []
    par_type: dict[str, list[int]] = {}
    for f in A.transcripts_par_defaut():
        for s in A.sequences(A.ecrans(f.read_text(encoding="utf8"))):
            vus = len(s["lectures"])
            if not vus:
                continue
            blocs = []
            fams = []
            for e in s["lectures"]:
                for fam, txt, m in A.attribue(e["paras"], idx):
                    # Le bandeau du Geôlier pèse ses mots PLUS son chrome :
                    # c'est la règle du client, pas un ajustement.
                    blocs.append((fam, m + (CHROME_GEOLIER if fam == "geôlier" else 0), txt))
                    fams.append(fam)
            calc = len(decouper(blocs))
            typ = ("arrivée" if "approche" in fams
                   else "croisée" if "croisée" in fams else "sur place")
            par_type.setdefault(typ, []).append(calc - vus)
            total += 1
            if calc == vus:
                exact += 1
            else:
                ecarts.append((f.name, vus, calc, fams))

    print("VÉRIFICATION — les séquences réelles repassées dans la règle du client\n")
    print(f"■ {exact}/{total} séquences retrouvées AU NOMBRE D'ÉCRANS PRÈS "
          f"({100*exact/total:.0f} %)")
    for typ, d in sorted(par_type.items()):
        justes = sum(1 for x in d if x == 0)
        print(f"   {typ:11s} {justes:3d}/{len(d):3d} exactes · "
              f"biais moyen {sum(d)/len(d):+.2f} écran")
    if ecarts:
        print(f"\n■ LES {len(ecarts)} ÉCARTS — vus / calculés / composition")
        for nom, vus, calc, fams in ecarts[:n_max or 15]:
            print(f"   {nom[:22]:22s} {vus} vus · {calc} calculés · "
                  f"{' · '.join(fams)}")
    return 0 if exact / total >= 0.85 else 1



# ─── LE CLASSEMENT PAR COÛT RÉEL ───────────────────────────────────────────
TRANCHE = 10  # mots retirés, pour comparer tous les textes au même geste


def gains(scenes: dict, points: dict, m: dict) -> int:
    """Classer les textes par ce que COÛTE réellement leur longueur.

    La question du chantier n'est pas « quel texte est long » mais « quel
    texte fait payer un écran de plus ». Les deux ne se recouvrent pas : un
    paragraphe de 90 mots seul sur son écran ne coûte rien à raccourcir, un
    paragraphe de 30 mots qui fait déborder son écran coûte un tap entier.

    On mesure donc le GAIN MARGINAL : ce qu'on gagne en retirant dix mots à
    CE texte-là, toutes choses égales par ailleurs, pondéré par la fréquence
    réelle à laquelle il s'affiche. Les pics restent exclus : ils ont le droit
    d'être longs.
    """
    seqs = latences(scenes, points, m)
    parts = poids_des_types(m)
    lignes = []
    for typ, L in seqs.items():
        if not L:
            continue
        w = parts[typ] / len(L)
        for x in L:
            if x["pic"]:
                continue
            avant = moyenne(x["loi"])
            for i, (fam, mo, txt) in enumerate(x["fixes"]):
                if mo <= TRANCHE or not txt:
                    continue
                court = list(x["fixes"])
                court[i] = (fam, mo - TRANCHE, txt)
                apres = moyenne(loi(court, x["opts"]))
                g = (avant - apres) * x["freq"] * w
                if g > 1e-6:
                    lignes.append({
                        "gain": g, "delta": avant - apres, "freq": x["freq"],
                        "type": typ, "famille": fam, "mots": mo,
                        "scene": x["scene"], "choix": x.get("choix", "—"),
                        "palier": x.get("palier"), "extrait": txt[:64],
                    })
    lignes.sort(key=lambda l: -l["gain"])

    print(f"CLASSEMENT PAR COÛT RÉEL — gain de {TRANCHE} mots retirés, "
          f"pondéré par la fréquence\n")
    print("■ CE QU'IL FAUT COUPER EN PREMIER")
    print(f"   {'gain':>7s} {'Δtap':>6s} {'freq':>5s} {'mots':>5s}  où")
    for l in lignes[:30]:
        pal = f" {l['palier']}" if l["palier"] else ""
        print(f"   {1000*l['gain']:7.2f} {l['delta']:6.2f} {l['freq']:5.2f} {l['mots']:5d}  "
              f"{l['famille']:14s} {l['scene']}/{l['choix']}{pal}")
    print("   (gain en millièmes de tap par séquence de la vie moyenne)")

    par_fam: dict[str, float] = {}
    for l in lignes:
        par_fam[l["famille"]] = par_fam.get(l["famille"], 0) + l["gain"]
    print("\n■ OÙ EST LE GISEMENT, PAR FAMILLE")
    tot = sum(par_fam.values()) or 1
    for f, g in sorted(par_fam.items(), key=lambda x: -x[1]):
        n = sum(1 for l in lignes if l["famille"] == f)
        print(f"   {f:16s} {100*g/tot:5.1f} % du gain · {n:3d} textes concernés")
    inertes = sum(1 for typ, L in seqs.items() for x in L
                  for fam, mo, txt in x["fixes"] if txt and mo > TRANCHE)
    print(f"\n   {len(lignes)} textes sur {inertes} font gagner quelque chose : "
          f"{100*len(lignes)/max(1,inertes):.0f} %.")
    print("   Les autres peuvent être raccourcis sans qu'un seul tap tombe — "
          "c'est de\n   l'écriture, plus du rythme.")
    return 0


# ─── LES LEVIERS — ce qui ferait vraiment tomber un tap ────────────────────
def leviers(scenes: dict, points: dict, m: dict) -> int:
    """Comparer les deux leviers possibles : couper la prose, ou injecter moins.

    ⚠️ C'est le résultat le plus contre-intuitif de l'outil, et le plus utile.
    Ramener TOUTE la narration de la zone sous 65 mots ne fait tomber que
    0,05 tap ; les blocs injectés à l'arrivée en pèsent dix fois plus. La
    longueur des textes n'est pas ce qui retarde la décision — c'est le
    NOMBRE de blocs empilés avant elle.
    """
    import copy
    base = agregat(latences(scenes, points, m), m)
    print(f"LES LEVIERS — agrégat courant {base:.2f} tap\n")

    print("■ COUPER LA PROSE — plafond appliqué à toute narration hors pic")
    for plafond in (85, 75, 65, 55):
        sc2 = copy.deepcopy(scenes)
        n = 0
        for sid, sc in sc2.items():
            if PICS.search(sid):
                continue
            tot = sum(mots(t) for t in sc["narration"])
            if tot > plafond:
                f = plafond / tot
                n += 1
                sc["narration"] = [" ".join(t.split()[:max(1, int(mots(t) * f))])
                                   for t in sc["narration"]]
        a = agregat(latences(sc2, points, m), m)
        print(f"   {plafond:3d} mots · {n:2d} scènes raccourcies → "
              f"{a:.2f} tap ({a - base:+.2f})")

    print("\n■ INJECTER MOINS — ce que coûte chaque bloc ajouté à l'exécution")
    res = []
    fams = set()
    for t in m["types"].values():
        fams |= set(t["freq"])
    for f in sorted(fams - {"?"}):
        m2 = copy.deepcopy(m)
        for t in m2["types"].values():
            t["freq"].pop(f, None)
        a = agregat(latences(scenes, points, m2), m2)
        if base - a > 0.001:
            res.append((base - a, f))
    for d, f in sorted(res, reverse=True):
        print(f"   {d:+.3f} tap   {f}")
    print(f"\n   les injections pèsent {sum(d for d, _ in res):.2f} tap au total, "
          f"soit\n   dix fois ce que rapporterait de couper toute la prose de la zone.")
    return 0


def main() -> int:
    if "--preuves" in sys.argv:
        return preuves()
    if "--verifier" in sys.argv:
        return verifier()
    src = sans_commentaires(SD.read_text(encoding="utf8"))
    scenes = lire_scenes(src)
    points = lire_points(src)
    if len(scenes) < 50 or len(points) < 8:
        print(f"⚠️ {len(scenes)} scènes / {len(points)} lieux à points — "
              f"analyseur cassé, ne rien conclure.")
        return 2
    m = mesures()
    if "--gains" in sys.argv:
        return gains(scenes, points, m)
    if "--leviers" in sys.argv:
        return leviers(scenes, points, m)
    j = sys.argv[sys.argv.index("--json") + 1] if "--json" in sys.argv else None
    rapport(scenes, points, m, j)
    return 0


if __name__ == "__main__":
    sys.exit(main())
