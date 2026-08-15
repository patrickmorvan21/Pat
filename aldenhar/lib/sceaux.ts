/**
 * LE SCEAU DES LANDES — ce qu'on RAPPORTE en revenant.
 *
 * Arbitrage Patrick du 10/08, après la mesure qui montrait l'asymétrie :
 * seule la mort forgeait quelque chose (une relique), donc mourir en s'étant
 * engagé classait mieux que survivre. Franchir la Descente vivant rapporte
 * désormais un SCEAU, et le Sceau MODIFIE la zone à la vie suivante.
 *
 * ⚠️ Il ne contredit pas la règle du 7/08 (« on ne forge rien d'une vie qu'on
 * n'a pas perdue ») : une relique est ce qu'on LAISSE en mourant, un Sceau est
 * ce qu'on RAPPORTE en revenant. Deux monnaies, deux portes.
 *
 * ── LES TROIS QUESTIONS LAISSÉES OUVERTES LE 10/08, TRANCHÉES ICI ─────────
 * • Combien de Sceaux ? **UN PAR ZONE.** Les Landes en ont un. Une deuxième
 *   traversée n'en donne pas un second : elle APPROFONDIT le même (sa `value`
 *   compte les passages). Un catalogue de sceaux se collectionnerait ; une
 *   marque qui se creuse se vit.
 * • Que ouvre-t-il ? Des CONVERSATIONS et un CHEMIN — jamais un bonus de jet.
 *   Le Sceau ne touche ni le seuil, ni le modificateur, ni l'Anneau : il
 *   ouvre des options qui n'existaient pas, ce qui est la seule récompense
 *   que le joueur puisse VOIR sans qu'on lui montre un chiffre.
 * • Se cumulent-ils ? Voir plus haut : la valeur monte, la nature non.
 *
 * ── OÙ IL VIT ────────────────────────────────────────────────────────────
 * Dans `PlayerMemory.faits`, nature `seal`, portée `zone_permanent` — c'est
 * exactement ce pour quoi le moteur de faits a été bâti le 5/08. Conséquence
 * heureuse : **aucun champ nouveau dans `loadMemory`**, donc aucun risque de
 * retomber dans le piège de la reconstruction champ par champ (le sac de
 * faits y passe déjà en bloc par `sacDepuis`).
 *
 * ── LA RÈGLE D'ÉCRITURE ──────────────────────────────────────────────────
 * Le héros est NEUF et ne se souvient de rien (règle des strates, 10/08). Le
 * Sceau est la seule exception assumée, et elle est écrite comme telle : la
 * marque est sur SA main, il ne sait pas d'où elle vient, et le texte le dit.
 * Ce sont les AUTRES qui la reconnaissent — le monde se souvient, pas lui.
 */

import type { Faits } from "./faits";
import { valeur } from "./faits";

/** L'id du fait. Une zone, un sceau. */
export const SCEAU_LANDES = "sceau:landes";

/** Combien de fois ce compte a franchi la Descente. 0 = pas de Sceau. */
export function niveauSceau(f: Faits, id: string = SCEAU_LANDES): number {
  return valeur(f, id);
}

/**
 * LE MOMENT OÙ IL SE PREND — dernier écran de la traversée, juste après la
 * trace de sortie et avant le Registre.
 *
 * C'est la réponse au consensus n°2 du panel (« la séquence de mort fait six
 * écrans, la Descente trois lignes ») : sortir vivant produit enfin un objet
 * de mémoire. `passages` compte CELUI-CI compris.
 */
export function ligneSceauSortie(passages: number): string {
  if (passages <= 1)
    return (
      "Au moment de passer la ligne, ta paume droite chauffe d'un coup, " +
        "comme une brûlure prise il y a longtemps et qu'on aurait oubliée. " +
        "Tu ouvres la main : une entaille en creux, nette, en forme de coin. " +
        "Elle ne saigne pas. Elle a l'air vieille de dix ans."
    );
  if (passages === 2)
    return (
      "La paume chauffe avant même la ligne, cette fois — elle savait. Sous " +
        "la première entaille, une seconde s'ouvre sans bruit, exactement " +
        "parallèle. La main de quelqu'un qui tient un compte."
    );
  if (passages === 3)
    // LA TRANSFORMATION. Pas un troisième trait : les deux se referment l'un
    // sur l'autre. Une marque qui se COMPTE devient une marque qui se LIT.
    return (
      "Tu ouvres la main en attendant la troisième. Elle ne vient pas. Les " +
        "deux entailles se sont rejointes par les bouts pendant que tu " +
        "marchais, et ce qu'elles dessinent maintenant est fermé, régulier, " +
        "et ne ressemble plus du tout à une blessure. Ça ressemble à un mot " +
        "dans une langue que tu ne lis pas."
    );
  return (
    "La marque ne bouge plus. Elle a la forme qu'elle doit avoir, et le " +
      "reste du chemin s'est mis à la contourner : la lumière tombe " +
      "autrement dans ta paume, et le froid n'y entre pas."
  );
}

/**
 * CE QUE PORTE LE HÉROS SUIVANT — poussé dans la narration d'ouverture, à la
 * Borne, dans les premières secondes de la vie d'après.
 *
 * ⚠️ La formulation tient la règle du 10/08 : il ne se souvient pas, et la
 * phrase le DIT au lieu de le contourner.
 */
export function ligneSceauOuverture(passages: number): string | null {
  if (passages <= 0) return null;
  if (passages === 1)
    return (
      "Ta paume droite porte une entaille en creux, en forme de coin, " +
        "refermée depuis longtemps. Tu ne te souviens pas de te l'être " +
        "faite — mais tu ne te souviens de rien, alors ça ne prouve rien."
    );
  if (passages === 2)
    return (
      "Ta paume droite porte des entailles en creux, alignées, en forme de " +
        "coin. Elles sont anciennes et de la même main. Tu ne te souviens pas " +
        "de te les être faites, et cette fois l'idée te met mal à l'aise."
    );
  // ⚠️ APRÈS LA TRANSFORMATION, la paume ne se compte plus : elle se lit. Et
  // ce n'est plus une cicatrice, c'est un TRACÉ — donc quelqu'un l'a voulu.
  return (
    "Ta paume droite porte un tracé fermé, creusé net, que personne ne " +
      "prend pour une cicatrice. Tu ne te souviens pas de te l'être fait. " +
      "Ce qui te gêne, c'est qu'on ne se fait pas ça tout seul."
  );
}

/**
 * LA BORNE RÉPOND À SA PROPRE QUESTION.
 *
 * L'examen de la pierre finit depuis le 20/07 sur « on ne grave pas au retour
 * quand personne ne revient — alors qui a gravé côté sud ? ». Le jeu ne
 * répondait jamais. Avec un Sceau, la réponse est dans la main du joueur, et
 * elle arrive APRÈS la question (ordre corrigé le 13/08) : c'est le geste qui
 * conclut, pas une annonce.
 */
export function ligneSceauBorne(passages: number): string | null {
  if (passages <= 0) return null;
  if (passages <= 2)
    return (
      "Une des trois marques du sud est un coin, creusé dans le granit. Tu y " +
        "poses la paume sans y penser, et ça entre — au millimètre, comme une " +
        "clé dans sa gâche. Tu retires ta main très vite. Personne ne t'a vu " +
        "faire, sauf le sud."
    );
  // LA BORNE N'A PLUS DE PLACE POUR TOI. La pierre garde un creux en forme de
  // coin — la marque, elle, n'en est plus un. Le monde avait prévu le
  // revenant ; il n'avait pas prévu ce qu'on devient à force de revenir.
  return (
    "Tu poses la paume sur le coin du sud, comme les deux fois d'avant. Ça " +
      "n'entre plus. Le creux est resté ce qu'il était et c'est ta main qui " +
      "a changé de forme — elle déborde de tous les côtés, maintenant. La " +
      "pierre avait une place pour ceux qui reviennent. Pas pour la suite."
  );
}

/**
 * LE MONDE RECONNAÎT LA MARQUE — une ligne à l'arrivée, par lieu.
 *
 * Servies par le collecteur de RAPPELS (budget d'un seul par arrivée, chantier
 * du 12/08) : le Sceau n'a pas le droit d'ajouter un tap, il prend la place
 * d'un rappel, il ne s'y ajoute pas.
 *
 * Aucune ne fait dire au héros qu'il sait — ce sont les autres qui savent, et
 * lui qui ne comprend pas ce qu'on regarde.
 */
export const SCEAU_RECONNU: Record<string, string> = {
  "marche-muet":
    "Un marchand te tend une écuelle sans que tu aies rien demandé, et " +
      "quand tu la prends il regarde ta paume, pas ton visage. Il ne " +
      "reprend pas l'écuelle. Il recule d'un pas.",
  "petit-tribunal":
    "L'écrivain public lève les yeux, les baisse sur ta main, et tourne " +
      "trois feuillets en arrière dans son registre avant même que tu aies " +
      "parlé. Il connaît la page qu'il cherche.",
  "champ-des-fixes":
    "Le fossoyeur s'arrête de creuser quand tu passes. Il regarde ta main, " +
      "puis le poteau qu'il vient de planter, puis ta main encore. Il ne " +
      "recommence à creuser qu'une fois que tu es loin.",
  "colline-aux-gibets":
    "Sur la crête, les corbeaux ne s'envolent pas à ton approche. Ils se " +
      "tournent, tous ensemble, du côté de ta main droite.",
  "serment-hameau":
    "Les hommes du muret te voient venir de loin. L'un d'eux dit quelque " +
      "chose aux deux autres sans te quitter des yeux, et ils changent " +
      "d'ordre entre eux : le plus vieux passe devant.",
  "palissade-sud":
    "Le Veilleur t'a vu avant que tu le voies. Il ne bouge pas de sa " +
      "guérite, mais il a posé ce qu'il tenait, et ses deux mains sont " +
      "libres et ouvertes — comme on fait devant ce qu'on ne sait pas " +
      "encore nommer.",
};

/**
 * APRÈS LA TRANSFORMATION, LE MONDE NE REGARDE PLUS LA MAIN.
 *
 * Règle de croissance posée par Patrick le 14/08 : « si chaque traversée
 * ajoute trait 4, trait 5, trait 6, la main devient un compteur de victoires
 * maquillé en fiction ». Donc au 3e passage la marque cesse d'augmenter et
 * CHANGE DE SENS — et le monde change avec elle : là où on regardait la
 * paume avec curiosité, on refuse maintenant de la voir.
 *
 * ⚠️ Ces lignes REMPLACENT celles de `SCEAU_RECONNU`, elles ne s'y ajoutent
 * pas : le Sceau n'a jamais eu le droit d'ajouter un tap (budget d'un seul
 * rappel par arrivée, 12/08), et ce n'est pas parce qu'il devient grave qu'il
 * gagne ce droit.
 *
 * Trois lieux seulement, et c'est délibéré : le geste de détourner les yeux
 * ne vaut que s'il tranche avec ceux qui regardent encore.
 */
export const SCEAU_TRANSFORME: Record<string, string> = {
  "marche-muet":
    "Le marchand qui t'avait tendu une écuelle range son étal quand tu " +
      "arrives. Pas vite, pas en fuyant — comme on ferme boutique à l'heure. " +
      "Il ne regarde pas ta main. Il s'applique à ne pas la regarder.",
  "petit-tribunal":
    "L'écrivain public ferme son registre à ton entrée, les deux mains à " +
      "plat dessus. Il ne cherche plus la page. Il ne veut pas que tu voies " +
      "s'il en a une.",
  "palissade-sud":
    "Le Veilleur sort de sa guérite et se met de côté, à deux pas du " +
      "portillon, les yeux sur l'horizon. Il ne note rien. Depuis trente " +
      "ans il note tout le monde, et il vient de décider que non.",
};

/** La ligne de reconnaissance d'un lieu, si le Sceau est porté. */
export function reconnaissanceSceau(lieuRadical: string, passages: number): string | null {
  if (passages <= 0) return null;
  if (passages >= 3 && SCEAU_TRANSFORME[lieuRadical]) return SCEAU_TRANSFORME[lieuRadical];
  return SCEAU_RECONNU[lieuRadical] ?? null;
}

/**
 * LE GEÔLIER CESSE DE PLAISANTER — une fois, à l'ouverture de la vie qui suit
 * la troisième traversée.
 *
 * C'est le beat que Patrick a nommé le 14/08, et il n'est justifiable que
 * par lui : le Geôlier est le SEUL à voir les chiffres (règle du 5/08), donc
 * le seul qui puisse constater qu'un chiffre a cessé d'en être un. Il ne
 * commente pas une victoire de plus — il constate qu'il n'y a plus rien à
 * compter, et c'est la première fois qu'il ne trouve pas ça drôle.
 *
 * ⚠️ Une seule fois, et jamais au-delà : au 4e passage il se tait de nouveau.
 * Un Geôlier qui commenterait chaque retour redeviendrait le compteur qu'on
 * vient de retirer de la main du héros.
 */
export function ligneSceauGeolier(passages: number): string | null {
  if (passages !== 3) return null;
  return "Trois. Je ne compte plus. Toi non plus, j'imagine.";
}
