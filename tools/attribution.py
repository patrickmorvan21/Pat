#!/usr/bin/env python3
"""
D'OÙ VIENT CHAQUE PARAGRAPHE À L'ÉCRAN — la vérité terrain de l'estimateur.

L'estimateur déterministe ne convergeait pas avec les vies enregistrées
(94,7 % de décisions à ≤ 1 tap contre ~38 % observés). Deviner ce qui manque
au modèle serait la pire méthode : on ajouterait des blocs jusqu'à ce que le
chiffre tombe juste, et l'outil deviendrait infalsifiable.

Cet outil fait l'inverse. Il prend les vies RÉELLEMENT enregistrées, découpe
chaque écran en paragraphes, et **retrouve la constante source de chacun**
dans `lib/*.ts` et `components/*.tsx`. On obtient la composition MESURÉE d'un
écran d'arrivée, d'une conséquence, d'une Croisée — au lieu d'une hypothèse.

Ce qu'il sert :
  · la part de chaque famille dans le texte réellement lu ;
  · le nombre d'injections par arrivée, mesuré et non postulé ;
  · les paragraphes qu'AUCUNE source ne réclame (signe d'un extracteur muet,
    quatre fois rencontré dans ce projet).

Usage :
    python3 tools/attribution.py                    # toutes les vies v179+
    python3 tools/attribution.py --sequences        # tap par tap
    python3 tools/attribution.py data/transcripts/x.md
"""
from __future__ import annotations

import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / "tools"))
from audit_boucle import sans_commentaires  # noqa: E402

SOURCES = sorted((RACINE / "aldenhar/lib").glob("*.ts")) + [
    RACINE / "aldenhar/components/Scene.tsx",
    RACINE / "aldenhar/components/Prologue.tsx",
]

LECTURE = "(touche pour continuer)"

# Le MOBILIER n'est pas de la prose : le tableau du Registre, la puce Jour, le
# bandeau d'un objet gagné. Il pèse zéro dans le découpage du client, donc il
# ne doit compter ni en mots ni en paragraphes.
MOBILIER = re.compile(
    r"^—\s*(JOUR\s+\d+|LE GRAND REGISTRE)\s*—?$|^OBTENU\b|^\(même écran"
    r"|^•\s*RENCONTRE\s*•"            # la bannière d'une rencontre
    r"|^v\d+\.\d+\.\d+$"              # le numéro de version de l'accueil
    r"|^\d+\n[A-ZÉÈ].*\nJ\d+",        # le classement du Grand Registre

    re.I)

# ⚠️ L'écran du dé n'est PAS un tap de lecture : c'est la décision qui se
# résout. Le compter en gonflerait la latence d'un tap sur chaque jet.
ECRAN_DE = re.compile(r"^\[ dé lancé")

# Deux textes sont ASSEMBLÉS à l'exécution, donc introuvables tels quels dans
# les sources : la phrase des deux routes (deux `INDICE_ROUTE` cousus) et la
# carte d'un état (nom + manifestation). On les reconnaît par leur forme.
COMPOSES = (
    (re.compile(r"D'un côté,.*De l'autre,", re.S), "croisée"),
    (re.compile(r"^[A-ZÉÈÊÀÂÎÔÛ][a-zéèêàâîôûç]+\n"), "état"),
)


def deescape(t: str) -> str:
    """Rendre les `\\uXXXX` des sources en vrais caractères.

    ⚠️ NE PAS utiliser `bytes.decode("unicode_escape")` : il relit les octets
    en latin-1, donc il massacre tous les accents déjà présents. Une scène
    entière ressortait « sans source » à cause de ça, ce qui ressemble
    exactement à un extracteur muet.
    """
    return re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), t)


def normalise(t: str) -> str:
    """Comparer du texte de source et du texte à l'écran.

    Les sources coupent leurs chaînes en fin de ligne (« à pas  comptés ») et
    mélangent les apostrophes ’ et ' ; l'écran, lui, applique parfois une
    capitalisation CSS. On ramène tout à une forme commune.
    """
    t = unicodedata.normalize("NFC", t)
    t = t.replace("’", "'").replace(" ", " ")
    t = re.sub(r"\s+", " ", t).strip().lower()
    return t


# Dans `scene-data.ts`, TOUT vit sous la constante `SCENES` : narration,
# conséquences, issues de jet, approches et examens des points d'intérêt. Les
# attribuer au nom de la constante mettrait 54 % du texte lu dans un seul sac
# et rendrait la mesure inutile. On lit donc ce fichier par CHAMP.
CHAMPS_SCENE = {
    "narration": "narration", "narrationEchec": "narration",
    "timeoutNarration": "narration", "consequence": "conséquence",
    "approche": "point · marche", "examen": "point · examen",
    "jailerLine": "geôlier", "label": "libellé",
}


def index_scene_data() -> dict[str, str]:
    src = sans_commentaires((RACINE / "aldenhar/lib/scene-data.ts").read_text(encoding="utf8"))
    idx: dict[str, str] = {}

    def pose(t: str, fam: str) -> None:
        # ⚠️ Les apostrophes typographiques sont écrites `’` dans les
        # sources : sans ce décodage, une scène entière reste « sans source »
        # et l'on croit à un extracteur muet.
        t = deescape(t)
        if t and t.count(" ") >= 4:
            idx.setdefault(normalise(t), fam)

    # Les issues de jet, dans l'ordre verrouillé critique/réussite/échec/funeste.
    for m in re.finditer(r'outcomes\(([\s\S]*?)\n\s*\),', src):
        for t in re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(1)):
            pose(t, "issue")
    # Les champs simples et les tableaux de paragraphes.
    for champ, fam in CHAMPS_SCENE.items():
        for m in re.finditer(
                rf'\b{champ}:\s*(\[[\s\S]*?\n\s*\]|"(?:[^"\\]|\\.)*"'
                rf'(?:\s*\+\s*\n?\s*"(?:[^"\\]|\\.)*")*)', src):
            bloc = m.group(1)
            if bloc.startswith("["):
                for para in re.split(r'",\s*\n', bloc):
                    pose(" ".join(re.findall(r'"((?:[^"\\]|\\.)*)"', para + '"')), fam)
            else:
                pose(" ".join(re.findall(r'"((?:[^"\\]|\\.)*)"', bloc)), fam)
    return idx


def index_sources() -> dict[str, str]:
    """{texte normalisé → nom de la constante qui le porte}.

    On attribue par la dernière déclaration de haut niveau rencontrée : c'est
    grossier, mais la question posée est « quelle famille », pas « quelle
    ligne ». Les chaînes de moins de 5 mots sont écartées (identifiants,
    libellés de bouton, fragments de gabarit).
    """
    idx: dict[str, str] = dict(index_scene_data())
    for f in SOURCES:
        src = sans_commentaires(f.read_text(encoding="utf8"))
        cur = f.stem
        pos = 0
        # On avance en lisant, alternativement, les déclarations et les chaînes.
        for m in re.finditer(
                r'(?:^(?:export\s+)?(?:const|function|type|interface)\s+(\w+))'
                r'|"((?:[^"\\]|\\.)*)"',
                src, re.M):
            if m.group(1):
                cur = m.group(1)
                continue
            t = m.group(2)
            if not t or t.count(" ") < 4:
                continue
            # Une constante en CAPITALES est un POOL nommé ; tout le reste
            # est une ligne composée à l'intérieur d'une fonction, donc une
            # INJECTION d'exécution (trace de la mort précédente, écho d'un
            # objet, ligne de prologue…). Les confondre attribuait 4 % du
            # texte lu à « decouperEnEcrans », qui n'écrit pas un mot.
            idx.setdefault(normalise(deescape(t)),
                           cur if cur == cur.upper() else "INJECTION")
            pos = m.end()
        _ = pos
    return idx


def familles(nom: str) -> str:
    """Regrouper les constantes en familles lisibles."""
    n = nom.upper()
    if nom in ("SCENES", "scene-data"):
        return "scène"
    for cle, fam in (
        ("APPROACH", "approche"), ("LIAISON", "croisée"), ("BIFURCATION", "croisée"),
        ("INDICE_ROUTE", "croisée"), ("FAMILIARITE", "familiarité"),
        ("JAILER", "geôlier"), ("GEOLIER", "geôlier"), ("TAUNT", "geôlier"),
        ("SOUPCON", "soupçon"), ("CRAIE", "soupçon"), ("CORBEAU", "soupçon"),
        ("CHAPTER", "chapitre"), ("CHAPITRE", "chapitre"), ("LANDES_CHAPTERS", "chapitre"),
        ("PNJ", "mémoire"), ("MEMOIRE", "mémoire"), ("ECHOS", "mémoire"),
        ("PERCEPTION", "perception"), ("LOI", "loi"), ("TEMOIN", "témoins"),
        ("INJECTION", "injection"), ("NUIT", "nuit"), ("FRANCHIT", "couture"), ("TRACE", "couture"),
        ("ETAT", "état"), ("ETATS", "état"), ("BESACE", "objet"),
        ("RELI", "relique"), ("SURPRISE", "surprise"), ("PROPHETIE", "surprise"),
        ("CONTRADICTION", "contradiction"), ("PROLOGUE", "prologue"),
        ("PORTRAIT", "prologue"), ("SOUVENIR", "prologue"),
    ):
        if cle in n:
            return fam
    return nom


def ecrans(md: str) -> list[dict]:
    out: list[dict] = []
    for bloc in re.split(r"^### Écran \d+\s*$", md, flags=re.M)[1:]:
        act = re.search(r"^→ \*(.+)\*$", bloc, flags=re.M)
        corps = re.split(r"\n\*\*Choix proposés|\n→ \*", bloc)[0].strip()
        paras = [p.strip() for p in re.split(r"\n\s*\n", corps) if p.strip()]
        de = any(ECRAN_DE.match(p) for p in paras)
        paras = [p for p in paras if not MOBILIER.match(p) and not ECRAN_DE.match(p)]
        out.append({
            "paras": paras, "de": de,
            "action": act.group(1).strip() if act else "",
            "choix": re.findall(r"^- (.+)$", bloc, flags=re.M),
        })
    return out


def attribue(paras: list[str], idx: dict[str, str]) -> list[tuple[str, str, int]]:
    """(famille, texte, mots) — famille « ? » si aucune source ne le réclame."""
    out = []
    for p in paras:
        k = normalise(p)
        nom = idx.get(k)
        if nom is None:
            for motif, fam in COMPOSES:
                if motif.match(p):
                    nom = fam
                    break
        if nom is None:
            # Un écran peut recoller deux chaînes (concaténation `+`) ou
            # substituer un gabarit ({n}, un nom de héros). On cherche alors
            # la source dont le texte est un préfixe suffisamment long.
            for src, v in idx.items():
                if len(src) > 40 and (k.startswith(src[:60]) or src.startswith(k[:60])):
                    nom = v
                    break
        out.append((familles(nom) if nom else "?", p, len(p.split())))
    return out


def sequences(es: list[dict]) -> list[dict]:
    """Découpe la vie en séquences « n taps de lecture → une décision »."""
    seqs, cur = [], []
    for e in es:
        if e["action"] and e["action"] != LECTURE:
            seqs.append({"lectures": cur, "decision": e["action"], "choix": e["choix"]})
            cur = []
        elif e["paras"]:
            cur.append(e)
    if cur:
        seqs.append({"lectures": cur, "decision": None, "choix": []})
    return seqs


def transcripts_par_defaut() -> list[Path]:
    return sorted((RACINE / "data/transcripts").glob("v1[78]*.md"))


def mesures(fichiers: list[Path] | None = None) -> dict:
    """La CALIBRATION que l'estimateur consomme — mesurée, jamais postulée.

    Rend, par type de séquence (arrivée · croisée · sur place) : le nombre de
    séquences observées, la moyenne de taps, et pour chaque famille sa
    fréquence de présence et sa longueur moyenne en mots.

    ⚠️ CE QUE CES CHIFFRES VALENT. Les fréquences par famille reposent sur
    25 arrivées : l'incertitude sur chacune est de l'ordre de ±15 points. Elles
    servent à PONDÉRER, pas à affirmer. Le seul chiffre qui valide ou invalide
    le modèle est l'AGRÉGAT (taps moyens, part à ≤ 1 tap), assis sur
    122 séquences — et c'est lui qu'il faut retrouver.
    """
    fichiers = fichiers or transcripts_par_defaut()
    idx = index_sources()
    types: dict[str, list[dict]] = {"arrivée": [], "croisée": [], "sur place": []}
    mots_fam: Counter = Counter()
    paras_fam: Counter = Counter()
    taps: list[int] = []
    for f in fichiers:
        for s in sequences(ecrans(f.read_text(encoding="utf8"))):
            fams = []
            for e in s["lectures"]:
                for fam, _, m in attribue(e["paras"], idx):
                    fams.append(fam)
                    mots_fam[fam] += m
                    paras_fam[fam] += 1
            t = ("arrivée" if "approche" in fams
                 else "croisée" if "croisée" in fams else "sur place")
            types[t].append({"fams": fams, "taps": len(s["lectures"])})
            taps.append(len(s["lectures"]))
    out: dict = {"global": {"sequences": len(taps),
                            "taps_moyens": sum(taps) / max(1, len(taps)),
                            "part_1_ou_moins": sum(1 for t in taps if t <= 1) / max(1, len(taps)),
                            "distribution": {k: v / max(1, len(taps))
                                             for k, v in Counter(min(t, 4) for t in taps).items()}},
                 "mots_par_paragraphe": {f: mots_fam[f] / paras_fam[f] for f in paras_fam},
                 "types": {}}
    # Ce qu'une famille apporte QUAND ELLE EST LÀ : c'est ce poids-là que le
    # modèle doit ajouter, pas le mot moyen d'un paragraphe (le chapitre en
    # sert 1,25 par séquence, le point d'intérêt deux blocs, etc.).
    presente: Counter = Counter()
    for L in types.values():
        for x in L:
            for fam in set(x["fams"]):
                presente[fam] += 1
    out["mots_quand_present"] = {f: mots_fam[f] / presente[f] for f in presente}
    for t, L in types.items():
        c: Counter = Counter()
        for x in L:
            for fam in set(x["fams"]):
                c[fam] += 1
        out["types"][t] = {
            "n": len(L),
            "taps_moyens": sum(x["taps"] for x in L) / max(1, len(L)),
            "freq": {f: n / max(1, len(L)) for f, n in c.items()},
        }
    return out


def main(args: list[str]) -> int:
    fichiers = [Path(a) for a in args if not a.startswith("--")]
    if not fichiers:
        fichiers = transcripts_par_defaut()
    idx = index_sources()
    print(f"index des sources : {len(idx)} textes de ≥ 5 mots\n")

    fam_mots: Counter = Counter()
    fam_paras: Counter = Counter()
    inconnus: list[str] = []
    taps: list[int] = []
    par_famille_seq: Counter = Counter()

    for f in fichiers:
        es = ecrans(f.read_text(encoding="utf8"))
        seqs = sequences(es)
        print(f"╔══ {f.name} · {len(es)} écrans · {len(seqs)} séquences")
        for s in seqs:
            n = len(s["lectures"])
            taps.append(n)
            fams = []
            for e in s["lectures"]:
                for fam, txt, m in attribue(e["paras"], idx):
                    fam_mots[fam] += m
                    fam_paras[fam] += 1
                    fams.append(fam)
                    if fam == "?":
                        inconnus.append(txt)
            for fam in set(fams):
                par_famille_seq[fam] += 1
            if "--sequences" in args:
                print(f"║  {n} tap(s) → {s['decision'] or '(fin)'}")
                print(f"║      {' · '.join(fams) if fams else '—'}")
        print("╚" + "═" * 60)

    total = sum(fam_mots.values()) or 1
    print("\n■ D'OÙ VIENT LE TEXTE RÉELLEMENT LU")
    for fam, m in fam_mots.most_common():
        print(f"   {fam:14s} {m:6d} mots ({100*m/total:4.1f} %) · "
              f"{fam_paras[fam]:3d} paragraphes · dans {par_famille_seq[fam]:3d} séquences")

    print(f"\n■ TAPS DE LECTURE AVANT DÉCISION — {len(taps)} séquences")
    d = Counter(min(t, 4) for t in taps)
    for k in sorted(d):
        lib = f"{k}+" if k == 4 else str(k)
        print(f"   {lib} tap : {d[k]:3d} ({100*d[k]/len(taps):4.1f} %)  {'█'*round(28*d[k]/len(taps))}")
    print(f"   → {100*sum(1 for t in taps if t <= 1)/len(taps):.1f} % à un tap ou moins "
          f"· moyenne {sum(taps)/len(taps):.2f}")

    # ── LA COMPOSITION MESURÉE, par TYPE de séquence ────────────────────────
    # C'est ce que l'estimateur doit reproduire. Une séquence qui contient une
    # phrase d'approche est une ARRIVÉE ; une qui contient l'ambiance de marche
    # et les deux routes est une CROISÉE ; le reste est post-décision sur place.
    types: dict[str, list[dict]] = {"arrivée": [], "croisée": [], "sur place": []}
    for f in fichiers:
        for s in sequences(ecrans(f.read_text(encoding="utf8"))):
            fams = [fam for e in s["lectures"] for fam, _, _ in attribue(e["paras"], idx)]
            t = ("arrivée" if "approche" in fams
                 else "croisée" if "croisée" in fams else "sur place")
            types[t].append({"taps": len(s["lectures"]), "fams": fams})

    print("\n■ COMPOSITION MESURÉE PAR TYPE DE SÉQUENCE")
    print("   (« taps » = écrans de texte ; le dernier porte les choix,")
    print("    et le joueur le touche pour finir la frappe — c'est la")
    print("    convention des transcripts, donc celle de l'estimateur.)")
    for t, L in types.items():
        if not L:
            continue
        moy = sum(x["taps"] for x in L) / len(L)
        print(f"\n   {t.upper()} — {len(L)} séquences · {moy:.2f} taps en moyenne")
        c: Counter = Counter()
        for x in L:
            for fam in set(x["fams"]):
                c[fam] += 1
        for fam, n in c.most_common(10):
            print(f"      {fam:14s} présent dans {100*n/len(L):5.1f} % ({n}/{len(L)})")

    if inconnus:
        print(f"\n⚠️ {len(inconnus)} paragraphe(s) sans source identifiée "
              f"({100*len(inconnus)/sum(fam_paras.values()):.0f} % des paragraphes)")
        for t in inconnus[:12]:
            print(f"   « {t[:88]}… »")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
