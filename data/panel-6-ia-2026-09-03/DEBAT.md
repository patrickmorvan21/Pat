# PACTUM — panel 2 (v1.128.3) · LE DÉBAT

Modérateur : six testeurs, six profils, deux transcripts de première run (A1/A3/A5 la « curieuse », A2/A4/A6 la « pressée »), une vie chacun sur la réplique Python. Avant de faire parler qui que ce soit, j'ai vérifié chaque citation dans `paquet/transcripts/`, `paquet/sources/` et `paquet/jouer/pactum.py`. Quand un grief vient de la réplique et pas du jeu, il est requalifié — il reste dans le compte-rendu, mais à sa place.

Convention : **constat** = porté par ≥ 3 profils différents ; *divergence* = éloge chez les uns, grief chez les autres ; (jeu) / (outil) = où vit le défaut, après vérification.

---

## 1. Ce sur quoi tout le monde tombe d'accord

### La Falaise aux Cordes est le moment du jeu — 6 voix sur 6

Pas une divergence. A1 : « Tu tends la main. Il te regarde la tendre — et il tombe, devant toi, sans un cri. La corde remonte, molle, allégée. On ne remonte pas, ici. » (transcript curieux, écran 88). A2, A3, A4, A5, A6 citent **le même passage**, dans les deux transcripts (pressé, écran 143). A5 dit pourquoi ça marche : « Le jeu ne me laisse pas l'aider, et il a raison. » A6 : « Je me suis penché avec lui. »

Le modérateur note qu'aucun des six ne cite la Falaise pour ses CHOIX : ils citent une scène qu'ils ont lue. A5 est la seule à le retourner en grief (voir §4, « le climax se joue sans moi »).

### Le trois cent unième — 5 voix sur 6

A1, A3, A4, A5, A6. La phrase du pendu (« Le trois cent unième était le sien. […] Alors j'ai inscrit le mien en dessous. », curieux écran 32 / pressé écran 34) revient trois fois : comme corde de descente (« Celle du trois cent unième : grise, plus usée que les autres », curieux écran 95), comme arme au procès (« Invoquer le trois cent unième COURAGE », pressé écran 77 — A6), comme clé chez le chien (« Lui dire que son maître s'est jugé [EMPATHIE] », A4, ma vie écran 21). A4 résume ce que les six attendent du jeu : « le jeu m'a laissé porter une phrase d'un lieu à l'autre ».

### Le Marcheur à rebours (A1, A2, A3, A5) et le Geôlier quand il est rare (A1, A2, A4, A5)

Éloges sans contradiction. A2 : « Un personnage entier en trois répliques. » Sur le Geôlier, A4 pose la condition : « Il se moque de moi exactement quand je le mérite. » — c'est ce qui fait qu'à l'inverse la ligne « Tu regardes tout, tu ne risques rien » (§3) est ressentie comme une trahison par trois d'entre eux.

---

## 2. Les constats de grief (≥ 3 profils) — et ce que la vérification en dit

### C1 · Le secret final est offert à qui n'a rien découvert — A1, A3, A5, A6 (jeu, BUG CERTAIN)

« En sortant des Landes, tu sais une chose que le hameau tait : une pendue s'est relevée, et elle marche encore. Elle a huit ans » (curieux écran 96, pressé écran 151). A3 : « On me dit « tu sais », et je ne sais pas. » A1 : « Ça vole le secret à la vie suivante. » A6 ajoute que la Veuve « donne le seul secret qui vaille ici : le nom que la corde coupée refusait de porter » (pressé écran 90) — sans le dire.

Vérifié : dans le transcript curieux, le seul indice de toute la vie est la femme au fagot (« Si tu dors au moulin […] laisse le lit de bruyère », écran 7) — c'est l'AMORCE du chapitre « la Fille ». Le développement (le lit trop court, la corde dans le chiffon) n'est servi qu'au Moulin, jamais visité. Et `components/Scene.tsx:2956` sert `chap.resolution` dès que la scène suivante est terminale, **sans exiger que le développement ait été joué** (`chapSt.stage < 3` au lieu de `>= 2`). Quatre profils différents, une ligne de code.

### C2 · Des gens nommés dans les boutons avant d'exister dans le texte — A1, A2, A3, A5 (jeu, BUG CERTAIN)

« Soutenir le regard des trois hommes » (curieux écran 44) sur un écran qui ne décrit « qu'une femme et un corbeau » (A5) ; les trois hommes arrivent à l'écran 56. « Voir où le gamin veut te mener » (A1 ma vie écran 7, A2 ma vie écran 10) « sans aucun gamin dans le texte ». A1 : « Chaque fois j'ai cru avoir sauté un écran. »

Vérifié : `scene-data.ts` ~2560-2641, scène `hameau-entree-2`. La narration parle d'une femme et d'une silhouette de corbeau ; les trois formes du Gamin (`gamin-empathie`, `gamin-instinct`, `gamin-ruse`, `gamin-courage`) sont des choix à `requiresDominante`, et celui de COURAGE s'appelle « Soutenir le regard des trois hommes » — les hommes du barrage, un écran plus loin. Le libellé est en avance sur la narration, quelle que soit la dominante.

### C3 · Le chien me refuse la maison, et je m'assieds dedans — A2, A4, A6 (jeu, BUG CERTAIN)

Trois vies, trois FUNESTE contre le chien, même écran : « Tu ne passes pas. […] Le chien se recouche entre toi et l'ouverture. Ce sera pour une autre fois, ou pour personne. » suivi de « Suivre les marques du mur / S'asseoir sur la chaise / Défaire la porte et sortir » (A6 ma vie écran 8 ; A4 écran 22 ; A2 écran 24). A4 : « Le texte m'a refusé l'entrée et le jeu m'a fait entrer. » Et c'est le moment où il pose le téléphone.

Vérifié dans `scene-data.ts` 5942-5995 : `chien-du-bailli-2` a une `narrationEchec` (« en te relevant tu es à hauteur du trou du chien, et de là on voit le sol de la pièce en enfilade ») mais **les mêmes trois choix** que l'entrée réussie. Le premier (« Suivre les marques du mur ») est encore lisible par le trou ; « S'asseoir sur la chaise » et « Défaire la porte et sortir » (« Tu ressors par où lui n'est jamais ressorti ») ne le sont pas. Pas un défaut de réplique : les données.

### C4 · La couture d'entrée au village servie à qui n'en est jamais sorti — A1, A3, A5 (curieux, écran 62) + A4, A6 (pressé, écran 82) (jeu, BUG CERTAIN)

« Tu repasses la limite du village sans t'en apercevoir tout à fait » (curieux écran 62) alors que le joueur vient de jurer au muret (58), d'avancer dans la rue (59) et de choisir la chapelle DEPUIS la rue (61). A3 : « on lui raconte une rentrée ». Côté pressé, après la relaxe (« On t'escorte dehors », écran 79) : « Un muret, puis un autre, puis les premiers toits — le village se referme autour de toi » (écran 82). A6 : « J'ai cru avoir été mis dehors ; le texte me fait entrer. »

Cinq profils sur six. Vérifié : le franchissement « entre » est servi entre la fin de la séquence d'entrée (`hameau-entree-5`, ou le procès) et un lieu intérieur strict. Le journal du projet le dit lui-même : « l'`entre` garde le strict intérieur ». C'est une rue → une chapelle : il faut une couture de RUE.

### C5 · La direction choisie n'est jamais atteinte — A1, A3, A5 (jeu, orchestration de démo)

« Vers les rangées de poteaux » (curieux écran 71) → Meute (72-81) → « Passé les silhouettes grises, la lande descend sans prévenir » (82) → Falaise. A1 : « La direction choisie était un mensonge. » Vérifié : c'est la démo qui déclenche la Meute au portillon puis enchaîne la Falaise en dernier lieu ; le bouton d'orientation, lui, promet un lieu du pool.

**Ce que personne n'a vu, et que A1+A3+A5 impliquent ensemble** : à l'écran 74, en plein encerclement (« Le cercle que tu ne vois pas se resserre du même pas »), une phrase de MARCHE est collée sous le texte de la Meute : « Les fougères montent à hauteur d'épaule sur le dernier bout. Aucun bruit à compter, aucune vue d'ensemble. » A1 et A3 la citent comme « sentant le système » ; aucun ne relève qu'elle est **la ligne d'arrivée à couvert du lieu qu'on n'atteindra jamais** (`ARRIVEE_COUVERT`, `scene-data.ts:9040`), servie au milieu d'un combat. Deux griefs séparés, une seule cause : l'arrivée au lieu est calculée avant que la Meute ne l'intercepte.

### C6 · La grange arrive sans qu'on ait marché — A1 (Verger → grange, écran 45), A2 (Chemin Creux → grange, écran 34), A5 (Champ des Fixés → grange, écran 43) (jeu, INCOHÉRENCE)

A2 : « Je suis au fond d'un chemin creux, hors du village, et sans transition je suis dans une rue. C'est le seul moment de la vie où je ne sais plus où je suis. » Vérifié : `Scene.tsx:2485` route directement sur `hameau-halte-1` quand le compte de lieux est atteint, sans liaison ni phrase d'approche ; l'ouverture « Le vieux te trouve avant que tu ne le cherches » est écrite pour couvrir n'importe quel point de départ, et ça se sent.

### C7 · Les routes qui se ferment — griefs A1, A2, A5, A6 ; éloges A3, A4 (*divergence nette*, jeu)

C'est le point le plus intéressant du débat, parce que les profils expliquent tout.

- **A3 (prudent)** et **A4 (téméraire)** adorent : « J'ai compris ce que je payais au moment où je le payais » (A3, écran 38 du curieux, après l'issue sûre face à la Bête) ; « J'ai compris que je payais, et quoi » (A4, après son fruit de cendre). Chez eux, la fermeture suit un ACTE qu'ils ont choisi en connaissance.
- **A1 (curieux)** l'a subie après un FUNESTE devant les trois hommes, puis après le Pendu mal fixé : « Ce que j'ai cru : un bug ou un hasard méchant. […] pas d'une géologie soudaine au milieu d'un village. » (écrans 23 et 31).
- **A2 (pressé)** la lit quatre fois mot pour mot : « Au premier passage c'est une menace ; au quatrième c'est un tampon. »
- **A5 (sociale)** la reçoit **après avoir gagné son procès** (écran 21) et « la seule route restante mène au Pendu qui parle — l'endroit que mon serment m'interdit ». (Réserve du modérateur : dans le transcript pressé, la relaxe est suivie de DEUX directions à l'écran 80 ; cette fermeture-là pourrait être un artefact de la réplique — à rejouer avant de conclure.)
- **A6 (méfiant)** : six fois en deux vies, deux fois le même paragraphe. « Au troisième, le choix de direction est une fiction : je ne choisis plus, je subis le dé. »

Verdict du débat : la mécanique est juste quand la fermeture nomme sa cause et vient d'un acte ; elle devient une punition aveugle quand elle vient d'un dé raté sur un jet qu'on n'a pas vécu comme « dur », et un tampon quand elle tourne sur trois textes. A1 formule le correctif : « que la fermeture parle de l'échec (les trois hommes ont fait passer le mot). »

### C8 · Le danger est illisible, et la sortie ne se mérite pas — A2, A3, A4, A6 (design, constat)

Quatre profils, quatre angles sur la même chose :
- A2 : dix jets, six FUNESTE, sorti vivant à 0,38 — « la mort n'est jamais venue, donc le risque ne pesait rien. Je suis sorti vivant en ratant presque tout. »
- A6 : cinq échecs durs sur six, sorti à 0,04 — « sans que le monde me dise que j'étais à deux doigts de mourir ».
- A4 : mort à 0,05 « sans le savoir » — « je ne sais toujours pas si je suis mort du chien, de la mare ou du tribunal ».
- A3 : dix écrans, zéro dé, Descente, Sceau — « un jeu qui m'a couronné en dix écrans pour n'avoir rien risqué ».

Vérifié pour A3 : `palissade-sud` est dans `TRAVERSAL_POOL` (clé d'`APPROACH`, `scene-data.ts:8097`), `pickLiaisonOptions` ne le retient pas avant un nombre de lieux, et « Passer le portillon » (7205) mène à `falaise-cordes` « qui mène seule à la Descente ». C'est le jeu, pas la table. Le Veilleur ne retient personne.

Réserve du modérateur sur la lisibilité de la santé : le vrai jeu porte l'érosion de l'interface et la nappe KO ; la réplique n'a que des séparateurs `──` qui s'effritent (A4 les a vus, écran 8 → 22 ; A6 n'en parle pas). Une part du « je ne savais pas » est un manque de la réplique. Mais le fond tient : le MONDE ne le dit jamais en mots, et A2 a joué 49 écrans sans qu'aucune phrase ne lui dise qu'il saignait.

---

## 3. Ce qui a été requalifié — venu de la réplique, pas du jeu

Trois griefs portés chacun par trois profils, tous de la table Python, tous vérifiés comme défauts de `pactum.py` ou du kit :

- **« Dormir malgré le crépuscule » ne raconte rien** — A1 (écran 33), A2 (écran 17, qui a vérifié `sortie: {}, rest: true` dans les données), A5 (écran 28). **Outil.** `pactum.py` ne contient aucun traitement de `rest` ; le vrai jeu (`Scene.tsx:4831`) raconte la nuit (`NUIT_OUVERTURE` + ligne de corps), avance le jour, soigne, atténue Entaillé. La preuve est dans le transcript pressé, écran 123 : « Le sommeil vient d'un bloc, sans rêve. » A2 avait raison de comparer les deux — il a juste conclu à l'envers.
- **La conséquence avant l'acte** (craie + Geôlier affichés AVANT le résultat du dé) — A2 (écrans 7, 12), A4 (écrans 3, 16, 18, 28), A5 (écrans 13, 18). **Outil.** `pactum.py` appelle `soupconSeLit()` à la sélection, avant `resoudre()` ; le jeu pousse la manifestation en tête de l'écran SUIVANT (`Scene.tsx:2833-2839`, `3499`).
- **Le jour qui saute en poussant une porte** (A1 : JOUR 3 au Moulin avant qu'on propose de dormir ; A2 : puce en bas de l'écran d'arrivée) — **outil** : la réplique incrémente le jour à l'AFFICHAGE d'une scène de nuit (`pactum.py:454-458`) et l'imprime après les paragraphes ; le jeu le pose à l'arrivée suivante.

Et trois griefs isolés, eux aussi de l'outil :
- A6, « Lui réciter l'ordonnance » offert sans ordonnance : le kit exporte `savoir: "savoir_ordonnance"` **au niveau de la scène** `pendu-mal-fixe`, alors que le `.ts` ne porte ce nom que dans le `masqueSi` d'un CHOIX. L'extracteur a traversé un bloc (le piège habituel), la réplique accorde le savoir à l'arrivée et sert l'option. Le jeu, lui, filtre. Le relecteur qui jugerait « explorer prépare » sur la table jugerait autre chose — A6 l'a dit lui-même.
- A4, « OBTENU — une trouvaille rare (Destin) » et besace vide : `pactum.py:1186` affiche sans donner ; le vocabulaire de système que A5 relève (« seul endroit où le jeu parle en vocabulaire de système ») est celui de la réplique, pas du jeu.
- A4, procès sans témoins (« un cahier que personne n'a ouvert ») : les témoins ne sont pas répliqués (LISEZMOI §1). Le transcript pressé, lui, en appelle quatre.

Deux artefacts de l'ENREGISTREUR, à ne pas prendre pour des bugs du jeu : l'en-tête « fin de partie : jour 1 · 1 lieux traversés » sur une vie qui affiche JOUR 5 (A3, A4 — l'état est lu après la remise à zéro de fin de run), et l'écran 123/124 du pressé dupliqué avec un curseur `▌` (capture faite pendant la frappe).

Enfin, **« les mains vides et mort »** (A1, A5 perdus ; A6 ravi) : le jeu POSE la prémisse à l'intro (« Tu es mort. Il y a peu. », `Intro.tsx:85`), mais l'intro n'est ni dans les transcripts ni dans la réplique. Pas un bug — mais le débat retient que le jeu ne redit jamais la prémisse en monde avant de demander « Raconter ta mort » vingt minutes plus tard.

---

## 4. Les griefs à leur place — un ou deux porteurs, vérifiés

- **Le Geôlier qui contredit la partie** — A4, A6 (faux après une MALÉDICTION, pressé écran 24), A3 (lu comme un reproche, curieux écran 26). Trois profils, mais deux lectures. Vérifié : `JAILER_SANS_RISQUE` se sert « au deuxième lieu quitté sans avoir rien tenté » (`Scene.tsx:2892`) ; dans le pressé, le jet a eu lieu contre la Bête, embusquée AVANT le Chemin Creux, et le compteur de « refus » ne l'a pas crédité au lieu qu'on quitte. La ligne est fausse par construction dans ce cas, et c'est le cas du joueur pressé — celui qu'elle est censée piquer.
- **Le serment n'est pas surveillé** — A1 (« Lui demander combien il en a signé » porte `rompLeSerment: true`, puis « Tu as juré, tu as tenu » à l'aube, écran 50). Vérifié : le jeu pose `sermentRompu` (`Scene.tsx:4564`), mais la conséquence de « Partir pendant que c'est vrai » (`scene-data.ts:3999`) est inconditionnelle. **Point que A1 + A3 + A5 impliquent ensemble** : trois clauses et une échéance (« à la troisième aube, tu choisis », curieux 55) sont énoncées une fois, jamais rappelées, jamais vérifiées, et une route fermée peut forcer à les rompre (A5). Le Serment est un décor.
- **Trois portillons pour une sortie** — A1 (écrans 50-55), A2 (39 → 45). Vérifié : l'escorte « Au portillon sud, le plus jeune ouvre » (4015) puis la Palissade offre « Examiner le portillon », le Veilleur « t'ouvre le portillon lui-même » (7124), « Passer le portillon » existe deux fois (7153, 7205). **Et A2 seul voit la conséquence** : « Trois jours que j'ai vu personne » (7014) crié au Veilleur pendant que l'escorte « est encore dans son dos » — la halte et la Palissade ont été écrites comme deux arrivées séparées.
- **La Petite est là et disparaît sans un mot** — A1 (écran 33), A5 (écran 27 : « je n'aurais jamais pris le jouet d'une enfant sur son lit »). Vérifié : `scene-data.ts:4951`, puis `loot` à l'écran suivant. A1 relie ça à la promesse du gamin (« dis-lui merci pour le caillou ») — le jeu tend une promesse et retire la personne.
- **Le Bailli puis la Bête, sur le même écran** — A3, A5 (curieux écran 34). Vérifié : lignes 307/309 adjacentes. A3 : « pendant deux lignes j'ai cru que c'était le Bailli qui revenait ».
- **Le Veilleur « est sorti de sa niche » puis « ne sort pas de sa niche »** — A1 (écran 52), A5 (écran 50, image ouverte : « il est dedans, à sa fenêtre — la première phrase est fausse »). Vérifié : la ligne d'approche (6917) contre la variante `veilleur-1-note` (Soupçon ≥ 4, 6942).
- **Contradictions dans un même écran** — A1 (mur des cordes : « La troisième du rang bas n'a pas d'étiquette » contre « Toutes portent une étiquette. Sauf une, à hauteur d'œil, au centre » — 5442 vs 5266) ; A5 (Époux : « L'homme cesse de compter ses coups de bêche » puis « tu entends encore le compte à voix basse » — 6753 vs 6793, enchaînés par `chainNext`) ; A2 (grange : « tu ne sauras pas ce qui s'est dit devant ta porte » puis tout est perçu) ; A4 (Mare : on aborde quelqu'un qui vient d'être raccompagné). Toutes vérifiées sauf la Mare.
- **Répétitions mot pour mot** — « Ils sont six, alignés, du même côté » (pressé 99 et 102, trois écrans d'écart — A4, A6 ; le code prétend dédupliquer, mais pas entre les deux beats d'un même lieu) ; « Ils ont sorti une chaise… ça veut dire une date » (70 et 118, la seconde APRÈS la relaxe — A4, A6) ; « • RENCONTRE • La Meute Grise » deux fois (A1). A4 sur la convocation après relaxe : « Le monde ne sait plus qu'il m'a acquitté. »
- **Le procès, cause illisible / témoin jamais vu** — A5 (soupçon 6 « j'ai posé des questions et eu de mauvais dés » — un FUNESTE d'EMPATHIE hors combat compte +1, ce qu'aucun texte ne dit) ; A6 (« L'Écrivain public » témoigne à l'écran 75 du pressé sans avoir été rencontré — vérifié : première occurrence du nom dans le transcript). A4 sur sa mort : « Une phrase de sentence exécutée aurait suffi. »
- **Texte ↔ image** — Maison du Bailli (A2, A6) : image ouverte par le modérateur, `scene_maison_du_bailli_c.png` montre cinq fenêtres éclairées, une grille ouverte, un réverbère, aucun chien ; le texte dit « Chaque fenêtre bouchée de pierres posées depuis dedans » et `IMAGES.md` dit « de l'extérieur ». Trois versions. Verger (A4) : « deux silhouettes immobiles, tout au fond » contre deux images qui bêchent ; A4 tranche : « C'est le texte d'arrivée qui ment. »
- **Le climax se joue sans moi** — A5 seule : vérifié, écrans 81-100 = 20 écrans, 5 choix, dont « Reculer d'un pas » (91) qui ne mène qu'à « Descendre » (93). A1, sur le même passage, ne relève rien : le curieux lit, la sociale veut agir. À sa place, mais juste.
- **Le Marché muet** — A4 aime (« quatre échanges courts qui s'enchaînent »), A6 non (« six dialogues d'affilée sans un enjeu », et « Troquer au Marché » « sent le bouton »). Divergence de profil, sans arbitre.
- **Les phrases d'arrivée qui « sentent le moteur »** — A1, A3, A5 : les trois lecteurs du curieux, personne côté pressé. « Rien à contourner sur ce dernier bout […] rien ne t'a échappé » ; « Le point de berge usé. L'eau. Et dans les roseaux, un reflet de métal. » (A5 : « Ça sent le menu. »). Un constat chez les curieux, invisible pour qui ne lit pas.
- Isolés, vérifiés, mineurs : « Utiliser — Offrandes de la Borne » sur 16 écrans du pressé (A6) ; « il fait le noir des caves alors qu'il est midi dehors » sous « un crépuscule qui ne tombe pas » (A1) ; le coude « passé », « à franchir », « au milieu » (A6, pressé 18-21) ; « Derrière, un chemin descend » contre « un trou » (A6) ; « Tu repasses par une ruelle que tu as déjà prise » sur la première ruelle (A2) ; la Meute qui revient avec un texte de rencontre neuve (A6 — le jeu a un texte de retour dédié, `menace-retour-meute`, mais `meute-grise-1` reste tirable au pool pendant que la menace est armée, ce qui court-circuite la causalité).

---

## 5. Le point que personne n'a vu

En croisant A3 (sortie en dix écrans, Sceau reçu), A6 (sortie à 0,04 après cinq échecs durs), A2 (sortie à 0,38 après six FUNESTE) et A4 (mort au procès sans savoir de quoi) : **la Descente ne juge rien**. Elle n'exige ni lieux traversés, ni santé, ni serment tenu ; elle donne le Sceau et le nom sur la Borne à celui qui a pris la porte. Et le procès, lui, tue quelle que soit la santé. Le jeu est donc plus dur avec celui qui parle aux gens (A5, soupçon 6 sur des questions) qu'avec celui qui s'en va. Aucun des quatre ne l'a formulé ainsi ; leurs quatre vies le démontrent ensemble.

---

## 6. LE VOTE — une seule chose, une ligne chacun

- **A1 (curieux)** : que le monde tienne ce qu'il annonce — une direction, une enfant devant la porte, trois clauses de serment : chaque promesse a sa suite ou n'est pas faite.
- **A2 (pressé)** : que le risque pèse — que le corps dise qu'il saigne, que rater puisse tuer, et qu'un jet réussi se voie récompensé.
- **A3 (prudent)** : que la sortie se mérite — le Veilleur retient qui n'a rien traversé, et la Palissade n'est pas offerte à la première Croisée.
- **A4 (téméraire)** : que le jeu regarde ce que je fais — refusé, je reste dehors ; mort, je vois de quoi.
- **A5 (sociale)** : que le procès ait une cause lisible — je dois pouvoir remonter du tribunal à mes actes, pas à mes dés.
- **A6 (méfiant)** : que le choix de direction redevienne un choix — moins de routes fermées, et une issue sans dé quand l'anneau montre cinq encoches.

Trois voix (A1, A4, A5) demandent la même chose sous trois noms : la **causalité lisible**. Deux (A2, A3) demandent que **survivre coûte**. Une (A6) demande de l'**agentivité**. Ces trois demandes ne se contredisent pas : elles se rangent dans cet ordre.
