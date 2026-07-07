/**
 * Sauvegarde locale de la run — principe de sécurité du brief :
 * fermer l'app / perdre la connexion ne compte jamais comme une mort.
 * L'état est persisté à chaque évènement et repris exactement où on l'a laissé.
 */

export type RollRecord = {
  choiceId: string;
  result: number;
  at: number;
};

export type RunState = {
  sceneId: string;
  rolls: RollRecord[];
  lastChoiceId: string | null;
};

const KEY = "aldenhar-run";

export function loadRun(sceneId: string): RunState {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RunState;
        if (parsed.sceneId === sceneId) return parsed;
      }
    } catch {
      // stockage indisponible ou corrompu → on repart proprement, jamais de mort narrative
    }
  }
  return { sceneId, rolls: [], lastChoiceId: null };
}

export function saveRun(state: RunState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // quota plein / navigation privée : on continue en mémoire
  }
}
