"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Texte tapé lettre par lettre (spec §16, ~12–18ms/caractère), interruptible
 * par tap. `typed=false` (entrées déjà lues du fil, ou en attente dans la
 * file de révélation séquentielle) affiche le texte entier d'emblée.
 * `onDone` prévient le parent pour enchaîner le bloc suivant de la file.
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- démarre l'animation de frappe d'une entrée fraîchement activée dans la file
    setShown(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) {
        clearInterval(id);
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
      }
    }, msPerChar);
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

  return <>{text.slice(0, shown)}</>;
}
