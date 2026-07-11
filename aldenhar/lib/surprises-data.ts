/**
 * Éléments de surprise validés (Notion, 11/07/2026) — 4 fondatrices déjà
 * actées en spec §16 + 7 nouvelles validations. Règle : 1–2 surprises par
 * run maximum, occasionnelles, jamais les mêmes deux runs de suite.
 */

export type SurprisePreviewKind = "erosion-choice" | "erosion-death" | "day-threat" | "ghost-choice" | "ash-rain" | "text-mock";

export type SurpriseEntry = {
  id: string;
  number: number;
  title: string;
  founding: boolean;
  onceOnly?: boolean;
  description: string;
  previewKind: SurprisePreviewKind;
  mockLines?: string[];
};

export const SURPRISES: SurpriseEntry[] = [
  {
    id: "choix-expire",
    number: 1,
    title: "Le choix qui expire",
    founding: true,
    description: "Une option s'érode et disparaît si on hésite trop longtemps. Max 1×/run.",
    previewKind: "erosion-choice",
  },
  {
    id: "le-retour",
    number: 2,
    title: "Le retour",
    founding: true,
    description: "Recroiser le lieu de mort de son héros précédent (cadavre, équipement).",
    previewKind: "text-mock",
    mockLines: [
      "— Jour 4 —",
      "Une silhouette recroquevillée contre le mur. Son armure, tu la reconnais : c'était la tienne, une vie plus tôt.",
      "Sa main serre encore une besace. Personne n'est venu la lui prendre.",
    ],
  },
  {
    id: "geolier-metaleptique",
    number: 3,
    title: "Le Geôlier métaleptique",
    founding: true,
    description:
      "Fermer l'app en plein combat et revenir : le Geôlier vous accueille. Aucune sanction — le pilier permadeath fictionnel reste intouchable.",
    previewKind: "text-mock",
    mockLines: ["« Tu pensais m'échapper ? »", "Rien n'a changé. Le combat continue, exactement où tu l'as laissé."],
  },
  {
    id: "fausse-mort",
    number: 4,
    title: "Fausse mort",
    founding: true,
    onceOnly: true,
    description: "L'écran s'érode complètement… puis une inspiration. Une seule fois par joueur, jamais deux.",
    previewKind: "erosion-death",
  },
  {
    id: "prophetie-datee",
    number: 5,
    title: "La prophétie datée",
    founding: false,
    description:
      "Le Geôlier annonce : « Tu mourras au Jour VII. » Vraie ou fausse, le compteur de jours devient une menace — la puce « JOUR X » passe en brique à l'approche.",
    previewKind: "day-threat",
  },
  {
    id: "quatrieme-choix-fantome",
    number: 6,
    title: "Le quatrième choix fantôme",
    founding: false,
    description:
      "Un 4ᵉ choix apparaît une seconde, écrit en brique, puis s'efface (érosion rapide). Aucune explication. Graine narrative de la piste Prisonnier (v2) — ne jamais l'expliquer en v1.",
    previewKind: "ghost-choice",
  },
  {
    id: "fantome-passage",
    number: 7,
    title: "Le fantôme de passage",
    founding: false,
    description:
      "La silhouette d'un héros d'un autre joueur réel traverse la scène sans interagir. Nécessite un endpoint de runs actives anonymisées ; fallback offline : héros généré.",
    previewKind: "text-mock",
    mockLines: [
      "Une silhouette tramée traverse le fond du couloir, indifférente à ta présence. « Aldric — Jour XII » s'efface avec elle.",
      "« Lui, il en est au Jour XII. Toi ? »",
    ],
  },
  {
    id: "marchand-mort",
    number: 8,
    title: "Le marchand mort",
    founding: false,
    description:
      "L'échoppe est là, les prix affichés, le marchand est froid depuis des jours. On peut se servir. Le jeu retient qu'on l'a fait (flag narratif réutilisable).",
    previewKind: "text-mock",
    mockLines: [
      "L'échoppe est ouverte, les prix encore gravés sur de petites ardoises. Le marchand, lui, est assis contre son étal — froid depuis longtemps.",
      "Rien ne t'empêche de te servir.",
    ],
  },
  {
    id: "pnj-qui-cite",
    number: 9,
    title: "Le PNJ qui te cite",
    founding: false,
    description:
      "Un inconnu répète mot pour mot une phrase-choix faite par le joueur ~10 scènes plus tôt — le narrateur pioche dans l'historique réel des choix de la run.",
    previewKind: "text-mock",
    mockLines: [
      "L'inconnu penche la tête. « Écouter, immobile », dit-il, exactement comme tu l'as fait au corridor. Il n'était pourtant pas là.",
    ],
  },
  {
    id: "vol-nocturne",
    number: 10,
    title: "Le vol nocturne",
    founding: false,
    description:
      "Au réveil au camp, un objet de la Besace manque — remplacé par un objet jamais ramassé. L'objet substitué porte un tag narratif.",
    previewKind: "text-mock",
    mockLines: [
      "— Jour 5 —",
      "Ta besace est plus légère. À la place de la clé d'os, un objet que tu n'as jamais ramassé — un dé, usé, qui n'est pas le tien.",
    ],
  },
  {
    id: "pluie-cendres",
    number: 11,
    title: "La pluie de cendres",
    founding: false,
    description:
      "Des pixels s'accumulent lentement sur l'écran jusqu'à gêner la lecture ; il faut frotter pour dégager. Réutilise le moteur du mini-jeu Frotter comme événement d'ambiance.",
    previewKind: "ash-rain",
  },
];
