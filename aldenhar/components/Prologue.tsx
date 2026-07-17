"use client";

import { useEffect, useRef, useState } from "react";
import FitLabel from "@/components/FitLabel";
import { HeroGeolier } from "@/components/HeroGeolier";
import TypedText from "@/components/TypedText";
import { computeVerdict, PROLOGUE_AMORCE, PROLOGUE_CLOTURE } from "@/lib/prologue-data";
import { loadRun, saveRun, type PrologueMemory, type RunState } from "@/lib/state";

/**
 * Prologue « Le Seuil » (Notion 16/07 + écrans Figma) : le joueur vient de
 * mourir ; avant de le laisser entrer, le Geôlier feuillette sa vie d'avant
 * et JUGE ses réactions — les stats sont un verdict, pas une allocation.
 *
 * Règles verrouillées :
 * - AUCUN dé — ni visible, ni lancé. Résolution narrative immédiate.
 * - Illustration unique : le Geôlier (même asset + même animation que
 *   l'accueil) sur tout le prologue — pas d'image par souvenir (§11).
 * - Progression dramatique : les cendres densifient à chaque choix validé
 *   (DENSITY 2→3→4→5) ; la respiration s'allonge au dernier choix
 *   (BSTEP 380→520ms) — il se fige, concentré, avant le verdict.
 * - Boutons contour blanc (design in-game) + tag de stat orange — le tag
 *   indique la stat engagée, jamais une valeur.
 * - Fermer l'app en plein prologue reprend exactement au même beat (§9).
 * - Rejoué à chaque nouvelle run (tirage différent).
 */
export default function Prologue({ onDone }: { onDone: () => void }) {
  const runRef = useRef<RunState | null>(null);
  const [beat, setBeat] = useState<number | null>(null);
  // Copie de rendu des souvenirs tirés (la source de vérité reste la run
  // persistée — un ref n'est pas lisible pendant le rendu).
  const [memories, setMemories] = useState<PrologueMemory[]>([]);
  const [choicesMade, setChoicesMade] = useState(0);
  // Le texte du beat courant a fini de se révéler (les choix apparaissent,
  // ou un tap fait avancer les beats sans choix).
  const [typedDone, setTypedDone] = useState(false);
  const [skip, setSkip] = useState(0);

  useEffect(() => {
    const run = loadRun();
    runRef.current = run;
    if (run.prologue.done) {
      onDone();
      return;
    }
    // Persiste le tirage dès l'entrée : la reprise retombera sur les MÊMES
    // souvenirs, au même beat.
    saveRun(run);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration unique du beat sauvegardé, post-hydratation
    setBeat(run.prologue.beat);
    setMemories(run.prologue.memories);
    setChoicesMade(run.prologue.choices.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(mutate: (run: RunState) => void) {
    const run = runRef.current ?? loadRun();
    mutate(run);
    runRef.current = run;
    saveRun(run);
  }

  if (beat === null || memories.length === 0) return <main className="flex min-h-dvh items-center justify-center" />;

  const isAmorce = beat < 2;
  const isMemory = beat >= 2 && beat < 2 + memories.length;
  const memory = isMemory ? memories[beat - 2] : null;

  // Texte du beat courant — l'amorce et la clôture sont la voix du Geôlier
  // (cadence 42ms), les souvenirs sont de la narration (15ms).
  const beatText = isAmorce ? PROLOGUE_AMORCE[beat] : isMemory ? memory!.narration : PROLOGUE_CLOTURE;
  const isJailerVoice = !isMemory;

  function advanceBeat() {
    const next = beat! + 1;
    setTypedDone(false);
    setBeat(next);
    persist((r) => {
      r.prologue.beat = next;
    });
  }

  function onTap() {
    if (!typedDone) {
      setSkip((s) => s + 1);
      return;
    }
    // Beats sans choix : un tap avance. Sur un souvenir, seuls les boutons agissent.
    if (isAmorce) advanceBeat();
    else if (!isMemory) finish();
  }

  function onChoose(idx: number) {
    if (!typedDone || !isMemory) return;
    setChoicesMade((n) => n + 1);
    persist((r) => {
      r.prologue.choices = [...r.prologue.choices, idx];
    });
    advanceBeat();
  }

  /** Clôture tapée puis validée : le verdict tombe, on entre au Jour I. */
  function finish() {
    persist((r) => {
      r.stats = computeVerdict(r.prologue.memories, r.prologue.choices);
      r.prologue.done = true;
      r.prologue.beat = beat!;
    });
    onDone();
  }

  // Progression dramatique (16/07) : cendres 2→3→4→5 (un cran par choix),
  // respiration 380→520ms pendant le dernier souvenir et après.
  const density = Math.min(5, 2 + choicesMade);
  const bstep = choicesMade >= 3 ? 520 : 380;

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        className="phone-frame relative flex h-[800px] max-h-[100dvh] w-[390px] shrink-0 cursor-pointer flex-col overflow-clip bg-[var(--color-bg)]"
        onPointerDown={onTap}
      >
        <HeroGeolier density={density} bstep={bstep} />

        <div className="flex flex-1 flex-col px-[15px] pt-[46px]">
          {/* key=beat : chaque beat repart d'une frappe neuve */}
          <p
            className={`font-mono text-[13px] leading-[1.7] text-[var(--color-ink)] ${
              isMemory ? "text-left" : "text-center"
            }`}
          >
            <TypedText
              key={beat}
              text={beatText}
              typed={!typedDone}
              skip={skip}
              msPerChar={isJailerVoice ? 42 : 15}
              onDone={() => setTypedDone(true)}
            />
          </p>

          {/* Les 3 réponses du souvenir — apparaissent une fois le texte posé.
              A = engagement direct, B = voie mesurée, C = retrait/refus. */}
          {isMemory && typedDone && memory && (
            <div className="mt-[28px] flex flex-col gap-[10px]">
              {memory.options.map((label, idx) => (
                <PrologueChoice key={idx} label={label} onSelect={() => onChoose(idx)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * Bouton de choix du prologue : même langage que les choix in-game (contour
 * blanc + entailles de coins 2px) — jamais la bordure orange de l'accueil,
 * et SANS tag de stat (retour Patrick 16/07, maquette 1997:578 : la stat
 * engagée reste invisible pendant le Seuil). Pas d'érosion santé ici : le
 * héros n'existe pas encore.
 */
function PrologueChoice({ label, onSelect }: { label: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="relative h-[46px] w-full cursor-pointer text-left"
    >
      <span className="absolute inset-0 border border-solid border-[var(--color-ink)] bg-[var(--color-bg)]" aria-hidden />
      <span className="absolute top-0 left-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="absolute bottom-0 left-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="absolute top-0 right-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="absolute bottom-0 right-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <FitLabel
        text={label}
        className="absolute top-1/2 left-[5%] max-w-[90%] -translate-y-1/2 overflow-hidden font-medium leading-[1.2] whitespace-nowrap text-ellipsis text-[var(--color-ink)]"
      />
    </button>
  );
}
