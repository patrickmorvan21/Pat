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

1. **⚠️ `scene_moulin_sans_ailes_c.png` montre un moulin AVEC ses ailes** — une
   grande croix de lattes complète, en silhouette devant le soleil. Or le lieu
   s'appelle *le Moulin sans Ailes* et son point d'intérêt (« la croix d'ombres »)
   repose entièrement sur le fait que les ailes ont **disparu** : les quatre
   bandes pâles sont la trace de la pierre protégée par les ailes, puis exposée
   d'un coup. L'image contredit le texte. **Il faut une nouvelle image de lieu**
   (prompt fourni plus bas) — sinon c'est le texte qu'il faut changer.
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

### `scene_moulin_sans_ailes_d.png` — ⚠️ 3 tentatives RATÉES, à refaire
La génération du 25/07 (`_d_d`) a **gardé les quatre ailes** malgré « sail
assembly completely gone ». Celle du 28/07 (`scene_moulin_campement_a.png`,
aujourd'hui câblée sur `campement`) les garde **aussi** — quatre ailes complètes
en croix devant le soleil. L'image est belle et bien tramée, mais elle contredit
frontalement le nom du lieu et son point d'intérêt.

C'est un piège classique : le mot *windmill* appelle les ailes, et un modèle de
diffusion ne sait pas retirer un élément sur commande — une consigne négative
(« no blades ») renforce même souvent ce qu'elle interdit. Il faut décrire
**ce qui est là**, sans jamais nommer un moulin :
```
Squat round stone tower alone on a low mound on open moorland, no blades, no
vanes, no timber structure of any kind at its top, just a bare truncated cap of
masonry with a single short broken iron stub at its centre, four pale
unweathered vertical bands on the stonework below the cap, huge low orange sun
disc directly behind the tower, dark moor in the foreground. Dark fantasy
illustration, extreme backlight, one single light source, near-black silhouette
against a glowing orange sky, deep crushed blacks, no fill light, high contrast,
two-tone monochrome-friendly, matte painting, grim medieval rural, square
composition, no text, no lettering, no watermark
```
Si le modèle insiste, l'autre solution est de générer une **tour ronde en
ruine** sans mentionner de moulin du tout, et de laisser le texte du jeu faire
le travail (« un moulin privé de ses ailes »).

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
