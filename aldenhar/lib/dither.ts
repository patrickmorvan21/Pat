/**
 * Rendu tramé/bruité partagé par tous les mini-jeux (catalogue Notion,
 * règle générale #4) : jamais de formes pleines et nettes, jamais de
 * dégradé CSS. In-game = damier Bayer uniquement (Floyd-Steinberg est
 * réservé au traitement des illustrations photo, voir CLAUDE.md).
 */

export const CHARBON = "#1c1a16";
export const ORANGE = "#e0632a";
export const CREME = "#e8dfc8"; // réservé : inscriptions anciennes, curseurs
export const DRAMA = "#ac2e26";

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16));

/**
 * Remplit un rectangle en damier Bayer 4×4 : `density` (0..1) contrôle la
 * proportion de pixels "on" (colorOn), le reste reste en colorOff.
 * `cell` = taille de pixel (1-3 en général, jamais de flou).
 */
export function bayerFill(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  density: number,
  colorOn: string,
  colorOff: string | null,
  cell = 2
) {
  if (colorOff) {
    ctx.fillStyle = colorOff;
    ctx.fillRect(x0, y0, w, h);
  }
  ctx.fillStyle = colorOn;
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const bx = Math.floor(x / cell) % 4;
      const by = Math.floor(y / cell) % 4;
      if (density > BAYER4[by][bx]) {
        ctx.fillRect(x0 + x, y0 + y, cell, cell);
      }
    }
  }
}

/** Bruit pseudo-aléatoire déterministe (seed stable) — jitter organique, jamais de Math.random brut pour un rendu reproductible. */
export function seededRandom(seedStr: string) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

/** Remplissage Bayer confiné à un chemin quelconque (cercle, anneau, arc…) — même langage visuel que bayerFill, juste découpé par un clip. */
export function bayerFillClipped(
  ctx: CanvasRenderingContext2D,
  clip: (ctx: CanvasRenderingContext2D) => void,
  x0: number,
  y0: number,
  w: number,
  h: number,
  density: number,
  colorOn: string,
  cell = 2
) {
  ctx.save();
  ctx.beginPath();
  clip(ctx);
  ctx.clip();
  bayerFill(ctx, x0, y0, w, h, density, colorOn, null, cell);
  ctx.restore();
}

/** Bruit de texture stable (pas re-tiré à chaque frame) : mouchetures fines pour donner du grain à un fond, sans jamais de flou. */
export function noiseSpecks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rnd: () => number,
  color: string,
  count: number
) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const px = x + rnd() * w;
    const py = y + rnd() * h;
    const s = rnd() < 0.7 ? 1 : 2;
    ctx.fillRect(Math.floor(px), Math.floor(py), s, s);
  }
}

/**
 * Masque alpha tramé Bayer (data URL PNG) pour faire dissoudre le bord d'une
 * image en pixels épars plutôt qu'un fondu CSS lisse (§11 Notion : "la trame
 * se dissout en pixels épars près des bords... pas un fondu d'opacité lisse").
 * `fade(nx, ny)` (coords normalisées 0..1) renvoie 0 = opaque, 1 = transparent.
 * Doit être appelé côté client uniquement (canvas DOM).
 */
export function ditherFadeMaskDataUrl(w: number, h: number, fade: (nx: number, ny: number) => number): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const density = 1 - fade(x / w, y / h);
      const bx = x % 4,
        by = y % 4;
      if (density >= BAYER4[by][bx]) ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas.toDataURL();
}

/** Contour rongé façon pixel-art : un rectangle dont les bords perdent des pixels de façon organique (réutilise l'esthétique de l'érosion santé). */
export function erodedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rnd: () => number,
  color: string,
  bites = 18
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = CHARBON;
  for (let i = 0; i < bites; i++) {
    const side = Math.floor(rnd() * 4);
    const along = rnd();
    const size = 1 + Math.round(rnd() * 2);
    let bx = x,
      by = y;
    if (side === 0) {
      bx = x + along * w;
      by = y;
    } else if (side === 1) {
      bx = x + along * w;
      by = y + h - size;
    } else if (side === 2) {
      bx = x;
      by = y + along * h;
    } else {
      bx = x + w - size;
      by = y + along * h;
    }
    ctx.fillRect(bx, by, size, size);
  }
}
