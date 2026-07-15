"use client";

import { useEffect, useRef } from "react";
import { CHARBON, CREME, ORANGE } from "@/lib/dither";

/**
 * L'amputation (#10) : trancher net d'un swipe unique, rapide et rectiligne.
 * Hésiter (lent ou courbe) aggrave. Stat haute = tolérance de courbure plus large.
 */
const W = 300,
  H = 200;

export default function StraightSwipe({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: { minLength: number; maxDurationMs: number; maxDeviation: number };
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let points: { x: number; y: number }[] = [];
    let startT = 0;
    let finished = false;
    let raf = 0;

    function pos(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    }
    function onDown(e: PointerEvent) {
      points = [pos(e)];
      startT = performance.now();
    }
    function onMove(e: PointerEvent) {
      if (points.length === 0 || finished) return;
      points.push(pos(e));
    }
    function onUp() {
      if (points.length < 2 || finished) return;
      const dur = performance.now() - startT;
      const a = points[0],
        b = points[points.length - 1];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      // Déviation max par rapport à la droite a-b
      let maxDev = 0;
      const dx = b.x - a.x,
        dy = b.y - a.y;
      const norm = Math.hypot(dx, dy) || 1;
      points.forEach((p) => {
        const dev = Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / norm;
        maxDev = Math.max(maxDev, dev);
      });
      const ok = length >= config.minLength && dur <= config.maxDurationMs && maxDev <= config.maxDeviation;
      finished = true;
      onResult(ok);
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    function draw() {
      raf = requestAnimationFrame(draw);
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      if (!finished) {
        ctx.fillStyle = CREME;
        ctx.globalAlpha = 0.4;
        ctx.font = "12px 'Roboto Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("Un seul geste, net et rapide", W / 2, H - 14);
        ctx.globalAlpha = 1;
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
