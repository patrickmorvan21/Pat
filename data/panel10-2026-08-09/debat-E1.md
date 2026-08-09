# Débat — E1 (direction artistique)

## 1. Convergences

**Le CTA du bas : E2 a raison, je me suis trompée.** J'ai remesuré ma propre capture `cta/02-choix-20.png` (780×1700, soit 390×850 @2x) : une ligne blanche pleine court à y=1669, donc la bordure inférieure du 3ᵉ bouton **existe**, à 15 px du bord. Mon « rogné » était une lecture d'œil sur une image redimensionnée. Je retire le mot — et je maintiens le problème : si la DA du projet, en regardant une capture 2x, conclut « coupé », alors 15 px sous l'indicateur d'accueil iOS (34 px) est fonctionnellement un bord perdu. Ce n'est pas un bug de rendu, c'est un bug de marge. Verdict commun E1+E2 : **plancher 44 px**, et les 350 px de charbon mort au-dessus (`captures/031`) sont la réserve où aller les chercher.

**Les contrastes : convergence totale, mesurée deux fois séparément.** E2 relève 255 / 141 / 84. Sur mes 190 écrans je trouve exactement la même échelle : 255 sur 81 écrans, ~230-250 sur 20, **~140** sur `captures/043`, `053`, `057`, `c2/032`, et **~90** sur les trois écrans de verdict (`048`, `c2/024`, `c2/038`). Et j'ai la cause : sous le voile du dé, le ciel passe de (224,99,42) à **(83,46,27)** — un brun. Le « problème de contraste » de E2 et ma « quatrième couleur » sont **le même bug** : l'opacité employée comme outil de composition. Corollaire mesuré : dans les menus, l'échelle d'opacité fabrique quatre neutres distincts en masse — (152,151,149), (142,141,139), (85,83,80), (73,71,68). Quatre gris là où la charte en autorise zéro.

**L'écran du dé est le pire écran du jeu, et nous le disons tous les deux.** `de2/00-anneau-arme.png` cumule : le geste sans affordance (E2 1), le seul vrai bouton qui détruit l'aide (E2 2), les encoches rongées invisibles (E2 3 — confirmé, je ne vois qu'un demi-cercle orange et de la poussière), l'aide imprimée **par-dessus** le texte du Geôlier (E1 1), et le voile brun (E1 2). Cinq défauts, un écran, le geste central du jeu.

**Accords secondaires** : onglets de menu à code couleur inversé (E2 7 = ma §3, trouvés indépendamment) ; l'objet flottant sur 70 % de noir (`c2/058` chez lui) est ma « deuxième polarité » (§2-7) — l'ergonomie et la DA arrivent au même asset par deux portes ; le gabarit cassé « RARE — , J » est autant un trou de grammaire qu'un trou d'UX. Et la carte d'état rangée parmi les boutons, vue par E2, A1 et B1 : une fiche d'information ne doit **jamais** porter le conteneur d'une action.

## 2. Contestations

**Ajouter du contenu maintenant est prématuré — oui, et je le tiens.** La recette « masse noire en contre-jour, plein cadre, dissolution basse » n'est tenue que sur ~60 % des écrans. Chaque nouveau lieu réclamé produit de nouveaux assets, donc de nouvelles occasions d'ajouter une troisième polarité. Le moulin est ressorti **trois fois** avec ses ailes : ce n'est pas un accident, c'est ce que fait une chaîne non normalisée quand on la sollicite. Multiplier le contenu sur cette base multiplie l'incohérence à l'identique.

**Mais je ne l'oppose pas à A1.** Sa recommandation n°1 — chaque scène lit le dé qui la précède — coûte **zéro asset**. C'est le chantier lourd le moins cher du panel, il tourne en parallèle du travail visuel, et je le soutiens sans réserve.

**Je conteste B1 sur « 3-4 actions par lieu ».** Quinze lieux × deux ou trois plans rapprochés, c'est ~40 images à produire sur une recette non figée : la garantie d'un jeu deux fois plus grand et deux fois plus disparate. Version honnête : **approfondir trois lieux**, et seulement ceux dont la recette est déjà bonne. Je conteste aussi son diagnostic du dé (« une taxe ») : ce n'est pas de l'équilibrage, c'est de la lisibilité d'état — il n'a jamais su que ses états le pénalisaient. Et son « 20 naturel ne fait rien de spécial » est un problème de **mon** ressort : le DESTIN n'a pas de moment visuel.

**Je conteste la boucle méta comme priorité.** Titres, trophées, écrans de legs : ce sont de nouveaux écrans, donc une sixième grammaire de conteneur, alors que j'en compte déjà cinq. Le Registre existe et porte le meilleur objet graphique du jeu (`cta/00-registre.png`, le nom gratté). On y inscrit le survivant, point.

**Je conteste deux détails chez E2, sur mon terrain.** (a) Sa démonstration muette du dé : oui, mais **par paliers**, jamais un easing fluide — sinon c'est la première interpolation lisse du jeu. (b) Son liseré blanc 30 % sur les encoches d'échec introduit un **cinquième gris**. Contre-proposition, même effet : encoche rongée = même orange, mais un contour de pixels orange conservé et l'intérieur mangé par la trame — la proportion se lit par la densité, la palette reste à trois couleurs.

## 3. Arbitrage — où placer les chantiers visuels

**Rang 0 — L'écran du dé, chantier unique et commun E1+E2** (affordance + désempilement de l'aide + voile remplacé par une érosion tramée). C'est l'intersection des deux seuls testeurs qui ont vu le jeu. Quelques jours, aucun asset.
**Rang 1 — A1 : chaque scène lit son dé.** Zéro coût visuel, plus gros gain narratif, tourne en parallèle.
**Rang 2 — Normaliser la recette : repasser au pipeline les ~12 assets « orange flottant sur noir ».** Traitement par lot, aucune génération. **C'est le verrou** : rien de neuf n'est produit tant qu'il n'est pas levé.
**Rang 3 — Purger l'échelle d'opacité** (un seul blanc 50 %, érosion tramée pour tout le reste). Une passe de tokens qui règle les contrastes de E2 et ma quatrième couleur d'un seul geste.
**Rang 4 — La trace du survivant (B1), version minimale** : dans le Registre existant.
**Rang 5 et au-delà** — nouveaux lieux, boucle méta, plomberie « déjà vu ». Après le rang 2, jamais avant.

## 4. Suggestions

**Les miennes.** (a) Une charte écrite d'**une seule recette**, et une planche-contact obligatoire : aucun asset n'entre sans avoir été posé à côté des trois affiches de référence (`059`, `067`, `021`) — c'est ce qui aurait arrêté le moulin ailé au premier tour. (b) **L'image suit le beat, pas le lieu** : le prologue tient une seule image sur 14 écrans (`005`→`018`) pendant qu'on raconte une falaise, un otage, un tabassage. Correctif le moins cher du panel : réemployer des portraits déjà sur disque. (c) **DESTIN et MALÉDICTION méritent un moment visuel** — une animation sur un écran existant, zéro asset, et B1 saura enfin qu'il vient de faire le meilleur jet du jeu.

**Avis sur celles des autres, au coût visuel.** A1-1 (un verbe de réaction : reculer, détourner les yeux) : conteneur existant, coût nul, **oui**. A1-2 (le Soupçon lisible dans le monde) : oui **en prose et en comportements** — jamais un badge, jamais une jauge, jamais une pastille de compteur, sinon la mécanique la plus subtile du jeu devient un HUD. A1-3 (variantes d'ouverture selon les morts) : texte seul, oui. B1-1 : oui dans le Registre, non en écran de trophées. E2-3 (point orange sur l'icône de menu) : accepté **en carré de pixels**, jamais un rond — c'est exactement le genre de détail où le jeu perd son langage. E2-2 (remplacer la lecture du radar par la phrase du prologue) : je cède, le radar est mon échec et la phrase dit mieux la dominante que mon nuage de pixels.

## 5. Mon top 3 pour l'équipe

1. **L'écran du dé**, en un seul chantier commun : affordance du geste (E2) + aide désempilée et voile remplacé par une érosion tramée (E1). Le geste central du jeu est aujourd'hui son écran le plus cassé, et c'est le seul point où nos deux audits se superposent défaut pour défaut.
2. **Chaque scène lit le dé qui la précède** (A1). Zéro asset, gain immédiat, parallélisable.
3. **Geler la recette d'illustration et repasser l'existant avant de produire une image de plus.** C'est le verrou de tous les chantiers de contenu que réclament les huit autres — les ouvrir avant, c'est industrialiser l'incohérence.
