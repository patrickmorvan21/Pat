#!/usr/bin/env python3
"""LA BIBLE VISUELLE DES LANDES, en affiches (26/09).

Retour Patrick du 26/09, planche de seize références à l'appui : « je trouve les
photos des Landes trop génériques, trop réalistes, ça se voit que ce sont des
photos passées ensuite au pixel. On oublie le côté fantaisie du jeu […] l'idée
est qu'on a envie de mettre chaque image en fond d'écran. »

La recette vit dans `style_image.py` (`composer_affiche`, `composer_affiche_
rencontre`) — ce script n'écrit que les SUJETS, et c'est eux qui portent
l'impossible : une recette ne rend pas une image fantastique, un sujet oui.

⚠️ RETOUR DU 26/09 (soir), image-cible fournie : les Enlisés (`monstre_landes_
enlises_a_c`) — un grand APLAT orange sans rien dedans, les silhouettes noires
découpées contre lui, le sol en trame. Deux conséquences dans les sujets :
  · VUE À LA PREMIÈRE PERSONNE, aucune silhouette du héros (« on n'est pas
    censé voir notre héros ») ;
  · PLUS AUCUN SOLEIL CLAIR : un disque plus clair que l'aplat orange passe
    AU-DESSUS du seuil comme lui et disparaît au tramage. Ce qui se découpe
    contre l'aplat doit être NOIR (d'où « against the flat sky » partout).

Règles d'écriture des sujets (tenues ici, à tenir pour la suite) :
  · UNE figure géométrique nommée (disque, arche, rangées qui convergent,
    colonne, anneau, symétrie) et la source de lumière PLACÉE dans l'image ;
  · UNE chose impossible ou démesurée — c'est ce qui manquait aux Landes ;
  · la vérité du TEXTE du jeu d'abord : la Borne est un monolithe plus haut
    qu'un homme, la Colline une LIGNE de gibets sur une crête, la Chapelle a
    ses cordes le long des murs et l'autel DEBOUT au fond, la Meute est cinq
    bêtes de front… Et le Moulin sans Ailes ne se nomme JAMAIS « windmill » :
    le mot appelle les ailes, trois générations de suite l'ont prouvé.

Sortie : data/landes-bible-visuelle.md — un bloc `nom=prompt` par image, au
format de /leo-import. Noms en `_affiche_a` : une image regénérée ne garde
jamais son nom (règle du 30/07), et « affiche » dit la DA qui l'a produite.

Usage : python3 tools/bible_visuelle_landes.py
"""
from __future__ import annotations

import pathlib
import re
import sys

ICI = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ICI))
import style_image as S  # noqa: E402

RACINE = ICI.parent
SORTIE = RACINE / "data" / "landes-bible-visuelle.md"

# (environnement, nom de fichier, écran(s) visé(s), sujet)
LIEUX = [
    # ————— I. LA LANDE —————
    ("La Lande", "scene_landes_colonne_au_loin_affiche_a", "départ de la Borne (LANDE_DEPART_IMAGE)",
     "an immense flat moor under a vast sky, and at the far horizon one thin black column rising "
     "from the earth straight into the sky, impossibly tall, splitting the sky in two"),
    ("La Lande", "scene_landes_borne_frontiere_affiche_a", "borne-frontiere",
     "a single colossal black monolith standing alone on an endless flat moor, far taller than a man, "
     "rows of carved notches on its face, standing dead centre against the flat sky, the heather "
     "running flat to the horizon"),
    ("La Lande", "scene_landes_chemin_creux_affiche_a", "chemin-creux",
     "a sunken lane cut deep between two towering earth banks that lean inward like a closing throat, "
     "roots hanging from their lips, only a narrow slit of flat sky showing "
     "far above between their lips"),
    ("La Lande", "scene_landes_verger_noir_affiche_a", "verger-noir",
     "an orchard of black leafless trees planted in perfect converging rows, their branches knotted "
     "high above into a pointed gothic vault, the flat sky showing only at the far end of the central "
     "alley like a pointed doorway, a tiny cross shape standing in it"),
    ("La Lande", "scene_landes_tourbiere_affiche_a", "tourbiere",
     "a black bog stretching flat to the horizon like a mirror, one file of crooked wooden stakes "
     "marching across it to the horizon, the flat sky mirrored in the water as a second flat field"),
    ("La Lande", "scene_landes_cercle_qui_descend_affiche_a", "cercle-qui-descend (+ -2)",
     "a bare round hill whose stone circle has slid away: the tall standing stones all moved a dozen "
     "paces down the southern slope, each dragging a long dark furrow behind it, all leaning south, "
     "the empty ring in the middle open to the flat sky"),
    # ————— II. LES GIBETS —————
    ("Les Gibets", "scene_landes_colline_aux_gibets_affiche_a", "colline-aux-gibets",
     "a long crest line of black gallows in single file against the flat sky, the gallows in the middle "
     "standing empty, its rope hanging straight down"),
    ("Les Gibets", "scene_landes_champ_des_fixes_affiche_a", "champ-des-fixes",
     "a field of countless leaning wooden posts and tilted grave slabs planted in exact rows to the "
     "horizon, a short rope tied to the top of every post"),
    ("Les Gibets", "scene_landes_moulin_sans_ailes_affiche_a", "campement (le Moulin sans Ailes)",
     "a squat round stone tower with a bare truncated cap and one broken iron stub where nothing turns "
     "any more, alone on a ridge, its black shape dead centre against the flat sky, one "
     "small window glowing"),
    ("Les Gibets", "scene_landes_maison_du_bailli_affiche_a", "chien-du-bailli (la maison)",
     "a tall narrow stone house with every door and window walled up from the inside, a massive iron "
     "chain running from its threshold across the ground, the house a black tombstone against "
     "the flat sky"),
    # ————— III. LE HAMEAU —————
    ("Le Hameau", "scene_landes_seuil_du_hameau_affiche_a", "serment-hameau / hameau-entree",
     "a low wooden barrier across a path at the edge of a huddled village of thatched roofs, three tall "
     "hooded men standing behind it shoulder to shoulder, a pale chalk cross on every door, the flat "
     "sky wedged between two roofs"),
    ("Le Hameau", "scene_landes_grange_affiche_a", "hameau-halte (la grange)",
     "inside a vast timber barn at night, sleepers lying in straw in perfect rows, one lantern on the "
     "floor throwing a hard ring of light, a blade of light through the gap of the shut great doors "
     "cut by the shadow of the bar laid across them outside"),
    ("Le Hameau", "scene_landes_chapelle_des_cordes_affiche_a", "chapelle-des-cordes",
     "a tall narrow stone chapel, hundreds of ropes hanging straight down from the high vault along both "
     "side walls like organ pipes, a standing stone altar at the far end under one tall pointed window "
     "blazing with light, the whole nave perfectly symmetrical"),
    ("Le Hameau", "scene_landes_petit_tribunal_affiche_a", "petit-tribunal",
     "a low vaulted stone hall, three rows of empty wooden benches facing one high chair, behind the "
     "chair a tall arch filled entirely with blinding light, an enormous open register on a lectern"),
    ("Le Hameau", "scene_landes_puits_condamne_affiche_a", "puits-condamne",
     "an old stone well in the middle of a tiny square, its mouth shut with heavy planks and crossed "
     "chains, one plank pried open, a hard shaft of light falling into the gap, the houses leaning "
     "toward the well"),
    ("Le Hameau", "scene_landes_marche_muet_affiche_a", "marche-muet",
     "a narrow market under a canopy of stretched tarps, stalls in two symmetrical rows, hooded traders "
     "trading with raised hands and closed mouths, a round hole in the tarp showing the flat sky"),
    ("Le Hameau", "scene_landes_tour_de_guet_affiche_a", "tour-de-guet",
     "a broken watchtower whose top has collapsed inward into a jagged crown, its only window facing "
     "the village and not the moor, the broken crown cut out against the flat sky"),
    # ————— IV. LE SUD —————
    ("Le Sud", "scene_landes_palissade_sud_affiche_a", "palissade-sud",
     "a towering palisade of sharpened logs stretching endlessly left and right, every point turned "
     "inward toward the village and none outward, one small door in it, blinding light from the south "
     "cutting through the gaps between the logs"),
    ("Le Sud", "scene_landes_chemin_du_sud_affiche_a", "chemin-du-sud",
     "a straight road running south to a knife-edge horizon, along both sides hundreds of abandoned "
     "belongings — boots, bundles, staffs, cloaks — carefully set down and all turned to face south, a "
     "flat sky at the vanishing point"),
    ("Le Sud", "scene_landes_falaise_aux_cordes_affiche_a", "falaise-cordes",
     "the edge of the world: a cliff falling into a bottomless black chasm, and thousands of black ropes "
     "hanging out of the flat sky in one dense column that plunges straight down into the void"),
]

RENCONTRES = [
    # ————— les créatures —————
    ("La Lande", "monstre_landes_bete_chemins_creux_affiche_a", "bete-chemins-creux",
     "a monstrous low beast filling a sunken lane from wall to wall, long as a cart, head lowered to "
     "the ground, a mane of torn black rags, two small white points for eyes, seen head-on at the end "
     "of the narrow corridor with the light behind it"),
    ("La Lande", "monstre_landes_epouvantail_affiche_a", "verger-noir-2",
     "a gigantic scarecrow on its wooden cross at the end of an orchard alley of black trees, its sack "
     "head turned all the way round to look backwards, straw arms spread wide, the flat sky "
     "behind the cross"),
    ("La Lande", "monstre_landes_enlises_affiche_a", "tourbiere-2",
     "hundreds of pale arms rising out of a black bog in straight rows between wooden stakes, all "
     "reaching up toward the flat sky, fingers open, only the arms and never the bodies"),
    ("La Lande", "monstre_landes_meute_grise_affiche_a", "meute-grise-1 / -2, menace-retour-meute",
     "five gaunt grey hounds standing abreast in one line across the heather, heads low, facing the "
     "viewer, five black cut-outs against the flat sky with light between their legs"),
    ("La Lande", "monstre_landes_recousu_affiche_a", "menace-retour-recousu",
     "a tall figure made of many bodies stitched together with thick black thread, seams running over "
     "its whole body, standing in waist-high heather, patient, head tilted, cut out against the flat "
     "sky"),
    ("La Lande", "monstre_landes_geant_couche_affiche_a", "geant-couche (rencontre de passage)",
     "a colossal giant lying asleep under the moor, the heather grown over him like fur, his arm a long "
     "ridge running across the whole frame, his shoulder a hill, his huge sleeping head resting on the "
     "horizon, the whole landscape rising with his breath"),
    ("La Lande", "monstre_landes_noeud_affiche_a", "noeud (rencontre de passage)",
     "a gigantic ball of tangled gallows ropes taller than a house rolling down a heather slope straight "
     "toward the viewer, nooses still tied in it, pale hands caught inside the tangle, loose rope ends "
     "whipping behind it"),
    ("Les Gibets", "monstre_landes_corbeaux_du_compte_affiche_a", "colline-aux-gibets (examen)",
     "hundreds of black crows perched in exact rows along the crossbeams of a line of gallows, all "
     "turned the same way as if counting, against the flat sky"),
    ("Les Gibets", "monstre_landes_pendu_mal_fixe_affiche_a", "pendu-mal-fixe",
     "a hanged man on a leaning post in a field of posts, his rope so badly tied that he has slipped "
     "down until his feet touch the ground, standing bent like a puppet, head cocked, against the flat sky"),
    ("Les Gibets", "monstre_landes_chien_du_bailli_affiche_a", "chien-du-bailli-2",
     "a huge black mastiff on a massive iron chain in front of a walled-up house, sitting perfectly "
     "still, the chain taut across the frame, the house black against the flat sky"),
    ("Le Hameau", "monstre_landes_mains_du_puits_affiche_a", "puits-condamne-2",
     "a dozen long pale forearms reaching up out of the dark mouth of a well between broken planks and "
     "chains, gripping the stone rim, a hard shaft of light falling into the well"),
    ("Le Hameau", "monstre_landes_troupeau_affiche_a", "troupeau (ambiance)",
     "a flock of gaunt sheep grazing in perfect order on a hillside with no shepherd, every head raised "
     "at the same instant toward the viewer, the crest behind them against the flat sky"),
    ("Le Sud", "monstre_landes_appele_affiche_a", "palissade-sud-2",
     "a lone hooded figure seen from behind walking south down a straight path toward a colossal column "
     "of ropes hanging out of the sky at the horizon, arms slack, never looking back"),
    # ————— les rencontres —————
    ("Les Gibets", "monstre_landes_pendu_qui_parle_affiche_a", "pendu-qui-parle",
     "the old Bailli hanging from a tall gallows so that his body is at eye level, alive, eyes open, "
     "speaking, a heavy iron seal on his chest, the taut rope rising into the flat sky"),
    ("La Lande", "monstre_landes_hesitant_affiche_a", "hesitant-1..3",
     "a man standing perfectly still beside a colossal black monolith on the moor, facing south, one "
     "foot raised and frozen mid-step, against the flat sky"),
    ("La Lande", "monstre_landes_marcheur_a_rebours_affiche_a", "chemin-creux-2 (le Marcheur)",
     "a hooded traveller walking backwards down a sunken lane, his face turned back the way he came, a "
     "heavy cart bell at his belt, a hard slit of light behind him"),
    ("La Lande", "monstre_landes_epoux_affiche_a", "epoux-1..3",
     "a man and a woman standing straight side by side in an orchard alley of black trees, a spade "
     "planted in the earth between them, a small fresh grave mound at their feet, the flat sky between "
     "their heads"),
    ("Le Hameau", "monstre_landes_femme_au_seuil_affiche_a", "femme-seuil-1..3",
     "a woman standing on the threshold of a doorway marked with a white chalk cross, a broom held "
     "across the frame like a bar, the lit room blazing behind her"),
    ("Le Hameau", "monstre_landes_veuve_aux_cordes_affiche_a", "chapelle-des-cordes-2",
     "a widow in black braiding one long rope, the rope rising from her hands into a vault full of "
     "hanging ropes, one tall window blazing behind her"),
    ("Les Gibets", "monstre_landes_fossoyeur_affiche_a", "champ-des-fixes-2",
     "a gravedigger in a field of posts driving a new bare post into a fresh hole, a stack of blank "
     "posts on his shoulder, against the flat sky"),
    ("Les Gibets", "monstre_landes_petite_fixee_affiche_a", "champ-des-fixes (examen)",
     "one small wooden post in a field of tall posts, shorter than all the others, a child's wooden toy "
     "tied to it with a ribbon, the earth at its foot dug up and filled in again"),
    ("Les Gibets", "monstre_landes_la_fille_affiche_a", "campement (la Fille)",
     "the small silhouette of a girl standing in the one lit window of a squat round stone tower, a "
     "length of frayed rope hanging from her hand, watching"),
    ("Le Hameau", "monstre_landes_ecrivain_public_affiche_a", "petit-tribunal-2",
     "a scribe hunched over a gigantic open register on a lectern in a stone hall, the pages full of "
     "columns of names, one tall backlit arch behind him"),
    ("Le Hameau", "monstre_landes_colporteur_affiche_a", "marche-muet-2",
     "a peddler bent under an enormous pack hung with hundreds of small objects, standing under a tarp "
     "in a silent market, one hand raised in a trading gesture"),
    ("Le Hameau", "monstre_landes_rebouteux_affiche_a", "marche-muet (le Rebouteux)",
     "a bonesetter holding a man's arm in both hands in a narrow lane, strings of little bones and "
     "knotted cords hanging from his belt"),
    ("Le Hameau", "monstre_landes_doyenne_affiche_a", "serment-hameau-2",
     "a very old woman sitting upright in a chair set in the middle of the village path, a heavy key "
     "ring in her lap, the thatched houses leaning in around her"),
    ("Le Hameau", "monstre_landes_sonneur_sans_cloche_affiche_a", "hameau (le Sonneur)",
     "a bell-ringer hauling on a rope that rises into an empty bell tower with no bell, the rope "
     "vanishing into the dark opening, the flat sky framed in the empty arch"),
    ("Le Hameau", "monstre_landes_gamin_des_murets_affiche_a", "hameau (le Gamin)",
     "a small boy crouched on top of a dry-stone wall, a pebble raised in his hand, the village walls "
     "running in lines behind him, against the flat sky"),
    ("Le Sud", "monstre_landes_veilleur_affiche_a", "veilleur-1..3",
     "a watchman standing on the walkway of a palisade of sharpened logs, back to the south, a rusted "
     "lantern held out over the village side, the flat southern sky behind him"),
]

# Mots INTERDITS dans un sujet, et pourquoi.
INTERDITS = {
    "windmill": "appelle les ailes (Moulin sans Ailes : trois générations ratées)",
    "mill": "même piège que windmill",
    "photo": "c'est exactement le défaut du 26/09",
    "sun": "un soleil clair disparaît au tramage : contre l'aplat orange, seul le NOIR se lit",
    "silhouette seen from behind": "le héros n'est jamais dans l'image",
}


def controler(emis: list[tuple[str, str]]) -> list[str]:
    pb: list[str] = []
    noms = [n for n, _ in emis]
    if len(noms) != len(set(noms)):
        pb.append("noms en double : " + ", ".join(sorted({n for n in noms if noms.count(n) > 1})))
    for nom, prompt in emis:
        for c in S.contradictions(prompt):
            pb.append(f"{nom} : {c}")
        if len(prompt) > S.LIMITE_PROMPT:
            pb.append(f"{nom} : {len(prompt)} caractères, au-delà de {S.LIMITE_PROMPT} (Leonardo coupe)")
        sujet = prompt.split(S.COMPOSITION_AFFICHE)[0].split(S.COMPOSITION_RENCONTRE)[0].lower()
        for mot, pourquoi in INTERDITS.items():
            if re.search(rf"\b{re.escape(mot)}\b", sujet):
                pb.append(f"{nom} : « {mot} » dans le sujet — {pourquoi}")
    return pb


def main() -> int:
    emis: list[tuple[str, str]] = []
    L = [
        "# Les Landes — bible visuelle en affiches",
        "",
        "_Généré par `tools/bible_visuelle_landes.py` — ne pas éditer à la main._",
        "",
        "Retour du 26/09 : les images des Landes étaient « trop génériques, trop réalistes, des photos "
        "passées au pixel ». Chaque prompt ci-dessous vise une **affiche** — une couleur dominante et le "
        "noir, une figure géométrique découpée en noir contre un aplat orange, une échelle écrasante et quelque chose "
        "d'impossible — à l'image de la planche de références.",
        "",
        "## Deux choses à savoir avant de générer",
        "",
        "1. **La couleur dominante doit être lumineuse.** Notre tramage coupe à un seuil de luminosité : "
        "un rouge sang comme sur la planche ressort à ~14 % d'orange (du gris moucheté). Les prompts "
        "demandent donc un orange-rouge *ardent*. Si Leonardo rend quand même un rouge sombre, importer "
        "avec `--canal max` : `python3 tools/dither_batch.py --canal max …` lit l'image sur sa couleur "
        "dominante — mesuré sur cinq références : de 1-18 % d'orange à 18-57 %, la composition intacte "
        "(`data/references/trame_references.png`).",
        "2. **L'aplat orange, à la première personne.** Image-cible : les Enlisés (`monstre_landes_"
        "enlises_a_c`) — un grand aplat orange sans rien dedans, les silhouettes noires découpées "
        "contre lui. Le héros n'est jamais dans l'image. Et **aucun soleil clair** : un disque plus "
        "clair que l'aplat disparaît au tramage — contre l'aplat, seul le noir se lit.",
        "",
        f"**{len(LIEUX)} lieux · {len(RENCONTRES)} rencontres · {len(LIEUX) + len(RENCONTRES)} images.** "
        "Noms en `_affiche_a` : une image regénérée ne reprend jamais un nom existant.",
        "",
    ]

    def bloc(titre: str, items, composer) -> None:
        L.append(f"## {titre}")
        L.append("")
        env_courant = None
        for env, nom, ecran, sujet in items:
            if env != env_courant:
                L.append(f"### {env}")
                L.append("")
                env_courant = env
            p = composer(sujet)
            emis.append((nom, p))
            L.append(f"**`{nom}`** — {ecran}")
            L.append("")
            L.append("```")
            L.append(f"{nom}={p}")
            L.append("```")
            L.append("")

    bloc("Les lieux", LIEUX, S.composer_affiche)
    bloc("Les rencontres", RENCONTRES, S.composer_affiche_rencontre)

    pb = controler(emis)
    if pb:
        print("BIBLE DES LANDES — génération refusée :")
        for x in pb:
            print("  ✗ " + x)
        return 1
    SORTIE.write_text("\n".join(L), encoding="utf-8")
    longs = max(len(p) for _, p in emis)
    print(f"{SORTIE.relative_to(RACINE)} — {len(emis)} prompts, le plus long {longs} car., 0 contradiction")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
