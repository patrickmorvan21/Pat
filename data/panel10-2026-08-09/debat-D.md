# PACTUM — débat, position D (vétérane roguelike, thèse MÉTA)

## 1. Convergences — ce que mes 5 vies confirment
- **C1, mortalité quasi nulle** : 4 survies sur 5, dont une à **0,16 de santé** sans mourir. Ma seule mort fut le procès du Soupçon, exactement son 9-morts-sur-14. Confirmé et redoublé : je ne jouais même pas la ligne « observation » optimale, je jouais salement, et j'ai survécu quand même.
- **F, « Entrer dans le hameau » éjecte dans la lande** : 3 vies sur 3, sur serment tenu ET refusé. A2 le voit aussi. C'est le faux raccord le plus reproductible du jeu.
- **F #9, les promesses ne se paient jamais** : je porte la **Mèche Nouée** (« Si tu le croises. Il saura. »), je regarde l'Appelé descendre pendant un écran entier, aucune option. Idem le Caillou du gamin, la Dame du Moulin déjà derrière moi. F trouve le Grelot et la Clé : ce n'est pas un oubli, c'est une catégorie entière.
- **A2 #6, un lieu meurt d'un seul choix** : « Goûter un fruit » au Verger a effacé les Époux qui bêchaient au fond. Pour moi c'est le pire ennemi de la rejouabilité — pas parce qu'on rate du contenu, mais parce qu'on ne sait pas qu'on l'a raté.
- **A2 #1** : « Tu as traversé les Landes vivant » dément la prémisse — et constitue **la totalité** de la récompense de victoire. (Comme A2, j'ai vu l'écran de mort réimprimer mot pour mot le texte du jet fatal.)

**Même cause que F ? Oui, et c'est le point central du débat.** L'amnésie intra-run de F et l'amnésie inter-run que je décris ne sont pas deux bugs voisins : il manque **un seul objet — un registre que la prose consulte** — et il manque à trois portées. Portée écran (le beat suivant ignore le palier), portée run (le Bailli se re-présente deux jours plus tard), portée compte (la vie 5 s'ouvre au mot près comme la vie 1). Le `vu` que F réclame, la besace que sa prose doit lire, et mes corbeaux/poteaux/dettes sont le même mécanisme à trois échelles de temps. **Si l'équipe le construit avec un champ de portée (`ecran` / `run` / `compte`) dès le premier jour, ma thèse coûte ensuite presque rien.** Si elle le code en booléen `vu` par nœud, il faudra tout refaire pour la portée compte. C'est ma seule vraie exigence sur le plan de F.

## 2. Contestations
**À C1 : non, on ne rend pas la mort probable avant de la rendre payante. Le genre est unanime.**
- **Hades** : la toute première chose construite par Supergiant n'est pas la difficulté, c'est **la Maison** — Hypnos qui commente *comment* tu viens de mourir, le Miroir, Zagreus qui remonte. Le jeu est notoirement doux pour un roguelike (Mode Dieu inclus), et la montée en létalité, le **Pacte de Châtiment**, est *opt-in* et arrive après. On ne revient pas 40 fois chez Hadès parce que c'est mortel ; on revient parce que Achille a une nouvelle réplique.
- **Slay the Spire** : l'**Ascension** ne se déverrouille **qu'après une première victoire**. Durcir avant que le joueur ait une raison de revenir, c'est le mode de désinstallation le plus classique du genre.
- **Inscryption** : mourir en acte 1 est facile et gratuit — l'intérêt n'est pas la rareté de la mort, c'est la **carte qu'on fabrique avec son cadavre** et qu'on recroise dans le paquet suivant. Létalité basse, mort mémorable.
- Formulé net : **la létalité sans boucle, c'est du churn.** Aujourd'hui PACTUM me tuerait plus souvent, et je relancerais moins — parce que la relance ne promet rien de neuf.

**Mais C1 a raison sur un point que j'intègre à ma thèse** : une mort **illisible** ne peut jamais être rendue payante. Son problème 5 — un pile ou face seuil 13 sur une jauge invisible, à santé 1.00 — n'est pas un désaccord avec moi, c'est un **prérequis**. On ne médite pas sur une trappe. Ce que je refuse, c'est de monter le *taux* ; ce que j'adopte sans réserve, c'est de corriger la *forme*.

**À F : sa plomberie sert ma boucle, elle ne la retarde pas — à une condition.** Le retour au Bailli après lui avoir coupé la corde, le poteau retrouvé à son nom, la Femme au Seuil recroisée la mèche en poche : ce sont *déjà* des scènes de mémoire, et ce sont exactement les briques dont ma méta a besoin. Le seul risque de retard serait de traiter le « déjà vu » comme une passe de correction cosmétique. C'est une fondation, pas un correctif.

## 3. Arbitrage de l'ordre
**PLOMBERIE → MÉTA → ÉQUILIBRE**, avec une exception de C1 tirée en phase 1.
1. **F d'abord**, mais *écrit à la spec méta* : un registre unique à trois portées, plus les deux lints (la prose ne nomme rien que l'état ne porte pas ; aucun beat partagé entre deux paliers). C'est le socle, et F a raison de dire que tout contenu ajouté avant multiplie les faux raccords.
2. **Ma méta ensuite**, et elle devient bon marché : la portée compte du même registre suffit à faire les corbeaux, le poteau du prédécesseur et la dette héritée.
3. **L'équilibre de C1 en dernier**, et **en échelle opt-in façon Ascension**, pas en nerf global.
**Tiré en phase 1** : supprimer la mort-couperet du procès (plancher/plafond du soupçon, jauge rendue lisible en fiction). Elle empoisonne les trois thèses à la fois — F ne peut pas la raccorder, je ne peux pas la rendre payante, C1 la mesure comme 2 morts sur 3.
Note à A2 : son inversion obligatoire/optionnel n'est pas une quatrième thèse, c'est le **contenu** que la plomberie doit transporter. Elle se règle en phase 1-2, pas à part.

## 4. Suggestions de gameplay
**Les miennes (rappel compact)** — (a) **le Registre debout** : mes héros morts plantés dans le Champ des Fixés, redresser le poteau du précédent donne ce que seul ce mort-là pouvait léguer ; (b) **la Dette qui traverse la mort** : une promesse morte avec son porteur rouvre au suivant, tenue par le PNJ (« Tu marches pas comme lui — comme *l'autre* non plus ») ; (c) **les Corbeaux** comme difficulté racontée et *remboursable* en tenant une dette ; (d) **la Borne se souvient** : côté sud, le nom du héros précédent.

**Sur celles des autres :**
- C1, plancher/plafond du soupçon + procès légalisé — **ADOPTÉE**, phase 1, prérequis des trois thèses. Son « un échec sur quatre doit coûter » : **ADOPTÉE amendée** — le coût doit être une **empreinte**, pas des points de santé (une jauge invisible qui baisse n'apprend rien).
- C1, **l'empreinte** (jeton par nature d'échec) — **ADOPTÉE, ma préférée de tout le panel.** C'est un coût lisible, c'est de la mémoire que la prose peut lire (donc ça sert F), et une empreinte qui *survit à la mort* est littéralement la Relique promise par l'intro. Trois thèses servies par une mécanique.
- C1, la **veille** qui taxe le regard — **REJETÉE telle quelle, ADAPTÉE.** Dans un jeu de lecture, l'observation *est* le contenu : la taxer par une horloge cachée punit exactement le joueur qu'on veut garder (personne ne met un compteur sur « lire son deck »). Le bon coût est **diégétique et social** : regarder longtemps, dans un village d'indicateurs qui interdit justement de « regarder le sud plus qu'il ne faut », doit être **vu**. Exposition, pas endurance.
- C1, **crédit social / dette du hameau** — **ADOPTÉE**, et c'est ma thèse à portée run : qu'on la déclare `compte` et elle devient l'héritage entre deux vies.
- F, registre « déjà vu » — **ADOPTÉE, amendée du champ de portée** (voir §1).
- F, **lint objets & savoir impossible** — **ADOPTÉE**, meilleur rapport coût/effet du panel : ça tue « le fer du puits » jamais vu et les objets sortis du néant sans écrire une ligne de fiction.
- F, beat indexé sur le palier + clôture obligatoire par issue — **ADOPTÉE** : c'est aussi la réponse narrative au « 20 naturel qui aggrave » de C1.
- A2, un des trois noms côté sud de la Borne est le tien — **ADOPTÉE et fusionnée avec la mienne** : que ce soit le nom du **héros précédent**. Sa version résout le sujet, la mienne résout la boucle ; ensemble, sur le même écran, à la même ligne, elles ne coûtent qu'une fois.
- A2, les trois aubes du Serment jouées — **ADOPTÉE** (c'est le contrat central signé puis oublié), mais c'est du contenu neuf : après la plomberie.
- A2, le trait barré répété sans commentaire — **ADOPTÉE**, gratuite : c'est de la mémoire *construite par le joueur*, la seule qui traverse les morts sans une ligne de code.
- A2, « traversé les Landes **entier** » — **INSUFFISANTE seule.** Le mot est juste, mais l'écran terminal n'a pas un problème d'adjectif : il n'a pas de conséquence.

## 5. Mon top 3 pour l'équipe entière
1. **Un registre, trois portées (`ecran` / `run` / `compte`).** La priorité de F, écrite à la spec de la mienne. C'est le même chantier ; le faire à une seule portée, c'est le payer deux fois.
2. **Tuer la mort-couperet invisible, sans monter la létalité.** Le procès légalisé (plancher, plafond, jauge lisible en fiction) + l'**empreinte** de C1 à la place des ponctions forfaitaires. Une mort qu'on voit venir est une mort dont on peut tirer quelque chose ; le durcissement global vient après, en échelle opt-in.
3. **La Borne se souvient.** Côté sud, le nom du héros précédent — celui de A2 et le mien fondus — et une ligne du Geôlier. Le jeu sait déjà écrire ça (« Tu as mis moins de temps que le précédent. Il est mort plus loin, cela dit. ») ; il le dit simplement **après** le moment où je décide de rester.
