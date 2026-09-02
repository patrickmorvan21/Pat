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
 *     C'est ce gros pixel assumé qui fait le style, LA SCÈNE COMPRISE : le ciel,
 *     la colline et les deux potences sont DESSINÉS dans cette grille, comme
 *     dans le prototype — pas une photo posée par-dessus.
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
/** La bordure : UN pixel logique (retour Patrick 02/09), gros radius. */
const EP = 1,
  RAY = 9;
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
  /** Index d'acte (0 = Acte I). */
  acte?: number;
};

function ordinal(n: number): string {
  return n === 1 ? "1ʳᵉ" : `${n}ᵉ`;
}

/** LE CONTENU — une seule fabrique. Le DOM la lit ; l'export lit le DOM. */
function contenuCarte(p: CarteDeMortProps) {
  const prof = PROFONDEURS[Math.min(PROFONDEURS.length - 1, p.acte ?? 0)];
  return {
    prof,
    acte: prof.acte,
    nom: p.heroName,
    epitaphe: p.epitaph,
    relique: p.relic.name,
    stats: [
      ["Jours tenus", String(p.bilan.jours)],
      // Le Registre est une ligne de chiffres comme les autres (retour Patrick
      // 02/09) — même label, même valeur blanche : c'est un résultat, pas un
      // en-tête. Sa place, juste après les jours, est celle qui a du sens :
      // c'est le nombre de jours qui décide du rang.
      ["Registre", p.rang ? ordinal(p.rang) : "Hors des Cent"],
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

/**
 * « Ce pixel logique est-il dans la carte ? » — avec une MARGE optionnelle qui
 * donne la forme INTÉRIEURE (sous la bordure).
 * ⚠️ Tout ce qui peint du charbon (colline, dissolution, érosion) doit passer
 * par la forme intérieure : sinon il efface le trait orange. Le défaut ne se
 * voyait pas tant que la bordure faisait 2 px ; à 1 px elle partait en pointillé.
 */
function dedansForme(px: number, py: number, r = RAY, marge = 0): boolean {
  const w = LW - 2 * marge,
    h = LH - 2 * marge;
  const x = px - marge,
    y = py - marge;
  if (y < 0 || y >= h || x < 0) return false;
  let inset = 0;
  if (y < r) {
    const dy = r - y - 0.5;
    inset = r - Math.sqrt(Math.max(0, r * r - dy * dy));
  } else if (y >= h - r) {
    const dy = y - (h - r) + 0.5;
    inset = r - Math.sqrt(Math.max(0, r * r - dy * dy));
  }
  inset = Math.round(inset);
  return x >= inset && x < w - inset;
}

/**
 * LA MATIÈRE — tout ce qui n'est pas du texte, en 150×225 pixels logiques :
 * la forme et sa bordure, le semis, puis LA SCÈNE dessinée à la main (ciel en
 * densité, colline, deux potences), qui se dissout en pixels dans le fond au
 * lieu d'avoir un bord net.
 */
function dessinerTexture(ctx: CanvasRenderingContext2D, p: CarteDeMortProps, rnd: () => number) {
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
    if (dedansForme(x, y, Math.max(1, RAY - e), e)) ctx.fillRect(x, y, 1, 1);
  }

  const rInt = Math.max(1, RAY - e);
  /* LE GRAIN DES BORDS — posé AVANT la scène (retour Patrick 02/09 : « je
     veux que l'illu en haut soit par-dessus les bords noirs »). Il reste donc
     visible partout où il n'y a pas d'image, et l'illustration le recouvre. — accentué le 02/09 (« il y a un dégradé noir sur les
     bords, j'adore, accentue-le »). Il ne se voit vraiment que sur l'orange du
     ciel : c'est du noir semé PAR DENSITÉ décroissante vers le centre, jamais
     une ombre ni un dégradé. La puissance 2,6 garde la masse collée au bord ;
     c'est elle qui fait la vignette, pas le nombre de points.
     ⚠️ Deux garde-fous : elle démarre à `e + 1` (collée au trait, elle le
     ferait lire en pointillé — la bordure ne fait qu'un pixel), et sa
     PROFONDEUR est bornée à 14 px logiques. À 22 elle mangeait les potences,
     c'est-à-dire le sujet même de l'image : une vignette qui efface la scène
     n'est plus une vignette. */
  ctx.fillStyle = "#000";
  for (let i = 0; i < 2600; i++) {
    const bord = Math.floor(rnd() * 4),
      d = 1 + Math.pow(rnd(), 2.6) * 14;
    let px: number, py: number;
    if (bord === 0) { px = Math.floor(rnd() * LW); py = Math.round(e + d); }
    else if (bord === 1) { px = Math.floor(rnd() * LW); py = Math.round(LH - 1 - e - d); }
    else if (bord === 2) { px = Math.round(e + d); py = Math.floor(rnd() * LH); }
    else { px = Math.round(LW - 1 - e - d); py = Math.floor(rnd() * LH); }
    if (dedansForme(px, py, rInt, e)) ctx.fillRect(px, py, 1, 1);
  }


  /* LA SCÈNE, DESSINÉE À LA MAIN DANS LA GRILLE — le portage verbatim du
     prototype (retour Patrick 02/09 : « reprends la même image qu'il y a dans
     le html, la trame est plus jolie »).
     ⚠️ Elle ne dépend PAS du lieu de la mort : la carte ne montre plus où l'on
     est tombé, elle montre la Colline aux Gibets, signature de la zone. C'est
     un choix de design assumé — une photo du lieu, ré-échantillonnée dans une
     grille de 150×225, perd sa trame et ressort en bruit ; un dessin fait POUR
     cette grille garde son ciel en dégradé de densité et ses silhouettes nettes.
     Le seul aléa passe par `rnd()` (seedé par le héros et le jour) : la carte
     d'une mort donnée est toujours la même, elle ne scintille pas au re-rendu. */
  const px1 = (x: number, y: number, col: string) => {
    if (!dedansForme(x, y, rInt, e)) return;
    ctx.fillStyle = col;
    ctx.fillRect(x | 0, y | 0, 1, 1);
  };
  /* FERRÉE EN HAUT (retour Patrick 02/09) : la scène démarre juste sous la
     bordure — plus de bandeau au-dessus d'elle, le regard entre dans l'image
     avant de lire quoi que ce soit. Le bandeau Registre/Acte est descendu en
     pied de carte, avec les autres chiffres. */
  const y0 = e + 1,
    y1 = 88;
  /* le ciel : orange dense près de l'horizon, clairsemé en haut — DENSITÉ, jamais un dégradé */
  for (let py = y0; py < y1; py++) {
    const t = (py - y0) / (y1 - y0),
      pr = 0.3 + 0.68 * Math.pow(t, 1.25);
    for (let px = 0; px < LW; px++) if (BAYER[py & 3][px & 3] / 16 < pr) px1(px, py, ORANGE);
  }
  const crest = (px: number) =>
    y1 - 14 - Math.round(26 * Math.exp(-Math.pow((px - 84) / 42, 2)) + 9 * Math.exp(-Math.pow((px - 26) / 22, 2)));
  /* la colline : silhouette charbon, bord rongé */
  for (let px = 0; px < LW; px++) {
    const hy = crest(px);
    for (let py = hy; py < y1 + 3; py++) {
      if (py - hy < 3 && rnd() < 0.3) continue;
      px1(px, py, CHARBON);
    }
    if (rnd() < 0.16) px1(px, hy - 1 - Math.floor(rnd() * 2), CHARBON);
  }
  /* deux potences : une occupée (le Bailli), une vide et démesurée */
  const gibet = (bx: number, by: number, h: number, arm: number, occupied: boolean) => {
    const top = by - h;
    for (let py = top; py < by; py++) {
      px1(bx, py, CHARBON);
      if (rnd() < 0.85) px1(bx + 1, py, CHARBON);
    }
    for (let px = bx; px < bx + arm; px++) {
      px1(px, top, CHARBON);
      if (rnd() < 0.85) px1(px, top + 1, CHARBON);
    }
    /* la contrefiche : le triangle de renfort, c'est lui qui fait LIRE une potence */
    for (let k = 0; k < 6; k++) px1(bx + 1 + k, top + 1 + k, CHARBON);
    const cx = bx + arm - 2,
      rope = occupied ? 5 : 8;
    for (let py = top + 2; py < top + 2 + rope; py++) px1(cx, py, CHARBON);
    if (occupied) {
      for (let py = top + 2 + rope; py < top + 2 + rope + 7; py++)
        for (let dx = -1; dx <= 1; dx++) if (rnd() < 0.9) px1(cx + dx, py, CHARBON);
      for (let dx = -2; dx <= 2; dx++) if (rnd() < 0.7) px1(cx + dx, top + 2 + rope + 7, CHARBON);
    }
  };
  gibet(58, crest(58) + 2, 30, 11, true);
  gibet(84, crest(84) + 2, 44, 15, false);
  for (const px of [26, 32, 38]) {
    px1(px, crest(px) - 4, CHARBON);
    px1(px + 1, crest(px) - 4, CHARBON);
  }
  /* dissolution pixel du bas de l'image */
  for (let py = y1 - 16; py < y1 + 8; py++) {
    const t = (py - (y1 - 16)) / 24;
    for (let px = 0; px < LW; px++) if (rnd() < t * 0.95) px1(px, py, CHARBON);
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
  const { heroName, day, epitaph, bilan, relic, rang, acte } = props;
  const c = contenuCarte(props);

  /* ─── la matière : une passe, dès le montage ─────────────────────────── */
  useEffect(() => {
    const cv = texRef.current;
    if (!cv) return;
    const p: CarteDeMortProps = { heroName, day, epitaph, bilan, relic, rang, acte };
    dessinerTexture(cv.getContext("2d")!, p, seededRandom(`carte|${heroName}|${day}`));
    setPrete(true);
  }, [heroName, day, epitaph, bilan, relic, rang, acte]);

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

          {/* LE CONTENU : le flux flex du prototype, texte en DOM donc net.
              ⚠️ `pt-0` : l'image est FERRÉE en haut de la carte, donc rien ne
              la précède. Le bandeau Registre/Acte est descendu en pied, avec
              les autres chiffres — c'est ce qui rend l'entrée immersive. */}
          <div className="absolute inset-0 flex flex-col px-[14px] pb-[14px] pt-0" style={{ zIndex: 2 }}>
            {/* la place de la scène : elle est peinte SOUS, dans la trame.
                176 px d'écran = 88 px logiques = le bas de la dissolution. */}
            <div className="h-[176px] shrink-0 grow-0 basis-[176px]" aria-hidden />

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

            {/* le pied : la marque d'édition, rien d'autre. Le rang est passé
                dans les chiffres ; l'acte se lit aussi à l'épaisseur du cadre. */}
            <div
              data-txt
              className="mt-[9px] font-mono text-[8.5px] font-medium uppercase tracking-[1.4px]"
              style={{ color: "rgba(255,255,255,.2)" }}
            >
              {c.acte}
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

      <p className="mt-[12px] min-h-[1.3em] shrink-0 px-[20px] text-center font-mono text-[12px] text-[var(--color-ink)] opacity-50">
        {hint}
      </p>

      {/* LE CTA — même grammaire que les boutons d'accueil (HomeCta), au pixel :
          46 px de haut, 14 px espacés de 2,8, fond ET bordure orange posés en
          calques inset-0, entailles de coin 2×2 charbon au ras du coin.
          ⚠️ `shrink-0` obligatoire : c'est un item flex d'un conteneur à hauteur
          imposée (CarteReduite), et sans lui il se comprime à 43 px — le bouton
          ne fait alors plus la même taille que celui de l'accueil.
          ⚠️ Jamais une bordure CSS sur le bouton lui-même : les entailles se
          positionnent alors dans la boîte de padding et se décalent d'un pixel
          (piège récurrent, cf. ChoiceButton). Aucun état hover/actif. */}
      <button
        type="button"
        className="group relative mt-[10px] h-[46px] w-[300px] shrink-0 cursor-pointer border-none bg-transparent font-mono text-[14px] font-medium uppercase tracking-[2.8px] text-[var(--color-bg)]"
        data-partager
        onClick={(e) => {
          e.stopPropagation();
          void partager();
        }}
      >
        <span
          className="absolute inset-0 border border-solid border-[var(--color-accent)] bg-[var(--color-accent)]"
          aria-hidden
        />
        <span className="pointer-events-none absolute left-0 top-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
        <span className="pointer-events-none absolute bottom-0 left-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
        <span className="pointer-events-none absolute right-0 top-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
        <span className="pointer-events-none absolute bottom-0 right-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
        <span className="relative">Partager</span>
      </button>
    </div>
  );
}
