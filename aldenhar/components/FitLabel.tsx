"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * Libellé auto-ajusté (retour Patrick 16/07) : le texte d'un CTA doit être
 * visible EN ENTIER — jamais tronqué en « … ». C'est la taille du TEXTE qui
 * s'adapte, jamais celle du bouton : la police descend par demi-points
 * jusqu'à ce que le libellé tienne dans la place disponible (plancher `min`,
 * l'ellipsis du parent ne sert plus que d'ultime garde-fou).
 *
 * ⚠️ CE COMPOSANT NE FAISAIT RIEN — DÉFAUT TROUVÉ LE 12/08, ET IL ÉTAIT
 * GÉNÉRAL. L'ajustement tournait dans un seul `useLayoutEffect` au montage,
 * or la barre de choix est en `display: none` pendant toute la frappe du
 * texte (règle du 16/07). Un élément dans un parent masqué a
 * `clientWidth === 0` ET `scrollWidth === 0` : la condition `scrollWidth >
 * clientWidth` était donc FAUSSE, la boucle ne s'exécutait jamais, et la
 * police restait à `max`. Quand la barre réapparaissait, plus rien ne
 * re-mesurait.
 *
 * Ça ne se voyait que sur les libellés assez longs pour déborder à 14 px —
 * un seul dans toute la zone (« Pourquoi les pointes vers l'intérieur ? »,
 * qui débordait de 38 px). Mais le rétrécisseur était mort sur TOUS les
 * boutons, et chaque futur libellé un peu long serait sorti tronqué.
 *
 * Correctif : on refait l'ajustement à chaque fois que l'élément acquiert
 * (ou change) une largeur réelle, via un `ResizeObserver`. C'est ce qui
 * arrive au moment précis où la barre repasse en `flex`.
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

  const ajuster = useCallback(() => {
    const el = ref.current;
    // Largeur nulle = parent encore masqué : mesurer maintenant ne dirait
    // rien, et figerait la police à `max`. On attend le passage en visible,
    // que le ResizeObserver ci-dessous nous signalera.
    if (!el || el.clientWidth === 0) return;
    let size = max;
    el.style.fontSize = `${size}px`;
    while (size > min && el.scrollWidth > el.clientWidth) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
  }, [max, min]);

  useLayoutEffect(() => {
    ajuster();
  }, [text, ajuster]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => ajuster());
    ro.observe(el);
    return () => ro.disconnect();
  }, [ajuster]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
