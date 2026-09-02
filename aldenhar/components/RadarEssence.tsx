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
 * tiretés à 202/126/46. Le remplissage est un NUAGE DE PIXELS tramé
 * (référence de Patrick, 14/07 — la maquette montre un aplat faute de pouvoir
 * tramer, la référence prime), dense au centre, effrité vers les bords.
 * Jamais un dégradé.
 *
 * ⚠️ CROISSANCE STABLE — pourquoi le nuage est calculé sur la forme FINALE.
 * Un tirage par rejet refait à chaque cran redistribuerait tous les pixels
 * (un point rejeté sur la petite forme est accepté sur la grande, ce qui
 * décale toute la suite du générateur) : le nuage bouillonnerait au lieu de
 * pousser. On tire donc une fois pour la forme finale, puis chaque cran
 * n'AFFICHE que les points déjà contenus dans la forme courante — la matière
 * grandit du centre vers les bords sans qu'un seul pixel ne se déplace.
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
/** Géométrie de la maquette (H 264 / R 101) et sa variante COMPACTE, pour les
    écrans courts où le verdict doit tenir radar + rappels + portrait sans
    rogner une ligne. On réduit la GÉOMÉTRIE, jamais l'échelle CSS : un canvas
    `pixelated` mis à l'échelle sur un facteur non entier devient flou. */
const H_PLEIN = 264;
const R_PLEIN = 101;
const H_COMPACT = 208;
const R_COMPACT = 78;
/** Densité du nuage : points pour la surface du losange PLEIN. Le tirage est
    proportionné à la surface réellement occupée, sinon un héros faible aurait
    un nuage plus DENSE qu'un héros fort (même nombre de points sur moins de
    place) — l'inverse de ce que la forme doit dire. */
const POINTS_PLEIN = 2600;

type Pt = { x: number; y: number; s: number };

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

/**
 * Tirage du nuage pour la forme pleine — fonction de MODULE, pas une closure
 * du rendu : le générateur pseudo-aléatoire réassigne sa graine, ce que le
 * compilateur React interdit à l'intérieur d'un composant.
 */
function tirerNuage(finals: number[], H: number, R: number): Pt[] {
  const cx = W / 2;
  const cy = H / 2;
  const pleins = sommets(finals, cx, cy, R);
  // Surface du losange (formule du lacet) → nombre de points à densité fixe.
  let aire = 0;
  for (let i = 0; i < pleins.length; i++) {
    const a = pleins[i];
    const b = pleins[(i + 1) % pleins.length];
    aire += a.x * b.y - b.x * a.y;
  }
  aire = Math.abs(aire) / 2;
  const cible = Math.round(POINTS_PLEIN * (aire / (2 * R * R)));

  let seed = (finals[0] * 131 + finals[1] * 37 + finals[2] * 17 + finals[3] + 7) >>> 0;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  // Distance normalisée au bord dans la direction du point (bissection) :
  // sert au fondu de densité (dense au centre → effrité au bord).
  const bord = (x: number, y: number) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy);
    if (len < 1) return 0;
    let lo = 0;
    let hi = R * 1.2;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (dedans(pleins, cx + (dx / len) * mid, cy + (dy / len) * mid)) lo = mid;
      else hi = mid;
    }
    return lo > 0 ? len / lo : 1;
  };

  const out: Pt[] = [];
  let garde = 0;
  while (out.length < cible && garde < 40000) {
    garde++;
    const x = cx + (rnd() * 2 - 1) * R;
    const y = cy + (rnd() * 2 - 1) * R;
    if (!dedans(pleins, x, y)) continue;
    const keep = Math.pow(Math.max(0, 1 - bord(x, y)), 0.55) * 0.92 + 0.05;
    if (rnd() > keep) continue;
    out.push({ x: Math.floor(x), y: Math.floor(y), s: rnd() < 0.85 ? 1 : 2 });
  }
  return out;
}

export default function RadarEssence({
  stats,
  /** Valeurs AFFICHÉES (1..5 par axe). Absent → la forme complète.
      L'écran du Seuil s'en sert pour faire pousser un axe cran par cran. */
  fill,
  className = "",
  /** Écran court : même dessin, losange plus petit (voir H_COMPACT). */
  compact = false,
}: {
  stats: RunStats;
  fill?: RunStats;
  className?: string;
  compact?: boolean;
}) {
  const H = compact ? H_COMPACT : H_PLEIN;
  const R = compact ? R_COMPACT : R_PLEIN;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finals = useMemo(() => RADAR_AXES.map((a) => stats[a.key]), [stats]);
  const courants = useMemo(
    () => (fill ? RADAR_AXES.map((a) => fill[a.key]) : finals),
    [fill, finals]
  );

  /** Le nuage de la forme PLEINE, tiré une fois par jeu de stats. */
  const nuage = useMemo<Pt[]>(() => tirerNuage(finals, H, R), [finals, H, R]);

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

    // Le nuage, coupé à la forme COURANTE (voir l'avertissement en tête).
    const forme = sommets(courants, cx, cy, R);
    ctx.fillStyle = "#e0632a";
    for (const p of nuage) {
      if (dedans(forme, p.x, p.y)) ctx.fillRect(p.x, p.y, p.s, p.s);
    }
  }, [nuage, courants, H, R]);

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
