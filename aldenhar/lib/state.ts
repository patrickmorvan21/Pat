/**
 * Sauvegarde locale de la run — principe de sécurité (spec §9) :
 * fermer l'app / perdre la connexion ne compte jamais comme une mort.
 * L'état est persisté à chaque évènement et repris exactement où on l'a laissé.
 */

import { normalizeItem, startingBesace, type BesaceItem } from "@/lib/besace";
import { drawMemories } from "@/lib/prologue-data";
import { ENTRY_SCENE, sceneAt } from "@/lib/scene-data";
import type { Temoin } from "@/lib/temoins";
import { sacDepuis, type SacFaits } from "@/lib/faits";

export type RollRecord = {
  step: number;
  choiceId: string;
  result: number;
  at: number;
  /** Le jet a-t-il TENU (palier non-échec) ? Sert au bilan de mort (26/07),
      seul endroit du jeu où des chiffres bruts sont autorisés. */
  ok?: boolean;
};

/** État narratif temporaire (spec §2) : modifie les jets, se dissipe. */
export type NarrativeEffect = {
  id: "aguerri" | "entaille" | "ebranle";
  label: string;
  delta: number;
  scenesLeft: number;
};

/**
 * Entrée du fil scrollable (spec §16) — le flux contient tout l'historique
 * de la run, jamais rien ne se décharge. Persisté intégralement pour que la
 * reprise de run restaure le scrollback exact, pas seulement la position.
 */
/** Une ligne du Grand Registre (§19) : un héros classé par jours de survie. */
export type RegistreRow = {
  rank: number;
  name: string;
  days: number;
  cause: string;
  /** La ligne du joueur (run en cours ou héros tombé), visuellement distincte. */
  isPlayer?: boolean;
};

export type FeedEntry =
  | { id: string; kind: "illustration"; src: string }
  | { id: string; kind: "day"; day: number }
  | { id: string; kind: "narration"; text: string }
  | { id: string; kind: "chosen"; label: string }
  | { id: string; kind: "jailer"; text: string }
  | { id: string; kind: "registre"; rows: RegistreRow[] }
  /** Bannière de rencontre : annonce clairement un combat (spec §6, lisibilité). */
  | { id: string; kind: "combat"; foe: string }
  /** Objet mineur obtenu (13/07) : bandeau tramé « Obtenu — … », pas de popup. */
  /** `usage` (10/08) : ce que l'objet FAIT, en mots. Les objets étaient
      muets — on ramassait une lame sans savoir qu'elle pesait sur les jets. */
  | { id: string; kind: "obtenu"; name: string; rarity: string; flavor: string; usage?: string }
  /** États narratifs temporaires actifs, rappelés en tête d'écran après un
      jet (retour Patrick 19/07) — jamais un chiffre, seulement le nom. */
  | { id: string; kind: "etat"; effects: { effectId: string; label: string; positive: boolean }[] };

/**
 * Prix différé (spec §17) : un choix « gratuit » contracte une dette
 * silencieuse qui se règle plus tard dans la MÊME run (pas au niveau compte).
 * Le règlement doit rester rétrospectivement lisible (le joueur remonte le
 * transcript et comprend d'où ça vient), jamais totalement arbitraire.
 */
export type PendingDebt = {
  id: string;
  /** Pas de progression auquel la dette se déclenche. */
  settleAtStep: number;
  /** Texte narratif du règlement, inséré dans le fil au déclenchement. */
  text: string;
};

/**
 * Stats de personnalité de la run (Courage/Ruse/Instinct/Empathie, sur 1..5 —
 * échelle du prologue « Le Seuil », 16/07). Fixées par le VERDICT du prologue
 * (base 1 + choix A/B/C + jet silencieux ±1) — jamais un écran de répartition
 * de points, jamais un chiffre affiché. Pour l'instant AFFICHAGE SEUL (radar
 * de l'écran Essence) : les jets continuent d'utiliser seuil + états.
 */
export type RunStats = {
  courage: number;
  ruse: number;
  instinct: number;
  empathie: number;
};

/** Profil de repli (runs héritées d'avant le prologue) — échelle 1..5. */
function randomStats(): RunStats {
  const values = [4, 3, 2, 2].map((v) => Math.max(1, Math.min(5, v + (Math.floor(Math.random() * 3) - 1))));
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return { courage: values[0], ruse: values[1], instinct: values[2], empathie: values[3] };
}

/**
 * Prologue « Le Seuil » (spec 16/07) : le Geôlier feuillette la vie d'avant
 * du héros — 2 beats d'amorce, 4 souvenirs (un par stat, ordre fixe), une
 * clôture. Persisté dans la run : fermer l'app en plein prologue reprend
 * exactement au même beat (§9, jamais une mort technique). Rejoué à chaque
 * nouvelle run avec un tirage différent.
 */
export type PrologueMemory = {
  stat: keyof RunStats;
  title: string;
  narration: string;
  options: [string, string, string];
};

export type PrologueState = {
  /** Les 4 souvenirs tirés pour cette run (ordre Courage→Ruse→Instinct→Empathie). */
  memories: PrologueMemory[];
  /** Beat courant : 0-1 = amorce, 2-5 = souvenirs, 6 = clôture. */
  beat: number;
  /** Index (0=A, 1=B, 2=C) du choix retenu pour chaque souvenir joué. */
  choices: number[];
  /** true une fois le verdict rendu (stats calculées) — on entre au Jour I. */
  done: boolean;
  /** Le verdict a été calculé à l'ENTRÉE de la clôture (portrait 4/08).
      ⚠️ Nécessaire parce que computeVerdict tire un jet silencieux : le
      recalculer au timer de sortie donnerait un AUTRE héros que celui que le
      portrait vient de décrire. Optionnel — les sauvegardes d'avant n'ont pas
      le champ, et undefined vaut « pas encore rendu ». */
  verdictRendu?: boolean;
};

/**
 * Traversée (spec 21/07, chantier n°1) : la run ne parcourt plus les scènes en
 * ligne — elle traverse la zone par LIAISONS (marche + choix d'orientation) et
 * ne visite que 3-4 lieux avant la Descente (fin sèche). Persisté pour reprendre
 * la traversée exactement où elle en était (§9).
 */
export type TraversalState = {
  /** Écran courant : un lieu/rencontre ("scene") ou une liaison ("liaison"). */
  phase: "scene" | "liaison";
  /** Id de la scène courante (quand phase = "scene"). */
  current: string;
  /** Lieux/rencontres déjà visités cette traversée (dédup, chaîne = 1). */
  visited: string[];
  /** Nombre de lieux à visiter avant la Descente (3 ou 4, fixé au départ). */
  target: number;
  /** Les 2 destinations offertes à la liaison courante (quand phase = "liaison"). */
  liaisonOpts: [string, string] | null;
  /** Cette Croisée-ci n'offre qu'une direction (échec dur au coup d'avant).
      Porté par `trav` — donc reconstruit à l'identique à la reprise. */
  routeFermee?: boolean;
  /** Graine de la liaison courante — garde ambiance/options stables à la reprise. */
  seed: number;
  /** Descente atteinte : la traversée est finie (nœud terminal). */
  done: boolean;
};

function freshTraversal(current = ENTRY_SCENE): TraversalState {
  return {
    phase: "scene",
    current,
    visited: [current],
    // 7 ou 8 lieux avant la Descente. Le ×3 du 24/07 (9-11) rendait la
    // traversée interminable en jeu réel (partie de découverte 8/08 : 86
    // écrans, Jour 3, toujours pas au bout) — et le durcissement du dernier
    // tiers tombe maintenant assez tôt pour se sentir.
    target: 7 + Math.floor(Math.random() * 2), // 7 ou 8 lieux
    liaisonOpts: null,
    seed: 0,
    done: false,
  };
}

export type RunState = {
  /** Nom du héros de cette run (dette de sang, Grand Registre — spec §19). */
  heroName: string;
  /** Progression dans le parcours infini (0 = première scène). */
  step: number;
  /** Jour courant — n'avance qu'aux campements (spec §7). */
  day: number;
  /** Santé 0..1 — jamais affichée : elle se lit dans l'érosion de l'UI (spec §5). */
  health: number;
  effects: NarrativeEffect[];
  rolls: RollRecord[];
  lastChoiceId: string | null;
  feed: FeedEntry[];
  /** Écrans RESTANTS de la séquence de micro-beats (doctrine 4/08) — la
      reprise rejoue l'écran courant puis la suite, jamais la pile entière.
      Optionnel : les sauvegardes d'avant n'ont pas le champ. */
  feedSuite?: FeedEntry[][];
  /** L'effet de la relique portée a été CONSOMMÉ cette run (coussin dépensé,
      passe-verrou utilisé). Une relique = un geste par vie. Optionnel. */
  relicUsed?: boolean;
  /** Ambiances de liaison déjà SERVIES cette run — un événement de voyage ne
      revient jamais verbatim dans une même vie (retour test 4/08). Complétée
      en QUITTANT la liaison, pour que sa reprise reste déterministe. */
  liaisonVues?: string[];
  /** Lignes intruses de HANTÉ déjà servies cette run — jamais deux fois la
      même phrase « qui n'appartient pas là » dans une vie (playtest 7/08). */
  intrusesVues?: string[];
  /** Réactions du monde (états) déjà servies cette run — même règle que les
      intruses : jamais deux fois mot pour mot dans la même vie (8/08). */
  reactionsVues?: string[];
  /** Échos d'objets-promesse déjà servis (« scène|objet ») — un objet ne
      pèse qu'une fois par endroit (8/08). */
  echosObjet?: string[];
  /** Noms des soins génériques déjà trouvés cette run — un objet « trouvé »
      ne retombe jamais sous le même nom dans la même vie (playtest 7/08). */
  dropsServis?: string[];
  /** Registre de déjà-vu, portée RUN (lib/dejavu.ts) — un compteur par clé,
      jamais un booléen : le texte peut dire « la deuxième fois ». */
  vus?: Record<string, number>;
  /**
   * A-T-ON ENGAGÉ QUELQUE CHOSE DANS CE LIEU ? (panel 10/08)
   *
   * Mesuré par le panel : traverser la zone en ne lançant presque jamais le dé
   * est la stratégie gagnante — 0 mort sur 16 vies, contre 8 sur 16 en le
   * lançant. Le pilier central du jeu était devenu facultatif.
   *
   * Le levier retenu (et débattu) : **le refus coûte un JOUR, pas de la
   * santé**. Quitter un lieu sans y avoir rien risqué fait tourner la
   * lumière. L'abstention cesse d'être gratuite sans devenir interdite, les
   * Besoins — comptés en jours, donc presque jamais déclenchés — se
   * réveillent, et surtout **l'observation reste gratuite** : l'arbitrage
   * « récompenser les curieux, pas les pressés » (8/08) est préservé.
   *
   * Posé à la résolution d'un jet, remis à faux en arrivant dans un lieu neuf.
   */
  engageIci?: boolean;
  /**
   * LIEUX RÉELLEMENT VÉCUS — le compteur qui fait avancer le Jour.
   *
   * ⚠️ CORRECTION IMPORTANTE (retour Patrick, 10/08). J'avais fait PAYER un
   * Jour au joueur qui quitte un lieu sans avoir rien risqué. C'était à
   * l'envers : le Jour est le SCORE du Grand Registre (on est classé par
   * jours survécus), donc ma « punition » donnait des points au joueur le
   * plus passif. Une punition qui améliore le classement n'est pas une
   * punition.
   *
   * Le sens est donc inversé : **le Jour ne se perd pas, il se GAGNE**. Il
   * avance tous les trois lieux où le héros a réellement tenté quelque
   * chose. Traverser les Landes sans rien risquer reste possible — mais ce
   * temps-là ne se dépose sur personne, et le Registre ne le compte pas.
   *
   * RÈGLE GÉNÉRALE À TENIR : aucune mécanique ne doit jamais ajouter un Jour
   * à titre de sanction. Le Jour est un score et une pression (les Besoins
   * se comptent en jours) ; il se mérite, il ne se facture pas.
   */
  lieuxEngages?: number;
  /**
   * L'HORLOGE DU CORPS — ce sur quoi les Besoins se comptent.
   *
   * ⚠️ Effet de bord trouvé par la relecture du 10/08. Les Besoins (soigner
   * 2 j · dormir 3 j · manger 3 j) se comptaient sur `day`. En recentrant le
   * Jour sur l'ENGAGEMENT, je les ai déplacés sans le décider : le joueur
   * passif ne gagnait plus de Jour, donc **il n'avait plus jamais faim** — le
   * dernier vecteur de pression qui l'atteignait, coupé par le commit dont le
   * titre est « rendre le dé décisif » ; et symétriquement le joueur engagé se
   * retrouvait affamé plus tôt, puni de s'être engagé.
   *
   * Les deux horloges sont donc séparées, et chacune mesure ce qu'elle doit :
   *  - `day` = le SCORE (Registre) — il se gagne en vivant, cf. `lieuxEngages` ;
   *  - `horloge` = le TEMPS DU CORPS — il avance tous les trois lieux
   *    traversés, quoi qu'on y fasse, et à chaque nuit. Marcher creuse
   *    l'estomac qu'on ait risqué sa peau ou non.
   *
   * Jamais affichée, jamais comparée au Jour par le joueur : il ne voit que
   * l'état qui finit par tomber. Le garde-fou n°2 de `lib/besoins.ts` — « le
   * besoin punit la lenteur » — redevient vrai avec elle.
   */
  horloge?: number;
  /**
   * Points d'intérêt examinés DANS LE LIEU COURANT (panel 10/08).
   *
   * Chacun ouvre l'Anneau d'un cran, au plus deux. C'est la réponse au
   * constat le plus dur du panel : « l'anneau bouge, mais avec ce que je
   * porte, jamais avec ce que je tente. » Regarder avant d'agir devient la
   * seule chose qui améliore vraiment un jet — le curieux est payé là où le
   * jeu fait mal, le pressé garde les chances brutes. Aucun chiffre :
   * l'Anneau montre simplement plus d'encoches pleines.
   *
   * Remis à zéro en arrivant dans un lieu neuf.
   */
  poiIci?: number;
  /**
   * UN ÉCHEC DUR DOIT DÉPENSER QUELQUE CHOSE DU MONDE (panel 9/08).
   * Sur un écran de séjour, il consomme une option (voir `choixFaits`). Hors
   * séjour, il n'y a pas d'option à retirer — on arme donc ce drapeau, et la
   * prochaine Croisée n'offre plus qu'UNE direction. Le coût est diégétique
   * (le monde se referme), jamais un prélèvement de santé de plus : le panel
   * a explicitement écarté le re-durcissement du barème.
   */
  routeFermeeEnAttente?: boolean;
  /**
   * LES TÉMOINS (5/08) : le Soupçon cesse d'être un compteur, il devient des
   * gens. Chaque acte qui fait monter le Soupçon inscrit QUI a vu QUOI, dans
   * l'ordre. Au procès, ce sont ces dépositions qui sont lues.
   */
  temoins?: Temoin[];
  /** Témoins déjà cités DANS LA RUE (rumeur, 8/08) — le procès commence
      avant la salle, mais chaque témoin ne parle qu'une fois dehors. */
  temoinsCites?: string[];
  /**
   * LE PROCÈS CONCLUT (panel 10/08).
   *
   * Une relaxe faisait retomber le Soupçon de 6 à 4, mais laissait les
   * dépositions en place : six écrans plus loin, le hameau rejugeait le héros
   * sur EXACTEMENT les mêmes griefs, avec les mêmes témoins et les mêmes
   * phrases. Un testeur y est mort sans jamais comprendre ce qu'il aurait pu
   * faire autrement. Le jugement rendu épuise donc les dépositions qu'il a
   * jugées (on ne juge pas deux fois les mêmes actes) : un second procès
   * exige de NOUVEAUX actes. Ce compteur sert à le dire dans la salle.
   */
  procesGagnes?: number;
  /**
   * TÉMOINS DÉJÀ JUGÉS (relecture par agents, 10/08).
   *
   * La relaxe VIDAIT `temoins` pour que le second procès porte sur de
   * nouveaux actes. Effet non vu : `defensesDisponibles` lit la même liste —
   * « discréditer » exige un témoin nommé, « émouvoir » un témoin du hameau.
   * Sans témoins, le second procès n'offrait plus que « Tout reconnaître »,
   * seuil 13 et highStakes. **Gagner son procès rendait le suivant mortel** :
   * une récompense qui dégrade, exactement ce que le brief d'économie
   * interdit.
   *
   * Les dépositions restent donc en place, marquées jugées : elles sortent de
   * l'ACTE D'ACCUSATION (on ne juge pas deux fois les mêmes actes) mais
   * continuent d'ouvrir les défenses — on peut toujours discréditer les mêmes
   * gens.
   */
  temoinsJuges?: string[];
  /**
   * LA LOI DU DOMAINE (5/08) : index des manifestations déjà servies cette run.
   * La loi se constate, elle ne se martèle pas — au plus une par vie.
   */
  loiVues?: number[];
  /**
   * LE GEÔLIER : gabarits de citations déjà servis dans cette vie (retour
   * Patrick 8/08 : « il répète souvent les mêmes phrases dans une même run »).
   * On mémorise le GABARIT (avant substitution de {n}) : sinon un 4 et un 11
   * feraient passer deux fois la même phrase pour neuve. Quand un pool est
   * épuisé, le tirage reprend dedans — mieux vaut une reprise tardive qu'un
   * Geôlier muet.
   */
  jailerVues?: string[];
  /**
   * ARRIVÉE : phrases de « manière d'arriver » déjà servies dans cette vie.
   * Variation narrative pure (décision Patrick 5/08) — aucune conséquence
   * mécanique ; seule l'anti-répétition la concerne.
   */
  arriveeVues?: string[];
  /**
   * LE MOTEUR DE FAITS (spec 4/08 §1) — scopes `run` et `zone_run` : états,
   * savoirs, soupçon. Meurent avec le héros. Les scopes permanents vivent dans
   * `PlayerMemory.faits`. Optionnel : les sauvegardes d'avant n'ont rien.
   */
  faits?: SacFaits;
  /**
   * BESOINS (spec §3) : id de besoin → dernier JOUR où on y a répondu. En
   * jours, jamais en scènes — garde-fou n°2. Aucun compteur n'est jamais
   * montré : le besoin ne se manifeste que par l'état qu'il finit par poser.
   */
  besoins?: Record<string, number>;
  /** Croisées jouées depuis la dernière route forcée par le directeur. */
  croiseesDepuisRoute?: number;
  /** Rencontres programmées par un effet (recouvrement de dette…). */
  rencontresDues?: { scene: string; auPas: number }[];
  /**
   * L'ÉLÉMENT-SURPRISE de cette run (catalogue 6/08) — AU PLUS UN, armé au
   * premier pas, joué quand son contexte arrive (ou jamais : perdu, tant pis).
   * `jouee` verrouille le plafond ; le Geôlier métaleptique, hors armement,
   * écrit directement ici pour respecter le même plafond.
   */
  surprise?: { id: string; jouee?: boolean };
  /**
   * LE JOURNAL DES CHOIX CITABLES (socle commun des surprises 6/08) : les
   * libellés réels des choix tagués `citable`, avec leur pas. Nourrit « le
   * PNJ qui te cite » et la récitation du Grand Témoin. Plafonné à 20.
   */
  journalChoix?: { t: string; step: number }[];
  /** La prophétie datée (surprise #4) : le jour parié par le Geôlier. */
  prophetie?: number;
  /** Le vol nocturne (surprise #8) : NOM de l'objet volé — retenu pour un
      paiement futur (le reconnaître au cou de quelqu'un). */
  volNocturne?: string;
  /** États déjà ANNONCÉS par le bandeau (retour 6/08 soir : le bandeau ne se
      répète plus à chaque écran — il n'annonce que ce qu'on vient d'attraper). */
  etatsAffiches?: string[];
  /** Carte d'état en cours (maquette 2440:13429, 7/08) : elle reste affichée
      LE TEMPS DE LA SCÈNE où l'état a été attrapé (tous ses beats), puis
      quitte l'interface — et le popup « c'est dans le menu » peut se montrer. */
  etatBanniere?: { effects: { effectId: string; label: string; positive: boolean }[]; lieu: string };
  /** Dettes narratives en attente de règlement dans cette run (spec §17). */
  debts: PendingDebt[];
  /** Besace (13/07) : objets mundane, vidée à la mort. */
  besace: BesaceItem[];
  /** Objets réels des Landes déjà ramassés dans cette run (chantier 1 du 23/07) —
      un lieu ne redonne jamais deux fois son objet. */
  looted: string[];
  /** Rencontres (scènes de combat) traversées vivant — pour l'écran de mort. */
  encounters: number;
  /** Stats de la run (affichage Essence seulement pour l'instant). */
  stats: RunStats;
  /** Prologue « Le Seuil » — présent tant que la run existe (spec 16/07). */
  prologue: PrologueState;
  /** Traversée de la zone (spec 21/07) : liaisons + choix d'orientation. */
  trav: TraversalState;
  /**
   * Chapitre garanti de la traversée (chantier 2 du 23/07) : id d'un chapitre
   * de `LANDES_CHAPTERS` + stade (0 = pas amorcé, 1 = amorcé, 2 = développé,
   * 3 = résolu). Tiré au début d'une run neuve (Scene, avec la mémoire du
   * compte pour la rotation) ; null tant que rien n'est tiré.
   */
  chapter: { id: string; stage: 0 | 1 | 2 | 3 } | null;
  /**
   * Le Soupçon (chantier 3 du 23/07) : 0..6, JAMAIS affiché — il ne se lit que
   * dans le monde (paliers). 6 = procès du héros. Remis à 0 à chaque run.
   */
  soupcon: number;
  /** Dernier palier du Soupçon déjà MANIFESTÉ dans le monde (évite de rejouer
      la même manifestation ; redescend avec le Soupçon après un procès). */
  soupconSeen: number;
  /** Points d'intérêt déjà examinés dans le LIEU COURANT (spec 24/07 suite) —
      vidé en quittant le lieu. Un point exploré ne se re-propose pas. */
  poiSeen: string[];
  /** Choix déjà RÉSOLUS sur une scène `sejour` (`"<scène>:<choix>"`). Un lieu
      qui retient le héros doit se souvenir de ce qu'il y a déjà fait, sinon on
      rejoue indéfiniment la même question. Vidé en quittant le lieu, comme
      `poiSeen` — c'est le même geste, côté choix. */
  choixFaits: string[];
  /**
   * Le Hameau (spec 24/07 suite §3) : on ne le « visite » pas, on y fait
   * HALTE. Deux séquences garanties hors tirage encadrent la traversée —
   * l'Entrée (première arrivée) et la Halte (nuit, avant la sortie de zone).
   * `serment` conditionne la Halte : juré → la grange ; refusé → nuit dehors.
   */
  hameau: {
    entree: boolean;
    serment: "jure" | "faux" | "refuse" | null;
    halte: boolean;
    /** L'ACCUEIL du jour (6/08) : id de la scène tirée pour le 3e beat de
        l'entrée. Rangé ici dès le tirage — la reprise ne re-tire jamais, sinon
        fermer l'app changerait la façon dont le village t'a reçu. */
    accueil?: string;
  };
  /**
   * Le SAVOIR (journal Notion 25/07 — « rendre l'exploration payante »).
   *
   * Flags d'information APPRISE en examinant un point d'intérêt. Un Savoir
   * n'ajoute jamais de puissance : il ouvre une **option qui n'existait pas**
   * dans une scène ultérieure (`Choice.requiresSavoir`). Aucun chiffre, aucune
   * stat, aucun marqueur « débloqué » tapageur — le choix apparaît comme les
   * autres.
   *
   * ⚠️ Portée = LA RUN. Le héros apprend, il meurt, le suivant repart neuf :
   * vidé à la mort exactement comme la Besace. Seules les Reliques traversent
   * la mort (pilier inchangé).
   *
   * Un Savoir n'est pas toujours une bonne carte : certaines options ouvertes
   * sont des aveux ou des paris (cf. le poteau gravé à ton nom).
   */
  savoirs: string[];
  /**
   * Fragments de chapitre déjà lus dans cette run (4e monnaie du dosage des
   * points d'intérêt). Index dans `Chapter.fragments` du chapitre courant :
   * un point d'intérêt qui « rend un fragment » sert le premier non encore lu.
   */
  fragmentsLus: number[];
};

const KEY = "aldenhar-run";

const HERO_NAMES = [
  "Corvin", "Vael", "Ysolde", "Brannoc", "Maerith", "Dorn", "Sélène",
  "Karth", "Ombrelin", "Thessaly", "Rœric", "Nyx", "Aldric", "Vesper",
];

/** Nom de héros aléatoire (dette de sang / Registre — spec §19). */
export function randomHeroName(): string {
  return HERO_NAMES[Math.floor(Math.random() * HERO_NAMES.length)];
}

/** Anciennes sauvegardes : stats sur 10 → ramenées à l'échelle 1..5 du prologue. */
function migrateStats(p: Partial<RunStats> | undefined): RunStats {
  if (!p || typeof p.courage !== "number") return randomStats();
  const fix = (v: number) => Math.max(1, Math.min(5, v > 5 ? Math.round(v / 2) : v));
  return {
    courage: fix(p.courage),
    ruse: fix(p.ruse ?? 3),
    instinct: fix(p.instinct ?? 3),
    empathie: fix(p.empathie ?? 3),
  };
}

function fresh(): RunState {
  return {
    heroName: randomHeroName(),
    step: 0,
    day: 1,
    horloge: 1,
    health: 1,
    effects: [],
    rolls: [],
    lastChoiceId: null,
    feed: [],
    debts: [],
    besace: startingBesace(),
    looted: [],
    encounters: 0,
    stats: randomStats(),
    // Tirage du prologue : 1 souvenir par stat, fixé pour toute la run.
    prologue: {
      memories: drawMemories().map(({ stat, entry }) => ({ stat, ...entry })),
      beat: 0,
      choices: [],
      done: false,
    },
    trav: freshTraversal(),
    chapter: null,
    soupcon: 0,
    soupconSeen: 0,
    poiSeen: [],
    choixFaits: [],
    hameau: { entree: false, serment: null, halte: false },
    savoirs: [],
    fragmentsLus: [],
    temoins: [],
    temoinsCites: [],
    procesGagnes: 0,
    temoinsJuges: [],
    loiVues: [],
    jailerVues: [],
    arriveeVues: [],
    faits: {},
    besoins: {},
    croiseesDepuisRoute: 0,
    rencontresDues: [],
  };
}

/** Réinitialisation explicite (mort acceptée) : nouvelle run, nouveau héros. */
export function resetRun(): RunState {
  const run = fresh();
  saveRun(run);
  return run;
}

export function loadRun(): RunState {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<RunState>;
        if (typeof p.step === "number") {
          return {
            heroName: typeof p.heroName === "string" ? p.heroName : randomHeroName(),
            step: p.step,
            day: typeof p.day === "number" ? p.day : 1,
            health: typeof p.health === "number" ? p.health : 1,
            effects: Array.isArray(p.effects) ? p.effects : [],
            rolls: Array.isArray(p.rolls) ? p.rolls : [],
            lastChoiceId: p.lastChoiceId ?? null,
            feed: Array.isArray(p.feed) ? p.feed : [],
            debts: Array.isArray(p.debts) ? p.debts : [],
            // Normalise les items d'avant le point 4 (ajoute slot/effets).
            besace: Array.isArray(p.besace) ? p.besace.map(normalizeItem) : startingBesace(),
            looted: Array.isArray(p.looted) ? p.looted : [],
            encounters: typeof p.encounters === "number" ? p.encounters : 0,
            stats: migrateStats(p.stats),
            // Runs d'avant le prologue : considérées comme un prologue déjà
            // rendu — elles reprennent directement au Jour courant.
            prologue:
              p.prologue && Array.isArray(p.prologue.memories)
                ? p.prologue
                : { memories: [], beat: 6, choices: [], done: true },
            // Traversée : reprise si présente ; sinon, run d'avant le 21/07 →
            // on amorce une traversée à partir de sa scène linéaire courante.
            trav:
              p.trav && typeof p.trav.current === "string" && Array.isArray(p.trav.visited)
                ? p.trav
                : freshTraversal(sceneAt(typeof p.step === "number" ? p.step : 0).id),
            // Chapitre : null pour les runs d'avant le 24/07 — Scene en tire un
            // à la volée (l'amorce jouera à la prochaine liaison).
            chapter: p.chapter && typeof p.chapter.id === "string" ? p.chapter : null,
            soupcon: typeof p.soupcon === "number" ? p.soupcon : 0,
            soupconSeen: typeof p.soupconSeen === "number" ? p.soupconSeen : 0,
            poiSeen: Array.isArray(p.poiSeen) ? p.poiSeen : [],
            choixFaits: Array.isArray(p.choixFaits) ? p.choixFaits : [],
            hameau: p.hameau && typeof p.hameau.entree === "boolean"
              ? p.hameau
              : { entree: false, serment: null, halte: false },
            // Runs d'avant le Savoir (25/07) : elles reprennent sans rien
            // savoir. Les options débloquées n'apparaîtront que si le joueur
            // ré-examine les points concernés — pas de rattrapage rétroactif,
            // le Savoir se gagne en explorant.
            savoirs: Array.isArray(p.savoirs) ? p.savoirs : [],
            fragmentsLus: Array.isArray(p.fragmentsLus) ? p.fragmentsLus : [],
            // ⚠️ loadRun reconstruit la run CHAMP PAR CHAMP : tout champ absent
            // ici est SILENCIEUSEMENT PERDU au rechargement. Piège vérifié le
            // 4/08 (l'anti-répétition des liaisons ne filtrait rien).
            feedSuite: Array.isArray(p.feedSuite) ? p.feedSuite : [],
            relicUsed: Boolean(p.relicUsed),
            liaisonVues: Array.isArray(p.liaisonVues) ? p.liaisonVues : [],
            intrusesVues: Array.isArray(p.intrusesVues) ? p.intrusesVues : [],
            reactionsVues: Array.isArray(p.reactionsVues) ? p.reactionsVues : [],
            echosObjet: Array.isArray(p.echosObjet) ? p.echosObjet : [],
            vus: p.vus && typeof p.vus === "object" ? p.vus : {},
            routeFermeeEnAttente: p.routeFermeeEnAttente === true,
            engageIci: p.engageIci === true,
            lieuxEngages: typeof p.lieuxEngages === "number" ? p.lieuxEngages : 0,
            horloge: typeof p.horloge === "number" ? p.horloge : (typeof p.day === "number" ? p.day : 1),
            poiIci: typeof p.poiIci === "number" ? p.poiIci : 0,
            dropsServis: Array.isArray(p.dropsServis) ? p.dropsServis : [],
            temoins: Array.isArray(p.temoins) ? p.temoins : [],
            temoinsCites: Array.isArray(p.temoinsCites) ? p.temoinsCites : [],
            procesGagnes: typeof p.procesGagnes === "number" ? p.procesGagnes : 0,
            temoinsJuges: Array.isArray(p.temoinsJuges) ? p.temoinsJuges : [],
            loiVues: Array.isArray(p.loiVues) ? p.loiVues : [],
            jailerVues: Array.isArray(p.jailerVues) ? p.jailerVues : [],
            arriveeVues: Array.isArray(p.arriveeVues) ? p.arriveeVues : [],
            faits: sacDepuis(p.faits),
            besoins: p.besoins && typeof p.besoins === "object" ? p.besoins : {},
            croiseesDepuisRoute: typeof p.croiseesDepuisRoute === "number" ? p.croiseesDepuisRoute : 0,
            rencontresDues: Array.isArray(p.rencontresDues) ? p.rencontresDues : [],
            surprise: p.surprise && typeof p.surprise === "object" ? p.surprise : undefined,
            journalChoix: Array.isArray(p.journalChoix) ? p.journalChoix : [],
            prophetie: typeof p.prophetie === "number" ? p.prophetie : undefined,
            volNocturne: typeof p.volNocturne === "string" ? p.volNocturne : undefined,
            etatsAffiches: Array.isArray(p.etatsAffiches) ? p.etatsAffiches : [],
            etatBanniere: p.etatBanniere && Array.isArray(p.etatBanniere.effects) ? p.etatBanniere : undefined,
          };
        }
      }
    } catch {
      // stockage indisponible ou corrompu → on repart proprement, jamais de mort narrative
    }
  }
  return fresh();
}

/**
 * Une run est « en cours » si son fil a déjà du contenu — critère de l'écran
 * d'accueil (14/07) pour choisir entre « Bienvenue en enfer » et « Bon
 * retour... ». La simple existence de la clé ne suffit pas : une run tout
 * juste réinitialisée (mort acceptée) n'a rien à reprendre.
 */
export function hasSavedRun(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return false;
    const p = JSON.parse(raw) as Partial<RunState>;
    // Un prologue entamé compte comme une run en cours : fermer l'app en
    // plein Seuil doit proposer REPRENDRE et reprendre au même beat (§9).
    const prologueStarted = Boolean(p.prologue && !p.prologue.done && (p.prologue.beat ?? 0) > 0);
    return (Array.isArray(p.feed) && p.feed.length > 0) || (typeof p.step === "number" && p.step > 0) || prologueStarted;
  } catch {
    return false;
  }
}

export function saveRun(state: RunState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // quota plein / navigation privée : on continue en mémoire
  }
}
