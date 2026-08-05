/**
 * LES CONTRADICTIONS ENTRE RUNS — « Le Registre ment ».
 *
 * Retour du test 4/08 : « si le joueur a vu deux versions incompatibles d'un
 * même fait, le jeu pourrait le savoir et lui ouvrir une option. »
 *
 * Le Domaine ne rejoue jamais exactement la même histoire. Trois faits des
 * Landes ont plusieurs versions ; UNE seule est vraie dans une run donnée,
 * tirée par l'index de la run (déterministe — deux joueurs à la même run
 * voient la même chose, et une reprise ne change jamais la version).
 *
 * Le joueur ne peut donc PAS être surpris dans une seule vie : la
 * contradiction n'existe qu'en mémoire de compte, quand deux versions
 * incompatibles du même fait ont été LUES dans deux vies différentes. C'est le
 * seul système du jeu où mourir apprend quelque chose que vivre ne peut pas
 * apprendre.
 *
 * ⚠️ Règles d'écriture :
 *   • chaque version est écrite comme une VÉRITÉ, jamais comme une hypothèse
 *     (« on dit que » tuerait l'effet) ;
 *   • aucune version n'est « la bonne » — le Registre ment sur les trois ;
 *   • le fait porte sur le PASSÉ de la zone, jamais sur une règle de jeu ;
 *   • nommer la contradiction est réservé au joueur (l'option « Le Registre
 *     ment »), le jeu ne la souligne jamais de lui-même.
 */

import type { PlayerMemory } from "@/lib/player-memory";

export type Fait = {
  id: string;
  /** Ce sur quoi les versions divergent — jamais montré, sert au débogage. */
  sujet: string;
  /** Les versions, écrites au présent d'affirmation. */
  versions: { id: string; texte: string }[];
  /** Ce que le héros dit au tribunal quand il tient la contradiction. */
  accusation: string;
};

export const FAITS: Fait[] = [
  {
    id: "fait-bailli",
    sujet: "Qui a pendu le Bailli",
    versions: [
      {
        id: "lui-meme",
        texte:
          "Le Registre est net sur ce point : le Bailli a monté seul, a passé " +
          "seul le nœud, et personne n'a eu à le pousser. La dernière ligne est " +
          "de sa main.",
      },
      {
        id: "le-hameau",
        texte:
          "Le Registre est net sur ce point : le hameau l'a pris un soir de " +
          "comptage et l'a fixé au grand poteau. Douze croix signent la ligne — " +
          "une par famille.",
      },
      {
        id: "la-fille",
        texte:
          "Le Registre est net sur ce point : c'est la Fille qui a serré le " +
          "nœud, et le hameau a regardé. La ligne ne porte aucune signature, " +
          "seulement une entaille.",
      },
    ],
    accusation:
      "Ta main écrit qu'il s'est pendu seul. Une autre main, dans ce même " +
      "registre, écrit que douze croix ont signé sa mort. Les deux lignes sont " +
      "de la même encre.",
  },
  {
    id: "fait-fille",
    sujet: "La corde coupée de la Fille",
    versions: [
      {
        id: "coupee",
        texte:
          "Sa corde a été coupée net, à la lame, et on l'a descendue vivante. " +
          "Le brin sectionné est encore accroché à la traverse.",
      },
      {
        id: "rompue",
        texte:
          "Sa corde a rompu d'elle-même, usée, et on l'a ramassée au pied du " +
          "poteau. Les deux bouts sont effilochés, personne n'a touché à rien.",
      },
      {
        id: "jamais",
        texte:
          "Sa corde n'a jamais été nouée : on l'a fait monter, on a compté, et " +
          "on l'a fait redescendre. Elle est la seule à qui le Champ ait rendu " +
          "sa place.",
      },
    ],
    accusation:
      "On m'a montré sa corde coupée à la lame. On m'a montré la même corde " +
      "rompue d'usure. On m'a dit qu'elle n'avait jamais été nouée. Choisissez.",
  },
  {
    id: "fait-gibet",
    sujet: "Pour qui le grand gibet a été taillé",
    versions: [
      {
        id: "bailli",
        texte:
          "Le grand gibet a été taillé pour le Bailli, du temps où il jugeait " +
          "encore. La traverse est à sa mesure : on l'a préparée avant lui.",
      },
      {
        id: "etranger",
        texte:
          "Le grand gibet a été taillé pour un étranger, un seul, celui qui " +
          "viendrait du sud. Le hameau l'entretient depuis, et attend.",
      },
      {
        id: "personne",
        texte:
          "Le grand gibet n'a été taillé pour personne. Il était déjà là quand " +
          "le hameau s'est posé autour, et c'est le hameau qui a pris sa mesure " +
          "sur lui.",
      },
    ],
    accusation:
      "Vous entretenez un gibet dont vous ne savez plus s'il attend votre " +
      "Bailli, un étranger, ou rien du tout. Vous le graissez quand même.",
  },
];

const PAR_ID = new Map(FAITS.map((f) => [f.id, f]));

/**
 * La version VRAIE de ce fait dans cette run. Déterministe : la run garde sa
 * version d'un bout à l'autre, une reprise ne la change jamais. Les nombres
 * premiers évitent qu'un joueur voie les trois faits basculer ensemble.
 */
export function versionDuFait(faitId: string, runIndex: number): { id: string; texte: string } | null {
  const f = PAR_ID.get(faitId);
  if (!f) return null;
  const sel = [3, 5, 7][FAITS.indexOf(f) % 3] ?? 3;
  return f.versions[(runIndex * sel + FAITS.indexOf(f)) % f.versions.length];
}

export function faitById(faitId: string): Fait | null {
  return PAR_ID.get(faitId) ?? null;
}

/**
 * Les faits sur lesquels le compte a lu DEUX versions incompatibles. Une seule
 * version connue ne contredit rien : le joueur croit simplement savoir.
 */
export function contradictionsConnues(mem: PlayerMemory): Fait[] {
  const vus = mem.faitsVus ?? {};
  return FAITS.filter((f) => (vus[f.id] ?? []).length >= 2);
}
