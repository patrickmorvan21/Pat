"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { resolveTier, TIER_WORDS, tierIsFail, type Outcome, type Outcomes, type ResolutionTier } from "@/lib/scene-data";

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
  /**
   * La main qui hésite (§18) : sur un jet à très fort enjeu, le dé « traîne »
   * et tremble brièvement avant de s'immobiliser sur sa face. Purement
   * visuel — n'affecte JAMAIS le résultat, densifie seulement la tension.
   */
  highStakes?: boolean;
};

type Props = {
  request: RollRequest | null;
  /** `tier` = palier de résolution gradué (13/07) — jamais montré en chiffre. */
  onComplete?: (result: number, outcome: Outcome, tier: ResolutionTier) => void;
};

/**
 * Aide de lecture de l'Anneau (spec 19/07) : préférence locale au compte.
 * Disparaît définitivement au tap sur « Ne plus afficher », ou d'elle-même
 * une fois la première réussite ET le premier échec vécus. (Réactivation
 * prévue via Options « Réafficher les aides » — écran pas encore construit.)
 */
const HELP_KEY = "aldenhar-aide-de";
type DieHelpPref = { off: boolean; ok: boolean; ko: boolean };
function loadHelpPref(): DieHelpPref {
  try {
    const raw = window.localStorage.getItem(HELP_KEY);
    if (raw) return { off: false, ok: false, ko: false, ...(JSON.parse(raw) as Partial<DieHelpPref>) };
  } catch {}
  return { off: false, ok: false, ko: false };
}
function saveHelpPref(p: DieHelpPref) {
  try {
    window.localStorage.setItem(HELP_KEY, JSON.stringify(p));
  } catch {}
}
function helpAllowed(p: DieHelpPref) {
  return !p.off && !(p.ok && p.ko);
}

/**
 * Halo tramé du dé (résolution graduée 13/07) : disque de pixels orange à
 * densité radiale décroissante — jamais un dégradé CSS lisse. Généré une
 * fois côté client, mis en cache au niveau module.
 */
let haloCache: string | null = null;
function getHaloDataUrl(): string | null {
  if (typeof document === "undefined") return null;
  if (!haloCache) {
    const S = 220,
      cell = 2;
    const BAYER4 = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ].map((row) => row.map((v) => (v + 0.5) / 16));
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#e0632a";
    for (let y = 0; y < S; y += cell) {
      for (let x = 0; x < S; x += cell) {
        const dx = (x - S / 2) / (S / 2),
          dy = (y - S / 2) / (S / 2);
        const r = Math.hypot(dx, dy);
        const density = Math.max(0, 1 - r) ** 2 * 0.85;
        const bx = Math.floor(x / cell) % 4,
          by = Math.floor(y / cell) % 4;
        if (density > BAYER4[by][bx]) ctx.fillRect(x, y, cell, cell);
      }
    }
    haloCache = c.toDataURL();
  }
  return haloCache;
}

export default function Die3D({ request, onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLCanvasElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const helpLinkRef = useRef<HTMLButtonElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
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
    const ring = ringRef.current;
    const help = helpRef.current;
    const helpLink = helpLinkRef.current;
    const hint = hintRef.current;
    const flash = flashRef.current;
    const halo = haloRef.current;
    const veil = veilRef.current;
    const verdict = verdictRef.current;
    const vWord = vWordRef.current;
    const vOut = vOutRef.current;
    if (!root || !canvas || !ring || !help || !helpLink || !hint || !flash || !halo || !veil || !verdict || !vWord || !vOut) return;

    // Halo tramé (jamais un dégradé CSS) : image générée une fois côté client.
    const haloUrl = getHaloDataUrl();
    if (haloUrl) halo.style.backgroundImage = `url(${haloUrl})`;

    const phone = root.closest(".phone-frame") as HTMLElement | null;
    const stage = phone ?? root;

    // 2.4 dans la référence ; abaissé pour un dé plus net (pixels plus fins)
    const PIXEL_FACTOR = 1.6;
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
      ctx.font = 'bold 36px "Roboto Mono", monospace';
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
    // Le dé n'apparaît qu'au clic d'un choix risqué (décision Patrick,
    // remplace le « flotte en permanence » de la spec §4).
    die.visible = false;
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

    /**
     * L'Anneau du dé (spec 19/07, maquette 2085:22943 — VERROUILLÉ) : 20
     * encoches carrées autour du dé armé, une par face. Pleines orange =
     * faces qui réussissent (seuil + états narratifs modulent la
     * proportion) ; rongées (ruines de pixels épars, JAMAIS un simple
     * contour — la grammaire « case à remplir » évoque une jauge) = faces
     * qui échouent ; sommet BLANC = la face 20, le Destin, toujours
     * visible. Apparition une par une, très vite, par tics — la lecture
     * des chances se fait AVANT le lancer ; au lancer, tout disparaît.
     * (Marque de relique sur une encoche : prévu, en attente du système
     * de reliques gravant les faces.)
     */
    // Rayon réduit (89 → 70, retour Patrick 19/07) : les encoches basses
    // laissent ~9px d'air au-dessus du hint « Lancer le dé » (mesuré).
    const RING_S = 200,
      RING_R = 70,
      NOTCH = 6;
    ring.width = ring.height = RING_S;
    // Centré sur la position d'attente du dé (READY), ancré depuis le bas.
    ring.style.bottom = `${136 - RING_S / 2}px`;
    const ringCtx = ring.getContext("2d")!;
    let ringTimer: ReturnType<typeof setInterval> | null = null;

    /** Angle de la face n : 20 au sommet, puis 19..1 en tournant horaire —
        les faces hautes (qui réussissent) forment l'arc droit, comme la
        maquette. */
    function notchAngle(n: number) {
      return ((-90 + (20 - n) * 18) * Math.PI) / 180;
    }
    function drawNotch(n: number, kind: "full" | "erode" | "destin") {
      const a = notchAngle(n);
      const cx = RING_S / 2 + Math.cos(a) * RING_R;
      const cy = RING_S / 2 + Math.sin(a) * RING_R;
      ringCtx.save();
      ringCtx.translate(cx, cy);
      ringCtx.rotate(a + Math.PI / 2);
      if (kind === "erode") {
        // Ruine de pixels épars, seedée par la face (stable pendant l'armement).
        let seed = (n * 7919 + 13) >>> 0;
        const rnd = () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return seed / 4294967296;
        };
        ringCtx.fillStyle = "rgba(255,255,255,0.34)";
        for (let py = -3; py < 3; py++)
          for (let px = -3; px < 3; px++) if (rnd() < 0.38) ringCtx.fillRect(px, py, 1, 1);
      } else {
        ringCtx.fillStyle = FACE;
        ringCtx.fillRect(-NOTCH / 2, -NOTCH / 2, NOTCH, NOTCH);
      }
      ringCtx.restore();
    }
    // Retour Patrick 19/07 soir : plus d'encoche blanche au sommet — la face
    // 20 est une encoche pleine orange comme les autres (le « sommet blanc =
    // Destin » de la spec du matin est annulé).
    function notchKind(n: number): "full" | "erode" {
      if (n === 20) return "full";
      const req = requestRef.current;
      if (!req) return "erode";
      // Même arithmétique que la résolution réelle : la vérité, pas un décor.
      const effective = Math.max(1, Math.min(20, n + (req.modifier || 0)));
      return tierIsFail(resolveTier(n, effective, req.threshold)) ? "erode" : "full";
    }
    function stopRingReveal() {
      if (ringTimer) {
        clearInterval(ringTimer);
        ringTimer = null;
      }
    }
    /** Apparition des 20 encoches une par une (~25ms), en SENS HORAIRE depuis
        le sommet (retour Patrick 19/07) : le Destin blanc ouvre la ronde,
        l'arc orange suit, les rongées ferment. */
    function revealRing(instant = false) {
      stopRingReveal();
      ringCtx.clearRect(0, 0, RING_S, RING_S);
      ring!.classList.remove("hidden");
      if (instant) {
        for (let n = 1; n <= 20; n++) drawNotch(n, notchKind(n));
        return;
      }
      let i = 0;
      ringTimer = setInterval(() => {
        i += 1;
        const n = 21 - i; // 20 (sommet) → 1, disposées en horaire
        drawNotch(n, notchKind(n));
        if (i >= 20) stopRingReveal();
      }, 25);
    }
    function hideRing() {
      stopRingReveal();
      ring!.classList.add("hidden");
    }

    // Phrase d'aide (spec 19/07) : préférence chargée une fois par montage.
    let helpPref = loadHelpPref();
    function syncHelp() {
      help!.classList.toggle("hidden", !helpAllowed(helpPref));
    }
    function onHelpDismiss(e: Event) {
      e.preventDefault();
      e.stopPropagation();
      helpPref = { ...helpPref, off: true };
      saveHelpPref(helpPref);
      help!.classList.add("hidden");
    }
    helpLink.addEventListener("click", onHelpDismiss);

    // hidden : invisible. armed : voile + hint, saisissable (armement §4).
    let state = "hidden";
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
      settleT = 0;

    function resetFaces() {
      if (result > 0) {
        mats[result - 1].map = faceTexture(result, (result - 1) % 3, false);
        mats[result - 1].needsUpdate = true;
        result = 0;
      }
    }

    activateRef.current = () => {
      resetFaces();
      pos = { x: READY.x, y: READY.y };
      dieScale = 0.2;
      angVel = { x: 0.01, y: 0.017, z: 0 };
      die.visible = true;
      state = "armed";
      veil.classList.add("on");
      // Armement (spec 19/07, maquette 2085:22943) : hint sobre « Lancer le
      // dé » (plus de stat affichée — l'Anneau porte l'information), anneau
      // des 20 encoches encoche par encoche, phrase d'aide si pas retirée.
      hint.textContent = "Lancer le dé";
      hint.classList.remove("accent");
      hint.classList.remove("hidden");
      verdict.classList.remove("show");
      revealRing();
      syncHelp();
    };

    /** Verdict retenu au moment du jet (naturel pour les critiques, modifié sinon). */
    let chosen: Outcome = { word: "", fail: false, text: "" };
    let chosenTier: ResolutionTier = "reussite";
    /**
     * Résolution graduée à 5 paliers (13/07) : la MARGE décide du palier,
     * les naturels 20/1 transcendent tout. Le texte de prose vient des
     * variantes écrites de la scène (les paliers intermédiaires réutilisent
     * la prose du succès/échec — le mot de verdict et le traitement visuel
     * portent la nuance).
     */
    function resolveOutcome(): { outcome: Outcome; tier: ResolutionTier } {
      const req = requestRef.current;
      if (!req) return { outcome: { word: "", fail: false, text: "" }, tier: "reussite" };
      const effective = Math.max(1, Math.min(20, result + (req.modifier || 0)));
      const tier = resolveTier(result, effective, req.threshold);
      const outcome =
        tier === "destin"
          ? req.outcomes.critSuccess
          : tier === "malediction"
            ? req.outcomes.critFail
            : tierIsFail(tier)
              ? req.outcomes.fail
              : req.outcomes.success;
      return { outcome, tier };
    }

    function dismissResult() {
      state = "hidden";
      die.visible = false;
      veil!.classList.remove("on");
      verdict!.classList.remove("show");
      hint!.classList.add("hidden");
      halo!.className = "die-halo";
      hideRing();
      help!.classList.add("hidden");
      onCompleteRef.current?.(result, chosen, chosenTier);
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
      // Au lancer (retour Patrick 19/07 soir, amende la spec du matin) :
      // l'anneau et l'aide disparaissent, mais l'image et le texte RESTENT
      // visibles derrière, estompés par le voile sombre.
      hideRing();
      help!.classList.add("hidden");
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
    /** Relâché sans élan : le dé se repose, l'anneau et l'aide reviennent. */
    function backToArmed() {
      state = "returning";
      hint!.classList.remove("hidden");
      revealRing(true);
      syncHelp();
    }
    function onUp() {
      if (state !== "held") return;
      const now = performance.now();
      const recent = history.filter((h) => now - h.t < 110);
      if (recent.length < 2) {
        backToArmed();
        return;
      }
      const first = recent[0],
        last = recent[recent.length - 1];
      const dt = Math.max(last.t - first.t, 16) / 16.7;
      const vx = (last.x - first.x) / dt,
        vy = (last.y - first.y) / dt;
      const speed = Math.hypot(vx, vy);
      if (speed < 2.5) {
        backToArmed();
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
      // Subtil : un filet de 1px, 2px pour les gros chocs
      const thickness = impactSpeed > 9 ? 2 : 1;
      if (horizontal) wave.style.height = `${thickness}px`;
      else wave.style.width = `${thickness}px`;
      root!.appendChild(wave);
      setTimeout(() => wave.remove(), 400);
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

    /** Vacillement « de justesse » : la face oscille orange/charbon avant de se fixer. */
    let revealT = 0;
    let justesseFlicker = false;

    function finishRoll() {
      state = "reveal";
      revealT = 0;
      const { outcome, tier } = resolveOutcome();
      chosen = outcome;
      chosenTier = tier;
      justesseFlicker = tier === "justesse";

      // Aide de l'Anneau (spec 19/07) : se retire d'elle-même une fois la
      // première réussite ET le premier échec vécus.
      const failed = tierIsFail(tier);
      if ((failed && !helpPref.ko) || (!failed && !helpPref.ok)) {
        helpPref = { ...helpPref, ok: helpPref.ok || !failed, ko: helpPref.ko || failed };
        saveHelpPref(helpPref);
      }

      // Face gagnante par palier (13/07) : illuminée sur les réussites,
      // TERNE (aucune surbrillance) sur les échecs, vacillante en justesse.
      const lit = !tierIsFail(tier);
      mats[result - 1].map = faceTexture(result, 0, lit);
      mats[result - 1].needsUpdate = true;

      // Flashes plein écran par palier.
      flash!.className = "die-flash";
      void flash!.offsetWidth;
      if (tier === "destin") {
        flash!.classList.add("crit-success");
        if (navigator.vibrate) navigator.vibrate([30, 40, 80]);
      } else if (tier === "malediction") {
        flash!.classList.add("malediction");
        phone?.classList.add("quake");
        setTimeout(() => phone?.classList.remove("quake"), 450);
        if (navigator.vibrate) navigator.vibrate([90, 50, 140, 60, 90]);
      } else if (tier === "critique") {
        flash!.classList.add("critique");
        phone?.classList.add("quake");
        setTimeout(() => phone?.classList.remove("quake"), 380);
        if (navigator.vibrate) navigator.vibrate([70, 40, 100]);
      }

      // Halo tramé par palier : intense (Destin), franc (éclatante), sobre
      // (réussite) — aucun halo sur justesse et les échecs.
      halo!.className = "die-halo";
      if (tier === "destin" || tier === "eclatante" || tier === "reussite") {
        void halo!.offsetWidth;
        halo!.classList.add(tier);
      }

      // Mot de verdict par palier — la nuance se lit, jamais en chiffre.
      vWord!.textContent = TIER_WORDS[tier];
      vWord!.className =
        "word " +
        (tier === "malediction" || tier === "critique"
          ? "funeste"
          : tier === "echec"
            ? "fail"
            : tier === "justesse"
              ? "justesse"
              : "");
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
      if (state === "armed" || state === "returning") {
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
        // La main qui hésite (§18) : sur un jet à fort enjeu, le dé s'aligne
        // plus lentement et tremble avant de se figer — visuel seulement, la
        // face gagnante (result) est déjà tirée, rien ici ne la change.
        const highStakes = requestRef.current?.highStakes;
        // Destin (nat 20) : léger ralenti au settle (13/07) — la face est
        // déjà tirée, seul le tempo change.
        const destinSlow = result === 20 ? 0.7 : 1;
        settleT += (highStakes ? 0.018 : 0.03) * destinSlow;
        pos.x += (CENTER.x - pos.x) * 0.11;
        pos.y += (CENTER.y - pos.y) * 0.11;
        dieScale += (CENTER.scale - dieScale) * 0.1;
        die.quaternion.slerp(settleQuat!, highStakes ? 0.08 : 0.14);
        const finishAt = highStakes ? 2.6 : 1.7;
        if (highStakes && settleT < finishAt) {
          // Frémissement décroissant : une micro-oscillation sur la position
          // et une secousse d'échelle qui s'éteint à l'approche de l'arrêt.
          const tremor = Math.max(0, 1 - settleT / finishAt);
          pos.x += Math.sin(t * 47) * 1.6 * tremor;
          pos.y += Math.cos(t * 41) * 1.2 * tremor;
          if (squash.amount < 0.05 * tremor) {
            squash.axis = Math.random() < 0.5 ? "x" : "y";
            squash.amount = 0.05 * tremor;
          }
        }
        if (settleT >= finishAt) {
          die.quaternion.copy(settleQuat!);
          pos = { x: CENTER.x, y: CENTER.y };
          finishRoll();
        }
      } else if (state === "reveal") {
        // Écran de résultat (128:4122) : le dé flotte sur place jusqu'au toucher.
        pos.y = CENTER.y + Math.sin(t * 2) * 1.2;
        // « De justesse » (13/07) : la face vacille entre orange et charbon
        // quelques instants avant de se fixer, illuminée.
        if (justesseFlicker) {
          revealT += 0.016;
          if (revealT < 0.72) {
            const phase = Math.floor(revealT / 0.12) % 2 === 0;
            mats[result - 1].map = faceTexture(result, 0, phase);
            mats[result - 1].needsUpdate = true;
          } else {
            mats[result - 1].map = faceTexture(result, 0, true);
            mats[result - 1].needsUpdate = true;
            justesseFlicker = false;
          }
        }
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
      stopRingReveal();
      helpLink.removeEventListener("click", onHelpDismiss);
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
      <div ref={haloRef} className="die-halo" />
      {/* Anneau des 20 encoches (spec 19/07) — sous le canvas du dé. */}
      <canvas ref={ringRef} className="die-ring hidden" />
      <canvas ref={canvasRef} className="die-canvas" />
      {/* Aide de lecture (spec 19/07) : seul élément souligné de l'UI. */}
      <div ref={helpRef} className="die-help hidden">
        <p>
          Les encoches pleines sont
          <br />
          tes chances de réussite.
        </p>
        <button ref={helpLinkRef} type="button" className="die-help-link">
          Ne plus afficher
        </button>
      </div>
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
