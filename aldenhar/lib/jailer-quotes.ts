/**
 * CITATIONS DU GEÔLIER — pool conditionné (journal Notion 30/07, §5 + §5 bis).
 *
 * Chaque ligne porte une CONDITION ; le moteur tire parmi celles dont la
 * condition est remplie, en excluant les 3 dernières servies (mémoire locale).
 * Les lignes `generique` n'alimentent le tirage que quand aucune condition
 * spécifique ne s'applique ; les statistiques agrégées y sont à fréquence
 * basse, les lapsus à probabilité très basse (ils nourrissent l'arc d'indices).
 *
 * Règle de voix (verrouillée) : il ne flatte jamais, il ne conseille jamais
 * sincèrement, et il ne mentionne JAMAIS la Porte ni le remplacement — ces
 * deux-là sont réservés à l'arc garanti des fragments de mort.
 *
 * Servi à DEUX endroits : l'écran du fragment (2ᵉ paragraphe, quand la mort ne
 * tombe pas sur un jalon d'arc) et le retour à l'accueil (la tagline devient
 * la voix du Geôlier dès la première mort). Les deux partagent la même
 * mémoire des « 3 dernières », donc jamais d'écho entre les deux moments.
 */

export type DeathContext = {
  /** Morts totales du compte (après l'incrément de la mort courante). */
  morts: number;
  /** Jour atteint à la dernière mort. */
  jour: number;
  /** Acte le plus profond atteint (1 tant que seul l'Acte I existe). */
  acte: number;
  /** La dernière mort était une fixation (sociale, aux Landes). */
  fixation: boolean;
  /** La dernière relique forgée est rare ou légendaire. */
  rareteRare: boolean;
  /** Le héros est entré aux Cent du Registre. */
  classe: boolean;
  /** Jours réels écoulés depuis la dernière session. */
  joursHorsJeu: number;
  /** La dernière run est le meilleur score du compte. */
  meilleurScore: boolean;
};

type Kind = "specifique" | "generique" | "stats" | "lapsus";

type Quote = { id: string; text: string; kind: Kind; cond?: (c: DeathContext) => boolean };

const Q = (id: string, text: string, kind: Kind, cond?: (c: DeathContext) => boolean): Quote => ({
  id,
  text,
  kind,
  cond,
});

const QUOTES: Quote[] = [
  /* ── Première mort ──────────────────────────────────────────────────── */
  Q("m1-a", "Un. C'est un début. Tout le monde commence par un.", "specifique", (c) => c.morts === 1),
  Q("m1-b", "Tu as duré moins que la moyenne. La moyenne, ici, n'est pas un compliment.", "specifique", (c) => c.morts === 1),
  Q("m1-c", "Alors. Maintenant tu sais ce que ça fait. La deuxième est plus facile. Pas moins douloureuse — plus facile.", "specifique", (c) => c.morts === 1),
  Q("m1-d", "Ne me remercie pas, je n'ai rien fait. C'est toi qui as choisi. À chaque fois.", "specifique", (c) => c.morts === 1),
  Q("m1-e", "Tu croyais que c'était une façon de parler, « une seule vie ».", "specifique", (c) => c.morts === 1),

  /* ── Morts 2 à 4 ────────────────────────────────────────────────────── */
  Q("m24-a", "Tu reviens. Ils reviennent tous. C'est la seule chose sur laquelle je peux compter.", "specifique", (c) => c.morts >= 2 && c.morts <= 4),
  Q("m24-b", "Encore un visage. Je ne les retiens plus depuis longtemps.", "specifique", (c) => c.morts >= 2 && c.morts <= 4),
  Q("m24-c", "Deux mille avant toi ont refait exactement ce geste. Vas-y.", "specifique", (c) => c.morts >= 2 && c.morts <= 4),
  Q("m24-d", "Deux. Le chiffre où l'on commence à se demander si c'est vraiment de la malchance.", "specifique", (c) => c.morts === 2),
  Q("m24-e", "Tu apprends. Lentement. Mais tu apprends, et c'est plus que la plupart.", "specifique", (c) => c.morts >= 2 && c.morts <= 4),
  Q("m24-f", "Trois visages, trois noms, un seul pas. Je ne me trompe jamais sur le pas.", "specifique", (c) => c.morts >= 3 && c.morts <= 4),
  Q("m24-g", "Tu changes de nom comme on change de chemise. Le Registre, lui, ne s'y trompe pas.", "specifique", (c) => c.morts >= 2 && c.morts <= 4),

  /* ── Morts nombreuses (≥ 8) ─────────────────────────────────────────── */
  Q("m8-a", "Je commence à reconnaître ta façon de tomber. C'est presque une signature.", "specifique", (c) => c.morts >= 8),
  Q("m8-b", "Tu t'obstines. J'aime ça. L'obstination me fournit.", "specifique", (c) => c.morts >= 8),
  Q("m8-c", "À force, tu vas finir par comprendre quelque chose. C'est bien ce qui m'inquiète.", "specifique", (c) => c.morts >= 8),
  Q("m8-d", "Tu as maintenant plus de morts que d'amis. Statistiquement parlant.", "specifique", (c) => c.morts >= 8),
  Q("m8-e", "Je pourrais te dire où tu vas tomber cette fois. Je ne le ferai pas — ce serait moins drôle.", "specifique", (c) => c.morts >= 8),
  Q("m8-f", "À ce stade, le Domaine te connaît mieux que ta mère ne t'a connu.", "specifique", (c) => c.morts >= 8),
  Q("m8-g", "Certains abandonnent au huitième. Tu es encore là. J'ignore si c'est du courage.", "specifique", (c) => c.morts >= 8),
  Q("m8-h", "Tu deviens une habitude. Les habitudes, ici, finissent toujours de la même façon.", "specifique", (c) => c.morts >= 8),
  Q("m8-i", "Je commence à parier sur toi. Contre toi, pour être exact. Je gagne beaucoup.", "specifique", (c) => c.morts >= 8),

  /* ── Mort précoce (jour 1 à 3) ──────────────────────────────────────── */
  Q("j3-a", "Si vite. Tu n'as même pas eu le temps d'avoir peur. Dommage — c'est la meilleure partie.", "specifique", (c) => c.jour <= 3),
  Q("j3-b", "Le Registre n'inscrit pas les journées incomplètes. Reviens en faire une entière.", "specifique", (c) => c.jour <= 3),
  Q("j3-c", "Quelques heures. Tu as tenu quelques heures. Le Registre laisse la ligne vide.", "specifique", (c) => c.jour <= 3),
  Q("j3-d", "Je n'ai même pas eu le temps de m'intéresser à toi.", "specifique", (c) => c.jour <= 3),
  Q("j3-e", "À ce rythme, tu vas user plus de noms que de jours.", "specifique", (c) => c.jour <= 3),
  Q("j3-f", "Il y a des débuts prometteurs. Et il y a le tien.", "specifique", (c) => c.jour <= 3),

  /* ── Mort profonde (Acte II ou III) ─────────────────────────────────── */
  Q("a2-a", "Te voilà loin, très loin. Assez loin pour que ça devienne intéressant.", "specifique", (c) => c.acte >= 2),
  Q("a2-b", "Tu as vu des choses que la plupart ne voient pas. Elles ne t'ont pas aidé.", "specifique", (c) => c.acte >= 2),
  Q("a2-c", "Tu as poussé plus loin que quatre-vingt-dix-neuf sur cent. Ça n'a servi à rien, mais c'est vrai.", "specifique", (c) => c.acte >= 2),
  Q("a2-d", "Tu as respiré l'air d'en bas. Il te restera dans la gorge, même mort.", "specifique", (c) => c.acte >= 2),
  Q("a2-e", "Encore un peu et tu voyais quelque chose que je préfère garder pour moi.", "specifique", (c) => c.acte >= 2),
  Q("a2-f", "Descendre est facile. C'est arriver quelque part qui pose problème.", "specifique", (c) => c.acte >= 2),

  /* ── Mort par fixation (sociale, aux Landes) ────────────────────────── */
  Q("fix-a", "Pendu par des gens qui te croyaient dangereux. Ils avaient raison, d'ailleurs.", "specifique", (c) => c.fixation),
  Q("fix-b", "Ils pensent que leur corde me gêne. Je les laisse le penser.", "specifique", (c) => c.fixation),
  Q("fix-c", "Une corde. Après tout ce chemin, une corde tenue par des mains qui tremblaient.", "specifique", (c) => c.fixation),
  Q("fix-d", "Ils t'ont pendu pour te sauver. Retiens ça : c'est le résumé de tout ce qu'ils sont.", "specifique", (c) => c.fixation),
  Q("fix-e", "Le Bailli aurait apprécié la procédure. Il était très à cheval sur la procédure.", "specifique", (c) => c.fixation),
  Q("fix-f", "Ils croient que le chanvre me gêne. Je les laisse croire. Ça les occupe et ça me fournit.", "specifique", (c) => c.fixation),

  /* ── Après la forge d'une relique rare ou légendaire ────────────────── */
  Q("rar-a", "Ce que tu as laissé derrière toi vaut mieux que ce que tu étais. Ça arrive souvent.", "specifique", (c) => c.rareteRare),
  Q("rar-b", "Ce que tu laisses vaut mieux que ce que tu étais. Ne le prends pas mal, c'est vrai de presque tout le monde.", "specifique", (c) => c.rareteRare),
  Q("rar-c", "J'ai forgé quelque chose avec ta fin. Tu n'as pas eu ton mot à dire — c'était dans le pacte.", "specifique", (c) => c.rareteRare),
  Q("rar-d", "Le suivant portera ton échec au poing. Il ne saura jamais de qui il le tient.", "specifique", (c) => c.rareteRare),
  Q("rar-e", "Tu as fait un bel objet. C'est déjà plus que ce que tu as fait de ta vie.", "specifique", (c) => c.rareteRare),

  /* ── Entrée au Registre ─────────────────────────────────────────────── */
  Q("cls-a", "Ton nom est inscrit. En petit. Mais inscrit.", "specifique", (c) => c.classe),
  Q("cls-b", "Le Registre ne juge pas. Il compte. C'est bien pire.", "specifique", (c) => c.classe),
  Q("cls-c", "Quatre-vingt-dix-neuf places. Tu visais laquelle, exactement ?", "specifique", (c) => c.classe),
  Q("cls-d", "Ton nom a tenu deux jours au classement. Puis quelqu'un est passé devant.", "specifique", (c) => c.classe && c.joursHorsJeu >= 2),

  /* ── Retour après une longue absence ────────────────────────────────── */
  Q("abs-a", "Tu as mis du temps à revenir. J'ai continué sans toi. Tout le monde continue sans tout le monde.", "specifique", (c) => c.joursHorsJeu >= 7),
  Q("abs-b", "Je croyais que tu avais compris. Apparemment non. Tant mieux.", "specifique", (c) => c.joursHorsJeu >= 7),

  /* ── Après une run remarquable ──────────────────────────────────────── */
  Q("top-a", "C'était bien. Vraiment. J'ai regardé jusqu'au bout, et je ne regarde pas souvent jusqu'au bout.", "specifique", (c) => c.meilleurScore),
  Q("top-b", "Tu as failli m'intéresser. Recommence.", "specifique", (c) => c.meilleurScore),

  /* ── Statistiques agrégées — sa signature (fréquence basse) ─────────── */
  Q("st-a", "Douze mille trois cent quatre. C'est le nombre de fois où quelqu'un a poussé cette porte. Tu n'as pas de numéro. Tu as un rang.", "stats"),
  Q("st-b", "Sur cent qui entrent, trois voient les Profondeurs. Tu veux savoir combien voient le reste ? Non. Tu ne veux pas.", "stats"),
  Q("st-c", "Ce matin, quatre-vingt-onze sont morts dans les Landes. Ton nom porte le compte à quatre-vingt-douze. La journée est jeune.", "stats"),
  Q("st-d", "Il y a deux mille sept cents personnes qui portent ton nom dans mon Registre. Aucune ne l'a gardé longtemps.", "stats"),
  Q("st-e", "La moyenne est de neuf jours. Tu peux en être fier ou honteux — je te laisse faire le calcul.", "stats"),
  Q("st-f", "Cette semaine, la Colline en a pris trois cent douze. Elle n'a pas de préférence. Elle a de l'appétit.", "stats"),
  Q("st-g", "J'ai regardé mourir plus de gens que tu n'en as croisé vivants. Ça finit par créer une expertise.", "stats"),

  /* ── Génériques ─────────────────────────────────────────────────────── */
  Q("gen-a", "Recommence. Je n'ai rien d'autre à faire. Toi non plus.", "generique"),
  Q("gen-b", "Le Domaine n'a pas bougé. Il ne bouge jamais. C'est toi qui changes, et pas dans le bon sens.", "generique"),
  Q("gen-c", "Tu veux un conseil ? Non. Tu ne veux pas de conseil. Tu veux avoir raison.", "generique"),
  Q("gen-d", "Une autre âme attend déjà au Seuil. Il y en a toujours une. C'est le seul stock qui ne s'épuise pas.", "generique"),
  Q("gen-e", "Je ne te souhaite pas bonne chance. Ce serait malhonnête, et je tiens à ma réputation.", "generique"),

  /* ── Lapsus rares (probabilité très basse — arc d'indices) ──────────── */
  Q("lap-a", "Ce couloir est plus froid que dans mon souv— que d'habitude.", "lapsus"),
  Q("lap-b", "Le premier du Registre n'est pas mort, lui. Enfin. Passons.", "lapsus"),
  Q("lap-c", "Il y a une chose que j'aurais faite autrement, à ta place. J'ai eu le temps d'y réfléchir. Beaucoup de temps.", "lapsus"),
];

const SERVED_KEY = "pactum-geolier-citations";

function loadServed(): string[] {
  try {
    const raw = window.localStorage.getItem(SERVED_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.filter((x) => typeof x === "string");
    }
  } catch {}
  return [];
}

function pushServed(id: string) {
  try {
    const s = [id, ...loadServed().filter((x) => x !== id)].slice(0, 3);
    window.localStorage.setItem(SERVED_KEY, JSON.stringify(s));
  } catch {}
}

/**
 * Tire une citation pour ce contexte de mort. Les spécifiques dont la
 * condition est remplie priment ; sinon le pool générique prend le relais
 * (lapsus à ~4 %, stats à fréquence réduite). Jamais une des 3 dernières.
 */
export function pickJailerQuote(ctx: DeathContext): string {
  const served = typeof window !== "undefined" ? loadServed() : [];
  const libre = (q: Quote) => !served.includes(q.id);

  let candidats = QUOTES.filter((q) => q.kind === "specifique" && q.cond?.(ctx) && libre(q));
  if (candidats.length === 0) {
    // Le lapsus d'abord, à probabilité très basse — il ne doit jamais devenir
    // une catégorie « comme une autre », c'est un accident de langage.
    const lapsus = QUOTES.filter((q) => q.kind === "lapsus" && libre(q));
    if (lapsus.length > 0 && Math.random() < 0.04) candidats = lapsus;
    else {
      const gen = QUOTES.filter((q) => q.kind === "generique" && libre(q));
      const stats = QUOTES.filter((q) => q.kind === "stats" && libre(q));
      // Fréquence basse pour les stats : ~1 tirage sur 3 quand rien de
      // spécifique ne s'applique.
      candidats = stats.length > 0 && Math.random() < 0.33 ? stats : gen.length > 0 ? gen : stats;
    }
  }
  if (candidats.length === 0) candidats = QUOTES.filter((q) => q.kind === "generique");
  const pick = candidats[Math.floor(Math.random() * candidats.length)];
  pushServed(pick.id);
  return pick.text;
}

/** Nombre en toutes lettres, pour la réaction du Geôlier (jamais un chiffre nu
    dans sa bouche — il récite, il ne compte pas à voix haute). */
const LETTRES = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept",
  "dix-huit", "dix-neuf", "vingt", "vingt et un", "vingt-deux", "vingt-trois",
  "vingt-quatre", "vingt-cinq", "vingt-six", "vingt-sept", "vingt-huit",
  "vingt-neuf", "trente",
];
function enLettres(n: number): string {
  if (n >= 0 && n < LETTRES.length) return LETTRES[n];
  return String(n);
}

/**
 * Première ligne de l'écran du fragment (maquette 2320-4447 : « Vingt-sept
 * jours. C'est honnête. ») — la réaction du Geôlier au nombre de jours tenus,
 * avant le fragment d'arc ou la citation contextuelle.
 */
export function reactionJours(jour: number): string {
  const mot = enLettres(jour);
  const majuscule = mot.charAt(0).toUpperCase() + mot.slice(1);
  if (jour <= 1) return "Un jour. Je ne prendrai pas la peine de m'en souvenir.";
  if (jour <= 3) return `${majuscule} jours. Le temps d'entrer, pas celui d'exister.`;
  if (jour <= 8) return `${majuscule} jours. Dans la moyenne. La moyenne meurt aussi.`;
  if (jour <= 15) return `${majuscule} jours. C'est honnête.`;
  if (jour <= 25) return `${majuscule} jours. Tu commences à laisser une trace sur le sol.`;
  return `${majuscule} jours. Peu vont jusque-là. Aucun ne va plus loin — enfin, presque.`;
}
