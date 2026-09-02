"use client";

/**
 * L'INTRODUCTION — les clauses du pacte (Figma 2238:1009, proto du 26/07)
 * et l'ÉCRAN D'ACTE (Figma 2245:13747), joué juste après le Seuil.
 *
 * Deux écrans très proches dans leur grammaire (illustration + titre en
 * Instrument Serif + « Touche pour commencer »), donc un seul fichier.
 *
 * Quand ça se joue :
 *   • Intro   → au tout PREMIER lancement du compte seulement. Le tuto énonce
 *     les règles du jeu, pas celles d'une partie : le rejouer à chaque mort
 *     serait une punition. Drapeau `introSeen` en mémoire de compte.
 *   • Acte    → à chaque nouvelle run, après le scellement du pacte, avant
 *     d'arriver sur la zone. Nomme l'acte en cours.
 *
 * Mise en page relevée sur la maquette (cadre 390×848) :
 *   illustration 390×390 · bande de dissolution 42px · chapeau de clause y=406
 *   · titre y=427 · corps y=479 (x=15, largeur 360) · pied y=768.
 */

import { useCallback, useEffect, useState } from "react";
import TypedText from "@/components/TypedText";
import { animReduced } from "@/lib/settings";
import { markIntroSeen } from "@/lib/player-memory";
import { demoActive } from "@/lib/demo";
import TouchHint from "@/components/TouchHint";
import { assetCss, assetUrl } from "@/lib/assets";

type Clause = {
  /** Chapeau (« • PREMIÈRE CLAUSE • ») — absent sur l'écran d'ouverture. */
  eyebrow?: string;
  title: string;
  body: string[];
  image: string;
  /**
   * Sprite d'animation (16 frames 390×390 empilées) qui REMPLACE l'image
   * fixe — utilisé par la clause « Une seule vie » (vidéo de la porte, 7/08).
   * Les frames n'ont PAS la bande de dissolution cuite dedans (contrairement
   * aux extraits Figma) : l'overlay `.dissolve-bottom` est reposé dessus.
   */
  animSprite?: string;
  /**
   * LE GESTE de la clause (2/09). L'intro était le seul endroit du jeu où la
   * main ne servait à rien : partout ailleurs on lance, on tranche, on trace,
   * on crochète — ici on tapait dans le vide pour faire défiler des cartes.
   * Chaque clause restante demande donc quelque chose au doigt.
   */
  geste?: "refus" | "porte";
};

/**
 * Textes repris VERBATIM de la maquette (redesign 7/08, frames 2234:580 /
 * 2238:1009 / 2234:557 / 2238:1394) — c'est de la voix du Geôlier, pas de la
 * copie d'interface : ne pas réécrire sans que Patrick le redemande.
 *
 * ⚠️ DEUX CLAUSES, PAS QUATRE (2/09). Les deux autres n'ont pas été
 * supprimées, elles ont été DÉPLACÉES contre la chose qu'elles décrivent —
 * elles s'énonçaient dans le vide, avant que le joueur ait rien vu :
 *
 *   • « Le dé tranche » → fondue dans l'amorce du Seuil (`PROLOGUE_AMORCE`),
 *     juste avant les souvenirs, dont elle devient la consigne. Les deux
 *     disaient déjà la même chose à deux écrans d'intervalle.
 *   • « Ta mort me sert » → au premier fragment du Geôlier après la PREMIÈRE
 *     MORT (`DeathScreen`, FRAGMENTS[0]), où l'écran suivant forge justement
 *     la relique dont elle parle.
 *
 * ⚠️ Les illustrations (`intro_*.png`) sont extraites du rendu Figma en
 * 390×390 — la bande de dissolution est CUITE dedans (plus d'overlay CSS).
 */
const CLAUSES: Clause[] = [
  {
    title: "Tu ne te souviens pas",
    body: [
      "D'être entré, je veux dire. Personne ne s'en souvient. Tu es mort. Il y a peu.",
      "Ce qui suit est une proposition. Personne ne l'a jamais refusée.",
    ],
    // Le visage du Geôlier — le même que la clôture du Seuil, c'est lui qui parle.
    image: "assets/intro_demon.png",
    geste: "refus",
  },
  {
    title: "Une seule vie",
    body: [
      "Tu traverses mon Domaine. Une fois. Au bout, une Porte scellée : franchis-la, et tu reprends ta vie là où tu l'as laissée.",
      "Si tu meurs, un autre viendra. Avec un autre nom.",
    ],
    image: "assets/intro_porte.png",
    // La porte VIVANTE : la lumière derrière enfle quand on POUSSE (le sprite
    // ne se joue plus seul depuis le 2/09). `image` reste le repli si le
    // sprite manquait au manifeste.
    animSprite: "assets/intro_porte_anim.png",
    geste: "porte",
  },
];

/** Sa réponse au refus — la seule chose qu'il dit en direct sur cet écran,
    d'où la frappe à 42 ms quand le reste du pacte est posé d'un bloc. */
const REPONSE_AU_REFUS = "Non.\n\nTu as déjà signé en mourant. Je te laisse juste le lire.";

/** Ce que la porte répond quand on l'a poussée jusqu'au bout. */
const PORTE_SCELLEE = "Pas celle-là. Pas encore.";

/** Nombre de frames du sprite de la porte (390×6240). */
const PORTE_FRAMES = 16;

/** Points de progression — carrés pleins, jamais une barre (pas de jauge). */
function Dots({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-[5px]">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="block size-[5px]"
          style={{
            background: i <= index ? "var(--color-accent)" : "var(--color-ink)",
            opacity: i <= index ? 1 : 0.25,
          }}
        />
      ))}
    </div>
  );
}

/** Cadre partagé : illustration en haut, bande de dissolution, contenu dessous. */
function IntroFrame({
  image,
  animSprite,
  /** Frame imposée au sprite (0..15). Absent → le sprite garde son animation
      CSS. La clause de la Porte s'en sert pour suivre le doigt. */
  porteFrame,
  onTap,
  onPressStart,
  onPressEnd,
  children,
  footer,
  hint,
}: {
  image: string;
  animSprite?: string;
  porteFrame?: number;
  onTap?: () => void;
  onPressStart?: () => void;
  onPressEnd?: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  hint: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        onClick={onTap}
        onPointerDown={onPressStart}
        onPointerUp={onPressEnd}
        onPointerLeave={onPressEnd}
        onPointerCancel={onPressEnd}
        className={`phone-frame relative flex h-[848px] max-h-[100dvh] w-[390px] shrink-0 flex-col overflow-clip bg-[var(--color-bg)] ${
          onTap || onPressStart ? "cursor-pointer" : ""
        }`}
        style={onPressStart ? { touchAction: "none" } : undefined}
      >
        <div className="relative h-[390px] w-[390px] shrink-0">
          {animSprite ? (
            /* Sprite animé (frames tramées). Quand `porteFrame` est fourni,
               l'animation CSS est coupée et la frame suit le geste. */
            <>
              <div
                className="porte-anim"
                style={{
                  backgroundImage: assetCss(animSprite),
                  ...(porteFrame != null
                    ? { animation: "none", backgroundPositionY: `${-porteFrame * 390}px` }
                    : null),
                }}
                aria-hidden
              />
              <div className="dissolve-bottom" aria-hidden />
            </>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element -- rendu pixelated, jamais optimisé par next/image */
            <img
              src={assetUrl(image)}
              alt=""
              className="block size-full object-cover select-none"
              style={{ imageRendering: "pixelated" }}
            />
            /* Pas d'overlay de bande sur les images fixes : la dissolution est
               CUITE dans les extraits Figma du 7/08 — la doubler ferait un
               double liseré. */
          )}
        </div>

        <div className="flex flex-1 flex-col px-[15px] pt-[16px]">{children}</div>

        <div className="shrink-0 px-[46px] pb-[76px]">{footer}</div>
        {hint}
      </div>
    </main>
  );
}

/**
 * Bouton du pacte — même grammaire que les CTA de l'accueil (`HomeCta`) :
 * fond et bordure en calques inset-0, entailles de coin 2×2 posées PAR-DESSUS
 * au ras du coin. Jamais une bordure CSS sur le bouton lui-même, qui
 * décalerait les entailles d'un pixel.
 */
function IntroBouton({
  label,
  secondary,
  onClick,
}: {
  label: string;
  secondary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={`relative h-[46px] flex-1 cursor-pointer border-none bg-transparent font-mono text-[13px] font-medium tracking-[2.4px] uppercase ${
        secondary ? "text-[var(--color-accent)]" : "text-[var(--color-bg)]"
      }`}
    >
      <span
        className={`absolute inset-0 border border-solid border-[var(--color-accent)] ${
          secondary ? "bg-transparent" : "bg-[var(--color-accent)]"
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

/**
 * LES CLAUSES DU PACTE — deux écrans, deux gestes (2/09).
 *
 * ⚠️ Le corps des clauses n'est PAS tapé, et c'est un choix, pas un oubli :
 * une clause est un texte ÉCRIT — le pacte qu'on lui fait lire — tandis que
 * ses réactions (« Non. », « Pas celle-là. ») sont de la parole en direct.
 * Seules ces dernières se tapent, à sa cadence de 42 ms. Uniformiser la
 * frappe rendrait le procédé décoratif et coûterait ~6 s sur le tout premier
 * écran du jeu.
 *
 * Mode démo (script 24/08, segment 0) : une SEULE clause — la Porte. Le pacte
 * complet reste au jeu entier ; une démo doit mettre le premier geste dans
 * les mains avant la minute 1, et la Porte EST un geste.
 */
export default function Intro({ onDone }: { onDone: () => void }) {
  const clauses = demoActive() ? CLAUSES.filter((c) => c.animSprite) : CLAUSES;
  const [i, setI] = useState(0);
  const last = i >= clauses.length - 1;
  const c = clauses[i];

  // Geste « refus » : a-t-il essayé de refuser ?
  const [refus, setRefus] = useState(false);
  // Geste « porte » : frame courante, doigt posé, et poussée menée à son terme.
  const [pousse, setPousse] = useState(false);
  const [frame, setFrame] = useState(0);
  const [porteFinie, setPorteFinie] = useState(false);
  /** ⚠️ La réplique de la Porte a été LUE. Sans ce verrou, le `pointerup` qui
      termine la poussée déclenche aussi un `click` sur le cadre : l'écran
      avançait dans le même geste et « Pas celle-là. Pas encore. » — le seul
      point de la clause — n'était jamais vu. Trouvé au banc. */
  const [porteLue, setPorteLue] = useState(false);

  const advance = useCallback(() => {
    if (last) {
      markIntroSeen();
      onDone();
      return;
    }
    setRefus(false);
    setPousse(false);
    setFrame(0);
    setPorteFinie(false);
    setPorteLue(false);
    setI((n) => n + 1);
  }, [last, onDone]);

  // Animations réduites : la porte est donnée poussée (sa frame finale est
  // déjà l'état de repos imposé par la CSS `.anim-reduced`), on ne demande
  // pas un geste soutenu à qui a désactivé le mouvement.
  const [sansGeste, setSansGeste] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setSansGeste(animReduced()), 0);
    return () => clearTimeout(id);
  }, []);

  /** La porte avance tant que le doigt appuie, et RETOMBE quand il lâche —
      plus lentement qu'elle ne monte, pour qu'un appui tenu gagne toujours.
      Timer auto-replanifié plutôt qu'un intervalle : `setState` dans le corps
      d'un effet est refusé par le compilateur React. */
  useEffect(() => {
    if (c.geste !== "porte" || porteFinie || sansGeste) return;
    const id = setTimeout(
      () => {
        const suivant = Math.max(0, Math.min(PORTE_FRAMES - 1, frame + (pousse ? 1 : -1)));
        setFrame(suivant);
        if (suivant >= PORTE_FRAMES - 1) setPorteFinie(true);
      },
      pousse ? 105 : 160
    );
    return () => clearTimeout(id);
  }, [c.geste, frame, pousse, porteFinie, sansGeste]);

  /** L'action PRINCIPALE de l'écran, quel que soit le geste — c'est elle que
      le clavier déclenche (raccourci de test et de bureau). */
  const action = useCallback(() => {
    if (c.geste === "refus") {
      advance();
      return;
    }
    if (c.geste === "porte") {
      if (porteLue) advance();
      else if (porteFinie || sansGeste) setPorteLue(true);
      else {
        setFrame(PORTE_FRAMES - 1);
        setPorteFinie(true);
      }
      return;
    }
    advance();
  }, [c.geste, porteFinie, porteLue, sansGeste, advance]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") action();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [action]);

  const porteOuverte = c.geste === "porte" && (porteFinie || sansGeste);

  useEffect(() => {
    if (!porteOuverte || porteLue) return;
    // Filet : quoi qu'il arrive à la frappe, l'écran retrouve une issue.
    const id = setTimeout(() => setPorteLue(true), 2500);
    return () => clearTimeout(id);
  }, [porteOuverte, porteLue]);

  return (
    <IntroFrame
      image={c.image}
      animSprite={c.animSprite}
      porteFrame={c.geste === "porte" && !sansGeste ? frame : undefined}
      // La clause du refus n'avance que par ses boutons ; la Porte avance au
      // tap une fois poussée. Sinon le cadre ne capte rien : un tap perdu sur
      // un écran qui attend un geste précis se lit comme une panne.
      onTap={porteLue ? advance : undefined}
      onPressStart={c.geste === "porte" && !porteOuverte ? () => setPousse(true) : undefined}
      onPressEnd={c.geste === "porte" && !porteOuverte ? () => setPousse(false) : undefined}
      hint={
        c.geste === "porte" ? (
          <TouchHint
            libelle={
              porteLue
                ? "Touche pour continuer"
                : porteOuverte
                  ? ""
                  : "Maintiens pour pousser la porte"
            }
          />
        ) : null
      }
      footer={<Dots index={i} total={clauses.length} />}
    >
      {c.eyebrow && (
        <p className="text-center font-mono text-[9px] tracking-[2.5px] text-[var(--color-accent)]">
          {c.eyebrow}
        </p>
      )}
      <h1
        className="mt-[10px] text-center text-[27px] leading-[1] text-[var(--color-accent)]"
        style={{ fontFamily: "var(--font-title)" }}
      >
        {c.title}
      </h1>
      {/* Corps CENTRÉ (redesign 7/08 — les 4 frames montrent le texte centré). */}
      <div className="mt-[26px] flex flex-col gap-[14px]">
        {c.body.map((p, n) => (
          <p
            key={n}
            className="text-center font-mono text-[11px] leading-[1.55] text-[var(--color-ink)] opacity-90"
          >
            {p}
          </p>
        ))}
      </div>

      {/* LE REFUS QU'ON T'ENLÈVE — « Personne ne l'a jamais refusée » cessait
          d'être une phrase pour devenir une démonstration. On peut refuser ;
          il répond ; et le bouton REFUSER disparaît. Le pilier du jeu (« le
          joueur est contraint, jamais tout-puissant ») joué en dix secondes,
          au lieu d'être écrit sur une carte. */}
      {c.geste === "refus" && (
        <>
          {refus && (
            <p className="mt-[22px] text-center font-mono text-[11px] leading-[1.55] whitespace-pre-line text-[var(--color-accent)]">
              <TypedText text={REPONSE_AU_REFUS} typed skip={0} msPerChar={42} />
            </p>
          )}
          <div className="mt-[26px] flex gap-[10px]">
            <IntroBouton label="Accepter" onClick={advance} />
            {!refus && <IntroBouton label="Refuser" secondary onClick={() => setRefus(true)} />}
          </div>
        </>
      )}

      {/* La Porte poussée à fond ne s'ouvre pas : elle est SCELLÉE, et c'est
          la Descente qu'on arme ici, des heures avant qu'elle arrive. */}
      {porteOuverte && (
        <p className="mt-[26px] text-center font-mono text-[11px] leading-[1.55] text-[var(--color-accent)]">
          <TypedText
            text={PORTE_SCELLEE}
            typed={!porteLue}
            skip={0}
            msPerChar={42}
            onDone={() => setPorteLue(true)}
          />
        </p>
      )}
    </IntroFrame>
  );
}

/**
 * ÉCRAN D'ACTE (Figma 2245:13747) — après le pacte, avant la zone.
 *
 * ⚠️ « Les Lisières » est le libellé de la MAQUETTE, alors que la zone
 * s'appelle « Les Landes » dans scene-data.ts et landes.json. La règle du
 * projet (« Figma fait foi pour les écrans reproduits ») tranche en faveur de
 * la maquette pour ce qui s'affiche ici, sans rien renommer ailleurs. À
 * réconcilier avec Patrick : soit l'Acte I s'appelle Les Lisières et Les
 * Landes en est une zone, soit c'est un renommage à propager partout.
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
