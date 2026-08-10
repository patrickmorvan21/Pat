# Panel du 10/08 — les défauts confirmés dans le code

Tenu au fil du panel. Un défaut n'entre ici que si je l'ai vérifié moi-même
dans la source ou reproduit. Les griefs non vérifiés restent dans les
rapports des testeurs et seront triés en phase experte.

⚠️ Aucun de ces défauts n'a été corrigé pendant le panel : toucher au jeu
pendant que des testeurs le jugent invaliderait leurs mesures. Les seules
corrections faites en cours de route portent sur l'OUTIL de test.

---

## A. Défauts de l'OUTIL, corrigés pendant le panel (4)

Ils ont faussé une partie des vies jouées. Détail dans les commits.

1. **Impasse dans tous les lieux qui retiennent** — un choix de sortie sans
   destination (`sortie: {}`) était pris pour une absence de sortie : en
   JavaScript un objet vide est vrai, en Python il est faux. 13 sorties
   touchées. Six vies sur sept injouables pour un testeur.
2. **Épitaphe lue deux fois** de part et d'autre du mot MORT.
3. **Ambiance de pleine lande servie dans le village**, juste après en avoir
   franchi la porte — le test « suis-je au village » de la réplique était
   plus étroit que celui du jeu. Vu dans cinq vies sur cinq.
4. **Trois issues de jet sur quatre vides au procès** — un commentaire
   français dont l'apostrophe cassait l'extraction des textes. D'où une mort
   avec pour épitaphe une virgule. Même piège que celui corrigé le 9/08 dans
   la fonction voisine. Touchait aussi le Studio.

5. **Le pilote du vrai build rembobinait le jeu** — son script d'amorçage se
   rejoue à chaque navigation, y compris quand le JEU recharge lui-même la
   page (fin de la séquence de mort). Il réinjectait alors l'instantané pris
   avant la commande et effaçait ce que le jeu venait d'écrire. D'où deux
   accusations graves portées contre le jeu — « la mort s'annule au
   rechargement » et « la fin de traversée boucle » — que le testeur a
   lui-même retirées après avoir prouvé la cause (il écrit `deaths=99`,
   recharge, relit `2`). ⚠️ Piège déjà documenté le 8/08, recommis.

---

## B. Défauts du JEU, vérifiés dans la source

### B1. La bannière « OBTENU » ment quand la Besace est pleine
`components/Scene.tsx` (branche du Destin) : l'objet n'est ajouté que si le
slot a de la place, mais le bandeau s'affiche dans tous les cas. Le
commentaire du code assume l'intention (« la Besace pleine impose un vrai
arbitrage ») — mais rien ne le dit au joueur, qui lit « OBTENU — AMULETTE
D'OS VERDI · RARE » et ne reçoit rien. L'intention est bonne, l'exécution
ment. *(relevé par W3, deux fois)*

### B2. Le dédoublonnage des corbeaux se désarme tout seul
`lib/scene-data.ts`, `corbeauxDuHameau()` : quand les trois phrases du palier
ont été vues, la fonction **retombe sur le vivier complet** et re-tire par
`(pas × 7) % n` — soit exactement la rotation par parité que le
dédoublonnage était censé remplacer. Et le registre `reactionsVues` est
partagé avec les réactions d'états, donc il s'épuise vite. *(W4 : « Ils sont
six, alignés, du même côté » lu six fois mot pour mot)*

### B4. Le portrait du Seuil dit « courageux » à qui a fui partout
`lib/prologue-data.ts`, `portraitDuSeuil()` : la dominante est initialisée sur
la PREMIÈRE stat de l'ordre (Courage) et ne change que sur un `>` strict. Un
profil plat — ce qui arrive dès que le joueur répond uniformément — laisse
donc **toujours Courage** en tête. Un joueur qui s'est dérobé aux quatre
souvenirs s'entend dire « Tu avances avant de comprendre. Le danger t'a
toujours moins arrêté que le doute. » C'est le moment le plus identitaire du
jeu, et il peut décrire l'inverse de ce qu'on vient de faire. *(W2, vérifié
dans la source)*

### B5. Le bandeau du Geôlier s'écrase quand la barre de choix grandit
La zone centrale ne se remesure pas : à trois boutons le bandeau est intact ;
dès qu'« Observer les alentours » en affiche cinq, il tombe à une ligne, puis
disparaît en tranchant la narration en plein mot. C'est pour ça qu'un testeur
n'a pas reconnu le personnage central du jeu. *(W2, captures à l'appui, après
avoir lui-même corrigé son premier diagnostic)*

### B3. RÉSOLU — le permadeath tient
Vérifié dans la source (les deux seuls points de mort appellent `recordDeath`
avant d'afficher l'écran, puis réinitialisent la partie) **et mesuré en jeu
par le testeur qui l'accusait** : mort réelle au procès, compteur de morts
1 → 2, reliques 1 → 2, héros neuf. Accusation retirée par son auteur, cause
identifiée (artefact n°5). Le pilier tient.

### B6. La mémoire entre les vies existe — c'est sa LIVRAISON qui manque
Contre-vérifié sur le vrai build avec deux morts au compte : la Borne grave
bien « LE SEAU » et ses deux entailles, les corbeaux disent « ils sont
deux », le Registre liste les morts du joueur aux rangs 11-13. Le grief
« survivre/mourir ne laisse rien », porté par six testeurs, était donc faux
sur le fond — mais il pointait quelque chose de réel, formulé par W4 :

> Le défaut n'est pas l'absence, c'est la livraison — chaque réponse arrive
> seule, deux touchers plus loin.

Les traces existent, dispersées, hors du moment où elles pèseraient.

---

## C. Griefs convergents à trancher en phase experte

Non vérifiés ligne à ligne, mais rapportés par plusieurs testeurs
indépendants et cohérents entre eux.

1. **L'abstention est la stratégie gagnante** — 0 mort sur 16 vies en lançant
   peu le dé, 8 sur 16 en le lançant beaucoup (K3, 32 vies). Le pilier
   central du jeu est facultatif.
2. **Ce n'est pas l'acte qui déplace l'anneau, c'est l'état** — correction
   apportée par K1 et K3 à la mesure de W3 (qui croyait l'amplitude plate).
   Plus dur que le constat d'origine : la décision elle-même ne pèse pas.
3. **Le procès du Soupçon est le seul vrai tueur** — 7 morts sur 8 (K3), 2
   sur 4 (K2). Jet unique, seuil 13, tue quelle que soit la santé.
4. **Acquittement qui n'acquitte pas** — gagné, rejugé aussitôt, trois procès
   d'affilée (W3). Le code pose pourtant Soupçon à 4 : à reproduire.
5. **Survivre ne laisse rien** — unanime, y compris sur le vrai build.
6. **Sept paliers annoncés, quatre textes écrits** — mesuré sur 111 jets :
   DE JUSTESSE = RÉUSSITE = ÉCLATANTE mot pour mot, ÉCHEC = FUNESTE mot pour
   mot ; seuls le 20 et le 1 ont une prose à eux (K3). C'est une décision
   assumée du 13/07 (« le verdict et le visuel portent la nuance ») — mais
   cinq testeurs l'ont relevée séparément comme un défaut.

6 bis. **Le partage du coût est invisible, pas absent** — K5 a RETIRÉ son
   « deux états = invulnérabilité » après re-mesure et donné la vraie règle,
   confirmée par K3 : sur 118 échecs durs, **21/21 coûtent de la santé en
   combat, 13/97 hors combat**. Le corps paie, la parole jamais. C'est le
   système de coût par nature du 9/08, qui fonctionne comme prévu — mais rien
   ne le dit au joueur : « Goûter un fruit [COURAGE] » ne peut rien coûter,
   « Franchir le coude [INSTINCT] » coûte 0,23, même habillage.

6 ter. **Toute la fiche de personnage vaut deux encoches sur vingt** (K3, en
   croisant ses anneaux avec ceux de W3). Les stats existent, elles ne pèsent
   presque rien.
7. **La mémoire est branchée sur les tentatives, pas sur les actes** — le
   monde se souvient d'une écharde jamais arrachée, et oublie une corde
   tranchée (W4).
8. **L'image contredit le texte** — le Moulin *sans Ailes* montre ses quatre
   ailes (4ᵉ signalement), « pas de tombes, des poteaux » sur un cimetière de
   pierres tombales, « neuf potences en cercle » sur une file de quinze
   alors que la bonne image existe ailleurs (W1).
9. **Le Geôlier n'est pas reconnu** — bandeau écrasé sur une ligne, phrase
   coupée (W2, 3 fois sur 3) ; répliques prises pour celles de PNJ (W1).
10. **Aucun état permanent à l'écran** — jour, états et santé apparaissent
    une fois puis disparaissent (W1).
