/**
 * Sauvegarde locale de la run — principe de sécurité (spec §9) :
 * fermer l'app / perdre la connexion ne compte jamais comme une mort.
 * L'état est persisté à chaque évènement et repris exactement où on l'a laissé.
 */

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
export type FeedEntry =
  | { id: string; kind: "illustration"; src: string }
  | { id: string; kind: "day"; day: number }
  | { id: string; kind: "narration"; text: string }
  | { id: string; kind: "chosen"; label: string }
  | { id: string; kind: "jailer"; text: string };

export type RunState = {
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
};

const KEY = "aldenhar-run";

function fresh(): RunState {
  return { step: 0, day: 1, health: 1, effects: [], rolls: [], lastChoiceId: null, feed: [] };
}

export function loadRun(): RunState {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<RunState>;
        if (typeof p.step === "number") {
          return {
            step: p.step,
            day: typeof p.day === "number" ? p.day : 1,
            health: typeof p.health === "number" ? p.health : 1,
            effects: Array.isArray(p.effects) ? p.effects : [],
            rolls: Array.isArray(p.rolls) ? p.rolls : [],
            lastChoiceId: p.lastChoiceId ?? null,
            feed: Array.isArray(p.feed) ? p.feed : [],
          };
        }
      }
    } catch {
      // stockage indisponible ou corrompu → on repart proprement, jamais de mort narrative
    }
  }
  return fresh();
}

export function saveRun(state: RunState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // quota plein / navigation privée : on continue en mémoire
  }
}
