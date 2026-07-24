/**
 * Musique de PACTUM (lot 24/07) — moteur minimal, côté client uniquement.
 *
 * Pistes attendues dans `public/audio/` (fichiers de Patrick, Drive
 * `PACTUM/Assets/Musique` — trop lourds pour transiter par le connecteur en
 * session distante, à déposer via l'UI GitHub ou en PJ) :
 *   • audio/intro.mp3     — accueil + prologue (boucle)
 *   • audio/landes_1.mp3, landes_2.mp3, landes_3.mp3 — Acte I, enchaînées en
 *     rotation (départ aléatoire), boucle sur la liste.
 *
 * Règles :
 *   • GRACIEUX si un fichier manque (erreur de chargement → silence, jamais
 *     de spam console ni de crash) — le moteur peut vivre avant les fichiers.
 *   • Autoplay : les navigateurs exigent un geste — `armAudio()` pose un
 *     écouteur one-shot qui (re)lance la piste demandée au premier pointerdown.
 *   • Volume/marche-arrêt : réglages du compte (`aldenhar-settings`), lus via
 *     lib/settings — `syncMusicSettings()` à appeler après tout changement.
 *   • Jamais deux pistes en même temps ; petit fondu au changement.
 */

import { loadSettings } from "@/lib/settings";

export type MusicKind = "intro" | "landes";

const TRACKS: Record<MusicKind, string[]> = {
  intro: ["audio/intro.mp3"],
  landes: ["audio/landes_1.mp3", "audio/landes_2.mp3", "audio/landes_3.mp3"],
};

let el: HTMLAudioElement | null = null;
let current: MusicKind | null = null;
let trackIdx = 0;
let fadeTimer: ReturnType<typeof setInterval> | null = null;
// Pistes introuvables (404/erreur) : on ne réessaie pas en boucle.
const missing = new Set<string>();
// Geste utilisateur déjà obtenu (autoplay débloqué) ?
let unlocked = false;
let armed = false;

function ensureEl(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!el) {
    el = new Audio();
    el.preload = "auto";
    el.addEventListener("error", () => {
      // Fichier absent (déploiement sans les mp3) : silence, on note, pas de spam.
      const src = el?.getAttribute("data-src");
      if (src) missing.add(src);
    });
    el.addEventListener("ended", () => {
      // Rotation des Landes : piste suivante de la liste (boucle).
      if (current) {
        const list = TRACKS[current];
        trackIdx = (trackIdx + 1) % list.length;
        startTrack(list[trackIdx]);
      }
    });
  }
  return el;
}

function startTrack(src: string): void {
  const audio = ensureEl();
  if (!audio || missing.has(src)) return;
  const s = loadSettings();
  audio.setAttribute("data-src", src);
  audio.src = src;
  audio.loop = false; // la boucle passe par `ended` (rotation multi-pistes)
  audio.volume = Math.max(0, Math.min(1, s.musicVolume));
  void audio.play().catch(() => {
    // Autoplay bloqué : on attendra le prochain geste (armAudio).
  });
}

/** Fondu court vers 0 puis stop (jamais de coupure sèche). */
function fadeOutAndStop(then?: () => void): void {
  const audio = el;
  if (fadeTimer) clearInterval(fadeTimer);
  if (!audio || audio.paused) {
    then?.();
    return;
  }
  const step = Math.max(0.04, audio.volume / 10);
  fadeTimer = setInterval(() => {
    if (!el) return;
    if (el.volume > step) el.volume -= step;
    else {
      if (fadeTimer) clearInterval(fadeTimer);
      fadeTimer = null;
      el.pause();
      then?.();
    }
  }, 60);
}

/**
 * Demande la musique d'un contexte : accueil/prologue = "intro", jeu =
 * "landes". Idempotent (même contexte = ne redémarre pas la piste).
 */
export function playMusic(kind: MusicKind): void {
  if (typeof window === "undefined") return;
  const s = loadSettings();
  current = kind;
  if (!s.music) return; // coupée : on retient juste le contexte demandé
  const list = TRACKS[kind];
  if (kind === "landes") trackIdx = Math.floor(Math.random() * list.length);
  else trackIdx = 0;
  const src = list[trackIdx];
  const audio = ensureEl();
  if (!audio) return;
  const already = audio.getAttribute("data-src") ?? "";
  if (!audio.paused && list.includes(already)) return; // déjà sur ce contexte
  if (!unlocked) {
    armAudio();
    return; // démarrera au premier geste
  }
  fadeOutAndStop(() => startTrack(src));
}

/** Coupe la musique (fondu court). Le contexte courant est conservé. */
export function stopMusic(): void {
  fadeOutAndStop();
}

/**
 * À appeler après un changement de réglages (Options) : applique volume et
 * marche/arrêt à la piste en cours — et relance le contexte si on rallume.
 */
export function syncMusicSettings(): void {
  const s = loadSettings();
  const audio = el;
  if (!s.music) {
    fadeOutAndStop();
    return;
  }
  if (audio && !audio.paused) {
    audio.volume = Math.max(0, Math.min(1, s.musicVolume));
  } else if (current && unlocked) {
    playMusic(current);
  }
}

/**
 * Débloque l'autoplay : écouteur one-shot sur le premier pointerdown du
 * document — lance (ou relance) le contexte demandé. Sans effet si déjà armé.
 */
export function armAudio(): void {
  if (typeof document === "undefined" || unlocked || armed) return;
  armed = true;
  const onFirst = () => {
    unlocked = true;
    document.removeEventListener("pointerdown", onFirst);
    if (current && loadSettings().music) {
      const list = TRACKS[current];
      startTrack(list[trackIdx % list.length]);
    }
  };
  document.addEventListener("pointerdown", onFirst);
}
