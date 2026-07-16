"use client";

import { useEffect, useState } from "react";
import Scene from "@/components/Scene";
import { HeroGeolier } from "@/components/HeroGeolier";
import Prologue from "@/components/Prologue";
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

export default function Home() {
  const [phase, setPhase] = useState<"boot" | "home" | "prologue" | "game">("boot");
  const [saved, setSaved] = useState(false);
  const [overlay, setOverlay] = useState<"reliques" | "registre" | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du localStorage impossible au rendu SSR, une seule fois au montage
    setSaved(hasSavedRun());
    setPhase("home");
  }, []);

  /** Toute entrée en partie passe par le Seuil tant qu'il n'est pas rendu —
      y compris une reprise en plein prologue (§9, reprise exacte). */
  function enterGame() {
    setPhase(loadRun().prologue.done ? "game" : "prologue");
  }

  if (phase === "game") return <Scene />;
  if (phase === "prologue") return <Prologue onDone={() => setPhase("game")} />;

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div className="phone-frame relative flex h-[800px] max-h-[100dvh] w-[390px] shrink-0 flex-col overflow-clip bg-[var(--color-bg)]">
        {phase === "home" && (
          <>
            <HeroGeolier />

            {/* Panneau charbon : marque, tagline, CTA, liens */}
            <div className="flex flex-1 flex-col items-center px-[24px] pt-[34px]">
              {/* Logo PACTUM — asset HD (1720×270, transparent) fourni par Patrick,
                  même tracé que la maquette (Figma 1963:425 / 1970:483). Downscale
                  lissé standard (pas de pixelated) : la source est bien plus
                  définie que l'affichage, contrairement aux textures tramées 1:1. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="PACTUM" src="assets/pactum_logo.png" className="block w-[197px] select-none" />
              <p className="mt-[14px] text-center font-mono text-[12px] leading-[1.7] tracking-[0.5px] text-[var(--color-ink)]">
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
                    <HomeCta label="REPRENDRE" onClick={enterGame} />
                    <HomeCta
                      secondary
                      label="RECOMMENCER"
                      onClick={() => {
                        resetRun();
                        enterGame();
                      }}
                    />
                  </>
                ) : (
                  <HomeCta label="COMMENCER" onClick={enterGame} />
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
