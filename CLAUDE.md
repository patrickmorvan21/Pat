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
- Retouches Patrick (11/07 soir) : en-tête réduit à « ALDENHAR — J X » (numéral de chapitre supprimé, jour en opacité pleine) ; onde d'impact affinée à un filet 1-2px ; le dé n'apparaît qu'au clic d'un choix risqué (décision Patrick, remplace le « flotte en permanence » de la spec §4 Notion) ; PIXEL_FACTOR abaissé 2.4 → 1.6 pour un dé plus net.
- Mise à jour Notion 11/07 (§16, structurante) appliquée : le modèle « un écran plein par scène » est remplacé partout par un **flux scrollable unique** façon transcript (`components/Scene.tsx` réécrit) — historique complet jamais déchargé, choix ancrés en bas, action choisie affichée avant sa conséquence, texte tapé lettre par lettre (~15ms narration / ~22ms Geôlier) avec révélation séquentielle (un bloc de texte à la fois, pas tous en même temps), interruptible par tap. Le fil complet est persisté dans `localStorage` (`RunState.feed`) pour que la reprise de run restaure le scrollback exact sans réanimer l'historique déjà lu.
- Bug de course résolu en session : le tap qui dismiss l'écran de résultat du dé tombe presque toujours aussi dans la zone scrollable du dessous, incrémentant par erreur le compteur global « skip » avant même que la nouvelle entrée n'existe. Corrigé à deux niveaux : (1) le fil ne capte plus les taps tant que `rolling` est vrai (`pointer-events-none`), (2) chaque `TypedText` ignore les valeurs de `skip` antérieures à son propre montage (`baseSkipRef`). Deuxième bug découvert dans la foulée : les entrées narration/Geôlier encore en attente dans la file de révélation séquentielle s'affichaient déjà en entier au montage au lieu de rester invisibles — corrigé via un `revealedIds` distinct de `activeTypingId` (un bloc pas encore atteint dans la file ne rend rien).
- Santé (spec §5, précisée 11/07) : 4 paliers discrets implémentés (Intact / Marqué / Entaillé / Au seuil) avec seuils 0.75 / 0.5 / 0.25. Au palier critique, tous les pixels de l'écran vibrent brièvement toutes les 10s (`critical-vibrate`) en plus de l'érosion dense des CTA (densité ÷4 approx., bites jusqu'à 9px de jitter).
- Reste à faire, en attente d'éléments de Patrick :
  - **Mini-jeux tactiles** (frotter/tracer un glyphe/retenir son souffle/crochetage) : le fichier `prototypes_aldenhar.html` référencé dans le Notion n'a pas encore été fourni dans une session Claude Code — demandé à Patrick, à intégrer dès réception (ne pas réinventer les interactions déjà validées, même logique que pour le dé).
  - **Pipeline de dithering des illustrations** (Floyd-Steinberg, seuil 182, contraste 151% pivot 128, MAXDIM 1170) : specs verrouillées dans le Notion mais pas de nouvelles images sources à traiter pour l'instant — le champ `illustration` par scène est prêt à recevoir des assets `{categorie}_{sujet}.png`.
  - **Campement** : décision de design en attente côté Patrick (repos = soin complet vs. cicatrices persistantes vs. jet de nuit risqué) — comportement actuel (soin partiel +0.35, purge des états négatifs) laissé tel quel en attendant l'arbitrage.
  - Lore environnemental, PNJ/compagnons/trahison, éléments de surprise (choix qui expire, retour au lieu de mort, fausse mort) : design validé côté Notion mais pas encore de contenu écrit dans `lib/scene-data.ts` — prochaine étape de contenu, pas de blocage technique.
- Mini-jeux & Surprises (Notion « Mini-jeux & Surprises — catalogue pour Claude Code », 11/07/2026) : les 25 mini-jeux validés (4 références + 21 additionnels) implémentés via 12 moteurs canvas/pointer partagés (`components/minigames/engines/*` : RubReveal, GlyphTrace, HoldSteady, TimingTap, DialAlign, RhythmTap, PickTarget, SlowSwipe, SequenceExecute, StraightSwipe, SteadyCaress, SingleGesture) — plusieurs entrées du catalogue partagent explicitement le même moteur (ex. tracé miroir/fil d'Ariane/nœud du pendu = GlyphTrace, cf. spec "même moteur que Glyphe"), donc la mutualisation suit l'intention du design, pas un raccourci. Catalogue complet dans `lib/minigames-data.ts` (25 entrées) et `lib/surprises-data.ts` (11 surprises).
- Galerie de revue à `/minijeux` (2e route Next dans la même app) : chaque mini-jeu est rejouable avec un sélecteur de palier de stat (bas/moyen/haut) pour visualiser "la stat module la difficulté" ; les 11 surprises ont chacune une prévisualisation (érosion de choix, fausse mort, menace du jour, choix fantôme, pluie de cendres interactive, ou mock textuel pour les surprises purement narratives comme Le retour/Le marchand mort/etc.).
- Portée assumée pour cette passe (galerie de REVUE, pas intégration finale) : les mini-jeux/surprises ne sont pas encore câblés dans la rotation infinie de `lib/scene-data.ts` — c'est la prochaine étape une fois que Patrick a donné son feedback sur la galerie (comme pour le Crochetage, déjà élu "meilleur du lot" avant même la galerie). `prototypes_aldenhar.html` (référence originale des 4 mini-jeux fondateurs) toujours pas reçu dans une session Claude Code — les 4 références ont été implémentées depuis les descriptions textuelles détaillées du Notion (corrections du 11/07 incluses : progression séquentielle stricte du glyphe, suie orange/texte crème du frottage, fenêtre Ruse du crochetage) ; à réconcilier avec le fichier si Patrick le fournit.
- Bug trouvé en testant la galerie : Crochetage (mode "track", curseur oscillant) échouait au premier tap manqué (maxAttempts par défaut = 1, hérité du mode "point" à essais limités) alors que la nature oscillante du curseur appelle plusieurs essais naturels — corrigé avec `maxAttempts: 3` dans sa config catalogue.

### Session 2026-07-11 (suite, Claude Code) — retours Figma + demande de « plus de fond »
- Narration enrichie (`lib/scene-data.ts`) : `Scene.narration` passe de `string` à `string[]` (2-3 paragraphes courts par scène, toutes les 9 scènes réécrites) ; `Scene.tsx` pousse un `FeedEntry` narration par paragraphe au lieu d'un seul bloc, gardant la révélation séquentielle beat par beat.
- Fréquence du Geôlier fortement réduite (retour Patrick : « il arrive trop souvent ») : critiques (jet naturel 1 ou 20) le déclenchent toujours (nouveau pool `JAILER_TAUNTS_CRITSUCCESS` pour le 20 nat), sinon ~12% de chance par scène (contre ~34% avant) — plus du tout systématique sur échec normal. Bannière du Geôlier agrandie (min-height 128px, icône 116×136 qui déborde à gauche) pour matcher le redesign Figma (node 1909-794) ; les nouvelles citations de Patrick pour ce redesign n'ont pas encore été fournies texte par texte — pool de citations existant conservé en attendant.
- Illustrations d'ambiance : `advance()` insère occasionnellement (~25% de chance) une illustration même sans changement de contexte/lieu, en plus du changement systématique sur nouveau lieu — utilise la photo de Patrick (`assets/dithering-portal.jpg`) en placeholder comme demandé (Figma node 1909-454), pas encore remplacée par de vrais assets contextuels.
- CTA masqués pendant la lecture (Figma 1909-454) : au clic d'un choix, `choicesHidden` passe à `true` (fade + translateY 10px via `.choices-bar.choices-hidden` dans `globals.css`, transition en escalier `steps(4)` pour rester dans l'esthétique pixel), CTA remasqués tant que la file de révélation séquentielle n'est pas vide, réapparaissent (`choicesHidden=false`) uniquement quand toute la narration/Geôlier de la scène suivante a fini de s'afficher.
- Passe réalisme sur 5 mini-jeux (demande explicite : ne traiter que ces 5, attendre validation Patrick avant les 20 restants) :
  - **Frotter l'écran** (`RubReveal.tsx`) : tablette de pierre avec cadre rongé (`erodedRectPath`), grain de fond stable (pré-rendu une fois dans un canvas offscreen, plus de scintillement à chaque frame), fissures fixes, inscription révélée en `Jacquard 12` (plus VT323), vignette aux 4 coins, anneau de curseur pendant le frottage.
  - **Tracer un glyphe** (`GlyphTrace.tsx`) : disque-sigil avec halo tramé pulsé, cadre à 32 crans, runes décoratives éparses, points du tracé en croix gravée plutôt qu'un carré plein, ligne tracée qui pulse légèrement.
  - **Retenir son souffle** (`HoldSteady.tsx`) : silhouette de créature qui dérive lentement à travers l'écran pendant l'appui (remplace l'anneau de progression abstrait), jauge de souffle en demi-arc, la créature tourne la tête (« alarmée ») + léger flash tramé plein écran aux moments de graze.
  - **Crochetage** (`TimingTap.tsx`, mode "track" uniquement) : mécanisme de serrure à goupilles — pivot en bas façon trou de serrure, bras du crochet qui pivote en éventail, goupilles (tumblers) en trait qui s'illuminent près de la fenêtre cible, fenêtre de réussite en lueur tramée sur l'arc plutôt qu'un rectangle plein. Modes "release" et "point" (Piège à mâchoire / Sceau de cire, partagent le fichier) volontairement laissés simples — hors scope des 5.
  - **Le cadran runique** (`DialAlign.tsx`) : plaque de montage gravée, lunette fixe à 24 crans, runes = glyphes anguleux à 3 traits (pas de simples carrés), poignée de préhension qui tourne avec le geste (ligne + moyeu + poignée qui s'allume en orange pendant qu'on tourne).
  - Deux helpers ajoutés à `lib/dither.ts` pour supporter ces rendus : `bayerFillClipped` (trame Bayer confinée à un chemin/clip quelconque — cercle, anneau, arc) et `noiseSpecks` (bruit de texture stable, tiré une fois puis mis en cache, jamais régénéré par frame).
  - Vérifié en Playwright headless (drag simulé sur chacun des 5 canvases, capture d'écran) : aucune erreur JS, les 5 rendus s'affichent et réagissent à l'interaction sans régression sur la logique de score/échec sous-jacente.
- **En attente de Patrick avant de continuer** : validation des 5 mini-jeux repensés avant de décliner le même traitement « réalisme » aux 20 autres du catalogue ; citations texte du Geôlier redessiné (Figma 1909-794) ; assets d'illustration contextuels pour remplacer le placeholder photo dans le flux de scènes.

### Session 2026-07-11 (suite #3, Claude Code) — retours sur le dernier déploiement + premier combat
- CTA : réapparition passée d'un pop par paliers (`steps(4)`) à un vrai fondu (`ease-out`, 0.4s) suite au retour « je veux que ça apparaisse en fade » ; la disparition reste rapide et discrète (`ease-in`, 0.15s). `.choices-bar` dans `globals.css`.
- Bug corrigé sur le bandeau du Geôlier : le portrait (`position: absolute`, sans z-index) passait visuellement au-dessus du texte (`<p>` statique) et rognait le début des lignes qui chevauchaient sa zone — z-index explicite ajouté (`.jailer-portrait z-0` / texte `relative z-[1]`) pour garantir le texte toujours au-dessus, comme demandé.
- Dégradé de pixels manquant sur le portrait ajouté : nouveau helper `ditherFadeMaskDataUrl()` dans `lib/dither.ts` (masque alpha tramé Bayer, généré une fois côté client via canvas, mis en cache au niveau module) appliqué en `mask-image` CSS sur l'image — le bord droit/bas du portrait se dissout en pixels épars plutôt qu'un cadre net, conforme à la règle « pas de dégradé CSS lisse » (§11 Notion). Scintille (`mask-position` en `steps(2)`) tant que la citation est en cours de frappe (`typed=true`), se fige net dès qu'elle est terminée.
- Vérifié que l'action choisie (`kind: "chosen"`) était déjà à `opacity-50` dans le code existant (différenciation des descriptions) — rien à changer, déjà conforme à la demande.
- **Premières rencontres de combat implémentées** (spec §6, jusque-là seulement théorique dans le code) : deux rencontres ajoutées à la rotation de `lib/scene-data.ts` — une meute de limiers sur 2 scènes chaînées (`tunnel-embuscade` → `tunnel-affrontement`, insérées après le pont d'os) et Geryon en rencontre unique plus difficile (seuil 13-14, insérée après la cage). Nouveau champ `Scene.combat?: boolean` — purement un marqueur, aucune mécanique séparée (pas de PV, pas de tour par tour, mêmes choix+dé que le reste du jeu). À la résolution d'un jet non-critique sur une scène de combat, un état temporaire est appliqué : AGUERRI (+2, 3 scènes) en victoire, nouveau ÉBRANLÉ (-1, 2 scènes, ajouté à `NarrativeEffect` dans `lib/state.ts`) en échec — distinct des états liés aux jets critiques (qui continuent de s'appliquer indépendamment). Vérifié en Playwright : progression jusqu'à la meute, résolution du jet, effet AGUERRI bien affiché sur le hint du jet suivant (« Lance le dé — INSTINCT · AGUERRI »).
- Pas d'asset `monstre_*` disponible localement (dossier Drive jamais déposé dans `public/assets/`) — les scènes de combat retombent sur le placeholder portail comme toutes les autres scènes pour l'instant.

### Session 2026-07-12 (Claude Code, opus) — synchro Notion §17/§18/§19
Trois nouvelles sections structurantes ajoutées au Notion (sessions 2/3/4 de Claude Chat) implémentées d'un bloc. Décision d'architecture (recommandée explicitement au §19) : **centraliser tout ce qui survit à la mort du héros dans `lib/player-memory.ts`** — structure persistante attachée au COMPTE (localStorage `aldenhar-player`), distincte de `RunState` (`aldenhar-run`) et des reliques. Évite les flags épars dupliqués entre Registre / dette de sang / persistance environnementale / saisons.
- **Saisons du Geôlier (§17)** : `jailerPosture(mem)` renvoie 3 paliers discrets (Amusé / Intéressé / Respectueux) selon `runsStarted`, `bestDays`, moyenne de survie, reliques rares — jamais un score affiché. `JAILER_BY_POSTURE` fournit 3 pools de taunts critiques par posture ; `jailerTaunt(result, posture)` pioche dans le bon. Wiré dans `advance()`. `bestDays` mis à jour au campement, `runsStarted` au seed d'une run neuve.
- **Persistance environnementale (§17)** : `Choice.setsEnvFlag` pose un flag compte (ex. `porte-balafree-defoncee` sur « Pousser la porte balafrée »). Au seed d'une run neuve, si le flag est présent, un paragraphe de trace est ajouté à la narration d'ouverture (« le bois éclaté n'a pas repoussé »). Vérifié Playwright.
- **Prix différé (§17)** : `Choice.debt` (`{id, settleInSteps, text}`) pose une dette silencieuse sur un choix « gratuit » (ex. « Longer le mur, sans toucher »), stockée dans `RunState.debts`, réglée `settleInSteps` scènes plus loin dans `advance()` (insérée comme narration, rétrospectivement lisible). Vérifié Playwright (le règlement apparaît bien plus loin dans le fil).
- **La main qui hésite (§18)** : `RollRequest.highStakes` (posé via `Choice.risky.highStakes`, ex. charge sur Geryon, bond sous l'éboulement) → dans `Die3D`, la phase `settling` s'allonge (finishAt 1.7→2.6) et ajoute une micro-oscillation + secousse d'échelle décroissante avant l'arrêt. **Purement visuel, ne touche jamais `result`** (déjà tiré). 
- **La scène qui se résout sans toi (§18)** : `Scene.timed` (`{ms, timeoutNarration, timeoutChoices}`). Scène `eboulement` ajoutée. Compte à rebours VISUEL (`.timed-countdown`, jauge qui se vide en `steps()` + pulse, jamais de chiffre) armé seulement quand les choix sont réellement jouables. À expiration : `onTimedExpire` insère la narration d'inaction et **bascule vers `timeoutChoices`** (l'inaction ouvre de nouvelles options, pas un échec sec). Vérifié Playwright.
- **Le faux choix évident (§18)** : implémenté comme **contenu** (scène `porte-7e` : l'inscription invite explicitement à frapper — option « évidente » — dont l'échec est le plus retors), volontairement pas une mécanique détectable (sinon l'effet s'inverse, cf. Notion). Documenté en commentaire.
- **Le silence comme vraie option (§19)** : nouveau type `Choice.passive` (`{consequence}`) à côté de risqué/verrouillé/repos — résolution instantanée sans dé, avec une conséquence dédiée (ex. « Écouter, immobile » sur la scène d'ouverture, « Quitter la salle sans lire » au Registre). Vérifié Playwright.
- **Le Grand Registre (§19)** : `Scene.registre` + scène `grand-registre`. Nouveau `FeedEntry` `registre` rendu inline (`.registre` dans `globals.css`) — classement défilant des héros par jours de survie, la ligne du joueur (nom de run + jour courant) insérée et marquée en accent (`.is-player`). Données locales (`buildRegistre` : héros de fond figés + héros tombés du joueur + ligne en cours) **en attendant l'endpoint agrégé réel** (même besoin d'infra que « le fantôme de passage »). Nom de héros par run ajouté à `RunState.heroName` (+ `randomHeroName()`). Vérifié Playwright.
- **La dette de sang (§19)** : `Scene.foe` (identité stable de l'adversaire). Un 1 naturel en combat enregistre une `BloodDebt` au compte (stand-in du vrai flux de mort, pas encore construit) ; si ce même `foe` réapparaît et qu'une dette existe, une ligne de reconnaissance est insérée avant la scène. Fondation posée, reconnaissance câblée dans `advance()`.
- **Laissé en attente** : **Le Pacte à la marge (§19)** dépend du système de reliques/inventaire (pas encore construit côté proto, écrans en cours de design par Patrick) — la fondation `player-memory` (`relicsRare`) est prête à l'accueillir. Le vrai **flux de mort** (écran de fin, forge de relique, inscription au Registre, enregistrement de la dette de sang « propre ») reste à construire — actuellement la santé plafonne à 0.05 sans jamais tuer ; la dette de sang utilise le 1 naturel en combat comme déclencheur provisoire.
- Vérifié en Playwright headless (localStorage réinitialisé entre cas) : registre, scène chronométrée + bascule d'options, prix différé, choix passif, persistance environnementale — tous fonctionnels, aucune erreur JS. Lint + build propres. Déployé sur les deux routes.

### Session 2026-07-14 (Claude Code, fable) — journal Notion 13/07 + Figma 221:197 + correctifs Patrick
Le Notion a maintenant une section « 📋 Journal des mises à jour » append-only en bas de la spec — à relire en priorité à chaque synchro. Tout le lot du 13/07 est implémenté :
- **Résolution graduée à 5 paliers** (remplace le binaire partout) : `resolveTier()` dans `lib/scene-data.ts` — marge ≥5 = Éclatante, ≥2 = Réussite, ≥0 = De justesse (coût léger −0.06), >−5 = Échec (−0.12), sinon Critique (−0.2) ; nat 20 = Destin, nat 1 = Malédiction (−0.25). Prose : les paliers intermédiaires réutilisent les 4 textes écrits (le mot de verdict + le visuel portent la nuance). Animations par palier dans `Die3D` : halo TRAMÉ (data-URL Bayer radial, jamais un dégradé CSS) intense/franc/sobre, face TERNE sans surbrillance sur les échecs, vacillement orange/charbon « de justesse » (face + mot), flash brique→noir en critique, variante plus sombre en Malédiction, ralenti au settle du Destin. **Destin = récompense Besace rare/légendaire, jamais une Relique** (`randomRecompenseDestin`).
- **Écran de mort + permadeath réel** (`components/DeathScreen.tsx`) : santé plancher passée de 0.05 à 0 — à 0 sur palier d'échec, mort. Séquence : dé brisé (pictogramme 2D tramé, deux moitiés qui dérivent — la « vraie » fracture 3D est notée à affiner) → épitaphe Jacquard = LA PROSE EXACTE du jet fatal (suffixe ♦ retiré) → dissolution convergente 4 bords→centre (canvas) → « Jour X · N rencontres survécues » → CTA relique → cristallisation (70% commune / 25% rare / 5% légendaire, pools de noms dans `player-memory.ts`) → « Accepter et recommencer » (location.reload). `recordDeath()` s'exécute AU MOMENT de la mort (Registre, dette de sang réelle — l'ancien déclencheur provisoire nat-1 est retiré —, deaths/totalDays/bestDays, relique) et la run est réinitialisée immédiatement : fermer l'app pendant l'écran ne ressuscite jamais.
- **Besace** (`lib/besace.ts`, séparée des Reliques) : départ = dague simple fixe, 4 emplacements, tags de rareté en mot. Soin aléatoire en exploration (~22% des scènes hors combat/registre/campement, si place) → bandeau tramé « OBTENU — … » inline (`kind: "obtenu"`), jamais de popup. Vidée à la mort. Pas encore d'écran d'inventaire (maquettes Patrick en cours) — la consommation du soin est auto au campement en attendant.
- **Blessure persistante (précise §5)** : échec en combat = ENTAILLÉ `scenesLeft: 999` (ne se dissipe plus tout seul) ; le campement l'ATTÉNUE (−2 → −1) au lieu de le purger ; un soin de Besace le referme complètement (consommé au camp, avec ligne de narration). ÉBRANLÉ supprimé (remplacé par ce système).
- **Combat épique (amende §6)** : durée par poids narratif — Rôdeur = anecdotique (1 scène), meute = sérieux (2), **Geryon = épique en 3 scènes** (`geryon` montée avec choix « Jauger la bête » [Instinct, l'info est la récompense] → `geryon-2` échange, paliers en prose « chancelle »/« rugit, blessée » → `geryon-3` climax « s'effondre »). Un seul dé, jamais de PV.
- **Correctifs UI Patrick (13/07)** : (1) opacité 50% des actions choisies — le VRAI bug était `fadeup`/`fill both` qui figeait `opacity:1` par-dessus la classe ; corrigé via `--enter-opacity` dans le keyframe (appliqué aussi à la puce Jour). (2) Bande de dissolution en bas des illustrations : la PJ `bande_dissolution_haut.svg` n'est PAS arrivée dans la session (Gmail token expiré, rien sur disque) → régénérée procéduralement (1170×260, pixels épars, seed stable) sous le même nom dans `public/assets/` — À REMPLACER par l'original de Patrick si le rendu diffère ; appliquée en `scaleY(-1)`, 42px (cf. Figma 228:33149). (3) Bloc Geôlier redessiné (Figma 239:49164) : 87px, portrait 101×119 débordant haut/gauche, franges de pixels 9px (`frange_geolier.svg`, généré) sur bords haut/bas qui SCINTILLENT pendant la frappe de la citation seulement (`.jailer-speaking`), figées après. Le mp4 de référence du Geôlier qui parle n'a toujours pas été transmis — premier essai selon le principe, à affiner à réception.
- **Mise en page rencontre (Figma 221:197)** : bannière sans cadre (tag ✦ RENCONTRE ✦ + nom en Jacquard 27px orange, centrés) placée AVANT l'illustration ; en-tête « Aldenhar — [chapitre romain] » à gauche (chapterLabel) + menu à droite.
- Vérifié en Playwright : opacité chosen = 0.5 calculée, bande présente, bannière rencontre, DESTIN (verdict + halo + Obtenu), franges Geôlier, séquence de mort complète (épitaphe → chiffres → relique → nouvelle run à step 0/santé 1, mémoire deaths/fallen/relics incrémentée). Lint + build propres, déployé sur les deux routes.
- **Différé / en attente** : compagnon persistant via Destin social (contenu, dépend des rencontres sociales pas encore écrites) ; généralisation du système de rencontre au social (« Jauger »→« Lire ») — le modèle de données le permet déjà, contenu à écrire ; tutoriel diégétique du prologue (pas encore de prologue) ; fracture 3D réelle du dé à la mort ; mp4 du Geôlier ; SVG original de la bande de dissolution.

### Session 2026-07-14 (suite, Claude Code, fable) — retours de playtest Patrick (message + 3 PJ images)
- ⚠️ **Les 3 PJ (portrait démon HD, frange, bande de dissolution) ne sont PAS arrivées sur le disque de la session** (visibles dans le message, aucun octet déposé ; Gmail token expiré). Rapprochement procédural fait pour frange (grappes massives 3px, `frange_geolier.svg` v2, 12px) et bande (plateau dense 26%, courbe adoucie). **Pour brancher les originaux : les déposer tels quels dans `aldenhar/public/assets/` sous `frange_geolier.svg`, `bande_dissolution_haut.svg`, et le portrait sous `dithering-demon.jpg` (ou nouveau nom + maj `Scene.tsx`) — aucun code à changer si mêmes noms.**
- Timer de scène chronométrée : **minimum 6 secondes** (règle actée, éboulement 2200→6000ms, commentaire de garde dans le type `Scene.timed`).
- **État KO** (santé au palier critique) : bites des CTA ×~1.7 (95, jusqu'à 12px de jitter, 75% scintillants), nappe plein écran de pixels morts charbon + braises orange (`getDecayOverlay()`, data-URL en cache module, `.decay-overlay` opacity ~0.5 en flicker steps), textes de narration qui tremblent (`.erosion-3 .feed-narration`, keyframes `ko-tremble`). Lisibilité conservée.
- Rencontres : **illustration systématique** sur toute scène de combat (plus de tirage 25%) ; titre de rencontre en **Instrument Serif** (ajouté au link Google Fonts de `layout.tsx` — c'était la vraie typo du Figma, pas Jacquard).
- **Web/scroll** (« je dois sans cesse scroller ») : double cause corrigée — (1) le cadre 390×800 débordait des viewports < 800px → `max-h-[100dvh]` + ancrages `bottom:` pour `.die-hint`/`.die-verdict`/`.die-halo` (le dé se positionnait déjà depuis le bas) ; (2) pendant la frappe, le texte poussait sous la ligne de flottaison → intervalle de suivi du bas du fil (160ms, scroll `auto`) tant qu'un bloc tape.
- **Plus AUCUN rouge dans le jeu** (retour explicite, remplace le « brique réservée à FUNESTE » du 11/07) : `--color-drama` → `#ffffff` et `DRAMA` (lib/dither) → blanc. FUNESTE/MALÉDICTION en blanc, flashs critiques blanc→noir. La brique #ac2e26 est bannie partout, galerie mini-jeux comprise.
- **Butin du Destin cohérent** : `randomRecompenseDestin(allowArme)` — arme seulement si scène de combat ET jet de COURAGE (fuir un Rôdeur avec un 20 ne forge pas de lame) ; sinon babiole/soin.
- **Cohérence narrative** : règle éditoriale — le DERNIER acte d'une rencontre doit CLORE le combat dans chacune de ses issues (réécrits : les 12 outcomes de `tunnel-affrontement` — la meute détale/reflue/prend son tribut et disparaît —, les issues ouvertes du Rôdeur et de `geryon-3`). Ponts d'environnement ajoutés aux ouvertures (salle ronde→couloir du Rôdeur→escalier→éboulement→rivière→tunnels→camp ; arche morte→hall des échos→table). Lore créature-lieu : limiers = chiens des premières expéditions restés à attendre, l'arche = tanière couchée par Geryon, le Rôdeur = ancien héros nourri par les couloirs. Les scènes 1 d'une chaîne (embuscade, geryon 1-2) restent volontairement OUVERTES.
- Micro-fix : libellés de CTA longs tronqués en ellipse avant le tag de stat (`max-w-[68%]`).
- Vérifié en Playwright (viewport court 700px) : cadre 700px sans scroll de page, autoscroll actif pendant la frappe, drama=#fff et MALÉDICTION blanc calculé, Instrument Serif calculée sur le titre de rencontre, illustration présente après la bannière, decay-overlay + ko-tremble actifs au palier critique. Lint + build propres, déployé sur les deux routes.
