/**
 * LES RELIQUES DES LANDES — 10 objets nommés, forgés par une mort précise.
 *
 * Règle de design (retour test 4/08 §5 : « les Reliques devraient avoir une
 * dette ») : **une relique AIDE et COÛTE**. Jamais un bonus sec. Elle n'est
 * pas là pour rendre la vie suivante plus FACILE, mais pour la rendre
 * DIFFÉRENTE — et pour garder la trace de la manière dont elle est née.
 *
 * Chaque relique porte donc :
 *   • `don`    — ce qu'elle donne (mécanique réelle, câblée dans Scene.tsx) ;
 *   • `dette`  — ce qu'elle prend, toujours (mécanique aussi, jamais du décor) ;
 *   • `mort`   — la mort qui la forge : la relique se souvient de sa cause ;
 *   • `murmure` — le lore, en italique sur la fiche, réservé aux rares+.
 *
 * ⚠️ Voix des murmures (règle verrouillée 19/07) : aucun ne nomme la Porte ni
 * le remplacement — mais relus ensemble, ils disent tous la même chose. Ils
 * servent la LOI DE SUBSTITUTION (lib/loi-substitution.ts) : dans le Domaine,
 * rien n'est libéré, quelqu'un prend toujours la place de quelqu'un.
 */

import type { Relic } from "@/lib/player-memory";

/** Les dons câblés. Un seul par relique — lisible et testable. (Depuis la
    spec du 20/08, la Descente porte jusqu'à TROIS reliques : les dons se
    cumulent donc ENTRE reliques, jamais au sein d'une même relique.) */
export type RelicDon =
  /** Le 1ᵉʳ coup dur de la run coûte un échec simple, puis la relique se fend. */
  | "amorti"
  /** UNE fois, un verrou de stat s'ouvre malgré la nature du héros. */
  | "passe"
  /** +1 à tous les jets, toute la run. */
  | "faveur"
  /** Les lignes de PERCEPTION s'affichent comme si la stat était haute. */
  | "regard"
  /** Un témoin de moins dépose au procès (le premier inscrit est effacé). */
  | "silence"
  /** Les contradictions du Registre deviennent visibles sans les avoir vues. */
  | "lecture";

/** Les dettes câblées. Toujours une, toujours réelle. */
export type RelicDette =
  /** +1 Soupçon dès l'entrée dans la zone : on te reconnaît. */
  | "marque"
  /** La relique se brise à son usage et laisse ÉBRANLÉ (−1, 2 scènes). */
  | "brisure"
  /** Le Hameau refuse la halte : pas de grange, nuit dehors. */
  | "exclusion"
  /** Départ à santé réduite (le corps porte ce que l'objet a pris). */
  | "usure"
  /** Un jet d'EMPATHIE de moins : les gens sentent ce que tu portes. */
  | "froideur"
  /** Le premier jet de la run est lancé sans la faveur d'aucun état. */
  | "gel";

export type RelicLandes = {
  id: string;
  nom: string;
  rarete: Relic["rarity"];
  don: RelicDon;
  dette: RelicDette;
  /** Ce qui doit avoir tué le héros pour que cette relique se forge. */
  mort: "corde" | "bete" | "chute" | "eau" | "fixation" | "quelconque";
  /** Une ligne pour le don, une pour la dette — jamais un chiffre. */
  fonction: string;
  cout: string;
  murmure?: string;
};

export const RELIQUES_LANDES: RelicLandes[] = [
  {
    id: "vertebre-gravee",
    nom: "Vertèbre gravée",
    rarete: "rare",
    don: "passe",
    dette: "marque",
    mort: "corde",
    fonction: "Une fois, ta nature ne t'arrêtera pas. Tu feras ce que tu ne peux pas.",
    cout: "Le Hameau te reconnaît en entrant. On te regarde déjà de travers.",
    murmure: "Sept lettres gravées à l'os, à l'envers, par quelqu'un qui écrivait de l'intérieur.",
  },
  {
    id: "corde-seche",
    nom: "La corde sèche",
    rarete: "commune",
    don: "amorti",
    dette: "brisure",
    mort: "corde",
    fonction: "Le premier coup qui devait t'ouvrir ne fera que t'entamer.",
    cout: "Elle rompt en le faisant, et la secousse reste dans tes bras.",
  },
  {
    id: "oeil-lanterne-verte",
    nom: "Œil de lanterne verte",
    rarete: "rare",
    don: "regard",
    dette: "froideur",
    mort: "quelconque",
    fonction: "Tu remarques ce que ta nature ne t'aurait pas laissé voir.",
    cout: "Les gens sentent que tu regardes trop. Une porte de moins s'ouvre.",
    murmure: "La flamme dedans ne consomme rien. Elle attend qu'on la relève.",
  },
  {
    id: "dent-du-decompte",
    nom: "Dent du décompte",
    rarete: "legendaire",
    don: "faveur",
    dette: "usure",
    mort: "bete",
    fonction: "Chaque dé tombe un peu mieux. Les morts d'avant poussent avec toi.",
    cout: "Tu pars le corps déjà entamé — on ne porte pas ça sans le payer.",
    murmure: "Une encoche par nom. La dernière est fraîche, et le compte ne s'arrête pas là.",
  },
  {
    id: "clou-du-silence",
    nom: "Clou du silence",
    rarete: "rare",
    don: "silence",
    dette: "exclusion",
    mort: "fixation",
    fonction: "Une bouche de moins parlera contre toi, le jour du jugement.",
    cout: "Le Hameau ne t'ouvre plus sa grange. Tu dormiras dehors.",
    murmure: "On l'a retiré d'une planche qui tenait quelqu'un. La planche n'a pas été remplacée.",
  },
  {
    id: "miroir-noye",
    nom: "Le miroir noyé",
    rarete: "rare",
    don: "lecture",
    dette: "gel",
    mort: "eau",
    fonction: "Ce que le Registre écrit deux fois, tu le vois deux fois.",
    cout: "Ton premier jet part nu : aucun état ne t'accompagne.",
    murmure: "Le reflet dedans a une demi-seconde de retard. Il finit toujours par rattraper.",
  },
  {
    id: "eclat-de-de-fele",
    nom: "Éclat de dé fêlé",
    rarete: "commune",
    don: "amorti",
    dette: "gel",
    mort: "quelconque",
    fonction: "Le premier désastre s'arrête à mi-course.",
    cout: "Le premier jet de ta vie part sans rien pour t'aider.",
  },
  {
    id: "anneau-de-suie",
    nom: "Anneau de suie",
    rarete: "commune",
    don: "passe",
    dette: "marque",
    mort: "quelconque",
    fonction: "Une porte fermée à ta nature s'ouvrira quand même. Une seule.",
    cout: "La suie ne part pas. On te voit venir de loin.",
  },
  {
    id: "sablier-sans-sable",
    nom: "Sablier sans sable",
    rarete: "rare",
    don: "faveur",
    dette: "froideur",
    mort: "chute",
    fonction: "Le temps ne te presse plus. Tes jets s'en ressentent.",
    cout: "Les vivants n'aiment pas ceux que le temps a lâchés. Une porte de moins.",
    murmure: "Il ne s'est pas vidé. On l'a vidé. Ce n'est pas la même chose.",
  },
  {
    id: "nom-que-echo-a-garde",
    nom: "Le nom que l'écho a gardé",
    rarete: "legendaire",
    don: "lecture",
    dette: "usure",
    mort: "quelconque",
    fonction: "Tu entends ce que le Domaine a réécrit. Les deux versions.",
    cout: "Porter un nom qui n'est pas le tien fatigue. Tu pars déjà entamé.",
    murmure:
      "Prononce-le et quelque chose répond — pas l'écho. Quelqu'un qui attend qu'on l'appelle correctement.",
  },
];

const PAR_ID = new Map(RELIQUES_LANDES.map((r) => [r.id, r]));
const PAR_NOM = new Map(RELIQUES_LANDES.map((r) => [r.nom, r]));

/** La fiche d'une relique, par id ou par nom (les sauvegardes stockent le nom). */
export function relique(ref: string | undefined): RelicLandes | null {
  if (!ref) return null;
  return PAR_ID.get(ref) ?? PAR_NOM.get(ref) ?? null;
}

/**
 * L'ILLUSTRATION d'une relique (6/08). Dérivée de l'id plutôt qu'écrite champ
 * par champ : les fichiers du Drive portent exactement `relique_{id}.png`, avec
 * les tirets remplacés par des soulignés. Retourne null si le fichier n'existe
 * pas encore — l'appelant retombe alors sur l'icône générique des Reliques,
 * ce qui vaut toujours mieux qu'une image cassée. Accepte un id OU un nom,
 * comme `relique()`, puisque les sauvegardes ne stockent que le nom.
 */
export function reliqueIllustration(ref: string | undefined, existe: (c: string) => boolean): string | null {
  const fiche = relique(ref);
  if (!fiche) return null;
  const chemin = `assets/relique_${fiche.id.replace(/-/g, "_")}.png`;
  return existe(chemin) ? chemin : null;
}

/**
 * La relique forgée par une mort donnée. La CAUSE choisit le pool — une corde
 * ne forge pas la même chose qu'une noyade —, la rareté sort du tirage
 * habituel. `floorRare` = jalon de première mort (jamais une commune).
 */
export function forgerRelique(cause: string, floorRare: boolean): RelicLandes {
  const c = cause.toLowerCase();
  const mort: RelicLandes["mort"] = c.includes("hameau")
    ? "fixation"
    : /corde|gibet|pendu|bailli/.test(c)
      ? "corde"
      : /meute|bête|bete|chien|limier/.test(c)
        ? "bete"
        : /puits|mare|eau|noy/.test(c)
          ? "eau"
          : /éboul|chute|tour/.test(c)
            ? "chute"
            : "quelconque";
  const roll = Math.random();
  const rarete: Relic["rarity"] = floorRare
    ? roll < 0.75
      ? "rare"
      : "legendaire"
    : roll < 0.7
      ? "commune"
      : roll < 0.95
        ? "rare"
        : "legendaire";
  // Pool = les reliques de cette mort ET de cette rareté ; on élargit par
  // paliers plutôt que d'échouer (une mort doit TOUJOURS forger quelque chose).
  const exact = RELIQUES_LANDES.filter((r) => r.mort === mort && r.rarete === rarete);
  const parRarete = RELIQUES_LANDES.filter((r) => r.rarete === rarete);
  const pool = exact.length ? exact : parRarete.length ? parRarete : RELIQUES_LANDES;
  return pool[Math.floor(Math.random() * pool.length)];
}
