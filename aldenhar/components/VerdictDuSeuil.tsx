"use client";

/**
 * LE VERDICT DU SEUIL (2/09) — la forme du héros naît devant le joueur.
 *
 * Remplace la clôture en prose du 4/08, qui rendait le moment le plus
 * identitaire du jeu sous la même forme que tous les autres beats. Ici le
 * Geôlier relit les quatre souvenirs et, à chaque relecture, l'axe
 * correspondant du radar POUSSE. Le joueur voit la cause et l'effet dans le
 * même geste, et il retrouvera cette forme toute la partie dans son menu.
 *
 * Trois règles qui tiennent le reste :
 *
 * 1. AUCUN CHIFFRE. Le radar dit la forme, le portrait dit le caractère, le
 *    rappel dit la cause. La règle « pas de nombre affiché » vaut ici comme
 *    partout — c'est pour ça que l'Anneau du dé existe.
 * 2. LE ±1 RESTE INVISIBLE. `computeVerdict` tire un cran silencieux par stat ;
 *    le radar affiche l'état FINAL, jet compris (décision de Patrick, 2/09).
 *    Le joueur ne voit jamais la différence entre ce qu'il a montré et ce que
 *    le Domaine en a fait — il ne voit que ce qu'il est devenu.
 * 3. LE RAPPEL N'INVENTE RIEN. Le titre du souvenir et le libellé de l'option
 *    choisie sont déjà écrits (120 souvenirs × 3 options) : les paraphraser
 *    demanderait 360 textes neufs et introduirait 360 occasions de mentir sur
 *    ce que le joueur a fait. Le préfixe « › » est la grammaire du jeu pour
 *    « l'action choisie ».
 *
 * L'animation est PURE : tout se déduit du temps écoulé `t`, aucun timer en
 * cascade. Un tap pose `t` au-delà de la fin — la séquence se termine d'un
 * coup, sans état à rattraper.
 */

import { useEffect, useMemo, useState } from "react";
import TouchHint from "@/components/TouchHint";
import TypedText from "@/components/TypedText";
import RadarEssence from "@/components/RadarEssence";
import { PROLOGUE_CLOTURE } from "@/lib/prologue-data";
import { animReduced } from "@/lib/settings";
import type { PrologueMemory, RunStats } from "@/lib/state";

/** Cadence de la séquence, en ms. */
const T0 = 300; // avant le premier rappel
const PAS = 950; // d'un souvenir au suivant
const AVANT_POUSSE = 250; // le rappel se pose, PUIS l'axe bouge
const CRAN = 90; // un cran de radar
const AVANT_PORTRAIT = 600; // après le dernier souvenir
const TICK = 90;
/** Au-delà, plus rien ne bouge : l'horloge cesse de compter. */
const FIN_MAX = 60000;

const ORDRE_AXES = ["instinct", "courage", "ruse", "empathie"] as const;

export default function VerdictDuSeuil({
  memories,
  choices,
  stats,
  portrait,
  onFinish,
}: {
  memories: PrologueMemory[];
  choices: number[];
  stats: RunStats;
  portrait: string;
  onFinish: () => void;
}) {
  const [t, setT] = useState(0);
  /** Écrans courts (iPhone SE & co) : sans cette variante, la fin du portrait
      passait SOUS le bord du cadre et se faisait rogner — mesuré à 755 px de
      contenu pour 667 px de cadre. On resserre plutôt que de couper du texte. */
  const [court, setCourt] = useState(false);
  const [portraitPose, setPortraitPose] = useState(false);
  const [skip, setSkip] = useState(0);

  const tPortrait = T0 + memories.length * PAS + AVANT_PORTRAIT;
  const fini = t >= tPortrait;

  useEffect(() => {
    const id = setTimeout(() => setCourt(window.innerHeight < 780), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    // Animations réduites (option d'accessibilité) : la forme est là d'emblée.
    // Le saut passe par un timer plutôt qu'un `setT` direct — le compilateur
    // React interdit un setState synchrone dans le corps d'un effet.
    if (animReduced()) {
      const saut = setTimeout(() => setT(Number.MAX_SAFE_INTEGER), 0);
      return () => clearTimeout(saut);
    }
    const id = setInterval(() => setT((v) => (v > FIN_MAX ? v : v + TICK)), TICK);
    return () => clearInterval(id);
  }, []);

  /** Valeurs AFFICHÉES : base 1 partout, chaque axe monte quand son souvenir
      est relu. Un axe dont le souvenir n'est pas encore lu reste à 1 — c'est
      la base de tout héros, pas un vide. */
  const crans = ORDRE_AXES.map((axe) => {
    const i = memories.findIndex((m) => m.stat === axe);
    if (i < 0) return stats[axe]; // Seuil court (démo) : les stats non jouées sont acquises.
    const debut = T0 + i * PAS + AVANT_POUSSE;
    if (t < debut) return 1;
    return Math.min(stats[axe], 1 + Math.floor((t - debut) / CRAN));
  });

  // Objet mémoïsé sur les CRANS et non sur `t` : sans ça le canvas se
  // redessinerait à chaque tick au lieu de chaque cran (16 fois, pas 52).
  const fill = useMemo<RunStats>(
    () => ({ instinct: crans[0], courage: crans[1], ruse: crans[2], empathie: crans[3] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dépendance volontaire aux valeurs, pas au tableau
    [crans[0], crans[1], crans[2], crans[3]]
  );

  const lus = memories.filter((_, i) => t >= T0 + i * PAS);

  function onTap() {
    // Premier tap : tout se pose. Deuxième : on entre au Jour I.
    if (!fini) {
      setT(Number.MAX_SAFE_INTEGER);
      return;
    }
    if (!portraitPose) {
      setSkip((s) => s + 1);
      return;
    }
    onFinish();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        className="phone-frame relative flex h-[800px] max-h-[100dvh] w-[390px] shrink-0 cursor-pointer flex-col overflow-clip bg-[var(--color-bg)]"
        onPointerDown={onTap}
      >
        <div className={`shrink-0 ${court ? "mt-[18px]" : "mt-[54px]"}`}>
          <RadarEssence stats={stats} fill={fill} compact={court} />
        </div>

        {/* Le dossier qu'il vient de refermer : titre du souvenir, puis
            l'action choisie au préfixe « › » (grammaire du jeu). */}
        <div className={`flex flex-col px-[15px] ${court ? "mt-[26px] gap-[6px]" : "mt-[44px] gap-[10px]"}`}>
          {lus.map((m, i) => (
            <div key={i}>
              <p className="font-mono text-[12px] leading-[1.4] text-[var(--color-ink)]">
                {m.title}
              </p>
              <p className="font-mono text-[12px] leading-[1.4] text-[var(--color-ink)] opacity-50">
                {"› "}
                {m.options[choices[i] ?? 2]}
              </p>
            </div>
          ))}
        </div>

        {/* Le portrait : sa voix, sa cadence. C'est la seule PAROLE de l'écran
            — le reste est de la lecture de dossier. */}
        {fini && (
          <p
            className={`mx-auto max-w-[320px] px-[15px] text-center font-mono whitespace-pre-line text-[var(--color-ink)] ${
              court ? "mt-[16px] text-[12px] leading-[1.5]" : "mt-[30px] text-[13px] leading-[1.7]"
            }`}
          >
            <TypedText
              text={`${portrait}\n\n${PROLOGUE_CLOTURE}`}
              typed={!portraitPose}
              skip={skip}
              msPerChar={42}
              onDone={() => setPortraitPose(true)}
            />
          </p>
        )}

        {fini && portraitPose && <TouchHint first />}
      </div>
    </main>
  );
}
