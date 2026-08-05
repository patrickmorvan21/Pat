/**
 * Sauvegarde locale de la run — principe de sécurité (spec §9) :
 * fermer l'app / perdre la connexion ne compte jamais comme une mort.
 * L'état est persisté à chaque évènement et repris exactement où on l'a laissé.
 */

import { normalizeItem, startingBesace, type BesaceItem } from "@/lib/besace";
import { drawMemories } from "@/lib/prologue-data";
import { ENTRY_SCENE, sceneAt } from "@/lib/scene-data";

export type RollRecord = {
  step: number;
  choiceId: string;
  result: number;
  at: number;
  /** Le jet a-t-il TENU (palier non-échec) ? Sert au bilan de mort (26/07),
      seul endroit du jeu où des chiffres bruts sont autorisés. */
  ok?: boolean;
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
  | { id: string; kind: "obtenu"; name: string; rarity: string; flavor: string }
  /** États narratifs temporaires actifs, rappelés en tête d'écran après un
      jet (retour Patrick 19/07) — jamais un chiffre, seulement le nom. */
  | { id: string; kind: "etat"; effects: { effectId: string; label: string; positive: boolean }[] };

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
 * Stats de personnalité de la run (Courage/Ruse/Instinct/Empathie, sur 1..5 —
 * échelle du prologue « Le Seuil », 16/07). Fixées par le VERDICT du prologue
 * (base 1 + choix A/B/C + jet silencieux ±1) — jamais un écran de répartition
 * de points, jamais un chiffre affiché. Pour l'instant AFFICHAGE SEUL (radar
 * de l'écran Essence) : les jets continuent d'utiliser seuil + états.
 */
export type RunStats = {
  courage: number;
  ruse: number;
  instinct: number;
  empathie: number;
};

/** Profil de repli (runs héritées d'avant le prologue) — échelle 1..5. */
function randomStats(): RunStats {
  const values = [4, 3, 2, 2].map((v) => Math.max(1, Math.min(5, v + (Math.floor(Math.random() * 3) - 1))));
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return { courage: values[0], ruse: values[1], instinct: values[2], empathie: values[3] };
}

/**
 * Prologue « Le Seuil » (spec 16/07) : le Geôlier feuillette la vie d'avant
 * du héros — 2 beats d'amorce, 4 souvenirs (un par stat, ordre fixe), une
 * clôture. Persisté dans la run : fermer l'app en plein prologue reprend
 * exactement au même beat (§9, jamais une mort technique). Rejoué à chaque
 * nouvelle run avec un tirage différent.
 */
export type PrologueMemory = {
  stat: keyof RunStats;
  title: string;
  narration: string;
  options: [string, string, string];
};

export type PrologueState = {
  /** Les 4 souvenirs tirés pour cette run (ordre Courage→Ruse→Instinct→Empathie). */
  memories: PrologueMemory[];
  /** Beat courant : 0-1 = amorce, 2-5 = souvenirs, 6 = clôture. */
  beat: number;
  /** Index (0=A, 1=B, 2=C) du choix retenu pour chaque souvenir joué. */
  choices: number[];
  /** true une fois le verdict rendu (stats calculées) — on entre au Jour I. */
  done: boolean;
  /** Le verdict a été calculé à l'ENTRÉE de la clôture (portrait 4/08).
      ⚠️ Nécessaire parce que computeVerdict tire un jet silencieux : le
      recalculer au timer de sortie donnerait un AUTRE héros que celui que le
      portrait vient de décrire. Optionnel — les sauvegardes d'avant n'ont pas
      le champ, et undefined vaut « pas encore rendu ». */
  verdictRendu?: boolean;
};

/**
 * Traversée (spec 21/07, chantier n°1) : la run ne parcourt plus les scènes en
 * ligne — elle traverse la zone par LIAISONS (marche + choix d'orientation) et
 * ne visite que 3-4 lieux avant la Descente (fin sèche). Persisté pour reprendre
 * la traversée exactement où elle en était (§9).
 */
export type TraversalState = {
  /** Écran courant : un lieu/rencontre ("scene") ou une liaison ("liaison"). */
  phase: "scene" | "liaison";
  /** Id de la scène courante (quand phase = "scene"). */
  current: string;
  /** Lieux/rencontres déjà visités cette traversée (dédup, chaîne = 1). */
  visited: string[];
  /** Nombre de lieux à visiter avant la Descente (3 ou 4, fixé au départ). */
  target: number;
  /** Les 2 destinations offertes à la liaison courante (quand phase = "liaison"). */
  liaisonOpts: [string, string] | null;
  /** Graine de la liaison courante — garde ambiance/options stables à la reprise. */
  seed: number;
  /** Descente atteinte : la traversée est finie (nœud terminal). */
  done: boolean;
};

function freshTraversal(current = ENTRY_SCENE): TraversalState {
  return {
    phase: "scene",
    current,
    visited: [current],
    // Longueur de traversée ×3 (retour playtest 24/07 : « trop court avant
    // l'Acte 2 »). 9 à 11 lieux avant la Descente (le pool en compte 15).
    target: 9 + Math.floor(Math.random() * 3), // 9, 10 ou 11 lieux
    liaisonOpts: null,
    seed: 0,
    done: false,
  };
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
  /** Écrans RESTANTS de la séquence de micro-beats (doctrine 4/08) — la
      reprise rejoue l'écran courant puis la suite, jamais la pile entière.
      Optionnel : les sauvegardes d'avant n'ont pas le champ. */
  feedSuite?: FeedEntry[][];
  /** L'effet de la relique portée a été CONSOMMÉ cette run (coussin dépensé,
      passe-verrou utilisé). Une relique = un geste par vie. Optionnel. */
  relicUsed?: boolean;
  /** Ambiances de liaison déjà SERVIES cette run — un événement de voyage ne
      revient jamais verbatim dans une même vie (retour test 4/08). Complétée
      en QUITTANT la liaison, pour que sa reprise reste déterministe. */
  liaisonVues?: string[];
  /** Dettes narratives en attente de règlement dans cette run (spec §17). */
  debts: PendingDebt[];
  /** Besace (13/07) : objets mundane, vidée à la mort. */
  besace: BesaceItem[];
  /** Objets réels des Landes déjà ramassés dans cette run (chantier 1 du 23/07) —
      un lieu ne redonne jamais deux fois son objet. */
  looted: string[];
  /** Rencontres (scènes de combat) traversées vivant — pour l'écran de mort. */
  encounters: number;
  /** Stats de la run (affichage Essence seulement pour l'instant). */
  stats: RunStats;
  /** Prologue « Le Seuil » — présent tant que la run existe (spec 16/07). */
  prologue: PrologueState;
  /** Traversée de la zone (spec 21/07) : liaisons + choix d'orientation. */
  trav: TraversalState;
  /**
   * Chapitre garanti de la traversée (chantier 2 du 23/07) : id d'un chapitre
   * de `LANDES_CHAPTERS` + stade (0 = pas amorcé, 1 = amorcé, 2 = développé,
   * 3 = résolu). Tiré au début d'une run neuve (Scene, avec la mémoire du
   * compte pour la rotation) ; null tant que rien n'est tiré.
   */
  chapter: { id: string; stage: 0 | 1 | 2 | 3 } | null;
  /**
   * Le Soupçon (chantier 3 du 23/07) : 0..6, JAMAIS affiché — il ne se lit que
   * dans le monde (paliers). 6 = procès du héros. Remis à 0 à chaque run.
   */
  soupcon: number;
  /** Dernier palier du Soupçon déjà MANIFESTÉ dans le monde (évite de rejouer
      la même manifestation ; redescend avec le Soupçon après un procès). */
  soupconSeen: number;
  /** Points d'intérêt déjà examinés dans le LIEU COURANT (spec 24/07 suite) —
      vidé en quittant le lieu. Un point exploré ne se re-propose pas. */
  poiSeen: string[];
  /**
   * Le Hameau (spec 24/07 suite §3) : on ne le « visite » pas, on y fait
   * HALTE. Deux séquences garanties hors tirage encadrent la traversée —
   * l'Entrée (première arrivée) et la Halte (nuit, avant la sortie de zone).
   * `serment` conditionne la Halte : juré → la grange ; refusé → nuit dehors.
   */
  hameau: {
    entree: boolean;
    serment: "jure" | "faux" | "refuse" | null;
    halte: boolean;
  };
  /**
   * Le SAVOIR (journal Notion 25/07 — « rendre l'exploration payante »).
   *
   * Flags d'information APPRISE en examinant un point d'intérêt. Un Savoir
   * n'ajoute jamais de puissance : il ouvre une **option qui n'existait pas**
   * dans une scène ultérieure (`Choice.requiresSavoir`). Aucun chiffre, aucune
   * stat, aucun marqueur « débloqué » tapageur — le choix apparaît comme les
   * autres.
   *
   * ⚠️ Portée = LA RUN. Le héros apprend, il meurt, le suivant repart neuf :
   * vidé à la mort exactement comme la Besace. Seules les Reliques traversent
   * la mort (pilier inchangé).
   *
   * Un Savoir n'est pas toujours une bonne carte : certaines options ouvertes
   * sont des aveux ou des paris (cf. le poteau gravé à ton nom).
   */
  savoirs: string[];
  /**
   * Fragments de chapitre déjà lus dans cette run (4e monnaie du dosage des
   * points d'intérêt). Index dans `Chapter.fragments` du chapitre courant :
   * un point d'intérêt qui « rend un fragment » sert le premier non encore lu.
   */
  fragmentsLus: number[];
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

/** Anciennes sauvegardes : stats sur 10 → ramenées à l'échelle 1..5 du prologue. */
function migrateStats(p: Partial<RunStats> | undefined): RunStats {
  if (!p || typeof p.courage !== "number") return randomStats();
  const fix = (v: number) => Math.max(1, Math.min(5, v > 5 ? Math.round(v / 2) : v));
  return {
    courage: fix(p.courage),
    ruse: fix(p.ruse ?? 3),
    instinct: fix(p.instinct ?? 3),
    empathie: fix(p.empathie ?? 3),
  };
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
    looted: [],
    encounters: 0,
    stats: randomStats(),
    // Tirage du prologue : 1 souvenir par stat, fixé pour toute la run.
    prologue: {
      memories: drawMemories().map(({ stat, entry }) => ({ stat, ...entry })),
      beat: 0,
      choices: [],
      done: false,
    },
    trav: freshTraversal(),
    chapter: null,
    soupcon: 0,
    soupconSeen: 0,
    poiSeen: [],
    hameau: { entree: false, serment: null, halte: false },
    savoirs: [],
    fragmentsLus: [],
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
            // Normalise les items d'avant le point 4 (ajoute slot/effets).
            besace: Array.isArray(p.besace) ? p.besace.map(normalizeItem) : startingBesace(),
            looted: Array.isArray(p.looted) ? p.looted : [],
            encounters: typeof p.encounters === "number" ? p.encounters : 0,
            stats: migrateStats(p.stats),
            // Runs d'avant le prologue : considérées comme un prologue déjà
            // rendu — elles reprennent directement au Jour courant.
            prologue:
              p.prologue && Array.isArray(p.prologue.memories)
                ? p.prologue
                : { memories: [], beat: 6, choices: [], done: true },
            // Traversée : reprise si présente ; sinon, run d'avant le 21/07 →
            // on amorce une traversée à partir de sa scène linéaire courante.
            trav:
              p.trav && typeof p.trav.current === "string" && Array.isArray(p.trav.visited)
                ? p.trav
                : freshTraversal(sceneAt(typeof p.step === "number" ? p.step : 0).id),
            // Chapitre : null pour les runs d'avant le 24/07 — Scene en tire un
            // à la volée (l'amorce jouera à la prochaine liaison).
            chapter: p.chapter && typeof p.chapter.id === "string" ? p.chapter : null,
            soupcon: typeof p.soupcon === "number" ? p.soupcon : 0,
            soupconSeen: typeof p.soupconSeen === "number" ? p.soupconSeen : 0,
            poiSeen: Array.isArray(p.poiSeen) ? p.poiSeen : [],
            hameau: p.hameau && typeof p.hameau.entree === "boolean"
              ? p.hameau
              : { entree: false, serment: null, halte: false },
            // Runs d'avant le Savoir (25/07) : elles reprennent sans rien
            // savoir. Les options débloquées n'apparaîtront que si le joueur
            // ré-examine les points concernés — pas de rattrapage rétroactif,
            // le Savoir se gagne en explorant.
            savoirs: Array.isArray(p.savoirs) ? p.savoirs : [],
            fragmentsLus: Array.isArray(p.fragmentsLus) ? p.fragmentsLus : [],
            // ⚠️ loadRun reconstruit la run CHAMP PAR CHAMP : tout champ absent
            // ici est SILENCIEUSEMENT PERDU au rechargement. Piège vérifié le
            // 4/08 (l'anti-répétition des liaisons ne filtrait rien).
            feedSuite: Array.isArray(p.feedSuite) ? p.feedSuite : [],
            relicUsed: Boolean(p.relicUsed),
            liaisonVues: Array.isArray(p.liaisonVues) ? p.liaisonVues : [],
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
    // Un prologue entamé compte comme une run en cours : fermer l'app en
    // plein Seuil doit proposer REPRENDRE et reprendre au même beat (§9).
    const prologueStarted = Boolean(p.prologue && !p.prologue.done && (p.prologue.beat ?? 0) > 0);
    return (Array.isArray(p.feed) && p.feed.length > 0) || (typeof p.step === "number" && p.step > 0) || prologueStarted;
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
