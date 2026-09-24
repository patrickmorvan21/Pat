# Les Landes v2 — proposition du 24/09

Réponse aux quatre retours de Patrick du 24/09, **mise à jour le soir même** après sa deuxième lecture : le but du *jeu* (et non plus seulement des Landes), le bestiaire élargi à 49 rencontres, et le Graphe qui montre les Landes en quatre environnements. **Rien n'est codé dans le jeu** : ce document attend ses arbitrages (section 7). Tout ce qui est marqué *existant* est déjà écrit dans le jeu ; tout ce qui est marqué *neuf* est à écrire.

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
| **E. L'histoire par lieu** | les couches 2 à 4 des dix-huit lieux, le Codex en « 2/4 » | gros : c'est surtout de l'écriture |

Je propose de commencer par **A** : il répond au joueur perdu tout de suite, même avant que les environnements existent. Puis B, qui porte le reste. Puis C et D, puis E.

Images à produire : trois vues de marche avec la colonne, puis les dix-huit du bestiaire (quinze rencontres, trois lieux). Soit vingt et une images, commandées lot par lot au rythme du lot C.

---

## 7. Ce qu'il faut trancher

1. **La Porte.** Deux questions, une recommandation pour chacune.
   - *La nommer ?* **Oui** *(recommandé)* : « la Porte Scellée », déjà dans le Pacte. Le mystère se met ailleurs : ce qu'il y a derrière, qui l'a scellée, si elle s'ouvre (section 0).
   - *Que gagne-t-on à la passer ?* **On sort du Domaine, et cette vie est à toi** *(recommandé)* : c'est la suite logique de la première clause du Pacte (« il te sera prêté une vie »), et venant d'un Geôlier qui aime nos échecs, on peut en douter. Les autres pistes restent possibles : te rendre ta mémoire, ou te rayer de son Registre.
2. **Le plancher de lieux.** La règle des Salines impose quatre lieux par environnement. Appliquée aux Landes, la traversée passerait de 13 à 16 lieux. Je recommande **trois lieux par environnement pour les Landes**, qui restent la zone d'apprentissage.
3. **Le bestiaire.** Les vingt-deux nouvelles rencontres et les trois lieux te vont-ils ? Lesquelles écarter ou remplacer ? En particulier : le Rabatteur (le seul qui peut faire reculer d'un lieu), les Voix Basses (qui choisissent une Croisée à ta place) et le Condamné du lendemain (qui peut te faire porter sa croix).
4. **Les quatre couches par lieu.** Le principe, et les trois lieux écrits en exemple : est-ce le ton et la profondeur que tu veux ? Si oui, j'écris les quinze autres.
5. **Le Grand Registre classe-t-il par profondeur ?** Proposé : d'abord l'acte, puis la zone atteinte, puis les lieux franchis. Le but du jeu devient le score.
6. **L'ordre des lots.** A d'abord (le but, dit), puis B (les quatre environnements), puis C (le bestiaire) ?
