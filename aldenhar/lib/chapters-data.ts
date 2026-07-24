/**
 * Chapitres garantis (chantier n°2 du 23/07) — règle « je ne ressens pas
 * l'histoire ». Chaque traversée reçoit UN chapitre tiré parmi les 4 écrits,
 * en 3 beats insérés à des moments FIXES :
 *   • amorce       → la première liaison de la traversée ;
 *   • développement→ un LIEU dédié, garanti dans les choix d'orientation tant
 *                    que le chapitre est actif ;
 *   • résolution   → partielle, insérée avant la sortie de zone (la Descente).
 * Le pool de lieux ne fournit plus que le remplissage variable entre ces beats.
 *
 * Les 4 chapitres racontent chacun un angle de l'histoire du Bailli (fiche
 * Domaine ◆) : chacun LAISSE UNE QUESTION que les autres éclairent — le joueur
 * recolle l'histoire sur 3-4 runs. La rotation évite de retomber sur un
 * chapitre déjà vécu tant qu'il en reste des neufs (mémoire du compte).
 *
 * ⚠️ « Le Procès » existe aussi dans un document de démonstration côté Patrick
 * (non accessible depuis cette session) — texte à réconcilier s'il le fournit.
 */

export type Chapter = {
  id: string;
  /** Lieu (id de scène du pool de traversée) où se joue le développement. */
  lieuId: string;
  /** Beats d'amorce — ajoutés à la narration de la première liaison. */
  amorce: string[];
  /** Beats de développement — ajoutés à l'arrivée dans le lieu dédié. */
  developpement: string[];
  /** Résolution partielle — insérée avant la narration de la Descente. */
  resolution: string[];
};

export const LANDES_CHAPTERS: Chapter[] = [
  {
    // L'angle : comment on jugeait ici. Question laissée : qui a jugé le juge ?
    id: "le-proces",
    lieuId: "petit-tribunal",
    amorce: [
      "Sur un muret, quelqu'un a gravé une phrase, puis l'a barrée : « Ici, tout passe en jugement. » La barre est plus récente que les mots — comme si l'auteur avait compris trop tard que ce n'était pas une menace, mais une procédure.",
    ],
    developpement: [
      "C'est donc ici que ça se décidait. Trois bancs pour le hameau, une chaire pour un seul homme. Le Bailli écoutait, disait la sentence — toujours la même — et la corde faisait le reste.",
      "Sur le bois de la chaire, des entailles fines : une par jugement, alignées comme des jours. La dernière est plus profonde que les autres. Tremblée. Celle-là, il ne voulait pas la compter.",
    ],
    resolution: [
      "En quittant les Landes, la question marche avec toi : chaque pendu de la colline a eu son procès, ses trois bancs, sa sentence dite à voix haute. Tous — sauf le juge. Qui a jugé le Bailli ? Et pourquoi sa dernière entaille tremble-t-elle ?",
    ],
  },
  {
    // L'angle : la comptabilité des morts. Question laissée : la ligne sans nom.
    id: "le-registre",
    lieuId: "champ-des-fixes",
    amorce: [
      "Un vieux, assis contre un muret, gratte une planchette sans te regarder. « Tout le monde a sa ligne, ici », dit-il. « Nom, motif, jours. Même toi — surtout toi. Elle est déjà ouverte. »",
    ],
    developpement: [
      "Le champ entier est un registre debout. Chaque poteau son pendu, chaque pendu son écriteau : un nom, un motif, un nombre de jours. Une écriture de greffe, appliquée, sans colère.",
      "Un seul écriteau détonne : le motif a été gratté au couteau, si fort que le bois est entaillé. Le nom reste, le nombre de jours reste. Ce qu'elle avait fait, quelqu'un n'a pas supporté qu'on le lise.",
    ],
    resolution: [
      "Tu emportes des Landes une image : cet écriteau au motif gratté, illisible pour toujours. Qui a gratté ? La main qui a écrit — ou une main qui aimait la pendue ? Le registre, lui, n'oublie rien. Il attend juste la prochaine ligne.",
    ],
  },
  {
    // L'angle : celle qui s'est relevée. Question laissée : qui a coupé la corde ?
    id: "la-fille",
    lieuId: "campement",
    amorce: [
      "Une femme au seuil d'une maison basse te suit des yeux, puis se signe à l'envers. « Si tu dors au moulin », dit-elle sans que tu aies rien demandé, « laisse le lit de bruyère comme tu l'as trouvé. Il sert encore. »",
    ],
    developpement: [
      "Le lit de bruyère du moulin est tassé, refait de frais. Quelqu'un dort ici — souvent, prudemment, sans feu. Sur la pierre du mur, à hauteur d'enfant, des marques : des jours comptés par paquets de cinq, sur des années.",
      "Et dans un creux du mur, serré dans un chiffon : un bout de corde. Coupé net. Pas usé, pas rompu — coupé. On ne garde pas ça par hasard. On garde ça comme une preuve, ou comme un pardon.",
    ],
    resolution: [
      "En sortant des Landes, tu sais une chose que le hameau tait : une pendue s'est relevée, et elle marche encore. La corde n'a pas cédé — on l'a coupée. Reste à savoir qui tenait la lame. Et pourquoi le Bailli n'a jamais fait repentre sa fille.",
    ],
  },
  {
    // L'angle : le gibet démesuré. Question laissée : pour qui — et pourquoi vide ?
    id: "le-gibet-vide",
    lieuId: "colline-aux-gibets",
    amorce: [
      "À l'horizon, la colline porte sa couronne de potences. L'une dépasse toutes les autres — de beaucoup trop. Aucun homme n'a jamais eu cette taille. Et c'est la seule dont la corde pend, vide.",
    ],
    developpement: [
      "De près, le grand gibet est pire : taillé large, chevillé double, dimensionné pour un cou qui n'est pas un cou d'homme. Celui qui l'a bâti savait exactement quelle taille il visait.",
      "Sa corde est usée en son milieu — pas au nœud, au MILIEU. Comme si quelque chose l'avait éprouvée de l'intérieur, longtemps, sans jamais s'y laisser prendre. Juste à côté, un gibet bas, à hauteur d'homme. Occupé, lui.",
    ],
    resolution: [
      "Tu quittes les Landes avec cette mesure en tête : un gibet taillé pour quelque chose de plus grand qu'un homme, dressé par un homme qui s'est pendu à côté, à sa propre hauteur. Il visait qui, le Bailli — et pourquoi la corde du grand gibet est-elle usée si personne n'y a jamais pendu ?",
    ],
  },
];

/**
 * Tire le chapitre d'une traversée : au hasard parmi ceux que le compte n'a
 * pas encore vécus ; quand tous ont été vus, la rotation repart complète.
 */
export function drawChapter(seen: string[]): Chapter {
  const fresh = LANDES_CHAPTERS.filter((c) => !seen.includes(c.id));
  const pool = fresh.length > 0 ? fresh : LANDES_CHAPTERS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function chapterById(id: string): Chapter | null {
  return LANDES_CHAPTERS.find((c) => c.id === id) ?? null;
}
