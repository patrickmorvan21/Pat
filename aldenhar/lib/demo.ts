/**
 * LA TRAVERSÉE GUIDÉE — « La Nuit du Serment » (script arbitré du 24/08,
 * `data/demo-script.md`).
 *
 * ⚠️ LE MODE DÉMO N'EXISTE PLUS (décision Patrick, 2/09) : « la première run
 * est en fait la démo de Pactum ». La courbe scriptée du 24/08 n'est plus un
 * mode qu'on active (drapeau, URL, interrupteur des Options — tous retirés) :
 * c'est ce que joue TOUTE PREMIÈRE RUN d'un compte, pour montrer un maximum
 * de fonctionnalités (mini-jeux, chronomètre, crochetage, Soupçon au hameau,
 * la Meute, la Falaise, un élément-surprise) avec du rythme. Dès la deuxième
 * incarnation, la traversée retombe sur le tirage normal.
 *
 * La traversée guidée est un CHEMIN dans le jeu, pas un fork : mêmes scènes,
 * mêmes mécaniques, même mort. Ce module ne porte que ce qui change :
 *  - le prédicat (`traverseeGuidee`), DÉRIVÉ de la mémoire du compte — jamais
 *    un drapeau posé à part, qui pourrait diverger de ce que le compte a
 *    réellement joué (« Effacer la progression » redonne donc la première
 *    run, comme on l'attend) ;
 *  - la ROUTE scriptée qui remplace le tirage des Croisées — le rythme d'une
 *    première partie est une courbe dessinée à la main, jamais un tirage
 *    (constat du 24/08 : « un tirage produit de la variété, jamais une
 *    courbe »).
 *
 * Ce qui lit ce prédicat ailleurs : `fresh()` (cible de traversée), `Scene`
 * (route scriptée, déroutages de la courbe, mini-jeux posés sur des choix).
 * L'intro et le Seuil ne sont PLUS raccourcis : un vrai premier joueur
 * mérite le pacte entier et les quatre souvenirs — la compression du 24/08
 * servait une borne de salon, pas une première partie.
 *
 * Les noms `DEMO_*` sont conservés : ils désignent la ROUTE du script, qui
 * n'a pas changé — seul le moment où elle se joue a changé.
 */

import { loadMemory } from "@/lib/player-memory";

/**
 * La première run du compte est-elle en cours (ou sur le point de commencer) ?
 * `runsStarted` est incrémenté au seed de chaque run neuve (Scene, montage) :
 * 0 = aucune run encore (l'intro, le Seuil), 1 = la première run. Au-delà,
 * le tirage normal.
 *
 * Pas de cache : le passage 1 → 2 se fait après un rechargement complet
 * (mort ou Descente), mais lire la mémoire coûte un `JSON.parse`, ce qui est
 * négligeable au rythme d'un écran.
 */
export function traverseeGuidee(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return loadMemory().runsStarted <= 1;
  } catch {
    return false;
  }
}

/**
 * LA ROUTE — les destinations servies aux Croisées, dans l'ordre du script.
 * La Bête n'y figure pas : elle EMBUSQUE la première route vers le Chemin
 * Creux (mécanique existante du 7/08), c'est le pic n°1. Les segments
 * au-delà du Puits (la nuit au crochetage, la Meute garantie, la Falaise
 * aux Cordes) sont des déroutages dans `Scene.tsx`, pas des destinations.
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
 * Climax). JAMAIS nommée à l'écran : elle pilote le resserrement des marches
 * et les RETOURS garantis (« pendant l'Ouverture je provoque le monde ;
 * pendant la Pression, le monde commence à me répondre »).
 *
 * Dérivée de l'état de la traversée, jamais persistée :
 *  - accroche  : la Borne (rien encore visité au-delà) ;
 *  - ouverture : la lande, avant l'entrée au village ;
 *  - pression  : le village (Serment → nuit → Puits) ;
 *  - climax    : ressorti du village (la Meute, la Falaise).
 *
 * ⚠️ La machinerie des RETOURS est une CATÉGORIE, pas un événement (verrou
 * n°2 de Patrick) : en Pression/Climax, au moins une chose PLANTÉE plus tôt
 * revient — la première run câble la Bête (si fuie) et la Meute comme cas
 * d'école, le jeu complet choisit parmi ce que la vie a réellement planté.
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
