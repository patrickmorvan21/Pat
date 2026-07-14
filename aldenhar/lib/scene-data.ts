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
  /**
   * Choix risqué : toujours cliquable, jet de dé + stat en coulisse.
   * `highStakes` (§18, « la main qui hésite ») : le dé traîne/tremble avant
   * de s'immobiliser sur les jets à très fort enjeu — purement visuel.
   */
  risky?: { stat: Stat; threshold: number; outcomes: Outcomes; highStakes?: boolean };
  /** Choix verrouillé : seuil de stat non atteint → grisé mais visible. */
  locked?: { stat: Stat };
  /** Repos au campement : avance le jour, atténue les blessures légères, sauvegarde (spec §7). */
  rest?: boolean;
  /**
   * Choix passif — « le silence comme vraie option de jeu » (§19) : ne rien
   * faire est un vrai choix stratégique, résolu instantanément (pas de dé)
   * avec une conséquence dédiée écrite en réaction à l'inaction.
   */
  passive?: { consequence: string };
  /** Pose durablement un flag d'environnement au niveau compte (§17). */
  setsEnvFlag?: string;
  /**
   * Prix différé (§17) : ce choix « gratuit » contracte une dette silencieuse
   * qui se règle `settleInSteps` scènes plus loin dans la run.
   */
  debt?: { id: string; settleInSteps: number; text: string };
};

export type Scene = {
  id: string;
  /** Plusieurs paragraphes courts (2-4 phrases chacun), pas des pavés — chacun type séparément dans le fil. */
  narration: string[];
  /** Asset tramé de la scène (public/assets/…). Défaut : portail. Temps 2 : varier par contexte. */
  illustration?: string;
  choices: Choice[];
  jailerLine: string;
  /**
   * Rencontre de combat (spec §6) : pas de système séparé, pas de PV de
   * monstre — la même mécanique choix + dé, seuils de jet plus exigeants
   * pour exprimer la difficulté. Sert uniquement à déclencher l'état
   * narratif temporaire de bonus/malus post-combat (Scene.tsx), jamais un
   * calcul de dégâts séparé.
   */
  combat?: boolean;
  /**
   * Identité stable de l'adversaire pour la dette de sang (§19) : si ce même
   * `foe` a déjà tué un héros du joueur, une ligne de reconnaissance est
   * insérée avant la scène. Purement narratif.
   */
  foe?: string;
  /**
   * Nom affiché de l'adversaire, pour la bannière de rencontre qui annonce
   * clairement un combat (le mécanisme reste identique au reste du jeu, spec
   * §6 — la bannière ne fait que le rendre LISIBLE, sans PV ni jauge).
   */
  foeName?: string;
  /**
   * La scène qui se résout sans toi (§18) : décision sous contrainte de temps
   * réel très courte. Un compte à rebours VISUEL (érosion/pulsation, jamais un
   * timer chiffré) ; si le joueur ne choisit pas à temps, la situation évolue
   * et de NOUVELLES options s'ouvrent (l'inaction est elle-même un choix).
   */
  timed?: {
    ms: number;
    /** Texte inséré quand le temps s'écoule sans choix. */
    timeoutNarration: string;
    /** Options qui remplacent les choix d'origine après expiration. */
    timeoutChoices: Choice[];
  };
  /**
   * Le Grand Registre (§19) : cette scène n'est pas un choix mais un lieu
   * traversable — un classement des héros par jours de survie, défilé une
   * fois. La ligne du joueur s'y insère, visuellement distincte.
   */
  registre?: boolean;
};

/**
 * Résolution graduée à 5 paliers (journal Notion 13/07) — remplace le binaire
 * réussite/échec partout. Calculée sur la MARGE (jet effectif − seuil), sauf
 * les naturels qui transcendent tout :
 *  - Destin (20 naturel) : événement épique + récompense Besace rare/légendaire
 *  - Malédiction (1 naturel) : événement négatif marquant, indépendant du seuil
 * Toujours raconté en prose + mot de verdict — jamais un chiffre affiché.
 */
export type ResolutionTier =
  | "destin"
  | "eclatante"
  | "reussite"
  | "justesse"
  | "echec"
  | "critique"
  | "malediction";

export const TIER_WORDS: Record<ResolutionTier, string> = {
  destin: "DESTIN",
  eclatante: "RÉUSSITE ÉCLATANTE",
  reussite: "RÉUSSITE",
  justesse: "DE JUSTESSE",
  echec: "ÉCHEC",
  critique: "FUNESTE",
  malediction: "MALÉDICTION",
};

export function resolveTier(natural: number, effective: number, threshold: number): ResolutionTier {
  if (natural === 20) return "destin";
  if (natural === 1) return "malediction";
  const margin = effective - threshold;
  if (margin >= 5) return "eclatante";
  if (margin >= 2) return "reussite";
  if (margin >= 0) return "justesse";
  if (margin > -5) return "echec";
  return "critique";
}

export function tierIsFail(tier: ResolutionTier): boolean {
  return tier === "echec" || tier === "critique" || tier === "malediction";
}

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
        setsEnvFlag: "porte-balafree-defoncee",
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
      {
        id: "ecouter",
        label: "Écouter, immobile",
        // Le silence comme vraie option (§19) : ne rien forcer est un choix,
        // avec une conséquence propre — pas une case vide.
        passive: {
          consequence:
            "Tu ne touches à rien. Tu écoutes. Derrière la porte blanche, le " +
            "froid se retire lentement, comme une marée — et laisse derrière " +
            "lui un couloir que tu n'avais pas vu, à main gauche. Le silence, " +
            "ici, ouvre plus de portes que l'épaule.",
        },
      },
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
      {
        id: "longer",
        label: "Longer le mur, sans toucher",
        // Prix différé (§17) : éviter le risque ici semble gratuit — mais le
        // mur suintant marque qui le frôle, et la dette se règle plus loin.
        debt: {
          id: "marque-fresque",
          settleInSteps: 3,
          text:
            "La marque humide prise en longeant le mur de la salle ronde, il y " +
            "a quelques scènes, se met soudain à luire faiblement sous ta " +
            "manche. Quelque chose, quelque part, vient de savoir exactement " +
            "où tu es.",
        },
      },
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
    // Première rencontre volontairement précoce (3e scène) : le joueur doit
    // croiser un adversaire vite. Autonome — ne dépend d'aucune scène amont.
    id: "rodeur",
    combat: true,
    foe: "rodeur",
    foeName: "Le Rôdeur",
    narration: [
      "Le couloir se rétrécit, puis quelque chose se détache de l'ombre — une " +
        "silhouette voûtée, trop longue, qui se tenait plaquée au plafond " +
        "depuis un moment déjà. Elle tombe sans un bruit entre toi et la " +
        "sortie.",
      "Pas d'yeux. Une bouche, immense, là où devrait être le ventre. Le " +
        "Rôdeur penche la tête vers toi, curieux, et fait un premier pas — " +
        "sans hâte, sûr qu'il n'y a pas d'issue derrière lui.",
      "Il n'y en a pas. Il faut passer par lui.",
    ],
    choices: [
      {
        id: "charger-rodeur",
        label: "Le charger avant qu'il ne s'élance",
        risky: {
          stat: "COURAGE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu le percutes avant qu'il n'ait fini son pas. Le Rôdeur bascule, sa bouche claque dans le vide — tu es déjà passé.",
            "Ton élan le prend de court. Il encaisse, recule contre la paroi, et te laisse le temps d'un passage.",
            "Il t'attendait, justement. Sa bouche se referme là où tu allais — tu te jettes de côté in extremis.",
            "1 naturel. Tu charges droit dans la bouche. ♦ −2"
          ),
        },
      },
      {
        id: "contourner-rodeur",
        label: "Le contourner dans le noir",
        risky: {
          stat: "RUSE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu te fonds dans son angle mort — il n'a pas d'yeux, mais toi tu as compris comment il écoute. Tu passes comme une pensée.",
            "Tu te glisses le long de la paroi. Il tourne sur lui-même, une seconde trop tard.",
            "Une pierre roule sous ton pied. La bouche pivote vers le bruit — vers toi.",
            "1 naturel. Ton angle mort était le sien. Vous vous trouvez en même temps. ♦ −2"
          ),
        },
      },
      {
        id: "figer-rodeur",
        label: "Ne plus bouger du tout",
        // Le silence/immobilité comme option (§19) : le Rôdeur chasse au
        // mouvement — ne rien faire est parfois la vraie réponse.
        passive: {
          consequence:
            "Tu te changes en statue. Le Rôdeur avance, sa bouche frôle ta " +
            "joue — assez près pour que tu sentes son haleine de terre " +
            "mouillée — puis passe son chemin, faute de proie qui bouge. " +
            "Quand le couloir se vide, tu respires enfin. Tu es passé sans " +
            "livrer combat.",
        },
      },
    ],
    jailerLine: "Le Rôdeur chasse au mouvement. La plupart courent. La plupart finissent dedans.",
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
    id: "eboulement",
    narration: [
      "À peine le pied posé sur le palier, la voûte gémit. Une fissure court " +
        "au plafond, plus vite que le son ne te parvient. Des blocs commencent " +
        "à tomber — le passage ne tiendra pas dix secondes.",
      "Il faut choisir. Maintenant.",
    ],
    // La scène qui se résout sans toi (§18) : décision sous contrainte de temps.
    timed: {
      ms: 2200,
      timeoutNarration:
        "Tu hésites une seconde de trop. Le sol se dérobe sous toi avant que " +
        "tu n'aies tranché — mais la chute est courte, et te dépose, meurtri, " +
        "dans une galerie basse que personne n'aurait choisi d'emprunter. " +
        "L'inaction, elle aussi, mène quelque part.",
      timeoutChoices: [
        {
          id: "ramper-galerie",
          label: "Ramper dans la galerie basse",
          risky: {
            stat: "INSTINCT",
            threshold: 11,
            outcomes: outcomes(
              "20 naturel. La galerie t'était destinée : elle débouche là où personne ne t'attendait, à revers de tout.",
              "Tu rampes dans le noir étroit. Ça débouche plus loin, intact, sur un passage oublié.",
              "La galerie se resserre sur tes épaules. Tu forces le passage, et quelque chose cède — pas la pierre.",
              "1 naturel. La galerie n'était pas vide. Elle t'attendait. ♦ −2"
            ),
          },
        },
        {
          id: "creuser-remonter",
          label: "Dégager les gravats vers le haut",
          risky: {
            stat: "COURAGE",
            threshold: 13,
            outcomes: outcomes(
              "20 naturel. Tu remontes à la force des bras par la brèche exacte, avant qu'elle ne se referme. Le couloir d'origine t'accueille, plus loin.",
              "Tu dégages assez de gravats pour te hisser. Tu retrouves le chemin, couvert de poussière mais entier.",
              "Les gravats glissent sous toi à chaque prise. Tu remontes à moitié, épuisé, du mauvais côté.",
              "1 naturel. Le plafond finit sa chute pendant que tu creuses. ♦ −2"
            ),
          },
        },
      ],
    },
    choices: [
      {
        id: "bondir-avant",
        label: "Bondir en avant sous les blocs",
        risky: {
          stat: "INSTINCT",
          threshold: 12,
          highStakes: true,
          outcomes: outcomes(
            "20 naturel. Tu passes entre deux blocs à l'instant précis où ils se croisent. Le couloir s'effondre derrière toi, pas devant.",
            "Tu plonges en avant. Un bloc frôle ton talon — tu es passé, le passage est scellé dans ton dos.",
            "Un bloc te fauche l'épaule en plein élan. Tu passes quand même, mais tu le sens.",
            "1 naturel. Tu bondis pile sous le plus gros. ♦ −2"
          ),
        },
      },
      {
        id: "reculer-vite",
        label: "Se jeter en arrière",
        risky: {
          stat: "COURAGE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Ton recul est si net que l'éboulement se referme comme un rideau, sans t'avoir touché. Tu attendras une autre voie.",
            "Tu te jettes en arrière à temps. Le passage se mure, mais tu es indemne, du bon côté.",
            "Tu recules d'un pas trop court. La poussière et les éclats te cinglent le visage.",
            "1 naturel. Tu recules — dans un second éboulement. ♦ −2"
          ),
        },
      },
      { id: "figer", label: "Se plaquer au mur, immobile", locked: { stat: "INSTINCT" } },
    ],
    jailerLine: "Le plafond ne t'attend pas. Moi, si — j'ai tout mon temps.",
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
    id: "tunnel-embuscade",
    combat: true,
    foe: "meute-limiers",
    foeName: "La meute de limiers",
    narration: [
      "Le tablier d'os à peine passé, la galerie se resserre. Des griffes " +
        "raclent la pierre dans le noir, plusieurs paires à la fois, " +
        "rythmées comme une meute qui compte ses pas avant de charger.",
      "Une forme bondit dans ta torche — museau fendu, yeux blancs, la peau " +
        "tendue sur des côtes trop nombreuses. Elle recule d'un pas, jauge, " +
        "puis siffle un appel vers l'obscurité derrière elle.",
      "Deux autres répondent, plus loin, dans le noir. Tu n'as pas le temps " +
        "de choisir ton terrain — seulement ta première réponse.",
    ],
    choices: [
      {
        id: "frapper-premier",
        label: "Frapper la première bête",
        risky: {
          stat: "COURAGE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Ton coup ouvre la bête d'un geste — elle s'effondre avant même de mordre. Les deux autres hésitent, reculent d'un pas.",
            "La lame trouve son flanc. Elle recule en gémissant, assez pour te laisser l'initiative sur les deux suivantes.",
            "Ton coup dévie sur l'os saillant. Elle esquive et referme les mâchoires sur ton avant-bras — tu perds un temps précieux.",
            "1 naturel. Ta lame se coince entre deux côtes. La bête l'arrache avec toi encore accroché. ♦ −2"
          ),
        },
      },
      {
        id: "reculer-etroit",
        label: "Reculer vers l'étroit du tunnel",
        risky: {
          stat: "INSTINCT",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu trouves le point exact où le tunnel ne laisse passer qu'une gueule à la fois. La meute se piétine elle-même.",
            "Le passage se resserre juste à temps. Elles ne peuvent plus charger qu'une par une, désormais.",
            "Le renfoncement que tu visais est trop loin. Elles te rattrapent groupées, toutes crocs dehors.",
            "1 naturel. Le tunnel se resserre — sur toi, pas sur elles. Tu es coincé, elles non. ♦ −2"
          ),
        },
      },
      {
        id: "jeter-torche",
        label: "Jeter la torche dans la meute",
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. La torche roule pile entre leurs pattes. Le feu prend d'un coup — la meute se disperse en hurlant, aveuglée.",
            "Le feu les tient à distance un instant. Assez pour reprendre ton souffle et choisir ton angle.",
            "La torche s'éteint en tombant. Dans le noir qui suit, tu entends surtout qu'elles, elles voient très bien.",
            "1 naturel. Le feu accroche ta manche avant la meute. Tu combats maintenant deux ennemis. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Trois contre un. Mes chiffres préférés.",
  },
  {
    id: "tunnel-affrontement",
    combat: true,
    foe: "meute-limiers",
    foeName: "La meute de limiers",
    narration: [
      "Ce qu'il reste de la meute se regroupe une dernière fois, plus " +
        "prudente, à distance de ta lame. Elles ont compris que tu mords " +
        "aussi.",
      "L'une d'elles boite, l'œil rivé sur toi malgré tout — la douleur ne " +
        "l'a pas rendue plus lente à décider, seulement plus méchante.",
      "Le silence qui précède leur dernière charge dure une seconde de trop. " +
        "C'est la tienne.",
    ],
    choices: [
      {
        id: "achever",
        label: "Achever la bête blessée",
        risky: {
          stat: "COURAGE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Un seul geste, net. Les survivantes reculent d'un coup, comme si le message venait de passer entre elles sans un bruit.",
            "Elle s'effondre. Les autres marquent un temps d'arrêt — assez long pour que tu gardes l'avantage.",
            "Elle esquive, plus vive que sa blessure ne le laissait croire. Les autres profitent de ta seconde perdue.",
            "1 naturel. Ce n'était pas la plus faible — c'était l'appât. ♦ −2"
          ),
        },
      },
      {
        id: "feinte",
        label: "Feinter pour les disperser",
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Ta feinte les envoie dans trois directions différentes — une meute ne combat pas divisée. Elles s'égaillent dans le noir.",
            "La feinte fonctionne à moitié. Deux se dispersent, la dernière reste, seule face à toi — un combat que tu peux gagner.",
            "Elles ne mordent pas à la feinte. Groupées, elles referment la distance sans se laisser diviser.",
            "1 naturel. Ta feinte les prévient au lieu de les tromper. ♦ −2"
          ),
        },
      },
      {
        id: "tenir",
        label: "Tenir ta position, lame haute",
        risky: {
          stat: "INSTINCT",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tu lis leur charge avant qu'elle ne parte — chaque coup trouve sa gorge, dans l'ordre exact où elles bondissent.",
            "Tu encaisses la charge sans reculer d'un pouce. Elles s'y cassent, une à une.",
            "Ta garde tient, mais de justesse. Le combat traîne, et te coûte plus qu'il ne devrait.",
            "1 naturel. Ta garde s'ouvre à la pire seconde. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Ce qui reste d'une meute compte encore, pour moi.",
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
    id: "geryon",
    combat: true,
    foe: "geryon",
    foeName: "Geryon aux trois gueules",
    narration: [
      "Le couloir débouche sur une arche effondrée, et dessous, une masse " +
        "qui respire par trois gueules distinctes, synchronisées. Geryon. " +
        "Le nom te revient d'un vieux conte que tu croyais inventé pour " +
        "effrayer les enfants.",
      "Il ne bouge pas encore. Il te regarde arriver de ses six yeux, " +
        "patient, comme s'il avait déjà vu cent héros faire exactement les " +
        "mêmes trois pas que toi.",
      "Une des trois têtes bâille — un bâillement qui dure, qui dure, et se " +
        "termine en grondement long comme une porte qu'on ouvre au fond de " +
        "la terre.",
    ],
    choices: [
      {
        id: "affronter",
        label: "Charger entre les trois têtes",
        risky: {
          stat: "COURAGE",
          threshold: 14,
          highStakes: true,
          outcomes: outcomes(
            "20 naturel. Tu passes sous les trois mâchoires au même instant, comme si elles s'étaient elles-mêmes écartées pour te laisser filer.",
            "Tu forces le passage. Une gueule se referme sur ton manteau — tu le laisses derrière, et toi devant.",
            "Une tête te rattrape par l'épaule. Les deux autres se penchent, intéressées, pour la première fois.",
            "1 naturel. Les trois gueules se referment ensemble, sur le même geste. ♦ −2"
          ),
        },
      },
      {
        id: "viser-gorge",
        label: "Viser la gorge du milieu",
        risky: {
          stat: "INSTINCT",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Ton coup trouve le seul point où les trois nerfs se rejoignent. Geryon recule d'un coup, les trois têtes sonnées à la fois.",
            "La gorge du milieu encaisse le coup. Les deux autres têtes, surprises, se tournent l'une vers l'autre — assez pour que tu passes.",
            "Ton coup glisse sur des écailles plus dures que prévu. La tête du milieu, elle, t'a bien vu.",
            "1 naturel. Tu frappes la mauvaise gorge — celle qui ne dormait pas. ♦ −2"
          ),
        },
      },
      {
        // « Jauger » (amende §6, 13/07) : évaluer la menace AVANT de
        // s'engager — jet d'Instinct, l'information est la récompense.
        id: "jauger",
        label: "Jauger la bête avant d'agir",
        risky: {
          stat: "INSTINCT",
          threshold: 10,
          outcomes: outcomes(
            "20 naturel. Tu lis Geryon comme un livre ouvert : la tête de gauche est aveugle, celle du milieu commande, celle de droite ment. Tu sais tout ce qu'il fallait savoir.",
            "Tu prends le temps de regarder. Les trois têtes respirent ensemble — mais celle du milieu décide une demi-seconde avant les autres. C'est là qu'il faudra frapper.",
            "Tu observes trop longtemps. Geryon aussi t'observe — et lui a fini le premier. Les trois têtes se lèvent ensemble.",
            "1 naturel. Ce que tu lis dans ses six yeux, c'est ton propre reflet, déjà à terre. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Geryon a trois têtes, et un seul intérêt : compter combien de héros avant toi. Tu fais beaucoup.",
  },
  {
    // Rencontre ÉPIQUE (amende §6, 13/07) : 3 scènes structurées — montée de
    // tension (ci-dessus) → échange (ici) → climax. Un seul dé, celui du
    // joueur ; l'état du monstre s'exprime par paliers narratifs en prose
    // (« chancelle » → « rugit, blessée » → « s'effondre »), jamais une jauge.
    id: "geryon-2",
    combat: true,
    foe: "geryon",
    narration: [
      "Le premier échange est passé si vite que c'est la douleur qui te le " +
        "raconte, après coup. Geryon pivote sa masse entière — plus agile " +
        "qu'aucun conte ne l'avoue — et la bête chancelle un instant sur " +
        "ses pattes arrière, surprise d'avoir été touchée.",
      "Les trois têtes ne bâillent plus. Elles se déploient en éventail, " +
        "chacune à une hauteur différente, pour ne te laisser aucun angle " +
        "où l'une d'elles ne te voit pas.",
      "L'arche effondrée gémit au-dessus de vous. Quelque chose, dans ce " +
        "combat, va céder avant l'autre — la pierre, la bête, ou toi.",
    ],
    choices: [
      {
        id: "presser",
        label: "Presser l'avantage, coup sur coup",
        risky: {
          stat: "COURAGE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tes coups tombent plus vite que ses trois gueules ne pensent. Geryon rugit, blessé — un son qui fait pleuvoir la poussière de l'arche.",
            "Tu ne lui laisses pas le temps de se reprendre. Une deuxième entaille, profonde. La bête rugit, blessée, et recule d'un pas entier.",
            "Tu presses trop. Une gueule t'attendait exactement là — elle referme sur ton flanc ce que ta hâte lui a offert.",
            "1 naturel. Ton élan te porte pile entre les trois têtes. Elles n'espéraient pas mieux. ♦ −2"
          ),
        },
      },
      {
        id: "user-arche",
        label: "L'attirer sous l'arche qui cède",
        risky: {
          stat: "RUSE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tu recules pas à pas, exactement sous la clef de voûte. Geryon suit — et l'arche entière lui tombe sur l'échine. Le rugissement fait trembler le sol.",
            "La bête suit ton repli. Un bloc de l'arche se détache et lui écrase une épaule — elle rugit, blessée, une tête à moitié sonnée.",
            "Geryon ne suit pas. Il contourne — et c'est toi qui te retrouves sous la pierre qui s'égrène.",
            "1 naturel. L'arche cède, oui. Du mauvais côté. ♦ −2"
          ),
        },
      },
      {
        id: "souffler",
        label: "Rompre, reprendre ton souffle",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu romps au moment exact où les trois gueules frappent ensemble — elles se mordent entre elles. Geryon chancelle, empêtré dans sa propre rage.",
            "Tu recules hors de portée, le souffle retrouvé. La bête tourne en te cherchant — elle saigne plus qu'elle ne veut le montrer.",
            "Ton repli est trop lent d'un pas. Une gueule te raccompagne — sans douceur.",
            "1 naturel. Tu recules dans l'angle mort de personne : les six yeux te suivent. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Il saigne. Ils ne saignent presque jamais. Continue, tu m'intéresses.",
  },
  {
    id: "geryon-3",
    combat: true,
    foe: "geryon",
    narration: [
      "Geryon rugit, blessé — les trois voix à la fois, désaccordées pour la " +
        "première fois. Son sang, noir et lent, dessine sur le sol des " +
        "lettres que tu préfères ne pas lire.",
      "La bête ramasse ce qui lui reste de force pour une dernière charge. " +
        "Tout son poids, toutes ses gueules, une seule direction : toi.",
      "C'est l'instant. Il n'y en aura pas d'autre.",
    ],
    choices: [
      {
        id: "coup-final",
        label: "Porter le coup, au centre",
        risky: {
          stat: "COURAGE",
          threshold: 14,
          highStakes: true,
          outcomes: outcomes(
            "20 naturel. Ta lame entre là où les trois gorges n'en font qu'une. Geryon s'effondre d'un bloc — et le silence qui suit dure cent ans. Le conte, désormais, se racontera avec ton nom dedans.",
            "Tu plonges sous la charge et frappes au centre. La bête s'effondre, ses trois têtes tombant l'une après l'autre, comme des cloches qu'on décroche.",
            "Ta lame touche — mais pas assez profond. La charge te passe dessus, et Geryon, épuisé, se traîne dans l'ombre de l'arche. Vivant. Toi aussi, de peu.",
            "1 naturel. Ta lame se brise sur l'os du poitrail. La charge, elle, ne se brise pas. ♦ −2"
          ),
        },
      },
      {
        id: "esquive-finale",
        label: "Esquiver et laisser la pierre finir",
        risky: {
          stat: "RUSE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tu t'effaces au dernier souffle — la charge emporte Geryon dans les piliers déjà fendus. L'arche entière s'effondre sur lui. Tu n'as plus qu'à écouter.",
            "Tu t'écartes à l'instant juste. La bête s'écrase dans la pierre fendue, et la pierre décide pour vous deux : elle s'effondre.",
            "Ton esquive est courte. La charge te happe à demi et t'envoie rouler dans les gravats — la bête, blessée, se dresse encore.",
            "1 naturel. Tu esquives dans la chute de pierres. ♦ −2"
          ),
        },
      },
      { id: "tenir-terrain", label: "Tenir, lame en avant, sans céder", locked: { stat: "COURAGE" } },
    ],
    jailerLine: "Quel que soit le vainqueur, je gagne : j'aurai quelque chose à raconter.",
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
    id: "grand-registre",
    registre: true,
    narration: [
      "La galerie s'ouvre sur une salle haute dont chaque mur est une " +
        "fresque de noms gravés, du sol au plafond noyé d'ombre. Il y en a " +
        "des milliers. Il y en a trop.",
      "Ce ne sont pas des décorations. Ce sont des comptes. Chaque nom porte " +
        "un nombre de jours et une fin, gravés d'une main patiente qui n'a " +
        "jamais manqué une seule mort.",
      "En t'approchant, tu comprends que la liste se met à jour. Ton propre " +
        "nom est là, quelque part au milieu, encore frais — le compte n'est " +
        "pas clos tant que tu marches.",
    ],
    choices: [
      { id: "lire-registre", label: "Parcourir les noms" },
      { id: "quitter-registre", label: "Quitter la salle sans lire", passive: {
        consequence:
          "Tu détournes les yeux. Certains comptes, on préfère ne pas savoir " +
          "où ils s'arrêtent — surtout le sien. La salle te laisse partir, " +
          "sans insister. Elle sait qu'on revient toujours.",
      } },
    ],
    jailerLine: "Ton nom est déjà gravé. J'ai juste laissé le nombre en blanc.",
  },
  {
    // Le faux choix évident (§18) : l'inscription INVITE explicitement à
    // frapper — c'est l'option « manifestement la bonne ». C'est justement
    // celle dont l'échec est le plus retors (le silence à dents). Instance
    // volontairement RARE et non signalée : le principe reste du contenu, pas
    // une règle mécanique détectable (sinon l'effet s'inverse, cf. Notion).
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
 *
 * Les saisons du Geôlier (§17) : son ton dérive selon l'historique du joueur
 * (posture Amusé / Intéressé / Respectueux, calculée dans player-memory.ts).
 * Amusé = blasé/moqueur (défaut, joueur qui meurt vite) ; Respectueux = un
 * héros qui dure force presque son estime. Jamais un score affiché — ça se
 * ressent uniquement au choix des mots.
 */
export type JailerPosture = "amuse" | "interesse" | "respectueux";

type JailerPools = { fail: string[]; critFail: string[]; critSuccess: string[] };

export const JAILER_BY_POSTURE: Record<JailerPosture, JailerPools> = {
  amuse: {
    fail: [
      "Un {n} ? Même les os du pont ont ri.",
      "J'ajoute ce {n} à ton registre. Il se remplit vite.",
      "Le dé t'a jugé. J'ai cessé de le faire depuis longtemps.",
      "{n}. Le précédent avait fait pareil. J'ai gardé sa besace.",
    ],
    critFail: [
      "Un 1 naturel. Je l'encadrerais, si mes murs étaient à moi.",
      "1. Le dé lui-même a eu pitié — puis non.",
    ],
    critSuccess: [
      "Un 20. Rare. Je note, je n'applaudis pas.",
      "20 naturel. Ne t'y habitue pas.",
    ],
  },
  interesse: {
    fail: [
      "Un {n}. Tu vaux mieux que ça, d'habitude. C'est nouveau, ça, « d'habitude ».",
      "{n}. J'ai fini par retenir ton nom. Ne me le fais pas regretter.",
      "Le dé hésite sur toi, maintenant. Moi aussi.",
    ],
    critFail: [
      "Un 1. De ta part, ça me surprend presque. Presque.",
      "1 naturel. Tiens. Toi qui tenais si bien.",
    ],
    critSuccess: [
      "Un 20. Je commence à comprendre pourquoi tu dures.",
      "20 naturel. Bien. Continue, que je voie jusqu'où.",
    ],
  },
  respectueux: {
    fail: [
      "Un {n}. Même les meilleurs trébuchent. Relève-toi — je regarde.",
      "{n}. Ce n'est pas la fin. Pas pour toi, pas encore.",
      "Le dé s'est trompé de héros. Ça arrive, même ici.",
    ],
    critFail: [
      "Un 1. J'en ai vu mille avant toi. Aucun ne m'avait manqué. Toi, si.",
      "1 naturel. Si tu tombes ici, je retiendrai le jour. Je te le dois.",
    ],
    critSuccess: [
      "Un 20. Voilà pourquoi ton nom monte dans le Registre.",
      "20 naturel. Propre. Tu n'es plus tout à fait un divertissement.",
    ],
  },
};

export function jailerTaunt(result: number, posture: JailerPosture = "amuse"): string {
  const pools = JAILER_BY_POSTURE[posture];
  const pool = result === 1 ? pools.critFail : result === 20 ? pools.critSuccess : pools.fail;
  const line = pool[Math.floor(Math.random() * pool.length)];
  return line.replace("{n}", String(result));
}

/** Compat : anciens exports conservés (posture Amusé), au cas où référencés ailleurs. */
export const JAILER_TAUNTS_FAIL = JAILER_BY_POSTURE.amuse.fail;
export const JAILER_TAUNTS_CRITFAIL = JAILER_BY_POSTURE.amuse.critFail;
export const JAILER_TAUNTS_CRITSUCCESS = JAILER_BY_POSTURE.amuse.critSuccess;

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
