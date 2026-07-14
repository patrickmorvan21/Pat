"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Die3D, { type RollRequest } from "@/components/Die3D";
import ChoiceButton from "@/components/ChoiceButton";
import TypedText from "@/components/TypedText";
import DeathScreen from "@/components/DeathScreen";
import { chapterLabel, jailerTaunt, sceneAt, tierIsFail, type Choice } from "@/lib/scene-data";
import { loadRun, resetRun, saveRun, type FeedEntry, type RunState } from "@/lib/state";
import { BESACE_SLOTS, randomRecompenseDestin, randomSoinMineur, RARITY_LABEL, type BesaceItem, type BesaceRarity } from "@/lib/besace";
import { ditherFadeMaskDataUrl } from "@/lib/dither";
import {
  bloodDebtFor,
  buildRegistre,
  jailerPosture,
  loadMemory,
  mutateMemory,
  recordDeath,
  type Relic,
} from "@/lib/player-memory";

// Masque tramé du portrait du Geôlier — généré une fois, mis en cache (§11 :
// dissolution en pixels épars sur les bords, jamais un fondu CSS lisse).
// L'image est mirroir (-scale-x-100) pour faire face au texte : le fondu est
// donc construit du côté "nx→0" pour finir visuellement à droite (près du
// texte) une fois le mirroir appliqué.
let demonMaskCache: string | null = null;
function getDemonMask(): string | null {
  if (typeof document === "undefined") return null;
  if (!demonMaskCache) {
    // Dimensions du portrait redessiné (Figma 239:49164) : 101×119.
    demonMaskCache = ditherFadeMaskDataUrl(101, 119, (nx, ny) => {
      const fadeRight = Math.max(0, (0.45 - nx) / 0.45);
      const fadeBottom = Math.max(0, (ny - 0.72) / 0.28);
      return Math.min(1, Math.max(fadeRight, fadeBottom));
    });
  }
  return demonMaskCache;
}

let uidCounter = 0;
function nextId() {
  uidCounter += 1;
  return `e${uidCounter}-${Date.now().toString(36)}`;
}

/**
 * Parcours infini — modèle de navigation général (spec §16, remplace
 * « une scène = un écran plein ») : un seul flux scrollable contient tout
 * l'historique de la run ; les choix restent ancrés en bas, toujours visibles.
 * Le dé (Figma 124:2178) reste un overlay par-dessus tout — n'apparaît qu'au
 * clic d'un choix risqué (décision Patrick, voir CLAUDE.md).
 */
export default function Scene() {
  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roll, setRoll] = useState<RollRequest | null>(null);
  const [day, setDay] = useState(1);
  const [health, setHealth] = useState(1);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  // File de révélation séquentielle : les blocs de texte (narration/Geôlier)
  // tapent l'un après l'autre, jamais tous en même temps (§16 « beats enchaînés »).
  const [activeTypingId, setActiveTypingIdState] = useState<string | null>(null);
  const activeTypingIdRef = useRef<string | null>(null);
  const revealQueueRef = useRef<string[]>([]);
  // Un id entre ici dès qu'il a commencé à se révéler (actif ou déjà fini).
  // Tant qu'une entrée narration/Geôlier n'y est pas, elle reste invisible :
  // sinon son texte complet apparaîtrait d'un coup avant même son tour.
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const revealedIdsRef = useRef<Set<string>>(new Set());
  // Les choix se cachent dès qu'on en tape un, pour mettre en avant la
  // description, et reviennent une fois tout le texte de la file écrit.
  const [choicesHidden, setChoicesHidden] = useState(false);
  // Incrémenté à chaque tap dans le fil : termine l'animation de frappe en cours.
  const [skip, setSkip] = useState(0);
  // Écran de mort (13/07) : non-null dès que la santé tombe à zéro sur un
  // jet raté. La run est déjà réinitialisée quand cet état est posé.
  const [death, setDeath] = useState<{ epitaph: string; day: number; encounters: number; relic: Relic } | null>(null);
  // Scène chronométrée (§18) : true une fois le délai écoulé sans choix — les
  // choix d'origine cèdent la place aux options ouvertes par l'inaction.
  const [timedExpired, setTimedExpired] = useState(false);
  // Armé quand le compte à rebours d'une scène chronométrée court (pour l'UI).
  const [countdownArmed, setCountdownArmed] = useState(false);
  const runRef = useRef<RunState | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  function setActiveTypingId(id: string | null) {
    activeTypingIdRef.current = id;
    setActiveTypingIdState(id);
  }
  function markRevealed(ids: string[]) {
    const next = new Set(revealedIdsRef.current);
    ids.forEach((id) => next.add(id));
    revealedIdsRef.current = next;
    setRevealedIds(next);
  }
  function advanceRevealQueue() {
    const next = revealQueueRef.current.shift() ?? null;
    if (next) markRevealed([next]);
    setActiveTypingId(next);
    // Tout le texte en attente est écrit : les choix peuvent réapparaître.
    if (next === null) setChoicesHidden(false);
  }
  function enqueueReveal(ids: string[]) {
    if (ids.length === 0) return;
    revealQueueRef.current.push(...ids);
    if (!activeTypingIdRef.current) advanceRevealQueue();
  }
  function onTypedDone(id: string) {
    if (activeTypingIdRef.current !== id) return;
    advanceRevealQueue();
  }

  const scene = sceneAt(step);
  const rolling = roll !== null;

  // Sur une scène chronométrée expirée (§18), les choix d'origine cèdent la
  // place aux options ouvertes par l'inaction.
  const baseChoices = timedExpired && scene.timed ? scene.timed.timeoutChoices : scene.choices;

  // La position à l'écran ne doit jamais prédire le type de choix (CLAUDE.md) :
  // Fisher-Yates seedé par le pas de progression — stable au re-render et à la
  // reprise de run. La scène 0 garde l'ordre exact de la frame Figma.
  const shuffledChoices = useMemo(() => {
    const arr = [...baseChoices];
    if (step === 0) return arr;
    let seed = (step * 9301 + 49297) >>> 0;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [baseChoices, step]);

  // Reprise de run : fermer l'app ne compte jamais comme une mort. Le fil
  // complet est persisté, donc la reprise restaure aussi le scrollback exact.
  useEffect(() => {
    const run = loadRun();
    runRef.current = run;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration unique post-hydratation
    if (run.step > 0) setStep(run.step);
    setDay(run.day);
    setHealth(run.health);
    if (run.feed.length > 0) {
      setFeed(run.feed);
      // Historique repris : tout est déjà « lu », rien à mettre en file d'attente.
      markRevealed(run.feed.map((e) => e.id));
    } else {
      // Run neuve : on l'inscrit dans la mémoire du joueur (§17, saisons du
      // Geôlier + décompte des tentatives).
      const mem = mutateMemory((m) => {
        m.runsStarted += 1;
      });
      const opening = sceneAt(0);
      const openingNarration = [...opening.narration];
      // Persistance environnementale (§17) : si le joueur a déjà défoncé la
      // porte balafrée dans une run précédente, elle porte encore la trace —
      // le décor accumule les tentatives, pas seulement la dernière.
      if (mem.envFlags["porte-balafree-defoncee"]) {
        openingNarration.push(
          "La porte balafrée, tu la reconnais : c'est déjà arrivé qu'on la " +
            "défonce, un autre jour, un autre toi. Le bois éclaté n'a pas " +
            "repoussé. Quelque chose s'en souvient aussi."
        );
      }
      const seeded: FeedEntry[] = [
        { id: nextId(), kind: "illustration", src: opening.illustration ?? "assets/dithering-portal.jpg" },
        { id: nextId(), kind: "day", day: run.day },
        ...openingNarration.map((text): FeedEntry => ({ id: nextId(), kind: "narration", text })),
      ];
      setFeed(seeded);
      enqueueReveal(seeded.filter((e) => e.kind === "narration").map((e) => e.id));
      run.feed = seeded;
      saveRun(run);
    }
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Le nouveau contenu doit toujours être visible ; l'historique reste scrollable
  // au-dessus. Se redéclenche aussi à chaque bloc révélé (pas seulement à l'ajout
  // au fil, puisqu'une entrée en file d'attente n'occupe pas encore d'espace).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [feed.length, revealedIds]);

  /**
   * La scène qui se résout sans toi (§18) : le délai s'écoule sans choix. Ce
   * n'est PAS un échec automatique — la situation évolue et ouvre de nouvelles
   * options (`timeoutChoices`). L'inaction devient elle-même un choix.
   */
  function onTimedExpire(timed: NonNullable<ReturnType<typeof sceneAt>["timed"]>) {
    setCountdownArmed(false);
    setTimedExpired(true);
    setChoicesHidden(true);
    const id = nextId();
    pushEntries([{ id, kind: "narration", text: timed.timeoutNarration }]);
    enqueueReveal([id]);
  }

  // Scène chronométrée (§18) : le compte à rebours ne démarre que lorsque les
  // choix d'origine sont réellement visibles et jouables (texte fini de taper,
  // pas de dé en cours, pas encore de choix fait). S'il s'écoule, l'inaction
  // ouvre de nouvelles options via onTimedExpire.
  useEffect(() => {
    if (timedTimer.current) {
      clearTimeout(timedTimer.current);
      timedTimer.current = null;
    }
    const timed = scene.timed;
    const canRun = !!timed && !timedExpired && !choicesHidden && !selectedId && !rolling;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflète l'état d'armement du compte à rebours dans l'UI, synchronisé au cycle de la scène
    setCountdownArmed(canRun);
    if (canRun && timed) {
      timedTimer.current = setTimeout(() => onTimedExpire(timed), timed.ms);
    }
    return () => {
      if (timedTimer.current) {
        clearTimeout(timedTimer.current);
        timedTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, step, choicesHidden, selectedId, rolling, timedExpired]);

  function persist(mutate: (run: RunState) => void) {
    const run = runRef.current ?? loadRun();
    mutate(run);
    runRef.current = run;
    saveRun(run);
  }

  function pushEntries(entries: FeedEntry[]) {
    setFeed((f) => {
      const next = [...f, ...entries];
      persist((run) => {
        run.feed = next;
      });
      return next;
    });
  }

  /**
   * Scène suivante ajoutée au fil : illustration sur vrai changement de
   * contexte (spec §11), ou de temps en temps même sans changement, pour
   * rythmer le fil (placeholder en attendant les assets par contexte).
   * Narration en plusieurs paragraphes courts, puis le Geôlier — rare,
   * réservé aux jets critiques et à quelques scènes tirées au sort (spec §12,
   * "un cran au-dessus du strict minimum", pas à chaque échec).
   * Les états narratifs temporaires se dissipent scène après scène (spec §2).
   */
  function advance(rollInfo?: {
    result?: number;
    fail?: boolean;
    consequence?: string;
    /** Récompense Besace d'un Destin (13/07) — annoncée dans le fil. */
    destinItem?: BesaceItem | null;
  }) {
    const nextStep = step + 1;
    const nextScene = sceneAt(nextStep);
    const nextIllustration = nextScene.illustration ?? "assets/dithering-portal.jpg";
    const lastIllustration = [...feed].reverse().find((e): e is Extract<FeedEntry, { kind: "illustration" }> => e.kind === "illustration");
    const contextChanged = !lastIllustration || lastIllustration.src !== nextIllustration;
    const entries: FeedEntry[] = [];
    // La conséquence du jet (texte de l'issue) précède la mise en place de la scène suivante.
    if (rollInfo?.consequence) {
      entries.push({ id: nextId(), kind: "narration", text: rollInfo.consequence });
    }
    // Récompense du Destin : bandeau « Obtenu » juste après la conséquence.
    if (rollInfo?.destinItem) {
      const it = rollInfo.destinItem;
      entries.push({ id: nextId(), kind: "obtenu", name: it.name, rarity: RARITY_LABEL[it.rarity as BesaceRarity], flavor: it.flavor });
    }
    // Prix différé (§17) : une dette arrivée à échéance se règle ici, avant la
    // scène suivante — rétrospectivement lisible dans le transcript.
    const dueDebts = (runRef.current?.debts ?? []).filter((d) => d.settleAtStep <= nextStep);
    for (const d of dueDebts) {
      entries.push({ id: nextId(), kind: "narration", text: d.text });
    }
    // Rencontre de combat (spec §6) : annonce AVANT l'illustration (ordre
    // Figma 221:197), pour que l'adversaire soit LISIBLE — le mécanisme
    // reste identique (pas de PV, pas de jauge).
    if (nextScene.combat && nextScene.foeName) {
      entries.push({ id: nextId(), kind: "combat", foe: nextScene.foeName });
    }
    // Illustration : changement de contexte, ou ~1 fois sur 4 pour rythmer le fil.
    if (contextChanged || Math.random() < 0.25) {
      entries.push({ id: nextId(), kind: "illustration", src: nextIllustration });
    }
    // Dette de sang (§19) : si cet adversaire a déjà tué un héros du joueur,
    // il le reconnaît — une ligne discrète avant la scène, jamais un chiffre.
    if (nextScene.foe) {
      const debt = bloodDebtFor(loadMemory(), nextScene.foe);
      if (debt) {
        entries.push({
          id: nextId(),
          kind: "narration",
          text:
            "Cette créature… quelque chose en elle te reconnaît. Elle a déjà " +
            `goûté au sang d'un des tiens — ${debt.heroName}, tombé ici avant ` +
            "toi. Elle n'a pas oublié. Toi non plus, maintenant.",
        });
      }
    }
    entries.push(...nextScene.narration.map((text): FeedEntry => ({ id: nextId(), kind: "narration", text })));
    // Soin aléatoire en exploration (13/07) : les scènes hors combat révèlent
    // parfois (~1 sur 5) un soin mineur pour la Besace — jamais garanti,
    // jamais un menu d'achat. Bandeau « Obtenu » tramé, pas de popup.
    const besace = runRef.current?.besace ?? [];
    if (
      !nextScene.combat &&
      !nextScene.registre &&
      nextScene.id !== "campement" &&
      besace.length < BESACE_SLOTS &&
      Math.random() < 0.22
    ) {
      const found = randomSoinMineur();
      persist((run) => {
        run.besace = [...run.besace, found];
      });
      entries.push({ id: nextId(), kind: "obtenu", name: found.name, rarity: RARITY_LABEL[found.rarity as BesaceRarity], flavor: found.flavor });
    }
    // Le Grand Registre (§19) : en entrant dans la salle, le classement
    // s'affiche inline dans le fil, avec la ligne du joueur insérée et marquée.
    if (nextScene.registre) {
      const run = runRef.current;
      const rows = buildRegistre(loadMemory(), run?.heroName ?? "toi", run?.day ?? 1);
      entries.push({ id: nextId(), kind: "registre", rows });
    }
    const result = rollInfo?.result;
    if (result === 1 || result === 20) {
      // Saisons du Geôlier (§17) : le ton du taunt critique dépend de la
      // posture, elle-même dérivée de l'historique agrégé du joueur.
      const posture = jailerPosture(loadMemory());
      entries.push({ id: nextId(), kind: "jailer", text: jailerTaunt(result, posture) });
    } else if (Math.random() < 0.12) {
      entries.push({ id: nextId(), kind: "jailer", text: nextScene.jailerLine });
    }
    setStep(nextStep);
    persist((run) => {
      run.step = nextStep;
      run.lastChoiceId = null;
      run.effects = run.effects
        .map((e) => ({ ...e, scenesLeft: e.scenesLeft - 1 }))
        .filter((e) => e.scenesLeft > 0);
      // Dettes réglées : retirées de la run (§17).
      run.debts = (run.debts ?? []).filter((d) => d.settleAtStep > nextStep);
      // Rencontre traversée vivant — comptée pour l'écran de mort (13/07).
      if (scene.combat) run.encounters = (run.encounters ?? 0) + 1;
    });
    pushEntries(entries);
    // Révélation séquentielle : narration(s) puis Geôlier, jamais tous en même temps.
    enqueueReveal(entries.filter((e) => e.kind === "narration" || e.kind === "jailer").map((e) => e.id));
    setSelectedId(null);
    setRoll(null);
    // Nouvelle scène : on réarme la mécanique chronométrée (§18).
    setTimedExpired(false);
  }

  function onSelect(choice: Choice) {
    if (choice.locked || rolling || selectedId) return;
    setSelectedId(choice.id);
    setChoicesHidden(true);
    persist((run) => {
      run.lastChoiceId = choice.id;
    });
    // L'action choisie s'affiche dans le fil AVANT sa conséquence (spec §16).
    pushEntries([{ id: nextId(), kind: "chosen", label: choice.label }]);

    // Persistance environnementale (§17) : défoncer la porte balafrée laisse
    // une trace durable, relue à l'ouverture des runs suivantes.
    if (choice.setsEnvFlag) {
      const flag = choice.setsEnvFlag;
      mutateMemory((m) => {
        m.envFlags[flag] = true;
      });
    }
    // Prix différé (§17) : un choix « gratuit » peut poser une dette silencieuse
    // qui se règle plus tard dans la run (au bout de N pas de progression).
    if (choice.debt) {
      const debt = choice.debt;
      persist((run) => {
        run.debts = [...(run.debts ?? []), { id: debt.id, settleAtStep: step + debt.settleInSteps, text: debt.text }];
      });
    }

    if (choice.risky) {
      // Armement du dé (spec §4) : voile + hint contextuel, le dé devient saisissable.
      const effects = runRef.current?.effects ?? [];
      const modifier = effects.reduce((sum, e) => sum + e.delta, 0);
      setRoll({
        key: Date.now(),
        stat: choice.risky.stat,
        threshold: choice.risky.threshold,
        outcomes: choice.risky.outcomes,
        modifier,
        effectLabel: effects[0]?.label,
        // La main qui hésite (§18) : sur un jet à fort enjeu, le dé traîne/tremble
        // avant de s'immobiliser — purement visuel, n'affecte jamais le résultat.
        highStakes: choice.risky.highStakes,
      });
    } else if (choice.rest) {
      // Campement (spec §7, précisé 13/07) : le jour avance, les blessures
      // légères s'atténuent — mais un ENTAILLÉ persistant (blessure de
      // combat) n'est qu'ATTÉNUÉ par le repos. Un soin de Besace, lui, le
      // referme complètement (consommé ici, en attendant l'UI d'inventaire).
      let soinUsed: string | null = null;
      persist((run) => {
        run.day += 1;
        run.health = Math.min(1, run.health + 0.35);
        run.effects = run.effects
          .filter((e) => e.delta > 0 || e.scenesLeft >= 900)
          .map((e) => (e.scenesLeft >= 900 && e.delta < -1 ? { ...e, delta: -1 } : e));
        const soinIdx = run.besace.findIndex((i) => i.kind === "soin");
        if (soinIdx >= 0 && run.effects.some((e) => e.delta < 0)) {
          soinUsed = run.besace[soinIdx].name;
          run.besace = run.besace.filter((_, i) => i !== soinIdx);
          run.effects = run.effects.filter((e) => e.delta > 0);
          run.health = Math.min(1, run.health + 0.2);
        }
      });
      const newDay = runRef.current?.day ?? day + 1;
      setDay(newDay);
      setHealth(runRef.current?.health ?? 1);
      // Survie enregistrée au compte (§17) : le plus grand jour atteint nourrit
      // la posture du Geôlier sans jamais être affiché comme un score.
      mutateMemory((m) => {
        m.bestDays = Math.max(m.bestDays, newDay);
      });
      const restEntries: FeedEntry[] = [{ id: nextId(), kind: "day", day: newDay }];
      if (soinUsed) {
        restEntries.push({
          id: nextId(),
          kind: "narration",
          text: `Avant de dormir, tu uses du ${soinUsed}. La plaie se referme enfin — la nuit n'aura pas ce prétexte.`,
        });
      }
      pushEntries(restEntries);
      if (soinUsed) enqueueReveal([restEntries[1].id]);
      advanceTimer.current = setTimeout(() => advance(), 450);
    } else if (choice.passive) {
      // Le silence comme vraie option de jeu (§19) : pas une case vide — une
      // conséquence dédiée, écrite en réaction à l'inaction choisie.
      advanceTimer.current = setTimeout(() => advance({ consequence: choice.passive!.consequence }), 450);
    } else {
      // Choix neutre : résolution instantanée, sans dé (spec §4).
      advanceTimer.current = setTimeout(() => advance(), 450);
    }
  }

  // Paliers de santé discrets (spec §5, validé 11/07) : Intact · Marqué ·
  // Entaillé · Au seuil — jamais un dégradé continu.
  const erosion = health < 0.25 ? 3 : health < 0.5 ? 2 : health < 0.75 ? 1 : 0;

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        className={`phone-frame relative flex h-[800px] w-[390px] shrink-0 flex-col overflow-clip bg-[var(--color-bg)] ${
          erosion ? `erosion-${erosion}` : ""
        }`}
      >
        {/* En-tête (Figma 221:197) : titre de chapitre à gauche, icône de menu
            unique à droite, même position sur tous les écrans (spec §8) */}
        <div className="relative z-[3] flex items-center justify-between px-[15px] py-[11px]">
          <span className="text-[12px] font-medium uppercase tracking-[2.4px] text-[var(--color-ink)]">
            {chapterLabel(step)}
          </span>
          <button
            type="button"
            aria-label="Menu"
            className="grid size-[41px] cursor-pointer grid-cols-3 place-items-center border border-solid border-[var(--color-ink)] bg-[var(--color-bg)] p-[11px]"
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="block size-[1.6px] bg-[var(--color-ink)]" />
            ))}
          </button>
        </div>

        {/* Flux scrollable — tout l'historique de la run, rien ne se décharge (spec §16).
            Pendant que le dé est actif, le fil ne capte plus les taps : sinon le
            tap qui arme/dismiss le dé fait aussi défiler du texte pas encore écrit. */}
        <div
          ref={scrollRef}
          onPointerDown={() => setSkip((s) => s + 1)}
          className={`relative flex-1 overflow-y-auto px-[17px] ${rolling ? "pointer-events-none" : ""}`}
        >
          {feed.map((entry) => (
            <FeedItem
              key={entry.id}
              entry={entry}
              typed={entry.id === activeTypingId}
              revealed={revealedIds.has(entry.id)}
              skip={skip}
              onDone={() => onTypedDone(entry.id)}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Scène chronométrée (§18) : compte à rebours VISUEL — une jauge qui
            s'érode vite, jamais un timer chiffré. Cohérent avec le langage de
            la santé. Disparaît dès qu'un choix est fait ou le délai écoulé. */}
        {countdownArmed && scene.timed && (
          <div className="timed-countdown relative z-[3]" aria-hidden>
            <div
              className="timed-countdown-fill"
              style={{ ["--timed-ms" as string]: `${scene.timed.ms}ms` }}
            />
          </div>
        )}

        {/* Choix ancrés en bas (spec §16), mais masqués le temps que la
            conséquence + la scène suivante finissent de s'écrire — pour
            mettre en avant la description — puis réaffichés (décision
            Patrick 11/07, priorité sur "toujours visibles"). Pendant le
            lancer, ils ne captent plus les événements — sinon un bouton
            disabled avale la saisie du dé qui le chevauche. */}
        <div
          className={`choices-bar relative z-[3] flex w-full flex-col gap-[10px] border-t border-[var(--color-ink)]/15 px-[15px] py-[15px] ${
            rolling ? "pointer-events-none" : ""
          } ${choicesHidden ? "choices-hidden" : ""}`}
        >
          {shuffledChoices.map((choice) => (
            <ChoiceButton
              key={scene.id + choice.id + step}
              choice={choice}
              selected={selectedId === choice.id}
              raised={rolling && selectedId === choice.id}
              erosion={erosion}
              onSelect={onSelect}
            />
          ))}
        </div>

        {/* Dé d20 tactile — apparaît au clic d'un choix risqué */}
        <Die3D
          request={roll}
          onComplete={(result, outcome, tier) => {
            // Récompense du Destin (13/07) : Besace rare à légendaire — JAMAIS une Relique.
            const destinItem = tier === "destin" ? randomRecompenseDestin() : null;
            persist((run) => {
              run.rolls.push({
                step,
                choiceId: selectedId ?? "roll",
                result,
                at: Date.now(),
              });
              // Santé par palier (résolution graduée 13/07) — jamais de chiffre,
              // l'UI s'érode (spec §5). « De justesse » : ça passe, mais un coût.
              const cost =
                tier === "malediction" ? 0.25 : tier === "critique" ? 0.2 : tier === "echec" ? 0.12 : tier === "justesse" ? 0.06 : 0;
              run.health = Math.max(0, run.health - cost);
              // États narratifs temporaires (spec §2) + blessure persistante (13/07) :
              // un jet raté EN COMBAT laisse un ENTAILLÉ qui ne se dissipe pas
              // tout seul — le camp l'atténue, un soin de Besace le referme.
              if (tier === "destin" || (scene.combat && !tierIsFail(tier)))
                run.effects = [
                  { id: "aguerri", label: "AGUERRI", delta: 2, scenesLeft: 3 },
                  ...run.effects.filter((e) => e.id !== "aguerri"),
                ];
              if (scene.combat && tierIsFail(tier))
                run.effects = [
                  { id: "entaille", label: "ENTAILLÉ", delta: -2, scenesLeft: 999 },
                  ...run.effects.filter((e) => e.id !== "entaille"),
                ];
              else if (tier === "malediction")
                run.effects = [
                  { id: "entaille", label: "ENTAILLÉ", delta: -2, scenesLeft: 3 },
                  ...run.effects.filter((e) => e.id !== "entaille"),
                ];
              if (destinItem) run.besace = [...run.besace, destinItem];
            });
            const run = runRef.current!;
            setHealth(run.health);

            // Permadeath réel (spec §9 + séquence 13/07) : la santé à zéro sur
            // un jet raté tue — dans la fiction, jamais par accident technique.
            if (run.health <= 0 && tierIsFail(tier)) {
              const epitaph = outcome.text.replace(/\s*♦.*$/, "");
              const cause = scene.foeName ?? "les couloirs d'Aldenhar";
              const relic = recordDeath({
                heroName: run.heroName,
                days: run.day,
                cause,
                place: scene.id,
                killer: scene.foe ? { entity: scene.foe, label: scene.foeName ?? scene.foe } : undefined,
              });
              // La run est réinitialisée IMMÉDIATEMENT : fermer l'app pendant
              // l'écran de mort ne ressuscite jamais le héros.
              const dead = { epitaph, day: run.day, encounters: run.encounters, relic };
              resetRun();
              setDeath(dead);
              return;
            }
            advance({ result, fail: outcome.fail, consequence: outcome.text, destinItem });
          }}
        />

        {/* Écran de mort (13/07) : dé brisé → épitaphe → dissolution
            convergente → chiffres → Relique → recommencer. */}
        {death && (
          <DeathScreen
            epitaph={death.epitaph}
            day={death.day}
            encounters={death.encounters}
            relic={death.relic}
            onRestart={() => window.location.reload()}
          />
        )}
      </div>
    </main>
  );
}

function FeedItem({
  entry,
  typed,
  revealed,
  skip,
  onDone,
}: {
  entry: FeedEntry;
  typed: boolean;
  /** Narration/Geôlier : encore en file d'attente tant que false — invisible. */
  revealed: boolean;
  skip: number;
  onDone: () => void;
}) {
  // Masque tramé du portrait du Geôlier : calculé une fois côté client (canvas),
  // avant le retour anticipé ci-dessous — les hooks doivent s'exécuter dans le
  // même ordre à chaque rendu, quel que soit le type d'entrée.
  const [demonMask, setDemonMask] = useState<string | null>(() =>
    typeof document !== "undefined" ? demonMaskCache : null
  );
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- calcul canvas côté client une seule fois (impossible au premier rendu SSR), mis en cache au niveau module ensuite
    if (!demonMask) setDemonMask(getDemonMask());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Le fil respecte l'ordre des beats : un bloc de texte pas encore atteint
  // dans la file de révélation séquentielle ne doit rien laisser paraître.
  if ((entry.kind === "narration" || entry.kind === "jailer") && !revealed) return null;

  switch (entry.kind) {
    case "illustration":
      // Bord bas dissous en pixels (correctif Patrick 13/07) : la bande
      // bande_dissolution_haut.svg retournée verticalement (scaleY(-1)),
      // jamais un dégradé CSS lisse (§11).
      return (
        <div className="scene-enter illustration-frame mx-[-17px] mb-[18px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={entry.src} className="pointer-events-none block h-[352px] w-full object-cover" />
          <div
            className="dissolve-bottom"
            style={{ backgroundImage: 'url("assets/bande_dissolution_haut.svg")' }}
            aria-hidden
          />
        </div>
      );
    case "day":
      return (
        <p className="scene-enter mb-[18px] text-center text-[11px] uppercase tracking-[1.2px] text-[var(--color-ink)] opacity-50 [--enter-opacity:0.5]">
          — Jour {entry.day} —
        </p>
      );
    case "chosen":
      // Action choisie à 50% d'opacité pour la distinguer du texte narratif
      // (retour Patrick 13/07) : la variable --enter-opacity est nécessaire
      // car l'animation d'entrée fige sa dernière frame par-dessus la classe.
      return (
        <p className="scene-enter mb-[14px] text-[13px] text-[var(--color-ink)] opacity-50 [--enter-opacity:0.5]">
          › {entry.label}
        </p>
      );
    case "jailer":
      // Bloc redessiné (Figma 239:49164, 13/07) : bandeau orange de 87px,
      // portrait 101×119 qui déborde en haut/gauche, et des FRANGES de pixels
      // charbon qui rongent les bords haut et bas du bloc. Ces franges
      // scintillent uniquement pendant que le Geôlier parle (texte en cours
      // de frappe), puis se figent — jamais un effet permanent (correctif
      // Patrick 13/07). Le texte reste toujours au-dessus du portrait.
      return (
        <div
          className={`scene-enter jailer-banner mx-[-17px] mb-[18px] mt-[15px] relative flex min-h-[87px] items-center bg-[var(--color-accent)] pl-[123px] pr-[22px] py-[14px] ${
            typed ? "jailer-speaking" : ""
          }`}
        >
          <span
            className="jailer-fringe jailer-fringe-top"
            style={{ backgroundImage: 'url("assets/frange_geolier.svg")' }}
            aria-hidden
          />
          <span
            className="jailer-fringe jailer-fringe-bottom"
            style={{ backgroundImage: 'url("assets/frange_geolier.svg")' }}
            aria-hidden
          />
          <div className="jailer-portrait pointer-events-none absolute top-[-15px] left-[-3px] z-0 h-[119px] w-[101px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              src="assets/dithering-demon.jpg"
              className="block h-full w-full -scale-x-100 object-cover"
              style={
                demonMask
                  ? {
                      WebkitMaskImage: `url(${demonMask})`,
                      maskImage: `url(${demonMask})`,
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskSize: "100% 100%",
                      maskSize: "100% 100%",
                    }
                  : undefined
              }
            />
          </div>
          <p className="relative z-[1] text-[13px] font-bold leading-[1.45] text-[var(--color-bg)]">
            <TypedText text={entry.text} typed={typed} skip={skip} msPerChar={22} onDone={onDone} />
          </p>
        </div>
      );
    case "narration":
      return (
        <p className="scene-enter mb-[18px] text-[13px] leading-[1.3] text-[var(--color-ink)]">
          <TypedText text={entry.text} typed={typed} skip={skip} msPerChar={15} onDone={onDone} />
        </p>
      );
    case "combat":
      // Bannière de rencontre (Figma 221:197, redesign 13/07) : sans cadre —
      // tag centré + nom de l'adversaire en grand Jacquard orange, juste
      // avant l'illustration. Le combat reste la même mécanique choix + dé.
      return (
        <div className="scene-enter combat-banner mb-[14px] mt-[6px]" role="note">
          <span className="combat-banner-tag">✦ RENCONTRE ✦</span>
          <span className="combat-banner-foe">{entry.foe}</span>
        </div>
      );
    case "obtenu":
      // Objet mineur (13/07) : bandeau tramé inline — jamais une popup.
      return (
        <div className="scene-enter obtenu-banner mb-[18px]">
          <span className="obtenu-line">
            Obtenu — {entry.name} · {entry.rarity}
          </span>
          <span className="obtenu-flavor">{entry.flavor}</span>
        </div>
      );
    case "registre":
      // Le Grand Registre (§19) : classement défilant inline, la ligne du
      // joueur marquée en accent — un lieu traversé, pas un menu de stats.
      return (
        <div className="scene-enter registre mx-[-17px] mb-[18px]">
          <p className="registre-head">— LE GRAND REGISTRE —</p>
          <div className="registre-list">
            {entry.rows.map((r) => (
              <div key={`${r.rank}-${r.name}`} className={`registre-row ${r.isPlayer ? "is-player" : ""}`}>
                <span className="registre-rank">{r.rank}</span>
                <span className="registre-name">{r.name}</span>
                <span className="registre-days">J{r.days}</span>
                <span className="registre-cause">{r.cause}</span>
              </div>
            ))}
          </div>
        </div>
      );
  }
}
