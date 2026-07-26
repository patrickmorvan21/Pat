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
import { animReduced } from "@/lib/settings";

type Clause = {
  /** Chapeau (« • PREMIÈRE CLAUSE • ») — absent sur l'écran d'ouverture. */
  eyebrow?: string;
  title: string;
  body: string[];
  image: string;
};

/**
 * Textes repris VERBATIM de la maquette — c'est de la voix du Geôlier, pas de
 * la copie d'interface : ne pas réécrire sans que Patrick le redemande.
 */
const CLAUSES: Clause[] = [
  {
    title: "Tu ne te souviens pas",
    body: [
      "D'être entré, je veux dire. Personne ne s'en souvient, ils arrivent tous ici avec la tête que tu fais.",
      "Tu es mort. Il y a peu.",
      "Ce qui suit n'est pas une punition. C'est une proposition, libre à toi de la refuser. Personne ne l'a jamais fait.",
    ],
    // Le visage du Geôlier — le même que l'accueil, c'est lui qui parle.
    image: "assets/accueil_demon.png",
  },
  {
    eyebrow: "• PREMIÈRE CLAUSE •",
    title: "Une seule vie",
    body: [
      "Tu traverses mon Domaine. Une fois.",
      "Si tu meurs, il n'y a pas de retour en arrière, pas de sauvegarde à recharger, pas de seconde chance. Un autre viendra, avec un autre nom, et recommencera au début.",
    ],
    image: "assets/objet_bougie_eteinte_crane_c.png",
  },
  {
    eyebrow: "• DEUXIÈME CLAUSE •",
    title: "Le dé tranche",
    body: [
      "Ton adresse ne te sauvera pas. Ce que tu vaux (courage, ruse, instinct, empathie) a été fixé par ce que tu étais de ton vivant.",
      "Devant chaque risque, l'anneau montre tes chances : les encoches pleines te sauvent, les rongées te perdent. Puis tu lances.",
      "Je ne truque rien. Je n'en ai pas besoin.",
    ],
    image: "assets/objet_de_vingt_c.png",
  },
  {
    eyebrow: "• TROISIÈME CLAUSE •",
    title: "Ta mort me sert",
    body: [
      "Chaque fin est forgée en Relique, un objet né de la manière exacte dont tu es tombé. Celui qui te suivra la portera.",
      "Et à chaque mort, je te dirai une chose de plus sur cet endroit. Une seule.",
      "C'est ainsi qu'on progresse ici : pas en survivant. En tombant mieux.",
    ],
    image: "assets/objet_dague_cendres_c.png",
  },
  {
    eyebrow: "• QUATRIÈME CLAUSE •",
    title: "La Porte",
    body: [
      "Au bout du Domaine, il y a une Porte scellée. Franchis-la, et tu reprends ta vie là où tu l'as laissée.",
      "Douze mille avant toi ont essayé. Le Grand Registre garde leurs noms et le nombre de jours qu'ils ont tenu.",
      "Tu peux y inscrire le tien. Il faut juste signer.",
    ],
    image: "assets/scene_porte_scellee_theatrale_c.png",
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
  onTap,
  children,
  footer,
}: {
  image: string;
  onTap: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        onClick={onTap}
        className="phone-frame relative flex h-[848px] max-h-[100dvh] w-[390px] shrink-0 cursor-pointer flex-col overflow-clip bg-[var(--color-bg)]"
      >
        <div className="relative h-[390px] w-[390px] shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- rendu pixelated, jamais optimisé par next/image */}
          <img
            src={image}
            alt=""
            className="block size-full object-cover"
            style={{ imageRendering: "pixelated" }}
          />
          {/* Bande de dissolution : bord plein collé au bas de l'image, dents
              vers le haut (retournée — cf. la leçon du 16/07 sur le sens). */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[42px]"
            style={{
              backgroundImage: "url(assets/bande_dissolution_haut.svg)",
              backgroundSize: "390px 41px",
              backgroundRepeat: "repeat-x",
              transform: "scaleY(-1)",
            }}
          />
        </div>

        <div className="flex flex-1 flex-col px-[15px] pt-[16px]">{children}</div>

        <div className="shrink-0 px-[46px] pb-[22px]">{footer}</div>
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
      onTap={advance}
      footer={
        <div className="flex flex-col items-center gap-[16px]">
          <Dots index={i} total={CLAUSES.length} />
          <p className="font-mono text-[10px] tracking-[2px] text-[var(--color-ink)] opacity-50">
            Touche pour commencer
          </p>
        </div>
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
      <div className="mt-[26px] flex flex-col gap-[14px]">
        {c.body.map((p, n) => (
          <p
            key={n}
            className="font-mono text-[11px] leading-[1.55] text-[var(--color-ink)] opacity-90"
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
          src={a.image}
          alt=""
          className="absolute inset-x-0 top-[224px] h-[390px] w-[390px] object-cover"
          style={{ imageRendering: "pixelated" }}
        />
        {/* Sous la frise, le charbon reprend jusqu'en bas. */}
        <div className="absolute inset-x-0 bottom-0 top-[610px] bg-[var(--color-bg)]" />

        <p
          className={`absolute inset-x-0 bottom-[52px] text-center font-mono text-[10px] tracking-[2px] text-[var(--color-ink)] opacity-50 ${
            animReduced() ? "" : "acte-hint"
          }`}
        >
          Touche pour commencer
        </p>
      </div>
    </main>
  );
}
