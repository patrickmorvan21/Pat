"use client";

/**
 * LA CARTE DE MORT — l'écran « La mort » est une carte à collectionner.
 *
 * ⚠️ REFONTE DU 02/09, DEUXIÈME PASSE (retour Patrick : « je préfère toujours
 * la V1 en terme de design — reprends la card à l'identique, même l'image très
 * pixellisée donne un style »). Ce fichier est donc un PORT FIDÈLE du prototype
 * `carte_de_mort.html`, et non plus une carte de mon cru :
 *
 *   • UN SEUL CANVAS DE MATIÈRE, en 150×225 pixels LOGIQUES affichés en
 *     300×450 (`image-rendering: pixelated`) — un pixel logique = 2 px écran.
 *     C'est ce gros pixel assumé qui fait le style, l'illustration comprise :
 *     elle est ré-échantillonnée dans cette grille au plus proche voisin, elle
 *     n'est PAS un <img> net posé par-dessus.
 *   • LE TEXTE EST DU DOM, dans le flux flex exact du prototype (padding 14,
 *     bandeau 16, portrait 146, nom 34, épitaphe 10/1.5, chiffres poussés en
 *     bas par `margin-top:auto`, pied). Le dessiner sur le canvas le
 *     crénelait — c'était le vrai défaut de ma première version.
 *
 * LA SEULE CHOSE AJOUTÉE AU PROTOTYPE (demande explicite) : ses quatre segments
 * de cadre décalés sont remplacés par une VRAIE BORDURE ORANGE ÉPAISSE À GROS
 * RADIUS, dessinée en marches de pixels logiques — jamais un `border-radius`
 * lisse, qui trahirait la grille. La carte est donc transparente hors de cette
 * forme : c'est le charbon de l'écran qui fait le fond, et l'arrondi se lit.
 *
 * ⚠️ L'EXPORT PNG (« Partager ») NE DUPLIQUE PLUS AUCUNE GÉOMÉTRIE. Il agrandit
 * le canvas de matière, puis relit les positions, polices et couleurs
 * DIRECTEMENT dans le DOM affiché. Une table de coordonnées parallèle aurait
 * divergé à la première retouche de mise en page ; ici l'écran est la source,
 * le fichier n'en est que la transcription.
 *
 * Conservé du 01/09 : rareté = PROFONDEUR atteinte (le cadre s'épaissit avec
 * l'acte, jamais un tirage), brillance en trame Bayer qui suit l'inclinaison
 * (paliers de 3°, retour en trois crans, `animReduced()` → carte plate), et la
 * carte ne fait JAMAIS avancer l'écran de mort (`stopPropagation`).
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Relic } from "@/lib/player-memory";
import type { Bilan } from "@/components/DeathScreen";
import { assetSrc } from "@/lib/assets";
import { seededRandom } from "@/lib/dither";
import { animReduced, haptic } from "@/lib/settings";

const CHARBON = "#1c1a16";
const ORANGE = "#e0632a";
const BLANC = "#ffffff";

/** La carte à l'écran. */
const CW = 300,
  CH = 450;
/** La grille du prototype : 1 pixel logique = 2 pixels d'écran. */
const LW = 150,
  LH = 225;
/** La bordure : épaisse et à gros radius, en pixels LOGIQUES. */
const EP = 2,
  RAY = 13;
/** La bande d'illustration, en pixels logiques (sous le bandeau d'en-tête). */
const IMG_Y0 = 17,
  IMG_Y1 = 100;

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
  { acte: "Acte I", zone: "Les Landes", cadre: EP, coins: false },
  { acte: "Acte II", zone: "", cadre: EP + 1, coins: false },
  { acte: "Acte III", zone: "", cadre: EP + 2, coins: true },
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

/** LE CONTENU — une seule fabrique. Le DOM la lit ; l'export lit le DOM. */
function contenuCarte(p: CarteDeMortProps) {
  const prof = PROFONDEURS[Math.min(PROFONDEURS.length - 1, p.acte ?? 0)];
  return {
    prof,
    rang: p.rang ? ordinal(p.rang) : "hors des Cent",
    acte: prof.acte,
    nom: p.heroName,
    epitaphe: p.epitaph,
    pied: ["Pactum", `Jour ${romain(p.day)} du Domaine`] as const,
    relique: p.relic.name,
    stats: [
      ["Jours tenus", String(p.bilan.jours)],
      ["Plus loin descendue", prof.zone || p.bilan.plusLoin],
      ["Lieux traversés", String(p.bilan.lieux)],
      ["Combats traversés", String(p.bilan.rencontres)],
      ["Dés lancés", `${p.bilan.des} · ${p.bilan.desTenus} tenus`],
      ["Destins · Malédictions", `${p.bilan.destins} · ${p.bilan.maledictions}`],
    ] as [string, string][],
  };
}

/**
 * LA FORME À COINS ARRONDIS, EN MARCHES DE PIXELS LOGIQUES.
 * Remplie ligne par ligne : le retrait horizontal suit un quart de cercle
 * arrondi à l'entier, ce qui donne l'escalier. La bordure se fait en peignant
 * la forme pleine en orange puis la même forme rentrée de `e` en charbon —
 * l'épaisseur suit l'arrondi sans jamais s'en écarter.
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
  for (let py = 0; py < h; py++) {
    let inset = 0;
    if (py < r) {
      const dy = r - py - 0.5;
      inset = r - Math.sqrt(Math.max(0, r * r - dy * dy));
    } else if (py >= h - r) {
      const dy = py - (h - r) + 0.5;
      inset = r - Math.sqrt(Math.max(0, r * r - dy * dy));
    }
    inset = Math.round(inset);
    ctx.fillRect(x + inset, y + py, w - 2 * inset, 1);
  }
}

/** Le test « ce pixel logique est-il dans la carte ? » — sert au clip du shine. */
function dedansForme(px: number, py: number, r = RAY): boolean {
  let inset = 0;
  if (py < r) {
    const dy = r - py - 0.5;
    inset = r - Math.sqrt(Math.max(0, r * r - dy * dy));
  } else if (py >= LH - r) {
    const dy = py - (LH - r) + 0.5;
    inset = r - Math.sqrt(Math.max(0, r * r - dy * dy));
  }
  inset = Math.round(inset);
  return px >= inset && px < LW - inset;
}

/**
 * LA MATIÈRE — tout ce qui n'est pas du texte, en 150×225 pixels logiques.
 * L'illustration du lieu de la mort est ré-échantillonnée DANS cette grille :
 * c'est elle, la « très pixellisée » que Patrick garde, et c'est aussi ce qui
 * fait qu'elle se dissout en pixels dans le fond au lieu d'avoir un bord net.
 */
function dessinerTexture(
  ctx: CanvasRenderingContext2D,
  p: CarteDeMortProps,
  illu: HTMLImageElement | null,
  rnd: () => number,
) {
  const { prof } = contenuCarte(p);
  const e = prof.cadre;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, LW, LH);

  /* la bordure orange épaisse, puis l'intérieur : l'épaisseur suit l'arrondi */
  formePixel(ctx, 0, 0, LW, LH, RAY, ORANGE);
  formePixel(ctx, e, e, LW - 2 * e, LH - 2 * e, Math.max(1, RAY - e), CHARBON);

  /* le semis du fond : blanc-20 très clairsemé (prototype : 170 points) */
  ctx.fillStyle = "rgba(255,255,255,.2)";
  for (let i = 0; i < 170; i++) {
    const x = Math.floor(rnd() * LW),
      y = Math.floor(rnd() * LH);
    if (dedansForme(x, y) && x > e + 1 && x < LW - e - 2 && y > e + 1 && y < LH - e - 2) ctx.fillRect(x, y, 1, 1);
  }

  /* L'ILLUSTRATION, RÉ-TRAMÉE DANS LA GRILLE DE LA CARTE.
     ⚠️ Surtout PAS un `drawImage` au plus proche voisin : nos assets sont déjà
     tramés en 1000×1000, et prendre un pixel sur sept dans une trame détruit la
     trame — le ciel ressort en aplat plein et le sol en bruit. On réduit donc
     d'abord en MOYENNE (le navigateur filtre), ce qui rend la densité LOCALE,
     puis on re-trame en Bayer sur la grille logique. C'est la recette du fond
     de pierre du 02/09, appliquée à l'exécution. */
  if (illu && illu.naturalWidth) {
    const x0 = e,
      x1 = LW - e;
    const bw = x1 - x0,
      bh = IMG_Y1 - IMG_Y0;
    const off = document.createElement("canvas");
    off.width = bw;
    off.height = bh;
    const octx = off.getContext("2d")!;
    octx.imageSmoothingEnabled = true;
    const sw = illu.naturalWidth,
      sh = illu.naturalHeight;
    const ratio = bw / bh;
    let cw = sw,
      ch = sw / ratio;
    if (ch > sh) {
      ch = sh;
      cw = sh * ratio;
    }
    octx.drawImage(illu, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, bw, bh);
    const d = octx.getImageData(0, 0, bw, bh).data;
    ctx.fillStyle = ORANGE;
    for (let py = 0; py < bh; py++) {
      for (let px = 0; px < bw; px++) {
        const cy = IMG_Y0 + py,
          cx = x0 + px;
        // jamais sous la bordure : l'image s'arrête à la forme intérieure
        if (!dedansForme(cx, cy, RAY)) continue;
        const i = (py * bw + px) * 4;
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        // charbon ≈ 26, orange ≈ 121 en luminance : on en déduit la densité
        const t = Math.max(0, Math.min(1, (lum - 26) / (121 - 26)));
        if (BAYER[cy & 3][cx & 3] / 16 < t) ctx.fillRect(cx, cy, 1, 1);
      }
    }

    /* dissolution pixel du bas de l'image (prototype : densité, jamais un alpha) */
    ctx.fillStyle = CHARBON;
    const d0 = IMG_Y1 - 16;
    for (let py = d0; py < IMG_Y1 + 8; py++) {
      const t = (py - d0) / 24;
      for (let px = x0; px < x1; px++) if (rnd() < t * 0.95 && dedansForme(px, py, RAY)) ctx.fillRect(px, py, 1, 1);
    }
  }

  /* érosion des quatre bords, À L'INTÉRIEUR de la bordure : le grain du
     prototype, sans jamais ronger le trait orange qui définit la forme */
  ctx.fillStyle = "#000";
  for (let i = 0; i < 900; i++) {
    const bord = Math.floor(rnd() * 4),
      d = Math.pow(rnd(), 2.2) * 6;
    let px: number, py: number;
    if (bord === 0) { px = Math.floor(rnd() * LW); py = Math.round(e + d); }
    else if (bord === 1) { px = Math.floor(rnd() * LW); py = Math.round(LH - 1 - e - d); }
    else if (bord === 2) { px = Math.round(e + d); py = Math.floor(rnd() * LH); }
    else { px = Math.round(LW - 1 - e - d); py = Math.floor(rnd() * LH); }
    if (px > e && px < LW - e - 1 && py > e && py < LH - e - 1 && dedansForme(px, py, RAY + 2)) ctx.fillRect(px, py, 1, 1);
  }

  if (prof.coins) {
    /* Acte III : quatre encoches blanches, la marque la plus profonde */
    ctx.fillStyle = BLANC;
    ctx.fillRect(RAY, e, 5, 1);
    ctx.fillRect(e, RAY, 1, 5);
    ctx.fillRect(LW - RAY - 5, LH - e - 1, 5, 1);
    ctx.fillRect(LW - e - 1, LH - RAY - 5, 1, 5);
  }
}

/**
 * LA BRILLANCE — une bande diagonale qui suit l'inclinaison, en quatre paliers
 * de densité Bayer, blanc sur le palier le plus dense (prototype tel quel).
 * Bornée à la forme : en `mix-blend: screen`, elle allumerait sinon les coins
 * hors de la carte.
 */
function dessinerBrillance(ctx: CanvasRenderingContext2D, rx: number, ry: number, rnd: () => number) {
  ctx.clearRect(0, 0, LW, LH);
  const amp = Math.min(1, Math.hypot(rx, ry) / MAX);
  if (!isFinite(amp) || amp <= 0.02) return;
  const ang = -0.62,
    ca = Math.cos(ang),
    sa = Math.sin(ang);
  const off = (ry / MAX) * 0.62 + (rx / MAX) * 0.18,
    bandW = 0.24;
  for (let py = 0; py < LH; py++) {
    for (let px = 0; px < LW; px++) {
      if (!dedansForme(px, py)) continue;
      const u = px / LW - 0.5,
        v = py / LH - 0.5,
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
    const py = Math.floor(rnd() * LH),
      v = py / LH - 0.5;
    const u = (off - v * sa) / ca + (rnd() - 0.5) * 0.16,
      px = Math.floor((u + 0.5) * LW);
    if (!dedansForme(px, py)) continue;
    ctx.fillStyle = BLANC;
    ctx.fillRect(px, py, 1, 1);
  }
}

/** Coupe un texte en lignes qui tiennent dans `max` px (police courante). */
function lignes(ctx: CanvasRenderingContext2D, texte: string, max: number): string[] {
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
  return out;
}

/**
 * L'EXPORT — la matière agrandie, puis le texte RELU DANS LE DOM AFFICHÉ.
 * Chaque feuille de texte de la carte porte `data-txt` ; on lit sa boîte, sa
 * police, sa couleur et son alignement, et on la transcrit. Aucune coordonnée
 * n'est réécrite ici : le fichier ne peut pas s'écarter de l'écran.
 */
function dessinerExportDepuisDom(
  ctx: CanvasRenderingContext2D,
  carte: HTMLElement,
  texture: HTMLCanvasElement,
  ech: number,
) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, CW * ech, CH * ech);
  ctx.drawImage(texture, 0, 0, CW * ech, CH * ech);

  const base = carte.getBoundingClientRect();
  ctx.setTransform(ech, 0, 0, ech, 0, 0);
  ctx.textBaseline = "middle";
  for (const el of Array.from(carte.querySelectorAll<HTMLElement>("[data-txt]"))) {
    const texte = (el.textContent || "").trim();
    if (!texte) continue;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    const fs = parseFloat(s.fontSize) || 10;
    const lh = parseFloat(s.lineHeight) || fs * 1.3;
    ctx.font = `${s.fontStyle} ${s.fontWeight} ${fs}px ${s.fontFamily}`;
    ctx.fillStyle = s.color;
    ctx.letterSpacing = s.letterSpacing === "normal" ? "0px" : s.letterSpacing;
    const droite = s.textAlign === "right";
    ctx.textAlign = droite ? "right" : "left";
    const x = droite ? r.right - base.left : r.left - base.left;
    const y0 = r.top - base.top;
    // une ligne dans la plupart des cas ; l'épitaphe se replie sur sa largeur
    const ls = r.height > lh * 1.4 ? lignes(ctx, texte, r.width) : [texte];
    ls.forEach((l, i) => ctx.fillText(l, x, y0 + lh * (i + 0.5)));
  }
  ctx.letterSpacing = "0px";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Le nom du héros : réduit par points entiers jusqu'à tenir, jamais tronqué. */
function NomAjuste({ nom }: { nom: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [taille, setTaille] = useState(34);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t = 34;
    el.style.fontSize = `${t}px`;
    while (el.scrollWidth > el.clientWidth && t > 18) {
      t -= 1;
      el.style.fontSize = `${t}px`;
    }
    setTaille(t);
  }, [nom]);
  return (
    <div
      ref={ref}
      data-txt
      className="w-full overflow-hidden whitespace-nowrap leading-none text-[var(--color-accent)]"
      style={{ fontFamily: "var(--font-title)", fontSize: taille }}
    >
      {nom}
    </div>
  );
}

export default function CarteDeMort(props: CarteDeMortProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const texRef = useRef<HTMLCanvasElement>(null);
  const shineRef = useRef<HTMLCanvasElement>(null);
  const [hint, setHint] = useState("Incline la carte avec ton doigt");
  const [prete, setPrete] = useState(false);
  const plat = animReduced();
  const { heroName, day, epitaph, bilan, relic, rang, image, acte } = props;
  const c = contenuCarte(props);

  /* ─── la matière : redessinée quand l'illustration est chargée ───────── */
  useEffect(() => {
    const cv = texRef.current;
    if (!cv) return;
    let vivant = true;
    const p: CarteDeMortProps = { heroName, day, epitaph, bilan, relic, rang, image, acte };
    const peindre = (im: HTMLImageElement | null) => {
      if (!vivant) return;
      const ctx = cv.getContext("2d")!;
      dessinerTexture(ctx, p, im, seededRandom(`carte|${heroName}|${day}`));
      setPrete(true);
    };
    if (!image) {
      peindre(null);
      return;
    }
    const im = new Image();
    im.onload = () => peindre(im);
    im.onerror = () => peindre(null);
    im.src = assetSrc(image);
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

  /* ─── partager : la carte transcrite en fichier ──────────────────────── */
  async function partager() {
    const carte = cardRef.current,
      tex = texRef.current;
    if (!carte || !tex) return;
    const ech = 2;
    const cv = document.createElement("canvas");
    cv.width = CW * ech;
    cv.height = CH * ech;
    dessinerExportDepuisDom(cv.getContext("2d")!, carte, tex, ech);
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

  /* Les classes du prototype, à l'identique. `.k` et `.v` gardent leurs
     tailles : c'est ce rapport 9/11,5 qui fait lire les chiffres. */
  const kCls = "font-mono text-[9px] tracking-[1.3px] text-[var(--color-ink)] opacity-50";
  const vCls = "font-mono text-[11.5px] text-[var(--color-ink)]";

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
          {/* LA MATIÈRE : forme, bordure, semis, illustration, dissolution */}
          <canvas
            ref={texRef}
            width={LW}
            height={LH}
            className="absolute inset-0 h-full w-full"
            style={{ imageRendering: "pixelated", zIndex: 1 }}
            aria-hidden
          />

          {/* LE CONTENU : le flux flex du prototype, texte en DOM donc net */}
          <div className="absolute inset-0 flex flex-col p-[14px]" style={{ zIndex: 2 }}>
            <div className="flex h-[16px] items-start justify-between">
              <span
                data-txt
                className="font-mono text-[9.5px] font-medium uppercase tracking-[1.8px]"
                style={{ color: "rgba(255,255,255,.5)" }}
              >
                Registre · <b className="font-medium text-[var(--color-accent)]">{c.rang}</b>
              </span>
              <span
                data-txt
                className="text-right font-mono text-[9.5px] font-medium uppercase tracking-[1.8px]"
                style={{ color: "rgba(255,255,255,.5)" }}
              >
                {c.acte}
              </span>
            </div>

            {/* la place de l'illustration : elle est peinte SOUS, dans la trame */}
            <div className="h-[146px] shrink-0 grow-0 basis-[146px]" aria-hidden />

            <NomAjuste nom={c.nom} />
            <div
              data-txt
              className="mt-[7px] font-mono text-[10px] leading-[1.5] text-[var(--color-ink)]"
            >
              {c.epitaphe}
            </div>

            <div className="mt-auto">
              {c.stats.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between py-[1.5px]">
                  <span data-txt className={kCls}>{k}</span>
                  <span data-txt className={`${vCls} text-right`}>{v}</span>
                </div>
              ))}
              <div
                className="my-[6px] mb-[4px] h-px"
                style={{ background: "rgba(255,255,255,.2)" }}
                aria-hidden
              />
              <div className="flex items-baseline justify-between py-[1.5px]">
                <span data-txt className={kCls}>Relique forgée</span>
                <span data-txt className="text-right font-mono text-[11.5px] text-[var(--color-accent)]">
                  {c.relique}
                </span>
              </div>
            </div>

            <div className="mt-[9px] flex justify-between font-mono text-[8.5px] uppercase tracking-[1.4px]">
              <span data-txt style={{ color: "rgba(255,255,255,.2)" }}>{c.pied[0]}</span>
              <span data-txt className="text-right" style={{ color: "rgba(255,255,255,.2)" }}>
                {c.pied[1]}
              </span>
            </div>
          </div>

          {/* LA BRILLANCE, par-dessus tout */}
          <canvas
            ref={shineRef}
            width={LW}
            height={LH}
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ imageRendering: "pixelated", mixBlendMode: "screen", opacity: 0, zIndex: 3 }}
            aria-hidden
          />
        </div>
      </div>

      <p className="mt-[12px] min-h-[1.3em] px-[20px] text-center font-mono text-[12px] text-[var(--color-ink)] opacity-50">
        {hint}
      </p>

      <button
        type="button"
        className="relative mt-[8px] h-[34px] w-[298px] bg-[var(--color-accent)] font-mono text-[12px] font-medium uppercase tracking-[2.4px] text-[var(--color-bg)]"
        data-partager
        onClick={(e) => {
          e.stopPropagation();
          void partager();
        }}
      >
        {/* entailles de coin : la grammaire des CTA, jamais un arrondi CSS */}
        <span className="absolute left-0 top-0 h-[6px] w-[2px] bg-[var(--color-bg)]" aria-hidden />
        <span className="absolute right-0 top-0 h-[2px] w-[6px] bg-[var(--color-bg)]" aria-hidden />
        <span className="absolute bottom-0 right-0 h-[6px] w-[2px] bg-[var(--color-bg)]" aria-hidden />
        <span className="absolute bottom-0 left-0 h-[2px] w-[6px] bg-[var(--color-bg)]" aria-hidden />
        Partager
      </button>
    </div>
  );
}
