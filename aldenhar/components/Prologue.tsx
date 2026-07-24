"use client";

import { useEffect, useRef, useState } from "react";
import FitLabel from "@/components/FitLabel";
import { HeroGeolier } from "@/components/HeroGeolier";
import TypedText from "@/components/TypedText";
import { computeVerdict, PROLOGUE_AMORCE, PROLOGUE_CLOTURE } from "@/lib/prologue-data";
import { loadRun, saveRun, type PrologueMemory, type RunState } from "@/lib/state";
import { loadMemory } from "@/lib/player-memory";

/**
 * Prologue « Le Seuil » (Notion 16/07 + écrans Figma, complété 24/07) : le
 * joueur vient de mourir ; avant de le laisser entrer, le Geôlier feuillette
 * sa vie d'avant et JUGE ses réactions — les stats sont un verdict, pas une
 * allocation. Séquence : amorce (2) → 4 souvenirs → ÉCRAN DU NOM → clôture
 * (auto, 4 s) → Jour I.
 *
 * Règles verrouillées :
 * - AUCUN dé — ni visible, ni lancé. Résolution narrative immédiate.
 * - Illustration unique : le Geôlier (même asset + même animation que
 *   l'accueil) sur tout le prologue — pas d'image par souvenir (§11).
 * - Progression dramatique : les cendres densifient à chaque choix validé
 *   (DENSITY 2→3→4→5) ; la respiration s'allonge au dernier choix
 *   (BSTEP 380→520ms) — il se fige, concentré, avant le verdict.
 * - Fermer l'app en plein prologue reprend exactement au même beat (§9).
 * - Rejoué à chaque nouvelle run (tirage différent).
 *
 * ⚠️ ÉCRAN DU NOM (24/07) — EXCEPTION assumée au pilier « jamais de saisie de
 * texte libre » : le nom n'est pas un choix de gameplay, il ne donne aucune
 * agentivité dans la fiction. C'est une signature, pas un dialogue. Inscrite
 * ici explicitement pour ne pas être lue comme une dérive.
 * ⚠️ Modération des noms (Grand Registre public) : décision en attente côté
 * Patrick — liste noire à poser AVANT la mise en ligne du Registre agrégé.
 */

/** Prompt du Geôlier avant la signature (24/07), à sa cadence (42 ms). */
const NAME_PROMPT =
  "Une dernière chose. J'ai vu qui tu étais. Il me manque comment on t'appelait.";

/** Noms tirés par « Qu'il choisisse pour moi » (liste validée 24/07). */
const AUTO_NAMES = ["Cendre", "Le Muet", "Sans-Nom", "Corbeau", "Le Tardif", "Braise", "L'Onzième", "Suie"];

/** Trait d'inscription tramé sous la signature : SEMIS de pixels (jamais un
    filet net — règle §11). Généré une fois, caché au niveau module. */
let strokeCache: string | null = null;
function getSignatureStroke(): string | null {
  if (typeof document === "undefined") return null;
  if (!strokeCache) {
    const W = 280,
      H = 4;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    let seed = 0x51617;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    ctx.fillStyle = "#ffffff";
    for (let x = 0; x < W; x += 1) {
      // dense sur la ligne de base, clairsemé au-dessus — une ligne « posée »
      if (rnd() < 0.72) ctx.fillRect(x, 2, 1, 1);
      if (rnd() < 0.2) ctx.fillRect(x, 1, 1, 1);
      if (rnd() < 0.07) ctx.fillRect(x, 0, 1, 1);
      if (rnd() < 0.3) ctx.fillRect(x, 3, 1, 1);
    }
    strokeCache = c.toDataURL();
  }
  return strokeCache;
}

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
  // Écran du Nom (24/07) : saisie de la signature.
  const [name, setName] = useState("");
  // Aides estompables (24/07) : « Touche pour continuer » + note du Registre
  // ne s'affichent que les 2-3 premières runs (le geste/le fait sont acquis).
  const [isNewcomer, setIsNewcomer] = useState(false);

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
    setIsNewcomer(loadMemory().runsStarted <= 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(mutate: (run: RunState) => void) {
    const run = runRef.current ?? loadRun();
    mutate(run);
    runRef.current = run;
    saveRun(run);
  }

  const nameBeat = 2 + memories.length;
  const isAmorce = beat !== null && beat < 2;
  const isMemory = beat !== null && beat >= 2 && beat < nameBeat;
  const isName = beat === nameBeat;
  const isCloture = beat !== null && beat > nameBeat;
  const memory = isMemory ? memories[beat! - 2] : null;

  /** Clôture tapée → temporisation de 4 s, puis l'Acte I démarre TOUT SEUL
      (24/07 : pas de bouton, pas de tap — le pacte est signé, le joueur n'a
      plus la main). Le verdict tombe ici. */
  useEffect(() => {
    if (!isCloture || !typedDone) return;
    const t = setTimeout(() => {
      const run = runRef.current ?? loadRun();
      run.stats = computeVerdict(run.prologue.memories, run.prologue.choices);
      run.prologue.done = true;
      runRef.current = run;
      saveRun(run);
      onDone();
    }, 4000);
    return () => clearTimeout(t);
  }, [isCloture, typedDone, onDone]);

  if (beat === null || memories.length === 0) return <main className="flex min-h-dvh items-center justify-center" />;

  // Texte du beat courant — amorce, prompt du Nom et clôture sont la voix du
  // Geôlier (cadence 42ms), les souvenirs sont de la narration (15ms).
  const beatText = isAmorce
    ? PROLOGUE_AMORCE[beat]
    : isMemory
      ? memory!.narration
      : isName
        ? NAME_PROMPT
        : PROLOGUE_CLOTURE;
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
    // Beats sans choix : un tap avance l'amorce. L'écran du Nom a ses propres
    // contrôles, et la clôture avance TOUTE SEULE (24/07).
    if (isAmorce) advanceBeat();
  }

  function onChoose(idx: number) {
    if (!typedDone || !isMemory) return;
    setChoicesMade((n) => n + 1);
    persist((r) => {
      r.prologue.choices = [...r.prologue.choices, idx];
    });
    advanceBeat();
  }

  /** SCELLER LE PACTE : le nom signé devient le héros de la run. */
  function sealName() {
    const clean = name.trim().slice(0, 16);
    if (clean.length < 2) return;
    persist((r) => {
      r.heroName = clean;
    });
    advanceBeat();
  }

  const canSeal = name.trim().length >= 2;

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
        {/* Écran du Nom : le héros se réduit pour que la signature et le CTA
            restent visibles quand le clavier mobile s'ouvre (24/07). */}
        <HeroGeolier density={density} bstep={bstep} height={isName ? 232 : 368} />

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

          {/* ——— Écran du Nom (24/07) : le champ n'apparaît qu'une fois la
              phrase du Geôlier terminée — jamais de formulaire pendant qu'il
              parle. La signature est une signature, pas un formulaire. ——— */}
          {isName && typedDone && (
            <div
              className="mt-[26px] flex flex-col items-center"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <span className="font-mono text-[11px] tracking-[2.4px] text-[var(--color-ink)] uppercase opacity-70">
                Signe le pacte
              </span>
              <div className="mt-[14px] w-[280px]">
                <input
                  type="text"
                  value={name}
                  maxLength={16}
                  autoFocus
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sealName();
                  }}
                  aria-label="Signe le pacte"
                  className="block w-full bg-transparent text-center text-[32px] leading-[1.2] text-[var(--color-ink)] outline-none"
                  style={{ fontFamily: "var(--font-title)", caretColor: "var(--color-accent)" }}
                />
                {/* trait d'inscription : semis de pixels tramés, jamais un filet */}
                <div
                  className="h-[4px] w-full"
                  style={{
                    backgroundImage: getSignatureStroke() ? `url(${getSignatureStroke()})` : undefined,
                    backgroundRepeat: "repeat-x",
                    imageRendering: "pixelated",
                    opacity: 0.85,
                  }}
                  aria-hidden
                />
              </div>
              {/* Note du Registre : 2-3 premières runs seulement, puis le héros sait. */}
              {isNewcomer && (
                <p className="mt-[10px] max-w-[280px] text-center font-mono text-[11px] leading-[1.5] text-[var(--color-ink)] opacity-50">
                  Ce nom entrera au Grand Registre. Il y restera plus longtemps que toi.
                </p>
              )}
              <SealCta disabled={!canSeal} onSeal={sealName} />
              <button
                type="button"
                className="mt-[14px] cursor-pointer font-mono text-[12px] text-[var(--color-ink)] underline opacity-50"
                onClick={() => {
                  const pick = AUTO_NAMES[Math.floor(Math.random() * AUTO_NAMES.length)];
                  setName(pick);
                }}
              >
                Qu&apos;il choisisse pour moi
              </button>
            </div>
          )}
        </div>

        {/* Affordance « Touche pour continuer » (24/07) : écrans de narration
            sans bouton. Aide estompable — 2-3 premières runs seulement. */}
        {isAmorce && typedDone && isNewcomer && (
          <span className="absolute inset-x-0 bottom-[18px] text-center font-mono text-[12px] text-[var(--color-ink)] opacity-50">
            Touche pour continuer
          </span>
        )}
      </div>
    </main>
  );
}

/**
 * CTA « SCELLER LE PACTE » (24/07) : primaire orange plein, cadre à segments
 * décalés (le composant du prototype accueil — les écrans SANS maquette Figma
 * gardent ce langage, cf. règle du 16/07). Inerte tant que la signature fait
 * moins de 2 caractères.
 */
function SealCta({ disabled, onSeal }: { disabled: boolean; onSeal: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSeal}
      className={`relative mt-[18px] h-[46px] w-[280px] ${disabled ? "cursor-default opacity-50" : "cursor-pointer"}`}
    >
      <span className="absolute inset-0 bg-[var(--color-accent)]" aria-hidden />
      {/* segments décalés (offsets du prototype validé 16/07) */}
      <span className="absolute top-[-3px] right-[-3px] left-[6px] h-[3px] bg-[var(--color-accent)]" aria-hidden />
      <span className="absolute top-[3px] bottom-[3px] left-[-3px] w-[3px] bg-[var(--color-accent)]" aria-hidden />
      <span className="absolute right-[6px] bottom-[-5px] left-[-5px] h-[5px] bg-[var(--color-accent)]" aria-hidden />
      <span className="relative z-[1] font-mono text-[14px] font-bold tracking-[2.8px] text-[var(--color-bg)] uppercase">
        Sceller le pacte
      </span>
    </button>
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
