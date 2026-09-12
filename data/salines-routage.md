# Les Salines — proposition de table de routage (12/09/2026)

**Statut : PROPOSITION, à valider par Patrick.** Rien n'est écrit dans le jeu ;
`data/zones/salines.json` porte la bible telle quelle, ce document dit comment
la jouer. La configuration retenue s'écrira ensuite dans `ZONES[].environnements`
(`aldenhar/lib/zones.ts`) et le graphe se générera dessus (étape 3 de l'ordre
verrouillé le 12/09).

**Méthode.** Chaque configuration a été **jouée 600 fois par le VRAI moteur**
(`lib/etages.ts`, celui qui décidera en jeu) : `node --experimental-strip-types
tools/simuler_salines.mjs` mesure les lieux par run, les combats, les fragments
lisibles et si le fragment 2 est offert. Les chiffres ci-dessous en sortent.

---

## 1. La contradiction de la bible, et ce que la mesure en dit

La bible demande trois choses qui ne tiennent pas ensemble :

| ce qu'elle demande | ce que ça donne avec le moteur |
|---|---|
| « un lieu obligatoire + un ou deux tirés » par environnement → **9 à 11 lieux** | vrai seulement avec **4** obligatoires |
| sa liste marque **6** obligatoires (Rive haute, Terrasses, Entrepôt, Fossé, Rues, Tour) et en annonce 7 | 6 + 4 × (1 à 2) = **10 à 14** |
| **33 lieux** listés (« 30, à trier vers ~20 ») | la bible telle quelle : **11 à 13 lieux par run**, médiane 12 — au-dessus de la cible |

Et deux défauts de construction que seule la simulation montre :

- **Le fragment 2 n'est offert que dans 37 % des runs** (il faut tirer le Radeau
  ou la Guérite), alors que la bible exige qu'il soit **GARANTI lisible par
  construction** — c'est la classe de défaut de la défense du Serment au procès
  des Landes.
- **2,7 % des runs lisent LES SIX fragments** en une seule vie (Barge = F1 **et**
  F4, plus Cour, plus Radeau ou Guérite). La bible interdit que la vérité soit
  lisible en une run.

## 2. La proposition (configuration D de la simulation)

Cinq décisions, chacune avec sa raison — **c'est là que Patrick tranche** :

1. **Le Fossé n'est plus un lieu : c'est le beat d'ARRIVÉE de Saulnes.** On y
   descend puis on remonte vers la ville — c'est une approche (comme le Chemin
   du Sud avant la Palissade), pas un endroit où l'on décide. Il garde sa
   tempête forte et l'escalier révélé, mais il ne crédite pas un lieu. Ça rend
   un cran de longueur sans rien perdre.
2. **Le Quai de l'île devient OBLIGATOIRE** (le 7e que la bible annonçait sans
   le nommer) : c'est « la scène où le twist se paye » — une scène qui paie ne
   se tire pas au sort. Saulnes finit donc par **Rues → Quai → Tour**, dans cet
   ordre.
3. **Le fragment 2 se lit aux TERRASSES** (obligatoire) : l'Encroûté qui dit
   « vas-y maintenant » se tient en haut des terrasses, et le Héron est sur sa
   patte dans le bassin en contrebas — **visible par construction**, puisque
   c'est un invariant d'image de l'environnement. Radeau et Guérite gardent le
   « fragment 2 bis » (re-lecture, et le Perchoir donne la clé pour qui observe).
   Résultat : **F2 offert dans 100 % des runs**.
4. **La Barge est EXCLUSIVE : le coffre (F1) OU la cale (F4), jamais les deux.**
   L'Encroûté qui parle te retient — le temps d'une seule chose. Résultat :
   **0 % des runs lisent les six**, maximum 5 (8,5 % des runs).
5. **Tri 33 → 29** : la Sonde SORT (son Souffle court double celui de la
   Passerelle, sur la même menace), **la Broyeuse FUSIONNE avec la Forge** (la
   bible le suggère elle-même — les pilons deviennent le geste de la Forge), et
   **le Bassin comble FUSIONNE avec la Passerelle rompue** (sa tempête qui révèle
   « la passerelle intacte » est exactement le troisième choix de la
   Passerelle).

**Tirages** : Croûte 1–2 · Bassins 1–2 · Salines **1** · Saulnes **0–1**.

**Ce que ça donne (600 runs)** : **10 à 12 lieux par run, médiane 10** ·
**combats 4 à 8, médiane 5** (cible 5–7 ✓) · **fragments lisibles 3 à 5,
médiane 4, jamais 6** · F2 100 %.

> Variante E (Croûte à 2 tirages fixes, « le danger d'abord ») : médiane 11,
> les six jamais lus, ≥ 5 dans 12 % des runs. À préférer si la Croûte doit
> peser plus lourd que le reste.

## 3. La table, environnement par environnement

### 1 · La Croûte — le fond du lac (Jour I, pas de campement sûr)

| rôle | lieu | ce qui s'y joue | combat | fragment | objet |
|---|---|---|---|---|---|
| **entrée** | La Rive haute | balayage (première tempête) · sonner la cloche ou pas · le Percepteur (1re réclamation) | — | — | Battant (usage : la cloche, ici même) |
| pool | La File | grattage d'un Cristallin | **Piqueurs** (court) | — | objet sur un genou de statue (à choisir au tri) |
| pool | Le Champ des Sillages | le Bœuf sur ses rails (suivre / monter / laisser) · le Ver au loin (1re fois) · savoir : les fissures partent du fond | **Gisants** | — | — |
| pool | La Barge échouée | l'Encroûté qui dit la phrase entière · **coffre OU cale** | — | **F1 ou F4** | Perche · Registre des traversées |
| pool | La Statue | grattage · balayage révèle la seconde statue · ta propre statue (twist) | — | **F3** | — |
| pool | La Bouche | trois beats : descendre, craquement, remonter ou un second objet | (le Ver, sans combat) | — | Dent de Ver · Lanterne du Noyé |
| pool | Le Radeau | l'Encroûté « vas-y maintenant » → le Héron s'envole | — | F2 bis | — |

Tirages 1–2 sur un pool de 6. Aucun campement.

### 2 · Les Bassins — la sécheresse crue (Jour II, premier campement, coûteux)

| rôle | lieu | ce qui s'y joue | combat | fragment | objet |
|---|---|---|---|---|---|
| **entrée** | Les Terrasses | trois niveaux, descendre est un choix · **l'Encroûté du haut dit « vas-y », le Héron décolle en bas** | **Vermisseaux** | **F2 (garanti)** | Sel qui garde |
| pool | La Passerelle rompue (+ Bassin comble) | équilibre · tomber = Entaillé + Souffle v2 avec le Ver dessous · la Perche ouvre « sonder » · balayer révèle la passerelle intacte | (Souffle) | — | usage : Perche, Plume |
| pool | Le Perchoir du Héron | observation (Instinct) : rester pour le voir s'envoler, et voir ce qui suit | — | la clé de F2 | Plume du Héron |
| pool | Le Bassin des Léchards | suivre / chasser / ignorer — la route honnête vers le Puits | — | — | — |
| pool | Le Bassin des Déclarés (**rare**) | toucher la silhouette de ta dominante (la Fixation en mécanique) ou passer | — | — | — |
| pool | La Cuve fendue | boire (+pellicule) · remplir la gourde · passer | **Sauteurs de saumure** · Assoiffés | — | usage : Gourde double |
| pool | La Guérite | l'Encroûté « connaît le chemin » | — | F2 bis | — |
| pool | La Noria | crochetage ou COURAGE · ouvre un canal (saute un lieu) · prix : le Ver à la scène suivante | **Sauteurs** | — | usage : Dent de Ver (relance) |

Tirages 1–2 sur un pool de 7. **Campement** : aucun lieu dédié — proposer que la
Guérite ou le Perchoir portent « dormir là » (un palier d'Encroûté, la nuit qui
coûte). À trancher.

### 3 · Les Salines — le chantier (Jour II–III, le creux, mini-boss)

| rôle | lieu | ce qui s'y joue | combat | fragment | objet |
|---|---|---|---|---|---|
| pool | La Pesée | poids contre poids · l'Encroûté note ce que tu prends · « Demander où sont les autres » si F1 lu · le Percepteur (2e réclamation) | — | F1 éclairé | usage : Registre |
| pool | Le Puits | puiser · le seul lieu où l'Encroûté redescend d'un palier sans coût | **Piqueurs** | — | usage : Sac de sel, Gourde |
| pool | Le Dortoir | **campement** : une nuit = un palier · le Geôlier invite à la seconde nuit · lettre de Passeur | **Rats** (la nuit) · Assoiffés | — | usage : Sandales |
| pool | La Forge à grattoirs (+ Broyeuse) | tracé sur l'enclume, ou pris brut · passer entre les pilons (timing) | (Grumeaux) | — | **Grattoir de saunier** |
| pool | La Cour aux rails | le wagon, ses bancs, les anneaux · détourner le Bœuf vers l'Entrepôt · ce qui respire dedans | — | **F5** | — |
| pool | La Salle des Gages | laisser un gage contre un objet du comptoir | — | — | Manteau · Sandales · Gourde · Œil · Sac |
| **fin** | L'Entrepôt | le Grand Saunier : entrer, comprendre, être trié, lui donner autre chose | **Rats** (+ le mini-boss) | **F6 (garanti)** | usage : Sel qui garde, Sac |

Tirages **1** sur un pool de 6 (l'Entrepôt vaut déjà deux ou trois écrans).

### 4 · Saulnes — le relais (Jour III–IV, abri réel, la tour)

| rôle | lieu | ce qui s'y joue | combat | fragment | objet |
|---|---|---|---|---|---|
| *arrivée* | Le Fossé (beat, pas un lieu) | descendre, remonter · dernier lieu du Ver · tempête forte → l'escalier taillé | — | — | usage : Manteau, Plume |
| pool | La Porte de l'île | le prix d'autrefois, en nature · le Percepteur (3e réclamation) | — | — | — |
| pool | L'Auberge du Relais | **campement sûr** · la proposition la plus douce de rester | — | — | — |
| pool | Le Belvédère | aucune action · la plus grande image · savoir : rails, barge et entrepôt forment un seul dessin | — | — | usage : Œil |
| pool | La Maison du Grand Passeur | le crochetage le plus dur · le nombre à bord et le nombre à l'arrivée | — | (le chiffre, sans le mot) | — |
| **fin 1** | Les Rues qui marchent | marcher pour parler · un Encroûté ouvre la tour « pour un prix » | **Piqueurs** | **F3 (garanti)** | — |
| **fin 2** | Le Quai de l'île | la barge orientée vers la croûte · monter = mort unique · deux fragments suffisent | **Gisants** | — | — |
| **fin 3** | La Tour de l'écluse | tracé · crochetage du cadenas · COURAGE sur la roue · l'eau part devant toi | — | — | usage : Dent de Ver · Roue |

Tirages **0–1** sur un pool de 4 : le calme à la fin.

## 4. Les fragments, garantis et tirés

| fragment | où | garanti ? |
|---|---|---|
| F2 le Héron s'envole | Terrasses (entrée) — bis au Radeau et à la Guérite | **oui** |
| F3 « compris dans le prix » | Rues (fin) — bis à la Statue | **oui** |
| F6 pas un Passeur | Entrepôt (fin) | **oui** |
| F1 le registre / F4 la trappe | Barge (pool, **exclusifs**) | tiré |
| F5 les anneaux | Cour aux rails (pool) | tiré |

Trois garantis (une run en lit « deux ou trois » — ici toujours trois, plus
zéro à deux tirés), jamais les six : ce que la bible demande, prouvé sur 600
runs.

## 5. Les objets — ramassés ici, utiles ailleurs

`tools/verifier_zone.py` contrôle que chaque objet a un lieu de ramassage et
des lieux d'usage. Trois n'ont **aucun usage hors ramassage**, et c'est dit :

- **Battant de la cloche** — il sert à la Rive haute, où on le trouve. Soit on
  le ramasse ailleurs (la Bouche ? un genou de statue de la File ?) et on
  REVIENT le poser (mais la traversée ne revient jamais en arrière), soit le
  Battant se trouve à la Rive et l'usage se décale : « appelle le Ver ailleurs,
  une fois » depuis n'importe quelle scène du Ver. **À trancher.**
- **Lanterne du Noyé** — « inutile ici », promesse pour l'Acte II. Assumée par
  la bible ; à tenir en tête quand l'Acte II s'écrira.
- **Roue et Manivelle** — dépend du mécanisme de fin de zone (à décider).

## 6. Ce qui reste ouvert après cette table

- **Le campement des Bassins** (« Jour II : premier campement, coûteux ») n'a
  pas de lieu : la Guérite ou le Perchoir ? ou aucun, et le premier campement
  est le Dortoir ?
- **Le Bassin des Déclarés est « rare »** : avec 1–2 tirages sur 7, il sort
  dans ~20 % des runs sans règle de rareté. Faut-il une garantie inverse
  (jamais deux runs de suite) ou un vrai poids ?
- **Le Percepteur réclame trois fois** (Rive, Pesée, Porte) : Rive est
  garantie, Pesée et Porte sont tirées — la 2e et la 3e réclamation ne
  tomberont pas dans toutes les runs. Soit on accepte (il réclame « jusqu'à
  trois fois »), soit la 3e passe au Quai (obligatoire).
- **Combats à 8 dans les pires runs** : plafonner (un combat par lieu, jamais
  deux d'affilée) ou laisser la variance ?
