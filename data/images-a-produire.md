# ⚠️ La règle des variantes (28/07) — à lire avant de générer quoi que ce soit

Constat de Patrick, vérifié : les prompts de variante **re-décrivaient leur
sujet en entier**. « elderly couple digging side by side between orchard rows,
black twisted branches above them… » — un modèle de diffusion à qui on
redécrit un couple fabrique un AUTRE couple, dans un AUTRE verger. Deux écrans
du même lieu ne raccordaient jamais.

**Une variante ne rejoue pas la scène : elle SERRE sur un élément.**

| cadrage | quand | ce que ça garantit |
|---|---|---|
| `pres` | par défaut, pour tout élément observé | gros plan, l'objet remplit le cadre, ni horizon ni ciel ni figure — rien qui puisse jurer avec le plan large |
| `large` | le rare cas où le texte demande de RECULER (la croix d'ombres, l'entrée dans le cercle) | contre-jour, silhouettes sur ciel orange, comme les plans de lieu |
| `portrait` | **la première** image d'un personnage | elle établit, donc elle décrit. Il n'y en a qu'UNE par personnage |
| `geste` | **toute image suivante** du même personnage | mains, dos, objet tendu — le visage n'est jamais revu, donc il ne peut jamais diverger |

**La lumière compte autant que le cadrage.** Les gros plans héritaient du
« contre-jour extrême, silhouette noire sur ciel orange » des plans larges. Sur
un détail il n'y a pas de ciel : tout virait au noir plein et la matière
disparaissait au dithering — c'est exactement ce qui a mangé les entailles des
potences. Un gros plan s'éclaire donc en **lumière rasante**, qui fait lire le
relief.

Les prompts de la zone sont générés depuis `tools/prompts_variantes.py`, qui
tient cette grammaire. Pour en corriger un, modifier le sujet dans ce fichier
et relancer `python3 tools/prompts_variantes.py` — ne pas éditer le JSON à la
main, il serait réécrit.

---

# Images à produire — LES LANDES (Acte I)

Prompts prêts à coller dans Leonardo, **un par plan rapproché**. Chaque prompt est
autonome : le bloc de style est déjà dedans, rien à assembler.

Chaque entrée donne aussi le **raccord** : ce que le plan rapproché doit partager
avec l'image large du lieu (matière, source de lumière, cadrage). C'est la
contrainte que tu as posée — un plan rapproché qui ne raccorde pas casse
l'illusion qu'on s'est déplacé dans le même endroit. Les raccords ci-dessous sont
écrits **après avoir regardé les 12 images de lieu existantes**, pas devinés.

## Ce que la lecture des images a révélé (à trancher avant de produire)

1. ~~`scene_moulin_sans_ailes_c.png` montre un moulin AVEC ses ailes~~ —
   **CLOS le 18/08, dans l'autre sens : c'est le TEXTE qui a cédé.** Décision
   Patrick : trois générations n'ont jamais réussi le « sans ailes » et le
   visuel ailé (`scene_moulin_campement_a.png`) est superbe. Le lieu devient
   **le Moulin Arrêté** — les ailes sont là, elles ne tournent JAMAIS, leur
   ombre non plus. Aucune image de moulin à produire.
2. **`palissade-sud` n'a aucune image de lieu** : elle tourne sur une vue
   générique des Landes. C'est le dernier lieu de la zone, le seuil de l'Acte II.
   Prompt fourni.
3. **`borne-frontiere` utilise une image de transition** (`scene_transition_borne_sud_a.png`).
   Elle est belle et juste — un menhir en contre-jour devant un soleil bas — mais
   elle est aussi dans le pool des vues de marche, donc on la revoit ailleurs.
   Une version dédiée éviterait la répétition sur le tout premier écran du jeu.
4. Petite tension à savoir : l'image de la Colline montre une **ligne** de
   potences le long d'une crête, alors que le texte parle du « cercle ». Les
   prompts ci-dessous montrent une courbe de poteaux — compatible avec les deux.

## Comment ça se branche

Champ déjà en place : `PointInteret.illustration`. Tu déposes le PNG dithéré dans
`aldenhar/public/assets/`, on remplit le champ dans `lib/scene-data.ts`, et c'est
tout. Tant que le champ est vide, le crop de l'image du lieu tient la place :
rien ne casse si la liste n'est produite qu'en partie.

## Rappels de pipeline

Passage par `/leo-import` (Floyd-Steinberg, seuil 182, contraste 151 %, pixel
size 3, Charbon `#1c1a16` / Orange `#e0632a`). Donc à la génération : **des masses,
pas du détail fin**. Le tramage mange les textures délicates et adore le
contre-jour franc. À éviter : brume uniforme (devient un aplat), foules, et tout
texte gravé lisible — suggérer les marques, ne jamais les écrire.

---

# PRIORITÉ 0 — les 3 vues de lieu manquantes ou fausses

### ~~`scene_moulin_sans_ailes_d.png`~~ — ✅ CLOS le 18/08 : chantier ABANDONNÉ, le texte a cédé
**Décision Patrick : le moulin garde ses ailes.** Le lieu est renommé « le
Moulin Arrêté » (les ailes ne tournent jamais, l'ombre en croix non plus —
l'inquiétant a changé de place, pas de force), `campement` est câblé sur
`scene_moulin_campement_a.png` (le visuel qu'il aime), et l'intérieur au vase
de fleurs sèches (`scene_moulin_interieur_a_d.png`) illustre « Entrer ». Le
prompt-silo ci-dessous est conservé pour mémoire du piège de diffusion (un
mot interdit est un mot évoqué), plus comme travail à faire.

### archive — l'ancien chantier « sans ailes » (3 tentatives, jamais réussi)
La génération du 25/07 (`_d_d`) a **gardé les quatre ailes** malgré « sail
assembly completely gone ». Celle du 28/07 (`scene_moulin_campement_a.png`,
aujourd'hui câblée sur `campement`) les garde **aussi** — quatre ailes complètes
en croix devant le soleil. L'image est belle et bien tramée, mais elle contredit
frontalement le nom du lieu et son point d'intérêt.

C'est un piège classique : le mot *windmill* appelle les ailes, et un modèle de
diffusion ne sait pas retirer un élément sur commande — une consigne négative
(« no blades ») renforce même souvent ce qu'elle interdit. Il faut décrire
**ce qui est là**, sans jamais nommer un moulin :
⚠️ **4e signalement le 10/08** (panel de 10 IA). Le prompt ci-dessous a été
RÉÉCRIT ce jour-là : la version précédente contenait encore « no blades, no
vanes, no timber structure » — c'est-à-dire trois fois le mot que le modèle ne
doit surtout pas lire. Un prompt de diffusion n'a pas de négation : chaque
terme interdit est un terme évoqué. La règle est donc appliquée jusqu'au bout —
**aucune clause négative, et le sujet n'est plus une tour de moulin mais un
silo** (un mot qui n'appelle aucune aile) :
```
Squat round stone granary silo standing alone on a low mound on open moorland,
smooth cylindrical masonry, flat truncated stone cap, a short rusted iron stub
at the centre of the cap, four pale unweathered vertical bands on the stonework
below the cap, small dark doorway at its base, huge low orange sun disc directly
behind it, dark moor in the foreground. Dark fantasy illustration, extreme
backlight, one single light source, near-black silhouette against a glowing
orange sky, deep crushed blacks, high contrast, two-tone monochrome-friendly,
matte painting, grim medieval rural, square composition
```
Deux images sont concernées et doivent être refaites ENSEMBLE, sinon la moitié
du lieu se contredira toujours : la vue d'ensemble (`campement`) et le plan
rapproché de la croix d'ombres (`croix-ombres`), dont l'examen explique
précisément que les bandes pâles sont ce que les ailes protégeaient **avant de
disparaître**. Les deux sont marquées « à remplacer » dans la page de
couverture.

**Pourquoi le texte ne peut pas céder ici** (alors qu'il a cédé pour la Colline
et le Champ des Fixés le 10/08) : le lieu s'appelle *le Moulin sans Ailes*, la
carte Figma le nomme ainsi, et son point d'intérêt entier repose sur leur
absence. Il n'y a rien à réécrire — il faut l'image.

### `scene_palissade_sud_a.png` — ✅ FAIT (`scene_palissade_sud_a_a.png`, câblé)
Réserve : tout le contenu est dans le tiers HAUT de l'image, la moitié basse est
noire. Ça passe en jeu, mais une version avec le mur plus centré serait mieux.
Prompt d'origine :
**Raccord** : même langage que les autres extérieurs (contre-jour, soleil bas,
premier plan noir). Le mur doit barrer tout l'horizon.
```
Long palisade of blackened sharpened logs cutting across the entire horizon of an
open moor, seen from the moor side, a narrow gate set in it, a tiny plank sentry
box against the logs, low orange sun sinking behind the wall, cold air rising from
beyond it, dark heather in the foreground. Dark fantasy illustration, extreme
backlight, one single light source, near-black silhouettes against a glowing
orange sky, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, strong readable shapes, matte painting, grim medieval rural,
square composition, no text, no lettering, no watermark
```

### `scene_borne_frontiere_a.png` — ✅ FAIT (`scene_borne_frontiere_a_c.png`, câblé)
Prompt d'origine :
**Raccord** : reprendre exactement l'esprit de l'actuelle (menhir anguleux à
gauche, disque de soleil bas à droite, lande plate), mais en plan plus serré sur
la pierre pour qu'elle domine.
```
Tall angular granite boundary stone standing alone on a flat open moor, close
enough to fill the left half of the frame, its faces densely covered in shallow
overlapping carved marks, small offerings piled at its base, low orange sun disc
on the horizon to the right, hazy stippled sky. Dark fantasy illustration, extreme
backlight, one single light source, near-black silhouette with a thin orange rim
of light, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, matte painting, grim medieval rural, square composition, no
text, no lettering, no watermark
```

---

# PRIORITÉ 1 — les 4 lieux garantis (12 plans)

## La Colline aux Gibets — base `scene_colline_aux_gibets_c.png`
*Raccord commun : contre-jour total, ciel orange lumineux, potences en silhouette
noire, sol de bruyère sombre et piqueté. Tout se lit en découpe, aucun détail
éclairé de face.*

### `scene_colline_potences_cercle_a.png` — « Les potences du cercle »
```
Three or four weathered wooden gallows posts curving away along a bare hill crest,
seen close from below, shallow carved notches and a date cut at the foot of each
post, all struck by the same careful hand, glowing orange sky filling the gaps
between them, dark heather at their base. Dark fantasy illustration, extreme
backlight, one single light source, near-black silhouettes against a glowing
orange sky, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, strong readable shapes, matte painting, grim medieval rural,
square composition, no text, no lettering, no watermark
```

### `scene_colline_gibet_vide_a.png` — « Le Gibet Vide, au centre »
```
Single tall well-built gallows alone on a hill crest, massive squared beams
jointed to last for centuries, a brand new pale rope hanging empty and barely
swaying, its long cast shadow stretching toward the viewer across the heather and
subtly the wrong shape for the structure, low orange sun behind it. Dark fantasy
illustration, extreme backlight, one single light source, near-black silhouette
against a glowing orange sky, deep crushed blacks, no fill light, high contrast,
two-tone monochrome-friendly, matte painting, grim medieval rural, square
composition, no text, no lettering, no watermark
```

### `scene_colline_poteau_pendu_a.png` — « Le poteau isolé, à gauche »
```
Hanged old man on an isolated low gibbet at the edge of a hill crest, wearing a
heavy magistrate chain of office at his neck and a seal ring on his fist, head
lifted and eyes open, unmistakably alive and watching the viewer, rope taut above
him, glowing orange sky behind. Dark fantasy illustration, extreme backlight, one
single light source, near-black silhouette with a thin orange rim of light, deep
crushed blacks, no fill light, high contrast, two-tone monochrome-friendly, matte
painting, grim medieval rural, square composition, no text, no lettering, no
watermark
```

## Le Petit Tribunal — base `scene_petit_tribunal_a.png`
*Raccord commun : intérieur de PIERRE (pas de bois clair), composition
symétrique, une arche rétroéclairée orange au fond, mobilier de pierre massif en
silhouette noire, dallage chaud au sol, murs noyés dans le noir piqueté.*

### `scene_tribunal_ordonnance_a.png` — « La feuille clouée au mur »
```
Single sheet of parchment nailed by four nails to a bare stone wall inside a dim
low chamber, edges curling, dense handwriting suggested as texture and completely
unreadable, raking light from a bright arched opening out of frame grazing the
stonework. Dark fantasy illustration, one single light source, deep crushed
blacks, no fill light, high contrast, two-tone monochrome-friendly, strong
readable shapes, matte painting, grim medieval interior, cold damp stone, square
composition, no text, no lettering, no watermark
```

### `scene_tribunal_chaire_a.png` — « La chaire et son livre »
```
Heavy stone lectern in a village court chamber with a large ledger lying open on
it, ruled columns of entries suggested as texture, many lines struck through, the
bright arched opening of the room glowing directly behind the lectern so the book
is lit from behind, stone floor. Dark fantasy illustration, extreme backlight, one
single light source, near-black silhouette against a glowing orange arch, deep
crushed blacks, no fill light, high contrast, two-tone monochrome-friendly, matte
painting, grim medieval interior, square composition, no text, no lettering, no
watermark
```

### `scene_tribunal_bancs_a.png` — « Les bancs et leurs traces »
```
Two low stone and timber benches facing each other in an empty court chamber, the
nearer one worn smooth and pale in the middle by generations of gripping hands and
gnawed at its edges, rows of tally notches cut into the side of the other, dust in
the air, light grazing across from a bright opening out of frame. Dark fantasy
illustration, one single light source, deep crushed blacks, no fill light, high
contrast, two-tone monochrome-friendly, strong readable shapes, matte painting,
grim medieval interior, square composition, no text, no lettering, no watermark
```

## La Chapelle des Cordes — base `scene_chapelle_des_cordes_d.png`
*Raccord commun : nef étroite en tunnel, des dizaines de cordes qui pendent
verticalement du plafond au sol le long des murs, fenêtre en arc orange vif au
fond, autel sombre en découpe devant, dallage chaud au premier plan.*

### `scene_chapelle_mur_cordes_a.png` — « Le mur des cordes, au fond »
```
Chapel wall hung with dozens of short cut ropes fixed in neat vertical rows, each
carrying a small pale paper tag, arranged like relics rather than trophies, one
rope hanging noticeably askew as though just disturbed, lit from behind by a bright
arched window so the ropes read as dark verticals with orange rims. Dark fantasy
illustration, extreme backlight, one single light source, deep crushed blacks, no
fill light, high contrast, two-tone monochrome-friendly, strong readable shapes,
matte painting, grim medieval interior, square composition, no text, no lettering,
no watermark
```

### `scene_chapelle_autel_a.png` — « L'autel couché, sur le côté »
```
Toppled stone altar lying on its side on a chapel floor, the hollow space beneath
it now empty, a long coiled shape clearly missing from the grey dust and its clean
outline still fresh, hanging ropes framing the shot on both sides, warm light
across the flagstones from a bright arch behind. Dark fantasy illustration, one
single light source, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, strong readable shapes, matte painting, grim medieval
interior, square composition, no text, no lettering, no watermark
```

### `scene_chapelle_ouvrage_a.png` — « La chaise et l'ouvrage »
```
Plain wooden chair standing in a chapel among hanging ropes, an unfinished
braiding work resting on its seat, three strands of new pale hemp half-plaited and
clamped at mid-length, a coil of raw hemp on the flagstones beside it, patient
regular craftsmanship, warm light from a bright arch behind. Dark fantasy
illustration, one single light source, deep crushed blacks, no fill light, high
contrast, two-tone monochrome-friendly, strong readable shapes, matte painting,
grim medieval interior, square composition, no text, no lettering, no watermark
```

## Le Champ des Fixés — base `scene_champ_des_fixes_b.png`
*Raccord commun : soleil bas derrière une crête, poteaux noirs de hauteurs
irrégulières en découpe, sol sombre et piqueté, horizon plat.*

### `scene_champ_rangees_a.png` — « Les rangées et leurs noms »
```
Long regular rows of low wooden grave posts receding across a bleak field, the
nearest posts freshly cut and pale with crisp shallow carvings, the distant ones
grey and eroded almost smooth, one whole row bearing the same repeated date, low
orange sun behind the ridge. Dark fantasy illustration, extreme backlight, one
single light source, near-black silhouettes against a glowing orange sky, deep
crushed blacks, no fill light, high contrast, two-tone monochrome-friendly, matte
painting, grim medieval rural, square composition, no text, no lettering, no
watermark
```

### `scene_champ_poteaux_vierges_a.png` — « Les poteaux vierges, au fond »
```
Three blank new grave posts standing apart at the far end of a burial field,
already carved with names but no dates, the third carving noticeably fresher and
paler than the other two, turned earth at their feet, low orange sun behind them.
Dark fantasy illustration, extreme backlight, one single light source, near-black
silhouettes against a glowing orange sky, deep crushed blacks, no fill light, high
contrast, two-tone monochrome-friendly, strong readable shapes, matte painting,
grim medieval rural, square composition, no text, no lettering, no watermark
```

### `scene_champ_tombe_manquante_a.png` — « Un vide dans une rangée pleine »
```
One conspicuous gap in an otherwise unbroken row of grave posts, the earth in the
gap old and packed and the socket carefully filled in rather than torn out, the
neighbouring posts leaning slightly inward toward the empty space, low orange sun
raking along the row. Dark fantasy illustration, extreme backlight, one single
light source, near-black silhouettes against a glowing orange sky, deep crushed
blacks, no fill light, high contrast, two-tone monochrome-friendly, strong
readable shapes, matte painting, grim medieval rural, square composition, no text,
no lettering, no watermark
```

---


---

# PRIORITÉ 1 bis — LES ACCUEILS DU HAMEAU (6 vues, 6/08)

Le 3e beat de l'entrée au village est devenu un **slot** : la façon dont le
hameau te reçoit est tirée à chaque vie parmi sept (le barrage des trois hommes
+ ces six). En attendant ces images, les six accueils héritent de la vue de la
ruelle (`scene_landes_hameau_ruelle_b.png`) — c'est cohérent, mais on voit six
fois le même décor pour six scènes très différentes.

*Raccord commun aux six : la RUELLE de `scene_landes_hameau_ruelle_b.png` —
pavés mouillés qui accrochent la lumière, maisons de pierre serrées des deux
côtés, fente de ciel orange au-dessus, coins assombris. Ce sont des plans de
LIEU (pas des gros plans) : contre-jour, silhouettes quasi noires, la même
grammaire que les autres vues de village.*

### `scene_hameau_accueil_volet_a.png` — « La voix au volet »
La rue est vide, un seul volet entrouvert de deux doigts. Aucun visage : c'est
tout le sujet.
```
Empty narrow village lane at dusk, not a single figure anywhere, one wooden
shutter cracked open by two fingers on the left wall with a sliver of warm light
inside, a tipped bucket and a spilled puddle on the wet cobbles, all other
shutters closed, low orange sun at the far end of the lane, strong backlight,
near-black silhouettes. Dark fantasy illustration, one single light source, deep
crushed blacks, no fill light, high contrast, two-tone monochrome-friendly,
strong readable shapes, matte painting, grim medieval village, square
composition, no text, no lettering, no watermark
```

### `scene_hameau_accueil_mur_a.png` — « Le mur écrit » ⚠️ v2, la v1 est à remplacer
**Ce qui a raté (6/08)** : le fichier livré (`_mur_c`) montre un beau pignon de grange
en contre-jour, mais **aucune craie**. Deux causes, toutes deux dans mon prompt :
le contre-jour extrême met la façade en silhouette (donc rien ne peut s'y lire),
et `illegible marks only` a été compris comme « pas de marques » au lieu de
« des marques illisibles ». Le v2 décrit donc la craie comme une **matière qui
accroche une lumière rasante**, et abandonne le contre-jour pour cette image.
```
Close view of a tall stone wall filling almost the entire frame, its dark
surface covered from the ground to head height in dense pale chalk marks:
hundreds of short vertical strokes and scratched tally lines in two tight
crooked columns, some smudged, some half rubbed out, a row of crude chalk
crosses along the bottom of the list. Hard raking light from the left grazes
the wall so every chalk stroke catches the light and stands out bright against
the dark stone. The sky is a narrow strip of dim orange at the very top of the
frame. A small child-sized silhouette walks away at the far right edge. Dark
fantasy illustration, one single light source, deep crushed blacks, no fill
light, high contrast, two-tone monochrome-friendly, strong readable shapes,
matte painting, grim medieval village, square composition, marks only, no
readable words, no letters, no numbers, no text, no lettering, no watermark
```

### `scene_hameau_accueil_enfant_a.png` — « L'enfant qu'on envoie »
Un enfant seul au milieu de la rue, minuscule dans le cadre, les mains dans le
dos. Les volets entrouverts derrière lui sont le vrai sujet.
```
A single small child standing alone in the middle of an empty village lane,
seen from a distance so the figure is small in the frame, hands held behind the
back, facing the viewer as a near-black silhouette against the low orange sun at
the end of the lane, every shutter along both walls cracked open by a hand's
width, no adult visible anywhere. Dark fantasy illustration, one single light
source, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, strong readable shapes, matte painting, grim medieval
village, square composition, no text, no lettering, no watermark
```

### `scene_hameau_accueil_table_a.png` — « La table dressée »
Une table seule au milieu des pavés, un seul couvert, tourné vers le
spectateur. Personne. La vapeur du bol est le seul mouvement de l'image.
```
A single small wooden table standing alone in the middle of an empty village
lane, one stool, one earthenware bowl with visible steam rising, a spoon set
perfectly straight beside it, the whole setting turned to face the viewer, wet
cobbles, closed shutters on both sides, low orange sun behind the table, no
figure anywhere. Dark fantasy illustration, one single light source, deep
crushed blacks, no fill light, high contrast, two-tone monochrome-friendly,
strong readable shapes, matte painting, grim medieval village, square
composition, no text, no lettering, no watermark
```

### `scene_hameau_accueil_cloche_a.png` — « La cloche qu'on retient » ⚠️ v2, la v1 est à remplacer
**Ce qui a raté (6/08)** : le fichier livré (`_cloche_c`) est une rue de village
avec une silhouette au centre — ni chapelle, ni corde, ni villageois sur les
seuils —, et sa composition double presque celle de l'accueil « l'enfant ». Mon
prompt décrivait une SCÈNE large ; le modèle a gardé le décor et lâché le sujet.
Le v2 s'ancre sur l'OBJET et le GESTE, en plan rapproché, sans plan de rue.
```
Close view of a thick frayed bell rope hanging straight down the rough stone
wall of a small chapel, filling the left of the frame. An old woman's hand and
forearm are closed tight around the rope, holding it completely still — the
gesture is the subject. Just behind her, a man is frozen mid-stride, one arm
still reaching for the rope he will not touch. Further back and much smaller,
a row of motionless figures stands in lit doorways along a wall, watching. Low
orange sun behind them, the foreground hand and rope caught by hard side light.
Dark fantasy illustration, one single light source, deep crushed blacks, no
fill light, high contrast, two-tone monochrome-friendly, strong readable
shapes, matte painting, grim medieval village, square composition, no bell
visible, no text, no lettering, no watermark
```

### `scene_hameau_accueil_depart_a.png` — « Le hameau qui s'en va »
Une charrette à moitié chargée — avec une PORTE dessus, détail qui porte toute
la scène. Les voisins regardent sans aider.
```
A handcart half loaded in the middle of a village lane, a chest, two rolled
straw mattresses and a whole wooden house door strapped on top of the pile, one
man tightening a strap, several neighbours standing motionless with folded arms
in their own doorways watching without helping, low orange sun at the end of the
lane, near-black silhouettes, wet cobbles. Dark fantasy illustration, one single
light source, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, strong readable shapes, matte painting, grim medieval
village, square composition, no text, no lettering, no watermark
```

**Câblage** : dès que les six fichiers sont dans `public/assets/`, il n'y a
qu'un champ `illustration` à poser sur chaque scène `hameau-accueil-*` de
`lib/scene-data.ts` — aucun autre code à toucher.

# PRIORITÉ 2 — le Hameau, le Moulin, la Borne (9 plans)

## Le Hameau, entrée — base `scene_landes_hameau_ruelle_b.png`
*Raccord commun : ruelle pavée étroite, maisons de pierre serrées des deux côtés,
fente de ciel orange au-dessus, pavés mouillés qui accrochent la lumière, coins
de l'image assombris. La croix à la craie est déjà visible sur le mur de gauche
de l'image large — le plan rapproché doit être CETTE croix.*

### `scene_hameau_croix_craie_a.png` — « S'approcher de la croix »
```
Rough chalk cross drawn on the weathered plank door of a village house, the wood
worn noticeably pale at that exact spot from crosses drawn and rubbed out many
times before, close framing on the door, damp stone wall around it, warm light
from the lit lane behind the viewer. Dark fantasy illustration, one single light
source, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, strong readable shapes, matte painting, grim medieval
village, square composition, no text, no lettering, no watermark
```

### ~~`monstre_femme_au_seuil_a.png`~~ — RIEN À FAIRE, déjà disponible
« La femme sur le pas de porte » (hameau-entree-2) utilise désormais **`monstre_femme_au_seuil_b.png`**, ton portrait déjà
validé — c'est aussi l'image de la rencontre qui suit, donc le plan rapproché
et la rencontre raccordent d'eux-mêmes. Câblé, rien à produire.

## Le Hameau, la grange — base `scene_landes_hameau_grange_a.png`
*Raccord : intérieur presque entièrement noir, éclairé par une SEULE lanterne
posée au sol, poutres et cloison de planches à peine suggérées, paille autour de
la flaque de lumière.*

### `scene_hameau_grange_poutres_a.png` — « Examiner la grange »
```
Tally marks cut into a heavy roof beam at head height inside a barn, several
separate series of scratched strokes, the last series stopping at only two marks,
lit from below by a single lantern standing on the floor out of frame, straw dust
drifting in the light, everything beyond the small pool of light crushed to black.
Dark fantasy illustration, one single warm light source from below, deep crushed
blacks, no fill light, high contrast, two-tone monochrome-friendly, strong
readable shapes, matte painting, grim medieval interior, square composition, no
text, no lettering, no watermark
```

## Le Moulin sans Ailes — base : la nouvelle vue de PRIORITÉ 0
*Raccord commun : tour de pierre trapue, disque de soleil énorme derrière, lande
sombre. ⚠️ Aucune aile.*

### `scene_moulin_croix_ombres_a.png` — « La croix d'ombres, en haut »
**Le seul point où l'on RECULE** (zoom 0.9 en jeu) : cadrer plus LARGE que la vue
du lieu, pas plus serré.
```
Stone windmill tower with no sails seen from a distance and from below, four pale
unweathered bands radiating from the cap across the stonework in the shape of a
cross where the vanes once shielded the stone, the rest of the wall darkened by
years of wind, bleak stippled sky, wide framing with the tower small in the frame.
Dark fantasy illustration, extreme backlight, one single light source, near-black
silhouette against a glowing orange sky, deep crushed blacks, no fill light, high
contrast, two-tone monochrome-friendly, matte painting, grim medieval rural,
square composition, no text, no lettering, no watermark
```

### `scene_moulin_lucarne_a.png` — « La lucarne, au-dessus de la porte »
```
Small empty dormer opening above the door of a stone mill, its inner sill
conspicuously clean and free of dust unlike every surface around it, the opening
itself pitch black, worn stonework, low orange light raking across the wall from
the side. Dark fantasy illustration, one single light source, deep crushed blacks,
no fill light, high contrast, two-tone monochrome-friendly, strong readable
shapes, matte painting, grim medieval rural, square composition, no text, no
lettering, no watermark
```

### `scene_moulin_interieur_a.png` — « Pousser la porte entrouverte »
```
Inside a derelict windmill, a straw pallet made up with squared-off care, a
chipped clay pot holding fresh sprigs of heather beside it, everything else rotting
and abandoned, nobody present, a single shaft of orange light falling from an
opening above onto the pallet. Dark fantasy illustration, one single light source,
deep crushed blacks, no fill light, high contrast, two-tone monochrome-friendly,
strong readable shapes, matte painting, grim medieval interior, square composition,
no text, no lettering, no watermark
```

## La Borne Frontière — base `scene_transition_borne_sud_a.png` (ou la nouvelle)
*Raccord commun : granit anguleux sombre, liseré de lumière orange sur une seule
arête, soleil bas, bruyère rase.*

### `scene_borne_gravures_a.png` — « Les gravures de la pierre »
```
Close view of the face of a granite boundary stone densely covered in carved marks
layered over centuries, names and dates and tally strokes overlapping, the surface
saturated on this side while the adjacent face stays almost bare with only three
marks on it, low orange sun grazing the stone from the side. Dark fantasy
illustration, one single raking light source, deep crushed blacks, no fill light,
high contrast, two-tone monochrome-friendly, strong readable shapes, matte
painting, grim medieval rural, square composition, no text, no lettering, no
watermark
```

### `scene_borne_eclat_a.png` — « Un angle cassé, au ras du sol »
```
Broken-off corner of a granite boundary marker lying half buried in heather at
ground level, its fresh fracture pale against the weathered outer surface, palm
sized, damp dark earth around it, low orange light grazing the ground. Dark
fantasy illustration, one single raking light source, deep crushed blacks, no fill
light, high contrast, two-tone monochrome-friendly, strong readable shapes, matte
painting, grim medieval rural, square composition, no text, no lettering, no
watermark
```

### ~~`monstre_hesitant_a.png`~~ — RIEN À FAIRE, déjà disponible
« L'homme qui regarde le sud » (borne-frontiere) utilise désormais **`monstre_hesitant_b.png`**, ton portrait déjà
validé — c'est aussi l'image de la rencontre qui suit, donc le plan rapproché
et la rencontre raccordent d'eux-mêmes. Câblé, rien à produire.

---

# PRIORITÉ 3 — les lieux secondaires (12 plans)

## Le Chemin Creux — base `scene_chemin_creux_c.png`
*Raccord commun : on est DANS le creux — cadre noir très dense de racines et de
branches en surplomb, seule lumière au bout du couloir, sol du chemin éclairé qui
fuit vers l'ouverture.*

### `scene_chemin_charrette_a.png` — « La charrette embourbée »
```
Abandoned cart sunk to its axles in mud at the bottom of a sunken lane, bed empty,
harness hanging cleanly cut through rather than unbuckled, a small verdigrised
bronze bell hanging from a nail beneath the seat, high earth banks and overhanging
roots crowding both sides, the only light coming from the far end of the lane. Dark
fantasy illustration, one single distant light source, deep crushed blacks, no fill
light, high contrast, two-tone monochrome-friendly, strong readable shapes, matte
painting, grim medieval rural, square composition, no text, no lettering, no
watermark
```

### `scene_chemin_talus_a.png` — « Le haut des talus »
```
Top edge of a sunken lane's earth bank seen looking up from inside the lane, a
line of paired footprints running along the crest parallel to the road for its
whole length, tall grass and exposed roots against a thin strip of glowing orange
sky, nothing visible that could have made the prints. Dark fantasy illustration,
extreme backlight, one single light source, near-black silhouettes against a
glowing orange sky, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, matte painting, grim medieval rural, square composition, no
text, no lettering, no watermark
```

### ~~`monstre_marcheur_rebours_b.png`~~ — RIEN À FAIRE, déjà disponible
« L'homme qui marche à reculons » (chemin-creux) utilise désormais **`monstre_marcheur_a_rebours_d.png`**, ton portrait déjà
validé — c'est aussi l'image de la rencontre qui suit, donc le plan rapproché
et la rencontre raccordent d'eux-mêmes. Câblé, rien à produire.

## La Mare aux Regards — base `scene_mare_aux_regards_a.png`
*Raccord commun : bandes horizontales — ciel orange, disque de soleil, son reflet
dans une eau parfaitement immobile, roseaux en découpe, tout le reste noir.*

### `scene_mare_berge_a.png` — « Le point de berge usé »
```
Two knee shaped hollows worn deep into the mud at the very edge of a still black
pool, remade by hundreds of people in the same exact spot, clawed finger marks
pressed into the dried mud beside them, reeds silhouetted at the side, low orange
sun reflected on the flat water behind. Dark fantasy illustration, extreme
backlight, one single light source, deep crushed blacks, no fill light, high
contrast, two-tone monochrome-friendly, strong readable shapes, matte painting,
grim medieval rural, square composition, no text, no lettering, no watermark
```

### `scene_mare_eau_a.png` — « L'eau »
```
Perfectly still black water seen from directly above at close range, no ripples at
all, a human reflection looking back up out of it with the reflected gaze lifted a
fraction later than it should be, the orange disc of the low sun also reflected at
the edge of the frame. Dark fantasy illustration, one single reflected light
source, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, strong readable shapes, matte painting, eerie, square
composition, no text, no lettering, no watermark
```

### `scene_mare_miroir_a.png` — « Le reflet de métal, dans les roseaux »
```
Small tarnished pocket mirror lying among reeds at the edge of a pond, cracked
straight across the middle exactly where a face would be, dull metal catching the
only light in the frame from the low orange sun, dark mud and reed stems around
it. Dark fantasy illustration, one single light source, deep crushed blacks, no
fill light, high contrast, two-tone monochrome-friendly, strong readable shapes,
matte painting, grim medieval rural, square composition, no text, no lettering, no
watermark
```

## Le Verger Noir — base `scene_verger_noir_d.png`
*Raccord commun : arbres noirs noueux et nus, fruits lourds qui pendent en
découpe, disque de soleil derrière les branches, sol sombre.*

### `scene_verger_fruits_a.png` — « Les fruits, dans les rangs »
```
Close view of round heavy ash grey fruit hanging from the bare black branches of a
gnarled orchard tree, skin flawless and matte, unnaturally dense looking, planted
orchard rows receding behind them, low orange sun burning through the branches.
Dark fantasy illustration, extreme backlight, one single light source, near-black
silhouettes against a glowing orange sky, deep crushed blacks, no fill light, high
contrast, two-tone monochrome-friendly, strong readable shapes, matte painting,
grim medieval rural, square composition, no text, no lettering, no watermark
```

### `scene_verger_souche_a.png` — « La souche, au bout du rang »
```
Cleanly felled tree stump at the end of an orchard row, its growth rings regular
for decades then abruptly tight and black and illegible at the outer edge, the axe
cut smooth and deliberate, dead grey leaves scattered around it, low orange light
raking across the cut face. Dark fantasy illustration, one single raking light
source, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, strong readable shapes, matte painting, grim medieval rural,
square composition, no text, no lettering, no watermark
```

### ~~`monstre_epoux_verger_b.png`~~ — RIEN À FAIRE, déjà disponible
« Les deux qui bêchent, au fond » (verger-noir) utilise désormais **`monstre_epoux_verger_a.png`**, ton portrait déjà
validé — c'est aussi l'image de la rencontre qui suit, donc le plan rapproché
et la rencontre raccordent d'eux-mêmes. Câblé, rien à produire.

## La Palissade Sud — base : la nouvelle vue de PRIORITÉ 0
*Raccord commun : troncs noircis appointés, soleil bas derrière le mur, air froid
qui monte de l'autre côté.*

### `scene_palissade_rondins_a.png` — « Les rondins et leurs pointes »
```
Close view of a palisade of blackened sharpened logs, the points unmistakably
angled inward toward the viewer's side of the wall rather than outward, rope
lashings binding them, damp scarred wood, low orange sky burning in the narrow
gaps between the logs. Dark fantasy illustration, extreme backlight, one single
light source, near-black silhouettes against a glowing orange sky, deep crushed
blacks, no fill light, high contrast, two-tone monochrome-friendly, strong
readable shapes, matte painting, grim medieval rural, square composition, no text,
no lettering, no watermark
```

### `scene_palissade_portillon_a.png` — « Le portillon et son verrou »
```
Small wooden gate set into a palisade of blackened logs, one single heavy iron
bolt fitted on the north side, the planks around the bolt deeply scratched at hand
height by human fingers that wanted through, worn threshold, low orange light
leaking through the seams of the gate. Dark fantasy illustration, one single light
source, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, strong readable shapes, matte painting, grim medieval rural,
square composition, no text, no lettering, no watermark
```

### `monstre_veilleur_palissade_a.png` — « L'homme de la guérite »
```
Night watchman sitting in a narrow plank sentry box built against a log palisade,
barely wide enough for him and his lantern, the lantern on the ground at his feet
as the only light source, watching the viewer approach with the patience of a man
who saw them coming long ago. Dark fantasy illustration, one single warm light
source from below, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, strong readable shapes, matte painting, grim medieval rural,
square composition, no text, no lettering, no watermark
```

---

## Tour de Guet effondrée (ajout du 27/07)

Le sixième lieu du Hameau vient d'être écrit. Il a sa vue d'ensemble
(`scene_tour_de_guet_a.png`), mais **aucun de ses trois points d'intérêt ni son
personnage** n'ont d'image : les quatre écrans se rabattent sur la vue de la
tour. Raccord commun : contre-jour, la tour tronquée toujours reconnaissable à
sa bouche de pierres arrachées, et le tas de pierres EMPILÉ (jamais éboulé) à
son pied.

### `scene_tour_pierres_rangees.png` — « Les pierres, empilées au pied »
```
Close view of a long neat man-high stack of dressed stones at the foot of a
ruined tower, laid course by course by careful hands, every carved face turned
down against the earth, one stone tipped over to reveal a fragment of an
engraved name. Dark fantasy illustration, low raking light, deep crushed blacks,
no fill light, high contrast, two-tone monochrome-friendly, strong readable
shapes, matte painting, grim medieval rural, square composition, no text, no
lettering, no watermark
```

### `scene_tour_escalier_rupture.png` — « L'escalier qui monte au vide »
```
Interior stone stair inside a broken tower seen from the last surviving step,
treads hollowed in their middle by decades of daily use, the flight stopping
dead on open sky, the clean unweathered break of the stonework in the
foreground, a distant line of gallows on a ridge visible straight ahead through
the opening. Dark fantasy illustration, hard backlight from the sky, deep
crushed blacks, no fill light, high contrast, two-tone monochrome-friendly,
strong readable shapes, matte painting, grim medieval rural, square composition,
no text, no lettering, no watermark
```

### `scene_tour_meurtriere_sud.png` — « La meurtrière du sud »
```
Narrow arrow slit in a thick stone wall at chest height, its sill worn smooth
like a handrail, hundreds of tally notches cut into the embrasure in groups of
five, a single-lens copper spyglass wedged in a crack of the stonework as if set
down to be picked up tomorrow. Dark fantasy illustration, single shaft of light
entering through the slit, deep crushed blacks, no fill light, high contrast,
two-tone monochrome-friendly, strong readable shapes, matte painting, grim
medieval rural, square composition, no text, no lettering, no watermark
```

### `monstre_guetteur_tour.png` — « Le Guetteur sans tour »
```
Old watchman seen from behind, seated on a pile of stones, heavy worn sentry
cloak, a signal horn hanging at his side, head turned to scan the southern
horizon, never facing the viewer. Pitch-black background, subject emerging from
darkness, dark fantasy illustration, one single light source, deep crushed
blacks, no fill light, high contrast, two-tone monochrome-friendly, strong
readable shapes, matte painting, grim medieval rural, square composition, no
text, no lettering, no watermark
```

### `objet_lunette_guetteur.png` — icône d'objet (Besace)
```
Single-lens copper spyglass, short and stubby, its barrel polished bright by one
hand over twenty years while the rest is tarnished, isolated object study on a
pitch-black background, dark fantasy illustration, one single light source, deep
crushed blacks, high contrast, two-tone monochrome-friendly, strong readable
shapes, square composition, no text, no lettering, no watermark
```

### `monstre_corbeaux_du_compte_b.png` — « Les corbeaux, sur la traverse »
Image DÉJÀ validée et en jeu ; le prompt est noté pour pouvoir la refaire à
l'identique si besoin. Le nombre de corbeaux est dit par le texte, jamais par
l'image — n'essaie pas de le faire coller au compte du joueur.
```
Row of black crows perched shoulder to shoulder along the crossbeam of a gallows on a bare ridge, all facing the same way, one of them turned the wrong way as if keeping a place. Dark fantasy illustration, extreme backlight, one single light source, near-black silhouettes against a glowing orange sky, deep crushed blacks, no fill light, high contrast, two-tone monochrome-friendly, matte painting, grim medieval rural, square composition, no text, no lettering, no watermark
```

---

# Récapitulatif

| Priorité | À produire | Ce que ça débloque |
|---|---|---|
| **P0** | **3** | Corrige le Moulin (ses ailes contredisent son nom et son point d'intérêt), donne enfin une image à la Palissade Sud, et une vue dédiée à la Borne |
| P1 | 12 | Colline, Tribunal, Chapelle, Champ — les lieux vus à presque chaque run |
| P2 | 7 | Hameau, Moulin, Borne — la halte garantie + le tout premier écran |
| P3 | 10 | Chemin Creux, Mare, Verger, Palissade |
| **Total à produire** | **32** | |
| Déjà disponible, câblé | 4 | l'Hésitant, la Femme au Seuil, le Marcheur à rebours et les Époux du Verger avaient déjà leur portrait validé : leurs points d'intérêt l'utilisent maintenant (et c'est la même image que la rencontre qui suit) |
| Sans image, volontairement | 1 | le point de l'écran du Serment est un dialogue : il garde le portrait de la Doyenne |

Si tu ne dois en faire qu'une poignée : **les 3 de P0 d'abord** (elles corrigent
une incohérence et un trou), puis les 3 de la Colline aux Gibets (le lieu-signature
que la traversée pousse à chaque liaison).

---

# Lot 5/08 — LES ÉTATS (spec « États, Besoins & Sceaux »)

Les six états du premier lot s'affichent aujourd'hui **en nom seul** : leur
vignette est optionnelle et n'apparaît que si le fichier existe (le manifeste
d'assets fait autorité, il n'y a plus de liste blanche dans le code). Déposer
un PNG au bon nom suffit donc à l'afficher — **aucun code à changer**.

Format à respecter, calé sur les deux icônes déjà en jeu
(`etat_aguerri.png`, `etat_entaille.png`) : **800×800, palette 2 couleurs
Charbon/Orange**, une seule figure isolée sur fond noir, lisible à 24 px de
haut dans le bandeau et à 66 px dans l'écran Essence.

⚠️ **Le contrat de lisibilité prime sur le détail** : à 24 px, seule la
SILHOUETTE lit. Un état se reconnaît à sa forme générale (une jambe pliée, une
main tendue, une croix), jamais à une texture.

⚠️ Ces icônes ne sont **pas** des illustrations de scène : pas d'horizon, pas
de décor, pas de ciel orange. Fond noir, sujet isolé — même grammaire que les
deux icônes existantes.

| fichier | état | ce qu'il faut montrer |
|---|---|---|
| `etat_fievreux.png` | FIÉVREUX (corps) | un torse voûté, les deux mains serrées l'une sur l'autre au niveau du sternum, épaules rentrées — la posture de quelqu'un qui a froid alors qu'il brûle |
| `etat_boiteux.png` | BOITEUX (corps) | une jambe raide, l'autre pliée, le poids porté sur un bâton ou sur le genou — la silhouette d'un pas qui ne se déroule pas |
| `etat_affame.png` | AFFAMÉ (corps) | une main ouverte, paume vers le haut, doigts creusés, tendue vers le bord du cadre — la faim se montre par le geste, jamais par un ventre |
| `etat_marque.png` | MARQUÉ (social) | une croix tracée à la craie sur du bois, en gros — l'état est ce que les AUTRES ont fait, donc on montre leur trace, pas le héros |
| `etat_hante.png` | HANTÉ (mental) | une tête de profil avec une seconde silhouette, plus pâle, décalée derrière elle — deux formes là où il n'y a qu'une personne |
| `etat_fixe.png` | FIXÉ (social) | un poteau nu planté dans le sol, corde enroulée à son sommet, sans personne dessus — la place réservée |

Prompt commun (coller tel quel, changer la première phrase) :

> `<SUJET>`. Pitch-black background, the subject isolated and filling the
> frame, one single hard light source raking from the side so the silhouette
> reads at a glance, no horizon, no sky, no scenery, dark fantasy illustration,
> deep crushed blacks, no fill light, high contrast, two-tone
> monochrome-friendly, strong readable shapes, matte painting, grim medieval
> rural, square composition, no text, no lettering, no watermark

Sujets, dans l'ordre du tableau :

1. `etat_fievreux` — *a hunched torso, both hands clamped together over the sternum, shoulders drawn in, the posture of someone freezing while burning up*
2. `etat_boiteux` — *one leg locked straight and the other bent, the weight carried on a rough walking staff, the silhouette of a stride that will not unroll*
3. `etat_affame` — *a single open hand, palm up, fingers hollowed, reaching toward the edge of the frame*
4. `etat_marque` — *a fresh chalk cross scrawled across weathered wooden planks, seen close*
5. `etat_hante` — *a head in profile with a second, paler silhouette offset just behind it, two shapes where there is only one person*
6. `etat_fixe` — *a bare wooden post driven into the ground, a coil of rope at its top, nobody hanging from it*

## Aucune image de SCÈNE à produire pour ce lot

Le lot n'ajoute aucun lieu ni aucune rencontre : la confidence des Fixés se
joue au Champ des Fixés (image déjà en place, celle du Fossoyeur), et l'eau de
la Mare comme le seuil forcé du Bailli réutilisent leurs écrans existants.
La couverture reste à **0 image manquante**.

---

## PRIORITÉ 1 ter — LE GRAND TÉMOIN & LA REFONTE DU LORE (6/08)

Lot issu de la page Notion « 👁️ Le Grand Témoin — refonte du lore des Landes ».
**Aucune image n'est BLOQUANTE** : les 18 scènes nouvelles réutilisent des
visuels existants et cohérents (la Fille, la Veuve, le Fossoyeur, la Femme au
Seuil, le Gamin, la grange, la ruelle). Les prompts ci-dessous *enrichissent* —
ils ne réparent pas un manque.

⚠️ **Garde-fou absolu du personnage (§8 de la spec) : ne JAMAIS montrer ce
qu'il y a sous le manteau.** L'ambiguïté corbeaux-serviteurs / corbeaux-
constituants / forme collective doit rester entière. Aucun visage, aucune
anatomie, aucune jambe. S'il devient lisible, il devient un monstre ordinaire.

### `monstre_grand_temoin.png` — la seule image vraiment demandée par la spec

```
Extreme backlit silhouette against a low burning orange sky, dark moorland
horizon. A single towering vertical mass of heavy black cloth, three times the
height of a human, standing motionless. The cloth falls in deep folds and
trails behind it as if still catching up with a movement that has stopped.
NO face, NO head shape, NO limbs, NO hands — the silhouette must remain an
unreadable column of fabric. Crows enter the folds of the cloth: several birds
mid-flight converging into the dark mass, half-absorbed, wings still open.
Below the hem, absolute black — nothing resolves there.
Shot from low and far, as if from the ground at a distance.
Monochrome duotone, deep charcoal and burnt orange only, heavy grain,
high contrast, no midtones, no gradient.
```

### Plans rapprochés des nouveaux points d'intérêt

Ils héritent aujourd'hui de l'image de leur lieu, ce qui est cohérent mais
générique. Par ordre d'utilité :

**`scene_colline_pied_grand_gibet.png`** — le nom gratté
```
Close view at the foot of a massive black gallows post, backlit by a low
orange sky. Deep gouged letters carved into the wood, then destroyed — raked
across by something that bit deeper than any tool, wood fibres torn outward.
Below the ruined name, a date remains fully intact and legible as marks.
Weathered grain, lichen at the base. Extreme contrast, silhouette treatment.
Monochrome duotone charcoal and burnt orange, heavy grain, no gradient.
```

**`scene_hameau_linteaux.png`** — l'entaille au-dessus de chaque porte
```
Low upward view along a row of dark village doorways, backlit orange sky
above the rooflines. Above each lintel, at exactly the same height, a short
deep notch in the timber — the edge crushed rather than cut. The repetition
across three successive doors is the subject. No figures.
Monochrome duotone charcoal and burnt orange, heavy grain, no gradient.
```

**`scene_hameau_combles_cloues.png`** — les fenêtres du haut
```
Full facade of a dark stone village house seen straight on against a burning
orange sky. Upper attic windows boarded shut from inside, planks nailed in
crossed diagonals, visible through the glass. Ground floor windows plainly
shuttered, one hanging open. The contrast between the two floors is the
subject. No figures. Monochrome duotone charcoal and burnt orange, heavy
grain, high contrast, no gradient.
```

**`scene_mare_creux_doubles.png`** — la berge usée
```
Close ground-level view of a trampled mud bank at the edge of black still
water, low orange light raking across. Two pairs of knee impressions pressed
into the earth: one pair at the water's edge, a second larger and deeper pair
directly behind it, facing the same way. Reeds motionless. No figures.
Monochrome duotone charcoal and burnt orange, heavy grain, no gradient.
```

**`scene_moulin_crete_interrompue.png`** — le chemin de faîtage
```
Upward view along the ridge of a squat round stone tower roof against a low
orange sky. A clean bare strip runs the length of the ridge where moss has
been worn away, two hands wide, polished. The strip stops abruptly — not
tapering, cut off — leaving thick untouched moss beyond it. No figures.
Monochrome duotone charcoal and burnt orange, heavy grain, no gradient.
```

**`scene_chapelle_cloche_sans_battant.png`** — on a arrêté d'appeler à l'aide
```
Low upward view of a small stone bell-cote against a burning orange sky. The
bell hangs tilted mid-swing, and its interior is visibly EMPTY — the clapper
is gone, its mounting eye intact and clean, unscrewed rather than broken. A
well-kept rope hangs down within reach. No figures. Monochrome duotone
charcoal and burnt orange, heavy grain, high contrast, no gradient.
```

### `monstre_la_fille_moulin.png` — le plan serré de la conversation (note DA 6/08)

**Pourquoi** : `monstre_la_fille_c.png` (l'entrevue à distance) sert aujourd'hui
aux QUATRE beats de la rencontre au Moulin — or elle convient au degré 2, pas à
une conversation assise. Règle du détail unique.

⚠️ **Rappel de lore : elle avait VINGT ANS quand on l'a pendue, et n'a pas
vieilli depuis trente ans. Ce n'est pas une enfant.**

```
Interior of a dark round stone mill, a single shaft of low orange light from a
small window. A young woman of twenty, seated on a heather pallet, seen in
three-quarter view, calm, hands busy with a small piece of rope work in her
lap. She wears a dark shawl. The single telling detail: a thin pale line
across her throat, old and healed, caught by the light. Nothing else in the
frame explains her. Quiet, domestic, wrong only if you look closely.
Monochrome duotone, deep charcoal and burnt orange, heavy grain, high
contrast, no gradient.
```

---

# Lot 7/08 — LES RENCONTRES EN BEATS DU NOUVEAU LORE

Constat de couverture (7/08) : les quatre témoins et les apparitions du Grand
Témoin ajoutés en v1.40/v1.41 jouent leurs 3-4 beats **sur une seule image**
(le Fossoyeur au trou, le Gamin, la Fille au Moulin, le Troupeau), et trois
scènes fortes empruntent le décor d'une autre (les deux apparitions nocturnes,
le Renoncement, la nuit dehors). Rien n'est cassé — mais la règle du détail
unique (28/07) vaut pour eux comme pour le Marcheur ou les Époux, qui ont
leurs images par beat depuis longtemps.

**Rappel des cadrages (28/07, obligatoire)** : une variante ne re-décrit
JAMAIS le personnage de l'image principale — `geste` (mains/dos, tête hors
champ), `pres` (macro décor, aucune figure), `large` (silhouette lointaine).

## Le Fossoyeur au trou — base `monstre_fossoyeur_poteaux_a.png`
(variante du Champ des Fixés : il taille un écriteau, il a retiré un poteau)

### `monstre_fossoyeur_trou_1.png` — « Je grave à l'avance » (geste)
```
Tight close view of weathered working hands carving letters into a small
rough wooden grave-board resting on the knees of a seated figure, a short
worn knife mid-stroke, curls of pale wood on the dark coat fabric, head and
shoulders OUT of frame, a soft out-of-focus row of grave crosses far behind.
Dark fantasy illustration, low raking backlight, deep crushed blacks, no fill
light, high contrast, two-tone monochrome-friendly, strong readable shapes,
matte painting, grim medieval rural, square composition, no text, no
lettering, no watermark
```

### `scene_champ_poteau_retire.png` — « Y avait un poteau là » (pres)
```
Ground-level close view of a bare rectangular socket hole in dark packed
heathland earth, in the middle of a receding row of tall grave posts — one
post plainly missing from the line, the empty hole clean and old, spade marks
long weathered, a little heather growing at its rim. No figures. Dark fantasy
illustration, low raking light across the soil, deep crushed blacks, no fill
light, high contrast, two-tone monochrome-friendly, strong readable shapes,
matte painting, grim medieval rural, square composition, no text, no
lettering, no watermark
```

### `monstre_fossoyeur_trou_3.png` — l'écriteau retourné (pres)
```
Close view of a finished small wooden grave-board leaning face-down against a
worn leather boot and the hem of a long dark coat, the carved side hidden
against the leg, only the plain back of the board visible, a knife being
wiped on cloth at the edge of frame, head and body out of frame. Dark fantasy
illustration, single low light source, deep crushed blacks, no fill light,
high contrast, two-tone monochrome-friendly, strong readable shapes, matte
painting, grim medieval rural, square composition, no text, no lettering, no
watermark
```

## Le Gamin des Murets — base `monstre_gamin_murets_a.png`
(la porte d'entrée de l'arc de la Fille — 4 beats sur une image)

### `scene_murets_vers_sud.png` — « Le chemin fait le tour. Les murets, non. »
```
A hip-high dry-stone wall running straight away toward the southern horizon
across dark open moorland, built without mortar, its top course polished
smooth and pale by small feet walking it daily, low burning orange sky, the
wall dividing the frame like a road. No figures. Dark fantasy illustration,
hard backlight, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, strong readable shapes, matte painting, grim medieval
rural, square composition, no text, no lettering, no watermark
```

### `monstre_gamin_caillou.png` — « C'est la dame de l'ouest » (geste)
```
Extreme close view of a child's small open hand holding out a flat grey
pebble polished round like a river stone, offered toward the viewer, the
stone catching a low warm light, ragged sleeve, dark moor out of focus
behind, face and body out of frame. The stone is the subject. Dark fantasy
illustration, one single light source, deep crushed blacks, no fill light,
high contrast, two-tone monochrome-friendly, strong readable shapes, matte
painting, grim medieval rural, square composition, no text, no lettering, no
watermark
```

### `monstre_gamin_depart.png` — il ramasse ses cailloux, dans l'ordre
```
A small child figure seen from behind and at a distance, climbed down off a
low dry-stone wall, bent over gathering a line of small stones off the top of
the wall one by one, low burning orange sky, long shadow. Face never visible.
Dark fantasy illustration, hard backlight, deep crushed blacks, no fill
light, high contrast, two-tone monochrome-friendly, strong readable shapes,
matte painting, grim medieval rural, square composition, no text, no
lettering, no watermark
```

## La Fille au Moulin — base `monstre_la_fille_c.png` + `monstre_la_fille_moulin.png` (P1 ter)
(4 beats sur l'image du degré 2 — le plan serré assis est déjà écrit en P1 ter)

### `monstre_fille_moulin_dos.png` — beat 1, elle ne se retourne pas
```
Interior of a dark round stone mill, a single shaft of low orange light from
a small window. A slender woman seated on a heather pallet seen fully from
BEHIND, dark shawl over her shoulders, head bowed toward something her hands
are doing in front of her, hands not visible. Near the door, a small clay pot
holding a sprig of fresh heather still WET, droplets catching the light — the
only fresh thing in the room. Her face is never visible. Dark fantasy
illustration, one single light source, deep crushed blacks, no fill light,
high contrast, two-tone monochrome-friendly, strong readable shapes, matte
painting, grim medieval rural, square composition, no text, no lettering, no
watermark
```

### `monstre_fille_moulin_ouvrage.png` — beats 3-4, l'ouvrage repris (geste)
```
Tight close view of a young woman's pale calm hands working a small piece of
rope in her lap, tying and untying the same short knot, dark shawl fabric
around, a heather pallet beneath, warm low sidelight from a small window.
Head and face out of frame. The half-made knot is the subject. Dark fantasy
illustration, one single light source, deep crushed blacks, no fill light,
high contrast, two-tone monochrome-friendly, strong readable shapes, matte
painting, grim medieval rural, square composition, no text, no lettering, no
watermark
```

## Les apparitions nocturnes du Grand Témoin
(⚠️ garde-fou §8 : jamais de visage, jamais de membres, jamais ce qu'il y a
sous le tissu — s'il devient lisible, il devient un monstre ordinaire)

### `scene_temoin_grange_toit.png` — le poids sur le toit (aucune figure)
```
Interior of a dark barn at night lit only by a small lantern on the floor,
warm glow on rough roof beams and rafters overhead. ONE tie-beam visibly
BOWED under a weight from outside, and a single thin thread of dust falling
in a straight continuous line between two roof boards, caught in the lantern
light. Nothing else moves. No figures, nothing visible through the boards.
Dark fantasy illustration, one single warm light source from below, deep
crushed blacks, no fill light, high contrast, two-tone monochrome-friendly,
strong readable shapes, matte painting, grim medieval rural, square
composition, no text, no lettering, no watermark
```

### `monstre_temoin_ruelle.png` — la traversée de la ruelle
```
A narrow cobbled village alley at night seen from ground level, houses black
on both sides. At the FAR END of the alley, crossing left to right: a
towering vertical mass of heavy black cloth, three times the height of a
door, the fabric trailing behind it as if catching up with its movement.
NO face, NO head shape, NO limbs, NO legs — below the hem, absolute black.
On the rooflines of both sides, crows perched in a neat row, all facing DOWN
toward the viewer, none facing the shape. Dark fantasy illustration, faint
cold sky glow at the alley mouth, deep crushed blacks, no fill light, high
contrast, two-tone monochrome-friendly, strong readable shapes, matte
painting, grim medieval rural, square composition, no text, no lettering, no
watermark
```

## La nuit refusée & le Renoncement — base `scene_hameau_dense_c.png`

### `scene_hameau_nuit_dehors.png` — dormir contre le muret, côté nord
```
Night on the edge of a dark village: a lone figure wrapped in a travel cloak
sitting asleep against the base of a low dry-stone wall, knees drawn up, face
hidden in the hood, seen from a few steps away. Behind the wall, black
village rooflines with not one lit window. Cold open moor on the near side.
Dark fantasy illustration, faint moonless sky glow, deep crushed blacks, no
fill light, high contrast, two-tone monochrome-friendly, strong readable
shapes, matte painting, grim medieval rural, square composition, no text, no
lettering, no watermark
```

### `scene_renoncer.png` — s'asseoir du côté du hameau
```
Dusk, seen from INSIDE a village fence: a figure seated calmly on a flat
threshold stone beside a closed wooden wicket gate, back to the viewer,
shoulders at rest, facing the open dark moor beyond the fence. The gate
latch is closed. The moor outside is vast and empty; the near side is close
and ordered. Quiet, not menacing — the picture of a decision. Face never
visible. Dark fantasy illustration, low burning orange sky fading, deep
crushed blacks, no fill light, high contrast, two-tone monochrome-friendly,
strong readable shapes, matte painting, grim medieval rural, square
composition, no text, no lettering, no watermark
```

## Le Troupeau sans Berger — base `monstre_troupeau_sans_berger_a.png`

### `monstre_troupeau_brebis.png` — beat 2, la brebis qui refait un trajet
```
Dark moorland at dusk: ONE ewe walking away from the grazing flock with a
level, purposeful stride toward the horizon, mid-step, head forward — not
grazing, not fleeing, going somewhere. The flock stays behind as dim woolly
backs in the hollow. Her separation from the group is the subject. Dark
fantasy illustration, low raking light on the wool, deep crushed blacks, no
fill light, high contrast, two-tone monochrome-friendly, strong readable
shapes, matte painting, grim medieval rural, square composition, no text, no
lettering, no watermark
```

### `monstre_troupeau_compte.png` — le comptage (point d'intérêt)
```
Close view over a tight flock of sheep filling the frame edge to edge, a
mass of woolly backs in dark heathland, several heads lifted and turned
straight toward the viewer with calm unlearned fearlessness, the rest
grazing. No shepherd, no dog, no fence anywhere. Dark fantasy illustration,
low raking light across the wool, deep crushed blacks, no fill light, high
contrast, two-tone monochrome-friendly, strong readable shapes, matte
painting, grim medieval rural, square composition, no text, no lettering, no
watermark
```

## La Meute Grise, beat 2 — base `monstre_meute_grise_c.png`

### `monstre_meute_grise_2.png` — le croissant, la meneuse qui questionne
```
Five lean feral dogs re-formed in a wide crescent at close range in dark
heathland, holding their distance, and the LEAD FEMALE one full pace ahead of
the line, head carried LOW below her shoulders, eyes fixed on the viewer —
a question, not yet a charge. The others wait behind her, weight shifted
back. Same lean silhouettes as the pack at dusk, sun down, sky a dim ember
glow. Dark fantasy illustration, hard backlight, deep crushed blacks, no fill
light, high contrast, two-tone monochrome-friendly, strong readable shapes,
matte painting, grim medieval rural, square composition, no text, no
lettering, no watermark
```

## Icône d'objet

### `objet_clochette_meneuse.png` — la Clochette de meneuse (Besace)
```
A small tarnished sheep bell on a short worn leather collar strap, the strap
cracked and darkened by years of wool grease, the bell dented and dull with
one bright worn spot where it strikes, isolated object study on a pitch-black
background. Dark fantasy illustration, one single light source, deep crushed
blacks, high contrast, two-tone monochrome-friendly, strong readable shapes,
square composition, no text, no lettering, no watermark
```

## Optionnel (P3)

### `monstre_hesitant_2.png` — beat 2 de l'Hésitant (geste)
```
Tight close view of a man's weathered hands wringing a shapeless felt hat
against his chest, knuckles pale from the grip, worn travel coat fabric,
head and face out of frame, dark moor out of focus behind. Dark fantasy
illustration, one single light source, deep crushed blacks, no fill light,
high contrast, two-tone monochrome-friendly, strong readable shapes, matte
painting, grim medieval rural, square composition, no text, no lettering, no
watermark
```

## PRIORITÉ 0 bis — L'ÉCRAN DE LA DESCENTE (playtest 7/08)

Le SEUL écran du jeu encore sur le placeholder portail (`dithering-portal.jpg`),
et c'est l'écran le plus rare : « Tu as traversé les Landes vivant. »

### `scene_la_descente.png` — l'escalier qui plonge (établissement)
```
Vast dark stone stairway descending into absolute blackness, seen from the
top step, cold air rising as faint pale mist between ancient walls, a broken
wooden palisade gate frames the view at the top, no human figure, dark
fantasy illustration, one single light source from behind the viewer, deep
crushed blacks, no fill light, high contrast, two-tone monochrome-friendly,
strong readable shapes, matte painting, grim medieval, square composition,
no text, no lettering, no watermark
```
Raccord : la palissade de rondins noircis (mêmes pointes que
`scene_palissade_sud_a_a`) doit se deviner en haut du cadre — on est passé
de l'autre côté du portillon.

## PRIORITÉ 0 ter — LA SORTIE DU HAMEAU, DEUX CHEMINS (retour Patrick 25/08)

« Penser à faire image de transition de deux chemins entre le hameau des
Renonçants et un autre chemin. » C'est le SEUL écran du jeu où l'on voit à la
fois le village dans le dos et les deux routes qui s'ouvrent — aujourd'hui il
sert une marche de lande tirée au sort, qui ne dit ni d'où l'on vient ni ce
qui s'offre.

Le câblage est DÉJÀ EN PLACE et gardé (`SORTIE_DEUX_CHEMINS` dans
`components/Scene.tsx`, replié sur la vue de marche tant que le fichier est
absent) : déposer le PNG sous ce nom exact suffit, aucun code à changer.

### `scene_transition_sortie_hameau_deux_chemins_a.png` — le muret franchi
```
Low dry-stone boundary wall in the near foreground, just crossed, behind it a
huddle of low village rooftops in silhouette; ahead the open moor splits into
two bare footpaths that diverge around a dead thorn bush and vanish over the
horizon, one climbing slightly, one dropping into a hollow; no human figure,
dark fantasy illustration, extreme backlight, low sun on the horizon, figures
and structures as near-black silhouettes, deep crushed blacks, no fill light,
high contrast, two-tone monochrome-friendly, strong readable shapes, matte
painting, grim medieval, square composition, no text, no lettering, no
watermark
```
Raccord : les toits du fond partagent la ligne de faîtage et la matière de
`scene_hameau_dense2_b` ; le muret au premier plan est celui des vues de
ruelle (`scene_landes_hameau_ruelle_b`). Les DEUX chemins doivent se lire du
premier coup d'œil — c'est tout le sujet de l'image.

### En réserve, si Patrick veut aller plus loin
Même principe pour l'ENTRÉE (`scene_transition_entree_hameau_a`) : la lande
dans le dos, les premiers toits devant, un seul chemin qui se resserre. Le
champ à poser serait le pendant de `SORTIE_DEUX_CHEMINS` côté `FRANCHIT_ENTREE`.

### Manque signalé, pas deviné
`meute-grise-1` arrive DIRECTEMENT sur la meute (comme le Pendu Mal Fixé et la
Bête avant ce lot) — mais la Meute est une ERRANTE : elle n'a aucun lieu, donc
aucune image de lieu à poser en arrivée (`Scene.illustrationArrivee`). Soit on
lui écrit une vue d'approche dédiée (un chemin vide, des formes au bout), soit
on assume qu'une meute n'a pas de décor : à trancher.

## PRIORITÉ 0 quinquies — LES VISUELS DU CROCHETAGE (29/08, RÉÉCRIT le soir)

⚠️ **Cette section a été refaite : le geste a changé.** La première version
décrivait un crochet qui PIVOTE en éventail dans un trou de serrure (pivot en
(180,360), arc 200°→340°, planche de 15 frames). Patrick a arbitré en faveur de
l'ancienne animation — **une PISTE HORIZONTALE**, un curseur qui fait
l'aller-retour, on tape quand il passe dans la gorge orange. Toute la géométrie
en éventail de la v1 est donc caduque : ne pas la produire.

**Conséquence, et c'est une simplification franche** : un curseur qui TRANSLATE
n'a besoin d'AUCUNE planche de frames. Faire tourner une image tramée à
l'exécution détruit la trame (c'est pour ça que la porte de l'intro est une
bande de 16 frames) — une simple translation, elle, la préserve intacte. Il
reste donc **une seule image indispensable**, et zéro sprite-sheet.

Le geste tel qu'il est joué aujourd'hui : `TimingTap` mode `track`, **trois
goupilles** à faire tomber (chacune déplace la gorge et accélère le curseur
d'un cran), **trois ratés** comptés sur l'ensemble. La Ruse élargit la gorge.
Scène : `demo-nuit`, choix « Crocheter une maison fermée », la nuit, dans une
ruelle du hameau.

**Ce que le canvas dessine aujourd'hui et qui doit DISPARAÎTRE sous ton image**
— rien qu'un trait rongé pour la piste et un fond charbon plat. Il n'y a pas de
décor : c'est ça qu'on remplace.

**Ce qui reste procédural quoi qu'il arrive** (et ne doit donc PAS être dans
l'image) : la GORGE orange (sa position est retirée au sort à chaque goupille),
le CURSEUR blanc, les trois ENCOCHES de goupilles et l'éclat quand l'une cède.
Doctrine du script du 24/08 : le fond est une vraie illustration, le procédural
est réservé au FEEDBACK.

---

### 1. `minijeu_serrure_fond.png` — LA PLATINE, DE NUIT ⭐ le seul indispensable

**Format** : **360×499** (la zone de jeu, exactement le même cadre Figma que la
mousse de la Borne — Frame 36753). Si tu préfères générer en CARRÉ dans
Leonardo, fais-le : je recadre et je place la fente au bon endroit.

**Le sujet** : la platine de serrure d'une porte du hameau, vue de TRÈS PRÈS,
accroupi, la nuit. Du fer forgé posé sur des planches, et **une longue fente de
serrure HORIZONTALE** au milieu — c'est elle que le curseur parcourt. Rien
d'autre : pas de rue, pas d'horizon.

**Pourquoi une fente horizontale et pas un trou de serrure rond** : c'est le
raccord du geste. Le doigt et le curseur vont de gauche à droite ; une serrure
à fente (mécanisme à garde, un pêne qui court dans une rainure) rend le
mouvement évident sans qu'aucun texte ait à l'expliquer. Un trou rond ferait
attendre une rotation — celle qu'on vient justement de retirer.

**Géométrie si tu composes toi-même dans Figma** :

| Élément | Position dans le cadre 360×499 |
|---|---|
| La fente horizontale (l'axe du curseur) | **y = 300**, de x = 36 à x = 324 |
| Rangée des trois goupilles (procédurale) | **y ≈ 246**, centrée en x = 180 |
| Bande à garder SOBRE | **y = 235 → 325**, toute la largeur |
| Libre pour le décor | au-dessus de 235 (haut de platine, planches, clous) et sous 325 (bas de porte, seuil de pierre) |

⚠️ **La bande du milieu doit rester calme** : du fer, du grain, des ombres —
jamais un élément clair ou contrasté. C'est là que passent le curseur (blanc)
et la gorge (trame orange). Une ferrure brillante à cet endroit les avalerait.

**Polarité** : charbon + orange comme toutes les illustrations (la lumière
rasante accroche l'orange, les creux restent charbon plein). Le curseur sera
BLANC par-dessus — c'est ce qui le rend lisible sur ton image.

```
Extreme close-up of a hand-forged iron lock plate on a heavy plank door at
night, filling the entire frame, seen from crouching height; a long horizontal
keyway slot cut across the middle of the plate, its interior deep black,
square-headed nails around the plate edges, coarse vertical wood grain and dark
gaps between the boards above and below, worn stone threshold at the very
bottom edge; single low raking light from the left grazing the iron and the
grain so the edges catch it, everything else falling to black; dark fantasy
illustration, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, strong readable shapes, matte painting, grim medieval,
no text, no lettering, no watermark
```

**Raccord** : c'est une porte du hameau des Renonçants — même bois, même
lumière basse que `scene_landes_hameau_ruelle_b.png` (l'image de la scène juste
avant). Les volets clos de cette ruelle sont faits du même bois.

---

### 2. `minijeu_serrure_crochet.png` — LE CROCHET, UNE SEULE IMAGE ◇ confort

**Plus de planche de frames.** Le curseur ne fait que translater : une image
suffit, elle garde sa trame intacte à toutes les positions.

**Format** : **~28×70**, fond transparent — une tige de fer fine, un peu
irrégulière, terminée par un crochet, pointe vers le BAS (elle plonge dans la
fente). En **blanc** : c'est l'élément vivant, comme le curseur du frottage.

Si tu ne la fais pas, je garde le curseur dessiné au canvas — un pavé tramé
blanc, déjà lisible. L'écran sera de toute façon transformé par l'image 1 :
c'est du confort, pas un blocage.

---

### 3. `scene_hameau_maison_muree_combles.png` — L'INTÉRIEUR (trou réel actuel)

Rien à voir avec le geste, mais c'est le trou le plus visible de la séquence :
la scène qui SUIT le crochetage réussi (`demo-nuit-maison`) montre encore **la
rue**, alors qu'on est à l'intérieur, dans les combles, devant la trappe clouée
DE L'INTÉRIEUR. C'est la touche 3 du Grand Témoin, découverte seul — le plus
gros moment de lore de la nuit, sur une image qui le contredit.

**Format** : 1000×1000, pipeline normal (`/leo-import`).

```
Interior of an abandoned house at night, low under a bare roof frame; a square
ceiling hatch closed above, its planks crossed by long iron nails driven from
this side and bent over, hammered in haste; bare rafters, thick dust, a single
weak lantern light from below and to the left throwing the nail heads into
relief, the corners of the roof space swallowed by black; dark fantasy
illustration, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, strong readable shapes, matte painting, grim medieval,
square composition, no text, no lettering, no watermark
```

⚠️ Les clous se voient **de ce côté-ci** — c'est tout le sens de la scène : la
maison ne se protégeait pas de ce qui entre par les portes.

---

### 4. (optionnel) `scene_hameau_volet_entrouvert.png` — L'ÉCHEC

Sur un crochetage raté, le texte dit : *« Le crochet ripe et le pêne claque,
fort. En face, un volet s'entrouvre — le temps de te fondre dans l'ombre. »*
Aujourd'hui l'écran retombe sur la ruelle générique. Une vue du volet qui
s'entrebâille en face, une bande de noir dedans, personne de visible — ça
vaudrait le coup un jour, ce n'est pas prioritaire. (Vérifié :
`scene_hameau_accueil_volet_c.png` ne convient pas — c'est une rue au couchant,
aucun volet en train de s'ouvrir.)

---

**Câblage à réception** : dépose les fichiers sous ces noms exacts dans
`aldenhar/public/assets/`, et je branche la peau image de `TimingTap` (même
mécanisme que `RubReveal` : deux champs de config, aucun changement de moteur).

## ~~PRIORITÉ 0 quater — LE FOND DU FROTTAGE DE LA BORNE~~ — RÉSOLU AUTREMENT (25/08 soir)

**✅ CADUC — Patrick a construit le mini-jeu lui-même dans Figma** (nodes
2544-10906 « Borne : avant » / 2558-23211 « Borne : après ») : la mousse ET la
pierre révélée sont SES visuels, intégrés en jeu sous
`assets/minijeu_borne_mousse.png` + `assets/minijeu_borne_pierre.png`
(RubReveal à deux peaux, v1.101.0). Le prompt ci-dessous n'est PLUS à générer.
La « décision (a) vs (b) » en bas de section est tranchée par la maquette
elle-même : voie (a) — l'image porte les marques, le mot dessiné au canvas ne
sert plus à ce geste. La section est conservée pour ses leçons de raccord
(polarité, piège « pas de texte lisible »).

Premier asset du **re-skin réaliste des mini-jeux** (doctrine du script de
démo : « le fond d'un mini-jeu est une VRAIE illustration tramée, le dessin
procédural est réservé au FEEDBACK »). Aujourd'hui `RubReveal` dessine sa
tablette au canvas — cadre gravé, fissures, grain — et c'est exactement le
« trop pixel, trop jeu bêta » que ce lot corrige.

**Le sujet, dicté par la scène** : c'est le **CÔTÉ SUD** de la Borne, celui
que le texte décrit comme *presque vierge — trois marques*, sous la mousse
qu'on efface. Ce n'est pas la face nord saturée de noms (`scene_borne_gravures_a_d`,
déjà en jeu) : le sud est nu, et c'est ce vide qui pose la question du lieu
(« on ne grave pas au retour quand personne ne revient »).

### `scene_borne_mousse_sud_a.png` — macro sur les trois marques
```
Extreme macro of a rough granite surface filling the entire frame, no sky, no
horizon, no landscape; three deep chisel-cut marks carved into the stone near
the centre — one short vertical wedge, one pair of crossed strokes, one row of
small tally notches — their cut edges catching hard raking light from the
upper right while their depths stay black; coarse crystalline grain, two hairline
fractures crossing the surface, patches of dry flat lichen clinging in the
hollows around the marks, dark fantasy illustration, single raking light source,
deep crushed blacks, no fill light, high contrast, two-tone monochrome-friendly,
strong readable shapes, matte painting, grim medieval, square composition, no
text, no lettering, no watermark
```

**Raccord (les deux images de la Borne ont été rouvertes avant d'écrire ceci)** :
- **Polarité, non négociable** — sur `scene_borne_gravures_a_d`, la pierre est
  charbon et les gravures ressortent en **points ORANGE** (elles accrochent la
  lumière). Le macro doit garder cette polarité, sinon les deux plans de la
  même pierre se contredisent. La lumière rasante vient du **haut-droite**,
  comme sur cette image-là.
- **Pas l'établissement** — `scene_borne_frontiere_a_c` est un monolithe en
  contre-jour **totalement noir**, sans aucun détail de surface. Ce n'est PAS
  le raccord : on est ici collé à la pierre, la surface est le sujet.
- **Cadrage** : le pipeline recadre en CARRÉ puis 1000×1000, et le moteur
  affiche du **300×180 (5:3 paysage)**. Composer les trois marques dans la
  **bande horizontale centrale**, sinon un recadrage les mange.

⚠️ **Le piège du 6/08, à ne pas refaire** : ne jamais écrire « marques
illisibles » ou « pas de texte lisible » — le modèle SUPPRIME alors les
marques (c'est ce qui a vidé `scene_hameau_accueil_mur` de sa craie). Le
prompt décrit donc la **MATIÈRE** du geste (coup de ciseau, entaille,
encoche), jamais son illisibilité. Les trois marques doivent rester des
FORMES, jamais des lettres qu'on puisse lire.

⚠️ **Ce que l'image NE doit PAS porter** : aucun NOM gravé. La troisième
marque du sud est celle du prédécesseur, et le jeu la calcule à l'exécution
(`borneSud` — un nom de compte, plus une entaille par vie perdue). Un nom
peint dans l'image mentirait à chaque partie sauf une.

### La décision que cet asset force, à trancher avant de le câbler
`RubReveal` révèle aujourd'hui **un mot dessiné au canvas** (`config.label`,
« CÔTÉ SUD », en Instrument Serif). Si l'image porte elle-même les marques,
ce mot fait doublon. Deux voies :
- **(a)** l'image devient la couche révélée, et le libellé du moteur est
  retiré pour ce mini-jeu — la mousse s'efface sur de la vraie pierre gravée.
  C'est ce que la demande implique, et c'est le re-skin voulu.
- **(b)** l'image reste un fond de pierre NUE et le mot continue d'être
  dessiné par-dessus — moins beau, mais aucun changement de moteur.
Rien n'est câblé tant que ce n'est pas tranché : déposer le PNG ne casse
rien, il ne sera simplement pas encore servi.

## À TRANCHER (pas des prompts) — rappels
- **Le Moulin de `campement`** montre `scene_moulin_campement_a.png`, qui a
  QUATRE AILES — la version SANS ailes existe (`scene_moulin_sans_ailes_d_d.png`,
  P0 résolue) : c'est un champ `illustration` à repointer, pas une image à
  produire. En attente d'arbitrage depuis le 28/07.
- **femme-savoir-1..3** et **veuve-cordes-sait-1..3** (variantes « le village
  parle un cran plus fort ») réutilisent volontairement les visuels de la
  version normale : même rencontre, mêmes lieux — aucun asset requis.

---

## PRIORITÉ 2 — `objet_larme_du_geolier` (relecture du 10/08)

**Pourquoi** : c'est la SEULE récompense légendaire du jeu (Destin, +2 à tous
les jets). Aucune des trente icônes d'objet ne montre une larme, donc elle
retombe sur `objet_grimoire` — un grimoire à la place d'une larme, au moment
le plus rare d'une partie. Le repli générique a été laissé volontairement :
forcer un mauvais appariement serait pire.

**Fichier attendu** : `objet_larme_du_geolier_a.png`

**Prompt** (recette icône d'objet : fond noir, sujet centré, une seule source
de lumière rasante, silhouette lisible en très petit) :

> A single heavy dark droplet resting on bare black stone, seen close and from
> slightly above. The droplet is dense and glassy, catching one narrow band of
> low warm light along its curve; a faint ring of moisture has already dried
> around its base, leaving a pale halo on the stone. Nothing else in frame — no
> hand, no face, no vessel. Deep black background falling off to nothing at the
> edges. Stark chiaroscuro, single raking light source from the left, heavy
> grain, high contrast woodcut feel.

⚠️ Ne rien montrer du Geôlier lui-même (garde-fou §8 : jamais de visage, jamais
de membres). La larme existe, lui reste hors champ — c'est tout le sens de
l'objet (« Il jure qu'il ne pleure pas »).

---

# LOT DU 15/08 — les 20 images marquées « à remplacer », prompts prêts

Un prompt par sujet, autonome (bloc de style inclus). Toujours dark fantasy,
contre-jour extrême, silhouettes quasi noires découpées sur un ciel orange
brûlant — c'est ce contraste qui fait ressortir l'orange au dithering.

## 1. La Borne Frontière — `scene_borne_frontiere_v2_a.png`
Il manque l'homme immobile que le texte nomme dès le premier écran.
```
Tall angular granite boundary stone standing alone on a flat open moor, filling
the left third of the frame, its faces densely covered in shallow carved marks,
small humble offerings piled at its base, a lone motionless human silhouette
three paces away to the right, facing south with his back to the viewer, low
orange sun disc on the horizon, hazy stippled sky. Dark fantasy illustration,
extreme backlight, one single light source, near-black silhouettes against a
glowing orange sky, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, matte painting, grim medieval rural, square composition, no
text, no lettering, no watermark
```

## 2. Le Chemin Creux — `scene_chemin_creux_c.png`
Charrette et silhouette absentes, alors que ce sont deux points d'intérêt.
```
A narrow sunken path cut deep between two earthen banks taller than a man, the
sky reduced to a thin ribbon of orange overhead, a wooden cart tilted hard at the
first bend ahead, one wheel sunk in mud, a lone human figure approaching from
further down the hollow, near-black walls of packed earth and exposed roots.
Dark fantasy illustration, extreme backlight, one single light source, near-black
silhouettes against a glowing orange sky, deep crushed blacks, no fill light,
high contrast, two-tone monochrome-friendly, matte painting, grim medieval rural,
square composition, no text, no lettering, no watermark
```

## 3. La Bête des Chemins Creux — `monstre_bete_chemins_creux_a.png`
Échelle fausse : c'est un couloir resserré, pas un vallon. La bête est DESSUS.
```
Narrow sunken path hemmed between two steep earthen banks taller than a man, the
sky crushed to a thin bright ribbon far overhead, a huge hunched beast looming
directly above on the bank's rim, its shape mostly indistinct and eyeless in the
glare, only a hint of matted fur and a heavy paw visible at the edge, packed
earth walls filling most of the frame. Dark fantasy illustration, extreme
backlight, one single light source, near-black silhouette against a thin glowing
orange ribbon of sky, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, matte painting, grim medieval rural, claustrophobic framing,
square composition, no text, no lettering, no watermark
```

## 4. La Colline aux Gibets — beat 2 — `scene_colline_gibets_2_a.png`
Reliquat de la version en cercle fermé. Doit continuer la FILE de l'écran
d'arrivée, jamais se refermer, et ne montrer aucune figure encapuchonnée.
```
Continuing along a bare hill crest, more weathered wooden gallows posts standing
in a single receding line following the ridge into the distance, glowing orange
sky filling the gaps between them, dark heather and exposed rock underfoot, the
line simply climbing further ahead toward a taller shape barely visible at the
top of the crest. Dark fantasy illustration, extreme backlight, one single light
source, near-black silhouettes against a glowing orange sky, deep crushed blacks,
no fill light, high contrast, two-tone monochrome-friendly, matte painting, grim
medieval rural, square composition, no text, no lettering, no watermark
```

## 5. Le Pendu qui parle — `monstre_pendu_qui_parle_a.png`
Le sceau au poing doit être visible ; poignets liés devant lui (cohérent avec
l'écran suivant).
```
Close view of a hanged man's raised fist held against his own chest, gripping a
fold of his robe, a heavy signet seal ring cutting into the swollen knuckle,
wrists bound together in front of him with coarse rope, faint rope shadow
crossing the frame, warm rim light along the hand from a low sun out of frame.
Dark fantasy illustration, one single light source, near-black silhouette with a
thin orange rim of light, deep crushed blacks, no fill light, high contrast,
two-tone monochrome-friendly, matte painting, grim medieval rural, square
composition, no text, no lettering, no watermark
```

## 6. Le Champ des Fixés — beat 2 — `monstre_fossoyeur_poteaux_a.png`
Des poteaux droits, jamais une croix — la Fixation plante, elle n'enterre pas.
```
A gravedigger kneeling among rows of plain squared wooden posts driven straight
into open ground between old flat grave slabs, every post a single upright shaft
with no crossbar of any kind, one post held loosely in his hands with a fresh
notch half-cut into it, low sun behind casting long post-shadows across the
earth. Dark fantasy illustration, extreme backlight, one single light source,
near-black silhouettes against a glowing orange sky, deep crushed blacks, no fill
light, high contrast, two-tone monochrome-friendly, matte painting, grim medieval
rural, square composition, no text, no lettering, no watermark
```

## 7. Le Hameau (échelle) — `scene_hameau_dense2_b.png`
Une vingtaine de feux, une seule cheminée qui fume, rien de plus haut que les
toits. La petitesse est structurante (tout le village tient dans le Tribunal).
```
A small huddle of about twenty low thatched and turf-roofed houses seen from a
distance across open moorland, walls that look held together by habit more than
repair, only a single thin plume of smoke rising from one chimney among them, no
structure rising above the roofline anywhere in the settlement, low orange sun
behind it, dark heather in the foreground. Dark fantasy illustration, extreme
backlight, one single light source, near-black silhouettes against a glowing
orange sky, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, matte painting, grim medieval rural, square composition, no
text, no lettering, no watermark
```

## 8. La cloche qu'on retient — `scene_hameau_accueil_cloche_b.png`
⚠️ Pas un problème de contenu : une fausse signature cursive est cuite dans le
dithering. **Relance simplement ce même prompt** (une autre graine suffit) :
```
Close view of a thick frayed bell rope hanging straight down the rough stone
wall of a small chapel, filling the left of the frame. An old woman's hand and
forearm are closed tight around the rope, holding it completely still — the
gesture is the subject. Just behind her, a man is frozen mid-stride, one arm
still reaching for the rope he will not touch. Further back and much smaller, a
row of motionless figures stands in lit doorways along a wall, watching. Low
orange sun behind them, the foreground hand and rope caught by hard side light.
Dark fantasy illustration, one single light source, deep crushed blacks, no fill
light, high contrast, two-tone monochrome-friendly, strong readable shapes, matte
painting, grim medieval village, square composition, no bell visible, no text, no
lettering, no watermark
```

## 9. Le Marché Muet — `scene_marche_muet_c.png`
Entièrement vide d'humains ; trois choix jouables reposent sur des marchands qui
négocient par gestes.
```
A row of makeshift market stalls in a village square, several traders and
buyers frozen mid-gesture instead of speaking, palms open and matched against
each other, one hand mid-nod, small silent goods laid out on cloth, nobody's
mouth open, low orange evening sun raking across the stalls, near-black
silhouettes at the far end of the square. Dark fantasy illustration, one single
light source, strong side light, deep crushed blacks, no fill light, high
contrast, two-tone monochrome-friendly, strong readable shapes, matte painting,
grim medieval village, square composition, no text, no lettering, no watermark
```

## 10. Le Moulin sans Ailes — `campement` — `scene_moulin_sans_ailes_d_d.png`
5e signalement. Prompt déjà corrigé (10/08) : aucune clause négative, le sujet
n'est plus un moulin mais un silo — le mot « moulin » appelle les ailes.
```
Squat round stone granary silo standing alone on a low mound on open moorland,
smooth cylindrical masonry, flat truncated stone cap, a short rusted iron stub at
the centre of the cap, four pale unweathered vertical bands on the stonework
below the cap, small dark doorway at its base, huge low orange sun disc directly
behind it, dark moor in the foreground. Dark fantasy illustration, extreme
backlight, one single light source, near-black silhouette against a glowing
orange sky, deep crushed blacks, high contrast, two-tone monochrome-friendly,
matte painting, grim medieval rural, square composition
```

## 11. Le Puits Condamné — `scene_puits_condamne_v2_a.png`
Scellé de frais, pas ouvert : planches neuves, chaînes croisées, cadenas gras,
blocs de meule par-dessus.
```
A stone well mouth completely sealed shut by fresh unweathered wooden planks
nailed tightly across it, two heavy iron chains crossing over the planks and
locked with a large well-oiled padlock, two flat millstone blocks stacked on top
for extra weight, coiled rope hanging useless and unused beside the well rim,
low orange sun raking hard across the planks from one side. Dark fantasy
illustration, extreme backlight, one single light source, near-black silhouette
with a thin orange rim of light, deep crushed blacks, no fill light, high
contrast, two-tone monochrome-friendly, matte painting, grim medieval rural,
square composition, no text, no lettering, no watermark
```

## 12. Le Puits Condamné — beat 2 — `monstre_mains_du_puits_a.png`
⚠️ **Recommandation : ne rien produire tout de suite.** L'image actuelle (bras
déjà dehors) est fausse ICI mais parfaitement juste sur l'issue d'EXPIRATION du
Puits (« les Mains du Puits ») — dis-le-moi et je la redéplace côté code, à
coût nul. Ce qu'il faut produire à la place pour CE beat, c'est l'instant
d'avant :
```
Extreme close view of the sealed well planks from very close, one plank visibly
lifted a hair's width at its edge by something pressing from beneath, a single
pale fingertip just barely showing in the gap, the padlock and chains still
holding everything else in place, hard raking side light catching the raised
edge of the plank. Dark fantasy illustration, one single light source, deep
crushed blacks, no fill light, high contrast, two-tone monochrome-friendly,
strong readable shapes, matte painting, grim medieval rural, square composition,
no text, no lettering, no watermark
```

## 13. La Maison du Bailli — `scene_maison_du_bailli_c.png`
Seule à l'ouest, sans voisine, murée DE L'INTÉRIEUR — décrire la matière du
bouchage plutôt que nier les fenêtres.
```
A tall isolated stone house standing utterly alone on open moorland well west of
any settlement, no other building anywhere near it, every window opening filled
solid with roughly mortared fieldstone from the inside, the masonry infill
slightly paler and newer than the surrounding wall stone, a single dark low
doorway at ground level, low orange sun behind the house, dark heather in the
foreground. Dark fantasy illustration, extreme backlight, one single light
source, near-black silhouette against a glowing orange sky, deep crushed blacks,
no fill light, high contrast, two-tone monochrome-friendly, matte painting, grim
medieval rural, square composition, no text, no lettering, no watermark
```

## 14. Le Petit Tribunal — `scene_petit_tribunal_a.png`
La salle basse aux trois bancs ; la feuille clouée ; le livre ouvert sur la
chaire. (La corde de pendu actuelle n'est mentionnée par aucun texte — retirée
ci-dessous ; dis-moi si tu veux la garder, elle est belle.)
```
Low stone court chamber, three plain wooden benches facing a heavy stone lectern
with a large ledger lying open on it, a single sheet of parchment nailed to the
bare stone wall with dense unreadable handwriting suggested as texture, a bright
arched opening glowing orange behind the lectern lighting the room from that one
side, cold damp stone walls, dust in the air. Dark fantasy illustration, extreme
backlight, one single light source, near-black silhouettes against a glowing
orange arch, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, matte painting, grim medieval interior, cold damp stone,
square composition, no text, no lettering, no watermark
```

## 15. La Meute Grise — beat 1 — `monstre_meute_grise_c.png`
⚠️ Même cas que #8 : image bonne, fausse signature cuite dans le dithering.
Relance ce prompt (le texte a déjà été recalé sur cette composition, cinq
bêtes de front, le cercle reste hors champ) :
```
Five grey wolf-like beasts standing shoulder to shoulder in a single row
directly facing the viewer, blocking a stretch of open moorland, low heads,
matted fur in near-black silhouette, breath visible as pale mist, no visible
structure or settlement anywhere in frame, low orange sun low behind them. Dark
fantasy illustration, extreme backlight, one single light source, near-black
silhouettes against a glowing orange sky, deep crushed blacks, no fill light,
high contrast, two-tone monochrome-friendly, matte painting, grim medieval
rural, square composition, no text, no lettering, no watermark
```

## 16. Le Verger Noir — `scene_verger_noir_d.png`
L'ordre volontaire EST le sens du lieu : des rangs, pas un enchevêtrement.
```
A dark orchard of bare gnarled fruit trees planted in strict deliberate rows
receding to the horizon, heavy round grey fruit hanging from every branch, the
one visible sign of order anywhere on the moor, low orange sun burning low
between the trunks along the row, dark tilled earth underfoot. Dark fantasy
illustration, extreme backlight, one single light source, near-black silhouettes
against a glowing orange sky, deep crushed blacks, no fill light, high contrast,
two-tone monochrome-friendly, matte painting, grim medieval rural, square
composition, no text, no lettering, no watermark
```

## 17. La Palissade Sud — `scene_palissade_sud_a_a.png`
Dernier écran avant la sortie de zone : mur, portillon, guérite, lanterne
allumée en plein jour, et l'homme dedans — rien de tout ça n'est visible
aujourd'hui.
```
Long palisade of blackened sharpened logs twice the height of a man, cutting
across the entire horizon of an open moor, a narrow wooden gate set in the wall
at the centre of the frame, a small plank sentry box built against the logs
beside the gate, a lit lantern hanging at the sentry box despite the daylight,
a lone watchman's silhouette just visible inside the box, low orange sun sinking
behind the wall. Dark fantasy illustration, extreme backlight, one single light
source, near-black silhouettes against a glowing orange sky, deep crushed
blacks, no fill light, high contrast, two-tone monochrome-friendly, strong
readable shapes, matte painting, grim medieval rural, square composition, no
text, no lettering, no watermark
```

## 18. Le Veilleur de la Palissade — `veilleur-1` (aujourd'hui une icône d'objet)
Premier portrait du personnage — d'après la règle des variantes, la PREMIÈRE
image d'un personnage établit et décrit en entier.
```
Portrait of a weathered watchman standing inside a narrow wooden sentry box
built against a palisade of sharpened logs, a lit lantern hanging beside him
despite full daylight, a heavy cloak, eyes fixed on the moor beyond the gate,
plain black background behind the box, warm rim light from the lantern catching
one side of his face and shoulder. Dark fantasy illustration, one single light
source, near-black silhouette with warm rim light, deep crushed blacks, no fill
light, high contrast, two-tone monochrome-friendly, matte painting, grim
medieval rural, plain dark background, square composition, no text, no
lettering, no watermark
```

## 19. Le Procès du Héros — `scene_proces_du_heros_v4_c.png`
Même salle et même échelle que le Petit Tribunal — pas une nef d'église.
```
The same low stone court chamber as the village tribunal, now packed with about
twenty villagers standing crowded along three plain wooden benches and against
the walls, all facing the same direction in silence, a bright arched opening
glowing orange at the far end lighting the room from that one side, cold damp
stone, dust caught in the light. Dark fantasy illustration, extreme backlight,
one single light source, near-black silhouettes against a glowing orange arch,
deep crushed blacks, no fill light, high contrast, two-tone monochrome-friendly,
matte painting, grim medieval interior, cold damp stone, square composition, no
text, no lettering, no watermark
```

## 20. La Descente — `la-descente`
Le seul écran où l'on sort vivant de la zone. Aujourd'hui une vue de marche
générique — il lui faut un visuel dédié.
```
A wide stone stairway plunging steeply down into an open trapdoor-like gap in
the moor, the steps disappearing into a blackness with no visible bottom, the
last visible step catching a sliver of low orange light before the dark begins,
open moorland and dusk sky behind the viewer, cold air seeming to rise from the
opening. Dark fantasy illustration, extreme backlight, one single light source,
near-black silhouette against a glowing orange sky fading to pure black at the
opening, deep crushed blacks, no fill light, high contrast, two-tone
monochrome-friendly, matte painting, grim medieval rural, square composition, no
text, no lettering, no watermark
```
