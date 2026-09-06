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
 * LE COFFRE, ferré en HAUT et pleine largeur — la maquette le pose à x=1, y=0
 * en 388×685 dans un cadre de 390×844.
 *
 * ⚠️ PLUS AUCUN MASQUE DE DISSOLUTION. L'ancienne version en posait un pour
 * que la consigne « Touche le coffre » se lise sur du charbon propre ; ce SVG
 * porte sa dissolution DANS le dessin (fond charbon plein, bords qui
 * s'effacent d'eux-mêmes vers le bas). En rajouter un mangerait le socle.
 *
 * Sous 800 px de haut, l'image se resserre : la maquette est dessinée pour 844,
 * et 685 + la consigne déborderaient d'un petit écran. Le SVG se redimensionne
 * sans se réinterpoler, donc ce resserrement ne coûte aucune netteté — c'est
 * l'autre chose que le vectoriel apporte ici.
 */
export function Coffre() {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      alt=""
      src={assetUrl("assets/mort_coffre.svg")}
      width={388}
      height={685}
      /* ⚠️ La requête est sur la HAUTEUR, pas la largeur. Un `max-[799px]:`
         de Tailwind est un max-WIDTH — sur un téléphone de 390 px il serait
         vrai en permanence, et le coffre serait toujours rapetissé (mesuré :
         300×530 au lieu de 388×685). C'est la hauteur qui manque sur un petit
         écran, donc c'est elle qu'on interroge. */
      className="w-[388px] max-w-full shrink-0 select-none [@media(max-height:799px)]:w-[300px]"
      style={{ height: "auto" }}
    />
  );
}
