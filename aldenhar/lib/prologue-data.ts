/**
 * Prologue « Le Seuil » — pool de souvenirs (Notion 16/07/2026).
 * SOURCE DE VÉRITÉ ÉDITORIALE : la base Notion « 🎲 Prologue — Pool de
 * souvenirs » (collection 593e12ca-ef11-4a14-9c85-954166925963). Ce fichier
 * en est un EXPORT généré en session Claude Code — ne pas éditer les textes
 * ici : Patrick enrichit la base dans Notion, on resynchronise cet export.
 * Seules les entrées « Actif » cochées sont exportées.
 * Convention constante : Option A = engagement direct (+3) · B = voie
 * mesurée (+2) · C = retrait/refus (+1).
 */

import type { RunStats } from "@/lib/state";

export type StatKey = keyof RunStats;

export type MemoryEntry = {
  title: string;
  narration: string;
  /** [A engagement direct, B voie mesurée, C retrait/refus] */
  options: [string, string, string];
};

/** Ordre FIXE des souvenirs dans le prologue (spec 16/07). */
export const PROLOGUE_STAT_ORDER: StatKey[] = ["courage", "ruse", "instinct", "empathie"];

export const PROLOGUE_STAT_LABEL: Record<StatKey, string> = {
  courage: "COURAGE",
  ruse: "RUSE",
  instinct: "INSTINCT",
  empathie: "EMPATHIE",
};

/**
 * Amorce du Seuil — UN SEUL beat depuis le 2/09.
 *
 * La 3ᵉ clause de l'intro (« Le dé tranche — ce que tu vaux vient de ce que tu
 * étais de ton vivant ») a été déplacée ici et FONDUE dans l'amorce : les deux
 * disaient déjà la même chose à deux écrans d'intervalle. La clause ne
 * s'ajoute donc pas, elle remplace — trois écrans deviennent un, et la règle
 * est énoncée juste avant la chose qu'elle décrit au lieu de l'être dans le
 * vide.
 *
 * Les quatre stats ne sont plus NOMMÉES ici : le radar du verdict les montre
 * et les nomme à la fin, quand elles veulent enfin dire quelque chose.
 */
export const PROLOGUE_AMORCE: string[] = [
  "Avant que tu passes, je veux voir qui tu étais. Ce que tu vaux ici vient de ta vie d'avant.\nNe réfléchis pas. Ce n'est plus toi qui choisis : c'est ce que tu as déjà fait.",
];

export const PROLOGUE_CLOTURE = "Je sais qui tu es. Le dé, lui, décidera qui tu deviens.";

/**
 * PORTRAIT DE CLÔTURE (spec 4/08, point A2 — « la meilleure idée du lot »).
 *
 * Après les 4 souvenirs et le Nom, le Geôlier renvoie au joueur DEUX lignes
 * qualitatives déduites du verdict : une pour la stat dominante, une pour la
 * fragile. Aucun chiffre, aucune barre — la règle « pas de nombres affichés »
 * tient. Objectif : relier les réponses au personnage, et désamorcer le futur
 * « pourquoi le jeu a décidé que je manquais d'Empathie » quand un choix
 * verrouillé apparaîtra.
 *
 * Écriture : voix du Geôlier, 2ᵉ personne, ÉPICÈNE (règle A3 — les noms de
 * héros n'ont pas de genre, aucun participe accordé nulle part).
 */
const PORTRAIT_DOMINANTE: Record<StatKey, string> = {
  courage: "Tu avances avant de comprendre. Le danger t'a toujours moins arrêté que le doute.",
  ruse: "Tu regardes les serrures avant les portes. Il y a toujours un autre chemin, et tu le sais.",
  instinct: "Tu sens les choses avant de les voir. Ton corps décide souvent avant toi — et il se trompe peu.",
  empathie: "Tu protèges les autres, rarement toi-même. Les gens te parlent, même quand ils ne veulent pas.",
};

const PORTRAIT_FRAGILE: Record<StatKey, string> = {
  courage: "Mais devant l'irrémédiable, ta main hésite. Tu le savais déjà.",
  ruse: "Mais les détours t'ennuient. Tu forces ce qui devrait se contourner.",
  instinct: "Mais tu n'écoutes pas ce qui murmure en toi. Tu veux des preuves, et elles arrivent tard.",
  empathie: "Mais les autres restent pour toi un bruit de fond. Ça t'a coûté. Ça te coûtera encore.",
};

/**
 * LE PROFIL PLAT A DROIT À SON PORTRAIT (panel 10/08).
 *
 * Un héros qui s'est dérobé aux quatre souvenirs s'entendait dire « Tu
 * avances avant de comprendre. Le danger t'a toujours moins arrêté que le
 * doute. » — l'inverse exact de ce qu'il venait de jouer. Cause : la
 * dominante était initialisée sur la PREMIÈRE stat de l'ordre (Courage) et
 * ne bougeait que sur un `>` strict, donc un profil sans relief laissait
 * toujours Courage en tête. C'est le moment le plus identitaire du jeu.
 *
 * Deux réparations. (1) Quand rien ne dépasse — écart max de 1 sur les
 * quatre — le portrait ne DÉSIGNE plus de dominante : il dit le profil plat,
 * qui est un caractère à part entière, et le Geôlier n'a aucune raison de
 * flatter. (2) Sinon les ex-æquo se départagent sur les CHOIX réels du Seuil
 * (l'engagement A/B/C avant le jet silencieux) : c'est ce que le joueur a
 * fait qui tranche, jamais l'ordre de déclaration des stats.
 */
/**
 * ⚠️ UN PROFIL PLAT N'EST PAS FORCÉMENT UN PROFIL FAIBLE (2/09).
 *
 * Le correctif du 10/08 ne traitait qu'une moitié du problème. « Rien ne
 * dépasse » se déclenche sur un ÉCART faible entre les quatre stats — donc
 * aussi bien pour qui s'est dérobé quatre fois que pour qui s'est jeté
 * quatre fois. Le second s'entendait dire qu'il avait « gardé les mains dans
 * les poches », l'exact contraire de ce qu'il venait de jouer.
 *
 * Trouvé en regardant le nouvel écran du verdict, qui rend la faute visible :
 * le radar montre un losange RÉGULIER et LARGE pendant que le texte parle de
 * quelqu'un qui n'a rien tenté. Le texte doit dire ce que l'œil voit.
 *
 * On tranche donc sur l'ENGAGEMENT moyen réellement joué (3 = direct,
 * 2 = mesuré, 1 = retrait), pas sur les stats — le jet silencieux ne doit pas
 * pouvoir transformer un héros téméraire en héros tiède.
 */
const PORTRAIT_PLAT_HAUT =
  "Tu y es allé les quatre fois. Rien ne dépasse chez toi parce que rien ne " +
  "manque — et ça se voit de loin.\nLe dé n'aura pas grand-chose à corriger. " +
  "Il n'aura pas grand-chose à rattraper non plus.";

const PORTRAIT_PLAT_MESURE =
  "Tu as fait ce qu'il fallait, à chaque fois. Ni plus. C'est la manière la " +
  "plus sûre de traverser une vie sans que personne s'en souvienne.\nRien ne " +
  "dépasse chez toi. Le dé fera le reste — il fait toujours le reste.";

const PORTRAIT_PLAT_BAS =
  "Rien ne dépasse chez toi. Ni élan, ni ruse, ni flair, ni chaleur — tu as " +
  "traversé ta vie d'avant en gardant les mains dans les poches.\nCe n'est " +
  "pas un défaut. C'est juste que le dé n'aura rien à corriger, et rien à " +
  "aider non plus.";

/** Engagement moyen réellement joué : 3 = direct, 2 = mesuré, 1 = retrait. */
function portraitPlat(engagement?: Partial<Record<StatKey, number>>): string {
  const vals = engagement ? Object.values(engagement).filter((v): v is number => v != null) : [];
  if (!vals.length) return PORTRAIT_PLAT_MESURE; // vieille sauvegarde : le milieu, jamais une accusation
  const moy = vals.reduce((a, b) => a + b, 0) / vals.length;
  if (moy >= 2.5) return PORTRAIT_PLAT_HAUT;
  if (moy <= 1.5) return PORTRAIT_PLAT_BAS;
  return PORTRAIT_PLAT_MESURE;
}

export function portraitDuSeuil(
  stats: RunStats,
  /** Engagement réel au Seuil : bonus 3/2/1 par stat, avant le jet silencieux.
      Départage les ex-æquo. Absent (vieilles sauvegardes) → ordre du Seuil. */
  engagement?: Partial<Record<StatKey, number>>
): string {
  const vals = PROLOGUE_STAT_ORDER.map((k) => stats[k]);
  if (Math.max(...vals) - Math.min(...vals) <= 1) return portraitPlat(engagement);
  const poids = (k: StatKey) => stats[k] * 10 + (engagement?.[k] ?? 0);
  let dominante: StatKey = PROLOGUE_STAT_ORDER[0];
  let fragile: StatKey = PROLOGUE_STAT_ORDER[0];
  for (const k of PROLOGUE_STAT_ORDER) {
    if (poids(k) > poids(dominante)) dominante = k;
    if (poids(k) < poids(fragile)) fragile = k;
  }
  if (fragile === dominante) {
    fragile = PROLOGUE_STAT_ORDER.find((k) => k !== dominante) ?? fragile;
  }
  return `${PORTRAIT_DOMINANTE[dominante]}\n${PORTRAIT_FRAGILE[fragile]}`;
}

/** L'engagement brut du Seuil (3 = direct, 2 = mesuré, 1 = retrait). */
export function engagementDuSeuil(
  memories: { stat: StatKey }[],
  choices: number[]
): Partial<Record<StatKey, number>> {
  const out: Partial<Record<StatKey, number>> = {};
  memories.forEach((m, i) => {
    out[m.stat] = (out[m.stat] ?? 0) + ([3, 2, 1][choices[i] ?? 2] ?? 1);
  });
  return out;
}

export const MEMORY_POOL: Record<StatKey, MemoryEntry[]> = {
  courage: [
    {
      title: "L'incendie du grenier",
      narration: "Des flammes montent du grenier où dorment tes affaires les plus précieuses — et un chat.",
      options: ["Remonter les chercher", "Laisser tout, sauver ta peau", "Hésiter à la porte, trop longtemps"],
    },
    {
      title: "L'ours piégé",
      narration: "Un ours pris au piège se débat, un homme approche pour l'achever à mains nues.",
      options: ["T'interposer entre eux", "Proposer d'aider à distance", "Laisser faire, ce n'est pas ton combat"],
    },
    {
      title: "La cage aux fauves",
      narration: "Un fauve s'est échappé de sa cage, un enfant joue non loin, inconscient du danger.",
      options: ["Te placer entre eux", "Détourner l'attention du fauve à distance", "Alerter les gardes, rester en retrait"],
    },
    {
      title: "La falaise",
      narration: "Ton compagnon glisse sur la corniche, sa main s'accroche à la roche.",
      options: ["Te pencher, le rattraper", "Chercher une corde d'abord", "Appeler à l'aide, ne pas bouger"],
    },
    {
      title: "La glace",
      narration: "Enfant, la glace craque sous ton pied. Quelqu'un d'autre est déjà dessus.",
      options: ["Foncer", "Rester, calculer", "Reculer"],
    },
    {
      title: "La grange",
      narration: "Le feu prend dans la grange. À l'intérieur, les bêtes hurlent. Tu es seul dehors.",
      options: ["Entrer, tant pis", "Chercher de l'aide d'abord", "Rester en retrait, c'est trop tard"],
    },
    {
      title: "La horde aux portes",
      narration: "Une horde approche des portes du village, les gardes désertent un à un.",
      options: ["Rester au poste, seul s'il le faut", "Organiser une résistance avec les autres", "Fuir avec les gardes"],
    },
    {
      title: "La mine qui s'effondre",
      narration: "Un grondement sous terre, des poutres qui craquent, des voix encore en bas.",
      options: ["Redescendre les chercher", "Attendre les secours en surface", "Fuir avant l'effondrement total"],
    },
    {
      title: "La peste au village",
      narration: "La maladie progresse de porte en porte, la plupart ont déjà fui.",
      options: ["Rester, aider ceux qui restent", "Aider à distance, sans entrer chez eux", "Partir avec les autres"],
    },
    {
      title: "La rivière en crue",
      narration: "Une rivière gonflée par l'orage sépare ta route du village en flammes.",
      options: ["Traverser à la nage", "Longer la berge, chercher un gué", "Faire demi-tour, attendre la décrue"],
    },
    {
      title: "La tempête en mer",
      narration: "La barque prend l'eau, le mât craque sous le vent.",
      options: ["Écoper sans relâche", "Couper le mât, alléger le bateau", "Prier, s'accrocher au bastingage"],
    },
    {
      title: "La traversée du cimetière",
      narration: "La nuit tombe, le chemin le plus court passe par le cimetière abandonné.",
      options: ["Traverser, sans ralentir", "Faire le détour, plus long", "Attendre le matin"],
    },
    {
      title: "La vision dans le noir",
      narration: "Une forme immense se dessine dans l'obscurité, immobile, qui semble te fixer.",
      options: ["Avancer vers elle", "Reculer, sans la quitter des yeux", "Fermer les yeux, attendre que ça passe"],
    },
    {
      title: "Le bourreau hésitant",
      narration: "On te tend la hache pour exécuter un condamné que tu sais innocent.",
      options: ["Refuser tout net, en payer le prix", "Frapper, sans y penser", "Trouver une excuse pour partir"],
    },
    {
      title: "Le cheval emballé",
      narration: "Un cheval fou fonce dans la foule, plus personne ne ose s'interposer.",
      options: ["Te jeter devant lui", "Détourner la foule d'un cri", "Te mettre à l'abri, comme les autres"],
    },
    {
      title: "Le combat de rue",
      narration: "Trois hommes en frappent un seul, dans une ruelle sombre.",
      options: ["Intervenir, quitte à en prendre", "Crier pour faire fuir les agresseurs", "Presser le pas, ailleurs"],
    },
    {
      title: "Le duel",
      narration: "Un homme te provoque en duel devant tous, pour une insulte que tu n'as pas dite.",
      options: ["Accepter, l'épée à la main", "Répondre par les mots, pas les armes", "Tourner le dos, partir"],
    },
    {
      title: "Le géant du chantier",
      narration: "Un ouvrier immense menace d'écraser quiconque approche de la charpente instable.",
      options: ["Le défier, avancer quand même", "Négocier, chercher un compromis", "Renoncer, chercher un autre passage"],
    },
    {
      title: "Le juge corrompu",
      narration: "Le juge s'apprête à condamner un innocent pour se couvrir lui-même.",
      options: ["Le contredire publiquement", "Lui parler seul à seul, après", "Te taire, ce n'est pas ta place"],
    },
    {
      title: "Le loup",
      narration: "Un loup affamé bloque le sentier entre toi et le village.",
      options: ["Avancer, le regarder dans les yeux", "Reculer lentement, sans courir", "Chercher une pierre à lancer"],
    },
    {
      title: "Le marché",
      narration: "Un homme deux fois ta taille frappe un enfant sur la place. Personne ne bouge.",
      options: ["T'interposer", "Crier pour alerter les autres", "Baisser les yeux, continuer ta route"],
    },
    {
      title: "Le noyé",
      narration: "Un homme coule au milieu du lac gelé, personne ne bouge autour de toi.",
      options: ["Plonger malgré le froid", "Lancer une corde depuis la berge", "Détourner le regard"],
    },
    {
      title: "Le pari de la maison hantée",
      narration: "Pour un pari stupide, il faut passer la nuit dans la maison que tout le monde évite.",
      options: ["Accepter, y entrer seul", "Accepter, mais rester près de la porte", "Refuser, le pari ne vaut rien"],
    },
    {
      title: "Le pont suspendu",
      narration: "Un pont grince sous une charge trop lourde. Tu dois traverser pour rejoindre quelqu'un de l'autre côté.",
      options: ["Traverser sans regarder en bas", "Tester chaque planche", "Chercher un autre chemin"],
    },
    {
      title: "Le puits",
      narration: "Un enfant est tombé dans un puits à sec, trop profond pour crier assez fort.",
      options: ["Descendre par la corde", "Chercher de l'aide d'abord", "L'attendre, quelqu'un viendra"],
    },
    {
      title: "Le serment de garde",
      narration: "On te confie la garde de nuit, seul, aux portes d'un lieu qu'on dit maudit.",
      options: ["Accepter sans poser de question", "Demander à être accompagné", "Refuser, inventer une excuse"],
    },
    {
      title: "Le serpent dans la botte",
      narration: "Tu enfiles ta botte, sens quelque chose se resserrer contre ta cheville.",
      options: ["Retirer la botte d'un geste sec", "Rester immobile, réfléchir", "Appeler à l'aide sans bouger"],
    },
    {
      title: "Le toit en fuite",
      narration: "Les gardes te pourchassent, seul un saut entre deux toits te sépare de la liberté.",
      options: ["Sauter sans regarder en bas", "Chercher une autre issue", "Te rendre, plutôt que risquer la chute"],
    },
    {
      title: "Le toit qui brûle",
      narration: "Le toit de la maison voisine s'effondre, quelqu'un crie encore à l'intérieur.",
      options: ["Grimper par la fenêtre", "Faire la chaîne d'eau avec les autres", "Rester en retrait, chercher du secours"],
    },
    {
      title: "Les sables mouvants",
      narration: "Un voyageur s'enfonce dans la vase, ses cris s'affaiblissent déjà.",
      options: ["Te coucher, tendre une branche", "Courir chercher une corde", "L'appeler, sans t'avancer"],
    },
  ],
  ruse: [
    {
      title: "L'alibi",
      narration: "On te demande où tu étais, la veille, à l'heure d'un meurtre.",
      options: ["Inventer un alibi solide", "Dire une demi-vérité, prudente", "Dire la vérité, sans détour"],
    },
    {
      title: "L'espion démasqué",
      narration: "Tu comprends qu'un des tiens rapporte tes faits et gestes à un autre camp.",
      options: ["Le piéger avec une fausse information", "Le confronter en privé", "Le dénoncer publiquement"],
    },
    {
      title: "L'héritage disputé",
      narration: "Deux héritiers te demandent chacun de témoigner en leur faveur.",
      options: ["Manoeuvrer pour profiter des deux", "Témoigner selon ta conscience", "Refuser de témoigner du tout"],
    },
    {
      title: "L'échange de sacs",
      narration: "Dans la cohüe, il serait facile d'échanger ton sac contre un autre, plus lourd.",
      options: ["Faire l'échange, discrètement", "Demander directement à l'échanger", "Laisser passer l'occasion"],
    },
    {
      title: "La cave",
      narration: "La trappe se referme au-dessus de toi. Des pas approchent, une lanterne.",
      options: ["Te cacher dans l'ombre", "Bluffer, sortir en premier", "Chercher une autre issue"],
    },
    {
      title: "La fausse piste des gardes",
      narration: "Tu pourrais orienter les gardes vers une fausse piste pour couvrir ta retraite.",
      options: ["Semer un faux indice", "Filer discrètement, sans les tromper", "Te rendre, éviter les complications"],
    },
    {
      title: "La fausse relique",
      narration: "Un marchand te montre deux reliques identiques, une vraie, une fausse.",
      options: ["Repérer la vraie, discrètement", "Acheter les deux, par prudence", "Faire confiance au marchand"],
    },
    {
      title: "La lettre scellée",
      narration: "Tu trouves une lettre qui n'est pas pour toi, scellée d'un cachet important.",
      options: ["L'ouvrir, la refermer sans trace", "La lire ouvertement, l'assumer", "La remettre sans l'ouvrir"],
    },
    {
      title: "La rançon",
      narration: "Un homme retient un otage, et propose un échange que tu pourrais détourner.",
      options: ["Négocier, préparer un double jeu", "Payer honnêtement le prix demandé", "Refuser de traiter avec lui"],
    },
    {
      title: "La ruse du mendiant",
      narration: "Un mendiant supposément aveugle te suit d'un peu trop près, d'un peu trop précisément.",
      options: ["Le tester, discrètement", "Le dénoncer haut et fort", "L'ignorer, poursuivre ta route"],
    },
    {
      title: "La serrure à double fond",
      narration: "Le coffre s'ouvre, mais quelque chose dans le mécanisme sonne faux.",
      options: ["Chercher le compartiment caché", "Prendre ce qui est visible, partir vite", "Refermer, ne rien toucher"],
    },
    {
      title: "Le code oublié",
      narration: "Une porte close attend un mot de passe que tu ne connais pas.",
      options: ["Deviner, à partir d'indices glanés", "Forcer l'entrée autrement", "Attendre que quelqu'un l'ouvre"],
    },
    {
      title: "Le contrat piégé",
      narration: "Un contrat te promet une fortune, mais une clause en petits caractères sent le piège.",
      options: ["Signer, en préparant une porte de sortie", "Refuser de signer sans tout relire", "Signer sans poser de question"],
    },
    {
      title: "Le double jeu",
      narration: "Deux camps te demandent la même faveur, en secret l'un de l'autre.",
      options: ["Promettre aux deux, choisir plus tard", "Choisir un camp, ouvertement", "Refuser les deux, prudent"],
    },
    {
      title: "Le duel truqué",
      narration: "On te propose de truquer un duel dont dépend beaucoup d'argent.",
      options: ["Accepter, jouer double jeu", "Refuser, mais garder le secret", "Dénoncer la combine"],
    },
    {
      title: "Le déguisement",
      narration: "Pour entrer là où tu n'es pas invité, il te faut être quelqu'un d'autre.",
      options: ["Voler un uniforme", "Te faire passer pour un messager", "Chercher une entrée détournée"],
    },
    {
      title: "Le faux blessé",
      narration: "Un homme feint une blessure au milieu de la route pour attirer les voyageurs.",
      options: ["Feindre d'y croire, tendre un piège en retour", "Le confronter, dénoncer la ruse", "Faire un détour, prudent"],
    },
    {
      title: "Le faux prophète",
      narration: "Un homme prétend parler pour un dieu, et la foule le croit.",
      options: ["Le démasquer par la ruse", "Le confronter ouvertement", "Le laisser faire, observer"],
    },
    {
      title: "Le garde soudoyé",
      narration: "Un garde bloque le passage, sa main tendue attend visiblement autre chose que des mots.",
      options: ["Glisser une pièce, discrètement", "Inventer une raison de passer", "Chercher un autre chemin"],
    },
    {
      title: "Le jeu de dés",
      narration: "On te propose une partie truquée, et tu le sais.",
      options: ["Jouer le jeu, tricher en retour", "Refuser poliment, sans accuser", "Dénoncer la triche tout haut"],
    },
    {
      title: "Le marchand malhonnête",
      narration: "Le marchand te vend une babiole comme si elle valait une fortune.",
      options: ["Négocier en le flattant", "Payer sans discuter, garder l'info pour toi", "Dénoncer l'arnaque devant tous"],
    },
    {
      title: "Le marché de nuit",
      narration: "Un inconnu te propose un échange, dans le noir. Le prix est trop bas pour être honnête.",
      options: ["Accepter, voir venir", "Négocier plus serré", "Refuser, partir sans un mot"],
    },
    {
      title: "Le message codé",
      narration: "Un message intercepté est écrit dans un code que tu pourrais percer avec du temps.",
      options: ["Prendre le temps de le percer", "Le transmettre tel quel, sans y toucher", "L'ignorer, trop risqué"],
    },
    {
      title: "Le mot de passe volé",
      narration: "Tu surprends par hasard le mot de passe d'une confrérie fermée.",
      options: ["L'utiliser à ton avantage", "Le garder pour toi, sans l'utiliser", "Le signaler à la confrérie"],
    },
    {
      title: "Le passage de la douane",
      narration: "Un garde-frontière fouille chaque sac, et le tien contient ce qu'il ne faut pas.",
      options: ["Distraire le garde, glisser à travers", "Payer un bakchich", "Tenter ta chance, honnêtement"],
    },
    {
      title: "Le passage secret",
      narration: "Un mur sonne creux, dans une pièce que tu ne devrais pas fouiller.",
      options: ["Chercher le mécanisme caché", "Repartir, ce n'est pas le moment", "Forcer le mur directement"],
    },
    {
      title: "Le piège à loup",
      narration: "Une trace au sol ne correspond à aucun animal que tu connais.",
      options: ["Suivre la fausse piste toi-même", "Éviter, prendre un chemin détourné", "L'ignorer, avancer tout droit"],
    },
    {
      title: "Le sceau contrefait",
      narration: "Il te faut un sceau officiel que tu n'as pas le droit de porter.",
      options: ["En forger un, discrètement", "Emprunter celui d'un absent", "Renoncer, trouver une autre voie"],
    },
    {
      title: "Le témoin gênant",
      narration: "Quelqu'un a vu ce que tu as fait, et pourrait parler.",
      options: ["L'acheter, discrètement", "Le convaincre de se taire, par les mots", "Le laisser parler, assumer"],
    },
    {
      title: "Le vol accusé",
      narration: "On t'accuse d'un vol que tu n'as pas commis, devant tout le village.",
      options: ["Mentir avec aplomb", "Nier tout en bloc", "Disparaître dans la foule"],
    },
  ],
  instinct: [
    {
      title: "L'odeur de fumée",
      narration: "Une odeur de fumée, là où il ne devrait pas y avoir de feu.",
      options: ["Aller voir, tout de suite", "L'ignorer, sûrement rien", "Prévenir quelqu'un d'autre d'abord"],
    },
    {
      title: "L'ombre en trop",
      narration: "Ton ombre, au soleil couchant, ne semble pas suivre exactement tes gestes.",
      options: ["T'arrêter, observer attentivement", "Continuer sans t'en préoccuper", "Fuir sans te retourner"],
    },
    {
      title: "La carte qui ne correspond plus",
      narration: "Le chemin sur ta carte ne colle plus au paysage que tu as sous les yeux.",
      options: ["Faire confiance à ce que tu vois", "Suivre la carte à la lettre", "Rebrousser chemin, trop incertain"],
    },
    {
      title: "La chambre trop rangée",
      narration: "La pièce où tu dors est parfaitement en ordre, comme préparée pour toi seul.",
      options: ["Vérifier chaque recoin avant de dormir", "Dormir quand même, fatigué", "Changer de chambre, sans explication"],
    },
    {
      title: "La cloche qui sonne seule",
      narration: "Une cloche sonne dans un clocher que tu sais abandonné depuis des années.",
      options: ["Aller vérifier, malgré tout", "L'ignorer, le vent en est capable", "Prévenir quelqu'un du village"],
    },
    {
      title: "La fontaine",
      narration: "L'eau a un goût qui ne devrait pas être là. Ta gorge est sèche depuis des heures.",
      options: ["Recracher, ne pas boire", "Boire quand même, un peu", "Boire sans y penser"],
    },
    {
      title: "La lanterne qui vacille sans vent",
      narration: "Ta lanterne faiblit d'un coup, dans un air pourtant parfaitement calme.",
      options: ["L'éteindre, avancer dans le noir", "La rallumer, insister", "Continuer comme si de rien n'était"],
    },
    {
      title: "La pièce qui manque",
      narration: "Ta bourse te semble plus légère qu'à ton souvenir, sans raison précise.",
      options: ["Vérifier chaque parcelle de tes affaires", "Laisser filer, tu te trompes sûrement", "Accuser le premier venu"],
    },
    {
      title: "La porte qui n'était pas fermée",
      narration: "Tu es sûr d'avoir fermé cette porte. Elle est entrouverte, ce matin.",
      options: ["Fouiller la pièce avant d'entrer", "Entrer normalement, tu as dû oublier", "Appeler avant d'entrer"],
    },
    {
      title: "La route de nuit",
      narration: "Une route inconnue, la nuit. Un bruit ne colle pas avec le silence.",
      options: ["Suivre ton instinct, bifurquer", "Continuer, c'est sûrement rien", "T'arrêter, attendre"],
    },
    {
      title: "La voix familière",
      narration: "Tu entends ton nom, appelé par une voix que tu reconnais — mais elle est morte.",
      options: ["Ne pas répondre, t'éloigner", "Répondre, par réflexe", "Chercher la source du son"],
    },
    {
      title: "Le cheval qui refuse",
      narration: "Ta monture refuse d'avancer vers un bosquet, les oreilles rabattues.",
      options: ["Faire le tour, l'écouter", "La forcer à avancer", "Descendre, avancer à pied seul"],
    },
    {
      title: "Le chien",
      narration: "Ton chien refuse d'avancer vers une porte que tu ouvres pourtant chaque jour.",
      options: ["L'écouter, rebrousser chemin", "Le forcer à te suivre", "Entrer seul, il te rejoindra"],
    },
    {
      title: "Le compagnon trop silencieux",
      narration: "Ton compagnon de route ne dit plus un mot depuis des heures, le regard fixe.",
      options: ["Lui parler, le sortir de là", "L'observer discrètement, sans rien dire", "Ne rien remarquer, poursuivre"],
    },
    {
      title: "Le froid soudain",
      narration: "L'air se glace d'un coup, sans nuage ni vent pour l'expliquer.",
      options: ["Te mettre à l'abri immédiatement", "Attendre, observer ce qui vient", "Continuer, en te couvrant à peine"],
    },
    {
      title: "Le lit de la rivière",
      narration: "L'eau a une couleur qui ne va pas, un peu trop claire pour la saison.",
      options: ["Chercher une autre source", "Boire quand même, la soif presse", "Tester d'abord un peu, prudent"],
    },
    {
      title: "Le message trop clair",
      narration: "Une lettre anonyme t'indique exactement où trouver ce que tu cherches.",
      options: ["Te méfier, chercher un piège", "Suivre l'indication telle quelle", "Ignorer la lettre entièrement"],
    },
    {
      title: "Le miroir trouble",
      narration: "Un miroir dans une échoppe te renvoie une image qui semble trembler, une seconde de trop.",
      options: ["Détourner le regard, sortir", "Fixer le miroir, jusqu'au bout", "Ne rien remarquer, passer"],
    },
    {
      title: "Le pont trop calme",
      narration: "Le pont que tu dois traverser est étrangement désert, à une heure de forte affluence.",
      options: ["Prendre un autre chemin", "Traverser vite, sans t'arrêter", "Avancer normalement, sans y penser"],
    },
    {
      title: "Le regard dans la foule",
      narration: "Un visage dans la foule te fixe une seconde de trop, puis se détourne.",
      options: ["Le suivre discrètement", "L'ignorer, continuer ton chemin", "Le confronter directement"],
    },
    {
      title: "Le repas offert",
      narration: "Un inconnu t'offre à manger, avec une insistance qui dépasse la politesse.",
      options: ["Refuser poliment", "Accepter, mais goûter à peine", "Manger normalement, sans arrière-pensée"],
    },
    {
      title: "Le rêve qui revient",
      narration: "Le même rêve, trois nuits de suite, toujours interrompu au même instant.",
      options: ["En tenir compte pour la suite", "L'oublier, ce n'est qu'un rêve", "En parler à quelqu'un d'abord"],
    },
    {
      title: "Le sel renversé",
      narration: "Le sel se renverse tout seul sur la table, sans un souffle d'air dans la pièce.",
      options: ["En tenir compte, changer tes plans", "Balayer, sans y penser", "Le signaler à tes compagnons"],
    },
    {
      title: "Le silence des oiseaux",
      narration: "La forêt s'est tue d'un coup, plus un chant, plus un bruissement.",
      options: ["Rebrousser chemin sans attendre", "T'arrêter, écouter encore", "Continuer, presser le pas"],
    },
    {
      title: "Le silence du nourrisson",
      narration: "Un bébé, dans les bras de sa mère, ne pleure ni ne bouge depuis trop longtemps.",
      options: ["T'approcher, poser la question", "Détourner le regard, ce n'est pas naturel", "Continuer, ne rien voir"],
    },
    {
      title: "Le sol qui sonne creux",
      narration: "Tes pas résonnent différemment sur un chemin que tu empruntes chaque jour.",
      options: ["T'arrêter, examiner le sol", "Continuer, c'est dans ta tête", "Contourner, prendre un autre chemin"],
    },
    {
      title: "Le sommeil trop profond",
      narration: "Tu te réveilles bien après l'aube, sans le moindre souvenir de la nuit.",
      options: ["Vérifier tes affaires, méfiant", "Te secouer, reprendre la route", "Demander à tes compagnons ce qui s'est passé"],
    },
    {
      title: "Le sourire de trop",
      narration: "Quelqu'un t'accueille à bras ouverts, avec un sourire qui dure un peu trop longtemps.",
      options: ["Rester sur tes gardes", "Accepter l'accueil, sans réfléchir", "Partir, trouver un prétexte"],
    },
    {
      title: "Le vent qui tourne",
      narration: "Le vent change de direction d'un coup, portant une odeur que tu ne reconnais pas.",
      options: ["Changer de route, par précaution", "Continuer, observer encore", "Ignorer, avancer sans changer"],
    },
    {
      title: "Les corbeaux immobiles",
      narration: "Une nuée de corbeaux se pose sur un même arbre, sans un cri, sans bouger.",
      options: ["Éviter cet arbre largement", "T'approcher, observer de près", "Continuer sans y prêter attention"],
    },
  ],
  empathie: [
    {
      title: "L'animal du bourreau",
      narration: "Un chien reste fidèle près du corps de son maître exécuté.",
      options: ["Le recueillir", "Lui laisser de quoi manger, puis partir", "L'ignorer, ce n'est qu'une bête"],
    },
    {
      title: "L'animal pris au piège",
      narration: "Un renard se débat dans un collet, le sang colle déjà à la fourrure.",
      options: ["Le libérer, au risque d'être mordu", "L'achever, pour abréger sa peine", "Continuer ton chemin"],
    },
    {
      title: "L'enfant du bourreau",
      narration: "Le fils du bourreau, rejeté par tous, mange seul à l'écart du village.",
      options: ["T'asseoir avec lui", "Lui parler, de loin", "L'ignorer, comme les autres"],
    },
    {
      title: "L'enfant perdu",
      narration: "Un enfant pleure, seul dans la foule du marché. Personne d'autre ne semble le voir.",
      options: ["T'arrêter, le chercher avec lui", "Prévenir quelqu'un, puis repartir", "Continuer, ce n'est pas ton problème"],
    },
    {
      title: "L'enfant qui te ressemble",
      narration: "Un enfant abandonné te rappelle furieusement qui tu étais, au même âge.",
      options: ["Le prendre sous ton aile", "L'aider, sans t'attacher", "Détourner le regard, ça fait trop mal"],
    },
    {
      title: "L'inconnu blessé",
      narration: "Un inconnu blessé au bord du chemin. Personne d'autre ne s'arrête.",
      options: ["L'aider, quitte à perdre du temps", "Fouiller ses affaires d'abord", "Passer ton chemin"],
    },
    {
      title: "L'inconnu qui se noie",
      narration: "Un homme se débat dans une eau trop profonde pour lui.",
      options: ["Plonger, sans hésiter", "Lancer une corde depuis la rive", "Regarder, incapable d'agir"],
    },
    {
      title: "L'ivrogne battu",
      narration: "Un homme ivre se fait rouer de coups pour une dette qu'il ne peut payer.",
      options: ["T'interposer, payer sa dette", "Attendre que ça cesse, puis l'aider", "Passer, ce n'est pas ton problème"],
    },
    {
      title: "L'orpheline",
      narration: "Une fillette dort seule sous un porche, par un froid qui ne pardonne pas.",
      options: ["La recouvrir, veiller sur elle", "Chercher quelqu'un pour s'occuper d'elle", "Continuer, ce n'est pas ton rôle"],
    },
    {
      title: "L'étranger sans langue commune",
      narration: "Un voyageur perdu tente de te parler, dans une langue que tu ne comprends pas.",
      options: ["Chercher à l'aider malgré la barrière", "Lui indiquer une direction, au hasard", "Faire semblant de ne pas comprendre"],
    },
    {
      title: "La bête de somme épuisée",
      narration: "Un âne s'effondre sous une charge trop lourde, son maître le frappe pour qu'il se relève.",
      options: ["T'interposer, alléger la charge", "Demander au maître d'arrêter", "Continuer, ce n'est qu'une bête"],
    },
    {
      title: "La confession",
      narration: "Un inconnu te confie une faute terrible, sans rien attendre en retour.",
      options: ["L'écouter jusqu'au bout, sans juger", "L'écouter, mais garder tes distances", "Refuser d'entendre, partir"],
    },
    {
      title: "La sorcière accusée",
      narration: "Une vieille femme, accusée de sorcellerie sans preuve, va être jugée par la foule.",
      options: ["Prendre sa défense", "Rester en retrait, observer", "Te joindre à l'accusation"],
    },
    {
      title: "La veuve",
      narration: "Une femme pleure seule devant une tombe fraîche, personne pour l'accompagner.",
      options: ["T'asseoir près d'elle, en silence", "Lui offrir des mots de réconfort", "Détourner le regard, par pudeur"],
    },
    {
      title: "Le blessé de l'autre camp",
      narration: "Un ennemi blessé te reconnaît et te supplie, non pas de le sauver, mais de prévenir sa famille.",
      options: ["Accepter, porter le message", "Refuser, mais l'achever proprement", "Le laisser, sans un mot"],
    },
    {
      title: "Le blessé qui ralentit",
      narration: "Un compagnon de route boite, et ralentit tout le groupe qui doit avancer vite.",
      options: ["Rester à son rythme, quitte à perdre du temps", "Le porter, à bout de bras", "L'abandonner, pour la sécurité du groupe"],
    },
    {
      title: "Le bègue moqué",
      narration: "Un homme peine à parler devant une foule qui rit de lui.",
      options: ["Prendre sa défense publiquement", "Lui parler en privé, après", "Rire avec les autres, par gêne"],
    },
    {
      title: "Le dernier repas",
      narration: "Un inconnu affamé croise ta route alors que tes propres vivres sont comptés.",
      options: ["Partager, même si cela coûte", "Donner une part, mesurée", "Garder tes vivres, poursuivre ta route"],
    },
    {
      title: "Le déserteur",
      narration: "Un soldat en fuite, terrifié, te supplie de ne pas le dénoncer.",
      options: ["Le cacher, à tes risques", "Le laisser fuir, sans t'impliquer", "Le dénoncer, c'est la loi"],
    },
    {
      title: "Le malade contagieux",
      narration: "Un homme malade, que tout le monde évite, te demande juste de l'eau.",
      options: ["La lui apporter toi-même", "La poser à distance, prudent", "Refuser, par peur du mal"],
    },
    {
      title: "Le mendiant",
      narration: "Un vieil homme tend la main, à la même place, chaque jour depuis des années.",
      options: ["Lui donner ce que tu as", "Lui trouver du travail, une solution durable", "Passer, comme les autres"],
    },
    {
      title: "Le menteur repenti",
      narration: "Celui qui t'a trahi autrefois te demande pardon, les larmes aux yeux.",
      options: ["Lui pardonner, sincèrement", "L'écouter, sans lui pardonner encore", "Lui tourner le dos, définitivement"],
    },
    {
      title: "Le message du mourant",
      narration: "Un inconnu agonisant te confie un dernier message pour quelqu'un qu'il ne reverra pas.",
      options: ["Promettre de le délivrer", "Écouter, sans t'engager", "L'ignorer, la mort presse"],
    },
    {
      title: "Le prisonnier",
      narration: "Un homme enchaîné te supplie de desserrer ses liens, juste un instant.",
      options: ["L'aider, malgré le risque", "Écouter son histoire d'abord", "Ignorer sa demande, avancer"],
    },
    {
      title: "Le rival humilié",
      narration: "Celui qui t'a toujours méprisé se retrouve à ta merci, humilié devant tous.",
      options: ["L'aider à se relever", "Le laisser se relever seul", "Profiter de son humiliation"],
    },
    {
      title: "Le rival ruiné",
      narration: "Celui qui t'a toujours surpassé a tout perdu, et mendie à ton tour de porte en porte.",
      options: ["L'aider, sans rancune", "L'aider un peu, avec réserve", "Te souvenir, et refuser"],
    },
    {
      title: "Le rival à terre",
      narration: "Celui qui t'a fait le plus de mal gît devant toi, blessé. Personne pour le secourir.",
      options: ["L'aider malgré tout", "Le regarder, sans un geste", "Profiter, achever ce qui est commis"],
    },
    {
      title: "Le soldat ennemi",
      narration: "Un homme du camp adverse gît blessé, son arme hors de portée.",
      options: ["Le soigner malgré tout", "Le laisser, sans l'achever", "L'achever, pour ta sécurité"],
    },
    {
      title: "Le vieillard perdu",
      narration: "Un homme âgé erre, ne reconnaissant plus la route de chez lui.",
      options: ["Le raccompagner toi-même", "Trouver quelqu'un qui le connaît", "Le laisser, quelqu'un d'autre s'en chargera"],
    },
    {
      title: "Le voleur affamé",
      narration: "Un enfant vole du pain, se fait attraper, tremble devant le châtiment qui vient.",
      options: ["Payer le pain, plaider sa cause", "Demander une punition plus douce", "Laisser faire justice"],
    },
  ],
};

/** Tirage du prologue : 1 souvenir par stat, indépendant, fixé pour la run.
    `stats` permet un Seuil COURT (mode démo, script 24/08 : Courage + Instinct
    seulement) — les stats non tirées restent à leur base, un héros de démo
    est fort là où la démo le sollicite et faible ailleurs, comme un vrai. */
export function drawMemories(
  stats: readonly StatKey[] = PROLOGUE_STAT_ORDER
): { stat: StatKey; entry: MemoryEntry }[] {
  const tires = stats.map((stat) => {
    const pool = MEMORY_POOL[stat];
    return { stat, entry: pool[Math.floor(Math.random() * pool.length)] };
  });
  // ORDRE MÉLANGÉ (2/09) : l'ordre fixe Courage→Ruse→Instinct→Empathie était
  // un tell — en deux parties, on savait que la 3ᵉ question portait sur
  // l'Instinct. Même correction que sur les choix de scène, pour la même
  // raison. Le tirage est persisté dans la run, donc la reprise retombe sur
  // le même ordre.
  for (let i = tires.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tires[i], tires[j]] = [tires[j], tires[i]];
  }
  return tires;
}

/**
 * Verdict du Seuil (spec 16/07) : base 1 par stat ; le choix retenu ajoute
 * A = +3, B = +2, C = +1 ; puis un jet SILENCIEUX de −1/0/+1 sur chaque stat
 * — aucun dé visible, aucune animation : deux joueurs identiques ≠ même
 * héros. Plage finale 1..5. Aucun chiffre affiché nulle part.
 */
export function computeVerdict(memories: { stat: StatKey }[], choices: number[]): RunStats {
  const stats: RunStats = { courage: 1, ruse: 1, instinct: 1, empathie: 1 };
  memories.forEach((m, i) => {
    const bonus = [3, 2, 1][choices[i] ?? 2] ?? 1;
    stats[m.stat] += bonus;
  });
  for (const key of PROLOGUE_STAT_ORDER) {
    stats[key] = Math.max(1, Math.min(5, stats[key] + (Math.floor(Math.random() * 3) - 1)));
  }
  return stats;
}
