/**
 * LES SALINES — la traversée à étages, DÉCLARÉE (routage validé par Patrick
 * le 13/09/2026 : configuration D de `data/salines-routage.md`).
 *
 * Module PUR, sans aucun import du moteur (seulement le type) : c'est ce qui
 * permet au garde de build `tools/verifier_etages.mjs` de le charger seul,
 * de le croiser avec `data/zones/salines.json` et de passer `auditerEtages`
 * dessus — les deux sources ne peuvent donc pas diverger sans casser le build.
 *
 * ⚠️ Les ids sont ceux des FUTURES scènes (tirets, comme `chemin-creux`), pas
 * ceux de la matière de production (`rive_haute`) : la correspondance est
 * `_` → `-`, et le garde la vérifie dans les deux sens. Aucune de ces scènes
 * n'existe encore dans `scene-data.ts` — la zone reste `ecrite: false`, donc
 * cette table n'est lue par aucun joueur. Elle existe pour que le graphe, la
 * réplique et le moteur parlent déjà de la même chose le jour où on écrit
 * la Croûte.
 *
 * Ce que cette table NE porte PAS, parce que ce n'est pas de la structure :
 *   - le Fossé : c'est le beat d'ARRIVÉE de Saulnes (on descend, on remonte
 *     vers la ville), une approche et non un lieu — il se joue comme la
 *     phrase d'approche d'une destination, sans crédit de lieu ;
 *   - la Barge exclusive (coffre OU cale), F2 garanti aux Terrasses, le
 *     Battant remis et sonné, la Guérite campement : du contenu de scène.
 */

import type { Environnement } from "@/lib/etages";

export const SALINES_ENVIRONNEMENTS: Environnement[] = [
  {
    id: "croute",
    nom: "La Croûte",
    entree: "rive-haute",
    pool: ["file", "champ-des-sillages", "barge-echouee", "statue", "bouche", "radeau"],
    tirages: [1, 2],
  },
  {
    id: "bassins",
    nom: "Les Bassins",
    entree: "terrasses",
    pool: [
      "passerelle-rompue",
      "perchoir-du-heron",
      "bassin-des-lechards",
      "bassin-des-declares",
      "cuve-fendue",
      "guerite",
      "noria",
    ],
    tirages: [1, 2],
  },
  {
    id: "salines",
    nom: "Les Salines",
    // pas d'entrée : on débarque par le pool, l'Entrepôt ferme le chantier
    pool: ["pesee", "puits", "dortoir", "forge-a-grattoirs", "cour-aux-rails", "salle-des-gages"],
    tirages: [1, 1],
    fin: ["entrepot"],
  },
  {
    id: "saulnes",
    nom: "Saulnes",
    // pas d'entrée non plus : le Fossé est un beat d'arrivée, puis 0 ou 1 lieu
    // du relais, puis la fin dans l'ordre — les Rues, le Quai, la Tour.
    pool: ["porte-de-l-ile", "auberge-du-relais", "belvedere", "maison-du-grand-passeur"],
    tirages: [0, 1],
    fin: ["rues-qui-marchent", "quai-de-l-ile", "tour-de-l-ecluse"],
  },
];
