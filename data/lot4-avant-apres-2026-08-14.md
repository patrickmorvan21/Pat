# Lot 4 — les formulations qui expliquaient la mécanique

Cadrage du 14/08 : passe **éditoriale et ciblée**, pas une réécriture générale.
Audit outillé par `tools/mecanique.py` (non branché dans `prebuild` : le
vocabulaire mécanique est parfois légitime — le tutoriel enseigne, le Geôlier
est le seul à voir les chiffres, une métaphore peut emprunter le mot).

**Périmètre audité** : les 18 sources dont la prose s'affiche PENDANT la run.
Les archives, la matière de production (`data/zones/*.json`, `scene-meta.json`)
et les champs de documentation du Studio en sont exclus par construction.

**Résultat : 17 lignes suspectes → 8 réécrites, 7 gardées, 2 faux positifs.**

---

## RÉÉCRIT (8)

| # | Où | AVANT | APRÈS |
|---|---|---|---|
| 1 | `besace.ts` — flavor de la dague de départ | Elle a déjà servi. Elle servira encore. **Ta main s'en trouve plus sûre au combat.** | Elle a déjà servi. Elle servira encore. **Le manche garde la forme d'une main.** |
| 2 | `besace.ts` — `usageEnMots`, passif de combat | **Tant que tu la portes, tu t'en sors mieux quand il faut se battre.** | **Le poids tombe juste dans la main quand il faut faire vite.** |
| 3 | `besace.ts` — `usageEnMots`, passif permanent | **Tant que tu le portes, tout te vient un peu plus facilement.** | **Tu le portes sans y penser, et tu hésites moins qu'avant.** |
| 4 | `Scene.tsx` — carte d'état, BLESSURE | La blessure **ralentit chaque geste, tant qu'elle n'est pas soignée.** | **Quand tu poses le pied, la douleur remonte jusqu'à la hanche.** |
| 5 | `Scene.tsx` — carte d'état, AGUERRI | Le combat t'a affûté : **tes gestes portent mieux, pour un temps.** | **Ta main ne tremble plus. Elle sait ce qu'elle vient de faire.** |
| 6 | `Scene.tsx` — carte d'état, ÉBRANLÉ | Le choc te suit : **tes gestes hésitent, pour un temps.** | **Tu sursautes à un bruit qui ne t'aurait rien fait.** |
| 7 | `Scene.tsx` — carte + volet, effet favorable générique | **Il joue pour toi : tes gestes portent un peu mieux, pour un temps.** | **Quelque chose est avec toi. Tu le sens à ta façon d'avancer.** |
| 8 | `Scene.tsx` — carte + volet, effet défavorable générique | **Il joue contre toi : tes gestes portent un peu moins bien, tant qu'il tient.** | **Quelque chose te retient. Tu le sens à ta façon d'avancer.** |

**Toutes sont plus courtes ou égales** (mesuré : 80→76 · 66→59 · 60→57 ·
66→61 · 63→61 · 53→50 · 66→60 · 76→58 caractères). Aucune scène ne gagne un
écran, un tap ni un bloc : ce sont des remplacements sur place.

Ce que chacune retire : le NOM de l'effet, sa DURÉE, et la promesse de
facilité. Ce que le monde montre déjà à leur place — l'Anneau (un passif et un
état entrent dans le seuil, donc dans le nombre d'encoches pleines), l'érosion
du cadre, et la scène suivante.

---

## GARDÉ (7)

| Où | Ligne | Pourquoi |
|---|---|---|
| `Scene.tsx` — popup | « Ton état est rangé dans le menu. » | Affordance d'UI : elle dit OÙ consulter, pas ce que l'état fait. Vue une fois par compte. |
| `jailer-quotes.ts` | « La deuxième est plus facile. Pas moins douloureuse — plus facile. » | Le Geôlier parle de la MORT, pas du moteur. Métaphore diégétique — la catégorie « à ne pas toucher » du cadrage. |
| `scene-data.ts` ×2 | « Un jet parfait. Ne t'y habitue pas. » · « Le sommet du dé. Souviens-t'en… » | Le Geôlier est le seul personnage qui voit les dés : c'est sa voix, établie depuis le 5/08. |
| `besace.ts` ×2 | « À garder pour un mauvais jour : referme une plaie qui dure, et rend des forces. Une seule fois. » | Un ACTIF décrit une action DISPONIBLE. Rien dans le monde ne l'a montrée avant l'usage — la retirer rendrait l'objet indécidable (règle du 12/08 : « un objet muet sur son usage est un objet qu'on ne sort jamais »). |
| `scene-data.ts` | « …le maximum qu'on puisse obtenir d'un homme dans cet état. » | Français courant. Faux positif du motif. |

---

## FAUX POSITIFS d'outil, corrigés dans l'outil

- **« seuil »** retiré des motifs : dans ce jeu le mot désigne presque toujours
  une PIERRE DE PORTE (« couché contre le seuil », « Le Seuil du Hameau », le
  prologue). Le chercher rendait 30 signalements pour zéro trouvaille — même
  piège d'homonyme que « porte » dans `immersion.py` le 10/08.
- **`surprises.ts`** : ses champs `contexte` / `garde` sont de la documentation
  affichée dans le Studio, jamais en run. Exclus.

---

## HORS LOT 4 — la règle verrouillée par Patrick sur le Lot 3

> « Préparé ne doit pas signifier échec sans conséquence. »

Les cinq échecs préparés relus un par un. Quatre ratent clairement leur
objectif (la montée perdue, la liste cassée, le chien qui se jette, le
demi-cercle qui se referme d'un pas). **Le cinquième se lisait comme un gain** :
à la Meute, l'échec dispersait la meute et la dernière phrase n'énonçait aucune
perte.

| Où | AVANT | APRÈS |
|---|---|---|
| `repondre-voix`, ÉCHEC | …et le demi-cercle se défait autour de la querelle. **Tu n'y es pour rien, et tu n'y es pas.** | …et le demi-cercle se défait autour de la querelle. **Tu passes pendant qu'ils règlent ça entre eux. Aucun ne t'a répondu.** |

L'objectif du jet était d'être RECONNU par la meute. La clôture de la rencontre
est conservée (règle éditoriale du 14/07 : le dernier acte d'une rencontre doit
clore le combat dans chacune de ses issues) ; ce qui est rendu, c'est la perte —
personne ne t'a répondu, et c'était tout l'enjeu.

Aucun seuil, aucun coût, aucune probabilité n'a été touché dans ce lot.
