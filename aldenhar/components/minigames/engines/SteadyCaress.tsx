"use client";

import { useEffect, useRef } from "react";
import { bayerFill, CHARBON, ORANGE } from "@/lib/dither";

/**
 * Calmer la bête (#16) : glissés lents et réguliers ; trop vite ou saccadé =
 * morsure. La créature « respire » par paliers de trame — indice du bon rythme.
 * Stat haute = fenêtre de rythme correct plus large.
 */
const W = 300,
  H = 180;

export default function SteadyCaress({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: { targetSpeed: number; tolerance: number; durationMs: number };
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let lastX = 0,
      lastT = 0;
    let goodElapsed = 0;
    let currentSpeed = 0;
    let finished = false;
    let raf = 0;
    let breathT = 0;

    function pos(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, t: performance.now() };
    }
    function onDown(e: PointerEvent) {
      const p = pos(e);
      lastX = p.x;
      lastT = p.t;
    }
    function onMove(e: PointerEvent) {
      if (finished) return;
      const p = pos(e);
      const dt = Math.max(1, p.t - lastT);
      currentSpeed = (Math.abs(p.x - lastX) / dt) * 16;
      if (Math.abs(currentSpeed - config.targetSpeed) > config.tolerance * 3) {
        finished = true;
        onResult(false);
      }
      lastX = p.x;
      lastT = p.t;
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);

    function draw() {
      raf = requestAnimationFrame(draw);
      breathT += 0.016;
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);
      const goodRhythm = Math.abs(currentSpeed - config.targetSpeed) < config.tolerance;
      if (goodRhythm) goodElapsed += 16;
      const breathe = (Math.sin(breathT * (goodRhythm ? 2.4 : 1)) + 1) / 2;
      bayerFill(ctx, W / 2 - 60, H / 2 - 40, 120, 80, 0.3 + breathe * 0.3, ORANGE, null, 3);
      ctx.fillStyle = "rgba(232,223,200,0.5)";
      ctx.font = "12px 'VT323', monospace";
      ctx.textAlign = "center";
      ctx.fillText("glisse lentement, régulièrement", W / 2, H - 14);
      if (goodElapsed >= config.durationMs && !finished) {
        finished = true;
        onResult(true);
      }
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  return <canvas ref={canvasRef} width={W} height={H} className="minigame-canvas" style={{ touchAction: "none" }} />;
}
