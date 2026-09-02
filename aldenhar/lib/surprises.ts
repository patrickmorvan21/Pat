/**
 * LES ÉLÉMENTS-SURPRISES (catalogue du journal Notion 6/08).
 *
 * ── LE PRINCIPE DE RATIONNEMENT ─────────────────────────────────────────────
 * AU MAXIMUM UNE SURPRISE PAR RUN — ça, c'est intouchable. « Si plusieurs se
 * déclenchent dans la même partie, elles cessent d'être des surprises et
 * deviennent le mode bizarre du jeu. »
 *
 * ⚠️ AMENDEMENT DU 31/08 (décision Patrick) : le DÉLAI DE RÉCUPÉRATION entre
 * runs, lui, ne vaut plus pour les PREMIÈRES VIES. Le rationnement d'origine
 * rendait le début du jeu le plus pauvre de tous — mesuré : la vie 1 n'armait
 * JAMAIS rien (toutes les entrées éligibles exigeaient `runsStarted >= 2` ou
 * `deaths >= 1`), et la vie 2 avait encore une chance sur trois de ne rien
 * avoir. Or c'est exactement là qu'il faut surprendre : un joueur qui découvre
 * n'a pas encore de norme à casser, il s'en fabrique une.
 * Les quatre premières vies suivent donc un LOT DE DÉCOUVERTE ordonné (ci-
 * dessous) ; à partir de la cinquième, le tirage rare d'origine reprend, délai
 * de récupération compris. Le plafond de 1/run n'est levé à aucun moment.
 *
 * Deux moments distincts, et c'est ce qui rend le rationnement simple :
 *  - l'ARMEMENT (une fois par run, au premier pas) choisit au plus UNE
 *    surprise éligible et la range dans `run.surprise` ;
 *  - le DÉCLENCHEMENT attend le contexte de la surprise armée (un campement
 *    pour le vol, une liaison pour le fantôme…). S'il n'arrive jamais, la
 *    surprise est perdue — c'est voulu, on n'insiste pas.
 *
 * Deux cas vivent HORS armement, par nature :
 *  - le Geôlier MÉTALEPTIQUE (déclenché par le comportement : fermer l'app en
 *    plein combat) — il respecte quand même le plafond de 1/run ;
 *  - le Grand Témoin qui RÉCITE tes choix (unique, 3e apparition) — c'est le
 *    paiement du journal citable, pas une surprise tirée.
 *
 * NON IMPLÉMENTÉS, par décision de la page elle-même : le 4e choix fantôme
 * (« à conserver pour une zone ultérieure ») et la run qui commence au
 * mauvais endroit (se branche sur les ouvertures alternatives, pas écrites —
 * et sa dernière variante EST le twist).
 */

import type { PlayerMemory } from "./player-memory";
import type { RunState } from "./state";

export type SurpriseId =
  | "choix-expire"
  | "retour"
  | "prophetie"
  | "fantome"
  | "citation"
  | "vol-nocturne"
  | "de-impossible";

/** Fiche courte, exportée pour le Studio (◇ Systèmes). */
export const SURPRISES: Record<SurpriseId, { nom: string; contexte: string; garde: string }> = {
  "choix-expire": {
    nom: "Le choix qui expire",
    contexte: "Une option s'érode et disparaît si le joueur hésite trop longtemps.",
    garde:
      "Toujours une OPPORTUNITÉ (un examen, un gain), jamais l'option sûre — " +
      "perdre le temps coûte une occasion, jamais la vie. Neutralisé par " +
      "l'option d'accessibilité « chronomètres désactivés ».",
  },
  retour: {
    nom: "Le retour",
    contexte: "Recroiser le lieu de mort du héros précédent : la trace exacte.",
    garde: "Ne se joue qu'au lieu réel de la dernière mort, une fois.",
  },
  prophetie: {
    nom: "La prophétie datée",
    contexte: "Le Geôlier parie un jour de mort ; la puce JOUR blanchit à l'approche.",
    garde:
      "Jamais énoncée comme un fait — un pari statistique (« Sur cent qui te " +
      "ressemblent… ») : vraie ou fausse, elle fait son travail.",
  },
  fantome: {
    nom: "Le fantôme de passage",
    contexte: "La silhouette d'un héros du Grand Registre traverse une liaison.",
    garde: "Généré depuis les noms du Registre — indistinguable, zéro infrastructure.",
  },
  citation: {
    nom: "Le PNJ qui te cite",
    contexte: "Un inconnu répète mot pour mot un choix fait dix scènes plus tôt.",
    garde: "Ne pioche que dans les choix tagués `citable` — jamais un texte qui sonne faux hors contexte.",
  },
  "vol-nocturne": {
    nom: "Le vol nocturne",
    contexte: "Au réveil du campement, un objet manque — remplacé par un autre, traçable.",
    garde: "L'objet substitué porte la trace du voleur ; l'objet volé est retenu pour un paiement futur.",
  },
  "de-impossible": {
    nom: "Le dé impossible",
    contexte: "Le dé s'arrête sur une face sans chiffre. Le Geôlier réagit immédiatement.",
    garde:
      "AUCUNE conséquence mécanique (le jet réel s'applique) — un résultat " +
      "impossible qui tue serait une tricherie, pas un mystère. La réaction " +
      "du Geôlier est obligatoire, sinon le joueur croit à un bug.",
  },
};

/**
 * LE LOT DE DÉCOUVERTE (31/08) — ce qu'un joueur neuf rencontre, dans l'ordre.
 *
 * Patrick a nommé les trois qu'il veut voir tôt : le retour, le Geôlier
 * métaleptique, le vol nocturne. Deux d'entre elles s'arment ici ; la
 * troisième ne peut pas — le MÉTALEPTIQUE est comportemental (il se déclenche
 * quand on ferme l'app en plein combat et qu'on revient), donc il ne se
 * programme pas, il se DÉBLOQUE (voir Scene.tsx : une run « aucune » le
 * bloquait, c'est corrigé).
 *
 * L'ordre suit ce que la vie PEUT porter, pas une préférence :
 *  - vie 1 → le vol nocturne. Aucun prérequis de compte, et le campement est
 *    sur la route de presque toutes les traversées. C'est aussi la meilleure
 *    première : elle ne punit pas, elle intrigue.
 *  - vie 2 → le retour, s'il y a un lieu de mort à revoir. Un survivant n'en a
 *    pas : on lui redonne alors le vol, qu'il a peut-être manqué.
 *  - vie 3 → le choix qui expire (il suppose de savoir ce qu'est une option).
 *  - vie 4 → la citation (le journal citable a eu le temps de se remplir).
 */
function lotDecouverte(mem: PlayerMemory): SurpriseId | null {
  switch (mem.runsStarted) {
    // Vie 1 = LA TRAVERSÉE GUIDÉE (2/09) : la route scriptée ne passe par
    // aucun campement, donc le vol nocturne n'aurait jamais eu son contexte
    // et la première vie serait restée sans surprise. Le choix qui expire,
    // lui, tombe dès le Chemin Creux (la charrette) — et c'est le seul qui
    // montre le temps qui presse, ce que la première run doit faire voir.
    case 1: return "choix-expire";
    case 2: return "vol-nocturne";
    case 3: return mem.lastDeath?.lieu ? "retour" : "vol-nocturne";
    case 4: return "citation";
    default: return null;
  }
}

/**
 * ARMEMENT — appelé une fois par run, au premier pas. Rend `null` une bonne
 * partie du temps PASSÉ LE LOT DE DÉCOUVERTE : une surprise qui tombe à chaque
 * run n'en est plus une.
 */
export function armerSurprise(mem: PlayerMemory, alea: number): SurpriseId | null {
  // Les premières vies sont scriptées : ni délai de récupération, ni tirage.
  const lot = lotDecouverte(mem);
  if (lot) return lot;
  // Délai de récupération : jamais deux runs de suite.
  const derniere = mem.surprises?.derniereRun;
  if (derniere !== undefined && mem.runsStarted - derniere <= 1) return null;
  // Une run sur trois environ reste sans surprise, même éligible.
  if (alea % 3 === 0) return null;

  const eligibles: SurpriseId[] = [];
  // Le choix qui expire : dès la 2e run (la 1re run apprend les règles —
  // on ne retire pas une option à quelqu'un qui découvre ce qu'est une option).
  if (mem.runsStarted >= 2) eligibles.push("choix-expire");
  // Le retour : il faut un mort ET son lieu enregistré.
  if (mem.lastDeath?.lieu) eligibles.push("retour");
  // La prophétie : un pari statistique demande des statistiques.
  if (mem.deaths >= 2) eligibles.push("prophetie");
  // Le fantôme : il faut des noms au Registre.
  if (mem.fallen.length >= 1) eligibles.push("fantome");
  // La citation : le journal se remplit en cours de run — armable dès la 2e.
  if (mem.runsStarted >= 2) eligibles.push("citation");
  // Le vol nocturne : plus aucun prérequis depuis le 31/08 — c'est lui qui
  // ouvre le lot de découverte, il ne peut pas être verrouillé au-delà.
  eligibles.push("vol-nocturne");
  // Le dé impossible : réservé à qui connaît déjà le dé normal.
  if (mem.deaths >= 1) eligibles.push("de-impossible");

  if (eligibles.length === 0) return null;
  return eligibles[Math.floor(alea / 3) % eligibles.length];
}

/** La surprise armée est-elle prête à se jouer ici ? */
export function surprisePrete(run: RunState | null | undefined, id: SurpriseId): boolean {
  return run?.surprise?.id === id && !run.surprise.jouee;
}

/* ────────────────────────────── LES TEXTES ──────────────────────────────── */

/** #2 Le retour — la trace du héros précédent, à son lieu de mort exact. */
export function texteRetour(nom: string): string[] {
  return [
    `Quelque chose accroche ton regard au pied du talus. Un creux dans la ` +
      `bruyère, en forme de personne — ancien, mais net : rien n'a repoussé ` +
      `dedans. À côté, une lanière de besace, coupée, grise de pluie.`,
    `Tu ne peux pas savoir qui est tombé là. Tu le sais quand même. ` +
      `${nom} n'est pas allé plus loin que cet endroit précis, et la lande ` +
      `a gardé la forme.`,
  ];
}

/** #4 La prophétie — un pari, jamais un fait. */
export function texteProphetie(jour: number): string {
  const lettres: Record<number, string> = {
    4: "quatrième", 5: "cinquième", 6: "sixième", 7: "septième",
    8: "huitième", 9: "neuvième", 10: "dixième",
  };
  // 2 lignes max dans le bandeau (retour Patrick 11/08) — même avec le plus
  // long ordinal (« quatrième »), la phrase tient en deux lignes de 37 col.
  return `Sur cent comme toi, la plupart tombent au ${lettres[jour] ?? "septième"} jour.`;
}

/** Le jour parié : autour de la médiane réelle des morts du compte. */
export function jourProphetie(mem: PlayerMemory, alea: number): number {
  const jours = mem.fallen.map((f) => f.days).filter((d) => d > 0).sort((a, b) => a - b);
  const mediane = jours.length ? jours[Math.floor(jours.length / 2)] : 7;
  return Math.max(4, Math.min(10, mediane + (alea % 3) - 1));
}

/** #6 Le fantôme de passage — un nom réel du Registre, rien d'autre. */
export function texteFantome(nom: string): string {
  return (
    `Sur la crête d'en face, quelqu'un marche. Même allure que toi, même ` +
    `direction, un peu en avance — puis le chemin tourne et il n'y a plus ` +
    `personne. Ça t'a laissé le temps de penser, sans aucune raison, à un ` +
    `nom : ${nom}.`
  );
}

/** #7 Le PNJ qui te cite — verbatim, dix scènes plus tard. */
export function texteCitation(phrase: string): string {
  return (
    `Un homme que tu n'as jamais vu te croise et ralentit. Il te regarde ` +
    `comme on vérifie une adresse, puis dit, mot pour mot : « ${phrase}. » ` +
    `Et il reprend sa route, satisfait, comme quelqu'un qui a fait la ` +
    `commission.`
  );
}

/** #8 Le vol nocturne — l'objet substitué, traçable. */
export function texteVol(vole: string, laisse: string): string[] {
  return [
    `Au réveil, ta besace n'a pas bougé. C'est en la refermant que tu le ` +
      `sens : le poids n'est pas le bon. ${vole} n'y est plus.`,
    `À la place, quelqu'un a laissé ${laisse.toLowerCase()} — posé avec ` +
      `soin, presque poliment. Un échange, pas un vol. Celui qui l'a fait ` +
      `voulait que tu saches qu'il ne se cachait pas.`,
  ];
}

/** L'objet laissé par le voleur (jamais ramassable ailleurs — traçable). */
export const OBJET_DU_VOLEUR = {
  name: "Dé d'os étranger",
  rarity: "rare" as const,
  kind: "babiole" as const,
  slot: "passif" as const,
  passiveMod: 0,
  passiveScope: "all" as const,
  illustration: "assets/objet_de_vingt_d_a.png",
  flavor:
    "Un dé taillé dans un os que tu préfères ne pas identifier. Ce n'est pas le tien. Celui qui te l'a laissé saura te reconnaître — il compte dessus.",
};

/** #3 Le Geôlier métaleptique — il a remarqué, et il ne fait rien. */
export const JAILER_METALEPTIQUE =
  "Parti. Pas en fuyant — PARTI. La bête n'a pas bougé. Moi non plus.";

/** #11 Le dé impossible — sa réaction immédiate, obligatoire. */
export const JAILER_DE_IMPOSSIBLE =
  "…Non. Ça n'est pas une face de mon dé. Je reprends. Tu n'as rien vu.";

/** #10 Le Grand Témoin récite tes choix — l'assemblage, jamais générique. */
export function texteTemoinRecite(phrases: string[]): string[] {
  const liste = phrases.slice(0, 3).map((p) => `« ${p}. »`).join(" ");
  return [
    `Et quelque chose parle — pas une voix : un compte-rendu. ${liste}`,
    `Tes propres mots, dans l'ordre où tu les as choisis. Il ne t'accuse ` +
      `pas. Il témoigne.`,
  ];
}
