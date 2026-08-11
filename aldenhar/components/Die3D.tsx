"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { resolveTier, TIER_WORDS, tierIsFail, type Outcome, type Outcomes, type ResolutionTier } from "@/lib/scene-data";
import { animReduced, haptic } from "@/lib/settings";

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
  /**
   * La main qui hésite (§18) : sur un jet à très fort enjeu, le dé « traîne »
   * et tremble brièvement avant de s'immobiliser sur sa face. Purement
   * visuel — n'affecte JAMAIS le résultat, densifie seulement la tension.
   */
  highStakes?: boolean;
  /**
   * Beat fatal (30/07) : la scène sait si CE palier tue (santé − coût ≤ 0, ou
   * procès de fixation raté). Quand c'est le cas, le dé s'immobilise sur une
   * face RONGÉE et illisible — aucun chiffre — et « MORT » remplace le
   * verdict. Le tap ne coupe rien : la combustion enchaîne toute seule.
   */
  fatalCheck?: (tier: ResolutionTier) => boolean;
  /**
   * LE DÉ IMPOSSIBLE (surprise #11, 6/08) : le dé s'immobilise sur une face
   * RONGÉE sans chiffre — mais rien d'autre ne change : le verdict du palier
   * réel s'affiche, le tap continue normalement, aucune conséquence
   * mécanique. C'est la face de la MORT sans la mort — exactement ce qui ne
   * devrait pas exister, et le Geôlier le dira à l'écran suivant.
   */
  impossible?: boolean;
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

/**
 * CONTOUR DU DESTIN (retour playtest 6/08 soir) : au nat 20, plus de flash —
 * les 4 bords de l'écran diffusent des pixels BLANCS, denses au ras du bord
 * et raréfiés vers l'intérieur. Densité par seuillage Bayer, jamais un
 * dégradé. Généré une fois (basse résolution, upscalé pixelated par le CSS).
 */
let edgeCache: string | null = null;
function getEdgeGlowDataUrl(): string | null {
  if (typeof document === "undefined") return null;
  if (!edgeCache) {
    const W = 130, H = 267, PROF = 16;
    const BAYER4 = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ].map((row) => row.map((v) => (v + 0.5) / 16));
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const d = Math.min(x, y, W - 1 - x, H - 1 - y);
        if (d >= PROF) continue;
        const density = (1 - d / PROF) ** 2 * 0.9;
        if (density > BAYER4[y % 4][x % 4]) ctx.fillRect(x, y, 1, 1);
      }
    }
    edgeCache = c.toDataURL();
  }
  return edgeCache;
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
  const gesteRef = useRef<HTMLDivElement | null>(null);
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
    const geste = gesteRef.current;
    const flash = flashRef.current;
    const halo = haloRef.current;
    const veil = veilRef.current;
    const verdict = verdictRef.current;
    const vWord = vWordRef.current;
    const vOut = vOutRef.current;
    if (!root || !canvas || !ring || !help || !helpLink || !hint || !geste || !flash || !halo || !veil || !verdict || !vWord || !vOut) return;

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

    /**
     * Face NOIRE du critique (retour playtest 6/08 soir) : le flash plein
     * écran est supprimé — c'est le DÉ qui porte le verdict. Noir pur, cadre
     * orange épais, chiffre orange. Appliquée à TOUTES les faces au settle
     * d'un FUNESTE/MALÉDICTION : l'objet entier devient noir cerclé d'orange.
     */
    function faceNoire(n: number) {
      const s = 96;
      const c = document.createElement("canvas");
      c.width = c.height = s;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, s, s);
      // ⚠️ FACE = l'orange, INK = le charbon (piège d'inversion : sur les
      // faces normales l'orange est le FOND). Ici le cadre et le chiffre
      // doivent être ORANGE sur noir.
      ctx.strokeStyle = FACE;
      ctx.lineWidth = 7;
      ctx.strokeRect(5, 5, s - 10, s - 10);
      ctx.fillStyle = FACE;
      ctx.font = 'bold 36px "Roboto Mono", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n), s / 2, s / 2 + 12);
      const tx = new THREE.CanvasTexture(c);
      tx.colorSpace = THREE.SRGBColorSpace;
      tx.magFilter = THREE.NearestFilter;
      tx.minFilter = THREE.NearestFilter;
      return tx;
    }

    /**
     * Face RONGÉE du beat fatal (30/07) : AUCUN chiffre. Un fond charbon
     * terne mangé de pixels orange épars — ce qui reste d'une face après le
     * feu. Ruine seedée (stable pendant tout le reveal), dense au centre,
     * clairsemée aux bords : la lecture est « illisible », pas « vide ».
     */
    function faceRongee() {
      const s = 96;
      const c = document.createElement("canvas");
      c.width = c.height = s;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, s, s);
      let seed = 0xf47a1 >>> 0;
      const rnd = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      ctx.fillStyle = FACE_SHADE;
      for (let y = 4; y < s - 4; y += 3) {
        for (let x = 4; x < s - 4; x += 3) {
          const dx = (x - s / 2) / (s / 2);
          const dy = (y - s / 2) / (s / 2);
          const centre = Math.max(0, 1 - Math.hypot(dx, dy));
          if (rnd() < 0.06 + centre * 0.22) ctx.fillRect(x, y, 2, 2);
        }
      }
      const tx = new THREE.CanvasTexture(c);
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

    /**
     * LE GESTE S'ENSEIGNE (panel du 9/08, chantier n°0 — 4 voix sur 4 de ceux
     * qui ont pu toucher le dé, aucune contestation).
     *
     * Rien sur cet écran ne dit qu'il faut LANCER : trois éléments ressemblent
     * à un bouton et n'en sont pas, et le seul vrai bouton efface l'aide. Un
     * débutant tape trois fois, rien ne bouge, il repose le téléphone — avant
     * la première mort, donc avant tout le reste du jeu.
     *
     * La réponse n'est pas d'expliquer : c'est de MONTRER, une fois, en
     * silence — une trace de pixels qui monte du dé, par paliers (jamais un
     * fondu : la DA l'interdit). Elle s'arrête dès que le joueur a lancé d'un
     * vrai geste, ou après trois armements — au-delà, elle harcèle.
     */
    const GESTE_KEY = "pactum-de-geste";
    function gesteVus(): number {
      try {
        const v = localStorage.getItem(GESTE_KEY);
        return v === "appris" ? -1 : Number(v ?? 0) || 0;
      } catch {
        return -1;
      }
    }
    function noterGeste(v: string) {
      try {
        localStorage.setItem(GESTE_KEY, v);
      } catch {
        /* stockage indisponible : la démonstration se contentera de la session */
      }
    }
    function syncGeste(montrer: boolean) {
      const n = gesteVus();
      const ok = montrer && n >= 0 && n < 3 && !animReduced();
      geste!.classList.toggle("hidden", !ok);
      if (ok) noterGeste(String(n + 1));
    }

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

    let facesNoircies = false;
    function resetFaces() {
      // Après un FUNESTE, le dé entier a été noirci (retour 6/08) — on
      // restaure les 20 faces, pas seulement la gagnante.
      if (facesNoircies) {
        for (let i = 0; i < 20; i++) {
          mats[i].map = faceTexture(i + 1, i % 3, false);
          mats[i].needsUpdate = true;
        }
        facesNoircies = false;
        result = 0;
        return;
      }
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
      syncGeste(true);
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
        // Beat fatal : le tap ne coupe pas — la combustion vient toute seule.
        if (fatalLock) return;
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
      geste!.classList.add("hidden");
      grabOffset = { x: dx, y: dy };
      history = [p];
      haptic(10);
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
    /**
     * ⚠️ AMENDEMENT À UNE RÈGLE VERROUILLÉE, à connaître (et réversible).
     *
     * Le prototype validé posait : « relâché sans élan suffisant, le dé RESTE
     * POSÉ — pas de lancer accidentel ». Depuis le 9/08, tout relâchement le
     * lance. Ce n'est pas un oubli : la prémisse de la règle a disparu. Elle
     * protégeait un dé qui FLOTTAIT en permanence à l'écran (spec §4), qu'on
     * pouvait frôler sans le vouloir. Depuis la décision du 11/07, le dé
     * n'apparaît qu'au tap d'un choix risqué, il n'est plus annulable
     * (renoncer à un jet armé a été refusé le 8/08), et le toucher est donc
     * toujours intentionnel — il n'existe plus de lancer accidentel à éviter,
     * seulement des joueurs bloqués (4 testeurs sur 4 en ont fait le premier
     * défaut du jeu).
     *
     * Pour revenir en arrière : rétablir `backToArmed` (git, 9/08) sur les
     * deux branches sans élan de `onUp`.
     */
    /**
     * MODE TESTEUR (`?testeur=1` dans l'URL, 8/08) : un simple TAP sur le dé
     * armé le lance avec une impulsion aléatoire plausible. Réservé aux
     * playtests par agents (IA de navigation, qui savent cliquer mais pas
     * produire un geste avec de la vélocité). Lu à CHAQUE relâchement, jamais
     * mémorisé : retirer le paramètre rend le jeu strictement normal, et le
     * TIRAGE reste celui de la physique réelle — seule l'impulsion est
     * synthétique.
     */
    function lancerSynthetique(): boolean {
      if (typeof window === "undefined") return false;
      if (new URLSearchParams(window.location.search).get("testeur") !== "1") return false;
      state = "flying";
      vel = { x: (Math.random() - 0.5) * 16, y: -(9 + Math.random() * 10) };
      angVel = { x: -vel.y * 0.007, y: vel.x * 0.007, z: (Math.random() - 0.5) * 0.05 };
      return true;
    }
    /**
     * LE TAP DE SECOURS (panel du 9/08). Toucher le dé et relâcher sans élan
     * le lance quand même — d'une main molle, mais il part. Le geste reste la
     * belle façon de jouer : il envoie le dé plus loin et le fait rebondir
     * davantage. Ce qui ne change PAS, c'est l'équité — le résultat est lu sur
     * la face réellement tournée vers la caméra à l'immobilisation (règle
     * verrouillée du 21/07), donc c'est la ROTATION qui doit être franche.
     * Elle l'est : linéaire modeste, angulaire pleine et aléatoire sur les
     * trois axes. Distribution mesurée sur 200 taps avant de livrer.
     */
    function lancerAuDoigt() {
      state = "flying";
      vel = { x: (Math.random() - 0.5) * 7, y: -(6.5 + Math.random() * 3) };
      const r = () => (Math.random() < 0.5 ? -1 : 1) * (0.16 + Math.random() * 0.2);
      angVel = { x: r(), y: r(), z: r() * 0.5 };
      haptic(14);
    }
    function onUp() {
      if (state !== "held") return;
      const now = performance.now();
      const recent = history.filter((h) => now - h.t < 110);
      if (recent.length < 2) {
        if (!lancerSynthetique()) lancerAuDoigt();
        return;
      }
      const first = recent[0],
        last = recent[recent.length - 1];
      const dt = Math.max(last.t - first.t, 16) / 16.7;
      const vx = (last.x - first.x) / dt,
        vy = (last.y - first.y) / dt;
      const speed = Math.hypot(vx, vy);
      if (speed < 2.5) {
        if (!lancerSynthetique()) lancerAuDoigt();
        return;
      }
      state = "flying";
      vel = { x: vx * 1.25, y: vy * 1.25 };
      angVel = { x: -vel.y * 0.007, y: vel.x * 0.007, z: (Math.random() - 0.5) * 0.05 };
      haptic(20);
      // Un vrai lancer : la démonstration a fait son travail, elle se retire.
      noterGeste("appris");
      geste!.classList.add("hidden");
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
      haptic(Math.min(55, Math.max(8, Math.round(impactSpeed * 3.2))));
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
      // Physique du dé = le tirage (spec 21/07, VERROUILLÉ). On INVERSE
      // l'ancienne architecture : plus aucun `result` pré-tiré. Le résultat EST
      // la face réellement tournée vers la caméra (+Z) au moment où le dé
      // s'immobilise — lue sur l'orientation accumulée par le roulé (geste du
      // joueur + rebonds + bruit angulaire). La physique arbitre pour de vrai ;
      // la face visible à l'arrêt correspond donc toujours au chiffre annoncé.
      const posAttr = geo.getAttribute("position");
      const q = die.quaternion;
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      const c = new THREE.Vector3();
      const localN = new THREE.Vector3();
      const bestLocalN = new THREE.Vector3();
      let best = -Infinity;
      let bestFace = 1;
      for (let f = 0; f < 20; f++) {
        const fi = f * 3;
        a.fromBufferAttribute(posAttr, fi);
        b.fromBufferAttribute(posAttr, fi + 1);
        c.fromBufferAttribute(posAttr, fi + 2);
        // Normale sortante de la face (même calcul que le rendu d'origine).
        localN
          .copy(new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)))
          .normalize();
        // Projection sur +Z une fois l'orientation courante du dé appliquée :
        // la face la plus « sortie » vers la caméra est celle qui gagne.
        const worldZ = localN.clone().applyQuaternion(q).z;
        if (worldZ > best) {
          best = worldZ;
          bestFace = f + 1;
          bestLocalN.copy(localN);
        }
      }
      result = bestFace;
      // Cible d'alignement = petit redressement qui amène CETTE face pile vers
      // la caméra, en PRÉSERVANT la rotation courante dans le plan (delta·q, pas
      // un grand snap) : le dé se pose à plat sur la face déjà sortie, sans
      // torsion visible — la face lue ne peut plus diverger de la face montrée.
      const worldN = bestLocalN.clone().applyQuaternion(q).normalize();
      const delta = new THREE.Quaternion().setFromUnitVectors(worldN, new THREE.Vector3(0, 0, 1));
      settleQuat = delta.multiply(q.clone());
      settleT = 0;
    }

    /** Vacillement « de justesse » : la face oscille orange/charbon avant de se fixer. */
    let revealT = 0;
    let justesseFlicker = false;
    /** Beat fatal : tant que le verrou est posé, aucun tap ne dismisse. */
    let fatalLock = false;
    let fatalTimer: ReturnType<typeof setTimeout> | null = null;

    function finishRoll() {
      state = "reveal";
      revealT = 0;
      const { outcome, tier } = resolveOutcome();
      chosen = outcome;
      chosenTier = tier;
      justesseFlicker = tier === "justesse";

      // ── BEAT FATAL (30/07) : ce palier tue. La face gagnante devient une
      // face rongée SANS chiffre, « MORT » tombe sec sous le dé (Instrument
      // Serif très espacé), et la séquence enchaîne TOUTE SEULE — le tap ne
      // coupe pas, c'est le seul moment du jeu où le joueur n'a plus la main.
      if (requestRef.current?.impossible && !requestRef.current?.fatalCheck?.(tier)) {
        // La face s'efface — le verdict, lui, reste celui du jet réel.
        mats[result - 1].map = faceRongee();
        mats[result - 1].needsUpdate = true;
      }
      if (requestRef.current?.fatalCheck?.(tier)) {
        fatalLock = true;
        justesseFlicker = false;
        mats[result - 1].map = faceRongee();
        mats[result - 1].needsUpdate = true;
        vWord!.textContent = "MORT";
        vWord!.className = "word mort";
        vOut!.classList.add("hidden");
        verdict!.classList.add("show");
        hint!.classList.add("hidden");
        haptic([90, 60, 140]);
        fatalTimer = setTimeout(() => {
          fatalLock = false;
          dismissResult();
        }, 1700);
        return;
      }

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

      // Retour playtest 6/08 soir : « quand on fait un 20 ça flash trop,
      // pareil pour funeste ». Les flashs plein écran sont SUPPRIMÉS.
      //  - Destin : le CONTOUR de l'écran diffuse des pixels blancs (semis
      //    tramé sur les 4 bords, jamais un dégradé) — plus doux, plus
      //    frappant.
      //  - Funeste/Malédiction : le DÉ devient tout noir à contour orange —
      //    c'est l'objet qui porte le verdict, pas l'écran.
      flash!.className = "die-flash";
      if (tier === "destin") {
        const edgeUrl = getEdgeGlowDataUrl();
        if (edgeUrl) flash!.style.backgroundImage = `url(${edgeUrl})`;
        void flash!.offsetWidth;
        flash!.classList.add("edge-destin");
        haptic([30, 40, 80]);
      } else if (tier === "malediction" || tier === "critique") {
        for (let i = 0; i < 20; i++) {
          mats[i].map = faceNoire(i + 1);
          mats[i].needsUpdate = true;
        }
        facesNoircies = true;
        phone?.classList.add("quake");
        setTimeout(() => phone?.classList.remove("quake"), tier === "malediction" ? 450 : 380);
        haptic(tier === "malediction" ? [90, 50, 140, 60, 90] : [70, 40, 100]);
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
        // face gagnante (result) a déjà été LUE sur le dé au beginSettle ;
        // l'alignement ne fait que la poser à plat, il ne la change jamais.
        const highStakes = requestRef.current?.highStakes;
        // Destin (nat 20) : léger ralenti au settle (13/07) — la face est
        // déjà posée, seul le tempo change.
        const destinSlow = result === 20 ? 0.7 : 1;
        // Animations réduites (Options) — spec 4/08 A6 : ce qui est intense au
        // 1ᵉʳ jet devient lent au 40ᵉ. Le réglage écourte le settle (~×2.5) et
        // neutralise la rallonge highStakes ; le TIRAGE, lui, ne change jamais.
        const accel = animReduced() ? 2.5 : 1;
        settleT += (highStakes ? 0.018 : 0.03) * destinSlow * accel;
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
      if (fatalTimer) clearTimeout(fatalTimer);
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
      {/* Le geste, MONTRÉ et non expliqué : trois carrés qui montent du dé,
          par paliers. Trois armements au plus, et plus jamais dès le premier
          vrai lancer. Aucun texte — l'écran en a déjà trop. */}
      <div ref={gesteRef} className="die-geste hidden" aria-hidden="true">
        <i /><i /><i />
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
