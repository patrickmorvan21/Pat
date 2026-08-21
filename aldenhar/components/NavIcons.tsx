"use client";

/**
 * Icônes de navigation — croix (fermer) et flèche (retour), rendues en SVG
 * INLINE, copie EXACTE des deux SVG fournis par Patrick (21/08, Drive
 * `PACTUM/Assets/UI/fermer.svg` + `retour.svg`, versionnés dans
 * `public/assets/` pour rester diffables avec le Drive).
 *
 * Historique du 21/08 (trois allers-retours) :
 *  1. Les PNG 32×32 rendaient flou → « refais-les au propre en CSS ».
 *  2. Traits pleins 2px → « je veux des points de pixels comme ma maquette ».
 *  3. Mes points transcrits des PNG étaient ASYMÉTRIQUES — la rastérisation
 *     32px des PNG avait perdu/décalé des points (les vrais points font
 *     1,26px à des positions fractionnaires). Patrick a fourni les SVG
 *     sources : fermer = 9 points en X symétrique, retour = chevron de
 *     5 points. C'est CE dessin, tel quel — ne plus le re-transcrire depuis
 *     un raster, et ne pas « arrondir » les coordonnées.
 *
 * Le cadre (rect bordé) fait partie du dessin : le bouton n'ajoute AUCUNE
 * bordure. Couleurs traduites en tokens (#1C1A16 → --color-bg, white →
 * --color-ink) pour rester dans la palette.
 */

const CADRE = (
  <rect
    x="0.5"
    y="0.5"
    width="30.9846"
    height="30.9846"
    fill="var(--color-bg)"
    stroke="var(--color-ink)"
  />
);

function pt(x: number | string, y: number | string) {
  return <rect key={`${x}-${y}`} x={x} y={y} width="1.25938" height="1.25938" fill="var(--color-ink)" />;
}

/** fermer.svg — le X en 9 points (4 coins, 4 internes, 1 centre). */
function SvgFermer() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      {CADRE}
      {pt("9.36133", "9.36133")}
      {pt("21.165", "9.36133")}
      {pt("11.9844", "12")}
      {pt("18.9844", "12")}
      {pt("15.2627", "15.2632")}
      {pt("11.9844", "18")}
      {pt("18.9844", "18")}
      {pt("9.36133", "21.1648")}
      {pt("21.165", "21.1648")}
    </svg>
  );
}

/** retour.svg — le chevron « < » en 5 points. */
function SvgRetour() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      {CADRE}
      {pt("17.9023", "9.36133")}
      {pt("15.7217", "12")}
      {pt("12", "15.2632")}
      {pt("15.7217", "18")}
      {pt("17.9023", "21.1648")}
    </svg>
  );
}

/** Le bouton 32×32 — le SVG porte son propre cadre, le bouton reste nu. */
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
      className="block size-[32px] cursor-pointer border-none bg-transparent p-0"
    >
      {icone === "croix" ? <SvgFermer /> : <SvgRetour />}
    </button>
  );
}
