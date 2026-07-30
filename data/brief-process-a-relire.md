# PACTUM — comment je travaille aujourd'hui, et ce que j'aimerais qu'on challenge

> Document à donner à une personne ou à une IA pour un **second avis**.
> Il décrit un process réel, en production, avec ses chiffres. Il ne cherche pas
> à le défendre : je veux savoir si je peux l'optimiser, ou s'il faut le penser
> complètement autrement.
>
> Rédigé le 30/07/2026. Tous les chiffres sont mesurés, pas estimés.

---

## 1. Le projet en cinq lignes

**PACTUM** est un livre-jeu mobile dark fantasy (permadeath, choix + dé, une
zone jouable : « Les Landes »). C'est une **PWA en export statique Next.js**,
déployée sur **GitHub Pages**. Pas de backend, pas de base de données, pas de
serveur : le jeu est un dossier de fichiers statiques.

Chaque écran de jeu affiche **une illustration** en haut, du texte au milieu,
et 3 boutons de choix en bas. L'illustration est un **PNG tramé en 2 couleurs**
(dithering Floyd-Steinberg, charbon `#1c1a16` + orange `#e0632a`), 1000×1000.

**État actuel** : 60 scènes, 38 points d'intérêt (des sous-écrans d'examen),
187 fichiers dans `assets/` pour **4,3 Mo au total** — moyenne 23 Ko par image.
Ces images sont minuscules. Ce n'est **pas** un problème de stockage.

---

## 2. Qui fait quoi — la contrainte qui structure tout

C'est le point le plus important pour comprendre le reste.

- **Je ne code pas.** Je ne lis pas le code du jeu, et je n'ai pas envie
  d'apprendre à le lire. Mon travail, c'est le **jugement** : est-ce que cette
  image marche, est-ce que ce texte sonne juste, est-ce que cet écran est
  lisible.
- **L'exécution est faite par une IA** (Claude Code), qui a accès au dépôt et
  travaille dans un **environnement distant éphémère** (conteneur cloud, pas ma
  machine).
- **Je n'ai pas de clone du dépôt sur mon Mac.** Pas de terminal, pas de git en
  local. Je travaille depuis un navigateur et depuis Google Drive.
- Mes outils à moi : **Figma** (maquettes d'écran), **Notion** (le journal des
  décisions de design), **Leonardo.ai** (génération d'images), **Google Drive**
  (stockage des images), et **des pages web publiées** que l'IA me construit
  pour que je puisse voir l'état du projet.

Autrement dit : **je décide, l'IA exécute**. Tout outil qui me demande de
manipuler des fichiers, de lancer une commande ou d'éditer du code est, par
construction, un mauvais outil pour moi.

---

## 3. Le pipeline des images, tel qu'il tourne aujourd'hui

```
  Leonardo.ai                       (moi, navigateur)
      │  je génère 10 à 30 images pour un lot
      ▼
  script de dithering               (une commande, lancée par l'IA)
      │  recadrage carré → 1000×1000 → Floyd-Steinberg 2 couleurs
      │  → rangement automatique par préfixe de nom
      ▼
  Google Drive  /Photos/01_En attente/{1_Rencontres,2_Environnement,3_Objets}
      │  je regarde, je trie, je valide
      ▼
  Google Drive  /Photos/03_Validé/…   (moi, à la main)
      │
      ▼
  l'IA rapatrie les fichiers          ⚠️ LE GOULOT — voir §5
      │  via un connecteur Google Drive
      ▼
  aldenhar/public/assets/nom_du_fichier.png   (dans le dépôt git)
      │
      ▼
  l'IA câble l'image à une scène      ⚠️ FAIT À LA MAIN, dans le code
      │  → champ `illustration` d'un objet TypeScript
      ▼
  build + déploiement sur GitHub Pages
      │
      ▼
  je regarde le jeu et les pages d'outillage, et je redonne mon avis
```

**Convention de nommage** : `{categorie}_{sujet}_{variante}.png`, avec
`scene_` (88 fichiers), `monstre_` (51), `objet_` (34). La variante est une
lettre (`_a`, `_b`, `_c`…) sans signification, juste le tirage retenu.

---

## 4. Comment une scène « connaît » son image, et le problème de fond

Le contenu du jeu vit dans **un gros fichier TypeScript** (`scene-data.ts`,
4 195 lignes). Une scène ressemble à ça, en simplifié :

```ts
{
  id: "colline-aux-gibets",
  illustration: "assets/scene_colline_aux_gibets_c.png",
  narration: [ "…deux paragraphes de texte…" ],
  pointsInteret: [ { id: "potences-cercle", label: "…", illustration: "…" } ],
  choices: [
    { id: "…", label: "Monter au sommet",
      risky: { stat: "COURAGE", threshold: 12, outcomes: outcomes(…) } },
    { id: "…", label: "Contourner", passive: { consequence: "…" } },
  ],
}
```

Il existe **en parallèle** un fichier `data/zones/landes.json` (2 571 lignes)
qui contient les mêmes scènes, mais **seulement la narration, les images et le
graphe de navigation — aucune mécanique de jeu** (pas de choix, pas de seuils,
pas d'issues de dé). C'est ce JSON que lisent mes pages d'outillage.

**Conséquence directe : je ne peux voir mes actions/choix nulle part sauf dans
le code.** Mes pages me montrent les images et les textes ; les choix, les
seuils de difficulté et les conséquences sont invisibles pour moi. C'est ma
plus grosse frustration après les images.

*(Un audit récent a vérifié que les deux fichiers sont parfaitement en phase :
0 écart d'identifiant, 0 écart de texte, 0 écart d'image. Le problème est
structurel — deux fichiers à tenir à jour — pas un problème de divergence
actuelle.)*

---

## 5. Les points de friction, mesurés

### a) Le transfert Drive → dépôt : le vrai goulot

L'IA rapatrie chaque image via un connecteur Google Drive qui **fait transiter
le fichier encodé en base64 dans son contexte**. Coût mesuré : **8 000 à
10 000 tokens par PNG de 23 Ko**. Un lot de 30 images ≈ 250 000 tokens, soit
une session entière de travail mobilisée juste pour copier des fichiers.

Conséquences observées : les lots arrivent par tranches sur plusieurs jours ;
une fois, un fichier corrompu à la source n'a été détecté qu'après trois
tentatives ; l'IA a dû écrire des scripts de vérification (signature PNG +
taille exacte) pour que ce soit fiable.

Piste identifiée mais pas encore essayée : **github.com accepte le
glisser-déposer de plusieurs fichiers** dans un dossier du dépôt, depuis le
navigateur, sans terminal ni clone. Ça mettrait le coût à zéro.

### b) Le câblage image → scène : entièrement manuel

Rien ne relie automatiquement `scene_colline_aux_gibets_c.png` à la scène
`colline-aux-gibets`. C'est l'IA qui écrit la ligne à la main, dans le code,
image par image. Quand un lot arrive avec des noms qui ne correspondent pas
exactement à un identifiant de scène, il faut décider au cas par cas.

Une tentative de câblage « par heuristique » a déjà **écrasé des images
correctes** ; depuis, on passe par un manifeste explicite écrit à la main.

### c) Les images qui ne se mettaient pas à jour (résolu cette semaine)

Plusieurs PNG ont changé de **contenu sous le même nom**. Rien dans l'URL ne le
signalait, donc ni le navigateur ni le service worker de la PWA n'allaient
rechercher l'image : je continuais de voir l'ancienne, sur le jeu **et** sur mes
pages d'outillage (le service worker a pour portée tout le site, y compris ces
pages — son cache est servi avant le réseau).

**Réglé** : un script génère un manifeste avec le hash du contenu de chaque
fichier, et chaque image porte ce hash dans son URL (`x.png?v=a3f2b9c1`). Une
image modifiée change d'URL, donc aucun cache ne peut plus mentir. Le hash est
aussi affiché sur chaque vignette, ce qui révèle les réemplois. **Inutile de me
re-proposer cette partie, elle est faite.**

### d) L'inventaire réel, maintenant visible

- **187 fichiers**, dont **34 orphelins** — présents sur le disque, utilisés par
  aucune scène. Certains attendent une scène pas encore écrite, d'autres sont
  probablement morts. Je ne sais pas les distinguer.
- **15 cartes partagent une image avec au moins une autre** (par exemple un
  portrait servi par 3 écrans différents). Certains réemplois sont voulus,
  d'autres sont des oublis.
- **17 scènes n'ont pas encore de prompt de génération écrit.**

---

## 6. Ce que j'ai déjà comme outils

Trois pages web, publiées à côté du jeu, que l'IA regénère à chaque
déploiement :

1. **Une page « couverture visuelle »** — une carte par scène et par point
   d'intérêt, avec sa vignette, son statut (image dédiée / héritée d'une autre
   scène / générique / manquante), le hash du fichier, et un bouton « à
   remplacer » que je clique. Mes marquages sont stockés dans le navigateur, et
   un bouton « copier ma liste » me sort un texte que je colle à l'IA.
2. **Un « atelier »** — une carte géographique de la zone, les lieux placés à
   la main, les scènes reliées entre elles, avec les vignettes.
3. **Le jeu lui-même**, avec un numéro de version affiché pour vérifier d'un
   coup d'œil qu'un déploiement a bien pris.

Ces pages sont **en lecture seule quand elles sont publiées** (une page web ne
peut pas écrire dans un dépôt git). Une version locale permet l'édition, mais
elle demande un terminal — donc pas pour moi.

---

## 7. Ce sur quoi je veux un avis

Je ne cherche pas une validation. Je cherche des angles auxquels je n'ai pas
pensé. En particulier :

### Q1 — Le modèle « une image câblée à la main par scène » est-il le bon ?

Alternative évidente que je n'ai pas testée : **une convention de nommage
stricte** où l'image se déduit de l'identifiant de la scène
(`colline-aux-gibets` → `scene_colline_aux_gibets.png`), ce qui supprimerait
tout câblage. Qu'est-ce que ça coûterait ? Est-ce que ça tient quand une scène a
plusieurs états, ou quand deux scènes partagent volontairement une image ?

### Q2 — Où devrait vivre le contenu ?

Aujourd'hui : dans un fichier de code de 4 195 lignes, plus un miroir JSON
partiel. Est-ce que ça devrait être une **base Notion**, un **tableur**, un
**CMS headless**, un **dossier de fichiers Markdown** ? Sachant que : le jeu est
un export statique sans backend, que je ne code pas, et que la mécanique
(seuils de dé, issues, conséquences) est riche et typée.

### Q3 — Comment je vois mes scènes ET mes actions ?

C'est mon vrai manque. Je voudrais une vue d'ensemble où je vois, pour chaque
scène : l'image, le texte, **les 3 choix**, leur type (dé / verrouillé / sans
risque), leur difficulté, et où ils mènent. Aujourd'hui je ne vois que l'image
et le texte. Quelle est la bonne forme pour ça — un tableau ? un graphe ? une
fiche par scène ? Et surtout : d'où viendraient les données, vu §4 ?

### Q4 — Le transfert des images

Est-ce qu'il existe mieux que « Drive → connecteur coûteux → dépôt » ? Le
glisser-déposer GitHub est-il la bonne réponse, ou est-ce qu'il y a un chemin
plus propre — une action automatisée qui surveille un dossier Drive, un
stockage d'images séparé du dépôt (et lequel), autre chose ?

Contraintes à respecter dans la réponse : **je ne veux pas de terminal**, je
veux garder **l'historique des versions d'images** (savoir qu'une image a été
remplacée), et si possible **rester gratuit** (projet solo).

### Q5 — Est-ce que git est le bon endroit pour 187 PNG ?

4,3 Mo d'images, plus 32 Mo de musique, dans un dépôt de 80 Mo. Ça marche
aujourd'hui. Est-ce que ça tient à 500 images et 5 zones ? Faut-il séparer les
médias du code, et si oui comment sans compliquer mon quotidien ?

### Q6 — Le point aveugle

Qu'est-ce que je n'ai pas vu ? Y a-t-il une manière complètement différente de
monter ce pipeline — par exemple générer les images à la demande, ou renoncer à
l'illustration par scène, ou inverser le rapport texte/image — qui rendrait la
moitié de ces questions caduques ?

---

## 8. Options déjà écartées, et pourquoi

Pour ne pas vous les faire re-proposer :

| Option | Pourquoi écartée |
|---|---|
| Base44 / no-code | Vendor lock-in, pas de code custom possible |
| Génération d'image par IA en direct, à chaque scène | Casse la direction artistique (dithering 2 couleurs), coût, latence, non reproductible |
| Hash dans l'URL des images | **Fait cette semaine**, réglé |
| Page d'outillage qui écrit dans le dépôt | Impossible depuis un navigateur (sécurité), et je ne veux pas éditer moi-même |
| Rééchantillonner les images pour alléger les pages | Tue l'usage : j'ai besoin de voir le grain réel pour juger |

---

## 9. Résumé pour qui lit vite

Un solo dev **non codeur** pilote une IA qui écrit tout le code. Le contenu du
jeu (60 scènes, textes, choix, dés) vit dans un fichier de code ; les images
(187 PNG minuscules, tramés 2 couleurs) vivent dans le même dépôt et sont
reliées aux scènes **à la main**. Le contrôle qualité passe par des pages web
publiées, en lecture seule. Les deux frictions principales sont le **coût de
transfert des images** depuis Google Drive (8-10 k tokens par fichier) et
**l'impossibilité de voir la mécanique de jeu** (choix, difficultés, issues)
autrement que dans le code.

**La question centrale : est-ce que ce pipeline est optimisable à la marge, ou
est-ce qu'il faut le repenser entièrement ?**
