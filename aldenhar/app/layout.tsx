import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aldenhar — III",
  description: "Prototype de livre-jeu narratif dark fantasy, arbitré par les dés.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Roboto Mono + Inter : thème Figma. Jacquard 12 + VT323 : verdicts, dé et thème brief. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&family=Inter:wght@600&family=Jacquard+12&family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
