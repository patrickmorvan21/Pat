/**
 * Mémoire du joueur — historique persistant attaché au COMPTE, distinct de la
 * run en cours (`lib/state.ts`) et des Reliques (spec §17/§19, session 2 & 4).
 *
 * Le Notion recommande explicitement de centraliser ici tout ce qui doit
 * survivre à la mort du héros — pour éviter des flags épars dupliqués entre
 * les systèmes qui partagent la même infrastructure :
 *
 * (Le type RegistreRow vit dans state.ts avec les autres entrées de fil.)
 *   - Saisons du Geôlier (§17) : le ton dérive selon l'historique agrégé.
 *   - Persistance environnementale (§17) : une porte défoncée reste défoncée.
 *   - Prix différé / Pacte à la marge (§17/§19) : dettes narratives silencieuses.
 *   - Dette de sang entre héros (§19) : un tueur nommé peut réapparaître.
 *   - Le Grand Registre (§19) : les héros tombés du joueur s'y inscrivent.
 *
 * Rien ici n'est jamais affiché en chiffre au joueur — ce sont des seuils qui
 * modulent le ton et le décor, jamais un score exposé (piliers du projet).
 */

import type { RegistreRow } from "@/lib/state";

/** Un tueur nommé garde une trace liée au compte, pas au héros mort (§19). */
export type BloodDebt = {
  /** Identifiant stable de l'entité (ex. "geryon", "meute-limiers"). */
  entity: string;
  /** Nom affiché de l'entité pour la ligne de reconnaissance. */
  label: string;
  /** Nom du héros tombé de sa main. */
  heroName: string;
  /** Index de run où la dette a été contractée. */
  runIndex: number;
};

/** Un héros tombé, pour Le Grand Registre (§19) et Le retour (§16). */
export type FallenHero = {
  name: string;
  days: number;
  cause: string;
  /** Lieu de mort (id de scène) — sert à « Le retour » (recroiser le cadavre). */
  place: string;
};

/** Relique forgée à la mort (spec §10 + séquence d'écran de mort 13/07). */
export type Relic = {
  name: string;
  rarity: "commune" | "rare" | "legendaire";
  heroName: string;
  days: number;
};

export type PlayerMemory = {
  /** Nombre de runs commencées (incrémenté au tout premier pas d'une run neuve). */
  runsStarted: number;
  /** Nombre de morts enregistrées. */
  deaths: number;
  /** Plus grand « Jour X » atteint, toutes runs confondues. */
  bestDays: number;
  /** Somme des jours survécus (pour la moyenne, sans stocker chaque run). */
  totalDays: number;
  /** Reliques rares/légendaires obtenues (les communes ne comptent pas pour le ton). */
  relicsRare: number;
  /** Toutes les reliques forgées, dans l'ordre des morts. */
  relics: Relic[];
  /** Éléments d'environnement modifiés durablement : "porte-balafree-defoncee", etc. */
  envFlags: Record<string, boolean>;
  /** Rivalités personnelles qui traversent les runs (§19). */
  bloodDebts: BloodDebt[];
  /** Héros tombés du joueur, les plus récents en tête. */
  fallen: FallenHero[];
};

const KEY = "aldenhar-player";

function fresh(): PlayerMemory {
  return {
    runsStarted: 0,
    deaths: 0,
    bestDays: 0,
    totalDays: 0,
    relicsRare: 0,
    relics: [],
    envFlags: {},
    bloodDebts: [],
    fallen: [],
  };
}

export function loadMemory(): PlayerMemory {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<PlayerMemory>;
        return {
          runsStarted: typeof p.runsStarted === "number" ? p.runsStarted : 0,
          deaths: typeof p.deaths === "number" ? p.deaths : 0,
          bestDays: typeof p.bestDays === "number" ? p.bestDays : 0,
          totalDays: typeof p.totalDays === "number" ? p.totalDays : 0,
          relicsRare: typeof p.relicsRare === "number" ? p.relicsRare : 0,
          relics: Array.isArray(p.relics) ? p.relics : [],
          envFlags: p.envFlags && typeof p.envFlags === "object" ? p.envFlags : {},
          bloodDebts: Array.isArray(p.bloodDebts) ? p.bloodDebts : [],
          fallen: Array.isArray(p.fallen) ? p.fallen : [],
        };
      }
    } catch {
      // stockage indisponible/corrompu → mémoire neuve, jamais bloquant
    }
  }
  return fresh();
}

export function saveMemory(mem: PlayerMemory): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(mem));
  } catch {
    // quota plein / navigation privée : on continue en mémoire
  }
}

/** Applique une mutation puis persiste — le pont commode côté composant. */
export function mutateMemory(mutate: (mem: PlayerMemory) => void): PlayerMemory {
  const mem = loadMemory();
  mutate(mem);
  saveMemory(mem);
  return mem;
}

/**
 * Les saisons du Geôlier (§17) : trois postures discrètes, jamais un score.
 * Plus le joueur meurt vite et souvent, plus le Geôlier est blasé/moqueur ;
 * plus il survit longtemps / accumule des reliques rares, plus il devient
 * intrigué puis respectueux. Se ressent uniquement au choix des répliques.
 */
export type JailerPosture = "amuse" | "interesse" | "respectueux";

export function jailerPosture(mem: PlayerMemory): JailerPosture {
  const avg = mem.runsStarted > 0 ? mem.totalDays / mem.runsStarted : 0;
  if (mem.relicsRare >= 3 || mem.bestDays >= 21 || avg >= 12) return "respectueux";
  if (mem.bestDays >= 10 || avg >= 6 || mem.runsStarted >= 5) return "interesse";
  return "amuse";
}

/** Une dette de sang correspondant à cette entité existe-t-elle ? (§19) */
export function bloodDebtFor(mem: PlayerMemory, entity: string): BloodDebt | undefined {
  return mem.bloodDebts.find((d) => d.entity === entity);
}

/**
 * Courbe d'entrée invisible (spec 21/07, « à appliquer DÈS MAINTENANT ») :
 * les seuils sont légèrement adoucis durant les 2-3 premières morts du joueur,
 * puis l'aide s'estompe. Renvoie de combien ABAISSER le seuil d'un jet (0 =
 * plus d'aide). AUCUN affichage : le joueur sent juste que le jeu lui a laissé
 * le temps d'apprendre. Se lit sur `mem.deaths` (compteur central).
 */
export function entrySoftening(mem: PlayerMemory): number {
  const d = mem.deaths;
  if (d >= 3) return 0; // le joueur a appris — plus aucun coup de pouce
  return [2, 1, 1][d] ?? 0; // 1re run : −2 · après 1re mort : −1 · après 2e : −1
}

/**
 * Forge d'une Relique à la mort (spec §10) : commune / rare / légendaire.
 * Le nom vient d'un petit pool par rareté — contenu de proto, à enrichir.
 */
const RELIC_NAMES: Record<Relic["rarity"], string[]> = {
  commune: ["Éclat de dé fêlé", "Anneau de suie", "Mèche de torche éteinte", "Clou du pont d'os"],
  rare: ["Œil de lanterne verte", "Vertèbre gravée", "Sablier sans sable"],
  legendaire: ["Dent du décompte", "Nom que l'écho a gardé"],
};

export function forgeRelic(heroName: string, days: number, floorRare = false): Relic {
  const roll = Math.random();
  // Jalon de première fois (spec 21/07) : la toute première mort donne un
  // « fragment fort » — jamais une relique commune, pour que la première perte
  // marque et récompense au-delà de l'ordinaire.
  const rarity: Relic["rarity"] = floorRare
    ? roll < 0.75
      ? "rare"
      : "legendaire"
    : roll < 0.7
      ? "commune"
      : roll < 0.95
        ? "rare"
        : "legendaire";
  const pool = RELIC_NAMES[rarity];
  return { name: pool[Math.floor(Math.random() * pool.length)], rarity, heroName, days };
}

/**
 * Enregistrement complet d'une mort (séquence 13/07) : héros au Registre,
 * relique forgée, dette de sang si un adversaire nommé a porté le coup.
 * Appelé AU MOMENT de la mort (pas à l'acceptation) : fermer l'app pendant
 * l'écran de mort ne doit jamais ressusciter la run (§9 inversé — la mort
 * fictionnelle, elle, est définitive).
 */
export function recordDeath(args: {
  heroName: string;
  days: number;
  cause: string;
  place: string;
  killer?: { entity: string; label: string };
}): Relic {
  // Première mort du compte (jalon 21/07) : relique garantie rare+ (« fragment
  // fort »). Lu AVANT l'incrément de `deaths` ci-dessous.
  const firstDeath = loadMemory().deaths === 0;
  const relic = forgeRelic(args.heroName, args.days, firstDeath);
  mutateMemory((m) => {
    m.deaths += 1;
    m.totalDays += args.days;
    m.bestDays = Math.max(m.bestDays, args.days);
    m.fallen.unshift({ name: args.heroName, days: args.days, cause: args.cause, place: args.place });
    m.relics.push(relic);
    if (relic.rarity !== "commune") m.relicsRare += 1;
    if (args.killer && !m.bloodDebts.some((d) => d.entity === args.killer!.entity)) {
      m.bloodDebts.push({
        entity: args.killer.entity,
        label: args.killer.label,
        heroName: args.heroName,
        runIndex: m.runsStarted,
      });
    }
  });
  return relic;
}

/**
 * Le Grand Registre (§19) : classement des héros par jours de survie. En
 * attendant l'endpoint agrégé réel (même besoin d'infra que « le fantôme de
 * passage »), on compose un classement local — quelques héros de fond figés +
 * les héros tombés DU JOUEUR (mémoire) + sa ligne de run en cours, insérée et
 * marquée. Trié par jours décroissant, rangs attribués ensuite.
 */
const REGISTRE_BASE: { name: string; days: number; cause: string }[] = [
  { name: "Anselme le Patient", days: 41, cause: "n'est pas mort — a disparu" },
  { name: "Brigga aux Deux Lames", days: 34, cause: "le pont d'os, au retour" },
  { name: "Sévrin", days: 29, cause: "a compté un crâne de trop" },
  { name: "La Veuve Koll", days: 24, cause: "Geryon, tête du milieu" },
  { name: "Otho", days: 19, cause: "la porte blanche, de l'intérieur" },
  { name: "Maerith", days: 16, cause: "l'écho a gardé son nom" },
  { name: "Dorn le Sourd", days: 13, cause: "n'a pas entendu la meute" },
  { name: "Ysolde", days: 11, cause: "un 1, au pire moment" },
  { name: "Corvin", days: 9, cause: "la main morte s'est refermée" },
  { name: "Vael", days: 6, cause: "l'anneau était un appât" },
];

export function buildRegistre(
  mem: PlayerMemory,
  playerName: string,
  playerDays: number
): RegistreRow[] {
  const rows: { name: string; days: number; cause: string; isPlayer?: boolean }[] = [
    ...REGISTRE_BASE.map((r) => ({ ...r })),
    ...mem.fallen.map((f) => ({ name: f.name, days: f.days, cause: f.cause, isPlayer: true })),
    { name: playerName, days: playerDays, cause: "— en cours —", isPlayer: true },
  ];
  rows.sort((a, b) => b.days - a.days);
  return rows.map((r, i) => ({ rank: i + 1, ...r }));
}
