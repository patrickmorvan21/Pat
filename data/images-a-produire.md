# Images à produire — LES LANDES (Acte I)

Liste demandée par Patrick le 25/07 : des **plans rapprochés détaillés** pour les
points d'intérêt, en remplacement des crops CSS actuels.

**Contrainte n°1, valable pour toute la liste** : chaque plan rapproché doit
être dérivé de **l'image principale de son lieu** — même décor, même matière,
même source de lumière, même heure. Un plan rapproché qui ne raccorde pas avec
le plan large casse l'illusion qu'on s'est déplacé dans le MÊME endroit. En
pratique : ouvrir l'image du lieu à côté du prompt, et reprendre dans le prompt
ce qu'elle montre (pierre mouillée ou sèche, ciel bas ou dégagé, bruyère haute
ou rase…).

## Comment ça se branche

Le champ est déjà en place : `PointInteret.illustration`. Il suffit de
déposer le PNG dithéré dans `aldenhar/public/assets/` et de remplir ce champ
dans `lib/scene-data.ts` — **aucun autre code à toucher**. Tant que le champ est
vide, le crop CSS de l'image du lieu continue de servir : rien ne casse si la
liste n'est produite qu'en partie, et on peut avancer lieu par lieu.

## Bloc de style à coller à la fin de CHAQUE prompt

Le pipeline (`/leo-import`) réduit ensuite en Charbon `#1c1a16` / Orange
`#e0632a`, Floyd-Steinberg seuil 182, contraste 151 %, pixel size 3. Ce qui veut
dire qu'à la génération il faut viser **des masses lisibles, pas du détail fin** :
tout ce qui est texture délicate disparaît au tramage, et tout ce qui est
contre-jour franc gagne.

```
dark fantasy illustration, single strong light source, high contrast, deep black
shadows, monochrome-friendly, strong readable silhouettes, no text, no lettering,
matte painting, grim medieval rural, cold damp atmosphere, square composition,
centered subject, shallow depth of field
```

À ÉVITER dans les prompts : couleurs saturées (elles tombent toutes sur le même
orange), brume dense uniforme (devient un aplat), foules et détails minuscules,
tout texte gravé lisible (illisible après tramage — suggérer les marques, pas les
écrire).

## Nommage

`scene_{lieu}_{point}_{variante}.png` pour un décor, `monstre_{sujet}_{variante}.png`
pour un personnage. Exemple : `scene_colline_gibet_vide_a.png`.

---

# PRIORITÉ 1 — les 4 lieux garantis (12 images)

Ce sont les lieux que la traversée offre presque toujours : la Colline aux
Gibets (lieu-signature, poussée à chaque liaison), et les trois lieux qui
portent les chapitres du Bailli. C'est là que le gain est le plus visible.

## La Colline aux Gibets — base : `scene_colline_aux_gibets_c.png`

| Fichier | Point | Prompt (+ bloc de style) |
|---|---|---|
| `scene_colline_potences_cercle_a.png` | Les potences du cercle | `close view of a ring of weathered wooden gallows posts on a bare hilltop, each post with shallow carved notches near its base, wet dark wood, heather at the foot, low overcast sky behind, no bodies` |
| `scene_colline_gibet_vide_a.png` | Le Gibet Vide, au centre | `single tall well-built gallows standing alone on a hill crest, brand new pale rope hanging empty and slightly swaying, massive squared beams jointed to last centuries, its cast shadow stretching long across the ground and subtly wrong in shape, rare shaft of low sun` |
| `scene_colline_poteau_pendu_a.png` | Le poteau isolé, à gauche | `hanged old man in a magistrate's chain of office, still wearing a heavy seal ring, head lifted and eyes open, alive and watching, isolated gibbet post at the edge of a hilltop, rope taut, half-turned toward the viewer` |

## Le Petit Tribunal — base : `scene_petit_tribunal_a.png`

| Fichier | Point | Prompt (+ bloc de style) |
|---|---|---|
| `scene_tribunal_ordonnance_a.png` | La feuille clouée au mur | `single sheet of parchment nailed to a bare stone wall in a dim low room, four nails, curling edges, dense handwriting suggested but unreadable, cold light from one small window raking across the wall` |
| `scene_tribunal_chaire_a.png` | La chaire et son livre | `low wooden pulpit of a village court with a large open ledger resting on it, ruled columns of entries suggested, many lines struck through, worn lectern, single window light falling on the open pages` |
| `scene_tribunal_bancs_a.png` | Les bancs et leurs traces | `two rows of rough wooden benches in an empty village courtroom, the front bench polished smooth in its middle by generations of gripping hands and gnawed at the edges, tally notches cut into the side of the second bench, dust, raking light` |

## La Chapelle des Cordes — base : `scene_chapelle_des_cordes_d.png`

| Fichier | Point | Prompt (+ bloc de style) |
|---|---|---|
| `scene_chapelle_mur_cordes_a.png` | Le mur des cordes, au fond | `interior chapel wall covered with dozens of short cut ropes nailed in neat rows, each with a small pale paper tag, arranged like relics rather than trophies, one rope hanging slightly askew as if just moved, dim light from a high window` |
| `scene_chapelle_autel_a.png` | L'autel couché, sur le côté | `toppled stone altar lying on its side in a small stripped chapel, empty hollow underneath, a long coiled shape clearly missing from the dust, fresh clean patch in the grey dust, cold sidelight` |
| `scene_chapelle_ouvrage_a.png` | La chaise et l'ouvrage | `simple wooden chair in a chapel with an unfinished braiding work resting on the seat, three strands of new pale hemp half-plaited, tidy and patient craftsmanship, coil of raw hemp on the floor, warm single light` |

## Le Champ des Fixés — base : `scene_champ_des_fixes_b.png`

| Fichier | Point | Prompt (+ bloc de style) |
|---|---|---|
| `scene_champ_rangees_a.png` | Les rangées et leurs noms | `endless regular rows of low wooden grave posts in a bleak field, nearest posts freshly cut and pale, distant ones grey and eroded, shallow carved names suggested, flat overcast horizon` |
| `scene_champ_poteaux_vierges_a.png` | Les poteaux vierges, au fond | `three blank new grave posts standing apart at the far end of a burial field, already carved with names but no dates, the third carving noticeably fresher and paler than the others, turned earth at their feet` |
| `scene_champ_tombe_manquante_a.png` | Un vide dans une rangée pleine | `single conspicuous gap in an otherwise unbroken row of grave posts, old packed earth in the gap, the socket carefully filled in rather than torn out, neighbouring posts leaning slightly inward` |

---

# PRIORITÉ 2 — le Hameau, le Moulin, la Borne (9 images)

## Le Hameau (entrée) — bases : `scene_landes_hameau_ruelle_b.png`, `scene_landes_hameau_grange_a.png`

| Fichier | Point | Prompt (+ bloc de style) |
|---|---|---|
| `scene_hameau_croix_craie_a.png` | S'approcher de la croix | `rough chalk cross drawn on the weathered plank door of a village house, the wood visibly worn pale at that exact spot from crosses drawn and rubbed out many times before, close framing, damp grey daylight` |
| `monstre_femme_au_seuil_a.png` | La femme sur le pas de porte | `gaunt village woman standing motionless in a doorway, arms at her sides, gaze fixed far down the street to the south, not looking at the viewer, worn shawl, dark interior behind her` |
| `scene_hameau_grange_poutres_a.png` | Examiner la grange | `interior of a barn loft, tally marks cut into a roof beam at head height, several separate series of scratched strokes, the last series stopping at only two marks, straw dust in a single shaft of light` |

*(le point « Demander pourquoi trois aubes » de l'écran du Serment est un
dialogue — pas besoin d'image, l'écran garde le portrait de la Doyenne.)*

## Le Moulin sans Ailes (campement) — base : `scene_moulin_sans_ailes_c.png`

| Fichier | Point | Prompt (+ bloc de style) |
|---|---|---|
| `scene_moulin_croix_ombres_a.png` | La croix d'ombres, en haut | `stone windmill tower with no sails, four pale unweathered bands radiating from the top like a cross where the vanes once shielded the stone, seen from below at a distance, bleak sky` — ⚠️ le seul point où l'on RECULE (zoom 0.9) : cadrer plus LARGE que l'image du lieu, pas plus serré. |
| `scene_moulin_lucarne_a.png` | La lucarne, au-dessus de la porte | `small empty dormer opening above a mill door, inner sill conspicuously clean and dust-free unlike everything around it, dark opening, worn stone, low light` |
| `scene_moulin_interieur_a.png` | Pousser la porte entrouverte | `inside a derelict windmill, a straw pallet made up with squared-off care, a chipped clay pot holding fresh sprigs of heather, everything else decaying, nobody present, single beam of light from above` |

## La Borne Frontière — base actuelle : `scene_transition_borne_sud_a.png`
⚠️ Cette base est une image de **transition** (vue de marche), pas une vue de
lieu. Une `scene_borne_frontiere_a.png` dédiée serait utile — c'est le premier
écran de chaque run.

| Fichier | Point | Prompt (+ bloc de style) |
|---|---|---|
| `scene_borne_gravures_a.png` | Les gravures de la pierre | `close view of a tall rough granite boundary stone densely covered in carved marks on its north face — names, dates, tally strokes overlapping over centuries — while the south face beside it stays almost bare with only three marks, heather at its base` |
| `scene_borne_eclat_a.png` | Un angle cassé, au ras du sol | `broken-off corner of a granite boundary marker lying half buried in heather at ground level, freshly exposed pale fracture against the weathered surface, palm-sized, damp earth` |
| `monstre_hesitant_a.png` | L'homme qui regarde le sud | `man standing rigid facing south on open moorland, seen from behind and slightly to the side, the grass around his feet flattened and dead from days of standing, tension in his shoulders as if resisting rather than resting` |

---

# PRIORITÉ 3 — les lieux secondaires (12 images)

## Le Chemin Creux — base : `scene_chemin_creux_c.png`

| Fichier | Point | Prompt (+ bloc de style) |
|---|---|---|
| `scene_chemin_charrette_a.png` | La charrette embourbée | `abandoned cart sunk to its axles in mud in a sunken lane, empty bed, harness hanging cleanly cut rather than unbuckled, a small verdigrised bronze bell hanging from a nail under the seat, high earth banks on both sides` |
| `scene_chemin_talus_a.png` | Le haut des talus | `top edge of a sunken lane's earth bank seen from below, a line of paired footprints running parallel to the road along its whole length, tall grass, nothing visible making them` |
| `monstre_marcheur_rebours_b.png` | L'homme qui marche à reculons | `man walking backwards along a sunken lane, face turned toward what he is leaving behind, heels leading, arms loose, high banks channelling him, dusk` |

## La Mare aux Regards — base : `scene_mare_aux_regards_a.png`

| Fichier | Point | Prompt (+ bloc de style) |
|---|---|---|
| `scene_mare_berge_a.png` | Le point de berge usé | `two knee-shaped hollows worn into the mud at the edge of a still black pool, remade by hundreds of people at the same exact spot, clawed finger marks in the dried mud beside them, reeds` |
| `scene_mare_eau_a.png` | L'eau | `perfectly still black water surface seen from directly above at close range, a human reflection looking back up, the reflection's gaze lifted a fraction later than it should be, no ripples at all` |
| `scene_mare_miroir_a.png` | Le reflet de métal, dans les roseaux | `small tarnished pocket mirror lying among reeds at a pond's edge, cracked straight across the middle exactly where a face would be, dull metal catching the only light` |

## Le Verger Noir — base : `scene_verger_noir_d.png`

| Fichier | Point | Prompt (+ bloc de style) |
|---|---|---|
| `scene_verger_fruits_a.png` | Les fruits, dans les rangs | `close view of round heavy ash-grey fruit hanging from black-leaved branches, skin flawless and matte, unnaturally dense-looking, planted orchard rows receding behind` |
| `scene_verger_souche_a.png` | La souche, au bout du rang | `cleanly felled tree stump at the end of an orchard row, growth rings regular for decades then abruptly tight, black and illegible at the outer edge, axe cut smooth, dead leaves` |
| `monstre_epoux_verger_b.png` | Les deux qui bêchent, au fond | `elderly couple planting saplings in dead grey soil at the far end of a black orchard, one digging, one holding the sapling, methodical and unhurried, seen from a distance, backs to the viewer` |

## La Palissade Sud — base actuelle : `scene_lande_generique_4.png`
⚠️ **Ce lieu n'a PAS d'image propre** : il tourne sur une vue générique des
Landes. C'est le dernier lieu de la zone (le seuil de l'Acte II) — une
`scene_palissade_sud_a.png` dédiée est la plus utile de toute cette liste.

| Fichier | Point | Prompt (+ bloc de style) |
|---|---|---|
| `scene_palissade_rondins_a.png` | Les rondins et leurs pointes | `close view of a palisade of blackened sharpened logs, the points unmistakably angled inward toward the viewer's side rather than outward, lashings, damp wood, bleak sky above` |
| `scene_palissade_portillon_a.png` | Le portillon et son verrou | `small wooden gate set in a log palisade, a single heavy bolt on the north side, the surrounding planks deeply scratched at hand height by human fingers wanting through, worn threshold` |
| `monstre_veilleur_palissade_a.png` | L'homme de la guérite | `night watchman sitting in a narrow plank sentry box built against a palisade, barely wide enough for him and his lantern, lantern at his feet, watching the viewer approach with the patience of someone who saw them long ago` |

---

# Récapitulatif

| Priorité | Images | Ce que ça débloque |
|---|---|---|
| P1 | 12 | Colline, Tribunal, Chapelle, Champ — les lieux vus à presque chaque run |
| P2 | 9 | Hameau, Moulin, Borne — la halte garantie + le tout premier écran |
| P3 | 12 | Chemin Creux, Mare, Verger, Palissade |
| **Total plans rapprochés** | **33** | pour 34 points d'intérêt : celui de l'écran du Serment est un dialogue, il garde le portrait de la Doyenne |
| **À produire en plus — priorité haute** | **2** | `scene_palissade_sud_a.png` (le lieu n'a AUCUNE image propre) et `scene_borne_frontiere_a.png` (sa base est une image de transition) — ces deux-là valent mieux que n'importe quel plan rapproché |

Rien n'est bloquant : tant qu'un plan rapproché n'existe pas, le crop de
l'image du lieu tient la place.
