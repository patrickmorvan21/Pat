import type { Metadata, Viewport } from "next";
import "./globals.css";

// basePath du déploiement (vide en dev, ex. "/Pat/aldenhar" sur GitHub
// Pages). Le manifest/SW/icônes se servent à la racine du site, donc les
// liens émis dans le <head> doivent porter ce préfixe pour être corrects
// depuis n'importe quelle page (/ comme /minijeux/).
const basePath = process.env.PAGES_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "PACTUM",
  description: "Prototype de livre-jeu narratif dark fantasy, arbitré par les dés.",
  // PWA : émet <link rel="manifest"> (installable → icône sur l'écran
  // d'accueil, lancement plein cadre sans barres de navigateur).
  manifest: `${basePath}/manifest.json`,
  // iOS : sans ces métadonnées, Safari ignore le manifest et garde ses
  // barres même après « Ajouter à l'écran d'accueil ».
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pactum",
  },
  // Déclaré explicitement (avec basePath) plutôt que via le fichier
  // app/favicon.ico : en export statique, la convention fichier de Next
  // injecte le favicon en JS SANS le basePath → lien absent/cassé sous
  // /Pat/aldenhar/. En public/ + référence explicite, le <link rel="icon">
  // sort en statique avec le bon chemin (comme apple-touch-icon).
  icons: {
    icon: `${basePath}/favicon.ico`,
    shortcut: `${basePath}/favicon.ico`,
    apple: `${basePath}/icons/apple-touch-icon.png`,
  },
};

export const viewport: Viewport = {
  themeColor: "#1c1a16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Occupe tout l'écran sous l'encoche/barre système en mode standalone.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Enregistrement du service worker (chemins préfixés du basePath). Placé
  // en fin de <body>, déclenché au load — cf. snippet_head.html du PWA.
  const swRegister = `
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register(${JSON.stringify(`${basePath}/sw.js`)}, { scope: ${JSON.stringify(`${basePath}/`)} })
      .then(function (reg) { console.log("[Pactum] Service worker actif :", reg.scope); })
      .catch(function (err) { console.error("[Pactum] Échec service worker :", err); });
  });
}`;

  // LA HAUTEUR RÉELLEMENT VISIBLE, mesurée et republiée en `--app-h`.
  //
  // ⚠️ `100dvh` NE SUFFIT PAS sur un téléphone, et c'est ce qui décollait le
  // lit de braises du bas de l'écran (retour Patrick 06/09 : « des fois je
  // dois scroller pour qu'elles se remettent bien en bas »). La barre d'outils
  // du navigateur se rétracte au défilement ; entre deux états, `dvh` peut
  // valoir la GRANDE hauteur pendant que la barre occupe encore le bas. Le
  // cadre est alors plus haut que ce qu'on voit, la page devient scrollable,
  // et son bord bas — donc les flammes — passe sous la barre. On scrolle, la
  // barre se rétracte, tout se remet en place : exactement le symptôme.
  //
  // ⚠️ ET LA MESURE DÉPEND DU CONTEXTE — `visualViewport` N'EST JUSTE QUE DANS
  // UN NAVIGATEUR. Mesuré sur une capture de Patrick (iPhone 12/13/14, PWA
  // installée) : le cadre faisait 797 px au lieu de 844, et il restait
  // exactement 47 px de charbon sous le lit de braises. 47, c'est l'inset haut
  // de ce téléphone. En mode autonome, `viewport-fit=cover` fait démarrer la
  // page à y=0, SOUS la barre d'état — mais `visualViewport.height` compte à
  // partir du bas de cette barre. On retranchait donc l'encoche en haut pour
  // la rendre en trou en bas. Le premier jet de ce script réparait Safari et
  // cassait la PWA.
  //
  //   • autonome (PWA) : aucune barre d'outils, la page couvre l'écran →
  //     `innerHeight` est la bonne mesure. C'est ce que valait déjà `100dvh`,
  //     et c'est ce qui marchait avant (correctif du 30/07).
  //   • navigateur : `visualViewport.height` suit la barre d'outils, ce que
  //     `dvh` ne fait qu'avec un temps de retard — d'où le « je dois scroller
  //     pour que les flammes se remettent en bas ».
  //
  // Aucun risque de rétrécissement parasite : le jeu n'a plus AUCUN champ de
  // saisie (donc jamais de clavier) et le zoom est désactivé (maximumScale 1).
  // Repli `100dvh` : avant que ce script tourne, ou sans l'API, le
  // comportement est celui d'avant.
  const hauteurVisible = `
(function () {
  var d = document.documentElement;
  function autonome() {
    try {
      if (navigator.standalone === true) return true;
      return matchMedia("(display-mode: standalone)").matches
          || matchMedia("(display-mode: fullscreen)").matches;
    } catch (e) { return false; }
  }
  function poser() {
    var vv = window.visualViewport;
    var v = (!vv || autonome()) ? window.innerHeight : vv.height;
    if (v) d.style.setProperty("--app-h", Math.round(v) + "px");
  }
  poser();
  addEventListener("resize", poser);
  addEventListener("orientationchange", poser);
  if (window.visualViewport) {
    visualViewport.addEventListener("resize", poser);
    visualViewport.addEventListener("scroll", poser);
  }
})();`;

  // STATISTIQUES DE JEU — PostHog UE (Patrick, 10/09, pour la démo). Snippet
  // OFFICIEL du SDK (pas de paquet npm : `posthog-js` n'était pas installable
  // le 10/09, une sous-dépendance manquait sur le registre). La clé projet est
  // PUBLIQUE par nature (elle ne sert qu'à écrire des événements). Tout ce qui
  // est mesuré passe par `lib/analytics.ts` — rien ici n'est capturé tout seul :
  //   • autocapture / pageview / pageleave OFF : une seule URL, des boutons
  //     anonymes — seuls les événements NOMMÉS par le jeu ont un sens ;
  //   • persistance localStorage, aucun cookie ;
  //   • relecture de session avec champs masqués et SANS canvas (le dé,
  //     l'Anneau, les braises et les mini-jeux apparaîtront vides dans les
  //     replays — passer `recordCanvas: true` coûte cher en bande passante,
  //     c'est un réglage à activer sciemment) ;
  //   • `person_profiles: 'always'` : à l'échelle d'une démo, ça garantit
  //     tous les tableaux (rétention, entonnoirs) sans distinction.
  const posthog = `
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init("phc_rmaxCtePTNfmMsjypNg9QxgMd4U4aXTfDZkjyrfGBZAX",{api_host:"https://eu.i.posthog.com",autocapture:false,capture_pageview:false,capture_pageleave:false,persistence:"localStorage",person_profiles:"always",session_recording:{maskAllInputs:true,recordCanvas:false}});`;

  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: posthog }} />
        {/* iOS ancien (< 16.4) n'honore que cette balise historique pour
            lancer sans les barres Safari. Next n'émet que le
            `mobile-web-app-capable` standard via appleWebApp — on ajoute
            l'ancienne à la main pour couvrir tous les iPhone. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* Dans le <head> : `--app-h` est posée AVANT la première peinture,
            donc le cadre n'est jamais dimensionné une fois puis recalé. */}
        <script dangerouslySetInnerHTML={{ __html: hauteurVisible }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Roboto Mono + Inter : thème Figma. Instrument Serif : titres, verdicts (DA 15/07 : Instrument Serif + Roboto Mono).
             */}
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&family=Inter:wght@600&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: swRegister }} />
      </body>
    </html>
  );
}
