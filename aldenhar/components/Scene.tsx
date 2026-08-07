"use client";

import { useEffect, useRef, useState } from "react";
import Die3D, { type RollRequest } from "@/components/Die3D";
import ChoiceButton from "@/components/ChoiceButton";
import TouchHint from "@/components/TouchHint";
import TypedText from "@/components/TypedText";
import DeathScreen, { bilanDeMort, type Bilan } from "@/components/DeathScreen";
import GameMenu from "@/components/GameMenu";
import {
  DESCENTE_SCENE,
  ENTRY_SCENE,
  jailerTaunt,
  makeLiaison,
  pickLiaisonOptions,
  isHameauInterior,
  pickAccueil,
  HAMEAU_ACCUEIL_SLOT,
  sceneById,
  APPROACH_NARRATION,
  SOUPCON_PALIERS,
  tierIsFail,
  type Choice,
  type PointInteret,
  type LiaisonCtx,
  type Scene as SceneType,
  ligneCorbeaux,
  phraseArrivee,
  sceneEffective,
  corbeauxDuHameau,
  estHameau,
  DECOUVERTES_FILLE,
  COMPTEUR_FILLE,
  compteDecouvertesFille,
  APPARITION_TEMOIN,
  tailleTroupeau,
  ligneTroupeau,
  FRANCHIT_ENTREE,
  FRANCHIT_SORTIE,
} from "@/lib/scene-data";
import { contradictionsConnues, faitById, versionDuFait } from "@/lib/contradictions";
import { manifestationLoi } from "@/lib/loi-substitution";
import { perceptionDe } from "@/lib/perception";
import { acteAccusation, defensesDisponibles, temoinPour, temoinsUniques } from "@/lib/temoins";
import type { RelicDon } from "@/lib/reliques";
import {
  applique, noterVisite, parType, purger, type Effet, type Faits,
} from "@/lib/faits";
import {
  etat, etatsActifs, hintsEtats, modEtats, poserEtat, seuilEtats,
  PLAFOND_AFFICHAGE, type StatNom,
} from "@/lib/etats";
import { besoinsEchus, routeAForcer } from "@/lib/besoins";
import { loadRun, resetRun, saveRun, type FeedEntry, type RunState, type TraversalState } from "@/lib/state";
import {
  armerSurprise, surprisePrete, jourProphetie, texteProphetie, texteFantome,
  texteCitation, texteRetour, texteVol, texteTemoinRecite, OBJET_DU_VOLEUR,
  JAILER_METALEPTIQUE, JAILER_DE_IMPOSSIBLE, type SurpriseId,
} from "@/lib/surprises";
import { chapterById, drawChapter, LANDES_LORE_FRAGMENTS } from "@/lib/chapters-data";
import { playMusic } from "@/lib/audio";
import { loadSettings } from "@/lib/settings";
import { hasBesaceRoom, landesLoot, landesLootSlot, normalizeItem, passiveMod, randomRecompenseDestin, randomSoinMineur, RARITY_LABEL, type BesaceItem, type BesaceRarity } from "@/lib/besace";
import { assetUrl, assetCss, assetExiste } from "@/lib/assets";
import {
  activeRelic,
  bloodDebtFor,
  buildRegistre,
  entrySoftening,
  relicDon,
  relicDette,
  jailerPosture,
  loadMemory,
  mutateMemory,
  noterFait,
  recordDeath,
  recordRenoncement,
  type Relic,
} from "@/lib/player-memory";

// Pixels morts ambiants de l'état KO (palier « Au seuil », retour Patrick
// 14/07) : une nappe de pixels charbon épars + quelques braises orange qui
// scintillent sur tout l'écran — la mort se sent, sans jamais un chiffre.
// Générée une fois côté client, cachée au niveau module.
let decayCache: string | null = null;
function getDecayOverlay(): string | null {
  if (typeof document === "undefined") return null;
  if (!decayCache) {
    const W = 390,
      H = 800;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    let seed = 0xdead;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    ctx.fillStyle = "#1c1a16";
    for (let i = 0; i < 780; i++) {
      const s = rnd() < 0.7 ? 2 : 3;
      ctx.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H), s, s);
    }
    ctx.fillStyle = "#e0632a";
    for (let i = 0; i < 90; i++) {
      ctx.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H), rnd() < 0.8 ? 1 : 2, rnd() < 0.8 ? 1 : 2);
    }
    decayCache = c.toDataURL();
  }
  return decayCache;
}

let uidCounter = 0;
function nextId() {
  uidCounter += 1;
  return `e${uidCounter}-${Date.now().toString(36)}`;
}

/* Tirages et horloge sortis AU NIVEAU MODULE : le React Compiler (Next 16)
   refuse tout appel impur (`Math.random`, `Date.now`) atteignable depuis le
   corps du composant, même à travers un gestionnaire d'événement. Les isoler
   ici garde le composant analysable — et le hasard reste au même endroit
   logique (un tirage par appel, jamais mémoïsé). */
function chance(p: number): boolean {
  return Math.random() < p;
}
function nowMs(): number {
  return Date.now();
}

/** Flag de compte : un Serment a déjà été prêté du bout des lèvres, dans une
    vie d'avant. Ouvre l'accueil « le hameau qui s'en va » (6/08). */
const FLAG_SERMENT_TRAHI = "serment-trahi-jadis";

const PORTAL = "assets/dithering-portal.jpg";

// Image d'objet obtenu : le haut d'écran bascule sur l'objet quand une action
// en fait gagner un (demande Patrick 19/07).
//
// ⚠️ 26/07 — ces repli étaient les exports Figma en 68×68, affichés PLEIN CADRE
// dans le bandeau « Obtenu » : c'était le plus visible des « anciennes images »
// signalées par Patrick. Remplacés par les vraies icônes tramées 1000×1000, en
// gardant la même convention que le menu Inventaire (cf. BESACE_ICONS).
function objectImage(kind: BesaceItem["kind"]): string {
  if (kind === "arme") return "assets/objet_dague_os.png";
  if (kind === "babiole") return "assets/objet_grimoire.png";
  return "assets/objet_fiole_baume.png";
}

type ImageKind = "scene" | "object";

/* Ouverture/fermeture du sous-menu des descriptions (points d'intérêt). Ce ne
   sont PAS des choix de fiction : ils ne consomment ni tour ni dé. */
/** Quel état chaque besoin lève quand il est satisfait. */
const BESOINS_ETAT: Record<string, string> = {
  dormir: "boiteux",
  soigner: "fievreux",
  manger: "affame",
};

const OBSERVE_OPEN = "observe-open";
const OBSERVE_CLOSE = "observe-close";

// La position à l'écran ne doit jamais prédire le type de choix (CLAUDE.md) :
// Fisher-Yates seedé par le pas de progression (stable au re-render et à la
// reprise). La scène 0 garde l'ordre exact de la frame Figma.
function shuffleChoices<T>(choices: T[], step: number): T[] {
  const arr = [...choices];
  if (step === 0) return arr;
  let seed = (step * 9301 + 49297) >>> 0;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Contexte d'une liaison (chantier 4 du 23/07) : provenance + état de la run.
 * Reconstruit du même RunState à la reprise → même ambiance (déterminisme).
 */
function liaisonCtx(run: RunState, from: string | undefined): LiaisonCtx {
  return {
    // Un lieu scindé (chantier 5) se quitte depuis son écran « -2 » : on
    // normalise vers l'identité du lieu pour le matching des variantes.
    from: from?.replace(/-2$/, ""),
    soupcon: run.soupcon ?? 0,
    health: run.health,
    chapterId: run.chapter?.id ?? null,
    itemNames: (run.besace ?? []).map((i) => i.name),
    // Le village ne regarde pas de la même façon celui qui a juré, celui qui a
    // menti et celui qui a refusé — les vignettes de ruelle s'y adaptent (6/08).
    serment: run.hameau?.serment ?? null,
    // Ce que le COMPTE a compris sur la Fille : à partir d'une découverte,
    // elle ne fait plus que passer — elle parle (refonte 6/08, degré 3).
    decouvertesFille: compteDecouvertesFille(faitsDe(run)),
    // Anti-répétition (4/08) : liaisons déjà jouées (⇒ la phrase-signature ne
    // sert qu'à la 1re Croisée) + ambiances déjà servies (jamais deux fois le
    // même texte dans une run). ⚠️ `liaisonVues` n'est complétée qu'en
    // QUITTANT une liaison : pendant la liaison (et à sa reprise), la liste
    // est celle d'AVANT — la reconstruction retombe sur le même texte.
    liaisonsJouees: Math.max(0, (run.trav?.visited.length ?? 1) - 1),
    dejaVues: run.liaisonVues ?? [],
  };
}

/**
 * Écran courant déduit de l'état de traversée (spec 21/07) : la Descente
 * (terminal), une scène de liaison (reconstruite depuis ses 2 options), ou un
 * lieu/rencontre du pool. Pure : sert au rendu ET à la reprise de run.
 */
function sceneFromTrav(t: TraversalState, run?: RunState): SceneType {
  if (t.done) return DESCENTE_SCENE;
  if (t.phase === "liaison" && t.liaisonOpts)
    return makeLiaison(
      t.liaisonOpts[0],
      t.liaisonOpts[1],
      t.seed,
      run ? liaisonCtx(run, t.visited[t.visited.length - 1]) : undefined
    );
  return resoudre(t.current, run) ?? sceneById(ENTRY_SCENE)!;
}

/**
 * Résout un id de scène EN TENANT COMPTE DES VARIANTES (refonte du lore 6/08) :
 * la Femme au Seuil, la Veuve et le Fossoyeur ont une version qui ne se joue
 * qu'à partir d'une certaine découverte du COMPTE. Passer par ici plutôt que
 * par `sceneById` est ce qui fait que le village se met à parler d'un cran
 * dès qu'on a compris quelque chose — sans dupliquer la traversée.
 */
function resoudre(id: string, run?: RunState | null): SceneType | undefined {
  return sceneEffective(id, faitsDe(run));
}

/**
 * Modèle ÉCRAN PAR ÉCRAN (retour Patrick 19/07, maquette Figma 2072:54 —
 * remplace le flux scrollable §16). Un seul écran par scène :
 *   • illustration calée en haut (fixe) ;
 *   • texte de narration au milieu (se tape, défile SEULEMENT s'il dépasse) ;
 *   • bloc Geôlier dans le flux quand il parle ;
 *   • CTA ancrés en bas (fixes, adaptés à la hauteur du device), qui
 *     n'apparaissent qu'une fois le texte tapé à 100 %.
 * L'IMAGE ne change QUE si le contexte change (nouvelle scène) ou si un objet
 * est obtenu ; sinon elle reste et seul le texte change. Pas d'historique
 * accumulé : chaque écran remplace le précédent (fondu). Le dé, la santé, le
 * menu, la mort, les scènes chronométrées, les bannières et le Registre sont
 * conservés à l'identique.
 */
/**
 * MICRO-BEATS (doctrine 4/08, précisée par le retour externe du 4/08 soir) :
 * jamais plus de ~90 mots ininterrompus avant un geste. Les TEXTES écrits
 * respectent la grille (mesuré : max 102 mots par narration de scène) — mais
 * l'écran ASSEMBLÉ au runtime les empilait : phrase d'approche + narration du
 * lieu + beat de chapitre + dettes réglées, jusqu'à ~170 mots en 5 blocs
 * (capture Patrick du 4/08, l'arrivée au Moulin pendant le chapitre de la
 * Fille). Chaque pièce était dans la grille ; l'assemblage la violait.
 *
 * Ce découpeur transforme la pile en SÉQUENCE d'écrans : approche → arrivée →
 * chapitre → choix, un tap entre chaque. Règles :
 *   • budget ~90 mots de texte par écran ; on coupe AVANT le bloc qui
 *     déborderait — jamais au milieu d'un paragraphe ;
 *   • un bloc seul plus long que le budget reste entier (on ne coupe pas
 *     une phrase, on coupe entre les blocs) ;
 *   • les entrées non-texte (puce Jour, bannière d'état, Obtenu, Registre)
 *     pèsent zéro et restent collées au bloc qu'elles accompagnent ;
 *   • un groupe de fin sans aucun texte est fusionné avec le précédent.
 */
/**
 * LES TROIS PROMESSES BRANCHÉES (retour test 4/08 : « le passé crée le radar,
 * mais pas les chances ; les verrous ne consultent pas la nature du héros ;
 * les Reliques ne transforment pas la prochaine vie »).
 *   1. La stat du héros pèse sur CHAQUE jet : bonus = stat − 3 (1..5 → −2..+2).
 *   2. Un verrou avec `min` s'ouvre au héros dont la stat suffit.
 *   3. La DERNIÈRE relique forgée est portée par l'incarnation suivante.
 * Jamais un chiffre affiché : l'Anneau reflète le bonus, le verrou se lit au
 * losange, la relique se lit à sa fonction en mots.
 */
/**
 * LES DEUX SACS DE FAITS réunis pour la lecture (spec 4/08 §1). L'écriture,
 * elle, va toujours dans UN des deux : `persist()` pour la run, `mutateMemory`
 * pour le compte. Ne jamais garder le résultat en cache — il est reconstruit à
 * chaque usage, sinon on lit un état périmé après un `persist`.
 */
function faitsDe(run: RunState | null | undefined): Faits {
  return { run: { ...(run?.faits ?? {}) }, perm: { ...loadMemory().faits } };
}

/** Les découvertes déjà acquises par le COMPTE, pour le rendu. */
function idsDecouvertes(f: Faits): string[] {
  return parType(f, "discovery").map((d) => d.id);
}

/**
 * Pose une DÉCOUVERTE dans la mémoire du compte (refonte du lore 6/08).
 * Scope `global_permanent` : c'est ce que le joueur a compris, pas ce que sait
 * le héros — ça ne meurt pas avec lui. Idempotent : re-poser ne fait rien.
 */
function poserDecouverte(id: string): boolean {
  const f: Faits = { run: {}, perm: { ...loadMemory().faits } };
  if (f.perm[id]) return false;
  const effets: Effet[] = [
    { set: id, kind: "discovery", scope: "global_permanent", value: 1, source: "landes" },
  ];
  // Le SEUIL DU MOULIN se lit sur un compteur dérivé plutôt que sur une
  // condition qui saurait compter : le moteur n'a que `has` / `gte`, et lui
  // ajouter un « compte les faits de cette liste » serait une exception pour
  // un seul appelant. Le compteur est tenu ici, à la source, donc il ne peut
  // pas diverger de la liste.
  if (DECOUVERTES_FILLE.includes(id))
    effets.push({ increment: COMPTEUR_FILLE, by: 1, kind: "counter", scope: "global_permanent" });
  applique(effets, f, 0);
  mutateMemory((m) => { m.faits = f.perm; });
  return true;
}

/** Les ids des états actifs, dans l'ordre d'acquisition. */
function idsEtats(f: Faits): string[] {
  return parType(f, "state").map((x) => x.id);
}

function statDe(stats: RunState["stats"] | undefined, stat: string): number {
  const k = stat.toLowerCase() as keyof NonNullable<RunState["stats"]>;
  return stats?.[k] ?? 3;
}
function verrouOuvert(choice: Choice, stats: RunState["stats"] | undefined): boolean {
  if (!choice.locked) return true;
  if (choice.locked.min == null) return false; // verrou DUR (tease Acte II)
  return statDe(stats, choice.locked.stat) >= choice.locked.min;
}
/** Refus en diégèse (spec 4/08 B : jamais « Nécessite Empathie 3 »). */
const VERROU_DIEGESE: Record<string, string> = {
  COURAGE: "Il te faudrait plus de courage que tu n'en as.",
  RUSE: "Il te faudrait plus de ruse que tu n'en as.",
  INSTINCT: "Il te faudrait plus d'instinct que tu n'en as.",
  EMPATHIE: "Il te faudrait plus d'empathie que tu n'en as.",
};

/**
 * Un verrou DUR (sans `min`) ne s'ouvre à AUCUNE valeur de stat — c'est un
 * tease d'acte suivant, pas une exigence. Lui servir « il te faudrait plus de
 * courage » est un mensonge : le joueur peut monter la stat au maximum et
 * buter quand même. On dit la vraie raison, sans chiffre ni promesse de date.
 */
const VERROU_DUR = "La Descente ne s'ouvre pas encore. Ce n'est pas une question de courage.";

const MOTS_PAR_ECRAN = 90;
function decouperEnEcrans(entries: FeedEntry[]): FeedEntry[][] {
  const texte = (e: FeedEntry) =>
    e.kind === "narration" || e.kind === "jailer" ? (e as { text: string }).text.split(/\s+/).length : 0;
  const groupes: FeedEntry[][] = [];
  let cur: FeedEntry[] = [];
  let mots = 0;
  for (const e of entries) {
    const m = texte(e);
    if (m > 0 && mots > 0 && mots + m > MOTS_PAR_ECRAN) {
      groupes.push(cur);
      cur = [];
      mots = 0;
    }
    cur.push(e);
    mots += m;
  }
  if (cur.length) {
    if (mots === 0 && groupes.length) groupes[groupes.length - 1].push(...cur);
    else groupes.push(cur);
  }
  return groupes.length ? groupes : [entries];
}

export default function Scene() {
  const [step, setStep] = useState(0);
  // Écran courant : un lieu/rencontre OU une scène de liaison (traversée
  // 21/07). Remplacé à chaque transition — plus dérivé de `step` linéairement.
  const [scene, setScene] = useState<SceneType>(() => sceneById(ENTRY_SCENE)!);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roll, setRoll] = useState<RollRequest | null>(null);
  const [day, setDay] = useState(1);
  const [health, setHealth] = useState(1);
  // Contenu du SEUL écran courant (remplacé à chaque scène) — jamais tout
  // l'historique. Pas d'entrée `illustration`/`chosen` ici : l'image est un
  // état séparé, et l'action choisie n'est plus ré-affichée (écran par écran).
  const [beats, setBeats] = useState<FeedEntry[]>([]);
  const [image, setImage] = useState<string>(PORTAL);
  const [imageKind, setImageKind] = useState<ImageKind>("scene");
  // Points d'intérêt déjà examinés dans le lieu courant (spec 24/07 suite).
  const [poiSeen, setPoiSeen] = useState<string[]>([]);
  // Le SAVOIR (25/07) : flags appris en examinant. Miroir d'état de
  // `run.savoirs` — nécessaire au RENDU (les choix qui en dépendent doivent
  // apparaître dès l'écran suivant), alors que `runRef` n'est pas lisible
  // pendant le rendu (React Compiler).
  const [savoirs, setSavoirs] = useState<string[]>([]);
  // Les DÉCOUVERTES du COMPTE (refonte du lore 6/08). Même raison d'être que
  // `savoirs` — un miroir lisible au rendu — mais la source est la mémoire
  // permanente, pas la run : ce que le JOUEUR a compris survit à ses héros.
  const [decouvertes, setDecouvertes] = useState<string[]>([]);
  // La prophétie datée (surprise #4) : le jour parié, miroir de rendu pour la
  // puce Jour — elle blanchit à l'approche de la date.
  const [prophetieJour, setProphetieJour] = useState<number | null>(null);
  // Le choix qui expire (surprise #1) : id du choix en train de s'éroder, sa
  // phase (1..3), et l'id une fois RETIRÉ. L'érosion réutilise le visuel de
  // l'érosion de santé — même langage : ce qui s'use disparaît.
  const [expChoix, setExpChoix] = useState<{ id: string; phase: number } | null>(null);
  const [expRetire, setExpRetire] = useState<string | null>(null);
  const expTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Plan RAPPROCHÉ d'un point d'intérêt : crop de l'image du lieu (production
  // gratuite, spec §4 — on ne génère pas un asset par point). null = plan large.
  // Sous-menu « Observer les alentours » ouvert ? (retour Patrick 25/07 : 3 CTA
  // max par écran — les descriptions passent derrière un seul bouton.)
  const [poiOpen, setPoiOpen] = useState(false);
  // Mode debug de couverture visuelle (journal 25/07) : triple tap sur l'icône
  // de menu. Volontairement NON persisté — c'est un outil d'inspection, pas un
  // réglage ; il s'éteint au rechargement.
  const [debug, setDebug] = useState(false);
  const menuTaps = useRef<number[]>([]);
  // Dernière illustration de SCÈNE (repos de l'image). L'image d'objet n'est
  // qu'un remplacement momentané ; on revient toujours à cette scène-là.
  const lastSceneIlloRef = useRef<string>(PORTAL);
  // File de révélation séquentielle : les blocs de texte (narration/Geôlier)
  // tapent l'un après l'autre, jamais tous en même temps.
  const [activeTypingId, setActiveTypingIdState] = useState<string | null>(null);
  const activeTypingIdRef = useRef<string | null>(null);
  const revealQueueRef = useRef<string[]>([]);
  // Un id entre ici dès qu'il a commencé à se révéler (actif ou déjà fini).
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const revealedIdsRef = useRef<Set<string>>(new Set());
  // Les CTA n'apparaissent qu'une fois tout le texte de l'écran écrit.
  const [choicesHidden, setChoicesHidden] = useState(true);
  // Refus en diégèse d'un verrou (tap sur un choix fermé) — s'efface seul.
  const [verrouHint, setVerrouHint] = useState<string | null>(null);
  const verrouHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Miroirs de rendu (React Compiler interdit runRef.current au rendu) :
  // stats du héros (fixées au Seuil), effet de la relique portée, et son état
  // de consommation — une relique = un geste par vie.
  const [heroStats, setHeroStats] = useState<RunState["stats"] | undefined>(undefined);
  // Le DON de la relique portée (5/08) — remplace l'ancien trio d'effets.
  // « amorti » est le nouveau nom de « coussin ».
  const [relicFx, setRelicFx] = useState<RelicDon | null>(null);
  const [relicSpent, setRelicSpent] = useState(false);
  // Contradictions tenues par le COMPTE (deux versions d'un même fait, lues
  // dans deux vies) : ouvrent « Le Registre ment ». Lu une fois au montage.
  const [contradictions, setContradictions] = useState(0);
  /** Ids des états actifs — miroir de rendu (jamais runRef au render). */
  const [etatsIds, setEtatsIds] = useState<string[]>([]);
  /** États acquis depuis le dernier écran — leur manifestation reste à jouer.
      Une ref, pas un state : on ne veut pas re-rendre pour ça, et `advance`
      la vide au moment exact où elle sert. */
  const manifsEnAttente = useRef<string[]>([]);
  /** États dont la manifestation a déjà été jouée : eux seuls ont le droit de
      faire réagir le monde (sinon la réaction précède la cause). */
  const manifsJouees = useRef<Set<string>>(new Set());
  /** Lignes de guérison à dire au prochain écran (remède, pas échéance). */
  const guerisonEnAttente = useRef<string[]>([]);
  /** Besoin qu'un choix RISQUÉ satisfera — seulement si son jet réussit. */
  const besoinEnAttente = useRef<string | null>(null);
  // Défenses ouvertes au procès par les témoins réellement présents (5/08).
  // Miroir de rendu : jamais `runRef.current` pendant le render.
  const [defenses, setDefenses] = useState<string[]>([]);
  // Miroir de `run.trav.visited` pour le RENDU (React Compiler : jamais
  // `runRef.current` dans le corps du composant) — filtre des orientations
  // vers un lieu déjà traversé (retour 6/08 soir).
  const [visitedMirror, setVisitedMirror] = useState<string[]>([]);
  // Le RENONCEMENT est-il offert sur cet écran ? Serment juré ET tenu.
  const [renoncePossible, setRenoncePossible] = useState(false);
  // Écrans restants de la séquence courante (micro-beats). state + ref : les
  // handlers de tap lisent la ref, le rendu lit le state.
  const [beatsSuite, setBeatsSuiteState] = useState<FeedEntry[][]>([]);
  const beatsSuiteRef = useRef<FeedEntry[][]>([]);
  // Incrémenté à chaque tap dans la zone de texte : termine la frappe en cours.
  const [skip, setSkip] = useState(0);
  // Écran de mort : non-null dès que la santé tombe à zéro sur un jet raté.
  const [death, setDeath] = useState<{ epitaph: string; day: number; bilan: Bilan; relic: Relic; heroName: string; cause: string; firstDeath: boolean } | null>(null);
  // Scène chronométrée (§18) : true une fois le délai écoulé sans choix.
  const [timedExpired, setTimedExpired] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // LE VOLET D'ÉTAT (retour playtest 6/08 soir) : tap sur la puce d'un état
  // qu'on vient d'attraper → un volet monte du bas (1/3 de l'écran) avec le
  // détail. Affichage pur : ne consomme ni tour ni dé, se ferme au tap.
  const [voletEtat, setVoletEtat] = useState<{ id: string; label: string; positive: boolean } | null>(null);
  const [countdownArmed, setCountdownArmed] = useState(false);
  const runRef = useRef<RunState | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // 4e choix contextuel (spec 21/07 point 4) : objet ACTIF pertinent proposé
  // en scène. Calculé dans un effet (lecture Besace/santé hors rendu).
  const [activeChoice, setActiveChoice] = useState<Choice | null>(null);
  // Illustration rétrécie (retour 22/07) : passe à true UNIQUEMENT si le texte
  // fini déborde vraiment la zone — mesuré, adapté au device, une seule fois.
  const [compact, setCompact] = useState(false);

  function setBeatsSuite(g: FeedEntry[][]) {
    beatsSuiteRef.current = g;
    setBeatsSuiteState(g);
  }
  function setActiveTypingId(id: string | null) {
    activeTypingIdRef.current = id;
    setActiveTypingIdState(id);
  }
  function markRevealed(ids: string[]) {
    const next = new Set(revealedIdsRef.current);
    ids.forEach((id) => next.add(id));
    revealedIdsRef.current = next;
    setRevealedIds(next);
  }
  function advanceRevealQueue() {
    const next = revealQueueRef.current.shift() ?? null;
    if (next) markRevealed([next]);
    setActiveTypingId(next);
    // Tout le texte de l'écran est écrit : les CTA peuvent apparaître — SAUF
    // s'il reste des écrans dans la séquence (micro-beats) : c'est alors
    // « Touche pour continuer » qui prend la main, jamais les choix.
    if (next === null && beatsSuiteRef.current.length === 0) setChoicesHidden(false);
  }
  function enqueueReveal(ids: string[]) {
    if (ids.length === 0) {
      if (beatsSuiteRef.current.length === 0) setChoicesHidden(false);
      return;
    }
    revealQueueRef.current.push(...ids);
    if (!activeTypingIdRef.current) advanceRevealQueue();
  }
  function onTypedDone(id: string) {
    if (activeTypingIdRef.current !== id) return;
    // Suivi du bas UNIQUEMENT en fin de paragraphe (jamais pendant la frappe,
    // correctif 14/07), et confiné à la zone de texte (l'image + les CTA
    // restent fixes).
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    advanceRevealQueue();
  }

  const rolling = roll !== null;

  const rawChoices = timedExpired && scene.timed ? scene.timed.timeoutChoices : scene.choices;
  // Le SAVOIR (25/07) : un choix conditionné n'EXISTE pas tant que
  // l'information n'a pas été apprise en explorant. Filtré ici, donc avant le
  // mélange Fisher-Yates — une option débloquée prend une position quelconque
  // comme les autres, sans marqueur ni place réservée.
  // LES ÉTATS MODIFIENT LES CHOIX (spec 4/08 §2 — critère de validation :
  // « il modifie au moins un choix ou un jet »). Deux effets réels ici :
  //  • BOITEUX retire les options de FUITE — elles disparaissent, elles ne
  //    deviennent pas plus dures : on ne fuit pas sur une jambe ;
  //  • AFFAMÉ ouvre « voler », mais SEULEMENT là où il y a à voler.
  const etatsRendus = etatsActifs(etatsIds);
  const boiteux = etatsRendus.some((e) => e.cacheFuite);
  const affame = etatsRendus.some((e) => e.ouvreVol);
  const volPossible =
    affame && (scene.tags ?? []).some((t) => t === "food_available" || t === "stealable");
  const baseChoices = rawChoices.filter((c) => {
    // Retour playtest 6/08 soir : la brebis du Troupeau ramenait à un Champ
    // des Fixés DÉJÀ traversé — on rejouait le Fossoyeur mot pour mot. Un
    // choix d'orientation posé DANS une scène (hors Croisée : les options
    // d'une liaison sont déjà filtrées sur le non-visité) disparaît si sa
    // destination a été vue. La brebis y va quand même ; toi, tu sais déjà
    // ce qu'il y a au bout.
    if (c.orient && !scene.liaison && visitedMirror.includes(c.orient.dest))
      return false;
    // #1 Le choix qui expire (6/08) : une fois l'érosion finie, l'option
    // n'existe plus — perdre le temps coûte une occasion, jamais la vie.
    if (c.id === expRetire) return false;
    if (boiteux && (c.tags ?? []).includes("fuite")) return false;
    if (c.requiresSavoir && !savoirs.includes(c.requiresSavoir)) return false;
    // La DÉCOUVERTE (6/08) : même mécanique que le Savoir, mais la source est
    // le COMPTE. C'est ce qui permet à une option de n'exister qu'à partir de
    // la deuxième ou troisième vie, sans que le héros ait l'air de se souvenir.
    if (c.requiresDecouverte && !decouvertes.includes(c.requiresDecouverte)) return false;
    // Un état n'ouvre un choix QUE si l'état correspondant l'autorise vraiment
    // (FIXÉ → `ouvreConfidences`) : sans ce garde, `requiresEtat` deviendrait
    // un flag libre et l'état ne serait plus la raison de l'ouverture.
    if (c.requiresEtat) {
      const e = etatsRendus.find((x) => x.id === c.requiresEtat);
      // L'état doit AUTORISER l'ouverture, pas seulement être porté : FIXÉ
      // ouvre des confidences (`ouvreConfidences`), AFFAMÉ ouvre des prises de
      // nourriture (`ouvreVol` — le Troupeau sans Berger, 6/08). Sans ce
      // garde, `requiresEtat` deviendrait un flag libre et l'état ne serait
      // plus la raison de l'ouverture.
      if (!e || !(e.ouvreConfidences || e.ouvreVol)) return false;
    }
    // « Le Registre ment » (5/08) : une seule vie ne peut pas l'ouvrir. Le don
    // « lecture » d'une relique la rend visible sans l'avoir vécue — c'est
    // exactement ce que raconte cette relique.
    if (c.requiresContradiction && contradictions === 0 && relicFx !== "lecture") return false;
    // Défenses du procès : seules celles que les témoins rendent possibles.
    if (c.defense && !defenses.includes(c.defense)) return false;
    // Le renoncement n'est offert qu'à qui a juré ET tenu. Le hameau n'offre
    // pas une place à quelqu'un qu'il surveille.
    if (c.renonce && !renoncePossible) return false;
    return true;
  });
  // Les choix d'orientation d'une liaison gardent leur ordre (gauche/droite
  // stable) ; ailleurs, Fisher-Yates seedé pour casser les patterns de slot.
  // Le vol est ajouté AVANT le mélange : il prend une position quelconque,
  // comme n'importe quel autre choix — jamais un slot réservé.
  const avecVol: Choice[] = volPossible
    ? [
        ...baseChoices,
        {
          id: "voler-nourriture",
          label: "Prendre sans demander",
          poseEtat: "marque",
          repondBesoin: "manger",
          passive: {
            consequence:
              "Tu prends. C'est plus simple que tu ne l'aurais cru, et c'est " +
              "ça qui te reste après : pas la faim en moins, la facilité en plus. " +
              "Quelqu'un a vu. Tu ne sais pas qui — tu sais seulement que oui.",
          },
        },
      ]
    : baseChoices;
  const shuffledChoices = scene.liaison ? avecVol : shuffleChoices(avecVol, step);
  // Points d'intérêt encore inexplorés (spec 24/07 suite §1) : proposés EN TÊTE
  // des choix — ce sont les choses vues de loin à l'arrivée. Un point examiné
  // disparaît de la liste ; quand il n'en reste plus, seuls les choix du lieu
  // (l'événement / la sortie) subsistent.
  const openPois = (scene.pointsInteret ?? []).filter((p) => !poiSeen.includes(p.id));
  // ⚠️ Retour Patrick 25/07 : lister chaque point d'intérêt à côté des actions
  // du lieu donnait 4 à 5 CTA et cassait la règle des 3 choix par écran. Les
  // points passent donc derrière UN seul CTA « Observer les alentours » qui
  // ouvre la liste des descriptions. Ouvrir/fermer ce sous-menu ne consomme
  // ni tour, ni dé, ni changement d'image : c'est de l'affichage.
  // Quand le lieu offre encore des descriptions, les choix PASSIFS de la scène
  // (regarder, écouter, ne rien faire — pas de dé, pas de stat) rejoignent le
  // sous-menu : ils appartiennent au même registre contemplatif que les points
  // d'intérêt. Le niveau supérieur ne garde que les ACTES, ce qui ramène l'écran
  // aux 3 choix de la règle du jeu.
  // ⚠️ Garde-fou : on ne descend un passif que s'il RESTE un acte au niveau
  // supérieur. Sinon l'écran du Serment (dont les trois serments sont tous
  // passifs — jurer n'est pas un jet) se retrouvait vidé, avec le choix le plus
  // lourd de la zone caché derrière « Observer ». Un serment ne descend jamais.
  const hasPois = openPois.length > 0;
  // Un choix VERROUILLÉ ne descend jamais : c'est un acte fermé par la nature
  // du héros (promesse n°2), pas une contemplation — le voir grisé au niveau
  // supérieur fait partie de l'information (« ton incarnation ne peut pas »).
  const demotable = (c: Choice) => Boolean(c.passive) && !c.serment && !c.locked;
  const canDemote = hasPois && shuffledChoices.some((c) => !demotable(c));
  const acts = canDemote ? shuffledChoices.filter((c) => !demotable(c)) : shuffledChoices;
  const looks = canDemote ? shuffledChoices.filter(demotable) : [];
  /**
   * ⚠️ Retour Patrick 6/08 : « je devais compter les corbeaux, je n'ai plus
   * cette action ». Les corbeaux n'avaient pas disparu — ils étaient à DEUX
   * taps, derrière un libellé qui ne les annonce pas. La règle repliait TOUS
   * les points dès qu'il y en avait un, même quand l'écran avait des slots
   * libres : à la Colline, 1 seul acte + « Observer » = 2 CTA sur 3 autorisés,
   * et les quatre choses à voir invisibles.
   *
   * On remplit donc l'écran jusqu'à 3 avec les points d'intérêt eux-mêmes, et
   * « Observer les alentours » ne sert plus qu'au RELIQUAT. Si tout tient, le
   * bouton disparaît complètement. L'ordre d'écriture décide qui monte — les
   * points sont rangés du plus visible de loin au plus discret.
   */
  const SLOTS = 3;
  const placeLibre = Math.max(0, SLOTS - acts.length);
  const tousTiennent = openPois.length <= placeLibre && looks.length === 0;
  // Un « Observer » n'a de sens que s'il reste quelque chose dedans : il coûte
  // alors lui-même un slot.
  const nbPromus = tousTiennent ? openPois.length : Math.max(0, placeLibre - 1);
  const enPoi = (p: PointInteret): Choice => ({ id: `poi-${p.id}`, label: p.label, poi: p.id });
  const poiPromus = openPois.slice(0, nbPromus).map(enPoi);
  const poiCaches = openPois.slice(nbPromus);
  const poiGroup: Choice[] = poiOpen
    ? [
        ...poiCaches.map(enPoi),
        ...looks,
        { id: OBSERVE_CLOSE, label: "Ne rien regarder de plus" },
      ]
    : hasPois
      ? [
          ...poiPromus,
          ...(poiCaches.length || looks.length
            ? [{ id: OBSERVE_OPEN, label: "Observer les alentours" }]
            : []),
        ]
      : [];
  // Sous-menu ouvert : on n'affiche QUE les descriptions (sinon on cumule les
  // deux listes et on retombe à 5 boutons).
  // 4e choix contextuel (spec 21/07 point 4) : un objet ACTIF pertinent ajouté
  // en bas des choix (calculé hors rendu dans un effet — lit la Besace/santé).
  const withPois = poiOpen ? poiGroup : [...poiGroup, ...acts];
  const renderedChoices = activeChoice && !poiOpen ? [...withPois, activeChoice] : withPois;

  function persist(mutate: (run: RunState) => void) {
    const run = runRef.current ?? loadRun();
    mutate(run);
    runRef.current = run;
    saveRun(run);
  }

  /**
   * L'ACCUEIL DU JOUR (6/08). Résout le slot `hameau-entree-3` : tire l'accueil
   * la première fois, le range dans la run ensuite. Note aussi l'id dans la
   * mémoire du COMPTE — c'est ce qui permet à la vie suivante de ne pas
   * retomber dessus. Écrit au moment où l'accueil se JOUE, pas plus tôt : un
   * accueil tiré mais jamais atteint (mort avant le hameau) ne doit pas
   * consommer son tour de rotation.
   */
  /**
   * Verrouille LA surprise de la run (rationnement 6/08) : plafond à un,
   * et la mémoire retient la run — jamais deux runs de suite.
   */
  function jouerSurprise(id: SurpriseId | "metaleptique") {
    persist((r) => {
      r.surprise = { id, jouee: true };
    });
    mutateMemory((m) => {
      m.surprises = { derniereRun: m.runsStarted };
    });
  }

  function accueilDuJour(run: RunState): string {
    if (run.hameau?.accueil) return run.hameau.accueil;
    const mem = loadMemory();
    const id = pickAccueil({
      deaths: mem.deaths,
      sermentTrahiJadis: Boolean(mem.envFlags[FLAG_SERMENT_TRAHI]),
      precedent: mem.lastAccueil,
      seed: nowMs(),
    });
    persist((r) => {
      r.hameau = { ...r.hameau, accueil: id };
    });
    mutateMemory((m) => {
      m.lastAccueil = id;
    });
    return id;
  }

  /**
   * Accorde un objet réel des Landes s'il n'a pas déjà été ramassé cette run et
   * que son slot (actif/passif) a de la place. Retourne l'objet donné, ou null
   * (Besace pleine / déjà pris) — l'appelant décide quoi annoncer.
   */
  function grantLandesLoot(lootId: string): BesaceItem | null {
    const run = runRef.current ?? loadRun();
    const slot = landesLootSlot(lootId);
    if (!slot || (run.looted ?? []).includes(lootId) || !hasBesaceRoom(run.besace, slot)) return null;
    const item = landesLoot(lootId);
    if (!item) return null;
    persist((r) => {
      r.besace = [...r.besace, item];
      r.looted = [...(r.looted ?? []), lootId];
    });
    return item;
  }

  /**
   * Tap sur l'icône de menu. Trois taps en moins d'une seconde basculent le
   * mode debug de couverture visuelle AU LIEU d'ouvrir le menu ; un tap normal
   * ouvre le menu comme avant. Le seuil serré (600 ms entre deux taps) évite de
   * déclencher le debug en ouvrant le menu plusieurs fois d'affilée.
   */
  /** Enregistre un tap dans la fenêtre glissante et dit si le geste est complet. */
  function countMenuTap(): boolean {
    const now = nowMs();
    const taps = [...menuTaps.current, now].filter((t) => now - t < 700);
    menuTaps.current = taps;
    if (taps.length >= 3) {
      menuTaps.current = [];
      setDebug((d) => !d);
      return true;
    }
    return false;
  }

  function onMenuTap() {
    if (countMenuTap()) return; // 3e tap : debug au lieu d'ouvrir le menu
    setMenuOpen(true);
  }

  /**
   * Fragment de chapitre à servir (4e monnaie du dosage 25/07) : le premier
   * fragment du chapitre de la run encore non lu. Retourne son index pour que
   * l'appelant le marque comme lu, ou null s'il n'y a pas de chapitre / plus de
   * fragment disponible — un point d'intérêt qui « rend un fragment » ne rend
   * alors rien de ce côté, mais il porte toujours ses autres monnaies.
   */
  function takeChapterFragment(): { index: number; text: string } | null {
    const run = runRef.current ?? loadRun();
    const lus = run.fragmentsLus ?? [];
    const chap = run.chapter ? chapterById(run.chapter.id) : null;
    if (chap) {
      const index = chap.fragments.findIndex((_, i) => !lus.includes(i));
      if (index >= 0) return { index, text: chap.fragments[index] };
    }
    // Filet de la règle « jamais rien » : le chapitre est épuisé (ou absent) →
    // on sert un fragment de ZONE. Indexés à partir de 1000 pour ne jamais
    // collisionner avec les index du chapitre dans `fragmentsLus`.
    const zi = LANDES_LORE_FRAGMENTS.findIndex((_, i) => !lus.includes(1000 + i));
    if (zi >= 0) return { index: 1000 + zi, text: LANDES_LORE_FRAGMENTS[zi] };
    return null;
  }

  /** Pose un nouvel écran : remplace le texte, (ré)arme la révélation, masque
      les CTA le temps de la frappe. L'image n'est touchée que si `img` est
      fourni (sinon elle reste — « même scène, seul le texte change »). */
  function showScreen(entries: FeedEntry[], img?: { src: string; kind: ImageKind }) {
    if (img) {
      setImage(img.src);
      setImageKind(img.kind);
    }
    const groupes = decouperEnEcrans(entries);
    revealedIdsRef.current = new Set();
    setRevealedIds(new Set());
    revealQueueRef.current = [];
    setActiveTypingId(null);
    setChoicesHidden(true);
    setCompact(false); // nouvel écran : illustration pleine par défaut
    setPoiOpen(false); // et le sous-menu des descriptions se referme
    setBeats(groupes[0]);
    setBeatsSuite(groupes.slice(1));
    persist((run) => {
      // Persisté pour la reprise : run.feed = écran courant (petit), ce qui
      // garde aussi hasSavedRun() vrai dès la 1re scène (feed non vide).
      run.feed = groupes[0];
      run.feedSuite = groupes.slice(1);
    });
    enqueueReveal(groupes[0].filter((e) => e.kind === "narration" || e.kind === "jailer").map((e) => e.id));
  }

  /** L'écran suivant de la séquence (micro-beats) : REMPLACE — le lu est lu,
      l'illustration reste, l'image pleine revient (le nouvel écran est court). */
  function nextChunk() {
    const [tete, ...reste] = beatsSuiteRef.current;
    if (!tete) return;
    setBeatsSuite(reste);
    revealedIdsRef.current = new Set();
    setRevealedIds(new Set());
    revealQueueRef.current = [];
    setActiveTypingId(null);
    setCompact(false);
    setBeats(tete);
    persist((run) => {
      run.feed = tete;
      run.feedSuite = reste;
    });
    enqueueReveal(tete.filter((e) => e.kind === "narration" || e.kind === "jailer").map((e) => e.id));
  }

  // Reprise de run : fermer l'app ne compte jamais comme une mort. On restaure
  // l'écran COURANT (scène, jour, santé, états) — pas un scrollback complet.
  useEffect(() => {
    const run = loadRun();
    runRef.current = run;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration unique post-hydratation
    if (run.step > 0) setStep(run.step);
    setDay(run.day);
    setHealth(run.health);
    // Points d'intérêt déjà examinés dans le lieu courant : on ne les
    // re-propose pas à la reprise (spec 24/07 suite §1).
    setPoiSeen(run.poiSeen ?? []);
    // Le SAVOIR (25/07) : ce que le héros a appris survit à la fermeture de
    // l'app (pas à sa mort) — les options débloquées restent ouvertes à la
    // reprise.
    setSavoirs(run.savoirs ?? []);
    setDecouvertes(idsDecouvertes(faitsDe(run)));
    setProphetieJour(run.prophetie ?? null);
    setHeroStats(run.stats);
    setRelicSpent(Boolean(run.relicUsed));
    const memNow = loadMemory();
    const relicPortee = activeRelic(memNow);
    setRelicFx(relicDon(relicPortee));
    setContradictions(contradictionsConnues(memNow).length);
    setEtatsIds(idsEtats(faitsDe(run)));

    // Musique (24/07) : l'Acte I tourne sur les boucles des Landes (rotation
    // aléatoire des 3 pistes). Silencieux si les mp3 ne sont pas déployés.
    playMusic("landes");

    // Chapitre garanti (chantier 2 du 23/07) : chaque traversée en reçoit UN,
    // tiré avec la rotation du compte (jamais deux fois le même tant qu'il en
    // reste des neufs). Les runs d'avant en tirent un à la volée ici.
    if (!run.chapter && !run.trav.done) {
      const ch = drawChapter(loadMemory().chaptersSeen);
      run.chapter = { id: ch.id, stage: 0 };
    }

    const hasRun = run.step > 0 || (Array.isArray(run.feed) && run.feed.length > 0);
    if (hasRun) {
      // Écran courant reconstruit à neuf depuis l'état de TRAVERSÉE (liaison,
      // lieu, ou Descente) — l'ancien fil complet n'est jamais réaffiché. La
      // conséquence transitoire du dernier choix est perdue (sans importance).
      const cur = sceneFromTrav(run.trav, run);
      setScene(cur);
      setVisitedMirror(run.trav.visited);
      const illo = cur.illustration ?? PORTAL;
      lastSceneIlloRef.current = illo;
      setImage(illo);
      setImageKind("scene");
      const restored: FeedEntry[] = [];
      if (run.step === 0) restored.push({ id: nextId(), kind: "day", day: run.day });
      // ═══ #3 LE GEÔLIER MÉTALEPTIQUE (6/08) : fermer l'app en plein combat
      // et revenir. AUCUNE sanction — le pilier permadeath fictionnel reste
      // intouchable, et c'est ce qui rend le moment fort : il a remarqué, et
      // il ne fait rien. Hors armement (comportemental), même plafond 1/run.
      if (cur.combat && !run.surprise?.jouee) {
        restored.push({ id: nextId(), kind: "jailer", text: JAILER_METALEPTIQUE });
        run.surprise = { id: "metaleptique", jouee: true };
        mutateMemory((m) => { m.surprises = { derniereRun: m.runsStarted }; });
      }
      restored.push(...cur.narration.map((text): FeedEntry => ({ id: nextId(), kind: "narration", text })));
      setBeats(restored);
      // Déjà lu : tout est révélé d'emblée (affichage instantané), CTA visibles.
      markRevealed(restored.map((e) => e.id));
      setChoicesHidden(false);
      setBeatsSuite([]);
      run.feed = restored;
      run.feedSuite = [];
      saveRun(run);
    } else {
      // Run neuve : inscrite dans la mémoire du joueur (§17).
      const mem = mutateMemory((m) => {
        m.runsStarted += 1;
      });
      // LA DETTE DE LA RELIQUE PORTÉE (5/08) : une relique aide ET coûte. Les
      // dettes qui pèsent dès le départ se posent ici, une seule fois, au seed
      // de la run neuve — jamais à la reprise (sinon elles s'empileraient à
      // chaque ouverture de l'app).
      const dettePortee = relicDette(activeRelic(mem));
      if (dettePortee === "marque") run.soupcon = Math.min(6, (run.soupcon ?? 0) + 1);
      if (dettePortee === "usure") run.health = Math.min(run.health, 0.82);
      const opening = sceneFromTrav(run.trav); // = la Borne (ENTRY_SCENE)
      setScene(opening);
      setVisitedMirror(run.trav.visited);
      const illo = opening.illustration ?? PORTAL;
      lastSceneIlloRef.current = illo;
      setImage(illo);
      setImageKind("scene");
      const openingNarration = [...opening.narration];
      // Le hameau se souvient de la main qui lance le dé (chantier 3) : après
      // plusieurs fixations subies, l'accueil change dès l'entrée de zone.
      if (mem.fixations >= 2) {
        openingNarration.push(
          "Au loin, avant même le premier muret, une silhouette s'écarte du " +
            "chemin et part en courant vers le hameau. Les Landes ne " +
            "connaissent pas ton visage — mais elles connaissent ta manière " +
            "d'arriver. On t'attendra les bouches closes."
        );
      }
      // La dette « marque » se VOIT : on ne porte pas ça sans être reconnu.
      if (dettePortee === "marque") {
        openingNarration.push(
          "Ce que tu portes à même la peau tire le regard avant toi. Deux " +
            "gamins te croisent au premier muret, s'arrêtent net, et repartent " +
            "vers le hameau sans courir — ce qui est pire."
        );
      }
      if (dettePortee === "usure") {
        openingNarration.push(
          "Tu marches depuis peu et tes jambes le savent déjà. Ce que tu " +
            "portes ne pèse rien dans la main, et pourtant quelque chose en toi " +
            "a été prélevé pour le porter."
        );
      }
      // Persistance environnementale (§17) : trace des runs précédentes.
      if (mem.envFlags["echarde-gibet-prelevee"]) {
        openingNarration.push(
          "Au loin, sur sa colline, le Gibet Vide découpe le crépuscule — " +
            "et son montant porte une entaille claire, là où quelqu'un a " +
            "prélevé une écharde. Un autre jour. Un autre toi. Le bois n'a " +
            "pas repoussé. Les Landes s'en souviennent aussi."
        );
      }
      const seeded: FeedEntry[] = [
        { id: nextId(), kind: "day", day: run.day },
        ...openingNarration.map((text): FeedEntry => ({ id: nextId(), kind: "narration", text })),
      ];
      // Première apparition du dé = entrée du Jour I (spec prologue 16/07).
      if (run.prologue.done && run.prologue.memories.length > 0) {
        seeded.push({ id: nextId(), kind: "jailer", text: "À partir de maintenant, il décide avec moi." });
      }
      const groupes = decouperEnEcrans(seeded);
      setBeats(groupes[0]);
      setBeatsSuite(groupes.slice(1));
      revealQueueRef.current = groupes[0]
        .filter((e) => e.kind === "narration" || e.kind === "jailer")
        .map((e) => e.id);
      advanceRevealQueue();
      run.feed = groupes[0];
      run.feedSuite = groupes.slice(1);
      saveRun(run);
    }
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // À chaque bloc révélé, on garde le bas du texte visible (dans la zone de
  // texte uniquement — l'image et les CTA ne bougent pas).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [revealedIds]);

  // Illustration rétrécie si le texte FINI déborde (retour 22/07). Évalué une
  // fois la frappe terminée (jamais pendant — pas de saut), et une seule fois
  // par écran (compact ne repasse jamais à false ici → aucune oscillation :
  // rétrécir l'image agrandit la zone, ce qui résorbe le débordement).
  useEffect(() => {
    if (activeTypingId || compact) return;
    const zone = textRef.current;
    if (zone && zone.scrollHeight > zone.clientHeight + 4) setCompact(true);
  }, [activeTypingId, revealedIds, beats, compact]);

  // 4e choix contextuel (spec 21/07 point 4) : à chaque écran, on cherche un
  // objet ACTIF de la Besace utile ICI (un soin quand la santé baisse ou qu'une
  // blessure persiste). Lecture du run hors rendu — jamais pendant le render.
  useEffect(() => {
    const run = runRef.current;
    if (!run || scene.liaison || scene.terminal || scene.registre) {
      setActiveChoice(null);
      return;
    }
    const hasNeg = run.effects.some((e) => e.delta < 0);
    const hurt = run.health < 0.75 || hasNeg;
    const useful = run.besace
      .map(normalizeItem)
      .find((i) => i.slot === "actif" && ((i.heal && hurt) || (i.cure && hasNeg)));
    setActiveChoice(
      useful ? { id: `use-${useful.id}`, label: `Utiliser — ${useful.name}`, useItem: { itemId: useful.id } } : null
    );
  }, [scene, step, health, beats]);

  // ═══ #1 LE CHOIX QUI EXPIRE (6/08) : quand la surprise est armée et que
  // l'écran offre une OPPORTUNITÉ écrite (un gain — objet, savoir,
  // découverte), elle commence à s'éroder une fois les CTA jouables, puis
  // disparaît. GARDE-FOU : jamais l'option sûre, jamais la seule option,
  // jamais un choix d'orientation (la sortie) — perdre le temps coûte une
  // occasion, jamais la vie. Neutralisé par « Chronomètres : désactivés ».
  useEffect(() => {
    if (choicesHidden || expChoix || expRetire) return;
    if (loadSettings().chronosOff) return;
    if (scene.liaison || scene.combat || scene.timed) return;
    if (!surprisePrete(runRef.current, "choix-expire")) return;
    const cible = scene.choices.find(
      (c) => !c.orient && !c.locked && (c.grantsLoot || c.grantsSavoir || c.decouverte)
    );
    if (!cible || scene.choices.length < 2) return;
    jouerSurprise("choix-expire");
    const id = cible.id;
    // Érosion par PALIERS (steps, jamais un fondu — DA) : 5 s de répit, puis
    // trois crans de ruine à 2 s d'intervalle, puis le retrait.
    expTimers.current = [
      setTimeout(() => setExpChoix({ id, phase: 1 }), 5000),
      setTimeout(() => setExpChoix({ id, phase: 2 }), 7000),
      setTimeout(() => setExpChoix({ id, phase: 3 }), 9000),
      setTimeout(() => {
        setExpChoix(null);
        setExpRetire(id);
      }, 11000),
    ];
    // `jouerSurprise` est stable par construction (persist + mutateMemory) —
    // l'inclure re-déclencherait l'effet à chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choicesHidden, scene, expChoix, expRetire]);

  // Défenses du procès (5/08) : recalculées à chaque écran, parce qu'un témoin
  // peut s'ajouter et qu'un papier peut se ramasser jusqu'au dernier moment.
  useEffect(() => {
    const run = runRef.current;
    if (!run) return;
    setRenoncePossible(run.hameau?.serment === "jure" && (run.soupcon ?? 0) <= 1);
    if (!scene.fixationTrial) return;
    setDefenses(
      defensesDisponibles(
        temoinsUniques(run.temoins ?? []),
        (run.besace ?? []).map((i) => i.id)
      )
    );
  }, [scene, step]);

  function onTimedExpire(timed: NonNullable<SceneType["timed"]>) {
    setCountdownArmed(false);
    setTimedExpired(true);
    // L'inaction ouvre de nouvelles options : nouvel écran (même image).
    showScreen([{ id: nextId(), kind: "narration", text: timed.timeoutNarration }]);
  }

  // Scène chronométrée (§18) : le compte à rebours ne démarre que lorsque les
  // choix d'origine sont réellement jouables (texte fini, pas de dé, pas de
  // choix fait).
  useEffect(() => {
    if (timedTimer.current) {
      clearTimeout(timedTimer.current);
      timedTimer.current = null;
    }
    const timed = scene.timed;
    // Accessibilité (6/08) : « Chronomètres : désactivés » — le compte à
    // rebours ne s'arme jamais. Être interrompu ne coûte jamais rien.
    const canRun =
      !!timed && !timedExpired && !choicesHidden && !activeTypingId && !selectedId && !rolling &&
      !loadSettings().chronosOff;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflète l'armement du compte à rebours dans l'UI, synchronisé au cycle de la scène
    setCountdownArmed(canRun);
    if (canRun && timed) {
      timedTimer.current = setTimeout(() => onTimedExpire(timed), timed.ms);
    }
    return () => {
      if (timedTimer.current) {
        clearTimeout(timedTimer.current);
        timedTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, step, choicesHidden, activeTypingId, selectedId, rolling, timedExpired]);

  /**
   * Scène suivante = NOUVEL écran (remplace le précédent). L'image ne change
   * que si le contexte change (illustration de scène différente) ou si un objet
   * est obtenu ; sinon elle reste. Narration en paragraphes courts, puis le
   * Geôlier (rare). Les états temporaires se dissipent scène après scène (§2).
   */
  /**
   * POSER UN ÉTAT — le seul endroit du composant qui écrit un état.
   *
   * Passe par `poserEtat` (groupes d'exclusivité : un état ne chasse que ceux
   * de SON groupe — devenir Endetté ne guérit pas une jambe) puis par le
   * moteur de faits. La manifestation est mise en attente : elle se joue au
   * prochain écran, ce qui garantit le contrat de visibilité (§5) sans avoir à
   * la coller au milieu d'une conséquence de dé.
   */
  function poserEtatRun(id: string, dureeEnLieux?: number) {
    const e = etat(id);
    if (!e) return;
    const f = faitsDe(runRef.current);
    if (idsEtats(f).includes(id)) return; // un état ne s'empile pas sur lui-même
    applique(poserEtat(id, idsEtats(f), dureeEnLieux ? step + dureeEnLieux : undefined), f, step);
    persist((run) => {
      run.faits = f.run;
    });
    manifsEnAttente.current = [...manifsEnAttente.current, id];
    setEtatsIds(idsEtats(f));
  }

  /**
   * RÉPONDRE À UN BESOIN : l'horloge repart de ce jour-là et l'état qu'il avait
   * posé se lève. On ne touche QU'À CET état — manger guérit la faim, pas la
   * jambe : les groupes d'exclusivité restent respectés.
   */
  function repondreAuBesoin(b: string) {
    const soigne = BESOINS_ETAT[b];
    const e = soigne ? etat(soigne) : null;
    const avait = Boolean(soigne) && idsEtats(faitsDe(runRef.current)).includes(soigne);
    persist((run) => {
      run.besoins = { ...(run.besoins ?? {}), [b]: run.day };
      if (soigne && run.faits) delete run.faits[soigne];
    });
    if (avait) {
      setEtatsIds((l) => l.filter((x) => x !== soigne));
      manifsJouees.current.delete(soigne);
      // La guérison se DIT : sans ligne, un état qui se lève est invisible.
      if (e) guerisonEnAttente.current = [...guerisonEnAttente.current, e.guerison];
    }
  }

  function advance(opts?: {
    result?: number;
    fail?: boolean;
    consequence?: string;
    /** Récompense Besace d'un Destin (13/07) — annoncée dans l'écran. */
    destinItem?: BesaceItem | null;
    /** Objet réel gagné par la réussite d'un choix `grantsLoot` (23/07). */
    grantedItem?: BesaceItem | null;
    /** Beats à placer en tête (ex. puce Jour + soin au réveil du campement). */
    prepend?: FeedEntry[];
    /** Choix d'orientation (traversée 21/07) : force la destination (liaison → lieu). */
    toDest?: string;
    /**
     * Bascule vers une scène nommée qui n'est PAS un lieu du pool (rencontre
     * ouverte par un point d'intérêt, spec 24/07 suite). N'entre pas dans
     * `visited` : une rencontre ne compte pas comme un lieu traversé.
     */
    toScene?: string;
    /** Usure (chantier 1 du 23/07) : un échec dur hors combat COÛTE un jour — la
        puce Jour (déjà bumpée) s'affiche mid-scène, coût visible et non un simple
        texte. La valeur passée est le nouveau numéro de jour. */
    usureDay?: number;
  }) {
    const nextStep = step + 1;
    // ——— Résolution de la traversée (spec 21/07) ———
    // On quitte l'écran courant (`scene`). Le suivant est : le lieu choisi à une
    // liaison (toDest), la suite d'une chaîne de rencontre, la Descente (fin de
    // traversée), ou une nouvelle LIAISON (marche + orientation).
    const trav: TraversalState = { ...(runRef.current?.trav ?? loadRun().trav) };
    let routeForceePosee = false;
    // Une transition qui QUITTE une liaison ne fait pas vieillir les états.
    const leavingLiaison = Boolean(scene.liaison);
    // ═══ L'ÉLÉMENT-SURPRISE (catalogue 6/08) : armé UNE fois par run, au
    // premier pas. `{ id: "aucune", jouee: true }` évite de re-tirer — une
    // run sans surprise est une décision, pas un oubli.
    if (runRef.current && runRef.current.surprise === undefined) {
      const armee = armerSurprise(loadMemory(), Math.floor(nowMs() / 7) >>> 0);
      persist((r) => {
        r.surprise = armee ? { id: armee } : { id: "aucune", jouee: true };
      });
    }
    // Le choix qui expire ne survit jamais à l'écran : timers coupés, état vidé.
    expTimers.current.forEach(clearTimeout);
    expTimers.current = [];
    setExpChoix(null);
    setExpRetire(null);
    let nextScene: SceneType;
    // Le Soupçon au comble (chantier 3 du 23/07) : la traversée est DÉROUTÉE
    // vers le procès du héros — on vient te chercher, où que tu ailles. Jamais
    // au milieu d'une chaîne de rencontre (on finit d'abord ce qui te tient).
    const soupNow = runRef.current?.soupcon ?? 0;
    if (soupNow >= 6 && !scene.fixationTrial && !scene.chainNext && !trav.done) {
      nextScene = sceneById("proces-du-heros")!;
      trav.phase = "scene";
      trav.current = nextScene.id; // hors `visited` : ce n'est pas un lieu du pool
    } else if (opts?.toScene) {
      // Rencontre ouverte par un point d'intérêt : on reste « dans » le lieu du
      // point de vue de la traversée (rien n'entre dans `visited`), mais l'écran
      // courant devient le premier beat de la rencontre.
      nextScene = resoudre(opts.toScene, runRef.current) ?? sceneById(ENTRY_SCENE)!;
      trav.phase = "scene";
      trav.current = nextScene.id;
    } else if (opts?.toDest) {
      nextScene = resoudre(opts.toDest, runRef.current) ?? sceneById(ENTRY_SCENE)!;
      trav.phase = "scene";
      trav.current = opts.toDest;
      trav.liaisonOpts = null;
      if (!trav.visited.includes(opts.toDest)) trav.visited = [...trav.visited, opts.toDest];
    } else if (scene.hameauHalte) {
      // La nuit est passée : la traversée reprend vers la sortie de zone.
      nextScene = DESCENTE_SCENE;
      trav.done = true;
      trav.phase = "scene";
      trav.current = DESCENTE_SCENE.id;
    } else if (scene.chainNext) {
      // L'ACCUEIL DU JOUR (6/08) : `hameau-entree-3` n'est pas une scène mais
      // un SLOT — la façon dont le village te reçoit est tirée une fois par
      // vie. Trois chaînes y mènent (le seuil, la Femme au Seuil, le Gamin) :
      // les rediriger ici les couvre toutes, et l'id tiré est rangé dans la
      // run pour que la reprise retombe sur le même accueil.
      const cible =
        scene.chainNext === HAMEAU_ACCUEIL_SLOT
          ? accueilDuJour(runRef.current ?? loadRun())
          : scene.chainNext;
      nextScene = resoudre(cible, runRef.current) ?? DESCENTE_SCENE;
      trav.phase = "scene";
      trav.current = nextScene.id;
    } else if (trav.visited.length >= trav.target) {
      // ——— LA HALTE (spec 24/07 suite §3) : on ne quitte pas les Landes sans
      // avoir passé la nuit au Hameau. Séquence garantie hors tirage, jouée
      // juste avant la sortie de zone — à condition d'être entré au Hameau.
      // Serment juré (ou prêté du bout des lèvres) → la grange ; refusé →
      // « nuit dehors » : aucune porte ne s'ouvre à qui n'a pas juré.
      const ham = runRef.current?.hameau;
      if (ham?.entree && !ham.halte) {
        // Dette « exclusion » d'une relique portée (5/08, Clou du silence) :
        // le Hameau ne t'ouvre pas sa grange, quoi que tu aies juré. Même
        // conséquence qu'un Serment refusé — la nuit dehors.
        const exclu = relicDette(activeRelic(loadMemory())) === "exclusion";
        nextScene = resoudre(
          ham.serment === "refuse" || exclu ? "hameau-halte-dehors" : "hameau-halte-1",
          runRef.current
        )!;
        trav.phase = "scene";
        trav.current = nextScene.id; // hors `visited` : ce n'est pas un lieu du pool
      } else {
        nextScene = DESCENTE_SCENE;
        trav.done = true;
        trav.phase = "scene";
        trav.current = DESCENTE_SCENE.id;
      }
    } else {
      // ═══ LE TROUPEAU SANS BERGER (journal 6/08) ═══════════════════════
      // Croisé en MARCHANT, boucle EST, HORS du Hameau — sa force vient du
      // fait qu'on le croise seul, sans personne pour l'expliquer. Sur
      // tirage, au plus une fois par vie, jamais dans le pool (comme le
      // procès : il déroute la traversée, il n'y entre pas). Le Champ des
      // Fixés est exclu du `from` : la brebis y RETOURNE, la croiser en
      // sortant du champ n'aurait aucun sens.
      const fromEst = ["colline-aux-gibets", "pendu-qui-parle", "pendu-mal-fixe"]
        .includes(scene.id.replace(/-\d+$/, ""));
      const troupeauVu = Boolean((runRef.current?.faits ?? {})["vu:troupeau"]);
      if (fromEst && !troupeauVu && !scene.liaison && chance(0.35)) {
        nextScene = resoudre("troupeau-sans-berger", runRef.current)!;
        trav.phase = "scene";
        trav.current = nextScene.id; // hors `visited` : pas un lieu du pool
        persist((r) => {
          r.faits = {
            ...(r.faits ?? {}),
            "vu:troupeau": { id: "vu:troupeau", kind: "knowledge", scope: "run", value: 1 },
          };
        });
      } else {
      const seed = (nextStep * 101 + trav.visited.length * 7) >>> 0;
      const entered = Boolean(runRef.current?.hameau?.entree);
      const pair = pickLiaisonOptions(trav.visited, seed, entered);
      // LE DIRECTEUR DE ROUTES (spec §3) — « un héros fiévreux à qui le tirage
      // ne propose jamais le Rebouteux ne vit pas un dilemme : il subit une
      // punition procédurale. » On force UN slot vers un remède ; l'autre reste
      // au tirage. Ce n'est pas un sauvetage : la route sûre peut être longue,
      // et le joueur garde le droit de ne pas la prendre.
      const forcee = routeAForcer(
        idsEtats(faitsDe(runRef.current)),
        trav.visited,
        runRef.current?.croiseesDepuisRoute ?? 0
      );
      if (forcee && !pair.includes(forcee)) {
        pair[seed % 2] = forcee;
        routeForceePosee = true;
      }
      // Chapitre garanti (chantier 2 du 23/07) : tant que le développement n'a
      // pas été joué, son lieu figure TOUJOURS parmi les orientations offertes
      // (slot choisi par la graine pour ne pas être toujours le même bouton).
      // ⚠️ La garantie respecte la porte du Hameau (25/07) : deux des quatre
      // chapitres se jouent à l'intérieur du village (Petit Tribunal, Maison du
      // Bailli) — les forcer avant le barrage rouvrirait l'incohérence.
      const chapGuard = runRef.current?.chapter;
      const chapDef = chapGuard && chapGuard.stage < 2 ? chapterById(chapGuard.id) : null;
      if (
        chapDef &&
        !trav.visited.includes(chapDef.lieuId) &&
        !pair.includes(chapDef.lieuId) &&
        (entered || !isHameauInterior(chapDef.lieuId))
      ) {
        pair[seed % 2] = chapDef.lieuId;
      }
      // Signature garantie (chantier 6 du 23/07) : la Colline aux Gibets est
      // OFFERTE à chaque liaison tant qu'elle n'a pas été visitée — l'identité
      // de la zone ne doit pas pouvoir être manquée par malchance de tirage.
      // (Le joueur peut encore choisir l'autre direction : quasi-totalité, pas
      // obligation.) Compatible avec la garantie de chapitre : slots opposés.
      if (!trav.visited.includes("colline-aux-gibets") && !pair.includes("colline-aux-gibets")) {
        pair[(seed + 1) % 2] = "colline-aux-gibets";
      }
      // Ambiance contextuelle (chantier 4) : provenance = le lieu qu'on quitte.
      nextScene = makeLiaison(pair[0], pair[1], seed, liaisonCtx(runRef.current ?? loadRun(), scene.liaison ? undefined : scene.id));
      trav.phase = "liaison";
      trav.liaisonOpts = pair;
      trav.seed = seed;
      }
    }
    // ——— Soupçon (chantier 3) : montée à l'arrivée + manifestation ———
    // Le palier ne se MONTRE qu'une fois (soupconSeen), toujours en monde
    // lisible, jamais en chiffre. Le palier 6 n'a pas de texte : le procès
    // du héros EST sa manifestation.
    const soupAfter = Math.max(0, Math.min(6, soupNow + (nextScene.soupconOnArrival ?? 0)));
    const soupSeen = runRef.current?.soupconSeen ?? 0;
    const soupManifest =
      !nextScene.fixationTrial && soupAfter > soupSeen && soupAfter <= 5 && SOUPCON_PALIERS[soupAfter]
        ? SOUPCON_PALIERS[soupAfter]
        : null;

    // Savoir énoncé par la narration de la scène d'arrivée (25/07), s'il est neuf.
    const knownNow = runRef.current?.savoirs ?? [];
    const arrivalSavoir =
      nextScene.savoir && !knownNow.includes(nextScene.savoir) ? nextScene.savoir : null;
    // Découverte acquise en ATTEIGNANT la scène (6/08) : la Fille au Moulin
    // n'a pas de choix à prendre pour qu'on ait compris qu'elle est vivante —
    // l'avoir vue suffit.
    const arrivalDecouverte = nextScene.decouverte ?? null;

    const nextIllustration = nextScene.illustration ?? PORTAL;
    const contextChanged = nextIllustration !== lastSceneIlloRef.current;
    const entries: FeedEntry[] = [];
    let obtainedItem: BesaceItem | null = null;

    if (opts?.prepend) entries.push(...opts.prepend);
    // La conséquence du jet précède la mise en place de la scène suivante.
    if (opts?.consequence) {
      entries.push({ id: nextId(), kind: "narration", text: opts.consequence });
    }
    // Usure (chantier 1 du 23/07) : un échec dur a coûté un jour — la puce Jour
    // s'affiche ici, coût VISIBLE, juste après la conséquence de l'échec.
    if (opts?.usureDay !== undefined) {
      entries.push({ id: nextId(), kind: "day", day: opts.usureDay });
      entries.push({
        id: nextId(),
        kind: "narration",
        text: "La lande t'a pris un jour. La lumière a tourné sans que tu avances.",
      });
    }
    // Récompense du Destin : bandeau « Obtenu » juste après la conséquence.
    if (opts?.destinItem) {
      const it = opts.destinItem;
      obtainedItem = it;
      entries.push({ id: nextId(), kind: "obtenu", name: it.name, rarity: RARITY_LABEL[it.rarity as BesaceRarity], flavor: it.flavor });
    }
    // Objet gagné par un choix d'examen réussi (grantsLoot, 23/07) : même
    // bandeau « Obtenu » — déjà persisté côté Besace dans onComplete.
    if (opts?.grantedItem) {
      const it = opts.grantedItem;
      obtainedItem = it;
      entries.push({ id: nextId(), kind: "obtenu", name: it.name, rarity: RARITY_LABEL[it.rarity as BesaceRarity], flavor: it.flavor });
    }
    // Prix différé (§17) : une dette échue se règle ici, avant la scène suivante.
    const dueDebts = (runRef.current?.debts ?? []).filter((d) => d.settleAtStep <= nextStep);
    for (const d of dueDebts) {
      entries.push({ id: nextId(), kind: "narration", text: d.text });
    }
    // Rencontre de combat (spec §6) : annonce AVANT le texte (ordre Figma).
    if (nextScene.combat && nextScene.foeName) {
      entries.push({ id: nextId(), kind: "combat", foe: nextScene.foeName });
    }
    // Dette de sang (§19) : l'adversaire qui a déjà tué un des tiens te reconnaît.
    if (nextScene.foe) {
      const debt = bloodDebtFor(loadMemory(), nextScene.foe);
      if (debt) {
        entries.push({
          id: nextId(),
          kind: "narration",
          text:
            "Cette créature… quelque chose en elle te reconnaît. Elle a déjà " +
            `goûté au sang d'un des tiens — ${debt.heroName}, tombé ici avant ` +
            "toi. Elle n'a pas oublié. Toi non plus, maintenant.",
        });
      }
    }
    // ——— Chapitre garanti (chantier 2 du 23/07) : beats à moments FIXES ———
    // amorce → première liaison ; développement → arrivée dans le lieu dédié ;
    // résolution partielle → AVANT la narration de la Descente (sortie de zone).
    const chapSt = runRef.current?.chapter;
    const chap = chapSt && chapSt.stage < 3 ? chapterById(chapSt.id) : null;
    let chapterAfter: string[] = [];
    let chapterBefore: string[] = [];
    let newChapterStage: 1 | 2 | 3 | null = null;
    if (chap && chapSt) {
      if (nextScene.terminal) {
        chapterBefore = chap.resolution;
        newChapterStage = 3;
      } else if (nextScene.id === chap.lieuId && chapSt.stage < 2) {
        chapterAfter = chap.developpement;
        newChapterStage = 2;
      } else if (nextScene.liaison && chapSt.stage === 0) {
        chapterAfter = chap.amorce;
        newChapterStage = 1;
      }
    }
    entries.push(...chapterBefore.map((text): FeedEntry => ({ id: nextId(), kind: "narration", text })));
    // Approche d'un lieu (retour playtest 24/07) : en arrivant par une
    // orientation, on VOIT d'abord la destination se dresser et on y marche —
    // la transition entre deux lieux est jouée, plus jamais sautée.
    // LA COUTURE DU VILLAGE (6/08 soir) : si cette marche FRANCHIT la limite
    // du hameau, la ligne de franchissement précède l'approche — on ne se
    // téléporte plus d'un champ à une ruelle.
    if (opts?.toDest) {
      const origine = trav.visited.length >= 2 ? trav.visited[trav.visited.length - 2] : undefined;
      const entre = isHameauInterior(opts.toDest) && !isHameauInterior(origine);
      const sort = !isHameauInterior(opts.toDest) && isHameauInterior(origine);
      if (entre || sort) {
        const pool = entre ? FRANCHIT_ENTREE : FRANCHIT_SORTIE;
        entries.push({ id: nextId(), kind: "narration", text: pool[nextStep % pool.length] });
      }
    }
    if (opts?.toDest && APPROACH_NARRATION[opts.toDest]) {
      entries.push({ id: nextId(), kind: "narration", text: APPROACH_NARRATION[opts.toDest] });
    }
    // …et COMMENT on y arrive : une seule phrase, jamais un paragraphe.
    // ⚠️ VARIATION NARRATIVE, pas une décision (voir phraseArrivee) : le mode
    // ne dépend pas de la route choisie et n'a aucune conséquence mécanique.
    const arriveePhrase = opts?.toDest
      ? phraseArrivee(nextStep, runRef.current?.arriveeVues ?? [])
      : null;
    if (arriveePhrase) entries.push({ id: nextId(), kind: "narration", text: arriveePhrase });
    // LE PROCÈS (5/08) : on ne lit pas d'acte d'accusation, on appelle des
    // gens. Les dépositions s'intercalent entre l'arrivée au tribunal et la
    // sentence — le joueur relit sa propre run, dans l'ordre où il l'a jouée.
    //
    // Le don « silence » (Clou du silence) efface le PREMIER inscrit — celui
    // qui a entraîné les autres. Dépensé ici, une fois par vie.
    const bailloner =
      Boolean(nextScene.fixationTrial) &&
      relicDon(activeRelic(loadMemory())) === "silence" &&
      !runRef.current?.relicUsed;
    // Il n'apparaît qu'au procès de qui l'a déjà entrevu dans une ruelle.
    const temoinEntrevu =
      Boolean(nextScene.fixationTrial) && decouvertes.includes("d.temoin_entrevu");
    const temoinsAuProces = (() => {
      const t = temoinsUniques(runRef.current?.temoins ?? []);
      return bailloner ? t.slice(1) : t;
    })();
    const narrationLines = nextScene.fixationTrial
      ? [
          nextScene.narration[0],
          ...(bailloner
            ? [
                "Un nom manque à l'appel. On le cherche du regard sur les bancs, " +
                  "on ne le trouve pas, et personne ne dit tout haut pourquoi.",
              ]
            : []),
          ...acteAccusation(temoinsAuProces),
          // APPARITION 3 (refonte 6/08) : il n'entre au procès que de celui
          // qui l'a déjà entrevu — on ne saute pas les degrés. Il ne tue pas :
          // il regarde le vieux, et le vieux donne l'ordre. C'est tout le
          // personnage, et c'est ce que le joueur doit comprendre en mourant.
          ...(temoinEntrevu ? APPARITION_TEMOIN : []),
          // #10 (6/08) : à sa 3e apparition, il n'énonce pas une accusation
          // générique — il ASSEMBLE des fragments de décisions réelles, tirés
          // du journal citable. Cohérent avec sa nature : il ne condamne pas,
          // il témoigne. C'est le paiement du journal — hors rationnement,
          // puisque cette apparition tue et ne se rejoue pas.
          ...(temoinEntrevu && (runRef.current?.journalChoix?.length ?? 0) >= 3
            ? texteTemoinRecite((runRef.current?.journalChoix ?? []).slice(-3).map((j) => j.t))
            : []),
          ...nextScene.narration.slice(1),
        ]
      : nextScene.narration;
    entries.push(...narrationLines.map((text): FeedEntry => ({ id: nextId(), kind: "narration", text })));
    // ── LES ÉTATS (spec 4/08 §2 et §5, contrat de visibilité) ─────────────
    // Trois choses se jouent ici, dans cet ordre :
    //  1. les états ÉCHUS se lèvent (une phrase de guérison, jamais un silence) ;
    //  2. les états NEUFS se manifestent — dans les trois écrans suivant leur
    //     acquisition, exigence explicite du contrat de visibilité ;
    //  3. les états ANCIENS font réagir le monde, plus loin dans la run.
    const faitsAv = faitsDe(runRef.current);
    const leves = purger(faitsAv, nextStep);
    for (const id of leves) {
      const e = etat(id);
      if (e) entries.push({ id: nextId(), kind: "narration", text: e.guerison });
    }
    // Guérisons obtenues par un REMÈDE (le Rebouteux, un objet, une nuit) :
    // même traitement que les échues — elles se disent, jamais en silence.
    for (const g of guerisonEnAttente.current)
      entries.push({ id: nextId(), kind: "narration", text: g });
    guerisonEnAttente.current = [];
    const actifsIci = etatsActifs(idsEtats(faitsAv));
    // Manifestation immédiate : posée par `poserEtatRun`, jouée ici.
    for (const id of manifsEnAttente.current) {
      const e = etat(id);
      if (e) entries.push({ id: nextId(), kind: "narration", text: e.manifestation });
      manifsJouees.current.add(id);
    }
    manifsEnAttente.current = [];
    // Réaction du monde : une seule à la fois, tirée dans le pool de l'état le
    // plus ancien encore actif — deux réactions d'affilée noieraient la scène.
    const anciens = actifsIci.filter((e) => manifsJouees.current.has(e.id));
    if (anciens.length && chance(0.4)) {
      const e = anciens[nextStep % anciens.length];
      entries.push({
        id: nextId(),
        kind: "narration",
        text: e.reactions[Math.floor(nextStep / 2) % e.reactions.length],
      });
    }
    // LIGNES INTRUSES (Hanté) : une phrase qui n'appartient pas à la scène.
    // C'est tout leur intérêt — elles ne nomment jamais le lieu courant.
    const hante = actifsIci.find((e) => e.lignesIntruses?.length);
    if (hante?.lignesIntruses && chance(0.45)) {
      entries.push({
        id: nextId(),
        kind: "narration",
        text: hante.lignesIntruses[(nextStep * 3) % hante.lignesIntruses.length],
      });
    }

    // LA PERCEPTION (5/08) : ce que ce héros-LÀ remarque, parce qu'il est
    // ainsi fait. Une ligne, jamais deux — et jamais le nom de la stat.
    // Le don « regard » (Œil de lanterne verte) donne accès à ces lignes même
    // quand aucune stat n'atteint le seuil : voir avec les yeux d'un autre.
    // Elle tombe à chaque arrivée, quelle que soit la route : le mode
    // d'arrivée est de la couleur, il ne retient jamais une information.
    const perception = perceptionDe(
      nextScene.id,
      runRef.current?.stats,
      relicDon(activeRelic(loadMemory())) === "regard"
    );
    if (perception) entries.push({ id: nextId(), kind: "narration", text: perception });
    // LES CORBEAUX SUR LES TOITS (refonte du lore 6/08, §5) : le seul signal
    // permanent du Soupçon. Le joueur comprend qu'on le compte bien avant de
    // comprendre pourquoi — et ce n'est jamais un chiffre, c'est un nombre
    // d'oiseaux. Uniquement dans le village : ailleurs, les corbeaux de la
    // Colline comptent ses morts, et mélanger les deux lectures les détruit.
    if (estHameau(nextScene.id)) {
      const corb = corbeauxDuHameau(runRef.current?.soupcon ?? 0);
      if (corb) entries.push({ id: nextId(), kind: "narration", text: corb });
    }
    // ═══ LES SURPRISES CONTEXTUELLES (6/08) — la surprise ARMÉE attend son
    // contexte ; s'il n'arrive jamais, elle est perdue, on n'insiste pas.
    {
      const memS = loadMemory();
      const runS = runRef.current;
      if (surprisePrete(runS, "prophetie") && nextStep <= 6) {
        // #4 — un pari statistique, jamais un fait. Dit une fois, tôt.
        const jour = jourProphetie(memS, Math.floor(nowMs() / 13) >>> 0);
        entries.push({ id: nextId(), kind: "jailer", text: texteProphetie(jour) });
        persist((r) => { r.prophetie = jour; });
        setProphetieJour(jour);
        jouerSurprise("prophetie");
      } else if (surprisePrete(runS, "fantome") && nextScene.liaison) {
        // #6 — un nom réel du Registre, zéro infrastructure : indistinguable.
        const nom = memS.fallen[Math.floor(nowMs() / 17) % Math.max(1, memS.fallen.length)]?.name;
        if (nom) {
          entries.push({ id: nextId(), kind: "narration", text: texteFantome(nom) });
          jouerSurprise("fantome");
        }
      } else if (surprisePrete(runS, "retour") && !nextScene.liaison) {
        // #2 — le lieu EXACT de la dernière mort, jamais ailleurs.
        const lieu = memS.lastDeath?.lieu;
        if (lieu && nextScene.id.replace(/-\d+$/, "") === lieu) {
          const nom = memS.fallen[0]?.name ?? "Quelqu\u2019un";
          entries.push(...texteRetour(nom).map((text): FeedEntry => ({ id: nextId(), kind: "narration", text })));
          jouerSurprise("retour");
        }
      } else if (surprisePrete(runS, "citation") && !nextScene.liaison) {
        // #7 — mot pour mot, dix scènes plus tard, jamais hors du journal
        // citable : un texte qui sonne faux serait ridicule, pas troublant.
        const vieux = (runS?.journalChoix ?? []).filter((j) => nextStep - j.step >= 10);
        if (vieux.length > 0) {
          const ph = vieux[Math.floor(nowMs() / 11) % vieux.length].t;
          entries.push({ id: nextId(), kind: "narration", text: texteCitation(ph) });
          jouerSurprise("citation");
        }
      }
    }
    entries.push(...chapterAfter.map((text): FeedEntry => ({ id: nextId(), kind: "narration", text })));
    // Manifestation du Soupçon : le monde se ferme, palier par palier.
    if (soupManifest) entries.push({ id: nextId(), kind: "narration", text: soupManifest });
    // Objets RÉELS des Landes (chantier 1 du 23/07) : un lieu donne son objet
    // une seule fois, à l'arrivée, si le slot correspondant a de la place. Les
    // objets placés remplacent le soin générique — la Besace devient réelle,
    // portable, ancrée au lieu (icône tramée propre).
    const besace = runRef.current?.besace ?? [];
    const looted = runRef.current?.looted ?? [];
    // Un seul « Obtenu » par écran : si un Destin ou un gain de choix d'examen
    // est déjà annoncé, ni le loot d'arrivée ni le soin générique ne s'empilent
    // par-dessus (l'écran suivant garde une seule annonce, lisible).
    let dropped = Boolean(obtainedItem);
    const lootSlot = nextScene.loot ? landesLootSlot(nextScene.loot) : null;
    if (!dropped && nextScene.loot && lootSlot && !looted.includes(nextScene.loot) && hasBesaceRoom(besace, lootSlot)) {
      const item = landesLoot(nextScene.loot);
      if (item) {
        obtainedItem = item;
        dropped = true;
        const lootId = nextScene.loot;
        persist((run) => {
          run.besace = [...run.besace, item];
          run.looted = [...(run.looted ?? []), lootId];
        });
        entries.push({ id: nextId(), kind: "obtenu", name: item.name, rarity: RARITY_LABEL[item.rarity], flavor: item.flavor });
      }
    }
    // Soin générique de secours — désormais RARE (spec 23/07 : « peu de soins
    // disponibles », l'usure vient de la rareté du soin). Hors combat, et
    // seulement si aucun objet placé n'a été ramassé sur cette scène.
    if (
      !dropped &&
      !nextScene.combat &&
      !nextScene.registre &&
      !nextScene.liaison &&
      !nextScene.id.startsWith("campement") &&
      hasBesaceRoom(besace, "actif") &&
      chance(0.12)
    ) {
      const found = randomSoinMineur();
      obtainedItem = found;
      persist((run) => {
        run.besace = [...run.besace, found];
      });
      entries.push({ id: nextId(), kind: "obtenu", name: found.name, rarity: RARITY_LABEL[found.rarity as BesaceRarity], flavor: found.flavor });
    }
    // Le Grand Registre (§19) : classement inline, ligne du joueur marquée.
    if (nextScene.registre) {
      const run = runRef.current;
      const rows = buildRegistre(loadMemory(), run?.heroName ?? "toi", run?.day ?? 1);
      entries.push({ id: nextId(), kind: "registre", rows });
    }
    // LA LOI DU DOMAINE (5/08) : « rien n'est libéré, quelqu'un prend toujours
    // la place de quelqu'un d'autre. » Elle n'est JAMAIS énoncée — elle se
    // constate, cas après cas, dans ce que les gens racontent d'eux-mêmes.
    //
    // Servie UNIQUEMENT en LIAISON, et au plus une fois par vie : c'est une
    // rumeur de route, et c'est le seul écran où il reste de la place. Sur un
    // écran d'arrivée (approche + mode + narration + perception), elle ferait
    // exactement le mur de texte qu'on vient de démonter.
    const loiDejaVues = runRef.current?.loiVues ?? [];
    let loiIndex: number | null = null;
    if (nextScene.liaison && loiDejaVues.length === 0 && chance(0.22)) {
      const i = nextStep % 4;
      const manif = manifestationLoi("landes", i);
      if (manif) {
        loiIndex = i;
        entries.push({ id: nextId(), kind: "narration", text: manif.texte });
      }
    }
    const result = opts?.result;
    if (result === 1 || result === 20) {
      const posture = jailerPosture(loadMemory());
      entries.push({ id: nextId(), kind: "jailer", text: jailerTaunt(result, posture) });
    } else if (chance(0.12)) {
      entries.push({ id: nextId(), kind: "jailer", text: nextScene.jailerLine });
    }

    // Image du nouvel écran (demande Patrick 19/07) :
    //  • contexte changé → illustration de la nouvelle scène (repos de l'image) ;
    //  • sinon objet obtenu → image de l'objet (remplacement momentané) ;
    //  • sinon → on revient/reste sur l'illustration de scène (l'image ne bouge pas).
    let img: { src: string; kind: ImageKind };
    if (contextChanged) {
      lastSceneIlloRef.current = nextIllustration;
      img = { src: nextIllustration, kind: "scene" };
    } else if (obtainedItem) {
      // Icône réelle de l'objet si elle existe (objets des Landes), sinon
      // l'icône générique par type (arme/soin/babiole).
      img = { src: obtainedItem.illustration ?? objectImage(obtainedItem.kind), kind: "object" };
    } else {
      img = { src: lastSceneIlloRef.current, kind: "scene" };
    }

    setStep(nextStep);
    setScene(nextScene);
    setVisitedMirror(trav.visited);
    // On quitte l'écran : les points d'intérêt du lieu précédent sont oubliés
    // et l'image repasse en plan large (spec 24/07 suite §1).
    setPoiSeen([]);
    persist((run) => {
      run.step = nextStep;
      run.lastChoiceId = null;
      run.poiSeen = [];
      run.trav = trav;
      // Séquences garanties du Hameau (spec 24/07 suite §3) : une fois jouées,
      // elles ne se rejouent pas dans la traversée.
      if (scene.hameauEntree) run.hameau = { ...run.hameau, entree: true };
      if (scene.hameauHalte) run.hameau = { ...run.hameau, halte: true };
      // Les états ne vieillissent qu'en quittant un LIEU complet — ni une
      // liaison, ni un écran intermédiaire d'une séquence (chantier 5 : un
      // lieu = plusieurs beats, mais il ne compte QU'UNE fois pour l'usure
      // des états, sinon la profondeur les userait deux fois trop vite).
      if (!leavingLiaison && !scene.chainNext) {
        run.effects = run.effects
          .map((e) => ({ ...e, scenesLeft: e.scenesLeft - 1 }))
          .filter((e) => e.scenesLeft > 0);
      }
      run.debts = (run.debts ?? []).filter((d) => d.settleAtStep > nextStep);
      if (scene.combat) run.encounters = (run.encounters ?? 0) + 1;
      // Chapitre : le beat joué fait avancer le stade (0→1→2→3).
      if (newChapterStage && run.chapter) run.chapter = { ...run.chapter, stage: newChapterStage };
      // Soupçon : montée d'arrivée + palier manifesté mémorisé.
      run.soupcon = soupAfter;
      if (soupManifest) run.soupconSeen = soupAfter;
      if (nextScene.fixationTrial) run.soupconSeen = 6;
      // Un Soupçon d'arrivée qui monte a un TÉMOIN : quelqu'un t'a vu monter
      // là-haut. Le compteur devient quelqu'un (5/08).
      if ((nextScene.soupconOnArrival ?? 0) > 0) {
        const t = temoinPour(`${nextScene.id.replace(/-\d+$/, "")}-arrivee`);
        if (t && !(run.temoins ?? []).some((x) => x.id === t.id))
          run.temoins = [...(run.temoins ?? []), t];
      }
      // La loi du Domaine : manifestation servie, jamais deux fois par vie.
      if (loiIndex !== null) run.loiVues = [...(run.loiVues ?? []), loiIndex];
      // Le témoin bâillonné l'est DÉFINITIVEMENT (il ne réapparaîtra pas si le
      // Soupçon remonte après une relaxe), et la relique est dépensée.
      if (bailloner) {
        run.temoins = temoinsAuProces;
        run.relicUsed = true;
      }
      run.croiseesDepuisRoute = routeForceePosee ? 0 : (run.croiseesDepuisRoute ?? 0) + (nextScene.liaison ? 1 : 0);
      // COMPTEUR DE VISITES (spec §1, scope zone_permanent) : combien de fois
      // ce lieu a été vu, TOUTES vies confondues. Ne se remet jamais à zéro —
      // c'est lui qui portera les « strates de visite » (2ᵉ, 3ᵉ passage).
      run.faits = faitsAv.run;
      // Anti-répétition des phrases d'arrivée (retour 5/08 : « Tu es venu par
      // le flanc… » revenait plusieurs fois dans une même vie).
      if (arriveePhrase && !(run.arriveeVues ?? []).includes(arriveePhrase))
        run.arriveeVues = [...(run.arriveeVues ?? []), arriveePhrase];
      // Savoir livré par la narration de la scène (25/07) : certains PNJ disent
      // l'information d'eux-mêmes, avant qu'on ait pu la demander.
      if (arrivalSavoir) run.savoirs = [...(run.savoirs ?? []), arrivalSavoir];
    });
    if (arrivalSavoir) setSavoirs((s) => (s.includes(arrivalSavoir) ? s : [...s, arrivalSavoir]));
    if (arrivalDecouverte && poserDecouverte(arrivalDecouverte))
      setDecouvertes((xs) => [...xs, arrivalDecouverte]);
    // L'avoir VU se retient : c'est le dernier degré de l'arc, et il ne se
    // pose que quand il est réellement entré dans la salle.
    if (temoinEntrevu && poserDecouverte("d.temoin_vu"))
      setDecouvertes((xs) => [...xs, "d.temoin_vu"]);
    // Le compteur de visites vit dans la MÉMOIRE (zone_permanent) : il compte
    // les passages de TOUTES les vies, c'est là son intérêt.
    if (!nextScene.liaison && !nextScene.terminal) {
      mutateMemory((m) => {
        const f: Faits = { run: {}, perm: { ...m.faits } };
        noterVisite(f, nextScene.id);
        m.faits = f.perm;
      });
    }
    setEtatsIds(idsEtats(faitsDe(runRef.current)));
    if (bailloner) setRelicSpent(true);
    // Résolution jouée → le chapitre entre dans la rotation du compte (le
    // prochain tirage évitera ceux déjà vécus tant qu'il en reste des neufs).
    if (newChapterStage === 3 && chapSt) {
      mutateMemory((m) => {
        if (!m.chaptersSeen.includes(chapSt.id)) m.chaptersSeen = [...m.chaptersSeen, chapSt.id];
      });
    }
    // Rappel des états temporaires (retour Patrick 19/07) : après un jet de
    // dé, l'écran suivant s'ouvre sur les états encore actifs — un petit
    // libellé « état temporaire », le nom, jamais un chiffre.
    const activeEffects = runRef.current?.effects ?? [];
    // Le bandeau d'états : les NOUVEAUX états d'abord (spec 4/08), puis les
    // anciens effets narratifs le temps de la transition du combat.
    // ⚠️ PLAFOND D'AFFICHAGE de trois (spec §2) — ce n'est pas une limite du
    // système : les autres restent actifs et consultables dans Essence. On
    // garde les plus RÉCENTS : ce qui vient d'arriver au héros se lit d'abord.
    // ⚠️ Retour playtest 6/08 soir (« toujours apparent, casse l'interface ») :
    // le bandeau n'annonce plus les états ACTIFS à chaque écran — seulement
    // ceux qu'on VIENT d'attraper. Le détail vit dans le volet (tap sur la
    // puce) et dans Essence ; l'érosion de l'UI porte déjà l'état du corps.
    const tousActifs = [
      ...etatsActifs(idsEtats(faitsAv))
        .map((e) => ({ effectId: e.id, label: e.nom, positive: e.groupe === "faveur" })),
      ...activeEffects.map((e) => ({ effectId: e.id, label: e.label, positive: e.delta > 0 })),
    ];
    const dejaAnnonces = runRef.current?.etatsAffiches ?? [];
    const bandeau = tousActifs.filter((e) => !dejaAnnonces.includes(e.effectId)).slice(0, PLAFOND_AFFICHAGE);
    if (bandeau.length > 0) {
      entries.unshift({ id: nextId(), kind: "etat", effects: bandeau });
    }
    // La liste mémorisée reflète TOUS les actifs : un état levé puis repris
    // sera ré-annoncé (c'est une nouvelle prise), un état continu ne l'est plus.
    persist((run) => { run.etatsAffiches = tousActifs.map((e) => e.effectId); });
    setSelectedId(null);
    setRoll(null);
    setTimedExpired(false);
    showScreen(entries, img);
  }

  function onSelect(choice: Choice) {
    if (rolling || selectedId) return;
    if (choice.locked) {
      const run = runRef.current;
      const ouvert = verrouOuvert(choice, run?.stats);
      // Passe-verrou de la relique portée (effet « passe ») : UNE fois par
      // run, un verrou à seuil s'ouvre malgré la nature du héros — mais le
      // Hameau s'en souvient (+1 Soupçon). Jamais sur un verrou DUR.
      const relic = activeRelic(loadMemory());
      const passe =
        !ouvert &&
        choice.locked.min != null &&
        relic &&
        relicDon(relic) === "passe" &&
        !run?.relicUsed;
      if (!ouvert && !passe) {
        // Refus en diégèse (spec 4/08 B) : jamais un chiffre, jamais un cadenas.
        setVerrouHint(
          choice.locked.min == null
            ? VERROU_DUR
            : (VERROU_DIEGESE[choice.locked.stat] ?? "Ce n'est pas pour toi.")
        );
        if (verrouHintTimer.current) clearTimeout(verrouHintTimer.current);
        verrouHintTimer.current = setTimeout(() => setVerrouHint(null), 2600);
        return;
      }
      if (!ouvert && passe && relic) {
        const brise = relicDette(relic) === "brisure";
        persist((r) => {
          r.relicUsed = true;
          r.soupcon = Math.max(0, Math.min(6, (r.soupcon ?? 0) + 1));
          if (brise)
            r.effects = [
              { id: "ebranle", label: "ÉBRANLÉ", delta: -1, scenesLeft: 2 },
              ...r.effects.filter((e) => e.id !== "ebranle"),
            ];
        });
        setRelicSpent(true);
      }
    }
    setVerrouHint(null);
    // Sous-menu des descriptions : pur affichage. On ne passe pas par
    // `setSelectedId` (qui masque les CTA et enclenche une transition) — le
    // texte à l'écran, l'image et la scène ne bougent pas d'un pixel.
    if (choice.id === OBSERVE_OPEN) {
      setPoiOpen(true);
      return;
    }
    if (choice.id === OBSERVE_CLOSE) {
      setPoiOpen(false);
      return;
    }
    // Nœud terminal (la Descente, spec 21/07 « fin sèche ») : la traversée est
    // finie — on repart d'une run neuve (nouveau héros, Borne).
    if (scene.terminal) {
      // Renoncement (5/08) : la run s'arrête SANS mort. Le nom entre au
      // Registre avec sa mention, aucune relique n'est forgée — on ne forge
      // rien avec une vie qu'on n'a pas perdue. Enregistré AVANT le reset,
      // comme recordDeath : fermer l'app ici ne ressuscite pas la traversée.
      if (scene.renoncement) {
        const run = runRef.current ?? loadRun();
        recordRenoncement({ heroName: run.heroName, days: run.day, place: scene.id });
      }
      resetRun();
      window.location.reload();
      return;
    }
    setSelectedId(choice.id);
    setChoicesHidden(true);
    persist((run) => {
      run.lastChoiceId = choice.id;
    });

    // Choix d'orientation d'une liaison (traversée 21/07) : engage le
    // déplacement vers le lieu choisi — pas de dé, pas de conséquence propre.
    if (choice.orient) {
      const dest = choice.orient.dest;
      // L'ambiance de CETTE liaison rejoint les « déjà vues » au moment où on
      // la quitte — pas avant, pour que sa reprise reste déterministe.
      if (scene.liaison && scene.narration[0]) {
        const amb = scene.narration[0];
        persist((r) => {
          if (!(r.liaisonVues ?? []).includes(amb)) r.liaisonVues = [...(r.liaisonVues ?? []), amb];
        });
      }
      advanceTimer.current = setTimeout(() => advance({ toDest: dest }), 320);
      return;
    }

    // LE RENONCEMENT (5/08) : on ne franchit pas. La run bascule sur son nœud
    // terminal propre — pas de dé, pas de conséquence, juste un pas de côté.
    if (choice.renonce) {
      advanceTimer.current = setTimeout(() => advance({ toScene: "renoncer" }), 320);
      return;
    }

    // ÉTAT posé par le choix (spec §2) — le monde y réagira ensuite.
    if (choice.poseEtat) poserEtatRun(choice.poseEtat, choice.poseEtatDuree);
    // BESOIN satisfait : l'horloge repart de ce jour-là, et l'état qu'il avait
    // posé se lève (manger guérit la faim — pas la jambe : les groupes
    // d'exclusivité restent respectés, on ne touche qu'à CET état).
    // ⚠️ Un choix RISQUÉ ne répond au besoin QUE s'il réussit : le Rebouteux
    // qui recule d'un pas et refuse de te toucher ne peut pas lever ta fièvre.
    // On diffère donc jusqu'à la résolution du jet ; les choix sans dé
    // (passifs, repos, vol) répondent immédiatement.
    if (choice.repondBesoin) {
      if (choice.risky) besoinEnAttente.current = choice.repondBesoin;
      else repondreAuBesoin(choice.repondBesoin);
    }
    // Persistance environnementale (§17) : trace durable relue aux runs suivantes.
    if (choice.setsEnvFlag) {
      const flag = choice.setsEnvFlag;
      mutateMemory((m) => {
        m.envFlags[flag] = true;
      });
    }
    // ——— Point d'intérêt (spec 24/07 suite §1) : voir de loin → MARCHER →
    // toucher. On joue l'approche puis l'examen sur le MÊME lieu (pas de
    // transition de scène), l'image passe en plan rapproché, et les points
    // restants demeurent explorables. On ne se téléporte jamais sur un point.
    if (choice.poi) {
      const poi = (scene.pointsInteret ?? []).find((p) => p.id === choice.poi);
      if (poi) {
        const gained = poi.grantsLoot ? grantLandesLoot(poi.grantsLoot) : null;
        const entries: FeedEntry[] = [
          { id: nextId(), kind: "narration", text: poi.approche },
          { id: nextId(), kind: "narration", text: poi.examen },
          // Les Corbeaux du Compte (26/07 §6) : le décor lit la mémoire de
          // compte. Posé APRÈS l'examen — on voit d'abord les oiseaux, on
          // comprend leur nombre ensuite.
          ...(poi.corbeaux
            ? [{ id: nextId(), kind: "narration" as const, text: ligneCorbeaux(loadMemory().deaths) }]
            : []),
          // Le Troupeau sans Berger (6/08) : le comptage est CALCULÉ — il
          // grossit d'une run à l'autre, et personne ne l'annonce jamais.
          ...(poi.troupeau
            ? [{
                id: nextId(), kind: "narration" as const,
                text: ligneTroupeau(tailleTroupeau(loadMemory().runsStarted, loadMemory().fixations)),
              }]
            : []),
        ];
        if (gained) {
          entries.push({
            id: nextId(),
            kind: "obtenu",
            name: gained.name,
            rarity: RARITY_LABEL[gained.rarity],
            flavor: gained.flavor,
          });
        }
        // Le SAVOIR (25/07) : l'examen apprend une information qui ouvrira un
        // choix plus loin. Rien n'est annoncé — pas de bandeau, pas de « appris
        // : … ». Le joueur découvrira l'option le moment venu, ce qui fait de
        // l'exploration un investissement plutôt qu'une collection à cocher.
        const learned = poi.savoir && !savoirs.includes(poi.savoir) ? poi.savoir : null;
        if (learned) setSavoirs((s) => [...s, learned]);
        // …et la DÉCOUVERTE (6/08) : ce que le joueur, lui, vient de comprendre.
        // Rien n'est annoncé non plus — c'est le monde qui changera, plus tard.
        if (poi.decouverte && poserDecouverte(poi.decouverte)) {
          const d = poi.decouverte;
          setDecouvertes((xs) => [...xs, d]);
        }
        // Fragment de chapitre (4e monnaie) : le premier encore non lu du
        // chapitre de la run, servi comme un beat de narration en plus.
        const fragment = poi.chapterFragment ? takeChapterFragment() : null;
        if (fragment) entries.push({ id: nextId(), kind: "narration", text: fragment.text });
        // LE FAIT VARIABLE (5/08) : cette vie-ci tient UNE version pour vraie.
        // Elle est énoncée comme une vérité, sans réserve — le joueur ne peut
        // s'apercevoir de rien tant qu'il n'est pas mort et revenu.
        const version = poi.fait
          ? versionDuFait(poi.fait, loadMemory().runsStarted)
          : null;
        if (poi.fait && version) {
          entries.push({ id: nextId(), kind: "narration", text: version.texte });
          noterFait(poi.fait, version.id);
          setContradictions(contradictionsConnues(loadMemory()).length);
        }
        const seen = [...poiSeen, poi.id];
        setPoiSeen(seen);
        // ⚠️ PLUS DE CROP CSS (retour Patrick 26/07 : « ça ne rend pas bien »).
        // Observer un élément n'est plus un zoom dans l'image du lieu : le héros
        // se DÉPLACE et l'écran montre l'élément lui-même, via son image dédiée.
        // Sans image dédiée, l'image du lieu reste telle quelle — mieux vaut ne
        // rien changer qu'agrandir un détail qui devient illisible.
        persist((run) => {
          run.poiSeen = seen;
          if (poi.soupcon) {
            run.soupcon = Math.max(0, Math.min(6, (run.soupcon ?? 0) + poi.soupcon));
            // Le geste a été VU par quelqu'un de nommé (5/08) — il déposera.
            const t = poi.soupcon > 0 ? temoinPour(poi.id) : null;
            if (t && !(run.temoins ?? []).some((x) => x.id === t.id))
              run.temoins = [...(run.temoins ?? []), t];
          }
          if (learned) run.savoirs = [...(run.savoirs ?? []), learned];
          if (fragment) run.fragmentsLus = [...(run.fragmentsLus ?? []), fragment.index];
        });
        if (poi.poseEtat) poserEtatRun(poi.poseEtat);
        if (poi.setsEnvFlag) {
          const flag = poi.setsEnvFlag;
          mutateMemory((m) => {
            m.envFlags = { ...m.envFlags, [flag]: true };
          });
        }
        setSelectedId(null);
        setChoicesHidden(true);
        // Point qui OUVRE sur une rencontre : l'approche et l'examen restent
        // les beats de marche, puis l'écran bascule sur son premier beat — on
        // n'arrive jamais sur quelqu'un sans l'avoir vu de loin puis approché.
        if (poi.leadsTo) {
          advance({ toScene: poi.leadsTo, prepend: entries });
          return;
        }
        // Même scène, écran remplacé : l'image de l'ÉLÉMENT observé s'il en a
        // une, sinon on garde l'image du lieu inchangée.
        showScreen(entries, { src: poi.illustration ?? lastSceneIlloRef.current, kind: "scene" });
        return;
      }
    }

    // Le Serment des Renonçants (spec 24/07 suite §3) : engage la traversée —
    // il conditionne la Halte (grange vs nuit dehors) et la sortie de zone.
    if (choice.serment) {
      const s = choice.serment;
      persist((run) => {
        run.hameau = { ...run.hameau, serment: s };
      });
      // Un serment creux ne s'oublie pas avec la vie de celui qui l'a prêté
      // (6/08) : le COMPTE en garde la trace, et c'est ce qui rend tirable
      // l'accueil « le hameau qui s'en va » dans les vies suivantes — ils
      // partent parce que le dernier qui a juré ici a menti.
      if (s === "faux")
        mutateMemory((m) => {
          m.envFlags = { ...m.envFlags, [FLAG_SERMENT_TRAHI]: true };
        });
    }

    // Le Soupçon (chantier 3) : l'ACTE compte, pas son issue — le delta d'un
    // choix s'applique dès qu'il est pris. Silencieux, clampé 0..6.
    if (choice.soupcon) {
      // MARQUÉ : « le Soupçon monte deux fois plus vite ». La baisse, elle,
      // reste normale — être marqué ne facilite pas la réhabilitation.
      const marque = etatsRendus.some((e) => e.soupconDouble);
      const delta = choice.soupcon > 0 && marque ? choice.soupcon * 2 : choice.soupcon;
      // …et il a un TÉMOIN (5/08) : le compteur devient quelqu'un. Le don
      // « silence » d'une relique en efface un — le premier inscrit, celui qui
      // aurait entraîné les autres.
      const t = delta > 0 ? temoinPour(choice.id) : null;
      persist((run) => {
        run.soupcon = Math.max(0, Math.min(6, (run.soupcon ?? 0) + delta));
        if (t && !(run.temoins ?? []).some((x) => x.id === t.id))
          run.temoins = [...(run.temoins ?? []), t];
      });
    }
    // Le SAVOIR (25/07) : poser la question vaut lire une trace. Acquis à la
    // sélection, comme le Soupçon — ce qu'on a entendu ne dépend pas du jet.
    if (choice.grantsSavoir && !savoirs.includes(choice.grantsSavoir)) {
      const learnedNow = choice.grantsSavoir;
      setSavoirs((s) => [...s, learnedNow]);
      persist((run) => {
        run.savoirs = [...(run.savoirs ?? []), learnedNow];
      });
    }
    // Le JOURNAL CITABLE (socle des surprises 6/08) : les libellés des choix
    // tagués `citable`, avec leur pas. La citation et la récitation du Grand
    // Témoin n'ont pas d'autre source. Plafonné à 20 — un journal infini
    // ne servirait qu'à se relire.
    if ((choice.tags ?? []).includes("citable")) {
      const phrase = choice.label.replace(/[«»]/g, "").replace(/\.$/, "").trim();
      persist((run) => {
        run.journalChoix = [...(run.journalChoix ?? []), { t: phrase, step }].slice(-20);
      });
    }
    // La DÉCOUVERTE (6/08) : ce que le JOUEUR comprend. Posée à la sélection,
    // pour la même raison que le Savoir — avoir demandé suffit, l'issue d'un
    // éventuel jet ne change rien à ce qui vient d'être dit devant toi.
    if (choice.decouverte) {
      const d = choice.decouverte;
      if (poserDecouverte(d)) setDecouvertes((xs) => [...xs, d]);
    }
    // Prix différé (§17) : un choix « gratuit » peut poser une dette silencieuse.
    if (choice.debt) {
      const debt = choice.debt;
      persist((run) => {
        run.debts = [...(run.debts ?? []), { id: debt.id, settleAtStep: step + debt.settleInSteps, text: debt.text }];
      });
    }

    if (choice.risky) {
      // Armement du dé (spec §4) : le dé devient saisissable, hint contextuel.
      const effects = runRef.current?.effects ?? [];
      // Modificateur = états temporaires + objets PASSIFS portés (spec 21/07
      // point 4 : effet permanent, jamais un chiffre affiché — l'Anneau reflète).
      const passives = passiveMod(runRef.current?.besace ?? [], Boolean(scene.combat));
      // Promesse n°1 (4/08) : la stat du héros pèse ENFIN sur le jet.
      // bonus = stat − 3 (échelle 1..5 → −2..+2) ; jamais affiché, l'Anneau
      // reflète. Deux héros différents ont désormais des chances différentes.
      const statBonus = statDe(runRef.current?.stats, choice.risky.stat) - 3;
      // Relique portée : son DON aide, sa DETTE coûte — toujours les deux.
      const relicPortee = activeRelic(loadMemory());
      const don = relicDon(relicPortee);
      const dette = relicDette(relicPortee);
      const faveur = don === "faveur" ? 1 : 0;
      // « froideur » : les gens sentent ce que tu portes — un jet social de
      // moins. « gel » : le TOUT PREMIER jet de la vie part nu, sans le
      // secours d'aucun état ni d'aucune faveur.
      const froideur = dette === "froideur" && choice.risky.stat === "EMPATHIE" ? -1 : 0;
      const gele = dette === "gel" && (runRef.current?.rolls?.length ?? 0) === 0;
      // LES ÉTATS (spec 4/08 §2) — ils modifient le jet ET se disent sous
      // l'anneau. Un état qui pèse en silence serait « un chiffre camouflé »,
      // ce que la spec refuse explicitement.
      const actifs = etatsActifs(idsEtats(faitsDe(runRef.current)));
      const modEtat = modEtats(actifs, choice.risky.stat as StatNom);
      const modifier = gele
        ? passives + statBonus
        : effects.reduce((sum, e) => sum + e.delta, 0) + passives + statBonus + faveur + froideur + modEtat;
      // Courbe d'entrée invisible (spec 21/07) : seuil légèrement abaissé les
      // 2-3 premières morts, sans aucun affichage. L'Anneau, calculé sur ce
      // même seuil, montrera juste un peu plus d'encoches pleines — cohérent.
      const soft = entrySoftening(loadMemory());
      // Tension dans le dernier tiers de la zone (chantier 1 du 23/07) : les
      // derniers lieux avant la Descente durcissent d'un cran — invisible, mais
      // l'Anneau montre un peu moins d'encoches pleines. Contre partiellement la
      // courbe d'entrée : la fin d'une traversée ne doit jamais rester molle.
      const trav = runRef.current?.trav;
      const tension = trav && trav.visited.length >= trav.target - 1 ? 1 : 0;
      // Fiévreux relève le seuil des QUATRE stats d'un cran — pas un malus au
      // jet : une difficulté du monde entier, qui se lit dans l'Anneau.
      const threshold = Math.max(2, choice.risky.threshold - soft + tension + seuilEtats(actifs));
      // Beat fatal (30/07) : la scène sait AVANT le verdict si un palier
      // d'échec tue — santé − coût ≤ 0, ou procès de fixation raté. Le dé
      // s'en sert pour poser la face rongée et « MORT » au settle, à la
      // place du verdict ordinaire. Santé et nature de la scène capturées à
      // l'armement : rien ne les change pendant que le dé vole.
      const healthNow = runRef.current?.health ?? 1;
      const isTrial = Boolean(scene.fixationTrial);
      // #11 LE DÉ IMPOSSIBLE (6/08) : le prochain jet risqué s'immobilise
      // sur une face sans chiffre. AUCUNE conséquence mécanique — le palier
      // réel s'applique — et le Geôlier réagit à l'écran suivant (sans sa
      // réaction, le joueur croirait à un bug). Jamais sur un jet fatal.
      const impossibleIci =
        surprisePrete(runRef.current, "de-impossible") && !isTrial && healthNow > 0.3;
      if (impossibleIci) jouerSurprise("de-impossible");
      setRoll({
        key: nowMs(),
        stat: choice.risky.stat,
        threshold,
        outcomes: choice.risky.outcomes,
        modifier,
        impossible: impossibleIci,
        etatHints: hintsEtats(actifs),
        highStakes: choice.risky.highStakes,
        fatalCheck: (tier) => {
          if (!tierIsFail(tier)) return false;
          if (isTrial) return true;
          const cost = tier === "malediction" ? 0.25 : tier === "critique" ? 0.2 : 0.12;
          return healthNow - cost <= 0;
        },
      });
    } else if (choice.rest) {
      // Campement (spec §7, précisé 13/07) : le jour avance, blessures atténuées.
      // Plus AUCUNE consommation automatique d'objet (spec 21/07 point 4 :
      // « rien d'automatique, jamais ») — le soin d'un actif est une décision
      // du joueur (menu → Utiliser, ou 4e choix contextuel).
      // USURE (Etat.usureParJour) : la fièvre mange une part du repos. Elle ne
      // tue pas — garde-fou n°3 : un besoin ne tue jamais, il rend le reste
      // plus dur. Le plancher à 0.08 le garantit.
      const usure = etatsActifs(idsEtats(faitsDe(runRef.current)))
        .reduce((n, e) => n + (e.usureParJour ?? 0), 0);
      persist((run) => {
        run.day += 1;
        run.health = Math.max(0.08, Math.min(1, run.health + 0.35 - usure));
        // BESOINS (spec §3) : dormir est satisfait ici. Les besoins se comptent
        // en JOURS, jamais en scènes — garde-fou n°2 : un joueur qui traverse
        // vite n'aura presque jamais faim.
        run.besoins = { ...(run.besoins ?? {}), dormir: run.day };
        run.effects = run.effects
          .filter((e) => e.delta > 0 || e.scenesLeft >= 900)
          .map((e) => (e.scenesLeft >= 900 && e.delta < -1 ? { ...e, delta: -1 } : e));
      });
      const newDay = runRef.current?.day ?? day + 1;
      setDay(newDay);
      // …et les besoins NON satisfaits finissent par poser leur état. Aucune
      // jauge, aucun compteur : le besoin ne se manifeste QUE par l'état.
      for (const b of besoinsEchus(newDay, runRef.current?.besoins ?? {}, idsEtats(faitsDe(runRef.current)))) {
        poserEtatRun(b.etat);
      }
      setHealth(runRef.current?.health ?? 1);
      mutateMemory((m) => {
        m.bestDays = Math.max(m.bestDays, newDay);
      });
      const prepend: FeedEntry[] = [{ id: nextId(), kind: "day", day: newDay }];
      // ═══ #8 LE VOL NOCTURNE (6/08) : au réveil, un objet manque — remplacé
      // par un objet jamais ramassable ailleurs, TRAÇABLE. L'objet volé est
      // retenu (run.volNocturne) pour un paiement futur : le reconnaître au
      // cou de quelqu'un. La dague de départ n'est jamais prise — retirer
      // l'arme de base serait une punition, pas un mystère.
      if (surprisePrete(runRef.current, "vol-nocturne")) {
        const cible = (runRef.current?.besace ?? []).find((i) => i.id !== "dague-simple");
        if (cible) {
          const laisse = { ...OBJET_DU_VOLEUR, id: "de-os-etranger" };
          persist((run) => {
            run.besace = [...run.besace.filter((i) => i.id !== cible.id), laisse];
            run.volNocturne = cible.name;
          });
          prepend.push(
            ...texteVol(cible.name, laisse.name).map((text): FeedEntry => ({ id: nextId(), kind: "narration", text }))
          );
          jouerSurprise("vol-nocturne");
        }
      }
      advanceTimer.current = setTimeout(() => advance({ prepend }), 320);
    } else if (choice.useItem) {
      // 4e choix contextuel (spec 21/07 point 4) : utiliser un actif de la
      // Besace. Consommé, effet appliqué, la scène se résout ensuite.
      const itemId = choice.useItem.itemId;
      const item = (runRef.current?.besace ?? []).map(normalizeItem).find((i) => i.id === itemId);
      let consequence = "Tu utilises ce que tu portais. La lande ne te rendra rien en échange.";
      if (item) {
        persist((run) => {
          run.besace = run.besace.filter((i) => i.id !== itemId);
          if (item.heal) run.health = Math.min(1, run.health + item.heal);
          if (item.cure) run.effects = run.effects.filter((e) => e.delta > 0);
        });
        setHealth(runRef.current?.health ?? health);
        consequence = `Tu uses « ${item.name} ». ${item.cure ? "La plaie se referme, l'entaille cède enfin." : "Un peu de force te revient."}`;
      }
      advanceTimer.current = setTimeout(() => advance({ consequence }), 320);
    } else if (choice.passive) {
      // Le silence comme vraie option (§19) : conséquence dédiée, sans dé.
      // Un choix passif peut aussi DONNER (rencontres en beats du 24/07 suite :
      // accepter la mèche, raconter sa mort au Veilleur) — l'objet se mérite
      // par la décision, pas par un jet, puisqu'il n'y a pas de jet ici.
      const granted = choice.grantsLoot ? grantLandesLoot(choice.grantsLoot) : null;
      // « Le Registre ment » (5/08) : la conséquence écrite est le CADRE, ce
      // que le héros dit vient de la contradiction qu'il tient réellement —
      // deux versions du même fait, lues dans deux vies différentes.
      let consequencePassive = choice.passive.consequence;
      if (choice.requiresContradiction) {
        const tenues = contradictionsConnues(loadMemory());
        // Avec le don « lecture » et aucune contradiction vécue, on prend le
        // premier fait de la table : la relique fait lire ce qu'on n'a pas vu.
        const f = tenues[0] ?? faitById("fait-bailli");
        if (f) consequencePassive = `${f.accusation}\n\n${consequencePassive}`;
      }
      advanceTimer.current = setTimeout(
        () => advance({ consequence: consequencePassive, grantedItem: granted }),
        320
      );
    } else {
      // Choix neutre : résolution instantanée, sans dé (spec §4).
      advanceTimer.current = setTimeout(() => advance(), 320);
    }
  }

  // Paliers de santé discrets (spec §5) : Intact · Éprouvé · Entaillé · Au
  // seuil. ⚠️ « Marqué » a été RENOMMÉ « Éprouvé » (spec 4/08 §2) : le nom part
  // au nouvel état social, et deux choses homonymes seraient illisibles.
  const erosion = health < 0.25 ? 3 : health < 0.5 ? 2 : health < 0.75 ? 1 : 0;

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        className={`phone-frame relative flex h-[800px] max-h-[100dvh] w-[390px] shrink-0 flex-col overflow-clip bg-[var(--color-bg)] ${
          erosion ? `erosion-${erosion}` : ""
        }`}
      >
        {/* État KO (14/07) : nappe de pixels morts scintillante au palier critique. */}
        {erosion === 3 && (
          <div
            className="decay-overlay"
            style={
              typeof document !== "undefined" && getDecayOverlay()
                ? { backgroundImage: `url(${getDecayOverlay()})` }
                : undefined
            }
            aria-hidden
          />
        )}

        {/* En-tête : seule l'icône de menu flotte en haut à droite (spec §8).
            TRIPLE TAP = mode debug de couverture visuelle (journal 25/07) :
            affiche l'id de la scène et celui de l'image courante, pour repérer
            une image incohérente en JOUANT, sans fouiller le JSON. Réglage
            caché : rien ne l'annonce, et il ne survit pas au rechargement. */}
        <button
          type="button"
          aria-label="Menu"
          onClick={onMenuTap}
          className="absolute top-[11px] right-[10px] z-[5] grid size-[32px] cursor-pointer grid-cols-3 place-items-center border border-solid border-[var(--color-ink)] bg-[var(--color-bg)]/80 p-[8px]"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="block size-[1.6px] bg-[var(--color-ink)]" />
          ))}
        </button>

        {/* Mode debug : id de scène + id d'image, en petit dans un coin. */}
        {debug && (
          <div className="pointer-events-none absolute bottom-[2px] left-[4px] z-[6] font-[var(--font-body)] text-[9px] leading-[1.35] text-[var(--color-ink)]/50">
            <div>scène · {scene.id}</div>
            <div>image · {image.replace("assets/", "")}</div>
          </div>
        )}

        {/* Illustration calée EN HAUT (fixe). Ne se ré-anime (fondu) que quand
            sa source change — même scène = image immobile (demande Patrick).
            Hauteur adaptée au device (dvh), plafonnée ; RÉTRÉCIE sur une scène à
            texte dense (retour 22/07) pour laisser la place au texte, sans
            overlay ni fondu de pixels. */}
        <div key={image} className="image-swap illustration-frame shrink-0 relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src={assetUrl(image)}
            // Aucun zoom : l'élément observé a sa propre image (26/07).
            style={{ transform: "scale(1)" }}
            className={
              imageKind === "object"
                ? "pointer-events-none block h-[38dvh] max-h-[300px] min-h-[180px] w-full bg-[var(--color-bg)] object-contain [image-rendering:pixelated]"
                : compact
                  ? "pointer-events-none block h-[30dvh] max-h-[236px] min-h-[150px] w-full object-cover"
                  : "pointer-events-none block h-[44dvh] max-h-[352px] min-h-[200px] w-full object-cover"
            }
          />
          <div
            className="dissolve-bottom"
            style={{ backgroundImage: assetCss("assets/bande_dissolution_haut.svg") }}
            aria-hidden
          />
        </div>

        {/* Zone de texte — SEULE partie scrollable (si le texte dépasse malgré
            l'illustration rétrécie). Ne capte plus les taps pendant le lancer. */}
        <div
          ref={textRef}
          onPointerDown={() => {
            // Frappe en cours → la finir ; écran fini + séquence en attente →
            // écran suivant. Le même geste sert les deux, dans cet ordre.
            if (activeTypingIdRef.current) setSkip((s) => s + 1);
            else if (beatsSuiteRef.current.length) nextChunk();
            else setSkip((s) => s + 1);
          }}
          className={`scene-text-zone relative min-h-0 flex-1 overflow-y-auto px-[17px] pt-[16px] ${rolling ? "pointer-events-none" : ""}`}
        >
          <div key={step + (timedExpired ? "-t" : "")}>
            {beats.map((entry) => (
              <FeedItem
                key={entry.id}
                entry={entry}
                typed={entry.id === activeTypingId}
                revealed={revealedIds.has(entry.id)}
                skip={skip}
                onDone={() => onTypedDone(entry.id)}
                prophetie={prophetieJour}
                onEtat={(id, label, positive) => setVoletEtat({ id, label, positive })}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Scène chronométrée (§18) : compte à rebours VISUEL (jauge), jamais un chiffre. */}
        {countdownArmed && scene.timed && (
          <div className="timed-countdown relative z-[3]" aria-hidden>
            <div
              className="timed-countdown-fill"
              style={{ ["--timed-ms" as string]: `${scene.timed.ms}ms` }}
            />
          </div>
        )}

        {/* Séquence de micro-beats : il reste des écrans — l'affordance
            globale (26/07) remplace les choix, le tap avance. `bottom: 14`
            pour rester sous la zone de texte, au-dessus du filet des CTA. */}
        {!activeTypingId && beatsSuite.length > 0 && !rolling && (
          <TouchHint bottom={14} />
        )}

        {/* CTA ancrés en bas (fixes), masqués tant que le texte n'est pas
            entièrement écrit — puis fondu. Pendant le lancer, ils ne captent
            plus les événements (sinon un bouton avale la saisie du dé). */}
        <div
          className={`choices-bar relative z-[3] flex w-full shrink-0 flex-col gap-[10px] border-t border-[var(--color-ink)]/15 px-[15px] py-[15px] ${
            rolling ? "pointer-events-none" : ""
          } ${choicesHidden || activeTypingId ? "choices-hidden" : ""}`}
        >
          {verrouHint && (
            <p className="pointer-events-none text-center font-mono text-[11px] italic leading-[1.4] text-[var(--color-ink)] opacity-60">
              {verrouHint}
            </p>
          )}
          {renderedChoices.map((choice) => (
            <ChoiceButton
              key={scene.id + choice.id + step}
              choice={choice}
              unlocked={Boolean(
                choice.locked &&
                  (verrouOuvert(choice, heroStats) ||
                    (choice.locked.min != null && relicFx === "passe" && !relicSpent))
              )}
              selected={selectedId === choice.id}
              raised={rolling && selectedId === choice.id}
              erosion={expChoix?.id === choice.id ? Math.max(erosion, expChoix.phase) : erosion}
              onSelect={onSelect}
            />
          ))}
        </div>

        {/* Dé d20 tactile — apparaît au clic d'un choix risqué. */}
        <Die3D
          request={roll}
          onComplete={(result, outcome, tier) => {
            const engaged = Boolean(scene.combat) && roll?.stat === "COURAGE";
            const destinItem = tier === "destin" ? randomRecompenseDestin(engaged) : null;
            // Usure (chantier 1 du 23/07) : un échec DUR (critique/malédiction)
            // hors combat coûte un JOUR — coût visible. En combat, le coût
            // visible est l'aggravation ENTAILLÉ (persistante) déjà posée.
            const hardFail = tier === "critique" || tier === "malediction";
            // Un guide connaît les raccourcis : l'échec dur ne coûte plus le
            // JOUR qu'il coûte d'habitude. Bénéfice réel, jamais chiffré — il
            // se lit au fait que la puce « Jour » ne bouge pas.
            const guide = etatsActifs(idsEtats(faitsDe(runRef.current))).some((e) => e.evitePerteJour);
            const usureDay = hardFail && !scene.combat && !guide;
            // Objet gagné par un choix d'examen réussi (grantsLoot, 23/07) :
            // l'objet se mérite — jamais accordé sur un palier d'échec.
            const chosen = scene.choices.find((c) => c.id === selectedId);
            let grantedItem: BesaceItem | null = null;
            if (chosen?.grantsLoot && !tierIsFail(tier)) {
              const lootId = chosen.grantsLoot;
              const lootSlot = landesLootSlot(lootId);
              const cur = runRef.current!;
              if (lootSlot && !(cur.looted ?? []).includes(lootId) && hasBesaceRoom(cur.besace, lootSlot)) {
                grantedItem = landesLoot(lootId);
              }
            }
            // Relique « coussin » (commune, portée depuis la dernière mort) :
            // le PREMIER coup dur de la run est amorti au coût d'un échec
            // simple — puis la relique est fendue pour cette vie. Le verdict
            // affiché ne change pas (le jet a bien été critique) : c'est la
            // CONSÉQUENCE qui est prise par la relique, pas le dé.
            let combatPerdu = false;
            const relicCoussin = activeRelic(loadMemory());
            const amorti =
              (tier === "malediction" || tier === "critique") &&
              relicCoussin &&
              relicDon(relicCoussin) === "amorti" &&
              !runRef.current?.relicUsed;
            // Dette « brisure » : la relique rompt en amortissant, et la
            // secousse reste dans les bras (ÉBRANLÉ, 2 scènes).
            const brisure = amorti && relicDette(relicCoussin) === "brisure";
            persist((run) => {
              run.rolls.push({ step, choiceId: selectedId ?? "roll", result, at: nowMs(), ok: !tierIsFail(tier) });
              let cost =
                tier === "malediction" ? 0.25 : tier === "critique" ? 0.2 : tier === "echec" ? 0.12 : tier === "justesse" ? 0.06 : 0;
              if (amorti) {
                cost = 0.12;
                run.relicUsed = true;
                if (brisure)
                  run.effects = [
                    { id: "ebranle", label: "ÉBRANLÉ", delta: -1, scenesLeft: 2 },
                    ...run.effects.filter((e) => e.id !== "ebranle"),
                  ];
              }
              // (miroir de rendu mis à jour après le persist, plus bas)
              run.health = Math.max(0, run.health - cost);
              if (usureDay) run.day += 1;
              if (tier === "destin" || (scene.combat && !tierIsFail(tier)))
                run.effects = [
                  { id: "aguerri", label: "AGUERRI", delta: 2, scenesLeft: 3 },
                  ...run.effects.filter((e) => e.id !== "aguerri"),
                ];
              // BOITEUX : « chute, piège, COMBAT PERDU ». Posé hors persist,
              // juste après (poserEtatRun a son propre persist).
              if (scene.combat && tierIsFail(tier)) combatPerdu = true;
              if (scene.combat && tierIsFail(tier))
                run.effects = [
                  { id: "entaille", label: "ENTAILLÉ", delta: -2, scenesLeft: 999 },
                  ...run.effects.filter((e) => e.id !== "entaille"),
                ];
              else if (tier === "malediction")
                run.effects = [
                  { id: "entaille", label: "ENTAILLÉ", delta: -2, scenesLeft: 3 },
                  ...run.effects.filter((e) => e.id !== "entaille"),
                ];
              // Destin : ajouté si le slot correspondant a de la place (2
              // actifs / 2 passifs). Sinon le bandeau « Obtenu » reste, mais la
              // Besace pleine impose un vrai arbitrage (l'objet est perdu).
              if (destinItem && hasBesaceRoom(run.besace, normalizeItem(destinItem).slot))
                run.besace = [...run.besace, destinItem];
              // Gain d'un choix d'examen (grantsLoot) : déjà validé (place +
              // pas encore ramassé) — on l'inscrit à la Besace et au registre
              // des ramassages de la run.
              if (grantedItem && chosen?.grantsLoot) {
                run.besace = [...run.besace, grantedItem];
                run.looted = [...(run.looted ?? []), chosen.grantsLoot];
              }
              // Soupçon : échouer un jet SOCIAL (Empathie, hors combat) se
              // remarque — on a vu quelqu'un parler mal, ou parler seul.
              if (tierIsFail(tier) && !scene.combat && !scene.fixationTrial && roll?.stat === "EMPATHIE") {
                run.soupcon = Math.min(6, (run.soupcon ?? 0) + 1);
                const t = temoinPour("echec-empathie");
                if (t && !(run.temoins ?? []).some((x) => x.id === t.id))
                  run.temoins = [...(run.temoins ?? []), t];
              }
              // Procès du héros gagné : le hameau a jugé, il se lasse — le
              // Soupçon retombe (et pourra remonter, avec ses manifestations).
              if (scene.fixationTrial && !tierIsFail(tier)) {
                run.soupcon = 3;
                run.soupconSeen = 3;
              }
            });
            const run = runRef.current!;
            // Le remède ne prend QUE si le jet a tenu — le Rebouteux qui
            // refuse de te toucher ne lève rien. Un échec ne reporte même pas
            // l'horloge du besoin : rien ne s'est passé.
            if (besoinEnAttente.current) {
              if (!tierIsFail(tier)) repondreAuBesoin(besoinEnAttente.current);
              besoinEnAttente.current = null;
            }
            // État qui ne coûte qu'au RATÉ (eau de la Mare, seuil forcé vu).
            if (chosen?.poseEtatSiEchec && tierIsFail(tier))
              poserEtatRun(chosen.poseEtatSiEchec);
            // …et celui qui ne s'obtient QU'au jet tenu (un compagnon accepte
            // ou refuse ; il ne vient pas quand il vient de te dire non).
            if (chosen?.poseEtatSiReussite && !tierIsFail(tier))
              poserEtatRun(chosen.poseEtatSiReussite, chosen.poseEtatDuree);
            // Le compagnon détale au premier combat — et ça se dit.
            if (scene.combat) {
              const f = etatsActifs(idsEtats(faitsDe(runRef.current))).find((e) => e.fuitLeCombat);
              if (f) {
                const ff = faitsDe(runRef.current);
                applique([{ clear: f.id }], ff, step);
                persist((r) => { r.faits = ff.run; });
                setEtatsIds(idsEtats(ff));
                guerisonEnAttente.current = [...guerisonEnAttente.current, f.fuitLeCombat!];
              }
            }
            if (combatPerdu) poserEtatRun("boiteux");
            // FIXÉ : « le village te croit marqué par le sud (Soupçon élevé) ».
            // Seuil 4 : assez haut pour que ce soit une trajectoire, assez bas
            // pour qu'on le vive avant le procès (qui tombe à 6).
            if ((run.soupcon ?? 0) >= 4) poserEtatRun("fixe");
            setHealth(run.health);
            if (usureDay) setDay(run.day);
            if (amorti) setRelicSpent(true);

            // Mort par fixation (chantier 3 du 23/07, validée) : un jet raté
            // au procès tue, quelle que soit la santé — première mort du jeu
            // sans aucun combat, purement sociale, traitée comme toutes les
            // autres (relique + fragment + épitaphe). Le hameau s'en souvient
            // par-delà les runs (fixations).
            if (scene.fixationTrial && tierIsFail(tier)) {
              const epitaph = outcome.text.replace(/\s*♦.*$/, "");
              const firstDeath = loadMemory().deaths === 0;
              // La relique RÉELLEMENT portée pendant cette vie — lue AVANT
              // recordDeath, qui pousse celle que cette mort vient de forger.
              const porteeNom = activeRelic(loadMemory())?.name ?? null;
              mutateMemory((m) => {
                m.fixations += 1;
              });
              const relic = recordDeath({
                heroName: run.heroName,
                days: run.day,
                cause: "le Hameau des Renonçants",
                place: scene.id,
                killer: { entity: "hameau-renoncants", label: "le Hameau des Renonçants" },
                fixation: true,
              });
              const dead = { epitaph, day: run.day, bilan: bilanDeMort(run, porteeNom), relic,
                heroName: run.heroName, cause: "le Hameau des Renonçants", firstDeath };
              resetRun();
              setDeath(dead);
              return;
            }

            // Permadeath réel (spec §9) : santé à zéro sur un jet raté = mort.
            if (run.health <= 0 && tierIsFail(tier)) {
              const epitaph = outcome.text.replace(/\s*♦.*$/, "");
              const cause = scene.foeName ?? "les Landes";
              // Jalon de première fois (spec 21/07) : lu AVANT recordDeath (qui
              // incrémente `deaths`) — le Geôlier accueille, pas de moquerie.
              const firstDeath = loadMemory().deaths === 0;
              // La relique RÉELLEMENT portée pendant cette vie — lue AVANT
              // recordDeath, qui pousse celle que cette mort vient de forger.
              const porteeNom = activeRelic(loadMemory())?.name ?? null;
              const relic = recordDeath({
                heroName: run.heroName,
                days: run.day,
                cause,
                place: scene.id,
                // La surprise « le retour » (6/08) : le lieu EXACT, en radical.
                lieu: scene.id.replace(/-\d+$/, ""),
                killer: scene.foe ? { entity: scene.foe, label: scene.foeName ?? scene.foe } : undefined,
              });
              const dead = { epitaph, day: run.day, bilan: bilanDeMort(run, porteeNom), relic,
                heroName: run.heroName, cause, firstDeath };
              resetRun();
              setDeath(dead);
              return;
            }
            advance({
              result,
              fail: outcome.fail,
              prepend: roll?.impossible
                ? [{ id: nextId(), kind: "jailer", text: JAILER_DE_IMPOSSIBLE }]
                : undefined,
              consequence: amorti && relicCoussin
                ? `${outcome.text}\n\n${relicCoussin.name} a pris le choc à ta place. Une fêlure la traverse, à présent — elle ne prendra pas le suivant.`
                : outcome.text,
              destinItem,
              grantedItem,
              usureDay: usureDay ? run.day : undefined,
            });
          }}
        />

        {/* Menu plein cadre (spec §8) : Essence + Inventaire. */}
        {menuOpen && (
          <GameMenu
            run={loadRun()}
            onClose={() => {
              // La croix de fermeture est au MÊME pixel que l'icône de menu
              // (alignement vérifié le 16/07). Un « triple tap au même endroit »
              // est donc, du point de vue de l'écran, ouvre → ferme → ouvre :
              // les fermetures doivent compter dans la séquence, sinon le geste
              // du journal 25/07 serait impossible à faire.
              countMenuTap();
              setMenuOpen(false);
            }}
            onUse={(item) => {
              // Consomme l'actif côté run (spec 21/07 point 4) : soin + cure.
              persist((run) => {
                run.besace = run.besace.filter((i) => i.id !== item.id);
                if (item.heal) run.health = Math.min(1, run.health + item.heal);
                if (item.cure) run.effects = run.effects.filter((e) => e.delta > 0);
              });
              setHealth(runRef.current?.health ?? health);
            }}
          />
        )}

        {/* Écran de mort (13/07). */}
        {death && (
          <DeathScreen
            epitaph={death.epitaph}
            day={death.day}
            bilan={death.bilan}
            relic={death.relic}
            heroName={death.heroName}
            cause={death.cause}
            firstDeath={death.firstDeath}
            onRestart={() => window.location.reload()}
          />
        )}

        {/* LE VOLET D'ÉTAT (retour playtest 6/08 soir) : 1/3 du bas, monte en
            paliers, se ferme au tap n'importe où. Affichage pur. */}
        {voletEtat && (
          <div className="absolute inset-0 z-[40]" onClick={() => setVoletEtat(null)}>
            <div className="etat-volet" onClick={(e) => e.stopPropagation()}>
              <VoletEtat id={voletEtat.id} label={voletEtat.label} positive={voletEtat.positive} />
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setVoletEtat(null)}
                className="absolute right-[14px] top-[10px] font-mono text-[16px] leading-none text-[var(--color-ink)] opacity-60"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * Contenu du volet d'état : la fiche vient de `lib/etats.ts` quand l'état en
 * fait partie ; les effets HÉRITÉS (AGUERRI, ENTAILLÉ…) n'ont pas de fiche —
 * on dit leur sens en mots, jamais leur chiffre.
 */
function VoletEtat({ id, label, positive }: { id: string; label: string; positive: boolean }) {
  const fiche = etat(id);
  const sens = positive
    ? "Il joue pour toi : tes gestes portent un peu mieux, pour un temps."
    : "Il joue contre toi : tes gestes portent un peu moins bien, tant qu'il tient.";
  return (
    <div className="flex h-full flex-col gap-[10px] overflow-y-auto px-[20px] pb-[16px] pt-[14px]">
      <p className="etat-volet-eyebrow">État {positive ? "favorable" : "défavorable"}</p>
      <p className="font-serif text-[24px] leading-none text-[var(--color-accent)]">
        {fiche ? fiche.nom : label}
      </p>
      {fiche ? (
        <>
          <p className="font-mono text-[12px] leading-[1.55] text-[var(--color-ink)] opacity-85">{fiche.manifestation}</p>
          <p className="font-mono text-[11px] leading-[1.5] text-[var(--color-ink)] opacity-50">
            <span className="uppercase tracking-[1.5px]">Comment ça se lève</span>
            <br />
            {fiche.remede}
          </p>
        </>
      ) : (
        <p className="font-mono text-[12px] leading-[1.55] text-[var(--color-ink)] opacity-85">{sens}</p>
      )}
    </div>
  );
}

function FeedItem({
  entry,
  typed,
  revealed,
  skip,
  onDone,
  prophetie,
  onEtat,
}: {
  entry: FeedEntry;
  typed: boolean;
  /** Narration/Geôlier : encore en file d'attente tant que false — invisible. */
  revealed: boolean;
  skip: number;
  onDone: () => void;
  /** Jour parié par la prophétie (#4) — la puce Jour blanchit à l'approche. */
  prophetie?: number | null;
  /** Tap sur une puce d'état → volet de détails (retour 6/08 soir). */
  onEtat?: (effectId: string, label: string, positive: boolean) => void;
}) {
  if ((entry.kind === "narration" || entry.kind === "jailer") && !revealed) return null;

  switch (entry.kind) {
    // L'illustration est désormais gérée en haut d'écran (état séparé) : plus
    // jamais une entrée du flux. L'action choisie n'est plus ré-affichée.
    case "illustration":
    case "chosen":
      return null;
    case "day": {
      // La prophétie datée (#4) : à J−1 et le jour même, la puce passe en
      // blanc PLEIN. La spec du 6/08 disait Brique #ac2e26 — couleur bannie
      // depuis le 14/07 (« plus aucun rouge », le funeste est blanc) : même
      // arbitrage que pour le verdict FUNESTE, le blanc porte la menace.
      const menace = prophetie != null && entry.day >= prophetie - 1 && entry.day <= prophetie;
      return (
        <p
          className={`scene-enter mb-[18px] text-center text-[11px] uppercase tracking-[1.2px] text-[var(--color-ink)] ${
            menace ? "opacity-100 [--enter-opacity:1]" : "opacity-50 [--enter-opacity:0.5]"
          }`}
        >
          — Jour {entry.day} —
        </p>
      );
    }
    case "jailer":
      return (
        <div
          className={`scene-enter jailer-banner mx-[-17px] mb-[18px] mt-[15px] relative flex min-h-[87px] items-center overflow-hidden bg-[var(--color-accent)] pl-[122px] pr-[20px] py-[16px] ${
            typed ? "jailer-speaking" : ""
          }`}
        >
          <span
            className="jailer-fringe jailer-fringe-top"
            style={{ backgroundImage: assetCss("assets/frange_geolier.svg") }}
            aria-hidden
          />
          <span
            className="jailer-fringe jailer-fringe-bottom"
            style={{ backgroundImage: assetCss("assets/frange_geolier.svg") }}
            aria-hidden
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src={assetUrl("assets/geolier_portrait.png")}
            className="pointer-events-none absolute top-0 left-0 z-0 h-full w-auto"
            style={{ imageRendering: "pixelated" }}
          />
          {/* Bloc démon : texte 11px, interligne 120 % (retour Patrick 22/07). */}
          <p className="relative z-[1] font-mono text-[11px] font-bold leading-[1.2] text-[var(--color-bg)]">
            <TypedText text={entry.text} typed={typed} skip={skip} msPerChar={42} onDone={onDone} />
          </p>
        </div>
      );
    case "narration":
      return (
        <p className="scene-enter feed-narration mb-[18px] text-[13px] leading-[1.3] text-[var(--color-ink)]">
          <TypedText text={entry.text} typed={typed} skip={skip} msPerChar={15} onDone={onDone} />
        </p>
      );
    case "combat":
      return (
        <div className="scene-enter combat-banner mb-[14px] mt-[6px]" role="note">
          <span className="combat-banner-tag">• RENCONTRE •</span>
          <span className="combat-banner-foe">{entry.foe}</span>
        </div>
      );
    case "etat":
      // Rappel des états temporaires après un jet (retour Patrick 19/07) :
      // vignette + nom — négatif = orange telle quelle, positif = désaturée
      // vers le blanc (même convention que l'écran Essence). Jamais un chiffre.
      return (
        <div className="scene-enter etat-banner" role="note">
          <span className="etat-banner-eyebrow">
            {entry.effects.length > 1 ? "États temporaires" : "État temporaire"}
          </span>
          <div className="etat-banner-row">
            {entry.effects.map((e) => (
              <button
                type="button"
                key={e.effectId}
                onClick={() => onEtat?.(e.effectId, e.label, e.positive)}
                className={`etat-chip ${e.positive ? "is-positive" : ""}`}
              >
                {/* La vignette n'apparaît que si le fichier existe VRAIMENT :
                    les six nouveaux états n'ont pas encore leur icône, et le
                    nom seul vaut mieux qu'une image cassée. Le manifeste fait
                    autorité — plus de liste blanche à tenir à la main. */}
                {assetExiste(`assets/etat_${e.effectId}.png`) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" src={assetUrl(`assets/etat_${e.effectId}.png`)} className="etat-chip-icon" />
                )}
                {e.label}
              </button>
            ))}
          </div>
        </div>
      );
    case "obtenu":
      return (
        <div className="scene-enter obtenu-banner mb-[18px]">
          <span className="obtenu-line">
            Obtenu — {entry.name} · {entry.rarity}
          </span>
          <span className="obtenu-flavor">{entry.flavor}</span>
        </div>
      );
    case "registre":
      return (
        <div className="scene-enter registre mx-[-17px] mb-[18px]">
          <p className="registre-head">— LE GRAND REGISTRE —</p>
          <div className="registre-list">
            {entry.rows.map((r) => (
              <div key={`${r.rank}-${r.name}`} className={`registre-row ${r.isPlayer ? "is-player" : ""}`}>
                <span className="registre-rank">{r.rank}</span>
                <span className="registre-name">{r.name}</span>
                <span className="registre-days">J{r.days}</span>
                <span className="registre-cause">{r.cause}</span>
              </div>
            ))}
          </div>
        </div>
      );
  }
}
