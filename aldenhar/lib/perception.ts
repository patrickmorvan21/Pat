/**
 * LES STATS COMME FILTRES DE PERCEPTION.
 *
 * Retour du test 4/08 §3, désigné par lui comme « l'ajout offrant le meilleur
 * rapport entre profondeur et coût de production » : les statistiques ne
 * devraient pas seulement augmenter des chances ou ouvrir des boutons — elles
 * devraient changer CE QUE LE HÉROS REMARQUE.
 *
 * Une ligne de perception s'ajoute à la narration d'un écran quand la stat
 * dominante du héros atteint le seuil. Effets recherchés :
 *   • le questionnaire du prologue devient immédiatement utile ;
 *   • revoir un lieu avec un autre héros donne un autre texte ;
 *   • les quatre stats deviennent quatre manières de comprendre le monde,
 *     pas quatre couleurs de jet.
 *
 * ⚠️ Règles, pour que ça reste de la perception et pas un pouvoir :
 *   • la ligne INFORME, elle ne résout jamais — elle ne débloque aucun choix
 *     à elle seule (ça, c'est le rôle des verrous et du Savoir) ;
 *   • UNE seule ligne par écran, même si deux stats sont hautes (la plus haute
 *     gagne ; à égalité, l'ordre du Seuil tranche) ;
 *   • jamais de chiffre, jamais le nom de la stat affiché ;
 *   • ton : une observation sèche, pas une explication.
 *
 * La relique « Œil de lanterne verte » (don `regard`) donne ces lignes comme
 * si la stat était haute — c'est son intérêt : voir avec les yeux d'un autre.
 */

import type { RunStats } from "@/lib/state";

export type StatNom = "courage" | "ruse" | "instinct" | "empathie";

/** Seuil d'apparition : la stat doit être franchement haute (4 ou 5 sur 5). */
export const SEUIL_PERCEPTION = 4;

/** Les lignes, par écran puis par stat. Toutes les scènes n'en ont pas. */
export const PERCEPTIONS: Record<string, Partial<Record<StatNom, string>>> = {
  "borne-frontiere": {
    instinct: "Les offrandes sont posées côté sud. Personne ne remercie ce qu'on laisse derrière soi.",
    ruse: "La pierre a été redressée récemment — le socle est plus propre que le reste. On l'a déplacée.",
  },
  "chemin-creux": {
    instinct: "Les traces contournent toutes le même muret. Quelque chose attend derrière.",
    courage: "Les talus sont hauts, mais la terre est meuble. On peut sortir de ce couloir si on le décide.",
  },
  "colline-aux-gibets": {
    ruse: "Les potences n'ont pas le même âge. Le cercle a été complété — on a ajouté des places.",
    empathie: "Les cordes sont nouées différemment. Chacune par une main qui connaissait celui du bout.",
  },
  "colline-aux-gibets-2": {
    instinct: "Le vent tourne autour du grand gibet sans jamais le toucher. Rien ne se pose dessus non plus.",
  },
  "pendu-qui-parle": {
    empathie: "Il ne demande pas qu'on le descende. Il demande qu'on l'écoute. Ce n'est pas la même peur.",
    ruse: "Sa chaîne de fonction est intacte. On l'a pendu avec ses insignes — c'est une mise en scène, pas une exécution.",
  },
  "champ-des-fixes": {
    ruse: "Les poteaux vierges sont plantés d'avance, en rang. On prépare les places avant d'avoir les noms.",
    instinct: "La terre du bout de rangée est retournée de frais. La prochaine place est déjà creusée.",
  },
  "petit-tribunal": {
    ruse: "Le registre utilise deux encres. La dernière ligne a été ajoutée bien après les autres.",
    empathie: "Les bancs sont usés d'un seul côté. Ici, on venait toujours s'asseoir à la même place.",
  },
  "petit-tribunal-2": {
    ruse: "L'écrivain trempe sa plume avant qu'on ait parlé. Il sait déjà ce qu'il va écrire.",
  },
  "serment-hameau": {
    empathie: "Ils n'ont pas peur de toi. Ils ont peur de ce qui arrive quand quelqu'un refuse.",
    instinct: "Aucun chien n'aboie. Il n'y a plus un seul chien dans ce hameau — ça s'entend.",
  },
  "hameau-entree-4": {
    empathie: "Le vieux récite le serment sans y croire. Il le récite quand même, tous les jours.",
    courage: "Trois hommes, un bâton. S'il fallait vraiment passer en force, ça passerait.",
  },
  campement: {
    instinct: "Le lit de bruyère est tassé côté porte. Qui dort ici veut pouvoir partir vite.",
    ruse: "Les marques du mur vont par cinq, mais la dernière série est incomplète. Le comptage s'est arrêté net.",
  },
  "chapelle-des-cordes": {
    empathie: "Chaque corde est pendue avec soin. Ce n'est pas un dépôt : c'est un cimetière rangé.",
    courage: "Le plafond tient à peine. Une seule poutre porte tout — et elle est fendue.",
  },
  "puits-condamne": {
    instinct: "Les coups suivent un ordre. Ce n'est pas quelqu'un qui appelle : c'est quelqu'un qui compte.",
    ruse: "Les clous des planches sont plantés depuis l'extérieur. On a fermé, mais on a fermé APRÈS.",
  },
  "mare-aux-regards": {
    instinct: "Aucun oiseau ne se pose sur cette eau. Les bêtes savent avant nous.",
    empathie: "Les gens du hameau y viennent quand même. Ils cherchent quelqu'un, pas leur reflet.",
  },
  "verger-noir": {
    ruse: "Les arbres sont greffés. Quelqu'un a travaillé ce verger longtemps après qu'il ait cessé de nourrir.",
    empathie: "Le couple bêche sans se parler. Ils ont dépassé le moment où l'on se parle.",
  },
  "chien-du-bailli": {
    courage: "La porte est solide, mais ses gonds ne le sont pas. Ils sont posés à l'extérieur.",
    instinct: "La bête ne garde pas la maison. Elle garde ce qui pourrait en sortir.",
  },
  "marche-muet": {
    ruse: "Personne ne parle, mais tout le monde compte. Les doigts bougent sous les manches.",
    empathie: "Le silence n'est pas une règle du marché. C'est une habitude de deuil.",
  },
  "palissade-sud": {
    courage: "Les pointes des rondins sont tournées vers l'intérieur. On ne se protège pas de l'extérieur, ici.",
    instinct: "Le sol devant le portillon est plus tassé que derrière. Beaucoup sont venus. Peu sont repassés.",
  },
  "tour-de-guet": {
    ruse: "La tour n'est pas tombée : on l'a démontée. Les pierres du haut sont empilées à côté, en ordre.",
  },
  "meute-grise-1": {
    instinct: "Elles ne t'encerclent pas. Elles t'orientent — vers un endroit qu'elles ont choisi.",
    empathie: "Ce ne sont pas des bêtes sauvages. Elles attendent quelqu'un qui ne vient plus.",
  },
};

/**
 * La stat DOMINANTE du héros — celle qui filtre sa perception. À égalité,
 * l'ordre du Seuil tranche (Courage → Ruse → Instinct → Empathie), pour que
 * deux runs aux mêmes stats voient exactement la même chose.
 */
export const ORDRE_STATS: StatNom[] = ["courage", "ruse", "instinct", "empathie"];

export function statDominante(stats: RunStats | undefined): StatNom | null {
  if (!stats) return null;
  let best: StatNom = ORDRE_STATS[0];
  for (const k of ORDRE_STATS) if (stats[k] > stats[best]) best = k;
  return stats[best] >= SEUIL_PERCEPTION ? best : null;
}

/**
 * La ligne de perception d'un écran, s'il y en a une pour ce héros.
 * `regard` (relique Œil de lanterne verte) donne accès aux lignes même quand
 * la stat n'atteint pas le seuil : on prend alors la plus haute stat, quelle
 * qu'elle soit — voir autrement, sans être devenu quelqu'un d'autre.
 */
export function perceptionDe(
  sceneId: string,
  stats: RunStats | undefined,
  regard = false
): string | null {
  const table = PERCEPTIONS[sceneId];
  if (!table || !stats) return null;
  let stat = statDominante(stats);
  if (!stat && regard) {
    stat = ORDRE_STATS[0];
    for (const k of ORDRE_STATS) if (stats[k] > stats[stat]) stat = k;
  }
  if (!stat) return null;
  // La dominante n'a pas toujours une ligne ici : on ne se rabat PAS sur une
  // autre stat (sinon la perception ne dépendrait plus du héros).
  return table[stat] ?? null;
}
