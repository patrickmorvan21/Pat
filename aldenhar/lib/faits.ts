/**
 * LE MOTEUR DE FAITS — un seul système, plusieurs types de valeurs.
 *
 * Spec « ⚡ États, Besoins & Sceaux — le Domaine se souvient » (4/08), §1.
 * États, Savoirs, Découvertes, Sceaux, Soupçon et compteurs de visite reposent
 * sur le MÊME mécanisme : un fait enregistré, et du texte ou des choix qui y
 * réagissent. Il ne faut pas cinq systèmes, il en faut un.
 *
 * ⚠️ Ce ne sont PAS des booléens (avertissement explicite de la spec) : le
 * Soupçon est progressif, les visites se comptent. Tout fait porte donc une
 * `value` numérique — un fait « présent » vaut 1, et rien n'empêche 2, 3, 12.
 *
 * ── OÙ VIVENT LES FAITS ──────────────────────────────────────────────────
 * Deux stockages, choisis par le SCOPE, jamais par le type :
 *   • `run` et `zone_run`            → `RunState.faits`     (meurent avec le héros)
 *   • `zone_permanent`, `global_…`   → `PlayerMemory.faits` (ne meurent jamais)
 *
 * ⚠️ LA DISTINCTION SAVOIR / DÉCOUVERTE EST LA PLUS IMPORTANTE DU FICHIER.
 * Le SAVOIR (`knowledge`, scope `run`) est ce que CETTE incarnation a appris —
 * il meurt avec elle. La DÉCOUVERTE (`discovery`, scope `global_permanent`) est
 * ce que LE JOUEUR a compris à travers ses incarnations. Les Découvertes
 * conditionnent les Sceaux et l'arc du twist, JAMAIS ce que sait le héros
 * courant : sinon un héros neuf paraîtrait se souvenir de ce qu'il n'a pas vécu.
 */

export type FaitKind =
  /** État du héros — le monde y réagit. Meurt avec lui. */
  | "state"
  /** Compteur progressif (Soupçon). */
  | "meter"
  /** Ce que cette incarnation a appris. */
  | "knowledge"
  /** Ce qui se compte et ne s'oublie pas (visites d'un lieu). */
  | "counter"
  /** Acquis au franchissement d'une zone — transforme le monde. */
  | "seal"
  /** Ce que LE JOUEUR a compris, par-delà ses morts. */
  | "discovery";

export type FaitScope = "run" | "zone_run" | "zone_permanent" | "global_permanent";

export type Fait = {
  id: string;
  kind: FaitKind;
  scope: FaitScope;
  /** Un fait simplement « présent » vaut 1. Jamais affiché tel quel au joueur. */
  value: number;
  /** D'où il vient — sert au débogage et au Studio, jamais au joueur. */
  source?: string;
  /** Pas de progression (`step`) au-delà duquel le fait s'efface. Absent = permanent
      dans son scope. Les états qui ne se dissipent PAS tout seuls n'en ont pas. */
  expires?: number;
};

export type SacFaits = Record<string, Fait>;

/** Les deux sacs réunis pour la lecture. L'écriture, elle, va dans l'un OU l'autre. */
export type Faits = { run: SacFaits; perm: SacFaits };

const PERMANENT: FaitScope[] = ["zone_permanent", "global_permanent"];

export function estPermanent(scope: FaitScope): boolean {
  return PERMANENT.includes(scope);
}

// ─────────────────────────────────────────────────────────────── lecture

export function lire(f: Faits, id: string): Fait | null {
  return f.run[id] ?? f.perm[id] ?? null;
}

export function valeur(f: Faits, id: string): number {
  return lire(f, id)?.value ?? 0;
}

export function present(f: Faits, id: string): boolean {
  return valeur(f, id) > 0;
}

/** Tous les faits d'un type, dans l'ordre d'insertion (donc d'acquisition). */
export function parType(f: Faits, kind: FaitKind): Fait[] {
  return [...Object.values(f.run), ...Object.values(f.perm)].filter((x) => x.kind === kind);
}

/** Combien de fois ce lieu a été visité, toutes vies confondues. */
export function visites(f: Faits, lieuId: string): number {
  return valeur(f, `visite:${radical(lieuId)}`);
}

/**
 * Le RADICAL d'un id de scène : « colline-aux-gibets-2 » → « colline-aux-gibets ».
 * Les beats d'un même lieu ne comptent qu'UNE visite — sinon un lieu à trois
 * écrans vaudrait trois fois un lieu à un écran.
 */
export function radical(sceneId: string): string {
  return sceneId.replace(/-\d+$/, "");
}

// ─────────────────────────────────────────────────────────────── conditions

/**
 * Les conditions minimales de la spec : `has` · `not` · `value >=` ·
 * `value <=` · `visitCount >=` · `all` · `any`. Rien de plus — une condition
 * qu'on ne peut pas écrire ici est une condition qu'il ne faut pas écrire.
 */
export type Condition =
  | { has: string }
  | { not: string }
  | { id: string; gte: number }
  | { id: string; lte: number }
  | { visite: string; gte: number }
  | { all: Condition[] }
  | { any: Condition[] };

export function evalue(c: Condition | undefined, f: Faits): boolean {
  if (!c) return true;
  if ("has" in c) return present(f, c.has);
  if ("not" in c) return !present(f, c.not);
  if ("visite" in c) return visites(f, c.visite) >= c.gte;
  if ("all" in c) return c.all.every((x) => evalue(x, f));
  if ("any" in c) return c.any.some((x) => evalue(x, f));
  if ("gte" in c) return valeur(f, c.id) >= c.gte;
  if ("lte" in c) return valeur(f, c.id) <= c.lte;
  return true;
}

// ─────────────────────────────────────────────────────────────── effets

/**
 * Les effets minimaux : `set` · `clear` · `increment` · `decrement` ·
 * `replace` · `scheduleEncounter`.
 *
 * `replace` sert aux groupes d'exclusivité des états (Hanté → Appelé) : il
 * retire l'ancien ET pose le nouveau, en un seul geste, pour qu'aucun appelant
 * n'ait à connaître la règle.
 */
export type Effet =
  | { set: string; kind: FaitKind; scope: FaitScope; value?: number; source?: string; expires?: number }
  | { clear: string }
  | { increment: string; by?: number; kind?: FaitKind; scope?: FaitScope }
  | { decrement: string; by?: number }
  | { replace: string; par: string; kind: FaitKind; scope: FaitScope; source?: string; expires?: number }
  | { scheduleEncounter: string; dans?: number };

/** Une rencontre programmée par un effet — relue par la traversée. */
export type RencontreDue = { scene: string; auPas: number };

export type ResultatEffets = {
  /** Rencontres à injecter dans une liaison à venir (recouvrement de dette…). */
  rencontres: RencontreDue[];
};

/**
 * Applique des effets EN PLACE sur les deux sacs. `pas` est le pas de
 * progression courant : il sert aux `expires` et aux rencontres programmées.
 *
 * ⚠️ Muter ici est volontaire : l'appelant travaille sur des copies qu'il
 * persiste ensuite (`persist()` côté Scene, `mutateMemory` côté compte). Le
 * moteur ne connaît ni localStorage ni React.
 */
export function applique(effets: Effet[], f: Faits, pas: number): ResultatEffets {
  const out: ResultatEffets = { rencontres: [] };
  for (const e of effets) {
    if ("set" in e) {
      poser(f, { id: e.set, kind: e.kind, scope: e.scope, value: e.value ?? 1, source: e.source, expires: e.expires });
    } else if ("clear" in e) {
      delete f.run[e.clear];
      delete f.perm[e.clear];
    } else if ("increment" in e) {
      const cur = lire(f, e.increment);
      poser(f, {
        id: e.increment,
        kind: cur?.kind ?? e.kind ?? "meter",
        scope: cur?.scope ?? e.scope ?? "run",
        value: (cur?.value ?? 0) + (e.by ?? 1),
        source: cur?.source,
        expires: cur?.expires,
      });
    } else if ("decrement" in e) {
      const cur = lire(f, e.decrement);
      if (cur) poser(f, { ...cur, value: Math.max(0, cur.value - (e.by ?? 1)) });
    } else if ("replace" in e) {
      delete f.run[e.replace];
      delete f.perm[e.replace];
      poser(f, { id: e.par, kind: e.kind, scope: e.scope, value: 1, source: e.source, expires: e.expires });
    } else if ("scheduleEncounter" in e) {
      out.rencontres.push({ scene: e.scheduleEncounter, auPas: pas + (e.dans ?? 2) });
    }
  }
  return out;
}

function poser(f: Faits, fait: Fait) {
  const sac = estPermanent(fait.scope) ? f.perm : f.run;
  // Un fait change de sac s'il change de scope — on nettoie l'autre côté.
  if (estPermanent(fait.scope)) delete f.run[fait.id];
  else delete f.perm[fait.id];
  sac[fait.id] = fait;
}

/** Raccourci d'écriture, pour les appelants qui n'ont qu'un fait à poser. */
export function poserFait(f: Faits, fait: Fait): void {
  poser(f, fait);
}

/**
 * Efface les faits ARRIVÉS À ÉCHÉANCE. Appelé au changement de LIEU, pas à
 * chaque écran : un état qui dure « trois scènes » doit durer trois lieux
 * traversés, sinon la profondeur par beats l'userait deux à trois fois trop vite
 * (leçon du chantier 5 du 24/07, déjà payée une fois).
 */
export function purger(f: Faits, pas: number): string[] {
  const perdus: string[] = [];
  for (const sac of [f.run, f.perm]) {
    for (const [id, fait] of Object.entries(sac)) {
      if (fait.expires !== undefined && pas >= fait.expires) {
        perdus.push(id);
        delete sac[id];
      }
    }
  }
  return perdus;
}

/** Une visite de plus sur ce lieu — compteur permanent, jamais remis à zéro. */
export function noterVisite(f: Faits, sceneId: string): number {
  const id = `visite:${radical(sceneId)}`;
  const n = valeur(f, id) + 1;
  poser(f, { id, kind: "counter", scope: "zone_permanent", value: n });
  return n;
}

/** Sacs vides — pour `fresh()` et les migrations. */
export function sacVide(): SacFaits {
  return {};
}

/**
 * Reconstruit un sac depuis du JSON de sauvegarde, en jetant tout ce qui n'a
 * pas la forme attendue. ⚠️ Comme `loadRun`, ce qui n'est pas listé ici est
 * silencieusement perdu — c'est voulu : un fait mal formé vaut mieux absent.
 */
export function sacDepuis(brut: unknown): SacFaits {
  if (!brut || typeof brut !== "object") return {};
  const out: SacFaits = {};
  for (const [id, v] of Object.entries(brut as Record<string, unknown>)) {
    const f = v as Partial<Fait>;
    if (typeof f?.id === "string" && typeof f.value === "number" && f.kind && f.scope) {
      out[id] = {
        id: f.id,
        kind: f.kind,
        scope: f.scope,
        value: f.value,
        source: typeof f.source === "string" ? f.source : undefined,
        expires: typeof f.expires === "number" ? f.expires : undefined,
      };
    }
  }
  return out;
}
