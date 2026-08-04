"use client";

import { useEffect, useRef, useState } from "react";
import FitLabel from "@/components/FitLabel";
import { HeroGeolier } from "@/components/HeroGeolier";
import TouchHint from "@/components/TouchHint";
import TypedText from "@/components/TypedText";
import { computeVerdict, portraitDuSeuil, PROLOGUE_AMORCE, PROLOGUE_CLOTURE } from "@/lib/prologue-data";
import { loadRun, saveRun, type PrologueMemory, type RunState } from "@/lib/state";
import { playMusic } from "@/lib/audio";

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
    // Musique (24/07) : le Seuil garde le thème d'intro (continuité accueil).
    playMusic("intro");
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

  const nameBeat = 2 + memories.length;
  const isAmorce = beat !== null && beat < 2;
  const isMemory = beat !== null && beat >= 2 && beat < nameBeat;
  const isName = beat === nameBeat;
  const isCloture = beat !== null && beat > nameBeat;
  const memory = isMemory ? memories[beat! - 2] : null;

  /** PORTRAIT DE CLÔTURE (spec 4/08 A2) : le verdict tombe à l'ENTRÉE de la
      clôture — pas au timer de sortie. computeVerdict tire un jet silencieux :
      recalculé plus tard, il décrirait un AUTRE héros que celui du portrait.
      `verdictRendu` garde la reprise sûre : rouvrir l'app en pleine clôture
      réaffiche le même portrait depuis les stats déjà persistées. */
  const [portrait, setPortrait] = useState<string | null>(null);
  useEffect(() => {
    if (!isCloture) return;
    // React Compiler : jamais de mutation directe dans le corps de l'effet —
    // tout passe par `persist` (même règle que partout dans le composant).
    if (!(runRef.current ?? loadRun()).prologue.verdictRendu) {
      persist((r) => {
        r.stats = computeVerdict(r.prologue.memories, r.prologue.choices);
        r.prologue.verdictRendu = true;
      });
    }
    setPortrait(portraitDuSeuil((runRef.current ?? loadRun()).stats));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCloture]);

  /** Clôture tapée → temporisation de 4 s, puis l'Acte I démarre TOUT SEUL
      (24/07 : pas de bouton, pas de tap — le pacte est signé, le joueur n'a
      plus la main). */
  useEffect(() => {
    if (!isCloture || !typedDone) return;
    const t = setTimeout(() => {
      const run = runRef.current ?? loadRun();
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
        : portrait
          ? `${portrait}\n\n${PROLOGUE_CLOTURE}`
          : "";
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
        <HeroGeolier density={density} bstep={bstep} />

        <div className="flex flex-1 flex-col px-[15px] pt-[40px]">
          {/* key=beat : chaque beat repart d'une frappe neuve.
              Maquettes 1997:523 / 2167:203 : amorce & clôture = texte CENTRÉ,
              largeur ~300px pour qu'il revienne à la ligne ; l'écran du Nom et
              les souvenirs = texte à gauche, pleine largeur. */}
          <p
            className={`font-mono text-[13px] leading-[1.7] whitespace-pre-line text-[var(--color-ink)] ${
              isAmorce || isCloture ? "mx-auto max-w-[300px] text-center" : "text-left"
            }`}
          >
            <TypedText
              key={isCloture ? `${beat}-${portrait ? 1 : 0}` : beat}
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

          {/* ——— Écran du Nom (maquette Figma 2167:203, reproduite fidèlement) :
              champ bordé simple « Ton Nom » (mono, aligné à gauche), bouton
              plein SCELLER LE PACTE, lien centré souligné. Le champ n'apparaît
              qu'une fois la phrase du Geôlier terminée. ——— */}
          {isName && typedDone && (
            <div className="mt-[24px] flex flex-col" onPointerDown={(e) => e.stopPropagation()}>
              {/* champ bordé (cadre blanc 1px, entailles de coins charbon comme les CTA) */}
              <div className="relative h-[52px] w-full">
                <span className="absolute inset-0 border border-solid border-[var(--color-ink)]" aria-hidden />
                <span className="absolute top-0 left-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
                <span className="absolute top-0 right-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
                <span className="absolute bottom-0 left-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
                <span className="absolute bottom-0 right-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
                <input
                  type="text"
                  value={name}
                  maxLength={16}
                  autoFocus
                  placeholder="Ton Nom"
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sealName();
                  }}
                  aria-label="Ton nom"
                  className="absolute inset-0 w-full bg-transparent px-[18px] font-mono text-[14px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink)] placeholder:opacity-45"
                  style={{ caretColor: "var(--color-accent)" }}
                />
              </div>
              <SealCta disabled={!canSeal} onSeal={sealName} />
              <button
                type="button"
                className="mt-[16px] cursor-pointer self-center font-mono text-[13px] font-medium text-[var(--color-ink)] underline"
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

        {/* Affordance sur les écrans d'amorce (narration sans bouton). Passée
            au composant partagé le 26/07 : position et clignotement saccadé
            sont désormais une règle globale, plus un réglage par écran. */}
        {isAmorce && typedDone && <TouchHint />}
      </div>
    </main>
  );
}

/**
 * CTA « SCELLER LE PACTE » (maquette Figma 2167:203) : rectangle plein orange,
 * pleine largeur, texte charbon espacé — pas de segments décalés (la maquette
 * fait foi). Inerte tant que la signature fait moins de 2 caractères.
 */
function SealCta({ disabled, onSeal }: { disabled: boolean; onSeal: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSeal}
      className={`mt-[16px] h-[52px] w-full bg-[var(--color-accent)] font-mono text-[14px] font-bold uppercase tracking-[2.8px] text-[var(--color-bg)] ${
        disabled ? "cursor-default opacity-50" : "cursor-pointer"
      }`}
    >
      Sceller le pacte
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
