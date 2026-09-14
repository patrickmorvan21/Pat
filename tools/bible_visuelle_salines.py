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
from style_image import (composer_environnement, composer_cadre,  # noqa: E402
                         CLAUSES_ENVIRONNEMENT, CADRAGE_DETAIL, CADRAGE_SUR_PLACE,
                         CADRAGE_RENCONTRE)

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
    "rive_haute": ("the old boat quay of a vanished lake: a row of weathered mooring posts standing in dry salt, "
                   "a bronze bell hanging from a timber gallows, and two iron rails running out across the white "
                   "flat toward a distant black island"),
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
    # « seen from the stair looking down » retiré : le cadrage vient de
    # composer_*, et le puits qui s'enfonce se dit sans mot de caméra.
    "tour_de_l_ecluse": ("inside a stone tower, a spiral stair winding down a shaft that drops far below the level "
                         "of the old lake, thousands of small marks scored into the curved wall one above the "
                         "other and growing denser the deeper they go, and at the foot of the shaft an enormous "
                         "stone wheel ringed with iron set in a rock gorge, a last shallow black water beneath it"),
}

# ── LES LIEUX DU POOL QUI ONT LEUR IMAGE (décision Patrick, 14/09)
# « Je veux des images en plus pour chacune des scènes ; file de pierres,
# bouche, barge, statue, etc. » — ce qui AMENDE la règle du 13/09 (« dédiées
# seulement aux six obligatoires »). La raison tient à l'écriture : chacun de
# ces six lieux tourne autour d'un objet unique et dominant (une barge prise
# dans le sel, un trou cerné d'offrandes, un radeau sans eau) qu'aucun fond
# générique ne peut suggérer — l'établissement les aurait tous montrés comme
# un quai. Les sujets sont pris MOT À MOT dans les narrations de
# lib/scene-data.ts : un prompt écrit sans le texte sous les yeux produit
# exactement les décalages image↔texte qu'on passe notre temps à réparer.
LIEUX_JOUES = {
    "file": ("croute", "scene_salines_file_a",
             "a line of flat stepping stones set at even intervals across a white salt flat, low and level "
             "with the ground, running away to the horizon; standing beside them, three human figures of "
             "salt caught in mid-stride, all facing the same way"),
    # ⚠️ Deux versions ont échoué avant celle-ci. La 1re disait « seen from
    # above » (un mot de CAMÉRA pour décrire une forme) ; la 2e était juste
    # mais demandait onze choses, et le modèle a rendu les corps en arbres
    # morts. Ici : une seule chose dominante, un seul détail.
    "champ_des_sillages": ("croute", "scene_salines_champ_des_sillages_a",
             "long dark cracks in a white salt flat, spreading apart like the fingers of a hand buried "
             "just beneath the surface; between them, two human bodies lying flat on their backs, half "
             "swallowed by the salt"),
    "barge_echouee": ("croute", "scene_salines_barge_echouee_a",
             "a river barge beached on a white salt flat far from any water, its hull sunk to the gunwale, "
             "its mast fallen across the deck; a man of salt sits on the deck before a bowl"),
    "statue": ("croute", "scene_salines_statue_a",
             "one salt-crusted human figure standing alone on a white flat, taller than a man, one arm "
             "held straight out toward the horizon, its face lost under thick salt"),
    "bouche": ("croute", "scene_salines_bouche_a",
             "a round hole in a white salt flat, as wide as a cart, its rim smooth and rounded; a ring of "
             "small objects laid on the salt around it — buckles, blades, a lantern — all turned to face "
             "the hole"),
    "radeau": ("croute", "scene_salines_radeau_a",
             "a plank raft lying flat on dry white salt with no water anywhere, a man of salt standing on "
             "it holding a long punt pole, a grey heron perched at its end"),
}

# ── LES ÉCRANS QUI NE REGARDENT PAS UN PAYSAGE
# Un autre moment du MÊME lieu, donc un autre cadrage : ni un paysage, ni un
# portrait. `composer_cadre` garde le ratio de valeurs et la lumière de la
# zone (c'est ce qui les rattache à la Croûte) et ne change que le cadrage —
# et n'ajoute PAS les trois invariants : des rails qui sortent du sel dans une
# macro d'inscription, ça n'a pas de sens.
AUTRES_ECRANS = {
    "barge-echouee-2": ("croute", "scene_salines_barge_pont_a", "sur_place",
             "standing on the deck of a beached barge: a small aft cabin with a padlocked chest inside it, "
             "and at your feet a hatch in the deck planks nailed shut, the salt-crusted man sitting to one "
             "side still moving his lips"),
    "statue-2": ("croute", "scene_salines_statue_inscription_a", "detail",
             "a single line of words scratched with a nail into hardened salt on the back of a statue's "
             "plinth, the letters crude and deep, the salt around them smooth"),
    "bouche-2": ("croute", "scene_salines_bouche_dent_a", "detail",
             "a curved hollow tooth as long as a forearm lying on the salt at the rim of a hole, still wet "
             "inside, and beside it a lantern whose flame burns with no oil"),
}

# ── LES RENCONTRES NOMMÉES (portrait de référence : fond noir, une source)
# La recette du portrait vit dans style_image.composer_portrait — jamais
# recopiée ici, et surtout SANS la clause de cadrage de l'environnement
# (« very wide shot, harsh white noon, no shadows at all » contredisait
# « pitch-black background, one single light source » dans les cinq prompts
# d'origine).
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
    "heron_de_sel": ("croute", "monstre_salines_heron_a",
                     "an immense salt-white heron standing motionless on one leg in the middle of an empty stone "
                     "basin, neck folded, twice the height of a man, the low walls of the terraces behind it"),
    # ⚠️ AJOUT DU 14/09 (retour Patrick : « il manque les créatures dans les
    # environnements »). Le tri d'origine — « les six obligatoires et les
    # rencontres nommées » — a été fait le 13/09, AVANT que la Croûte ne soit
    # écrite : il ne pouvait pas savoir lesquelles seraient réellement mises
    # en scène. Les deux COMBATS de la Croûte n'avaient donc aucune image,
    # ce qui contredit une règle du jeu (14/07 : « illustration systématique
    # sur toute scène de combat »).
    # Critère retenu, et à appliquer aux environnements suivants quand ils
    # seront écrits : une créature a son image si le joueur la REGARDE EN
    # FACE — un combat, ou une rencontre à qui il parle. Un phénomène de
    # décor (Cristallins, Grumeaux, Léchards) reste dans l'image du lieu.
    "piqueurs": ("croute", "monstre_salines_piqueurs_a",
                 "four flat wide creatures rising out of a cracked white salt crust, each the size of a large dog, "
                 "bodies low and plated like a woodlouse, each with a single long tapering beak of clear glass, "
                 "caught mid-hop with the crust breaking open under them, salt dust in the air"),
    # ⚠️ IDENTITÉ À TRANCHER (signalé à Patrick le 14/09) : la fiche de
    # salines.json dit « gros lézards de la taille d'un chien », la SCÈNE
    # ÉCRITE dit des corps humains couchés que le sel a pris à plat et dont
    # les bras cherchent tes chevilles. Le sujet suit la SCÈNE — c'est elle
    # que le joueur lit — mais la fiche reste à corriger, sinon la bible
    # contredit son propre prompt sur la même page.
    "gisants": ("croute", "monstre_salines_gisants_a",
                "two human bodies lying flat on their backs in a white salt crust that has grown over them, "
                "only the faces free, their arms breaking up out of the salt and reaching forward"),
    "encroute_du_radeau": ("croute", "monstre_salines_encroute_radeau_a",
                        "a hooded man crusted with salt standing on a flat plank raft that rests directly on dry salt "
                        "with no water anywhere, holding a long punt pole upright, turned away from the viewer toward "
                        "a distant point on the horizon, and far behind him an immense pale wading bird unfolding one wing"),
    "encroutes": ("croute", "monstre_salines_encroute_a",
                  "a standing hooded figure in coarse wool, the lower half of the body and one arm sealed in a thick "
                  "white crust of salt as if grown into the ground, the mouth and one hand still free, speaking, "
                  "leaning slightly toward the viewer"),
}

# ⚠️ LES INVARIANTS PARTAIENT EN FRANÇAIS DANS UN PROMPT ANGLAIS (défaut trouvé
# le 14/09) : `invariants()` recopiait les chaînes du JSON telles quelles, donc
# les six prompts de lieu obligatoire disaient « with these three things always
# in the picture: fissures convergentes vers le centre · pieux et rails sortant
# du sel · … ». Le JSON reste en français — c'est la matière de production, lue
# par des humains et par le Graphe ; la version de PROMPT vit ici, et le garde
# ci-dessous casse la génération si un invariant du JSON n'a pas sa traduction,
# plutôt que de réémettre du français en silence.
INVARIANTS_EN = {
    "fissures convergentes vers le centre": "deep cracks in the crust converging toward the far island",
    "pieux et rails sortant du sel": "weathered mooring posts and rusted iron rails emerging from the salt",
    "une chose lointaine qui n'est pas toi": "one small dark shape moving very far off across the flat",
    "murets en gradins": "low dry-stone walls in tiers",
    "passerelles de bois": "narrow wooden footbridges spanning empty basins",
    "rangées de Cristallins couchés": "rows of salt-crusted human figures lying on the basin floors",
    "sacs empilés": "sacks of salt stacked into walls higher than a man",
    "la balance": "a great iron beam balance hanging from a timber gantry",
    "rails qui s'arrêtent net": "a pair of iron rails that stop dead",
    "le Fossé en gradins": "a ring of collapsed crust in broken tiers around the island",
    "la ville qui marche": "hooded salt-crusted figures walking in a slow ring through the streets",
    "la tour et sa lueur": "a leaning stone tower with a glow rising from inside it",
}


# ── LE CÂBLAGE : quel fichier sur quel écran
# Sans cette table, rien ne dit que `monstre_salines_piqueurs_a` va sur
# `file-2` — et le câblage se ferait à la devinette une fois les images
# livrées. Elle est VÉRIFIÉE contre lib/scene-data.ts par `controler_cablage`
# plus bas : un écran écrit sans cible, ou une cible qui ne correspond à
# aucune image de la bible, arrête la génération.
CABLAGE = {
    "croute": {
        "rive-haute": "scene_salines_rive_haute_a",
        "rive-haute-2": "monstre_salines_percepteur_a",
        "file": "scene_salines_file_a",
        "file-2": "monstre_salines_piqueurs_a",
        "champ-des-sillages": "scene_salines_champ_des_sillages_a",
        "champ-des-sillages-2": "monstre_salines_gisants_a",
        "barge-echouee": "scene_salines_barge_echouee_a",
        "barge-echouee-2": "scene_salines_barge_pont_a",
        "statue": "scene_salines_statue_a",
        "statue-2": "scene_salines_statue_inscription_a",
        "bouche": "scene_salines_bouche_a",
        "bouche-2": "scene_salines_bouche_dent_a",
        # ⚠️ Volontairement la MÊME que l'écran d'avant : rien de visible n'y
        # change (le frottement passe SOUS la croûte), et c'est tout l'effet.
        "bouche-3": "scene_salines_bouche_a",
        "radeau": "scene_salines_radeau_a",
        "radeau-2": "monstre_salines_encroute_radeau_a",
        # Le carton de fin d'étape n'est pas une scène illustrée.
        "fin-etape-non-ecrite": None,
    },
}

# Images de la zone qui n'ont pas d'écran fixe, et pourquoi.
HORS_CABLAGE = {
    "scene_salines_croute_a": "vue de marche (liaisons) et fond de secours",
    "monstre_salines_boeuf_de_sel_a": "issue de « remettre le battant et sonner », sur rive-haute-2",
    "monstre_salines_heron_a": "il s'envole dans une issue de radeau-2",
    "monstre_salines_encroute_a": "l'Encroûté générique — barge et ailleurs, au palier II",
}


# ⚠️ UN SUJET NE DIT JAMAIS LA CAMÉRA (leçon du 14/09, payée le jour même).
# J'avais écrit « like the fingers of a flat hand SEEN FROM ABOVE » pour dire
# une FORME ; un modèle de diffusion le lit comme une instruction de cadrage,
# et le prompt se retrouvait à demander une vue aérienne ET « first-person
# view from the ground ». Le cadrage vient de `composer_*`, jamais du sujet —
# une forme se décrit sans point de vue.
# ⚠️ « bird » n'est PAS dans la liste : les hérons des Salines sont des
# « wading bird », et un garde qui crie sur trois faux positifs finit ignoré.
MOTS_DE_CAMERA = ("seen from above", "from above", "bird's eye", "aerial view", "top-down",
                  "overhead shot", "seen from below", "looking down", "close-up", "wide shot",
                  "medium shot", "seen from far off", "point of view", "camera")


def controler_sujets(sujets: list[tuple[str, str]]) -> list[str]:
    pb = []
    for nom, sujet in sujets:
        for mot in MOTS_DE_CAMERA:
            if mot in sujet.lower():
                pb.append(f"sujet : « {nom} » impose un cadrage (« {mot} ») — "
                          f"le cadrage vient de composer_*, décris la forme sans point de vue")
    return pb


def controler_cablage(emises: list[tuple[str, str]]) -> list[str]:
    """Chaque écran écrit a-t-il une cible, et chaque image une place ?

    ⚠️ Borné aux environnements ÉCRITS (ceux qui ont une entrée dans CABLAGE).
    Les images des trois autres n'ont pas d'écran parce que leurs scènes
    n'existent pas encore — les signaler serait crier à chaque génération
    jusqu'à ce que la zone entière soit écrite, et un garde qui crie pour
    rien finit ignoré.
    """
    src = (RACINE / "aldenhar/lib/scene-data.ts").read_text(encoding="utf-8")
    pb = []
    for env, table in CABLAGE.items():
        noms_env = [n for n, e in emises if e == env]
        for sid, img in table.items():
            if f'\n    id: "{sid}",' not in src:
                pb.append(f"câblage : l'écran « {sid} » n'existe pas dans scene-data.ts")
            if img and img not in noms_env:
                pb.append(f"câblage : « {sid} » vise « {img} », qui n'est pas une image de {env}")
        vises = {i for i in table.values() if i}
        for nom in noms_env:
            if nom not in vises and nom not in HORS_CABLAGE:
                pb.append(f"câblage : « {nom} » n'est posée sur aucun écran de {env} "
                          f"et n'est pas déclarée hors câblage")

    # ⚠️ LE DÉFAUT QU'ON A VRAIMENT EU (14/09) : une image ARRIVE du pipeline,
    # est déposée dans assets/, et personne ne la branche — l'écran continue de
    # servir le repli d'environnement, en silence. Le contrôle ci-dessus ne
    # pouvait pas l'attraper : il ne regarde que des NOMS, jamais le disque ni
    # ce que le jeu sert réellement. Donc : toute image de la bible qui existe
    # sur disque doit être citée par scene-data.ts (ou déclarée hors câblage).
    assets = RACINE / "aldenhar/public/assets"
    for nom, env in emises:
        if env not in CABLAGE or nom in HORS_CABLAGE:
            continue  # hors câblage : elle sert une ISSUE ou reste en réserve, pas un écran
        fichiers = sorted(assets.glob(nom + "*.png"))
        if not fichiers:
            continue  # pas encore produite : l'écran est sur le repli, c'est dit plus bas
        if not any(f.name in src for f in fichiers):
            noms = " / ".join(f.name for f in fichiers)
            pb.append(f"câblage : « {noms} » est sur le disque mais scene-data.ts "
                      f"ne la sert nulle part — l'écran reste sur le repli de zone")
    return pb


def manquantes(emises: list[tuple[str, str]]) -> list[tuple[str, str]]:
    """Les images de la bible qui n'existent pas encore sur le disque.

    Ce n'est pas une erreur : leur écran sert le repli d'environnement en
    attendant. C'est la liste de ce qu'il reste à produire.
    """
    assets = RACINE / "aldenhar/public/assets"
    return [(n, e) for n, e in emises if e in CABLAGE and not any(assets.glob(n + "*.png"))]


def invariants(env: str) -> str:
    manquants = [i for i in ENVS[env]["invariants"] if i not in INVARIANTS_EN]
    if manquants:
        raise SystemExit("bible visuelle : invariant sans version de prompt — " + " · ".join(manquants))
    return "with these three things always in the picture: " + ", ".join(
        INVARIANTS_EN[i] for i in ENVS[env]["invariants"])

def main() -> int:
    out = []
    out.append("# Les Salines — bible visuelle (validée le 13/09/2026)\n")
    out.append("Généré par `tools/bible_visuelle_salines.py` depuis `data/zones/salines.json` et `tools/style_image.py`. "
               "**Ne pas éditer à la main** : modifier le sujet dans le script, le ratio dans `CLAUSES_ENVIRONNEMENT`, "
               "les invariants dans le JSON.\n")
    out.append("## La règle (les trois oui de Patrick)\n")
    out.append("1. **Une image d'établissement par environnement**, qui sert de vue de marche et de fond de secours. "
               "**Chaque lieu joué a la sienne** (amendement Patrick du 14/09 : « je veux des images en plus pour "
               "chacune des scènes »), plus les **rencontres nommées** et les écrans qui regardent autre chose "
               "qu'un paysage. Le Ver n'a jamais la sienne : « une chose lointaine qui n'est pas toi », c'est lui.")
    out.append("2. **Les trois invariants** vivent dans l'image d'**établissement** — c'est elle qui définit la zone. "
               "Ils sont RETIRÉS des images de lieu (14/09) : mesuré, ils coûtaient ~25 mots par prompt et étaient "
               "les premiers lâchés par le modèle. La cohésion tient par les valeurs et la trame, qui, elles, tiennent.")
    out.append("3. **Le ratio de trame par le prompt** (`style_image.CLAUSES_ENVIRONNEMENT`), jamais par le seuil du dithering. "
               "Règle de zone : vue à la première personne, le héros n'est jamais dans l'image.\n")
    # ⚠️ Compte CALCULÉ, jamais écrit en dur : la première version annonçait
    # « 15 images » dans son en-tête, et ce chiffre serait devenu faux au
    # premier ajout sans que rien ne le signale.
    out.append(f"**{len(ETABLISSEMENT) + len(OBLIGATOIRES) + len(LIEUX_JOUES) + len(AUTRES_ECRANS) + len(RENCONTRES)} images** : "
               f"{len(ETABLISSEMENT)} établissements · {len(OBLIGATOIRES)} lieux obligatoires · "
               f"{len(LIEUX_JOUES)} lieux du pool · {len(AUTRES_ECRANS)} autres écrans · "
               f"{len(RENCONTRES)} rencontres. Deux variantes par image, le pipeline "
               "double le suffixe (`_a` → `_a_b`). Format `nom=prompt` pour `/leo-import`.\n")
    n = 0
    noms: list[tuple[str, str]] = []  # (nom de fichier, environnement)
    sujets: list[tuple[str, str]] = []  # (nom de fichier, sujet brut)
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
        noms.append((e["image_etablissement_attendue"], eid))
        sujets.append((e["image_etablissement_attendue"], ETABLISSEMENT[eid]))
        n += 1
        for lid, sujet in OBLIGATOIRES.items():
            L = LIEUX[lid]
            if L["environnement"] != eid:
                continue
            nom = f"scene_salines_{lid}_a"
            out.append(f"### {L['nom']} (obligatoire, {L['role']}) — `{nom}`\n")
            out.append(f"Ce que la bible dit : {L['note'].split('.')[0]}.\n")
            out.append("```\n" + f"{nom}=" + composer_environnement(sujet, eid) + "\n```\n")
            n += 1
            noms.append((nom, eid))
            sujets.append((nom, sujet))
        for lid, (env, nom, sujet) in LIEUX_JOUES.items():
            if env != eid:
                continue
            L = LIEUX[lid]
            out.append(f"### {L['nom']} (lieu joué, {L['role']}) — `{nom}`\n")
            out.append(f"Ce que la bible dit : {L['note'].split('.')[0]}.\n")
            out.append("```\n" + f"{nom}=" + composer_environnement(sujet, eid) + "\n```\n")
            n += 1
            noms.append((nom, eid))
            sujets.append((nom, sujet))
        for sid, (env, nom, mode, sujet) in AUTRES_ECRANS.items():
            if env != eid:
                continue
            cadrage = CADRAGE_DETAIL if mode == "detail" else CADRAGE_SUR_PLACE
            quoi = "gros plan" if mode == "detail" else "sur place"
            out.append(f"### `{sid}` ({quoi}) — `{nom}`\n")
            out.append("```\n" + f"{nom}=" + composer_cadre(sujet, eid, cadrage) + "\n```\n")
            n += 1
            noms.append((nom, eid))
            sujets.append((nom, sujet))
        for cid, (env, nom, sujet) in RENCONTRES.items():
            if env != eid:
                continue
            # ⚠️ Une « rencontre nommée » est tantôt une CRÉATURE de la bible
            # (les Piqueurs), tantôt une RENCONTRE (l'Encroûté du Radeau) :
            # on cherche dans les deux listes, sinon l'ajout d'un personnage
            # fait planter la génération sans dire pourquoi.
            C = next((c for c in Z["creatures"] + Z["rencontres"] if c["id"] == cid), None)
            if C is None:
                raise SystemExit(f"bible visuelle : « {cid} » n'est ni une créature ni une rencontre de salines.json")
            out.append(f"### {C['nom']} (rencontre) — `{nom}`\n")
            out.append(f"Ce que la bible dit : {C['note'].split('.')[0]}.\n")
            out.append("```\n" + f"{nom}=" + composer_cadre(sujet, eid, CADRAGE_RENCONTRE) + "\n```\n")
            n += 1
            noms.append((nom, eid))
            sujets.append((nom, sujet))
    out.append("\n## Ce qui n'a PAS d'image, et pourquoi\n")
    out.append("- **Le Ver de croûte** : jamais. Il est « la chose lointaine qui n'est pas toi » de l'établissement de la Croûte, et sous les pieds au Souffle.")
    out.append("- **Les lieux du pool des environnements PAS ENCORE ÉCRITS** : l'établissement de leur environnement, "
               "jusqu'à ce qu'ils soient écrits — un lieu prend son image quand son texte existe, sinon le prompt "
               "est une invention (règle du 14/09 : le sujet se prend dans la narration, mot à mot).")
    out.append("- **`bouche-3`** : rien de visible n'y change — un frottement TOURNE sous la croûte, et le fait "
               "qu'on ne le voie pas est tout l'effet. L'écran garde l'image de la Bouche.")
    out.append("- **Le Fossé** (beat d'arrivée de Saulnes) : l'établissement de Saulnes est déjà la vue de loin qu'il décrit.")
    out.append("- **Les créatures de DÉCOR** — Cristallins, Grumeaux, Léchards, Sauniers : on ne les regarde jamais en face, "
               "elles appartiennent à l'image du lieu.")
    out.append("- **Les créatures hostiles des environnements PAS ENCORE ÉCRITS** — Vermisseaux, Sauteurs de saumure, "
               "Assoiffés, Rats de saline : on ne commande pas une image pour une scène qui n'existe pas. Elles "
               "prendront la leur quand les Bassins, les Salines et Saulnes seront écrits, au même critère "
               "(le joueur la regarde en face → elle a son image).")
    out.append("\n## Le câblage — quel fichier sur quel écran\n")
    out.append("À appliquer dès que les fichiers sont dans `aldenhar/public/assets/`. "
               "Vérifié contre `lib/scene-data.ts` à chaque génération.\n")
    out.append("| écran | image |")
    out.append("|---|---|")
    for env, table in CABLAGE.items():
        for sid, img in table.items():
            out.append(f"| `{sid}` | {'`'+img+'`' if img else '— (carton)'} |")
    out.append("\nHors câblage :\n")
    for nom, pourquoi in HORS_CABLAGE.items():
        out.append(f"- `{nom}` — {pourquoi}")
    out.append("")

    # CE QU'IL RESTE À PRODUIRE — l'état du disque, pas une intention. Un écran
    # sans son image sert le repli d'environnement : il montre le bon endroit,
    # juste pas le bon détail.
    reste = manquantes(noms)
    out.append("\n## Ce qu'il reste à produire\n")
    if not reste:
        out.append("Rien : tous les écrans câblés ont leur image sur le disque.\n")
    else:
        ecran = {img: sid for table in CABLAGE.values() for sid, img in table.items() if img}
        out.append(f"{len(reste)} image(s). En attendant, ces écrans servent "
                   "l'image d'établissement de leur environnement.\n")
        out.append("| image | écran | environnement |")
        out.append("|---|---|---|")
        for nom, env in reste:
            out.append(f"| `{nom}` | `{ecran.get(nom, '—')}` | {env} |")
        out.append("")

    pb = controler_sujets(sujets) + controler_cablage(noms)
    if pb:
        raise SystemExit("\n".join(pb))

    SORTIE.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"{SORTIE.relative_to(RACINE)} — {n} images ({SORTIE.stat().st_size // 1024} Ko)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
