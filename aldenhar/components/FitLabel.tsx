"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Libellé auto-ajusté (retour Patrick 16/07) : le texte d'un CTA doit être
 * visible EN ENTIER — jamais tronqué en « … ». C'est la taille du TEXTE qui
 * s'adapte, jamais celle du bouton : la police descend par demi-points
 * jusqu'à ce que le libellé tienne dans la place disponible (plancher `min`,
 * l'ellipsis du parent ne sert plus que d'ultime garde-fou).
 */
export default function FitLabel({
  text,
  max = 14,
  min = 8,
  className,
}: {
  text: string;
  max?: number;
  min?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let size = max;
    el.style.fontSize = `${size}px`;
    while (size > min && el.scrollWidth > el.clientWidth) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
  }, [text, max, min]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
