"use client";

/**
 * LE CREDO — l'écran des trois phrases, entre le Seuil et le carton d'acte.
 *
 * Maquette Figma 3388:889, relevée au pixel. Fond charbon, les CHAÎNES en
 * orange tramé dans deux coins opposés (le fichier `credo_chaines.png` est
 * l'export du calque de la maquette, pas un dessin de ma main), et trois
 * phrases en Instrument Serif blanc, centrées, à y=282 / 357 / 432.
 *
 * ⚠️ LES PHRASES S'ACCUMULENT, elles ne se remplacent pas. La demande de
 * Patrick — « chaque mot s'affiche indépendamment, il s'efface en pixels pour
 * laisser apparaître le suivant juste en dessous » — désigne la TRAME qui se
 * dissout pour révéler la phrase, pas la phrase d'avant qui disparaîtrait : la
 * maquette montre les trois ensemble, et c'est cet état-là qui est l'écran.
 *
 * Chaque phrase se MATÉRIALISE : un semis de pixels qui se remplit par paliers
 * (jamais une opacité qui monte — règle DA). Le seuil de chaque pixel est tiré
 * une fois, donc la phrase s'assemble toujours de la même façon.
 *
 * Il ne se joue qu'à la première incarnation d'un compte, comme l'intro : il
 * énonce la règle du jeu, pas celle d'une partie.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import ImagePixels from "@/components/ImagePixels";
import TouchHint from "@/components/TouchHint";
import { animReduced } from "@/lib/settings";

/**
 * Les trois phrases. ⚠️ Elles ne sont plus posées sur la grille de 848 : le
 * cadre fait la hauteur du device sous 768 px, donc un `top` figé décalait
 * tout. Le bloc est CENTRÉ dans le cadre, et l'écart entre les phrases est
 * généreux (retour Patrick 5/09 : « espacer l'interlignage aussi »).
 */
const LIGNES: { texte: string[] }[] = [
  { texte: ["Une vie."] },
  { texte: ["Un dé."] },
  { texte: ["Le Domaine", "se souvient."] },
];
/** Écart entre deux phrases, en px. */
const ECART = 46;

/** Paliers de matérialisation, et temps de lecture avant la phrase suivante. */
const PAS = 9;
const MS_PAS = 55;
const MS_TENUE = 1250;
/** Balancement des chaînes : décalage horizontal en pixels ENTIERS. */
const BALANCE = [0, 1, 2, 3, 3, 2, 1, 0, -1, -2, -3, -3, -2, -1];

/**
 * Le masque de matérialisation d'une phrase : chaque pixel a un seuil tiré
 * une fois, il apparaît quand la progression le dépasse. Rendu à demi-échelle
 * — la cellule fait 2 px à l'écran, ce qui se lit comme du pixel et coûte
 * quatre fois moins à générer.
 */
function masque(w: number, h: number, seuils: Float32Array, p: number): string {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const x = cv.getContext("2d")!;
  x.fillStyle = "#fff";
  for (let i = 0; i < seuils.length; i++) {
    if (seuils[i] <= p) x.fillRect(i % w, (i / w) | 0, 1, 1);
  }
  return cv.toDataURL();
}

export default function Credo({ onDone }: { onDone: () => void }) {
  /** Combien de phrases ont commencé à se matérialiser. */
  const [n, setN] = useState(0);
  /** Progression (0..1) de la phrase en cours. */
  const [p, setP] = useState(0);
  const [masques, setMasques] = useState<(string | null)[]>([null, null, null]);
  const seuils = useRef<Float32Array[] | null>(null);
  const fige = useRef(false);
  /** Hauteur réelle du cadre : elle vaut 848 en preview desktop et la hauteur
      du device sur mobile (`height:100dvh` sous 768 px). Lue au montage, jamais
      supposée. */
  const cadreRef = useRef<HTMLDivElement | null>(null);
  const [hauteur, setHauteur] = useState(848);
  useEffect(() => {
    const maj = () => {
      const h = cadreRef.current?.getBoundingClientRect().height;
      if (h) setHauteur(Math.round(h));
    };
    maj();
    window.addEventListener("resize", maj);
    return () => window.removeEventListener("resize", maj);
  }, []);

  useEffect(() => {
    fige.current = animReduced();
  }, []);

  /** Les seuils, tirés UNE fois par phrase (largeur du cadre × hauteur du bloc,
      en demi-résolution). */
  const seuilsDe = useCallback((i: number) => {
    if (!seuils.current) {
      seuils.current = LIGNES.map((l) => {
        const w = 195;
        const h = Math.ceil((l.texte.length * 62 + 8) / 2);
        const a = new Float32Array(w * h);
        for (let k = 0; k < a.length; k++) a[k] = Math.random();
        return a;
      });
    }
    return seuils.current[i];
  }, []);

  /** Termine instantanément tout ce qui est en cours (tap, ou animations
      réduites) : les trois phrases sont posées, pleines. */
  const tout = useCallback(() => {
    setN(LIGNES.length);
    setP(1);
    setMasques([null, null, null]);
  }, []);

  useEffect(() => {
    if (fige.current) {
      tout();
      return;
    }
    if (n >= LIGNES.length) return;
    let pas = 0;
    const w = 195;
    const h = Math.ceil((LIGNES[n].texte.length * 62 + 8) / 2);
    const s = seuilsDe(n);
    const id = setInterval(() => {
      pas += 1;
      const prog = pas / PAS;
      setP(prog);
      setMasques((m) => {
        const c = [...m];
        c[n] = prog >= 1 ? null : masque(w, h, s, prog);
        return c;
      });
      if (pas >= PAS) {
        clearInterval(id);
        setTimeout(() => setN((k) => k + 1), MS_TENUE);
      }
    }, MS_PAS);
    return () => clearInterval(id);
  }, [n, seuilsDe, tout]);

  /** Une fois les trois posées, l'écran attend un geste — il ne s'échappe pas
      tout seul : c'est le serment, on le laisse être lu. */
  const fini = n >= LIGNES.length;

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        onClick={() => (fini ? onDone() : tout())}
        ref={cadreRef}
        className="phone-frame relative flex h-[848px] max-h-[100dvh] w-[390px] shrink-0 cursor-pointer flex-col items-center justify-center overflow-clip bg-[var(--color-bg)]"
      >
        {/* LES CHAÎNES — l'image de la maquette, rendue en grille de pixels et
            balancée par bandes : elles sont accrochées en haut, donc le bas
            porte le mouvement. */}
        {/* LES CHAÎNES prennent TOUTE la hauteur du device (retour Patrick
            5/09 : « l'image est coupée en bas »). L'image de la maquette est
            calibrée sur 848 ; en « cover » elle est mise à l'échelle du cadre
            réel et CENTRÉE, donc les deux coins de chaîne restent entiers
            quelle que soit la taille de l'écran. */}
        <ImagePixels
          src="assets/credo_chaines_b.png"
          width={390}
          height={hauteur}
          ajuste="cover"
          sway={BALANCE}
          swayMs={520}
          swayBand={40}
          className="pointer-events-none absolute inset-0"
        />

        <div
          className="relative flex flex-col items-center"
          style={{ gap: ECART }}
        >
        {LIGNES.map((l, i) => {
          const visible = i < n || (i === n && p > 0);
          const m = masques[i];
          return (
            <div
              key={i}
              className="w-full text-center leading-[62px] text-[48px] text-[var(--color-ink)]"
              style={{
                fontFamily: "var(--font-title)",
                visibility: visible ? "visible" : "hidden",
                ...(m
                  ? {
                      WebkitMaskImage: `url(${m})`,
                      maskImage: `url(${m})`,
                      WebkitMaskSize: "100% 100%",
                      maskSize: "100% 100%",
                    }
                  : {}),
              }}
            >
              {l.texte.map((t, k) => (
                <div key={k}>{t}</div>
              ))}
            </div>
          );
        })}
        </div>

        {fini && <TouchHint />}
      </div>
    </main>
  );
}
