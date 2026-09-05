"use client";

/**
 * LE VOILE DE PIXELS — la transition entre deux écrans.
 *
 * Retour Patrick (05/09) : « je veux que de manière générale entre les écrans
 * il y ait une transition, tous les pixels se dissolvent pour se reconstituer
 * à l'écran suivant, au lieu de passer sans transition d'un écran à un autre
 * — sauf quand c'est le démon qui parle d'une phrase à l'autre. »
 *
 * Comment ça marche : un canvas plein cadre en demi-résolution (upscalé ×2 en
 * `pixelated`, comme le dé) se remplit de charbon par DENSITÉ croissante, on
 * échange l'écran dessous pendant qu'il est plein, puis il se vide par densité
 * décroissante. Chaque pixel a un seuil tiré une fois : il apparaît quand la
 * progression le dépasse. C'est ce seuil qui donne le grain organique — un
 * remplissage régulier lirait comme un store qui descend.
 *
 * ⚠️ Rien n'est jamais animé en OPACITÉ (règle DA : zéro dégradé). La
 * progression avance par PALIERS (`PAS` étapes), pas image par image.
 *
 * ⚠️ Ce voile ne se joue PAS entre deux répliques du Geôlier : là, l'écran ne
 * change pas, c'est la même scène qui continue de parler. Les appelants en
 * décident (voir `Prologue`), le composant ne devine rien.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { animReduced } from "@/lib/settings";

/** Demi-résolution : un pixel de voile = 2 px à l'écran. */
const W = 195;
const H = 424;
/** Paliers de chaque moitié du geste, et durée d'un palier.
    ⚠️ ~200 ms par moitié, pas plus : le contenu change au MILIEU du geste,
    donc c'est ce chiffre-là que le joueur attend avant de voir l'écran
    suivant. Au-delà, la transition cesse d'être une respiration et devient
    une attente — exactement ce que la passe de cadence a retiré ailleurs. */
const PAS = 7;
const MS = 28;

export type EtatVoile = "ferme" | "ouvre" | null;

/**
 * `etat` : "ferme" (l'écran se dissout), "ouvre" (il se reconstitue), null
 * (rien à l'écran). `onFini` est appelé à la fin du geste demandé.
 */
export default function VoilePixels({
  etat,
  onFini,
}: {
  etat: EtatVoile;
  onFini?: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const seuils = useRef<Float32Array | null>(null);
  const finRef = useRef(onFini);
  // ⚠️ Synchronisé dans un effet, jamais au rendu : le compilateur React
  // refuse d'écrire dans un ref pendant le rendu. Déclaré AVANT l'effet
  // d'animation pour qu'il soit à jour quand celui-ci démarre.
  useEffect(() => {
    finRef.current = onFini;
  }, [onFini]);

  useEffect(() => {
    if (!etat) return;
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    // Le seuil de chaque pixel, tiré une seule fois pour toute la session :
    // les deux moitiés du geste partagent le même grain, donc ce qui part en
    // premier revient en dernier — le voile se « déchire » au même endroit.
    if (!seuils.current) {
      const s = new Float32Array(W * H);
      for (let i = 0; i < s.length; i++) s[i] = Math.random();
      seuils.current = s;
    }
    const S = seuils.current;

    // Animations réduites : pas de geste, on couvre ou on découvre d'un coup.
    if (animReduced()) {
      ctx.clearRect(0, 0, W, H);
      if (etat === "ferme") {
        ctx.fillStyle = "#1c1a16";
        ctx.fillRect(0, 0, W, H);
      }
      const id = setTimeout(() => finRef.current?.(), 16);
      return () => clearTimeout(id);
    }

    let k = 0;
    let timer = 0;
    function frame() {
      const t = etat === "ferme" ? k / PAS : 1 - k / PAS;
      ctx!.clearRect(0, 0, W, H);
      ctx!.fillStyle = "#1c1a16";
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (S[y * W + x] < t) ctx!.fillRect(x, y, 1, 1);
        }
      }
      k += 1;
      if (k > PAS) {
        finRef.current?.();
        return;
      }
      timer = window.setTimeout(frame, MS);
    }
    frame();
    return () => clearTimeout(timer);
  }, [etat]);

  if (!etat) return null;
  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[90] h-full w-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

/**
 * LE VA-ET-VIENT COMPLET, pour un appelant qui change d'écran.
 *
 * `transiter(fn)` ferme le voile, exécute `fn` (le changement d'écran) une
 * fois l'écran couvert, puis rouvre. Un appel pendant qu'un voile est déjà en
 * cours est ignoré : deux transitions qui se chevauchent laisseraient le
 * canvas à mi-course.
 */
export function useVoile(): {
  etat: EtatVoile;
  transiter: (fn: () => void) => void;
  onFini: () => void;
} {
  const [etat, setEtat] = useState<EtatVoile>(null);
  const suite = useRef<(() => void) | null>(null);
  /** ⚠️ L'état en cours est lu dans un REF, pas dans le state : React
      double-invoque les fonctions de mise à jour, et poser `suite.current`
      dedans l'écraserait deux fois. */
  const enCours = useRef<EtatVoile>(null);

  const transiter = useCallback((fn: () => void) => {
    if (enCours.current) return; // un voile est déjà en cours
    suite.current = fn;
    enCours.current = "ferme";
    setEtat("ferme");
  }, []);

  const onFini = useCallback(() => {
    if (enCours.current === "ferme") {
      suite.current?.();
      suite.current = null;
      enCours.current = "ouvre";
      setEtat("ouvre");
      return;
    }
    enCours.current = null;
    setEtat(null);
  }, []);

  return { etat, transiter, onFini };
}
