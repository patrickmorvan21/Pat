"use client";

/**
 * LES DEUX PIÈCES DESSINÉES DE LA SÉQUENCE DE MORT — la tête du Geôlier
 * (écran du fragment, maquette 2320-4447) et le coffre (écran de la relique,
 * maquette 2333-10146).
 *
 * ⚠️ CE SONT LES IMAGES DE PATRICK, rendues en GRILLE DE PIXELS. La version
 * du 05/09 les redessinait à la main : c'était une mauvaise lecture de sa
 * demande. Il ne voulait pas d'autres dessins, il voulait SES images
 * transformées en pixels — « avec des pixels si petits qu'on dirait que c'est
 * la même image ». `ImagePixels` fait exactement ça : la source est peinte
 * cellule par cellule, sans aucun lissage à aucune densité d'écran, et devient
 * une matière qu'on peut faire respirer ou dissoudre.
 *
 * Les deux images sont déjà tramées en deux couleurs : leur trame EST le
 * dégradé, il n'y a jamais à en ajouter un.
 *
 * ⚠️ ELLES SONT SERVIES EN 3× (`_b`), retiré du retour Patrick du 5/09
 * (« l'image du démon fait trop image, rends-la plus nette »). Les exports
 * d'origine étaient à la TAILLE D'AFFICHAGE : sur un écran Retina, chaque
 * cellule de trame devenait un pâté de 3 px. Leurs demi-teintes ont été
 * relues comme une carte de densité, agrandies, puis re-tramées fin — le
 * grain fait maintenant un pixel d'écran, comme le démon de l'accueil.
 */

import { useEffect, useState } from "react";
import ImagePixels from "@/components/ImagePixels";
import { ditherFadeMaskDataUrl } from "@/lib/dither";

/** La respiration de l'accueil, en paliers ENTIERS (jamais une interpolation). */
const SOUFFLE = [0, -1, -2, -3, -3, -3, -2, -1, 0, 0, 0];

/**
 * LA TÊTE DU GEÔLIER. Elle émerge du noir en haut de l'écran du fragment et
 * respire — c'est le seul mouvement de cet écran, et il suffit à faire d'un
 * portrait une présence. Ses bords se dissolvent d'eux-mêmes : l'image est un
 * semis, pas une silhouette découpée.
 */
export function TeteGeolier() {
  return (
    <ImagePixels
      src="assets/mort_geolier_tete_b.png"
      width={390}
      height={276}
      breathe={SOUFFLE}
      breatheMs={380}
      className="shrink-0"
    />
  );
}

/**
 * LE COFFRE, plein cadre comme la maquette. Son bas se dissout en PIXELS
 * ÉPARS (masque tramé, jamais un fondu d'opacité) pour que la consigne « Touche
 * le coffre » se pose sur du charbon propre — c'était la demande de Patrick :
 * les flammes rendaient ce texte illisible, elles sont retirées et rien ne
 * doit les remplacer.
 */
export function Coffre() {
  const [masque, setMasque] = useState<string | null>(null);

  useEffect(() => {
    // Généré côté client (canvas) et une seule fois : le masque ne dépend de
    // rien d'autre que de sa géométrie.
    const id = setTimeout(() => {
      setMasque(
        ditherFadeMaskDataUrl(64, 128, (_nx, ny) =>
          ny < 0.68 ? 0 : Math.min(1, (ny - 0.68) / 0.26)
        )
      );
    }, 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <ImagePixels
      src="assets/mort_coffre_b.png"
      width={390}
      height={620}
      className="shrink-0"
      style={
        masque
          ? {
              WebkitMaskImage: `url(${masque})`,
              maskImage: `url(${masque})`,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
            }
          : undefined
      }
    />
  );
}
