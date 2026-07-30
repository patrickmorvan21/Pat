"use client";

/**
 * LE FOND DE BRAISES — le liant visuel de la séquence de mort (Notion 30/07).
 *
 * Présent en bas de TOUS les écrans de la séquence : La mort · Le fragment ·
 * Le Registre · La Relique. Un lit de braises MINCE qui respire, jamais une
 * flamme haute — le feu est passé, il reste ce qui couve.
 *
 * PORT FIDÈLE du moteur de `maquettes/flamme_braise_v3.html` (la maquette
 * validée, versionnée le 30/07), verrouillé sur le réglage retenu :
 *   grain 3 · tick 45ms · src 0.94 · boost 0.06 · cool 0.082 · lit 3 rangs ·
 *   zoneBasse 0.14 · frein 0.55 · bruit 0.52 · braises 10 · vent 1.15 ·
 *   reprise 0.05 · coolVar 0.65 · cendres 2/pas · palier 10 pas
 * (Densité haute · Hauteur moyenne · Lit mince · Irrégularité sauvage ·
 *  Cendres fines · Respiration normale.)
 *
 * Principes techniques VERROUILLÉS (tous portés tels quels) :
 *   • Deux couleurs, seuillage Bayer 4×4 — le `boost` de densité ABAISSE le
 *     seuil, jamais de dégradé, jamais d'alpha.
 *   • Respiration par PALIERS : 16 valeurs multiplicatrices (0.70 → 1.22,
 *     montée plus longue que la chute), qui montent la source ET ralentissent
 *     le refroidissement (`cool / respire`).
 *   • Quatre sources d'irrégularité, toutes gardées : un lit de braises
 *     vivantes (naissent, dérivent, déclinent après 70 % de leur vie) · un
 *     bruit de VALEUR lissé à 3 octaves (hash, jamais un sinus — rien n'est
 *     périodique) · un VENT COHÉRENT (une seule valeur qui dérive) appliqué
 *     en cisaillement sous-cellule croissant avec la hauteur · des REPRISES
 *     brèves sur une colonne.
 *   • Les cendres naissent à la crête des colonnes chaudes, montent en
 *     ondulant, suivent le vent, et se raréfient par PROBABILITÉ DE DESSIN.
 */

import { useEffect, useRef } from "react";
import { animReduced } from "@/lib/settings";

const ORANGE = "#e0632a";

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/* Le réglage retenu, verbatim (panneau de la maquette). */
const GRAIN = 3;
const TICK = 45;
const SRC = 0.94;
const BOOST = 0.06;
const COOL = 0.082;
const LIT_RANGS = 3;
const ZONE_BASSE = 0.14;
const FREIN = 0.55;
const BRUIT = 0.52;
const N_BRAISES = 10;
const VENT = 1.15;
const REPRISE = 0.05;
const COOL_VAR = 0.65;
const CENDRES_PAR_PAS = 2;
const PALIER_PAS = 10;

/** Respiration : multiplicateur par paliers entiers — montée plus longue que
    la chute, jamais une interpolation. (Tableau BREATH de la maquette.) */
const BREATH = [0.70, 0.76, 0.84, 0.93, 1.02, 1.10, 1.17, 1.21, 1.22, 1.17, 1.09, 0.99, 0.89, 0.80, 0.74, 0.71];

/* Bruit de valeur lissé (hash) — casse toute périodicité, contrairement à un
   sinus. Copié de la maquette. */
function hash1(n: number) {
  n = (n << 13) ^ n;
  return 1 - ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824;
}
function noise1(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash1(i);
  const b = hash1(i + 1);
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u; /* -1 … 1 */
}
function fbm(x: number) {
  /* trois octaves : grosses masses + détail */
  return noise1(x) * 0.55 + noise1(x * 2.37 + 11.7) * 0.29 + noise1(x * 4.91 + 41.3) * 0.16;
}

export default function FondBraises({
  height = 56,
  className,
}: {
  /** Hauteur CSS du FOYER (la partie qui brûle), en px. Le canvas, lui,
      couvre tout le cadre : les cendres doivent pouvoir monter PAR-DESSUS
      l'interface (retour Patrick 30/07 — « là c'est coupé »), le composant
      est donc un calque plein écran posé après le contenu, jamais cliquable. */
  height?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: true });
    if (!ctx) return;

    const cssW = cv.parentElement?.clientWidth || 390;
    const cssH = cv.parentElement?.clientHeight || 800;
    const W = Math.max(8, Math.round(cssW / GRAIN));
    /* HT = hauteur totale du canvas (tout l'écran, territoire des cendres) ;
       HF = hauteur du foyer (la simulation de chaleur reste confinée en bas). */
    const HT = Math.max(16, Math.round(cssH / GRAIN));
    const HF = Math.max(8, Math.min(HT - 4, Math.round(height / GRAIN)));
    cv.width = W;
    cv.height = HT;
    ctx.imageSmoothingEnabled = false;

    /* La grille de chaleur vit SOL EN BAS (y=0 = sol), dessinée retournée —
       exactement comme la maquette. Elle ne couvre que le foyer (HF). */
    const heat = new Float32Array(W * HF);
    const Hget = (y: number, x: number) => {
      if (x < 0) x = 0;
      if (x >= W) x = W - 1;
      if (y < 0) y = 0;
      if (y >= HF) return 0;
      return heat[y * W + x];
    };

    /* Braises du lit : des foyers qui vivent, dérivent, puis déclinent. */
    type Braise = { x: number; r: number; f: number; derive: number; age: number; vie: number };
    const braises: Braise[] = [];
    const neuveBraise = (): Braise => ({
      x: Math.random() * W,
      r: 3 + Math.random() * 10,
      f: 0.45 + Math.random() * 0.75,
      derive: (Math.random() - 0.5) * 0.05,
      age: 0,
      vie: 90 + Math.random() * 400,
    });
    function majBraises() {
      while (braises.length < N_BRAISES) braises.push(neuveBraise());
      for (let i = braises.length - 1; i >= 0; i--) {
        const b = braises[i];
        b.age++;
        b.x += b.derive;
        if (b.x < -b.r) b.x = W + b.r;
        if (b.x > W + b.r) b.x = -b.r;
        if (b.age > b.vie) braises.splice(i, 1);
      }
    }
    function forceBraises(x: number) {
      let s = 0;
      for (const b of braises) {
        const d = Math.abs(x - b.x);
        if (d > b.r) continue;
        const t = 1 - d / b.r;
        /* extinction progressive en fin de vie, par paliers */
        const declin = b.age > b.vie * 0.7 ? 1 - (b.age - b.vie * 0.7) / (b.vie * 0.3) : 1;
        s += b.f * t * t * declin;
      }
      return s;
    }

    type Cendre = { x: number; y: number; v: number; sway: number; f: number; s: number; age: number; life: number };
    const cendres: Cendre[] = [];
    type Reprise = { x: number; l: number; age: number; f: number };
    const reprises: Reprise[] = [];

    let bi = 0;
    let bAcc = 0;
    let tps = 0;
    let vent = 0;
    let ventCible = 0;

    function pas() {
      tps++;
      bAcc++;
      if (bAcc >= PALIER_PAS) {
        bAcc = 0;
        bi = (bi + 1) % BREATH.length;
      }
      const respire = BREATH[bi];

      majBraises();

      /* vent cohérent : une valeur unique qui dérive lentement */
      if (Math.random() < 0.012) ventCible = (Math.random() * 2 - 1) * VENT;
      vent += (ventCible - vent) * 0.03;

      /* reprises : une colonne s'enflamme brièvement, sans prévenir */
      if (Math.random() < REPRISE)
        reprises.push({ x: (Math.random() * W) | 0, l: 6 + Math.random() * 16, age: 0, f: 0.5 + Math.random() * 0.8 });
      for (let i = reprises.length - 1; i >= 0; i--) {
        if (++reprises[i].age > reprises[i].l) reprises.splice(i, 1);
      }

      /* ── le lit : plusieurs rangées incandescentes, pas une simple ligne */
      const dx1 = tps * 0.004;
      const dx2 = tps * 0.011;
      const RANGS = Math.min(LIT_RANGS, HF - 3);
      for (let x = 0; x < W; x++) {
        const n = fbm(x * 0.055 + dx1) * 0.6 + fbm(x * 0.19 + dx2) * 0.4;
        let base = 0.4 + forceBraises(x) * 0.55 + n * BRUIT;
        for (const r of reprises) {
          const dd = Math.abs(x - r.x);
          if (dd < 4) base += r.f * (1 - dd / 4) * (1 - r.age / r.l);
        }
        const v0 = SRC * respire * base;
        for (let y = 0; y < RANGS; y++) {
          const t = 1 - y / RANGS; /* 1 au sol → 0 au sommet du lit */
          /* le sol brûle plein ; le haut du lit s'effiloche déjà */
          let v = v0 * (0.62 + 0.75 * t) * (0.86 + Math.random() * 0.3);
          /* les trous de charbon noir ne s'ouvrent qu'en haut du lit */
          if (y > RANGS * 0.45 && Math.random() < 0.05 + 0.1 * (1 - t)) v *= 0.32;
          heat[y * W + x] = Math.max(0, Math.min(1.6, v));
        }
      }

      /* ── propagation : cisaillement par le vent (échantillon sous-cellule),
         refroidissement variable par colonne, freiné dans la zone basse.
         La respiration RALENTIT aussi le refroidissement (cool / respire). */
      const coolBase = COOL / respire;
      for (let y = RANGS; y < HF; y++) {
        const cis = vent * (y / HF) * 1.7; /* la flamme penche en montant */
        const zone = y / HF;
        const frein = zone < ZONE_BASSE ? FREIN + (1 - FREIN) * (zone / ZONE_BASSE) : 1;
        for (let x = 0; x < W; x++) {
          const sx = x - cis;
          const xi = Math.floor(sx);
          const fr = sx - xi;
          const g = Hget(y - 1, xi) * (1 - fr) + Hget(y - 1, xi + 1) * fr; /* échantillon décalé */
          const v = (Hget(y - 1, xi - 1) + g * 2 + Hget(y - 1, xi + 1) + Hget(y - 2, xi)) / 5.02;
          const varCool = 1 + fbm(x * 0.09 + tps * 0.006) * COOL_VAR; /* certaines colonnes tiennent */
          heat[y * W + x] = Math.max(0, v - coolBase * frein * varCool * (0.5 + Math.random() * 1.0));
        }
      }

      /* ── cendres, émises à la crête des colonnes chaudes. Elles quittent le
         foyer et montent dans TOUT le cadre (le canvas couvre l'écran) : on
         doit les voir voler par-dessus l'interface, jamais coupées. */
      for (let k = 0; k < CENDRES_PAR_PAS; k++) {
        const x = (Math.random() * W) | 0;
        let y = HF - 1;
        while (y > 0 && Hget(y, x) < 0.1) y--;
        if (y > 2)
          cendres.push({
            x,
            y: y + 1,
            v: 0.3 + Math.random() * 0.5,
            sway: 0.4 + Math.random() * 0.8,
            f: 0.05 + Math.random() * 0.12,
            s: Math.random() * 6.283,
            age: 0,
            life: 44 + Math.random() * 80,
          });
      }
      for (let i = cendres.length - 1; i >= 0; i--) {
        const a = cendres[i];
        a.age++;
        a.y += a.v;
        a.x += vent * 0.05; /* les cendres suivent le vent */
        if (a.age > a.life || a.y > HT + 2) cendres.splice(i, 1);
      }
    }

    function dessine() {
      /* Calque TRANSPARENT : seul le feu et les cendres se dessinent — le
         charbon, c'est déjà le fond de l'écran dessous. (Un fond plein ici
         masquerait toute l'interface, puisque le canvas couvre le cadre.) */
      ctx!.clearRect(0, 0, W, HT);

      ctx!.fillStyle = ORANGE;
      for (let y = 0; y < HF; y++) {
        const py = HT - 1 - y;
        const brow = BAYER[py & 3];
        for (let x = 0; x < W; x++) {
          const v = heat[y * W + x];
          if (v <= 0.02) continue;
          /* le boost de densité ABAISSE le seuil de trame */
          if (v > (brow[x & 3] + 0.5) / 16 - BOOST) ctx!.fillRect(x, py, 1, 1);
        }
      }

      for (const a of cendres) {
        const reste = 1 - a.age / a.life;
        /* raréfaction par probabilité de dessin — jamais par opacité */
        if (Math.random() > reste * 0.85) continue;
        const px = (a.x + Math.sin(a.age * a.f + a.s) * a.sway) | 0;
        const py = HT - 1 - (a.y | 0);
        if (py < 0 || py >= HT || px < 0 || px >= W) continue;
        ctx!.fillStyle = Math.random() < 0.72 ? ORANGE : "rgba(255,255,255,.55)";
        ctx!.fillRect(px, py, 1, 1);
      }
    }

    if (animReduced()) {
      for (let i = 0; i < 60; i++) pas();
      dessine();
      return;
    }

    /* Pas de temps fixe avec accumulateur (maquette) : la simulation avance à
       TICK constant quel que soit le rafraîchissement de l'écran. */
    let raf = 0;
    let acc = 0;
    let last = 0;
    function boucle(t: number) {
      raf = requestAnimationFrame(boucle);
      if (!last) last = t;
      acc += t - last;
      last = t;
      let n = 0;
      while (acc >= TICK && n < 4) {
        acc -= TICK;
        pas();
        n++;
      }
      dessine();
    }
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [height]);

  return (
    <div className={`pointer-events-none absolute inset-0 ${className ?? ""}`} aria-hidden>
      <canvas ref={ref} className="block h-full w-full" style={{ imageRendering: "pixelated" }} />
    </div>
  );
}
