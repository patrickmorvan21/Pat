/**
 * Réglages du joueur (écran Options, Figma 2137:406) — persistés au COMPTE
 * (localStorage `aldenhar-settings`), distincts de la run et de la mémoire.
 *
 * Seules les fonctionnalités RÉELLES sont branchées ici (Patrick 21/07) :
 * Apparition du texte, Taille du texte, Animations, Vibrations, Réafficher les
 * aides. Les autres (Musique, Lecture à haute voix, Vitesse de lecture,
 * Restaurer mes achats) sont affichées grisées dans l'UI, pas d'état stocké.
 */

export type TextReveal = "lente" | "normale" | "instantanee";
export type TextSize = "petit" | "normal" | "grand";
export type AnimMode = "completes" | "reduites";

export type Settings = {
  /** Apparition du texte : vitesse de frappe, ou révélation immédiate. */
  textReveal: TextReveal;
  /** Taille du texte de narration. */
  textSize: TextSize;
  /** Animations complètes vs réduites (calme les flashs/secousses/cendres). */
  animations: AnimMode;
  /** Retour haptique (le dé, les impacts). */
  vibrations: boolean;
};

const KEY = "aldenhar-settings";

const DEFAULTS: Settings = {
  textReveal: "normale",
  textSize: "normal",
  animations: "completes",
  vibrations: true,
};

// Cache module : lu par `haptic()` (appelé souvent par le dé) sans toucher le
// localStorage à chaque impact.
let cached: Settings | null = null;

export function loadSettings(): Settings {
  if (cached) return cached;
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Settings>;
      cached = {
        textReveal: p.textReveal ?? DEFAULTS.textReveal,
        textSize: p.textSize ?? DEFAULTS.textSize,
        animations: p.animations ?? DEFAULTS.animations,
        vibrations: typeof p.vibrations === "boolean" ? p.vibrations : DEFAULTS.vibrations,
      };
      return cached;
    }
  } catch {}
  cached = { ...DEFAULTS };
  return cached;
}

export function saveSettings(s: Settings): void {
  cached = s;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
  applySettingsToDom(s);
}

export function mutateSettings(fn: (s: Settings) => void): Settings {
  const s = { ...loadSettings() };
  fn(s);
  saveSettings(s);
  return s;
}

/**
 * Applique les réglages « globaux » (taille de texte, animations réduites) au
 * <html> via des classes — lues par le CSS partout (jeu, accueil, prologue).
 * Appelée au montage de l'app et après chaque changement.
 */
export function applySettingsToDom(s: Settings = loadSettings()): void {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.toggle("textsize-petit", s.textSize === "petit");
  el.classList.toggle("textsize-grand", s.textSize === "grand");
  el.classList.toggle("anim-reduced", s.animations === "reduites");
}

/** Multiplicateur de vitesse de frappe (Apparition). `instantanee` → 0 = instant. */
export function revealFactor(): number {
  const r = loadSettings().textReveal;
  return r === "instantanee" ? 0 : r === "lente" ? 2.2 : 1;
}

/** Retour haptique respectant le réglage Vibrations (spec 21/07). */
export function haptic(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  if (!loadSettings().vibrations) return;
  navigator.vibrate(pattern);
}

/** Animations réduites ? (utilisé par les boucles JS : cendres, respiration). */
export function animReduced(): boolean {
  return loadSettings().animations === "reduites";
}
