/**
 * LA TRAVERSÉE À ÉTAGES — la grammaire des Salines (bible Notion, « Cadence
 * de traversée », validée 11/09) : « Les quatre environnements sont TOUJOURS
 * traversés, dans l'ordre. Dans chaque environnement : un lieu obligatoire +
 * un ou deux tirés dans le pool. »
 *
 * Les Landes traversent un POOL PLAT (une Croisée tire deux lieux parmi tous
 * ceux qu'on n'a pas vus, avec des garanties posées par-dessus). Ici la zone
 * est une SUITE d'environnements, et chacun est un petit pool fermé encadré
 * d'obligatoires. Le moteur des Landes ne sait pas faire ça — et il est
 * inutile de le lui apprendre en le retouchant : ce module décide, seul, de
 * la prochaine étape d'une zone à étages ; `Scene.tsx` n'y touche que si la
 * zone déclare des `environnements` (lib/zones.ts). Les Landes ne passent
 * jamais ici.
 *
 * ⚠️ PUR, et sans aucun import du moteur : il ne connaît les lieux que par
 * leur id. C'est ce qui le rend testable en unitaire (tools/test_etages.mjs)
 * avant qu'une seule scène des Salines n'existe — et c'est la seule preuve
 * possible aujourd'hui, puisque l'enchaînement de zone est inatteignable en
 * jeu tant que `ecrite` est faux.
 *
 * Un environnement :
 *   • `entree`  — le lieu obligatoire par lequel on y ARRIVE (la Rive haute,
 *                 les Terrasses, le Fossé). Facultatif : le chantier des
 *                 Salines n'a pas d'entrée imposée, on y débarque par le pool.
 *   • `pool`    — les lieux tirables ; `tirages` = combien on en visite
 *                 ([min, max], tiré une fois à l'entrée de l'environnement).
 *   • `fin`     — les obligatoires joués APRÈS le pool, dans l'ordre : le
 *                 Grand Saunier ferme le chantier, les Rues qui marchent puis
 *                 la Tour ferment Saulnes. Le dernier `fin` de la dernière
 *                 étape est la sortie de zone (une scène `terminal`).
 *
 * Ce que ça garantit, par construction : l'ordre des environnements ne peut
 * pas être contourné (une Croisée ne tire QUE dans l'étape courante), un
 * obligatoire ne peut pas être manqué (il n'est pas offert, il est imposé),
 * et un lieu ne se visite qu'une fois. Le « danger d'abord, calme à la fin »
 * de la bible est un effet de l'ordre, pas une règle de plus.
 */

export type Environnement = {
  id: string;
  nom: string;
  entree?: string;
  pool: string[];
  tirages: [number, number];
  fin?: string[];
};

/** Où en est-on dans la suite des étapes — porté par `TraversalState.etage`. */
export type EtageState = {
  /** Index de l'environnement courant dans `envs`. */
  index: number;
  /** Combien de lieux du pool on visite dans cet environnement (tiré à l'entrée). */
  cible: number;
  /** Combien on en a déjà visités. */
  tires: number;
  /** Combien d'obligatoires de `fin` ont déjà été joués. */
  fins: number;
};

/** La prochaine étape, décidée en QUITTANT un lieu. */
export type Prochain =
  /** Un lieu imposé : l'entrée de l'étape suivante, ou un obligatoire de fin. */
  | { type: "lieu"; id: string; raison: "entree" | "fin" }
  /** Une Croisée : deux lieux du pool courant (un seul s'il n'en reste qu'un). */
  | { type: "croisee"; options: [string, string] | [string] }
  /** Plus rien à jouer : la zone est finie (la sortie se joue normalement
      comme dernier `fin` terminal — ceci est le repli). */
  | { type: "descente" };

/** Tirage déterministe (graine) — le même écran à la reprise. */
function tirer(seed: number, n: number): number {
  // Un LCG suffit : on veut la stabilité, pas la qualité statistique.
  let x = (seed * 1103515245 + 12345) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return n > 0 ? x % n : 0;
}

/** Mélange seedé (Fisher-Yates) — jamais `Math.random` : la reprise rebâtit
    la même Croisée. */
function melanger<T>(xs: T[], seed: number): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = tirer(seed + i * 7919, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Entrer dans l'environnement `index` : tire combien de lieux du pool on y visitera. */
export function ouvrirEtage(envs: Environnement[], index: number, seed: number): EtageState {
  const env = envs[index];
  if (!env) throw new Error(`ouvrirEtage : pas d'environnement à l'index ${index}`);
  const [min, max] = env.tirages;
  const lo = Math.max(0, Math.min(min, max));
  const hi = Math.max(lo, max);
  // On ne peut pas tirer plus que le pool n'en a.
  const cible = Math.min(env.pool.length, lo + tirer(seed + index * 31, hi - lo + 1));
  return { index, cible, tires: 0, fins: 0 };
}

/** Le premier lieu d'une zone à étages — l'entrée du premier environnement,
    ou son premier tirage s'il n'a pas d'entrée. */
export function premierLieu(envs: Environnement[], seed: number): string {
  const e = envs[0];
  if (!e) throw new Error("premierLieu : zone sans environnement");
  if (e.entree) return e.entree;
  const p = melanger(e.pool, seed);
  if (!p.length) throw new Error(`premierLieu : l'environnement « ${e.id} » n'a ni entrée ni pool`);
  return p[0];
}

/**
 * On ARRIVE dans un lieu : met à jour le compte de l'étape. À appeler avec
 * l'id du lieu réellement atteint (pool, entrée ou fin). Un id inconnu de
 * l'étape courante (une rencontre ouverte par un choix, un déroutage) ne
 * change rien — une rencontre n'est pas un lieu traversé.
 */
export function entrerLieu(envs: Environnement[], etage: EtageState, id: string): EtageState {
  const env = envs[etage.index];
  if (!env) return etage;
  if (env.pool.includes(id)) return { ...etage, tires: etage.tires + 1 };
  const fin = env.fin ?? [];
  if (fin[etage.fins] === id) return { ...etage, fins: etage.fins + 1 };
  return etage;
}

/**
 * On QUITTE un lieu : que vient-il après ? Rend aussi l'état d'étape qui va
 * avec (il change quand on passe à l'environnement suivant).
 *
 * L'ordre, dans chaque environnement : entrée (si on n'y est pas encore
 * arrivé) → pool (jusqu'à `cible`, ou jusqu'à épuisement) → `fin` dans
 * l'ordre → environnement suivant. Quand le pool ne peut plus rien offrir
 * (tous visités), on passe aux fins sans attendre la cible : une zone ne se
 * bloque jamais sur un tirage impossible.
 */
export function prochainPas(
  envs: Environnement[],
  etage: EtageState,
  visited: string[],
  seed: number
): { pas: Prochain; etage: EtageState } {
  let et = etage;
  for (let garde = 0; garde < envs.length + 1; garde++) {
    const env = envs[et.index];
    if (!env) return { pas: { type: "descente" }, etage: et };

    // L'entrée d'abord — si elle existe et qu'on n'y est pas encore allé.
    if (env.entree && !visited.includes(env.entree)) {
      return { pas: { type: "lieu", id: env.entree, raison: "entree" }, etage: et };
    }
    // Le pool ensuite, tant que la cible n'est pas atteinte.
    const libres = env.pool.filter((id) => !visited.includes(id));
    if (et.tires < et.cible && libres.length > 0) {
      const m = melanger(libres, seed + et.index * 101 + et.tires * 13);
      const options: [string, string] | [string] = m.length >= 2 ? [m[0], m[1]] : [m[0]];
      return { pas: { type: "croisee", options }, etage: et };
    }
    // Puis les obligatoires de fin, dans l'ordre.
    const fin = env.fin ?? [];
    if (et.fins < fin.length) {
      return { pas: { type: "lieu", id: fin[et.fins], raison: "fin" }, etage: et };
    }
    // Environnement épuisé : le suivant.
    if (et.index + 1 < envs.length) {
      et = ouvrirEtage(envs, et.index + 1, seed);
      continue;
    }
    return { pas: { type: "descente" }, etage: et };
  }
  return { pas: { type: "descente" }, etage: et };
}

/** Combien de lieux une traversée complète compte AU PLUS (obligatoires +
    tirages max) — sert de `target` pour ce qui lit encore un total (la courbe
    de tension, les statistiques), jamais pour décider de la fin. */
export function cibleTotale(envs: Environnement[]): number {
  return envs.reduce(
    (n, e) => n + (e.entree ? 1 : 0) + Math.min(e.pool.length, e.tirages[1]) + (e.fin?.length ?? 0),
    0
  );
}

/**
 * Contrôle de forme d'une zone à étages — à appeler par un garde de build,
 * pas au runtime : un id qui n'est ni entrée, ni pool, ni fin de son étape
 * ne peut jamais être atteint, et un lieu présent dans deux étapes serait
 * offert deux fois. Rend la liste des défauts (vide = sain).
 */
export function auditerEtages(envs: Environnement[]): string[] {
  const defauts: string[] = [];
  const vus = new Map<string, string>();
  const note = (id: string, ou: string) => {
    const deja = vus.get(id);
    if (deja) defauts.push(`« ${id} » apparaît deux fois (${deja} et ${ou})`);
    else vus.set(id, ou);
  };
  envs.forEach((e, i) => {
    if (!e.entree && e.pool.length === 0) defauts.push(`étape ${i} (${e.id}) : ni entrée ni pool`);
    if (e.tirages[0] > e.tirages[1]) defauts.push(`étape ${i} (${e.id}) : tirages min > max`);
    if (e.tirages[1] > e.pool.length)
      defauts.push(`étape ${i} (${e.id}) : tirages max (${e.tirages[1]}) > pool (${e.pool.length})`);
    if (e.entree) note(e.entree, `${e.id}/entree`);
    e.pool.forEach((id) => note(id, `${e.id}/pool`));
    (e.fin ?? []).forEach((id) => note(id, `${e.id}/fin`));
  });
  return defauts;
}
