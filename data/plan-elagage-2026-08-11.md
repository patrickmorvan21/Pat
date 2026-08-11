# PACTUM — Plan d'élagage (11 août 2026)

**Décision actée : pas de reset. Élagage chirurgical du PACTUM actuel, en place.**
État du jeu au moment de ce plan : v1.71.0. Sources de vérité croisées : le code
réellement déployé, le journal de développement, et les mesures du panel de dix
testeurs en aveugle du 10/08 (vérifiées ligne à ligne par trois relecteurs).

Ce document est le tableau demandé — les sections du mémo « reset » une par
une, contre l'état réel — suivi du plan par phases. **Rien ne se code avant
validation de ce plan.**

---

## Les règles directrices (doctrine)

1. « J'ai fait quelque chose. Le monde l'a retenu. Quelque chose a changé.
   Et parfois je ne comprends la conséquence que beaucoup plus tard. »
2. « Une mécanique ne doit jamais contredire la conséquence racontée par le
   texte. » — déjà un garde de build (audit d'immersion, natures de jet).
3. **Nouvelle, ajoutée ce jour** : « À chaque instant, le joueur doit
   comprendre ce qu'il VEUT FAIRE, sans nécessairement comprendre tout ce que
   cela provoquera. » — simplicité immédiate, profondeur à long terme.

---

## Le tableau — les sections du mémo × l'état réel du code

Verdicts : **FAIT** (rien à coder) · **CHANTIER** (à faire) · **PARTIEL**
(une part existe) · **CONTREDIT** (la mesure dit l'inverse) · **NON RETENU**.

| § | Section du mémo | Verdict | État réel |
|---|---|---|---|
| 1 | Diagnostic général | PARTIEL / périmé | Les trois symptômes cités (morts après conséquences non mortelles, jours artificiels, effets sans rapport avec le texte) sont corrigés (v1.50 → v1.69, gardes de build à l'appui). « Plus on lance, plus on meurt » est **CONTREDIT** par la mesure : 21 jets sur 85 touchent la santé, trois testeurs ont joué 3-4 vies d'imprudence pure sans mourir. Reste VRAI : l'accumulation de sous-systèmes, et les lieux qui se vident comme des checklists. |
| 2 | Boucle cible (lieu → 2-3 phrases → décision → dé éventuel → conséquence) | FAIT structurellement | Micro-beats ≤ 90 mots/écran (v1.33), séjour et sorties explicites (v1.59). L'écart restant est le NOMBRE de décisions par lieu → chantier B. |
| 3 | Textes 25-60 mots + Codex | CHANTIER | Médiane actuelle 55-58 mots, max 113 : resserrage réel mais pas division par deux. **Grille de production actée : 25-60 courant · 60-90 moment important · >90 exception mise en scène.** Le garde `densite.py` sera recalé sur cette grille. Le lore coupé N'EST PAS SUPPRIMÉ : archivé pour le Codex → chantier E. |
| 4 | États génériques → Intact/Blessé/Mort + flags ciblés | **CHANTIER — le principal** | Méthode actée : audit des dépendances d'abord, puis état par état — *identifier sa fonction utile → la remplacer par Blessé ou un flag ciblé → supprimer l'état*. Jamais en une seule passe. HANTÉ ne devient pas un état simplifié : il devient des flags précis (`a_vu_le_pendu_bouger`) lus par deux ou trois scènes nommées. Inventaire de démontage en Phase A ci-dessous. |
| 5 | Temps et santé ne sont plus des taxes | FAIT | v1.58.0 : le coût suit la NATURE du jet (social → Soupçon, exploration → rien d'automatique, surnaturel → marque, physique seul → santé). 10/08 : aucun Jour n'est jamais une sanction (le Jour se GAGNE en s'engageant). |
| 6 | Passer / Explorer / Prendre un risque | PARTIEL | Le dé n'apparaît déjà que sur les choix risqués ; passifs et orientations sont gratuits. La grille devient un AUDIT des 230 choix existants : chaque écran doit offrir un « passer » gratuit et lisible. Le constat de départ (« le joueur rationnel évite le gameplay ») est CONTREDIT par la mesure. |
| 7 | Réussite / Complication / Catastrophe | FAIT dans l'esprit | Les coûts suivent déjà trois classes par nature ; l'AFFICHAGE garde ses cinq paliers (Éclatante / De justesse… : lu et aimé par les dix testeurs). On ne réduit pas la granularité du verdict. |
| 8 | Explorer prépare les grands dangers | **CHANTIER — le levier principal** | Le germe existe : un point d'intérêt examiné ouvre l'Anneau d'un cran (max 2), les Savoirs ouvrent des options, « produire un papier » abaisse le seuil du procès. À généraliser en économie principale, avec le PROCÈS pour vitrine → chantier C. |
| 9 | Ne jamais punir celui qui passe | FAIT | Règle actée le 10/08. Aucune jauge cachée de menace n'existe. |
| 10 | Récompenses concrètes, pas de buffs | FAIT quasi | Objets réels ancrés aux lieux, savoirs, découvertes, relations. Un reliquat à reprendre : la « faveur » de relique légendaire (+1 à tous les jets) est le dernier buff abstrait du jeu. |
| 11 | Mémoire et conséquences différées par flags | FAIT | L'architecture demandée (un choix pose un flag ciblé ; une scène future le lit) est exactement celle du code. Chaque exemple du mémo a déjà un équivalent en jeu (trace de la mort précédente à la Borne, corbeaux ignorés → dette, nom donné → réutilisé). |
| 12 | Relations simples + géographie à voisinages | PARTIEL | Relations par flags ✓ (11 PNJ à mémoire inter-vies, aucune jauge d'affection). Voisinages plausibles = petit chantier réel sur le tirage de traversée — les boucles est/ouest existent déjà en germe (la Fille à l'ouest, le Témoin à l'est). |
| 13 | Les stats changent la perception | FAIT | `lib/perception.ts` : 20 lieux, une ligne conditionnelle par stat dominante — la forme exacte que le mémo recommande. |
| 14 | Rythme : 15-20 min, 8-10 lieux, 5-8 jets | FAIT mesuré | Traversée cible 7-8 lieux, 6-8 jets par vie mesurés. La durée en minutes reste à confirmer sur playtest humain. « 2-3 décisions par lieu » → chantier B. |
| 15 | Incarnation différente en 90 secondes | FAIT | Priorité n°4 du panel, livrée : trace de la mort précédente, accueils conditionnels, la Borne qui grave le nom, portrait du Seuil, familiarité des lieux. |
| 16 | Vertical slice minimale à part | NON RETENU | Élagage EN PLACE : les cibles chiffrées du § décrivent à peu près le jeu actuel. Sa recommandation de fond est RETENUE comme règle de GEL : **aucun système nouveau tant que l'élagage n'est pas prouvé au playtest**. |
| 17 | Architecture de règles cible | PARTIEL | L'écart avec la cible = les états (chantier A) et la question Intact/Blessé/Mort : la LECTURE joueur est déjà discrète (érosion à paliers), la santé interne est continue. Discrétiser ou garder le continu sous une lecture discrète se tranche PENDANT le chantier A, sur pièces. |
| 18 | Ordre d'implémentation | remplacé | Ses étapes 2-3-4 sont déjà faites ; le reste est réordonné dans le plan par phases ci-dessous. |
| 19 | Tests d'acceptation | CHANTIER → garde de build | Deviennent le 8e garde automatique (`prebuild`). État actuel : tests 1, 2, 3, 4, 7, 9 verts · 5-6-8 partiels · 10 dépend du Codex. Un contenu futur qui violerait « un échec social ne peut pas tuer » cassera le build. |
| 20 | Les deux règles | FAIT + ajout | Contresignées ; la 3e règle (comprendre ce qu'on veut faire) entre dans la doctrine ce jour. |

---

## Ce qui S'AJOUTE au mémo — les deux chantiers d'équilibrage mesurés

Le mémo est muet sur le vrai tueur mesuré par le panel : **le canal qui
prévient (la santé, racontée par toute l'interface) n'est pas celui qui tue
(le Soupçon, jamais nommé)**. Deux chantiers en découlent, compatibles avec
tout le reste :

**Le Soupçon se lit dans le monde, en escalade** (chantier C). Jamais un
chiffre. Les canaux existent (craie qui migre, corbeaux du hameau,
manifestations, Geôlier) ; il manque l'ESCALADE lisible et l'avertissement
franc au dernier palier — du type : conversations qui s'interrompent → le
marchand ne demande plus ton nom → six corbeaux sur la même toiture → **une
chaise vide t'attend déjà au Tribunal**. Le joueur doit penser « j'ai attiré
quelque chose », jamais « pourquoi le jeu me met en procès ? ».

**Le risque physique remonte, hors des seuls combats** (chantier D).
30 lieux sur 40 n'ont aucun jet physique ; une fois les quatre combats
consommés, la santé est mathématiquement gelée. Sans toucher au barème :
ajouter des jets physiques là où les textes décrivent déjà des gestes
dangereux — traversées, chutes, le Puits, les cordes de la Chapelle, les
volées de la Tour, les mauvaises décisions nocturnes. Cible : que « si je
fais ça, je peux mourir » redevienne une pensée régulière, pas permanente.

Répartition finale des coûts (inchangée, elle est déjà en prod) :
social → Soupçon · exploration → connaissance/complication · physique →
blessure/mort · surnaturel → flags et conséquences différées.

---

## Le plan par phases

Chaque phase est déployée, jouée et validée SEULE avant la suivante.
Pendant tout l'élagage : **gel des systèmes neufs** (règle du §16), et rien
n'est supprimé de la production — ce qui sort de la boucle est archivé
(destination Codex).

**Phase 0 — le filet.** Le 8e garde de build (tests d'acceptation §19) +
les correctifs déjà vérifiés du panel (les 3 bugs de moteur — l'ordre
d'écriture de `hameau.entree`, les paliers de Soupçon qui sautent, la
traversée indexée par id —, les 9 sorties de scène neutralisées, les 9 dons
d'objets, les fautes). Aucun risque, tout est déjà validé.

**Phase A — le démontage des états.** L'audit de dépendances d'abord, puis
état par état. Inventaire de départ :

| État | Sa fonction utile | Remplacement pressenti |
|---|---|---|
| ENTAILLÉ (canal historique) | LA blessure — érosion, camp, soins | devient **Blessé**, l'unique état physique |
| FIÉVREUX | échéance du besoin « soigner » | à trancher AVEC le sort des Besoins (qui s'appuient sur les états) |
| BOITEUX | fermait la fuite | plus aucune source automatique depuis le 11/08 — candidat à la suppression sèche |
| AFFAMÉ | ouvrait le vol | flag `a_faim` posé par le besoin, lu par les 2 scènes de vol |
| MARQUÉ | doublait le Soupçon | flag `marque_de_vol` lu par le compteur de Soupçon |
| FIXÉ | mécanique du procès et du village | flag `fixe_par_le_village` — garde sa carte à l'écran (elle fonctionne) |
| HANTÉ | lignes intruses génériques | des flags PRÉCIS par source (`a_vu_le_pendu_bouger`…) lus par 2-3 scènes nommées — plus PACTUM que l'état |
| ACCOMPAGNE (le Gamin) | compagnon temporaire | ce n'est pas un état générique : flag `compagnon_gamin` à expiration simple |
| AGUERRI / ÉBRANLÉ | modificateurs 2-3 scènes | à trancher à l'audit : garder comme simples modificateurs, ou couper |

**Phase B — 2-3 décisions fortes par lieu + resserrage des textes.**
La priorité éditoriale n°1. Un lieu = une observation initiale forte
(25-45 mots) + 2-3 décisions qui comptent ; les micro-points d'intérêt
excédentaires fusionnent, partent en information secondaire, ou alimentent
le futur Codex. Resserrage à la grille 25-60 / 60-90 / >90 exception, garde
`densite.py` recalé. Tout texte coupé est archivé, jamais supprimé.

> **⚠️ CORRECTION DE MESURE (11/08, seconde passe) — la cible est ATTEINTE,
> et l'alarme venait de mon estimateur.** J'avais annoncé « médiane 8 écrans
> par lieu, 10 sur 17 au-dessus de 6 ». Ce chiffre comptait **2 écrans par
> point d'intérêt** — c'est faux : l'approche et l'examen sont poussés dans
> le MÊME lot, donc repaginés au budget de 90 mots, et un point court tient
> sur **un seul** écran. Il additionnait aussi des branches EXCLUSIVES (les
> sept accueils du hameau alternent, on n'en joue qu'un).
> Mesure corrigée, en suivant la chaîne réelle depuis chaque destination :
> **médiane 5 écrans par visite, 4 destinations sur 17 au-dessus de 6** —
> `serment-hameau` (15, mais c'est la halte scriptée du hameau, pas un lieu
> qu'on parcourt) et la Colline, la Chapelle et le Champ à 7, soit un écran
> de trop. Aucune coupe structurelle n'est due.
> La mesure vit désormais DANS `tools/densite.py` (`ecrans_par_visite`), avec
> les deux erreurs écrites au-dessus : une mesure qu'on refait de tête se
> refait fausse.

**Phase C — le Soupçon lisible + le procès par la préparation.**
L'escalade en monde (ci-dessus) + le procès devient la VITRINE de
« explorer prépare » : ce qu'on a découvert avant devient des options
NOMMÉES au procès — *Faire témoigner le Rebouteux* · *Rappeler la propre
sentence du Bailli* · *Montrer la marque sous la corde* — jamais un
pourcentage. Le fonceur peut survivre, difficilement ; l'explorateur arrive
armé de solutions, pas de points.

**Phase D — le risque physique hors combat** (ci-dessus). Le levier est le
NOMBRE de jets physiques, jamais le barème.

**Phase E — le Codex.** Spécification avec Patrick d'abord (débloqué par
les découvertes de la run — le moteur `discovery` à portée permanente existe
déjà). Puis le lore archivé en phases A-B y entre : témoignages, histoires
anciennes, créatures, fragments du Bailli, traditions des Renonçants,
interprétations contradictoires. Le joueur pressé garde une histoire nette ;
le passionné gagne une archéologie du Domaine.
