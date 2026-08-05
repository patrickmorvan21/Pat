/**
 * LA LOI DU DOMAINE — « rien n'est libéré ; quelqu'un prend toujours la place
 * de quelqu'un d'autre. »
 *
 * Idée du test 4/08, la plus structurante du lot : donner aux NEUF zones une
 * même loi cachée, pour que le twist final (franchir la Porte = prendre la
 * place du Geôlier) ne soit pas une règle inventée au dernier acte, mais la
 * loi que le joueur a vue à l'œuvre depuis la première zone.
 *
 * Le twist cesse alors d'être « surprise, il fallait remplacer le Geôlier »
 * pour devenir « je le savais — tout me l'avait appris ; mais maintenant que
 * c'est moi qui dois choisir, qu'est-ce que je fais ? » C'est la forme forte :
 * anticipable intellectuellement, inévitable émotionnellement.
 *
 * ⚠️ RÈGLE D'ÉCRITURE, à tenir dans toutes les zones à venir :
 *   • la loi n'est JAMAIS énoncée — elle se constate, cas après cas ;
 *   • chaque zone en donne au moins deux manifestations concrètes, dans des
 *     registres différents (un lieu, un personnage, un objet, une rumeur) ;
 *   • aucune manifestation ne nomme la Porte ni le remplacement final ;
 *   • le Geôlier n'en parle jamais directement (ses lapsus la frôlent, c'est
 *     tout — cf. lib/jailer-quotes.ts).
 *
 * Ce fichier porte la loi + ses manifestations par zone. Les Landes sont
 * écrites ; les huit autres zones ont leur ligne directrice, à développer
 * quand elles seront conçues.
 */

export const LOI_DU_DOMAINE =
  "Dans le Domaine, rien n'est libéré. Quelqu'un prend toujours la place de quelqu'un d'autre.";

export type ManifestationLoi = {
  zone: string;
  /** Où elle se lit : un lieu, une personne, un objet, une rumeur. */
  registre: "lieu" | "personne" | "objet" | "rumeur";
  /** Le fait, tel qu'un habitant le dirait — jamais la loi elle-même. */
  texte: string;
};

/**
 * LES LANDES — la substitution s'y appelle « la fixation ». Fixer quelqu'un
 * au gibet est censé empêcher qu'un autre soit repris : on donne un corps
 * pour en garder un. Tout le vocabulaire judiciaire de la zone (registre,
 * ordonnance, comptage, sentence) décrit en fait une comptabilité d'échange.
 */
export const MANIFESTATIONS_LANDES: ManifestationLoi[] = [
  {
    zone: "landes",
    registre: "rumeur",
    texte:
      "Ici, on ne pend pas pour punir. On pend pour remplacer. Une corde tendue " +
      "à temps, disent-ils, et personne d'autre n'est repris cette saison-là.",
  },
  {
    zone: "landes",
    registre: "lieu",
    texte:
      "Le grand gibet de la Colline n'a jamais servi. Il n'attend pas n'importe " +
      "qui : il est taillé pour un cou précis, et tant qu'il reste vide, quelque " +
      "chose d'autre reste occupé.",
  },
  {
    zone: "landes",
    registre: "objet",
    texte:
      "Le registre des pendaisons ne raye jamais un nom sans en écrire un autre " +
      "à la même ligne. Le Bailli appelait ça tenir les comptes. Les comptes de quoi, " +
      "il ne l'a jamais écrit.",
  },
  {
    zone: "landes",
    registre: "personne",
    texte:
      "Le Bailli s'est pendu le dernier, à la place d'honneur. Le hameau dit qu'il " +
      "a voulu s'échanger contre quelqu'un de bien plus gros que lui. Le hameau dit " +
      "aussi que ça n'a pas marché — sinon il ne parlerait plus.",
  },
];

/**
 * Les huit zones à venir : une ligne directrice chacune, pour que la loi soit
 * déjà tranchée quand leur écriture commencera. À développer en
 * manifestations complètes au moment de la conception de chaque zone.
 */
export const LOI_PAR_ZONE: Record<string, string> = {
  landes: "La fixation : on donne un corps au gibet pour en garder un autre.",
  hameau: "Le Serment : jurer, c'est se porter garant — donc se proposer en échange.",
  prieure:
    "Le silence du lieu tient parce qu'UNE personne absorbe toutes les voix. Quand elle cède, il faut la remplacer.",
  "bois-des-pendus":
    "Un arbre ne se libère qu'en prenant racine ailleurs. On déplace le pendu, jamais on ne le retire.",
  marais:
    "Certains noyés restent sous l'eau pour tenir la passerelle. Traverser, c'est demander à quelqu'un de rester dessous.",
  grottes: "Une galerie ne s'ouvre qu'en s'effondrant ailleurs. Le volume est constant.",
  ossuaire: "Un os sorti de la pile doit être remplacé par un autre. La pile ne diminue jamais.",
  geoles: "Ouvrir une cellule en ferme une autre. Les clés ne créent rien, elles déplacent.",
  mine: "Ce qu'on remonte de la mine, la mine le reprend à quelqu'un d'autre, plus bas.",
};

/**
 * Le Grand Registre obéit à la même loi : un nom n'en sort que lorsqu'un
 * nouveau nom prend sa place. C'est pour ça que les Cent sont exactement cent,
 * et que la première ligne ne bouge jamais — personne n'a encore accepté de
 * prendre CETTE place-là.
 */
export const LOI_DU_REGISTRE =
  "Cent places. Jamais quatre-vingt-dix-neuf, jamais cent une. " +
  "Un nom n'en sort que lorsqu'un autre s'y assied.";

/**
 * Une manifestation de la loi, tirée pour la zone courante. Servie RAREMENT
 * (voir l'appelant) : la loi doit se constater, pas se marteler.
 */
export function manifestationLoi(zone: string, index: number): ManifestationLoi | null {
  const pool = zone === "landes" ? MANIFESTATIONS_LANDES : [];
  if (!pool.length) return null;
  return pool[index % pool.length];
}
