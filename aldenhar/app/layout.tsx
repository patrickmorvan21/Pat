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
  // `visualViewport.height` est la seule mesure qui décrit ce que l'œil voit.
  // Aucun risque de rétrécissement parasite ici : le jeu n'a plus AUCUN champ
  // de saisie (donc jamais de clavier) et le zoom est désactivé (viewport
  // maximumScale 1). Le repli reste `100dvh` : avant que ce script tourne, ou
  // sur un moteur sans l'API, le comportement est celui d'aujourd'hui.
  const hauteurVisible = `
(function () {
  var d = document.documentElement;
  function poser() {
    var v = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
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

  return (
    <html lang="fr">
      <head>
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
