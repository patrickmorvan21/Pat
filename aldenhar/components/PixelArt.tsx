"use client";

/**
 * LES DEUX PIÈCES DESSINÉES DE LA SÉQUENCE DE MORT — la tête du Geôlier
 * (écran du fragment, maquette 2320-4447) et le coffre (écran de la relique,
 * maquette « Le Relique V1 », 3597:545).
 *
 * ⚠️ CE SONT DES SVG DEPUIS LE 06/09, et c'est le seul endroit du jeu où le
 * vectoriel est le bon format. Partout ailleurs une trame de dithering n'a
 * rien de vectoriel à récupérer — c'est déjà une grille de pixels, et un SVG
 * y pèse cent fois le PNG pour un résultat identique. Ici la raison est
 * ailleurs : ces deux images sont les seules servies à une taille FIXE et
 * connue (390×276 et 388×685), et le navigateur les rastérise à la densité
 * réelle de l'écran. Elles sont donc nettes à dpr 1, 2 et 3.
 *
 * ⚠️ C'EST CE QUI RÉPARE UN DÉFAUT QUE `ImagePixels` NE POUVAIT PAS RÉGLER.
 * Il peint la source cellule par cellule à `ech = largeur × dpr / largeur_source`
 * — soit 1,000 en dpr 3 (net), mais 0,667 en dpr 2 et 0,333 sur desktop. À ces
 * densités-là, une trame subissait une DÉCIMATION au plus proche voisin à
 * facteur non entier : un pixel sur trois jeté, irrégulièrement. C'est
 * précisément l'opération qui détruit un semis. Le SVG n'a pas ce problème,
 * puisqu'il n'y a plus rien à rééchantillonner.
 *
 * ⚠️ `shape-rendering="crispEdges"` est PORTÉ PAR LES DEUX FICHIERS et n'est
 * pas décoratif. Sans lui, un bord de cellule qui tombe sur une frontière de
 * demi-pixel est antialiasé : mesuré sur l'export Figma du coffre, 222
 * couleurs à l'écran au lieu de 2, et la trame qui bave. Avec : exactement
 * deux couleurs. Si un SVG de remplacement arrive un jour sans cet attribut,
 * il faut le lui ajouter avant de le câbler.
 *
 * La respiration de la tête ne passe plus par un canvas : c'est une
 * translation en PALIERS ENTIERS, la même grammaire qu'à l'accueil — jamais
 * une interpolation, donc `transition: none` et des pixels pleins.
 */

import { useEffect, useState } from "react";
import { assetUrl } from "@/lib/assets";
import { animReduced } from "@/lib/settings";

/** La respiration de l'accueil, en paliers ENTIERS (jamais une interpolation). */
const SOUFFLE = [0, -1, -2, -3, -3, -3, -2, -1, 0, 0, 0];
const SOUFFLE_MS = 380;

/**
 * LA TÊTE DU GEÔLIER. Elle émerge du noir en haut de l'écran du fragment et
 * respire — c'est le seul mouvement de cet écran, et il suffit à faire d'un
 * portrait une présence. Ses bords se dissolvent d'eux-mêmes : l'image est un
 * semis, pas une silhouette découpée.
 *
 * Le SVG a une viewBox de 390×276, soit exactement sa taille d'affichage : une
 * cellule de trame vaut un pixel CSS, et le navigateur la rend nette quelle
 * que soit la densité.
 */
export function TeteGeolier() {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (animReduced()) return;
    const id = setInterval(() => setN((k) => (k + 1) % SOUFFLE.length), SOUFFLE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      alt=""
      src={assetUrl("assets/mort_geolier_tete.svg")}
      width={390}
      height={276}
      className="shrink-0 select-none"
      style={{ transform: `translateY(${SOUFFLE[n]}px)`, transition: "none" }}
    />
  );
}

/**
 * LE COFFRE — PLEINE LARGEUR ET FERRÉ EN HAUT (retour Patrick 06/09).
 *
 * L'image est un plan d'ambiance à fond perdu : le faisceau tombe du haut du
 * cadre, la flaque de lumière touche le bas. Elle ne se cadre donc pas, elle
 * remplit — d'où `w-full` et plus aucun resserrement conditionnel.
 *
 * ⚠️ L'IMAGE NE SE RÉTRÉCIT PLUS SUR UN PETIT ÉCRAN. Elle mesure 390 × 689 :
 * sur un cadre plus court que ~830 px, son bas est simplement rogné par le
 * cadre. C'est le prix de « pleine largeur, ferré en haut » — un
 * rétrécissement décollerait l'image du bord et laisserait une marge, ce qui
 * est exactement ce qu'on retire. La consigne, elle, est ancrée au bas du
 * cadre par `DeathScreen` : elle reste lisible quelle que soit la hauteur.
 *
 * ⚠️ PLUS AUCUN MASQUE DE DISSOLUTION. L'ancienne version en posait un pour
 * que la consigne « Touche le coffre » se lise sur du charbon propre ; ce SVG
 * porte sa dissolution DANS le dessin — mesuré, ses 35 dernières rangées ne
 * portent que 2,5 % d'orange. En rajouter un mangerait le socle.
 */
export function Coffre() {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      alt=""
      src={assetUrl("assets/mort_coffre.svg")}
      width={388}
      height={685}
      className="w-full shrink-0 select-none"
      style={{ height: "auto" }}
    />
  );
}
