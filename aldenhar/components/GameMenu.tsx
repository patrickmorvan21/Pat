"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CloseX } from "@/components/Home";
import { forgetIntro, loadMemory } from "@/lib/player-memory";
import type { NarrativeEffect, RunState } from "@/lib/state";
import { besaceBySlot, normalizeItem, RARITY_LABEL, type BesaceItem, type BesaceRarity } from "@/lib/besace";
import { loadSettings, mutateSettings, type Settings } from "@/lib/settings";
import { syncMusicSettings } from "@/lib/audio";

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
const RELIC_ICON = "assets/objet_couronne_brisee.png";

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
  arme: "assets/objet_dague_os.png",
  soin: "assets/objet_fiole_baume.png",
  babiole: "assets/objet_grimoire.png",
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
      <div className="absolute top-[11px] right-[10px] z-[1]">
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

const AXES = [
  { key: "instinct", label: "INSTINCT", dx: 0, dy: -1 },
  { key: "courage", label: "COURAGE", dx: 1, dy: 0 },
  { key: "ruse", label: "RUSE", dx: 0, dy: 1 },
  { key: "empathie", label: "EMPATHIE", dx: -1, dy: 0 },
] as const;

/**
 * Radar 4 axes (géométrie maquette : centre du cadre, rayon 101, guides en
 * losanges tiretés 202/126/46). Le remplissage reste un NUAGE DE PIXELS
 * tramés (référence image de Patrick, 14/07 — la maquette Figma montre un
 * aplat faute de pouvoir tramer, la référence collée prime pour le fill) :
 * dense au centre, qui s'effrite vers les bords. Jamais un dégradé CSS.
 */
function RadarCanvas({ run }: { run: RunState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 390;
    const H = 264;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const cx = W / 2;
    const cy = H / 2;
    const R = 101;
    ctx.clearRect(0, 0, W, H);

    // Croix des axes — légèrement plus longue que le grand losange (maquette)
    ctx.strokeStyle = "rgba(245, 240, 225, 0.30)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx + 0.5, cy - R - 4);
    ctx.lineTo(cx + 0.5, cy + R + 4);
    ctx.moveTo(cx - R - 4, cy + 0.5);
    ctx.lineTo(cx + R + 4, cy + 0.5);
    ctx.stroke();

    // Losanges-guides en tirets (3 niveaux : 202/126/46 → ratios maquette)
    ctx.setLineDash([3, 3]);
    for (const f of [1, 0.624, 0.228]) {
      const r = R * f;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Polygone des stats (échelle 1..5 du prologue) — sommets sur chaque axe
    const pts = AXES.map((a) => {
      const v = Math.max(0.05, Math.min(1, run.stats[a.key] / 5));
      return { x: cx + a.dx * v * R, y: cy + a.dy * v * R };
    });

    const inside = (x: number, y: number) => {
      let ok = true;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
        if (cross < 0) ok = false;
      }
      return ok;
    };
    let seed = (run.stats.courage * 131 + run.stats.ruse * 37 + run.stats.instinct * 17 + run.stats.empathie) >>> 0;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    // Distance normalisée au bord dans la direction du point (bissection) :
    // sert au fondu de densité (dense au centre → effrité au bord).
    const edgeT = (x: number, y: number) => {
      const dx = x - cx;
      const dy = y - cy;
      const len = Math.hypot(dx, dy);
      if (len < 1) return 0;
      let lo = 0;
      let hi = R * 1.2;
      for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2;
        if (inside(cx + (dx / len) * mid, cy + (dy / len) * mid)) lo = mid;
        else hi = mid;
      }
      return lo > 0 ? len / lo : 1;
    };
    ctx.fillStyle = "#e0632a";
    let placed = 0;
    let guard = 0;
    while (placed < 2200 && guard < 30000) {
      guard++;
      const x = cx + (rnd() * 2 - 1) * R;
      const y = cy + (rnd() * 2 - 1) * R;
      if (!inside(x, y)) continue;
      const t = edgeT(x, y);
      const keep = Math.pow(Math.max(0, 1 - t), 0.55) * 0.92 + 0.05;
      if (rnd() > keep) continue;
      const s = rnd() < 0.85 ? 1 : 2;
      ctx.fillRect(Math.floor(x), Math.floor(y), s, s);
      placed++;
    }
  }, [run.stats]);

  return (
    <div className="relative mt-[24px] w-full">
      <span className="pointer-events-none absolute left-1/2 top-[-20px] -translate-x-1/2 font-mono text-[12px] font-bold uppercase tracking-[1px] text-[var(--color-ink)]">
        INSTINCT
      </span>
      <span className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 font-mono text-[12px] font-bold uppercase tracking-[1px] text-[var(--color-ink)]">
        COURAGE
      </span>
      <span className="pointer-events-none absolute bottom-[-20px] left-1/2 -translate-x-1/2 font-mono text-[12px] font-bold uppercase tracking-[1px] text-[var(--color-ink)]">
        RUSE
      </span>
      <span className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 font-mono text-[12px] font-bold uppercase tracking-[1px] text-[var(--color-ink)]">
        EMPATHIE
      </span>
      <canvas ref={canvasRef} className="radar-canvas block h-[264px] w-full" style={{ imageRendering: "pixelated" }} />
    </div>
  );
}

function EssenceTab({ run }: { run: RunState }) {
  return (
    <div className="pt-[24px]">
      <RadarCanvas run={run} />

      <div className="mt-[44px]">
        <SectionHead label="États" />
        <div className="px-[15px]">
          {run.effects.length === 0 ? (
            <p className="font-mono text-[12px] leading-[1.4] text-[var(--color-ink)] opacity-55">
              Aucun état. Le corps tient — pour l&apos;instant.
            </p>
          ) : (
            <div className="flex flex-col gap-[14px]">
              {run.effects.map((e) => {
                const d = ETAT_DISPLAY[e.id];
                const positive = e.delta > 0;
                return (
                  <div key={e.id} className="flex items-center gap-[14px]">
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
                          src={d.img}
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
  // Inventaire limité à 3 reliques (retour Patrick 22/07) : on garde les 3 plus
  // récentes (dernières forgées).
  const relics = allRelics.slice(-3);
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
  const detailImg = item ? itemIcon(item) : relic ? RELIC_ICON : null;
  const detailName = item?.name ?? relic?.name ?? "—";
  const detailFlavor = item
    ? item.flavor
    : relic
      ? `Relique ${relic.rarity} — forgée de la mort de ${relic.heroName}, jour ${relic.days}.`
      : "";
  const detailTag = item ? RARITY_LABEL[item.rarity as BesaceRarity] : relic ? relic.rarity : null;
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
          <img alt={it.name} src={itemIcon(it)} className="block size-full" style={{ imageRendering: "pixelated" }} />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-mono text-[10px] uppercase tracking-[2px] text-[var(--color-ink)] opacity-45">
            VIDE
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="pt-[4px]">
      {/* Détail de l'objet sélectionné — icône tramée agrandie au pixel. */}
      <div className="mx-auto size-[276px]">
        {detailImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={detailImg} className="block size-full" style={{ imageRendering: "pixelated" }} />
        )}
      </div>
      <div className="px-[17px]">
        <p
          className="mt-[14px] text-[32px] leading-[1.05] text-[var(--color-accent)]"
          style={{ fontFamily: '"Instrument Serif", serif' }}
        >
          {detailName}
          {detailTag && (
            <span className="ml-[10px] align-middle font-mono text-[10px] uppercase tracking-[1.5px] text-[var(--color-ink)] opacity-60">
              {item ? (item.slot === "actif" ? "Actif" : "Passif") + " · " + detailTag : detailTag}
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
      <div className="mt-[26px] flex gap-[28px] px-[15px]">
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
                    <img alt={r.name} src={RELIC_ICON} className="block size-full" style={{ imageRendering: "pixelated" }} />
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

export function OptionsTab() {
  const [s, setS] = useState<Settings>(() => loadSettings());
  const [eraseArmed, setEraseArmed] = useState(false);
  const [aidesReset, setAidesReset] = useState(false);

  function set<K extends keyof Settings>(k: K, v: Settings[K]) {
    setS(mutateSettings((d) => { d[k] = v; }));
  }

  function reafficherAides() {
    try {
      window.localStorage.removeItem("aldenhar-aide-de");
    } catch {}
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
      window.localStorage.removeItem("aldenhar-aide-de");
    } catch {}
    window.location.reload();
  }

  return (
    <div className="px-[15px] pt-[8px]">
      {/* Musique — ACTIVE (lot 24/07) : interrupteur à glissière de la maquette
          (rail + pavé carré, position = état) + curseur de volume. Chaque
          changement est appliqué immédiatement à la piste en cours. */}
      <div>
        <OptLabel>Musique</OptLabel>
        <button
          type="button"
          aria-label={s.music ? "Couper la musique" : "Activer la musique"}
          onClick={() => {
            set("music", !s.music);
            syncMusicSettings();
          }}
          className="mt-[18px] relative block h-[16px] w-full cursor-pointer"
        >
          <span className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-white" aria-hidden />
          <span
            className={`absolute top-0 size-[16px] border border-solid border-white ${
              s.music ? "right-0 bg-[var(--color-accent)]" : "left-0 bg-[var(--color-bg)]"
            }`}
            aria-hidden
          />
        </button>
        {/* Volume : rail à crans (8 pas), jamais un dégradé lisse. */}
        <div className={`mt-[18px] ${s.music ? "" : "pointer-events-none opacity-50"}`}>
          <p className="font-mono text-[11px] tracking-[2px] text-[var(--color-ink)] uppercase opacity-70">Volume</p>
          <div className="mt-[10px] flex gap-[6px]">
            {Array.from({ length: 8 }, (_, i) => {
              const v = (i + 1) / 8;
              const on = s.musicVolume >= v - 0.01;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Volume ${i + 1} sur 8`}
                  onClick={() => {
                    set("musicVolume", v);
                    syncMusicSettings();
                  }}
                  className={`h-[14px] flex-1 cursor-pointer border border-solid border-white ${
                    on ? "bg-[var(--color-accent)]" : "bg-[var(--color-bg)]"
                  }`}
                />
              );
            })}
          </div>
        </div>
        <OptHelp>Le jeu se joue entièrement sans le son : aucune information n&apos;est portée par l&apos;audio seul.</OptHelp>
      </div>

      <OptDivider />

      {/* Lecture à haute voix + Vitesse — INERTES (synthèse vocale pas encore là) */}
      <div className="opacity-50">
        <OptLabel>Lecture à haute voix</OptLabel>
        <SegControl options={[{ v: "non", label: "non" }, { v: "oui", label: "oui" }]} value="non" disabled />
        <div className="mt-[24px]">
          <OptLabel>Vitesse de lecture</OptLabel>
          <SegControl
            options={[{ v: "lente", label: "lente" }, { v: "normale", label: "normale" }, { v: "vive", label: "vive" }]}
            value="normale"
            disabled
          />
        </div>
        <OptHelp>Utilise la voix du système. Fonctionne hors connexion.</OptHelp>
      </div>

      <OptDivider />

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
      <div className="mt-[24px]">
        <OptLabel>Vibrations</OptLabel>
        <SegControl
          options={[{ v: "non", label: "non" }, { v: "oui", label: "oui" }]}
          value={s.vibrations ? "oui" : "non"}
          onChange={(v) => set("vibrations", v === "oui")}
        />
      </div>
      <div className="mt-[24px]">
        <button type="button" onClick={reafficherAides} className="font-mono text-[13px] text-[var(--color-ink)] underline">
          Réafficher les aides
        </button>
        <OptHelp>{aidesReset ? "C'est fait — les aides du dé réapparaîtront." : "Les conseils déjà masqués (comme l'aide du dé) reviendront."}</OptHelp>
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
  );
}
