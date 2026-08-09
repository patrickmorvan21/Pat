# Débat — E2 (design UX/UI)

## 1. Convergences

**Le CTA du bas — désaccord tranché, à mon avantage sur le fait, au sien sur la conclusion.** J'ai scanné au pixel *sa propre* capture (`E1/cta/02-choix-20.png`, 780×1700 = 390×850) : la bordure basse du 3ᵉ bouton est **présente**, à y=834, avec 15 px de charbon dessous. Sonde DOM sur 27 écrans, 6 runs : bas du dernier bouton = **835 dans un cadre de 850, toujours**, quel que soit le nombre de CTA (2, 3, 4 ou 5). Le bouton n'est donc jamais rogné. Mais E1 l'a *lu* comme rogné, et c'est le vrai bug : 15 px de charbon sous un bouton à fond charbon, ça ne fait pas une marge, ça fait un bord d'écran. Elle a tort sur le constat et raison sur le symptôme. Même correctif : un pied réel ≥ 34 px (indicateur iOS).

**Contrastes et palette — accord total, deux mesures pour un seul mal.** Elle décrit des bruns et « au moins cinq gris hors palette » ; j'ai les valeurs : même rôle de narration à **255, 141 et 84** de luminance selon l'écran, **2,5:1** sous le voile du dé. Aucun de ces gris n'est une couleur : ce sont des blancs à x % posés sur du charbon. Le problème n'est pas la palette, c'est **l'opacité employée comme outil de design**. Je co-signe sa suggestion d'érosion tramée à la place du voile, et je la généralise en §4.

**Trois autres accords indépendants, donc à traiter** : l'aide du dé imprimée par-dessus le bandeau du Geôlier ; les onglets à code couleur inversé (actif blanc / inactifs orange) — nous l'avons relevé séparément, DA et ergonomie, ça suffit à trancher ; la consigne « Touche le coffre » illisible sur les braises. Et le vide bas de cadre : elle dit 35-50 % de charbon mort, je dis 350 px au-dessus d'un CTA collé au bord. C'est la même page mal cadrée.

**Le choix VERROUILLÉ — je me corrige, E1 avait raison.** J'ai relancé 6 runs neuves en variant les réponses du prologue : **12 boutons verrouillés sur 27 écrans à choix**. Ma statistique « 0 sur 210 » était un défaut de couverture — mes quatre parcours avaient tous produit une EMPATHIE assez haute pour ouvrir la porte. Mais le vrai résultat est ailleurs : les 12 occurrences sont **le même bouton** (« Répondre aux voix · EMPATHIE », Borne Frontière, premier écran de la zone). Sur ~270 écrans et 10 runs, je n'ai vu **qu'un seul choix verrouillé distinct dans toutes les Landes**. Le pilier existe dans le moteur ; il est quasi absent du contenu. Ce n'est ni un défaut de fréquence ni un défaut de mes parcours : c'est un défaut d'écriture.

## 2. Contestations

**À E1 : « le CTA verrouillé porte exactement le même libellé blanc » — non, et c'est pire.** Mesuré : `opacity 0.4` contre 1. Blanc à 40 % sur charbon ≈ **3,6:1**, sous AA. Surtout, c'est **exactement le traitement des fonctions mortes d'Options** (« Vitesse de lecture », 2,27:1). Un pilier du design — la porte ouverte à un autre héros — est codé avec le visuel de « pas encore développé ». Je ne rejette pas son point, je le durcis : verrouillé ne doit pas ressembler à désactivé.

**À C2 et B2 : vous bâtissez tous les deux sur l'Anneau, que je mesure illisible.** Les encoches d'échec sont une poussière de pixels qui se fond dans le charbon : on voit un arc orange, pas une proportion. Montrer plus tôt (B2) une chose illisible ne la rend pas lisible. La légibilité de l'Anneau est un **préalable** à vos deux propositions, pas un détail.

**À C2, §8 : je conteste l'implication, pas le constat.** « Observer les alentours » est bien gratuit, mais c'est le seul dispositif qui tient l'écran à 3 CTA. Lui donner un coût rouvre la barre de choix et repousse le meilleur contenu du jeu derrière un risque. Corrigez la valeur des actes du haut, pas le prix du sous-menu.

**À B2, §3 : ce ne sont pas « des restes de code »**, ce sont des apostrophes courbes mal encodées. Détail — sauf qu'il tombe sur la seule voix du jeu qui doit être impeccable.

**Ce que je ne conteste pas et que je ne pouvais pas voir** : la fin de run déclenchée par une action qui ne dit pas « partir » (B2 §2, C2 §3). Zéro occurrence dans mes 270 écrans instrumentés — mes stratégies ne s'attardent pas à la Palissade. Deux testeuses indépendantes l'ont vécu : c'est un fait, pas une impression, et il échappe par construction à mon outillage.

## 3. Arbitrage : l'affordance du dé passe-t-elle avant tout ?

**Elle passe en premier dans l'ORDRE, pas en premier en VALEUR.** Je maintiens et je nuance.

Ce qui la maintient : c'est le seul défaut du panel qui soit **bloquant, précoce, sur la promesse centrale, et irrattrapable**. Trois éléments ressemblent à un bouton et n'en sont pas ; le seul vrai bouton de l'écran (« Ne plus afficher ») **efface l'aide définitivement**. Un débutant tape trois fois, ne se passe rien, et repose le téléphone — avant la première mort, donc avant tout ce que B2 et C2 reprochent. Fait décisif : **ni B2 ni C2 n'ont testé le geste** (B2 a joué sur table, C2 par script). Personne dans le panel ne contredit ce constat parce que personne d'autre n'a pu le produire. Et le correctif se compte en heures.

Ce qui le nuance, contre moi : réparer le dé **n'achète aucune rétention**. Ça convertit « le joueur est bloqué » en « le joueur est déçu ». Ce qui fait décrocher à vingt minutes, c'est le diagnostic partagé de B2 et C2 — un jet éjecte du lieu, le compteur de traversée confisque la scène en cours, le Serment promet un toit qui n'existe pas. Deux testeuses qui ont joué des vies entières convergent sans s'être parlé : ça pèse plus lourd que mon écran.

**Conclusion : même livraison, le dé d'abord.** Non parce qu'il vaut plus, mais parce qu'un jeu qu'on ne peut pas manœuvrer ne peut pas être évalué — y compris par nous. Tant que le geste ne s'enseigne pas, chaque playtest suivant restera un test de script, pas un test de joueur.

## 4. Suggestions — les miennes, et le coût d'interface des vôtres

Les miennes, inchangées et chiffrées : (a) démonstration muette du lancer au premier armement + libellé qui décrit le geste + **tap de secours** (lancer de force minimale), et « Ne plus afficher » sorti de la zone du dé à 44 px ; (b) faire lire l'Anneau par la forme — liseré rongé visible sur les encoches d'échec, révélation en deux temps ; (c) une trace pour ce qu'on ramasse et ce qu'on lègue (« rangé dans la Besace », point orange sur le menu, écran Reliques qui réutilise le bloc de la forge au lieu du gabarit cassé « RARE — , J »).

**Et une quatrième, qui sort du débat : une seule signification par traitement visuel.** L'opacité porte aujourd'hui **quatre** sens — voilé, désactivé, verrouillé, secondaire. C'est la cause commune du brun d'E1, de mon « verrouillé = mort », de mon « désactivé ≈ non-sélectionné » et de l'Anneau illisible. Une règle, une passe de tokens, quatre problèmes.

Sur les vôtres, sous la contrainte « aucun chiffre de mécanique » :

- **C2 §3, le devil's bargain en 4ᵉ slot** — la meilleure proposition du panel, et **coût d'interface nul** : le slot existe, c'est un CTA et une phrase. Adopter.
- **C2 §2, l'échec doit dépenser quelque chose du monde** — zéro UI, pure écriture. Adopter.
- **C2 §1, position & effet en pictos** — réalisable sans chiffre, mais **cher** : deux familles de glyphes à inventer dans un duotone qui compte déjà cinq grammaires de conteneur (E1). Je n'en prends **qu'une** : l'icône de ce qu'on risque. Et surtout pas dans l'Anneau, qui est déjà saturé et illisible.
- **B2 §1, soupeser puis engager** — irréalisable telle quelle : elle ajoute un troisième état à un écran où l'on ne sait déjà pas quoi toucher. Même bénéfice sans état neuf : l'Anneau s'affiche **en même temps que les choix**, à l'appui maintenu sur un choix risqué ; le relâchement engage.
- **B2 §2, que le Geôlier compte à voix haute** — le seul moyen de rendre le Soupçon perceptible sans jauge ni nombre, **coût nul** (son bandeau existe). Adopter. Réserve de designer : c'est aujourd'hui l'élément le moins identifiable du jeu (portrait tranché à x=0, aucun nom). S'il devient l'instrument de bord, il doit d'abord être reconnaissable.
- **E1 §1, renormaliser la polarité des illustrations** — je ne conteste rien : un traitement par lot, pas de regénération, la moitié des ruptures disparaît. Mais c'est une passe de beauté sur un jeu qu'on ne sait pas manœuvrer. Après le dé.

## 5. Mon top 3 pour l'équipe

1. **Rendre le lancer jouable** — démonstration muette, consigne du geste, tap de secours, « Ne plus afficher » déplacé. Rien d'autre ne peut être jugé tant que personne ne peut jouer à la main.
2. **Rendre un lieu à ses scènes** — un jet ne termine pas l'endroit, une run ne se termine que sur un choix qui dit qu'on part. C'est le point n°1 de B2 *et* de C2, atteint séparément : c'est le correctif de rétention, et il rend enfin le dé conséquent.
3. **Une signification par traitement visuel** — tuer l'opacité comme sémantique. Verrouillé ≠ désactivé ≠ voilé ≠ secondaire. Une passe qui règle la palette d'E1, mon pilier verrouillé invisible, la lisibilité de l'Anneau et le pied de 15 px d'un seul geste. Et pendant qu'on y est : **écrire d'autres choix verrouillés** — il n'y en a qu'un dans toute la zone.
