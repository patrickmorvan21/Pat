"use client";

import type { Choice } from "@/lib/scene-data";

/**
 * Bouton de choix — composant Figma "Group 36691" :
 * bordure simple, coins entaillés de 2px, texte à gauche, tag de stat en
 * accent à droite (choix risqués et verrouillés), verrouillé = opacité 40%.
 * État cliqué (Figma 95:1541) : liseré blanc intérieur inséré à 3px.
 */
export default function ChoiceButton({
  choice,
  selected,
  raised,
  onSelect,
}: {
  choice: Choice;
  selected: boolean;
  /** Pendant le lancer de dé : le choix cliqué passe au-dessus du voile. */
  raised?: boolean;
  onSelect: (choice: Choice) => void;
}) {
  const locked = Boolean(choice.locked);
  const tag = choice.risky?.stat ?? choice.locked?.stat;

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
      <span className="absolute top-1/2 left-[5%] -translate-y-1/2 font-medium leading-[1.2] text-[14px] whitespace-nowrap text-[var(--color-ink)]">
        {choice.label}
      </span>
      {tag && (
        <span className="absolute top-1/2 right-[4.17%] -translate-y-1/2 font-medium uppercase leading-[1.2] text-[12px] tracking-[0.6px] text-[var(--color-accent)]">
          {tag}
        </span>
      )}
      {/* Érosion santé : mordures qui rongent la bordure (spec §5) */}
      <span className="erosion-bites" aria-hidden />
    </button>
  );
}
