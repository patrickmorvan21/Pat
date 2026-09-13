# Les Salines — bible visuelle (validée le 13/09/2026)

Généré par `tools/bible_visuelle_salines.py` depuis `data/zones/salines.json` et `tools/style_image.py`. **Ne pas éditer à la main** : modifier le sujet dans le script, le ratio dans `CLAUSES_ENVIRONNEMENT`, les invariants dans le JSON.

## La règle (les trois oui de Patrick)

1. **Une image d'établissement par environnement**, servie par défaut à tout beat sans image dédiée. Images dédiées seulement aux **six lieux obligatoires** et aux **rencontres nommées**. Le Ver n'a jamais la sienne : « une chose lointaine qui n'est pas toi », c'est lui.
2. **Les trois invariants** de l'environnement entrent dans chaque image dédiée.
3. **Le ratio de trame par le prompt** (`style_image.CLAUSES_ENVIRONNEMENT`), jamais par le seuil du dithering. Règle de zone : vue à la première personne, le héros n'est jamais dans l'image.

**15 images** : 4 établissements · 6 obligatoires · 5 rencontres. Deux variantes par image, le pipeline double le suffixe (`_a` → `_a_b`). Format `nom=prompt` pour `/leo-import`.


## 1. La Croûte — le fond du lac

- **Jour** : Jour I — vite, pas de campement sûr
- **Ratio de trame** : sol orange quasi plein, ciel charbon — image inversée par rapport au reste du jeu
- **Plan** : très large, aucune ombre
- **Invariants** : fissures convergentes vers le centre · pieux et rails sortant du sel · une chose lointaine qui n'est pas toi
- **Clause de ratio (prompt)** : _the VALUES ARE INVERTED compared to every other image: the ground is one huge uniform very bright field filling the lower two thirds of the frame, the sky a flat pure black; very wide shot, harsh white noon, no shadows at all_

### Établissement — `scene_salines_croute_a`

Servie par défaut sur tout lieu de l'environnement sans image dédiée.

```
scene_salines_croute_a=the floor of a vanished salt lake seen at eye level from its old shore: a vast flat white crust to the horizon, deep cracks converging toward a distant black island with a leaning tower on it, weathered wooden mooring posts and a pair of rusted iron rails emerging from the salt and running straight toward the island, and very far off one small dark shape moving across the crust, first-person view from the ground, no protagonist in frame, what is far away is other people, the VALUES ARE INVERTED compared to every other image: the ground is one huge uniform very bright field filling the lower two thirds of the frame, the sky a flat pure black; very wide shot, harsh white noon, no shadows at all, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

### La Rive haute (obligatoire, entree) — `scene_salines_rive_haute_a`

Ce que la bible dit : l'ancien quai : pieux, cloche d'appel sans battant, la phrase gravée sur un pieu (« Bouge, il te mange.

```
scene_salines_rive_haute_a=the old boat quay of a vanished lake: a row of tall weathered mooring posts standing in dry salt, a bronze call-bell hanging from a timber gallows with no clapper, a phrase carved into the nearest post, and two iron rails leaving the quay and running out across the flat white crust toward a distant black island, with these three things always in the picture: fissures convergentes vers le centre · pieux et rails sortant du sel · une chose lointaine qui n'est pas toi, first-person view from the ground, no protagonist in frame, what is far away is other people, the VALUES ARE INVERTED compared to every other image: the ground is one huge uniform very bright field filling the lower two thirds of the frame, the sky a flat pure black; very wide shot, harsh white noon, no shadows at all, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

### Le Percepteur (rencontre) — `monstre_salines_percepteur_a`

Ce que la bible dit : récurrent, toute la zone.

```
monstre_salines_percepteur_a=a tall gaunt man bent under the weight of hundreds of flat lead tokens pressed into his flesh by salt scales from skull to hands so that no skin shows, hooded in coarse wool, treading in place, holding out one flat palm with a single blank lead token on it, salt crust at his feet, pitch-black background, the subject emerging from darkness, one single light source, this is the reference image of this character, first-person view from the ground, no protagonist in frame, what is far away is other people, the VALUES ARE INVERTED compared to every other image: the ground is one huge uniform very bright field filling the lower two thirds of the frame, the sky a flat pure black; very wide shot, harsh white noon, no shadows at all, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

### Le Bœuf de sel (rencontre) — `monstre_salines_boeuf_de_sel_a`

Ce que la bible dit : la bête qui tirait les barges sur rails à sec, encore attelée, à moitié cristallisée, en marche sans fin.

```
monstre_salines_boeuf_de_sel_a=a huge draught ox still in its wooden yoke and iron traces, half turned to white salt crystal, walking without end along a pair of iron rails across a flat salt crust, dragging a small wooden wagon with a single shuttered window, seen from the side and slightly behind, pitch-black background, the subject emerging from darkness, one single light source, this is the reference image of this character, first-person view from the ground, no protagonist in frame, what is far away is other people, the VALUES ARE INVERTED compared to every other image: the ground is one huge uniform very bright field filling the lower two thirds of the frame, the sky a flat pure black; very wide shot, harsh white noon, no shadows at all, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```


## 2. Les Bassins — la sécheresse crue

- **Jour** : Jour II — premier campement, coûteux
- **Ratio de trame** : ~50/50
- **Plan** : moyen, lumière rasante, premières ombres
- **Invariants** : murets en gradins · passerelles de bois · rangées de Cristallins couchés
- **Clause de ratio (prompt)** : _roughly half bright and half black, medium shot, low raking light near the horizon, the first long shadows_

### Établissement — `scene_salines_bassins_a`

Servie par défaut sur tout lieu de l'environnement sans image dédiée.

```
scene_salines_bassins_a=terraced salt evaporation basins descending in steps toward the horizon, low dry-stone walls in tiers, narrow wooden footbridges spanning the empty basins, rows of lying human figures crusted in salt on the basin floors like fallen statues, and far off one immense wading bird standing on one leg in an empty basin, first-person view from the ground, no protagonist in frame, what is far away is other people, roughly half bright and half black, medium shot, low raking light near the horizon, the first long shadows, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

### Les Terrasses (obligatoire, entree) — `scene_salines_terrasses_a`

Ce que la bible dit : trois niveaux à sec ; descendre d'un niveau est un choix ; Cristallins couchés et Grumeaux à chaque niveau.

```
scene_salines_terrasses_a=three dry salt terraces descending in steps seen from the top one, low walls between the levels, lying salt-crusted human figures and loose white clods on each level, a standing hooded figure half crusted in salt at the top edge pointing down, and at the bottom, in the last basin, an immense wading bird on one leg about to take flight, with these three things always in the picture: murets en gradins · passerelles de bois · rangées de Cristallins couchés, first-person view from the ground, no protagonist in frame, what is far away is other people, roughly half bright and half black, medium shot, low raking light near the horizon, the first long shadows, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

### Le Héron de sel (rencontre) — `monstre_salines_heron_a`

Ce que la bible dit : échassier immense, immobile sur une patte aux Bassins, pêche ce que le Ver laisse.

```
monstre_salines_heron_a=an immense salt-white heron standing motionless on one leg in the middle of an empty stone basin, neck folded, twice the height of a man, the low walls of the terraces behind it, pitch-black background, the subject emerging from darkness, one single light source, this is the reference image of this character, first-person view from the ground, no protagonist in frame, what is far away is other people, roughly half bright and half black, medium shot, low raking light near the horizon, the first long shadows, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

### Les Encroûtés (rencontre) — `monstre_salines_encroute_a`

Ce que la bible dit : héros vivants au palier II, restés trop longtemps.

```
monstre_salines_encroute_a=a standing hooded figure in coarse wool, the lower half of the body and one arm sealed in a thick white crust of salt as if grown into the ground, the mouth and one hand still free, speaking, leaning slightly toward the viewer, pitch-black background, the subject emerging from darkness, one single light source, this is the reference image of this character, first-person view from the ground, no protagonist in frame, what is far away is other people, roughly half bright and half black, medium shot, low raking light near the horizon, the first long shadows, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```


## 3. Les Salines — le chantier

- **Jour** : Jour II–III — le creux, mini-boss
- **Ratio de trame** : ~25 % orange
- **Plan** : serré, plus d'horizon
- **Invariants** : sacs empilés · la balance · rails qui s'arrêtent net
- **Clause de ratio (prompt)** : _only about a quarter of the frame is bright, the rest deep black, tight cramped framing, no horizon, one hard light_

### Établissement — `scene_salines_salines_a`

Servie par défaut sur tout lieu de l'environnement sans image dédiée.

```
scene_salines_salines_a=the yard of an abandoned salt works: sacks of salt stacked into walls higher than a man, a great iron beam balance hanging from a timber gantry, a pair of iron rails that stop dead in the middle of the yard, salt dust on everything, cramped alleys between the stacks, first-person view from the ground, no protagonist in frame, what is far away is other people, only about a quarter of the frame is bright, the rest deep black, tight cramped framing, no horizon, one hard light, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

### L'Entrepôt (obligatoire, fin) — `scene_salines_entrepot_a`

Ce que la bible dit : obligatoire — mini-boss.

```
scene_salines_entrepot_a=inside a vast salt warehouse: long alleys between walls of stacked sacks receding into darkness, salt-crusted human statues stood in rows along the alleys sorted by size, and at the far end a huge low blind shape the size of a barn with a ridged carapace, raking the floor with a flat snout, with these three things always in the picture: sacs empilés · la balance · rails qui s'arrêtent net, first-person view from the ground, no protagonist in frame, what is far away is other people, only about a quarter of the frame is bright, the rest deep black, tight cramped framing, no horizon, one hard light, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

### Le Grand Saunier (rencontre) — `monstre_salines_grand_saunier_a`

Ce que la bible dit : mini-boss de milieu de zone (Entrepôt).

```
monstre_salines_grand_saunier_a=an enormous blind beast the size of a barn, low and wide on many short legs, a ridged salt-white carapace, a flat broad snout raking the floor, surrounded by rows of small salt-crusted human statues it has sorted by size, inside a dark warehouse of stacked sacks, pitch-black background, the subject emerging from darkness, one single light source, this is the reference image of this character, first-person view from the ground, no protagonist in frame, what is far away is other people, only about a quarter of the frame is bright, the rest deep black, tight cramped framing, no horizon, one hard light, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```


## 4. Saulnes — le relais

- **Jour** : Jour III–IV — abri réel, la tour
- **Ratio de trame** : charbon dominant, lueur orange qui monte de l'intérieur de la tour — la seule lumière inversée du jeu
- **Plan** : vue de loin comme une masse noire sur l'orange, la tour au sommet ; la ville penche vers sa tour
- **Invariants** : le Fossé en gradins · la ville qui marche · la tour et sa lueur
- **Clause de ratio (prompt)** : _black dominant, the only light in the frame rises from INSIDE the tower and catches the edges of the leaning town, an orange glow low against a black sky_

### Établissement — `scene_salines_saulnes_a`

Servie par défaut sur tout lieu de l'environnement sans image dédiée.

```
scene_salines_saulnes_a=seen from far out on the salt crust: a black island massed against the sky with a leaning stone tower at its summit, a glow rising from inside the tower, the huddled town leaning toward its tower, and around the island a ring of collapsed crust in broken tiers like a dry moat, first-person view from the ground, no protagonist in frame, what is far away is other people, black dominant, the only light in the frame rises from INSIDE the tower and catches the edges of the leaning town, an orange glow low against a black sky, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

### Les Rues qui marchent (obligatoire, fin) — `scene_salines_rues_qui_marchent_a`

Ce que la bible dit : obligatoire.

```
scene_salines_rues_qui_marchent_a=a narrow leaning street of a stone town on a hill, every house tilted the same way toward an unseen tower, a slow procession of hooded salt-crusted figures walking in a ring around the block never stopping, and in a side alley one figure standing perfectly still while the others pass, with these three things always in the picture: le Fossé en gradins · la ville qui marche · la tour et sa lueur, first-person view from the ground, no protagonist in frame, what is far away is other people, black dominant, the only light in the frame rises from INSIDE the tower and catches the edges of the leaning town, an orange glow low against a black sky, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

### Le Quai de l'île (obligatoire, fin) — `scene_salines_quai_de_l_ile_a`

Ce que la bible dit : la scène où le twist se paye.

```
scene_salines_quai_de_l_ile_a=a stone quay at the edge of the island town: an intact flat-bottomed barge sitting on iron rails, its bow turned OUT toward the empty salt crust and away from the town, a cluster of hooded salt-crusted figures on the quay beckoning toward the barge with open hands, the leaning tower behind them, with these three things always in the picture: le Fossé en gradins · la ville qui marche · la tour et sa lueur, first-person view from the ground, no protagonist in frame, what is far away is other people, black dominant, the only light in the frame rises from INSIDE the tower and catches the edges of the leaning town, an orange glow low against a black sky, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

### La Tour de l'écluse (obligatoire, fin) — `scene_salines_tour_de_l_ecluse_a`

Ce que la bible dit : obligatoire — sortie.

```
scene_salines_tour_de_l_ecluse_a=inside a stone tower descending in a spiral below the level of the old lake, seen from the stair looking down: thousands of small marks scored into the wall one above the other, growing denser toward the bottom, and at the bottom of the shaft an enormous stone wheel ringed with iron set in a rock gorge, a last shallow black water at its foot, with these three things always in the picture: le Fossé en gradins · la ville qui marche · la tour et sa lueur, first-person view from the ground, no protagonist in frame, what is far away is other people, black dominant, the only light in the frame rises from INSIDE the tower and catches the edges of the leaning town, an orange glow low against a black sky, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```


## Ce qui n'a PAS d'image, et pourquoi

- **Le Ver de croûte** : jamais. Il est « la chose lointaine qui n'est pas toi » de l'établissement de la Croûte, et sous les pieds au Souffle.
- **Les 23 lieux du pool** : l'établissement de leur environnement, jusqu'à ce que l'écriture en désigne un qui mérite la sienne (un lieu = une image, jamais une image = une interaction).
- **Le Fossé** (beat d'arrivée de Saulnes) : l'établissement de Saulnes est déjà la vue de loin qu'il décrit.
