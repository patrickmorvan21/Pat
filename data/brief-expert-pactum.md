# PACTUM — tout ce qu'il faut savoir pour juger ce jeu en connaissance de cause

Ce dossier existe pour une raison précise : les panels de testeurs précédents
ont perdu la moitié de leur valeur à signaler comme des défauts des choix
assumés, ou à juger l'outil de test en croyant juger le jeu. Il sert à
transformer un regard neuf en regard expert **après** que ce regard neuf a
rendu son verdict — jamais avant.

Il est aussi le document de référence à donner à tout nouvel intervenant.

---

## 1. Ce qu'est PACTUM

Un livre-jeu mobile, dark fantasy, solo. Le joueur incarne un héros envoyé
dans « le Domaine », un lieu bâti par une entité nommée **le Geôlier**. Une
zone est écrite à ce jour : **Les Landes** (17 lieux, ~90 scènes).

La philosophie, en une phrase : **l'IA arbitre, le joueur est contraint,
jamais tout-puissant**.

### Les trois piliers, non négociables

1. **Permadeath.** Une vie par run. La mort ne vient QUE d'un choix ou d'un jet
   raté dans la fiction. Fermer l'application, perdre le réseau, être
   interrompu : **jamais** une cause de mort. La partie se sauvegarde
   localement et reprend exactement où elle s'est arrêtée.
2. **La contrainte du joueur.** Des stats de personnalité et un dé. Pas de
   contrôle narratif libre, **aucune saisie de texte libre** (une seule
   exception assumée : le nom du héros, au prologue).
3. **La mort est une progression.** Reliques, Grand Registre, mémoire de
   compte : ce qu'on perd en mourant nourrit la vie suivante.

### Les règles d'affichage qui découlent des piliers

- **Aucun chiffre de mécanique n'est jamais affiché.** Pas de PV, pas de
  pourcentage, pas de seuil, pas de jauge. La santé se lit dans l'érosion
  pixel de l'interface. Le Soupçon se lit dans le comportement du monde. Seul
  le bilan de mort affiche des chiffres bruts — c'est un registre de greffe,
  et c'est une exception écrite.
- Le **Geôlier** est le seul personnage autorisé à énoncer des nombres
  (« Douze mille avant toi… ») : il voit les statistiques, c'est sa nature.
- **Trois couleurs, aucune autre** : charbon `#1c1a16`, orange `#e0632a`,
  blanc `#ffffff` (plus ses opacités 50 % et 20 %). Aucun dégradé CSS nulle
  part : un « dégradé » se fait en densité de pixels décroissante.
- **Animations en `steps()` uniquement.** Aucune interpolation, aucun fondu
  lisse. Le tremblement est une qualité recherchée.
- Deux polices : **Instrument Serif** (titres) et **Roboto Mono** (tout le
  reste).
- Illustrations : bibliothèque pré-faite, tramée Floyd-Steinberg en deux
  couleurs. Jamais de génération à la volée.

---

## 2. Les systèmes, et surtout leur INTENTION

Juger un système sans connaître son intention produit des faux positifs. Voici
ce que chacun cherche à faire.

### Le dé et la résolution
Un d20 contre un seuil caché. **Cinq paliers** : Éclatante (marge ≥5),
Réussite (≥2), De justesse (≥0), Échec (>−5), Critique. Plus deux extrêmes :
**Destin** (20 naturel) et **Malédiction** (1 naturel). Chaque choix risqué a
**quatre textes d'issue écrits** ; les paliers intermédiaires réutilisent le
texte voisin — c'est le mot de verdict et le visuel qui portent la nuance.

Le résultat n'est **pas** tiré à l'avance : à l'immobilisation du dé 3D, on
lit la face réellement tournée vers la caméra. La face montrée ne peut donc
structurellement pas diverger du chiffre annoncé.

**L'Anneau** : au moment où le dé s'arme, 20 encoches apparaissent autour de
lui. Pleines = les faces qui réussiraient, rongées = celles qui échoueraient.
C'est la seule information de probabilité donnée au joueur, et elle est
donnée **en forme**, jamais en chiffre.

### Le coût d'un échec suit sa NATURE (décision du 9/08)
Chacun des 83 jets de la zone est classé à la main :
- **physique** → coûte de la santé (0,08 / 0,16 / 0,26 / 0,30 selon le palier) ;
- **social** → coûte du **Soupçon** (+1, +2 sur échec dur) et un témoin ;
- **exploration** → coûte du temps ;
- **surnaturel** → pose un **état** (Hanté, Marqué).

⚠️ Conséquence assumée et documentée : **on ne meurt plus que d'un échec
physique ou du procès**. C'était le but (la mort doit être compréhensible dans
la fiction), au prix d'une pression réduite hors combat. Un testeur qui dit
« je ne meurs jamais en discutant » décrit une intention, pas un bug — mais
« la mort ne mord pas du tout » reste un grief recevable, et il a déjà été
formulé par un panel précédent.

### La traversée
La zone ne se parcourt pas en ligne. **Liaison → lieu → liaison → …** jusqu'à
7 ou 8 lieux, puis la Palissade Sud, puis la Descente (fin sèche, l'Acte II
n'existe pas encore). À chaque liaison, deux directions sont offertes, tirées
par une graine — donc **il n'existe aucune carte fixe**, et c'est voulu : la
géographie est une rumeur, pas un plan. Le Studio ne dessine volontairement
aucun chemin entre les lieux pour cette raison.

Le **Hameau des Renonçants** est la seule enclave réelle : six lieux
intérieurs, fermés au tirage tant qu'on n'est pas entré par la séquence
d'accueil.

### Le Soupçon (0 → 6)
Jamais affiché. Monte sur des **actes** (mentir, voler, jurer faux, toucher ce
qu'il ne faut pas), jamais sur l'observation — arbitrage explicite : « il faut
récompenser les curieux, pas les pressés ». À 6, la traversée est déroutée
vers le **procès du héros**, qui peut tuer quelle que soit la santé.
Il se lit dans le monde : cinq manifestations au village (des gens), cinq
marques à la craie en pleine lande (personne), et une ligne du Geôlier par
palier franchi.

### Les états
Six seulement, délibérément : **Fiévreux, Boiteux, Affamé** (corps),
**Marqué, Fixé** (social), **Hanté** (mental). Chacun doit tenir une
couverture minimale : une source, une manifestation, deux réactions du monde,
un choix ou un jet modifié, un remède. Un état ne modifie pas seulement un
chiffre : il **retire** des options (Boiteux supprime les fuites), en **ouvre**
d'autres (Affamé ouvre le vol), et fait réagir les gens.

### Les besoins
Soigner (2 jours), dormir (3), manger (3). Comptés en **jours**, donc en
campements : le besoin punit la lenteur, ce qui est un arbitrage, pas une
taxe. Aucune jauge : un besoin ne se manifeste que par l'état qu'il finit par
poser, et il ne tue jamais.

### Le Savoir et les Découvertes — à ne pas confondre
- **Savoir** : portée RUN. Meurt avec le héros. Débloque un choix plus loin
  dans la même vie.
- **Découverte** : portée COMPTE, **survit à la mort**. Elle ouvre des scènes
  entières entre les vies (tout l'arc du Grand Témoin repose dessus).
Règle d'usage : une découverte ouvre des options, elle **ne met jamais de
souvenirs dans la tête du héros courant**.

### La règle des quatre monnaies
Un point d'intérêt doit toujours rendre quelque chose : un **objet**, un
**savoir**, un **fragment de lore**, ou une **découverte**. Jamais rien.

### La mort
Séquence en six écrans, ordre verrouillé : beat fatal → la mort → un fragment
du Geôlier → le Grand Registre → la relique → la relève. Le Registre passe
avant la relique parce que le fragment et le Registre regardent en arrière, la
relique en avant.

**Dix reliques nommées**, chacune avec un **don ET une dette** — jamais un
bonus sec. La cause de la mort choisit le pool.

### Ce que le monde retient entre les vies
- Le **Grand Registre** (cent places, la première inaccessible).
- La **trace de la mort précédente** à la Borne (corde nouée, auréole d'eau,
  griffures — selon la cause).
- **La Borne côté sud** porte le nom du prédécesseur, une entaille par vie
  perdue.
- **Onze personnages** se souviennent d'une incarnation à l'autre — jamais par
  un nom, toujours par une manière (« Le précédent avait tes yeux »).
- Une **strate de familiarité** par lieu, au 2ᵉ puis au 4ᵉ passage du compte.
- Les **corbeaux de la Colline** sont exactement aussi nombreux que tes morts.
- La règle d'écriture qui gouverne tout ça : **le héros vient de naître et ne
  se souvient de rien**. C'est le MONDE ou le CORPS qui porte la trace.

### Le Grand Témoin (l'arc de lore de la zone)
Le correctif fondateur : **il n'a pas créé la Fixation, il est venu parce
qu'elle existait**. Les Renonçants pendent leurs voisins tout seuls, par
terreur. Aucun texte ne doit suggérer qu'ils sont manipulés — toute la force
de la zone vient de là.

### Les éléments-surprises
**Au plus un par vie, jamais deux vies de suite.** Leur puissance vient
exclusivement de leur rareté. Neuf sont implémentés (le choix qui expire, le
retour au lieu de mort, le fantôme d'un héros tombé, la prophétie, le vol
nocturne, le dé impossible…).

---

## 3. Les décisions déjà tranchées — ne pas les rouvrir sans raison neuve

- **Trois choix par écran au maximum.** Une seule exception documentée.
- **Le Serment est imposé**, jamais proposé : on ne peut pas traverser le
  Hameau sans jurer, mentir ou refuser.
- **Renoncer à un jet déjà armé : refusé** (demandé deux fois par des
  testeurs, tranché deux fois par l'auteur).
- **Afficher « Nécessite Empathie 3 » : refusé.** Un verrou se dit en
  diégèse : « Il te faudrait plus d'empathie que tu n'en as. »
- **La Descente est une fin sèche.** L'Acte II n'est pas écrit, et l'écran le
  dit.
- **Aucun rouge dans le jeu.** La couleur brique est bannie depuis le 14/07.
- **Le nom du héros est la seule saisie libre.**

---

## 4. Les gardes automatiques (et pourquoi ils existent)

Cinq scripts tournent avant chaque build ; si l'un échoue, le build échoue.

| Garde | Ce qu'il empêche |
|---|---|
| `check_coherence.py` | que les deux sources de géographie divergent |
| `gen_manifest.py` | qu'une image changée sous le même nom reste en cache |
| `immersion.py` | qu'un texte écrit pour un contexte soit servi dans un autre |
| `sejour.py` | qu'un lieu qui retient le joueur puisse l'enfermer |
| `aiguillage.py` | qu'une scène serve le même texte après un succès et un échec |

**Règle acquise : un garde doit être prouvé sur son mode d'échec avant d'être
branché.** Un garde qui ne se déclenche jamais ne vaut rien — et il est arrivé
qu'un garde soit muet pendant des semaines à cause d'un parseur cassé.

---

## 5. LES FAMILLES DE DÉFAUTS QUI REVIENNENT

C'est la partie la plus importante de ce dossier. Ces huit familles se sont
répétées d'une session à l'autre malgré les correctifs ponctuels. Un défaut
nouveau appartient presque toujours à l'une d'elles.

**A. Le champ oublié dans le chargement.**
L'état de la partie est reconstruit champ par champ à la lecture. Tout champ
ajouté au type mais oublié dans la fonction de chargement est **silencieusement
perdu au rechargement** — la mécanique semble marcher en test et ne marche
jamais chez le joueur. Survenu au moins quatre fois.

**B. Le texte servi hors de son contexte.**
Un texte écrit pour le village apparaît en pleine lande, un texte de foule
apparaît devant une bête. C'est la famille la plus visible pour un joueur.
Elle a produit l'audit automatique — qui l'a fait presque disparaître, mais
seulement pour les pools déclarés dans cet audit.

**C. Le parseur qui rend du vide sans rien dire.**
Les outils lisent le code source pour en extraire les données. Cinq fois au
moins, un de ces lecteurs a rendu une liste vide ou tronquée **sans
avertissement** : un audit devenait muet, un export perdait un système, un kit
de test faisait croire qu'une mécanique n'existait pas.

**D. Deux sources de vérité pour la même chose.**
Le moteur lit un fichier, les outils en lisent un autre. Corriger l'un ne
corrige jamais l'autre. A produit un nom de lieu affiché deux fois, une carte
périmée, une réplique qui jouait une version obsolète des règles.

**E. L'artefact d'outil pris pour un bug du jeu.**
La moitié des griefs des deux panels précédents. Le kit ne réplique pas tout ;
un banc de test mal écrit clique à côté ; un transcript ne capte pas certains
écrans. **Un testeur qui n'a pas les moyens de distinguer les deux accusera le
jeu.**

**F. La promesse sans source.**
Un état promet de retirer les options de fuite… mais aucun choix du jeu n'est
marqué « fuite ». Un compagnon promet d'annuler un coût… qui n'existe plus.
La mécanique est écrite, la matière ne l'est pas.

**G. L'image qui contredit son texte.**
Le cas emblématique : le « Moulin sans Ailes » illustré par un moulin **avec**
ses quatre ailes, trois générations de suite. Et les images regénérées sous le
même nom, invisibles au cache.

**H. Le correctif appliqué au mauvais endroit.**
On corrige là où on a regardé, pas là d'où vient le défaut. Un renommage fait
dans le moteur mais pas dans les données ; une sortie de zone posée sur une
branche de fin sur deux.

---

## 6. Ce que les panels précédents ont déjà obtenu

Un panel de 10 IA (9 août) a produit six chantiers, tous livrés depuis :

1. Un lieu ne se quitte plus que par un choix qui dit partir, et le dé se
   lance au simple toucher.
2. Une scène chaînée derrière un jet lit le résultat de ce jet (19 scènes
   servaient le même texte après un succès et après un échec).
3. Un lieu tient deux ou trois décisions au lieu d'une, et un échec dur y
   consomme une possibilité de plus.
4. Le monde se souvient entre les vies (34 lignes de familiarité, la Borne).
5. Le Soupçon se lit dehors ; un échec dur ferme une route à la Croisée
   suivante.
6. Le choix verrouillé cesse de se rendre comme une fonction morte, et six
   verrous de plus sont écrits.

**Griefs restés sans réponse à ce jour**, et donc légitimes à re-signaler :
la mort ne mord pas assez pour un joueur prudent ; sortir vivant de la zone
est l'écran le plus plat du jeu ; l'épitaphe d'une mort peut être une phrase
anodine.

---

## 7. Où vivent les choses

- `aldenhar/lib/scene-data.ts` — **la source de vérité du contenu jouable** :
  scènes, choix, seuils, les quatre issues de chaque jet, points d'intérêt,
  textes de marche. C'est ce que le moteur exécute.
- `aldenhar/components/Scene.tsx` — la boucle de jeu : ce qui s'injecte à
  l'arrivée, la résolution, les états, la mort.
- `aldenhar/lib/` — les systèmes (états, besoins, faits, reliques, témoins,
  perception, surprises, déjà-vu, contradictions).
- `data/zones/landes.json` — **matière de production, jamais lue à
  l'exécution** : la carte, les illustrations, le catalogue du lore.
- `tools/` — les gardes, les exports, la réplique hors navigateur, le pilote
  du vrai build.
- `CLAUDE.md` — le journal complet, session par session, décision par
  décision.

---

## 8. Les deux outils de test, et ce qu'ils ne disent pas

**La réplique hors navigateur** (`tools/pactum.py` + `data/run-kit.json`)
porte le contenu exact et le modèle de résolution, plus une mémoire de compte.
Elle ne porte PAS : les illustrations, le geste du dé, les minutages, les
scènes chronométrées, la séquence de mort en six écrans, les reliques,
l'humeur du Geôlier, les chapitres, les surprises, la trace de la Borne.

**Le pilote du vrai build** (`tools/jouer_web.mjs`) fait tourner le bundle
publié : vrais écrans, vraies images, vrai dé. Il ne dit rien du son, ni du
toucher réel sur un téléphone.
