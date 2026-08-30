/**
 * Chapitres garantis (chantier n°2 du 23/07) — règle « je ne ressens pas
 * l'histoire ». Chaque traversée reçoit UN chapitre tiré parmi les 4 écrits,
 * en 3 beats insérés à des moments FIXES :
 *   • amorce       → la première liaison de la traversée ;
 *   • développement→ un LIEU dédié, garanti dans les choix d'orientation tant
 *                    que le chapitre est actif ;
 *   • résolution   → partielle, insérée avant la sortie de zone (la Descente).
 * Le pool de lieux ne fournit plus que le remplissage variable entre ces beats.
 *
 * Les 4 chapitres racontent chacun un angle de l'histoire du Bailli (fiche
 * Domaine ◆) : chacun LAISSE UNE QUESTION que les autres éclairent — le joueur
 * recolle l'histoire sur 3-4 runs. La rotation évite de retomber sur un
 * chapitre déjà vécu tant qu'il en reste des neufs (mémoire du compte).
 *
 * ⚠️ « Le Procès » existe aussi dans un document de démonstration côté Patrick
 * (non accessible depuis cette session) — texte à réconcilier s'il le fournit.
 */

export type Chapter = {
  id: string;
  /** Lieu (id de scène du pool de traversée) où se joue le développement. */
  lieuId: string;
  /** Beats d'amorce — ajoutés à la narration de la première liaison. */
  amorce: string[];
  /** Beats de développement — ajoutés à l'arrivée dans le lieu dédié. */
  developpement: string[];
  /** Résolution partielle — insérée avant la narration de la Descente. */
  resolution: string[];
  /**
   * Fragments de lore optionnels (règle de dosage du 25/07, 4e monnaie).
   * Servis UN PAR UN par les points d'intérêt marqués `chapterFragment` : le
   * joueur qui fouille recolle l'histoire du Bailli plus vite que celui qui
   * traverse tout droit. Ils n'avancent PAS le `stage` du chapitre — les trois
   * beats garantis (amorce / développement / résolution) restent intouchés,
   * ces fragments les épaississent seulement.
   *
   * Écrits pour tenir hors de leur lieu d'origine : un fragment peut tomber
   * n'importe où dans la zone, il ne doit donc jamais dire « ici » ni décrire
   * le décor de l'examen qui le sert.
   */
  fragments: string[];
};

export const LANDES_CHAPTERS: Chapter[] = [
  {
    // L'angle : comment on jugeait ici. Question laissée : qui a jugé le juge ?
    id: "le-proces",
    lieuId: "petit-tribunal",
    amorce: [
      "Sur un muret, quelqu'un a gravé une phrase, puis l'a barrée : « Ici, tout passe en jugement. » La barre est plus récente que les mots — comme si l'auteur avait compris trop tard que ce n'était pas une menace, mais une procédure.",
    ],
    developpement: [
      "C'est donc ici que ça se décidait. Trois bancs pour le hameau, une chaire pour un seul homme. Le Bailli écoutait, disait la sentence — toujours la même — et la corde faisait le reste.",
      "Sur le bois de la chaire, des entailles fines : une par jugement, alignées comme des jours. La dernière est plus profonde que les autres. Tremblée. Celle-là, il ne voulait pas la compter.",
    ],
    resolution: [
      "En quittant les Landes, la question marche avec toi : chaque pendu de la colline a eu son procès, ses trois bancs, sa sentence dite à voix haute. Tous — sauf le juge. Qui a jugé le Bailli ? Et pourquoi sa dernière entaille tremble-t-elle ?",
    ],
    fragments: [
      "Un détail te revient, entendu ou deviné : la sentence ne pouvait pas tomber sans un témoin du hameau. Un seul suffisait. Il n'était pas obligé de parler — juste d'être là et de ne pas partir. Rester, c'était signer.",
      "On dit que le Bailli ne haussait jamais la voix. Il posait deux questions, toujours les mêmes, et la seconde était : « Tu veux ajouter quelque chose ? » Personne n'a jamais su si c'était une politesse ou la dernière marche.",
      "Les sentences étaient identiques, mais pas les délais. Certains montaient le jour même. D'autres attendaient trois aubes. Le hameau appelait ça la mesure du Bailli, et personne n'a jamais su ce qu'il mesurait.",
      "Les trois bancs n'étaient pas égaux. Celui de droite, plus bas, plus usé, était celui des familles — on s'y asseyait pour entendre la sentence de son propre sang. Le bois y est lissé par des mains qui se sont tenues.",
      "Il y avait une règle que personne ne comprenait : aucun jugement après le crépuscule. Jamais. Le Bailli remettait au lendemain plutôt que d'ouvrir la séance à la nuit tombée. Comme si le noir pouvait témoigner à charge.",
      "Le dernier procès a duré une nuit entière — le seul, contre toutes ses règles. Le hameau est resté dehors, et personne n'a jamais dit qui était jugé. Ceux qui étaient assez vieux pour s'en souvenir changent de rue quand on le demande.",
    ],
  },
  {
    // L'angle : la comptabilité des morts. Question laissée : la ligne sans nom.
    id: "le-registre",
    lieuId: "champ-des-fixes",
    amorce: [
      "Un vieux, assis contre un muret, gratte une planchette sans te regarder. « Tout le monde a sa ligne, ici », dit-il. « Nom, motif, jours. Même toi — surtout toi. Elle est déjà ouverte. »",
    ],
    developpement: [
      "Le champ entier est un registre debout. Chaque poteau son pendu, chaque pendu son écriteau : un nom, un motif, un nombre de jours. Une écriture de greffe, appliquée, sans colère.",
      "Un seul écriteau détonne : le motif a été gratté au couteau, si fort que le bois est entaillé. Le nom reste, le nombre de jours reste. Ce qu'elle avait fait, quelqu'un n'a pas supporté qu'on le lise.",
    ],
    resolution: [
      "Tu emportes des Landes une image : cet écriteau au motif gratté, illisible pour toujours. Qui a gratté ? La main qui a écrit — ou une main qui aimait la pendue ? Le registre, lui, n'oublie rien. Il attend juste la prochaine ligne.",
    ],
    fragments: [
      "La formule est toujours la même, tu commences à la reconnaître : un nom, deux mots de motif, un nombre. Jamais de date. Comme si le jour n'avait pas d'importance — seulement combien de jours la personne avait tenu avant.",
      "Le motif qui revient le plus n'est pas le vol, ni le meurtre. C'est trois mots : « a parlé dehors ». Tu ne sais pas encore ce qu'on parlait, ni à qui, ni pourquoi le dehors compte.",
      "Une ligne du registre n'a pas de nom. Le motif est rempli, le nombre de jours aussi — quatre-vingt-onze — et l'emplacement du nom est laissé propre. Pas gratté : jamais écrit. Quelqu'un a compté une vie sans accepter de la nommer.",
      "Les nombres de jours ne montent pas au hasard. Aucun n'est en dessous de neuf, aucun au-dessus de quatre-vingt-onze. Comme si en deçà on ne comptait pas encore, et au-delà on ne comptait plus.",
      "Certaines lignes portent, tout au bout, une petite croix à l'encre. Elles sont rares. Tu finis par voir ce qu'elles ont en commun : ce sont celles dont le nombre de jours est le plus élevé. Les croix marquent ceux qui ont tenu.",
      "Il manque une année entière au registre. Les lignes sautent d'un hiver au suivant, sans rupture apparente, sans page arrachée : simplement, cette année-là, personne n'a été compté. Ou personne n'a voulu l'écrire.",
    ],
  },
  {
    // L'angle : celle qui s'est relevée. Question laissée : qui a coupé la corde ?
    id: "la-fille",
    lieuId: "campement",
    amorce: [
      // ⚠️ Amorce jouée à la PREMIÈRE liaison, donc en pleine lande — pas de
      // maison, pas de seuil (playtest auto 7/08 : « une femme au seuil d'une
      // maison basse » servie entre la Borne et le premier lieu). Une
      // silhouette qui TRAVERSE, oui ; du bâti, non.
      "Une femme traverse la lande en biais, un fagot sur l'épaule, et te suit des yeux sans ralentir. Puis elle se signe à l'envers. « Si tu dors au moulin », dit-elle sans que tu aies rien demandé, « laisse le lit de bruyère comme tu l'as trouvé. Il sert encore. »",
    ],
    developpement: [
      "Le lit de bruyère du moulin est tassé, refait de frais, et court — bien trop court pour un adulte. Sur la pierre du mur, à hauteur d'enfant, des marques : des jours comptés par paquets de cinq, sur des années.",
      "Et dans un creux du mur, serré dans un chiffon : un bout de corde. Court. Trop court pour un cou d'homme. On ne garde pas ça par hasard — on garde ça comme on garde la chose qui aurait dû nous tuer, pour vérifier de temps en temps qu'elle n'a pas grandi non plus.",
    ],
    resolution: [
      "En sortant des Landes, tu sais une chose que le hameau tait : une pendue s'est relevée, et elle marche encore. Elle a huit ans, et le village a préféré ne pas la voir plutôt que d'admettre que la Fixation peut rater. C'est ça, le secret — pas un coupable : une lâcheté que trois cents noms couvrent.",
    ],
    fragments: [
      "Personne ne dit son nom. On dit « la Petite Fixée », comme on lit un écriteau, et on change de sujet, et on regarde ailleurs. Un hameau qui compte tout, qui grave tout, qui affiche ses morts — et qui a trouvé le moyen de nommer celle-là sans jamais dire son nom.",
      // Formulation indépendante du parcours (rapport IA externe 8/08) : le
      // fragment peut tomber n'importe où — il ne peut pas présupposer
      // « deux phrases entendues à un jour d'écart » que le héros n'a
      // peut-être jamais entendues.
      "Deux détails, ramassés à des endroits différents, finissent par se rejoindre : elle était la fille du Bailli. Voilà pourquoi le motif de son écriteau a été gratté. Voilà, peut-être, pourquoi la dernière entaille de la chaire tremble.",
      "Des provisions apparaissent là où elle dort. Pas un festin : du pain dur, de l'eau, parfois du sel. Déposés par quelqu'un qui refuse qu'elle meure et refuse aussi qu'on le voie. Le hameau la renie à voix haute et la nourrit en silence.",
      "Les marques de comptage de son mur ne s'arrêtent pas. Elles continuent après la date qu'on devine être celle de sa pendaison — et elles restent toutes à la même hauteur, année après année. Celle qui les trace n'a jamais eu à lever le bras plus haut.",
      "Les mères d'ici ne défendent pas à leurs enfants d'aller au moulin. Elles leur défendent de lui PARLER. La nuance est terrible : ils savent tous qu'elle y est. Et les enfants, eux, ne trouvent rien d'étrange à jouer avec quelqu'un de leur âge.",
      "On raconte qu'elle ne dort jamais deux nuits de suite au même endroit — sauf au moulin. Ce serait le seul endroit des Landes où elle se sent tenue, et personne ne sait ce qui la tient là.",
    ],
  },
  {
    // L'angle : le gibet démesuré. Question laissée : pour qui — et pourquoi vide ?
    id: "le-gibet-vide",
    lieuId: "colline-aux-gibets",
    amorce: [
      "À l'horizon, la colline porte sa couronne de potences. L'une dépasse toutes les autres — de beaucoup trop. Aucun homme n'a jamais eu cette taille. Et c'est la seule dont la corde pend, vide.",
    ],
    developpement: [
      "De près, le grand gibet est pire : taillé large, chevillé double, dimensionné pour un cou qui n'est pas un cou d'homme. Celui qui l'a bâti savait exactement quelle taille il visait.",
      "Sa corde est usée en son milieu — pas au nœud, au MILIEU. Comme si quelque chose l'avait éprouvée de l'intérieur, longtemps, sans jamais s'y laisser prendre. Juste à côté, un gibet bas, à hauteur d'homme. Occupé, lui.",
    ],
    resolution: [
      "Tu quittes les Landes avec cette mesure en tête : un gibet taillé pour quelque chose de plus grand qu'un homme, dressé par un homme qui s'est pendu à côté, à sa propre hauteur. Il visait qui, le Bailli — et pourquoi la corde du grand gibet est-elle usée si personne n'y a jamais pendu ?",
    ],
    fragments: [
      "Le bois du grand gibet ne vient pas des Landes. Il n'y pousse rien d'assez droit ni d'assez épais. On l'a fait monter de loin, par charrette, en plusieurs voyages — un chantier, pas un accès de colère.",
      "En le bâtissant, le Bailli aurait dit une phrase que le hameau se répète encore, sans la comprendre : « Celui-là, il faudra qu'il descende de lui-même. » On ne bâtit pas un gibet pour quelqu'un qui doit y monter volontairement. Sauf s'il n'y a pas d'autre moyen.",
      "Il grince les nuits sans vent. Ceux qui l'ont entendu ne montent plus sur la crête après le crépuscule — non par peur du bruit, mais parce que le bruit veut dire que la corde bouge, et que rien ne la touche.",
      "Les charretiers qui ont monté le bois ont été payés double, et aucun n'est resté pour le voir dressé. On dit qu'ils sont repartis avant la nuit, tous, le même jour, sans réclamer le repas convenu.",
      "Le grand gibet est orienté. Pas au hasard : son bras pointe exactement le sud, vers la Descente. Un gibet ne s'oriente pas — sauf s'il désigne.",
      "Il n'y a pas d'échelle. Aucune trace de marches, aucun montant entaillé, rien pour grimper. On a bâti une potence trop haute pour un homme et on n'a prévu aucun moyen d'y monter. Ce qu'elle attendait devait y arriver seul.",
    ],
  },
];

/**
 * Fragments de ZONE — filet de sécurité de la règle de dosage (25/07 : « chaque
 * point d'intérêt rend une des quatre monnaies. JAMAIS RIEN »).
 *
 * Une run très fouilleuse peut épuiser les 6 fragments de son chapitre avant
 * d'avoir vu tous les points de lore. Sans ce pool, les examens suivants ne
 * rendraient plus rien — exactement ce que la règle interdit. Ces fragments-ci
 * ne parlent donc pas du Bailli mais des Landes elles-mêmes : ils tiennent quel
 * que soit le chapitre tiré, et ne referment aucune des questions posées par
 * les quatre angles.
 */
export const LANDES_LORE_FRAGMENTS: string[] = [
  "Tu remarques une chose en marchant : il n'y a pas d'oiseaux. Pas un cri, pas un vol. Seuls les corbeaux du Compte, et ceux-là ne chantent pas — ils comptent.",
  "Le crépuscule ne bouge pas. Tu as marché des heures et la lumière est exactement la même, au même endroit du ciel. Les Renonçants ont arrêté d'appeler ça le soir. Ils disent « l'heure », comme s'il n'y en avait qu'une.",
  "Toutes les cordes des Landes sont du même chanvre. Le même torsadage, la même épaisseur, la même odeur grasse. Quelqu'un, une fois, en a fabriqué assez pour un siècle.",
  "Les murets ne servent à rien. Ils ne clôturent aucun champ, ne retiennent aucune bête, ne longent aucun chemin utile. Ils suivent des tracés qui ne mènent nulle part — sauf, parfois, à un poteau.",
  "Il n'y a pas de tombes dans les Landes. Des poteaux, des potences, des écriteaux, mais pas une tombe. On expose les morts. On ne les couche pas.",
  "Le vent porte parfois une odeur de pain chaud. Toujours du sud, toujours de la Descente, toujours quand tu as faim. Les Renonçants s'arrêtent de respirer par le nez quand ça arrive.",
];

/**
 * Tire le chapitre d'une traversée : au hasard parmi ceux que le compte n'a
 * pas encore vécus ; quand tous ont été vus, la rotation repart complète.
 */
export function drawChapter(seen: string[]): Chapter {
  const fresh = LANDES_CHAPTERS.filter((c) => !seen.includes(c.id));
  const pool = fresh.length > 0 ? fresh : LANDES_CHAPTERS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function chapterById(id: string): Chapter | null {
  return LANDES_CHAPTERS.find((c) => c.id === id) ?? null;
}
