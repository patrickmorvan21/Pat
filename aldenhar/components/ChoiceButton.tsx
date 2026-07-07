"use client";

import type { Choice } from "@/lib/scene-data";

/**
 * Bouton de choix — composant Figma 84:3750 :
 * bordure simple, coins entaillés de 2px (pixel-art), texte à gauche,
 * tag de stat en accent à droite (uniquement sur les choix risqués),
 * verrouillé = opacité 40%, visible mais inactif.
 */
export default function ChoiceButton({
  choice,
  selected,
  onSelect,
}: {
  choice: Choice;
  selected: boolean;
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
      className={`relative h-[46px] w-full text-left ${
        locked ? "cursor-not-allowed opacity-40" : "cursor-pointer"
      }`}
    >
      <span className="absolute inset-0 border border-solid border-[var(--color-ink)]" />
      {/* Entailles de coins (2px, valeur Figma) */}
      <span className="absolute top-0 left-0 size-[2px] bg-[var(--color-notch)]" />
      <span className="absolute bottom-0 left-0 size-[2px] bg-[var(--color-notch)]" />
      <span className="absolute top-0 right-0 size-[2px] bg-[var(--color-notch)]" />
      <span className="absolute bottom-0 right-0 size-[2px] bg-[var(--color-notch)]" />
      <span
        className={`absolute top-1/2 left-[5%] -translate-y-1/2 font-medium leading-[1.2] text-[14px] whitespace-nowrap ${
          selected ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"
        }`}
      >
        {choice.label}
      </span>
      {tag && (
        <span className="absolute top-1/2 right-[4.17%] -translate-y-1/2 font-medium uppercase leading-[1.2] text-[12px] tracking-[0.6px] text-[var(--color-accent)]">
          {tag}
        </span>
      )}
    </button>
  );
}
