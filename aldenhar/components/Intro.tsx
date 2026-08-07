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
import { markIntroSeen } from "@/lib/player-memory";
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
};

/**
 * Textes repris VERBATIM de la maquette (redesign 7/08, frames 2234:580 /
 * 2238:1009 / 2234:557 / 2238:1394 — l'intro passe de 5 écrans à 4, textes
 * RÉDUITS) — c'est de la voix du Geôlier, pas de la copie d'interface : ne
 * pas réécrire sans que Patrick le redemande.
 *
 * ⚠️ Les 4 illustrations (`intro_*.png`) sont extraites du rendu Figma en
 * 390×390 — la bande de dissolution est CUITE dedans (plus d'overlay CSS).
 * Si Patrick fournit les sources HD, les déposer sous les mêmes noms.
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
  },
  {
    title: "Une seule vie",
    body: [
      "Tu traverses mon Domaine. Une fois. Au bout, une Porte scellée : franchis-la, et tu reprends ta vie là où tu l'as laissée.",
      "Si tu meurs, un autre viendra. Avec un autre nom.",
    ],
    image: "assets/intro_porte.png",
    // La porte VIVANTE : la lumière derrière enfle puis se retire (vidéo
    // Midjourney de Patrick, 7/08, passée frame par frame au dithering
    // canonique). `image` reste le repli si le sprite manquait au manifeste.
    animSprite: "assets/intro_porte_anim.png",
  },
  {
    title: "Le dé tranche",
    body: [
      "Ton adresse ne te sauvera pas. Courage, ruse, instinct, empathie : ce que tu vaux vient de ce que tu étais de ton vivant.",
    ],
    image: "assets/intro_de.png",
  },
  {
    title: "Ta mort me sert",
    body: [
      "Ta fin est forgée en Relique. Celui qui te suivra la portera. On ne progresse pas ici en survivant. En tombant mieux.",
    ],
    image: "assets/intro_epee.png",
  },
];

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
  onTap,
  children,
  footer,
  first,
}: {
  image: string;
  animSprite?: string;
  onTap: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  first?: boolean;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        onClick={onTap}
        className="phone-frame relative flex h-[848px] max-h-[100dvh] w-[390px] shrink-0 cursor-pointer flex-col overflow-clip bg-[var(--color-bg)]"
      >
        <div className="relative h-[390px] w-[390px] shrink-0">
          {animSprite ? (
            /* Sprite animé (frames tramées, steps + alternate — voir
               `.porte-anim`). Les frames n'ont pas la bande cuite dedans :
               on repose l'overlay de dissolution du jeu. */
            <>
              <div
                className="porte-anim"
                style={{ backgroundImage: assetCss(animSprite) }}
                aria-hidden
              />
              <div
                className="dissolve-bottom"
                style={{ backgroundImage: assetCss("assets/bande_dissolution_haut.svg") }}
                aria-hidden
              />
            </>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element -- rendu pixelated, jamais optimisé par next/image */
            <img
              src={assetUrl(image)}
              alt=""
              className="block size-full object-cover"
              style={{ imageRendering: "pixelated" }}
            />
            /* Pas d'overlay de bande sur les images fixes : la dissolution est
               CUITE dans les extraits Figma du 7/08 — la doubler ferait un
               double liseré. */
          )}
        </div>

        <div className="flex flex-1 flex-col px-[15px] pt-[16px]">{children}</div>

        <div className="shrink-0 px-[46px] pb-[76px]">{footer}</div>
        {/* Affordance à 50px du bas du CADRE (règle globale 26/07 §2) : le
            premier écran dit « commencer », les suivants « continuer ». */}
        <TouchHint first={first} />
      </div>
    </main>
  );
}

/** Les 5 écrans de clauses, enchaînés au tap. */
export default function Intro({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const last = i >= CLAUSES.length - 1;

  const advance = useCallback(() => {
    if (last) {
      markIntroSeen();
      onDone();
      return;
    }
    setI((n) => n + 1);
  }, [last, onDone]);

  // Le tap est sur tout le cadre ; on double d'un raccourci clavier pour
  // pouvoir dérouler l'intro au test comme à la main.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") advance();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  const c = CLAUSES[i];
  return (
    <IntroFrame
      image={c.image}
      animSprite={c.animSprite}
      onTap={advance}
      first={i === 0}
      footer={
        <Dots index={i} total={CLAUSES.length} />
      }
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
