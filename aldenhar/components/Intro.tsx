"use client";

/**
 * L'INTRODUCTION — LE PACTE, en quatre temps.
 *
 * ⚠️ LES MAQUETTES FONT FOI, PAS LE PROTOTYPE. Cette version est relevée au
 * pixel sur les écrans Figma 3450:3977 (la voix) · 3450:4033 (qui es-tu) ·
 * 3700:863 et 3706:906 (le Pacte, avant et après signature — ils REMPLACENT
 * 3450:4066 depuis le 07/09). Le prototype `prologue_pactum_v3.html` de Claude Chat
 * n'apporte plus que la MÉCANIQUE de la signature jugée ; tout ce qui se voit
 * (fond orange, position du démon, style des boutons, texte du contrat) vient
 * des maquettes. Ne pas réintroduire ce que le prototype ajoutait et que les
 * maquettes ne montrent pas — en-tête « Par-devant le geôlier », affordance
 * « Signe du doigt », emphases orange dans les clauses, boutons en capitales.
 *
 *   1. LA VOIX     — il parle sur fond ORANGE, et il offre deux façons
 *                    d'entrer : lui demander qui il est, ou signer.
 *   2. QUI ES-TU   — deux répliques. Aucun voile entre elles : c'est la même
 *                    scène qui continue de parler.
 *   3. LE PACTE    — le contrat sur un PARCHEMIN orange (maquettes 3700:863
 *                    et 3706:906), la plume ferrée en bas de l'écran, et la
 *                    zone de signature : on SIGNE au doigt dedans.
 *   4. LE VERDICT  — il commente la marque qu'on vient de tracer.
 *
 * ⚠️ LE VOILE DE PIXELS NE SE JOUE QU'AUX DEUX RUPTURES DE SUPPORT (07/09) :
 * démon → contrat, et contrat → démon. Entre deux de ses répliques, jamais —
 * l'écran ne change pas, c'est la même scène qui continue.
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
import { HeroGeolier } from "@/components/HeroGeolier";
import { markIntroSeen } from "@/lib/player-memory";
import TouchHint from "@/components/TouchHint";
import { assetUrl } from "@/lib/assets";
import { haptic } from "@/lib/settings";
import VoilePixels, { useVoile, type EtatVoile } from "@/components/VoilePixels";

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

/**
 * Ce qu'il répond à « Qui es-tu ? » — une réplique par tap.
 *
 * ⚠️ DEUX RÉPLIQUES, PAS TROIS (brief V2 du 06/09) : cette branche ne doit pas
 * devenir de l'exposition. La première est celle de la maquette 3450:4033 et
 * caractérise le personnage ; la seconde plante le Registre et la Descente, et
 * s'arrête là — il n'explique jamais son rôle complet. Qui choisit « Signer. »
 * court-circuite les deux, c'est voulu.
 */
const QUI = [
  "Personne ne pose cette question en premier. Tu progresses.",
  "Je tiens le Registre. Je compte ceux qui descendent. Ce qui m'intéresse, c'est jusqu'où tu iras.",
];

/**
 * Le contrat, tel que les maquettes 3700:863 / 3706:906 l'affichent : mono
 * 13px CHARBON sur le parchemin orange, CENTRÉ, sans un mot en gras ni en
 * orange, une ligne vide entre chaque clause.
 *
 * ⚠️ QUATRE PARAGRAPHES depuis le 07/09 : la maquette sépare « ce que tu
 * comprendras » et « ce que tu perdras », que le brief V2 du 06/09 avait
 * fusionnés. Aucun mot ne change — c'est de la typographie, et la maquette
 * fait foi pour un écran reproduit.
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

const SIG_W = 299;
/** ⚠️ 150 et non les 115 de la maquette (retour Patrick 07/09 : « peut-on
    agrandir la hauteur de l'espace de la signature ? »). La place a été prise
    SUR LE PARCHEMIN, mesuré : ses clauses finissent à 416 et sa surface pleine
    descend jusqu'à 594 — la zone tient donc à l'aise de 434 à 584, avec 18 px
    d'air sous les clauses et 10 au-dessus du bord rongé. Signer plus bas
    déborderait sur la dentelle du parchemin. */
const SIG_H = 150;
/** Le haut de la zone dans la grille de 848 (maquette : 459 pour 115 de haut).
    Posé ici pour que le cadre et son libellé ne puissent pas diverger. */
const SIG_TOP = 434;
/** Demi-résolution, comme tout ce qui est tramé : 1 px de tracé = 2 px écran. */
const SIG_CW = Math.round(SIG_W / 2);
const SIG_CH = Math.round(SIG_H / 2);

/**
 * LE CADRE DE SIGNATURE (maquettes 3700:863 / 3706:906 : 299×115 à (45,459)).
 *
 * ⚠️ LE CANVAS EST TRANSPARENT ET L'ENCRE EST CHARBON. Le fond de ce cadre
 * n'est plus un rectangle sombre : c'est LE PARCHEMIN, qui passe derrière —
 * on signe sur le contrat, pas dans une boîte posée dessus.
 *
 * ⚠️ ET IL N'A PLUS AUCUNE BORDURE (retour Patrick 07/09) : ni le piqueté
 * dessiné dans le canvas, ni les tirets tournants en CSS qui l'avaient
 * remplacé le matin même. Ce qui dit « signe ici » est le LIBELLÉ qui
 * clignote, posé par l'appelant.
 *
 * ⚠️ Les événements de pointeur vivent sur `window` et non sur le canvas : sur
 * iOS, un doigt qui sort du cadre pendant le tracé emporte les événements avec
 * lui, et la signature se coupe en plein milieu.
 */
function SignaturePad({
  onMarque,
  onDebut,
}: {
  onMarque: (m: Marque | null) => void;
  /** Premier contact : le libellé « Signer le pacte » s'efface aussitôt,
      sans attendre qu'on relève le doigt. */
  onDebut: () => void;
}) {
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

  const encre = useCallback((px: number, py: number) => {
    const x = ref.current?.getContext("2d");
    if (!x) return;
    // L'encre baye autour du point. Trait FIN (rayon 1,0 depuis le 5/09) — et
    // CHARBON depuis le 07/09 : on écrit à l'encre sur un parchemin orange.
    x.fillStyle = "#1c1a16";
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.0;
      x.fillRect((px + Math.cos(a) * r) | 0, (py + Math.sin(a) * r) | 0, 1, 1);
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
      data-signature
      width={SIG_CW}
      height={SIG_CH}
      onPointerDown={(e) => {
        const s = st.current;
        if (!s.dessine && s.traces === 0) onDebut();
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
      className="block h-full w-full"
      style={{ imageRendering: "pixelated", touchAction: "none" }}
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
 *  · « plein » — un aplat, texte charbon en capitales espacées, centré. Sa
 *    couleur suit l'écran : ORANGE sur charbon (le CTA du Nom), BLANC sur le
 *    parchemin (« sceller le pacte », maquette 3706:906 — l'orange y serait
 *    invisible, le parchemin est déjà orange).
 *
 * Dans les deux cas les entailles de coin 2×2 sont posées PAR-DESSUS, au ras
 * du coin, et la bordure vit dans un calque `inset-0` — jamais sur le bouton
 * lui-même, dont la boîte de padding décalerait les entailles d'un pixel
 * (piège récurrent, vu au zoom par Patrick le 16/07).
 */
function IntroBouton({
  label,
  plein,
  blanc,
  disabled,
  onClick,
}: {
  label: string;
  plein?: boolean;
  /** Aplat BLANC au lieu d'orange (sur le parchemin). Sans effet hors `plein`. */
  blanc?: boolean;
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
            ? blanc
              ? "border-[var(--color-ink)] bg-[var(--color-ink)]"
              : "border-[var(--color-accent)] bg-[var(--color-accent)]"
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
  orange,
  voile,
  onVoileFini,
}: {
  onTap?: () => void;
  children: React.ReactNode;
  /** Les écrans du Geôlier ont le fond ORANGE (maquettes 3450:3977 / 4033). */
  orange?: boolean;
  voile?: EtatVoile;
  onVoileFini?: () => void;
}) {
  // Un tap pendant la transition ne fait rien : l'écran est en train de
  // changer, tout geste tomberait sur celui qu'on quitte ou sur celui qu'on
  // n'a pas encore vu.
  const tap = voile ? undefined : onTap;
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        onClick={tap}
        className={`phone-frame relative h-[848px] max-h-[100dvh] w-[390px] shrink-0 overflow-clip ${
          orange ? "bg-[var(--color-accent)]" : "bg-[var(--color-bg)]"
        } ${tap ? "cursor-pointer" : ""}`}
      >
        {children}
        {/* ⚠️ LE VOILE VIT ICI, jamais dans les écrans. `Cadre` est le seul
            élément que l'intro rend à toutes ses étapes : posé dedans, il
            garde la même position dans l'arbre d'un écran à l'autre et n'est
            donc jamais démonté au milieu du geste — or l'écran change
            précisément au milieu. Placé dans les branches, il changerait
            d'index et React le remonterait, canvas vide compris. */}
        <VoilePixels etat={voile ?? null} onFini={onVoileFini} />
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
      {/* Le démon a L'ANIMATION DE L'ACCUEIL (retour Patrick 5/09) : la même
          respiration par paliers entiers et les mêmes cendres qui montent,
          mais sur le démon des maquettes, détouré pour que les cendres
          passent derrière lui. */}
      {/* ⚠️ `isolate` OBLIGATOIRE : l'image du héros porte un `z-[2]` interne
          (pour passer devant les cendres), et sans contexte d'empilement il
          s'échappe et recouvre TOUT ce qui suit — le socle charbon et la
          première ligne de la réplique disparaissaient dessous. */}
      {/* ⚠️ LE DÉMON EST POSÉ EXACTEMENT COMME À L'ACCUEIL (retour Patrick
          07/09 : « quand on clique sur commencer, la position du démon bouge
          légèrement — il peut garder la même place qu'à l'accueil »). Mesuré :
          l'accueil pose son image à y=40 (bloc au ras du cadre, `marge` 40),
          l'intro la posait à y=74 — 34 px de saut au premier tap du jeu.
          C'est donc `marge={40}` au ras du cadre, et le bloc descend jusqu'à
          464 pour que les épaules continuent de déborder sur l'orange comme
          dans la maquette. ÉCART ASSUMÉ avec la maquette 3450:3977, qui pose
          le démon à 74 : la continuité avec l'écran d'avant prime ici, parce
          que c'est le seul endroit du jeu où deux écrans montrent le même
          personnage à la suite. */}
      <div className="absolute top-0 left-0 isolate h-[464px] w-[390px]">
        {/* ⚠️ C'EST L'IMAGE DE L'ACCUEIL, la HD (1560×1720), et pas l'export
            390×390 des maquettes (retour Patrick 5/09 : « sur cet écran le
            démon est net, reprends celle-ci à chaque fois qu'on voit le
            démon »). C'est le même personnage : seule la résolution change —
            quatre fois la taille d'affichage, donc une trame qui reste fine
            sur un écran Retina. Rien d'autre ne rend une image nette. */}
        <HeroGeolier height={464} marge={40} sol={false} />
      </div>
      {/* ⚠️ LES DEUX NAPPES CHARBON SE POSENT PAR-DESSUS L'IMAGE, jamais
          derrière : c'est le socle 201×96 qui efface le sceau de poitrine du
          démon et ne laisse que ses épaules à l'orange, exactement comme la
          maquette. Passées dessous, le sceau réapparaît et vient se mettre
          derrière la réplique. */}
      {/* ⚠️ LE SOCLE SUIT LE DÉMON, PAS LE CADRE : il existe pour effacer le
          sceau de poitrine, donc il monte des mêmes 34 px que l'image (334 au
          lieu de 368) et descend jusqu'à la nappe — il couvre ainsi au moins
          tout ce qu'il couvrait avant. Le laisser à 368 aurait découvert le
          haut du sceau, qui serait réapparu derrière la réplique. */}
      <div className="absolute top-[334px] left-[90px] h-[130px] w-[201px] bg-[var(--color-bg)]" aria-hidden />
      <div className="absolute inset-x-0 top-[464px] bottom-0 bg-[var(--color-bg)]" aria-hidden />
      <p className="absolute top-[444px] left-[42px] w-[306px] text-center font-mono text-[13px] leading-[1.3] text-[var(--color-ink)]">
        <TypedText key={cle} text={texte} typed skip={skip} msPerChar={42} onDone={onFini} />
      </p>
    </>
  );
}

export default function Intro({
  onDone,
  /** APERÇU (Options) : on rejoue le pacte sans rien marquer au compte —
      sinon prévisualiser sur un compte neuf priverait le joueur de sa
      vraie première fois. */
  apercu = false,
}: {
  onDone: () => void;
  apercu?: boolean;
}) {
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
  /** Le doigt a-t-il touché le cadre ? (le libellé s'efface au premier contact,
      pas au relèvement — sinon il reste sous le trait qu'on est en train de
      faire). */
  const [trace, setTrace] = useState(false);
  const { etat: voile, transiter, onFini: voileFini } = useVoile();

  /** Change d'écran, SANS transition. La règle du 5/09 tient : « pas de
      transition quand on fait commencer, pas de transition entre les répliques
      du démon » — tant qu'on reste face au Geôlier, c'est la même scène qui
      continue de parler, et un fondu de pixels entre deux de ses phrases
      faisait ressembler un dialogue à un diaporama. */
  const aller = useCallback((suite: Etape) => {
    setEtape(suite);
    setLu(false);
    setSkip(0);
  }, []);

  /** Change d'écran EN DISSOLVANT LES PIXELS (retour Patrick 07/09 : « mettre
      une transition de pixels noirs quand on passe du démon à la signature du
      pacte, ainsi qu'après, quand on passe du pacte au démon »).
      ⚠️ RÉSERVÉ AUX DEUX SEULES RUPTURES DE SUPPORT de l'intro : le démon qui
      te fait face → le contrat que tu tiens dans les mains, et retour. Tout le
      reste passe par `aller`. Le voile dit qu'on change d'objet, pas qu'on
      tourne une page. */
  const traverser = useCallback(
    (suite: Etape) => transiter(() => aller(suite)),
    [transiter, aller],
  );

  const terminer = useCallback(() => {
    if (!apercu) markIntroSeen();
    onDone();
  }, [onDone, apercu]);

  /* --------------------------------------------------------------- LA VOIX */
  if (etape === "voix") {
    return (
      <Cadre orange voile={voile} onVoileFini={voileFini} onTap={lu ? undefined : () => setSkip((k) => k + 1)}>
        <EcranGeolier cle="voix" texte={VOIX} skip={skip} onFini={() => setLu(true)} />
        {/* Les deux boutons n'apparaissent qu'une fois la phrase lue : on ne
            propose pas de signer un texte qui s'écrit encore. Positions de la
            maquette — 360×46 à x=15, y=733 et y=787. */}
        {lu && (
          /* ⚠️ ANCRÉS EN BAS, jamais posés sur la grille de 848 : sur un
             iPhone le cadre fait la hauteur du device (`height:100dvh` sous
             768 px), et le second bouton se retrouvait coupé. Les 15 px du
             bas et les 8 px d'écart sont ceux de la maquette — c'est la même
             mise en page, mesurée depuis l'autre bord. */
          <div className="absolute inset-x-[15px] bottom-[calc(env(safe-area-inset-bottom,0px)+15px)] flex flex-col gap-[8px]">
            <IntroBouton
              label="Qui es-tu ?"
              onClick={() => {
                setDemande(true);
                setN(0);
                aller("qui");
              }}
            />
            <IntroBouton label="Signer." onClick={() => traverser("pacte")} />
          </div>
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
      traverser("pacte");
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
        {/* LE PARCHEMIN — export Figma de la trame, 388×540 à (1,84). Il porte
            SON PROPRE FOND CHARBON, donc rien ne transparaît derrière lui.
            ⚠️ `shape-rendering="crispEdges"` est injecté dans le SVG à
            l'installation : sans lui, chaque bord de cellule tombant sur une
            frontière de demi-pixel est antialiasé (mesuré le 06/09 sur le
            coffre : 222 couleurs sans, 2 avec). */}
        {/* LA PLUME — DERRIÈRE le parchemin et ferrée au bas de l'écran (retour
            Patrick 07/09 : « la plume doit être derrière le parchemin et ferrée
            tout en bas, car on voit encore du noir en bas »).
            ⚠️ ELLE GARDE SA TAILLE NATIVE, 389×230, collée au bord bas — c'est
            la maquette au pixel (frame 3716:930, posée à y=618 sur un cadre de
            848, donc jusqu'au bord). L'étirer, comme je l'avais fait, RAJOUTE
            du noir au lieu d'en enlever : le tiers haut de l'image est vide par
            construction (le calame part du coin haut-gauche en diagonale), donc
            un `cover` sur une boîte deux fois plus haute descend ces rangées
            vides de 76 à 154 px — c'était ça, la lame de charbon.
            ⚠️ Elle est POSÉE AVANT le parchemin dans le DOM : c'est l'ordre
            qui la met derrière (le parchemin porte son propre fond charbon
            opaque, donc rien ne transparaît). Aucun z-index nulle part sur cet
            écran — l'ordre du DOM suffit, et deux z-index concurrents
            finiraient par diverger. */}
        {/* ⚠️ L'image vit dans une BOÎTE, pas directement en absolu : le
            preflight de Tailwind impose `height: auto` à toute image, ce qui
            écrase la hauteur qu'on croit fixer avec `top` + `bottom` — la
            plume se décollait alors du bas de 93 px, mesurés. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[230px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- trame, jamais optimisée */}
          <img
            src={assetUrl("assets/pacte_plume_c.png")}
            alt=""
            aria-hidden
            className="h-full w-full object-cover object-bottom"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {/* LE BLOC DU PACTE EST COLLÉ AU BAS, PAS AU HAUT.
            La maquette est dessinée pour un cadre de 848 : le parchemin y finit
            à 624 et la plume commence à 618, ils se touchent. Sur un iPhone le
            cadre fait la hauteur du device (926 chez Patrick), et les 78 px de
            rab tombaient ENTRE les deux, puisque tout était posé depuis le
            haut. Le bloc garde donc ses 848 px et une marge automatique le
            pousse vers le bas : le rab passe au-dessus du parchemin, là où la
            maquette a déjà du vide.
            ⚠️ La marge AUTO est aussi le garde-fou des petits écrans : quand la
            place manque, une marge auto vaut 0 — le bloc revient donc en haut
            et c'est le BAS qui se rogne, jamais le titre. */}
        <div className="absolute inset-0 flex flex-col">
          <div className="relative mt-auto h-[848px] w-full shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG de trame, jamais optimisé */}
            <img
              src={assetUrl("assets/pacte_parchemin_a.svg")}
              alt=""
              aria-hidden
              className="pointer-events-none absolute top-[84px] left-[1px] h-[540px] w-[388px]"
            />

            {/* Titre et clauses en CHARBON : ils sont posés SUR le parchemin. */}
            <h1
              className="absolute inset-x-0 top-[152px] text-center text-[30px] leading-[1] text-[var(--color-bg)]"
              style={{ fontFamily: "var(--font-title)" }}
            >
              Le Pacte
            </h1>

            <div className="absolute top-[210px] left-[60px] flex w-[272px] flex-col gap-[18px]">
              {PACTE_CLAUSES.map((c, i) => (
                <p
                  key={i}
                  className="text-center font-mono text-[13px] leading-[1.3] text-[var(--color-bg)]"
                >
                  {c}
                </p>
              ))}
            </div>

            {/* LA MARQUE (maquette : 299×115 à (45,459) — AGRANDIE à 299×150 à
                (45,434), cf. SIG_H). La géométrie vient des constantes : le
                canvas, le cadre et le libellé sont un seul objet.
                ⚠️ AUCUN CADRE (retour Patrick 07/09, qui ANNULE les tirets
                tournants du matin même — le CSS est parti avec). Ce qui dit
                « signe ici » est le LIBELLÉ, qui clignote comme toutes les
                affordances du jeu : la classe `touch-hint` porte le `pulse` en
                `steps(2)`, et rien d'autre — la couleur reste CHARBON, parce
                qu'on est sur le parchemin orange et que le blanc du composant
                standard y serait illisible. */}
            <div
              className="absolute left-[45px]"
              style={{ top: SIG_TOP, width: SIG_W, height: SIG_H }}
            >
              <SignaturePad onMarque={setMarque} onDebut={() => setTrace(true)} />
              {!trace && (
                /* Centré par le FLUX, jamais par un `top` calculé : la zone a
                   changé de hauteur une fois, elle rechangera. */
                <p className="touch-hint pointer-events-none absolute inset-0 flex items-center justify-center text-center font-mono text-[13px] leading-[1.3] text-[var(--color-bg)]">
                  Signer le pacte
                </p>
              )}
            </div>
          </div>
        </div>

        {/* LE CTA n'existe QUE si la marque est tracée (maquette 3706:906 : il
            est absent de l'écran d'avant signature). Un bouton grisé dirait
            « il te manque quelque chose » ; son absence dit « signe d'abord ».
            Aplat BLANC : l'orange serait invisible sur le parchemin. */}
        {marque && (
          <div className="absolute bottom-[32px] left-[45px] w-[299px]">
            <IntroBouton
              plein
              blanc
              label="Sceller le pacte"
              onClick={() => {
                haptic(14);
                traverser("verdict");
              }}
            />
          </div>
        )}
      </Cadre>
    );
  }

  /* ------------------------------------------------------------- LE VERDICT */
  return (
    <Cadre orange voile={voile} onVoileFini={voileFini} onTap={() => (lu ? terminer() : setSkip((k) => k + 1))}>
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
