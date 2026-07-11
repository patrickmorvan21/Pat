/**
 * Moteur de contenu — parcours infini.
 * Une réserve de scènes écrites à la main tourne en boucle ; le numéro de
 * chapitre, lui, croît sans fin (Aldenhar — III, IV, V…). La structure est
 * prête à être branchée sur une génération IA en temps 2.
 * Les stats restent cachées : jamais de chiffre affiché, seulement le tag.
 */

export type Stat = "COURAGE" | "RUSE" | "INSTINCT" | "EMPATHIE";

export type Outcome = {
  word: string;
  fail: boolean;
  text: string;
};

export type Outcomes = {
  critSuccess: Outcome;
  success: Outcome;
  fail: Outcome;
  critFail: Outcome;
};

export type Choice = {
  id: string;
  label: string;
  /** Choix risqué : toujours cliquable, jet de dé + stat en coulisse. */
  risky?: { stat: Stat; threshold: number; outcomes: Outcomes };
  /** Choix verrouillé : seuil de stat non atteint → grisé mais visible. */
  locked?: { stat: Stat };
};

export type Scene = {
  id: string;
  narration: string;
  choices: Choice[];
  jailerLine: string;
};

function outcomes(
  crit: string,
  success: string,
  fail: string,
  funeste: string
): Outcomes {
  return {
    critSuccess: { word: "DESTIN", fail: false, text: crit },
    success: { word: "RÉUSSITE", fail: false, text: success },
    fail: { word: "ÉCHEC", fail: true, text: fail },
    critFail: { word: "FUNESTE", fail: true, text: funeste },
  };
}

export const SCENES: Scene[] = [
  {
    id: "portes",
    narration:
      "Le couloir s'arrête net. Deux portes te font face. Celle de gauche est " +
      "balafrée de coups d'épée, son bois sombre fendu, sa serrure éventrée, " +
      "quelqu'un, ou quelque chose, s'y est acharné. Celle de droite est neuve, " +
      "taillée dans un bois blanc presque luisant, et porte une inscription " +
      "gravée que tu ne reconnais pas.",
    choices: [
      {
        id: "pousser",
        label: "Pousser la porte balafrée",
        risky: {
          stat: "COURAGE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. La porte cède sans un bruit — la créature dort. Tu passes comme une ombre.",
            "Ton épaule enfonce le battant. La chose derrière recule d'un pas — surprise. Tu as l'initiative.",
            "Le bois résiste. Le bruit te trahit. Dans l'obscurité, deux yeux s'ouvrent.",
            "1 naturel. La porte s'ouvre — de l'intérieur. ♦ −2"
          ),
        },
      },
      { id: "ecouter", label: "Écouter, immobile" },
      { id: "rebrousser", label: "Rebrousser chemin", locked: { stat: "EMPATHIE" } },
    ],
    jailerLine: "12,000 avant toi n'ont pas passé leur 7e jour ici...",
  },
  {
    id: "salle-ronde",
    narration:
      "Derrière, une salle ronde aux murs suintants. Au centre, un corps en " +
      "armure, effondré sur une dalle gravée. Sa main gantée serre encore " +
      "quelque chose. Une odeur de fer et de cire froide flotte, et quelque " +
      "part au-dessus, un frottement lent, régulier, comme une corde qu'on use.",
    choices: [
      {
        id: "fouiller",
        label: "Desserrer le poing du mort",
        risky: {
          stat: "RUSE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Le gant s'ouvre comme s'il t'attendait. Une clé d'os, tiède. Le frottement s'arrête.",
            "Les doigts cèdent un à un. Une clé d'os tombe dans ta paume. Là-haut, rien n'a bougé.",
            "Le poignet craque trop fort. Le frottement cesse net — quelque chose t'a entendu.",
            "1 naturel. La main morte se referme sur la tienne. ♦ −2"
          ),
        },
      },
      { id: "longer", label: "Longer le mur, sans toucher" },
      { id: "odeur", label: "Suivre l'odeur de fer", locked: { stat: "INSTINCT" } },
    ],
    jailerLine: "Celui-là a tenu 6 jours. Tu vois où mène la prudence.",
  },
  {
    id: "escalier",
    narration:
      "Un escalier en vis s'enfonce sous la dalle descellée. L'air qui en " +
      "monte est froid, chargé d'eau et d'autre chose — un souffle ample, " +
      "espacé, qui n'est pas un courant d'air. Ta torche se couche vers le " +
      "bas, comme aspirée. Les marches sont usées au centre, profondément.",
    choices: [
      {
        id: "descendre",
        label: "Descendre dans le noir",
        risky: {
          stat: "INSTINCT",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tes pieds trouvent chaque marche avant tes yeux. En bas, le souffle s'écarte pour te laisser passer.",
            "Tu descends au rythme du souffle, invisible dans son bruit. La dernière marche t'accueille sans un son.",
            "Une marche manque. Ton talon claque sur la pierre — en bas, le souffle se retient.",
            "1 naturel. La torche s'éteint à la neuvième marche. ♦ −2"
          ),
        },
      },
      { id: "marquer", label: "Marquer le mur, souffler" },
      { id: "eteindre", label: "Éteindre la torche d'abord", locked: { stat: "COURAGE" } },
    ],
    jailerLine: "4 312 mains ont hésité sur cette rampe. Je les ai comptées.",
  },
  {
    id: "pont-os",
    narration:
      "Une rivière souterraine barre le passage, noire et sans reflet. On l'a " +
      "enjambée d'un pont — pas de pierre : d'os, longs et jaunis, liés de " +
      "tendons secs. Sur l'autre rive, une lanterne verte pend à un crochet, " +
      "allumée. Personne pour la porter. Le pont grince avant même qu'on le touche.",
    choices: [
      {
        id: "traverser",
        label: "Traverser le pont d'os",
        risky: {
          stat: "COURAGE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Le pont se tait sous tes pas, par respect ou par peur. La lanterne verte s'incline quand tu passes.",
            "Tu traverses vite, léger, les yeux sur la rive. Derrière toi un fémur cède — trop tard pour t'atteindre.",
            "À mi-chemin, le tablier s'affaisse. Tu rattrapes le bord — l'eau noire t'a goûté la cheville.",
            "1 naturel. Le pont s'effondre en silence. L'eau ne fait aucun bruit non plus. ♦ −2"
          ),
        },
      },
      { id: "gue", label: "Chercher un gué en amont" },
      { id: "cranes", label: "Compter les crânes du parapet", locked: { stat: "RUSE" } },
    ],
    jailerLine: "Les os du pont ? D'anciens curieux. Comme toi.",
  },
  {
    id: "cage",
    narration:
      "Dans l'alcôve suivante, une cage pend à hauteur d'homme. Dedans, une " +
      "silhouette maigre, genoux au menton, qui respire. Elle lève la tête à " +
      "ta lumière : des yeux humains, une bouche cousue de fil noir. Elle pose " +
      "deux doigts sur les barreaux, doucement, et attend.",
    choices: [
      {
        id: "ouvrir",
        label: "Ouvrir la cage",
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Le fil noir tombe de lui-même. « Merci », dit une voix rouillée. Elle te donne son nom — il pèse comme une clé.",
            "La serrure cède. La silhouette descend, s'incline, et disparaît dans ton ombre — tu la sens veiller.",
            "La cage s'ouvre trop vite. La silhouette hurle sans bouche et fuit — quelque chose accourt.",
            "1 naturel. Ce n'était pas elle, la prisonnière. C'était la cage. ♦ −2"
          ),
        },
      },
      { id: "passer", label: "Passer sans un mot" },
      { id: "interroger", label: "Interroger la chose cousue", locked: { stat: "COURAGE" } },
    ],
    jailerLine: "Elle m'a supplié aussi, jadis. J'ai un registre.",
  },
  {
    id: "echo",
    narration:
      "La galerie s'élargit en un hall poli comme un miroir noir. Chaque pas y " +
      "revient double. Puis ta propre voix te devance : « Qui va là ? » demande-" +
      "t-elle avec ta bouche, trois pas devant. L'écho attend une réponse. Il " +
      "n'a pas ton accent — pas tout à fait.",
    choices: [
      {
        id: "mentir",
        label: "Mentir à l'écho",
        risky: {
          stat: "RUSE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu donnes un faux nom si parfait que l'écho le garde. Quelque part, un autre que toi est désormais attendu.",
            "« Personne », réponds-tu. L'écho répète « Personne » et te laisse passer, faute de proie.",
            "Ta voix tremble sur la dernière syllabe. L'écho sourit — ça s'entend — et retient ton vrai nom.",
            "1 naturel. L'écho répond avant toi, avec ta voix exacte. Lequel de vous deux a menti ? ♦ −2"
          ),
        },
      },
      { id: "taire", label: "Se taire et avancer" },
      { id: "repondre", label: "Répondre à la voix", locked: { stat: "EMPATHIE" } },
    ],
    jailerLine: "L'écho ment mieux que toi. 9 fois sur 10, très exactement.",
  },
  {
    id: "table",
    narration:
      "Une table de banquet dressée pour personne. Nappes grises de poussière, " +
      "chandelles éteintes — sauf une. Dans son halo, un seul objet : un anneau " +
      "de fer torsadé, encore tiède, posé sur un coussin de velours élimé. " +
      "Quelque chose sous la table respire lentement contre tes chevilles.",
    choices: [
      {
        id: "prendre",
        label: "Prendre l'anneau tiède",
        risky: {
          stat: "INSTINCT",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Ta main saisit l'anneau à l'instant exact où la chose cligne. Il t'accepte — le fer épouse ton doigt.",
            "Tu cueilles l'anneau sans frôler la nappe. Sous la table, la respiration continue, égale. Il est à toi.",
            "Le velours glisse. La chandelle vacille. Sous la table, la respiration s'arrête — et se rapproche.",
            "1 naturel. L'anneau était un appât. La table n'était pas une table. ♦ −2"
          ),
        },
      },
      { id: "reculer", label: "Reculer sans tourner le dos" },
      { id: "echanger", label: "Déposer ta dague en échange", locked: { stat: "RUSE" } },
    ],
    jailerLine: "Cet anneau a connu 3 propriétaires. Tous brefs.",
  },
  {
    id: "porte-7e",
    narration:
      "Au bout, une porte sans gonds ni serrure, taillée dans une seule dent " +
      "immense. Dessus, gravé à hauteur de tes yeux exactement : « FRAPPE TROIS " +
      "FOIS SI TU CROIS ÊTRE ATTENDU ». De l'autre côté, quelque chose compte à " +
      "voix basse. Il en est à sept mille et des poussières.",
    choices: [
      {
        id: "frapper",
        label: "Frapper les trois coups",
        risky: {
          stat: "COURAGE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Au troisième coup, le décompte s'arrête. « Enfin », dit la porte. Elle s'ouvre sur un couloir qui n'existait pas.",
            "Trois coups fermes. Le décompte marque une pause, reprend un chiffre plus loin — la dent pivote pour toi.",
            "Ton deuxième coup sonne creux, faux. Le décompte recommence à zéro. À voix haute, cette fois.",
            "1 naturel. Tu frappes quatre fois. Le silence qui suit a des dents. ♦ −2"
          ),
        },
      },
      { id: "attendre", label: "Attendre la fin du décompte" },
      { id: "battement", label: "Coller l'oreille à la dent", locked: { stat: "INSTINCT" } },
    ],
    jailerLine: "Frappe. Le 7e jour aime les ponctuels.",
  },
];

/** Chapitre de départ (la démo commence à Aldenhar — III). */
export const CHAPTER_START = 3;

/** Numéral romain pour une progression de chapitre sans fin. */
export function romanNumeral(n: number): string {
  const table: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of table) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}

/** Scène pour un index de progression quelconque (la réserve boucle). */
export function sceneAt(step: number): Scene {
  return SCENES[((step % SCENES.length) + SCENES.length) % SCENES.length];
}

export function chapterLabel(step: number): string {
  return `Aldenhar — ${romanNumeral(CHAPTER_START + step)}`;
}
