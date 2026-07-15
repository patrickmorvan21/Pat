"use client";

import { useEffect, useRef } from "react";
import { bayerFill, CHARBON, ORANGE } from "@/lib/dither";

/**
 * Montrer une séquence puis la reproduire (ordre exact ou inverse), cadence
 * croissante. Couvre : Les chandelles du rituel (#20, ordre inverse),
 * La dague entre les doigts (#06, ordre imposé, cadence accélérée).
 */
const W = 300,
  H = 200;

export default function SequenceExecute({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: { count: number; reverse?: boolean; showMs?: number };
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const n = config.count;
    const positions = Array.from({ length: n }, (_, i) => ({
      x: (W / (n + 1)) * (i + 1),
      y: H / 2,
    }));
    const order = config.reverse ? [...Array(n).keys()].reverse() : [...Array(n).keys()];
    let phase: "show" | "input" = "show";
    let phaseStart = performance.now();
    const showMs = config.showMs ?? 700;
    let inputIndex = 0;
    let finished = false;
    let raf = 0;

    function pos(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    }
    function onDown(e: PointerEvent) {
      if (phase !== "input" || finished) return;
      const p = pos(e);
      let closest = 0,
        bestDist = Infinity;
      positions.forEach((pp, i) => {
        const d = Math.hypot(p.x - pp.x, p.y - pp.y);
        if (d < bestDist) {
          bestDist = d;
          closest = i;
        }
      });
      if (bestDist > 30) return;
      if (closest === order[inputIndex]) {
        inputIndex++;
        if (inputIndex >= order.length) {
          finished = true;
          onResult(true);
        }
      } else {
        finished = true;
        onResult(false);
      }
    }
    canvas.addEventListener("pointerdown", onDown);

    function draw() {
      raf = requestAnimationFrame(draw);
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);
      const elapsed = performance.now() - phaseStart;
      if (phase === "show") {
        const idx = Math.floor(elapsed / showMs);
        positions.forEach((p, i) => {
          const active = order[idx] === i;
          bayerFill(ctx, p.x - 18, p.y - 18, 36, 36, active ? 0.9 : 0.2, ORANGE, null, 2);
        });
        if (idx >= order.length) {
          phase = "input";
          phaseStart = performance.now();
        }
      } else {
        positions.forEach((p, i) => {
          const done = order.indexOf(i) < inputIndex;
          bayerFill(ctx, p.x - 18, p.y - 18, 36, 36, done ? 0.15 : 0.5, ORANGE, null, 2);
        });
        ctx.fillStyle = "rgba(232,223,200,0.5)";
        ctx.font = "12px 'Roboto Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${config.reverse ? "ordre inverse" : "reproduis l'ordre"}`, W / 2, H - 14);
      }
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  return <canvas ref={canvasRef} width={W} height={H} className="minigame-canvas" style={{ touchAction: "none" }} />;
}
