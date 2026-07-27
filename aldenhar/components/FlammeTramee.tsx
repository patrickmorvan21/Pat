"use client";

/**
 * LA FLAMME TRAMÉE — reproduction en code de la vidéo de référence (27/07).
 *
 * Ce qu'il fallait retrouver, en regardant les images de la vidéo :
 *   • un corps dense en bas, qui monte en langues effilées et irrégulières ;
 *   • des braises DÉTACHÉES au-dessus, isolées, qui montent seules ;
 *   • deux couleurs, jamais un dégradé — la matière se lit à la DENSITÉ des
 *     pixels allumés, comme tout le reste de PACTUM.
 *
 * Technique : un automate de chaleur classique (chaque cellule prend la
 * moyenne de ses voisines du dessous, moins un refroidissement aléatoire) sur
 * une grille BASSE RÉSOLUTION, puis un seuillage ORDONNÉ (matrice de Bayer)
 * qui transforme la chaleur continue en deux couleurs. C'est le seuillage qui
 * fait la trame : sans lui on obtiendrait un dégradé lisse, interdit par la DA.
 * Le canvas est ensuite agrandi par CSS en `pixelated`, comme le dé.
 *
 * Aucun assets, aucune dépendance : ça tourne partout où il y a un canvas.
 */

import { useEffect, useRef } from "react";

const CHARBON = "#1c1a16";
const ORANGE = "#e0632a";

/** Bayer 4×4 normalisée — l'ordre des seuils qui crée la trame. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((r) => r.map((v) => (v + 0.5) / 16));

export type FlammeProps = {
  /** Largeur affichée, en pixels CSS. */
  width?: number;
  height?: number;
  /** Côté d'un pixel de la grille. Plus grand = plus gros grain. */
  pixel?: number;
  /** 0 = braise mourante, 1 = brasier. Pilote hauteur et densité. */
  vigueur?: number;
  /** Coupe l'animation (accessibilité, ou décor figé). */
  fige?: boolean;
  className?: string;
};

export default function FlammeTramee({
  width = 300,
  height = 740,
  pixel = 4,
  vigueur = 1,
  fige = false,
  className,
}: FlammeProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;

    const W = Math.max(8, Math.floor(width / pixel));
    const H = Math.max(8, Math.floor(height / pixel));
    cv.width = W;
    cv.height = H;

    // Chaleur par cellule, 0..1. Une seule dimension : c'est un tableau plat
    // indexé y*W+x, bien plus rapide qu'un tableau de tableaux.
    const chaleur = new Float32Array(W * H);
    // Braises détachées : elles vivent HORS de la grille de chaleur, sinon
    // l'automate les rattraperait et les fondrait dans le corps de la flamme.
    type Braise = { x: number; y: number; v: number; vie: number; max: number };
    const braises: Braise[] = [];

    const img = ctx.createImageData(W, H);
    const donnees = img.data;
    const [cr, cg, cb] = [0x1c, 0x1a, 0x16];
    const [orr, og, ob] = [0xe0, 0x63, 0x2a];

    let raf = 0;
    let t = 0;

    function etape() {
      t += 1;

      // ── la source, en bas : elle vacille, sinon la flamme est un jet de gaz
      const souffle = 0.72 + 0.28 * Math.sin(t * 0.07) * Math.sin(t * 0.023);
      for (let x = 0; x < W; x++) {
        // Profil large et écrasé : sur la vidéo le foyer occupe presque toute
        // la base.
        const centre = 1 - Math.abs(x / W - 0.5) * 2;
        const forme = Math.min(1, Math.max(0, centre) ** 0.3 * 1.45);
        // ⚠️ Sans cette ONDE, la source est uniforme et la flamme monte en
        // PAVÉ (deuxième essai). Deux sinus de périodes incommensurables qui
        // dérivent dans le temps : certaines colonnes sont froides, d'autres
        // brûlent — ce sont elles qui deviennent les langues.
        const onde =
          0.55 +
          0.45 *
            Math.abs(Math.sin(x * 0.23 + t * 0.045) * Math.sin(x * 0.081 - t * 0.029));
        const bruit = 0.8 + Math.random() * 0.2;
        chaleur[(H - 1) * W + x] = Math.min(2.2, forme * onde * bruit * souffle * (0.2 + vigueur));
      }

      // ── propagation vers le haut, avec dérive latérale
      for (let y = 0; y < H - 1; y++) {
        const ligne = y * W;
        const dessous = (y + 1) * W;
        for (let x = 0; x < W; x++) {
          const g = chaleur[dessous + ((x - 1 + W) % W)];
          const c = chaleur[dessous + x];
          const d = chaleur[dessous + ((x + 1) % W)];
          // Le décalage aléatoire donne les langues qui serpentent ; sans lui
          // la flamme monte en colonnes droites et a l'air d'un code de démo.
          const derive = Math.random() < 0.34 ? 0 : Math.random() < 0.5 ? -1 : 1;
          const src = chaleur[dessous + ((x + derive + W) % W)];
          const moy = (g + c + d + src) / 4;
          // Refroidissement plus fort en haut : la flamme s'éteint en montant.
          // ⚠️ Réglage sensible : la chaleur perd `froid` par rangée, donc la
          // hauteur atteinte ≈ chaleur_source / froid_moyen. À 0.066 la flamme
          // mourait au quinzième de l'écran (premier essai) ; à ~0.009 elle
          // monte aux deux tiers, comme sur la vidéo.
          const froid = (0.002 + Math.random() * 0.010) * (1 + (1 - y / H) * 1.2);
          chaleur[ligne + x] = Math.max(0, moy - froid);
        }
      }

      // ── détachement des braises : une cellule chaude et isolée s'envole
      // La vidéo garde un semis de braises jusqu'en HAUT du cadre : elles
      // doivent donc vivre assez longtemps pour traverser tout l'écran. Des
      // braises trop courtes (premier réglage) laissaient les deux tiers
      // supérieurs vides, alors que c'est justement là que se joue l'effet.
      if (braises.length < 520) {
        for (let n = 0; n < 7; n++) {
          const x = Math.floor(Math.random() * W);
          const y = Math.floor(H * (0.3 + Math.random() * 0.45));
          // On les prend sur la FRANGE de la flamme, pas dans son cœur :
          // c'est là que la matière se détache.
          const c = chaleur[y * W + x];
          if (c > 0.12 && c < 0.8 && Math.random() < 0.7) {
            braises.push({
              x,
              y,
              v: 0.3 + Math.random() * 0.65,
              vie: 0,
              max: 260 + Math.random() * 300,
            });
          }
        }
      }
      for (let i = braises.length - 1; i >= 0; i--) {
        const b = braises[i];
        b.y -= b.v;
        b.x += Math.sin((b.vie + i) * 0.08) * 0.12;
        b.vie += 1;
        if (b.y < 0 || b.vie > b.max) braises.splice(i, 1);
      }
    }

    function dessiner() {
      let p = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          // Seuillage ordonné : c'est ici que naît la trame.
          const allume = chaleur[y * W + x] > BAYER[y & 3][x & 3];
          donnees[p++] = allume ? orr : cr;
          donnees[p++] = allume ? og : cg;
          donnees[p++] = allume ? ob : cb;
          donnees[p++] = 255;
        }
      }
      // Les braises par-dessus, en pixels pleins : elles doivent rester
      // lisibles même là où la trame est vide.
      for (const b of braises) {
        const x = Math.round(b.x);
        const y = Math.round(b.y);
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        // Elles se raréfient en montant par PROBABILITÉ DE DESSIN, jamais par
        // transparence — même règle que les cendres de l'accueil.
        if (Math.random() > 1 - 0.55 * (b.vie / b.max)) continue;
        const q = (y * W + x) * 4;
        donnees[q] = orr;
        donnees[q + 1] = og;
        donnees[q + 2] = ob;
      }
      ctx!.putImageData(img, 0, 0);
    }

    if (fige) {
      // Quelques pas à vide pour que l'image figée ait déjà une forme.
      for (let i = 0; i < 140; i++) etape();
      dessiner();
      return;
    }

    // ~24 images/s : au-delà, la trame scintille au lieu de brûler.
    let dernier = 0;
    function boucle(now: number) {
      raf = requestAnimationFrame(boucle);
      if (now - dernier < 42) return;
      dernier = now;
      etape();
      dessiner();
    }
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [width, height, pixel, vigueur, fige]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{
        width,
        height,
        imageRendering: "pixelated",
        display: "block",
        background: CHARBON,
      }}
      aria-hidden
    />
  );
}

export const FLAMME_COULEURS = { CHARBON, ORANGE };
