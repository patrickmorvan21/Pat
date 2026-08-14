/**
 * Besace (journal Notion 13/07) — système SÉPARÉ des Reliques :
 * objets mundane, 3-4 emplacements, icône tramée + nom + flavor, JAMAIS de
 * stat chiffrée (l'objet fait glisser la fréquence des paliers vécus, pas un
 * bonus affiché). Vidée à la mort, sauf ce qui devient Relique.
 * Départ fixe pour tous les héros : une dague simple, jamais aléatoire.
 */

export type BesaceRarity = "commun" | "rare" | "legendaire";

/**
 * Deux types d'objets SEULEMENT (spec 21/07, point 4) :
 *  - `passif` : effet PERMANENT tant que l'objet est en Besace, zéro
 *    interaction (jamais consommé, jamais automatique à déclencher).
 *  - `actif`  : usage UNIQUE, consommé sur DÉCISION du joueur (menu → Utiliser,
 *    ou 4e choix contextuel en scène). Rien d'automatique, jamais.
 */
export type BesaceSlot = "actif" | "passif";

export type BesaceItem = {
  id: string;
  name: string;
  rarity: BesaceRarity;
  /** Conservé pour le choix d'icône (arme/soin/babiole). */
  kind: "arme" | "soin" | "babiole";
  /** Type d'objet (spec 21/07) : détermine le slot et l'interaction. */
  slot: BesaceSlot;
  flavor: string;
  /** ACTIF — effet consommé à l'usage : soin de santé (0..1) et/ou referme
      les blessures persistantes (ENTAILLÉ). */
  heal?: number;
  cure?: boolean;
  /** PASSIF — modificateur permanent au jet effectif tant que porté, et sa
      portée (jets de combat seulement, ou tous les jets). Jamais un chiffre
      affiché : il fait juste glisser les paliers vécus. */
  passiveMod?: number;
  passiveScope?: "combat" | "all";
  /** Icône réelle de l'objet (chantier 1 du 23/07) : les objets des Landes ont
      leur propre PNG tramé. À défaut, l'icône générique par `kind` est utilisée. */
  illustration?: string;
  /** Ce que l'objet fait, en une phrase, quand la formule générique de
      `usageEnMots` ne dit rien de vrai (un OUTIL ne « rend pas des forces »).
      Chantier feedback+fluidité du 12/08 : un objet muet sur son usage est un
      objet qu'on ne sort jamais. */
  usage?: string;
  /** LA PHRASE QU'ON LIT EN S'EN SERVANT — propre à cet objet-là.
   *
   * ⚠️ Playtest du 12/08 : le Miroir de Poche Fêlé et l'Onguent gris se
   * consommaient sur EXACTEMENT le même texte (« Un peu de force te
   * revient »), à deux écrans d'intervalle. Techniquement correct, et
   * fictionnellement faux : un miroir fêlé ne se boit pas. La formule
   * générique reste le repli, mais tout objet actif du jeu doit avoir
   * la sienne — c'est la promesse « la fiction est la source de vérité ».
   *
   * Elle raconte le GESTE, pas le chiffre : ce qu'on fait, ce que ça
   * referme, et rien de plus. */
  usageTexte?: string;
};

/** Besace = 2 slots actifs + 2 slots passifs (spec 21/07, remplace les 4 génériques). */
export const BESACE_ACTIF_SLOTS = 2;
export const BESACE_PASSIF_SLOTS = 2;
/** Compat : capacité totale (certaines vérifs génériques la référencent encore). */
export const BESACE_SLOTS = BESACE_ACTIF_SLOTS + BESACE_PASSIF_SLOTS;

/** Objet de départ, identique pour tous les héros (13/07 : jamais aléatoire). */
export function startingBesace(): BesaceItem[] {
  return [
    {
      id: "dague-simple",
      name: "Dague simple",
      rarity: "commun",
      kind: "arme", illustration: "assets/objet_dague_os.png",
      slot: "passif",
      passiveMod: 1,
      passiveScope: "combat",
      flavor: "Elle a déjà servi. Elle servira encore. Le manche garde la forme d'une main.",
    },
  ];
}

/** Items de la Besace occupant un slot donné (actif ou passif). */
export function besaceBySlot(besace: BesaceItem[], slot: BesaceSlot): BesaceItem[] {
  return besace.filter((i) => normalizeItem(i).slot === slot);
}

/** Somme des modificateurs passifs qui s'appliquent à un jet (combat ou non). */
export function passiveMod(besace: BesaceItem[], isCombat: boolean): number {
  return besace.reduce((sum, raw) => {
    const i = normalizeItem(raw);
    if (i.slot !== "passif" || !i.passiveMod) return sum;
    if (i.passiveScope === "all" || (i.passiveScope === "combat" && isCombat)) return sum + i.passiveMod;
    return sum;
  }, 0);
}

/** Y a-t-il de la place pour un item de ce type ? (2 actifs / 2 passifs) */
export function hasBesaceRoom(besace: BesaceItem[], slot: BesaceSlot): boolean {
  const cap = slot === "actif" ? BESACE_ACTIF_SLOTS : BESACE_PASSIF_SLOTS;
  return besaceBySlot(besace, slot).length < cap;
}

/**
 * Normalise un item (compat sauvegardes d'avant le point 4 : pas de `slot`).
 * soin → actif (heal+cure) ; arme/babiole → passif (petit mod permanent).
 */
export function normalizeItem(i: BesaceItem): BesaceItem {
  if (i.slot === "actif" || i.slot === "passif") return i;
  if (i.kind === "soin") return { ...i, slot: "actif", heal: i.heal ?? 0.3, cure: i.cure ?? true };
  const scope = i.kind === "arme" ? "combat" : "all";
  return { ...i, slot: "passif", passiveMod: i.passiveMod ?? 1, passiveScope: i.passiveScope ?? scope };
}

/** Soins mineurs trouvables en exploration — ACTIFS à usage unique (~1 scène sur 5). */
const SOINS_MINEURS: Omit<BesaceItem, "id">[] = [
  { name: "Baume de mousse noire",
    usageTexte:
      "Tu racles le fond du pot et tu tasses la mousse noire à même la plaie, sans regarder. Ça mord d'abord, puis ça tient — la chair se referme autour, comme si elle avait décidé d'y croire.", rarity: "commun", kind: "soin", slot: "actif", heal: 0.3, cure: true, flavor: "Ça sent la cave. Ça referme les plaies." },
  { name: "Fiole d'eau de gouttière",
    usageTexte:
      "Tu bois l'eau de gouttière au goulot, debout, en trois gorgées qui ont le goût de l'ardoise. Ce n'est pas bon. C'est de l'eau, et ton corps ne fait pas le difficile.", illustration: "assets/objet_fiole_baume.png", rarity: "commun", kind: "soin", slot: "actif", heal: 0.25, cure: false, flavor: "Trouble, tiède — mais elle apaise." },
  { name: "Bandage d'un autre",
    usageTexte:
      "Tu défais le bandage de quelqu'un d'autre et tu l'enroules sur ton propre bras. Il a déjà servi — la tache est ancienne, brune, à l'endroit exact où tu saignes. Tu serres le nœud sans y penser.", illustration: "assets/objet_brin_chanvre_beni_b.png", rarity: "commun", kind: "soin", slot: "actif", heal: 0.2, cure: true, flavor: "Son premier propriétaire n'en aura plus besoin." },
  { name: "Onguent gris",
    usageTexte:
      "Tu étales l'onguent gris du plat du pouce, en couche mince. Ça sent la cendre et le suif. La douleur ne part pas : elle recule d'un pas et te laisse la place.", rarity: "commun", kind: "soin", slot: "actif", heal: 0.3, cure: false, flavor: "L'étiquette est illisible. L'odeur, convaincante." },
];

/** Récompenses du Destin (nat 20) : rare à légendaire, JAMAIS une Relique. Un
    mélange d'actifs (soins puissants) et de passifs (babioles / armes). */
const RECOMPENSES_DESTIN: Omit<BesaceItem, "id">[] = [
  { name: "Amulette d'os verdi", illustration: "assets/objet_dent_meute_d.png", rarity: "rare", kind: "babiole", slot: "passif", passiveMod: 1, passiveScope: "all", flavor: "Elle vibre quand on la regarde trop longtemps — et le hasard te sourit un peu plus." },
  // ⚠️ Sans `illustration`, le repli par `kind` servait `objet_dague_os` — une
  // dague en OS pour une lame « forgée dans le MÉTAL d'une lanterne » (relecture
  // par agents, 10/08). Et c'est une récompense de Destin : le moment le plus
  // rare du jeu s'illustrait d'un objet qui n'est pas celui qu'on vient de gagner.
  { name: "Lame de lanterne", illustration: "assets/objet_dague_cendres_c.png", rarity: "rare", kind: "arme", slot: "passif", passiveMod: 1, passiveScope: "combat", flavor: "Forgée dans le métal d'une lanterne verte. Elle ne vacille jamais." },
  { name: "Élixir du campement perdu",
    usageTexte:
      "Tu descends l'élixir d'un trait. La chaleur part de l'estomac et gagne les mains, les jambes, la nuque — quelqu'un a distillé ça pour un homme qui ne comptait pas revenir.", rarity: "rare", kind: "soin", slot: "actif", heal: 0.5, cure: true, flavor: "Quelqu'un l'a brassé pour un repos qui n'est jamais venu." },
  // ⚠️ SANS ICÔNE PROPRE, et volontairement laissée au repli : aucune des 30
  // icônes d'objet ne montre une larme, et le repli actuel (`objet_grimoire`)
  // est faux — mais forcer un mauvais appariement serait pire que le repli
  // générique. Prompt écrit dans `data/images-a-produire.md`. C'est la seule
  // récompense LÉGENDAIRE du jeu : elle mérite son image.
  { name: "Larme du Geôlier", rarity: "legendaire", kind: "babiole", slot: "passif", passiveMod: 2, passiveScope: "all", flavor: "Il jure qu'il ne pleure pas. Elle existe pourtant — et te protège de justesse." },
  { name: "Clef sans porte", illustration: "assets/objet_cle_maison_muree_a.png", rarity: "legendaire", kind: "babiole", slot: "passif", passiveMod: 1, passiveScope: "all", flavor: "Toutes les serrures la craignent un peu." },
];

let uid = 0;
function withId(base: Omit<BesaceItem, "id">): BesaceItem {
  uid += 1;
  return { ...base, id: `${base.name.toLowerCase().replace(/[^a-z]+/g, "-")}-${uid}` };
}

export function randomSoinMineur(exclure: string[] = []): BesaceItem | null {
  // Jamais deux fois le même objet « trouvé » dans une vie (playtest 7/08 :
  // deux « Fiole d'eau de gouttière » dans la même run cassent l'illusion
  // d'objet trouvé). Pool épuisé → pas de drop, un bonus peut manquer.
  const pool = SOINS_MINEURS.filter((s) => !exclure.includes(s.name));
  if (!pool.length) return null;
  return withId(pool[Math.floor(Math.random() * pool.length)]);
}

/**
 * Objets RÉELS des Landes (chantier n°1 du 23/07 — « cause principale du trop
 * facile » : jusqu'ici le jeu ne distribuait que des soins génériques). Chaque
 * objet est ancré à un lieu (`Scene.loot`), ramassé une fois à l'arrivée, avec
 * son icône tramée. Deux types seulement (spec 21/07) : actif (usage unique) /
 * passif (effet permanent tant que porté). Les objets-outils du Soupçon (Craie
 * du Condamné, Dénonciation Vierge…) sont réservés au chantier n°3.
 */
export const LANDES_OBJETS: Record<string, Omit<BesaceItem, "id">> = {
  /* Tour de Guet — l'outil d'un homme qui a passé sa vie à regarder au sud. */
  "lunette-guet": {
    name: "Lunette du guetteur",
    slot: "passif",
    rarity: "rare",
    kind: "babiole",
    passiveMod: 1,
    passiveScope: "all",
    illustration: "assets/objet_lunette_guetteur_b.png",
    flavor:
      "Un seul verre, monté dans du cuivre poli par la même main pendant vingt ans. On voit loin avec. On ne voit toujours pas ce qui vient.",
  },

  "offrandes-borne": {
    name: "Offrandes de la Borne",
    usageTexte:
      "Tu manges ce qu'on avait laissé au pied de la borne : du pain dur, une poignée de baies noires. C'était pour autre chose que toi. C'est toi qui le prends.", rarity: "commun", kind: "soin", slot: "actif",
    heal: 0.25, cure: false, illustration: "assets/objet_offrandes_borne_c.png",
    flavor: "Pain durci, rubans, clous tordus. On les a laissés pour entrer. Tu les prends pour tenir.",
  },
  "echarde-gibet": {
    name: "Écharde du Grand Gibet", rarity: "commun", kind: "arme", slot: "passif",
    passiveMod: 1, passiveScope: "combat", illustration: "assets/objet_echarde_grand_gibet_b.png",
    flavor: "Un éclat du bois qui a tenu tant de cordes. Ta main s'en trouve plus dure quand il faut frapper.",
  },
  "brin-chanvre": {
    name: "Brin de Chanvre Béni",
    usageTexte:
      "Tu noues le brin de chanvre au-dessus de la plaie, deux tours, comme on t'a dit sans te le dire. Le sang ralentit. Tu ne sais pas si c'est le nœud ou ce qu'on a récité dessus.", rarity: "commun", kind: "soin", slot: "actif",
    heal: 0.2, cure: true, illustration: "assets/objet_brin_chanvre_beni_b.png",
    flavor: "Béni pour les pendus, dit-on. Noué sur une plaie, il la referme.",
  },
  "carnet-fossoyeur": {
    name: "Carnet du Fossoyeur", rarity: "commun", kind: "babiole", slot: "passif",
    passiveMod: 1, passiveScope: "all", illustration: "assets/objet_carnet_fossoyeur_d.png",
    flavor: "Qui repose où, et pourquoi. Savoir où sont les morts, c'est savoir où poser le pied.",
  },
  "lanterne-veilleur": {
    name: "Lanterne du Veilleur", rarity: "commun", kind: "babiole", slot: "passif",
    passiveMod: 1, passiveScope: "all", illustration: "assets/objet_lanterne_rouillee.png",
    flavor: "Sa flamme tient contre le vent des Landes. Tu vois venir ce que les autres subissent.",
  },
  // ——— Lot 24/07 suite : objets des lieux extérieurs et des rencontres ———
  "grelot-charretier": {
    name: "Grelot du Charretier", rarity: "commun", kind: "babiole", slot: "passif",
    passiveMod: 1, passiveScope: "combat", illustration: "assets/objet_grelot_charretier_a.png",
    flavor: "Il tinte quand quelque chose approche dans le creux. Rien ne te tombera plus dessus sans s'annoncer.",
  },
  "pierre-retour": {
    name: "Pierre de Retour", rarity: "rare", kind: "babiole", slot: "passif",
    passiveMod: 1, passiveScope: "all", illustration: "assets/objet_miroir_ame_a.png",
    flavor: "Un éclat descellé de la Borne. Les Renonçants disent qu'on revient, si on la porte. Personne n'est revenu.",
  },
  /* Le caillou du Gamin (refonte du lore 6/08) — la seule PREUVE matérielle
     que la Fille existe, et elle ne prouve rien : un galet de rivière dans une
     zone sans rivière. C'est exactement pour ça qu'il ne porte aucun bonus.
     Un objet qui aiderait au dé ferait de la Fille une récompense ; il ne doit
     rester qu'une question qu'on garde dans sa poche. */
  "caillou-gamin": {
    name: "Caillou de rivière", rarity: "commun", kind: "babiole", slot: "passif",
    passiveMod: 0, passiveScope: "all", illustration: "assets/objet_jouet_petite_fixee_a.png",
    flavor: "Plat, gris, poli par une eau qui n'existe nulle part ici. Un enfant te l'a mis dans la main sans que tu le demandes.",
  },
  /* La Clochette de meneuse (journal 6/08) — jumelle du Grelot du
     Charretier, charge inversée : le Grelot annonce ce qui approche, la
     Clochette annonce QUE TU ARRIVES. Gagnée en prenant la meneuse du
     Troupeau sans Berger (Affamé seulement) : celui qui vole la bête d'un
     pendu porte l'objet qui le signale. Aucun bonus — la charge est
     narrative, comme la Mèche. */
  "clochette-meneuse": {
    name: "Clochette de meneuse", rarity: "rare", kind: "babiole", slot: "passif",
    passiveMod: 0, passiveScope: "all", illustration: "assets/objet_clochette_meneuse_b.png",
    flavor: "On la met au cou de la meneuse pour que le berger sache où est son troupeau dans le brouillard. Maintenant c'est toi qu'elle annonce.",
  },
  "miroir-poche": {
    name: "Miroir de Poche Fêlé",
    usageTexte:
      "Tu ouvres le miroir fêlé et tu te regardes dedans, une fois, franchement. La fêlure te coupe le visage en deux — et quelque chose que la lande avait déplacé se remet à sa place. Tu refermes avant d'en voir plus.", rarity: "commun", kind: "babiole", slot: "actif",
    heal: 0.15, cure: false, illustration: "assets/objet_miroir_poche_fele_c.png",
    flavor: "Fêlé en travers, jeté dans les roseaux. Se regarder dedans remet en place ce que la lande a déplacé.",
  },
  // ——— Lot 25/07 : règle de dosage (« chaque point d'intérêt rend une monnaie »).
  // Trois objets pour les points de fouille qui ne rendaient rien. Leurs icônes
  // attendaient dans assets/ depuis le lot du 24/07, jamais câblées.
  "craie-condamne": {
    name: "Craie du Condamné", rarity: "commun", kind: "babiole", slot: "passif",
    passiveMod: 1, passiveScope: "all", illustration: "assets/objet_craie_condamne_a.png",
    flavor: "Un moignon de craie grasse, trouvé dans une fosse sans poteau. C'est avec ça qu'on marque les portes. Qui la tient choisit ce qui se sait.",
  },
  "jouet-fixee": {
    name: "Jouet de la Petite Fixée", rarity: "rare", kind: "babiole", slot: "passif",
    passiveMod: 1, passiveScope: "all", illustration: "assets/objet_jouet_petite_fixee_a.png",
    flavor: "Une poupée de chiffon et de paille, cachée sous une lucarne. Quelqu'un de très petit l'a mise là pour la sauver. Tu ne la reposeras pas.",
  },
  "cle-portillon": {
    name: "Clé du Portillon", rarity: "commun", kind: "babiole", slot: "passif",
    passiveMod: 1, passiveScope: "all", illustration: "assets/objet_cle_rouillee.png",
    flavor: "Rouillée, oubliée dans la gâche du verrou. Elle n'ouvre pas la Descente — elle ouvre le retour, et c'est plus rare.",
  },
  "fruit-cendre": {
    name: "Fruit de Cendre",
    usageTexte:
      "Tu mords dans le fruit de cendre. La pulpe est tiède, farineuse, et le goût reste longtemps après. Ça nourrit. C'est déjà tout ce qu'on lui demande.", rarity: "commun", kind: "soin", slot: "actif",
    heal: 0.3, cure: false, illustration: "assets/objet_fruit_cendre_a.png",
    flavor: "La peau est parfaite et le poids ment. Le manger est un pari : une vision, ou pire.",
  },
  /* ═══ OBJET PILOTE n°1 — L'OUTIL (chantier feedback+fluidité §2, 12/08).
     Le premier objet des Landes qui ne soigne rien et ne pèse sur aucun jet :
     il OUVRE un endroit. Pris sous verre à la Chapelle (la seule corde qui
     n'a pas tenu), il s'amarre à la margelle du Puits Condamné — et fait
     apparaître une descente qui n'existait pas.
     ⚠️ `slot: "actif"` sans `heal` ni `cure` : c'est ce qui distingue un
     OUTIL d'un remède. Sa phrase d'usage est donc écrite à la main, la
     formule générique de `usageEnMots` ne dirait rien de vrai.
     ⚠️ ICÔNE PARTAGÉE avec la Mèche Nouée en attendant que celle-ci ait la
     sienne : le fichier `objet_corde_coupee_fille_a.png` a été NOMMÉ pour
     cette corde-ci (regardé le 12/08 — un rouleau de chanvre épais, effiloché
     d'un bout), et servait à une mèche de cheveux. Prompt de la mèche écrit
     dans `data/images-a-produire.md`. */
  "corde-coupee": {
    name: "Corde coupée", rarity: "rare", kind: "babiole", slot: "actif",
    illustration: "assets/objet_corde_coupee_fille_a.png",
    usage: "Assez longue pour descendre là où personne ne descend. Une fois amarrée, on ne la remonte pas.",
    flavor: "Sous verre, dans la niche, sans nom : la seule corde de toute la chapelle qui n'a pas tenu. Coupée net, pas rompue — quelqu'un a voulu que ça rate.",
  },
  "meche-nouee": {
    name: "Mèche Nouée", rarity: "commun", kind: "babiole", slot: "passif",
    passiveMod: 0, passiveScope: "all", illustration: "assets/objet_corde_coupee_fille_a.png",
    flavor: "Les cheveux d'un fils parti par le sud, noués d'un fil. Elle ne pèse rien. C'est la promesse qui pèse.",
  },
};

/** Fabrique un objet réel des Landes par id (avec un id d'instance unique). */
export function landesLoot(id: string): BesaceItem | null {
  const base = LANDES_OBJETS[id];
  return base ? withId(base) : null;
}

/** Slot occupé par un objet réel des Landes (pour tester la place avant de le donner). */
export function landesLootSlot(id: string): BesaceSlot | null {
  return LANDES_OBJETS[id]?.slot ?? null;
}

/* ⚠️ `randomRecompenseDestin` a été SUPPRIMÉE le 10/08 (relecture par agents).
   C'était la version SANS contrôle de place, remplacée par
   `recompenseDestinQuiTient` juste dessous — mais elle survivait à côté de son
   remplaçante, exportée : le prochain à l'importer aurait silencieusement
   réintroduit l'objet fantôme (bandeau « Obtenu » pour un objet qui n'entre
   nulle part) que le panel avait mesuré sur 54 tirages sur 200. */

/**
 * LE DESTIN DONNE TOUJOURS QUELQUE CHOSE (panel 10/08).
 *
 * Le tirage libre pouvait sortir un objet dont le slot était plein : le
 * bandeau « Obtenu » s'affichait quand même, et le joueur cherchait ensuite
 * dans sa Besace un objet qui n'y était jamais entré. Un 20 naturel — le
 * moment le plus rare du jeu — se soldait par un mensonge d'interface.
 *
 * On tire donc parmi ce qui TIENT. Si les deux slots sont pleins, on rend
 * null : l'appelant le dit alors dans la fiction (les mains pleines sont un
 * vrai arbitrage) plutôt que d'annoncer un gain fantôme.
 */
export function recompenseDestinQuiTient(
  allowArme: boolean,
  besace: BesaceItem[]
): BesaceItem | null {
  const eligible = RECOMPENSES_DESTIN.filter(
    (r) => (allowArme || r.kind !== "arme") && hasBesaceRoom(besace, r.slot)
  );
  if (eligible.length === 0) return null;
  const rares = eligible.filter((r) => r.rarity === "rare");
  const legendaires = eligible.filter((r) => r.rarity === "legendaire");
  const pool = Math.random() < 0.75 && rares.length > 0 ? rares : legendaires;
  const choisi = pool.length > 0 ? pool : eligible;
  return withId(choisi[Math.floor(Math.random() * choisi.length)]);
}

/**
 * CE QUE L'OBJET FAIT, EN MOTS (panel 10/08 : « les objets sont muets »).
 *
 * Un objet ramassé n'annonçait que son nom, sa rareté et sa saveur — jamais
 * son usage. Le joueur portait une lame sans savoir qu'elle pesait sur ses
 * jets, et un baume sans savoir qu'il fallait le décider. La règle des
 * chiffres tient : on dit CE QUE ÇA CHANGE, jamais de combien.
 */
export function usageEnMots(item: BesaceItem): string {
  const it = normalizeItem(item);
  // Un OUTIL dit lui-même ce qu'il fait : la formule générique ci-dessous ne
  // parle que de soin et de jets, elle mentirait sur une corde.
  if (it.usage) return it.usage;
  if (it.slot === "actif") {
    if (it.cure && it.heal) return "À garder pour un mauvais jour : referme une plaie qui dure, et rend des forces. Une seule fois.";
    if (it.cure) return "À garder pour un mauvais jour : referme une plaie qui dure. Une seule fois.";
    if (it.heal) return "À garder pour un mauvais jour : rend des forces. Une seule fois.";
    return "À garder pour un mauvais jour. Une seule fois.";
  }
  const p = it.passiveMod ?? 0;
  if (p <= 0) return "Ne pèse rien dans la main. C'est ailleurs que ça pèse.";
  // ⚠️ LOT 4 (14/08) : ces deux lignes DISAIENT le modificateur passif (« tu
  // t'en sors mieux », « plus facilement »). L'Anneau le montre déjà — un
  // passif entre dans le seuil, donc dans le nombre d'encoches pleines. Ce
  // qu'il reste à dire est la SENSATION, pas la règle.
  if (it.passiveScope === "combat")
    return "Le poids tombe juste dans la main quand il faut faire vite.";
  return "Tu le portes sans y penser, et tu hésites moins qu'avant.";
}

export const RARITY_LABEL: Record<BesaceRarity, string> = {
  commun: "Commun",
  rare: "Rare",
  legendaire: "Légendaire",
};
