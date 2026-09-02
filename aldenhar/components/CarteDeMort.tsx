"use client";

/**
 * LA CARTE DE MORT — l'écran « La mort » est une carte à collectionner.
 *
 * ⚠️ REFONTE DU 02/09 (retour Patrick : « je préférais la carte de la version 1
 * faite avec opus »). La v1 est le prototype `carte_de_mort.html`, et ce qui la
 * rendait meilleure est STRUCTUREL, pas décoratif : **son texte est du DOM.**
 * Ma première version dessinait tout — texte compris — sur un canvas 600×900
 * affiché en 300×450 avec `image-rendering: pixelated` : une réduction 2:1 en
 * mode pixelated prend un pixel sur quatre, donc les lettres ressortaient
 * crénelées et sales. Ici le canvas ne porte plus que la MATIÈRE (forme, bord,
 * semis) et le texte est rendu par le navigateur, net à toute densité d'écran.
 *
 * Les trois corrections demandées avec la refonte :
 *   1. une BORDURE ORANGE À RADIUS, en pixel art — l'arrondi est fait de
 *      marches de `PAS` pixels (jamais un `border-radius` lisse) ;
 *   2. aucun titre au-dessus de la carte (l'eyebrow est retiré, côté écran) ;
 *   3. la carte descend un peu (marge du haut, côté écran).
 *
 * Ce qu'elle porte : le rang au Registre (ou « hors des Cent »), l'acte,
 * l'ILLUSTRATION DU LIEU DE LA MORT (l'image qui était à l'écran au jet fatal),
 * le nom, l'épitaphe, les seuls chiffres bruts du jeu, et la relique forgée.
 *
 * ⚠️ DEUX RENDUS, UNE SEULE SOURCE DE DONNÉES. L'affichage est du DOM ; l'export
 * PNG (« Partager ») doit produire un FICHIER, donc il repasse par le canvas. Le
 * contenu vient d'une fabrique unique (`contenuCarte`) et la géométrie d'une
 * table unique (`G`) : seul le moteur de rendu diffère. Toute ligne ajoutée à
 * l'un se voit dans l'autre sans y penser.
 *
 * Le reste est conservé du 01/09 : rareté = PROFONDEUR atteinte (le cadre
 * s'épaissit avec l'acte, jamais un tirage), brillance en trame Bayer qui suit
 * l'inclinaison (paliers de 3°, retour en trois crans, `animReduced()` →
 * carte plate), et la carte ne fait JAMAIS avancer l'écran (`stopPropagation`).
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Relic } from "@/lib/player-memory";
import type { Bilan } from "@/components/DeathScreen";
import { assetSrc, assetUrl } from "@/lib/assets";
import { seededRandom } from "@/lib/dither";
import { animReduced, haptic } from "@/lib/settings";

const CHARBON = "#1c1a16";
const ORANGE = "#e0632a";
const BLANC = "#ffffff";
/** Dimensions de la carte, en pixels d'écran. */
const CW = 300,
  CH = 450;
/** Le gros pixel : les marches de l'arrondi et le semis en font `PAS`. */
const PAS = 2;
/** Rayon de l'arrondi, en pixels d'écran (6 gros pixels). */
const RAYON = 12;
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const STEP = 3,
  MAX = 12;

/**
 * LA GÉOMÉTRIE, en pixels d'écran — partagée par le DOM et par l'export.
 * Le DOM place ses blocs en absolu sur ces valeurs : une carte a une taille
 * fixe, le flux n'apporterait qu'une occasion de diverger.
 */
const G = {
  marge: 14,
  entete: 27, // ligne de base de l'en-tête
  illuY: 34,
  illuH: 150,
  nomY: 222, // ligne de base du nom
  epiY: 238, // ligne de base de la 1re ligne d'épitaphe
  epiLH: 15,
  piedY: CH - 16, // ligne de base du pied
  reliqueY: CH - 30,
  filetY: CH - 41,
  statsY: CH - 50, // ligne de base de la DERNIÈRE ligne de stats
  statsLH: 15,
};
const LARG = CW - 2 * G.marge;

/** La profondeur = la rareté. Le cadre s'épaissit, les coins se marquent. */
const PROFONDEURS = [
  { acte: "Acte I", zone: "Les Landes", cadre: PAS, coins: false },
  { acte: "Acte II", zone: "", cadre: PAS * 2, coins: false },
  { acte: "Acte III", zone: "", cadre: PAS * 3, coins: true },
];

export type CarteDeMortProps = {
  heroName: string;
  day: number;
  epitaph: string;
  bilan: Bilan;
  relic: Relic;
  /** Rang dans Les Cent, ou null si le nom n'entre pas au livre. */
  rang: number | null;
  /** L'illustration du lieu de la mort (chemin `assets/…`). */
  image?: string;
  /** Index d'acte (0 = Acte I). */
  acte?: number;
};

function romain(n: number): string {
  const t: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let r = "";
  for (const [v, s] of t) while (n >= v) { r += s; n -= v; }
  return r || "I";
}

function ordinal(n: number): string {
  return n === 1 ? "1ʳᵉ" : `${n}ᵉ`;
}

/** LE CONTENU — une seule fabrique, lue par le DOM et par l'export. */
function contenuCarte(p: CarteDeMortProps) {
  const prof = PROFONDEURS[Math.min(PROFONDEURS.length - 1, p.acte ?? 0)];
  return {
    prof,
    rang: p.rang ? ordinal(p.rang) : "HORS DES CENT",
    acte: prof.acte.toUpperCase(),
    nom: p.heroName,
    epitaphe: p.epitaph,
    pied: [`PACTUM`, `JOUR ${romain(p.day)}`] as const,
    relique: p.relic.name,
    stats: [
      ["JOURS TENUS", String(p.bilan.jours)],
      ["POINT LE PLUS PROFOND", prof.zone || p.bilan.plusLoin],
      ["LIEUX TRAVERSÉS", String(p.bilan.lieux)],
      ["COMBATS TRAVERSÉS", String(p.bilan.rencontres)],
      ["DÉS LANCÉS", `${p.bilan.des} · ${p.bilan.desTenus} tenus`],
      ["DESTINS · MALÉDICTIONS", `${p.bilan.destins} · ${p.bilan.maledictions}`],
    ] as [string, string][],
  };
}

/**
 * LA FORME À COINS ARRONDIS, EN MARCHES DE PIXELS.
 * Remplie ligne par ligne : le retrait horizontal d'une ligne suit un quart de
 * cercle ARRONDI AU GROS PIXEL, ce qui donne l'escalier voulu. Une bordure se
 * fait en peignant la forme pleine en orange puis la même forme rétrécie de
 * `e` en charbon — l'épaisseur suit l'arrondi sans jamais s'en écarter.
 */
function formePixel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  couleur: string,
) {
  ctx.fillStyle = couleur;
  for (let py = 0; py < h; py += PAS) {
    let inset = 0;
    if (py < r) {
      const dy = r - PAS - py;
      inset = r - Math.sqrt(Math.max(0, r * r - dy * dy));
    } else if (py >= h - r) {
      const dy = py - (h - r);
      inset = r - Math.sqrt(Math.max(0, r * r - dy * dy));
    }
    inset = Math.round(inset / PAS) * PAS;
    ctx.fillRect(x + inset, y + py, w - 2 * inset, PAS);
  }
}

/**
 * LE FOND : la forme arrondie en charbon, sa bordure orange, le semis.
 * Dessiné en coordonnées d'écran ; l'export met simplement le contexte à
 * l'échelle, donc les marches restent proportionnelles.
 */
function dessinerFond(ctx: CanvasRenderingContext2D, p: CarteDeMortProps, rnd: () => number) {
  const { prof } = contenuCarte(p);
  const e = prof.cadre;
  ctx.clearRect(0, 0, CW, CH);
  // la bordure d'abord, l'intérieur ensuite : l'épaisseur suit l'arrondi
  formePixel(ctx, 0, 0, CW, CH, RAYON, ORANGE);
  formePixel(ctx, e, e, CW - 2 * e, CH - 2 * e, Math.max(0, RAYON - e), CHARBON);
  // le semis du fond : blanc-20 très clairsemé, seedé, en gros pixels
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  for (let i = 0; i < 210; i++) {
    const x = Math.floor((rnd() * (CW - 2 * RAYON) + RAYON) / PAS) * PAS;
    const y = Math.floor((rnd() * (CH - 2 * RAYON) + RAYON) / PAS) * PAS;
    ctx.fillRect(x, y, PAS, PAS);
  }
  if (prof.coins) {
    // Acte III : quatre encoches blanches, la marque la plus profonde
    ctx.fillStyle = BLANC;
    ctx.fillRect(RAYON, e, 9, PAS);
    ctx.fillRect(e, RAYON, PAS, 9);
    ctx.fillRect(CW - RAYON - 9, CH - e - PAS, 9, PAS);
    ctx.fillRect(CW - e - PAS, CH - RAYON - 9, PAS, 9);
  }
}

/** Coupe un texte en lignes qui tiennent dans `max` px (police courante). */
function lignes(ctx: CanvasRenderingContext2D, texte: string, max: number, maxLignes: number): string[] {
  const mots = texte.replace(/\s+/g, " ").trim().split(" ");
  const out: string[] = [];
  let cur = "";
  for (const m of mots) {
    const essai = cur ? `${cur} ${m}` : m;
    if (ctx.measureText(essai).width <= max) cur = essai;
    else {
      if (cur) out.push(cur);
      cur = m;
    }
  }
  if (cur) out.push(cur);
  if (out.length > maxLignes) {
    const g = out.slice(0, maxLignes);
    g[maxLignes - 1] = g[maxLignes - 1].replace(/[\s,;:.]+$/, "") + "…";
    return g;
  }
  return out;
}

/**
 * L'EXPORT — la même carte, texte compris, sur un canvas à `ech` fois la
 * taille d'écran. Sert UNIQUEMENT au fichier PNG de « Partager » : ce qu'on
 * regarde à l'écran, c'est le DOM.
 */
function dessinerExport(
  ctx: CanvasRenderingContext2D,
  p: CarteDeMortProps,
  illu: HTMLImageElement | null,
  ech: number,
) {
  const c = contenuCarte(p);
  const rnd = seededRandom(`carte|${p.heroName}|${p.day}|${p.bilan.des}`);
  ctx.setTransform(ech, 0, 0, ech, 0, 0);
  ctx.imageSmoothingEnabled = false;
  dessinerFond(ctx, p, rnd);

  /* ─── l'illustration du lieu, dissoute en bas ───────────────────────── */
  if (illu) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(G.marge, G.illuY, LARG, G.illuH);
    ctx.clip();
    const sw = illu.naturalWidth,
      sh = illu.naturalHeight;
    const ratio = LARG / G.illuH;
    let cw = sw,
      ch = sw / ratio;
    if (ch > sh) {
      ch = sh;
      cw = sh * ratio;
    }
    ctx.drawImage(illu, (sw - cw) / 2, (sh - ch) / 2, cw, ch, G.marge, G.illuY, LARG, G.illuH);
    ctx.restore();
    // dissolution : densité de charbon croissante vers le bas (jamais un alpha)
    ctx.fillStyle = CHARBON;
    for (let y = G.illuY + G.illuH - 42; y < G.illuY + G.illuH; y++) {
      const t = (y - (G.illuY + G.illuH - 42)) / 42;
      for (let x = G.marge; x < G.marge + LARG; x++) if (rnd() < t * t * 1.1) ctx.fillRect(x, y, 1, 1);
    }
  }

  /* ─── en-tête ───────────────────────────────────────────────────────── */
  ctx.textBaseline = "alphabetic";
  ctx.font = "500 9.5px 'Roboto Mono', monospace";
  ctx.letterSpacing = "1.8px";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  const prefixe = "REGISTRE · ";
  ctx.fillText(prefixe, G.marge, G.entete);
  ctx.fillStyle = ORANGE;
  ctx.fillText(c.rang, G.marge + ctx.measureText(prefixe).width, G.entete);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(c.acte, CW - G.marge, G.entete);
  ctx.letterSpacing = "0px";

  /* ─── nom, épitaphe ─────────────────────────────────────────────────── */
  ctx.textAlign = "left";
  ctx.fillStyle = ORANGE;
  let taille = 34;
  ctx.font = `${taille}px 'Instrument Serif', serif`;
  while (ctx.measureText(c.nom).width > LARG && taille > 18) {
    taille -= 1;
    ctx.font = `${taille}px 'Instrument Serif', serif`;
  }
  ctx.fillText(c.nom, G.marge, G.nomY);
  ctx.fillStyle = BLANC;
  ctx.font = "10px 'Roboto Mono', monospace";
  lignes(ctx, c.epitaphe, LARG, 4).forEach((l, i) => ctx.fillText(l, G.marge, G.epiY + i * G.epiLH));

  /* ─── pied, relique, chiffres ───────────────────────────────────────── */
  ctx.font = "500 8.5px 'Roboto Mono', monospace";
  ctx.letterSpacing = "1.4px";
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillText(c.pied[0], G.marge, G.piedY);
  ctx.textAlign = "right";
  ctx.fillText(c.pied[1], CW - G.marge, G.piedY);
  ctx.letterSpacing = "0px";

  ctx.textAlign = "left";
  ctx.font = "500 9px 'Roboto Mono', monospace";
  ctx.letterSpacing = "1.3px";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("RELIQUE FORGÉE", G.marge, G.reliqueY);
  ctx.letterSpacing = "0px";
  ctx.textAlign = "right";
  ctx.font = "11.5px 'Roboto Mono', monospace";
  ctx.fillStyle = ORANGE;
  ctx.fillText(c.relique, CW - G.marge, G.reliqueY);

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  for (let x = G.marge; x < CW - G.marge; x += 3) ctx.fillRect(x, G.filetY, 2, 1);

  c.stats.forEach(([k, v], i) => {
    const y = G.statsY - (c.stats.length - 1 - i) * G.statsLH;
    ctx.textAlign = "left";
    ctx.font = "500 9px 'Roboto Mono', monospace";
    ctx.letterSpacing = "1.3px";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(k, G.marge, y);
    ctx.letterSpacing = "0px";
    ctx.textAlign = "right";
    ctx.font = "11.5px 'Roboto Mono', monospace";
    ctx.fillStyle = BLANC;
    ctx.fillText(v, CW - G.marge, y);
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * LA BRILLANCE — une bande diagonale qui suit l'inclinaison, en quatre paliers
 * de densité Bayer, blanc sur le palier le plus dense. Dessinée à demi-
 * résolution et agrandie en pixels francs. Bornée à la forme arrondie : sans
 * ça, en `mix-blend: screen`, elle allumerait les coins hors de la carte.
 */
function dessinerBrillance(ctx: CanvasRenderingContext2D, rx: number, ry: number, rnd: () => number) {
  const W = CW / 2,
    H = CH / 2,
    R = RAYON / 2;
  ctx.clearRect(0, 0, W, H);
  const amp = Math.min(1, Math.hypot(rx, ry) / MAX);
  if (!isFinite(amp) || amp <= 0.02) return;
  const ang = -0.62,
    ca = Math.cos(ang),
    sa = Math.sin(ang);
  const off = (ry / MAX) * 0.62 + (rx / MAX) * 0.18,
    bandW = 0.24;
  const dedans = (px: number, py: number) => {
    let inset = 0;
    if (py < R) {
      const dy = R - 1 - py;
      inset = R - Math.sqrt(Math.max(0, R * R - dy * dy));
    } else if (py >= H - R) {
      const dy = py - (H - R);
      inset = R - Math.sqrt(Math.max(0, R * R - dy * dy));
    }
    return px >= inset && px < W - inset;
  };
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      if (!dedans(px, py)) continue;
      const u = px / W - 0.5,
        v = py / H - 0.5,
        d = u * ca + v * sa - off;
      let t = Math.max(0, 1 - Math.abs(d) / bandW);
      const t2 = Math.max(0, 1 - Math.abs(d + 0.34) / (bandW * 0.5)) * 0.55;
      t = Math.max(t, t2);
      if (t <= 0) continue;
      t = Math.pow(t, 2) * amp;
      const lvl = Math.min(3, Math.floor(t * 4.4));
      if (lvl === 0) continue;
      if (BAYER[py & 3][px & 3] / 16 > lvl / 9) continue;
      ctx.fillStyle = lvl >= 3 && rnd() < 0.45 ? BLANC : ORANGE;
      ctx.fillRect(px, py, 1, 1);
    }
  }
  for (let i = 0; i < 12 * amp; i++) {
    const py = Math.floor(rnd() * H),
      v = py / H - 0.5;
    const u = (off - v * sa) / ca + (rnd() - 0.5) * 0.16,
      px = Math.floor((u + 0.5) * W);
    if (!dedans(px, py)) continue;
    ctx.fillStyle = BLANC;
    ctx.fillRect(px, py, 1, 1);
  }
}

/** Le nom du héros : réduit par demi-points jusqu'à tenir, jamais tronqué. */
function NomAjuste({ nom }: { nom: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [taille, setTaille] = useState(34);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t = 34;
    el.style.fontSize = `${t}px`;
    while (el.scrollWidth > LARG && t > 18) {
      t -= 1;
      el.style.fontSize = `${t}px`;
    }
    setTaille(t);
  }, [nom]);
  return (
    <div
      ref={ref}
      className="whitespace-nowrap leading-none text-[var(--color-accent)]"
      style={{ fontFamily: "var(--font-title)", fontSize: taille }}
    >
      {nom}
    </div>
  );
}

export default function CarteDeMort(props: CarteDeMortProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fondRef = useRef<HTMLCanvasElement>(null);
  const shineRef = useRef<HTMLCanvasElement>(null);
  const [hint, setHint] = useState("Incline la carte avec ton doigt");
  const [prete, setPrete] = useState(false);
  const plat = animReduced();
  const { heroName, day, epitaph, bilan, relic, rang, image, acte } = props;
  const c = contenuCarte(props);

  /* ─── le fond : une passe, dès le montage ────────────────────────────── */
  useEffect(() => {
    const cv = fondRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    dessinerFond(ctx, { heroName, day, epitaph, bilan, relic, rang, image, acte }, seededRandom(`fond|${heroName}|${day}`));
    setPrete(true);
  }, [heroName, day, epitaph, bilan, relic, rang, image, acte]);

  /* ─── l'inclinaison, quantifiée ──────────────────────────────────────── */
  useEffect(() => {
    const card = cardRef.current,
      shine = shineRef.current;
    if (!card || !shine || plat) return;
    const sctx = shine.getContext("2d")!;
    const rnd = seededRandom(`brillance|${heroName}`);
    let rx = 0,
      ry = 0,
      dragging = false,
      lastKey = "0_0";
    const timers: number[] = [];
    function apply(nrx: number, nry: number) {
      if (!isFinite(nrx) || !isFinite(nry)) return;
      nrx = Math.max(-MAX, Math.min(MAX, Math.round(nrx / STEP) * STEP));
      nry = Math.max(-MAX, Math.min(MAX, Math.round(nry / STEP) * STEP));
      const key = `${nrx}_${nry}`;
      if (key === lastKey) return;
      lastKey = key;
      rx = nrx;
      ry = nry;
      card!.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      const amp = Math.min(1, Math.hypot(rx, ry) / MAX);
      shine!.style.opacity = amp > 0.02 ? "1" : "0";
      dessinerBrillance(sctx, rx, ry, rnd);
      if (amp > 0.02) haptic(4);
    }
    function fromPointer(e: PointerEvent) {
      const r = card!.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      apply(-dy * MAX * 1.15, dx * MAX * 1.15);
    }
    function onDown(e: PointerEvent) {
      dragging = true;
      try { card!.setPointerCapture(e.pointerId); } catch { /* sans capture, on suit quand même */ }
      setHint("Relâche pour la reposer");
      fromPointer(e);
      e.preventDefault();
    }
    function onMove(e: PointerEvent) {
      if (dragging) fromPointer(e);
    }
    function release() {
      if (!dragging) return;
      dragging = false;
      setHint("Incline la carte avec ton doigt");
      // retour en TROIS CRANS (jamais une interpolation)
      const s: [number, number][] = [[rx * 0.6, ry * 0.6], [rx * 0.3, ry * 0.3], [0, 0]];
      s.forEach((v, i) => timers.push(window.setTimeout(() => apply(v[0], v[1]), 70 * (i + 1))));
    }
    card.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      timers.forEach((t) => clearTimeout(t));
      card.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [plat, heroName]);

  /* ─── partager : la carte redessinée en fichier ──────────────────────── */
  async function partager() {
    const ech = 2;
    const cv = document.createElement("canvas");
    cv.width = CW * ech;
    cv.height = CH * ech;
    const ctx = cv.getContext("2d")!;
    const p: CarteDeMortProps = { heroName, day, epitaph, bilan, relic, rang, image, acte };
    const im = await new Promise<HTMLImageElement | null>((res) => {
      if (!image) return res(null);
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => res(null);
      i.src = assetSrc(image);
    });
    dessinerExport(ctx, p, im, ech);
    const blob: Blob | null = await new Promise((res) => cv.toBlob(res, "image/png"));
    if (!blob) {
      setHint("Impossible d'exporter la carte ici");
      return;
    }
    const nom = `pactum-${heroName.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-jour-${day}.png`;
    const fichier = new File([blob], nom, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    try {
      if (nav.share && nav.canShare && nav.canShare({ files: [fichier] })) {
        await nav.share({ files: [fichier], title: `PACTUM — ${heroName}`, text: `${heroName}, jour ${day}.` });
        setHint("La carte est partie — image et rang au Registre");
        return;
      }
    } catch {
      // partage annulé ou refusé : on retombe sur le téléchargement
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    setHint("Carte enregistrée en image");
  }

  const labelStyle = "font-mono text-[9px] font-medium uppercase tracking-[1.3px] text-[var(--color-ink)] opacity-50";

  return (
    <div
      className="flex w-full flex-col items-center"
      // Rien ici ne fait avancer l'écran de mort : ni le tilt, ni le CTA.
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-center" style={{ perspective: "900px", touchAction: "none" }}>
        <div
          ref={cardRef}
          className="relative select-none"
          style={{ width: CW, height: CH, transformStyle: "preserve-3d", willChange: "transform" }}
          data-carte-mort
          data-prete={prete ? "1" : "0"}
        >
          {/* LE FOND : forme arrondie, bordure orange en marches, semis */}
          <canvas
            ref={fondRef}
            width={CW}
            height={CH}
            className="absolute inset-0"
            style={{ imageRendering: "pixelated" }}
            aria-hidden
          />

          {/* L'ILLUSTRATION du lieu de la mort, dissoute en bas */}
          {image && (
            <div
              className="absolute overflow-hidden"
              style={{ left: G.marge, top: G.illuY, width: LARG, height: G.illuH }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                src={assetUrl(image)}
                className="h-full w-full select-none object-cover"
                draggable={false}
              />
              <div className="dissolve-bottom" aria-hidden />
            </div>
          )}

          {/* LE TEXTE — en DOM, donc net : c'est tout l'objet de la refonte */}
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            <div
              className="absolute flex items-baseline justify-between"
              style={{ left: G.marge, right: G.marge, top: G.entete - 10 }}
            >
              <span className="font-mono text-[9.5px] font-medium uppercase tracking-[1.8px] text-[var(--color-ink)] opacity-50">
                Registre&nbsp;·&nbsp;<b className="font-medium text-[var(--color-accent)] opacity-100">{c.rang}</b>
              </span>
              <span className="font-mono text-[9.5px] font-medium uppercase tracking-[1.8px] text-[var(--color-ink)] opacity-50">
                {c.acte}
              </span>
            </div>

            <div className="absolute" style={{ left: G.marge, right: G.marge, top: G.nomY - 26 }}>
              <NomAjuste nom={c.nom} />
              <p className="mt-[7px] font-mono text-[10px] leading-[1.5] text-[var(--color-ink)]">{c.epitaphe}</p>
            </div>

            <div className="absolute" style={{ left: G.marge, right: G.marge, top: G.statsY - 5 * G.statsLH - 9 }}>
              {c.stats.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between" style={{ height: G.statsLH }}>
                  <span className={labelStyle}>{k}</span>
                  <span className="font-mono text-[11.5px] text-[var(--color-ink)]">{v}</span>
                </div>
              ))}
            </div>

            {/* le filet : des pixels espacés, jamais un trait plein */}
            <div
              className="absolute h-px"
              style={{
                left: G.marge,
                right: G.marge,
                top: G.filetY,
                backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.2) 0 2px, transparent 2px 3px)",
              }}
              aria-hidden
            />

            <div
              className="absolute flex items-baseline justify-between"
              style={{ left: G.marge, right: G.marge, top: G.reliqueY - 9 }}
            >
              <span className={labelStyle}>Relique forgée</span>
              <span className="font-mono text-[11.5px] text-[var(--color-accent)]">{c.relique}</span>
            </div>

            <div
              className="absolute flex justify-between font-mono text-[8.5px] font-medium uppercase tracking-[1.4px] text-[var(--color-ink)] opacity-20"
              style={{ left: G.marge, right: G.marge, top: G.piedY - 8 }}
            >
              <span>{c.pied[0]}</span>
              <span>{c.pied[1]}</span>
            </div>
          </div>

          {/* LA BRILLANCE, par-dessus tout */}
          <canvas
            ref={shineRef}
            width={CW / 2}
            height={CH / 2}
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ imageRendering: "pixelated", mixBlendMode: "screen", opacity: 0, zIndex: 3 }}
            aria-hidden
          />
        </div>
      </div>
      <p className="mt-[12px] min-h-[1.3em] px-[20px] text-center font-mono text-[12px] text-[var(--color-ink)] opacity-50">
        {plat ? "" : hint}
      </p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void partager();
        }}
        className="relative mt-[8px] h-[34px] w-[298px] bg-[var(--color-accent)] font-mono text-[12px] font-medium uppercase tracking-[2.4px] text-[var(--color-bg)]"
        data-partager
      >
        {/* entailles de coins charbon : le cadre reste un calque, jamais une
            bordure sur le bouton (piège du 16/07) */}
        <span className="absolute left-0 top-0 h-[6px] w-[2px] bg-[var(--color-bg)]" aria-hidden />
        <span className="absolute right-0 top-0 h-[2px] w-[6px] bg-[var(--color-bg)]" aria-hidden />
        <span className="absolute bottom-0 right-0 h-[6px] w-[2px] bg-[var(--color-bg)]" aria-hidden />
        <span className="absolute bottom-0 left-0 h-[2px] w-[6px] bg-[var(--color-bg)]" aria-hidden />
        Partager
      </button>
    </div>
  );
}
