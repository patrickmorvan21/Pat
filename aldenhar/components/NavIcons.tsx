"use client";

/**
 * Icônes de navigation — croix (fermer) et flèche (retour) en POINTS DE
 * PIXELS, rendus en CSS.
 *
 * Historique (21/08, deux allers-retours avec Patrick) :
 *  1. Les PNG 32×32 (`croix_menu.png`, « Group 15 » / `fleche_retour.png`,
 *     « Group 16 ») rendaient flou/« pixellisé » sur son iPhone → « refais-les
 *     au propre en CSS ».
 *  2. Ma première version CSS = traits pleins de 2px → « je veux des points
 *     de pixels comme sur ma maquette ».
 * Donc : le DESSIN de la maquette (un semis de points épars qui suggère la
 * croix / le chevron, avec ses asymétries voulues), mais dessiné par le CSS —
 * chaque point est un carré net de 1px (box-shadow), plus jamais un bitmap
 * upscalé. Les coordonnées ci-dessous sont TRANSCRITES pixel par pixel des
 * deux PNG d'origine (grille 32×32, cadre blanc 1px compris — le cadre est
 * porté par la bordure du bouton). Ne pas « symétriser » les motifs : les
 * doublons de points font partie du dessin.
 */

/** Croix — les 10 points du « Group 15 ». */
const POINTS_CROIX: [number, number][] = [
  [21, 9], [21, 10],
  [12, 12], [19, 12],
  [15, 15],
  [12, 18], [19, 18],
  [9, 21], [10, 21], [21, 21],
];

/** Flèche (retour) — les 7 points du « Group 16 » : un chevron ouvert vers
    la gauche. */
const POINTS_FLECHE: [number, number][] = [
  [18, 9], [18, 10],
  [16, 12],
  [12, 15], [12, 16],
  [16, 18],
  [18, 20],
];

function Points({ points }: { points: [number, number][] }) {
  // Un seul élément de 1×1 : chaque point est une copie box-shadow — net à
  // toutes les densités d'écran, aucune image.
  const ombre = points
    // −1 : les coordonnées incluent le cadre du PNG, ici porté par la
    // bordure du bouton (le point se place dans la boîte de contenu 30×30).
    .map(([x, y]) => `${x - 1}px ${y - 1}px 0 0 var(--color-ink)`)
    .join(", ");
  return (
    <span aria-hidden className="relative block size-[30px]">
      <span className="absolute left-0 top-0 size-[1px]" style={{ boxShadow: ombre }} />
    </span>
  );
}

/** Le bouton 32×32 : cadre blanc 1px sur fond charbon, semis de points
    dedans — la boîte exacte que dessinaient les assets de la maquette. */
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
      <Points points={icone === "croix" ? POINTS_CROIX : POINTS_FLECHE} />
    </button>
  );
}
