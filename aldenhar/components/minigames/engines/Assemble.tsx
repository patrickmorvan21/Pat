"use client";

import { useEffect, useRef } from "react";
import { seededRandom, CHARBON, ORANGE, CREME } from "@/lib/dither";
import { ZONE_W, ZONE_H, dissoudreBords } from "../zone";

/**
 * LES TESSONS DE LA CUVE — le puzzle des Bassins (16/09).
 *
 * Patrick a apporté un mini-jeu de puzzle à chronomètre (« assemble le
 * puzzle », pièces low-poly à remettre dans un contour). Sa place dans les
 * Salines est la Cuve fendue : une cuve de pierre cassée en tessons, tenus
 * par le sel, qui perd sa saumure goutte à goutte. On REMONTE les tessons
 * avant qu'elle soit vide.
 *
 * Ce qui change par rapport à l'app d'origine, et pourquoi :
 *   • LE CHRONO EST LA SAUMURE. Aucun chiffre : le niveau descend par
 *     PALIERS (douze crans, jamais une interpolation) dans le contour de la
 *     cuve, en trame orange — c'est lui qu'on regarde du coin de l'œil. Le
 *     réglage « Chronomètres » des Options le fige (accessibilité, 6/08).
 *   • LES PIÈCES SONT DES TESSONS, pas des polygones plats : une partition de
 *     Voronoï seedée du contour, aux bords rongés par une trame de pixels
 *     (jamais un trait vectoriel). On les GLISSE ; à portée de leur place,
 *     elles s'aimantent — la tolérance est la Ruse.
 *   • L'ÉCHEC EST UN PRIX, JAMAIS UN MUR : la cuve se vide, il reste une
 *     pellicule à lécher (la scène le dit) ; on ne rejoue pas.
 *
 * Deux couleurs et le blanc (bords des tessons, cadre-cible en pointillé de
 * pixels). Pointeurs : `pointerdown` sur le canvas, `move`/`up`/`cancel` sur
 * `window` (leçon de l'atelier du 28/07 — iOS perd les événements dès que le
 * doigt sort du canvas). Rendu 1:1 dans la zone habillée (390×499).
 */

type Config = {
  /** Nombre de tessons (5 / 6 / 7 selon la Ruse). */
  pieces: number;
  /** Rayon d'aimantation, en px (26 / 20 / 15). */
  tolerance: number;
  /** Durée de la fuite : le temps pour que la saumure soit à sec. */
  fuiteMs: number;
  /** Image de la cuve, découpée en tessons. Sans elle : une pierre procédurale. */
  imageFond?: string;
  /** « Chronomètres : désactivés » — la saumure ne fuit pas. */
  chronosOff?: boolean;
};

/** Le contour de la cuve — un vase trapu, plus large au ventre. */
const CUVE: [number, number][] = [
  [118, 96], [272, 96], [292, 190], [282, 400], [108, 400], [98, 190],
];
const NIVEAUX = 12; // les crans de la saumure — jamais une interpolation
const GRACE_MS = 900; // le temps de voir la cuve avant que la fuite commence

function dansPolygone(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const croise = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (croise) inside = !inside;
  }
  return inside;
}

/** Un semis de pixels le long d'un polygone — le cadre-cible, jamais un trait. */
function contourPixels(ctx: CanvasRenderingContext2D, poly: [number, number][], couleur: string, pas: number, r: () => number) {
  ctx.fillStyle = couleur;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    const L = Math.hypot(x1 - x0, y1 - y0);
    for (let t = 0; t < L; t += pas) {
      if (r() < 0.7) ctx.fillRect(Math.round(x0 + ((x1 - x0) * t) / L), Math.round(y0 + ((y1 - y0) * t) / L), 1, 1);
    }
  }
}

export default function Assemble({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: Config;
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = ZONE_W;
    const H = ZONE_H;
    canvas.width = W;
    canvas.height = H;
    const rnd = seededRandom(seed);
    const n = Math.max(3, Math.min(9, config.pieces));
    const tol = config.tolerance;

    // ── la partition : n sites dans la cuve, un tesson = les pixels les plus
    //    proches d'un site (Voronoï). Les sites sont écartés les uns des
    //    autres pour qu'aucun tesson ne soit un éclat inutilisable.
    const sites: [number, number][] = [];
    let essais = 0;
    while (sites.length < n && essais < 4000) {
      essais++;
      const x = 98 + rnd() * (292 - 98);
      const y = 96 + rnd() * (400 - 96);
      if (!dansPolygone(x, y, CUVE)) continue;
      if (sites.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < 62)) continue;
      sites.push([x, y]);
    }
    while (sites.length < n) sites.push([195, 100 + sites.length * 40]);
    const label = new Uint8Array(W * H); // 0 = hors cuve, sinon index+1
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!dansPolygone(x + 0.5, y + 0.5, CUVE)) continue;
        let best = 0;
        let bd = Infinity;
        for (let i = 0; i < n; i++) {
          const d = (sites[i][0] - x) ** 2 + (sites[i][1] - y) ** 2;
          if (d < bd) { bd = d; best = i; }
        }
        label[y * W + x] = best + 1;
      }
    }

    // ── la matière des tessons : l'image de la cuve si elle est déposée,
    //    sinon une pierre procédurale (trame orange à densité variable sur
    //    charbon — deux couleurs, jamais un dégradé).
    const source = document.createElement("canvas");
    source.width = W;
    source.height = H;
    const sctx = source.getContext("2d")!;
    const pierreProcedurale = () => {
      sctx.fillStyle = CHARBON;
      sctx.fillRect(0, 0, W, H);
      sctx.fillStyle = ORANGE;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (!label[y * W + x]) continue;
          // veines de pierre : trois sinus, densité 0,18..0,62
          const v = (Math.sin(x * 0.09 + y * 0.03) + Math.sin(y * 0.17 - x * 0.02) + Math.sin((x + y) * 0.05)) / 3;
          const p = 0.4 + v * 0.22;
          const h = ((x * 2654435761 + y * 40503) >>> 0) / 4294967296;
          if (h < p) sctx.fillRect(x, y, 1, 1);
        }
      }
    };
    // Les tessons, chacun sur son propre calque (pleine taille : on le
    // dessine simplement décalé de sa position).
    const calques: HTMLCanvasElement[] = [];
    const construireCalques = () => {
      const src = sctx.getImageData(0, 0, W, H).data;
      for (let i = 0; i < n; i++) {
        const cv = document.createElement("canvas");
        cv.width = W;
        cv.height = H;
        const c = cv.getContext("2d")!;
        const img = c.createImageData(W, H);
        const d = img.data;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const k = y * W + x;
            if (label[k] !== i + 1) continue;
            // bord du tesson : là où le voisin est un autre tesson (ou le
            // vide), un pixel blanc une fois sur deux — la cassure se lit
            const bord =
              label[k - 1] !== i + 1 || label[k + 1] !== i + 1 || label[k - W] !== i + 1 || label[k + W] !== i + 1;
            const o = k * 4;
            if (bord && ((x * 7 + y * 13) & 3) < 2) {
              d[o] = 255; d[o + 1] = 255; d[o + 2] = 255; d[o + 3] = 255;
            } else {
              d[o] = src[o]; d[o + 1] = src[o + 1]; d[o + 2] = src[o + 2]; d[o + 3] = 255;
            }
          }
        }
        c.putImageData(img, 0, 0);
        calques.push(cv);
      }
    };

    // ── l'état : chaque tesson a un décalage (dx, dy) par rapport à sa place ;
    //    (0,0) = en place. Au départ, dispersés AUTOUR de la cuve.
    const pos: { dx: number; dy: number; snap: boolean }[] = [];
    for (let i = 0; i < n; i++) {
      const [sx, sy] = sites[i];
      // une place libre autour : à gauche, à droite, ou en bas, jamais dessus
      const cote = i % 3;
      const tx = cote === 0 ? 40 + rnd() * 30 : cote === 1 ? 300 + rnd() * 40 : 120 + rnd() * 150;
      const ty = cote === 2 ? 425 + rnd() * 40 : 110 + rnd() * 260;
      pos.push({ dx: tx - sx, dy: ty - sy, snap: false });
    }
    // ordre de dessin : le dernier saisi passe devant
    const ordre = pos.map((_, i) => i);

    let debut = performance.now();
    let pret = false; // la matière est construite
    let fini = false;
    let gelJusqua = 0; // après la dernière pièce : on regarde la cuve entière
    let tenu: { i: number; ox: number; oy: number; px: number; py: number } | null = null;
    let flash = 0; // frames de scintillement après un aimantage
    let raf = 0;
    const rBord = seededRandom(seed + "|bord");

    const niveau = (now: number) => {
      if (config.chronosOff) return NIVEAUX;
      const t = Math.max(0, now - debut - GRACE_MS);
      return Math.max(0, NIVEAUX - Math.floor((t / config.fuiteMs) * NIVEAUX));
    };

    const dessiner = (now: number) => {
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);
      const niv = niveau(now);
      // la saumure : trame orange qui monte du fond de la cuve jusqu'au cran
      const yFond = 400;
      const yHaut = 96;
      const ySaumure = yFond - ((yFond - yHaut) * niv) / NIVEAUX;
      ctx.fillStyle = ORANGE;
      for (let y = Math.floor(ySaumure); y < yFond; y += 2) {
        for (let x = 98; x < 292; x += 2) {
          if (!label[y * W + x]) continue;
          if (((x >> 1) + (y >> 1)) % 2 === 0) ctx.fillRect(x, y, 2, 2);
        }
      }
      // le cadre-cible : le contour de la cuve en pixels blancs espacés
      const rc = seededRandom(seed + "|cadre");
      contourPixels(ctx, CUVE, "rgba(255,255,255,0.5)", 3, rc);
      // les tessons en place d'abord, puis les libres, puis celui qu'on tient
      if (pret) {
        for (const i of ordre) {
          const p = pos[i];
          if (tenu && tenu.i === i) continue;
          ctx.drawImage(calques[i], Math.round(p.dx), Math.round(p.dy));
        }
        if (tenu) ctx.drawImage(calques[tenu.i], Math.round(pos[tenu.i].dx), Math.round(pos[tenu.i].dy));
      }
      // scintillement d'aimantage : le contour de la cuve en blanc plein, 6 frames
      if (flash > 0) {
        flash--;
        contourPixels(ctx, CUVE, CREME, 2, rBord);
      }
      dissoudreBords(ctx, W, H, 72);
    };

    const boucle = (now: number) => {
      dessiner(now);
      if (!fini) {
        if (gelJusqua && now >= gelJusqua) {
          fini = true;
          onResult(true);
          return;
        }
        if (!gelJusqua && niveau(now) <= 0) {
          fini = true;
          onResult(false);
          return;
        }
      }
      raf = requestAnimationFrame(boucle);
    };

    // ── la matière, puis la boucle
    const lancer = () => {
      construireCalques();
      pret = true;
      debut = performance.now();
      raf = requestAnimationFrame(boucle);
    };
    if (config.imageFond) {
      const im = new Image();
      im.onload = () => {
        // couvrir la cuve avec l'image, centrée sur elle
        const s = Math.max(200 / im.width, 320 / im.height);
        const w = im.width * s;
        const h = im.height * s;
        sctx.imageSmoothingEnabled = false;
        sctx.fillStyle = CHARBON;
        sctx.fillRect(0, 0, W, H);
        sctx.drawImage(im, 195 - w / 2, 248 - h / 2, w, h);
        lancer();
      };
      im.onerror = () => { pierreProcedurale(); lancer(); };
      im.src = config.imageFond;
    } else {
      pierreProcedurale();
      lancer();
    }

    // ── le geste
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
    };
    const down = (e: PointerEvent) => {
      if (fini || !pret || gelJusqua) return;
      const { x, y } = local(e);
      // le tesson sous le doigt : on cherche du plus haut au plus bas
      for (let k = ordre.length - 1; k >= 0; k--) {
        const i = ordre[k];
        const p = pos[i];
        if (p.snap) continue;
        const lx = Math.round(x - p.dx);
        const ly = Math.round(y - p.dy);
        if (lx < 0 || ly < 0 || lx >= W || ly >= H) continue;
        if (label[ly * W + lx] !== i + 1) continue;
        tenu = { i, ox: p.dx, oy: p.dy, px: x, py: y };
        ordre.splice(k, 1);
        ordre.push(i);
        e.preventDefault();
        return;
      }
    };
    const move = (e: PointerEvent) => {
      if (!tenu) return;
      const { x, y } = local(e);
      const p = pos[tenu.i];
      p.dx = tenu.ox + (x - tenu.px);
      p.dy = tenu.oy + (y - tenu.py);
      e.preventDefault();
    };
    const up = () => {
      if (!tenu) return;
      const p = pos[tenu.i];
      tenu = null;
      // à portée de sa place : il s'aimante
      if (Math.hypot(p.dx, p.dy) <= tol) {
        p.dx = 0;
        p.dy = 0;
        p.snap = true;
        flash = 6;
        if (pos.every((q) => q.snap)) gelJusqua = performance.now() + 700;
      }
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // Comme les autres moteurs : le geste ne se rejoue qu'à un nouveau `seed` —
    // `config` et `onResult` sont lus à la pose, une nouvelle identité de
    // fonction à chaque rendu de Scene ne doit pas remettre les tessons en vrac.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  return (
    <canvas
      ref={canvasRef}
      className="minigame-canvas"
      data-assemble="1"
      style={{ width: ZONE_W, height: ZONE_H, touchAction: "none", imageRendering: "pixelated" }}
    />
  );
}
