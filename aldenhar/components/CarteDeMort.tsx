"use client";

/**
 * LA CARTE DE MORT — l'écran « La mort » devient une carte à collectionner
 * (prototype `carte_de_mort.html` de Patrick, 01/09 : « améliore la qualité
 * de la carte, les graphismes, garde le lien "Touche pour continuer" en bas,
 * mais ajoute un CTA Partager »).
 *
 * Ce qu'elle porte : le rang au Registre (ou « hors des Cent »), l'acte et
 * la zone, l'ILLUSTRATION DU LIEU DE LA MORT (l'image qui était à l'écran
 * au jet fatal — jamais un portrait générique), le nom, l'épitaphe, les
 * seuls chiffres bruts du jeu, et la relique forgée.
 *
 * Comment elle est faite :
 *   - UN SEUL dessin (`dessinerCarte`), sur un canvas 600×900 affiché en
 *     300×450 : ce qu'on voit est ce qu'on partage, au pixel près ;
 *   - le fond, la dissolution de l'image, les bords rongés et la trame de
 *     brillance sont des DENSITÉS de pixels (Bayer), jamais un dégradé ni
 *     une opacité animée (règle DA) ;
 *   - la BRILLANCE suit l'inclinaison de la carte sous le doigt, quantifiée
 *     par paliers de 3° (max 12°), retour en trois crans ; `animReduced()`
 *     → carte plate, aucune inclinaison ;
 *   - la RARETÉ est la PROFONDEUR atteinte (l'acte), jamais un tirage : le
 *     cadre s'épaissit avec l'acte. Aujourd'hui tout le monde meurt en Acte I ;
 *     la table est prête pour les suivants ;
 *   - PARTAGER exporte la carte (fichier PNG) par `navigator.share` quand le
 *     système sait partager un fichier, sinon la télécharge.
 *
 * ⚠️ La carte ne fait JAMAIS avancer l'écran : incliner, relâcher, partager
 * — tout s'arrête ici (`stopPropagation`). Continuer, c'est le lien du bas.
 */

import { useEffect, useRef, useState } from "react";
import type { Relic } from "@/lib/player-memory";
import type { Bilan } from "@/components/DeathScreen";
import { assetSrc } from "@/lib/assets";
import { seededRandom } from "@/lib/dither";
import { animReduced, haptic } from "@/lib/settings";

const CHARBON = "#1c1a16";
const ORANGE = "#e0632a";
const BLANC = "#ffffff";
/** Dimensions AFFICHÉES ; le canvas est dessiné à `ECHELLE` fois. */
const CW = 300,
  CH = 450,
  ECHELLE = 2;
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const STEP = 3,
  MAX = 12;

/** La profondeur = la rareté. Le cadre s'épaissit, les coins se marquent. */
const PROFONDEURS = [
  { acte: "Acte I", zone: "Les Landes", cadre: 1, coins: false },
  { acte: "Acte II", zone: "", cadre: 2, coins: false },
  { acte: "Acte III", zone: "", cadre: 3, coins: true },
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
 * LE DESSIN DE LA CARTE — utilisé tel quel pour l'affichage ET l'export.
 * Coordonnées en unités affichées (300×450), le contexte est mis à l'échelle.
 */
function dessinerCarte(
  ctx: CanvasRenderingContext2D,
  p: CarteDeMortProps,
  illu: HTMLImageElement | null,
) {
  const prof = PROFONDEURS[Math.min(PROFONDEURS.length - 1, p.acte ?? 0)];
  const rnd = seededRandom(`carte|${p.heroName}|${p.day}|${p.bilan.des}`);
  ctx.setTransform(ECHELLE, 0, 0, ECHELLE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = CHARBON;
  ctx.fillRect(0, 0, CW, CH);
  // le speckle du fond : blanc-20 très clairsemé, seedé
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  for (let i = 0; i < 520; i++) ctx.fillRect(Math.floor(rnd() * CW), Math.floor(rnd() * CH), 1, 1);

  /* ─── le portrait : l'illustration du lieu, en bande, dissoute en bas ─── */
  const PX = 18,
    PY = 40,
    PW = CW - 2 * PX,
    PH = 150;
  if (illu) {
    // object-cover : on prend la bande centrale de l'image (elle est carrée)
    const sw = illu.naturalWidth,
      sh = illu.naturalHeight;
    const ratio = PW / PH;
    let cw = sw,
      ch = sw / ratio;
    if (ch > sh) {
      ch = sh;
      cw = sh * ratio;
    }
    const sx = (sw - cw) / 2,
      sy = (sh - ch) / 2;
    ctx.drawImage(illu, sx, sy, cw, ch, PX, PY, PW, PH);
  } else {
    // repli : un ciel tramé (densité croissante vers l'horizon), jamais vide
    for (let y = PY; y < PY + PH; y++) {
      const t = (y - PY) / PH;
      const d = 0.08 + 0.7 * Math.pow(t, 1.3);
      for (let x = PX; x < PX + PW; x++)
        if (BAYER[y & 3][x & 3] / 16 < d) {
          ctx.fillStyle = ORANGE;
          ctx.fillRect(x, y, 1, 1);
        }
    }
  }
  // dissolution du bas de l'image vers le charbon (densité, pas alpha)
  ctx.fillStyle = CHARBON;
  for (let y = PY + PH - 22; y < PY + PH; y++) {
    const t = (y - (PY + PH - 22)) / 22;
    for (let x = PX; x < PX + PW; x++) if (rnd() < t * t * 1.05) ctx.fillRect(x, y, 1, 1);
  }
  // les quatre bords du portrait, rongés
  for (let i = 0; i < 900; i++) {
    const e = Math.floor(rnd() * 4),
      d = Math.pow(rnd(), 2.2) * 6;
    let x: number, y: number;
    if (e === 0) { x = PX + rnd() * PW; y = PY + d; }
    else if (e === 1) { x = PX + rnd() * PW; y = PY + PH - 1 - d; }
    else if (e === 2) { x = PX + d; y = PY + rnd() * PH; }
    else { x = PX + PW - 1 - d; y = PY + rnd() * PH; }
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }

  /* ─── en-tête : le rang au Registre, l'acte ─────────────────────────── */
  ctx.textBaseline = "alphabetic";
  ctx.font = "500 9.5px 'Roboto Mono', monospace";
  ctx.letterSpacing = "1.8px";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  const rangTxt = p.rang ? ordinal(p.rang) : "HORS DES CENT";
  const prefixe = "REGISTRE · ";
  ctx.fillText(prefixe, PX, 27);
  ctx.fillStyle = ORANGE;
  ctx.fillText(rangTxt, PX + ctx.measureText(prefixe).width, 27);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(prof.acte.toUpperCase(), CW - PX, 27);
  ctx.letterSpacing = "0px";

  /* ─── le nom, l'épitaphe ────────────────────────────────────────────── */
  ctx.textAlign = "left";
  ctx.fillStyle = ORANGE;
  let taille = 34;
  ctx.font = `${taille}px 'Instrument Serif', serif`;
  while (ctx.measureText(p.heroName).width > PW && taille > 20) {
    taille -= 1;
    ctx.font = `${taille}px 'Instrument Serif', serif`;
  }
  const NY = PY + PH + 38;
  ctx.fillText(p.heroName, PX, NY);
  ctx.fillStyle = BLANC;
  ctx.font = "10px 'Roboto Mono', monospace";
  const epi = lignes(ctx, p.epitaph, PW, 4);
  epi.forEach((l, i) => ctx.fillText(l, PX, NY + 16 + i * 15));

  /* ─── les chiffres, ferrés en bas ; le pied ─────────────────────────── */
  const FOOT_Y = CH - 16;
  ctx.font = "500 8.5px 'Roboto Mono', monospace";
  ctx.letterSpacing = "1.4px";
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.textAlign = "left";
  ctx.fillText("PACTUM", PX, FOOT_Y);
  ctx.textAlign = "right";
  ctx.fillText(`JOUR ${romain(p.day)}`, CW - PX, FOOT_Y);
  ctx.letterSpacing = "0px";

  const rows: [string, string, boolean][] = [
    ["JOURS TENUS", String(p.bilan.jours), false],
    ["POINT LE PLUS PROFOND", prof.zone || p.bilan.plusLoin, false],
    ["LIEUX TRAVERSÉS", String(p.bilan.lieux), false],
    ["COMBATS TRAVERSÉS", String(p.bilan.rencontres), false],
    ["DÉS LANCÉS", `${p.bilan.des} · ${p.bilan.desTenus} tenus`, false],
    ["DESTINS · MALÉDICTIONS", `${p.bilan.destins} · ${p.bilan.maledictions}`, false],
  ];
  const LH = 15;
  let y = FOOT_Y - 14;
  // la relique forgée, en orange, sous un filet de pixels
  ctx.textAlign = "left";
  ctx.font = "500 9px 'Roboto Mono', monospace";
  ctx.letterSpacing = "1.3px";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("RELIQUE FORGÉE", PX, y);
  ctx.letterSpacing = "0px";
  ctx.textAlign = "right";
  ctx.font = "11.5px 'Roboto Mono', monospace";
  ctx.fillStyle = ORANGE;
  ctx.fillText(p.relic.name, CW - PX, y);
  y -= 11;
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  for (let x = PX; x < CW - PX; x += 3) ctx.fillRect(x, y, 2, 1);
  y -= 9;
  for (let i = rows.length - 1; i >= 0; i--) {
    const [k, v] = rows[i];
    ctx.textAlign = "left";
    ctx.font = "500 9px 'Roboto Mono', monospace";
    ctx.letterSpacing = "1.3px";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(k, PX, y);
    ctx.letterSpacing = "0px";
    ctx.textAlign = "right";
    ctx.font = "11.5px 'Roboto Mono', monospace";
    ctx.fillStyle = BLANC;
    ctx.fillText(v, CW - PX, y);
    y -= LH;
  }

  /* ─── le cadre décalé (signature des CTA), plus épais avec l'acte ────── */
  const e = prof.cadre;
  ctx.fillStyle = ORANGE;
  ctx.fillRect(14, 3, CW - 14, e); // haut : part à droite, dépasse
  ctx.fillRect(CW - 3 - e, 26, e, CH - 26); // droite : commence bas, va au bout
  ctx.fillRect(0, CH - 4 - e, Math.round(CW * 0.66), e + 1); // bas : plus épais, s'arrête avant
  ctx.fillRect(3, 4, e, Math.round(CH * 0.52)); // gauche : s'arrête à mi-hauteur
  if (prof.coins) {
    ctx.fillStyle = BLANC;
    ctx.fillRect(0, 0, 9, 1); ctx.fillRect(0, 0, 1, 9);
    ctx.fillRect(CW - 9, CH - 1, 9, 1); ctx.fillRect(CW - 1, CH - 9, 1, 9);
  }
  // les bords de la CARTE elle-même, rongés (jamais un rectangle propre)
  ctx.fillStyle = "#000";
  for (let i = 0; i < 700; i++) {
    const s = Math.floor(rnd() * 4),
      d = Math.pow(rnd(), 2.4) * 5;
    let x: number, y2: number;
    if (s === 0) { x = rnd() * CW; y2 = d; }
    else if (s === 1) { x = rnd() * CW; y2 = CH - 1 - d; }
    else if (s === 2) { x = d; y2 = rnd() * CH; }
    else { x = CW - 1 - d; y2 = rnd() * CH; }
    ctx.fillRect(Math.floor(x), Math.floor(y2), 1, 1);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * LA BRILLANCE — une bande diagonale qui suit l'inclinaison, en quatre
 * paliers de densité Bayer (pixels de 2 px), blanc sur le palier le plus
 * dense. Dessinée à demi-résolution et agrandie en pixels francs.
 */
function dessinerBrillance(ctx: CanvasRenderingContext2D, rx: number, ry: number, rnd: () => number) {
  const W = CW / 2,
    H = CH / 2;
  ctx.clearRect(0, 0, W, H);
  const amp = Math.min(1, Math.hypot(rx, ry) / MAX);
  if (!isFinite(amp) || amp <= 0.02) return;
  const ang = -0.62,
    ca = Math.cos(ang),
    sa = Math.sin(ang);
  const off = (ry / MAX) * 0.62 + (rx / MAX) * 0.18,
    bandW = 0.24;
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
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
    if (px < 2 || px >= W - 2) continue;
    ctx.fillStyle = BLANC;
    ctx.fillRect(px, py, 1, 1);
  }
}

export default function CarteDeMort(props: CarteDeMortProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const texRef = useRef<HTMLCanvasElement>(null);
  const shineRef = useRef<HTMLCanvasElement>(null);
  const [hint, setHint] = useState("Incline la carte avec ton doigt");
  const [prete, setPrete] = useState(false);
  const plat = animReduced();
  const { heroName, day, epitaph, bilan, relic, rang, image, acte } = props;

  /* ─── le dessin : polices chargées, image chargée, puis UNE passe ─────── */
  useEffect(() => {
    let vivant = true;
    const cv = texRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const p: CarteDeMortProps = { heroName, day, epitaph, bilan, relic, rang, image, acte };
    const fontes = typeof document !== "undefined" && document.fonts
      ? Promise.all([
          document.fonts.load("34px 'Instrument Serif'"),
          document.fonts.load("10px 'Roboto Mono'"),
          document.fonts.load("500 9px 'Roboto Mono'"),
        ]).catch(() => undefined)
      : Promise.resolve(undefined);
    const img = new Promise<HTMLImageElement | null>((res) => {
      if (!image) return res(null);
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = assetSrc(image);
    });
    // Premier dessin tout de suite (police de repli), redessin quand tout
    // est là : on ne laisse jamais un cadre vide sous les yeux.
    dessinerCarte(ctx, p, null);
    Promise.all([fontes, img]).then(([, im]) => {
      if (!vivant) return;
      dessinerCarte(ctx, p, im);
      setPrete(true);
    });
    return () => {
      vivant = false;
    };
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

  /* ─── partager : le canvas tel quel, en fichier ─────────────────────── */
  async function partager() {
    const cv = texRef.current;
    if (!cv) return;
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
          style={{ width: CW, height: CH, transformStyle: "preserve-3d", willChange: "transform", background: CHARBON }}
          data-carte-mort
          data-prete={prete ? "1" : "0"}
        >
          <canvas
            ref={texRef}
            width={CW * ECHELLE}
            height={CH * ECHELLE}
            className="absolute inset-0 h-full w-full"
            style={{ imageRendering: "pixelated" }}
          />
          <canvas
            ref={shineRef}
            width={CW / 2}
            height={CH / 2}
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ imageRendering: "pixelated", mixBlendMode: "screen", opacity: 0 }}
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
