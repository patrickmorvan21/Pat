"use client";

/**
 * LE RADAR DE L'ESSENCE — la forme du héros, partagée par deux écrans.
 *
 * Il vivait dans `GameMenu` (onglet Essence, maquette Figma 1925:559). Il sert
 * désormais AUSSI au verdict du Seuil (2/09), où il se remplit axe par axe
 * pendant que le Geôlier nomme les souvenirs : le joueur voit naître la forme
 * qu'il retrouvera toute la partie dans son menu.
 *
 * Géométrie de la maquette : centre du cadre, rayon 101, losanges-guides
 * tiretés à 202/126/46.
 *
 * ⚠️ LE REMPLISSAGE EST UN APLAT (2/09, retour Patrick : « c'est peu précis
 * visuellement, la zone orange »). Cela ANNULE la décision du 14/07 qui
 * imposait un nuage de pixels tramé contre l'aplat de la maquette Figma : vu
 * en situation sur l'écran du verdict, le nuage rendait la forme illisible —
 * on ne pouvait pas dire où un axe s'arrêtait. La maquette avait raison.
 *
 * ⚠️ Mais l'aplat est RASTÉRISÉ à la main, pixel par pixel, jamais par un
 * `ctx.fill()` : le remplissage d'un chemin anti-aliase ses bords et rendrait
 * une forme vectorielle lisse, ce que la DA interdit. En testant chaque pixel
 * entier, les diagonales du losange sortent en marches franches — un aplat
 * net qui reste du pixel art.
 */

import { useEffect, useMemo, useRef } from "react";
import type { RunStats } from "@/lib/state";

export const RADAR_AXES = [
  { key: "instinct", label: "INSTINCT", dx: 0, dy: -1 },
  { key: "courage", label: "COURAGE", dx: 1, dy: 0 },
  { key: "ruse", label: "RUSE", dx: 0, dy: 1 },
  { key: "empathie", label: "EMPATHIE", dx: -1, dy: 0 },
] as const;

const W = 390;
/** Géométrie de la maquette. Une variante compacte a existé le temps que le
    verdict porte aussi le rappel des réponses ; celui-ci retiré (2/09), la
    forme garde partout la même taille — c'est le même objet que dans le menu,
    il ne doit pas changer de dimension d'un écran à l'autre. */
const H = 264;
const R = 101;
function sommets(vals: number[], cx: number, cy: number, R: number) {
  return RADAR_AXES.map((a, i) => {
    const v = Math.max(0.05, Math.min(1, vals[i] / 5));
    return { x: cx + a.dx * v * R, y: cy + a.dy * v * R };
  });
}

function dedans(pts: { x: number; y: number }[], x: number, y: number) {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    if ((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x) < 0) return false;
  }
  return true;
}

export default function RadarEssence({
  stats,
  /** Valeurs AFFICHÉES (1..5 par axe). Absent → la forme complète.
      L'écran du Seuil s'en sert pour faire pousser un axe cran par cran. */
  fill,
  className = "",
}: {
  stats: RunStats;
  fill?: RunStats;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finals = useMemo(() => RADAR_AXES.map((a) => stats[a.key]), [stats]);
  const courants = useMemo(
    () => (fill ? RADAR_AXES.map((a) => fill[a.key]) : finals),
    [fill, finals]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const cx = W / 2;
    const cy = H / 2;
    ctx.clearRect(0, 0, W, H);

    // Croix des axes — un peu plus longue que le grand losange (maquette).
    ctx.strokeStyle = "rgba(255, 255, 255, 0.30)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx + 0.5, cy - R - 4);
    ctx.lineTo(cx + 0.5, cy + R + 4);
    ctx.moveTo(cx - R - 4, cy + 0.5);
    ctx.lineTo(cx + R + 4, cy + 0.5);
    ctx.stroke();

    // Losanges-guides en tirets (3 niveaux : 202/126/46 → ratios maquette).
    ctx.setLineDash([3, 3]);
    for (const f of [1, 0.624, 0.228]) {
      const r = R * f;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // L'aplat, rastérisé sur la grille entière (voir l'avertissement en tête).
    const forme = sommets(courants, cx, cy, R);
    ctx.fillStyle = "#e0632a";
    for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++) {
      let x0 = -1;
      for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
        const dedansIci = dedans(forme, x + 0.5, y + 0.5);
        if (dedansIci && x0 < 0) x0 = x;
        else if (!dedansIci && x0 >= 0) {
          // Une rangée d'un seul trait : le losange est convexe, il n'y a
          // jamais deux segments sur la même ligne.
          ctx.fillRect(x0, y, x - x0, 1);
          x0 = -1;
        }
      }
      if (x0 >= 0) ctx.fillRect(x0, y, Math.ceil(cx + R) - x0 + 1, 1);
    }
  }, [courants]);

  return (
    <div className={`relative w-full ${className}`}>
      <span className="pointer-events-none absolute top-[-20px] left-1/2 -translate-x-1/2 font-mono text-[12px] font-bold tracking-[1px] uppercase text-[var(--color-ink)]">
        INSTINCT
      </span>
      <span className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 font-mono text-[12px] font-bold tracking-[1px] uppercase text-[var(--color-ink)]">
        COURAGE
      </span>
      <span className="pointer-events-none absolute bottom-[-20px] left-1/2 -translate-x-1/2 font-mono text-[12px] font-bold tracking-[1px] uppercase text-[var(--color-ink)]">
        RUSE
      </span>
      <span className="pointer-events-none absolute top-1/2 left-[14px] -translate-y-1/2 font-mono text-[12px] font-bold tracking-[1px] uppercase text-[var(--color-ink)]">
        EMPATHIE
      </span>
      <canvas
        ref={canvasRef}
        className="radar-canvas block w-full"
        style={{ imageRendering: "pixelated", height: H }}
      />
    </div>
  );
}
