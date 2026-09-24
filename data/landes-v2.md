# Les Landes v2 — proposition du 24/09

Réponse aux quatre retours de Patrick du 24/09. **Rien n'est codé** : ce document attend ses arbitrages (section 7). Tout ce qui est marqué *existant* est déjà écrit dans le jeu ; tout ce qui est marqué *neuf* est à écrire.

---

## Le monde en une phrase

Le joueur se sent perdu parce que le jeu ne lui dit jamais la chose qui relie tout le reste. Elle existe pourtant déjà, éparpillée dans les textes. La voici, dite en une fois :

> **Ceux qui vivent ici ont renoncé à descendre. Quand l'un d'eux commence à entendre l'Appel, ils le pendent pour qu'il tienne. Toi, tu dois descendre.**

Tout le reste en découle. Les Renonçants ont renoncé à la Descente. L'Hésitant de la Borne entend l'Appel (« comme des gens qui parlent dans la maison d'à côté »). La Mare sert à vérifier s'il a commencé. La Fixation pend ceux qui l'entendent. La Palissade a ses pointes tournées vers l'intérieur pour retenir ceux qui voudraient descendre. Le Serment interdit de regarder le sud. Et le village te soupçonne parce que tu descends (« ça se voit à ton pas »).

Le joueur a donc un but qui va exactement contre la loi du pays qu'il traverse. C'est simple à comprendre, et c'est ce qui fait tenir le Soupçon, le procès et la Fixation.

---

## 1. L'objectif, dit en clair

### Les trois questions

À tout moment, le joueur doit pouvoir répondre à trois questions.

| question | réponse | qui la porte |
|---|---|---|
| **Qui je suis** | Un mort. On t'a prêté une vie. Pour ceux d'ici, tu es « un de ceux qui descendent ». | Le Geôlier, puis les villageois |
| **Pourquoi je suis là** | Le Pacte. Au fond du Domaine, la Porte Scellée. La passer, c'est garder cette vie *(à trancher, voir 7.1)*. | Le Geôlier |
| **Où je vais** | Au sud, vers la colonne de cordes qu'on voit à l'horizon. | Le paysage, à chaque environnement |

La Révélation (« Je commence à te voir ») répond déjà à l'autre sens de *qui je suis* : quelle sorte de personne on est. Elle ne change pas.

### Première vie : le Geôlier le dit, deux fois

Deux bandeaux, deux lignes chacun (règle des 37 colonnes vérifiée), **seulement à la première vie** du compte.

**À l'arrivée à la Borne**, avant le texte du lieu :

> Tu es mort. Celle-ci, je te la prête.
> Au sud, les cordes. Descends.

**À la première Croisée** :

> Au fond, la Porte Scellée. Passe-la,
> et cette vie est à toi.

Et le premier écran de la Borne est réécrit pour montrer ce qu'il vient de dire :

> La lande s'ouvre sous un crépuscule qui ne tombe pas. Une pierre seule au milieu du plateau, et à trois pas, un homme immobile, face au sud.
>
> Plein sud, au bout du plateau, une colonne de fils tombe du ciel sans rien toucher. C'est là qu'on descend.

Le tas d'offrandes et le mot gravé « Hier, le pendu de la colline a répondu » passent sur l'écran suivant, avant les boutons qui les utilisent.

### Le repère permanent : la colonne de cordes

Les cordes de la Falaise viennent du ciel en permanence (règle du 03/09). On peut donc les voir **de partout**, comme une tour à l'horizon. Chaque environnement les montre un peu plus grandes, dans la première marche qui le traverse :

| environnement | ce qu'on voit au sud |
|---|---|
| I. La Lande | un trait sombre à l'horizon, qu'on pourrait prendre pour de la fumée |
| II. Les Gibets | depuis la crête, une colonne : on distingue que ce sont des fils |
| III. Le Hameau | rien. Les toits la cachent, et personne ici ne lève la tête vers le sud |
| IV. Le Sud | elle occupe tout le ciel |

L'environnement III est le plus intéressant : **la clause du Serment « tu ne regardes pas le sud » a enfin un objet**. Le village interdit de regarder la chose vers laquelle le joueur marche.

Côté images, il faut trois vues de marche où la colonne grandit (I, II, III). La quatrième existe déjà (`scene_falaise_au_loin_a`).

### Chaque environnement le rappelle

Une ligne par environnement, dans sa scène obligatoire, toujours dite par quelqu'un.

| environnement | qui | ce qu'il dit |
|---|---|---|
| I | l'Hésitant (*existant, à resserrer*) | « Tu descends. Vous avez tous le même pas, ceux qui descendent. » |
| II | la Fiancée du Gibet (*neuve*) | « Tu vas aux cordes. Ils t'arrêteront avant, au village. » |
| III | le vieux du Serment | « On ne te chasse pas. Mais tu descends, ça se voit à ton pas. » La réplique existe, mais seulement dans un des sept accueils du village : elle passe au muret du Serment, que tout le monde voit. |
| IV | le Veilleur (*existant*) | « Tu descends. Évidemment que tu descends. » Aujourd'hui il faut aller le voir : il parle dès l'arrivée à la Palissade. |

### Les vies suivantes

On ne répète pas le discours du Geôlier. L'écran « Te revoilà » dit déjà que le contrat court toujours. La colonne de cordes reste à l'horizon : ce n'est pas du texte, c'est le paysage.

### À corriger dans le même lot

Deux textes contredisent déjà la Falaise. L'escalier de la Descente a été supprimé le 31/08, mais :

- le Codex dit encore « L'escalier au-delà du portillon » (fiche *La Descente*) et « des marches balayées de frais » (fiche *La Palissade Sud*) ;
- « Regarder par-dessus », chez le Veilleur, montre « des marches larges, taillées ».

Dès que l'objectif nomme les cordes, ces trois textes enverraient le joueur chercher un escalier.

Et la carte Figma 2112:325 place la Borne près du bord **sud**, alors que les textes la mettent au **nord** (« le côté nord porte les marques de ceux qui entrent »). Le jeu n'utilise pas ces coordonnées, mais le Graphe si. Les textes font foi : la carte est à réaligner.

---

## 2. Quatre environnements, un bestiaire équilibré

### Le découpage

On entre au nord par la Borne, on sort au sud par la Falaise. Chaque environnement est un pas vers le sud, et chacun explique une partie du monde.

| | environnement | entrée (obligatoire) | lieux tirés | fin (obligatoire) | ce qu'il apprend au joueur |
|---|---|---|---|---|---|
| I | **La Lande** | la Borne | 2 parmi : Chemin Creux, Mare aux Regards, Verger Noir | — | le but, le dé, **l'Appel** |
| II | **Les Gibets** | la Colline aux Gibets | 2 parmi : Champ des Fixés, Maison du Bailli, Moulin Arrêté | — | **la Fixation** |
| III | **Le Hameau** | le Seuil et le Serment | 2 parmi : Chapelle, Marché Muet, Petit Tribunal, Puits Condamné, Tour de Guet | la nuit | **le Serment, le procès, le Témoin** |
| IV | **Le Sud** | le Chemin du Sud | la Palissade | la Falaise aux Cordes | **la Descente** |

C'est le modèle des Salines (entrée, lieux tirés, fin). Il remplace ou simplifie quatre mécanismes ajoutés un par un depuis juillet : l'enclave du Hameau, la garantie de la Colline, la garantie des chapitres et la route scriptée de la première vie. L'ordre des environnements **est** la route.

Soit 13 lieux par traversée, contre 10 à 12 aujourd'hui en comptant la nuit, le Chemin du Sud et la Falaise.

### Le bestiaire par environnement

Chaque environnement a au moins deux rencontres hostiles et deux amicales, plus un phénomène. Comme pour les Salines, certaines sont attachées à un lieu, d'autres surgissent entre deux lieux, une fois par vie.

| | hostiles | amicales | phénomène |
|---|---|---|---|
| I. La Lande | la Bête des Chemins Creux · **l'Épouvantail Tourné** | l'Hésitant · le Marcheur à rebours · les Époux du Verger | le Troupeau sans Berger |
| II. Les Gibets | le Pendu Mal Fixé · le Chien du Bailli | le Pendu qui parle · le Fossoyeur · **la Fiancée du Gibet** · la Petite Fixée *(rare)* | les Corbeaux du Compte · **l'Ombre du Grand Gibet** |
| III. Le Hameau | **la Ronde** · **la Corde Vive** · **le Juge de Cendre** | la Femme au Seuil · le Gamin · la Veuve · le Colporteur · l'Écrivain · **le Déserteur du Tribunal** | le poids sur le toit |
| IV. Le Sud | la Meute Grise · le Recousu | le Veilleur | l'Appelé · le grimpeur |

**En gras, les sept nouvelles.** Le Hameau n'avait aucun combat : son seul danger était le Soupçon. Il a maintenant trois rencontres hostiles.

### Les sept nouvelles rencontres

Cinq ont déjà leur image en réserve (ouvertes avant d'écrire ces lignes). Deux sont à produire.

**L'Épouvantail Tourné** · I · hostile, surnaturel · *image à produire*
Un épouvantail au milieu de la bruyère, sans champ à garder. Il ne bouge jamais, mais chaque fois que tu regardes ailleurs, il s'est tourné vers toi. Lui tourner le dos le fait avancer. Qui a marché avec le Marcheur à rebours sait quoi faire : passer à reculons, les yeux sur lui.

**La Fiancée du Gibet** · II · amicale · *image existante* (`monstre_fiancee_du_gibet_b` : une femme en robe blanche sous une potence, soleil derrière)
Elle vient chaque soir sous la potence de son fiancé, en robe de noce. C'est elle qui dit la loi en clair : « Il a entendu l'Appel. On l'a fixé pour qu'il ne descende pas. Je viens pour qu'il ne tienne pas tout seul. »

**L'Ombre du Grand Gibet** · II · phénomène · *image existante* (`monstre_ombre_grand_gibet_a` : la potence vide sur la crête)
Le Grand Gibet est vide, mais au coucher son ombre porte un pendu. Les corbeaux regardent l'ombre, pas la potence. C'est la première trace du Témoin.

**La Ronde** · III · hostile, social et physique · *image à produire*
Les quatre passages de la nuit, comptés en encoches dans la grange depuis juillet et jamais rencontrés. Des hommes avec une lanterne et une corde, qui vérifient que chacun dort où il doit. Qui est dehors se cache, montre qu'il a juré, ou court.

**La Corde Vive** · III · hostile, surnaturel · *image existante* (`monstre_corde_vive_c` : une corde qui ondule seule dans un couloir de pierre)
Aujourd'hui un simple choix verrouillé à la Chapelle. Elle devient une vraie rencontre : une corde qui se déroule d'elle-même vers ton cou.

**Le Juge de Cendre** · III · hostile, social · *image existante* (`monstre_juge_de_cendre_c` : une silhouette en capuche derrière un banc de pierre, dans une salle en ruine qui brûle)
L'image montre un intérieur, pas une colline : il va au Hameau, pas aux Gibets où la fiche de zone le rangeait. Derrière le Petit Tribunal, la salle du premier tribunal, brûlée. Il y siège encore et pose les questions de l'Ordonnance. Une mauvaise réponse, et il écrit ton nom : le lendemain, le village l'a lu.

**Le Déserteur du Tribunal** · III · amical · *image existante* (`monstre_deserteur_tribunal_a` : un homme qui dévale les marches d'un tribunal, des papiers qui volent)
Le seul juré qui a dit non. Il se cache depuis, et il explique le procès avant que le joueur n'y soit : « Ici, on juge à l'unanimité. Si un seul dit non, c'est lui qu'on juge. Alors plus personne ne dit non. »

---

## 3. Une histoire par lieu, qui se creuse de vie en vie

### Le principe

Chaque lieu a **quatre couches d'histoire**. On en découvre une de plus à chaque fois que le compte repasse par ce lieu (le compteur de passages par lieu existe déjà).

| couche | ce qu'elle révèle | quand |
|---|---|---|
| 1 | **ce qu'on voit** | premier passage |
| 2 | **ce qui s'est passé** | deuxième passage |
| 3 | **qui** | troisième passage |
| 4 | **le fil** : le lien avec le Témoin, l'Appel ou la Descente | quatrième passage |

C'est aussi ce qui règle le problème du joueur perdu. **La première vie ne montre que la couche 1** : le monde clair (l'Appel, la Fixation, le Serment, la Descente). Les mystères, comme la Petite Fixée, la première expédition ou la date du Grand Gibet, arrivent dans les vies suivantes, à mesure qu'on revient. Beaucoup de textes déjà écrits n'ont pas à être réécrits : il suffit de les ranger dans la bonne couche.

Une règle reste inchangée : le héros ne se souvient de rien. Ce n'est pas lui qui comprend mieux, c'est **le monde** qui en montre plus. Des traces laissées par tes morts, des gens qui parlent plus à ceux qui reviennent.

### Comment ça se voit

- **À l'arrivée**, un paragraphe du lieu est remplacé par celui de la nouvelle couche. Même nombre d'écrans.
- **Parfois, une action nouvelle** n'existe qu'à partir d'une couche (poser la question à la personne qu'on vient de découvrir).
- **Dans le Codex**, la fiche du lieu se remplit : « Le Champ des Fixés — 2/4 », chaque couche avec son « Découvert par Braise — Jour II ». On voit ce qu'il reste à trouver.

### Trois lieux écrits en entier

**La Mare aux Regards** (I)

1. Une eau noire où les roseaux ne bougent pas. Tu te penches : ton reflet se penche aussi, une demi-seconde après toi. Il finit par te rattraper.
2. La berge est usée à un seul endroit, à la largeur de deux genoux. Des gens viennent s'y agenouiller, toujours au même. Ils ne boivent pas. Ils vérifient quelque chose dans l'eau et repartent vite.
3. Ce matin, la place est prise. Une vieille femme à genoux, le nez au-dessus de l'eau. « Le mien est en retard depuis vingt ans. Je viens voir s'il a pris de l'avance. » La Doyenne se relève et s'en va sans t'avoir regardé.
4. Le retard, c'est l'Appel qui commence. Le jour où le reflet ne rattrape plus, on vient te chercher avec une corde. La Doyenne tient depuis vingt ans, et personne au village ne le sait.

**La Colline aux Gibets** (II)

1. Sur la crête, les potences se suivent comme des bornes. En contrebas, un corps de ce mois, un écriteau cloué sur la poitrine : un nom, une date, et au-dessus un seul mot, FIXÉ. On ne l'a pas pendu pour le tuer. On l'a pendu pour qu'il tienne.
2. La file se lit de bas en haut, comme une chronologie. Les plus vieilles potences n'ont plus de corde ; les plus récentes n'en ont jamais manqué. On pend plus souvent qu'avant.
3. Le nom du Grand Gibet a été gratté au couteau. À la lunette, depuis la Tour, on lit ce qu'il en reste : ce n'est pas un nom. C'est une date.
4. C'est le jour où les corbeaux sont arrivés. Avant, le village jugeait seul. Depuis, quand il juge, quelque chose regarde, et l'ombre du Grand Gibet porte quelqu'un qui n'y a jamais été pendu.

**La Chapelle des Cordes** (III)

1. Des cordes pendent du plafond le long des deux murs, chacune tressée pour un nom. Au fond, l'autel debout. Une femme tresse, assise, et ne lève pas la tête.
2. Les cordes neuves n'ont pas encore de nom. La Veuve tresse d'avance, comme le Fossoyeur taille d'avance. Ici, on prépare les places avant d'avoir les gens.
3. Une seule corde est défaite chaque matin, au même nœud. La Veuve la refait depuis trente ans sans demander qui. « Je la refais. C'est tout ce qu'on m'a demandé. »
4. Les marques sur le nœud ne sont pas des coups de lame. Ce sont des doigts, petits. Quelqu'un le défait chaque nuit, avec soin, comme on défait ses lacets. Et le seul enfant des Landes qui ne grandit plus vit à l'ouest.

### Le fil de chaque lieu

Les couches se répondent d'un lieu à l'autre. Cinq fils traversent la zone : **la première expédition**, **l'Appel**, **la Fixation**, **la Petite Fixée** et **le Témoin**.

| lieu | 1. ce qu'on voit | 2. ce qui s'est passé | 3. qui | 4. le fil |
|---|---|---|---|---|
| **I. La Lande** | | | | |
| Borne Frontière | la pierre, l'homme immobile, la colonne au sud | les offrandes : les affaires de ceux qui ne sont jamais arrivés au village | les plus vieilles marques du nord : celles des premières expéditions, dont les chiens sont restés (la Meute) | les trois marques du sud : ceux qui sont revenus *(existant, le Sceau)* |
| Chemin Creux | les talus, la charrette au coude | la charrette des premières expéditions, chargée de pieux | le Marcheur en était le cocher. Il a fui, et depuis il recule | la Bête ne garde pas le chemin contre ceux qui entrent, mais contre ceux qui repartent |
| Mare aux Regards | *(voir plus haut)* | | | |
| Verger Noir | les fruits de cendre, les Époux | onze rangs, un par an | chaque rang porte le prénom d'un enfant parti vers le sud | le douzième attend un prénom qu'ils refusent d'écrire |
| **II. Les Gibets** | | | | |
| Colline aux Gibets | *(voir plus haut)* | | | |
| Champ des Fixés | les poteaux entre les stèles | les poteaux vierges, taillés d'avance | l'Emplacement Vide : le seul poteau qu'on ait retiré *(existant)* | le poteau à ton nom, qui prend une date à chaque mort *(existant)* |
| Maison du Bailli | les fenêtres murées, le Chien | l'ordre de garder, jamais levé | dedans : la chaise tournée vers la porte, la fenêtre sur le moulin *(existant)* | les marques à hauteur d'enfant : il comptait les jours de quelqu'un *(existant)* |
| Moulin Arrêté | les ailes immobiles, le vrai sommeil | quelqu'un y vit, que le village ne voit pas | la Petite Fixée, huit ans depuis quarante ans *(existant)* | pourquoi le Moulin est sûr : on ne condamne pas qui on refuse de voir *(existant)* |
| **III. Le Hameau** | | | | |
| Seuil du Hameau | la barrière sans garde, le silence | le Serment, et ce que veut dire chaque clause | la Femme au Seuil, quarante ans de silence | elle avait huit ans le jour de la Fixation ratée. Elle a vu *(existant)* |
| Chapelle des Cordes | *(voir plus haut)* | | | |
| Marché Muet | on y négocie par gestes | un mot dit à voix haute peut être un aveu | le Colporteur revend les affaires posées au Chemin du Sud | il reconnaît les visages de ceux qui reviennent *(existant)* |
| Petit Tribunal | la salle de travers, l'Ordonnance | on y juge à l'unanimité | le Déserteur, le seul juré qui a dit non | quand tout le monde est d'accord, elle vient : le signe en marge du registre |
| Puits Condamné | les planches clouées, l'eau qui bouge | on y descend des choses | les Mains du Puits | on l'a condamné parce qu'on y entendait l'Appel mieux qu'ailleurs |
| Tour de Guet | couchée dans l'axe du Grand Gibet | le Guetteur, resté debout à côté | ce qu'elle guettait : les cordes | elle est tombée le soir où quelque chose est venu les regarder aussi |
| La nuit (grange) | la barre dehors, les combles cloués | la ronde et ses quatre passages | le poids sur le toit *(existant)* | la barre dehors n'enferme pas : elle signale une grange occupée *(existant)* |
| **IV. Le Sud** | | | | |
| Chemin du Sud | les affaires posées, pointes vers le sud | ceux qui les ont posées ne fuyaient pas | le manteau plié : poches vidées, puis remises *(existant)* | les bottes rangées côte à côte sont à ta pointure |
| Palissade Sud | les pointes tournées vers l'intérieur | le Veilleur compte les départs | la colonne des retours, vide, et un signe en tête | ce signe est le même qu'en marge du registre du Tribunal : le Témoin compte aussi |
| Falaise aux Cordes | les cordes du ciel, le vide | les pieux vierges : ceux des premières expéditions | les cordes tranchées par en dessous *(existant)* | au bord, il reste. Il ne descend pas : il regarde ceux qui descendent |

---

## 4. Le Grand Témoin : comment on l'introduit

La règle : **son rôle est dit clairement, sa nature jamais.** Le joueur sait ce qu'il fait et quand il vient, sans jamais savoir ce qu'il est. Il entre en quatre temps, un par environnement, et chaque fois plus près.

| | temps | ce qu'on voit | ce qu'on en dit |
|---|---|---|---|
| I | **un signe** | parmi les marques de la Borne, un petit signe en forme de plume, plus frais que les autres | rien |
| II | **une ombre** | l'Ombre du Grand Gibet, et les corbeaux qui regardent l'ombre plutôt que la potence | le Pendu qui parle : « Depuis qu'on pend, il y a quelque chose qui regarde. Il n'a jamais touché personne. Il n'en a pas besoin. » |
| III | **une présence** | le poids sur le toit de la grange *(existant)*, la silhouette au bout de la ruelle *(existant)* | le Déserteur : « Quand tout le monde est d'accord, elle vient. » |
| IV | **un face-à-face** | au bord de la Falaise, debout parmi les pieux | rien. Il ne te suit pas. Il te regarde descendre |

Au Moulin, la Petite Fixée l'appelle déjà « celle qui regarde » *(existant)* : qui la rencontre en apprend un nom, jamais davantage.

Le troisième temps change le procès : le joueur sait maintenant pourquoi un jugement à l'unanimité est dangereux, et il le craint pour une raison précise. L'apparition au procès, qui existe déjà, devient la suite logique de ce qu'on lui a dit.

Une image est à produire pour le quatrième temps (le Témoin au bord de la Falaise). Garde-fou habituel : jamais de visage, jamais de membres, jamais ce qu'il y a sous le manteau.

---

## 5. Le rythme par environnement

Les durées validées le 24/09, complétées avec le nouveau bestiaire.

| environnement | durée | lieux | jets | combats | rencontres amicales | phénomène |
|---|---|---|---|---|---|---|
| I. La Lande | 5 min | 3 | 3 | 1 (la Bête ou l'Épouvantail) | 1 à 2 | le Troupeau |
| II. Les Gibets | 8 min | 3 | 4 | 1 (le Pendu Mal Fixé ou le Chien) | 1 à 2 | les Corbeaux, l'Ombre |
| III. Le Hameau | 10 min | 4 | 4 | 1 (la Ronde, la Corde Vive ou le Juge) | 2 | le toit |
| IV. Le Sud | 7 min | 3 | 4 | 1 (la Meute, ou le Recousu) | 1 | l'Appelé |

Environ trente minutes et quinze jets par traversée. Ces budgets peuvent devenir un garde de build, comme le plancher de lieux des Salines.

---

## 6. Ordre de travail proposé

| lot | contenu | taille |
|---|---|---|
| **A. Le but, dit** | les deux bandeaux du Geôlier, la Borne réécrite, la colonne dans les textes de marche, les quatre lignes de rappel, les trois textes d'escalier corrigés | petit, et indépendant du reste |
| **B. Les quatre environnements** | les Landes passent au modèle des Salines, cartons d'environnement | gros : c'est le plus vieux code du jeu |
| **C. Le bestiaire** | les sept nouvelles rencontres | moyen |
| **D. Le Témoin en quatre temps** | l'Ombre, les deux répliques, le face-à-face | petit |
| **E. L'histoire par lieu** | les couches 2 à 4 des dix-huit lieux, le Codex en « 2/4 » | gros : c'est surtout de l'écriture |

Je propose de commencer par **A** : il répond au joueur perdu tout de suite, même avant que les environnements existent. Puis B, qui porte le reste. Puis C et D, puis E.

Images à produire : trois vues de marche avec la colonne, l'Épouvantail Tourné, la Ronde, le Témoin au bord de la Falaise. Soit six images.

---

## 7. Ce qu'il faut trancher

1. **La promesse de la Porte Scellée.** Que gagne le héros s'il passe ?
   - (a) **« cette vie est à toi »** *(recommandé)* : c'est la suite logique de la première clause du Pacte (« il te sera prêté une vie »), et venant d'un Geôlier qui aime nos échecs, on peut en douter ;
   - (b) « tu sauras qui tu étais » : il te rend ta mémoire ;
   - (c) « tu seras libre » : tu sors de son Registre.
2. **Le plancher de lieux.** La règle des Salines impose quatre lieux par environnement. Appliquée aux Landes, la traversée passerait de 13 à 16 lieux, et la Lande n'a pas assez de lieux pour varier. Je recommande **trois lieux par environnement pour les Landes**, qui restent la zone d'apprentissage.
3. **Le bestiaire.** Les sept nouvelles rencontres te vont-elles ? En particulier le Juge de Cendre au Hameau plutôt qu'aux Gibets, à cause de son image.
4. **Les quatre couches par lieu.** Le principe, et les trois lieux écrits en exemple : est-ce le ton et la profondeur que tu veux ? Si oui, j'écris les quinze autres.
5. **L'ordre des lots.** A d'abord, puis B ?
