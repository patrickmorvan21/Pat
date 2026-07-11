"use client";

import { useEffect, useRef, useState } from "react";
import Die3D, { type RollRequest } from "@/components/Die3D";
import ChoiceButton from "@/components/ChoiceButton";
import JailerBanner from "@/components/JailerBanner";
import { chapterLabel, jailerTaunt, sceneAt, type Choice } from "@/lib/scene-data";
import { loadRun, saveRun, type RunState } from "@/lib/state";

/**
 * Parcours infini — frames Figma 124:2885 (narration), 95:1541 (CTA cliqué),
 * 124:2178 (dé). Cadre 390×800, positions absolues aux valeurs du design.
 *
 * Boucle : scène → clic CTA (état liseré) → choix sûr : scène suivante ;
 * choix risqué : voile + dé lançable → verdict → scène suivante. Sans fin.
 */
export default function Scene() {
  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roll, setRoll] = useState<RollRequest | null>(null);
  // Le Geôlier ne parle que de temps en temps ; la 1re scène porte sa réplique d'accueil.
  const [banner, setBanner] = useState<string | null>(sceneAt(0).jailerLine);
  const runRef = useRef<RunState | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scene = sceneAt(step);
  const rolling = roll !== null;

  // Reprise de run : fermer l'app ne compte jamais comme une mort.
  useEffect(() => {
    const run = loadRun();
    runRef.current = run;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration unique post-hydratation
    if (run.step > 0) setStep(run.step);
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  function persist(mutate: (run: RunState) => void) {
    const run = runRef.current ?? loadRun();
    mutate(run);
    runRef.current = run;
    saveRun(run);
  }

  /**
   * Scène suivante. Le Geôlier apparaît : toujours après un mauvais jet
   * (pour se moquer), sinon une fois de temps en temps (~1 fois sur 3).
   */
  function advance(rollInfo?: { result: number; fail: boolean }) {
    setStep((s) => {
      const next = s + 1;
      persist((run) => {
        run.step = next;
        run.lastChoiceId = null;
      });
      if (rollInfo?.fail) setBanner(jailerTaunt(rollInfo.result));
      else if (Math.random() < 0.34) setBanner(sceneAt(next).jailerLine);
      else setBanner(null);
      return next;
    });
    setSelectedId(null);
    setRoll(null);
  }

  function onSelect(choice: Choice) {
    if (choice.locked || rolling || selectedId) return;
    setSelectedId(choice.id);
    persist((run) => {
      run.lastChoiceId = choice.id;
    });
    if (choice.risky) {
      // Écran du dé (124:2178) : voile + d20 à saisir et lancer.
      setRoll({
        key: Date.now(),
        threshold: choice.risky.threshold,
        outcomes: choice.risky.outcomes,
      });
    } else {
      // Choix sûr : on laisse l'état cliqué se voir, puis scène suivante.
      advanceTimer.current = setTimeout(() => advance(), 450);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div className="phone-frame relative h-[800px] w-[390px] shrink-0 overflow-clip bg-[var(--color-bg)]">
        {/* Illustration de scène — asset pré-fait (les visuels par scène : temps 2) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src="assets/dithering-portal.jpg"
          className="pointer-events-none absolute top-0 left-1/2 h-[352px] w-[390px] -translate-x-1/2 object-cover"
        />

        {/* En-tête : chapitre (progression infinie) + menu 3×3 */}
        <p className="absolute top-[24px] left-[15px] z-[3] font-medium uppercase leading-[1.2] text-[12px] tracking-[1.2px] text-[var(--color-ink)] whitespace-nowrap">
          {chapterLabel(step)}
        </p>
        <button
          type="button"
          aria-label="Menu"
          className="absolute top-[11px] right-[10px] z-[3] grid size-[41px] cursor-pointer grid-cols-3 place-items-center border border-solid border-[var(--color-ink)] bg-[var(--color-bg)] p-[11px]"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="block size-[1.6px] bg-[var(--color-ink)]" />
          ))}
        </button>

        {/* Narration */}
        <p
          key={scene.id + step}
          className="scene-enter absolute top-[366px] left-[17px] w-[360px] leading-[1.3] text-[13px] text-[var(--color-ink)]"
        >
          {scene.narration}
        </p>

        {/* Choix : verrouillé = grisé mais visible, risqué = tag de stat.
            Pas de z-index sur le conteneur : chaque bouton gère le sien pour
            que le choix cliqué puisse passer au-dessus du voile (z-5).
            Pendant le lancer, les boutons ne captent plus les événements —
            sinon un bouton disabled avale la saisie du dé qui le chevauche. */}
        <div
          className={`absolute top-[527px] left-[15px] flex w-[360px] flex-col gap-[10px] ${
            rolling ? "pointer-events-none" : ""
          }`}
        >
          {scene.choices.map((choice) => (
            <ChoiceButton
              key={scene.id + choice.id + step}
              choice={choice}
              selected={selectedId === choice.id}
              raised={rolling && selectedId === choice.id}
              onSelect={onSelect}
            />
          ))}
        </div>

        {/* Bannière du Geôlier — intermittente, absente sur l'écran du dé (124:2178) */}
        {!rolling && banner && <JailerBanner key={`${step}-${banner}`} line={banner} />}

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
            });
            advance({ result, fail: outcome.fail });
          }}
        />
      </div>
    </main>
  );
}
