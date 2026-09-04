# PACTUM — panel « Est-ce qu'on comprend ? » · LE DÉBAT

Modérateur. Cinq rapports (L1 lecteur de romans · L2 mobile pressé · L3 jeux narratifs · L4 néophyte · L5 roguelike), deux transcripts de première run (`v1.129.0-premiere-run-curieuse.md`, 104 écrans, lu par L1/L3/L5 ; `v1.129.0-premiere-run-pressee.md`, 156 écrans, lu par L2/L4), cinq vies jouées sur la réplique Python (journaux des tables 1-4 relus écran par écran ; la table 5 a été écrasée par la vie suivante que L5 a lancée — ses citations « ma vie » ne sont vérifiées que par recoupement avec les textes sources).

Convention : « transcript, écran N » = le fichier lu ; « vie LN, écran N » = le journal de sa table, renuméroté par commande (le découpage tombe juste : 45 · 34 · 36 · 50 écrans, comme dans les rapports).

---

## 0. AVANT LE DÉBAT — ce que le matériau ne montrait pas

Trois vérifications changent la lecture de tous les rapports. Elles ne sont pas des constats sur le jeu : elles disent ce que le paquet a laissé hors champ.

**0.1 Les deux transcripts commencent à l'écran de jeu, pas au premier écran du jeu.** Les deux fichiers ouvrent sur « — JOUR 1 — / La lande s'ouvre… ». Or un compte vierge joue, AVANT cela (`components/Home.tsx` l. 110-119 : `intro` → `prologue` → `acte` → `game`) :
- l'intro, deux clauses, voix du Geôlier (`components/Intro.tsx` l. 82-108) : « D'être entré, je veux dire. Personne ne s'en souvient. **Tu es mort. Il y a peu.** » / « **Tu traverses mon Domaine. Une fois. Au bout, une Porte scellée : franchis-la, et tu reprends ta vie là où tu l'as laissée.** » / « **Si tu meurs, un autre viendra. Avec un autre nom.** » ;
- le Seuil (`lib/prologue-data.ts` l. 51-53) : « Avant que tu passes, je veux voir qui tu étais. Ce que tu vaux ici vient de ta vie d'avant. », quatre souvenirs, puis **le joueur tape le nom de son héros** (`components/Prologue.tsx` l. 40, 367, 514 — SCELLER LE PACTE, inerte sous 2 caractères, ou « Qu'il choisisse pour moi »), puis un portrait qui dit « **Le dé** fera le reste » / « Le dé n'aura pas grand-chose à rattraper » (l. 129-135) ;
- le carton d'acte « • LE DOMAINE • Les Lisières » (`components/Intro.tsx` l. 485-487).

Conséquence : « je suis mort » (QUI), « traverser une fois, une Porte au bout » (QUOI), « une seule vie, un autre viendra » (RÈGLES), le nom du héros, et l'antécédent de « il décide avec moi » sont **dits par le jeu avant l'écran 1** — et absents des deux transcripts que le panel a lus comme « première run ». Les cinq notes QUI (3 à 5/10) et les cinq « comment on meurt : jamais vu » sont d'abord un effet du paquet. Cela ne blanchit pas tout : voir 0.3.

**0.2 Les transcripts aplatissent la voix.** Dans le jeu, une ligne du Geôlier est un bandeau orange avec portrait, texte tapé à 42 ms (`components/Scene.tsx` l. 6008-6040, `case "jailer"`). Dans les quatre transcripts, zéro étiquette (`grep -c "GEÔLIER\|◉"` → 0 sur les quatre) : « Tu regardes tout, tu ne risques rien… » (transcript curieuse, écran 26) est posé comme une narration ordinaire. Les rapports « qui parle ? » (L2 E3, L3 E2, L5 grille 70) jugent donc un transcript, pas un écran. En revanche — vérifié — **le mot « Geôlier » n'est jamais affiché en run** : aucune chaîne rendue ne le contient hors l'aide de l'écran Options (`GameMenu.tsx` l. 644 : « Le Geôlier ne t'aura jamais connu ») ; ni le Codex (`lib/codex-data.ts`, aucune entrée), ni l'intro, ni le Seuil ne le nomment. L'étiquette « ◉ LE GEÔLIER » que les cinq citent comme le moment où ils ont compris est **une invention de la réplique** (`jouer/pactum.py` l. 1412).

**0.3 Ce que la réplique ne joue pas, et que les rapports ont pris pour le jeu.** Le LISEZMOI le dit (« Ne sont pas répliqués : … le Grand Registre, les reliques …, les témoins, les chapitres du Bailli, les surprises ») ; le panel a lu la liste et l'a oubliée en jouant :
- **le procès sans motif** (L1 E5, L3 E7) : dans le jeu, des témoins déposent, acte par acte — transcript pressée, écran 73-74 : « La Doyenne, à la Colline aux Gibets : “Il a porté la lame sur une corde qui tenait.” », « L'Écrivain public : “Il a essayé de se faire comprendre, et ce qui est sorti n'était pas de chez nous.” » — et un jet social raté inscrit lui aussi son témoin (`Scene.tsx` l. 5439-5444, `temoinPour("echec-empathie")`). Vie L3, écran 35 : la Doyenne referme le cahier **sans qu'aucun témoin ait parlé** — c'est la réplique ;
- **« OBTENU — trouvaille rare » sans nom** (L5 E2) : `pactum.py` l. 1199-1207, objet générique de la réplique ; le jeu donne un objet nommé ;
- **le Registre entre crochets** (L3 F : « quatre écrans de menus pour un Registre entre crochets ») : `pactum.py` l. 460-465 ;
- **« — JOUR 5 — » en pleine nuit dans la grange** (L4 E7) : dans le jeu, la puce tombe après « Dormir jusqu'à l'aube » (transcript pressée, écrans 119-120) ; ordre de la réplique ;
- **la mort jamais vue** (5/5) : aucun des quatre transcripts ne meurt, et la réplique tue par « M O R T + bilan » (`pactum.py` l. 1369, 1436). Le jeu a une séquence de six écrans (`DeathScreen.tsx` l. 4-9) que personne n'a vue.

Ce qui reste, après ces trois soustractions, est ce que le jeu ne dit pas. C'est l'objet du débat.

---

## 1. AXE PAR AXE — les cinq grilles côte à côte

### OÙ

| moment | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| écran 1 | lande, crépuscule permanent, frontière (je crois) | lande, moyen-âge sombre (je crois) | lande, médiéval-rural (je crois) | campagne d'autrefois (je crois) | lande médiévale, hors du temps (je crois) |
| écran 10 | chemin creux (sûr) | près de la pierre (sûr) | Chemin Creux (sûr) | lande, couronne de potences (je crois) | Chemin Creux (sûr) |
| écran 25 | lande, hameau, colline (sûr) | revers d'une colline, « mes Landes » (sûr) | plateau (sûr) | revers d'une colline (je crois) | plateau de lieux nommés (sûr) |
| village | Hameau des Renonçants (sûr) | hameau de toits gris (sûr) | Hameau (sûr) | « le nom oui, le sens non » (je crois) | village de « Renonçants » (je crois) |
| écran 70 | sortie du hameau (sûr) | la rue, dehors (sûr) | entre chapelle et marché (sûr) | ruelles (sûr) | près de la chapelle (sûr) |
| fin | falaise, puis « le noir sans nom » (sûr) | un monde à étages (je crois) | fond de la Falaise, hors des Landes (sûr) | « un étage » (je crois) | fond d'un trou, hors des Landes (sûr) |

**Convergence totale** : sûr dès l'écran 10, jamais brouillé ensuite. Les deux « je crois » de la fin portent sur le même mot : « l'étage du dessous » (transcript pressée, écran 156 : « Ne prends pas ça pour une sortie — l'étage du dessous me connaît mieux. »). Vérifié : c'est une citation d'accueil (`lib/jailer-quotes.ts` l. 57, `trav-a`), servie sur l'écran d'accueil après la traversée ; le mot « étage » n'apparaît nulle part avant.

**Divergence de profil** : L4 seul reste en « je crois » à l'écran 10 — il n'a pas fait le lien entre « la colline porte sa couronne de potences » (transcript pressée, écran 9) et un lieu ; L2, même transcript, l'a fait.

**Réserve d'image** (L3 G, vérifiée en ouvrant `scene_borne_frontiere_v2_a.png`) : la pierre, les offrandes, le chemin — **aucun homme**, alors que le texte dit « À trois pas, un homme immobile, face au sud » et qu'un bouton s'appelle « Marcher vers l'homme immobile » (écran 3). Ce n'est pas une confusion de lieu, c'est le premier élément jouable nommé qui n'est pas dans l'image.

### QUI

| moment | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| écran 1 | voyageur, ni nom ni but (aucune idée) | voyageur (aucune idée) | quelqu'un qui arrive (aucune idée) | « tu » (aucune idée) | ni nom ni raison (aucune idée) |
| écran 10 | quelqu'un qui « descend » ; « il décide avec moi » sans savoir qui (je crois) | « quelqu'un qui prend sans donner » — un pilleur ? (je crois) | un voyageur qui « descend » (je crois) | un entrant, sans but (aucune idée) | voyageur avec des stats (je crois) |
| écran 25 | traverser vers le sud (je crois) | un inconnu mordu (sûr) | traverser les Landes (je crois) | voyageur blessé, pourquoi là, aucune idée | « veut traverser entier » (je crois) |
| village | étranger attendu (sûr) | étranger compté à la craie (je crois) | je « descends » (je crois) | étranger que tout juge (aucune idée sur le pourquoi) | « descendant » repéré (sûr) |
| écran 70 | a juré trois choses, porte une mèche (sûr) | a refusé de jurer, mal vu (sûr) | a juré, porte une mèche (sûr) | a refusé de jurer (sa raison d'être là : aucune idée) | a juré trois interdits (sûr) |
| fin | Cendre, rang 11 ; pourquoi je descendais, toujours pas (je crois) | Cendre, appris à l'écran 153 (sûr) | Cendre, survivant (sûr) | Cendre, appris dans une liste (aucune idée sur le pourquoi) | Cendre, « mon nom, enfin » (sûr) |
| après la vie | **un mort** (sûr) — vie L1, écran 17 | un « descendant » (je crois) | un « descendant » de plus (sûr) | **un mort** (je crois) — vie L4, écran 42 | **un mort** (sûr) — vie L5, écran 8 |

**Convergence** : 5/5 « aucune idée » à l'écran 1, 5/5 définissent le héros par ses ACTES à l'écran 70 (« a juré / a refusé »), 0/5 sûrs du POURQUOI, à aucun moment. Trois sur cinq découvrent « tu es mort » seulement dans leur vie jouée, et par les deux mêmes répliques : « Tu arrives ici comme tout le monde y arrive — les mains vides et mort. » (vie L1, écran 17 ; les Époux du Verger — vérifié, journal table1) et « Il te demande ta mort. C'est la seule histoire du dehors que tu possèdes encore. » (vie L1, écran 38 ; vie L4, écran 42 ; le Veilleur — vérifié). **Ni le Verger ni le Veilleur ne sont sur la route de la première run** (`lib/demo.ts`, `DEMO_ROUTE`).

**Vérification** : le jeu le dit — à l'intro (« Tu es mort. Il y a peu. », `Intro.tsx` l. 85), avant l'écran 1, hors transcript. Dans la première run elle-même, aucune ligne ne le redit : la première occurrence in-run de « mort » au sens du héros est « Vous avez tous le même pas » (transcript curieuse, écran 47), qui ne le dit pas.

**Divergence de profil** : L2 (pressé) lit « la lande a noté que tu prends sans donner » (écran 5) comme une identité (« un pilleur ? ») : c'est le seul jugement porté sur lui en dix écrans, il s'en fait un personnage. L5 (roguelike) lit « RUSE » (écran 3) comme « un voyageur avec des stats » — il cherche la fiche.

**Le nom** : L2 E10, L4 E4, L5 grille fin : « mon nom appris dans un tableau ». Vérifié : artefact du paquet — dans le jeu, le joueur a tapé ce nom au Seuil (`Prologue.tsx`), « Cendre » est le nom que l'automate a laissé choisir.

### QUOI

| moment | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| écran 1 | un pendu « a répondu » (je crois) | un pendu qui parle (je crois) | quelque chose parle ici (je crois) | les morts parlent, anormal (je crois) | un secret au sud (je crois) |
| écran 10 | une bête me chasse ; pourquoi le sud, aucune idée | traverser, un seul chemin (je crois) | une bête me chasse ; le vieux tient ma ligne (je crois) | le gibet me surveille (je crois) | une bête m'a senti (sûr) |
| écran 25 | une traversée, des gens qui comptent ; l'intrigue ne s'est pas nouée | un pendu officiel, vivant, va me juger (je crois) | la bête me suit sur la crête (sûr) | un pendu vivant va me juger (je crois) | une chose me suit (sûr) |
| village | le Bailli m'a « noté » : le village va me juger (je crois) | le village m'attend pour me piéger (je crois) | village qui m'a vu venir (sûr) | on me prépare une corde (je crois) | un pays qui juge tout ce qui entre (je crois) |
| écran 70 | tout le monde descend et ne revient pas ; le Registre sera l'enjeu (je crois) | on va me faire un procès (sûr) | « on te retire la maison » ; le sud appelle (je crois) | procès, on veut me fixer/pendre (je crois) | les gens entendent une voix du sud (je crois) |
| fin | traversé ; le Bailli est le fil, le 301e reste un trou (je crois) | traversé, la suite en dessous (je crois) | traversé ; la marque = prix ou preuve (je crois) | jugé deux fois, relaxé, descendu (je crois) | traversé ; suite inconnue (sûr) |

**Convergence** : « traverser entier » est saisi par 5/5 entre l'écran 17 et l'écran 25, tous à partir de la même réplique du Marcheur : « Tu veux traverser entier ? » (transcript curieuse, écran 17). Le procès est le seul enjeu que les deux pressés notent « sûr » (écran 70). Personne n'est sûr de l'histoire à la fin.

**Divergence** : les lecteurs du transcript curieuse (L1, L3, L5) tiennent « le Bailli et ses 300 noms » pour le fil rouge (écran 32) ; les lecteurs du transcript pressée (L2, L4) tiennent « on pend pour remplacer » pour la clé (écran 126). Vérifié : « Ici, on ne pend pas pour punir. On pend pour remplacer. » est une manifestation de la loi (`lib/loi-substitution.ts` l. 47-51), servie **une fois par vie, en liaison seulement** (`Scene.tsx` l. 3661-3672) — elle est tombée dans la run pressée, pas dans la curieuse. Deux joueurs de la même première run n'ont donc pas la même explication du village, et aucun des deux ne sait qu'il lui manque l'autre.

**Le trou commun** : « le trois cent unième ». L1 D, L2 D, L4 grille fin le citent ; personne ne sait qui c'est. Vérifié : c'est voulu (`scene-data.ts` l. 5088-5092 : « Que ce soit la fille du Bailli est ce que le joueur DÉCOUVRE, jamais ce que le hameau annonce ») ; la découverte est servie par un chapitre (`lib/chapters-data.ts` l. 116) que la réplique ne joue pas et que les deux transcripts n'ont pas tiré. Ce n'est pas un défaut de clarté, c'est un mystère tenu — mais le panel ne distingue pas un mystère d'un oubli, parce que rien ne lui signale que la question est ouverte à dessein.

### EUX

| moment | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| écran 1 | un homme immobile (sûr) | un homme, un pendu (je crois) | (aucune idée) | (aucune idée) | (aucune idée) |
| écran 10 | un vieux tient un registre où « ma ligne est déjà ouverte » (je crois) | « il décide avec moi » — on me surveille, qui ? (aucune idée) | la voix de l'écran 2 est le « il » ; le vieux = un greffier (je crois) | qui parle, qui est « il » ? (aucune idée) | quelqu'un me regarde jouer (je crois) |
| écran 25 | le Marcheur = allié (je crois) | le pendu = juge à sceau (je crois) | le Marcheur = allié ; le pendu = juge (je crois) | corbeaux qui comptent ; le pendu = mise en scène (je crois) | le Marcheur = guide (je crois) |
| village | hostiles mais polis ; « Renonçants » ? (aucune idée) | « Renonçants » ? (aucune idée) | le pendu = le Bailli ; ils me comptent (je crois) | une voix qui « écrit » les jours (je crois) | le Bailli = juge mort qui note (je crois) |
| écran 70 | le hameau me compte ; « quelqu'un d'autre plus haut » (je crois) | une voix qui dit « chez moi » — un narrateur-démon ? (je crois) | « plus haut que le hameau, quelqu'un d'autre » = la voix (je crois) | quelqu'un d'ailleurs qui ne peut pas prévenir (je crois) | « une voix qui se moque, non nommée » (je crois) |
| fin | « Moi, si » = le Geôlier de l'écran 2 ; il tient le Registre (je crois) | un gardien des étages (je crois) | un geôlier qui collectionne des vies (je crois) | le maître de l'étage du dessous (je crois) | un geôlier qui tient un classement (je crois) |
| après la vie | ◉ LE GEÔLIER commente mes échecs (sûr) | ◉ LE GEÔLIER = la voix ; je suis prisonnier (je crois) | le Geôlier commente dés et marques (je crois) | la voix a un nom, « ◉ LE GEÔLIER » (je crois) | le Geôlier commente mes jets (sûr) |

**Convergence** : le village est lisible pour 5/5 dès l'entrée (« méticuleux », « comptables de la peur », « ils me comptent ») ; le pendu devient « le Bailli, un juge » pour 5/5 après l'écran 32. La voix, elle, n'est identifiée que par déduction — « quelqu'un d'autre plus haut » (écran 59) est cité par L1, L3, L4 comme la seule accroche — et « nommée » seulement dans la réplique (voir 0.2).

**Vérification sur « Bailli »** : le mot n'apparaît que dans les issues et la conséquence de « Passer sans un mot » (« Tu passes. Le Bailli ne te rappelle pas — il note. », transcript curieuse, écran 34 ; `scene-data.ts` l. 2052-2099), jamais dans la narration qui l'introduit (« un gibet à corde longue… Chaîne de fonction au cou, un sceau au poing », écran 27). L1, L2, L3 : « nommé après coup, en passant » — exact.

**Divergence de profil** : L2 attribue « Trois cents ont trouvé ça exagéré. Le livre dit qu'ils avaient tort. » (transcript pressée, écran 56) à la Doyenne qui vient de parler — c'est le palier 3 du Geôlier (`scene-data.ts`, `SOUPCON_GEOLIER[3]`, l. 9740), collé sans étiquette sous sa réplique dans le transcript. Dans le jeu, c'est un bandeau orange. L2 n'a jamais eu tort sur le texte, il a eu tort sur le support.

### RÈGLES

| moment | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| écran 1 | aucune idée | « JOUR 1 » = compteur (je crois) | JOUR = compteur (aucune idée) | compteur de quoi, aucune idée | le temps compte (aucune idée) |
| écran 10 | RUSE/COURAGE = test ; « Se plaquer » sans tag = sûr ? (je crois) | FUNESTE et j'ai perdu… quoi ? (aucune idée) | stats, le dé se lance dessus (je crois) | mot en capitales → dé → catastrophe (je crois) | « Pierre de Retour » = bonus (je crois) |
| écran 25 | le dé n'a pas été lancé après 25 écrans (je crois) | ÉCHEC = blessure ; Jour passé à 2 sans savoir pourquoi (aucune idée) | aucun dé en 25 écrans (sûr) | JOUR 2 juste après un ÉCHEC → rater coûte un jour ? (je crois) | aucun dé en 25 écrans (sûr) |
| village | regarder est gratuit, seuls les jets comptent (je crois) | pas de dé = pas de Jour ? (aucune idée) | « regarder ne compte pas » — règle ou pique ? (je crois) | les jours seraient un score (je crois) | ne pas lancer n'avance pas le score (je crois) |
| écran 70 | toujours aucun dé ; « la troisième aube, tu choisis » — quoi ? (aucune idée) | refuser = dehors + procès ; Jour à 3 sur un FUNESTE (je crois) | toujours aucun dé (je crois) | JOUR 3 après le FUNESTE (je crois) ; mort = pendu (je crois) | aucun dé en 70 écrans ; objets = soins (sûr) |
| fin | le Registre classe par jours, mon J1 est dernier (je crois) | gagner = descendre ; les Jours sont le score ; la mort : jamais vue (aucune idée) | ÉCHEC = Entaillé, DE JUSTESSE = Aguerri ; la mort (aucune idée) | paliers FUNESTE < ÉCHEC < … < DESTIN (sûr) ; contradiction dans ma tête sur le Jour | gagner sans lancer classe mal (je crois) |
| après la vie | les encoches montrent mes chances (je crois) | l'anneau compris tout de suite (sûr) ; le Jour avance en marchant (je crois) | l'anneau oui ; un 1 blesse ; JOUR 2 sans raison visible (aucune idée) | l'anneau m'a enfin expliqué le dé ; le Jour avance quand je marche ou dors (je crois) | dé 20 contre l'anneau ; le Jour tous les ~3 lieux et à la nuit (je crois) |

**Convergence 1 — le dé se comprend en jouant, jamais en lisant.** 5/5 : « l'anneau est limpide » (L2), « m'a enfin expliqué le dé » (L4). Vérifié : la réplique affiche « (l'anneau du dé : encoches pleines = faces qui réussissent) » au premier jet (`pactum.py` l. 1430) ; le jeu affiche l'Anneau et « Les encoches pleines sont tes chances de réussite. » (aide du dé, retirable). Rien de cela ne peut être dans un transcript. Le transcript curieuse fait lancer son premier dé à l'écran 78 : ses trois lecteurs ont passé 77 écrans avec des tags de stat sur les boutons et aucune idée de ce qu'ils déclenchent.

**Convergence 2 — le Jour n'est compris par personne, et deux l'ont compris à l'envers.** L2 et L4 (transcript pressée) : « JOUR 2 tombé juste après un ÉCHEC (écran 21) → rater coûte un jour » ; « JOUR 3 après le FUNESTE de l'écran 58 ». Vérifié, faux : « PLUS AUCUN JOUR AJOUTÉ PAR UN ÉCHEC » (`Scene.tsx` l. 5280-5285) ; le Jour avance **un tous les trois lieux quittés après y avoir lancé un dé** (l. 2895-2906, `lieuxEngages % 3`) et à chaque nuit (l. 4900). Les deux coïncidences (un échec au Chemin Creux = 3e lieu engagé ; un FUNESTE aux combles = 6e) ont produit une règle fausse chez les deux lecteurs du même transcript. Et la conséquence inverse chez les trois autres : la run curieuse, qui ne lance rien avant la Meute, reste **JOUR 1 pendant 104 écrans** et finit **11e sur 11** au Registre (transcript curieuse, écran 100 : « 11 / Cendre / J1 / a franchi la Descente ») — L5 E7 : « Le gagnant classé dernier : j'ai cru à une erreur. » Vérifié : le Registre classe par jours (`lib/registre-data.ts` l. 174), la survie n'y pèse rien.

**La seule ligne qui dit la règle** : « Tu regardes tout, tu ne risques rien. Ces jours-là ne s'écrivent pas. » (`JAILER_SANS_RISQUE`, `scene-data.ts` l. 9270), servie **une fois par vie, au deuxième lieu quitté sans jet** (`Scene.tsx` l. 2923-2929). Trois l'ont lue juste (L1, L4, L5), L3 l'a prise pour une pique (« règle ou pique ? »), L2 pour une devinette (« pas de dé = pas de Jour ? »). Elle est exacte, elle est unique, elle arrive après le refus — et rien avant le Registre ne montre qu'elle parlait de score.

**Convergence 3 — la route fermée, 5/5 perdus.** L1 E4 (transcript, écran 38), L1 E6 (vie, écran 31), L2 E7 (vie, écran 5), L3 E3 (vie, écran 5), L4 E2 (transcript, écran 9), L5 E5 (vie, écran 24). Vérifié : trois textes (`ROUTE_FERMEE`, `scene-data.ts` l. 9004-9013 : « le sol s'est affaissé… Ça l'était il y a un instant. » / « Tu cherches la seconde route et tu ne la trouves pas… il ne t'a pas attendu pour être choisi. » / « …qui n'y était pas quand tu as pris ta décision. »), **aucun ne nomme la cause**. Le prix est annoncé au moment de l'acte (« La route directe est à elle : la tienne fera le tour. », transcript curieuse, écran 37 ; « c'est le prix, et tu le sais en le payant », vie L1, écran 31) mais jamais raccordé à la Croisée qui le fait payer, parfois plusieurs écrans plus loin. L3 a dû ouvrir `Scene.tsx` pour comprendre que son FUNESTE de l'écran 4 avait fermé la route de l'écran 5.

**Convergence 4 — la mort.** 5/5 « jamais vu » ; L2 seul est mort, et il a lu « Tu n'as pas brillé, mais tu es debout. » puis « M O R T » (vie L2, écran 34 — vérifié, journal table2). Vérifié côté jeu : ce texte est l'issue ÉCHEC de « Reculer, sans ciller » (`scene-data.ts` l. 6410) ; le jeu tue par épuisement de santé quel que soit le palier (`Scene.tsx` l. 4880, `fatalCheck`) et prend la prose du jet fatal pour épitaphe (l. 5542, 5568 `proseDuJet(outcome.text)`). **Le même « tu es debout » suivi de la mort est donc possible dans le jeu** — ce n'est pas seulement la réplique.

**Divergence de profil** : L4 (néophyte) est le seul à noter « sûr » l'ordre des paliers à la fin (FUNESTE < ÉCHEC < DE JUSTESSE < RÉUSSITE < ÉCLATANTE < DESTIN) — 17 jets dans son transcript, il a eu le temps de trier ; L3 (narratif) ne le mentionne pas et se demande ce que « Produire un papier » aurait produit (F). L5 (roguelike) est le seul à formuler le Jour correctement après sa vie (« tous les ~3 lieux et à la nuit ») — il a lu `etat`.

### RYTHME

| moment | L1 (curieuse) | L2 (pressée) | L3 (curieuse) | L4 (pressée) | L5 (curieuse) |
|---|---|---|---|---|---|
| écran 1 | je lis, deux paragraphes courts (sûr) | deux écrans avant un bouton, ça va (sûr) | je lis, envie d'avancer (sûr) | c'est court, ça va (sûr) | court et dense (sûr) |
| écran 10 | sept écrans de lecture depuis le dernier choix, je veux jouer (sûr) | écrans 5-9, cinq écrans pour un bouton unique, je saute (sûr) | première vraie décision à 11 (sûr) | je tourne des pages (sûr) | trois écrans de lecture avant le premier choix (sûr) |
| écran 25 | je joue enfin : choisir ma route (sûr) | trois boutons, un dé, une bête (sûr) | deux décisions réelles, ça traîne de 13 à 20 (sûr) | deux décisions en dix écrans (sûr) | je joue, sans risque (sûr) |
| village | 34-39 se lisent sans décider (sûr) | 38-49, douze écrans pour un vrai choix (sûr) | la Bête revenue sans savoir comment (sûr) | le troupeau, huit écrans pour deux boutons (sûr) | 34-39 traîne (sûr) |
| écran 70 | **un bon roman, mais je ne joue pas** (sûr) | **ça se resserre, envie du procès** (sûr) | beau village, rien joué (sûr) | un seul bouton, mais la tension pousse (sûr) | pure lecture, je veux sortir (sûr) |
| fin | 84-98 superbe ; deux jets en 100 écrans (sûr) | 140-152, treize écrans à bouton unique, lu à moitié (sûr) | la falaise, seul moment où j'ai eu peur (sûr) | 156 écrans pour ~35 vrais choix (sûr) | 84-99, seize écrans, beaux, sans choix (sûr) |

**Convergence** : le seul axe où 5/5 sont « sûr » à tous les moments. Trois tunnels cités par tous ceux qui les ont traversés : 34-39 (curieuse : la Bête revient, la route s'affaisse — un choix), 38-49 (pressée : le troupeau — douze écrans, un choix réel, un doublon), 84-99 / 140-152 (la Falaise — seize / treize écrans, des « Descendre / Reculer d'un pas » que L3 appelle « des touche-pour-continuer déguisés »). Comptage vérifié : transcript curieuse = 65 « touche pour continuer », 34 écrans de choix dont 5 à un bouton et 11 à deux, **2 dés** ; transcript pressée = 88 « touche pour continuer », 46 écrans de choix dont 8 à un bouton et 14 à deux, **17 dés**.

**Divergence de profil — la seule vraie de tout le panel** : à l'écran 70, les trois lecteurs de la run curieuse s'ennuient (« rien joué », « je veux sortir ») pendant que les deux lecteurs de la run pressée sont tendus (« envie de voir le procès »). Ce n'est pas le profil qui divise, c'est le transcript : la run curieuse traverse le village entier (écrans 40-72, 33 écrans) sans un dé ; la pressée y lance sept dés et y gagne un procès. La courbe « accroche → ouverture → pression → climax » que le LISEZMOI demande de juger existe dans une run et pas dans l'autre — et la différence tient à ce que l'automate curieux ne clique jamais sur un bouton à tag.

---

## 2. LES CINQ HISTOIRES (section C) — ce qui se recoupe, ce qui se contredit, ce qui manque

**Commun aux cinq** (c'est ce que le jeu transmet réellement) :
1. une lande où le soir ne tombe jamais, une pierre-frontière au nord, un trou plein de cordes au sud ;
2. tout le monde « descend » vers le sud et personne ne remonte ;
3. un village qui a renoncé (à quoi : « à parler », L2 L3 ; « à quelque chose », L1 L4 L5) et qui compte l'étranger à la craie ;
4. un serment de trois choses ;
5. un pendu-juge, le Bailli, trois cents noms, le sien en dessous, qui juge encore ;
6. un procès qui pend ;
7. une voix qui regarde et un dé qui décide ;
8. au bout, on descend par une corde et la suite est en dessous.

**Contradictoire** (c'est ce que le jeu laisse deviner) :
- **Pourquoi le village pend** : « pour remplacer quelqu'un, je n'ai pas compris qui » (L2), « pour se protéger de ce qui appelle » (L4), « ceux qui l'entendent trop » (L5), « juge les étrangers par l'Ordonnance » (L1), « si tu montres les signes de la Fixation » (L3). Cinq causalités pour un même acte — chacune assemblée à partir d'une ligne différente (écran 126 / vie L4 21 « Ce qui appelle. Et ceux qui répondent. » / vie L3 27 « la liste des signes »).
- **Ce que veut la voix** : « s'amuse » (L5), « collectionne des vies » (L3), « tient le Registre » (L1), « gardien des étages » (L2), « constate sans prévenir » (L4). Aucun ne se trompe ; aucun ne dit la même chose.
- **Ce qu'est le héros** : « tu es mort » (L1, L3 par « te réveilles », L4, L5) contre « tu débarques » (L2) — le seul qui n'a pas croisé le Verger ni le Veilleur.
- **Ce que vaut descendre** : « vivant » (L1 L3 L5), « c'est l'étage du dessous, à suivre » (L2), « je ne sais pas si descendre est gagner » (L4).

**Manque chez tous** (c'est ce que le jeu ne dit pas dans la première run) :
- pourquoi le héros est là et ce qu'il veut (5/5 : « pourquoi, jamais dit ») — dit à l'intro, hors transcript, jamais redit en run ;
- qui est le trois cent unième (voulu, voir QUOI) ;
- ce qu'il y a en bas (voulu : « le noir n'a pas encore de nom », écran 98) ;
- ce que « à la troisième aube, tu choisis » engage. Vérifié : deux occurrences dans tout `scene-data.ts` (l. 3603, la phrase du serment ; l. 4102, un commentaire de design) ; l'aube de la halte dit « Aujourd'hui, on fixe personne. Alors pars pendant que c'est vrai. » (l. 3991) sans y revenir ; l'entrée Codex `arc:serment` dit « valables trois aubes » sans dire le choix. **Jamais résolu nulle part.**
- ce qu'est un Renonçant. Vérifié : jamais défini ; deux indices (« Renoncer à la parole est le renoncement le moins cher », l. 4754 ; « arrêter, c'est commencer à regarder le sud », vie L1 écran 17) ; pas d'entrée Codex.
- ce qu'est une Fixation. Vérifié : le mot sert à condamner (« L'Ordonnance de la Fixation s'applique », transcript pressée, écran 75) ; ses indices en run sont sur le Champ des Fixés (« Une Fixation ratée : ni mort ni tenu », l. 2457) et la feuille du Tribunal (« La liste des signes, de la main du Bailli », l. 6087) — **aucun des deux n'est sur la route de la première run** (`DEMO_ROUTE` : chemin-creux, pendu-qui-parle, serment-hameau, chapelle, marché, nuit, puits, Meute, Falaise ; dans le transcript curieuse, « Vers les rangées de poteaux » à l'écran 73 déclenche la Meute, pas le Champ). La définition existe (Codex `arc:fixation`, l. 384-392 : « On ne fixe pas pour punir. On fixe pour que quelque chose reste en place. ») — hors run, déverrouillée par une découverte (`d.troupeau_compte`).

---

## 3. LES MOTS — liste fusionnée

Fréquence = nombre de testeurs qui l'ont listé en D ou marqué « aucune idée » en grille. Vérification = ce que dit le jeu, où.

| mot | n | 1re rencontre | vérification |
|---|---|---|---|
| « il décide avec moi » — qui est « il » | 5 | écran 2 (les deux transcripts) | Le Seuil, juste avant, dit « Le dé fera le reste » (`prologue-data.ts` l. 132) ; l'amorce elle-même ne contient plus le mot « dé » (la clause « Le dé tranche » a été fondue, l. 33-40, sans que le mot survive). En run, jamais. L4 et L5 ont cru que « il » était l'homme immobile — le seul « il » à l'écran. |
| Geôlier (la voix, son nom) | 5 | jamais à l'écran en run | Nommé nulle part en run (vérifié : seule chaîne rendue = aide Options). L'étiquette « ◉ LE GEÔLIER » vient de `pactum.py` l. 1412. |
| Renonçants | 5 | écran 40 / 50 | jamais défini ; deux indices (l. 4754 ; Verger) ; pas d'entrée Codex. |
| Fixation / Fixés / Ordonnance | 5 | écran 44 (Champ nommé), 73-75 (procès) | indices hors route de première run ; définition au Codex seulement. |
| Sceau | 5 | écran 27 « un sceau au poing » (objet) ; écran 100/153 (la marque) | le mot « Sceau » n'est jamais affiché ; la marque est « une entaille en creux, nette, en forme de coin » ; le Codex l'appelle « La marque de la paume » (`codex-data.ts` l. 416-421). L1/L3/L5 ont cru que l'objet du Bailli et la marque étaient une même chose — le transcript les nomme « sceau » l'un et rien l'autre. |
| Jour (ce qu'il fait) | 5 | écran 1 | jamais dit ; une ligne du Geôlier au 2e refus (l. 9270) ; inféré à l'envers par L2 et L4. |
| Bailli | 5 | écran 34 / 31 (dans une issue) | nommé après coup ; défini au Codex `renc:bailli`. |
| Soupçon | 4 | jamais à l'écran | le mot n'est jamais rendu (une mention dans un champ `source` de `etats.ts` l. 97, non affiché par `GameMenu`) ; ses signes (cinq craies, cinq lignes du Geôlier, les témoins) le sont. Voulu. |
| « à la troisième aube, tu choisis » | 4 | écran 56 / 64 | jamais résolu (voir §2). |
| « Ces jours-là ne s'écrivent pas » | 4 | écran 26 / 50 | compris par 3 après le Registre, pris pour une pique par L3. |
| Appelé | 3 | vie (Veilleur) : « Encore un Appelé » | expliqué en contexte pour L5, pas pour L1 ; « ce qui appelle » (vie L4, écran 21) le porte. |
| Aguerri / Entaillé / Ébranlé | 3 | écrans 79/83 (curieuse), 16 (pressée) | « la phrase sous le mot suffit » (L4) ; l'effet au dé n'est pas dit (L3) — voulu. Ébranlé existe dans le jeu (`Scene.tsx` l. 4369). |
| le trois cent unième | 2 | écran 32 / 33 | mystère tenu (voir QUOI). |
| les Profondeurs | 2 | vie L3/L5 (feuille du Tribunal) | une seule occurrence dans tout le jeu (l. 6087), jamais reprise. |
| chaîne de fonction / sceau au poing | 2 | écran 24 / 27 | jamais expliqué ; « insignes » (écran 28) est la glose. |
| FUNESTE / DESTIN / DE JUSTESSE / MALÉDICTION | 2 | écran 4 (pressée) | jamais définis ; l'ordre se devine ; « Le sommet du dé » (écran 86) explique DESTIN. |
| Grand Registre / Reliques / Codex / Descente | 2 | écran 153-156 | mots de menu, jamais expliqués en run ; « Descente » nommée après l'avoir faite (L2). |
| « Le livre dit qu'ils avaient tort » | 1 | écran 56 | jamais dit quel livre. |
| RUSE / INSTINCT / COURAGE / EMPATHIE | 1 (L4) | écran 3 | jamais expliqués ; nommés au radar du verdict (Seuil), hors transcript. |
| OBTENU / COMMUN / RARE | 1 (L4) | écran 54 / 82 | inventaire jamais vu dans les transcripts (menu). |

---

## 4. LES MOMENTS PERDUS — fusion, avec ce qui vient du jeu et ce qui vient du paquet

**Cités par ≥ 2.**

1. **Écran 2, « À partir de maintenant, il décide avec moi. »** — L4 E1, L5 E1, L1 D, L2 D, L3 grille. Cru : « il » = l'homme immobile (L4, L5). Aide demandée : « Le dé. » (L5), « Le dé décide avec moi » (L4). Vérifié : jeu — l'antécédent est deux écrans plus haut, au Seuil ; la ligne elle-même ne le porte pas.
2. **La route fermée** — 5/5 (voir RÈGLES, convergence 3). Cru : « le monde se ferme au hasard » (L3), « un bug » (L4), « une boucle » (L1). Aide : « Le grand tour te ramène sur elles — c'était le prix. » (L1), « dire pourquoi la route a disparu » (L4). Jeu, vérifié (`ROUTE_FERMEE`, aucun texte ne nomme la cause).
3. **La puce JOUR** — L3 E8, L4 E3, L4 E7, L2 et L5 grilles. Cru : « bug d'affichage » (L3), « rater coûte un jour » (L4, L2). Aide : « La nuit est tombée en marchant. » (L4), « rien ne dit que marcher fait passer les jours » (L3). Jeu, vérifié (règle des trois lieux engagés, jamais énoncée). L4 E7 (JOUR 5 en pleine grange) = réplique.
4. **Écran 34 (curieuse), la Bête revient** — L1 E3, L3 E1, L5 grille village. Cru : « le jeu rejoue l'écran 8 » (L1), « un montage raté » (L3). Aide : « Celle du creux t'a retrouvé. » (L1), « tu redescends vers le creux » (L3). Vérifié : c'est la menace laissée active (LISEZMOI §1) ; la trace existe (écran 24 : « quelque chose de lourd est passé là, réglé sur le chemin d'en bas. Sur le tien. ») et L5 seul l'a lue comme une causalité (« la Bête a creusé sa route sur la mienne »). Le retour lui-même s'annonce par « • RENCONTRE • La Bête des Chemins Creux » — le même bandeau qu'à l'écran 8, avant la phrase qui dit que c'est un retour.
5. **Le procès sans motif** — L1 E5 (vie, 25), L3 E7 (vie, 35), L2 E6 (transcript, 121), L2 E4 (transcript, 73). Cru : « j'ai sauté un écran » (L1), « le jeu ne sait pas ce que j'ai fait » (L3), « le bouton cassé » (L2 : tapé chapelle, arrivé au Tribunal). Vérifié : dans le jeu, les témoins nomment les actes (transcript pressée, 73-74) ; l'absence de motif est **réplique**. Reste vrai côté jeu : (a) le déroutage remplace la destination choisie sans transition (« Vers une chapelle de cordes » → « ils t'attendent au tournant du muret ») ; (b) au second procès, la déposition « Il est venu se faire soigner d'une plaie qu'aucun outil du hameau ne fait » (écran 121) nomme l'acte sans que le joueur voie pourquoi c'en est un.
6. **La convocation avant le serment** — L2 E8 (vie, 9), L3 E4 (vie, 13). Cru : « condamné d'avance ». Vérifié : les lignes de palier (`SOUPCON_CRAIE[5]`, `SOUPCON_GEOLIER[5]`, l. 9735-9746) sont servies à l'arrivée sur l'écran ; si le palier 5 est franchi par le jet d'arrivée, « c'est une convocation » et « Ils ont sorti une chaise » se lisent AVANT que le vieux tende la paume. Dans le transcript pressée (64-69) l'ordre est bon parce que le palier tombe après le refus. Réplique ET jeu partagent la règle d'ajout à l'arrivée.
7. **Le Registre final, « Cendre »** — L2 E10, L4 E4, L5 E7, L1 grille fin. Cru : « c'est moi ? » (L4, dix secondes), « le gagnant dernier : une erreur » (L5). Vérifié : le nom est tapé par le joueur au Seuil (paquet) ; le rang, lui, est juste et injuste à la fois (règle des jours, voir RÈGLES).
8. **Écrans 42-43 (pressée), même paragraphe deux fois, le premier coupé à « qui n'▌ »** — L2 E2, L4 grille. Cru : « un bug ». Vérifié : « ▌ » est le curseur de frappe (`TypedText.tsx` l. 94) ; l'enregistreur a capturé l'écran en cours de frappe. Artefact du transcript.
9. **« On ne sent jamais le premier tour de corde. »** (écran 45 / 57) — L2 E3, L5 grille 70 : « qui parle ? ». Vérifié : `SOUPCON_GEOLIER[2]` ; bandeau orange dans le jeu, texte nu dans le transcript.
10. **Combat puis « en chemin » sans avoir vu le lieu** — L4 E5 (vie, 6-7 : Champ des Fixés), L5 E4 (vie, 20). Cru : « je n'y suis jamais entré ». Vérifié : le Pendu mal fixé partage le lieu du Champ ; la conséquence du combat enchaîne sur la Croisée sans écran du lieu. Réplique et jeu (même chaîne).

**Cités par un seul, mais vérifiés côté jeu** (retenus parce que le texte est celui du jeu) :
- L1 E1 : « OBTENU RARE PIERRE DE RETOUR » entre les gravures et la marche, sans phrase de ramassage (transcript, écran 5). Vérifié : le bandeau suit « Dessous, un éclat descellé. » — l'objet est nommé « Pierre de Retour », l'écran dit « éclat ».
- L1 E2 : « Un vieux, assis contre un muret, gratte une planchette » (transcript, écran 6) sans muret ni choix. Vérifié : c'est l'amorce du chapitre « le-registre » (`chapters-data.ts` l. 70-74), insérée à la première liaison.
- L2 E9 : « tu es debout » puis mort (vie, 34). Vérifié : possible dans le jeu (voir RÈGLES, convergence 4).
- L3 E5 : « Tu n'es pas monté. » après MALÉDICTION sur « Monter jusqu'à la rupture » (vie, 16). Vérifié journal ; texte du jeu.
- L4 E6 : « Lui demander de sonner » offert après « il redescend le tertre sans te regarder » (vie, 30). Non vérifiable (la table ne journalise pas les boutons non pris) ; le journal confirme le départ du Sonneur à l'écran 30.
- L5 E3 : « la colline emporte quelque chose de toi » = trait devenu pointillé, pas d'OBTENU (vie, 14) — table écrasée, non vérifié.

---

## 5. LE RYTHME — chiffres vérifiés

| | transcript curieuse (L1 L3 L5) | transcript pressée (L2 L4) | vies jouées |
|---|---|---|---|
| premier choix | écran 3 | écran 3 | écran 1 |
| premier choix « à enjeu » | 11 (la Bête) | 3 (RUSE) | 1-3 |
| premier dé | **78** | 4 | 3-4 |
| dés au total | 2 | 17 | 5 à 11 en 34-51 écrans |
| « touche pour continuer » | 65 sur 104 | 88 sur 156 | — |
| écrans de choix à 1 bouton | 5 | 8 | — |
| tunnels cités | 5-10 · 34-39 · **40-72 (33 écrans, 0 dé)** · 84-99 | 5-10 · 38-49 · 73-75 · 140-152 | 26-31 (L2, Marcheur), 26-30 (L3, Tribunal), 42-50 (Descente) |
| joué sans comprendre | 26 (« ces jours-là »), 36-38 | 3 (que fait RUSE ?), 29 (« Trancher sa corde », pourquoi ?), 66 (jurer quoi ?), 76 (« Invoquer le trois cent unième ») | 25 (procès, L1), 31-32 (route, L1), 14 (« Donner un nom à la plume », L2), 21 (jurer, L4), 42 (« Raconter ta mort », L4), 35-36 (procès, L3) |

Le fait de rythme le plus lourd n'est pas un tunnel : c'est que **la run curieuse ne lance son premier dé qu'à l'écran 78**, et que les trois lecteurs de ce transcript ont noté RÈGLES 4-6 en l'ayant lu jusqu'au bout — le dé, l'Anneau, les paliers, les états, tout ce qui fait la règle, ils ne l'ont vu qu'en jouant la réplique. Le LISEZMOI décrit cette run comme celle qui « explore » ; pour ce panel, c'est celle qui ne joue pas.

---

## 6. CE QUI VIENT DE LA RÉPLIQUE (récapitulatif, pour ne pas le compter au jeu)

- l'étiquette « ◉ LE GEÔLIER » (5/5 la citent comme le moment où EUX s'éclaire) ;
- le procès sans témoins (L1, L3) ;
- « OBTENU — trouvaille rare » sans nom (L5) ;
- le Registre entre crochets (L3) ;
- la puce JOUR en pleine nuit dans la grange (L4) ;
- « M O R T » sec sans séquence (L2, L3) ;
- le nom « Cendre » non choisi (L2, L4, L5) — artefact des transcripts automatiques, pas de la réplique.

Et ce qui vient du **paquet** : l'absence de l'intro, du Seuil et du carton d'acte dans les deux transcripts de première run ; le bandeau du Geôlier aplati ; le curseur capturé en cours de frappe (42-43).
