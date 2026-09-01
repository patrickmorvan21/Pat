"use client";

import { useState, type ComponentType } from "react";
import type { MiniGameEntry, Tier } from "@/lib/minigames-data";
import RubReveal from "./engines/RubReveal";
import GlyphTrace from "./engines/GlyphTrace";
import HoldSteady from "./engines/HoldSteady";
import TimingTap from "./engines/TimingTap";
import DialAlign from "./engines/DialAlign";
import RhythmTap from "./engines/RhythmTap";
import PickTarget from "./engines/PickTarget";
import SlowSwipe from "./engines/SlowSwipe";
import SequenceExecute from "./engines/SequenceExecute";
import StraightSwipe from "./engines/StraightSwipe";
import SteadyCaress from "./engines/SteadyCaress";
import SingleGesture from "./engines/SingleGesture";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ENGINES: Record<string, ComponentType<any>> = {
  rub: RubReveal,
  glyph: GlyphTrace,
  hold: HoldSteady,
  timing: TimingTap,
  dial: DialAlign,
  rhythm: RhythmTap,
  pick: PickTarget,
  slowSwipe: SlowSwipe,
  sequence: SequenceExecute,
  straightSwipe: StraightSwipe,
  caress: SteadyCaress,
  singleGesture: SingleGesture,
};

const TIERS: Tier[] = ["bas", "moyen", "haut"];

/**
 * Fait tourner un mini-jeu du catalogue en isolation, pour la revue (galerie
 * /minijeux). Le sélecteur de palier de stat rend visible le principe
 * directeur du catalogue : « le geste est l'habillage, la stat module la
 * difficulté » — pas un simple bouton Réessayer.
 */
export default function MiniGamePlayer({ entry }: { entry: MiniGameEntry }) {
  const [tier, setTier] = useState<Tier>("moyen");
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ success: boolean; text: string } | null>(null);
  const Engine = ENGINES[entry.engine];

  function retry(nextTier?: Tier) {
    if (nextTier) setTier(nextTier);
    setResult(null);
    setAttempt((a) => a + 1);
  }

  return (
    <div className="mg-card">
      <div className="mg-head">
        <span className="mg-num">{entry.number > 0 ? `#${String(entry.number).padStart(2, "0")}` : "réf."}</span>
        <h3>{entry.title}</h3>
        <span className="mg-stat">{entry.stat}</span>
      </div>
      {entry.lieu && <p className="mg-lieu">{entry.lieu}</p>}
      {entry.note && <p className="mg-note">{entry.note}</p>}
      <p className="mg-desc">{entry.description}</p>
      <div className="mg-tiers">
        {TIERS.map((t) => (
          <button
            key={t}
            className={`mg-tier-btn ${tier === t ? "active" : ""}`}
            onClick={() => retry(t)}
          >
            {t === "bas" ? "Stat basse" : t === "moyen" ? "Stat moyenne" : "Stat haute"}
          </button>
        ))}
      </div>
      <div className="mg-stage">
        {Engine && (
          <Engine
            key={`${attempt}-${tier}`}
            seed={`${entry.id}-${attempt}-${tier}`}
            config={entry.configFor(tier)}
            onResult={(success: boolean) =>
              setResult({ success, text: success ? entry.successText : entry.failText })
            }
          />
        )}
        {result && (
          <div className={`mg-result ${result.success ? "ok" : "fail"}`}>
            <p className="mg-verdict">{result.success ? "RÉUSSITE" : "ÉCHEC"}</p>
            {result.text && <p className="mg-flavor">{result.text}</p>}
            <button className="mg-retry" onClick={() => retry()}>
              Réessayer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
