"use client";

/**
 * L'INTRODUCTION — LE PACTE, en quatre temps.
 *
 * ⚠️ LES MAQUETTES FONT FOI, PAS LE PROTOTYPE. Cette version est relevée au
 * pixel sur les écrans Figma 3450:3977 (la voix) · 3450:4033 (qui es-tu) ·
 * 3450:4066 (le Pacte). Le prototype `prologue_pactum_v3.html` de Claude Chat
 * n'apporte plus que la MÉCANIQUE de la signature jugée ; tout ce qui se voit
 * (fond orange, position du démon, style des boutons, texte du contrat) vient
 * des maquettes. Ne pas réintroduire ce que le prototype ajoutait et que les
 * maquettes ne montrent pas — en-tête « Par-devant le geôlier », affordance
 * « Signe du doigt », emphases orange dans les clauses, boutons en capitales.
 *
 *   1. LA VOIX     — il parle sur fond ORANGE, et il offre deux façons
 *                    d'entrer : lui demander qui il est, ou signer.
 *   2. QUI ES-TU   — trois répliques. Aucun voile entre elles : c'est la même
 *                    scène qui continue de parler.
 *   3. LE PACTE    — le contrat sur fond charbon, la plume en filigrane, puis
 *                    « Appose ta marque » : on SIGNE au doigt.
 *   4. LE VERDICT  — il commente la marque qu'on vient de tracer.
 *
 * ⚠️ LA SIGNATURE EST UN GESTE, PAS UNE SAISIE. Le pilier « aucune saisie de
 * texte libre » tient : on trace, on n'écrit pas. Et ce qu'on trace est
 * réellement MESURÉ (durée, tracés, longueur, arrêts, taille, vitesse) — la
 * réplique qui suit est déduite de la main, jamais tirée au hasard.
 *
 * ⚠️ LES DEUX CLAUSES D'AVANT (« Tu ne te souviens pas », « Une seule vie » et
 * son geste de la porte) sont RETIRÉES. Rien n'est perdu de ce qu'elles
 * disaient : le texte du Pacte porte la vie unique et la Porte Scellée, en
 * toutes lettres. Le sprite `intro_porte_anim.png` reste dans le dépôt.
 *
 * Quand ça se joue : au tout PREMIER lancement du compte (drapeau `introSeen`)
 * — le pacte énonce les règles du JEU, pas celles d'une partie.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import TypedText from "@/components/TypedText";
import ImagePixels from "@/components/ImagePixels";
import { markIntroSeen } from "@/lib/player-memory";
import TouchHint from "@/components/TouchHint";
import VoilePixels, { useVoile } from "@/components/VoilePixels";
import { assetUrl } from "@/lib/assets";
import { haptic } from "@/lib/settings";

/* ------------------------------------------------------------------ TEXTES */

/**
 * ⚠️ Textes relevés VERBATIM sur les maquettes — c'est de la voix du Geôlier,
 * pas de la copie d'interface.
 *
 * Le nombre est écrit en CHIFFRES parce que la maquette l'écrit ainsi. C'est
 * une statistique agrégée servie comme dialogue, ce que la doctrine autorise
 * — jamais un chiffre de mécanique dans l'interface.
 */
/* ⚠️ La maquette écrit « on poussé » — c'est une faute de frappe, pas une
   intention : on garde « ont ». Seul écart assumé avec la lettre de la
   maquette, signalé plutôt que reproduit. */
const VOIX = "12 000 avant toi ont poussé cette porte. Aucun n'a lu ce qu'il signait.";

/** Ce qu'il répond à « Qui es-tu ? » — une réplique par tap. La première est
    celle de la maquette 3450:4033 ; les deux suivantes prolongent sa voix. */
const QUI = [
  "Personne ne pose cette question en premier. Tu progresses.",
  "Je tiens le registre. Je n'ouvre rien, je ne sauve personne. Je compte.",
  "Ce qui m'intéresse, c'est jusqu'où tu descends. Descends bien.",
];

/**
 * Les quatre clauses, telles que la maquette les affiche : mono 13px, BLANC,
 * sans un mot en gras ni en orange, séparées par une ligne vide.
 */
const PACTE_CLAUSES = [
  "Il te sera prêté une vie. Une seule.",
  "Tu entreprendras la Descente : trois actes, du seuil jusqu'à la Porte Scellée.",
  "Ce que tu comprendras en mourant, tu le légueras.",
  "Ce que tu perdras, tu le perdras vraiment.",
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
 * LE CADRE DE SIGNATURE (maquette : 363×140, bordure blanche en tirets à 50 %).
 * Les tirets sont DESSINÉS dans le canvas plutôt que posés en `border: dashed`
 * — même lecture à l'écran, mais en pixels entiers comme tout le reste du jeu.
 *
 * ⚠️ Les événements de pointeur vivent sur `window` et non sur le canvas : sur
 * iOS, un doigt qui sort du cadre pendant le tracé emporte les événements avec
 * lui, et la signature se coupe en plein milieu.
 */
function SignaturePad({ onMarque }: { onMarque: (m: Marque | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

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
    for (let i = 0; i < 42; i++)
      x.fillRect((Math.random() * SIG_CW) | 0, (Math.random() * SIG_CH) | 0, 1, 1);
    // Bordure en tirets, à la densité de la maquette (blanc à 50 %).
    x.fillStyle = "rgba(255,255,255,.5)";
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
  );
}

/* ------------------------------------------------------------- LE BOUTON */

/**
 * Les boutons du pacte, dans les DEUX formes que montrent les maquettes.
 *
 *  · « ligne » (écrans du Geôlier) — fond transparent, filet BLANC 1px, texte
 *    blanc 14px medium ALIGNÉ À GAUCHE, en casse de phrase. Pas de capitales,
 *    pas d'orange : ces deux boutons se ressemblent parce que le Geôlier ne
 *    recommande ni l'un ni l'autre.
 *  · « plein » (sceller le pacte) — orange plein, texte charbon en capitales
 *    espacées, centré.
 *
 * Dans les deux cas les entailles de coin 2×2 sont posées PAR-DESSUS, au ras
 * du coin, et la bordure vit dans un calque `inset-0` — jamais sur le bouton
 * lui-même, dont la boîte de padding décalerait les entailles d'un pixel
 * (piège récurrent, vu au zoom par Patrick le 16/07).
 */
function IntroBouton({
  label,
  plein,
  disabled,
  onClick,
}: {
  label: string;
  plein?: boolean;
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
      className={`relative h-[46px] w-full border-none bg-transparent font-mono text-[14px] font-medium ${
        plein
          ? "tracking-[2.8px] text-center uppercase text-[var(--color-bg)]"
          : "text-left text-[var(--color-ink)]"
      } ${disabled ? "cursor-default opacity-40" : "cursor-pointer"}`}
    >
      <span
        className={`absolute inset-0 border border-solid ${
          plein
            ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
            : "border-[var(--color-ink)] bg-transparent"
        }`}
        aria-hidden
      />
      <span className="pointer-events-none absolute top-0 left-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="pointer-events-none absolute bottom-0 left-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="pointer-events-none absolute top-0 right-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="pointer-events-none absolute bottom-0 right-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className={`relative ${plein ? "" : "pl-[18px]"}`}>{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------- LES ÉCRANS */

type Etape = "voix" | "qui" | "pacte" | "verdict";

/** Le cadre commun : 390×848, tout en absolu comme les maquettes. */
function Cadre({
  onTap,
  children,
  voile,
  onVoileFini,
  orange,
}: {
  onTap?: () => void;
  children: React.ReactNode;
  voile: ReturnType<typeof useVoile>["etat"];
  onVoileFini: () => void;
  /** Les écrans du Geôlier ont le fond ORANGE (maquettes 3450:3977 / 4033). */
  orange?: boolean;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        onClick={onTap}
        className={`phone-frame relative h-[848px] max-h-[100dvh] w-[390px] shrink-0 overflow-clip ${
          orange ? "bg-[var(--color-accent)]" : "bg-[var(--color-bg)]"
        } ${onTap ? "cursor-pointer" : ""}`}
      >
        {children}
        <VoilePixels etat={voile} onFini={onVoileFini} />
      </div>
    </main>
  );
}

/**
 * L'ÉCRAN DU GEÔLIER (maquettes 3450:3977 et 3450:4033), au pixel :
 * fond orange, l'image du démon 390×390 posée à y=74, le socle charbon
 * 201×96 à (90,368) et la nappe charbon qui prend tout à partir de y=464.
 * Sa réplique est centrée, large de 306, à y=444.
 *
 * ⚠️ L'image est rendue en GRILLE DE PIXELS (`ImagePixels`) et non en <img> :
 * c'est la demande de Patrick — ses images redeviennent de la matière, avec
 * des cellules assez fines pour qu'on ne distingue pas l'original.
 */
function EcranGeolier({
  texte,
  onFini,
  skip,
  cle,
}: {
  texte: string;
  onFini?: () => void;
  skip: number;
  cle: string | number;
}) {
  return (
    <>
      <ImagePixels
        src="assets/intro_demon.png"
        width={390}
        height={390}
        className="absolute top-[74px] left-0"
      />
      {/* ⚠️ LES DEUX NAPPES CHARBON SE POSENT PAR-DESSUS L'IMAGE, jamais
          derrière : c'est le socle 201×96 qui efface le sceau de poitrine du
          démon et ne laisse que ses épaules à l'orange, exactement comme la
          maquette. Passées dessous, le sceau réapparaît et vient se mettre
          derrière la réplique. */}
      <div className="absolute top-[368px] left-[90px] h-[96px] w-[201px] bg-[var(--color-bg)]" aria-hidden />
      <div className="absolute inset-x-0 top-[464px] bottom-0 bg-[var(--color-bg)]" aria-hidden />
      <p className="absolute top-[444px] left-[42px] w-[306px] text-center font-mono text-[13px] leading-[1.3] text-[var(--color-ink)]">
        <TypedText key={cle} text={texte} typed skip={skip} msPerChar={42} onDone={onFini} />
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
      <Cadre
        orange
        voile={voile}
        onVoileFini={voileFini}
        onTap={lu ? undefined : () => setSkip((k) => k + 1)}
      >
        <EcranGeolier cle="voix" texte={VOIX} skip={skip} onFini={() => setLu(true)} />
        {/* Les deux boutons n'apparaissent qu'une fois la phrase lue : on ne
            propose pas de signer un texte qui s'écrit encore. Positions de la
            maquette — 360×46 à x=15, y=733 et y=787. */}
        {lu && (
          <>
            <div className="absolute top-[733px] left-[15px] w-[360px]">
              <IntroBouton
                label="Qui es-tu ?"
                onClick={() => {
                  setDemande(true);
                  setN(0);
                  aller("qui");
                }}
              />
            </div>
            <div className="absolute top-[787px] left-[15px] w-[360px]">
              <IntroBouton label="Signer." onClick={() => aller("pacte")} />
            </div>
          </>
        )}
        {!lu && <TouchHint libelle="Touche pour tout afficher" />}
      </Cadre>
    );
  }

  /* ------------------------------------------------------------- QUI ES-TU */
  if (etape === "qui") {
    // ⚠️ AUCUN VOILE ENTRE CES RÉPLIQUES : l'écran ne change pas, c'est la même
    // scène qui continue de parler. C'est l'exception que Patrick a posée en
    // demandant la transition générale.
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
      <Cadre orange voile={voile} onVoileFini={voileFini} onTap={suivant}>
        <EcranGeolier cle={n} texte={QUI[n]} skip={skip} onFini={() => setLu(true)} />
        <TouchHint libelle={lu ? "Touche pour continuer" : "Touche pour tout afficher"} />
      </Cadre>
    );
  }

  /* --------------------------------------------------------------- LE PACTE */
  if (etape === "pacte") {
    return (
      <Cadre voile={voile} onVoileFini={voileFini}>
        {/* LA PLUME, en filigrane derrière le contrat. Elle est découpée aux
            coordonnées EXACTES de la maquette (y=233, pleine largeur du cadre),
            donc elle se pose sans réglage — et elle est déjà tramée : sa
            densité EST le dégradé, il n'y a aucun masque à ajouter. */}
        <ImagePixels
          src="assets/pacte_plume.png"
          width={390}
          height={446}
          className="pointer-events-none absolute top-[233px] left-0 z-10"
        />

        <h1
          className="absolute inset-x-0 top-[104px] text-center text-[40px] leading-[1] text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-title)" }}
        >
          Le Pacte
        </h1>
        {/* Le filet du contrat, orange, largeur 358 (maquette y=164,5). */}
        <div
          className="absolute top-[164px] left-[16px] h-px w-[358px] bg-[var(--color-accent)]"
          aria-hidden
        />

        {/* Le corps : mono 13px BLANC, aucune emphase, une ligne vide entre
            chaque clause (maquette : x=16, y=214, largeur 360). */}
        <div className="absolute top-[214px] left-[16px] flex w-[360px] flex-col gap-[17px]">
          {PACTE_CLAUSES.map((c, i) => (
            <p key={i} className="font-mono text-[13px] leading-[1.3] text-[var(--color-ink)]">
              {c}
            </p>
          ))}
        </div>

        {/* LA MARQUE — pied de maquette : x=13, bas 15, largeur 363, 16px de
            gouttière entre le libellé, le cadre de signature et le CTA. */}
        <div className="absolute bottom-[15px] left-[13px] flex w-[363px] flex-col items-center gap-[16px]">
          <p className="w-full font-mono text-[13px] text-[var(--color-ink)] opacity-50">
            Appose ta marque
          </p>
          <SignaturePad onMarque={setMarque} />
          <IntroBouton
            plein
            label="Sceller le pacte"
            disabled={!marque}
            onClick={() => {
              haptic(14);
              aller("verdict");
            }}
          />
        </div>
      </Cadre>
    );
  }

  /* ------------------------------------------------------------- LE VERDICT */
  return (
    <Cadre
      orange
      voile={voile}
      onVoileFini={voileFini}
      onTap={() => (lu ? terminer() : setSkip((k) => k + 1))}
    >
      <EcranGeolier
        cle="verdict"
        texte={verdict(marque ? { ...marque, demande } : null)}
        skip={skip}
        onFini={() => setLu(true)}
      />
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
