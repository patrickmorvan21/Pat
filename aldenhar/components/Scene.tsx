"use client";

import { useEffect, useRef, useState } from "react";
import Die3D, { type RollRequest } from "@/components/Die3D";
import ChoiceButton from "@/components/ChoiceButton";
import TypedText from "@/components/TypedText";
import DeathScreen from "@/components/DeathScreen";
import GameMenu from "@/components/GameMenu";
import { jailerTaunt, sceneAt, tierIsFail, type Choice } from "@/lib/scene-data";
import { loadRun, resetRun, saveRun, type FeedEntry, type RunState } from "@/lib/state";
import { BESACE_SLOTS, randomRecompenseDestin, randomSoinMineur, RARITY_LABEL, type BesaceItem, type BesaceRarity } from "@/lib/besace";
import {
  bloodDebtFor,
  buildRegistre,
  jailerPosture,
  loadMemory,
  mutateMemory,
  recordDeath,
  type Relic,
} from "@/lib/player-memory";

// Pixels morts ambiants de l'état KO (palier « Au seuil », retour Patrick
// 14/07) : une nappe de pixels charbon épars + quelques braises orange qui
// scintillent sur tout l'écran — la mort se sent, sans jamais un chiffre.
// Générée une fois côté client, cachée au niveau module.
let decayCache: string | null = null;
function getDecayOverlay(): string | null {
  if (typeof document === "undefined") return null;
  if (!decayCache) {
    const W = 390,
      H = 800;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    let seed = 0xdead;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    ctx.fillStyle = "#1c1a16";
    for (let i = 0; i < 780; i++) {
      const s = rnd() < 0.7 ? 2 : 3;
      ctx.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H), s, s);
    }
    ctx.fillStyle = "#e0632a";
    for (let i = 0; i < 90; i++) {
      ctx.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H), rnd() < 0.8 ? 1 : 2, rnd() < 0.8 ? 1 : 2);
    }
    decayCache = c.toDataURL();
  }
  return decayCache;
}

let uidCounter = 0;
function nextId() {
  uidCounter += 1;
  return `e${uidCounter}-${Date.now().toString(36)}`;
}

const PORTAL = "assets/dithering-portal.jpg";

// Image d'objet obtenu : le haut d'écran bascule sur l'objet quand une action
// en fait gagner un (demande Patrick 19/07). Jeu d'icônes génériques par type
// en attendant des illustrations d'objet dédiées (même convention que le menu
// Inventaire : arme=dague, soin=crâne, babiole=masque).
function objectImage(kind: BesaceItem["kind"]): string {
  if (kind === "arme") return "assets/objet_dague.png";
  if (kind === "babiole") return "assets/objet_masque.png";
  return "assets/objet_crane.png";
}

type ImageKind = "scene" | "object";

// La position à l'écran ne doit jamais prédire le type de choix (CLAUDE.md) :
// Fisher-Yates seedé par le pas de progression (stable au re-render et à la
// reprise). La scène 0 garde l'ordre exact de la frame Figma.
function shuffleChoices<T>(choices: T[], step: number): T[] {
  const arr = [...choices];
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
}

/**
 * Modèle ÉCRAN PAR ÉCRAN (retour Patrick 19/07, maquette Figma 2072:54 —
 * remplace le flux scrollable §16). Un seul écran par scène :
 *   • illustration calée en haut (fixe) ;
 *   • texte de narration au milieu (se tape, défile SEULEMENT s'il dépasse) ;
 *   • bloc Geôlier dans le flux quand il parle ;
 *   • CTA ancrés en bas (fixes, adaptés à la hauteur du device), qui
 *     n'apparaissent qu'une fois le texte tapé à 100 %.
 * L'IMAGE ne change QUE si le contexte change (nouvelle scène) ou si un objet
 * est obtenu ; sinon elle reste et seul le texte change. Pas d'historique
 * accumulé : chaque écran remplace le précédent (fondu). Le dé, la santé, le
 * menu, la mort, les scènes chronométrées, les bannières et le Registre sont
 * conservés à l'identique.
 */
export default function Scene() {
  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roll, setRoll] = useState<RollRequest | null>(null);
  const [day, setDay] = useState(1);
  const [health, setHealth] = useState(1);
  // Contenu du SEUL écran courant (remplacé à chaque scène) — jamais tout
  // l'historique. Pas d'entrée `illustration`/`chosen` ici : l'image est un
  // état séparé, et l'action choisie n'est plus ré-affichée (écran par écran).
  const [beats, setBeats] = useState<FeedEntry[]>([]);
  const [image, setImage] = useState<string>(PORTAL);
  const [imageKind, setImageKind] = useState<ImageKind>("scene");
  // Dernière illustration de SCÈNE (repos de l'image). L'image d'objet n'est
  // qu'un remplacement momentané ; on revient toujours à cette scène-là.
  const lastSceneIlloRef = useRef<string>(PORTAL);
  // File de révélation séquentielle : les blocs de texte (narration/Geôlier)
  // tapent l'un après l'autre, jamais tous en même temps.
  const [activeTypingId, setActiveTypingIdState] = useState<string | null>(null);
  const activeTypingIdRef = useRef<string | null>(null);
  const revealQueueRef = useRef<string[]>([]);
  // Un id entre ici dès qu'il a commencé à se révéler (actif ou déjà fini).
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const revealedIdsRef = useRef<Set<string>>(new Set());
  // Les CTA n'apparaissent qu'une fois tout le texte de l'écran écrit.
  const [choicesHidden, setChoicesHidden] = useState(true);
  // Incrémenté à chaque tap dans la zone de texte : termine la frappe en cours.
  const [skip, setSkip] = useState(0);
  // Écran de mort : non-null dès que la santé tombe à zéro sur un jet raté.
  const [death, setDeath] = useState<{ epitaph: string; day: number; encounters: number; relic: Relic } | null>(null);
  // Scène chronométrée (§18) : true une fois le délai écoulé sans choix.
  const [timedExpired, setTimedExpired] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [countdownArmed, setCountdownArmed] = useState(false);
  const runRef = useRef<RunState | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
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
    // Tout le texte de l'écran est écrit : les CTA peuvent apparaître.
    if (next === null) setChoicesHidden(false);
  }
  function enqueueReveal(ids: string[]) {
    if (ids.length === 0) {
      setChoicesHidden(false);
      return;
    }
    revealQueueRef.current.push(...ids);
    if (!activeTypingIdRef.current) advanceRevealQueue();
  }
  function onTypedDone(id: string) {
    if (activeTypingIdRef.current !== id) return;
    // Suivi du bas UNIQUEMENT en fin de paragraphe (jamais pendant la frappe,
    // correctif 14/07), et confiné à la zone de texte (l'image + les CTA
    // restent fixes).
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    advanceRevealQueue();
  }

  const scene = sceneAt(step);
  const rolling = roll !== null;

  const baseChoices = timedExpired && scene.timed ? scene.timed.timeoutChoices : scene.choices;
  const shuffledChoices = shuffleChoices(baseChoices, step);

  function persist(mutate: (run: RunState) => void) {
    const run = runRef.current ?? loadRun();
    mutate(run);
    runRef.current = run;
    saveRun(run);
  }

  /** Pose un nouvel écran : remplace le texte, (ré)arme la révélation, masque
      les CTA le temps de la frappe. L'image n'est touchée que si `img` est
      fourni (sinon elle reste — « même scène, seul le texte change »). */
  function showScreen(entries: FeedEntry[], img?: { src: string; kind: ImageKind }) {
    if (img) {
      setImage(img.src);
      setImageKind(img.kind);
    }
    revealedIdsRef.current = new Set();
    setRevealedIds(new Set());
    revealQueueRef.current = [];
    setActiveTypingId(null);
    setChoicesHidden(true);
    setBeats(entries);
    persist((run) => {
      // Persisté pour la reprise : run.feed = écran courant (petit), ce qui
      // garde aussi hasSavedRun() vrai dès la 1re scène (feed non vide).
      run.feed = entries;
    });
    enqueueReveal(entries.filter((e) => e.kind === "narration" || e.kind === "jailer").map((e) => e.id));
  }

  // Reprise de run : fermer l'app ne compte jamais comme une mort. On restaure
  // l'écran COURANT (scène, jour, santé, états) — pas un scrollback complet.
  useEffect(() => {
    const run = loadRun();
    runRef.current = run;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration unique post-hydratation
    if (run.step > 0) setStep(run.step);
    setDay(run.day);
    setHealth(run.health);

    const hasRun = run.step > 0 || (Array.isArray(run.feed) && run.feed.length > 0);
    if (hasRun) {
      // Écran courant reconstruit à neuf depuis la scène en cours (l'ancien
      // format « fil complet » n'est jamais réaffiché). La conséquence
      // transitoire du dernier choix est perdue — sans importance à la reprise.
      const cur = sceneAt(run.step);
      const illo = cur.illustration ?? PORTAL;
      lastSceneIlloRef.current = illo;
      setImage(illo);
      setImageKind("scene");
      const restored: FeedEntry[] = [];
      if (run.step === 0) restored.push({ id: nextId(), kind: "day", day: run.day });
      restored.push(...cur.narration.map((text): FeedEntry => ({ id: nextId(), kind: "narration", text })));
      setBeats(restored);
      // Déjà lu : tout est révélé d'emblée (affichage instantané), CTA visibles.
      markRevealed(restored.map((e) => e.id));
      setChoicesHidden(false);
      run.feed = restored;
      saveRun(run);
    } else {
      // Run neuve : inscrite dans la mémoire du joueur (§17).
      const mem = mutateMemory((m) => {
        m.runsStarted += 1;
      });
      const opening = sceneAt(0);
      const illo = opening.illustration ?? PORTAL;
      lastSceneIlloRef.current = illo;
      setImage(illo);
      setImageKind("scene");
      const openingNarration = [...opening.narration];
      // Persistance environnementale (§17) : trace des runs précédentes.
      if (mem.envFlags["porte-balafree-defoncee"]) {
        openingNarration.push(
          "La porte balafrée, tu la reconnais : c'est déjà arrivé qu'on la " +
            "défonce, un autre jour, un autre toi. Le bois éclaté n'a pas " +
            "repoussé. Quelque chose s'en souvient aussi."
        );
      }
      const seeded: FeedEntry[] = [
        { id: nextId(), kind: "day", day: run.day },
        ...openingNarration.map((text): FeedEntry => ({ id: nextId(), kind: "narration", text })),
      ];
      // Première apparition du dé = entrée du Jour I (spec prologue 16/07).
      if (run.prologue.done && run.prologue.memories.length > 0) {
        seeded.push({ id: nextId(), kind: "jailer", text: "À partir de maintenant, il décide avec moi." });
      }
      setBeats(seeded);
      revealQueueRef.current = seeded.filter((e) => e.kind === "narration" || e.kind === "jailer").map((e) => e.id);
      advanceRevealQueue();
      run.feed = seeded;
      saveRun(run);
    }
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // À chaque bloc révélé, on garde le bas du texte visible (dans la zone de
  // texte uniquement — l'image et les CTA ne bougent pas).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [revealedIds]);

  function onTimedExpire(timed: NonNullable<ReturnType<typeof sceneAt>["timed"]>) {
    setCountdownArmed(false);
    setTimedExpired(true);
    // L'inaction ouvre de nouvelles options : nouvel écran (même image).
    showScreen([{ id: nextId(), kind: "narration", text: timed.timeoutNarration }]);
  }

  // Scène chronométrée (§18) : le compte à rebours ne démarre que lorsque les
  // choix d'origine sont réellement jouables (texte fini, pas de dé, pas de
  // choix fait).
  useEffect(() => {
    if (timedTimer.current) {
      clearTimeout(timedTimer.current);
      timedTimer.current = null;
    }
    const timed = scene.timed;
    const canRun = !!timed && !timedExpired && !choicesHidden && !activeTypingId && !selectedId && !rolling;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflète l'armement du compte à rebours dans l'UI, synchronisé au cycle de la scène
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
  }, [scene, step, choicesHidden, activeTypingId, selectedId, rolling, timedExpired]);

  /**
   * Scène suivante = NOUVEL écran (remplace le précédent). L'image ne change
   * que si le contexte change (illustration de scène différente) ou si un objet
   * est obtenu ; sinon elle reste. Narration en paragraphes courts, puis le
   * Geôlier (rare). Les états temporaires se dissipent scène après scène (§2).
   */
  function advance(opts?: {
    result?: number;
    fail?: boolean;
    consequence?: string;
    /** Récompense Besace d'un Destin (13/07) — annoncée dans l'écran. */
    destinItem?: BesaceItem | null;
    /** Beats à placer en tête (ex. puce Jour + soin au réveil du campement). */
    prepend?: FeedEntry[];
  }) {
    const nextStep = step + 1;
    const nextScene = sceneAt(nextStep);
    const nextIllustration = nextScene.illustration ?? PORTAL;
    const contextChanged = nextIllustration !== lastSceneIlloRef.current;
    const entries: FeedEntry[] = [];
    let obtainedItem: BesaceItem | null = null;

    if (opts?.prepend) entries.push(...opts.prepend);
    // La conséquence du jet précède la mise en place de la scène suivante.
    if (opts?.consequence) {
      entries.push({ id: nextId(), kind: "narration", text: opts.consequence });
    }
    // Récompense du Destin : bandeau « Obtenu » juste après la conséquence.
    if (opts?.destinItem) {
      const it = opts.destinItem;
      obtainedItem = it;
      entries.push({ id: nextId(), kind: "obtenu", name: it.name, rarity: RARITY_LABEL[it.rarity as BesaceRarity], flavor: it.flavor });
    }
    // Prix différé (§17) : une dette échue se règle ici, avant la scène suivante.
    const dueDebts = (runRef.current?.debts ?? []).filter((d) => d.settleAtStep <= nextStep);
    for (const d of dueDebts) {
      entries.push({ id: nextId(), kind: "narration", text: d.text });
    }
    // Rencontre de combat (spec §6) : annonce AVANT le texte (ordre Figma).
    if (nextScene.combat && nextScene.foeName) {
      entries.push({ id: nextId(), kind: "combat", foe: nextScene.foeName });
    }
    // Dette de sang (§19) : l'adversaire qui a déjà tué un des tiens te reconnaît.
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
    // Soin aléatoire en exploration (13/07) : ~1 scène sur 5 hors combat.
    const besace = runRef.current?.besace ?? [];
    if (
      !nextScene.combat &&
      !nextScene.registre &&
      nextScene.id !== "campement" &&
      besace.length < BESACE_SLOTS &&
      Math.random() < 0.22
    ) {
      const found = randomSoinMineur();
      obtainedItem = found;
      persist((run) => {
        run.besace = [...run.besace, found];
      });
      entries.push({ id: nextId(), kind: "obtenu", name: found.name, rarity: RARITY_LABEL[found.rarity as BesaceRarity], flavor: found.flavor });
    }
    // Le Grand Registre (§19) : classement inline, ligne du joueur marquée.
    if (nextScene.registre) {
      const run = runRef.current;
      const rows = buildRegistre(loadMemory(), run?.heroName ?? "toi", run?.day ?? 1);
      entries.push({ id: nextId(), kind: "registre", rows });
    }
    const result = opts?.result;
    if (result === 1 || result === 20) {
      const posture = jailerPosture(loadMemory());
      entries.push({ id: nextId(), kind: "jailer", text: jailerTaunt(result, posture) });
    } else if (Math.random() < 0.12) {
      entries.push({ id: nextId(), kind: "jailer", text: nextScene.jailerLine });
    }

    // Image du nouvel écran (demande Patrick 19/07) :
    //  • contexte changé → illustration de la nouvelle scène (repos de l'image) ;
    //  • sinon objet obtenu → image de l'objet (remplacement momentané) ;
    //  • sinon → on revient/reste sur l'illustration de scène (l'image ne bouge pas).
    let img: { src: string; kind: ImageKind };
    if (contextChanged) {
      lastSceneIlloRef.current = nextIllustration;
      img = { src: nextIllustration, kind: "scene" };
    } else if (obtainedItem) {
      img = { src: objectImage(obtainedItem.kind), kind: "object" };
    } else {
      img = { src: lastSceneIlloRef.current, kind: "scene" };
    }

    setStep(nextStep);
    persist((run) => {
      run.step = nextStep;
      run.lastChoiceId = null;
      run.effects = run.effects
        .map((e) => ({ ...e, scenesLeft: e.scenesLeft - 1 }))
        .filter((e) => e.scenesLeft > 0);
      run.debts = (run.debts ?? []).filter((d) => d.settleAtStep > nextStep);
      if (scene.combat) run.encounters = (run.encounters ?? 0) + 1;
    });
    // Rappel des états temporaires (retour Patrick 19/07) : après un jet de
    // dé, l'écran suivant s'ouvre sur les états encore actifs — un petit
    // libellé « état temporaire », le nom, jamais un chiffre.
    const activeEffects = runRef.current?.effects ?? [];
    if (opts?.result !== undefined && activeEffects.length > 0) {
      entries.unshift({
        id: nextId(),
        kind: "etat",
        effects: activeEffects.map((e) => ({ effectId: e.id, label: e.label, positive: e.delta > 0 })),
      });
    }
    setSelectedId(null);
    setRoll(null);
    setTimedExpired(false);
    showScreen(entries, img);
  }

  function onSelect(choice: Choice) {
    if (choice.locked || rolling || selectedId) return;
    setSelectedId(choice.id);
    setChoicesHidden(true);
    persist((run) => {
      run.lastChoiceId = choice.id;
    });

    // Persistance environnementale (§17) : trace durable relue aux runs suivantes.
    if (choice.setsEnvFlag) {
      const flag = choice.setsEnvFlag;
      mutateMemory((m) => {
        m.envFlags[flag] = true;
      });
    }
    // Prix différé (§17) : un choix « gratuit » peut poser une dette silencieuse.
    if (choice.debt) {
      const debt = choice.debt;
      persist((run) => {
        run.debts = [...(run.debts ?? []), { id: debt.id, settleAtStep: step + debt.settleInSteps, text: debt.text }];
      });
    }

    if (choice.risky) {
      // Armement du dé (spec §4) : le dé devient saisissable, hint contextuel.
      const effects = runRef.current?.effects ?? [];
      const modifier = effects.reduce((sum, e) => sum + e.delta, 0);
      setRoll({
        key: Date.now(),
        stat: choice.risky.stat,
        threshold: choice.risky.threshold,
        outcomes: choice.risky.outcomes,
        modifier,
        effectLabel: effects[0]?.label,
        highStakes: choice.risky.highStakes,
      });
    } else if (choice.rest) {
      // Campement (spec §7, précisé 13/07) : le jour avance, blessures atténuées.
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
      mutateMemory((m) => {
        m.bestDays = Math.max(m.bestDays, newDay);
      });
      const prepend: FeedEntry[] = [{ id: nextId(), kind: "day", day: newDay }];
      if (soinUsed) {
        prepend.push({
          id: nextId(),
          kind: "narration",
          text: `Avant de dormir, tu uses du ${soinUsed}. La plaie se referme enfin — la nuit n'aura pas ce prétexte.`,
        });
      }
      advanceTimer.current = setTimeout(() => advance({ prepend }), 320);
    } else if (choice.passive) {
      // Le silence comme vraie option (§19) : conséquence dédiée, sans dé.
      advanceTimer.current = setTimeout(() => advance({ consequence: choice.passive!.consequence }), 320);
    } else {
      // Choix neutre : résolution instantanée, sans dé (spec §4).
      advanceTimer.current = setTimeout(() => advance(), 320);
    }
  }

  // Paliers de santé discrets (spec §5) : Intact · Marqué · Entaillé · Au seuil.
  const erosion = health < 0.25 ? 3 : health < 0.5 ? 2 : health < 0.75 ? 1 : 0;

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        className={`phone-frame relative flex h-[800px] max-h-[100dvh] w-[390px] shrink-0 flex-col overflow-clip bg-[var(--color-bg)] ${
          erosion ? `erosion-${erosion}` : ""
        }`}
      >
        {/* État KO (14/07) : nappe de pixels morts scintillante au palier critique. */}
        {erosion === 3 && (
          <div
            className="decay-overlay"
            style={
              typeof document !== "undefined" && getDecayOverlay()
                ? { backgroundImage: `url(${getDecayOverlay()})` }
                : undefined
            }
            aria-hidden
          />
        )}

        {/* En-tête : seule l'icône de menu flotte en haut à droite (spec §8). */}
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setMenuOpen(true)}
          className="absolute top-[11px] right-[10px] z-[5] grid size-[32px] cursor-pointer grid-cols-3 place-items-center border border-solid border-[var(--color-ink)] bg-[var(--color-bg)]/80 p-[8px]"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="block size-[1.6px] bg-[var(--color-ink)]" />
          ))}
        </button>

        {/* Illustration calée EN HAUT (fixe). Ne se ré-anime (fondu) que quand
            sa source change — même scène = image immobile (demande Patrick).
            Hauteur adaptée à la hauteur du device (dvh), plafonnée. */}
        <div key={image} className="image-swap illustration-frame shrink-0 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src={image}
            className={
              imageKind === "object"
                ? "pointer-events-none block h-[38dvh] max-h-[300px] min-h-[180px] w-full bg-[var(--color-bg)] object-contain [image-rendering:pixelated]"
                : "pointer-events-none block h-[44dvh] max-h-[352px] min-h-[200px] w-full object-cover"
            }
          />
          <div
            className="dissolve-bottom"
            style={{ backgroundImage: 'url("assets/bande_dissolution_haut.svg")' }}
            aria-hidden
          />
        </div>

        {/* Zone de texte — SEULE partie scrollable (si le texte dépasse). Ne
            capte plus les taps pendant le lancer du dé. La clé = pas de scène :
            le contenu se renouvelle proprement à chaque écran. */}
        <div
          ref={textRef}
          onPointerDown={() => setSkip((s) => s + 1)}
          className={`scene-text-zone relative min-h-0 flex-1 overflow-y-auto px-[17px] pt-[16px] ${rolling ? "pointer-events-none" : ""}`}
        >
          <div key={step + (timedExpired ? "-t" : "")}>
            {beats.map((entry) => (
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
        </div>

        {/* Scène chronométrée (§18) : compte à rebours VISUEL (jauge), jamais un chiffre. */}
        {countdownArmed && scene.timed && (
          <div className="timed-countdown relative z-[3]" aria-hidden>
            <div
              className="timed-countdown-fill"
              style={{ ["--timed-ms" as string]: `${scene.timed.ms}ms` }}
            />
          </div>
        )}

        {/* CTA ancrés en bas (fixes), masqués tant que le texte n'est pas
            entièrement écrit — puis fondu. Pendant le lancer, ils ne captent
            plus les événements (sinon un bouton avale la saisie du dé). */}
        <div
          className={`choices-bar relative z-[3] flex w-full shrink-0 flex-col gap-[10px] border-t border-[var(--color-ink)]/15 px-[15px] py-[15px] ${
            rolling ? "pointer-events-none" : ""
          } ${choicesHidden || activeTypingId ? "choices-hidden" : ""}`}
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

        {/* Dé d20 tactile — apparaît au clic d'un choix risqué. */}
        <Die3D
          request={roll}
          onComplete={(result, outcome, tier) => {
            const engaged = Boolean(scene.combat) && roll?.stat === "COURAGE";
            const destinItem = tier === "destin" ? randomRecompenseDestin(engaged) : null;
            persist((run) => {
              run.rolls.push({ step, choiceId: selectedId ?? "roll", result, at: Date.now() });
              const cost =
                tier === "malediction" ? 0.25 : tier === "critique" ? 0.2 : tier === "echec" ? 0.12 : tier === "justesse" ? 0.06 : 0;
              run.health = Math.max(0, run.health - cost);
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

            // Permadeath réel (spec §9) : santé à zéro sur un jet raté = mort.
            if (run.health <= 0 && tierIsFail(tier)) {
              const epitaph = outcome.text.replace(/\s*♦.*$/, "");
              const cause = scene.foeName ?? "les couloirs";
              const relic = recordDeath({
                heroName: run.heroName,
                days: run.day,
                cause,
                place: scene.id,
                killer: scene.foe ? { entity: scene.foe, label: scene.foeName ?? scene.foe } : undefined,
              });
              const dead = { epitaph, day: run.day, encounters: run.encounters, relic };
              resetRun();
              setDeath(dead);
              return;
            }
            advance({ result, fail: outcome.fail, consequence: outcome.text, destinItem });
          }}
        />

        {/* Menu plein cadre (spec §8) : Essence + Inventaire. */}
        {menuOpen && <GameMenu run={loadRun()} onClose={() => setMenuOpen(false)} />}

        {/* Écran de mort (13/07). */}
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
  if ((entry.kind === "narration" || entry.kind === "jailer") && !revealed) return null;

  switch (entry.kind) {
    // L'illustration est désormais gérée en haut d'écran (état séparé) : plus
    // jamais une entrée du flux. L'action choisie n'est plus ré-affichée.
    case "illustration":
    case "chosen":
      return null;
    case "day":
      return (
        <p className="scene-enter mb-[18px] text-center text-[11px] uppercase tracking-[1.2px] text-[var(--color-ink)] opacity-50 [--enter-opacity:0.5]">
          — Jour {entry.day} —
        </p>
      );
    case "jailer":
      return (
        <div
          className={`scene-enter jailer-banner mx-[-17px] mb-[18px] mt-[15px] relative flex min-h-[87px] items-center overflow-hidden bg-[var(--color-accent)] pl-[122px] pr-[20px] py-[16px] ${
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src="assets/geolier_portrait.png"
            className="pointer-events-none absolute top-0 left-0 z-0 h-full w-auto"
            style={{ imageRendering: "pixelated" }}
          />
          <p className="relative z-[1] font-mono text-[13px] font-bold leading-[1.6] text-[var(--color-bg)]">
            <TypedText text={entry.text} typed={typed} skip={skip} msPerChar={42} onDone={onDone} />
          </p>
        </div>
      );
    case "narration":
      return (
        <p className="scene-enter feed-narration mb-[18px] text-[13px] leading-[1.3] text-[var(--color-ink)]">
          <TypedText text={entry.text} typed={typed} skip={skip} msPerChar={15} onDone={onDone} />
        </p>
      );
    case "combat":
      return (
        <div className="scene-enter combat-banner mb-[14px] mt-[6px]" role="note">
          <span className="combat-banner-tag">• RENCONTRE •</span>
          <span className="combat-banner-foe">{entry.foe}</span>
        </div>
      );
    case "etat":
      // Rappel des états temporaires après un jet (retour Patrick 19/07) :
      // vignette + nom — négatif = orange telle quelle, positif = désaturée
      // vers le blanc (même convention que l'écran Essence). Jamais un chiffre.
      return (
        <div className="scene-enter etat-banner" role="note">
          <span className="etat-banner-eyebrow">
            {entry.effects.length > 1 ? "États temporaires" : "État temporaire"}
          </span>
          <div className="etat-banner-row">
            {entry.effects.map((e) => (
              <span key={e.effectId} className={`etat-chip ${e.positive ? "is-positive" : ""}`}>
                {(e.effectId === "aguerri" || e.effectId === "entaille") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" src={`assets/etat_${e.effectId}.png`} className="etat-chip-icon" />
                )}
                {e.label}
              </span>
            ))}
          </div>
        </div>
      );
    case "obtenu":
      return (
        <div className="scene-enter obtenu-banner mb-[18px]">
          <span className="obtenu-line">
            Obtenu — {entry.name} · {entry.rarity}
          </span>
          <span className="obtenu-flavor">{entry.flavor}</span>
        </div>
      );
    case "registre":
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
