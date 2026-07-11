"use client";

import { useEffect, useRef } from "react";
import { bayerFillClipped, CHARBON, ORANGE, seededRandom } from "@/lib/dither";

/**
 * Retenir son souffle (référence #3) : appui maintenu, ne pas relâcher (et,
 * selon config, ne pas trop bouger). La lisibilité de la fin dépend de la
 * stat (Instinct/Courage) — purement visuelle, jamais un prérequis sonore.
 * Réutilisé par : Endiguer le sang, La main dans le trou.
 *
 * Rendu détaillé (passe réalisme 11/07) : une silhouette de créature dérive
 * lentement à travers l'écran pendant que tu tiens l'appui — bien plus
 * parlant qu'un simple anneau de progression abstrait.
 */
const W = 300,
  H = 180;

function drawBeast(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, alarmed: boolean) {
  // Silhouette basse, allongée — corps + tête tournée si "alarmed"
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = CHARBON;
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // pattes
  for (const dx of [-28, -8, 14, 32]) {
    ctx.fillRect(dx, 10, 4, 14);
  }
  // tête (tournée vers le joueur si alarmed)
  ctx.save();
  ctx.translate(40, -4);
  if (alarmed) ctx.scale(-1, 1);
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

export default function HoldSteady({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: { durationMs: number; noMove?: boolean; clearCue?: boolean; grazeCount?: number };
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rnd = seededRandom(seed);
    let holding = false;
    let startAt = 0;
    let elapsed = 0;
    let anchor = { x: W / 2, y: H / 2 };
    let finished = false;
    let raf = 0;
    const grazes: { t: number }[] = [];
    for (let i = 0; i < (config.grazeCount ?? 4); i++) grazes.push({ t: 0.15 + rnd() * 0.7 });
    const groundY = H - 44;

    function pos(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    }
    function onDown(e: PointerEvent) {
      if (finished) return;
      holding = true;
      startAt = performance.now();
      anchor = pos(e);
    }
    function onMove(e: PointerEvent) {
      if (!holding || finished || !config.noMove) return;
      const p = pos(e);
      if (Math.hypot(p.x - anchor.x, p.y - anchor.y) > 16) {
        finished = true;
        holding = false;
        onResult(false);
      }
    }
    function onUp() {
      if (!finished && holding && elapsed < config.durationMs) {
        finished = true;
        onResult(false);
      }
      holding = false;
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    function draw() {
      raf = requestAnimationFrame(draw);
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);
      // Sol tramé (bande basse)
      bayerFillClipped(ctx, (c) => c.rect(0, groundY, W, H - groundY), 0, groundY, W, H - groundY, 0.28, ORANGE, 3);
      ctx.strokeStyle = "rgba(232,223,200,0.2)";
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(W, groundY);
      ctx.stroke();

      if (holding && !finished) {
        elapsed = performance.now() - startAt;
        const progress = Math.min(1, elapsed / config.durationMs);
        // Créature qui traverse lentement, de gauche à droite
        const beastX = -60 + progress * (W + 120);
        const alarmed = grazes.some((g) => Math.abs(progress - g.t) < 0.05);
        drawBeast(ctx, beastX, groundY - 6, 0.85, alarmed);
        if (alarmed) {
          // secousse visuelle discrète de l'écran, jamais sonore
          bayerFillClipped(ctx, (c) => c.rect(0, 0, W, H), 0, 0, W, H, 0.05, ORANGE, 4);
        }
        // Jauge de souffle : demi-anneau gravé en haut
        const cx = W / 2,
          cy = 26,
          R = 40;
        ctx.strokeStyle = "rgba(232,223,200,0.25)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, R, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, R, Math.PI, Math.PI + Math.PI * progress);
        ctx.stroke();
        if (config.clearCue && progress > 0.82) {
          ctx.fillStyle = "rgba(232,223,200,0.6)";
          ctx.font = "12px 'VT323', monospace";
          ctx.textAlign = "center";
          ctx.fillText("elle s'éloigne…", cx, cy + 16);
        }
        if (progress >= 1 && !finished) {
          finished = true;
          onResult(true);
        }
      } else if (!finished) {
        drawBeast(ctx, W / 2, groundY - 6, 0.85, false);
        ctx.fillStyle = "rgba(232,223,200,0.5)";
        ctx.font = "13px 'VT323', monospace";
        ctx.textAlign = "center";
        ctx.fillText("maintiens l'appui, ne bouge pas", W / 2, 30);
      }
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  return <canvas ref={canvasRef} width={W} height={H} className="minigame-canvas" style={{ touchAction: "none" }} />;
}
