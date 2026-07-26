# Maquettes HTML (Claude Chat)

Prototypes autonomes produits par Claude Chat, gardés ici comme **référence de
conception**. Aucun n'est chargé par le jeu : ce sont des documents, pas du code
de production. On les ouvre dans un navigateur pour retrouver une intention
(un rythme d'animation, un enchaînement d'écrans, un ton de texte) au moment de
l'implémenter dans `aldenhar/`.

## Qui fait foi, et quand

Règle du projet, inchangée : **pour un écran qui existe dans Figma, la maquette
Figma de Patrick prime.** Une maquette HTML ne sert alors qu'à ce que le Figma
ne peut pas montrer — le mouvement, la temporisation, l'enchaînement. Pour un
écran sans Figma, la maquette HTML est la seule source et fait foi.

Le cas type est l'accueil (16/07) : la mise en page vient du Figma, mais toute
l'animation (respiration par paliers entiers, cendres 1px, `seedWisps`) a été
reprise **telle quelle** du prototype, parce qu'aucune maquette statique ne
pouvait la décrire.

## Fichiers présents

| fichier | écran | reçue | Figma prime ? |
|---|---|---|---|
| `sequence_de_mort_v2.html` | La séquence de mort complète, en 6 temps : beat fatal (la mort arrive *dans* la scène, CTA rongés) → épitaphe → fragment du Geôlier → entrée au Grand Registre → forge de la relique → la relève. | 26/07/2026 | **Non** — aucun Figma pour ces écrans. La maquette fait foi. |

⚠️ **`sequence_de_mort_v2` diverge de ce qui est implémenté.** L'écran de mort
en jeu (`components/DeathScreen.tsx`, 14/07) suit la spec Notion d'alors : dé
brisé → épitaphe → dissolution → « Jour X · N rencontres » → relique →
« Accepter et recommencer ». La maquette ajoute deux temps qui n'existent pas
(le **fragment du Geôlier**, qui donnerait corps au « à chaque mort je te dirai
une chose de plus » promis par la 3ᵉ clause de l'intro, et l'**entrée au
Registre** jouée comme un écran à part) et déplace le beat fatal *dans* la
scène. À arbitrer avec Patrick avant de réécrire l'existant.

## En attente

Annoncées, pas encore transmises en session Claude Code :

| fichier | écran | Figma prime ? |
|---|---|---|
| `accueil_geolier_v5` | accueil animé (Geôlier, respiration + cendres) | Figma 1963:370 / 1970:458 pour la mise en page ; le prototype pour l'animation |
| `prologue_nom` | écran du Nom, fin du Seuil | **oui** — Figma 2167:203 |
| `ecran_options_compact` | onglet Options du menu | **oui** — Figma 2137:406 |
| `ecran_pacte_ab` | les clauses du pacte (intro) | **oui** — Figma 2238:1009 |
| `ecran_grand_registre` | Grand Registre | **non** — aucun Figma connu |

## Ailleurs dans le dépôt

Deux fichiers de même nature ne sont pas ici, à dessein :

- `aldenhar/reference/REFERENCE_de_3d_tactile.html` — le prototype validé du dé
  3D. Il vit à côté du code qu'il documente, et le CLAUDE.md renvoie dessus.
- `data/couverture_carte_v2.html` — ce n'est pas une maquette mais un **outil**,
  servi par GitHub Pages à côté de `couverture.html`. Voir ci-dessous.

### `data/couverture_carte_v2.html` — la carte visuelle

Vue en plan des Landes : un bloc par lieu positionné sur un plateau, un volet
qui s'ouvre sur les scènes du lieu (image principale à gauche, variantes à
droite), une loupe, un marquage « à remplacer », et la réserve des images non
rattachées.

Deux choses à savoir avant d'y toucher :

1. **Elle doit être recopiée à chaque déploiement.** Le sous-dossier
   `aldenhar/` de la branche `gh-pages` est intégralement remplacé par le build
   du jeu — tout ce qui y est posé à la main disparaît. C'est pour ça que la
   source vit dans `data/` : `couverture.html` est régénérée par
   `tools/coverage.py --web`, et `couverture_carte_v2.html` est copiée depuis
   `data/`. Les deux font partie de la procédure de déploiement.
2. **Ses données sont figées dans le fichier** (tableaux `LIEUX` et
   `ORPHELINS`), là où `couverture.html` est générée depuis `lib/scene-data.ts`.
   La carte est donc un instantané : elle ne suivra pas une scène ajoutée ou une
   image recâblée. Au 26/07 elle est juste (79 / 6 / 6 / 1, mêmes comptes que
   l'outil généré), mais il faudra soit la régénérer à la main, soit la brancher
   sur `coverage.py` si elle devient l'outil principal.

⚠️ Elle introduit un **rouge `#a4001b`** (`--rouge`) pour les alertes, alors que
le rouge est banni de PACTUM depuis le 14/07 (« plus AUCUN rouge dans le jeu »).
C'est un outil interne, pas le jeu, donc ce n'est pas une régression — mais je
l'ai laissé tel quel plutôt que de retoucher une maquette de Patrick sans son
accord. À trancher : garder le rouge comme code d'alerte propre à l'outillage,
ou le remplacer par du blanc comme partout ailleurs.
