/**
 * LES TÉMOINS — le Soupçon cesse d'être un compteur, il devient des gens.
 *
 * Retour du test 4/08 §2 : « au lieu d'avoir Soupçon : 5, le jeu pourrait
 * mémoriser — la femme du seuil t'a vu parler seul, le marchand t'a vu
 * répondre aux voix. Lorsque le procès se déclenche, ce sont réellement ces
 * personnes qui témoignent. »
 *
 * Le compteur `run.soupcon` reste (il pilote les manifestations et le seuil du
 * procès) — mais chaque montée inscrit désormais QUI a vu QUOI. Au procès, ce
 * sont ces dépositions qui sont lues, dans l'ordre où elles ont eu lieu : la
 * mort par fixation devient la conclusion exacte de la run, pas un verdict
 * générique.
 *
 * ⚠️ Jamais de chiffre affiché : le joueur ne voit pas « Soupçon 5 », il voit
 * cinq personnes se lever et raconter ce qu'il a fait.
 */

export type Temoin = {
  /** Identité stable du témoin (un même témoin ne dépose qu'une fois). */
  id: string;
  /** Comment le hameau l'appelle. */
  nom: string;
  /** Ce qu'il a vu — à la 2ᵉ personne, épicène, prêt à être lu au procès. */
  deposition: string;
  /** Le lieu où ça s'est passé, AVEC sa préposition (« au Marché Muet »,
      « à la Colline ») — la déposition se lit « Nom, <lieu> : … ». */
  lieu: string;
};

/**
 * Le catalogue : à quel acte du joueur correspond quel témoin. La clé est
 * l'`id` du choix (ou du point d'intérêt) qui fait monter le Soupçon.
 *
 * Règle d'écriture : la déposition est TOUJOURS vraie et TOUJOURS partielle.
 * Le témoin ne ment pas — il raconte ce qu'il a vu, sans ce qu'il n'a pas
 * compris. C'est ce décalage qui rend la défense possible.
 */
export const TEMOINS: Record<string, Omit<Temoin, "id">> = {
  // ⚠️ Les clés sont les ids RÉELS des choix et points d'intérêt qui font
  // monter le Soupçon dans scene-data.ts (contrôlés par script) — un acte sans
  // témoin ici fait quand même monter le compteur, il ne produit simplement
  // personne à la barre. Ne jamais inventer une clé : elle serait morte.
  "hesitant-mentir": {
    nom: "Le berger des murets",
    deposition: "Je l'ai entendu promettre à l'homme de la Borne qu'il reviendrait. Il n'est pas revenu.",
    lieu: "à la Borne Frontière",
  },
  "poteau-pendu": {
    nom: "Le Gamin des Murets",
    deposition: "Il est resté sous le gibet du Bailli. À le regarder. Longtemps.",
    lieu: "à la Colline aux Gibets",
  },
  plaider: {
    nom: "Le Sonneur sans Cloche",
    deposition: "Il a parlé au pendu. Et le pendu lui a répondu — j'étais à trente pas.",
    lieu: "à la Colline aux Gibets",
  },
  decrocher: {
    nom: "La Doyenne",
    deposition: "Il a porté la lame sur une corde qui tenait. Chez nous, ça a un nom.",
    lieu: "à la Colline aux Gibets",
  },
  "poteaux-vierges": {
    nom: "Le Fossoyeur des Poteaux",
    deposition: "Il a compté les places vides. Personne ne compte les places vides sans y penser pour soi.",
    lieu: "au Champ des Fixés",
  },
  "croix-craie": {
    nom: "La Femme au Seuil",
    deposition: "Il a touché la craie de ma porte. La marque était fraîche, et c'était la mienne.",
    lieu: "au Hameau des Renonçants",
  },
  "frapper-porte-marquee": {
    nom: "La Femme au Seuil",
    deposition: "Il a frappé chez une marquée. On ne frappe pas chez une marquée, on passe.",
    lieu: "au Hameau des Renonçants",
  },
  "femme-regarder-sud": {
    nom: "La Femme au Seuil",
    deposition: "Il a regardé le sud avec moi. On était deux à regarder le sud. Le hameau nous a vus.",
    lieu: "au Hameau des Renonçants",
  },
  "femme-refuser": {
    nom: "La Femme au Seuil",
    deposition: "Je lui ai demandé une chose. Il a dit non, sans même chercher une raison.",
    lieu: "au Hameau des Renonçants",
  },
  "femme-echange": {
    nom: "La Femme au Seuil",
    deposition: "Il a proposé un échange. Ici, un échange, ça veut dire une place contre une place.",
    lieu: "au Hameau des Renonçants",
  },
  "observer-couvert": {
    nom: "Le Gamin des Murets",
    deposition: "Il est resté longtemps derrière le talus, à nous compter, avant d'entrer.",
    lieu: "à l'entrée du Hameau",
  },
  "passer-sans-arret": {
    nom: "Les trois hommes du seuil",
    deposition: "Il a voulu passer sans s'arrêter. Personne ne passe sans s'arrêter.",
    lieu: "à l'entrée du Hameau",
  },
  "demander-crainte": {
    nom: "Les trois hommes du seuil",
    deposition: "Il a demandé de quoi on avait peur. On ne pose pas cette question quand on est de passage.",
    lieu: "à l'entrée du Hameau",
  },
  "pourquoi-trois-aubes": {
    nom: "Les trois hommes du seuil",
    deposition: "Il a voulu savoir pourquoi trois aubes. Devant tout le barrage. À voix haute.",
    lieu: "à l'entrée du Hameau",
  },
  "jurer-faux": {
    nom: "Les trois hommes du seuil",
    deposition: "Il a juré. Du bout des lèvres, en regardant ailleurs. On l'a laissé entrer quand même.",
    lieu: "à l'entrée du Hameau",
  },
  "refuser-serment": {
    nom: "Les trois hommes du seuil",
    deposition: "On lui a demandé de jurer comme tout le monde. Il n'a pas voulu.",
    lieu: "à l'entrée du Hameau",
  },
  "ecouter-nuit": {
    nom: "Le vieux de la grange",
    deposition: "Il n'a pas dormi. Il a écouté ce qui tournait dehors, toute la nuit, sans bouger.",
    lieu: "dans la grange du Hameau",
  },
  "repartir-inventorie": {
    nom: "Le vieux de la grange",
    deposition: "Au matin, il a compté ce qu'il avait. Devant nous. Comme si on lui avait pris quelque chose.",
    lieu: "dans la grange du Hameau",
  },
  rebouteux: {
    nom: "Le Rebouteux",
    deposition: "Il est venu se faire soigner d'une plaie qu'aucun outil du hameau ne fait.",
    lieu: "au Marché Muet",
  },
  "autel-renverse": {
    nom: "La Veuve des Cordes",
    deposition: "Il a fouillé sous l'autel. Ce qui est dessous n'est pas à nous non plus, mais on n'y touche pas.",
    lieu: "à la Chapelle des Cordes",
  },
  "aborder-renoncant-mare": {
    nom: "Le Renonçant de la Mare",
    deposition: "Il m'a parlé au bord de l'eau. Il regardait mon reflet, pas moi.",
    lieu: "à la Mare aux Regards",
  },
  "souche-premier-arbre": {
    nom: "Les Époux du Verger",
    deposition: "Il a compté nos rangs. On sait ce que ça veut dire, quand un étranger compte.",
    lieu: "au Verger Noir",
  },
  "berge-usee": {
    nom: "Le Renonçant de la Mare",
    deposition: "Il s'est agenouillé aux creux de la berge. Comme quelqu'un qui croit à ce qu'on y raconte.",
    lieu: "à la Mare aux Regards",
  },
  // Deux entrées SYNTHÉTIQUES (pas des ids de choix) : l'arrivée sur la Colline
  // (Scene.soupconOnArrival) et l'échec d'un jet d'Empathie hors combat.
  "colline-aux-gibets-arrivee": {
    nom: "Le Gamin des Murets",
    deposition: "Je l'ai vu redescendre de la Colline. Personne ne monte là-haut pour rien.",
    lieu: "à la Colline aux Gibets",
  },
  "echec-empathie": {
    nom: "L'Écrivain public",
    deposition: "Il a essayé de se faire comprendre. Ce qui est sorti n'était pas de chez nous.",
    lieu: "au Hameau des Renonçants",
  },
};

/** La fiche d'un témoin, prête à inscrire. */
export function temoinPour(acteId: string): Temoin | null {
  const t = TEMOINS[acteId];
  return t ? { id: acteId, ...t } : null;
}

/**
 * Une même personne peut avoir vu deux choses (la Femme au Seuil, les trois
 * hommes du barrage). Elle ne se lève qu'UNE fois à la barre — on garde sa
 * première déposition, la plus ancienne, celle qui a déclenché le reste.
 */
export function temoinsUniques(temoins: Temoin[]): Temoin[] {
  const vus = new Set<string>();
  return temoins.filter((t) => (vus.has(t.nom) ? false : (vus.add(t.nom), true)));
}

/** Les gens du hameau lui-même — on n'émeut pas un errant de passage. */
const DU_HAMEAU = /Doyenne|Femme au Seuil|trois hommes|vieux de la grange|Gamin|Écrivain|Veuve|Fossoyeur|Sonneur/;

/**
 * L'ouverture du procès : le hameau énumère ce qu'il a vu. Les dépositions
 * sont lues dans l'ordre où elles ont eu lieu — le joueur relit sa propre run.
 * Sans témoin (Soupçon monté par des voies non témoignées), on retombe sur une
 * formule d'ambiance : le hameau juge quand même, sur une impression.
 */
export function acteAccusation(temoins: Temoin[]): string[] {
  if (temoins.length === 0) {
    return [
      "Personne ne se lève pour dire ce qu'il a vu. C'est pire : ils n'ont pas " +
        "besoin de raisons. Ils ont une impression, et l'impression suffit.",
    ];
  }
  const lignes = temoins.slice(0, 4).map((t) => `${t.nom}, ${t.lieu} : « ${t.deposition} »`);
  const reste = temoins.length - 4;
  const suite =
    reste > 0
      ? [`Puis ${reste === 1 ? "un autre se lève" : `${reste} autres se lèvent`}. Tu cesses d'écouter.`]
      : [];
  return [
    "On ne te lit pas d'acte d'accusation. On appelle des gens, et les gens racontent.",
    ...lignes,
    ...suite,
  ];
}

/**
 * Les défenses ouvertes par les témoins présents (test 4/08 : « nier un fait,
 * discréditer avec la Ruse, émouvoir avec l'Empathie, assumer avec le
 * Courage, produire un objet »). Renvoie les IDS des défenses disponibles —
 * la scène du procès les traduit en choix.
 */
export function defensesDisponibles(temoins: Temoin[], besaceIds: string[]): string[] {
  const out: string[] = [];
  // Discréditer : il faut un témoin NOMMÉ à mettre en doute.
  if (temoins.length > 0) out.push("discrediter");
  // Émouvoir : seulement si quelqu'un du hameau lui-même a parlé (pas un
  // errant) — on n'émeut pas un berger de passage.
  if (temoins.some((t) => DU_HAMEAU.test(t.nom))) out.push("emouvoir");
  // Assumer : toujours possible. C'est le courage de dire oui.
  out.push("assumer");
  // Produire une preuve : un objet qui contredit une déposition.
  if (besaceIds.some((id) => /registre|carnet|sceau|ordonnance|denonciation/.test(id)))
    out.push("preuve");
  return out;
}
