#!/usr/bin/env python3
"""
LE CARNET DE COMMANDE D'IMAGES — toutes les images du jeu, prêtes à regénérer.

Écrit `data/prompts-refonte.md` : pour chaque image RÉELLEMENT UTILISÉE par le
jeu, le nom de fichier à produire et le prompt complet à coller dans Leonardo.

⚠️ LE NOM DE SORTIE PORTE LA VARIANTE SUIVANTE. Une image regénérée ne garde
JAMAIS son nom (règle du 30/07) : le changement doit se voir dans l'historique
au lieu d'être un remplacement silencieux, et l'ancienne reste disponible tant
que la nouvelle n'est pas validée. `objet_craie_condamne_a` → `_b`.

⚠️ ET LE PIPELINE DOUBLE LE SUFFIXE (constaté le 25/07) : ce qu'on demande en
`_b` ressort en `_b_d`. On garde le nom tel qu'il sort — repo et Drive restent
diffables — et c'est moi qui recâble à l'import.

Sources : data/scene-meta.json (sujets de scène) · data/objet-meta.json
(sujets d'objet et de relique) · tools/style_image.py (LA recette).
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from style_image import composer, composer_objet  # noqa: E402
from prompts_variantes import CADRES  # noqa: E402  (les 4 cadrages de variante)

ASSETS = RACINE / "aldenhar/public/assets"
SORTIE = RACINE / "data/prompts-refonte.md"

# Les images qui ne se regénèrent PAS par ce chemin : elles ne viennent pas de
# Leonardo (exports Figma, sprites d'animation, peaux de mini-jeu construites
# depuis une maquette, éléments d'interface).
HORS = re.compile(r"^(bande_|frange_|croix_|fleche_|fermer|retour|pactum_|intro_porte_anim|"
                  r"minijeu_|codex_|dithering-|accueil_|geolier_|mort_|etat_|intro_|objet_dague\.|"
                  r"objet_crane\.|objet_masque\.)")


def suivante(nom: str) -> str:
    """Le fichier à produire : la lettre de variante d'après."""
    base = nom[:-4] if nom.endswith(".png") else nom
    m = re.match(r"^(.*)_([a-z])$", base)
    if m:
        lettre = m.group(2)
        return f"{m.group(1)}_{chr(ord(lettre) + 1) if lettre < 'z' else 'z2'}.png"
    return f"{base}_b.png"          # un fichier sans suffixe compte pour _a


def assets_du_jeu() -> set[str]:
    src = ""
    for d in ("aldenhar/lib", "aldenhar/components"):
        for f in (RACINE / d).rglob("*"):
            if f.suffix in (".ts", ".tsx"):
                src += f.read_text(encoding="utf-8")
    utilises = set(re.findall(r"assets/([A-Za-z0-9_.-]+\.png)", src))
    # les reliques ont un chemin DÉRIVÉ à l'exécution : jamais littéral
    for f in ASSETS.glob("relique_*.png"):
        utilises.add(f.name)
    return {u for u in utilises if (ASSETS / u).exists() and not HORS.match(u)}


EN_TETE = """# PACTUM — commande d'images · lot {n}/{tot} · {lot}

Génère **deux variantes** de chacune des images ci-dessous.

- Format **carré**, le plus grand disponible (elles seront réduites à 1000×1000).
- **Ne modifie pas le texte du prompt.** Sa seconde moitié est une recette
  verrouillée : elle tient l'aplat de couleur et l'époque. La retoucher casse
  l'unité de la série.
- **Rends-moi chaque image sous le nom exact indiqué en gras**, sans rien y
  ajouter.

---
"""


def ecrire_lots(lots: dict, dossier: Path, par_lot: int = 18) -> int:
    """Un fichier par lot, assez court pour tenir dans un seul message."""
    dossier.mkdir(parents=True, exist_ok=True)
    for vieux in dossier.glob("lot-*.md"):
        vieux.unlink()
    paquets = []
    for lot, items in lots.items():
        for i in range(0, len(items), par_lot):
            paquets.append((lot, items[i:i + par_lot]))
    for n, (lot, items) in enumerate(paquets, 1):
        txt = [EN_TETE.format(n=n, tot=len(paquets), lot=lot)]
        for k, (nouveau, _ancien, _ou, prompt) in enumerate(items, 1):
            txt.append(f"**{k}. {nouveau[:-4]}**\n\n{prompt}\n")
        (dossier / f"lot-{n:02d}.md").write_text("\n".join(txt), encoding="utf-8")
    return len(paquets)


def main() -> int:
    meta = json.loads((RACINE / "data/scene-meta.json").read_text(encoding="utf-8"))["scenes"]
    om = json.loads((RACINE / "data/objet-meta.json").read_text(encoding="utf-8"))
    # Source PRIORITAIRE, indexée par nom de fichier : elle atteint les écrans
    # portés par un CHOIX et les vues de marche, que scene-meta.json (indexé
    # par scène) ne peut pas couvrir.
    sj = json.loads((RACINE / "data/sujets-images.json").read_text(encoding="utf-8"))
    sujets_fichier = {k: v for k, v in sj.items() if not k.startswith("_")}
    studio = json.loads((RACINE / "data/studio-data.json").read_text(encoding="utf-8"))
    # 2e source de sujet : les prompts de VARIANTE, écrits par
    # tools/prompts_variantes.py dans les fiches de zone. Ils portent déjà leur
    # cadrage (gros plan, portrait, geste) — on les reprend TELS QUELS, sinon
    # on écrase l'anti-dérive qui empêche un personnage de changer de visage
    # d'une image à l'autre.
    zone_prompt: dict[str, str] = {}
    zone_desc: dict[str, str] = {}
    for fz in (RACINE / "data/zones").glob("*.json"):
        z = json.loads(fz.read_text(encoding="utf-8"))
        for sc in z.get("scenes", []):
            f = (sc.get("illustration") or "").rsplit("/", 1)[-1]
            if f and sc.get("prompt_image"):
                zone_prompt.setdefault(f, sc["prompt_image"])
            if f and sc.get("description"):
                zone_desc.setdefault(f, sc["description"])

    # quelle scène sert quel fichier — pour donner un contexte au sujet
    porte = {}
    for sc in studio["scenes"]:
        f = (sc.get("image") or {}).get("fichier")
        if f:
            porte.setdefault(f, []).append(sc.get("nom") or sc["id"])

    lignes, manquants = [], []
    lots: dict[str, list] = {"À créer — n'existe pas encore": [],
                             "Objets": [], "Reliques": [], "Rencontres": [], "Lieux et écrans": []}

    # Les sujets écrits pour une image qui N'EXISTE PAS encore : ce sont des
    # créations, pas des refontes — elles gardent donc leur nom tel quel, sans
    # variante suivante (il n'y a rien à remplacer).
    a_creer = [k for k in sujets_fichier if not (ASSETS / f"{k}.png").exists()]

    for fich in sorted(assets_du_jeu()):
        base = fich[:-4]
        racine_var = re.sub(r"_[a-z](_[a-z])?$", "", base)
        sujet, lot, cadre = "", "Lieux et écrans", ""
        if base in sujets_fichier:
            cadre, sujet = sujets_fichier[base]

        if cadre:
            lot = "Rencontres" if base.startswith("monstre_") else "Lieux et écrans"
        elif base.startswith("objet_"):
            lot = "Objets"
            sujet = om["objets"].get(racine_var) or om["objets"].get(base, "")
        elif base.startswith("relique_"):
            lot = "Reliques"
            sujet = om["reliques"].get(base, "")
        else:
            lot = "Rencontres" if base.startswith("monstre_") else "Lieux et écrans"
            # le sujet d'une scène : son prompt écrit, sinon sa description
            for sid, v in meta.items():
                if (studio and any(s["id"] == sid and (s.get("image") or {}).get("fichier") == fich
                                   for s in studio["scenes"])):
                    p = v.get("prompt_image")
                    if p:
                        from style_image import sujet_de
                        sujet = sujet_de(p)
                    elif v.get("description"):
                        sujet = v["description"]
                    break

        pret = ""
        if not sujet and fich in zone_prompt:
            pret = zone_prompt[fich]          # déjà cadré, on n'y touche pas
            # ⚠️ sauf s'il date d'avant la nouvelle recette : un prompt sans la
            # clause d'aplat sortirait en trame grise, ce qu'on veut justement
            # arrêter. On garde alors son sujet et on recompose.
            if "two-value contrast" not in pret:
                from style_image import sujet_de as _sd
                sujet, pret = _sd(pret), ""
        if not sujet and not pret:
            # dernier repli : la description de production de la fiche de zone
            sujet = zone_desc.get(fich, "")
        if not sujet and not pret:
            manquants.append((fich, ", ".join(porte.get(fich, []))[:70]))
            continue
        if pret:
            prompt = pret
        elif cadre and cadre != "scene":
            # un cadrage de variante : c'est lui qui empêche un personnage de
            # changer de visage d'une image à l'autre
            prompt = composer(f"{sujet}. {CADRES[cadre]}")
        elif lot in ("Objets", "Reliques"):
            prompt = composer_objet(sujet)
        else:
            prompt = composer(sujet)
        lots[lot].append((suivante(fich), fich, ", ".join(porte.get(fich, []))[:70], prompt))

    total = sum(len(v) for v in lots.values())
    lignes.append("# PACTUM — carnet de commande d'images\n")
    lignes.append(f"**{total} images** prêtes à regénérer · **{len(manquants)}** sans sujet écrit.\n")
    lignes.append("Chaque entrée donne le **nom à produire** (variante suivante) et le prompt "
                  "complet. Deux images par prompt suffisent : on garde la meilleure.\n")
    lignes.append("> ⚠️ Le pipeline double le suffixe : ce qu'on demande en `_b` ressort en "
                  "`_b_d`. C'est normal, on garde le nom tel qu'il sort.\n")
    lignes.append("> ⚠️ Ne rien supprimer dans le Drive avant que le remplaçant soit validé "
                  "**et câblé** : l'ancienne image reste le seul point de comparaison.\n")

    for k in a_creer:
        cadre, sujet = sujets_fichier[k]
        pr = composer(f"{sujet}. {CADRES[cadre]}") if cadre != "scene" else composer(sujet)
        lots["À créer — n'existe pas encore"].append((f"{k}.png", "", "image neuve", pr))
    total = sum(len(v) for v in lots.values())

    for lot in ("À créer — n'existe pas encore", "Objets", "Reliques", "Rencontres", "Lieux et écrans"):
        if not lots[lot]:
            continue
        lignes.append(f"\n---\n\n## {lot} ({len(lots[lot])})\n")
        for nouveau, ancien, ou, prompt in lots[lot]:
            lignes.append(f"### `{nouveau}`")
            lignes.append((f"remplace `{ancien}`" if ancien else "**image neuve**")
                          + (f" — {ou}" if ou else ""))
            lignes.append(f"\n```\n{nouveau[:-4]}={prompt}\n```\n")

    if manquants:
        lignes.append("\n---\n\n## Sans sujet écrit — à faire avant de commander\n")
        for f, ou in manquants:
            lignes.append(f"- `{f}`" + (f" — {ou}" if ou else ""))

    SORTIE.write_text("\n".join(lignes), encoding="utf-8")
    n_lots = ecrire_lots(lots, RACINE / "data/pactum-photos")
    print(f"data/prompts-refonte.md — {total} images à commander "
          f"({', '.join(f'{k} {len(v)}' for k, v in lots.items() if v)})"
          + (f" · {len(manquants)} sans sujet" if manquants else ""))
    print(f"data/pactum-photos/ — {n_lots} lots prêts à envoyer")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
