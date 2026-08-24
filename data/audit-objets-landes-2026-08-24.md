# Audit des objets — conséquences réelles dans les Landes

**Date** : 24/08/2026 · **Build audité** : v1.93.4 · **Lecture seule, aucun code modifié.**
Sources : `lib/besace.ts` (définitions), `lib/scene-data.ts` (accroches), `components/Scene.tsx` (moteur : ramassage, usage, 4ᵉ choix, échos), `data/studio-data.json` (recoupement).

---

## Le verdict en une phrase

**13 objets sur 27 sont réellement branchés** (48 %) — c'est mieux que ce que tu craignais, parce que trois chantiers récents (objets réels du 23/07, `requiresObjet` du 13/08, préparation des combats du 14/08) ont déjà fait ce travail pour les objets *placés*. Le problème restant est double : **les 6 passifs « +1 » sont des bonus invisibles au sens strict de ta règle** (l'Anneau montre plus d'encoches pleines, mais rien ne dit jamais que c'est l'objet), et **le contrat de visibilité n'est tenu par presque personne** — la plupart des branchements dépendent d'un tirage de lieux qui ne garantit ni la rencontre de l'aval, ni son ordre.

Aucun objet n'est strictement décoratif (zéro effet). Mais deux portent une **promesse morte** dans leur texte (détail plus bas).

---

## 1. Recensement

27 objets obtenables : 17 objets placés des Landes + la dague de départ + 4 soins aléatoires + 5 récompenses de Destin. (Les Reliques sont hors périmètre : elles se forgent à la mort, elles ne s'obtiennent pas *dans* la zone.)

### Objets placés des Landes (`LANDES_OBJETS`, besace.ts:174)

| Nom | Où | Comment | Coût / risque | Effet mécanique | Effet narratif ailleurs | Fichier |
| --- | --- | --- | --- | --- | --- | --- |
| Lunette du guetteur | Tour de Guet | fouille de la meurtrière (choix passif) | consomme l'action du lieu | passif +1 tous jets | ouvre « Chercher la Tour à la lunette » à la Colline (écran 2) — la Tour est plantée dans l'axe du grand gibet | besace.ts:176 · scene-data:4352→1762 |
| Offrandes de la Borne | Borne Frontière | « Fouiller les offrandes » (jet) | échec possible au tout premier écran | actif : soin 0.25 | **aucun** — le village ne remarque jamais que la Borne a été dépouillée | besace.ts:188 · scene-data:1074 |
| Écharde du Grand Gibet | Colline (écran 2) | « Arracher une écharde » (jet) | échec possible | passif +1 combat | 1 variante d'ambiance de marche (« l'écharde est tiède… elle tire vers la colline ») — probabiliste | besace.ts:195 · scene-data:1804, ~7892 |
| Brin de Chanvre Béni | Chapelle des Cordes | loot d'arrivée (automatique) | aucun | actif : soin 0.2 + referme ENTAILLÉ | **aucun** | besace.ts:200 · scene-data:5111 |
| Carnet du Fossoyeur | Champ des Fixés (écran 2) | « Aider à redresser » (jet) | échec possible | passif +1 tous jets | « Déchiffrer le carnet » (même lieu, verrouillé) · « Confronter le carnet au Registre » (Tribunal) · **défense au procès** (`apportsProces` : un papier du hameau) | besace.ts:207 · scene-data:2226→2240, 5813, ~884 |
| Lanterne du Veilleur | Veilleur (beat 2) | don (2 choix passifs : raconter sa mort, ou le mur) | dire quelque chose de soi | passif +1 tous jets | 1 variante d'ambiance de marche (la flamme penche vers la Descente) — probabiliste | besace.ts:212 · scene-data:6758, ~7897 |
| Grelot du Charretier | Chemin Creux | fouille de la charrette (passif) | consomme l'action | passif +1 combat | « Jeter le grelot dans le puits » (Puits, écran 2) | besace.ts:218 · scene-data:1270→5495 |
| Pierre de Retour | Borne Frontière | « Faire le tour de la pierre » (passif) | aucun | passif +1 tous jets | 1 écho à la Descente (l'éclat pèse le même poids qu'au premier pas) | besace.ts:223 · Scene.tsx:309 |
| Caillou de rivière | Gamin des Murets (beat 3) | donné quelle que soit l'issue | avoir suivi le Gamin (+1 Soupçon à l'embauche) | passif 0 (voulu) | « Montrer le caillou » au Colporteur — il confirme l'eau courante impossible | besace.ts:233 · scene-data:2912→4509 |
| Clochette de meneuse | Troupeau sans Berger (écran 2) | « Prendre une bête » (passif) | voler la bête d'un pendu — l'objet t'annonce | passif 0 (voulu) | **préparation de combat** : remplace « Hurler le premier » à la Meute (beat 1) et « Tenir le premier assaut » au retour de la menace (`masqueSi`/`requiresObjet`) | besace.ts:244 · scene-data:4260→6088, 4089 |
| Miroir de Poche Fêlé | Mare aux Regards | « Longer la berge usée » (passif) | consomme l'action | actif : soin 0.15 | **aucun** — et il s'obtient au lieu même du reflet, sans qu'aucun des deux ne cite l'autre | besace.ts:249 · scene-data:6139 |
| Craie du Condamné | Champ des Fixés | « Aller voir le vide dans la rangée » (passif) | consomme l'action | passif +1 tous jets | « Écrire un nom à la craie » à la Chapelle (+1 Soupçon, la corde s'immobilise) | besace.ts:259 · scene-data:2019→5261 |
| Jouet de la Petite Fixée | Moulin (entrer) | trouvé en entrant (passif) | consomme l'action | passif +1 tous jets | « Lui montrer la poupée » au Fossoyeur — « Celle-là, j'ai jamais eu de poteau à tailler pour elle » | besace.ts:264 · scene-data:4682→2209 |
| Clé du Portillon | Palissade Sud | « Examiner le portillon » (passif) | consomme l'action | passif +1 tous jets | **aucun** — et son flavor promet « elle ouvre le retour » : rien dans le code ne lit cette clé | besace.ts:269 · scene-data:6569 |
| Fruit de Cendre | Verger Noir | « Décrocher un fruit et mordre » (jet, surnaturel) | échec = la cendre reste dans la gorge ; funeste ♦ −2 | actif : soin 0.3 | « Chercher dans ta besace » aux Époux (beat 2) — ils ne s'entendent plus dire « je n'ai rien » | besace.ts:274 · scene-data:6277→6494 |
| Corde coupée | Chapelle (écran 2) | « Prendre la corde coupée » (jet) | échec possible | actif OUTIL (ni soin ni mod) | **l'objet pilote** : `usageObjet` au Puits — l'amarrer fait apparaître « Descendre par la corde » (COURAGE 13, highStakes) et referme les options d'observation | besace.ts:294 · scene-data:5230→5342 |
| Mèche Nouée | Femme au Seuil (beat 2) | accepter la mèche (passif ou jet d'aveu) | porter une promesse | passif 0 (voulu) | 3 échos (`ECHOS_OBJET`) : la Palissade (l'Appelé qui descend), la Descente, la Mare — des lignes, jamais un choix | besace.ts:300 · Scene.tsx:285-327 |

### Le reste

| Nom | Où / Comment | Effet mécanique | Effet narratif ailleurs | Fichier |
| --- | --- | --- | --- | --- |
| Dague simple | départ, tous les héros | passif +1 combat | **aucun** | besace.ts:67 |
| Baume de mousse noire · Fiole d'eau de gouttière · Bandage d'un autre · Onguent gris | drop aléatoire en exploration (12 % des écrans hors combat/camp, jamais deux fois le même) | actifs : soin 0.2–0.3, cure pour deux | **aucun** (chacun a son `usageTexte` à la consommation) | besace.ts:115 |
| Amulette d'os verdi · Lame de lanterne · Élixir du campement perdu · Larme du Geôlier · Clef sans porte | récompense d'un 20 naturel (`recompenseDestinQuiTient` — arme seulement en combat COURAGE) | passifs +1/+2, ou actif soin 0.5 | **aucun** — y compris la Larme du Geôlier, le seul objet légendaire, que le Geôlier lui-même ne mentionne jamais | besace.ts:132 |

**Deux canaux d'usage existent et fonctionnent** (vérifiés dans le code) : le 4ᵉ choix contextuel (« Utiliser — X » apparaît quand la santé baisse ou qu'une blessure persiste, jamais sur un écran à serment) et le bouton Utiliser du menu Inventaire. Depuis le 12/08, utiliser un objet **reste sur place** (la conséquence s'écrit, l'écran se recompose) au lieu d'enchaîner.

---

## 2. Verdicts

**Branchés — 13 / 27 (48 %)** : Lunette · Carnet du Fossoyeur · Craie · Jouet · Grelot · Caillou · Clochette · Corde coupée · Fruit de Cendre · Mèche · Écharde · Lanterne du Veilleur · Pierre de Retour.
Mais ce groupe se coupe en deux :
- **9 branchés forts** (ouvrent un choix visible ailleurs) : Lunette, Carnet (×3 accroches, dont le procès), Craie, Jouet, Grelot, Caillou, Clochette (préparation de combat), Corde (le pilote), Fruit.
- **4 branchés faibles** (une seule ligne, probabiliste ou tardive) : Écharde et Lanterne (une variante d'ambiance de marche qui concurrence ~28 autres variantes au tirage), Pierre de Retour (un écho sur l'écran le plus tardif du jeu), Mèche (trois échos, aucun choix). Selon ta règle du §4, **ces quatre-là sont à la limite de l'objet mort** : je les compte branchés parce que l'accroche existe et joue, mais un joueur peut finir sa vie sans jamais la croiser.

**Bonus invisibles — 14 / 27 (52 %)**, en deux familles distinctes :
- **6 passifs muets** (l'effet joue sur chaque jet concerné, rien ne l'attribue jamais) : Dague simple, Amulette, Lame de lanterne, Larme du Geôlier, Clef sans porte, Clé du Portillon. C'est le cas exact de ta règle §2 : l'Anneau montre plus d'encoches pleines, mais le joueur ne peut pas relier ce gain à l'objet — donc l'objet n'existe pas pour lui.
- **8 actifs sans monde** (nuance honnête : l'*usage* se voit très bien — le 4ᵉ choix apparaît, le `usageTexte` raconte le geste, l'érosion recule — mais la *possession* est muette et **le monde n'y réagit jamais**) : Offrandes, Brin de Chanvre, Miroir de Poche, les 4 soins mineurs, l'Élixir du Destin.

**Décoratifs — 0 / 27.** Bonne nouvelle à connaître : aucun objet n'est sans aucun effet. Les trois `passiveMod: 0` (Caillou, Clochette, Mèche) sont des choix de design documentés ET branchés narrativement — ce sont paradoxalement parmi les objets les plus vivants du jeu.

**Deux promesses mortes à signaler** (un texte affiché promet ce que rien ne code) :
1. **Clé du Portillon** — « Elle n'ouvre pas la Descente — elle ouvre le retour, et c'est plus rare. » Aucun code ne lit cette clé. C'est la classe de défaut que le §12 interdit.
2. **Larme du Geôlier** — le Geôlier « jure qu'il ne pleure pas », mais il ne remarque jamais qu'on porte sa larme, alors qu'il est censé tout voir.

---

## 3. Propositions de branchement

Contraintes tenues : zéro nouvelle scène, aucun nombre affiché, l'objet relié visiblement à ce qu'il ouvre. Classées par rapport valeur / effort.

### Les cinq plus rentables

**P1 — La ligne d'objet sous l'Anneau** *(1 accroche qui répare 10 objets d'un coup)*
Le bandeau d'états sous l'anneau (`die-etats`) affiche déjà les mentions d'état (« Fixé — le hameau a décidé »). Y ajouter, quand un passif pèse sur CE jet, une mention du même registre : *« La dague connaît ce geste »* (combat), *« La lunette t'a montré d'où ça vient »* (tous jets). Une phrase, jamais un chiffre — exactement le `hint` que la spec des états exige (« sinon le joueur ne comprend pas que l'état agit »), appliqué aux objets. **Répare d'un coup les 6 passifs muets ET rend attribuables les 4 armes/babioles déjà branchées.** Effort : petit (le collecteur existe). Fréquence : chaque jet concerné — contrat de visibilité tenu dès le premier lancer.

**P2 — La Borne dépouillée se remarque au barrage** *(le vol d'offrandes devient un acte)*
Fouiller les offrandes est un acte que le village devrait voir — c'est SA borne. Au barrage du Serment (séquence **garantie** d'entrée au hameau, donc fréquence maximale), une ligne conditionnelle si les offrandes ont été prises : *« Le plus vieux regarde ta besace un peu longtemps. "On a trouvé la Borne nue, ce matin." »* (+1 Soupçon défendable, à ton arbitrage). Passe par le collecteur de rappels existant (budget d'un bloc par arrivée). Effort : petit. Valeur : transforme un soin muet en dilemme dès le premier écran du jeu.

**P3 — Le Miroir se montre à la Mare** *(visibilité à un écran de distance)*
Le Miroir s'obtient à la berge, et l'écran suivant du même lieu est *le reflet en retard d'une demi-seconde* — sans qu'aucun des deux ne cite l'autre. Une entrée `ECHOS_OBJET["mare-aux-regards-2"]` (la table existe, la Mèche y est déjà) : *« Dans ta poche, le miroir fêlé s'est mis à peser. Deux reflets, maintenant : celui de l'eau, en retard, et celui que tu portes, qui attend son tour. »* Effort : minimal (une entrée de table). C'est le seul branchement possible **dans les trois écrans qui suivent l'obtention** sans rien réordonner — il prouve le contrat de visibilité sur un cas réel.

**P4 — Le Geôlier voit sa Larme** *(la promesse du légendaire honorée)*
Une variante conditionnelle dans les pools de répliques critiques du Geôlier quand la Larme est portée : *« Tu portes quelque chose à moi. Garde-la. J'en ai d'autres — c'est bien le problème. »* Effort : petit (les pools par posture existent). Fréquence : les critiques — rare, mais la Larme est l'objet le plus rare du jeu : la rareté des deux s'accorde. ⚠️ **Ne tient pas le contrat de visibilité à lui seul** (voir §4) — à coupler avec P1, qui rend la Larme lisible à chaque jet.

**P5 — La Clé du Portillon tient parole ou se tait** *(réparer la promesse morte)*
Deux accroches à faible coût sur l'existant : un écho à la Descente (`ECHOS_OBJET["la-descente"]`, la table sert déjà la Pierre et la Mèche) — *« La clé du portillon pèse dans ta poche. La Descente n'a pas de serrure. Le retour, lui, en avait une — et tu l'as sur toi. »* — et une ligne chez le Veilleur s'il est rencontré après (*« Il voit la clé à ta ceinture. Il ne demande pas comment. Il note. »*). Alternative si tu préfères couper : réécrire le flavor pour ne plus promettre. **L'un ou l'autre, mais pas l'état actuel.**

### Le reste, par ordre décroissant

- **P6 — Le Brin de Chanvre chez le Pendu qui parle** : porter du chanvre béni « pour les pendus » devant un pendu qui parle mérite une ligne (*« le brin à ton poignet est du même tressage que sa corde »*). Collecteur de rappels, effort petit.
- **P7 — Le papier élargi au procès** : `apportsProces` reconnaît déjà « registre|carnet|ordonnance|sceau|dénonciation » dans la Besace — seul le Carnet matche réellement aujourd'hui. Étendre le motif à la Craie du Condamné (*c'est avec ça qu'on marque les portes* — l'Écrivain la reconnaîtrait) : une alternance dans une regex existante.
- **P8 — La Dague au troc du Colporteur** : une variante du choix de troc existant quand on ne porte que la dague de départ (*« Il regarde ta lame. "Ça, tout le monde en a une. Trouve-moi quelque chose qui a une histoire." »*) — le troc devient un commentaire sur la Besace. Effort petit, valeur moyenne (une couleur, pas une porte).
- **P9 — Les soins mineurs chez le Rebouteux du Marché** : la branche « blessure » du Marché pourrait remarquer qu'on porte déjà de quoi se soigner (*« Il regarde ta besace. "T'as ce qu'il faut. Tu veux juste qu'on te le fasse." »*). Effort petit, valeur faible — mais donne aux drops aléatoires leur seule existence sociale.

**Non proposé, volontairement** : brancher l'Amulette / la Lame / la Clef sans porte sur du contenu précis. Ce sont des récompenses de Destin *génériques* — leur donner chacune une accroche de lieu créerait trois mini-quêtes non écrites (du contenu neuf déguisé). P1 suffit à les rendre perceptibles ; le reste attendra un vrai chantier de contenu.

---

## 4. Contrat de visibilité — qui le tient

> *Un objet doit produire au moins une manifestation perceptible dans les trois écrans qui suivent son obtention, ou dans la première scène où son affordance se présente.*

**État actuel, sans complaisance :**
- **Le tiennent** : les actifs de soin (le 4ᵉ choix « Utiliser — X » apparaît dès que la santé baisse — c'est l'affordance qui se présente) ; la Corde coupée (l'affordance du Puits est son usage même) ; la Clochette et le Carnet (leur affordance joue à la première scène concernée). Les passifs le tiennent *mécaniquement* dès le premier jet (l'Anneau bouge) mais **pas perceptiblement** (rien n'attribue) — P1 est ce qui les fait basculer du bon côté.
- **Ne le tiennent pas** : Écharde, Lanterne du Veilleur (une variante en concurrence avec ~28 autres au tirage des ambiances — j'estime la probabilité de la voir dans une vie bien en dessous de 1 sur 2, non mesurée précisément, voir §5), Pierre de Retour et Mèche (échos sur des écrans de fin de traversée qu'une vie sur deux n'atteint pas). **Je les ai comptés « branchés » parce que l'accroche existe — mais au sens de ta règle, ce sont des objets à moitié morts.** Le dire, c'était la commande.
- **Le facteur aggravant est structurel** : la traversée TIRE ses lieux (9–11 sur 17). Aucune paire acquisition→usage n'est ordonnée par le jeu — la Lunette peut arriver après la Colline, le Grelot après le Puits. Seules la Colline (offerte à chaque Croisée) et la séquence du Hameau sont garanties. Tant que le directeur de routes n'existe pas (cf. audit spec-vs-build, Brief 2), un objet branché ne rencontre son aval que si le tirage le veut — **la moitié de la valeur des branchements se perd dans l'ordre des lieux.** C'est le même problème que les Besoins, et il a la même solution.

**Parmi mes propositions** : P1, P2, P3 tiennent le contrat (fréquence garantie ou quasi) ; P4 et P6-P9 ne le tiennent PAS seuls (lieux/événements rares) — ils valent comme épaisseur, pas comme réparation ; P5 dépend d'atteindre la Descente.

---

## 5. Ce que je n'ai pas pu déterminer

- **La probabilité réelle de voir une variante d'ambiance à objet** (Écharde, Lanterne) : la sélection est « éligibles → spécificité max → seedé », en concurrence avec les variantes de provenance/Soupçon/santé/chapitre. Mesurable en runs simulées (`tools/pactum.py`), pas fait dans cette passe — si tu veux le chiffre avant d'arbitrer, c'est une heure de banc.
- **Le coût exact d'obtention de 2-3 objets** (la Clochette au Troupeau notamment) : le commentaire de `besace.ts` la dit conditionnée à Affamé, état retiré le 11/08 — je n'ai pas vérifié écran par écran ce que le retrait a laissé comme gate réel. À croiser avec l'audit Brief 2.
- **Hors périmètre assumé** : les Reliques (elles ont leur propre système dons/dettes, déjà branché sur les jets et le procès) et les objets d'autres zones (il n'y en a pas).
- **Note d'outillage, sans toucher au code** : `studio_data.py` n'exporte pas `Scene.loot` — le Brin de Chanvre (seul loot d'arrivée du jeu) est invisible dans le Studio. À ajouter à la liste blanche lors de la prochaine passe d'outillage.
