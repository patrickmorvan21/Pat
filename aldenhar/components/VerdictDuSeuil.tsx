"use client";

/**
 * LE VERDICT DU SEUIL (2/09) — la forme du héros naît devant le joueur.
 *
 * Remplace la clôture en prose du 4/08, qui rendait le moment le plus
 * identitaire du jeu sous la même forme que tous les autres beats. La forme du
 * héros se dessine axe par axe devant lui, puis le portrait tombe dessous.
 * C'est la même forme qu'il retrouvera toute la partie dans son menu.
 *
 * Deux règles qui tiennent le reste :
 *
 * 1. AUCUN CHIFFRE. Le radar dit la forme, le portrait dit le caractère. La
 *    règle « pas de nombre affiché » vaut ici comme partout — c'est pour ça
 *    que l'Anneau du dé existe.
 * 2. LE ±1 RESTE INVISIBLE. `computeVerdict` tire un cran silencieux par stat ;
 *    le radar affiche l'état FINAL, jet compris (décision de Patrick, 2/09).
 *    Le joueur ne voit jamais la différence entre ce qu'il a montré et ce que
 *    le Domaine en a fait — il ne voit que ce qu'il est devenu.
 *
 * ⚠️ LE RAPPEL DES QUATRE RÉPONSES A ÉTÉ RETIRÉ (retour Patrick, 2/09 :
 * « ça mange trop de place »), avec la phrase de clôture. Conséquence assumée :
 * plus rien ne relie explicitement un axe au souvenir qui l'a fait pousser —
 * c'est le portrait, dessous, qui porte seul le « pourquoi ». La croissance
 * reste (elle est ce que Patrick a validé), elle est juste plus rapide,
 * n'ayant plus de texte à accompagner.
 *
 * L'animation est PURE : tout se déduit du temps écoulé `t`, aucun timer en
 * cascade. Un tap pose `t` au-delà de la fin — la séquence se termine d'un
 * coup, sans état à rattraper.
 */

import { useEffect, useMemo, useState } from "react";
import TouchHint from "@/components/TouchHint";
import TypedText from "@/components/TypedText";
import RadarEssence from "@/components/RadarEssence";
import { animReduced } from "@/lib/settings";
import type { PrologueMemory, RunStats } from "@/lib/state";

/** Cadence de la séquence, en ms. */
const T0 = 300; // avant le premier rappel
const PAS = 620; // d'un axe au suivant
const AVANT_POUSSE = 120; // un temps mort avant que l'axe bouge
const CRAN = 90; // un cran de radar
const AVANT_PORTRAIT = 500; // après le dernier axe
const TICK = 90;
/** Au-delà, plus rien ne bouge : l'horloge cesse de compter. */
const FIN_MAX = 60000;

const ORDRE_AXES = ["instinct", "courage", "ruse", "empathie"] as const;

export default function VerdictDuSeuil({
  memories,
  stats,
  portrait,
  onFinish,
}: {
  /** Sert à savoir QUEL axe pousse à quel moment (un souvenir par stat). */
  memories: PrologueMemory[];
  stats: RunStats;
  portrait: string;
  onFinish: () => void;
}) {
  const [t, setT] = useState(0);
  const [portraitPose, setPortraitPose] = useState(false);
  const [skip, setSkip] = useState(0);

  const tPortrait = T0 + memories.length * PAS + AVANT_PORTRAIT;
  const fini = t >= tPortrait;

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
        {/* Le groupe radar + portrait est CENTRÉ dans la hauteur restante
            (le rappel parti, l'écran avait un grand vide sous le texte), et sa
            hauteur est FIXE : sans le `min-h` du portrait, la mise en page se
            recentrerait à chaque ligne qui se tape et le radar dériverait vers
            le haut pendant qu'on le regarde. */}
        <div className="flex flex-1 flex-col justify-center pb-[64px]">
          <div className="shrink-0">
            <RadarEssence stats={stats} fill={fill} />
          </div>

          {/* Le portrait : sa voix, sa cadence. C'est la seule parole de l'écran. */}
          <div className="mt-[46px] min-h-[136px] shrink-0">
            {fini && (
              <p className="mx-auto max-w-[320px] px-[15px] text-center font-mono text-[13px] leading-[1.7] whitespace-pre-line text-[var(--color-ink)]">
                <TypedText
                  text={portrait}
                  typed={!portraitPose}
                  skip={skip}
                  msPerChar={42}
                  onDone={() => setPortraitPose(true)}
                />
              </p>
            )}
          </div>
        </div>

        {fini && portraitPose && <TouchHint first />}
      </div>
    </main>
  );
}
