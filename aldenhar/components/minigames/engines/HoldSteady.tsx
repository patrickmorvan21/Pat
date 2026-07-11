"use client";

import { useEffect, useRef } from "react";
import { bayerFill, CHARBON, ORANGE, seededRandom } from "@/lib/dither";

/**
 * Retenir son souffle (référence #3) : appui maintenu, ne pas relâcher (et,
 * selon config, ne pas trop bouger). La lisibilité de la fin dépend de la
 * stat (Instinct/Courage) — purement visuelle, jamais un prérequis sonore.
 * Réutilisé par : Endiguer le sang, La main dans le trou.
 */
const W = 300,
  H = 180;

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
    const grazes: { x: number; y: number; t: number }[] = [];
    for (let i = 0; i < (config.grazeCount ?? 4); i++) {
      grazes.push({ x: rnd() * W, y: rnd() * H, t: rnd() });
    }

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
      if (holding && !finished) {
        elapsed = performance.now() - startAt;
        const progress = Math.min(1, elapsed / config.durationMs);
        // Anneau de progression tramé
        const cx = W / 2,
          cy = H / 2,
          R = 55;
        for (let a = 0; a < Math.PI * 2 * progress; a += 0.05) {
          const x = cx + Math.cos(a - Math.PI / 2) * R;
          const y = cy + Math.sin(a - Math.PI / 2) * R;
          bayerFill(ctx, x - 2, y - 2, 4, 4, 0.9, ORANGE, null, 2);
        }
        // Frôlements (visuels, jamais sonores)
        grazes.forEach((g) => {
          if (Math.abs(progress - g.t) < 0.06) {
            bayerFill(ctx, g.x - 10, g.y - 10, 20, 20, 0.5, ORANGE, null, 3);
          }
        });
        if (config.clearCue && progress > 0.85) {
          ctx.fillStyle = ORANGE;
          ctx.font = "14px 'VT323', monospace";
          ctx.textAlign = "center";
          ctx.fillText("presque…", cx, cy + R + 24);
        }
        if (progress >= 1 && !finished) {
          finished = true;
          onResult(true);
        }
      } else if (!finished) {
        ctx.fillStyle = "rgba(232,223,200,0.5)";
        ctx.font = "13px 'VT323', monospace";
        ctx.textAlign = "center";
        ctx.fillText("Maintiens l'appui", W / 2, H / 2);
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
