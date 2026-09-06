/**
 * LE PROFIL SE CONSTRUIT EN JOUANT — il ne se choisit plus avant.
 *
 * Principe posé par Patrick le 06/09, et c'est le renversement de tout le
 * système d'avant :
 *
 *   « PACTUM ne demande jamais au joueur quel personnage il veut incarner.
 *     Il l'observe jusqu'à pouvoir lui dire quel personnage il est devenu. »
 *
 * Ce qui disparaît : le questionnaire du Seuil (quatre souvenirs), le verdict
 * au radar avant la première scène, et l'idée même d'un « build de départ ».
 * Ce qui le remplace : quatre tendances qui commencent INDÉTERMINÉES et que
 * les décisions réelles nourrissent en silence, jusqu'à ce que le Geôlier ait
 * assez vu pour interrompre la partie et dessiner ce qu'il a compris.
 *
 * ⚠️ INDÉTERMINÉ SE DIT `stats: undefined`, PAS « quatre valeurs neutres ».
 * C'est la distinction que le brief insiste à faire : un radar homogène
 * raconte déjà « voici ton build ». `statDe()` rend 3 pour une stat absente,
 * donc tant que rien n'est révélé le modificateur de dé vaut 0, les verrous à
 * seuil restent fermés et aucune variante de dominante ne se propose — sans
 * qu'une seule ligne du moteur ait à connaître ce fichier.
 *
 * ⚠️ AUCUNE NOTIFICATION, JAMAIS. Le joueur ne voit ni « + COURAGE », ni
 * jauge, ni compteur. Il joue ; le monde regarde.
 *
 * ⚠️ ET RIEN N'EST SCOLAIRE. Une décision ne vaut jamais « +1 dans l'axe de
 * son libellé » : elle pèse sur PLUSIEURS axes, avec des signes différents.
 * Foncer dit du courage ET dit qu'on n'a pas écouté ; ruser dit de la ruse ET
 * quelque chose sur le rapport aux autres. C'est ce qui empêche le joueur de
 * piloter son profil au lieu de jouer.
 */

import type { Choice, Scene } from "@/lib/scene-data";

export const AXES = ["courage", "ruse", "instinct", "empathie"] as const;
export type Axe = (typeof AXES)[number];

/** Évidence signée, accumulée. Ce ne sont PAS des stats : ni bornes, ni échelle. */
export type Tendances = Record<Axe, number>;

export type ProfilRun = {
  t: Tendances;
  /** Décisions RÉVÉLATRICES observées — un « Continuer » n'en est pas une. */
  n: number;
  /** Le Geôlier a-t-il déjà dessiné ce héros ? */
  revele: boolean;
};

export function profilNeuf(): ProfilRun {
  return { t: { courage: 0, ruse: 0, instinct: 0, empathie: 0 }, n: 0, revele: false };
}

/** Une sauvegarde d'avant le 06/09 n'a pas de profil : elle en prend un neuf. */
export function profilDepuis(p: unknown): ProfilRun {
  const o = p as Partial<ProfilRun> | undefined;
  if (!o || typeof o.n !== "number" || !o.t) return profilNeuf();
  const t = o.t as Partial<Tendances>;
  return {
    t: {
      courage: Number(t.courage) || 0,
      ruse: Number(t.ruse) || 0,
      instinct: Number(t.instinct) || 0,
      empathie: Number(t.empathie) || 0,
    },
    n: o.n,
    revele: Boolean(o.revele),
  };
}

/* ------------------------------------------------------- CE QUE DIT UN GESTE */

type Vecteur = Partial<Record<Axe, number>>;

/**
 * LA TABLE DE LECTURE des jets — indexée par (stat engagée × nature du jet).
 *
 * ⚠️ Elle n'est pas dérivée de la stat seule, et c'est tout l'enjeu. Le même
 * COURAGE ne dit pas la même chose selon ce qu'on affronte : forcer un passage
 * (physique) dit qu'on n'a pas pris le temps de sentir ; tenir tête à quelqu'un
 * (social) dit qu'on n'a pas cherché le détour. Le second axe, souvent négatif,
 * est ce qui empêche un joueur de monter ses quatre axes en enchaînant des
 * jets — chaque engagement coûte ailleurs.
 */
const LECTURE_DU_JET: Record<string, Record<string, Vecteur>> = {
  COURAGE: {
    physique: { courage: 3, instinct: -1 },
    social: { courage: 3, ruse: -1 },
    exploration: { courage: 2, instinct: 1 },
    surnaturel: { courage: 3, ruse: -1 },
  },
  RUSE: {
    physique: { ruse: 3, courage: -1 },
    social: { ruse: 3, empathie: -1 },
    exploration: { ruse: 2, instinct: 1 },
    surnaturel: { ruse: 2, instinct: 1 },
  },
  INSTINCT: {
    physique: { instinct: 3, ruse: 1 },
    social: { instinct: 2, empathie: 1 },
    exploration: { instinct: 3, ruse: 1 },
    surnaturel: { instinct: 3, courage: -1 },
  },
  EMPATHIE: {
    physique: { empathie: 3, courage: 1 },
    social: { empathie: 3, ruse: -1 },
    exploration: { empathie: 2, instinct: 1 },
    surnaturel: { empathie: 2, courage: 1 },
  },
};

/**
 * Ce qu'un geste apprend sur celui qui l'a fait — ou `null` s'il n'apprend
 * rien.
 *
 * ⚠️ RENDRE `null` EST LA MOITIÉ DU TRAVAIL. Une ouverture de porte, un
 * « Continuer », une orientation à la Croisée ne disent rien de personne : les
 * compter diluerait l'évidence et ferait tomber la révélation sur du bruit.
 * Seules les décisions qui ENGAGENT quelque chose sont lues.
 */
export function lireLeGeste(choice: Choice, scene?: Scene): Vecteur | null {
  // 1. Un poids écrit à la main gagne toujours : c'est le cas d'auteur, posé
  //    là où la lecture par défaut serait fausse ou trop pauvre.
  if (choice.tendances) return choice.tendances;

  // 2. Un jet : la table ci-dessus. C'est le signal le plus riche du jeu —
  //    le joueur a choisi d'engager CETTE qualité-là contre un risque.
  if (choice.risky) {
    const nature = choice.nature ?? (scene?.combat ? "physique" : "social");
    return LECTURE_DU_JET[choice.risky.stat]?.[nature] ?? null;
  }

  // 3. Les gestes sans dé qui disent quand même quelque chose.
  //    Un serment est la décision morale la plus lourde de la zone.
  if (choice.serment === "jure") return { empathie: 2, courage: 1, ruse: -1 };
  if (choice.serment === "faux") return { ruse: 3, empathie: -2 };
  if (choice.serment === "refuse") return { courage: 3, ruse: -1, empathie: -1 };

  // Aller regarder avant d'agir : c'est de l'instinct, et un peu de calcul.
  if (choice.observe) return { instinct: 2, ruse: 1 };

  // Fuir : le corps décide avant la tête.
  if (choice.tags?.includes("fuite")) return { instinct: 2, courage: -1 };

  // Un acte qui se VOIT (il coûte du Soupçon) : on l'a fait quand même.
  if (choice.soupcon && choice.soupcon > 0) return { courage: 1, ruse: -1 };

  // Faire demi-tour devant un avertissement : on a écouté le monde.
  if (choice.demiTour) return { instinct: 3, courage: -2 };

  // 4. EXAMINER EST UNE DÉCISION — celle de regarder avant d'agir.
  //
  // ⚠️ SANS CETTE BRANCHE, LE JOUEUR CURIEUX N'ÉTAIT LU PAR RIEN. Mesuré sur
  // une première vie en explorant sans jamais engager le dé : 34 décisions
  // prises, profil resté à ZÉRO — le Geôlier ne l'aurait jamais vu, et toute
  // la promesse de la V2 tombait pour lui. Les seuls examens lus jusque-là
  // étaient ceux qui portent `observe` (« explorer prépare »), une poignée.
  //
  // Poids faible et à deux axes : c'est un geste, pas un engagement. Et ça
  // reste compatible avec « rendre null est la moitié du travail » — une
  // SORTIE, une ORIENTATION ou une continuation sans conséquence écrite ne
  // disent toujours rien de personne.
  if (choice.passive?.consequence && !choice.sortie && !choice.orient) {
    return { instinct: 1, ruse: 1 };
  }

  // 5. Tout le reste — continuer, s'orienter, sortir — n'apprend rien.
  return null;
}

/** Accumule sans jamais borner : les bornes n'existent qu'à l'affichage. */
export function nourrir(p: ProfilRun, v: Vecteur): ProfilRun {
  const t = { ...p.t };
  for (const a of AXES) t[a] += v[a] ?? 0;
  return { ...p, t, n: p.n + 1 };
}

/* ------------------------------------------------- QUAND IL A ASSEZ VU */

/**
 * ⚠️ LE DÉCLENCHEUR N'EST PAS UN COMPTEUR (§7 du brief : « ne pas déclencher
 * après exactement quatre choix, sinon le système devient mécanique »). Il
 * croise trois choses :
 *   • assez de décisions révélatrices (plancher dur) ;
 *   • assez d'ÉVIDENCE, et l'évidence pèse la DIVERSITÉ autant que la
 *     quantité — quatre jets de Courage n'apprennent pas grand-chose de plus
 *     qu'un seul ;
 *   • un moment où l'interruption ne coupe rien.
 * Selon la route jouée, ça tombe après quatre décisions ou après sept. C'est
 * le Geôlier qui décide, pas un seuil qu'on peut compter.
 */
export const DECISIONS_MINIMUM = 3;
export const SEUIL_EVIDENCE = 15;

export function evidence(p: ProfilRun): number {
  const axes = AXES.filter((a) => Math.abs(p.t[a]) >= 1).length;
  const total = AXES.reduce((s, a) => s + Math.abs(p.t[a]), 0);
  return total * (0.6 + 0.2 * axes);
}

/**
 * Le moment est-il sûr ? Il l'est sur une LIAISON — l'écran de marche entre
 * deux lieux. C'est la seule transition du jeu où il n'y a ni adversaire, ni
 * geste tactile en cours, ni compte à rebours, ni décision suspendue.
 */
export function peutSeDessiner(p: ProfilRun, scene: Scene): boolean {
  if (p.revele) return false;
  if (p.n < DECISIONS_MINIMUM) return false;
  if (evidence(p) < SEUIL_EVIDENCE) return false;
  return Boolean(scene.liaison) && !scene.combat && !scene.timed && !scene.terminal;
}

/* --------------------------------------------------- CE QU'IL VOIT DE TOI */

export type Stats = Record<Axe, number>;

/**
 * Les tendances deviennent une forme lisible, sur l'échelle 1..5 du radar.
 *
 * ⚠️ CENTRÉ SUR L'ÉCART, PAS SUR UN SEUIL ABSOLU. Un seuil absolu punirait
 * celui qui joue peu (tout à 1) et récompenserait celui qui multiplie les
 * jets (tout à 5) — alors que le profil décrit une MANIÈRE, pas une quantité.
 * On lit donc l'écart de chaque axe à la moyenne, et on l'amplifie d'autant
 * plus que l'évidence est forte : un héros à peine observé rend une forme
 * presque ronde, un héros longuement observé une forme franche.
 */
export function statsDepuisTendances(p: ProfilRun): Stats {
  const moy = AXES.reduce((s, a) => s + p.t[a], 0) / AXES.length;
  const ecart = Math.max(...AXES.map((a) => Math.abs(p.t[a] - moy)), 1);
  const amp = Math.min(1, evidence(p) / (SEUIL_EVIDENCE * 1.5));
  const out = {} as Stats;
  for (const a of AXES) {
    const rel = (p.t[a] - moy) / ecart; // −1 … +1
    out[a] = Math.max(1, Math.min(5, Math.round(3 + rel * 2 * amp)));
  }
  return out;
}

/** L'axe dominant, pour la prose — jamais un chiffre. */
export function dominante(p: ProfilRun): Axe {
  return AXES.reduce((best, a) => (p.t[a] > p.t[best] ? a : best), AXES[0]);
}

/** Proximité de deux profils (0 = identiques) — sert la mémoire inter-vies. */
export function distance(a: Stats, b: Stats): number {
  return AXES.reduce((s, k) => s + Math.abs(a[k] - b[k]), 0);
}

/**
 * L'ENGAGEMENT MOYEN, pour le portrait d'un profil PLAT.
 *
 * ⚠️ Un profil plat n'est pas un profil faible — faute déjà commise et
 * corrigée le 02/09, et qui reviendrait ici sans ce calcul. Quatre axes
 * équilibrés, ça peut être quelqu'un qui s'est jeté sur tout (il a tout
 * engagé, rien ne ressort) comme quelqu'un qui n'a rien tenté. Le radar
 * montre la même forme ; le portrait, lui, ne doit pas dire la même chose.
 *
 * On lit donc le VOLUME signé de ce qui a été observé, pas l'écart entre
 * axes : rendu sur l'échelle 1..3 qu'attend `portraitDuSeuil` (3 = direct,
 * 1 = retrait), la même valeur sur les quatre axes puisque c'est justement
 * le fait qu'aucun ne domine qui nous amène ici.
 */
export function engagementDepuisTendances(p: ProfilRun): Partial<Record<Axe, number>> {
  const moy = p.n > 0 ? AXES.reduce((s, a) => s + p.t[a], 0) / p.n : 0;
  const niveau = moy >= 2 ? 3 : moy <= 0.5 ? 1 : 2;
  const out: Partial<Record<Axe, number>> = {};
  for (const a of AXES) out[a] = niveau;
  return out;
}
