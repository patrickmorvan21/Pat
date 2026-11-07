# Les Joutes · le serveur

Le petit serveur du jeu de Patrick (https://patrickmorvan21.github.io/Pat/domus-td/) : un **Worker Cloudflare** (`lesjoutes`, à l’adresse https://lesjoutes.patrick-morvan21.workers.dev) et sa base **D1** (`joutes`, gardée dans l'Union européenne), sur le compte Cloudflare de Patrick (offre gratuite).

Cloudflare le **déploie tout seul à chaque envoi sur cette branche** (`serveur`) : rien à faire à la main.

## Ce qu'il fait (version 2, 07/11/2026)

- `GET /` : répond `{ ok, nom, v }`, pour voir qu'il marche.
- `GET /rec` : les cent meilleurs de chaque tableau (Line Towers ; les quatre cartes de Gem TD ; les quatre fermes de Farm TD ; le défi du jour et celui de la veille).
- `POST /rec` : les meilleurs scores d'un joueur, `{ key, n, h, c, u, recs: [{ b, s, w, t }] }`.
  - Un joueur, c'est une **clé secrète** que son téléphone garde ; son numéro public en est tiré : personne ne peut écrire sous le numéro d'un autre.
  - Seul un meilleur score remplace le score ; le nom (10 lettres), la Maison, la couleur et la tenue suivent le dernier envoi.
  - 40 envois par minute au plus depuis une même adresse (gardée brouillée, quelques minutes).

Seuls le jeu en ligne et l'appli iPhone (`capacitor://localhost`) peuvent le lire depuis une page.

## Pour Claude

- Le code : `src/index.js` ; la configuration : `wrangler.jsonc` (la base D1 par son identifiant).
- Les essais : `test/serveur.test.mjs`, dans Miniflare (31 vérifications), avant chaque envoi.
- Ne jamais mettre de secret dans ce dépôt : il est public.
