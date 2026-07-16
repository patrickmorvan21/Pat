"use client";

import { useEffect, useRef, useState } from "react";
import Scene from "@/components/Scene";
import { buildRegistre, loadMemory } from "@/lib/player-memory";
import { hasSavedRun, loadRun, resetRun } from "@/lib/state";

/**
 * Écrans d'accueil (Figma 1963:370 « Première partie » / 1970:458 « Reprendre
 * partie », 15/07 soir) : héros = le Geôlier détouré sur fond ORANGE plein,
 * animé (respiration + cendres) selon le prototype validé
 * `accueil_geolier_v5.html` ; dessous, panneau CHARBON : PACTUM (Instrument
 * Serif), tagline, CTA à segments décalés, liens en pied.
 * OPTIONS n'est pas encore designé : lien présent mais inerte.
 */

/* ---- Réglages repris tels quels du prototype validé (ne pas lisser) ---- */
const TICK = 90; /* ms par pas de simulation */
const DENSITY = 2; /* cendres créées par pas */
/* Respiration par PALIERS ENTIERS — aucune transition CSS, aucun easing. */
const BREATH = [0, -1, -2, -3, -3, -3, -2, -1, 0, 0, 0];
const BSTEP = 380; /* ms entre deux paliers de respiration */
const CHARBON = "#1c1a16";

type Wisp = { x: number; y: number; v: number; sway: number; f: number; seed: number; age: number };

/**
 * Héros animé : 3 couches — canvas de fumée (dessous), Geôlier détouré
 * (devant, `position:relative`), bande « sol » charbon de 4px tout en bas
 * (masque la ligne révélée quand l'image respire vers le haut).
 */
function HeroGeolier() {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    const cv = canvasRef.current;
    if (!img || !cv) return;
    const ctx = cv.getContext("2d")!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // image fixe, pas de fumée

    /* canvas à 1/3 de la taille CSS : pixels ~3px affichés, échelle trame */
    let W = 0;
    let H = 0;
    let seeded = false;
    const wisps: Wisp[] = [];

    const newWisp = (): Wisp => ({
      x: Math.random() * W,
      y: H + 2,
      v: 0.55 + Math.random() * 0.45,
      sway: 0.4 + Math.random() * 0.5,
      f: 0.1 + Math.random() * 0.12,
      seed: Math.random() * 6.283,
      age: 0,
    });

    /* Peuple la colonne d'ascension à toutes les hauteurs dès le chargement —
       sinon il faut plusieurs secondes pour que les premières cendres, nées
       tout en bas, remontent jusqu'à devenir visibles (prototype validé). */
    const seedWisps = () => {
      const CEIL = H / 3;
      const n = (DENSITY * H) / 2 | 0;
      for (let i = 0; i < n; i++) {
        const w = newWisp();
        w.y = CEIL + Math.random() * (H - CEIL);
        w.age = ((H - w.y) / w.v) | 0;
        wisps.push(w);
      }
    };

    const fit = () => {
      const r = img.getBoundingClientRect();
      if (!r.width) return;
      W = Math.round(r.width / 3);
      H = Math.round(r.height / 3);
      cv.width = W;
      cv.height = H;
      if (!seeded && W > 0 && H > 0) {
        seeded = true;
        seedWisps();
      }
    };
    const ro = new ResizeObserver(fit);
    ro.observe(img);
    if (img.decode) img.decode().then(fit).catch(fit);
    else img.addEventListener("load", fit);

    /* respiration : montée/descente par paliers entiers */
    let bIdx = 0;
    let bAcc = 0;

    const step = () => {
      bAcc += TICK;
      if (bAcc >= BSTEP) {
        bAcc -= BSTEP;
        bIdx = (bIdx + 1) % BREATH.length;
        img.style.transform = `translateY(${BREATH[bIdx]}px)`;
      }
      for (let i = 0; i < DENSITY; i++) wisps.push(newWisp());
      const CEIL = H / 3; /* les cendres meurent aux 2/3 de la montée */
      for (let i = wisps.length - 1; i >= 0; i--) {
        const s = wisps[i];
        s.age++;
        s.y -= s.v;
        if (s.y <= CEIL) wisps.splice(i, 1);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = CHARBON;
      for (const s of wisps) {
        /* raréfaction en approchant de la ligne des 2/3 : de plus en plus de
           cendres « sautent » des frames, puis plus rien — jamais d'alpha */
        const fade = Math.min(1, (s.y - H / 3) / (H * 0.28));
        if (Math.random() > 0.15 + fade * 0.85) continue;
        const x = (s.x + Math.sin(s.age * s.f + s.seed) * s.sway * 3) | 0;
        ctx.fillRect(x, s.y | 0, 1, 1); /* carré de 1px, strictement */
      }
    };

    let acc = 0;
    let last = 0;
    let raf = 0;
    const loop = (t: number) => {
      if (!last) last = t;
      acc += t - last;
      last = t;
      while (acc >= TICK) {
        acc -= TICK;
        step();
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative h-[368px] shrink-0 overflow-hidden bg-[var(--color-accent)]">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated" }}
        aria-hidden
      />
      {/* L'image (1560×1720) est plus haute que le héros : posée en haut,
          le bas du buste est coupé par la frontière charbon (maquette).
          position:relative + z-2 : elle passe DEVANT le canvas et le sol. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        alt=""
        src="assets/geolier_detoure.png"
        className="relative z-[2] mt-[40px] block w-full select-none"
        style={{ imageRendering: "pixelated", transform: "translateY(0)" }}
      />
      {/* sol charbon : couvre la bande révélée sous l'image quand elle monte */}
      <div className="absolute inset-x-0 bottom-0 z-[1] h-[4px] bg-[var(--color-bg)]" aria-hidden />
    </div>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<"boot" | "home" | "game">("boot");
  const [saved, setSaved] = useState(false);
  const [overlay, setOverlay] = useState<"reliques" | "registre" | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du localStorage impossible au rendu SSR, une seule fois au montage
    setSaved(hasSavedRun());
    setPhase("home");
  }, []);

  if (phase === "game") return <Scene />;

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div className="phone-frame relative flex h-[800px] max-h-[100dvh] w-[390px] shrink-0 flex-col overflow-clip bg-[var(--color-bg)]">
        {phase === "home" && (
          <>
            <HeroGeolier />

            {/* Panneau charbon : marque, tagline, CTA, liens */}
            <div className="flex flex-1 flex-col items-center px-[24px] pt-[34px]">
              <h1
                className="text-[46px] leading-none tracking-[8px] text-[var(--color-ink)]"
                style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400 }}
              >
                PACTUM
              </h1>
              <p className="mt-[14px] text-center font-mono text-[12px] leading-[1.7] tracking-[0.5px] text-white/50">
                {saved ? (
                  <>
                    Aucune partie ne se ressemble.
                    <br />
                    Aucune mort n&apos;est gratuite.
                  </>
                ) : (
                  <>
                    Tu choisis. Le dé décide.
                    <br />
                    Lui, il regarde.
                  </>
                )}
              </p>

              <div className="mt-[28px] flex w-[298px] flex-col gap-[12px]">
                {saved ? (
                  <>
                    <HomeCta label="REPRENDRE" onClick={() => setPhase("game")} />
                    <HomeCta
                      secondary
                      label="RECOMMENCER"
                      onClick={() => {
                        resetRun();
                        setPhase("game");
                      }}
                    />
                  </>
                ) : (
                  <HomeCta label="COMMENCER" onClick={() => setPhase("game")} />
                )}
              </div>

              {/* Liens de pied — OPTIONS inerte (écran pas encore designé) */}
              <div className="mt-auto flex flex-col items-center gap-[14px] pb-[26px]">
                {saved && (
                  <>
                    <FooterLink label="RELIQUES" onClick={() => setOverlay("reliques")} />
                    <FooterLink label="GRAND REGISTRE" onClick={() => setOverlay("registre")} />
                  </>
                )}
                <FooterLink label="OPTIONS" disabled />
              </div>
            </div>

            {overlay && <HomeOverlay kind={overlay} onClose={() => setOverlay(null)} />}
          </>
        )}
      </div>
    </main>
  );
}

/**
 * CTA de l'accueil = composant Figma « Group 36720 / 36692 » (maquettes
 * 1963:370 / 1970:458), reproduit tel quel : 298×46, texte Roboto Mono
 * Medium 14px espacé 2.8px, entailles de coins charbon (2px). Primaire =
 * bloc orange plein texte charbon ; secondaire = contour orange, texte
 * orange, fond transparent. Pas de segments décalés ici — la maquette prime.
 */
function HomeCta({ label, secondary, onClick }: { label: string; secondary?: boolean; onClick: () => void }) {
  // Structure = calques du composant Figma (et de ChoiceButton en jeu) :
  // fond + bordure en calques enfants inset-0, puis les carrés de coin 2×2
  // charbon posés PAR-DESSUS, au ras exact du coin (0,0) — jamais une
  // bordure CSS sur le bouton lui-même, qui décalerait les entailles de 1px.
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative h-[46px] w-full cursor-pointer border-none bg-transparent font-mono text-[14px] font-medium uppercase tracking-[2.8px] ${
        secondary ? "text-[var(--color-accent)] active:text-[var(--color-bg)]" : "text-[var(--color-bg)]"
      }`}
    >
      <span
        className={`absolute inset-0 border border-solid border-[var(--color-accent)] group-active:bg-white ${
          secondary ? "bg-transparent" : "bg-[var(--color-accent)]"
        }`}
        aria-hidden
      />
      {/* Entailles de coins 2×2 (charbon du fond), au ras du coin */}
      <span className="pointer-events-none absolute top-0 left-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="pointer-events-none absolute bottom-0 left-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="pointer-events-none absolute top-0 right-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="pointer-events-none absolute bottom-0 right-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="relative">{label}</span>
    </button>
  );
}

function FooterLink({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`font-mono text-[11px] uppercase tracking-[3px] text-[var(--color-ink)] ${
        disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer opacity-90"
      }`}
    >
      {label}
    </button>
  );
}

/** Plein cadre charbon (jamais une popup — spec §8) : Reliques ou Registre. */
function HomeOverlay({ kind, onClose }: { kind: "reliques" | "registre"; onClose: () => void }) {
  const mem = loadMemory();
  const run = loadRun();
  return (
    <div className="absolute inset-0 z-[9] flex flex-col bg-[var(--color-bg)]">
      <div className="flex items-center justify-between px-[15px] py-[11px]">
        <span className="text-[12px] font-medium uppercase tracking-[2.4px] text-[var(--color-ink)]">
          {kind === "reliques" ? "Reliques" : "Grand Registre"}
        </span>
        <CloseX onClose={onClose} />
      </div>
      <div className="flex-1 overflow-y-auto px-[17px] pb-[24px]">
        {kind === "reliques" ? (
          mem.relics.length === 0 ? (
            <p className="mt-[18px] text-[13px] leading-[1.4] text-[var(--color-ink)] opacity-60">
              Aucune relique. Elles se forgent d&apos;une mort — la tienne.
            </p>
          ) : (
            <div className="mt-[12px] flex flex-col gap-[12px]">
              {mem.relics.map((r, i) => (
                <div key={`${r.name}-${i}`} className="flex items-center gap-[13px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src="assets/objet_masque.png" className="size-[54px] border border-solid border-[var(--color-ink)]/30" style={{ imageRendering: "pixelated" }} />
                  <div>
                    <p className="text-[13px] text-[var(--color-ink)]">{r.name}</p>
                    <p className="text-[11px] uppercase tracking-[1px] text-[var(--color-accent)]">
                      {r.rarity} — {r.heroName}, J{r.days}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="registre mx-[-17px]">
            <p className="registre-head">— LE GRAND REGISTRE —</p>
            <div className="registre-list">
              {buildRegistre(mem, run.heroName, run.day).map((r) => (
                <div key={`${r.rank}-${r.name}`} className={`registre-row ${r.isPlayer ? "is-player" : ""}`}>
                  <span className="registre-rank">{r.rank}</span>
                  <span className="registre-name">{r.name}</span>
                  <span className="registre-days">J{r.days}</span>
                  <span className="registre-cause">{r.cause}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Croix de fermeture pixel (Figma Group 15) — réutilisée par le menu. */
export function CloseX({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Fermer"
      onClick={onClose}
      className="relative size-[32px] cursor-pointer border border-solid border-[var(--color-ink)] bg-transparent"
    >
      <span className="absolute top-1/2 left-1/2 h-px w-[16px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[var(--color-ink)]" aria-hidden />
      <span className="absolute top-1/2 left-1/2 h-px w-[16px] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[var(--color-ink)]" aria-hidden />
    </button>
  );
}
