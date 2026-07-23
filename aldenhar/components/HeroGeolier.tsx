"use client";

import { useEffect, useRef } from "react";
import { animReduced } from "@/lib/settings";

/* ---- Réglages repris tels quels du prototype validé (ne pas lisser) ---- */
const TICK = 90; /* ms par pas de simulation */
/* Respiration par PALIERS ENTIERS — aucune transition CSS, aucun easing. */
const BREATH = [0, -1, -2, -3, -3, -3, -2, -1, 0, 0, 0];
const CHARBON = "#1c1a16";

type Wisp = { x: number; y: number; v: number; sway: number; f: number; seed: number; age: number };

/**
 * Héros animé : 3 couches — canvas de fumée (dessous), Geôlier détouré
 * (devant, `position:relative`), bande « sol » charbon de 4px tout en bas
 * (masque la ligne révélée quand l'image respire vers le haut).
 * `density`/`bstep` pilotables pour la progression dramatique du prologue
 * (cendres 2→5 à chaque choix, respiration 380→520ms au dernier — 16/07) ;
 * l'accueil garde les valeurs du prototype (2 / 380).
 */
export function HeroGeolier({ density = 2, bstep = 380 }: { density?: number; bstep?: number }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    const cv = canvasRef.current;
    if (!img || !cv) return;
    const ctx = cv.getContext("2d")!;
    // Image fixe (pas de fumée/respiration) si mouvement réduit système OU
    // réglage « Animations : réduites » (Options 21/07).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || animReduced()) return;
    const DENSITY = density;
    const BSTEP = bstep;

    /* canvas à 1/3 de la taille CSS : pixels ~3px affichés, échelle trame */
    let W = 0;
    let H = 0;
    let seeded = false;
    const wisps: Wisp[] = [];

    const newWisp = (): Wisp => ({
      x: Math.random() * W,
      y: H + 2,
      v: 0.55 + Math.random() * 0.45,
      sway: 0.4 + Math.random() * 0.5,
      f: 0.1 + Math.random() * 0.12,
      seed: Math.random() * 6.283,
      age: 0,
    });

    /* Peuple la colonne d'ascension à toutes les hauteurs dès le chargement —
       sinon il faut plusieurs secondes pour que les premières cendres, nées
       tout en bas, remontent jusqu'à devenir visibles (prototype validé). */
    const seedWisps = () => {
      const CEIL = H / 3;
      const n = (DENSITY * H) / 2 | 0;
      for (let i = 0; i < n; i++) {
        const w = newWisp();
        w.y = CEIL + Math.random() * (H - CEIL);
        w.age = ((H - w.y) / w.v) | 0;
        wisps.push(w);
      }
    };

    const fit = () => {
      const r = img.getBoundingClientRect();
      if (!r.width) return;
      W = Math.round(r.width / 3);
      H = Math.round(r.height / 3);
      cv.width = W;
      cv.height = H;
      if (!seeded && W > 0 && H > 0) {
        seeded = true;
        seedWisps();
      }
    };
    const ro = new ResizeObserver(fit);
    ro.observe(img);
    if (img.decode) img.decode().then(fit).catch(fit);
    else img.addEventListener("load", fit);

    /* respiration : montée/descente par paliers entiers */
    let bIdx = 0;
    let bAcc = 0;

    const step = () => {
      bAcc += TICK;
      if (bAcc >= BSTEP) {
        bAcc -= BSTEP;
        bIdx = (bIdx + 1) % BREATH.length;
        img.style.transform = `translateY(${BREATH[bIdx]}px)`;
      }
      for (let i = 0; i < DENSITY; i++) wisps.push(newWisp());
      const CEIL = H / 3; /* les cendres meurent aux 2/3 de la montée */
      for (let i = wisps.length - 1; i >= 0; i--) {
        const s = wisps[i];
        s.age++;
        s.y -= s.v;
        if (s.y <= CEIL) wisps.splice(i, 1);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = CHARBON;
      for (const s of wisps) {
        /* raréfaction en approchant de la ligne des 2/3 : de plus en plus de
           cendres « sautent » des frames, puis plus rien — jamais d'alpha */
        const fade = Math.min(1, (s.y - H / 3) / (H * 0.28));
        if (Math.random() > 0.15 + fade * 0.85) continue;
        const x = (s.x + Math.sin(s.age * s.f + s.seed) * s.sway * 3) | 0;
        ctx.fillRect(x, s.y | 0, 1, 1); /* carré de 1px, strictement */
      }
    };

    let acc = 0;
    let last = 0;
    let raf = 0;
    const loop = (t: number) => {
      if (!last) last = t;
      acc += t - last;
      last = t;
      while (acc >= TICK) {
        acc -= TICK;
        step();
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // Changement de cadence (prologue) : la boucle redémarre, seedWisps
    // repeuple immédiatement — jamais d'écran vide.
  }, [density, bstep]);

  return (
    <div className="relative h-[368px] shrink-0 overflow-hidden bg-[var(--color-accent)]">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated" }}
        aria-hidden
      />
      {/* L'image (1560×1720) est plus haute que le héros : posée en haut,
          le bas du buste est coupé par la frontière charbon (maquette).
          position:relative + z-2 : elle passe DEVANT le canvas et le sol. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        alt=""
        src="assets/geolier_detoure.png"
        className="relative z-[2] mt-[40px] block w-full select-none"
        style={{ imageRendering: "pixelated", transform: "translateY(0)" }}
      />
      {/* sol charbon : couvre la bande révélée sous l'image quand elle monte */}
      <div className="absolute inset-x-0 bottom-0 z-[1] h-[4px] bg-[var(--color-bg)]" aria-hidden />
    </div>
  );
}
