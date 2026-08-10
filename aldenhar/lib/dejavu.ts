/**
 * LE DÉJÀ-VU À TROIS PORTÉES — un registre unique, jamais un booléen par nœud.
 *
 * Le panel du 9/08 a mesuré que la deuxième vie est à ~60 % de relecture
 * verbatim : le monde ne fait aucune différence entre « tu vois ça pour la
 * première fois » et « tu as déjà usé trois corps ici ». La réponse n'est pas
 * un drapeau `vu` de plus — le jeu en compte déjà une douzaine, éparpillés
 * (`poiSeen`, `reactionsVues`, `liaisonVues`, `intrusesVues`, `temoinsCites`,
 * `echosObjet`, `jailerVues`, `dropsServis`, `faitsVus`…). C'est un COMPTEUR
 * unique, adressé par une clé et une portée.
 *
 * Pourquoi un compte et pas un booléen (amendement explicite du panel) : un
 * booléen ne sait dire que « déjà vu ». Un compte laisse le texte dire « la
 * deuxième fois », « la cinquième » — c'est-à-dire écrire la différence au
 * lieu de la signaler.
 *
 * Les trois portées :
 *   • `ecran`  — l'écran courant. Vidé à chaque changement d'écran. Sert à ne
 *                pas empiler deux fois la même injection dans un seul cycle
 *                (deux entrées de table qui pointent le même sujet).
 *   • `run`    — la vie courante. Meurt avec le héros (`RunState.vus`).
 *   • `compte` — toutes les vies (`PlayerMemory.vus`). C'est la portée qui
 *                porte le déjà-vu réel : le héros ne se souvient de rien, le
 *                MONDE se souvient de lui.
 *
 * ⚠️ Règle d'usage : la portée `compte` ne met JAMAIS de souvenir dans la tête
 * du héros courant (il vient de naître). Elle autorise seulement le décor et
 * les gens à porter une trace. Même discipline que les découvertes (6/08).
 *
 * ⚠️ Dette assumée : les registres ad hoc listés plus haut sont ANTÉRIEURS à
 * ce module et n'y sont pas migrés — une migration en bloc réécrirait la
 * lecture de sauvegardes existantes sans rien apporter au joueur. Règle pour
 * la suite : tout nouveau besoin de « déjà vu » passe par ici, et un registre
 * ad hoc qu'on retouche pour une autre raison en profite pour migrer.
 */

/** Portée d'un compteur de déjà-vu. */
export type Portee = "ecran" | "run" | "compte";

/** Compteurs de la portée `ecran` — volatils par construction. */
let ecran: Record<string, number> = {};

/** À appeler à chaque changement d'écran : la portée la plus courte se vide. */
export function viderEcran(): void {
  ecran = {};
}

/** Combien de fois cette clé a déjà été servie dans la portée `ecran`. */
export function vuEcran(cle: string): number {
  return ecran[cle] ?? 0;
}

/** Note un passage dans la portée `ecran` et rend le compte AVANT incrément. */
export function noterEcran(cle: string): number {
  const avant = ecran[cle] ?? 0;
  ecran[cle] = avant + 1;
  return avant;
}

/**
 * Lecture pure d'un registre persistant (`RunState.vus` ou
 * `PlayerMemory.vus`). Les deux portées longues sont stockées là où vit déjà
 * leur cycle de vie — la run meurt avec le héros, le compte survit — plutôt
 * que dans un troisième store qu'il faudrait purger à la main.
 */
export function vu(registre: Record<string, number> | undefined, cle: string): number {
  return registre?.[cle] ?? 0;
}

/** Rend un registre incrémenté d'une unité sur `cle` (jamais de mutation). */
export function noter(
  registre: Record<string, number> | undefined,
  cle: string
): Record<string, number> {
  const r = registre ?? {};
  return { ...r, [cle]: (r[cle] ?? 0) + 1 };
}
