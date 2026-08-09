# PACTUM — Rapport de playtest systémique (profil : game designer / min-maxer)

**Protocole.** 4 vies complètes sur la table de jeu (réplique v1.58.1, zone Les Landes), `etat` relevé après chaque jet, + 1 replay de contrôle (graine 11 rejouée : même carte, même dé sur le même choix → le déterminisme annoncé est tenu, les jets sont liés au choix, pas à une séquence globale). Transcript du vrai jeu (v1.57) lu en contrepoint. Tout ce qui suit distingue **JOUÉ** (mes vies) de **LU** (transcript réel).

| Vie | Stratégie | Issue | Jets | Santé finale | Soupçon final | Objets |
|---|---|---|---|---|---|---|
| 1 (graine 11) | Tout-risque, provocation | **Survie**, Jour 3 | 14 | 0.74 | **12** | 0 |
| 2 (graine 22) | Tout-observation | **Survie**, Jour 3 | 7 | 0.70 | 2 | 4 |
| 3 (graine 33) | Évitement maximal | **Survie**, Jour 4 | **1** | **1.00** | 1 | 1 |
| 4 (graine 44) | Recherche active de la mort | **Survie**, Jour 3 | 10 | 0.16 | 2 | 0 |

---

## 1. Verdict (5 lignes)

Oui, il y a une stratégie dominante, et elle est brutale : **observer tout + ne jamais lancer le dé quand une option passive existe**. La vie 3 a traversé la zone entière avec UN seul jet, santé 1.00, zéro coût — les options passives ne coûtent jamais rien, nulle part.
La mort n'est **pas une menace réelle** : en cherchant activement à mourir (vie 4 : tous les combats, les pires options, un FUNESTE à enjeu fort, deux ÉCHECS combat), je finis à 0.16 de santé — vivant. 4/4 survies. Le budget de dégâts disponible dans une traversée (~5 jets « qui font mal » × −0.16/−0.30) ne suffit mathématiquement presque jamais à consommer 1.00 de santé, surtout avec un camp qui soigne.
L'ambiance, l'écriture et la boucle d'observation sont excellentes ; c'est le **coût de l'échec** qui ne mord pas : hors combat, la quasi-totalité des échecs que j'ai joués ont coûté 0.00.

## 2. Problèmes d'équilibre / système, classés

### P1 — La mort est hors d'atteinte (le pilier du jeu ne tient pas)
Barème relevé (JOUÉ) : échec combat **−0.16**, FUNESTE **−0.26**, MALÉDICTION **−0.30**, échec « physique » d'exploration (écharde) **−0.16**. Tout le reste : 0.00.
Vie 4, run suicide : pendu ÉCHEC (1.00→0.84 + Entaillé permanent), chien FUNESTE (0.84→0.58), corde du Bailli FUNESTE à enjeu fort (0.58→0.32), écharde ÉCHEC (0.32→0.16) — et la traversée s'est terminée avant que je puisse encaisser un 5e coup. Une traversée n'offre que ~4 à 6 jets capables de blesser ; même en les ratant TOUS on survit souvent, et le camp (+ soin) existe. La spirale Entaillé (−2 au dé, anneau visiblement rétréci) est bien conçue mais elle ne fait qu'augmenter la fréquence d'échecs… qui coûtent peu.

### P2 — L'évitement total est gratuit et strictement optimal
Vie 3 : 7/7 lieux, 1 jet (le seul forcé : le Chien du Bailli — seule rencontre sans issue passive rencontrée). « Écouter immobile », « Se relever sans regarder », « Partir avant de comprendre », « Passer sans un mot », « Sortir par le talus », refuser le jugement du Bailli, « Je ne fais que passer » : aucun de ces choix n'a de coût, même différé. Refuser le Serment (vie 1) = on me « laisse dehors »… et rien ne change. Le conseil de survie le plus dramatisé de la zone (la Bête qui « attaque ce qui lui tourne le dos », 30 ans de lore du Marcheur) : je l'ai **délibérément ignoré** (vie 3, « Continuer normalement ») — il ne se passe rigoureusement rien. La menace la plus annoncée du jeu n'a pas de dents.

### P3 — Le Soupçon n'a jamais eu de conséquence (JOUÉ) alors qu'il monte très vite
Vie 1 : 0→4 en un écran (frapper à une porte + échec « Passer sans t'arrêter »), 6 après le refus du Serment, **8** après une simple question, **12** au Jour 2 après deux nat-1 sociaux (+2 chacun). À 12 — j'entre au village, au marché, au tribunal — **aucun procès, aucune manifestation, aucun palier, rien**. Le levier de dénonciation (« Donner un nom à la plume », visiblement le soulagement prévu) n'a donc aucune raison d'être utilisé. Contrepoint LU : dans le transcript réel un état `fixe` apparaît et le soupçon reste ≤4 sur une longue run curieuse — je soupçonne donc un écart réplique/jeu réel, mais les **deltas** (+2 par question ratée, +3 par critique social, seuil annoncé à ~6) sont incohérents entre eux : soit le procès tombe sur tout joueur curieux dès le Jour 2, soit il ne tombe jamais. Les deux réglages que j'ai pu observer sont aux deux extrêmes.

### P4 — Butin fantôme, et butin SUR ÉCHEC
Asymétrie majeure relevée (JOUÉ) : les examens de points d'intérêt donnent de **vrais objets en besace** (vie 2 : pierre-retour, craie, fruit, miroir ; vie 3 : grelot), mais les récompenses des jets risqués n'arrivent jamais : 3 DESTIN (« Pierre de Retour », butin de combat, troc réussi « un paquet de toile cirée ») → **besace vide à chaque fois**. Contrepoint LU : le transcript réel montre des DESTIN qui donnent bien (« BAUME COMMUN », « LARME DU GEÔLIER · LÉGENDAIRE ») — donc probablement un manque de la réplique, à vérifier. Mais deux cas restent graves dans les deux mondes : **le vol raté de la corde coupée** (vie 1 : ÉCHEC, « la chapelle entière connaît ton visage » → 0.00 santé, +0 soupçon, ET « tu sors avec la corde ») et **l'écharde ratée** (vie 4 : « tu emportes l'écharde » sur ÉCHEC). Un échec de vol dans le village de la surveillance qui ne coûte rien ET rapporte l'objectif narratif, c'est le contre-exemple exact du contrat « le coût suit sa nature ».

### P5 — Des paliers d'échec entiers coûtent 0.00 (le contrat de coût n'est pas tenu hors combat)
Mesures (JOUÉ) : « DE JUSTESSE » ×2 (tribunal, cordes) → 0.00. ÉCHEC « Boire à la mare » (surnaturel) → 0.00, **aucun état** (LU : dans le vrai jeu le même échec donne −0.16 + FIÉVREUX — la version réelle est la bonne, la réplique dit le contraire ; à trancher). **FUNESTE** d'errance au verger → 0.00. Échec social → soupçon seul, très bien — mais si le soupçon ne déclenche rien (P3), la moitié des échecs du jeu sont cosmétiques. « Exploration → occasion perdue » n'existe pas non plus en pratique : rater un examen ne ferme rien, on peut encore tout regarder.

### P6 — La fin de traversée écrase la dernière scène (3 fois sur 4)
Dès que le quota de lieux est atteint, le jet en cours téléporte à la Descente **au milieu d'une rencontre** : vie 2, le Chien s'assoit → Descente dans le même écran ; vie 4, l'écharde → Descente ; vie 3, « Entrer dans le hameau » → Descente sèche, **tout l'intérieur du hameau sauté** (halte, marché, nuit — jamais vus dans cette vie). Conséquence systémique : les dettes différées n'échoient jamais — le faux Serment de la vie 3 (« il a entendu le vide dedans ») n'a **jamais** été réglé, le grelot non plus. Un « prix différé » qui n'échoit pas avant la fin de zone est un prix nul, et le min-maxer le sait vite : mentir est gratuit.

### P7 — Les options à Savoir ne sont pas verrouillées (et cassent la cohérence)
JOUÉ, deux cas nets : « Parler de la femme de l'ouest » proposé et joué alors que je ne l'ai **jamais** rencontrée (le texte répond « Elle t'avait prévenu que ça commençait comme ça » — prévenu de rien) ; « Parler des marques d'oreille » au Fossoyeur alors que je n'ai vu aucune marque (« Tu dessines les entailles de mémoire » — quelle mémoire ?). Si le vrai jeu verrouille ces options, la réplique ment ; si non, tout le système « l'exploration ouvre des options » est déjà ouvert par défaut, donc sans valeur. À trancher d'urgence, c'est la récompense centrale revendiquée.
Cohérences annexes relevées : au Verger, « Tu sais ce que tu as : rien » avec 3 objets en besace (et la fouille de besace énumère des objets que je n'ai pas : « écharde de gibet, chanvre béni ») ; à la Tour, l'escalier cède (ÉCHEC) mais le Guetteur enchaîne « Tu as vu là-haut » comme si j'étais monté.

### P8 — Économie du temps et générosité des états
Le Jour ne fait rien : dormir au Moulin à santé pleine (vie 3) = +1 Jour, zéro événement, zéro texte de nuit, zéro coût/bénéfice. Aucun « besoin » ne s'est déclenché en 4 vies (Jour max : 4). À l'inverse, AGUERRI (+2) s'obtient pour presque rien : contourner le chien **sans le voir** le donne (vie 3), le caresser aussi (vie 2). Un buff de combat gagné en évitant le combat, sur des jets déjà faciles (seuils 11-13), aplatit encore le risque.

Mineur, en vrac : échappements Unicode bruts à l'écran (`l’ouest`, ×10 écrans — réplique) ; bloc ASCII illisible (« + , + ») sur l'écran du Serment ×2 vies ; LU : le bandeau d'état (« Hanté Ce que tu as vu… ») apparaît DANS la liste des choix cliquables du transcript réel ; écrans à 5-6 choix (marché, tribunal) là où la grammaire du jeu en promet 3.

## 3. Les 3 systèmes qui marchent le mieux

1. **L'Anneau du dé + les états qui le déforment.** Les encoches disent la vraie probabilité sans un chiffre, et Entaillé/Aguerri se LISENT dedans (vie 4 : l'anneau passe de 10 à 6 encoches sous Entaillé — j'ai compris ma blessure sans qu'on me la chiffre). C'est la meilleure interface de risque que j'aie vue dans le genre, et mes relevés confirment qu'elle ne ment jamais (seuil − modificateurs = encoches, vérifié sur 32 jets).
2. **Le coût typé, là où il est branché.** Combat→santé + blessure persistante : vérifié 6 fois, jamais d'exception ; social→soupçon sans jamais toucher la santé : vérifié 6 fois. Quand le contrat est appliqué, il est appliqué proprement — le problème n'est pas le principe, c'est les branchements manquants (P4/P5).
3. **La boucle d'observation.** Les points d'intérêt donnent des objets réels, des rencontres cachées (l'Hésitant, le Marcheur, les Époux — les trois meilleurs moments de mes 4 vies) et du lore qui recontextualise mécaniquement (le poteau à MON nom, les corbeaux qui comptent MES morts, le rythme des neuf cordes). « Récompenser les curieux » est tenu — c'est même le seul canal de récompense qui fonctionne (cf. P4).
   Mention : l'érosion de l'interface avec la santé (les cadres se rongent à 0.74, 0.32, 0.16) — lisible même en ASCII, très fort.

## 4. Recommandation prioritaire de dosage

**Tripler l'espérance de perte d'une traversée, en payant chaque palier d'échec, partout.** Concrètement : espérance de perte totale d'une run médiane aujourd'hui ≈ 0.2–0.3 de santé (mes 4 vies : 0.00 / 0.30 / 0.26 / 0.84 en cherchant la mort) — il faut viser ~0.9–1.1 pour qu'une traversée moyenne frôle la mort une fois et que le camp, le baume et la Pierre de Retour deviennent des décisions. Trois leviers, dans l'ordre : (a) appliquer les coûts déjà spécifiés mais inertes — « de justesse » −0.06, échec surnaturel → état négatif (le FIÉVREUX du vrai jeu, jamais vu dans mes vies), échec d'exploration → fermer le reste des points du lieu (l'« occasion perdue » devient vraie) ; (b) faire échoir les dettes AVANT la fin de zone et interdire à la Descente de couper une rencontre en cours (P6 — sinon mentir et voler restent gratuits) ; (c) donner un coût aux sorties passives des rencontres (fuir le Chien sans jet = perdre un objet ou +1 Jour, refuser le Serment = vrai malus dans le village). Sans (c), la stratégie dominante « ne jamais lancer le dé » reste imbattable et le dé — l'objet central du jeu — devient un piège pour les seuls joueurs sincères.
