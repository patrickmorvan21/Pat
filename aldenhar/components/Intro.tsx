"use client";

/**
 * L'INTRODUCTION — LE PACTE, en quatre temps (refonte 05/09).
 *
 * Écrans Figma : 3450:3977 (la voix) · 3450:4033 (qui es-tu) · 3450:4066
 * (le Pacte et sa signature) · plus l'ÉCRAN D'ACTE 2245:13747, joué après le
 * Seuil. Grammaire reprise du prototype `prologue_pactum_v3.html` fourni par
 * Patrick : c'est de LUI que viennent la signature jugée et les répliques.
 *
 *   1. LA VOIX     — il parle, et il offre deux façons d'entrer :
 *                    lui demander qui il est, ou signer tout de suite.
 *   2. QUI ES-TU   — trois répliques, s'il l'a demandé. Aucun voile entre
 *                    elles : c'est la même scène qui continue de parler.
 *   3. LE PACTE    — le texte du contrat, puis « Appose ta marque » : on
 *                    SIGNE au doigt, dans le cadre.
 *   4. LE VERDICT  — il commente la marque qu'on vient de tracer.
 *
 * ⚠️ LA SIGNATURE EST UN GESTE, PAS UNE SAISIE. Le pilier « aucune saisie de
 * texte libre » tient : on trace, on n'écrit pas. Et ce qu'on trace est
 * réellement MESURÉ (durée, tracés, longueur, arrêts, taille, vitesse) — la
 * réplique qui suit est déduite de la main, jamais tirée au hasard. C'est ce
 * qui fait que le pacte est signé par le joueur et pas par le personnage.
 *
 * ⚠️ LES DEUX CLAUSES D'AVANT (« Tu ne te souviens pas », « Une seule vie »
 * et son geste de la porte) sont RETIRÉES de l'intro par cette refonte. Rien
 * n'est perdu de ce qu'elles disaient : le texte du Pacte porte la vie unique
 * et la Porte Scellée, en toutes lettres et sous forme écrite — ce qui est la
 * forme juste pour un contrat. Le sprite `intro_porte_anim.png` et son geste
 * de poussée restent dans le dépôt (git), à rebrancher en une clause si
 * Patrick les regrette.
 *
 * Quand ça se joue : au tout PREMIER lancement du compte seulement (drapeau
 * `introSeen`) — le pacte énonce les règles du JEU, pas celles d'une partie.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import TypedText from "@/components/TypedText";
import { markIntroSeen } from "@/lib/player-memory";
import { HeroGeolier } from "@/components/HeroGeolier";
import TouchHint from "@/components/TouchHint";
import VoilePixels, { useVoile } from "@/components/VoilePixels";
import { assetUrl } from "@/lib/assets";
import { ditherFadeMaskDataUrl } from "@/lib/dither";
import { haptic } from "@/lib/settings";

/* ------------------------------------------------------------------ TEXTES */

/**
 * ⚠️ Textes repris VERBATIM de la maquette et du prototype de Patrick — c'est
 * de la voix du Geôlier, pas de la copie d'interface : ne pas réécrire sans
 * qu'il le redemande.
 *
 * Le nombre est écrit en CHIFFRES parce que la maquette l'écrit ainsi (Figma
 * fait foi pour les écrans reproduits). C'est une statistique agrégée servie
 * comme dialogue, ce que la doctrine autorise expressément — jamais un chiffre
 * de mécanique dans l'interface.
 */
const VOIX = "12 000 avant toi ont poussé cette porte. Aucun n'a lu ce qu'il signait.";

/** Ce qu'il répond à « Qui es-tu ? » — trois répliques, une par tap. */
const QUI = [
  "Personne ne pose cette question en premier. Tu progresses.",
  "Je tiens le registre. Je n'ouvre rien, je ne sauve personne. Je compte.",
  "Ce qui m'intéresse, c'est jusqu'où tu descends. Descends bien.",
];

/** L'en-tête du contrat, sous le titre. */
const PACTE_ENTETE =
  "Par-devant le geôlier, qui tient le registre du Domaine et n'en ouvre pas les portes.";

/**
 * Les clauses. Le gras porte les quatre mots qui engagent : ce sont eux qu'on
 * relira à la Descente, des heures plus tard.
 */
const PACTE_CLAUSES: { avant: string; fort?: string; apres?: string }[] = [
  { avant: "Il te sera prêté une vie. ", fort: "Une seule." },
  { avant: "Tu entreprendras ", fort: "la Descente", apres: " : trois actes, du seuil jusqu'à la Porte Scellée." },
  { avant: "Ce que tu comprendras en mourant, tu le légueras." },
  { avant: "Ce que tu perdras, tu le perdras ", fort: "vraiment", apres: "." },
];

/** Mesures de la marque tracée — c'est la MAIN qui décide de la réplique. */
type Marque = {
  duree: number;
  traces: number;
  longueur: number;
  arrets: number;
  largeur: number;
  hauteur: number;
  vitesse: number;
  /** A-t-il demandé qui il était avant de signer ? */
  demande: boolean;
};

/** Portage du verdict du prototype, dans son ordre (du plus spécifique au
    plus général — la première condition vraie gagne). */
function verdict(m: Marque | null): string {
  if (!m) return "Rien. Tu n'as même pas essayé.";
  if (m.duree < 0.7 && m.longueur < 70) return "Tu aurais pu mieux t'appliquer.";
  if (m.arrets >= 2) return "Ta main s'est arrêtée deux fois. J'ai noté les deux.";
  if (m.largeur > 0.82 || m.hauteur > 0.7)
    return "Grande signature. Comme si la taille changeait quelque chose.";
  if (m.duree > 4.5 || m.traces >= 4)
    return "Tant de soin, pour un nom que personne ne relira.";
  if (m.vitesse > 260)
    return "Vite. Les pressés arrivent au même endroit, simplement plus tôt.";
  if (!m.demande)
    return "Tu n'as même pas demandé qui je suis. Bien. Ça t'évitera d'espérer.";
  return "Ça fera l'affaire. Elles font toutes l'affaire.";
}

/* -------------------------------------------------------------- LA MARQUE */

const SIG_W = 363;
const SIG_H = 140;
/** Demi-résolution, comme tout ce qui est tramé : 1 px de tracé = 2 px écran. */
const SIG_CW = Math.round(SIG_W / 2);
const SIG_CH = Math.round(SIG_H / 2);

/**
 * LE CADRE DE SIGNATURE. Bordure en TIRETS DE PIXELS dessinée dans le canvas
 * (jamais un `border: dashed` du navigateur, qui rendrait un trait lisse), un
 * fond piqueté, une ligne d'écriture et sa croix — la page d'un registre.
 *
 * ⚠️ Les événements de pointeur vivent sur `window` et non sur le canvas :
 * sur iOS, un doigt qui sort du cadre pendant le tracé emporte les
 * événements avec lui, et la signature se coupe en plein milieu.
 */
function SignaturePad({ onMarque }: { onMarque: (m: Marque | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [traceQuelqueChose, setTrace] = useState(false);

  // Tout ce qui se mesure vit dans un ref : rien de ça ne se rend.
  const st = useRef({
    traces: 0,
    longueur: 0,
    debut: 0,
    fin: 0,
    arrets: 0,
    dernierLever: 0,
    dessine: false,
    prec: null as [number, number] | null,
    minX: 1e9,
    maxX: -1e9,
    minY: 1e9,
    maxY: -1e9,
  });

  const fond = useCallback(() => {
    const cv = ref.current;
    if (!cv) return;
    const x = cv.getContext("2d");
    if (!x) return;
    x.fillStyle = "#1c1a16";
    x.fillRect(0, 0, SIG_CW, SIG_CH);
    // Piqueté de fond — jamais un aplat propre.
    x.fillStyle = "rgba(255,255,255,.2)";
    for (let i = 0; i < 90; i++)
      x.fillRect((Math.random() * SIG_CW) | 0, (Math.random() * SIG_CH) | 0, 1, 1);
    // Bordure en tirets de pixels.
    for (let px = 0; px < SIG_CW; px++) {
      if (px % 4 < 2) {
        x.fillRect(px, 0, 1, 1);
        x.fillRect(px, SIG_CH - 1, 1, 1);
      }
    }
    for (let py = 0; py < SIG_CH; py++) {
      if (py % 4 < 2) {
        x.fillRect(0, py, 1, 1);
        x.fillRect(SIG_CW - 1, py, 1, 1);
      }
    }
    // La ligne d'écriture et la croix qui dit où signer.
    const y = SIG_CH - 16;
    for (let px = 10; px < SIG_CW - 10; px++)
      if (Math.random() < 0.6) x.fillRect(px, y + ((Math.random() * 2) | 0), 1, 1);
    x.fillStyle = "rgba(255,255,255,.5)";
    for (let k = -3; k <= 3; k++) {
      x.fillRect(14 + k, y - 6 + k, 1, 1);
      x.fillRect(14 + k, y - 6 - k, 1, 1);
    }
  }, []);

  useEffect(() => {
    fond();
  }, [fond]);

  const encre = useCallback((px: number, py: number) => {
    const x = ref.current?.getContext("2d");
    if (!x) return;
    // L'encre baye : sept pixels autour du point, une pincée de blanc.
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.8;
      x.fillStyle = Math.random() < 0.82 ? "#e0632a" : "#ffffff";
      x.fillRect((px + Math.cos(a) * r) | 0, (py + Math.sin(a) * r) | 0, 1, 1);
    }
    if (Math.random() < 0.2) {
      x.fillStyle = "rgba(255,255,255,.2)";
      x.fillRect((px + (Math.random() * 7 - 3)) | 0, (py + (Math.random() * 7 - 3)) | 0, 1, 1);
    }
  }, []);

  const coord = useCallback((e: PointerEvent | React.PointerEvent): [number, number] => {
    const cv = ref.current!;
    const r = cv.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / r.width) * SIG_CW,
      ((e.clientY - r.top) / r.height) * SIG_CH,
    ];
  }, []);

  const borner = useCallback((p: [number, number]) => {
    const s = st.current;
    s.minX = Math.min(s.minX, p[0]);
    s.maxX = Math.max(s.maxX, p[0]);
    s.minY = Math.min(s.minY, p[1]);
    s.maxY = Math.max(s.maxY, p[1]);
  }, []);

  /** Rend les mesures au parent — appelé à chaque relèvement de doigt, pour
      que le CTA soit toujours à jour sans que rien ne se rende pendant le
      tracé (un rendu par mouvement hacherait le trait). */
  const publier = useCallback(() => {
    const s = st.current;
    if (s.longueur <= 4) {
      onMarque(null);
      return;
    }
    const duree = Math.max(1, s.fin - s.debut) / 1000;
    onMarque({
      duree,
      traces: s.traces,
      longueur: s.longueur,
      arrets: s.arrets,
      largeur: (s.maxX - s.minX) / SIG_CW,
      hauteur: (s.maxY - s.minY) / SIG_CH,
      vitesse: s.longueur / duree,
      demande: false, // posé par l'appelant, qui seul sait s'il a demandé
    });
    setTrace(true);
  }, [onMarque]);

  useEffect(() => {
    function move(e: PointerEvent) {
      const s = st.current;
      if (!s.dessine || !s.prec) return;
      const p = coord(e);
      const d = Math.hypot(p[0] - s.prec[0], p[1] - s.prec[1]);
      const n = Math.max(1, Math.round(d));
      for (let i = 1; i <= n; i++)
        encre(s.prec[0] + ((p[0] - s.prec[0]) * i) / n, s.prec[1] + ((p[1] - s.prec[1]) * i) / n);
      s.longueur += d;
      s.prec = p;
      borner(p);
      e.preventDefault();
    }
    function up() {
      const s = st.current;
      if (!s.dessine) return;
      s.dessine = false;
      s.dernierLever = s.fin = performance.now();
      publier();
    }
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [coord, encre, borner, publier]);

  return (
    <div className="relative">
      <canvas
        ref={ref}
        width={SIG_CW}
        height={SIG_CH}
        onPointerDown={(e) => {
          const s = st.current;
          s.dessine = true;
          s.traces += 1;
          const now = performance.now();
          if (!s.debut) s.debut = now;
          else if (now - s.dernierLever > 420) s.arrets += 1;
          const p = coord(e);
          s.prec = p;
          encre(p[0], p[1]);
          borner(p);
          e.preventDefault();
          e.stopPropagation();
        }}
        className="block w-full"
        style={{ height: SIG_H, imageRendering: "pixelated", touchAction: "none" }}
      />
      {!traceQuelqueChose && (
        <p className="pointer-events-none absolute inset-x-0 bottom-[10px] text-center font-mono text-[10px] tracking-[1.6px] text-[var(--color-ink)] opacity-40">
          Signe du doigt
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- LE BOUTON */

/**
 * Bouton du pacte — même grammaire que les CTA de l'accueil (`HomeCta`) :
 * fond et bordure en calques inset-0, entailles de coin 2×2 posées PAR-DESSUS
 * au ras du coin. Jamais une bordure CSS sur le bouton lui-même, qui
 * décalerait les entailles d'un pixel.
 */
function IntroBouton({
  label,
  /** Le SECONDAIRE : contour et texte BLANCS (retour Patrick, 2/09). L'orange
      plein reste au seul geste que le pacte attend de toi. */
  refus,
  /** Inerte tant que la condition n'est pas remplie (le pacte non signé). */
  disabled,
  onClick,
}: {
  label: string;
  refus?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-disabled={disabled || undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) return;
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={`relative h-[46px] w-full border-none bg-transparent font-mono text-[13px] font-medium tracking-[2.4px] uppercase ${
        refus ? "text-[var(--color-ink)]" : "text-[var(--color-bg)]"
      } ${disabled ? "cursor-default opacity-40" : "cursor-pointer"}`}
    >
      <span
        className={`absolute inset-0 border border-solid ${
          refus
            ? "border-[var(--color-ink)] bg-transparent"
            : "border-[var(--color-accent)] bg-[var(--color-accent)]"
        }`}
        aria-hidden
      />
      <span className="pointer-events-none absolute top-0 left-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="pointer-events-none absolute bottom-0 left-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="pointer-events-none absolute top-0 right-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="pointer-events-none absolute bottom-0 right-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="relative">{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------- LES ÉCRANS */

type Etape = "voix" | "qui" | "pacte" | "verdict";

/** Le cadre commun : 390×848, charbon, tout en absolu comme la maquette. */
function Cadre({
  onTap,
  children,
  voile,
  onVoileFini,
}: {
  onTap?: () => void;
  children: React.ReactNode;
  voile: ReturnType<typeof useVoile>["etat"];
  onVoileFini: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        onClick={onTap}
        className={`phone-frame relative flex h-[848px] max-h-[100dvh] w-[390px] shrink-0 flex-col overflow-clip bg-[var(--color-bg)] ${
          onTap ? "cursor-pointer" : ""
        }`}
      >
        {children}
        <VoilePixels etat={voile} onFini={onVoileFini} />
      </div>
    </main>
  );
}

/** Le Geôlier en haut (390×390) + sa bande de dissolution, puis sa réplique
    au format de la maquette (x=42, y=444, largeur 306). */
function Demon({
  texte,
  tape,
  onFini,
  skip,
}: {
  texte: string;
  tape: boolean;
  onFini?: () => void;
  skip: number;
}) {
  return (
    <>
      <div className="relative h-[390px] w-[390px] shrink-0">
        <HeroGeolier height={390} />
        <div className="dissolve-bottom" aria-hidden />
      </div>
      <p className="mt-[54px] w-[306px] self-center text-center font-mono text-[13px] leading-[1.55] text-[var(--color-ink)]">
        <TypedText text={texte} typed={tape} skip={skip} msPerChar={42} onDone={onFini} />
      </p>
    </>
  );
}

export default function Intro({ onDone }: { onDone: () => void }) {
  const [etape, setEtape] = useState<Etape>("voix");
  /** Réplique lue jusqu'au bout ? C'est elle qui débloque l'issue de l'écran. */
  const [lu, setLu] = useState(false);
  /** Incrémenté à chaque tap : termine la frappe en cours (règle globale —
      1er toucher = tout afficher, 2e = continuer). */
  const [skip, setSkip] = useState(0);
  /** Index de la réplique de « Qui es-tu ? ». */
  const [n, setN] = useState(0);
  /** A-t-il demandé qui il était ? Le verdict s'en sert. */
  const [demande, setDemande] = useState(false);
  const [marque, setMarque] = useState<Marque | null>(null);

  const { etat: voile, transiter, onFini: voileFini } = useVoile();

  /** LE MASQUE DE LA PLUME. Elle est posée en filigrane derrière le contrat
      (maquette : x=51, y=348) et courrait donc jusque sur le cadre de
      signature et le CTA. Elle s'y dissout en PIXELS plutôt que d'être coupée
      net — et sa densité est portée par le masque, jamais par une opacité CSS
      (règle DA : ce qui s'atténue s'atténue en trame). */
  const [masquePlume, setMasquePlume] = useState<string | null>(null);
  useEffect(() => {
    const id = setTimeout(() => {
      setMasquePlume(
        ditherFadeMaskDataUrl(72, 144, (_nx, ny) => {
          // Pleine densité en haut, éteinte avant la zone de signature.
          const vivant = ny < 0.3 ? 1 : Math.max(0, 1 - (ny - 0.3) / 0.22);
          return 1 - 0.62 * vivant;
        })
      );
    }, 0);
    return () => clearTimeout(id);
  }, []);

  /** Change d'écran DERRIÈRE le voile de pixels. */
  const aller = useCallback(
    (suite: Etape) => {
      transiter(() => {
        setEtape(suite);
        setLu(false);
        setSkip(0);
      });
    },
    [transiter]
  );

  const terminer = useCallback(() => {
    markIntroSeen();
    onDone();
  }, [onDone]);

  /* --------------------------------------------------------------- LA VOIX */
  if (etape === "voix") {
    return (
      <Cadre voile={voile} onVoileFini={voileFini} onTap={lu ? undefined : () => setSkip((k) => k + 1)}>
        <Demon texte={VOIX} tape skip={skip} onFini={() => setLu(true)} />
        <div className="flex-1" />
        {/* Les deux CTA n'apparaissent qu'une fois la phrase lue : on ne
            propose pas de signer un texte qui est encore en train de s'écrire.
            Positions de la maquette (y=733 et y=787 dans un cadre de 848). */}
        {lu && (
          <div className="mb-[15px] flex flex-col gap-[8px] px-[15px]">
            <IntroBouton
              label="Qui es-tu ?"
              refus
              onClick={() => {
                setDemande(true);
                setN(0);
                aller("qui");
              }}
            />
            <IntroBouton label="Signer." onClick={() => aller("pacte")} />
          </div>
        )}
        {!lu && <TouchHint libelle="Touche pour tout afficher" />}
      </Cadre>
    );
  }

  /* ------------------------------------------------------------- QUI ES-TU */
  if (etape === "qui") {
    // ⚠️ AUCUN VOILE ENTRE CES TROIS RÉPLIQUES : l'écran ne change pas, c'est
    // la même scène qui continue de parler. C'est l'exception que Patrick a
    // posée en demandant la transition générale.
    const suivant = () => {
      if (!lu) {
        setSkip((k) => k + 1);
        return;
      }
      if (n + 1 < QUI.length) {
        setN((k) => k + 1);
        setLu(false);
        return;
      }
      aller("pacte");
    };
    return (
      <Cadre voile={voile} onVoileFini={voileFini} onTap={suivant}>
        <Demon
          key={n}
          texte={QUI[n]}
          tape
          skip={skip}
          onFini={() => setLu(true)}
        />
        <div className="flex-1" />
        <TouchHint libelle={lu ? "Touche pour continuer" : "Touche pour tout afficher"} />
      </Cadre>
    );
  }

  /* --------------------------------------------------------------- LE PACTE */
  if (etape === "pacte") {
    return (
      <Cadre voile={voile} onVoileFini={voileFini}>
        {/* LA PLUME, en filigrane derrière le contrat (maquette : posée à
            x=51, elle court sous la zone de signature). Elle est déjà tramée :
            rien à dégrader, elle se pose telle quelle. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- rendu pixelated, jamais optimisé par next/image */}
        <img
          src={assetUrl("assets/intro_plume.png")}
          alt=""
          aria-hidden
          className="pointer-events-none absolute top-[348px] left-[51px] w-[288px]"
          style={{
            imageRendering: "pixelated",
            ...(masquePlume
              ? {
                  WebkitMaskImage: `url(${masquePlume})`,
                  maskImage: `url(${masquePlume})`,
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                }
              : { visibility: "hidden" as const }),
          }}
        />

        <h1
          className="relative mt-[104px] text-center text-[30px] leading-[1] text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-title)" }}
        >
          Le Pacte
        </h1>
        {/* Le filet du contrat — un semis de pixels, jamais un trait plein. */}
        <div className="relative mx-[16px] mt-[31px] h-px w-[358px] self-center" style={{
          backgroundImage:
            "repeating-linear-gradient(to right, var(--color-ink) 0 1px, transparent 1px 3px)",
          opacity: 0.35,
        }} aria-hidden />

        <p className="relative mx-[16px] mt-[38px] font-mono text-[10px] leading-[1.5] tracking-[0.4px] text-[var(--color-ink)] opacity-50">
          {PACTE_ENTETE}
        </p>
        <div className="relative mx-[16px] mt-[14px] flex flex-col gap-[9px]">
          {PACTE_CLAUSES.map((c, i) => (
            <p key={i} className="font-mono text-[13px] leading-[1.5] text-[var(--color-ink)]">
              {c.avant}
              {c.fort && <span className="font-bold text-[var(--color-accent)]">{c.fort}</span>}
              {c.apres}
            </p>
          ))}
        </div>

        <div className="flex-1" />

        {/* LA MARQUE — « Appose ta marque » y=606, cadre y=631 (363×140),
            CTA y=787 (363×46), le tout à x=13 dans un cadre de 848. */}
        <div className="relative mx-[13px] mb-[15px] w-[363px]">
          <p className="mb-[10px] font-mono text-[10px] tracking-[1.6px] text-[var(--color-ink)] opacity-50">
            Appose ta marque
          </p>
          <SignaturePad onMarque={setMarque} />
          <div className="mt-[16px]">
            <IntroBouton
              label="Sceller le pacte"
              disabled={!marque}
              onClick={() => {
                haptic(14);
                aller("verdict");
              }}
            />
          </div>
        </div>
      </Cadre>
    );
  }

  /* ------------------------------------------------------------- LE VERDICT */
  return (
    <Cadre
      voile={voile}
      onVoileFini={voileFini}
      onTap={() => (lu ? terminer() : setSkip((k) => k + 1))}
    >
      <Demon
        texte={verdict(marque ? { ...marque, demande } : null)}
        tape
        skip={skip}
        onFini={() => setLu(true)}
      />
      <div className="flex-1" />
      <TouchHint libelle={lu ? "Touche pour continuer" : "Touche pour tout afficher"} />
    </Cadre>
  );
}

/**
 * ÉCRAN D'ACTE (Figma 2245:13747) — après le pacte, avant la zone.
 *
 * ⚠️ « Les Lisières » n'est PAS un autre nom des Landes, et la question est
 * CLOSE depuis le 10/08 : Les Lisières sont l'ACTE I, Les Landes une ZONE
 * dedans. L'acte se nomme sur ce carton, la zone se nomme partout ailleurs.
 * Ne pas rouvrir.
 *
 * L'acte II aura son propre visuel (annoncé par Patrick, pas encore fourni) :
 * la table ci-dessous est là pour l'accueillir sans toucher au composant —
 * les visuels d'acte vivent dans le Drive sous `Assets/IMG/3 actes`.
 */
const ACTES = [
  { eyebrow: "• LE DOMAINE •", title: "Les Lisières", image: "assets/scene_landes_frise_montagnes_pleine_b.png" },
];

export function ActeScreen({ acte = 0, onDone }: { acte?: number; onDone: () => void }) {
  const a = ACTES[Math.min(acte, ACTES.length - 1)];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") onDone();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        onClick={onDone}
        className="phone-frame relative flex h-[841px] max-h-[100dvh] w-[390px] shrink-0 cursor-pointer flex-col overflow-clip"
        style={{ background: "var(--color-accent)" }}
      >
        {/* Le titre est POSÉ SUR l'orange, en charbon — l'illustration démarre
            à la même hauteur mais son ciel est orange, donc le texte porte. */}
        <div className="absolute inset-x-0 top-[196px] z-[1] text-center">
          <p className="font-mono text-[9px] font-bold tracking-[2.5px] text-[var(--color-bg)]">
            {a.eyebrow}
          </p>
          <h1
            className="mt-[8px] text-[34px] leading-[1] text-[var(--color-bg)]"
            style={{ fontFamily: "var(--font-title)" }}
          >
            {a.title}
          </h1>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element -- rendu pixelated, jamais optimisé par next/image */}
        <img
          src={assetUrl(a.image)}
          alt=""
          className="absolute inset-x-0 top-[224px] h-[390px] w-[390px] object-cover"
          style={{ imageRendering: "pixelated" }}
        />
        {/* Sous la frise, le charbon reprend jusqu'en bas. */}
        <div className="absolute inset-x-0 bottom-0 top-[610px] bg-[var(--color-bg)]" />

        <TouchHint />
      </div>
    </main>
  );
}
