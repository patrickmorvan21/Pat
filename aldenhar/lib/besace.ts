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
      flavor: "Elle a déjà servi. Elle servira encore. Ta main s'en trouve plus sûre au combat.",
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
  { name: "Baume de mousse noire", rarity: "commun", kind: "soin", slot: "actif", heal: 0.3, cure: true, flavor: "Ça sent la cave. Ça referme les plaies." },
  { name: "Fiole d'eau de gouttière", illustration: "assets/objet_fiole_baume.png", rarity: "commun", kind: "soin", slot: "actif", heal: 0.25, cure: false, flavor: "Trouble, tiède — mais elle apaise." },
  { name: "Bandage d'un autre", illustration: "assets/objet_brin_chanvre_beni_b.png", rarity: "commun", kind: "soin", slot: "actif", heal: 0.2, cure: true, flavor: "Son premier propriétaire n'en aura plus besoin." },
  { name: "Onguent gris", rarity: "commun", kind: "soin", slot: "actif", heal: 0.3, cure: false, flavor: "L'étiquette est illisible. L'odeur, convaincante." },
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
  { name: "Élixir du campement perdu", rarity: "rare", kind: "soin", slot: "actif", heal: 0.5, cure: true, flavor: "Quelqu'un l'a brassé pour un repos qui n'est jamais venu." },
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
    name: "Offrandes de la Borne", rarity: "commun", kind: "soin", slot: "actif",
    heal: 0.25, cure: false, illustration: "assets/objet_offrandes_borne_c.png",
    flavor: "Pain durci, rubans, clous tordus. On les a laissés pour entrer. Tu les prends pour tenir.",
  },
  "echarde-gibet": {
    name: "Écharde du Grand Gibet", rarity: "commun", kind: "arme", slot: "passif",
    passiveMod: 1, passiveScope: "combat", illustration: "assets/objet_echarde_grand_gibet_b.png",
    flavor: "Un éclat du bois qui a tenu tant de cordes. Ta main s'en trouve plus dure quand il faut frapper.",
  },
  "brin-chanvre": {
    name: "Brin de Chanvre Béni", rarity: "commun", kind: "soin", slot: "actif",
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
    name: "Miroir de Poche Fêlé", rarity: "commun", kind: "babiole", slot: "actif",
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
    name: "Fruit de Cendre", rarity: "commun", kind: "soin", slot: "actif",
    heal: 0.3, cure: false, illustration: "assets/objet_fruit_cendre_a.png",
    flavor: "La peau est parfaite et le poids ment. Le manger est un pari : une vision, ou pire.",
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
  if (it.slot === "actif") {
    if (it.cure && it.heal) return "À garder pour un mauvais jour : referme une plaie qui dure, et rend des forces. Une seule fois.";
    if (it.cure) return "À garder pour un mauvais jour : referme une plaie qui dure. Une seule fois.";
    if (it.heal) return "À garder pour un mauvais jour : rend des forces. Une seule fois.";
    return "À garder pour un mauvais jour. Une seule fois.";
  }
  const p = it.passiveMod ?? 0;
  if (p <= 0) return "Ne pèse rien dans la main. C'est ailleurs que ça pèse.";
  if (it.passiveScope === "combat")
    return "Tant que tu la portes, tu t'en sors mieux quand il faut se battre.";
  return "Tant que tu le portes, tout te vient un peu plus facilement.";
}

export const RARITY_LABEL: Record<BesaceRarity, string> = {
  commun: "Commun",
  rare: "Rare",
  legendaire: "Légendaire",
};
