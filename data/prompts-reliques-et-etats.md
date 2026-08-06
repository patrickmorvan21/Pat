# À générer — reliques des Landes + l'état manquant

Liste à passer telle quelle au générateur. Chaque prompt est **autonome** : le
bloc de style est dedans, rien à assembler.

---

## ⚠️ À lire avant de générer les reliques

Les 9 images déjà déposées dans `03_Validé_Reliques` portent des noms qui **ne
correspondent à aucune des 10 reliques codées** :

| déjà sur le Drive | relique codée correspondante |
|---|---|
| `relique_dent_felee_c` | ≈ **Dent du décompte** (nom différent) |
| `relique_clou_du_registre_c` | ≈ **Clou du silence** (nom différent) |
| `relique_echarde_a` | ✗ l'Écharde du grand gibet est un **objet de Besace**, pas une relique |
| `relique_pierre_de_retour_a` | ✗ la Pierre de Retour est un **objet de Besace** |
| `relique_grelot_muet_b` | ✗ le Grelot du charretier est un **objet de Besace** |
| `relique_sceau_fendu_a` · `relique_noeud_defait_b` · `relique_anse_rompue_a` · `relique_dague_emoussee_c` | ✗ aucune relique de ce nom |

Deux lectures possibles, à trancher :

1. **Ce sont de nouveaux noms de reliques que tu veux** → dis-le-moi et je
   renomme les 10 reliques dans le code pour coller à tes images.
2. **Ce sont les 10 reliques codées, illustrées sous d'autres noms** → alors il
   faut regénérer sous les noms canoniques ci-dessous, sinon rien ne se
   raccorde (le code cherche `assets/relique_{id}.png`).

**Les noms de fichiers ci-dessous sont les seuls que le jeu saura lire.**

---

## Format (identique pour tout ce document)

**1000×1000**, palette 2 couleurs Charbon `#1c1a16` / Orange `#e0632a`, un
seul sujet isolé sur fond noir. Une relique s'affiche dans un cadre de 336 px
sur l'écran de mort, et en vignette de 66 px dans l'Inventaire : **c'est la
SILHOUETTE qui doit lire**, jamais une texture fine.

Pas d'horizon, pas de ciel, pas de décor — même grammaire que les icônes
d'objet déjà en jeu.

**Bloc de style à coller après chaque sujet :**

> Pitch-black background, the object isolated and filling the frame, one
> single hard light source raking from the side so the silhouette reads at a
> glance, no horizon, no sky, no scenery, no figure, no hands, dark fantasy
> illustration, deep crushed blacks, no fill light, high contrast, two-tone
> monochrome-friendly, strong readable shapes, matte painting, grim medieval
> rural, square composition, no text, no lettering, no watermark

---

## Les 10 reliques

| fichier | nom en jeu | rareté | ce que c'est |
|---|---|---|---|
| `relique_vertebre_gravee.png` | Vertèbre gravée | rare | forgée d'une mort par corde |
| `relique_corde_seche.png` | La corde sèche | commune | forgée d'une mort par corde |
| `relique_oeil_lanterne_verte.png` | Œil de lanterne verte | rare | mort quelconque |
| `relique_dent_du_decompte.png` | Dent du décompte | légendaire | forgée d'une mort par la bête |
| `relique_clou_du_silence.png` | Clou du silence | rare | forgée d'une mort par fixation |
| `relique_miroir_noye.png` | Le miroir noyé | rare | forgée d'une noyade |
| `relique_eclat_de_de_fele.png` | Éclat de dé fêlé | commune | mort quelconque |
| `relique_anneau_de_suie.png` | Anneau de suie | commune | mort quelconque |
| `relique_sablier_sans_sable.png` | Sablier sans sable | rare | forgée d'une chute |
| `relique_nom_que_echo_a_garde.png` | Le nom que l'écho a gardé | légendaire | mort quelconque |

### Sujets, dans l'ordre du tableau

1. `relique_vertebre_gravee` — *a single human neck vertebra, pale bone, its
   surface covered in tiny scratched tally marks, lying alone*
2. `relique_corde_seche` — *a short length of old hemp rope, stiff and dry, its
   cut end frayed open into stiff bristles, coiled once upon itself*
3. `relique_oeil_lanterne_verte` — *a small cracked lantern glass, round and
   convex like an eye, a single ember still caught behind the glass*
4. `relique_dent_du_decompte` — *one long curved animal fang, notched along its
   inner edge with a row of deep cut marks*
5. `relique_clou_du_silence` — *a heavy hand-forged iron nail, bent near its
   head, a shred of dry cloth still caught under the head*
6. `relique_miroir_noye` — *a small hand mirror, its glass clouded and blistered
   as if long underwater, water beading on the frame*
7. `relique_eclat_de_de_fele` — *a broken shard of a carved bone die, one
   engraved pip still readable on the fragment, the fracture fresh*
8. `relique_anneau_de_suie` — *a plain iron finger ring, thickly caked in soot,
   one small arc of the metal rubbed clean and bright*
9. `relique_sablier_sans_sable` — *a small wooden hourglass, both bulbs
   completely empty, the wood cracked, standing upright*
10. `relique_nom_que_echo_a_garde` — *a small bronze bell with no clapper, its
    mouth turned toward the viewer, the inside deeply dark*

---

## L'état manquant

Un seul des six états n'a pas d'icône dans le Drive : **FIÉVREUX**. Les cinq
autres sont intégrés et fonctionnent.

| fichier | état |
|---|---|
| `etat_fievreux.png` | FIÉVREUX (corps) — plaie non soignée, eau de la Mare, morsure |

**Sujet** — *a hunched torso, both hands clamped together over the sternum,
shoulders drawn in, the posture of someone freezing while burning up*

(même bloc de style que ci-dessus, mais autoriser une figure : remplacer
« no figure, no hands » par « a single isolated figure, face not visible »)

---

## Ce qui n'est PAS à générer

Les icônes d'état **Serein · Reconnu · Appelé** (dossier Positif) et
**Cru · Souillé** (dossier Négatif) existent déjà sur le Drive et sont bonnes —
mais leurs états ne sont pas encore codés (étapes 6 et 10 de la spec). Elles
seront reprises telles quelles le moment venu, rien à refaire.
