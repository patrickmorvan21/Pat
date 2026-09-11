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

## 6. Les MOYENNES de partie (demande Patrick, 11/09)

Deux chemins, l'un sans SQL, l'autre avec.

### 6.1 Sans SQL — une moyenne = un grand chiffre

**New insight → Trends**, série sur l'événement, puis dans le sélecteur
d'agrégation choisir **Average of property value** et la propriété voulue.
Affichage **Number**. Exemples utiles :

| Nom | événement | moyenne de |
|---|---|---|
| `Dé · résultat moyen` | `de_lance` | `resultat` |
| `Mort · jour moyen` | `mort` | `jour` |
| `Mort · lieux franchis moyens` | `mort` | `franchis` |
| `Avis · durée moyenne` | `avis_envoye` | `duree_s` |

### 6.2 Avec SQL — les moyennes exactes par partie

Depuis la **v1.141.1**, chaque événement joué à l'intérieur d'une partie porte
une super-propriété **`run_id`**. Une partie = un `run_id`. Il est posé à
l'ouverture (`partie_commencee`), survit au rechargement et à la fermeture de
l'app (reprendre une sauvegarde continue la MÊME partie), et il est retiré
quand la partie se termine : les événements d'entre-deux (accueil, avis,
relance) n'en portent aucun, donc ils ne gonflent aucun compte.

Deux tuiles à créer.

**`Parties · une ligne par partie`**

```sql
SELECT properties.run_id AS partie,
  min(timestamp) AS debut,
  dateDiff('minute', min(timestamp), max(timestamp)) AS minutes,
  countIf(event = 'ecran_vu')     AS ecrans,
  countIf(event = 'choix')        AS choix,
  countIf(event = 'de_lance')     AS des,
  countIf(event = 'lieu_atteint') AS lieux,
  anyIf(properties.cause, event = 'mort') AS mort_de,
  if(countIf(event = 'descente_franchie') > 0, 'sortie', if(countIf(event = 'mort') > 0, 'mort', 'en cours')) AS fin
FROM events
WHERE properties.run_id IS NOT NULL
GROUP BY partie
ORDER BY debut DESC
```

**`Moyennes par partie`**

```sql
SELECT
  count()                               AS parties,
  round(avg(ecrans), 1)                 AS ecrans_par_partie,
  round(avg(choix), 1)                  AS choix_par_partie,
  round(avg(des), 1)                    AS des_par_partie,
  round(avg(lieux), 1)                  AS lieux_par_partie,
  round(avg(minutes), 1)                AS minutes_par_partie,
  round(100 * sum(morte) / count(), 0)  AS pct_parties_mortelles,
  round(100 * sum(sortie) / count(), 0) AS pct_traversees
FROM (
  SELECT properties.run_id AS rid,
    countIf(event = 'ecran_vu')     AS ecrans,
    countIf(event = 'choix')        AS choix,
    countIf(event = 'de_lance')     AS des,
    countIf(event = 'lieu_atteint') AS lieux,
    dateDiff('minute', min(timestamp), max(timestamp)) AS minutes,
    if(countIf(event = 'mort') > 0, 1, 0)              AS morte,
    if(countIf(event = 'descente_franchie') > 0, 1, 0) AS sortie
  FROM events
  WHERE properties.run_id IS NOT NULL
  GROUP BY rid
)
```

Les moyennes du dé restent plus justes hors de ce regroupement, parce qu'elles
portent sur des JETS et non sur des parties :

```sql
SELECT count() AS jets,
  round(avg(toFloat(properties.resultat)), 1) AS de_moyen,
  round(100 * countIf(properties.reussi = true) / count(), 0) AS pct_tenus
FROM events WHERE event = 'de_lance'
```

### 6.3 Une ligne par joueur

`Joueurs — résumé par personne` du premier brief donne déjà ça : parties,
écrans, dés, lieux, morts, descentes, avis, source, version. La garder en SQL,
c'est une table par nature.
