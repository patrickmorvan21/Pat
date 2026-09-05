"use client";

/**
 * LE CREDO — les trois lignes du pacte, juste avant le carton d'acte
 * (maquette Figma 3388:889, demande Patrick du 05/09).
 *
 * « Chaque mot s'affiche indépendamment. Au début on a que "une vie", ensuite
 * il s'efface en pixels pour laisser apparaître "un dé" juste en dessous, et
 * ainsi de suite. Reproduis les chaînes en pixels en orange en fond, et
 * fais-les légèrement bouger. »
 *
 * Donc : une ligne à la fois, chacune plus bas que la précédente, qui se
 * MATÉRIALISE en pixels puis se dissout pour laisser la place à la suivante.
 * ⚠️ La TROISIÈME reste : c'est la dernière, c'est elle que la maquette met en
 * avant, et finir sur un écran vide serait une chute au lieu d'un serment.
 *
 * ⚠️ Rien n'est animé en opacité (règle DA) : ni le texte, ni les chaînes. Le
 * texte est masqué par une TRAME de pixels dont la densité change par paliers,
 * et les chaînes se déplacent par pixels entiers.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import TouchHint from "@/components/TouchHint";
import { animReduced } from "@/lib/settings";

/** Les trois lignes, dans leur ordre et à leur taille de maquette. */
const LIGNES: { texte: string; taille: number }[] = [
  { texte: "Une vie.", taille: 38 },
  { texte: "Un dé.", taille: 38 },
  { texte: "Le Domaine\nse souvient.", taille: 30 },
];

/** Paliers de la dissolution du texte, et cadence d'un palier. */
const PAS = 7;
const MS_PAS = 62;
/** Combien de temps une ligne reste lisible avant de céder la place. */
const MS_TENUE = 1500;

/* --------------------------------------------------------- LES CHAÎNES */

const CW = 195;
const CH = 424;
const ORANGE = "#e0632a";

/** Un maillon : un anneau de pixels, aplati sur un axe (les maillons d'une
    chaîne alternent d'un quart de tour, c'est ce qui la rend lisible). */
function maillon(
  x: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  vertical: boolean
) {
  const a = vertical ? 3.4 : 5.6;
  const b = vertical ? 5.6 : 3.4;
  for (let py = -7; py <= 7; py++) {
    for (let px = -7; px <= 7; px++) {
      const u = px / a;
      const v = py / b;
      const r = u * u + v * v;
      // L'anneau seulement : plein, il ferait une tache.
      if (r < 1.05 && r > 0.42) x.fillRect((cx + px) | 0, (cy + py) | 0, 1, 1);
    }
  }
}

/** Une chaîne pendue : des maillons alignés du point A au point B. */
function chaine(
  x: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  n: number,
  decalage: number
) {
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // Le décalage pèse surtout sur le BAS de la chaîne : elle est accrochée
    // en haut, comme une vraie — un déplacement uniforme lirait comme un
    // glissé. Il ne s'annule jamais tout à fait, sinon la moitié haute reste
    // figée et la chaîne a l'air cassée en deux.
    const d = Math.round(decalage * (0.35 + 0.65 * t));
    maillon(x, ax + (bx - ax) * t + d, ay + (by - ay) * t, i % 2 === 0);
  }
}

/* ------------------------------------------------------------ LE MASQUE */

/** Masque de dissolution : un pixel est visible quand son seuil (tiré une
    fois) passe sous la progression. C'est le seuil aléatoire qui donne le
    grain — une trame régulière lirait comme un store. */
function masque(w: number, h: number, seuils: Float32Array, t: number): string {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const x = cv.getContext("2d")!;
  x.fillStyle = "#fff";
  for (let y = 0; y < h; y++) {
    for (let px = 0; px < w; px++) {
      if (seuils[y * w + px] < t) x.fillRect(px, y, 1, 1);
    }
  }
  return cv.toDataURL();
}

const MASQUE_W = 300;
const MASQUE_H = 90;

export default function Credo({ onDone }: { onDone: () => void }) {
  /** Ligne courante, et où en est sa dissolution (0 = absente, PAS = pleine). */
  const [i, setI] = useState(0);
  const [k, setK] = useState(0);
  /** true = elle se construit, false = elle s'efface. */
  const [monte, setMonte] = useState(true);
  const [fini, setFini] = useState(false);
  const [sansMouvement, setSansMouvement] = useState(false);

  /** ⚠️ Les masques vivent en STATE, pas dans un ref : ils sont lus au rendu
      (c'est eux qui masquent le texte), et le compilateur React refuse de lire
      un ref pendant le rendu. */
  const [masques, setMasques] = useState<string[] | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  // Les masques sont calculés une seule fois et servent aux trois lignes :
  // le texte se déchire toujours au même endroit, ce qui fait une signature
  // plutôt qu'un bruit différent à chaque ligne.
  // Différé d'un tour : le canvas n'existe qu'après hydratation, et le
  // compilateur React refuse un `setState` synchrone dans un effet.
  useEffect(() => {
    const id = setTimeout(() => {
      const s = new Float32Array(MASQUE_W * MASQUE_H);
      for (let n = 0; n < s.length; n++) s[n] = Math.random();
      setMasques(Array.from({ length: PAS + 1 }, (_, n) => masque(MASQUE_W, MASQUE_H, s, n / PAS)));
      setSansMouvement(animReduced());
    }, 0);
    return () => clearTimeout(id);
  }, []);

  /* LES CHAÎNES — dessinées une fois par palier de balancement. */
  const [sway, setSway] = useState(0);
  useEffect(() => {
    if (sansMouvement) return;
    const id = setInterval(() => setSway((v) => (v + 1) % 8), 420);
    return () => clearInterval(id);
  }, [sansMouvement]);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const x = cv.getContext("2d");
    if (!x) return;
    x.clearRect(0, 0, CW, CH);
    x.fillStyle = ORANGE;
    // Le balancement, en PIXELS ENTIERS (jamais une transition CSS, qui
    // interpolerait entre deux pixels). Deux crans d'amplitude : en dessous,
    // le mouvement passe sous le seuil de la grille et ne se voit pas.
    const d = [0, 1, 2, 2, 1, 0, -1, -1][sway];
    // Maquette : une chaîne descend du coin haut-gauche, une remonte du coin
    // bas-droit — elles encadrent le texte sans jamais le toucher.
    // ⚠️ Les deux sont exactement SYMÉTRIQUES par rapport au centre du cadre,
    // et leurs balancements sont opposés. Conséquence pour qui les mesure :
    // toute statistique globale du canvas (nombre de pixels, somme des
    // positions) est INVARIANTE pendant le balancement — les deux moitiés se
    // compensent. Mesurer une moitié du cadre, jamais le tout.
    chaine(x, -6, -8, 44, 168, 11, d);
    chaine(x, CW + 6, CH + 8, CW - 40, CH - 172, 11, -d);
  }, [sway]);

  /* LA DISSOLUTION — un palier à la fois, puis la tenue, puis l'effacement. */
  const derniere = i >= LIGNES.length - 1;
  useEffect(() => {
    if (fini || !masques) return;
    if (sansMouvement) {
      // Mouvement réduit : la dernière ligne, tout de suite, sans geste.
      const id = setTimeout(() => {
        setI(LIGNES.length - 1);
        setK(PAS);
        setFini(true);
      }, 16);
      return () => clearTimeout(id);
    }
    if (monte && k >= PAS) {
      // Elle est pleine : on la tient, puis on l'efface — sauf la dernière.
      if (derniere) {
        const id = setTimeout(() => setFini(true), MS_TENUE);
        return () => clearTimeout(id);
      }
      const id = setTimeout(() => setMonte(false), MS_TENUE);
      return () => clearTimeout(id);
    }
    if (!monte && k <= 0) {
      // Effacée : la suivante prend sa place, plus bas.
      const id = setTimeout(() => {
        setI((n) => n + 1);
        setMonte(true);
      }, 120);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setK((v) => v + (monte ? 1 : -1)), MS_PAS);
    return () => clearTimeout(id);
  }, [k, monte, derniere, fini, sansMouvement, masques]);

  /** Un tap saute à la fin : on ne retient personne devant un serment. */
  const sauter = useCallback(() => {
    if (fini) {
      onDone();
      return;
    }
    setI(LIGNES.length - 1);
    setMonte(true);
    setK(PAS);
    setFini(true);
  }, [fini, onDone]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") sauter();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sauter]);

  const ligne = LIGNES[Math.min(i, LIGNES.length - 1)];
  const src = masques?.[Math.max(0, Math.min(PAS, k))];
  // Chaque ligne est plus bas que la précédente (« juste en dessous »).
  const haut = 214 + i * 132;

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        onClick={sauter}
        className="phone-frame relative flex h-[848px] max-h-[100dvh] w-[390px] shrink-0 cursor-pointer flex-col overflow-clip bg-[var(--color-bg)]"
      >
        <canvas
          ref={canvas}
          width={CW}
          height={CH}
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ imageRendering: "pixelated" }}
        />
        <p
          className="absolute inset-x-0 text-center whitespace-pre-line text-[var(--color-ink)]"
          style={{
            top: haut,
            fontFamily: "var(--font-title)",
            fontSize: ligne.taille,
            lineHeight: 1.15,
            ...(src
              ? {
                  WebkitMaskImage: `url(${src})`,
                  maskImage: `url(${src})`,
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                }
              : { visibility: "hidden" as const }),
          }}
        >
          {ligne.texte}
        </p>
        {fini && <TouchHint />}
      </div>
    </main>
  );
}
