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
  /**
   * Point d'intérêt du lieu (spec 24/07 suite, §1) : id d'une entrée de
   * `Scene.pointsInteret`. Choisir ce point joue la MARCHE (approche) puis
   * l'examen (plan rapproché) — on ne se téléporte jamais sur un point.
   * Généré automatiquement à partir de `Scene.pointsInteret`, pas écrit à la main.
   */
  poi?: string;
  /**
   * Le Serment des Renonçants (spec 24/07 suite §3) : ce choix engage — ou
   * non — le héros pour toute la traversée. Conditionne la Halte (grange vs
   * nuit dehors) et la récompense de sortie.
   */
  serment?: "jure" | "faux" | "refuse";
  /**
   * Le SAVOIR (journal Notion 25/07) : ce choix N'EXISTE PAS tant que le flag
   * n'a pas été appris en examinant un point d'intérêt. Il est alors ajouté aux
   * choix de la scène comme n'importe quel autre — aucun marqueur « débloqué »,
   * aucun chiffre : le joueur voit juste une option qu'il n'avait pas la fois
   * d'avant. C'est le MÊME mécanisme que les choix conditionnels d'objet ou
   * d'état, rien de nouveau à part la source de la condition.
   *
   * Un Savoir n'est pas forcément une bonne carte : l'option ouverte peut être
   * un aveu (dire au juge que ton poteau est déjà gravé) ou un pari.
   */
  requiresSavoir?: string;
  /**
   * SAVOIR appris en PRENANT ce choix (poser la question à quelqu'un vaut
   * examiner une trace : c'est la même monnaie). Posé dès la sélection, comme
   * le Soupçon — l'acte d'avoir demandé suffit, l'issue d'un éventuel jet ne
   * change rien à ce qu'on a entendu.
   */
  grantsSavoir?: string;
};

/**
 * Point d'intérêt d'un lieu (spec 24/07 suite, §1 — « la longueur des beats
 * n'est pas le problème, la LINÉARITÉ l'est »).
 *
 * Grammaire verrouillée : **voir de loin → marcher → toucher.**
 *   • le beat d'arrivée du lieu MONTRE les points à distance (paysage lu,
 *     jamais un menu) ;
 *   • choisir un point joue son `approche` (2-3 phrases de marche DANS le
 *     lieu) PUIS son `examen` (le héros est à hauteur de l'élément) ;
 *   • on revient au lieu, les points restants toujours explorables, jusqu'à
 *     choisir de continuer (→ l'événement du lieu).
 *
 * ⚠️ PLUS DE PLAN RAPPROCHÉ PAR CROP (retour Patrick 26/07 : « ça ne rend pas
 * bien »). Observer n'est plus un zoom dans l'image du lieu : le héros se
 * DÉPLACE, et l'écran montre l'élément lui-même via son `illustration` dédiée.
 * Sans image dédiée, l'écran garde l'image du lieu inchangée — c'est un manque
 * d'asset à combler (visible dans `data/couverture_visuelle.html`), jamais un
 * effet à simuler.
 */
export type PointInteret = {
  id: string;
  /** Libellé du choix à l'arrivée — ce qu'on voit de loin. */
  label: string;
  /** Beat de MARCHE vers le point (2-3 phrases). Jamais sauté. */
  approche: string;
  /** Examen : le héros est à hauteur de l'élément, il le détaille. */
  examen: string;
  /**
   * Image de l'ÉLÉMENT OBSERVÉ. Chemin `assets/…` d'une illustration produite
   * pour ce point précis — c'est le seul moyen de montrer le focus (le crop est
   * abandonné). Vide = l'écran garde l'image du lieu.
   * ⚠️ L'image doit raccorder avec l'illustration du LIEU (même décor, même
   * lumière, même matière) : le héros s'est approché, il n'a pas changé d'endroit.
   */
  illustration?: string;
  /** Le Soupçon monte/descend en examinant (ex. réagir à voix haute). */
  soupcon?: number;
  /**
   * LES CORBEAUX DU COMPTE (Notion 26/07 §6) : l'examen ajoute une ligne
   * calculée sur la MÉMOIRE DE COMPTE — les corbeaux se posent au nombre
   * exact des morts du joueur. C'est un des rares endroits où la
   * méta-progression se lit dans le décor plutôt que dans un écran, donc le
   * nombre est dit en PROSE (« trois »), jamais affiché comme un chiffre.
   */
  corbeaux?: boolean;
  /**
   * SAVOIR appris en examinant ce point (journal Notion 25/07). Flag posé dans
   * `RunState.savoirs` : il ouvrira un choix marqué `requiresSavoir` dans une
   * scène ultérieure. Jamais annoncé au joueur — il découvre l'option le moment
   * venu, ce qui fait de l'exploration un investissement et non une collection.
   */
  savoir?: string;
  /**
   * Fragment de chapitre (4e monnaie de la règle de dosage 25/07) : l'examen
   * livre en plus un beat de lore du chapitre de la run — le premier fragment
   * encore non lu. Sans effet si la run n'a pas de chapitre ou si tous ses
   * fragments ont déjà été servis.
   */
  chapterFragment?: boolean;
  /** Objet réel des Landes trouvé au point (id de LANDES_OBJETS). */
  grantsLoot?: string;
  /** Trace durable au compte (persistance environnementale §17). */
  setsEnvFlag?: string;
  /**
   * Point d'intérêt qui OUVRE sur une rencontre (notation « PI 3 — les Époux →
   * rencontre » des scripts). L'approche et l'examen se jouent normalement,
   * puis l'écran bascule sur le premier beat de la rencontre nommée au lieu de
   * revenir au lieu. La rencontre rejoint ensuite le lieu par son `chainNext`
   * (typiquement l'écran-événement `-2`), pour que la grammaire du lieu
   * (arrivée → points → événement → sortie) reste tenue.
   */
  leadsTo?: string;
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
  /**
   * SAVOIR livré par la NARRATION de cette scène (25/07) : certains PNJ disent
   * l'information tout haut avant qu'on ait pu la demander (le Marcheur à
   * rebours prévient du versant nord dès sa première réplique). Sans ça, le
   * joueur entendrait le conseil sans pouvoir s'en servir — incohérence pire
   * que l'absence de conseil.
   */
  savoir?: string;
  /**
   * Points d'intérêt explorables du lieu (spec 24/07 suite, §1). Un lieu n'est
   * PLUS jamais un nœud unique : arrivée (les points se voient à distance) →
   * points d'intérêt (marche + examen) → événement → sortie.
   */
  pointsInteret?: PointInteret[];
  /** Dernier beat de l'Entrée du Hameau : marque la séquence comme jouée
      (spec 24/07 suite §3) — la Halte deviendra due avant la sortie de zone. */
  hameauEntree?: boolean;
  /** Dernier beat de la Halte : marque la nuit comme passée — la traversée
      repart vers la Palissade / la Descente. */
  hameauHalte?: boolean;
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
    // Vue DÉDIÉE du tout premier écran du jeu (lot 25/07) : l'ancienne image
    // était une vue de transition, aussi tirée dans le pool des marches.
    illustration: "assets/scene_borne_frontiere_a_c.png",
    narration: [
      "La lande s'ouvre sous un crépuscule qui ne tombe pas. La lumière " +
        "reste prise entre chien et loup, comme un souffle retenu. Quelque " +
        "part, une corde grince.",
      "La pierre est seule au milieu du plateau, dressée là où tous les murets " +
        "renoncent. Haute comme un homme, grise comme le reste — et pourtant " +
        "l'œil ne voit qu'elle. À son pied, un tas d'offrandes. Au-delà, le " +
        "sud, nu. Et à trois pas de la borne, un homme immobile, face au sud.",
    ],
    pointsInteret: [
      {
        id: "gravures-borne",
        chapterFragment: true,
        label: "Les gravures de la pierre",
        illustration: "assets/scene_borne_gravures_a_d.png",
        approche:
          "Tu fais le tour de la pierre lentement, la main à plat sur le " +
          "granit. Il est froid d'une froideur qui ne vient pas du vent.",
        examen:
          "Des marques sur toutes les faces, de toutes les mains, de toutes " +
          "les époques : des noms, des dates, des traits de comptage. Le côté " +
          "nord est saturé — les adieux de ceux qui partaient. Le côté sud " +
          "est presque vierge. Trois marques seulement. On ne grave pas au " +
          "retour quand personne ne revient. Alors qui a gravé côté sud ?",
      },
      {
        id: "eclat-descelle",
        label: "Un angle cassé, au ras du sol",
        illustration: "assets/scene_borne_eclat_a_b.png",
        grantsLoot: "pierre-retour",
        approche:
          "Un angle de la borne manque. Tu t'accroupis : la cassure est " +
          "nette, faite au burin, patiemment. Quelqu'un a voulu emporter un " +
          "morceau de la limite avec lui.",
        examen:
          "L'éclat est encore là, à demi enterré sous la bruyère. Il ne l'a " +
          "pas pris. Ou il n'a pas pu. La pierre tient dans le creux de ta " +
          "main, exactement comme si elle avait été taillée pour.",
      },
      {
        id: "homme-immobile",
        label: "L'homme qui regarde le sud",
        leadsTo: "hesitant-1",
        // Le plan rapproché EST le personnage : son portrait validé existe déjà,
        // et c'est la même image que la rencontre qui suit (continuité).
        illustration: "assets/monstre_hesitant_b.png",
        approche:
          "Tu quittes la borne et tu marches vers lui, sans te presser, en " +
          "faisant sonner tes pas — on n'arrive pas dans le dos de quelqu'un, " +
          "ici.",
        examen:
          "L'herbe autour de ses pieds est couchée, morte. Il est là depuis " +
          "des jours. Immobile — mais pas comme on se repose : comme on lutte.",
      },
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
  /* ═══ RENCONTRES EN BEATS (spec 24/07 suite, format obligatoire) ═══
     approche → échange → enjeu → résolution. Le beat d'APPROCHE est porté par
     le point d'intérêt qui ouvre la rencontre (voir de loin → marcher → être à
     hauteur) : c'est pour ça qu'on n'arrive jamais sur quelqu'un d'un coup, et
     que la rencontre reste refusable — il suffit de ne pas choisir le point.
     Les beats suivants sont des scènes chaînées ; le dernier rejoint le lieu
     (son écran-événement) ou débouche sur une liaison. */
  {
    /* L'HÉSITANT — Borne Frontière · rare. Le chaînon entre Renonçant et
       Appelé : il n'a pas encore choisi, et il te demande de choisir pour lui. */
    id: "hesitant-1",
    illustration: "assets/monstre_hesitant_b.png",
    chainNext: "hesitant-2",
    narration: [
      "Il ne se retourne pas. Il t'a entendu, pourtant — ses épaules l'ont dit.",
      "— « Tu l'entends fort, toi ? » Sa voix est calme, épuisée d'être calme. " +
        "« Moi, c'est encore bas. Comme des gens qui parlent dans la maison " +
        "d'à côté. On comprend pas les mots. On comprend juste... qu'on parle " +
        "de nous. »",
    ],
    choices: [
      {
        id: "hesitant-depuis-quand",
        label: "« Depuis combien de temps ? »",
        passive: {
          consequence:
            "— « Ma femme dit trois semaines. » Un temps. « Ma femme dit " +
            "beaucoup de choses en pleurant, maintenant. » Il ne quitte pas " +
            "le sud des yeux en le disant, et c'est ça, le plus dur à voir : " +
            "il parle d'elle au présent et il regarde ailleurs.",
        },
      },
      {
        id: "hesitant-mentir",
        label: "Mentir : « Je n'entends rien. »",
        soupcon: 1,
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu le dis avec l'ennui exact de quelqu'un qui ne comprend pas la question. Il te croit — et quelque chose se relâche dans ses épaules, une espérance idiote : si un autre n'entend rien, alors ça se peut. Tu viens de lui donner trois semaines de plus. En mentant.",
            "Tu hausses les épaules. Il te regarde de biais, longtemps, puis renonce à trancher. « Tant mieux pour toi », dit-il, et ça sonne presque sincère.",
            "Tu le dis trop vite, ou trop fort. Il rit — doucement, terriblement. « Tous ceux qui descendent disent ça. C'est même à ça qu'on vous reconnaît. »",
            "1 naturel. « Je n'entends rien », dis-tu. Et au même instant, dans le creux de ton crâne, quelque chose répond quelque chose. Ton visage le raconte à ta place. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Celui-là m'écoute depuis trois semaines et il croit encore que c'est le vent.",
  },
  {
    id: "hesitant-2",
    illustration: "assets/monstre_hesitant_b.png",
    chainNext: "hesitant-3",
    narration: [
      "— « Je calcule. » Il montre la borne du menton, sans la regarder. « Si " +
        "je rentre, ils me liront sur la figure et je finirai au bout d'une " +
        "corde qui ne retient rien. Si je passe la pierre, je finis comme ceux " +
        "qui passent la pierre. »",
      "Un temps. « Tu descends. Tu vas voir ce qu'on devient. Alors dis-moi ce " +
        "que tu choisirais. »",
    ],
    choices: [
      {
        id: "hesitant-raccompagner",
        label: "Le raccompagner au hameau",
        soupcon: -1, // on t'a vu ramener un homme : ça compte, ici
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu ne lui prends pas le bras — tu te mets simplement à marcher vers le nord, à son rythme, comme si c'était déjà décidé. Il suit. Les cent premiers pas, il marche à reculons, le sud toujours en face. Puis il pivote, et c'est fini : il rentre. Ce que tu viens de sauver tiendra trois semaines ou trente ans. Ici, ça s'appelle une victoire.",
            "Il te suit, à contrecœur, en s'arrêtant deux fois. Au deuxième arrêt il ne dit rien et repart quand même. C'est peut-être le maximum qu'on puisse obtenir d'un homme dans cet état.",
            "Il ne bouge pas. Il s'assied au pied de la borne, dos à la pierre, face au sud — et c'est pire que tout, parce que maintenant il est confortable.",
            "1 naturel. Tu lui parles de sa femme. Il tourne enfin la tête vers toi, et son visage est celui de quelqu'un qui vient de comprendre qu'il ne se souvient plus de son nom à elle. ♦ −2"
          ),
        },
      },
      {
        id: "hesitant-passe",
        label: "« Passe. »",
        passive: {
          consequence:
            "Tu le dis sans y mettre de poids. Il hoche la tête, plusieurs " +
            "fois, presque soulagé qu'on l'ait dit à sa place. « Voilà. » " +
            "C'est tout ce qu'il trouve. « Voilà. »",
        },
      },
      {
        id: "hesitant-partir",
        label: "Ne pas répondre et partir",
        passive: {
          consequence:
            "Tu ne réponds pas. Tu reprends ta route, et derrière toi sa voix " +
            "arrive, sans reproche : « Merci quand même. » Elle te suit " +
            "longtemps, cette politesse-là. Plus longtemps qu'une insulte.",
        },
      },
    ],
    jailerLine: "Il te demande de choisir à sa place. Comme si tu savais choisir. Comme si quelqu'un savait.",
  },
  {
    id: "hesitant-3",
    illustration: "assets/monstre_hesitant_3_c.png",
    narration: [
      "Il te laisse partir le premier. C'est important pour lui : que tu ne le " +
        "voies pas décider.",
      "Au bout de vingt pas tu te retournes quand même. La borne est seule au " +
        "milieu du plateau. Il n'y a plus personne à côté — et rien, sur la " +
        "bruyère couchée, ne dit dans quel sens il est parti.",
    ],
    choices: [{ id: "hesitant-reprendre-route", label: "Reprendre la route" }],
    jailerLine: "Deux directions, un homme, et pas une trace. Je note ça comme une sortie. Les deux le sont.",
  },
  {
    id: "chemin-creux",
    illustration: "assets/scene_chemin_creux_c.png",
    chainNext: "chemin-creux-2",
    narration: [
      "Le chemin s'enfonce entre deux talus plus hauts que toi ; le ciel " +
        "devient un ruban. C'est le plus court chemin des Landes, et le seul " +
        "où l'on ne voit pas venir.",
      "Une charrette penche au premier coude. Les talus, au-dessus, sont " +
        "meubles. Plus loin, le chemin tourne et la terre mange la vue. Et " +
        "dans le creux, quelqu'un vient vers toi — de dos.",
    ],
    pointsInteret: [
      {
        id: "charrette-embourbee",
        label: "La charrette embourbée",
        illustration: "assets/scene_chemin_charrette_a_c.png",
        grantsLoot: "grelot-charretier",
        approche:
          "Elle penche dans l'ornière depuis si longtemps que le bois a pris " +
          "racine — des pousses sortent du moyeu. Tu contournes, la main sur " +
          "le ridelle.",
        examen:
          "Le chargement a disparu depuis longtemps. Le cheval aussi : le " +
          "harnais pend, coupé net, pas dénoué. Sous le siège, accroché à un " +
          "clou, un grelot de cuivre vert-de-grisé. Il ne sonne pas quand tu " +
          "le décroches. Il sonnera quand il faudra.",
      },
      {
        id: "talus-empreintes",
        label: "Le haut des talus",
        illustration: "assets/scene_chemin_talus_a_c.png",
        approche:
          "Tu montes de trois pas dans la pente, juste assez pour voir la " +
          "crête sans t'exposer entièrement. La terre y est meuble, retournée.",
        savoir: "savoir_bete_crete_nord",
        examen:
          "Des empreintes. Parallèles au chemin. Sur toute sa longueur — mais " +
          "sur la crête NORD seulement : l'autre versant est intact, pas une " +
          "marque. Quelque chose marche là-haut quand quelqu'un marche en bas, " +
          "à la même vitesse, du même pas, et toujours du même côté. Tu " +
          "redescends sans te presser, parce que se presser serait une " +
          "information.",
      },
      {
        id: "marcheur-rebours",
        label: "L'homme qui marche à reculons",
        leadsTo: "marcheur-1",
        illustration: "assets/monstre_marcheur_rebours_c.png",
        approche:
          "Tu ralentis pour le laisser venir. Il marche à reculons d'un pas " +
          "sûr, les talons trouvant le sol comme des yeux.",
        examen:
          "Son visage est tourné vers ce qu'il laisse derrière lui. " +
          "C'est-à-dire, dans un instant : vers toi.",
      },
    ],
    choices: [
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
    /* Événement du Chemin Creux : le coude aveugle. Le lieu se referme sur son
       propre danger — l'endroit exact où il devrait y avoir quelque chose. */
    id: "chemin-creux-2",
    illustration: "assets/scene_chemin_creux_c.png",
    narration: [
      "Le chemin tourne, et le talus mange la vue d'un coup. Passé le coude : " +
        "rien. C'est-à-dire l'endroit exact où il devrait y avoir quelque " +
        "chose, et il n'y a rien.",
      "Le silence y est plus épais d'un cran, comme après un bruit que tu " +
        "aurais raté d'une seconde.",
    ],
    choices: [
      {
        id: "franchir-coude",
        label: "Franchir le coude",
        risky: {
          stat: "INSTINCT",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu presses le pas aux bons moments et tu t'arrêtes aux autres — sans savoir pourquoi, exactement quand il faut. Derrière toi, au-dessus, quelque chose s'arrête aussi, et repart trop tard. Le creux est traversé. Tu as pris un pas d'avance sur ce qui compte les pas.",
            "Tu passes le coude d'une traite, l'épaule au talus nord. Rien ne tombe, rien ne sort. Le chemin se rouvre sur la lande et tu ressors du couloir de terre entier.",
            "Tu passes trop lentement. Rien n'attaque — mais quelque chose t'accompagne sur la crête jusqu'au bout du creux, à ta hauteur, réglant son pas sur le tien, et ne s'arrête que là où le talus s'abaisse.",
            "1 naturel. Au milieu du coude, tu comprends que le silence n'était pas vide : il était retenu. Quelque chose, tout près, avait cessé de respirer pour t'écouter passer. ♦ −2"
          ),
        },
      },
      {
        id: "sortir-par-le-talus",
        label: "Sortir par le talus",
        passive: {
          consequence:
            "Tu renonces au coude. Tu grimpes, à quatre pattes sur les trois " +
            "derniers pas, et tu ressors à découvert dans la bruyère. La " +
            "lande te voit — tant mieux. Derrière toi, en bas, le creux " +
            "continue tout seul, et tu n'entends jamais ce qui le traverse.",
        },
      },
      {
        /* SAVOIR (25/07) : les empreintes du talus — ou le conseil du Marcheur
           — apprennent que la Bête ne longe QUE la crête nord. L'information
           remplace le jet : on ne devine plus, on sait. Le danger n'a pas
           baissé, il a été contourné. */
        id: "longer-cote-sud",
        label: "Longer le côté sud",
        requiresSavoir: "savoir_bete_crete_nord",
        passive: {
          consequence:
            "Tu passes le coude épaule contre le talus SUD, du côté vierge " +
            "d'empreintes, et tu marches sans accélérer. Au-dessus, à droite, " +
            "sur la crête nord, quelque chose t'accompagne un moment — puis " +
            "s'arrête, parce que le versant s'interrompt et qu'elle ne " +
            "traverse pas. Tu ressors du creux entier, et sans avoir couru.",
        },
      },
    ],
    jailerLine: "Le coude. Toujours le coude. Trois cents ans que je regarde des gens accélérer juste avant.",
  },
  {
    /* LE MARCHEUR À REBOURS — Chemin Creux · rare. Trente ans qu'il ne montre
       son dos à rien. Sa récompense est un SAVOIR, pas un objet. */
    id: "marcheur-1",
    illustration: "assets/monstre_marcheur_1_b.png",
    chainNext: "marcheur-2",
    // Sa première réplique DIT le versant : l'écouter vaut avoir lu les traces.
    savoir: "savoir_bete_crete_nord",
    narration: [
      "Il ne s'arrête pas à ta hauteur. Il ralentit, c'est tout — et te parle " +
        "en te dépassant, le regard toujours fixé sur le chemin derrière toi.",
      "— « Marche pas côté nord du creux. » Pas de bonjour. Ici, les conseils " +
        "sont les politesses. « Elle longe la crête nord. Toujours. Les " +
        "empreintes du sud, c'est les vieilles. »",
    ],
    choices: [
      {
        id: "marcheur-vue",
        label: "« Vous l'avez vue ? »",
        passive: {
          consequence:
            "— « Vue, non. » Il continue de reculer, toujours au même rythme. " +
            "« Mais je sais où elle est pas. C'est déjà la moitié d'une " +
            "carte. » Il tapote sa tempe sans regarder. « L'autre moitié, " +
            "personne l'a jamais eue longtemps. »",
        },
      },
      {
        id: "marcheur-pourquoi",
        label: "« Pourquoi à reculons ? »",
        passive: {
          consequence:
            "— « Parce qu'elle attaque ce qui lui tourne le dos. » Il le dit " +
            "comme on donne l'heure. « Trente ans que je lui en montre pas " +
            "un. » Tu regardes ses talons trouver l'ornière, la pierre, la " +
            "racine, sans une hésitation. Trente ans, oui.",
        },
      },
    ],
    jailerLine: "Trente ans à reculer pour ne pas mourir. Il appelle ça vivre. Je l'ai noté comme tel.",
  },
  {
    id: "marcheur-2",
    illustration: "assets/monstre_marcheur_2_b.png",
    chainNext: "marcheur-3",
    narration: [
      "— « Tu veux traverser entier ? » Il est déjà trois pas plus loin. " +
        "« Alors fais comme moi jusqu'au coude. Après le coude, elle suit " +
        "plus. Personne sait pourquoi. On va pas lui demander. »",
    ],
    choices: [
      {
        id: "marcheur-imiter",
        label: "Marcher à reculons avec lui",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu pivotes et tu marches. Deux paires de talons dans le silence du creux, réglées l'une sur l'autre. Il commente à voix basse chaque chose que tu ne peux pas voir — l'ornière, la racine, l'endroit où le talus s'abaisse. Tu ressortiras d'ici en sachant lire un chemin creux. Ça ne s'oublie pas.",
            "Tu recules avec lui. C'est atroce les vingt premiers pas, puis le corps comprend. Ses indications s'impriment : la crête nord, les vieilles empreintes, le coude. Tu sauras.",
            "Tu trébuches dans l'ornière au cinquième pas et tu t'étales. Son rire sec est le premier rire des Landes — et il ne s'arrête pas pour t'aider. Il ne s'arrête pas, c'est tout.",
            "1 naturel. Tu recules, les yeux au nord — et pendant une seconde entière, tu vois exactement ce qu'il regarde depuis trente ans. Tu comprends pourquoi il ne se retourne pas. ♦ −2"
          ),
        },
      },
      {
        id: "marcheur-continuer",
        label: "Continuer normalement",
        passive: {
          consequence:
            "Tu restes face au sud, comme tout le monde. « Comme tu veux », " +
            "dit-il en s'éloignant. « C'est ton dos. » Il n'y a pas de " +
            "reproche dedans. Juste un constat de comptable.",
        },
      },
    ],
    jailerLine: "Il t'offre trente ans d'expérience gratuitement. Prends. Les cadeaux gratuits, ici, c'est moi qui les facture.",
  },
  {
    id: "marcheur-3",
    illustration: "assets/monstre_marcheur_3_b.png",
    chainNext: "chemin-creux-2",
    narration: [
      "Au coude, il pivote enfin — face au nord, dos au sud — et s'éloigne à " +
        "reculons vers là d'où tu viens.",
      "Juste avant que le talus ne le mange, il lève deux doigts vers toi. Pas " +
        "un adieu. Un décompte : deux yeux. Il te rappelle d'en garder autant " +
        "derrière la tête.",
    ],
    choices: [{ id: "marcheur-saluer", label: "Reprendre le creux" }],
    jailerLine: "Deux doigts. Deux yeux. Il en manque toujours un troisième — le mien.",
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
    /* Chantier 5 (23/07) : un lieu = une SÉQUENCE (arrivée sensorielle →
       examen optionnel → événement → sortie), jamais un beat unique. L'écran
       d'arrivée porte l'id du pool (orientation/visited/chapitre), l'événement
       vit dans « -2 » via chainNext. */
    /* Lieu à POINTS D'INTÉRÊT (spec 24/07 suite §1, script Notion « Les Landes
       — Scripts ») : arrivée qui montre les points à DISTANCE → marche +
       examen → événement → sortie. Lieu-signature, quasi garanti. */
    id: "colline-aux-gibets",
    illustration: "assets/scene_colline_aux_gibets_c.png",
    soupconOnArrival: 1, // être vu près des potences (chantier 3)
    chainNext: "colline-aux-gibets-2",
    narration: [
      "La pente est douce et n'en finit pas — la Colline se mérite à pas " +
        "comptés. Au sommet, le cercle : neuf potences ordinaires, plantées " +
        "comme les heures d'un cadran. Et au centre, l'autre. La grande. Sa " +
        "corde est la seule chose neuve à dix lieues.",
      "À gauche du cercle, un poteau isolé porte encore son occupant. À " +
        "droite, les potences vides alignent leurs noms gravés.",
    ],
    pointsInteret: [
      {
        id: "corbeaux-compte",
        corbeaux: true,
        label: "Les corbeaux, sur la traverse",
        illustration: "assets/monstre_corbeaux_du_compte_b.png",
        approche:
          "Ils sont sur la traverse du grand gibet, immobiles, et ils ne " +
          "bougent pas quand tu approches — ce qui n'est pas un comportement " +
          "d'oiseau. Aucun ne te regarde. Ils regardent la corde.",
        examen:
          "Ils ne mangent pas. Il n'y a rien à manger ici depuis longtemps, " +
          "et leurs becs sont propres. Ils attendent, et ils sont exactement " +
          "assez nombreux pour ce qu'ils attendent.",
      },
      {
        id: "potences-cercle",
        chapterFragment: true,
        label: "Les potences du cercle",
        illustration: "assets/scene_colline_potences_cercle_a_c.png",
        approche:
          "Tu entres dans le cercle. Le vent monte d'un cran dès le premier " +
          "pas entre deux potences — pas plus fort ailleurs, plus fort ICI, " +
          "comme si l'espace entre les mâts avait son climat.",
        examen:
          "Chaque potence porte un nom gravé au pied, et une date. Les " +
          "entailles sont de la même main — appliquée, régulière, la main de " +
          "quelqu'un qui grave comme on rend un jugement.",
      },
      {
        id: "gibet-vide",
        chapterFragment: true,
        label: "Le Gibet Vide, au centre",
        illustration: "assets/scene_colline_gibet_vide_a_b.png",
        approche:
          "Tu marches vers le centre, et la chose grandit plus vite que tes " +
          "pas. À dix mètres, tu comprends que tu avais mal jugé l'échelle. À " +
          "trois, tu dois lever la tête pour voir le nœud.",
        examen:
          "Le bois est d'œuvre, assemblé pour durer mille ans. La corde " +
          "neuve grince. Par grand soleil — rare, ici — l'ombre portée " +
          "s'étend vers le sud, et elle a une forme que la potence n'explique pas.",
      },
      {
        id: "poteau-pendu",
        label: "Le poteau isolé, à gauche",
        soupcon: 1, // s'intéresser au Pendu se voit de loin
        approche:
          "Tu contournes le cercle par la gauche. Le poteau isolé est plus " +
          "bas que les autres — à hauteur d'homme, exactement. Une hauteur " +
          "qu'on choisit.",
        examen:
          "Chaîne de fonction au cou, sous la corde. Un sceau au poing. Et " +
          "les yeux qui s'ouvrent quand tu arrives à portée de voix : le " +
          "Bailli des Landes, pendu le dernier, à la place d'honneur.",
      },
    ],
    choices: [{ id: "monter-sommet", label: "Rester au sommet" }],
    jailerLine: "Les corbeaux tiennent mes comptes locaux. Bénévoles, en plus.",
  },
  {
    /* Événement du lieu (script Notion) : le grincement rythmé — les cordes du
       cercle se balancent ENSEMBLE, sans vent. Compter, c'est compter ses
       propres morts (mémoire du joueur). */
    id: "colline-aux-gibets-2",
    illustration: "assets/scene_colline_aux_gibets_c.png",
    narration: [
      "Le vent tombe d'un coup, comme on ferme une porte. Et dans ce calme " +
        "plat, les neuf cordes du cercle se mettent à bouger. Pas au hasard : " +
        "ensemble. Un balancement lent, réglé, qui va et vient sur le même temps.",
      "Ça grince en mesure. Neuf cordes, un seul rythme. Tu comprends, avec " +
        "un retard qui te coûte, que ce rythme ne t'est pas indifférent — " +
        "tu pourrais le compter.",
    ],
    choices: [
      {
        id: "echarde",
        label: "Arracher une écharde",
        setsEnvFlag: "echarde-gibet-prelevee",
        // Chantier 1+5 : l'objet vit dans le choix d'examen — l'Écharde se
        // GAGNE au sommet, elle n'est pas ramassée à l'arrivée.
        grantsLoot: "echarde-gibet",
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
        id: "compter-battements",
        label: "Rester et compter",
        risky: {
          stat: "INSTINCT",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu comptes jusqu'au bout, sans ciller. Le nombre tombe, et il ne te dit rien — pas encore. Tu le retiens quand même. Un jour, en te réveillant sur une autre borne, tu te souviendras de ce chiffre et tu sauras exactement ce qu'il comptait.",
            "Tu comptes. Le nombre est petit, et c'est le pire : les cordes ne battent pas les morts de la lande. Elles battent les tiennes. Le compte est juste. Tu redescends sans le dire à voix haute.",
            "Tu perds le fil au milieu — les cordes changent de mesure dès qu'on les suit, et tu comprends que compter, ici, c'est se faire compter. Le rythme reprend, plus lent, comme si on t'attendait.",
            "1 naturel. Tu comptes, et la dernière corde attend ton chiffre pour bouger. Elle a bougé. Tu as donné le nombre le premier. ♦ −2"
          ),
        },
      },
      {
        id: "redescendre",
        label: "Partir avant de comprendre",
        passive: {
          consequence:
            "Tu tournes le dos au cercle avant d'avoir fini de compter — et " +
            "c'est peut-être la chose la plus sage que tu feras aujourd'hui. " +
            "Le grincement continue derrière toi, patient, comme une phrase " +
            "qu'on garde pour la prochaine fois.",
        },
      },
    ],
    jailerLine: "Le Gibet Vide n'est pas vide. Il est réservé.",
  },
  {
    // Le gardien-jalon de la zone (spec « mémoire des gardiens » : Intact →
    // Balafré → Rompu — la mémoire inter-runs viendra avec le système ; la
    // scène pose l'identité). Pas un combat : le Bailli pendu JUGE.
    id: "pendu-qui-parle",
    illustration: "assets/monstre_pendu_qui_parle_a.png",
    chainNext: "pendu-qui-parle-2",
    narration: [
      "Au revers de la colline, un gibet bas, à hauteur d'homme. Le pendu " +
        "qui s'y balance ouvre les yeux à ton approche. Chaîne de fonction " +
        "au cou, sous la corde. Un sceau au poing. Le Bailli des Landes — " +
        "pendu le dernier, à la place d'honneur.",
    ],
    choices: [
      {
        id: "detailler-sceau",
        label: "Détailler le sceau à son poing",
        passive: {
          consequence:
            "Le sceau est serré dans sa main comme une charge qu'on n'a pas " +
            "rendue. Le motif t'arrête : tu l'as déjà vu. Partout, en fait — " +
            "gravé discret dans la pierre de la borne, le bois des poteaux, " +
            "le fer du puits. Les Landes entières sont timbrées à sa marque.",
        },
      },
      {
        id: "jauger-pendu",
        label: "Le jauger sans approcher",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu lis le gibet avant l'homme : bâti bas EXPRÈS, à hauteur de regard. Il ne pend pas — il siège. Et sa corde à lui n'est pas usée : il ne s'est jamais débattu. Ce savoir vaut une arme, ici.",
            "Quelque chose cloche et tu finis par le voir : ses pieds touchent presque terre. Il pourrait se poser. Il ne le fait pas. Ce n'est pas une exécution, c'est une permanence.",
            "Tu l'observes trop longtemps — c'est lui qui finit de t'observer le premier. « On se demande lequel est exposé », dit la corde en grinçant. Tu as perdu l'avantage du regard.",
            "1 naturel. Tu le jauges. Il attend poliment que tu aies fini — puis rend son verdict d'un mot que tu n'entends pas, mais que la colline note. ♦ −2"
          ),
        },
      },
      { id: "approcher-gibet", label: "S'approcher du gibet bas" },
    ],
    jailerLine: "Regarde-le bien. C'est ce que devient un homme qui a voulu tenir MON registre.",
  },
  {
    id: "pendu-qui-parle-2",
    illustration: "assets/monstre_pendu_qui_parle_2_a.png",
    foe: "bailli-pendu",
    narration: [
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
    /* Lieu à POINTS D'INTÉRÊT (script Notion). */
    id: "champ-des-fixes",
    illustration: "assets/scene_champ_des_fixes_b.png",
    chainNext: "champ-des-fixes-2",
    narration: [
      "Pas de tombes — des poteaux. Des rangées de poteaux plantés droit, un " +
        "nom sur chaque, alignés face au nord. Dos au sud. Même morts, surtout " +
        "morts, on ne les laisse pas regarder par là.",
      "Au fond, des poteaux vierges attendent, déjà plantés. Près de " +
        "l'entrée, la cabane du Fossoyeur.",
    ],
    pointsInteret: [
      {
        id: "les-rangees",
        chapterFragment: true,
        label: "Les rangées et leurs noms",
        illustration: "assets/scene_champ_rangees_a_d.png",
        approche:
          "Tu marches entre deux rangs. Le sol est tassé par des allées et " +
          "venues régulières — on entretient ce champ comme un jardin, et " +
          "c'est ça qui serre le ventre.",
        examen:
          "Les noms des premières rangées sont presque effacés. Les dernières " +
          "sont fraîches. Entre les deux, une rangée entière porte la même " +
          "date — un seul jour, neuf fixations. Il y a une histoire là-dedans " +
          "que personne ne raconte.",
      },
      {
        id: "poteaux-vierges",
        label: "Les poteaux vierges, au fond",
        illustration: "assets/scene_champ_poteaux_vierges_b.png",
        soupcon: 1, // réagir devant les poteaux d'avance se voit
        savoir: "savoir_poteau_a_mon_nom",
        approche:
          "Il faut traverser tout le champ pour les atteindre. Tu comptes les " +
          "poteaux vides en marchant — puis tu t'arrêtes de compter, parce que " +
          "le compte monte plus vite que tes pas.",
        examen:
          "Trois poteaux portent déjà des noms, sans date. Le Fossoyeur grave " +
          "d'avance « ceux dont c'est sûr ». Le troisième nom est récent — " +
          "l'entaille est claire, le bois n'a pas encore grisé. Tu le lis, et " +
          "tu le relis, et il ne change pas : c'est le tien. Quelqu'un ici " +
          "sait déjà comment ça finit, et a pris le temps de tailler proprement.",
      },
      {
        id: "tombe-sans-poteau",
        grantsLoot: "craie-condamne",
        label: "Un vide dans une rangée pleine",
        illustration: "assets/scene_champ_tombe_manquante_a_c.png",
        approche:
          "Tu l'as repéré de loin sans savoir quoi : un défaut d'alignement, " +
          "un rythme cassé. En approchant, tu comprends — il manque un poteau " +
          "au milieu d'une rangée pleine, comme une dent tombée.",
        examen:
          "La terre y est ancienne, tassée : il y a eu un poteau, ici. On l'a " +
          "retiré. Pas arraché — descellé proprement, puis rebouché. Quelqu'un " +
          "a voulu que ce nom-là cesse d'exister sans que le champ s'en aperçoive.",
      },
    ],
    choices: [{ id: "rester-champ", label: "Rester dans le champ" }],
    jailerLine: "Un champ entier de fixés, et c'est toi qui bouges encore. Profites-en, ça fausse mes moyennes.",
  },
  {
    id: "champ-des-fixes-2",
    illustration: "assets/monstre_fossoyeur_poteaux_a.png",
    narration: [
      "Entre les rangs, un vieil homme redresse un poteau qui penche, avec " +
        "des gestes de jardinier. Il t'a vu venir de loin — les vivants " +
        "font un bruit particulier, ici. Il ne s'interrompt pas : il " +
        "t'attend au travail, comme on attend un outil.",
    ],
    choices: [
      {
        id: "aider-fossoyeur",
        label: "Aider à redresser",
        // Le Carnet se GAGNE auprès du Fossoyeur (chantiers 1+5) — plus de
        // ramassage automatique à l'arrivée dans le champ.
        grantsLoot: "carnet-fossoyeur",
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
      { id: "carnet", label: "Déchiffrer le carnet", locked: { stat: "RUSE" } },
      {
        id: "passer-fossoyeur",
        label: "Passer sans un mot",
        passive: {
          consequence:
            "Tu passes au large de son rang. Il ne lève pas la tête — mais " +
            "sa main s'arrête sur le poteau, juste le temps que tu sois " +
            "passé. Ici, même la politesse se mesure en immobilité.",
        },
      },
    ],
    jailerLine: "Le Fossoyeur est mon employé du mois. Tous les mois. Il ne se plaint jamais du salaire.",
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
    /* ═══ L'ENTRÉE DU HAMEAU — séquence garantie HORS TIRAGE (spec 24/07
       suite §3 + script Notion « étalon d'émotion »). On ne « visite » pas le
       Hameau : on y fait halte. 5 beats scriptés, joués à la première arrivée
       de chaque traversée. Émotion cible : ce ne sont pas eux qui te font
       peur — c'est TOI qui leur fais peur.
       ⚠️ Images : `hameau_approche` / `hameau_ruelle` sont au lot Leonardo à
       venir — on retombe en attendant sur l'ambiance générique de zone et les
       portraits existants (fallback prévu par la spec §4). */
    id: "serment-hameau",
    illustration: "assets/scene_hameau_dense2_b.png",
    chainNext: "hameau-entree-2",
    narration: [
      "Les toits apparaissent au creux du plateau — de l'ardoise affaissée, " +
        "des murs qui tiennent par habitude. Une seule cheminée fume, sur une " +
        "vingtaine.",
      "Tu es encore loin quand tu comprends ce qui cloche : aucun chien " +
        "n'aboie.",
    ],
    choices: [
      {
        id: "observer-couvert",
        label: "Observer d'abord, à couvert",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu te couches dans la bruyère et tu attends. Un quart d'heure, et le hameau se trahit : des silhouettes postées aux fenêtres, une par maison habitée, immobiles. Ils guettent la crête. Tu les as vus avant qu'ils te voient — et ça, ça vaut plus qu'une arme ici.",
            "À couvert derrière un muret, tu prends la mesure du village : onze maisons vivantes sur vingt, et pas un mouvement dehors. Ce n'est pas un hameau qui dort. C'est un hameau qui attend.",
            "Tu restes trop longtemps immobile face au village. Quand tu te redresses enfin, une silhouette se détache d'une porte, en bas, et rentre vite. Quelqu'un t'a vu observer — et observer, ici, n'est pas une chose innocente.",
            "1 naturel. Tu observes, à plat ventre, concentré. Derrière toi, une voix polie : « On peut vous aider ? » Ils sont deux. Ils sont montés pendant que tu regardais en bas. ♦ −2"
          ),
        },
        soupcon: 1,
      },
      { id: "descendre-hameau", label: "Descendre vers le hameau" },
    ],
    jailerLine: "Un village entier qui s'ampute à petit feu. Et c'est MOI qu'on appelle le monstre.",
  },
  {
    /* Beat 2 — Le seuil. La croix à la craie est un POINT D'INTÉRÊT : voir de
       loin → marcher → toucher (spec §1). */
    id: "hameau-entree-2",
    illustration: "assets/scene_landes_hameau_ruelle_b.png",
    chainNext: "hameau-entree-3",
    narration: [
      "La première maison est à dix pas. Sur sa porte, un signe à la craie — " +
        "une croix, simple, tracée à hauteur d'œil.",
      "La poudre blanche est encore sur le seuil. Ça date de ce matin.",
    ],
    pointsInteret: [
      {
        id: "croix-craie",
        soupcon: 1, // toucher à une porte marquée, dans une rue qui regarde
        label: "S'approcher de la croix",
        illustration: "assets/scene_hameau_croix_craie_a_a.png",
        approche:
          "Dix pas dans une rue qui ne fait aucun bruit. Tu marches au milieu, " +
          "d'instinct — le plus loin possible des deux rangées de portes.",
        examen:
          "De près, on voit que le bois est usé à cet endroit précis. Des " +
          "croix, il y en a eu d'autres, ici. Effacées, retracées. Celle-ci " +
          "n'est que la dernière.",
      },
      {
        id: "femme-sur-le-seuil",
        label: "La femme sur le pas de porte",
        leadsTo: "femme-seuil-1",
        illustration: "assets/monstre_femme_au_seuil_b.png",
        approche:
          "Plus bas dans la rue, une femme se tient sur un pas de porte, " +
          "immobile. Pas comme on prend l'air : comme on monte la garde. Tu " +
          "traverses la rue vers elle.",
        examen:
          "Son regard est posé sur le bout de la rue, vers le sud, et il ne " +
          "bouge pas quand tu approches. Elle t'a vu. Elle a décidé que tu " +
          "n'étais pas la bonne silhouette.",
      },
    ],
    choices: [
      {
        id: "frapper-porte-marquee",
        label: "Frapper à la porte marquée",
        soupcon: 1, // on a vu l'étranger s'intéresser aux marqués
        passive: {
          consequence:
            "Tu frappes trois coups. Personne n'ouvre. Mais derrière le bois, " +
            "à quelques centimètres de ta main, quelqu'un retient son souffle " +
            "— et tu l'entends le retenir. Tu recules. Dans ton dos, une " +
            "autre porte se ferme, qui était entrouverte.",
        },
      },
      { id: "continuer-rue", label: "Continuer dans la rue" },
    ],
    jailerLine: "Une croix à la craie. Ils marquent leurs condamnés à l'avance — c'est mon métier, ça. Amateurs.",
  },
  {
    /* LA FEMME AU SEUIL — rencontre ÉTALON des scripts (Hameau · commune).
       Ouverte depuis le seuil du hameau, elle rejoint ensuite le barrage :
       une rencontre ne fait jamais dérailler la séquence garantie. */
    id: "femme-seuil-1",
    illustration: "assets/monstre_femme_seuil_1_c.png",
    chainNext: "femme-seuil-2",
    narration: [
      "Quand tu arrives à sa hauteur, elle tressaille. Une seconde — moins — " +
        "son visage s'ouvre, et tu vois ce qu'elle était avant : quelqu'un " +
        "qui attendait quelqu'un.",
      "Puis ça se referme. « Non. Tu marches pas comme lui. »",
      "Elle resserre son châle. « Mon fils est parti par là. » Elle ne montre " +
        "pas la direction — personne ici ne montre le sud avec la main. « Il " +
        "entendait plus ce que je disais, à la fin. Il entendait autre chose. »",
    ],
    choices: [
      {
        id: "femme-depuis-quand",
        label: "« Depuis combien de temps ? »",
        passive: {
          consequence:
            "Elle réfléchit, et c'est le pire : elle doit vraiment compter. " +
            "« Trois hivers. » Puis, plus bas, comme une correction " +
            "administrative : « Deux. Deux hivers. » Elle ne se trompe pas " +
            "de chiffre par oubli. Elle se trompe pour que ce soit moins.",
        },
      },
      {
        id: "femme-verite",
        label: "Lui dire qu'il ne reviendra pas",
        risky: {
          stat: "EMPATHIE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tu ne lui prends rien. Tu lui dis, simplement, et de telle façon qu'elle puisse le poser au lieu de le porter. Elle ne pleure pas — elle s'assied sur son seuil, pour la première fois depuis deux hivers, et te remercie d'une phrase qui n'a rien à voir : « Vous avez faim ? »",
            "Tu le dis. Elle ne répond pas tout de suite. Puis : « Je sais. » Et après un silence : « Mais si j'arrête de regarder, alors c'est moi qui l'aurai laissé partir. » Elle reprend sa faction. Vous avez été honnêtes tous les deux.",
            "Les mots sortent trop droits. Son visage se ferme comme une porte de grange, et derrière ce bois-là il n'y a plus personne à qui parler. Dans la rue, deux volets bougent : on t'a vu faire pleurer une mère.",
            "1 naturel. Tu lui dis qu'il ne reviendra pas. Elle te regarde enfin — vraiment — et demande, très calme : « Et toi ? Tu reviendras ? » ♦ −2"
          ),
        },
      },
      {
        id: "femme-regarder-sud",
        label: "Regarder le sud avec elle",
        soupcon: 1, // deux personnes qui fixent le sud, ça se voit de loin
        passive: {
          consequence:
            "Tu ne dis rien. Tu te places à côté d'elle, dans le même axe, et " +
            "tu regardes le bout de la rue. Le silence dure longtemps et ne " +
            "pèse rien. Au bout d'un moment elle dit : « Vous l'entendez " +
            "aussi. » Ce n'est pas une question, et tu n'as pas répondu — " +
            "mais quelqu'un, derrière une fenêtre, a compté deux dos tournés " +
            "vers le sud.",
        },
      },
    ],
    jailerLine: "Elle attend un fils qui est arrivé chez moi il y a deux hivers. Il n'a pas demandé de ses nouvelles.",
  },
  {
    id: "femme-seuil-2",
    illustration: "assets/monstre_femme_seuil_2_c.png",
    chainNext: "femme-seuil-3",
    narration: [
      "« Tu descends, toi aussi. Ça se voit. Vous avez tous le même pas. » " +
        "Elle fouille sous son châle et en tire quelque chose qu'elle tient " +
        "serré.",
      "« Si tu le croises. S'il reste quelque chose à croiser. »",
      "Une mèche de cheveux, nouée d'un fil. « Tu lui donnes. Il saura. »",
    ],
    choices: [
      {
        id: "femme-accepter",
        label: "Accepter la mèche",
        grantsLoot: "meche-nouee",
        passive: {
          consequence:
            "Tu tends la main. Elle y dépose la mèche avec une précaution " +
            "ridicule, comme si le fil pouvait casser, et referme tes doigts " +
            "dessus avec les siens. « Voilà. » Elle recule d'un pas. " +
            "« Voilà. » Elle n'a plus rien à dire et elle le sait.",
        },
      },
      {
        id: "femme-refuser",
        label: "Refuser doucement",
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu refuses de telle manière que ça devienne une promesse plus grande : tu ne prends pas la mèche, mais tu prends le nom. Elle te le donne comme on confie une clé. Le nom, tu le porteras plus loin qu'un fil de cheveux.",
            "Tu refuses sans mentir : tu ne sais pas si tu ressortiras. Elle hoche la tête, range la mèche sous le châle. « C'est honnête. » Ça lui coûte de le dire, et elle le dit quand même.",
            "Tu refuses mal — trop vite, en reculant d'un demi-pas. Sa main reste tendue trois secondes de trop, seule, dans la rue vide, et deux volets s'entrouvrent sur ce tableau-là.",
            "1 naturel. Tu refuses. Elle range la mèche, et dit, sans aucune méchanceté : « C'est ce qu'il a dit aussi, en partant. Qu'il ne prendrait rien. » ♦ −2"
          ),
        },
        soupcon: 1,
      },
      {
        id: "femme-echange",
        label: "« Et en échange ? »",
        risky: {
          stat: "RUSE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu poses la question de façon qu'elle sonne comme un service qu'on lui rend — accepter de recevoir. Elle disparaît un instant et revient avec du pain, du vrai, et une information qui vaut plus : qui, dans ce hameau, ouvre encore sa porte la nuit.",
            "Elle te regarde autrement, sans reproche : ici, on marchande tout, même les morts. Elle donne du pain et une phrase utile sur la Palissade. Le marché est équitable et vous le savez tous les deux.",
            "La question tombe mal. Elle ne se fâche pas — elle range la mèche, c'est tout, et ça vaut toutes les insultes. Dans son dos, la porte se ferme d'elle-même, comme si la maison avait tranché.",
            "1 naturel. « En échange ? » Elle répète les mots lentement, puis les rend au silence. Quelque part dans la rue, quelqu'un les répète aussi. ♦ −2"
          ),
        },
        soupcon: 1,
      },
      {
        /* SAVOIR (25/07) : avoir vu son reflet en retard dans la Mare, c'est
           avoir la preuve qu'on entend. On ne peut plus le nier — mais on peut
           le DIRE, à quelqu'un qui porte une croix à la craie sur sa porte.
           ⚠️ ÉCART ASSUMÉ avec la table Notion, qui posait cette option sur
           l'Hésitant beat 2 : l'Hésitant n'est joignable que depuis la Borne
           Frontière, c'est-à-dire au PREMIER écran de la run, donc toujours
           avant la Mare — l'option n'aurait jamais pu s'ouvrir. La Femme au
           Seuil tient le même rôle (aveu réciproque, EMPATHIE forte) et elle
           est, elle, atteignable après la Mare. */
        id: "femme-moi-aussi",
        label: "« Moi aussi, j'entends. »",
        requiresSavoir: "savoir_reflet",
        risky: {
          stat: "EMPATHIE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tu le dis simplement, et tu ajoutes le détail qui ne s'invente pas : le reflet en retard. Elle ferme les yeux. Quand elle les rouvre, elle ne te regarde plus comme un étranger qui descend — elle te regarde comme on regarde quelqu'un de la famille qu'on n'attendait plus. Elle te donne la mèche, le nom, et une chose que personne n'a offerte à personne ici depuis des années : sa porte, ouverte, si tu remontes.",
            "Elle te laisse finir, sans reculer. « Je sais », dit-elle. « Ta figure le dit depuis le début. » Elle te met la mèche dans la main, referme tes doigts, et pour la première fois quelqu'un du hameau te touche sans hésiter.",
            "Tu le dis, et elle recule. Pas de dégoût : de la panique — pour toi. « Ne le dis à personne d'autre. » Elle regarde à droite, à gauche, les volets. « À personne, tu m'entends. » Elle rentre, et tu restes seul dans la rue avec un aveu qui traîne dans l'air.",
            "1 naturel. Tu le dis trop fort, ou pas assez seul. Un volet claque quelque part. Elle a pâli — pas de ce que tu es : de ce que ça fait de toi, ici. « Va-t'en. Maintenant. » ♦ −2"
          ),
        },
        grantsLoot: "meche-nouee",
      },
    ],
    jailerLine: "Une mèche de cheveux comme monnaie. Tu vois, même ici, tout le monde comprend le principe du pacte.",
  },
  {
    id: "femme-seuil-3",
    illustration: "assets/monstre_femme_au_seuil_b.png",
    chainNext: "hameau-entree-3",
    narration: [
      "Elle a déjà repris sa place sur le seuil quand tu repars. De la rue, " +
        "on ne voit pas qu'elle a parlé à quelqu'un. On ne voit qu'une femme " +
        "qui regarde le sud.",
      "Ce que tu emportes ne pèse rien. C'est la promesse qui pèse.",
    ],
    choices: [{ id: "femme-repartir", label: "Redescendre la rue" }],
    jailerLine: "Elle reprendra sa faction demain, et après-demain. La constance, chez vous, c'est presque une maladie.",
  },
  {
    /* Beat 3 — Le barrage. Trois Renonçants : leur PEUR, jamais leur menace. */
    id: "hameau-entree-3",
    illustration: "assets/monstre_hameau_entree_3_a.png",
    chainNext: "hameau-entree-4",
    narration: [
      "Ils sont trois à t'attendre au milieu de la rue. Pas armés — un bâton " +
        "de marche, une fourche posée contre un mur, à portée sans être brandie.",
      "Celui du centre est vieux, sec comme un piquet. C'est lui qui parle, et " +
        "sa voix ne tremble pas. Ses mains, si.",
      "— « On ne te chasse pas. » Il le dit d'abord, comme une formule " +
        "apprise. « Personne n'est chassé, ici. Mais tu descends. Ça se voit à " +
        "ton pas. Et ceux qui descendent... » Il ne finit pas. Derrière lui, " +
        "une femme tire un enfant à l'intérieur, sans un mot.",
    ],
    choices: [
      {
        id: "demander-crainte",
        label: "Demander ce qu'ils craignent",
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu poses la question sans défi, comme on demande le chemin. Le vieux baisse la voix, et tout le barrage se penche avec lui : « Il y a ceux qui écoutent le vent. Et il y a ceux que le vent écoute. » Il te regarde droit. « On sait pas encore lequel tu es. Nous non plus, on veut pas le savoir. »",
            "Le vieux mâche sa réponse longtemps. « Ce qu'on craint ? » Il montre le sud du menton — pas de la main, jamais de la main. « Ce qui appelle. Et ceux qui répondent. » C'est tout ce qu'il donnera aujourd'hui.",
            "« Ça ne se demande pas. » Le vieux se ferme d'un coup, et les deux autres avancent d'un demi-pas. Ta question, dans leur grammaire, est déjà un aveu : seuls ceux qui entendent s'intéressent à ce qu'on entend.",
            "1 naturel. Tu demandes ce qu'ils craignent. Le silence qui suit dure trop. Puis, très bas, le vieux : « Toi. » Il n'a pas l'air content de sa propre réponse. ♦ −2"
          ),
        },
        soupcon: 1,
      },
      {
        id: "passer-sans-arret",
        label: "Passer sans t'arrêter",
        risky: {
          stat: "COURAGE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu marches droit sur eux sans changer d'allure. À trois pas, ils s'écartent — pas par peur : par une politesse ancienne qu'ils n'ont pas eu le temps de décider. Le vieux te suit des yeux, et tu sais que le Serment t'attend quand même. Mais tu es passé debout.",
            "Tu ne ralentis pas. Ils s'écartent, à contrecœur, en se serrant. « On te reverra au muret », dit le vieux dans ton dos. Le Serment n'est pas évité. Il est ajourné.",
            "Tu avances — et la fourche change de main. Pas levée : tenue. Le message est clair, et tu t'arrêtes de toi-même. Passer en force ne marche pas chez des gens qui ont déjà décidé d'avoir peur.",
            "1 naturel. Tu passes sans t'arrêter. Le vieux te laisse faire, et lance à la cantonade, calmement : « Notez l'heure. » Quelqu'un, quelque part, note l'heure. ♦ −2"
          ),
        },
        soupcon: 1,
      },
      {
        id: "ne-fais-que-passer",
        label: "« Je ne fais que passer. »",
        passive: {
          consequence:
            "« C'est ce qu'ils disent tous », répond le vieux, sans " +
            "agressivité aucune. « Et certains restent. » Il te regarde " +
            "enfin dans les yeux, et ce que tu y vois n'est pas de la " +
            "méfiance : c'est de la fatigue. « C'est ça qui nous inquiète. »",
        },
      },
      {
        /* SAVOIR (25/07) : l'Ordonnance clouée au tribunal liste ce que le
           hameau guette. La connaître, c'est pouvoir se tenir de façon à ne
           déclencher aucun de ses signes — le seul choix de la scène qui FAIT
           BAISSER le Soupçon au lieu de le monter. */
        id: "tenir-selon-ordonnance",
        label: "Te tenir comme eux",
        requiresSavoir: "savoir_ordonnance",
        soupcon: -1,
        passive: {
          consequence:
            "Tu ne réponds pas tout de suite. Tu tournes les épaules au sud, " +
            "comme eux. Tu regardes le sol quand le vieux parle, tu ne fixes " +
            "rien plus longtemps qu'il ne faut, et quand un souffle passe " +
            "entre les murs, tu ne lèves pas la tête. Quatre signes qu'ils " +
            "guettent, quatre signes que tu ne donnes pas.",
        },
      },
    ],
    jailerLine: "Regarde-les. Trois hommes qui tremblent devant un mort. Ils ont raison, remarque.",
  },
  {
    /* Beat 4 — Le Serment. Mécanique de zone : IMPOSÉ, jamais proposé.
       « Pourquoi trois aubes » est un point d'intérêt : on peut le demander,
       puis revenir au choix (spec §1 : le POI ne consomme pas le tour). */
    id: "hameau-entree-4",
    illustration: "assets/monstre_hameau_entree_4_c.png",
    chainNext: "hameau-entree-5",
    narration: [
      "Le vieux tend la main, paume ouverte. Pas pour serrer la tienne — pour " +
        "que tu la regardes. Elle est vide. C'est le geste d'ici : on jure sur " +
        "rien, parce qu'il ne reste rien.",
      "— « Trois choses, et tu dors sous un toit. Tu ne parles pas aux " +
        "pendus. Tu ne regardes pas le sud plus qu'il ne faut. Et tu pars " +
        "avant la troisième aube. »",
    ],
    pointsInteret: [
      {
        id: "pourquoi-trois-aubes",
        soupcon: 1, // poser LA question devant tout le barrage
        label: "Demander pourquoi trois aubes",
        approche:
          "Tu ne réponds pas tout de suite. Tu poses la question, et le " +
          "barrage entier attend sa réponse avec toi — comme si personne " +
          "n'avait jamais osé la poser.",
        examen:
          "— « Parce qu'à la quatrième, on commence à s'habituer à toi. » Le " +
          "vieux hausse une épaule, presque désolé. « Et on ne peut pas se " +
          "permettre de s'habituer. »",
      },
    ],
    choices: [
      {
        id: "jurer-serment",
        serment: "jure",
        label: "Jurer",
        soupcon: -1,
        passive: {
          consequence:
            "Tu poses ta main au-dessus de la sienne, sans la toucher — c'est " +
            "ainsi qu'on fait, tu l'as compris à leurs regards. Tu jures les " +
            "trois choses. Le vieux hoche la tête une fois, et tout le " +
            "barrage se dénoue d'un coup, comme une corde qu'on lâche. " +
            "« Tenu jusqu'à la sortie », rappelle-t-il. Le hameau entier a " +
            "entendu. Et plus haut que le hameau, quelqu'un d'autre.",
        },
      },
      {
        id: "jurer-faux",
        serment: "faux",
        label: "Jurer du bout des lèvres",
        soupcon: 1,
        // Prix différé (§17) : un serment creux, dans les Landes, ça s'entend.
        debt: {
          id: "serment-creux",
          settleInSteps: 4,
          text:
            "Le serment que tu as prêté du bout des lèvres au muret des " +
            "Renonçants se rappelle à toi : ta bouche, d'un coup, refuse un " +
            "mot — un seul, celui dont tu avais justement besoin. Les " +
            "serments creux se paient en paroles pleines. Quelque part, le " +
            "vieux hoche la tête sans surprise.",
        },
        passive: {
          consequence:
            "Tu jures. Les mots sortent dans le bon ordre, à la bonne " +
            "vitesse, et ne pèsent rien. Le vieux les accepte — il n'a pas " +
            "le choix, c'est la règle. Mais il te regarde une seconde de " +
            "trop, et tu comprends qu'il a entendu le vide dedans.",
        },
      },
      {
        id: "refuser-serment",
        serment: "refuse",
        label: "Refuser de jurer",
        soupcon: 2,
        passive: {
          consequence:
            "Tu refuses. Personne ne crie. Le vieux referme lentement sa " +
            "paume vide, et c'est tout. « Personne n'est chassé », répète-t-il " +
            "— et cette fois tu entends ce que ça veut dire vraiment : on ne " +
            "te chassera pas, on te laissera dehors. Aucune porte ne " +
            "s'ouvrira. Aucun toit. Et le hameau te regardera vivre.",
        },
      },
    ],
    jailerLine: "« Tu ne parles pas aux pendus. » Ils te disent ça à TOI. Je ris encore.",
  },
  {
    /* Beat 5 — L'entrée. Résolution, pas de choix : on passe. */
    id: "hameau-entree-5",
    hameauEntree: true,
    illustration: "assets/scene_landes_hameau_ruelle_b.png",
    narration: [
      "Ils s'écartent. Pas beaucoup — juste assez pour que tu passes sans " +
        "toucher personne, et tu comprends que c'est calculé.",
      "La rue s'ouvre devant toi. Des volets se ferment à mesure, un par un, " +
        "un peu en avance sur ton pas. Quelque part, une corde grince.",
      "Tu es entré. Personne ne t'a souhaité la bienvenue, et pourtant tous " +
        "savaient déjà que tu venais.",
    ],
    choices: [{ id: "entrer-hameau", label: "Entrer dans le hameau" }],
    jailerLine: "Bienvenue. C'est moi qui te le dis, puisque personne d'autre ne le fera.",
  },
  {
    /* ═══ LA HALTE — séquence garantie HORS TIRAGE (spec 24/07 suite §3 +
       script Notion). Jouée quand le joueur se dirige vers la sortie de zone
       après l'Entrée. Serment juré → la grange ; Serment refusé → beat 6
       « nuit dehors ». Émotion de sortie : soulagé ET coupable à la fois. */
    id: "hameau-halte-1",
    illustration: "assets/scene_landes_hameau_ruelle_b.png",
    chainNext: "hameau-halte-2",
    narration: [
      "Le vieux te trouve avant que tu ne le cherches. C'est comme ça, ici : " +
        "on sait toujours où tu es.",
      "— « Tu pars demain. » Ce n'est pas une question. « Personne ne marche " +
        "vers le sud de nuit. Même toi. »",
      "Il ne t'invite pas chez lui. Personne n'invite personne. Il te mène à " +
        "la grange, au bout de la rue — la seule porte du hameau qui n'a pas " +
        "de marque à la craie. Pas encore.",
    ],
    choices: [
      {
        id: "demander-ailleurs",
        label: "Demander à dormir ailleurs",
        passive: {
          consequence:
            "— « La grange, ou les Landes. » Le vieux ne discute même pas. " +
            "« Les Landes, la nuit, c'est non. » Il attend, la main tendue " +
            "vers le bout de la rue, jusqu'à ce que tu avances.",
        },
      },
      { id: "suivre-vieux", label: "Le suivre" },
    ],
    jailerLine: "Ils t'offrent un toit. Regarde bien de quel côté est la porte, ensuite.",
  },
  {
    /* Beat 2 — La grange. La barre qu'on pose DEHORS. */
    id: "hameau-halte-2",
    illustration: "assets/scene_landes_hameau_grange_a.png",
    chainNext: "hameau-halte-3",
    narration: [
      "De la paille propre, une couverture qui a servi, une lampe qu'on te " +
        "laisse — la mèche est courte, calculée pour s'éteindre seule.",
      "— « On te rouvre à l'aube. » Le vieux pose la main sur la porte. " +
        "« C'est pas contre toi. »",
      "La porte se ferme. Puis le bruit que tu attendais sans le savoir : une " +
        "barre qu'on pose. Dehors.",
    ],
    pointsInteret: [
      {
        id: "examiner-grange",
        label: "Examiner la grange",
        illustration: "assets/scene_hameau_grange_poutres_a_d.png",
        approche:
          "Tu prends la lampe et tu fais le tour, lentement, en te tenant " +
          "loin des murs — le vieux réflexe de qui ne veut pas être une " +
          "silhouette derrière des planches.",
        savoir: "savoir_grange_comptee",
        examen:
          "Des marques sur les poutres, à hauteur d'homme. Des bâtons de " +
          "comptage — des séries de nuits. Quelqu'un a dormi ici souvent. Ou " +
          "plusieurs quelqu'uns, une nuit chacun. La dernière série s'arrête " +
          "à deux. Et sous chaque bâton, une encoche plus petite, régulière : " +
          "quatre par nuit, toujours quatre. Ce ne sont pas les nuits qu'on " +
          "compte ici. Ce sont les passages de la ronde.",
      },
    ],
    choices: [
      {
        id: "veiller",
        label: "Veiller",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu veilles sans bouger, la lampe soufflée, adossé au bois. Et la nuit se donne tout entière : chaque pas dehors, chaque mot chuchoté, chaque hésitation devant ta porte. Au matin tu sauras du hameau ce que le hameau croyait savoir de toi.",
            "Tu tiens jusqu'au cœur de la nuit, l'oreille contre la planche. Assez pour entendre ce qui se dit. Pas assez pour être reposé — mais reposé n'était pas le but.",
            "Tu veilles, tu veilles, et le sommeil te prend quand même — d'un coup, sans transition, comme une main sur la nuque. Tu te réveilles au gris de l'aube avec une nuit blanche dans les jambes.",
            "1 naturel. Tu veilles. Et à un moment de la nuit que tu ne sauras jamais situer, quelque chose a veillé avec toi, de l'autre côté du bois, exactement à ta hauteur. ♦ −2"
          ),
        },
      },
      { id: "dormir-grange", label: "Dormir", rest: true },
    ],
    jailerLine: "Une barre. Dehors. Ils appellent ça l'hospitalité, ici. Moi aussi, remarque.",
  },
  {
    /* Beat 3 — La nuit. Le script prévoit des variantes par palier de Soupçon ;
       le moteur choisit la bonne au moment de l'insertion (Scene.tsx). */
    id: "hameau-halte-3",
    illustration: "assets/scene_hameau_halte_3_c.png",
    chainNext: "hameau-halte-4",
    narration: [
      "Le hameau ne dort pas comme un village. Pas de rires, pas de disputes, " +
        "pas d'enfant qui pleure. Juste des pas, parfois, qui font une ronde " +
        "que personne n'a annoncée.",
    ],
    choices: [
      {
        id: "ecouter-nuit",
        label: "Écouter sans bouger",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu ne bouges pas d'un cil, et la nuit se laisse lire. Une dénonciation se prépare — pas forcément la tienne, pas encore. Mais le Petit Tribunal siégera avant la prochaine aube, et tu sais maintenant à quoi ressemble le bruit que ça fait.",
            "Les voix se rapprochent, s'attardent, repartent. Tu ne saisis que des morceaux — un nom qui n'est pas le tien, un chiffre, le mot « demain ». Assez pour dormir mal.",
            "La paille craque sous toi. Les voix s'arrêtent net — ce silence-là est une porte qui claque. Puis des pas qui s'éloignent vite, et tu passes le reste de la nuit à te demander ce qu'ils ont compris.",
            "1 naturel. Tu écoutes. Et une voix, tout près, dit ton nom — celui que tu as signé au pacte, celui que personne ici n'a entendu. ♦ −2"
          ),
        },
        soupcon: 1,
      },
      {
        id: "dormir-vraiment",
        label: "Dormir vraiment",
        passive: {
          consequence:
            "Tu décides de ne rien écouter. C'est un travail, de ne pas " +
            "écouter — tu comptes tes propres respirations pour couvrir le " +
            "reste. Ça marche à peu près. Au matin, tu ne sauras pas ce qui " +
            "s'est dit devant ta porte, et c'est exactement ce que tu voulais.",
        },
      },
      {
        /* SAVOIR (25/07) : les encoches des poutres disaient quatre passages
           par nuit. Connaître le rythme de la ronde permet d'écouter dans les
           creux, sans jet.
           ⚠️ ARBITRAGE entre deux lignes du MÊME journal : la table demandait
           qu'« Écouter sans bouger » gagne un cran, mais la règle du Savoir
           (même section) interdit d'ajouter de la puissance — « il ajoute une
           option qui n'existait pas ». On ne baisse donc AUCUN seuil : on ouvre
           une option qui obtient l'information sans dé du tout. Bénéfice
           identique pour le joueur, règle tenue. */
        id: "compter-les-passages",
        label: "Écouter entre deux rondes",
        requiresSavoir: "savoir_grange_comptee",
        passive: {
          consequence:
            "Quatre passages par nuit — c'est ce que disaient les encoches. Tu " +
            "attends le deuxième, tu comptes vingt respirations après que les " +
            "pas se sont éloignés, et c'est là que tu écoutes. Le creux est " +
            "large, et les voix y tombent entières : un nom qui n'est pas le " +
            "tien, le mot « demain », et le Petit Tribunal cité comme on cite " +
            "une heure. Tu es recouché avant le troisième passage. Personne " +
            "n'a rien à noter.",
        },
      },
    ],
    jailerLine: "Ils parlent de toi à travers une planche. Moi je te parle à travers le crâne. Chacun ses moyens.",
  },
  {
    /* Beat 4 — L'aube. Le Serment tenu jusqu'ici se paie ici (−1 Soupçon). */
    id: "hameau-halte-4",
    illustration: "assets/monstre_hameau_halte_4_b.png",
    chainNext: "hameau-halte-5",
    narration: [
      "La barre se soulève au premier gris. Le vieux, seul. Il te tend un " +
        "quignon dur et ne dit rien pendant que tu manges.",
      "— « Aujourd'hui, on fixe personne. » Il regarde ailleurs. « Alors pars " +
        "pendant que c'est vrai. »",
    ],
    choices: [
      {
        id: "partir-aube",
        label: "Partir pendant que c'est vrai",
        soupcon: -1,
        passive: {
          consequence:
            "Tu manges debout, tu rends le linge, tu sors. Sur le seuil, le " +
            "vieux ajoute, à voix basse et sans te regarder : « Tu as juré, " +
            "tu as tenu. Ça se saura. » C'est la seule chose aimable qu'on " +
            "t'aura dite dans ces Landes, et elle sonne comme un service " +
            "rendu.",
        },
      },
    ],
    jailerLine: "« On fixe personne aujourd'hui. » Aujourd'hui. Retiens bien le mot.",
  },
  {
    /* Beat 5 — Le départ escorté. Sortie de la séquence → la traversée reprend
       vers la Palissade / la Descente. */
    id: "hameau-halte-5",
    illustration: "assets/scene_hameau_dense_b.png",
    hameauHalte: true,
    narration: [
      "Ils sont deux à marcher avec toi jusqu'à la Palissade. Pas devant, pas " +
        "derrière : à côté, à un pas de distance — l'escorte de quelqu'un " +
        "qu'on ne touche pas.",
      "Au portillon sud, le plus jeune ouvre. Le vieux reste en arrière. " +
        "C'est lui qui parle, pourtant, au moment où tu passes :",
      "— « Si tu l'entends... » Il cherche ses mots. Il les trouve : " +
        "« Réponds pas. C'est tout ce qu'on sait. C'est tout ce qu'on a " +
        "jamais su. »",
    ],
    choices: [{ id: "franchir-portillon", label: "Franchir le portillon" }],
    jailerLine: "« Réponds pas. » Trente ans de sagesse villageoise, résumés. Ça ne marche pas, mais c'est mignon.",
  },
  {
    /* Beat 6 — variante « nuit dehors » (Serment refusé). Remplace les beats
       1-5 : aucune porte ne s'ouvre à qui n'a pas juré. */
    id: "hameau-halte-dehors",
    illustration: "assets/scene_hameau_dense_c.png",
    hameauHalte: true,
    narration: [
      "Aucune porte, aucune grange. Tu dors contre un muret, côté nord — " +
        "d'instinct.",
      "La nuit des Landes n'attaque pas. Elle compte. Chaque heure a son " +
        "bruit : la corde, les pas, le chant du sud. Au matin, tu n'es pas " +
        "reposé — tu es inventorié.",
    ],
    choices: [
      {
        id: "repartir-inventorie",
        label: "Repartir vers le sud",
        soupcon: 1,
        passive: {
          consequence:
            "Tu te lèves raide, les os pleins de froid. En quittant le " +
            "muret, tu vois ce que la nuit a laissé : des traces de pas " +
            "autour de l'endroit où tu dormais, un cercle complet, à trois " +
            "mètres. Personne ne s'est approché plus près. Personne n'est " +
            "reparti sans avoir regardé.",
        },
      },
    ],
    jailerLine: "Dormir dehors, comme les Appelés avant leur départ. Le village a noté. Le village note tout.",
  },
  /* LA TOUR DE GUET EFFONDRÉE — dernier lieu du Hameau à n'avoir aucune scène
     (relevé le 27/07 : la carte de l'atelier l'affichait « aucune scène
     écrite »). Sa question est celle de la zone entière : on a bâti une tour
     pour voir venir quelque chose, et personne n'a jamais dit quoi. */
  {
    id: "tour-de-guet",
    jailerLine: "Ils ont bâti une tour pour voir venir. Personne n'a jamais écrit quoi.",
    illustration: "assets/scene_tour_de_guet_a.png",
    chainNext: "tour-de-guet-2",
    narration: [
      "La tour n'a plus de sommet. Elle s'arrête net à mi-hauteur, sur une " +
        "bouche de pierres arrachées, et le reste est en tas autour du pied — " +
        "pas éboulé, EMPILÉ. Quelqu'un a rangé les décombres.",
      "L'escalier intérieur tient encore sur trois volées. Au-delà, il monte " +
        "vers rien.",
    ],
    pointsInteret: [
      {
        id: "pierres-rangees",
        chapterFragment: true,
        label: "Les pierres, empilées au pied",
        approche:
          "Tu fais le tour du tas. Il est haut comme un homme et régulier " +
          "sur toute sa longueur — un travail de plusieurs jours, fait par " +
          "quelqu'un qui n'était pas pressé.",
        examen:
          "Les pierres sont posées face gravée contre terre. Tu en retournes " +
          "une : une lettre, un fragment de date. C'était un mur de noms. " +
          "On ne l'a pas démoli — on l'a couché, puis rangé.",
      },
      {
        id: "escalier-vers-rien",
        illustration: "assets/scene_tour_escalier_vers_rien_b.png",
        savoir: "savoir_guet",
        label: "L'escalier qui monte au vide",
        approche:
          "Les marches sont creusées en leur milieu, usées par des passages " +
          "quotidiens. Tu montes les trois volées qui tiennent. La dernière " +
          "s'arrête sur le ciel.",
        examen:
          "À la rupture, la pierre est propre. Pas d'usure, pas de suie : la " +
          "tour n'est pas tombée, on l'a ouverte. Et d'ici, une seule chose " +
          "est visible à l'horizon — la Colline aux Gibets, exactement dans " +
          "l'axe. La tour ne surveillait pas les Landes. Elle surveillait le " +
          "grand gibet.",
      },
      {
        id: "meurtriere-sud",
        grantsLoot: "lunette-guet",
        label: "La meurtrière du sud",
        approche:
          "Une seule ouverture reste intacte, au sud, à hauteur de poitrine. " +
          "Le rebord est poli comme une rampe.",
        examen:
          "Des encoches dans l'embrasure, groupées par cinq. Des centaines. " +
          "Et calée dans une fente, une lunette de cuivre à un seul verre, " +
          "posée là comme on repose un outil qu'on reprendra demain.",
      },
    ],
    choices: [
      {
        id: "monter-guet",
        label: "Monter jusqu'à la rupture",
        risky: {
          stat: "COURAGE",
          threshold: 11,
          outcomes: outcomes(
            "Tu montes jusqu'à la dernière marche et tu restes debout dessus, dans le vide. D'ici, tout le hameau est à tes pieds — et tu comprends que la tour ne servait pas à voir loin : elle servait à être vue de partout, par celui qui tenait la corne.",
            "Tu montes. En haut, le vent te prend de face et tu tiens bon : d'ici on voit tout le hameau, et tout le hameau te voit.",
            "Une marche cède sous ton poids. Tu te rattrapes au mur, la paume ouverte sur l'arête.",
            "La volée entière lâche. Tu tombes sur le tas de pierres rangées, et elles se rangent autour de toi comme si elles t'attendaient.",
          ),
        },
      },
      {
        id: "ecouter-tour",
        passive: {
          consequence:
            "Tu restes au pied et tu écoutes. Le vent entre par la bouche ouverte et ressort par la meurtrière, et ça fait une note — toujours la même. Le hameau a vécu vingt ans avec cette note dans les oreilles.",
        },
        label: "Écouter la tour",
      },
      { id: "quitter-tour", label: "Redescendre le tertre", passive: { consequence: "Tu laisses la tour derrière toi. Elle ne regarde plus rien." } },
    ],
  },
  {
    id: "tour-de-guet-2",
    jailerLine: "Vingt ans de faction. Il n'a rien manqué — il n'y avait rien à voir.",
    // On REPOSE l'image de la tour plutôt que de laisser le champ vide : sans
    // elle, reprendre une partie sauvegardée sur ce beat retombe sur le
    // portail générique, en plein Hameau. Le portrait du Guetteur
    // (`monstre_guetteur_tour`) reste à produire — il est listé dans
    // data/images-a-produire.md.
    illustration: "assets/scene_tour_de_guet_a.png",
    foe: "guetteur-tour",
    foeName: "le Guetteur sans tour",
    narration: [
      "Il est assis sur le tas de pierres, dos à toi, et il regarde le sud " +
        "par-dessus le hameau. Un vieux manteau de guet, la corne au côté. " +
        "Il ne se retourne pas.",
      "— « Tu es monté. » Ce n'est pas une question. « Alors tu as vu ce " +
        "qu'on surveillait. »",
    ],
    choices: [
      {
        id: "guet-demander",
        label: "Demander qui a couché la tour",
        requiresSavoir: "savoir_guet",
        risky: {
          stat: "EMPATHIE",
          threshold: 11,
          outcomes: outcomes(
            "Il se retourne enfin. « Nous. Le jour où on a compris que voir venir ne servait à rien, puisque ça venait de l'intérieur. » Un temps. « Et on a couché le mur des noms en premier. Pour ne plus avoir à les lire en montant. »",
            "Il met du temps. « Nous. Le jour où on a compris que voir venir ne servait à rien, puisque ça venait de l'intérieur. » Il crache. « On a rangé les pierres parce qu'on est des gens rangés. »",
            "Il se ferme d'un coup. « Personne ne l'a couchée. Elle est tombée. » Et il redescend le tertre sans te regarder.",
            "Il se lève lentement. « Qui t'a dit de monter ? » Sa main est sur la corne. En bas, deux volets s'ouvrent dans la ruelle.",
          ),
        },
      },
      {
        id: "guet-corne",
        label: "Lui demander de sonner",
        risky: {
          stat: "RUSE",
          threshold: 13,
          outcomes: outcomes(
            "Il porte la corne à sa bouche — et ne souffle pas. « Voilà. C'est exactement ce qu'on entend depuis vingt ans. » Il te la tend : elle est bouchée à la cire, de l'intérieur. « Ce n'est pas moi qui l'ai bouchée. Et je continue à monter. »",
            "Il porte la corne à sa bouche — et ne souffle pas. « Voilà. C'est exactement ce qu'on entend depuis vingt ans. » Il te la tend : elle est bouchée à la cire, de l'intérieur.",
            "« Sonner quoi ? » Il serre la corne contre lui. « Le dernier qui a sonné, ils sont venus. Pas pour ce qu'il annonçait. Pour lui. »",
            "Il souffle. Rien ne sort — mais dans le hameau, sous toi, on entend distinctement une porte, puis une autre, puis une autre se fermer. « Tu vois. Ils l'entendent quand même. »",
          ),
        },
      },
      {
        id: "guet-partir",
        passive: {
          consequence:
            "Tu le laisses à sa faction. En t'éloignant, tu l'entends dire, pour lui seul : « Quelqu'un doit bien regarder. »",
        },
        label: "Le laisser regarder",
      },
    ],
  },
  {
    id: "marche-muet",
    illustration: "assets/scene_marche_muet_c.png",
    chainNext: "marche-muet-2",
    narration: [
      "Au cœur du hameau, un marché sans un cri. Des étals de trois fois " +
        "rien — clous, laine, racines — et des marchands qui négocient par " +
        "gestes, paumes et hochements. Renoncer à la parole est le " +
        "renoncement le plus courant. Le moins cher.",
    ],
    choices: [
      {
        id: "observer-troc",
        label: "Observer un troc",
        passive: {
          consequence:
            "Deux paumes ouvertes, un hochement, trois doigts — refus. Deux " +
            "doigts — accord. Le marchandage muet a sa grammaire, et tu en " +
            "apprends l'essentiel en un échange : ici, montrer ses mains " +
            "vaut passeport. Les cacher vaut aveu.",
        },
      },
      {
        id: "imiter-gestes",
        label: "Saluer à leur manière",
        risky: {
          stat: "RUSE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Ton salut muet est si juste qu'une marchande te répond machinalement — puis se fige : elle vient de te parler comme à quelqu'un du hameau. Trop tard pour le reprendre. Aux yeux du marché, te voilà presque des leurs.",
            "Paumes ouvertes, menton bas : tu passes pour un voyageur qui connaît les usages. Les épaules se détendent sur ton passage. C'est peu, et c'est énorme, ici.",
            "Ton geste dérape — une paume trop haute, et te voilà en train de proposer quelque chose que tu ne comprends pas. Un vieux marchand éclate d'un rire SILENCIEUX, à s'en plier. C'est pire qu'un rire sonore.",
            "1 naturel. Ton salut, dans leur grammaire, est une question qu'on ne pose pas. Le marché entier baisse les mains d'un coup. Conversation terminée. ♦ −2"
          ),
        },
      },
      { id: "longer-etals", label: "Longer les étals" },
    ],
    jailerLine: "Un marché muet. Le seul endroit des Landes où PERSONNE ne peut dire de mal de moi. J'y tiens un étal, dans un sens.",
  },
  {
    id: "marche-muet-2",
    illustration: "assets/monstre_colporteur_b.png",
    narration: [
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
    illustration: "assets/scene_moulin_sans_ailes_d_d.png",
    chainNext: "campement-2",
    narration: [
      "Le moulin n'a plus d'ailes mais il a gardé leur trace : quatre ombres " +
        "pâles en croix sur le corps de pierre, comme un moulin fantôme peint " +
        "sur le vrai.",
      "La porte est entrouverte. Pas défoncée : entretenue. La croix d'ombres, " +
        "en haut. La lucarne, qui te regarde. Et la porte, qui n'attend que toi.",
    ],
    pointsInteret: [
      {
        id: "croix-ombres",
        chapterFragment: true,
        label: "La croix d'ombres, en haut",
        illustration: "assets/scene_moulin_croix_ombres_a_d.png",
        // Il faut RECULER pour la voir entière : le plan s'élargit au lieu de
        // se resserrer — seul point d'intérêt de la zone à zoom < 1.
        approche:
          "Tu recules jusqu'au muret d'en face. Il faut de la distance pour " +
          "la voir entière — c'est une trace, pas un détail.",
        examen:
          "De loin, les quatre bandes pâles se lisent d'un coup : ce sont des " +
          "zones où la pierre n'a pas vieilli, protégée des années par les " +
          "ailes, puis abandonnée au vent d'un seul coup. On peut dater une " +
          "catastrophe à la couleur d'un mur. Celle-ci est vieille comme le " +
          "Domaine.",
      },
      {
        id: "lucarne-moulin",
        grantsLoot: "jouet-fixee",
        label: "La lucarne, au-dessus de la porte",
        illustration: "assets/scene_moulin_lucarne_a_b.png",
        approche:
          "Quelque chose a bougé là-haut — tu en jurerais. Tu approches sans " +
          "quitter l'ouverture des yeux, ce qui est exactement la mauvaise " +
          "façon d'approcher d'une porte.",
        examen:
          "La lucarne est vide. Et propre : pas un grain de poussière sur le " +
          "rebord intérieur. Quelqu'un s'y accoude. Souvent. Pour regarder ce " +
          "chemin — celui par lequel tu viens d'arriver.",
      },
      {
        id: "interieur-moulin",
        chapterFragment: true,
        label: "Pousser la porte entrouverte",
        illustration: "assets/scene_moulin_interieur_a_d.png",
        approche:
          "Tu pousses du plat de la main, lentement, en laissant à ce qu'il y " +
          "a dedans le temps de décider s'il veut être vu.",
        examen:
          "Personne. Mais le contraire de l'abandon : une paillasse faite au " +
          "carré, un pot ébréché où trempent des brins de bruyère — de la " +
          "bruyère fraîche. Quelqu'un habite ici avec un soin de vivant. Tu " +
          "ressors sans toucher à rien, et c'est la première politesse que tu " +
          "offres aux Landes.",
      },
    ],
    choices: [
      {
        id: "fouiller-lit",
        label: "Fouiller le lit de bruyère",
        passive: {
          consequence:
            "Sous la bruyère, la pierre du mur porte des marques à hauteur " +
            "d'enfant : des jours comptés par paquets de cinq, sur des " +
            "années. Et dans un creux, serré dans un chiffon, un bout de " +
            "corde. Coupé net. On ne garde pas ça par hasard — on garde ça " +
            "comme une preuve, ou comme un pardon.",
        },
      },
      {
        id: "ecouter-moulin",
        label: "Écouter le moulin",
        risky: {
          stat: "INSTINCT",
          threshold: 10,
          outcomes: outcomes(
            "20 naturel. Le moulin craque comme tout vieux bois — mais en RYTHME. Tu finis par le reconnaître : c'est une berceuse, jouée par la charpente, notée par le vent. Quelqu'un a appris à cette ruine à chanter. Tu sauras dormir dessous.",
            "Des craquements de bois qui travaille, le froissement de la lande — et, très loin, un pas léger qui tourne autour du moulin sans jamais s'approcher. Pas une menace : une ronde.",
            "Tu écoutes si fort que tu n'entends plus rien — le silence se referme comme une main. Quand tu relâches, un craquement JUSTE au-dessus. Le temps de lever la tête : rien. Le moulin, dit ton pouls.",
            "1 naturel. Le moulin s'arrête de craquer. Complètement. Un vieux bois qui se tait, c'est un bois qui retient son souffle. ♦ −2"
          ),
        },
      },
      { id: "installer-camp", label: "S'installer pour la halte" },
    ],
    jailerLine: "Ce moulin a moulu autre chose que du grain, dans le temps. Demande à la meule, si tu oses la toucher.",
  },
  {
    id: "campement-2",
    illustration: "assets/scene_moulin_sans_ailes_d_d.png",
    narration: [
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
    /* Lieu à POINTS D'INTÉRÊT (script Notion). */
    id: "chapelle-des-cordes",
    illustration: "assets/scene_chapelle_des_cordes_d.png",
    loot: "brin-chanvre",
    chainNext: "chapelle-des-cordes-2",
    narration: [
      "La chapelle est petite et n'a plus de dieu — les niches sont vides, " +
        "l'autel renversé. Mais elle est TENUE : balayée, entretenue, occupée " +
        "par sa nouvelle religion.",
      "Au fond, le mur des cordes. Sur le côté, l'autel couché. Près de " +
        "l'entrée, une chaise et un ouvrage de tressage — quelqu'un vit ici.",
    ],
    pointsInteret: [
      {
        id: "mur-cordes",
        label: "Le mur des cordes, au fond",
        illustration: "assets/scene_chapelle_mur_cordes_a_d.png",
        approche:
          "Tu remontes la nef courte. L'odeur de chanvre vieux prend à la " +
          "gorge à mesure — une odeur grasse, presque animale, qui n'a rien " +
          "d'une odeur d'église.",
        savoir: "savoir_corde_vive",
        examen:
          "Des dizaines de cordes coupées, clouées en rangs, chacune " +
          "étiquetée d'un nom à l'encre pâle. Ce ne sont pas des trophées. Ce " +
          "sont des reliques — chaque corde « a tenu » quelqu'un. L'une " +
          "d'elles bouge quand tu ne la regardes pas : la troisième du rang " +
          "bas, sans étiquette, plus claire que les autres. Tu note où elle " +
          "est. Ce genre de chose, on préfère savoir où ça se trouve avant " +
          "que ça sache où tu te trouves.",
      },
      {
        id: "autel-renverse",
        soupcon: 1, // fouiller sous un autel, même renversé
        label: "L'autel couché, sur le côté",
        illustration: "assets/scene_chapelle_autel_a_c.png",
        approche:
          "Tu contournes les bancs absents — on les a brûlés, sans doute — " +
          "jusqu'à la masse de pierre couchée sur le flanc. Personne ne l'a " +
          "redressée. Personne ne l'a emportée non plus.",
        examen:
          "Sous l'autel renversé, un espace. Vide — mais le creux dans la " +
          "poussière dit qu'une chose y était cachée, longue, enroulée. On " +
          "l'a prise récemment : la poussière n'a pas eu le temps de revenir.",
      },
      {
        id: "ouvrage-tressage",
        soupcon: -1, // refaire le geste du rite : le hameau approuve
        label: "La chaise et l'ouvrage",
        illustration: "assets/scene_chapelle_ouvrage_a_d.png",
        approche:
          "Près de l'entrée, la chaise est tournée vers le mur des cordes — " +
          "pas vers la porte. On s'assied ici pour regarder les reliques, pas " +
          "pour surveiller qui entre.",
        examen:
          "Un ouvrage de tressage en cours, posé sur le siège : trois brins " +
          "de chanvre neuf, serrés à mi-longueur. Le travail est régulier, " +
          "sans hâte. Quelqu'un tresse ici tous les jours, et ce quelqu'un " +
          "n'a pas fini.",
      },
    ],
    choices: [{ id: "rester-chapelle", label: "Rester dans la chapelle" }],
    jailerLine: "Une chapelle de cordes. Les hommes prient ce qui les tient. Je trouve ça d'une honnêteté rare.",
  },
  {
    /* Événement du lieu (script Notion) : la Veuve tresse sans te regarder. */
    id: "chapelle-des-cordes-2",
    illustration: "assets/monstre_veuve_cordes_a.png",
    narration: [
      "Elle était là depuis le début. Une femme en noir, assise à la chaise, " +
        "qui refait sans fin le même nœud sans lever les yeux sur toi.",
      "— « Choisis ton brin. » Sa voix est plate, professionnelle. « Tout le " +
        "monde finit par en avoir besoin. » Derrière elle, dans une niche à " +
        "part, sous verre : une corde coupée net, sans nom. La seule de toute " +
        "la chapelle qui n'a pas tenu.",
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
      {
        /* SAVOIR (25/07) : avoir repéré LAQUELLE des cordes bouge permet de
           l'éviter avant qu'elle n'attaque — la seule façon de sortir de la
           Chapelle sans jamais tendre le poignet. */
        id: "eviter-corde-vive",
        label: "Longer le mur, hors d'atteinte",
        requiresSavoir: "savoir_corde_vive",
        passive: {
          consequence:
            "Tu connais son rang et sa place. Tu traverses la nef par l'autre " +
            "côté, l'épaule au mur froid, à une largeur de bras de trop pour " +
            "elle. Au passage tu l'entends se détendre puis se retendre, à " +
            "vide, dans ton dos — le bruit sec d'une chose qui avait prévu " +
            "autre chose. La Veuve, elle, lève les yeux pour la première fois. " +
            "Elle n'a pas l'air déçue. Elle a l'air de noter.",
        },
      },
    ],
    jailerLine: "La corde coupée, sous verre. Ils exposent leur seul échec — c'est leur façon de le surveiller.",
  },
  {
    id: "puits-condamne",
    illustration: "assets/scene_puits_condamne_c.png",
    chainNext: "puits-condamne-2",
    narration: [
      "Sur la place arrière du hameau, un puits — condamné de frais : " +
        "planches neuves, chaînes croisées, cadenas encore gras. Tout le " +
        "reste du hameau tombe en ruine douce, mais ça, on l'entretient.",
      "Et dessous, ça cogne. Trois coups, une pause. Trois coups. Poli, " +
        "presque — comme on frappe à une porte dont on sait qu'on va vous " +
        "ouvrir.",
    ],
    choices: [
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
      { id: "approcher-puits", label: "S'approcher de la margelle" },
    ],
    jailerLine: "Ils ont condamné le puits. Charmant. On n'enferme pas un trou, mais l'espoir fait clouer.",
  },
  {
    id: "puits-condamne-2",
    illustration: "assets/monstre_mains_du_puits_a.png",
    narration: [
      "À ton approche, le rythme change. Plus vite, plus fort — plus " +
        "personne de poli. Le cadenas saute sur son anneau à chaque série, " +
        "et les planches, au dernier coup, ont bougé. Franchement bougé.",
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
        id: "reculer-puits",
        label: "Reculer sans bruit",
        passive: {
          consequence:
            "Tu recules pas à pas, les yeux sur les planches. Les coups " +
            "ralentissent à mesure que tu t'éloignes — jusqu'au rythme " +
            "poli du début. Ce n'était pas après les chaînes qu'ils en " +
            "avaient. C'était après une audience.",
        },
      },
    ],
    jailerLine: "Trois coups, une pause. Moi aussi je frappe avant d'entrer. La différence, c'est qu'on finit toujours par m'ouvrir.",
  },
  {
    id: "chien-du-bailli",
    illustration: "assets/scene_maison_du_bailli_c.png",
    chainNext: "chien-du-bailli-2",
    narration: [
      "La plus grande maison du hameau est murée — de l'intérieur. Chaque " +
        "fenêtre bouchée de pierres posées depuis dedans, en rangs pressés, " +
        "par quelqu'un qui s'enfermait plus qu'il ne se protégeait. La " +
        "maison du Bailli. Vide depuis sa corde. Pas gardée par personne.",
    ],
    choices: [
      {
        id: "longer-fenetres",
        label: "Longer les fenêtres murées",
        passive: {
          consequence:
            "Les pierres sont posées de l'intérieur, oui — mais pas " +
            "n'importe comment : en quinconce serré, du travail soigné, " +
            "fait sans hâte. Il ne s'est pas barricadé dans la panique. Il " +
            "a pris le temps de bien s'enfermer. Contre quoi, une maison ne " +
            "le dit pas. Contre qui, parfois.",
        },
      },
      {
        id: "jauger-garde",
        label: "Repérer ce qui garde",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu le vois avant qu'il te voie : couché contre le seuil, gris sur gris. Et tu vois surtout sa ronde, tracée dans l'usure de l'herbe — trente ans du même circuit. Tu connais ses horaires avant qu'il connaisse ton odeur.",
            "Une masse grise contre le seuil, immobile comme un sac — sauf les oreilles, qui te suivent depuis ton premier pas. Il sait que tu es là. Il attend de savoir si ça vaut de se lever.",
            "Tu scrutes les appentis, la cour, les toits — et pendant ce temps, la masse grise du seuil s'est levée sans bruit et a raccourci la distance de moitié. Il jaugeait plus vite que toi.",
            "1 naturel. Tu cherches le danger partout — sauf derrière. Le souffle sur tes mollets t'informe de ton erreur. ♦ −2"
          ),
        },
      },
      { id: "avancer-seuil", label: "Avancer vers le seuil" },
    ],
    jailerLine: "Le Bailli a muré sa propre maison de l'intérieur. Les gens font des choses étranges quand ils m'entendent arriver.",
  },
  {
    id: "chien-du-bailli-2",
    illustration: "assets/monstre_chien_du_bailli_b.png",
    combat: true,
    foe: "chien-du-bailli",
    foeName: "Le Chien du Bailli",
    narration: [
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
    /* Lieu à POINTS D'INTÉRÊT (script Notion) — garanti si les chapitres
       Procès ou Registre sont actifs. */
    id: "petit-tribunal",
    illustration: "assets/scene_petit_tribunal_a.png",
    chainNext: "petit-tribunal-2",
    narration: [
      "La grange aux trois bancs sent le suif froid. La chaire fait face à la " +
        "porte — ici, même l'entrée est un interrogatoire.",
      "Au mur, une feuille clouée. Sur la chaire, un livre ouvert. Les bancs, " +
        "eux, gardent leurs traces.",
    ],
    pointsInteret: [
      {
        id: "mur-ordonnance",
        label: "La feuille clouée au mur",
        illustration: "assets/scene_tribunal_ordonnance_a_c.png",
        approche:
          "Trois pas de dalle inégale, et la feuille se précise : du papier " +
          "épais, jauni, cloué aux quatre coins par quelqu'un qui ne voulait " +
          "pas qu'on la décroche.",
        savoir: "savoir_ordonnance",
        examen:
          "La liste des signes, de la main du Bailli. « Parler seul face au " +
          "sud. Fixer les Profondeurs plus qu'il ne faut. Cesser de dormir. " +
          "Répondre à ce qui n'a pas parlé. » Tu la lis deux fois. La deuxième " +
          "fois, tu comptes ceux qui te concernent déjà. Et la troisième, tu " +
          "les apprends — parce que c'est exactement ce qu'ils guettent chez toi.",
      },
      {
        id: "chaire-registre",
        chapterFragment: true,
        label: "La chaire et son livre",
        illustration: "assets/scene_tribunal_chaire_a_c.png",
        approche:
          "La chaire est haute — il faut lever les yeux, et c'est le but. Tu " +
          "montes la marche unique qui y mène, celle que le Bailli montait " +
          "chaque fois qu'il allait dire la même phrase.",
        examen:
          "Le Registre des Pendaisons est posé là, ouvert — pas par " +
          "négligence : ici, la loi se montre. Des colonnes de noms, de " +
          "dates, de signes. Une écriture appliquée qui se dégrade au fil des " +
          "pages. Et un nom sur deux est barré. Pas raturé — barré, d'un trait " +
          "droit, à l'encre plus récente que le nom.",
      },
      {
        id: "les-bancs",
        chapterFragment: true,
        label: "Les bancs et leurs traces",
        illustration: "assets/scene_tribunal_bancs_a_c.png",
        approche:
          "Tu redescends vers les bancs. Trois rangs de bois brut, et cette " +
          "disposition que tu reconnais sans l'avoir apprise : les accusés " +
          "devant, les témoins de côté, le hameau derrière.",
        examen:
          "Le bois du banc des accusés est poli au milieu, rongé aux bords — " +
          "des mains qui serrent. Sur le banc des témoins, des entailles de " +
          "comptage : quelqu'un venait souvent. Témoigner était son habitude.",
      },
    ],
    choices: [{ id: "rester-tribunal", label: "Rester dans la salle" }],
    jailerLine: "Trois bancs, une chaire, zéro acquittement. L'efficacité, j'admire.",
  },
  {
    /* Événement du lieu (script Notion) : l'Écrivain public entre, te voit, se
       fige — puis fait comme si de rien. Hook de sa rencontre. */
    id: "petit-tribunal-2",
    illustration: "assets/monstre_ecrivain_public_d.png",
    registre: true,
    narration: [
      "La porte s'ouvre derrière toi. Un petit homme sec entre, plume et " +
        "encrier serrés contre lui — et se fige net en te voyant à la chaire. " +
        "Une seconde entière. Assez pour que vous sachiez tous les deux qu'il " +
        "t'a vu.",
      "Puis il fait comme si de rien : il s'installe au banc des témoins, " +
        "ouvre son cahier, et se met à copier. L'Écrivain public. Il ne lève " +
        "pas les yeux — mais sa plume, elle, a ralenti.",
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
      {
        /* SAVOIR (25/07) : avoir lu son propre nom sur un poteau vierge ouvre
           l'option la plus dangereuse de la zone. Le Notion la décrit comme
           « aveu suicidaire ou renversement selon RUSE » — donc un vrai pari :
           un Savoir n'est pas toujours une bonne carte. */
        id: "dire-poteau-grave",
        label: "« Mon poteau est déjà taillé »",
        requiresSavoir: "savoir_poteau_a_mon_nom",
        risky: {
          stat: "RUSE",
          threshold: 13,
          highStakes: true,
          outcomes: outcomes(
            "20 naturel. Tu l'annonces comme un fait administratif, sans trembler : ton nom est gravé au fond du champ, l'entaille est fraîche, le bois n'a pas grisé. Puis tu ajoutes la seule question qui compte : « Qui a donné mon nom au Fossoyeur, et sur quel jugement ? » La plume s'arrête. L'Écrivain feuillette en arrière, pâlit, et tourne le cahier vers toi. La ligne existe. Elle est signée d'une main morte depuis des années. Tu ne sais pas encore ce que ça veut dire — mais lui non plus, et ça le terrifie davantage.",
            "Tu le dis, et tu regardes l'Écrivain plutôt que le sol. Sa plume hésite. « Une erreur de greffe », finit-il par dire, et il gratte la ligne devant toi. Le bois du poteau, lui, restera taillé — mais le cahier ne te réclame plus. Ici, c'est le cahier qui décide.",
            "Tu le dis, et le silence qui suit te apprend ton erreur. L'Écrivain ne lève pas les yeux : il écrit. Longuement. Tu viens de fournir toi-même le motif qui manquait à ta ligne, et il a l'élégance de ne pas te remercier.",
            "1 naturel. Tu parles trop, et tu parles bien : tu expliques exactement où est le poteau, à quelle rangée, comment l'entaille est faite. L'Écrivain note tout. « Merci », dit-il enfin — le seul mot qu'il t'aura adressé. « On cherchait encore lequel c'était. » ♦ −2"
          ),
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
    /* LA MARE AUX REGARDS — le seul endroit des Landes que le vent évite. On
       n'y vient pas puiser : on y vient vérifier. */
    id: "mare-aux-regards",
    illustration: "assets/scene_mare_aux_regards_a.png",
    chainNext: "mare-aux-regards-2",
    narration: [
      "L'eau est noire et parfaitement plate — le seul endroit des Landes que " +
        "le vent évite.",
      "La berge est piétinée en un seul point, tassée par des années de " +
        "genoux. On ne vient pas ici puiser. On vient s'agenouiller. Le point " +
        "de berge usé. L'eau. Et dans les roseaux, un reflet de métal.",
    ],
    pointsInteret: [
      {
        id: "berge-usee",
        soupcon: 1, // s'agenouiller aux creux de la Mare est un aveu de croyance
        label: "Le point de berge usé",
        illustration: "assets/scene_mare_berge_a_c.png",
        approche:
          "Tu contournes la mare par la droite pour atteindre le seul endroit " +
          "où la boue est tassée. Le sol y est dur comme un seuil de maison.",
        examen:
          "Deux creux dans la terre, à largeur de genoux, refaits par des " +
          "centaines de personnes au même endroit exact. À côté, des marques " +
          "de doigts crispés dans la boue séchée. On ne s'agenouille pas ici " +
          "pour prier. On s'agenouille pour vérifier.",
      },
      {
        id: "eau-reflet",
        illustration: "assets/scene_mare_eau_reflet_b.png",
        label: "L'eau",
        savoir: "savoir_reflet",
        approche:
          "Tu t'agenouilles dans les creux. Ils sont à ta taille, évidemment. " +
          "La croyance dit : le reflet de qui entend la voix est en retard.",
        examen:
          "Tu te penches. Ton reflet se penche. Et il lève les yeux vers toi " +
          "une demi-seconde après toi. Tu le savais déjà — tu entends la voix " +
          "depuis le premier jour, c'est même comme ça que le monde te parle. " +
          "Mais le savoir et le voir sont deux choses différentes. À partir de " +
          "maintenant, tu ne pourras plus prétendre le contraire, même à " +
          "quelqu'un qui te ressemble.",
      },
      {
        id: "reflet-metal",
        label: "Le reflet de métal, dans les roseaux",
        illustration: "assets/scene_mare_reflet_metal_a.png",
        grantsLoot: "miroir-poche",
        approche:
          "Tu écartes les roseaux à deux mains. Ils sont noirs jusqu'à la " +
          "racine et ne cassent pas — ils plient et reviennent.",
        examen:
          "Un petit miroir de poche, fêlé en travers. Perdu — ou jeté par " +
          "quelqu'un qui n'a pas aimé ce qu'il y a vu. La fêlure passe " +
          "exactement où serait un visage.",
      },
    ],
    choices: [
      {
        id: "boire-mare",
        label: "Boire à la mare",
        risky: {
          stat: "COURAGE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. L'eau est glacée et propre, sans un goût. Tu bois longuement, et quand tu relèves la tête tu te sens plus léger d'une chose que tu ne saurais pas nommer — comme si la mare avait pris quelque chose à ta place. Elle avait le choix. Elle a bien choisi.",
            "Tu bois dans le creux de ta main. C'est de l'eau, rien d'autre. Ça n'a l'air de rien mais dans les Landes, ça compte.",
            "Tu bois — et l'eau reste au bord des lèvres, sans descendre, une seconde de trop. Quand elle passe enfin, tu as l'impression très nette d'avoir avalé quelque chose qui a accepté de se laisser avaler.",
            "1 naturel. Tu bois. Sous la surface, à trois doigts de ton visage, ton reflet continue de boire quand tu t'arrêtes. ♦ −2"
          ),
        },
      },
      {
        id: "sen-aller-mare",
        label: "Te relever sans regarder",
        passive: {
          consequence:
            "Tu te relèves sans te pencher. La mare garde sa réponse, et " +
            "c'est une politesse qu'elle te rend : rien ne te suit du regard " +
            "quand tu t'éloignes de la berge. Rien, en tout cas, qui soit " +
            "dans l'eau.",
        },
      },
    ],
    jailerLine: "Une mare qui dit la vérité. Ils viennent quand même. Vous adorez les réponses que vous connaissez.",
  },
  {
    id: "mare-aux-regards-2",
    illustration: "assets/scene_mare_aux_regards_a.png",
    narration: [
      "Quelqu'un arrive — un Renonçant, qui ne te voit pas. Il s'agenouille " +
        "dans les creux, se penche, et reste penché beaucoup trop longtemps.",
      "Quand il se relève, il a le visage de quelqu'un qui va rentrer chez lui " +
        "et fermer ses volets pour toujours.",
    ],
    choices: [
      {
        id: "aborder-renoncant-mare",
        label: "Lui parler",
        soupcon: 1,
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu ne lui demandes rien — tu lui dis simplement que tu as vu la même chose. Il te regarde comme on regarde une rive. Puis il parle, longtemps, et tu apprends comment on vit avec : en ne se regardant plus jamais dans rien, et en occupant ses yeux à autre chose. Ça s'appelle bêcher, ici. Ou compter.",
            "Il sursaute, puis se laisse aborder. « C'était pas en retard, avant », dit-il seulement. « Y a deux ans, c'était pas en retard. » Il repart vers le hameau sans attendre de réponse.",
            "Il te voit — et le fait que tu l'aies vu, lui, est la pire chose qui pouvait lui arriver aujourd'hui. Il part très vite, sans un mot, et tu sais qu'il racontera cette rencontre autrement que toi.",
            "1 naturel. Tu l'abordes. Il te regarde, regarde l'eau, te regarde encore. Puis il demande, d'une voix blanche : « Le vôtre aussi ? » ♦ −2"
          ),
        },
      },
      {
        id: "laisser-renoncant",
        label: "Le laisser à sa réponse",
        passive: {
          consequence:
            "Tu restes immobile derrière les roseaux jusqu'à ce qu'il soit " +
            "loin. Il ne saura jamais qu'on l'a vu vérifier. C'est le seul " +
            "cadeau que tu pouvais lui faire, et il ne le saura pas non plus.",
        },
      },
    ],
    jailerLine: "Il rentrera, il fermera ses volets, et il tiendra deux hivers. J'ai déjà sa page.",
  },
  {
    /* LE VERGER NOIR — le seul ordre volontaire des Landes hors du hameau.
       Les arbres poussent. C'est pire que s'ils étaient morts. */
    id: "verger-noir",
    illustration: "assets/scene_verger_noir_d.png",
    chainNext: "verger-noir-2",
    narration: [
      "Des arbres fruitiers plantés en rangs — le seul ordre volontaire des " +
        "Landes hors du hameau. Ils ont poussé, ils ont des branches, des " +
        "feuilles noires, et des fruits. C'est pire que s'ils étaient morts.",
      "Les rangs et leurs fruits. La souche du premier arbre, au bout. Et deux " +
        "silhouettes qui bêchent, tout au fond.",
    ],
    pointsInteret: [
      {
        id: "fruits-cendre",
        label: "Les fruits, dans les rangs",
        illustration: "assets/scene_verger_fruits_cendre_a.png",
        grantsLoot: "fruit-cendre",
        approche:
          "Tu entres dans un rang. L'odeur devrait arriver là — pas de " +
          "pourriture : pas d'odeur du tout. Un verger qui ne sent rien.",
        examen:
          "Ronds, lourds, gris mat. La peau est parfaite et le poids ment : " +
          "tu en décroches un, il pèse comme une pierre et cède comme du " +
          "papier. Des fruits de cendre. Tu en gardes un. On ne sait jamais " +
          "ce qu'on est prêt à parier.",
      },
      {
        id: "souche-premier-arbre",
        soupcon: 1, // compter les rangs du Verger, ça se voit du hameau
        label: "La souche, au bout du rang",
        illustration: "assets/scene_verger_souche_a_c.png",
        approche:
          "Au bout du rang, un arbre manque. Sa souche est nette, sciée à " +
          "hauteur de genou, et le bois de coupe est gris.",
        examen:
          "Le premier arbre du verger, abattu net. Les cernes sont réguliers " +
          "jusqu'aux dernières années — puis serrés, noirs, illisibles. " +
          "L'arbre a compris avant les hommes où il poussait. Quelqu'un l'a " +
          "abattu pour ne pas avoir à le lire.",
      },
      {
        id: "epoux-verger",
        label: "Les deux qui bêchent, au fond",
        leadsTo: "epoux-1",
        illustration: "assets/monstre_epoux_verger_a.png",
        approche:
          "Tu remontes les rangs vers eux. Ils se relaient sur la même bêche " +
          "sans se parler, du geste réglé des gens qui font la même chose " +
          "ensemble depuis toujours.",
        examen:
          "Ils plantent. Dans cette terre. Un trou, un plant, la terre " +
          "refermée du talon — et le trou suivant, deux pas plus loin.",
      },
    ],
    choices: [
      {
        id: "compter-rangs",
        label: "Compter les rangs",
        passive: {
          consequence:
            "Onze rangs. Tu recomptes : onze. Chaque rang est planté d'une " +
            "essence différente, et chaque essence a donné les mêmes fruits " +
            "gris. Onze tentatives, onze réponses identiques, et un douzième " +
            "rang en cours de creusement au fond. Il n'y a pas de mot pour ça " +
            "dans ta langue. Ici, ça s'appelle mardi.",
        },
      },
      {
        id: "gouter-fruit",
        label: "Goûter un fruit",
        risky: {
          stat: "COURAGE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tu mords. C'est de la cendre — puis ce n'est plus de la cendre : c'est un verger, le vrai, au soleil, avec des enfants dedans et une femme qui appelle. Tu vois ce que ce lieu était. Tu comprends d'un coup POURQUOI ils continuent, et ça vaut mieux qu'un objet.",
            "Tu mords. La chair est sèche, sans goût, et se défait en poudre. Rien ne t'arrive — sauf la certitude, désormais physique, que rien ne pousse ici.",
            "La cendre te reste dans la gorge et n'en sort plus. Tu tousses longtemps, plié en deux entre deux rangs, et l'homme au fond du verger cesse une seconde de bêcher pour te regarder faire.",
            "1 naturel. Tu mords. Et quelque chose, dans le fruit, mord en retour. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Onze vergers. Ils appellent ça de l'obstination. Moi j'appelle ça de la matière première.",
  },
  {
    id: "verger-noir-2",
    illustration: "assets/scene_verger_noir_2_c.png",
    narration: [
      "Un fruit tombe, derrière toi. Sans vent, sans oiseau.",
      "Quand tu le ramasses, il est encore chaud — comme une chose qui vient " +
        "de cesser d'essayer.",
    ],
    choices: [
      {
        id: "reposer-fruit",
        label: "Le reposer au pied de l'arbre",
        passive: {
          consequence:
            "Tu le reposes exactement sous la branche d'où il vient, bien " +
            "calé dans la terre, comme on remet quelque chose à sa place. Le " +
            "geste ne sert à rien. Tu le fais quand même, et le verger entier " +
            "te paraît une seconde moins hostile.",
        },
      },
      {
        id: "quitter-verger",
        label: "Sortir des rangs",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu sors des rangs par le bon côté — celui d'où l'on voit encore le hameau. Derrière toi, dans l'ordre parfait des arbres, tu remarques ce que tu n'avais pas vu en entrant : les rangs ne sont pas droits. Ils s'incurvent, très légèrement, tous, vers le sud.",
            "Tu retrouves la sortie du premier coup. Les rangs se referment derrière toi et le verger redevient une tache noire sur la lande.",
            "Tu tournes deux fois dans les mêmes rangs avant de retrouver la lisière. Onze rangs, ce n'est pas un labyrinthe. Ça n'aurait pas dû prendre si longtemps.",
            "1 naturel. Tu sors des rangs. Le compte à voix basse, derrière toi, s'est arrêté au moment exact où tu es sorti. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Encore chaud. Comme tout ce qui vient de renoncer. Tu t'y feras.",
  },
  {
    /* LES ÉPOUX DU VERGER — ils plantent le douzième. Ce qu'ils demandent
       n'est pas de l'aide : c'est une preuve que le dehors existe. */
    id: "epoux-1",
    illustration: "assets/monstre_epoux_verger_a.png",
    chainNext: "epoux-2",
    narration: [
      "La femme se redresse la première. Elle ne sursaute pas — plus rien ne " +
        "les surprend, ici.",
      "— « C'est le onzième verger. » Elle le dit avant toute autre chose, " +
        "comme on donne son nom. « Les dix premiers ont donné des fruits de " +
        "cendre. Celui-là aussi. Le douzième, on verra. »",
      "L'homme continue de bêcher. Il n'a pas levé la tête. Il compte les " +
        "coups de bêche à voix basse.",
    ],
    choices: [
      {
        id: "epoux-pourquoi",
        label: "« Pourquoi continuer ? »",
        passive: {
          consequence:
            "— « Parce qu'arrêter, c'est commencer à regarder le sud. » Elle " +
            "essuie la bêche contre sa jambe, un geste d'habitude. « Bêcher, " +
            "ça occupe les yeux. » Derrière elle, le compte à voix basse " +
            "n'a pas manqué un coup.",
        },
      },
      {
        id: "epoux-aider",
        label: "Prendre la bêche un moment",
        risky: {
          stat: "EMPATHIE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu bêches. Personne ne dit merci, personne ne dit rien — mais au bout d'un moment l'homme reprend son compte à voix haute pour que tu puisses le suivre, et vous finissez le rang à trois, au même rythme. C'est la seule chose qui ressemble à de la paix dans toutes les Landes.",
            "Tu creuses deux trous. La terre est lourde, morte, et cède mal. La femme corrige ton geste d'un mot. C'est peu. C'est déjà énorme.",
            "Tu prends la bêche et l'homme la reprend aussitôt, sans brutalité, comme on retire un outil des mains d'un enfant. Le compte a repris exactement où il s'était arrêté.",
            "1 naturel. Tu enfonces la bêche. Elle bute sur quelque chose à trois doigts sous la surface — quelque chose de long, et qui a été mis là avec soin. Vous vous regardez tous les trois, et personne ne creuse. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Le douzième verger. Je leur laisse le quinzième. Après, la terre commence à me lasser aussi.",
  },
  {
    id: "epoux-2",
    illustration: "assets/monstre_epoux_2_c.png",
    chainNext: "epoux-3",
    narration: [
      "— « Tu viens du dehors. » Ce n'est pas une question : c'est une prière " +
        "déguisée en constat. « Il te reste forcément quelque chose du " +
        "dehors. N'importe quoi. Une graine, un bout de vrai bois, une chose " +
        "qui a poussé sous le vrai soleil. On le planterait. »",
      "Tu sais ce que tu as : rien. Tu es arrivé ici comme tout le monde y " +
        "arrive — les mains vides et mort.",
    ],
    choices: [
      {
        id: "epoux-rien",
        label: "« Je n'ai rien. »",
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu le dis de façon à ce que ça ne tue pas l'espoir : tu n'as rien, mais tu leur décris quelque chose — un arbre précis, chez toi, avec son écorce et son odeur. Ils écoutent à deux. À la fin, la femme dit : « Bon. Alors on plante celui-là. » Et l'homme se remet à creuser.",
            "Tu le dis simplement. Elle hoche la tête, sans surprise. « C'est ce que disent tous ceux qui viennent. » Elle retourne à son rang. Ça n'a rien cassé.",
            "Tu le dis mal — trop court, trop net. L'homme cesse de compter ses coups de bêche. Le silence qui suit est le pire son des Landes, et il dure jusqu'à ce que tu sois sorti du rang.",
            "1 naturel. « Je n'ai rien. » La femme te regarde les mains, longtemps, puis le visage. « Non », dit-elle enfin, très doucement. « Toi non plus, tu ne viens pas du dehors. » ♦ −2"
          ),
        },
      },
      {
        id: "epoux-promettre",
        label: "Promettre pour la prochaine fois",
        risky: {
          stat: "RUSE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu promets si bien que tu y crois toi-même une seconde. Ils te croient tout à fait — et la femme te donne, en avance, ce qu'elle donnera en échange : où trouver de l'eau propre entre ici et la Palissade, et laquelle des deux routes se referme la nuit.",
            "Le mensonge passe sans effort : ils veulent y croire. « Au prochain passage », répète-t-elle, et elle range ça quelque part où ça ne s'abîmera pas.",
            "Tu promets, et elle t'écoute promettre avec un demi-sourire qui ne juge rien. « Bien sûr. » Elle retourne à son rang deux mots trop tôt.",
            "1 naturel. Tu promets pour la prochaine fois. L'homme, sans lever la tête, dit son premier mot : « Laquelle ? » ♦ −2"
          ),
        },
      },
      {
        id: "epoux-donner",
        label: "Chercher dans ta besace",
        passive: {
          consequence:
            "Tu fouilles longuement, pour de vrai. Tout ce que tu portes " +
            "vient d'ici : une écharde de gibet, du chanvre béni, de la " +
            "cendre. Rien du dehors. Tu leur montres tes mains ouvertes, et " +
            "ils regardent dedans quand même, tous les deux, comme on " +
            "regarde un puits.",
        },
      },
    ],
    jailerLine: "Ils veulent une graine du dehors. Personne n'arrive chez moi avec des poches pleines. C'est le principe.",
  },
  {
    id: "epoux-3",
    illustration: "assets/monstre_epoux_3_c.png",
    chainNext: "verger-noir-2",
    narration: [
      "Ils se remettent au travail avant que tu sois sorti des rangs — le " +
        "onzième verger n'attend pas.",
      "Longtemps après, tu entends encore le compte à voix basse, régulier " +
        "comme une corde qui grince : c'est le bruit que fait l'espoir quand " +
        "il refuse de savoir.",
    ],
    choices: [{ id: "epoux-quitter", label: "Remonter les rangs" }],
    jailerLine: "Écoute-le compter. Il en est à quarante mille. Je le sais : je compte avec lui.",
  },
  {
    // Dernière scène de la rotation : la sortie de zone (La Descente) se
    // montre mais reste verrouillée — l'Acte II n'existe pas encore.
    id: "palissade-sud",
    // Le lieu a enfin sa propre image (lot 25/07) — il tournait sur une vue
    // générique de la lande alors que c'est le seuil de l'Acte II.
    illustration: "assets/scene_palissade_sud_a_a.png",
    loot: "lanterne-veilleur",
    chainNext: "palissade-sud-2",
    narration: [
      "La Palissade barre le plateau d'un trait noir : des rondins plantés " +
        "serrés, hauts de deux hommes. Un portillon, une guérite, une " +
        "lanterne allumée en plein jour.",
      "Derrière, un chemin qui descend. On le sent plus qu'on ne le voit : " +
        "l'air y coule comme une eau froide. La Descente. Et dans la guérite, " +
        "un homme qui t'a vu depuis longtemps.",
    ],
    pointsInteret: [
      {
        id: "rondins-pointes",
        label: "Les rondins et leurs pointes",
        illustration: "assets/scene_palissade_rondins_a_c.png",
        approche:
          "Tu longes le mur sur quelques pas, la tête levée, à suivre la " +
          "ligne des sommets taillés.",
        savoir: "savoir_palissade_retient",
        examen:
          "Chaque rondin est appointé — taillé en pique. Tu suis les pointes " +
          "du regard, et ton estomac comprend avant toi : elles sont tournées " +
          "vers l'intérieur. Vers les Landes. Ce mur n'a jamais protégé le " +
          "village de ce qui monte. Il retient ce qui veut descendre.",
      },
      {
        id: "portillon-verrou",
        grantsLoot: "cle-portillon",
        label: "Le portillon et son verrou",
        illustration: "assets/scene_palissade_portillon_a_b.png",
        approche:
          "Tu poses la main sur le bois du portillon. Il est tiède, ce qui " +
          "n'a aucun sens sous ce crépuscule.",
        examen:
          "Un verrou, côté nord. Un seul. Le bois autour est griffé — pas par " +
          "des bêtes : à hauteur de mains. Des mains qui voulaient passer, " +
          "une nuit, et qu'on n'a pas laissées. Ou qu'on a laissées trop tard.",
      },
      {
        id: "homme-guerite",
        illustration: "assets/monstre_homme_guerite_c.png",
        label: "L'homme de la guérite",
        leadsTo: "veilleur-1",
        approche:
          "Il est sorti de sa niche avant que tu aies décidé d'y aller. Tu " +
          "marches vers lui parce qu'il n'y a plus vraiment le choix.",
        examen:
          "La guérite est une niche de planches contre les rondins, juste " +
          "assez grande pour un homme et sa lanterne. Il te regarde venir " +
          "depuis si longtemps qu'il a eu le temps de préparer sa première " +
          "phrase.",
      },
    ],
    choices: [
      {
        id: "examiner-etais",
        label: "Examiner les étais",
        passive: {
          consequence:
            "Les étais sont plantés côté Landes, arc-boutés CONTRE la " +
            "palissade — on ne retient pas un mur comme ça pour empêcher " +
            "d'entrer. On le retient pour qu'il ne parte pas. Aux pieds des " +
            "troncs, des entailles de comptage : quelqu'un note depuis des " +
            "années tout ce qui franchit la porte. Dans un seul sens.",
        },
      },
      {
        id: "longer-palissade",
        label: "Longer la palissade",
        risky: {
          stat: "RUSE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. À cent pas de la porte, tu trouves ce que la palissade cache : une brèche ancienne, recousue de chaînes — et de l'autre côté des maillons, du tissu pris, arraché dans le sens de la SORTIE. Des gens ont voulu remonter de la Descente. La palissade a voté contre.",
            "Tronc après tronc, tu longes. Le bois est noirci au feu — volontairement, un tronc sur deux : du bois traité contre quelque chose qui grimpe. Tu ranges l'information avec les inquiétantes.",
            "Tu longes trop près. Une sentinelle de bois que tu prenais pour un étai pivote en grinçant — un épouvantail de garnison, monté sur gonds, qui fait face à quiconque marche le long du mur. Tu es exactement le genre de passage qu'il annonce.",
            "1 naturel. Au pied d'un tronc, un paquet de toile. Dedans, un bagage complet — gourde, couverture, lettres. Quelqu'un a marché jusqu'ici, a posé son sac, et a continué SANS. Tu sais maintenant à quoi ressemble l'appel, vu de l'extérieur. ♦ −2"
          ),
        },
      },
      { id: "approcher-porte", label: "Approcher de la porte" },
    ],
    jailerLine: "La palissade ? Une politesse. Les vrais murs de mes terres sont ailleurs — tu marches dessus.",
  },
  {
    /* LE VEILLEUR DE LA PALISSADE — il ouvre à ceux qui partent proprement et
       note les autres. Sa lanterne s'échange contre la seule histoire du
       dehors qu'il te reste : ta mort. Le jeu ne l'écrit jamais. */
    id: "veilleur-1",
    illustration: "assets/objet_lanterne_rouillee_guerite.png",
    chainNext: "veilleur-2",
    narration: [
      "— « Trois jours ! » Il le crie presque — la voix de quelqu'un qui parle " +
        "peu et qui stocke. « Trois jours que j'ai vu personne. Le hameau " +
        "m'envoie ma soupe par le gamin, et le gamin pose la soupe à vingt " +
        "pas. Vingt pas ! Comme si veiller la porte, ça s'attrapait. »",
      "Il sort de sa niche, s'étire, et te détaille sans gêne — l'inventaire " +
        "franc de l'homme qui n'a plus de manières à user.",
      "— « Tu descends. Évidemment que tu descends. On vient pas admirer ma " +
        "palissade. »",
    ],
    choices: [
      {
        id: "veilleur-pointes",
        label: "« Pourquoi les pointes vers l'intérieur ? »",
        passive: {
          consequence:
            "Il se rembrunit. « T'as vu ça. » Un temps — il regarde le mur " +
            "comme on regarde un collègue. « Le mur date d'avant moi. Ceux " +
            "qui l'ont planté savaient déjà dans quel sens on perd les gens. »",
        },
      },
      {
        id: "veilleur-a-quoi-bon",
        label: "« À quoi bon veiller, alors ? »",
        passive: {
          consequence:
            "— « Le portillon. Le verrou. » Il compte sur ses doigts, sans " +
            "ironie. « Quelqu'un doit ouvrir à ceux qui partent proprement. " +
            "Et noter les autres. » Il ne dit pas ce qui distingue les deux, " +
            "et tu n'as pas envie de demander.",
        },
      },
    ],
    jailerLine: "Trente ans de guérite. Il connaît mes terres mieux que certains de mes morts.",
  },
  {
    id: "veilleur-2",
    illustration: "assets/objet_lanterne_veilleur_2_b.png",
    chainNext: "veilleur-3",
    narration: [
      "Il décroche sa lanterne et la soupèse, comme une décision.",
      "— « En bas, y a des endroits où le noir mange tout. Ça, ça tient une " +
        "nuit de plus que les autres — je les fais moi-même, la mèche, " +
        "l'huile, tout. » Il te la tend à moitié. « Elle est à toi. Contre une " +
        "histoire. Une vraie. Du dehors. »",
      "Ses yeux brillent d'une faim que la soupe du gamin ne nourrit pas. " +
        "« Raconte-moi comment c'était, la dernière chose que t'as vue. " +
        "Avant. » Il te demande ta mort. C'est la seule histoire du dehors que " +
        "tu possèdes encore.",
    ],
    choices: [
      {
        id: "veilleur-raconter",
        label: "Raconter ta mort",
        grantsLoot: "lanterne-veilleur",
        passive: {
          consequence:
            "Tu racontes. Le récit ne s'écrit nulle part — il reste entre lui " +
            "et toi, et c'est très bien ainsi. Il écoute comme on boit, sans " +
            "un mot, sans un hochement. À la fin, il regarde le nord — le " +
            "dehors — pendant une longue minute. Puis il te met la lanterne " +
            "dans les mains sans rien ajouter.",
        },
      },
      {
        id: "veilleur-inventer",
        label: "Inventer une belle histoire",
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu lui donnes un dehors : une odeur de pluie sur des pierres chaudes, le bruit précis d'une rue à midi. Il rit, il redemande un détail, il rit encore. La lanterne est à toi avant la fin — et tu comprends que le mensonge était peut-être la vraie marchandise.",
            "Ton histoire tient debout et il la prend. Elle est belle, elle est fausse, elle fait le même effet. La lanterne change de main.",
            "« J'écoute des menteurs depuis trente ans à ce portillon. » Il remet la lanterne au clou, sans colère. Pas de rancune non plus — juste la déception patiente des solitaires.",
            "1 naturel. Tu inventes. Et au milieu de ton histoire inventée, tu tombes par accident sur un détail vrai — le tien. Ta voix s'arrête toute seule. Il l'a entendu, ce trou-là. ♦ −2"
          ),
        },
      },
      {
        id: "veilleur-refuser",
        label: "Refuser",
        passive: {
          consequence:
            "Tu ne racontes rien. Il hausse les épaules — un homme qui a " +
            "l'habitude — et remet la lanterne au clou. Elle balancera dans " +
            "ton dos tout le temps que tu franchiras le portillon.",
        },
      },
      {
        /* SAVOIR (25/07) : avoir vu le sens des pointes change la nature de
           l'échange. On ne paie plus avec sa mort — on paie en montrant qu'on a
           compris ce que le hameau ne dit pas. */
        id: "veilleur-mur-inutile",
        label: "« Ce mur ne protège de rien »",
        requiresSavoir: "savoir_palissade_retient",
        grantsLoot: "lanterne-veilleur",
        passive: {
          consequence:
            "Tu le dis sans le défier : les pointes sont tournées vers " +
            "l'intérieur, ce mur ne garde pas le village, il l'enferme. Il ne " +
            "répond pas tout de suite. Il décroche la lanterne, la pose dans " +
            "tes mains, et regarde le portillon. « Trente ans que je le dis à " +
            "personne. » Puis, plus bas : « Ceux qui montent, on les laisse " +
            "monter. C'est descendre qui est interdit. » Il ne réclame plus " +
            "d'histoire. Tu viens d'en donner une.",
        },
      },
    ],
    jailerLine: "Il veut ta mort en échange d'une lampe. Moi je te l'ai prise gratuitement. Apprends à négocier.",
  },
  {
    id: "veilleur-3",
    illustration: "assets/objet_lanterne_veilleur_3_c.png",
    chainNext: "palissade-sud-2",
    narration: [
      "Il t'ouvre le portillon lui-même, avec la cérémonie de l'homme dont " +
        "c'est la seule prérogative. Au moment où tu passes, il note quelque " +
        "chose sur une planche de sa guérite — ton passage, ta direction, " +
        "l'heure. Le dernier acte administratif des Landes.",
      "— « Je note tout le monde », dit-il sans lever les yeux. « Comme ça, si " +
        "un jour quelqu'un remonte... je saurai qui c'était. » Il sourit à sa " +
        "planche. « Trente ans de descentes. La colonne des retours est toute " +
        "neuve. »",
    ],
    choices: [{ id: "veilleur-passer", label: "Passer le portillon" }],
    jailerLine: "Une colonne des retours. Vide depuis trente ans. J'adore les optimistes — ils tiennent la comptabilité pour moi.",
  },
  {
    id: "palissade-sud-2",
    illustration: "assets/monstre_palissade_sud_2_c.png",
    narration: [
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
  "tour-de-guet": "Vers une tour qui a perdu son sommet",
  "campement": "Vers un moulin sans ailes",
  "chapelle-des-cordes": "Vers une chapelle de cordes",
  "puits-condamne": "Vers des coups sourds",
  "chien-du-bailli": "Vers une maison murée",
  "petit-tribunal": "Vers une salle de juges",
  "mare-aux-regards": "Vers une eau qui ne bouge pas",
  "verger-noir": "Vers des rangs d'arbres noirs",
  "meute-grise-1": "Vers des silhouettes grises",
  "palissade-sud": "Vers une palissade au sud",
};

/** Pool des destinations tirables (tout ce qui a une phrase d'orientation). */
export const TRAVERSAL_POOL = Object.keys(APPROACH);

/**
 * Les lieux qui sont DANS le Hameau des Renonçants (carte Figma 2112:325 : le
 * cadre pointillé « Le Hameau des Renonçants » va de (810,620) à (1790,1280),
 * et ces chips y tombent à l'intérieur).
 *
 * ⚠️ Retour Patrick 25/07 : sans cette notion, la traversée pouvait t'envoyer à
 * la Chapelle des Cordes — donc à l'intérieur du village — puis t'offrir plus
 * loin « Vers la fumée d'un hameau », c'est-à-dire la séquence d'ARRIVÉE au
 * hameau alors que tu en sortais. D'où la règle : on n'entre dans le Hameau que
 * par sa séquence garantie, et une fois entré cette séquence ne peut plus être
 * proposée (cf. `pickLiaisonOptions`).
 *
 * La Tour de Guet effondrée est aussi dans le cadre sur la carte, mais elle n'a
 * pas encore de scène écrite — à ajouter ici en même temps que son contenu.
 */
export const HAMEAU_INTERIOR = [
  "tour-de-guet",
  "chapelle-des-cordes",
  "chien-du-bailli", // La Maison du Bailli (murée) — la scène porte le nom du chien
  "petit-tribunal",
  "puits-condamne",
  "marche-muet",
];

/** La séquence d'arrivée au Hameau (5 beats garantis, hors tirage). */
const HAMEAU_GATE = "serment-hameau";

/** Un lieu est-il à l'intérieur du village ? (tolère les écrans « -2 »). */
export function isHameauInterior(id: string | undefined): boolean {
  if (!id) return false;
  const base = id.replace(/-2$/, "");
  return HAMEAU_INTERIOR.includes(base) || base.startsWith("hameau-");
}

/** Ambiances de marche génériques (spec 21/07) — FALLBACK quand aucune liaison
    contextuelle ne s'applique. Comptent dans le pool des ~30 (chantier 4). */
const LIAISON_AMBIANCES: string[] = [
  "Tu marches. La lande ne finit pas — elle se répète, talus après talus, sous le même crépuscule qui ne tombe jamais.",
  "Le vent pousse une odeur de corde mouillée et de terre retournée. Quelque part, toujours, une potence grince.",
  "La bruyère efface derrière toi les traces de ceux qui ont choisi avant. Devant, elle ne promet rien.",
  "Un long moment sans rien : juste tes pas, et la sensation d'être compté par quelque chose que tu ne vois pas.",
  "Le chemin se creuse, remonte, se divise. Ici, on ne va pas quelque part — on s'éloigne de la Borne.",
];

/**
 * Liaisons CONTEXTUELLES (chantier 4 du 23/07 — « le meilleur rapport
 * écriture/effet du jeu ») : indexées par provenance × destination × état
 * (santé, Soupçon, chapitre en cours, objets portés). Le texte le plus vu du
 * jeu ne doit plus être le plus pauvre. Sélection : la variante la plus
 * SPÉCIFIQUE éligible gagne (départage seedé) ; sans variante éligible, les
 * ambiances génériques reprennent. Chaque texte reste court (2-4 phrases).
 */
export type LiaisonCtx = {
  /** Lieu qu'on vient de quitter (id de scène). */
  from?: string;
  /** Les 2 destinations offertes par la liaison. */
  toOptions?: [string, string];
  soupcon?: number;
  health?: number;
  chapterId?: string | null;
  /** Noms des objets portés (Besace) — le matching se fait par inclusion. */
  itemNames?: string[];
};

type LiaisonVariant = {
  text: string;
  from?: string[];
  /** S'applique si l'UNE des destinations offertes est dans la liste. */
  to?: string[];
  minSoupcon?: number;
  maxSoupcon?: number;
  maxHealth?: number;
  chapter?: string;
  /** Sous-chaîne d'un nom d'objet porté (ex. "Écharde"). */
  carrying?: string;
};

const LIAISON_VARIANTS: LiaisonVariant[] = [
  // ——— Provenance (10) ———
  {
    from: ["colline-aux-gibets"],
    text: "Tu redescends de la colline avec les cordes dans le dos. Longtemps, leur grincement te suit — pas parce qu'il porte loin. Parce qu'il a trouvé ton rythme de marche.",
  },
  {
    from: ["champ-des-fixes"],
    text: "Les rangées de poteaux s'espacent, puis renoncent. Tu comptes tes pas pour ne pas compter les écriteaux. La lande reprend, vide — enfin, vide comme avant : surveillée.",
  },
  {
    from: ["pendu-qui-parle"],
    text: "Le grincement du Bailli s'éteint derrière le revers de la colline. Son jugement, lui, marche avec toi — tu l'entends peser chaque choix qui vient.",
  },
  {
    from: ["campement"],
    text: "Le moulin rapetisse derrière toi. Le sommeil t'a rendu des forces et pris autre chose — au réveil, la bruyère autour de ton lit était foulée en cercle.",
  },
  {
    from: ["petit-tribunal"],
    text: "Le froid du tribunal met du temps à sortir des os. Dehors, chaque visage croisé a l'air d'un banc : assis, patient, en train de juger.",
  },
  {
    from: ["chapelle-des-cordes"],
    text: "Les cordes clouées continuent de bouger dans ton dos, tu le sais sans te retourner. Une relique, ça garde le geste. La lande, elle, garde le tien.",
  },
  {
    from: ["serment-hameau"],
    text: "Les murets du hameau te lâchent un à un. Ce que tu as laissé — ou refusé de laisser — pèse exactement le poids annoncé. La Doyenne avait raison sur ce point.",
  },
  {
    from: ["marche-muet"],
    text: "Le silence du marché te colle aux semelles. Tu mets du temps à t'autoriser un bruit — et quand tu tousses enfin, la lande entière semble le noter.",
  },
  {
    from: ["puits-condamne"],
    text: "Trois coups, une pause. Le rythme du puits te suit bien après qu'il est devenu inaudible. Tu marches dessus, maintenant : trois pas, une pause. Tu t'arrêtes net. Tu reprends autrement.",
  },
  {
    // NB : les ids « from » sont normalisés côté runtime (suffixe -2 retiré) —
    // meute-grise-2 devient « meute-grise », chien-du-bailli-2 « chien-du-bailli ».
    from: ["bete-chemins-creux", "meute-grise", "pendu-mal-fixe", "chien-du-bailli"],
    text: "Tu laisses le combat derrière toi, mais pas tout : la lande a bu ce qui a coulé, et elle sait maintenant quel goût tu as. Tu marches plus léger, et moins tranquille.",
  },
  // ——— Soupçon (10) ———
  {
    minSoupcon: 1, maxSoupcon: 2,
    text: "Un berger sans troupeau te croise au détour d'un talus. Il te salue — du menton, pas de la voix — et presse le pas une fois passé. Tu l'entends s'arrêter, plus loin, pour te regarder partir.",
  },
  {
    minSoupcon: 1, maxSoupcon: 2,
    text: "Deux silhouettes réparent un muret à distance. Leurs mains ne s'arrêtent pas quand tu passes. Leurs têtes, si.",
  },
  {
    minSoupcon: 1, maxSoupcon: 3,
    text: "Sur une pierre du chemin, une croix à la craie — vieille, à moitié lavée. Pas la tienne. Quelqu'un d'autre, avant toi, a entendu quelque chose. Tu ne sauras pas où il pend.",
  },
  {
    minSoupcon: 2, maxSoupcon: 3,
    text: "Le chemin longe une maison basse. Un volet se ferme — pas vite, pas peureusement. Posément. On ne se cache pas de toi : on te retire la maison, c'est différent.",
  },
  {
    minSoupcon: 2, maxSoupcon: 4,
    text: "Un mot t'arrive porté par le vent, un seul, distinct : ton nom. Personne à l'horizon. Le vent des Landes ment, tu le sais. Mais il ment avec ce qu'on lui donne.",
  },
  {
    minSoupcon: 3, maxSoupcon: 4,
    text: "Il y a des traces fraîches sur ton chemin — devant toi. Quelqu'un fait ta route avant toi, dans le même sens, à petite distance. Tu ne le rattrapes jamais.",
  },
  {
    minSoupcon: 3, maxSoupcon: 4,
    text: "Un enfant t'observe depuis un talus, immobile. Quand tu lèves la main, il ne fuit pas : il trace quelque chose dans la terre du bout d'un bâton, sans te quitter des yeux, puis s'en va sans courir.",
  },
  {
    minSoupcon: 4, maxSoupcon: 5,
    text: "On ne croise plus personne. C'est pire que d'être suivi : la lande s'est vidée sur ton passage, comme une rue avant une arrestation.",
  },
  {
    minSoupcon: 4, maxSoupcon: 5,
    text: "Au loin, une cloche muette sonne quand même — trois coups mats, du bois sur du bois. Tu comprends que ça compte tes passages. Quelqu'un, quelque part, tient le total.",
  },
  {
    minSoupcon: 5, maxSoupcon: 5,
    text: "Les trois hommes sont toujours là, à la limite du regard. Quand tu t'arrêtes, ils s'arrêtent. Quand tu repars, ils attendent un peu — par politesse, dirait-on. L'aube n'est pas pressée.",
  },
  // ——— Santé (3) ———
  {
    maxHealth: 0.5,
    text: "Chaque montée coûte. Tu comptes tes forces comme une bourse trop plate — et la lande le voit, qui te tend ses talus comme on tend un bras à un vieillard. Tu refuses. Pour l'instant.",
  },
  {
    maxHealth: 0.3,
    text: "Tu t'arrêtes deux fois pour souffler. La deuxième, la bruyère où tu poses la main reste marquée de rouge. La lande te goûte déjà.",
  },
  {
    maxHealth: 0.5,
    text: "La blessure donne le rythme, plus toi. Tu marches au pas de ce qui fait mal — c'est une laisse comme une autre.",
  },
  // ——— Chapitre en cours (2) ———
  {
    chapter: "la-fille",
    text: "Au détour d'un talus, tu crois voir une silhouette mince, tête nue, disparaître derrière un pli du terrain. Le temps d'y être : personne. Un lit d'herbe couchée, encore tiède.",
  },
  {
    chapter: "le-gibet-vide",
    text: "Où que le chemin tourne, la couronne de la colline reste en vue — et le grand gibet dépasse, patient. Tu commences à comprendre : ce n'est pas toi qui le regardes.",
  },
  // ——— Objets portés (2) ———
  {
    carrying: "Écharde",
    text: "Dans ta besace, l'écharde du gibet est tiède — pas de ta chaleur. Elle tire doucement vers la colline, comme une aiguille vers son nord à elle.",
  },
  {
    carrying: "Lanterne",
    text: "La lanterne du Veilleur bat contre ta hanche. Sa flamme penche toujours du même côté, quel que soit le vent — tu as fini par vérifier : elle penche vers le sud. Vers la Descente.",
  },
  // ——— Destination offerte (3) ———
  {
    to: ["colline-aux-gibets"],
    text: "D'un côté, la crête et ses mâts noirs qui grandissent au-dessus de la bruyère. Tu sens le chemin pencher vers eux — la colline aspire ses visiteurs, elle ne les invite pas.",
  },
  {
    to: ["campement"],
    text: "Quelque part devant, l'ombre d'un moulin sans ailes coupe le crépuscule. L'idée du sommeil pèse d'un coup — trop fort, trop vite, comme une offre qu'on te souffle.",
  },
  {
    to: ["puits-condamne"],
    text: "Un son porte jusqu'ici — des coups sourds, réguliers, patients. Trois, une pause. Le genre de son qu'on suit malgré soi, juste pour le faire taire.",
  },

  // ——— DANS le hameau (3) — retour Patrick 25/07 ———
  // Une fois passé le barrage, on ne « marche plus dans la lande » : on longe
  // des murs. Ces variantes ont la provenance la plus large possible pour
  // couvrir tout déplacement intérieur du village.
  {
    from: HAMEAU_INTERIOR,
    text: "Tu longes les murets d'une ruelle à l'autre. Pas de lande ici : des murs à hauteur d'épaule, des portes closes, et le bruit de tes pas qui revient de trop près.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Le village se traverse en quelques dizaines de pas, et pourtant chaque rue semble tourner pour te faire repasser devant les mêmes fenêtres. Derrière les volets, on compte tes passages.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Une ruelle, une cour, une autre ruelle. Le hameau ne t'empêche pas de circuler — il te laisse faire, et note l'itinéraire.",
  },
];

/** Spécificité d'une variante = nombre de conditions posées (départage). */
function liaisonSpecificity(v: LiaisonVariant): number {
  let n = 0;
  if (v.from) n += 1;
  if (v.to) n += 1;
  if (v.minSoupcon !== undefined || v.maxSoupcon !== undefined) n += 1;
  if (v.maxHealth !== undefined) n += 1;
  if (v.chapter) n += 1;
  if (v.carrying) n += 1;
  return n;
}

/** Choisit l'ambiance d'une liaison : la plus spécifique éligible, seedée. */
function pickLiaisonAmbiance(ctx: LiaisonCtx | undefined, seed: number): string {
  if (ctx) {
    const soup = ctx.soupcon ?? 0;
    const health = ctx.health ?? 1;
    const eligible = LIAISON_VARIANTS.filter(
      (v) =>
        (!v.from || (ctx.from !== undefined && v.from.includes(ctx.from))) &&
        (!v.to || (ctx.toOptions !== undefined && v.to.some((t) => ctx.toOptions!.includes(t)))) &&
        (v.minSoupcon === undefined || soup >= v.minSoupcon) &&
        (v.maxSoupcon === undefined || soup <= v.maxSoupcon) &&
        (v.maxHealth === undefined || health <= v.maxHealth) &&
        (!v.chapter || ctx.chapterId === v.chapter) &&
        (!v.carrying || (ctx.itemNames ?? []).some((n) => n.includes(v.carrying!)))
    );
    if (eligible.length > 0) {
      const maxSpec = Math.max(...eligible.map(liaisonSpecificity));
      const top = eligible.filter((v) => liaisonSpecificity(v) === maxSpec);
      return top[Math.floor(seeded(seed + 3) * top.length)].text;
    }
  }
  return LIAISON_AMBIANCES[Math.floor(seeded(seed) * LIAISON_AMBIANCES.length)];
}

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
 * `ctx` (chantier 4 du 23/07) : provenance/état pour une ambiance CONTEXTUELLE
 * — même ctx à la reprise (reconstruit du même RunState) = même texte.
 */
export function makeLiaison(optA: string, optB: string, seed: number, ctx?: LiaisonCtx): Scene {
  const amb = pickLiaisonAmbiance(ctx ? { ...ctx, toOptions: [optA, optB] } : undefined, seed);
  const jl = LIAISON_JAILER[Math.floor(seeded(seed + 7) * LIAISON_JAILER.length)];
  // La marche a SON visuel (retour playtest 24/07 : « on passe d'une scène à
  // l'autre sans marcher »), tiré par la graine (stable à la reprise). Fini le
  // portail figé entre deux lieux.
  const walkImg = pickWalkImage(optA, optB, seed, ctx?.from);
  return {
    id: `liaison:${optA}>${optB}`,
    liaison: true,
    illustration: walkImg,
    narration: [amb, "Deux directions s'ouvrent. La lande attend que tu tranches."],
    jailerLine: jl,
    choices: [
      { id: `orient-${optA}`, label: APPROACH[optA] ?? "Continuer", orient: { dest: optA } },
      { id: `orient-${optB}`, label: APPROACH[optB] ?? "Continuer", orient: { dest: optB } },
    ],
  };
}

/** Les 4 vues génériques des Landes (fournies par Patrick, 24/07) : utilisées
    pour la MARCHE (liaisons) et comme secours quand un lieu n'a pas d'asset
    propre. Donnent au visuel de quoi bouger scène après scène. */
export const LANDES_GENERIC = [
  "assets/scene_lande_generique_1.png",
  "assets/scene_lande_generique_2.png",
  "assets/scene_lande_generique_3.png",
  "assets/scene_lande_generique_4.png",
];

/** Vues de MARCHE des Landes (lot Drive 25/07) : chemins, plateaux, fourches —
    des images faites pour la liaison, pas pour un lieu. Elles s'ajoutent aux
    4 génériques dans le tirage par défaut. */
const LANDES_WALK = [
  "assets/scene_landes_liaison_plateau_d.png",
  "assets/scene_landes_liaison_fourche_a.png",
  "assets/scene_lande_arbres_morts_c.png",
  ...LANDES_GENERIC,
];

/** Les 3 vues d'ensemble du hameau que Patrick veut « varier entre des
    scènes » (25/07) — la 4e, `scene_hameau_dense2_b`, est réservée au lieu
    lui-même (« celle qui représente vraiment le hameau »). */
const HAMEAU_WALK = [
  "assets/scene_hameau_dense_b.png",
  "assets/scene_hameau_dense_c.png",
  "assets/scene_hameau_dense_d.png",
];

/**
 * Visuel de la marche. Contextuel plutôt qu'au hasard : quand une des deux
 * directions offertes a son image de chemin, on marche VERS elle (on voit le
 * hameau grossir, le couloir de terre s'ouvrir, le sud se refroidir) ; sinon
 * on tire dans le pool de marche. Seedé = stable à la reprise.
 */
function pickWalkImage(optA: string, optB: string, seed: number, from?: string): string {
  const offered = [optA, optB];
  // On MARCHE DANS le hameau (retour Patrick 25/07 : « c'est une image
  // générique des landes et non du hameau alors que j'en ai pleins ») : dès
  // qu'on vient d'une ruelle du village ou qu'on y va, la vue de marche est le
  // village, pas la bruyère. `scene_hameau_dense2_b` reste réservée au lieu.
  if (
    offered.includes(HAMEAU_GATE) ||
    isHameauInterior(from) ||
    offered.some((o) => isHameauInterior(o))
  ) {
    return HAMEAU_WALK[Math.floor(seeded(seed + 11) * HAMEAU_WALK.length)];
  }
  if (offered.includes("chemin-creux")) return "assets/scene_landes_liaison_chemin_creux_a.png";
  if (offered.includes("palissade-sud")) return "assets/scene_landes_liaison_sud_c.png";
  return LANDES_WALK[Math.floor(seeded(seed + 11) * LANDES_WALK.length)];
}

/**
 * Phrase d'APPROCHE d'un lieu (retour playtest 24/07 : « sans marcher et voir
 * le hameau au loin ») : jouée à l'arrivée, AVANT la description du lieu. On
 * voit la destination se dresser, on y marche — la transition est vécue, pas
 * sautée. Jamais un danger frontal : juste l'approche sensorielle.
 */
export const APPROACH_NARRATION: Record<string, string> = {
  "chemin-creux": "Le sol se creuse devant toi. Deux talus montent, se resserrent, et avalent le chemin entre eux. Tu descends dans le couloir de terre — vu de partout, ne voyant rien.",
  "bete-chemins-creux": "L'air se charge d'une odeur qui n'appartient pas au chemin : suint, cuir, terre remuée. Quelque part devant, dans le creux, quelque chose t'a senti avant que tu le sentes.",
  "colline-aux-gibets": "Loin sur la lande, une bosse noire monte seule au-dessus de la bruyère — hérissée de mâts. À mesure que tu approches, les mâts deviennent des potences, et les potences se peuplent.",
  "pendu-qui-parle": "Au revers de la colline, un seul gibet, bas, à hauteur d'homme. Tu le prends d'abord pour un épouvantail. Puis l'épouvantail tourne lentement la tête vers toi.",
  "champ-des-fixes": "L'horizon se hérisse de piquets réguliers, rangée après rangée, jusqu'à se perdre. Tu approches d'un champ qu'on n'a pas semé — on l'a planté d'hommes.",
  "pendu-mal-fixe": "Un craquement rythme ta marche, régulier, mécanique — du bois qui travaille sous un poids. Devant, une corde trop lâche laisse glisser ce qu'elle devait tenir.",
  "serment-hameau": "De la fumée basse, pas une flamme : des toits gris tassés derrière leurs murets. Le Hameau des Renonçants se découvre lentement, et déjà tu sens qu'on t'a vu venir de loin.",
  "tour-de-guet":
    "Le moignon de la tour grossit à mesure que tu montes le tertre — plus bas que tu ne croyais, et couché de biais, comme un os mal ressoudé. Tu arrives à son pied.",
  "marche-muet": "Un bourdonnement de foule sans une seule voix te parvient — des dizaines de gens qui s'affairent en silence. Tu entres dans le marché muet du hameau.",
  "campement": "À l'écart des toits, une masse trapue coupe le crépuscule : un moulin privé de ses ailes, debout par habitude. De la lumière n'en sort pas, mais quelque chose y veille.",
  "chapelle-des-cordes": "Une bâtisse sans croix se dresse au bout d'une ruelle. En approchant, tu vois par la porte ouverte que les murs, à l'intérieur, remuent doucement — des cordes, des dizaines, sans un souffle d'air.",
  "puits-condamne": "Un bruit sourd te guide entre les maisons : trois coups, une pause, trois coups. Tu débouches sur une margelle condamnée de planches neuves — la seule chose entretenue du hameau.",
  "chien-du-bailli": "La plus haute maison du hameau grandit devant toi, aveugle : ses fenêtres sont murées de l'intérieur. Sur le seuil, une masse grise se lève sans un aboiement.",
  "petit-tribunal": "Une bâtisse basse, une seule porte, et par elle un froid qui ne vient pas du dehors : le froid des endroits où l'on a beaucoup décidé. Tu entres au Petit Tribunal.",
  "mare-aux-regards": "Le vent tombe d'un coup, comme coupé au couteau, et devant toi une plaque d'eau noire ne bouge pas du tout. Tu approches de la seule surface plate des Landes.",
  "verger-noir": "Des rangs réguliers montent de la bruyère — des arbres, plantés à la main, alignés. De loin c'est presque rassurant. De près, les feuilles sont noires et les fruits sont gris.",
  "meute-grise-1": "La bruyère bouge sans vent, par plaques, autour de toi. Ce ne sont pas des ombres : ce sont des dos gris, bas sur pattes, qui resserrent un cercle patient.",
  "palissade-sud": "Au bout des Landes, une ligne de troncs noircis barre tout l'horizon. Derrière, l'air se fait froid et vieux — il monte d'en bas. La Descente n'est plus loin.",
};

/**
 * Tire les 2 destinations offertes à une liaison : 2 lieux NON encore visités,
 * choisis dans le pool via la graine (stable à la reprise). Si le pool est
 * presque épuisé, complète avec ce qui reste.
 */
export function pickLiaisonOptions(
  visited: string[],
  seed: number,
  hameauEntree = true
): [string, string] {
  // Porte du Hameau (retour Patrick 25/07) : tant qu'on n'est pas entré par la
  // séquence garantie, l'INTÉRIEUR du village n'est pas offert — on ne se
  // retrouve pas dans la chapelle sans avoir passé le barrage. Une fois entré,
  // c'est la séquence d'arrivée qui disparaît du pool : on n'« arrive » pas
  // deux fois dans un village où l'on est déjà.
  const gated = TRAVERSAL_POOL.filter((id) =>
    hameauEntree ? id !== HAMEAU_GATE : !isHameauInterior(id)
  );
  const remaining = gated.filter((id) => !visited.includes(id));
  const src = remaining.length >= 2 ? remaining : gated.filter((id) => !visited.slice(-1).includes(id));
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

/**
 * LA LIGNE DES CORBEAUX (Notion 26/07 §6) — la seule chose du décor qui compte
 * les morts du joueur.
 *
 * Le nombre est dit en PROSE, jamais en chiffre : le joueur peut les compter
 * lui-même sur l'illustration, et la phrase confirme sans jamais ressembler à
 * un compteur d'interface. Au-delà d'une douzaine on cesse de nommer le nombre
 * — c'est le moment où « beaucoup » est plus juste que « quatorze », et où la
 * ligne devient une menace au lieu d'un score.
 */
const CORBEAUX_MOTS = [
  "aucun",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
];

export function ligneCorbeaux(morts: number): string {
  if (morts <= 0)
    return (
      "Il n'y en a qu'un, et il se tient de travers, comme s'il gardait une " +
      "place. Tu ne sais pas pour qui."
    );
  if (morts >= CORBEAUX_MOTS.length)
    return (
      "Tu commences à les compter, et tu t'arrêtes. Ils occupent toute la " +
      "traverse, serrés, et il en reste qui tournent au-dessus faute de " +
      "place. « Ils te connaissent », dit une voix qui n'est pas là. " +
      "« Ils t'ont vu revenir plus souvent que n'importe qui. »"
    );
  // « ils sont un » sonne faux : le cas d'un seul corbeau se dit autrement.
  if (morts === 1)
    return (
      "Il n'y en a qu'un, et il est arrivé récemment — la trace de ses " +
      "serres est encore fraîche sur le bois. Il te regarde une fois, puis " +
      "reprend sa faction."
    );
  return (
    `Tu les comptes sans le décider : ils sont ${CORBEAUX_MOTS[morts]}. Ni ` +
    "plus, ni moins. Et le dernier arrivé a encore de la poussière de route " +
    "sur les plumes."
  );
}
