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
 * Pose ou retire le drapeau (interrupteur « Mode démo » des Options — ajouté
 * le 24/08 quand le `?demo=1` s'est avéré inaccessible depuis la PWA
 * installée : l'icône de l'écran d'accueil ne transmet aucun paramètre, et
 * son stockage est séparé de celui de Safari).
 */
export function setDemo(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
    cache = null;
  } catch {
    /* stockage bloqué */
  }
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
  // Segment 4 — LA COLLINE, servie par la scène du PENDU QUI PARLE (même
  // lieu) : c'est le payoff de la graine plantée à la Borne (« le pendu de
  // la colline a parlé hier »). L'ancienne entrée colline-aux-gibets ne
  // livrait jamais le Pendu — le désir restait sans réponse.
  "pendu-qui-parle",
  "serment-hameau", //        segment 5 — l'entrée au village, le Serment
  "chapelle-des-cordes", //   segment 6 — la Veuve, la Corde coupée (Tracé)
  "marche-muet", //           segment 6 — le malaise diurne, court
  // Segment 7 (la NUIT au village) : ce n'est pas une destination — elle se
  // GLISSE entre le Marché et le Puits (déroutage dans Scene.tsx quand il ne
  // reste que le Puits à visiter dedans).
  "puits-condamne", //        segment 8 — le climax intérieur
  // Segments 9-10 (la MEUTE au portillon, la FALAISE AUX CORDES) : hors
  // route — servis par déroutage à la sortie du village. La Falaise n'est
  // pas un lieu du pool (exclue de TRAVERSAL_POOL, comme la Descente).
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


/**
 * LA PHASE DE LA COURBE (go du 24/08 — Accroche → Ouverture → Pression →
 * Climax). JAMAIS nommée à l'écran : elle pilote la musique, le resserrement
 * des marches et les RETOURS garantis (« pendant l'Ouverture je provoque le
 * monde ; pendant la Pression, le monde commence à me répondre »).
 *
 * Dérivée de l'état de la traversée, jamais persistée :
 *  - accroche  : la Borne (rien encore visité au-delà) ;
 *  - ouverture : la lande, avant l'entrée au village ;
 *  - pression  : le village (Serment → nuit → Puits) ;
 *  - climax    : ressorti du village (la Meute, la Falaise).
 *
 * ⚠️ La machinerie des RETOURS est une CATÉGORIE, pas un événement (verrou
 * n°2 de Patrick) : en Pression/Climax, au moins une chose PLANTÉE plus tôt
 * revient — la démo câble la Bête (si fuie) et la Meute comme cas d'école,
 * le jeu complet choisira parmi ce que la vie a réellement planté.
 */
export type DemoPhase = "accroche" | "ouverture" | "pression" | "climax";

export function demoPhase(opts: {
  visitedCount: number;
  entree: boolean;
  sorti: boolean;
}): DemoPhase {
  if (opts.sorti) return "climax";
  if (opts.entree) return "pression";
  if (opts.visitedCount <= 1) return "accroche";
  return "ouverture";
}
