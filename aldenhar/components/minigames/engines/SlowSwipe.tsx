"use client";

import { useEffect, useRef } from "react";
import { CHARBON, CREME, ORANGE } from "@/lib/dither";

/**
 * DEUX GESTES POUR UN MOTEUR — « laisser filer » sans brusquer.
 *
 * `skin: "page"` (défaut) — les pages du grimoire (#05 du catalogue) : des
 * swipes LATÉRAUX lents ; trop vite réveille le livre et le geste ÉCHOUE.
 *
 * `skin: "corde"` — la cérémonie de la Falaise : on DESCEND, donc le geste
 * est vertical et vers le BAS, et il ne peut pas échouer (doctrine du
 * script : jamais un test d'adresse devant la Descente). Trop vite ne rate
 * rien — la corde ne file pas, la paume chauffe, on reprend son geste.
 *
 * ⚠️ LEÇON DU PLAYTEST DU 25/08 (« comment je suis censé faire ? je ne
 * comprends pas ») : la corde était servie avec le geste ET le décor du
 * grimoire — un glissement LATÉRAL sur une image de PAGE, pour une descente
 * en rappel. Rien à l'écran ne pouvait le dire. Règle qui en sort : quand un
 * moteur est réemployé, l'AXE du geste et le DÉCOR suivent la fiction —
 * sinon le joueur doit deviner une convention qu'il n'a aucun moyen de
 * connaître. Et un geste qu'on ne devine pas se montre : les chevrons sous
 * la main disent la direction tant que rien n'a bougé.
 */
const W = 300,
  H = 200;

type Config = {
  pagesNeeded: number;
  maxSpeed: number;
  label?: string;
  /** Axe du geste. Défaut "x" (le grimoire) ; la corde descend, donc "y". */
  axis?: "x" | "y";
  skin?: "page" | "corde";
  /** Distance d'un palier, en unités canvas. */
  step?: number;
  /** Trop vite ne fait pas échouer : ça freine, et on recommence. */
  forgiving?: boolean;
};

/** Trame de paroi pré-tirée UNE fois (jamais régénérée par frame). */
function semis(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rnd = () => (((h = Math.imul(h ^ (h >>> 15), 2246822507)) >>> 0) % 1000) / 1000;
  const pts: { x: number; y: number; w: number }[] = [];
  for (let i = 0; i < 220; i++)
    pts.push({ x: rnd() * W, y: rnd() * H, w: 1 + Math.floor(rnd() * 3) });
  return pts;
}

export default function SlowSwipe({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: Config;
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const axis = config.axis ?? "x";
    const corde = (config.skin ?? "page") === "corde";
    const pas = config.step ?? (corde ? 30 : 40);
    const clement = config.forgiving ?? corde;

    let paliers = 0;
    // ⚠️ DEUX repères, et c'est ESSENTIEL (bug trouvé au test du 25/08) :
    // `ancre` sert à mesurer le PALIER (elle ne bouge qu'au palier franchi),
    // `dernier` sert à mesurer la VITESSE (il bouge à chaque mouvement). Le
    // moteur d'origine n'en avait qu'un : le numérateur de la vitesse était
    // donc CUMULÉ depuis le dernier palier pendant que le dénominateur
    // restait le temps d'UN mouvement — plus on approchait du palier, plus la
    // vitesse calculée enflait, et un geste parfaitement lent finissait par
    // déclencher « trop vite » juste avant de compter. C'est-à-dire que le
    // geste devenait impossible à réussir précisément quand on le faisait bien.
    let ancre = 0,
      dernier = 0,
      lastT = 0;
    let tient = false; // le doigt est-il POSÉ ? (à la souris, survoler ne compte pas)
    let speed = 0;
    let defile = 0; // distance parcourue : c'est elle qui fait filer le décor
    let finished = false;
    let raf = 0;
    let flashUntil = 0;
    let tropViteUntil = 0;
    const paroi = semis(seed);

    function pos(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      return {
        v: axis === "y" ? ((e.clientY - r.top) / r.height) * H : ((e.clientX - r.left) / r.width) * W,
        t: performance.now(),
      };
    }
    function onDown(e: PointerEvent) {
      const p = pos(e);
      ancre = p.v;
      dernier = p.v;
      lastT = p.t;
      tient = true;
    }
    function onUp() {
      tient = false;
    }
    function onMove(e: PointerEvent) {
      if (finished || !tient) return;
      const p = pos(e);
      const dt = Math.max(1, p.t - lastT);
      // La VITESSE se mesure sur le dernier mouvement seul…
      speed = (Math.abs(p.v - dernier) / dt) * 16;
      // …le PALIER sur tout le chemin parcouru depuis le dernier franchi.
      const delta = p.v - ancre;
      dernier = p.v;
      lastT = p.t;
      if (speed > config.maxSpeed) {
        if (!clement) {
          finished = true;
          onResult(false);
          return;
        }
        // LA CORDE NE FILE PAS. On ne perd rien, on ne gagne rien — et on le
        // VOIT (la paume chauffe, le mot tombe). C'est ce qui apprend le
        // geste sans jamais punir : le joueur ralentit de lui-même.
        tropViteUntil = performance.now() + 700;
        ancre = p.v;
        return;
      }
      // Sur la corde, seul le sens de la DESCENTE compte : remonter la main
      // pour reprendre appui est un geste normal, il ne doit rien annuler.
      const utile = corde ? delta : Math.abs(delta);
      if (utile > pas) {
        paliers++;
        defile += utile;
        flashUntil = performance.now() + 150;
        ancre = p.v;
        if (paliers >= config.pagesNeeded) {
          finished = true;
          onResult(true);
        }
      } else if (corde && delta > 0) {
        defile += delta * 0.6; // le décor suit le doigt, même sous le palier
      }
    }
    canvas.addEventListener("pointerdown", onDown);
    // ⚠️ move/up sur WINDOW (leçon de l'atelier, 28/07) : sur l'élément seul,
    // iOS perd des événements dès que le doigt sort du canvas.
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    function dessinerPage() {
      const closeness = Math.min(1, speed / config.maxSpeed);
      const jitter = closeness * 5;
      const bx = W / 2 + (Math.random() - 0.5) * jitter;
      ctx.fillStyle = performance.now() < flashUntil ? ORANGE : "rgba(255,255,255,0.7)";
      ctx.fillRect(bx - 50, H / 2 - 60, 100, 120);
      ctx.fillStyle = CHARBON;
      ctx.font = "11px 'Roboto Mono', monospace";
      ctx.textAlign = "center";
      for (let i = 0; i < 5; i++) ctx.fillText("— — —", bx, H / 2 - 40 + i * 18);
    }

    function dessinerCorde(t: number) {
      const cx = Math.round(W / 2);
      const chaud = t < tropViteUntil;
      // La PAROI défile vers le haut pendant qu'on descend : c'est elle qui
      // dit qu'on bouge (semis fixe, jamais retiré par frame).
      ctx.fillStyle = "rgba(224,99,42,0.22)";
      for (const p of paroi) {
        if (Math.abs(p.x - cx) < 18) continue;
        const y = ((p.y - defile * 0.8) % H + H) % H;
        ctx.fillRect(Math.round(p.x), Math.round(y), p.w, 2);
      }
      // LA CORDE : des torons en chevrons qui filent vers le haut.
      ctx.fillStyle = chaud ? CREME : ORANGE;
      for (let y = -12; y < H + 12; y += 8) {
        const yy = Math.round(((y - defile) % (H + 24) + H + 24) % (H + 24)) - 12;
        ctx.fillRect(cx - 5, yy, 10, 3);
        ctx.fillRect(cx - 3, yy + 3, 6, 2);
      }
      // LA MAIN, fixe au centre : c'est le monde qui monte, pas elle.
      const my = Math.round(H / 2);
      ctx.fillStyle = chaud ? CREME : t < flashUntil ? CREME : ORANGE;
      ctx.fillRect(cx - 14, my - 9, 28, 18);
      ctx.fillStyle = CHARBON;
      ctx.fillRect(cx - 9, my - 4, 18, 3);
      ctx.fillRect(cx - 9, my + 2, 18, 2);
      // L'AFFORDANCE : tant que rien n'a filé, trois chevrons disent le bas.
      // Clignotement par PALIERS (steps), jamais un fondu.
      if (paliers === 0 && Math.floor(t / 320) % 2 === 0) {
        ctx.fillStyle = CREME;
        for (let c = 0; c < 3; c++) {
          const y = my + 26 + c * 11;
          for (let k = 0; k < 6; k++) {
            ctx.fillRect(cx - 10 + k * 2, y + k * 2, 2, 2);
            ctx.fillRect(cx + 8 - k * 2, y + k * 2, 2, 2);
          }
        }
      }
      // Les paliers, en encoches (grammaire de l'Anneau) : pleines = franchis.
      for (let i = 0; i < config.pagesNeeded; i++) {
        const y = 24 + i * 14;
        if (i < paliers) {
          ctx.fillStyle = ORANGE;
          ctx.fillRect(W - 26, y, 10, 6);
        } else {
          ctx.fillStyle = "rgba(224,99,42,0.35)";
          for (let k = 0; k < 5; k++) ctx.fillRect(W - 26 + k * 2, y + (k % 2) * 4, 2, 2);
        }
      }
      if (chaud) {
        ctx.fillStyle = CREME;
        ctx.font = "11px 'Roboto Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("TROP VITE", cx, my + 62);
      }
    }

    function draw() {
      raf = requestAnimationFrame(draw);
      const t = performance.now();
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      if (corde) dessinerCorde(t);
      else dessinerPage();
      ctx.fillStyle = CREME;
      ctx.font = "12px 'Roboto Mono', monospace";
      ctx.fillText(`${config.label ?? "pages"} : ${paliers}/${config.pagesNeeded}`, W / 2, H - 14);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  return <canvas ref={canvasRef} width={W} height={H} className="minigame-canvas" style={{ touchAction: "none" }} />;
}
