"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Outcome, Scene } from "@/lib/scene-data";

/**
 * Dé d20 tactile — moteur repris tel quel de reference/REFERENCE_de_3d_tactile.html
 * (physique, seuils, calibrations et machine à états inchangés).
 *
 * Adaptations d'intégration (sans impact sur la physique) :
 *  - Three.js en dépendance npm au lieu du CDN r128 (mêmes APIs).
 *  - Les écouteurs pointer sont attachés au conteneur avec le même hit-test
 *    (distance au dé) au lieu d'un canvas plein écran qui bloquait les clics
 *    sur les choix — le canvas est en pointer-events: none.
 *  - Couleurs et textes de verdict injectés via props/tokens.
 *  - IDLE.y adapté à la hauteur de la frame Figma (848px vs 800px) pour que
 *    le dé flotte au repos juste au-dessus des choix, comme dans la référence.
 */

type Props = {
  threshold: number;
  outcomes: Scene["outcomes"];
  onResult?: (result: number, outcome: Outcome) => void;
};

export default function Die3D({ threshold, outcomes, onResult }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const verdictRef = useRef<HTMLDivElement>(null);
  const vWordRef = useRef<HTMLDivElement>(null);
  const vOutRef = useRef<HTMLParagraphElement>(null);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

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

    const SEUIL = threshold;
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
    const NUIT = styles.getPropertyValue("--color-night").trim() || "#211e33";
    const SABLE = styles.getPropertyValue("--color-sand").trim() || "#d8a25f";
    const SABLE_OMBRE = styles.getPropertyValue("--color-sand-shade").trim() || "#b3854c";

    function faceTexture(n: number, shade: number, inverted: boolean) {
      const s = 96;
      const c = document.createElement("canvas");
      c.width = c.height = s;
      const ctx = c.getContext("2d")!;
      if (inverted) {
        ctx.fillStyle = NUIT;
        ctx.fillRect(0, 0, s, s);
      } else {
        ctx.fillStyle = shade >= 1 ? SABLE_OMBRE : SABLE;
        ctx.fillRect(0, 0, s, s);
        if (shade === 1) {
          ctx.fillStyle = NUIT;
          for (let y = 0; y < s; y += 8)
            for (let x = (y / 8) % 2 ? 4 : 0; x < s; x += 8) ctx.fillRect(x, y, 3, 3);
        } else if (shade === 2) {
          ctx.fillStyle = NUIT;
          for (let y = 0; y < s; y += 6)
            for (let x = (y / 6) % 2 ? 3 : 0; x < s; x += 6) ctx.fillRect(x, y, 3, 3);
        }
      }
      ctx.fillStyle = inverted ? SABLE : NUIT;
      ctx.font = 'bold 42px "VT323", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n), s / 2, s / 2 + 12);
      const tx = new THREE.CanvasTexture(c);
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
    scene.add(die);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: new THREE.Color(NUIT) })
    );
    die.add(edges);

    // Frame Figma 848px de haut (référence : 800) → offset ajusté pour flotter
    // au repos juste au-dessus des choix, même intention que la référence.
    const IDLE = { x: W / 2 - 56, y: -(H / 2) + 300, scale: 0.58 };
    const CENTER = { x: 0, y: 20, scale: 1 };

    let state = "idle";
    let pos = { x: IDLE.x, y: IDLE.y };
    let vel = { x: 0, y: 0 };
    let angVel = { x: 0.01, y: 0.017, z: 0 };
    let dieScale = IDLE.scale;
    const DAMP = 0.985,
      ROLL_FRICTION = 0.9,
      STOP_SPEED = 0.85;
    const MARGIN = R * 0.6;
    const bounds = { x: W / 2 - MARGIN, y: H / 2 - MARGIN };
    const squash = { axis: "x", amount: 0 };
    let history: { x: number; y: number; t: number }[] = [];
    let grabOffset = { x: 0, y: 0 };

    function toStage(e: MouseEvent | TouchEvent) {
      const r = canvas!.getBoundingClientRect();
      const cx = ("touches" in e ? e.touches[0].clientX : e.clientX) - r.left;
      const cy = ("touches" in e ? e.touches[0].clientY : e.clientY) - r.top;
      return { x: cx - W / 2, y: -(cy - H / 2), t: performance.now() };
    }

    function onDown(e: MouseEvent | TouchEvent) {
      if (state !== "idle") return;
      const p = toStage(e);
      const dx = p.x - pos.x,
        dy = p.y - pos.y;
      if (Math.hypot(dx, dy) > R * dieScale * 1.7) return;
      e.preventDefault();
      state = "held";
      hint!.classList.add("hidden");
      verdict!.classList.remove("show");
      resetFaces();
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
        return;
      }
      state = "flying";
      veil!.classList.add("on");
      vel = { x: vx * 1.25, y: vy * 1.25 };
      angVel = { x: -vel.y * 0.007, y: vel.x * 0.007, z: (Math.random() - 0.5) * 0.05 };
      if (navigator.vibrate) navigator.vibrate(20);
    }
    // Écouteurs sur le conteneur (hit-test identique) : le dé reste saisissable
    // uniquement en le touchant lui-même, et les choix restent cliquables.
    stage.addEventListener("mousedown", onDown);
    stage.addEventListener("touchstart", onDown, { passive: false });
    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);

    function onBounce(impactSpeed: number) {
      if (navigator.vibrate)
        navigator.vibrate(Math.min(55, Math.max(8, Math.round(impactSpeed * 3.2))));
      angVel.x += (Math.random() - 0.5) * 0.06 * (impactSpeed / 10);
      angVel.y += (Math.random() - 0.5) * 0.06 * (impactSpeed / 10);
      angVel.z += (Math.random() - 0.5) * 0.04 * (impactSpeed / 10);
    }

    let result = 0,
      settleQuat: THREE.Quaternion | null = null,
      settleT = 0,
      revealT = 0;
    function resetFaces() {
      if (result > 0) {
        mats[result - 1].map = faceTexture(result, (result - 1) % 3, false);
        mats[result - 1].needsUpdate = true;
      }
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
      let o: Outcome;
      if (result === 20) o = outcomes.critSuccess;
      else if (result === 1) o = outcomes.critFail;
      else if (result >= SEUIL) o = outcomes.success;
      else o = outcomes.fail;
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
      vWord!.textContent = o.word;
      vWord!.className = "word " + (o.fail ? "fail" : "");
      vOut!.textContent = o.text;
      verdict!.classList.add("show");
      onResultRef.current?.(result, o);
    }

    let t = 0;
    let raf = 0;
    function loop() {
      raf = requestAnimationFrame(loop);
      t += 0.016;
      if (state === "idle") {
        pos.x += (IDLE.x - pos.x) * 0.08;
        pos.y += (IDLE.y - pos.y) * 0.08 + Math.sin(t * 2) * 0.06;
        dieScale += (IDLE.scale - dieScale) * 0.08;
        die.rotation.x += 0.004;
        die.rotation.y += 0.007;
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
          onBounce(impact);
        }
        if (pos.x < -bounds.x) {
          impact = Math.abs(vel.x);
          pos.x = -bounds.x;
          vel.x *= -(0.62 + Math.min(0.16, impact * 0.008));
          vel.y *= ROLL_FRICTION;
          onBounce(impact);
        }
        if (pos.y > bounds.y) {
          impact = Math.abs(vel.y);
          pos.y = bounds.y;
          vel.y *= -(0.62 + Math.min(0.16, impact * 0.008));
          vel.x *= ROLL_FRICTION;
          onBounce(impact);
        }
        if (pos.y < -bounds.y) {
          impact = Math.abs(vel.y);
          pos.y = -bounds.y;
          vel.y *= -(0.62 + Math.min(0.16, impact * 0.008));
          vel.x *= ROLL_FRICTION;
          onBounce(impact);
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
        revealT += 0.016;
        pos.y = CENTER.y + Math.sin(t * 2) * 1.2;
        if (revealT > 2.6) {
          state = "returning";
          veil!.classList.remove("on");
          verdict!.classList.remove("show");
          hint!.textContent = "Relance quand tu veux";
          hint!.classList.remove("hidden");
        }
      } else if (state === "returning") {
        pos.x += (IDLE.x - pos.x) * 0.1;
        pos.y += (IDLE.y - pos.y) * 0.1;
        dieScale += (IDLE.scale - dieScale) * 0.1;
        if (Math.hypot(IDLE.x - pos.x, IDLE.y - pos.y) < 2) state = "idle";
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
  }, [threshold, outcomes]);

  return (
    <div ref={rootRef} className="absolute inset-0 pointer-events-none">
      <div ref={veilRef} className="die-veil" />
      <canvas ref={canvasRef} className="die-canvas" />
      <div ref={hintRef} className="die-hint">
        Saisis le dé, lance-le
      </div>
      <div ref={flashRef} className="die-flash" />
      <div ref={verdictRef} className="die-verdict">
        <div ref={vWordRef} className="word" />
        <p ref={vOutRef} className="outcome" />
      </div>
    </div>
  );
}
