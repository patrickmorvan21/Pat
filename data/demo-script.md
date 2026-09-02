# LA DÉMO — « La Nuit du Serment » (script arbitré avec Patrick, 24/08/2026)

> ⚠️ **2/09 — LE MODE DÉMO N'EXISTE PLUS : cette courbe est désormais LA PREMIÈRE
> RUN de tout compte.** Décision Patrick : « la première run est en fait la démo
> de Pactum ». Plus de drapeau, plus d'URL `?demo=1`, plus d'interrupteur dans
> les Options — la route scriptée se joue quand `runsStarted ≤ 1`
> (`traverseeGuidee()` dans `lib/demo.ts`), puis le tirage reprend dès la
> deuxième incarnation. Ce qui a changé par rapport au script ci-dessous :
> l'entrée n'est plus compressée (le pacte entier, les quatre souvenirs, le
> carton d'acte — un vrai premier joueur les mérite), la cible de traversée est
> fixée à 8 pour que la nuit scriptée ne se double pas d'une Halte, l'élément-
> surprise de la vie 1 est LE CHOIX QUI EXPIRE (la charrette du Chemin Creux),
> les textes courts écrits pour la démo sont devenus les textes tout court, et
> **la Falaise aux Cordes est aussi la sortie du jeu complet** (Palissade →
> portillon → Falaise → Descente). Les mini-jeux se jouent dans toutes les vies.

Traversée scriptée de ~23 minutes, construite sur l'existant. Deux mouvements :
**la lande** (la peur du corps) puis **le village** (la peur sociale et l'obscur),
épilogue à la Falaise. La démo est un CHEMIN dans le jeu, pas un fork.

## Les quatre critères (Phase 0)

1. Premier lancer de dé avant la minute 3.
2. Un désir nommé avant la minute 5 (le Pendu qui parle).
3. Au moins deux moments de peur (la Bête · le Puits — la Meute en troisième).
4. Une fin (mort ou Descente) qui donne envie de relancer. La mort est une
   finale valide partout — relance rapide (Seuil court) après une mort en démo.

## Doctrine des mini-jeux (arbitrée le 24/08)

- **Un échec de mini-jeu n'est jamais un mur : c'est un prix** (bruit, blessure,
  Soupçon, position dégradée). Jamais la mort sèche sur un geste d'adresse.
  Exception encadrée : le Crochetage de la maison PEUT échouer en mur, parce
  qu'il existe d'autres portes (dormir ailleurs) — l'échec est un embranchement.
- **Jamais de test d'adresse devant la Descente** : la question finale est
  « oses-tu ? », pas « sais-tu ? ». Le geste final est un RITUEL insensible à
  l'échec, pas un mini-jeu.
- **Exécution visuelle : RÉALISTE, pas abstraite** (retour Patrick 24/08 —
  « trop pixel, trop jeu bêta » sur les moteurs procéduraux actuels).
  Le fond d'un mini-jeu est une VRAIE illustration tramée (pipeline Leonardo →
  dithering, comme les scènes) ; les éléments mobiles sont des SPRITES
  pré-tramés par paliers (la technique de la porte animée de l'intro :
  frames pré-rendues, steps(), jamais d'interpolation) ; le dessin procédural
  est réservé au FEEDBACK (curseur, jauge tramée, ligne de tracé). On doit
  deviner ce qu'on voit — une serrure, une corde, une bête — comme dans les
  illustrations de scène. La logique des moteurs (score, fenêtres, stats)
  ne change pas : c'est un re-skin, pas une réécriture.

## La séquence

| # | min | Segment | Ce qui s'y joue |
|---|-----|---------|-----------------|
| 0 | 0:00–1:30 | **Entrée compressée** | 1 clause d'intro (la porte animée « UNE VIE ») · Seuil 2 souvenirs (Courage, Instinct) + le Nom · pas de carton d'acte. |
| 1 | 1:30–3:30 | **La Borne** | Mini-jeu FROTTAGE sur les gravures (zéro risque, tutoriel tactile) → la question « qui a gravé côté sud ? » · premier JET sur « Fouiller les offrandes » · l'Hésitant reste (on renonce à des choses). |
| 2 | 3:30–4:00 | **Liaison — le désir** | Amorce du chapitre du Bailli (« tu verras la colline ») · la corde qui grince. Deux boutons d'orientation, destinations scriptées. |
| 3 | 4:00–6:30 | **Chemin Creux & LA BÊTE** — pic 1, physique | La charrette → le Grelot (chaîne vers le Puits) · embuscade chronométrée · mini-jeu RETENIR SON SOUFFLE sur « Se plaquer dans l'ornière » (échec = repérée → combat/ENTAILLÉ, non fatal, arme la menace). |
| 4 | 6:30–9:00 | **La Colline** — payoff du désir | Le Pendu qui parle (confession du Bailli), le hameau visible en contrebas · menace-retour de la Bête sur la marche (garantie si fuie) · **Témoin, touche 1** : le corbeau de travers qui te regarde, toi. |
| 5 | 9:00–12:00 | **Entrée au Hameau — le SERMENT** — pic 2, social | Séquence garantie complète : approche (« aucun chien n'aboie ») → ruelle (**Témoin, touche 2** : la silhouette au bout de la ruelle, forme de corbeau, pas la taille d'un corbeau) → barrage → le Serment (3 options, pas de dé). |
| 6 | 12:00–14:30 | **La Chapelle + le Marché Muet** | Chapelle : la Veuve, le mur des cordes → mini-jeu TRACÉ sur le tressage → **la Corde coupée** (échec = tu l'as quand même, mais la vitrine se décroche et la Veuve t'a vu : +Soupçon) · Marché court (1-2 écrans, le malaise diurne). La musique se penche. |
| 7 | 14:30–16:30 | **La nuit — le CROCHETAGE de la maison** | Dormir. « Crocheter la serrure d'une maison fermée » (RUSE) : **réussite** = nuit discrète, zéro Soupçon, soin complet, et les combles cloués DE L'INTÉRIEUR découverts seul (**Témoin, touche 3**) · **échec** = le bruit, un volet s'ouvre, +1 Soupçon, la porte ne cède pas → la grange des Renonçants (sous leurs yeux, le vieux raconte les combles) ou la nuit dehors (repos diminué, on L'entend marcher sur un toit). |
| 8 | 16:30–19:00 | **CLIMAX — le Puits Condamné** | Les coups sous les planches (chronométré) · amarrer la Corde (les coups s'arrêtent… puis on l'amarre de l'autre bout) · jeter le Grelot · « Descendre par la corde » (COURAGE, highStakes, settling rallongé) · le plancher de chaussures rangées par tailles. Pas de crochetage ici (arbitré : le climax est déjà plein). |
| 9 | 19:00–21:30 | **LA MEUTE GRISE** — pic physique final | Le combat 2 beats existant (hurler → savoir_meute_voix → le front des cinq). Répond à « aucun chien n'aboie » : les chiens du pays sont dehors, en meute. Mort possible aux portes de la sortie — assumé. |
| 10 | 21:30–23:30 | **LA FALAISE AUX CORDES** — le lieu final (nouveau) | Voir ci-dessous. Puis la cérémonie, la Descente (Sceau, Registre, « L'Acte II attend ») — ou la mort, l'autre finale. |

> ⚠️ **01/09 — le Souffle (segment 3) est mis en attente** (Patrick : « on la garde
> pour plus tard, pour le moment on laisse le timer pour prendre une action vite »).
> Le pic de la Bête se joue au **compte à rebours de 4 s** de la scène tant que le
> mini-jeu n'a pas son habillage réaliste (sprite de la Bête de profil + fond
> d'ornière). Le moteur `hold` reste en place, débranché sur le choix « Se plaquer,
> immobile » (`lib/scene-data.ts`, bloc commenté).

## Le lieu final : LA FALAISE AUX CORDES (validé 24/08 — remplace la Palissade en démo)

Le sol cesse. En face, la paroi — et sur toute sa largeur, des centaines de
CORDES nouées à des pieux, qui pendent dans le vide et s'enfoncent dans le
noir. On ne gâche pas le chanvre dans les Landes : **chaque corde qui a pendu
quelqu'un sert une seconde fois — elle fait descendre.** Le pays qui fixe les
gens aux poteaux est celui qui les fait sortir par le cou de leurs morts.

- **Écran 1** — le bord, la forêt de cordes qui bougent ensemble dans le vent.
  La règle en une ligne : personne ne descend autrement.
- **Écran 2** — choisir sa corde. Les vieilles, les neuves — et trois ou
  quatre, en bas de leur course, **tranchées net. À la lame. Par en dessous.**
  Qui a passé la Chapelle reconnaît **le tressage de la Veuve** (elle tresse
  celles qui pendent ET celles qui descendent). Qui porte la Corde coupée
  comprend ce qu'il transporte : quelqu'un coupe les cordes, depuis le bas.
- **Écran 3** — l'Appelé prend une corde sans regarder, descend, disparaît.
- **Le choix**, sec. Puis **la cérémonie** (~90 s, symétrique de la mort) :
  1. le geste — glissement lent du doigt vers le bas, la corde FILE entre les
     mains par paliers, l'image monte, la musique meurt, la lumière tombe
     (moteur SlowSwipe, insensible à l'échec ; s'arrêter = tout s'attend) ;
  2. la ligne — la paume qui chauffe (la paume qui vient de filer la corde EST
     celle qui reçoit le Sceau), les lignes existantes à la frappe lente ;
  3. ce qu'on laisse — le Registre (« a franchi la Descente »), un dernier
     regard au nord, le carton « L'Acte II attend ».

Le Veilleur sort de la démo (son sort au jeu complet = arbitrage séparé).
Le portillon griffé + la clé rouillée restent sur la route de la Falaise.

## Les quatre fils de la démo (aucun n'est expliqué)

1. **Le Bailli** — amorce en liaison 2, payé à la Colline (segment 4).
2. **Le Grand Témoin** — trois touches : le corbeau de travers (4), la
   silhouette de la ruelle (5), les combles cloués (7). Des traces, jamais
   une explication (règle du lot 2).
3. **Les chiens** — « aucun chien n'aboie » (5) → la Meute (9).
4. **Les cordes** — la Chapelle (6) → la Corde au Puits (8) → la Falaise (10).

## Coupé de la démo (arguments pour le jeu complet)

La Femme au Seuil, la halte complète du Hameau, le Tribunal, la Mare, le
Verger, la Tour de Guet, le Moulin, le procès, le Veilleur, les rencontres
errantes hors Meute. « Il y a deux fois plus de zone que ce que tu as vu. »

## À produire (images, pipeline Leonardo → dithering)

**Lieu final** : la paroi aux cordes en contre-jour (vue large) · le bord/les
pieux (plan moyen) — 2 images.
**Mini-jeux (fonds réalistes + sprites, doctrine ci-dessus)** :
- Frottage Borne : le fond révélé existe (`scene_borne_gravures_a_d`) ;
  option = variante moussue pour l'état couvert.
- Souffle Bête : la Bête DE PROFIL en marche (sprite, 2-3 frames) + fond
  d'ornière — l'asset existant est un portrait, il faut le profil.
- Tracé Chapelle : gros plan du nœud/tressage sous verre.
- Crochetage maison : gros plan serrure + ferrure de porte de Renonçants ;
  bras du crochet en sprite-sheet pré-tramée (technique porte animée).
- Cérémonie : la corde qui file = paliers sur les images du lieu.
**Intérieurs** : la maison crochetée de nuit (1 image ; la grange existe).

## À câbler (rien d'autre n'est neuf)

Flag mode démo (intro 1 clause, Seuil 2 souvenirs, relance rapide) · table de
séquence remplaçant le tirage (10 destinations ordonnées) · les garanties
(menace au segment 4, loots Grelot/Corde, ordre des touches Témoin) · 4
mini-jeux re-skinnés posés sur leurs scènes + le geste de la cérémonie ·
musique mappée sur la courbe (calme → penchée au 6 → sombre au 8 → morte
au 10) · le lieu Falaise (3 écrans de prose + cérémonie).

**Ordre de réalisation convenu** : segments 1-3 d'abord (mode démo + Borne +
Bête, avec leurs deux mini-jeux re-skinnés) pour valider le rythme sur
téléphone avant de dérouler le reste. Le re-skin se valide sur UN mini-jeu
d'abord (le Crochetage, sur la serrure de la maison).
