"use client";

import { useEffect, useRef, useState } from "react";
import { revealFactor } from "@/lib/settings";

/**
 * Texte tapé lettre par lettre (spec §16, ~12–18ms/caractère ; Geôlier 42ms),
 * interruptible par tap. `typed=false` (entrées déjà lues du fil, ou en
 * attente dans la file de révélation séquentielle) affiche le texte entier.
 * `onDone` prévient le parent pour enchaîner le bloc suivant de la file.
 * SKILL pactum-style §5 : curseur ▌ clignotant en steps(1) pendant la frappe ;
 * `prefers-reduced-motion` → texte instantané.
 */
export default function TypedText({
  text,
  typed,
  skip,
  msPerChar = 15,
  onDone,
}: {
  text: string;
  typed: boolean;
  /** Incrémenté par le parent à chaque tap dans le fil : termine l'animation en cours. */
  skip: number;
  msPerChar?: number;
  onDone?: () => void;
}) {
  const [shown, setShown] = useState(typed ? 0 : text.length);
  const doneRef = useRef(false);
  // Valeur de `skip` au moment où cette entrée devient active : un tap
  // antérieur (ex. celui qui a fait apparaître cette entrée en dismissant
  // le dé) ne doit jamais être lu comme une demande de sauter SON typage.
  const baseSkipRef = useRef(skip);

  useEffect(() => {
    doneRef.current = false;
    baseSkipRef.current = skip;
    if (!typed) return;
    // Apparition (Options 21/07) : `instantanee` → texte immédiat ; sinon
    // `factor` module la vitesse (lente ×2.2 / normale ×1). Le mouvement réduit
    // système force aussi l'instantané (SKILL §5, accessibilité).
    const factor = revealFactor();
    const prefersReduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (factor === 0 || prefersReduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- révélation instantanée (réglage ou préférence système)
      setShown(text.length);
      doneRef.current = true;
      onDone?.();
      return;
    }
    const stepMs = Math.max(4, Math.round(msPerChar * factor));
    setShown(0);
    let i = 0;
    const id = setInterval(() => {
      // Un tap (effet `skip` ci-dessous) peut avoir déjà terminé ce bloc :
      // sans cette garde, le tick suivant de l'intervalle écrasait le texte
      // complet par une tranche partielle, figeant le paragraphe à 2-3 mots.
      if (doneRef.current) {
        clearInterval(id);
        return;
      }
      i += 1;
      setShown(i);
      if (i >= text.length) {
        clearInterval(id);
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
      }
    }, stepMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, typed, msPerChar]);

  useEffect(() => {
    if (skip !== baseSkipRef.current && typed && !doneRef.current) {
      setShown(text.length);
      doneRef.current = true;
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  const typing = typed && shown < text.length;
  // Hors frappe active, toujours le texte entier — ceinture et bretelles
  // contre tout état `shown` partiel résiduel.
  return (
    <>
      {typed ? text.slice(0, shown) : text}
      {typing && (
        <span className="type-cursor" aria-hidden>
          ▌
        </span>
      )}
    </>
  );
}
