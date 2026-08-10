/**
 * LES BESOINS ET LE DIRECTEUR DE ROUTES (spec 4/08, §3).
 *
 * Le vrai changement : « Aujourd'hui le joueur traverse les lieux TIRÉS AU
 * SORT. Avec les besoins, il traverse les lieux DONT IL A BESOIN. Deux
 * traversées diffèrent parce que deux corps diffèrent. » C'est de la
 * rejouabilité produite par le système, pas par le volume de contenu.
 *
 * ⚠️ LES QUATRE GARDE-FOUS, tous tenus ici :
 *  1. AUCUNE JAUGE, AUCUN COMPTEUR. Un besoin ne se manifeste QUE par
 *     l'apparition d'un état — rien à l'écran ne le compte.
 *  2. LENT. Les besoins se comptent en JOURS, jamais en scènes. Un joueur qui
 *     traverse vite n'aura presque jamais faim : le besoin punit la lenteur,
 *     ce qui est un arbitrage intéressant.
 *     ⚠️ PRÉCISION DU 10/08 — le « jour » compté ici est `RunState.horloge`,
 *     PAS `RunState.day`. Les deux se sont séparés le jour où le Jour est
 *     devenu le SCORE du Registre (il n'avance qu'aux lieux où l'on a tenté
 *     quelque chose). Les indexer sur le score aurait dispensé de faim le
 *     joueur qui ne risque rien — et affamé plus tôt celui qui s'engage,
 *     l'exact inverse de l'intention. L'horloge du corps avance tous les
 *     trois lieux TRAVERSÉS et à chaque nuit : elle mesure la marche, ce que
 *     ce garde-fou a toujours voulu dire.
 *  3. UN BESOIN NE TUE JAMAIS. « Affamé » ne fait pas mourir de faim : il rend
 *     tout le reste plus dur. La mort ne vient que de la fiction (pilier).
 *  4. TOUJOURS AU MOINS DEUX SOLUTIONS, DONT UNE MAUVAISE.
 *
 * Aucun lieu nouveau n'est nécessaire : la spec insiste, il faut rendre
 * NÉCESSAIRES ceux qui existent déjà.
 */

export type BesoinId = "dormir" | "soigner" | "manger" | "boire" | "laver";

export type Besoin = {
  id: BesoinId;
  /** L'état posé quand le besoin n'est plus tenable. */
  etat: string;
  /**
   * Au bout de combien de JOURS sans y répondre l'état tombe. Jamais affiché.
   * ⚠️ En jours, pas en scènes — garde-fou n°2.
   */
  jours: number;
  /** Les lieux de la zone qui y répondent. Le directeur de routes s'en sert. */
  remedes: string[];
  /**
   * Les deux faces du dilemme, pour l'écriture des Croisées : la bonne route
   * est longue, la mauvaise est proche. Le système garantit un DILEMME, pas un
   * sauvetage.
   */
  routeSure: string;
  routeRisquee: string;
};

/**
 * Les affordances existent déjà dans les Landes — table de la spec §3,
 * traduite en ids de scènes réels de `lib/scene-data.ts`.
 */
export const BESOINS: Besoin[] = [
  {
    id: "soigner",
    etat: "fievreux",
    jours: 2,
    // Rebouteux (marche-muet), Veuve aux Cordes (chapelle), objets de Besace.
    remedes: ["marche-muet", "chapelle-des-cordes"],
    routeSure: "marche-muet",
    routeRisquee: "puits-condamne",
  },
  {
    id: "dormir",
    etat: "boiteux",
    jours: 3,
    // Moulin sans Ailes (campement) · Halte du Hameau.
    remedes: ["campement", "serment-hameau"],
    routeSure: "campement",
    routeRisquee: "chemin-creux",
  },
  {
    id: "manger",
    etat: "affame",
    jours: 3,
    // Marché Muet · Colporteur · fruits de cendre du Verger (pari).
    remedes: ["marche-muet", "verger-noir"],
    routeSure: "marche-muet",
    routeRisquee: "verger-noir",
  },
];

const PAR_ETAT = new Map(BESOINS.map((b) => [b.etat, b]));
const PAR_ID = new Map(BESOINS.map((b) => [b.id, b]));

export function besoin(id: BesoinId): Besoin | null {
  return PAR_ID.get(id) ?? null;
}

/** Le besoin dont cet état est le symptôme — sert au directeur de routes. */
export function besoinDeLEtat(etatId: string): Besoin | null {
  return PAR_ETAT.get(etatId) ?? null;
}

/**
 * Les besoins ARRIVÉS À ÉCHÉANCE : `jours` écoulés depuis la dernière fois
 * qu'on y a répondu (ou depuis le début de la run). Renvoie les états à poser.
 *
 * `derniereFois` : id de besoin → numéro de jour de la dernière réponse.
 * Les besoins dont l'état est DÉJÀ actif ne re-tombent pas : un état ne
 * s'empile pas sur lui-même.
 */
export function besoinsEchus(
  jour: number,
  derniereFois: Record<string, number>,
  etatsActifs: string[]
): Besoin[] {
  return BESOINS.filter((b) => {
    if (etatsActifs.includes(b.etat)) return false;
    const depuis = jour - (derniereFois[b.id] ?? 0);
    return depuis >= b.jours;
  });
}

/**
 * LE DIRECTEUR DE ROUTES — indispensable, dit la spec, et elle a raison :
 * « Un héros fiévreux à qui le tirage ne propose jamais le Rebouteux ne vit pas
 * un dilemme : il subit une punition procédurale. »
 *
 * RÈGLE : lorsqu'un besoin actif possède un remède dans la zone, au moins une
 * solution appropriée doit devenir accessible dans les DEUX prochaines
 * Croisées. Renvoie la destination à FORCER dans la paire offerte, ou null.
 *
 * ⚠️ Ce n'est pas un sauvetage : on force la route SÛRE dans un slot, l'autre
 * slot reste au tirage — et le lieu forcé peut être loin, exposé, ou coûter un
 * jour de plus. Le joueur garde le choix de ne pas y aller.
 */
export function routeAForcer(
  etatsActifs: string[],
  visites: string[],
  croiseesDepuis: number
): string | null {
  if (croiseesDepuis < 1) return null; // on laisse UNE croisée respirer
  for (const id of etatsActifs) {
    const b = PAR_ETAT.get(id);
    if (!b) continue;
    const dispo = b.remedes.filter((r) => !visites.includes(r));
    if (dispo.length) return dispo[0];
    // Tous les remèdes déjà visités : on ne force rien, le joueur a eu ses
    // occasions. Le forcer en boucle transformerait le dilemme en couloir.
  }
  return null;
}
