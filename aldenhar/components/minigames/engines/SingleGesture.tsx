"use client";

import { useEffect, useRef } from "react";
import { bayerFill, CHARBON, ORANGE } from "@/lib/dither";

/**
 * Fermer les yeux du mort (#17) : un glissé unique, lent, haut en bas.
 * Volontairement inratable — le jeu retient juste comment le geste a été
 * fait (vitesse, hésitation) pour colorer une ligne narrative plus tard.
 */
const W = 300,
  H = 180;

export default function SingleGesture({
  seed,
  onResult,
}: {
  seed: string;
  config: Record<string, never>;
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let progress = 0;
    let dragging = false;
    let done = false;
    let raf = 0;

    function pos(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      return { y: (e.clientY - r.top) / r.height };
    }
    function onDown() {
      dragging = true;
    }
    function onMove(e: PointerEvent) {
      if (!dragging || done) return;
      progress = Math.max(progress, pos(e).y);
    }
    function onUp() {
      dragging = false;
      if (progress > 0.75 && !done) {
        done = true;
        onResult(true);
      }
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    function draw() {
      raf = requestAnimationFrame(draw);
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);
      const lidY = progress * H;
      bayerFill(ctx, W / 2 - 50, 0, 100, lidY, 0.55, ORANGE, null, 2);
      ctx.fillStyle = "rgba(232,223,200,0.4)";
      ctx.font = "12px 'VT323', monospace";
      ctx.textAlign = "center";
      ctx.fillText("un geste lent, de haut en bas", W / 2, H - 14);
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
