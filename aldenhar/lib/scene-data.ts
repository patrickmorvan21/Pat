/**
 * Moteur de contenu — LES LANDES (Acte I, zone gelée 20/07).
 * La réserve de scènes couvre uniquement la zone des Landes (source :
 * data/zones/landes.json + carte Figma 2112:325) et tourne en boucle pour le
 * playtest — la vraie structure Domaine (13 zones, 3 actes, strates
 * anti-répétition) viendra en temps 2. L'ancien contenu générique (Geryon,
 * Rôdeur, meute de limiers…) a été retiré le 20/07 à la demande de Patrick.
 * Les stats restent cachées : jamais de chiffre affiché, seulement le tag.
 */

import type { Condition, Faits } from "./faits";
import { evalue, present } from "./faits";

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
  /**
   * LA NATURE DU JET DÉCIDE DU COÛT DE L'ÉCHEC (arbitrage Patrick 9/08, sur
   * rapport de playtest). Avant, tout échec coûtait la même santé et le même
   * Jour, quel que soit le sujet : rater un mensonge blessait autant qu'une
   * chute, et l'on pouvait mourir d'une conversation. Désormais :
   *   • physique   → la santé (chute, morsure, effort, combat) ;
   *   • social     → le Soupçon, jamais la santé (on ne saigne pas d'un
   *                  mot maladroit — on se fait remarquer) ;
   *   • exploration→ le temps : un échec dur coûte un Jour (« tu as tourné
   *                  pendant des heures »), jamais de santé ;
   *   • surnaturel → un état (HANTÉ, MARQUÉ), jamais de santé.
   * ⚠️ Conséquence directe : **on ne meurt plus que d'un échec physique**
   * (ou du procès). C'est voulu — la mort doit être compréhensible dans la
   * fiction. Les autres pressions tuent par un autre chemin : le Soupçon
   * mène au procès, les Jours réveillent les Besoins.
   */
  nature?: "physique" | "social" | "exploration" | "surnaturel";
  /** Choix verrouillé : seuil de stat non atteint → grisé mais visible. */
  /** Verrouillé par une stat. AVEC `min` (échelle 1..5) : vraie CONDITION —
      un héros dont la stat atteint le seuil peut agir (retour test 4/08,
      promesse n°2 : « ta nature ouvre et ferme des actions »), la résolution
      passe alors par `passive`. SANS `min` : verrou DUR pour tout le monde
      (ex. Franchir la Descente = tease Acte II, jamais franchissable ici). */
  locked?: { stat: Stat; min?: number };
  /** Repos au campement : avance le jour, atténue les blessures légères, sauvegarde (spec §7). */
  rest?: boolean;
  /**
   * TAGS du choix. `fuite` : le choix DISPARAÎT quand le héros est Boiteux —
   * on ne fuit pas sur une jambe. C'est la spec §2 : « les options de fuite
   * disparaissent des choix », pas « deviennent plus dures ».
   */
  tags?: string[];
  /**
   * ÉTAT posé par ce choix (spec 4/08 §2). Le monde y réagira ensuite : c'est
   * ce qui distingue un état d'un modificateur déguisé.
   */
  poseEtat?: string;
  /** Ce choix RÉPOND à un besoin (spec §3) — remet son horloge à ce jour-là. */
  repondBesoin?: "dormir" | "soigner" | "manger" | "boire" | "laver";
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
   *
   * ⚠️ DOCTRINE (arbitrage Patrick 8/08) : le Soupçon vient d'un ACTE —
   * toucher, prélever, mentir, questionner des gens, jurer faux, regarder le
   * sud, épier caché — JAMAIS de l'observation pure (regarder, compter,
   * lire, écouter). La curiosité se RÉCOMPENSE (savoir, fragments, objets,
   * découvertes — la règle des quatre monnaies), elle ne se paie pas.
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
   * LE REGISTRE MENT (5/08) : ce choix n'existe que si le COMPTE tient une
   * contradiction — deux versions incompatibles d'un même fait, lues dans deux
   * vies différentes (lib/contradictions.ts). Une seule vie ne peut jamais
   * l'ouvrir : c'est le seul endroit où mourir enseigne ce que vivre ne peut
   * pas enseigner.
   */
  requiresContradiction?: boolean;
  /**
   * DÉFENSE AU PROCÈS (5/08) : ce choix n'existe que si les TÉMOINS présents
   * la rendent possible (lib/temoins.ts `defensesDisponibles`). Discréditer
   * demande un témoin nommé, émouvoir demande quelqu'un du hameau lui-même,
   * produire un papier demande un document en Besace. Assumer est toujours là.
   */
  defense?: "discrediter" | "emouvoir" | "assumer" | "preuve";
  /**
   * LE RENONCEMENT (5/08) : ce choix met FIN à la run sans mort — le héros
   * reste au Hameau. Pas de relique, pas de fragment : son nom entre au
   * Registre avec la mention « resté au Hameau », et c'est tout.
   */
  renonce?: boolean;
  /**
   * SAVOIR appris en PRENANT ce choix (poser la question à quelqu'un vaut
   * examiner une trace : c'est la même monnaie). Posé dès la sélection, comme
   * le Soupçon — l'acte d'avoir demandé suffit, l'issue d'un éventuel jet ne
   * change rien à ce qu'on a entendu.
   */
  grantsSavoir?: string;
  /**
   * ÉTAT REQUIS (spec 4/08 §2) : ce choix n'existe que si le héros PORTE cet
   * état. C'est le pendant positif de `cacheFuite` — un état ne fait pas que
   * retirer des options, il en ouvre. Le cas fondateur est FIXÉ : ceux qui
   * portent la même croix se mettent à te parler. Aucun marqueur à l'écran :
   * l'option est là ou elle n'y est pas.
   */
  requiresEtat?: string;
  /**
   * ÉTAT POSÉ SEULEMENT SI LE JET ÉCHOUE. Boire l'eau de la Mare ou forcer un
   * seuil devant témoins ne coûte pas à tous les coups — c'est le RATÉ qui
   * coûte. Poser l'état à la sélection ferait mentir les issues écrites (« tu
   * bois, et rien ne te prend »).
   */
  poseEtatSiEchec?: string;
  /**
   * ÉTAT POSÉ SEULEMENT SI LE JET TIENT. Le Gamin n'accompagne que celui qu'il
   * a décidé de suivre : poser l'état à la sélection ferait venir un compagnon
   * qui vient de te refuser.
   */
  poseEtatSiReussite?: string;
  /**
   * Durée en LIEUX de l'état posé par ce choix. Absent = l'état dure jusqu'à
   * ce qu'un remède le lève (blessures, statuts sociaux). Présent = il expire
   * seul — un compagnon qui a annoncé « deux murets » s'en va au deuxième.
   */
  poseEtatDuree?: number;
  /**
   * DÉCOUVERTE posée en prenant ce choix (refonte du lore 6/08). C'est ce que
   * LE JOUEUR a compris, pas ce que sait le héros : scope `global_permanent`,
   * donc ça survit à la mort. La révélation des Landes est explicitement
   * inter-runs (« 1ʳᵉ run le joueur croit que le Bailli est le tyran ; runs
   * suivantes il découvre… ») — un savoir de run ne pourrait pas la porter.
   *
   * ⚠️ Ne JAMAIS s'en servir pour donner au héros courant une information
   * qu'il n'a pas vécue : une découverte ouvre des scènes et des options, elle
   * ne met pas de souvenirs dans sa tête.
   */
  decouverte?: string;
  /** Ce choix n'existe que si le COMPTE tient cette découverte. */
  requiresDecouverte?: string;
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
  /** ÉTAT posé par l'examen (spec 4/08 §2) — Hanté au pied du Gibet Vide. */
  poseEtat?: string;
  /**
   * LES CORBEAUX DU COMPTE (Notion 26/07 §6) : l'examen ajoute une ligne
   * calculée sur la MÉMOIRE DE COMPTE — les corbeaux se posent au nombre
   * exact des morts du joueur. C'est un des rares endroits où la
   * méta-progression se lit dans le décor plutôt que dans un écran, donc le
   * nombre est dit en PROSE (« trois »), jamais affiché comme un chiffre.
   */
  corbeaux?: boolean;
  /**
   * LE TROUPEAU SANS BERGER (6/08) : l'examen SE TERMINE par le comptage
   * calculé (`ligneTroupeau`) — le troupeau grossit d'une run à l'autre et le
   * nombre est dit en prose, jamais annoncé comme un compteur.
   */
  troupeau?: boolean;
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
  /**
   * FAIT VARIABLE (5/08, lib/contradictions.ts) : l'examen énonce EN PLUS la
   * version que cette run tient pour vraie. Le Domaine ne raconte pas la même
   * histoire d'une vie à l'autre — le joueur ne peut s'en apercevoir qu'en
   * mourant et en revenant. Deux versions lues = une contradiction opposable
   * au Registre.
   */
  fait?: string;
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
  /** DÉCOUVERTE posée par l'examen (voir `Choice.decouverte`). */
  decouverte?: string;
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
  /**
   * TAGS de la scène (spec 4/08 §2) — ce que le lieu OFFRE, pour que les états
   * n'agissent que là où ça a du sens :
   *   `food_available` / `stealable` → « Affamé » y ouvre un choix « voler » ;
   *   `rough_path` / `climb` / `chase` → « Boiteux » peut y compliquer.
   * ⚠️ Sans ces tags, un état s'appliquerait partout et deviendrait un bruit
   * de fond : la spec l'interdit explicitement.
   */
  tags?: string[];
  /** Nœud terminal (la Descente) : la traversée s'arrête (fin sèche Acte II). */
  terminal?: boolean;
  /**
   * Terminal PAR RENONCEMENT (5/08) : la run s'arrête sans mort. Le nom entre
   * au Registre avec la mention « resté au Hameau », aucune relique n'est
   * forgée — on ne forge rien avec une vie qu'on n'a pas perdue.
   */
  renoncement?: boolean;
  /** DÉCOUVERTE posée en ARRIVANT sur cette scène (voir `Choice.decouverte`). */
  decouverte?: string;
  /**
   * SCÈNE-VARIANTE (refonte du lore 6/08). Cette scène se joue À LA PLACE de
   * `scene` quand `si` est vraie. Déclaré sur la variante et non sur
   * l'original : la condition vit à côté du texte qu'elle conditionne, et
   * ajouter une variante ne touche jamais la scène d'origine.
   *
   * ⚠️ La variante n'est PAS dans le pool de traversée : elle hérite de la
   * place de l'originale (mêmes liaisons, même `chainNext` attendu). Une
   * variante de `femme-seuil-1` doit donc chaîner comme `femme-seuil-1`.
   */
  remplace?: { scene: string; si: Condition };
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

/** Nature d'un jet — voir le commentaire de `Choice.nature`. */
export type NatureJet = "physique" | "social" | "exploration" | "surnaturel";

/**
 * Le coût en SANTÉ d'un palier, selon la nature du jet.
 *
 * Une seule source pour les deux appelants : la résolution qui l'applique, et
 * `fatalCheck` qui décide si le dé doit annoncer MORT. S'ils divergeaient, le
 * dé annoncerait une mort qui n'arrive pas — ou l'inverse.
 */
export function coutSante(nature: NatureJet, tier: ResolutionTier): number {
  if (nature !== "physique") return 0;
  return tier === "malediction" ? 0.3
    : tier === "critique" ? 0.26
    : tier === "echec" ? 0.16
    : tier === "justesse" ? 0.08
    : 0;
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

/* ───────────────────────────── DÉCOUVERTES & VARIANTES (refonte 6/08) ──── */

/** Préfixe des découvertes, pour les distinguer des savoirs dans un même sac. */
export const D = (nom: string) => `d.${nom}`;

/**
 * Les découvertes qui portent SUR LA FILLE. Le Moulin ne s'ouvre qu'à partir
 * de trois d'entre elles (spec §6) — c'est le seuil qui fait de la rencontre
 * une récompense d'enquête et non un hasard de tirage.
 */
export const DECOUVERTES_FILLE = [
  D("fille_apercue"), // le Gamin et son caillou
  D("fixation_ratee"), // la corde sans nom que la Veuve refait depuis trente ans
  D("poteau_retire"), // le trou dans la rangée, au Champ des Fixés
  D("temoin_oculaire"), // la Femme au Seuil, qui a attendu quarante ans
  D("nom_gratte"), // le nom gratté au pied du grand gibet
  D("crete_interrompue"), // le chemin de faîtage qui s'arrête à cinquante pas
];

/** Compteur dérivé, tenu à la pose — voir `poserDecouverte` dans Scene.tsx. */
export const COMPTEUR_FILLE = "c.fille";

export function compteDecouvertesFille(f: Faits): number {
  return DECOUVERTES_FILLE.filter((id) => present(f, id)).length;
}

/** Seuil d'ouverture du Moulin (spec §6 : « ≥ 3 découvertes sur elle »). */
export const SEUIL_MOULIN = 3;

/**
 * Résout la scène RÉELLEMENT jouée pour un id : si une variante déclare
 * `remplace: { scene: id, si }` et que sa condition tient, c'est elle qui se
 * joue. La première variante satisfaite l'emporte (ordre du fichier), ce qui
 * permet de ranger la plus spécifique en premier.
 */
export function sceneEffective(id: string, f: Faits): Scene | undefined {
  const variante = SCENES.find((s) => s.remplace?.scene === id && evalue(s.remplace.si, f));
  return variante ?? sceneById(id);
}

export const SCENES: Scene[] = [
  {
    // Scène 0 — l'entrée de zone. Le crépuscule éternel et le bruit écrit
    // (« quelque part, une corde grince ») se posent ici, une fois pour toutes.
    id: "borne-frontiere",
    // Vue DÉDIÉE du tout premier écran du jeu (lot 25/07) : l'ancienne image
    // était une vue de transition, aussi tirée dans le pool des marches.
    illustration: "assets/scene_borne_frontiere_v2_a.png",
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
        nature: "surnaturel",
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
      {
        id: "repondre-voix",
        label: "Répondre aux voix",
        locked: { stat: "EMPATHIE", min: 4 },
        passive: {
          consequence:
            "Tu réponds au vent — pas des mots, un ton. Le même que le leur. " +
            "Les voix se taisent une mesure entière, puis reprennent plus bas, " +
            "et cette fois elles ne parlent plus de toi. La lande sait " +
            "maintenant que tu entends. Ça change la manière dont elle parle.",
        },
      },
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
        nature: "social",
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
    illustration: "assets/monstre_hesitant_2_b.png",
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
        nature: "social",
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
    illustration: "assets/monstre_hesitant_3_v2_a.png",
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
    tags: ["rough_path"],
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
        illustration: "assets/monstre_marcheur_rebours_v2_a.png",
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
        nature: "exploration",
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
    illustration: "assets/scene_chemin_creux_coude_b.png",
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
        nature: "physique",
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
    illustration: "assets/monstre_marcheur_2_v2_c.png",
    chainNext: "marcheur-3",
    narration: [
      "— « Tu veux traverser entier ? » Il est déjà trois pas plus loin. " +
        "« Alors fais comme moi jusqu'au coude. Après le coude, elle suit " +
        "plus. Personne sait pourquoi. On va pas lui demander. »",
    ],
    choices: [
      {
        id: "marcheur-imiter",
        nature: "physique",
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
    illustration: "assets/monstre_marcheur_3_v2_b.png",
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
    // L'embuscade enchaîne sur SON lieu : on descendait vers le Chemin Creux,
    // la Bête surgit au coude, et le creux continue après le combat.
    chainNext: "chemin-creux",
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
    /**
     * ⚠️ AMENDE la règle « jamais sous 6000 ms » du 14/07 (retour Patrick
     * 6/08 : « il y avait un petit timer, quatre secondes, ça joue sur le
     * réflexe — je l'ai perdu »).
     *
     * Les 6 secondes avaient été posées quand le compte à rebours pouvait
     * s'armer PENDANT que le texte se tapait encore : il fallait de la marge
     * pour lire. Il ne s'arme plus qu'une fois les choix réellement jouables
     * (`countdownArmed`), donc 4 secondes sont 4 secondes de DÉCISION.
     *
     * Réservé aux scènes où la précipitation est diégétique — une bête qui
     * charge dans un couloir. Les scènes de délibération gardent 7000 ms.
     * Plancher absolu : 4000 ms.
     */
    timed: {
      ms: 4000,
      timeoutNarration:
        "Le temps que tu décides, elle a couvert le creux. Tu la prends " +
        "dans les jambes, tu pars en arrière, et le ciel te passe au-dessus " +
        "de la tête — cette bande de ciel étroite entre deux murs de terre, " +
        "la dernière chose que voient ceux qui décident trop lentement ici.",
      timeoutChoices: [
        {
          id: "bete-au-sol",
          label: "Frapper depuis le sol",
          risky: {
            stat: "COURAGE",
            threshold: 13,
            outcomes: outcomes(
              "20 naturel. Couché, tu as l'angle qu'on n'a jamais debout : par en dessous, là où le corps n'est plus qu'une peau tendue. La Bête s'ouvre en deux sur toute sa longueur et t'enjambe encore trois mètres avant de comprendre qu'elle est morte.",
              "Tu frappes de bas en haut, mal, mais assez. Elle recule d'un bond sec, se retourne dans le creux — un demi-tour de bête qui ne fait jamais demi-tour — et s'en va par où elle est venue.",
              "Le coup part de trop loin. Elle passe sur toi de tout son long, sans même s'arrêter, et le creux redevient silencieux. Tu mets un moment à comprendre ce qu'elle a emporté au passage.",
              "1 naturel. Tu frappes le talus. Le talus, lui, ne bouge pas. ♦ −2"
            ),
          },
        },
        {
          id: "bete-faire-le-mort",
          label: "Ne plus bouger du tout",
          // L'immobilité est une vraie réponse (§19) : la Bête chasse le
          // mouvement dans l'axe du creux.
          passive: {
            consequence:
              "Tu restes exactement où elle t'a mis. Elle te renifle sur " +
              "toute ta longueur, longuement, professionnellement — puis " +
              "elle repart. Tu comprends en te relevant : elle ne cherchait " +
              "pas à manger. Elle vérifiait si tu étais du couloir.",
          },
        },
      ],
    },
    choices: [
      {
        id: "frapper-bete",
        nature: "physique",
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
        // Bondir hors du creux : sur une jambe qui ne plie plus, ce n'est pas
        // « plus dur » — c'est impossible. BOITEUX retire ce choix (cacheFuite).
        id: "grimper-talus",
        nature: "physique",
        tags: ["fuite"],
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
    tags: ["climb"],
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
        /* LA TOURNÉE (§7) : le Gibet Vide était démesuré et sans explication.
           Le nom gravé au pied est celui de l'accusé que le Bailli citait à
           comparaître — gratté par autre chose que le temps. */
        id: "pied-grand-gibet",
        illustration: "assets/scene_colline_pied_grand_gibet_b.png",
        label: "Le pied du grand gibet",
        approche:
          "Tu quittes la ligne des potences ordinaires pour celle qui les " +
          "dépasse toutes. De près, elle est absurde : trois fois trop haute " +
          "pour un homme, et sa corde est neuve.",
        examen:
          "Au pied du mât, dans le bois, un nom a été gravé profond, à la " +
          "gouge, par quelqu\u2019un qui prenait son temps. Il est illisible — " +
          "pas effacé par la pluie : GRATTÉ, en travers, par quelque chose " +
          "qui a mordu le bois plus fort que l\u2019outil. Dessous, une date " +
          "est restée entière. Elle est vieille de trente ans.",
        decouverte: "d.nom_gratte",
      },
      {
        id: "corbeaux-compte",
        poseEtat: "hante",
        corbeaux: true,
        label: "Les corbeaux, sur la traverse",
        illustration: "assets/monstre_corbeaux_du_compte_b.png",
        approche:
          "Ils sont sur la traverse du grand gibet, immobiles, et ils ne " +
          "bougent pas quand tu approches — ce qui n'est pas un comportement " +
          "d'oiseau. Aucun ne te regarde. Ils regardent la corde.",
        // ⚠️ Pas de référence au hameau ici (rapport IA externe 8/08) : ce
        // point se joue souvent AVANT toute visite du village — comparer
        // « aux toits du hameau » donnait au héros une connaissance du futur.
        examen:
          "Ils ne mangent pas. Il n'y a rien à manger ici depuis longtemps, " +
          "et leurs becs sont propres. Ils attendent, et ils sont exactement " +
          "assez nombreux pour ce qu'ils attendent. La même immobilité que " +
          "des sentinelles payées d'avance, la même façon d'être tournés " +
          "du même côté — comme des choses qu'on a postées là. Ils comptent " +
          "quelque chose qui te concerne, et le compte n'a pas l'air fini.",
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
        // « HANTÉ · source : avoir vu quelque chose (Gibet Vide, Corbeaux…) ».
        poseEtat: "hante",
        fait: "fait-gibet",
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
        illustration: "assets/scene_landes_poteau_pendu_c.png",
        label: "Le poteau isolé, à gauche",
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
    illustration: "assets/scene_colline_gibets_2_a.png",
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
        nature: "physique",
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
        nature: "surnaturel",
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
        nature: "exploration",
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
        nature: "social",
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
        nature: "physique",
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
        tags: ["citable"],
        label: "Passer sans un mot",
        passive: {
          consequence:
            "Tu passes. Le Bailli ne te rappelle pas — il note. Tu l'entends " +
            "murmurer ton signalement à la corde, qui grince en l'écrivant. " +
            "Refuser le jugement, ici, c'est un verdict aussi. Il t'attendra " +
            "au retour : les Landes tournent en rond.",
        },
      },
      {
        /* BEAT FINAL RÉÉCRIT (refonte du lore 6/08, §7). Le Bailli n'était
           pas le tyran des Landes : il a bâti le grand gibet comme un
           TRIBUNAL, pour l'accusé qui n'est jamais venu, et il s'est appliqué
           sa propre loi pour avoir refusé de condamner sa fille. Sa Fixation,
           ce n'est pas la corde : c'est l'attente. Deux phrases suffisent —
           il dit la vérité, il n'excuse rien, et le joueur comprend d'un coup
           qu'il est victime ET complice. */
        id: "pendu-le-trois-cent-unieme",
        label: "Lui demander combien il en a signé",
        decouverte: "d.bailli_condamne",
        passive: {
          consequence:
            "La corde s'immobilise. Pour la première fois depuis que tu es " +
            "là, il ne joue plus au juge. « J'ai signé trois cents noms. » " +
            "Un temps très long, à hauteur de gibet. « Le trois cent " +
            "unième était le sien. C'est celui-là qui m'a paru injuste. » " +
            "Puis, plus bas, comme un point de procédure : « Alors j'ai " +
            "inscrit le mien en dessous. »",
        },
      },
    ],
    jailerLine: "Il attend toujours son accusé. Trente ans qu'il l'attend. Voilà ce que ça donne, la rigueur.",
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
        illustration: "assets/scene_champ_les_rangees_v2_a.png",
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
        // Ouvre la variante du Fossoyeur : il ne parle du trou qu'à qui l'a vu.
        decouverte: "d.emplacement_vide",
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
  /* ═══ LE FOSSOYEUR — variante « le trou dans la rangée » ════════════════
     Refonte du lore 6/08, §6. Condition : avoir examiné l'emplacement vide de
     la rangée. Il grave les écriteaux à l'avance en comptant les corbeaux, et
     il a retiré un poteau sans savoir pourquoi — c'est le troisième témoin,
     et le plus troublant : il n'a rien oublié, on lui a retiré la raison. */
  {
    id: "fossoyeur-trou-1",
    remplace: { scene: "champ-des-fixes-2", si: { has: "d.emplacement_vide" } },
    illustration: "assets/monstre_fossoyeur_trou_1_c.png",
    chainNext: "fossoyeur-trou-2",
    narration: [
      "Il taille un écriteau sur ses genoux, au bout d\u2019une rangée. Le nom " +
        "qu\u2019il grave n\u2019a pas encore de date.",
      "« Je grave à l\u2019avance ceux dont c\u2019est sûr. Ça fait gagner du " +
        "temps le jour venu. » Le couteau ne s\u2019arrête pas. « Comment je " +
        "sais ? Je regarde les toits. Six corbeaux sur la même maison, je " +
        "taille. Je me trompe jamais. »",
    ],
    choices: [
      {
        /* Branchement du TROUPEAU (6/08) : il connaît les cinq noms.
           Il ne les donne pas. */
        id: "fossoyeur-cinq-marques",
        label: "Parler des marques d\u2019oreille",
        requiresDecouverte: "d.troupeau_compte",
        passive: {
          consequence:
            "« Cinq marques ? » Le couteau s\u2019arrête. « Fais voir. » Tu " +
            "dessines les entailles dans la poussière, de mémoire. Il les " +
            "regarde longtemps, et à la façon dont ses lèvres bougent sans " +
            "bruit, tu comprends qu\u2019il est en train de mettre un nom " +
            "sur chacune. Il efface la poussière du plat de la main. « Joli " +
            "troupeau », dit-il. C\u2019est tout ce que tu en tireras.",
        },
      },
      {
        id: "fossoyeur-poteau-manque",
        label: "« Il manque un poteau, là-bas. »",
        passive: {
          consequence:
            "Le couteau s\u2019arrête net. Il ne lève pas la tête. Dans une " +
            "rangée de quatre-vingts poteaux, il a su immédiatement duquel " +
            "tu parlais.",
        },
      },
      {
        id: "fossoyeur-qui-decide",
        label: "« Qui décide ? »",
        passive: {
          consequence:
            "« Personne décide. » Il souffle sur la gravure pour en chasser " +
            "la poussière de bois. « On constate. » Et il reprend, comme si " +
            "la question ne s\u2019était pas posée.",
        },
      },
    ],
    jailerLine: "Il grave les noms avant les morts. Chez moi, c\u2019est la même chose. La différence, c\u2019est que je ne me trompe pas non plus.",
  },
  {
    id: "fossoyeur-trou-2",
    illustration: "assets/scene_champ_poteau_retire_c.png",
    chainNext: "fossoyeur-trou-3",
    decouverte: "d.poteau_retire",
    narration: [
      "« Y avait un poteau là. On l\u2019a enlevé. »",
      "Tu attends.",
      "« Je l\u2019ai enlevé moi-même. Un matin. Je m\u2019en souviens très bien : " +
        "la terre, le poids, le trou après. »",
      "Un temps beaucoup trop long.",
      "« Et je saurais pas te dire pourquoi. C\u2019est la seule chose de ma " +
        "vie dont je sais pas la raison. »",
    ],
    choices: [
      {
        id: "fossoyeur-insister",
        nature: "social",
        label: "« Essayez de vous rappeler. »",
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu ne lui demandes pas de se souvenir : tu lui demandes qui était là ce matin-là. Il répond sans réfléchir — « tout le monde » — puis s\u2019entend le dire, et pose son couteau. Le hameau entier a retiré ce poteau. Il n\u2019était que la paire de bras.",
            "Il ferme les yeux, sincèrement. Il essaie. « Y avait du gel. J\u2019avais les mains qui collaient au bois. » Puis plus rien, et sa voix se creuse : « Après ça, c\u2019est comme une page arrachée. Et pourtant j\u2019ai tout le reste. »",
            "« J\u2019ai essayé. » Il reprend son couteau. « Pendant des années. On arrête, à un moment. » Le copeau qui tombe est plus épais que les autres.",
            "1 naturel. Il te regarde longuement. « Toi aussi tu vas me demander de compter les corbeaux sur MA maison ? » Il ramasse ses outils et s\u2019en va au bout de la rangée. ♦ −2"
          ),
        },
        soupcon: 1,
      },
      {
        id: "fossoyeur-ne-pas-insister",
        label: "Le laisser tranquille",
        passive: {
          consequence:
            "Tu ne dis rien. Il grave. Au bout d\u2019un moment, sans qu\u2019on " +
            "lui demande : « Elle était petite. » Puis il se tait pour de " +
            "bon, et tu comprends qu\u2019il vient de te donner tout ce " +
            "qu\u2019il a.",
        },
      },
    ],
    jailerLine: "Il se souvient du poids, du gel, du trou. Pas de la raison. Quelqu\u2019un a fait le tri à sa place.",
  },
  {
    id: "fossoyeur-trou-3",
    illustration: "assets/monstre_fossoyeur_trou_3_a.png",
    narration: [
      "Il pose l\u2019écriteau fini contre sa jambe, face contre terre, pour " +
        "qu\u2019on n\u2019en lise pas le nom.",
      "« Va-t\u2019en. Reviens quand t\u2019auras une date à me donner. »",
    ],
    choices: [
      { id: "fossoyeur-partir", label: "Le laisser à ses rangées" },
      {
        id: "fossoyeur-demander-nom",
        label: "Demander le nom sur l\u2019écriteau",
        soupcon: 1,
        passive: {
          consequence:
            "Il retourne la planchette contre lui, d\u2019un geste de joueur " +
            "qui cache son jeu. « Non. » Et, presque doucement : « Si je te " +
            "le dis, tu vas le regarder autrement quand tu le croiseras. Il " +
            "a encore quelques jours à être regardé normalement. »",
        },
      },
    ],
    jailerLine: "Une date. C\u2019est tout ce qu\u2019il attend de toi. Et tu finiras par lui en donner une — la tienne.",
  },
  {
    id: "champ-des-fixes-2",
    illustration: "assets/monstre_fossoyeur_poteaux_a.png",
    narration: [
      "Entre les rangs, un vieil homme redresse un poteau qui penche, avec " +
        "des gestes de jardinier. Il t'a vu venir de loin — les vivants " +
        "font un bruit particulier, ici. Il ne s'interrompt pas : il " +
        "t'attend au travail, comme on attend un outil. « La Colline, " +
        "c'est la vitrine », dit-il sans qu'on demande. « Ici, c'est " +
        "l'arrière-boutique. »",
    ],
    choices: [
      {
        /* Branchement du TROUPEAU (6/08) : il connaît les cinq noms.
           Il ne les donne pas. */
        id: "fossoyeur-cinq-marques",
        label: "Parler des marques d\u2019oreille",
        requiresDecouverte: "d.troupeau_compte",
        passive: {
          consequence:
            "« Cinq marques ? » Le couteau s\u2019arrête. « Fais voir. » Tu " +
            "dessines les entailles dans la poussière, de mémoire. Il les " +
            "regarde longtemps, et à la façon dont ses lèvres bougent sans " +
            "bruit, tu comprends qu\u2019il est en train de mettre un nom " +
            "sur chacune. Il efface la poussière du plat de la main. « Joli " +
            "troupeau », dit-il. C\u2019est tout ce que tu en tireras.",
        },
      },
      {
        id: "aider-fossoyeur",
        nature: "social",
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
      {
        id: "carnet",
        label: "Déchiffrer le carnet",
        locked: { stat: "RUSE", min: 4 },
        passive: {
          consequence:
            "Les pattes de mouche du Fossoyeur cèdent à qui sait lire à " +
            "l'envers : des noms, des dates, des paquets de cinq. Et un nom " +
            "écrit deux fois, à des années d'écart — même main, même corde. " +
            "On ne pend pas deux fois. Sauf ici, apparemment.",
        },
      },
      {
        /* LA CONFIDENCE DES FIXÉS (spec §6) — la face AMBIGUË de l'état FIXÉ :
           socialement catastrophique, mais ceux qui portent la même croix
           cessent de se taire. Ce choix n'existe pour personne d'autre. */
        id: "confidence-fixes",
        label: "Écouter ce qu'on te dit maintenant",
        requiresEtat: "fixe",
        grantsSavoir: "savoir_rangs",
        passive: {
          consequence:
            "Le Fossoyeur ne te parle pas comme aux autres. Il parle comme " +
            "on parle à quelqu'un qui a déjà son poteau quelque part. " +
            "« Le troisième rang, on le plante jamais. C'est pas de la " +
            "place perdue : c'est de la place gardée. » Il ne dit pas pour qui.",
        },
      },
      {
        /* UN FIXÉ (§7) — il ne peut se dire qu'entre condamnés, et c'est la
           phrase qui contient tout le personnage : il ne vient pas pour les
           victimes, il vient pour ceux qui osent. */
        id: "fixe-il-vient-pour-eux",
        label: "Demander ce qui vient, la nuit",
        requiresEtat: "fixe",
        decouverte: "d.temoin_entendu",
        passive: {
          consequence:
            "Un homme au bout du rang redresse la tête. Il porte la même " +
            "croix de craie que toi. « Tu l'as vu ? » Il ne baisse même pas " +
            "la voix — on ne se cache plus, quand on est déjà compté. « Il " +
            "vient pas pour nous. Il vient pour eux. Pour qu'ils osent. »",
        },
      },
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
    illustration: "assets/monstre_pendu_mal_fixe_v2_c.png",
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
        nature: "physique",
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
        // Esquiver demande des appuis. Retiré à qui boite.
        id: "esquiver-corde",
        nature: "physique",
        tags: ["fuite"],
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
        nature: "physique",
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
        nature: "exploration",
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
    illustration: "assets/scene_hameau_entree_2_v2_a.png",
    chainNext: "hameau-entree-3",
    narration: [
      "La première maison est à dix pas. Sur sa porte, un signe à la craie — " +
        "une croix, simple, tracée à hauteur d'œil.",
      "La poudre blanche est encore sur le seuil. Ça date de ce matin.",
    ],
    pointsInteret: [
      {
        /* LA TOURNÉE (§7) : « une entaille au-dessus de chaque porte, même
           hauteur, même outil qui n'est pas un outil. » Le joueur peut la
           voir dès sa première entrée et n'y comprendre rien pendant trois
           runs — c'est le but. */
        id: "linteaux",
        illustration: "assets/scene_hameau_linteaux_v2_c.png",
        label: "Le linteau de la porte",
        approche:
          "Tu passes devant une porte, puis une autre, et quelque chose " +
          "accroche ton regard sans que tu saches quoi. Tu reviens sur tes " +
          "pas et tu lèves la tête.",
        examen:
          "Au-dessus du linteau, une entaille dans le bois. Courte, " +
          "profonde, un peu de biais. Tu regardes la porte suivante : la " +
          "même, à la même hauteur. Et la suivante. Ce n\u2019est pas une " +
          "marque de charpentier — le bord est écrasé, pas coupé. Rien de " +
          "ce que tu connais ne laisse cette trace-là.",
        decouverte: "d.linteaux_entailles",
      },
      {
        /* LA TOURNÉE (§7) : les combles sont cloués de l'intérieur DANS TOUT
           le hameau, les rez-de-chaussée non. On ne se barricade pas contre
           ce qui vient par la rue. */
        id: "fenetres-clouees",
        illustration: "assets/scene_hameau_combles_cloues_v2_a.png",
        label: "Les fenêtres des combles",
        approche:
          "Tu recules de trois pas pour embrasser la façade entière, comme " +
          "on prend du recul devant un mot mal orthographié.",
        examen:
          "Les fenêtres du haut sont clouées. Pas fermées : CLOUÉES, de " +
          "l\u2019intérieur, planches en travers. Celles du bas ne le sont " +
          "pas — volets simples, loquets ordinaires, certains même " +
          "entrouverts. Tout le hameau est ainsi. Personne, ici, ne se " +
          "protège de ce qui vient par la rue.",
        decouverte: "d.combles_cloues",
      },
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
      {
        id: "gamin-sur-le-muret",
        label: "Le gamin, en haut du muret",
        leadsTo: "gamin-murets-1",
        illustration: "assets/monstre_gamin_murets_a.png",
        approche:
          "Un enfant est assis sur la crête d'un muret, les pieds dans le " +
          "vide côté lande. Il ne joue à rien. Il regarde le sud comme les " +
          "adultes d'ici regardent le sud, et il le fait mieux qu'eux.",
        examen:
          "Il te laisse arriver jusqu'au pied du muret sans bouger. De près, " +
          "ses genoux sont râpés partout pareil — quelqu'un qui court sur la " +
          "pierre, pas sur les chemins. Il attend que tu parles le premier.",
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
  /* ═══ LA FEMME AU SEUIL — variante « celle qui demande à savoir » ═══════
     Refonte du lore 6/08, §6. Condition : savoir la Fille VIVANTE (donc être
     allé au Moulin). C'est le quatrième témoin, et le seul qui DEMANDE — les
     trois autres racontent sans savoir ce qu'ils racontent.

     Elle avait huit ans à la pendaison, quarante ans de silence, et deux amis
     morts en jurant qu'ils n'avaient rien vu. Le village n'a pas menti : il a
     oublié ensemble, et elle est la preuve que quelqu'un n'a pas pu.

     Elle ne dénoncera jamais (−1 Soupçon) : c'est le seul allié réel du
     hameau, et il ne s'obtient qu'au bout de l'enquête. */
  {
    id: "femme-savoir-1",
    remplace: { scene: "femme-seuil-1", si: { has: "d.fille_vivante" } },
    illustration: "assets/monstre_femme_seuil_1_v3_a.png",
    chainNext: "femme-savoir-2",
    narration: [
      "Elle est à sa place, le regard au sud. Mais quand tu passes à sa " +
        "hauteur, sa main t\u2019attrape la manche.",
      "Elle ne t\u2019a jamais touché. Personne ici ne touche personne.",
    ],
    choices: [
      { id: "femme-savoir-ecouter", label: "La laisser parler" },
      {
        id: "femme-savoir-degager",
        label: "Se dégager",
        passive: {
          consequence:
            "Tu retires ton bras, doucement. Elle ne lâche pas tout de " +
            "suite : ses doigts restent une seconde de trop sur le tissu, et " +
            "quand ils s\u2019ouvrent, c\u2019est comme si on posait quelque " +
            "chose de lourd.",
        },
      },
    ],
    jailerLine: "Quarante ans sans toucher personne, et c\u2019est toi qu\u2019elle attrape. Tu dois avoir une tête à écouter.",
  },
  {
    id: "femme-savoir-2",
    illustration: "assets/monstre_femme_seuil_2_c.png",
    chainNext: "femme-savoir-3",
    narration: [
      "« Elle est encore là ? À l\u2019ouest. La jeune. »",
      "Ses yeux cherchent les tiens et n\u2019en sortent plus. « Dis-le-moi. " +
        "Dis-le juste une fois. »",
    ],
    choices: [
      {
        id: "femme-savoir-confirmer",
        tags: ["citable"],
        label: "« Elle est là. »",
        decouverte: "d.temoin_oculaire",
        soupcon: -1,
        passive: {
          consequence:
            "Elle ferme les yeux. Tout son corps lâche d\u2019un coup, comme " +
            "une corde qu\u2019on détend.",
        },
      },
      {
        id: "femme-savoir-nier",
        nature: "social",
        label: "« Je ne sais pas de qui vous parlez. »",
        risky: {
          stat: "RUSE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu mens si bien que tu t\u2019en veux. Elle te croit, hoche la tête, et te remercie — parce que dans ce village quelqu\u2019un qui ne sait rien est quelqu\u2019un qui ne risque rien, et elle en est arrivée à protéger les gens de leur propre savoir.",
            "Tu tiens le mensonge. Elle relâche ta manche et regarde ailleurs. « Bien sûr. Bien sûr que non. » Le pire, c\u2019est qu\u2019elle a l\u2019air soulagée pour toi.",
            "Ta phrase sonne creux, et vous l\u2019entendez tous les deux. Elle sourit très légèrement, sans joie : « Oui. C\u2019est ce qu\u2019on répond. » Et elle te lâche.",
            "1 naturel. « Ne me fais pas ça. » Sa voix monte — la seule voix qui monte de tout le hameau — et trois volets s\u2019entrouvrent dans la rue. ♦ −2"
          ),
        },
        soupcon: 1,
      },
    ],
    jailerLine: "Quarante ans à ne pas oser poser la question, et elle la pose à un étranger de passage.",
  },
  {
    id: "femme-savoir-3",
    illustration: "assets/monstre_femme_seuil_3_v2_a.png",
    chainNext: "hameau-entree-3",
    narration: [
      "« Quarante ans que je le vois et que je le dis pas. » Elle rit — un " +
        "son épouvantable. « J\u2019avais huit ans quand ils l\u2019ont pendue. " +
        "On était trois enfants sur le muret. Les deux autres sont morts " +
        "vieux en disant qu\u2019ils avaient rien vu. »",
      "« J\u2019ai attendu quarante ans que quelqu\u2019un me dise que " +
        "j\u2019étais pas folle. »",
      "Elle te lâche et reprend sa position, face au sud. De la rue, rien " +
        "n\u2019a bougé.",
      "« Va-t\u2019en maintenant. Et redis-le à personne. Moi je peux plus " +
        "partir : j\u2019ai plus l\u2019âge, et j\u2019ai plus le courage. Mais " +
        "toi tu peux encore. Alors pars avant qu\u2019ils te comptent. »",
    ],
    choices: [
      { id: "femme-savoir-partir", label: "Redescendre la rue" },
      {
        id: "femme-savoir-promettre",
        label: "Promettre de se taire",
        passive: {
          consequence:
            "Tu le promets. Elle ne répond pas — elle a repris sa faction, " +
            "le menton vers le sud, et de la rue on ne voit qu\u2019une vieille " +
            "femme qui regarde la route. C\u2019est exactement ce qu\u2019elle " +
            "fait depuis quarante ans.",
        },
      },
    ],
    jailerLine: "Trois enfants sur un muret. Deux sont morts en jurant n\u2019avoir rien vu. Le silence, chez vous, se transmet mieux que les noms.",
  },
  {
    /* LA FEMME AU SEUIL — rencontre ÉTALON des scripts (Hameau · commune).
       Ouverte depuis le seuil du hameau, elle rejoint ensuite l'accueil du
       jour (slot `hameau-entree-3`, résolu au tirage) : une rencontre ne fait
       jamais dérailler la séquence garantie. */
    id: "femme-seuil-1",
    illustration: "assets/monstre_femme_seuil_1_v3_a.png",
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
        nature: "social",
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
        nature: "social",
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
        nature: "social",
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
        nature: "social",
        label: "« Moi aussi, j'entends. »",
        requiresSavoir: "savoir_reflet",
        risky: {
          stat: "EMPATHIE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tu le dis simplement, et tu ajoutes le détail qui ne s'invente pas : le reflet en retard. Elle ferme les yeux. Quand elle les rouvre, elle ne te regarde plus comme un étranger qui descend — elle te regarde comme on regarde quelqu'un de la famille qu'on n'attendait plus. Elle te donne la mèche, le nom, et une chose que personne n'a offerte à personne ici depuis des années : sa porte, ouverte, si tu remontes.",
            "Elle te laisse finir, sans reculer. « Je sais », dit-elle. « Ta figure le dit depuis le début. » Elle te met la mèche dans la main, referme tes doigts, et pour la première fois quelqu'un du hameau te touche sans hésiter.",
            "Tu le dis, et elle recule. Pas de dégoût : de la panique — pour toi. « Ne le dis à personne d'autre. » Elle regarde à droite, à gauche, les volets. « À personne, tu m'entends. » Elle rentre, et tu restes là, dans la rue, avec un aveu qui traîne dans l'air.",
            "1 naturel. Tu le dis trop fort, ou pas assez seul. Un volet claque quelque part. Elle a pâli — pas de ce que tu es : de ce que ça fait de toi, ici. « Va-t'en. Maintenant. » ♦ −2"
          ),
        },
        grantsLoot: "meche-nouee",
      },
    ],
    jailerLine: "Une mèche de cheveux comme monnaie. Tu vois, même ici, tout le monde comprend le principe du pacte.",
  },
  /* ── LE GAMIN DES MURETS — premier compagnon temporaire (retour 6/08) ──
     Ouvert par le point d'intérêt de la ruelle du Hameau, donc entièrement
     refusable : il suffit de ne pas regarder le muret. Rejoint la séquence
     d'entrée par `chainNext`, comme la Femme au Seuil — une rencontre ne fait
     jamais dérailler une séquence garantie.

     Les trois questions de Patrick trouvent leur réponse DANS LA BOUCHE du
     gamin, jamais dans l'interface : jusqu'où (deux lieux, il le dit), quel
     bénéfice (il connaît les raccourcis), et ce que ça coûte (le hameau te
     voit partir avec un des siens). Voir l'état ACCOMPAGNÉ dans lib/etats.ts. */
  {
    id: "gamin-murets-1",
    illustration: "assets/monstre_gamin_murets_a.png",
    narration: [
      "Il aligne des cailloux sur le muret, par taille. Il ne se cache pas de " +
        "toi : c\u2019est le premier habitant qui ne se méfie pas. « T\u2019es le " +
        "nouveau. T\u2019as combien de corbeaux ? »",
      "Il n\u2019attend pas la réponse, et compte sur ses doigts. « Trois avant " +
        "toi cette année. Deux sont ressortis. »",
      "Il désigne la lande du menton, la crête des murets qui court vers le " +
        "sud, basse et sèche. « Y a le chemin, et y a les murets. Le chemin, " +
        "il fait le tour de tout. Les murets, non. »",
    ],
    choices: [
      {
        id: "gamin-demander-guide",
        nature: "social",
        tags: ["citable"],
        label: "Lui demander de te guider",
        risky: {
          stat: "EMPATHIE",
          threshold: 10,
          outcomes: outcomes(
            "20 naturel. Il saute du muret avant même que tu finisses ta phrase. « Deux murets. Après c\u2019est plus chez moi. » Il te tend la main pour que tu l\u2019aides à passer un trou dans la pierre — et c\u2019est TOI qu\u2019il fait passer devant, à l\u2019endroit précis où le mur tient encore.",
            "Il te jauge un moment, puis hausse une épaule. « Deux murets. Après, c\u2019est plus chez moi. » Il descend, se met trois pas devant, et attend que tu suives — pas l\u2019inverse.",
            "Il secoue la tête. « Ma mère dit que ceux qui entrent, faut pas les suivre dehors. » Il reste sur son muret. Mais il ne s\u2019en va pas non plus, et il te regarde partir longtemps.",
            "1 naturel. « Toi t\u2019as déjà un poteau quelque part. » Il le dit sans méchanceté, comme on annonce la pluie, et il s\u2019en va par l\u2019autre côté du muret. ♦ −2"
          ),
        },
        // Il ne suit que celui qu'il a décidé de suivre — d'où « si réussite ».
        poseEtatSiReussite: "accompagne",
        poseEtatDuree: 2, // « Deux murets. Après c'est plus chez moi. »
        // Emmener un enfant du hameau dans la lande, ça se raconte le soir.
        soupcon: 1,
      },
      {
        id: "gamin-questionner",
        label: "Lui demander qui est ressorti",
        grantsSavoir: "savoir_palissade_retient",
        passive: {
          consequence:
            "« Le grand avec la lanterne. Et une dame, mais elle a pas pris " +
            "le sud. » Il replie deux doigts. « L\u2019autre, il est allé " +
            "jusqu\u2019à la palissade. Il a fait demi-tour. Il dit que c\u2019est " +
            "pas fermé, c\u2019est juste que ça retient. »",
        },
      },
      {
        id: "gamin-laisser",
        label: "Le laisser sur son mur",
        passive: {
          consequence:
            "Tu redescends la ruelle. Il ne te rappelle pas. Beaucoup plus " +
            "tard, quelque part au sud, tu longeras un muret bas qui va " +
            "exactement où tu voulais aller, et tu penseras à lui.",
        },
      },
    ],
    chainNext: "gamin-murets-2",
    jailerLine: "Celui-là compte mieux que mes greffiers. Il compte les sorties.",
  },
  {
    id: "gamin-murets-2",
    illustration: "assets/scene_murets_vers_sud_c.png",
    chainNext: "gamin-murets-3",
    narration: [
      "Le muret repart vers le sud, à hauteur de hanche, en pierre sèche " +
        "posée sans mortier. On voit à l\u2019usure du sommet que quelqu\u2019un y " +
        "marche tous les jours, et que ce quelqu\u2019un est petit.",
    ],
    choices: [
      {
        id: "gamin-partir-ensemble",
        // ⚠️ Ce choix n'existe QUE si le gamin a accepté : c'est l'état posé
        // au beat précédent qui l'ouvre (voir requiresEtat, filtré en amont).
        label: "Partir par les murets",
        requiresEtat: "accompagne",
        passive: {
          consequence:
            "Il passe devant sans se retourner, du pas de quelqu\u2019un qui " +
            "n\u2019a jamais eu besoin de regarder ses pieds ici. Derrière " +
            "vous, la ruelle se referme sur ses volets. Personne ne vous " +
            "arrête. Plusieurs personnes vous regardent partir.",
        },
      },
      {
        id: "gamin-reprendre-la-rue",
        label: "Reprendre la ruelle",
        passive: {
          consequence:
            "Tu laisses le muret filer vers le sud sans toi. La ruelle, " +
            "elle, fait le tour de tout — c\u2019est bien ce qu\u2019il avait dit.",
        },
      },
    ],
    jailerLine:
      "Deux murets. Il a dit deux murets, et il s’y tiendra. C’est bien la seule chose qu’on tienne, par ici.",
  },
  /* ── LE GAMIN, beats 3 et 4 (refonte du lore 6/08) ────────────────────
     Le gamin est « le seul qui n'a pas appris à ne pas voir » : c'est par lui
     que la Fille entre dans le jeu, et c'est la PORTE D'ENTRÉE de tout l'arc
     (aucune condition). Il ne sait pas ce qu'il raconte — il raconte juste ce
     qui lui est arrivé, et personne ne le croit. Le caillou est la seule
     preuve matérielle de l'affaire, et il ne prouve rien du tout. */
  {
    id: "gamin-murets-3",
    illustration: "assets/monstre_gamin_caillou_c.png",
    chainNext: "gamin-murets-4",
    narration: [
      "« Moi j\u2019en ai zéro », dit-il en revenant à ses cailloux. « Ma mère " +
        "en a deux. Elle sait pas. Faut pas lui dire, elle a peur pour rien. »",
      "Il fouille dans sa poche et te tend une pierre plate, grise, polie " +
        "comme un galet de rivière. Il n\u2019y a pas de rivière dans les Landes. " +
        "« C\u2019est la dame de l\u2019ouest qui me l\u2019a donnée. »",
    ],
    choices: [
      {
        id: "gamin-quelle-dame",
        label: "« Quelle dame ? »",
        decouverte: "d.fille_apercue",
        grantsLoot: "caillou-gamin",
        passive: {
          consequence:
            "« Ben, la dame. » Il hausse les épaules, comme si tu demandais " +
            "de quelle couleur est le ciel. « Elle est jeune. Elle a un " +
            "châle. Elle marche du côté du moulin, là où l\u2019herbe est " +
            "couchée. » Il repose un caillou dans la rangée, très exactement " +
            "à sa place.",
        },
      },
      {
        id: "gamin-ou-vue",
        nature: "social",
        label: "« Où l\u2019as-tu vue ? »",
        risky: {
          stat: "INSTINCT",
          threshold: 10,
          outcomes: outcomes(
            "20 naturel. Tu ne demandes pas où : tu demandes QUAND. Il réfléchit vraiment, pour la première fois. « Le matin, jamais. Le soir, souvent. Et une fois dans le brouillard, très près. » Il te regarde. « Elle m\u2019a dit de rentrer. J\u2019ai rentré. »",
            "Il pointe l\u2019ouest du menton, au-delà des murets, là où la crête remonte vers une masse noire sans ailes. « Par là. Elle va jamais plus loin que le moulin, et jamais du côté des potences. Moi non plus j\u2019y vais pas. »",
            "« Partout », dit-il, et tu comprends qu\u2019il ne ment pas — il n\u2019a simplement jamais eu besoin de retenir où, parce que personne ne le lui a jamais demandé sérieusement.",
            "1 naturel. Il te regarde autrement, d\u2019un coup. « Pourquoi tu demandes ça, toi ? » Il ramasse ses cailloux dans le pan de sa chemise et s\u2019en va, et tu entends très bien qu\u2019il en parlera à quelqu\u2019un. ♦ −2"
          ),
        },
        decouverte: "d.fille_apercue",
        grantsLoot: "caillou-gamin",
      },
      {
        id: "gamin-ne-pas-relever",
        label: "Ne pas relever",
        passive: {
          consequence:
            "Tu refermes la main sur la pierre sans rien demander. Elle est " +
            "tiède, ce qui n\u2019a aucun sens : elle sort d\u2019une poche " +
            "d\u2019enfant, dehors, dans un crépuscule qui ne se réchauffe " +
            "jamais. Il est déjà retourné à sa rangée.",
        },
        decouverte: "d.fille_apercue",
        grantsLoot: "caillou-gamin",
      },
    ],
    jailerLine: "Un enfant, un caillou, et personne pour l\u2019écouter. C\u2019est ainsi que commencent la plupart des vérités.",
  },
  {
    id: "gamin-murets-4",
    illustration: "assets/monstre_gamin_depart_c.png",
    chainNext: "hameau-entree-3",
    narration: [
      "« Ma mère dit que j\u2019invente. Le rebouteux dit que j\u2019invente. Tout " +
        "le monde dit que j\u2019invente. » Il te regarde enfin, droit. « Mais " +
        "le caillou, il est vrai. Tu le tiens. »",
      "Il redescend du muret et ramasse ses pierres une par une, dans " +
        "l\u2019ordre. « Si tu la vois, dis-lui merci pour le caillou. " +
        "J\u2019ai oublié la dernière fois. »",
    ],
    choices: [
      {
        id: "gamin-promettre",
        label: "Le lui promettre",
        passive: {
          consequence:
            "Il hoche la tête, satisfait, et ne vérifie pas. À dix ans, on " +
            "croit encore qu\u2019une promesse et une chose faite sont la même " +
            "chose. Tu redescends la ruelle avec un caillou de rivière dans " +
            "la main, dans un pays qui n\u2019a pas de rivière.",
        },
      },
      {
        id: "gamin-rien-promettre",
        label: "Ne rien promettre",
        passive: {
          consequence:
            "Tu ne dis rien. Il ne t\u2019en veut pas : il range ses cailloux " +
            "et s\u2019éloigne le long du mur, du pas de quelqu\u2019un qui a " +
            "l\u2019habitude qu\u2019on ne réponde pas. Tu gardes la pierre quand " +
            "même.",
        },
      },
    ],
    jailerLine: "Il t\u2019a confié une commission. Note bien : c\u2019est la première fois que quelqu\u2019un, ici, attend quelque chose de toi.",
  },
  {
    id: "femme-seuil-3",
    illustration: "assets/monstre_femme_seuil_3_v2_a.png",
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
    illustration: "assets/monstre_hameau_entree_3_v2_a.png",
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
        nature: "social",
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
        nature: "social",
        label: "Passer sans t'arrêter",
        risky: {
          stat: "COURAGE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu marches droit sur eux sans changer d'allure. À trois pas, ils s'écartent — pas par peur : par une politesse ancienne qu'ils n'ont pas eu le temps de décider. Le vieux te suit des yeux, et tu sais que le Serment t'attend quand même. Mais tu as passé le barrage debout.",
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
  /* ——————————————————————————————————————————————————————————————————————
     LES ACCUEILS DU HAMEAU (6/08). Retour Patrick : « si à chaque run on
     retrouve toujours ces mêmes trois messieurs qui nous attendent, c'est
     redondant. »

     Le beat 3 de l'entrée devient un SLOT : `hameau-entree-3` (le barrage des
     trois hommes) n'est plus qu'un accueil parmi sept. Ce qui change, c'est la
     façon dont le village te reçoit dans la rue ; ce qui ne change pas, c'est
     que tout finit au muret, devant le vieux, pour le Serment (beat 4).
     La séquence garantie de la spec du 24/07 reste donc entière — le Serment
     n'est jamais contournable, il est seulement amené autrement.

     Règle d'écriture : le DERNIER paragraphe de chaque accueil doit orienter
     vers le muret, puisque le beat 4 s'ouvre là sans savoir ce qui a précédé.
     Aucune illustration dédiée pour l'instant : l'image de la ruelle (beat 2)
     reste à l'écran. Les 6 prompts sont dans data/images-a-produire.md.
     —————————————————————————————————————————————————————————————————————— */
  {
    id: "hameau-accueil-volet",
    illustration: "assets/scene_hameau_accueil_volet_c.png",
    chainNext: "hameau-entree-4",
    narration: [
      "La rue est vide. Pas déserte — vide : une porte qui bat encore, un " +
        "seau posé de travers, une flaque de lait qui n'a pas eu le temps de " +
        "sécher. Tout le monde vient de rentrer, et vite.",
      "Un volet s'entrouvre à ta gauche, de deux doigts. Une voix de femme, " +
        "basse, très rapide, aucun visage derrière : — « Ne touche pas les " +
        "portes marquées. Ne réponds pas si on t'appelle par ton nom. Et va " +
        "au muret, au bout, avant qu'on vienne te chercher. »",
      "Le volet ne se referme pas tout de suite. Elle attend quelque chose de " +
        "toi.",
    ],
    choices: [
      {
        id: "volet-pourquoi-aider",
        nature: "social",
        label: "Lui demander pourquoi elle t'aide",
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu ne demandes rien tout de suite : tu t'approches du volet et tu attends, à hauteur d'oreille, sans regarder à l'intérieur. Ça la décide. « Mon frère est descendu il y a deux ans. Personne ne l'a prévenu. » Un silence. « Voilà. Maintenant va. » Elle t'a donné plus qu'un conseil : elle t'a donné une raison de la croire.",
            "« Parce que ça ne coûte rien de parler à travers un volet », dit-elle. Puis, plus bas, comme si elle se corrigeait : « Et parce que ça coûte trop cher de se taire deux fois. » Le volet se ferme, cette fois.",
            "Tu poses la question trop fort. Le volet claque avant la fin de ta phrase, et tu entends la barre tomber derrière. Dans la rue, deux autres volets se ferment aussitôt — le tien a fait le tour du village en trois secondes.",
            "1 naturel. « Pourquoi vous m'aidez ? » Le silence derrière le bois dure trop longtemps. Puis : « Qui a dit que je t'aidais ? » Le volet se referme doucement, ce qui est pire qu'un claquement. ♦ −2"
          ),
        },
      },
      {
        id: "volet-faire-parler",
        nature: "social",
        label: "La faire parler encore",
        soupcon: 1,
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu ne poses aucune question — tu répètes ses trois consignes à voix haute, dans le désordre, en te trompant exprès sur la dernière. Elle corrige. Puis elle explique pourquoi. Puis elle en ajoute une quatrième qu'elle n'avait pas prévu de donner : « Et ne dors pas dos à la fenêtre. »",
            "Tu prends l'air de ne pas comprendre, et elle recommence, plus lentement — en ajoutant les raisons cette fois, parce qu'expliquer va plus vite que répéter. Tu apprends deux choses qu'elle ne voulait pas dire.",
            "Ta ruse est trop visible. « Tu me fais parler », constate-t-elle, sans colère, presque avec pitié. « C'est exactement ce que fait l'autre. » Le volet se ferme, et tu ne sauras pas de quel autre elle parlait.",
            "1 naturel. Tu la relances une fois de trop. Elle se tait net, puis appelle vers l'intérieur, assez fort pour être entendue de la rue : « Il pose des questions ! » Trois volets s'ouvrent d'un coup. ♦ −2"
          ),
        },
      },
      {
        id: "volet-obeir",
        label: "Obéir sans un mot",
        soupcon: -1,
        passive: {
          consequence:
            "Tu hoches la tête vers le volet — une fois, à peine — et tu " +
            "prends la rue vers le bout, sans toucher un mur, sans regarder " +
            "une porte. Derrière toi, le bois se referme sans bruit. Trois " +
            "maisons plus loin, un autre volet s'entrouvre puis se referme " +
            "aussitôt : on s'est passé le mot que tu obéissais.",
        },
      },
    ],
    jailerLine: "Elle t'a donné trois règles. Moi je t'en ai donné une seule, et tu la tiens déjà mal.",
  },
  {
    /* Conditionnel : ne sort qu'à partir de la 2e mort du compte — il faut
       avoir laissé des noms derrière soi pour que ce mur veuille dire quelque
       chose. Voir HAMEAU_ACCUEILS. */
    id: "hameau-accueil-mur",
    illustration: "assets/scene_hameau_accueil_mur_a.png",
    chainNext: "hameau-entree-4",
    narration: [
      "Personne dans la rue. Mais le pignon de la grange, en face, est " +
        "couvert de craie du sol jusqu'à hauteur d'homme : des noms, sur deux " +
        "colonnes serrées, écrits par plusieurs mains différentes.",
      "Chaque nom a une date à côté. Sauf les sept derniers : à la place de " +
        "la date, une croix.",
      "Un gamin est accroupi tout en bas. Il ajoute une ligne, se relève, te " +
        "voit, et s'éloigne très vite sans courir — ce qui est pire. Ce qu'il " +
        "vient d'écrire n'est pas un nom. C'est : « un qui descend ».",
    ],
    choices: [
      {
        id: "mur-lire",
        label: "Lire jusqu'au bout",
        grantsSavoir: "savoir_mur_ecrit",
        passive: {
          consequence:
            "Tu remontes les deux colonnes jusqu'en haut. Ce ne sont pas des " +
            "morts : les dates sont des dates de PASSAGE. Le hameau note qui " +
            "descend et quand. Et les sept croix du bas ne veulent pas dire " +
            "« mort » — elles veulent dire « n'est pas remonté ». " +
            "Ils ne comptent pas leurs pertes. Ils comptent les nôtres.",
        },
      },
      {
        id: "mur-effacee",
        nature: "exploration",
        label: "Chercher sous la craie effacée",
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu inclines la tête jusqu'à prendre la lumière rasante, et le mur te rend ce qu'on lui a repris : sous la couche fraîche, d'autres colonnes, plus anciennes, effacées à la paume. Des dizaines. Et une ligne, seule, en travers de toutes les autres, tracée si fort que la pierre l'a gardée : « CELUI QUI COMPTE EST DESCENDU AUSSI ».",
            "Sous la craie neuve, on devine les fantômes d'une liste plus vieille — effacée, pas nettoyée. Le mur sert depuis longtemps, et il a été vidé plusieurs fois. Quelqu'un tient ce registre depuis avant les gens qui l'écrivent aujourd'hui.",
            "Tu frottes pour voir dessous, et tu emportes la craie fraîche avec. Trois lignes récentes disparaissent sous ta paume. Derrière toi, très calme, une voix d'enfant : « Faut pas. » Il n'est pas parti si loin que ça.",
            "1 naturel. Tu grattes la couche du dessous, et la craie te reste sur les doigts, blanche, bien visible. Tu ne t'en apercevras qu'au muret, en tendant la main. ♦ −2"
          ),
        },
      },
      {
        id: "mur-effacer-ligne",
        nature: "social",
        label: "Effacer la ligne qui te concerne",
        soupcon: 2,
        risky: {
          stat: "COURAGE",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tu passes la manche sur la dernière ligne, lentement, jusqu'à ce qu'il n'en reste rien — et tu écris à la place, de la même craie, la date du jour. Sans nom. Le hameau saura que quelqu'un est passé. Il ne saura pas que c'est descendu.",
            "Tu effaces « un qui descend » d'un revers de manche. Le mur garde une trace pâle, mais la phrase n'y est plus. Ce n'est pas grand-chose — sauf que le gamin, lui, l'avait écrite, et qu'il te regardait faire.",
            "Ta manche accroche la ligne du dessus en même temps. Deux noms partent avec le tien. Effacer un nom, ici, ce n'est pas nier un passage : c'est nier quelqu'un, et cette faute-là se voit de loin.",
            "1 naturel. Tu effaces ta ligne. Le gamin, à dix pas, la réécrit de mémoire, plus grand, en te regardant. Puis il ajoute un mot devant. Tu ne le lis pas d'ici, et tu n'as plus envie de t'approcher. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Un mur de craie. Un registre de pauvres. Le mien est plus grand, et je n'efface jamais.",
  },
  {
    id: "hameau-accueil-enfant",
    illustration: "assets/scene_hameau_accueil_enfant_c.png",
    chainNext: "hameau-entree-4",
    narration: [
      "Ils ont envoyé un gosse. Huit ans peut-être, planté au milieu de la " +
        "rue, les mains dans le dos comme on lui a dit de les tenir. Aucun " +
        "adulte visible — et tous les volets entrouverts de deux doigts.",
      "Il récite. On entend les mots appris, dans l'ordre, avec les silences " +
        "qu'on lui a fait répéter : — « Est-ce que tu dors la nuit ? Est-ce " +
        "que tu as compté quelque chose aujourd'hui ? Est-ce qu'on t'a appelé " +
        "par ton nom depuis que tu es descendu ? »",
      "Il ne comprend pas ce qu'il demande. Les autres, si.",
    ],
    choices: [
      {
        id: "enfant-repondre-lui",
        nature: "social",
        label: "Répondre à l'enfant",
        risky: {
          stat: "EMPATHIE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu t'accroupis à sa hauteur et tu réponds pour de vrai, aux trois, sans rien arranger. Il t'écoute avec un sérieux terrible, puis il oublie sa leçon : « Moi non plus je dors pas. » Derrière les volets, personne ne dit rien — mais quand tu te relèves, deux d'entre eux se sont ouverts en grand.",
            "Tu réponds simplement, en le regardant lui. Il hoche la tête à chaque réponse comme s'il cochait, puis se retourne vers la maison la plus proche et crie : « Il a dit non ! » Le mot passe de porte en porte. Ce n'est pas un acquittement, mais ce n'est pas une condamnation.",
            "Tu réponds à l'enfant, gentiment — et tu oublies les vingt personnes qui écoutent. Ta deuxième réponse est trop longue, trop précise. Un adulte sort avant la fin et le tire par le bras à l'intérieur.",
            "1 naturel. Tu réponds « oui » à la deuxième question sans réfléchir. *Est-ce que tu as compté quelque chose aujourd'hui.* Le gamin répète ton oui à la cantonade, fier de sa mission. Le silence qui suit n'est pas celui d'avant. ♦ −2"
          ),
        },
      },
      {
        id: "enfant-repondre-volets",
        nature: "social",
        label: "Répondre aux volets",
        soupcon: 1,
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu ne baisses pas les yeux vers l'enfant : tu parles à la rue, fort, en tournant lentement sur toi-même, et tu réponds aux trois questions par trois autres. « Est-ce que VOUS dormez la nuit ? » Personne ne répond. Mais quand tu arrives au muret, le vieux t'attend en sachant déjà qu'il ne t'aura pas au bluff.",
            "Tu réponds par-dessus la tête du gamin, à voix haute, pour ceux qui écoutent. Tes phrases sont propres, calibrées, impossibles à retourner. Le gosse te regarde sans comprendre pourquoi tu ne lui parles pas à lui.",
            "Tu joues pour la galerie, et la galerie n'aime pas ça. « Il parle aux murs », dit une voix de femme, sans se cacher. Chez des gens qui ont peur d'être écoutés, parler aux murs n'est pas une image.",
            "1 naturel. Tu réponds à la rue au lieu de répondre à l'enfant — et l'enfant, vexé, ajoute la seule chose qu'on ne lui avait pas apprise : « Il regarde le sud tout le temps. » ♦ −2"
          ),
        },
      },
      {
        id: "enfant-ne-pas-repondre",
        label: "Ne pas répondre à un enfant",
        soupcon: 1,
        passive: {
          consequence:
            "Tu passes à côté de lui sans un mot. Il ne te suit pas, il ne " +
            "répète pas sa question : on lui a appris aussi ce qu'il fallait " +
            "faire dans ce cas-là. Il se tourne vers la maison la plus proche " +
            "et dit, très clairement : « Il a pas répondu. » " +
            "Un volet se ferme. Puis tous les autres, dans l'ordre de la rue, " +
            "jusqu'au bout — jusqu'au muret où quelqu'un t'attend déjà.",
        },
      },
    ],
    jailerLine: "Ils envoient un enfant en éclaireur. Je t'ai envoyé, toi. On fait le même métier, eux et moi.",
  },
  {
    id: "hameau-accueil-table",
    illustration: "assets/scene_hameau_accueil_table_a.png",
    chainNext: "hameau-entree-4",
    narration: [
      "Une table au milieu de la rue. Une seule. Un tabouret, un bol, une " +
        "cuillère posée bien droite — et le tout tourné vers le côté par où " +
        "tu arrives, comme on dresse un couvert pour quelqu'un dont on " +
        "connaît l'heure.",
      "Le bol fume encore. Il n'y a personne dehors, et pourtant on t'a " +
        "entendu venir de loin.",
      "Ce n'est pas de l'hospitalité. C'est un péage : ici, on mange avant de " +
        "savoir à quoi ça engage.",
    ],
    choices: [
      {
        id: "table-manger",
        label: "T'asseoir et manger",
        repondBesoin: "manger",
        soupcon: -1,
        passive: {
          consequence:
            "Tu t'assois. C'est de l'orge, du gras, du sel — c'est bon, et " +
            "c'est chaud, et ton corps te trahit en te disant à quel point tu " +
            "en avais besoin. À la troisième cuillère, des portes s'ouvrent " +
            "dans ton dos, sans hâte. Ils attendaient ça. " +
            "Quand tu reposes la cuillère, le vieux est déjà assis sur le " +
            "muret, au bout de la rue. Le Serment ne se demandera pas : il " +
            "a commencé au premier bol.",
        },
      },
      {
        id: "table-repousser",
        nature: "social",
        label: "Repousser le bol",
        soupcon: 1,
        risky: {
          stat: "COURAGE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu repousses le bol de deux doigts, sans le renverser, et tu restes debout à côté de la table — assez longtemps pour que ce soit un message et pas une fuite. Une porte s'ouvre. Le vieux sort, regarde le bol intact, et hoche la tête : « Bien. » Tu ne sauras jamais ce qui serait arrivé si tu avais mangé.",
            "Tu repousses le bol et tu passes. Ça se remarque — mais ça se respecte : chez des gens qui ont renoncé à tout, refuser quelque chose est encore un métier qu'ils comprennent.",
            "Tu repousses le bol un peu trop fort. Il tourne, il tient, mais la cuillère tombe et sonne sur la pierre. Le bruit fait le tour de la rue. Refuser, ici, doit se faire sans bruit — sinon c'est du mépris.",
            "1 naturel. Tu repousses le bol, il verse. La soupe coule entre les pavés, et personne ne sort la ramasser. Ils la laisseront là jusqu'à ce que tu repasses. ♦ −2"
          ),
        },
      },
      {
        id: "table-pain-debout",
        nature: "social",
        label: "Prendre le pain, debout",
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu prends le quignon posé à côté du bol, tu le casses en deux, tu en manges une moitié debout et tu laisses l'autre sur la table. Ni accepté, ni refusé : partagé. C'est exactement la faille de leur règle, et le vieux, au muret, mettra un moment à décider s'il doit t'en vouloir.",
            "Tu prends le pain sans t'asseoir, et tu continues en mâchant. Techniquement tu n'as pas mangé à leur table. Techniquement. Deux ou trois d'entre eux comprendront la nuance ; les autres retiendront juste que tu as pris.",
            "Tu emportes le pain debout, et la nuance t'échappe à toi aussi : dans une rue qui n'a pas mangé de blanc depuis deux hivers, prendre sans s'asseoir ne s'appelle pas de la prudence.",
            "1 naturel. Tu prends le pain. Une voix, derrière un volet, énonce le mot exact, sans passion : « Voleur. » Et le mot va plus vite que toi jusqu'au bout de la rue. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Un bol tiède contre trois promesses. Tu vois — je ne suis pas le seul à faire des pactes.",
  },
  {
    id: "hameau-accueil-cloche",
    illustration: "assets/scene_hameau_accueil_cloche_b.png",
    chainNext: "hameau-entree-4",
    narration: [
      "Tu entres dans la rue au moment où un homme se met à courir. Pas vers " +
        "toi : vers la chapelle, vers la corde qui pend le long du mur.",
      "Une vieille femme l'atteint avant lui. Elle ne crie pas, elle ne le " +
        "retient pas — elle pose la main sur la corde, c'est tout, et l'homme " +
        "s'arrête net comme s'il se réveillait.",
      "Le village sort quand même. Une dizaine, sur les seuils, pour un " +
        "tocsin qui n'a pas sonné. Et c'est toi qu'ils regardent : tu as " +
        "failli les faire sonner.",
    ],
    choices: [
      {
        id: "cloche-qui-repond",
        nature: "social",
        label: "Demander qui répondrait",
        risky: {
          stat: "INSTINCT",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu ne demandes pas « ce » qui répondrait. Tu demandes « qui ». La vieille lève enfin les yeux, et c'est à elle que tu as parlé juste. « La dernière fois qu'on a sonné, on comptait quarante-deux. » Elle regarde la rue. « Le lendemain, trente-neuf. Personne n'est parti. » Sa main n'a pas quitté la corde.",
            "« Ça ne répond pas avec des mots », dit la vieille. Elle ne lâche pas la corde pour autant. « Ça répond en venant. » L'homme qui courait s'est assis contre le mur, et il ne dit rien du tout.",
            "Tu demandes trop vite. La vieille resserre la main sur la corde et te regarde comme on regarde quelqu'un qui a demandé le prix d'une chose qui ne se vend pas. « On ne parle pas de ça dehors. »",
            "1 naturel. Tu poses la question à voix haute, dans la rue, devant les seuils. Une femme rentre son enfant. Un homme fait le geste de compter sur ses doigts, s'arrête, et cache sa main. ♦ −2"
          ),
        },
      },
      {
        id: "cloche-excuser",
        label: "T'excuser d'être arrivé",
        soupcon: -1,
        passive: {
          consequence:
            "Tu lèves les mains, paumes ouvertes, et tu dis que tu es " +
            "désolé — pas d'être là : d'être arrivé à ce moment-là. La " +
            "nuance les atteint. La vieille lâche la corde, enfin. Les seuils " +
            "se vident un par un, sans hâte et sans un mot. " +
            "Elle, elle reste, et te montre le bout de la rue du menton : " +
            "« Il t'attend au muret. Va, tant qu'il fait encore jour. »",
        },
      },
      {
        id: "cloche-tirer",
        nature: "social",
        label: "Tirer la corde toi-même",
        soupcon: 2,
        setsEnvFlag: "cloche-sonnee",
        risky: {
          stat: "COURAGE",
          threshold: 14,
          highStakes: true,
          outcomes: outcomes(
            "20 naturel. Tu écartes la vieille — doucement — et tu tires. Une fois. Le son part beaucoup plus loin qu'une cloche de village ne devrait porter, et la rue entière se fige dans la position où elle était. Puis rien. Rien du tout. Et c'est ce rien qui les terrifie : quelque chose a entendu, et a choisi de ne pas venir aujourd'hui.",
            "Tu tires. La cloche sonne un coup, mat, comme si le bronze était plein. Personne ne bouge, personne ne crie ; ils comptent. Tu ne sauras jamais jusqu'où, parce qu'à quatorze ils s'arrêtent tous en même temps et rentrent.",
            "Tu attrapes la corde, la vieille ne lâche pas, et vous tirez tous les deux à contretemps : le battant touche le bronze sans le faire sonner. Un bruit sourd, humiliant. Elle te regarde, et pour la première fois quelqu'un ici a l'air d'avoir pitié de toi.",
            "1 naturel. Tu tires, et le son sort trop long, trop plein, comme s'il ne venait pas de cette cloche-là. Loin, au sud, quelque chose de très grand change de position. Tu le sens sous tes pieds. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Sonne. Vas-y, sonne. Ça fait des années que je n'ai rien reçu d'aussi poli qu'une invitation.",
  },
  {
    /* Conditionnel : ne sort que si le COMPTE a déjà juré faux dans une vie
       précédente (fait permanent `serment_faux_jadis`). Ils partent parce que
       le dernier qui a juré ici a menti — et ce dernier, c'était toi. */
    id: "hameau-accueil-depart",
    illustration: "assets/scene_hameau_accueil_depart_a.png",
    chainNext: "hameau-entree-4",
    narration: [
      "On ne t'arrête pas : on est occupé. Au milieu de la rue, une " +
        "charrette à moitié chargée — un coffre, deux paillasses roulées, une " +
        "porte. Ils emportent leur porte.",
      "Les autres regardent. Personne n'aide. Personne ne dit au revoir non " +
        "plus : ils se tiennent sur leurs seuils, bras croisés, et attendent " +
        "que ça finisse.",
      "Un homme sangle une malle, te voit, et ne s'interrompt même pas. " +
        "« Vous descendez, nous on monte. Chacun son sens. »",
    ],
    choices: [
      {
        id: "depart-aider",
        nature: "social",
        label: "Aider à charger",
        soupcon: -1,
        risky: {
          stat: "EMPATHIE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu prends l'autre bout de la malle sans demander, et vous la montez ensemble. Personne ne te remercie, mais quelque chose se débloque dans la rue : deux hommes viennent aider à leur tour, honteux d'avoir attendu qu'un étranger commence. Le départ se fait vite, à la fin, et presque bien.",
            "Tu aides à sangler. L'homme accepte sans un mot, ce qui est ici la forme la plus haute du merci. Sa femme, elle, te regarde tout le temps du chargement — pas avec méfiance : comme on regarde quelqu'un qu'on essaie de reconnaître.",
            "Tu tends les mains vers le coffre et l'homme le retire. « Non. » Il ne s'explique pas. Sur les seuils, personne n'a bougé, et tu comprends trop tard que dans ce village, aider un partant, c'est prendre parti.",
            "1 naturel. Tu attrapes la porte pour la caler et elle glisse, tombe à plat, sonne sur les pavés. Toute la rue sursaute. La femme se met à pleurer, enfin — et c'est ta faute, et ce n'est pas la porte. ♦ −2"
          ),
        },
      },
      {
        id: "depart-pourquoi",
        nature: "social",
        label: "Demander pourquoi maintenant",
        risky: {
          stat: "RUSE",
          threshold: 12,
          outcomes: outcomes(
            "20 naturel. Tu ne demandes pas à celui qui charge : tu demandes à celle qui regarde, sur le seuil d'en face. Elle répond d'une traite, comme quelqu'un qui attendait qu'on le lui demande. « Parce que le dernier qui a juré au muret a menti, et que depuis, ça vient jusqu'ici la nuit. » Elle te regarde. « Vous jurez tous. »",
            "« Parce qu'on a compté trois fois ce mois-ci », dit l'homme sans lever la tête. « Et que trois fois, ça faisait pas pareil. » Il tire la sangle d'un coup sec. « Y a rien d'autre à comprendre. »",
            "Tu demandes, et il te répond par une autre question : « Vous êtes lequel ? » Comme tu ne comprends pas, il précise : « Y en a un qui est passé avant vous et qui a juré. Vous êtes lequel des deux ? » Tu n'as pas de réponse à ça.",
            "1 naturel. « Pourquoi maintenant ? » L'homme s'arrête enfin, se retourne, te regarde longuement. « Parce que vous êtes revenu. » Il n'a pas l'air de savoir lui-même pourquoi il a dit ça au passé. ♦ −2"
          ),
        },
      },
      {
        id: "depart-regarder",
        label: "Les regarder partir",
        passive: {
          consequence:
            "Tu t'écartes et tu laisses passer. La charrette prend la rue " +
            "vers le nord, lentement, et tout le village la regarde jusqu'au " +
            "bout — pas un adieu, une vérification. Ils veulent voir " +
            "jusqu'où elle ira. " +
            "Quand elle disparaît derrière la crête, les seuils se vident " +
            "d'un coup. Sauf un vieux, tout au bout de la rue, assis sur un " +
            "muret, qui n'a pas regardé la charrette une seule fois.",
        },
      },
    ],
    jailerLine: "Ils déménagent. Charmant. Comme si la lande avait des bords.",
  },
  {
    /* Beat 4 — Le Serment. Mécanique de zone : IMPOSÉ, jamais proposé.
       « Pourquoi trois aubes » est un point d'intérêt : on peut le demander,
       puis revenir au choix (spec §1 : le POI ne consomme pas le tour). */
    id: "hameau-entree-4",
    illustration: "assets/monstre_hameau_entree_4_c.png",
    chainNext: "hameau-entree-5",
    narration: [
      // ⚠️ Ce beat s'ouvre APRÈS un accueil tiré au sort (6/08) : il ne peut
      // plus supposer le barrage des trois hommes. D'où le raccord par le
      // lieu — quel que soit l'accueil, tout finit au muret, devant le vieux.
      "Au bout de la rue, un muret bas ferme le village côté sud. Le vieux y " +
        "est assis, sec comme un piquet, les coudes sur les genoux. Il " +
        "t'attendait là depuis le début.",
      "Il tend la main, paume ouverte. Pas pour serrer la tienne — pour " +
        "que tu la regardes. Elle est vide. C'est le geste d'ici : on jure sur " +
        "rien, parce qu'il ne reste rien.",
      "— « Trois choses, et tu dors sous un toit. Tu ne parles pas aux " +
        "pendus. Tu ne regardes pas le sud plus qu'il ne faut. Et à la " +
        "troisième aube, tu choisis. »",
    ],
    pointsInteret: [
      {
        /* ⚠️ Poser une question NE DOIT PAS résoudre le Serment (rapport de
           playtest 8/08 : « Demander qui juge » franchissait la scène avec
           serment: null, et la logique des trois aubes tombait). Les questions
           annexes sont donc des POINTS D'INTÉRÊT — on y revient au muret —,
           et seuls Jurer / Jurer du bout des lèvres / Refuser résolvent. */
        id: "doyenne-horaire",
        decouverte: "d.on_juge_la_nuit",
        label: "Demander qui juge, ici",
        approche:
          "Tu poses la question au vieux. C\u2019est la femme derri\u00e8re lui qui " +
          "r\u00e9pond, sans qu\u2019on lui ait rien demand\u00e9.",
        examen:
          "\u00ab Avant, on jugeait le jour. \u00bb Elle rajuste son ch\u00e2le. " +
          "\u00ab Maintenant on juge la nuit. C\u2019est pas moi qui ai d\u00e9cid\u00e9 " +
          "du changement d\u2019horaire. \u00bb",
      },
      {
        id: "pourquoi-trois-aubes",
        soupcon: 1, // poser LA question au muret, devant qui écoute
        label: "Demander pourquoi trois aubes",
        illustration: "assets/scene_hameau_trois_aubes_v2_c.png",
        approche:
          "Tu ne réponds pas tout de suite. Tu poses la question, et les " +
          "quelques-uns qui s'étaient approchés attendent la réponse avec " +
          "toi — comme si personne n'avait jamais osé la poser.",
        examen:
          "— « Trois aubes pour reprendre des forces. » Le vieux compte sur " +
          "sa main, sans ironie aucune. « La première, on te soigne. La " +
          "deuxième, on te montre ce que serait ta vie ici. À la troisième, " +
          "tu repars — ou tu poses ton nom parmi les nôtres. » Il te regarde " +
          "avec quelque chose qui ressemble beaucoup à de la bienveillance, " +
          "et c'est bien ça qui te glace.",
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
            "trois choses. Le vieux hoche la tête une fois, et toute la rue " +
            "se dénoue d'un coup dans ton dos, comme une corde qu'on lâche. " +
            "« Tenu jusqu'à la sortie », rappelle-t-il. Le hameau entier a " +
            "entendu. Et plus haut que le hameau, quelqu'un d'autre.",
        },
      },
      {
        id: "jurer-faux",
        tags: ["citable"],
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
        tags: ["citable"],
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
    illustration: "assets/scene_hameau_entree_5_v2_a.png",
    narration: [
      "Ils s'écartent. Pas beaucoup — juste assez pour que tu passes sans " +
        "toucher personne, et tu comprends que c'est calculé.",
      "La rue s'ouvre devant toi. Des volets se ferment à mesure, un par un, " +
        "un peu en avance sur ton pas. Quelque part, une corde grince.",
      "Te voilà dans le hameau. Personne ne t'a souhaité la bienvenue, et pourtant tous " +
        "savaient déjà que tu venais.",
    ],
    choices: [
      {
        id: "parler-de-la-dame",
        label: "Parler de la femme de l\u2019ouest",
        requiresDecouverte: "d.fille_vivante",
        soupcon: 2,
        passive: {
          consequence:
            "Tu poses la question à quelqu\u2019un qui rentre du puits. Le " +
            "regard doux, la voix douce : « Tu es fatigué. Le voyage " +
            "fatigue. » On te touche l\u2019épaule, on te souhaite une bonne " +
            "nuit — et on s\u2019éloigne d\u2019un pas qui n\u2019est plus tout à " +
            "fait celui de quelqu\u2019un qui rentre chez lui. Elle t\u2019avait " +
            "prévenu que ça commençait comme ça.",
        },
      },{ id: "entrer-hameau", label: "Entrer dans le hameau" }],
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
        decouverte: "d.barre_usee",
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
          "compte ici. Ce sont les passages de la ronde. En sortant, tu " +
          "passes la main sur la barre : le bois est lisse à l'intérieur et " +
          "usé jusqu'au fil dehors, comme si l'on s'y appuyait du dehors, " +
          "souvent, longtemps.",
      },
    ],
    choices: [
      {
        id: "veiller",
        nature: "surnaturel",
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
    chainNext: "temoin-toit",
    narration: [
      "Le hameau ne dort pas comme un village. Pas de rires, pas de disputes, " +
        "pas d'enfant qui pleure. Juste des pas, parfois, qui font une ronde " +
        "que personne n'a annoncée.",
    ],
    choices: [
      {
        id: "ecouter-nuit",
        nature: "surnaturel",
        tags: ["citable"],
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
            "une heure. Tu retrouves la bruyère avant le troisième passage. Personne " +
            "n'a rien à noter.",
        },
      },
    ],
    jailerLine: "Ils parlent de toi à travers une planche. Moi je te parle à travers le crâne. Chacun ses moyens.",
  },
  /* ═══ APPARITION 1 — LE POIDS SUR LE TOIT (refonte 6/08, §5) ════════════
     La première des trois, et la seule garantie : elle se joue à la première
     nuit dans la grange. On ne le voit pas, on l'ENTEND — c'est le principe
     de l'arc (entendu → entrevu → vu, et la troisième tue).

     Le retournement de la barre paie un détail écrit le 24/07 et jamais
     expliqué : la barre est posée DEHORS. Elle n'enferme pas l'hôte et ne le
     protège pas — elle signale une grange occupée. */
  {
    id: "temoin-toit",
    illustration: "assets/scene_temoin_grange_toit_v2_c.png",
    chainNext: "hameau-halte-4",
    decouverte: "d.temoin_entendu",
    narration: [
      "Les voix s\u2019éloignent. Le silence revient, et il est plus épais " +
        "qu\u2019avant.",
      "Puis le toit travaille. Une poutre plie — pas le craquement du bois " +
        "qui refroidit : le bruit d\u2019un bois qui porte quelque chose. La " +
        "poussière tombe en fil régulier entre deux planches, juste devant toi.",
      "Quelque chose remonte le faîtage. Ça s\u2019arrête au-dessus de la " +
        "porte. Ça reste.",
      "Dehors, les corbeaux ne bougent pas. C\u2019est ça, le pire : ils ne " +
        "s\u2019envolent pas.",
    ],
    choices: [
      {
        id: "toit-ne-pas-bouger",
        label: "Ne pas bouger",
        passive: {
          consequence:
            "Tu ne bouges pas. Tu ne respires presque plus. Au bout d\u2019un " +
            "temps que tu serais incapable de mesurer, le poids se déplace " +
            "vers l\u2019autre pignon, sans un bruit de pas — comme si le toit " +
            "seul savait qu\u2019il y avait quelque chose dessus.",
        },
      },
      {
        id: "toit-regarder",
        nature: "surnaturel",
        tags: ["citable"],
        label: "Chercher la fente",
        risky: {
          stat: "COURAGE",
          threshold: 13,
          highStakes: true,
          outcomes: outcomes(
            "20 naturel. Tu trouves la fente et tu colles l\u2019œil. Il n\u2019y a rien à voir : du ciel, la ligne du faîtage, et une portion de nuit un peu plus dense que le reste, qui NE BOUGE PAS avec le vent. Tu la regardes assez longtemps pour être certain que ce n\u2019est pas une illusion — et pour comprendre qu\u2019elle t\u2019a laissé faire.",
            "Tu trouves une fente entre deux planches. Le ciel est là, gris sale, avec une bande plus noire au bord du champ de vision. Quand tu bouges la tête pour la cadrer, elle n\u2019est plus dans le cadre. Quand tu reviens, elle y est.",
            "Tu te lèves trop vite et la paille crisse. Au-dessus, le poids s\u2019arrête net — puis se déplace, lentement, exactement au-dessus de l\u2019endroit où tu te tiens. Tu passes le reste de la nuit assis, dos au mur, à écouter un plancher de ciel.",
            "1 naturel. Tu approches l\u2019œil de la fente, et quelque chose, de l\u2019autre côté, fait exactement le même geste. ♦ −2"
          ),
        },
      },
    ],
    jailerLine: "Ah. Lui. Il n\u2019est pas de ma maison, celui-là — il s\u2019y est installé. Comme les rats.",
  },
  {
    /* VARIANTE : on ne s'étonne qu'une fois. Aux nuits suivantes le texte se
       raccourcit — c'est devenu un bruit connu, ce qui est bien pire. */
    id: "temoin-toit-connu",
    remplace: { scene: "temoin-toit", si: { has: "d.temoin_entendu" } },
    illustration: "assets/scene_temoin_grange_toit_v2_c.png",
    chainNext: "hameau-halte-4",
    narration: [
      "Les voix s\u2019éloignent. Tu attends, parce que tu sais maintenant " +
        "qu\u2019il y a quelque chose à attendre.",
      "La poutre plie à la même heure, au même endroit. Le poids remonte le " +
        "faîtage, s\u2019arrête au-dessus de la porte, et reste. Ce n\u2019est " +
        "plus une découverte : c\u2019est un horaire.",
    ],
    choices: [
      {
        id: "toit-attendre-connu",
        label: "Attendre que ça passe",
        passive: {
          consequence:
            "Tu comptes. La dernière fois, ça avait duré à peu près autant. " +
            "Il y a quelque chose d\u2019obscène à s\u2019habituer, et tu " +
            "t\u2019habitues.",
        },
      },
    ],
    jailerLine: "La deuxième fois, on ne compte plus les battements de cœur. On compte le temps. C\u2019est un progrès, je suppose.",
  },
  {
    /* Beat 4 — L'aube. Le Serment tenu jusqu'ici se paie ici (−1 Soupçon). */
    id: "hameau-halte-4",
    illustration: "assets/monstre_hameau_halte_4_v2_c.png",
    chainNext: "hameau-halte-5",
    narration: [
      "La barre se soulève au premier gris. Le vieux, seul. Il te tend un " +
        "quignon dur et ne dit rien pendant que tu manges.",
      "Tu regardes la barre pendant qu\u2019il la repose contre le mur. Tu " +
        "croyais qu\u2019elle t\u2019enfermait, ou qu\u2019elle te protégeait. Ni " +
        "l\u2019un ni l\u2019autre : elle indiquait que la grange était occupée.",
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
    illustration: "assets/scene_hameau_halte_5_v2_c.png",
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
    choices: [
      { id: "franchir-portillon", label: "Franchir le portillon" },
      {
        /* LE RENONÇANT (5/08) — la seule fin du jeu qui ne soit pas une mort.
           N'apparaît QUE si le Serment a été juré ET tenu (Soupçon au plus
           bas) : le hameau n'offre pas une place à qui il surveille. Jamais
           suggéré, jamais mis en avant — c'est une porte, pas une récompense. */
        id: "rester-au-hameau",
        label: "Ne pas franchir",
        renonce: true,
      },
    ],
    jailerLine: "« Réponds pas. » Trente ans de sagesse villageoise, résumés. Ça ne marche pas, mais c'est mignon.",
  },
  {
    /* Nœud TERMINAL du renoncement. Hors pool, atteint uniquement par le choix
       « Ne pas franchir » du beat 5 de la Halte. La loi de substitution est
       ici SANS être énoncée : pour qu'une place se libère, une autre se prend
       — et c'est le héros qui prend celle du prochain fixé. */
    id: "renoncer",
    illustration: "assets/scene_renoncer_v2_b.png",
    terminal: true,
    renoncement: true,
    narration: [
      "Tu ne passes pas le portillon. Tu fais un pas de côté, et tu " +
        "t'assieds sur la pierre du seuil, du côté du hameau.",
      "Personne ne discute. Le plus jeune referme le portillon, le vieux " +
        "hoche la tête une fois — c'est fait, et ça s'est fait sans un mot. " +
        "Le lendemain, on te donne une porte. Une vraie, avec un loquet. Ce " +
        "n'est pas rien, ici, une porte.",
      "Aux premières aubes tu comptes les jours comme eux. Puis tu cesses de " +
        "compter. Un matin, quelqu'un frappe chez la Femme au Seuil, et sa " +
        "croix de craie a disparu de son bois. Personne ne t'explique où elle " +
        "est passée. Tu ne demandes pas.",
    ],
    choices: [{ id: "fin-renoncant", label: "Laisser le nom au Registre" }],
    jailerLine:
      "Tu restes ? Reste. Je n'ai jamais perdu personne. J'ai seulement changé de porte à surveiller.",
  },
  {
    /* Beat 6 — variante « nuit dehors » (Serment refusé). Remplace les beats
       1-5 : aucune porte ne s'ouvre à qui n'a pas juré. */
    id: "hameau-halte-dehors",
    illustration: "assets/scene_hameau_nuit_dehors_v2_c.png",
    hameauHalte: true,
    narration: [
      "Aucune porte, aucune grange. Tu dors contre un muret, côté nord — " +
        "d'instinct.",
      "La nuit des Landes n'attaque pas. Elle compte. Chaque heure a son " +
        "bruit : la corde, les pas, le chant du sud. Au matin, tu n'es pas " +
        "reposé — ton nom est à l'inventaire, comme un outil.",
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
  /* ═══ APPARITION 2 — LA RUELLE (refonte 6/08, §5) ═══════════════════════
     Conditions : la nuit, HORS ABRI, et l'avoir déjà entendu. C'est la voie
     de l'imprudent — celui qui a refusé le Serment dort dehors, et dehors on
     ne fait pas qu'entendre. VARIANTE de la nuit dehors : elle en garde la
     place, l'issue et la sortie de zone.

     ⚠️ Ne JAMAIS montrer ce qu'il y a sous le manteau (garde-fou §8) : on
     voit du tissu, une hauteur, et « quelque chose qui n'était pas des
     jambes ». L'ambiguïté corbeaux-serviteurs / corbeaux-constituants doit
     rester entière. */
  {
    id: "temoin-ruelle",
    remplace: { scene: "hameau-halte-dehors", si: { has: "d.temoin_entendu" } },
    illustration: "assets/monstre_temoin_ruelle_v6_b.png",
    hameauHalte: true,
    decouverte: "d.temoin_entrevu",
    narration: [
      "Aucune porte, aucune grange. Tu dors contre un muret, côté nord — " +
        "d\u2019instinct. Sauf que cette fois tu ne dors pas : tu sais ce qui " +
        "marche sur les toits.",
      "Au bout de la ruelle, quelque chose traverse. De gauche à droite, " +
        "sans bruit — et c\u2019est l\u2019absence de bruit qui te fige, parce " +
        "que ça faisait trois têtes de haut.",
      "Tu vois du tissu. Beaucoup de tissu, noir, qui suit avec un temps de " +
        "retard, comme une traîne. Et dessous, une seconde de trop, quelque " +
        "chose qui n\u2019était pas des jambes.",
      "Puis plus rien. Le passage est vide. Sur les toits des deux côtés, " +
        "les corbeaux sont alignés et te regardent, toi.",
    ],
    choices: [
      {
        id: "ruelle-ne-pas-suivre",
        label: "Ne pas suivre",
        soupcon: 1,
        poseEtat: "hante",
        passive: {
          consequence:
            "Tu restes contre ton muret jusqu\u2019au gris. Tu ne dors pas. " +
            "Au matin, des traces de pas font un cercle complet autour de " +
            "l\u2019endroit où tu étais couché, à trois mètres — personne ne " +
            "s\u2019est approché plus près, et personne n\u2019est reparti sans " +
            "avoir regardé.",
        },
      },
      {
        id: "ruelle-suivre",
        nature: "surnaturel",
        tags: ["citable"],
        label: "Aller voir le passage",
        risky: {
          stat: "COURAGE",
          threshold: 14,
          highStakes: true,
          outcomes: outcomes(
            "20 naturel. Tu marches jusqu\u2019au coin. Le passage est vide, et le sol y est sec alors qu\u2019il a plu — sur toute la largeur, une bande où l\u2019humidité n\u2019a pas pris. Tu la suis des yeux : elle va d\u2019un linteau à l\u2019autre, d\u2019une porte à l\u2019autre, et elle s\u2019arrête à chacune. Il fait sa tournée.",
            "Tu vas jusqu\u2019au coin, le cœur en désordre. Rien. Une ruelle, des volets clos, et sur le linteau de la maison d\u2019en face, à hauteur d\u2019homme, une entaille fraîche dans le bois. La même que sur toutes les autres portes du hameau.",
            "Tu fais trois pas et tu t\u2019arrêtes, parce que les corbeaux se sont tous tournés en même temps. Pas vers le passage. Vers toi. Tu regagnes ton muret sans donner le dos à la rue.",
            "1 naturel. Tu arrives au coin au moment où il revient. Tu ne vois toujours pas de visage. Tu vois qu\u2019il s\u2019arrête, et qu\u2019il attend — comme on attend que quelqu\u2019un ait fini de comprendre. ♦ −2"
          ),
        },
        poseEtat: "hante",
      },
    ],
    jailerLine: "Il t\u2019a laissé le voir. Ce n\u2019est pas de la négligence : c\u2019est une convocation.",
  },
  /* ═══ LE TROUPEAU SANS BERGER (journal 6/08) — rencontre de liaison ═════
     Croisé en MARCHANT, boucle EST, hors du Hameau — sa force vient du fait
     qu'on le croise seul, sans personne pour l'expliquer. Sur tirage, au plus
     une fois par vie (déroutage dans advance(), jamais dans le pool).

     Trois fonctions (spec) : une PREUVE DATÉE (un troupeau vivant sans berger
     prouve qu'il y avait un berger récemment — les Fixations ne sont pas de
     l'histoire ancienne, on a pendu quelqu'un la semaine dernière) ; un
     COMPTEUR SILENCIEUX (il grossit d'une run à l'autre, voir tailleTroupeau) ;
     un DILEMME DE BESOIN (un héros Affamé peut prendre une bête — et devenir
     exactement ce qu'ils redoutent). */
  {
    id: "troupeau-sans-berger",
    illustration: "assets/monstre_troupeau_sans_berger_a.png",
    chainNext: "troupeau-sans-berger-2",
    narration: [
      "Des bêtes broutent la bruyère morte au creux du vallon — un troupeau " +
        "entier, sans personne. Elles ne s\u2019écartent pas quand tu " +
        "approches : elles lèvent la tête, te regardent une seconde, et se " +
        "remettent à brouter.",
      "C\u2019est ce détail qui te dérange le plus. Elles n\u2019ont pas " +
        "appris à se méfier.",
    ],
    pointsInteret: [
      {
        id: "compter-troupeau",
        illustration: "assets/monstre_troupeau_compte_b.png",
        label: "Les marques d\u2019oreille",
        troupeau: true,
        decouverte: "d.troupeau_compte",
        approche:
          "Tu marches jusqu\u2019au bord du troupeau. Les bêtes te laissent " +
          "entrer entre elles comme si tu étais un piquet de plus.",
        examen:
          "De près, elles sont grasses, entretenues — quelqu\u2019un les a " +
          "menées, soignées, comptées, et pas il y a trente ans : cette " +
          "laine-là a vu un berger cette saison.",
      },
    ],
    choices: [
      { id: "troupeau-approcher", label: "S\u2019avancer dans le vallon" },
    ],
    jailerLine: "Un troupeau qui grossit sans berger. Quelqu\u2019un, quelque part, tient très mal ses registres. Ou très bien.",
  },
  {
    id: "troupeau-sans-berger-2",
    illustration: "assets/monstre_troupeau_brebis_v2_b.png",
    narration: [
      "Une brebis s\u2019écarte du groupe et marche droit vers le nord-est, " +
        "s\u2019arrête, revient. Puis recommence. Cinq fois pendant que tu la " +
        "regardes.",
      "Elle refait un trajet. Elle attend au bout de quelque chose qui " +
        "n\u2019arrive plus.",
      "Dans cette direction, à un quart d\u2019heure de marche, il y a le " +
        "Champ des Fixés.",
    ],
    choices: [
      {
        id: "troupeau-suivre",
        tags: ["citable"],
        label: "Suivre la brebis",
        orient: { dest: "champ-des-fixes" },
      },
      {
        /* Le DILEMME DE BESOIN : nourriture sans propriétaire vivant. Ouvert
           par AFFAMÉ seulement (garde `ouvreVol`). Prendre la meneuse, c'est
           repartir avec sa clochette — l'objet qui annonce QUE TU ARRIVES.
           La charge inversée du Grelot, et le juste prix du geste. */
        id: "troupeau-prendre",
        tags: ["citable"],
        label: "Prendre une bête",
        requiresEtat: "affame",
        poseEtat: "marque",
        repondBesoin: "manger",
        grantsLoot: "clochette-meneuse",
        passive: {
          consequence:
            "Tu choisis la seule qui te laisse faire — la meneuse, sa " +
            "clochette au cou. Elle te suit sans un bruit, et le troupeau ne " +
            "bronche pas. C\u2019est après, en mangeant, que la phrase te " +
            "vient toute seule : tu viens de prendre ce qui appartenait à un " +
            "pendu. Si on te voit au hameau avec cette laine, on saura " +
            "compter jusqu\u2019à cinq.",
        },
      },
      {
        id: "troupeau-continuer",
        label: "Continuer ton chemin",
        passive: {
          consequence:
            "Tu t\u2019éloignes, et le troupeau se referme derrière toi " +
            "comme de l\u2019eau. Dans ton dos, une clochette. Une seule, " +
            "quelque part au milieu des bêtes — celle qu\u2019on met au cou " +
            "de la meneuse, pour que le berger sache où est son troupeau " +
            "dans le brouillard. Elle sonne toute seule, pour personne.",
        },
      },
    ],
    jailerLine: "Elles attendent quelqu\u2019un qui ne vient plus. Toi aussi, remarque. La différence, c\u2019est qu\u2019elles ne le savent pas.",
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
        illustration: "assets/scene_tour_pierres_rangees_a.png",
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
        illustration: "assets/scene_tour_meurtriere_sud_a.png",
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
        nature: "physique",
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
    illustration: "assets/monstre_guetteur_tour_c.png",
    foe: "guetteur-tour",
    foeName: "le Guetteur sans tour",
    narration: [
      "Il est assis sur le tas de pierres, dos à toi, et il regarde le sud " +
        "par-dessus le hameau. Un vieux manteau de guet, la corne au côté. " +
        "Il ne se retourne pas.",
      "— « Tu as vu là-haut. » Ce n'est pas une question. « Alors tu as vu ce " +
        "qu'on surveillait. »",
    ],
    choices: [
      {
        id: "guet-demander",
        nature: "social",
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
        nature: "social",
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
    tags: ["food_available"],
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
        nature: "social",
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
        "fait signe quand même, comme à un client de longue date. Sur " +
        "l'étal, aucun fruit. « Ceux du Verger, j'en prends pas », dit-il " +
        "en suivant ton regard. « Personne n'en prend. »",
      // Le Rebouteux est INTRODUIT avant que ses choix n'apparaissent
      // (rapport IA externe 8/08 : « le Rebouteux apparaît dans la
      // conséquence sans avoir été introduit »).
      "À l'étal voisin, un vieil homme écrase des feuilles dans un mortier, " +
        "des fioles bouchées de cire alignées devant lui. Le Rebouteux. Il " +
        "ne lève pas la tête — mais son tabouret libre est tourné vers toi.",
    ],
    choices: [
      {
        /* Branchement du TROUPEAU (6/08). */
        id: "colporteur-viande",
        label: "Demander d\u2019où vient la viande",
        requiresDecouverte: "d.troupeau_compte",
        passive: {
          consequence:
            "Il suit ton regard jusqu\u2019aux quartiers salés pendus sous " +
            "l\u2019étal, et pour la première fois son sourire de marchand " +
            "se simplifie. « Me demande pas d\u2019où ça vient. » Il remonte " +
            "la toile dessus, sans hâte. « Moi je revends. »",
        },
      },
      {
        /* LE SONNEUR SANS CLOCHE (§7) — il n'avait aucune scène. Son
           témoignage tient en trois phrases et dit tout du village : il a
           voulu prévenir, et on lui a retiré le moyen de prévenir sans un
           mot d'explication. */
        id: "sonneur-battant",
        label: "Parler à l\u2019homme sans étal",
        requiresDecouverte: "d.cloche_sans_battant",
        decouverte: "d.sonneur",
        passive: {
          consequence:
            "Un homme sans marchandise se tient au bout de la rangée, les " +
            "mains vides et l\u2019air de quelqu\u2019un qui a eu un métier. " +
            "« J\u2019ai sonné, une nuit. Pour prévenir. » Il regarde ses " +
            "paumes. « Le lendemain, plus de battant. Personne n\u2019a rien " +
            "dit. C\u2019était juste plus là. »",
        },
      },
      {
        /* Témoignage court §7 : chacun sait un fragment et croit que c'est
           tout. Le Rebouteux ne se demande même pas pourquoi personne ne
           demande de soins la nuit — il a rangé ça dans « les habitudes ». */
        id: "rebouteux-la-nuit",
        label: "Demander s\u2019il soigne le soir",
        decouverte: "d.nuit_du_hameau",
        passive: {
          consequence:
            "Le rebouteux hausse les épaules sans lever les yeux de son " +
            "baume. « Je soigne pas la nuit. » Un temps. « C\u2019est pas une " +
            "règle, hein. C\u2019est juste que personne demande. » Puis, comme on jette un os : « Et si c\u2019est l\u2019eau de la Mare que tu as bue, garde ta monnaie. Ça, ça se soigne pas ici. »",
        },
      },
      {
        id: "troc-colporteur",
        nature: "social",
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
        nature: "social",
        repondBesoin: "soigner",
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
    // ⚠️ Le lieu s'appelle le Moulin SANS Ailes et son point d'intérêt (« la
    // croix d'ombres ») repose sur leur absence : la vue d'établissement doit
    // montrer la tour tronquée. `scene_moulin_campement_a` (ailes entières)
    // reste en réserve si Patrick préfère la regénérer.
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
        /* LA TOURNÉE (§7) : le chemin de faîtage du Grand Témoin s'arrête à
           cinquante pas du Moulin. C'est la preuve matérielle que ce lieu est
           un sanctuaire — et le joueur peut la lire sans jamais savoir de
           quoi il s'agit. */
        id: "crete-interrompue",
        illustration: "assets/scene_moulin_crete_interrompue_b.png",
        label: "La crête du toit",
        approche:
          "Tu contournes la tour et tu lèves les yeux vers le faîtage. La " +
          "mousse a mangé toute la pierre, sauf une bande, en haut, nette " +
          "comme un sentier.",
        examen:
          "La bande sans mousse court sur toute la longueur du toit, large " +
          "comme deux mains, usée. Puis elle s\u2019arrête. Pas en " +
          "s\u2019amenuisant : d\u2019un coup, à cinquante pas de la porte, " +
          "comme si quelque chose qui marchait là s\u2019était retourné " +
          "chaque fois exactement au même endroit.",
        decouverte: "d.crete_interrompue",
      },
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
        // Qui habite le moulin, c'est la Fille — et ce qu'on raconte de sa
        // corde change d'une vie à l'autre (lib/contradictions.ts).
        fait: "fait-fille",
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
        nature: "surnaturel",
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
    illustration: "assets/scene_moulin_campement_2_a.png",
    narration: [
      "Par la lucarne, le crépuscule ne bouge pas. On dit qu'une fille " +
        "dort ici, parfois — la seule pendue qui se soit relevée. Le lit de " +
        "bruyère garde une forme légère, comme un creux encore tiède.",
    ],
    choices: [
      { id: "dormir", label: "Dormir malgré le crépuscule", rest: true, tags: ["citable"] },
      {
        id: "garde",
        nature: "surnaturel",
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
  /* ═══ LA FILLE AU MOULIN — degré 4 (refonte du lore 6/08, §6) ═══════════
     VARIANTE de l'écran-événement du Moulin, ouverte à partir de TROIS
     découvertes sur elle. En dessous, le Moulin reste vide : la rencontre est
     le paiement d'une enquête, jamais un tirage.

     Sa Fixation a raté. Elle n'est pas morte, pas partie, et n'a pas vieilli —
     elle est le seul échec du Grand Témoin, et il ne peut pas le corriger : il
     lui faut une condamnation collective, et on ne condamne pas quelqu'un
     qu'un village a décidé de ne pas voir. C'est pour ça que le Moulin est le
     seul endroit sûr des Landes.

     ⚠️ Elle ne délivre AUCUN bonus mécanique. Ce qu'elle donne est une
     information qui coûte : en parler à un villageois fait +2 Soupçon. */
  {
    id: "fille-moulin-1",
    remplace: { scene: "campement-2", si: { id: COMPTEUR_FILLE, gte: SEUIL_MOULIN } },
    illustration: "assets/monstre_fille_moulin_dos_v2_a.png",
    chainNext: "fille-moulin-2",
    narration: [
      "La porte est entrouverte, comme toujours. Mais cette fois la bruyère " +
        "du pot n\u2019est pas seulement fraîche : elle est mouillée. " +
        "Quelqu\u2019un vient de la cueillir.",
      "Une femme est assise sur la paillasse, dos à toi, occupée à quelque " +
        "chose de ses mains. Elle ne se retourne pas.",
      "« Tu m\u2019as vue. » Ce n\u2019est pas une question. « Ça arrive une fois " +
        "tous les dix ans. »",
    ],
    choices: [
      { id: "fille-rester", label: "Rester sur le seuil" },
      {
        id: "fille-entrer",
        label: "Entrer et refermer",
        passive: {
          consequence:
            "Tu pousses la porte derrière toi. Le bruit de la lande " +
            "s\u2019arrête net, comme coupé au couteau — et tu réalises que " +
            "c\u2019est la première fois depuis la Borne que tu n\u2019entends " +
            "plus le vent.",
        },
      },
    ],
    jailerLine: "Tiens. Une place que je ne vois pas bien. Ça ne m\u2019était pas arrivé depuis longtemps.",
  },
  {
    id: "fille-moulin-2",
    illustration: "assets/monstre_la_fille_moulin_v2_a.png",
    chainNext: "fille-moulin-3",
    narration: [
      "Elle se retourne enfin, et le compte ne marche pas. Le village parle " +
        "d\u2019elle comme d\u2019une histoire ancienne, d\u2019un temps que même " +
        "les vieux ont du mal à situer. Elle a vingt ans.",
      "« Ils m\u2019ont pendue un mardi. » Elle dit ça comme on donne une " +
        "adresse. « Ça n\u2019a pas pris. Je suis restée là, à me balancer, et " +
        "à un moment ils sont partis manger. »",
      "« Quand ils sont revenus, j\u2019avais défait le nœud toute seule. Alors " +
        "ils ont décidé de ne pas m\u2019avoir vue. C\u2019était plus simple. »",
    ],
    choices: [
      {
        id: "fille-pourquoi-rester",
        label: "« Pourquoi restez-vous ici ? »",
        passive: {
          consequence:
            "« Pour aller où ? » Elle repose ses mains. « Au sud, il y a la " +
            "Descente, et la Descente ne prend que les vivants ou les morts. " +
            "Je ne suis ni l\u2019un ni l\u2019autre. » Un temps. « Et puis " +
            "quelqu\u2019un doit rester pour savoir ce qui s\u2019est passé. »",
        },
      },
      {
        id: "fille-votre-pere",
        nature: "social",
        tags: ["citable"],
        label: "« Votre père vous attend. »",
        risky: {
          stat: "EMPATHIE",
          threshold: 12,
          highStakes: true,
          outcomes: outcomes(
            "20 naturel. Tu ne dis pas « il vous attend ». Tu dis : « il a tressé la corde trois mois. » Elle s\u2019arrête net. Pour la première fois depuis trente ans, quelqu\u2019un lui parle de son père comme d\u2019un homme et non comme d\u2019un pendu — et elle te raconte le reste sans que tu aies à demander.",
            "Elle ne se fâche pas. Elle repose son ouvrage sur ses genoux, très lentement, et regarde la lucarne. « Je sais. » Deux mots, et le silence qui suit dure assez longtemps pour que tu comprennes qu\u2019elle y pense tous les jours.",
            "« Ne fais pas ça. » Sa voix ne monte pas d\u2019un ton, ce qui est pire. « Tout le monde ici me dit ce que je devrais faire de mon père. Toi tu viens d\u2019arriver. »",
            "1 naturel. Elle rit — un son sec, sans joie. « Il m\u2019attend, oui. Comme il attendait l\u2019autre. » Elle se remet à son ouvrage et ne te répondra plus de la soirée. ♦ −2"
          ),
        },
      },
      {
        id: "fille-ne-rien-dire",
        label: "Ne rien dire",
        passive: {
          consequence:
            "Tu ne dis rien. Elle continue son ouvrage, et le silence " +
            "s\u2019installe sans gêne — c\u2019est visiblement ce qu\u2019elle " +
            "préfère. Au bout d\u2019un moment, elle parle d\u2019elle-même, " +
            "parce que personne ne l\u2019en empêche.",
        },
      },
    ],
    jailerLine: "Trente ans qu\u2019elle refait le même geste. Je connais ça. C\u2019est ce que vous appelez « tenir ».",
  },
  {
    id: "fille-moulin-3",
    illustration: "assets/monstre_la_fille_moulin_v2_a.png",
    chainNext: "fille-moulin-4",
    narration: [
      "« Mon père a construit une potence pour la chose qui m\u2019a fait " +
        "pendre. » Elle repose son ouvrage. « Il l\u2019a attendue trois mois. " +
        "Elle n\u2019est pas venue. Elle ne vient jamais quand on l\u2019appelle " +
        "— elle vient quand un village est prêt. »",
      "Un temps.",
      "« Il s\u2019est pendu à côté. Pas de chagrin : par règlement. Il avait " +
        "refusé de me condamner, et refuser, dans son livre, c\u2019était une " +
        "faute. Il a inscrit son nom et il a fait ce qu\u2019il fallait. »",
      "« Alors non, je ne monte pas le voir. Il attend un procès. Moi " +
        "j\u2019ai fini d\u2019attendre. »",
    ],
    choices: [
      {
        id: "fille-la-chose",
        label: "« Quelle chose ? »",
        decouverte: "d.temoin_nomme",
        passive: {
          consequence:
            "Elle te regarde un long moment, et tu comprends qu\u2019elle " +
            "évalue si tu es prêt à l\u2019entendre ou seulement curieux. " +
            "« Celle qui regarde. Elle ne juge personne — elle attend que " +
            "vous le fassiez, et pendant qu\u2019elle regarde, vous osez. » " +
            "Elle hausse les épaules. « Mon père l\u2019a citée à comparaître. " +
            "C\u2019était un homme très sérieux. »",
        },
      },
      {
        id: "fille-ecouter",
        label: "La laisser finir",
        passive: {
          consequence:
            "Tu ne l\u2019interromps pas. Elle va au bout, sans une hésitation " +
            "— ce n\u2019est pas la première fois qu\u2019elle se le raconte, " +
            "c\u2019est juste la première fois qu\u2019il y a quelqu\u2019un dans " +
            "la pièce.",
        },
      },
    ],
    jailerLine: "Un homme qui somme la nuit de comparaître. J\u2019aurais aimé voir ça. La nuit ne s\u2019est pas présentée.",
  },
  {
    id: "fille-moulin-4",
    illustration: "assets/monstre_fille_moulin_ouvrage_c.png",
    decouverte: "d.fille_vivante",
    narration: [
      "« Tu vas redescendre et tu vas leur en parler. Ils vont te regarder " +
        "gentiment, et ils vont noter que tu parles à des gens qui " +
        "n\u2019existent pas. » Elle se remet à son ouvrage. « C\u2019est comme " +
        "ça qu\u2019on commence. »",
      "« Alors garde-moi pour toi. Et si tu passes le sud, ne te retourne " +
        "pas pour vérifier si je suis toujours là. Je serai toujours là. " +
        "C\u2019est exactement le problème. »",
    ],
    choices: [
      { id: "fille-dormir", label: "Dormir ici", rest: true },
      {
        id: "fille-veiller-avec",
        label: "Veiller avec elle",
        repondBesoin: "dormir",
        passive: {
          consequence:
            "Vous ne parlez plus. Elle tresse, tu regardes la lucarne, et " +
            "rien ne vient — ni bruit sur le toit, ni ombre à la porte, ni " +
            "corbeau sur la crête. Tu ne dors pas et pourtant tu te lèves " +
            "reposé, ce qui ne t\u2019était pas arrivé depuis la Borne. Le " +
            "seul endroit du pays où l\u2019on ne te compte pas.",
        },
      },
      { id: "fille-repartir", label: "Repartir sans s\u2019attarder" },
    ],
    jailerLine: "Elle t\u2019a demandé de te taire. Nous allons voir combien de temps tu tiens — c\u2019est toujours instructif.",
  },
  /* ═══ LA VEUVE AUX CORDES — variante « celle qui sait et qui refait » ════
     Refonte du lore 6/08, §6. Condition : avoir aperçu la Fille (le caillou
     du Gamin suffit). Sa scène ordinaire vend des cordes ; celle-ci raconte
     la seule qui ne tient pas — parce que le joueur, lui, sait maintenant
     qu'il y a quelqu'un à l'autre bout.

     C'est le deuxième des quatre témoignages qui, mis bout à bout, racontent
     l'histoire sans qu'aucun ne la dise. Elle ne ment pas : elle décrit son
     travail, et son travail est absurde depuis trente ans. */
  {
    id: "veuve-cordes-sait-1",
    remplace: { scene: "chapelle-des-cordes-2", si: { has: "d.fille_apercue" } },
    illustration: "assets/monstre_veuve_cordes_v2_a.png",
    chainNext: "veuve-cordes-sait-2",
    narration: [
      "Elle tresse sous le mur des cordes. Ses mains vont toutes seules — " +
        "elle n\u2019a pas besoin de regarder, et elle ne regarde pas.",
      "« Chacune est une personne. Je les coupe après. Ça les libère pas, " +
        "mais ça fait quelque chose à faire. »",
      "Toutes portent une étiquette. Sauf une, à hauteur d\u2019œil, au centre " +
        "du mur : sans nom, plus neuve que les autres.",
    ],
    choices: [
      {
        id: "veuve-sans-nom",
        label: "« Celle-là n\u2019a pas de nom. »",
        passive: {
          consequence:
            "Ses mains ralentissent, sans s\u2019arrêter tout à fait. « Non. » " +
            "Elle laisse le mot seul un long moment. « Non, celle-là n\u2019a " +
            "pas de nom. »",
        },
      },
      {
        id: "veuve-plus-neuve",
        nature: "social",
        label: "« Pourquoi est-elle plus neuve ? »",
        risky: {
          stat: "RUSE",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu ne demandes pas pourquoi elle est neuve : tu demandes depuis quand elle l\u2019est. Ses mains s\u2019arrêtent net, et elle te répond par un chiffre — trente ans — avant d\u2019avoir décidé si elle voulait le dire.",
            "Elle suit ton regard, et comprend que tu as compté les fibres comme elle le fait, elle. « T\u2019as l\u2019œil pour quelqu\u2019un qui passe. » Elle repose son ouvrage. C\u2019est la première fois.",
            "« Le chanvre vieillit mal ici. On refait. » Elle reprend son geste un peu trop vite, et le nœud qu\u2019elle serre n\u2019est pas celui qu\u2019elle serrait avant.",
            "1 naturel. « Tu poses beaucoup de questions sur une corde. » Elle te regarde enfin, et son regard fait tout le tour de toi, comme on prend une mesure. ♦ −2"
          ),
        },
        soupcon: 1,
      },
    ],
    jailerLine: "Une corde par personne. Elle tient un registre, elle aussi. Vous ne savez rien faire d\u2019autre.",
  },
  {
    id: "veuve-cordes-sait-2",
    illustration: "assets/monstre_veuve_cordes_v2_a.png",
    chainNext: "veuve-cordes-sait-3",
    decouverte: "d.fixation_ratee",
    narration: [
      "Ses mains s\u2019arrêtent. Première fois.",
      "« Celle-là, je la refais. Trente ans que je la refais. Je la tresse, " +
        "je la cloue, je la coupe. Et au matin suivant, elle est défaite. Pas " +
        "coupée : défaite. Nœud par nœud, proprement, comme quelqu\u2019un qui " +
        "prend son temps. »",
      "Un silence.",
      "« Alors je recommence. Parce que si j\u2019arrête, faudra que je dise à " +
        "quelqu\u2019un pourquoi. »",
    ],
    choices: [
      {
        id: "veuve-qui-defait",
        label: "« Qui la défait ? »",
        passive: {
          consequence:
            "« Personne. » Elle le dit trop vite, et l\u2019entend elle-même. " +
            "Elle reprend, plus bas : « Y a pas de nom à mettre dessus. " +
            "C\u2019est bien tout le problème de cette corde. »",
        },
      },
      {
        id: "veuve-se-taire",
        label: "Ne rien demander",
        passive: {
          consequence:
            "Tu ne demandes rien. Elle t\u2019en est visiblement " +
            "reconnaissante : elle vient de dire tout haut, devant un " +
            "inconnu, la chose qu\u2019elle ne dit jamais, et elle a besoin " +
            "d\u2019un moment pour se remettre du bruit que ça a fait.",
        },
      },
    ],
    jailerLine: "Trente ans à refaire un nœud que quelqu\u2019un défait. Il y a des enfers moins bien tenus que le vôtre.",
  },
  {
    id: "veuve-cordes-sait-3",
    illustration: "assets/monstre_veuve_cordes_v2_a.png",
    narration: [
      "Elle reprend son ouvrage, et le mur reprend son bruit — ce " +
        "froissement continu de chanvre qu\u2019on croirait fait par le vent.",
      "« Mets pas d\u2019étiquette dessus. Une corde sans nom, c\u2019est une " +
        "corde en attente. Une corde avec un nom, c\u2019est un fait. »",
    ],
    choices: [
      { id: "veuve-partir", label: "La laisser à son mur" },
      {
        id: "veuve-remercier",
        label: "La remercier",
        soupcon: -1,
        passive: {
          consequence:
            "Elle hausse une épaule sans lever les yeux. « Me remercie pas. " +
            "J\u2019ai rien dit. » Et c\u2019est vrai : si on lui demande, elle " +
            "n\u2019aura rien dit, et elle le pensera.",
        },
      },
    ],
    jailerLine: "« Une corde avec un nom, c\u2019est un fait. » Voilà pourquoi j\u2019aime tant les registres.",
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
        id: "cloche-sans-battant",
        illustration: "assets/scene_chapelle_cloche_sans_battant_b.png",
        label: "Le clocheton, dehors",
        approche:
          "Tu ressors par le côté. Le clocheton n\u2019est pas haut — deux " +
          "hommes suffiraient à l\u2019atteindre, et la corde d\u2019appel " +
          "pend jusqu\u2019à hauteur de main, propre, entretenue.",
        examen:
          "Tu tires la corde par curiosité. Rien ne vient. La cloche " +
          "bascule, revient, bascule encore — et ne sonne pas : elle " +
          "n\u2019a plus de battant. L\u2019attache est là, intacte. On ne " +
          "l\u2019a pas cassée : on l\u2019a dévissée.",
        decouverte: "d.cloche_sans_battant",
      },
      {
        id: "mur-cordes",
        label: "Le mur des cordes, au fond",
        illustration: "assets/scene_chapelle_mur_cordes_v3_c.png",
        approche:
          "Tu remontes la nef courte. L'odeur de chanvre vieux prend à la " +
          "gorge à mesure — une odeur grasse, presque animale, qui n'a rien " +
          "d'une odeur d'église.",
        savoir: "savoir_corde_vive",
        // Enrichissement §7 : trois cordes portent la même date — le Bailli,
        // sa fille, et un troisième nom ARRACHÉ (le Renonçant qui a tenté de
        // les défendre). Une ligne, jamais un discours.
        decouverte: "d.trois_cordes",
        examen:
          "Des dizaines de cordes coupées, clouées en rangs, chacune " +
          "étiquetée d'un nom à l'encre pâle. Ce ne sont pas des trophées. Ce " +
          "sont des reliques — chaque corde « a tenu » quelqu'un. L'une " +
          "d'elles bouge quand tu ne la regardes pas : la troisième du rang " +
          "bas, sans étiquette, plus claire que les autres. Tu note où elle " +
          "est. Ce genre de chose, on préfère savoir où ça se trouve avant " +
          "que ça sache où tu te trouves. Plus bas, trois cordes portent la " +
          "même date. Deux noms se lisent encore : celui du Bailli, et un " +
          "prénom de fille. Le troisième a été arraché avec l'étiquette.",
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
    illustration: "assets/monstre_veuve_cordes_v2_a.png",
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
        nature: "exploration",
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
        nature: "social",
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
      {
        id: "corde-vive",
        tags: ["citable"],
        label: "Saisir la corde vive",
        locked: { stat: "COURAGE", min: 4 },
        passive: {
          consequence:
            "Tu refermes la main dessus. Elle tire — une fois, fort, comme " +
            "une bête ferrée — puis s'arrête net en comprenant que tu ne " +
            "lâches pas. Sous tes doigts, un pouls. Pas le tien. La Veuve " +
            "lève les yeux de son ouvrage : « Elle t'a jaugé. Repose-la. »",
        },
      },
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
    illustration: "assets/scene_puits_condamne_v2_a.png",
    chainNext: "puits-condamne-2",
    narration: [
      "Sur la place arrière du hameau, un puits — condamné de frais : " +
        "planches neuves, chaînes croisées, cadenas encore gras. Tout le " +
        "reste du hameau tombe en ruine douce, mais ça, on l'entretient. " +
        "Par-dessus les planches, on a empilé des pierres — pas des moellons " +
        "de mur : des blocs de meule, que deux hommes ne soulèveraient pas.",
      "Et dessous, ça cogne. Trois coups, une pause. Trois coups. Poli, " +
        "presque — comme on frappe à une porte dont on sait qu'on va vous " +
        "ouvrir.",
    ],
    choices: [
      {
        id: "ecouter-puits",
        nature: "surnaturel",
        tags: ["citable"],
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
      {
        id: "noeud-chaines",
        label: "Étudier le nœud",
        locked: { stat: "RUSE", min: 4 },
        passive: {
          consequence:
            "Le nœud des chaînes est un travail de maître — mais tu lis les " +
            "nœuds comme d'autres les visages, et celui-ci avoue : il a été " +
            "noué DEPUIS le puits. Quelqu'un, en bas, a fermé sa propre " +
            "porte. Les planches ne gardent pas l'intérieur. Elles le protègent.",
        },
      },
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
        nature: "physique",
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
      // 7/08 : la maison se dresse HORS du hameau, à l'ouest — seule.
      "La maison se tient seule à l'ouest du hameau, haute, sans voisine — " +
        "et murée de l'intérieur. Chaque fenêtre bouchée de pierres posées " +
        "depuis dedans, en rangs pressés, par quelqu'un qui s'enfermait " +
        "plus qu'il ne se protégeait. La maison du Bailli. Vide depuis sa " +
        "corde. Pas gardée par personne.",
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
        nature: "exploration",
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
        // Violence publique dans un village qui compte tout : rater, c'est
        // être vu en train de forcer. MARQUÉ (le Soupçon montera double).
        id: "forcer-seuil",
        nature: "physique",
        poseEtatSiEchec: "marque",
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
        nature: "physique",
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
        nature: "physique",
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
        // Enrichissement §7 : un petit signe en forme de plume au bord de la
        // page, à côté de certains noms. JAMAIS expliqué — c'est la marque
        // des Fixations où il était présent, et le joueur ne doit l'apprendre
        // que par recoupement, ou jamais.
        decouverte: "d.signe_plume",
        fait: "fait-bailli",
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
          "droit, à l'encre plus récente que le nom. Et, au bord de la page, à côté de certains " +
          "noms seulement, un petit signe en forme de plume. Rien ne " +
          "l'explique — ni la marge, ni la colonne, ni l'ordre des dates.",
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
      {
        /* Témoignage court §7. La dernière défense qu'on lui ait demandée est
           celle du Bailli — il le dit sans savoir ce qu'il dit. */
        id: "ecrivain-defenses",
        label: "L\u2019interroger sur son travail",
        decouverte: "d.plus_de_defenses",
        passive: {
          consequence:
            "« J\u2019écris les dénonciations et les défenses. Les deux. » Il " +
            "range sa plume avec un soin d\u2019horloger. « Depuis quelques " +
            "années, on me demande plus de défenses. » Il dit ça comme on " +
            "constate une baisse de commandes.",
        },
      },
      { id: "lire-registre", label: "Lire le Registre" },
      {
        /* LE REGISTRE MENT (5/08) — n'apparaît QUE si le compte a lu deux
           versions incompatibles d'un même fait, sur deux vies différentes.
           C'est la seule option du jeu qu'une seule vie ne peut pas ouvrir.
           Sa conséquence est écrite à l'exécution : le héros oppose au greffe
           l'accusation du fait précis qu'il tient (lib/contradictions.ts). */
        id: "registre-ment",
        label: "Le Registre ment",
        requiresContradiction: true,
        soupcon: -1,
        passive: {
          consequence:
            "Tu poses la main à plat sur la page ouverte, et tu dis ce que tu " +
            "sais. L'Écrivain ne lève toujours pas les yeux — mais sa plume " +
            "s'arrête, et le silence qui suit n'est pas le silence de quelqu'un " +
            "qui n'a pas compris.",
        },
      },
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
        nature: "social",
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
      // ⚠️ Ne jamais présupposer d'où vient le héros : cette narration se
      // jouait avec « Passé les murets du hameau… » chez des héros qui n'y
      // étaient jamais entrés (playtest 7/08).
      "Loin de tout muret, la lande est à eux. Tu les vois de loin — et " +
        "c'est mauvais signe : la Meute Grise ne se montre que quand " +
        "l'encerclement est fini. Six silhouettes couleur de bruyère " +
        "morte, immobiles aux six points d'un cercle dont tu es le centre.",
      "Pas des chiens : trop patients. Pas des loups : trop organisés. La " +
        "plus grande s'assoit — le signal. Le cercle se met à tourner, " +
        "lentement, en se resserrant d'un pas par tour.",
    ],
    choices: [
      {
        id: "briser-cercle",
        nature: "physique",
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
        // Gagner le muret avant que le croissant ne se ferme : une course.
        id: "dos-muret",
        nature: "physique",
        tags: ["fuite"],
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
        nature: "physique",
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
        nature: "physique",
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
        nature: "physique",
        label: "Reculer, sans ciller",
        risky: {
          stat: "INSTINCT",
          threshold: 13,
          outcomes: outcomes(
            "20 naturel. Tu recules pas à pas, les yeux dans les siens, sans un frisson. La meneuse te suit — puis s'arrête à la frontière exacte d'un territoire que toi, tu ne vois pas. Elle s'assoit. Te voilà dehors de leur carte : la meute te regarde partir comme on regarde la pluie quitter un champ.",
            "Chaque pas en arrière est un mot de la négociation. Tu la tiens du regard jusqu'au chemin, et le croissant s'effiloche à mesure — une bête qui décroche, puis deux. À la fin, il ne reste que la meneuse, qui te concède la lande d'un battement de paupières.",
            "Ton talon accroche une racine — un quart de seconde de regard perdu. Il ne leur en faut pas plus : la charge t'arrive dessus pendant que tu te rattrapes, te roule, te coûte — puis s'arrête net, croissant reformé, et la meute s'en va. L'épreuve est finie ; tu n'as pas brillé, mais tu es debout.",
            "1 naturel. Tu recules sans baisser les yeux. Eux non plus. Tu recules encore. Eux avancent. Le mur de pierre sèche dans ton dos met fin à la négociation — à leurs conditions. Ils prélèvent, et te laissent contre le muret, vivant par désintérêt. ♦ −2"
          ),
        },
      },
      {
        id: "offrir-viande",
        nature: "physique",
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
        /* RECONTEXTUALISATION MAJEURE (§7) : la Mare n'est pas une curiosité
           inoffensive, c'est l'outil de dépistage du village. On y AMÈNE ceux
           qu'on soupçonne — d'où le second creux, derrière le premier. */
        id: "creux-doubles",
        illustration: "assets/scene_mare_creux_doubles_v2_b.png",
        label: "Les creux dans la berge",
        approche:
          "Tu longes la berge jusqu\u2019à l\u2019endroit où la terre est " +
          "tassée, luisante, usée jusqu\u2019à la pierre. On s\u2019agenouille " +
          "ici depuis longtemps.",
        examen:
          "Les creux de genoux sont doubles. Une paire devant, au ras de " +
          "l\u2019eau. Une autre juste derrière, plus large, plus profonde — " +
          "et orientée dans le même sens. Quelqu\u2019un se tenait toujours " +
          "au-dessus de celui qui se penchait. Ce n\u2019est pas un endroit " +
          "où l\u2019on vient voir son reflet : c\u2019est un endroit où on " +
          "l\u2019amène.",
        decouverte: "d.mare_depistage",
      },
      {
        id: "berge-usee",
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
        illustration: "assets/scene_mare_eau_reflet_v2_b.png",
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
        // « Eau de la Mare » — source de FIÉVREUX listée par la spec. Le
        // pari est honnête : réussir, c'est boire sans rien attraper.
        id: "boire-mare",
        nature: "surnaturel",
        poseEtatSiEchec: "fievreux",
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
    illustration: "assets/scene_mare_aux_regards_2_b.png",
    narration: [
      "Ils arrivent à deux. Le premier s'agenouille dans les creux du " +
        "devant, se penche, et reste penché beaucoup trop longtemps. Le " +
        "second reste debout derrière lui, dans les creux du fond, et ne " +
        "regarde pas l'eau : il regarde la nuque de l'autre.",
      "Personne ne parle. Ce n'est pas une prière — c'est un examen, et il " +
        "a manifestement une procédure.",
      "Quand le premier se relève, il a le visage de quelqu'un qui va " +
        "rentrer chez lui et fermer ses volets pour toujours. Le second lui " +
        "met une main sur l'épaule, presque avec douceur, et le raccompagne.",
    ],
    choices: [
      {
        id: "aborder-renoncant-mare",
        nature: "social",
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
    tags: ["food_available"],
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
        illustration: "assets/scene_verger_fruits_cendre_v2_c.png",
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
        label: "La souche, au bout du rang",
        illustration: "assets/scene_verger_souche_a_c.png",
        approche:
          "Au bout du rang, un arbre manque. Sa souche est nette, sciée à " +
          "hauteur de genou, et le bois de coupe est gris.",
        examen:
          "Le premier arbre du verger, abattu net. Les cernes sont réguliers " +
          "jusqu'aux dernières années — puis serrés, noirs, illisibles. " +
          "L'arbre a compris avant les hommes où il poussait. Quelqu'un l'a " +
          "abattu pour ne pas avoir à le lire. En te relevant, tu comptes " +
          "les rangs par habitude, et le compte te reste dans la tête : " +
          "onze vergers replantés sur une terre qui n'a jamais rien donné.",
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
        nature: "surnaturel",
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
    illustration: "assets/scene_verger_noir_2_v2_b.png",
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
        nature: "exploration",
        label: "Sortir des rangs",
        risky: {
          stat: "INSTINCT",
          threshold: 11,
          outcomes: outcomes(
            "20 naturel. Tu sors des rangs par le bon côté — celui d'où l'on voit encore le hameau. Derrière toi, dans l'ordre parfait des arbres, tu remarques ce que tu n'avais pas vu en entrant : les rangs ne sont pas droits. Ils s'incurvent, très légèrement, tous, vers le sud.",
            "Tu retrouves la sortie du premier coup. Les rangs se referment derrière toi et le verger redevient une tache noire sur la lande.",
            "Tu tournes deux fois dans les mêmes rangs avant de retrouver la lisière. Onze rangs, ce n'est pas un labyrinthe. Ça n'aurait pas dû prendre si longtemps.",
            "1 naturel. Tu sors des rangs. Le compte à voix basse, derrière toi, s'est arrêté au moment exact où tu as passé la porte. ♦ −2"
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
        nature: "social",
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
      "Tu sais ce que tu as : rien. Tu arrives ici comme tout le monde y " +
        "arrive — les mains vides et mort.",
    ],
    choices: [
      {
        /* Témoignage court §7 : les Époux la croisent tous les jours et la
           saluent. Ils ne trouvent rien d'anormal — ils ont renoncé à
           trouver quoi que ce soit d'anormal, c'est leur tâche absorbante. */
        id: "epoux-la-dame",
        label: "Demander qui passe par ici",
        decouverte: "d.fille_apercue",
        passive: {
          consequence:
            "« Personne. » L\u2019homme bêche. Puis, sans s\u2019arrêter : « La " +
            "jeune, des fois. Elle passe entre les rangs. On se dit " +
            "bonjour. » Sa femme ne dit rien. Il bêche un peu plus vite " +
            "qu\u2019avant.",
        },
      },
      {
        id: "epoux-rien",
        nature: "social",
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
        nature: "social",
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
    tags: ["climb"],
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
        illustration: "assets/monstre_veilleur_palissade_v2_b.png",
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
        nature: "exploration",
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
        nature: "social",
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
      "Elle ne l'est pas tout à fait. Tout en haut, au-dessus du vide, une " +
        "marque — une seule, d'une autre main. Il ne la voit pas : sa " +
        "planche commence en bas.",
    ],
    choices: [{ id: "veilleur-passer", label: "Passer le portillon" }],
    jailerLine: "Une colonne des retours. Vide depuis trente ans. J'adore les optimistes — ils tiennent la comptabilité pour moi.",
  },
  {
    id: "palissade-sud-2",
    // Fin de zone : quoi qu'on fasse au pied de la Palissade, on descend.
    chainNext: "la-descente",
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
        nature: "social",
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
      {
        /* Le verrou DUR « tease Acte II » est LEVÉ (arbitrage 9/08) : la
           Palissade est la fin de zone, on la franchit. C'est l'écran de la
           Descente qui dit maintenant que la suite n'est pas bâtie. */
        id: "franchir-descente",
        label: "Franchir la Descente",
        tags: ["citable"],
        passive: {
          consequence:
            "Le Veilleur ne t\u2019arrête pas. Il pousse le portillon et se " +
            "range, comme on s\u2019écarte d\u2019un convoi. Derrière toi, la " +
            "lanterne reste allumée en plein jour \u2014 pour le suivant.",
        },
      },
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
    illustration: "assets/scene_proces_du_heros_v4_c.png",
    fixationTrial: true,
    narration: [
      "Ils ne te courent pas après — ils t'attendent au tournant du muret, " +
        "le hameau entier, dans ce silence de gens qui ont déjà décidé. On " +
        "ne te touche pas. On marche autour de toi, jusqu'au Petit Tribunal.",
      // ⚠️ Les dépositions des TÉMOINS (lib/temoins.ts) s'insèrent ICI, entre
      // ces deux paragraphes — écrites à l'exécution depuis ce que le joueur a
      // réellement fait. Ce paragraphe-ci doit donc rester la SENTENCE, jamais
      // l'accusation (sinon elle serait dite deux fois).
      "La Doyenne laisse le silence retomber, puis referme le cahier de " +
        "l'Écrivain d'une main. L'Ordonnance de la Fixation s'applique. À " +
        "moins que tu ne parles mieux qu'eux.",
    ],
    choices: [
      {
        id: "plaider-serre",
        nature: "social",
        label: "Plaider serré",
        defense: "discrediter",
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
        nature: "social",
        label: "Prendre le hameau à témoin",
        defense: "emouvoir",
        risky: {
          stat: "EMPATHIE",
          threshold: 13,
          highStakes: true,
          outcomes: outcomes(
            "20 naturel. Tu ne te défends pas : tu les regardes un par un, et tu nommes ce que chacun a laissé au muret — la hâte, la lame, la langue. Le tribunal se souvient qu'il est un hameau. On te raccompagne au seuil, et c'est presque des excuses.",
            // ⚠️ Ne jamais faire NOMMER le Bailli par le héros : rien ne
            // garantit qu'il ait appris qui pend là-haut (retour 7/08).
            "Tu parles de leurs morts fixés, de la peur qui juge à leur place — et de celui qui pend là-haut sans que personne n'ose plus dire son nom. Des nuques plient sur les bancs. La Doyenne tranche, lasse : « Qu'il marche. La lande jugera mieux que nous. »",
            "Tu cherches leurs yeux — ils regardent tous la corde. Ce n'est pas de la haine, c'est du soulagement : quelqu'un d'autre qu'eux. À l'aube, on te fixe, proprement, avec les égards dus à ce qu'on craint.",
            "1 naturel. Ton appel réveille exactement le souvenir qu'il ne fallait pas : la dernière qui a supplié ainsi s'est relevée de sa corde. Cette fois, ils feront mieux. Double nœud. ♦ −2"
          ),
        },
      },
      {
        /* ASSUMER — toujours disponible. C'est la défense du Courage : ne rien
           nier, tout reconnaître, et leur demander ce qu'ils comptent en faire. */
        id: "assumer-tout",
        nature: "social",
        label: "Tout reconnaître",
        defense: "assumer",
        risky: {
          stat: "COURAGE",
          threshold: 13,
          highStakes: true,
          outcomes: outcomes(
            "20 naturel. Tu reprends chaque déposition et tu dis oui à chacune, sans un mot d'excuse — puis tu demandes, très calmement, lequel d'entre eux voudrait qu'on lise la sienne à voix haute. Personne ne se rassoit tout à fait pareil. La Doyenne te rend le seuil sans commentaire.",
            "Tu ne nies rien. Tu tiens debout pendant qu'on énumère, et tu regardes celui qui parle jusqu'à ce qu'il s'arrête. Il n'y a rien à retourner contre quelqu'un qui n'a rien caché. On te laisse repartir — mal à l'aise, ce qui est déjà une victoire ici.",
            "Tu reconnais tout, et ils entendent une confession. Le hameau n'a jamais eu besoin de plus. On te remercie presque de leur avoir épargné le doute, et le Champ des Fixés prépare ta place avant même le lever.",
            "1 naturel. Tu reconnais plus que ce qu'ils avaient. Une chose qu'aucun témoin n'avait vue sort de ta bouche, et le silence qui suit a le goût d'une porte qui se ferme. Double nœud, comme pour les honnêtes. ♦ −2"
          ),
        },
      },
      {
        /* PRODUIRE UNE PREUVE — n'apparaît que si la Besace porte un document
           du hameau (registre, carnet, sceau, ordonnance, dénonciation). Seuil
           plus bas : un papier vaut mieux qu'un beau discours, ici. */
        id: "produire-preuve",
        nature: "social",
        label: "Produire un papier",
        defense: "preuve",
        risky: {
          stat: "RUSE",
          threshold: 11,
          highStakes: true,
          outcomes: outcomes(
            "20 naturel. Tu poses le document sur le banc des témoins, ouvert à la bonne page, et tu te tais. L'Écrivain se penche malgré lui — puis se redresse très vite. Ce que ce papier dit du hameau vaut infiniment plus cher que ce que le hameau dit de toi. On te raccompagne, et on ne te demande pas de le rendre.",
            "Tu produis le papier. Il ne t'innocente pas : il rappelle simplement qui tient les comptes, et depuis quand. La Doyenne le lit deux fois, referme, et dit qu'on verra plus tard. Plus tard, ici, veut dire jamais — et jamais, aujourd'hui, veut dire libre.",
            "Tu produis le papier, et tu comprends en le tendant que tu viens d'avouer d'où il vient. On ne te juge plus pour la voix : on te juge pour le vol. C'est un motif plus propre, et il tient aussi bien une corde.",
            "1 naturel. Le papier passe de main en main et s'arrête sur une ligne que tu n'avais pas lue. Ton nom y est déjà, dans une écriture qui n'est pas la tienne, avec une date qui n'est pas encore arrivée. Le tribunal n'a plus qu'à respecter le calendrier. ♦ −2"
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
      "{n}. Tu sais combien en sont morts sur ce chiffre exact ? Moi oui.",
      "Ah. J'avais parié plus haut. Je perds rarement — profite.",
      "{n}. Ce n'est pas de la malchance. C'est une moyenne.",
      "Tu tiens le dé comme on tient une promesse. Ça se voit, et ça ne sert à rien.",
      "Un {n}. Je note l'heure aussi. On ne sait jamais ce qui servira.",
      "Tu recommenceras. Ils recommencent tous. C'est ce qui me nourrit.",
      "{n}. Le Domaine n'a pas triché. Il n'en a pas besoin.",
      "J'aime ce moment. Celui où tu comprends que le chiffre est tombé.",
      "Un {n}. Je te dirais bien que ce n'est pas grave. Je mens mal.",
      "{n}. Trois avant toi ont eu ce chiffre ce matin. Deux dorment déjà.",
      "Le dé ne te déteste pas. Ce serait un progrès, s'il te détestait.",
      "{n}. Tu regardes le dé comme s'il pouvait changer d'avis.",
      "Un {n}, et cette tête. J'ai vu la même exactement, hier, ailleurs.",
      "{n}. Voilà. C'est fait. On peut passer à la suite de ta petite affaire.",
      "Tu voulais un signe. Le voilà : {n}. Interprète-le comme tu veux.",
      "{n}. Rassure-toi, personne ne compte. À part moi. Uniquement moi.",
    ],
    critFail: [
      "La pire face du dé. Je l'encadrerais, si mes murs étaient à moi.",
      "1. Le dé lui-même a eu pitié — puis non.",
      "Le plus petit chiffre qui existe, et il est pour toi. Quelle attention.",
      "Un. Il n'y a rien en dessous. J'ai vérifié, jadis, pour quelqu'un.",
      "Ça, c'est du travail. On ne rate pas si bien par hasard.",
      "Le dé s'est couché sur sa plus mauvaise face, exprès, pour toi.",
      "Un. Le chiffre des débuts et des fins. Devine lequel des deux.",
      "J'ai un endroit où je range ces moments-là. Il est plein.",
      "Le dé a hésité une seconde. Puis il a choisi la cruauté.",
      "Un. Ne dis rien. Écoute plutôt : quelque chose a entendu, lui aussi.",
    ],
    critSuccess: [
      "Un 20. Rare. Je note, je n'applaudis pas.",
      "Un jet parfait. Ne t'y habitue pas.",
      "Le dé s'est trompé en ta faveur. Ça arrive. Une fois.",
      "Bien. Voilà de quoi tenir jusqu'au prochain chiffre.",
      "La meilleure face. Elle ne te doit rien : elle passait par là.",
      "Je préfère quand tu échoues. Mais je reconnais un beau jet.",
      "Le sommet du dé. Souviens-t'en, ça t'aidera à mesurer la chute.",
      "Impeccable. J'inscris ça aussi. Les deux colonnes servent.",
      "Tu viens d'être chanceux. Le mot juste, c'est chanceux.",
      "Vingt. Le Domaine te laisse ce point. Il compte les siens autrement.",
    ],
  },
  interesse: {
    fail: [
      "Un {n}. Tu vaux mieux que ça, d'habitude. C'est nouveau, ça, « d'habitude ».",
      "{n}. J'ai fini par retenir ton nom. Ne me le fais pas regretter.",
      "Le dé hésite sur toi, maintenant. Moi aussi.",
      "{n}. Ce n'est pas ton meilleur jour. J'en ai vu de meilleurs — les tiens.",
      "Un {n}. Tu vas t'en remettre. C'est bien ce qui m'intrigue.",
      "{n}. Tu tombes moins bêtement qu'avant. Je ne sais pas si c'est bon signe.",
      "Je m'attendais à mieux. Note bien : je m'attends à quelque chose, désormais.",
      "{n}. Tu as failli. Failli m'intéresse plus que raté.",
      "Un {n}, et tu restes debout. On me l'aurait dit, la semaine dernière.",
      "{n}. Tu apprends à perdre. C'est la moitié du chemin, ici.",
      "Le chiffre est mauvais. Ta façon de le prendre l'est moins.",
      "{n}. Curieux. Tu ne fais plus les mêmes erreurs — tu en trouves de neuves.",
      "Un {n}. Je te regarde, en ce moment. Ça devrait t'inquiéter.",
      "{n}. Tu commences à peser dans mes comptes. Un peu.",
      "Ce n'est pas le dé qui t'a manqué. Nous le savons tous les deux.",
    ],
    critFail: [
      "Un 1. De ta part, ça me surprend presque. Presque.",
      "La pire face possible. Tiens. Toi qui tenais si bien.",
      "Un. Après tout ce chemin. Le Domaine a de l'humour, à sa façon.",
      "Voilà qui gâche une belle série. J'en suis presque contrarié.",
      "Un. Je ne me moque pas. Note bien le moment : je ne me moque pas.",
      "Le dé t'a lâché. Il ne lâche que ceux qu'il a tenus.",
      "Un. Ça, c'est le genre de chiffre qui décide d'une histoire.",
      "Tu ne méritais pas ce jet. Je le dis rarement.",
      "Un. Relève-toi vite. Certains, ici, ne se relèvent pas de moins.",
      "Le pire chiffre, et tu es encore là. Pour l'instant.",
    ],
    critSuccess: [
      "Un 20. Je commence à comprendre pourquoi tu dures.",
      "Le dé au sommet. Bien. Continue, que je voie jusqu'où.",
      "Voilà. C'est ça que j'attendais de toi. Recommence.",
      "Parfait. Tu deviens difficile à ranger dans mes colonnes.",
      "Vingt. Tu ne t'es pas contenté de survivre. C'est autre chose.",
      "Beau jet. Je vais devoir revoir ce que je pariais sur toi.",
      "Le dé t'a suivi. Il ne suit pas n'importe qui.",
      "Bien joué. Vraiment. Ne me fais pas répéter, ça m'écorche.",
      "Vingt. Personne ne saura. Moi si. C'est déjà quelque chose.",
      "Le sommet. Tu commences à ressembler à quelqu'un qu'on retient.",
    ],
  },
  respectueux: {
    fail: [
      "Un {n}. Même les meilleurs trébuchent. Relève-toi — je regarde.",
      "{n}. Ce n'est pas la fin. Pas pour toi, pas encore.",
      "Le dé s'est trompé de héros. Ça arrive, même ici.",
      "{n}. Un mauvais chiffre ne défait pas ce que tu as fait avant.",
      "Un {n}. Je ne te compterai pas ça. Pas cette fois.",
      "{n}. Tu as connu pire, et j'y étais.",
      "Le dé te teste. Il ne teste que ce qui résiste.",
      "{n}. Prends le temps. Le Domaine, lui, en a trop.",
      "Un {n}. Je te dirais bien de faire attention. Tu le fais déjà.",
      "{n}. Ce n'est pas la peine de serrer les dents. Je ne note pas les échecs comme les autres, pour toi.",
      "Le chiffre est petit. Ta traversée ne l'est plus.",
      "{n}. Je te regarde encaisser. C'est la partie que je préfère, maintenant.",
      "Un {n}. Ça ne changera rien à la façon dont ça finira. Je le regrette presque.",
      "{n}. Tu tomberas un jour. Ce jour-là, je serai attentif.",
      "Le dé n'a pas voulu. Toi, si. C'est la différence.",
    ],
    critFail: [
      "Un 1. J'en ai vu mille avant toi. Aucun ne m'avait manqué. Toi, si.",
      "La pire face, au pire moment. Si tu tombes ici, je retiendrai le jour. Je te le dois.",
      "Un. Après ce que tu as traversé, c'est presque indécent.",
      "Le dé n'a aucune mémoire. C'est sa seule vertu, et son seul défaut.",
      "Un. Je n'aime pas ce chiffre sur toi. Voilà, c'est dit.",
      "Ce jet-là ne te ressemble pas. Le Domaine s'en moque, mais moi je l'ai noté.",
      "Un. Tiens bon. Je n'ai pas fini de te regarder marcher.",
      "Le pire chiffre. Il faudra plus que ça, et le Domaine le sait.",
      "Un. Certains se seraient arrêtés là. Pas toi. Enfin — j'espère.",
      "Le dé s'est couché. Reste debout, toi.",
    ],
    critSuccess: [
      "Un 20. Voilà pourquoi ton nom monte dans le Registre.",
      "Rien à redire à ce jet. Propre. Tu n'es plus tout à fait un divertissement.",
      "Le sommet du dé, et tu ne t'en vantes même pas. C'est ce qui me retient.",
      "Vingt. Je ne dirai pas que tu l'as mérité. Je le penserai.",
      "Parfait. Un jour, quelqu'un racontera ce jet. Probablement moi.",
      "Le dé et toi allez dans le même sens. Profite : ça ne dure jamais.",
      "Vingt. Tu commences à me coûter des paris.",
      "Beau. Franchement beau. Ne me demande pas de le répéter.",
      "Le meilleur jet possible. Il te va bien.",
      "Vingt. Le Registre s'en souviendra. J'y veille.",
    ],
  },
};

export function jailerTaunt(
  result: number,
  posture: JailerPosture = "amuse",
  vues: string[] = []
): { text: string; gabarit: string } {
  const pools = JAILER_BY_POSTURE[posture];
  const pool = result === 1 ? pools.critFail : result === 20 ? pools.critSuccess : pools.fail;
  // Dédup intra-run (retour Patrick 8/08 : « il répète souvent les mêmes
  // phrases dans une même run »). Les pools ont été multipliés par cinq, mais
  // un tirage sans mémoire répète quand même — on compare sur le GABARIT
  // (avant substitution de {n}), sinon deux résultats différents feraient
  // passer la même phrase pour neuve.
  const frais = pool.filter((t) => !vues.includes(t));
  const el = frais.length ? frais : pool;
  const gabarit = el[Math.floor(Math.random() * el.length)];
  return { text: gabarit.replace("{n}", String(result)), gabarit };
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

/**
 * ═══ APPARITION 3 — LE TÉMOIN (refonte 6/08, §5) ════════════════════════════
 * La troisième et dernière. Elle ne se joue qu'à ton propre procès, et
 * seulement si tu l'as déjà entrevu — sinon on ne franchit pas les degrés,
 * on saute à la fin.
 *
 * ⚠️ Elle est INJECTÉE dans le procès existant (comme les dépositions des
 * témoins), au lieu d'être une scène-variante : dupliquer la scène
 * dupliquerait ses quatre défenses, qui divergeraient au premier correctif.
 *
 * ⚠️ Garde-fou §8 : ne JAMAIS montrer ce qu'il y a sous le manteau. Il n'a
 * pas de visage, il a une attention. Et ce n'est pas lui qui tue — c'est le
 * vieux qui donne l'ordre. C'est tout le propos du personnage : il ne
 * condamne personne, il regarde des hommes le faire.
 */
export const APPARITION_TEMOIN: string[] = [
  "Ils sont douze autour de toi, et pas un ne parle. Puis, tous ensemble, " +
    "ils regardent par-dessus ton épaule.",
  "Il ne marche pas : il arrive, comme une marée qui aurait choisi une " +
    "direction. Les corbeaux quittent les toits et rentrent dans les plis du " +
    "manteau — un par un, et à chaque fois il est un peu plus grand.",
  "Il se penche sur toi. Il n\u2019a pas de visage. Il a une attention.",
  "Il ne fait rien. Il ne dit rien. Il regarde le vieux, et le vieux hoche " +
    "la tête, et c\u2019est le vieux qui donne l\u2019ordre.",
];

/**
 * LE TROUPEAU SANS BERGER (journal 6/08) — le compteur silencieux.
 * Le troupeau GROSSIT d'une run à l'autre (« dix bêtes à la première
 * traversée, dix-huit à la cinquième ») : à chaque Fixation, un troupeau de
 * plus rejoint celui-là, et le village hérite du bétail sans jamais dire
 * d'où il vient. AUCUN texte ne l'annonce — c'est le joueur qui fait le
 * calcul, ou ne le fait pas.
 *
 * ⚠️ Le beat 1 verbatim du journal disait « une trentaine » et le beat 2
 * « trente-deux » — un instantané incompatible avec le principe du compteur
 * énoncé trois lignes plus haut. Le principe prime : le nombre est CALCULÉ,
 * et dit en toutes lettres (jamais un chiffre).
 */
export function tailleTroupeau(runsStarted: number, fixations: number): number {
  return Math.min(58, 10 + 2 * Math.max(0, runsStarted - 1) + 3 * fixations);
}

const LETTRES: Record<number, string> = {
  10: "dix", 12: "douze", 14: "quatorze", 16: "seize", 18: "dix-huit",
  20: "vingt", 22: "vingt-deux", 24: "vingt-quatre", 26: "vingt-six",
  28: "vingt-huit", 30: "trente", 32: "trente-deux", 34: "trente-quatre",
  36: "trente-six", 38: "trente-huit", 40: "quarante", 42: "quarante-deux",
  44: "quarante-quatre", 46: "quarante-six", 48: "quarante-huit",
  50: "cinquante", 52: "cinquante-deux", 54: "cinquante-quatre",
  56: "cinquante-six", 58: "cinquante-huit",
};

export function ligneTroupeau(n: number): string {
  const pair = n - (n % 2);
  const bas = LETTRES[pair] ?? "trente";
  const haut = LETTRES[Math.min(58, pair + 2)] ?? "trente-deux";
  return (
    `Tu comptes. ${bas.charAt(0).toUpperCase() + bas.slice(1)}, peut-être ` +
    `${haut}. Elles portent des marques d\u2019oreille, et les marques ne ` +
    `sont pas toutes les mêmes. Tu en relèves cinq différentes. Ce ne sont ` +
    `pas les bêtes d\u2019un seul homme : ce sont les bêtes de cinq hommes, ` +
    `réunies en un seul troupeau, et personne n\u2019est venu les séparer.`
  );
}

/**
 * LES CORBEAUX SUR LES TOITS (spec §5) — le seul signal permanent du Soupçon.
 * Le joueur comprend qu'on le compte bien avant de comprendre pourquoi. Trois
 * paliers, jamais un chiffre de mécanique : le nombre d'oiseaux EST la jauge,
 * et c'est la seule forme sous laquelle une jauge est tolérée ici.
 *
 * Ne sort que dans le hameau (là où l'on dénonce) — ailleurs, les corbeaux de
 * la Colline comptent autre chose (les morts du joueur), et mélanger les deux
 * lectures détruirait les deux.
 */
/**
 * Chaque palier tourne sur plusieurs formulations (rapport IA externe 8/08 :
 * « Ils sont six, alignés, du même côté » servie quatre fois mot pour mot
 * transformait la jauge diégétique en jauge visible). Le NOMBRE reste stable
 * — c'est lui, l'information — mais la phrase change à chaque lecture.
 */
export function corbeauxDuHameau(soupcon: number, step = 0, vues: string[] = []): string | null {
  // Dédup verbatim intra-run (partie de découverte 8/08 : « Ils sont six,
  // alignés, du même côté. » servie 3× dans la même vie — la rotation par
  // pas ne suffit pas, deux arrivées de même parité retombent dessus).
  const pick = (pool: string[]) => {
    const frais = pool.filter((t) => !vues.includes(t));
    const el = frais.length ? frais : pool;
    return el[(step * 7) % el.length];
  };
  if (soupcon >= 5)
    return pick([
      "Les toits sont noirs, et ils sont tous tournés vers toi.",
      "Il n'y a plus un faîtage libre. Pas un cri. C'est le silence qui compte.",
      "Tous les toits, un seul côté, une seule direction — la tienne.",
    ]);
  if (soupcon >= 3)
    return pick([
      "Ils sont six, alignés, du même côté.",
      "Six, sur le faîtage d'en face. Tu changes de rue : le compte ne change pas.",
      "Six corbeaux se posent quand tu débouches dans la rue — sans un cri, sans une dispute, comme des gens qui prennent leur poste.",
    ]);
  if (soupcon >= 1)
    return pick([
      "Un corbeau sur le faîtage.",
      "Un corbeau te suit de toit en toit, sans se presser.",
      "Un corbeau descend d'un cran quand tu passes, comme on se rapproche pour mieux entendre.",
      "Il y a un corbeau sur le toit d'en face. Il y était déjà dans l'autre rue.",
      "Un seul corbeau, posé de biais. Il ne cherche pas sa nourriture : il cherche un angle.",
    ]);
  return null;
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
  // ⚠️ La Bête n'est PLUS une destination du pool (playtest 7/08 : tirée
  // 5 runs sur 6, parfois SUIVIE du lieu « Chemin Creux » où l'on arrivait
  // « à neuf » après avoir combattu sa bête). Elle EMBUSQUE désormais la
  // route du Chemin Creux — voir la branche toDest d'advance() et son
  // chainNext : le combat, puis le lieu.
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
/**
 * ⚠️ La PALISSADE SUD n'est pas tirable : c'est la SORTIE de zone (arbitrage
 * 9/08). On l'atteint quand la traversée est faite, jamais au hasard — sinon
 * le jeu annonce « la Descente n'est plus loin » puis rend le joueur à la
 * rotation, ce qui revient à lui retirer l'objectif qu'il vient d'atteindre.
 */
export const SORTIE_DE_ZONE = "palissade-sud";
export const TRAVERSAL_POOL = Object.keys(APPROACH).filter((id) => id !== SORTIE_DE_ZONE);

/**
 * NOM AFFICHABLE d'un lieu depuis un id de scène (spec 4/08, point A1 : le
 * rappel de contexte sous « Reprendre »). Le runtime n'avait aucun nom
 * français — ils vivaient tous dans data/zones/landes.json, jamais chargé.
 * Table par RADICAL (les beats -2/-3 et les rencontres rattachées retombent
 * sur leur lieu), fallback « En chemin » pour les liaisons générées.
 */
const LIEU_NOM: Record<string, string> = {
  "borne-frontiere": "La Borne Frontière",
  "chemin-creux": "Le Chemin Creux",
  "bete-chemins-creux": "Le Chemin Creux",
  marcheur: "Le Chemin Creux",
  "colline-aux-gibets": "La Colline aux Gibets",
  "pendu-qui-parle": "La Colline aux Gibets",
  "champ-des-fixes": "Le Champ des Fixés",
  "pendu-mal-fixe": "Le Champ des Fixés",
  /* ⚠️ Le SEUIL et le VILLAGE portaient le même nom (retour Patrick 6/08 :
     « dans le hameau des Renonçants, il y a le hameau des Renonçants — c'est
     répété deux fois »). Le doublon venait de là : le lieu-porte s'appelait
     comme la région qui contient les six lieux intérieurs.

     La séquence d'ENTRÉE se joue à la barrière, dehors — c'est le Seuil.
     La HALTE se joue dans la grange, dedans — c'est le village. Les nommer
     séparément supprime le doublon ET dit la vérité géographique. */
  "serment-hameau": "Le Seuil du Hameau",
  "hameau-entree": "Le Seuil du Hameau",
  "hameau-accueil": "Le Seuil du Hameau", // les 6 accueils tirables (6/08)
  "gamin-murets": "Le Seuil du Hameau",
  "femme-seuil": "Le Seuil du Hameau",
  /* La halte se joue DANS la grange — la nommer « Le Hameau des Renonçants »
     répétait le nom de la région entière (retour Patrick 6/08 : « dans le
     hameau des Renonçants, il y a le hameau des Renonçants »). Le refus du
     Serment, lui, se passe dehors contre un mur du village. */
  "hameau-halte": "La Grange des Renonçants",
  "hameau-halte-dehors": "Le Hameau des Renonçants",
  "marche-muet": "Le Marché Muet",
  "tour-de-guet": "La Tour de Guet effondrée",
  campement: "Le Moulin sans Ailes",
  "chapelle-des-cordes": "La Chapelle des Cordes",
  "puits-condamne": "Le Puits Condamné",
  "chien-du-bailli": "La Maison du Bailli",
  "petit-tribunal": "Le Petit Tribunal",
  "proces-du-heros": "Le Petit Tribunal",
  "mare-aux-regards": "La Mare aux Regards",
  "verger-noir": "Le Verger Noir",
  epoux: "Le Verger Noir",
  "meute-grise": "La Lande",
  "palissade-sud": "La Palissade Sud",
  veilleur: "La Palissade Sud",
  hesitant: "La Borne Frontière",
  descente: "La Descente",
};

export function lieuNom(sceneId: string | undefined): string {
  if (!sceneId) return "En chemin";
  // Radical : on rogne les suffixes de beat (-2, -3…) puis on cherche du plus
  // long préfixe au plus court — « hameau-entree-4 » → « hameau-entree ».
  let id = sceneId.replace(/-\d+$/, "");
  while (id) {
    if (LIEU_NOM[id]) return LIEU_NOM[id];
    const i = id.lastIndexOf("-");
    if (i < 0) break;
    id = id.slice(0, i);
  }
  return "En chemin";
}

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
  // ⚠️ La Maison du Bailli (`chien-du-bailli`) N'EST PLUS ici : décision
  // Patrick 7/08 — elle se dresse À L'OUEST, HORS du hameau. Un Bailli
  // n'habite pas au milieu de ceux qu'il juge.
  "petit-tribunal",
  "puits-condamne",
  "marche-muet",
];

/** La séquence d'arrivée au Hameau (5 beats garantis, hors tirage). */
const HAMEAU_GATE = "serment-hameau";

/**
 * L'ACCUEIL DU JOUR (6/08). Le 3e beat de l'entrée est un SLOT : la façon dont
 * le village te reçoit change à chaque vie, la suite (le Serment au muret) ne
 * change jamais. `hameau-entree-3` (le barrage des trois hommes) reste dans le
 * lot — il ne tombe plus qu'une fois sur sept.
 *
 * `requiert` : deux accueils ne sont pas tirables d'emblée. Le mur de craie ne
 * veut rien dire tant qu'on n'a pas laissé de noms derrière soi ; le départ des
 * familles suppose qu'un serment prêté ici a déjà été trahi — par toi, dans une
 * vie d'avant. Le village a l'air de réagir à ton histoire parce qu'il y réagit.
 */
export const HAMEAU_ACCUEIL_SLOT = "hameau-entree-3";

export type AccueilHameau = {
  id: string;
  /** Condition d'apparition, évaluée sur la mémoire du compte. */
  requiert?: "deuxMorts" | "sermentTrahiJadis";
};

export const HAMEAU_ACCUEILS: AccueilHameau[] = [
  { id: "hameau-entree-3" }, // le barrage des trois hommes
  { id: "hameau-accueil-volet" },
  { id: "hameau-accueil-enfant" },
  { id: "hameau-accueil-table" },
  { id: "hameau-accueil-cloche" },
  { id: "hameau-accueil-mur", requiert: "deuxMorts" },
  { id: "hameau-accueil-depart", requiert: "sermentTrahiJadis" },
];

/**
 * Tire l'accueil d'une vie. Jamais celui de la vie précédente (même règle
 * anti-répétition que la rotation musicale) — c'est ce qui fait la différence
 * entre « varié » et « aléatoire ». Déterministe une fois tiré : l'id est
 * rangé dans la run, la reprise ne re-tire pas.
 */
export function pickAccueil(opts: {
  deaths: number;
  sermentTrahiJadis: boolean;
  precedent?: string;
  seed: number;
}): string {
  const ouverts = HAMEAU_ACCUEILS.filter((a) =>
    a.requiert === "deuxMorts"
      ? opts.deaths >= 2
      : a.requiert === "sermentTrahiJadis"
        ? opts.sermentTrahiJadis
        : true
  ).map((a) => a.id);
  const neufs = ouverts.filter((id) => id !== opts.precedent);
  const pool = neufs.length > 0 ? neufs : ouverts;
  return pool[Math.floor(seeded(opts.seed) * pool.length)];
}

/** Un lieu est-il à l'intérieur du village ? (tolère les écrans « -2 »). */
export function isHameauInterior(id: string | undefined): boolean {
  if (!id) return false;
  const base = id.replace(/-2$/, "");
  return HAMEAU_INTERIOR.includes(base) || base.startsWith("hameau-");
}

/**
 * Où les corbeaux se comptent : le village et ses abords immédiats — là où
 * l'on dénonce. Ailleurs, les corbeaux de la Colline comptent autre chose
 * (les morts du joueur) ; mélanger les deux lectures détruirait les deux.
 */
export function estHameau(id: string): boolean {
  const base = id.replace(/-\d+$/, "");
  return (
    isHameauInterior(base) ||
    base === "serment-hameau" ||
    base === "femme-seuil" ||
    base === "gamin-murets"
  );
}

/** Ambiances de marche génériques (spec 21/07) — FALLBACK quand aucune liaison
    contextuelle ne s'applique. Comptent dans le pool des ~30 (chantier 4). */
// Fond de liaison NEUTRE : jouable partout, y compris d'une ruelle du hameau à
// l'autre — ces phrases n'affirment aucun décor.
const LIAISON_AMBIANCES: string[] = [
  "Le vent pousse une odeur de corde mouillée et de terre retournée. Quelque part, toujours, une potence grince.",
  "Un long moment sans rien : juste tes pas, et la sensation d'être compté par quelque chose que tu ne vois pas.",
  "Le chemin se creuse, remonte, se divise. Ici, on ne va pas quelque part — on s'éloigne de la Borne.",
  "Un berger recoud une sangle, assis sur une pierre, son bâton en travers des genoux. Il tire sur le fil, vérifie, tire encore. Rien d'autre. C'est reposant comme un feu éteint.",
  "Quelqu'un a empilé des pierres plates en tas régulier au bord du chemin, pour plus tard, pour un muret. Le travail est propre. Celui qui l'a fait comptait revenir.",
  "Une alouette monte, chante, retombe. Tu la suis des yeux jusqu'au bout. Il ne se passe rien d'autre, et pendant un instant, c'est exactement ce qu'il fallait.",
];

// Fond de liaison de PLEINE LANDE : ces phrases nomment la bruyère, les talus,
// l'horizon — elles seraient fausses entre deux murets du hameau (audit
// d'immersion 8/08). Ajoutées au fond seulement quand on ne part pas du village.
const LIAISON_AMBIANCES_LANDE: string[] = [
  "Tu marches. La lande ne finit pas — elle se répète, talus après talus, sous le même crépuscule qui ne tombe jamais.",
  "La bruyère efface derrière toi les traces de ceux qui ont choisi avant. Devant, elle ne promet rien.",
  "Deux silhouettes fauchent la bruyère au loin, à contretemps l'une de l'autre. Le bruit des lames arrive décalé, paisible, comme un vieux couple qui ne se parle plus par confort.",
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
  /** Nombre de liaisons déjà jouées cette run (0 = première Croisée). */
  liaisonsJouees?: number;
  /** Serment prêté au muret — le village ne regarde pas de la même façon
      celui qui a juré, celui qui a menti et celui qui a refusé (6/08). */
  serment?: "jure" | "faux" | "refuse" | null;
  /** Combien de découvertes le COMPTE tient sur la Fille (refonte 6/08).
      C'est ce qui fait passer du degré 2 (on la croise) au degré 3 (elle
      parle) : elle n'adresse la parole qu'à qui a commencé à comprendre. */
  decouvertesFille?: number;
  /** Débuts d'ambiances déjà servies cette run — jamais deux fois le même
      texte verbatim dans une même vie (retour test 4/08 : « je voyais le
      paquet de cartes sous les Landes »). */
  dejaVues?: string[];
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
  /** Serment prêté au muret (6/08). */
  serment?: ("jure" | "faux" | "refuse")[];
  /** Minimum de découvertes sur la Fille (refonte 6/08). */
  minFille?: number;
};

const LIAISON_VARIANTS: LiaisonVariant[] = [
  /* ═══ LA BOUCLE OUEST — les degrés 2 et 3 de la Fille (refonte 6/08, §4) ══
     « Plus tu vas à l'ouest, plus tu risques de la croiser. Plus tu vas à
     l'est, plus tu risques de le croiser, lui. » La zone se lit en deux
     moitiés, et c'est en MARCHANT qu'on l'apprend — jamais par une règle
     énoncée. Ces vignettes ne sortent qu'au départ du Moulin, de la Mare ou
     du Verger : le territoire où le chemin de faîtage du Grand Témoin ne va
     pas, et où elle vivait avant.

     Degré 2 — elle traverse le champ de vision et ne s'arrête pas. Aucune
     condition : c'est le hasard de la route.
     Degré 3 — elle parle en croisant, une phrase, jamais deux. Il faut avoir
     compris quelque chose : elle n'adresse pas la parole à un inconnu qui ne
     sait rien. `minFille` les rend plus spécifiques, donc prioritaires — une
     fois qu'on sait, la croiser sans un mot n'aurait plus de sens. */
  {
    from: ["campement", "mare-aux-regards", "verger-noir"],
    text: "À la berge de la mare basse, quelqu'un est agenouillé — une femme, un châle sombre, les mains dans l'eau noire. Elle se relève sans hâte en t'entendant, s'essuie aux hanches et s'éloigne vers l'ouest. Elle ne se retourne pas. Personne, dans ce pays, ne marche aussi tranquillement.",
  },
  {
    from: ["campement", "mare-aux-regards", "verger-noir"],
    text: "Entre deux rangs du verger, une silhouette immobile. Tu la fixes ; elle attend que tu l'aies bien vue, puis reprend sa marche entre les arbres, du pas de quelqu'un qui rentre chez lui. Les fruits de cendre ne bougent pas sur son passage.",
  },
  {
    from: ["campement", "mare-aux-regards", "verger-noir"],
    text: "Assise sur un muret, à contre-jour. Elle te regarde venir de loin, sans se cacher et sans se lever, puis descend de l'autre côté de la pierre au moment exact où tu arrives à sa hauteur. De ton côté du mur, il n'y a plus personne. De l'autre non plus.",
  },
  {
    from: ["campement", "mare-aux-regards", "verger-noir"],
    minFille: 1,
    text: "Elle croise ta route sans ralentir, à trois pas, comme on croise quelqu'un dans un couloir. « Ne bois pas à la mare basse. Ils y jettent ce qu'ils ne veulent pas enterrer. » Elle est déjà loin quand tu penses à répondre.",
  },
  {
    from: ["campement", "mare-aux-regards", "verger-noir"],
    minFille: 1,
    text: "Elle passe, et elle parle sans tourner la tête. « Tu marches comme quelqu'un qui compte les jours. » Un temps, sa voix déjà derrière toi : « Moi j'ai arrêté au troisième. » Quand tu te retournes, la bruyère se referme sur rien.",
  },
  {
    from: ["campement", "mare-aux-regards", "verger-noir"],
    minFille: 1,
    text: "« Trois corbeaux sur ton toit ce matin. » Elle le dit du ton dont on donne l'heure, sans s'arrêter. « Quatre, c'est le moment de partir. » Tu mets le reste du trajet à décider si c'était un avertissement ou une politesse.",
  },
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
    // « On te retire la maison » est un geste de VILLAGE : la variante est
    // réservée aux départs du hameau (elle jouait partout, jusqu'en pleine
    // lande où aucune maison n'est garantie — audit d'immersion 8/08).
    from: HAMEAU_INTERIOR,
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
    text: "On ne croise plus personne. C'est pire que d'être suivi : tout s'est vidé sur ton passage, comme une rue avant une arrestation.",
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
    text: "Chaque montée coûte. Tu comptes tes forces comme une bourse trop plate — et le chemin le voit, qui te tend ses pentes comme on tend un bras à un vieillard. Tu refuses. Pour l'instant.",
  },
  {
    maxHealth: 0.3,
    text: "Tu t'arrêtes deux fois pour souffler. La deuxième, la pierre où tu poses la main reste marquée de rouge. Le Domaine te goûte déjà.",
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

  // ——— DANS le hameau (3) — retour Patrick 25/07 ———
  // Une fois passé le barrage, on ne « marche plus dans la lande » : on longe
  // des murs. Ces variantes ont la provenance la plus large possible pour
  // couvrir tout déplacement intérieur du village.
  {
    from: HAMEAU_INTERIOR,
    text: "Tu longes les murets d'une ruelle à l'autre. Pas de lande ici : des murs à hauteur d'épaule, des portes closes, et le bruit de tes pas qui revient de trop près.",
  },
  // RESPIRATION (mémo IA externe 8/08) : deux vignettes qui ne cachent
  // RIEN — l'ordinaire vrai, pour que l'inquiétant garde son tranchant.
  // Ne pas leur chercher de double fond : il n'y en a pas, c'est le point.
  {
    from: HAMEAU_INTERIOR,
    text: "Par une porte entrouverte, une odeur de soupe aux herbes. Quelqu'un racle une marmite ; quelqu'un d'autre proteste qu'il en reste. C'est tout. C'est exactement tout.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Deux Renonçants discutent d'une gouttière à refaire, en se passant les mots comme des outils. Aucun des deux ne te regarde passer. La gouttière fuit vraiment.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Un homme affûte une faux sur le pas de sa porte, au rythme lent de qui a tout son temps. Il chantonne faux. La lame est pour l'herbe, le chant pour lui.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Une femme étend du linge encore fumant. Elle jure à mi-voix contre une pince qui saute, la ramasse, recommence. Le drap claque une fois, comme partout ailleurs au monde.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Deux vieux jouent à un jeu de pions sur un banc, avec des cailloux et des fèves. L'un triche. L'autre le sait, et le laisse faire parce que c'est son tour de tricher demain.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Un gamin fait rouler un cerceau de tonneau le long d'un muret, le rattrape, recommence. Il compte ses réussites à voix haute. Il en est à onze, et il est content.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Ça sent le pain. Quelqu'un a ouvert un four quelque part, et pendant dix pas entiers, la rue ne sent que ça.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Le village se traverse en quelques dizaines de pas, et pourtant chaque rue semble tourner pour te faire repasser devant les mêmes fenêtres. Derrière les volets, on compte tes passages.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Une ruelle, une cour, une autre ruelle. Le hameau ne t'empêche pas de circuler — il te laisse faire, et note l'itinéraire.",
  },

  // ——— LA VIE DU VILLAGE (14) — retour Patrick 6/08 : « des petits détails
  // qui montrent encore plus de vie dans le hameau quand on passe d'une scène
  // à une autre ». Une vignette par déplacement intérieur : un geste, une
  // seconde de quotidien qui continue sans toi. Jamais une menace frontale —
  // c'est l'ordinaire qui doit inquiéter, pas l'exception.
  {
    from: HAMEAU_INTERIOR,
    text: "Une femme lave une porte à grande eau, à genoux, en frottant le bas du bois là où il n'y a rien. Elle recommence quand tu passes. Elle recommencera encore après.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Dans une cour, deux hommes réparent un mur qui tient très bien. Ils posent des pierres, les retirent, les reposent — pour avoir les mains occupées quand quelqu'un traverse.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Du linge sèche en travers de la ruelle : des chemises d'hommes, toutes de la même taille, toutes reprisées au même endroit — l'épaule gauche. Tu passes dessous en te baissant.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Un vieux est assis sur une marche, un couteau dans une main, un bout de bois dans l'autre. Il ne taille rien : il enlève de la matière, régulièrement, jusqu'à ce qu'il n'y ait plus de bout de bois. Il en a une pile à côté de lui.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Quelque part derrière un mur, une femme chante à une enfant. La chanson n'a pas de refrain : c'est une liste de choses qu'on ne fait pas. Elle chante bien.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Une porte s'ouvre devant toi, une main jette un fond de seau sur les pavés, la porte se referme. Tu n'as vu que la main. L'eau fume un peu sur la pierre froide.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Trois enfants jouent au bout de la ruelle : l'un compte, face au mur, les autres se cachent. Quand tu approches, celui qui compte s'arrête net — et les cachés ne sortent pas.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Une charrette à bras est appuyée contre une façade, chargée, sanglée, prête depuis assez longtemps pour que la poussière ait pris sur la bâche. Ils sont plusieurs à en avoir une.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Sur un seuil, une écuelle pleine que personne ne vient manger. Elle est là pour un chien, et il n'y a pas de chien dans ce village. On continue à la remplir.",
  },
  {
    from: HAMEAU_INTERIOR,
    text: "Un homme cloue un volet. Depuis l'intérieur. Tu l'entends s'y reprendre à trois fois sur le même clou, puis s'arrêter longtemps, puis recommencer ailleurs.",
  },
  {
    from: HAMEAU_INTERIOR,
    minSoupcon: 3,
    text: "Tu changes de ruelle, et une conversation s'éteint à ton entrée, exactement comme on souffle une lampe. Trois pas plus loin, elle reprend derrière toi — pas la même, plus basse, plus courte.",
  },
  {
    from: HAMEAU_INTERIOR,
    minSoupcon: 4,
    text: "Un gamin marche à ta hauteur, de l'autre côté du muret, sans te regarder. Il s'arrête quand tu t'arrêtes. À l'angle, il tourne avant toi et va dire quelque chose à quelqu'un que tu ne vois pas.",
  },
  {
    from: HAMEAU_INTERIOR,
    serment: ["jure"],
    text: "Une femme te croise et rectifie sa trajectoire — pas pour t'éviter : pour passer du bon côté, celui où l'on passe quand on a juré. Elle ne dit rien. Elle n'a pas eu à réfléchir.",
  },
  {
    from: HAMEAU_INTERIOR,
    serment: ["refuse", "faux"],
    text: "Devant toi, une porte se ferme. Puis la suivante, avant même que tu arrives à sa hauteur. Ce n'est pas de la peur : c'est de l'ordre. Le mot est passé plus vite que tes pas.",
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
  if (v.serment) n += 1;
  if (v.minFille !== undefined) n += 1;
  return n;
}

/** Choisit l'ambiance d'une liaison : la plus spécifique éligible, seedée. */
function pickLiaisonAmbiance(ctx: LiaisonCtx | undefined, seed: number): string {
  // Anti-répétition (retour test 4/08 §2) : un ÉVÉNEMENT de voyage ne revient
  // jamais verbatim dans une même run — seuls les leitmotivs COURTS ont le
  // droit de revenir, et ils vivent dans les scènes, pas ici. Une ambiance
  // déjà servie est écartée ; si tout a été vu, on reprend le pool entier
  // (mieux vaut une répétition tardive qu'un écran muet).
  const deja = ctx?.dejaVues ?? [];
  const neuve = (t: string) => !deja.includes(t);
  if (ctx) {
    const soup = ctx.soupcon ?? 0;
    const health = ctx.health ?? 1;
    const eligible = LIAISON_VARIANTS.filter(
      (v) =>
        neuve(v.text) &&
        (!v.from || (ctx.from !== undefined && v.from.includes(ctx.from))) &&
        (!v.to || (ctx.toOptions !== undefined && v.to.some((t) => ctx.toOptions!.includes(t)))) &&
        (v.minSoupcon === undefined || soup >= v.minSoupcon) &&
        (v.maxSoupcon === undefined || soup <= v.maxSoupcon) &&
        (v.maxHealth === undefined || health <= v.maxHealth) &&
        (!v.chapter || ctx.chapterId === v.chapter) &&
        (!v.carrying || (ctx.itemNames ?? []).some((n) => n.includes(v.carrying!))) &&
        (!v.serment || (ctx.serment != null && v.serment.includes(ctx.serment))) &&
        (v.minFille === undefined || (ctx.decouvertesFille ?? 0) >= v.minFille)
    );
    if (eligible.length > 0) {
      const maxSpec = Math.max(...eligible.map(liaisonSpecificity));
      const top = eligible.filter((v) => liaisonSpecificity(v) === maxSpec);
      return top[Math.floor(seeded(seed + 3) * top.length)].text;
    }
  }
  // Le fond de pleine lande n'entre dans le tirage que si l'on ne part PAS du
  // village : « la bruyère efface tes traces » sonne faux entre deux murets.
  const tout = isHameauInterior(ctx?.from)
    ? LIAISON_AMBIANCES
    : [...LIAISON_AMBIANCES, ...LIAISON_AMBIANCES_LANDE];
  const fond = tout.filter(neuve);
  const pool = fond.length > 0 ? fond : tout;
  return pool[Math.floor(seeded(seed) * pool.length)];
}

// La liaison est l'écran le PLUS fréquent d'une run (une par lieu traversé) :
// c'est ici que le Geôlier se répétait le plus (retour Patrick 8/08). Pool
// porté de 2 à 12 phrases. Toutes doivent tenir en pleine lande ET dans une
// ruelle du hameau — la même liaison sert les deux (audit d'immersion).
const LIAISON_JAILER: string[] = [
  "Marche, marche. Toutes les routes des Landes finissent au même endroit. Je t'y attends.",
  "Tu choisis ton chemin. C'est mignon. Ça ne change que l'ordre des choses.",
  "J'aime les marcheurs. Ils croient que le mouvement est une réponse.",
  "Encore un pas. Encore un. Tu vois comme c'est facile de me suivre ?",
  "Tu as mis moins de temps que le précédent. Il est mort plus loin, cela dit.",
  "Personne ne se perd, ici. On arrive, c'est tout. Certains mettent des années.",
  "Le Domaine ne te suit pas. Il n'en a pas besoin : il est déjà devant.",
  "Tu comptes tes pas ? Non. Moi si. C'est mon métier, pas le tien.",
  "Il y a des jours où je regarde onze mille silhouettes marcher en même temps. Aujourd'hui, je te regarde toi. Profites-en.",
  "Rien ne t'attend au bout. C'est précisément pour ça que tu y vas.",
  "Tu marches bien. Droit, régulier. Ça ne changera rien, mais ça se remarque.",
  "Chaque route que tu ne prends pas, quelqu'un d'autre la prend. Je tiens les deux registres.",
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
/**
 * INDICE DE ROUTE — un fragment sensoriel par destination (retour test 4/08
 * §5 : « le texte préparait une destination, tandis que le bouton en
 * choisissait une autre »). À chaque Croisée, les DEUX directions reçoivent
 * la même grammaire : on ne nomme jamais le lieu, on donne ce que le corps
 * perçoit d'ici. Le joueur imagine les deux avant de cliquer.
 *
 * ⚠️ L'indice s'arrête AU SEUIL du lieu — il ne raconte pas l'approche
 * (`APPROACH_NARRATION` s'en charge à l'arrivée). Sans cette discipline on
 * retombe sur la « double arrivée » : voir le lieu, le choisir, le revoir.
 */
const INDICE_ROUTE: Record<string, string> = {
  "chemin-creux": "un chemin qui s'enfonce entre deux talus",
  "colline-aux-gibets": "une crête hérissée de mâts noirs",
  "pendu-qui-parle": "un gibet bas, à hauteur d'homme, qui bouge sans vent",
  "champ-des-fixes": "des rangées de piquets jusqu'à l'horizon",
  "pendu-mal-fixe": "un craquement de bois, régulier, qui travaille",
  "serment-hameau": "des toits bas et une fumée qui ne monte pas droit",
  "marche-muet": "des bâches tendues et pas une voix",
  "tour-de-guet": "un moignon de tour sans sommet",
  campement: "une masse trapue privée de ses ailes",
  "chapelle-des-cordes": "un clocher court d'où pendent des filins",
  "puits-condamne": "des coups sourds sous des planches clouées",
  "chien-du-bailli": "une maison murée de l'intérieur",
  "petit-tribunal": "une porte basse et trois bancs qu'on devine",
  "mare-aux-regards": "une eau noire où les roseaux ne bougent pas",
  "verger-noir": "des rangs d'arbres qui n'ont plus de feuilles",
  "meute-grise-1": "des silhouettes grises qui se déplacent ensemble",
  "palissade-sud": "une palissade qui coupe l'horizon, une lanterne allumée en plein jour",
};

/**
 * La Croisée présente les deux routes SYMÉTRIQUEMENT, en une phrase.
 * Retombe sur la bifurcation de terrain si un indice manque (jamais une
 * moitié de phrase : soit les deux routes existent, soit aucune).
 */
function croisee(optA: string, optB: string, liaisonsJouees: number, seed: number): string {
  const a = INDICE_ROUTE[optA];
  const b = INDICE_ROUTE[optB];
  if (!a || !b) return phraseBifurcation(liaisonsJouees, seed);
  const routes = `D'un côté, ${a}. De l'autre, ${b}.`;
  // La PREMIÈRE Croisée de la run garde la phrase-signature — mais FONDUE
  // avec les deux indices, pas posée à côté : on ne paie pas la signature
  // d'un bloc de plus, et les deux routes existent dès la première fois.
  // (« La lande attend que tu tranches » saute : c'était la moitié la plus
  // « bouton système » de la phrase.)
  return liaisonsJouees === 0 ? `Deux directions s'ouvrent. ${routes}` : routes;
}

/**
 * LA PHRASE DE BIFURCATION (retour test 4/08 : « Deux directions s'ouvrent.
 * La lande attend que tu tranches » apparaissait TREIZE fois en deux runs —
 * une belle phrase devenue un bouton système). Elle redevient une SIGNATURE :
 * servie à la PREMIÈRE Croisée de la run seulement. Ensuite, la bifurcation
 * se raconte par le terrain — pool seedé, deux liaisons consécutives ne
 * tirent jamais la même (décalage par seed, pool premier avec 9 entrées).
 */
const BIFURCATIONS: string[] = [
  "Le chemin se partage autour d'un muret effondré.",
  "La route cesse d'être une route. Deux traces continuent.",
  "Le passage s'ouvre en deux couloirs.",
  "Il faut quitter la crête par l'un des deux versants.",
  "Le sentier hésite, puis renonce : à toi de trancher.",
  "Une pierre plantée marque la fourche. Personne n'y a gravé de direction.",
  "Les ornières divergent — deux charrois, deux idées du sud.",
  "Deux pentes, deux silences différents.",
  "Le muret t'accompagnait ; il choisit l'un des deux côtés.",
];
function phraseBifurcation(liaisonsJouees: number, seed: number): string {
  if (liaisonsJouees === 0) return "Deux directions s'ouvrent. La lande attend que tu tranches.";
  // (seed×7) mod 9 : 7 et 9 premiers entre eux → deux graines consécutives
  // ne retombent jamais sur la même entrée.
  return BIFURCATIONS[(seed * 7 + liaisonsJouees) % BIFURCATIONS.length];
}

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
    narration: [amb, croisee(optA, optB, ctx?.liaisonsJouees ?? 0, seed)],
    jailerLine: jl,
    choices: [
      { id: `orient-${optA}`, label: APPROACH[optA] ?? "Continuer", orient: { dest: optA } },
      { id: `orient-${optB}`, label: APPROACH[optB] ?? "Continuer", orient: { dest: optB } },
    ],
  };
}

/**
 * LA MANIÈRE D'ARRIVER — une phrase de plus, posée après l'approche du lieu,
 * qui dit COMMENT on y est entré.
 *
 * ⚠️ DÉCISION PATRICK (5/08 soir) : c'est une **variation narrative aléatoire,
 * pas une décision tactique**. Le premier jet du système attachait le mode au
 * CHOIX d'orientation — mais le joueur ne peut pas savoir, avant de choisir,
 * laquelle des deux routes sera couverte : ce n'était donc pas un arbitrage,
 * juste un état découvert après coup. Le mode est maintenant tiré à
 * l'ARRIVÉE, indépendamment de la route prise, et **il n'a plus aucune
 * conséquence mécanique** (ni sur le Soupçon d'arrivée, ni sur la ligne de
 * perception) — un modificateur caché tiré au hasard serait pire qu'un choix
 * opaque. C'est de la couleur, assumée comme telle.
 *
 * ⚠️ Ces phrases ne doivent jamais nommer un lieu (elles servent aux 18
 * destinations) ni annoncer un danger (l'approche s'arrête au seuil, règle du
 * 5/08 sur les doubles arrivées).
 */
// À COUVERT : la couleur d'une arrivée discrète. Aucun effet mécanique.
const ARRIVEE_COUVERT = [
  "Tu es venu par le flanc, le nez au sol. Personne ne t'a vu. Toi non plus.",
  "Tu es passé sous le vent. Rien ne s'est retourné, et tu n'as regardé que tes pieds.",
  "Tu as longé le talus à contre-jour. Mauvais angle pour être reconnu, mauvais angle pour voir.",
  "Tu as coupé par les fougères hautes. Aucun bruit à compter, aucune vue d'ensemble.",
];

// À DÉCOUVERT : la couleur d'une arrivée franche. Aucun effet mécanique.
const ARRIVEE_DECOUVERT = [
  "Tu as pris la route droite. On t'a vu venir — et tu as eu le temps de tout regarder.",
  "Tu n'as rien contourné. Tu arrives par la face, et rien ne t'a échappé en chemin.",
  "Tu es entré par où tout le monde entre. Ça se remarque, et ça permet de voir venir.",
  "Tu as marché droit. Le lieu s'est ouvert devant toi bien avant que tu n'y sois.",
];

/**
 * La phrase d'arrivée, tirée par la graine du pas courant. Le pool est choisi
 * par la parité — pas par le choix du joueur. Anti-répétition : l'appelant
 * passe la liste des phrases déjà servies dans la vie (`vues`) ; si tout le
 * pool est vu, on rouvre le pool entier plutôt que de ne rien dire.
 */
export function phraseArrivee(seed: number, vues: string[] = []): string {
  const pool = Math.abs(seed) % 2 === 0 ? ARRIVEE_COUVERT : ARRIVEE_DECOUVERT;
  const neuves = pool.filter((p) => !vues.includes(p));
  const dispo = neuves.length ? neuves : pool;
  return dispo[Math.abs(seed * 7 + 3) % dispo.length];
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
 * LA COUTURE DU VILLAGE (retour playtest 6/08 soir : « je passe du Fossoyeur
 * à une scène au sein du hameau, c'est incompréhensible »). Quand une marche
 * FRANCHIT la limite du village — dans un sens ou dans l'autre — une ligne le
 * dit AVANT la phrase d'approche. Jouée à l'ARRIVÉE, quand la destination est
 * connue : une ambiance de Croisée ne peut pas la porter, elle décrirait une
 * seule des deux routes (leçon du 5/08).
 */
export const FRANCHIT_ENTREE: string[] = [
  "Les murets se resserrent, et la bruyère cède aux ornières. Te voilà de retour entre les toits du hameau — la barrière est ouverte, et personne ne fait mine de te compter. Ce qui veut dire qu'on a déjà fini.",
  "Le chemin redescend vers les toits gris. Tu repasses la limite du village sans t'en apercevoir tout à fait : un muret, un seuil, et le bruit de la lande qui s'arrête net derrière toi.",
  "Un muret, puis un autre, puis les premiers toits — le village se referme autour de toi sans un bruit, comme une main qu'on a laissée ouverte exprès.",
];

export const FRANCHIT_SORTIE: string[] = [
  "Tu repasses le muret d'enceinte, et le village te lâche d'un coup — plus de toits, plus de volets, plus de regards. La lande reprend, immense, et le vent te retrouve comme s'il t'avait attendu.",
  "Les dernières maisons s'espacent, puis renoncent. Devant toi la bruyère morte reprend ses droits jusqu'à l'horizon. Dans ton dos, quelqu'un referme une porte, sans se presser.",
  "Le dernier seuil passé, la lande te reprend sans transition — le vent d'abord, l'espace ensuite. Derrière toi, le village continue de se taire, mais autrement.",
];

/**
 * Phrase d'APPROCHE d'un lieu (retour playtest 24/07 : « sans marcher et voir
 * le hameau au loin ») : jouée à l'arrivée, AVANT la description du lieu. On
 * voit la destination se dresser, on y marche — la transition est vécue, pas
 * sautée. Jamais un danger frontal : juste l'approche sensorielle.
 */
export const APPROACH_NARRATION: Record<string, string> = {
  "chemin-creux": "Le sol se creuse sous tes pas, et le ciel se rétrécit à mesure que tu descends.",
  "bete-chemins-creux": "Quelque chose, devant, t'a senti avant que tu le sentes.",
  "colline-aux-gibets": "Tu montes. Les mâts deviennent des potences.",
  "pendu-qui-parle": "Tu contournes la crête. Ce que tu prenais pour un épouvantail tourne la tête.",
  "champ-des-fixes": "L'horizon se hérisse de piquets réguliers, rangée après rangée, jusqu'à se perdre. Tu approches d'un champ qu'on n'a pas semé — on l'a planté d'hommes.",
  "pendu-mal-fixe": "Un craquement rythme ta marche, régulier, mécanique — du bois qui travaille sous un poids. Devant, une corde trop lâche laisse glisser ce qu'elle devait tenir.",
  "serment-hameau": "De la fumée basse, pas une flamme : des toits gris tassés derrière leurs murets. Le Hameau des Renonçants se découvre lentement, et déjà tu sens qu'on t'a vu venir de loin.",
  "tour-de-guet":
    "Le moignon de la tour grossit à mesure que tu montes le tertre — plus bas que tu ne croyais, et couché de biais, comme un os mal ressoudé. Tu arrives à son pied.",
  "marche-muet": "Un bourdonnement de foule sans une seule voix te parvient — des dizaines de gens qui s'affairent en silence. Tu entres dans le marché muet du hameau.",
  // Le Moulin est en PLEINE LANDE : on y arrive de n'importe où, pas
  // forcément du village — « tu quittes les toits » présupposait le hameau
  // (trouvé le 9/08 en jouant le kit hors navigateur).
  "campement": "Une masse trapue se détache du crépuscule, plus large que haute, et grandit à chaque pas.",
  "chapelle-des-cordes": "Une bâtisse sans croix se dresse au bout d'une ruelle. En approchant, tu vois par la porte ouverte que les murs, à l'intérieur, remuent doucement — des cordes, des dizaines, sans un souffle d'air.",
  "puits-condamne": "Un bruit sourd te guide entre les maisons : trois coups, une pause, trois coups.",
  "chien-du-bailli": "À l'ouest, une haute toiture seule au-dessus de la bruyère. Sur le seuil, une masse grise se lève sans un aboiement.",
  "petit-tribunal": "Une bâtisse basse, une seule porte, et par elle un froid qui ne vient pas du dehors : le froid des endroits où l'on a beaucoup décidé. Tu entres au Petit Tribunal.",
  "mare-aux-regards": "Le vent tombe d'un coup, comme coupé au couteau. Tes derniers pas ne font plus de bruit.",
  "verger-noir": "Des rangs réguliers montent de la bruyère. De loin, c'est presque rassurant.",
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
  // Vue générique des Landes vers le SUD (retour Patrick 7/08 : l'écran
  // tournait encore sur le placeholder portail). À remplacer par
  // `scene_la_descente` dès génération (prompt dans images-a-produire.md).
  illustration: "assets/scene_landes_liaison_sud_c.png",
  terminal: true,
  narration: [
    "Le sol s'incline. L'air se fait plus froid, plus vieux — il monte d'en bas, par la porte de la Descente restée ouverte derrière toi.",
    "Tu as traversé les Landes vivant. Peu le font. Devant, l'escalier plonge dans un noir qui n'a pas encore de nom.",
    "Ici s'arrête, pour l'instant, ce que le Geôlier a bâti. L'Acte II se creuse encore.",
  ],
  jailerLine: "Te voilà au bout de la descente. Bien. Le reste n'est pas prêt — mais moi, je le serai avant toi.",
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
