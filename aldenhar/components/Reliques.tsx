"use client";

/**
 * L'ÉCRAN RELIQUES — DESCENTE / RELIQUAIRE (spec Notion 20/08, maquette Figma
 * 2496:4745). Un seul écran, AUCUN scroll vertical, trois zones :
 *
 *   1. la FICHE de la relique sélectionnée (illustration, titre Instrument
 *      Serif, tag de rareté, effet en texte courant — bloc à hauteur FIXE de
 *      3 lignes : le vide sous une description courte est voulu, c'est ce qui
 *      garantit que les slots ne bougent pas d'un pixel entre deux reliques) ;
 *   2. la DESCENTE — 3 slots, ce que la prochaine incarnation emporte ;
 *   3. le RELIQUAIRE — ligne unique à défilement horizontal, tout ce que les
 *      morts ont laissé.
 *
 * Nommage verrouillé par la spec : DESCENTE / RELIQUAIRE (pas « Inventaire »,
 * qui collisionne avec la Besace — la distinction porte sur le TEMPS : le
 * Reliquaire est permanent, la Descente est révocable jusqu'au départ).
 *
 * Interactions :
 *   · tap = sélection, un tap ne déplace JAMAIS rien ;
 *   · glisser vers le HAUT = équiper (slots vides en bordure blanche 100 %
 *     pendant le drag ; drop sur un slot occupé = ÉCHANGE, jamais un refus —
 *     sinon le joueur est bloqué dès que ses 3 slots sont pleins) ;
 *   · glisser vers le BAS = reposer — pas de croix, pas de poubelle (une
 *     relique arrachée à un mort ne se JETTE pas ; le relâcher n'importe où
 *     suffit, le creux lui est réservé).
 *
 * LE CREUX FANTÔME (point clé de la spec) : le Reliquaire ne se vide jamais
 * et ne se réorganise jamais. Une relique montée en Descente laisse un creux
 * à sa place — même silhouette, trame très faible. Le retour n'a pas besoin
 * de cible, l'ordre ne bouge pas (mémoire du pouce), et le creux EST une
 * information. Si le creux est hors champ au drop, la bande défile jusqu'à
 * lui (défilement instantané — jamais un easing lisse, règle DA).
 *
 * MÉCANIQUE (réponse aux trois questions du 10/08) : les effets des trois
 * reliques S'ADDITIONNENT (voir reliquesPortees/donsPortes/dettesPortees) ;
 * le choix est révocable jusqu'au départ en run — une fois la run engagée,
 * la Descente est SCELLÉE ici (point resté « à confirmer » dans la spec :
 * implémenté verrouillé, cohérent avec le permadeath — à défaire si Patrick
 * tranche autrement, c'est le prop `verrouille`).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadMemory,
  mutateMemory,
  relicEffect,
  relicFiche,
  RELIC_FONCTION,
  type Relic,
} from "@/lib/player-memory";
import { reliqueIllustration } from "@/lib/reliques";
import { assetUrl, assetExiste } from "@/lib/assets";

const RARETE_LABEL: Record<Relic["rarity"], string> = {
  commune: "RELIQUE COMMUNE",
  rare: "RELIQUE RARE",
  legendaire: "RELIQUE LÉGENDAIRE",
};

/** Les trois traitements de rareté de la maquette 2333-7011 (palette à trois
    couleurs, aucune teinte neuve) : commune = contour blanc, rare = fond
    blanc texte charbon, légendaire = fond orange texte charbon. */
function TagRarete({ rarity }: { rarity: Relic["rarity"] }) {
  const cls =
    rarity === "legendaire"
      ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
      : rarity === "rare"
        ? "bg-[var(--color-ink)] text-[var(--color-bg)]"
        : "border border-solid border-[var(--color-ink)] text-[var(--color-ink)]";
  return (
    <span className={`inline-block px-[8px] py-[3px] font-mono text-[11px] tracking-[1.5px] ${cls}`}>
      {RARETE_LABEL[rarity]}
    </span>
  );
}

function imgDe(r: Relic): string {
  return (
    reliqueIllustration(r.relicId ?? r.name, assetExiste) ?? "assets/objet_couronne_brisee.png"
  );
}

/** L'effet en texte courant : le don puis la dette de la fiche (règle
    d'écriture de la spec : 2 lignes max — c'est l'effet qui doit tenir,
    pas l'écran qui doit s'étirer). Reliques d'avant le 5/08 : leur
    fonction dérivée, sans dette. */
function effetDe(r: Relic): string {
  const fiche = relicFiche(r);
  if (fiche) return `${fiche.fonction} ${fiche.cout}`;
  return RELIC_FONCTION[relicEffect(r)];
}

type Drag = {
  idx: number;
  depuisDescente: boolean;
  x: number;
  y: number;
  /** Le drag ne s'arme qu'après un vrai déplacement — avant, c'est un tap. */
  arme: boolean;
  x0: number;
  y0: number;
};

export default function Reliques({
  onClose,
  verrouille,
}: {
  onClose: () => void;
  /** Run engagée : la Descente est scellée (lecture seule). */
  verrouille: boolean;
}) {
  const mem = useMemo(() => loadMemory(), []);
  const relics = mem.relics;
  // Descente locale, MIROIR de la mémoire du compte. Un compte qui n'a
  // jamais ouvert l'écran (`descente` absent) porte la dernière forgée —
  // on matérialise ce défaut ici, mais on ne l'ÉCRIT qu'au premier geste.
  const [descente, setDescente] = useState<number[]>(() =>
    Array.isArray(mem.descente)
      ? mem.descente.filter((i) => i >= 0 && i < relics.length).slice(0, 3)
      : relics.length
        ? [relics.length - 1]
        : []
  );
  const [sel, setSel] = useState<number | null>(() =>
    Array.isArray(mem.descente)
      ? (mem.descente.find((i) => i >= 0 && i < relics.length) ?? (relics.length ? 0 : null))
      : relics.length
        ? relics.length - 1
        : null
  );
  const [drag, setDrag] = useState<Drag | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bandeRef = useRef<HTMLDivElement | null>(null);
  const creuxRefs = useRef<Record<number, HTMLDivElement | null>>({});

  function ecrire(next: number[]) {
    setDescente(next);
    mutateMemory((m) => {
      m.descente = next;
    });
  }

  /** Équipe `idx` dans `slot` — un slot occupé ÉCHANGE, jamais un refus. */
  function equiper(idx: number, slot: number) {
    const next = [...descente];
    const deja = next.indexOf(idx);
    if (deja >= 0) next.splice(deja, 1);
    if (slot >= next.length) next.push(idx);
    else next[slot] = idx;
    ecrire(next.slice(0, 3));
    setSel(idx);
  }

  /** Repose `idx` dans son creux, et fait défiler la bande jusqu'à lui pour
      que le joueur VOIE la relique rejoindre sa place (spec — défilement
      instantané, jamais un easing). */
  function reposer(idx: number) {
    ecrire(descente.filter((i) => i !== idx));
    setSel(idx);
    requestAnimationFrame(() => {
      creuxRefs.current[idx]?.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
    });
  }

  // ⚠️ Les écouteurs de drag vivent sur WINDOW, pas sur l'élément — un
  // setPointerCapture sur la vignette perdait 8 pointermove sur 10 (mesuré
  // sur la carte de l'atelier, 28/07).
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      setDrag((d) => {
        if (!d) return d;
        const arme = d.arme || Math.abs(e.clientY - d.y0) > 14 || Math.abs(e.clientX - d.x0) > 14;
        return { ...d, x: e.clientX, y: e.clientY, arme };
      });
    };
    const up = (e: PointerEvent) => {
      setDrag(null);
      const d = drag;
      if (!d) return;
      const arme =
        d.arme || Math.abs(e.clientY - d.y0) > 14 || Math.abs(e.clientX - d.x0) > 14;
      if (!arme) {
        // Un tap : sélection seule — il ne déplace jamais rien.
        setSel(d.idx);
        return;
      }
      if (verrouille) return;
      if (d.depuisDescente) {
        // Glisser vers le BAS = reposer, relâché n'importe où sous le slot.
        if (e.clientY > d.y0 + 24) reposer(d.idx);
        return;
      }
      // Depuis le Reliquaire : le drop se juge sur les slots de la Descente.
      const slot = slotRefs.current.findIndex((el) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return (
          e.clientX >= r.left - 6 && e.clientX <= r.right + 6 &&
          e.clientY >= r.top - 10 && e.clientY <= r.bottom + 10
        );
      });
      if (slot >= 0) equiper(d.idx, slot);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, verrouille, descente]);

  function prendre(e: React.PointerEvent, idx: number, depuisDescente: boolean) {
    e.preventDefault();
    setDrag({ idx, depuisDescente, x: e.clientX, y: e.clientY, arme: false, x0: e.clientX, y0: e.clientY });
  }

  const relicSel = sel !== null ? relics[sel] : null;
  const dragEnCours = Boolean(drag?.arme && !drag?.depuisDescente && !verrouille);
  const selPorte = sel !== null && descente.includes(sel);

  // Microcopie : UNE ligne, contextuelle (spec — jamais d'infinitif notice).
  const microcopie = verrouille
    ? "La Descente est scellée jusqu'à la prochaine incarnation."
    : relics.length === 0
      ? "Les morts laissent quelque chose. Pas encore les tiens."
      : selPorte
        ? "Glisse vers le bas pour la reposer."
        : descente.length < 3
          ? "Glisse une relique vers le haut."
          : "Glisse vers le haut pour échanger.";

  return (
    <div
      className="absolute inset-0 z-[9] flex flex-col bg-[var(--color-bg)] select-none"
      style={{ touchAction: "none" }}
    >
      {/* Croix de fermeture — même position que partout (règle du 16/07). */}
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute right-[10px] top-[11px] z-[3] flex size-[32px] items-center justify-center border border-solid border-[var(--color-ink)]/40 bg-[var(--color-bg)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={assetUrl("assets/croix_menu.png")} className="size-[32px]" style={{ imageRendering: "pixelated" }} />
      </button>

      {/* ─── 1. LA FICHE ─── flex-1 : les deux sections du bas sont ANCRÉES,
          elles ne bougent jamais, quelle que soit la description. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 items-center justify-center px-[16px] pt-[10px]">
          {relicSel ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              alt=""
              src={assetUrl(imgDe(relicSel))}
              className="max-h-full max-w-[300px] object-contain"
              style={{ imageRendering: "pixelated" }}
            />
          ) : (
            <p className="px-[24px] text-center font-mono text-[13px] leading-[1.6] text-[var(--color-ink)] opacity-50">
              Aucune relique. Elles se forgent d&apos;une mort — la tienne.
            </p>
          )}
        </div>
        {relicSel && (
          <div className="shrink-0 px-[16px] pb-[8px]">
            <h2
              className="text-[34px] leading-[1.05] text-[var(--color-accent)]"
              style={{ fontFamily: "var(--font-title)" }}
            >
              {relicSel.name}
            </h2>
            <div className="mt-[10px]">
              <TagRarete rarity={relicSel.rarity} />
            </div>
            {/* Bloc description à HAUTEUR FIXE : 3 lignes réservées à 13 px,
                texte aligné en haut — le vide sous un effet court est voulu. */}
            <p className="mt-[12px] h-[57px] overflow-hidden font-mono text-[13px] leading-[1.45] text-[var(--color-ink)]">
              {effetDe(relicSel)}
            </p>
          </div>
        )}
      </div>

      {/* ─── 2. LA DESCENTE ─── */}
      <div className="shrink-0 px-[13px]">
        <SectionRule label="Descente">
          <span className="ml-[6px] tracking-[3px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={i < descente.length ? "text-[var(--color-accent)]" : "text-[var(--color-ink)] opacity-40"}
              >
                {i < descente.length ? "◆" : "◇"}
              </span>
            ))}
          </span>
        </SectionRule>
        <div className="mt-[10px] flex gap-[13px]">
          {[0, 1, 2].map((slot) => {
            const idx = descente[slot];
            const occupe = idx !== undefined;
            return (
              <div
                key={slot}
                ref={(el) => {
                  slotRefs.current[slot] = el;
                }}
                onPointerDown={occupe ? (e) => prendre(e, idx, true) : undefined}
                className={`relative flex size-[70px] items-center justify-center overflow-hidden border border-solid ${
                  occupe && sel === idx
                    ? "border-[var(--color-ink)]"
                    : dragEnCours
                      ? "border-[var(--color-ink)]"
                      : "border-[var(--color-ink)]/50"
                } bg-[var(--color-bg)]`}
              >
                {occupe ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img alt="" src={assetUrl(imgDe(relics[idx]))} className="h-full w-full object-cover" style={{ imageRendering: "pixelated" }} draggable={false} />
                ) : (
                  <span className="font-mono text-[11px] tracking-[2px] text-[var(--color-ink)] opacity-45">VIDE</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 3. LE RELIQUAIRE ─── une seule ligne (décision Patrick), à
          défilement horizontal. Il ne se vide ni ne se réorganise JAMAIS. */}
      <div className="mt-[16px] shrink-0 px-[13px]">
        <SectionRule label="Reliquaire" />
        <div
          ref={bandeRef}
          className="mt-[10px] flex gap-[13px] overflow-x-auto pb-[4px]"
          style={{ scrollbarWidth: "none", touchAction: "pan-x" }}
        >
          {relics.map((r, i) => {
            const porte = descente.includes(i);
            return (
              <div
                key={i}
                ref={(el) => {
                  creuxRefs.current[i] = el;
                }}
                onPointerDown={(e) => prendre(e, i, false)}
                className={`relative flex size-[70px] shrink-0 items-center justify-center overflow-hidden border border-solid ${
                  !porte && sel === i ? "border-[var(--color-ink)]" : porte ? "border-[var(--color-ink)]/20" : "border-[var(--color-ink)]/50"
                } bg-[var(--color-bg)]`}
              >
                {/* Le CREUX FANTÔME : même silhouette, trame très faible. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  src={assetUrl(imgDe(r))}
                  className="h-full w-full object-cover"
                  style={{ imageRendering: "pixelated", opacity: porte ? 0.16 : 1 }}
                  draggable={false}
                />
              </div>
            );
          })}
          {/* Cases vides de comblement (maquette) : la bande garde sa ligne
              même quand le Reliquaire est court. */}
          {Array.from({ length: Math.max(0, 5 - relics.length) }).map((_, i) => (
            <div
              key={`v${i}`}
              className="flex size-[70px] shrink-0 items-center justify-center border border-solid border-[var(--color-ink)]/30"
            >
              <span className="font-mono text-[11px] tracking-[2px] text-[var(--color-ink)] opacity-30">VIDE</span>
            </div>
          ))}
        </div>
      </div>

      {/* Microcopie — une seule ligne, en bas d'écran. */}
      <p className="shrink-0 py-[14px] text-center font-mono text-[12px] tracking-[0.5px] text-[var(--color-ink)] opacity-50">
        {microcopie}
      </p>

      {/* La vignette qui suit le doigt pendant un drag armé. */}
      {drag?.arme && !verrouille && (
        <div
          className="pointer-events-none absolute z-[20] size-[54px] overflow-hidden border border-solid border-[var(--color-ink)]"
          style={{ left: drag.x - 27, top: drag.y - 27 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={assetUrl(imgDe(relics[drag.idx]))} className="h-full w-full object-cover" style={{ imageRendering: "pixelated" }} />
        </div>
      )}
    </div>
  );
}

/** Filet de section façon maquette : tiret, libellé mono, filet jusqu'au
    bord droit. */
function SectionRule({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[8px]">
      <span className="h-px w-[6px] bg-[var(--color-ink)]/30" />
      <span className="font-mono text-[13px] text-[var(--color-ink)] opacity-80">{label}</span>
      {children}
      <span className="h-px flex-1 bg-[var(--color-ink)]/30" />
    </div>
  );
}
