"use client";

import { useEffect, useRef, useState } from "react";
import TouchHint from "@/components/TouchHint";

/**
 * LA TEMPÊTE DE SEL — les Salines (prototype `maquettes/encroute_tempete.html`,
 * validé par Patrick le 13/09 : « rafale de 8 s, 60 % balayés »).
 *
 * Un calque plein cadre par-dessus le jeu. Des points de sel NAISSENT par
 * paquets, depuis la droite (rafale), de plus en plus nombreux pendant huit
 * secondes, puis plus rien ne naît. La main les efface là où elle passe
 * (rayon 24 px). Quand la main a retiré 60 % de ce qu'il y avait au plus
 * fort — ou qu'il reste moins de 7 % — le reste se dissout tout seul, par
 * paliers, et le calque se retire. La narration derrière n'est jamais
 * touchée : le sel ne monte que sur l'écran, et l'écran se balaie.
 *
 * Réglages du prototype, verrouillés : TICK 120 ms · DUREE 8000 · plafond de
 * couverture 55 % · pic minimum 18 % · fin sous 7 % · part balayée 0,6 ·
 * rayon 24 px · cellule 3 px. Deux couleurs, jamais une opacité : la
 * dissolution retire des points, elle ne les fond pas.
 */
const CELL = 3;
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
    const naissance = (nb: number, t: number) => {
      // RAFALE : le front part de la droite et gagne vers la gauche avec le
      // temps ; chaque paquet fait 1 à 5 cellules.
      const front = 1 - Math.min(1, t * 1.15);
      let poses = 0;
      let garde = 0;
      while (poses < nb && garde < nb * 6) {
        garde++;
        const u = front + rs() * (1 - front);
        const gx = Math.min(GW - 1, Math.floor(u * GW));
        const gy = Math.floor(rs() * GH);
        const taille = 1 + Math.floor(rs() * 5);
        for (let k = 0; k < taille; k++) {
          const x = gx + Math.floor(rs() * 3) - 1;
          const y = gy + Math.floor(rs() * 3) - 1;
          if (x < 0 || y < 0 || x >= GW || y >= GH) continue;
          const i = y * GW + x;
          if (!sel[i]) {
            sel[i] = 1;
            poses++;
          }
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
        if (nb > 0) naissance(nb, t);
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
