/**
 * LA MÉMOIRE DES RENCONTRES — le monde se souvient de ce que tu lui as FAIT.
 *
 * Demande Patrick du 25/09 (« je veux vraiment que le joueur se rende compte
 * qu'il ne revit pas la scène exactement comme il l'a vécue avant »). Ce qui
 * existait ne suffisait pas : les strates de familiarité (`FAMILIARITE`) et
 * les lignes de PNJ (`PNJ_MEMOIRE`) ne comptent que des PASSAGES, et n'ont
 * droit qu'à un bloc optionnel par arrivée. Une rencontre ne savait donc
 * jamais si tu l'avais fuie, blessée, écoutée ou si elle t'avait tué.
 *
 * ── LE MODÈLE ─────────────────────────────────────────────────────────────
 * • Une CLÉ par chose qui se souvient (`Scene.memoire` : "bete", "epoux",
 *   "lieu:verger"…). Plusieurs scènes peuvent partager une clé (les beats
 *   d'une même rencontre).
 * • Un choix dit ce que la clé RETIENDRA (`Choice.laisse`), selon l'issue :
 *   "fui", "blessee", "parle", "ignore"… Le dernier acte d'une vie l'emporte.
 *   Mourir face à elle laisse "tue".
 * • À la vie suivante, la scène relit ce souvenir :
 *     – `Scene.retours` : la NARRATION est remplacée, pas complétée — le
 *       joueur ne relit pas la même scène avec une ligne de plus, il lit une
 *       autre scène. Le premier retour dont la condition tient l'emporte ;
 *       aucun ne tient → la narration d'origine (la première fois).
 *     – `Choice.siMemoire` / `sansMemoire` : une option apparaît ou disparaît
 *       (les hostiles APPRENNENT : l'option qui t'a sauvé n'est plus là, une
 *       autre, qui répond à ce qu'ils ont compris de toi, prend sa place).
 *     – `Choice.durcitSi` : la même option, plus dure. Rien n'est affiché :
 *       l'Anneau montre moins d'encoches pleines.
 *
 * ── L'INSTANTANÉ ──────────────────────────────────────────────────────────
 * La mémoire du compte BOUGE pendant la vie (le passage se compte à l'entrée,
 * l'acte se note à la résolution). Si la scène relisait la mémoire en direct,
 * elle changerait sous les yeux du joueur — et la reprise après fermeture de
 * l'app ne servirait pas le même texte. Chaque clé est donc PHOTOGRAPHIÉE à
 * sa première rencontre de la vie (`RunState.memoireVue`), et toute la vie
 * lit la photo. C'est ce qui rend la reprise exacte (pilier permadeath).
 *
 * ── LA RÈGLE D'ÉCRITURE ───────────────────────────────────────────────────
 * Le héros vient de naître : il ne se souvient de RIEN. Ce sont les AUTRES
 * qui se souviennent — la Bête a appris le talus, l'Épouse te reproche ce que
 * « l'autre » a fait. Jamais « tu reconnais ». Même discipline que les
 * strates (10/08) et le déjà-vu (dejavu.ts).
 */

/** Ce qu'une clé retient d'un compte. */
export type SouvenirRencontre = {
  /** Vies qui l'ont rencontrée (comptées à l'entrée, une fois par vie). */
  passages: number;
  /** Le dernier acte retenu (« fui », « blessee », « tue »…). */
  dernier?: string;
  /** Les actes des vies précédentes, du plus ancien au plus récent (4 max). */
  historique?: string[];
};

/** La photo des clés rencontrées dans cette vie (`RunState.memoireVue`). */
export type Instantane = Record<string, SouvenirRencontre>;

/** Une condition sur la mémoire. Tous les champs posés doivent tenir. */
export type MemoireCond = {
  /** La clé lue ; par défaut celle de la scène (`Scene.memoire`). */
  cle?: string;
  /** Le dernier acte retenu est l'un de ceux-là. */
  dernier?: string | string[];
  /** Au moins N vies l'ont déjà rencontrée (avant celle-ci). */
  passagesMin?: number;
  /** Aucune vie ne l'a jamais rencontrée (la première fois). */
  jamais?: boolean;
};

/** Ce qu'un choix laisse : toujours le même acte, ou selon l'issue. */
export type Laisse = string | { reussite?: string; echec?: string };

/** Une autre version de la scène, pour qui revient. */
export type Retour = {
  si: MemoireCond;
  /** Remplace la narration de la scène — jamais un ajout. */
  narration: string[];
};

/** Le souvenir d'une clé tel que la photo le rend (vierge si jamais vue). */
export function souvenir(inst: Instantane | undefined, cle: string): SouvenirRencontre {
  return inst?.[cle] ?? { passages: 0 };
}

/** La condition tient-elle, lue sur la photo ? */
export function remplit(
  cond: MemoireCond | undefined,
  cleDefaut: string | undefined,
  inst: Instantane | undefined
): boolean {
  if (!cond) return true;
  const cle = cond.cle ?? cleDefaut;
  if (!cle) return false;
  const s = souvenir(inst, cle);
  if (cond.jamais) return s.passages === 0;
  if (cond.passagesMin !== undefined && s.passages < cond.passagesMin) return false;
  if (cond.dernier !== undefined) {
    const liste = Array.isArray(cond.dernier) ? cond.dernier : [cond.dernier];
    if (!s.dernier || !liste.includes(s.dernier)) return false;
  }
  return true;
}

/** Le retour qui s'applique à cette scène, ou null (la première fois). */
export function retourApplicable(
  scene: { memoire?: string; retours?: Retour[] },
  inst: Instantane | undefined
): Retour | null {
  for (const r of scene.retours ?? []) {
    if (remplit(r.si, scene.memoire, inst)) return r;
  }
  return null;
}

/** L'acte que ce choix laisse, selon l'issue (réussite par défaut). */
export function laisseDe(c: { laisse?: Laisse }, reussi: boolean): string | undefined {
  if (!c.laisse) return undefined;
  if (typeof c.laisse === "string") return c.laisse;
  return reussi ? c.laisse.reussite : c.laisse.echec;
}

/** Toutes les clés qu'une scène lit ou écrit — on les photographie ensemble. */
export function clesDeScene(scene: {
  memoire?: string;
  retours?: Retour[];
  choices?: Array<{
    laisseCle?: string;
    siMemoire?: MemoireCond;
    sansMemoire?: MemoireCond;
    durcitSi?: MemoireCond;
  }>;
}): string[] {
  const cles = new Set<string>();
  if (scene.memoire) cles.add(scene.memoire);
  for (const r of scene.retours ?? []) if (r.si.cle) cles.add(r.si.cle);
  for (const c of scene.choices ?? []) {
    if (c.laisseCle) cles.add(c.laisseCle);
    for (const k of [c.siMemoire, c.sansMemoire, c.durcitSi]) if (k?.cle) cles.add(k.cle);
  }
  return [...cles];
}

/** Retenir un acte dans la mémoire d'une clé (mutation d'un registre copié). */
export function noterActe(
  registre: Record<string, SouvenirRencontre> | undefined,
  cle: string,
  acte: string
): Record<string, SouvenirRencontre> {
  const r = { ...(registre ?? {}) };
  const cur = r[cle] ?? { passages: 0 };
  r[cle] = { ...cur, dernier: acte, historique: [...(cur.historique ?? []), acte].slice(-4) };
  return r;
}

/**
 * Compter une vie de plus pour cette clé. Appelé une fois par vie, à la
 * première entrée dans une scène de la clé — APRÈS la photo, pour que la
 * scène lise ce que les vies d'avant ont laissé, pas celle-ci.
 */
export function noterPassage(
  registre: Record<string, SouvenirRencontre> | undefined,
  cle: string
): Record<string, SouvenirRencontre> {
  const r = { ...(registre ?? {}) };
  const cur = r[cle] ?? { passages: 0 };
  r[cle] = { ...cur, passages: cur.passages + 1 };
  return r;
}

/** Une mémoire de compte relue depuis le stockage — jamais une exception. */
export function rencontresDepuis(x: unknown): Record<string, SouvenirRencontre> {
  if (!x || typeof x !== "object") return {};
  const out: Record<string, SouvenirRencontre> = {};
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    const s = v as Partial<SouvenirRencontre> | null;
    if (!s || typeof s.passages !== "number") continue;
    out[k] = {
      passages: s.passages,
      ...(typeof s.dernier === "string" ? { dernier: s.dernier } : {}),
      ...(Array.isArray(s.historique) ? { historique: s.historique.filter((h) => typeof h === "string").slice(-4) } : {}),
    };
  }
  return out;
}
