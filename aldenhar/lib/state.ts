/**
 * Sauvegarde locale de la run — principe de sécurité du brief :
 * fermer l'app / perdre la connexion ne compte jamais comme une mort.
 * L'état est persisté à chaque évènement et repris exactement où on l'a laissé.
 */

export type RollRecord = {
  step: number;
  choiceId: string;
  result: number;
  at: number;
};

export type RunState = {
  /** Progression dans le parcours infini (0 = première scène). */
  step: number;
  rolls: RollRecord[];
  lastChoiceId: string | null;
};

const KEY = "aldenhar-run";

export function loadRun(): RunState {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<RunState>;
        if (typeof parsed.step === "number") {
          return {
            step: parsed.step,
            rolls: Array.isArray(parsed.rolls) ? parsed.rolls : [],
            lastChoiceId: parsed.lastChoiceId ?? null,
          };
        }
      }
    } catch {
      // stockage indisponible ou corrompu → on repart proprement, jamais de mort narrative
    }
  }
  return { step: 0, rolls: [], lastChoiceId: null };
}

export function saveRun(state: RunState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // quota plein / navigation privée : on continue en mémoire
  }
}
