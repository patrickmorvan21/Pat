/**
 * LES ZONES DU DOMAINE — et la règle qui les enchaîne (décision Patrick, 12/09).
 *
 * « Une seule vie sur les trois actes. » La Descente est la structure entière :
 * Acte I → II → III, on descend de plus en plus, et LA VIE TRAVERSE LES ZONES.
 * Ce qu'on ramasse à l'Acte I, on l'a à l'Acte II. Jusqu'au 12/09 le moteur
 * posait l'inverse — une vie = une zone, `resetRun()` à la Descente — parce
 * qu'une seule zone existait et qu'il fallait bien finir quelque part.
 *
 * Cette table est la SEULE source de l'ordre des zones. Le moteur ne connaît
 * pas « les Landes » ni « les Salines » par leur nom : il connaît une zone
 * courante (`RunState.zone`), sa traversée (`RunState.trav`) et la zone qui
 * vient après. Franchir la Descente d'une zone dont la suivante est ÉCRITE
 * (`ecrite: true`) fait passer la vie dedans (`franchirZone`, lib/state.ts) ;
 * si la suivante n'est pas écrite, la démo s'arrête là — carton « à venir »
 * puis fin de démo, comme avant, sans mort et sans ligne au Registre.
 *
 * ⚠️ `ecrite` est l'interrupteur. Tant qu'une zone le porte à `false`, aucun
 * joueur ne peut y entrer et le chemin d'enchaînement est INATTEIGNABLE en
 * jeu — c'est dit ici pour qu'aucune relecture ne conclue qu'il est mort.
 * Le passer à `true` sans que `entry` désigne une scène qui existe serait
 * une promesse sans consommateur, la classe de défaut que ce projet a payée
 * le plus cher : `franchirZone` refuse une entrée vide.
 */

import { ENTRY_SCENE } from "@/lib/scene-data";

export type ZoneId = "landes" | "salines";

export type ZoneDef = {
  id: ZoneId;
  /** Le nom qui s'affiche (bilan de mort, cartons). */
  nom: string;
  /** L'acte qui la contient — l'Acte I s'appelle « Les Lisières » sur son carton. */
  acte: number;
  /** Id de la scène d'entrée (la Borne pour les Landes). Vide tant que non écrite. */
  entry: string;
  /** La zone existe-t-elle en jeu ? Faux = la Descente qui y mène est la fin de démo. */
  ecrite: boolean;
};

export const ZONES: ZoneDef[] = [
  { id: "landes", nom: "Les Landes", acte: 1, entry: ENTRY_SCENE, ecrite: true },
  // Bible Notion « Zone 2 — Les Salines » (11-12/09). Entrée = la Rive haute,
  // à écrire ; jusque-là la Descente des Landes reste la fin de la démo.
  { id: "salines", nom: "Les Salines", acte: 1, entry: "", ecrite: false },
];

export function zoneDef(id: ZoneId | undefined): ZoneDef {
  return ZONES.find((z) => z.id === (id ?? "landes")) ?? ZONES[0];
}

/** La zone qui suit `id` dans la Descente, écrite ou non ; `null` tout en bas. */
export function zoneSuivante(id: ZoneId | undefined): ZoneDef | null {
  const i = ZONES.findIndex((z) => z.id === (id ?? "landes"));
  return i >= 0 && i + 1 < ZONES.length ? ZONES[i + 1] : null;
}

/** Une zone suivante existe ET se joue : la vie continue dedans. */
export function zoneSuivanteJouable(id: ZoneId | undefined): ZoneDef | null {
  const n = zoneSuivante(id);
  return n && n.ecrite && n.entry ? n : null;
}
