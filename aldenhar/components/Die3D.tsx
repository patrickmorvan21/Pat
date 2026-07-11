"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Outcome, Outcomes } from "@/lib/scene-data";

/**
 * Dé d20 tactile — moteur repris de reference/REFERENCE_de_3d_tactile.html
 * (physique, seuils de geste, calibrations et rendu inchangés).
 *
 * Intégration au parcours Figma (écran 124:2178) :
 *  - le dé est caché au repos ; il apparaît, voilé, quand un choix risqué est
 *    cliqué (prop `request`), centré sous les choix avec « Lancer le dé » ;
 *  - saisie sur le dé uniquement (même hit-test que la référence), lancer à
 *    l'élan réel, rebonds, verdict avec face inversée, puis le dé disparaît
 *    et `onComplete` est appelé pour enchaîner la scène suivante ;
 *  - couleurs prises dans les tokens (faces orange, chiffres/arêtes nuit).
 */

export type RollRequest = {
  key: number;
  stat: string;
  threshold: number;
  outcomes: Outcomes;
  /** Somme des états narratifs temporaires (Aguerri +2, Entaillé −2…). */
  modifier: number;
  /** Nom de l'état actif, affiché dans le hint (jamais de chiffre). */
  effectLabel?: string;
};

type Props = {
  request: RollRequest | null;
  onComplete?: (result: number, outcome: Outcome) => void;
};

export default function Die3D({ request, onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const verdictRef = useRef<HTMLDivElement>(null);
  const vWordRef = useRef<HTMLDivElement>(null);
  const vOutRef = useRef<HTMLParagraphElement>(null);

  const requestRef = useRef<RollRequest | null>(null);
  const onCompleteRef = useRef(onComplete);
  const activateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Moteur monté une seule fois ; l'activation passe par activateRef.
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const hint = hintRef.current;
    const flash = flashRef.current;
    const veil = veilRef.current;
    const verdict = verdictRef.current;
    const vWord = vWordRef.current;
    const vOut = vOutRef.current;
    if (!root || !canvas || !hint || !flash || !veil || !verdict || !vWord || !vOut) return;

    const phone = root.closest(".phone-frame") as HTMLElement | null;
    const stage = phone ?? root;

    const PIXEL_FACTOR = 2.4;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    renderer.setPixelRatio(1);
    renderer.setSize(Math.floor(W / PIXEL_FACTOR), Math.floor(H / PIXEL_FACTOR), false);

    const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 1, 1000);
    camera.position.z = 500;
    const scene = new THREE.Scene();

    const styles = getComputedStyle(stage);
    const token = (name: string, fallback: string) =>
      styles.getPropertyValue(name).trim() || fallback;
    const INK = token("--die-ink", "#1c1a16");
    const FACE = token("--die-face", "#e0632a");
    const FACE_SHADE = token("--die-face-shade", "#a94a20");
    const REVEAL_NUM = token("--die-reveal", "#e0632a");

    function faceTexture(n: number, shade: number, inverted: boolean) {
      const s = 96;
      const c = document.createElement("canvas");
      c.width = c.height = s;
      const ctx = c.getContext("2d")!;
      if (inverted) {
        ctx.fillStyle = INK;
        ctx.fillRect(0, 0, s, s);
      } else {
        ctx.fillStyle = shade >= 1 ? FACE_SHADE : FACE;
        ctx.fillRect(0, 0, s, s);
        if (shade === 1) {
          ctx.fillStyle = INK;
          for (let y = 0; y < s; y += 8)
            for (let x = (y / 8) % 2 ? 4 : 0; x < s; x += 8) ctx.fillRect(x, y, 3, 3);
        } else if (shade === 2) {
          ctx.fillStyle = INK;
          for (let y = 0; y < s; y += 6)
            for (let x = (y / 6) % 2 ? 3 : 0; x < s; x += 6) ctx.fillRect(x, y, 3, 3);
        }
      }
      ctx.fillStyle = inverted ? REVEAL_NUM : INK;
      ctx.font = 'bold 42px "VT323", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n), s / 2, s / 2 + 12);
      const tx = new THREE.CanvasTexture(c);
      // Sans ça, Three.js interprète le canvas comme linéaire et délave
      // l'orange #e0632a en saumon pâle au rendu.
      tx.colorSpace = THREE.SRGBColorSpace;
      tx.magFilter = THREE.NearestFilter;
      tx.minFilter = THREE.NearestFilter;
      return tx;
    }

    const R = 44;
    const geo = new THREE.IcosahedronGeometry(R, 0);
    geo.clearGroups();
    const mats: THREE.MeshBasicMaterial[] = [];
    const uvs: number[] = [];
    for (let i = 0; i < 20; i++) {
      geo.addGroup(i * 3, 3, i);
      mats.push(new THREE.MeshBasicMaterial({ map: faceTexture(i + 1, i % 3, false) }));
      uvs.push(0.5, 1, 0.06, 0.1, 0.94, 0.1);
    }
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    const die = new THREE.Mesh(geo, mats);
    // Le dé flotte en permanence au-dessus de la scène (spec §4) —
    // jamais d'écran dédié, jamais caché.
    die.visible = true;
    scene.add(die);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: new THREE.Color(INK) })
    );
    die.add(edges);

    // Position d'attente : centre x, dé ~83px sous les choix (Figma 124:3299).
    const READY = { x: 0, y: -(H / 2) + 136, scale: 0.94 };
    // Position de résultat (Figma 128:4122) : le dé revient se poser juste
    // au-dessus du verdict, même taille qu'au repos.
    const CENTER = { x: 0, y: -(H / 2) + 146, scale: 0.94 };

    // idle : flotte, non saisissable. armed : voile + hint, saisissable (armement §4).
    let state = "idle";
    let pos = { x: READY.x, y: READY.y };
    let vel = { x: 0, y: 0 };
    let angVel = { x: 0.01, y: 0.017, z: 0 };
    let dieScale = READY.scale;
    const DAMP = 0.985,
      ROLL_FRICTION = 0.9,
      STOP_SPEED = 0.85;
    const MARGIN = R * 0.6;
    const bounds = { x: W / 2 - MARGIN, y: H / 2 - MARGIN };
    const squash = { axis: "x", amount: 0 };
    let history: { x: number; y: number; t: number }[] = [];
    let grabOffset = { x: 0, y: 0 };
    let result = 0,
      settleQuat: THREE.Quaternion | null = null,
      settleT = 0,
      revealT = 0;

    function resetFaces() {
      if (result > 0) {
        mats[result - 1].map = faceTexture(result, (result - 1) % 3, false);
        mats[result - 1].needsUpdate = true;
        result = 0;
      }
    }

    activateRef.current = () => {
      resetFaces();
      angVel = { x: 0.01, y: 0.017, z: 0 };
      state = "armed";
      veil.classList.add("on");
      // Dé armé : le hint porte la stat en jeu (+ état narratif actif), en accent
      const req = requestRef.current;
      const stat = req?.stat;
      const effect = req?.effectLabel ? ` · ${req.effectLabel}` : "";
      hint.textContent = stat ? `Lance le dé — ${stat}${effect}` : "Lance le dé";
      hint.classList.add("accent");
      hint.classList.remove("hidden");
      verdict.classList.remove("show");
    };

    /** Verdict retenu au moment du jet (naturel pour les critiques, modifié sinon). */
    let chosen: Outcome = { word: "", fail: false, text: "" };
    function resolveOutcome(): Outcome {
      const req = requestRef.current;
      if (!req) return { word: "", fail: false, text: "" };
      const effective = Math.max(1, Math.min(20, result + (req.modifier || 0)));
      if (result === 20) return req.outcomes.critSuccess;
      if (result === 1) return req.outcomes.critFail;
      if (effective >= req.threshold) return req.outcomes.success;
      return req.outcomes.fail;
    }

    function dismissResult() {
      state = "idle";
      veil!.classList.remove("on");
      verdict!.classList.remove("show");
      hint!.classList.add("hidden");
      onCompleteRef.current?.(result, chosen);
    }

    function toStage(e: MouseEvent | TouchEvent) {
      const r = canvas!.getBoundingClientRect();
      const cx = ("touches" in e ? e.touches[0].clientX : e.clientX) - r.left;
      const cy = ("touches" in e ? e.touches[0].clientY : e.clientY) - r.top;
      return { x: cx - W / 2, y: -(cy - H / 2), t: performance.now() };
    }

    function onDown(e: MouseEvent | TouchEvent) {
      // Écran de résultat : « Touche pour continuer » — un toucher n'importe où.
      if (state === "reveal") {
        e.preventDefault();
        dismissResult();
        return;
      }
      if (state !== "armed") return;
      const p = toStage(e);
      const dx = p.x - pos.x,
        dy = p.y - pos.y;
      if (Math.hypot(dx, dy) > R * dieScale * 1.7) return;
      e.preventDefault();
      state = "held";
      hint!.classList.add("hidden");
      grabOffset = { x: dx, y: dy };
      history = [p];
      if (navigator.vibrate) navigator.vibrate(10);
    }
    function onMove(e: MouseEvent | TouchEvent) {
      if (state !== "held") return;
      e.preventDefault();
      const p = toStage(e);
      history.push(p);
      if (history.length > 6) history.shift();
      pos.x = p.x - grabOffset.x;
      pos.y = p.y - grabOffset.y;
      const prev = history[history.length - 2] || p;
      angVel.x = -(p.y - prev.y) * 0.005;
      angVel.y = (p.x - prev.x) * 0.005;
    }
    function onUp() {
      if (state !== "held") return;
      const now = performance.now();
      const recent = history.filter((h) => now - h.t < 110);
      if (recent.length < 2) {
        state = "returning";
        hint!.classList.remove("hidden");
        return;
      }
      const first = recent[0],
        last = recent[recent.length - 1];
      const dt = Math.max(last.t - first.t, 16) / 16.7;
      const vx = (last.x - first.x) / dt,
        vy = (last.y - first.y) / dt;
      const speed = Math.hypot(vx, vy);
      if (speed < 2.5) {
        state = "returning";
        hint!.classList.remove("hidden");
        return;
      }
      state = "flying";
      vel = { x: vx * 1.25, y: vy * 1.25 };
      angVel = { x: -vel.y * 0.007, y: vel.x * 0.007, z: (Math.random() - 0.5) * 0.05 };
      if (navigator.vibrate) navigator.vibrate(20);
    }
    // Écouteurs sur le conteneur (hit-test identique) : le dé n'est saisissable
    // qu'en le touchant lui-même, et les choix restent cliquables.
    stage.addEventListener("mousedown", onDown);
    stage.addEventListener("touchstart", onDown, { passive: false });
    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);

    // Effet de choc aux bords : écrasement du dé, onde blanche qui parcourt
    // tout le côté touché, et micro-secousse du cadre sur les gros impacts.
    type Side = "left" | "right" | "top" | "bottom";
    function spawnImpact(side: Side, impactSpeed: number) {
      squash.axis = side === "left" || side === "right" ? "x" : "y";
      squash.amount = Math.min(0.4, 0.12 + impactSpeed * 0.015);
      const wave = document.createElement("div");
      const horizontal = side === "top" || side === "bottom";
      wave.className = `edge-wave ${horizontal ? "h" : "v"} ${side}`;
      const thickness = Math.min(26, 8 + impactSpeed * 1.4);
      if (horizontal) wave.style.height = `${thickness}px`;
      else wave.style.width = `${thickness}px`;
      root!.appendChild(wave);
      setTimeout(() => wave.remove(), 360);
      if (impactSpeed > 8) {
        stage.classList.remove("bump");
        void (stage as HTMLElement).offsetWidth;
        stage.classList.add("bump");
        setTimeout(() => stage.classList.remove("bump"), 160);
      }
    }

    function onBounce(side: Side, impactSpeed: number) {
      if (navigator.vibrate)
        navigator.vibrate(Math.min(55, Math.max(8, Math.round(impactSpeed * 3.2))));
      spawnImpact(side, impactSpeed);
      // Le "choc" validé (CLAUDE.md) : la rotation change de sens en fonction
      // du rebond — couplée à la vitesse linéaire — plus un petit bruit pour
      // éviter un rebond mécanique. Pas un simple ajout de random.
      angVel.x = -vel.y * 0.01 + (Math.random() - 0.5) * 0.02;
      angVel.y = vel.x * 0.01 + (Math.random() - 0.5) * 0.02;
      angVel.z += (Math.random() - 0.5) * 0.04 * (impactSpeed / 10);
    }

    function beginSettle() {
      state = "settling";
      result = 1 + Math.floor(Math.random() * 20);
      const posAttr = geo.getAttribute("position");
      const fi = (result - 1) * 3;
      const a = new THREE.Vector3().fromBufferAttribute(posAttr, fi);
      const b = new THREE.Vector3().fromBufferAttribute(posAttr, fi + 1);
      const c = new THREE.Vector3().fromBufferAttribute(posAttr, fi + 2);
      const normal = new THREE.Vector3()
        .crossVectors(
          new THREE.Vector3().subVectors(b, a),
          new THREE.Vector3().subVectors(c, a)
        )
        .normalize();
      settleQuat = new THREE.Quaternion().setFromUnitVectors(
        normal,
        new THREE.Vector3(0, 0, 1)
      );
      settleT = 0;
    }

    function finishRoll() {
      state = "reveal";
      revealT = 0;
      mats[result - 1].map = faceTexture(result, 0, true);
      mats[result - 1].needsUpdate = true;
      const o = resolveOutcome();
      chosen = o;
      flash!.className = "die-flash";
      if (result === 20) {
        void flash!.offsetWidth;
        flash!.classList.add("crit-success");
        if (navigator.vibrate) navigator.vibrate([30, 40, 80]);
      }
      if (result === 1) {
        void flash!.offsetWidth;
        flash!.classList.add("crit-fail");
        phone?.classList.add("quake");
        setTimeout(() => phone?.classList.remove("quake"), 450);
        if (navigator.vibrate) navigator.vibrate([80, 40, 120]);
      }
      // FUNESTE (1 naturel) porte le rouge dramatique ; les autres restent en accent.
      vWord!.textContent = o.word;
      vWord!.className = "word " + (result === 1 ? "funeste" : o.fail ? "fail" : "");
      verdict!.classList.add("show");
      hint!.textContent = "Touche pour continuer";
      hint!.classList.remove("accent");
      hint!.classList.remove("hidden");
    }

    let t = 0;
    let raf = 0;
    function loop() {
      raf = requestAnimationFrame(loop);
      t += 0.016;
      if (state === "idle" || state === "armed" || state === "returning") {
        pos.x += (READY.x - pos.x) * 0.1;
        pos.y += (READY.y - pos.y) * 0.1 + Math.sin(t * 2) * 0.06;
        dieScale += (READY.scale - dieScale) * 0.1;
        die.rotation.x += 0.004;
        die.rotation.y += 0.007;
        if (state === "returning" && Math.hypot(READY.x - pos.x, READY.y - pos.y) < 2)
          state = "armed";
      } else if (state === "held") {
        dieScale += (1 - dieScale) * 0.15;
        die.rotation.x += angVel.x;
        die.rotation.y += angVel.y;
      } else if (state === "flying") {
        pos.x += vel.x;
        pos.y += vel.y;
        vel.x *= DAMP;
        vel.y *= DAMP;
        die.rotation.x += angVel.x;
        die.rotation.y += angVel.y;
        die.rotation.z += angVel.z;
        angVel.x *= 0.994;
        angVel.y *= 0.994;
        angVel.z *= 0.99;
        let impact = 0;
        if (pos.x > bounds.x) {
          impact = Math.abs(vel.x);
          pos.x = bounds.x;
          vel.x *= -(0.62 + Math.min(0.16, impact * 0.008));
          vel.y *= ROLL_FRICTION;
          onBounce("right", impact);
        }
        if (pos.x < -bounds.x) {
          impact = Math.abs(vel.x);
          pos.x = -bounds.x;
          vel.x *= -(0.62 + Math.min(0.16, impact * 0.008));
          vel.y *= ROLL_FRICTION;
          onBounce("left", impact);
        }
        if (pos.y > bounds.y) {
          impact = Math.abs(vel.y);
          pos.y = bounds.y;
          vel.y *= -(0.62 + Math.min(0.16, impact * 0.008));
          vel.x *= ROLL_FRICTION;
          onBounce("top", impact);
        }
        if (pos.y < -bounds.y) {
          impact = Math.abs(vel.y);
          pos.y = -bounds.y;
          vel.y *= -(0.62 + Math.min(0.16, impact * 0.008));
          vel.x *= ROLL_FRICTION;
          onBounce("bottom", impact);
        }
        if (Math.hypot(vel.x, vel.y) < STOP_SPEED) beginSettle();
      } else if (state === "settling") {
        settleT += 0.03;
        pos.x += (CENTER.x - pos.x) * 0.11;
        pos.y += (CENTER.y - pos.y) * 0.11;
        dieScale += (CENTER.scale - dieScale) * 0.1;
        die.quaternion.slerp(settleQuat!, 0.14);
        if (settleT >= 1.7) {
          die.quaternion.copy(settleQuat!);
          pos = { x: CENTER.x, y: CENTER.y };
          finishRoll();
        }
      } else if (state === "reveal") {
        // Écran de résultat (128:4122) : le dé flotte sur place jusqu'au toucher.
        revealT += 0.016;
        pos.y = CENTER.y + Math.sin(t * 2) * 1.2;
      }
      squash.amount *= 0.85;
      const sx = squash.axis === "x" ? 1 - squash.amount : 1 + squash.amount * 0.5;
      const sy = squash.axis === "y" ? 1 - squash.amount : 1 + squash.amount * 0.5;
      die.scale.set(sx * dieScale, sy * dieScale, dieScale);
      die.position.set(pos.x, pos.y, 0);
      renderer.render(scene, camera);
    }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      activateRef.current = null;
      stage.removeEventListener("mousedown", onDown);
      stage.removeEventListener("touchstart", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      geo.dispose();
      mats.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
      renderer.dispose();
    };
  }, []);

  // Activation quand un choix risqué est cliqué.
  useEffect(() => {
    requestRef.current = request;
    if (request) activateRef.current?.();
  }, [request]);

  return (
    <div ref={rootRef} className="absolute inset-0 pointer-events-none">
      <div ref={veilRef} className="die-veil" />
      <canvas ref={canvasRef} className="die-canvas" />
      <div ref={hintRef} className="die-hint hidden">
        Lancer le dé
      </div>
      <div ref={flashRef} className="die-flash" />
      <div ref={verdictRef} className="die-verdict">
        <div ref={vWordRef} className="word" />
        <p ref={vOutRef} className="outcome hidden" />
      </div>
    </div>
  );
}
