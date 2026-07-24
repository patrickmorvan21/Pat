/**
 * Moteur de contenu — LES LANDES (Acte I, zone gelée 20/07).
 * La réserve de scènes couvre uniquement la zone des Landes (source :
 * data/zones/landes.json + carte Figma 2112:325) et tourne en boucle pour le
 * playtest — la vraie structure Domaine (13 zones, 3 actes, strates
 * anti-répétition) viendra en temps 2. L'ancien contenu générique (Geryon,
 * Rôdeur, meute de limiers…) a été retiré le 20/07 à la demande de Patrick.
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
   * Choix d'orientation d'une scène de liaison (spec 21/07) : ne lance pas de
   * dé — il ENGAGE le déplacement vers le lieu `dest`. Résolution instantanée.
   */
  orient?: { dest: string };
  /**
   * 4e choix contextuel (spec 21/07, point 4) : utiliser un objet ACTIF de la
   * Besace pertinent dans la scène (ex. un baume quand ENTAILLÉ). Consommé,
   * puis la scène se résout. Ajouté dynamiquement, jamais écrit en dur.
   */
  useItem?: { itemId: string };
  /**
   * Prix différé (§17) : ce choix « gratuit » contracte une dette silencieuse
   * qui se règle `settleInSteps` scènes plus loin dans la run.
   */
  debt?: { id: string; settleInSteps: number; text: string };
  /**
   * Objet réel des Landes accordé si ce choix RÉUSSIT (chantier 1 du 23/07) :
   * id d'une entrée de `LANDES_OBJETS`. C'est la variante « choix d'examen » du
   * loot de lieu (`Scene.loot`) — l'objet se gagne, il n'est pas ramassé
   * d'office à l'arrivée. Une seule fois par run, si le slot a de la place.
   */
  grantsLoot?: string;
  /**
   * Le Soupçon (chantier 3 du 23/07) : delta appliqué quand ce choix est PRIS
   * (l'acte compte, pas son issue). Positif = le hameau te remarque (parler au
   * Pendu, refuser le Serment, se faire soigner par le Rebouteux…), négatif =
   * tu rentres dans le rang (jurer, dénoncer un autre…). JAMAIS affiché : le
   * Soupçon ne se lit que dans le monde, par paliers.
   */
  soupcon?: number;
};

export type Scene = {
  id: string;
  /** Plusieurs paragraphes courts (2-4 phrases chacun), pas des pavés — chacun type séparément dans le fil. */
  narration: string[];
  /** Asset tramé de la scène (public/assets/…). Défaut : portail. Temps 2 : varier par contexte. */
  illustration?: string;
  /**
   * Objet RÉEL des Landes ancré à ce lieu (chantier 1 du 23/07) : id d'une entrée
   * de `LANDES_OBJETS`. Ramassé une seule fois à l'arrivée, si le slot (actif ou
   * passif) a de la place. Rend les objets réels, portables, placés — plus de
   * simples soins génériques.
   */
  loot?: string;
  /**
   * Le Soupçon (chantier 3 du 23/07) : delta appliqué à l'ARRIVÉE dans ce lieu
   * (ex. être vu près des potences). Silencieux, comme tout le Soupçon.
   */
  soupconOnArrival?: number;
  /**
   * Procès du héros (Soupçon au dernier palier) : sur cette scène, un jet RATÉ
   * tue — mort par fixation, purement sociale, traitée comme toutes les morts
   * (relique + fragment + épitaphe). Un jet réussi fait retomber le Soupçon.
   */
  fixationTrial?: boolean;
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
   * réel. Un compte à rebours VISUEL (érosion/pulsation, jamais un timer
   * chiffré) ; si le joueur ne choisit pas à temps, la situation évolue et de
   * NOUVELLES options s'ouvrent (l'inaction est elle-même un choix).
   * ⚠️ `ms` ne descend JAMAIS sous 6000 (règle Patrick 14/07).
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
  /**
   * Traversée (spec 21/07) : phrase sensorielle d'orientation affichée sur le
   * bouton d'une scène de liaison qui mène à ce lieu (« vers la crête où
   * grincent les cordes »). Ne révèle jamais un danger frontalement — c'est
   * l'habitat du « Vent qui ment ».
   */
  approach?: string;
  /**
   * Chaîne de rencontre (spec 21/07) : id de la scène suivante à jouer SANS
   * repasser par une liaison (ex. meute-grise-1 → meute-grise-2). Une chaîne
   * compte pour UN seul lieu de la traversée.
   */
  chainNext?: string;
  /** Scène de liaison (spec 21/07) : marche + choix d'orientation, générée. */
  liaison?: boolean;
  /** Nœud terminal (la Descente) : la traversée s'arrête (fin sèche Acte II). */
  terminal?: boolean;
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
    // Scène 0 — l'entrée de zone. Le crépuscule éternel et le bruit écrit
    // (« quelque part, une corde grince ») se posent ici, une fois pour toutes.
    id: "borne-frontiere",
    illustration: "assets/scene_transition_borne_sud_a.png",
    narration: [
      "La lande s'ouvre sous un crépuscule qui ne tombe pas. La lumière " +
        "reste prise entre chien et loup, comme un souffle retenu. Quelque " +
        "part, une corde grince.",
      "Au bord du chemin, une borne de pierre penche sous les offrandes : " +
        "bouts de pain durci, rubans, clous tordus. On paie ici pour entrer. " +
        "Ou pour qu'on vous laisse ressortir.",
    ],
    choices: [
      {
        id: "fouiller-offrandes",
        label: "Fouiller les offrandes",
        // L'objet vit dans le choix d'examen (23/07) : fouiller ET réussir
        // rapporte les Offrandes — les prendre est un acte, pas un ramassage.
        grantsLoot: "offrandes-borne",
        risky: {
          stat: "RUSE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Sous le pain moisi, une pierre plate gravée d'un pas — une Pierre de Retour. Ceux qui la déposent reviennent, dit-on. Celle-ci n'a jamais été réclamée.",
            "Tes doigts trient sans déranger. Un clou tordu, une mèche de cheveux — et le sens de tout ça : on n'offre pas par foi, ici. On offre par peur. Bon à savoir.",
            "Un ruban glisse et tout l'édifice s'éboule. Le vent se lève d'un coup, bref, comme une inspiration — la lande a noté que tu prends sans donner.",
            "1 naturel. Sous les offrandes, une main à plat, paume ouverte. Elle attendait la tienne. ♦ −2"
          ),
        },
      },
      {
        id: "ecouter-voix",
        label: "Écouter, immobile",
        // Le silence comme vraie option (§19) : les Voix Basses ne parlent
        // qu'à ceux qui se taisent d'abord.
        passive: {
          consequence:
            "Tu ne touches à rien. Tu écoutes. Sous le vent, il y a des voix " +
            "— basses, à ras de bruyère, qui se passent le mot de ton " +
            "arrivée. Elles ne te menacent pas. Elles préviennent quelqu'un. " +
            "Au moins, maintenant, tu sais que la lande parle.",
        },
      },
      { id: "repondre-voix", label: "Répondre aux voix", locked: { stat: "EMPATHIE" } },
    ],
    jailerLine: "Les Landes. 8 941 entrées, cette saison. Les sorties, je les compte sur une autre page.",
  },
  {
    id: "chemin-creux",
    narration: [
      "Le chemin s'enfonce entre deux talus plus hauts que toi. On y marche " +
        "vu sans voir : la lande entière te regarde passer, et toi tu ne vois " +
        "que de la terre.",
      "Un homme vient en sens inverse — à reculons. Il marche vite, sûr de " +
        "ses pas, les yeux fixés sur ce qu'il fuit. Derrière lui, à terre, un " +
        "grelot de charretier. Sans charrette nulle part.",
    ],
    choices: [
      {
        id: "aborder-marcheur",
        label: "Aborder le marcheur",
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Il s'arrête — première fois depuis des jours, ça se voit à ses jambes. « Ne regarde jamais le fond du chemin », souffle-t-il. Puis il repart, à reculons, presque léger de l'avoir dit.",
            "Il ne s'arrête pas, mais il parle en passant : « Ça suit ceux qui suivent le chemin. Coupe par la lande. » Son regard, lui, ne quitte jamais le fond du creux.",
            "Tu poses la main sur son bras. Il hurle sans te voir — pour lui, tu es arrivé par-derrière. Le cri roule loin dans le creux, et quelque chose, au fond, change de rythme.",
            "1 naturel. Il te dévisage enfin — et recule plus vite. Ce qu'il fuyait, c'est ce qui marche derrière toi. ♦ −2"
          ),
        },
      },
      {
        id: "prendre-grelot",
        label: "Ramasser le grelot",
        // Prix différé (§17) : l'objet est gratuit — mais un grelot, ça sonne.
        debt: {
          id: "grelot-charretier",
          settleInSteps: 3,
          text:
            "Au fond de ta poche, le grelot du charretier se met à sonner. " +
            "Tout seul. Trois coups clairs, comme un signal convenu — et " +
            "quelque part dans la lande, quelque chose se met en marche pour " +
            "honorer le rendez-vous.",
        },
      },
      {
        id: "couper-lande",
        label: "Couper par la lande",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tes pieds trouvent une sente que la bruyère cachait — un chemin de braconnier, tracé par quelqu'un qui savait exactement ce qu'il évitait. Tu sais maintenant le reconnaître.",
            "Tu grimpes le talus et marches à découvert. La lande te voit — mais rien ne te suit. Le chemin creux, en dessous, continue sans toi.",
            "La bruyère s'accroche, le sol boit tes pas. Quand tu redescends dans le creux, essoufflé, tu n'as gagné que le sentiment d'avoir été observé tout du long.",
            "1 naturel. La lande n'est pas plate. Elle respire. Et tu marches dessus. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Le chemin creux. Ceux qui l'ont creusé n'avaient pas de pelles.",
  },
  {
    // Première rencontre volontairement précoce (3e scène) — anecdotique,
    // une seule scène (amende §6 : durée par poids narratif).
    id: "bete-chemins-creux",
    illustration: "assets/monstre_bete_chemins_creux_a.png",
    combat: true,
    foe: "bete-chemins-creux",
    foeName: "La Bête des Chemins Creux",
    narration: [
      "Le creux tourne — et l'odeur arrive avant la chose : suint, terre " +
        "retournée, vieux cuir. Une masse se décolle du talus, longue, basse, " +
        "taillée pour courir exactement entre deux murs de terre.",
      "Pas de gueule visible. Juste une avancée du corps qui s'ouvre. La " +
        "Bête ne chasse que dans le creux — c'est son couloir, son terrier, " +
        "sa table. Et tu es dessus.",
    ],
    choices: [
      {
        id: "frapper-bete",
        label: "Frapper la bête",
        risky: {
          stat: "COURAGE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Ta lame entre là où le corps s'ouvrait — la Bête se referme sur son propre cri. Elle reflue dans le talus comme une eau sale, et le creux est à toi.",
            "Le coup porte. La Bête se plie, surprise qu'on morde en premier, et s'enterre à mi-corps dans le talus. Tu passes. Elle ne suit pas — pas blessée à ce point, mais vexée, oui.",
            "Ta lame racle du cuir sans entamer. L'avancée du corps te cueille à l'épaule et te plaque au talus — tu te dégages en y laissant du tien, et elle te laisse passer, servie.",
            "1 naturel. Tu frappes dans l'ouverture. C'est exactement ce qu'elle voulait. ♦ −2"
          ),
        },
      },
      {
        id: "grimper-talus",
        label: "Bondir hors du creux",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu es sur le talus avant qu'elle n'ait fini son élan. Hors du creux, elle n'existe plus : la masse freine pile à la limite de l'ombre, comme au bout d'une chaîne. Tu marches au-dessus d'elle, tranquillement.",
            "Tes mains trouvent les racines, tes pieds la terre ferme. La Bête passe en dessous, longue à n'en plus finir — mais elle ne monte pas. Elle ne monte jamais.",
            "Le talus s'éboule sous ta prise. Tu retombes dans le creux, à demi — et la Bête prend sa part de la jambe qui traînait encore.",
            "1 naturel. Tu bondis. Le talus aussi était la Bête. ♦ −2"
          ),
        },
      },
      {
        id: "ornière",
        label: "Se plaquer, immobile",
        // La Bête chasse le mouvement dans l'axe du creux — l'immobilité
        // est une vraie réponse (§19).
        passive: {
          consequence:
            "Tu te coules dans l'ornière, face contre terre. La masse passe " +
            "au-dessus de toi — un pont de cuir et de suint, interminable. " +
            "Elle cherche ce qui court, pas ce qui gît : la lande est pleine " +
            "de gisants, elle a l'habitude. Quand le silence revient, tu " +
            "recraches de la terre et tu marches.",
        },
      },
    ],
    jailerLine: "La Bête ne quitte jamais son creux. C'est ce que je respecte chez elle : elle connaît sa cage.",
  },
  {
    // Lieu-signature de la zone. L'écharde pose le flag d'environnement
    // persistant (§17) relu à l'ouverture des runs suivantes.
    id: "colline-aux-gibets",
    illustration: "assets/scene_colline_aux_gibets_c.png",
    loot: "echarde-gibet",
    soupconOnArrival: 1, // être vu près des potences (chantier 3)
    narration: [
      "La colline monte seule au milieu de la lande, couronnée de gibets. " +
        "Tous occupés, tous immobiles — sauf un. Au centre, le plus grand " +
        "est vide. Sa corde pend, usée en son milieu, et son ombre s'étale " +
        "au sol sans que rien ne la porte.",
      "Sur les potences, des corbeaux. Ils ne crient pas. Ils comptent — " +
        "tu le sais à la façon dont, à ton arrivée, toutes les têtes se sont " +
        "tournées d'un cran.",
    ],
    choices: [
      {
        id: "echarde",
        label: "Arracher une écharde",
        setsEnvFlag: "echarde-gibet-prelevee",
        risky: {
          stat: "COURAGE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Le bois vient sans résister — il se donne. L'écharde est tiède dans ta paume, et la corde, au-dessus, cesse de grincer. Le Gibet Vide t'a pris en compte.",
            "Tu détaches une longue écharde du montant. Le bois est doux, poli par des mains — combien de mains ? L'ombre au sol frémit, mais ne bouge pas vers toi.",
            "Le bois crie sous ta lame — un son de gorge, pas de fibre. Les corbeaux décomptent un cran, tous ensemble. Tu emportes l'écharde, mais la colline emporte quelque chose de toi.",
            "1 naturel. L'écharde t'entre dans la paume. Profond. C'est le gibet qui prélève. ♦ −2"
          ),
        },
      },
      {
        id: "compter-corbeaux",
        label: "Compter les corbeaux",
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Quarante-neuf. Le cinquantième perchoir est vide, juste au-dessus du Gibet Vide. Ils gardent la place de quelqu'un — et à la façon dont ils te fixent, tu sais que ce n'est pas la tienne. Pas encore.",
            "Tu comptes. Ils te laissent faire, flattés — personne ne compte les compteurs. Le plus vieux incline la tête : un salut de confrère.",
            "Tu perds le compte à trente-trois. Ils le savent. Toute la rangée se met à décompter à rebours, bec fermé, et tu préfères ne pas savoir vers quoi.",
            "1 naturel. Tu comptes les corbeaux. Les corbeaux, eux, ont fini de te compter. ♦ −2"
          ),
        },
      },
      { id: "ombre", label: "Traverser l'ombre", locked: { stat: "INSTINCT" } },
    ],
    jailerLine: "Le Gibet Vide n'est pas vide. Il est réservé.",
  },
  {
    // Le gardien-jalon de la zone (spec « mémoire des gardiens » : Intact →
    // Balafré → Rompu — la mémoire inter-runs viendra avec le système ; la
    // scène pose l'identité). Pas un combat : le Bailli pendu JUGE.
    id: "pendu-qui-parle",
    illustration: "assets/monstre_pendu_qui_parle_a.png",
    foe: "bailli-pendu",
    narration: [
      "Au revers de la colline, un gibet bas, à hauteur d'homme. Le pendu " +
        "qui s'y balance ouvre les yeux à ton approche. Chaîne de fonction " +
        "au cou, sous la corde. Un sceau au poing. Le Bailli des Landes — " +
        "pendu le dernier, à la place d'honneur.",
      "« Approche », dit-il, et la corde grince sur chaque syllabe. « Tout " +
        "ce qui entre dans mes Landes passe en jugement. Toi aussi. » Il " +
        "sourit. « Surtout toi. »",
    ],
    choices: [
      {
        id: "plaider",
        label: "Répondre à son jugement",
        // Parler au Pendu = parler seul face au sud, pour qui t'observe —
        // premier signe de l'Ordonnance (chantier 3).
        soupcon: 1,
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu ne plaides pas — tu lui retournes la question : qui l'a jugé, lui ? Le sourire du Bailli se fige. Pour la première fois depuis sa corde, c'est lui l'accusé. Il te laisse passer, et il te doit une réponse.",
            "Tu réponds droit, sans baisser les yeux. Le Bailli t'écoute en balançant doucement — le grincement fait office de greffier. « Passable », conclut-il. Dans sa bouche, c'est un acquittement.",
            "Tu te défends trop. Le Bailli savoure chaque excuse : « Coupable, donc. Ils s'excusent tous. » Sa sentence te suit dans la lande, écrite quelque part où tu ne peux pas la lire.",
            "1 naturel. Tu plaides. Il te coupe : « J'ai déjà jugé ce plaidoyer. Mot pour mot. Tu n'es même pas le premier toi. » ♦ −2"
          ),
        },
      },
      {
        id: "decrocher",
        label: "Trancher sa corde",
        soupcon: 1, // toucher à une Fixation, sous les yeux de la colline
        risky: {
          stat: "COURAGE",
          threshold: 14,
          highStakes: true,
          outcomes: outcomes(
            "20 naturel. Ta lame tranche net. Le Bailli tombe à genoux — et reste là, stupéfait de peser. « Personne n'avait osé », dit-il sans grincement, et sa voix nue est celle d'un homme. Il te regarde partir comme on regarde une loi nouvelle.",
            "La corde cède. Le Bailli s'écrase dans la bruyère, se relève en titubant — et remonte s'asseoir sur la traverse, dignité de fonction. Mais vous savez tous les deux ce que tu as fait. La colline aussi.",
            "Ta lame entame la corde — qui se resserre, vivante, et te fouette au visage. Le Bailli rit à s'étrangler, ce qui ne lui coûte rien : « On ne défait pas une Fixation, petit juge. On la subit. »",
            "1 naturel. La corde tranche plus vite que toi. Pas la sienne : une autre, tombée de nulle part, qui t'a mesuré le cou au passage. ♦ −2"
          ),
        },
      },
      {
        id: "passer-pendu",
        label: "Passer sans un mot",
        passive: {
          consequence:
            "Tu passes. Le Bailli ne te rappelle pas — il note. Tu l'entends " +
            "murmurer ton signalement à la corde, qui grince en l'écrivant. " +
            "Refuser le jugement, ici, c'est un verdict aussi. Il t'attendra " +
            "au retour : les Landes tournent en rond.",
        },
      },
    ],
    jailerLine: "Le Bailli me plaît. Il a compris avant toi : un jugement, ça ne s'esquive pas. Ça s'ajourne.",
  },
  {
    id: "champ-des-fixes",
    illustration: "assets/scene_champ_des_fixes_c.png",
    loot: "carnet-fossoyeur",
    narration: [
      "Derrière la colline, des rangées de poteaux à perte de vue, chacun " +
        "son pendu, chacun son écriteau. Un cimetière debout. On n'enterre " +
        "pas, ici : on fixe. Les morts tiennent mieux le sol que les vivants.",
      "Entre les rangs, un vieil homme redresse un poteau qui penche, avec " +
        "des gestes de jardinier. Plus loin, au bout d'une corde trop " +
        "courte, une petite fille pend sans se balancer. Elle te suit des " +
        "yeux. Les autres regardent tous droit devant. Pas elle.",
    ],
    choices: [
      {
        id: "aider-fossoyeur",
        label: "Aider à redresser",
        risky: {
          stat: "EMPATHIE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. À deux, le poteau se dresse droit. Le Fossoyeur te toise, longuement : « T'es le premier qui aide sans qu'on le fixe. » Il te glisse une page arrachée de son carnet — un plan des rangs, et une croix là où il ne faut jamais passer.",
            "Le poteau retrouve son aplomb. Le pendu là-haut soupire — de confort, dirait-on. « Ils dorment mal quand ça penche », dit le Fossoyeur. Il te fait signe de passer par son rang : le sien est sûr.",
            "Le poteau t'échappe et le pendu chasse au bout de sa corde, dans un grand désordre de chanvre. Tout le rang se met à osciller de proche en proche. Le Fossoyeur te chasse à gestes secs : tu as réveillé le dortoir.",
            "1 naturel. Le poteau tombe. Le pendu, lui, reste debout. ♦ −2"
          ),
        },
      },
      {
        id: "regard-petite",
        label: "Suivre son regard",
        risky: {
          stat: "INSTINCT",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Elle ne te regarde pas, toi — elle regarde derrière toi, depuis le début. Tu te retournes à l'instant juste : une silhouette reflue entre les rangs, prise en faute. La petite cligne des yeux, une fois. De rien.",
            "Son regard glisse vers un poteau du troisième rang, insistant. À son pied, à demi enterré : un petit cheval de bois, usé au poli. Elle ne peut pas le montrer autrement. Tu le redresses face à elle, et ses yeux se ferment.",
            "Tu suis son regard — il t'emmène en cercle, de rang en rang, jusqu'à revenir sur toi. Le temps de comprendre qu'elle t'a promené, la lumière a bougé et tu ne sais plus par où tu es entré.",
            "1 naturel. Elle regarde tes pieds. Là où tu es, exactement, le sol est plus meuble. Un trou de poteau. Fraîchement creusé. ♦ −2"
          ),
        },
      },
      { id: "carnet", label: "Déchiffrer le carnet", locked: { stat: "RUSE" } },
    ],
    jailerLine: "Un champ entier de fixés, et c'est toi qui bouges encore. Profites-en, ça fausse mes moyennes.",
  },
  {
    id: "pendu-mal-fixe",
    illustration: "assets/monstre_pendu_mal_fixe_a.png",
    combat: true,
    foe: "pendu-mal-fixe",
    foeName: "Le Pendu Mal Fixé",
    narration: [
      "Un craquement sec dans les rangs — un poteau vient de casser. Le " +
        "pendu qui le quittait touche terre sur ses pieds, comme s'il " +
        "n'attendait que ça depuis des années. Sa corde traîne derrière lui, " +
        "encore nouée au cou.",
      "Il avance par à-coups, tiré par des ficelles que personne ne tient. " +
        "Une Fixation ratée : ni mort ni tenu. Ce qui reste de son visage " +
        "n'exprime qu'une chose — l'envie féroce d'échanger sa place. " +
        "Contre la tienne.",
    ],
    choices: [
      {
        id: "refixer",
        label: "Le repousser au poteau",
        risky: {
          stat: "COURAGE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tu l'empoignes par sa propre corde et le ramènes au poteau brisé — où il se rependt de lui-même, docile soudain, presque soulagé qu'on décide pour lui. Le champ entier expire. Le Fossoyeur, au loin, te salue du chapeau.",
            "Tu le repousses, pas à pas, jusqu'aux rangs. Au contact du bois cassé, ses jambes cèdent : la Fixation le reprend à moitié. Assez pour qu'il ne te suive plus. Il te regarde partir avec une envie terrible.",
            "Il est plus lourd qu'un mort n'a le droit de l'être. Vous roulez dans la bruyère — il te tient, tu le tiens, et c'est la corde qui vous départage : elle te cingle, et tu lâches le premier.",
            "1 naturel. Tu le pousses au poteau. Il t'y pousse aussi. La corde, elle, ne fait pas de différence entre deux cous. ♦ −2"
          ),
        },
      },
      {
        id: "esquiver-corde",
        label: "Esquiver la corde",
        risky: {
          stat: "INSTINCT",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu lis la corde comme un fouet : elle frappe où il regarde, une seconde après. Tu n'es jamais là. Épuisé d'avoir raté, le Pendu s'effondre en tas de ficelles — la Fixation ne paie pas les heures supplémentaires.",
            "La corde siffle, tu plies, elle passe. Deux fois, trois fois. À la quatrième, il s'emmêle dedans tout seul — et tu t'éloignes pendant qu'il se défait, jurant dans une langue de gorge broyée.",
            "La corde feinte — elle claque au sol et remonte en fouet. Elle te prend la cheville et te couche dans la bruyère ; tu te dégages en taillant, mais il t'a coûté du sang et du terrain.",
            "1 naturel. Tu esquives la corde. Pas lui. Ses mains, on les oublie toujours. ♦ −2"
          ),
        },
      },
      {
        id: "emmeler",
        label: "L'emmêler dans sa corde",
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu tournes autour de lui comme un fuseau — deux passes, un nœud, et le Pendu se retrouve fixé à lui-même, bras au corps. La plus propre Fixation du champ. Le Fossoyeur en parlera longtemps.",
            "Tu attrapes le bout traînant et le fais passer sous ses jambes au bon moment. Il trébuche, s'entrave, tombe — et chaque geste pour se relever le ligote un peu plus. Tu pars sans te presser.",
            "Le nœud que tu improvises tient une seconde de trop peu. Il s'en libère d'une secousse — et la corde, insultée qu'on la retourne contre lui, te choisit comme cible prioritaire.",
            "1 naturel. Tu tires sur la corde. Elle était plus longue que tu croyais. Assez longue pour deux. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Une Fixation ratée. Ça arrive. Mes contrats à moi ne ratent jamais — demande au Bailli.",
  },
  {
    // Entrée du Hameau — la particularité de zone (le Serment) se joue ici.
    // Les Renonçants EXIGENT, ils ne proposent pas. Tenu jusqu'à la sortie =
    // récompense ; rompu = le Geôlier s'en souvient (jurer faux = dette §17).
    id: "serment-hameau",
    illustration: "assets/monstre_juge_de_cendre_c.png",
    narration: [
      "Des murets de pierre sèche, des toits bas, pas une flamme : le Hameau " +
        "des Renonçants. Sur le seuil du premier muret, une vieille femme " +
        "barre le passage, paumes ouvertes — pas en accueil. En douane.",
      "« Ici, on renonce », dit la Doyenne. « Chacun laisse une chose au " +
        "muret : son nom, sa hâte, sa lame ou sa langue. Jure d'en laisser " +
        "une, et tiens parole jusqu'à la sortie des Landes. » Derrière elle, " +
        "le hameau entier attend, aux fenêtres sans lumière. Ce n'est pas " +
        "une proposition.",
    ],
    choices: [
      {
        id: "jurer-serment",
        label: "Jurer : laisser sa hâte",
        soupcon: -1, // tenir le rang des Renonçants apaise le hameau
        passive: {
          consequence:
            "Tu poses les mains sur la pierre sèche et tu jures : ta hâte " +
            "reste au muret. Le mot pèse tout de suite — tes pas se font " +
            "plus lents, plus sûrs, comme si la lande cessait de te courir " +
            "après. La Doyenne s'écarte. « Tenu jusqu'à la sortie », " +
            "rappelle-t-elle. Le hameau entier a entendu. Et plus haut que " +
            "le hameau, quelqu'un d'autre.",
        },
      },
      {
        id: "jurer-faux",
        label: "Jurer du bout des lèvres",
        soupcon: 1, // un serment creux, dans les Landes, ça s'entend
        // Jurer sans intention de tenir : gratuit à l'entrée — mais un
        // serment creux, dans les Landes, ça s'entend (prix différé §17).
        debt: {
          id: "serment-creux",
          settleInSteps: 4,
          text:
            "Le serment que tu as prêté du bout des lèvres au muret des " +
            "Renonçants se rappelle à toi : ta bouche, d'un coup, refuse un " +
            "mot — un seul, celui dont tu avais justement besoin. Les " +
            "serments creux se paient en paroles pleines. Quelque part, la " +
            "Doyenne hoche la tête sans surprise.",
        },
      },
      {
        id: "refuser-serment",
        label: "Refuser et longer",
        soupcon: 1, // refuser le Serment, c'est se faire remarquer
        risky: {
          stat: "COURAGE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tu refuses, à voix haute et claire. Un silence — puis la Doyenne incline la tête, presque un sourire : « Enfin un qui ne ment pas. » Le refus franc, ici, vaut tous les serments. On te laisse le tour du hameau, et le respect avec.",
            "Tu contournes par l'extérieur des murets, sous tous les regards sans lumière. Personne ne t'arrête : on ne force pas, ici, on retient. Tu passes — mais aucune porte du hameau ne s'ouvrira pour toi.",
            "À mi-tour, les murets se resserrent — tu jurerais qu'ils n'étaient pas si hauts. Tu finis par enjamber, sous les yeux de la Doyenne qui n'a pas bougé. « Il reviendra jurer », dit-elle à personne. Le pire, c'est qu'elle a l'air sûre.",
            "1 naturel. Tu refuses de renoncer à quoi que ce soit. La lande, elle, ne t'a pas demandé ton avis : au premier faux pas, elle te prend ce que tu refusais de donner. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Les Renonçants me régalent : des gens qui se punissent tout seuls. Je n'ai presque rien à faire.",
  },
  {
    id: "marche-muet",
    illustration: "assets/scene_marche_muet_c.png",
    narration: [
      "Au cœur du hameau, un marché sans un cri. Des étals de trois fois " +
        "rien — clous, laine, racines — et des marchands qui négocient par " +
        "gestes, paumes et hochements. Renoncer à la parole est le " +
        "renoncement le plus courant. Le moins cher.",
      "Au bout de la rangée, un étal différent : bric-à-brac d'ailleurs, " +
        "objets qui n'ont rien à faire dans une lande. Le Colporteur te " +
        "regarde venir de loin — et te reconnaît. C'est impossible. Il te " +
        "fait signe quand même, comme à un client de longue date.",
    ],
    choices: [
      {
        id: "troc-colporteur",
        label: "Troquer au Marché",
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Vous marchandez par gestes, et tu gagnes l'échange — il en rit sans bruit, beau joueur. Dans ta paume : une boussole dont l'aiguille pointe non pas le nord, mais la sortie. « À la prochaine », articule-t-il en silence. La prochaine quoi ?",
            "L'échange se fait : trois clous et un souvenir contre un petit paquet de toile cirée. Dedans, de quoi tenir — du sûr, du sec. Le Colporteur tape deux doigts sur sa tempe : marché honnête, mémoire honnête.",
            "Tu offres trop tôt, il le voit trop bien. L'échange se conclut à ton désavantage — un objet brillant et creux contre du solide. Son sourire s'excuse presque : les règles sont les règles, même muettes.",
            "1 naturel. Tu tends la main vers l'étal. Il la serre — et te rend ta propre bourse, que tu n'avais pas vue partir. Leçon offerte, dit son sourire. La leçon seulement. ♦ −2"
          ),
        },
      },
      {
        id: "rebouteux",
        label: "Montrer tes plaies",
        soupcon: 1, // se faire soigner par le Rebouteux, ça se remarque
        risky: {
          stat: "EMPATHIE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Le Rebouteux te palpe comme on lit une lettre, hoche la tête — et remet en place quelque chose que tu ne savais pas déplacé. La douleur s'éteint d'un coup, comme soufflée. Il refuse ton paiement : tu diras juste, dehors, qu'ici on répare encore.",
            "Ses mains sont dures et savantes. Ça craque, ça brûle, puis ça va mieux — nettement. Il désigne ta poitrine, puis la lande, puis fait « non » du doigt : ce qu'il a resserré tiendra, à condition de ne pas courir.",
            "Il t'examine, puis recule d'un pas et te montre sa paume : refus. Tu ne sauras pas si c'est ta blessure qui le dépasse ou quelque chose qu'il a lu dessous — mais il ne te touchera pas, et son regard t'accompagne longtemps.",
            "1 naturel. Ses mains s'arrêtent net sur ta nuque. Il retire les siennes très lentement, comme d'un piège à loup. Ce qu'il a senti là, il ne l'a pas soigné. Il l'a salué. ♦ −2"
          ),
        },
      },
      {
        id: "traverser-marche",
        label: "Traverser sans offrir",
        passive: {
          consequence:
            "Tu traverses les étals sans un geste, mains visibles, et le " +
            "marché te laisse passer — on respecte, ici, ceux qui ne " +
            "prennent rien. Seul le Colporteur te suit des yeux jusqu'au " +
            "bout de la rangée, déçu comme devant une vieille habitude " +
            "manquée. Il tapote son étal : à la prochaine fois. Il a l'air " +
            "sûr qu'il y en aura une.",
        },
      },
    ],
    jailerLine: "Le Colporteur ? Un confrère, en plus petit. Lui aussi fait commerce de ce que vous laissez derrière.",
  },
  {
    // Campement de zone : le Moulin sans Ailes. L'id reste « campement »
    // (Scene.tsx exclut cet id du soin aléatoire d'exploration).
    id: "campement",
    illustration: "assets/scene_moulin_sans_ailes_c.png",
    narration: [
      "À l'écart du hameau, un moulin sans ailes tient debout par habitude. " +
        "Dedans, la meule est froide, le sol sec, et quelqu'un a laissé un " +
        "lit de bruyère tassée — plusieurs fois refait, jamais brûlé. Un " +
        "refuge qui sert, donc un refuge qui marche.",
      "Par la lucarne, le crépuscule ne bouge pas. On dit qu'une fille " +
        "dort ici, parfois — la seule pendue qui se soit relevée. Le lit de " +
        "bruyère garde une forme légère, comme un creux encore tiède.",
    ],
    choices: [
      { id: "dormir", label: "Dormir malgré le crépuscule", rest: true },
      {
        id: "garde",
        label: "Monter la garde",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu dors d'un œil — et cet œil la voit : une silhouette entre sans bruit, une corde coupée au cou, s'assoit près de la meule et te veille, toi. À ton réveil, une marque de main dans la poussière : merci pour la place.",
            "Ton demi-sommeil filtre les bruits de la lande. Rien n'entre. Le repos est mince, mais il est à toi — et le creux du lit de bruyère, au matin, n'a pas changé de forme.",
            "Tu sombres sans le décider. Au réveil, la porte est ouverte — tu l'avais calée — et sur la meule, quelqu'un a posé une fleur de bruyère. Tu n'es pas sûr que ce soit un cadeau.",
            "1 naturel. Tu rêves qu'on te veille. Tu te réveilles : c'est vrai. Elle est penchée sur toi, sa corde coupée pendant à ton front — puis plus rien, la porte battante, et ton cœur qui compte tout seul. ♦ −2"
          ),
        },
      },
      { id: "repartir", label: "Repartir sans s'attarder" },
    ],
    jailerLine: "Dors. Le crépuscule ne tombera pas, mais toi, un jour, oui. J'aime comparer.",
  },
  {
    id: "chapelle-des-cordes",
    illustration: "assets/scene_chapelle_des_cordes_d.png",
    loot: "brin-chanvre",
    narration: [
      "La chapelle du hameau n'a ni croix ni autel. Aux murs, des cordes — " +
        "des dizaines, clouées en boucles soigneuses, chacune sous un nom " +
        "gravé. Les reliques des Fixations réussies. Certaines bougent " +
        "doucement, sans courant d'air.",
      "Une femme en noir refait sans fin le même nœud au pied du mur. Et " +
        "dans une niche à part, sous verre : une corde coupée net, sans nom. " +
        "La seule de toute la chapelle qui n'a pas tenu.",
    ],
    choices: [
      {
        id: "corde-coupee",
        label: "Prendre la corde coupée",
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Le verre pivote sans bruit — la niche n'était pas verrouillée. Elle attendait. La corde coupée s'enroule d'elle-même autour de ton poignet, légère, tiède : une relique qui a choisi son porteur. Au mur, toutes les autres cordes se figent.",
            "Tu soulèves le verre, tu prends la corde. Elle ne pèse rien — tout ce qu'elle devait retenir s'est relevé et marche encore. La Veuve, au fond, ne se retourne pas. Mais son nœud, pour la première fois, change de forme.",
            "Le verre t'échappe et sonne sur la dalle. La Veuve est sur toi en trois pas, sans courir — et les cordes du mur se tendent toutes vers toi, d'un même mouvement. Tu sors avec la corde, mais la chapelle entière connaît ton visage.",
            "1 naturel. Tu saisis la corde coupée. Une autre corde, au mur, te saisit le poignet — la Fixation est un métier de patience, et il en pendait une au-dessus de la niche depuis toujours, pour les gens comme toi. ♦ −2"
          ),
        },
      },
      {
        id: "prier-veuve",
        label: "Prier près de la Veuve",
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu t'agenouilles et tu refais son nœud avec elle, geste pour geste. À la dernière boucle, ses mains s'arrêtent — finies, après tant d'années. Elle te regarde, et te donne le seul secret qui vaille ici : le nom que la corde coupée refusait de porter.",
            "Tu prends le bout de corde qu'elle te tend et tu suis. Le nœud qu'elle t'apprend n'attache rien — il retient quelqu'un de partir dans sa tête. Elle te tapote la main : tu sauras le refaire, quand tu en auras besoin. Tu espères que non.",
            "Tu t'agenouilles trop près. Ses mains ne s'arrêtent pas, mais son nœud change — et tu reconnais la forme, maintenant : c'est un nœud coulant à ta taille de cou. Tu te relèves sans brusquerie. Elle sourit au mur.",
            "1 naturel. Tu pries avec elle. Elle prie pour toi. Au mur, un clou libre attend déjà, sous un espace sans nom — plus pour longtemps, dit son nœud. ♦ −2"
          ),
        },
      },
      { id: "corde-vive", label: "Saisir la corde vive", locked: { stat: "COURAGE" } },
    ],
    jailerLine: "Une chapelle de cordes. Les hommes prient ce qui les tient. Je trouve ça d'une honnêteté rare.",
  },
  {
    id: "puits-condamne",
    illustration: "assets/scene_puits_condamne_c.png",
    narration: [
      "Sur la place arrière du hameau, un puits — condamné de frais : " +
        "planches neuves, chaînes croisées, cadenas encore gras. Tout le " +
        "reste du hameau tombe en ruine douce, mais ça, on l'entretient.",
      "Et dessous, ça cogne. Trois coups, une pause. Trois coups. Poli, " +
        "presque — comme on frappe à une porte dont on sait qu'on va vous " +
        "ouvrir. Les planches, au dernier coup, ont bougé.",
    ],
    // La scène qui se résout sans toi (§18) : les chaînes ne tiendront pas
    // ta décision bien longtemps. ⚠️ jamais sous 6000 ms (règle 14/07).
    timed: {
      ms: 7000,
      timeoutNarration:
        "Tu hésites une seconde de trop. Le dernier coup fait sauter le " +
        "cadenas — et des mains passent entre les planches. Des mains " +
        "seulement : grises, patientes, par dizaines, qui palpent l'air et " +
        "les chaînes. Jamais un corps. Elles ne sortent pas — elles " +
        "cherchent quelque chose à faire entrer.",
      timeoutChoices: [
        {
          id: "repousser-mains",
          label: "Rabattre les planches",
          risky: {
            stat: "COURAGE",
            threshold: 13,
            outcomes: outcomes(
              "20 naturel. Tu abats les planches d'un bloc, de tout ton poids. Les mains refluent — et juste avant le noir, l'une d'elles te fait un signe. Pouce levé. Le puits apprécie les adversaires nets.",
              "Tu rabats planche après planche, à coups de talon. Les mains se retirent sans hâte, comme des employés à la cloche — la journée reprendra demain. Tu renoues les chaînes de ton mieux.",
              "Une main t'attrape la cheville pendant que tu cloues — froide, sans colère, terriblement forte. Tu te dégages en y laissant de la peau. Les planches retombent à moitié. Ça suffira. Il faudra que ça suffise.",
              "1 naturel. Tu plaques les planches. Les mains plaquent les tiennes. Vous restez ainsi un long moment, paume contre paume à travers le bois, à négocier — et tu perds quelque chose dans l'accord. ♦ −2"
            ),
          },
        },
        {
          id: "donner-mains",
          label: "Leur tendre un objet",
          risky: {
            stat: "EMPATHIE",
            threshold: 11,
            outcomes: outcomes(
              "20 naturel. Tu poses dans une paume grise le premier objet de ta poche. Les mains le font passer de l'une à l'autre jusqu'au fond — et le fond te répond : elles remontent une lanterne de mineur, sèche, intacte. L'échange est ancien. Tu viens d'en apprendre les termes.",
              "Tu tends un quignon, une ficelle, ce que tu as. Une main le pèse, le trouve honnête, et toutes redescendent avec — le puits se tait pour la première fois. Le hameau entier semble respirer mieux.",
              "Ton offrande est pesée — et rendue. Trop légère. Les mains se tournent vers toi, paumes ouvertes, et attendent mieux. Tu recules avant que « mieux », dans leur idée, ne devienne toi.",
              "1 naturel. Tu tends l'objet. Une main le prend — et une autre te prend le poignet, pour vérifier si le reste vaut mieux. L'arrachement te coûte cher. Les mains, elles, ne lâchent que ce qui ne les intéresse plus. ♦ −2"
            ),
          },
        },
      ],
    },
    choices: [
      {
        id: "reclouer",
        label: "Resserrer les chaînes",
        risky: {
          stat: "COURAGE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu retends les chaînes au quart de tour près, cales les planches en croix — du travail de charpentier. Dessous, les coups s'arrêtent… puis un seul, léger : compris. Le hameau t'observera autrement, désormais.",
            "Tu resserres ce qui peut l'être. Les coups continuent, mais assourdis, repoussés d'un étage — le puits retourne à sa patience. Ce que tu as gagné s'appelle du temps, et ici ça vaut cher.",
            "La chaîne te glisse des mains et sonne contre la margelle. Dessous, silence — le pire des silences, celui qui écoute. Tu finis le travail trop vite, mal, et tu t'éloignes sans tourner le dos au puits.",
            "1 naturel. Tu tires la chaîne. Elle tire aussi. Le cadenas, entre vous deux, choisit son camp — pas le tien. ♦ −2"
          ),
        },
      },
      {
        id: "ecouter-puits",
        label: "Coller l'oreille au bois",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Entre deux coups, tu entends le fond : de l'eau, des voix — et le hameau à l'envers. Le puits ne contient pas des choses : il contient un ailleurs. Ce que tu as entendu du fond te servira, le jour où tu croiseras l'autre bout.",
            "À travers le bois, tu comptes : les coups ne demandent pas à sortir. Ils tiennent un registre — trois coups par nom, une pause entre les noms. Le puits fait l'appel. Tu retires l'oreille avant d'entendre le tien.",
            "L'oreille au bois, tu n'entends plus rien — les coups se sont tus dès le contact. Puis, contre ta joue, à travers la planche : trois coups très doux. On t'a entendu écouter.",
            "1 naturel. Tu écoutes. Et de l'autre côté des planches, très distinctement, quelqu'un fait « chhht ». ♦ −2"
          ),
        },
      },
      { id: "noeud-chaines", label: "Étudier le nœud", locked: { stat: "RUSE" } },
    ],
    jailerLine: "Ils ont condamné le puits. Charmant. On n'enferme pas un trou, mais l'espoir fait clouer.",
  },
  {
    id: "chien-du-bailli",
    illustration: "assets/monstre_chien_du_bailli_b.png",
    combat: true,
    foe: "chien-du-bailli",
    foeName: "Le Chien du Bailli",
    narration: [
      "La plus grande maison du hameau est murée — de l'intérieur. Chaque " +
        "fenêtre bouchée de pierres posées depuis dedans, en rangs pressés, " +
        "par quelqu'un qui s'enfermait plus qu'il ne se protégeait. La " +
        "maison du Bailli. Vide depuis sa corde. Pas gardée par personne.",
      "Le chien se lève du seuil sans aboyer. Gris, trop grand, le poil " +
        "usé aux endroits d'un harnais qu'il ne porte plus. Son maître " +
        "pend à la colline — mais l'ordre, lui, n'a jamais été levé. " +
        "Personne n'entre. Il te le dit d'un seul regard.",
    ],
    choices: [
      {
        id: "forcer-seuil",
        label: "Forcer le passage",
        risky: {
          stat: "COURAGE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tu marches droit, sans lever la main. Le chien te jauge — et s'écarte au dernier pas, parce qu'un ordre ancien vient d'en croiser un plus vieux : on ne mord pas ce qui n'a pas peur. Il t'escorte jusqu'au seuil, tête basse, presque soulagé.",
            "Il charge, tu tiens la ligne. L'impact vous couche tous les deux — mais c'est toi qui te relèves entre lui et la porte, et ça, pour un chien de garde, c'est la fin du débat. Il recule en grondant sa dignité.",
            "Il est plus vif que sa taille ne l'annonce. Ses mâchoires te prennent l'avant-bras au vol et te traînent hors du seuil comme un sac — c'est exactement son travail, et il le fait bien. Tu ne passes pas par la porte.",
            "1 naturel. Tu forces le seuil. Le chien te laisse faire — et tu comprends trop tard pourquoi il montait la garde tourné vers la porte : ce n'était pas pour empêcher d'entrer. ♦ −2"
          ),
        },
      },
      {
        id: "apaiser-chien",
        label: "S'accroupir, lui parler",
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu t'accroupis, tu lui parles de son maître — celui qui pend là-haut et qui juge encore. Le chien écoute, oreilles couchées, puis vient poser son front contre le tien. L'ordre est levé : tu es le premier à lui avoir dit que c'était fini.",
            "Tu lui laisses le dos de ta main, sans bouger. Il la flaire longtemps — la lande, le gibet, peut-être une trace de son maître dessus. Il ne s'écarte pas, mais il s'assoit : ce n'est plus une garde, c'est une visite. Tu peux longer le mur.",
            "Ta voix le calme — puis un mot le hérisse d'un coup, sans que tu saches lequel. Un mot que le Bailli employait, sans doute, et pas pour de bonnes choses. Il te chasse du seuil en trois attaques sèches, plus déçu que féroce.",
            "1 naturel. Il pose sa tête sous ta main. Et referme ses mâchoires dessus au moment exact où tu le crois gagné — les ordres du Bailli prévoyaient les gens comme toi. ♦ −2"
          ),
        },
      },
      {
        id: "contourner-cour",
        label: "Contourner par la cour",
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu fais le tour par les appentis — et tu trouves mieux que la porte : le trou par lequel le chien entre et sort, taillé à sa mesure dans la pierre murée. Assez large pour toi. La seule ouverture que le Bailli n'a jamais murée : il faut bien nourrir la garde.",
            "Tu passes par la cour aux orties, sous le vent, hors de vue. Le chien tourne autour de la maison à ta recherche — méthodique, aux aguets — mais la routine de sa ronde a trente ans, et tu marches entre ses horaires.",
            "La cour est un piège à bruit : ardoises brisées, seaux morts, orties jusqu'au coude. Le chien t'y cueille à mi-chemin, sans surprise aucune — sa ronde passait par là, évidemment. Tu ressors piqué, mordu et bredouille.",
            "1 naturel. Dans la cour arrière, tu découvres pourquoi la ronde du chien l'évite : quelque chose y est enterré, et ça n'aime pas les pas au-dessus. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Ce chien tient un poste que la mort de son maître n'a pas fermé. Prends-en de la graine : moi aussi.",
  },
  {
    // Le Registre des Pendaisons — la mécanique du Grand Registre (§19)
    // rejouée à l'échelle de la zone : la ligne du joueur s'insère dans le
    // classement, au milieu des Fixés du Bailli.
    id: "petit-tribunal",
    illustration: "assets/scene_petit_tribunal_a.png",
    registre: true,
    narration: [
      "Le Petit Tribunal tient dans une seule pièce : trois bancs, une " +
        "chaire, et le froid des endroits où l'on a beaucoup décidé. C'est " +
        "ici que la Fixation se jugeait — le Bailli en chaire, la corde en " +
        "sentence unique.",
      "Sur la chaire, ouvert, le Registre des Pendaisons. Quelqu'un tourne " +
        "encore les pages : un petit homme sec, plume en main, qui copie " +
        "sans lever les yeux. L'Écrivain public. Il te désigne le Registre " +
        "du bout de sa plume — ta page est prête.",
    ],
    choices: [
      { id: "lire-registre", label: "Lire le Registre" },
      {
        // Dénoncer un autre (validation 23/07) : fait baisser son propre
        // Soupçon. Disponible, JAMAIS suggéré par l'interface (bouton sobre,
        // aucun indice de bénéfice) — et le village s'en souvient (flag compte).
        id: "denoncer-un-autre",
        label: "Donner un nom à la plume",
        soupcon: -2,
        setsEnvFlag: "a-denonce",
        passive: {
          consequence:
            "Tu te penches vers l'Écrivain et tu donnes un nom — quelqu'un " +
            "d'entrevu, quelqu'un qui parlait seul, peu importe. La plume " +
            "note sans juger. Personne ne te regarde plus : on regarde déjà " +
            "ailleurs, vers le nom que tu as donné. C'est fou ce qu'on " +
            "respire mieux dans l'ombre d'un autre. Le hameau, lui, " +
            "n'oubliera pas la voix qui a donné le nom.",
        },
      },
      {
        id: "quitter-tribunal",
        label: "Quitter sans lire",
        passive: {
          consequence:
            "Tu tournes le dos à la chaire. La plume de l'Écrivain continue " +
            "de gratter — elle écrit ta sortie, en ce moment même, dans une " +
            "colonne que tu ne verras pas. Certains comptes, on préfère ne " +
            "pas savoir où ils s'arrêtent. La porte du tribunal se referme " +
            "sans bruit : on sait que tu reviendras. Tout le monde revient.",
        },
      },
    ],
    jailerLine: "Le Bailli tenait son registre, je tiens le mien. Le sien s'arrête aux Landes. Devine où s'arrête le mien.",
  },
  {
    id: "meute-grise-1",
    illustration: "assets/monstre_meute_grise_c.png",
    combat: true,
    chainNext: "meute-grise-2",
    foe: "meute-grise",
    foeName: "La Meute Grise",
    narration: [
      "Passé les murets du hameau, la lande redevient à eux. Tu les vois " +
        "de loin — et c'est mauvais signe : la Meute Grise ne se montre " +
        "que quand l'encerclement est fini. Six silhouettes couleur de " +
        "bruyère morte, immobiles aux six points d'un cercle dont tu es " +
        "le centre.",
      "Pas des chiens : trop patients. Pas des loups : trop organisés. La " +
        "plus grande s'assoit — le signal. Le cercle se met à tourner, " +
        "lentement, en se resserrant d'un pas par tour.",
    ],
    choices: [
      {
        id: "briser-cercle",
        label: "Charger la plus grande",
        risky: {
          stat: "COURAGE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tu charges la meneuse au milieu de son tour — l'impensable, au centre du cercle qui ne se défend jamais. Elle roule sous toi, se relève boiteuse, et le cercle entier perd le pas. Une meute sans cadence n'est qu'un tas de bêtes maigres.",
            "Ta charge la surprend à contre-pied. Ta lame la marque au flanc et le cercle s'arrête net — six têtes tournées vers la meneuse, en attente d'un ordre qu'elle met trop longtemps à donner. Tu as gagné le désordre, et c'est déjà beaucoup.",
            "Elle t'a laissé venir. Le cercle se referme dans ton dos au moment exact de ton élan — des crocs te prennent au mollet, d'autres au flanc, précis, économes. Puis tout recule d'un pas : la première entaille est faite. Ils ne sont pas pressés.",
            "1 naturel. Tu charges la meneuse. C'était la seule qui n'était pas là — tu charges de la bruyère, et le cercle entier te tombe dessus, pédagogique. ♦ −2"
          ),
        },
      },
      {
        id: "dos-muret",
        label: "Gagner le muret",
        risky: {
          stat: "INSTINCT",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu perces le cercle à l'endroit exact où deux bêtes échangeaient leurs postes — le seul battement du mécanisme. Dos à la pierre sèche, tu n'offres plus de centre. Une meute sans cercle tourne à vide ; la meneuse te le reproche du regard, longuement.",
            "Tu atteins le muret de justesse, une lanière de manteau en moins. Adossé à la pierre, tu ne peux plus être encerclé — juste attaqué de face, et ça, visiblement, ce n'est pas leur école. Le cercle se refait plus loin, faute de mieux.",
            "Tu cours — et le cercle tourne plus vite que toi, sans effort. Une bête t'accueille au muret, déjà assise, presque polie. Le péage se paie en chair, et tu le paies. Puis on te laisse t'adosser : même eux respectent les règles du jeu.",
            "1 naturel. Tu cours au muret. Le muret est leur tanière. ♦ −2"
          ),
        },
      },
      {
        id: "hurler-meute",
        label: "Hurler le premier",
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu renverses la tête et tu hurles — pas de peur : un vrai hurlement de meute, appris tu ne sais où, peut-être du fond de la lande elle-même. Le cercle se fige. La meneuse répond. Vous vous êtes dit quelque chose, et le cercle s'ouvre : on ne chasse pas ce qui chante.",
            "Ton hurlement les déroute — c'est la proie qui crie, jamais le centre. Deux bêtes rompent le tour pour interroger la meneuse du regard, et le cercle flotte, désaccordé. Tu as gagné du temps et semé le doute, leurs deux seules faiblesses.",
            "Ton hurlement sonne faux — un cri de gorge d'homme, rien d'autre. Le cercle ne ralentit même pas. Pire : au loin, quelque chose d'autre a répondu, et la meneuse presse le pas. Ils veulent finir avant l'arrivée de ce que tu as appelé.",
            "1 naturel. Tu hurles. Toute la lande répond — tout ce qu'elle contient, d'un seul chœur. La meute, elle, s'assoit poliment : on ne coupe pas la parole à ce qui arrive. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Six bêtes qui tournent en rond autour d'un vivant. Où veux-tu que j'aille ? C'est mon théâtre exact.",
  },
  {
    id: "meute-grise-2",
    illustration: "assets/monstre_meute_grise_c.png",
    combat: true,
    foe: "meute-grise",
    foeName: "La Meute Grise",
    narration: [
      "Le cercle est rompu, mais la meute reste — regroupée à distance de " +
        "lame, en croissant, plus prudente. Ils ont compris que tu mords " +
        "aussi. Ça ne les décourage pas : ça les intéresse.",
      "La meneuse s'avance seule d'un pas, tête basse, et te fixe. Chez " +
        "eux, c'est une question. La dernière avant la charge — ou avant " +
        "autre chose. À toi d'y répondre.",
    ],
    choices: [
      // Dernier acte de la rencontre : CHAQUE issue clôt le combat (règle
      // éditoriale 14/07 — jamais une meute laissée « prête à charger »).
      {
        id: "abattre-meneuse",
        label: "Répondre par l'acier",
        risky: {
          stat: "COURAGE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu réponds d'un seul coup, net, définitif. La meneuse tombe sans un bruit — et la meute ne venge pas : elle constate, se choisit une autre tête d'un simple flottement, et reflue dans la bruyère. Les questions, dans la lande, n'ont pas de rancune.",
            "Ta lame répond pour toi. La meneuse esquive l'essentiel, encaisse le reste, et rompt — le croissant entier reflue avec elle, réglé sur sa retraite. Ils reviendront peut-être. Pas aujourd'hui, et pas pour toi.",
            "Elle attendait l'acier — c'est la réponse qu'ils comprennent le mieux et esquivent le mieux. Le croissant fond sur toi, prend son tribut de chair en trois passes réglées, puis décroche d'un coup, comme à un signal. La lande se referme sur eux. Le compte est bon, pour eux.",
            "1 naturel. Tu frappes. Ta lame se prend dans la bruyère — la lande a choisi son camp. La meute te passe dessus en une seule vague, sans s'attarder : ce qu'elle voulait savoir, elle le sait, et te laisse au sol, moins lourd de ce qu'elle emporte. ♦ −2"
          ),
        },
      },
      {
        id: "reculer-face",
        label: "Reculer, sans ciller",
        risky: {
          stat: "INSTINCT",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tu recules pas à pas, les yeux dans les siens, sans un frisson. La meneuse te suit — puis s'arrête à la frontière exacte d'un territoire que toi seul ne vois pas. Elle s'assoit. Tu es sorti de leur carte : la meute te regarde partir comme on regarde la pluie quitter un champ.",
            "Chaque pas en arrière est un mot de la négociation. Tu la tiens du regard jusqu'au chemin, et le croissant s'effiloche à mesure — une bête qui décroche, puis deux. À la fin, il ne reste que la meneuse, qui te concède la lande d'un battement de paupières.",
            "Ton talon accroche une racine — un quart de seconde de regard perdu. Il ne leur en faut pas plus : la charge t'arrive dessus pendant que tu te rattrapes, te roule, te coûte — puis s'arrête net, croissant reformé, et la meute s'en va. L'épreuve est finie ; tu n'as pas brillé, mais tu es debout.",
            "1 naturel. Tu recules sans baisser les yeux. Eux non plus. Tu recules encore. Eux avancent. Le mur de pierre sèche dans ton dos met fin à la négociation — à leurs conditions. Ils prélèvent, et te laissent contre le muret, vivant par désintérêt. ♦ −2"
          ),
        },
      },
      {
        id: "offrir-viande",
        label: "Jeter tes vivres",
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu jettes tes vivres — mais un par un, en reculant, en semant ta sortie. La meute suit le fil de miettes, méthodique, et la meneuse te laisse filer avec un regard entendu : elle sait qu'elle est achetée, elle accepte le prix. Marché de vieux routiers.",
            "Le paquet tombe entre vous. La meneuse le flaire, le juge honnête — et le croissant se referme dessus au lieu de toi. Tu pars le ventre plus léger et la peau entière. Dans la lande, c'est un excellent taux de change.",
            "Tu jettes tout — trop vite, trop près de toi. La meute prend les vivres ET la leçon : ce qui donne tout tremble. La meneuse te bouscule au passage, sans mordre, juste pour l'inventaire — puis ils s'en vont, servis. Tu restes debout, les poches vides, jaugé au plus juste.",
            "1 naturel. Tu jettes tes vivres. Ils n'y touchent pas. Ce n'était pas une chasse au gibier — c'était une pesée, et ton offrande vient de te faire passer dans la mauvaise colonne. Ils prélèvent la différence sur toi, exacts comme un percepteur, puis rendent la lande au silence. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "La Meute Grise ne tue presque jamais. Elle évalue. Les chiffres remontent jusqu'à moi.",
  },
  {
    // Dernière scène de la rotation : la sortie de zone (La Descente) se
    // montre mais reste verrouillée — l'Acte II n'existe pas encore.
    id: "palissade-sud",
    loot: "lanterne-veilleur",
    narration: [
      "Au bout des Landes, une palissade de troncs noircis barre l'horizon " +
        "d'est en ouest. Pas pour empêcher d'entrer : les étais sont de ce " +
        "côté-ci. Au centre, une porte à double battant — et derrière, un " +
        "chemin qui descend. On le sent plus qu'on ne le voit : l'air y " +
        "coule comme une eau froide. La Descente.",
      "Sur le chemin de ronde, un vieux soldat regarde vers le sud. Et en " +
        "contrebas, déjà loin de l'autre côté, un homme descend le chemin " +
        "d'un pas égal, sans bagage, sans se retourner. Le Veilleur ne le " +
        "quitte pas des yeux. « Encore un Appelé », dit-il sans se " +
        "retourner. « On ne les rattrape pas. On les compte. »",
    ],
    choices: [
      {
        id: "questionner-veilleur",
        label: "Questionner le Veilleur",
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Le vieux soldat te regarde enfin — et te tend sa lanterne, la seule allumée de toute la palissade. « Trente ans que je guette la relève. » Il te raconte tout : la voix qui appelle, les battants qu'on graisse, et pourquoi la porte s'ouvre toujours de l'intérieur. Quand tu descendras, tu sauras.",
            "Il parle sans quitter le sud des yeux. La Descente mène au deuxième cercle des terres du Geôlier — « plus profond, plus vieux, moins poli ». Il te jauge du coin de l'œil : « Pas encore prêt, toi. Ça se voit aux épaules. » Ce n'est pas une insulte. C'est une mesure.",
            "À ta troisième question, il se ferme comme une porte de garnison : « On ne parle pas de la Descente à ceux qui remontent. » Tu ne sauras pas ce que tes questions ont révélé de toi — mais il a resserré sa capote, et il s'est éloigné de deux pas. De toi, pas du froid.",
            "1 naturel. Tu le questionnes. Il répond par une question : « Et toi, tu l'entends depuis quand, la voix ? » Tu ouvres la bouche pour dire jamais. Rien ne sort. ♦ −2"
          ),
        },
      },
      {
        id: "regarder-appele",
        label: "Regarder l'Appelé",
        passive: {
          consequence:
            "Tu t'accoudes à la palissade et tu le regardes descendre, " +
            "longtemps. Il ne presse jamais le pas, ne le ralentit jamais — " +
            "le pas de quelqu'un qui n'obéit pas à ses jambes. Juste avant " +
            "le tournant, il s'arrête. Une seconde. Comme si, tout au fond, " +
            "quelque chose en lui se débattait encore. Puis le chemin le " +
            "prend. Tu sais maintenant à quoi ressemble quelqu'un qui a " +
            "fini par répondre. Tu espères ne jamais le reconnaître dans " +
            "un reflet.",
        },
      },
      { id: "franchir-descente", label: "Franchir la Descente", locked: { stat: "COURAGE" } },
    ],
    jailerLine: "La Descente t'intrigue ? Patience. Les Landes d'abord — on finit son assiette avant le plat suivant.",
  },
  {
    /* Le procès du héros (chantier 3 du 23/07) — dernier palier du Soupçon.
       HORS pool d'orientation (pas d'entrée APPROACH) : la traversée y est
       DÉROUTÉE quand le Soupçon atteint son comble. Un jet raté = mort par
       fixation — la première mort du jeu sans aucun combat, purement sociale,
       traitée comme toutes les autres (relique + fragment + épitaphe). Un jet
       réussi fait retomber le Soupçon : le hameau a jugé, il se lasse. */
    id: "proces-du-heros",
    illustration: "assets/scene_petit_tribunal_a.png",
    fixationTrial: true,
    narration: [
      "Ils ne te courent pas après — ils t'attendent au tournant du muret, " +
        "le hameau entier, dans ce silence de gens qui ont déjà décidé. On " +
        "ne te touche pas. On marche autour de toi, jusqu'au Petit Tribunal.",
      "Trois bancs pleins, la chaire vide — c'est face à elle qu'on " +
        "t'assoit. La Doyenne déplie une feuille : la Dénonciation, signée " +
        "d'une croix. L'accusation tient en peu de mots, et personne n'ose " +
        "les dire fort : tu entends une voix. L'Ordonnance de la Fixation " +
        "s'applique. À moins que tu ne parles mieux qu'elle.",
    ],
    choices: [
      {
        id: "plaider-serre",
        label: "Plaider serré",
        risky: {
          stat: "RUSE",
          threshold: 13,
          highStakes: true,
          outcomes: outcomes(
            "20 naturel. Tu retournes leur procédure contre eux : pas de témoin direct, pas de voix entendue par un tiers, pas de motif inscrit au Registre. L'Écrivain vérifie — le greffe est formel. Le hameau plie devant sa propre règle, et te relâche à reculons.",
            "Tu plaides court : qui l'a entendue, cette voix, à part la peur ? Un silence. Personne ne se lève pour jurer. La relaxe tombe du bout des lèvres de la Doyenne. On t'escorte dehors — l'œil du hameau ne te lâche plus, mais la corde, si.",
            "Tu plaides — trop bien. « Seul un coupable connaît si bien la procédure », dit la Doyenne, et les bancs hochent la tête. À l'aube qui ne vient jamais tout à fait, le Champ des Fixés gagne une ligne : la tienne.",
            "1 naturel. Au milieu de ta défense, la voix te souffle exactement le mot qu'il fallait — et tu le répètes. Tout le tribunal l'a vu passer dans tes yeux. La sentence est unanime, et l'aube, pour une fois, ponctuelle. ♦ −2"
          ),
        },
      },
      {
        id: "prendre-a-temoin",
        label: "Prendre le hameau à témoin",
        risky: {
          stat: "EMPATHIE",
          threshold: 13,
          highStakes: true,
          outcomes: outcomes(
            "20 naturel. Tu ne te défends pas : tu les regardes un par un, et tu nommes ce que chacun a laissé au muret — la hâte, la lame, la langue. Le tribunal se souvient qu'il est un hameau. On te raccompagne au seuil, et c'est presque des excuses.",
            "Tu parles de leurs morts fixés, de la peur qui juge à leur place depuis que le Bailli pend. Des nuques plient sur les bancs. La Doyenne tranche, lasse : « Qu'il marche. La lande jugera mieux que nous. »",
            "Tu cherches leurs yeux — ils regardent tous la corde. Ce n'est pas de la haine, c'est du soulagement : quelqu'un d'autre qu'eux. À l'aube, on te fixe, proprement, avec les égards dus à ce qu'on craint.",
            "1 naturel. Ton appel réveille exactement le souvenir qu'il ne fallait pas : la dernière qui a supplié ainsi s'est relevée de sa corde. Cette fois, ils feront mieux. Double nœud. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Un procès ! J'adore les procès. Le Bailli aussi les adorait — regarde où ça pend, l'amour du droit.",
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
      "Un {n} ? Même les corbeaux ont cessé de compter.",
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

/* ═══════════════════════════════════════════════════════════════════════
   TRAVERSÉE & SCÈNES DE LIAISON (chantier n°1, spec 21/07)
   Grammaire cible : liaison → lieu → liaison → rencontre → liaison → lieu…
   Le joueur ne « fait » jamais tous les lieux : une traversée en visite 3-4,
   tirés au pool et CHOISIS aux liaisons (choix d'orientation). Sortie = la
   Descente (fin sèche « Acte II à venir », décision Patrick 21/07).
   ═══════════════════════════════════════════════════════════════════════ */

export function sceneById(id: string): Scene | undefined {
  return SCENES.find((s) => s.id === id);
}

/** Lieu d'entrée fixe de la zone (toujours la 1re scène après le Seuil). */
export const ENTRY_SCENE = "borne-frontiere";

/**
 * Phrases d'orientation par lieu (spec 21/07) : le bouton d'une liaison. Jamais
 * un danger frontal — une impression sensorielle (le « Vent qui ment » vit ici).
 * Un lieu sans entrée ici n'apparaît pas comme destination d'orientation.
 */
const APPROACH: Record<string, string> = {
  "chemin-creux": "Vers le chemin creux",
  "bete-chemins-creux": "Vers une odeur de suint",
  "colline-aux-gibets": "Vers la crête aux cordes",
  "pendu-qui-parle": "Vers un gibet qui parle",
  "champ-des-fixes": "Vers les rangées de poteaux",
  "pendu-mal-fixe": "Vers un craquement de bois",
  "serment-hameau": "Vers la fumée d'un hameau",
  "marche-muet": "Vers un marché muet",
  "campement": "Vers un moulin sans ailes",
  "chapelle-des-cordes": "Vers une chapelle de cordes",
  "puits-condamne": "Vers des coups sourds",
  "chien-du-bailli": "Vers une maison murée",
  "petit-tribunal": "Vers une salle de juges",
  "meute-grise-1": "Vers des silhouettes grises",
  "palissade-sud": "Vers une palissade au sud",
};

/** Pool des destinations tirables (tout ce qui a une phrase d'orientation). */
export const TRAVERSAL_POOL = Object.keys(APPROACH);

/** Ambiances de marche (spec 21/07) : 1 beat court par liaison, tiré au hasard. */
const LIAISON_AMBIANCES: string[] = [
  "Tu marches. La lande ne finit pas — elle se répète, talus après talus, sous le même crépuscule qui ne tombe jamais.",
  "Le vent pousse une odeur de corde mouillée et de terre retournée. Quelque part, toujours, une potence grince.",
  "La bruyère efface derrière toi les traces de ceux qui ont choisi avant. Devant, elle ne promet rien.",
  "Un long moment sans rien : juste tes pas, et la sensation d'être compté par quelque chose que tu ne vois pas.",
  "Le chemin se creuse, remonte, se divise. Ici, on ne va pas quelque part — on s'éloigne de la Borne.",
];

const LIAISON_JAILER: string[] = [
  "Marche, marche. Toutes les routes des Landes finissent au même endroit. Je t'y attends.",
  "Tu choisis ton chemin. C'est mignon. Ça ne change que l'ordre des choses.",
];

/** Une graine → un flottant [0,1) déterministe (liaisons stables à la reprise). */
function seeded(n: number): number {
  let s = (n * 2654435761 + 40503) >>> 0;
  s ^= s << 13;
  s ^= s >>> 17;
  s ^= s << 5;
  return ((s >>> 0) % 100000) / 100000;
}

/**
 * Construit une scène de liaison entre deux destinations (spec 21/07) : une
 * ambiance de marche + un choix d'orientation vers l'un ou l'autre lieu.
 * `seed` (pas de progression) garde l'ambiance stable si la run reprend.
 */
export function makeLiaison(optA: string, optB: string, seed: number): Scene {
  const amb = LIAISON_AMBIANCES[Math.floor(seeded(seed) * LIAISON_AMBIANCES.length)];
  const jl = LIAISON_JAILER[Math.floor(seeded(seed + 7) * LIAISON_JAILER.length)];
  return {
    id: `liaison:${optA}>${optB}`,
    liaison: true,
    narration: [amb, "Deux directions s'ouvrent. La lande attend que tu tranches."],
    jailerLine: jl,
    choices: [
      { id: `orient-${optA}`, label: APPROACH[optA] ?? "Continuer", orient: { dest: optA } },
      { id: `orient-${optB}`, label: APPROACH[optB] ?? "Continuer", orient: { dest: optB } },
    ],
  };
}

/**
 * Tire les 2 destinations offertes à une liaison : 2 lieux NON encore visités,
 * choisis dans le pool via la graine (stable à la reprise). Si le pool est
 * presque épuisé, complète avec ce qui reste.
 */
export function pickLiaisonOptions(visited: string[], seed: number): [string, string] {
  const remaining = TRAVERSAL_POOL.filter((id) => !visited.includes(id));
  const src = remaining.length >= 2 ? remaining : TRAVERSAL_POOL.filter((id) => !visited.slice(-1).includes(id));
  // Mélange déterministe (Fisher-Yates seedé) puis on prend les 2 premiers.
  const arr = [...src];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seeded(seed * 31 + i) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return [arr[0], arr[1] ?? arr[0]];
}

/**
 * Le Soupçon — manifestations par palier (chantier 3 du 23/07). JAMAIS une
 * jauge ni un chiffre : le Soupçon ne se lit QUE dans le monde. Chaque palier
 * n'est manifesté qu'une fois (RunState.soupconSeen) ; le palier 6 n'a pas de
 * texte ici — c'est le procès du héros (scène `proces-du-heros`).
 */
export const SOUPCON_PALIERS: Record<number, string> = {
  1: "Les rares mots qu'on t'adresse ont raccourci. On te répond sec, sans te regarder — pas de l'hostilité. De l'économie.",
  2: "Une conversation s'éteint à ton approche. Pas interrompue : pliée, rangée, comme du linge qu'on rentre avant la pluie.",
  3: "Une mère tire son enfant à l'intérieur sans un mot. Plus loin, la Doyenne croise ton chemin et parle sans s'arrêter : « Quoi que tu entendes, ne réponds pas. Ici, on regarde les bouches. »",
  4: "Là où tu as dormi, quelqu'un est passé : une croix à la craie, tracée bas, près du sol. Elle ne t'est pas adressée. Elle est adressée aux autres.",
  5: "Trois hommes te suivent depuis le dernier muret. Ils ne pressent pas le pas. Ils n'en ont pas besoin — ils attendent quelque chose, et ce quelque chose a une aube.",
};

/** La Descente — nœud terminal de la zone (fin sèche, Acte II à venir). */
export const DESCENTE_SCENE: Scene = {
  id: "la-descente",
  terminal: true,
  narration: [
    "Le sol s'incline. L'air se fait plus froid, plus vieux — il monte d'en bas, par la porte de la Descente restée ouverte derrière toi.",
    "Tu as traversé les Landes vivant. Peu le font. Devant, l'escalier plonge dans un noir qui n'a pas encore de nom.",
    "Ici s'arrête, pour l'instant, ce que le Geôlier a bâti. L'Acte II se creuse encore.",
  ],
  jailerLine: "Tu es descendu jusqu'ici. Bien. Le reste n'est pas prêt — mais moi, je le serai avant toi.",
  choices: [
    { id: "recommencer-descente", label: "Repartir de la Borne" },
  ],
};
