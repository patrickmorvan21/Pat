"use client";

/**
 * Icônes de navigation en CSS PROPRE — croix (fermer) et flèche (retour).
 *
 * ⚠️ Décision Patrick (21/08) qui AMENDE la règle du 16/07 (« plus jamais
 * deux traits CSS lisses ») : les assets pixel 32×32 (`croix_menu.png`,
 * `fleche_retour.png`) rendaient un glyphe épars quasi illisible sur écran
 * Retina — « pixellisés ». Les icônes sont désormais dessinées en CSS :
 * traits nets de 2px, blanc plein, dans le même carré bordé 32×32 que
 * portaient les assets (le cadre blanc 1px fait partie du dessin d'origine).
 * Ne pas revenir aux PNG.
 */

function Croix() {
  return (
    <span aria-hidden className="relative block size-[30px]">
      <span className="absolute left-[8px] top-[14px] h-[2px] w-[14px] rotate-45 bg-[var(--color-ink)]" />
      <span className="absolute left-[8px] top-[14px] h-[2px] w-[14px] -rotate-45 bg-[var(--color-ink)]" />
    </span>
  );
}

function Fleche() {
  return (
    <span aria-hidden className="relative block size-[30px]">
      {/* Pointe à (8,15) : hampe vers la droite + deux branches en chevron. */}
      <span className="absolute left-[8px] top-[14px] h-[2px] w-[15px] bg-[var(--color-ink)]" />
      <span
        className="absolute left-[7px] top-[14px] h-[2px] w-[10px] bg-[var(--color-ink)]"
        style={{ transform: "rotate(-45deg)", transformOrigin: "1px 1px" }}
      />
      <span
        className="absolute left-[7px] top-[14px] h-[2px] w-[10px] bg-[var(--color-ink)]"
        style={{ transform: "rotate(45deg)", transformOrigin: "1px 1px" }}
      />
    </span>
  );
}

/** Le bouton 32×32 : cadre blanc 1px sur fond charbon, glyphe CSS dedans —
    la même boîte que dessinaient les anciens assets. */
export function BoutonNav({
  icone,
  onClick,
  label,
}: {
  icone: "croix" | "fleche";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-[32px] cursor-pointer items-center justify-center border border-solid border-[var(--color-ink)] bg-[var(--color-bg)]/80 p-0"
    >
      {icone === "croix" ? <Croix /> : <Fleche />}
    </button>
  );
}
