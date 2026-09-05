"use client";

import { useEffect, useRef, useState } from "react";
import FitLabel from "@/components/FitLabel";
import { HeroGeolier } from "@/components/HeroGeolier";
import VoilePixels, { useVoile } from "@/components/VoilePixels";
import TouchHint from "@/components/TouchHint";
import TypedText from "@/components/TypedText";
import VerdictDuSeuil from "@/components/VerdictDuSeuil";
import { computeVerdict, engagementDuSeuil, portraitDuSeuil, PROLOGUE_AMORCE } from "@/lib/prologue-data";
import { loadRun, saveRun, type PrologueMemory, type RunState, type RunStats } from "@/lib/state";
import { playMusic } from "@/lib/audio";

/**
 * Prologue « Le Seuil » (Notion 16/07 + écrans Figma, complété 24/07) : le
 * joueur vient de mourir ; avant de le laisser entrer, le Geôlier feuillette
 * sa vie d'avant et JUGE ses réactions — les stats sont un verdict, pas une
 * allocation. Séquence : amorce (2) → 4 souvenirs → ÉCRAN DU NOM → clôture
 * (« Touche pour commencer », 7/08) → Jour I.
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
/* 150 noms pour « Qu'il choisisse pour moi » (retour playtest 6/08 soir —
   « mettez plus de noms »). Registre tenu : choses, bêtes, métiers perdus,
   rangs, manques — des noms de gens qu'on a cessé d'appeler par leur nom.
   Jamais d'héroïque, jamais de fantasy générique. Les 8 premiers sont le
   pool d'origine validé. */
const AUTO_NAMES = [
  "Cendre",
  "Le Muet",
  "Sans-Nom",
  "Corbeau",
  "Le Tardif",
  "Braise",
  "L'Onzième",
  "Suie",
  "Escarbille",
  "Tison",
  "Fumerolle",
  "Mâchefer",
  "Charbon",
  "Étincelle",
  "La Brûlée",
  "Scorie",
  "Fournaise",
  "L'Éteint",
  "Cendrier",
  "Braisillon",
  "La Calcinée",
  "Soufre",
  "Bitume",
  "L'Âtre",
  "Freux",
  "La Pie",
  "Choucas",
  "Le Milan",
  "Busard",
  "La Hulotte",
  "Engoulevent",
  "Le Corbin",
  "Vipérine",
  "Le Blaireau",
  "Musaraigne",
  "La Fouine",
  "Grimpereau",
  "Le Loir",
  "Épervier",
  "La Corneille",
  "Le Rémouleur",
  "La Fileuse",
  "Le Tanneur",
  "Charbonnier",
  "La Lavandière",
  "Le Rebouteux",
  "Fossoyeur",
  "La Glaneuse",
  "Le Vannier",
  "Cordier",
  "La Ravaudeuse",
  "Le Cloutier",
  "Équarrisseur",
  "La Meunière",
  "Le Bourrelier",
  "Tourbier",
  "La Cardeuse",
  "Le Sabotier",
  "Louvetier",
  "La Fagotière",
  "Le Second",
  "La Troisième",
  "Le Septième",
  "La Neuvième",
  "Le Treizième",
  "L'Impair",
  "Le Dernier",
  "L'Avant-Dernier",
  "La Première",
  "Le Centième",
  "Demi-Compte",
  "L'Excédent",
  "Le Reliquat",
  "La Retenue",
  "Le Guéri",
  "La Rompue",
  "Le Boiteux",
  "L'Éborgnée",
  "Le Recousu",
  "La Jaunie",
  "Le Transi",
  "L'Édentée",
  "Le Voûté",
  "La Fêlée",
  "Le Rogné",
  "L'Usée",
  "Le Chauve",
  "La Grêlée",
  "Le Manchot",
  "L'Enrouée",
  "Novembre",
  "La Toussaint",
  "Brumaire",
  "Le Crépuscule",
  "Minuit-Passé",
  "La Morte-Saison",
  "Frimas",
  "L'Équinoxe",
  "Grésil",
  "La Relevée",
  "Vêpres",
  "Le Carême",
  "Matines",
  "La Saint-Jamais",
  "Le Loquet",
  "La Serrure",
  "Ferraille",
  "Le Moyeu",
  "Chandelle",
  "La Poutre",
  "Le Seau",
  "Étoupe",
  "Le Verrou",
  "La Herse",
  "Crochet",
  "Le Timon",
  "Ficelle",
  "La Cheville",
  "Le Soc",
  "Mortaise",
  "Ornière",
  "Le Talus",
  "Bruyère",
  "La Combe",
  "Le Guéret",
  "Fondrière",
  "La Sente",
  "Caillasse",
  "Le Fossé",
  "Tourbe",
  "La Friche",
  "Le Layon",
  "Argile",
  "La Doline",
  "Le Cairn",
  "Rocaille",
  "Le Chuchot",
  "La Tue",
  "Borborygme",
  "Le Soupir",
  "L'Aparté",
  "La Rumeur",
  "Le Râle",
  "Sourdine",
  "L'Écho",
  "La Litanie",
  "Le Grommellement",
  "Voix-Basse",
  "L'Interdit",
  "La Passée",
];

/** Longueur de l'amorce — lue, jamais codée en dur : la clause « Le dé
 *  tranche » y a été fondue le 2/09 et l'amorce est passée de 2 beats à 1. */
const AMORCE_N = PROLOGUE_AMORCE.length;

export default function Prologue({ onDone }: { onDone: () => void }) {
  const runRef = useRef<RunState | null>(null);
  const [beat, setBeat] = useState<number | null>(null);
  /** LE VOILE DE PIXELS entre deux beats (05/09). Chaque beat du Seuil est un
      ÉCRAN différent — une autre question, un autre décor mental — donc il se
      dissout. L'exception que Patrick a posée (« sauf quand c'est le démon qui
      parle d'une phrase à l'autre ») ne s'applique pas ici : l'amorce ne fait
      plus qu'un seul beat depuis le 2/09, et les souvenirs ne sont pas sa voix. */
  const { etat: voile, transiter, onFini: voileFini } = useVoile();
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
    // RESTAURATION AUTO-RÉPARANTE (2/09) : dans la plage des souvenirs, le
    // beat se DÉDUIT du nombre de réponses données, il n'est pas cru sur
    // parole. Une sauvegarde d'avant la fusion de l'amorce (2 beats → 1)
    // pointerait sinon un souvenir d'avance, et le joueur répondrait à une
    // question qu'il n'a pas lue.
    const amorce = PROLOGUE_AMORCE.length;
    const nb = run.prologue.memories.length;
    const brut = run.prologue.beat;
    const cale =
      brut > amorce - 1 && brut < amorce + nb
        ? Math.min(amorce + run.prologue.choices.length, amorce + nb)
        : brut;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration unique du beat sauvegardé, post-hydratation
    setBeat(cale);
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

  const nameBeat = AMORCE_N + memories.length;
  const isAmorce = beat !== null && beat < AMORCE_N;
  const isMemory = beat !== null && beat >= AMORCE_N && beat < nameBeat;
  const isName = beat === nameBeat;
  const isCloture = beat !== null && beat > nameBeat;
  const memory = isMemory ? memories[beat! - AMORCE_N] : null;

  /** PORTRAIT DE CLÔTURE (spec 4/08 A2) : le verdict tombe à l'ENTRÉE de la
      clôture — pas au timer de sortie. computeVerdict tire un jet silencieux :
      recalculé plus tard, il décrirait un AUTRE héros que celui du portrait.
      `verdictRendu` garde la reprise sûre : rouvrir l'app en pleine clôture
      réaffiche le même portrait depuis les stats déjà persistées. */
  const [cloture, setCloture] = useState<{
    portrait: string;
    stats: RunStats;
    choices: number[];
  } | null>(null);
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
    // Le portrait se départage sur l'ENGAGEMENT réel du Seuil, pas sur
    // l'ordre de déclaration des stats (panel 10/08 : « courageux » servi à
    // qui s'était dérobé quatre fois).
    const r0 = runRef.current ?? loadRun();
    setCloture({
      portrait: portraitDuSeuil(
        r0.stats,
        engagementDuSeuil(r0.prologue.memories, r0.prologue.choices),
        r0.prologue.memories
      ),
      // Copiés en état : le rendu ne lit jamais `runRef.current` (React Compiler).
      stats: r0.stats,
      choices: [...r0.prologue.choices],
    });
  }, [isCloture]);

  /** Clôture → « Touche pour commencer » (retour Patrick 7/08, maquette
      1997:619 : le hint 2440:13427 y est posé). L'auto-départ à 4 s du 24/07
      est ANNULÉ — le pacte est signé, mais c'est le joueur qui franchit. */
  function finishSeuil() {
    persist((r) => {
      r.prologue.done = true;
    });
    onDone();
  }

  if (beat === null || memories.length === 0) return <main className="flex min-h-dvh items-center justify-center" />;

  // LE VERDICT (2/09) a sa propre grammaire — le radar y remplace
  // l'illustration, parce que ce qu'on regarde ici, c'est le héros et non
  // plus celui qui le juge. Il tient donc son cadre à lui.
  if (isCloture) {
    if (!cloture) return <main className="flex min-h-dvh items-center justify-center" />;
    return (
      <VerdictDuSeuil
        memories={memories}
        stats={cloture.stats}
        portrait={cloture.portrait}
        onFinish={finishSeuil}
      />
    );
  }

  // Texte du beat courant — amorce, prompt du Nom et clôture sont la voix du
  // Geôlier (cadence 42ms), les souvenirs sont de la narration (15ms).
  const beatText = isAmorce
    ? PROLOGUE_AMORCE[beat]
    : isMemory
      ? memory!.narration
      : isName
        ? NAME_PROMPT
        : "";
  const isJailerVoice = !isMemory;

  function advanceBeat() {
    const next = beat! + 1;
    // ⚠️ La sauvegarde est posée TOUT DE SUITE, le changement d'écran seulement
    // au milieu du voile : fermer l'app pendant la transition ne doit pas
    // rejouer le beat qu'on vient de quitter.
    persist((r) => {
      r.prologue.beat = next;
    });
    transiter(() => {
      setTypedDone(false);
      setBeat(next);
    });
  }

  function onTap() {
    if (!typedDone) {
      setSkip((s) => s + 1);
      return;
    }
    // Beats sans choix : un tap avance l'amorce. L'écran du Nom a ses propres
    // contrôles. La clôture attend LE tap (7/08 — plus d'auto-départ).
    if (isAmorce) advanceBeat();
    else if (isCloture) finishSeuil();
  }

  function onChoose(idx: number) {
    if (!typedDone || !isMemory) return;
    setChoicesMade((n) => n + 1);
    persist((r) => {
      r.prologue.choices = [...r.prologue.choices, idx];
    });
    advanceBeat();
  }

  /** INSCRIRE CE NOM : le nom signé devient le héros de la run. */
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
              isAmorce ? "mx-auto max-w-[300px] text-center" : "text-left"
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

        {/* Étapes du Seuil (retour Patrick 7/08 : « la première fois on ne sait
            pas combien de temps ça dure ») — carrés pleins, JAMAIS une barre.
            FERRÉS EN BAS du cadre depuis le 2/09 : dans le flux, ils suivaient
            la hauteur du texte et sautaient d'un souvenir à l'autre. */}
        {(isMemory || isName) && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-[22px] flex items-center justify-center gap-[5px]"
            aria-hidden
          >
            {Array.from({ length: memories.length + 1 }, (_, i) => {
              const idx = isName ? memories.length : beat! - AMORCE_N;
              return (
                <span
                  key={i}
                  className="block size-[5px]"
                  style={{
                    background: i <= idx ? "var(--color-accent)" : "var(--color-ink)",
                    opacity: i <= idx ? 1 : 0.25,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Affordance sur les écrans d'amorce (narration sans bouton). Passée
            au composant partagé le 26/07 : position et clignotement saccadé
            sont désormais une règle globale, plus un réglage par écran. */}
        {isAmorce && typedDone && <TouchHint />}
        {/* Posé EN DERNIER : le voile couvre tout, y compris l'affordance. */}
        <VoilePixels etat={voile} onFini={voileFini} />
      </div>
    </main>
  );
}

/**
 * CTA du NOM (maquette Figma 2167:203) : rectangle plein orange, pleine
 * largeur, texte charbon espacé — pas de segments décalés (la maquette fait
 * foi). Inerte tant que le nom fait moins de 2 caractères.
 *
 * ⚠️ Il s'appelait « SCELLER LE PACTE » jusqu'au 05/09. Le pacte se signe
 * désormais à l'intro, au doigt, sur son propre écran : garder le même libellé
 * ici ferait croire qu'on re-signe, et le second geste deviendrait illisible.
 * C'est un NOM qu'on inscrit au registre, rien d'autre.
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
      Inscrire ce nom
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
