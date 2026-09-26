# Les Landes — bible visuelle en affiches

_Généré par `tools/bible_visuelle_landes.py` — ne pas éditer à la main._

Retour du 26/09 : les images des Landes étaient « trop génériques, trop réalistes, des photos passées au pixel ». Chaque prompt ci-dessous vise une **affiche** — une couleur dominante et le noir, une figure géométrique, la lumière dans l'image, une échelle écrasante et quelque chose d'impossible — à l'image de la planche de références.

## Deux choses à savoir avant de générer

1. **La couleur dominante doit être lumineuse.** Notre tramage coupe à un seuil de luminosité : un rouge sang comme sur la planche ressort à ~14 % d'orange (du gris moucheté). Les prompts demandent donc un orange-rouge *ardent*. Si Leonardo rend quand même un rouge sombre, importer avec `--canal max` : `python3 tools/dither_batch.py --canal max …` lit l'image sur sa couleur dominante — mesuré sur cinq références : de 1-18 % d'orange à 18-57 %, la composition intacte (`data/references/trame_references.png`).
2. **Une silhouette minuscule, de dos, sur les lieux.** C'est ce qui donne l'échelle à toutes les références. Jamais de visage. (Les Salines gardent leur vue à la première personne.)

**20 lieux · 27 rencontres · 47 images.** Noms en `_affiche_a` : une image regénérée ne reprend jamais un nom existant.

## Les lieux

### La Lande

**`scene_landes_colonne_au_loin_affiche_a`** — départ de la Borne (LANDE_DEPART_IMAGE)

```
scene_landes_colonne_au_loin_affiche_a=an immense flat moor under a vast sky, and at the far horizon one thin black column rising from the earth straight into the sky, impossibly tall, splitting the sky in two, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_borne_frontiere_affiche_a`** — borne-frontiere

```
scene_landes_borne_frontiere_affiche_a=a single colossal black monolith standing alone on an endless flat moor, far taller than a man, rows of carved notches on its face, a gigantic low sun disc sitting exactly behind it so the stone cuts the disc in two, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_chemin_creux_affiche_a`** — chemin-creux

```
scene_landes_chemin_creux_affiche_a=a sunken lane cut deep between two towering earth banks that lean inward like a closing throat, roots hanging from their lips, one narrow blade of light falling straight down the lane from a slit of sky, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_verger_noir_affiche_a`** — verger-noir

```
scene_landes_verger_noir_affiche_a=an orchard of black leafless trees planted in perfect converging rows, their branches knotted overhead into a pointed gothic vault, a huge sun at the vanishing point of the central alley, a tiny cross shape standing far down that alley, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_tourbiere_affiche_a`** — tourbiere

```
scene_landes_tourbiere_affiche_a=a black bog stretching flat to the horizon like a mirror, one file of crooked wooden stakes marching across it toward a huge low sun, the stakes and their reflections forming one long line, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_cercle_qui_descend_affiche_a`** — cercle-qui-descend (+ -2)

```
scene_landes_cercle_qui_descend_affiche_a=a bare round hill whose stone circle has slid away: the tall standing stones all moved a dozen paces down the southern slope, each dragging a long dark furrow behind it, all leaning south, a huge sun disc sitting exactly in the empty centre of the ring, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

### Les Gibets

**`scene_landes_colline_aux_gibets_affiche_a`** — colline-aux-gibets

```
scene_landes_colline_aux_gibets_affiche_a=a long crest line of black gallows in single file against a gigantic setting sun, the gallows in the middle standing empty, its rope hanging straight down across the centre of the sun disc, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_champ_des_fixes_affiche_a`** — champ-des-fixes

```
scene_landes_champ_des_fixes_affiche_a=a field of countless leaning wooden posts and tilted grave slabs planted in exact rows to the horizon, a short rope tied to the top of every post, a huge sun low between the rows, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_moulin_sans_ailes_affiche_a`** — campement (le Moulin sans Ailes)

```
scene_landes_moulin_sans_ailes_affiche_a=a squat round stone tower with a bare truncated cap and one broken iron stub where nothing turns any more, alone on a ridge, its black shape dead centre in front of an enormous sun disc, one small window lit from inside, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_maison_du_bailli_affiche_a`** — chien-du-bailli (la maison)

```
scene_landes_maison_du_bailli_affiche_a=a tall narrow stone house with every door and window walled up from the inside, a massive iron chain running from its threshold across the ground, a huge sun behind turning the house into a black tombstone, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

### Le Hameau

**`scene_landes_seuil_du_hameau_affiche_a`** — serment-hameau / hameau-entree

```
scene_landes_seuil_du_hameau_affiche_a=a low wooden barrier across a path at the edge of a huddled village of thatched roofs, three tall hooded men standing behind it shoulder to shoulder, a white chalk cross on every door, a low sun wedged in the gap between two roofs, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_grange_affiche_a`** — hameau-halte (la grange)

```
scene_landes_grange_affiche_a=inside a vast timber barn at night, sleepers lying in straw in perfect rows, one lantern on the floor throwing a hard ring of light, a blade of light through the gap of the shut great doors cut by the shadow of the bar laid across them outside, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_chapelle_des_cordes_affiche_a`** — chapelle-des-cordes

```
scene_landes_chapelle_des_cordes_affiche_a=a tall narrow stone chapel, hundreds of ropes hanging straight down from the high vault along both side walls like organ pipes, a standing stone altar at the far end under one tall pointed window blazing with light, the whole nave perfectly symmetrical, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_petit_tribunal_affiche_a`** — petit-tribunal

```
scene_landes_petit_tribunal_affiche_a=a low vaulted stone hall, three rows of empty wooden benches facing one high chair, behind the chair a tall arch filled entirely with blinding light, an enormous open register on a lectern, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_puits_condamne_affiche_a`** — puits-condamne

```
scene_landes_puits_condamne_affiche_a=an old stone well in the middle of a tiny square, its mouth shut with heavy planks and crossed chains, one plank pried open, a hard shaft of light falling into the gap, the houses leaning toward the well, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_marche_muet_affiche_a`** — marche-muet

```
scene_landes_marche_muet_affiche_a=a narrow market under a canopy of stretched tarps, stalls in two symmetrical rows, hooded traders trading with raised hands and closed mouths, the sun a hard disc through a round hole in the tarp, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_tour_de_guet_affiche_a`** — tour-de-guet

```
scene_landes_tour_de_guet_affiche_a=a broken watchtower whose top has collapsed inward into a jagged crown, its only window facing the village and not the moor, a huge sun directly behind the broken crown, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

### Le Sud

**`scene_landes_palissade_sud_affiche_a`** — palissade-sud

```
scene_landes_palissade_sud_affiche_a=a towering palisade of sharpened logs stretching endlessly left and right, every point turned inward toward the village and none outward, one small door in it, blinding light from the south cutting through the gaps between the logs, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_chemin_du_sud_affiche_a`** — chemin-du-sud

```
scene_landes_chemin_du_sud_affiche_a=a straight road running south to a knife-edge horizon, along both sides hundreds of abandoned belongings — boots, bundles, staffs, cloaks — carefully set down and all turned to face south, a huge sun sinking at the vanishing point, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`scene_landes_falaise_aux_cordes_affiche_a`** — falaise-cordes

```
scene_landes_falaise_aux_cordes_affiche_a=the edge of the world: a cliff falling into a bottomless black chasm, and thousands of ropes hanging out of the sky in one dense column that plunges straight down into the void, the column lit from within like a shaft of fire, poster composition built on one bold geometric figure filling the frame, the light source visible in frame, everything in front of it a flat black cut-out, crushing scale, one tiny hooded silhouette seen from behind for scale, no face, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

## Les rencontres

### La Lande

**`monstre_landes_bete_chemins_creux_affiche_a`** — bete-chemins-creux

```
monstre_landes_bete_chemins_creux_affiche_a=a monstrous low beast filling a sunken lane from wall to wall, long as a cart, head lowered to the ground, a mane of torn black rags, two small white points for eyes, seen head-on at the end of the narrow corridor with the light behind it, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_epouvantail_affiche_a`** — verger-noir-2

```
monstre_landes_epouvantail_affiche_a=a gigantic scarecrow on its wooden cross at the end of an orchard alley of black trees, its sack head turned all the way round to look backwards, straw arms spread wide, a huge sun disc right behind the cross, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_enlises_affiche_a`** — tourbiere-2

```
monstre_landes_enlises_affiche_a=hundreds of pale arms rising out of a black bog in straight rows between wooden stakes, all reaching up toward a low sun, fingers open, only the arms and never the bodies, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_meute_grise_affiche_a`** — meute-grise-1 / -2, menace-retour-meute

```
monstre_landes_meute_grise_affiche_a=five gaunt grey hounds standing abreast in one line across the heather, heads low, facing the viewer, a huge low sun behind them so they are five black cut-outs with light between their legs, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_recousu_affiche_a`** — menace-retour-recousu

```
monstre_landes_recousu_affiche_a=a tall figure made of many bodies stitched together with thick black thread, seams running over its whole body, standing in waist-high heather, patient, head tilted, a gigantic sun disc behind its head, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

### Les Gibets

**`monstre_landes_corbeaux_du_compte_affiche_a`** — colline-aux-gibets (examen)

```
monstre_landes_corbeaux_du_compte_affiche_a=hundreds of black crows perched in exact rows along the crossbeams of a line of gallows, all turned the same way as if counting, a huge sun behind them, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_pendu_mal_fixe_affiche_a`** — pendu-mal-fixe

```
monstre_landes_pendu_mal_fixe_affiche_a=a hanged man on a leaning post in a field of posts, his rope so badly tied that he has slipped down until his feet touch the ground, standing bent like a puppet, head cocked, a low sun behind, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_chien_du_bailli_affiche_a`** — chien-du-bailli-2

```
monstre_landes_chien_du_bailli_affiche_a=a huge black mastiff on a massive iron chain in front of a walled-up house, sitting perfectly still, the chain taut across the frame, the sun behind the house, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

### Le Hameau

**`monstre_landes_mains_du_puits_affiche_a`** — puits-condamne-2

```
monstre_landes_mains_du_puits_affiche_a=a dozen long pale forearms reaching up out of the dark mouth of a well between broken planks and chains, gripping the stone rim, a hard shaft of light falling into the well, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_troupeau_affiche_a`** — troupeau (ambiance)

```
monstre_landes_troupeau_affiche_a=a flock of gaunt sheep grazing in perfect order on a hillside with no shepherd, every head raised at the same instant toward the viewer, a huge sun on the crest behind them, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

### Le Sud

**`monstre_landes_appele_affiche_a`** — palissade-sud-2

```
monstre_landes_appele_affiche_a=a lone hooded figure seen from behind walking south down a straight path toward a colossal column of ropes hanging out of the sky at the horizon, arms slack, never looking back, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

### Les Gibets

**`monstre_landes_pendu_qui_parle_affiche_a`** — pendu-qui-parle

```
monstre_landes_pendu_qui_parle_affiche_a=the old Bailli hanging from a tall gallows so that his body is at eye level, alive, eyes open, speaking, a heavy iron seal on his chest, the taut rope rising into a colossal sun disc, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

### La Lande

**`monstre_landes_hesitant_affiche_a`** — hesitant-1..3

```
monstre_landes_hesitant_affiche_a=a man standing perfectly still beside a colossal black monolith on the moor, facing south, one foot raised and frozen mid-step, the low sun ahead of him, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_marcheur_a_rebours_affiche_a`** — chemin-creux-2 (le Marcheur)

```
monstre_landes_marcheur_a_rebours_affiche_a=a hooded traveller walking backwards down a sunken lane, his face turned back the way he came, a heavy cart bell at his belt, a hard slit of light behind him, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_epoux_affiche_a`** — epoux-1..3

```
monstre_landes_epoux_affiche_a=a man and a woman standing straight side by side in an orchard alley of black trees, a spade planted in the earth between them, a small fresh grave mound at their feet, a huge sun between their heads, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

### Le Hameau

**`monstre_landes_femme_au_seuil_affiche_a`** — femme-seuil-1..3

```
monstre_landes_femme_au_seuil_affiche_a=a woman standing on the threshold of a doorway marked with a white chalk cross, a broom held across the frame like a bar, the lit room blazing behind her, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_veuve_aux_cordes_affiche_a`** — chapelle-des-cordes-2

```
monstre_landes_veuve_aux_cordes_affiche_a=a widow in black braiding one long rope, the rope rising from her hands into a vault full of hanging ropes, one tall window blazing behind her, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

### Les Gibets

**`monstre_landes_fossoyeur_affiche_a`** — champ-des-fixes-2

```
monstre_landes_fossoyeur_affiche_a=a gravedigger in a field of posts driving a new bare post into a fresh hole, a stack of blank posts on his shoulder, the sun low behind, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_petite_fixee_affiche_a`** — champ-des-fixes (examen)

```
monstre_landes_petite_fixee_affiche_a=one small wooden post in a field of tall posts, shorter than all the others, a child's wooden toy tied to it with a ribbon, the earth at its foot dug up and filled in again, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_la_fille_affiche_a`** — campement (la Fille)

```
monstre_landes_la_fille_affiche_a=the small silhouette of a girl standing in the one lit window of a squat round stone tower, a length of frayed rope hanging from her hand, watching, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

### Le Hameau

**`monstre_landes_ecrivain_public_affiche_a`** — petit-tribunal-2

```
monstre_landes_ecrivain_public_affiche_a=a scribe hunched over a gigantic open register on a lectern in a stone hall, the pages full of columns of names, one tall backlit arch behind him, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_colporteur_affiche_a`** — marche-muet-2

```
monstre_landes_colporteur_affiche_a=a peddler bent under an enormous pack hung with hundreds of small objects, standing under a tarp in a silent market, one hand raised in a trading gesture, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_rebouteux_affiche_a`** — marche-muet (le Rebouteux)

```
monstre_landes_rebouteux_affiche_a=a bonesetter holding a man's arm in both hands in a narrow lane, strings of little bones and knotted cords hanging from his belt, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_doyenne_affiche_a`** — serment-hameau-2

```
monstre_landes_doyenne_affiche_a=a very old woman sitting upright in a chair set in the middle of the village path, a heavy key ring in her lap, the thatched houses leaning in around her, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_sonneur_sans_cloche_affiche_a`** — hameau (le Sonneur)

```
monstre_landes_sonneur_sans_cloche_affiche_a=a bell-ringer hauling on a rope that rises into an empty bell tower with no bell, the rope vanishing into the dark opening, the sun framed in the empty arch, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

**`monstre_landes_gamin_des_murets_affiche_a`** — hameau (le Gamin)

```
monstre_landes_gamin_des_murets_affiche_a=a small boy crouched on top of a dry-stone wall, a pebble raised in his hand, the village walls running in lines behind him, the sun behind, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```

### Le Sud

**`monstre_landes_veilleur_affiche_a`** — veilleur-1..3

```
monstre_landes_veilleur_affiche_a=a watchman standing on the walkway of a palisade of sharpened logs, back to the south, a rusted lantern held out over the village side, the blinding southern light behind him, poster composition: the creature is the bold central shape, a flat black cut-out against one hard geometric field of light, crushing scale, only two tones: one bright blazing ember orange-red laid in large flat fields, and pure black; no third hue, no grey, light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient, medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, flat simplified shapes, mythic and surreal, not a photograph, no photorealism, no grain, no text, no watermark
```
