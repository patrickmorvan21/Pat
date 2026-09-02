/**
 * Catalogue des mini-jeux tactiles — 4 références validées + 21 additionnels
 * (Notion « Mini-jeux & Surprises — catalogue pour Claude Code », 11/07/2026).
 * Règles générales du catalogue : fréquence occasionnelle, le geste est
 * l'habillage (la stat module la difficulté, jamais du pur skill), aucun
 * feedback critique par le son, DA tramée/bruitée obligatoire, échec =
 * conséquence narrative jamais un game over sec.
 */

import { assetSrc } from "./assets";

export type Tier = "bas" | "moyen" | "haut";
export type MiniGameEngine =
  | "rub"
  | "glyph"
  | "hold"
  | "timing"
  | "dial"
  | "rhythm"
  | "pick"
  | "slowSwipe"
  | "sequence"
  | "straightSwipe"
  | "caress"
  | "singleGesture";

export type MiniGameEntry = {
  id: string;
  /** Numéro du catalogue (0 = une des 4 références). */
  number: number;
  title: string;
  category: "Ruse" | "Courage" | "Instinct" | "Empathie" | "Mixte" | "Référence";
  stat: "COURAGE" | "RUSE" | "INSTINCT" | "EMPATHIE" | "MIXTE";
  description: string;
  engine: MiniGameEngine;
  configFor: (tier: Tier) => Record<string, unknown>;
  successText: string;
  failText: string;
  /** Où le geste se joue dans le jeu (affiché sous le titre). */
  lieu?: string;
  /** Ce qui reste à faire pour qu'il soit fini (habillage, image…). */
  note?: string;
};

/**
 * TRI DE LA GALERIE (demande Patrick, 01/09) : d'abord ce qui est VALIDÉ ET
 * EN JEU avec la configuration réelle servie par `Scene.tsx` (mêmes chiffres,
 * mêmes skins — on revoit ce que le joueur touche, pas une approximation),
 * puis ce qui est validé mais encore à habiller, puis les autres essais.
 *
 * ⚠️ Les configs ci-dessous DOUBLENT celles de `Scene.tsx` (onSelect) : si
 * l'une change, changer l'autre — la galerie ne sert à rien si elle montre un
 * réglage que le jeu ne sert pas.
 */
export const JEU_GAMES: MiniGameEntry[] = [
  {
    id: "jeu-frottage-borne",
    number: 0,
    title: "Frotter la mousse de la Borne",
    category: "Référence",
    stat: "MIXTE",
    lieu: "La Borne Frontière — « Faire le tour de la pierre » (démo et jeu complet, une fois par compte)",
    description:
      "Gratter la mousse de Patrick (maquette Figma) jusqu'au seuil ; passé le seuil toute la mousse s'envole par vagues et la pierre aux trois marques se lit. Aucun échec possible : c'est le tutoriel tactile.",
    engine: "rub",
    configFor: () => ({
      label: "CÔTÉ SUD",
      threshold: 0.45,
      preEclaircie: 0.12,
      imageFond: assetSrc("assets/minijeu_borne_pierre.png"),
      imageMousse: assetSrc("assets/minijeu_borne_mousse.png"),
    }),
    successText: "Les trois marques du sud apparaissent sous la mousse.",
    failText: "",
  },
  {
    id: "jeu-crochetage",
    number: 0,
    title: "Crochetage — la serrure d'une maison",
    category: "Référence",
    stat: "RUSE",
    lieu: "La nuit au Hameau (démo) et la Maison sans Fumée (jeu complet)",
    description:
      "Trois goupilles à faire céder : tape quand le crochet est dans la gorge. La Ruse élargit la gorge ; trois ratés en tout et le pêne claque. Les étapes se lisent en bas, en carrés — jamais un chiffre.",
    engine: "timing",
    configFor: (tier) => ({
      mode: "track",
      windowWidth: tier === "haut" ? 0.26 : tier === "moyen" ? 0.21 : 0.17,
      maxAttempts: 3,
      goupilles: 3,
    }),
    successText: "Le pêne glisse sans un bruit. La porte s'ouvre sur un noir tiède.",
    failText: "Le crochet ripe et le pêne claque, fort. En face, un volet s'entrouvre.",
  },
  {
    id: "jeu-corde-pendu",
    number: 0,
    title: "Trancher la corde du Pendu",
    category: "Référence",
    stat: "COURAGE",
    lieu: "Le Pendu qui parle — « Trancher sa corde » (jeu complet)",
    description:
      "Un seul geste, net et rapide, qui TRAVERSE la corde. Le Courage élargit la tolérance de courbure — la main qui ne tremble pas, pas la lame qui coupe mieux. Rater entame la corde… et le corps.",
    engine: "straightSwipe",
    configFor: (tier) => ({
      minLength: 90,
      maxDurationMs: 500,
      maxDeviation: tier === "haut" ? 34 : tier === "moyen" ? 22 : 14,
      skin: "corde",
      imageCorde: assetSrc("assets/minijeu_corde_tile_b.png"),
    }),
    successText: "Ta lame tranche net.",
    failText: "Ta lame entame la corde — qui se resserre.",
  },
  {
    id: "jeu-falaise",
    number: 0,
    title: "Laisser filer la corde — la Falaise",
    category: "Référence",
    stat: "MIXTE",
    lieu: "La Falaise aux Cordes — la cérémonie de la Descente (démo)",
    description:
      "Glisser vers le bas, lentement, cinq paliers. Insensible à l'échec : trop vite, la corde ne file pas, la paume chauffe, et on reprend. Jamais un test d'adresse devant la Descente.",
    engine: "slowSwipe",
    configFor: () => ({
      pagesNeeded: 5,
      maxSpeed: 9,
      label: "paliers",
      axis: "y",
      skin: "corde",
      step: 30,
      forgiving: true,
      imageCorde: assetSrc("assets/minijeu_corde_tile_b.png"),
    }),
    successText: "La corde s'arrête. En bas, quelqu'un saura qu'on peut descendre plus loin.",
    failText: "",
  },
  {
    id: "jeu-trace-chapelle",
    number: 0,
    title: "Le tracé du tressage — la Chapelle",
    category: "Référence",
    stat: "RUSE",
    lieu: "La Chapelle des Cordes — « Prendre la corde coupée » (démo)",
    description:
      "Suivre du doigt le nœud de la Veuve, point après point, sans lâcher ni s'écarter trop longtemps — sur la pierre de la Chapelle, les points ciselés dedans. La Ruse simplifie le nœud. Rater ne perd pas la corde : la vitrine sonne sur la dalle et la Veuve t'a vu.",
    engine: "glyph",
    configFor: (tier) => ({
      points: tier === "haut" ? 5 : tier === "moyen" ? 6 : 7,
      tolerance: tier === "haut" ? 26 : tier === "moyen" ? 22 : 19,
      skin: "pierre",
      imageFond: assetSrc("assets/minijeu_chapelle_pierre_b.png"),
    }),
    successText: "Le verre pivote sans bruit. La corde coupée s'enroule à ton poignet.",
    failText: "Ton doigt perd le fil — la vitrine se décroche et sonne sur la dalle.",
  },
];

/** Validés dans le jeu, mais leur habillage réaliste n'est pas fait. */
export const A_HABILLER_GAMES: MiniGameEntry[] = [
  {
    id: "jeu-souffle-bete",
    number: 0,
    title: "Retenir son souffle — la Bête",
    category: "Référence",
    stat: "INSTINCT",
    lieu: "La Bête des Chemins Creux — « Se plaquer, immobile »",
    note: "MIS EN ATTENTE le 01/09 : la scène se joue au timer de 4 s tant que l'habillage n'existe pas (sprite de la Bête de profil + fond d'ornière).",
    description:
      "Appui tenu pendant que la masse passe au-dessus de toi. L'Instinct raccourcit la durée à tenir et rend lisibles les indices de fin. Rater : elle te trouve, te marque, et repart.",
    engine: "hold",
    configFor: (tier) => ({
      durationMs: tier === "haut" ? 2200 : tier === "moyen" ? 3000 : 3800,
      clearCue: tier !== "bas",
      grazeCount: tier === "bas" ? 6 : 3,
    }),
    successText: "La masse passe. Tu recraches de la terre et tu marches.",
    failText: "Ton souffle te lâche sur un rien. Le museau descend, te trouve.",
  },
];

export const REFERENCE_GAMES: MiniGameEntry[] = [
  {
    id: "ref-frotter",
    number: 0,
    title: "Frotter l'écran",
    category: "Référence",
    stat: "MIXTE",
    description:
      "Révéler une inscription effacée. La suie est orange tramé dense (matité) ; le texte dessous est crème — jamais orange, pour signaler que ce n'est pas du texte de jeu normal.",
    engine: "rub",
    configFor: () => ({ label: "MORT", threshold: 0.62 }),
    successText: "L'inscription apparaît, nette sous la suie écartée.",
    failText: "La suie retombe avant que tu n'aies fini de lire.",
  },
  {
    id: "ref-glyphe",
    number: 0,
    title: "Tracer un glyphe",
    category: "Référence",
    stat: "RUSE",
    description:
      "Sceller/desceller un motif : progression séquentielle stricte, s'écarter trop longtemps = échec. Ruse basse = motif long et retors, Ruse haute = motif court et simple.",
    engine: "glyph",
    configFor: (tier) => ({
      points: tier === "bas" ? 7 : tier === "moyen" ? 5 : 3,
      star: tier !== "haut",
      tolerance: tier === "haut" ? 30 : 20,
    }),
    successText: "Le glyphe se referme sur lui-même, scellé.",
    failText: "Le tracé se brouille — le sceau reste ouvert.",
  },
  {
    id: "ref-souffle",
    number: 0,
    title: "Retenir son souffle",
    category: "Référence",
    stat: "INSTINCT",
    description:
      "Appui maintenu pendant qu'une créature passe. La lisibilité des indices de fin dépend de l'Instinct — jamais un prérequis sonore.",
    engine: "hold",
    configFor: (tier) => ({
      durationMs: tier === "haut" ? 2200 : tier === "moyen" ? 3000 : 3800,
      clearCue: tier !== "bas",
      grazeCount: tier === "bas" ? 6 : 3,
    }),
    successText: "La créature s'éloigne sans t'avoir vu.",
    failText: "Un mouvement de trop — elle se retourne.",
  },
  {
    id: "ref-crochetage",
    number: 0,
    title: "Crochetage",
    category: "Référence",
    stat: "RUSE",
    description:
      "Fenêtre de réussite qui s'élargit avec la Ruse. Validé comme le meilleur du lot le 11/07 — rendu toujours tramé, jamais un rectangle plein.",
    engine: "timing",
    configFor: (tier) => ({
      mode: "track",
      windowWidth: tier === "haut" ? 0.34 : tier === "moyen" ? 0.22 : 0.12,
      speed: 1.1,
      maxAttempts: 3,
      // La galerie sert à REVOIR ce que le jeu fait : elle montre donc les
      // trois goupilles du crochetage réel (29/08), pas un tap unique.
      goupilles: 3,
    }),
    successText: "Le mécanisme cède avec un déclic sourd.",
    failText: "La pointe dérape — il faut recommencer.",
  },
];

export const CATALOGUE_GAMES: MiniGameEntry[] = [
  {
    id: "cadran-runique",
    number: 1,
    title: "Le cadran runique",
    category: "Ruse",
    stat: "RUSE",
    description:
      "Tourner une roue crantée pour aligner trois runes. Feedback 100% visuel — la trame s'épaissit et pulse par paliers à l'approche de l'alignement.",
    engine: "dial",
    configFor: (tier) => ({ runes: 3, signalWidth: tier === "haut" ? 0.9 : tier === "moyen" ? 0.55 : 0.3 }),
    successText: "Les trois runes s'alignent — un cliquetis sourd, verrouillé.",
    failText: "La roue continue de tourner, indifférente.",
  },
  {
    id: "trace-miroir",
    number: 2,
    title: "Le tracé en miroir",
    category: "Ruse",
    stat: "RUSE",
    description: "Reproduire un glyphe affiché inversé horizontalement. Même moteur que Tracer un glyphe.",
    engine: "glyph",
    configFor: (tier) => ({ points: tier === "bas" ? 6 : 4, mirror: true, tolerance: tier === "haut" ? 28 : 18 }),
    successText: "Le reflet se referme sur le motif original.",
    failText: "Le miroir se brouille — le tracé ne correspond pas.",
  },
  {
    id: "noeud-pendu",
    number: 3,
    title: "Le nœud du pendu",
    category: "Ruse",
    stat: "RUSE",
    description:
      "Suivre au doigt le trajet d'une corde sans repasser deux fois par le même croisement. Repasser dessus resserre le nœud.",
    engine: "glyph",
    configFor: (tier) => ({ points: tier === "bas" ? 6 : 4, noRevisit: true, tolerance: 22 }),
    successText: "Le nœud glisse et cède, la corde tombe.",
    failText: "Le nœud se resserre — il faut tout recommencer.",
  },
  {
    id: "sceau-cire",
    number: 4,
    title: "Le sceau de cire",
    category: "Ruse",
    stat: "RUSE",
    description:
      "Briser un sceau d'un tap sec au point exact de fracture. Ruse haute = plus de fissures visibles affichées comme indices. Deux essais maximum.",
    engine: "timing",
    configFor: (tier) => ({ mode: "point", windowWidth: tier === "haut" ? 0.5 : 0.25, maxAttempts: 2 }),
    successText: "Le sceau se fend net, la cire tombe en éclats.",
    failText: "Le sceau se ressoude en partie — abîmé, intact.",
  },
  {
    id: "pages-grimoire",
    number: 5,
    title: "Les pages du grimoire",
    category: "Ruse",
    stat: "RUSE",
    description:
      "Tourner les pages d'un livre maudit par swipes lents ; trop rapide le réveille. La page frémit (jitter croissant) en approchant la limite.",
    engine: "slowSwipe",
    configFor: (tier) => ({ pagesNeeded: 3, maxSpeed: tier === "haut" ? 14 : tier === "moyen" ? 10 : 7 }),
    successText: "La dernière page tourne, silencieuse.",
    failText: "Le grimoire frissonne et se referme seul.",
  },
  {
    id: "dague-doigts",
    number: 6,
    title: "La dague entre les doigts",
    category: "Ruse",
    stat: "RUSE",
    description:
      "Taper les intervalles entre les doigts d'une main de pierre, dans un ordre imposé, de plus en plus vite. Rater une entaille inflige l'état Entaillé.",
    engine: "sequence",
    configFor: (tier) => ({ count: 5, showMs: tier === "haut" ? 900 : tier === "moyen" ? 650 : 450 }),
    successText: "La dague retombe entre chaque doigt, intacts.",
    failText: "La lame mord — une entaille de plus.",
  },
  {
    id: "endiguer-sang",
    number: 7,
    title: "Endiguer le sang",
    category: "Courage",
    stat: "COURAGE",
    description:
      "Appui maintenu à pression régulière sur une plaie. Relâcher trop tôt la rouvre. Courage haut = durée à tenir plus courte.",
    engine: "hold",
    configFor: (tier) => ({ durationMs: tier === "haut" ? 2000 : tier === "moyen" ? 2800 : 3600 }),
    successText: "Le sang cesse de couler, la plaie tient.",
    failText: "Le sang reprend — la blessure s'aggrave.",
  },
  {
    id: "main-trou",
    number: 8,
    title: "La main dans le trou",
    category: "Courage",
    stat: "COURAGE",
    description:
      "Glisser le doigt lentement dans une anfractuosité sombre. Des choses frôlent, l'écran tremble — ne pas retirer ni accélérer. Courage haut = moins de frôlements.",
    engine: "hold",
    configFor: (tier) => ({
      durationMs: 2600,
      noMove: true,
      grazeCount: tier === "haut" ? 2 : tier === "moyen" ? 4 : 7,
    }),
    successText: "Tes doigts se referment sur l'objet, intacts.",
    failText: "Un mouvement de recul — quelque chose t'a senti.",
  },
  {
    id: "piege-machoire",
    number: 9,
    title: "Le piège à mâchoire",
    category: "Courage",
    stat: "COURAGE",
    description:
      "Garder le doigt sur l'appât et le retirer au tout dernier signal (frémissement 2 frames avant le claquement). Courage haut = le frémissement dure plus longtemps.",
    engine: "timing",
    configFor: (tier) => ({ mode: "release", windowWidth: tier === "haut" ? 0.16 : tier === "moyen" ? 0.09 : 0.05 }),
    successText: "Tu retires la main juste avant le claquement.",
    failText: "Les mâchoires se referment — trop tôt, ou trop tard.",
  },
  {
    id: "amputation",
    number: 10,
    title: "L'amputation",
    category: "Courage",
    stat: "COURAGE",
    description:
      "Trancher net d'un swipe unique, rapide et rectiligne. Hésiter aggrave la blessure. Courage haut = tolérance de courbure plus large.",
    engine: "straightSwipe",
    configFor: (tier) => ({
      minLength: 90,
      maxDurationMs: 500,
      maxDeviation: tier === "haut" ? 30 : tier === "moyen" ? 16 : 8,
    }),
    successText: "Un geste, net — c'est fait.",
    failText: "La lame dévie — la blessure s'aggrave.",
  },
  {
    id: "torche-noir",
    number: 11,
    title: "La torche dans le noir",
    category: "Instinct",
    stat: "INSTINCT",
    description:
      "Déplacer un halo de lumière tramée sur une scène obscure pour repérer le détail qui cloche. Un seul tap de désignation autorisé.",
    engine: "pick",
    configFor: (tier) => ({
      count: 4,
      hintStrength: tier === "haut" ? 0.9 : tier === "moyen" ? 0.5 : 0.2,
      jitterCorrect: "loose",
    }),
    successText: "Le détail saute aux yeux — c'était bien là.",
    failText: "Ton tap tombe à côté, et le temps presse.",
  },
  {
    id: "tambour-funebre",
    number: 12,
    title: "Le tambour funèbre",
    category: "Instinct",
    stat: "INSTINCT",
    description:
      "Reproduire un rythme montré en pulsation de trame pour se fondre dans une procession. Instinct haut = le rythme reste affiché pendant la reproduction.",
    engine: "rhythm",
    configFor: (tier) => ({ beats: 4, intervalMs: 650, showDuringReplay: tier !== "bas" }),
    successText: "Ton pas se fond dans la procession, invisible.",
    failText: "Un temps faux — des têtes se tournent.",
  },
  {
    id: "latrines-charnier",
    number: 13,
    title: "Les latrines du charnier",
    category: "Instinct",
    stat: "INSTINCT",
    description:
      "Fouiller le bon tas parmi cinq. Instinct élimine visuellement les mauvais (pixels plus ternes). Fouiller le mauvais a un coût narratif.",
    engine: "pick",
    configFor: (tier) => ({ count: 5, hintStrength: tier === "haut" ? 0.85 : tier === "moyen" ? 0.45 : 0.15 }),
    successText: "Le bon tas — l'objet est là, sous la crasse.",
    failText: "Rien ici que de la puanteur perdue pour rien.",
  },
  {
    id: "statue-bouge",
    number: 14,
    title: "La statue qui bouge",
    category: "Instinct",
    stat: "INSTINCT",
    description:
      "Trois statues ; l'une a changé de posture depuis l'illustration précédente du fil. La pointer. Instinct haut = la différence est plus marquée.",
    engine: "pick",
    configFor: (tier) => ({
      count: 3,
      hintStrength: tier === "haut" ? 0.9 : tier === "moyen" ? 0.5 : 0.2,
      jitterCorrect: "tight",
    }),
    successText: "Celle-là a bougé — tu l'as vue à temps.",
    failText: "Rien ne semblait différent. Trop tard, peut-être.",
  },
  {
    id: "fil-ariane",
    number: 15,
    title: "Suivre le fil d'Ariane",
    category: "Instinct",
    stat: "INSTINCT",
    description:
      "Glisser le doigt le long d'un fil dans le noir total (seul le fil est visible, tramé fin). Le perdre plus de quelques instants = échec.",
    engine: "glyph",
    configFor: (tier) => ({ points: 8, blackout: true, tolerance: tier === "haut" ? 26 : tier === "moyen" ? 18 : 12 }),
    successText: "Le fil te ramène à la lumière.",
    failText: "Le fil t'échappe — le noir se referme.",
  },
  {
    id: "calmer-bete",
    number: 16,
    title: "Calmer la bête",
    category: "Empathie",
    stat: "EMPATHIE",
    description:
      "Caresses lentes et régulières sur une créature blessée ; trop vite ou saccadé = morsure. Empathie haute = fenêtre de rythme plus large.",
    engine: "caress",
    configFor: (tier) => ({
      targetSpeed: 4,
      tolerance: tier === "haut" ? 3 : tier === "moyen" ? 1.8 : 1,
      durationMs: 2400,
    }),
    successText: "La bête ferme les yeux, apaisée.",
    failText: "Un grondement — la morsure part vite.",
  },
  {
    id: "fermer-yeux",
    number: 17,
    title: "Fermer les yeux du mort",
    category: "Empathie",
    stat: "EMPATHIE",
    description:
      "Un glissé unique, lent, de haut en bas sur un visage. Volontairement inratable — geste d'attachement pur, sans enjeu.",
    engine: "singleGesture",
    configFor: () => ({}),
    successText: "Ses yeux se ferment, enfin en paix.",
    failText: "",
  },
  {
    id: "incantation-partagee",
    number: 18,
    title: "L'incantation partagée",
    category: "Empathie",
    stat: "EMPATHIE",
    description:
      "Appuis longs synchronisés avec la respiration d'un PNJ mourant — sa poitrine tramée se soulève par paliers. Empathie haute = rythme plus lent et lisible.",
    engine: "rhythm",
    configFor: (tier) => ({
      beats: 3,
      intervalMs: tier === "haut" ? 1100 : tier === "moyen" ? 850 : 650,
      showDuringReplay: true,
    }),
    successText: "Le souffle se synchronise — un dernier mot passe.",
    failText: "Le rythme casse — le silence tombe trop tôt.",
  },
  {
    id: "mendiant-trois-mains",
    number: 19,
    title: "Le mendiant aux trois mains",
    category: "Empathie",
    stat: "EMPATHIE",
    description:
      "Donner une pièce dans la bonne paume tendue parmi trois. Empathie révèle des micro-indices (une main tremble de faim, une autre de fausse faim).",
    engine: "pick",
    configFor: (tier) => ({
      count: 3,
      hintStrength: tier === "haut" ? 0.85 : tier === "moyen" ? 0.4 : 0.1,
      jitterCorrect: "tight",
    }),
    successText: "La pièce tombe dans la bonne main, tremblante de faim vraie.",
    failText: "La mauvaise main se referme — un mensonge de plus payé.",
  },
  {
    id: "chandelles-rituel",
    number: 20,
    title: "Les chandelles du rituel",
    category: "Mixte",
    stat: "MIXTE",
    description:
      "Éteindre 5 chandelles dans l'ordre inverse de leur allumage, montré une fois (~4 secondes). Stat selon contexte narratif (Ruse ou Instinct).",
    engine: "sequence",
    configFor: (tier) => ({ count: 5, reverse: true, showMs: tier === "haut" ? 850 : 650 }),
    successText: "La dernière flamme s'éteint dans le bon ordre.",
    failText: "Une chandelle rallumée d'elle-même — le rituel rate.",
  },
  {
    id: "antidote",
    number: 21,
    title: "L'antidote",
    category: "Mixte",
    stat: "RUSE",
    description:
      "Combo : (a) frotter une recette à moitié effacée, puis (b) mélanger la fiole par rotations — N tours dans un sens, M dans l'autre. Démo : phase de rotation, comptage visuel par teinte.",
    engine: "dial",
    configFor: (tier) => ({ turnsNeeded: tier === "haut" ? 2 : tier === "moyen" ? 3 : 4, signalWidth: 999 }),
    successText: "La fiole change de teinte — l'antidote est prêt.",
    failText: "Le mélange tourne mal, la teinte reste trouble.",
  },
];

export const ALL_MINIGAMES: MiniGameEntry[] = [
  ...JEU_GAMES,
  ...A_HABILLER_GAMES,
  ...REFERENCE_GAMES,
  ...CATALOGUE_GAMES,
];
