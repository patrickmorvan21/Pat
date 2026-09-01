"use client";

import { useEffect, useRef, useState } from "react";
import { bayerFill, CHARBON, CREME, ORANGE, seededRandom } from "@/lib/dither";
import { assetSrc } from "@/lib/assets";

/**
 * Crochetage (référence #4, « meilleur du lot ») : fenêtre de réussite qui
 * s'élargit avec la stat, tap au bon moment. Rendu toujours tramé/bruité,
 * jamais un rectangle plein et net. Trois modes réutilisent ce moteur :
 * - "track" : PISTE HORIZONTALE, curseur qui fait l'aller-retour, on tape
 *   quand il passe dans la gorge orange (Crochetage).
 *
 * ⚠️ LA PISTE EST REVENUE (29/08). La passe « réalisme » du 11/07 avait
 * remplacé la piste par un ÉVENTAIL (crochet pivotant dans un trou de serrure,
 * goupilles en rayons). Arbitrage de Patrick : il préférait la piste — elle se
 * lit d'un coup d'œil, l'éventail demandait de suivre une pointe sur un arc.
 * Ne pas « re-réaliser » ce mini-jeu sans arbitrage : ici la lisibilité prime.
 *
 * ⚠️ Et une serrure a PLUSIEURS goupilles (`config.goupilles`, 29/08) : il
 * faut réussir N taps, pas un seul. C'est ce qui sépare un test de réflexe
 * d'un crochetage — chaque goupille tombe, la gorge se déplace, le curseur
 * accélère d'un cran, et les ratés se comptent sur l'ensemble.
 * - "release" : maintenir puis relâcher au frémissement (Piège à mâchoire).
 * - "point" : taper la bonne zone sur un sceau fissuré (Sceau de cire).
 *
 * ⚠️ LE 01/09 — « trop pixellisé, trop beta » (Patrick). La cause n'était PAS
 * le style : le canvas faisait 300×160 et `.minigame-canvas` l'étire à 100 %
 * de la largeur du conteneur, soit ~840 px dans la galerie — un facteur 2,8,
 * donc chaque pixel devenait un bloc. Le mode "track" passe à la résolution
 * NATIVE de la zone de jeu (360×499, le format établi par le Frottage), ce qui
 * rend le trait fin sans changer une seule règle de DA. Les deux autres modes
 * gardent 300×160 tant qu'on ne les a pas repensés.
 */
const W = 300,
  H = 160;
/* Zone de jeu pleine, comme RubReveal en peau image. C'est cette résolution
   qui donne au mécanisme la place d'être DÉTAILLÉ. */
const TW = 360,
  TH = 499;
/** La porte : le crochetage se joue toujours sur la même, le moteur résout
    donc son chemin lui-même. Deux appelants (le jeu, la galerie) qui le
    passeraient chacun pourraient diverger. */
const FOND_PORTE = "assets/minijeu_serrure_fond.png";

export default function TimingTap({
  seed,
  config,
  onResult,
}: {
  seed: string;
  config: {
    mode: "track" | "release" | "point";
    windowWidth: number; // 0..1 fraction de la piste, ou tolérance angulaire pour "point"
    speed?: number;
    maxAttempts?: number;
    goupilles?: number; // "track" : nombre de taps réussis pour ouvrir (défaut 1)
  };
  onResult: (success: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const track = config.mode === "track";
  const [fond, setFond] = useState<HTMLImageElement | null>(null);

  // La porte est chargée une fois ; tant qu'elle n'est pas là on dessine le
  // mécanisme sur le charbon nu — jamais d'écran vide.
  useEffect(() => {
    if (!track) return;
    const img = new Image();
    img.onload = () => setFond(img);
    img.src = assetSrc(FOND_PORTE);
  }, [track]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rnd = seededRandom(seed);
    const w = track ? TW : W,
      h = track ? TH : H;
    let raf = 0;
    let t = 0;
    let finished = false;
    let attemptsLeft = config.maxAttempts ?? 1;
    let windowCenter = 0.5 + (rnd() - 0.5) * 0.3;
    const speed = config.speed ?? 0.9;
    /* Les goupilles : chacune a SA gorge et fait accélérer le curseur d'un
       cran. La dernière est la plus tendue — c'est le rythme d'une serrure,
       jamais une difficulté cachée (le nombre restant se VOIT sur la piste). */
    const goupilles = Math.max(1, config.goupilles ?? 1);
    let tombees = 0;
    let vitesse = speed;
    let eclat = 0; // frames de flash blanc quand une goupille cède
    let secousse = 0; // frames de tressaillement de la platine quand on rate
    let holding = false;
    let releaseArmed = false;
    const snapAt = 0.82 + rnd() * 0.1;
    /* Les éraflures s'ACCUMULENT sur la platine à chaque raté : le métal garde
       la trace du crochet qui a ripé. Le joueur voit ce qu'il a dépensé sans
       qu'aucun compteur ne soit affiché. */
    const eraflures: { x: number; y: number; dx: number; dy: number }[] = [];
    /* LE MÉCANISME SE CASSE (retour Patrick 01/09 : « si jamais on se rate,
       il faut qu'on voie le mécanisme se casser »). Chaque raté arrache un
       bout du crochet — un fragment qui tombe dans le barillet et y reste —
       et fend le fer d'une fissure qui ne se referme pas. Au troisième, la
       tige elle-même casse en deux. Rien n'est un compteur : c'est le
       crochet qu'on voit raccourcir.
       Et LES ÉTAPES se lisent EN BAS, en carrés pleins — la grammaire des
       points de l'intro et des cinq carrés du Seuil, jamais une barre, jamais
       un chiffre. Le flash blanc plein-écran de la goupille qui cède est
       retiré : c'est le carré qui s'allume. */
    const fragments: { x: number; y: number; vx: number; vy: number; w: number }[] = [];
    const fissures: { x: number; y: number }[][] = [];
    let becCasse = 0; // 0 = bec entier · 1 = ébréché · 2+ = plus de bec
    let tigeCassee = false;
    /* La fin est DIFFÉRÉE de quelques frames pour qu'on voie le dernier carré
       s'allumer, ou le crochet se casser, avant que l'écran ne change. */
    let finAt: { ok: boolean; frames: number } | null = null;

    // Géométrie de la platine (mode "track" seulement).
    const PW = 286,
      PH = 214;
    const PX = Math.round((TW - PW) / 2),
      PY = 152;
    const trackY = PY + 128;
    const x0 = PX + 26,
      x1 = PX + PW - 26;

    function finish(success: boolean) {
      if (finished) return;
      finished = true;
      onResult(success);
    }

    function trackPos() {
      // va-et-vient 0..1
      const cycle = (t * vitesse) % 2;
      return cycle <= 1 ? cycle : 2 - cycle;
    }

    function onDown(e: PointerEvent) {
      if (finished || finAt) return;
      if (config.mode === "track") {
        const p = trackPos();
        const ex = x0 + p * (x1 - x0);
        if (Math.abs(p - windowCenter) < config.windowWidth / 2) {
          tombees += 1;
          eclat = 6;
          if (tombees >= goupilles) finAt = { ok: true, frames: 22 };
          else {
            windowCenter = 0.5 + (rnd() - 0.5) * 0.44;
            vitesse *= 1.12;
          }
        } else {
          attemptsLeft--;
          secousse = 7;
          eraflures.push({
            x: ex,
            y: trackY - 6 + (rnd() - 0.5) * 10,
            dx: (rnd() - 0.5) * 26,
            dy: (rnd() - 0.5) * 8,
          });
          // le bec du crochet s'arrache et tombe dans le barillet
          becCasse += 1;
          const sens = ((t * vitesse) % 2) <= 1 ? 1 : -1;
          fragments.push({ x: ex + 2, y: trackY - 22, vx: sens * 1.4 + (rnd() - 0.5), vy: -1.8, w: 3 });
          // et le fer se fend sous la piste, jusqu'au bas de la platine
          const fis: { x: number; y: number }[] = [];
          let fx = ex;
          for (let fy = trackY + 24; fy < PY + PH - 6; fy += 5) {
            fx += (rnd() - 0.5) * 7;
            fis.push({ x: Math.round(fx), y: fy });
          }
          fissures.push(fis);
          if (attemptsLeft <= 0) {
            // LA TIGE CASSE : le haut du crochet part en morceaux, et on
            // laisse le temps de le voir avant que le pêne claque.
            tigeCassee = true;
            for (let i = 0; i < 4; i++) {
              fragments.push({
                x: ex - 6 + i * 4,
                y: trackY - 10 - i * 5,
                vx: (rnd() - 0.5) * 3,
                vy: -2.4 + rnd() * 1.2,
                w: i % 2 ? 2 : 3,
              });
            }
            finAt = { ok: false, frames: 55 };
          }
        }
      } else if (config.mode === "release") {
        holding = true;
        t = 0;
      } else if (config.mode === "point") {
        const r = canvas!.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const angle = (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2);
        const target = windowCenter * Math.PI * 2;
        let diff = Math.abs(angle - target);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff < (config.windowWidth * Math.PI) / 2) finish(true);
        else {
          attemptsLeft--;
          if (attemptsLeft <= 0) finish(false);
        }
      }
    }
    function onUp() {
      if (config.mode !== "release" || !holding || finished) return;
      holding = false;
      const progress = t / 1.4;
      finish(progress >= snapAt - config.windowWidth && progress <= snapAt + 0.02);
    }
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    /** La porte, dissoute en PIXELS vers le haut et vers le bas (demande du
        01/09). On repeint du charbon par probabilité croissante en approchant
        du bord — une densité qui décroît, jamais une opacité qui baisse
        (règle DA : zéro dégradé). Le semis est seedé sur la position, donc il
        ne scintille pas d'une frame à l'autre. */
    function porte() {
      if (fond) ctx.drawImage(fond, 0, 0, TW, TH);
      const BANDE = 96;
      ctx.fillStyle = CHARBON;
      for (let y = 0; y < TH; y++) {
        let k: number;
        if (y < BANDE) k = 1 - y / BANDE;
        else if (y > TH - BANDE) k = 1 - (TH - y) / BANDE;
        else continue;
        const p = k * k * 1.05; // dense au ras du bord, clairsemé au milieu
        for (let x = 0; x < TW; x += 1) {
          const n = ((x * 2654435761 + y * 40503) >>> 0) / 4294967296;
          if (n < p) ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    /** La platine de fer clouée sur le bois : fond charbon dense, grain de
        métal en blanc très faible, bord RONGÉ (jamais un rectangle net), et
        quatre clous. Elle tressaille quand le crochet ripe. */
    function platine(ox: number, oy: number) {
      ctx.fillStyle = CHARBON;
      ctx.fillRect(PX + ox, PY + oy, PW, PH);
      // grain du métal : un semis dense qui donne sa matière au fer, sinon la
      // platine lit comme un trou noir découpé dans le bois.
      for (let i = 0; i < 2600; i++) {
        const gx = PX + ox + Math.floor(rndFixe(i * 3) * PW);
        const gy = PY + oy + Math.floor(rndFixe(i * 3 + 1) * PH);
        const v = rndFixe(i * 3 + 2);
        ctx.fillStyle = v > 0.88 ? "rgba(255,255,255,0.3)" : v > 0.6 ? "rgba(255,255,255,0.17)" : "rgba(255,255,255,0.09)";
        ctx.fillRect(gx, gy, 1, 1);
      }
      // martelage : de longues stries horizontales, le fer a été battu
      for (let i = 0; i < 26; i++) {
        const sy = PY + oy + 6 + Math.floor(rndFixe(i * 11 + 3) * (PH - 12));
        const sx = PX + ox + Math.floor(rndFixe(i * 11 + 4) * (PW - 60));
        const len = 24 + Math.floor(rndFixe(i * 11 + 5) * 40);
        ctx.fillStyle = "rgba(255,255,255,0.11)";
        for (let x = 0; x < len; x++) if (rndFixe(i * 97 + x) > 0.35) ctx.fillRect(sx + x, sy, 1, 1);
      }
      // bord rongé : une file de pixels irrégulière plutôt qu'un trait
      ctx.fillStyle = "rgba(255,255,255,0.34)";
      for (let x = 0; x < PW; x += 1) {
        const j = Math.floor(rndFixe(x * 7 + 11) * 2);
        if (rndFixe(x * 7 + 12) > 0.14) ctx.fillRect(PX + ox + x, PY + oy + j, 1, 1);
        if (rndFixe(x * 7 + 13) > 0.14) ctx.fillRect(PX + ox + x, PY + oy + PH - 1 - j, 1, 1);
      }
      for (let y = 0; y < PH; y += 1) {
        const j = Math.floor(rndFixe(y * 7 + 21) * 2);
        if (rndFixe(y * 7 + 22) > 0.14) ctx.fillRect(PX + ox + j, PY + oy + y, 1, 1);
        if (rndFixe(y * 7 + 23) > 0.14) ctx.fillRect(PX + ox + PW - 1 - j, PY + oy + y, 1, 1);
      }
      // les clous
      for (const [cx, cy] of [
        [12, 12],
        [PW - 12, 12],
        [12, PH - 12],
        [PW - 12, PH - 12],
      ]) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillRect(PX + ox + cx - 2, PY + oy + cy - 2, 4, 4);
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(PX + ox + cx - 3, PY + oy + cy + 2, 5, 1);
      }
    }

    /** Bruit STABLE indexé (jamais Math.random dans une boucle de rendu :
        le grain scintillerait à chaque frame). */
    function rndFixe(i: number) {
      const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    }

    function dessineTrack() {
      porte();
      const ox = secousse > 0 ? (secousse % 2 === 0 ? 1 : -1) : 0;
      const oy = secousse > 0 ? (secousse % 3 === 0 ? 1 : 0) : 0;
      if (secousse > 0) secousse -= 1;
      platine(ox, oy);

      const ty = trackY + oy;

      /* LE BARILLET : la bande qu'on fait tourner, dans laquelle court la
         piste. Sans lui la platine est un grand vide et la piste flotte au
         milieu de rien — c'est ce qui donnait au rendu son air de maquette. */
      const bt = ty - 18,
        bh = 40;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(PX + ox + 14, bt, PW - 28, bh);
      // ses deux joues, en pixels
      ctx.fillStyle = "rgba(255,255,255,0.38)";
      for (let x = 0; x < PW - 28; x++) {
        if (rndFixe(x * 5 + 31) > 0.2) ctx.fillRect(PX + ox + 14 + x, bt, 1, 1);
        if (rndFixe(x * 5 + 32) > 0.2) ctx.fillRect(PX + ox + 14 + x, bt + bh - 1, 1, 1);
      }
      // les dents de came sur la joue haute : elles disent que ça TOURNE
      for (let x = 0; x < PW - 28; x += 7) {
        const dx = PX + ox + 14 + x + Math.round(((t * vitesse * 40) % 7) - 7);
        if (dx > PX + 14 && dx < PX + PW - 16) {
          ctx.fillStyle = "rgba(255,255,255,0.2)";
          ctx.fillRect(dx, bt + 2, 1, 3);
        }
      }

      /* LES GOUPILLES, au-dessus de la piste. Chacune est une tige dans son
         logement : celle qui reste PEND et tremble d'autant plus que le
         barillet tourne vite ; celle qui a cédé est remontée et calée. */
      const pas = Math.min(46, (x1 - x0) / (goupilles + 1));
      const bx = (x0 + x1) / 2 - ((goupilles - 1) * pas) / 2;
      for (let k = 0; k < goupilles; k++) {
        const gx = Math.round(bx + k * pas) + ox;
        const haut = PY + oy + 26;
        const basLog = bt + 4; // le logement plonge JUSQUE dans le barillet
        // le logement, foré dans le fer
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        ctx.fillRect(gx - 4, haut, 8, basLog - haut);
        ctx.fillStyle = "rgba(255,255,255,0.26)";
        for (let y = haut; y < basLog; y += 2) {
          ctx.fillRect(gx - 5, y, 1, 1);
          ctx.fillRect(gx + 4, y, 1, 1);
        }
        const cede = k < tombees;
        /* La goupille qui reste TRAVERSE la ligne de césure : c'est
           littéralement elle qui empêche le barillet de tourner. Celle qui a
           cédé est remontée au-dessus de la ligne, et le passage est libre. */
        const trem = cede ? 0 : Math.round(Math.sin(t * vitesse * 9 + k * 2) * 1.4);
        const basTige = cede ? bt - 3 : ty + 5 + trem;
        const yTige = cede ? haut + 4 : haut + 20 + trem;
        bayerFill(
          ctx,
          gx - 3,
          yTige,
          6,
          Math.max(8, basTige - yTige),
          cede ? 1 : 0.82,
          cede ? CREME : "rgba(255,255,255,0.62)",
          null,
          1
        );
        // la tête de la goupille, marquée
        ctx.fillStyle = cede ? CREME : "rgba(255,255,255,0.7)";
        ctx.fillRect(gx - 5, yTige - 2, 10, 2);
        if (cede) {
          // le cran qui la retient en haut : la seule marque orange hors gorge
          ctx.fillStyle = ORANGE;
          ctx.fillRect(gx - 6, haut + 2, 12, 1);
        } else {
          // le bout qui coince, en travers de la césure
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillRect(gx - 4, basTige - 3, 8, 3);
        }
      }

      /* LA PISTE : la ligne de césure du barillet. Trait rongé, jamais net. */
      for (let x = x0; x < x1; x += 1) {
        if (rndFixe(x * 3 + 5) < 0.16) continue;
        const j = Math.floor(rndFixe(x * 3 + 6) * 2) - 1;
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(x, ty - 1 + j, 1, 2);
      }

      /* LA GORGE : la fenêtre de réussite, tramée orange, avec ses deux
         montants. C'est l'élément le plus lisible de l'écran, à dessein. */
      const winX = x0 + (windowCenter - config.windowWidth / 2) * (x1 - x0);
      const winW = config.windowWidth * (x1 - x0);
      bayerFill(ctx, winX, ty - 14, winW, 28, 0.85, ORANGE, null, 2);
      ctx.fillStyle = ORANGE;
      ctx.fillRect(Math.round(winX) - 1, ty - 22, 2, 16);
      ctx.fillRect(Math.round(winX + winW) - 1, ty - 22, 2, 16);
      // les deux crans du barillet qui bordent la gorge
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = "rgba(224,99,42,0.5)";
        ctx.fillRect(Math.round(winX) - 1, ty - 24 - i * 2, 2, 1);
        ctx.fillRect(Math.round(winX + winW) - 1, ty - 24 - i * 2, 2, 1);
      }

      /* LE CROCHET : une tige qui entre par la gauche et dont la POINTE est
         le curseur. La position reste une TRANSLATION horizontale — c'est ce
         qui rend le geste lisible (arbitrage du 29/08), l'habillage ne fait
         que dire ce qu'on tient. */
      const px = Math.round(x0 + trackPos() * (x1 - x0)) + ox;
      // traînée : quelques pixels derrière la pointe, dans le sens de marche
      const sens = ((t * vitesse) % 2) <= 1 ? -1 : 1;
      for (let i = 2; i < 16; i += 2) {
        ctx.fillStyle = `rgba(255,255,255,${0.22 - i * 0.012})`;
        ctx.fillRect(px + sens * i, ty - 1, 2, 2);
      }
      /* Le crochet vient du trou de serrure, en bas : la tige monte en biais
         depuis la fente jusqu'à la pointe, qui est le curseur. C'est ce trajet
         qui explique le geste — l'ancien manche horizontal partant du bord
         lisait comme un « L » posé là. La main tremble : ±1 px, jamais lisse. */
      const kx0 = (x0 + x1) / 2 + ox;
      const ky0 = PY + oy + PH - 42;
      const trem = Math.round(Math.sin(t * 17) * 1.2);
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      const pas2 = Math.max(1, Math.abs(px - kx0));
      for (let s = 0; s <= pas2; s++) {
        const u = s / pas2;
        // tige cassée : il n'en reste que le bas, qui sort du trou de serrure
        if (tigeCassee && u > 0.55) break;
        const lx = Math.round(kx0 + (px - kx0) * u);
        const ly = Math.round(ky0 - (ky0 - (ty + 14)) * u);
        ctx.fillRect(lx, ly + (u > 0.7 ? trem : 0), 2, 2);
      }
      if (!tigeCassee) {
        // le col du crochet, puis la pointe CROCHUE qui va chercher la goupille
        bayerFill(ctx, px - 2, ty - 14, 4, 30 + trem, 1, CREME, null, 1);
        ctx.fillStyle = CREME;
        if (becCasse === 0) {
          ctx.fillRect(px - 1, ty - 20, 2, 7);
          ctx.fillRect(px - 1, ty - 22, 4, 2); // le bec, tourné vers la droite
          ctx.fillRect(px + 2, ty - 24, 2, 3);
        } else if (becCasse === 1) {
          // ébréché : le bec a perdu sa pointe, il reste un moignon
          ctx.fillRect(px - 1, ty - 20, 2, 7);
          ctx.fillRect(px - 1, ty - 21, 3, 1);
        } else {
          // plus de bec du tout : une tige émoussée, en dents de scie
          ctx.fillRect(px - 1, ty - 18, 2, 5);
          ctx.fillRect(px, ty - 19, 1, 1);
        }
      }

      /* LES FRAGMENTS arrachés : ils tombent dans le barillet et y restent —
         le fer garde ce qu'on a cassé. Gravité simple, jamais un fondu. */
      const solBarillet = bt + bh - 4;
      for (const f of fragments) {
        if (f.y < solBarillet) {
          f.x += f.vx;
          f.y += f.vy;
          f.vy += 0.42;
          if (f.y >= solBarillet) {
            f.y = solBarillet;
            f.vx = 0;
            f.vy = 0;
          }
        }
        ctx.fillStyle = CREME;
        ctx.fillRect(Math.round(f.x) + ox, Math.round(f.y) + oy, f.w, f.w);
      }

      /* LES ÉRAFLURES accumulées par les ratés. */
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1;
      for (const e of eraflures) {
        ctx.beginPath();
        ctx.moveTo(e.x + ox, e.y + oy);
        ctx.lineTo(e.x + e.dx + ox, e.y + e.dy + oy);
        ctx.stroke();
      }
      /* LES FISSURES du fer : une file de pixels qui descend en zigzag depuis
         la piste jusqu'au bas de la platine, une par raté, permanente. */
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      for (const fis of fissures) {
        for (let i = 0; i < fis.length; i++) {
          const a = fis[i];
          const b = fis[i + 1] ?? a;
          const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
          for (let s = 0; s < n; s++) {
            const u = s / n;
            ctx.fillRect(Math.round(a.x + (b.x - a.x) * u) + ox, Math.round(a.y + (b.y - a.y) * u) + oy, 1, 1);
          }
        }
      }

      /* LE TROU DE SERRURE, sous le mécanisme : c'est par là que le crochet
         est entré. Rond + fente, en creux. */
      const kx = (x0 + x1) / 2 + ox,
        ky = PY + oy + PH - 42;
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.beginPath();
      ctx.arc(kx, ky, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(kx - 3, ky, 6, 18);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      for (let a = 0; a < 20; a++) {
        const ang = (a / 20) * Math.PI * 2;
        ctx.fillRect(Math.round(kx + Math.cos(ang) * 8), Math.round(ky + Math.sin(ang) * 8), 1, 1);
      }

      /* La goupille qui cède : un éclat bref SUR ELLE (sa tête clignote en
         paliers), plus jamais un flash de toute la platine — Patrick lisait
         ça comme un « écran blanc ». */
      if (eclat > 0) {
        eclat -= 1;
        const k = tombees - 1;
        if (k >= 0 && eclat % 2 === 0) {
          const gx = Math.round(bx + k * pas) + ox;
          ctx.fillStyle = CREME;
          ctx.fillRect(gx - 8, PY + oy + 20, 16, 4);
        }
      }

      /* LES ÉTAPES, en bas de l'écran : un carré plein par goupille — orange
         quand elle a cédé, blanc éteint tant qu'elle tient. C'est le langage
         des points de l'intro (carrés de 5 px, jamais une barre). On voit
         combien il reste à faire sans qu'aucun chiffre ne s'affiche. */
      const SQ = 7,
        GAP = 7;
      const totalW = goupilles * SQ + (goupilles - 1) * GAP;
      const sx0 = Math.round((TW - totalW) / 2);
      const sy = TH - 44;
      for (let k = 0; k < goupilles; k++) {
        const done = k < tombees;
        ctx.fillStyle = done ? ORANGE : "rgba(255,255,255,0.28)";
        ctx.fillRect(sx0 + k * (SQ + GAP), sy, SQ, SQ);
        // le carré qui vient de s'allumer clignote avec la goupille
        if (done && k === tombees - 1 && eclat > 0 && eclat % 2 === 0) {
          ctx.fillStyle = CREME;
          ctx.fillRect(sx0 + k * (SQ + GAP), sy, SQ, SQ);
        }
      }
    }

    function draw() {
      raf = requestAnimationFrame(draw);
      t += 0.016;
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, w, h);
      // fin différée : on laisse voir le dernier carré ou la casse
      if (finAt) {
        finAt.frames -= 1;
        if (finAt.frames <= 0) {
          const ok = finAt.ok;
          finAt = null;
          finish(ok);
        }
      }

      if (config.mode === "track") {
        dessineTrack();
      } else if (config.mode === "release") {
        const progress = Math.min(1, t / 1.4);
        const barW = (W - 60) * progress;
        ctx.strokeStyle = "rgba(232,223,200,0.3)";
        ctx.strokeRect(30, H / 2 - 10, W - 60, 20);
        bayerFill(ctx, 30, H / 2 - 10, barW, 20, 1, holding ? ORANGE : "rgba(232,223,200,0.4)", null, 2);
        const jitterZoneX = 30 + (snapAt - config.windowWidth) * (W - 60);
        releaseArmed = progress >= snapAt - config.windowWidth;
        if (releaseArmed && progress < snapAt) {
          bayerFill(ctx, jitterZoneX, H / 2 - 14, config.windowWidth * (W - 60), 28, 0.6, ORANGE, null, 2);
        }
        if (holding && progress >= snapAt + 0.02) finish(false);
      } else if (config.mode === "point") {
        const cx = W / 2,
          cy = H / 2,
          R = 60;
        // Fissures visibles = indice
        const fissures = 6;
        ctx.strokeStyle = "rgba(232,223,200,0.5)";
        ctx.lineWidth = 1;
        for (let i = 0; i < fissures; i++) {
          const a = (i / fissures) * Math.PI * 2 + rnd() * 0.1;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9);
          ctx.stroke();
        }
        bayerFill(ctx, cx - R, cy - R, R * 2, R * 2, 0.5, ORANGE, null, 3);
        const target = windowCenter * Math.PI * 2;
        ctx.fillStyle = CREME;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, R + 6, target - 0.15, target + 0.15);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, fond]);

  return (
    <canvas
      ref={canvasRef}
      width={track ? TW : W}
      height={track ? TH : H}
      className="minigame-canvas"
      style={{ touchAction: "none" }}
    />
  );
}
