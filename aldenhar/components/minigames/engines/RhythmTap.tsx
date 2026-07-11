"use client";

import { useEffect, useRef } from "react";
import { bayerFill, CHARBON, ORANGE } from "@/lib/dither";

/**
 * Le tambour funèbre (#12, sans son) : un rythme montré par pulsations de
 * trame (densité par paliers) à reproduire en taps cadencés. Stat haute =
 * le rythme reste affiché pendant la reproduction ; stat basse = à mémoriser.
 * Réutilisé par : L'incantation partagée (appuis longs synchronisés).
 */
const W = 300,
  H = 160;

export default function RhythmTap({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: { beats: number; intervalMs: number; showDuringReplay: boolean; tolerance?: number };
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const beatTimes = Array.from({ length: config.beats }, (_, i) => i * config.intervalMs);
    let phase: "watch" | "reproduce" | "done" = "watch";
    let phaseStart = performance.now();
    let tapIndex = 0;
    let finished = false;
    let raf = 0;
    const totalWatch = config.intervalMs * config.beats + 400;

    function onDown() {
      if (phase !== "reproduce" || finished) return;
      const elapsed = performance.now() - phaseStart;
      const expected = beatTimes[tapIndex];
      const tol = config.tolerance ?? 220;
      if (Math.abs(elapsed - expected) < tol) {
        tapIndex++;
        if (tapIndex >= beatTimes.length) {
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
      if (phase === "watch") {
        const activeBeat = beatTimes.findIndex((t) => elapsed >= t && elapsed < t + 180);
        const cx = W / 2,
          cy = H / 2;
        const density = activeBeat >= 0 ? 0.9 : 0.15;
        bayerFill(ctx, cx - 40, cy - 40, 80, 80, density, ORANGE, null, 2);
        ctx.fillStyle = "rgba(232,223,200,0.5)";
        ctx.font = "12px 'VT323', monospace";
        ctx.textAlign = "center";
        ctx.fillText("Regarde le rythme…", cx, H - 14);
        if (elapsed > totalWatch) {
          phase = "reproduce";
          phaseStart = performance.now();
        }
      } else if (phase === "reproduce") {
        const cx = W / 2,
          cy = H / 2;
        if (config.showDuringReplay) {
          const activeBeat = beatTimes.findIndex((t) => elapsed >= t && elapsed < t + 180);
          bayerFill(ctx, cx - 40, cy - 40, 80, 80, activeBeat >= 0 ? 0.7 : 0.1, ORANGE, null, 2);
        } else {
          bayerFill(ctx, cx - 40, cy - 40, 80, 80, 0.2, "rgba(232,223,200,0.7)", null, 3);
        }
        ctx.fillStyle = ORANGE;
        ctx.font = "12px 'VT323', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`tape le rythme (${tapIndex}/${config.beats})`, cx, H - 14);
        if (elapsed > beatTimes[beatTimes.length - 1] + (config.tolerance ?? 220) + 400 && !finished) {
          finished = true;
          onResult(false);
        }
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
