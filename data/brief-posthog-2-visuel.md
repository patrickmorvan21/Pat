# Brief 2 — rendre le tableau de bord PACTUM démo VISUEL

Suite du premier brief (`brief-posthog-pour-session-locale.md`). Le dashboard
existe : https://eu.posthog.com/project/271370/dashboard/945819. Retour de
Patrick : « il n'y a pas plus simple de voir visuellement ces stats ? je ne
vois pas les réponses du questionnaire ».

Diagnostic : les 13 tuiles sont des requêtes **SQL**, et une tuile SQL est un
TABLEAU, jamais un graphique. Les réponses du questionnaire y sont (moyennes
sur un seul répondant), mais un tableau d'une ligne de moyennes ne se lit pas
comme des réponses. Ce brief remplace les tableaux par des **barres**.

## Règle générale

Tout ce qui est une distribution (une réponse, un palier, un écran) se fait en
**New insight → Trends** :
- Série : l'événement (ex. `avis_envoye`), agrégation **Total count**.
- **Breakdown by** → *Event property* → la propriété (ex. `relancer`).
- Onglet d'affichage : **Bar chart** (pas « Line »), valeur **Total** (pas
  « over time ») — sinon PostHog découpe par jour et tout paraît vide.
- Période : **All time** (le défaut « Last 7 days » vide les tuiles dès que
  les tests datent de plus d'une semaine — c'est sans doute aussi pourquoi
  l'entonnoir paraissait blanc).
- Save avec le nom indiqué, Add to dashboard → `PACTUM démo`.

Aucun SQL dans ce brief sauf UNE table (§2), volontairement.

## 1. Le questionnaire — huit barres, une par question

Supprimer les tuiles `Avis — moyennes`, `Avis — texte / difficulté / habitué`,
`Avis — moments` du dashboard (les garder comme insights si tu veux, mais hors
dashboard). Créer huit insights Trends sur `avis_envoye`, breakdown par :

| Nom de l'insight | propriété |
|---|---|
| `Avis · envie de relancer (1-5)` | `relancer` |
| `Avis · compréhension (1-5)` | `comprehension` |
| `Avis · quantité de texte` | `texte` |
| `Avis · difficulté` | `difficulte` |
| `Avis · le dé (1-5)` | `de` |
| `Avis · meilleur moment` | `meilleur` |
| `Avis · moment confus` | `confus` |
| `Avis · habitué du genre` | `habitue` |

Sur le dashboard, les ranger sur deux rangées de quatre, petites tuiles.
Avec un seul avis chaque graphique n'a qu'une barre : c'est normal, il se
remplira avec les testeurs.

## 2. Le questionnaire — une ligne par réponse (la seule table)

Garder `Avis — champ libre` mais la remplacer par ceci, qui montre TOUTES les
réponses de chaque personne (pas seulement celles qui ont écrit un mot) :

```sql
SELECT toDateTime(timestamp) AS quand,
  properties.relancer AS relancer, properties.comprehension AS comprehension,
  properties.texte AS texte, properties.difficulte AS difficulte,
  properties.de AS de, properties.meilleur AS meilleur, properties.confus AS confus,
  properties.habitue AS habitue, properties.libre AS libre,
  properties.appareil AS appareil, properties.source AS source, properties.duree_s AS duree_s
FROM events WHERE event = 'avis_envoye'
ORDER BY timestamp DESC
```

Nom : `Avis · toutes les réponses`. C'est là que Patrick lira « ce que chaque
testeur a dit », colonne par colonne.

## 3. Les autres distributions, en barres aussi

Même recette Trends + breakdown + Bar + Total + All time :

| Nom | événement | breakdown |
|---|---|---|
| `Dé · paliers` | `de_lance` | `palier` |
| `Dé · réussi ou non` | `de_lance` | `reussi` |
| `Abandons · par écran` | `app_masquee` | `ecran` (limiter à 25 valeurs) |
| `Lieux · fréquentation` | `lieu_atteint` | `lieu` |
| `Morts · causes` | `mort` | `cause` |
| `Parties · mode` | `partie_commencee` | `mode` |

Supprimer les tuiles SQL correspondantes du dashboard. Garder en SQL :
`Joueurs — résumé par personne` (c'est une table par nature) et `Choix — les
plus pris` (40 lignes, illisible en barres).

## 4. L'entonnoir

Rouvrir `Entonnoir — de l'accueil à la fin de vie` en tant qu'insight (pas
depuis la tuile) et vérifier deux réglages : période **All time**, et
**Conversion window 1 day**. Si le graphique s'affiche dans l'insight mais pas
sur la tuile, ré-ajouter l'insight au dashboard (retirer la tuile, Add to
dashboard à nouveau). Si la tuile reste blanche, garder la table SQL
« personnes par étape » déjà faite et le dire — ne pas passer plus de dix
minutes dessus.

## 5. Vue « en un coup d'œil » — trois chiffres en haut

Trois insights **Trends** sans breakdown, affichage **Number** (« Total
value »), pleine largeur en tête de dashboard :
- `Joueurs uniques` : événement `accueil_vu`, agrégation **Unique users**.
- `Avis reçus` : `avis_envoye`, Total count.
- `Fins de vie` : deux séries, `mort` et `descente_franchie`, Total count.

## Ordre final du dashboard

1. Les trois chiffres.
2. L'entonnoir (pleine largeur).
3. Les huit barres du questionnaire (2 × 4).
4. `Avis · toutes les réponses`.
5. Dé · paliers, Dé · réussi, Abandons, Lieux, Morts, Parties (2 rangées).
6. `Joueurs — résumé par personne`, `Choix — les plus pris`.

## Garde-fous (inchangés)

Ne toucher à aucun réglage du projet, pas de clé API, pas de partage public
du dashboard, pas de suppression d'événements ni de personnes.

## Rapport attendu

Court : la liste des tuiles remplacées, celles qui rendent un graphique et
celles qui restent vides, ce que montre `Avis · toutes les réponses` (la ligne
de Patrick doit y être avec ses huit valeurs et « Test 1 »), et si
l'entonnoir s'affiche enfin.
