"use client";

import { useEffect, useRef } from "react";
import { bayerFill, CHARBON, ORANGE, seededRandom } from "@/lib/dither";
import { ZONE_W, ZONE_H, dissoudreBords } from "@/components/minigames/zone";

/**
 * LE SOUFFLE v2 — la ligne qui respire (bible des Salines, 11/09/2026 ;
 * remplace le prototype 03 « Retenir son souffle », mis en attente le 01/09).
 *
 * Une seule ligne horizontale, façon rythme, qui DÉFILE EN PALIERS — des sauts
 * de 6 à 8 px, jamais une interpolation (`config.stepPx` / `config.stepMs`).
 * Les SEGMENTS ÉPAIS sont le Ver qui respire, qui se rapproche : on appuie.
 * Les CREUX : on relâche. L'appui se dessine en pixels BLANCS sur la ligne
 * orange, au repère ; une erreur fait une TACHE de charbon, qui reste sur la
 * ligne et défile avec elle. Trois taches : repéré.
 *
 * Ce que ça demande, et ce que ça ne demande pas : de l'ATTENTION, pas de la
 * vitesse. Le motif est lisible AVANT de poser le doigt — la ligne entre par
 * la droite avec une amorce mince de quelques secondes, et l'écran montre
 * toujours ~3 s de ce qui vient. La tolérance (`config.toleranceMs`) est la
 * fenêtre, autour de chaque transition, où appuyer trop tôt ou lâcher trop
 * tard ne coûte rien : c'est elle que l'Instinct module.
 *
 * Pendant qu'on retient : immobile → le sel se dépose. Des cristaux blancs
 * s'accumulent autour du repère tant que le doigt est posé (cosmétique — c'est
 * l'État Encroûté qui fera le vrai prix, ailleurs).
 *
 * Habillage à créer (bible : « prototypes HTML » puis images) : ce moteur rend
 * la ligne sur charbon nu, aux bords dissous, à la taille de la zone de jeu.
 * Une image de fond (la passerelle vue de dessus, le trépied de la Sonde…)
 * se posera sous la ligne sans rien changer au geste.
 */
const W = ZONE_W;
const H = ZONE_H;
const LINE_Y = Math.round(H * 0.56);
const MARK_X = 112; // le repère « maintenant » — fixe, la ligne passe dessous
const THIN = 2;
const THICK = 18;

type Segment = { thick: boolean; px: number };

/** Le motif : une suite épais / mince, en PIXELS de ligne. Répétitif (deux
 *  ou trois figures qui reviennent), donc lisible avant de poser le doigt. */
function motif(rnd: () => number, longueurPx: number, amorcePx: number): Segment[] {
  const segs: Segment[] = [{ thick: false, px: amorcePx }];
  // trois figures de respiration, tirées une fois, réutilisées en boucle
  const figures = Array.from({ length: 3 }, () => ({
    thick: 70 + Math.floor(rnd() * 90),
    thin: 60 + Math.floor(rnd() * 110),
  }));
  let total = amorcePx;
  let i = 0;
  while (total < longueurPx) {
    const f = figures[i % figures.length];
    segs.push({ thick: true, px: f.thick });
    segs.push({ thick: false, px: f.thin });
    total += f.thick + f.thin;
    i++;
  }
  segs.push({ thick: false, px: 80 }); // la queue : on relâche, c'est fini
  return segs;
}

export default function BreathLine({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: {
    /** Longueur de la ligne en ms de défilement (10–15 s). */
    durationMs: number;
    /** Fenêtre de tolérance autour d'une transition (Instinct). */
    toleranceMs: number;
    /** Saut de défilement, en pixels (6–8) et sa cadence. */
    stepPx?: number;
    stepMs?: number;
    /** Nombre de taches qui font « repéré ». */
    maxStains?: number;
  };
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rnd = seededRandom(seed);
    const stepPx = config.stepPx ?? 7;
    const stepMs = config.stepMs ?? 60;
    const maxStains = config.maxStains ?? 3;
    const pxParMs = stepPx / stepMs;
    const amorcePx = Math.round(2600 * pxParMs); // ~2,6 s de ligne mince avant le premier souffle
    const longueurPx = Math.round(config.durationMs * pxParMs);
    const segs = motif(rnd, longueurPx, amorcePx);
    const finPx = segs.reduce((n, s) => n + s.px, 0);
    canvas.dataset.fin = String(finPx);

    // état
    let holding = false;
    let scroll = 0; // décalage de la ligne, en pixels ENTIERS (steps)
    let lastStep = performance.now();
    let finished = false;
    let raf = 0;
    let mismatchDepuis: number | null = null; // début de l'écart courant, en px de ligne
    let tacheFaite = false; // une tache par épisode d'écart, pas une par pas
    const taches: number[] = []; // positions sur la LIGNE (défilent avec elle)
    const encre: number[] = []; // pixels blancs posés pendant l'appui (px de ligne)
    const sel: { x: number; y: number }[] = []; // cristaux autour du repère
    const tolPx = config.toleranceMs * pxParMs;

    function epaisA(lineX: number): boolean {
      let acc = 0;
      for (const s of segs) {
        if (lineX < acc + s.px) return s.thick;
        acc += s.px;
      }
      return false;
    }
    /** Distance (px de ligne) à la transition la plus proche — pour la tolérance. */
    function distanceTransition(lineX: number): number {
      let acc = 0;
      let best = Infinity;
      for (const s of segs) {
        best = Math.min(best, Math.abs(lineX - acc));
        acc += s.px;
      }
      return Math.min(best, Math.abs(lineX - acc));
    }

    function onDown() {
      if (finished) return;
      holding = true;
    }
    function onUp() {
      holding = false;
    }
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    function tick(now: number) {
      // défilement PAR PALIERS : un saut entier toutes les stepMs, jamais un
      // déplacement fractionnaire
      while (now - lastStep >= stepMs) {
        lastStep += stepMs;
        scroll += stepPx;
        // mesurable de l'extérieur (bancs) : le pas, l'appui, les taches —
        // jamais lu par le jeu, jamais affiché
        canvas!.dataset.scroll = String(scroll);
        canvas!.dataset.holding = holding ? "1" : "0";
        canvas!.dataset.taches = String(taches.length);
        const lineX = scroll + MARK_X; // ce qui est sous le repère, en px de ligne
        if (lineX >= finPx) {
          if (!finished) {
            finished = true;
            onResult(taches.length < maxStains);
          }
          return;
        }
        const attendu = epaisA(lineX);
        const dansTolerance = distanceTransition(lineX) <= tolPx;
        if (holding) encre.push(lineX);
        if (holding && sel.length < 260 && rnd() < 0.6) {
          sel.push({ x: MARK_X + (rnd() - 0.5) * 44, y: LINE_Y + (rnd() - 0.5) * 60 });
        }
        if (holding !== attendu && !dansTolerance) {
          if (mismatchDepuis === null) mismatchDepuis = lineX;
          if (!tacheFaite) {
            taches.push(lineX);
            tacheFaite = true;
            if (taches.length >= maxStains && !finished) {
              finished = true;
              onResult(false);
              return;
            }
          }
        } else {
          mismatchDepuis = null;
          tacheFaite = false;
        }
      }
    }

    function draw() {
      raf = requestAnimationFrame(draw);
      const now = performance.now();
      if (!finished) tick(now);
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);

      // la ligne, segment par segment, décalée de `scroll`
      let acc = 0;
      for (const s of segs) {
        const x0 = acc - scroll;
        const x1 = x0 + s.px;
        acc += s.px;
        if (x1 < 0 || x0 > W) continue;
        const h = s.thick ? THICK : THIN;
        const xa = Math.max(0, Math.floor(x0));
        const xb = Math.min(W, Math.ceil(x1));
        if (s.thick) {
          // un souffle : le segment monte par marches aux deux bouts, jamais
          // une pente lisse
          const marche = 6;
          for (let x = xa; x < xb; x++) {
            const d = Math.min(x - x0, x1 - x);
            const hh = Math.min(h, THIN + Math.floor(d / marche) * 4);
            ctx.fillStyle = ORANGE;
            ctx.fillRect(x, LINE_Y - Math.floor(hh / 2), 1, hh);
          }
          bayerFill(ctx, xa, LINE_Y - Math.floor(h / 2), xb - xa, h, 0.35, CHARBON, null, 2);
        } else {
          ctx.fillStyle = ORANGE;
          ctx.fillRect(xa, LINE_Y - 1, xb - xa, THIN);
        }
      }

      // l'encre de l'appui : pixels blancs SUR la ligne, là où le doigt était
      ctx.fillStyle = "#ffffff";
      for (const lx of encre) {
        const x = lx - scroll;
        if (x < -2 || x > W) continue;
        for (let k = 0; k < stepPx; k += 2) ctx.fillRect(Math.floor(x + k), LINE_Y - 1 + ((lx + k) % 3 === 0 ? 1 : 0), 1, 1);
      }

      // les taches : du charbon qui reste sur la ligne, aux bords rongés
      for (const lx of taches) {
        const x = Math.floor(lx - scroll);
        if (x < -20 || x > W + 20) continue;
        ctx.fillStyle = CHARBON;
        ctx.fillRect(x - 6, LINE_Y - 13, 14, 26);
        bayerFill(ctx, x - 10, LINE_Y - 16, 22, 32, 0.45, CHARBON, null, 2);
      }

      // le sel déposé pendant l'immobilité
      ctx.fillStyle = "#ffffff";
      for (const s of sel) ctx.fillRect(Math.floor(s.x), Math.floor(s.y), 1, 1);

      // le repère « maintenant » : tirets blancs au-dessus et au-dessous
      ctx.fillStyle = "#ffffff";
      for (let y = LINE_Y - 40; y < LINE_Y - 14; y += 4) ctx.fillRect(MARK_X, y, 1, 2);
      for (let y = LINE_Y + 14; y < LINE_Y + 40; y += 4) ctx.fillRect(MARK_X, y, 1, 2);
      if (holding) {
        ctx.fillRect(MARK_X - 1, LINE_Y - 12, 3, 3);
        ctx.fillRect(MARK_X - 1, LINE_Y + 10, 3, 3);
      }

      // le compte des taches, en carrés (jamais un chiffre) : plein = restant
      for (let i = 0; i < maxStains; i++) {
        const x = W / 2 - (maxStains * 14) / 2 + i * 14;
        if (i < maxStains - taches.length) {
          ctx.fillStyle = ORANGE;
          ctx.fillRect(x, H - 96, 7, 7);
        } else {
          ctx.strokeStyle = "rgba(255,255,255,0.3)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, H - 96 + 0.5, 6, 6);
        }
      }

      dissoudreBords(ctx, W, H);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="minigame-canvas"
      style={{ touchAction: "none" }}
      data-engine="breath"
    />
  );
}
