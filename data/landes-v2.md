# Les Landes v2 — proposition du 24/09

Réponse aux quatre retours de Patrick du 24/09, **mise à jour le soir même** après sa deuxième lecture : le but du *jeu* (et non plus seulement des Landes), le bestiaire élargi à 49 rencontres, et le Graphe qui montre les Landes en quatre environnements. **Mise à jour du même jour : les quatre couches d'histoire des dix-huit lieux sont écrites** (section 3), sur le ton que tu as validé. **Rien n'est codé dans le jeu** : ce document attend ses arbitrages (section 7). Tout ce qui est marqué *existant* est déjà écrit dans le jeu ; tout ce qui est marqué *neuf* est à écrire.

Le découpage et le bestiaire proposés sont **écrits dans `data/zones/landes.json`** (marqués « proposé ») et se voient dans le Graphe : quatre cercles de gauche à droite, les propositions en creux.

---

## Le but du jeu, en une phrase

Ce qui manquait au joueur perdu, ce n'est pas l'histoire des Landes : c'est **le but du jeu lui-même**. Le voici, dit en une fois :

> **Tu es mort. Le Geôlier te prête une vie, une seule, dans un monde qu'il garde. La seule sortie est en bas : trois niveaux, plusieurs zones chacun, et au fond une porte. Descends le plus loin possible.**

Elle doit faire comprendre quatre choses, et seulement quatre :

| | ce que le joueur doit savoir | où c'est dit |
|---|---|---|
| 1 | **Tu n'as qu'une vie.** Elle est prêtée, pas donnée. | le Pacte *(existant)*, le premier bandeau du Geôlier |
| 2 | **Tu es chez lui.** Le Domaine est un monde que le Geôlier garde, et il te regarde. | *neuf* : le premier bandeau (« Ici, c'est chez moi »). Aujourd'hui, rien ne le dit en clair |
| 3 | **On n'en sort que par le bas.** | le second bandeau du Geôlier, la colonne de cordes au sud |
| 4 | **Trois niveaux, plusieurs zones chacun, et au fond la Porte.** | le Pacte (« trois actes, du seuil jusqu'à la Porte Scellée ») *(existant)*, le carton de chaque acte |

**Le but, c'est la Porte. Le score, c'est la profondeur.** Presque personne n'arrivera au fond, et c'est voulu : ce qu'on mesure d'une vie, c'est jusqu'où elle est descendue. Le Geôlier le dit déjà à qui lui demande qui il est : « Ce qui m'intéresse, c'est jusqu'où tu iras. » *(existant)* Le Grand Registre devrait donc classer par profondeur d'abord (l'acte, puis la zone atteinte), puis par lieux franchis. Aujourd'hui il ne classe que par lieux franchis, ce qui avait du sens tant qu'il n'y avait qu'une zone *(à trancher, 7.5)*.

### La Porte : la nommer, ou garder le mystère ?

Je recommande de **la nommer**, et de mettre le mystère ailleurs.

- Un but a besoin d'un nom pour qu'on le garde en tête d'une vie à l'autre. « La Porte Scellée » est déjà dans le Pacte : le joueur l'a lue avant de signer.
- Le mystère ne tient pas au nom, il tient à trois questions qu'on ne résout jamais : **ce qu'il y a derrière**, **qui l'a scellée**, et **si elle s'ouvre**. On peut les poser dix fois sans y répondre.
- Et il y a un écho gratuit : le **Sceau** que le survivant porte dans la paume. Une porte *scellée*, une marque *de sceau*. On ne l'explique jamais.

L'autre voie, dire seulement « une porte », rend le but plus flou au moment même où on cherche à le rendre clair. Je la déconseille.

### « Un monde qu'il garde », pas « qu'il a créé »

Dire que le Geôlier a *créé* le monde en fait le maître, sans reste. Dire qu'il le *garde* laisse une question ouverte : un gardien peut être gardé à son tour. C'est la porte du twist du Prisonnier (le Geôlier comme masque), prévu pour plus tard. La phrase reste vraie dans les deux cas ; ce n'est pas le cas de « créé ».

### Et les Landes, dans ce monde

Le premier pays que tu traverses a choisi la loi inverse de la tienne : **ceux qui vivent ici ont renoncé à descendre. Quand l'un d'eux commence à entendre l'Appel, ils le pendent pour qu'il tienne.** Toi, tu dois descendre.

Tout le reste de la zone en découle : l'Hésitant qui entend l'Appel « comme des gens qui parlent dans la maison d'à côté », la Mare qui sert à vérifier s'il a commencé, la Fixation qui pend ceux qui l'entendent, la Palissade aux pointes tournées vers l'intérieur, le Serment qui interdit de regarder le sud, et le village qui te soupçonne parce que tu descends (« ça se voit à ton pas »). Le but du jeu et la loi du pays se contredisent : c'est ce qui fait tenir le Soupçon, le procès et la Fixation.

---

## 1. L'objectif, dit en clair

### Les trois questions

À tout moment, le joueur doit pouvoir répondre à trois questions.

| question | réponse | qui la porte |
|---|---|---|
| **Qui je suis** | Un mort. On t'a prêté une vie. Pour ceux d'ici, tu es « un de ceux qui descendent ». | Le Geôlier, puis les villageois |
| **Pourquoi je suis là** | Le Pacte. La seule sortie du Domaine est en bas : trois niveaux, et au fond la Porte Scellée. La passer, c'est sortir, et garder cette vie *(à trancher, voir 7.1)*. | Le Geôlier |
| **Où je vais** | Au sud, vers la colonne de cordes qu'on voit à l'horizon. | Le paysage, à chaque environnement |

La Révélation (« Je commence à te voir ») répond déjà à l'autre sens de *qui je suis* : quelle sorte de personne on est. Elle ne change pas.

### Première vie : le Geôlier le dit, deux fois

Deux bandeaux, deux lignes chacun (règle des 37 colonnes vérifiée), **seulement à la première vie** du compte.

**À l'arrivée à la Borne**, avant le texte du lieu :

> Tu es mort. Ici, c'est chez moi.
> Au sud, les cordes. Descends.

La vie prêtée n'a pas besoin d'être répétée : le Pacte vient de le dire (« Il te sera prêté une vie. Une seule. »). Ce qu'aucun écran ne dit encore, c'est **à qui est ce monde**.

**À la première Croisée** :

> Trois niveaux, et au fond, la Porte.
> Descends aussi loin que tu pourras.

« La Porte » suffit ici : le Pacte vient de la nommer en entier, et la phrase doit tenir en deux lignes.

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

En écrivant les couches, trois autres fiches du Codex se sont révélées fausses par rapport au jeu :

- *Le Puits Condamné* : « l'eau, en bas, bouge ». Or le jeu dit, quand on y descend, que **ce puits n'a jamais eu d'eau**.
- *La Tour de Guet* : « elle s'est couchée d'un bloc ». Or le Guetteur dit que **ce sont les villageois qui l'ont couchée**.
- *Le Verger Noir* : les deux silhouettes sont « redressées ». Or l'image, et le texte depuis le 03/09, les montrent **penchées sur la bêche**.

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

Retour du 24/09 : « ça manque de monstres, je veux découvrir de nouvelles rencontres quand on rejoue ». Le bestiaire passe de **27 à 49 rencontres**, soit **22 nouvelles**, et trois lieux de plus. Aucune n'est un monstre de plus pour faire nombre : chacune illustre une partie de la loi du pays (l'Appel, la Fixation, le Serment, la Descente).

| | hostiles | amicales | phénomènes | total |
|---|---|---|---|---|
| I. La Lande | la Bête · **l'Épouvantail Tourné** · **les Voix Basses** · **les Enlisés** · **le Rabatteur** | l'Hésitant · le Marcheur à rebours · les Époux du Verger | **le Vent qui ment** | 9 |
| II. Les Gibets | le Pendu Mal Fixé · le Chien du Bailli · **le Fixeur** · **les Mesureurs** · **le Rouissard** | le Pendu qui parle · le Fossoyeur · la Petite Fixée *(rare)* · **la Fiancée du Gibet** | les Corbeaux du Compte · l'Emplacement Vide · le Troupeau sans Berger · **l'Ombre du Grand Gibet** | 13 |
| III. Le Hameau | les Mains du Puits · **la Ronde** · **la Corde Vive** · **le Juge de Cendre** · **le Condamné du lendemain** · **les Pleureuses** | la Femme au Seuil · le Gamin · la Doyenne · la Veuve · le Colporteur · le Rebouteux · l'Écrivain · le Sonneur · **le Déserteur du Tribunal** | le poids sur le toit · **le Jeu du Fixé** | 17 |
| IV. Le Sud | la Meute Grise · le Recousu · **les Attendants** · **le Meneur** | le Veilleur · **Celui qui attend** | l'Appelé · le grimpeur · **la Harde qui descend** · **le Témoin au bord** | 10 |

**En gras, les nouvelles.** Le Hameau n'avait qu'un danger, le Soupçon : il a maintenant cinq rencontres hostiles, toutes sociales ou surnaturelles, jamais un combat à l'épée.

Une correction au passage : le Troupeau sans Berger passe de la Lande aux **Gibets**. Sa brebis retourne au Champ des Fixés ; il a sa place là où on compte les pendus.

### Comment rejouer fait découvrir

Une traversée ne peut pas tout montrer, et c'est ce qui fait qu'on rejoue. Trois mécanismes se cumulent, tous déjà présents dans le jeu ou dans les Salines :

1. **Les lieux sont tirés.** Chaque environnement tire deux lieux parmi trois à cinq. Une traversée voit donc à peu près la moitié des lieux de chaque environnement.
2. **Chaque lieu a plusieurs rencontres, et une visite n'en joue qu'une.** À la Colline, on parle au Pendu, ou on écoute la Fiancée, ou on se fait mesurer par le Fixeur. Les actions sont exclusives depuis le 13/08.
3. **Les rencontres de passage surgissent entre deux lieux**, comme le chantier des Salines : au plus une par environnement et par traversée, jamais deux fois dans la même vie. Proposé en plus : on sert d'abord celles que le compte n'a **jamais** vues (le registre du déjà-vu existe). Les quatre premières vies ne se ressemblent donc pas.

Ordre de grandeur : une traversée croise **8 à 10 rencontres sur 49**. Il faut cinq ou six vies pour avoir tout vu, et les couches d'histoire (section 3) continuent de changer ce qu'on voit longtemps après.

### Les vingt-deux nouvelles rencontres

Rangées par environnement. *Passage* veut dire qu'elle surgit entre deux lieux, une fois par vie. Toutes sont écrites dans `data/zones/landes.json`, marquées « proposé », et visibles dans le Graphe en cercles creux.

**I. La Lande**

- **L'Épouvantail Tourné** · passage · hostile, surnaturel · *image à produire.* Un épouvantail au milieu de la bruyère, sans champ à garder. Il ne bouge jamais, mais chaque fois que tu regardes ailleurs, il s'est tourné vers toi. Lui tourner le dos le fait avancer. Qui a marché avec le Marcheur à rebours passe à reculons, les yeux sur lui.
- **Les Voix Basses** · passage · hostile, surnaturel · *à produire.* Derrière les murets, au crépuscule, des voix parlent comme dans la maison d'à côté : c'est l'Appel. Elles disent le nom que tu as signé. Y répondre, c'est faire un pas vers le sud sans l'avoir décidé : la Croisée suivante est choisie pour toi. L'Hésitant a dit de ne jamais répondre.
- **Les Enlisés** · la Tourbière · hostile, physique · *à produire.* Des mains remontent entre les touffes : ceux qui ont voulu couper au sud par le marais. Ils ne tirent que ce qui s'arrête. Les piquets de ceux qui ont réussi montrent où poser le pied.
- **Le Rabatteur** · passage, aussi aux Gibets et au Sud · hostile, social · *à produire.* Un Renonçant à cheval qui ramène ceux qui marchent vers le sud. « Où tu vas ? » Mentir, il regarde ton pas ; fuir, il te rattrape ; le suivre, c'est reculer d'un lieu. Marcher à rebours te fait passer pour quelqu'un qui revient.
- **Le Vent qui ment** · passage · phénomène · *image existante* (`monstre_vent_qui_ment_b`). Un ruban de vent apporte l'odeur d'un lieu qui n'est pas là. À la Croisée qu'il traverse, l'un des deux indices ment. L'Instinct le sent.

**II. Les Gibets**

- **Le Fixeur** · la Colline · hostile, physique · *à produire.* Celui qui fixe. Pas un bourreau : il ne tue personne, il fait tenir. Il essaie ses nœuds sur tout ce qui passe, « juste pour voir si tu tiens ». Le laisser faire, c'est qu'au procès on saura que ta corde est prête. Qui a lu l'Ordonnance lui montre qu'il n'a aucun des quatre signes.
- **La Fiancée du Gibet** · la Colline · amicale · *image existante* (`monstre_fiancee_du_gibet_b`). Chaque soir, en robe de noce, sous la potence de son fiancé. C'est elle qui dit la loi en clair : « Il a entendu l'Appel. On l'a fixé pour qu'il ne descende pas. Je viens pour qu'il ne tienne pas tout seul. »
- **L'Ombre du Grand Gibet** · la Colline · phénomène · *image existante* (`monstre_ombre_grand_gibet_a`). Le Grand Gibet est vide, mais au coucher son ombre porte un pendu. Les corbeaux regardent l'ombre, pas la potence. La première trace du Témoin.
- **Les Mesureurs** · la Chènevière · hostile, social · *à produire.* Deux vieux prennent la mesure de chaque passant avec une ficelle à nœuds : « Pour la corde, on prend les mesures d'avance. » Tricher sur la mesure, c'est une corde qui ne tiendra pas.
- **Le Rouissard** · la Chènevière · hostile, physique · *à produire.* Dans les routoirs où le chanvre pourrit, quelque chose de long et de pâle. Il ne quitte jamais la vase : on lui échappe en s'éloignant du bord, jamais en le combattant.

**III. Le Hameau**

- **La Ronde** · la Grange · hostile, social · *à produire* (le Rôdeur en réserve peut dépanner). Les quatre passages de la nuit, comptés en encoches dans la grange et jamais rencontrés. Des hommes avec une lanterne et une corde. Qui est dehors se cache, montre qu'il a juré, ou court.
- **La Corde Vive** · la Chapelle · hostile, surnaturel · *image existante* (`monstre_corde_vive_c`). Aujourd'hui un choix verrouillé, elle devient une vraie rencontre : une corde qui se déroule d'elle-même vers ton cou. Couper, c'est la réveiller.
- **Le Juge de Cendre** · le Petit Tribunal · hostile, social · *image existante* (`monstre_juge_de_cendre_c`). Dans la salle du premier tribunal, brûlée, il siège encore et pose les questions de l'Ordonnance. Une mauvaise réponse, et le lendemain le village a lu ton nom. Son image est un intérieur : il va au Hameau, pas aux Gibets.
- **Le Déserteur du Tribunal** · le Petit Tribunal · amical · *image existante* (`monstre_deserteur_tribunal_a`). Le seul juré qui a dit non. « Ici, on juge à l'unanimité. Si un seul dit non, c'est lui qu'on juge. Alors plus personne ne dit non. »
- **Le Condamné du lendemain** · passage · hostile, social · *image existante* (`monstre_fixe_confident_b`). La croix de craie lui est montée jusqu'au visage : on le fixe à l'aube. Il essaie de te passer sa craie : « Elle ne s'efface pas. Elle se donne. » La loi de substitution en un geste.
- **Les Pleureuses** · passage · hostile, social · *à produire.* Trois femmes chantent la complainte du prochain fixé, avec ton nom. Si elles vont au bout, tout le village l'a entendu. Changer le nom, c'est donner celui de quelqu'un d'autre.
- **Le Jeu du Fixé** · passage · phénomène · *à produire.* Des enfants jouent au procès, l'un avec une croix de craie sur la joue. Ils t'invitent à faire le juge. Le jeu suit les vraies règles : on les apprend là, avant d'en avoir besoin. Aucune corde dans l'image, la craie seulement.

**IV. Le Sud**

- **Celui qui attend** · le Chemin du Sud · amical · *à produire.* Un jeune homme attend son père, parti vers le sud il y a trois ans. Il te tend une lettre « pour en bas ». Premier objet qui peut descendre jusqu'aux Salines.
- **Les Attendants** · le Camp · hostile, surnaturel · *à produire.* Autour d'un feu froid, les hommes de la première expédition attendent l'ordre de partir, depuis quarante ans. Ils te demandent si c'est l'heure. Qui sait que le Marcheur était leur cocher peut donner l'ordre à sa place.
- **Le Meneur** · le Camp · hostile, physique · *à produire.* Le plus vieux chien de la Meute, couché sur les chaînes, un collier gravé au nom du maître de l'expédition. Le réveiller appelle les autres. Avec la clochette de meneuse, il te suit jusqu'au bord et s'arrête : les chiens ne descendent pas.
- **La Harde qui descend** · passage · phénomène · *à produire.* Au crépuscule, une harde traverse le chemin, toutes les bêtes tournées vers le sud, et passe la lèvre du gouffre sans un bruit. Même les bêtes entendent l'Appel.
- **Le Témoin au bord** · la Falaise · phénomène · *à produire.* Au bord, parmi les pieux, quelque chose de haut. Il ne te suit pas. Il te regarde descendre. Le quatrième temps du Témoin (section 4).

### Trois lieux de plus

Ils agrandissent le tirage là où il était le plus court, pour que deux traversées ne voient pas les mêmes endroits.

| | lieu | ce que c'est |
|---|---|---|
| I | **La Tourbière** | une étendue noire à l'ouest du plateau. Sous l'eau, des visages qui ne pourrissent pas : le raccourci que tout le monde a essayé une fois |
| II | **La Chènevière** | le champ de chanvre d'où viennent toutes les cordes, et ses routoirs. On y cultive les pendaisons avant qu'elles aient lieu |
| IV | **Le Camp des Premières Expéditions** | des tentes pourries autour d'un feu froid, des chaînes de chiens vides. C'est d'ici que les premiers sont partis pour les cordes, ou n'en sont jamais partis |

Le Sud passe ainsi d'un lieu tiré à un sur deux (la Palissade ou le Camp).

### Les images

Sept des vingt-deux rencontres ont déjà leur image en réserve (ouvertes avant d'écrire ces lignes). Restent **18 images à produire** (15 rencontres, 3 lieux), plus les trois vues de marche où la colonne de cordes grandit (section 1). Les prompts s'écriront avec la recette du 15/09, lot par lot, dans l'ordre où les rencontres entrent dans le jeu.

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
- **Une couche peut se jouer ailleurs que sur l'écran d'arrivée**, quand c'est là qu'elle se voit : les couches 3 et 4 de la Maison du Bailli se lisent de l'intérieur, celles de la Grange au fil de la nuit. Le moteur sait déjà le faire (une strate de familiarité peut viser un autre écran du lieu et y remplacer un paragraphe).
- **Parfois, une action nouvelle** n'existe qu'à partir d'une couche (poser la question à la personne qu'on vient de découvrir).
- **Dans le Codex**, la fiche du lieu se remplit : « Le Champ des Fixés — 2/4 », chaque couche avec son « Découvert par Braise — Jour II ». On voit ce qu'il reste à trouver.

### Les dix-huit lieux, écrits

*Ton validé par Patrick le 24/09 ; les quinze autres lieux ont été écrits le même jour. Les trois exemples (la Mare, la Colline, la Chapelle) n'ont pas bougé. Les mêmes textes sont rangés dans `data/zones/landes.json` (champ `couches`) et se lisent dans le Graphe, sur la fiche de chaque lieu.*

#### I. La Lande

**La Borne Frontière**

1. Une pierre seule au milieu du plateau, plus haute qu'un homme. À son pied, un tas d'offrandes. À trois pas, un homme immobile, face au sud. Tout au sud, sur l'horizon, un trait fin descend du ciel et ne bouge pas.
2. Les offrandes ne sont pas pour la pierre. Chacun laisse ici une chose à lui en entrant, la plus petite possible : un clou, un ruban, une croûte de pain. Personne ne les reprend. Pourtant le tas ne grossit pas : chaque matin, il en manque une.
3. Les plus vieilles marques du côté nord sont tout en bas, presque effacées : une liste de noms taillés au même outil, le même jour. En dessous, d'autres noms, plus courts, sans rien après. Des noms de chiens. Ceux-là partaient ensemble, avec leurs bêtes.
4. Côté sud, trois marques seulement. On ne grave pas au retour quand personne ne revient : ces trois-là, quelqu'un est revenu les faire. Elles ne sont pas gravées, elles sont enfoncées, comme si on avait appuyé sur la pierre à pleine paume jusqu'à ce qu'elle cède.

**Le Chemin Creux**

1. Le chemin s'enfonce entre deux talus plus hauts que la tête, et le ciel devient un ruban. Une charrette penche au premier coude, depuis si longtemps que la bruyère l'a prise. Dans le creux, quelqu'un vient vers toi, de dos.
2. Sous la bâche pourrie, la charrette est chargée de pieux, tous taillés à la même longueur et marqués au fer. Elle allait vers le sud. Le harnais pend, coupé net à la lame.
3. Sous le siège, un grelot de cuivre verdi, celui d'un attelage. L'homme qui marche à reculons contourne la charrette sans jamais la regarder. C'était lui, le cocher. Il a coupé le harnais un jour, et depuis trente ans il marche à reculons.
4. La bête qui tirait la charrette n'est jamais partie. Elle ne dépasse jamais le coude où la charrette s'est couchée, et elle n'attaque que ce qui lui tourne le dos : ce que son cocher a fait, le jour où il a coupé le harnais.

**La Mare aux Regards**

1. Une eau noire où les roseaux ne bougent pas. Tu te penches : ton reflet se penche aussi, une demi-seconde après toi. Il finit par te rattraper.
2. La berge est usée à un seul endroit, à la largeur de deux genoux. Des gens viennent s'y agenouiller, toujours au même. Ils ne boivent pas. Ils vérifient quelque chose dans l'eau et repartent vite.
3. Ce matin, la place est prise. Une vieille femme à genoux, le nez au-dessus de l'eau. « Le mien est en retard depuis vingt ans. Je viens voir s'il a pris de l'avance. » La Doyenne se relève et s'en va sans t'avoir regardé.
4. Le retard, c'est l'Appel qui commence. Le jour où le reflet ne rattrape plus, on vient te chercher avec une corde. La Doyenne tient depuis vingt ans, et personne au village ne le sait.

**Le Verger Noir**

1. Des arbres fruitiers plantés en rangs, le seul ordre voulu de la lande. Ils ont des branches, des feuilles noires, et des fruits qui mûrissent en cendre. C'est pire que s'ils étaient morts. Au fond, deux silhouettes penchées sur la même bêche.
2. Les rangs sont onze, et leurs écarts s'élargissent en s'éloignant de la souche du bout : un rang par an. Tout est parti de ce premier arbre, dont il ne reste que la souche. Au fond, un douzième rang est creusé, et vide.
3. L'homme ne compte pas ses coups de bêche. Il récite onze prénoms, toujours dans le même ordre : les enfants du hameau partis vers le sud, un par an. Chaque rang en porte un. Le premier prénom est celui de leur fils.
4. Le douzième rang, c'est lui qui l'a commencé, et c'est elle qui l'a arrêté. Depuis, elle bêche à côté de lui et ne le laisse jamais lever la tête. Elle sait quel prénom irait dans ce rang : le sien à lui. Il l'entend déjà.

#### II. Les Gibets

**La Colline aux Gibets**

1. Sur la crête, les potences se suivent comme des bornes. En contrebas, un corps de ce mois, un écriteau cloué sur la poitrine : un nom, une date, et au-dessus un seul mot, FIXÉ. On ne l'a pas pendu pour le tuer. On l'a pendu pour qu'il tienne.
2. La file se lit de bas en haut, comme une chronologie. Les plus vieilles potences n'ont plus de corde ; les plus récentes n'en ont jamais manqué. On pend plus souvent qu'avant.
3. Le nom du Grand Gibet a été gratté au couteau. À la lunette, depuis la Tour, on lit ce qu'il en reste : ce n'est pas un nom. C'est une date.
4. C'est le jour où les corbeaux sont arrivés. Avant, le village jugeait seul. Depuis, quand il juge, quelque chose regarde, et l'ombre du Grand Gibet porte quelqu'un qui n'y a jamais été pendu.

**Le Champ des Fixés**

1. Il y a eu un cimetière ici : des stèles penchées dont plus personne ne lit les noms. Entre elles, on a planté des poteaux, en rangées, un nom sur chaque, tous face au nord. Même morts, surtout morts, on ne les laisse pas regarder le sud.
2. Au fond, des poteaux attendent, déjà plantés, sans nom. Le Fossoyeur les taille d'avance. Pour savoir qui viendra, il regarde les toits du hameau : « Six corbeaux sur la même maison, je taille. Je me trompe jamais. »
3. Au milieu d'une rangée pleine, il manque un poteau. Pas arraché : descellé proprement, et le trou rebouché. Le Fossoyeur sait lequel sans lever la tête. C'est le seul qu'on ait jamais retiré, et personne ne lui a demandé d'en tailler un autre.
4. Parmi les poteaux vierges, l'un porte ton nom, gravé de frais. Dessous, une date pour chaque vie tombée avant la tienne, et la place pour d'autres. On a prévu large.

**La Maison du Bailli**

1. Une maison seule à l'ouest du hameau, haute, sans voisine. Chaque fenêtre est murée de l'intérieur, en rangs serrés, par quelqu'un qui prenait son temps. Contre le seuil, une masse grise, immobile, sauf les oreilles, qui te suivent depuis ton premier pas.
2. C'est un chien, trop grand, le poil usé aux endroits d'un harnais qu'il ne porte plus. Son maître pend à la colline. Personne n'a jamais levé l'ordre qu'il lui avait donné, et le chien fait encore sa ronde aux mêmes heures, autour d'une porte que personne n'essaie plus d'ouvrir.
3. Dedans, une seule chaise, au milieu, tournée vers la porte. Sous ses pieds avant, deux ronds creusés dans la terre battue. Une seule fenêtre n'est pas murée, sur le mur ouest. De la chaise, et de la chaise seulement, elle cadre le moulin.
4. Sur le mur, des marques par cinq. Elles commencent à hauteur d'homme et descendent : il s'est assis pour continuer. La dernière série s'arrête à hauteur d'enfant, sans son cinquième trait. Il comptait des jours, et ce n'étaient pas les siens.

*Les couches 3 et 4 se lisent de l'intérieur, ou par le trou du chien.*

**Le Moulin Arrêté**

1. Le moulin a gardé ses quatre ailes, ouvertes en croix sur le couchant. Le vent couche la bruyère jusqu'à son pied, et elles ne bougent pas. Leur ombre non plus. La porte est entrouverte, entretenue. Dedans, on dort d'un vrai sommeil.
2. Quelqu'un vit ici. Un lit de bruyère refait de frais, bien trop court pour un adulte. À hauteur d'enfant, des jours comptés par cinq, sur des années. Sur la marche, du pain dur et de l'eau, déposés par quelqu'un du hameau qui ne veut pas qu'on le voie.
3. Elle a huit ans, et elle les a depuis quarante ans. Elle aligne des cailloux sur la pierre de la meule. « Ils m'ont pendue un mardi. Ça n'a pas pris. » Sur la poutre, le meunier a noté le jour où les ailes se sont arrêtées : un mardi.
4. Rien ne se pose jamais sur le toit du moulin : pas un corbeau, pas un poids la nuit. Sur ceux du hameau, si. Elle parle de ce qui s'y pose comme d'une voisine qu'elle n'a jamais croisée : « Celle qui regarde. Elle m'a jamais vue. »

#### III. Le Hameau

**Le Seuil du Hameau**

1. Des toits au creux du plateau, une seule cheminée qui fume sur vingt, et aucun chien n'aboie. La barrière n'a pas de garde. Sur chaque linteau, une croix à la craie, même hauteur, même main. Sur un seuil, une femme regarde une fenêtre, en face.
2. À la troisième aube, on ne chasse personne : on te demande si tu restes. Tous les vieux du hameau ont répondu oui, un matin, après avoir juré au même muret. Ils avaient ton pas, avant.
3. La femme du seuil ne parle à personne, et personne ne lui parle. Elle regarde la même fenêtre depuis quarante ans. Depuis trois hivers, elle regarde aussi le sud, par où son fils est parti. Quand on lui demande, elle dit « deux ».
4. Elle avait huit ans le jour où la corde n'a pas pris. Quand les grands sont partis manger, on l'a oubliée là, et elle a vu la petite défaire le nœud toute seule. Le lendemain, tout le hameau lui a dit qu'elle n'avait rien vu. Elle attend depuis qu'on la croie.

**La Chapelle des Cordes**

1. Des cordes pendent du plafond le long des deux murs, chacune tressée pour un nom. Au fond, l'autel debout. Une femme tresse, assise, et ne lève pas la tête.
2. Les cordes neuves n'ont pas encore de nom. La Veuve tresse d'avance, comme le Fossoyeur taille d'avance. Ici, on prépare les places avant d'avoir les gens.
3. Une seule corde est défaite chaque matin, au même nœud. La Veuve la refait depuis trente ans sans demander qui. « Je la refais. C'est tout ce qu'on m'a demandé. »
4. Les marques sur le nœud ne sont pas des coups de lame. Ce sont des doigts, petits. Quelqu'un le défait chaque nuit, avec soin, comme on défait ses lacets. Et le seul enfant des Landes qui ne grandit plus vit à l'ouest.

**Le Marché Muet**

1. Un marché sans un cri. Des étals de trois fois rien sous des bâches tendues, des marchands qui négocient par gestes. Paumes ouvertes, on passe ; les mains cachées, on se fait regarder. Le premier mot dit à voix haute fait tourner toutes les têtes.
2. Au bout de la rangée, un étal vide, le bois gratté. Il appartenait à un homme qui criait ses prix. Un matin, il a crié seul, face au sud, avant l'arrivée des autres. On l'a fixé le soir même. Depuis, on vend sans parler.
3. Le Colporteur n'est pas du hameau. Il est le seul à passer la barrière sans avoir juré, dans un sens comme dans l'autre. Ce qu'il vend a appartenu à quelqu'un. Il ne dit jamais à qui, et personne ne demande : chacun a peur d'y retrouver quelque chose.
4. Il ne regarde jamais un visage, il regarde le pas. En vingt ans, trois pas sont revenus du sud, et il a vu chacun passer deux fois. La deuxième fois, ils allaient de nouveau vers le sud.

**Le Petit Tribunal**

1. Une salle basse de pierre, plantée de travers par rapport à la rue. Trois bancs face à une chaire, et la chaire face à la porte : ici, même l'entrée est un interrogatoire. Au mur, une feuille clouée, la liste des signes.
2. Personne ne vote. Ceux qui restent assis signent la sentence, ceux qui sortent la refusent. Au fond, un banc est resté de biais, comme si quelqu'un s'était levé le dernier et était parti vite. Depuis, plus personne ne sort.
3. C'était le Déserteur, le seul juré qui soit jamais sorti. Ici, celui qui dit non passe en jugement à la place de l'accusé. Il n'est jamais revenu s'asseoir. Sa place est la seule où la poussière est intacte : on la lui garde.
4. Au Registre des Pendaisons, le petit signe en forme de plume n'est posé qu'à côté des sentences que tous les bancs ont signées. Le Déserteur le dit à sa façon : « Quand tout le monde est d'accord, elle vient. »

**Le Puits Condamné**

1. Un puits condamné de frais : planches neuves, chaînes, blocs de meule empilés. Tout le hameau tombe en ruine, et ça, on l'entretient. Dessous, ça cogne. Trois coups, une pause. Trois coups. Poli, comme on frappe à une porte qu'on va vous ouvrir.
2. On n'y puise plus : on y descend. Ce puits n'a jamais eu d'eau. À dix brasses, la corde s'arrête sur un plancher, et dessus, rangées par tailles, des paires de chaussures propres. Une paire par Fixé.
3. Ce qui cogne tient un registre : trois coups par nom, une pause entre les noms. Ceux qui sont descendus parlent tous d'une main, en bas, qui tient la corde pour toi, comme on tient une porte. Elle ne tire pas. Elle attend que tu passes.
4. On ne l'a pas condamné à cause des coups. On l'a condamné parce qu'on y entendait l'Appel mieux qu'ailleurs, et que le premier Fixé s'était penché dessus pour répondre. Le dernier signe de l'Ordonnance vient d'ici : « répondre à ce qui n'a pas parlé ».

**La Tour de Guet**

1. La tour n'a plus de sommet. Elle s'arrête net à mi-hauteur, et le reste s'est répandu autour de son pied. Quelques blocs posés les uns sur les autres font un siège, usé par-dessus. Par son ouverture, la Colline aux Gibets tombe pile dans l'axe.
2. Elle n'est pas tombée : on l'a couchée. Les pierres ne sont pas éboulées, elles sont rangées, en tas réguliers, par taille. Sur le tas, un homme en manteau de guet se tient debout, dos à toi, et regarde le sud par-dessus le hameau.
3. Dans la meurtrière du sud, des encoches par cinq, des centaines. Le Guetteur sonnait pour chaque silhouette qui marchait vers le sud, et le hameau courait la ramener. Chaque encoche en est une. Sa corne est bouchée à la cire, de l'intérieur.
4. Le dernier soir, il a sonné pour personne : rien ne marchait vers le sud. Ce qu'il avait vu était sur les toits, et regardait le hameau. Voir venir ne servait plus à rien. On a couché la tour, et depuis vingt ans on entend ça : rien.

**La Grange des Renonçants (la nuit)**

1. Au bout du hameau, une grange dont le linteau n'a pas de croix à la craie. De la paille propre, une lampe à la mèche courte, calculée pour s'éteindre seule. La porte se ferme, et tu entends une barre qu'on pose. Dehors.
2. Sur les poutres, des bâtons de comptage, et sous chaque bâton, quatre encoches. On ne compte pas les nuits, ici : on compte les passages de la ronde. Quatre par nuit. Des hommes avec une lanterne, qui ne cherchent pas. Ils comptent.
3. Au cœur de la nuit, le toit travaille. Une poutre plie sous un poids qui remonte le faîtage et s'arrête au-dessus de la porte. Aucun bruit de pas : seulement le bois qui porte quelque chose. Dehors, les corbeaux ne s'envolent pas.
4. La barre ne t'enferme pas et ne te protège pas : elle indique que la grange est occupée. Les nuits où elle est posée, la poutre plie. Les nuits où la grange est vide, jamais. Ce qui monte sur le toit sait lire une barre.

*Les couches se jouent au fil de la nuit, sur les écrans de la grange.*

#### IV. Le Sud

**Le Chemin du Sud**

1. Le plateau cesse d'être un pays : plus de murets, plus de poteaux. Le vent vient du sud et n'a plus le goût de la bruyère. Sur les cent derniers pas, des choses posées à intervalles réguliers : un sac, un manteau plié, des bottes, les pointes vers le sud.
2. Rien n'a été jeté, tout a été posé. Le manteau est plié en quatre, coutures alignées, les poches vidées puis remises à l'endroit. Celui qui l'a laissé là avait le temps. Personne ne le poursuivait.
3. Ce sont les affaires de ceux qui partent sans bagage, d'un pas égal. La dernière borne avant le bord porte leurs noms au nord, serrés jusqu'à ne plus trouver de place. Sa face sud est lisse, creusée au milieu, usée par des paumes. On vient toucher celle-là.
4. Les bottes rangées côte à côte sont à ta pointure. Même longueur que les tiennes, même usure au talon, et le lacet gauche refait deux fois, comme le tien. Elles sont encore sèches. Quelqu'un les a enlevées ici, et il est parti pieds nus.

**La Palissade Sud**

1. Des rondins hauts de deux hommes barrent le plateau, avec un portillon et une guérite éclairée. Les pointes sont tournées vers les Landes, pas vers le sud. Derrière, le sol manque, et l'air y coule comme une eau froide.
2. Ce mur n'a jamais protégé le hameau de ce qui monte : il retient ce qui veut descendre. Autour du verrou du portillon, des griffures à hauteur de mains. Des mains qui voulaient passer, une nuit, et qu'on n'a pas laissées.
3. Le Veilleur note tout le monde : les départs dans une colonne, les retours dans une autre, vide depuis trente ans. « Ceux qui montent, on les laisse monter. C'est descendre qui est interdit. » Il ouvre à ceux qui partent proprement. Les autres, il les note.
4. Il n'a pas commencé la colonne des départs. On la lui a remise déjà ouverte, et on lui dit quoi y mettre. En tête, un petit signe en forme de plume, le même qu'en marge du Registre des Pendaisons. Quelque chose tient ce compte depuis plus longtemps que lui.

**La Falaise aux Cordes**

1. Tu montes une dernière ondulation de pierre, et la lande s'ouvre sur un trou large comme un village, sans fond visible. Du ciel, des cordes descendent dedans, des centaines, venues de si haut qu'on ne voit pas à quoi elles tiennent. Aucune ne bouge.
2. Au ras du bord, des pieux, un tous les trois pas, plus vieux que les cordes. Aucune n'y est nouée. Le bois porte la même marque au fer que les pieux de la charrette du Chemin Creux. Ceux-là sont arrivés jusqu'ici.
3. Trois ou quatre cordes s'arrêtent en plein vide, tranchées net à la lame, par en dessous. Les coupes sont toutes à la même hauteur sous le bord. On ne remonte pas, ici : quelqu'un, en bas, y veille.
4. Parmi les pieux, il y en a un plus haut que les autres, et plus sombre. Il n'était pas là quand tu es arrivé au bord. Il ne te suit pas. Il ne descend pas. Il regarde ceux qui descendent, comme il a regardé tous les autres.

### Le fil de chaque lieu

Les couches se répondent d'un lieu à l'autre. Cinq fils traversent la zone : **la première expédition**, **l'Appel**, **la Fixation**, **la Petite Fixée** et **le Témoin**, plus un sixième, plus mince : **ceux qui sont revenus**.

| lieu | 1. ce qu'on voit | 2. ce qui s'est passé | 3. qui | 4. le fil |
|---|---|---|---|---|
| **I. La Lande** | | | | |
| La Borne Frontière | la pierre, les offrandes, l'homme immobile, le trait au sud | les offrandes : chacun en laisse une en entrant, et chaque matin il en manque une | les plus vieilles marques du nord : une liste gravée le même jour, et des noms de chiens | les trois marques du sud : ceux qui sont revenus |
| Le Chemin Creux | les talus, la charrette au coude, l'homme de dos | la charrette : des pieux marqués au fer, le harnais coupé | le Marcheur en était le cocher | la Bête tirait la charrette : elle ne dépasse pas le coude et n'attaque que les dos tournés |
| La Mare aux Regards | le reflet en retard | la berge usée à deux genoux | la Doyenne | le retard, c'est l'Appel |
| Le Verger Noir | les fruits de cendre, les Époux | onze rangs, un par an, et un douzième vide | onze prénoms, les enfants partis au sud ; le premier était leur fils | le douzième prénom est celui du mari, et il l'entend déjà |
| **II. Les Gibets** | | | | |
| La Colline aux Gibets | le corps FIXÉ | la file comme chronologie | le nom gratté est une date | le jour où les corbeaux sont arrivés |
| Le Champ des Fixés | les poteaux entre les stèles, face au nord | les poteaux vierges, au compte des corbeaux | l'Emplacement Vide, le seul poteau retiré | le poteau à ton nom, une date par vie tombée |
| La Maison du Bailli | les fenêtres murées, la masse grise sur le seuil | le chien, et l'ordre jamais levé | la chaise tournée vers la porte, la fenêtre sur le moulin | les marques qui descendent jusqu'à hauteur d'enfant |
| Le Moulin Arrêté | les ailes et leur ombre immobiles, le vrai sommeil | le lit trop court, le pain déposé | la Petite Fixée ; les ailes arrêtées un mardi | rien ne se pose sur son toit : celle qui regarde ne l'a jamais vue |
| **III. Le Hameau** | | | | |
| Le Seuil du Hameau | la barrière sans garde, les croix, la femme sur le seuil | à la troisième aube, les vieux ont dit oui : ils avaient ton pas | la Femme au Seuil, quarante ans devant la même fenêtre | elle a vu la petite défaire le nœud, et on lui a dit qu'elle n'avait rien vu |
| La Chapelle des Cordes | les cordes tressées pour un nom | on tresse d'avance | une corde défaite chaque matin | des doigts petits : l'enfant de l'ouest |
| Le Marché Muet | on négocie par gestes | l'étal de l'homme fixé pour avoir crié seul face au sud | le Colporteur, seul à passer la barrière sans jurer | trois pas revenus du sud, et repartis vers le sud |
| Le Petit Tribunal | la salle de travers, la chaire face à la porte | rester assis, c'est signer ; un banc de biais | le Déserteur, sa place gardée | le signe en plume n'est posé que sur les sentences unanimes |
| Le Puits Condamné | les planches neuves, les trois coups polis | un plancher, des chaussures rangées par tailles | la main qui tient la corde comme une porte | on y entendait l'Appel : le quatrième signe de l'Ordonnance vient d'ici |
| La Tour de Guet | la tour sans sommet, dans l'axe de la Colline | on l'a couchée ; le Guetteur debout | les encoches : il sonnait pour chaque silhouette partie au sud | le dernier soir, ce qu'il a vu était sur les toits |
| La Grange des Renonçants (la nuit) | le linteau sans croix à la craie, la barre posée dehors | la ronde et ses quatre passages | le poids sur le toit | la poutre ne plie que les nuits où la barre est posée |
| **IV. Le Sud** | | | | |
| Le Chemin du Sud | les affaires posées, pointes vers le sud | tout a été posé, rien jeté | les Appelés, et la dernière borne usée par des paumes | les bottes à ta pointure, enlevées ici |
| La Palissade Sud | les pointes tournées vers l'intérieur | les griffures autour du verrou | le Veilleur et ses deux colonnes | la colonne des départs, déjà ouverte, signée d'une plume |
| La Falaise aux Cordes | les cordes du ciel, immobiles, le trou | les pieux, marqués comme ceux de la charrette | les cordes tranchées par en dessous | un pieu de plus, qui regarde ceux qui descendent |

### Comment les fils se répartissent

| fil | où il affleure (couche) |
|---|---|
| la première expédition | la Borne (3), le Chemin Creux (2, 3, 4), la Falaise (2) |
| l'Appel | la Mare (4), le Verger (4), le Seuil (2), la Tour (3), le Puits (4), le Chemin du Sud (3, 4) |
| la Fixation | la Colline (1), le Champ (2, 4), le Marché (2), le Petit Tribunal (2, 3), le Puits (4) |
| la Petite Fixée | la Maison du Bailli (4), le Moulin (2, 3, 4), le Seuil (4), la Chapelle (4) |
| le Témoin | la Colline (4), le Petit Tribunal (4), la Tour (4), la Grange (3, 4), la Palissade (4), la Falaise (4) |
| ceux qui sont revenus | la Borne (4), le Marché (4) |

Aucun lieu n'explique son fil : chacun en montre un morceau, et c'est en passant de l'un à l'autre, de vie en vie, qu'on les relie. Les trois marques du sud de la Borne et les trois pas revenus du Colporteur, par exemple, ne sont jamais rapprochés par le jeu.

### Ce qui a changé par rapport au premier plan

En écrivant, j'ai aligné six lieux sur ce que le jeu dit déjà :

- **La Borne.** Les offrandes ne sont pas « les affaires de ceux qui ne sont jamais arrivés » : l'objet qu'on y ramasse dit déjà qu'« on les a laissés pour entrer ». La couche 2 le garde, et ajoute qu'il en manque une chaque matin.
- **Le Chemin Creux.** La Bête ne garde pas le chemin « contre ceux qui repartent » : c'est la bête qui tirait la charrette. C'est ce qui explique deux choses déjà écrites, « après le coude, elle suit plus » et « elle attaque ce qui lui tourne le dos ».
- **La Tour de Guet.** Elle n'est pas tombée : le Guetteur dit déjà « Nous » quand on lui demande qui l'a couchée. La couche 4 raconte le soir où ils l'ont décidé.
- **Le Puits.** Il n'a jamais eu d'eau : le jeu le dit quand on y descend. Le Codex, lui, dit que « l'eau bouge » ; c'est à corriger avec le lot A.
- **Le Marché.** Le Colporteur ne revend pas les affaires du Chemin du Sud : le jeu dit que personne n'y touche. Ce qu'il vend a appartenu à quelqu'un, et on ne sait pas à qui.
- **La Palissade.** Le signe en plume est en tête de la colonne des **départs**, comme dans le jeu, pas des retours.

Les trois lieux proposés (la Tourbière, la Chènevière, le Camp des Premières Expéditions) n'ont **pas encore de couches** : j'attends que tu les gardes avant de les écrire.

Un fait neuf, et c'est le plus lourd : **les vieux du hameau ont été des marcheurs**, qui ont dit oui à la troisième aube (le Seuil, couche 2). C'est ce que veut dire leur nom, les Renonçants, et c'est ce qui donne son poids à la question qu'on te pose le troisième matin.

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
| I. La Lande | 5 min | 3 | 3 | 1 (la Bête, l'Épouvantail, les Enlisés ou le Rabatteur) | 1 à 2 | le Vent qui ment |
| II. Les Gibets | 8 min | 3 | 4 | 1 (le Pendu Mal Fixé, le Chien, le Fixeur ou le Rouissard) | 1 à 2 | les Corbeaux, l'Ombre, le Troupeau |
| III. Le Hameau | 10 min | 4 | 4 | 1 (la Ronde, la Corde Vive, le Juge, le Condamné ou les Pleureuses) | 2 | le toit, le Jeu du Fixé |
| IV. Le Sud | 7 min | 3 | 4 | 1 (la Meute, le Recousu, les Attendants ou le Meneur) | 1 | l'Appelé, la Harde |

Environ trente minutes et quinze jets par traversée. Ces budgets peuvent devenir un garde de build, comme le plancher de lieux des Salines.

---

## 6. Ordre de travail proposé

| lot | contenu | taille |
|---|---|---|
| **A. Le but, dit** | les deux bandeaux du Geôlier, la Borne réécrite, la colonne dans les textes de marche, les quatre lignes de rappel, les trois textes d'escalier corrigés | petit, et indépendant du reste |
| **B. Les quatre environnements** | les Landes passent au modèle des Salines, cartons d'environnement | gros : c'est le plus vieux code du jeu |
| **C. Le bestiaire** | les vingt-deux nouvelles rencontres, les trois lieux, le tirage des rencontres de passage | gros : à livrer environnement par environnement |
| **D. Le Témoin en quatre temps** | l'Ombre, les deux répliques, le face-à-face | petit |
| **E. L'histoire par lieu** | brancher les couches 2 à 4 des dix-huit lieux (déjà écrites, section 3), le Codex en « 2/4 » | moyen : l'écriture est faite, reste à la ranger dans le moteur et dans le Codex |

Je propose de commencer par **A** : il répond au joueur perdu tout de suite, même avant que les environnements existent. Puis B, qui porte le reste. Puis C et D, puis E.

Images à produire : trois vues de marche avec la colonne, puis les dix-huit du bestiaire (quinze rencontres, trois lieux). Soit vingt et une images, commandées lot par lot au rythme du lot C.

---

## 7. Ce qu'il faut trancher

1. **La Porte.** Deux questions, une recommandation pour chacune.
   - *La nommer ?* **Oui** *(recommandé)* : « la Porte Scellée », déjà dans le Pacte. Le mystère se met ailleurs : ce qu'il y a derrière, qui l'a scellée, si elle s'ouvre (section 0).
   - *Que gagne-t-on à la passer ?* **On sort du Domaine, et cette vie est à toi** *(recommandé)* : c'est la suite logique de la première clause du Pacte (« il te sera prêté une vie »), et venant d'un Geôlier qui aime nos échecs, on peut en douter. Les autres pistes restent possibles : te rendre ta mémoire, ou te rayer de son Registre.
2. **Le plancher de lieux.** La règle des Salines impose quatre lieux par environnement. Appliquée aux Landes, la traversée passerait de 13 à 16 lieux. Je recommande **trois lieux par environnement pour les Landes**, qui restent la zone d'apprentissage.
3. **Le bestiaire.** Les vingt-deux nouvelles rencontres et les trois lieux te vont-ils ? Lesquelles écarter ou remplacer ? En particulier : le Rabatteur (le seul qui peut faire reculer d'un lieu), les Voix Basses (qui choisissent une Croisée à ta place) et le Condamné du lendemain (qui peut te faire porter sa croix).
4. ~~**Les quatre couches par lieu.**~~ **Tranché le 24/09 : le ton te va.** Les quinze autres lieux sont écrits (section 3). Reste à relire, et à dire s'il faut écrire les couches des trois lieux proposés (Tourbière, Chènevière, Camp des Premières Expéditions).
5. **Le Grand Registre classe-t-il par profondeur ?** Proposé : d'abord l'acte, puis la zone atteinte, puis les lieux franchis. Le but du jeu devient le score.
6. **L'ordre des lots.** A d'abord (le but, dit), puis B (les quatre environnements), puis C (le bestiaire) ?
