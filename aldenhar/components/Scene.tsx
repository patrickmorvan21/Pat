"use client";

import { useEffect, useRef, useState } from "react";
import Die3D from "@/components/Die3D";
import StatusBar from "@/components/StatusBar";
import ChoiceButton from "@/components/ChoiceButton";
import JailerBanner from "@/components/JailerBanner";
import { SCENE_ALDENHAR_III, type Choice } from "@/lib/scene-data";
import { loadRun, saveRun, type RunState } from "@/lib/state";

/**
 * Scène Aldenhar — III, reproduction 1:1 de la frame Figma 1903:358 (390×848).
 * Positions absolues aux valeurs exactes du design.
 */
export default function Scene() {
  const scene = SCENE_ALDENHAR_III;
  const runRef = useRef<RunState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reprise de run : fermer l'app ne compte jamais comme une mort.
  // La restauration depuis localStorage ne peut se faire qu'après l'hydratation.
  useEffect(() => {
    const run = loadRun(scene.id);
    runRef.current = run;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration unique post-hydratation
    if (run.lastChoiceId) setSelectedId(run.lastChoiceId);
  }, [scene.id]);

  function persist(mutate: (run: RunState) => void) {
    const run = runRef.current ?? loadRun(scene.id);
    mutate(run);
    runRef.current = run;
    saveRun(run);
  }

  function onSelect(choice: Choice) {
    if (choice.locked) return;
    setSelectedId(choice.id);
    persist((run) => {
      run.lastChoiceId = choice.id;
    });
  }

  const riskyChoice = scene.choices.find((c) => c.risky);

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div className="phone-frame relative h-[848px] w-[390px] shrink-0 overflow-clip bg-[var(--color-bg)]">
        {/* Illustration de scène — asset pré-fait, tramé (jamais généré en direct) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src="assets/dithering-portal.jpg"
          className="pointer-events-none absolute top-[48px] left-1/2 h-[352px] w-[390px] -translate-x-1/2 object-cover"
        />

        <StatusBar />

        {/* En-tête : chapitre + menu (grille 3×3, même place sur tous les écrans) */}
        <p className="absolute top-[75px] left-[15px] z-[3] font-medium uppercase leading-[1.2] text-[12px] tracking-[1.2px] text-[var(--color-ink)] whitespace-nowrap">
          {scene.chapter}
        </p>
        <button
          type="button"
          aria-label="Menu"
          className="absolute top-[59px] right-[10px] z-[3] grid size-[41px] cursor-pointer grid-cols-3 place-items-center border border-solid border-[var(--color-ink)] bg-[var(--color-bg)] p-[11px]"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="block size-[1.6px] bg-[var(--color-ink)]" />
          ))}
        </button>

        {/* Narration */}
        <p className="absolute top-[414px] left-[17px] w-[360px] leading-[1.3] text-[13px] text-[var(--color-ink)]">
          {scene.narration}
        </p>

        {/* Choix : 3 par défaut — verrouillé = grisé mais visible, risqué = tag de stat */}
        <div className="absolute top-[575px] left-[15px] z-[3] flex w-[360px] flex-col gap-[10px]">
          {scene.choices.map((choice) => (
            <ChoiceButton
              key={choice.id}
              choice={choice}
              selected={selectedId === choice.id}
              onSelect={onSelect}
            />
          ))}
        </div>

        <JailerBanner line={scene.jailerLine} />

        {/* Dé d20 tactile — moteur de référence intégré tel quel, branché sur le seuil COURAGE */}
        <Die3D
          threshold={riskyChoice?.risky?.threshold ?? 12}
          outcomes={scene.outcomes}
          onResult={(result) => {
            persist((run) => {
              run.rolls.push({
                choiceId: riskyChoice?.id ?? "roll",
                result,
                at: Date.now(),
              });
            });
          }}
        />
      </div>
    </main>
  );
}
