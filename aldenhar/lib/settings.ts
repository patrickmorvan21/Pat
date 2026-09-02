/**
 * Réglages du joueur (écran Options, Figma 2137:406) — persistés au COMPTE
 * (localStorage `aldenhar-settings`), distincts de la run et de la mémoire.
 *
 * Seules les fonctionnalités RÉELLES sont branchées ici (Patrick 21/07) :
 * Apparition du texte, Taille du texte, Animations, Vibrations, Réafficher les
 * aides. Les autres (Musique, Lecture à haute voix, Vitesse de lecture,
 * Restaurer mes achats) sont affichées grisées dans l'UI, pas d'état stocké.
 */

import { demoActive } from "@/lib/demo";

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
  /**
   * ACCESSIBILITÉ (catalogue des surprises 6/08, garde-fou du « choix qui
   * expire ») : désactive TOUT ce qui est chronométré — le choix qui s'érode
   * ET les scènes à compte à rebours (l'expiration ne tombe jamais). Un
   * joueur interrompu par un appel ne doit jamais rien perdre de l'avoir été.
   */
  chronosOff: boolean;
  /** Musique (lot 24/07) : marche/arrêt + volume 0..1. */
  music: boolean;
  musicVolume: number;
};

const KEY = "aldenhar-settings";

const DEFAULTS: Settings = {
  textReveal: "normale",
  textSize: "normal",
  animations: "completes",
  vibrations: true,
  chronosOff: false,
  music: true,
  musicVolume: 0.7,
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
        chronosOff: typeof p.chronosOff === "boolean" ? p.chronosOff : DEFAULTS.chronosOff,
        music: typeof p.music === "boolean" ? p.music : DEFAULTS.music,
        musicVolume: typeof p.musicVolume === "number" ? p.musicVolume : DEFAULTS.musicVolume,
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

/** Multiplicateur de vitesse de frappe (Apparition). `instantanee` → 0 = instant.
    MODE DÉMO (retour Patrick 24/08 : « beaucoup de lecture, c'est long ») :
    la frappe « normale » est accélérée (×0.55) — un testeur lit, il ne
    savoure pas la cadence. Les réglages explicites (lente / instantanée)
    restent respectés tels quels : la démo ne pilote que le défaut. */
export function revealFactor(): number {
  const r = loadSettings().textReveal;
  if (r === "instantanee") return 0;
  if (r === "lente") return 2.2;
  return demoActive() ? 0.55 : 1;
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

/**
 * LES CLÉS D'AIDE — une seule liste, parce qu'elles se sont déjà perdues.
 *
 * Chaque aide « une fois par compte » range son drapeau sous sa propre clé :
 * `aldenhar-aide-de` (l'aide de l'Anneau, `Die3D`) et `aldenhar-aide-menu`
 * (la carte « rangé dans le menu », `Scene`). Les deux points qui doivent les
 * remettre à zéro — « Réafficher les aides » et « Effacer la progression » —
 * les listaient à la main et n'en connaissaient QU'UNE.
 *
 * ⚠️ Défaut réel trouvé le 2/09 (« quand j'obtiens un objet il manque le petit
 * tuto ») : sur un compte qui a déjà vu la carte objet une fois, elle ne
 * pouvait plus jamais revenir — ni en réaffichant les aides, ni en effaçant
 * la progression, qui laissait donc une ardoise pas si propre. Toute nouvelle
 * aide « une fois par compte » s'ajoute ICI, jamais dans un `removeItem`
 * recopié ailleurs.
 */
export const CLES_AIDES = ["aldenhar-aide-de", "aldenhar-aide-menu"] as const;

/** Remet toutes les aides à zéro : elles se remontreront une fois chacune. */
export function reinitialiserAides() {
  for (const k of CLES_AIDES) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* stockage indisponible : l'aide se remontrera de toute façon */
    }
  }
}
