"use client";

import { useEffect, useRef, useState } from "react";
import TouchHint from "@/components/TouchHint";

/**
 * LA TEMPÊTE DE SEL — les Salines (prototype `maquettes/encroute_tempete.html`,
 * validé par Patrick le 13/09 : « rafale de 8 s, 60 % balayés »).
 *
 * ⚠️ PORT FIDÈLE du prototype (deuxième passe, retour Patrick du 13/09 soir :
 * « il y a un balayage de la droite vers la gauche alors que les pixels sont
 * censés pop up de manière aléatoire sur l'écran, de plus les pixels blancs
 * sont un peu trop gros »). La première version avait été réécrite de
 * mémoire — un FRONT qui gagnait de droite à gauche et des cellules de 3 px.
 * Le prototype, lui, fait NAÎTRE chaque point à une abscisse tirée
 * `1 − rs()^(0,45 + min(0,5, âge·0,004))` : un biais léger qui se dilue avec
 * l'âge de la rafale, et qui se lit comme du hasard, pas comme un rideau.
 * ⚠️ Son commentaire disait « surtout à droite » ; la formule penche en fait
 * vers la GAUCHE (mesuré en jeu à 2,5 s : 54 % des points dans le tiers
 * gauche, 11 % dans le tiers droit). C'est ce rendu-là que Patrick a validé
 * à l'écran — on porte la formule, pas le commentaire. Et ses cellules font
 * 2 px. Les deux sont repris tels quels.
 *
 * Un calque plein cadre par-dessus le jeu. Des points de sel NAISSENT par
 * paquets (1 point + 0 à 4 voisins dans un carré de 5), de plus en plus
 * nombreux pendant huit secondes, puis plus rien ne naît. La main les efface
 * là où elle passe (rayon 24 px). Quand la main a retiré 60 % de ce qu'il y
 * avait au plus fort — ou qu'il reste moins de 7 % — le reste se dissout tout
 * seul, par paliers, et le calque se retire. La narration derrière n'est
 * jamais touchée : le sel ne monte que sur l'écran, et l'écran se balaie.
 *
 * Réglages du prototype, verrouillés : TICK 120 ms · DUREE 8000 · plafond de
 * couverture 55 % · pic minimum 18 % · fin sous 7 % · part balayée 0,6 ·
 * rayon 24 px · cellule 2 px. Deux couleurs, jamais une opacité : la
 * dissolution retire des points, elle ne les fond pas.
 */
const CELL = 2;
const TICK = 120;
const DUREE = 8000;
const PLAFOND = 0.55;
const PIC_MIN = 0.18;
const FIN_SOUS = 0.07;
const PART_BALAYEE = 0.6;
const RAYON = 24;

export default function TempeteSel({ onFin }: { onFin: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const finRef = useRef(onFin);
  useEffect(() => {
    finRef.current = onFin;
  }, [onFin]);
  const [balaye, setBalaye] = useState(0);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const boite = cv.parentElement?.getBoundingClientRect();
    const W = Math.round(boite?.width ?? 390);
    const H = Math.round(boite?.height ?? 800);
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = `${W}px`;
    cv.style.height = `${H}px`;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const GW = Math.ceil(W / CELL);
    const GH = Math.ceil(H / CELL);
    const N = GW * GH;
    const sel = new Uint8Array(N);
    let seed = 987654321;
    const rs = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    let age = 0;
    let pic = 0;
    let balayeN = 0;
    let finEnCours = false;
    let fini = false;
    let couv = 0;
    let dernierBalayeAffiche = -1;

    const compter = () => {
      let n = 0;
      for (let i = 0; i < N; i++) n += sel[i];
      couv = n / N;
      return n;
    };
    const dessiner = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < N; i++) {
        if (!sel[i]) continue;
        ctx.fillRect((i % GW) * CELL, Math.floor(i / GW) * CELL, CELL, CELL);
      }
    };
    const naissance = (nb: number) => {
      // PROTOTYPE, verbatim : chaque point naît à une abscisse
      // `CW·(1 − rs()^(0,45 + min(0,5, âge·0,004)))` — un biais léger vers la
      // gauche qui se dilue avec l'âge, lu comme du hasard à l'écran — et une
      // ordonnée uniforme ; puis un petit paquet de 0 à 4 cellules dans un
      // carré de 5 autour de lui.
      const expo = 0.45 + Math.min(0.5, age * 0.004);
      for (let k = 0; k < nb; k++) {
        const cx = Math.min(GW - 1, Math.floor(GW * (1 - Math.pow(rs(), expo))));
        const cy = Math.floor(rs() * GH);
        sel[cy * GW + cx] = 1;
        const paquet = Math.floor(rs() * 5);
        for (let q = 0; q < paquet; q++) {
          const x = cx + Math.floor(rs() * 5) - 2;
          const y = cy + Math.floor(rs() * 5) - 2;
          if (x >= 0 && x < GW && y >= 0 && y < GH) sel[y * GW + x] = 1;
        }
      }
    };
    const tic = () => {
      if (fini) return;
      age += 1;
      const t = (age * TICK) / DUREE;
      const souffle = t <= 1;
      const n = compter();
      if (!finEnCours) {
        const nb = !souffle || couv >= PLAFOND ? 0 : Math.round((30 + 700 * t * t) * (6000 / DUREE));
        if (nb > 0) naissance(nb);
        const n2 = compter();
        pic = Math.max(pic, n2 / N);
        if (pic >= PIC_MIN && (couv < FIN_SOUS || balayeN >= pic * N * PART_BALAYEE)) finEnCours = true;
        // la rafale s'est tue et rien n'a été balayé depuis longtemps : le
        // sel finit par tomber tout seul (un joueur qui ne balaie pas n'est
        // jamais muré — c'est un prix de lecture, pas un mur)
        if (!souffle && age * TICK > DUREE * 2.2) finEnCours = true;
      } else {
        // DISSOLUTION : la moitié des points par palier, les derniers d'un coup
        for (let i = 0; i < N; i++) if (sel[i] && rs() < 0.5) sel[i] = 0;
        const reste = compter();
        if (reste < 80) {
          sel.fill(0);
          fini = true;
        }
      }
      void n;
      dessiner();
      if (fini) {
        window.clearInterval(iv);
        window.setTimeout(() => finRef.current(), 160);
      }
    };
    const iv = window.setInterval(tic, TICK);

    // LA MAIN EFFACE ce qu'elle traverse (rayon 24 px), sur window : sur iOS
    // un doigt qui sort du cadre emporte les événements (leçon du 28/07).
    let tient = false;
    const effacer = (clientX: number, clientY: number) => {
      const r = cv.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      const rc = Math.ceil(RAYON / CELL);
      const gx = Math.floor(x / CELL);
      const gy = Math.floor(y / CELL);
      let retire = 0;
      for (let dy = -rc; dy <= rc; dy++) {
        for (let dx = -rc; dx <= rc; dx++) {
          if (dx * dx + dy * dy > rc * rc) continue;
          const cx = gx + dx;
          const cy = gy + dy;
          if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) continue;
          const i = cy * GW + cx;
          if (sel[i]) {
            sel[i] = 0;
            retire++;
          }
        }
      }
      if (retire) {
        balayeN += retire;
        dessiner();
        const part = pic > 0 ? Math.min(1, balayeN / (pic * N)) : 0;
        const pas = Math.floor(part * 10);
        if (pas !== dernierBalayeAffiche) {
          dernierBalayeAffiche = pas;
          setBalaye(part);
        }
      }
    };
    const down = (e: PointerEvent) => {
      tient = true;
      effacer(e.clientX, e.clientY);
    };
    const move = (e: PointerEvent) => {
      if (tient) effacer(e.clientX, e.clientY);
    };
    const up = () => {
      tient = false;
    };
    cv.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      fini = true;
      window.clearInterval(iv);
      cv.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-[44]" data-tempete style={{ touchAction: "none" }}>
      <canvas
        ref={ref}
        className="absolute inset-0"
        style={{ imageRendering: "pixelated", touchAction: "none", userSelect: "none" }}
      />
      {balaye < 0.1 && <TouchHint libelle="Balaie le sel" />}
    </div>
  );
}
