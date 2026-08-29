"use client";

import { useEffect, useRef, useState } from "react";
import Die3D, { type RollRequest } from "@/components/Die3D";
import { noter, vu } from "@/lib/dejavu";
import ChoiceButton from "@/components/ChoiceButton";
import TouchHint from "@/components/TouchHint";
import TypedText from "@/components/TypedText";
import DeathScreen, { bilanDeMort, type Bilan } from "@/components/DeathScreen";
import GameMenu from "@/components/GameMenu";
import {
  type Stat,
  DESCENTE_SCENE,
  ENTRY_SCENE,
  jailerTaunt,
  makeLiaison,
  TRACES_MENACE,
  pickLiaisonOptions,
  isHameauInterior,
  pickAccueil,
  HAMEAU_ACCUEIL_SLOT,
  sceneById,
  estUnLieu,
  APPROACH_NARRATION,
  SOUPCON_PALIERS,
  SOUPCON_CRAIE,
  SOUPCON_GEOLIER,
  tierIsFail,
  SORTIE_DE_ZONE,
  coutSanteBorne,
  type NatureJet,
  type Choice,
  type PointInteret,
  type LiaisonCtx,
  type Scene as SceneType,
  ligneBorneSud,
  lignePoteauNom,
  ligneCorbeaux,
  FAMILIARITE,
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
  HAMEAU_SORTIE,
  TRAVERSAL_POOL,
  JAILER_SANS_RISQUE,
  traceDeSortie,
  NUIT_CORPS,
  NUIT_OUVERTURE,
  SECOND_PROCES,
  DEMO_BORNE_CADRAGES,
  DEMO_FALAISE_APPROCHE,
  DEMO_FALAISE_LECTURES,
  FALAISE_REMONTE,
  DEMO_MEUTE_COUTURE,
  lieuDejaVisite,
  lieuNom,
  apportsProces,
  narrationAffichee,
  consequenceAffichee,
} from "@/lib/scene-data";
import {
  CODEX_PAR_DECOUVERTE,
  CODEX_PAR_LIEU,
  CODEX_PAR_SCENE,
} from "@/lib/codex-data";
import { contradictionsConnues, faitById, versionDuFait } from "@/lib/contradictions";
import { manifestationLoi } from "@/lib/loi-substitution";
import { perceptionDe } from "@/lib/perception";
import { acteAccusation, defensesDisponibles, temoinPour, temoinsUniques } from "@/lib/temoins";
import type { RelicDon } from "@/lib/reliques";
import {
  applique, noterVisite, parType, purger, radical, type Effet, type Faits,
} from "@/lib/faits";
import {
  etat, etatsActifs, poserEtat,
} from "@/lib/etats";
import { loadRun, resetRun, saveRun, type FeedEntry, type RunState, type TraversalState } from "@/lib/state";
import {
  armerSurprise, surprisePrete, jourProphetie, texteProphetie, texteFantome,
  texteCitation, texteRetour, texteVol, texteTemoinRecite, OBJET_DU_VOLEUR,
  JAILER_METALEPTIQUE, JAILER_DE_IMPOSSIBLE, type SurpriseId,
} from "@/lib/surprises";
import { chapterById, drawChapter, LANDES_LORE_FRAGMENTS } from "@/lib/chapters-data";
import { demoActive, demoPhase, demoRouteRestante } from "@/lib/demo";
import RubReveal from "@/components/minigames/engines/RubReveal";
import HoldSteady from "@/components/minigames/engines/HoldSteady";
import GlyphTrace from "@/components/minigames/engines/GlyphTrace";
import TimingTap from "@/components/minigames/engines/TimingTap";
import SlowSwipe from "@/components/minigames/engines/SlowSwipe";
import { forcerPiste, playMusic } from "@/lib/audio";
import { loadSettings } from "@/lib/settings";
import { hasBesaceRoom, landesLoot, landesLootSlot, normalizeItem, passiveMod, randomSoinMineur, recompenseDestinQuiTient, usageEnMots, LANDES_OBJETS, RARITY_LABEL, type BesaceItem, type BesaceRarity } from "@/lib/besace";
import { assetUrl, assetCss, assetExiste } from "@/lib/assets";
import {
  bloodDebtFor,
  buildRegistre,
  dettesPortees,
  donsPortes,
  entrySoftening,
  relicDon,
  relicDette,
  reliquesPortees,
  debloquerCodex,
  type ReliquePortee,
  jailerPosture,
  loadMemory,
  mutateMemory,
  noterFait,
  recordDeath,
  recordRenoncement,
  recordTraversee,
  noterVisiteLieu,
  type Relic,
} from "@/lib/player-memory";
import {
  niveauSceau,
  ligneSceauOuverture,
  ligneSceauBorne,
  ligneSceauSortie,
  ligneSceauGeolier,
  reconnaissanceSceau,
} from "@/lib/sceaux";

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
/**
 * La première relique PORTÉE offrant ce don dont le geste n'est pas encore
 * dépensé — un geste PAR relique (spec 20/08 : la Descente en emporte jusqu'à
 * trois, leurs effets s'additionnent : trois amortis = trois chocs pris).
 * `relicUsed` hérité à true (run d'avant la migration) = tout est dépensé.
 */
function porteuseDisponible(don: RelicDon, run: RunState | null): ReliquePortee | null {
  if (run?.relicUsed === true) return null;
  const usees = run?.reliquesUsees ?? [];
  return (
    reliquesPortees(loadMemory()).find(
      (p) => relicDon(p.relic) === don && !usees.includes(p.idx)
    ) ?? null
  );
}

function chance(p: number): boolean {
  return Math.random() < p;
}
function nowMs(): number {
  return Date.now();
}

/**
 * ─── L'ÉLECTION DU BLOC OPTIONNEL (arbitrage du 12/08) ─────────────────────
 *
 * Une arrivée ou une Croisée ne sert qu'UN bloc optionnel. L'ordre ci-dessous
 * n'est pas un classement d'importance : c'est un classement de ce qui peut
 * ATTENDRE. Tout ce qui perd revient à la prochaine arrivée, sauf le premier,
 * qui n'a pas de prochaine fois.
 *
 *  1. chapitre  — son développement est accroché à un lieu qu'on ne revisite
 *                 pas dans la vie : différé, il est perdu. Il ne peut donc
 *                 jamais céder, et il est rare (12 % des arrivées).
 *  2. geôlier   — la raillerie d'un jet critique. Elle commente le geste
 *                 qu'on vient de faire : servie deux écrans plus loin, elle
 *                 ne veut plus rien dire.
 *  3. soupçon   — le palier franchi, craie + interprétation en un seul bloc.
 *  4. corbeaux  — le compte sur les toits a changé.
 *  5. rumeur    — un témoin parle en pleine rue.
 *  6. loi       — une rumeur de route, au plus une par vie.
 *  7. rappel    — le monde re-signale ce qu'on sait déjà. C'est le seul
 *                 groupe qui ne raconte aucun événement : il cède en dernier.
 */
type Injection = "chapitre" | "geolier" | "soupcon" | "corbeaux" | "rumeur" | "loi" | "rappel";
const ORDRE_INJECTION: Injection[] = [
  "chapitre", "geolier", "soupcon", "corbeaux", "rumeur", "loi", "rappel",
];
function elireInjection(candidats: Record<Injection, boolean>): Injection | null {
  return ORDRE_INJECTION.find((k) => candidats[k]) ?? null;
}

/**
 * LA RUMEUR — un témoin déjà inscrit parle en pleine rue. Sortie ici parce
 * que l'élection a besoin de savoir s'il y a un candidat AVANT le point où
 * la rumeur se pousse ; le texte, lui, reste à sa place dans le flux.
 *
 * ⚠️ On déduplique par PERSONNE, pas par déposition (correctif du 11/08) :
 * cinq dépositions différentes portent « La Femme au Seuil », et la phrase ne
 * cite que le nom et le lieu — deux de ses dépositions sont indistinguables
 * à l'écran, donc elle sortait deux fois mot pour mot.
 */
function candidatRumeur(
  run: RunState | null | undefined,
  sceneId: string,
  step: number,
): { id: string; nom: string; lieu: string } | null {
  if (!estHameau(sceneId) || (run?.soupcon ?? 0) < 2) return null;
  const temoins = run?.temoins ?? [];
  const cites = run?.temoinsCites ?? [];
  const dejaDits = new Set(temoins.filter((t) => cites.includes(t.id)).map((t) => t.nom));
  const frais = temoins.filter((t) => !cites.includes(t.id) && !dejaDits.has(t.nom));
  if (!frais.length || !chance(0.5)) return null;
  return frais[step % frais.length];
}
/**
 * « Il y a des gens autour » — le contexte des réactions du monde (7/08).
 * Vrai dans les lieux INTÉRIEURS du village ET dans toute la séquence du
 * Seuil (accueil, rue, muret, halte) : elle se joue dans les rues même si le
 * Seuil reste « dehors » pour le tirage du pool.
 */
/** Les états négatifs soumis au PLAFOND de deux (dosage 7/08). FIXÉ n'y est
    pas : mécanique sociale du procès, posée par le village, jamais bloquée. */
/* ⚠️ Phase A : le plafond de deux états négatifs n'a plus d'objet. Les cinq
   états qu'il dosait sont partis ; les deux marques restantes (FIXÉ, le
   compagnon) ne s'empilent pas — l'une est posée par le village, l'autre par
   une rencontre unique. La liste reste vide plutôt que d'être supprimée : si
   une marque de corps revient un jour, c'est ici qu'elle se dose. */
const ETATS_NEGATIFS_DOSES: string[] = [];

/**
 * MÉMOIRE DES PNJ ENTRE LES VIES (arbitrage Patrick 8/08 : « on repasse
 * forcément aux mêmes endroits pendant les runs — amplifier leur mémoire »).
 * Au 2e passage du COMPTE par un lieu (mem.visitesLieux), celui qui y vit
 * montre qu'il a déjà vu quelqu'un comme toi. Jamais un nom, jamais un
 * chiffre : ils reconnaissent la MANIÈRE, pas la personne — le registre du
 * Colporteur (« te reconnaît. C'est impossible. ») s'étend à ses voisins.
 */
/**
 * LES OBJETS QUI PORTENT UNE PROMESSE (partie de découverte 8/08 : « j'ai
 * accepté la mèche d'une mère pour son fils disparu — la décision la plus
 * forte de ma partie — et plus personne n'y a fait allusion »). Un objet
 * accepté CONTRE une promesse doit revenir peser aux moments où la promesse
 * est en jeu. Indexé par scène, filtré sur un fragment du NOM de l'objet.
 */
/**
 * LA PORTE QUI SE FERME — dite quand un échec DUR consomme, en plus de son
 * coût, une possibilité du lieu où l'on se tient (voir `resterSurPlace`).
 *
 * ⚠️ Ces lignes tombent dans N'IMPORTE QUEL lieu : aucune ne peut supposer un
 * mur, un village, ni quelqu'un pour regarder. C'est la contrainte qui les
 * rend abstraites, et c'est `tools/immersion.py` qui la fait respecter.
 */
const PORTE_QUI_SE_FERME = [
  "Quelque chose vient de se refermer. Pas devant toi : dans ce qui te " +
    "restait à tenter. Tu ne sauras jamais quoi exactement — seulement que " +
    "c'était là il y a un instant.",
  "Il y avait autre chose à tenter ici. Il y avait. Ce qui vient de rater " +
    "n'a pas seulement raté : ça a coûté le reste.",
  "Tu comptes ce qu'il te reste à faire, et le compte est plus court qu'avant " +
    "d'essayer. Personne n'a rien repris. C'est toi qui as dépensé.",
];

const ECHOS_OBJET: Record<string, { objet: string; text: string }[]> = {
  // On regarde descendre un Appelé — c'est peut-être lui, le fils.
  "palissade-sud-2": [
    {
      objet: "Mèche",
      text:
        "Ta main est allée à la mèche sans que tu l'aies décidé. Tu la " +
        "tiens en le regardant descendre, et tu comprends que tu n'as aucun " +
        "moyen de savoir. Ni maintenant, ni jamais.",
    },
  ],
  // Au seuil de la Descente : la promesse ou le passage.
  "la-descente": [
    {
      objet: "Mèche",
      text:
        "La mèche est toujours dans ta poche. Personne, en bas, ne saura ce " +
        "qu'elle est ni à qui la rendre. Une femme, quelque part derrière " +
        "toi, tient encore son seuil pour un fils qui ne remontera pas.",
    },
    {
      // L'éclat descellé de la Borne, ramassé au tout premier écran de la
      // vie, revient au tout dernier : c'est la plus longue portée que le
      // jeu sache tenir aujourd'hui, et elle ne coûte qu'une ligne.
      objet: "Pierre de Retour",
      text:
        "L'éclat de la Borne pèse dans ta poche, exactement du poids qu'il " +
        "avait au premier pas. Les Renonçants disent qu'on revient, si on le " +
        "porte. Ils le disent au nord de la palissade, là où personne n'a " +
        "jamais eu à vérifier.",
    },
  ],
  // La Mare montre ce qu'on porte, pas ce qu'on est.
  "mare-aux-regards-2": [
    {
      objet: "Mèche",
      text:
        "Dans l'eau, tu ne te vois pas seul : il y a la forme de ce que tu " +
        "portes, un peu à côté de toi. La Mare ne compte pas les gens. Elle " +
        "compte les promesses.",
    },
  ],
};

const PNJ_MEMOIRE: Record<string, { lieu?: string; text: string }> = {
  "marche-muet-2": {
    text:
      "« Vous changez de visage », dit le Colporteur en rangeant une babiole " +
      "que tu n'as pas eu le temps de voir. « Mais vous marchez tous pareil. " +
      "Et vous regardez tous le même coin de l'étal. »",
  },
  "champ-des-fixes-2": {
    text:
      "Le Fossoyeur te dévisage une seconde de trop. « J'ai déjà taillé pour " +
      "quelqu'un qui se tenait comme toi. » Il retourne à son écriteau. « Le " +
      "poteau n'a pas servi. Pas encore. »",
  },
  "pendu-qui-parle-2": {
    text:
      "« Tu n'es pas le premier à te pencher sur ce sceau », dit la voix, " +
      "sans reproche. « Le précédent avait tes yeux. Ou alors tu as les siens. »",
  },
  // Les rencontres rattachées à un lieu déclarent leur LIEU (le compteur ne
  // suit que les arrivées d'orientation, jamais les ids de rencontre).
  "chapelle-des-cordes-2": {
    text:
      "« Tes mains, je les connais », dit la Veuve sans lever les yeux de " +
      "son tressage. « Pas les tiennes. Des pareilles. Elles tenaient mal " +
      "la corde aussi. »",
  },
  "marcheur-1": {
    lieu: "chemin-creux",
    text:
      "Il ralentit une seconde à ta hauteur, sans cesser de reculer. « Je " +
      "t'ai déjà croisé. » Un temps. « Pas toi. Quelqu'un qui mettait ses " +
      "pieds où tu les mets. »",
  },
  "veilleur-1": {
    lieu: "palissade-sud",
    text:
      "« Ta démarche », dit-il en plissant les yeux vers sa planche. « Je " +
      "l'ai déjà notée. Sous un autre nom. »",
  },
  "femme-seuil-1": {
    lieu: "serment-hameau",
    text:
      "Elle t'ouvre avant que tu aies frappé. « L'autre aussi se tenait " +
      "là, à deux pas du seuil, sans oser. » Elle ne dit pas quel autre. " +
      "Elle n'a pas besoin.",
  },
  "hesitant-1": {
    lieu: "borne-frontiere",
    text:
      "Il te regarde une seconde de trop. « J'ai déjà dit tout ça à " +
      "quelqu'un », souffle-t-il. « Il écoutait comme toi. Il est parti " +
      "vers le sud aussi. »",
  },
  "epoux-1": {
    lieu: "verger-noir",
    text:
      "Elle s'arrête de bêcher, le temps d'un regard. « Le onzième verger " +
      "a déjà eu ta visite », dit-elle. « Pas la tienne. Une pareille. »",
  },
  "tour-de-guet-2": {
    lieu: "tour-de-guet",
    text:
      "« Je t'ai vu monter », dit le Guetteur sans se retourner. « L'autre " +
      "fois aussi. Ce n'était pas toi — mais j'ai vu monter pareil. »",
  },
  "hameau-entree-4": {
    lieu: "serment-hameau",
    text:
      "La Doyenne te regarde plus longtemps que les autres. « On a déjà " +
      "fait jurer quelqu'un qui avait ta façon de te taire », dit-elle. " +
      "« Le muret s'en souvient mieux que moi. »",
  },
};

function dansLeVillage(sceneId: string): boolean {
  return (
    isHameauInterior(radical(sceneId)) ||
    /^(serment-hameau|hameau-|femme-seuil|gamin-murets)/.test(sceneId)
  );
}

/**
 * Prose d'une issue de jet, nettoyée pour l'AFFICHAGE : « 20 naturel. » /
 * « 1 naturel. » en tête et « ♦ −2 » en queue sont des MARQUEURS D'ÉCRITURE
 * de scene-data (ils repèrent les variantes critiques et leur coût pour la
 * relecture) — jamais du texte joueur. Aucun chiffre de mécanique ne
 * s'affiche, règle verrouillée. (Fuite vue au playtest auto du 7/08 :
 * « 1 naturel. Tu lui parles de sa femme. […] ♦ −2 » servi tel quel.)
 */
function proseDuJet(text: string): string {
  return text.replace(/^(?:20|1) naturel\.\s*/, "").replace(/\s*♦.*$/, "");
}

/** Préférence du popup « rangé dans le menu » (7/08) — compte, pas run :
    une fois compris, le rappeler à chaque héros serait du bruit. */
const AIDE_MENU_KEY = "aldenhar-aide-menu";
type AideMenuPref = { off?: boolean; etat?: boolean; objet?: boolean };
function lireAideMenu(): AideMenuPref {
  try {
    return JSON.parse(localStorage.getItem(AIDE_MENU_KEY) ?? "{}") as AideMenuPref;
  } catch {
    return {};
  }
}
function ecrireAideMenu(p: AideMenuPref) {
  try {
    localStorage.setItem(AIDE_MENU_KEY, JSON.stringify(p));
  } catch {
    /* stockage indisponible : l'aide se remontrera, sans gravité */
  }
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

/**
 * LA CARTE D'OBJET (maquette Figma 2531:825, 25/08). Une seule fabrique pour
 * les six points d'acquisition — avant, chacun recopiait cinq champs à la
 * main, et l'icône ou la rareté auraient divergé au premier ajout.
 * `icone` prend l'asset RÉEL de l'objet quand il en a un, sinon l'icône
 * générique de son type : la carte n'affiche jamais un cadre vide.
 */
function entreeObtenu(id: string, it: BesaceItem): Extract<FeedEntry, { kind: "obtenu" }> {
  return {
    id,
    kind: "obtenu",
    name: it.name,
    rarity: RARITY_LABEL[it.rarity as BesaceRarity],
    rarete: it.rarity as BesaceRarity,
    flavor: it.flavor,
    usage: usageEnMots(it),
    icone: it.illustration ?? objectImage(it.kind),
  };
}

type ImageKind = "scene" | "object";

/* Ouverture/fermeture du sous-menu des descriptions (points d'intérêt). Ce ne
   sont PAS des choix de fiction : ils ne consomment ni tour ni dé. */

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
  if (t.phase === "liaison" && t.liaisonOpts) {
    const base = makeLiaison(
      t.liaisonOpts[0],
      t.liaisonOpts[1],
      t.seed,
      // Liaison de SORTIE (24/08) : pas de provenance — l'image de marche et
      // l'ambiance sont celles de la lande retrouvée, pas d'une ruelle.
      run
        ? liaisonCtx(run, t.sortieHameau ? undefined : t.visited[t.visited.length - 1])
        : undefined,
      t.routeFermee === true
    );
    return t.sortieHameau ? habillageSortie(base, t.seed) : base;
  }
  return resoudre(t.current, run) ?? sceneById(ENTRY_SCENE)!;
}

/**
 * LA SORTIE DU VILLAGE EST UNE TRANSITION JOUÉE (retour Patrick 24/08, 3e
 * signalement : « je me téléporte du Puits au Pendu Mal Fixé, puis je vois le
 * chemin creux depuis le hameau »). Avant : depuis une rue, la Croisée offrait
 * « une issue » qui était un lieu de LANDE servi comme une direction ordinaire
 * — la ligne de franchissement n'arrivait qu'à l'écran d'ARRIVÉE, collée au
 * mauvais écran. Désormais l'écran de sortie dit d'abord le franchissement
 * (couture FRANCHIT_SORTIE), PUIS ouvre deux directions de lande avec leurs
 * indices : sortir, ensuite choisir. Dans cet ordre.
 */
/** LA VUE DES DEUX CHEMINS (retour Patrick 25/08 : « penser à faire une image
 *  de transition de deux chemins entre le hameau des Renonçants et un autre
 *  chemin »). L'écran de sortie est le seul du jeu où l'on voit à la fois le
 *  village dans le dos et les deux routes qui s'ouvrent : il mérite sa propre
 *  vue, pas une marche de lande tirée au sort.
 *  ⚠️ L'asset n'existe pas encore (prompt dans `data/images-a-produire.md`) :
 *  le garde `assetExiste` retombe sur la vue de marche tant qu'il n'est pas
 *  déposé dans `public/assets/`. Aucun code à changer à sa réception. */
const SORTIE_DEUX_CHEMINS = "assets/scene_transition_sortie_hameau_deux_chemins_a.png";

function habillageSortie(base: SceneType, seed: number): SceneType {
  return {
    ...base,
    illustration: assetExiste(SORTIE_DEUX_CHEMINS)
      ? SORTIE_DEUX_CHEMINS
      : base.illustration,
    // La couture remplace l'ambiance (narration[0]). Tirée par la graine —
    // identique à la reprise ; pas de dédup `liaisonVues` : la sortie ne se
    // joue qu'une fois par vie.
    narration: [FRANCHIT_SORTIE[seed % FRANCHIT_SORTIE.length], ...base.narration.slice(1)],
  };
}

function makeSortieHameau(
  trav: TraversalState,
  seed: number,
  run: RunState | null | undefined,
  fermee: boolean
): { scene: SceneType; pair: [string, string] } {
  // sorti=true : le tirage n'offre que la lande (ni la porte, ni les rues).
  const pair = pickLiaisonOptions(trav.visited, seed, true, false, true);
  // La signature de la zone reste garantie (chantier 6 du 23/07) : cette
  // Croisée-ci est une Croisée de lande comme les autres.
  if (
    !lieuDejaVisite(trav.visited, "colline-aux-gibets") &&
    !pair.includes("colline-aux-gibets")
  ) {
    pair[(seed + 1) % 2] = "colline-aux-gibets";
  }
  // MODE DÉMO : la route scriptée reprend DEHORS, sur cet écran même.
  if (demoActive()) {
    const reste = demoRouteRestante(trav.visited, lieuDejaVisite).filter(
      (id) => !isHameauInterior(id)
    );
    if (reste.length) {
      const second =
        reste[1] ??
        pair.find((p) => !lieuDejaVisite([reste[0]], p) && !isHameauInterior(p)) ??
        reste[0];
      pair[0] = reste[0];
      pair[1] = second;
    }
  }
  const base = makeLiaison(
    pair[0],
    pair[1],
    seed,
    // `from` absent à dessein : on vient de FRANCHIR la limite — l'ambiance
    // et l'image de marche sont celles de la lande, pas d'une ruelle.
    run ? liaisonCtx(run, undefined) : undefined,
    fermee
  );
  return { scene: habillageSortie(base, seed), pair };
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
  const f: Faits = { run: { ...(run?.faits ?? {}) }, perm: { ...loadMemory().faits } };
  /* LE SOUPÇON EN FAIT DÉRIVÉ (14/08). Les scènes-variantes lisent le sac de
     faits, jamais `RunState` : sans ce miroir, aucun texte ne peut réagir au
     Soupçon autrement que par une injection — or l'échelle sociale doit se
     lire dans des REMPLACEMENTS (le Veilleur qui note au lieu de demander).
     ⚠️ Dérivé à la lecture, JAMAIS persisté : il ne peut pas diverger de
     `run.soupcon`, exactement comme le compteur de la Fille. */
  f.run["soupcon"] = {
    id: "soupcon", kind: "counter", scope: "run", value: run?.soupcon ?? 0, source: "derive",
  };
  return f;
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
  // LE CODEX (20/08) : comprendre quelque chose ouvre l'ARC qui le porte —
  // point unique, toutes les découvertes passent par ici. Lecture pure :
  // le déblocage ne change rien en jeu.
  const arc = CODEX_PAR_DECOUVERTE[id];
  if (arc) {
    const run = loadRun();
    debloquerCodex(arc, run.heroName, run.day);
  }
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
/**
 * Un geste tactile a-t-il DÉJÀ été vécu par ce compte ? (Retour du 25/08.)
 * `null` = le geste est rejouable à volonté, on ne consulte rien.
 * La mémoire est celle du COMPTE : la découverte survit à la mort du héros,
 * exactement comme une découverte de lore.
 */
function gesteDejaVecu(cle: string | null): boolean {
  if (!cle) return false;
  return vu(loadMemory().vus, "geste|" + cle) > 0;
}

function decouperEnEcrans(entries: FeedEntry[]): FeedEntry[][] {
  const texte = (e: FeedEntry) =>
    e.kind === "narration"
      ? (e as { text: string }).text.split(/\s+/).length
      : e.kind === "jailer"
        // LE BANDEAU DU GEÔLIER PÈSE PLUS QUE SES MOTS (panel 10/08).
        // Mesuré : sur un écran court, le bandeau (111 px de chrome, portrait
        // compris) était POUSSÉ HORS DE LA ZONE par le suivi du bas de texte —
        // 19 px visibles sur 111 à 640 px de haut, 61 sur 111 à 700. Ce n'est
        // pas une compression, c'est un débordement : le personnage central du
        // jeu parlait au-dessus de la ligne de flottaison. Compté à ses mots
        // + le chrome, il obtient son écran au lieu d'être coupé.
        ? (e as { text: string }).text.split(/\s+/).length + 40
        : 0;
  const groupes: FeedEntry[][] = [];
  let cur: FeedEntry[] = [];
  let mots = 0;
  for (const e of entries) {
    const m = texte(e);
    // LA DÉMO RESPIRE PLUS LARGE (go 24/08, chantier taps) : un écran de démo
    // porte jusqu'à 150 mots — la prose y est déjà courte (narrationDemo), et
    // « un écran sans décision doit justifier son existence ». Le jeu complet
    // garde ses 90 : sa prose entière en a besoin.
    const budget = demoActive() ? 150 : MOTS_PAR_ECRAN;
    if (m > 0 && mots > 0 && mots + m > budget) {
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
  // LA DERNIÈRE PAGE NE VIT PAS SEULE (compte rendu 17/08, §6 : « on ne tape
  // pas pour tourner une page »). La coupe avant-débordement laissait souvent
  // un dernier groupe COURT — 25-45 mots orphelins qui coûtaient un tap de
  // plus avant les choix (mesuré : l'ouverture d'un compte vétéran mettait la
  // première décision à l'écran 4 ; la trace d'écharde y vivait seule).
  // Un dernier groupe court rejoint l'écran précédent tant que le total reste
  // sous le PLAFOND DUR de 120 mots (doctrine du 4/08 : 90 = budget, 120 =
  // maximum absolu d'un écran). Jamais pour un bandeau du Geôlier : son
  // chrome de 111 px repousserait le contenu sous la ligne de flottaison
  // (le débordement corrigé le 10/08). Les taps MÉRITÉS (mort, Sceau,
  // révélation) ne passent pas par ce découpage — ils ont leurs écrans.
  if (groupes.length >= 2) {
    const poids = (g: FeedEntry[]) => g.reduce((n, e) => n + texte(e), 0);
    const dernier = groupes[groupes.length - 1];
    const pDernier = poids(dernier);
    if (
      pDernier > 0 &&
      pDernier <= 45 &&
      !dernier.some((e) => e.kind === "jailer") &&
      poids(groupes[groupes.length - 2]) + pDernier <= 120
    ) {
      groupes[groupes.length - 2].push(...dernier);
      groupes.pop();
    }
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
  /** Choix déjà résolus sur la scène `sejour` courante — miroir de rendu de
      `run.choixFaits` (React Compiler interdit de lire `runRef` au rendu). */
  const [choixFaits, setChoixFaits] = useState<string[]>([]);
  // Le SAVOIR (25/07) : flags appris en examinant. Miroir d'état de
  // `run.savoirs` — nécessaire au RENDU (les choix qui en dépendent doivent
  // apparaître dès l'écran suivant), alors que `runRef` n'est pas lisible
  // pendant le rendu (React Compiler).
  const [savoirs, setSavoirs] = useState<string[]>([]);
  // Les DÉCOUVERTES du COMPTE (refonte du lore 6/08). Même raison d'être que
  // `savoirs` — un miroir lisible au rendu — mais la source est la mémoire
  // permanente, pas la run : ce que le JOUEUR a compris survit à ses héros.
  const [decouvertes, setDecouvertes] = useState<string[]>([]);
  // LE SCEAU DES LANDES (14/08) : combien de fois ce COMPTE a franchi la
  // Descente vivant. Miroir de rendu, comme `decouvertes` — il ne bouge
  // jamais en cours de vie (on ne franchit la Descente qu'une fois, et la run
  // se termine dessus), donc il est posé au montage et n'est plus touché.
  const [sceauNiveau, setSceauNiveau] = useState(0);
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
  /** Vue de marche différée : posée quand une conséquence de jet se lit sur
      une liaison (l'image du lieu tient), appliquée au tap suivant. */
  const imageApresConsequence = useRef<string | null>(null);
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
  /** LA stat dominante de cette incarnation (égalité tranchée par l'ordre du
      Seuil). Sert au gating `requiresDominante` — au plus une variante de
      profil par écran, voir le champ dans scene-data.ts. */
  const dominanteMirror: Stat | null = heroStats
    ? (["COURAGE", "RUSE", "INSTINCT", "EMPATHIE"] as Stat[]).reduce((a, b) => {
        const v = (s: Stat) =>
          ({ COURAGE: heroStats.courage, RUSE: heroStats.ruse,
             INSTINCT: heroStats.instinct, EMPATHIE: heroStats.empathie })[s];
        return v(b) > v(a) ? b : a;
      })
    : null;
  // Le DON de la relique portée (5/08) — remplace l'ancien trio d'effets.
  // « amorti » est le nouveau nom de « coussin ».
  // Miroirs de rendu des reliques PORTÉES (jusqu'à trois — spec 20/08).
  const [donsMirror, setDonsMirror] = useState<RelicDon[]>([]);
  // Un « passe » au moins reste-t-il disponible ? (affordance des verrous)
  const [passeDispoMirror, setPasseDispoMirror] = useState(false);
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
  /** Le choix en cours quitte une scène de nuit sans qu'une nuit passe
      (`Choice.sansNuit`). Un ref plutôt qu'un state : `advance()` le lit dans
      le même tour que la sélection, avant tout re-rendu. */
  const sansNuitRef = useRef(false);
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
  // POPUP « rangé dans le menu » (maquette 2442:17234, 7/08) : quand la carte
  // d'état (ou le bandeau Obtenu) quitte l'interface, une carte en haut
  // d'écran dit UNE FOIS où la chose vit désormais. « Ne plus afficher »
  // coupe l'aide pour de bon ; sinon, une apparition par sujet et par compte.
  const [aideMenu, setAideMenu] = useState<"etat" | "objet" | null>(null);
  function maybeAideMenu(sujet: "etat" | "objet") {
    const pref = lireAideMenu();
    if (pref.off || pref[sujet]) return;
    ecrireAideMenu({ ...pref, [sujet]: true });
    setAideMenu(sujet);
  }
  const [countdownArmed, setCountdownArmed] = useState(false);
  /** MODE DÉMO — mini-jeu en cours (le choix qui l'a ouvert). Tant qu'il est
      posé, l'écran est à lui : compte à rebours suspendu, CTA sous l'overlay.
      `minigamesJoues` empêche de rejouer le geste sur le même choix (la
      ré-entrée d'`onSelect` après le résultat passe alors par la voie
      écrite normale du choix). */
  const [minigameChoice, setMinigameChoice] = useState<Choice | null>(null);
  const [minigameConfig, setMinigameConfig] = useState<Record<string, unknown> | null>(null);
  /* Phase du frottage à skin image : le hint du bas suit — « Gratte la
     mousse » pendant le geste, « Touche pour continuer » une fois la pierre
     nue (même comportement clignotant que le TouchHint, demande du 25/08). */
  const [minigamePhase, setMinigamePhase] = useState<"gratte" | "envol" | "lu">("gratte");
  const minigamesJoues = useRef<string[]>([]);
  /* La CÉRÉMONIE (swipe) est insensible à l'échec : trop vite, la corde ne
     file pas et le geste se représente — ce compteur remonte le moteur. */
  const [minigameRetry, setMinigameRetry] = useState(0);
  /* Mode testeur (`?testeur=1`) : trois taps sur l'overlay résolvent le geste
     en réussite — les IA sans geste tactile réel (et l'auto-joueur) passent. */
  const testeurTaps = useRef(0);
  const runRef = useRef<RunState | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // 4e choix contextuel (spec 21/07 point 4) : objet ACTIF pertinent proposé
  // en scène. Calculé dans un effet (lecture Besace/santé hors rendu).
  const [activeChoice, setActiveChoice] = useState<Choice | null>(null);
  /** Miroir de rendu du « corps abîmé » (React Compiler interdit de lire
      runRef pendant le rendu) — alimenté par l'effet du 4e choix contextuel,
      qui est le SEUL endroit où se décide ce qu'est « être blessé ». */
  const [blesseMirror, setBlesseMirror] = useState(false);
  /** Les CLÉS de `LANDES_OBJETS` réellement portées (miroir de rendu — le
      React Compiler interdit de lire `runRef.current` pendant le rendu). Sert
      à `Choice.requiresObjet` : ce qu'on porte ouvre une porte, sans le
      dépenser. */
  const [besaceMirror, setBesaceMirror] = useState<string[]>([]);
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
    if (next === null && beatsSuiteRef.current.length === 0) {
      setChoicesHidden(false);
      // Conséquence de jet lue sur une liaison COURTE (un seul écran) : la vue
      // de marche prend le relais au moment où les routes s'offrent.
      if (imageApresConsequence.current) {
        setImage(imageApresConsequence.current);
        setImageKind("scene");
        imageApresConsequence.current = null;
      }
    }
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
  // ⚠️ Phase A : le vol n'est plus conditionné à la FAIM. AFFAMÉ est parti
  // avec les Besoins, qui étaient sa seule source — le laisser aurait rendu
  // « Prendre sans demander » à jamais injouable. Et c'est mieux ainsi :
  // voler est un choix MORAL, offert à tous, qui se paie en Soupçon et en
  // regard du village. Un gain de faim n'en était pas la vraie matière.
  const volPossible = (scene.tags ?? []).some((t) => t === "food_available" || t === "stealable");
  const baseChoices = rawChoices.filter((c) => {
    // Retour playtest 6/08 soir : la brebis du Troupeau ramenait à un Champ
    // des Fixés DÉJÀ traversé — on rejouait le Fossoyeur mot pour mot. Un
    // choix d'orientation posé DANS une scène (hors Croisée : les options
    // d'une liaison sont déjà filtrées sur le non-visité) disparaît si sa
    // destination a été vue. La brebis y va quand même ; toi, tu sais déjà
    // ce qu'il y a au bout.
    if (c.orient && !scene.liaison && lieuDejaVisite(visitedMirror, c.orient.dest))
      return false;
    // #1 Le choix qui expire (6/08) : une fois l'érosion finie, l'option
    // n'existe plus — perdre le temps coûte une occasion, jamais la vie.
    if (c.id === expRetire) return false;
    // UN CORPS INTACT NE MONTRE PAS SES PLAIES (panel 10/08). Même prédicat
    // que le 4e choix contextuel de soin : santé entamée OU état négatif.
    if (c.requiresBlessure && !blesseMirror) return false;
    // Profil requis (chantier 11/08) : absent, pas grisé — voir `requiresStat`.
    // ⚠️ `Stat` est en CAPITALES (COURAGE…) et `RunStats` en minuscules —
    // deux conventions qui se croisent ici et nulle part ailleurs.
    if (
      c.requiresStat &&
      (({
        COURAGE: heroStats?.courage,
        RUSE: heroStats?.ruse,
        INSTINCT: heroStats?.instinct,
        EMPATHIE: heroStats?.empathie,
      })[c.requiresStat.stat] ?? 3) < c.requiresStat.min
    )
      return false;
    if (c.requiresDominante && dominanteMirror !== c.requiresDominante) return false;
    // SÉJOUR : ce qui a déjà été fait ici ne se refait pas. On ne pose pas
    // deux fois la même question au Veilleur ; le lieu tient plusieurs
    // décisions, pas la même en boucle.
    if (scene.sejour && choixFaits.includes(c.id)) return false;
    // REMPLACER PAR SÉQUENCE (verdict des panels, 14/08) : ce choix attend
    // qu'un autre ait été fait ICI. C'est ce qui permet à un écran de tenir
    // quatre intentions dans trois boutons sans en perdre aucune — on les
    // ordonne au lieu de les empiler.
    if (c.requiresChoixFait && !choixFaits.includes(c.requiresChoixFait)) return false;
    if (c.requiresSavoir && !savoirs.includes(c.requiresSavoir)) return false;
    // La DÉCOUVERTE (6/08) : même mécanique que le Savoir, mais la source est
    // le COMPTE. C'est ce qui permet à une option de n'exister qu'à partir de
    // la deuxième ou troisième vie, sans que le héros ait l'air de se souvenir.
    if (c.requiresDecouverte && !decouvertes.includes(c.requiresDecouverte)) return false;
    // LE SCEAU (14/08) : ce que le compte a RAPPORTÉ d'une traversée réussie
    // ouvre des conversations qui n'existaient pas. Même mécanique que la
    // découverte — et surtout pas un bonus de jet (voir lib/sceaux.ts).
    if (c.requiresSceau && sceauNiveau <= 0) return false;
    // EXPLORER PRÉPARE (14/08) : l'option aveugle s'efface quand l'option
    // informée existe. Le budget de trois actions ne bouge pas — c'est la
    // NATURE de ce qui est offert qui change, pas la quantité.
    if (c.masqueSi?.savoir && savoirs.includes(c.masqueSi.savoir)) return false;
    if (c.masqueSi?.objet && besaceMirror.includes(c.masqueSi.objet)) return false;
    if (c.masqueSi?.decouverte && decouvertes.includes(c.masqueSi.decouverte)) return false;
    // CE QU'ON PORTE OUVRE UNE PORTE (playtest v1.81, 13/08). `usageObjet`
    // CONSOMME l'objet : c'était donc réservé aux outils et aux remèdes, et
    // les onze objets PASSIFS des Landes ne pouvaient rien transformer — on
    // les ramassait, on lisait leur bandeau, et ils ne reparaissaient jamais.
    // `requiresObjet` est le pendant qui ne dépense rien : le choix EXISTE
    // parce que tu portes la chose, et disparaît si tu ne la portes pas.
    // C'est le vrai « explorer prépare » : ce qu'on a trouvé trois lieux plus
    // tôt ouvre ici une option que le voisin n'a pas.
    if (c.requiresObjet && !besaceMirror.includes(c.requiresObjet)) return false;
    // L'OBJET OUVRE / FERME (chantier 12/08 §2) : le jeton d'usage passe par
    // `choixFaits`, donc sa portée est l'ÉCRAN — vidé en quittant le lieu.
    if (c.requiresUsage && !choixFaits.includes(`usage:${c.requiresUsage}`)) return false;
    if (c.masqueSiUsage && choixFaits.includes(`usage:${c.masqueSiUsage}`)) return false;
    // Un état n'ouvre un choix QUE si l'état correspondant l'autorise vraiment
    // (FIXÉ → `ouvreConfidences`) : sans ce garde, `requiresEtat` deviendrait
    // un flag libre et l'état ne serait plus la raison de l'ouverture.
    if (c.requiresEtat) {
      const e = etatsRendus.find((x) => x.id === c.requiresEtat);
      // La marque doit AUTORISER l'ouverture, pas seulement être portée :
      // FIXÉ ouvre les confidences de ceux qui portent la même croix. Sans ce
      // garde, `requiresEtat` deviendrait un flag libre et la marque ne serait
      // plus la raison de l'ouverture. (Le volet `ouvreVol` est parti avec
      // AFFAMÉ — voler ne demande plus d'avoir faim.)
      if (!e || !e.ouvreConfidences) return false;
    }
    // « Le Registre ment » (5/08) : une seule vie ne peut pas l'ouvrir. Le don
    // « lecture » d'une relique la rend visible sans l'avoir vécue — c'est
    // exactement ce que raconte cette relique.
    if (c.requiresContradiction && contradictions === 0 && !donsMirror.includes("lecture")) return false;
    // Défenses du procès : seules celles que les témoins rendent possibles.
    if (c.defense && !defenses.includes(c.defense)) return false;
    // Le renoncement n'est offert qu'à qui a juré ET tenu. Le hameau n'offre
    // pas une place à quelqu'un qu'il surveille.
    if (c.renonce && !renoncePossible) return false;
    return true;
  });
  // UNE OPTION CONDITIONNELLE PREND LA PLACE DE L'AVEUGLE (verdict des deux
  // panels + ChatGPT, 14/08). Les systèmes livrés depuis fin juillet — Sceau,
  // objets portés, savoirs, découvertes, contradictions — AJOUTAIENT chacun
  // leur bouton : mesuré, dix écrans pouvaient dépasser trois actions, le
  // Marché Muet jusqu'à huit et le procès à cinq. C'est le retour de l'ancien
  // PACTUM : on cesse de choisir une intention, on relit une liste.
  //
  // On parcourt les survivants DANS L'ORDRE DE DÉCLARATION : le premier écrit
  // gagne, et un choix déjà retiré ne retire plus rien (sinon une chaîne
  // s'annulerait par le bas). Une chaîne se lit donc du plus spécifique au
  // plus général.
  const remplaces = new Set<string>();
  for (const c of baseChoices) {
    if (remplaces.has(c.id) || !c.prendLaPlaceDe) continue;
    for (const cible of typeof c.prendLaPlaceDe === "string" ? [c.prendLaPlaceDe] : c.prendLaPlaceDe)
      remplaces.add(cible);
  }
  const choixRetenus = remplaces.size ? baseChoices.filter((c) => !remplaces.has(c.id)) : baseChoices;
  // Les choix d'orientation d'une liaison gardent leur ordre (gauche/droite
  // stable) ; ailleurs, Fisher-Yates seedé pour casser les patterns de slot.
  // Le vol est ajouté AVANT le mélange : il prend une position quelconque,
  // comme n'importe quel autre choix — jamais un slot réservé.
  const avecVol: Choice[] = volPossible
    ? [
        ...choixRetenus,
        {
          id: "voler-nourriture",
          label: "Prendre sans demander",
          /* ⚠️ CE CHOIX NE COÛTAIT PLUS RIEN (trouvé en jouant, 13/08). Il
             portait `poseEtat: "marque"` et `repondBesoin: "manger"` — deux
             promesses mortes depuis le démontage des états (11/08) : MARQUÉ
             n'existe plus, et `repondBesoin` ne fait plus qu'horodater (voir
             `repondreAuBesoin`). Voler était donc devenu gratuit, sur un écran
             qui l'offre en quatrième bouton. Le coût redevient celui que sa
             propre conséquence annonce : on t'a vu. */
          soupcon: 2,
          repondBesoin: "manger",
          passive: {
            consequence:
              "Tu prends. C'est plus simple que tu ne l'aurais cru, et c'est " +
              "ça qui te reste après : pas la faim en moins, la facilité en plus. " +
              "Quelqu'un a vu. Tu ne sais pas qui — tu sais seulement que oui.",
          },
        },
      ]
    : choixRetenus;
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
  // ⚠️ Le 4e choix contextuel (« Utiliser — <objet> ») était AJOUTÉ APRÈS ce
  // budget : mesuré par le panel du 14/08, un joueur blessé voyait donc quatre
  // boutons en permanence, et treize des quinze dépassements relevés étaient
  // celui-là. Il compte maintenant comme un acte — ce sont les points
  // d'intérêt qui reculent d'un cran, jamais la règle qui cède.
  const placeLibre = Math.max(0, SLOTS - acts.length - (activeChoice && !poiOpen ? 1 : 0));
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
  const avecActif = activeChoice && !poiOpen ? [...withPois, activeChoice] : withPois;
  /**
   * LE FILET, jamais la méthode. La règle des trois actions se tient dans le
   * CONTENU (`Choice.remplace`) et le garde de build `A-trois` le vérifie
   * scène par scène. Ce plafond n'est là que pour qu'un cas non prévu — une
   * combinaison de systèmes qu'on n'a pas encore croisée — dégrade
   * proprement au lieu d'afficher une liste.
   *
   * ⚠️ Il ne coupe JAMAIS une sortie : enfermer le joueur serait pire que
   * quatre boutons. Si les sorties débordent à elles seules, on les garde
   * toutes et on laisse le garde de build faire son travail.
   */
  const renderedChoices = (() => {
    if (avecActif.length <= SLOTS || poiOpen) return avecActif;
    const sort = (c: Choice) => Boolean(c.sortie || c.orient || c.renonce);
    const sorties = avecActif.filter(sort);
    const reste = avecActif.filter((c) => !sort(c));
    return [...reste.slice(0, Math.max(0, SLOTS - sorties.length)), ...sorties];
  })();

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
      // Un nouvel écran avec sa propre image annule toute bascule différée.
      imageApresConsequence.current = null;
    }
    const groupes = decouperEnEcrans(entries);
    // ⚠️ LA CARTE D'ÉTAT NE SE MONTRE QU'UNE FOIS (playtest du 12/08).
    // Elle était re-posée en tête de CHAQUE écran de la séquence (règle du
    // 7/08, « elle reste le temps de la scène ») — mesuré en jeu : trois
    // réaffichages d'affilée sur une séquence à trois chunks, exactement au
    // moment où le joueur attend la suite. On sent le composant, plus l'état.
    // L'acquisition est un ÉVÉNEMENT : elle se dit au moment où elle arrive,
    // puis l'érosion du cadre, les choix et la narration portent la blessure.
    // Le détail reste consultable (tap sur la carte → volet, et Essence).
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
    aideSiObjet(groupes[0]);
  }

  /**
   * LE POPUP D'ACQUISITION (demande Patrick 25/08 : « une fenêtre la première
   * fois qu'on acquiert un objet, comme on a fait pour les états »). Il se
   * déclenche quand la CARTE est à l'écran, pas quand elle le quitte — c'est
   * ce que la demande dit, et c'est le seul point robuste : le trigger
   * précédent lisait `run.feed` à l'écran SUIVANT, or la pagination y avait
   * déjà remplacé le chunk qui portait la carte, donc il ne partait jamais
   * dès que la scène tenait sur plus d'un écran.
   * Une fois par compte (`maybeAideMenu`), et « Ne plus afficher » coupe tout.
   */
  function aideSiObjet(groupe: FeedEntry[]) {
    if (groupe.some((e) => e.kind === "obtenu")) maybeAideMenu("objet");
  }

  /** L'écran suivant de la séquence (micro-beats) : REMPLACE — le lu est lu,
      l'illustration reste, l'image pleine revient (le nouvel écran est court). */
  function nextChunk() {
    const [tete, ...reste] = beatsSuiteRef.current;
    if (!tete) return;
    // La conséquence du jet a été lue sur l'image du lieu quitté : la vue de
    // marche de la liaison prend le relais maintenant (playtest 7/08).
    if (imageApresConsequence.current) {
      setImage(imageApresConsequence.current);
      setImageKind("scene");
      imageApresConsequence.current = null;
    }
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
    aideSiObjet(tete);
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
    // …et ce qu'il a déjà décidé sur un lieu qui le retient (séjour).
    setChoixFaits(run.choixFaits ?? []);
    // Le SAVOIR (25/07) : ce que le héros a appris survit à la fermeture de
    // l'app (pas à sa mort) — les options débloquées restent ouvertes à la
    // reprise.
    setSavoirs(run.savoirs ?? []);
    setDecouvertes(idsDecouvertes(faitsDe(run)));
    setSceauNiveau(niveauSceau(faitsDe(run)));
    setProphetieJour(run.prophetie ?? null);
    setHeroStats(run.stats);
    const memNow = loadMemory();
    setDonsMirror(donsPortes(memNow));
    setPasseDispoMirror(Boolean(porteuseDisponible("passe", run)));
    setContradictions(contradictionsConnues(memNow).length);
    setEtatsIds(idsEtats(faitsDe(run)));

    // Musique (24/07) : l'Acte I tourne sur les boucles des Landes (rotation
    // aléatoire des 3 pistes). Silencieux si les mp3 ne sont pas déployés.
    // (En démo, l'effet « la musique suit la courbe » ci-dessous impose la
    // piste de la phase avant ce premier départ.)
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
      restored.push(
        ...narrationAffichee(cur, demoActive()).map(
          (text): FeedEntry => ({ id: nextId(), kind: "narration", text })
        )
      );
      // ⚠️ LA REPRISE PASSE AUSSI PAR LE DÉCOUPAGE (panel 10/08). Elle posait
      // la scène entière d'un bloc, sans passer par `decouperEnEcrans` : sur
      // un écran court, un bandeau du Geôlier suivi de sa narration débordait
      // la zone et le bandeau se retrouvait au-dessus de la ligne de
      // flottaison (mesuré : 19 px visibles sur 111 à 640 px de haut). Tout
      // reste marqué « déjà lu » — on ne réanime rien, on pagine.
      const groupesReprise = decouperEnEcrans(restored);
      setBeats(groupesReprise[0]);
      // Déjà lu : tout est révélé d'emblée (affichage instantané), CTA visibles.
      markRevealed(restored.map((e) => e.id));
      setChoicesHidden(groupesReprise.length > 1);
      setBeatsSuite(groupesReprise.slice(1));
      run.feed = groupesReprise[0];
      run.feedSuite = groupesReprise.slice(1);
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
      // Jusqu'à trois reliques portées (spec 20/08) : les dettes s'additionnent
      // comme les dons — deux « marque » pèsent deux crans, deux « usure »
      // entament deux fois le corps.
      const dettesDepart = dettesPortees(mem);
      const nMarque = dettesDepart.filter((d) => d === "marque").length;
      const nUsure = dettesDepart.filter((d) => d === "usure").length;
      if (nMarque > 0) run.soupcon = Math.min(6, (run.soupcon ?? 0) + nMarque);
      if (nUsure > 0) run.health = Math.min(run.health, 1 - 0.18 * nUsure);
      const opening = sceneFromTrav(run.trav); // = la Borne (ENTRY_SCENE)
      setScene(opening);
      setVisitedMirror(run.trav.visited);
      const illo = opening.illustration ?? PORTAL;
      lastSceneIlloRef.current = illo;
      setImage(illo);
      setImageKind("scene");
      const openingNarration = [...narrationAffichee(opening, demoActive())];
      // LA TRACE DE L'INCARNATION PRÉCÉDENTE (mémo IA externe 8/08, niv. 1-2 :
      // « dans les 30 à 90 premières secondes, le joueur doit savoir que cette
      // nouvelle vie n'est pas un recommencement identique »). La CAUSE de la
      // dernière mort marque la Borne — une ligne, jamais une explication.
      let traceDuPrecedent: string | null = null;
      if (mem.deaths > 0 && mem.lastDeath && !mem.lastDeath.fixation) {
        const lieuMort = mem.lastDeath.lieu ?? "";
        traceDuPrecedent = (
          lieuMort.includes("mare")
            ? "Au pied de la borne, une auréole sombre — de l'eau, séchée " +
                "depuis peu, à un endroit où il n'a pas plu."
            : lieuMort.includes("colline") || lieuMort.includes("pendu")
              ? "Un bout de corde neuve est noué au sommet de la borne. Le " +
                "nœud est récent. Personne n'attache rien à une borne."
              : lieuMort.includes("bete") || lieuMort.includes("chien") || lieuMort.includes("meute")
                ? "Le granit porte des griffures fraîches, à hauteur de " +
                  "poitrine. Quelque chose est venu jusqu'ici. Et a attendu."
                : "Quelqu'un est passé ici avant toi. Récemment. L'herbe est " +
                  "couchée autour de la pierre, et aucune trace ne repart."
        );
      }
      // ⚠️ ELLE ARRIVE MAINTENANT, PAS DEUX TAPS PLUS LOIN (panel 10/08).
      // Poussée en queue de liste, elle tombait après les 90 mots du premier
      // écran — donc sur le deuxième, seule, détachée de la pierre qu'elle
      // décrit. Le panel : « la trace du prédécesseur arrive seule, deux
      // touchers plus loin ». Elle s'insère donc APRÈS le premier paragraphe
      // de la Borne, dans le même écran que la borne elle-même.
      if (traceDuPrecedent) openingNarration.splice(1, 0, traceDuPrecedent);
      // Chaque vie commence à la Borne : on la compte ici (aucune
      // orientation n'y mène) — l'Hésitant peut ainsi se souvenir.
      if (run.step === 0) {
        noterVisiteLieu("borne-frontiere");
        // Codex : la Borne est le seul lieu qu'aucune orientation n'atteint —
        // son entrée se débloque ici, au premier pas de chaque vie.
        debloquerCodex("lieu:borne-frontiere", run.heroName, run.day);
      }
      // LE SCEAU SE PORTE À MÊME LA MAIN (arbitrage 10/08 : « il doit
      // produire quelque chose que je remarque dès ma prochaine
      // incarnation »). Poussé en premier des traces permanentes : c'est le
      // signal le plus fort, il ne doit pas arriver après l'écharde.
      const niveauDuSceau = niveauSceau(faitsDe(run));
      const ligneSceau = ligneSceauOuverture(niveauDuSceau);
      if (ligneSceau) openingNarration.push(ligneSceau);
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
      // (Une ligne, même à deux marques — c'est le Soupçon qui cumule.)
      if (nMarque > 0) {
        openingNarration.push(
          "Ce que tu portes à même la peau tire le regard avant toi. Deux " +
            "gamins te croisent au premier muret, s'arrêtent net, et repartent " +
            "vers le hameau sans courir — ce qui est pire."
        );
      }
      if (nUsure > 0) {
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
      // LA TRANSFORMATION DU 3e PASSAGE : le Geôlier constate, une seule fois,
      // qu'il n'a plus rien à compter. Poussé APRÈS la ligne du dé pour ne pas
      // couper l'ouverture rituelle, et il ne reviendra jamais (`=== 3`).
      const geolierSceau = ligneSceauGeolier(niveauDuSceau);
      if (geolierSceau) seeded.push({ id: nextId(), kind: "jailer", text: geolierSceau });
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
    // ⚠️ JAMAIS sur un écran à décision IMPOSÉE (partie de découverte 8/08 :
    // « Utiliser — Offrandes de la Borne » proposé au muret du Serment, et
    // s'en servir faisait passer à l'écran suivant SANS jurer — la séquence
    // garantie du 24/07 était donc contournable par un objet de soin).
    // Un écran qui porte un serment n'accepte que ses serments.
    const impose = scene.choices.some((c) => c.serment);
    // Le miroir « blessé » se calcule TOUJOURS (il conditionne des choix
    // écrits, pas seulement l'objet de soin) — donc avant tout retour.
    const negNow = run?.effects.some((e) => e.delta < 0) ?? false;
    setBlesseMirror(run ? run.health < 0.75 || negNow : false);
    // Miroir de la Besace, exprimé en CLÉS de `LANDES_OBJETS` (les instances
    // portent un id unique — `pierre-retour-7` — donc on apparie par NOM).
    setBesaceMirror(
      run
        ? Object.keys(LANDES_OBJETS).filter((k) =>
            run.besace.some((i) => i.name === LANDES_OBJETS[k].name)
          )
        : []
    );
    if (!run || impose || scene.liaison || scene.terminal || scene.registre) {
      setActiveChoice(null);
      return;
    }
    // L'OBJET QUI SERT ICI (chantier 12/08 §2) passe AVANT le soin générique :
    // une scène qui a écrit un usage précis l'emporte toujours sur « Utiliser
    // — Baume ». Le jeton `usage:<cle>` sert d'id : c'est lui que
    // `resterSurPlace` inscrit dans `choixFaits`, et que `requiresUsage` lit.
    const uo = scene.usageObjet;
    const porte = uo
      ? run.besace.find((i) => LANDES_OBJETS[uo.objet] && i.name === LANDES_OBJETS[uo.objet].name)
      : undefined;
    if (uo && porte && !(run.choixFaits ?? []).includes(`usage:${uo.cle}`)) {
      setActiveChoice({
        id: `usage:${uo.cle}`,
        label: uo.label,
        useItem: { itemId: porte.id, consequence: uo.consequence },
      });
      return;
    }
    const hasNeg = negNow;
    const hurt = run.health < 0.75 || hasNeg;
    const useful = run.besace
      .map(normalizeItem)
      .find((i) => i.slot === "actif" && ((i.heal && hurt) || (i.cure && hasNeg)));
    setActiveChoice(
      useful ? { id: `use-${useful.id}`, label: `Utiliser — ${useful.name}`, useItem: { itemId: useful.id } } : null
    );
  }, [scene, step, health, beats, choixFaits]);

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
  /* LA MUSIQUE SUIT LA COURBE (go 24/08 : « la musique se penche, puis
     sombre, puis meurt »). En démo, la phase impose la piste des Landes —
     ouverture = 1re boucle, pression = 2e, climax = 3e, la Falaise = silence
     (fondu). Hors démo : rotation normale (forcerPiste(null)). Lu à chaque
     changement d'écran ; lire runRef dans un effet est permis. */
  useEffect(() => {
    if (!demoActive()) {
      forcerPiste(null);
      return;
    }
    const r = runRef.current;
    if (!r) return;
    if (/^falaise-cordes/.test(scene.id) || scene.terminal) {
      forcerPiste("off");
      return;
    }
    const ph = demoPhase({
      visitedCount: r.trav?.visited?.length ?? 1,
      entree: Boolean(r.hameau?.entree) || Boolean(scene.hameauEntree),
      sorti: Boolean(r.hameau?.sorti),
    });
    forcerPiste(ph === "pression" ? 1 : ph === "climax" ? 2 : 0);
  }, [scene]);

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
      // Mini-jeu ouvert (mode démo) : l'écran est au geste, le sablier attend.
      !minigameChoice &&
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
  }, [scene, step, choicesHidden, activeTypingId, selectedId, rolling, timedExpired, minigameChoice]);

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
  /** Rend `true` si l'état a réellement PRIS. Le plafond de deux négatifs et
      le non-empilement peuvent le refuser — et un coût qui ne se pose nulle
      part n'est plus un coût (relecture par agents, 10/08). */
  function poserEtatRun(id: string, dureeEnLieux?: number): boolean {
    const e = etat(id);
    if (!e) return false;
    const f = faitsDe(runRef.current);
    if (idsEtats(f).includes(id)) return false; // un état ne s'empile pas sur lui-même
    // DOSER (retour Patrick 7/08 : « beaucoup trop d'états négatifs
    // cumulés ») : au plus DEUX états négatifs de corps/esprit à la fois —
    // un troisième ne se pose pas, le monde choisit ses malheurs. FIXÉ est
    // exempt : c'est le village qui décide, pas le corps du héros (et le
    // procès en dépend).
    if (ETATS_NEGATIFS_DOSES.includes(id)) {
      const actifs = idsEtats(f).filter((x) => ETATS_NEGATIFS_DOSES.includes(x));
      if (actifs.length >= 2) return false;
    }
    applique(poserEtat(id, idsEtats(f), dureeEnLieux ? step + dureeEnLieux : undefined), f, step);
    persist((run) => {
      run.faits = f.run;
    });
    manifsEnAttente.current = [...manifsEnAttente.current, id];
    setEtatsIds(idsEtats(f));
    return true;
  }

  /**
   * ⚠️ Phase A : les BESOINS n'existent plus comme système. Ils ne se
   * manifestaient QUE par l'état qu'ils finissaient par poser (fièvre, faim,
   * jambe) — les états partis, ils n'avaient plus de visage. Ce qui reste :
   * l'heure du dernier soin / repas / sommeil, notée pour que les scènes
   * puissent s'en servir si on veut réécrire la faim en TEXTE plutôt qu'en
   * statut (c'est la voie que le mémo recommande). Aucun effet mécanique.
   */
  function repondreAuBesoin(b: string) {
    persist((run) => {
      run.besoins = { ...(run.besoins ?? {}), [b]: run.horloge ?? run.day };
    });
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
    /** Beats à placer JUSTE APRÈS la conséquence (lignes calculées : corbeaux,
        troupeau, marque du sud, poteau — elles commentent ce qu'on vient de
        lire, elles ne l'annoncent pas). */
    append?: FeedEntry[];
    /** Choix d'orientation (traversée 21/07) : force la destination (liaison → lieu). */
    toDest?: string;
    /**
     * Bascule vers une scène nommée qui n'est PAS un lieu du pool (rencontre
     * ouverte par un point d'intérêt, spec 24/07 suite). N'entre pas dans
     * `visited` : une rencontre ne compte pas comme un lieu traversé.
     */
    toScene?: string;
    /**
     * Image de l'ÉLÉMENT qu'on vient de toucher (`Choice.illustration`) : elle
     * tient le temps de la conséquence, puis l'écran suivant revient à l'image
     * du lieu. Même mécanique différée que la vue de marche — c'est la
     * grammaire « voir de loin → marcher → toucher » rendue à un choix.
     */
    imageElement?: string;
  }) {
    const nextStep = step + 1;
    // ——— Résolution de la traversée (spec 21/07) ———
    // On quitte l'écran courant (`scene`). Le suivant est : le lieu choisi à une
    // liaison (toDest), la suite d'une chaîne de rencontre, la Descente (fin de
    // traversée), ou une nouvelle LIAISON (marche + orientation).
    const trav: TraversalState = { ...(runRef.current?.trav ?? loadRun().trav) };
    // Le drapeau décrit la liaison COURANTE : tout nouvel écran le recalcule
    // (les deux branches de sortie le reposent à true).
    trav.sortieHameau = false;
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
    // Le popup d'aide vit UN écran (partie de découverte 8/08 : il restait
    // collé en haut de l'écran ~60 écrans d'affilée, faute de fermeture
    // automatique — il a dit ce qu'il avait à dire). Fermé d'entrée ;
    // `maybeAideMenu` peut le reposer plus loin dans ce même cycle.
    setAideMenu(null);
    // Le choix qui expire ne survit jamais à l'écran : timers coupés, état vidé.
    expTimers.current.forEach(clearTimeout);
    expTimers.current = [];
    setExpChoix(null);
    setExpRetire(null);
    let nextScene: SceneType;
    // Armé plus bas si la Croisée qui vient a perdu une de ses deux routes
    // (échec dur au coup précédent, hors séjour).
    let routeFermeeIci = false;
    // Le guide a-t-il absorbé la fermeture de route ? (voir plus bas)
    let guideAbsorbe = false;
    // Le Jour de marche (arbitrage Patrick 7/08) : posé dans la branche
    // toDest, appliqué à la puce + au persist plus bas.
    let jourDeMarche = false;
    // Le lieu qu'on quitte a-t-il été vécu (un jet y a-t-il été lancé) ?
    // Lu dans la branche toDest, avant la remise à zéro. Voir `lieuxEngages`.
    let engageDansLeLieu = false;
    let lieuxEngagesApres: number | null = null;
    let horlogeApres: number | null = null;
    // L'AUBE VIENT QU'ON AIT DORMI OU VEILLÉ (relecture par agents, 10/08) :
    // une scène de nuit avance le Jour une fois, quel que soit le choix. Le
    // repos a son propre `run.day += 1` — la clé `nuit|<id>` évite le double
    // comptage entre les deux voies.
    const engageIciAvant = runRef.current?.engageIci ?? false;
    let nuitPassee: string | null = null;
    if (
      scene.nuit &&
      // …SAUF si le choix dit qu'on ne s'attarde pas (voir `Choice.sansNuit`).
      !sansNuitRef.current &&
      vu(runRef.current?.vus, "nuit|" + scene.id) === 0
    ) {
      nuitPassee = "nuit|" + scene.id;
    }
    sansNuitRef.current = false;
    // Le Soupçon au comble (chantier 3 du 23/07) : la traversée est DÉROUTÉE
    // vers le procès du héros — on vient te chercher, où que tu ailles. Jamais
    // au milieu d'une chaîne de rencontre (on finit d'abord ce qui te tient).
    const soupNow = runRef.current?.soupcon ?? 0;
    // Jamais non plus au MILIEU de la séquence d'entrée du village (7/08 :
    // « je venais de manger… ça m'a emmené direct au tribunal ») — on laisse
    // le héros SORTIR, et le hameau vient le chercher « au tournant du
    // muret », comme l'ouverture du procès le raconte.
    const enSequenceHameau = /^(serment-hameau|hameau-entree|hameau-accueil)/.test(scene.id);
    // ⚠️ Jamais depuis un SÉJOUR non plus : on n'y appelle `advance` que sur
    // le choix qui DIT qu'on part (« Franchir la Descente »). Laisser le
    // procès le détourner referait exactement le défaut qu'on vient de
    // corriger — un bouton qui ne fait pas ce qu'il annonce. Conséquence
    // assumée : atteindre la Palissade à Soupçon comble est une échappée.
    if (
      soupNow >= 6 && !scene.fixationTrial && !scene.chainNext && !scene.sejour &&
      !enSequenceHameau && !trav.done
    ) {
      nextScene = sceneById("proces-du-heros")!;
      trav.phase = "scene";
      trav.current = nextScene.id; // hors `visited` : ce n'est pas un lieu du pool
    } else if (opts?.toScene) {
      // Rencontre ouverte par un point d'intérêt : on reste « dans » le lieu du
      // point de vue de la traversée (rien n'entre dans `visited`), mais l'écran
      // courant devient le premier beat de la rencontre.
      // ⚠️ La Descente ne vit PAS dans `SCENES` (elle est construite à part) :
      // sans ce cas, `resoudre` rendrait undefined et on repartirait de la
      // Borne. `trav.done` est posé ici pour que la reprise retombe bien sur
      // l'écran terminal — c'est `sceneFromTrav` qui le lit.
      if (opts.toScene === "la-descente") {
        nextScene = DESCENTE_SCENE;
        trav.done = true;
      } else {
        nextScene = resoudre(opts.toScene, runRef.current) ?? sceneById(ENTRY_SCENE)!;
      }
      /* LE CLIMAX LIT LA TRAVERSÉE (go 24/08, verrou n°1) : sur l'écran des
         cordes, ce que CETTE vie a fait revient — le tressage déjà vu si la
         Chapelle a été traversée, la corde qu'on transporte si on l'a prise.
         Jamais récité : le joueur reconnaît, ou ne reconnaît pas. */
      if (demoActive() && nextScene.id === "falaise-cordes-2") {
        const lectures: string[] = [];
        if (lieuDejaVisite(trav.visited, "chapelle-des-cordes"))
          lectures.push(DEMO_FALAISE_LECTURES.tressage);
        if ((runRef.current?.besace ?? []).some((b) => /corde coup/i.test(b.name)))
          lectures.push(DEMO_FALAISE_LECTURES.cordeCoupee);
        if (lectures.length)
          nextScene = { ...nextScene, narration: [...nextScene.narration, ...lectures] };
      }
      /* LE GRIMPEUR QUI REMONTE (retour Patrick 25/08) — UNE fois par COMPTE,
         à la première arrivée devant les cordes. C'est le seul « passant » que
         la Falaise admet, et il dit sa règle en échouant : on ne remonte pas.
         Marqueur de compte (jamais de run) : une deuxième vie n'a pas la même
         Falaise, exactement comme le rationnement des surprises. */
      if (nextScene.id === "falaise-cordes-2" && vu(loadMemory().vus, "falaise|remonte") === 0) {
        nextScene = {
          ...nextScene,
          narration: [...nextScene.narration, ...FALAISE_REMONTE],
        };
        mutateMemory((mem) => {
          mem.vus = noter(mem.vus, "falaise|remonte");
        });
      }
      trav.phase = "scene";
      trav.current = nextScene.id;
    } else if (
      opts?.toDest === HAMEAU_SORTIE &&
      demoActive() &&
      vu(runRef.current?.vus, "demo|meute") === 0
    ) {
      /* LA MEUTE AU PORTILLON (démo, segment 9 — la phase Climax commence).
         Franchir le portillon en démo ne rend pas la Croisée : la sortie du
         village EST la rencontre — la réponse, neuf minutes plus tard, à
         « aucun chien n'aboie » de l'arrivée. La couture de sortie se joue
         quand même (on ne se téléporte pas), puis le front des chiens.
         Cas d'école de la CATÉGORIE « retour garanti » (verrou n°2 du go) :
         le jeu complet choisira parmi ce que la vie a réellement planté. */
      const base = resoudre("meute-grise-1", runRef.current) ?? sceneById(ENTRY_SCENE)!;
      const seed = (nextStep * 101 + 13) >>> 0;
      nextScene = {
        ...base,
        narration: [
          FRANCHIT_SORTIE[seed % FRANCHIT_SORTIE.length],
          DEMO_MEUTE_COUTURE,
          ...base.narration,
        ],
      };
      trav.phase = "scene";
      trav.current = "meute-grise-1"; // hors `visited` : un retour, pas un lieu
      trav.liaisonOpts = null;
      persist((r) => {
        if (r.hameau) r.hameau = { ...r.hameau, sorti: true };
        r.vus = noter(r.vus, "demo|meute");
        // La menace de la Meute, si elle avait été plantée, se consomme ici.
        if (r.menace?.id === "meute") r.menace = null;
      });
    } else if (opts?.toDest === HAMEAU_SORTIE) {
      // LE PORTILLON (24/08) : quitter le village est une TRANSITION jouée,
      // pas une arrivée. Rien n'entre dans `visited` (aucun lieu traversé),
      // pas de crédit de Jour, pas d'approche — la liaison de sortie dit
      // d'abord le franchissement (couture), PUIS ouvre deux directions de
      // lande. `hameau.sorti` se pose ICI : c'est le geste qui sort.
      const seed = (nextStep * 101 + trav.visited.length * 7 + 13) >>> 0;
      const guideRoute = etatsActifs(idsEtats(faitsDe(runRef.current))).some(
        (e) => e.rouvreLaRoute
      );
      routeFermeeIci = runRef.current?.routeFermeeEnAttente === true && !guideRoute;
      guideAbsorbe = runRef.current?.routeFermeeEnAttente === true && guideRoute;
      const sortie = makeSortieHameau(trav, seed, runRef.current, routeFermeeIci);
      nextScene = sortie.scene;
      trav.phase = "liaison";
      trav.liaisonOpts = sortie.pair;
      trav.routeFermee = routeFermeeIci;
      trav.seed = seed;
      trav.sortieHameau = true;
      persist((r) => {
        if (r.hameau) r.hameau = { ...r.hameau, sorti: true };
      });
    } else if (opts?.toDest) {
      // LA BÊTE GARDE SON CREUX (playtest 7/08) : plus un « lieu » du pool —
      // elle embusque la route du Chemin Creux (1re visite), puis son
      // chainNext enchaîne sur le lieu lui-même. La destination est comptée
      // visitée dès l'embuscade : le pool ne la réoffre jamais.
      // LE JOUR SE GAGNE (correction Patrick 10/08 — voir `lieuxEngages`).
      // On lit l'engagement AVANT de le remettre à zéro : a-t-on risqué quoi
      // que ce soit dans le lieu qu'on quitte ? Si oui, ce lieu compte ; si
      // non, il ne compte pas — le temps ne se dépose pas sur une traversée
      // où rien n'est arrivé. Jamais un jour AJOUTÉ en punition : le Jour est
      // le score du Registre.
      engageDansLeLieu = runRef.current?.engageIci ?? false;
      const embuscade = opts.toDest === "chemin-creux" && !trav.visited.includes("chemin-creux");
      // LA ROUTE DES LOUPS REFUSÉE (17/08 §2, l'exemple même du document) :
      // l'indice de la Croisée annonçait « des silhouettes grises » — choisir
      // l'autre direction est un vrai contournement, en connaissance de
      // cause, et il ne les efface pas. La menace se pose ICI, avant que
      // `liaisonOpts` ne soit remis à zéro trois lignes plus bas.
      // (Une seule menace à la fois ; et marcher VERS la meute l'apure : on
      // ne peut pas être suivi par ce qu'on affronte.)
      const offert = trav.liaisonOpts;
      if (
        offert?.includes("meute-grise-1") &&
        opts.toDest !== "meute-grise-1" &&
        !runRef.current?.menace
      ) {
        persist((r) => {
          r.menace = { id: "meute", poseeA: trav.visited.length, traces: 0 };
        });
      } else if (opts.toDest === "meute-grise-1" && runRef.current?.menace?.id === "meute") {
        persist((r) => {
          r.menace = null;
        });
      }
      nextScene = resoudre(embuscade ? "bete-chemins-creux" : opts.toDest, runRef.current) ?? sceneById(ENTRY_SCENE)!;
      trav.phase = "scene";
      // Reprise fidèle : fermer l'app pendant l'embuscade doit rendre la
      // Bête, pas le lieu derrière elle.
      trav.current = embuscade ? "bete-chemins-creux" : opts.toDest;
      trav.liaisonOpts = null;
      trav.routeFermee = false;
      // LES CORBEAUX QU'ON N'A PAS COMPTÉS (mémo IA externe 8/08 : l'inaction
      // aussi laisse une trace). Quitter la Colline sans les avoir regardés
      // arme un écho différé — canal des prix différés (§17), rien de neuf.
      // ⚠️ Au moment de l'orientation, `scene` est la LIAISON — l'origine se
      // lit dans `visited` (le dernier lieu, pas encore remplacé par la dest).
      if (
        radical(trav.visited[trav.visited.length - 1] ?? "") === "colline-aux-gibets" &&
        !(runRef.current?.poiSeen ?? []).includes("corbeaux-compte") &&
        !(runRef.current?.debts ?? []).some((d) => d.id === "corbeaux-ignores")
      ) {
        persist((r) => {
          r.debts = [
            ...(r.debts ?? []),
            {
              id: "corbeaux-ignores",
              settleAtStep: nextStep + 3,
              text:
                "Derrière toi, très loin, des battements d'ailes quittent " +
                "une traverse — exactement le compte que tu n'as pas voulu " +
                "faire. Un battement de plus leur répond. Plus près.",
            },
          ];
        });
      }
      if (!trav.visited.includes(opts.toDest)) {
        trav.visited = [...trav.visited, opts.toDest];
        noterVisiteLieu(radical(opts.toDest));
        // LE JOUR AVANCE EN VIVANT (arbitrage 7/08, corrigé le 10/08) : tous
        // les trois lieux OÙ L'ON A TENTÉ QUELQUE CHOSE, un jour passe. La
        // version d'avant comptait les lieux traversés, quoi qu'on y fasse —
        // le joueur le plus prudent accumulait donc le meilleur score du
        // Registre en ne faisant rien. Survivre longtemps redevient avoir
        // vécu longtemps, et les Besoins (comptés en jours) suivent la même
        // mesure.
        // ⚠️ AUCUN CRÉDIT ICI (repasse du 10/08). On y a longtemps compté le
        // lieu quitté — mais à ce point `scene` est TOUJOURS une liaison
        // (`liaison:a>b`), dont le radical n'est pas un lieu, et `engageIci` a
        // déjà été remis à faux en entrant dans la liaison. Le bloc ne pouvait
        // donc jamais tirer : c'est le repli plus bas, sur le changement de
        // radical, qui fait tout le travail. Le garder donnait l'illusion de
        // deux compteurs concurrents.
        // L'HORLOGE DU CORPS avance, elle, à CHAQUE trois lieux traversés —
        // qu'on y ait risqué quelque chose ou non (10/08). Marcher creuse
        // l'estomac ; c'est le Jour qui récompense, pas la faim.
        if (trav.visited.length % 3 === 0) horlogeApres = (runRef.current?.horloge ?? 1) + 1;
      }
    } else if (scene.hameauHalte) {
      // La nuit est passée : la traversée reprend vers la sortie de zone.
      // ⚠️ Elle passe par la PALISSADE comme l'autre chemin (9/08) — cette
      // branche-ci allait droit à la Descente et sautait donc la sortie de
      // zone toute neuve : mesuré sur 6 parties, 2 finissaient sans jamais
      // voir la Palissade. Deux chemins vers la fin, un seul portail.
      nextScene = resoudre(SORTIE_DE_ZONE, runRef.current) ?? DESCENTE_SCENE;
      trav.done = true;
      trav.phase = "scene";
      trav.current = nextScene.id;
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
      // ⚠️ BUG D'ORDRE D'ÉCRITURE (panel 10/08, phase 0 du plan d'élagage) :
      // le drapeau `entree` n'est PERSISTÉ qu'en fin d'advance() — or on est
      // ICI dans le même appel quand on QUITTE la scène qui achève l'entrée
      // (`hameauEntree`). Sans ce OU, la Halte était sautée et « Entrer dans
      // le hameau » déposait sur la Palissade Sud (la téléportation vue par
      // les dix testeurs n'était pas un artefact de la réplique).
      const entreeFaite = Boolean(ham?.entree) || Boolean(scene.hameauEntree);
      if (entreeFaite && !ham?.halte) {
        // Dette « exclusion » d'une relique portée (5/08, Clou du silence) :
        // le Hameau ne t'ouvre pas sa grange, quoi que tu aies juré. Même
        // conséquence qu'un Serment refusé — la nuit dehors.
        const exclu = dettesPortees(loadMemory()).includes("exclusion");
        nextScene = resoudre(
          ham?.serment === "refuse" || exclu ? "hameau-halte-dehors" : "hameau-halte-1",
          runRef.current
        )!;
        trav.phase = "scene";
        trav.current = nextScene.id; // hors `visited` : ce n'est pas un lieu du pool
      } else {
        // ——— LA PALISSADE EST LA FIN DE ZONE (arbitrage Patrick 9/08).
        // Elle était dans le pool : on pouvait donc l'atteindre au milieu
        // d'une vie, s'entendre dire « la Descente n'est plus loin »… puis
        // repartir tourner dans la lande. L'objectif atteint était repris.
        // Désormais elle n'est plus tirable, et c'est ELLE qu'on rejoint au
        // bout de la traversée : Palissade → Veilleur → la Descente.
        nextScene = resoudre("palissade-sud", runRef.current) ?? DESCENTE_SCENE;
        trav.done = true;
        trav.phase = "scene";
        trav.current = nextScene.id;
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
      // ═══ LE RETOUR DE LA MENACE (17/08 §2-4) ═══════════════════════════
      // Même grammaire que le Troupeau : un déroutage de MARCHE, jamais une
      // entrée du pool. Conditions, toutes causales : une menace est active
      // (posée par un contournement réel), au moins DEUX lieux ont passé
      // (les traces ont eu le temps de se lire), et on marche en pleine
      // lande — une meute dans les ruelles du village serait un non-sens.
      // La menace se CONSOMME au retour, gagné ou perdu : une seule fois.
      const men = runRef.current?.menace;
      const dernierLieu = trav.visited[trav.visited.length - 1] ?? "";
      const enLande =
        !isHameauInterior(dernierLieu) && !/^(serment-hameau|hameau-)/.test(dernierLieu);
      const demoOn = demoActive();
      /* ═══ LA COURBE DE LA DÉMO (go 24/08) — trois déroutages scriptés,
         AVANT le tirage. Chacun se joue une fois (marqué dans `vus`, donc
         fidèle à la reprise), aucun n'entre dans `visited`. */
      if (
        demoOn &&
        trav.visited.length === 1 &&
        trav.visited[0] === "borne-frontiere" &&
        vu(runRef.current?.vus, "demo|geste|borne-frontiere") === 0 &&
        !scene.liaison
      ) {
        /* LE GESTE DE LA BORNE EST GARANTI (verrou n°1) : si le premier acte
           n'était pas le tour de la pierre (dont le frottage est le geste),
           la Borne retient le héros un pas de plus — et le CADRAGE dit
           pourquoi LUI veut regarder : l'éclat frôlé sous les offrandes, ou
           le point que l'homme immobile fixait. Jamais trois routes qui
           convergent vers le même bouton : la situation converge, pas l'acte. */
        const base = resoudre("demo-borne-geste", runRef.current)!;
        const cadrage = (runRef.current?.looted ?? []).includes("offrandes-borne")
          ? DEMO_BORNE_CADRAGES.offrandes
          : /^hesitant/.test(scene.id)
            ? DEMO_BORNE_CADRAGES.homme
            : DEMO_BORNE_CADRAGES.defaut;
        nextScene = { ...base, narration: [cadrage, ...base.narration] };
        trav.phase = "scene";
        trav.current = "demo-borne-geste";
        persist((r) => {
          r.vus = noter(r.vus, "demo|geste|borne-frontiere");
        });
      } else if (
        demoOn &&
        vu(runRef.current?.vus, "demo|nuit") === 0 &&
        Boolean(runRef.current?.hameau?.entree) &&
        !runRef.current?.hameau?.sorti &&
        lieuDejaVisite(trav.visited, "chapelle-des-cordes") &&
        lieuDejaVisite(trav.visited, "marche-muet") &&
        !lieuDejaVisite(trav.visited, "puits-condamne")
      ) {
        /* LA NUIT TOMBE (segment 7 — la phase Pression devient DIÉGÉTIQUE :
           pas un compteur, la nuit). Entre le Marché et le Puits, dormir
           s'impose — trois portes, dont le Crochetage. */
        nextScene = resoudre("demo-nuit", runRef.current)!;
        trav.phase = "scene";
        trav.current = "demo-nuit";
        persist((r) => {
          r.vus = noter(r.vus, "demo|nuit");
        });
      } else if (
        demoOn &&
        /^meute-grise/.test(scene.id) &&
        vu(runRef.current?.vus, "demo|falaise") === 0
      ) {
        /* LA FALAISE (segment 10) : passé la Meute, le sol descend vers le
           bord du monde. Déroutage direct — la Falaise n'est pas un lieu du
           pool, c'est le dernier beat de la courbe. */
        const base = resoudre("falaise-cordes", runRef.current)!;
        nextScene = { ...base, narration: [DEMO_FALAISE_APPROCHE, ...base.narration] };
        trav.phase = "scene";
        trav.current = "falaise-cordes";
        persist((r) => {
          r.vus = noter(r.vus, "demo|falaise");
        });
      } else if (
        men &&
        enLande &&
        // EN DÉMO LE RETOUR EST GARANTI dès qu'une trace s'est lue (verrou
        // n°1 : « si j'ai esquivé la Bête, je dois reconnaître que c'est
        // elle qui me rattrape ») — le 45 % du jeu complet rendait la
        // phase Pression invisible une partie sur deux.
        trav.visited.length - men.poseeA >= (demoOn ? 1 : 2) &&
        !scene.liaison &&
        (demoOn ? men.traces >= 1 : chance(0.45))
      ) {
        nextScene = resoudre("menace-retour-" + men.id, runRef.current)!;
        trav.phase = "scene";
        trav.current = nextScene.id; // hors `visited` : pas un lieu du pool
        persist((r) => {
          r.menace = null;
        });
      } else if (fromEst && !troupeauVu && !scene.liaison && chance(0.35)) {
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
      // Même bug d'ordre d'écriture que la Halte (voir plus haut) : sans le
      // OU, la croisée qui suit IMMÉDIATEMENT l'entrée au village excluait
      // tout l'intérieur — dans 100 % des parties.
      const entered = Boolean(runRef.current?.hameau?.entree) || Boolean(scene.hameauEntree);
      // L'ENCLAVE (chantier fluidité 12/08) : d'où part-on ? Le dernier lieu
      // traversé dit si l'on est encore dans les rues du village. La séquence
      // du Seuil compte comme dedans — on y est déjà entre les maisons.
      const dernier = trav.visited[trav.visited.length - 1] ?? "";
      const dedans =
        entered &&
        !runRef.current?.hameau?.sorti &&
        (isHameauInterior(dernier) || /^(serment-hameau|hameau-)/.test(dernier));
      // UN ÉCHEC DUR A DÉPENSÉ QUELQUE CHOSE : hors séjour il n'y avait pas
      // d'option à retirer, alors c'est le MONDE qui se resserre — cette
      // Croisée-ci n'offre plus qu'une direction.
      // LE GUIDE CONNAÎT UN AUTRE CHEMIN (le Gamin des Murets) : tant qu'il
      // accompagne, la route ne se referme pas. Calculé AVANT le fork
      // sortie/Croisée (24/08) : les deux écrans paient le même prix.
      const guideRoute = etatsActifs(idsEtats(faitsDe(runRef.current))).some(
        (e) => e.rouvreLaRoute
      );
      routeFermeeIci = runRef.current?.routeFermeeEnAttente === true && !guideRoute;
      guideAbsorbe = runRef.current?.routeFermeeEnAttente === true && guideRoute;
      // LES RUES ENCORE INCONNUES (24/08) : quand il n'en reste aucune, on ne
      // fabrique pas une Croisée pour un seul bouton — la marche suivante EST
      // la sortie du village (couture + deux directions de lande, un écran).
      const ruesLibres = dedans
        ? TRAVERSAL_POOL.filter(
            (id) => isHameauInterior(id) && !lieuDejaVisite(trav.visited, id)
          )
        : [];
      if (dedans && !ruesLibres.length) {
        const sortie = makeSortieHameau(trav, seed, runRef.current, routeFermeeIci);
        nextScene = sortie.scene;
        trav.liaisonOpts = sortie.pair;
        trav.sortieHameau = true;
        persist((r) => {
          if (r.hameau) r.hameau = { ...r.hameau, sorti: true };
        });
      } else {
      const pair = pickLiaisonOptions(
        trav.visited, seed, entered, dedans, Boolean(runRef.current?.hameau?.sorti)
      );
      // ⚠️ Phase A : LE DIRECTEUR DE ROUTES est retiré avec les Besoins. Il
      // forçait une Croisée à offrir un remède quand un besoin pressait — sans
      // besoin, il n'a plus rien à diriger. L'idée reste bonne (« ne jamais
      // laisser un héros sans issue proposée ») et pourra revenir sur un autre
      // porteur : la blessure, par exemple.
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
        !lieuDejaVisite(trav.visited, chapDef.lieuId) &&
        !pair.includes(chapDef.lieuId) &&
        (entered || !isHameauInterior(chapDef.lieuId)) &&
        // ⚠️ L'ENCLAVE (12/08) : la garantie ne peut pas ramener le village
        // une fois qu'on en est sorti — elle écrasait le pool APRÈS lui, et
        // ré-offrait le Petit Tribunal à un héros qui avait quitté le hameau.
        !(isHameauInterior(chapDef.lieuId) && runRef.current?.hameau?.sorti) &&
        // ⚠️ …et dans l'AUTRE sens aussi (24/08) : depuis une rue, un lieu de
        // chapitre EXTÉRIEUR ne peut pas être offert — c'est par cette brèche
        // qu'un combat de lande arrivait « à deux pas du Puits ».
        !(dedans && !isHameauInterior(chapDef.lieuId))
      ) {
        // Jamais sur le slot du portillon : sortir reste toujours possible.
        const slot =
          pair[0] === HAMEAU_SORTIE ? 1 : pair[1] === HAMEAU_SORTIE ? 0 : seed % 2;
        pair[slot] = chapDef.lieuId;
      }
      // Signature garantie (chantier 6 du 23/07) : la Colline aux Gibets est
      // OFFERTE à chaque liaison tant qu'elle n'a pas été visitée — l'identité
      // de la zone ne doit pas pouvoir être manquée par malchance de tirage.
      // (Le joueur peut encore choisir l'autre direction : quasi-totalité, pas
      // obligation.) Compatible avec la garantie de chapitre : slots opposés.
      // ⚠️ …mais pas DEPUIS une rue du village (enclave, 12/08) : d'un seuil
      // à l'autre on ne part pas pour une colline à deux lieues. La signature
      // de la zone attend qu'on soit ressorti — elle est garantie à chaque
      // Croisée de lande, elle ne perd donc rien.
      if (
        !dedans &&
        !lieuDejaVisite(trav.visited, "colline-aux-gibets") &&
        !pair.includes("colline-aux-gibets")
      ) {
        pair[(seed + 1) % 2] = "colline-aux-gibets";
      }
      // ═══ MODE DÉMO (script 24/08) : la Croisée sert la ROUTE scriptée.
      // Le rythme d'une démo est une courbe dessinée à la main, jamais un
      // tirage — on écrase la paire APRÈS les garanties (chapitre, Colline) :
      // en démo, la courbe prime sur elles. Le second bouton reste une vraie
      // direction (l'étape d'après, ou un lieu du tirage) pour que
      // l'agentivité se sente. Route épuisée → le tirage normal reprend
      // (les segments au-delà du Puits arrivent aux vagues suivantes).
      if (demoActive()) {
        // ⚠️ L'ENCLAVE VAUT AUSSI POUR LA ROUTE SCRIPTÉE (retours Patrick
        // 24/08, deux fois). La 1re version écrasait la paire sans la porte
        // du village ; la 2e respectait la porte mais servait ENCORE la lande
        // depuis une rue quand les étapes intérieures étaient épuisées, et
        // son second bouton de repli acceptait n'importe quel lieu du tirage
        // une fois entré. Désormais la route passe par les MÊMES murs que le
        // tirage : dedans elle ne remplace que la RUE offerte (jamais le
        // portillon), et la lande ne revient qu'après la sortie jouée
        // (makeSortieHameau la sert sur l'écran de sortie lui-même).
        const resteBrut = demoRouteRestante(trav.visited, lieuDejaVisite);
        if (dedans) {
          const resteDedans = resteBrut.filter((id) => isHameauInterior(id));
          if (resteDedans.length) {
            pair[pair[0] === HAMEAU_SORTIE ? 1 : 0] = resteDedans[0];
          }
        } else {
          // Dehors (avant l'entrée ou après la sortie) : jamais un lieu
          // intérieur — la porte (le Serment) n'est pas dans HAMEAU_INTERIOR,
          // elle reste offerte tant qu'elle n'est pas visitée.
          const reste = resteBrut.filter((id) => !isHameauInterior(id));
          if (reste.length) {
            const second =
              reste[1] ??
              pair.find(
                (p) =>
                  !lieuDejaVisite([reste[0]], p) &&
                  !isHameauInterior(p) &&
                  p !== HAMEAU_SORTIE
              ) ??
              reste[0];
            pair[0] = reste[0];
            pair[1] = second;
          }
        }
      }
      // Ambiance contextuelle (chantier 4) : provenance = le lieu qu'on quitte.
      nextScene = makeLiaison(
        pair[0],
        pair[1],
        seed,
        liaisonCtx(runRef.current ?? loadRun(), scene.liaison ? undefined : scene.id),
        routeFermeeIci
      );
      trav.liaisonOpts = pair;
      }
      if (guideAbsorbe) {
        nextScene = {
          ...nextScene,
          narration: [
            ...nextScene.narration,
            "Le gamin te tire par la manche avant la fourche et coupe par un " +
              "creux que tu n'avais pas vu. « Par là c'est fermé. Par là non. » " +
              "Il ne dit pas comment il le sait.",
          ],
        };
      }
      // LES TRACES DE LA MENACE (17/08) : tant qu'elle suit et qu'on marche
      // en lande, chaque liaison sert la trace suivante — la première tombe
      // TOUJOURS avant tout retour possible (il exige deux lieux d'écart) :
      // la causalité se lit avant la conséquence. Deux traces, pas plus.
      if (men && enLande && men.traces < TRACES_MENACE[men.id].length) {
        nextScene = {
          ...nextScene,
          narration: [...nextScene.narration, TRACES_MENACE[men.id][men.traces]],
        };
        persist((r) => {
          if (r.menace) r.menace = { ...r.menace, traces: r.menace.traces + 1 };
        });
      }
      trav.phase = "liaison";
      trav.routeFermee = routeFermeeIci;
      trav.seed = seed;
      }
    }
    // ——— Soupçon (chantier 3) : montée à l'arrivée + manifestation ———
    // Le palier ne se MONTRE qu'une fois (soupconSeen), toujours en monde
    // lisible, jamais en chiffre. Le palier 6 n'a pas de texte : le procès
    // du héros EST sa manifestation.
    const soupAfter = Math.max(0, Math.min(6, soupNow + (nextScene.soupconOnArrival ?? 0)));
    const soupSeen = runRef.current?.soupconSeen ?? 0;
    // ⚠️ Les 5 manifestations du Soupçon mettent toutes des VILLAGEOIS en
    // scène (la mère, la Doyenne, la croix sur un seuil, les trois hommes) :
    // servies en pleine lande, elles téléportaient le village autour du héros
    // (capture Patrick 7/08 — la Doyenne à la Colline aux Gibets). Le palier
    // ATTEND donc la prochaine arrivée AU VILLAGE pour se montrer — le
    // Soupçon compte partout, mais il ne se LIT que là où on te regarde.
    // …mais ATTENDRE le village ne peut pas vouloir dire NE JAMAIS RIEN DIRE
    // (panel 9/08) : le Soupçon monte dehors, sur des actes commis dehors, et
    // le joueur découvrait sa jauge au moment du procès. Hors village, c'est
    // donc la CRAIE qui parle — une marque, personne en scène, et elle se
    // rapproche de la peau à chaque palier. Les deux pistes marquent
    // `soupconSeen` : quoi qu'il arrive, un palier franchi se voit.
    // ⚠️ UN CRAN À LA FOIS (panel 10/08, phase 0 du plan d'élagage) : un +2
    // ou un doublement MARQUÉ sautait deux à quatre paliers et n'en montrait
    // qu'un — d'où « la craie a CHANGÉ de place » sans première marque, et
    // « deux marques sur le même bras » quand elles étaient sur un muret et
    // une besace. On sert toujours le PROCHAIN palier non vu ; s'il en reste,
    // ils se montrent aux arrivées suivantes, dans l'ordre de la migration.
    const palierAServir = soupSeen + 1;
    const soupCroise =
      !nextScene.fixationTrial && soupAfter > soupSeen && palierAServir <= 5;
    const soupManifest = !soupCroise
      ? null
      : dansLeVillage(nextScene.id)
        ? (SOUPCON_PALIERS[palierAServir] ?? null)
        : (SOUPCON_CRAIE[palierAServir] ?? null);
    // Et le Geôlier met un mot sur ce qui n'a pas de chiffre.
    const soupJailer = soupManifest ? (SOUPCON_GEOLIER[palierAServir] ?? null) : null;

    // Savoir énoncé par la narration de la scène d'arrivée (25/07), s'il est neuf.
    const knownNow = runRef.current?.savoirs ?? [];
    const arrivalSavoir =
      nextScene.savoir && !knownNow.includes(nextScene.savoir) ? nextScene.savoir : null;
    // Découverte acquise en ATTEIGNANT la scène (6/08) : la Fille au Moulin
    // n'a pas de choix à prendre pour qu'on ait compris qu'elle est vivante —
    // l'avoir vue suffit.
    const arrivalDecouverte = nextScene.decouverte ?? null;

    // ⚠️ LE LIEU QU'ON QUITTE COMPTE, MÊME HORS `toDest` (relecture par
    // agents, 10/08). `lieuxEngages` n'était incrémenté que dans la branche
    // d'orientation : toute la région terminale — la Halte du Hameau et la
    // Palissade, entrées hors `visited` — portait SIX jets qui ne pouvaient
    // créditer aucun Jour, contre un « Dormir » qui en créditait un. Mesuré
    // sur 64 vies : 60 % des Jours du joueur optimal venaient du sommeil.
    // ⚠️ …MAIS UNE SEULE FOIS PAR LIEU (relecture par agents, 10/08). Le
    // crédit se prend au changement de RADICAL, or un lieu qui ouvre une
    // rencontre en franchit trois — verger-noir → epoux → verger-noir-2 →
    // liaison. Prendre le détour optionnel valait donc trois lieux au lieu
    // d'un : un Jour entier offert, invisible, à cinq endroits de la zone.
    // `trav.credites` retient les radicaux déjà comptés cette traversée.
    const radicalQuitte = radical(scene.id);
    if (
      lieuxEngagesApres === null &&
      engageIciAvant &&
      radical(nextScene.id) !== radicalQuitte &&
      // Une RENCONTRE n'est pas un lieu (elle n'entre déjà pas dans
      // `trav.visited`) : quitter les Époux ne crédite rien, c'est le Verger
      // qui compte, une fois.
      estUnLieu(radicalQuitte) &&
      !(trav.credites ?? []).includes(radicalQuitte)
    ) {
      trav.credites = [...(trav.credites ?? []), radicalQuitte];
      lieuxEngagesApres = (runRef.current?.lieuxEngages ?? 0) + 1;
      if (lieuxEngagesApres % 3 === 0) jourDeMarche = true;
    }

    const nextIllustration = nextScene.illustration ?? PORTAL;
    const contextChanged = nextIllustration !== lastSceneIlloRef.current;
    const entries: FeedEntry[] = [];
    let obtainedItem: BesaceItem | null = null;

    // Jour de marche : la puce ouvre l'écran d'arrivée, avant la couture et
    // l'approche — le temps passe PENDANT la route, pas après.
    if (jourDeMarche || nuitPassee) {
      entries.push({ id: nextId(), kind: "day", day: (runRef.current?.day ?? day) + 1 });
    }
    // LE GEÔLIER COMPTE (10/08) : il est le seul à voir les chiffres, et la
    // seule voix qui peut dire au joueur passif ce qu'il est en train de ne
    // pas gagner. UNE fois par vie, au deuxième lieu quitté sans avoir rien
    // tenté — assez tôt pour servir, assez rare pour ne pas sermonner.
    if (opts?.toDest && !engageDansLeLieu) {
      const refus = vu(runRef.current?.vus, "refus") + 1;
      persist((r) => { r.vus = noter(r.vus, "refus"); });
      if (refus === 2 && vu(runRef.current?.vus, "refus-dit") === 0) {
        entries.push({ id: nextId(), kind: "jailer", text: JAILER_SANS_RISQUE });
        persist((r) => { r.vus = noter(r.vus, "refus-dit"); });
      }
    }
    if (opts?.prepend) entries.push(...opts.prepend);
    // La conséquence du jet précède la mise en place de la scène suivante.
    if (opts?.consequence) {
      entries.push({ id: nextId(), kind: "narration", text: opts.consequence });
    }
    // ⚠️ LES LIGNES CALCULÉES SE LISENT APRÈS, JAMAIS AVANT (13/08). Un point
    // d'intérêt les servait après son examen ; en devenant des choix, elles
    // étaient passées en TÊTE — et la Borne annonçait le nom du prédécesseur
    // avant le paragraphe qui pose la question « alors qui a gravé côté sud ? ».
    // La réponse arrivait avant la question. Trouvé en jouant, pas en relisant.
    if (opts?.append) entries.push(...opts.append);
    // Récompense du Destin : bandeau « Obtenu » juste après la conséquence.
    if (opts?.destinItem) {
      const it = opts.destinItem;
      obtainedItem = it;
      entries.push(entreeObtenu(nextId(), it));
    }
    // Objet gagné par un choix d'examen réussi (grantsLoot, 23/07) : même
    // bandeau « Obtenu » — déjà persisté côté Besace dans onComplete.
    if (opts?.grantedItem) {
      const it = opts.grantedItem;
      obtainedItem = it;
      entries.push(entreeObtenu(nextId(), it));
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
    // ⚠️ Si le PROCÈS a dérouté la traversée, la destination choisie est
    // ABANDONNÉE : sa couture, son approche et sa phrase d'arrivée ne doivent
    // pas se jouer (transcript v3C du 8/08 : l'arrivée à la Mare — « Le vent
    // tombe d'un coup… tu as longé le talus » — collée à l'ouverture du
    // procès sur le même écran, deux lieux dans la même respiration).
    if (opts?.toDest && !nextScene.fixationTrial) {
      const origine = trav.visited.length >= 2 ? trav.visited[trav.visited.length - 2] : undefined;
      const entre = isHameauInterior(opts.toDest) && !isHameauInterior(origine);
      // SORTIE : la séquence du Seuil (accueil, rue, muret) se joue DANS les
      // rues même si elle reste « dehors » pour le pool — la quitter vers la
      // lande mérite la ligne de sortie (playtest 7/08 : rue → crête du Pendu
      // sans couture). L'ENTRÉE, elle, garde le strict intérieur : la
      // narration du Seuil raconte déjà l'arrivée au village.
      const sort = !isHameauInterior(opts.toDest) && !!origine &&
        (isHameauInterior(origine) || /^(serment-hameau|hameau-)/.test(origine)) &&
        // La sortie JOUÉE (le portillon, 24/08) a déjà dit le franchissement
        // sur son propre écran — on ne le redit pas à l'arrivée du premier
        // lieu de lande. Ce bloc reste le filet des chemins qui n'y passent
        // pas (et c'est lui qui pose `sorti` dans ce cas).
        !runRef.current?.hameau?.sorti;
      if (entre || sort) {
        // Anti-répétition intra-run (rapport IA externe 8/08 : la même sortie
        // de village rejouée mot pour mot « donne l'impression de revisiter
        // une carte déjà chargée ») — même mémoire que les ambiances de
        // liaison. Pool épuisé → il redevient entier, comme partout.
        const pool = entre ? FRANCHIT_ENTREE : FRANCHIT_SORTIE;
        const vues = runRef.current?.liaisonVues ?? [];
        const frais = pool.filter((t) => !vues.includes(t));
        const eligibles = frais.length ? frais : pool;
        const text = eligibles[nextStep % eligibles.length];
        entries.push({ id: nextId(), kind: "narration", text });
        persist((r) => {
          if (!(r.liaisonVues ?? []).includes(text)) r.liaisonVues = [...(r.liaisonVues ?? []), text];
          // On ne quitte le village qu'une fois par vie : à partir d'ici, ni
          // la porte ni les rues ne reviennent dans les destinations tirables.
          if (sort && r.hameau) r.hameau = { ...r.hameau, sorti: true };
        });
      }
    }
    if (opts?.toDest && !nextScene.fixationTrial && APPROACH_NARRATION[opts.toDest]) {
      entries.push({ id: nextId(), kind: "narration", text: APPROACH_NARRATION[opts.toDest] });
    }
    // …et COMMENT on y arrive : une seule phrase, jamais un paragraphe.
    // ⚠️ VARIATION NARRATIVE, pas une décision (voir phraseArrivee) : le mode
    // ne dépend pas de la route choisie et n'a aucune conséquence mécanique.
    const arriveePhrase = opts?.toDest && !nextScene.fixationTrial
      ? phraseArrivee(nextStep, runRef.current?.arriveeVues ?? [])
      : null;
    // ⚠️ Chantier fluidité 12/08 : cette phrase est de la COULEUR PURE — le
    // mode d'arrivée « n'a aucune conséquence mécanique » (décision du 5/08,
    // juste au-dessus). Elle coûtait pourtant un bloc à CHAQUE arrivée, en
    // plus de l'approche et du rappel. Elle entre donc au budget, en dernière
    // priorité : elle ne passe que si rien de plus signifiant n'a à se dire.
    const rappelArrivee = arriveePhrase;
    // LE PROCÈS (5/08) : on ne lit pas d'acte d'accusation, on appelle des
    // gens. Les dépositions s'intercalent entre l'arrivée au tribunal et la
    // sentence — le joueur relit sa propre run, dans l'ordre où il l'a jouée.
    //
    // Le don « silence » (Clou du silence) efface le PREMIER inscrit — celui
    // qui a entraîné les autres. Dépensé ici, une fois par vie.
    const porteuseSilence = nextScene.fixationTrial
      ? porteuseDisponible("silence", runRef.current)
      : null;
    const bailloner = Boolean(porteuseSilence);
    // Il n'apparaît qu'au procès de qui l'a déjà entrevu dans une ruelle.
    const temoinEntrevu =
      Boolean(nextScene.fixationTrial) && decouvertes.includes("d.temoin_entrevu");
    const temoinsAuProces = (() => {
      // Les actes DÉJÀ jugés ne reviennent pas à l'accusation (10/08).
      const juges = runRef.current?.temoinsJuges ?? [];
      const t = temoinsUniques((runRef.current?.temoins ?? []).filter((x) => !juges.includes(x.id)));
      return bailloner ? t.slice(1) : t;
    })();
    // L'AIGUILLAGE (panel 9/08) : la scène qui suit LIT le dé qui la précède.
    // Deux versions au plus — tenu / pas tenu. Sans version d'échec, la scène
    // se lit dans les deux cas (vérifié texte par texte, pas supposé).
    const narrationDeScene =
      opts?.fail && nextScene.narrationEchec?.length
        ? nextScene.narrationEchec
        : narrationAffichee(nextScene, demoActive());
    // ── LA STRATE DE FAMILIARITÉ, calculée AVANT la narration ─────────────
    // Elle peut REMPLACER un paragraphe (`remplace`) au lieu de s'y ajouter :
    // une ligne de mémoire écrite comme un remplacement et injectée comme un
    // ajout est le défaut que le panel du 10/08 a le plus rapporté (le chien
    // du Bailli qui se lève et ne se lève pas sur le même écran).
    const lieuIci = radical(nextScene.id);
    const famDef = FAMILIARITE[lieuIci];
    // Une strate ne se joue que sur SON écran (par défaut celui d'arrivée).
    const famIci = famDef && (famDef.sur ?? lieuIci) === nextScene.id ? famDef : null;
    const cleFam = "fam|" + lieuIci;
    const strate = (() => {
      if (!famIci) return null;
      // Portée RUN : deux beats du même lieu passent tous deux par ici.
      if (vu(runRef.current?.vus, cleFam) > 0) return null;
      const passages = (loadMemory().visitesLieux ?? {})[lieuIci] ?? 0;
      return passages >= 4 && famIci.quatre ? famIci.quatre : passages >= 2 ? famIci.deux : null;
    })();

    const narrationLines = nextScene.fixationTrial
      ? [
          narrationDeScene[0],
          /* CE QU'ON APPORTE AU PROCÈS se DIT — un bénéfice que rien ne
             raconte n'existe pas (Phase C). ⚠️ Ces lignes étaient poussées
             après coup par un effet, qui les insérait bien dans `beats` mais
             JAMAIS dans la file de révélation séquentielle : un bloc qu'on
             n'a pas enfilé ne rend rien (règle du 11/07). Elles étaient donc
             invisibles depuis leur écriture. Assemblées ici, elles sont
             paginées et révélées comme le reste. */
          ...apportsProces(runRef.current ?? {}).map((a) => a.ligne),
          // Le hameau se souvient d'avoir relaxé (panel 10/08) : la salle ne
          // rejoue pas le premier procès, elle en tire les conséquences.
          ...((runRef.current?.procesGagnes ?? 0) > 0 ? [SECOND_PROCES] : []),
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
          ...narrationDeScene.slice(1),
        ]
      : narrationDeScene;
    const lignesFinales =
      strate && famIci?.remplace !== undefined && narrationLines[famIci.remplace] !== undefined
        ? narrationLines.map((t, i) => (i === famIci.remplace ? strate : t))
        : narrationLines;
    entries.push(...lignesFinales.map((text): FeedEntry => ({ id: nextId(), kind: "narration", text })));
    // L'écho d'un objet-promesse (voir ECHOS_OBJET) : ce que tu portes te
    // rattrape là où ça compte, une fois par scène et par objet.
    for (const e of ECHOS_OBJET[nextScene.id] ?? []) {
      const porte = (runRef.current?.besace ?? []).some((i) => i.name.includes(e.objet));
      const dejaDit = (runRef.current?.echosObjet ?? []).includes(nextScene.id + "|" + e.objet);
      if (porte && !dejaDit) {
        entries.push({ id: nextId(), kind: "narration", text: e.text });
        persist((r) => {
          r.echosObjet = [...(r.echosObjet ?? []), nextScene.id + "|" + e.objet];
        });
      }
    }
    /**
     * ─── BUDGET D'UN SEUL RAPPEL PAR ARRIVÉE (chantier fluidité 12/08) ─────
     *
     * ⚠️ Mesuré le 12/08 : DOUZE injections de narration différentes peuvent
     * tomber sur la même arrivée (approche, mode, familiarité, mémoire d'un
     * PNJ, perception, réaction d'état, corbeaux, fantôme, craie, loi…).
     * C'est cet EMPILEMENT — pas la longueur des textes — qui produit les
     * 4-5 taps de lecture avant la première décision. Aucune de ces lignes
     * n'est mauvaise ; c'est leur cumul qui l'est.
     *
     * Règle : les ÉVÉNEMENTS (quelque chose arrive maintenant : un état se
     * pose, un état se lève, les corbeaux ont changé de nombre, un fantôme
     * passe) gardent le droit de s'afficher. Les RAPPELS (le monde te
     * re-signale ce que tu sais déjà : familiarité, mémoire d'un PNJ,
     * perception, réaction d'état) passent par ce collecteur, et **un seul**
     * est servi — le plus prioritaire.
     *
     * Ceux qui ne sont pas servis ne sont PAS marqués comme vus : leur effet
     * de bord n'est appliqué qu'à celui qui s'affiche, sinon on brûlerait
     * silencieusement un texte que le joueur n'a jamais lu.
     */
    const rappels: { prio: number; text: string; commit?: () => void }[] = [];

    // ── LE DÉJÀ-VU (vague 4) ───────────────────────────────────────────────
    // La strate a été calculée plus haut. Si elle ne remplace aucun
    // paragraphe, elle s'ajoute ici — après la narration, avant les gens.
    // Le héros ne se souvient de rien : c'est le monde qui porte la trace
    // (règle d'écriture détaillée sur FAMILIARITE et lib/dejavu.ts).
    if (strate) {
      // Une strate qui REMPLACE un paragraphe ne coûte aucun écran : elle
      // passe hors budget. Celle qui s'AJOUTE entre dans le collecteur.
      if (famIci?.remplace !== undefined && narrationLines[famIci.remplace] !== undefined) {
        persist((r) => {
          r.vus = noter(r.vus, cleFam);
        });
      } else {
        rappels.push({
          prio: 1,
          text: strate,
          commit: () => persist((r) => {
            r.vus = noter(r.vus, cleFam);
          }),
        });
      }
    }
    // Puis la ligne de mémoire du PNJ (2e passage du compte par ce lieu ou
    // plus). Même garde de portée RUN : le Fossoyeur est déclaré sur deux
    // scènes qui partagent son lieu (le Champ et sa variante), il ne doit pas
    // se souvenir deux fois dans la même vie.
    const memPnj = PNJ_MEMOIRE[nextScene.id];
    const clePnj = "pnj|" + (memPnj?.lieu ?? lieuIci);
    if (
      memPnj &&
      ((loadMemory().visitesLieux ?? {})[memPnj.lieu ?? lieuIci] ?? 0) >= 2 &&
      vu(runRef.current?.vus, clePnj) === 0
    ) {
      rappels.push({
        prio: 2,
        text: memPnj.text,
        commit: () => persist((r) => {
          r.vus = noter(r.vus, clePnj);
        }),
      });
    }
    // ── LES ÉTATS (spec 4/08 §2 et §5, contrat de visibilité) ─────────────
    // FIXÉ différé (7/08) : le seuil de Soupçon (4) peut être atteint en
    // pleine lande, mais l'état ne se pose qu'à la première arrivée LÀ OÙ ON
    // TE REGARDE — sa manifestation met des villageois en scène. Posé ici,
    // avant la lecture des faits, pour que sa carte joue sur CET écran.
    if (
      soupAfter >= 4 &&
      dansLeVillage(nextScene.id) &&
      !idsEtats(faitsDe(runRef.current)).includes("fixe")
    )
      poserEtatRun("fixe");
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
    // Les CARTES d'état de cet écran, calculées ICI (une seule source — le
    // bloc bandeau plus bas les réutilise). Plafonnées à 2 (banc v2E, 7/08) :
    // trois cartes empilées mangent 250 px, poussent les choix sous la ligne
    // de flottaison et occupent pile la zone où l'on tape pour continuer.
    // Les états au-delà restent actifs et consultables (volet, Essence).
    const CARTES_MAX = 2;
    const activeEffects = runRef.current?.effects ?? [];
    const tousActifs = [
      ...actifsIci.map((e) => ({ effectId: e.id, label: e.nom, positive: e.groupe === "faveur" })),
      ...activeEffects.map((e) => ({ effectId: e.id, label: e.label, positive: e.delta > 0 })),
    ];
    const dejaAnnonces = runRef.current?.etatsAffiches ?? [];
    /**
     * ⚠️ FIXÉ N'A PLUS DE CARTE (chantier du 11/08, critère E ; arbitrage
     * Patrick : « garder la mécanique, supprimer la carte répétée »).
     *
     * Le test d'acceptation dit que les états ne doivent plus se répéter comme
     * COMPOSANTS D'INTERFACE. FIXÉ n'est pas un état générique — il porte le
     * procès — mais il s'affichait bien comme une carte, écran après écran.
     * Il garde donc tout : sa manifestation (qui repart en narration, puisque
     * la boucle ci-dessous ne la saute que pour les états QUI ont une carte),
     * ses réactions du village, son effet sur les Fixés et sur le procès.
     * Le joueur comprend qu'il est fixé parce qu'on le TRAITE autrement.
     */
    const SANS_CARTE = ["fixe"];
    const bandeau = tousActifs
      .filter((e) => !SANS_CARTE.includes(e.effectId))
      .filter((e) => !dejaAnnonces.includes(e.effectId))
      .slice(0, CARTES_MAX);
    // Manifestation immédiate : posée par `poserEtatRun`, jouée ici — SAUF si
    // l'état reçoit sa carte sur ce même écran : la carte porte déjà la
    // manifestation en description, la re-pousser en narration affichait la
    // même phrase deux fois à 200 px d'écart (banc du 7/08, Boiteux).
    for (const id of manifsEnAttente.current) {
      const e = etat(id);
      if (e && !bandeau.some((b) => b.effectId === id))
        entries.push({ id: nextId(), kind: "narration", text: e.manifestation });
      manifsJouees.current.add(id);
    }
    manifsEnAttente.current = [];
    // Réaction du monde : une seule à la fois, tirée dans le pool de l'état le
    // plus ancien encore actif — deux réactions d'affilée noieraient la scène.
    // GARDÉE PAR LE CONTEXTE (playtest 7/08) : la plupart des réactions
    // mettent des VILLAGEOIS en scène (« le barrage s'écarte », « une femme
    // pose un bol ») — servies en pleine lande ou face à une bête, elles
    // cassaient la scène. Seules celles taguées `reactionsPartout` sortent du
    // village, et aucune ne se joue pendant un combat.
    const anciens = actifsIci.filter((e) => manifsJouees.current.has(e.id));
    if (anciens.length && !nextScene.combat && chance(0.4)) {
      const e = anciens[nextStep % anciens.length];
      // JAMAIS deux fois mot pour mot dans la même vie (rapport IA externe
      // 8/08 : « une odeur de corde mouillée » servie NEUF fois — « j'ai
      // compris que le jeu tirait une ligne d'état »). Même règle que les
      // intruses ; pool épuisé → l'état se tait, il reste lisible au volet.
      const reacVues = runRef.current?.reactionsVues ?? [];
      const eligibles = e.reactions
        .map((text, i) => ({ text, i }))
        .filter(({ i }) => dansLeVillage(nextScene.id) || (e.reactionsPartout ?? []).includes(i))
        .filter(({ text }) => !reacVues.includes(text));
      if (eligibles.length) {
        const servie = eligibles[Math.floor(nextStep / 2) % eligibles.length].text;
        rappels.push({
          prio: 3,
          text: servie,
          commit: () => persist((r) => {
            if (!(r.reactionsVues ?? []).includes(servie))
              r.reactionsVues = [...(r.reactionsVues ?? []), servie];
          }),
        });
      }
    }
    // ⚠️ Phase A : les LIGNES INTRUSES sont parties avec HANTÉ. Une phrase
    // générique injectée au hasard dans une scène qui ne l'a pas écrite était
    // le contraire de la doctrine (« une mécanique ne doit jamais contredire
    // ce que le texte raconte ») — et l'audit d'immersion la signalait
    // régulièrement. Ce que HANTÉ voulait dire se dira par des flags précis,
    // posés par une source nommée et lus par les scènes qui les méritent.
    const intruseServie: string | null = null;

    // LA PERCEPTION (5/08) : ce que ce héros-LÀ remarque, parce qu'il est
    // ainsi fait. Une ligne, jamais deux — et jamais le nom de la stat.
    // Le don « regard » (Œil de lanterne verte) donne accès à ces lignes même
    // quand aucune stat n'atteint le seuil : voir avec les yeux d'un autre.
    // Elle tombe à chaque arrivée, quelle que soit la route : le mode
    // d'arrivée est de la couleur, il ne retient jamais une information.
    const perception = perceptionDe(
      nextScene.id,
      runRef.current?.stats,
      donsPortes(loadMemory()).includes("regard")
    );
    // LE MONDE RECONNAÎT LA MARQUE (14/08). Prioritaire sur tous les autres
    // rappels : c'est la récompense d'une traversée réussie, elle ne doit pas
    // se faire manger par une ligne de perception. Elle PREND la place du
    // rappel de l'arrivée, elle ne s'y ajoute pas — le budget d'un seul bloc
    // par arrivée (12/08) vaut pour elle comme pour les autres.
    const reconnu = reconnaissanceSceau(lieuIci, sceauNiveau);
    if (reconnu) rappels.push({ prio: 0, text: reconnu });
    if (perception) rappels.push({ prio: 4, text: perception });
    if (rappelArrivee) rappels.push({ prio: 5, text: rappelArrivee });
    /**
     * ═══ UN SEUL BLOC OPTIONNEL PAR ARRIVÉE ET PAR CROISÉE ═══════════════
     * (arbitrage du 12/08, scénario S1 + règle de priorité + S3a)
     *
     * Le budget d'un rappel posé le 12/08 ne couvrait que les RAPPELS ; les
     * événements — palier de Soupçon, corbeaux, rumeur, loi, beat de
     * chapitre, Geôlier — gardaient le droit de s'ajouter par-dessus, et
     * c'est leur cumul qui produisait les 2,15 taps d'une arrivée. L'estimateur
     * a chiffré les deux leviers possibles : ramener toute la prose de la zone
     * sous 65 mots vaut −0,05 tap, plafonner les injections en vaut −0,17.
     *
     * ⚠️ RÈGLE ABSOLUE DU CHANTIER : aucun contenu narratif n'est supprimé
     * pour faire tomber un chiffre. Un candidat qui perd n'est pas effacé —
     * il n'est simplement pas marqué comme vu, donc il se représente à la
     * prochaine arrivée où le budget est libre. Sauf le beat de chapitre, qui
     * ne peut PAS attendre (son développement est accroché à un lieu qu'on ne
     * revisite pas) : il passe donc en tête de l'ordre.
     *
     * ⚠️ LE PALIER DE SOUPÇON COMPTE POUR UN SEUL BLOC — la craie que le
     * monde montre ET la ligne où le Geôlier lui donne son sens. Les séparer
     * pour n'en garder qu'un ne vaut que 0,02 tap de plus (mesuré) et
     * supprimerait, au choix, la migration de la marque vers la peau ou la
     * seule voix qui nomme le compte. On paie 0,02 tap pour ne rien perdre.
     *
     * ⚠️ CE QUI RESTE HORS BUDGET, et pourquoi : la carte d'un état qui se
     * pose ou se lève, un objet obtenu, le Registre, la route fermée et les
     * surprises. Ce sont des ÉVÉNEMENTS — quelque chose vient d'arriver, et
     * les taire ferait mentir l'écran. Les surprises sont en outre déjà
     * rationnées à une par vie, le rationnement le plus strict du jeu.
     */
    const rappel = rappels.sort((a, b) => a.prio - b.prio)[0];
    // Les candidats se calculent AVANT d'élire : sans ça le premier site de
    // poussée rencontré prendrait le budget, et l'ordre du fichier ferait
    // office de priorité.
    const rumeurIci = candidatRumeur(runRef.current, nextScene.id, nextStep);
    const corbIci = estHameau(nextScene.id)
      ? corbeauxDuHameau(
          runRef.current?.soupcon ?? 0, nextStep, runRef.current?.vus ?? {})
      : null;
    const loiIci =
      nextScene.liaison && (runRef.current?.loiVues ?? []).length === 0 && chance(0.22)
        ? nextStep % 4
        : null;
    /* ⚠️ AU BORD DU MONDE, PLUS RIEN DU MONDE DERRIÈRE (retour Patrick
       25/08 : « j'ai cru voir passer quelqu'un qui prenait une route pour
       aller au hameau — ça n'a pas de sens alors que je descendais »). À la
       Falaise, le héros est passé le point de non-retour : aucune injection
       ambiante (rappel, rumeur, corbeaux, loi, Geôlier de scène) ni aucune
       surprise contextuelle ne s'y joue. Le seul passant admis est celui que
       la Falaise écrit elle-même — l'Appelé, puis le grimpeur qui remonte. */
    const auBord = /^falaise-cordes/.test(nextScene.id) || Boolean(nextScene.terminal);
    const elu = auBord ? null : elireInjection({
      chapitre: chapterAfter.length > 0,
      geolier: opts?.result === 1 || opts?.result === 20,
      soupcon: Boolean(soupManifest || soupJailer),
      corbeaux: Boolean(corbIci),
      rumeur: Boolean(rumeurIci),
      loi: loiIci !== null,
      rappel: Boolean(rappel),
    });
    // Ce qui a été RÉELLEMENT servi — un texte écarté par le budget ne doit
    // pas être marqué comme vu, sinon on le brûle sans que le joueur l'ait lu.
    const arriveeServie =
      elu === "rappel" && rappel?.text === rappelArrivee ? rappelArrivee : null;
    if (rappel && elu === "rappel") {
      entries.push({ id: nextId(), kind: "narration", text: rappel.text });
      rappel.commit?.();
    }
    // LES CORBEAUX SUR LES TOITS (refonte du lore 6/08, §5) : le seul signal
    // permanent du Soupçon. Le joueur comprend qu'on le compte bien avant de
    // comprendre pourquoi — et ce n'est jamais un chiffre, c'est un nombre
    // d'oiseaux. Uniquement dans le village : ailleurs, les corbeaux de la
    // Colline comptent ses morts, et mélanger les deux lectures les détruit.
    if (estHameau(nextScene.id)) {
      // LA RUMEUR (partie de découverte 8/08 : « le hameau compte mes actes
      // mais ne les CITE jamais avant le procès »). Un témoin déjà inscrit
      // parle en pleine rue — jamais deux fois le même, jamais plus d'un par
      // écran, et seulement quand le village a de quoi dire (soupçon ≥ 2).
      // C'est le procès qui commence, longtemps avant la salle.
      // ⚠️ On déduplique par PERSONNE, pas par déposition. Cinq dépositions
      // différentes portent « La Femme au Seuil » : filtrer sur l'id laissait
      // ses jumelles passer, et la rumeur sortait DEUX FOIS mot pour mot (vue
      // dans un transcript du 11/08 — la phrase ne cite que le nom et le
      // lieu, donc deux dépositions d'une même personne sont indistinguables
      // à l'écran). Le procès, lui, dédupliquait déjà par personne.
      const temoinsRun = runRef.current?.temoins ?? [];
      if (rumeurIci && elu === "rumeur") {
        const t = rumeurIci;
        entries.push({
          id: nextId(),
          kind: "narration",
          text:
            `Deux femmes s'arrêtent de parler quand tu passes — mais tu as ` +
            `saisi la fin : « … ${t.lieu}. C'est ${t.nom} qui l'a dit. » ` +
            `Elles reprennent leur chemin, plus vite que nécessaire.`,
        });
        // On marque TOUTES les dépositions de cette personne : elle a parlé,
        // elle ne reparlera pas sous un autre grief.
        const sesIds = temoinsRun.filter((x) => x.nom === t.nom).map((x) => x.id);
        persist((r) => {
          r.temoinsCites = [...new Set([...(r.temoinsCites ?? []), ...sesIds])];
        });
      }
      // Registre DÉDIÉ (panel 10/08) : les corbeaux comptaient leurs passages
      // dans `reactionsVues`, partagé avec les réactions d'états — le vivier
      // paraissait épuisé bien avant de l'être. Ils ont maintenant leurs
      // propres compteurs (lib/dejavu, portée run).
      const corb = corbIci;
      if (corb && elu === "corbeaux") {
        entries.push({ id: nextId(), kind: "narration", text: corb });
        persist((r) => {
          r.vus = noter(r.vus, "corb|" + corb);
        });
      }
    }
    // ═══ LES SURPRISES CONTEXTUELLES (6/08) — la surprise ARMÉE attend son
    // contexte ; s'il n'arrive jamais, elle est perdue, on n'insiste pas.
    // Jamais à la Falaise (voir `auBord`) : un inconnu qui te croise n'a plus
    // de route à prendre quand le sol s'arrête.
    if (!auBord) {
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
    if (elu === "chapitre") {
      entries.push(...chapterAfter.map((text): FeedEntry => ({ id: nextId(), kind: "narration", text })));
    }
    // Manifestation du Soupçon : le monde se ferme, palier par palier. La
    // craie MONTRE, le Geôlier INTERPRÈTE — c'est un seul événement raconté à
    // deux voix, donc un seul bloc au budget (arbitrage du 12/08). Les
    // séparer pour n'en garder qu'un valait 0,02 tap et coûtait, au choix, la
    // migration de la marque ou la seule voix qui nomme le compte.
    if (elu === "soupcon") {
      if (soupManifest) entries.push({ id: nextId(), kind: "narration", text: soupManifest });
      if (soupJailer) entries.push({ id: nextId(), kind: "jailer", text: soupJailer });
    }
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
        entries.push(entreeObtenu(nextId(), item));
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
      const dejaServis = [
        ...besace.map((b) => b.name),
        ...(runRef.current?.dropsServis ?? []),
      ];
      const found = randomSoinMineur(dejaServis);
      if (found) {
        obtainedItem = found;
        persist((run) => {
          run.besace = [...run.besace, found];
          run.dropsServis = [...(run.dropsServis ?? []), found.name];
        });
        entries.push(entreeObtenu(nextId(), found));
      }
    }
    // LA SORTIE DE ZONE SE SOUVIENT (panel 10/08 : « deux traversées
    // réussies, fin identique au mot près, aucune trace »). Deux lignes
    // tirées de cette vie-ci, puis le Registre où la ligne du héros s'inscrit
    // SOUS SES YEUX. `recordTraversee` ne tombe qu'au dernier tap, donc le
    // joueur ne voyait jamais son nom entrer dans le livre : c'est le défaut
    // de LIVRAISON que le panel décrit, pas un défaut de mémoire.
    if (nextScene.terminal && !nextScene.renoncement) {
      const r = runRef.current ?? loadRun();
      const m = loadMemory();
      for (const t of traceDeSortie({
        serment: r.hameau?.serment ?? null,
        soupcon: r.soupcon ?? 0,
        hameauHalte: Boolean(r.hameau?.halte),
        zonesCleared: m.zonesCleared ?? 0,
        besace: (r.besace ?? []).length,
      })) {
        entries.push({ id: nextId(), kind: "narration", text: t });
      }
      // LE SCEAU SE PREND ICI (arbitrage 10/08). Il n'est POSÉ qu'au dernier
      // tap, par `recordTraversee` — donc on annonce le passage qui vient
      // d'être gagné, celui-ci compris : `niveau + 1`. Placé après la trace
      // de sortie et avant le Registre : d'abord ce que cette vie a été,
      // puis ce qu'elle rapporte, puis le livre.
      entries.push({
        id: nextId(),
        kind: "narration",
        text: ligneSceauSortie(niveauSceau({ run: {}, perm: m.faits ?? {} }) + 1),
      });
      entries.push({
        id: nextId(),
        kind: "registre",
        rows: buildRegistre(m, r.heroName, r.day),
      });
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
    let loiIndex: number | null = null;
    if (loiIci !== null && elu === "loi") {
      const i = loiIci;
      const manif = manifestationLoi("landes", i);
      if (manif) {
        loiIndex = i;
        entries.push({ id: nextId(), kind: "narration", text: manif.texte });
      }
    }
    // LE GEÔLIER (retour Patrick 8/08 : « il répète souvent les mêmes phrases
    // dans une même run »). Deux sources, une seule mémoire : `run.jailerVues`
    // retient les GABARITS servis cette vie.
    //  • critiques → tirage dans le pool de la posture, filtré sur les vues ;
    //  • 12 % → la ligne propre à la scène. Elle est unique par lieu, mais les
    //    LIAISONS partagent un pool : si la ligne est déjà tombée, on se tait
    //    plutôt que de la répéter mot pour mot (le Geôlier est rare par nature).
    const result = opts?.result;
    const jailerVues = runRef.current?.jailerVues ?? [];
    let jailerServi: string | null = null;
    // ⚠️ LE COMMENTAIRE AMBIANT DE SCÈNE EST RETIRÉ (arbitrage du 12/08).
    // Vérifié avant de trancher : sur les 24 prises de parole des quatre vies
    // enregistrées, 15 commentent un palier de Soupçon, 4 constatent une
    // traversée sans risque, 2 raillent un jet critique — et 3 seulement
    // étaient ce tirage à 12 % sur une arrivée ordinaire. Le Geôlier n'était
    // donc pas bavard : il était déjà événementiel à 21 sur 24. On ne coupe
    // que ces trois-là, les seules qui ne répondaient à rien.
    if (result === 1 || result === 20) {
      if (elu === "geolier") {
        const posture = jailerPosture(loadMemory());
        const { text, gabarit } = jailerTaunt(result, posture, jailerVues);
        jailerServi = gabarit;
        entries.push({ id: nextId(), kind: "jailer", text });
      }
    }

    // Image du nouvel écran (demande Patrick 19/07) :
    //  • contexte changé → illustration de la nouvelle scène (repos de l'image) ;
    //  • sinon objet obtenu → image de l'objet (remplacement momentané) ;
    //  • sinon → on revient/reste sur l'illustration de scène (l'image ne bouge pas).
    let img: { src: string; kind: ImageKind };
    let differeVueDeMarche: string | null = null;
    if (contextChanged) {
      const ancienne = lastSceneIlloRef.current;
      lastSceneIlloRef.current = nextIllustration;
      img = { src: nextIllustration, kind: "scene" };
      // LA CONSÉQUENCE SE LIT SUR SON IMAGE (playtest 7/08) : l'issue d'un jet
      // s'affiche sur l'écran suivant (option A du 19/07) — quand ce suivant
      // est une LIAISON, on lisait « ta lame répond… » par-dessus la vue de
      // marche. L'image du lieu quitté TIENT le temps du 1er écran de la
      // séquence ; la vue de marche prend le relais au tap suivant.
      if (opts?.consequence && nextScene.liaison) {
        img = { src: ancienne, kind: "scene" };
        // ⚠️ posée APRÈS showScreen (qui purge les bascules différées d'un
        // écran précédent) — voir la fin d'advance().
        differeVueDeMarche = nextIllustration;
      } else if (
        nextScene.illustrationArrivee &&
        nextScene.illustrationArrivee !== nextIllustration
      ) {
        /* LE LIEU AVANT LA RENCONTRE (retour Patrick 25/08). Les rencontres
           qui n'ont pas d'écran-2 pour porter leur décor arrivaient DIRECTEMENT
           sur la créature : on se retrouvait devant une gueule sans avoir vu
           où l'on était. Le premier écran montre le LIEU pendant qu'on lit
           l'approche ; la créature prend le relais au tap suivant, par la même
           bascule différée que la vue de marche. Aucun écran, aucun tap de
           plus — la même arrivée, dans l'ordre où on la vit. */
        img = { src: nextScene.illustrationArrivee, kind: "scene" };
        differeVueDeMarche = nextIllustration;
      }
    } else {
      /* ⚠️ L'OBJET NE PREND PLUS LE CADRE (maquette 2531:825, 25/08). Avant,
         un objet obtenu remplaçait l'illustration de la scène par son icône
         en grand : on perdait le décor au moment même où on le lisait. La
         carte porte désormais sa propre vignette 92×92, et l'image du lieu
         ne bouge pas. `ImageKind: "object"` reste dans le type pour les
         sauvegardes en cours ; plus rien ne le pose. */
      img = { src: lastSceneIlloRef.current, kind: "scene" };
    }
    // L'ÉLÉMENT OBSERVÉ passe devant tout le reste (conversion des points
    // d'intérêt, 13/08) : on vient de s'approcher de quelque chose, c'est ÇA
    // qu'on regarde pendant qu'on lit ce qu'on y trouve. L'image du lieu (ou
    // du lieu suivant) reprend au tap d'après — jamais un plan rapproché qui
    // s'installe.
    if (opts?.imageElement) {
      const reprise = img.src;
      img = { src: opts.imageElement, kind: "scene" };
      if (reprise !== opts.imageElement) differeVueDeMarche = reprise;
    }

    setStep(nextStep);
    // (le persist qui incrémente run.day arrive juste après — on affiche la
    // même valeur qu'il écrira)
    if (jourDeMarche || nuitPassee) setDay((runRef.current?.day ?? day) + 1);
    // ═══ LE CODEX (Phase E, 20/08) : l'écran qu'on atteint débloque son
    // entrée — le LIEU par son nom, la RENCONTRE par son radical de scène.
    // Point unique : toutes les branches d'advance() passent par ici, la
    // REPRISE non (elle rebâtit un écran déjà vécu, rien de neuf à noter).
    {
      const par = runRef.current?.heroName ?? "";
      const jour = runRef.current?.day ?? 1;
      const eLieu = CODEX_PAR_LIEU[lieuNom(nextScene.id)];
      if (eLieu) debloquerCodex(eLieu, par, jour);
      const eScene = CODEX_PAR_SCENE[nextScene.id] ?? CODEX_PAR_SCENE[radical(nextScene.id)];
      if (eScene) debloquerCodex(eScene, par, jour);
    }
    setScene(nextScene);
    setVisitedMirror(trav.visited);
    // On quitte l'écran : les points d'intérêt du lieu précédent sont oubliés
    // et l'image repasse en plan large (spec 24/07 suite §1).
    setPoiSeen([]);
    setChoixFaits([]);
    persist((run) => {
      run.step = nextStep;
      run.lastChoiceId = null;
      run.poiSeen = [];
      // Un lieu qu'on quitte oublie ce qu'on y a décidé — comme ses points
      // d'intérêt. Sans ça, revenir au même id (variante, rencontre chaînée)
      // arriverait avec des choix déjà grisés sans raison lisible.
      run.choixFaits = [];
      run.trav = trav;
      // Le Jour de marche : tous les trois lieux OÙ L'ON A TENTÉ quelque
      // chose (7/08, recentré sur l'engagement le 10/08).
      // La nuit : l'aube vient qu'on ait dormi ou veillé.
      // ⚠️ Le « Jour de refus » qui figurait ici est ABROGÉ (le Jour est le
      // score du Registre : le facturer récompensait le joueur passif). Ne
      // pas le réintroduire — c'est la deuxième fois que ce commentaire
      // décrit une règle morte.
      // ⚠️ AU PLUS UN jour par arrivée, même si les deux tombent ensemble —
      // deux puces JOUR sur le même écran seraient illisibles, et « la lumière
      // a tourné » ne se dit pas deux fois. Le petit rabais est assumé.
      if (jourDeMarche || nuitPassee) run.day += 1;
      if (lieuxEngagesApres !== null) run.lieuxEngages = lieuxEngagesApres;
      // ⚠️ L'HORLOGE DU CORPS EST ADDITIVE, ET LA MARCHE PASSE AVANT LA NUIT
      // (relecture par agents, 10/08) : `horlogeApres` est calculé tout en
      // haut d'`advance()`, donc à partir d'une horloge d'AVANT la nuit. Posé
      // après le bloc `nuitPassee`, il écrasait purement et simplement l'heure
      // que la nuit venait d'ajouter. Inatteignable aujourd'hui (les quatre
      // scènes de nuit sont chaînées ou en séjour), mais le piège attendait la
      // première scène de nuit tirable.
      if (horlogeApres !== null) run.horloge = horlogeApres;
      if (nuitPassee) {
        run.horloge = (run.horloge ?? run.day) + 1;
        run.vus = noter(run.vus, nuitPassee);
      }
      // On entre dans un lieu neuf : ce qu'on y regardera et ce qu'on y
      // tentera se comptent à partir de zéro.
      // ⚠️ PAS SEULEMENT sur `toDest` (relecture par agents, 10/08) : la
      // Palissade, la séquence de Halte, le procès du Soupçon et les
      // rencontres ouvertes par un point d'intérêt arrivent par d'autres
      // branches. Deux points examinés au lieu précédent offraient donc
      // encore +2 sur le jet du procès — seuil 13, mortel — avec le hint
      // « TU AS REGARDÉ — FAVORABLE » qui l'affirmait. La préparation ne
      // franchit aucune porte : on repart de zéro dès que le LIEU change.
      if (radical(nextScene.id) !== radical(scene.id)) {
        run.poiIci = 0;
        run.engageIci = false;
      }
      // Une intruse servie ne se redira jamais dans cette vie.
      if (intruseServie) run.intrusesVues = [...(run.intrusesVues ?? []), intruseServie];
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
      // ⚠️ SEULEMENT s'il a été JOUÉ. Le budget d'injection peut l'écarter ;
      // avancer le stade quand même perdrait le beat pour toujours — et son
      // développement est accroché à un lieu qu'on ne revisite pas. La
      // résolution (`chapterBefore`) est servie hors budget, donc toujours.
      const chapitreJoue = chapterBefore.length > 0 || elu === "chapitre";
      if (newChapterStage && run.chapter && chapitreJoue)
        run.chapter = { ...run.chapter, stage: newChapterStage };
      // Soupçon : montée d'arrivée + palier manifesté mémorisé.
      run.soupcon = soupAfter;
      // Un cran servi = un cran vu — jamais un saut (voir palierAServir).
      // ⚠️ Même règle : un palier écarté par le budget n'est PAS vu, donc il
      // se représente à la prochaine arrivée. Le compter ici le brûlerait en
      // silence, et le joueur passerait du muret à la peau sans rien lire.
      if (soupManifest && elu === "soupcon") run.soupconSeen = (run.soupconSeen ?? 0) + 1;
      // Le drapeau d'échec dur est CONSOMMÉ par la Croisée qu'il vient de
      // resserrer : une seule route perdue par échec, jamais une traînée.
      // ⚠️ Consommé AUSSI quand le guide l'absorbe (relecture par agents,
      // 10/08) : sans ça le drapeau restait armé et la route se refermait
      // deux Croisées plus tard, une fois l'enfant reparti, pour un échec que
      // le joueur ne reliait plus à rien. Un bénéfice qui n'est qu'un report
      // n'est pas un bénéfice.
      if (routeFermeeIci || guideAbsorbe) run.routeFermeeEnAttente = false;
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
      // Le Geôlier : gabarit servi, retenu pour ne pas retomber dessus.
      if (jailerServi) run.jailerVues = [...(run.jailerVues ?? []), jailerServi];
      // Le témoin bâillonné l'est DÉFINITIVEMENT (il ne réapparaîtra pas si le
      // Soupçon remonte après une relaxe), et la relique est dépensée.
      if (bailloner && porteuseSilence) {
        run.temoins = temoinsAuProces;
        run.reliquesUsees = [...(run.reliquesUsees ?? []), porteuseSilence.idx];
      }
      run.croiseesDepuisRoute = (run.croiseesDepuisRoute ?? 0) + (nextScene.liaison ? 1 : 0);
      // COMPTEUR DE VISITES (spec §1, scope zone_permanent) : combien de fois
      // ce lieu a été vu, TOUTES vies confondues. Ne se remet jamais à zéro —
      // c'est lui qui portera les « strates de visite » (2ᵉ, 3ᵉ passage).
      run.faits = faitsAv.run;
      // Anti-répétition des phrases d'arrivée (retour 5/08 : « Tu es venu par
      // le flanc… » revenait plusieurs fois dans une même vie).
      if (arriveeServie && !(run.arriveeVues ?? []).includes(arriveeServie))
        run.arriveeVues = [...(run.arriveeVues ?? []), arriveeServie];
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
    if (bailloner) setPasseDispoMirror(Boolean(porteuseDisponible("passe", runRef.current)));
    // Résolution jouée → le chapitre entre dans la rotation du compte (le
    // prochain tirage évitera ceux déjà vécus tant qu'il en reste des neufs).
    if (newChapterStage === 3 && chapSt) {
      // Codex : un chapitre du Bailli mené à sa résolution débloque l'arc
      // des trois cents noms.
      debloquerCodex("arc:bailli", runRef.current?.heroName ?? "", runRef.current?.day ?? 1);
      mutateMemory((m) => {
        if (!m.chaptersSeen.includes(chapSt.id)) m.chaptersSeen = [...m.chaptersSeen, chapSt.id];
      });
    }
    // Rappel des états temporaires (retour Patrick 19/07) : après un jet de
    // dé, l'écran suivant s'ouvre sur les états encore actifs — un petit
    // libellé « état temporaire », le nom, jamais un chiffre.
    // Le bandeau d'états : les NOUVEAUX états d'abord (spec 4/08), puis les
    // anciens effets narratifs le temps de la transition du combat.
    // ⚠️ PLAFOND D'AFFICHAGE de trois (spec §2) — ce n'est pas une limite du
    // système : les autres restent actifs et consultables dans Essence. On
    // garde les plus RÉCENTS : ce qui vient d'arriver au héros se lit d'abord.
    // ⚠️ Retour playtest 6/08 soir (« toujours apparent, casse l'interface ») :
    // le bandeau n'annonce plus les états ACTIFS à chaque écran — seulement
    // ceux qu'on VIENT d'attraper. Le détail vit dans le volet (tap sur la
    // puce) et dans Essence ; l'érosion de l'UI porte déjà l'état du corps.
    // `bandeau` / `tousActifs` / `CARTES_MAX` : calculés plus haut, AVANT la
    // boucle des manifestations (une seule source — la carte remplace la
    // manifestation en narration quand les deux tomberaient sur cet écran).
    // Maquette 2440:13429 (7/08) : la carte d'état RESTE le temps de la scène
    // où l'état a été attrapé (tous ses beats), puis QUITTE l'interface — et
    // là seulement, le popup « ton état est rangé dans le menu » peut se dire.
    const lieuCourant = radical(nextScene.id);
    const banniereAv = runRef.current?.etatBanniere;
    if (bandeau.length > 0) {
      const memesLieu = banniereAv && banniereAv.lieu === lieuCourant ? banniereAv.effects : [];
      const effects = [
        ...bandeau,
        ...memesLieu.filter((e) => !bandeau.some((n) => n.effectId === e.effectId)),
      ].slice(0, CARTES_MAX);
      entries.unshift({ id: nextId(), kind: "etat", effects });
      persist((run) => { run.etatBanniere = { effects, lieu: lieuCourant }; });
    } else if (banniereAv) {
      // Même règle : on ne RÉAFFICHE plus la carte aux écrans suivants du
      // lieu. Le drapeau ne sert plus qu'à savoir quand l'état a quitté
      // l'interface, pour dire une fois « il est rangé dans le menu ».
      persist((run) => { run.etatBanniere = undefined; });
      maybeAideMenu("etat");
    }
    // La liste mémorisée reflète TOUS les actifs : un état levé puis repris
    // sera ré-annoncé (c'est une nouvelle prise), un état continu ne l'est plus.
    persist((run) => { run.etatsAffiches = tousActifs.map((e) => e.effectId); });
    setSelectedId(null);
    setRoll(null);
    setTimedExpired(false);
    showScreen(entries, img);
    // La bascule différée survit à showScreen (qui purge celles d'avant).
    if (differeVueDeMarche) imageApresConsequence.current = differeVueDeMarche;
  }

  /**
   * SÉJOUR — résoudre un choix SANS quitter le lieu (panel 9/08, chantier n°2).
   *
   * C'est le pendant, côté choix, de ce que l'examen d'un point d'intérêt fait
   * déjà : la conséquence s'affiche, l'écran redonne la main, et l'option
   * consommée disparaît. On ne repasse volontairement PAS par `advance()` —
   * on ne rejoue ni l'arrivée, ni l'approche, ni la couture du village, ni la
   * montée du pas : rien de tout ça n'a de sens quand on n'a pas bougé.
   *
   * Les coûts (santé, Soupçon, états, objets) sont déjà appliqués par
   * l'appelant, exactement comme avant — ici on ne fait que du RÉCIT.
   */
  function resterSurPlace(
    choiceId: string,
    opts: {
      consequence?: string;
      prepend?: FeedEntry[];
      result?: number;
      grantedItem?: BesaceItem | null;
      /** Le jet a été DUR (critique / malédiction) : le monde se referme d'un
          cran — une possibilité de plus est consommée ici. */
      dur?: boolean;
      /** Image de l'élément touché (voir `advance`) : elle tient cet écran. */
      imageElement?: string;
      /** Lignes calculées, servies APRÈS la conséquence (voir `advance`). */
      append?: FeedEntry[];
    } = {}
  ) {
    const entries: FeedEntry[] = [];
    if (opts.prepend) entries.push(...opts.prepend);
    if (opts.consequence)
      entries.push({ id: nextId(), kind: "narration", text: opts.consequence });
    if (opts.append) entries.push(...opts.append);
    if (opts.grantedItem) {
      const it = opts.grantedItem;
      entries.push(entreeObtenu(nextId(), it));
    }
    // Un critique reste un critique : le Geôlier commente même quand on n'a
    // pas changé d'endroit. Même mémoire de gabarits qu'ailleurs.
    let jailerServi: string | null = null;
    if (opts.result === 1 || opts.result === 20) {
      const vues = runRef.current?.jailerVues ?? [];
      const { text, gabarit } = jailerTaunt(opts.result, jailerPosture(loadMemory()), vues);
      jailerServi = gabarit;
      entries.push({ id: nextId(), kind: "jailer", text });
    }
    const faits = [...choixFaits, choiceId];
    // L'ÉCHEC DÉPENSE QUELQUE CHOSE DU MONDE (panel 9/08, la mécanique la plus
    // adoptée — 7 voix). Sans elle, ouvrir les lieux ne ferait qu'offrir des
    // écrans gratuits à qui ne lance jamais le dé : c'est la condition que le
    // systémiste posait pour retirer son objection au chantier.
    // On ne ferme QUE ce que le joueur pouvait réellement voir : un choix
    // conditionnel qu'il n'a pas ouvert disparaîtrait sans qu'il le sache, et
    // la ligne mentirait. Si rien n'est fermable, on ne dit rien.
    if (opts.dur) {
      const fermable = scene.choices.find(
        (c) =>
          !faits.includes(c.id) &&
          !c.sortie &&
          !c.locked &&
          !c.requiresSavoir &&
          !c.requiresDecouverte &&
          !c.requiresEtat &&
          !c.requiresContradiction
      );
      if (fermable) {
        faits.push(fermable.id);
        entries.push({
          id: nextId(),
          kind: "narration",
          text: PORTE_QUI_SE_FERME[Math.abs(step * 7 + faits.length) % PORTE_QUI_SE_FERME.length],
        });
      }
    }
    setChoixFaits(faits);
    persist((run) => {
      run.choixFaits = faits;
      run.lastChoiceId = null;
      if (jailerServi) run.jailerVues = [...(run.jailerVues ?? []), jailerServi];
    });
    setSelectedId(null);
    setRoll(null);
    setChoicesHidden(true);
    // L'image ne bouge pas : on est toujours au même endroit — sauf si on
    // vient de s'approcher d'un élément, qui tient alors cet écran-là.
    showScreen(entries, {
      src: opts.imageElement ?? lastSceneIlloRef.current,
      kind: "scene",
    });
    if (opts.imageElement && opts.imageElement !== lastSceneIlloRef.current)
      imageApresConsequence.current = lastSceneIlloRef.current;
  }

  /**
   * MODE DÉMO — résultat du mini-jeu (script 24/08, doctrine « l'échec est un
   * prix, jamais un mur »). Réussite : le choix se résout par sa voie écrite
   * normale (loot, borneSud, laisseMenace — rien à dupliquer, on ré-entre
   * dans `onSelect` avec le geste marqué joué). Échec : la conséquence
   * d'échec remplace la réussite, le corps paie si le choix le déclare
   * (ENTAILLÉ + santé — jamais la mort sèche sur un geste d'adresse), et le
   * gain éventuel du choix ne se donne pas (on ne récompense pas un raté).
   */
  function finirMinigame(ok: boolean) {
    const c = minigameChoice;
    if (!c || !c.minigame) return;
    // LA CÉRÉMONIE (swipe) : l'échec n'existe pas — trop vite, la corde ne
    // file pas, tout s'attend, et le geste se représente. Jamais un test
    // d'adresse devant la Descente (doctrine du script, verrouillée).
    if (c.minigame.engine === "swipe" && !ok) {
      setMinigameRetry((n) => n + 1);
      return;
    }
    setMinigameChoice(null);
    minigamesJoues.current = [...minigamesJoues.current, c.id];
    // Un geste par SITUATION et par vie (le beat garanti de la Borne lit ce
    // marqueur) — persisté, donc fidèle à la reprise.
    persist((r) => {
      r.vus = noter(r.vus, "demo|geste|" + radical(scene.id));
    });
    // Un geste de DÉCOUVERTE (`rejouable: false`) ne se rejoue pas d'une vie
    // à l'autre : effacer la mousse de la borne est bon UNE fois, ensuite le
    // héros sait déjà ce qu'il y a dessous. Marqueur de COMPTE, lu par
    // `gesteDejaVecu` à l'armement du geste.
    if (c.minigame.rejouable === false) {
      mutateMemory((mem) => {
        mem.vus = noter(mem.vus, "geste|" + c.id);
      });
    }
    if (ok) {
      // Un choix RISQUÉ porteur d'un geste (le Tracé de la Chapelle) : en
      // démo le geste DÉCIDE — pas de dé derrière. La réussite sert l'issue
      // écrite de réussite ; le loot passe par la voie passive normale.
      if (c.risky) {
        onSelect({
          ...c,
          risky: undefined,
          minigame: undefined,
          passive: { consequence: c.risky.outcomes.success.text },
        });
        return;
      }
      onSelect(c);
      return;
    }
    if (!c.minigame.echec) {
      onSelect(c);
      return;
    }
    if (c.minigame.echecBlesse) {
      persist((run) => {
        run.health = Math.max(0.08, run.health - 0.12);
        run.effects = [
          { id: "entaille", label: "ENTAILLÉ", delta: -2, scenesLeft: 999 },
          ...run.effects.filter((e) => e.id !== "entaille"),
        ];
      });
      setHealth(runRef.current?.health ?? health);
    }
    // Le bruit se paie en Soupçon (le volet qui s'entrouvre, la Veuve qui
    // te voit) — jamais en mur : la doctrine « l'échec est un prix ».
    const soup = c.minigame.echecSoupcon ?? 0;
    if (soup > 0) {
      persist((run) => {
        run.soupcon = Math.min(6, (run.soupcon ?? 0) + soup);
      });
    }
    onSelect({
      ...c,
      risky: undefined,
      minigame: undefined,
      // L'échec ne donne pas la récompense… sauf si le script dit le
      // contraire (la Corde coupée : « tu l'as quand même »).
      grantsLoot: c.minigame.echecGardeLoot ? c.grantsLoot : undefined,
      // Et il ne FRANCHIT pas la porte (le Crochetage raté n'ouvre rien).
      sortie: undefined,
      passive: { consequence: c.minigame.echec },
    });
  }

  function onSelect(choice: Choice) {
    if (rolling || selectedId) return;
    // MODE DÉMO : un choix qui porte un mini-jeu l'ouvre AVANT de se résoudre
    // — le geste décide, puis la résolution normale reprend (finirMinigame).
    // La config se calcule ICI (lecture de runRef interdite au rendu) : la
    // stat module la difficulté du geste, comme dans la galerie — l'Instinct
    // du héros raccourcit l'appui à tenir et rend les alertes lisibles.
    /* ⚠️ UN GESTE NE SE REJOUE PAS D'UNE VIE À L'AUTRE (retour Patrick 25/08 :
       « effacer la mousse de la borne est marrant la première fois mais
       ensuite c'est juste redondant »). Un geste tactile est une DÉCOUVERTE :
       la première fois on apprend ce qu'il y a dessous, les fois suivantes on
       le sait déjà — le refaire est une corvée. `gesteDejaVecu` lit la
       mémoire du COMPTE : passé la première fois, le choix se résout par sa
       voie écrite (le jeu répond, il ne fait pas répéter). */
    if (
      choice.minigame &&
      demoActive() &&
      !minigamesJoues.current.includes(choice.id) &&
      !gesteDejaVecu(choice.minigame.rejouable === false ? choice.id : null)
    ) {
      const eng = choice.minigame.engine;
      if (eng === "hold") {
        const inst = statDe(runRef.current?.stats, "INSTINCT");
        setMinigameConfig(
          inst >= 4
            ? { durationMs: 2200, clearCue: true, grazeCount: 3 }
            : inst >= 3
              ? { durationMs: 3000, clearCue: true, grazeCount: 3 }
              : { durationMs: 3800, clearCue: false, grazeCount: 6 }
        );
      } else if (eng === "trace") {
        // Le Tracé (la Chapelle) : la Ruse simplifie le nœud à suivre.
        const ruse = statDe(runRef.current?.stats, "RUSE");
        setMinigameConfig(
          ruse >= 4
            ? { points: 5, tolerance: 26 }
            : ruse >= 3
              ? { points: 6, tolerance: 22 }
              : { points: 7, tolerance: 19 }
        );
      } else if (eng === "pick") {
        /* Le Crochetage (la nuit) : la Ruse élargit la gorge. TROIS goupilles
           à faire tomber (29/08) — une serrure ne cède pas sur un seul geste,
           et le nombre restant se VOIT sur la piste. Les trois ratés se
           comptent sur l'ensemble : on peut manquer et rattraper. La gorge est
           élargie par rapport au tap unique, sinon trois taps d'affilée
           feraient de ce geste le plus dur de la démo. */
        const ruse = statDe(runRef.current?.stats, "RUSE");
        setMinigameConfig({
          mode: "track",
          windowWidth: ruse >= 4 ? 0.26 : ruse >= 3 ? 0.21 : 0.17,
          maxAttempts: 3,
          goupilles: 3,
        });
      } else if (eng === "swipe") {
        // La cérémonie : cinq paliers, vers le BAS, lentement. Trop vite ne
        // rate rien — la corde ne file pas (`forgiving`), et ça se voit.
        // ⚠️ `axis`/`skin` sont obligatoires ici : sans eux le moteur sert son
        // décor d'origine (les pages du grimoire) et attend un geste LATÉRAL
        // pour une descente en rappel — l'écran que Patrick n'a pas pu
        // comprendre au playtest du 25/08.
        setMinigameConfig({
          pagesNeeded: 5, maxSpeed: 9, label: "paliers",
          axis: "y", skin: "corde", step: 30, forgiving: true,
        });
      } else {
        /* rub — SKIN IMAGE (maquettes Figma 2544:10906 / 2558:23211, 25/08) :
           la mousse de Patrick par-dessus sa pierre aux marques. Le mot dessiné
           au canvas disparaît pour ce geste — l'image PORTE les marques (la
           voie (a) de la question du 25/08, tranchée par la maquette même).
           Le seuil descend à 0.45 : on gratte une bonne partie, et TOUTE la
           mousse s'envole (le cycle voulu : gratter → envol → lire → tap). */
        setMinigameConfig({
          label: choice.minigame.label ?? "CÔTÉ SUD",
          threshold: 0.45,
          preEclaircie: 0.12,
          imageFond: assetUrl("assets/minijeu_borne_pierre.png"),
          imageMousse: assetUrl("assets/minijeu_borne_mousse.png"),
        });
      }
      testeurTaps.current = 0;
      setMinigameRetry(0);
      setMinigamePhase("gratte");
      setMinigameChoice(choice);
      return;
    }
    sansNuitRef.current = Boolean(choice.sansNuit);
    /* LE REPOS DE LA NUIT DÉMO (segment 7) : la qualité de la porte trouvée
       se paie ou se gagne EN CORPS — la maison crochetée referme tout (le
       seul soin complet de la démo), la grange soigne à moitié, le muret
       presque rien. Jamais un chiffre à l'écran : l'érosion du cadre dit le
       reste. */
    if (choice.repos && demoActive()) {
      persist((run) => {
        if (choice.repos === "complet") {
          run.health = 1;
          run.effects = run.effects.filter((e) => e.delta >= 0);
        } else if (choice.repos === "partiel") {
          run.health = Math.min(1, run.health + 0.35);
        } else {
          run.health = Math.min(1, run.health + 0.15);
        }
      });
      setHealth(runRef.current?.health ?? health);
    }
    if (choice.locked) {
      const run = runRef.current;
      const ouvert = verrouOuvert(choice, run?.stats);
      // Passe-verrou de la relique portée (effet « passe ») : UNE fois par
      // run, un verrou à seuil s'ouvre malgré la nature du héros — mais le
      // Hameau s'en souvient (+1 Soupçon). Jamais sur un verrou DUR.
      const porteusePasse =
        !ouvert && choice.locked.min != null ? porteuseDisponible("passe", run) : null;
      const passe = Boolean(porteusePasse);
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
      if (!ouvert && porteusePasse) {
        // La dette « brisure » est celle de LA relique qui vient de servir —
        // pas d'une autre portée (spec 20/08 : un geste par relique).
        const brise = relicDette(porteusePasse.relic) === "brisure";
        const idx = porteusePasse.idx;
        persist((r) => {
          r.reliquesUsees = [...(r.reliquesUsees ?? []), idx];
          r.soupcon = Math.max(0, Math.min(6, (r.soupcon ?? 0) + 1));
          if (brise)
            r.effects = [
              { id: "ebranle", label: "ÉBRANLÉ", delta: -1, scenesLeft: 2 },
              ...r.effects.filter((e) => e.id !== "ebranle"),
            ];
        });
        setPasseDispoMirror(Boolean(porteuseDisponible("passe", runRef.current)));
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
      } else {
        // LA TRACE DU SURVIVANT (arbitrage Patrick 7/08) : franchir la
        // Descente vivant n'est plus un reset sec — le nom entre au Registre
        // (« a franchi la Descente »), le compte s'en souvient, et le Geôlier
        // accueille la run suivante en conséquence. Aucune relique.
        const run = runRef.current ?? loadRun();
        recordTraversee({ heroName: run.heroName, days: run.day });
        // Codex : la première traversée révèle l'arc du Sceau — la marque
        // vient d'apparaître dans la paume.
        debloquerCodex("arc:sceau", run.heroName, run.day);
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

    // SÉJOUR : sur un lieu qui retient, une résolution ne fait pas sortir —
    // sauf si le choix DIT qu'on part. Calculé une fois ici et lu par les
    // quatre voies de résolution (jet, repos, objet, passif/neutre).
    const reste = Boolean(scene.sejour && !choice.sortie);
    const sortieVers = choice.sortie?.toScene;

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
          // LE CÔTÉ SUD DE LA BORNE : la question posée par l'examen (« qui a
          // gravé côté sud ? ») reçoit sa réponse de la vie précédente. Rien
          // à la première — c'est le silence qui rend la 2e lisible.
          ...(poi.borneSud
            ? (() => {
                const m = loadMemory();
                const l = ligneBorneSud(m.fallen[0], m.deaths);
                return l ? [{ id: nextId(), kind: "narration" as const, text: l }] : [];
              })()
            : []),
          // LE POTEAU QUI PORTE TON NOM suit tes vies (partie de découverte
          // 8/08). Le texte vit dans `lignePoteauNom` depuis le 13/08 — il est
          // servi ici ET par le choix converti du Champ des Fixés.
          ...((poi.id === "poteaux-vierges" && lignePoteauNom(loadMemory().deaths)
            ? [{
                id: nextId(),
                kind: "narration" as const,
                text: lignePoteauNom(loadMemory().deaths) as string,
              }]
            : []) as FeedEntry[]),
        ];
        if (gained) {
          entries.push(entreeObtenu(nextId(), gained));
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
          // Ce qu'on a REGARDÉ ici prépare le geste (panel 10/08) : chaque
          // point examiné ouvre l'Anneau d'un cran, au plus deux. Voir
          // `RunState.poiIci` — c'est le seul levier par lequel ce que le
          // joueur TENTE change ses chances, et il est gratuit.
          run.poiIci = (run.poiIci ?? 0) + 1;
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

    // ROMPRE UNE CLAUSE (14/08). Parler à un pendu, y toucher, regarder le
    // sud : le Serment ne se mesure plus au Soupçon (qui est au maximum au
    // moment du procès, ce qui rendait sa défense inatteignable) mais aux
    // gestes eux-mêmes. Posé à la SÉLECTION : c'est le geste qui rompt, pas
    // sa réussite — un pendu à qui on adresse la parole a été adressé.
    // ⚠️ Seulement si le Serment a DÉJÀ été prêté : on ne rompt pas une
    // promesse qu'on n'a pas faite. La Femme au Seuil se joue avant le muret,
    // donc regarder le sud chez elle ne doit pas marquer d'avance un serment
    // qui n'existe pas encore.
    if (choice.rompLeSerment && runRef.current?.hameau?.serment) {
      persist((run) => {
        run.hameau = { ...run.hameau, sermentRompu: true };
      });
    }
    // LA MENACE LAISSÉE ACTIVE (17/08 §2) : se dérober à un danger ne
    // l'efface pas du monde. AU PLUS UNE à la fois — la première tient le
    // créneau, les suivantes ne s'enregistrent pas (garde-fou du document :
    // jamais une liste invisible de dettes).
    if (choice.laisseMenace && !runRef.current?.menace) {
      const idM = choice.laisseMenace;
      persist((run) => {
        run.menace = { id: idM, poseeA: run.trav?.visited.length ?? 0, traces: 0 };
      });
    }
    // CHOIX CERTAIN = PRIX CERTAIN (17/08 §2) : cette sortie sûre referme la
    // prochaine Croisée — même canal, même lecture que l'échec dur.
    if (choice.fermeLaRoute) {
      persist((run) => {
        run.routeFermeeEnAttente = true;
      });
    }
    // Le Serment des Renonçants (spec 24/07 suite §3) : engage la traversée —
    // il conditionne la Halte (grange vs nuit dehors) et la sortie de zone.
    if (choice.serment) {
      const s = choice.serment;
      persist((run) => {
        run.hameau = { ...run.hameau, serment: s };
      });
      // Codex : prêter (ou refuser) le Serment débloque son arc — on a
      // entendu les trois clauses, l'idée est vécue.
      debloquerCodex("arc:serment", runRef.current?.heroName ?? "", runRef.current?.day ?? 1);
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
      // ⚠️ Phase A : plus de doublement caché. MARQUÉ multipliait le Soupçon
      // par deux sans que rien ne le dise — exactement le « multiplicateur
      // invisible » que la refonte bannit. Ce que coûte un acte est ce que le
      // choix déclare, ni plus ni moins.
      const delta = choice.soupcon;
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
    // ─── Les charges d'un point d'intérêt, portées par une ACTION ──────────
    // Chantier du 11/08 : « Observer » disparaît, les observations qui restent
    // deviennent des actions directes. Sans ces trois branches, transformer un
    // point en choix perdrait son fragment de lore, sa version du fait, ou son
    // compte de corbeaux — c'est-à-dire exactement ce qui le rendait utile.
    // Elles sont poussées en tête des beats de la conséquence, pour être lues
    // AVANT ce que l'action provoque.
    const supplements: string[] = [];
    if (choice.corbeaux) supplements.push(ligneCorbeaux(loadMemory().deaths));
    if (choice.troupeau)
      supplements.push(
        ligneTroupeau(tailleTroupeau(loadMemory().runsStarted, loadMemory().fixations))
      );
    if (choice.borneSud) {
      const m = loadMemory();
      const l = ligneBorneSud(m.fallen[0], m.deaths);
      if (l) supplements.push(l);
      // LA BORNE RÉPOND À SA PROPRE QUESTION (14/08). L'examen finit depuis
      // le 20/07 sur « alors qui a gravé côté sud ? ». Avec un Sceau, la
      // réponse est dans la main du joueur — et elle vient EN DERNIER, après
      // la marque du prédécesseur : c'est le geste qui conclut.
      const ls = ligneSceauBorne(sceauNiveau);
      if (ls) supplements.push(ls);
    }
    if (choice.poteau) {
      const l = lignePoteauNom(loadMemory().deaths);
      if (l) supplements.push(l);
    }
    const fragChoix = choice.chapterFragment ? takeChapterFragment() : null;
    if (fragChoix) {
      supplements.push(fragChoix.text);
      persist((run) => {
        run.fragmentsLus = [...(run.fragmentsLus ?? []), fragChoix.index];
      });
    }
    if (choice.fait) {
      const v = versionDuFait(choice.fait, loadMemory().runsStarted);
      if (v) {
        supplements.push(v.texte);
        noterFait(choice.fait, v.id);
        setContradictions(contradictionsConnues(loadMemory()).length);
      }
    }
    // ⚠️ Servis pour les choix SANS dé uniquement. Sur un choix risqué, l'écran
    // ne change qu'après la résolution : un supplément posé ici s'afficherait
    // avant qu'on sache si l'action a réussi. Les actions issues d'un point
    // d'intérêt (regarder, compter, lire) n'ont pas de jet — c'est cohérent.
    // Le garde `tools/acceptation.py` refuse la combinaison, pour qu'un champ
    // déclaré ne reste jamais silencieusement inerte.
    const supplementsBeats: FeedEntry[] = supplements.map((t) => ({
      id: nextId(),
      kind: "narration" as const,
      text: t,
    }));
    // ─── L'OBSERVATION PRÉPARE LE GESTE ───────────────────────────────────
    // Même levier que l'examen d'un point d'intérêt (`RunState.poiIci`, panel
    // 10/08) : regarder avant d'agir ouvre l'Anneau d'un cran, au plus deux.
    // Sans ce champ, convertir un lieu en actions directes SUPPRIMAIT son
    // économie de préparation — c'est ce qui est arrivé aux trois lieux du lot
    // pilote du 11/08. La remise à zéro se fait au changement de LIEU, donc ce
    // qu'on a regardé à l'arrivée pèse encore sur le jet de l'écran-événement,
    // et nulle part ailleurs.
    if (choice.observe) {
      persist((run) => {
        run.poiIci = (run.poiIci ?? 0) + 1;
      });
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
      // Reliques portées (jusqu'à trois, spec 20/08) : les DONS aident, les
      // DETTES coûtent — et tout s'additionne. Deux « faveur » pèsent +2,
      // deux « froideur » ferment deux crans d'EMPATHIE.
      const donsRel = donsPortes(loadMemory());
      const dettesRel = dettesPortees(loadMemory());
      const faveur = donsRel.filter((d) => d === "faveur").length;
      // « froideur » : les gens sentent ce que tu portes — un jet social de
      // moins. « gel » : le TOUT PREMIER jet de la vie part nu, sans le
      // secours d'aucun état ni d'aucune faveur (binaire : deux gels ne
      // gèlent pas deux jets — le premier jet n'existe qu'une fois).
      const froideur =
        choice.risky.stat === "EMPATHIE"
          ? -dettesRel.filter((d) => d === "froideur").length
          : 0;
      const gele = dettesRel.includes("gel") && (runRef.current?.rolls?.length ?? 0) === 0;
      // LES ÉTATS — ils modifient le jet, et l'Anneau (calculé sur le
      // modificateur) montre la différence en encoches. La mention textuelle
      // sous le dé a été retirée le 11/08 (retour Patrick).
      // PRÉPARATION (panel 10/08) : ce qu'on a REGARDÉ dans ce lieu ouvre
      // l'Anneau, d'un cran par point d'intérêt, au plus deux. C'est la
      // réponse au constat le plus dur du panel — « l'anneau bouge, mais avec
      // ce que je porte, jamais avec ce que je tente ». Le curieux est payé
      // là où le jeu fait mal, le pressé garde les chances brutes, et
      // l'observation reste gratuite (arbitrage du 8/08 préservé).
      const preparation = Math.min(2, runRef.current?.poiIci ?? 0);
      const modifier = gele
        ? passives + statBonus
        : effects.reduce((sum, e) => sum + e.delta, 0) + passives + statBonus + faveur + froideur + preparation;
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
      // ⚠️ Phase A : plus de décalage de seuil par état. `seuilTous` n'était
      // porté que par FIÉVREUX, et `jets` par lui seul aussi — les deux
      // étaient des modificateurs cachés, ce que la refonte bannit. Une
      // marque agit sur ce qui S'OUVRE, jamais sur un chiffre invisible.
      // CE QU'ON APPORTE À SON PROCÈS (Phase C) : chaque chose gagnée AVANT
      // de savoir que le procès existe abaisse le seuil d'un cran. Rien n'est
      // affiché — l'Anneau, calculé sur ce seuil, montre juste plus
      // d'encoches pleines, et le premier écran du procès dit en fiction ce
      // qu'on apporte. Le plafond de 3 est dans `apportsProces` : même très
      // bien préparé, le jet reste serré.
      const prepare = scene.fixationTrial ? apportsProces(runRef.current ?? {}).length : 0;
      const threshold = Math.max(2, choice.risky.threshold - soft + tension - prepare);
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
      // La NATURE du jet décide du coût de son échec (arbitrage 9/08). Défaut
      // prudent : un jet de combat est physique, tout le reste est social —
      // les 83 jets de la zone sont annotés explicitement, ce défaut ne sert
      // qu'à un futur choix qu'on aurait oublié d'annoter.
      const natureDuJet: NatureJet = choice.nature ?? (scene.combat ? "physique" : "social");
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
        // Plus AUCUNE mention d'état sous le dé (retour Patrick 11/08 : « les
        // états en orange sont encore en bas quand on lance le dé, à
        // supprimer ») — l'Anneau porte déjà l'information : états et
        // préparation entrent dans `modifier`/`threshold`, donc dans le
        // nombre d'encoches pleines. Le volet d'état et l'Essence restent
        // les lieux de consultation.
        highStakes: choice.risky.highStakes,
        fatalCheck: (tier) => {
          if (!tierIsFail(tier)) return false;
          if (isTrial) return true;
          // Même source de vérité que la résolution : un échec social ou
          // d'exploration ne coûte pas de santé, donc il ne peut pas tuer —
          // et le dé ne doit surtout pas annoncer MORT dans ce cas. La borne
          // (17/08) rend AUSSI le surnaturel non fatal : l'effroi laisse au
          // seuil, il ne franchit pas.
          return healthNow - coutSanteBorne(natureDuJet, tier, choice.horsDePortee, healthNow) <= 0;
        },
      });
    } else if (choice.rest) {
      // Campement (spec §7, précisé 13/07) : le jour avance, blessures atténuées.
      // Plus AUCUNE consommation automatique d'objet (spec 21/07 point 4 :
      // « rien d'automatique, jamais ») — le soin d'un actif est une décision
      // du joueur (menu → Utiliser, ou 4e choix contextuel).
      // ⚠️ Phase A : plus d'usure du repos. Elle venait de FIÉVREUX, seul
      // porteur de `usureParJour`, parti avec les Besoins qui le posaient.
      const usure = 0;
      persist((run) => {
        run.day += 1;
        run.horloge = (run.horloge ?? run.day) + 1;
        // Même clé que la branche « nuit » d'advance : la nuit ne se compte
        // qu'une fois, qu'on l'ait dormie ou veillée.
        if (scene.nuit) run.vus = noter(run.vus, "nuit|" + scene.id);
        run.health = Math.max(0.08, Math.min(1, run.health + 0.35 - usure));
        // BESOINS (spec §3) : dormir est satisfait ici. Les besoins se comptent
        // en JOURS, jamais en scènes — garde-fou n°2 : un joueur qui traverse
        // vite n'aura presque jamais faim.
        // ⚠️ PAS de `+ 1` (relecture par agents, 10/08) : `run.horloge` vient
        // d'être incrémentée par la nuit deux lignes plus haut. Le « +1 »
        // datait le sommeil d'un cran dans le FUTUR — au réveil, `depuis`
        // valait −1 et le besoin durait quatre crans au lieu de trois, sans
        // s'accorder avec `repondreAuBesoin`, qui écrit l'heure telle quelle.
        run.besoins = { ...(run.besoins ?? {}), dormir: run.horloge ?? run.day };
        run.effects = run.effects
          .filter((e) => e.delta > 0 || e.scenesLeft >= 900)
          .map((e) => (e.scenesLeft >= 900 && e.delta < -1 ? { ...e, delta: -1 } : e));
      });
      const newDay = runRef.current?.day ?? day + 1;
      setDay(newDay);
      setHealth(runRef.current?.health ?? 1);
      mutateMemory((m) => {
        m.bestDays = Math.max(m.bestDays, newDay);
      });
      const prepend: FeedEntry[] = [{ id: nextId(), kind: "day", day: newDay }];
      // LA NUIT SE RACONTE (panel 10/08 : « le repos existe, muet »). Le seul
      // répit du jeu passait comme un écran de chargement. Une ligne
      // d'ouverture dédupliquée sur la vie + une ligne de corps, la plus
      // grave d'abord — le joueur doit LIRE ce que la nuit vient de faire.
      {
        const dejaVues = runRef.current?.vus ?? {};
        let moins = Infinity;
        for (const t of NUIT_OUVERTURE) moins = Math.min(moins, vu(dejaVues, "nuit|" + t));
        const frais = NUIT_OUVERTURE.filter((t) => vu(dejaVues, "nuit|" + t) === moins);
        const ouverture = frais[newDay % frais.length];
        prepend.push({ id: nextId(), kind: "narration", text: ouverture });
        persist((r) => { r.vus = noter(r.vus, "nuit|" + ouverture); });
        // Les états sont lus APRÈS le repos : c'est bien ce qui reste au
        // matin que la ligne décrit, pas ce qu'on avait en se couchant.
        const restants = idsEtats(faitsDe(runRef.current));
        const blesse = (runRef.current?.effects ?? []).some((e) => e.id === "entaille");
        const cle =
          ["fievreux", "hante", "affame", "boiteux"].find((k) => restants.includes(k)) ??
          (blesse ? "entaille" : "defaut");
        prepend.push({ id: nextId(), kind: "narration", text: NUIT_CORPS[cle] });
      }
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
      // ═══ L'OBJET AGIT SUR PLACE (chantier feedback+fluidité 12/08, §2).
      //
      // Avant : l'effet s'appliquait et on enchaînait l'écran suivant — le
      // joueur ne voyait donc JAMAIS ce que son objet venait de changer, ce
      // que le chantier appelle « une récompense invisible ».
      //
      // Maintenant : `resterSurPlace` TOUJOURS, quelle que soit la scène. La
      // conséquence s'écrit, l'écran se recompose, et les options que l'objet
      // ouvre (`requiresUsage`) ou ferme (`masqueSiUsage`) apparaissent
      // là-dedans. Un objet ne fait plus passer le temps : il transforme
      // l'endroit où on est.
      const itemId = choice.useItem.itemId;
      const item = (runRef.current?.besace ?? []).map(normalizeItem).find((i) => i.id === itemId);
      let consequence =
        choice.useItem.consequence ??
        "Tu utilises ce que tu portais. La lande ne te rendra rien en échange.";
      if (item) {
        persist((run) => {
          run.besace = run.besace.filter((i) => i.id !== itemId);
          if (item.heal) run.health = Math.min(1, run.health + item.heal);
          if (item.cure) run.effects = run.effects.filter((e) => e.delta > 0);
        });
        setHealth(runRef.current?.health ?? health);
        if (!choice.useItem.consequence) {
          // ⚠️ LE TEXTE DE L'OBJET D'ABORD (playtest du 12/08). La formule
          // générique donnait le MÊME paragraphe au Miroir de Poche Fêlé et à
          // l'Onguent gris, à deux écrans d'intervalle — l'objet perdait son
          // identité au moment précis où il devait la prouver, et un miroir
          // fêlé ne se boit pas. Chaque actif porte maintenant son
          // `usageTexte` ; la formule générique n'est plus qu'un filet pour un
          // objet qu'on aurait oublié d'écrire.
          const geste =
            item.usageTexte ??
            `Tu sors « ${item.name} » de la Besace et tu t'occupes de toi, là, ` +
              `debout, sans t'asseoir. ` +
              (item.cure
                ? "La plaie se referme, l'entaille cède enfin."
                : "Un peu de force te revient.");
          // La blessure qui cède se DIT quel que soit l'objet — c'est ce que
          // le joueur vient d'acheter — sauf si son propre geste le raconte
          // déjà.
          const referme =
            item.cure && !/(referme|cède|plaie)/i.test(geste)
              ? " La plaie se referme, l'entaille cède enfin."
              : "";
          consequence =
            `${geste}${referme} Ce que tu vas tenter maintenant, tu le tenteras ` +
            `avec ce corps-là.`;
        }
      }
      advanceTimer.current = setTimeout(() => resterSurPlace(choice.id, { consequence }), 320);
    } else if (choice.passive) {
      // Le silence comme vraie option (§19) : conséquence dédiée, sans dé.
      // Un choix passif peut aussi DONNER (rencontres en beats du 24/07 suite :
      // accepter la mèche, raconter sa mort au Veilleur) — l'objet se mérite
      // par la décision, pas par un jet, puisqu'il n'y a pas de jet ici.
      const granted = choice.grantsLoot ? grantLandesLoot(choice.grantsLoot) : null;
      // L'OBJET RESTE SUR PLACE (`laisseObjet`, Falaise 24/08) : une seule
      // instance quitte la Besace — le prix est raconté par la conséquence
      // du choix, jamais par un bandeau. Persisté par le persist du flux.
      if (choice.laisseObjet) {
        const nomLaisse = LANDES_OBJETS[choice.laisseObjet]?.name;
        persist((run) => {
          const idx = run.besace.findIndex((i) => i.name === nomLaisse);
          if (idx >= 0) run.besace = run.besace.filter((_, i) => i !== idx);
        });
      }
      // « Le Registre ment » (5/08) : la conséquence écrite est le CADRE, ce
      // que le héros dit vient de la contradiction qu'il tient réellement —
      // deux versions du même fait, lues dans deux vies différentes.
      let consequencePassive = consequenceAffichee(choice, demoActive());
      if (choice.requiresContradiction) {
        const tenues = contradictionsConnues(loadMemory());
        // Avec le don « lecture » et aucune contradiction vécue, on prend le
        // premier fait de la table : la relique fait lire ce qu'on n'a pas vu.
        const f = tenues[0] ?? faitById("fait-bailli");
        if (f) consequencePassive = `${f.accusation}\n\n${consequencePassive}`;
      }
      advanceTimer.current = setTimeout(
        () =>
          reste
            ? resterSurPlace(choice.id, {
                consequence: consequencePassive, grantedItem: granted, append: supplementsBeats,
                imageElement: choice.illustration,
              })
            : advance({
                consequence: consequencePassive, grantedItem: granted,
                toScene: sortieVers, append: supplementsBeats,
                imageElement: choice.illustration,
              }),
        320
      );
    } else {
      // Choix neutre : résolution instantanée, sans dé (spec §4).
      advanceTimer.current = setTimeout(
        () =>
          reste
            ? resterSurPlace(choice.id, { append: supplementsBeats })
            : advance({ toScene: sortieVers, append: supplementsBeats }),
        320
      );
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
          className="absolute top-[calc(env(safe-area-inset-top,0px)+11px)] right-[10px] z-[5] grid size-[32px] cursor-pointer grid-cols-3 place-items-center border border-solid border-[var(--color-ink)] bg-[var(--color-bg)]/80 p-[8px]"
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
                onEtat={(id, label, positive) => {
                  // Pendant la frappe ou entre deux micro-beats, un tap sur la
                  // carte est un « continuer » (déjà servi par le pointerdown
                  // de la zone) — ouvrir le volet PAR-DESSUS volerait le geste
                  // et couvrirait les choix (soft-lock du banc v2E, 7/08 : la
                  // carte occupe pile la zone où l'on tape pour avancer). Le
                  // volet ne s'ouvre qu'écran au repos.
                  if (activeTypingIdRef.current || beatsSuiteRef.current.length) return;
                  setVoletEtat({ id, label, positive });
                }}
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

        {/* PENDANT LA FRAPPE (panel 10/08) : la narration se tape à 15 ms par
            caractère et les CTA sont retirés du flux — soit jusqu'à cinq
            secondes d'écran sans un seul bouton, environ trois minutes par
            vie. Le tap révélait déjà tout d'un coup ; rien ne le disait. Le
            libellé diffère de « continuer » à dessein : ici le geste
            n'avance pas, il accélère. */}
        {activeTypingId && !rolling && (
          <TouchHint bottom={14} libelle="Touche pour tout afficher" />
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
                    (choice.locked.min != null && passeDispoMirror))
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
            // LE DESTIN DONNE TOUJOURS QUELQUE CHOSE (panel 10/08) : on tire
            // parmi ce qui TIENT dans la Besace, au lieu d'annoncer un objet
            // que le slot plein n'accepterait pas. Null = les deux slots sont
            // pleins ; c'est dit dans la fiction, jamais escamoté.
            const destinItem =
              tier === "destin"
                ? recompenseDestinQuiTient(engaged, runRef.current?.besace ?? [])
                : null;
            const destinSansPlace = tier === "destin" && !destinItem;
            // Usure (chantier 1 du 23/07) : un échec DUR (critique/malédiction)
            // hors combat coûte un JOUR — coût visible. En combat, le coût
            // visible est l'aggravation ENTAILLÉ (persistante) déjà posée.
            const hardFail = tier === "critique" || tier === "malediction";
            // La nature du jet (arbitrage 9/08) — relue ici comme à
            // l'armement, à partir du choix réellement pris.
            const natureJet: NatureJet =
              scene.choices.find((c) => c.id === selectedId)?.nature ??
              (scene.combat ? "physique" : "social");
            // Un guide connaît les raccourcis : l'échec dur ne coûte plus le
            // JOUR qu'il coûte d'habitude. Bénéfice réel, jamais chiffré — il
            // se lit au fait que la puce « Jour » ne bouge pas.
            // LE TEMPS N'EST PLUS JAMAIS UNE TAXE (arbitrage 9/08, §17 du
            // rapport : « time ne doit jamais être automatique »). J'avais
            // d'abord gardé un Jour sur l'échec d'EXPLORATION — mais l'audit
            // des textes l'a démenti : aucune des 8 issues concernées ne
            // raconte des heures perdues (« Ils sont deux, montés pendant que
            // tu regardais »), donc la mécanique aurait contredit la prose.
            // Un échec d'exploration coûte ce que son texte dit : l'occasion,
            // et le fait d'avoir été vu. Le Jour n'avance plus qu'en MARCHANT
            // (un tous les trois lieux) et au campement.
            // ⚠️ ET PLUS AUCUN JOUR AJOUTÉ PAR UN ÉCHEC (correction Patrick
            // 10/08). Il restait un champ `coutJour` posé sur un choix, au
            // motif que sa prose disait que des heures avaient passé. Mais le
            // Jour est le SCORE du Grand Registre : le donner en punition
            // récompense l'échec. Le temps passé par ce jet est compté comme
            // tout le reste — le lieu a été VÉCU, il entre dans `lieuxEngages`.
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
            const porteuseAmorti =
              tier === "malediction" || tier === "critique"
                ? porteuseDisponible("amorti", runRef.current)
                : null;
            const amorti = Boolean(porteuseAmorti);
            // Dette « brisure » : LA relique qui amortit rompt en le faisant,
            // et la secousse reste dans les bras (ÉBRANLÉ, 2 scènes).
            const brisure = amorti && relicDette(porteuseAmorti!.relic) === "brisure";
            persist((run) => {
              run.rolls.push({ step, choiceId: selectedId ?? "roll", result, at: nowMs(), ok: !tierIsFail(tier) });
              // Tu as tenté quelque chose ici : ce lieu comptera dans les
              // `lieuxEngages` qui font avancer le Jour. Ce qui compte est
              // d'avoir LANCÉ, pas d'avoir réussi — position tenue, pas un
              // oubli (relecture par agents, 10/08, qui la notait « à
              // surveiller ») : l'échec se paie déjà en santé, en état et en
              // route fermée. Le faire aussi payer sur l'axe du SCORE ferait
              // trancher le dé à la place du joueur — la même inversion que le
              // Jour-sanction retiré le 10/08.
              run.engageIci = true;
              // Coûts relevés (partie de découverte 8/08 : santé 1 → 0,76 sur
              // trois jours de jeu — la tension du permadeath ne se sentait
              // pas). Un échec coûte maintenant un vrai cran ; la Descente
              // reste atteignable, mais plus en pilotage automatique.
              let cost = coutSanteBorne(natureJet, tier, chosen?.horsDePortee, run.health);
              // Le coussin ne prend que les CHOCS — un coup physique. Sur un
              // jet surnaturel il n'a rien à amortir (l'effroi n'a pas de
              // choc), et le laisser jouer aurait DEUX défauts : porter un
              // échec surnaturel simple de 0,10 à 0,12 (un coussin qui
              // aggrave), et contourner la borne « l'effroi ne tue pas ».
              if (amorti && porteuseAmorti && cost > 0 && natureJet === "physique") {
                cost = 0.12;
                run.reliquesUsees = [...(run.reliquesUsees ?? []), porteuseAmorti.idx];
                if (brisure)
                  run.effects = [
                    { id: "ebranle", label: "ÉBRANLÉ", delta: -1, scenesLeft: 2 },
                    ...run.effects.filter((e) => e.id !== "ebranle"),
                  ];
              }
              // (miroir de rendu mis à jour après le persist, plus bas)
              run.health = Math.max(0, run.health - cost);
              // AGUERRI seulement en COMBAT, et seulement quand la victoire
              // est PHYSIQUE (symétrique du correctif ENTAILLÉ/ÉBRANLÉ,
              // 8/08) : sa fiche dit « le combat t'a affûté » — un 20 naturel
              // en conversation la faisait mentir, et APAISER le Chien du
              // Bailli à l'Empathie aussi (rapport IA externe 8/08 : « Aguerri
              // après avoir parlé doucement à un chien »). Gagner sans se
              // battre n'affûte pas les gestes de guerre.
              if (
                scene.combat &&
                !tierIsFail(tier) &&
                (roll?.stat === "COURAGE" || roll?.stat === "INSTINCT")
              )
                run.effects = [
                  { id: "aguerri", label: "AGUERRI", delta: 2, scenesLeft: 3 },
                  ...run.effects.filter((e) => e.id !== "aguerri"),
                ];
              // LE PAIEMENT DE LA PRÉPARATION (lot 3) : qui savait où se
              // placer n'est pas à portée quand il rate. Pas de blessure
              // persistante, et `coutSante` ne prend rien (voir plus haut).
              // C'est le seul paiement, il remplace le seuil abaissé d'un
              // point qui était invisible.
              if (scene.combat && tierIsFail(tier) && !chosen?.horsDePortee)
                run.effects = [
                  { id: "entaille", label: "ENTAILLÉ", delta: -2, scenesLeft: 999 },
                  ...run.effects.filter((e) => e.id !== "entaille"),
                ];
              else if (tier === "malediction" && !chosen?.horsDePortee) {
                // Le contrecoup suit la NATURE du jet, pas sa stat (panel
                // 24/08) : l'ancienne clé Courage/Instinct posait ENTAILLÉ —
                // une plaie — sur un jet SOCIAL ou SURNATUREL porté par le
                // Courage, sans blessure racontée (elle datait du 7/08 et
                // n'avait jamais été alignée sur le modèle par nature de
                // v1.58). Physique → la chair ; tout le reste → ÉBRANLÉ, le
                // choc. Et `horsDePortee` (lot 3 du 14/08) vaut ici aussi :
                // qui savait où se placer ne ressort pas blessé d'un raté.
                const natureDuJet =
                  chosen?.nature ?? (scene.combat ? "physique" : "social");
                run.effects =
                  natureDuJet === "physique"
                    ? [
                        { id: "entaille", label: "ENTAILLÉ", delta: -2, scenesLeft: 3 },
                        ...run.effects.filter((e) => e.id !== "entaille"),
                      ]
                    : [
                        { id: "ebranle", label: "ÉBRANLÉ", delta: -1, scenesLeft: 2 },
                        ...run.effects.filter((e) => e.id !== "ebranle"),
                      ];
              }
              // Destin : le tirage n'a retenu que ce qui TIENT (10/08), donc
              // l'objet annoncé entre toujours réellement en Besace.
              // ⚠️ Re-vérifier la place À L'AJOUT (relecture par agents) : le
              // Destin et le gain d'examen sont tous deux validés contre la
              // Besace d'AVANT le jet — un 20 naturel sur un choix qui donne
              // déjà un objet en faisait entrer deux dans un seul slot libre.
              if (destinItem && hasBesaceRoom(run.besace, normalizeItem(destinItem).slot))
                run.besace = [...run.besace, destinItem];
              // Gain d'un choix d'examen (grantsLoot) : déjà validé (place +
              // pas encore ramassé) — on l'inscrit à la Besace et au registre
              // des ramassages de la run.
              if (
                grantedItem &&
                chosen?.grantsLoot &&
                hasBesaceRoom(run.besace, normalizeItem(grantedItem).slot)
              ) {
                run.besace = [...run.besace, grantedItem];
                run.looted = [...(run.looted ?? []), chosen.grantsLoot];
              }
              // Soupçon : c'est LE coût d'un échec social (arbitrage 9/08).
              // Rater une parole ne saigne pas — ça se remarque. Un échec dur
              // se remarque deux fois plus.
              // MALÉDICTION STRICTEMENT PIRE QUE FUNESTE (panel du 9/08, l'un
              // des trois chiffres isolés) : la pire face du dé ne peut pas
              // coûter la même chose qu'un simple échec dur. C'était vrai côté
              // santé (0,30 contre 0,26), faux côté social — les deux
              // valaient +2. Un 1 naturel se raconte plus loin qu'un ratage.
              // ON T'A VU (panel 10/08) : sur les 8 jets d'EXPLORATION de la
              // zone, un seul portait un coût — les sept autres se rataient
              // gratuitement. Or six de leurs proses d'échec disent qu'on t'a
              // surpris. `vuSiEchec` fait payer ce que le texte raconte déjà,
              // au même barème que le social : le coût suit la prose, jamais
              // l'inverse (doctrine du 9/08).
              if (tierIsFail(tier) && chosen?.vuSiEchec && natureJet !== "social" && !scene.fixationTrial) {
                // ⚠️ Mesuré au test : « Observer d'abord, à couvert » paie
                // DÉJÀ +1 à la sélection (la dissimulation se paie, doctrine
                // du 8/08). Au plein barème, un seul geste raté montait donc à
                // 3 sur 6 — deux gestes et le procès tombe. Quand l'acte a
                // déjà payé, le ratage n'ajoute qu'un cran de plus.
                const dejaPaye = (chosen.soupcon ?? 0) > 0;
                const vu = tier === "malediction" ? (dejaPaye ? 2 : 3) : hardFail ? (dejaPaye ? 1 : 2) : 1;
                run.soupcon = Math.min(6, (run.soupcon ?? 0) + vu);
                // Un GESTE vu, pas une parole ratée : ces échecs sont tous
                // d'exploration (10/08).
                const t = temoinPour("echec-exploration");
                if (t && !(run.temoins ?? []).some((x) => x.id === t.id))
                  run.temoins = [...(run.temoins ?? []), t];
              }
              if (tierIsFail(tier) && natureJet === "social" && !scene.combat && !scene.fixationTrial) {
                const vu = tier === "malediction" ? 3 : hardFail ? 2 : 1;
                run.soupcon = Math.min(6, (run.soupcon ?? 0) + vu);
                const t = temoinPour("echec-empathie");
                if (t && !(run.temoins ?? []).some((x) => x.id === t.id))
                  run.temoins = [...(run.temoins ?? []), t];
              }
              // Procès du héros gagné : le hameau a jugé, il se lasse — le
              // Soupçon retombe (et pourra remonter, avec ses manifestations).
              // ⚠️ ARBITRAGE entre deux membres du panel, à connaître.
              // Le systémiste demandait 5 (« une relaxe ne doit pas être une
              // remise à zéro déguisée ») ; la joueuse mobile posait une
              // condition : « d'accord uniquement si je vois la lame venir ».
              // À 5, une seule parole ratée rouvre un procès, avec UNE seule
              // manifestation d'avertissement. À 4, la relaxe coûte quand même
              // (on est à deux crans du gouffre au lieu de trois) et les
              // paliers 5 PUIS 6 se rejouent avant le second procès — les deux
              // exigences tiennent. `soupconSeen` suit, sinon les
              // manifestations resteraient muettes en remontant.
              if (scene.fixationTrial && !tierIsFail(tier)) {
                run.soupcon = 4;
                run.soupconSeen = 4;
                // LE PROCÈS CONCLUT (panel 10/08). Le chiffre seul ne
                // suffisait pas : les dépositions restaient en place, donc le
                // second procès rejouait mot pour mot le premier — mêmes
                // témoins, mêmes griefs, six écrans plus tard. On ne juge pas
                // deux fois les mêmes actes : le jugement rendu épuise ce
                // qu'il a jugé, et un nouveau procès exige de NOUVEAUX actes.
                // ⚠️ On ne VIDE plus `temoins` (relecture par agents 10/08) :
                // `defensesDisponibles` lit la même liste, donc les vider
                // rendait le second procès mortel — plus de « discréditer »,
                // plus d'« émouvoir », seulement « Tout reconnaître » à 13.
                // Les dépositions sont marquées JUGÉES : hors de l'acte
                // d'accusation, toujours dans les défenses.
                run.temoinsJuges = [
                  ...(run.temoinsJuges ?? []),
                  ...(run.temoins ?? []).map((t) => t.id),
                ];
                run.temoinsCites = [];
                run.procesGagnes = (run.procesGagnes ?? 0) + 1;
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
            // ⚠️ UN SEUL état négatif par défaite de combat (retour Patrick
            // 11/08 : « j'ai perdu mais je prends 2 états négatifs, violent »).
            // La défaite de combat pose la BLESSURE, et elle seule.
            // SURNATUREL : le coût était un ÉTAT (HANTÉ, MARQUÉ), qui n'existe
            // plus depuis la Phase A. Il USE donc la chair — mais ne la tue
            // JAMAIS : `coutSanteBorne` le laisse au seuil (verdict du panel
            // 17/08, qui restaure la règle du 9/08 « la mort doit être
            // compréhensible dans la fiction »). ⚠️ La justification de la
            // Phase A (« c'est ce que la prose de ces onze jets raconte »)
            // était FAUSSE — relue le 17/08 : neuf des dix proses d'échec ne
            // décrivent aucune atteinte au corps (« Rien n'attaque »…).
            // Ni Soupçon (personne n'a rien vu), ni Jour.
            // ⚠️ Il est appliqué plus haut, par `coutSanteBorne`, avec tous
            // les autres : ici il vivait à part, donc `fatalCheck` l'ignorait
            // (le dé pouvait tuer sans annoncer MORT) et le paiement de la
            // préparation ne le couvrait pas.
            // FIXÉ : « le village te croit marqué par le sud (Soupçon élevé) ».
            // Seuil 4 : assez haut pour que ce soit une trajectoire, assez bas
            // pour qu'on le vive avant le procès (qui tombe à 6).
            // GARDÉ PAR LE LIEU (playtest auto 7/08) : l'état — et sa carte,
            // qui met des villageois en scène (« on parle devant toi, de
            // toi ») — se posait seul au milieu de la lande, avec un troupeau
            // pour tout témoin. Le seuil peut être ATTEINT n'importe où ; le
            // regard qui te fixe, lui, attend la première arrivée au village
            // (pose d'arrivée dans advance()).
            if ((run.soupcon ?? 0) >= 4 && dansLeVillage(scene.id)) poserEtatRun("fixe");
            setHealth(run.health);
            if (amorti) setPasseDispoMirror(Boolean(porteuseDisponible("passe", runRef.current)));

            // Mort par fixation (chantier 3 du 23/07, validée) : un jet raté
            // au procès tue, quelle que soit la santé — première mort du jeu
            // sans aucun combat, purement sociale, traitée comme toutes les
            // autres (relique + fragment + épitaphe). Le hameau s'en souvient
            // par-delà les runs (fixations).
            if (scene.fixationTrial && tierIsFail(tier)) {
              const epitaph = proseDuJet(outcome.text);
              const firstDeath = loadMemory().deaths === 0;
              // La relique RÉELLEMENT portée pendant cette vie — lue AVANT
              // recordDeath, qui pousse celle que cette mort vient de forger.
              const porteeNom =
                reliquesPortees(loadMemory()).map((p) => p.relic.name).join(" \u00b7 ") || null;
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
              const epitaph = proseDuJet(outcome.text);
              const cause = scene.foeName ?? "les Landes";
              // Jalon de première fois (spec 21/07) : lu AVANT recordDeath (qui
              // incrémente `deaths`) — le Geôlier accueille, pas de moquerie.
              const firstDeath = loadMemory().deaths === 0;
              // La relique RÉELLEMENT portée pendant cette vie — lue AVANT
              // recordDeath, qui pousse celle que cette mort vient de forger.
              const porteeNom =
                reliquesPortees(loadMemory()).map((p) => p.relic.name).join(" \u00b7 ") || null;
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
            const prepend = roll?.impossible
              ? [{ id: nextId(), kind: "jailer" as const, text: JAILER_DE_IMPOSSIBLE }]
              : undefined;
            const proseBase =
              amorti && porteuseAmorti
                ? `${proseDuJet(outcome.text)}\n\n${porteuseAmorti.relic.name} a pris le choc à ta place. Une fêlure la traverse, à présent — elle ne prendra pas le suivant.`
                : proseDuJet(outcome.text);
            // Destin sans place (10/08) : plutôt qu'un bandeau « Obtenu » pour
            // un objet qui n'entrera nulle part, on le dit. Les mains pleines
            // sont un vrai arbitrage — encore faut-il que le joueur sache
            // qu'il vient d'en payer le prix.
            const prose = destinSansPlace
              ? `${proseBase}\n\nIl y aurait eu quelque chose à prendre, là. Tes mains sont pleines, et tu le sais avant même de te baisser.`
              : proseBase;
            // SÉJOUR : les coûts du jet viennent d'être appliqués au-dessus —
            // seul le RÉCIT change de canal. Le lieu garde le héros, et le
            // choix qu'il vient de tenter ne se retente pas.
            if (scene.sejour && !chosen?.sortie && selectedId) {
              resterSurPlace(selectedId, {
                consequence: prose, prepend, result, grantedItem,
                // « hors combat » est acquis : aucun combat n'est un séjour —
                // une issue de combat CLÔT la rencontre (règle du 14/07).
                dur: tier === "critique" || tier === "malediction",
              });
              return;
            }
            // TOUT ÉCHEC DUR DÉPENSE QUELQUE CHOSE DU MONDE (panel 9/08).
            // Sur un séjour, c'est une option de l'écran (ci-dessus). Ici il
            // n'y en a pas à retirer — on arme donc la Croisée : la prochaine
            // n'offrira qu'une direction. On n'arme pas si c'est déjà armé
            // (deux échecs durs de suite ne ferment pas deux fois la même
            // route) ni au bord de la Descente, où il n'y a plus de Croisée.
            if (
              (tier === "critique" || tier === "malediction") &&
              !run.routeFermeeEnAttente &&
              !scene.terminal
            ) {
              persist((r) => {
                r.routeFermeeEnAttente = true;
              });
            }
            advance({
              result,
              fail: outcome.fail,
              prepend,
              consequence: prose,
              destinItem,
              grantedItem,
              toScene: chosen?.sortie?.toScene,
            });
          }}
        />

        {/* ═══ MODE DÉMO — L'ÉCRAN DU GESTE (script 24/08, segments 1-3).
            Un choix à mini-jeu ouvre cet overlay : le libellé du choix en
            chapeau, le canvas du moteur au centre, la consigne du geste en
            pied. Le compte à rebours des scènes chronométrées est suspendu
            tant qu'il est ouvert (garde dans l'effet du sablier). Le rendu
            des moteurs est celui de la galerie — le re-skin réaliste est le
            temps 2 (décision Patrick 24/08). */}
        {minigameChoice && minigameChoice.minigame && (
          <div
            className="absolute inset-0 z-[45] flex flex-col items-center justify-center px-[24px]"
            style={{ backgroundColor: "rgba(28, 26, 22, 0.94)" }}
            onPointerDown={() => {
              // Mode testeur (`?testeur=1`) : trois taps résolvent le geste —
              // une IA sans geste réel (ou l'auto-joueur) n'est jamais murée
              // devant un canvas. Hors testeur : inerte.
              if (!/[?&]testeur=1/.test(window.location.search)) return;
              testeurTaps.current += 1;
              if (testeurTaps.current >= 3) {
                testeurTaps.current = 0;
                finirMinigame(true);
              }
            }}
          >
            {!(minigameConfig as { imageFond?: string } | null)?.imageFond && (
              <p className="mb-[14px] max-w-[320px] text-center font-mono text-[13px] leading-[1.5] text-[var(--color-ink)]/85">
                {minigameChoice.label}
              </p>
            )}
            <div
              className={
                (minigameConfig as { imageFond?: string } | null)?.imageFond
                  ? "flex w-full justify-center"
                  : "w-[320px]"
              }
            >
              {minigameChoice.minigame.engine === "rub" ? (
                <RubReveal
                  seed={`demo-${scene.id}`}
                  config={
                    (minigameConfig ?? { label: "" }) as {
                      label: string;
                      threshold?: number;
                      imageFond?: string;
                      imageMousse?: string;
                      preEclaircie?: number;
                    }
                  }
                  onResult={finirMinigame}
                  onPhase={setMinigamePhase}
                />
              ) : minigameChoice.minigame.engine === "trace" ? (
                <GlyphTrace
                  seed={`demo-${scene.id}`}
                  config={(minigameConfig ?? { points: 6 }) as { points: number; tolerance?: number }}
                  onResult={finirMinigame}
                />
              ) : minigameChoice.minigame.engine === "pick" ? (
                <TimingTap
                  seed={`demo-${scene.id}`}
                  config={
                    (minigameConfig ?? { mode: "track", windowWidth: 0.16 }) as {
                      mode: "track" | "release" | "point";
                      windowWidth: number;
                      speed?: number;
                      maxAttempts?: number;
                    }
                  }
                  onResult={finirMinigame}
                />
              ) : minigameChoice.minigame.engine === "swipe" ? (
                <SlowSwipe
                  seed={`demo-${scene.id}-${minigameRetry}`}
                  config={
                    (minigameConfig ?? {
                      pagesNeeded: 5, maxSpeed: 9,
                      axis: "y", skin: "corde", step: 30, forgiving: true,
                    }) as {
                      pagesNeeded: number;
                      maxSpeed: number;
                      label?: string;
                      axis?: "x" | "y";
                      skin?: "page" | "corde";
                      step?: number;
                      forgiving?: boolean;
                    }
                  }
                  onResult={finirMinigame}
                />
              ) : (
                <HoldSteady
                  seed={`demo-${scene.id}`}
                  config={
                    (minigameConfig ?? { durationMs: 3000 }) as {
                      durationMs: number;
                      noMove?: boolean;
                      clearCue?: boolean;
                      grazeCount?: number;
                    }
                  }
                  onResult={finirMinigame}
                />
              )}
            </div>
            {/* Le hint du frottage à skin image suit la PHASE et CLIGNOTE
                comme « Touche pour continuer » (classe `touch-hint` = la même
                respiration pulse steps(2), demande Patrick 25/08). Pendant
                l'envol il se tait : la mousse qui part est le message. */}
            <p
              className={`touch-hint mt-[14px] text-center font-mono text-[11px] uppercase tracking-[2px] text-[var(--color-ink)]/50 ${
                minigamePhase === "envol" &&
                (minigameConfig as { imageFond?: string } | null)?.imageFond
                  ? "invisible"
                  : ""
              }`}
            >
              {minigameChoice.minigame.engine === "rub" &&
              (minigameConfig as { imageFond?: string } | null)?.imageFond
                ? minigamePhase === "lu"
                  ? "Touche pour continuer"
                  : "Gratte la mousse"
                : minigameChoice.minigame.engine === "rub"
                ? "Frotte la pierre"
                : minigameChoice.minigame.engine === "trace"
                  ? "Suis le tracé du tressage, point après point"
                  : minigameChoice.minigame.engine === "pick"
                    ? "Tape quand le crochet est dans la gorge"
                    : minigameChoice.minigame.engine === "swipe"
                      ? "Fais glisser vers le bas — lentement"
                      : "Maintiens l'appui — tiens bon"}
            </p>
          </div>
        )}

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

        {/* POPUP « rangé dans le menu » (maquette 2442:17234, 7/08) : carte
            charbon bordée blanc en haut d'écran, une fois par sujet et par
            compte. « Ne plus afficher » = le seul autre lien souligné du jeu
            (avec l'aide du dé) : les aides partagent leur grammaire. */}
        {aideMenu && (
          <div
            className="absolute inset-x-[15px] top-[62px] z-[36] border border-solid border-[var(--color-ink)] bg-[var(--color-bg)] px-[18px] pb-[14px] pt-[16px]"
            role="note"
          >
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setAideMenu(null)}
              className="absolute right-[10px] top-[8px] font-mono text-[13px] leading-none text-[var(--color-ink)] opacity-60"
            >
              ✕
            </button>
            <p className="font-mono text-[12px] leading-[1.6] text-[var(--color-ink)]">
              {aideMenu === "etat" ? (
                <>
                  Ton état est rangé dans le menu.
                  <br />
                  Tu peux l&apos;y consulter à tout moment.
                </>
              ) : (
                <>
                  Ton objet est rangé dans ta besace.
                  <br />
                  Tu la retrouves dans le menu, à tout moment.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                ecrireAideMenu({ ...lireAideMenu(), off: true });
                setAideMenu(null);
              }}
              className="mt-[10px] font-mono text-[11px] tracking-[0.5px] text-[var(--color-ink)] underline underline-offset-[3px] opacity-60"
            >
              Ne plus afficher
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

/** Libellé de la carte d'état : « Entaillé », pas « ENTAILLÉ » (maquette). */
function libelleEtat(label: string): string {
  const bas = label.toLocaleLowerCase("fr");
  return bas.charAt(0).toLocaleUpperCase("fr") + bas.slice(1);
}

/**
 * Description courte de la carte d'état (maquette 2440:13429) : la
 * manifestation de la fiche quand elle existe, sinon une phrase écrite pour
 * les effets hérités — jamais un chiffre.
 */
const DESC_EFFETS_HERITES: Record<string, string> = {
  // ⚠️ LOT 4 (14/08) : ces trois lignes NOMMAIENT l'effet et sa durée (« tes
  // gestes portent mieux, pour un temps »). Le corps le montre — l'érosion du
  // cadre, l'Anneau, la manière dont la scène suivante se passe. Ce qui reste
  // est ce que le héros SENT, jamais ce que le moteur calcule.
  entaille: "Quand tu poses le pied, la douleur remonte jusqu'à la hanche.",
  aguerri: "Ta main ne tremble plus. Elle sait ce qu'elle vient de faire.",
  ebranle: "Tu sursautes à un bruit qui ne t'aurait rien fait.",
};
function descEtat(id: string, positive: boolean): string {
  const fiche = etat(id);
  if (fiche) return fiche.manifestation;
  return (
    DESC_EFFETS_HERITES[id] ??
    (positive
      ? "Quelque chose est avec toi. Tu le sens à ta façon d'avancer."
      : "Quelque chose te retient. Tu le sens à ta façon d'avancer.")
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
    ? "Quelque chose est avec toi. Tu le sens à ta façon d'avancer."
    : "Quelque chose te retient. Tu le sens à ta façon d'avancer.";
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
          // `shrink-0` : le bandeau est un enfant de la zone de texte, elle-même
          // en flex-column contrainte. À trois boutons il tenait ses 87 px ;
          // dès qu'« Observer les alentours » en affichait cinq, la zone se
          // resserrait et il tombait à une ligne, puis tranchait la narration
          // en plein mot (panel 10/08, captures à l'appui). Un `min-height` ne
          // suffit pas ici : c'est la compression du conteneur qu'il faut
          // refuser. C'est le TEXTE qui défile, jamais le Geôlier qu'on rogne.
          className={`scene-enter jailer-banner mx-[-17px] mb-[18px] mt-[15px] relative flex min-h-[87px] shrink-0 items-center overflow-hidden bg-[var(--color-accent)] pl-[122px] pr-[20px] py-[16px] ${
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
      // CARTE D'ÉTAT (maquette 2440:13429, 7/08) : vignette bordée orange +
      // nom en orange + une ligne de manifestation en blanc-50. Elle reste le
      // temps de la scène où l'état a été attrapé (voir advance), puis part.
      // Tap sur la carte → le volet de détails. Jamais un chiffre.
      return (
        <div className="scene-enter etat-banner mb-[16px] flex flex-col gap-[10px]" role="note">
          {entry.effects.map((e) => (
            <button
              type="button"
              key={e.effectId}
              onClick={() => onEtat?.(e.effectId, e.label, e.positive)}
              className="flex items-start gap-[14px] text-left"
            >
              {/* La vignette n'apparaît que si le fichier existe VRAIMENT :
                  le nom seul vaut mieux qu'une image cassée (manifeste). */}
              {assetExiste(`assets/etat_${e.effectId}.png`) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  src={assetUrl(`assets/etat_${e.effectId}.png`)}
                  className={`size-[54px] shrink-0 border border-solid border-[var(--color-accent)] object-cover ${
                    e.positive ? "etat-icone-positive" : ""
                  }`}
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <span
                  aria-hidden
                  className="size-[54px] shrink-0 border border-solid border-[var(--color-accent)]"
                />
              )}
              <span className="flex min-w-0 flex-col gap-[4px] pt-[2px]">
                <span className="font-mono text-[13px] leading-none text-[var(--color-accent)]">
                  {libelleEtat(e.label)}
                </span>
                <span className="font-mono text-[10px] leading-[1.5] text-[var(--color-ink)] opacity-50">
                  {descEtat(e.effectId, e.positive)}
                </span>
              </span>
            </button>
          ))}
        </div>
      );
    case "obtenu":
      /* LA CARTE D'OBJET (maquette Figma 2531:825, 25/08) — remplace le
         bandeau à filet orange. Géométrie relevée sur la maquette : carte
         360×104 bordée blanc-30, vignette 92×92 à gauche, filet vertical à
         103,5 px, filet horizontal sous l'en-tête à 34,5 px.
         ⚠️ L'illustration de la SCÈNE ne cède plus la place à l'objet : la
         maquette garde le décor en haut et pose la vignette DANS la carte.
         ⚠️ La carte dit ce que l'objet FAIT (`usage`), pas ce qu'il EST — la
         saveur vit dans la fiche d'inventaire, où le popup renvoie. */
      return (
        <div className="scene-enter obtenu-carte mx-[-2px] mb-[18px]">
          <span className="obtenu-vignette">
            {entry.icone ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(entry.icone)} alt="" />
            ) : null}
          </span>
          <span className="obtenu-corps">
            <span className="obtenu-tete">
              <span className="obtenu-titre">
                {/* Glyphe « ↓ » de la maquette : traits nets, aucun arrondi
                    — même grammaire que les icônes de navigation. */}
                <svg
                  aria-hidden
                  className="obtenu-fleche"
                  viewBox="0 0 13 13"
                  width="13"
                  height="13"
                  fill="currentColor"
                >
                  <rect x="6" y="1" width="1" height="6" />
                  <path d="M3 6h7l-3.5 4z" />
                  <rect x="2" y="11" width="9" height="1" />
                </svg>
                OBTENU
              </span>
              <span className={`obtenu-tag obtenu-tag-${entry.rarete ?? "commun"}`}>{entry.rarity}</span>
            </span>
            <span className="obtenu-nom">{entry.name}</span>
            <span className="obtenu-quoi">{entry.usage || entry.flavor}</span>
          </span>
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
                <span className={`registre-cause${r.destin === "traversee" ? " registre-revenu" : ""}`}>{r.cause}</span>
              </div>
            ))}
          </div>
        </div>
      );
  }
}
