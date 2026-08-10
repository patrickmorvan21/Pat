/**
 * LES ÉTATS — premier lot du vertical slice (spec 4/08, §2).
 *
 * ⚠️ RÈGLE FONDATRICE, qui condamne le système précédent :
 * « Un état n'est pas un modificateur déguisé. C'est un fait sur le héros
 * auquel LE MONDE RÉAGIT. Sans effet narratif, ce n'est qu'un chiffre camouflé
 * → à refuser. » Les anciens AGUERRI / ENTAILLÉ / ÉBRANLÉ étaient exactement
 * ça : un `delta` et rien d'autre. Ils sont conservés le temps de la
 * transition (le combat s'appuie encore dessus) mais n'ont pas leur place ici.
 *
 * Autres règles tenues dans ce fichier :
 *   • JAMAIS de nombre affiché — ni jauge, ni durée. Un état se lit à son nom,
 *     à son image, et à la façon dont le monde te traite.
 *   • GROUPES D'EXCLUSIVITÉ (corps · mental · social · faveur) : un état ne
 *     peut remplacer qu'un état du même groupe. AUCUNE suppression automatique
 *     entre groupes — devenir Endetté ne guérit pas une jambe.
 *   • La limite de trois est un PLAFOND D'AFFICHAGE : les autres restent
 *     actifs et consultables dans l'écran Essence.
 *   • COUVERTURE MINIMALE, sans quoi un état n'est pas livrable : 1 manière de
 *     l'obtenir · 1 manifestation immédiate · 2 réactions du monde · 1 choix
 *     modifié · 1 manière de le perdre. Chaque entrée ci-dessous la remplit,
 *     et `auditEtats()` le vérifie par script — réellement, depuis le
 *     10/08 : `tools/etats.mjs` l'exécute à chaque build (`prebuild`). Avant
 *     cette date la phrase était fausse, personne n'appelait la fonction.
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
  /**
   * Indices (dans `reactions`) des réactions jouables PARTOUT — celles qui ne
   * mettent personne en scène. Les autres décrivent des VILLAGEOIS (un
   * barrage, un bol posé, un panier rangé…) et ne se jouent QUE dans le
   * village : servies en pleine lande ou face à une bête, elles cassaient la
   * scène (playtest 7/08 — « Le barrage s'écarte » pendant le combat contre
   * la Bête des Chemins Creux). Absent = toutes les réactions sont village.
   */
  reactionsPartout?: number[];
  /** Comment il se perd, en une phrase. */
  remede: string;
  /** La ligne servie quand il se lève enfin. */
  guerison: string;

  // ── mécanique (toujours doublée d'un effet narratif) ─────────────────────
  /** Décale le SEUIL de tous les jets (Fiévreux : +1 cran partout). */
  seuilTous?: number;
  /** Modificateur par stat engagée. Positif = plus facile. */
  jets?: Partial<Record<StatNom, number>>;
  /**
   * Mention ajoutée sous l'anneau du dé — « Fièvre — défavorable ».
   * ⚠️ Exigence explicite de la spec : sans elle, le joueur ne comprend pas que
   * l'état agit. Jamais un chiffre, seulement le sens.
   */
  hint?: string;
  /** Les choix tagués `fuite` disparaissent (Boiteux : on ne fuit plus). */
  cacheFuite?: boolean;
  /** Ouvre « voler » dans les scènes taguées `food_available`/`stealable`. */
  ouvreVol?: boolean;
  /** Le Soupçon monte deux fois plus vite (Marqué). */
  soupconDouble?: boolean;
  /** Le Soupçon monte seul, chaque jour (Appelé — 2ᵉ lot, pas encore posé). */
  soupconParJour?: number;
  /** Lignes INTRUSES : une phrase qui n'appartient pas à la scène (Hanté). */
  lignesIntruses?: string[];
  /** Les Fixés se mettent à te parler — confidences autrement inaccessibles. */
  ouvreConfidences?: boolean;
  /** Perd un palier corporel à chaque nouveau jour sans soin (Fiévreux). */
  usureParJour?: number;
  /** Annule le premier échec critique de la journée (Serein — 2ᵉ lot). */
  amortitCritique?: boolean;
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
    id: "fievreux",
    nom: "FIÉVREUX",
    groupe: "corps",
    source: "Plaie non soignée, eau de la Mare, morsure.",
    remede: "Le Rebouteux, ou un objet de soin.",
    manifestation:
      "Le froid t'a lâché d'un coup, et c'est mauvais signe : ce n'est plus " +
      "l'air qui te réchauffe. Tes mains tremblent quand tu ne les regardes pas.",
    reactions: [
      "Un homme te croise, voit ta figure, et change de côté de chemin sans " +
        "même ralentir. Ici, la fièvre et la Fixation se ressemblent trop.",
      "On te répond de loin, en tenant sa manche devant sa bouche. Personne ne " +
        "te dit pourquoi — tout le monde le sait.",
    ],
    guerison:
      "La fièvre lâche prise d'un seul coup, comme une main qui s'ouvre. Le " +
      "froid revient, et pour la première fois depuis des jours, tu es content de l'avoir.",
    seuilTous: 1,
    hint: "Fièvre — défavorable",
    usureParJour: 0.12,
  },
  {
    id: "boiteux",
    nom: "BOITEUX",
    groupe: "corps",
    source: "Chute, piège, combat perdu.",
    remede: "Une nuit de repos complet au campement.",
    manifestation:
      "Le genou ne plie plus tout à fait. Tu peux marcher — tu ne peux plus " +
      "courir, et tu le sais avant d'avoir essayé.",
    reactions: [
      "Le chemin monte, et tu comptes tes pas comme on compte de la monnaie.",
      "Quelqu'un ralentit pour rester à ta hauteur. Ce n'est pas de la bonté : " +
        "c'est qu'on veut voir jusqu'où tu tiens.",
    ],
    reactionsPartout: [0], // « le chemin monte » ne met personne en scène
    guerison:
      "Au matin, tu poses le pied sans y penser. C'est à ça que tu comprends " +
      "que c'est passé : tu n'y as pas pensé.",
    // On se bat quand on ne peut plus fuir.
    jets: { COURAGE: 1, INSTINCT: -1 },
    hint: "Jambe — tu ne fuiras pas",
    cacheFuite: true,
  },
  {
    id: "affame",
    nom: "AFFAMÉ",
    groupe: "corps",
    source: "Plusieurs jours sans manger.",
    remede: "De la nourriture — troc, fruit, ou don.",
    manifestation:
      "Ce n'est plus une faim, c'est une distraction. Tu regardes les mains " +
      "des gens avant leur visage, pour voir ce qu'elles portent.",
    reactions: [
      "Le vieux coupe son quignon en deux sans te demander. Tu prends la " +
        "moitié plus vite que tu n'aurais voulu.",
      "Une femme range son panier derrière elle en te voyant approcher. Elle " +
        "ne dit rien. Elle n'a pas besoin.",
    ],
    guerison:
      "Tu manges lentement, exprès, pour te prouver que tu peux. Le monde " +
      "reprend sa taille normale.",
    // On est mauvais avec les gens quand on a faim.
    jets: { EMPATHIE: -1 },
    hint: "Faim — les mots viennent mal",
    ouvreVol: true,
  },
  {
    id: "marque",
    nom: "MARQUÉ",
    groupe: "social",
    source: "Vol vu, violence publique, dénonciation.",
    remede: "Quitter la zone, ou un acte de réparation.",
    manifestation:
      "Quelqu'un a parlé avant toi. Tu le vois à la façon dont les têtes se " +
      "tournent : pas vers toi — vers celui qui t'a désigné.",
    reactions: [
      "Une croix fraîche à la craie, sur le seuil que tu viens de passer. Elle " +
        "n'y était pas ce matin.",
      "La porte ne claque pas : elle se ferme lentement, en te regardant. " +
        "C'est pire.",
    ],
    guerison:
      "Le geste a été vu par les bonnes personnes. On ne t'absout pas — on " +
      "cesse simplement de te compter à part.",
    soupconDouble: true,
    hint: "Marqué — on te suit des yeux",
  },
  {
    id: "hante",
    nom: "HANTÉ",
    groupe: "mental",
    source: "Avoir vu quelque chose : le Gibet Vide, les Corbeaux, la mort d'un proche.",
    remede: "Aucun avant la fin de la run.",
    manifestation:
      "Ce que tu as vu ne s'est pas rangé. Ça reste posé de travers dans ta " +
      "tête, et ça bouge quand tu ne le regardes pas.",
    reactions: [
      "Tu t'entends répondre à quelqu'un qui n'a pas parlé. Personne ne " +
        "relève. C'est le pire.",
      "Une odeur de corde mouillée, ici, où il n'y a ni corde ni eau.",
    ],
    reactionsPartout: [1], // l'odeur de corde n'a besoin de personne
    guerison: "Rien ne lève cet état. Il te suivra jusqu'au bout de cette vie-là.",
    // L'obsession aiguise le regard et abîme le contact.
    jets: { INSTINCT: 1, EMPATHIE: -1 },
    hint: "Hanté — tu vois trop",
    /* ⚠️ LIGNES INTRUSES : elles s'insèrent dans des scènes qui ne les ont pas
       écrites. C'est tout leur intérêt — le joueur doit sentir qu'une phrase
       n'appartient pas là. Elles ne doivent donc JAMAIS nommer le lieu courant. */
    lignesIntruses: [
      "— « Tu comptes, toi aussi. » Personne autour de toi n'a ouvert la bouche.",
      "Quelque chose grince très haut, très loin, à une hauteur où il n'y a rien.",
      "Pendant une seconde, le sol sous tes pieds est de la terre retournée de frais.",
      "Tu portes la main à ton cou. Il n'y a rien. Tu l'y portes quand même.",
      // ⚠️ Les intruses se servent PARTOUT : aucune ne doit supposer un mur,
      // une foule, un décor (audit d'immersion 7/08 — deux d'entre elles
      // téléportaient un mur et des gens dans la lande vide).
      "Une ombre passe à ta gauche, à la vitesse d'un homme qui marche. Quand tu regardes, rien ne marche nulle part.",
      "Le vent dit un nom. Ce n'est pas le tien. Tu le retiens quand même.",
      "Tu comptes ce qui t'entoure — les ombres, les pierres. Il y en a toujours une de plus au deuxième compte.",
      "L'espace d'un pas, tes pieds ne touchent plus tout à fait le sol.",
    ],
  },
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

/** Le modificateur total d'un jet, tous états confondus. Jamais affiché. */
export function modEtats(actifs: Etat[], stat: StatNom): number {
  return actifs.reduce((n, e) => n + (e.jets?.[stat] ?? 0), 0);
}

/** Le décalage de SEUIL (Fiévreux). Positif = plus dur. */
export function seuilEtats(actifs: Etat[]): number {
  return actifs.reduce((n, e) => n + (e.seuilTous ?? 0), 0);
}

/** Les mentions à afficher sous l'anneau — au plus deux, sans quoi c'est un mur. */
export function hintsEtats(actifs: Etat[]): string[] {
  return actifs.map((e) => e.hint).filter((h): h is string => Boolean(h)).slice(0, 2);
}

/**
 * CONTRÔLE DE COUVERTURE — la spec interdit de livrer un état incomplet.
 * Utilisé par `tools/audit_etats.py` : un état qui échoue ici n'est pas
 * livrable, quel que soit l'état du code autour.
 */
export function auditEtats(): { id: string; manques: string[] }[] {
  return ETATS.map((e) => {
    const manques: string[] = [];
    if (!e.source) manques.push("source");
    if (!e.manifestation) manques.push("manifestation");
    if (e.reactions.length < 2) manques.push("2 réactions du monde");
    if (!e.remede || !e.guerison) manques.push("remède");
    // ⚠️ CETTE LISTE DOIT SUIVRE LE TYPE `Etat` (relecture par agents, 10/08).
    // Elle avait pris du retard sur lui : `rouvreLaRoute` et `fuitLeCombat`
    // (le Gamin des Murets) manquaient, et l'audit déclarait donc incomplet un
    // état parfaitement intégré. Personne ne s'en apercevait puisque aucun
    // script n'appelait `auditEtats` — voir `tools/etats.mjs`, qui le fait
    // désormais à chaque build. Tout nouvel effet mécanique s'ajoute ICI.
    const modifieLeJeu =
      e.cacheFuite || e.ouvreVol || e.ouvreConfidences || e.soupconDouble ||
      e.rouvreLaRoute || e.fuitLeCombat ||
      e.seuilTous !== undefined || e.jets !== undefined || e.lignesIntruses !== undefined;
    if (!modifieLeJeu) manques.push("1 effet mécanique (choix, jet ou monde)");
    return { id: e.id, manques };
  }).filter((r) => r.manques.length > 0);
}
