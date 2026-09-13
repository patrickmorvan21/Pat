# Zones — format des données (`data/zones/*.json`)

Format de référence pour les 9 zones du Domaine. Établi avec Les Landes
(zone-étalon, gelée le 20/07/2026) — toute évolution du format se répercute
ici d'abord, puis dans les JSON.

**Circuit** (page Notion « 🌍 Le Domaine — Actes & Zones ») : la zone se
conçoit sur sa carte Figma → une fois **gelée**, ses données structurées sont
générées dans ce dossier → Claude Code intègre. Tant que la zone est en
conception, la carte Figma fait foi sur le contenu, la page Notion sur les
règles. Les textes (strates) et les images arrivent en temps 2 — un JSON de
zone fraîchement gelée a donc tous ses `textes.*` et `illustration` à `null`.

## ⚠️ Source de vérité — règle actée le 03/08/2026

Il n'y a **pas deux sources indépendantes**. Il y a deux domaines disjoints,
plus un miroir vérifié au build.

| Ce dont il s'agit | Fichier canonique |
|---|---|
| Ce que le jeu **exécute** : scènes, choix, stats, seuils, issues, points d'intérêt, **et l'illustration réellement affichée** | `aldenhar/lib/scene-data.ts` |
| Ce que le jeu **n'exécute pas** : géographie de la carte (x/y du Figma), noms lisibles, notes, strates de texte, collections de production (rencontres, créatures, objets sans scène) | `data/zones/*.json` |

`scene-data.ts` est canonique **par construction** : c'est le seul fichier
chargé au runtime. `landes.json` n'est jamais lu par le jeu (piège relevé le
24/07 : des images câblées d'un côté et pas de l'autre). Si les deux se
contredisent, le `.ts` a raison — ce que le joueur voit ne se discute pas.

**Le seul champ partagé** est `scenes[].illustration`, reporté sur
`lieux[].illustration` (la vignette d'un lieu = l'illustration de sa scène
d'arrivée). Dans les JSON de zone, ce champ est un **MIROIR** : il se
régénère, il ne s'édite pas à la main.

```bash
python3 tools/check_coherence.py         # vérifie — sort 1 en cas d'écart
python3 tools/check_coherence.py --fix   # réaligne le miroir sur le .ts
```

Le contrôle est branché sur `npm run prebuild` : **un build ne peut pas
partir avec un miroir périmé**. Régénérer entièrement le JSON depuis le `.ts`
n'est pas envisageable et ne le sera jamais — cela détruirait tout ce que la
colonne de droite énumère, qui n'existe nulle part ailleurs.

## Lecture des cartes Figma

- Cadre **orange** = lieu · cadre **pointillé gris** = région englobante
  (traitée comme un lieu, cf. note Hameau plus bas).
- Chips : préfixe `R` (vert) = rencontre · `C` (rouge) = créature ·
  `O` (blanc) = objet.
- `◆` = l'élément porte la micro-histoire de la zone (pour Les Landes : le
  Bailli) → `histoire_bailli: true`.
- `◇ évén.` / `◇ rare` = rareté à tagger → `rarete`.
- La **position** d'une chip indique son lieu d'attache (chip collée sous un
  cadre = attachée à ce lieu ; chip isolée dans la lande = `lieu_attache:
  null`, élément errant).
- « La Descente → » n'est **pas** un lieu : c'est le nœud de sortie de zone
  (`zone.sortie`), jamais dans `lieux[]`.

## Racine

```jsonc
{
  "zone": { … },
  "lieux": [ … ],
  "rencontres": [ … ],
  "creatures": [ … ],
  "objets": [ … ]
}
```

### `zone`

| Champ | Type | Contenu |
|---|---|---|
| `id` | string | slug snake_case sans accents (`landes`) |
| `nom` | string | nom d'affichage (`Les Landes`) |
| `acte` | number | 1, 2 ou 3 |
| `statut` | string | `"gelee"` (contenu et carte figés) · `"conception"` (bible transcrite, rien de tranché) · `"routage_valide"` (la table de routage est arbitrée, `lib/zones.ts` déclare ses environnements, le graphe se génère — mais aucune scène n'est écrite) |
| `heure_figee` | string | l'heure éternelle de la zone (« crépuscule éternel ») |
| `particularites` | string[] | règles de gameplay propres à la zone (ex. le Serment) |
| `bruit_ecrit` | string | motif sonore rare, en italique dans le transcript |
| `motif_cache` | string | signature visuelle dissimulée dans chaque illustration |
| `sortie` | object | `{ id, nom, note }` — le nœud de sortie (→ Croisée/Descente) |

### Entrées des quatre collections

Gabarit commun à `lieux[]`, `rencontres[]`, `creatures[]`, `objets[]` :

| Champ | Type | Contenu |
|---|---|---|
| `id` | string | slug snake_case sans accents ni article (`colline_aux_gibets`) |
| `nom` | string | nom exact de la carte (avec article et accents) |
| `note` | string \| null | sous-titre de la chip/cadre sur la carte — matière brute gelée pour l'écriture, jamais affichée telle quelle |
| `lieu_attache` | string \| null | id du lieu d'attache ; `null` = errant (ou sans objet pour un lieu) |
| `histoire_bailli` | bool | `true` si marqué `◆` (porte la micro-histoire de la zone) |
| `rarete` | string | `"commune"` (défaut) · `"rare"` (`◇ rare`) · `"evenement"` (`◇ évén.`) — à affiner plus tard |
| `textes` | object | les strates anti-répétition, `{ decouverte, familiarite, recontextualisation }` — chacune `string \| null`, **null tant que l'écriture n'est pas faite** |
| `illustration` | string \| null | chemin d'asset — **null tant que l'image n'existe pas** (aucun placeholder) |
| `portrait_requis` | bool | créatures seulement en pratique : `true` pour les êtres à voir en face (~7 par zone), `false` pour les phénomènes |

Champs **optionnels**, présents uniquement quand ils s'appliquent :

| Champ | Où | Contenu |
|---|---|---|
| `gardien: true` + `etats: ["intact","balafre","rompu"]` | le gardien-jalon de la zone | mémoire persistante par joueur (spec « mémoire des gardiens ») : Intact → Balafré (revient marqué, seuil relevé sur le choix qui l'a tué) → Rompu (diminué, choix inédit d'Empathie) |
| `recurrent: true` | PNJ transverses (le Colporteur) | se souvient des runs précédentes, revient d'une zone/run à l'autre |

### Les strates (`textes`)

Système anti-répétition (fiche zone + spec) : `decouverte` = première visite ;
`familiarite` = revisites, version compressée ; `recontextualisation` =
relecture après un jalon (révélation, gardien vaincu…). L'écriture vient
après le gel — le JSON structure d'abord.

## Notes d'interprétation (Les Landes, à réappliquer aux zones suivantes)

- **Région englobante** : « Le Hameau des Renonçants » est un cadre pointillé
  qui contient six lieux orange. Il est compté comme un **lieu à part
  entière** (15e — les comptes Notion et mission ne tombent juste qu'ainsi,
  et des chips s'y attachent directement). Les lieux qu'il contient restent
  des entrées indépendantes ; l'appartenance géographique n'est pas encodée
  (proposer un champ `contenu_dans` si le besoin apparaît).
- **Objet attaché à une créature errante** (ex. la Dent de la Meute, collée à
  la Meute Grise, elle-même sans lieu) : `lieu_attache: null` — le lien à la
  créature se lit dans le nom et la note.


---

## `scenes[]` — ajouté le 27/07 (l'Atelier)

Collection introduite pour `tools/atelier.py`. Une entrée par écran de jeu,
points d'intérêt compris.

```jsonc
{
  "id": "chapelle-des-cordes",     // l'id RÉEL du jeu (scene-data.ts)
  "type": "arrivee",               // arrivee · moment · observe
  "nom": "La Chapelle des Cordes",  // libellé d'atelier, jamais montré au joueur
  "lieu": "chapelle_des_cordes",   // id d'un lieu de `lieux[]`, ou "horslieu"
  "parent": null,                  // pour un `observe` : la scène qui le porte
  "mene_a": ["chapelle-des-cordes-2"],
  "texte": ["…", "…"],             // un élément = un paragraphe affiché
  "description": "…",              // matière de production (quoi illustrer)
  "prompt_image": "…",             // recette Leonardo
  "illustration": "scene_chapelle_des_cordes_d.png"
}
```

⚠️ **`lieu` doit porter l'id RÉEL du lieu** (`chapelle_des_cordes`), pas une
clé courte. Une clé courte fait s'ouvrir chaque lieu vide dans l'atelier — la
carte ne retrouve aucun nœud. Erreur commise et corrigée le 27/07.

⚠️ **Le jeu ne lit pas ce fichier.** `texte` et `illustration` sont reportés
dans `aldenhar/lib/scene-data.ts` par l'atelier à chaque écriture ;
`description` et `prompt_image` restent ici, le jeu n'en a pas l'usage.
Regénérer la collection : `python3 tools/atelier_migrate.py` (idempotent —
les champs déjà remplis ici gagnent sur ceux du `.ts`).

---

## Zone EN CONCEPTION — ajouté le 12/09 (Les Salines)

Une zone dont `zone.statut` vaut `"conception"` est de la matière de production
transcrite depuis sa bible Notion **avant** qu'une carte ou une scène n'existe.
Les outils qui globbent `data/zones/*.json` la tolèrent (tous lisent avec des
défauts) et **`studio_data.py` l'exclut de l'export** : ses lieux n'entrent ni
dans le Graphe ni dans le kit tant qu'elle n'est pas gelée. Elle se contrôle
avec `python3 tools/verifier_zone.py data/zones/<zone>.json` (références,
doublons, forme des environnements).

Champs qui n'existent pas dans `landes.json` :

| Champ | Où | Contenu |
|---|---|---|
| `environnements[]` | racine | les étapes de la traversée à étages (`lib/etages.ts`) : `{ id, ordre, nom, sous_titre, jour, ratio_trame, plan, invariants[], histoire, entree, fin[], tirages:[min,max] }`. `entree` peut être `null` (on y débarque par le pool), `fin` liste les obligatoires joués APRÈS le pool, dans l'ordre |
| `fragments[]` | racine | les fragments du twist : `{ id, ordre, lieux[], eclaire_a[], texte_bible, acces, garanti, contrainte? }`. Un fragment est aussi déclaré par chaque lieu qui le porte (`lieux[].fragments`) — le contrôle exige les deux sens |
| `environnement` | lieu | l'id de l'étape qui le contient |
| `role` | lieu | `entree` · `pool` · `fin` — c'est ce que `prochainPas` lit. Depuis le tri du 13/09, trois rôles HORS traversée gardent la matière sans la jouer : `arrivee` (un beat d'arrivée d'environnement — le Fossé —, cité par `environnements[].arrivee`), `retire` (sorti du jeu), `fusionne` (absorbé par un autre lieu, `fusionne_dans`). Les trois portent une `raison` obligatoire, ne sont ni comptés ni tirables, et ne peuvent porter aucun fragment |
| `statut` | lieu | `obligatoire` (entrée ou fin d'une étape) · `candidat` (dans le pool) · `beat` / `retire` / `fusionne` (miroir des rôles hors traversée) |
| `campement` | lieu | `true` = on peut y dormir (la Guérite pour les Bassins, décision 13/09 ; le Dortoir ; l'Auberge) |
| `fragments_exclusifs` | lieu | deux fragments portés par le même lieu dont on ne lit qu'UN par passage (la Barge : F1 ou F4) — miroir `exclusif_avec` sur les deux fragments |
| `lieu_garanti` | fragment | le lieu obligatoire qui le rend lisible dans 100 % des parties (F2 aux Terrasses) |
| `usage_sur_place` | objet | l'objet se dépense là où on le trouve (le Battant, remis et sonné à la Rive haute) : le contrôle ne le signale plus comme promesse sans usage |
| `environnements[].arrivee` | racine | le lieu-beat joué en ENTRANT dans l'étape, avant le pool, sans crédit de lieu (`entree` reste `null`) |
| `zone.decisions` | racine | les arbitrages de Patrick, datés — ce que `a_decider` ne contient plus |
| `fragments` / `minijeux` / `combats` / `rencontres` / `objets` | lieu | ce que le lieu porte, par id (créatures pour `combats`, qui doivent être `hostile`) |
| `a_creuser` | lieu | la bible l'a marqué tel quel |
| `lieux[]` + `hostile` | créature | où elle se joue (un errant peut en avoir plusieurs), et si elle se combat |
| `type` · `descend` · `sert[]` | objet | `passif`/`actif` · descend à l'Acte II · lieux où il SERT (la bible : « se ramasse dans un lieu du pool et sert dans au moins deux autres ») |
| `memoire_de_gardien` | rencontre | les trois aspects Intact/Balafré/Rompu en mots |
| `zone.phrase_cle` · `zone.twist` · `zone.a_decider` · `zone.ecarts_de_transcription` | zone | la bible, telle quelle ; les écarts entre ses comptes annoncés et sa liste sont DITS là, jamais résolus en silence |

`histoire_bailli` garde son nom hérité des Landes : il veut dire « ◆ porte la
micro-histoire de la zone » (aux Salines : les Passeurs et l'accord avec le Ver).
`x`/`y` sont absents tant qu'aucune carte n'existe.
