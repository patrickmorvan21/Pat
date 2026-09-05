"use client";

import { useEffect, useRef } from "react";
import { assetSrc } from "@/lib/assets";
import { animReduced } from "@/lib/settings";

/**
 * Rend une image du jeu comme une GRILLE DE PIXELS sur canvas, jamais comme un
 * <img>. Les images de PACTUM sont déjà tramées en deux couleurs : dessinées ici
 * cellule par cellule, sans aucun lissage, elles sont identiques à la source à
 * l'oeil — mais elles deviennent une matière qu'on peut faire respirer, balancer
 * ou dissoudre, ce qu'une balise <img> ne permet pas.
 *
 * ⚠️ Tout mouvement se fait en PIXELS ENTIERS (§5 du SKILL : jamais
 * d'interpolation). Un décalage fractionnaire ferait réapparaître le lissage que
 * ce composant existe précisément pour supprimer.
 */

type Props = {
  src: string;
  width: number;
  height: number;
  /** Décalage horizontal par palier, appliqué en bandes (le balancement). */
  sway?: number[];
  swayMs?: number;
  /** Hauteur d'une bande de balancement, en px source. */
  swayBand?: number;
  /** Décalage vertical par palier, appliqué à l'image entière (la respiration). */
  breathe?: number[];
  breatheMs?: number;
  /** « cover » : l'image REMPLIT la boîte et déborde, centrée — pour un fond
      qui doit tenir toute la hauteur du device quelle qu'elle soit. Défaut
      « nature » : l'image garde sa taille, une cellule source par pixel. */
  ajuste?: "nature" | "cover";
  className?: string;
  style?: React.CSSProperties;
};

export default function ImagePixels({
  src,
  width,
  height,
  sway,
  swayMs = 420,
  swayBand = 26,
  breathe,
  breatheMs = 380,
  ajuste = "nature",
  className,
  style,
}: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = Math.min(3, Math.max(1, Math.round(window.devicePixelRatio || 1)));
    cv.width = width * dpr;
    cv.height = height * dpr;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const img = new Image();
    let brut = 0;
    let raf = 0;
    let vivant = true;
    const fige = animReduced();

    const peindre = (t: number) => {
      const iw = img.naturalWidth || width;
      const ih = img.naturalHeight || height;
      // Échelle entière quand c'est possible : une cellule source = n pixels écran.
      const ech =
        ajuste === "cover"
          ? Math.max(cv.width / iw, cv.height / ih)
          : (width * dpr) / iw;
      // En « cover », l'image déborde : on la centre plutôt que de la coller
      // en haut à gauche, sinon on ne perdrait que d'un côté.
      const ox = ajuste === "cover" ? Math.round((cv.width - iw * ech) / 2) : 0;
      const oy = ajuste === "cover" ? Math.round((cv.height - ih * ech) / 2) : 0;
      ctx.clearRect(0, 0, cv.width, cv.height);

      const dy = breathe && !fige ? breathe[Math.floor(t / breatheMs) % breathe.length] : 0;
      const dx = sway && !fige ? sway[Math.floor(t / swayMs) % sway.length] : 0;

      if (!sway || fige) {
        ctx.drawImage(img, ox, oy + Math.round(dy * ech), Math.round(iw * ech), Math.round(ih * ech));
        return;
      }
      // Bandes : le bas porte un peu plus que le haut, mais TOUTE l'image
      // bouge. ⚠️ Un facteur qui part de zéro laisse les bandes hautes
      // strictement immobiles — sur une image dont le sujet est en haut, le
      // balancement devient alors invisible (piège payé sur les chaînes du
      // credo). Le plancher de 0,55 garantit qu'un décalage de 2 px se voit
      // partout.
      const bandes = Math.ceil(ih / swayBand);
      for (let b = 0; b < bandes; b++) {
        const sy = b * swayBand;
        const sh = Math.min(swayBand, ih - sy);
        const prof = bandes > 1 ? b / (bandes - 1) : 1;
        const off = Math.round(dx * (0.55 + 0.45 * prof)) * ech;
        ctx.drawImage(
          img,
          0,
          sy,
          iw,
          sh,
          ox + Math.round(off),
          oy + Math.round((sy + dy) * ech),
          Math.round(iw * ech),
          Math.round(sh * ech),
        );
      }
    };

    const boucle = () => {
      if (!vivant) return;
      peindre(performance.now() - brut);
      if (!fige && (sway || breathe)) raf = requestAnimationFrame(boucle);
    };

    img.onload = () => {
      brut = performance.now();
      boucle();
    };
    img.src = assetSrc(src);

    return () => {
      vivant = false;
      cancelAnimationFrame(raf);
    };
  }, [src, width, height, sway, swayMs, swayBand, breathe, breatheMs, ajuste]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className={className}
      style={{ width, height, imageRendering: "pixelated", ...style }}
    />
  );
}
