/**
 * LE GRAND REGISTRE — les cent places (journal Notion 26/07, §1).
 *
 * « Douze mille avant toi ont poussé cette porte. Cent tiennent encore dans ce
 * livre. » Le Registre est un classement par jours de survie, tous héros de
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
 * LA PREMIÈRE PLACE est verrouillée (§1) : nom illisible, jours au-delà de
 * onze mille, et le compte AUGMENTE entre les sessions. Aucune explication,
 * jamais — c'est le seul endroit du jeu qui laisse deviner ce qu'est vraiment
 * le Geôlier.
 */

import type { PlayerMemory } from "@/lib/player-memory";

export type RegistreEntry = {
  rank: number;
  name: string;
  days: number;
  cause: string;
  /** Ligne du joueur (héros tombé ou run en cours) → liseré orange. */
  isPlayer?: boolean;
  /** La première place : traitement spécial, jamais prenable. */
  locked?: boolean;
  /** Run encore en cours — le Registre l'affiche déjà, sans la figer. */
  running?: boolean;
};

/** Les jours du premier, au 26/07/2026. Le compte ne redescend jamais. */
const PREMIER_BASE = 11_248;
const PREMIER_EPOCH = Date.UTC(2026, 6, 26);
/** Un jour de plus tous les trois jours réels : lent, mais visible d'un mois
    sur l'autre — « et le compte continue » doit être vérifiable. */
const PREMIER_PAS_MS = 3 * 24 * 3600 * 1000;

export function joursDuPremier(now = Date.now()): number {
  const ecoule = Math.max(0, now - PREMIER_EPOCH);
  return PREMIER_BASE + Math.floor(ecoule / PREMIER_PAS_MS);
}

/** Le fond du livre, écrit à la main : ce sont eux qu'on lit vraiment. */
const FOND: [string, number, string][] = [
  ["Anselme le Patient", 41, "n'est pas mort — a disparu"],
  ["Brigga aux Deux Lames", 39, "le pont d'os, au retour"],
  ["Vespre", 37, "tombée au Seuil, la Porte en vue"],
  ["L'Onzième", 36, "brûlée dans les fosses"],
  ["Sévrin", 34, "a compté un crâne de trop"],
  ["Harn", 33, "rendu à la Marge"],
  ["La Veuve Koll", 31, "n'a pas rendu ce qu'elle avait pris"],
  ["Otho", 30, "la porte blanche, de l'intérieur"],
  ["Maerith", 28, "l'écho a gardé son nom"],
  ["Dorn le Sourd", 27, "n'a pas entendu la meute"],
  ["Sanne", 26, "a juré, puis a menti"],
  ["Le Tardif", 25, "compté par l'Ossuaire"],
  ["Ysolde", 24, "un 1, au pire moment"],
  ["Corvin", 23, "la main morte s'est refermée"],
  ["Guenne", 22, "s'est retournée dans le Chemin Creux"],
  ["Vael", 21, "l'anneau était un appât"],
  ["Ombric", 20, "fixé au Champ, poteau gravé la veille"],
  ["La Petite Aude", 19, "a bu à la Mare"],
  ["Rhodan", 18, "le Bailli a lu son nom deux fois"],
  ["Sombre-Ivrig", 17, "n'a jamais atteint la Palissade"],
  ["Fenne", 16, "a ouvert au Chien"],
  ["Le Boiteux d'Orre", 15, "la Meute Grise, à découvert"],
  ["Tassin", 14, "pendu mal fixé, deux fois"],
  ["Ilva", 13, "a regardé son reflet trop longtemps"],
  ["Grelot", 12, "a rendu le grelot au charretier"],
  ["Marne", 11, "les Mains du Puits l'ont eue au troisième battement"],
  ["Le Muet de Kern", 10, "n'a pas pu jurer"],
  ["Sizelle", 9, "a suivi la Fille jusqu'au moulin"],
  ["Barde-sans-Corde", 8, "la Chapelle avait déjà son nœud"],
  ["Ormel", 7, "s'est assis à la chaire"],
  ["Nive", 6, "a mangé un fruit de cendre"],
  ["Le Dernier Kaleb", 5, "a franchi la Descente sans rien savoir"],
  ["Toque", 4, "a frappé le premier"],
  ["Wenn", 3, "a compté les corbeaux"],
  ["Suie", 2, "prise par les Geôles"],
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
  "s'est arrêté pour regarder",
  "a franchi le portillon la nuit",
  "a refusé la halte",
  "le Hameau l'a jugé, et l'a eu",
  "n'a pas su reculer",
  "a touché la corde",
  "a compté juste — c'était le problème",
  "a rendu l'écharde",
  "a suivi ce qui marchait au-dessus du talus",
];

/**
 * Le classement complet. `playerDays` = la run en cours (0 si aucune) ;
 * `playerName` la nomme. Les rangs sont attribués en compétition : à jours
 * égaux, même rang — c'est ce que montre la maquette (deux fois « 2 »).
 */
export function buildLesCent(
  mem: PlayerMemory,
  playerName: string,
  playerDays: number,
  now = Date.now()
): RegistreEntry[] {
  const brut: Omit<RegistreEntry, "rank">[] = [
    ...FOND.map(([name, days, cause]) => ({ name, days, cause })),
    ...mem.fallen.map((f) => ({
      name: f.name,
      days: f.days,
      cause: f.cause,
      isPlayer: true,
    })),
  ];
  // Une run en cours figure au livre sans y être encore inscrite.
  if (playerDays > 0) {
    brut.push({
      name: playerName,
      days: playerDays,
      cause: "— en cours —",
      isPlayer: true,
      running: true,
    });
  }
  // Remplissage jusqu'aux 99 places prenables. La réserve tient le BAS du
  // livre : une courbe quadratique concentre les anonymes sur les premiers
  // jours (la plupart meurent tout de suite), au lieu de les étaler
  // uniformément — sinon quarante inconnus à dix-neuf jours enterrent le
  // joueur sous des noms qui ne racontent rien.
  const manque = Math.max(0, 99 - brut.length);
  for (let i = 0; i < manque; i++) {
    const t = manque > 1 ? i / (manque - 1) : 1;
    brut.push({
      name: NOMS_RESERVE[i % NOMS_RESERVE.length],
      days: Math.max(1, Math.round(12 * (1 - t) ** 2)),
      cause: CAUSES_RESERVE[i % CAUSES_RESERVE.length],
    });
  }
  brut.sort((a, b) => b.days - a.days || a.name.localeCompare(b.name));

  const out: RegistreEntry[] = [
    {
      rank: 1,
      // Le nom est rendu ILLISIBLE à l'affichage (semis de pixels) : ce
      // libellé n'est là que pour les lecteurs d'écran et le débogage.
      name: "———",
      days: joursDuPremier(now),
      cause: "jours, et le compte continue",
      locked: true,
    },
  ];
  let rang = 1;
  let joursPrec = Infinity;
  brut.forEach((r, i) => {
    if (r.days !== joursPrec) {
      rang = i + 2; // +1 pour la place verrouillée, +1 pour passer en base 1
      joursPrec = r.days;
    }
    out.push({ ...r, rank: rang });
  });
  return out;
}

/** L'onglet « Tes morts » : les héros DU JOUEUR, classés ou non. */
export type MortJoueur = {
  name: string;
  days: number;
  cause: string;
  /** Relique forgée de cette mort, si elle a été retrouvée. */
  relic?: string;
};

export function mesMorts(mem: PlayerMemory): MortJoueur[] {
  return mem.fallen.map((f) => ({
    name: f.name,
    days: f.days,
    cause: f.cause,
    // Une relique est forgée à chaque mort : on la retrouve par le nom du
    // héros et son nombre de jours (couple stable, posé par recordDeath).
    relic: mem.relics.find((r) => r.heroName === f.name && r.days === f.days)?.name,
  }));
}
