/**
 * CE QUE LE COMPTE RETIENT D'UNE TRAVERSÉE RÉUSSIE — un simple compteur.
 *
 * Remplace le Sceau des Landes (retiré le 25/09, décision Patrick : « ça
 * complexifie le jeu, ça rajoute un élément supplémentaire ; on passe
 * simplement à l'acte suivant par une transition »). Plus de marque dans la
 * paume, plus de conversations ouvertes par elle, plus de réponse de la Borne.
 *
 * Il reste UNE chose, et c'est de la mémoire, pas une récompense : le monde
 * sait que ce compte est déjà sorti. C'est ce qui permet au Chemin du Sud de
 * ne pas refaire la leçon à qui connaît le chemin (`chemin-du-sud-revenu`).
 *
 * Vit dans `PlayerMemory.faits`, nature `counter`, portée `zone_permanent`.
 */

import type { Faits, SacFaits } from "./faits";
import { valeur } from "./faits";

/** L'id du fait : combien de fois ce compte a franchi la zone vivant. */
export const traverseeDe = (zone: string) => `traversee:${zone}`;
// Littéral (et non `traverseeDe("landes")`) : les extracteurs Python lisent la
// constante dans le source, ils ne savent pas évaluer un appel.
export const TRAVERSEE_LANDES = "traversee:landes";

export function niveauTraversee(f: Faits, zone = "landes"): number {
  return valeur(f, traverseeDe(zone));
}

/**
 * Une sauvegarde d'avant le 25/09 porte `sceau:landes` (nature `seal`). On en
 * garde le COMPTE — c'était déjà le nombre de traversées — sous le nouvel id,
 * et le sceau disparaît : sans ça, un joueur qui avait franchi la Descente
 * se verrait refaire la leçon du Chemin du Sud.
 */
export function migrerSceau(sac: SacFaits): SacFaits {
  const vieux = sac["sceau:landes"];
  if (!vieux) return sac;
  const out: SacFaits = { ...sac };
  delete out["sceau:landes"];
  const id = TRAVERSEE_LANDES;
  out[id] = {
    id,
    kind: "counter",
    scope: "zone_permanent",
    value: Math.max(out[id]?.value ?? 0, vieux.value ?? 0),
    source: "la-descente",
  };
  return out;
}
