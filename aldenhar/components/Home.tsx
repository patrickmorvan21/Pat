"use client";

import { useEffect, useState } from "react";
import Scene from "@/components/Scene";
import { HeroGeolier } from "@/components/HeroGeolier";
import Prologue from "@/components/Prologue";
import Intro, { ActeScreen } from "@/components/Intro";
import Registre from "@/components/Registre";
import { loadMemory, mutateMemory, shouldShowIntro } from "@/lib/player-memory";
import { pickJailerQuote } from "@/lib/jailer-quotes";
import { hasSavedRun, loadRun, resetRun } from "@/lib/state";
import { lieuNom } from "@/lib/scene-data";
import { APP_VERSION } from "@/lib/version";
import { applySettingsToDom } from "@/lib/settings";
import { demoActive, initDemoFromUrl } from "@/lib/demo";
import { armAudio, playMusic } from "@/lib/audio";
import { OptionsTab } from "@/components/GameMenu";
import { BoutonNav } from "@/components/NavIcons";
import { assetUrl } from "@/lib/assets";
import Reliques from "@/components/Reliques";
import Codex from "@/components/Codex";

/**
 * Écrans d'accueil (Figma 1963:370 « Première partie » / 1970:458 « Reprendre
 * partie », 15/07 soir) : héros = le Geôlier détouré sur fond ORANGE plein,
 * animé (respiration + cendres) selon le prototype validé
 * `accueil_geolier_v5.html` ; dessous, panneau CHARBON : PACTUM (Instrument
 * Serif), tagline, CTA à segments décalés, liens en pied.
 * OPTIONS n'est pas encore designé : lien présent mais inerte.
 */

export default function Home() {
  const [phase, setPhase] = useState<"boot" | "home" | "intro" | "prologue" | "acte" | "game">(
    "boot",
  );
  const [saved, setSaved] = useState(false);
  /** Le mode démo se VOIT (« v1.94.1 · démo ») — sans ce marqueur, impossible
      de savoir depuis l'accueil si le drapeau a pris (constat Patrick 24/08). */
  const [demoOn, setDemoOn] = useState(false);
  // Le compte a-t-il un passé (reliques forgées ou héros tombés) ? Distinct
  // de `saved` : une run peut ne plus exister alors que le passé, lui, reste.
  const [aDuPasse, setADuPasse] = useState(false);
  const [citation, setCitation] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<"reliques" | "registre" | "codex" | "options" | null>(null);
  const [aDuCodex, setADuCodex] = useState(false);
  const [reprise, setReprise] = useState<string[] | null>(null);

  useEffect(() => {
    // Mode démo (script 24/08) : `?demo=1` dans l'URL pose le drapeau — un
    // testeur reçoit un LIEN, pas une procédure. Lu avant tout le reste.
    initDemoFromUrl();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- miroir du drapeau localStorage, une seule fois au montage (illisible au rendu SSR)
    setDemoOn(demoActive());
    // Réglages (Options 21/07) : applique taille de texte + animations réduites
    // au <html> dès le démarrage de l'app (persiste à travers accueil/jeu).
    applySettingsToDom();
    // Musique (24/07) : thème d'intro sur l'accueil — armé sur le premier
    // geste (politique d'autoplay), silencieux si les mp3 manquent.
    armAudio();
    playMusic("intro");
    setSaved(hasSavedRun());
    const m0 = loadMemory();
    setADuPasse(m0.relics.length > 0 || m0.fallen.length > 0);
    setADuCodex(Object.keys(m0.codex ?? {}).length > 0);
    // Rappel de contexte sous « Reprendre » (spec 4/08 A1) : une vie en cours
    // donne envie d'y retourner — un bouton nu est abstrait. Nom · Jour, puis
    // Acte · lieu courant. En plein Seuil, on dit juste où on en est.
    if (hasSavedRun()) {
      const run = loadRun();
      setReprise(
        run.prologue && !run.prologue.done
          ? ["Au Seuil — le pacte n'est pas signé"]
          : [
              `${run.heroName} · Jour ${run.day}`,
              // « Les Landes » = la ZONE (toute la prose du jeu la nomme
              // ainsi) ; « Les Lisières » reste le nom de l'ACTE sur son
              // carton (Figma). Le rappel parle du lieu où l'on est, donc de
              // la zone — mélanger les deux ici perdait le joueur (7/08).
              `Les Landes · ${lieuNom(run.trav?.current)}`,
            ]
      );
    }
    // La citation du Geôlier devient variable (30/07) : dès la première mort,
    // la tagline de l'accueil est SA voix — tirée du pool conditionné par le
    // contexte de la dernière mort, jamais deux fois la même de suite.
    const mem = loadMemory();
    // La voix du Geôlier dès qu'il y a un PASSÉ — une mort OU une traversée
    // réussie (7/08 : un survivant sans aucune mort mérite aussi son accueil).
    if (mem.deaths > 0 || (mem.zonesCleared ?? 0) > 0) {
      const now = Date.now();
      const joursHorsJeu = mem.lastPlayedAt
        ? Math.floor((now - mem.lastPlayedAt) / 86_400_000)
        : 0;
      const ld = mem.lastDeath;
      setCitation(
        pickJailerQuote({
          morts: mem.deaths,
          jour: ld?.day ?? 0,
          acte: ld?.acte ?? 1,
          fixation: ld?.fixation ?? false,
          rareteRare: ld ? ld.rarity !== "commune" : false,
          classe: ld?.classed ?? false,
          joursHorsJeu,
          meilleurScore: ld?.meilleurScore ?? false,
          traversee: mem.derniereFinTraversee ?? false,
        })
      );
      mutateMemory((m) => {
        m.lastPlayedAt = now;
      });
    }
    setPhase("home");
  }, []);

  /**
   * Toute entrée en partie passe par le Seuil tant qu'il n'est pas rendu —
   * y compris une reprise en plein prologue (§9, reprise exacte).
   *
   * L'ordre complet d'une PREMIÈRE partie : intro (les 4 clauses) → Seuil →
   * écran d'acte → zone. Une reprise saute droit au jeu, et une run neuve sur
   * un compte qui a déjà lu l'intro démarre au Seuil.
   */
  function enterGame() {
    if (loadRun().prologue.done) {
      setPhase("game");
      return;
    }
    setPhase(shouldShowIntro() ? "intro" : "prologue");
  }

  if (phase === "game") return <Scene />;
  if (phase === "intro") return <Intro onDone={() => setPhase("prologue")} />;
  // Mode démo (script 24/08, segment 0) : pas de carton d'acte — le Seuil
  // débouche droit sur la Borne, le premier geste avant la minute 2.
  if (phase === "prologue")
    return <Prologue onDone={() => setPhase(demoActive() ? "game" : "acte")} />;
  // Nommer l'acte juste après le scellement du pacte, avant la première scène.
  if (phase === "acte") return <ActeScreen onDone={() => setPhase("game")} />;

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
              <img alt="PACTUM" src={assetUrl("assets/pactum_logo.png")} className="block w-[197px] select-none" />
              {/* La tagline (maquette 2333-7029 : mono 13, blanc) — remplacée
                  par la voix du Geôlier dès la première mort (30/07). */}
              <p className="mt-[14px] text-center font-mono text-[13px] leading-[1.5] text-[var(--color-ink)]">
                {citation ? (
                  citation
                ) : saved ? (
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
                    {reprise && (
                      <div className="pointer-events-none -mt-[4px] text-center font-mono text-[10px] leading-[1.6] tracking-[1px] text-[var(--color-ink)] opacity-50">
                        {reprise.map((l) => (
                          <div key={l}>{l}</div>
                        ))}
                      </div>
                    )}
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
                {/* ⚠️ Ces deux écrans lisent la MÉMOIRE DU COMPTE, pas la run.
                    Les conditionner à `saved` les rendait inaccessibles juste
                    après une mort — le moment exact où le joueur vient de
                    découvrir sa relique et veut la revoir. */}
                {aDuPasse && (
                  <>
                    <FooterLink label="RELIQUES" onClick={() => setOverlay("reliques")} />
                    <FooterLink label="GRAND REGISTRE" onClick={() => setOverlay("registre")} />
                  </>
                )}
                {/* LE CODEX (spec 20/08) : ordre verrouillé Reliques · Grand
                    Registre · Codex · Options — juste avant Options. Visible
                    dès qu'une entrée existe (la Borne se débloque au premier
                    pas de la première vie). */}
                {aDuCodex && <FooterLink label="CODEX" onClick={() => setOverlay("codex")} />}
                <FooterLink label="OPTIONS" onClick={() => setOverlay("options")} />
              </div>
            </div>

            {/* Le Grand Registre a son propre écran plein cadre depuis le
                26/07 (maquette 2265:24560) — les deux autres restent en
                overlay simple. */}
            {overlay === "registre" ? (
              <Registre
                heroName={loadRun().heroName}
                playerDays={loadRun().day}
                onClose={() => setOverlay(null)}
              />
            ) : overlay === "codex" ? (
              <Codex onClose={() => setOverlay(null)} />
            ) : overlay === "reliques" ? (
              /* L'écran DESCENTE / RELIQUAIRE (spec 20/08, Figma 2496:4745).
                 Révocable jusqu'au DÉPART en run : une partie engagée scelle
                 la Descente (lecture seule) — elle se rouvre à la prochaine
                 incarnation. */
              <Reliques onClose={() => setOverlay(null)} verrouille={saved} />
            ) : (
              overlay && <HomeOverlay kind={overlay} onClose={() => setOverlay(null)} />
            )}
          </>
        )}

        {/* Numéro de version — bas à droite du cadre, blanc opacité 50 %.
            Repère de déploiement (demande Patrick 20/07) : source unique dans
            lib/version.ts, bumpée selon la grandeur du changement.
            Masqué dès qu'un écran plein cadre est ouvert : il se posait par
            dessus le Registre (vu au test du 26/07). */}
        {!overlay && (
          <span className="app-version" aria-hidden>
            v{APP_VERSION}
            {demoOn ? " · démo" : ""}
          </span>
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
        secondary ? "text-[var(--color-accent)]" : "text-[var(--color-bg)]"
      }`}
    >
      {/* Pas d'état hover/active blanc (retour Patrick 16/07) : le bouton
          reste identique au repos, au survol et au clic. */}
      <span
        className={`absolute inset-0 border border-solid border-[var(--color-accent)] ${
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
  // Maquette 2333-7029 : mono 13, blanc plein, espacement 2.6px.
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`font-mono text-[13px] uppercase tracking-[2.6px] text-[var(--color-ink)] ${
        disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"
      }`}
    >
      {label}
    </button>
  );
}

/** Plein cadre charbon (jamais une popup — spec §8). Depuis le 20/08, seules
    les OPTIONS passent encore ici : le Registre (26/07) et les Reliques
    (écran Descente/Reliquaire) ont chacun leur écran dédié. */
function HomeOverlay({ kind, onClose }: { kind: "options"; onClose: () => void }) {
  void kind;
  return (
    <div className="absolute inset-0 z-[9] flex flex-col bg-[var(--color-bg)]">
      {/* La croix descend sous la barre iOS (safe-area) — même hauteur que
          le menu en jeu (retour Patrick 21/08). */}
      <div className="flex items-center justify-between px-[15px] pb-[11px] pt-[calc(env(safe-area-inset-top,0px)+11px)]">
        <span className="text-[12px] font-medium uppercase tracking-[2.4px] text-[var(--color-ink)]">
          Options
        </span>
        <CloseX onClose={onClose} />
      </div>
      <div className="flex-1 overflow-y-auto pb-[24px]">
        <OptionsTab />
      </div>
    </div>
  );
}

/** Croix de fermeture — CSS propre depuis le 21/08 (décision Patrick : les
    assets pixel rendaient un glyphe illisible). Réutilisée partout. */
export function CloseX({ onClose }: { onClose: () => void }) {
  return <BoutonNav icone="croix" onClick={onClose} label="Fermer" />;
}
