"use client";

import { useEffect, useRef } from "react";
import { bayerFill, CHARBON, CREME, erodedRectPath, noiseSpecks, ORANGE, seededRandom } from "@/lib/dither";

/**
 * Frotter l'écran (référence #1, corrigé 11/07) : la suie qui recouvre est
 * orange tramé DENSE (matité, pas charbon terne) ; ce qui est dessous est en
 * crème — jamais en orange, signal que ce n'est pas du texte de jeu normal.
 * Réutilisé tel quel (même moteur) par : Les latrines/pluie de cendres/antidote.
 *
 * Rendu détaillé (passe réalisme 11/07) : tablette de pierre gravée avec
 * cadre rongé, grain de fond stable, vignettage aux coins, curseur de
 * frottement visible pendant le geste.
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
    const rnd = seededRandom(seed);
    const cellW = W / COLS,
      cellH = H / ROWS;
    let raf = 0;
    let dragging = false;
    let cursor: { x: number; y: number } | null = null;

    // Grain de fond stable (généré une fois, jamais retiré à chaque frame).
    const speckBuf = document.createElement("canvas");
    speckBuf.width = W;
    speckBuf.height = H;
    const sctx = speckBuf.getContext("2d")!;
    sctx.fillStyle = CHARBON;
    sctx.fillRect(0, 0, W, H);
    noiseSpecks(sctx, 0, 0, W, H, rnd, "rgba(224,99,42,0.12)", 260);
    noiseSpecks(sctx, 0, 0, W, H, rnd, "rgba(0,0,0,0.35)", 160);

    // Fissures fixes de la tablette (quelques traits irréguliers).
    const cracks: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const x1 = 20 + rnd() * (W - 40),
        y1 = 14 + rnd() * (H - 28);
      cracks.push({ x1, y1, x2: x1 + (rnd() - 0.5) * 70, y2: y1 + (rnd() - 0.5) * 40 });
    }

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
      cursor = p;
      clearAt(p.x, p.y);
    }
    function onMove(e: PointerEvent) {
      const p = pos(e);
      cursor = p;
      if (!dragging) return;
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
      // Fond tramé + grain stable
      ctx.drawImage(speckBuf, 0, 0);
      // Cadre gravé rongé
      erodedRectPath(ctx, 6, 6, W - 12, H - 12, rnd, "rgba(232,223,200,0.35)", 22);
      // Fissures de la pierre
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1;
      cracks.forEach((c) => {
        ctx.beginPath();
        ctx.moveTo(c.x1, c.y1);
        ctx.lineTo(c.x2, c.y2);
        ctx.stroke();
      });
      // Inscription révélée (gravure, police à empattement du titre)
      ctx.fillStyle = CREME;
      ctx.font = "30px 'Instrument Serif', serif";
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
      // Vignette aux coins (assombrit, jamais un dégradé lisse : quelques passes discrètes)
      bayerFill(ctx, 0, 0, 40, 40, 0.4, "rgba(0,0,0,0.6)", null, 3);
      bayerFill(ctx, W - 40, 0, 40, 40, 0.4, "rgba(0,0,0,0.6)", null, 3);
      bayerFill(ctx, 0, H - 40, 40, 40, 0.4, "rgba(0,0,0,0.6)", null, 3);
      bayerFill(ctx, W - 40, H - 40, 40, 40, 0.4, "rgba(0,0,0,0.6)", null, 3);

      // Curseur de frottement (anneau discret, visible même sans glisser)
      if (cursor) {
        ctx.strokeStyle = dragging ? "rgba(232,223,200,0.6)" : "rgba(232,223,200,0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 9, 0, Math.PI * 2);
        ctx.stroke();
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
