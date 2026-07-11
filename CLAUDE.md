# ALDENHAR — Contexte projet (pour Claude Code)

Jeu narratif mobile dark fantasy. Philosophie centrale : l'IA **arbitre**, elle n'obéit pas — le joueur est contraint, jamais tout-puissant.

Ce fichier condense les décisions déjà verrouillées côté design (prises avec Claude Chat). Il ne remplace pas une lecture du code existant, mais évite de redemander à chaque session ce qui est déjà tranché. À tenir à jour manuellement après chaque décision structurante.

---

## Les 3 piliers non négociables

1. **Permadeath** — une vie par run. La mort ne vient QUE d'un choix/jet raté dans la fiction. Fermer l'app, recevoir un appel, perdre la connexion : **jamais** une cause de mort. La run se sauvegarde localement et reprend exactement où elle s'est arrêtée.
2. **Contrainte du joueur** — via stats de personnalité + dés. Pas de contrôle narratif libre, pas de texte libre.
3. **La mort comme progression** — système de reliques (à détailler séparément quand on y arrive).

---

## Mécaniques verrouillées

- **Stats** : Courage, Ruse, Instinct, Empathie. Fixées via un prologue narratif de 2-4 choix forcés + un peu de hasard en tout début de run. Pas d'écran de répartition de points. Jamais de montée permanente en cours de run.
- **Progression en cours de run** : pas de stats qui montent — des **états narratifs temporaires** (positifs/négatifs, ex. *Aguerri*, *Entaillé*) qui modifient les jets pour un temps, déclenchés par des événements.
- **Choix** : 3 options par défaut par scène (un 4e slot se débloque via relique/objet). Deux types :
  - **Verrouillé** : seuil dur de stat, grisé si indisponible.
  - **Risqué** : dé + stat résolvent la réussite en coulisse. Le texte du bouton est identique pour tous les héros — **aucun chiffre affiché**.
  - Pas de texte libre, jamais.
- **Vie** : pas de barre, pas de chiffre. Le tramage pixel de l'interface s'érode visuellement quand la vie baisse (pixels qui rongent les boutons, instabilité croissante de l'écran).
- **Combat** : pas de système séparé, pas de PV monstre, pas de tour par tour. Une séquence de 1 à 3 scènes de choix+dé comme le reste du jeu. La difficulté s'exprime via le seuil des jets, jamais via une jauge à vider.
- **Temps** : un seul repère visible, "Jour X". Avance uniquement aux points de campement (jamais en temps réel, jamais à chaque scène). Le camp sert aussi de sauvegarde et atténue les blessures légères.
- **Menu** : un seul losange, toujours à la même position sur tous les écrans. Ouvre un écran plein cadre (jamais une popup) : Options, Reliques, Besace, Miroir de l'âme (si mode détail stats actif).

## Le Geôlier (démon central)

- Archétype Jailer-Judge : transactionnel, amusé par les échecs du joueur, voit les héros comme un divertissement.
- Observe **tous** les héros de **tous** les joueurs simultanément — pas une relation 1:1.
- Commente rarement, un peu plus qu'un strict minimum : déclenché par des moments précis (échec/réussite critique, mort, jalon de relique) + occasionnellement au hasard, pour rester imprévisible. Toujours visuellement distinct de la narration (couleur d'accent, jamais la couleur de texte normale).
- Peut réciter des statistiques agrégées comme dialogue ("Douze mille avant toi ont poussé cette porte...") plutôt que les afficher froidement en UI.
- Le twist "Prisonnier" (le Geôlier comme masque) est **v2**, pas une priorité actuelle.

## Illustrations

- Pas de génération IA en direct par scène. Bibliothèque d'assets **pré-faits**, tramés en amont.
- L'image ne change que sur vrai changement d'environnement ou événement clé (monstre, objet, moment fort) — reste statique sinon.

---

## ⚠️ DIRECTION ARTISTIQUE — mise à jour importante

**La palette a changé. L'ancienne trichromie Nuit/Brique/Sable est obsolète comme accent visuel.**

| Rôle | Ancienne DA (obsolète) | **DA actuelle (à utiliser partout)** |
|---|---|---|
| Fond | `#211e33` (nuit) | **`#1c1a16`** (charbon, quasi-noir) |
| Accent (stats, Geôlier, tramage) | `#d8a25f` (sable) | **`#e0632a`** (orange) |
| Danger | `#ac2e26` (brique) | fusionné avec l'orange d'accent, à ne plus dupliquer |

**Si tu vois `#d8a25f`, `#ac2e26`, ou `#211e33` n'importe où dans le code (variables CSS, valeurs codées en dur, canvas 2D pour les textures du dé, matériaux Three.js) : ce sont des restes de l'ancienne DA. Remplace-les systématiquement.**

Pièges fréquents constatés (Claude Code retombe dessus) :
- Une variable CSS renommée mais une valeur laissée en dur ailleurs (ex : texture canvas du dé qui référence encore `#d8a25f` au lieu de `#e0632a`).
- Copier-coller d'un composant plus ancien qui traînait encore l'ancienne palette.
- **Vérifie par grep** (`grep -rn "d8a25f\|ac2e26\|211e33" .`) avant de considérer une passe DA terminée.

Specs du générateur de dithering (pour tout ce qui est tramé, illustrations comme UI) :
- Palette : Charbon `#1c1a16` (fond) / Orange `#e0632a` (trait)
- Style : Floyd-Steinberg (organique) — pas de damier Bayer pour les illustrations photo
- Taille de pixel : 1
- Seuil clair/sombre : 182
- Contraste : 151%
- Pas d'inversion

Typographie inchangée : `Jacquard 12` (titres, verdicts) + `VT323` (tout le reste).

---

## Le dé 3D — ce qui marche déjà, ne pas réinventer

Un prototype fonctionnel existe (testé et validé) avec Three.js. Points techniques à reprendre tels quels :

**Geste tactile façon Pokémon Go** :
- Il faut toucher le dé lui-même (rayon de tolérance ~60px autour de son centre), pas une zone autour.
- Vélocité du lancer calculée sur les mouvements des **~110 dernières ms** avant relâchement (pas toute la durée du drag) — sinon un geste qui ralentit avant de lâcher donne un lancer mou alors que le joueur a "senti" un lancer franc.
- Si relâché sans élan suffisant (vélocité sous un seuil bas), le dé **reste posé**, pas de lancer accidentel.

**Rebonds contre les bords — c'est ce que Patrick a préféré dans ma version, à repartir de là** :
```js
function onBounce() {
  if (navigator.vibrate) navigator.vibrate(12); // haptique proportionnel à l'impact, pas fixe si possible
  angVel.x = -vel.y * 0.01 + (Math.random()-0.5)*0.02; // la rotation change de sens en fonction du rebond
  angVel.y = vel.x * 0.01 + (Math.random()-0.5)*0.02;  // + un petit bruit aléatoire pour éviter un rebond mécanique
}
```
Le point clé du "choc" qui a plu : ce n'est **pas** juste une inversion de vélocité (`vel.x *= -BOUNCE`) — c'est le fait que la **rotation angulaire change aussi** au moment de l'impact, couplée à la vitesse linéaire du rebond. Un rebond qui inverse juste la position sans perturber la rotation a l'air raide et mécanique. Ajouter aussi, si pas déjà fait :
- Un léger squash/stretch de l'échelle du mesh au moment de l'impact (ex. scale 0.85 sur l'axe de l'impact puis retour élastique sur 2-3 frames) pour vendre le choc visuellement, pas seulement physiquement.
- La restitution (`BOUNCE`, ~0.72) doit légèrement varier avec la violence du choc plutôt qu'être une constante pure, sinon les rebonds successifs ont l'air identiques.

**Rendu** : Three.js en vraie 3D mais rendu sur un canvas **basse résolution puis upscalé** (`image-rendering: pixelated`, facteur ~5) pour rester dans l'esthétique pixel-art malgré la vraie géométrie 3D. Ne pas essayer de pixelliser via un shader — le sous-échantillonnage + upscale CSS suffit et coûte beaucoup moins cher.

**Cycle de vie** : idle (flotte doucement au repos) → held (suit le doigt) → flying (physique de rebonds) → settling (ease vers le centre, la face gagnante s'aligne lentement — c'est le moment de tension) → revealed (verdict, puis retour à idle).

**Armement** : le dé n'est saisissable QUE quand un choix risqué vient d'être tapé (état "armé"). Le hint sous le dé passe de vide à `"Lance le dé — [Stat]"` en couleur d'accent (orange, pas sable) à ce moment-là.

---

## ⚠️ CTA / choix — bug de variété constaté

**Problème observé** : les 3 slots de choix ont toujours le même rôle scène après scène — le 3e est systématiquement verrouillé, celui du milieu est systématiquement neutre (sans dé). C'est un bug de logique de génération, pas un choix de design : **la position à l'écran ne doit jamais prédire le type de choix.**

Corrige en randomisant l'assignation **avant** de peupler les slots visuels :
```js
function assignerTypesAuxSlots(choix) {
  // 1. Mélanger l'ordre des choix eux-mêmes (Fisher-Yates), pas juste leur contenu
  for (let i = choix.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choix[i], choix[j]] = [choix[j], choix[i]];
  }
  return choix;
}
```
Et surtout : la génération de la scène elle-même doit tirer au hasard **combien** de choix sont verrouillés (0, 1, jamais plus de 1 par scène pour rester jouable) et **combien** sont neutres (rare — la plupart des scènes n'ont aucun choix neutre, un choix neutre systématique appauvrit la tension). Le risqué doit être le cas par défaut le plus fréquent, pas une variante parmi d'autres à fréquence égale.

Vérifie après génération de plusieurs scènes de suite (log ou test manuel sur ~15 scènes) qu'aucun pattern de position ne se répète.

---

## Illustrations — sourcing depuis Google Drive

Le dossier Drive **"2. Sauvegardé"** contient les illustrations validées et prêtes à l'emploi (déjà tramées Charbon/Orange). Utilise-les pour varier l'image en haut de chaque scène, adaptée au contexte plutôt qu'une image fixe.

**⚠️ État actuel du dossier** : la plupart des fichiers sont nommés génériquement (`dithering-aldenhar (23).png`, etc.) sans tag de contexte — seul un fichier suit la convention propre (`monstre_geryon.png`). Deux options :
1. **Renommer les fichiers existants** dans Drive avec le préfixe de contexte avant de les intégrer (convention ci-dessous).
2. **Demander à Patrick** de valider/renommer au fur et à mesure des prochains lots (déjà en cours côté Claude Chat).

**Convention de nommage à adopter pour tout nouvel asset** : `{categorie}_{sujet}.png`
- `scene_*` → environnements (corridor, chambre, cave, forêt, ruines, pont...)
- `monstre_*` → créatures/adversaires
- `objet_*` → objets clés, reliques, coffres

**Logique de sélection recommandée** : matcher le tag de catégorie de la scène en cours (ex. scène de combat → chercher un `monstre_*`, scène d'exploration → chercher un `scene_*` du bon lieu si possible, sinon un `scene_*` générique) plutôt que de piocher au hasard dans tout le dossier. Si aucun match exact, fallback sur la catégorie large plutôt que sur une image hors-sujet (jamais un `monstre_*` sur une scène de repos, par exemple).

---

## Outils & stack

- Prototypage : Claude Code Desktop, HTML/JS/Three.js
- Design : Figma (MCP connecté à Claude Chat)
- Docs : Notion (MCP connecté)
- Design system in-game : trichromie devenue duotone Charbon/Orange (voir plus haut) + Jacquard 12/VT323
- Design system marketing/landing (séparé, ne pas mélanger) : système "Dispatch" — Inter + Space Mono + Fraunces, charcoal/cream/orange
- Base44 explicitement écarté (vendor lock-in, pas de code custom)

---

## Notes de session (à compléter par Claude Code au fil de l'eau)

_Ajouter ici les décisions prises en session Claude Code qui ne remontent pas automatiquement à Claude Chat — ce fichier est le seul pont entre les deux environnements._

### Session 2026-07-11 (Claude Code)
- Passe DA duotone appliquée : bloc `theme-brief` et tokens sable/nuit/brique supprimés de `aldenhar/app/globals.css` (grep vérifié propre sur les sources). Flash de critique 20 = blanc (ink), critique 1 = orange accent.
- Rebonds du dé : rotation recouplée à la vitesse linéaire du rebond (`angVel = f(vel) + bruit`) conformément au snippet validé, en plus du squash/éclat/secousse déjà en place.
- Dé armé : hint « Lance le dé — [STAT] » en orange accent ; verdict « Touche pour continuer » en blanc.
- Bug de variété CTA corrigé : compositions par scène variées (risqué = défaut, 15 risqués / 5 verrouillés / 3 neutres sur 8 scènes, jamais >1 verrouillé) + Fisher-Yates seedé par le pas de progression. La scène 0 garde l'ordre exact de la frame Figma 124:2885.
- Écarts assumés avec ce fichier (Figma = source de vérité pour les écrans reproduits) : typo écran en Roboto Mono (le Figma actuel ne montre pas VT323 hors dé/verdicts stylés), menu = grille 3×3 (pas losange), PIXEL_FACTOR du dé = 2.4 (valeur du fichier de référence validé, pas ~5). À trancher côté design si besoin.
- Illustrations Drive : dossier « 2. Sauvegardé » lu (25 png). Transfert binaire via connecteur trop coûteux → champ `illustration` ajouté par scène dans `lib/scene-data.ts` (fallback portail). Reste à déposer les png renommés `{categorie}_{sujet}.png` dans `aldenhar/public/assets/` (commit direct ou upload en session).
- Spec Notion (« Spec fonctionnelle — pour Claude Code ») appliquée : dé flottant en permanence (armé au tap d'un choix risqué, §4) ; états narratifs temporaires AGUERRI +2 / ENTAILLÉ −2 sur 3 scènes, critiques sur le dé naturel, état affiché en mot dans le hint (§2) ; santé invisible avec érosion UI à 2 paliers + instabilité d'écran (§5) ; scène campement dans la rotation — dormir avance « Jour X », soigne +0.35 et purge les états négatifs (§7) ; brique #ac2e26 réintroduite comme --color-drama, réservée à FUNESTE et au flash du 1 naturel (§13 Notion, en contradiction avec la ligne « brique obsolète » plus haut — le Notion étant plus récent, il prime).
