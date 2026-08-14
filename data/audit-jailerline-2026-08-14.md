# `jailerLine` — audit avant toute décision de code

*14 août 2026. Demandé par Patrick : « 92 répliques écrites, aucun lecteur. Là,
je demande d'abord un audit. Surtout ne pas brancher les 92 lignes
automatiquement : ce serait le meilleur moyen de refaire exploser les
injections et le rythme. »*

**Aucune ligne de code n'a été écrite pour ce chantier.** Ce document constate,
mesure, et propose. Rien n'est branché, rien n'est supprimé.

---

## 1. L'inventaire exact

| | |
|---|---|
| Scènes du jeu | **89** |
| Scènes portant une `jailerLine` | **89** — soit **100 %** |
| Lignes de liaison (`LIAISON_JAILER`) | **6**, orphelines de la même façon |
| **Total de texte sans lecteur** | **95 répliques** |
| Longueur | 45 à 74 caractères (médiane 64) |

La couverture à 100 % n'est pas un hasard : le champ est déclaré
**obligatoire** (`jailerLine: string`, pas `?`). Toute scène nouvelle oblige
donc, aujourd'hui encore, à écrire une réplique qui ne sera jamais lue.

**Registre des 89 lignes :**

| Registre | Nombre | Exemple |
|---|---|---|
| Commentaire du lieu, à la 3ᵉ personne | 73 | *« Trois hommes qui tremblent devant un mort. Ils ont raison, remarque. »* |
| S'adresse directement au héros | 16 | *« Reste. Je ne perds jamais personne — je change de porte, c'est tout. »* |
| Statistique agrégée | 1 | *« Les Landes. 8 941 entrées cette saison. Les sorties : une autre page. »* |

Les longueurs sont déjà au format du bandeau (deux lignes maximum) : elles ont
été raccourcies avec les 100 autres textes du Geôlier le 11/08. Ce n'est donc
pas de la matière brute — c'est de la matière **finie**.

---

## 2. Pourquoi il n'y a pas de lecteur — ce n'est pas un oubli

C'est le point que le panel ne pouvait pas voir, et que je signale avant tout
le reste : **le débranchement est délibéré, daté, et motivé par une mesure.**
Le commentaire est encore dans `Scene.tsx`, à l'endroit exact où l'injection se
faisait :

> ⚠️ LE COMMENTAIRE AMBIANT DE SCÈNE EST RETIRÉ (arbitrage du 12/08).
> Vérifié avant de trancher : sur les 24 prises de parole des quatre vies
> enregistrées, 15 commentent un palier de Soupçon, 4 constatent une traversée
> sans risque, 2 raillent un jet critique — et **3 seulement** étaient ce
> tirage à 12 % sur une arrivée ordinaire. Le Geôlier n'était donc pas bavard :
> il était déjà événementiel à 21 sur 24. On ne coupe que ces trois-là, les
> seules qui ne répondaient à rien.

Autrement dit : la `jailerLine` était servie **au hasard, à 12 % par arrivée**,
et c'était le seul de ses canaux qui ne répondait à rien de ce que le joueur
venait de faire. Elle a été coupée pour cette raison précise.

Le grief du panel — « 92 lignes écrites, aucun lecteur » — décrit donc un
**canal débranché**, pas une négligence. Mais le panel avait raison sur un
point : rien dans le code ne le dit à qui lit `scene-data.ts`. Dix agents sur
dix l'ont pris pour un bug, et un onzième lecteur le reprendrait.

---

## 3. Ce que coûterait un rebranchement, chiffré

Le budget actuel du Geôlier, mesuré sur les quatre vies du 12/08 :
**~6 prises de parole par vie**, dont ~5 sur 6 événementielles (palier de
Soupçon, traversée sans risque, jet critique, prophétie, dé impossible).

Écrans porteurs d'une `jailerLine` réellement traversés dans une vie :

- 7 à 8 lieux tirés × ~2 écrans par lieu → **~15**
- séquence d'entrée du Hameau (5 beats) + halte (5 beats) → **~10**
- 7 à 8 liaisons, chacune avec sa ligne de `LIAISON_JAILER` → **~8**

Soit **~33 écrans porteurs par vie**.

| Si on rebranche… | Prises de parole / vie | Rapport à aujourd'hui |
|---|---|---|
| à 100 % | ~33 + 6 = **39** | **×6,5** |
| à 30 % | ~10 + 6 = **16** | ×2,7 |
| à 12 % (le réglage d'avant) | ~4 + 6 = **10** | ×1,7 |

**Et le rebranchement contournerait le budget d'injection.** Depuis le 12/08,
une arrivée ne sert qu'**UN seul rappel** (familiarité, mémoire d'un PNJ,
réaction, perception, mode d'arrivée passent par un collecteur qui n'en laisse
passer qu'un). Le Geôlier, lui, est classé **événement** — il ne passe pas par
le collecteur. Le rebrancher à l'arrivée ajouterait donc un bloc **par-dessus**
le rappel déjà servi, à chaque lieu : exactement le mur de texte que ce budget
a été construit pour démonter. C'est le risque que Patrick a nommé, et il est
réel.

---

## 4. Le vrai défaut qui reste, et il n'est pas celui qu'on croit

Ce n'est pas « 95 lignes ne se jouent pas ». C'est :

1. **Le champ est obligatoire.** Chaque scène écrite depuis le 12/08 a coûté
   une réplique du Geôlier livrée morte. C'est du travail d'écriture facturé
   sans contrepartie, et ça continue.
2. **Le code ment au lecteur.** Un champ peuplé à 100 % et lu à 0 % se lit
   comme un bug pour tout le monde — humains et agents. Il a déjà produit un
   faux grief de panel ; il en produira d'autres.
3. **`LIAISON_JAILER` est mort en silence.** Ses 6 lignes ne sont mentionnées
   nulle part comme débranchées : elles sont tombées avec le champ, sans que
   personne le note. C'est la classe de défaut que ce projet traque depuis le
   5/08 (« un effet promis que rien ne lit »).

---

## 5. Trois voies, et ma recommandation

### Voie A — assumer le débranchement, proprement *(recommandée)*
Rendre le champ **optionnel** (`jailerLine?`), archiver les 95 lignes dans
`data/archive-geolier-lieux.md` à destination du Codex (la règle du plan
d'élagage : rien ne se supprime de la production), et écrire au-dessus du champ
pourquoi il n'a pas de lecteur.

- **Coût** : une heure. Aucun risque de rythme.
- **Gain** : plus une seule réplique morte à écrire, et le code cesse de mentir.
- **Perte** : 95 textes finis restent inemployés — mais ils le sont déjà.

### Voie B — rebrancher sur un ÉVÉNEMENT, jamais sur une arrivée
Le Geôlier ne reprend la parole sur un lieu que quand le lieu vient de faire
quelque chose : **la première fois qu'on entre dans un lieu où l'on est déjà
mort**, **le lieu d'une dette qui vient d'échoir**, **le lieu d'un Sceau
reconnu**. Trois déclencheurs, au plus **un par vie**, et la ligne passe par le
collecteur de rappels comme les autres — donc elle *prend* la place, elle ne
s'ajoute pas.

- **Coût** : une demi-journée, plus le tri des 89 lignes (la plupart sont des
  commentaires d'ambiance, pas des réactions à un événement — il faudrait en
  réécrire une poignée).
- **Gain** : le canal revit sans toucher au rythme (+1 prise de parole par vie).
- **Risque** : faible, et mesurable avant déploiement.

### Voie C — rebrancher au tirage, à taux réduit
Ce qui a été coupé le 12/08, avec un chiffre plus bas. **À écarter** : la
mesure qui a motivé la coupe disait que ces lignes ne répondaient à rien, et
baisser un taux ne change pas ça. On ne remettrait pas moins de bruit, on
remettrait le même bruit, plus rarement.

**Ma recommandation : A maintenant, B plus tard si Patrick veut ce canal.**
A ferme le défaut réel (le champ obligatoire, le code qui ment) sans engager
une décision de rythme. B est un chantier de contenu, à ouvrir quand la boucle
élaguée aura été validée en playtest — pas avant, par la règle de gel.

---

## 6. Ce que cet audit ne tranche pas

- **Le tri éditorial des 89 lignes** : combien sont réutilisables telles quelles
  si la voie B est choisie ? Je ne l'ai pas fait — ça se décide en les lisant
  avec l'intention en tête, et l'intention n'est pas arrêtée.
- **Le Codex** (phase E) : si le Codex accueille ces lignes, il faut savoir
  sous quelle forme (une par lieu ? débloquées à la visite ?). C'est une
  spécification à faire avec Patrick, pas une déduction.
