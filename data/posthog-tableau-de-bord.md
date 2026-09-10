# Tableau de bord PostHog — lire la démo sans fouiller l'Activity

Projet : https://eu.posthog.com/project/271370 (région UE). Tout ce qui suit se
construit dans l'interface, sans code. La page **Activity** liste les événements
bruts ; c'est une boîte noire pour lire des tendances. Il faut des **Insights**
(un graphique = une question) rassemblés dans un **Dashboard**.

Chaque requête ci-dessous se colle dans **New insight → SQL** (l'onglet « SQL »
ou « HogQL » selon l'écran), puis **Save** avec le nom indiqué, puis
**Add to dashboard → PACTUM démo**. Compter ~2 minutes par insight.

Les noms d'événements et de propriétés sont ceux que le jeu envoie
(`aldenhar/lib/analytics.ts` et les appels `track(...)` dans les composants).

---

## 0. Créer le dashboard

Menu gauche → **Dashboards** → **New dashboard** → nom `PACTUM démo`, modèle
« Blank ». Les insights suivants s'y ajoutent un par un.

---

## 1. Le questionnaire — moyennes (une ligne)

Nom : `Avis — moyennes`

```sql
SELECT
  count() AS avis_recus,
  round(avg(toFloat(properties.relancer)), 2)      AS envie_de_relancer_sur_5,
  round(avg(toFloat(properties.comprehension)), 2) AS comprehension_sur_5,
  round(avg(toFloat(properties.de)), 2)            AS le_de_sur_5,
  round(avg(toFloat(properties.duree_s)), 0)       AS duree_moyenne_s
FROM events
WHERE event = 'avis_envoye'
```

## 2. Le questionnaire — les choix (texte, difficulté, habitude)

Nom : `Avis — texte / difficulté / habitué`

```sql
SELECT 'texte' AS question, properties.texte AS reponse, count() AS n
FROM events WHERE event = 'avis_envoye' GROUP BY reponse
UNION ALL
SELECT 'difficulte', properties.difficulte, count()
FROM events WHERE event = 'avis_envoye' GROUP BY properties.difficulte
UNION ALL
SELECT 'habitue', properties.habitue, count()
FROM events WHERE event = 'avis_envoye' GROUP BY properties.habitue
ORDER BY question, n DESC
```

## 3. Le questionnaire — meilleur moment / moment confus

Nom : `Avis — moments`

```sql
SELECT 'meilleur' AS quoi, properties.meilleur AS moment, count() AS n
FROM events WHERE event = 'avis_envoye' GROUP BY moment
UNION ALL
SELECT 'confus', properties.confus, count()
FROM events WHERE event = 'avis_envoye' GROUP BY properties.confus
ORDER BY quoi, n DESC
```

## 4. Le questionnaire — les mots des joueurs

Nom : `Avis — champ libre`

```sql
SELECT
  toDate(timestamp)        AS jour,
  properties.libre         AS une_chose_a_changer,
  properties.relancer      AS relancer,
  properties.difficulte    AS difficulte,
  properties.appareil      AS appareil,
  properties.source        AS source
FROM events
WHERE event = 'avis_envoye' AND properties.libre IS NOT NULL AND properties.libre != ''
ORDER BY timestamp DESC
```

---

## 5. L'entonnoir d'une première partie (le graphique le plus important)

Pas de SQL ici : **New insight → Funnel**, puis les étapes dans cet ordre :

1. `accueil_vu`
2. `partie_commencee`
3. `pacte_signe`
4. `de_lance`
5. `lieu_atteint`
6. `mort` — puis cliquer « + » à côté de cette étape et ajouter `descente_franchie`
   en **alternative** (« or ») si l'interface le propose ; sinon faire deux
   funnels, un qui finit par `mort`, un par `descente_franchie`.

Fenêtre de conversion : **1 jour**. Ça montre, en pourcentage, combien de
personnes passent chaque cap et où elles décrochent.

Nom : `Entonnoir — de l'accueil à la fin de vie`

## 6. La carte des abandons — sur quel écran on ferme le jeu

Nom : `Abandons — par écran`

```sql
SELECT properties.ecran AS ecran, count() AS fermetures
FROM events
WHERE event = 'app_masquee' AND properties.ecran IS NOT NULL
GROUP BY ecran
ORDER BY fermetures DESC
LIMIT 25
```

(`app_masquee` part quand l'app passe en arrière-plan. Le dernier de chaque
personne est l'endroit où elle a lâché ; en volume, cette table dit quels
écrans font fermer le jeu le plus souvent.)

## 7. Le dé — les paliers réellement tirés

Nom : `Dé — paliers`

```sql
SELECT properties.palier AS palier, count() AS jets,
       round(100 * count() / sum(count()) OVER (), 1) AS pct
FROM events
WHERE event = 'de_lance'
GROUP BY palier
ORDER BY jets DESC
```

Variante par nature de jet (physique / social / exploration / surnaturel) :

```sql
SELECT properties.nature AS nature, countIf(properties.reussi = true) AS reussis,
       countIf(properties.reussi = false) AS rates, count() AS jets
FROM events WHERE event = 'de_lance'
GROUP BY nature ORDER BY jets DESC
```

## 8. Une ligne par joueur — ce que chaque personne a fait

Nom : `Joueurs — résumé par personne`

```sql
SELECT
  person_id,
  min(timestamp)                                   AS premiere_visite,
  countIf(event = 'partie_commencee')              AS parties,
  countIf(event = 'ecran_vu')                      AS ecrans,
  countIf(event = 'de_lance')                      AS des_lances,
  countIf(event = 'lieu_atteint')                  AS lieux,
  countIf(event = 'mort')                          AS morts,
  countIf(event = 'descente_franchie')             AS descentes,
  countIf(event = 'avis_envoye')                   AS avis,
  any(properties.source)                           AS source,
  any(properties.version)                          AS version
FROM events
GROUP BY person_id
ORDER BY premiere_visite DESC
```

Chaque `person_id` est un appareil anonyme (un navigateur). Cliquer un
identifiant ouvre la personne : sa chronologie complète et, si activé, la
relecture de sa session.

## 9. Les morts — où et de quoi

Nom : `Morts — causes et lieux`

```sql
SELECT properties.cause AS cause, properties.lieu AS lieu,
       properties.mort_numero AS vie, count() AS n
FROM events WHERE event = 'mort'
GROUP BY cause, lieu, vie
ORDER BY n DESC
```

## 10. Les lieux visités et les choix les plus pris

Nom : `Lieux — fréquentation`

```sql
SELECT properties.lieu AS lieu, count() AS arrivees
FROM events WHERE event = 'lieu_atteint'
GROUP BY lieu ORDER BY arrivees DESC
```

Nom : `Choix — les plus pris`

```sql
SELECT properties.scene AS scene, properties.choix AS choix,
       properties.type AS type, count() AS n
FROM events WHERE event = 'choix'
GROUP BY scene, choix, type
ORDER BY n DESC LIMIT 40
```

---

## Filtrer tes propres essais

Ouvre le jeu une fois avec `?src=patrick` sur chaque appareil que tu utilises :
la source est mémorisée. Ensuite, sur le dashboard, ajouter le filtre
`source ≠ patrick` (bouton **Filters** en haut du dashboard, propriété
d'événement `source`). Les testeurs invités par un canal précis reçoivent un
lien avec leur source (`?src=discord`, `?src=itch`…) et se filtrent de la même
façon.

## Si une table reste vide

- Vérifier d'abord dans **Activity** que l'événement existe bien (filtre par
  nom). S'il existe mais que la table est vide, c'est le nom d'une propriété
  qui diffère : ouvrir un événement dans Activity et lire ses propriétés.
- Les événements mettent parfois une à deux minutes à apparaître.
- Un joueur qui a mis « Statistiques anonymes : non » n'envoie plus rien.
