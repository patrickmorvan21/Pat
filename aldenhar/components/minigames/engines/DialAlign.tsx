"use client";

import { useEffect, useRef } from "react";
import { bayerFill, CHARBON, CREME, ORANGE, seededRandom } from "@/lib/dither";

/**
 * Le cadran runique (#01, sans son) : tourner une roue crantée pour aligner
 * des runes. Feedback 100% visuel — la trame s'épaissit et pulse PAR PALIERS
 * (jamais de fondu) à l'approche de l'alignement. Stat haute = la pulsation
 * démarre plus loin (fenêtre de signal plus large).
 * Réutilisé par : L'antidote, étape rotation (config.turns).
 */
const W = 300,
  H = 220;

export default function DialAlign({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: { runes?: number; signalWidth: number; turnsNeeded?: number };
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rnd = seededRandom(seed);
    const runes = config.runes ?? 3;
    const target = rnd() * Math.PI * 2;
    let angle = rnd() * Math.PI * 2;
    let dragging = false;
    let lastAngle = 0;
    let turnsDone = 0;
    let cumulative = 0;
    let finished = false;
    let raf = 0;
    let lockedT = 0;

    function pos(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 };
    }
    function onDown(e: PointerEvent) {
      const p = pos(e);
      lastAngle = Math.atan2(p.y, p.x);
      dragging = true;
    }
    function onMove(e: PointerEvent) {
      if (!dragging || finished) return;
      const p = pos(e);
      const a = Math.atan2(p.y, p.x);
      let delta = a - lastAngle;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      angle += delta;
      cumulative += Math.abs(delta);
      lastAngle = a;
    }
    function onUp() {
      dragging = false;
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    function draw() {
      raf = requestAnimationFrame(draw);
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2,
        cy = H / 2 - 10,
        R = 70;
      const diff = Math.abs(((angle - target + Math.PI) % (Math.PI * 2)) - Math.PI);
      const closeness = Math.max(0, 1 - diff / config.signalWidth);
      // Palier discret (jamais de fondu) : 0, 1, 2, 3
      const tier = closeness > 0.85 ? 3 : closeness > 0.55 ? 2 : closeness > 0.25 ? 1 : 0;
      for (let i = 0; i < runes; i++) {
        const a = angle + (i / runes) * Math.PI * 2;
        const rx = cx + Math.cos(a) * R,
          ry = cy + Math.sin(a) * R;
        const density = 0.25 + tier * 0.22;
        bayerFill(ctx, rx - 12, ry - 12, 24, 24, density, ORANGE, null, 2);
      }
      // Marque cible fixe (crème, discrète)
      const tx = cx + Math.cos(target) * (R + 16),
        ty = cy + Math.sin(target) * (R + 16);
      ctx.fillStyle = CREME;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(tx - 2, ty - 2, 4, 4);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(232,223,200,0.25)";
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      if (!finished && tier === 3) {
        lockedT += 0.016;
        if (lockedT > 0.5) {
          finished = true;
          onResult(true);
        }
      } else {
        lockedT = 0;
      }
      const need = (config.turnsNeeded ?? 0) * Math.PI * 2;
      if (need > 0) {
        turnsDone = cumulative / (Math.PI * 2);
        ctx.fillStyle = "rgba(232,223,200,0.5)";
        ctx.font = "12px 'VT323', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`tours : ${Math.floor(turnsDone)} / ${config.turnsNeeded}`, cx, H - 14);
        if (turnsDone >= (config.turnsNeeded ?? 0) && !finished) {
          finished = true;
          onResult(true);
        }
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
