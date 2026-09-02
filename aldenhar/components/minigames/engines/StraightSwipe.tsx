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
 *   - défaut (galerie, l'amputation) : aucun décor, comportement d'origine,
 *     canvas 300×200 ;
 *   - `skin: "corde"` : la corde du Pendu, en IMAGE (01/09, Patrick :
 *     « prendre la corde en PJ comme image et ajouter des pixels blancs pour
 *     montrer le tracé à couper »). Canvas 360×499 — la zone de jeu native
 *     (format du Frottage et du Crochetage) — la corde tramée de Patrick
 *     (`minijeu_corde_tile_b.png`, 120×466, raccord vertical cuit dans le
 *     fichier) empilée au centre, et LE TRACÉ À COUPER en tirets de pixels
 *     blancs qui clignotent par paliers tant que rien n'est tracé. Le geste
 *     doit TRAVERSER la corde, à hauteur du tracé : un swipe le LONG de la
 *     corde est droit, long et rapide — donc « réussi » — alors qu'il ne
 *     coupe rien. Si l'image ne charge pas, la corde procédurale d'avant
 *     reprend (jamais un rectangle noir).
 */
const W0 = 300,
  H0 = 200;
/** Zone de jeu native des mini-jeux habillés (Frottage 25/08, Crochetage 30/08). */
const WC = 360,
  HC = 499;
/** La tuile de corde : 120 px de large, 466 px de période. */
const TILE_W = 120,
  TILE_H = 466;

export type StraightSwipeConfig = {
  minLength: number;
  maxDurationMs: number;
  maxDeviation: number;
  /** "corde" pose la corde tendue et exige que le geste la traverse. */
  skin?: "corde";
  /** URL absolue (assetSrc) de la tuile de corde. Sans elle : corde procédurale. */
  imageCorde?: string;
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
  const corde = config.skin === "corde";
  const W = corde ? WC : W0;
  const H = corde ? HC : H0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const CX = W / 2; // l'axe de la corde
    // Le point de coupe : un peu sous le milieu, là où la main tombe
    // naturellement quand on tient l'écran à une main.
    const CUT_Y = corde ? Math.round(H * 0.56) : H / 2;
    const CUT_TOL = 90; // la traversée doit se faire à hauteur du tracé (±)
    let points: { x: number; y: number }[] = [];
    let startT = 0;
    let finished = false;
    let raf = 0;
    const t0 = performance.now();
    let tuile: HTMLImageElement | null = null;
    if (corde && config.imageCorde) {
      const im = new Image();
      im.onload = () => {
        tuile = im;
      };
      im.src = config.imageCorde;
    }

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
      // La corde doit être traversée : le geste part d'un côté et finit de
      // l'autre — et la lame passe à hauteur du tracé blanc, sinon on a
      // coupé « quelque part », pas là où on a montré qu'il fallait couper.
      let traverse = true;
      if (corde) {
        traverse = (a.x - CX) * (b.x - CX) < 0;
        if (traverse && Math.abs(dx) > 0.001) {
          const yCross = a.y + ((CX - a.x) * dy) / dx;
          traverse = Math.abs(yCross - CUT_Y) <= CUT_TOL;
        }
      }
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

    /** La corde procédurale (repli si l'image manque) : deux torons en
        pixels, tendus, qui sortent du cadre en bas — le poids est dessous,
        hors champ, on ne dessine jamais le pendu. */
    function cordeProcedurale() {
      ctx.fillStyle = ORANGE;
      const e = corde ? 4 : 2; // épaisseur des torons, à l'échelle du canvas
      for (let y = 0; y < H; y += e) {
        const on = Math.floor(y / (e * 1.5)) % 2 === 0;
        ctx.fillRect(CX - 3 * e, y, e, e);
        ctx.fillRect(CX + e, y, e, e);
        if (on) ctx.fillRect(CX - e, y, e, e);
      }
    }

    /** La corde en IMAGE : la tuile empilée, centrée sur CX. */
    function cordeImage(im: HTMLImageElement) {
      ctx.imageSmoothingEnabled = false;
      const x0 = Math.round(CX - TILE_W / 2);
      for (let y = 0; y < H; y += TILE_H) ctx.drawImage(im, x0, y);
    }

    /** LE TRACÉ À COUPER : des tirets de pixels blancs en travers de la
        corde, prolongés en semis clairsemé de part et d'autre — jamais un
        trait net. Clignote par paliers (steps) tant que rien n'est tracé. */
    function traceACouper() {
      if (points.length > 0) return;
      const phase = Math.floor((performance.now() - t0) / 320) % 2;
      if (phase !== 0) return;
      ctx.fillStyle = CREME;
      if (corde) {
        // sur la corde : tirets francs (3×2) tous les 5 px
        for (let x = CX - 46; x <= CX + 46; x += 5) ctx.fillRect(x, CUT_Y - 1, 3, 2);
        // de part et d'autre : semis qui se raréfie en s'éloignant
        for (let k = 0; k < 14; k++) {
          const d = 52 + k * 7;
          if (k % 2 === 0) {
            ctx.fillRect(CX - d, CUT_Y - 1, 2, 2);
            ctx.fillRect(CX + d, CUT_Y - 1, 2, 2);
          }
        }
      } else {
        for (let x = 24; x < W - 24; x += 6) {
          if (Math.abs(x - CX) < 8) continue;
          ctx.fillRect(x, CUT_Y - 1, 2, 2);
        }
      }
    }

    function draw() {
      raf = requestAnimationFrame(draw);
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);
      if (corde) {
        if (tuile) cordeImage(tuile);
        else cordeProcedurale();
        traceACouper();
      }
      // Le geste, en blanc sur la corde (l'orange s'y perdrait), en orange
      // sur le fond nu de la galerie.
      ctx.strokeStyle = corde ? CREME : ORANGE;
      ctx.lineWidth = corde ? 3 : 2;
      ctx.beginPath();
      points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      if (!finished) {
        ctx.fillStyle = CREME;
        ctx.globalAlpha = 0.5;
        ctx.font = "12px 'Roboto Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          corde ? "Traverse la corde sur le tracé, d'un geste net" : "Un seul geste, net et rapide",
          W / 2,
          H - 16
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
