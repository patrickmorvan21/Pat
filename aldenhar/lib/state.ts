/**
 * Sauvegarde locale de la run — principe de sécurité (spec §9) :
 * fermer l'app / perdre la connexion ne compte jamais comme une mort.
 * L'état est persisté à chaque évènement et repris exactement où on l'a laissé.
 */

import { startingBesace, type BesaceItem } from "@/lib/besace";

export type RollRecord = {
  step: number;
  choiceId: string;
  result: number;
  at: number;
};

/** État narratif temporaire (spec §2) : modifie les jets, se dissipe. */
export type NarrativeEffect = {
  id: "aguerri" | "entaille" | "ebranle";
  label: string;
  delta: number;
  scenesLeft: number;
};

/**
 * Entrée du fil scrollable (spec §16) — le flux contient tout l'historique
 * de la run, jamais rien ne se décharge. Persisté intégralement pour que la
 * reprise de run restaure le scrollback exact, pas seulement la position.
 */
/** Une ligne du Grand Registre (§19) : un héros classé par jours de survie. */
export type RegistreRow = {
  rank: number;
  name: string;
  days: number;
  cause: string;
  /** La ligne du joueur (run en cours ou héros tombé), visuellement distincte. */
  isPlayer?: boolean;
};

export type FeedEntry =
  | { id: string; kind: "illustration"; src: string }
  | { id: string; kind: "day"; day: number }
  | { id: string; kind: "narration"; text: string }
  | { id: string; kind: "chosen"; label: string }
  | { id: string; kind: "jailer"; text: string }
  | { id: string; kind: "registre"; rows: RegistreRow[] }
  /** Bannière de rencontre : annonce clairement un combat (spec §6, lisibilité). */
  | { id: string; kind: "combat"; foe: string }
  /** Objet mineur obtenu (13/07) : bandeau tramé « Obtenu — … », pas de popup. */
  | { id: string; kind: "obtenu"; name: string; rarity: string; flavor: string };

/**
 * Prix différé (spec §17) : un choix « gratuit » contracte une dette
 * silencieuse qui se règle plus tard dans la MÊME run (pas au niveau compte).
 * Le règlement doit rester rétrospectivement lisible (le joueur remonte le
 * transcript et comprend d'où ça vient), jamais totalement arbitraire.
 */
export type PendingDebt = {
  id: string;
  /** Pas de progression auquel la dette se déclenche. */
  settleAtStep: number;
  /** Texte narratif du règlement, inséré dans le fil au déclenchement. */
  text: string;
};

/**
 * Stats de personnalité de la run (Courage/Ruse/Instinct/Empathie, sur 10).
 * Pour l'instant AFFICHAGE SEUL (radar de l'écran Essence, 14/07) : les jets
 * continuent d'utiliser seuil + états narratifs. Elles seront fixées par le
 * prologue narratif (pas encore construit) et branchées sur la résolution à
 * ce moment-là — jamais un écran de répartition de points.
 */
export type RunStats = {
  courage: number;
  ruse: number;
  instinct: number;
  empathie: number;
};

function randomStats(): RunStats {
  // Un profil marqué plutôt qu'une moyenne plate : une dominante, une faiblesse.
  const values = [7 + Math.floor(Math.random() * 3), 5 + Math.floor(Math.random() * 2), 4 + Math.floor(Math.random() * 2), 2 + Math.floor(Math.random() * 3)];
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return { courage: values[0], ruse: values[1], instinct: values[2], empathie: values[3] };
}

export type RunState = {
  /** Nom du héros de cette run (dette de sang, Grand Registre — spec §19). */
  heroName: string;
  /** Progression dans le parcours infini (0 = première scène). */
  step: number;
  /** Jour courant — n'avance qu'aux campements (spec §7). */
  day: number;
  /** Santé 0..1 — jamais affichée : elle se lit dans l'érosion de l'UI (spec §5). */
  health: number;
  effects: NarrativeEffect[];
  rolls: RollRecord[];
  lastChoiceId: string | null;
  feed: FeedEntry[];
  /** Dettes narratives en attente de règlement dans cette run (spec §17). */
  debts: PendingDebt[];
  /** Besace (13/07) : objets mundane, vidée à la mort. */
  besace: BesaceItem[];
  /** Rencontres (scènes de combat) traversées vivant — pour l'écran de mort. */
  encounters: number;
  /** Stats de la run (affichage Essence seulement pour l'instant). */
  stats: RunStats;
};

const KEY = "aldenhar-run";

const HERO_NAMES = [
  "Corvin", "Vael", "Ysolde", "Brannoc", "Maerith", "Dorn", "Sélène",
  "Karth", "Ombrelin", "Thessaly", "Rœric", "Nyx", "Aldric", "Vesper",
];

/** Nom de héros aléatoire (dette de sang / Registre — spec §19). */
export function randomHeroName(): string {
  return HERO_NAMES[Math.floor(Math.random() * HERO_NAMES.length)];
}

function fresh(): RunState {
  return {
    heroName: randomHeroName(),
    step: 0,
    day: 1,
    health: 1,
    effects: [],
    rolls: [],
    lastChoiceId: null,
    feed: [],
    debts: [],
    besace: startingBesace(),
    encounters: 0,
    stats: randomStats(),
  };
}

/** Réinitialisation explicite (mort acceptée) : nouvelle run, nouveau héros. */
export function resetRun(): RunState {
  const run = fresh();
  saveRun(run);
  return run;
}

export function loadRun(): RunState {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<RunState>;
        if (typeof p.step === "number") {
          return {
            heroName: typeof p.heroName === "string" ? p.heroName : randomHeroName(),
            step: p.step,
            day: typeof p.day === "number" ? p.day : 1,
            health: typeof p.health === "number" ? p.health : 1,
            effects: Array.isArray(p.effects) ? p.effects : [],
            rolls: Array.isArray(p.rolls) ? p.rolls : [],
            lastChoiceId: p.lastChoiceId ?? null,
            feed: Array.isArray(p.feed) ? p.feed : [],
            debts: Array.isArray(p.debts) ? p.debts : [],
            besace: Array.isArray(p.besace) ? p.besace : startingBesace(),
            encounters: typeof p.encounters === "number" ? p.encounters : 0,
            stats: p.stats && typeof p.stats.courage === "number" ? p.stats : randomStats(),
          };
        }
      }
    } catch {
      // stockage indisponible ou corrompu → on repart proprement, jamais de mort narrative
    }
  }
  return fresh();
}

/**
 * Une run est « en cours » si son fil a déjà du contenu — critère de l'écran
 * d'accueil (14/07) pour choisir entre « Bienvenue en enfer » et « Bon
 * retour... ». La simple existence de la clé ne suffit pas : une run tout
 * juste réinitialisée (mort acceptée) n'a rien à reprendre.
 */
export function hasSavedRun(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return false;
    const p = JSON.parse(raw) as Partial<RunState>;
    return (Array.isArray(p.feed) && p.feed.length > 0) || (typeof p.step === "number" && p.step > 0);
  } catch {
    return false;
  }
}

export function saveRun(state: RunState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // quota plein / navigation privée : on continue en mémoire
  }
}
