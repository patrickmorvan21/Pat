# PACTUM — Diagnostic de playtest complet (7/08/2026, v1.46.1)

**Méthode** : 6 runs entières jouées sur le vrai build (auto-joueur Playwright avec de vrais gestes — drags du dé compris), stratégies variées (toujours le 1er choix / toujours le dernier / exploration maximale des points d'intérêt / aléatoire / risqué / fin de traversée ciblée), comptes neufs et comptes à 3 morts. ~1 600 écrans capturés (texte + image servie + état de la run), croisés avec les audits statiques (densité, cohérence des sources, répétitions, mapping scène→image).

**Couverture atteinte** : intro, Seuil, écran d'acte, 33 scènes distinctes, tous les lieux sauf la Tour de Guet et la Chapelle en profondeur, le village complet (accueils, Serment, Halte), 8 états, le procès avec dépositions, la séquence de mort, la fin de traversée (Descente).

---

## 1. Verdict global

**Techniquement, le jeu est sain.** 0 erreur JS sur ~1 600 écrans, 0 image cassée, 0 requête d'asset en échec, sauvegarde/reprise fiables, densité de texte partout dans la grille (médiane 63 mots/écran, max 118). Le contenu est atteignable : en 5 runs « naïves », tout ce qui compte a été rencontré au moins une fois.

**Narrativement, la grammaire tient.** « Voir de loin → marcher → toucher » se sent vraiment : chaque point d'intérêt a sa vraie image, et les enchaînements de la Colline (corbeaux → cercle → Gibet Vide → poteau du Pendu) ou de la Mare (creux → berge → reflet → miroir) sont exemplaires — le texte et l'image avancent ensemble, écran par écran. La continuité inter-scènes est le point le plus impressionnant : le Pendu qui rappelle le serment prêté du bout des lèvres trois lieux plus tôt, les dépositions du procès qui citent les actes réellement commis avec les bons témoins nommés, la brebis qui ramène au Champ, les franchissements du village dits dans les deux sens.

**Là où ça casse, c'est presque toujours la même cause** : un texte écrit pour UN contexte servi dans un autre (voir §3). Et deux déséquilibres systémiques méritent un vrai arbitrage (§4).

---

## 2. Ce qui marche très bien (à ne pas toucher)

- **Les images par point d'intérêt** : sur ~90 écrans d'exploration observés, l'image servie correspondait au texte à chaque fois. Le travail des lots de juillet-août paie.
- **Les états se vivent** : Hanté attrapé à la Colline → lignes intruses ensuite ; Fixé à la Mare → le hameau change de ton ; Fiévreux sur l'eau bue ; Boiteux après la Meute. Posés, dits, consultables, jamais chiffrés.
- **La mémoire du monde** : serment tenu/trahi rappelé, découverte du Troupeau ressortie par le Fossoyeur, corbeaux comptés selon les morts du compte, accueils du village qui varient (table dressée vue 2×, jamais le même 2 runs de suite).
- **Le procès** : « On ne te lit pas d'acte d'accusation. On appelle des gens, et les gens racontent » — puis le Gamin, l'Écrivain, la Doyenne, chacun sur un acte réel. C'est la meilleure scène systémique du jeu.
- **Le prologue varie** entre comptes (pools de souvenirs différents constatés).
- **La règle « aucun chiffre »** est tenue partout (Anneau, troupeau en toutes lettres, corbeaux en prose).

---

## 3. Incohérences texte/scène/image relevées (du plus au moins grave)

1. **Les « réactions du monde » des états s'insèrent sans regarder la scène.** En pleine rencontre avec la Bête des Chemins Creux (une bête, un chemin creux vide), le héros Fixé lit : « Le barrage s'écarte à ton passage. Ce n'est pas du respect : on ne touche pas un fixé. » Il n'y a ni barrage ni personne. Cause : `Scene.tsx` (~l. 1576) tire une réaction à 40 % à CHAQUE arrivée, sans garde de contexte — or les 2 réactions de FIXÉ décrivent des villageois. → Il faut un tag de contexte par réaction (village / partout), comme les corbeaux du Soupçon qui ne comptent QUE dans le village.

2. **La Meute Grise affirme « Passé les murets du hameau, la lande redevient à eux »** — servie telle quelle à des héros qui ne sont JAMAIS entrés au village (2 des 3 apparitions observées). C'est sa narration fixe (`scene-data.ts` ~l. 4778). → Reformuler sans référence au hameau, ou conditionner la 1ʳᵉ phrase.

3. **L'écran final de la traversée est sur le vieux placeholder.** « Tu as traversé les Landes vivant » s'affiche sur `dithering-portal.jpg` — la photo-portail de juillet, le seul écran du jeu encore dessus. Le moment le plus rare du jeu a la pire image. → Un asset dédié (l'escalier qui plonge, l'air froid qui monte) ; le prompt est facile à écrire.

4. **La conséquence d'un combat se lit par-dessus l'image de marche.** L'issue du jet s'affiche sur l'écran SUIVANT (choix du 19/07) ; quand le suivant est une Croisée, on lit « Ta lame répond pour toi… la meneuse rompt » sur une ruelle du hameau ou un plateau générique. Vu 3× (Meute → rue du village, Bête → liaison, Veilleur). → Garder l'image du combat tant que sa conséquence se lit, ne basculer sur la vue de marche qu'aux choix d'orientation.

5. **Sortir du village après la séquence d'entrée n'est jamais dit.** `hameau-entree-5` (« La rue s'ouvre devant toi. Des volets se ferment… ») se joue dans la rue, mais le Seuil est classé « dehors » — donc partir vers le Pendu n'insère aucune ligne de sortie : rue → crête, sans couture (vécu en runB). → Traiter la fin de la séquence d'entrée comme un intérieur pour la règle de franchissement.

6. **« Les Lisières » vs « Les Landes »** : le carton d'acte et le rappel sous REPRENDRE disent Lisières ; le Geôlier, le bilan de mort et toute la prose disent Landes. Le joueur voit les deux noms sans jamais qu'on lui dise que c'est le même endroit. C'est l'écart Figma/contenu noté depuis le 26/07 — **il est maintenant visible en jeu, il faut trancher**.

7. **Le Moulin a toujours ses ailes.** L'image d'établissement du campement (`scene_moulin_campement_a`) montre quatre ailes ; le point d'intérêt « la croix d'ombres » raconte leur absence, et le lieu s'appelle le Moulin sans Ailes. 3ᵉ génération d'affilée — l'arbitrage traîne depuis le 28/07 (la bonne image `scene_moulin_sans_ailes_d_d.png` existe, un champ à repointer).

8. **« Tu uses « Fiole d'eau de gouttière » »** — à chaque usage d'objet (`Scene.tsx` l. 2308). « User » quelque chose = l'élimer. → « Tu utilises », ou mieux, une vraie phrase (« Tu débouches la fiole. Un peu de force te revient. »).

9. **Les lignes intruses de Hanté peuvent se répéter mot pour mot dans la même vie** (« Quelque chose grince très haut… » servie 2× en runC, à la Mare puis à l'entrée du village). Une phrase « qui n'appartient pas là » répétée verbatim devient un tic de système. → Mémoriser les intruses servies (comme `liaisonVues`).

10. **Deux « Fiole d'eau de gouttière » obtenues dans la même run** (drop de soin générique). Un objet au nom si particulier qui tombe en double casse l'illusion d'objet trouvé. → Écarter les noms déjà en Besace ou déjà obtenus cette vie.

11. ~~Le Moulin sans indice de route~~ — **FAUX POSITIF de mon audit** (la clé `campement:` est écrite sans guillemets, ma regex la ratait) : les 18 destinations sont couvertes, rien à corriger.

12. **La Bête des Chemins Creux est tombée dans 5 runs sur 6**, souvent tôt — et une fois SUIVIE du lieu « Chemin Creux », où l'on arrive « à neuf » alors qu'on vient d'y combattre sa bête. Le pool la tire comme n'importe quel lieu ; son nom la lie pourtant à un lieu précis. → Soit la retirer du pool et la déclencher en approchant du Chemin Creux, soit renommer.

---

## 4. Deux déséquilibres systémiques (à arbitrer, pas à patcher)

**A. L'économie du Jour est à l'envers.** Le Jour n'avance qu'en dormant au Moulin (1 lieu sur 17, jamais garanti) et sur échec dur (+1). Mesuré : la run la plus prudente et la plus exploratrice (12 lieux, 21 scènes, santé 0,95) finit **JOUR 1** ; la run qui échoue finit JOUR 5. Conséquences en chaîne :
- le **Grand Registre classe par jours** → échouer fait mieux marquer que réussir, et le héros méticuleux est dernier des Cent ;
- le Geôlier du fragment (« Un jour. C'est honnête. ») **se moque du joueur qui a tout vu** ;
- les **Besoins comptés en jours ne se déclenchent presque jamais** (aucun besoin échu en 6 runs autrement que par un jet raté) — tout le système dort.
Piste : faire avancer le Jour à la traversée elle-même (tous les N lieux, ou à chaque liaison longue), ce qui rend aussi les Besoins vivants — ou classer le Registre sur autre chose que les jours.

**B. Survivre ne laisse aucune trace.** La Descente = `resetRun()` sec : pas de ligne au Registre, pas de mémoire de compte, pas de marqueur « première traversée », et au retour à l'accueil le Geôlier sert une pique générique (« Je n'ai même pas eu le temps de m'intéresser à toi ») à celui qui vient de réussir ce que « peu font ». La mort donne une relique, un fragment, une entrée au Registre ; la victoire donne un reload. C'est le volet-2 du point 6 du 21/07, jamais construit — après ce playtest, c'est à mes yeux **le manque n°1 du jeu** : c'est l'unique moment où le joueur a fait exactement ce qu'on lui demandait, et c'est le seul que le jeu ne regarde pas.

**Observation liée (à surveiller, peut-être voulue)** : le Soupçon monte vite quand on explore — 3 runs sur 5 finissent à 4-5, la run risquée atteint 6 et le procès. L'exploration est le comportement que le jeu récompense (Savoir, fragments, découvertes) ET celui qui mène au tribunal. La tension est belle, mais un joueur curieux verra le procès presque à chaque vie — sa rareté fait partie de sa force.

---

## 5. Petites notes

- **Embarquement** : ~7 écrans sans décision avant le premier vrai choix (4 clauses + 2 beats d'amorce). Acceptable pour le genre, mais c'est la plus longue séquence passive du jeu.
- Le popup d'aide « rangé dans le menu » et les onglets du Registre de mort ont piégé mon auto-joueur, pas un humain — mais vérifier sur téléphone qu'un tap hors du popup le ferme bien.
- Deux réserves d'outillage (pas de code jeu) : 7 scènes-variantes marquées « orphelines » à tort dans le Studio, et le faux positif du manifeste sur `geolier_accueil_cendres`/`geolier_v2_cendres` (même contenu sous deux noms — un ménage à faire).

## 6. Ordre d'attaque recommandé

1. **La trace du survivant** (§4-B) — Registre + mémoire + image de la Descente (§3-3) en un seul chantier.
2. **L'économie du Jour** (§4-A) — décision de design, puis mécanique simple.
3. Les gardes de contexte des réactions d'état (§3-1) + la phrase de la Meute (§3-2) — deux correctifs courts qui suppriment les pires ruptures d'immersion.
4. L'image de combat qui tient pendant sa conséquence (§3-4) + la sortie du village (§3-5).
5. Le lot des petits correctifs : Lisières/Landes (une décision), moulin (un champ), « Tu uses », intruses mémorisées, drops dédupliqués, indice de route du Moulin, la Bête au pool.
