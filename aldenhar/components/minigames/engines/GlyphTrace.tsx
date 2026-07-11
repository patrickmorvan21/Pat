"use client";

import { useEffect, useRef } from "react";
import { CHARBON, CREME, ORANGE, seededRandom } from "@/lib/dither";

/**
 * Tracer un glyphe (référence #2, corrigé 11/07) : progression séquentielle
 * STRICTE (il faut passer près du prochain point dans l'ordre), s'écarter
 * trop longtemps = échec (pas juste une tolérance de pixels), et la
 * complexité du motif change avec la stat (Ruse basse = motif long/retors,
 * Ruse haute = motif court/simple). Relâcher avant la fin = échec.
 * Réutilisé (même moteur) par : tracé en miroir, fil d'Ariane, nœud du pendu.
 */
const W = 300,
  H = 200;

function buildPath(seed: string, points: number, star: boolean, mirror: boolean) {
  const rnd = seededRandom(seed);
  const cx = W / 2,
    cy = H / 2,
    r = 70;
  const path: { x: number; y: number }[] = [];
  const n = star ? points * 2 : points;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const radius = star && i % 2 === 1 ? r * 0.42 : r;
    const jitter = (rnd() - 0.5) * 6;
    let x = cx + Math.cos(angle) * (radius + jitter);
    const y = cy + Math.sin(angle) * (radius + jitter);
    if (mirror) x = W - x;
    path.push({ x, y });
  }
  return path;
}

export default function GlyphTrace({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: { points: number; star?: boolean; mirror?: boolean; blackout?: boolean; noRevisit?: boolean; tolerance?: number };
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const path = buildPath(seed, config.points, !!config.star, !!config.mirror);
    const tolerance = config.tolerance ?? 22;
    const visitedCells = new Set<string>();
    let nextIndex = 1; // le doigt doit démarrer sur path[0]
    let holding = false;
    let strayFrames = 0;
    let cursor = { x: path[0].x, y: path[0].y };
    let finished = false;
    let raf = 0;

    function cellKey(x: number, y: number) {
      return `${Math.floor(x / 18)}:${Math.floor(y / 18)}`;
    }

    function pos(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    }
    function fail() {
      if (finished) return;
      finished = true;
      onResult(false);
    }
    function onDown(e: PointerEvent) {
      const p = pos(e);
      if (Math.hypot(p.x - path[0].x, p.y - path[0].y) < tolerance * 1.4) {
        holding = true;
        cursor = p;
        visitedCells.add(cellKey(p.x, p.y));
      }
    }
    function onMove(e: PointerEvent) {
      if (!holding || finished) return;
      const p = pos(e);
      cursor = p;
      const target = path[nextIndex];
      const dist = Math.hypot(p.x - target.x, p.y - target.y);
      if (dist < tolerance) {
        nextIndex++;
        strayFrames = 0;
        if (nextIndex >= path.length) {
          finished = true;
          holding = false;
          onResult(true);
          return;
        }
      } else {
        strayFrames++;
        if (strayFrames > 40) return fail();
      }
      if (config.noRevisit) {
        const k = cellKey(p.x, p.y);
        const prevKey = cellKey(path[nextIndex - 1]?.x ?? p.x, path[nextIndex - 1]?.y ?? p.y);
        if (visitedCells.has(k) && k !== prevKey) return fail();
        visitedCells.add(k);
      }
    }
    function onUp() {
      if (!finished && holding && nextIndex < path.length) fail();
      holding = false;
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    function draw() {
      raf = requestAnimationFrame(draw);
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);
      if (!config.blackout) {
        // Motif complet en pointillé discret
        ctx.strokeStyle = "rgba(232,223,200,0.25)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // Segment parcouru en orange
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < nextIndex; i++) {
        const p = path[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      if (holding) ctx.lineTo(cursor.x, cursor.y);
      ctx.stroke();
      // Points cibles
      path.forEach((p, i) => {
        ctx.fillStyle = i < nextIndex ? ORANGE : CREME;
        ctx.globalAlpha = i < nextIndex ? 1 : 0.4;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.globalAlpha = 1;
      });
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
