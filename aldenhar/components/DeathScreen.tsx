"use client";

import { useEffect, useRef, useState } from "react";
import type { Relic } from "@/lib/player-memory";

/**
 * Séquence d'écran de mort (journal Notion 13/07, précède la Relique §10) :
 *  1. le dé se brise — plus de relance possible (rendu 2D tramé en proto,
 *     les deux moitiés dérivent ; la vraie fracture 3D est notée à affiner)
 *  2. épitaphe courte (Jacquard 12) décrivant exactement comment on est mort
 *  3. dissolution en pixels plein écran, CONVERGENTE : démarre sur les 4
 *     côtés simultanément et progresse vers le centre
 *  4. chiffres de run : Jour atteint, rencontres survécues
 *  5. CTA « Découvrir ma relique »
 *  6. la Relique se cristallise
 *  7. CTA « Accepter la Relique et recommencer »
 * La mort est déjà enregistrée (mémoire + run réinitialisée) AVANT ce
 * composant : fermer l'app pendant l'écran ne ressuscite jamais la run.
 */

const W = 390;
const H = 800;
const CHARBON = "#1c1a16";
const ORANGE = "#e0632a";

type Phase = "briser" | "epitaphe" | "dissolution" | "chiffres" | "relique";

const RARITY_WORDS: Record<Relic["rarity"], string> = {
  commune: "Commune",
  rare: "Rare",
  legendaire: "Légendaire",
};

function drawBrokenDie(ctx: CanvasRenderingContext2D, cx: number, cy: number, drift: number) {
  // d20 stylisé en deux moitiés qui s'écartent le long d'une fêlure jaggée.
  const R = 52;
  const jag = [
    { x: -6, y: -R },
    { x: 4, y: -R * 0.45 },
    { x: -8, y: 0 },
    { x: 6, y: R * 0.5 },
    { x: -2, y: R },
  ];
  for (const side of [-1, 1] as const) {
    ctx.save();
    ctx.translate(cx + side * drift, cy + (side === -1 ? -drift * 0.3 : drift * 0.3));
    ctx.rotate(side * drift * 0.004);
    ctx.beginPath();
    // moitié d'hexagone…
    for (let i = 0; i <= 3; i++) {
      const a = -Math.PI / 2 + side * ((i / 3) * Math.PI);
      const x = Math.cos(a) * R,
        y = Math.sin(a) * R;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    // …refermée par la fêlure.
    const crack = side === 1 ? [...jag].reverse() : jag;
    for (const p of crack) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Remplissage tramé grossier (Bayer 2×2 manuel, pas de dégradé lisse).
    ctx.clip();
    ctx.fillStyle = ORANGE;
    for (let y = -R; y < R; y += 6) {
      for (let x = -R; x < R + 8; x += 6) {
        if ((Math.floor(x / 6) + Math.floor(y / 6)) % 2 === 0) ctx.fillRect(x, y, 2, 2);
      }
    }
    ctx.restore();
  }
}

export default function DeathScreen({
  epitaph,
  day,
  encounters,
  relic,
  onRestart,
}: {
  epitaph: string;
  day: number;
  encounters: number;
  relic: Relic;
  onRestart: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("briser");

  // Chorégraphie : bris du dé (1.4s) → épitaphe (2.6s) → dissolution (1.9s)
  // → chiffres (CTA) → relique (CTA). Le canvas anime les deux premières et
  // la dissolution ; React affiche les couches texte.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const start = performance.now();
    let dissolveStart = 0;

    const BAYER4 = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ].map((row) => row.map((v) => (v + 0.5) / 16));

    let localPhase: Phase = "briser";
    function setBoth(p: Phase) {
      localPhase = p;
      setPhase(p);
    }

    function draw(now: number) {
      raf = requestAnimationFrame(draw);
      const t = (now - start) / 1000;

      if (localPhase === "briser" || localPhase === "epitaphe") {
        ctx.fillStyle = CHARBON;
        ctx.fillRect(0, 0, W, H);
        // Bris : les moitiés s'écartent par crans (steps), pas en continu.
        const drift = Math.min(14, Math.floor(Math.min(t, 1.3) * 5) * 3);
        drawBrokenDie(ctx, W / 2, 240, drift);
        if (localPhase === "briser" && t > 1.4) setBoth("epitaphe");
        if (localPhase === "epitaphe" && t > 4.0) {
          dissolveStart = now;
          setBoth("dissolution");
        }
      } else if (localPhase === "dissolution") {
        // Convergente : les 4 bords avancent ensemble vers le centre.
        const dt = (now - dissolveStart) / 1900;
        const cell = 3;
        for (let y = 0; y < H; y += cell) {
          for (let x = 0; x < W; x += cell) {
            const edge = Math.min(x, y, W - x, H - y) / 195; // 0 au bord → ~1 au centre
            const jitter = BAYER4[Math.floor(y / cell) % 4][Math.floor(x / cell) % 4] * 0.22;
            if (dt * 1.25 > edge + jitter) {
              ctx.fillStyle = CHARBON;
              ctx.fillRect(x, y, cell, cell);
            }
          }
        }
        if (dt >= 1) {
          ctx.fillStyle = CHARBON;
          ctx.fillRect(0, 0, W, H);
          setBoth("chiffres");
        }
      }
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="death-screen absolute inset-0 z-[20] bg-[var(--color-bg)]">
      <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />

      {(phase === "epitaphe" || phase === "dissolution") && (
        <div className="death-epitaph absolute inset-x-[28px] top-[340px] text-center">
          <p className="death-title">Ici s&apos;achève ta route.</p>
          <p className="death-text">{epitaph}</p>
        </div>
      )}

      {phase === "chiffres" && (
        <div className="death-stats absolute inset-x-[28px] top-[300px] text-center">
          <p className="death-figure">Jour {day}</p>
          <p className="death-sub">
            {encounters} rencontre{encounters > 1 ? "s" : ""} survécue{encounters > 1 ? "s" : ""}
          </p>
          <button type="button" className="death-cta" onClick={() => setPhase("relique")}>
            Découvrir ma relique
          </button>
        </div>
      )}

      {phase === "relique" && (
        <div className="death-relic absolute inset-x-[28px] top-[270px] text-center">
          <p className="death-sub">De cette mort, il reste quelque chose.</p>
          <div className="relic-frame">
            <p className="relic-name">{relic.name}</p>
            <p className={`relic-rarity rarity-${relic.rarity}`}>{RARITY_WORDS[relic.rarity]}</p>
          </div>
          <button type="button" className="death-cta" onClick={onRestart}>
            Accepter la Relique et recommencer
          </button>
        </div>
      )}
    </div>
  );
}
