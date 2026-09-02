/* Service worker PACTUM — met en cache la "coquille" de l'app pour un
   fonctionnement hors-ligne. Nécessaire pour la règle de permadeath :
   une run ne doit jamais échouer pour une raison technique (perte de
   réseau, avion, cave sans 4G...).

   ⚠️ Incrémenter CACHE_VERSION à chaque déploiement, sinon les joueurs
   restent bloqués sur une vieille version mise en cache.

   NB basePath : ce fichier est servi à la racine du site (ex. « / » en
   local, « /Pat/aldenhar/ » sur GitHub Pages). TOUS les chemins de
   l'APP_SHELL sont donc RELATIFS à l'emplacement du SW — ils se
   résolvent tout seuls quel que soit le basePath, sans rien coder en
   dur. `cache.add("./")` → la racine servie, `cache.add("assets/x.png")`
   → <base>/assets/x.png, etc. */

const CACHE_VERSION = "pactum-v203";

/* Coquille précachée à l'installation : les pages navigables + les
   assets à nom STABLE affichés tôt (logo, Geôlier, cadre). On NE code
   PAS en dur les bundles JS/CSS de Next : leurs noms sont hashés et
   changent à chaque build (`/_next/static/…-a1b2c3.js`), donc une liste
   figée serait périmée au déploiement suivant. Ils sont mis en cache
   automatiquement au 1er chargement en ligne par le handler `fetch`
   ci-dessous (stale-while-revalidate). La coquille ici suffit à garantir
   le tout premier lancement + la reprise d'une run déjà ouverte. */
const APP_SHELL = [
  "./",              // page d'accueil (racine servie)
  "minijeux/",       // 2e route (galerie de revue)
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  // Assets critiques à nom stable (rendus dès l'accueil / tôt en jeu).
  // Le dé est généré en Three.js (pas de sprite fichier) : rien à lister.
  //
  // ⚠️ Depuis le 30/07, l'app demande ces images AVEC le hash de leur contenu
  // (« assets/x.png?v=a3f2b9c1 », cf. lib/assets.ts) : ces entrées non hashées
  // ne sont donc pas celles qui seront servies. Elles restent listées comme
  // filet (si `assetUrl` ne connaît pas un fichier, il renvoie l'URL nue) ; les
  // URL hashées, elles, sont mises en cache au 1er chargement EN LIGNE par le
  // handler `fetch`. Une URL qui porte son hash est immuable : la garder en
  // cache ne peut jamais servir une vieille image.
  "assets/pactum_logo.png",
  "assets/geolier_detoure.png",
  "assets/geolier_portrait.png",
  "assets/accueil_demon.png",
  "assets/frange_geolier.svg",
  "assets/croix_menu.png",
  "assets/banner-edge.png",
  "assets/bande_dissolution_haut.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // `cache.add` un par un via allSettled : un asset manquant/renommé
      // n'annule PLUS toute l'installation (contrairement à `addAll`, qui
      // échoue en bloc et empêcherait le SW de s'activer → pas de PWA).
      Promise.allSettled(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("[Pactum SW] précache ignoré :", url, err);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* Deux stratégies selon le type de requête :

   1. NAVIGATIONS (chargement d'une page HTML) → RÉSEAU D'ABORD, cache en
      secours. C'est LA correction du 20/07 : en cache-first, relancer le jeu
      servait l'ancien HTML tant que le réseau n'avait pas révalidé en fond —
      d'où l'impression que « les mises à jour ne prennent pas ». Réseau
      d'abord = on voit tout de suite la dernière version en ligne, et on
      retombe sur le cache uniquement hors-ligne (règle permadeath : une run
      ne doit jamais échouer faute de réseau).

   2. TOUT LE RESTE (bundles `/_next/…` hashés, illustrations, assets) →
      cache d'abord, réseau en secours + mise à jour silencieuse
      (stale-while-revalidate). Les noms hashés changent à chaque build, donc
      pas de risque de servir un vieux bundle avec un HTML neuf : le HTML
      frais pointe déjà vers les nouveaux noms. */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const isNavigation =
    event.request.mode === "navigate" ||
    (event.request.destination === "document");

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          // Hors-ligne : on rend le HTML mis en cache (la page exacte, sinon
          // la racine — l'app est une SPA, tout rend depuis la coquille).
          caches.match(event.request).then((c) => c || caches.match("./"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // hors-ligne : on retombe sur le cache

      return cached || network;
    })
  );
});
