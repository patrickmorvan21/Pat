"use client";

import { useEffect, useRef } from "react";
import { bayerFill, bayerFillClipped, CHARBON, CREME, erodedRectPath, ORANGE, seededRandom } from "@/lib/dither";

/**
 * Crochetage (référence #4, « meilleur du lot ») : fenêtre de réussite qui
 * s'élargit avec la stat, tap au bon moment. Rendu toujours tramé/bruité,
 * jamais un rectangle plein et net. Trois modes réutilisent ce moteur :
 * - "track" : curseur oscillant, taper dans la fenêtre (Crochetage).
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
    const windowCenter = 0.5 + (rnd() - 0.5) * 0.3;
    const speed = config.speed ?? 0.9;
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
      const cycle = (t * speed) % 2;
      return cycle <= 1 ? cycle : 2 - cycle;
    }

    function onDown(e: PointerEvent) {
      if (finished) return;
      if (config.mode === "track") {
        const p = trackPos();
        if (Math.abs(p - windowCenter) < config.windowWidth / 2) finish(true);
        else {
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
        const pivot = { x: W / 2, y: H - 4 };
        const armR = 108;
        const angleStart = Math.PI * 1.12;
        const angleEnd = Math.PI * 1.88;
        const sweep = angleEnd - angleStart;

        // Plaque de serrure gravée
        erodedRectPath(ctx, 14, 8, W - 28, H - 20, rnd, "rgba(232,223,200,0.3)", 16);

        // Silhouette du trou de serrure au pivot
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.beginPath();
        ctx.arc(pivot.x, pivot.y - 14, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(pivot.x - 4, pivot.y - 8);
        ctx.lineTo(pivot.x + 4, pivot.y - 8);
        ctx.lineTo(pivot.x + 7, pivot.y + 4);
        ctx.lineTo(pivot.x - 7, pivot.y + 4);
        ctx.closePath();
        ctx.fill();

        // Fenêtre de réussite = lueur tramée sur l'arc
        const winStartA = angleStart + (windowCenter - config.windowWidth / 2) * sweep;
        const winEndA = angleStart + (windowCenter + config.windowWidth / 2) * sweep;
        bayerFillClipped(
          ctx,
          (c) => {
            c.moveTo(pivot.x, pivot.y);
            c.arc(pivot.x, pivot.y, armR + 14, winStartA, winEndA);
            c.closePath();
          },
          pivot.x - armR - 14,
          pivot.y - armR - 14,
          (armR + 14) * 2,
          (armR + 14) * 2,
          0.55,
          ORANGE,
          2
        );

        // Piste (arc de guidage)
        ctx.strokeStyle = "rgba(232,223,200,0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pivot.x, pivot.y, armR, angleStart, angleEnd);
        ctx.stroke();

        // Goupilles (tumblers) en éventail — celle qui coïncide avec la fenêtre s'illumine
        const pinCount = 7;
        for (let i = 0; i < pinCount; i++) {
          const frac = i / (pinCount - 1);
          const a = angleStart + frac * sweep;
          const isTarget = Math.abs(frac - windowCenter) < config.windowWidth / 2 + 0.05;
          const x1 = pivot.x + Math.cos(a) * (armR - 10);
          const y1 = pivot.y + Math.sin(a) * (armR - 10);
          const x2 = pivot.x + Math.cos(a) * (armR + 8);
          const y2 = pivot.y + Math.sin(a) * (armR + 8);
          ctx.strokeStyle = isTarget ? ORANGE : "rgba(232,223,200,0.28)";
          ctx.lineWidth = isTarget ? 3 : 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Le crochet : bras rigide depuis le pivot jusqu'à sa position actuelle
        const pAngle = angleStart + trackPos() * sweep;
        const tipX = pivot.x + Math.cos(pAngle) * armR;
        const tipY = pivot.y + Math.sin(pAngle) * armR;
        ctx.strokeStyle = CREME;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pivot.x, pivot.y - 10);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        ctx.fillStyle = CREME;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
        ctx.fill();
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
