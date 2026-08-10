# Panel de 10 joueurs en aveugle — 10 août 2026

Dix agents ont joué PACTUM sans rien savoir du projet, deux à quatre vies
chacun, sur des tables isolées. Puis trois relecteurs qui n'avaient pas joué
ont **vérifié chaque grief dans le code**, un par un.

Ce document est la liste vérifiée. Verdicts : **CONFIRMÉ** (le défaut existe
dans le jeu) · **ARTEFACT** (vrai dans la réplique de test, faux dans le jeu) ·
**INFIRMÉ**.

---

## LE DIAGNOSTIC CENTRAL — deux jauges, interverties

C'est la trouvaille de l'exercice, et elle explique pourquoi les joueurs se
contredisaient : trois d'entre eux ont joué 3-4 vies d'imprudence pure **sans
jamais mourir** pendant que d'autres mouraient au Jour 1.

**Le jeu a deux jauges de vie, et ce n'est pas celle qu'on montre qui tue.**

| | La santé | Le Soupçon |
|---|---|---|
| Racontée par l'interface | **oui**, massivement : 4 paliers d'érosion, CTA rongés, nappe de pixels morts, tremblement des textes | **jamais nommée** |
| Alimentée par | 21 jets sur 85 (24,7 %) — la nature `physique` seule | la moitié des jets du jeu (le social fait 52 %) + 31 sources contre 13 remises |
| Tue | **jamais en pratique** | **toujours**, à 6, à pleine santé, sur un échec ordinaire |

Chiffres mesurés : **30 lieux sur 40 n'ont aucun jet physique** ; 15 des 21 sont
dans quatre combats ; une traversée en croise ~1,9. Mourir d'usure exigerait de
rater à peu près tous les jets physiques que la partie propose. D'où la santé
« figée à 0,42 » constatée par trois joueurs indépendamment (= 1 − 0,16 − 0,26 −
0,16). Une fois les combats consommés, elle est mathématiquement gelée.

Le procès, lui, tue sur **toute** marge négative — `fatalCheck` court-circuite
le calcul de santé — avec 60 % d'échec à stat neutre, et aucune de ses quatre
options ne permet de sortir sans lancer.

**Donc :** le joueur imprudent lit l'érosion, se croit en danger, ne l'est pas ;
pendant ce temps il remplit le compteur qui le tuera sans qu'un pixel ne bouge.
Le problème n'est ni « trop rare » ni « trop brutal » — **le canal qui signale
et le canal qui tue ne sont pas le même**.

### À NE PAS TOUCHER
1. « Seul le physique blesse » — c'est ce qui fait que la prose de l'échec
   correspond au coût. La renverser rejouerait « Entaillé après une
   conversation », corrigé le 8/08.
2. La létalité du procès en soi. Une zone qui vous juge doit pouvoir condamner.
3. La santé comme ressource de COMBAT : elle rend les quatre combats mémorables.
   La durcir punirait celui qui se bat, pas celui qui pose problème.

### LES TROIS LEVIERS (dans cet ordre)
1. **Le Soupçon doit annoncer son propre enjeu.** Les trois canaux existent
   (craie qui migre, manifestations, Geôlier). Le monde dit « on te regarde »,
   il ne dit jamais « on juge, et on ne juge qu'une fois ». Une phrase au
   palier 5 — et au palier 5 seulement, pour que ce soit un avertissement et
   non un bruit de fond. La Doyenne a déjà la voix pour ça.
2. **Rendre le procès survivable par la PRÉPARATION, pas par le dé.** Le
   mécanisme existe déjà (`defense: "preuve"` abaisse le seuil à 11). Le
   généraliser : chaque défense gagnée AVANT de savoir que le procès existe
   (un papier du hameau, un témoin qui vous doit quelque chose, le Serment
   tenu) abaisse le seuil d'un cran. Rien n'est affiché — **l'Anneau, calculé
   sur ce seuil, montre la différence en encoches**. Une pièce lancée devient
   la conséquence d'une trajectoire.
3. **Sortir le risque physique des seuls combats** — sans toucher au barème :
   ajouter des jets. Les textes décrivent déjà les gestes (les trois volées de
   la Tour, le Puits, les cordes de la Chapelle, la fosse, se pencher sur la
   Mare). Une option physique dans ces lieux rend l'usure crédible sans qu'une
   parole ratée ne saigne.

Aucun des trois n'affiche de chiffre, n'ajoute de Jour, ni ne fait saigner une
conversation.

---

## LES BUGS DE MOTEUR (les plus rentables — deux lignes chacun)

**1. « Entrer dans le hameau » — bug d'ordre d'écriture, cause du grief n°1.**
`run.hameau.entree` est posé à la FIN d'`advance()` (`Scene.tsx:2534`), mais la
chaîne de routage le lit ~840 lignes plus haut **dans le même appel**
(`Scene.tsx:1697`, `1744`). Le bouton tourne donc avec `entree = false`. Deux
effets : (a) si le hameau est le dernier lieu tiré, la Halte est sautée et on
est envoyé droit à la Palissade Sud — **la téléportation rapportée n'est pas un
artefact** ; (b) dans **100 % des runs**, la croisée qui suit l'entrée exclut
tout l'intérieur du village. Correctif : remonter l'écriture du drapeau.

**2. Les paliers de Soupçon sautent des crans.** `soupconSeen = soupAfter`
(`Scene.tsx:2551`) saute directement au palier atteint : un `+2` ou un
doublement MARQUÉ franchit 2 à 4 crans et n'en montre qu'un. Et les deux
échelles (village / craie) sont entrelacées par lieu. D'où le texte « la craie
a CHANGÉ de place » sans première marque, et « deux marques sur le même bras »
alors qu'elles étaient sur un muret et une besace. Servir les crans un par un.

**3. La traversée indexe les scènes par ID, pas par LIEU.** D'où le Bailli
découvert deux fois mot pour mot dans la même vie sous le même nom d'écran, et
le Champ des Fixés visité « en découverte » après y avoir combattu. Un champ
`Scene.lieu` + un filtre dans `pickLiaisonOptions` corrige les deux.

---

## LES TEXTES (à moi)

### Le défaut n°1 — la sortie de scène contredit l'action (10/10 joueurs)
**CONFIRMÉ sur 9 des 12 scènes de séjour** — les lieux les plus fréquentés, pas
une branche rare. Le beat de sortie est rendu verbatim sans jamais consulter
`run.choixFaits`, qui porte pourtant l'information.

Les deux correctifs envisagés d'abord sont écartés par les vérificateurs :
supprimer la sortie **casse le build** (un garde impose une sortie
inconditionnelle, sinon on enferme le joueur) ; réécrire une phrase unique est
impossible par nature (elle doit être vraie après avoir aidé le Fossoyeur ET
après être passé au large).

**Ce qu'on fait :** ~80 % de l'irritation part sans code — ces sorties ne sont
fausses que parce qu'elles **affirment la branche nulle** (« sans avoir
compté », « il ne lève pas la tête », « il ne saura jamais »). Neuf phrases
rendues neutres suppriment la contradiction tout de suite. Puis un champ
`Choice.sortieVariantes` (~10 lignes, sur le modèle de `narrationEchec`) pour
faire de la sortie une vraie récompense là où ça vaut le coup — il couvre aussi
le Serment, la Palissade et le retour au Tribunal : **le même défaut sous
quatre griefs**.

### Les objets — 9 des 22 points de don sont fautifs
Les joueurs en avaient vu 4. Un point d'intérêt donne un objet que sa prose ne
nomme pas (le Jouet sur une lucarne « vide »), et deux textes donnent un objet
que la Besace ne reçoit jamais (la corde de la Chapelle sur ses 4 issues, la
lanterne du Veilleur sur 2). Plus un bug d'identité : le 20 naturel de
« Fouiller les offrandes » nomme *une Pierre de Retour*, qui est un AUTRE objet.

**Le plus grave :** l'issue d'échec de « Produire un papier » accuse d'un vol —
alors que l'objet a le plus souvent été **donné en récompense** par le
Fossoyeur. Et cet échec tue.

### Le reste, vérifié et chiffré
- **Deux choix supposent un équipement inexistant** : « Jeter tes vivres »
  (aucun objet de nourriture n'existe dans tout le catalogue) et « Montrer tes
  plaies » (offert à pleine santé). « ta lame » et « Produire un papier » sont
  INFIRMÉS — la dague est au départ de tout héros, et la défense est bien
  conditionnée à la possession.
- **5 choix ferment un lieu sans le dire** — dont **3 sur la Borne Frontière**,
  le premier écran de chaque vie. *L'écran qui enseigne la grammaire enseigne
  la mauvaise.* Plus 32 choix qui consomment l'écran d'arrivée et ses points
  d'intérêt. Recommandation retenue : renommer les 5 (la convention existe
  déjà — les 13 sorties de séjour sur 13 portent un verbe de départ), puis
  étendre le séjour aux écrans d'arrivée avec un garde de build.
- **Le Soupçon** : la règle n'est écrite qu'une fois, sur un point d'intérêt
  facultatif d'un lieu facultatif (le mur du Petit Tribunal). Et **13 choix**
  le font baisser sans qu'un seul l'annonce.
- **Les répétitions de marche** : l'anti-répétition FONCTIONNE (0 % de répétition
  intra-vie mesuré). Mais sa portée est la VIE, et les joueurs en ont fait 2 à 4
  → 83-91 % des sessions contiennent un texte servi ≥ 3 fois. Trois fuites
  précises : 4 points de départ sur 18 n'ont aucune variante (dont la Borne,
  1re croisée de chaque vie), la règle « spécificité max » effondre parfois le
  pool à 1, et deux textes (le gabarit « D'un côté… De l'autre » et
  `ROUTE_FERMEE`) n'ont **aucun** anti-répétition.
- **La Mare** : garder `creux-doubles` (il porte une découverte et montre au
  lieu d'énoncer), supprimer `berge-usee` — mais la narration d'arrivée nomme
  celui qu'on supprime, et le JSON de production ne connaît que celui-là.
- **6 fautes** : « dès la première pas », « Tu note », « le ridelle », « on ne
  me demande plus de défenses », « deux fois… et la troisième », apostrophes
  mélangées dans 17 scènes sur 89.
- **Ruptures de ton** : « ça s'appelle mardi » (le plus grave — c'est la voix de
  narration, qui n'a aucune licence d'ironie), « changement d'horaire »,
  « employé du mois » (le plus défendable — le Geôlier est un comptable).
- **Contradictions de décor** : le moulin « plus large que haut » dont le
  faîtage se mesure en cinquante pas · « une lanterne allumée en plein jour »
  ×3 dans un monde sous « un crépuscule qui ne tombe pas » · « une seule
  cheminée fume sur une vingtaine » puis « onze maisons vivantes sur vingt ».
- **« compter »** : 93 occurrences sur 44 scènes. Le motif est le thème assumé ;
  le défaut est la densité littérale du verbe sur les usages non thématiques.

---

## LES ARTEFACTS (griefs qui tombent)

Six systèmes que la réplique de test ne joue pas du tout, et qui ont produit
des griefs faux :
1. **Le prologue et les stats** — la réplique ignore les stats du héros ; le vrai
   jeu ajoute `stat − 3` (de −2 à +2) à chaque jet. Le grief « les tags de stat
   ne pilotent rien » tombe.
2. **La Halte au hameau** (17 scènes absentes de la réplique).
3. **L'usage des objets.**
4. **Les textes de nuit** — « dormir ne dit rien » tombe.
5. **L'enregistrement des traversées.**
6. **`LIAISON_VARIANTS`** (découvert par le 3e vérificateur) : la réplique tire
   dans **9 textes** là où le jeu en a **66**. Le grief sur les répétitions est
   massivement amplifié par l'outil.

Tombent aussi : la récompense du Destin sans nom (libellé de la réplique) · le
postulat « tu es mort » jamais posé (il est en clause 1 de l'intro — avec une
vraie réserve : cette intro ne rejoue jamais) · l'accusation du procès jamais
énoncée (le jeu la dit témoin par témoin ; la réplique n'a pas de témoins) ·
le compteur « 8/7 » (commande de débogage de la réplique — mais l'écart de
comptage, lui, est réel).

---

## CE QU'IL NE FAUT PAS CASSER

Les dix l'ont dit, souvent avec les mêmes mots : l'écriture · l'anneau du dé
(compris seul, sans explication, par les dix) · l'érosion du cadre comme jauge
de santé · la craie qui migre · les points d'intérêt qui font marcher avant de
montrer · **la mémoire du monde entre les vies** (« ta main s'est posée sur le
talus sans que tu l'aies décidé ») — plusieurs la citent comme le sommet du
jeu et demandent qu'on l'étende · les grandes scènes de personnage (le
Marcheur, le gamin, le Bailli, le Veilleur, la Femme au Seuil).

Aucun des dix n'a été gêné par la mort définitive, l'absence de chiffres ou la
lenteur. Plusieurs disent explicitement que l'absence de chiffres est ce qui
leur a fait *deviner* au lieu de lire.
