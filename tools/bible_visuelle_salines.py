#!/usr/bin/env python3
"""
LA BIBLE VISUELLE DES SALINES → data/salines-bible-visuelle.md

Lecture validée par Patrick le 13/09 (« 3 oui ») :
  1. UNE image d'ÉTABLISSEMENT par environnement, servie par défaut à tout beat
     qui n'a pas la sienne ; des images DÉDIÉES seulement aux six lieux
     obligatoires et aux rencontres nommées. Le Ver n'a jamais la sienne :
     « une chose lointaine qui n'est pas toi » EST le Ver.
  2. Les TROIS INVARIANTS de l'environnement entrent dans chaque image dédiée
     — c'est ce qui la fait tenir à côté de l'image de fond sans rupture.
  3. Le RATIO DE TRAME s'obtient par le PROMPT (style_image.CLAUSES_ENVIRONNEMENT),
     jamais par un seuil de dithering : les réglages du pipeline sont verrouillés.

Les sujets sont écrits ICI (ils ne sont pas dans la bible, qui décrit des
lieux, pas des cadrages) ; les invariants, plans et ratios viennent de
data/zones/salines.json ; la queue de style de tools/style_image.py — jamais
recopiée. Format de sortie : `nom=prompt`, consommable par /leo-import.
"""
from __future__ import annotations
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from style_image import composer_environnement, CLAUSES_ENVIRONNEMENT  # noqa: E402

RACINE = Path(__file__).resolve().parent.parent
Z = json.loads((RACINE / "data/zones/salines.json").read_text(encoding="utf-8"))
ENVS = {e["id"]: e for e in Z["environnements"]}
LIEUX = {l["id"]: l for l in Z["lieux"]}
SORTIE = RACINE / "data/salines-bible-visuelle.md"

# ── LES QUATRE ÉTABLISSEMENTS — le sujet dit le lieu ET pose les trois invariants
ETABLISSEMENT = {
    "croute": ("the floor of a vanished salt lake seen at eye level from its old shore: a vast flat white crust "
               "to the horizon, deep cracks converging toward a distant black island with a leaning tower on it, "
               "weathered wooden mooring posts and a pair of rusted iron rails emerging from the salt and running "
               "straight toward the island, and very far off one small dark shape moving across the crust"),
    "bassins": ("terraced salt evaporation basins descending in steps toward the horizon, low dry-stone walls in "
                "tiers, narrow wooden footbridges spanning the empty basins, rows of lying human figures crusted in "
                "salt on the basin floors like fallen statues, and far off one immense wading bird standing on one "
                "leg in an empty basin"),
    "salines": ("the yard of an abandoned salt works: sacks of salt stacked into walls higher than a man, a great "
                "iron beam balance hanging from a timber gantry, a pair of iron rails that stop dead in the middle of "
                "the yard, salt dust on everything, cramped alleys between the stacks"),
    "saulnes": ("seen from far out on the salt crust: a black island massed against the sky with a leaning stone "
                "tower at its summit, a glow rising from inside the tower, the huddled town leaning toward its tower, "
                "and around the island a ring of collapsed crust in broken tiers like a dry moat"),
}

# ── LES SIX LIEUX OBLIGATOIRES (une image dédiée chacun)
OBLIGATOIRES = {
    "rive_haute": ("the old boat quay of a vanished lake: a row of tall weathered mooring posts standing in dry salt, "
                   "a bronze call-bell hanging from a timber gallows with no clapper, a phrase carved into the nearest "
                   "post, and two iron rails leaving the quay and running out across the flat white crust toward a "
                   "distant black island"),
    "terrasses": ("three dry salt terraces descending in steps seen from the top one, low walls between the levels, "
                  "lying salt-crusted human figures and loose white clods on each level, a standing hooded figure "
                  "half crusted in salt at the top edge pointing down, and at the bottom, in the last basin, an "
                  "immense wading bird on one leg about to take flight"),
    "entrepot": ("inside a vast salt warehouse: long alleys between walls of stacked sacks receding into darkness, "
                 "salt-crusted human statues stood in rows along the alleys sorted by size, and at the far end a huge "
                 "low blind shape the size of a barn with a ridged carapace, raking the floor with a flat snout"),
    "rues_qui_marchent": ("a narrow leaning street of a stone town on a hill, every house tilted the same way toward "
                          "an unseen tower, a slow procession of hooded salt-crusted figures walking in a ring around "
                          "the block never stopping, and in a side alley one figure standing perfectly still while "
                          "the others pass"),
    "quai_de_l_ile": ("a stone quay at the edge of the island town: an intact flat-bottomed barge sitting on iron "
                      "rails, its bow turned OUT toward the empty salt crust and away from the town, a cluster of "
                      "hooded salt-crusted figures on the quay beckoning toward the barge with open hands, the "
                      "leaning tower behind them"),
    "tour_de_l_ecluse": ("inside a stone tower descending in a spiral below the level of the old lake, seen from the "
                         "stair looking down: thousands of small marks scored into the wall one above the other, "
                         "growing denser toward the bottom, and at the bottom of the shaft an enormous stone wheel "
                         "ringed with iron set in a rock gorge, a last shallow black water at its foot"),
}

# ── LES RENCONTRES NOMMÉES (portrait de référence : fond noir, une source)
PORTRAIT = ("pitch-black background, the subject emerging from darkness, one single light source, "
            "this is the reference image of this character")
RENCONTRES = {
    "percepteur": ("croute", "monstre_salines_percepteur_a",
                   "a tall gaunt man bent under the weight of hundreds of flat lead tokens pressed into his flesh by "
                   "salt scales from skull to hands so that no skin shows, hooded in coarse wool, treading in place, "
                   "holding out one flat palm with a single blank lead token on it, salt crust at his feet"),
    "grand_saunier": ("salines", "monstre_salines_grand_saunier_a",
                      "an enormous blind beast the size of a barn, low and wide on many short legs, a ridged salt-white "
                      "carapace, a flat broad snout raking the floor, surrounded by rows of small salt-crusted human "
                      "statues it has sorted by size, inside a dark warehouse of stacked sacks"),
    "boeuf_de_sel": ("croute", "monstre_salines_boeuf_de_sel_a",
                     "a huge draught ox still in its wooden yoke and iron traces, half turned to white salt crystal, "
                     "walking without end along a pair of iron rails across a flat salt crust, dragging a small "
                     "wooden wagon with a single shuttered window, seen from the side and slightly behind"),
    "heron_de_sel": ("bassins", "monstre_salines_heron_a",
                     "an immense salt-white heron standing motionless on one leg in the middle of an empty stone "
                     "basin, neck folded, twice the height of a man, the low walls of the terraces behind it"),
    "encroutes": ("bassins", "monstre_salines_encroute_a",
                  "a standing hooded figure in coarse wool, the lower half of the body and one arm sealed in a thick "
                  "white crust of salt as if grown into the ground, the mouth and one hand still free, speaking, "
                  "leaning slightly toward the viewer"),
}

def invariants(env: str) -> str:
    return "with these three things always in the picture: " + " · ".join(ENVS[env]["invariants"])

def main() -> int:
    out = []
    out.append("# Les Salines — bible visuelle (validée le 13/09/2026)\n")
    out.append("Généré par `tools/bible_visuelle_salines.py` depuis `data/zones/salines.json` et `tools/style_image.py`. "
               "**Ne pas éditer à la main** : modifier le sujet dans le script, le ratio dans `CLAUSES_ENVIRONNEMENT`, "
               "les invariants dans le JSON.\n")
    out.append("## La règle (les trois oui de Patrick)\n")
    out.append("1. **Une image d'établissement par environnement**, servie par défaut à tout beat sans image dédiée. "
               "Images dédiées seulement aux **six lieux obligatoires** et aux **rencontres nommées**. "
               "Le Ver n'a jamais la sienne : « une chose lointaine qui n'est pas toi », c'est lui.")
    out.append("2. **Les trois invariants** de l'environnement entrent dans chaque image dédiée.")
    out.append("3. **Le ratio de trame par le prompt** (`style_image.CLAUSES_ENVIRONNEMENT`), jamais par le seuil du dithering. "
               "Règle de zone : vue à la première personne, le héros n'est jamais dans l'image.\n")
    out.append("**15 images** : 4 établissements · 6 obligatoires · 5 rencontres. Deux variantes par image, le pipeline "
               "double le suffixe (`_a` → `_a_b`). Format `nom=prompt` pour `/leo-import`.\n")
    n = 0
    for e in Z["environnements"]:
        eid = e["id"]
        out.append(f"\n## {e['ordre']}. {e['nom']} — {e.get('sous_titre','')}\n")
        out.append(f"- **Jour** : {e.get('jour','')}")
        out.append(f"- **Ratio de trame** : {e.get('ratio_trame','')}")
        out.append(f"- **Plan** : {e.get('plan','')}")
        out.append(f"- **Invariants** : " + " · ".join(e["invariants"]))
        out.append(f"- **Clause de ratio (prompt)** : _{CLAUSES_ENVIRONNEMENT[eid]}_\n")
        out.append(f"### Établissement — `{e['image_etablissement_attendue']}`\n")
        out.append("Servie par défaut sur tout lieu de l'environnement sans image dédiée.\n")
        out.append("```\n" + f"{e['image_etablissement_attendue']}=" + composer_environnement(ETABLISSEMENT[eid], eid) + "\n```\n")
        n += 1
        for lid, sujet in OBLIGATOIRES.items():
            L = LIEUX[lid]
            if L["environnement"] != eid:
                continue
            nom = f"scene_salines_{lid}_a"
            out.append(f"### {L['nom']} (obligatoire, {L['role']}) — `{nom}`\n")
            out.append(f"Ce que la bible dit : {L['note'].split('.')[0]}.\n")
            out.append("```\n" + f"{nom}=" + composer_environnement(f"{sujet}, {invariants(eid)}", eid) + "\n```\n")
            n += 1
        for cid, (env, nom, sujet) in RENCONTRES.items():
            if env != eid:
                continue
            C = next(c for c in Z["creatures"] if c["id"] == cid)
            out.append(f"### {C['nom']} (rencontre) — `{nom}`\n")
            out.append(f"Ce que la bible dit : {C['note'].split('.')[0]}.\n")
            out.append("```\n" + f"{nom}=" + composer_environnement(f"{sujet}, {PORTRAIT}", eid) + "\n```\n")
            n += 1
    out.append("\n## Ce qui n'a PAS d'image, et pourquoi\n")
    out.append("- **Le Ver de croûte** : jamais. Il est « la chose lointaine qui n'est pas toi » de l'établissement de la Croûte, et sous les pieds au Souffle.")
    out.append("- **Les 23 lieux du pool** : l'établissement de leur environnement, jusqu'à ce que l'écriture en désigne un qui mérite la sienne (un lieu = une image, jamais une image = une interaction).")
    out.append("- **Le Fossé** (beat d'arrivée de Saulnes) : l'établissement de Saulnes est déjà la vue de loin qu'il décrit.")
    SORTIE.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"{SORTIE.relative_to(RACINE)} — {n} images ({SORTIE.stat().st_size // 1024} Ko)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
