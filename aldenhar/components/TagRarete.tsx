/**
 * TAG DE RARETÉ — un seul composant pour les trois écrans qui en montrent un
 * (la fiche de relique de la mort, l'écran Reliques, l'inventaire du menu).
 * Maquette 2333-7011, qui fait foi : AUCUNE couleur neuve, la palette reste
 * Charbon/Orange/Blanc — commune = contour blanc, rare = fond blanc texte
 * charbon, légendaire = fond orange texte charbon.
 *
 * Il accepte les deux échelles du jeu : celle des reliques (`commune`) et
 * celle de la Besace (`commun`). Deux composants recopiés (DeathScreen et
 * Reliques en avaient chacun un) auraient divergé au premier correctif —
 * c'est arrivé : l'un écrivait « relique commune », l'autre « RELIQUE
 * COMMUNE » en capitales CSS.
 */
export type Rarete = "commune" | "commun" | "rare" | "legendaire";

const LIBELLE: Record<Rarete, string> = {
  commune: "commune",
  commun: "commun",
  rare: "rare",
  legendaire: "légendaire",
};

export default function TagRarete({
  rarity,
  /** Préfixe (« relique ») pour les écrans où le mot seul serait ambigu. */
  prefixe,
  className,
}: {
  rarity: Rarete;
  prefixe?: string;
  className?: string;
}) {
  const base =
    "inline-block p-[4px] font-mono text-[12px] font-medium uppercase tracking-[0.6px] leading-[1.2]";
  const couleur =
    rarity === "legendaire"
      ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
      : rarity === "rare"
        ? "bg-[var(--color-ink)] text-[var(--color-bg)]"
        : "border border-solid border-[var(--color-ink)] text-[var(--color-ink)]";
  return (
    <span className={`${base} ${couleur} ${className ?? ""}`}>
      {prefixe ? `${prefixe} ` : ""}
      {LIBELLE[rarity]}
    </span>
  );
}
