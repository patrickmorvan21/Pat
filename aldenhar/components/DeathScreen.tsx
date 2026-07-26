"use client";

/**
 * LA SÉQUENCE DE MORT — six écrans (journal Notion 26/07, §3).
 *
 * Ordre VERROUILLÉ :
 *   1 · le beat fatal → 2 · la mort → 3 · le fragment → 4 · le Registre
 *   → 5 · la relique → 6 · la relève
 *
 * Le Registre passe AVANT la relique, et ce n'est pas un détail de montage :
 * le fragment et le Registre regardent en ARRIÈRE (ce que cette vie a été),
 * la relique regarde en AVANT (ce que la suivante emporte). Elle doit donc
 * être la dernière image avant la nouvelle run.
 *
 * Écran 1 — la mort arrive DANS la scène, jamais sur un écran séparé. Ce
 * composant se monte donc par-dessus le jeu en restant TRANSPARENT : il
 * mesure les vraies boîtes des CTA et du texte, puis les mange pixel par
 * pixel. Chaque pixel mangé libère au même endroit une braise orange qui
 * monte — les pixels ne s'effacent pas, ils PARTENT. C'est le seul moment du
 * jeu où le tap ne saute rien : le joueur n'a plus la main.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { Relic } from "@/lib/player-memory";
import TouchHint from "@/components/TouchHint";
import { buildLesCent } from "@/lib/registre-data";
import { loadMemory } from "@/lib/player-memory";
import { animReduced } from "@/lib/settings";

const CHARBON = "#1c1a16";
const ORANGE = "#e0632a";

const RARITY_WORDS: Record<Relic["rarity"], string> = {
  commune: "Relique commune",
  rare: "Relique rare",
  legendaire: "Relique légendaire",
};

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
  reliques: number;
};

type Ecran = "fatal" | "mort" | "fragment" | "registre" | "relique" | "releve";

/**
 * Le fragment du Geôlier : une chose de plus sur cet endroit, à chaque mort.
 * Arc GARANTI aux morts 1, 2, 3, puis 5, 8, 12, 17 — entre les deux, il se
 * tait, sinon la promesse de la 3ᵉ clause s'use.
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
  useEffect(() => {
    if (!actif) return;
    if (animReduced()) {
      // Animations réduites : le texte est déjà entier, on ne « tape » pas.
      // Passe par un tick pour ne pas poser l'état dans le corps de l'effet.
      const t = setTimeout(() => {
        setN(texte.length);
        setFini(true);
      }, 0);
      return () => clearTimeout(t);
    }
    // Pas de remise à zéro ici : l'état part déjà de 0/false et cet effet ne
    // s'arme qu'une fois (l'écran du fragment n'est joué qu'une fois).
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= texte.length) {
        clearInterval(iv);
        setFini(true);
      }
    }, 42);
    return () => clearInterval(iv);
  }, [texte, actif]);
  return { visible: texte.slice(0, n), fini };
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
  /** Jalon de première fois : le Geôlier accueille au lieu de railler, et la
      relique est un fragment fort (déjà garanti côté forge). */
  firstDeath?: boolean;
  onRestart: () => void;
}) {
  const [ecran, setEcran] = useState<Ecran>("fatal");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [motVisible, setMotVisible] = useState(false);

  const mem = useMemo(() => loadMemory(), []);
  const morts = mem.deaths;
  const fragment = useMemo(() => fragmentPour(morts), [morts]);
  const { visible: fragTexte, fini: fragFini } = useTyped(fragment ?? "", ecran === "fragment");

  // Le classement, pour l'écran 4 : la ligne du héros et ses deux voisines.
  const voisines = useMemo(() => {
    const rows = buildLesCent(mem, heroName, 0);
    const i = rows.findIndex((r) => r.isPlayer && r.name === heroName && r.days === day);
    if (i < 0) return null;
    return { avant: rows[i - 1], moi: rows[i], apres: rows[i + 1] };
  }, [mem, heroName, day]);

  /* ─── écran 1 : la dissolution de la scène, braises comprises ────────── */
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

    // On mange les VRAIES boîtes de l'écran de jeu : d'abord les CTA (le
    // joueur perd la main), ensuite le texte (la scène perd sa voix).
    const rectDe = (sel: string) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el || !box) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height };
    };
    const zones = [rectDe(".choices-bar"), rectDe(".scene-text-zone")].filter(
      (z): z is { x: number; y: number; w: number; h: number } => !!z
    );

    // Le mot MORT apparaît sèchement, puis la dissolution commence.
    const motAt = 420;
    const dissolveAt = 1100;
    const t0 = performance.now();
    const CELL = 3;
    type Braise = { x: number; y: number; v: number; vie: number };
    const braises: Braise[] = [];
    const mangees = new Set<string>();
    let raf = 0;
    let motPose = false;

    // Ordre de repas : par zone, du bas vers le haut, avec un peu de désordre
    // seedé — une grille qui se vide ligne par ligne aurait l'air d'un store.
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

    function draw(now: number) {
      raf = requestAnimationFrame(draw);
      const t = now - t0;
      if (!motPose && t > motAt) {
        motPose = true;
        setMotVisible(true);
      }
      ctx!.clearRect(0, 0, W, H);

      // Ce qui a déjà été mangé reste mangé (charbon plein).
      ctx!.fillStyle = CHARBON;
      mangees.forEach((k) => {
        const [x, y] = k.split(",").map(Number);
        ctx!.fillRect(x, y, CELL, CELL);
      });

      if (t > dissolveAt) {
        const p = Math.min(1, (t - dissolveAt) / 1800);
        const seuil = p * ordreMax * 1.05;
        for (const c of cellules) {
          const k = `${c.x},${c.y}`;
          if (mangees.has(k) || c.ordre > seuil) continue;
          mangees.add(k);
          ctx!.fillStyle = CHARBON;
          ctx!.fillRect(c.x, c.y, CELL, CELL);
          // Le pixel mangé ne disparaît pas : il s'envole.
          if (braises.length < 900)
            braises.push({ x: c.x + 1, y: c.y, v: 0.5 + Math.random() * 1.1, vie: 0 });
        }
      }

      // Les braises montent et rejoignent les cendres du Geôlier.
      for (let i = braises.length - 1; i >= 0; i--) {
        const b = braises[i];
        b.y -= b.v;
        b.vie += 1;
        if (b.y < -2 || b.vie > 140) {
          braises.splice(i, 1);
          continue;
        }
        // Raréfaction par PROBABILITÉ de dessin, jamais par alpha (DA).
        if (Math.random() > 1 - b.y / H) continue;
        ctx!.fillStyle = Math.random() < 0.78 ? ORANGE : "rgba(224,99,42,.5)";
        ctx!.fillRect(Math.round(b.x + Math.sin(b.vie * 0.09) * 1.5), Math.round(b.y), 1, 1);
      }

      // Fin : tout est mangé et les dernières braises sont hautes. On
      // n'attend pas que la toute dernière sorte du cadre — la séquence
      // traînerait de plusieurs secondes pour trois pixels.
      if (t > dissolveAt + 2600 && braises.length < 40) {
        cancelAnimationFrame(raf);
        setEcran("mort");
      }
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ecran]);

  const suivant = () => {
    if (ecran === "mort") return setEcran(fragment ? "fragment" : "registre");
    if (ecran === "fragment") return setEcran("registre");
    if (ecran === "registre") return setEcran("relique");
    if (ecran === "relique") return setEcran("releve");
  };

  /* ─── écran 1 : transparent, posé sur le jeu ─────────────────────────── */
  if (ecran === "fatal") {
    return (
      <div className={`absolute inset-0 z-[20] ${animReduced() ? "" : "death-quake"}`}>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        {motVisible && (
          <p
            className="death-mot absolute inset-x-0 top-[46%] z-[1] text-center"
            style={{ fontFamily: "var(--font-title)" }}
          >
            MORT
          </p>
        )}
      </div>
    );
  }

  /* ─── écrans 2 à 6 : plein cadre charbon ─────────────────────────────── */
  return (
    <div
      className="absolute inset-0 z-[20] flex flex-col justify-center bg-[var(--color-bg)] px-[26px]"
      onClick={ecran === "releve" ? undefined : suivant}
    >
      {ecran === "mort" && (
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-[var(--color-ink)] opacity-50">
            Ci-tombe
          </p>
          <h2
            className="mt-[10px] text-[40px] leading-[1.05] tracking-[2px] text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-title)" }}
          >
            {heroName.toUpperCase()}
          </h2>
          <p className="mt-[14px] font-mono text-[11px] uppercase tracking-[4px] text-[var(--color-accent)]">
            Jour {day}
          </p>
          <p className="mt-[18px] font-mono text-[13px] leading-[1.7] text-[var(--color-ink)]">
            {epitaph}
          </p>
          {/* Le BILAN : les seuls chiffres bruts autorisés du jeu. C'est un
              registre, pas un retour de partie — d'où le ton de greffe. */}
          <div className="mx-auto mt-[26px] flex w-[250px] flex-col gap-[7px] text-left">
            <LigneBilan label="Jours tenus" valeur={String(bilan.jours)} accent />
            <LigneBilan label="Plus loin descendue" valeur={bilan.plusLoin} />
            <LigneBilan label="Lieux traversés" valeur={String(bilan.lieux)} />
            <LigneBilan label="Rencontres" valeur={String(bilan.rencontres)} />
            <LigneBilan label="Dés lancés" valeur={`${bilan.des} (${bilan.desTenus} tenus)`} />
            <LigneBilan
              label="Destins · Malédictions"
              valeur={`${bilan.destins} · ${bilan.maledictions}`}
              accent
            />
            <LigneBilan label="Reliques portées" valeur={String(bilan.reliques)} />
          </div>
          <TouchHint />
        </div>
      )}

      {ecran === "fragment" && (
        <div>
          <p className="text-center text-[20px] text-[var(--color-accent)]">◉</p>
          <p className="mt-[16px] whitespace-pre-line font-mono text-[14px] leading-[1.75] text-[var(--color-accent)]">
            {fragTexte}
            {!fragFini && <span className="type-cursor">▌</span>}
          </p>
          {fragFini && <TouchHint />}
        </div>
      )}

      {ecran === "registre" && (
        <div>
          <p className="text-center font-mono text-[10px] uppercase tracking-[3px] text-[var(--color-ink)] opacity-50">
            Le Grand Registre
          </p>
          {voisines ? (
            <>
              <h3
                className="mt-[10px] mb-[20px] text-center text-[24px] leading-[1.1] text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-title)" }}
              >
                Ton nom entre au livre
              </h3>
              <div className="flex flex-col">
                {voisines.avant && <LigneRegistre e={voisines.avant} />}
                <LigneRegistre e={voisines.moi} moi />
                {voisines.apres && <LigneRegistre e={voisines.apres} />}
              </div>
              <p className="mt-[22px] text-center font-mono text-[11px] leading-[1.6] text-[var(--color-ink)] opacity-50">
                Quatre-vingt-dix-neuf places sont prenables.
                <br />
                La première, non.
              </p>
            </>
          ) : (
            // Sans quoi le Registre perd sa valeur : on n'entre pas au livre
            // parce qu'on est mort, on y entre parce qu'on a tenu.
            <>
              <h3
                className="mt-[10px] text-center text-[24px] leading-[1.1] text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-title)" }}
              >
                Ton nom n&apos;entre pas au livre
              </h3>
              <p className="mt-[16px] text-center font-mono text-[13px] leading-[1.7] text-[var(--color-ink)] opacity-50">
                {day} jour{day > 1 ? "s" : ""}. Cent tiennent mieux que ça.
              </p>
            </>
          )}
          <TouchHint />
        </div>
      )}

      {ecran === "relique" && (
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-[var(--color-ink)] opacity-50">
            Ce qui reste
          </p>
          <Forge />
          <h3
            className="mt-[10px] text-[24px] leading-[1.1] text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-title)" }}
          >
            {relic.name}
          </h3>
          <p className="mt-[10px] font-mono text-[13px] leading-[1.6] text-[var(--color-ink)]">
            {firstDeath
              ? "De cette première mort, il reste plus que d'ordinaire."
              : "Celui qui te suivra la portera."}
          </p>
          {relic.rarity !== "commune" && (
            <p className="mt-[14px] font-mono text-[13px] leading-[1.6] text-[var(--color-accent)] italic">
              «&nbsp;{cause}&nbsp;»
            </p>
          )}
          <p className="mt-[12px] font-mono text-[9px] uppercase tracking-[3px] text-[var(--color-ink)] opacity-50">
            {RARITY_WORDS[relic.rarity]}
          </p>
          <TouchHint />
        </div>
      )}

      {ecran === "releve" && (
        <div className="text-center">
          <p className="font-mono text-[15px] leading-[1.7] text-[var(--color-ink)]">
            Un autre attend déjà au Seuil.
            <br />
            <span className="opacity-50">
              Il ne saura rien de toi — sauf ce que tu lui laisses.
            </span>
          </p>
          <button
            type="button"
            onClick={onRestart}
            className="death-cta-plein mt-[26px] cursor-pointer border-none font-mono text-[14px] font-medium uppercase tracking-[2px]"
          >
            Un autre viendra
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="mt-[22px] block w-full cursor-pointer border-none bg-transparent font-mono text-[11px] text-[var(--color-ink)] opacity-50 underline underline-offset-[3px]"
          >
            Reposer le livre
          </button>
        </div>
      )}
    </div>
  );
}

function LigneBilan({ label, valeur, accent }: { label: string; valeur: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-[10px]">
      <span className="font-mono text-[11px] text-[var(--color-ink)] opacity-50">{label}</span>
      <span
        className={`font-mono text-[13px] ${
          accent ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"
        }`}
      >
        {valeur}
      </span>
    </div>
  );
}

function LigneRegistre({
  e,
  moi,
}: {
  e: { rank: number; name: string; days: number; cause: string };
  moi?: boolean;
}) {
  return (
    <div className={`relative flex items-baseline gap-[10px] py-[9px] ${moi ? "" : "opacity-35"}`}>
      {moi && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 bottom-0 left-[-14px] w-[3px] bg-[var(--color-accent)]"
        />
      )}
      <span
        className={`w-[32px] shrink-0 text-[17px] ${
          moi ? "text-[var(--color-accent)]" : "text-[var(--color-ink)] opacity-50"
        }`}
        style={{ fontFamily: "var(--font-title)" }}
      >
        {e.rank}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[13px] uppercase text-[var(--color-ink)]">
          {e.name}
        </span>
        <span className="mt-[3px] block font-mono text-[10px] text-[var(--color-ink)] opacity-50">
          {e.cause}
        </span>
      </span>
      <span
        className={`w-[52px] shrink-0 text-right text-[19px] ${
          moi ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"
        }`}
        style={{ fontFamily: "var(--font-title)" }}
      >
        {e.days}
      </span>
    </div>
  );
}

/**
 * La relique SE FORGE à l'écran : les cendres du fond convergent et
 * s'agglomèrent pour dessiner sa silhouette. Pas de fondu — un pixel est en
 * vol (clairsemé) ou posé (plein).
 */
function Forge() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const x = cv.getContext("2d");
    if (!x) return;
    const S = 150;
    const cx = S / 2;
    const cy = S / 2;
    const cible: [number, number][] = [];
    for (let a = 0; a < 6.283; a += 0.04) {
      const rr = 30 + Math.sin(a * 6) * 2;
      cible.push([cx + Math.cos(a) * rr, cy - 8 + Math.sin(a) * rr * 0.55]);
    }
    for (let k = 0; k < 34; k++) cible.push([cx + 14 + Math.sin(k * 0.3) * 3, cy + 10 + k * 1.2]);
    const parts = cible.map(([tx, ty]) => ({
      tx,
      ty,
      x: cx + (Math.random() - 0.5) * S,
      y: S + Math.random() * 40,
    }));
    let t = 0;
    let raf = 0;
    const reduced = animReduced();
    function anim() {
      t += 1;
      x!.fillStyle = CHARBON;
      x!.fillRect(0, 0, S, S);
      for (const p of parts) {
        p.x += (p.tx - p.x) * (reduced ? 1 : 0.045);
        p.y += (p.ty - p.y) * (reduced ? 1 : 0.045);
        const pose = Math.abs(p.x - p.tx) < 1.5 && Math.abs(p.y - p.ty) < 1.5;
        x!.fillStyle = pose ? ORANGE : Math.random() < 0.5 ? "rgba(224,99,42,.6)" : "rgba(255,255,255,.25)";
        x!.fillRect(p.x | 0, p.y | 0, pose ? 2 : 1, pose ? 2 : 1);
      }
      if (t < 200 && !reduced) raf = requestAnimationFrame(anim);
    }
    raf = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={ref}
      width={150}
      height={150}
      className="mx-auto mt-[10px] block size-[150px]"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
