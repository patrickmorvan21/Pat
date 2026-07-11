"use client";

import { useEffect, useRef, useState } from "react";
import type { SurpriseEntry } from "@/lib/surprises-data";
import { bayerFill, CHARBON, DRAMA, ORANGE } from "@/lib/dither";

function ErosionChoicePreview() {
  const [run, setRun] = useState(0);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- réamorce la démo à chaque "Rejouer"
    setGone(false);
    const t = setTimeout(() => setGone(true), 2600);
    return () => clearTimeout(t);
  }, [run]);
  return (
    <div className="surprise-stage surprise-choices">
      <div className="surprise-choice">Pousser la porte balafrée</div>
      <div className="surprise-choice">Écouter, immobile</div>
      <div className={`surprise-choice expiring ${gone ? "gone" : ""}`}>
        Rebrousser chemin
        {!gone && <span className="expire-bar" />}
      </div>
      <button className="mg-retry" onClick={() => setRun((r) => r + 1)}>
        Rejouer l&apos;hésitation
      </button>
    </div>
  );
}

function ErosionDeathPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<"eroding" | "inspiration">("eroding");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- réamorce la démo à chaque "Rejouer"
    setPhase("eroding");
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let t = 0;
    function draw() {
      raf = requestAnimationFrame(draw);
      t += 0.012;
      const density = Math.min(1, t);
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, 300, 160);
      for (let y = 0; y < 160; y += 3) {
        for (let x = 0; x < 300; x += 3) {
          bayerFill(ctx, x, y, 3, 3, density * 0.9, ORANGE, null, 3);
        }
      }
      if (t >= 1.4) {
        cancelAnimationFrame(raf);
        setPhase("inspiration");
      }
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [run]);
  return (
    <div className="surprise-stage">
      <canvas ref={canvasRef} width={300} height={160} className="minigame-canvas" />
      {phase === "inspiration" && <p className="inspiration-text">…une inspiration.</p>}
      <button className="mg-retry" onClick={() => setRun((r) => r + 1)}>
        Rejouer
      </button>
    </div>
  );
}

function DayThreatPreview() {
  const [threatened, setThreatened] = useState(false);
  return (
    <div className="surprise-stage">
      <p className="day-chip" style={{ color: threatened ? DRAMA : "var(--color-ink, #fff)" }}>
        — Jour {threatened ? 6 : 2} —
      </p>
      <p className="surprise-caption">
        {threatened
          ? "Le Geôlier a annoncé le Jour VII. Le jour approche — la puce vire au brique."
          : "Jour ordinaire, aucune menace annoncée."}
      </p>
      <button className="mg-retry" onClick={() => setThreatened((v) => !v)}>
        {threatened ? "Revenir à un jour ordinaire" : "Approcher du jour annoncé"}
      </button>
    </div>
  );
}

function GhostChoicePreview() {
  const [run, setRun] = useState(0);
  const [show, setShow] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- réamorce la démo à chaque invocation
    setShow(true);
    const t = setTimeout(() => setShow(false), 900);
    return () => clearTimeout(t);
  }, [run]);
  return (
    <div className="surprise-stage surprise-choices">
      <div className="surprise-choice">Pousser la porte balafrée</div>
      <div className="surprise-choice">Écouter, immobile</div>
      <div className="surprise-choice">Rebrousser chemin</div>
      {show && <div className="surprise-choice ghost">???</div>}
      <button className="mg-retry" onClick={() => setRun((r) => r + 1)}>
        Invoquer le 4ᵉ choix
      </button>
    </div>
  );
}

function AshRainPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const ash = new Float32Array(30 * 18);
    let raf = 0;
    let dragging = false;
    function pos(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * 300, y: ((e.clientY - r.top) / r.height) * 160 };
    }
    function clearAt(p: { x: number; y: number }) {
      const cx = Math.floor(p.x / 10),
        cy = Math.floor(p.y / (160 / 18));
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const x = cx + dx,
            y = cy + dy;
          if (x < 0 || y < 0 || x >= 30 || y >= 18) continue;
          ash[y * 30 + x] = Math.max(0, ash[y * 30 + x] - 0.4);
        }
    }
    function onDown(e: PointerEvent) {
      dragging = true;
      clearAt(pos(e));
    }
    function onMove(e: PointerEvent) {
      if (dragging) clearAt(pos(e));
    }
    function onUp() {
      dragging = false;
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    function draw() {
      raf = requestAnimationFrame(draw);
      for (let i = 0; i < ash.length; i++) ash[i] = Math.min(1, ash[i] + 0.0006);
      ctx.fillStyle = CHARBON;
      ctx.fillRect(0, 0, 300, 160);
      ctx.fillStyle = "rgba(232,223,200,0.5)";
      ctx.font = "12px 'VT323', monospace";
      ctx.textAlign = "center";
      ctx.fillText("Le couloir continue, silencieux.", 150, 80);
      for (let y = 0; y < 18; y++)
        for (let x = 0; x < 30; x++) {
          const d = ash[y * 30 + x];
          if (d > 0.03) bayerFill(ctx, x * 10, y * (160 / 18), 10, 9, d, ORANGE, null, 2);
        }
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);
  return (
    <div className="surprise-stage">
      <canvas ref={canvasRef} width={300} height={160} className="minigame-canvas" style={{ touchAction: "none" }} />
      <p className="surprise-caption">Frotte pour dégager la cendre qui s&apos;accumule.</p>
    </div>
  );
}

export default function SurprisePreview({ entry }: { entry: SurpriseEntry }) {
  return (
    <div className="mg-card">
      <div className="mg-head">
        <span className="mg-num">#{String(entry.number).padStart(2, "0")}</span>
        <h3>{entry.title}</h3>
        {entry.founding && <span className="mg-stat founding">fondatrice</span>}
        {entry.onceOnly && <span className="mg-stat once">1×/joueur</span>}
      </div>
      <p className="mg-desc">{entry.description}</p>
      {entry.previewKind === "erosion-choice" && <ErosionChoicePreview />}
      {entry.previewKind === "erosion-death" && <ErosionDeathPreview />}
      {entry.previewKind === "day-threat" && <DayThreatPreview />}
      {entry.previewKind === "ghost-choice" && <GhostChoicePreview />}
      {entry.previewKind === "ash-rain" && <AshRainPreview />}
      {entry.previewKind === "text-mock" && (
        <div className="surprise-stage surprise-textmock">
          {entry.mockLines?.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
      )}
    </div>
  );
}
