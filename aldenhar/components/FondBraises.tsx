"use client";

/**
 * LE FOND DE BRAISES — le liant visuel de la séquence de mort (Notion 30/07).
 *
 * Présent en bas de TOUS les écrans de la séquence : La mort · Le fragment ·
 * Le Registre · La Relique. Un lit de braises MINCE qui respire, jamais une
 * flamme haute — le feu est passé, il reste ce qui couve.
 *
 * Réglage retenu (relevé dans la maquette `flamme_braise_v3.html`, à reprendre
 * tel quel — le fichier vit encore dans les Téléchargements de Patrick, à
 * déposer dans maquettes/ pour la réconciliation visuelle) :
 *   grain 3 · tick 45ms · src 0.94 · boost 0.06 · cool 0.082 · lit 3 rangs ·
 *   zoneBasse 0.14 · frein 0.55 · bruit 0.52 · braises 10 · vent 1.15 ·
 *   reprise 0.05 · coolVar 0.65 · cendres 2/pas · palier 10 pas
 *
 * Principes techniques VERROUILLÉS :
 *   • Deux couleurs seulement — la chaleur est seuillée par une trame ordonnée
 *     Bayer 4×4, jamais de dégradé, jamais d'alpha.
 *   • Respiration par PALIERS (16 paliers, montée plus longue que la chute),
 *     agissant sur l'intensité de la source ET sur le refroidissement.
 *   • Les cendres se raréfient par PROBABILITÉ DE DESSIN, jamais par opacité.
 *     Émises à la crête des colonnes chaudes, elles montent en ondulant et
 *     suivent le vent.
 *   • L'irrégularité vient de QUATRE sources indépendantes, toutes gardées :
 *     un lit de braises vivantes (naissent, dérivent, s'éteignent) · un bruit
 *     multi-échelle (3 octaves) sur le foyer · un VENT COHÉRENT qui penche
 *     tout avec cisaillement croissant en hauteur · des REPRISES brèves sur
 *     une colonne. Aucun motif périodique — pas de sinus sur le lit.
 */

import { useEffect, useRef } from "react";
import { animReduced } from "@/lib/settings";

const CHARBON = [0x1c, 0x1a, 0x16] as const;
const ORANGE = [0xe0, 0x63, 0x2a] as const;

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((r) => r.map((v) => (v + 0.5) / 16));

/* Le réglage de la maquette, verbatim. */
const GRAIN = 3;
const TICK = 45;
const SRC = 0.94;
const BOOST = 0.06;
const COOL = 0.082;
const LIT_RANGS = 3;
const ZONE_BASSE = 0.14;
const FREIN = 0.55;
const BRUIT = 0.52;
const BRAISES = 10;
const VENT = 1.15;
const REPRISE = 0.05;
const COOL_VAR = 0.65;
const CENDRES_PAR_PAS = 2;
const PALIER_PAS = 10;

/** Respiration par paliers : 16 paliers entiers, montée plus longue que la
    chute (10 pas de montée, 6 de descente) — jamais une interpolation. */
const PALIERS = [0, 1, 2, 3, 4, 6, 8, 10, 12, 14, 15, 13, 9, 5, 2, 1].map((v) => v / 15);

export default function FondBraises({
  height = 64,
  className,
}: {
  /** Hauteur CSS de la bande, en px. */
  height?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;

    const cssW = cv.parentElement?.clientWidth || 390;
    const W = Math.max(16, Math.floor(cssW / GRAIN));
    const H = Math.max(8, Math.floor(height / GRAIN));
    cv.width = W;
    cv.height = H;
    cv.style.height = `${height}px`;

    const chaleur = new Float32Array(W * H);
    // Le lit : des braises VIVANTES, pas une rangée uniforme. Chacune naît,
    // dérive lentement, s'éteint — et une nouvelle prend sa place ailleurs.
    type Braise = { x: number; vie: number; max: number; force: number; dx: number };
    const lit: Braise[] = [];
    const naitre = (): Braise => ({
      x: Math.random() * W,
      vie: 0,
      max: 120 + Math.random() * 300,
      force: 0.5 + Math.random() * 0.5,
      dx: (Math.random() - 0.5) * 0.03,
    });
    for (let i = 0; i < BRAISES; i++) {
      const b = naitre();
      b.vie = Math.random() * b.max; // peuplé d'emblée, pas de démarrage à froid
      lit.push(b);
    }

    // Cendres : émises à la crête des colonnes chaudes, elles montent au vent.
    type Cendre = { x: number; y: number; v: number; vie: number; max: number };
    const cendres: Cendre[] = [];

    // Reprise : une colonne qui se rallume brièvement.
    let repriseX = -1;
    let repriseVie = 0;

    // Bruit multi-échelle (3 octaves) : trois ondes de périodes
    // incommensurables qui dérivent — jamais un motif périodique lisible.
    function bruit3(x: number, t: number) {
      return (
        0.5 +
        0.5 *
          (Math.sin(x * 0.31 + t * 0.021) * 0.5 +
            Math.sin(x * 0.113 - t * 0.033) * 0.3 +
            Math.sin(x * 0.047 + t * 0.011) * 0.2)
      );
    }

    const img = ctx.createImageData(W, H);
    const px = img.data;

    let pas = 0;
    let ventPhase = Math.random() * 100;

    function etape() {
      pas += 1;
      // Palier de respiration : avance d'un cran tous les PALIER_PAS pas.
      const souffle = PALIERS[Math.floor(pas / PALIER_PAS) % PALIERS.length];

      // ── le lit de braises vivantes (3 rangs du bas)
      for (let i = lit.length - 1; i >= 0; i--) {
        const b = lit[i];
        b.vie += 1;
        b.x = (b.x + b.dx + W) % W;
        if (b.vie > b.max) lit.splice(i, 1);
      }
      while (lit.length < BRAISES) lit.push(naitre());

      // Source : le bas de la grille. Intensité = braises proches × bruit
      // 3 octaves × respiration. `SRC` cale le niveau, `BOOST` est la part
      // que la respiration ajoute.
      for (let x = 0; x < W; x++) {
        let proche = 0;
        for (const b of lit) {
          const d = Math.min(Math.abs(b.x - x), W - Math.abs(b.x - x));
          // Fenêtre d'influence courte : un lit MINCE, pas une nappe.
          const cycle = Math.sin((b.vie / b.max) * Math.PI); // monte puis meurt
          proche += Math.max(0, 1 - d / 5) * b.force * cycle;
        }
        const n = 1 - BRUIT + BRUIT * bruit3(x, pas);
        let v = Math.min(1.6, proche) * n * (SRC + BOOST * souffle);
        if (repriseX >= 0 && Math.abs(x - repriseX) < 3 && repriseVie > 0) v += 0.5;
        for (let r = 0; r < LIT_RANGS; r++) {
          const y = H - 1 - r;
          chaleur[y * W + x] = Math.max(chaleur[y * W + x], v * (1 - r * 0.22));
        }
      }
      if (repriseVie > 0) repriseVie -= 1;
      else if (Math.random() < REPRISE) {
        repriseX = Math.floor(Math.random() * W);
        repriseVie = 6 + Math.floor(Math.random() * 8);
      }

      // ── propagation vers le haut, freinée, penchée par le vent
      ventPhase += 0.013;
      const vent = Math.sin(ventPhase) * Math.sin(ventPhase * 0.37 + 1.3) * VENT;
      for (let y = 0; y < H - 1; y++) {
        const dessous = (y + 1) * W;
        // Cisaillement : le vent pousse plus fort en HAUT de la bande.
        const hauteur = 1 - y / H;
        const pousse = vent * hauteur;
        const decal = pousse > 0 ? (Math.random() < pousse ? -1 : 0) : Math.random() < -pousse ? 1 : 0;
        for (let x = 0; x < W; x++) {
          const g = chaleur[dessous + ((x - 1 + W) % W)];
          const c = chaleur[dessous + ((x + decal + W) % W)];
          const d = chaleur[dessous + ((x + 1) % W)];
          const moy = ((g + d) * 0.5 + c * 2) / 3;
          // Refroidissement : base COOL, variance COOL_VAR (multiplicative),
          // renforcé au-dessus de la zone basse — la chaleur ne monte pas loin.
          const zone = y < H * (1 - ZONE_BASSE) ? 1.8 : 1;
          const froid = COOL * (1 - COOL_VAR / 2 + Math.random() * COOL_VAR) * zone;
          chaleur[y * W + x] = Math.max(0, moy * FREIN - froid);
        }
      }

      // ── cendres : émises à la crête des colonnes chaudes
      for (let n = 0; n < CENDRES_PAR_PAS; n++) {
        const x = Math.floor(Math.random() * W);
        // La crête : première cellule chaude en partant du haut de la colonne.
        for (let y = 0; y < H; y++) {
          if (chaleur[y * W + x] > 0.28) {
            if (cendres.length < 80)
              cendres.push({ x, y, v: 0.18 + Math.random() * 0.3, vie: 0, max: 60 + Math.random() * 90 });
            break;
          }
        }
      }
      for (let i = cendres.length - 1; i >= 0; i--) {
        const c = cendres[i];
        c.y -= c.v;
        c.x += Math.sin((c.vie + i * 3) * 0.11) * 0.3 + vent * 0.12;
        c.vie += 1;
        if (c.y < 0 || c.vie > c.max) cendres.splice(i, 1);
      }
    }

    function dessiner() {
      let p = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const allume = chaleur[y * W + x] > BAYER[y & 3][x & 3];
          px[p++] = allume ? ORANGE[0] : CHARBON[0];
          px[p++] = allume ? ORANGE[1] : CHARBON[1];
          px[p++] = allume ? ORANGE[2] : CHARBON[2];
          px[p++] = 255;
        }
      }
      for (const c of cendres) {
        const x = Math.round(c.x);
        const y = Math.round(c.y);
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        // Raréfaction par probabilité de dessin — jamais par opacité.
        if (Math.random() < 0.65 * (c.vie / c.max)) continue;
        const q = (y * W + x) * 4;
        px[q] = ORANGE[0];
        px[q + 1] = ORANGE[1];
        px[q + 2] = ORANGE[2];
      }
      ctx!.putImageData(img, 0, 0);
    }

    if (animReduced()) {
      for (let i = 0; i < 90; i++) etape();
      dessiner();
      return;
    }

    let raf = 0;
    let dernier = 0;
    function boucle(now: number) {
      raf = requestAnimationFrame(boucle);
      if (now - dernier < TICK) return;
      dernier = now;
      etape();
      dessiner();
    }
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [height]);

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 ${className ?? ""}`}
      style={{ height }}
      aria-hidden
    >
      <canvas ref={ref} className="block h-full w-full" style={{ imageRendering: "pixelated" }} />
    </div>
  );
}
