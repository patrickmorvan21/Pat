"use client";

import { useEffect, useRef } from "react";
import { bayerFill, CHARBON, CREME, ORANGE, seededRandom } from "@/lib/dither";

/**
 * Crochetage (référence #4, « meilleur du lot ») : fenêtre de réussite qui
 * s'élargit avec la stat, tap au bon moment. Rendu toujours tramé/bruité,
 * jamais un rectangle plein et net. Trois modes réutilisent ce moteur :
 * - "track" : PISTE HORIZONTALE, curseur qui fait l'aller-retour, on tape
 *   quand il passe dans la gorge orange (Crochetage).
 *
 * ⚠️ LA PISTE EST REVENUE (29/08). La passe « réalisme » du 11/07 avait
 * remplacé la piste par un ÉVENTAIL (crochet pivotant dans un trou de serrure,
 * goupilles en rayons). Arbitrage de Patrick : il préférait la piste — elle se
 * lit d'un coup d'œil, l'éventail demandait de suivre une pointe sur un arc.
 * Ne pas « re-réaliser » ce mini-jeu sans arbitrage : ici la lisibilité prime.
 *
 * ⚠️ Et une serrure a PLUSIEURS goupilles (`config.goupilles`, 29/08) : il
 * faut réussir N taps, pas un seul. C'est ce qui sépare un test de réflexe
 * d'un crochetage — chaque goupille tombe, la gorge se déplace, le curseur
 * accélère d'un cran, et les ratés se comptent sur l'ensemble.
 * - "release" : maintenir puis relâcher au frémissement (Piège à mâchoire).
 * - "point" : taper la bonne zone sur un sceau fissuré (Sceau de cire).
 */
const W = 300,
  H = 160;

export default function TimingTap({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: {
    mode: "track" | "release" | "point";
    windowWidth: number; // 0..1 fraction de la piste, ou tolérance angulaire pour "point"
    speed?: number;
    maxAttempts?: number;
    goupilles?: number; // "track" : nombre de taps réussis pour ouvrir (défaut 1)
  };
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rnd = seededRandom(seed);
    let raf = 0;
    let t = 0;
    let finished = false;
    let attemptsLeft = config.maxAttempts ?? 1;
    let windowCenter = 0.5 + (rnd() - 0.5) * 0.3;
    const speed = config.speed ?? 0.9;
    /* Les goupilles : chacune a SA gorge et fait accélérer le curseur d'un
       cran. La dernière est la plus tendue — c'est le rythme d'une serrure,
       jamais une difficulté cachée (le nombre restant se VOIT sur la piste). */
    const goupilles = Math.max(1, config.goupilles ?? 1);
    let tombees = 0;
    let vitesse = speed;
    let eclat = 0; // frames de flash blanc quand une goupille cède
    let holding = false;
    let releaseArmed = false;
    const snapAt = 0.82 + rnd() * 0.1;

    function finish(success: boolean) {
      if (finished) return;
      finished = true;
      onResult(success);
    }

    function trackPos() {
      // va-et-vient 0..1
      const cycle = (t * vitesse) % 2;
      return cycle <= 1 ? cycle : 2 - cycle;
    }

    function onDown(e: PointerEvent) {
      if (finished) return;
      if (config.mode === "track") {
        const p = trackPos();
        if (Math.abs(p - windowCenter) < config.windowWidth / 2) {
          tombees += 1;
          eclat = 9;
          if (tombees >= goupilles) finish(true);
          else {
            windowCenter = 0.5 + (rnd() - 0.5) * 0.44;
            vitesse *= 1.12;
          }
        } else {
          attemptsLeft--;
          if (attemptsLeft <= 0) finish(false);
        }
      } else if (config.mode === "release") {
        holding = true;
        t = 0;
      } else if (config.mode === "point") {
        const r = canvas!.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const angle = (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2);
        const target = windowCenter * Math.PI * 2;
        let diff = Math.abs(angle - target);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff < (config.windowWidth * Math.PI) / 2) finish(true);
        else {
          attemptsLeft--;
          if (attemptsLeft <= 0) finish(false);
        }
      }
    }
    function onUp() {
      if (config.mode !== "release" || !holding || finished) return;
      holding = false;
      const progress = t / 1.4;
      finish(progress >= snapAt - config.windowWidth && progress <= snapAt + 0.02);
    }
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    function draw() {
      raf = requestAnimationFrame(draw);
      t += 0.016;
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);

      if (config.mode === "track") {
        /* LA PISTE (restaurée le 29/08 — voir le docblock). Une ligne
           horizontale, une gorge orange tramée, un curseur qui fait
           l'aller-retour. Tout se lit d'un coup d'œil, sans suivre un arc. */
        const trackY = H / 2 + 6;
        const x0 = 30,
          x1 = W - 30;

        // La piste : un trait rongé, jamais un rectangle net (DA §4).
        for (let x = x0; x < x1; x += 2) {
          const jitter = ((x * 7919) % 3) - 1;
          ctx.fillStyle = "rgba(255,255,255,0.26)";
          ctx.fillRect(x, trackY - 2 + jitter, 2, 4);
        }

        // LA GORGE : la fenêtre de réussite, tramée orange.
        const winX = x0 + (windowCenter - config.windowWidth / 2) * (x1 - x0);
        const winW = config.windowWidth * (x1 - x0);
        bayerFill(ctx, winX, trackY - 11, winW, 22, 0.85, ORANGE, null, 2);
        // Deux montants qui bornent la gorge — on vise entre eux.
        ctx.fillStyle = ORANGE;
        ctx.fillRect(winX - 1, trackY - 17, 2, 12);
        ctx.fillRect(winX + winW - 1, trackY - 17, 2, 12);

        // LES GOUPILLES : une encoche par goupille, remplie quand elle cède.
        if (goupilles > 1) {
          const pas = 18;
          const bx = W / 2 - ((goupilles - 1) * pas) / 2;
          for (let k = 0; k < goupilles; k++) {
            const gx = bx + k * pas;
            const gy = trackY - 48;
            if (k < tombees) {
              bayerFill(ctx, gx - 5, gy - 5, 10, 10, 1, CREME, null, 2);
            } else {
              ctx.strokeStyle = "rgba(255,255,255,0.32)";
              ctx.lineWidth = 1;
              ctx.strokeRect(gx - 5.5, gy - 5.5, 11, 11);
            }
          }
        }

        // LE CURSEUR : le crochet qui court sur la piste.
        const px = x0 + trackPos() * (x1 - x0);
        bayerFill(ctx, px - 5, trackY - 18, 10, 36, 1, CREME, null, 2);

        // La goupille qui cède : un éclat bref, en paliers (jamais un fondu).
        if (eclat > 0) {
          eclat -= 1;
          if (eclat % 3 !== 1) {
            bayerFill(ctx, x0, trackY - 26, x1 - x0, 52, 0.35, CREME, null, 2);
          }
        }
      } else if (config.mode === "release") {
        const progress = Math.min(1, t / 1.4);
        const barW = (W - 60) * progress;
        ctx.strokeStyle = "rgba(232,223,200,0.3)";
        ctx.strokeRect(30, H / 2 - 10, W - 60, 20);
        bayerFill(ctx, 30, H / 2 - 10, barW, 20, 1, holding ? ORANGE : "rgba(232,223,200,0.4)", null, 2);
        const jitterZoneX = 30 + (snapAt - config.windowWidth) * (W - 60);
        releaseArmed = progress >= snapAt - config.windowWidth;
        if (releaseArmed && progress < snapAt) {
          bayerFill(ctx, jitterZoneX, H / 2 - 14, config.windowWidth * (W - 60), 28, 0.6, ORANGE, null, 2);
        }
        if (holding && progress >= snapAt + 0.02) finish(false);
      } else if (config.mode === "point") {
        const cx = W / 2,
          cy = H / 2,
          R = 60;
        // Fissures visibles = indice
        const fissures = 6;
        ctx.strokeStyle = "rgba(232,223,200,0.5)";
        ctx.lineWidth = 1;
        for (let i = 0; i < fissures; i++) {
          const a = (i / fissures) * Math.PI * 2 + rnd() * 0.1;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9);
          ctx.stroke();
        }
        bayerFill(ctx, cx - R, cy - R, R * 2, R * 2, 0.5, ORANGE, null, 3);
        const target = windowCenter * Math.PI * 2;
        ctx.fillStyle = CREME;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, R + 6, target - 0.15, target + 0.15);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  return <canvas ref={canvasRef} width={W} height={H} className="minigame-canvas" style={{ touchAction: "none" }} />;
}
