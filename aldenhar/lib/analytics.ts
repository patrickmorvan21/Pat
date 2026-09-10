/**
 * STATISTIQUES DE JEU — PostHog (région UE), demandé par Patrick le 10/09 pour
 * la démo (« voir toutes les statistiques des joueurs qui vont jouer à mon
 * jeu »). Ce module est le SEUL point par lequel le jeu parle à PostHog :
 * aucun composant n'appelle `window.posthog` directement.
 *
 * ARCHITECTURE, et pourquoi :
 *   • Le SDK est chargé par le snippet officiel dans `app/layout.tsx` (CDN),
 *     PAS par un paquet npm — `posthog-js` n'était pas installable le 10/09
 *     (une sous-dépendance non publiée sur le registre). Le snippet fonctionne
 *     avec l'export statique, charge la relecture de session à la demande, et
 *     se tait proprement hors ligne. Ce module ne SUPPOSE jamais que le SDK
 *     est là : hors ligne, bloqué par un filtre, ou avant son chargement,
 *     `track()` ne fait rien — le jeu n'a aucune dépendance à la mesure.
 *   • Aucune capture automatique (`autocapture: false`, pas de pageview) :
 *     PACTUM est une seule URL, les clics sur des boutons anonymes ne
 *     diraient rien. Chaque événement est NOMMÉ ici, avec les propriétés
 *     qui permettent de répondre à une question précise (« où les gens
 *     lâchent-ils ? », « le dé est-il compris ? »).
 *   • Persistance en localStorage, aucun cookie : le jeu n'en pose déjà
 *     aucun, et ça évite un bandeau que rien ne justifie sur une démo.
 *   • RGPD : rien d'identifiant. Pas de nom, pas d'e-mail, pas d'IP conservée
 *     (option projet). Le nom du héros n'est jamais envoyé. Le joueur peut
 *     couper la mesure dans Options → « Statistiques anonymes ».
 *
 * SUPER-PROPRIÉTÉS (posées une fois, jointes à tout événement) :
 *   version   — APP_VERSION, pour séparer les builds dans les tableaux.
 *   source    — d'où vient le lien (`?src=discord`, `?src=itch`…), persisté :
 *               un testeur venu par un canal garde son étiquette toute la démo.
 *   pwa       — l'app est-elle installée (mode autonome) ?
 *   ecran     — l'id de la scène affichée (posé par `registerEcran`), pour
 *               que chaque événement sache où il est tombé.
 *   geste     — le moteur de mini-jeu ouvert, s'il y en a un.
 *
 * LA CARTE D'ABANDON : `app_masquee` est envoyé quand l'onglet passe en
 * arrière-plan (`visibilitychange`), avec `send_instantly` — c'est le dernier
 * événement fiable avant qu'un joueur ferme l'app. Le dernier événement de
 * chaque personne dit donc où elle a lâché.
 */

import { APP_VERSION } from "./version";

type Props = Record<string, unknown>;

/** Forme minimale du SDK que ce module utilise — rien d'autre n'est appelé. */
type PostHogLike = {
  capture: (event: string, props?: Props, opts?: { send_instantly?: boolean }) => void;
  register: (props: Props) => void;
  unregister: (key: string) => void;
  opt_out_capturing: () => void;
  opt_in_capturing: (opts?: { captureEventName?: string | null }) => void;
  __loaded?: boolean;
};

declare global {
  interface Window {
    posthog?: PostHogLike;
  }
}

function sdk(): PostHogLike | null {
  if (typeof window === "undefined") return null;
  const p = window.posthog;
  // Le snippet installe un stub qui met les appels en file d'attente jusqu'au
  // chargement réel : on peut donc capturer avant que `array.js` soit arrivé.
  if (!p || typeof p.capture !== "function") return null;
  return p;
}

/**
 * Envoie un événement. `instant` force l'envoi immédiat (à utiliser juste
 * avant un rechargement de page ou un passage en arrière-plan, sinon
 * l'événement peut rester dans le tampon et se perdre).
 */
export function track(event: string, props: Props = {}, opts: { instant?: boolean } = {}): void {
  const p = sdk();
  if (!p) return;
  try {
    p.capture(event, props, opts.instant ? { send_instantly: true } : undefined);
  } catch {
    /* la mesure ne doit jamais casser le jeu */
  }
}

/** Pose une super-propriété (jointe à tous les événements suivants). */
export function registerProps(props: Props): void {
  const p = sdk();
  if (!p) return;
  try {
    p.register(props);
  } catch {}
}

/** L'écran courant : posé par `Scene` à chaque affichage. */
export function registerEcran(sceneId: string): void {
  registerProps({ ecran: sceneId });
}

/** Le mini-jeu ouvert (null quand il se ferme). */
export function registerGeste(engine: string | null): void {
  const p = sdk();
  if (!p) return;
  try {
    if (engine) p.register({ geste: engine });
    else p.unregister("geste");
  } catch {}
}

function estAutonome(): boolean {
  try {
    if ((navigator as unknown as { standalone?: boolean }).standalone === true) return true;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches
    );
  } catch {
    return false;
  }
}

const SOURCE_KEY = "pactum-source";

/**
 * La source du lien : lue une fois dans l'URL (`?src=…`), mémorisée pour que
 * la PWA installée (qui ne reçoit jamais de paramètre d'URL) la garde.
 */
function sourceDuLien(): string {
  try {
    const u = new URL(window.location.href);
    const s = u.searchParams.get("src");
    if (s) {
      window.localStorage.setItem(SOURCE_KEY, s.slice(0, 40));
      return s.slice(0, 40);
    }
    return window.localStorage.getItem(SOURCE_KEY) ?? "direct";
  } catch {
    return "direct";
  }
}

let initialise = false;

/**
 * Initialisation, appelée UNE fois au montage de la racine (`Home`) : pose les
 * super-propriétés, applique le réglage d'opt-out, arme la carte d'abandon.
 * Idempotente — un second appel ne fait rien.
 */
export function initAnalytics(opts: { stats: boolean }): void {
  if (initialise || typeof window === "undefined") return;
  initialise = true;
  setStatsEnabled(opts.stats);
  registerProps({
    version: APP_VERSION,
    source: sourceDuLien(),
    pwa: estAutonome(),
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      track("app_masquee", {}, { instant: true });
    }
  });
}

/**
 * Opt-out (Options → Statistiques anonymes). Le SDK garde lui-même le choix
 * en localStorage ; on le re-applique au démarrage depuis nos réglages pour
 * que les deux ne divergent jamais (les réglages sont la source de vérité).
 */
export function setStatsEnabled(on: boolean): void {
  const p = sdk();
  if (!p) return;
  try {
    // Les deux appels sont idempotents côté SDK, et on ne peut pas LIRE l'état
    // avant le chargement réel (le stub met les appels en file et ne rend
    // rien) — on impose donc toujours le réglage, sans le consulter.
    // `captureEventName: null` évite l'événement `$opt_in` parasite.
    if (on) p.opt_in_capturing({ captureEventName: null });
    else p.opt_out_capturing();
  } catch {}
}
