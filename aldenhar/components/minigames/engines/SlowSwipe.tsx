"use client";

import { useEffect, useRef } from "react";
import { CHARBON, CREME, ORANGE } from "@/lib/dither";

/**
 * DEUX GESTES POUR UN MOTEUR — « laisser filer » sans brusquer.
 *
 * `skin: "page"` (défaut) — les pages du grimoire (#05 du catalogue) : des
 * swipes LATÉRAUX lents ; trop vite réveille le livre et le geste ÉCHOUE.
 * Canvas 300×200, comportement d'origine.
 *
 * `skin: "corde"` — la cérémonie de la Falaise : on DESCEND, donc le geste
 * est vertical et vers le BAS, et il ne peut pas échouer (doctrine du
 * script : jamais un test d'adresse devant la Descente). Trop vite ne rate
 * rien — la corde ne file pas, la paume chauffe, on reprend son geste.
 *
 * HABILLAGE DU 01/09 (Patrick : « à partir de cette illustration, imaginer
 * la suite de la corde, de façon à ce que quand on scroll l'image continue ;
 * au tout début un dégradé orange en haut qui représente la lumière, et au
 * fur et à mesure qu'on descend celle-ci s'assombrit — on finit par ne plus
 * voir de lumière que la corde : ça montre qu'on arrive à l'acte 2 »).
 *   - canvas 360×499 (la zone de jeu native) ;
 *   - la corde = la tuile tramée de Patrick (`minijeu_corde_tile_b.png`,
 *     120×466, raccord vertical cuit dans le fichier) empilée et DÉFILÉE
 *     vers le haut par `defile` : l'image continue tant qu'on descend ;
 *   - la LUMIÈRE = un champ de pixels orange en haut du cadre dont la
 *     DENSITÉ décroît vers le bas (trame de Bayer, cellules de 2 px) — jamais
 *     un dégradé CSS ni une opacité. Elle s'éteint PAR PALIERS avec la
 *     progression (8 niveaux quantifiés, recalculés seulement au changement
 *     de niveau) : au dernier palier il ne reste que la corde sur le noir ;
 *   - la paroi (semis) s'éteint avec la lumière ; la main est un poing de
 *     CHARBON serré sur la corde (on la voit par son contour) ;
 *   - conservés : chevrons d'affordance, encoches de paliers, TROP VITE.
 *   Si l'image ne charge pas, la corde procédurale reprend.
 *
 * ⚠️ LEÇON DU PLAYTEST DU 25/08 (« comment je suis censé faire ? je ne
 * comprends pas ») : quand un moteur est réemployé, l'AXE du geste et le
 * DÉCOR suivent la fiction — sinon le joueur doit deviner une convention
 * qu'il n'a aucun moyen de connaître. Et un geste qu'on ne devine pas se
 * montre : les chevrons sous la main disent la direction tant que rien n'a
 * bougé.
 */
const W0 = 300,
  H0 = 200;
const WC = 360,
  HC = 499;
const TILE_W = 120,
  TILE_H = 466;
/** Paliers d'extinction de la lumière — quantifiés, jamais continus. */
const NIVEAUX_LUMIERE = 8;
const BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

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
  /** URL absolue (assetSrc) de la tuile de corde. Sans elle : corde procédurale. */
  imageCorde?: string;
};

/** Trame de paroi pré-tirée UNE fois (jamais régénérée par frame). */
function semis(seed: string, W: number, H: number, n: number) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rnd = () => (((h = Math.imul(h ^ (h >>> 15), 2246822507)) >>> 0) % 1000) / 1000;
  const pts: { x: number; y: number; w: number }[] = [];
  for (let i = 0; i < n; i++)
    pts.push({ x: rnd() * W, y: rnd() * H, w: 1 + Math.floor(rnd() * 3) });
  return pts;
}

/**
 * LE CHAMP DE LUMIÈRE, pour un niveau d'extinction donné. Densité par rangée :
 * pleine au bord haut, nulle bien avant le bas ; le niveau ABAISSE la densité
 * ET remonte la ligne d'extinction — le noir gagne par le bas. Rendu en
 * cellules de 2 px seuillées par Bayer 8×8 : c'est la trame qui fait le
 * « dégradé », pas l'alpha.
 */
function rendreLumiere(W: number, H: number, niveau: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const c = cv.getContext("2d")!;
  const k = 1 - niveau / NIVEAUX_LUMIERE; // 1 = pleine lumière, 0 = nuit
  if (k <= 0) return cv;
  // ⚠️ Densité de DÉPART revue le 02/09 (retour Patrick : « rendre le bg moins
  // dense au début »). À 0,96 le haut du champ était un APLAT orange plein :
  // la corde s'y noyait, et la trame ne se lisait plus comme une trame. À 0,62
  // on voit la lumière ET ce qu'elle éclaire. Mesuré côte à côte avant de
  // trancher — 0,45 rendait la lumière trop timide pour qu'elle manque ensuite.
  const portee = H * (0.18 + 0.48 * k); // jusqu'où la lumière descend
  const gain = Math.pow(k, 0.8);
  const img = c.createImageData(W, H);
  const d = img.data;
  const CELL = 2;
  for (let y = 0; y < H; y += CELL) {
    const t = Math.max(0, 1 - y / portee);
    const dens = Math.pow(t, 1.5) * 0.62 * gain;
    if (dens <= 0) break;
    for (let x = 0; x < W; x += CELL) {
      const seuil = (BAYER8[(y / CELL) & 7][(x / CELL) & 7] + 0.5) / 64;
      if (dens <= seuil) continue;
      for (let dy = 0; dy < CELL; dy++)
        for (let dx = 0; dx < CELL; dx++) {
          const i = ((y + dy) * W + (x + dx)) * 4;
          d[i] = 0xe0;
          d[i + 1] = 0x63;
          d[i + 2] = 0x2a;
          d[i + 3] = 255;
        }
    }
  }
  c.putImageData(img, 0, 0);
  return cv;
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
  const corde = (config.skin ?? "page") === "corde";
  const W = corde ? WC : W0;
  const H = corde ? HC : H0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const axis = config.axis ?? "x";
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
    const paroi = semis(seed, W, H, corde ? 520 : 220);
    let tuile: HTMLImageElement | null = null;
    if (corde && config.imageCorde) {
      const im = new Image();
      im.onload = () => {
        tuile = im;
      };
      im.src = config.imageCorde;
    }
    // La lumière : un calque par niveau, rendu à la demande et gardé.
    const lumieres = new Map<number, HTMLCanvasElement>();
    function lumiere(niveau: number) {
      let cv = lumieres.get(niveau);
      if (!cv) {
        cv = rendreLumiere(W, H, niveau);
        lumieres.set(niveau, cv);
      }
      return cv;
    }

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

    /** Progression 0..1 de la descente : les paliers franchis, plus la
        fraction en cours (le décor qui suit le doigt), bornée. */
    function progression() {
      const frac = Math.max(0, Math.min(0.99, (dernier - ancre) / pas));
      return Math.min(1, (paliers + (tient ? frac : 0)) / config.pagesNeeded);
    }

    function dessinerCorde(t: number) {
      const cx = Math.round(W / 2);
      const chaud = t < tropViteUntil;
      const prog = progression();
      const niveau = Math.min(NIVEAUX_LUMIERE, Math.floor(prog * NIVEAUX_LUMIERE + 0.0001));
      // LA LUMIÈRE, en haut, qui s'éteint par paliers avec la descente.
      if (niveau < NIVEAUX_LUMIERE) ctx.drawImage(lumiere(niveau), 0, 0);
      // LA PAROI défile vers le haut pendant qu'on descend : c'est elle qui
      // dit qu'on bouge (semis fixe, jamais retiré par frame). Elle s'éteint
      // avec la lumière : on ne dessine qu'une part des points, par
      // probabilité seedée sur le point — jamais par alpha.
      const vis = 1 - niveau / NIVEAUX_LUMIERE;
      ctx.fillStyle = ORANGE;
      paroi.forEach((p, i) => {
        if (Math.abs(p.x - cx) < TILE_W / 2 + 6) return;
        if (((i * 7919) % 100) / 100 > 0.25 + 0.75 * vis) return;
        const y = ((p.y - defile * 0.8) % H + H) % H;
        ctx.fillRect(Math.round(p.x), Math.round(y), p.w, 2);
      });
      // LA CORDE : la tuile de Patrick empilée, qui FILE vers le haut.
      if (tuile) {
        ctx.imageSmoothingEnabled = false;
        const x0 = Math.round(cx - TILE_W / 2);
        const off = ((defile % TILE_H) + TILE_H) % TILE_H;
        for (let y = -off; y < H; y += TILE_H) ctx.drawImage(tuile, x0, Math.round(y));
      } else {
        ctx.fillStyle = chaud ? CREME : ORANGE;
        for (let y = -12; y < H + 12; y += 8) {
          const yy = Math.round(((y - defile) % (H + 24) + H + 24) % (H + 24)) - 12;
          ctx.fillRect(cx - 9, yy, 18, 5);
          ctx.fillRect(cx - 6, yy + 5, 12, 3);
        }
      }
      // LA MAIN : un poing de CHARBON serré sur la corde, fixe au centre —
      // c'est le monde qui monte, pas elle. On la lit par son contour (un
      // liseré rongé, orange ; blanc quand la paume chauffe).
      const my = Math.round(H * 0.52);
      const mw = 62,
        mh = 44;
      ctx.fillStyle = chaud || t < flashUntil ? CREME : ORANGE;
      for (let k = 0; k < 4; k++) {
        // contour en pixels espacés (jamais un trait continu)
        for (let x = -mw / 2; x <= mw / 2; x += 3) {
          if (((x + k * 5) & 7) === 0) continue;
          ctx.fillRect(cx + x, my - mh / 2 - 2, 2, 2);
          ctx.fillRect(cx + x, my + mh / 2, 2, 2);
        }
        for (let y = -mh / 2; y <= mh / 2; y += 3) {
          if (((y + k * 3) & 7) === 0) continue;
          ctx.fillRect(cx - mw / 2 - 2, my + y, 2, 2);
          ctx.fillRect(cx + mw / 2, my + y, 2, 2);
        }
      }
      ctx.fillStyle = CHARBON;
      ctx.fillRect(cx - mw / 2, my - mh / 2, mw, mh);
      // les doigts : trois sillons, en pixels orange espacés
      ctx.fillStyle = chaud ? CREME : ORANGE;
      for (let f = -1; f <= 1; f++) {
        const y = my + f * 12;
        for (let x = -mw / 2 + 8; x < mw / 2 - 8; x += 4) ctx.fillRect(cx + x, y, 2, 2);
      }
      // L'AFFORDANCE : tant que rien n'a filé, trois chevrons disent le bas.
      // Clignotement par PALIERS (steps), jamais un fondu.
      if (paliers === 0 && Math.floor(t / 320) % 2 === 0) {
        ctx.fillStyle = CREME;
        for (let c = 0; c < 3; c++) {
          const y = my + mh / 2 + 22 + c * 14;
          for (let k = 0; k < 7; k++) {
            ctx.fillRect(cx - 12 + k * 2, y + k * 2, 2, 2);
            ctx.fillRect(cx + 10 - k * 2, y + k * 2, 2, 2);
          }
        }
      }
      // Les paliers, en encoches (grammaire de l'Anneau) : pleines = franchis.
      for (let i = 0; i < config.pagesNeeded; i++) {
        const y = 28 + i * 16;
        if (i < paliers) {
          ctx.fillStyle = CREME;
          ctx.fillRect(W - 30, y, 12, 7);
        } else {
          ctx.fillStyle = CREME;
          for (let k = 0; k < 6; k++) ctx.fillRect(W - 30 + k * 2, y + (k % 2) * 5, 2, 2);
        }
      }
      if (chaud) {
        ctx.fillStyle = CREME;
        ctx.font = "12px 'Roboto Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("TROP VITE", cx, my + mh / 2 + 22);
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
