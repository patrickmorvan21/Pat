/**
 * Contenu de la scène — Aldenhar III (frame Figma 1903:358).
 * Les stats sont cachées : jamais de chiffre affiché, seulement le tag en brique.
 */

export type Stat = "COURAGE" | "RUSE" | "INSTINCT" | "EMPATHIE";

export type Choice = {
  id: string;
  label: string;
  /** Choix risqué : toujours cliquable, jet de dé + stat en coulisse. */
  risky?: { stat: Stat; threshold: number };
  /** Choix verrouillé : seuil de stat non atteint → grisé mais visible. */
  locked?: { stat: Stat };
};

export type Outcome = {
  word: string;
  fail: boolean;
  text: string;
};

export type Scene = {
  id: string;
  chapter: string;
  narration: string;
  choices: Choice[];
  jailerLine: string;
  /** Verdicts du jet lié au choix risqué (repris de la référence validée). */
  outcomes: {
    critSuccess: Outcome;
    success: Outcome;
    fail: Outcome;
    critFail: Outcome;
  };
};

export const SCENE_ALDENHAR_III: Scene = {
  id: "aldenhar-3",
  chapter: "Aldenhar — III",
  narration:
    "Le couloir s'arrête net. Deux portes te font face. Celle de gauche est " +
    "balafrée de coups d'épée, son bois sombre fendu, sa serrure éventrée, " +
    "quelqu'un, ou quelque chose, s'y est acharné. Celle de droite est neuve, " +
    "taillée dans un bois blanc presque luisant, et porte une inscription " +
    "gravée que tu ne reconnais pas.",
  choices: [
    {
      id: "push-door",
      label: "Pousser la porte balafrée",
      risky: { stat: "COURAGE", threshold: 12 },
    },
    { id: "listen", label: "Écouter, immobile" },
    {
      id: "turn-back",
      label: "Rebrousser chemin",
      locked: { stat: "EMPATHIE" },
    },
  ],
  jailerLine: "12,000 avant toi n'ont pas passé leur 7e jour ici...",
  outcomes: {
    critSuccess: {
      word: "DESTIN",
      fail: false,
      text: "20 naturel. La porte cède sans un bruit — la créature dort. Tu passes comme une ombre.",
    },
    success: {
      word: "RÉUSSITE",
      fail: false,
      text: "Ton épaule enfonce le battant. La chose derrière recule d'un pas — surprise. Tu as l'initiative.",
    },
    fail: {
      word: "ÉCHEC",
      fail: true,
      text: "Le bois résiste. Le bruit te trahit. Dans l'obscurité, deux yeux s'ouvrent.",
    },
    critFail: {
      word: "FUNESTE",
      fail: true,
      text: "1 naturel. La porte s'ouvre — de l'intérieur. ♦ −2",
    },
  },
};
