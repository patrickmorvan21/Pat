"use client";

import { useEffect, useRef } from "react";

/**
 * L'ENCROÛTÉ — le sel qui gagne les CTA (les Salines).
 *
 * ⚠️ PORT FIDÈLE de `maquettes/encroute_tempete.html` (rendu « grappes »,
 * validé par Patrick le 13/09 : « J'adore le design encroûté, en grappes… les
 * bords très réalistes »). La première version de ce composant avait été
 * RÉÉCRITE de mémoire — d'autres seuils, une autre grammaire de bruit, une
 * autre épaisseur — et Patrick l'a vue tout de suite : « le design est
 * différent des prototypes que tu m'avais montrés ». Leçon du 30/07, re-payée :
 * un prototype validé se PORTE, il ne se réinvente pas. Les trois fonctions
 * ci-dessous (`selBordure`, `croute`, `bloc`) sont celles du prototype, aux
 * mêmes constantes ; seule la source des rectangles change (le DOM des
 * boutons au lieu d'un dessin sur canvas).
 *
 * Un calque canvas posé PAR-DESSUS la barre de choix (`.choices-bar` est
 * `relative`, le calque est `absolute inset-0`, `pointer-events: none`) : les
 * boutons restent tapables, seul leur DESSIN est rongé. Trois paliers, jamais
 * un chiffre :
 *   I   — le sel se pose sur les bordures et les encoches, par GRAPPES
 *         irrégulières : un bruit STABLE à trois sinus le long du bord décide
 *         où une grappe existe (prob .95 / .28 / .04) et de son épaisseur
 *         (1 à 3 cellules) ; la pellicule monte vers l'INTÉRIEUR du bouton.
 *   II  — ~15 % des lettres du LIBELLÉ sont couvertes, par PLAGES CONTIGUËS
 *         depuis la fin du dernier mot (deux lettres minimum : une croûte
 *         gagne, elle ne pique pas des lettres au hasard — retour du 13/09).
 *   III — ~38 %.
 * La narration n'est JAMAIS touchée (règle de la bible) : le sel ne monte que
 * sur ce qu'on peut décider. Le tag de stat (orange) n'est pas une lettre du
 * libellé : le prototype ne le couvrait pas, on ne le couvre pas.
 *
 * Deux couleurs : le sel est BLANC plein (`#ffffff`), à bords rongés par
 * densité de pixels (jamais une opacité). Cellule = 2 px d'écran, comme le
 * prototype.
 */

const QUOTA: Record<number, number> = { 1: 0, 2: 0.15, 3: 0.38 };

/** Le générateur du prototype (`rng`) : même graine → même sel, à chaque
    rendu — le calque ne scintille jamais. */
function rng(seedTexte: string): () => number {
  let s = 2166136261;
  for (let i = 0; i < seedTexte.length; i++) s = Math.imul(s ^ seedTexte.charCodeAt(i), 16777619) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Boite = { x: number; y: number; w: number; h: number };

/** Un bloc de sel : cellules blanches de 2 px à densité forte au cœur, rongé
    sur la frange — jamais un rectangle plein (prototype, verbatim). */
function bloc(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: () => number, dens: number) {
  c.fillStyle = "#ffffff";
  for (let yy = Math.floor(y / 2) * 2; yy < y + h; yy += 2) {
    for (let xx = Math.floor(x / 2) * 2; xx < x + w; xx += 2) {
      const ex = Math.min(xx - x, x + w - xx) / w;
      const ey = Math.min(yy - y, y + h - yy) / h;
      const bord = Math.min(ex, ey);
      const p = bord < 0.12 ? dens * 0.55 : dens;
      if (r() < p) c.fillRect(xx, yy, 2, 2);
    }
  }
}

/** Le sel sur la bordure d'un bouton, rendu « grappes » (prototype `selBordure`,
    verbatim : le bruit est en PIXELS le long du périmètre, les seuils .05/−.25,
    l'épaisseur 3/2/1, la pellicule vers l'intérieur, les encoches d'abord). */
function selBordure(c: CanvasRenderingContext2D, b: Boite, r: () => number, p: number) {
  c.fillStyle = "#ffffff";
  const per = 2 * (b.w + b.h);
  const bruit = (t: number) => (Math.sin(t * 0.13 + p) + Math.sin(t * 0.041 + 1.7) + Math.sin(t * 0.31)) / 3;
  for (let t = 0; t < per; t += 2) {
    let x: number;
    let y: number;
    if (t < b.w) { x = b.x + t; y = b.y; }
    else if (t < b.w + b.h) { x = b.x + b.w - 2; y = b.y + t - b.w; }
    else if (t < 2 * b.w + b.h) { x = b.x + b.w - (t - b.w - b.h) - 2; y = b.y + b.h - 2; }
    else { x = b.x; y = b.y + b.h - (t - 2 * b.w - b.h) - 2; }
    const n = bruit(t);
    const prob = n > 0.05 ? 0.95 : n > -0.25 ? 0.28 : 0.04;
    const epais = n > 0.25 ? 3 : n > 0.05 ? 2 : 1;
    if (r() < prob) {
      // la pellicule monte VERS L'INTÉRIEUR du bouton, jamais dehors — c'est
      // le bouton qui se couvre
      const dx = t < b.w ? 0 : t < b.w + b.h ? -1 : t < 2 * b.w + b.h ? 0 : 1;
      const dy = t < b.w ? 1 : t < b.w + b.h ? 0 : t < 2 * b.w + b.h ? -1 : 0;
      for (let k = 0; k < epais; k++) {
        if (k === 0 || r() < 0.7) c.fillRect(Math.round(x + dx * 2 * k), Math.round(y + dy * 2 * k), 2, 2);
      }
    }
  }
  // les encoches se remplissent en premier
  for (const [x, y] of [
    [b.x, b.y],
    [b.x + b.w - 2, b.y],
    [b.x, b.y + b.h - 2],
    [b.x + b.w - 2, b.y + b.h - 2],
  ]) {
    if (r() < 0.8 + 0.06 * p) c.fillRect(Math.round(x), Math.round(y), 2, 2);
  }
}

/** Une CROÛTE sur une plage de lettres contiguës : plus épaisse vers la fin
    du mot (c'est par là que le sel est arrivé), bords hauts et bas rongés
    par un bruit stable, quelques cristaux détachés autour — un seul corps
    (prototype `croute`, verbatim). */
function croute(c: CanvasRenderingContext2D, run: Boite[], r: () => number, force: number) {
  c.fillStyle = "#ffffff";
  const last = run[run.length - 1];
  const x0 = run[0].x - 2;
  const x1 = last.x + last.w + 2;
  const L = x1 - x0;
  const yc = run[0].y + run[0].h / 2;
  for (let xx = Math.floor(x0 / 2) * 2; xx < x1; xx += 2) {
    const u = (xx - x0) / L;
    const n = (Math.sin(xx * 0.37) + Math.sin(xx * 0.11 + 2) + Math.sin(xx * 0.73 + 1)) / 3;
    const demi = 3 + force * (4 + 5 * u) + n * 3; // demi-hauteur de la croûte
    for (let yy = Math.floor((yc - demi) / 2) * 2; yy < yc + demi; yy += 2) {
      const d = Math.abs(yy - yc) / demi;
      const p = d < 0.65 ? 0.97 : 0.97 * (1 - (d - 0.65) / 0.35) * 0.85; // cœur plein, frange rongée
      if (r() < p) c.fillRect(xx, yy, 2, 2);
    }
  }
  for (let k = 0; k < L / 4; k++) {
    const xx = x0 - 8 + r() * (L + 16);
    const yy = yc + (r() - 0.5) * 34;
    if (r() < 0.45) c.fillRect(Math.floor(xx / 2) * 2, Math.floor(yy / 2) * 2, 2, 2);
  }
}

/** Les lettres du LIBELLÉ d'un bouton (pas le tag de stat), groupées par mot,
    dans le repère du calque. */
function lettresParMot(b: HTMLButtonElement, origine: DOMRect): Boite[][] {
  const range = document.createRange();
  const mots: Boite[][] = [];
  const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    // le tag de stat est en capitales orange (`uppercase`) : hors libellé
    const parent = node.parentElement;
    if (parent && parent.closest(".uppercase")) continue;
    const txt = node.textContent ?? "";
    let mot: Boite[] = [];
    for (let i = 0; i < txt.length; i++) {
      if (/\s/.test(txt[i])) {
        if (mot.length) mots.push(mot);
        mot = [];
        continue;
      }
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const cr = range.getBoundingClientRect();
      if (cr.width > 0 && cr.height > 0) {
        mot.push({ x: cr.left - origine.left, y: cr.top - origine.top, w: cr.width, h: cr.height });
      }
    }
    if (mot.length) mots.push(mot);
  }
  return mots;
}

export default function EncrouteCTA({ palier, cle }: { palier: number; cle: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    let timer = 0;
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
      const p = Math.min(3, Math.max(1, palier));
      const r = rng(`${cle}|${p}`);
      const pr = parent.getBoundingClientRect();
      const quota = QUOTA[p] ?? 0;
      const boutons = Array.from(parent.querySelectorAll("button"));
      boutons.forEach((b) => {
        const rb = b.getBoundingClientRect();
        const boite: Boite = { x: rb.left - pr.left, y: rb.top - pr.top, w: rb.width, h: rb.height };
        // ── le sel sur le cadre (palier ≥ I)
        selBordure(ctx, boite, r, p);
        // ── le sel sur les lettres (palier ≥ II) : par PLAGES CONTIGUËS, du
        // bout d'un mot vers l'intérieur — une seule croûte irrégulière sur
        // plusieurs lettres, jamais des lettres isolées
        if (quota <= 0) return;
        const mots = lettresParMot(b, pr);
        const total = mots.reduce((n, m) => n + m.length, 0);
        let reste = Math.round(total * quota);
        for (let mi = mots.length - 1; mi >= 0 && reste > 0; mi--) {
          const l = mots[mi];
          let k = Math.min(l.length, reste);
          if (k < 2 && l.length >= 2) k = 2; // une croûte fait au moins deux lettres
          croute(ctx, l.slice(l.length - k), r, p >= 3 ? 1 : 0.7);
          reste -= k;
        }
      });
      void bloc; // gardé pour la Soif (un mot sur trois devient un bloc) — à brancher avec l'état
    };
    // FitLabel ajuste la police après le rendu et la barre revient d'un
    // display:none par un fondu : on mesure deux fois, puis on suit le resize.
    const tick = () => {
      dessiner();
      tries += 1;
      if (tries < 3) timer = window.setTimeout(tick, tries === 1 ? 60 : 420);
    };
    tick();
    const ro = new ResizeObserver(() => dessiner());
    if (cv.parentElement) ro.observe(cv.parentElement);
    return () => {
      window.clearTimeout(timer);
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
