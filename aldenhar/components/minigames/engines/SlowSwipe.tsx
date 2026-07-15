"use client";

import { useEffect, useRef } from "react";
import { CHARBON, CREME, ORANGE } from "@/lib/dither";

/**
 * Les pages du grimoire (#05) : tourner les pages par swipes LENTS ; trop
 * rapide réveille le livre. Vitesse limite invisible mais la page « frémit »
 * (jitter croissant) en approchant la limite — indice visuel continu.
 */
const W = 300,
  H = 200;

export default function SlowSwipe({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: { pagesNeeded: number; maxSpeed: number };
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let pagesTurned = 0;
    let lastX = 0,
      lastT = 0;
    let speed = 0;
    let finished = false;
    let raf = 0;
    let flashUntil = 0;

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
      const v = (Math.abs(p.x - lastX) / dt) * 16;
      speed = v;
      if (v > config.maxSpeed) {
        finished = true;
        onResult(false);
        return;
      }
      if (Math.abs(p.x - lastX) > 40) {
        pagesTurned++;
        flashUntil = performance.now() + 150;
        lastX = p.x;
        if (pagesTurned >= config.pagesNeeded) {
          finished = true;
          onResult(true);
        }
      }
      lastT = p.t;
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);

    function draw() {
      raf = requestAnimationFrame(draw);
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);
      const closeness = Math.min(1, speed / config.maxSpeed);
      const jitter = closeness * 5;
      const bx = W / 2 + (Math.random() - 0.5) * jitter;
      ctx.fillStyle = performance.now() < flashUntil ? ORANGE : "rgba(232,223,200,0.7)";
      ctx.fillRect(bx - 50, H / 2 - 60, 100, 120);
      ctx.fillStyle = CHARBON;
      ctx.font = "11px 'Roboto Mono', monospace";
      ctx.textAlign = "center";
      for (let i = 0; i < 5; i++) ctx.fillText("— — —", bx, H / 2 - 40 + i * 18);
      ctx.fillStyle = CREME;
      ctx.font = "12px 'Roboto Mono', monospace";
      ctx.fillText(`pages : ${pagesTurned}/${config.pagesNeeded}`, W / 2, H - 14);
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
