"use client";

/**
 * L'AFFORDANCE « Touche pour … » — règle GLOBALE (journal Notion 26/07, §2).
 *
 * Présente sur tout écran d'intro et, plus largement, sur tout écran qui n'a
 * aucun bouton de choix : sans elle, rien ne dit que l'écran attend un geste.
 *
 * Spec verrouillée :
 *   • toujours à 50 px du bas du CADRE, centrée ;
 *   • Roboto Mono, blanc-50 ;
 *   • clignotement SACCADÉ — alternance visible/masquée par paliers, jamais un
 *     fondu ni un easing (`.touch-hint`, keyframes en `steps`) ;
 *   • « Touche pour commencer » sur le PREMIER écran d'une séquence,
 *     « Touche pour continuer » ensuite.
 *
 * Le composant est absolu : son parent doit être positionné (le phone-frame
 * l'est partout), ce qui garantit les 50 px quelle que soit la hauteur d'écran.
 */
export default function TouchHint({ first = false }: { first?: boolean }) {
  return (
    <p
      className="touch-hint pointer-events-none absolute inset-x-0 bottom-[50px] text-center font-mono text-[10px] tracking-[2px] text-[var(--color-ink)] opacity-50"
      aria-hidden
    >
      Touche pour {first ? "commencer" : "continuer"}
    </p>
  );
}
