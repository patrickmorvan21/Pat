"use client";

/**
 * « ÇA Y EST. JE COMMENCE À TE VOIR. »
 *
 * Le moment où le Geôlier interrompt la partie parce qu'il a assez vu (V2 du
 * prologue, 06/09). C'est ce qui remplace le verdict du Seuil — et le
 * renversement est complet : le profil n'était plus une étape d'onboarding
 * subie avant d'avoir rien vécu, c'est une RÉVÉLATION sur le personnage que le
 * jeu vient de regarder agir.
 *
 * ⚠️ LA FORME SE DESSINE DEVANT LE JOUEUR, elle n'apparaît jamais terminée.
 * Les quatre axes se tendent l'un après l'autre, dans l'ordre de ce qu'il a
 * réellement fait (l'axe le plus marqué d'abord) : c'est la seule façon de
 * lire « voilà ce que j'ai compris de toi » plutôt que « voilà ta fiche ».
 *
 * ⚠️ ET IL FINIT PAR SE DÉDIRE. « Continue. J'ai peut-être tort. » n'est pas
 * une politesse : c'est la phrase qui dit que rien n'est figé — les tendances
 * continuent d'être nourries après, et la forme continuera de bouger, sans
 * qu'aucun écran ne le signale jamais.
 *
 * ⚠️ ELLE NE SE JOUE PAS DEUX FOIS DE LA MÊME MANIÈRE. À la 2e vie il sait
 * déjà ce qui se passe : il compare. À la 3e, il compare sur trois. Rejouer
 * « je commence à te voir » à chaque incarnation ferait mentir sa mémoire.
 */

import { useCallback, useEffect, useState } from "react";
import TypedText from "@/components/TypedText";
import TouchHint from "@/components/TouchHint";
import RadarEssence from "@/components/RadarEssence";
import { portraitDuSeuil } from "@/lib/prologue-data";
import {
  distance,
  dominante,
  engagementDepuisTendances,
  statsDepuisTendances,
  type ProfilRun,
  type Stats,
} from "@/lib/profil";
import { loadMemory } from "@/lib/player-memory";
import { haptic } from "@/lib/settings";

/** Cadence de croissance d'un axe, en paliers entiers (jamais une transition). */
const PAS = 620;

/**
 * CE QU'IL DIT EN OUVRANT — et ça dépend de combien de fois il a déjà fait ça.
 *
 * Vie 1 : il découvre. Vies suivantes : il COMPARE, et la comparaison porte
 * sur la manière, pas sur le résultat — c'est ce qui fait des statistiques un
 * dispositif de mémoire inter-vies plutôt qu'une fiche de personnage.
 */
function ouverture(stats: Stats): string[] {
  const m = loadMemory();
  const passes = m.profils ?? [];
  if (passes.length === 0) return ["Attends.", "Ça y est. Je commence à te voir."];

  const d = distance(stats, passes[passes.length - 1]);
  if (passes.length === 1) {
    return d <= 3
      ? ["Attends.", "Les mêmes réflexes. Intéressant."]
      : ["Attends.", "Non. Tu n'es pas comme le précédent."];
  }
  // Trois vies ou plus : il regarde la série, pas le dernier.
  const constant = passes.every((p) => distance(stats, p) <= 4);
  if (constant) return ["Attends.", "Toujours pareil. Peu importe le visage."];
  return ["Attends.", `${passes.length + 1} vies. Et tu changes encore.`];
}

/** La phrase qui referme — celle qui dit que rien n'est acquis. */
const CLOTURE = "Continue. J'ai peut-être tort.";

const ORDRE = ["instinct", "courage", "ruse", "empathie"] as const;

export default function Revelation({
  profil,
  onDone,
}: {
  profil: ProfilRun;
  onDone: (stats: Stats) => void;
}) {
  const [stats] = useState<Stats>(() => statsDepuisTendances(profil));
  const [beats] = useState<string[]>(() => ouverture(stats));
  /** Beat courant de l'ouverture ; une fois dépassé, la forme se dessine. */
  const [n, setN] = useState(0);
  const [lu, setLu] = useState(false);
  const [skip, setSkip] = useState(0);
  /** Combien d'axes sont déjà tendus. */
  const [tendus, setTendus] = useState(0);
  const [fini, setFini] = useState(false);

  /* L'axe le plus marqué se tend en PREMIER : c'est celui qu'il a vu. */
  const ordre = [...ORDRE].sort((a, b) => stats[b] - stats[a]);
  const fill: Stats = { courage: 0, ruse: 0, instinct: 0, empathie: 0 };
  for (let i = 0; i < tendus; i++) fill[ordre[i]] = stats[ordre[i]];

  /* La forme pousse d'elle-même, un axe à la fois. */
  useEffect(() => {
    if (n < beats.length || tendus >= ordre.length) return;
    const t = setTimeout(() => {
      haptic(6);
      setTendus((k) => k + 1);
    }, PAS);
    return () => clearTimeout(t);
  }, [n, beats.length, tendus, ordre.length]);

  /* Les quatre axes tendus, il rend son verdict puis la main. */
  useEffect(() => {
    if (tendus < ORDRE.length || fini) return;
    const t = setTimeout(() => setFini(true), 700);
    return () => clearTimeout(t);
  }, [tendus, fini]);

  const suivant = useCallback(() => {
    if (n < beats.length) {
      if (!lu) {
        setSkip((k) => k + 1);
        return;
      }
      setN((k) => k + 1);
      setLu(false);
      return;
    }
    if (fini) onDone(stats);
  }, [n, beats.length, lu, fini, onDone, stats]);

  const dessine = n >= beats.length;

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        /* L'écran se trouble : il ne devrait pas pouvoir faire ça. La classe
           existe déjà pour le palier critique de santé — c'est la même
           grammaire de perturbation, réemployée là où elle veut dire « quelque
           chose vient de prendre la main ». */
        className="phone-frame relative flex h-[848px] max-h-[100dvh] w-[390px] shrink-0 flex-col justify-center overflow-clip bg-[var(--color-bg)] critical-vibrate"
        onClick={suivant}
        data-revelation
      >
        {!dessine && (
          <p className="mx-auto w-[306px] text-center font-mono text-[13px] leading-[1.6] text-[var(--color-ink)]">
            <TypedText
              key={n}
              text={beats[n]}
              typed
              msPerChar={42}
              skip={skip}
              onDone={() => setLu(true)}
            />
          </p>
        )}

        {dessine && (
          <>
            <RadarEssence stats={stats} fill={fill} />
            {fini && (
              <>
                <p className="mx-auto mt-[26px] w-[306px] text-center font-mono text-[13px] leading-[1.6] text-[var(--color-ink)] opacity-80">
                  {portraitDuSeuil(stats, engagementDepuisTendances(profil))}
                </p>
                <p className="mx-auto mt-[18px] w-[306px] text-center font-mono text-[13px] leading-[1.6] text-[var(--color-accent)]">
                  {CLOTURE}
                </p>
              </>
            )}
          </>
        )}
        {(lu || fini) && <TouchHint />}
      </div>
    </main>
  );
}

/** Ce que le Geôlier retiendra de cette incarnation, pour comparer plus tard. */
export function dominanteLisible(p: ProfilRun): string {
  return dominante(p);
}
