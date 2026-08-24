# Audit spec-vs-build — moteur États, Besoins & Sceaux

**Date** : 24/08/2026 · **Build audité** : v1.93.4 · **Lecture seule, aucun code modifié.**
Spec de référence : page Notion « ⚡ États, Besoins & Sceaux — le Domaine se souvient » (version consolidée du 4/08).
Sources code : `lib/faits.ts`, `lib/state.ts`, `lib/player-memory.ts`, `lib/etats.ts`, `lib/sceaux.ts`, `lib/scene-data.ts`, `components/Scene.tsx`, `lib/registre-data.ts`.

---

## EN TÊTE — la réponse à la question booléen-vs-typé

**Le moteur n'est PAS booléen. Il est typé, à valeurs numériques, et il implémente presque mot pour mot le modèle de la spec.** `lib/faits.ts` (260 lignes, écrit le 5/08 *à partir de cette spec*) stocke `{ id, kind, scope, value, source, expires }` avec `value: number` obligatoire — « un fait présent vaut 1, et rien n'empêche 2, 3, 12 » est en commentaire dans le fichier. Les compteurs existent et servent (visites de lieux, compteur de la Fille, passages du Sceau). **L'essentiel du travail à venir est de l'extension et du contenu, pas une réécriture.**

**Mais l'écart le plus important de cet audit n'est pas technique, il est décisionnel.** La spec date du 4/08. Le **11/08**, la Phase A du plan d'élagage — validée par toi en session — a **démonté** ce qu'elle avait fait construire : les six états du vertical slice ont été implémentés, puis **cinq ont été retirés** (Fiévreux, Boiteux, Affamé, Marqué, Hanté — textes archivés dans `data/archive-etats.md`), et les **Besoins ont été retirés comme système** (il n'en reste que des horodatages sans lecteur). Le raisonnement acté dans le code : *« si on retire les états, PACTUM reste PACTUM ; si on retire le dé, la mort permanente ou la mémoire des incarnations, il ne l'est plus. »*

Une bonne part de la spec est donc dans un troisième statut que « présent / absent » ne couvre pas : **« fait, puis défait sur décision »**. Avant toute estimation des étapes 3 à 6, il faut re-trancher lequel des deux documents fait foi — la spec du 4/08 ou l'élagage du 11/08. Les estimations du §6 distinguent trois colonnes : **extension** · **réécriture** · **re-décision**.

---

## 1. Le moteur de faits — verdict : PRÉSENT (intégration partielle)

### La structure, champ par champ

| Spec | Build (`lib/faits.ts`) | Verdict |
| --- | --- | --- |
| `id` | `id: string` | présent |
| `kind` (6 valeurs) | `FaitKind` : `state · meter · knowledge · counter · seal · discovery` — les six, mêmes noms | présent |
| `scope` (4 valeurs) | `FaitScope` : `run · zone_run · zone_permanent · global_permanent` — les quatre | présent |
| `value` | `value: number`, jamais booléen | **présent — c'est un moteur typé** |
| `source` | `source?: string` (débogage/Studio, jamais joueur) | présent |
| `expires` | `expires?: number` (pas de progression), purgé par `purger()` | présent |

### Conditions et effets

| Attendu | Build | Verdict |
| --- | --- | --- |
| `has` · `not` · `value >=` · `value <=` · `visitCount >=` · `all` · `any` | `Condition` + `evalue()` : les sept, exactement (`{visite, gte}` pour visitCount) | présent |
| `set` · `clear` · `increment` · `decrement` · `replace` | `Effet` + `applique()` : les cinq, dont `replace` conçu pour les groupes d'exclusivité | présent |
| `scheduleEncounter` | Implémenté côté moteur (produit des `RencontreDue`)… **mais aucun consommateur** : `RunState.rencontresDues` est déclaré, persisté, et le commentaire du champ le dit lui-même — *« DÉCLARÉ, PERSISTÉ, JAMAIS LU »* (state.ts:402). La « menace laissée active » (Meute/Bête, 18/08) est un système parallèle spécifique, pas ce générique. | **partiel — moteur oui, branchement non** |

Les conditions **servent réellement** : 8 scènes-variantes `remplace: { scene, si }` évaluées par `evalue()` (dont une sur compteur : le Moulin s'ouvre à `c.fille >= 3`, et une sur le Soupçon : le Veilleur change à `soupcon >= 4`). Ce n'est pas un moteur décoratif.

### La persistance différenciée — vérifiée dans le code d'écriture, pas seulement les types

- **`run` / `zone_run`** → `RunState.faits`. `fresh()` repart de `faits: {}` ; la mort (`resetRun`) efface tout. **Un fait de run meurt bien avec le héros.** ✓
- **`zone_permanent` / `global_permanent`** → `PlayerMemory.faits`, rechargé en bloc par `sacDepuis()` dans `loadMemory` (pas de reconstruction champ par champ — c'est ce qui a permis au Sceau d'exister « sans champ nouveau »). **Survit à la mort.** ✓
- ⚠️ **`zone_permanent` et `global_permanent` sont indistincts à l'exécution** : même sac, même durée de vie, aucune opération « remise à zéro de zone » n'existe nulle part. Sans conséquence tant qu'il n'y a qu'une zone — mais le jour où l'Acte II arrive avec l'idée qu'un fait de zone puisse être local aux Landes, il faudra écrire cette séparation. À savoir maintenant, pas à découvrir alors.
- `expires` est purgé **au changement de lieu** (Scene.tsx:2618), pas à chaque écran — conforme à la leçon « un état de trois scènes doit durer trois lieux ».

### Le compteur de visites — présent, mais EN DOUBLE

C'est le défaut structurel n°1 du moteur tel qu'il est :
- `noterVisite()` / `visites()` (faits, `visite:<radical>`, scope `zone_permanent`) — écrit à chaque arrivée hors liaison (Scene.tsx:3208), lisible par la condition `{visite, gte}`.
- **ET** `PlayerMemory.visitesLieux` (Record séparé, player-memory.ts:245) — écrit par `noterVisiteLieu()`, lu par les strates de FAMILIARITÉ et la logique de séjour.

Deux compteurs de visites, deux chemins d'écriture, appelés depuis des endroits différents. Ils ne divergent probablement pas aujourd'hui (mêmes événements), mais rien ne le garantit, et le prochain contenu qui lira « le mauvais » comptera faux. **À converger avant d'empiler du contenu dessus** (voir estimation, étape 1).

### Ce qui vit encore HORS du moteur (les trois canaux legacy)

| Système | Où il vit réellement | Le moteur le voit-il ? |
| --- | --- | --- |
| **Soupçon** | `RunState.soupcon: number` (plafonné 0–6), avec `soupconSeen` | Par un **miroir dérivé en lecture seule** : `faitsDe()` injecte `soupcon` comme fait `counter` calculé à chaque lecture (Scene.tsx:601). Jamais persisté comme fait — il ne peut pas diverger, c'est propre. Mais il n'est pas un `meter` au sens de la spec, et **le kind `meter` n'a aujourd'hui aucun usage réel.** |
| **Savoirs** | `RunState.savoirs: string[]` (canal historique, antérieur au moteur) | Non. Le kind `knowledge` n'a qu'**un seul usage** dans tout le code (`vu:troupeau`, Scene.tsx:2111). |
| **Visites (familiarité)** | `PlayerMemory.visitesLieux` | Non (voir ci-dessus). |

Ce ne sont pas des bugs : le Soupçon et les Savoirs **fonctionnent** (le procès, `requiresSavoir`, les combats préparés en dépendent et sont testés). C'est une dette de **convergence** — trois systèmes que la spec dit « un seul » et qui sont trois stockages. La question à trancher : migrer (propre, mais risque de régression sur du code éprouvé), ou assumer les miroirs (coût zéro, mais le « un seul moteur, un seul schéma » de la spec reste faux à jamais).

---

## 2. Savoir / Découverte — verdict : PRÉSENT, avec un écart assumé à connaître

Les deux existent, séparément, avec les bonnes portées **vérifiées à l'exécution** :

- **Savoir** : `RunState.savoirs`, posé par `grantsSavoir` / `Scene.savoir`, lu par `requiresSavoir` / `masqueSi.savoir`. Meurt à la mort (fresh → `savoirs: []`). ✓
- **Découverte** : kind `discovery`, scope `global_permanent`, posée par `poserDecouverte()` (Scene.tsx:617 — idempotente, alimente le Codex et incrémente le compteur `c.fille` à la source pour les six découvertes de la Fille). **~23 découvertes distinctes posées par le contenu** (21 sur des choix + arrivées + `d.temoin_vu`). Traverse les vies. ✓
- Un héros neuf n'hérite d'aucun Savoir : vérifié, `fresh()` repart à vide, et la réplique `pactum.py` retire les choix à savoir requis d'un compte neuf (garde du 14/08).

⚠️ **L'écart assumé, à dire en face** : la spec écrit « les Découvertes conditionnent les Sceaux et l'arc du twist, **jamais** les connaissances du héros courant ». Or le build fait plus que ça : `requiresDecouverte` (15 usages) et `masqueSi.decouverte` **ouvrent des options où le héros PARLE de ce que seul le joueur sait** — « Invoquer le trois cent unième » au procès (gated `d.bailli_condamne`), l'option informée face à la Bête (`d.bete_couloir`), l'apaisement du Chien. C'est un choix de design délibéré du 12–14/08 (« explorer prépare », préparation inter-vies : *« ce qu'on est allé chercher, peut-être dans une autre vie »*), pas une confusion de portées — mais c'est bien la lettre de la spec qui a cédé. Si la règle du 4/08 doit reprendre, ces gates sont à requalifier (les passer sur des Savoirs ré-apprenables en run, par exemple). Si la préparation inter-vies reste — et elle a été validée en playtest — la spec est à amender. **Un des deux documents doit bouger.**

---

## 3. Les états — verdict : 1 sur 6 présent, 5 retirés sur décision (11/08)

| État (spec) | Définition | Mécanique | Manifestations | Remède | Verdict |
| --- | --- | --- | --- | --- | --- |
| **Fiévreux** | retirée | — | archivées (`data/archive-etats.md`) | — | **absent (retiré Phase A)** |
| **Boiteux** | retirée | — | archivées | — | **absent (retiré Phase A)** |
| **Affamé** | retirée | — | archivées | — | **absent (retiré Phase A)** |
| **Marqué** | retirée | son rôle « le Soupçon se voit » est partiellement repris par `SOUPCON_CRAIE` (les croix qui migrent) — sans état | — | **absent (retiré ; succession partielle)** |
| **Hanté** | retirée | ses « lignes intruses » ont existé (réécrites le 10/08) puis sont parties avec lui | — | **absent (retiré Phase A)** |
| **Fixé** | `lib/etats.ts` — complète | pose **différée** : Soupçon ≥ 4 + première arrivée là où on te regarde (Scene.tsx:2607) ; `ouvreConfidences` **lu** (gate `requiresEtat`, Scene.tsx:1047) | manifestation + 2 réactions servies par le pipeline (manifestation à l'écran suivant, réactions plus loin) ; carte à l'écran | ⚠️ **partiel** : la fiche dit « le procès ou la sortie de zone » — la sortie de zone efface (reset de run), mais **aucun `clear: "fixe"` n'existe sur la relaxe du procès**. Un héros relaxé reste Fixé jusqu'à la fin de sa vie. À vérifier si c'est voulu (« le hameau a décidé » peut le justifier) — le code ne le dit pas. | **présent** (au critère §8 : acquisition visible ✓ · modifie des choix ✓ · monde réagit 2× ✓ · remède partiel · démontrable en run simulée ✓) |
| *(hors spec)* **Accompagné** | complète — le Gamin des Murets | `expires` 2 lieux, `rouvreLaRoute` **lu** (Scene.tsx:2180), `fuitLeCombat` **lu** (clear au premier combat + phrase) | oui | oui (dit, jamais silencieux) | **présent** |

**Les groupes d'exclusivité** (`corps · mental · social · faveur`) : **implémentés correctement** dans `poserEtat()` — un état ne chasse que ceux de SON groupe, via l'effet `replace`/`clear` du moteur, « aucune suppression automatique des autres ». Mais avec deux états survivants dans deux groupes différents, **le mécanisme ne peut jamais jouer** aujourd'hui. Deux résidus inertes à connaître : `ETATS_NEGATIFS_DOSES = []` (le plafond de deux négatifs garde une liste vide — inoffensif, mais c'est du code qui semble faire quelque chose et ne fait rien) et `PLAFOND_AFFICHAGE = 3` (prêt, jamais sollicité à 2 états).

**Le pipeline de couverture existe et est le vrai acquis** : pose → manifestation en attente jouée à l'écran suivant (contrat de visibilité §5) → réactions gardées par le contexte (village/lande, jamais en combat) → guérison toujours dite. Réactiver un état retiré, c'est remplir une fiche `Etat` et poser ses déclencheurs — le tuyau est là.

---

## 4. Les Sceaux — verdict : 1 sur 4, et c'est le Passage

**`zone_franchie` est-il posé quelque part ?** Oui, sous deux formes équivalentes, posées ensemble par `recordTraversee()` (player-memory.ts:395, appelée par `cloturer_traversee` aux trois portes de la Descente — idempotence prouvée par `tools/protocole_sceau.py`) : `PlayerMemory.zonesCleared` (compteur) et le fait `sceau:landes` (kind `seal`, scope `zone_permanent`, `value` = nombre de passages). Il n'existe pas de flag *nommé* `zone_franchie`, mais tout ce que la spec lui demande de porter est porté.

| Sceau (spec) | Existe ? | Conditions branchées ? | Enregistré au franchissement ? | Manifestations ? |
| --- | --- | --- | --- | --- |
| **Passage** | **OUI** — c'est `sceau:landes` (`lib/sceaux.ts`), un par zone, la valeur compte les passages, plafonnement narratif au 3ᵉ (transformation) | condition = franchir, conforme | oui (trois portes, idempotent, prouvé) | **~12, gabarit 6-8 dépassé** : ligne de sortie (3 strates) · ouverture de la vie suivante · réponse de la Borne (le coin du sud) · 6 reconnaissances de lieux (`SCEAU_RECONNU`) · 3 remplacements après transformation (`SCEAU_TRANSFORME`) · ligne unique du Geôlier au 3ᵉ passage · **3 conversations ouvertes** (`requiresSceau` : Veilleur, Colporteur, Écrivain public). Les 12 pools sont sous le garde d'immersion. |
| **Fille** | non comme sceau | **ses conditions-découvertes existent en partie** : `DECOUVERTES_FILLE` (6 ids), compteur `c.fille`, et le seuil ≥ 3 ouvre déjà une **variante du Moulin** — un morceau de « son chapitre commence plus loin » vit donc déjà, sans sceau. `d.fille_identite` / `ecriteau_gratte` / `registre_contradiction` au sens strict de la spec : non posés sous ces noms (la contradiction du Registre vit dans `lib/contradictions.ts` + `faitsVus`). | non | non |
| **Gibet Muet** | non | `d.nom_gratte`, `d.bailli_condamne` existent ; `gibet_dimensionnel` / `corde_usee_milieu` / `bailli_phrase_descendre` : non | non | non (une corde « reste tranchée » : rien) |
| **Renonçants** | non | `soupcon_sortie` mesurable (le Soupçon est lu à la sortie ? **non — rien ne lit le Soupçon au franchissement**) ; `violence_commise` : aucun flag de ce genre n'existe | non | non |

**Deux règles de la spec que même le Sceau existant ne tient pas** :
1. **« Chaque Sceau ouvre une porte ET en durcit une autre. Obligatoire. »** — le Sceau des Landes n'a **aucun durcissement**. La « Palissade gardée autrement » n'existe pas. C'est l'écart le plus net entre la spec et le sceau livré. (Nuance de contexte : le 14/08 tu as toi-même re-refusé le « chemin » du Sceau pour éviter l'avantage roguelite — mais le durcissement, lui, n'a jamais été arbitré. Il reste dû, ou à rayer explicitement.)
2. **La Borne comme mémoire visuelle en calques** — voir §5.

**Registre Tombé / Franchi** : **PRÉSENT** (contrairement à ce que le brief supposait). `fallen[].destin` distingue les sorts ; l'onglet TES MORTS est un cimetière filtré (`mesMorts`, registre-data.ts:218 — le survivant n'y apparaît plus, défaut du 14/08 corrigé) ; le franchissement est marqué dans LES 100. « Renoncé » existe aussi (`recordRenoncement`), décision que la spec listait « en attente ».

---

## 5. Ce qui n'existe pas — dit explicitement

- **L'instrumentation Pactum Studio (étape 2)** : **ABSENTE au sens de la spec.** `studio-data.json` exporte les *déclarations* (faits, 2 états, transitions, familiarité — sections vérifiées dans l'export), et la réplique `tools/pactum.py` + `compte.json` savent jouer des runs simulées multi-vies — mais **aucun outil ne compte quels flags se déclenchent ni quelles variantes jouent, ni combien de fois**. Le §8 (« Pactum Studio produit un rapport des variantes réellement rencontrées ») est à zéro. Les briques (réplique fidèle, gardes, auto-joueur) réduisent l'effort restant à un chantier de comptage, pas de simulation.
- **Le directeur de routes (étape 4)** : **ABSENT.** Deux traces seulement : `RunState.croiseesDepuisRoute` (incrémenté à chaque liaison, **jamais lu** — un échafaudage) et `rouvreLaRoute` d'Accompagné (le cas ponctuel inverse : rouvrir une Croisée fermée). Rien ne biaise les destinations offertes vers un remède. Nuance importante pour l'estimation : `pickLiaisonOptions` sait déjà **garantir** des destinations (chapitre, Colline, porte du Hameau) — le mécanisme d'injection existe, c'est la *politique* (quel besoin → quel lieu) qui n'existe pas. Et elle n'a rien à servir tant que les Besoins n'existent pas.
- **Les Besoins (§3)** : **ABSENTS comme système** — retirés en Phase A. Il reste `RunState.horloge` (le temps du corps, avance aux 3 lieux et aux nuits) et `RunState.besoins` (horodatages dormir/…, écrits en deux endroits, **aucun lecteur**). Le commentaire du code est explicite : *« les BESOINS n'existent plus comme système […] Aucun effet mécanique. »* La table des affordances de la spec (Rebouteux, Marché, fruits, Mare, Puits) existe, elle, en contenu — les lieux sont écrits, rien ne les rend *nécessaires*.
- **Les calques de la Borne (§4)** : **ABSENTS.** La Borne a bien une mémoire *textuelle* calculée (la marque du sud au nom du prédécesseur, une entaille par vie, le coin du Sceau) — mais pas d'image en calques PNG, pas d'entrée de menu, pas de signalement de nouveau calque à l'arrivée.
- **Le kind `meter`** : aucun fait `meter` réel n'existe (le Soupçon vit hors moteur, miroir en lecture).
- **`scheduleEncounter`** : moteur présent, consommateur absent (§1). Les scènes de « recouvrement de dette » de la spec n'existent pas ; la seule rencontre différée du jeu (la menace Meute/Bête) passe par `RunState.menace`, un canal dédié.
- **Deuxième et troisième lots d'états** (Serein, Reconnu, Appelé, Endetté, Souillé, Cru) : rien, comme prévu par l'ordre d'implémentation.

---

## 6. Estimations — seulement maintenant

Grille : **extension** = le socle tient, on ajoute · **réécriture** = le socle ne supporte pas · **re-décision** = l'arbitrage du 11/08 (élagage) doit être rouvert par toi avant d'écrire une ligne. Tailles en T-shirt (S ≈ une session, M ≈ 2-3 sessions, L ≈ une semaine de sessions), contenu compris.

| Étape (§7) | Statut réel | Nature | Taille | Détail |
| --- | --- | --- | --- | --- |
| **1. Moteur commun typé + visites** | fait à ~85 % | extension | **S–M** | Restent : converger les DEUX compteurs de visites (S, à faire en premier — c'est le seul vrai piège du socle) ; brancher un consommateur de `scheduleEncounter` (S) ; puis décider du sort des trois canaux legacy — assumer les miroirs (0) ou migrer Soupçon/Savoirs dans le moteur (M, risque de régression sur du code éprouvé : procès, combats préparés, gardes — je recommande d'assumer les miroirs et de l'écrire dans la spec). **Aucune réécriture nulle part.** |
| **2. Instrumentation Studio** | absent | extension (outillage) | **M** | Compteurs de pools servis dans la réplique `pactum.py` (elle joue déjà les injections) + rapport agrégé sur N runs + affichage Studio. Les briques dures (réplique fidèle, auto-joueur, compte multi-vies) existent. |
| **3. Vertical slice de 6 états** | 1/6 présent, 5 retirés le 11/08 | **re-décision, puis extension** | **L** (si rouvert) | Techniquement le moteur porte tout (state + expires + replace + groupes). Le coût est le CONTENU (manifestations, réactions gardées par le contexte, remèdes — partiellement archivé dans `data/archive-etats.md`) et les gardes d'immersion. ⚠️ Mais re-implémenter Fiévreux/Boiteux/Affamé/Marqué/Hanté contredit frontalement l'élagage que tu as validé : **ne pas l'estimer comme un chantier, l'estimer comme un arbitrage.** Micro-lot indépendant possible sans rouvrir le débat : trancher le remède de FIXÉ au procès gagné (S). |
| **4. Directeur de routes** | absent | extension | **M** | Le mécanisme de garantie de destination existe (`pickLiaisonOptions`) ; il manque la politique besoin→lieu et la règle des deux Croisées. **Bloqué par 3** : sans état actif, il n'a rien à diriger. En attendant, il pourrait servir les OBJETS (garantir l'aval d'un objet porté — voir l'audit Brief 1, §4 : c'est le même trou). |
| **5. Contenu conditionnel des 6 états** | absent | contenu | **L** | Dépend de 3. Les volumes de la spec (20-30 beats, 20-25 réactions) sont réalistes vu le rythme des sessions passées. |
| **6. Serein, Reconnu, Appelé** | absent | re-décision, puis contenu | **M–L** | Même statut que 3. « Appelé » est le plus identitaire et le plus cher (progression en trois stades). |
| **7. Deux Sceaux : Passage et Fille** | Passage fait ; Fille non | extension | **S** (Passage) + **M** (Fille) | Passage : il manque LE DURCISSEMENT (une manifestation « la Palissade gardée autrement » — S, ou rayer la règle explicitement). Fille : l'enregistrement conditionnel au franchissement est trivial (les découvertes existent, `recordTraversee` est le point unique) ; le coût est les 6-8 manifestations (contenu) + le durcissement (une rencontre hostile dans le pool — le pool sait déjà accueillir des scènes conditionnelles). |
| **8. Borne calques + Registre T/F** | Registre FAIT · Borne absente | extension | **M** | Registre : rien à faire (Tombé/Franchi/Renoncé livrés les 14-15/08). Borne : chantier surtout d'ASSETS (calques PNG à produire par ton pipeline) + un écran de menu + les flags (le moteur de faits les porte tels quels) + la phrase de signalement à l'arrivée (le collecteur de rappels existe). |
| **9. Playtests et mesure** | outillage partiel | extension | **S** | Dépend de 2 pour « la différence perçue » mesurée ; les panels et le paquet IA couvrent le reste. |
| **10. Endetté, Souillé, Cru + 2 sceaux** | absent | après tout le reste | — | Ne pas estimer avant que 3 soit re-tranché. |

**Lecture d'ensemble** : le socle (étapes 0-1-2) est en extension pure, sans surprise. **Le vrai point dur du plan n'est pas dans le code : c'est que les étapes 3-4-5-6 — la moitié du plan — reposent sur des systèmes que l'élagage du 11/08 a délibérément retirés.** Les deux documents ne peuvent pas être vrais en même temps. Ma recommandation, si tu la veux : ne pas re-trancher en bloc, mais état par état — le pipeline de couverture est prêt, et re-livrer UN état complet (au sens de tes critères §8) coûterait une session et te dirait par la sensation, pas par la spec, si les états manquent réellement au jeu depuis leur retrait.

## Ce que je n'ai pas pu déterminer

- **Le remède de FIXÉ** : voulu ou trou ? (relaxe au procès → le fait `fixe` reste posé ; aucun `clear` — le code ne documente ni l'un ni l'autre).
- **La divergence potentielle des deux compteurs de visites** : non mesurée (il faudrait comparer sur runs simulées ; les chemins d'écriture diffèrent mais les événements semblent les mêmes).
- **La distinction `zone_permanent` / `global_permanent`** ne pourra être jugée que quand une décision existera sur ce qu'une « remise à zéro de zone » voudrait dire (rien dans la spec actuelle ne l'exige — mais alors pourquoi deux scopes ?).
