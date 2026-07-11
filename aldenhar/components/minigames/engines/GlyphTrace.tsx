"use client";

import { useEffect, useRef } from "react";
import { bayerFillClipped, CHARBON, ORANGE, seededRandom } from "@/lib/dither";

/**
 * Tracer un glyphe (référence #2, corrigé 11/07) : progression séquentielle
 * STRICTE (il faut passer près du prochain point dans l'ordre), s'écarter
 * trop longtemps = échec (pas juste une tolérance de pixels), et la
 * complexité du motif change avec la stat (Ruse basse = motif long/retors,
 * Ruse haute = motif court/simple). Relâcher avant la fin = échec.
 * Réutilisé (même moteur) par : tracé en miroir, fil d'Ariane, nœud du pendu.
 *
 * Rendu détaillé (passe réalisme 11/07) : disque de pierre gravé avec
 * cercle-cadre à crans, halo tramé, points-runes plutôt que de simples
 * carrés, tracé qui pulse.
 */
const W = 300,
  H = 200;

function buildPath(seed: string, points: number, star: boolean, mirror: boolean) {
  const rnd = seededRandom(seed);
  const cx = W / 2,
    cy = H / 2,
    r = 68;
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
    const rnd = seededRandom(seed);
    const path = buildPath(seed, config.points, !!config.star, !!config.mirror);
    const tolerance = config.tolerance ?? 22;
    const visitedCells = new Set<string>();
    let nextIndex = 1; // le doigt doit démarrer sur path[0]
    let holding = false;
    let strayFrames = 0;
    let cursor = { x: path[0].x, y: path[0].y };
    let finished = false;
    let raf = 0;
    let t = 0;
    const cx = W / 2,
      cy = H / 2 - 10;
    const discR = 88;

    // Crans du cadre (positions fixes, générées une fois)
    const ticks = Array.from({ length: 32 }, (_, i) => (i / 32) * Math.PI * 2);
    const runeDots = Array.from({ length: 10 }, () => ({
      a: rnd() * Math.PI * 2,
      r: discR * (0.3 + rnd() * 0.5),
    }));

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
      t += 0.016;
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);

      if (!config.blackout) {
        // Halo tramé derrière le disque
        const pulse = 0.14 + Math.sin(t * 1.4) * 0.03;
        bayerFillClipped(
          ctx,
          (c) => c.arc(cx, cy, discR + 22, 0, Math.PI * 2),
          cx - discR - 22,
          cy - discR - 22,
          (discR + 22) * 2,
          (discR + 22) * 2,
          pulse,
          ORANGE,
          3
        );
        // Disque de pierre
        ctx.fillStyle = "#141210";
        ctx.beginPath();
        ctx.arc(cx, cy, discR, 0, Math.PI * 2);
        ctx.fill();
        // Cadre à crans
        ticks.forEach((a) => {
          const x1 = cx + Math.cos(a) * (discR - 2),
            y1 = cy + Math.sin(a) * (discR - 2);
          const x2 = cx + Math.cos(a) * (discR + 4),
            y2 = cy + Math.sin(a) * (discR + 4);
          ctx.strokeStyle = "rgba(232,223,200,0.35)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        });
        // Runes décoratives éparses
        runeDots.forEach((rd) => {
          const x = cx + Math.cos(rd.a) * rd.r,
            y = cy + Math.sin(rd.a) * rd.r;
          ctx.fillStyle = "rgba(232,223,200,0.2)";
          ctx.fillRect(x - 1, y - 3, 2, 6);
          ctx.fillRect(x - 3, y - 1, 6, 2);
        });
        // Motif complet en pointillé discret
        ctx.strokeStyle = "rgba(232,223,200,0.25)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // Segment parcouru en orange, pulsé
      const glow = 0.75 + Math.sin(t * 6) * 0.25;
      ctx.strokeStyle = ORANGE;
      ctx.globalAlpha = glow;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < nextIndex; i++) {
        const p = path[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      if (holding) ctx.lineTo(cursor.x, cursor.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Points-runes cibles (croix gravée plutôt qu'un simple carré)
      path.forEach((p, i) => {
        const reached = i < nextIndex;
        ctx.strokeStyle = reached ? ORANGE : "rgba(232,223,200,0.45)";
        ctx.lineWidth = reached ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(p.x - 4, p.y);
        ctx.lineTo(p.x + 4, p.y);
        ctx.moveTo(p.x, p.y - 4);
        ctx.lineTo(p.x, p.y + 4);
        ctx.stroke();
      });
      // Curseur : petite marque de doigt
      if (holding) {
        ctx.strokeStyle = "rgba(232,223,200,0.5)";
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 6, 0, Math.PI * 2);
        ctx.stroke();
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
