/**
 * Besace (journal Notion 13/07) — système SÉPARÉ des Reliques :
 * objets mundane, 3-4 emplacements, icône tramée + nom + flavor, JAMAIS de
 * stat chiffrée (l'objet fait glisser la fréquence des paliers vécus, pas un
 * bonus affiché). Vidée à la mort, sauf ce qui devient Relique.
 * Départ fixe pour tous les héros : une dague simple, jamais aléatoire.
 */

export type BesaceRarity = "commun" | "rare" | "legendaire";

export type BesaceItem = {
  id: string;
  name: string;
  rarity: BesaceRarity;
  /** soin = consommable qui referme les blessures ; arme/babiole = passifs narratifs. */
  kind: "arme" | "soin" | "babiole";
  flavor: string;
};

export const BESACE_SLOTS = 4;

/** Objet de départ, identique pour tous les héros (13/07 : jamais aléatoire). */
export function startingBesace(): BesaceItem[] {
  return [
    {
      id: "dague-simple",
      name: "Dague simple",
      rarity: "commun",
      kind: "arme",
      flavor: "Elle a déjà servi. Elle servira encore.",
    },
  ];
}

/** Soins mineurs trouvables en exploration (~1 scène d'exploration sur 5). */
const SOINS_MINEURS: Omit<BesaceItem, "id">[] = [
  { name: "Baume de mousse noire", rarity: "commun", kind: "soin", flavor: "Ça sent la cave. Ça referme les plaies." },
  { name: "Fiole d'eau de gouttière", rarity: "commun", kind: "soin", flavor: "Trouble, tiède — mais elle apaise." },
  { name: "Bandage d'un autre", rarity: "commun", kind: "soin", flavor: "Son premier propriétaire n'en aura plus besoin." },
  { name: "Onguent gris", rarity: "commun", kind: "soin", flavor: "L'étiquette est illisible. L'odeur, convaincante." },
];

/** Récompenses du Destin (nat 20) : rare à légendaire, JAMAIS une Relique. */
const RECOMPENSES_DESTIN: Omit<BesaceItem, "id">[] = [
  { name: "Amulette d'os verdi", rarity: "rare", kind: "babiole", flavor: "Elle vibre quand on la regarde trop longtemps." },
  { name: "Lame de lanterne", rarity: "rare", kind: "arme", flavor: "Forgée dans le métal d'une lanterne verte. Elle ne vacille jamais." },
  { name: "Élixir du campement perdu", rarity: "rare", kind: "soin", flavor: "Quelqu'un l'a brassé pour un repos qui n'est jamais venu." },
  { name: "Larme du Geôlier", rarity: "legendaire", kind: "babiole", flavor: "Il jure qu'il ne pleure pas. Elle existe pourtant." },
  { name: "Clef sans porte", rarity: "legendaire", kind: "babiole", flavor: "Toutes les serrures la craignent un peu." },
];

let uid = 0;
function withId(base: Omit<BesaceItem, "id">): BesaceItem {
  uid += 1;
  return { ...base, id: `${base.name.toLowerCase().replace(/[^a-z]+/g, "-")}-${uid}` };
}

export function randomSoinMineur(): BesaceItem {
  return withId(SOINS_MINEURS[Math.floor(Math.random() * SOINS_MINEURS.length)]);
}

/**
 * Tirage Destin (~75% rare / 25% légendaire).
 * `allowArme` (retour Patrick 14/07) : une ARME n'a de sens que si le héros a
 * réellement croisé le fer — fuir un Rôdeur avec un 20 ne forge pas de lame.
 * Hors engagement, le Destin offre babioles ou soins, jamais une arme.
 */
export function randomRecompenseDestin(allowArme: boolean): BesaceItem {
  const eligible = RECOMPENSES_DESTIN.filter((r) => allowArme || r.kind !== "arme");
  const rares = eligible.filter((r) => r.rarity === "rare");
  const legendaires = eligible.filter((r) => r.rarity === "legendaire");
  const pool = Math.random() < 0.75 && rares.length > 0 ? rares : legendaires;
  return withId(pool[Math.floor(Math.random() * pool.length)]);
}

export const RARITY_LABEL: Record<BesaceRarity, string> = {
  commun: "Commun",
  rare: "Rare",
  legendaire: "Légendaire",
};
