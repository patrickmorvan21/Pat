# Brief — construire le tableau de bord PostHog de la démo PACTUM

Tu es une session Claude Code locale avec accès au navigateur de Patrick (Chrome,
déjà connecté à PostHog). Ta mission : transformer la liste brute d'événements
en un tableau de bord lisible, puis répondre à deux questions précises.

## Contexte (à lire, pas à rediscuter)

- PACTUM est un jeu narratif mobile, publié en statique sur
  https://patrickmorvan21.github.io/Pat/aldenhar/ (version 1.141.0).
- Les statistiques sont envoyées à PostHog, région UE, projet 271370 :
  https://eu.posthog.com/project/271370. Aucune capture automatique : chaque
  événement est nommé par le jeu. Rien d'identifiant n'est envoyé (pas de nom,
  pas d'e-mail, pas de cookie). Un `person_id` = un navigateur anonyme.
- Événements et propriétés utiles :
  - `accueil_vu` {premiere_partie, runs, morts, traversees, partie_en_cours}
  - `partie_commencee` {mode: nouvelle | reprise | recommencer}
  - `pacte_signe` {duree_ms, traces, arrets, demande}
  - `ecran_vu` {scene, liaison, combat, terminal, jour, sante}
  - `texte_saute` · `menu_ouvert` {onglet} · `reglage_change` {reglage, valeur}
  - `choix` {scene, choix, type: risque|passif|orientation|verrou|objet|sortie|continuer, stat, seuil}
  - `de_lance` {scene, choix, stat, seuil, modificateur, resultat 1-20, palier, reussi, nature, combat}
  - `geste_joue` {moteur, reussi, essai} · `revelation` {courage, ruse, instinct, empathie}
  - `lieu_atteint` {lieu, visites, cible} · `objet_utilise` {objet, depuis}
  - `mort` {cause, lieu, jour, franchis, mort_numero, fixation, rarete}
  - `descente_franchie` {jour, franchis, traversees} · `renoncement`
  - `relance` {apres: mort|descente|renoncement} · `app_masquee` (l'app passe en arrière-plan)
  - `avis_ouvert` {source} · `avis_ferme` {source, question} · `avis_invitation`
  - `avis_envoye` {source, appareil, duree_s, relancer 1-5, comprehension 1-5,
    texte: trop_peu|juste|trop, difficulte: trop_facile|juste|trop_dure, de 1-5,
    meilleur, confus, habitue: oui|non, libre (texte, facultatif)}
  - Propriétés jointes à TOUT événement : `version`, `source` (canal du lien,
    `direct` par défaut), `pwa` (vrai si app installée), `ecran` (id de la scène
    affichée au moment de l'événement).

## Étape 1 — vérifier que les données de Patrick sont bien arrivées

Dans **Activity → Explore** (https://eu.posthog.com/project/271370/activity/explore) :

1. Filtre sur l'événement `avis_envoye`. Il doit y avoir au moins une ligne
   (le test de Patrick). Ouvre-la et **note les huit réponses et le champ
   `libre`** : c'est ce qu'il demande à retrouver.
2. Filtre sur `ecran_vu`, `de_lance`, `lieu_atteint`, puis `mort` ou
   `descente_franchie`. Note combien il y en a et la valeur de `version`
   (attendu : `1.141.0`). Si `version` est absente ou plus ancienne, la page
   qu'il a jouée n'était pas à jour : le dire, ne pas contourner.
3. Ouvre **People**, trouve la personne la plus récente, ouvre-la : sa
   chronologie doit raconter la run de Patrick (accueil → pacte ou reprise →
   écrans → dés → …). Si **Session replay** propose un enregistrement, ouvre-le
   et vérifie qu'il se lit (le dé, l'anneau et les mini-jeux sont des canvas
   NON enregistrés : ils apparaîtront vides, c'est voulu).

Rapporte ces trois points AVANT de construire quoi que ce soit.

## Étape 2 — le tableau de bord `PACTUM démo`

Menu gauche → **Dashboards** → **New dashboard** → nom `PACTUM démo`, vide.

Puis, pour chaque bloc ci-dessous : **New insight**, onglet **SQL** (ou
« HogQL »), coller la requête, vérifier qu'elle rend des lignes, **Save** avec
le nom indiqué, **Add to dashboard → PACTUM démo**. Si une requête échoue sur
une syntaxe, corrige-la à la marge (HogQL est un dialecte de ClickHouse) et
note la correction dans ton rapport.

### 2.1 `Avis — moyennes`
```sql
SELECT count() AS avis_recus,
  round(avg(toFloat(properties.relancer)), 2)      AS envie_de_relancer_sur_5,
  round(avg(toFloat(properties.comprehension)), 2) AS comprehension_sur_5,
  round(avg(toFloat(properties.de)), 2)            AS le_de_sur_5,
  round(avg(toFloat(properties.duree_s)), 0)       AS duree_moyenne_s
FROM events WHERE event = 'avis_envoye'
```

### 2.2 `Avis — texte / difficulté / habitué`
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

### 2.3 `Avis — moments`
```sql
SELECT 'meilleur' AS quoi, properties.meilleur AS moment, count() AS n
FROM events WHERE event = 'avis_envoye' GROUP BY moment
UNION ALL
SELECT 'confus', properties.confus, count()
FROM events WHERE event = 'avis_envoye' GROUP BY properties.confus
ORDER BY quoi, n DESC
```

### 2.4 `Avis — champ libre`
```sql
SELECT toDate(timestamp) AS jour, properties.libre AS une_chose_a_changer,
  properties.relancer AS relancer, properties.difficulte AS difficulte,
  properties.appareil AS appareil, properties.source AS source
FROM events
WHERE event = 'avis_envoye' AND properties.libre IS NOT NULL AND properties.libre != ''
ORDER BY timestamp DESC
```

### 2.5 `Entonnoir — de l'accueil à la fin de vie` (pas de SQL)
**New insight → Funnel**, étapes dans l'ordre : `accueil_vu` → `partie_commencee`
→ `pacte_signe` → `de_lance` → `lieu_atteint` → `mort`. Fenêtre de conversion
1 jour. Si l'interface permet une étape « A ou B », mets `mort` OU
`descente_franchie` en dernière étape ; sinon crée un second funnel identique
qui finit par `descente_franchie`. C'est l'insight le plus important : il montre
où les gens décrochent.

### 2.6 `Abandons — par écran`
```sql
SELECT properties.ecran AS ecran, count() AS fermetures
FROM events WHERE event = 'app_masquee' AND properties.ecran IS NOT NULL
GROUP BY ecran ORDER BY fermetures DESC LIMIT 25
```

### 2.7 `Dé — paliers`
```sql
SELECT properties.palier AS palier, count() AS jets,
  round(100 * count() / sum(count()) OVER (), 1) AS pct
FROM events WHERE event = 'de_lance'
GROUP BY palier ORDER BY jets DESC
```
(si `OVER ()` n'est pas accepté, retire la colonne `pct`.)

### 2.8 `Joueurs — résumé par personne`
```sql
SELECT person_id, min(timestamp) AS premiere_visite,
  countIf(event = 'partie_commencee') AS parties,
  countIf(event = 'ecran_vu') AS ecrans,
  countIf(event = 'de_lance') AS des_lances,
  countIf(event = 'lieu_atteint') AS lieux,
  countIf(event = 'mort') AS morts,
  countIf(event = 'descente_franchie') AS descentes,
  countIf(event = 'avis_envoye') AS avis,
  any(properties.source) AS source, any(properties.version) AS version
FROM events GROUP BY person_id ORDER BY premiere_visite DESC
```

### 2.9 `Morts — causes et lieux`
```sql
SELECT properties.cause AS cause, properties.lieu AS lieu,
  properties.mort_numero AS vie, count() AS n
FROM events WHERE event = 'mort'
GROUP BY cause, lieu, vie ORDER BY n DESC
```

### 2.10 `Lieux — fréquentation` et `Choix — les plus pris`
```sql
SELECT properties.lieu AS lieu, count() AS arrivees
FROM events WHERE event = 'lieu_atteint' GROUP BY lieu ORDER BY arrivees DESC
```
```sql
SELECT properties.scene AS scene, properties.choix AS choix, properties.type AS type, count() AS n
FROM events WHERE event = 'choix' GROUP BY scene, choix, type ORDER BY n DESC LIMIT 40
```

## Étape 3 — finitions

- Sur le dashboard, range les tuiles : l'entonnoir en haut, pleine largeur ;
  puis les quatre tuiles Avis ; puis Abandons et Dé côte à côte ; puis les tables.
- Ajoute un filtre de dashboard sur la propriété d'événement `version = 1.141.0`
  si des événements plus anciens polluent (il ne devrait pas y en avoir).
- Ne touche à AUCUN réglage du projet (pas de clé API, pas d'activation de
  l'enregistrement des canvas, pas de suppression d'événements ou de personnes,
  pas de partage public du dashboard).

## Rapport attendu (à Patrick, en français, court)

1. Étape 1 : les huit réponses de son avis + le champ libre ; le compte
   d'événements de sa run et sa `version` ; si le replay se lit.
2. La liste des insights créés, ceux qui rendent des lignes et ceux qui sont
   vides (un insight vide sur une catégorie encore non jouée — `mort`,
   `descente_franchie` — est normal).
3. Toute requête corrigée, avec la syntaxe retenue.
4. L'URL du dashboard.
