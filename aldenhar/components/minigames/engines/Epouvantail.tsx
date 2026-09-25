"use client";

import { useEffect, useRef, useState } from "react";
import { ZONE_LARGEUR_CSS } from "@/components/minigames/zone";

/**
 * L'ÉPOUVANTAIL DU VERGER — suivre du doigt (vague 3, 25/09).
 *
 * ⚠️ PORT FIDÈLE du prototype validé par Patrick le 25/09
 * (`maquettes/epouvantail_geste.html`, v2 : « trop facile, il suffit de
 * rester appuyé » → le doigt EST le regard). Les règles, les constantes et le
 * dessin sont repris tels quels — un prototype validé se PORTE, il ne se
 * réimplémente pas d'après son souvenir (leçon du 30/07, re-payée le 13/09).
 *
 * Le jeu : tu recules entre les rangs, le doigt posé SUR lui. Un tronc tout
 * proche passe devant pendant que tu recules ; pendant qu'il le cache, il
 * change de place, un peu plus près. Le doigt doit aller le retrouver avant
 * un délai (l'Instinct). Des leurres (« Là. Quelque chose a bougé. ») tirent
 * l'œil de l'autre côté. Deux fautes — perdu de vue trop longtemps, ou doigt
 * levé — et il est sur toi. Le Miroir fêlé : un reflet montre où il ressort,
 * et il bouge moins souvent.
 *
 * Grille de 130 × 166 pixels logiques, affichée à ×3 — exactement la zone de
 * jeu des mini-jeux habillés (390 × 498), donc un rapport entier : la trame
 * reste nette. Tout se dessine en pixels francs, deux couleurs et le blanc.
 */
const W = 130;
const H = 166;
const HOR = 112;
const VPX = 65;
const F = 58;
const CAMH = 0.3;
const L = 1.7;
const TICK = 320;
const X_FIN = 11;
const X_DEPART = 3.0;
const ORANGE = "#e0632a";
const CHARBON = "#1c1a16";
const BLANC = "#ffffff";

type Niveau = { tol: number; grace: number; n: number; tous: [number, number] };

const TENTATIONS = [
  "Derrière toi, quelque chose craque.",
  "Une main effleure ton épaule.",
  "Quelqu'un dit ton nom, tout près.",
  "Le vent se lève dans ton dos.",
];

const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

export default function Epouvantail({
  config,
  onResult,
}: {
  seed?: string;
  config: Niveau & { miroir?: boolean };
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tentation, setTentation] = useState<string | null>(null);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const g = cv.getContext("2d")!;
    const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const niv: Niveau = { tol: config.tol, grace: config.grace, n: config.n, tous: config.tous };
    const miroir = Boolean(config.miroir);

    type Boite = { x0: number; x1: number; y0: number; y1: number };
    type Tronc = { de: number; a: number; k: number; suiv: number; cache: boolean; x: number };
    let phase: "attente" | "tenue" | "lache" | "reussi" | "rate" = "attente";
    let xp = X_DEPART, xs = 0, lat = 0, latSuiv = 0, tete = 0, fautes = 0;
    let tenu = false;
    let doigt: { x: number; y: number } | null = null;
    let surLui = false, perdu = 0, pasAcc = 0, lacheDepuis = 0, secousse = 0;
    let tentationFin = 0;
    let ptsDernier = performance.now();
    let prochainTronc = 0;
    let tronc: Tronc | null = null;
    let leurre: { x: number; y: number; fin: number } | null = null;
    let boite: Boite | null = null;
    let latPrec: number | null = null;
    let raf = 0;
    let fini = false;
    const minuteurs: number[] = [];

    const hash = (a: number, b: number) => {
      let h = (a * 374761393 + b * 668265263) | 0;
      h = (h ^ (h >>> 13)) * 1274126177;
      return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    };
    const bayer = (x: number, y: number) => (B4[y & 3][x & 3] + 0.5) / 16;
    const px = (x: number, y: number, c: string) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      g.fillStyle = c;
      g.fillRect(x | 0, y | 0, 1, 1);
    };
    const rect = (x: number, y: number, w: number, h: number, c: string) => {
      g.fillStyle = c;
      g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
    };
    const alea = (a: number, b: number) => a + Math.random() * (b - a);

    function ligne(x0: number, y0: number, x1: number, y1: number, c: string) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy;
      for (;;) {
        px(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) { e += dy; x0 += sx; }
        if (e2 <= dx) { e += dx; y0 += sy; }
      }
    }

    function fond() {
      g.fillStyle = ORANGE; g.fillRect(0, 0, W, HOR);
      g.fillStyle = CHARBON; g.fillRect(0, HOR, W, H - HOR);
      for (let y = HOR - 10; y < HOR; y++) {
        const d = Math.pow((y - (HOR - 10)) / 10, 2) * 0.5;
        for (let x = 0; x < W; x++) if (bayer(x, y) < d && hash(x, y) < 0.8) px(x, y, CHARBON);
      }
      for (let y = HOR; y < H; y++) {
        const d = 0.09 * Math.pow(1 - (y - HOR) / (H - HOR), 2.4);
        for (let x = 0; x < W; x++) if (hash(x * 3, y * 7) < d * 0.6) px(x, y, ORANGE);
      }
    }

    function arbre(i: number, cote: number) {
      const d = xp - i;
      if (d < 0.32) return;
      const s = F / d, base = HOR + CAMH * s, sx = VPX + cote * L * s, h = 2.3 * s;
      if (sx < -60 || sx > W + 60) return;
      const tw = Math.max(1, 0.13 * s);
      rect(sx - tw / 2, base - h * 0.62, tw, h * 0.62 + 1, CHARBON);
      for (let k = 0; k < 4; k++) {
        const a = -Math.PI / 2 + (hash(i * 7 + k, cote + 5) - 0.5) * 2.2;
        const len = h * (0.28 + hash(i, k * 3 + cote) * 0.22);
        const y0 = base - h * (0.5 + k * 0.08);
        ligne(sx, y0, sx + Math.cos(a) * len, y0 + Math.sin(a) * len, CHARBON);
      }
      const cy = base - h * 0.78, r = h * 0.34;
      for (let y = Math.floor(cy - r); y <= cy + r; y++)
        for (let x = Math.floor(sx - r * 1.2); x <= sx + r * 1.2; x++) {
          const nx = (x - sx) / (r * 1.2), ny = (y - cy) / r, q = nx * nx + ny * ny;
          if (q < 0.72 + hash(x * 13 + i, y * 17) * 0.4 && hash(x + i * 31, y + cote * 57) > 0.18) px(x, y, CHARBON);
        }
    }

    function epouvantail(COL = CHARBON): Boite {
      const d = Math.max(0.55, xp - xs), s = F / d;
      const base = HOR + CAMH * s, h = 3.1 * s, cx = VPX + lat * s;
      const haut = base - h, epaule = base - h * 0.74;
      rect(cx - Math.max(1, 0.08 * s) / 2, haut + h * 0.18, Math.max(1, 0.08 * s), h * 0.82, COL);
      rect(cx - 1.25 * s, epaule, 2.5 * s, Math.max(1, 0.07 * s), COL);
      const top = epaule, bas = base - h * 0.3;
      for (let y = Math.floor(top); y <= bas; y++) {
        const t = (y - top) / Math.max(1, bas - top), demi = (0.42 + t * 0.18) * s;
        for (let x = Math.floor(cx - demi); x <= cx + demi; x++) px(x, y, COL);
      }
      for (let k = -5; k <= 5; k++) rect(cx + k * 0.11 * s, bas, Math.max(1, 0.06 * s), (0.05 + hash(k + 20, 3) * 0.22) * h, COL);
      for (const c of [-1, 1]) {
        const bx = cx + c * 1.2 * s;
        for (let k = 0; k < 4; k++) rect(bx + c * k * 0.05 * s, epaule, Math.max(1, 0.05 * s), (0.12 + hash(k, c + 9) * 0.2) * h, COL);
      }
      const r = Math.max(2, 0.3 * s);
      const hx = tete === 0 ? cx + 0.16 * s : cx, hy = tete === 0 ? haut + r * 1.1 : haut + r * 0.6;
      for (let y = Math.floor(hy - r); y <= hy + r; y++)
        for (let x = Math.floor(hx - r); x <= hx + r; x++) {
          if (((x - hx) ** 2 + (y - hy) ** 2) / (r * r) < 0.95 + hash(x, y) * 0.12) px(x, y, COL);
        }
      rect(hx - r * 1.35, hy - r * 0.9, r * 2.7, Math.max(1, 0.06 * s), COL);
      rect(hx - r * 0.7, hy - r * 1.6, r * 1.4, r * 0.75, COL);
      if (tete >= 1 && COL === CHARBON) {
        const e = Math.max(1, Math.round(r * 0.22)), ey = Math.round(hy - r * 0.05);
        rect(hx - r * 0.45 - e / 2, ey, e, e, ORANGE);
        rect(hx + r * 0.45 - e / 2, ey, e, e, ORANGE);
      }
      // la boîte de VISÉE : le corps, pas les bras (on regarde quelqu'un, pas ses manches)
      return { x0: cx - 0.7 * s, x1: cx + 0.7 * s, y0: hy - r * 1.7, y1: base };
    }

    function boiteDe(latX: number) {
      const d = Math.max(0.55, xp - xs), s = F / d, base = HOR + CAMH * s, h = 3.1 * s;
      return { cx: VPX + latX * s, cy: base - h * 0.7 };
    }

    function coins(b: Boite, c: string) {
      const x0 = Math.max(1, Math.round(b.x0) - 2), x1 = Math.min(W - 2, Math.round(b.x1) + 2);
      const y0 = Math.max(1, Math.round(b.y0) - 2), y1 = Math.min(H - 2, Math.round(b.y1) + 1);
      for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]])
        for (let k = 0; k < 3; k++) { px(x + sx * k, y, c); px(x, y + sy * k, c); }
    }

    function troncProche() {
      if (!tronc) return;
      const bx = tronc.x, w = 24;
      for (let y = 0; y < H; y++) {
        const e1 = hash(y, 3) * 3, e2 = hash(y, 9) * 3;
        for (let x = Math.floor(bx - w / 2 - e1); x <= bx + w / 2 + e2; x++) px(x, y, CHARBON);
      }
      for (let y = 0; y < H; y += 1) if (hash(y, 21) < 0.07) px(bx - w / 2 + 3 + hash(y, 4) * (w - 6), y, ORANGE);
    }

    function dessiner() {
      g.save();
      if (secousse > 0 && !reduit) g.translate(secousse & 1 ? 2 : -2, secousse & 2 ? 1 : -1);
      fond();
      // Tous les arbres d'abord : aucun arbre du verger ne le cache jamais —
      // seul le tronc qui passe tout près le fait, et c'est la règle du jeu.
      for (let i = -8; i <= 9; i++) for (const c of [-3, -1, 1, 3]) arbre(i, c);
      const cache = Boolean(tronc && tronc.cache);
      boite = null;
      if (!cache) {
        // liseré de contre-jour épais (2 px) : lisible devant un feuillage noir
        for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]) {
          g.save(); g.translate(dx, dy); epouvantail(ORANGE); g.restore();
        }
        boite = epouvantail();
      }
      if (cache && miroir) {
        const p = boiteDe(latSuiv);
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [-2, -3], [3, -2], [-3, 2], [2, 3]]) px(p.cx + dx, p.cy + dy, BLANC);
      }
      if (tronc) troncProche();
      const now = performance.now();
      if (leurre && now < leurre.fin && Math.floor(now / 160) % 2 === 0)
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [2, 1], [0, -1], [1, 2]]) px(leurre.x + dx, leurre.y + dy, BLANC);
      if (phase === "tenue" && boite && surLui) coins(boite, BLANC);
      if (phase === "tenue" && doigt) {
        const fx = Math.round(doigt.x), fy = Math.round(doigt.y), c = surLui ? BLANC : "rgba(255,255,255,.5)";
        for (const k of [2, 3]) { px(fx + k, fy, c); px(fx - k, fy, c); px(fx, fy + k, c); px(fx, fy - k, c); }
      }
      g.restore();
      // Repères pour les bancs de test — jamais lus par le jeu.
      cv!.dataset.phase = phase;
      cv!.dataset.cache = cache ? "1" : "0";
      if (boite) {
        cv!.dataset.sx = ((boite.x0 + boite.x1) / 2).toFixed(1);
        cv!.dataset.sy = ((boite.y0 + boite.y1) / 2).toFixed(1);
      }
    }

    function afficherTentation(t: string, ms = 1500) {
      setTentation(t);
      tentationFin = performance.now() + ms;
    }

    // Le saut se mesure EN PIXELS À L'ÉCRAN, pas en mètres de verger : il doit
    // l'emmener hors de la marge où ton doigt le « voit » encore, sinon un
    // doigt immobile le retrouve sans rien faire. Et il ne revient jamais là
    // où il était juste avant.
    function nouvelleLat(depuis: number) {
      const s = F / Math.max(0.55, xp - xs);
      const min = 0.7 + (niv.tol + 6) / s;
      const loin = (l: number) => Math.abs(l - depuis) >= min && (latPrec === null || Math.abs(l - latPrec) >= min);
      let l: number | null = null;
      const lim = 39 / s; // jamais collé au bord
      for (let k = 0; k < 80 && l === null; k++) {
        const c = alea(-lim, lim);
        if (loin(c)) l = c;
      }
      if (l === null) l = depuis > 0 ? -lim : lim;
      latPrec = depuis;
      return Math.round(l * 10) / 10;
    }
    function planifierTronc(t: number) {
      const [a, b] = niv.tous;
      prochainTronc = t + alea(a, b) * (miroir ? 1.5 : 1);
    }

    // Les tentations tombent sur des pas tirés au hasard, une sur deux est un leurre.
    const pas: number[] = [];
    for (let k = 3; k < niv.n - 1; k++) pas.push(k);
    for (let k = pas.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [pas[k], pas[j]] = [pas[j], pas[k]];
    }
    const tentations = new Map<number, string>(
      pas.slice(0, 4).map((p, i) => [p, i % 2 ? "leurre" : TENTATIONS[Math.floor(Math.random() * TENTATIONS.length)]])
    );

    function finir(ok: boolean) {
      if (fini) return;
      fini = true;
      phase = ok ? "reussi" : "rate";
      setTentation(null);
      dessiner();
      onResultRef.current(ok);
    }

    function attrape() {
      tronc = null; xs = xp - 0.62; lat = 0; tete = 2; secousse = 10; phase = "rate";
      dessiner();
      minuteurs.push(window.setTimeout(() => finir(false), 520));
    }

    function faute(txt: string) {
      fautes++; perdu = 0;
      if (fautes >= 2) { attrape(); return; }
      xs += (xp - xs) * 0.5; tete = 1; secousse = 6;
      afficherTentation(txt);
      dessiner();
    }

    function versCanvas(e: PointerEvent) {
      const r = cv!.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    }
    function mesurer() {
      if (!doigt || !boite) { surLui = false; return; }
      const t = niv.tol;
      surLui = doigt.x >= boite.x0 - t && doigt.x <= boite.x1 + t && doigt.y >= boite.y0 - t && doigt.y <= boite.y1 + t;
    }

    function onDown(e: PointerEvent) {
      if (phase === "reussi" || phase === "rate") return;
      e.preventDefault();
      tenu = true;
      doigt = versCanvas(e);
      mesurer();
      if (phase === "attente") { phase = "tenue"; planifierTronc(performance.now()); }
      else if (phase === "lache") phase = "tenue";
      dessiner();
    }
    // écouteurs sur window : un pointermove attaché à l'élément en perd la moitié (28/07)
    function onMove(e: PointerEvent) {
      if (tenu && phase === "tenue") { doigt = versCanvas(e); mesurer(); }
    }
    function lever() {
      if (!tenu) return;
      tenu = false; doigt = null;
      if (phase !== "tenue") return;
      fautes++;
      if (fautes >= 2) { attrape(); return; }
      phase = "lache"; lacheDepuis = performance.now();
      xs += (xp - xs) * 0.5; tete = 1; secousse = 6;
      afficherTentation("Il s'est tourné.");
      dessiner();
    }
    const noCtx = (e: Event) => e.preventDefault();
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("contextmenu", noCtx);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", lever);
    window.addEventListener("pointercancel", lever);

    function boucle(t: number) {
      const dt = Math.min(100, t - ptsDernier);
      ptsDernier = t;
      if (tentationFin && t > tentationFin && phase !== "rate") { setTentation(null); tentationFin = 0; }
      let redessin = false;
      if (secousse > 0) { secousse--; redessin = true; }
      if (phase === "tenue") {
        // le tronc qui passe : 8 paliers, caché du 3e au 6e ; il change de
        // place pendant qu'on ne le voit pas
        if (!tronc && t >= prochainTronc) {
          const gauche = Math.random() < 0.5;
          latSuiv = nouvelleLat(lat);
          tronc = { de: gauche ? -20 : W + 20, a: gauche ? W + 20 : -20, k: 0, suiv: t, cache: false, x: gauche ? -20 : W + 20 };
        }
        if (tronc && t >= tronc.suiv) {
          tronc.k++; tronc.suiv = t + 80;
          tronc.x = tronc.de + ((tronc.a - tronc.de) * tronc.k) / 8;
          if (tronc.k === 3) tronc.cache = true;
          if (tronc.k === 4) { lat = latSuiv; xs = Math.min(xp - 1.2, xs + 0.25); }
          if (tronc.k === 6) { tronc.cache = false; perdu = 0; }
          if (tronc.k >= 8) { tronc = null; planifierTronc(t); }
          redessin = true;
          mesurer();
        }
        const cache = tronc && tronc.cache;
        if (!cache) {
          mesurer();
          if (surLui) {
            perdu = 0; pasAcc += dt;
            while (pasAcc >= TICK && phase === "tenue") {
              pasAcc -= TICK;
              xp += (X_FIN - X_DEPART) / niv.n;
              const pasN = Math.round((xp - X_DEPART) / ((X_FIN - X_DEPART) / niv.n));
              const q = tentations.get(pasN);
              if (q === "leurre") {
                const cote = boite && (boite.x0 + boite.x1) / 2 < VPX ? 1 : -1;
                leurre = { x: Math.round(VPX + cote * alea(38, 54)), y: Math.round(alea(40, 90)), fin: t + 1400 };
                afficherTentation("Là. Quelque chose a bougé.", 1400);
              } else if (q) afficherTentation(q);
              if (xp >= X_FIN - 1e-6) { xp = X_FIN; finir(true); break; }
            }
          } else {
            perdu += dt;
            if (perdu > niv.grace) faute("Tu l'as perdu de vue.");
          }
        }
        redessin = true;
      } else if (phase === "lache" && t - lacheDepuis > 1000) {
        attrape();
      }
      if (redessin) dessiner();
      if (!fini) raf = requestAnimationFrame(boucle);
    }

    dessiner();
    raf = requestAnimationFrame(boucle);
    return () => {
      cancelAnimationFrame(raf);
      minuteurs.forEach((m) => clearTimeout(m));
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("contextmenu", noCtx);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", lever);
      window.removeEventListener("pointercancel", lever);
    };
  }, [config.tol, config.grace, config.n, config.tous, config.miroir]);

  return (
    <div className="relative" style={{ width: ZONE_LARGEUR_CSS, aspectRatio: `${W}/${H}` }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="minigame-canvas block h-full w-full"
        style={{ imageRendering: "pixelated", touchAction: "none" }}
      />
      {tentation && (
        <p className="pointer-events-none absolute inset-x-0 bottom-[8%] px-[24px] text-center font-mono text-[13px] leading-[1.5] text-[var(--color-ink)]">
          {tentation}
        </p>
      )}
    </div>
  );
}
