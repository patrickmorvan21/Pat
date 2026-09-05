"use client";

/**
 * DEUX DESSINS DE LA SÉQUENCE DE MORT, rendus au pixel plutôt que servis en
 * image (demande Patrick, 05/09 : « refaire en CSS la tête du démon » et
 * « rendre en CSS l'image du coffre »).
 *
 * Pourquoi ça vaut le coup : les deux PNG étaient des extraits Figma à la
 * TAILLE D'AFFICHAGE (390×276 et 390×844), donc sans réserve de définition —
 * c'est ce qui les faisait lire « pixellisés » au mauvais sens du terme sur un
 * écran Retina. Dessinés dans la grille, ils sont nets à toutes les densités,
 * ils respirent, et ils ne coûtent plus un octet de réseau.
 *
 * Grammaire commune (celle du prototype de Patrick) : demi-résolution upscalée
 * en `pixelated`, silhouettes CHARBON franches sur une lueur ORANGE tramée en
 * Bayer, bords rongés, jamais un aplat propre ni un dégradé.
 */

import { useEffect, useRef, useState } from "react";
import { animReduced } from "@/lib/settings";

const CHARBON = "#1c1a16";
const ORANGE = "#e0632a";
const BLANC = "#ffffff";
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Le semis qui dissout le bas d'un dessin dans le charbon de l'écran. */
function dissoudreBas(x: CanvasRenderingContext2D, W: number, H: number, bande: number) {
  x.fillStyle = CHARBON;
  for (let py = H - bande; py < H; py++) {
    const t = (py - (H - bande)) / bande;
    for (let px = 0; px < W; px++) if (Math.random() < t * 0.95) x.fillRect(px, py, 1, 1);
  }
}

/* ============================================================ LA TÊTE */

/**
 * LA TÊTE DU GEÔLIER (maquette 2320-4447) : une masse noire à cornes qui
 * émerge d'une lueur, les yeux seuls visibles — c'est la charte du
 * personnage depuis le début (« masse sombre écrasante, yeux seuls visibles »).
 */
function dessinerTete(x: CanvasRenderingContext2D, W: number, H: number) {
  const cx = W / 2;
  const cy = H * 0.62;
  x.fillStyle = CHARBON;
  x.fillRect(0, 0, W, H);

  // La lueur derrière : une densité qui monte vers le bas, en Bayer.
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const d = Math.hypot((px - cx) / (W * 0.46), (py - cy) / (H * 0.72));
      if (d > 1) continue;
      const p = (1 - d) * 0.92;
      if (BAYER[py & 3][px & 3] / 16 < p) {
        x.fillStyle = ORANGE;
        x.fillRect(px, py, 1, 1);
      }
    }
  }
  // Poussière au bord de la lueur — le halo ne s'arrête jamais net.
  x.fillStyle = ORANGE;
  for (let i = 0; i < 420; i++) {
    const px = (Math.random() * W) | 0;
    const py = (Math.random() * H) | 0;
    const d = Math.hypot((px - cx) / (W * 0.46), (py - cy) / (H * 0.72));
    if (d > 1 && d < 1.5 && Math.random() < 0.5 - (d - 1)) x.fillRect(px, py, 1, 1);
  }

  // La silhouette : crâne + capuche, deux cornes qui partent des tempes.
  const crane = (px: number, py: number) => {
    const u = (px - cx) / 30;
    const v = (py - cy + 8) / 34;
    if (u * u + v * v < 1) return true;
    // Les épaules, qui s'élargissent vers le bas du cadre.
    if (py > cy + 16) return Math.abs(px - cx) < 30 + (py - (cy + 16)) * 1.25;
    return false;
  };
  const corne = (px: number, py: number) => {
    for (const s of [-1, 1]) {
      // Une corne : un arc qui s'amincit, de la tempe vers le haut-dehors.
      for (let t = 0; t <= 1; t += 0.02) {
        const bx = cx + s * (22 + t * 26);
        const by = cy - 14 - t * 46 + t * t * 14;
        if (Math.hypot(px - bx, py - by) < 5.5 - t * 4) return true;
      }
    }
    return false;
  };
  const dans = (px: number, py: number) => crane(px, py) || corne(px, py);
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      if (!dans(px, py)) continue;
      // Bord rongé : un pixel de contour sur trois manque.
      const bord =
        !dans(px - 1, py) || !dans(px + 1, py) || !dans(px, py - 1) || !dans(px, py + 1);
      if (bord && Math.random() < 0.3) continue;
      x.fillStyle = CHARBON;
      x.fillRect(px, py, 1, 1);
    }
  }
  dissoudreBas(x, W, H, 16);
  return { cx, cy };
}

const TETE_W = 195;
const TETE_H = 138;

export function TeteGeolier() {
  const fond = useRef<HTMLCanvasElement>(null);
  const yeux = useRef<HTMLCanvasElement>(null);
  const [souffle, setSouffle] = useState(0);
  const [fixe, setFixe] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setFixe(animReduced()), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const cv = fond.current;
    const ov = yeux.current;
    if (!cv || !ov) return;
    const x = cv.getContext("2d");
    const o = ov.getContext("2d");
    if (!x || !o) return;
    const g = dessinerTete(x, TETE_W, TETE_H);
    // Les yeux vivent sur leur propre calque : ils pulsent sans qu'on
    // redessine la tête entière à chaque battement.
    let f = 0;
    function battre() {
      o!.clearRect(0, 0, TETE_W, TETE_H);
      if (f % 11 !== 0) {
        const s = 2 + (f % 2);
        o!.fillStyle = ORANGE;
        o!.fillRect(g.cx - 9 - (s >> 1), g.cy - 8, s, s);
        o!.fillRect(g.cx + 8 - (s >> 1), g.cy - 8, s, s);
        if (f % 3 === 0) {
          o!.fillStyle = BLANC;
          o!.fillRect(g.cx - 9, g.cy - 8, 1, 1);
          o!.fillRect(g.cx + 8, g.cy - 8, 1, 1);
        }
      }
      f += 1;
    }
    battre();
    if (fixe) return;
    const id = setInterval(battre, 340);
    return () => clearInterval(id);
  }, [fixe]);

  /** LA RESPIRATION — mêmes paliers ENTIERS que le démon de l'accueil
      (jamais une transition CSS, qui interpolerait entre deux pixels). */
  useEffect(() => {
    if (fixe) return;
    const id = setInterval(() => setSouffle((v) => (v + 1) % 11), 380);
    return () => clearInterval(id);
  }, [fixe]);
  const BREATH = [0, -1, -2, -3, -3, -3, -2, -1, 0, 0, 0];
  const dy = fixe ? 0 : BREATH[souffle];

  return (
    <div className="relative h-[276px] w-[390px]" style={{ transform: `translateY(${dy}px)` }}>
      <canvas
        ref={fond}
        width={TETE_W}
        height={TETE_H}
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated" }}
      />
      <canvas
        ref={yeux}
        width={TETE_W}
        height={TETE_H}
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

/* ============================================================ LE COFFRE */

const COF_W = 195;
const COF_H = 210;

/**
 * LE COFFRE (maquette 2333-10146) : posé sur son socle de pierre, cerclé de
 * fer, et la lumière qui sort de la fente du couvercle — c'est elle qui dit
 * qu'il y a quelque chose dedans, et c'est tout ce qu'on a le droit de savoir.
 */
function dessinerCoffre(x: CanvasRenderingContext2D, W: number, H: number) {
  const cx = W / 2;
  x.fillStyle = CHARBON;
  x.fillRect(0, 0, W, H);

  // Le halo, centré sur la fente : densité qui décroît avec la distance.
  const fy = H * 0.52;
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const d = Math.hypot((px - cx) / (W * 0.5), (py - fy) / (H * 0.42));
      if (d > 1) continue;
      const p = (1 - d) * (1 - d) * 0.95;
      if (BAYER[py & 3][px & 3] / 16 < p) {
        x.fillStyle = ORANGE;
        x.fillRect(px, py, 1, 1);
      }
    }
  }

  const gx = 34; // demi-largeur du coffre
  const hautCouvercle = fy - 26;
  const basCoffre = fy + 30;
  const socleHaut = basCoffre + 6;

  // Le coffre en silhouette : cuve + couvercle bombé.
  const dansCoffre = (px: number, py: number) => {
    if (py > basCoffre || py < hautCouvercle) return false;
    if (py >= fy - 2) return Math.abs(px - cx) <= gx;
    // Couvercle : un arc surbaissé.
    const t = (fy - 2 - py) / (fy - 2 - hautCouvercle);
    return Math.abs(px - cx) <= gx * Math.sqrt(Math.max(0, 1 - t * t * 0.86));
  };
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      if (!dansCoffre(px, py)) continue;
      const bord =
        !dansCoffre(px - 1, py) ||
        !dansCoffre(px + 1, py) ||
        !dansCoffre(px, py - 1) ||
        !dansCoffre(px, py + 1);
      if (bord && Math.random() < 0.25) continue;
      x.fillStyle = CHARBON;
      x.fillRect(px, py, 1, 1);
    }
  }

  // LA FENTE : la lumière sort d'entre le couvercle et la cuve.
  x.fillStyle = ORANGE;
  for (let px = cx - gx + 2; px <= cx + gx - 2; px++) {
    x.fillRect(px, fy - 2, 1, 1);
    if (Math.random() < 0.55) x.fillRect(px, fy - 3, 1, 1);
    if (Math.random() < 0.3) x.fillRect(px, fy - 4, 1, 1);
  }
  // Les ferrures : deux bandes verticales et le cerclage du couvercle.
  for (const s of [-1, 1]) {
    const bx = cx + s * 19;
    for (let py = hautCouvercle + 4; py <= basCoffre - 1; py++)
      if (Math.random() < 0.85) x.fillRect(bx, py, 1, 1);
  }
  for (let px = cx - gx; px <= cx + gx; px++)
    if (dansCoffre(px, basCoffre - 1) && Math.random() < 0.8) x.fillRect(px, basCoffre - 1, 1, 1);
  // La serrure, au milieu de la fente.
  for (let py = fy - 1; py < fy + 8; py++)
    for (let px = cx - 4; px <= cx + 4; px++)
      if (Math.abs(px - cx) === 4 || py === fy + 7) x.fillRect(px, py, 1, 1);

  // Le socle de pierre : un bloc aux bords rongés, sous le coffre.
  const dansSocle = (px: number, py: number) =>
    py >= socleHaut && py <= socleHaut + 18 && Math.abs(px - cx) <= gx + 12;
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      if (!dansSocle(px, py)) continue;
      const bord =
        !dansSocle(px - 1, py) ||
        !dansSocle(px + 1, py) ||
        !dansSocle(px, py - 1) ||
        !dansSocle(px, py + 1);
      if (bord && Math.random() < 0.3) continue;
      x.fillStyle = CHARBON;
      x.fillRect(px, py, 1, 1);
    }
  }
  // L'ARÊTE de la pierre, en orange : sans elle le socle est du charbon sur
  // du charbon et se lit comme une salissure au lieu d'un appui. C'est la
  // lumière du coffre qui l'attrape, donc elle est plus dense au milieu.
  x.fillStyle = ORANGE;
  for (let px = cx - gx - 12; px <= cx + gx + 12; px++) {
    const t = 1 - Math.abs(px - cx) / (gx + 12);
    if (Math.random() < 0.35 + t * 0.5) x.fillRect(px, socleHaut, 1, 1);
    if (Math.random() < t * 0.28) x.fillRect(px, socleHaut + 1, 1, 1);
  }
  // Un peu de grain dans la pierre, discret.
  x.fillStyle = "rgba(255,255,255,.2)";
  for (let i = 0; i < 45; i++) {
    const px = (cx - gx - 12 + Math.random() * (gx * 2 + 24)) | 0;
    const py = (socleHaut + 3 + Math.random() * 14) | 0;
    x.fillRect(px, py, 1, 1);
  }
  dissoudreBas(x, W, H, 22);
}

export function Coffre() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const x = ref.current?.getContext("2d");
    if (x) dessinerCoffre(x, COF_W, COF_H);
  }, []);
  return (
    <canvas
      ref={ref}
      width={COF_W}
      height={COF_H}
      aria-hidden
      className="block h-[420px] w-[390px]"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
