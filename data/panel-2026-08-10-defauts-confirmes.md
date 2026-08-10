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

### B3. Il n'existe aucune branche où la mort ne s'enregistre pas
Vérifié : les deux seuls points de mort appellent `recordDeath` **avant**
d'afficher l'écran, puis réinitialisent la partie. Le « permadeath
contournable en rechargeant » rapporté par W4 s'explique donc autrement — la
partie étant remise à neuf, un rechargement montre une vie neuve à pleine
santé, ce qui ressemble à une résurrection. **Le compteur de morts resté à
zéro reste à confirmer** : c'est la seule mesure qui tranche.

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
6. **Les paliers du dé partagent leur prose** — quatre testeurs. Trois paires
   relevées où deux paliers voisins rendent un texte identique.
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
