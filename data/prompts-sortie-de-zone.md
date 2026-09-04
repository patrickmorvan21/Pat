# Prompts — la sortie de zone (la Falaise aux Cordes)

⚠️ **L'escalier de la Descente est supprimé** (31/08). On ne quitte les Landes que par
les cordes, et l'entrée est THÉÂTRALE : de loin, elles tombent du ciel dans le trou ;
au bord, on se penche et elles plongent jusque dans les ténèbres.
`scene_la_descente` n'a plus de sujet propre — l'écran de sortie reprendra
`scene_falaise_cordes_a`. En attendant il sert la vue neutre du sud.

Les noms portent la variante suivante ; le pipeline double le suffixe (`_a` → `_a_x`).

### `scene_falaise_cordes_a.png`

```
scene_falaise_cordes_a=wide establishing shot seen from a low rise of heather, a vast round pit opening in an empty moor, wide as a village, its inside pure black with no visible bottom, and hundreds of long hemp ropes coming down out of the bright empty sky into the mouth of the pit, no anchor and no structure visible above them, the ropes reading as thin black lines against the bright sky and all leaning the same way in the wind, tiny scale, no figure, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

### `scene_falaise_bord_a.png`

```
scene_falaise_bord_a=looking straight DOWN over the rim of a huge pit from standing height at its very lip, a row of short wooden stakes driven along the edge in the foreground with hemp ropes knotted to them, the ropes running away downward and swallowed by absolute blackness a short way down, no bottom visible, the lower two thirds of the frame solid pure black with no detail, a few ropes ending in mid-air in a clean flat cut with frayed ends hanging over nothing, steep vertical composition, no figure, medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

### `scene_falaise_appele_b.png`

⚠️ Retour Patrick (01/09) : « l'image est belle mais il faudrait qu'il ne soit pas sur le
bord d'une falaise, mais plus sur du plat, et mettre d'autres cordes en arrière plan. »
Le sujet est donc à PLAT — horizon de niveau, aucune falaise dans le cadre, et la gueule du
trou n'est plus qu'une bande noire basse. Les autres cordes descendent tout autour de lui :
elles disent qu'il n'est ni le premier ni le dernier, ce que le vide seul ne disait pas.

```
scene_falaise_appele_b=a lone cloaked figure standing on FLAT open heather ground, seen small and from behind against a bright empty sky, level horizon, no cliff and no overhang in the frame, one hand closed on a hanging hemp rope without looking at it, many other ropes hanging straight down all around and behind him, receding into the distance, the mouth of the pit reading only as a low flat band of solid black across the bottom of the frame, the cloak lifted sideways by the wind, no face, no eye contact; medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

## Les deux vues LOINTAINES de la Descente (04/09)

Quand la traversée ne passe pas par la Palissade Sud (c'est le cas de la première run,
où la Falaise est un déroutage direct après la Meute), on tombait sur le gouffre à
quelques mètres, en un seul tap. Deux beats préparent maintenant le regard — la ligne à
l'horizon, puis l'entaille qui s'ouvre — et chacun attend SON image.

⚠️ Ces deux-là ne doivent JAMAIS montrer la bouche du trou ni les cordes lisibles : elles
vendraient l'écran suivant. C'est la distance qui est le sujet.

En attendant, chaque beat retombe sur une vue de lande neutre (le plateau, puis le chemin
de pierres vers le sud). Déposer les fichiers sous ces noms exacts suffit : aucun code à
changer, le repli est gardé par `assetExiste`.

### `scene_descente_au_loin_a.png`

```
scene_descente_au_loin_a=an extremely wide establishing view of an empty rolling moor seen from a low rise, the land stretching away flat and featureless under a huge bright empty sky, and far away on the horizon a single thin dark horizontal line cutting the whole country in two from edge to edge, barely thicker than a thread, no detail in it at all, no pit mouth visible and no ropes visible at this distance, the scale enormous and the line tiny, no figure, no building, no path; medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```

### `scene_descente_approche_a.png`

```
scene_descente_approche_a=the same empty moor seen much closer to the end of a long walk, low evening light raking across the heather, and the dark line on the horizon now opened into a long black gash across the middle distance, still far away, with a faint comb of thin vertical threads hanging in the air above it, too far to read as ropes, the sky bright and completely empty of birds, no figure, no building; medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, no sash windows, no lamp posts, no industrial chimneys; extreme two-value contrast, large uniform very bright fields such as open sky or pools of light, read against deep pure black silhouettes, almost no mid-greys, the subject reading as a flat black shape on a flat bright ground; vintage engraving feel, grainy etching texture, single low dramatic light source, dark vignette at the edges, monochrome, mystical and eerie atmosphere, no text, no lettering, no watermark
```
