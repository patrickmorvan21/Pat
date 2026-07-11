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
  /** Repos au campement : avance le jour, atténue les blessures légères, sauvegarde (spec §7). */
  rest?: boolean;
};

export type Scene = {
  id: string;
  /** Plusieurs paragraphes courts (2-4 phrases chacun), pas des pavés — chacun type séparément dans le fil. */
  narration: string[];
  /** Asset tramé de la scène (public/assets/…). Défaut : portail. Temps 2 : varier par contexte. */
  illustration?: string;
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
    narration: [
      "Le couloir s'arrête net. Deux portes te font face. Celle de gauche est " +
        "balafrée de coups d'épée, son bois sombre fendu, sa serrure éventrée, " +
        "quelqu'un, ou quelque chose, s'y est acharné.",
      "Celle de droite est neuve, taillée dans un bois blanc presque luisant, " +
        "et porte une inscription gravée que tu ne reconnais pas. L'air qui " +
        "en sort est plus froid que celui du couloir.",
      "Tu poses la main sur la pierre entre les deux. Elle vibre, à peine — " +
        "un battement lent, comme si le mur entier respirait quelque chose " +
        "d'endormi juste derrière.",
    ],
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
    narration: [
      "Derrière, une salle ronde aux murs suintants. Au centre, un corps en " +
        "armure, effondré sur une dalle gravée. Sa main gantée serre encore " +
        "quelque chose.",
      "Une odeur de fer et de cire froide flotte dans l'air immobile. Les " +
        "torchères, éteintes depuis longtemps, portent encore des traces de " +
        "suie fraîche à leur base — quelqu'un est passé ici récemment.",
      "Quelque part au-dessus, un frottement lent, régulier, comme une corde " +
        "qu'on use contre la pierre. Il s'arrête chaque fois que tu retiens " +
        "ton souffle, et reprend dès que tu respires.",
    ],
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
      {
        id: "odeur",
        label: "Suivre l'odeur de fer",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. L'odeur te mène à une niche creuse : une fiole de sang noir, intacte. Ton instinct l'a sentie avant tes yeux.",
            "Tu remontes le fil de fer jusqu'à une brèche discrète. Un passage que personne n'a marqué.",
            "L'odeur tourne en rond. Quand tu t'arrêtes, le frottement au-dessus s'est arrêté aussi.",
            "1 naturel. L'odeur venait de toi. Quelque chose l'a suivie. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Celui-là a tenu 6 jours. Tu vois où mène la prudence.",
  },
  {
    id: "escalier",
    narration: [
      "Un escalier en vis s'enfonce sous la dalle descellée. L'air qui en " +
        "monte est froid, chargé d'eau et d'autre chose — un souffle ample, " +
        "espacé, qui n'est pas un courant d'air.",
      "Ta torche se couche vers le bas, comme aspirée. Les marches sont usées " +
        "au centre, profondément, par des générations de pas pressés dans un " +
        "seul sens : celui de la descente. Personne, semble-t-il, n'est " +
        "jamais remonté par ici en comptant les marches.",
      "Tu comptes malgré toi. Sept. Douze. À la vingtième, le souffle change " +
        "de rythme, comme s'il t'avait remarqué.",
    ],
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
      {
        id: "eteindre",
        label: "Éteindre la torche d'abord",
        risky: {
          stat: "COURAGE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Le noir t'accepte. En bas, le souffle passe à côté de toi sans te trouver.",
            "Tu descends à tâtons, invisible. Le souffle continue, indifférent.",
            "Sans lumière, ta main manque la rampe. Le bruit de ta chute descend plus vite que toi.",
            "1 naturel. Tu rallumes la torche — juste en face de ce qui soufflait. ♦ −2"
          ),
        },
      },
      { id: "sonder", label: "Sonder les marches usées", locked: { stat: "RUSE" } },
    ],
    jailerLine: "4 312 mains ont hésité sur cette rampe. Je les ai comptées.",
  },
  {
    id: "pont-os",
    narration: [
      "Une rivière souterraine barre le passage, noire et sans reflet. On l'a " +
        "enjambée d'un pont — pas de pierre : d'os, longs et jaunis, liés de " +
        "tendons secs qui craquent à chaque courant d'air.",
      "Sur l'autre rive, une lanterne verte pend à un crochet, allumée. " +
        "Personne pour la porter, personne pour l'avoir rallumée depuis — " +
        "combien de temps, au juste. Sa flamme ne vacille jamais, même " +
        "quand le vent forcit.",
      "Le pont grince avant même qu'on le touche, comme s'il connaissait " +
        "déjà ton poids. Sous le tablier d'os, l'eau ne fait aucun bruit en " +
        "coulant. Aucun.",
    ],
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
      {
        id: "gue",
        label: "Chercher un gué en amont",
        risky: {
          stat: "RUSE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Le gué existe — trois pierres plates sous deux doigts d'eau noire. Tu traverses sans une éclaboussure.",
            "Cent pas en amont, la rivière s'amincit. Tu passes, les bottes à peine mouillées.",
            "L'amont se resserre en gorge. Tu reviens au pont — la lanterne verte a changé de place.",
            "1 naturel. L'eau noire n'a pas de gué. Elle a des mains. ♦ −2"
          ),
        },
      },
      {
        id: "cranes",
        label: "Compter les crânes du parapet",
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Quarante-neuf crânes. Le cinquantième manque : le pont te réserve sa place — et t'épargne, flatté d'avoir été compté.",
            "Chaque crâne compté semble s'alléger. Le pont cesse de grincer, comme apaisé qu'on se souvienne.",
            "Tu perds le compte au trente-troisième. Un crâne pivote, lentement, pour te regarder recommencer.",
            "1 naturel. L'un des crânes compte avec toi. À voix haute. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Les os du pont ? D'anciens curieux. Comme toi.",
  },
  {
    id: "campement",
    narration: [
      "Une anfractuosité sèche, à l'écart du courant d'air. Des cendres " +
        "anciennes prouvent qu'on s'y est déjà arrêté — et qu'on en est " +
        "reparti, ce qui n'est déjà pas rien, ici.",
      "Le silence, dans ce renfoncement, est différent de celui du couloir : " +
        "il ne guette pas, il attend, presque poliment. Tes jambes pèsent " +
        "leur vrai poids pour la première fois depuis des heures.",
      "Sur la paroi, quelqu'un a gravé une marque courte, sans doute pour " +
        "compter les nuits passées ici. Il y en a sept.",
    ],
    choices: [
      { id: "dormir", label: "Dormir jusqu'à l'aube", rest: true },
      {
        id: "garde",
        label: "Monter la garde, somnoler",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu dors d'un œil, et cet œil voit tout. Au matin, tu sais exactement ce qui est passé — et ce qui t'a évité.",
            "Ton demi-sommeil filtre les bruits. Rien n'approche. Le repos est mince, mais il est à toi.",
            "Tu sombres sans le décider. Au réveil, les cendres ont été remuées. Pas par toi.",
            "1 naturel. Tu rêves qu'on monte la garde au-dessus de toi. Au réveil, l'empreinte est encore chaude. ♦ −2"
          ),
        },
      },
      { id: "repartir", label: "Repartir sans attendre" },
    ],
    jailerLine: "Dors. J'aime regarder.",
  },
  {
    id: "cage",
    narration: [
      "Dans l'alcôve suivante, une cage pend à hauteur d'homme. Dedans, une " +
        "silhouette maigre, genoux au menton, qui respire — un détail qui " +
        "compte plus qu'il n'y paraît, ici.",
      "Elle lève la tête à ta lumière : des yeux humains, une bouche cousue " +
        "de fil noir, serré en petits points réguliers, presque soignés, " +
        "comme un travail qu'on aurait pris son temps à faire.",
      "Elle pose deux doigts sur les barreaux, doucement, et attend. Elle ne " +
        "tire pas dessus. Elle ne semble même pas y avoir pensé.",
    ],
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
    narration: [
      "La galerie s'élargit en un hall poli comme un miroir noir. Chaque pas " +
        "y revient double, un instant trop tard pour être vraiment le tien.",
      "Puis ta propre voix te devance : « Qui va là ? » demande-t-elle avec " +
        "ta bouche, trois pas devant. L'écho attend une réponse, immobile, " +
        "comme s'il avait un corps quelque part dans le noir poli du sol.",
      "Il n'a pas ton accent — pas tout à fait. Une syllabe traîne un peu " +
        "trop, comme s'il apprenait encore à porter ta voix.",
    ],
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
      {
        id: "repondre",
        label: "Répondre à la voix",
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu réponds ton vrai nom, sans peur. L'écho se tait — personne ne le lui avait jamais offert.",
            "Ta voix ne tremble pas. L'écho répète, satisfait, et s'éloigne chercher quelqu'un d'autre.",
            "Tu réponds trop tard. L'écho a déjà décidé de ta réponse — elle ne te ressemble pas.",
            "1 naturel. Vous répondez exactement en même temps. Le hall n'a plus qu'une seule voix. ♦ −2"
          ),
        },
      },
      { id: "taire", label: "Avancer entre les échos", locked: { stat: "INSTINCT" } },
    ],
    jailerLine: "L'écho ment mieux que toi. 9 fois sur 10, très exactement.",
  },
  {
    id: "table",
    narration: [
      "Une table de banquet dressée pour personne. Nappes grises de " +
        "poussière, chandelles éteintes — sauf une, dont la flamme ne " +
        "tremble jamais, même quand tu passes la main devant.",
      "Dans son halo, un seul objet : un anneau de fer torsadé, encore " +
        "tiède, posé sur un coussin de velours élimé, comme si quelqu'un " +
        "venait tout juste de le poser là et de partir sans bruit.",
      "Quelque chose sous la table respire lentement contre tes chevilles. " +
        "Ce n'est pas hostile. Ce n'est pas amical non plus. C'est juste " +
        "là, et ça attend que tu choisisses.",
    ],
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
      {
        id: "echanger",
        label: "Déposer ta dague en échange",
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. La dague pèse exactement le poids de l'anneau. Sous la table, on ronronne presque.",
            "L'échange tient. La chandelle vacille une fois — marché conclu.",
            "Ta dague roule et tombe. Sous la table, on la ramasse. On ne rend rien.",
            "1 naturel. On accepte l'échange : ta dague, et la main qui la tenait. ♦ −2"
          ),
        },
      },
      { id: "reculer", label: "Reculer sans tourner le dos" },
    ],
    jailerLine: "Cet anneau a connu 3 propriétaires. Tous brefs.",
  },
  {
    id: "porte-7e",
    narration: [
      "Au bout, une porte sans gonds ni serrure, taillée dans une seule dent " +
        "immense, encore ancrée dans une mâchoire qu'on devine plus qu'on ne " +
        "la voit dans l'obscurité du plafond.",
      "Dessus, gravé à hauteur de tes yeux exactement — pas plus haut, pas " +
        "plus bas, comme mesuré pour toi précisément : « FRAPPE TROIS FOIS " +
        "SI TU CROIS ÊTRE ATTENDU ».",
      "De l'autre côté, quelque chose compte à voix basse. Il en est à sept " +
        "mille et des poussières, et il ne semble pas près de s'arrêter de " +
        "lui-même.",
    ],
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
      {
        id: "battement",
        label: "Coller l'oreille à la dent",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Le décompte s'interrompt. Tout bas, il te confie le chiffre exact où il s'arrêtera.",
            "À travers l'ivoire, tu comprends : il compte les battements de ton cœur. Tu sais maintenant lesquels retenir.",
            "L'ivoire est glacé. Le décompte s'accélère dès que ton oreille le touche.",
            "1 naturel. De l'autre côté, on colle aussi son oreille. ♦ −2"
          ),
        },
      },
      { id: "attendre", label: "Attendre la fin du décompte", locked: { stat: "EMPATHIE" } },
    ],
    jailerLine: "Frappe. Le 7e jour aime les ponctuels.",
  },
];

/**
 * Répliques du Geôlier quand le dé a mal tourné — il ne console pas,
 * il tient les comptes. `{n}` est remplacé par le résultat du jet.
 */
export const JAILER_TAUNTS_FAIL: string[] = [
  "Un {n} ? Même les os du pont ont ri.",
  "J'ajoute ce {n} à ton registre. Il se remplit vite.",
  "Le dé t'a jugé. J'ai cessé de le faire depuis longtemps.",
  "{n}. Le précédent avait fait pareil. J'ai gardé sa besace.",
];

export const JAILER_TAUNTS_CRITFAIL: string[] = [
  "Un 1 naturel. Je l'encadrerais, si mes murs étaient à moi.",
  "1. Le dé lui-même a eu pitié — puis non.",
];

export const JAILER_TAUNTS_CRITSUCCESS: string[] = [
  "Un 20. Rare. Je note, je n'applaudis pas.",
  "20 naturel. Même moi, j'admets que c'était propre.",
];

export function jailerTaunt(result: number): string {
  const pool =
    result === 1 ? JAILER_TAUNTS_CRITFAIL : result === 20 ? JAILER_TAUNTS_CRITSUCCESS : JAILER_TAUNTS_FAIL;
  const line = pool[Math.floor(Math.random() * pool.length)];
  return line.replace("{n}", String(result));
}

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
