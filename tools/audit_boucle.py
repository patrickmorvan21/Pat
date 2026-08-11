#!/usr/bin/env python3
"""
AUDIT DE LA BOUCLE — inventaire AVANT/APRÈS du chantier de simplification.

Répond au §11.1 du chantier : pour chaque lieu de la tranche verticale,
nombre d'écrans, nombre de choix, présence d'« Observer », nombre de points
d'intérêt, états utilisés, et UTILITÉ de chaque point.

L'utilité se juge sur les cinq fonctions du §6 du chantier :
    lore majeur · objet · relation · préparation future · conséquence différée
Un point qui n'en rend aucune est signalé RIEN — c'est lui qu'il faut couper,
fusionner ou déplacer au Codex.

⚠️ « préparation future » n'est PAS « ça pose un flag ». C'est : le flag est
LU quelque part par un choix, une scène ou une variante. Le script vérifie le
consommateur, jamais la pose seule (§12 : « considérer un flag correctement
stocké comme une fonctionnalité terminée » est explicitement une exécution à
moitié).

Usage :
    python3 tools/audit_boucle.py            # tableau complet
    python3 tools/audit_boucle.py --pilote   # seulement le lot pilote
    python3 tools/audit_boucle.py --json X   # écrit l'instantané pour comparer
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from statistics import median

RACINE = Path(__file__).resolve().parent.parent
SD = RACINE / "aldenhar/lib/scene-data.ts"
BUDGET_ECRAN = 90  # identique à `decouperEnEcrans` (Scene.tsx)
SLOTS = 3          # identique à la règle des 3 CTA (Scene.tsx)

# Le lot pilote imposé par le §11.3 : Hameau, Moulin, un lieu sauvage.
PILOTE = {"serment-hameau", "campement", "colline-aux-gibets"}


def sans_commentaires(src: str) -> str:
    """Neutralise les commentaires en PRÉSERVANT les index (piège récurrent :
    cinq analyseurs de ce projet ont déjà signalé des défauts qu'ils lisaient
    dans les commentaires, ou raté des blocs qui s'ouvrent sur un commentaire)."""
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c == '"':
            j = i + 1
            while j < n and src[j] != '"':
                j += 2 if src[j] == "\\" else 1
            out.append(src[i:j + 1]); i = j + 1
        elif src.startswith("//", i):
            j = src.find("\n", i); j = n if j < 0 else j
            out.append(" " * (j - i)); i = j
        elif src.startswith("/*", i):
            j = src.find("*/", i); j = n if j < 0 else j + 2
            out.append("".join(ch if ch == "\n" else " " for ch in src[i:j])); i = j
        else:
            out.append(c); i += 1
    return "".join(out)


def bloc(src: str, i: int) -> str:
    """Le bloc { … } équilibré qui commence à l'index i."""
    d = 0
    for q in range(i, len(src)):
        if src[q] == "{":
            d += 1
        elif src[q] == "}":
            d -= 1
            if d == 0:
                return src[i:q + 1]
    return ""


def tableau(src: str, i: int) -> str:
    """Le tableau [ … ] équilibré qui commence à l'index i."""
    d = 0
    for q in range(i, len(src)):
        if src[q] == "[":
            d += 1
        elif src[q] == "]":
            d -= 1
            if d == 0:
                return src[i:q + 1]
    return ""


def chaines(seg: str) -> list[str]:
    """Les littéraux de chaîne, concaténations `+` recollées."""
    out, i, n = [], 0, len(seg)
    cur, encours = [], False
    while i < n:
        if seg[i] == '"':
            j = i + 1
            buf = []
            while j < n and seg[j] != '"':
                if seg[j] == "\\":
                    buf.append(seg[j + 1]); j += 2
                else:
                    buf.append(seg[j]); j += 1
            cur.append("".join(buf)); encours = True
            i = j + 1
            # concaténation ?
            k = i
            while k < n and seg[k] in " \n\t":
                k += 1
            if k < n and seg[k] == "+":
                i = k + 1
                continue
            out.append("".join(cur)); cur = []; encours = False
        else:
            i += 1
    if encours and cur:
        out.append("".join(cur))
    return [t.replace("\\u2019", "’") for t in out]


def champ(seg: str, nom: str) -> str | None:
    m = re.search(rf'\b{nom}:\s*"((?:[^"\\]|\\.)*)"', seg)
    return m.group(1) if m else None


def a_champ(seg: str, nom: str) -> bool:
    return bool(re.search(rf'\b{nom}\s*:', seg))


def pagine(paras: list[str]) -> int:
    mots, n = 0, 1
    for p in paras:
        m = len(p.split())
        if mots and mots + m > BUDGET_ECRAN:
            n += 1; mots = m
        else:
            mots += m
    return n


def scenes(src: str) -> list[dict]:
    """Chaque scène de SCENES[], avec ses choix et ses points d'intérêt."""
    out = []
    # ⚠️ Tolérant au commentaire d'ouverture : le bloc peut commencer par un
    # commentaire avant `id:` (36 scènes sur 89 dans ce fichier).
    for m in re.finditer(r'\n  \{\s*\n\s*id: "([a-z0-9-]+)"', src):
        b = bloc(src, m.start() + 3)
        sid = m.group(1)
        # narration
        narr = []
        mn = re.search(r'\bnarration:\s*\[', b)
        if mn:
            narr = chaines(tableau(b, b.index("[", mn.start())))
        # points d'intérêt
        pois = []
        mp = re.search(r'\bpointsInteret:\s*\[', b)
        if mp:
            seg = tableau(b, b.index("[", mp.start()))
            for mm in re.finditer(r'\n      \{\s*\n\s*id: "([a-z0-9-]+)"', seg):
                pb = bloc(seg, mm.start() + 7)
                pois.append({
                    "id": mm.group(1),
                    "label": champ(pb, "label") or "",
                    "savoir": champ(pb, "savoir"),
                    "loot": champ(pb, "grantsLoot"),
                    "decouverte": champ(pb, "decouverte"),
                    "leadsTo": champ(pb, "leadsTo"),
                    "envFlag": champ(pb, "setsEnvFlag"),
                    "fragment": a_champ(pb, "chapterFragment"),
                    "special": [k for k in ("corbeaux", "troupeau", "borneSud") if a_champ(pb, k)],
                    "soupcon": a_champ(pb, "soupcon"),
                    "mots": len((champ(pb, "examen") or "").split()) +
                            len((champ(pb, "approche") or "").split()),
                })
        # choix de premier niveau
        chx = []
        mc = re.search(r'\bchoices:\s*\[', b)
        if mc:
            seg = tableau(b, b.index("[", mc.start()))
            for mm in re.finditer(r'\n      \{\s*\n\s*id: "([a-z0-9-]+)"', seg):
                cb = bloc(seg, mm.start() + 7)
                chx.append({
                    "id": mm.group(1),
                    "label": champ(cb, "label") or "",
                    "risky": a_champ(cb, "risky"),
                    "passive": a_champ(cb, "passive"),
                    "locked": a_champ(cb, "locked"),
                    "orient": a_champ(cb, "orient"),
                    "serment": a_champ(cb, "serment"),
                    "poseEtat": champ(cb, "poseEtatSiEchec") or champ(cb, "poseEtatSiReussite"),
                })
        out.append({
            "id": sid, "narration": narr, "pois": pois, "choix": chx,
            "suite": champ(b, "chainNext"),
            "lieuSuite": champ(b, "leadsTo"),
        })
    return out


def budget_cta(nb_choix_actes: int, nb_pois: int, nb_passifs_demotables: int) -> tuple[int, bool]:
    """Reproduit la règle des 3 CTA : rend (nb de boutons, Observer visible)."""
    peut_demoter = nb_pois > 0 and nb_choix_actes > 0
    actes = nb_choix_actes if peut_demoter else nb_choix_actes + nb_passifs_demotables
    looks = nb_passifs_demotables if peut_demoter else 0
    place = max(0, SLOTS - actes)
    tous = nb_pois <= place and looks == 0
    promus = nb_pois if tous else max(0, place - 1)
    observer = bool(nb_pois) and not tous
    return actes + promus + (1 if observer else 0), observer


def main() -> int:
    brut = SD.read_text(encoding="utf8")
    src = sans_commentaires(brut)
    S = scenes(src)
    par_id = {s["id"]: s for s in S}
    if not S:
        print("⚠️ aucune scène extraite — l'analyseur est cassé, ne rien conclure.")
        return 2

    # ── Qui CONSOMME quoi (le test de « préparation future ») ──────────────
    sc = (RACINE / "aldenhar/components/Scene.tsx").read_text(encoding="utf8")
    lus_savoir = set(re.findall(r'requiresSavoir:\s*"([^"]+)"', src))
    lus_dec = set(re.findall(r'requiresDecouverte:\s*"([^"]+)"', src))
    lus_dec |= set(re.findall(r'has:\s*"(d\.[^"]+)"', src))
    lus_flag = set(re.findall(r'envFlags\["([^"]+)"\]', brut))
    lus_flag |= set(re.findall(r'envFlags\.([a-zA-Z0-9_]+)', brut))
    lus_flag |= set(re.findall(r'envFlags\["([^"]+)"\]', sc))
    lus_dec |= set(re.findall(r'"(d\.[a-z_]+)"', sc))
    # ⚠️ CONSOMMATION INDIRECTE — sans ça l'audit accuse à tort. Six
    # découvertes ne sont lues par AUCUN `requiresDecouverte` : elles comptent
    # dans `DECOUVERTES_FILLE`, dont le compteur dérivé ouvre le Moulin
    # (`remplace: { si: COMPTEUR_FILLE ≥ SEUIL_MOULIN }`). C'est la plus forte
    # conséquence différée du jeu, et la première version du script la
    # déclarait « MORTE ». Toute liste `export const X = [ D("…"), … ]` dont
    # le nom est lu ailleurs vaut donc consommation.
    for mliste in re.finditer(r'export const ([A-Z_]+)\s*=\s*\[([^\]]*)\]', src):
        nom_liste, corps = mliste.group(1), mliste.group(2)
        membres = {f"d.{x}" for x in re.findall(r'D\("([a-z_]+)"\)', corps)}
        if not membres:
            continue
        utilisee = len(re.findall(rf'\b{nom_liste}\b', src)) > 1 or nom_liste in sc
        if utilisee:
            lus_dec |= membres

    def utilite(p: dict) -> tuple[list[str], bool]:
        """Rend (fonctions remplies, prépare-t-il vraiment un futur ?)."""
        f, prepare = [], False
        if p["loot"]:
            f.append("objet")
        if p["leadsTo"]:
            f.append("relation")
        if p["fragment"]:
            f.append("lore majeur")
        if p["special"]:
            f.append("lore majeur")
        if p["savoir"]:
            if p["savoir"] in lus_savoir:
                f.append("préparation future"); prepare = True
            else:
                f.append("savoir MORT")
        if p["decouverte"]:
            if p["decouverte"] in lus_dec:
                f.append("conséquence différée"); prepare = True
            else:
                f.append("découverte MORTE")
        if p["envFlag"]:
            if p["envFlag"] in lus_flag:
                f.append("conséquence différée"); prepare = True
            else:
                f.append("flag MORT")
        return f, prepare

    # ── Le tableau ────────────────────────────────────────────────────────
    m = re.search(r"const APPROACH[^=]*=\s*\{", src)
    i = src.index("{", m.start())
    dests = re.findall(r'\n  "?([a-z0-9-]+)"?\s*:', bloc(src, i))
    if "--pilote" in sys.argv:
        dests = [d for d in dests if d in PILOTE]

    instantane, lignes = {}, []
    for dest in dests:
        vus, cur = set(), dest
        ecrans = taps = n_poi = n_choix = 0
        observers = 0
        pois_detail, etats = [], set()
        while cur and cur in par_id and cur not in vus:
            vus.add(cur)
            s = par_id[cur]
            ecrans += pagine(s["narration"])
            actes = [c for c in s["choix"] if not c["passive"] or c["serment"] or c["locked"]]
            passifs = [c for c in s["choix"] if c["passive"] and not c["serment"] and not c["locked"]]
            nb, obs = budget_cta(len(actes), len(s["pois"]), len(passifs))
            observers += 1 if obs else 0
            n_choix += len(s["choix"])
            n_poi += len(s["pois"])
            for p in s["pois"]:
                f, prep = utilite(p)
                ecrans += pagine([" ".join(["x"] * p["mots"])])
                pois_detail.append((s["id"], p["id"], p["label"], f, prep))
            for c in s["choix"]:
                if c["poseEtat"]:
                    etats.add(c["poseEtat"])
            cur = s["suite"]
        # taps ≈ un tap par écran + un tap par POI ouvert (Observer) + choix
        taps = ecrans + observers + n_choix
        lignes.append({
            "lieu": dest, "scenes": len(vus), "ecrans": ecrans, "choix": n_choix,
            "observer": observers, "pois": n_poi, "etats": sorted(etats),
            "detail": pois_detail,
        })
        instantane[dest] = {
            "ecrans": ecrans, "choix": n_choix, "observer": observers,
            "pois": n_poi, "scenes": len(vus),
            "poisSansUtilite": sum(1 for d in pois_detail if not d[3]),
            "poisQuiPreparent": sum(1 for d in pois_detail if d[4]),
        }

    print(f"AUDIT DE LA BOUCLE — {len(lignes)} destination(s)\n")
    print(f"{'lieu':22s} {'scènes':>6} {'écrans':>6} {'choix':>6} {'POI':>4} {'Observer':>9}  états")
    print("─" * 78)
    for L in lignes:
        e = ",".join(L["etats"]) or "—"
        print(f"{L['lieu']:22s} {L['scenes']:6d} {L['ecrans']:6d} {L['choix']:6d} "
              f"{L['pois']:4d} {L['observer']:9d}  {e}")

    tous_pois = [d for L in lignes for d in L["detail"]]
    sans = [d for d in tous_pois if not d[3]]
    prep = [d for d in tous_pois if d[4]]
    morts = [d for d in tous_pois if any("MORT" in x for x in d[3])]
    ec = [L["ecrans"] for L in lignes]
    print(f"\nmédiane {median(ec):.0f} écrans par visite · max {max(ec)}")
    print(f"points d'intérêt : {len(tous_pois)} · qui PRÉPARENT un futur : {len(prep)} "
          f"· sans aucune fonction : {len(sans)} · dont le flag n'est lu nulle part : {len(morts)}")
    print(f"lieux avec un sous-menu « Observer » : {sum(1 for L in lignes if L['observer'])}/{len(lignes)}")

    print("\n── UTILITÉ, POINT PAR POINT ─────────────────────────────────────")
    for L in lignes:
        if not L["detail"]:
            continue
        print(f"\n{L['lieu']}")
        for sid, pid, lab, f, _ in L["detail"]:
            marque = "✗ RIEN" if not f else ("⚠ " + ", ".join(f) if any("MORT" in x for x in f)
                                             else "· " + ", ".join(f))
            print(f"    {lab[:38]:38s} {marque}")

    if "--json" in sys.argv:
        p = Path(sys.argv[sys.argv.index("--json") + 1])
        p.write_text(json.dumps(instantane, ensure_ascii=False, indent=1), encoding="utf8")
        print(f"\ninstantané écrit : {p}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
