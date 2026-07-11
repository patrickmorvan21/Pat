"use client";

import { useEffect, useRef } from "react";
import { bayerFill, CHARBON, ORANGE, seededRandom } from "@/lib/dither";

/**
 * Choisir la bonne cible parmi plusieurs, avec indice visuel modulé par la
 * stat (jamais un simple surlignage net). Couvre : La statue qui bouge (#14),
 * Le mendiant aux trois mains (#19), Les latrines du charnier (#13).
 */
const W = 300,
  H = 200;

export default function PickTarget({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: { count: number; hintStrength: number; jitterCorrect?: "loose" | "tight" | "none" };
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rnd = seededRandom(seed);
    const count = config.count;
    const correct = Math.floor(rnd() * count);
    const positions = Array.from({ length: count }, (_, i) => ({
      x: (W / (count + 1)) * (i + 1),
      y: H / 2,
    }));
    let finished = false;
    let raf = 0;
    let t = 0;

    function pos(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    }
    function onDown(e: PointerEvent) {
      if (finished) return;
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
      if (bestDist < 34) {
        finished = true;
        onResult(closest === correct);
      }
    }
    canvas.addEventListener("pointerdown", onDown);

    function draw() {
      raf = requestAnimationFrame(draw);
      t += 0.016;
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);
      positions.forEach((p, i) => {
        const isCorrect = i === correct;
        // hintStrength (0..1, module par stat) : la bonne cible a une densité
        // légèrement différente / un jitter distinct — jamais un net highlight.
        let density = 0.4;
        let jitterX = 0,
          jitterY = 0;
        if (isCorrect) {
          density = 0.4 + config.hintStrength * 0.35;
          if (config.jitterCorrect === "tight") {
            jitterX = Math.sin(t * 9) * 1.2 * config.hintStrength;
          } else if (config.jitterCorrect === "loose") {
            jitterX = Math.sin(t * 2.3) * 3 * config.hintStrength;
            jitterY = Math.cos(t * 2.1) * 2 * config.hintStrength;
          }
        } else {
          jitterX = Math.sin(t * 5 + i) * 1;
        }
        bayerFill(ctx, p.x - 22 + jitterX, p.y - 22 + jitterY, 44, 44, density, ORANGE, null, 2);
      });
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
