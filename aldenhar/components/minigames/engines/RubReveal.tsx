"use client";

import { useEffect, useRef } from "react";
import { bayerFill, CHARBON, CREME, erodedRectPath, noiseSpecks, ORANGE, seededRandom } from "@/lib/dither";

/**
 * Frotter l'écran (référence #1, corrigé 11/07) : la suie qui recouvre est
 * orange tramé DENSE (matité, pas charbon terne) ; ce qui est dessous est en
 * crème — jamais en orange, signal que ce n'est pas du texte de jeu normal.
 * Réutilisé tel quel (même moteur) par : Les latrines/pluie de cendres/antidote.
 *
 * DEUX SKINS depuis le 25/08 (re-skin réaliste, maquettes Figma 2544:10906 /
 * 2558:23211) :
 *   • le skin PROCÉDURAL d'origine (tablette dessinée au canvas + mot révélé)
 *     — c'est celui de la galerie /minijeux, il ne bouge pas ;
 *   • le skin IMAGE : `config.imageFond` (ce qu'il y a dessous — la pierre
 *     aux marques) + `config.imageMousse` (la couche qu'on gratte). Le fond
 *     d'un mini-jeu est alors une VRAIE illustration tramée (doctrine du
 *     script de démo) ; le procédural ne sert plus qu'au FEEDBACK (curseur,
 *     perforations).
 *
 * Cycle du skin image (voulu par Patrick, 25/08) : on gratte une PARTIE →
 * TOUTE la mousse s'envole par vagues (steps, jamais un fondu) → la pierre
 * reste à l'écran, phase « lu » (`onPhase`) — c'est l'appelant qui affiche
 * « Touche pour continuer » — → un tap sur le canvas conclut (`onResult`).
 *
 * « La mousse est trop touffue » (même retour) : une PRÉ-ÉCLAIRCIE seedée
 * troue la couche par plaques irrégulières dès l'ouverture — la mousse ne
 * couvre jamais 100 % d'une pierre, on devine ce qu'il y a dessous. Réglable
 * par `config.preEclaircie` (part de surface déjà mangée, défaut ~0.12).
 */
const W = 300,
  H = 180,
  COLS = 30,
  ROWS = 18;

export type RubConfig = {
  label: string;
  threshold?: number;
  /** Skin image : l'illustration révélée (URL déjà hashée par l'appelant). */
  imageFond?: string;
  /** Skin image : la couche à gratter (URL déjà hashée par l'appelant). */
  imageMousse?: string;
  /** Skin image : part de mousse déjà absente à l'ouverture (0..~0.3). */
  preEclaircie?: number;
};

export default function RubReveal({
  seed,
  config,
  onResult,
  onPhase,
}: {
  seed: string;
  config: RubConfig;
  onResult: (success: boolean) => void;
  /** Skin image seulement : « gratte » → « envol » → « lu » (le hint change). */
  onPhase?: (phase: "gratte" | "envol" | "lu") => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const soot = useRef<Float32Array>(new Float32Array(COLS * ROWS).fill(1));
  const done = useRef(false);
  const imageSkin = Boolean(config.imageFond && config.imageMousse);
  // Dimensions de la maquette Figma (zone de jeu 360×499 à y=174).
  const CW = imageSkin ? 360 : W;
  const CH = imageSkin ? 499 : H;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rnd = seededRandom(seed);
    let raf = 0;
    let dragging = false;
    let cursor: { x: number; y: number } | null = null;

    /* ══════════════════════ SKIN IMAGE (la Borne) ══════════════════════ */
    if (imageSkin) {
      // Grille plus fine que le skin procédural : la surface est ~5× plus
      // grande, le doigt doit mordre à la même échelle physique (~15 px).
      const GC = 24,
        GR = 33;
      const cellW = CW / GC,
        cellH = CH / GR;
      const dens = new Float32Array(GC * GR).fill(1);
      // Perforation PROGRESSIVE : chaque cellule a un ordre seedé de petits
      // carrés (3 px) ; une baisse de densité perce les suivants — le trou
      // grandit sous le doigt au lieu d'apparaître d'un bloc.
      const SLOTS = 30;
      const slots: { x: number; y: number }[][] = [];
      for (let i = 0; i < GC * GR; i++) {
        const cx = (i % GC) * cellW,
          cy = Math.floor(i / GC) * cellH;
        const list: { x: number; y: number }[] = [];
        for (let s = 0; s < SLOTS; s++)
          list.push({ x: cx + rnd() * (cellW - 3), y: cy + rnd() * (cellH - 3) });
        slots.push(list);
      }
      const perces = new Int16Array(GC * GR).fill(0);

      const mousseCv = document.createElement("canvas");
      mousseCv.width = CW;
      mousseCv.height = CH;
      const mctx = mousseCv.getContext("2d")!;

      let phase: "charge" | "gratte" | "envol" | "lu" = "charge";
      let envolFrame = 0;

      function percer(i: number, cible: number) {
        // Perce jusqu'à `cible` slots dans la cellule i (idempotent).
        const list = slots[i];
        for (let s = perces[i]; s < Math.min(cible, SLOTS); s++) {
          mctx.clearRect(list[s].x, list[s].y, 3, 3);
        }
        perces[i] = Math.max(perces[i], Math.min(cible, SLOTS));
        /* ⚠️ Des carrés posés au hasard ne PAVENT pas la cellule (~70 % de
           couverture à recouvrements près, mesuré au banc : 16 579 px de
           miettes après un envol « complet »). Le dernier slot emporte donc
           la cellule entière — la progression reste granuleuse, la fin est
           nette. */
        if (perces[i] >= SLOTS) {
          const cx = (i % GC) * cellW,
            cy = Math.floor(i / GC) * cellH;
          mctx.clearRect(cx - 0.5, cy - 0.5, cellW + 1, cellH + 1);
        }
      }
      function syncCell(i: number) {
        percer(i, Math.round((1 - dens[i]) * SLOTS));
      }

      const fond = new Image();
      const mousse = new Image();
      let charges = 0;
      const pret = () => {
        charges += 1;
        if (charges < 2) return;
        mctx.drawImage(mousse, 0, 0, CW, CH);
        /* PRÉ-ÉCLAIRCIE : des plaques irrégulières où la mousse manque déjà —
           densité réduite au CENTRE du blob, dégressive au bord (la pierre se
           devine, elle ne s'étale pas). Les cellules touchées comptent dans le
           score : le geste n'a plus que le reste à gratter. */
        const part = config.preEclaircie ?? 0.12;
        const nBlobs = Math.round(6 + part * 25);
        for (let b = 0; b < nBlobs; b++) {
          const bx = rnd() * CW,
            by = rnd() * CH;
          const r = 22 + rnd() * 34;
          for (let i = 0; i < GC * GR; i++) {
            const cx = (i % GC) * cellW + cellW / 2,
              cy = Math.floor(i / GC) * cellH + cellH / 2;
            const d = Math.hypot(cx - bx, cy - by) / r;
            if (d > 1) continue;
            const manque = (1 - d) * (0.35 + rnd() * 0.3);
            dens[i] = Math.max(0.25, dens[i] - manque);
            syncCell(i);
          }
        }
        phase = "gratte";
        onPhase?.("gratte");
      };
      fond.onload = pret;
      mousse.onload = pret;
      fond.src = config.imageFond!;
      mousse.src = config.imageMousse!;

      function clearAt(px: number, py: number) {
        if (phase !== "gratte") return;
        const cx = Math.floor(px / cellW);
        const cy = Math.floor(py / cellH);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const x = cx + dx,
              y = cy + dy;
            if (x < 0 || y < 0 || x >= GC || y >= GR) continue;
            const dist = Math.hypot(dx, dy);
            const i = y * GC + x;
            dens[i] = Math.max(0, dens[i] - (dist < 1 ? 0.4 : 0.16));
            syncCell(i);
          }
        }
      }
      function pos(e: PointerEvent) {
        const r = canvas!.getBoundingClientRect();
        return { x: ((e.clientX - r.left) / r.width) * CW, y: ((e.clientY - r.top) / r.height) * CH };
      }
      function onDown(e: PointerEvent) {
        if (phase === "lu") {
          if (!done.current) {
            done.current = true;
            onResult(true);
          }
          return;
        }
        dragging = true;
        const p = pos(e);
        cursor = p;
        clearAt(p.x, p.y);
      }
      function onMove(e: PointerEvent) {
        const p = pos(e);
        cursor = p;
        if (!dragging) return;
        clearAt(p.x, p.y);
      }
      function onUp() {
        dragging = false;
      }
      canvas.addEventListener("pointerdown", onDown);
      // iOS perd les événements dès que le doigt sort du canvas (leçon de
      // l'atelier 28/07) : move/up vivent sur window.
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);

      function draw() {
        raf = requestAnimationFrame(draw);
        if (phase === "charge") {
          ctx.fillStyle = CHARBON;
          ctx.fillRect(0, 0, CW, CH);
          return;
        }
        if (phase === "envol") {
          /* L'ENVOL : « une fois qu'on a gratté une partie, toute la mousse
             s'en va » — par VAGUES (steps), jamais un fondu. Une vague toutes
             les 5 frames, huit vagues, chaque vague perce ~1/3 du restant de
             chaque cellule : la mousse se ronge, elle ne s'estompe pas. */
          envolFrame += 1;
          if (envolFrame % 5 === 0) {
            let reste = 0;
            for (let i = 0; i < GC * GR; i++) {
              const manquants = SLOTS - perces[i];
              if (manquants > 0) {
                percer(i, perces[i] + Math.max(2, Math.ceil(manquants * 0.34)));
                reste += SLOTS - perces[i];
              }
            }
            if (reste === 0) {
              phase = "lu";
              onPhase?.("lu");
            }
          }
        }
        ctx.drawImage(fond, 0, 0, CW, CH);
        ctx.drawImage(mousseCv, 0, 0);
        if (cursor && dragging && phase === "gratte") {
          ctx.strokeStyle = "rgba(255,255,255,0.55)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cursor.x, cursor.y, 11, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (phase === "gratte") {
          let cleared = 0;
          for (let i = 0; i < GC * GR; i++) cleared += 1 - dens[i];
          if (cleared / (GC * GR) > (config.threshold ?? 0.45)) {
            phase = "envol";
            envolFrame = 0;
            onPhase?.("envol");
          }
        }
      }
      draw();
      return () => {
        cancelAnimationFrame(raf);
        canvas.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
    }

    /* ═══════════ SKIN PROCÉDURAL D'ORIGINE (galerie /minijeux) ═══════════ */
    const cellW = W / COLS,
      cellH = H / ROWS;

    // Grain de fond stable (généré une fois, jamais retiré à chaque frame).
    const speckBuf = document.createElement("canvas");
    speckBuf.width = W;
    speckBuf.height = H;
    const sctx = speckBuf.getContext("2d")!;
    sctx.fillStyle = CHARBON;
    sctx.fillRect(0, 0, W, H);
    noiseSpecks(sctx, 0, 0, W, H, rnd, "rgba(224,99,42,0.12)", 260);
    noiseSpecks(sctx, 0, 0, W, H, rnd, "rgba(0,0,0,0.35)", 160);

    // Fissures fixes de la tablette (quelques traits irréguliers).
    const cracks: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const x1 = 20 + rnd() * (W - 40),
        y1 = 14 + rnd() * (H - 28);
      cracks.push({ x1, y1, x2: x1 + (rnd() - 0.5) * 70, y2: y1 + (rnd() - 0.5) * 40 });
    }

    function clearAt(px: number, py: number) {
      const cx = Math.floor(px / cellW);
      const cy = Math.floor(py / cellH);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = cx + dx,
            y = cy + dy;
          if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
          const dist = Math.hypot(dx, dy);
          const i = y * COLS + x;
          soot.current[i] = Math.max(0, soot.current[i] - (dist < 1 ? 0.35 : 0.15));
        }
      }
    }

    function pos(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    }
    function onDown(e: PointerEvent) {
      dragging = true;
      const p = pos(e);
      cursor = p;
      clearAt(p.x, p.y);
    }
    function onMove(e: PointerEvent) {
      const p = pos(e);
      cursor = p;
      if (!dragging) return;
      clearAt(p.x, p.y);
    }
    function onUp() {
      dragging = false;
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    function draw() {
      raf = requestAnimationFrame(draw);
      // Fond tramé + grain stable
      ctx.drawImage(speckBuf, 0, 0);
      // Cadre gravé rongé
      erodedRectPath(ctx, 6, 6, W - 12, H - 12, rnd, "rgba(232,223,200,0.35)", 22);
      // Fissures de la pierre
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1;
      cracks.forEach((c) => {
        ctx.beginPath();
        ctx.moveTo(c.x1, c.y1);
        ctx.lineTo(c.x2, c.y2);
        ctx.stroke();
      });
      // Inscription révélée (gravure, police à empattement du titre)
      ctx.fillStyle = CREME;
      ctx.font = "30px 'Instrument Serif', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.label, W / 2, H / 2);

      // Suie par-dessus, densité par cellule
      let clearedSum = 0;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const d = soot.current[y * COLS + x];
          clearedSum += 1 - d;
          if (d > 0.02) bayerFill(ctx, x * cellW, y * cellH, cellW + 1, cellH + 1, d, ORANGE, null, 2);
        }
      }
      // Vignette aux coins (assombrit, jamais un dégradé lisse : quelques passes discrètes)
      bayerFill(ctx, 0, 0, 40, 40, 0.4, "rgba(0,0,0,0.6)", null, 3);
      bayerFill(ctx, W - 40, 0, 40, 40, 0.4, "rgba(0,0,0,0.6)", null, 3);
      bayerFill(ctx, 0, H - 40, 40, 40, 0.4, "rgba(0,0,0,0.6)", null, 3);
      bayerFill(ctx, W - 40, H - 40, 40, 40, 0.4, "rgba(0,0,0,0.6)", null, 3);

      // Curseur de frottement (anneau discret, visible même sans glisser)
      if (cursor) {
        ctx.strokeStyle = dragging ? "rgba(232,223,200,0.6)" : "rgba(232,223,200,0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 9, 0, Math.PI * 2);
        ctx.stroke();
      }

      const ratio = clearedSum / (COLS * ROWS);
      if (!done.current && ratio > (config.threshold ?? 0.62)) {
        done.current = true;
        onResult(true);
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

  return (
    <canvas
      ref={canvasRef}
      width={CW}
      height={CH}
      className="minigame-canvas"
      style={
        imageSkin
          ? {
              touchAction: "none",
              // La maquette est 360×499 : plein cadre sur mobile, ratio tenu
              // par l'aspect intrinsèque du canvas ; sur écran court, la
              // hauteur plafonne et la largeur suit.
              width: "auto",
              height: "auto",
              maxWidth: "100%",
              maxHeight: "calc(100dvh - 210px)",
              imageRendering: "pixelated",
            }
          : { touchAction: "none" }
      }
    />
  );
}
