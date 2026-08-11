"use client";

/**
 * L'AFFORDANCE « Touche pour … » — règle GLOBALE (journal Notion 26/07, §2).
 *
 * Présente sur tout écran d'intro et, plus largement, sur tout écran qui n'a
 * aucun bouton de choix : sans elle, rien ne dit que l'écran attend un geste.
 *
 * Spec verrouillée (amendée 11/08, retour Patrick) :
 *   • toujours à 50 px du bas du CADRE, centrée ;
 *   • MÊME taille (13px) et MÊME animation que le hint « Lancer le dé » —
 *     respiration `pulse` par paliers (`steps(2)`), jamais un fondu ;
 *   • « Touche pour commencer » sur le PREMIER écran d'une séquence,
 *     « Touche pour continuer » ensuite.
 *
 * Le composant est absolu : son parent doit être positionné (le phone-frame
 * l'est partout), ce qui garantit les 50 px quelle que soit la hauteur d'écran.
 */
export default function TouchHint({
  first = false,
  bottom,
  libelle,
}: {
  first?: boolean;
  /** TROISIÈME libellé, pendant la FRAPPE : là, le geste n'avance pas, il
      ACCÉLÈRE — d'où « Touche pour tout afficher ». Ajouté au composant plutôt
      que forké inline (relecture du 10/08 : une copie inline échappe à la spec
      verrouillée et diverge au premier correctif). */
  libelle?: string;
  /** Remontée en px depuis le bas. Le défaut est 50 px : c'est LA règle, et
      elle vaut pour tous les écrans pleins (intro, acte, prologue).
      ⚠️ La consigne « UNIQUEMENT pour la séquence de mort » qui figurait ici
      était morte : `Scene.tsx` s'en sert depuis les micro-beats, où la barre
      de choix occupe le bas de l'écran. Une règle qu'on lit et qu'on enfreint
      dans le même dépôt n'apprend plus rien à personne — voici la vraie.
      Deux dérogations légitimes, et deux seulement :
        • séquence de mort — les flammes montent à ~175 px, et le hint est posé à 200 (HINT_BAS) ;
        • écran de jeu en séquence — 14 px, sous la zone de texte.
      Pour tout le reste, laisser le défaut : la position du hint est un
      repère que le joueur apprend, pas un réglage de mise en page. */
  bottom?: number;
}) {
  return (
    <p
      className="touch-hint pointer-events-none absolute inset-x-0 text-center font-mono text-[13px] leading-[1.3] text-[var(--color-ink)]"
      style={{ bottom: bottom ?? 50 }}
      aria-hidden
    >
      {libelle ?? `Touche pour ${first ? "commencer" : "continuer"}`}
    </p>
  );
}
