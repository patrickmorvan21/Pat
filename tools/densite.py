#!/usr/bin/env python3
"""
AUDIT DE DENSITÉ DE TEXTE — la doctrine du 4/08, mesurée au lieu d'être débattue.

Deux règles à vérifier, jamais à l'œil :
  1. La grille de la spec (§C 4/08, en SIGNES) : arrivée 350-500 · beat 200-350
     · résolution 100-250 · examen de point 250-450.
  2. La règle des micro-beats (retour externe 4/08, en MOTS) : jamais plus de
     100-120 mots ininterrompus avant un geste. L'unité de lecture ininterrompue
     est L'ÉCRAN (les paragraphes s'enchaînent seuls à la frappe) — pas le
     paragraphe.

La profondeur OPTIONNELLE (examens de points d'intérêt) a le droit d'être
riche : elle est mesurée à part et ne compte jamais comme dépassement.

Usage : python3 tools/densite.py [--verbose]
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import studio_data as sd  # noqa: E402  (le parseur .ts éprouvé)

TS = Path(__file__).resolve().parent.parent / "aldenhar/lib/scene-data.ts"

# Seuil de la règle des micro-beats, en mots, par écran OBLIGATOIRE.
# ⚠️ GRILLE DE PRODUCTION recalée en Phase B (plan d'élagage, 11/08) :
#   écran courant       25-60 mots
#   moment important    60-90
#   exception de mise en scène   > 90, et il faut que ça se mérite
# Le seuil dur reste celui du DÉCOUPAGE runtime (`decouperEnEcrans`, 90 mots
# par écran) : au-delà, un texte devient deux écrans — ce n'est pas un mur,
# c'est une séquence. Le garde signale donc les dépassements de la bande
# « important », pas seulement les murs.
SEUIL_ECRAN = 90
# Plafond de SOURCE : au-delà, aucune pagination ne sauve la scène (elle ferait
# trois écrans pour une seule décision). 90 reste le budget d'un ÉCRAN.
PLAFOND_SCENE = 120
BANDE_COURANT = 60


def mots(t: str) -> int:
    return len(t.split())


BUDGET_ECRAN = 90  # doit rester égal au budget de `decouperEnEcrans` (Scene.tsx)


def _pagine(paras: list[str]) -> int:
    """Reproduit `decouperEnEcrans` : on coupe AVANT le bloc qui déborderait."""
    mots, n = 0, 1
    for p in paras:
        m = len(p.split())
        if mots and mots + m > BUDGET_ECRAN:
            n += 1
            mots = m
        else:
            mots += m
    return n


def ecrans_par_visite(src: str) -> None:
    """LA MESURE QUI COMPTE pour la Phase B : combien d'écrans une VISITE joue.

    ⚠️ Deux erreurs d'estimation ont faussé cette mesure avant qu'elle n'entre
    ici, et c'est pour ça qu'elle y entre :
      1. additionner toutes les scènes d'un lieu compte des branches
         EXCLUSIVES (les sept accueils du hameau alternent, on n'en joue
         qu'un) — on suit donc la chaîne `chainNext` depuis la destination ;
      2. compter « 2 écrans par point d'intérêt » est faux : l'approche et
         l'examen sont poussés dans le MÊME lot, donc repaginés au budget —
         un point court tient sur un seul écran. C'est cette erreur-là qui a
         fait croire à une médiane de 8 alors qu'elle est à 5.
    Une mesure qu'on refait de tête se refait fausse. Elle vit ici désormais.
    """
    import json as _json
    from statistics import median

    chemin = Path(__file__).resolve().parent.parent / "data/studio-data.json"
    if not chemin.exists():
        return
    d = _json.loads(chemin.read_text(encoding="utf8"))
    par_id = {s["id"]: s for s in d["scenes"]}

    m = re.search(r"const APPROACH[^=]*=\s*\{", src)
    if not m:
        return
    i = src.index("{", m.start())
    prof, fin = 0, len(src)
    for q in range(i, len(src)):
        if src[q] == "{":
            prof += 1
        elif src[q] == "}":
            prof -= 1
            if prof == 0:
                fin = q
                break
    dests = re.findall(r'\n  "?([a-z0-9-]+)"?\s*:', src[i:fin])

    def ecrans(s: dict) -> int:
        n = _pagine(s.get("narration", []))
        for p in s.get("pointsInteret", []):
            n += _pagine([t for t in (p.get("approche"), p.get("examen")) if t])
        return n

    lignes = []
    for dest in dests:
        vus, cur, tot, dec = set(), dest, 0, 0
        while cur and cur in par_id and cur not in vus:
            vus.add(cur)
            s = par_id[cur]
            tot += ecrans(s)
            dec += len([c for c in s.get("choix", []) if c.get("type") != "suite"])
            cur = s.get("suite")
        lignes.append((tot, dest, dec))
    lignes.sort(reverse=True)
    vals = [x[0] for x in lignes]
    hors = [x for x in lignes if x[0] > 6]
    print(f"\nÉCRANS PAR VISITE (cible du plan d'élagage : 4 à 6) — {len(lignes)} destinations")
    print(f"  médiane {median(vals):.0f} · max {max(vals)} · au-dessus de 6 : {len(hors)}")
    for e, l, dec in hors:
        print(f"    {l:24s} {e:>3} écrans · {dec} décisions")


def main() -> int:
    verbose = "--verbose" in sys.argv
    strict = "--strict" in sys.argv
    src = TS.read_text(encoding="utf-8")
    bloc = sd.bloc_apres(src, r"const SCENES: Scene\[\] =")
    assert bloc, "SCENES introuvable"

    ecrans: list[tuple[str, int, int, int]] = []  # (id, mots, signes, nb paragraphes)
    examens: list[tuple[str, int]] = []
    paragraphes_longs: list[tuple[str, int]] = []

    for o in sd.objets_de_haut_niveau(bloc[0], 0):
        sid = sd.texte_de(o, "id")
        if not sid:
            continue
        narr = sd.bloc_apres(o, r"\n {4}narration:\s*")
        if narr:
            paras = sd.paragraphes(narr[0])
            total = " ".join(paras)
            ecrans.append((sid, mots(total), len(total), len(paras)))
            for i, p in enumerate(paras):
                if mots(p) > SEUIL_ECRAN:
                    paragraphes_longs.append((f"{sid} ¶{i + 1}", mots(p)))
        for p in sd.lire_pois(o):
            if p.get("examen"):
                examens.append((p["id"], mots(p["examen"])))
            # L'approche d'un point est un écran obligatoire une fois choisi.
            if p.get("approche") and mots(p["approche"]) > SEUIL_ECRAN:
                paragraphes_longs.append((f"{p['id']} (approche)", mots(p["approche"])))

    ecrans.sort(key=lambda e: -e[1])
    depassements = [e for e in ecrans if e[1] > SEUIL_ECRAN]
    tous = [e[1] for e in ecrans]
    from statistics import median

    print(f"ÉCRANS OBLIGATOIRES (narration) — {len(ecrans)} écrans")
    courant = [m for m in tous if m <= BANDE_COURANT]
    important = [m for m in tous if BANDE_COURANT < m <= SEUIL_ECRAN]
    exception = [m for m in tous if m > SEUIL_ECRAN]
    print(f"  médiane {median(tous):.0f} mots · max {max(tous)}")
    print(f"  ≤{BANDE_COURANT} courant : {len(courant)} · {BANDE_COURANT+1}-{SEUIL_ECRAN} important : {len(important)} · >{SEUIL_ECRAN} exception : {len(exception)}")
    print(f"  au-dessus du seuil : {len(depassements)} écran(s)")
    for sid, m, c, n in depassements:
        print(f"    {sid:28s} {m:>4} mots · {c:>4} signes · {n} ¶")
    if paragraphes_longs:
        print(f"\n  paragraphes seuls > {SEUIL_ECRAN} mots : {len(paragraphes_longs)}")
        for sid, m in paragraphes_longs:
            print(f"    {sid:34s} {m:>4} mots")

    ex = sorted((m for _, m in examens), reverse=True)
    print(f"\nEXAMENS DE POINTS (optionnels, droit d'être riches) — {len(examens)}")
    if ex:
        print(f"  médiane {median(ex):.0f} mots · max {ex[0]} (grille spec : 250-450 signes ≈ 40-75 mots)")

    ecrans_par_visite(src)

    # ── AUDIT DES RÉPÉTITIONS (retour test 4/08 : « je voyais le paquet de
    # cartes sous les Landes ») : toute PHRASE de 8 mots ou plus présente à
    # l'identique dans plusieurs textes est signalée. Les leitmotivs courts
    # (« la corde grince ») passent sous le seuil — c'est voulu : eux ont le
    # droit de revenir, les événements de voyage non.
    import re as _re
    from collections import Counter

    tous_textes: list[str] = []
    for o in sd.objets_de_haut_niveau(bloc[0], 0):
        narr = sd.bloc_apres(o, r"\n {4}narration:\s*")
        if narr:
            tous_textes.extend(sd.paragraphes(narr[0]))
        for pt in sd.lire_pois(o):
            for ch in ("approche", "examen"):
                if pt.get(ch):
                    tous_textes.append(pt[ch])
    # + les pools de liaison (ambiances, variantes, phrases d'approche)
    for motif in (r"const LIAISON_AMBIANCES: string\[\] =", r"const LIAISON_VARIANTS"):
        b2 = sd.bloc_apres(src, motif)
        if b2:
            tous_textes.extend(t for t in sd.chaines(b2[0]) if len(t.split()) >= 4)

    phrases = Counter()
    for t in tous_textes:
        for ph in _re.split(r"(?<=[.!?…])\s+", t):
            ph = ph.strip()
            if len(ph.split()) >= 8:
                phrases[ph] += 1
    doublons = [(ph, n) for ph, n in phrases.items() if n > 1]
    print(f"\nRÉPÉTITIONS VERBATIM (phrases ≥8 mots en ≥2 exemplaires) : {len(doublons)}")
    for ph, n in sorted(doublons, key=lambda x: -x[1])[:12]:
        print(f"  ×{n}  {ph[:86]}")

    # ── AUDIT DES TRANSITIONS (retour test 4/08 : « je voyais le paquet de
    # cartes sous les Landes »). Trois contrôles structurels sur les liaisons.
    liaisons = []
    for motif in (r"const LIAISON_AMBIANCES: string\[\] =", r"const LIAISON_VARIANTS"):
        b3 = sd.bloc_apres(src, motif)
        if b3:
            liaisons.extend(t for t in sd.chaines(b3[0]) if len(t.split()) >= 5)
    bif = sd.bloc_apres(src, r"const BIFURCATIONS: string\[\] =")
    bifs = sd.chaines(bif[0]) if bif else []
    ind = sd.bloc_apres(src, r"const INDICE_ROUTE: Record<string, string> =")
    indices = sd.chaines(ind[0]) if ind else []
    pool_dest = sd.bloc_apres(src, r"const APPROACH: Record<string, string> =")
    dests = [t for t in sd.chaines(pool_dest[0])] if pool_dest else []
    # 1 destination sur 2 dans APPROACH est une clé, l'autre un libellé
    cles_dest = dests[0::2]

    print("\nTRANSITIONS")
    trop = [t for t in liaisons if len(t.split()) > 60]
    print(f"  ambiances de liaison : {len(liaisons)} · au-dessus de 60 mots : {len(trop)}")
    for t in trop[:5]:
        print(f"    {len(t.split()):>3} mots — {t[:70]}")
    print(f"  phrases de bifurcation : {len(bifs)}")
    # ⚠️ Ce contrôle a crié au loup deux fois (25/07, puis 11/08) parce qu'il
    # comptait les littéraux et divisait par deux : une clé écrite SANS
    # guillemets (`campement:`) ne produit qu'une chaîne, et le total dérivait.
    # On apparie maintenant les CLÉS pour de vrai, et on nomme ce qui manque —
    # un compte qui ne dit pas QUOI il manque ne sert à personne.
    def cles_record(nom: str) -> set[str]:
        m = re.search(nom + r"[^=]*=\s*\{", src)
        if not m:
            return set()
        i = src.index("{", m.start())
        d, fin = 0, len(src)
        for q in range(i, len(src)):
            if src[q] == "{":
                d += 1
            elif src[q] == "}":
                d -= 1
                if d == 0:
                    fin = q
                    break
        return set(re.findall(r'\n  "?([a-z0-9-]+)"?\s*:', src[i:fin]))

    dest_cles = cles_record("const APPROACH")
    ind_cles = cles_record("const INDICE_ROUTE")
    sans_indice = sorted(dest_cles - ind_cles)
    orphelins = sorted(ind_cles - dest_cles)
    print(f"  indices de route : {len(ind_cles)} pour {len(dest_cles)} destinations")
    if sans_indice:
        print(f"    ⚠️ sans indice (route décrite en générique) : {', '.join(sans_indice)}")
    if orphelins:
        print(f"    ⚠️ indice orphelin (destination hors pool) : {', '.join(orphelins)}")
    # 2. une ambiance qui NOMME une destination = risque de double arrivée
    noms = ["colline", "moulin", "puits", "chapelle", "tribunal", "hameau", "verger", "mare", "palissade"]
    annonce = [t for t in liaisons if sum(n in t.lower() for n in noms) >= 1]
    print(f"  ambiances nommant un lieu (double arrivée possible) : {len(annonce)}")
    for t in annonce[:5]:
        print(f"    {t[:78]}")

    # 3. DOUBLE ARRIVÉE : la phrase d'approche redit-elle ce que le premier
    # paragraphe du lieu va dire ? Mesuré en mots pleins partagés (≥4 lettres,
    # hors mots-outils). ≥3 = le joueur voit le lieu, le choisit, le revoit.
    ap_bloc = sd.bloc_apres(src, r"const APPROACH_NARRATION: Record<string, string> =")
    approches = {}
    if ap_bloc:
        for m in _re.finditer(
            r'\n  "?([a-z0-9-]+)"?:\s*((?:"(?:[^"\\]|\\.)*"(?:\s*\+\s*\n?\s*)?)+)', ap_bloc[0]
        ):
            approches[m.group(1)] = sd.recoller(m.group(2))
    premiers = {}
    for o in sd.objets_de_haut_niveau(bloc[0], 0):
        sid = sd.texte_de(o, "id")
        n = sd.bloc_apres(o, r"\n {4}narration:\s*")
        if sid and n:
            paras = sd.paragraphes(n[0])
            if paras:
                premiers[sid] = paras[0]
    OUTILS = set(
        "le la les un une des de du au aux et à dans sur sous que qui ne pas se son sa ses "
        "tu te toi ton ta plus tout d l n s c y en il elle on pour par avec sans est sont a ont".split()
    )
    plein = lambda t: {w for w in _re.findall(r"[a-zà-ÿ]{4,}", t.lower()) if w not in OUTILS}
    doubles = [
        (k, sorted(plein(v) & plein(premiers[k])))
        for k, v in approches.items()
        if k in premiers and len(plein(v) & plein(premiers[k])) >= 3
    ]
    print(f"  doubles arrivées (approche ↔ 1er ¶, ≥3 mots communs) : {len(doubles)}")
    for k, communs in doubles[:6]:
        print(f"    {k:24s} {', '.join(communs)[:60]}")
    if approches:
        lg = [len(v.split()) for v in approches.values()]
        print(f"  approches : {len(approches)} · moyenne {sum(lg) // len(lg)} mots · max {max(lg)}")

    if verbose:
        print("\nTOUS LES ÉCRANS (mots, décroissant) :")
        for sid, m, c, n in ecrans:
            marque = " ⚠" if m > SEUIL_ECRAN else ""
            print(f"  {sid:30s} {m:>4} mots · {n} ¶{marque}")

    # ─── GARDE DE BUILD (--strict), demandé par Patrick le 31/08 : « à chaque
    # modification il faut que tu check ça pour ne pas refaire la même erreur ».
    # ⚠️ Le seuil de garde N'EST PAS 90. 90 est le budget d'ÉCRAN, tenu par le
    # découpage runtime : une scène de 116 mots en trois paragraphes devient
    # deux écrans, ce qui est le comportement voulu. Ce qu'aucune pagination ne
    # peut rattraper, c'est un PARAGRAPHE unique trop long (il reste entier) et
    # une scène si dense qu'elle ferait trois écrans pour une seule décision.
    # D'où deux règles, sur la source :
    #   · aucun paragraphe seul au-dessus de 90 mots ;
    #   · aucune scène au-dessus de PLAFOND_SCENE mots.
    if strict:
        fautes = []
        for sid, m, c, n in ecrans:
            if m > PLAFOND_SCENE:
                fautes.append(f"{sid} : {m} mots (plafond {PLAFOND_SCENE})")
        for sid, m in paragraphes_longs:
            fautes.append(f"{sid} : un ¶ de {m} mots (un ¶ ne se coupe jamais)")
        if fautes:
            print("\n❌ densité — " + str(len(fautes)) + " scène(s) hors grille :")
            for f in fautes:
                print("   " + f)
            return 1
        print("\n✓ densité : aucun ¶ au-dessus de 90 mots, aucune scène au-dessus de "
              f"{PLAFOND_SCENE}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
