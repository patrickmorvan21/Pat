"use client";

import { useEffect, useRef } from "react";

/**
 * L'ENCROÛTÉ — le sel qui gagne les CTA (les Salines, prototype validé par
 * Patrick le 13/09 : « J'adore le design encroûté, en grappes… les bords très
 * réalistes »).
 *
 * Un calque canvas posé PAR-DESSUS la barre de choix (`.choices-bar` est
 * `relative`, le calque est `absolute inset-0`, `pointer-events: none`) : les
 * boutons restent tapables, seul leur DESSIN est rongé. Trois paliers, jamais
 * un chiffre :
 *   I   — le sel se pose sur les bordures et les encoches des boutons, par
 *         GRAPPES irrégulières (bruit stable à trois sinus, épaisseur 1-3
 *         cellules — la grammaire de la frange du Geôlier) ;
 *   II  — ~15 % des lettres sont couvertes, par PLAGES CONTIGUËS depuis la
 *         fin des mots (deux lettres minimum : une croûte gagne, elle ne
 *         pique pas des lettres au hasard — retour Patrick du 13/09) ;
 *   III — ~38 %.
 * La narration n'est JAMAIS touchée (règle de la bible) : le sel ne monte que
 * sur ce qu'on peut décider.
 *
 * Deux couleurs : le sel est BLANC plein (`#ffffff`), à bords rongés par
 * densité de pixels (jamais une opacité). Cellule = 2 px d'écran.
 */

const CELL = 2;
const PART_LETTRES: Record<number, number> = { 1: 0, 2: 0.15, 3: 0.38 };

function hash(s: string): () => number {
  let seed = 2166136261;
  for (let i = 0; i < s.length; i++) seed = Math.imul(seed ^ s.charCodeAt(i), 16777619) >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

/** Bruit stable le long d'un bord (u = position 0..1) — trois sinus, jamais
    d'aléatoire par frame : la même grappe à chaque rendu. */
function bruitBord(u: number, k: number): number {
  return (
    0.5 +
    0.28 * Math.sin(u * 61 + k) +
    0.16 * Math.sin(u * 137 + k * 2.3) +
    0.06 * Math.sin(u * 311 + k * 5.1)
  );
}

/** Un bloc de sel à bords rongés : cœur plein, frange par probabilité. */
function bloc(
  ctx: CanvasRenderingContext2D,
  rnd: () => number,
  x: number,
  y: number,
  w: number,
  h: number,
  force: number,
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2 + 2;
  const ry = h / 2 + 2;
  for (let py = y - 3; py < y + h + 3; py += CELL) {
    for (let px = x - 3; px < x + w + 3; px += CELL) {
      const d = Math.hypot((px - cx) / rx, (py - cy) / ry);
      const p = d < 0.6 ? 1 : d < 1 ? 1 - (d - 0.6) / 0.4 : d < 1.25 ? 0.18 : 0;
      if (p > 0 && rnd() < p * force) ctx.fillRect(Math.round(px), Math.round(py), CELL, CELL);
    }
  }
}

export default function EncrouteCTA({ palier, cle }: { palier: number; cle: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    let raf = 0;
    let tries = 0;
    const dessiner = () => {
      const parent = cv.parentElement;
      if (!parent) return;
      const W = parent.clientWidth;
      const H = parent.clientHeight;
      if (!W || !H) return;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#ffffff";
      const rnd = hash(cle + "|" + palier);
      const pr = parent.getBoundingClientRect();
      const boutons = Array.from(parent.querySelectorAll("button"));
      boutons.forEach((b, bi) => {
        const r = b.getBoundingClientRect();
        const bx = r.left - pr.left;
        const by = r.top - pr.top;
        const bw = r.width;
        const bh = r.height;
        // ── palier I : les bordures, par grappes ───────────────────────────
        const epaisseur = palier >= 3 ? 3 : palier >= 2 ? 2.4 : 1.7;
        const bords: Array<[number, number, number, number, number]> = [
          [bx, by, bw, 0, 0.21 + bi], // haut
          [bx, by + bh, bw, 0, 1.7 + bi], // bas
          [bx, by, 0, bh, 3.1 + bi], // gauche
          [bx + bw, by, 0, bh, 4.8 + bi], // droite
        ];
        for (const [x0, y0, dx, dy, k] of bords) {
          const len = dx || dy;
          for (let t = 0; t < len; t += CELL) {
            const u = t / len;
            const n = bruitBord(u, k);
            // une grappe existe là où le bruit dépasse un seuil ; son
            // épaisseur suit le bruit (1 à 3 cellules), la frange est rongée
            if (n < 0.5) continue;
            const ep = Math.min(3, Math.max(1, Math.round((n - 0.5) * 6 * epaisseur)));
            for (let e = -ep; e <= ep; e++) {
              const p = e === 0 ? 1 : Math.abs(e) === ep ? 0.35 : 0.8;
              if (rnd() >= p) continue;
              const px = dx ? x0 + t : x0 + e * CELL;
              const py = dy ? y0 + t : y0 + e * CELL;
              ctx.fillRect(Math.round(px), Math.round(py), CELL, CELL);
            }
          }
        }
        // les encoches de coin : toujours prises en premier
        for (const [cx, cy] of [
          [bx, by],
          [bx + bw - 3, by],
          [bx, by + bh - 3],
          [bx + bw - 3, by + bh - 3],
        ]) {
          bloc(ctx, rnd, cx - 1, cy - 1, 5, 5, 0.9);
        }
        // ── paliers II-III : les lettres, par plages depuis la fin des mots ──
        const part = PART_LETTRES[Math.min(3, palier)] ?? 0;
        if (part <= 0) return;
        const range = document.createRange();
        const mots: DOMRect[][] = [];
        const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const txt = node.textContent ?? "";
          let mot: DOMRect[] = [];
          for (let i = 0; i < txt.length; i++) {
            if (/\s/.test(txt[i])) {
              if (mot.length) mots.push(mot);
              mot = [];
              continue;
            }
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            const cr = range.getBoundingClientRect();
            if (cr.width > 0 && cr.height > 0) mot.push(cr);
          }
          if (mot.length) mots.push(mot);
        }
        const total = mots.reduce((n, m) => n + m.length, 0);
        let budget = Math.round(total * part);
        // on part des mots les plus à droite (la fin du libellé, puis le tag)
        const ordre = mots.slice().sort((a, b2) => b2[b2.length - 1].right - a[a.length - 1].right);
        for (const m of ordre) {
          if (budget <= 0) break;
          // plage contiguë depuis la FIN du mot, deux lettres minimum
          const n = Math.max(2, Math.min(m.length, budget, 2 + Math.floor(rnd() * Math.max(1, m.length - 1))));
          const lettres = m.slice(m.length - n);
          const x0 = Math.min(...lettres.map((l) => l.left)) - pr.left;
          const x1 = Math.max(...lettres.map((l) => l.right)) - pr.left;
          const y0 = Math.min(...lettres.map((l) => l.top)) - pr.top;
          const y1 = Math.max(...lettres.map((l) => l.bottom)) - pr.top;
          bloc(ctx, rnd, x0 - 1, y0, x1 - x0 + 2, y1 - y0, 0.95);
          budget -= n;
        }
      });
    };
    // FitLabel ajuste la police après le rendu et la barre revient d'un
    // display:none par un fondu : on mesure deux fois, puis on suit le resize.
    const tick = () => {
      dessiner();
      tries += 1;
      if (tries < 3) raf = window.setTimeout(tick, tries === 1 ? 60 : 420) as unknown as number;
    };
    tick();
    const ro = new ResizeObserver(() => dessiner());
    if (cv.parentElement) ro.observe(cv.parentElement);
    return () => {
      window.clearTimeout(raf);
      ro.disconnect();
    };
  }, [palier, cle]);

  return (
    <canvas
      ref={ref}
      data-encroute={palier}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[4]"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
