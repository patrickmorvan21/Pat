"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Die3D, { type RollRequest } from "@/components/Die3D";
import ChoiceButton from "@/components/ChoiceButton";
import TypedText from "@/components/TypedText";
import { jailerTaunt, sceneAt, type Choice } from "@/lib/scene-data";
import { loadRun, saveRun, type FeedEntry, type RunState } from "@/lib/state";
import { ditherFadeMaskDataUrl } from "@/lib/dither";

// Masque tramé du portrait du Geôlier — généré une fois, mis en cache (§11 :
// dissolution en pixels épars sur les bords, jamais un fondu CSS lisse).
// L'image est mirroir (-scale-x-100) pour faire face au texte : le fondu est
// donc construit du côté "nx→0" pour finir visuellement à droite (près du
// texte) une fois le mirroir appliqué.
let demonMaskCache: string | null = null;
function getDemonMask(): string | null {
  if (typeof document === "undefined") return null;
  if (!demonMaskCache) {
    demonMaskCache = ditherFadeMaskDataUrl(116, 136, (nx, ny) => {
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
  const runRef = useRef<RunState | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // La position à l'écran ne doit jamais prédire le type de choix (CLAUDE.md) :
  // Fisher-Yates seedé par le pas de progression — stable au re-render et à la
  // reprise de run. La scène 0 garde l'ordre exact de la frame Figma.
  const shuffledChoices = useMemo(() => {
    const arr = [...scene.choices];
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
  }, [scene, step]);

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
      const opening = sceneAt(0);
      const seeded: FeedEntry[] = [
        { id: nextId(), kind: "illustration", src: opening.illustration ?? "assets/dithering-portal.jpg" },
        { id: nextId(), kind: "day", day: run.day },
        ...opening.narration.map((text): FeedEntry => ({ id: nextId(), kind: "narration", text })),
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
  function advance(rollInfo?: { result: number; fail: boolean; consequence?: string }) {
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
    // Illustration : changement de contexte, ou ~1 fois sur 4 pour rythmer le fil.
    if (contextChanged || Math.random() < 0.25) {
      entries.push({ id: nextId(), kind: "illustration", src: nextIllustration });
    }
    entries.push(...nextScene.narration.map((text): FeedEntry => ({ id: nextId(), kind: "narration", text })));
    const isCritical = rollInfo?.result === 1 || rollInfo?.result === 20;
    if (isCritical) {
      entries.push({ id: nextId(), kind: "jailer", text: jailerTaunt(rollInfo!.result) });
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
    });
    pushEntries(entries);
    // Révélation séquentielle : narration(s) puis Geôlier, jamais tous en même temps.
    enqueueReveal(entries.filter((e) => e.kind === "narration" || e.kind === "jailer").map((e) => e.id));
    setSelectedId(null);
    setRoll(null);
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
      });
    } else if (choice.rest) {
      // Campement (spec §7) : le jour avance, les blessures légères s'atténuent.
      persist((run) => {
        run.day += 1;
        run.health = Math.min(1, run.health + 0.35);
        run.effects = run.effects.filter((e) => e.delta > 0);
      });
      const newDay = runRef.current?.day ?? day + 1;
      setDay(newDay);
      setHealth(runRef.current?.health ?? 1);
      pushEntries([{ id: nextId(), kind: "day", day: newDay }]);
      advanceTimer.current = setTimeout(() => advance(), 450);
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
        {/* En-tête : icône de menu unique, même position sur tous les écrans (spec §8) */}
        <div className="relative z-[3] flex items-center justify-end px-[15px] py-[11px]">
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
          onComplete={(result, outcome) => {
            persist((run) => {
              run.rolls.push({
                step,
                choiceId: selectedId ?? "roll",
                result,
                at: Date.now(),
              });
              // Santé : les échecs blessent — jamais de chiffre, l'UI s'érode (spec §5).
              if (result === 1) run.health = Math.max(0.05, run.health - 0.25);
              else if (outcome.fail) run.health = Math.max(0.05, run.health - 0.12);
              // États narratifs temporaires sur critiques (spec §2).
              if (result === 20)
                run.effects = [
                  { id: "aguerri", label: "AGUERRI", delta: 2, scenesLeft: 3 },
                  ...run.effects.filter((e) => e.id !== "aguerri"),
                ];
              if (result === 1)
                run.effects = [
                  { id: "entaille", label: "ENTAILLÉ", delta: -2, scenesLeft: 3 },
                  ...run.effects.filter((e) => e.id !== "entaille"),
                ];
              // Rencontre de combat (spec §6) : bonus/malus post-combat, sur
              // une issue non critique (les critiques ont déjà leur propre
              // état ci-dessus — pas de cumul sur le même jet).
              if (scene.combat && result !== 1 && result !== 20) {
                if (!outcome.fail)
                  run.effects = [
                    { id: "aguerri", label: "AGUERRI", delta: 2, scenesLeft: 3 },
                    ...run.effects.filter((e) => e.id !== "aguerri"),
                  ];
                else
                  run.effects = [
                    { id: "ebranle", label: "ÉBRANLÉ", delta: -1, scenesLeft: 2 },
                    ...run.effects.filter((e) => e.id !== "ebranle"),
                  ];
              }
            });
            setHealth(runRef.current?.health ?? 1);
            advance({ result, fail: outcome.fail, consequence: outcome.text });
          }}
        />
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
      return (
        <div className="scene-enter mx-[-17px] mb-[18px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={entry.src} className="pointer-events-none block h-[352px] w-full object-cover" />
        </div>
      );
    case "day":
      return (
        <p className="scene-enter mb-[18px] text-center text-[11px] uppercase tracking-[1.2px] text-[var(--color-ink)] opacity-50">
          — Jour {entry.day} —
        </p>
      );
    case "chosen":
      return (
        <p className="scene-enter mb-[14px] text-[13px] text-[var(--color-ink)] opacity-50">
          › {entry.label}
        </p>
      );
    case "jailer":
      // Bandeau agrandi et repositionné (Figma 1909:794, redesign 11/07) :
      // démon plus grand et plus présent, texte à sa droite. Le portrait est
      // en z-index sous le texte (le texte doit toujours rester lisible et
      // au-dessus de l'image, jamais rogné par elle). Le bord droit/bas de
      // l'image se dissout en pixels tramés (masque Bayer) plutôt qu'un
      // fondu lisse ; ce tramage scintille tant que le Geôlier "parle"
      // (texte en cours de frappe) et se fige dès la citation terminée.
      return (
        <div className="scene-enter jailer-banner mx-[-17px] mb-[18px] relative flex min-h-[128px] items-center overflow-clip bg-[var(--color-accent)] pl-[100px] pr-[22px] py-[16px]">
          <div
            className={`jailer-portrait pointer-events-none absolute top-[10px] left-[-8px] z-0 h-[136px] w-[116px] ${
              typed ? "jailer-speaking" : ""
            }`}
          >
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
                    }
                  : undefined
              }
            />
          </div>
          <p className="relative z-[1] text-[13px] font-bold leading-[1.35] text-[var(--color-bg)]">
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
  }
}
