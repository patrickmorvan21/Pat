# PACTUM — DIAGNOSTIC de compréhension (panel de cinq, première run v1.129.0)

Sources : les cinq rapports (`rapports/L1-L5.md`), les deux transcripts de première run, les journaux des tables 1-4, et les sources du build. Chaque constat ci-dessous a été vérifié dans le jeu avant d'être retenu ; le détail des vérifications est dans `DEBAT.md`. Notation : « transcript, écran N » (curieuse = L1 L3 L5 ; pressée = L2 L4) ; « vie LN, écran N » (journal de sa table).

⚠️ Préalable, pour lire les notes : les deux transcripts de « première run » commencent à l'écran de jeu. L'intro (« Tu es mort. Il y a peu. » / « Tu traverses mon Domaine. Une fois. Au bout, une Porte scellée… Si tu meurs, un autre viendra. Avec un autre nom. », `components/Intro.tsx` l. 85-97), le Seuil (où le joueur tape le nom de son héros et lit « Le dé fera le reste », `lib/prologue-data.ts` l. 132) et le carton « Les Lisières » sont joués avant par tout compte vierge (`Home.tsx` l. 110-119) et absents du paquet. Une partie de ce que le panel « ne comprend pas » lui a été caché par le paquet, pas par le jeu. Le diagnostic le distingue à chaque fois.

---

## 1. EN CINQ LIGNES

Un premier joueur comprend, sans effort et dès l'écran 10, **où** il est (une lande sans soir, une pierre au nord, un village au milieu, un trou de cordes au sud), **ce qu'on lui fait** (on le compte, on le juge, on le pend) et **qui juge** (un pendu-bailli qui a signé trois cents noms, un village qui a renoncé) — l'histoire du lieu passe.

Il ne comprend pas **qui il est ni pourquoi il descend** (5/5 « aucune idée » à l'écran 1, 0/5 « sûr » à la fin) — parce que le seul écran qui le dit est avant le premier écran et n'est jamais redit ; ni **qui parle** dans les bandeaux (jamais nommé en run) ; ni **ce que fait le Jour** (deux sur cinq l'ont compris à l'envers, le survivant curieux finit 11e sur 11) ; ni **pourquoi une route se ferme** (5/5) ; ni ce que **Renonçant**, **Fixation** et « **à la troisième aube, tu choisis** » engagent.

Le dé, lui, est compris par 5/5 **en jouant** et par 0/5 **en lisant** : la run curieuse ne le lance qu'à l'écran 78.

---

## 2. AXE PAR AXE

### OÙ — 7,8 / 10 (L1 8 · L2 8 · L3 8 · L4 7 · L5 8)

**Courbe** : écran 1 « je crois » (5/5) → écran 10 « sûr » (4/5) → jamais brouillé jusqu'à la fin. Deux « je crois » au dernier écran sur un seul mot, « l'étage du dessous » (transcript pressée, écran 156), qui n'apparaît nulle part avant.
**Constat** : le lieu passe par le texte seul ; « Renonçants » est le seul nom de lieu dont 5/5 ne savent pas le sens à l'entrée du village.
**Citation** : « le nom oui, le sens non » (L4, grille village).
**Vérification** : le jeu ne définit jamais « Renonçant » ; deux indices (« Renoncer à la parole est le renoncement le moins cher », `scene-data.ts` l. 4754 ; « arrêter, c'est commencer à regarder le sud », vie L1 écran 17 — Verger, hors route de première run) ; pas d'entrée Codex. Réserve d'image vérifiée (L3) : `scene_borne_frontiere_v2_a.png` ne montre pas « l'homme immobile à trois pas », premier élément jouable nommé (bouton « Marcher vers l'homme immobile », écran 3).

### QUI — 3,8 / 10 (L1 4 · L2 3 · L3 5 · L4 3 · L5 4)

**Courbe** : écran 1 « aucune idée » (5/5) → écran 10 « quelqu'un qui descend » (je crois, 4/5) → écran 25 « traverser entier » (je crois, 5/5, tous depuis le Marcheur, transcript curieuse écran 17) → village « un étranger compté » → écran 70 le héros est défini **par ses actes** (« a juré / a refusé », sûr 5/5) → fin : un nom lu dans un tableau, « pourquoi je descendais, toujours pas » (L1). Après la vie jouée, 3/5 découvrent « un mort » — par deux scènes hors de la première run.
**Constat** : la première run ne dit jamais ce qu'est le héros ni ce qu'il veut ; ce qu'il est se déduit de ce qu'on lui fait.
**Citation** : « Tu arrives ici comme tout le monde y arrive — les mains vides et mort. » (vie L1, écran 17) — « Le transcript ne me l'avait jamais dit. » (L1)
**Vérification** : dit à l'intro (« Tu es mort. Il y a peu. », `Intro.tsx` l. 85), hors transcript ; **jamais redit en run** — la première occurrence in-run qui s'en approche est « Vous avez tous le même pas » (transcript curieuse, écran 47). Le nom : tapé par le joueur au Seuil (`Prologue.tsx` l. 367, 514) ; « Cendre » découvert dans un tableau (L2 E10, L4 E4) est un artefact des transcripts automatiques.

### QUOI — 5,6 / 10 (L1 5 · L2 5 · L3 6 · L4 6 · L5 6)

**Courbe** : écran 1 « un pendu a répondu » (je crois 5/5) → 10 « une bête me chasse » → 25 « traverser entier » et « on me compte » → village « on va me juger » (je crois 5/5) → 70 « un procès » (sûr chez les deux pressés) → fin « traversé, la suite en dessous » (je crois 4/5). Jamais « sûr » sur l'histoire ; s'éclaire au procès, se brouille à la Falaise (ce qu'il y a en bas, ce que vaut descendre).
**Constat** : l'enjeu immédiat (traverser, être jugé) passe ; le POURQUOI du village est deviné cinq fois différemment ; deux lecteurs de la même première run n'ont pas la même clé, parce que « on pend pour remplacer » n'est tombé que dans une des deux runs.
**Citation** : « te juge et te pend — pas pour punir, “pour remplacer” quelqu'un, je n'ai pas compris qui » (L2, C).
**Vérification** : « Ici, on ne pend pas pour punir. On pend pour remplacer. » = manifestation de la loi (`lib/loi-substitution.ts` l. 47-51), servie **une fois par vie, en liaison seulement** (`Scene.tsx` l. 3661-3672) — présente dans le transcript pressée (écran 126), absente du curieuse. Le trois cent unième : mystère voulu (`scene-data.ts` l. 5091 : « ce que le joueur DÉCOUVRE, jamais ce que le hameau annonce »), servi par un chapitre (`chapters-data.ts` l. 116) non tiré dans les deux transcripts.

### EUX — 5,8 / 10 (L1 6 · L2 6 · L3 7 · L4 5 · L5 5)

**Courbe** : écran 1 « un homme immobile » → 10 « qui est “il” ? » (aucune idée 3/5) → 25 « le Marcheur, un allié » (je crois 4/5) → village « méticuleux, ils me comptent » (5/5), « le Bailli = juge » (5/5 après l'écran 32) → 70 « quelqu'un d'autre plus haut » (je crois 3/5) → fin « un geôlier / un gardien » (je crois 5/5, déduit de « Moi, si »). Le village s'éclaire à l'entrée ; la voix ne s'éclaire jamais dans le transcript, et « s'éclaire » dans la réplique par une étiquette qui n'existe pas dans le jeu.
**Constat** : les gens sont lisibles, la voix ne l'est pas ; le Bailli est nommé après coup, dans une issue.
**Citation** : « la voix seulement quand elle est étiquetée » (L2, G).
**Vérification** : dans le jeu la voix est un bandeau orange avec portrait (`Scene.tsx` l. 6008-6040) — visuellement distinct, mais **le mot « Geôlier » n'est affiché nulle part en run** (seule chaîne rendue : aide Options, `GameMenu.tsx` l. 644) ; l'étiquette « ◉ LE GEÔLIER » vient de `pactum.py` l. 1412. Les transcripts ont perdu le bandeau (0 étiquette sur 4 fichiers). « Bailli » n'apparaît que dans les issues du pendu (`scene-data.ts` l. 2052-2099), jamais dans la narration qui l'introduit (écran 27 : « Chaîne de fonction au cou, un sceau au poing »).

### RÈGLES — 4,8 / 10 (L1 5 · L2 5 · L3 4 · L4 4 · L5 6)

**Courbe** : écran 1 « JOUR = un compteur » (aucune idée 5/5) → 10 « le tag lance un dé » (je crois 4/5 ; les curieux n'ont vu aucun dé) → 25 curieux : « aucun dé en 25 écrans » (sûr) ; pressés : « ÉCHEC = blessure », « JOUR 2 après un ÉCHEC → rater coûte un jour ? » → village « Ces jours-là ne s'écrivent pas » lue par 5/5, comprise par 3 → 70 curieux : « aucun dé en 70 écrans » → fin : « le Registre classe par jours » (je crois 5/5), « mort : jamais vue » (aucune idée 5/5). Après la vie : l'Anneau compris « tout de suite » (5/5) ; le Jour compris par L5 seul (via `etat`).
**Constat** : le dé se comprend en jouant, jamais en lisant ; le Jour n'est compris par personne et compris à l'envers par deux ; la route fermée perd 5/5 ; la mort n'a été vue par aucun transcript.
**Citation** : « Jour à 3 sur un FUNESTE (écran 59) : échec grave = un jour perdu (je crois) » (L2, grille 70) — et « Cendre · J1 · a franchi la Descente en dernière position. Le gagnant classé dernier : j'ai cru à une erreur. » (L5, E7).
**Vérification** : faux et vrai à la fois. Le Jour n'avance **jamais sur un échec** (`Scene.tsx` l. 5280-5285) ; il avance **un tous les trois lieux quittés après y avoir lancé un dé** (l. 2895-2906) et à chaque nuit (l. 4900). Les deux coïncidences du transcript pressée (écrans 21 et 59) ont fabriqué une règle fausse chez ses deux lecteurs ; la run curieuse, sans jet avant l'écran 78, reste J1 pendant 104 écrans et finit 11e/11 (transcript curieuse, écran 100) — le Registre classe par jours (`registre-data.ts` l. 174). La seule ligne qui dit la règle : « Tu regardes tout, tu ne risques rien. Ces jours-là ne s'écrivent pas. » (`scene-data.ts` l. 9270), servie **une fois par vie, au deuxième lieu quitté sans jet** (`Scene.tsx` l. 2923-2929). Route fermée : trois textes (`ROUTE_FERMEE`, l. 9004-9013), **aucun ne nomme la cause**. Mort : le jeu prend la prose du jet fatal pour épitaphe (l. 5542, 5568) et tue à santé nulle quel que soit le palier (l. 4880) — « Tu n'as pas brillé, mais tu es debout. » (issue ÉCHEC, l. 6410) suivi de MORT (vie L2, écran 34) est possible dans le jeu aussi.

### RYTHME — 6,0 / 10 (L1 6 · L2 6 · L3 5 · L4 6 · L5 7)

**Courbe** : écran 1 « je lis, ça va » (sûr 5/5) → 10 « je tourne des pages » (5-9 pressée ; 3→11 curieuse) → 25 « je joue » (5/5) → village : trois tunnels (34-39 ; 38-49 ; 40-72) → 70 : **les trois lecteurs de la run curieuse s'ennuient, les deux de la run pressée sont tendus** → fin : la Falaise, « superbe » et « lu à moitié » (5/5).
**Constat** : le seul axe où 5/5 sont « sûr » partout ; la divergence à l'écran 70 n'est pas de profil mais de transcript.
**Citation** : « je lis un bon roman mais je ne joue pas » (L1, grille 70) contre « je joue, ça se resserre, j'ai envie de voir le procès » (L2, grille 70).
**Vérification** : transcript curieuse = 2 dés, 65 « touche pour continuer » sur 104 écrans, village 40-72 = 33 écrans sans dé ; transcript pressée = 17 dés, 88 « touche pour continuer » sur 156, sept dés au village. La courbe « accroche → ouverture → pression → climax » existe dans une run et pas dans l'autre.

---

## 3. L'HISTOIRE TRANSMISE

**Commun aux cinq** (ce que le jeu transmet) :
1. Une lande où le soir ne tombe jamais ; une pierre-frontière au nord, un trou plein de cordes au sud.
2. Tout le monde « descend » vers le sud ; personne ne remonte.
3. Un village qui a renoncé (à parler, ou à autre chose) et qui compte l'étranger à la craie.
4. On y jure trois choses.
5. Un pendu-juge, le Bailli, trois cents noms signés, le sien en dessous ; il juge encore.
6. Un procès qui pend.
7. Une voix regarde ; un dé décide.
8. Au bout, on descend par une corde ; la suite est en dessous.

**Contradictoire** (ce que le jeu laisse deviner) :
- pourquoi le village pend : « pour remplacer quelqu'un » (L2) / « pour se protéger de ce qui appelle » (L4) / « ceux qui entendent trop » (L5) / « l'Ordonnance » (L1) / « les signes de la Fixation » (L3) ;
- ce que veut la voix : s'amuse (L5), collectionne (L3), tient le Registre (L1), garde les étages (L2), constate (L4) ;
- ce qu'est le héros : « mort » (L1 L3 L4 L5) / « tu débarques » (L2) ;
- ce que vaut descendre : vivant (L1 L3 L5) / « à suivre » (L2) / « je ne sais pas si descendre est gagner » (L4).

**Manque chez tous** (ce que le jeu ne dit pas dans la première run) :
- pourquoi le héros est là et ce qu'il veut (dit à l'intro, hors paquet, jamais redit) ;
- ce qu'engage « à la troisième aube, tu choisis » (jamais résolu : deux occurrences dans `scene-data.ts`, l. 3603 et un commentaire l. 4102 ; l'aube de la halte l. 3991 n'y revient pas ; Codex `arc:serment` : « valables trois aubes ») ;
- ce qu'est un Renonçant, ce qu'est une Fixation (indices sur le Champ des Fixés l. 2457 et à la feuille du Tribunal l. 6087 — **hors route de première run**, `lib/demo.ts` `DEMO_ROUTE` ; définition au Codex `arc:fixation`, hors run) ;
- qui est le trois cent unième (voulu) ; ce qu'il y a en bas (voulu).

---

## 4. LES MOTS

| mot | testeurs qui ne l'ont pas compris | 1re rencontre | le jeu l'explique-t-il |
|---|---|---|---|
| « il décide avec moi » (qui est « il ») | 5 | écran 2 | Seuil : « Le dé fera le reste » (`prologue-data.ts` l. 132), hors transcript ; en run, jamais. |
| Geôlier (le nom de la voix) | 5 | jamais en run | jamais (seule chaîne rendue : aide Options, `GameMenu.tsx` l. 644). L'étiquette « ◉ LE GEÔLIER » est un ajout de la réplique. |
| Renonçants | 5 | écran 40 / 50 | jamais ; deux indices (`scene-data.ts` l. 4754 ; Verger, vie L1 écran 17). |
| Fixation / Fixés / Ordonnance | 5 | écran 44 / 73-75 | indices hors route de première run (l. 2457, 6087) ; Codex `arc:fixation` (hors run). |
| Sceau | 5 | écran 27 (l'objet du Bailli) / 100-153 (la marque) | le mot n'est jamais affiché ; la marque est « une entaille en creux… en forme de coin » ; Codex : « La marque de la paume ». |
| Jour (ce qu'il fait) | 5 | écran 1 | jamais énoncé ; une ligne du Geôlier au 2e refus (l. 9270). |
| Bailli | 5 | écran 34 / 31 (dans une issue) | nommé après coup ; Codex `renc:bailli`. |
| Soupçon | 4 | jamais en run | jamais nommé (voulu) ; ses signes le sont (5 craies, 5 lignes du Geôlier, témoins). |
| « à la troisième aube, tu choisis » | 4 | écran 56 / 64 | jamais. |
| « Ces jours-là ne s'écrivent pas » | 4 | écran 26 / 50 | compris par 3 après le Registre. |
| Appelé | 3 | vie (Veilleur) | en contexte (« ce qui appelle », vie L4 écran 21). |
| Aguerri / Entaillé / Ébranlé | 3 | écrans 79 / 16 | la phrase sous le mot ; l'effet au dé, jamais (voulu). |
| le trois cent unième | 2 | écran 32 / 33 | jamais (voulu ; chapitre non tiré). |
| les Profondeurs | 2 | vie (feuille du Tribunal) | jamais (une occurrence dans tout le jeu, l. 6087). |
| chaîne de fonction / sceau au poing | 2 | écran 24 / 27 | jamais (« insignes », écran 28, est la glose). |
| FUNESTE / DESTIN / DE JUSTESSE / MALÉDICTION | 2 | écran 4 | jamais ; « Le sommet du dé » (écran 86) pour DESTIN. |
| Grand Registre / Reliques / Codex / Descente | 2 | écrans 153-156 | mots de menu, jamais en run. |
| « Le livre dit qu'ils avaient tort » | 1 | écran 56 | jamais. |
| RUSE / INSTINCT / COURAGE / EMPATHIE | 1 | écran 3 | au radar du Seuil (hors transcript) ; en run, jamais. |
| OBTENU / COMMUN / RARE | 1 | écran 54 / 82 | inventaire (menu), jamais vu dans le paquet. |

---

## 5. LES MOMENTS PERDUS (cités par ≥ 2)

1. **Écran 2 — « À partir de maintenant, il décide avec moi. »** (L4, L5 ; D chez L1, L2, L3). Cru : « il » = l'homme immobile. Leurs mots : « Une ligne : “Le dé.” » (L5), « “Le dé décide avec moi” aurait suffi » (L4).
2. **La route fermée** — transcript curieuse 38, pressée 9 ; vies L1 31, L2 5, L3 5, L5 24 (5/5). Cru : « le monde se ferme au hasard » (L3), « un bug » (L4), « une boucle » (L1). Leurs mots : « Le grand tour te ramène sur elles — c'était le prix. » (L1), « dire pourquoi la route a disparu (“parce que tu as pris sans donner”) » (L4). Vérifié : aucun des trois textes de `ROUTE_FERMEE` ne nomme la cause.
3. **La puce JOUR** — transcript pressée 21 et 59 ; vies L3 19, L4 12 et 36 (5/5). Cru : « rater coûte un jour » (L2, L4), « bug d'affichage » (L3). Leurs mots : « La nuit est tombée en marchant. » (L4). Vérifié : règle des trois lieux engagés, jamais énoncée ; JOUR 5 en pleine grange (L4 E7) = réplique.
4. **Écran 34 (curieuse) — la Bête revient** (L1, L3 ; L5 grille). Cru : « le jeu rejoue l'écran 8 », « un montage raté ». Leurs mots : « Celle du creux t'a retrouvé. » (L1), « tu redescends vers le creux » (L3). Vérifié : menace laissée active ; la trace existe (écran 24) ; le bandeau « • RENCONTRE • » est identique à celui de l'écran 8 et précède la phrase qui dit le retour.
5. **Le procès sans motif** — vies L1 25, L3 35 ; transcript pressée 73 et 121 (L2). Cru : « j'ai sauté un écran » (L1), « le jeu ne sait pas ce que j'ai fait » (L3), « le bouton cassé » (L2 : tapé chapelle, arrivé au Tribunal). Leurs mots : « Tu ne les as jamais vus ; eux, si — les marques sur ton bras ont voyagé avant toi. » (L1), « une ligne du Geôlier au premier échec (“Ils comptent aussi tes maladresses”) » (L3), « “Tu n'iras pas à la chapelle” » (L2). Vérifié : l'absence de témoins est **réplique** (le jeu les fait déposer, transcript pressée 73-74, y compris pour un jet social raté, `Scene.tsx` l. 5439-5444) ; le déroutage sans transition et la déposition du Rebouteux (« une plaie qu'aucun outil du hameau ne fait », écran 121) sont, eux, du jeu.
6. **La convocation avant le serment** — vies L2 9, L3 13. Cru : « condamné d'avance ». Leurs mots : « Inverser les deux blocs. » (L3). Vérifié : les lignes de palier sont ajoutées à l'arrivée sur l'écran ; si le palier 5 tombe par le jet d'arrivée, « c'est une convocation » se lit avant la paume tendue — dans le jeu comme dans la réplique.
7. **Le Registre final** — transcript 100 / 153 (L1, L2, L4, L5). Cru : « Cendre, c'est moi ? » (L4), « le gagnant dernier, une erreur » (L5). Leurs mots : « Nommer le héros à l'écran 1. » (L4). Vérifié : le nom est tapé au Seuil (paquet) ; le rang est la règle des jours (jeu).
8. **Écrans 42-43 (pressée), paragraphe doublé, coupé à « qui n'▌ »** (L2, L4). Cru : « un bug ». Vérifié : curseur de frappe capturé par l'enregistreur (`TypedText.tsx` l. 94) — artefact du transcript.
9. **« On ne sent jamais le premier tour de corde. »** — écran 45 / 57 (L2, L5). Cru : « qui parle ? ». Vérifié : ligne du Geôlier (palier 2), bandeau dans le jeu, texte nu dans le transcript.
10. **Combat puis « en chemin » sans avoir vu le lieu** — vies L4 6-7, L5 20. Cru : « je n'y suis jamais entré ». Leurs mots : « Dire “tu laisses le Champ derrière toi”. » (L4), « une ligne de sortie du champ » (L5).

---

## 6. LE RYTHME

**Écrans avant la première décision** : 3 pour tous (les deux transcripts) ; 1 sur la réplique. Première décision **à enjeu** : 11 (curieuse, la Bête) / 3 (pressée, « Fouiller les offrandes RUSE »). Premier **dé** : **78** (curieuse) / 4 (pressée) / 3-4 (vies).

**Tunnels de lecture** (cités par ≥ 2) : transcript curieuse 5-10 (sept écrans, une direction), 34-39 (la Bête revient + route fermée, un choix), **40-72 (le village, 33 écrans, zéro dé — L3 : « des choix uniques qui sont des touche-pour-continuer déguisés »)**, 84-99 (la Falaise, seize écrans, quatre « touche pour continuer » de suite, L1) ; transcript pressée 5-10 (cinq écrans pour un bouton unique), 38-49 (le troupeau, douze écrans, un doublon), 140-152 (treize écrans à bouton unique, « lu à moitié », L2 ; « je tapais sans lire », L2). Vies : 26-31 (L2, le Marcheur, trois écrans pour un jet), 26-30 (L3, Tribunal, quatre écrans de menus), 42-50 (la Descente, un bouton).

**Passages joués sans comprendre** : « Fouiller les offrandes RUSE » (L4, écran 3 : « que fait RUSE ? ») ; « Trancher sa corde » (L2, écran 29 : « pourquoi ? ») ; « Jurer » (L4, écran 66 et vie 21 : « jurer quoi, à qui, pour quoi ? ») ; « Invoquer le trois cent unième » (L2, écran 76 : « pourquoi ça sauve ? ») ; « Donner un nom à la plume » (L2, vie 14 : « compris après coup que je dénonçais quelqu'un ») ; « Raconter ta mort » (L4, vie 42 : « quelle mort ? ») ; le procès (L1 vie 25, L3 vie 35-36 : « sans savoir ce que “Produire un papier” aurait produit ») ; « Ces jours-là ne s'écrivent pas » (L5, écran 26).

**Selon le profil** : le pressé (L2) et le néophyte (L4) ont eu la run qui joue et n'ont pas compris ses règles ; le lecteur (L1), le narratif (L3) et le roguelike (L5) ont eu la run qui lit et ont dû jouer la réplique pour voir un dé. Tous les cinq notent RYTHME entre 5 et 7 : le tempo n'est pas ce qui les a perdus, c'est ce qu'ils ont eu à lire pendant qu'il ne se passait rien.

---

## 7. CE QUI MARCHE (compris par tous sans effort — à ne pas toucher)

- **Le lieu** : lande, crépuscule figé, pierre, colline, hameau, trou de cordes — « sûr » dès l'écran 10, jamais perdu.
- **Le village** : « ils me comptent », « un pays méticuleux », les volets, la craie, les corbeaux — lisible à l'entrée pour 5/5 sans qu'on ait dit un mot de règle.
- **Le Bailli** : trois cents noms, le sien en dessous — 5/5 le tiennent après l'écran 32, verbatim.
- **Le procès** : « ils t'attendent au tournant du muret, le hameau entier » — le seul moment noté « sûr » sur l'axe QUOI, et le moment où les deux pressés veulent continuer.
- **L'Anneau du dé** : 5/5 « compris tout de suite » dès qu'ils le voient.
- **Les états** : « la phrase sous le mot suffit » (« Quand tu poses le pied, la douleur remonte jusqu'à la hanche ») — L4, L2, L3.
- **La Falaise** : « le seul moment où j'ai eu peur » (L3), « superbe » (L1), « prenante » (L4) — même lue à moitié.
- **L'envie de suite** : 5/5 « oui » en H, et tous sur les mêmes deux questions (ce qu'il y a en bas ; qui est le trois cent unième / qui est la voix).

---

## 8. LE VOTE — la seule chose qu'il aurait fallu lui dire (ou montrer) plus tôt

- **L1 (romans)** : que le héros est mort — une ligne à l'écran 1, pas au Verger de la deuxième vie.
- **L2 (pressé)** : de quoi il meurt — « le texte dit que je survis, l'écran dit que je meurs ».
- **L3 (narratif)** : que rater un jet se paie socialement — « Ils comptent aussi tes maladresses », au premier échec.
- **L4 (néophyte)** : que « il », c'est le dé — et son propre nom, avant le tableau.
- **L5 (roguelike)** : ce que mourir laisse — « un roguelike sans mort vue n'a pas encore montré sa boucle ».

---

## 9. TROIS CHANTIERS, dans l'ordre

**1. Raccorder « il décide avec moi » à son sujet.** Levier : une ligne — celle de l'écran 2 — qui porte le mot « dé », puisque l'écran qui le portait (le portrait du Seuil, « Le dé fera le reste ») est deux écrans plus haut et que l'amorce a perdu le mot en fondant la clause « Le dé tranche » (`prologue-data.ts` l. 33-40). 5/5 perdus, dont deux qui ont pris l'homme immobile pour « il ». Ne pas faire : un écran qui explique le dé, un « dit le Geôlier », un tag de stat commenté.

**2. Faire payer la route fermée là où elle se paie.** Levier : une ligne dans les trois textes de `ROUTE_FERMEE` (l. 9004-9013) qui tienne la cause — céder le chemin, se plaquer, un échec dur — au lieu de « quand tu as pris ta décision » ; le prix est déjà annoncé à l'acte (« La route directe est à elle : la tienne fera le tour. »), il n'est jamais reconnu à la Croisée qui l'encaisse. 5/5 perdus, tous les profils, transcript et réplique. Ne pas faire : « route fermée », un chiffre, une puce.

**3. Montrer une Fixation avant d'en condamner par l'Ordonnance.** Levier : la route de la première run (`lib/demo.ts`, `DEMO_ROUTE`) ne passe ni par le Champ des Fixés (« Une Fixation ratée : ni mort ni tenu », l. 2457) ni par la feuille du Tribunal (l. 6087) ; le mot arrive au procès (« L'Ordonnance de la Fixation s'applique », écran 75) et tue — une ligne du Champ, ou un pendu fixé vu depuis la colline, avant le hameau. 5/5 ne savent pas ce que c'est ; trois procès joués sur cinq vies. Ne pas faire : une entrée Codex forcée, un glossaire, une Doyenne qui définit.

À signaler à part, parce que ce n'est pas un chantier du jeu : **les transcripts de « première run » doivent commencer à l'intro** (`Tu es mort. Il y a peu.`), pas à l'écran de jeu, et marquer les bandeaux du Geôlier — sinon le prochain panel notera encore QUI à 3,8 pour des raisons que le jeu ne mérite qu'à moitié.

---

Les deux fichiers `/tmp/panel3/DEBAT.md` et `/tmp/panel3/DIAGNOSTIC.md` sont écrits.
