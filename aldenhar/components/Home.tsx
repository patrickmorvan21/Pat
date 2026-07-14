"use client";

import { useEffect, useState } from "react";
import Scene from "@/components/Scene";
import { buildRegistre, loadMemory } from "@/lib/player-memory";
import { hasSavedRun, loadRun, resetRun } from "@/lib/state";

/**
 * Écrans d'accueil (Figma 1933:525 « Bienvenue en enfer » / 1928:424
 * « Bon retour... », lot 14/07) : fond ORANGE plein, marque PACTUM en tête,
 * titre en Instrument Serif, démon en bas. Les tags de stat visibles sur les
 * boutons dans Figma sont un bug de composant — volontairement ignorés.
 * OPTIONS n'est pas encore designé : lien présent mais inerte.
 */
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
      <div className="phone-frame relative flex h-[800px] max-h-[100dvh] w-[390px] shrink-0 flex-col overflow-clip bg-[var(--color-accent)]">
        {phase === "home" && (
          <>
            {/* Démon ancré en bas (l'orange de l'image = l'orange du fond) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              src="assets/accueil_demon.png"
              className="pointer-events-none absolute bottom-0 left-0 w-full select-none"
              style={{ imageRendering: "pixelated" }}
            />
            {/* Liseré charbon en bas de cadre (Figma Rectangle 136) */}
            <span className="absolute bottom-0 left-0 h-[6px] w-full bg-[var(--color-bg)]" aria-hidden />

            {/* Marque — logotype fourni par Patrick (14/07 soir) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="PACTUM"
              src="assets/pactum_logo.png"
              className="relative z-[1] mx-auto mt-[42px] h-[19px] w-auto select-none"
            />

            {/* Titre + boutons */}
            <div className="relative z-[1] mx-auto mt-[86px] w-[298px]">
              <h1
                className="text-center text-[44px] leading-[1.05] text-[var(--color-bg)]"
                style={{ fontFamily: '"Instrument Serif", serif' }}
              >
                {saved ? "Bon retour..." : (
                  <>
                    Bienvenue
                    <br />
                    en enfer
                  </>
                )}
              </h1>
              <div className="mt-[30px] flex flex-col gap-[9px]">
                {saved ? (
                  <>
                    <HomeButton filled label="REPRENDRE" onClick={() => setPhase("game")} />
                    <HomeButton
                      label="RECOMMENCER"
                      onClick={() => {
                        resetRun();
                        setPhase("game");
                      }}
                    />
                  </>
                ) : (
                  <HomeButton filled label="COMMENCER" onClick={() => setPhase("game")} />
                )}
              </div>
            </div>

            {/* Liens de pied — OPTIONS inerte (écran pas encore designé) */}
            <div className="absolute inset-x-0 bottom-[26px] z-[1] flex flex-col items-center gap-[14px]">
              {saved && (
                <>
                  <FooterLink label="RELIQUES" onClick={() => setOverlay("reliques")} />
                  <FooterLink label="GRAND REGISTRE" onClick={() => setOverlay("registre")} />
                </>
              )}
              <FooterLink label="OPTIONS" disabled />
            </div>

            {overlay && (
              <HomeOverlay kind={overlay} onClose={() => setOverlay(null)} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function HomeButton({ label, filled, onClick }: { label: string; filled?: boolean; onClick: () => void }) {
  // Même langage que les boutons de choix (coins entaillés 2px), décliné sur
  // fond orange : plein charbon (texte orange) ou simple filet charbon.
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-[46px] w-full cursor-pointer font-mono text-[12px] font-medium uppercase tracking-[3px] ${
        filled ? "bg-[var(--color-bg)] text-[var(--color-accent)]" : "border border-solid border-[var(--color-bg)] bg-transparent text-[var(--color-bg)]"
      }`}
    >
      <span className="absolute top-0 left-0 size-[2px] bg-[var(--color-accent)]" aria-hidden />
      <span className="absolute bottom-0 left-0 size-[2px] bg-[var(--color-accent)]" aria-hidden />
      <span className="absolute top-0 right-0 size-[2px] bg-[var(--color-accent)]" aria-hidden />
      <span className="absolute bottom-0 right-0 size-[2px] bg-[var(--color-accent)]" aria-hidden />
      {label}
    </button>
  );
}

function FooterLink({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      // Crème, pas charbon : les liens se posent sur le poitrail sombre du
      // démon — du charbon y serait illisible (écart assumé avec la maquette).
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
