/**
 * Musique de PACTUM (lot 24/07) — moteur minimal, côté client uniquement.
 *
 * Pistes attendues dans `public/audio/` (fichiers de Patrick, Drive
 * `PACTUM/Assets/Musique` — trop lourds pour transiter par le connecteur en
 * session distante, à déposer via l'UI GitHub ou en PJ) :
 *   • audio/intro.mp3     — accueil + prologue (boucle)
 *   • audio/landes_1.mp3, landes_2.mp3, landes_3.mp3 — Acte I, enchaînées en
 *     rotation sur un ORDRE MÉLANGÉ, qui ne redémarre pas sur la piste
 *     entendue la fois précédente (cf. `buildQueue`).
 *
 * Règles :
 *   • GRACIEUX si un fichier manque (erreur de chargement → silence, jamais
 *     de spam console ni de crash) — le moteur peut vivre avant les fichiers.
 *   • Autoplay : les navigateurs exigent un geste — `armAudio()` pose un
 *     écouteur one-shot qui (re)lance la piste demandée au PREMIER geste, quel
 *     qu'il soit (toucher, clic, touche, molette), en phase de capture.
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
let fadeTimer: ReturnType<typeof setInterval> | null = null;
/* LA MUSIQUE SUIT LA COURBE (démo, go du 24/08 : « la musique se penche au
   6, sombre au 8, morte au 10 »). En mode démo, la phase de la traversée
   IMPOSE la piste des Landes au lieu de la rotation mélangée :
     ouverture → landes_1 · pression → landes_2 · climax → landes_3 ·
     falaise → silence (fondu, jamais une coupure).
   `null` = comportement normal (jeu complet). Idempotent : re-poser la même
   piste ne redémarre rien. */
let pisteForcee: number | "off" | null = null;

export function forcerPiste(p: number | "off" | null): void {
  if (p === pisteForcee) return;
  pisteForcee = p;
  if (typeof window === "undefined") return;
  if (p === "off") {
    stopMusic();
    return;
  }
  if (p === null) return;
  const src = TRACKS.landes[Math.max(0, Math.min(TRACKS.landes.length - 1, p))];
  if (!src) return;
  // Si les Landes jouent déjà (ou sont le contexte demandé), on bascule en
  // fondu vers la piste de la phase ; sinon playMusic la prendra au départ.
  if (current === "landes") {
    const audio = ensureEl();
    const deja = audio?.getAttribute("data-src") ?? "";
    if (deja === src && audio && !audio.paused) return;
    if (loadSettings().music) fadeOutAndStop(() => startTrack(src));
  }
}

// Pistes introuvables (404/erreur) : on ne réessaie pas en boucle.
const missing = new Set<string>();
// Geste utilisateur déjà obtenu (autoplay débloqué) ?
let unlocked = false;

/**
 * File d'écoute du contexte courant (retour Patrick 25/07 : « quand je lance
 * les Landes, c'est toujours le même son »).
 *
 * Un simple `Math.random()` à chaque entrée en jeu retombait souvent sur la
 * même piste (1 chance sur 3 à chaque run, et rien n'empêchait deux runs de
 * suite identiques). On tire donc un ORDRE mélangé des 3 boucles, on le suit
 * jusqu'au bout, et on mémorise la dernière piste jouée dans localStorage pour
 * que la run suivante ne REDÉMARRE jamais sur celle qu'on vient d'entendre.
 */
let queue: string[] = [];
let queuePos = 0;

/* Mémoire PAR CONTEXTE. ⚠️ Une seule clé partagée ne marche pas : l'accueil joue
   l'intro juste avant que le jeu demande les Landes, donc la « dernière piste »
   valait toujours `intro.mp3` et n'évitait jamais de rejouer la même boucle des
   Landes (bug vu au test le 25/07). */
const lastKey = (kind: MusicKind) => `pactum-music-last-${kind}`;

function readLast(kind: MusicKind): string | null {
  try {
    return localStorage.getItem(lastKey(kind));
  } catch {
    return null;
  }
}

function writeLast(kind: MusicKind, src: string): void {
  try {
    localStorage.setItem(lastKey(kind), src);
  } catch {
    /* stockage indisponible (navigation privée) : on perd juste la mémoire. */
  }
}

/** Mélange les pistes d'un contexte, en évitant de rouvrir sur `avoid`. */
function buildQueue(kind: MusicKind, avoid: string | null): string[] {
  const list = [...TRACKS[kind]];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  // Une seule piste (intro) : rien à éviter. Sinon on décale pour ne pas
  // rejouer d'emblée celle de la session précédente.
  if (list.length > 1 && avoid && list[0] === avoid) {
    list.push(list.shift()!);
  }
  return list;
}

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
      // Rotation : piste suivante de la FILE mélangée. En fin de file on en
      // retire une neuve, sans enchaîner deux fois la même piste.
      if (!current) return;
      if (current === "landes" && typeof pisteForcee === "number") {
        // Phase imposée : la piste de la phase reboucle sur elle-même.
        const src = el?.getAttribute("data-src");
        if (src) startTrack(src);
        return;
      }
      queuePos += 1;
      if (queuePos >= queue.length) {
        queue = buildQueue(current, queue[queue.length - 1] ?? null);
        queuePos = 0;
      }
      startTrack(queue[queuePos]);
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
  if (current) writeLast(current, src);
  void audio.play().catch(() => {
    // Autoplay encore bloqué : on RÉ-ARME pour le prochain geste. Sans ça, un
    // premier geste qui échoue consommait l'écouteur et la run restait muette.
    unlocked = false;
    armAudio();
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
  const audio = ensureEl();
  if (!audio) return;
  const already = audio.getAttribute("data-src") ?? "";
  if (!audio.paused && list.includes(already)) return; // déjà sur ce contexte
  // Nouvelle file mélangée pour ce contexte, qui ne rouvre pas sur la piste
  // entendue la dernière fois (mémoire localStorage).
  queue = buildQueue(kind, readLast(kind));
  queuePos = 0;
  // Piste imposée par la courbe de la démo : elle prime sur la rotation.
  if (kind === "landes" && pisteForcee === "off") return;
  const src =
    kind === "landes" && typeof pisteForcee === "number"
      ? TRACKS.landes[Math.max(0, Math.min(TRACKS.landes.length - 1, pisteForcee))]
      : queue[0];
  // On TENTE de jouer immédiatement (retour Patrick 24/07 : la musique doit
  // partir dès l'ouverture de l'appli, sans attendre un clic). Beaucoup de
  // navigateurs — surtout une PWA installée lancée depuis l'icône — l'ont
  // déjà autorisé. Si le navigateur bloque encore (`play()` rejette), on arme
  // le repli sur le premier geste. `startTrack` gère lui-même le catch.
  armAudio();
  if (audio.paused || !list.includes(already)) {
    fadeOutAndStop(() => startTrack(src));
  }
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
 * Débloque l'autoplay : écouteur one-shot sur le premier geste de l'utilisateur
 * — lance (ou relance) le contexte demandé. Sans effet si déjà armé.
 *
 * ⚠️ Retour Patrick 25/07 : « le son ne commence pas dès qu'on lance le jeu, il
 * faut cliquer sur commencer ». Les navigateurs REFUSENT de jouer un son avant
 * un geste : c'est une contrainte de plateforme, pas un réglage. Ce qu'on peut
 * faire, et qu'on fait ici, c'est saisir le PREMIER geste quel qu'il soit
 * (toucher n'importe où, molette, touche) au lieu du seul `pointerdown`, en
 * phase de capture pour passer avant tout `stopPropagation` de l'appli. Le son
 * part donc au premier contact avec l'écran, sans attendre un bouton précis.
 * (Une PWA installée autorise souvent l'autoplay d'emblée : `playMusic` tente
 * toujours de jouer avant d'armer ce repli.)
 */
const GESTURES = ["pointerdown", "touchstart", "touchend", "mousedown", "keydown", "wheel"] as const;

/** Écouteur en cours, gardé au niveau module pour ne JAMAIS en empiler deux
    (un `play()` refusé ré-arme : sans ce garde-fou on cumulait les handlers). */
let gestureHandler: (() => void) | null = null;

function detachGestures(): void {
  if (typeof document === "undefined" || !gestureHandler) return;
  for (const g of GESTURES) document.removeEventListener(g, gestureHandler, true);
  gestureHandler = null;
}

export function armAudio(): void {
  if (typeof document === "undefined" || unlocked) return;
  detachGestures();
  const onFirst = () => {
    unlocked = true;
    detachGestures();
    if (current && loadSettings().music) {
      if (queue.length === 0) {
        queue = buildQueue(current, readLast(current));
        queuePos = 0;
      }
      startTrack(queue[queuePos % queue.length]);
    }
  };
  gestureHandler = onFirst;
  for (const g of GESTURES) document.addEventListener(g, onFirst, true);
}
