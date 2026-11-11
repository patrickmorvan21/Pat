# Les Joutes · le serveur

Le petit serveur du jeu de Patrick (https://patrickmorvan21.github.io/Pat/domus-td/) : un **Worker Cloudflare** (`lesjoutes`, à l’adresse https://lesjoutes.patrick-morvan21.workers.dev) et sa base **D1** (`joutes`, gardée dans l'Union européenne), sur le compte Cloudflare de Patrick (offre gratuite).

Cloudflare le **déploie tout seul à chaque envoi sur cette branche** (`serveur`) : rien à faire à la main. Pour voir qu'il répond : https://lesjoutes.patrick-morvan21.workers.dev/

## Ce qu'il fait (version 3, 10/11/2026)

- `GET /` : répond `{ ok, nom, v }`, pour voir qu'il marche.
- `GET /rec` : les cent meilleurs de chaque tableau (Line Towers ; les quatre cartes de Gem TD ; les quatre fermes de Farm TD ; le défi du jour et celui de la veille).
- `POST /rec` : les meilleurs scores d'un joueur, `{ key, n, h, c, u, recs: [{ b, s, w, t }] }`.
  - Un joueur, c'est une **clé secrète** que son téléphone garde ; son numéro public en est tiré : personne ne peut écrire sous le numéro d'un autre.
  - Seul un meilleur score remplace le score ; le nom (10 lettres), la Maison, la couleur et la tenue suivent le dernier envoi.
  - 40 envois par minute au plus depuis une même adresse (gardée brouillée, quelques minutes).
- **Les amis** (version 3) :
  - `POST /ami` : où en est un joueur (l'accueil, sa table avec son code, une partie), toutes les 20 s ; il reçoit son **code ami** (6 signes, toujours le même, tiré de son numéro public) et ses amis, avec où ils sont. Un ami silencieux depuis 75 s est « hors ligne », et le code de sa table n'est jamais donné. Seuls ses amis voient où il est.
  - `POST /ami/qui` : qui a ce code ami (son nom, sa Maison, son niveau), avant de l'ajouter.
  - `POST /ami/add` : ajouter un ami par son code : **amis tous les deux**, sans demande à accepter (100 au plus).
  - `POST /ami/del` : ne plus être amis, des deux côtés.

- **Version 4** (11/11/2026) :
  - `POST /profil` `{ key }` : le profil gardé (la progression, le nom, la Maison, les tenues…), et si le joueur est VIP.
  - `POST /profil/save` `{ key, t, data }` : le profil du téléphone ; le plus récent gagne (200 000 signes au plus, les clés du jeu seulement).
  - `POST /lier/code` `{ key }` puis `POST /lier/prendre` `{ code }` : « Lier un appareil », un code de 6 signes, 10 minutes, une seule fois.
  - `POST /vip` `{ key, code }` : le code VIP ouvre Gem TD et Fusion TD ; `POST /vip/regler` : Patrick seul (ses numéros publics) choisit le code ; le changer ferme les anciens VIP. Le code n'est gardé que par son empreinte.
  - 90 envois par minute depuis une même adresse (40 avant) : une table de six amis sur un même Wi-Fi.

Seuls le jeu en ligne et l'appli iPhone (`capacitor://localhost`) peuvent le lire depuis une page.

## Pour Claude

- Le code : `src/index.js` ; la configuration : `wrangler.jsonc` (la base D1 par son identifiant).
- Les essais : `test/serveur.test.mjs`, dans Miniflare (57 vérifications), et `test/v4.test.mjs` (34), avant chaque envoi.
- Ne jamais mettre de secret dans ce dépôt : il est public.

## Version 5 (11/11/2026) : les statistiques anonymes
- `POST /stat` : le jeu envoie des événements (ouverture, temps passé, parties solo ou à une table, tables créées et rejointes) sous un identifiant tiré au hasard à chaque ouverture, jamais lié au profil.
- `POST /stats/resume` : les totaux et les courbes, pour Patrick seul (ses numéros publics). La page `stats.html` du site les affiche.
- La table `ev` garde 120 jours ; aucune fiche individuelle. Les parties des appareils de Patrick ne sont pas comptées (sauf s'il l'active sur la page).
