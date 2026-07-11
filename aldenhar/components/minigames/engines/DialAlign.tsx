"use client";

import { useEffect, useRef } from "react";
import { bayerFillClipped, CHARBON, CREME, erodedRectPath, ORANGE, seededRandom } from "@/lib/dither";

/**
 * Le cadran runique (#01, sans son) : tourner une roue crantée pour aligner
 * des runes. Feedback 100% visuel — la trame s'épaissit et pulse PAR PALIERS
 * (jamais de fondu) à l'approche de l'alignement. Stat haute = la pulsation
 * démarre plus loin (fenêtre de signal plus large).
 * Réutilisé par : L'antidote, étape rotation (config.turns).
 *
 * Rendu détaillé (passe réalisme 11/07) : cadran monté sur plaque gravée,
 * lunette à crans fixe, runes = glyphes anguleux (pas de simples carrés),
 * poignée de préhension qui tourne avec le geste.
 */
const W = 300,
  H = 220;

function drawRune(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, tier: number) {
  const lw = 1 + tier;
  ctx.strokeStyle = tier > 0 ? ORANGE : "rgba(232,223,200,0.35)";
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x, y + s);
  ctx.moveTo(x - s * 0.55, y - s * 0.35);
  ctx.lineTo(x + s * 0.55, y - s * 0.85);
  ctx.moveTo(x - s * 0.55, y + s * 0.85);
  ctx.lineTo(x + s * 0.55, y + s * 0.15);
  ctx.stroke();
}

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

      // Plaque de montage gravée
      erodedRectPath(ctx, 16, 8, W - 32, H - 20, rnd, "rgba(232,223,200,0.28)", 16);

      // Lunette fixe à crans (24 encoches, indépendante de la rotation)
      const ticks = 24;
      for (let i = 0; i < ticks; i++) {
        const a = (i / ticks) * Math.PI * 2;
        const x1 = cx + Math.cos(a) * (R + 20),
          y1 = cy + Math.sin(a) * (R + 20);
        const x2 = cx + Math.cos(a) * (R + 27),
          y2 = cy + Math.sin(a) * (R + 27);
        ctx.strokeStyle = "rgba(232,223,200,0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Runes = glyphes anguleux, halo tramé par palier (pas de fondu)
      for (let i = 0; i < runes; i++) {
        const a = angle + (i / runes) * Math.PI * 2;
        const rx = cx + Math.cos(a) * R,
          ry = cy + Math.sin(a) * R;
        if (tier > 0) {
          bayerFillClipped(
            ctx,
            (c) => c.arc(rx, ry, 15, 0, Math.PI * 2),
            rx - 15,
            ry - 15,
            30,
            30,
            0.14 + tier * 0.13,
            ORANGE,
            2
          );
        }
        drawRune(ctx, rx, ry, 12, tier);
      }

      // Marque cible fixe (encoche gravée sur la lunette)
      ctx.strokeStyle = CREME;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(target) * (R + 18), cy + Math.sin(target) * (R + 18));
      ctx.lineTo(cx + Math.cos(target) * (R + 29), cy + Math.sin(target) * (R + 29));
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(232,223,200,0.25)";
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // Poignée de préhension : tourne avec le geste, ancrée au centre du cadran
      const gx = cx + Math.cos(angle) * (R - 22),
        gy = cy + Math.sin(angle) * (R - 22);
      ctx.strokeStyle = "rgba(232,223,200,0.5)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(gx, gy);
      ctx.stroke();
      ctx.fillStyle = CHARBON;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(232,223,200,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = dragging ? ORANGE : "rgba(232,223,200,0.4)";
      ctx.beginPath();
      ctx.arc(gx, gy, 6, 0, Math.PI * 2);
      ctx.fill();

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
