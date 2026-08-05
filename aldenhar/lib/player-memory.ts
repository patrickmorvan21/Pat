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
import { sacDepuis, type SacFaits } from "@/lib/faits";
import {
  forgerRelique,
  relique,
  type RelicDette,
  type RelicDon,
  type RelicLandes,
} from "@/lib/reliques";
// registre-data n'importe d'ici que des TYPES (import effacé au build) : ce
// sens-ci peut donc porter la valeur `buildLesCent` sans cycle au runtime.
import { buildLesCent } from "@/lib/registre-data";

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
  /** Effet de RÈGLE porté par la relique (retour test 4/08, promesse n°3 :
      « ta mort transforme la prochaine vie »). v1 : l'effet découle de la
      rareté — les reliques d'avant n'ont pas le champ, relicEffect() le
      dérive. Prochaine itération : effet par NOM de relique. */
  effect?: RelicEffect;
  /** Id de la fiche des Landes (lib/reliques.ts) — porte le DON et la DETTE.
      Absent sur les reliques d'avant le 5/08 : elles n'ont pas de dette. */
  relicId?: string;
};

export type RelicEffect = "coussin" | "passe" | "faveur";

/** L'effet d'une relique — champ posé à la forge, dérivé de la rareté pour
    les reliques antérieures au 4/08. */
export function relicEffect(r: Relic): RelicEffect {
  if (r.effect) return r.effect;
  return r.rarity === "legendaire" ? "faveur" : r.rarity === "rare" ? "passe" : "coussin";
}

/** La fonction, en mots — affichée sur la fiche de forge et dans l'Inventaire.
    Jamais un chiffre : la règle se dit, elle ne se compte pas. */
export const RELIC_FONCTION: Record<RelicEffect, string> = {
  coussin: "Le premier coup dur de la prochaine vie sera amorti. Puis elle se fendra.",
  passe: "Une fois, la prochaine vie passera un verrou que sa nature lui refuse. Le Hameau s'en souviendra.",
  faveur: "La prochaine vie lancera chaque dé avec la faveur des morts.",
};

/** La relique PORTÉE par l'incarnation suivante = la dernière forgée.
    « Celui qui te suivra la portera » — au singulier, et c'est voulu :
    une seule mort pèse sur une seule vie, la collection reste au Registre. */
export function activeRelic(mem: PlayerMemory): Relic | null {
  return mem.relics.length ? mem.relics[mem.relics.length - 1] : null;
}

/**
 * Le DON d'une relique (lib/reliques.ts). Les reliques d'avant le 5/08 n'ont
 * pas de fiche : leur don se dérive de l'ancien `effect` — « coussin » est
 * l'ancien nom d'« amorti ».
 */
export function relicDon(r: Relic | null): RelicDon | null {
  if (!r) return null;
  const fiche = relique(r.relicId ?? r.name);
  if (fiche) return fiche.don;
  const legacy = relicEffect(r);
  return legacy === "coussin" ? "amorti" : legacy;
}

/**
 * La DETTE d'une relique. `null` pour les reliques d'avant le 5/08 : on
 * n'ajoute pas rétroactivement un coût à un objet gagné sans.
 */
export function relicDette(r: Relic | null): RelicDette | null {
  if (!r) return null;
  return relique(r.relicId ?? r.name)?.dette ?? null;
}

/** La fiche complète (fonction, coût, murmure) si la relique en a une. */
export function relicFiche(r: Relic | null): RelicLandes | null {
  return r ? relique(r.relicId ?? r.name) : null;
}

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
  /** Chapitres garantis déjà vécus (chantier 2 du 23/07) — la rotation évite de
      retomber sur un chapitre vu tant qu'il en reste des neufs. */
  chaptersSeen: string[];
  /** Morts par fixation subies (chantier 3) : au-delà de 2, l'accueil du hameau
      change dès l'entrée — le village se souvient de la main qui lance le dé. */
  fixations: number;
  /**
   * L'introduction (les 4 clauses du pacte, Figma 2238:1009) a déjà été lue.
   *
   * ⚠️ Vit dans la mémoire du COMPTE, pas dans la run : le tuto énonce les
   * règles du JEU, pas celles d'une partie — le rejouer à chaque mort serait
   * une punition. Il ne se montre donc qu'au tout premier lancement, et ne
   * revient que si le joueur le redemande depuis Options (`forgetIntro`).
   *
   * Optionnel pour que les sauvegardes d'avant le 26/07 restent valides ; à
   * l'absence près, `introSeen` y est indéfini, donc l'intro se jouerait une
   * fois — c'est pourquoi `loadMemory` la marque vue quand la mémoire montre
   * une partie déjà entamée (voir la migration plus bas).
   */
  introSeen?: boolean;
  /**
   * Contexte de la DERNIÈRE mort (30/07) : ce dont le pool de citations du
   * Geôlier a besoin au retour à l'accueil — jamais affiché tel quel.
   * Optionnel : absent sur les mémoires d'avant le 30/07 (le pool retombe
   * alors sur ses génériques).
   */
  lastDeath?: {
    day: number;
    /** La mort était une fixation (sociale, aux Landes). */
    fixation: boolean;
    /** Rareté de la relique forgée par cette mort. */
    rarity: Relic["rarity"];
    /** Le héros est entré aux Cent du Registre. */
    classed: boolean;
    /** Acte le plus profond atteint par cette run. */
    acte: number;
    /** Cette run est le meilleur score du compte. */
    meilleurScore: boolean;
  };
  /** Dernier passage en jeu (ms epoch) — pour les citations « longue absence ». */
  lastPlayedAt?: number;
  /**
   * LES CONTRADICTIONS (5/08) : versions de chaque fait déjà LUES, toutes runs
   * confondues. Deux versions du même fait = une contradiction que le héros
   * peut opposer au Registre. Optionnel (mémoires d'avant le 5/08).
   */
  faitsVus?: Record<string, string[]>;
  /**
   * LE MOTEUR DE FAITS (spec 4/08 §1) — scopes `zone_permanent` et
   * `global_permanent` : compteurs de visite, Sceaux, DÉCOUVERTES. Ne meurent
   * jamais. ⚠️ Les Découvertes conditionnent les Sceaux et l'arc du twist,
   * jamais ce que sait le héros courant (voir lib/faits.ts).
   */
  faits?: SacFaits;
  /**
   * LES RENONÇANTS (5/08) : runs terminées SANS mourir — le héros est resté au
   * Hameau. Ce n'est pas une victoire et ce n'est pas une mort : c'est une
   * place prise à quelqu'un d'autre. Change le ton du Geôlier.
   */
  renoncements?: number;
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
    chaptersSeen: [],
    fixations: 0,
    introSeen: false,
    faitsVus: {},
    renoncements: 0,
    faits: {},
  };
}

/**
 * UN FAIT LU. Enregistre la version que cette run a montrée. Deux versions
 * différentes du même fait, sur deux vies, = une contradiction opposable au
 * Registre (lib/contradictions.ts).
 */
export function noterFait(faitId: string, versionId: string): void {
  mutateMemory((m) => {
    const vus = { ...(m.faitsVus ?? {}) };
    const l = vus[faitId] ?? [];
    if (!l.includes(versionId)) vus[faitId] = [...l, versionId];
    m.faitsVus = vus;
  });
}

/**
 * LE RENONCEMENT (5/08) — une run qui s'arrête sans mort.
 *
 * Le héros reste au Hameau : il ne franchit pas la Descente, il ne meurt pas.
 * Aucune relique n'est forgée — on ne forge rien avec une vie qu'on n'a pas
 * perdue. Le nom entre au Registre quand même : c'est le prix, et c'est aussi
 * la loi du Domaine (quelqu'un a pris sa place au Hameau, quelqu'un d'autre
 * en est sorti). `deaths` n'est PAS incrémenté : la courbe d'entrée et les
 * jalons de mort ne doivent pas se croire avancés.
 */
export function recordRenoncement(args: { heroName: string; days: number; place: string }): void {
  mutateMemory((m) => {
    m.renoncements = (m.renoncements ?? 0) + 1;
    m.totalDays += args.days;
    m.bestDays = Math.max(m.bestDays, args.days);
    m.fallen.unshift({
      name: args.heroName,
      days: args.days,
      cause: "resté au Hameau",
      place: args.place,
    });
    m.lastPlayedAt = Date.now();
  });
}

/** L'intro doit-elle se jouer ? (tout premier lancement, ou redemandée.) */
export function shouldShowIntro(): boolean {
  return !loadMemory().introSeen;
}

/** Marque l'intro comme lue — appelé à la sortie du dernier écran. */
export function markIntroSeen(): void {
  mutateMemory((m) => {
    m.introSeen = true;
  });
}

/**
 * Redonne l'intro au prochain lancement, SANS rien détruire.
 *
 * C'est la vraie réponse au besoin « je veux retester l'intro » : effacer toute
 * la progression marcherait aussi, mais coûterait les reliques et le Registre.
 */
export function forgetIntro(): void {
  mutateMemory((m) => {
    m.introSeen = false;
  });
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
          chaptersSeen: Array.isArray(p.chaptersSeen) ? p.chaptersSeen : [],
          fixations: typeof p.fixations === "number" ? p.fixations : 0,
          // Migration : une mémoire d'avant le 26/07 n'a pas le drapeau, or son
          // porteur a déjà joué — lui infliger le tuto serait absurde. On ne le
          // considère « à voir » que si le compte n'a jamais lancé de run.
          introSeen:
            typeof p.introSeen === "boolean"
              ? p.introSeen
              : (typeof p.runsStarted === "number" ? p.runsStarted : 0) > 0,
          lastDeath: p.lastDeath && typeof p.lastDeath === "object" ? p.lastDeath : undefined,
          lastPlayedAt: typeof p.lastPlayedAt === "number" ? p.lastPlayedAt : undefined,
          // ⚠️ Comme loadRun, cette reconstruction est CHAMP PAR CHAMP : tout
          // champ absent ici est silencieusement perdu au rechargement.
          faitsVus: p.faitsVus && typeof p.faitsVus === "object" ? p.faitsVus : {},
          renoncements: typeof p.renoncements === "number" ? p.renoncements : 0,
          faits: sacDepuis(p.faits),
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
/**
 * Forge d'une Relique à la mort. Depuis le 5/08, le pool ET la rareté sortent
 * de `lib/reliques.ts` : c'est la CAUSE de la mort qui choisit la relique — une
 * corde ne forge pas la même chose qu'une noyade. `floorRare` = jalon de
 * première mort (spec 21/07) : la toute première perte donne un « fragment
 * fort », jamais une commune.
 */
export function forgeRelic(heroName: string, days: number, floorRare = false, cause = ""): Relic {
  const fiche = forgerRelique(cause, floorRare);
  // L'ancien `effect` reste posé pour les lectures qui ne connaissent que les
  // trois effets d'origine (fiches de menu, sauvegardes relues par du code
  // antérieur) — le DON de la fiche fait autorité côté moteur.
  const effect: RelicEffect =
    fiche.don === "faveur" ? "faveur" : fiche.don === "passe" ? "passe" : "coussin";
  return {
    name: fiche.nom,
    relicId: fiche.id,
    rarity: fiche.rarete,
    heroName,
    days,
    effect,
  };
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
  /** Mort par fixation (sociale, aux Landes) — nourrit le pool de citations. */
  fixation?: boolean;
  /** Acte le plus profond atteint par cette run (1 tant que seul l'Acte I existe). */
  acte?: number;
}): Relic {
  // Première mort du compte (jalon 21/07) : relique garantie rare+ (« fragment
  // fort »). Lu AVANT l'incrément de `deaths` ci-dessous — comme `bestBefore`,
  // qui sert au « meilleur score » du contexte de citations (30/07).
  const memBefore = loadMemory();
  const firstDeath = memBefore.deaths === 0;
  const bestBefore = memBefore.bestDays;
  const relic = forgeRelic(args.heroName, args.days, firstDeath, args.cause);
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
    // Contexte de la dernière mort (30/07) — ce que le pool de citations du
    // Geôlier lira au retour à l'accueil. `classed` se calcule sur la mémoire
    // DÉJÀ mise à jour (le héros vient d'entrer dans `fallen`).
    const classed = buildLesCent(m, args.heroName, 0).some(
      (r) => r.isPlayer && !r.running && r.name === args.heroName && r.days === args.days
    );
    m.lastDeath = {
      day: args.days,
      fixation: args.fixation ?? false,
      rarity: relic.rarity,
      classed,
      acte: args.acte ?? 1,
      meilleurScore: args.days > bestBefore,
    };
    m.lastPlayedAt = Date.now();
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
