/**
 * LES DEUX MARQUES QUI RESTENT — Phase A du plan d'élagage (11/08/2026).
 *
 * ⚠️ CE FICHIER PORTAIT UN MOTEUR GÉNÉRIQUE D'ÉTATS TEMPORAIRES. Il a été
 * démonté : sept états, leurs pools de réactions, leurs expirations, leurs
 * interactions croisées et leur garde de couverture coûtaient plus qu'ils ne
 * rendaient — et produisaient des anomalies récurrentes (FIXÉ posé au milieu
 * des moutons, deux blessures pour une défaite, des effets promis que rien ne
 * lisait). Le raisonnement qui a tranché : *si on retire les états, PACTUM
 * reste PACTUM ; si on retire le dé, la mort permanente ou la mémoire des
 * incarnations, il ne l'est plus.*
 *
 * Ce qui les remplace :
 *   • UN SEUL état du corps — BLESSÉ, porté par le canal historique
 *     (`RunState.effects`), lu par l'érosion du cadre et soigné au camp ;
 *   • des FLAGS NARRATIFS CIBLÉS pour tout le reste (`RunState.faits`,
 *     moteur `lib/faits.ts`, qui sert aussi aux savoirs et aux découvertes).
 *
 * Restent ici les DEUX marques qui ne sont pas des états génériques mais des
 * dispositifs narratifs précis, chacun attaché à une seule chose du monde :
 *   • FIXÉ — le regard du village, pilier du procès ;
 *   • ACCOMPAGNÉ — le Gamin des Murets, le seul compagnon du jeu.
 * Elles gardent leur nom, leur carte à l'écran et leur phrase, parce que ce
 * sont exactement les « flags narratifs spécifiques » que la refonte demande —
 * pas parce qu'un moteur les exige.
 *
 * ⚠️ Les textes des cinq états retirés (manifestations, réactions, guérisons)
 * ne sont PAS perdus : ils sont archivés dans `data/archive-etats.md`, à
 * destination du Codex. Rien ne se supprime de la production.
 *
 * Règles conservées : jamais un chiffre ni une durée à l'écran ; une marque se
 * lit à son nom, à son image, et à la façon dont le monde te traite.
 */

import type { Effet } from "@/lib/faits";

export type GroupeEtat = "corps" | "mental" | "social" | "faveur";
export type StatNom = "COURAGE" | "RUSE" | "INSTINCT" | "EMPATHIE";

export type Etat = {
  id: string;
  /** Le nom tel qu'il s'affiche — jamais accompagné d'un chiffre. */
  nom: string;
  groupe: GroupeEtat;
  /** Icône `assets/etat_*.png` si elle existe ; sinon le nom seul. */
  illustration?: string;

  // ── contenu obligatoire (couverture minimale) ────────────────────────────
  /** Comment on l'attrape, en une phrase — sert au Studio, pas au joueur. */
  source: string;
  /** LA manifestation immédiate, poussée dans le fil dès l'acquisition. */
  manifestation: string;
  /** Au moins DEUX réactions du monde, servies plus loin dans la run. */
  reactions: string[];
  /** Index des réactions jouables HORS village (les autres mettent des
      villageois en scène et téléporteraient le hameau autour du héros). */
  reactionsPartout?: number[];
  /** Comment il se perd, en une phrase. */
  remede: string;
  /** La ligne servie quand il se lève enfin. */
  guerison: string;

  // ── mécanique (toujours doublée d'un effet narratif) ─────────────────────
  /**
   * Mention ajoutée sous l'anneau du dé — « Fièvre — défavorable ».
   * ⚠️ Exigence explicite de la spec : sans elle, le joueur ne comprend pas que
   * l'état agit. Jamais un chiffre, seulement le sens.
   */
  hint?: string;
  /** Les Fixés se mettent à te parler — confidences autrement inaccessibles. */
  ouvreConfidences?: boolean;
  /**
   * Un guide connaît un autre chemin : quand un échec dur referme une route,
   * la Croisée suivante offre quand même ses deux directions.
   *
   * ⚠️ Cet effet FAISAIT sauter le Jour de marche (« il connaît les
   * raccourcis »). C'était un malus déguisé en bonus : le Jour est le SCORE
   * du Grand Registre, donc en épargner un fait perdre du rang. Le bénéfice
   * porte désormais sur ce qui est vraiment un coût — le monde qui se
   * referme. Voir la note sur `RunState.lieuxEngages`.
   */
  rouvreLaRoute?: boolean;
  /** Le compagnon détale au premier combat. Se dit, ne se subit pas en silence. */
  fuitLeCombat?: string;
};

/**
 * PREMIER LOT — six états, pas dix-sept.
 * « Dix-sept états produiraient dix-sept icônes fonctionnelles et deux ou trois
 * états réellement intégrés au contenu. On commence par six. »
 */
export const ETATS: Etat[] = [
  {
    id: "fixe",
    nom: "FIXÉ",
    groupe: "social",
    source: "Le village te croit marqué par le sud — Soupçon élevé, ou ton reflet dans la Mare vu par un témoin.",
    remede: "Aucun remède simple : seul le procès, ou la sortie de zone, y met fin.",
    manifestation:
      "On ne te parle plus tout à fait à toi. On parle devant toi, de toi, à " +
      "voix normale, comme on parle devant un poteau déjà planté.",
    reactions: [
      "Le barrage s'écarte à ton passage. Ce n'est pas du respect : on ne " +
        "touche pas un fixé.",
      "Une femme pose un bol par terre à trois pas de toi, et recule avant que " +
        "tu te baisses.",
    ],
    guerison:
      "Le hameau détourne son attention vers quelqu'un d'autre. Tu redeviens " +
      "un étranger ordinaire, ce qui est déjà beaucoup.",
    hint: "Fixé — le hameau a décidé",
    /* AMBIGU, et c'est le cœur de l'état : catastrophique socialement, mais
       ceux qui portent la même croix se mettent à parler. */
    ouvreConfidences: true,
  },
  {
    /**
     * ACCOMPAGNÉ — le premier COMPAGNON du jeu (retour Patrick 6/08 : « le
     * gamin des murets, c'est un compagnon de voyage temporaire — jusqu'où il
     * nous emmène, quel bénéfice ? »).
     *
     * Les trois réponses sont dans cet objet, et elles sont dites en jeu par
     * le Gamin lui-même, jamais par l'interface :
     *  • JUSQU'OÙ — `expires` posé à 2 lieux à l'acquisition. Il l'annonce
     *    (« deux murets, après c'est plus chez moi ») et il tient parole.
     *  • QUEL BÉNÉFICE — il connaît les raccourcis : un échec dur ne coûte
     *    plus le Jour qu'il coûte d'habitude. Aucun chiffre : ça se lit au
     *    fait que la puce « Jour » ne bouge pas.
     *  • CE QUE ÇA COÛTE — emmener l'enfant du hameau se voit (+1 Soupçon,
     *    posé par le choix), et le premier combat le fait détaler.
     *
     * Groupe `faveur` : il n'est chassé par aucun état de corps ni de statut
     * social — être boiteux ne fait pas partir un gamin.
     */
    id: "accompagne",
    nom: "ACCOMPAGNÉ",
    groupe: "faveur",
    source: "Le Gamin des Murets a accepté de te guider.",
    remede: "Il rentre chez lui au bout de deux lieux — ou détale au premier combat.",
    manifestation:
      "Il marche trois pas devant, sur la crête des murets, là où personne " +
      "ne marche. De temps en temps il s'arrête, regarde quelque chose que " +
      "tu ne vois pas, et repart par un autre côté sans expliquer.",
    reactions: [
      "« Pas par là. » Il ne dit pas pourquoi. Tu contournes, et tu gagnes " +
        "une demi-heure sur un chemin que tu aurais juré plus court.",
      "Un homme te croise, voit l'enfant à ta hauteur, et son salut s'arrête " +
        "au milieu. Emmener un petit du hameau dans la lande, ça se raconte.",
    ],
    // Le Gamin EST là où le héros est : sa 1re réaction se joue partout (la
    // 2e met un passant en scène — village seulement).
    reactionsPartout: [0],
    guerison:
      "Il s'arrête net au bout du muret. « Là, c'est plus chez moi. » Il " +
      "attend que tu sois assez loin pour ne plus pouvoir le rappeler, puis " +
      "il fait demi-tour en courant sur la pierre.",
    hint: "Le gamin connaît un autre chemin",
    rouvreLaRoute: true,
    fuitLeCombat:
      "Le gamin est parti avant que tu aies vu quoi. Pas un cri, pas un mot " +
      "— juste le bruit de ses pieds sur la pierre sèche, qui s'éloigne, et " +
      "qui ne ralentit pas.",
  },
];

const PAR_ID = new Map(ETATS.map((e) => [e.id, e]));

export function etat(id: string): Etat | null {
  return PAR_ID.get(id) ?? null;
}

/** Les états actifs, dans l'ordre d'acquisition, depuis les ids de faits. */
export function etatsActifs(ids: string[]): Etat[] {
  return ids.map((i) => PAR_ID.get(i)).filter((e): e is Etat => Boolean(e));
}

/**
 * Le PLAFOND D'AFFICHAGE (trois) — les autres restent actifs et consultables
 * dans Essence. On garde les plus récents : c'est ce qui vient d'arriver au
 * héros qui doit se lire en premier.
 */
export const PLAFOND_AFFICHAGE = 3;

/**
 * Pose un état en respectant son GROUPE D'EXCLUSIVITÉ : il ne chasse que les
 * états du MÊME groupe. Renvoie les effets à appliquer, jamais un état posé
 * directement — le moteur de faits reste le seul à écrire.
 */
export function poserEtat(nouveau: string, actifs: string[], expires?: number): Effet[] {
  const e = PAR_ID.get(nouveau);
  if (!e) return [];
  const aChasser = actifs.filter((id) => id !== nouveau && PAR_ID.get(id)?.groupe === e.groupe);
  return [
    ...aChasser.map((id): Effet => ({ clear: id })),
    { set: nouveau, kind: "state", scope: "run", value: 1, source: e.source, expires },
  ];
}

/** Les mentions à afficher sous l'anneau — au plus deux, sans quoi c'est un mur. */
export function hintsEtats(actifs: Etat[]): string[] {
  return actifs.map((e) => e.hint).filter((h): h is string => Boolean(h)).slice(0, 2);
}

/*
 * ⚠️ `modEtats`, `seuilEtats` et `auditEtats` ont été RETIRÉS avec le moteur
 * générique (Phase A, 11/08). Les deux premiers sommaient des modificateurs
 * de jet que plus aucune marque ne porte — une marque agit maintenant sur ce
 * qui S'OUVRE ou se ferme, jamais sur un chiffre caché. Le troisième était le
 * garde de couverture (`tools/etats.mjs`, retiré du prebuild) : il validait
 * un état sur des effets qui, pour deux d'entre eux, n'existaient nulle part.
 */
