"use client";

import { useMemo } from "react";
import FitLabel from "@/components/FitLabel";
import type { Choice } from "@/lib/scene-data";

/**
 * Bouton de choix — composant Figma "Group 36691" :
 * bordure simple, coins entaillés de 2px (pixel-art), texte à gauche,
 * tag de stat en accent à droite, verrouillé = opacité 40%.
 * État cliqué (Figma 95:1541) : liseré blanc intérieur inséré à 3px.
 *
 * Érosion santé (spec §5, 4 paliers validés 11/07) : des pixels se perdent
 * autour du contour, positions pseudo-aléatoires (seedées par choix, stables
 * au re-render), dispersion non linéaire, certains scintillent. Au palier
 * critique la densité de pixels intacts est divisée par ~4, mais les boutons
 * restent toujours lisibles et tapables — l'accessibilité prime sur l'effet.
 */

type Bite = {
  left: number;
  top: number;
  size: number;
  flicker: boolean;
  duration: number;
  delay: number;
};

function seededRandom(seedStr: string) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++)
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const BTN_W = 360;
const BTN_H = 46;

/** Palier 1 « Marqué » = rendu proto validé le 11/07, inchangé.
 *  Palier 3 accentué le 14/07 (retour Patrick : « la mort n'est pas très
 *  loin » doit se SENTIR — état KO) : beaucoup plus de pixels morts, qui
 *  scintillent presque tous. Les boutons restent lisibles et tapables. */
const TIER = {
  1: { count: 12, maxSize: 2, maxJitter: 3, flickerRatio: 0.35 },
  2: { count: 26, maxSize: 4, maxJitter: 5, flickerRatio: 0.45 },
  3: { count: 95, maxSize: 5, maxJitter: 12, flickerRatio: 0.75 },
} as const;

function makeBites(seedStr: string, erosion: number): Bite[] {
  if (erosion <= 0) return [];
  const cfg = TIER[erosion as 1 | 2 | 3];
  const rnd = seededRandom(seedStr);
  const bites: Bite[] = [];
  for (let i = 0; i < cfg.count; i++) {
    // Répartition non linéaire : les pixels se regroupent par grappes (rnd²)
    const side = rnd();
    const along = Math.pow(rnd(), 1.6) * (rnd() < 0.5 ? 1 : -1) * 0.5 + 0.5;
    const jitter = Math.floor(rnd() * cfg.maxJitter) - 1;
    const size = 1 + Math.round(rnd() * cfg.maxSize);
    let left: number, top: number;
    if (side < 0.35) {
      left = along * BTN_W;
      top = -1 + jitter; // bord haut
    } else if (side < 0.7) {
      left = along * BTN_W;
      top = BTN_H - 1 - jitter; // bord bas
    } else if (side < 0.85) {
      left = -1 + jitter; // bord gauche
      top = along * BTN_H;
    } else {
      left = BTN_W - 1 - jitter; // bord droit
      top = along * BTN_H;
    }
    bites.push({
      left: Math.round(left),
      top: Math.round(top),
      size,
      flicker: rnd() < cfg.flickerRatio,
      duration: 0.7 + rnd() * 1.3,
      delay: rnd() * 1.5,
    });
  }
  return bites;
}

export default function ChoiceButton({
  choice,
  selected,
  raised,
  erosion = 0,
  onSelect,
}: {
  choice: Choice;
  selected: boolean;
  /** Pendant le lancer de dé : le choix cliqué passe au-dessus du voile. */
  raised?: boolean;
  /** Palier d'érosion santé : 0 intact, 1 marqué, 2 entaillé, 3 au seuil. */
  erosion?: number;
  onSelect: (choice: Choice) => void;
}) {
  const locked = Boolean(choice.locked);
  const tag = choice.risky?.stat ?? choice.locked?.stat;
  const bites = useMemo(
    () => makeBites(choice.id + choice.label, erosion),
    [choice.id, choice.label, erosion]
  );

  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => onSelect(choice)}
      aria-disabled={locked}
      className={`choice-btn relative h-[46px] w-full text-left ${
        locked ? "cursor-not-allowed opacity-40" : "cursor-pointer"
      } ${raised ? "z-[6]" : ""}`}
    >
      <span className="absolute inset-0 border border-solid border-[var(--color-ink)] bg-[var(--color-bg)]" />
      {/* Entailles de coins (2px) */}
      <span className="absolute top-0 left-0 size-[2px] bg-[var(--color-bg)]" />
      <span className="absolute bottom-0 left-0 size-[2px] bg-[var(--color-bg)]" />
      <span className="absolute top-0 right-0 size-[2px] bg-[var(--color-bg)]" />
      <span className="absolute bottom-0 right-0 size-[2px] bg-[var(--color-bg)]" />
      {/* Liseré intérieur — état cliqué */}
      {selected && (
        <>
          <span className="absolute top-[2px] right-[4px] left-[4px] h-px bg-[var(--color-ink)]" />
          <span className="absolute bottom-[2px] right-[4px] left-[4px] h-px bg-[var(--color-ink)]" />
          <span className="absolute top-[3px] bottom-[3px] left-[3px] w-px bg-[var(--color-ink)]" />
          <span className="absolute top-[3px] bottom-[3px] right-[3px] w-px bg-[var(--color-ink)]" />
        </>
      )}
      {/* max-width : un libellé long ne chevauche jamais le tag de stat.
          FitLabel (16/07) : la police descend jusqu'à ce que TOUT le libellé
          soit visible — jamais de « … », jamais un bouton plus grand. */}
      <FitLabel
        text={choice.label}
        className={`absolute top-1/2 left-[5%] -translate-y-1/2 overflow-hidden text-ellipsis font-medium leading-[1.2] whitespace-nowrap text-[var(--color-ink)] ${
          tag ? "max-w-[68%]" : "max-w-[90%]"
        }`}
      />
      {tag && (
        <span className="absolute top-1/2 right-[4.17%] flex -translate-y-1/2 items-center gap-[6px] font-medium uppercase leading-[1.2] text-[12px] tracking-[0.6px] text-[var(--color-accent)]">
          {/* Choix verrouillé : LOSANGE VIDE en plus du grisé (spec 4/08 A7,
              accessibilité daltoniens) — jamais un cadenas, le losange est le
              glyphe du pacte. Carré bordé tourné 45°, pixel-art, pas d'emoji. */}
          {locked && (
            <span
              aria-hidden
              className="inline-block size-[7px] rotate-45 border border-current"
            />
          )}
          {tag}
        </span>
      )}
      {/* Pixels perdus par l'érosion santé */}
      {bites.map((b, i) => (
        <span
          key={i}
          aria-hidden
          className={`bite ${b.flicker ? "flicker" : ""}`}
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            animationDuration: b.flicker ? `${b.duration.toFixed(2)}s` : undefined,
            animationDelay: b.flicker ? `${b.delay.toFixed(2)}s` : undefined,
          }}
        />
      ))}
    </button>
  );
}
