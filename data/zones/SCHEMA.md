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
| `statut` | string | `"gelee"` (contenu et carte figés) ou `"conception"` |
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
