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
 * ⚠️ LA MISE EN SCÈNE EST CELLE DEMANDÉE LE 07/09 (« transition horrible quand
 * on voit les stats se dessiner au milieu de la partie ») — trois temps, et
 * jamais une apparition sèche par-dessus le jeu :
 *
 *   1. LE VOILE  — les pixels du jeu se dissolvent (`VoilePixels`). C'est la
 *      rupture de lieu pour laquelle ce composant a été écrit le 05/09 et qui
 *      attendait son premier appelant : ici quelqu'un d'autre prend la main.
 *   2. LE DÉMON  — il parle, sur SON écran : fond orange, l'image animée de
 *      l'accueil, exactement la même grammaire qu'au pacte. Quand le Geôlier
 *      s'adresse au joueur en plein cadre, c'est toujours cet écran-là.
 *   3. LE VOILE, puis LA FORME — le radar se dessine devant le joueur, puis
 *      son portrait tombe et un toucher rend la main.
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
import VoilePixels, { useVoile } from "@/components/VoilePixels";
import { HeroGeolier } from "@/components/HeroGeolier";
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

/** Les trois temps de la séquence (voir le docblock). */
type Phase = "entree" | "demon" | "forme";

export default function Revelation({
  profil,
  onDone,
}: {
  profil: ProfilRun;
  onDone: (stats: Stats) => void;
}) {
  const [stats] = useState<Stats>(() => statsDepuisTendances(profil));
  const [beats] = useState<string[]>(() => ouverture(stats));
  const [phase, setPhase] = useState<Phase>("entree");
  /** Beat courant de la prise de parole. */
  const [n, setN] = useState(0);
  const [lu, setLu] = useState(false);
  const [skip, setSkip] = useState(0);
  /** Combien d'axes sont déjà tendus. */
  const [tendus, setTendus] = useState(0);
  const [fini, setFini] = useState(false);
  const voile = useVoile();

  /* L'axe le plus marqué se tend en PREMIER : c'est celui qu'il a vu. */
  const ordre = [...ORDRE].sort((a, b) => stats[b] - stats[a]);
  const fill: Stats = { courage: 0, ruse: 0, instinct: 0, empathie: 0 };
  for (let i = 0; i < tendus; i++) fill[ordre[i]] = stats[ordre[i]];

  /* ENTRÉE — le jeu se dissout avant que le Geôlier prenne la parole. Tant
     que le voile n'a pas couvert, ce composant ne rend RIEN : c'est la scène
     du dessous qu'on voit se déliter, pas un écran qui recouvre l'autre. */
  useEffect(() => {
    if (phase !== "entree") return;
    voile.transiter(() => setPhase("demon"));
  }, [phase, voile]);

  /* La forme pousse d'elle-même, un axe à la fois. */
  useEffect(() => {
    if (phase !== "forme" || tendus >= ordre.length) return;
    const t = setTimeout(() => {
      haptic(6);
      setTendus((k) => k + 1);
    }, PAS);
    return () => clearTimeout(t);
  }, [phase, tendus, ordre.length]);

  /* Les quatre axes tendus, il rend son verdict puis la main. */
  useEffect(() => {
    if (phase !== "forme" || tendus < ORDRE.length || fini) return;
    const t = setTimeout(() => setFini(true), 700);
    return () => clearTimeout(t);
  }, [phase, tendus, fini]);

  /** Le tap pendant qu'il parle : finir la frappe, sinon passer au beat
      suivant, sinon basculer sur la forme (par le voile). */
  const suivant = useCallback(() => {
    if (phase === "forme") {
      // La forme est finie : le toucher rend la main. Tant qu'elle se dessine,
      // il ne fait rien — on ne saute pas le seul moment où le Geôlier montre
      // ce qu'il a compris.
      if (fini) onDone(stats);
      return;
    }
    if (phase !== "demon") return;
    if (!lu) {
      setSkip((k) => k + 1);
      return;
    }
    if (n + 1 < beats.length) {
      setN((k) => k + 1);
      setLu(false);
      return;
    }
    voile.transiter(() => setPhase("forme"));
  }, [phase, fini, onDone, stats, lu, n, beats.length, voile]);

  return (
    /* ⚠️ OVERLAY dans le cadre du jeu, jamais un second `<main>` : ce
       composant est monté DANS le phone-frame de la scène (comme l'écran de
       mort et le volet d'état). Un bloc en flux y serait ajouté à la suite du
       contenu et rogné par l'`overflow-clip` du cadre.
       Et il reste TRANSPARENT pendant l'entrée : c'est la scène du dessous
       qu'on doit voir se dissoudre. */
    <div
      className={`absolute inset-0 z-[70] flex flex-col justify-center overflow-clip ${
        phase === "demon" ? "bg-[var(--color-accent)]" : ""
      } ${phase === "forme" ? "bg-[var(--color-bg)]" : ""}`}
      onClick={suivant}
      data-revelation
    >
        {/* ─── LE DÉMON : l'écran du pacte, à l'identique (maquettes
            3450:3977 / 4033). Image animée de l'accueil à y=74, le socle
            charbon 201×96 qui efface le sceau de poitrine, la nappe qui
            reprend à y=464, la réplique centrée à y=444.
            ⚠️ `isolate` obligatoire : l'image du héros porte un z-index
            interne et s'échapperait par-dessus les nappes. */}
        {phase === "demon" && (
          <>
            <div className="absolute top-[74px] left-0 isolate h-[390px] w-[390px]">
              <HeroGeolier height={390} marge={0} sol={false} />
            </div>
            <div
              className="absolute top-[368px] left-[90px] h-[96px] w-[201px] bg-[var(--color-bg)]"
              aria-hidden
            />
            <div className="absolute inset-x-0 top-[464px] bottom-0 bg-[var(--color-bg)]" aria-hidden />
            <p className="absolute top-[444px] left-[42px] w-[306px] text-center font-mono text-[13px] leading-[1.3] text-[var(--color-ink)]">
              <TypedText
                key={n}
                text={beats[n]}
                typed
                msPerChar={42}
                skip={skip}
                onDone={() => setLu(true)}
              />
            </p>
            <TouchHint libelle={lu ? "Touche pour continuer" : "Touche pour tout afficher"} />
          </>
        )}

        {/* ─── LA FORME : elle se dessine, puis il commente, puis il rend la
            main par un lien — jamais par un tap n'importe où : c'est le seul
            écran du jeu où le joueur DÉCIDE de retourner marcher. */}
        {phase === "forme" && (
          <>
            <RadarEssence stats={stats} fill={fill} />
            {fini && (
              <>
                {/* ⚠️ TOUT LE TEXTE EN BLANC (retour Patrick 07/09). La clôture
                    était en orange : sur cet écran l'orange est déjà la
                    couleur de la FORME, et le mettre aussi sur une phrase la
                    faisait lire comme une deuxième donnée. Le blanc est la
                    voix, l'orange est la mesure. */}
                <p className="mx-auto mt-[26px] w-[306px] text-center font-mono text-[13px] leading-[1.6] text-[var(--color-ink)]">
                  {portraitDuSeuil(stats, engagementDepuisTendances(profil))}
                </p>
                <p className="mx-auto mt-[18px] w-[306px] text-center font-mono text-[13px] leading-[1.6] text-[var(--color-ink)]">
                  {CLOTURE}
                </p>
              </>
            )}
          </>
        )}

      {/* ⚠️ L'AFFORDANCE STANDARD, pas un lien souligné (retour Patrick
          07/09 : « même animation que sur les autres écrans et même style »).
          Le lien du 07/09 matin est retiré : un écran de PACTUM se quitte
          d'un toucher, partout, et cet écran-là ne fait pas exception. */}
      {phase === "forme" && fini && <TouchHint />}

      <VoilePixels etat={voile.etat} onFini={voile.onFini} />
    </div>
  );
}

/** Ce que le Geôlier retiendra de cette incarnation, pour comparer plus tard. */
export function dominanteLisible(p: ProfilRun): string {
  return dominante(p);
}
