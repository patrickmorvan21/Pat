/**
 * LE GRAND REGISTRE — les cent places (journal Notion 26/07, §1).
 *
 * « Douze mille avant toi ont poussé cette porte. Cent tiennent encore dans ce
 * livre. » Le Registre est un classement par LIEUX FRANCHIS, tous héros de
 * tous les joueurs confondus.
 *
 * ⚠️ Il n'y a PAS encore d'endpoint agrégé (même besoin d'infra que « le
 * fantôme de passage »). Le classement est donc composé LOCALEMENT : un fond
 * de héros écrits à la main, complété par une réserve de noms/causes assemblée
 * de façon déterministe pour atteindre les cent places, puis les héros tombés
 * DU JOUEUR et sa run en cours, insérés à leur vrai rang. Rien ici n'est
 * aléatoire d'une session à l'autre : le fond doit être le même livre à chaque
 * ouverture, sinon il ne ressemble plus à un registre.
 *
 * LA PREMIÈRE PLACE est verrouillée (§1) : nom illisible, et depuis le 04/09
 * AUCUN NOMBRE — elle est hors mesure. Aucune explication, jamais : c'est le
 * seul endroit du jeu qui laisse deviner ce qu'est vraiment le Geôlier.
 */

import { destinDepuisCause, type Destin, type PlayerMemory } from "@/lib/player-memory";

export type RegistreEntry = {
  rank: number;
  name: string;
  /** LIEUX FRANCHIS — l'unite du classement (04/09). La ligne verrouillee
      n'en a pas : elle est hors mesure. */
  franchis?: number;
  cause: string;
  /** Ligne du joueur (héros tombé ou run en cours) → liseré orange. */
  isPlayer?: boolean;
  /**
   * LE DESTIN DE CE HÉROS. Les Cent classent par lieux franchis, donc un
   * survivant y a toute sa place — mais il doit s'y lire comme un survivant,
   * pas comme un mort de plus (verdict des panels, 14/08).
   */
  destin?: Destin;
  /** La première place : traitement spécial, jamais prenable. */
  locked?: boolean;
  /** Run encore en cours — le Registre l'affiche déjà, sans la figer. */
  running?: boolean;
};

/**
 * LA PREMIÈRE PLACE N'A PLUS DE NOMBRE (04/09).
 *
 * Elle portait « 11 248 jours, et le compte continue ». Un nombre à quatre
 * chiffres laisse croire qu'il existe un système capable d'en produire des
 * milliers : le joueur se met à viser 11 249, et on recrée l'écart d'échelle
 * qu'on vient de supprimer. Hors mesure est plus inquiétant qu'énorme, et ça
 * pose la vraie question : qui a vécu assez pour que le livre renonce à
 * compter ?
 */
export const PREMIER_VALEUR = "INCOMPTABLE";
const PREMIER_CAUSE = "celui-là, je ne le compte plus";

/**
 * Le fond du livre, écrit à la main : ce sont eux qu'on lit vraiment.
 *
 * ⚠️ REBASÉ LE 04/09 SUR CE QUE LE JEU PRODUIT. Il courait de 41 à 1 quand
 * l'unité était le jour, alors qu'une vie n'en produit que 1 à 6 : le joueur
 * qui traversait entier atterrissait au bas d'un tableau dont le haut était
 * inatteignable. En lieux franchis, une traversée complète en vaut 8 ou 9 —
 * le fond culmine donc à 14 (des héros allés au-delà de ce qui est bâti
 * aujourd'hui) et une belle vie se lit dans les dix premières places.
 * À rebaser quand les actes suivants existeront.
 */
const FOND: [string, number, string][] = [
  ["Anselme le Patient", 14, "n'est pas mort — a disparu"],
  ["Brigga aux Deux Lames", 12, "le pont d'os, au retour"],
  ["Vespre", 11, "tombée au Seuil, la Porte en vue"],
  ["L'Onzième", 10, "brûlée dans les fosses"],
  ["Sévrin", 9, "a compté un crâne de trop"],
  ["Harn", 9, "rendu à la Marge"],
  ["La Veuve Koll", 8, "n'a pas rendu ce qu'elle avait pris"],
  ["Otho", 8, "la porte blanche, de l'intérieur"],
  ["Maerith", 7, "l'écho a gardé son nom"],
  ["Dorn le Sourd", 7, "n'a pas entendu la meute"],
  ["Sanne", 7, "a juré, puis a menti"],
  ["Le Tardif", 6, "compté par l'Ossuaire"],
  ["Ysolde", 6, "un 1, au pire moment"],
  ["Corvin", 6, "la main morte s'est refermée"],
  ["Guenne", 6, "s'est retournée dans le Chemin Creux"],
  ["Vael", 5, "l'anneau était un appât"],
  ["Ombric", 5, "fixé au Champ, poteau gravé la veille"],
  ["La Petite Aude", 5, "a bu à la Mare"],
  ["Rhodan", 5, "le Bailli a lu son nom deux fois"],
  ["Sombre-Ivrig", 4, "n'a jamais atteint la Palissade"],
  ["Fenne", 4, "a ouvert au Chien"],
  ["Le Boiteux d'Orre", 4, "la Meute Grise, à découvert"],
  ["Tassin", 4, "pendu mal fixé, deux fois"],
  ["Ilva", 3, "a regardé son reflet trop longtemps"],
  ["Grelot", 3, "a rendu le grelot au charretier"],
  ["Marne", 3, "les Mains du Puits l'ont eue au troisième battement"],
  ["Le Muet de Kern", 3, "n'a pas pu jurer"],
  ["Sizelle", 2, "a suivi la Fille jusqu'au moulin"],
  ["Barde-sans-Corde", 2, "la Chapelle avait déjà son nœud"],
  ["Ormel", 2, "s'est assis à la chaire"],
  ["Nive", 2, "a mangé un fruit de cendre"],
  ["Le Dernier Kaleb", 2, "a franchi la Descente sans rien savoir"],
  ["Toque", 1, "a frappé le premier"],
  ["Wenn", 1, "a compté les corbeaux"],
  ["Suie", 1, "prise par les Geôles"],
  ["Le Premier Jour d'Iven", 1, "n'a pas passé la Borne"],
];


/**
 * La réserve : de quoi remplir les cent places sans écrire cent lignes à la
 * main. Assemblage DÉTERMINISTE (index, jamais Math.random) — deux ouvertures
 * du Registre donnent exactement le même livre.
 */
const NOMS_RESERVE = [
  "Baldre", "Cendre-Vive", "Orin", "La Sourde Halle", "Petrek", "Yanne",
  "Le Gué", "Mira sans Nom", "Tovic", "Erle", "Le Chaufournier", "Nesse",
  "Aldric le Court", "Vonne", "Kestrel", "La Fille de Sarre", "Obre",
  "Le Tanneur", "Ivane", "Merlot", "Sacq", "La Grise", "Pernel", "Duhaut",
  "Iselle", "Le Cadet Vraie", "Onne", "Barthe", "Lys", "Corbeau-Deux",
  "Le Semeur", "Alène", "Fosse", "Kervi", "La Muette d'Orne", "Tibaut",
  "Rence", "Le Compté", "Nol", "Vesper le Jeune", "Sarme", "L'Aîné Doux",
  "Hesse", "Le Marcheur Lent", "Cotte", "Amarine", "Le Veilleur Gris",
  "Prune", "Torve", "Ferre", "L'Étranglée", "Wast", "Marge", "Ombe",
  "Le Sonneur", "Aube-Fausse", "Denne", "Roche", "Le Gamin des Murets",
  "Silve", "Anthe", "Le Mal Compté", "Vraie", "Orle",
];

const CAUSES_RESERVE = [
  "n'a pas juré assez vite",
  "a laissé une trace au mauvais endroit",
  "a dit un nom à la plume",
  "a voulu regarder de trop près",
  "a franchi le portillon la nuit",
  "a refusé la halte",
  "jugement du Hameau, sentence du Hameau",
  "n'a pas su reculer",
  "a touché la corde",
  "a compté juste — c'était le problème",
  "a rendu l'écharde",
  "a suivi ce qui marchait au-dessus du talus",
];

/**
 * Le classement complet. `playerFranchis` = la run en cours (0 si aucune) ;
 * `playerName` la nomme. Les rangs sont attribués en compétition : à score
 * égal, même rang — c'est ce que montre la maquette (deux fois « 2 »).
 */
export function buildLesCent(
  mem: PlayerMemory,
  playerName: string,
  playerFranchis: number
): RegistreEntry[] {
  const brut: Omit<RegistreEntry, "rank">[] = [
    ...FOND.map(([name, franchis, cause]) => ({ name, franchis, cause })),
    ...mem.fallen.map((f) => ({
      name: f.name,
      // ⚠️ Les héros tombés AVANT le 04/09 n'ont que leurs jours. Il n'existe
      // pas de conversion honnête vers les lieux franchis : on lit la valeur
      // qu'ils portent — les ordres de grandeur sont voisins, et ce sont des
      // lignes d'archive, pas un classement à rejouer.
      franchis: f.franchis ?? f.days,
      cause: f.cause,
      isPlayer: true,
      destin: f.destin ?? destinDepuisCause(f.cause),
    })),
  ];
  // Une run en cours figure au livre sans y être encore inscrite.
  if (playerFranchis > 0) {
    brut.push({
      name: playerName,
      franchis: playerFranchis,
      cause: "— en cours —",
      isPlayer: true,
      running: true,
    });
  }
  // Remplissage jusqu'aux 99 places prenables. La réserve tient le BAS du
  // livre : une courbe quadratique concentre les anonymes sur les premiers
  // lieux (la plupart meurent tout de suite), au lieu de les étaler
  // uniformément — sinon quarante inconnus au même score enterrent le
  // joueur sous des noms qui ne racontent rien.
  const manque = Math.max(0, 99 - brut.length);
  for (let i = 0; i < manque; i++) {
    const t = manque > 1 ? i / (manque - 1) : 1;
    brut.push({
      name: NOMS_RESERVE[i % NOMS_RESERVE.length],
      franchis: Math.max(1, Math.round(4 * (1 - t) ** 2)),
      cause: CAUSES_RESERVE[i % CAUSES_RESERVE.length],
    });
  }
  brut.sort((a, b) => (b.franchis ?? 0) - (a.franchis ?? 0) || a.name.localeCompare(b.name));

  const out: RegistreEntry[] = [
    {
      rank: 1,
      // Le nom est rendu ILLISIBLE à l'affichage (semis de pixels) : ce
      // libellé n'est là que pour les lecteurs d'écran et le débogage.
      name: "———",
      cause: PREMIER_CAUSE,
      locked: true,
    },
  ];
  let rang = 1;
  let prec = Infinity;
  brut.forEach((r, i) => {
    if (r.franchis !== prec) {
      rang = i + 2; // +1 pour la place verrouillée, +1 pour passer en base 1
      prec = r.franchis ?? 0;
    }
    out.push({ ...r, rank: rang });
  });
  return out;
}

/** L'onglet « Tes morts » : les héros DU JOUEUR, classés ou non. */
export type MortJoueur = {
  name: string;
  /** Jours — conservés pour retrouver la relique (couple nom+jours). */
  days: number;
  /** Lieux franchis : l'unité du classement (04/09). */
  franchis: number;
  cause: string;
  /** Relique forgée de cette mort, si elle a été retrouvée. */
  relic?: string;
};

/**
 * L'onglet « TES MORTS » est un CIMETIÈRE : il ne contient que des morts.
 *
 * ⚠️ Il listait tout `fallen`, où les trois destins se mélangent — une
 * traversée réussie s'y affichait donc avec « a franchi la Descente » en
 * guise de cause de décès. C'est la contradiction la plus directe avec la
 * promesse centrale du jeu : on y lisait sa victoire comme une défaite.
 * Les survivants et les renonçants restent dans LES 100, où ils sont
 * classés par lieux franchis et marqués par leur destin.
 */
export function mesMorts(mem: PlayerMemory): MortJoueur[] {
  return mem.fallen
    .filter((f) => (f.destin ?? destinDepuisCause(f.cause)) === "mort")
    .map((f) => ({
    name: f.name,
    days: f.days,
    franchis: f.franchis ?? f.days,
    cause: f.cause,
    // Une relique est forgée à chaque mort : on la retrouve par le nom du
    // héros et son nombre de jours (couple stable, posé par recordDeath).
    relic: mem.relics.find((r) => r.heroName === f.name && r.days === f.days)?.name,
  }));
}
