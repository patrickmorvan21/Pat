"use client";

import { useEffect, useRef } from "react";
import { bayerFill, CHARBON, CREME, ORANGE } from "@/lib/dither";

/**
 * Frotter l'écran (référence #1, corrigé 11/07) : la suie qui recouvre est
 * orange tramé DENSE (matité, pas charbon terne) ; ce qui est dessous est en
 * crème — jamais en orange, signal que ce n'est pas du texte de jeu normal.
 * Réutilisé tel quel (même moteur) par : Les latrines/pluie de cendres/antidote.
 */
const W = 300,
  H = 180,
  COLS = 30,
  ROWS = 18;

export default function RubReveal({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: { label: string; threshold?: number };
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const soot = useRef<Float32Array>(new Float32Array(COLS * ROWS).fill(1));
  const done = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const cellW = W / COLS,
      cellH = H / ROWS;
    let raf = 0;
    let dragging = false;

    function clearAt(px: number, py: number) {
      const cx = Math.floor(px / cellW);
      const cy = Math.floor(py / cellH);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = cx + dx,
            y = cy + dy;
          if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
          const dist = Math.hypot(dx, dy);
          const i = y * COLS + x;
          soot.current[i] = Math.max(0, soot.current[i] - (dist < 1 ? 0.35 : 0.15));
        }
      }
    }

    function pos(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    }
    function onDown(e: PointerEvent) {
      dragging = true;
      const p = pos(e);
      clearAt(p.x, p.y);
    }
    function onMove(e: PointerEvent) {
      if (!dragging) return;
      const p = pos(e);
      clearAt(p.x, p.y);
    }
    function onUp() {
      dragging = false;
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    function draw() {
      raf = requestAnimationFrame(draw);
      // Texte révélé (crème) en fond
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = CREME;
      ctx.font = "bold 28px 'VT323', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.label, W / 2, H / 2);
      // Suie par-dessus, densité par cellule
      let clearedSum = 0;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const d = soot.current[y * COLS + x];
          clearedSum += 1 - d;
          if (d > 0.02) bayerFill(ctx, x * cellW, y * cellH, cellW + 1, cellH + 1, d, ORANGE, null, 2);
        }
      }
      const ratio = clearedSum / (COLS * ROWS);
      if (!done.current && ratio > (config.threshold ?? 0.62)) {
        done.current = true;
        onResult(true);
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

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="minigame-canvas"
      style={{ touchAction: "none" }}
    />
  );
}
