"use client";

/**
 * LA SÉQUENCE DE MORT — combustion, braises persistantes, révélation de la
 * relique (journal Notion 30/07 ; maquettes Figma 2314-700 / 2295-653 /
 * 2320-4447 / 2331-675 / 2333-10146 / 2332-6998, qui font foi sur le rendu).
 *
 * Ordre : beat fatal (le dé pose la face rongée et « MORT » — géré par Die3D)
 * → COMBUSTION de l'écran de scène → La mort (épitaphe + bilan) → Le fragment
 * (la voix du Geôlier) → Le Registre (si le score entre aux Cent) → La
 * relique, en DEUX temps (le coffre, puis la révélation) → retour à l'accueil.
 *
 * La combustion : tous les éléments de la scène disparaissent pixel par
 * pixel, comme brûlés — et les pixels TOMBENT (correction 30/07 : ils ne
 * s'envolent plus). Ils se détachent, descendent comme des braises de papier
 * brûlé, et ALIMENTENT le lit de braises qui court ensuite en bas de tous les
 * écrans de bilan — c'est cette continuité qui fait tenir la séquence.
 * L'écran finit entièrement noir. Le tap ne coupe rien.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Destin, Relic } from "@/lib/player-memory";
import TouchHint from "@/components/TouchHint";
import FondBraises from "@/components/FondBraises";
import { NomGratte } from "@/components/Registre";
import { buildLesCent, type RegistreEntry } from "@/lib/registre-data";
import { destinDepuisCause, loadMemory, relicEffect, relicFiche, RELIC_FONCTION } from "@/lib/player-memory";
import { pickJailerQuote, reactionJours } from "@/lib/jailer-quotes";
import { ditherFadeMaskDataUrl } from "@/lib/dither";
import { animReduced } from "@/lib/settings";
import type { RunState } from "@/lib/state";
import { assetUrl, assetExiste } from "@/lib/assets";
import { reliqueIllustration } from "@/lib/reliques";

const CHARBON = "#1c1a16";
const ORANGE = "#e0632a";

export type Bilan = {
  jours: number;
  /** Le point le plus loin atteint, en NOM DE RÉGION — jamais « Acte I ». */
  plusLoin: string;
  lieux: number;
  rencontres: number;
  des: number;
  desTenus: number;
  destins: number;
  maledictions: number;
  /** La relique RÉELLEMENT portée pendant cette vie, par son nom. Un héros n'en
      porte qu'une (la dernière forgée) — un compteur mentait deux fois : il
      incluait celle que cette mort vient de forger, et il comptait un stock
      que le héros n'a jamais eu sur lui. */
  reliquePortee: string | null;
};

/**
 * Le BILAN de mort (Notion 26/07 §3, écran 2) à partir d'une run — SEULS
 * chiffres bruts du jeu : un registre de greffe, pas un retour de partie.
 * Exporté (déplacé depuis Scene.tsx) pour être réutilisable par l'aperçu de
 * débogage (Options → « Aperçu de l'écran de mort ») sans dupliquer le calcul.
 */
export function bilanDeMort(run: RunState, reliquePortee: string | null = null): Bilan {
  const rolls = run.rolls ?? [];
  return {
    jours: run.day,
    plusLoin: "Les Landes",
    lieux: (run.trav?.visited ?? []).length,
    rencontres: run.encounters,
    des: rolls.length,
    desTenus: rolls.filter((r) => r.ok).length,
    destins: rolls.filter((r) => r.result === 20).length,
    maledictions: rolls.filter((r) => r.result === 1).length,
    reliquePortee,
  };
}

type Ecran = "fatal" | "mort" | "fragment" | "registre" | "relique";

/** Le foyer de la séquence de mort monte à ~175 px (triplé le 30/07) : les
    affordances « Touche pour continuer » sont remontées d'autant, sinon les
    flammes les mangent. Seule exception à la règle globale des 50 px. */
const HINT_BAS = 200;

/**
 * Le fragment du Geôlier : une chose de plus sur cet endroit, à chaque mort.
 * Arc GARANTI aux morts 1, 2, 3, puis 5, 8, 12, 17 — entre les jalons, la
 * citation contextuelle du pool prend le relais (l'écran du fragment se joue
 * toujours : la maquette 2320-4447 le montre comme un beat fixe de la
 * séquence, le Geôlier réagit d'abord aux jours tenus).
 */
const JALONS = [1, 2, 3, 5, 8, 12, 17];
const FRAGMENTS = [
  "Ta première. Ils la passent tous ; peu la comprennent.\n\nCe que tu viens de perdre n'était pas ta vie. Tu l'avais déjà perdue avant d'arriver. Ce que tu viens de perdre, c'est une tentative.",
  "Le Hameau n'a pas toujours été des Renonçants. Il portait un autre nom, avant qu'ils ne décident de ne plus rien vouloir.\n\nDemande-leur. Ils diront qu'ils ont oublié.",
  "Les corbeaux de la Colline ne mangent pas. Ils comptent.\n\nUn par mort. Le jour où tu en verras beaucoup, ce sera de toi qu'ils parleront.",
  "Le Bailli a été pendu par ceux qu'il avait fait pendre. Il trouve ça équitable. C'est ce qui me plaît chez lui.",
  "Il y a une Porte au bout du Domaine. Elle n'est pas fermée à clé.\n\nElle est fermée par ce qu'il faut avoir traversé pour la mériter.",
  "Douze mille avant toi. J'ai retenu quatre noms.\n\nAucun n'est au Registre.",
  "Tu commences à comprendre pourquoi je regarde.\n\nCe n'est pas pour les voir mourir. C'est pour voir lequel, un jour, ne mourra pas.",
];

function fragmentPour(morts: number): string | null {
  const i = JALONS.indexOf(morts);
  return i >= 0 ? FRAGMENTS[Math.min(i, FRAGMENTS.length - 1)] : null;
}

/** Frappe lettre à lettre — 42 ms, la cadence du Geôlier. */
function useTyped(texte: string, actif: boolean) {
  const [n, setN] = useState(0);
  const [fini, setFini] = useState(false);
  // Révélation immédiate : le premier toucher d'un texte en cours de frappe
  // doit TOUT afficher, jamais sauter l'écran (règle globale du jeu — elle
  // n'était pas tenue ici, et un fragment long fait ~13 s à 42 ms/caractère).
  // ⚠️ Le piège déjà rencontré sur TypedText (26/07) : poser `n = texte.length`
  // ne suffit pas — le tick suivant de l'intervalle (encore vivant) réécrit une
  // tranche PARTIELLE par-dessus et le texte se retrouve tronqué. Il faut donc
  // aussi couper l'intervalle, via un drapeau que la boucle relit.
  const coupeRef = useRef(false);
  const tout = useCallback(() => {
    coupeRef.current = true;
    setN(texte.length);
    setFini(true);
  }, [texte]);
  useEffect(() => {
    if (!actif || !texte) return;
    if (animReduced()) {
      const t = setTimeout(() => {
        setN(texte.length);
        setFini(true);
      }, 0);
      return () => clearTimeout(t);
    }
    coupeRef.current = false;
    let i = 0;
    const iv = setInterval(() => {
      if (coupeRef.current) {
        clearInterval(iv);
        return;
      }
      i += 1;
      setN(i);
      if (i >= texte.length) {
        clearInterval(iv);
        setFini(true);
      }
    }, 42);
    return () => clearInterval(iv);
  }, [texte, actif]);
  return { visible: texte.slice(0, n), fini, tout };
}

/** Voile de lisibilité du coffre : trame de pixels charbon à densité
    croissante vers le bas — jamais un dégradé CSS (règle DA). Masque généré
    une fois, caché au niveau module. */
let veilCache: string | null = null;
function getVeilMask(): string | null {
  if (typeof document === "undefined") return null;
  // Généré à la taille d'affichage exacte (390×170) : étirer une trame Bayer
  // déforme ses cellules — la leçon de la bande de dissolution (25/07).
  if (!veilCache) veilCache = ditherFadeMaskDataUrl(390, 170, (_nx, ny) => 1 - ny);
  return veilCache;
}

export default function DeathScreen({
  epitaph,
  day,
  bilan,
  relic,
  heroName,
  cause,
  firstDeath,
  onRestart,
}: {
  epitaph: string;
  day: number;
  bilan: Bilan;
  relic: Relic;
  heroName: string;
  cause: string;
  /** Jalon de première fois : la relique est un fragment fort (déjà garanti
      côté forge) et la ligne de fonction accueille au lieu de railler. */
  firstDeath?: boolean;
  onRestart: () => void;
}) {
  const [ecran, setEcran] = useState<Ecran>("fatal");
  const [coffreOuvert, setCoffreOuvert] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mem = useMemo(() => loadMemory(), []);
  const morts = mem.deaths;

  // Le texte du fragment : réaction aux jours tenus, puis fragment d'arc au
  // jalon — sinon une citation contextuelle du pool. Tiré dans un EFFET, pas
  // au rendu : le tirage écrit la mémoire des « 3 dernières servies ».
  const [fragTexteSrc, setFragTexteSrc] = useState("");
  useEffect(() => {
    const arc = fragmentPour(morts);
    const suite =
      arc ??
      pickJailerQuote({
        morts,
        jour: day,
        acte: 1,
        fixation: cause === "le Hameau des Renonçants",
        rareteRare: relic.rarity !== "commune",
        classe: false,
        joursHorsJeu: 0,
        meilleurScore: day >= mem.bestDays && morts > 1,
      });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- le tirage écrit le localStorage (3 dernières servies) : impossible au rendu
    setFragTexteSrc(`${reactionJours(day)}\n\n${suite}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tiré une seule fois par mort
  }, []);
  const { visible: fragTexte, fini: fragFini, tout: fragTout } = useTyped(fragTexteSrc, ecran === "fragment");

  // Le classement, pour l'écran du Registre : la ligne du héros doit
  // réellement entrer aux Cent — sinon le livre perd sa valeur.
  const lesCent = useMemo(() => buildLesCent(mem, heroName, 0), [mem, heroName]);
  const classe = useMemo(
    () => lesCent.some((r) => r.isPlayer && r.name === heroName && r.days === day),
    [lesCent, heroName, day]
  );

  /* ─── écran 1 : la combustion — les pixels TOMBENT et nourrissent le lit ── */
  useEffect(() => {
    if (ecran !== "fatal") return;
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const frame = cv.parentElement as HTMLElement | null;
    const box = frame?.getBoundingClientRect();
    const W = Math.round(box?.width ?? 390);
    const H = Math.round(box?.height ?? 800);
    cv.width = W;
    cv.height = H;

    // Tout y passe (30/07) : d'abord les CTA (le joueur perd la main), puis le
    // texte (la scène perd sa voix), puis LE RESTE de l'écran — narration,
    // illustration, dé, verdict. L'écran finit entièrement noir.
    const rectDe = (sel: string) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el || !box) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height };
    };
    const zones = [
      rectDe(".choices-bar"),
      rectDe(".scene-text-zone"),
      { x: 0, y: 0, w: W, h: H },
    ].filter((z): z is { x: number; y: number; w: number; h: number } => !!z);

    const dissolveAt = 500;
    const t0 = performance.now();
    const CELL = 3;
    // Les pixels détachés TOMBENT — gravité, légère ondulation — et
    // s'accumulent en bas : c'est le futur lit de braises des écrans suivants.
    type Chute = { x: number; y: number; v: number; vie: number };
    const chutes: Chute[] = [];
    const SOL_COL = 2; // largeur d'une colonne d'accumulation, en px
    const sol = new Float32Array(Math.ceil(W / SOL_COL));
    const mangees = new Set<string>();
    let raf = 0;

    // Ordre de combustion : par zone, du bas vers le haut, avec un désordre
    // seedé — une grille qui se vide ligne à ligne aurait l'air d'un store.
    const cellules: { x: number; y: number; ordre: number }[] = [];
    zones.forEach((z, zi) => {
      for (let y = z.y; y < z.y + z.h; y += CELL) {
        for (let x = z.x; x < z.x + z.w; x += CELL) {
          const avance = (z.y + z.h - y) / Math.max(1, z.h); // bas d'abord
          const bruit = ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1 + 1) % 1;
          cellules.push({ x, y, ordre: zi * 1000 + (1 - avance) * 700 + bruit * 220 });
        }
      }
    });
    const ordreMax = Math.max(1, ...cellules.map((c) => c.ordre));
    const duree = 3400; // toute la surface, pas seulement deux boîtes

    function draw(now: number) {
      raf = requestAnimationFrame(draw);
      const t = now - t0;
      ctx!.clearRect(0, 0, W, H);

      // Ce qui a déjà brûlé reste brûlé (charbon plein).
      ctx!.fillStyle = CHARBON;
      mangees.forEach((k) => {
        const [x, y] = k.split(",").map(Number);
        ctx!.fillRect(x, y, CELL, CELL);
      });

      if (t > dissolveAt) {
        const p = Math.min(1, (t - dissolveAt) / duree);
        const seuil = p * ordreMax * 1.05;
        for (const c of cellules) {
          const k = `${c.x},${c.y}`;
          if (mangees.has(k) || c.ordre > seuil) continue;
          mangees.add(k);
          ctx!.fillStyle = CHARBON;
          ctx!.fillRect(c.x, c.y, CELL, CELL);
          // Le pixel brûlé ne disparaît pas : il SE DÉTACHE et tombe.
          if (chutes.length < 1100 && Math.random() < 0.6)
            chutes.push({ x: c.x + 1, y: c.y, v: 0.4 + Math.random() * 0.9, vie: 0 });
        }
      }

      // Les braises de papier brûlé descendent, ondulent, et se posent : le
      // lit s'épaissit là où elles atterrissent.
      for (let i = chutes.length - 1; i >= 0; i--) {
        const b = chutes[i];
        b.v += 0.05; // gravité douce — une braise, pas une pierre
        b.y += b.v;
        b.x += Math.sin((b.vie + i) * 0.11) * 0.5;
        b.vie += 1;
        const col = Math.max(0, Math.min(sol.length - 1, Math.round(b.x / SOL_COL)));
        const plancher = H - sol[col];
        if (b.y >= plancher) {
          sol[col] = Math.min(16, sol[col] + 0.45);
          chutes.splice(i, 1);
          continue;
        }
        // Raréfaction par PROBABILITÉ de dessin, jamais par alpha (DA).
        if (Math.random() < 0.2) continue;
        ctx!.fillStyle = Math.random() < 0.8 ? ORANGE : "rgba(224,99,42,.5)";
        ctx!.fillRect(Math.round(b.x), Math.round(b.y), 1, 1);
      }

      // Le lit qui couve en bas : pixels orange à densité décroissante vers le
      // haut de l'accumulation — le raccord visuel avec FondBraises.
      for (let c = 0; c < sol.length; c++) {
        const h = sol[c];
        if (h < 1) continue;
        for (let y = 0; y < h; y += 1) {
          const densite = 1 - y / Math.max(1, h);
          if (Math.random() < densite * 0.75) {
            ctx!.fillStyle = ORANGE;
            ctx!.fillRect(c * SOL_COL, H - 1 - y, SOL_COL, 1);
          }
        }
      }

      // Fin : tout est brûlé, les dernières braises posées → noir complet,
      // puis l'écran suivant. On n'attend pas la toute dernière chute.
      if (t > dissolveAt + duree + 500 && chutes.length < 30) {
        cancelAnimationFrame(raf);
        ctx!.fillStyle = CHARBON;
        ctx!.fillRect(0, 0, W, H);
        setEcran("mort");
      }
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ecran]);

  const suivant = () => {
    // Règle globale : sur un texte en cours de frappe, le premier toucher
    // RÉVÈLE, il n'avance pas. (Le fragment est le seul écran de la séquence
    // qui se tape — les autres sont statiques.)
    if (ecran === "fragment" && !fragFini) return fragTout();
    if (ecran === "mort") return setEcran("fragment");
    if (ecran === "fragment") return setEcran("registre");
    if (ecran === "registre") return setEcran("relique");
    if (ecran === "relique") {
      // Le coffre : le premier tap RÉVÈLE, il ne fait pas avancer (30/07).
      if (!coffreOuvert) return setCoffreOuvert(true);
      return onRestart();
    }
  };

  /* ─── écran 1 : transparent, posé sur le jeu — le tap ne coupe rien ────── */
  if (ecran === "fatal") {
    return (
      <div className="absolute inset-0 z-[20]">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
    );
  }

  /* ─── écrans de bilan : plein cadre charbon, lit de braises en bas ─────── */
  return (
    <div
      className="absolute inset-0 z-[20] flex flex-col overflow-hidden bg-[var(--color-bg)]"
      onClick={suivant}
    >
      {ecran === "mort" && (
        <div className="flex flex-1 flex-col px-[15px] pt-[64px]">
          {/* Maquette 2295-653 : le nom en Instrument Serif 48 orange, la puce
              JOUR, l'épitaphe entre deux filets, puis le bilan — les seuls
              chiffres bruts autorisés du jeu (un registre, pas un score). */}
          <h2
            className="text-center text-[48px] leading-none text-[var(--color-accent)]"
            style={{ fontFamily: "var(--font-title)" }}
          >
            {heroName}
          </h2>
          <div className="mt-[18px] flex items-center justify-center gap-[8px]">
            <span className="size-[3px] rotate-45 bg-[var(--color-accent)]" aria-hidden />
            <span className="font-mono text-[12px] font-medium uppercase tracking-[0.6px] text-[var(--color-accent)]">
              Jour {day}
            </span>
            <span className="size-[3px] rotate-45 bg-[var(--color-accent)]" aria-hidden />
          </div>
          <div className="mt-[30px] border-t border-[var(--color-ink)]/20 pt-[22px]">
            <p className="mx-auto w-[350px] text-center font-mono text-[13px] leading-[1.3] text-[var(--color-ink)]">
              {epitaph}
            </p>
          </div>
          <div className="mt-[22px] border-t border-[var(--color-ink)]/20" />
          <div className="mt-[28px] flex flex-col gap-[16px]">
            <LigneBilan label="Jours tenus" valeur={String(bilan.jours)} />
            <LigneBilan label="Point le plus profond" valeur={bilan.plusLoin} />
            <LigneBilan label="Lieux traversés" valeur={String(bilan.lieux)} />
            <LigneBilan label="Combats traversés" valeur={String(bilan.rencontres)} />
            <LigneBilan label="Dés lancés" valeur={`${bilan.des} · ${bilan.desTenus} tenus`} />
            <LigneBilan label="Destins • Malédictions" valeur={`${bilan.destins} • ${bilan.maledictions}`} />
            <LigneBilan label="Relique portée" valeur={bilan.reliquePortee ?? "aucune"} />
          </div>
          <TouchHint bottom={HINT_BAS} />
        </div>
      )}

      {ecran === "fragment" && (
        <div className="flex flex-1 flex-col">
          {/* Maquette 2320-4447 : la tête du Geôlier émerge du noir en haut,
              sa voix au centre — réaction aux jours, puis fragment d'arc ou
              citation contextuelle. Frappe 42 ms, la cadence du Geôlier. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src={assetUrl("assets/mort_geolier_tete.png")}
            className="block w-full select-none"
            style={{ imageRendering: "pixelated" }}
          />
          <p className="mx-auto mt-[14px] w-[350px] whitespace-pre-line text-center font-mono text-[13px] leading-[1.55] text-[var(--color-ink)]">
            {fragTexte}
            {!fragFini && <span className="type-cursor">▌</span>}
          </p>
          {fragFini && <TouchHint bottom={HINT_BAS} />}
        </div>
      )}

      {ecran === "registre" &&
        (classe ? (
          <RegistreMort lesCent={lesCent} fallen={mem.fallen} heroName={heroName} day={day} cause={cause} />
        ) : (
          <div className="flex flex-1 flex-col justify-center px-[26px]">
            {/* Sans quoi le Registre perd sa valeur : on n'entre pas au livre
                parce qu'on est mort, on y entre parce qu'on a tenu. */}
            <h3
              className="text-center text-[24px] leading-[1.1] text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-title)" }}
            >
              Ton nom n&apos;entre pas au livre
            </h3>
            <p className="mt-[16px] text-center font-mono text-[13px] leading-[1.7] text-[var(--color-ink)] opacity-50">
              {day} jour{day > 1 ? "s" : ""}. Cent tiennent mieux que ça.
            </p>
            <TouchHint bottom={HINT_BAS} />
          </div>
        ))}

      {ecran === "relique" &&
        (!coffreOuvert ? (
          /* Phase A — le coffre (maquette 2333-10146) : plein cadre, voile de
             lisibilité TRAMÉ en bas, le tap déclenche la révélation. */
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              src={assetUrl("assets/mort_coffre.png")}
              className="absolute inset-0 h-full w-full object-cover select-none"
              style={{ imageRendering: "pixelated" }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-[170px] bg-[var(--color-bg)]"
              style={{
                maskImage: getVeilMask() ? `url(${getVeilMask()})` : undefined,
                WebkitMaskImage: getVeilMask() ? `url(${getVeilMask()})` : undefined,
                maskSize: "100% 100%",
                WebkitMaskSize: "100% 100%",
              }}
              aria-hidden
            />
            <p className="absolute inset-x-0 bottom-[42px] text-center font-mono text-[13px] leading-[1.5] text-[var(--color-ink)]">
              Touche le coffre pour
              <br />
              découvrir ta relique
            </p>
          </div>
        ) : (
          /* Phase B — la révélation (maquette 2332-6998) : un nuage de cendres
             se disperse en cercle irrégulier derrière la relique (~1 s), puis
             retombe. Ensuite : tag de rareté, nom, fonction, murmure. */
          /* ⚠️ Écrans COURTS (390×720 et moins) : la maquette est dessinée pour
             844 px de haut. En dur, la fonction et le coût de la relique
             tombaient DANS les flammes. Le haut et le cadre se resserrent donc
             en dessous de 800 px, sans rien changer sur un grand écran. */
          <div className="flex flex-1 flex-col items-center px-[27px] pt-[6vh] max-[799px]:pt-[3vh]">
            <div className="relative">
              <CendresRevelation />
              <div className="relative size-[336px] max-[799px]:size-[224px] overflow-hidden border-2 border-solid border-[var(--color-accent)]">
                {/* L'illustration propre de la relique quand elle existe
                    (6/08) ; sinon l'icône tramée générique des Reliques —
                    jamais une image cassée. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  src={assetUrl(
                    reliqueIllustration(relic.relicId ?? relic.name, assetExiste) ??
                      "assets/objet_couronne_brisee.png"
                  )}
                  className="h-full w-full object-cover select-none"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
            </div>
            <TagRarete rarity={relic.rarity} className="mt-[20px] max-[799px]:mt-[12px]" />
            <h3
              className="mt-[12px] text-center text-[36px] leading-none text-[var(--color-accent)] max-[799px]:mt-[8px] max-[799px]:text-[28px]"
              style={{ fontFamily: "var(--font-title)" }}
            >
              {relic.name}
            </h3>
            <p className="mt-[24px] w-[336px] max-w-full text-center font-mono text-[13px] leading-[1.3] text-[var(--color-ink)] max-[799px]:mt-[12px]">
              {firstDeath
                ? "De cette première mort, il reste plus que d'ordinaire."
                : "Celui qui te suivra la portera."}
            </p>
            {/* La FONCTION en mots (promesse n°3 du 4/08) : la relique n'est
                plus un nom sec — elle annonce ce qu'elle fera de la prochaine
                vie. Jamais un chiffre. */}
            <p className="mt-[10px] w-[336px] max-w-full text-center font-mono text-[12px] leading-[1.5] text-[var(--color-ink)] opacity-60 max-[799px]:mt-[6px]">
              {relicFiche(relic)?.fonction ?? RELIC_FONCTION[relicEffect(relic)]}
            </p>
            {/* LE COÛT (5/08) : une relique aide ET prend. Le prix est annoncé
                ici, à la forge, dans les mêmes mots que le don — le joueur sait
                ce qu'il emporte avant de recommencer. Jamais un chiffre. */}
            {relicFiche(relic)?.cout && (
              <p className="mt-[8px] w-[336px] max-w-full text-center font-mono text-[12px] leading-[1.5] text-[var(--color-accent)] opacity-80 max-[799px]:mt-[6px]">
                {relicFiche(relic)!.cout}
              </p>
            )}
            {relic.rarity !== "commune" && (
              <p className="mt-[14px] text-center font-mono text-[13px] italic leading-[1.5] text-[var(--color-accent)] max-[799px]:mt-[8px] max-[799px]:hidden">
                «&nbsp;{relicFiche(relic)?.murmure ?? cause}&nbsp;»
              </p>
            )}
            <TouchHint bottom={HINT_BAS} />
          </div>
        ))}

      {/* Le fond de braises — présent en bas de TOUS les écrans de la
          séquence (30/07) : ce qui est tombé pendant la combustion couve
          encore, jusqu'au retour à l'accueil. Foyer triplé (48 → 144 px,
          retour Patrick 30/07) : les flammes montent, le bas de l'écran
          n'est plus une bande noire sous un lit mince. */}
      <FondBraises height={144} />
    </div>
  );
}

/**
 * Tag de rareté (maquette 2333-7011, qui fait foi — AUCUNE couleur neuve, la
 * palette reste Charbon/Orange/Blanc) : commune = contour blanc, rare = fond
 * blanc texte charbon, légendaire = fond orange texte charbon.
 */
function TagRarete({ rarity, className }: { rarity: Relic["rarity"]; className?: string }) {
  const base =
    "inline-block p-[4px] font-mono text-[12px] font-medium uppercase tracking-[0.6px] leading-[1.2]";
  if (rarity === "legendaire")
    return <span className={`${base} bg-[var(--color-accent)] text-[var(--color-bg)] ${className ?? ""}`}>relique légendaire</span>;
  if (rarity === "rare")
    return <span className={`${base} bg-[var(--color-ink)] text-[var(--color-bg)] ${className ?? ""}`}>relique rare</span>;
  return (
    <span className={`${base} border border-solid border-[var(--color-ink)] text-[var(--color-ink)] ${className ?? ""}`}>
      relique commune
    </span>
  );
}

function LigneBilan({ label, valeur }: { label: string; valeur: string }) {
  // Maquette 2295-653 : libellé blanc-50 à gauche, valeur BLANCHE à droite,
  // tout en 13px mono capitales — plus d'accent orange sur les valeurs.
  return (
    <div className="flex items-baseline justify-between gap-[10px]">
      <span className="font-mono text-[13px] uppercase leading-[1.3] text-[var(--color-ink)] opacity-50">
        {label}
      </span>
      <span className="text-right font-mono text-[13px] uppercase leading-[1.3] text-[var(--color-ink)]">
        {valeur}
      </span>
    </div>
  );
}

/**
 * L'écran du Registre (maquette 2331-675) : le livre en haut, deux onglets
 * TES MORTS / LES 100, la ligne du héros surlignée pleine largeur avec le
 * liseré orange. TES MORTS classe les héros du COMPTE par jours tenus.
 */
function RegistreMort({
  lesCent,
  fallen,
  heroName,
  day,
  cause,
}: {
  lesCent: RegistreEntry[];
  fallen: { name: string; days: number; cause: string; destin?: Destin }[];
  heroName: string;
  day: number;
  cause: string;
}) {
  const [onglet, setOnglet] = useState<"morts" | "cent">("morts");
  const tesMorts = useMemo(() => {
    // Même règle que `mesMorts` : le cimetière ne contient que des morts.
    // Une traversée réussie n'a rien à faire sous cet onglet (14/08).
    const rows = fallen
      .filter((f) => (f.destin ?? destinDepuisCause(f.cause)) === "mort")
      .sort((a, b) => b.days - a.days);
    return rows.map((r, i) => ({ rank: i + 1, ...r }));
  }, [fallen]);
  // La ligne du héros qui vient de tomber : première occurrence exacte.
  const moiIdx = tesMorts.findIndex((r) => r.name === heroName && r.days === day && r.cause === cause);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={assetUrl("assets/objet_grand_registre_d.png")}
        className="block h-[128px] w-full object-cover object-[center_38%] select-none"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="mt-[10px] flex items-center justify-center gap-[8px]">
        <span className="size-[3px] rotate-45 bg-[var(--color-accent)]" aria-hidden />
        <span className="font-mono text-[12px] font-medium uppercase tracking-[0.6px] text-[var(--color-accent)]">
          Grand Registre
        </span>
        <span className="size-[3px] rotate-45 bg-[var(--color-accent)]" aria-hidden />
      </div>
      <h3
        className="mt-[6px] text-center text-[30px] leading-[1.05] text-[var(--color-accent)]"
        style={{ fontFamily: "var(--font-title)" }}
      >
        Ton nom entre au livre
      </h3>
      <div className="mt-[14px] flex gap-[10px] px-[15px]">
        <OngletRegistre actif={onglet === "morts"} label="Tes morts" onClick={() => setOnglet("morts")} />
        <OngletRegistre actif={onglet === "cent"} label="Les 100" onClick={() => setOnglet("cent")} />
      </div>
      <div className="mt-[12px] flex items-baseline px-[15px] font-mono text-[10px] uppercase tracking-[1px] text-[var(--color-ink)] opacity-50">
        <span className="w-[44px]">Rang</span>
        <span className="flex-1">Nom</span>
        <span>Jours</span>
      </div>
      <div className="mt-[4px] min-h-0 flex-1 overflow-y-auto pb-[70px]">
        {onglet === "morts"
          ? tesMorts.map((r, i) => (
              <LigneRegistreMort
                key={`${r.name}-${i}`}
                rank={r.rank}
                name={r.name}
                sub={r.cause}
                days={r.days}
                moi={i === moiIdx}
              />
            ))
          : lesCent.map((r) => (
              <LigneRegistreMort
                key={`${r.rank}-${r.name}`}
                rank={r.rank}
                name={r.name}
                sub={r.locked ? `${r.days.toLocaleString("fr-FR")} ${r.cause}` : r.cause}
                days={r.days}
                moi={Boolean(r.isPlayer && r.name === heroName && r.days === day)}
                locked={r.locked}
              />
            ))}
      </div>
      <TouchHint bottom={HINT_BAS} />
    </div>
  );
}

function OngletRegistre({ actif, label, onClick }: { actif: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        // L'onglet ne doit pas faire avancer la séquence (le conteneur écoute
        // le tap « Touche pour continuer »).
        e.stopPropagation();
        onClick();
      }}
      className={`h-[34px] flex-1 cursor-pointer border border-solid bg-transparent font-mono text-[12px] font-medium uppercase tracking-[2px] ${
        actif
          ? "border-[var(--color-ink)] text-[var(--color-ink)]"
          : "border-[var(--color-ink)]/25 text-[var(--color-ink)] opacity-50"
      }`}
    >
      {label}
    </button>
  );
}

function LigneRegistreMort({
  rank,
  name,
  sub,
  days,
  moi,
  locked,
}: {
  rank: number;
  name: string;
  sub: string;
  days: number;
  moi?: boolean;
  /** La première place, verrouillée : le NOM GRATTÉ du record (le Geôlier) —
      même traitement que le Registre plein cadre : rature de pixels, rang en
      orange, jours dans le sous-titre parce qu'ils ne se comparent à rien. */
  locked?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center gap-[12px] px-[15px] py-[9px] ${
        moi ? "bg-[var(--color-accent)]/25" : ""
      }`}
    >
      {moi && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-[4px] bg-[var(--color-accent)]" />
      )}
      <span
        className={`w-[32px] shrink-0 font-mono text-[13px] ${
          moi || locked ? "text-[var(--color-accent)]" : "text-[var(--color-ink)] opacity-50"
        }`}
      >
        {rank}
      </span>
      <span className="min-w-0 flex-1">
        {locked ? (
          <NomGratte />
        ) : (
          <span className="block font-mono text-[13px] uppercase tracking-[0.5px] text-[var(--color-ink)]">
            {name}
          </span>
        )}
        <span
          className={`mt-[2px] block font-mono text-[10px] ${
            locked ? "text-[var(--color-accent)]" : "text-[var(--color-ink)] opacity-50"
          }`}
        >
          {sub}
        </span>
      </span>
      {!locked && (
        <span
          className={`shrink-0 text-right font-mono text-[13px] ${
            moi ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"
          }`}
        >
          {days}
        </span>
      )}
    </div>
  );
}

/**
 * L'ÉCLAT DE CENDRES de la révélation (30/07, amplifié le 30/07 au soir —
 * « plus impressionnante, plus voyante »).
 *
 * La relique ne se dévoile plus derrière un petit nuage : elle ARRACHE de la
 * matière. Les cendres partent du BORD du cadre (jamais du centre, qui est
 * caché derrière l'illustration : on ne voyait donc que la fin du mouvement),
 * traversent tout le cadre du téléphone, et le calque passe DEVANT la relique
 * — des débris qui volent au premier plan, pas une auréole sage.
 *
 * Trois populations, pour que le geste ait du corps :
 *   • l'ONDE — très rapide, brève, dense, moitié blanche : le choc lui-même ;
 *   • les ÉCLATS — lourds, projetés loin, puis qui retombent en accélérant ;
 *   • les CENDRES fines — lentes, elles MONTENT et ondulent longtemps après.
 * Rien n'est jamais dessiné en opacité variable : la raréfaction se fait par
 * probabilité de dessin, et les seules couleurs restent orange et blanc.
 */
type Eclat = {
  a: number;
  r0: number;
  r1: number;
  v: number;
  taille: number;
  /** < 0 : monte (cendre fine) · > 0 : retombe (éclat lourd). */
  gravite: number;
  sway: number;
  phase: number;
  vie: number;
  blanc: number;
  /** Traînée : les plus rapides laissent 2-3 pixels derrière elles. */
  trainee: number;
};

const CENDRES_DUREE = 2.6;

function CendresRevelation() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    // Le canvas déborde très largement le cadre de 336 px : l'éclat doit
    // sortir du cadre de la relique et courir jusqu'aux bords du téléphone.
    const S = 620;
    cv.width = cv.height = S;
    const cx = S / 2;
    const cy = S / 2;

    // Densité inégale selon l'angle : 5 lobes de poids aléatoires, figés au
    // montage — l'éclat a des trous et des paquets, jamais une couronne.
    const lobes = Array.from({ length: 5 }, () => ({
      a: Math.random() * Math.PI * 2,
      w: 0.4 + Math.random() * 0.9,
    }));
    const poids = (angle: number) =>
      lobes.reduce((s, l) => s + l.w * Math.max(0, Math.cos(angle - l.a)) ** 2, 0.25);

    // Le bord du cadre (336 px de côté) vu depuis le centre : le rayon de
    // départ suit le CARRÉ, pas un cercle — les cendres naissent bien au ras
    // de la bordure orange, y compris dans les coins.
    const DEMI = 168;
    const rayonBord = (a: number) => {
      const c = Math.abs(Math.cos(a));
      const s = Math.abs(Math.sin(a));
      return DEMI / Math.max(c, s, 0.0001);
    };

    const eclats: Eclat[] = [];
    const pousse = (n: number, faire: (a: number) => Eclat) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        if (Math.random() > poids(a) / 1.55) continue;
        eclats.push(faire(a));
      }
    };
    // L'onde de choc : part au ras du cadre, file vite et loin, meurt tôt.
    pousse(520, (a) => ({
      a,
      r0: rayonBord(a) - 4,
      r1: rayonBord(a) + 150 + Math.random() * 130 + Math.sin(a * 3.7) * 26,
      v: 2.2 + Math.random() * 1.4,
      taille: Math.random() < 0.72 ? 1 : 2,
      gravite: 0,
      sway: 0,
      phase: 0,
      vie: 0.55 + Math.random() * 0.35,
      blanc: 0.5,
      trainee: Math.random() < 0.45 ? 2 + ((Math.random() * 2) | 0) : 0,
    }));
    // Les éclats lourds : projetés, ils ralentissent puis retombent.
    pousse(420, (a) => ({
      a,
      r0: rayonBord(a) - 10 - Math.random() * 30,
      r1: rayonBord(a) + 60 + Math.random() * 180,
      v: 1.0 + Math.random() * 0.9,
      taille: Math.random() < 0.5 ? 2 : Math.random() < 0.75 ? 1 : 3,
      gravite: 70 + Math.random() * 130,
      sway: 0.5 + Math.random() * 1.4,
      phase: Math.random() * 6.283,
      vie: 1.5 + Math.random() * 1.1,
      blanc: 0.18,
      trainee: 0,
    }));
    // Les cendres fines : elles montent, ondulent, et s'attardent.
    pousse(380, (a) => ({
      a,
      r0: rayonBord(a) - 20 - Math.random() * 60,
      r1: rayonBord(a) + 20 + Math.random() * 150,
      v: 0.55 + Math.random() * 0.6,
      taille: 1,
      gravite: -(30 + Math.random() * 80),
      sway: 1.4 + Math.random() * 2.6,
      phase: Math.random() * 6.283,
      vie: 1.8 + Math.random() * 0.8,
      blanc: 0.3,
      trainee: 0,
    }));

    const reduced = animReduced();
    const t0 = performance.now();
    let raf = 0;
    function anim(now: number) {
      const t = Math.min(CENDRES_DUREE, (now - t0) / 1000);
      ctx!.clearRect(0, 0, S, S);
      for (const c of eclats) {
        if (t > c.vie) continue;
        // Sortie franche puis freinage (ease-out quadratique).
        const p = Math.min(1, t * c.v);
        const r = c.r0 + (c.r1 - c.r0) * (1 - (1 - p) * (1 - p));
        // La gravité ne s'applique qu'une fois la projection finie : avant,
        // c'est l'explosion qui commande.
        const apres = Math.max(0, t - 1 / c.v);
        const derive = c.gravite * apres * apres;
        const x = cx + Math.cos(c.a) * r + Math.sin(t * 3 + c.phase) * c.sway * apres * 12;
        const y = cy + Math.sin(c.a) * r * 0.94 + derive;
        // Raréfaction par PROBABILITÉ de dessin (jamais l'alpha) : plein
        // pendant l'éclat, puis extinction sur le dernier tiers de vie.
        const reste = 1 - t / c.vie;
        const survie = reste > 0.45 ? 0.92 : reste / 0.45;
        if (Math.random() > survie) continue;
        ctx!.fillStyle = Math.random() < c.blanc ? "#ffffff" : ORANGE;
        const px = Math.round(x);
        const py = Math.round(y);
        ctx!.fillRect(px, py, c.taille, c.taille);
        if (c.trainee && p < 1) {
          // Traînée dans l'axe du départ — 2-3 pixels, jamais un dégradé.
          for (let k = 1; k <= c.trainee; k++)
            ctx!.fillRect(px - Math.round(Math.cos(c.a) * k * 3), py - Math.round(Math.sin(c.a) * k * 3), 1, 1);
        }
      }
      if (t < CENDRES_DUREE && !reduced) raf = requestAnimationFrame(anim);
      else ctx!.clearRect(0, 0, S, S);
    }
    raf = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={ref}
      // z-10 : DEVANT la relique. Les cendres sont des pixels épars, elles ne
      // masquent pas l'illustration — mais des débris qui passent au premier
      // plan lisent comme une explosion, là où un calque derrière lisait
      // comme un halo.
      className="pointer-events-none absolute left-1/2 top-1/2 z-10 size-[620px] -translate-x-1/2 -translate-y-1/2"
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    />
  );
}
