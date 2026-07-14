"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CloseX } from "@/components/Home";
import { loadMemory } from "@/lib/player-memory";
import type { NarrativeEffect, RunState } from "@/lib/state";
import { RARITY_LABEL, type BesaceItem, type BesaceRarity } from "@/lib/besace";

/**
 * Menu plein cadre (spec §8 + écrans Figma 1925:559 « Essence » et 1925:524
 * « Inventaire », lot 14/07). Jamais une popup : il recouvre tout le cadre.
 * Onglets STATS · INVENTAIRE · OPTIONS — Options n'est pas encore designé,
 * l'onglet est présent mais inerte.
 *
 * NB Figma : le texte de Geryon affiché sous « Dague simple » dans la maquette
 * Inventaire est un mauvais mapping (confirmé par Patrick) — ici c'est le
 * flavor réel de l'objet sélectionné qui s'affiche.
 */

type Tab = "stats" | "inventaire";

const BESACE_ICONS: Record<BesaceItem["kind"], string> = {
  arme: "assets/objet_dague.png",
  soin: "assets/objet_crane.png",
  babiole: "assets/objet_crane.png",
};

/** Fiche d'affichage des états narratifs (images du board Figma 1938:563). */
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

export default function GameMenu({ run, onClose }: { run: RunState; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("stats");
  const memory = useMemo(() => loadMemory(), []);

  return (
    <div className="absolute inset-0 z-[8] flex flex-col bg-[var(--color-bg)]">
      <div className="flex items-center justify-end px-[15px] py-[11px]">
        <CloseX onClose={onClose} />
      </div>

      {/* Onglets — OPTIONS visible mais inerte (pas encore designé) */}
      <div className="flex items-center justify-center gap-[16px] pb-[14px]">
        <TabLink label="STATS" active={tab === "stats"} onClick={() => setTab("stats")} />
        <Diamond />
        <TabLink label="INVENTAIRE" active={tab === "inventaire"} onClick={() => setTab("inventaire")} />
        <Diamond />
        <TabLink label="OPTIONS" disabled />
      </div>

      <div className="flex-1 overflow-y-auto pb-[24px]">
        {tab === "stats" ? <EssenceTab run={run} /> : <InventaireTab run={run} relics={memory.relics} />}
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
          ? "cursor-not-allowed text-[var(--color-ink)] opacity-30"
          : active
            ? "cursor-pointer text-[var(--color-ink)]"
            : "cursor-pointer text-[var(--color-ink)] opacity-45"
      }`}
    >
      {label}
    </button>
  );
}

function Diamond() {
  return <span className="block size-[4px] rotate-45 bg-[var(--color-ink)] opacity-50" aria-hidden />;
}

function SectionHead({ label }: { label: string }) {
  return (
    <div className="mb-[16px] flex items-center gap-[8px]">
      <span className="block h-px w-[7px] bg-[var(--color-ink)] opacity-40" aria-hidden />
      <span className="text-[12px] uppercase tracking-[1.5px] text-[var(--color-ink)]">{label}</span>
      <span className="block h-px flex-1 bg-[var(--color-ink)] opacity-40" aria-hidden />
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
 * Radar 4 axes — le remplissage est un NUAGE DE PIXELS tramés (référence
 * image de Patrick, 14/07) : dense au centre, qui s'effrite vers les bords.
 * Jamais un aplat vectoriel lisse, jamais un dégradé CSS (§11).
 */
function RadarCanvas({ run }: { run: RunState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 300;
    const H = 280;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const cx = W / 2;
    const cy = H / 2;
    const R = 118;
    ctx.clearRect(0, 0, W, H);

    // Croix des axes
    ctx.strokeStyle = "rgba(245, 240, 225, 0.28)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx + 0.5, cy - R - 8);
    ctx.lineTo(cx + 0.5, cy + R + 8);
    ctx.moveTo(cx - R - 8, cy + 0.5);
    ctx.lineTo(cx + R + 8, cy + 0.5);
    ctx.stroke();

    // Losanges-guides en tirets (3 niveaux, cf. Figma Rectangle 147/148/149)
    ctx.setLineDash([3, 3]);
    for (const f of [1, 0.62, 0.24]) {
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

    // Polygone des stats (sur 10) — sommets sur chaque axe
    const pts = AXES.map((a) => {
      const v = Math.max(0.05, Math.min(1, run.stats[a.key] / 10));
      return { x: cx + a.dx * v * R, y: cy + a.dy * v * R };
    });

    // Remplissage tramé : échantillonnage par rejet, densité qui décroît
    // vers les bords (érosion organique, pas un contour net).
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
    // Distance normalisée au centre le long de la direction du point : sert
    // au fondu de densité (1 au centre → ~0.15 au bord du polygone).
    const edgeT = (x: number, y: number) => {
      const dx = x - cx;
      const dy = y - cy;
      const len = Math.hypot(dx, dy);
      if (len < 1) return 0;
      // Cherche le point du bord dans cette direction par bissection
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
    while (placed < 2400 && guard < 30000) {
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

  // Les libellés latéraux se placent DANS la largeur du cadre (Figma :
  // empathie x17, courage x314), jamais hors du canvas — sinon coupés.
  return (
    <div className="relative mt-[6px] w-full">
      <span className="pointer-events-none absolute left-1/2 top-[-14px] -translate-x-1/2 font-mono text-[10px] uppercase tracking-[2px] text-[var(--color-ink)]">
        INSTINCT
      </span>
      <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[2px] text-[var(--color-ink)]">
        COURAGE
      </span>
      <span className="pointer-events-none absolute bottom-[-14px] left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[2px] text-[var(--color-ink)]">
        RUSE
      </span>
      <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[2px] text-[var(--color-ink)]">
        EMPATHIE
      </span>
      <canvas ref={canvasRef} className="radar-canvas mx-auto block h-[280px] w-[300px]" style={{ imageRendering: "pixelated" }} />
    </div>
  );
}

function EssenceTab({ run }: { run: RunState }) {
  return (
    <div className="px-[15px] pt-[10px]">
      <RadarCanvas run={run} />

      <div className="mt-[34px]">
        <SectionHead label="États" />
        {run.effects.length === 0 ? (
          <p className="text-[12px] leading-[1.4] text-[var(--color-ink)] opacity-55">
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
                    // Règle colorimétrique 14/07 : état négatif = image telle
                    // quelle (orange) ; état positif = désaturation complète
                    // (rendu blanc/crème). Jamais une 3e couleur.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      src={d.img}
                      className="size-[66px] shrink-0"
                      style={{
                        imageRendering: "pixelated",
                        filter: positive ? "saturate(0) brightness(1.6)" : undefined,
                      }}
                    />
                  )}
                  <div>
                    <p
                      className={`text-[12px] uppercase tracking-[1.5px] ${
                        positive ? "text-[var(--color-ink)]" : "text-[var(--color-accent)]"
                      }`}
                    >
                      {d.name}
                    </p>
                    <p className="mt-[6px] text-[12px] leading-[1.4] text-[var(--color-ink)] opacity-70">{d.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-[30px]">
        <SectionHead label="Compétences" />
        {/* Pas encore de système de compétences (texte seul par design, 14/07) :
            l'emplacement existe, il attend les premières rencontres qui enseignent. */}
        <p className="text-[12px] leading-[1.4] text-[var(--color-ink)] opacity-55">
          Rien encore. Certaines rencontres enseignent — si on leur survit.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ INVENTAIRE */

type Selected = { type: "besace"; index: number } | { type: "relic"; index: number };

function InventaireTab({ run, relics }: { run: RunState; relics: { name: string; rarity: string; heroName: string; days: number }[] }) {
  const [selected, setSelected] = useState<Selected>({ type: "besace", index: 0 });

  const item = selected.type === "besace" ? run.besace[selected.index] : undefined;
  const relic = selected.type === "relic" ? relics[selected.index] : undefined;
  const detailImg = item ? BESACE_ICONS[item.kind] : relic ? "assets/objet_masque.png" : null;
  const detailName = item?.name ?? relic?.name ?? "—";
  const detailFlavor = item
    ? item.flavor
    : relic
      ? `Relique ${relic.rarity} — forgée de la mort de ${relic.heroName}, jour ${relic.days}.`
      : "";
  const detailTag = item ? RARITY_LABEL[item.rarity as BesaceRarity] : relic ? relic.rarity : null;

  return (
    <div className="px-[15px] pt-[4px]">
      {/* Détail de l'objet sélectionné — l'icône tramée agrandie au pixel */}
      <div className="mx-auto w-[276px]">
        {detailImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={detailImg} className="block size-[276px]" style={{ imageRendering: "pixelated" }} />
        )}
      </div>
      <p
        className="mt-[10px] text-[26px] leading-[1.1] text-[var(--color-accent)]"
        style={{ fontFamily: '"Instrument Serif", serif' }}
      >
        {detailName}
        {detailTag && (
          <span className="ml-[10px] align-middle font-mono text-[10px] uppercase tracking-[1.5px] text-[var(--color-ink)] opacity-60">
            {detailTag}
          </span>
        )}
      </p>
      <p className="mt-[8px] min-h-[34px] text-[12px] leading-[1.45] text-[var(--color-ink)] opacity-75">{detailFlavor}</p>

      <div className="mt-[22px]">
        <SectionHead label="Équipements" />
        <div className="flex gap-[9px]">
          {Array.from({ length: 4 }).map((_, i) => {
            const it = run.besace[i];
            const isSel = selected.type === "besace" && selected.index === i && Boolean(it);
            return (
              <button
                key={i}
                type="button"
                disabled={!it}
                onClick={() => setSelected({ type: "besace", index: i })}
                className={`relative size-[74px] border border-solid ${
                  isSel ? "border-white" : "border-[var(--color-ink)]/45"
                } ${it ? "cursor-pointer" : "cursor-default"}`}
              >
                {it ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={it.name} src={BESACE_ICONS[it.kind]} className="block size-full" style={{ imageRendering: "pixelated" }} />
                ) : (
                  <span className="absolute inset-0 grid place-items-center font-mono text-[9px] uppercase tracking-[2px] text-[var(--color-ink)] opacity-40">
                    VIDE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-[24px]">
        <SectionHead label="Reliques" />
        {relics.length === 0 ? (
          <p className="text-[12px] leading-[1.4] text-[var(--color-ink)] opacity-55">
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
                  <img alt={r.name} src="assets/objet_masque.png" className="block size-full" style={{ imageRendering: "pixelated" }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
