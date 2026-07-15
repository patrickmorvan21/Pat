---
name: pactum-style
description: "Direction artistique et contraintes verrouillées du jeu PACTUM (livre-jeu mobile dark fantasy, HTML/JS/Three.js). À consulter OBLIGATOIREMENT avant d'écrire du CSS, du JS d'interface, du canvas, une illustration, un asset, un écran, un prototype, une landing page ou du copy pour Pactum — même si la demande ne mentionne pas explicitement la DA. Déclencher dès que la tâche touche à Pactum (anciennement Aldenhar) : couleurs, dithering, typographie, mini-jeux, transcript, Geôlier, dé, reliques, santé, illustrations, pipeline d'images. Ces règles sont non-négociables et priment sur tout goût par défaut (pas de dégradés, pas de layouts modernes, pas d'easing fluide)."
---

# PACTUM — Direction artistique & contraintes verrouillées

PACTUM est un livre-dont-vous-êtes-le-héros mobile, dark fantasy, solo dev.
Philosophie : **l'IA arbitre, le joueur est contraint, jamais omnipotent**.
Ce skill encode des décisions VERROUILLÉES. Ne jamais les "améliorer",
ne jamais y substituer un goût par défaut (moderne, fluide, propre).
L'esthétique cible : vieux jeu qui tremble, matière tramée, brutalité pixel.

## 1. Piliers non-négociables (produit)

1. **Permadeath** — uniquement par choix en jeu. Fermeture d'app, appel,
   perte de connexion ne tuent JAMAIS. Sauvegarde locale, reprise exacte.
2. **Aucune saisie de texte libre** — jamais, nulle part.
3. **La mort est progression** — système de Reliques entre les runs.

## 2. Palette (exhaustive — 3 couleurs, aucune autre)

```css
:root{
  --charbon:#1c1a16;              /* fond universel (app), fills des CTA primaires */
  --orange:#e0632a;               /* accent unique : UI, illustrations, dithering, fond landing */
  --blanc:#ffffff;                /* emphases rares : texte révélé, curseurs, têtes actives */
  --blanc-50:rgba(255,255,255,.5);/* texte secondaire, hints, captions, labels système */
  --blanc-20:rgba(255,255,255,.2);/* traits guides, bordures inactives, reliefs, speckle */
}
```

- Toute nuance intermédiaire se fait en **jouant sur l'opacité du blanc**,
  jamais en introduisant un nouvel hex. 50% et 20% sont les paliers standards.
- **OBSOLÈTES — ne plus jamais utiliser** : Sable #d8a25f, Brique #ac2e26,
  Guide #4a4335, Crème #e8dfc8, Charbon-2 #24201a. Leurs anciens rôles migrent
  vers blanc-50 (secondaire) et blanc-20 (discret).
- **ZÉRO dégradé CSS**, nulle part, jamais. Un "dégradé" se fait en densité
  de pixels décroissante (anneaux/semis procéduraux sur canvas).

## 3. Typographie (2 fonts, pas plus)

- **Instrument Serif** : titres uniquement.
- **Roboto Mono** : tout le reste (texte UI, narration, labels, boutons, code).
- VT323 et Jacquard 12 sont ABANDONNÉES — ne plus les charger ni les référencer.
- Corps de base ~19px, narration 20px, hints/captions 14–16px en blanc-50.
- Labels système en MAJUSCULES avec letter-spacing 1–2px.

## 4. Rendu pixel — règles de matière

- Tout canvas : `image-rendering: pixelated`, `touch-action: none` si interactif.
- **Jamais d'aplat net ni de rectangle propre** : toute forme est un semis
  de pixels à bords rongés (`noisyRect` : remplir par densité aléatoire,
  débord de bruit sur le contour).
- Fonds : speckle procédural (blanc-20 très clairsemé sur --charbon).
- Curseurs/têtes actives : --blanc plein avec poussière blanc-20 autour.
- Le tremblement est une qualité : jitter ±1px, jamais d'alignement parfait.

## 5. Animation

- **`steps()` uniquement, aucune interpolation, aucun fondu.** Cycles de
  frames pré-rendues (~320ms/frame pour le Geôlier), pulsations par paliers
  (taille 3px↔4px, pas d'opacité animée).
- Typewriter : 12–18ms/caractère (narration), interruptible — un tap révèle
  tout. Curseur `▌` clignotant en steps(1).
- **Geôlier : 42ms/caractère** (plus lent, pesant).
- Toujours respecter `prefers-reduced-motion` : texte instantané, pas de shiver.
- Feedback **purement visuel** — le son peut être coupé, rien ne doit en dépendre.

## 6. Dithering & pipeline d'illustrations

Paramètres canoniques (voir `references/dithering.md` pour l'algorithme exact) :
- Floyd-Steinberg, pixel size 1, threshold 182, contraste 151%, pas d'inversion.
- Contraste = formule linéaire pivot 128 : `v = (v−128)×1.51+128`.
  **JAMAIS PIL ImageEnhance.Contrast** (résultat visuellement différent).
- Résolution cible : 3× l'affichage, MAXDIM = 1170px.
- Outil canonique : `generateur_dithering_v4_dispatch_fidele_2.html`.
  Port Python validé : `dither_v4.py`. Toute implémentation doit être
  validée visuellement contre l'outil HTML.
- Bicolore : Charbon + Orange uniquement.
- Sources : Leonardo.ai → dithering → Drive, nommage `{categorie}_{sujet}.png`
  avec préfixes `scene_`, `monstre_`, `objet_`.
- Image fixe tant que l'environnement ne change pas ; mise à jour sur nouvel
  environnement ou événement clé. Pas de génération IA live par scène.

## 7. Interface & interactions verrouillées

- **Transcript défilant** (pas d'écran-par-scène) : rien ne disparaît,
  historique scrollable. L'action choisie s'affiche (préfixe `› ` en blanc-50)
  AVANT sa conséquence. Marqueur temporel : chip `JOUR X` (jamais "Chapitre").
- **Choix ancrés en bas** : bordure --orange 2px, fond transparent,
  actif = inversion (fond orange, texte charbon). Verrouillé = blanc-20, inerte.
  Risqué = highlight + hint contextuel « Lance le dé — [Stat] ».
- **CTA — cadre décalé (signature visuelle)** : la bordure n'est jamais un
  rectangle aligné. Elle est composée de segments détachés, décalés de
  quelques px par rapport à la forme, qui dépassent ou s'arrêtent avant les
  angles, d'épaisseurs légèrement inégales (le bas souvent plus épais).
  - **Primaire** : bloc PLEIN (charbon sur fond orange, orange sur fond
    charbon) + segments de cadre décalés dans la même couleur que le bloc.
  - **Secondaire** : contour seul (fond transparent), mêmes segments décalés.
- **Le dé flotte en permanence** — pas d'écran dédié. Choix neutres :
  résolution instantanée.
- **Santé : ni barre ni chiffre.** Érosion pixel des boutons de choix,
  croissante quand la santé baisse. Palier « Au seuil » : vibration pixel
  plein écran toutes les 10 s.
- **Frotter** : logique inversée — la suie est ORANGE (matière dense),
  le texte révélé dessous est BLANC.
- **Glyphe** : suivi de tracé strictement séquentiel (proximité du PROCHAIN
  point, jamais de n'importe quel point). Complexité et tolérance liées à Ruse.
- **Menu** : un losange unique, position fixe, ouvre en plein écran
  (jamais popup) : Options, Reliques, Besace, Miroir de l'âme.
- Boutons retour/losange : carré 34px tourné 45° (`transform: rotate(45deg)`).

## 8. Le Geôlier

- La couleur Brique est supprimée. Le traitement distinct du Geôlier passe
  désormais par : bannière dédiée, typewriter ralenti (42ms), et texte en
  --blanc plein (seule « voix » en blanc dans le récit). [À confirmer/affiner]
- Tag : `◉ le geôlier te regarde` (14px, blanc-50, majuscules, letter-spacing 2px).
- Rare mais légèrement au-dessus du minimum : succès/échec critiques, mort,
  jalons de reliques, scènes aléatoires occasionnelles.
- Livre les stats agrégées en dialogue (« Douze mille avant toi… »),
  jamais en UI froide. Il observe TOUS les héros de TOUS les joueurs.
- Visuel : masse sombre écrasante, yeux seuls visibles (pulsation par paliers),
  cornes/capuche en vague, cadrage océanique. Charbon/Orange dithéré.

## 9. Systèmes de jeu (rappels pour tout code de gameplay)

- Stats seedées par 2–4 choix narratifs forcés au prologue + légère
  randomisation. Aucun écran d'allocation. Pas d'augmentation permanente
  en cours de run — seulement des états temporaires (*Aguerri*, *Entaillé*).
- Combat = 1–3 scènes choix+dé comme le reste. Difficulté via seuils de jet,
  jamais de jauge HP monstre.
- Texte des boutons identique pour tous les héros (les stats modifient
  silencieusement l'issue, pas l'affichage).
- Systèmes cross-run (Grand Registre, Dette de sang, Pacte à la marge,
  tons saisonniers du Geôlier) : UN store mémoire joueur centralisé,
  distinct du run courant, jamais dupliqué.

## 10. Vocabulaire (copy)

Tutoiement du joueur. Français littéraire, phrases courtes, sensoriel
(odeurs, sons, matière). Noms propres : le Geôlier-Juge, la Besace,
les Reliques, le Grand Registre, le Pacte à la marge, la Dette de sang,
le Miroir de l'âme, « Au seuil ». Le jeu s'appelle **PACTUM**
(ni Aldenhar, ni Mortem — noms abandonnés).

## Références

- `references/dithering.md` — algorithme Floyd-Steinberg exact, formule de
  contraste, pièges connus (PIL), procédure de validation. À lire avant
  TOUT travail sur le pipeline d'images ou toute réimplémentation.
