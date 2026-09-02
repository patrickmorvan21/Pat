"use client";

import { useEffect, useRef } from "react";
import { bayerFillClipped, CHARBON, CREME, ORANGE, seededRandom } from "@/lib/dither";

/**
 * Tracer un glyphe (référence #2, corrigé 11/07) : progression séquentielle
 * STRICTE (il faut passer près du prochain point dans l'ordre), s'écarter
 * trop longtemps = échec (pas juste une tolérance de pixels), et la
 * complexité du motif change avec la stat (Ruse basse = motif long/retors,
 * Ruse haute = motif court/simple). Relâcher avant la fin = échec.
 * Réutilisé (même moteur) par : tracé en miroir, fil d'Ariane, nœud du pendu.
 *
 * Deux habillages :
 *   - défaut (galerie) : disque de pierre gravé procédural (passe réalisme
 *     du 11/07), canvas 300×200 ;
 *   - `skin: "pierre"` + `imageFond` (01/09, Patrick : « faire plus
 *     réaliste, imaginer un fond comme le crochetage, de la pierre, et faire
 *     le tracé dessus ») : canvas 360×499 (la zone de jeu native), le mur de
 *     pierre tramé en fond (`minijeu_chapelle_pierre_b.png`), et le motif POSÉ
 *     DESSUS — points en croix CISELÉES (blanc sur ombre charbon, comme un
 *     trait gravé qui accroche la lumière), guide en pointillé blanc-30, et le
 *     tracé du doigt en BLANC (la convention du jeu : blanc = ce qui se
 *     révèle). Le rayon du motif suit la zone (110 px) : à 360 de large, un
 *     motif de 68 serait un timbre-poste. Si l'image ne charge pas, la
 *     pierre retombe sur le charbon nu — le motif reste jouable.
 */
const W0 = 300,
  H0 = 200;
const WC = 360,
  HC = 499;

type Config = {
  points: number;
  star?: boolean;
  mirror?: boolean;
  blackout?: boolean;
  noRevisit?: boolean;
  tolerance?: number;
  skin?: "pierre";
  /** URL absolue (assetSrc) du fond de pierre. */
  imageFond?: string;
};

function buildPath(seed: string, points: number, star: boolean, mirror: boolean, W: number, cx: number, cy: number, r: number) {
  const rnd = seededRandom(seed);
  const path: { x: number; y: number }[] = [];
  const n = star ? points * 2 : points;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const radius = star && i % 2 === 1 ? r * 0.42 : r;
    const jitter = (rnd() - 0.5) * (r / 11);
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
  config: Config;
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pierre = config.skin === "pierre";
  const W = pierre ? WC : W0;
  const H = pierre ? HC : H0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rnd = seededRandom(seed);
    const cx = W / 2,
      cy = pierre ? Math.round(H * 0.47) : H / 2 - 10;
    const r = pierre ? 110 : 68;
    const path = buildPath(seed, config.points, !!config.star, !!config.mirror, W, cx, pierre ? cy : H / 2, r);
    const tolerance = config.tolerance ?? 22;
    const visitedCells = new Set<string>();
    let nextIndex = 1; // le doigt doit démarrer sur path[0]
    let holding = false;
    let strayFrames = 0;
    let cursor = { x: path[0].x, y: path[0].y };
    let finished = false;
    let raf = 0;
    let t = 0;
    const discR = 88;
    let fond: HTMLImageElement | null = null;
    if (pierre && config.imageFond) {
      const im = new Image();
      im.onload = () => {
        fond = im;
      };
      im.src = config.imageFond;
    }

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
    // move sur WINDOW (leçon de l'atelier, 28/07) : sur la pierre, le doigt
    // sort du canvas dès qu'il approche du bord de l'écran.
    const cibleMove: EventTarget = pierre ? window : canvas;
    cibleMove.addEventListener("pointermove", onMove as EventListener);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    /** Le disque procédural de la galerie (inchangé). */
    function dessinerDisque() {
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
      ctx.fillStyle = "#141210";
      ctx.beginPath();
      ctx.arc(cx, cy, discR, 0, Math.PI * 2);
      ctx.fill();
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
      runeDots.forEach((rd) => {
        const x = cx + Math.cos(rd.a) * rd.r,
          y = cy + Math.sin(rd.a) * rd.r;
        ctx.fillStyle = "rgba(232,223,200,0.2)";
        ctx.fillRect(x - 1, y - 3, 2, 6);
        ctx.fillRect(x - 3, y - 1, 6, 2);
      });
      ctx.strokeStyle = "rgba(232,223,200,0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    /** LA PIERRE : le mur de Patrick en fond, le motif ciselé dessus. */
    function dessinerPierre() {
      if (fond) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(fond, 0, 0, W, H);
      }
      // Le guide : pointillé blanc à 30 %, en pixels espacés (pas un trait).
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      for (let i = 0; i + 1 < path.length; i++) {
        const a = path[i],
          b = path[i + 1];
        const L = Math.hypot(b.x - a.x, b.y - a.y);
        for (let d = 8; d < L - 6; d += 7) {
          const x = a.x + ((b.x - a.x) * d) / L,
            y = a.y + ((b.y - a.y) * d) / L;
          ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
        }
      }
    }

    function draw() {
      raf = requestAnimationFrame(draw);
      t += 0.016;
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);

      if (!config.blackout) {
        if (pierre) dessinerPierre();
        else dessinerDisque();
      }
      // Segment parcouru : orange pulsé (galerie) ou BLANC qui bat par
      // paliers d'épaisseur (pierre — jamais une opacité animée).
      const glow = 0.75 + Math.sin(t * 6) * 0.25;
      ctx.strokeStyle = pierre ? CREME : ORANGE;
      ctx.globalAlpha = pierre ? 1 : glow;
      ctx.lineWidth = pierre ? (Math.floor(t * 3) % 2 === 0 ? 3 : 4) : 2.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i < nextIndex; i++) {
        const p = path[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      if (holding) ctx.lineTo(cursor.x, cursor.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Points-runes cibles : croix gravée. Sur la pierre, CISELÉE — une
      // ombre charbon décalée sous le trait blanc, comme un burin qui a mordu.
      path.forEach((p, i) => {
        const reached = i < nextIndex;
        const s = pierre ? 7 : 4;
        if (pierre) {
          ctx.fillStyle = CHARBON;
          ctx.fillRect(Math.round(p.x) - s + 1, Math.round(p.y), s * 2 + 1, 3);
          ctx.fillRect(Math.round(p.x), Math.round(p.y) - s + 1, 3, s * 2 + 1);
          ctx.fillStyle = reached ? CREME : "rgba(255,255,255,0.6)";
          ctx.fillRect(Math.round(p.x) - s, Math.round(p.y) - 1, s * 2 + 1, 2);
          ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - s, 2, s * 2 + 1);
          if (i === nextIndex && !finished && Math.floor(t * 3) % 2 === 0) {
            // le PROCHAIN point appelle : un carré qui clignote par paliers
            ctx.fillStyle = CREME;
            ctx.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 4, 4);
          }
          return;
        }
        ctx.strokeStyle = reached ? ORANGE : "rgba(232,223,200,0.45)";
        ctx.lineWidth = reached ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(p.x - s, p.y);
        ctx.lineTo(p.x + s, p.y);
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x, p.y + s);
        ctx.stroke();
      });
      // Curseur : petite marque de doigt
      if (holding) {
        ctx.strokeStyle = pierre ? CREME : "rgba(232,223,200,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, pierre ? 9 : 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (pierre && !finished) {
        ctx.fillStyle = CREME;
        ctx.globalAlpha = 0.5;
        ctx.font = "12px 'Roboto Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("Suis le tressage du doigt, point après point", W / 2, H - 16);
        ctx.globalAlpha = 1;
      }
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      cibleMove.removeEventListener("pointermove", onMove as EventListener);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  return <canvas ref={canvasRef} width={W} height={H} className="minigame-canvas" style={{ touchAction: "none" }} />;
}
