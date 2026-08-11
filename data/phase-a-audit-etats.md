# Phase A — audit de dépendances du moteur d'états (11 août 2026)

Précondition exigée par le plan d'élagage avant toute suppression : *identifier
la fonction utile de chaque état → la remplacer → supprimer l'état*. Jamais en
une passe. Voici les pièces.

## Ce que l'audit change dans l'idée qu'on s'en faisait

**Le système est beaucoup moins tissé qu'il n'en a l'air.** Sur les 230 choix
de la zone, **8 posent un état** et **4 en dépendent**. Le gros du moteur ne
sert donc pas à brancher du contenu : il sert à faire vivre le contenu de
`lib/etats.ts` lui-même (7 manifestations, 7 guérisons, ~53 lignes de réaction
du monde). C'est une bonne nouvelle pour le démontage — et une mauvaise pour
le bilan coût/bénéfice du système, qui confirme l'intuition du mémo.

**Deux effets sont morts** — déclarés, jamais posés sur un état, jamais lus :
`soupconParJour` et `amortitCritique`. Ils ne figurent que dans le garde
`auditEtats`, qui les compte comme des preuves qu'un état « modifie le jeu » :
le garde pouvait donc valider un état sur un effet inexistant.
*(`seuilTous` semblait mort au premier passage : il est bien lu, via
`seuilEtats()`. `exclusiveGroup` n'existe pas — le champ s'appelle `groupe`.
Vérifié avant d'écrire ; un « effet mort » annoncé à tort serait pire que le
défaut.)*

**⚠️ Piège de démontage : `"marque"` désigne DEUX choses.** Un **état** (posé
par le vol, double la montée du Soupçon) et une **dette de relique**
(`dette: "marque"` sur deux reliques, +1 Soupçon au départ de la vie, lue par
`dettePortee === "marque"`). Les deux ne se croisent jamais dans le code, mais
un remplacement global sur `"marque"` casserait silencieusement les reliques.

## L'inventaire, état par état

| État | Sa fonction RÉELLE dans le jeu | Ce qui le pose | Remplacement |
|---|---|---|---|
| **ENTAILLÉ** (canal hérité) | la blessure : érosion visible, soin au camp, soin par objet | combat perdu, malédiction physique | devient **BLESSÉ**, l'unique état du corps — rien à écrire, il l'est déjà de fait |
| **FIÉVREUX** | seul porteur de `usureParJour` (mange une part du repos) et de `seuilTous` | échéance du besoin « soigner » | **à trancher avec le sort des Besoins** — c'est leur seule manifestation |
| **BOITEUX** | fermait les choix de fuite (`cacheFuite`, 3 choix tagués) | plus AUCUNE source depuis le 11/08 | suppression sèche — il ne peut plus s'attraper |
| **AFFAMÉ** | ouvre « Prendre sans demander » (2 scènes) | échéance du besoin « manger » | flag `a_faim`, posé par le besoin, lu par les 2 scènes |
| **MARQUÉ** | double la montée du Soupçon (`soupconDouble`) | le vol (1 choix) | flag `marque_de_vol` — ⚠️ ne pas confondre avec la dette de relique |
| **FIXÉ** | ouvre la confidence des Fixés ; pilier du procès et du regard du village | Soupçon ≥ 4, à l'arrivée au village | flag `fixe_par_le_village` — **garde sa carte à l'écran**, elle fonctionne |
| **HANTÉ** | insère des lignes intruses génériques (`lignesIntruses`) | échec surnaturel simple | **des flags PRÉCIS par source** (`a_vu_le_pendu_bouger`…) lus par deux ou trois scènes nommées — c'est l'exemple du mémo, et c'est plus PACTUM |
| **ACCOMPAGNE** (le Gamin) | compagnon temporaire : expire en 2 lieux, fuit le combat, rouvre la route | une rencontre optionnelle | ce n'est pas un état générique : flag `compagnon_gamin` + expiration |
| AGUERRI / ÉBRANLÉ | simples modificateurs 2-3 scènes, hors moteur de faits | victoire/échec de combat | à trancher : garder comme modificateurs, ou couper |

## Les systèmes accrochés, par coût de démontage

- **Le moteur de faits** (`lib/faits.ts`) — il ne sert PAS qu'aux états
  (découvertes, savoirs, compteurs, sceaux y vivent aussi). Il reste ; seule
  la nature `state` le quitte.
- **Les Besoins** (`lib/besoins.ts`) — ils n'ont d'existence VISIBLE que par
  l'état qu'ils finissent par poser. Les états partant, soit les besoins
  posent des flags, soit ils partent avec. **Décision de design.**
- **L'interface** : la carte d'état, le volet, l'écran Essence et le popup
  « rangé dans le menu » lisent tous la fiche de l'état. Ils survivent si les
  flags portent un nom et une phrase — sinon ils n'ont plus rien à montrer.
- **Le garde de build** `etats.mjs` disparaît avec le système (et son critère
  de couverture était partiellement faux, cf. les deux effets morts).

## Ce que je recommande

Démonter dans cet ordre, du plus mort au plus vivant, en déployant après
chaque cran : **BOITEUX** (aucune source, suppression sèche) → **AFFAMÉ** et
**MARQUÉ** (un flag, deux lecteurs chacun) → **HANTÉ** (le seul qui demande
d'écrire : ses lignes génériques deviennent des flags par source) →
**ENTAILLÉ → BLESSÉ** (renommage de fond) → **FIXÉ** en dernier, parce qu'il
porte le procès.

## Les deux décisions qui te reviennent

1. **Le sort des Besoins.** Ils ne se manifestent que par un état. Trois
   voies : (a) ils posent des flags et survivent tels quels ; (b) ils partent
   avec les états, et la faim/la fatigue redeviennent du texte de scène ;
   (c) ils fusionnent dans BLESSÉ (dormir et manger soignent, ne pas le faire
   abîme). Ma préférence : **(b)** — c'est le seul chemin qui allège vraiment,
   et le mémo dit qu'une scène peut faire ressentir la faim sans créer un
   statut.
2. **La santé : continue ou discrétisée ?** Le §17 demandait Intact / Blessé /
   Mort. Le joueur, lui, ne lit DÉJÀ que des paliers (l'érosion du cadre en a
   quatre). Ma préférence : **garder la santé continue à l'intérieur, ne
   jamais l'exposer qu'en paliers** — discrétiser à trois valeurs supprimerait
   la granularité des quatre coûts par palier de dé, qui est ce qui rend les
   combats mémorables.
