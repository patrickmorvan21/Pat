# PACTUM — panel de 6 IA en aveugle (v1.128.3, 03/09/2026) · RÉCAP

Six testeurs sans aucun contexte de design (curieux · pressé · prudent · téméraire · social · méfiant), chacun une première run lue écran par écran (transcript réel du build) puis une vie jouée sur la réplique Python, puis un débat croisé modéré. Chaque citation a été vérifiée dans les transcripts, les sources et `pactum.py` AVANT d'être retenue ; les griefs venus de la réplique sont requalifiés. Rapports bruts dans `rapports/`, débat complet dans `DEBAT.md`. Ce fichier est le tri final, plus l'état des correctifs appliqués dans la foulée (v1.129.0).

## En cinq lignes
1. **La Falaise aux Cordes est LE moment du jeu — 6 voix sur 6**, et le trois cent unième (5/6) prouve que « porter une phrase d'un lieu à l'autre » est ce que les six attendent de PACTUM.
2. **Huit constats portés par ≥ 3 profils** : cinq sont des bugs certains du jeu (secret final offert sans découverte, gens nommés dans les boutons avant le texte, le chien qui refuse puis la chaise dedans, la couture d'entrée servie à qui n'est pas sorti, la grange sans marche), un est une divergence de profil (les routes fermées), un est de l'orchestration (la direction jamais atteinte), un est du design (le danger illisible, la sortie qui ne se mérite pas).
3. **La moitié des griefs unanimes venaient de la réplique, pas du jeu** — la nuit muette, la conséquence avant l'acte, le jour qui saute : tous corrigés dans `pactum.py` pour que le prochain panel juge le vrai moteur.
4. **Le point que personne n'a formulé** : la Descente ne juge rien (ni lieux, ni santé, ni serment) pendant que le procès tue quelle que soit la santé — le jeu est plus dur avec qui parle aux gens qu'avec qui s'en va.
5. **Le vote ne se contredit pas, il s'ordonne** : causalité lisible (A1, A4, A5) → survivre doit coûter (A2, A3) → agentivité sur les directions (A6).

## Bugs certains — JEU (corrigés en v1.129.0, vérifiés en jeu 16/16)
| # | Constat (porteurs) | Cause vérifiée | Correctif |
|---|---|---|---|
| C1 | Le secret final (« une pendue s'est relevée… Elle a huit ans ») offert à qui n'a vu que l'amorce (A1 A3 A5 A6) | `Scene.tsx` servait `chap.resolution` dès que la scène suivante est terminale, sans exiger le développement (`stage < 3`) | résolution gatée sur `stage >= 2` — sans le Moulin, pas de révélation |
| C2 | « Soutenir le regard des trois hommes » / « Voir où le gamin veut te mener » sur un écran qui ne décrit qu'une femme et un corbeau (A1 A2 A3 A5) | narration de `hameau-entree-2` en retard sur ses boutons | 3e ¶ ajouté : le gamin sur son muret, les trois hommes plus haut dans la rue |
| C3 | Le chien refuse l'entrée (FUNESTE) puis « S'asseoir sur la chaise » (A2 A4 A6) | `bailli-dedans` servait les mêmes 3 choix après `narrationEchec` | `requiresEchecArrivee` / `masqueSiEchecArrivee` (jeton `arrivee:echec`, portée écran) : après l'échec, seul « Repartir » ; « midi dehors » → « le jour n'a jamais fini de tomber » |
| C4 | « Tu repasses la limite du village » servie à qui vient de jurer au muret (5 voix) | la couture `entre` traitait le Seuil comme dehors | le Seuil compte comme dedans (v1.128.4) |
| C6 | Chemin Creux → grange sans transition (A1 A2 A5) | routage direct sur `hameau-halte-1` au compte de lieux atteint | `HALTE_DEPUIS_LA_LANDE` en tête (« Les murets réapparaissent avant que tu aies décidé de revenir… ») quand on arrive de la lande |
| — | Le Geôlier « Tu regardes tout, tu ne risques rien » FAUX après une MALÉDICTION contre la Bête (A3 A4 A6) | `engageIci` remis à zéro en entrant dans la liaison, avant la lecture | `engageAvantReset` : le dé lancé au lieu quitté compte |
| — | « Tu as juré, tu as tenu » servi à qui a rompu le Serment (A1) | conséquence inconditionnelle | deux sorties de l'aube (`requiresSerment` tenu/rompu) — au rompu : « Il regarde ta bouche… Ça se saura aussi. » |
| — | « • RENCONTRE • La Meute Grise » deux fois (A1) | bannière re-posée sur le 2e beat | bannière seulement quand `foe` change |
| — | « Ils ont sorti une chaise… une date » répété APRÈS la relaxe (A4 A6) | pas de mémoire par palier | `vus["soupgeo\|n"]` : une fois par palier et par vie |
| — | Sortie en dix écrans sans un dé, Sceau compris (A3) | `palissade-sud` tirable au pool | exclue de `TRAVERSAL_POOL` (et de l'export du kit) |
| — | Le survivant apparaît « en cours » au Registre de la Descente | `buildRegistre` sans cause | cause « a franchi la Descente » |
| C7 | La même fermeture de route quatre fois mot pour mot (A2 A6) | tirage sans mémoire | texte le moins vu (`ctx.dejaVues`) — la partie « la fermeture doit nommer l'échec » reste à écrire (voir design) |

Contradictions de texte corrigées au passage (A1 A2 A4 A5 A6) : le mur des cordes (une seule sans étiquette, à hauteur d'œil, au centre), le Veilleur qui « ne quitte pas sa niche », « Derrière, le sol manque » à la place d'« un chemin descend », le coude du Chemin Creux, la Mare (« Ils ne sont pas encore partis »), la grange (« ce qui s'est DIT… ce qui a marché dessus, tu l'entendras quand même »), la Petite Fixée qui s'écarte du lit et non de la porte, le Verger (« silhouettes penchées… qui bêchent » — l'image `monstre_epoux_verger_b_b` a été OUVERTE : les deux bêchent, la femme lève la tête sans lâcher sa bêche, l'homme ne se redresse pas), la Borne « creusée dans le granit », la déposition de l'échec d'Empathie (« ce qui est sorti n'était pas de chez nous ») — qui donne enfin au procès de A5 un témoin nommé pour ses mauvais dés.

## Bugs certains — OUTIL (réplique / kit, corrigés)
- « Dormir malgré le crépuscule » ne racontait rien (A1 A2 A5) → `rest` raconte la nuit et crédite le Jour en QUITTANT (plus à l'affichage).
- La craie et le Geôlier AVANT le résultat du dé (A2 A4 A5) → manifestation après `resoudre`.
- Le Jour qui saute en poussant une porte (A1 A2) → jour posé à la sortie de la scène de nuit ; dormir → J+1, repartir sans dormir → inchangé (`sansNuit`).
- « Lui réciter l'ordonnance » sans ordonnance (A6) → l'extracteur traversait un bloc (`masqueSi: { savoir }` lu comme savoir de scène) ; lecture à 4 espaces d'indentation.
- « OBTENU — trouvaille rare » et besace vide (A4) → le Destin donne réellement.
- Plantage / boucle / butin absent sur les gestes tactiles (ChatGPT, avant le panel) → style `geste`, `suite()`, `donneObjet`/`echecGardeLoot`/`echecSoupcon`.
- Le kit offrait `palissade-sud` et ignorait `exigeEchecArrivee`/`exigeSerment` → alignés.
- Restent des artefacts de l'ENREGISTREUR (pas du jeu) : l'en-tête « jour 1 · 1 lieux traversés » lu après la remise à zéro ; l'écran dupliqué avec `▌` ; le nom du lieu perdu dans l'en-tête après un combat.

## Incohérences probables — à trancher ou à écrire
- **C5 — la direction choisie n'est jamais atteinte** (A1 A3 A5) : « Vers les rangées de poteaux » → Meute → Falaise. Et à l'écran 74 la ligne d'arrivée à couvert du lieu jamais atteint est servie en plein encerclement. Plan : mémoriser `trav.destApresMeute`, honorer la destination après la Meute, dérouter la Falaise après ce lieu ; et ne servir ni approche ni arrivée sur une substitution. Non fait — c'est l'orchestration de la première run, à cadrer avec Patrick.
- **Trois portillons pour une sortie** (A1 A2) : l'escorte, « Examiner le portillon », le Veilleur qui ouvre, « Passer le portillon » — la Halte et la Palissade écrites comme deux arrivées séparées (« Trois jours que j'ai vu personne » crié pendant que l'escorte est dans le dos).
- **La Petite est là et disparaît sans un mot** (A1 A5), et le jouet pris sur son lit.
- **Le Bailli puis la Bête sur le même écran** (A3 A5) — deux lignes adjacentes (`scene-data` ~307/309).
- **« Ils sont six, alignés » répété entre deux beats du même lieu** (A4 A6).
- **L'Écrivain public témoigne sans avoir été rencontré** (A6) — à vérifier dans `temoins.ts`.
- **Image de la Maison du Bailli** : `scene_maison_du_bailli_c.png` montre cinq fenêtres éclairées, une grille ouverte, un réverbère ; le texte dit « chaque fenêtre bouchée de pierres ». Déjà marquée « à remplacer » dans `data/couverture-verdicts.json` (visible dans le Graphe) — le prompt reste à commander.
- **« Utiliser — Offrandes de la Borne » sur 16 écrans** (A6) — le 4e choix contextuel apparaît partout où le soin est pertinent.
- **Le Serment est un décor** (A1 + A3 + A5) : trois clauses et une échéance dites une fois, jamais rappelées.

## Design — ressenti, pas bug (à Patrick)
- **C8 — le danger est illisible et la sortie ne se mérite pas** (A2 A3 A4 A6) : A2 sort vivant à 0,38 après six FUNESTE, A6 à 0,04 « sans que le monde me dise que j'étais à deux doigts de mourir », A4 meurt à 0,05 sans savoir de quoi. Réserve : la réplique n'a pas l'érosion de l'interface — mais le MONDE ne le dit jamais en mots.
- **La Descente ne juge rien** (le point de personne) — elle donne le Sceau à qui prend la porte ; le procès tue à toute santé.
- **Les routes fermées** : justes quand elles suivent un ACTE choisi (A3 A4 les adorent), punition aveugle après un dé raté (A1), tampon à la 4e (A2), « je ne choisis plus, je subis le dé » (A6). Correctif proposé par A1 : que la fermeture parle de l'échec (« les trois hommes ont fait passer le mot »).
- **Le climax se joue sans moi** (A5 seule) : 20 écrans, 5 choix, « Reculer d'un pas » → « Descendre ».
- **Le procès à cause illisible** (A5) — en partie réparé (le témoin de l'échec d'Empathie existe maintenant), le reste est le canal Soupçon lui-même.
- **Le Marché muet** : A4 aime les quatre échanges courts, A6 y voit « six dialogues sans enjeu ». Sans arbitre.
- **« Les mains vides et mort »** (A1 A5 perdus, A6 ravi) : la prémisse n'est dite qu'à l'intro, jamais redite en monde avant « Raconter ta mort ».

## Ce qui marche (à ne pas toucher)
La Falaise (6/6 — « Il te regarde la tendre — et il tombe, devant toi, sans un cri »), le trois cent unième porté de lieu en lieu (5/6), le Marcheur à rebours (« un personnage entier en trois répliques »), le Geôlier quand il est rare (« Il se moque de moi exactement quand je le mérite »), les routes fermées quand elles nomment leur cause.

## Le vote
- A1 curieux — que le monde tienne ce qu'il annonce.
- A2 pressé — que le risque pèse.
- A3 prudent — que la sortie se mérite.
- A4 téméraire — que le jeu regarde ce que je fais.
- A5 sociale — que le procès ait une cause lisible.
- A6 méfiant — que le choix de direction redevienne un choix.

## Ordre des chantiers proposé
1. **Causalité lisible** — fait pour la plomberie (C1-C4, C6, Geôlier, Serment, bannière, Soupçon) ; reste C5 (la direction tenue après la Meute), les trois portillons, la Petite qui disparaît.
2. **Survivre coûte** — design : que la Descente juge (lieux traversés, ou le Veilleur qui retient), que le corps se dise en mots avant la mort ; le levier chiffré reste le barème PHYSIQUE (doctrine 9/08), jamais un coût générique.
3. **Agentivité des directions** — les routes fermées qui nomment l'échec qui les ferme ; une issue sans dé quand l'anneau montre cinq encoches (A6).
