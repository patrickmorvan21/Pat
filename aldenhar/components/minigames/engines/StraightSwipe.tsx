"use client";

import { useEffect, useRef } from "react";
import { CHARBON, CREME, ORANGE } from "@/lib/dither";

/**
 * L'amputation (#10) : trancher net d'un swipe unique, rapide et rectiligne.
 * Hésiter (lent ou courbe) aggrave. Stat haute = tolérance de courbure plus large.
 *
 * ⚠️ RÈGLE (posée le 24/08 sur SlowSwipe, re-payée ici) : quand ce moteur est
 * réemployé pour une autre fiction, l'AXE du geste et le DÉCOR suivent la
 * fiction. Sans décor, le joueur voit un rectangle noir et doit deviner où
 * porter la main — c'est ce qui rendait la cérémonie de la Falaise injouable.
 *
 * Deux habillages :
 *   - défaut (galerie, l'amputation) : aucun décor, comportement d'origine ;
 *   - `skin: "corde"` : une corde tendue à la verticale, et le geste doit la
 *     TRAVERSER. Sans cette contrainte, un swipe le LONG de la corde est droit,
 *     long et rapide — donc réussi, alors qu'il ne coupe rien.
 */
const W = 300,
  H = 200;

export type StraightSwipeConfig = {
  minLength: number;
  maxDurationMs: number;
  maxDeviation: number;
  /** "corde" pose la corde tendue et exige que le geste la traverse. */
  skin?: "corde";
};

export default function StraightSwipe({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: StraightSwipeConfig;
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const corde = config.skin === "corde";
    const CX = W / 2; // l'axe de la corde
    let points: { x: number; y: number }[] = [];
    let startT = 0;
    let finished = false;
    let raf = 0;
    const t0 = performance.now();

    function pos(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    }
    function onDown(e: PointerEvent) {
      points = [pos(e)];
      startT = performance.now();
    }
    function onMove(e: PointerEvent) {
      if (points.length === 0 || finished) return;
      points.push(pos(e));
    }
    function onUp() {
      if (points.length < 2 || finished) return;
      const dur = performance.now() - startT;
      const a = points[0],
        b = points[points.length - 1];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      // Déviation max par rapport à la droite a-b
      let maxDev = 0;
      const dx = b.x - a.x,
        dy = b.y - a.y;
      const norm = Math.hypot(dx, dy) || 1;
      points.forEach((p) => {
        const dev = Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / norm;
        maxDev = Math.max(maxDev, dev);
      });
      // La corde doit être traversée : le geste part d'un côté et finit de l'autre.
      const traverse = !corde || (a.x - CX) * (b.x - CX) < 0;
      const ok =
        length >= config.minLength &&
        dur <= config.maxDurationMs &&
        maxDev <= config.maxDeviation &&
        traverse;
      finished = true;
      onResult(ok);
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    /** La corde : deux torons en pixels, tendus, qui sortent du cadre en bas
        (le poids est dessous, hors champ — on ne dessine jamais le pendu). */
    function corde_() {
      ctx.fillStyle = ORANGE;
      for (let y = 0; y < H; y += 2) {
        const on = Math.floor(y / 3) % 2 === 0;
        ctx.fillRect(CX - 3, y, 2, 2);
        ctx.fillRect(CX + 1, y, 2, 2);
        if (on) ctx.fillRect(CX - 1, y, 2, 2);
      }
      // Le point de coupe : un semis clairsemé qui clignote par paliers tant
      // qu'on n'a rien tracé (jamais un trait net, jamais un fondu).
      if (points.length === 0) {
        const phase = Math.floor((performance.now() - t0) / 320) % 2;
        if (phase === 0) {
          ctx.fillStyle = CREME;
          for (let x = 24; x < W - 24; x += 6) {
            if (Math.abs(x - CX) < 8) continue;
            ctx.fillRect(x, H / 2 - 1, 2, 2);
          }
        }
      }
    }

    function draw() {
      raf = requestAnimationFrame(draw);
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);
      if (corde) corde_();
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      if (!finished) {
        ctx.fillStyle = CREME;
        ctx.globalAlpha = 0.4;
        ctx.font = "12px 'Roboto Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          corde ? "Traverse la corde — un seul geste, net" : "Un seul geste, net et rapide",
          W / 2,
          H - 14
        );
        ctx.globalAlpha = 1;
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
