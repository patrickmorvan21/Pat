#!/usr/bin/env python3
"""
LA SOURCE DE VÉRITÉ, ET LE GARDE-FOU QUI L'IMPOSE.

Règle actée le 03/08/2026, à ne plus rediscuter :

  ► `aldenhar/lib/scene-data.ts` est CANONIQUE pour tout ce que le jeu
    EXÉCUTE : les scènes, leurs choix, leurs seuils, leurs issues, et
    l'illustration réellement affichée à l'écran. C'est le fichier que le
    moteur lit ; si les deux se contredisent, c'est lui qui a raison, par
    construction — l'autre n'est jamais chargé au runtime.

  ► `data/zones/*.json` est CANONIQUE pour ce que le jeu n'exécute pas :
    la géographie de la carte (x/y repris du Figma), les noms lisibles, les
    notes, les strates de texte, et les collections de production
    (rencontres, créatures, objets) dont la plupart n'ont pas encore de
    scène. Rien de tout cela n'existe dans le .ts : le régénérer
    entièrement depuis le .ts DÉTRUIRAIT cette matière.

  ► Le SEUL champ que les deux portent est `scenes[].illustration` (et son
    report sur `lieux[].illustration`). C'est donc le seul endroit où une
    divergence est possible — et c'est exactement là qu'elle est déjà
    apparue (24/07 : « landes.json n'est PAS lu au runtime », des images
    câblées d'un côté et pas de l'autre). Dans le JSON, ce champ est un
    MIROIR : il se régénère depuis le .ts, il ne s'édite pas à la main.

Autrement dit : il n'y a pas deux sources indépendantes, il y a deux
domaines disjoints plus un miroir vérifié.

Usage :
    python3 tools/check_coherence.py          # vérifie, sort 1 si divergence
    python3 tools/check_coherence.py --fix    # réaligne le miroir sur le .ts

Branché sur `npm run prebuild` : un build ne peut pas partir avec un
miroir périmé.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import studio_data as sd  # noqa: E402  (le parseur .ts éprouvé, pas un second)

RACINE = Path(__file__).resolve().parent.parent
TS = RACINE / "aldenhar/lib/scene-data.ts"
ZONES = RACINE / "data/zones"


def norm(chemin: str | None) -> str | None:
    """Compare les chemins d'image sans se laisser piéger par le préfixe.

    Le .ts écrit « assets/x.png » (chemin servi par l'app), le JSON de zone
    écrit « x.png » (nom de fichier). Les deux conventions sont légitimes
    dans leur contexte : on normalise pour comparer, on ne les uniformise
    pas."""
    if not chemin:
        return None
    return chemin.split("/")[-1]


def illustrations_du_ts() -> dict[str, str | None]:
    src = TS.read_text(encoding="utf-8")
    bloc = sd.bloc_apres(src, r"const SCENES: Scene\[\] =")
    if not bloc:
        raise SystemExit("check_coherence : SCENES introuvable dans le .ts")
    out: dict[str, str | None] = {}
    for o in sd.objets_de_haut_niveau(bloc[0], 0):
        sid = sd.texte_de(o, "id")
        if sid:
            out[sid] = sd.texte_de(o, "illustration")
    return out


def controler(corriger: bool) -> int:
    ts = illustrations_du_ts()
    ecarts: list[str] = []
    corriges = 0

    for zf in sorted(ZONES.glob("*.json")):
        z = json.loads(zf.read_text(encoding="utf-8"))
        touche = False

        # ── le miroir des scènes
        for s in z.get("scenes", []):
            if s["id"] not in ts:
                continue  # entrée de production sans scène jouable : normal
            attendu, actuel = norm(ts[s["id"]]), norm(s.get("illustration"))
            if attendu == actuel:
                continue
            if corriger:
                s["illustration"] = attendu
                touche = True
                corriges += 1
            else:
                ecarts.append(
                    f"  {zf.name} · scène {s['id']}\n"
                    f"      .ts  : {attendu or '—'}\n"
                    f"      json : {actuel or '—'}"
                )

        # ── le report sur les lieux : la vignette d'un lieu est l'illustration
        #    de sa scène d'ARRIVÉE (la première du lieu en ordre de document).
        arrivee: dict[str, str] = {}
        for s in z.get("scenes", []):
            lieu = s.get("lieu")
            if lieu and s.get("type") == "arrivee" and lieu not in arrivee:
                if s["id"] in ts and ts[s["id"]]:
                    arrivee[lieu] = norm(ts[s["id"]]) or ""
        for l in z.get("lieux", []):
            attendu = arrivee.get(l["id"])
            if attendu is None:
                continue
            if norm(l.get("illustration")) == attendu:
                continue
            if corriger:
                l["illustration"] = attendu
                touche = True
                corriges += 1
            else:
                ecarts.append(
                    f"  {zf.name} · lieu {l['id']}\n"
                    f"      scène d'arrivée : {attendu}\n"
                    f"      json            : {norm(l.get('illustration')) or '—'}"
                )

        if touche:
            zf.write_text(
                json.dumps(z, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )

    if corriger:
        print(f"check_coherence : {corriges} champ(s) réaligné(s) sur scene-data.ts")
        return 0

    if ecarts:
        print("check_coherence : DIVERGENCE entre le .ts et le miroir JSON.\n")
        print("\n".join(ecarts))
        print(
            "\nscene-data.ts fait foi (c'est lui que le moteur exécute)."
            "\nRéaligner : python3 tools/check_coherence.py --fix"
        )
        return 1

    print(
        f"check_coherence : miroir à jour "
        f"({len(ts)} scènes vérifiées, aucune divergence)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(controler("--fix" in sys.argv))
