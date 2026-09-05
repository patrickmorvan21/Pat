"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CloseX } from "@/components/Home";
import { forgetIntro, forgeRelic, loadMemory, reliquesPortees, type Relic } from "@/lib/player-memory";
import { loadRun, resetRun, RUN_KEY, type NarrativeEffect, type RunState } from "@/lib/state";
import Prologue from "@/components/Prologue";
import Credo from "@/components/Credo";
import { ActeScreen } from "@/components/Intro";
import RadarEssence from "@/components/RadarEssence";
import { besaceBySlot, normalizeItem, type BesaceItem } from "@/lib/besace";
import TagRarete from "@/components/TagRarete";
import { loadSettings, mutateSettings, reinitialiserAides, type Settings } from "@/lib/settings";
import DeathScreen, { bilanDeMort, type Bilan } from "@/components/DeathScreen";
import { assetUrl, assetExiste } from "@/lib/assets";
import { reliqueIllustration } from "@/lib/reliques";
import { etatsActifs } from "@/lib/etats";

/**
 * Menu plein cadre (spec §8 + écrans Figma 1925:559 « Essence » et 1925:524
 * « Inventaire », passe de fidélité 14/07 soir). Jamais une popup : il
 * recouvre tout le cadre. Onglets STATS · INVENTAIRE · OPTIONS — actif en
 * crème, inactifs en orange (maquette). Options (Figma 2137:406) désormais
 * fonctionnel : Apparition/Taille du texte, Animations, Vibrations, Réafficher
 * les aides, Effacer la progression (les features pas encore construites —
 * Musique, Lecture vocale — sont grisées à 50 %).
 *
 * NB Figma : le texte de Geryon affiché sous « Dague simple » dans la maquette
 * Inventaire est un mauvais mapping (confirmé par Patrick) — ici c'est le
 * flavor réel de l'objet sélectionné qui s'affiche.
 */

type Tab = "stats" | "inventaire" | "options";

/** Icône générique des Reliques (l'ancien `objet_masque.png` faisait 68×68). */
const RELIC_ICON = "assets/objet_couronne_brisee_b_b.png";

/** L'illustration propre d'une relique, sinon l'icône générique (6/08). */
function relicIcon(r: { relicId?: string; name: string }): string {
  return reliqueIllustration(r.relicId ?? r.name, assetExiste) ?? RELIC_ICON;
}

/**
 * Repli par `kind` quand un objet n'a pas d'icône propre.
 *
 * ⚠️ Les anciens repli (`objet_dague/crane/masque.png`) étaient les exports
 * Figma du 14/07 en **68×68** — d'où les icônes visiblement pâteuses signalées
 * par Patrick le 26/07. Remplacés par les vraies icônes tramées 1000×1000 :
 * une lame pour les armes, une fiole pour les soins, un grimoire pour les
 * babioles (le crâne lisait comme « mort », pas comme « objet trouvé »).
 */
const BESACE_ICONS: Record<BesaceItem["kind"], string> = {
  arme: "assets/objet_dague_os_b_b.png",
  soin: "assets/objet_fiole_baume_b_b.png",
  babiole: "assets/objet_grimoire_b_b.png",
};

/** Icône d'un objet : son PNG réel (objets des Landes) sinon l'icône générique par type. */
function itemIcon(it: BesaceItem): string {
  return it.illustration ?? BESACE_ICONS[it.kind];
}

/** Fiche d'affichage des états narratifs (images HD du Drive 4_Etats). */
const ETAT_DISPLAY: Record<
  NarrativeEffect["id"],
  { name: string; desc: string; img: string | null }
> = {
  aguerri: {
    name: "Aguerri",
    desc: "Le prochain coup porté sera plus sûr.",
    img: "assets/etat_aguerri.png",
  },
  entaille: {
    name: "Entaillé",
    desc: "La blessure ralentit chaque geste, tant qu'elle n'est pas soignée.",
    img: "assets/etat_entaille.png",
  },
  ebranle: { name: "Ébranlé", desc: "Les mains tremblent encore.", img: null },
};

/**
 * La liste d'Essence = les états du 5/08 D'ABORD, puis les effets hérités.
 *
 * ⚠️ C'est ici que se tient la promesse du PLAFOND D'AFFICHAGE : le bandeau de
 * jeu n'en montre que trois, « les autres restent actifs et consultables dans
 * l'écran Essence ». Sans cette liste, un quatrième état existerait sans que
 * le joueur puisse jamais le lire.
 *
 * La fiche est dérivée de `lib/etats.ts` (nom + manifestation), jamais
 * recopiée : deux tables qui décrivent le même état divergeraient.
 */
type FicheEtat = { key: string; name: string; desc: string; img: string | null; positive: boolean };

function fichesEtats(run: RunState): FicheEtat[] {
  const nouveaux = etatsActifs(
    Object.values(run.faits ?? {})
      .filter((f) => f.kind === "state")
      .map((f) => f.id)
  ).map((e): FicheEtat => ({
    key: e.id,
    name: e.nom,
    // La manifestation dit ce que ça FAIT au héros — c'est la description
    // juste, et elle est déjà écrite. Le hint mécanique reste sous l'anneau.
    desc: e.manifestation,
    img: assetExiste(`assets/etat_${e.id}.png`) ? `assets/etat_${e.id}.png` : null,
    positive: e.groupe === "faveur",
  }));
  const anciens = run.effects.map((e): FicheEtat => {
    const d = ETAT_DISPLAY[e.id];
    return { key: e.id, name: d.name, desc: d.desc, img: d.img, positive: e.delta > 0 };
  });
  return [...nouveaux, ...anciens];
}

export default function GameMenu({
  run,
  onClose,
  onUse,
}: {
  run: RunState;
  onClose: () => void;
  /** Utiliser un actif depuis la Besace (spec 21/07 point 4) — consommé côté
      run par le parent (Scene) pour garder l'état synchronisé. */
  onUse?: (item: BesaceItem) => void;
}) {
  const [tab, setTab] = useState<Tab>("stats");
  const memory = useMemo(() => loadMemory(), []);

  return (
    <div className="absolute inset-0 z-[8] flex flex-col bg-[var(--color-bg)]">
      {/* La croix occupe EXACTEMENT la position du burger de l'écran de jeu
          (top 11px / right 10px, 32×32) — aucun décalage à l'ouverture
          (retour Patrick 16/07). */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+11px)] right-[10px] z-[1]">
        <CloseX onClose={onClose} />
      </div>

      {/* Onglets — actif crème, inactifs orange (Figma) */}
      <div className="flex items-center justify-center gap-[16px] pt-[59px] pb-[16px]">
        <TabLink label="STATS" active={tab === "stats"} onClick={() => setTab("stats")} />
        <Diamond />
        <TabLink label="INVENTAIRE" active={tab === "inventaire"} onClick={() => setTab("inventaire")} />
        <Diamond />
        <TabLink label="OPTIONS" active={tab === "options"} onClick={() => setTab("options")} />
      </div>

      <div className="flex-1 overflow-y-auto pb-[24px]">
        {tab === "stats" ? (
          <EssenceTab run={run} />
        ) : tab === "inventaire" ? (
          <InventaireTab run={run} relics={memory.relics} onUse={onUse} />
        ) : (
          <OptionsTab />
        )}
      </div>
    </div>
  );
}

function TabLink({ label, active, disabled, onClick }: { label: string; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`font-mono text-[12px] uppercase tracking-[2.5px] ${
        disabled
          ? "cursor-not-allowed text-[var(--color-accent)] opacity-45"
          : active
            ? "cursor-pointer font-bold text-[var(--color-ink)]"
            : "cursor-pointer text-[var(--color-accent)]"
      }`}
    >
      {label}
    </button>
  );
}

function Diamond() {
  return <span className="block size-[4px] rotate-45 bg-[var(--color-accent)] opacity-70" aria-hidden />;
}

/**
 * En-tête de section (maquette) : petit filet depuis le bord GAUCHE du
 * device, libellé en casse de phrase, puis filet qui s'étire jusqu'au bord
 * DROIT du device — jamais arrêté à la marge (retour Patrick 14/07 soir).
 * À poser dans un conteneur SANS padding horizontal.
 */
function SectionHead({ label, inset }: { label: string; inset?: boolean }) {
  // `inset` (groupes Passifs/Actifs côte à côte, maquette 1925:524) : label
  // compact, sans le filet pleine largeur qui traverserait les deux colonnes.
  if (inset) {
    return (
      <span className="font-mono text-[13px] tracking-[0.5px] text-[var(--color-ink)] opacity-90">{label}</span>
    );
  }
  return (
    <div className="mb-[16px] flex w-full items-center">
      <span className="block h-px w-[7px] bg-[var(--color-ink)] opacity-55" aria-hidden />
      <span className="mx-[7px] font-mono text-[13px] tracking-[0.5px] text-[var(--color-ink)] opacity-90">{label}</span>
      <span className="block h-px flex-1 bg-[var(--color-ink)] opacity-55" aria-hidden />
    </div>
  );
}

/* ---------------------------------------------------------------- ESSENCE */

function EssenceTab({ run }: { run: RunState }) {
  const fiches = fichesEtats(run);
  return (
    <div className="pt-[24px]">
      <RadarEssence stats={run.stats} className="mt-[24px]" />

      <div className="mt-[44px]">
        <SectionHead label="États" />
        <div className="px-[15px]">
          {fiches.length === 0 ? (
            <p className="font-mono text-[12px] leading-[1.4] text-[var(--color-ink)] opacity-55">
              Aucun état. Le corps tient — pour l&apos;instant.
            </p>
          ) : (
            <div className="flex flex-col gap-[14px]">
              {fiches.map((d) => {
                const positive = d.positive;
                return (
                  <div key={d.key} className="flex items-center gap-[14px]">
                    {d.img && (
                      // Cadre orange sur les états négatifs, gris sur les
                      // positifs (maquette). Règle colorimétrique 14/07 :
                      // négatif = image telle quelle (orange), positif =
                      // désaturation complète (blanc/crème).
                      <span
                        className={`block shrink-0 border border-solid p-px ${
                          positive ? "border-[var(--color-ink)]/50" : "border-[var(--color-accent)]"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt=""
                          src={assetUrl(d.img)}
                          className="block size-[62px]"
                          style={{
                            imageRendering: "auto",
                            filter: positive ? "saturate(0) brightness(1.6)" : undefined,
                          }}
                        />
                      </span>
                    )}
                    <div>
                      <p
                        className={`font-mono text-[13px] tracking-[0.5px] ${
                          positive ? "text-[var(--color-ink)]" : "text-[var(--color-accent)]"
                        }`}
                      >
                        {d.name}
                      </p>
                      <p className="mt-[6px] font-mono text-[12px] leading-[1.5] text-[var(--color-ink)] opacity-60">{d.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-[34px]">
        <SectionHead label="Compétences" />
        {/* Pas encore de système de compétences : l'emplacement reprend la
            structure de la maquette (filet vertical à gauche), en état vide. */}
        <div className="mx-[15px] border-l border-solid border-[var(--color-ink)]/50 py-[2px] pl-[18px]">
          <p className="font-mono text-[12px] leading-[1.5] text-[var(--color-ink)] opacity-55">
            Rien encore. Certaines rencontres enseignent — si on leur survit.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ INVENTAIRE */

type Selected = { type: "besace"; id: string } | { type: "relic"; index: number };

function InventaireTab({
  run,
  relics: allRelics,
  onUse,
}: {
  run: RunState;
  relics: { name: string; rarity: string; heroName: string; days: number }[];
  onUse?: (item: BesaceItem) => void;
}) {
  // Les 3 slots de reliques montrent LA DESCENTE (spec 20/08) : ce que cette
  // vie porte réellement — plus « les 3 plus récentes » (règle du 22/07,
  // remplacée). Le choix se fait sur l'écran Reliques de l'accueil.
  const relics = reliquesPortees(loadMemory()).map((p) => p.relic);
  void allRelics;
  // Copie locale : « Utiliser » retire l'objet de l'affichage immédiatement, en
  // plus de le consommer côté run (via onUse) — les deux restent synchronisés.
  const [besace, setBesace] = useState<BesaceItem[]>(() => run.besace.map(normalizeItem));
  const passifs = besaceBySlot(besace, "passif");
  const actifs = besaceBySlot(besace, "actif");
  const [selected, setSelected] = useState<Selected>(() =>
    besace[0] ? { type: "besace", id: besace[0].id } : { type: "relic", index: 0 }
  );

  const item = selected.type === "besace" ? besace.find((i) => i.id === selected.id) : undefined;
  const relic = selected.type === "relic" ? relics[selected.index] : undefined;
  const detailImg = item ? itemIcon(item) : relic ? relicIcon(relic) : null;
  const detailName = item?.name ?? relic?.name ?? "—";
  const detailFlavor = item
    ? item.flavor
    : relic
      ? `Relique ${relic.rarity} — forgée de la mort de ${relic.heroName}, jour ${relic.days}.`
      : "";
  // La rareté se lit dans le TAG DA (retour Patrick 2/09 : « Passif tu peux
  // l'enlever, et commun le mettre avec notre DA comme les reliques »). Le
  // mot « Passif/Actif » ne s'affiche plus : le groupe où l'objet est rangé
  // le dit déjà, et « Utiliser » n'apparaît que sur un actif.
  const detailRarity = item ? item.rarity : relic ? relic.rarity : null;
  const canUse = Boolean(item && item.slot === "actif" && (item.heal || item.cure));

  function useSelected() {
    if (!item) return;
    onUse?.(item);
    const next = besace.filter((i) => i.id !== item.id);
    setBesace(next);
    setSelected(next[0] ? { type: "besace", id: next[0].id } : { type: "relic", index: 0 });
  }

  const slot = (it: BesaceItem | undefined, key: string) => {
    const isSel = it ? selected.type === "besace" && selected.id === it.id : false;
    return (
      <button
        key={key}
        type="button"
        disabled={!it}
        onClick={() => it && setSelected({ type: "besace", id: it.id })}
        className={`relative size-[74px] border border-solid ${
          isSel ? "border-white" : "border-[var(--color-ink)]/45"
        } ${it ? "cursor-pointer" : "cursor-default"}`}
      >
        {it ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={it.name} src={assetUrl(itemIcon(it))} className="block size-full" style={{ imageRendering: "pixelated" }} />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-mono text-[10px] uppercase tracking-[2px] text-[var(--color-ink)] opacity-45">
            VIDE
          </span>
        )}
      </button>
    );
  };

  return (
    /* ⚠️ MÊME FERRAGE QUE L'ÉCRAN RELIQUES (retour Patrick 25/08) : la fiche
       de l'objet est ferrée en HAUT, les groupes Passifs/Actifs/Reliques sont
       ferrés en BAS (`mt-auto` sur le premier d'entre eux). L'espace libre
       vit entre les deux. */
    <div className="flex min-h-full flex-col pt-[4px]">
      {/* Détail de l'objet sélectionné — icône tramée agrandie au pixel. */}
      <div className="mx-auto size-[276px]">
        {detailImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={assetUrl(detailImg)} className="block size-full" style={{ imageRendering: "pixelated" }} />
        )}
      </div>
      <div className="px-[17px]">
        <p
          className="mt-[14px] text-[32px] leading-[1.05] text-[var(--color-accent)]"
          style={{ fontFamily: '"Instrument Serif", serif' }}
        >
          {detailName}
          {detailRarity && (
            <span className="ml-[10px] inline-block align-middle">
              <TagRarete rarity={detailRarity} />
            </span>
          )}
        </p>
        <p className="mt-[10px] min-h-[34px] font-mono text-[13px] leading-[1.5] text-[var(--color-ink)] opacity-85">{detailFlavor}</p>
        {/* Utiliser — seulement sur un ACTIF (spec 21/07 point 4). */}
        {canUse && (
          <button
            type="button"
            onClick={useSelected}
            className="mt-[10px] border border-solid border-[var(--color-accent)] bg-transparent px-[16px] py-[7px] font-mono text-[12px] uppercase tracking-[2px] text-[var(--color-accent)]"
          >
            Utiliser
          </button>
        )}
      </div>

      {/* Deux groupes côte à côte (maquette 1925:524) : Passifs · Actifs. */}
      <div className="mt-auto mt-[26px] flex gap-[28px] px-[15px]">
        <div>
          <SectionHead label="Passifs" inset />
          <div className="mt-[10px] flex gap-[9px]">
            {[0, 1].map((i) => slot(passifs[i], `p${i}`))}
          </div>
        </div>
        <div>
          <SectionHead label="Actifs" inset />
          <div className="mt-[10px] flex gap-[9px]">
            {[0, 1].map((i) => slot(actifs[i], `a${i}`))}
          </div>
        </div>
      </div>

      <div className="mt-[28px]">
        <SectionHead label="Reliques" />
        <div className="px-[15px]">
          {relics.length === 0 ? (
            <p className="font-mono text-[12px] leading-[1.4] text-[var(--color-ink)] opacity-55">
              Aucune relique. Elles se forgent d&apos;une mort — la tienne.
            </p>
          ) : (
            <div className="flex flex-wrap gap-[9px]">
              {relics.map((r, i) => {
                const isSel = selected.type === "relic" && selected.index === i;
                return (
                  <button
                    key={`${r.name}-${i}`}
                    type="button"
                    onClick={() => setSelected({ type: "relic", index: i })}
                    className={`relative size-[74px] cursor-pointer border border-solid ${
                      isSel ? "border-white" : "border-[var(--color-ink)]/45"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={r.name} src={assetUrl(relicIcon(r))} className="block size-full" style={{ imageRendering: "pixelated" }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Onglet OPTIONS (Figma 2137:406). Seules les fonctionnalités RÉELLES sont
   interactives : Apparition, Taille, Animations, Vibrations, Réafficher les
   aides, Effacer la progression. Les autres (Musique, Lecture à haute voix,
   Vitesse de lecture, Restaurer mes achats, liens de pied) sont grisées à 50 %
   et inertes — Patrick 21/07 (« mets opacité 50 % sur celles pas encore là »).
   ═══════════════════════════════════════════════════════════════════════ */

function SegControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { v: T; label: string }[];
  value?: T;
  onChange?: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-[16px] flex gap-[11px]">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange?.(o.v)}
          className={`opt-seg ${value === o.v ? "on" : ""} ${disabled ? "disabled" : ""}`}
        >
          <span className="opt-seg-border" aria-hidden />
          <span className="opt-seg-notch" style={{ top: 0, left: 0 }} aria-hidden />
          <span className="opt-seg-notch" style={{ top: 0, right: 0 }} aria-hidden />
          <span className="opt-seg-notch" style={{ bottom: 0, left: 0 }} aria-hidden />
          <span className="opt-seg-notch" style={{ bottom: 0, right: 0 }} aria-hidden />
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function OptLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[13px] leading-[1.3] text-[var(--color-ink)]">{children}</p>;
}
function OptHelp({ children }: { children: React.ReactNode }) {
  return <p className="mt-[14px] font-mono text-[11px] leading-[1.3] text-[var(--color-ink)] opacity-50">{children}</p>;
}
function OptDivider() {
  return <div className="my-[24px] h-px w-full bg-[var(--color-ink)] opacity-20" aria-hidden />;
}

/** Aperçu de l'écran de mort (retour Patrick 30/07 : « je ne veux pas refaire
    le jeu jusqu'à ce que je meure pour voir si tout est ok »). Construit une
    séquence à partir de la run et de la mémoire RÉELLES pour rester
    représentatif, mais NE PERSISTE RIEN : ni `recordDeath` (deaths/relics/
    Registre inchangés), ni `resetRun` — un aller-retour sans trace, sauf la
    rotation normale des citations du Geôlier (même mécanisme qu'une vraie
    mort, effet cosmétique mineur assumé). */
type PreviewMort = {
  epitaph: string;
  day: number;
  bilan: Bilan;
  relic: Relic;
  heroName: string;
  cause: string;
  firstDeath: boolean;
};

const EPITAPH_APERCU = "Le sol se dérobe, et rien ne le retient.";

function buildPreviewMort(): PreviewMort {
  const run = loadRun();
  const mem = loadMemory();
  const heroName = run.heroName || "Cendre";
  const day = Math.max(1, run.day || 7);
  const firstDeath = mem.deaths === 0;
  return {
    epitaph: EPITAPH_APERCU,
    day,
    // Aperçu : les reliques portées sont celles de la Descente du compte,
    // telles quelles (rien n'est forgé ici).
    bilan: bilanDeMort(run, reliquesPortees(mem).map((p) => p.relic.name).join(" · ") || null),
    relic: forgeRelic(heroName, day, firstDeath),
    heroName,
    cause: "les Landes",
    firstDeath,
    // L'aperçu n'a pas de lieu de mort : la Colline aux Gibets fait office.
  };
}

/**
 * APERÇU DU PROLOGUE (demande Patrick 5/09 : « mets un aperçu du prologue pour
 * que je puisse le rejouer afin de voir les bugs »). Même philosophie que
 * l'aperçu de l'écran de mort : on rejoue la VRAIE séquence, et on ne laisse
 * aucune trace.
 *
 * Il couvre l'ouverture entière qui suit le pacte — le Seuil, le credo, le
 * carton d'acte — puis rend la main aux Options sans jamais entrer en jeu.
 * (Les quatre écrans du pacte, eux, se rejouent par « Revoir l'introduction ».)
 *
 * ⚠️ La différence avec l'aperçu de la mort, et tout le soin qu'il demande :
 * le Seuil PERSISTE à chaque beat. On sauvegarde donc la run en octets avant
 * d'ouvrir, et on la remet telle quelle à la fermeture — jamais un « à peu
 * près » reconstruit, qui perdrait un champ au passage.
 */
type EtapeApercu = "seuil" | "credo" | "acte" | null;

function restaurerRun(sauve: string | null): void {
  try {
    if (sauve === null) window.localStorage.removeItem(RUN_KEY);
    else window.localStorage.setItem(RUN_KEY, sauve);
  } catch {
    /* stockage indisponible : rien à restaurer, rien à casser */
  }
}

export function OptionsTab() {
  const [s, setS] = useState<Settings>(() => loadSettings());
  const [eraseArmed, setEraseArmed] = useState(false);
  const [aidesReset, setAidesReset] = useState(false);
  const [preview, setPreview] = useState<PreviewMort | null>(null);
  /** Aperçu du prologue : l'ouverture rejouée d'un bout à l'autre. */
  const [apercu, setApercu] = useState<EtapeApercu>(null);
  /** La run telle qu'elle était AVANT l'aperçu, en octets. `null` = il n'y en
      avait aucune ; le ref n'est jamais écrit pendant un rendu (React
      Compiler) mais seulement dans un gestionnaire ou un effet. */
  const runSauve = useRef<string | null>(null);
  const apercuOuvert = apercu !== null;

  /** ⚠️ FILET DE SÉCURITÉ — le Seuil ÉCRIT dans la run à chaque beat (il doit
      pouvoir reprendre là où on l'a laissé). Si l'app est fermée en plein
      aperçu, la partie du joueur serait donc remplacée par celle de l'aperçu.
      On restaure aussi sur `pagehide`, qui part au moment où la page s'en va
      (fermeture, rechargement, mise en arrière-plan iOS). La restauration est
      idempotente : la fermeture normale la refait sans dommage. */
  useEffect(() => {
    if (!apercuOuvert) return;
    const restaurer = () => restaurerRun(runSauve.current);
    window.addEventListener("pagehide", restaurer);
    return () => window.removeEventListener("pagehide", restaurer);
  }, [apercuOuvert]);

  function ouvrirApercu() {
    try {
      runSauve.current = window.localStorage.getItem(RUN_KEY);
    } catch {
      runSauve.current = null;
    }
    // Une run NEUVE, donc un Seuil neuf : nouveaux souvenirs, nouveau nom.
    // `resetRun` n'est utilisé ici que pour sa mécanique (écrire une run
    // fraîche) — rien n'est perdu, la précédente est restaurée à la fermeture.
    resetRun();
    setApercu("seuil");
  }

  function fermerApercu() {
    restaurerRun(runSauve.current);
    runSauve.current = null;
    setApercu(null);
  }

  function set<K extends keyof Settings>(k: K, v: Settings[K]) {
    setS(mutateSettings((d) => { d[k] = v; }));
  }

  function reafficherAides() {
    reinitialiserAides();
    setAidesReset(true);
  }

  function effacerProgression() {
    if (!eraseArmed) {
      setEraseArmed(true);
      return;
    }
    try {
      window.localStorage.removeItem("aldenhar-run");
      window.localStorage.removeItem("aldenhar-player");
    } catch {}
    // Une ardoise propre l'est aussi pour les aides (correctif 2/09).
    reinitialiserAides();
    window.location.reload();
  }

  return (
    <>
    <div className="px-[15px] pt-[8px]">
      {/* Musique, lecture à haute voix, vitesse de lecture : RETIRÉS des
          réglages (Patrick, 2/09). La musique est masquée dans lib/audio.ts
          (`MUSIQUE_ACTIVE`) en attendant les vraies pistes ; la synthèse
          vocale n'a jamais existé. */}
      {/* Texte — ACTIF */}
      <OptLabel>Apparition</OptLabel>
      <SegControl
        options={[{ v: "lente", label: "lente" }, { v: "normale", label: "normale" }, { v: "instantanee", label: "instantanée" }]}
        value={s.textReveal}
        onChange={(v) => set("textReveal", v)}
      />
      <div className="mt-[24px]">
        <OptLabel>Taille</OptLabel>
        <SegControl
          options={[{ v: "petit", label: "petit" }, { v: "normal", label: "normal" }, { v: "grand", label: "grand" }]}
          value={s.textSize}
          onChange={(v) => set("textSize", v)}
        />
      </div>

      <OptDivider />

      {/* Animations + Vibrations + Réafficher les aides — ACTIFS */}
      <OptLabel>Animations</OptLabel>
      <SegControl
        options={[{ v: "completes", label: "complètes" }, { v: "reduites", label: "réduites" }]}
        value={s.animations}
        onChange={(v) => set("animations", v)}
      />
      {/* Vibrations et Chronomètres : MASQUÉS (Patrick, 2/09). Les deux
          réglages vivent toujours dans le store (`vibrations`, `chronosOff`)
          avec leur défaut — seul l'affichage est retiré. */}
      <div className="mt-[24px]">
        <button type="button" onClick={reafficherAides} className="font-mono text-[13px] text-[var(--color-ink)] underline">
          Réafficher les aides
        </button>
        <OptHelp>{aidesReset ? "C'est fait — les aides réapparaîtront une fois chacune." : "Les conseils déjà masqués (l'aide du dé, les cartes « rangé dans le menu ») reviendront."}</OptHelp>
      </div>

      <OptDivider />

      {/* Données / progression */}
      <p className="font-mono text-[11px] leading-[1.4] text-[var(--color-ink)] opacity-70">
        Ta partie est enregistrée sur cet appareil, en continu. Fermer le jeu ne t&apos;a jamais tué. Seuls tes choix le peuvent.
      </p>
      <button type="button" disabled className="mt-[20px] block cursor-default font-mono text-[13px] text-[var(--color-ink)] opacity-50 underline">
        Restaurer mes achats
      </button>
      {/* Revoir l'intro SANS rien détruire — c'est ce qu'on veut quand on
          cherche juste à retester les clauses, alors qu'effacer la progression
          coûterait les reliques et le Registre. */}
      <div className="mt-[20px]">
        <button
          type="button"
          onClick={() => {
            forgetIntro();
            window.location.reload();
          }}
          className="font-mono text-[13px] text-[var(--color-ink)] underline"
        >
          Revoir l&apos;introduction
        </button>
        <OptHelp>Les quatre clauses du pacte se rejoueront à la prochaine partie. Ta progression est conservée.</OptHelp>
      </div>

      {/* Aperçu du prologue — l'ouverture rejouée, la run en cours mise de
          côté puis remise telle quelle. */}
      <div className="mt-[20px]">
        <button
          type="button"
          onClick={ouvrirApercu}
          className="font-mono text-[13px] text-[var(--color-ink)] underline"
        >
          Aperçu du prologue
        </button>
        <OptHelp>
          Rejoue le Seuil, le credo et le carton d&apos;acte, avec de nouveaux souvenirs. Ta
          partie en cours est mise de côté et remise à l&apos;identique — la croix, en haut à
          droite, referme à tout moment.
        </OptHelp>
      </div>

      {/* Aperçu de l'écran de mort — outil de vérification, aucune trace
          laissée (ni relique, ni entrée au Registre, ni mort comptée). */}
      <div className="mt-[20px]">
        <button
          type="button"
          onClick={() => setPreview(buildPreviewMort())}
          className="font-mono text-[13px] text-[var(--color-ink)] underline"
        >
          Aperçu de l&apos;écran de mort
        </button>
        <OptHelp>Rejoue la séquence sans compter de mort — pour vérifier le rendu, pas pour tester tes réflexes.</OptHelp>
      </div>

      <div className="mt-[20px]">
        <button type="button" onClick={effacerProgression} className="font-mono text-[13px] text-[var(--color-ink)] underline">
          {eraseArmed ? "Confirmer l'effacement ?" : "Effacer la progression"}
        </button>
        <OptHelp>Reliques, Grand Registre, fragments : tout disparaît. Le Geôlier ne t&apos;aura jamais connu.</OptHelp>
      </div>

      <OptDivider />

      {/* Liens de pied — INERTES */}
      <div className="flex flex-col gap-[14px] pb-[10px] opacity-50">
        {["Crédits", "Confidentialité & conditions", "Envoyer un retour"].map((l) => (
          <span key={l} className="font-mono text-[13px] text-[var(--color-ink)]">{l}</span>
        ))}
      </div>
    </div>
    {apercu && (
      <div className="absolute inset-0 z-[50]" data-apercu-prologue>
        {apercu === "seuil" && <Prologue onDone={() => setApercu("credo")} />}
        {apercu === "credo" && <Credo onDone={() => setApercu("acte")} />}
        {apercu === "acte" && <ActeScreen onDone={fermerApercu} />}
        {/* La croix du menu, à sa position habituelle : c'est déjà le geste
            « refermer un plein cadre » partout ailleurs, et elle évite de
            rester coincé au milieu d'une séquence qu'on ne veut pas finir. */}
        <div
          data-fermer-apercu
          className="absolute top-[calc(env(safe-area-inset-top,0px)+11px)] right-[10px] z-[60]"
        >
          <CloseX onClose={fermerApercu} />
        </div>
      </div>
    )}
    {preview && (
      <div className="absolute inset-0 z-[50]">
        <DeathScreen
          epitaph={preview.epitaph}
          day={preview.day}
          bilan={preview.bilan}
          relic={preview.relic}
          heroName={preview.heroName}
          cause={preview.cause}
          firstDeath={preview.firstDeath}
          // Aperçu : on referme, on ne recharge jamais la page (rien n'a été
          // détruit — la vraie mort, elle, `reload()` après `resetRun()`).
          onRestart={() => setPreview(null)}
        />
      </div>
    )}
    </>
  );
}
