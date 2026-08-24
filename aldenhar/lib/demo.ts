/**
 * LE MODE DÉMO — « La Nuit du Serment » (script arbitré du 24/08,
 * `data/demo-script.md`).
 *
 * La démo est un CHEMIN dans le jeu, pas un fork : mêmes scènes, mêmes
 * mécaniques, même mort. Ce module ne porte que ce qui change :
 *  - le drapeau (activé par l'URL `?demo=1`, persisté ; `?demo=0` le retire) ;
 *  - la ROUTE scriptée qui remplace le tirage des Croisées — le rythme d'une
 *    démo est une courbe dessinée à la main, jamais un tirage (constat du
 *    24/08 : « un tirage produit de la variété, jamais une courbe ») ;
 *  - les souvenirs du Seuil réduits à deux (Courage, Instinct — les deux
 *    stats que la démo sollicite le plus).
 *
 * Ce qui lit ce drapeau ailleurs : `fresh()` (Seuil court), `Intro` (une
 * seule clause — la porte animée), `Home` (pas de carton d'acte), `Scene`
 * (route scriptée + mini-jeux posés sur des choix).
 */

const KEY = "pactum-demo";
let cache: boolean | null = null;

/** Lit le drapeau (mis en cache — le mode ne change pas en pleine session). */
export function demoActive(): boolean {
  if (cache !== null) return cache;
  if (typeof window === "undefined") return false;
  try {
    cache = localStorage.getItem(KEY) === "1";
  } catch {
    cache = false;
  }
  return cache;
}

/**
 * À appeler UNE fois au montage de l'accueil : `?demo=1` (ou `?demo` nu)
 * pose le drapeau pour toutes les sessions suivantes — un testeur reçoit un
 * lien, pas une procédure. `?demo=0` le retire (retour au jeu complet).
 */
export function initDemoFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const p = new URLSearchParams(window.location.search).get("demo");
    if (p === "1" || p === "") localStorage.setItem(KEY, "1");
    else if (p === "0") localStorage.removeItem(KEY);
    cache = null; // relire au prochain demoActive()
  } catch {
    /* stockage bloqué : la démo restera inactive, le jeu complet joue */
  }
}

/** Les deux souvenirs du Seuil court (l'ordre est celui du prologue). */
export const DEMO_SOUVENIRS = ["courage", "instinct"] as const;

/**
 * LA ROUTE — les destinations servies aux Croisées, dans l'ordre du script.
 * La Bête n'y figure pas : elle EMBUSQUE la première route vers le Chemin
 * Creux (mécanique existante du 7/08), c'est le pic n°1. Les segments
 * au-delà du Puits (la nuit au crochetage, la Meute garantie, la Falaise
 * aux Cordes) arrivent dans les vagues suivantes — route épuisée, la
 * traversée retombe sur le tirage normal en attendant.
 */
export const DEMO_ROUTE: string[] = [
  "chemin-creux", //          segment 3 — la Bête embusque cette route
  "colline-aux-gibets", //    segment 4 — le Pendu qui parle (payoff du désir)
  "serment-hameau", //        segment 5 — l'entrée au village, le Serment
  "chapelle-des-cordes", //   segment 6 — la Veuve, la Corde coupée
  "marche-muet", //           segment 6 — le malaise diurne, court
  "puits-condamne", //        segment 8 — le climax
];

/**
 * Les destinations encore à servir, dans l'ordre. `dejaVisite` est
 * `lieuDejaVisite` de scene-data (injecté par l'appelant — ce module reste
 * sans dépendance vers les données de zone).
 */
export function demoRouteRestante(
  visited: string[],
  dejaVisite: (visited: string[], dest: string) => boolean
): string[] {
  return DEMO_ROUTE.filter((id) => !dejaVisite(visited, id));
}
