"use client";

/**
 * LE CODEX — « Ce que tes morts ont compris » (Phase E, spec Notion 20/08).
 * Quatre niveaux, trois taps pour atteindre une entrée :
 *
 *   Codex (liste des Actes, maquette 2491:1236)
 *     → Acte (liste des Zones, 2492:1379)
 *       → Zone (sections Lieux / Rencontres / Arcs, 2492:1432)
 *         → Entrée (2492:1561 pour lieu/rencontre ; l'entrée d'ARC porte
 *           l'image de l'ACTE en bandeau court — un arc est transverse, il a
 *           le visage de l'acte entier, et surtout il ne doit pas ressembler
 *           à un Lieu de la même zone. Un arc n'a JAMAIS d'image dédiée.)
 *
 * Le titre de l'écran 1 est verrouillé : « Ce que tes morts ont compris » —
 * les cases vides sont les lacunes du JOUEUR, pas les oublis du Domaine
 * (l'ancien « Ce que le Domaine se rappelle » est écarté par la spec).
 *
 * Compteurs `n/total` en Roboto Mono — la même exception que le bilan de
 * mort : le Codex est un REGISTRE, pas du feedback de jeu. Le losange
 * orange (nouveauté) se PROPAGE vers le haut : un losange sur l'Acte veut
 * dire qu'il y a du neuf quelque part en dessous. Ouvrir une fiche pose
 * `vu` — le NOUVEAU tombe, le losange se recalcule.
 *
 * LECTURE PURE : rien ici n'écrit autre chose que `vu`. Le jeu reste
 * compréhensible sans le Codex (test d'acceptation du plan d'élagage).
 */

import { useMemo, useState } from "react";
import {
  CODEX_LANDES,
  codexEntry,
  IMAGE_ACTE_I,
  totauxCodex,
  type CodexEntry,
  type CodexType,
} from "@/lib/codex-data";
import { loadMemory, marquerCodexVu } from "@/lib/player-memory";
import { assetUrl, assetCss } from "@/lib/assets";
import { BoutonNav } from "@/components/NavIcons";

type Niveau =
  | { t: "actes" }
  | { t: "zones" }
  | { t: "zone" }
  | { t: "entree"; id: string };

const EYEBROW: Record<CodexType, string> = {
  lieu: "LIEUX",
  rencontre: "RENCONTRES",
  arc: "ARCS",
};

/** Les visuels d'en-tête des trois écrans de navigation — fournis par
    Patrick (PJ du 21/08), composés EXPRÈS avec le sujet en bas et un grand
    ciel orange plat en haut : c'est ce ciel qui rend le bloc-titre lisible. */
const HERO: Record<"actes" | "zones" | "zone", string> = {
  actes: "assets/codex_accueil.png",
  zones: "assets/codex_lisieres.png",
  zone: "assets/codex_landes.png",
};

const SECTIONS: { type: CodexType; label: string }[] = [
  { type: "lieu", label: "Lieux" },
  { type: "rencontre", label: "Rencontres" },
  { type: "arc", label: "Arcs" },
];

/** Le jour en chiffres romains — la provenance de la maquette dit « Jour IV ». */
function romain(n: number): string {
  const t: [number, string][] = [
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let r = "";
  let v = Math.max(1, Math.floor(n));
  for (const [k, s] of t) while (v >= k) { r += s; v -= k; }
  return r;
}

/** L'eyebrow de la maquette : deux CARRÉS de 3px tournés à 45° (jamais des
    ronds — retour Patrick 21/08), gap 8px, libellé Roboto Mono Medium 12px
    espacé 0.6px. Blanc sur les écrans de navigation (posé sur le ciel
    orange), orange sur les fiches (posé sur le charbon). */
function Eyebrow({ texte, blanc }: { texte: string; blanc?: boolean }) {
  const carre = blanc ? "bg-[var(--color-ink)]" : "bg-[var(--color-accent)]";
  const encre = blanc ? "text-[var(--color-ink)]" : "text-[var(--color-accent)]";
  return (
    <div className="flex items-center justify-center gap-[8px]">
      <span aria-hidden className={`size-[3px] rotate-45 ${carre}`} />
      <span className={`font-mono text-[12px] font-medium tracking-[0.6px] ${encre}`}>{texte}</span>
      <span aria-hidden className={`size-[3px] rotate-45 ${carre}`} />
    </div>
  );
}

/** Le losange orange de nouveauté (coin haut-droit d'un bouton). */
function Losange() {
  return (
    <span
      aria-hidden
      className="absolute right-[7px] top-[7px] size-[7px] rotate-45 bg-[var(--color-accent)]"
    />
  );
}


export default function Codex({ onClose }: { onClose: () => void }) {
  const [niveau, setNiveau] = useState<Niveau>({ t: "actes" });
  // Le `vu` change quand on ouvre une fiche → on relit la mémoire à chaque
  // navigation (tick), pas seulement au montage.
  const [tick, setTick] = useState(0);
  // `tick` force la relecture du localStorage après `marquerCodexVu`
  // (le NOUVEAU doit tomber).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const codex = useMemo(() => loadMemory().codex ?? {}, [tick]);
  const totaux = useMemo(() => totauxCodex("landes"), []);

  const debloquees = CODEX_LANDES.filter((e) => codex[e.id]);
  const duNeuf = debloquees.some((e) => !codex[e.id]?.vu);

  function ouvrir(id: string) {
    marquerCodexVu(id);
    setNiveau({ t: "entree", id });
    setTick((n) => n + 1);
  }

  function retour() {
    if (niveau.t === "actes") return onClose();
    if (niveau.t === "zones") return setNiveau({ t: "actes" });
    if (niveau.t === "zone") return setNiveau({ t: "zones" });
    setNiveau({ t: "zone" });
  }

  const entree = niveau.t === "entree" ? codexEntry(niveau.id) : null;
  const prov = niveau.t === "entree" ? codex[niveau.id] : undefined;

  return (
    <div className="absolute inset-0 z-[9] flex flex-col overflow-hidden bg-[var(--color-bg)]">
      {/* Navigation — retour à gauche, fermeture à droite (maquettes), à la
          MÊME hauteur que le menu en jeu : sous la barre iOS (safe-area),
          jamais dedans (retour Patrick 21/08). */}
      <div className="absolute left-[10px] top-[calc(env(safe-area-inset-top,0px)+11px)] z-[3]">
        <BoutonNav icone="fleche" label="Retour" onClick={retour} />
      </div>
      <div className="absolute right-[10px] top-[calc(env(safe-area-inset-top,0px)+11px)] z-[3]">
        <BoutonNav icone="croix" label="Fermer" onClick={onClose} />
      </div>

      {niveau.t === "entree" && entree ? (
        <EntreeFiche entree={entree} prov={prov} />
      ) : (
        <>
          {/* ─── En-tête : l'image monte AU RAS du haut de l'écran (retour
              Patrick 21/08 — le retrait de 35px de la maquette était la barre
              de statut iOS mimée dans Figma, pas du charbon à rendre). Le
              bloc-titre reste à y=85, SUR le ciel orange plat de l'image
              (visuels composés sujet en bas, ciel en haut) : CODEX et le
              titre se lisent en BLANC sur l'orange. */}
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              /* Cette branche ne rend jamais le niveau « entree » (il a sa
                 propre fiche au-dessus) — le cast dit juste ça à TypeScript. */
              src={assetUrl(HERO[niveau.t as Exclude<Niveau["t"], "entree">])}
              /* object-top : on rogne le bas s'il le faut, jamais le ciel qui
                 porte le titre. Hauteurs 425/347 = les bords BAS de la
                 maquette (35+390 / 35+312), conservés pour que les boutons
                 chevauchent l'image au même endroit. */
              className={`w-full object-cover object-top ${niveau.t === "zone" ? "h-[347px]" : "h-[425px]"}`}
              style={{ imageRendering: "pixelated" }}
            />
            <div
              className="dissolve-bottom"
              style={{ backgroundImage: assetCss("assets/bande_dissolution_haut.svg") }}
              aria-hidden
            />
            <div className="absolute inset-x-0 top-[85px] text-center">
              <Eyebrow texte="CODEX" blanc />
              <h1
                className="mt-[6px] px-[40px] text-[36px] leading-[1.1] text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-title)" }}
              >
                {niveau.t === "actes"
                  ? (
                    <>
                      Ce que tes morts
                      <br />
                      ont compris
                    </>
                  )
                  : niveau.t === "zones"
                    ? "Les Lisières"
                    : "Les Landes"}
              </h1>
            </div>
          </div>

          {niveau.t !== "zone" ? (
            /* ─── Écrans 1 et 2 : listes de boutons pleine largeur, posées à
                y=262 (maquette) — elles CHEVAUCHENT le bas sombre de l'image
                (35 + 390 − 262 = 163px de remontée). ─── */
            <div className="relative z-[2] mt-[-163px] flex flex-col gap-[14px] px-[15px]">
              {(niveau.t === "actes"
                ? [
                    { nom: "Les Lisières", actif: true },
                    // Grisés, JAMAIS en bordure blanche pleine (spec — le
                    // « Unknown » de la maquette était son défaut signalé).
                    { nom: "Acte II", actif: false },
                    { nom: "Acte III", actif: false },
                  ]
                : [
                    { nom: "Les Landes", actif: true },
                    { nom: "Zone 2", actif: false },
                    { nom: "Zone 3", actif: false },
                  ]
              ).map((b) => (
                <button
                  key={b.nom}
                  disabled={!b.actif}
                  onClick={() =>
                    setNiveau(niveau.t === "actes" ? { t: "zones" } : { t: "zone" })
                  }
                  className={`relative h-[62px] w-full border border-solid font-mono text-[14px] tracking-[1px] ${
                    b.actif
                      ? "border-[var(--color-ink)] text-[var(--color-ink)]"
                      : "border-[var(--color-ink)]/25 text-[var(--color-ink)]/40"
                  } bg-[var(--color-bg)]`}
                >
                  {b.nom}
                  {b.actif && duNeuf && <Losange />}
                </button>
              ))}
            </div>
          ) : (
            /* ─── Écran 3 : la zone, trois sections réglées ─── */
            <div className="min-h-0 flex-1 overflow-y-auto px-[13px] pb-[20px] pt-[6px]">
              {SECTIONS.map(({ type, label }) => {
                const rows = debloquees.filter((e) => e.type === type);
                return (
                  <div key={type} className="mt-[16px]">
                    <div className="flex items-center gap-[8px]">
                      <span className="h-px w-[6px] bg-[var(--color-ink)]/30" />
                      <span className="font-mono text-[13px] text-[var(--color-ink)] opacity-70">
                        {label} : {rows.length}/{totaux[type]}
                      </span>
                      <span className="h-px flex-1 bg-[var(--color-ink)]/30" />
                    </div>
                    <div className="mt-[8px] flex flex-col">
                      {rows.length === 0 ? (
                        <p className="py-[6px] font-mono text-[13px] text-[var(--color-ink)] opacity-35">
                          Rien encore.
                        </p>
                      ) : (
                        rows.map((e) => (
                          <button
                            key={e.id}
                            onClick={() => ouvrir(e.id)}
                            className="flex items-baseline gap-[12px] py-[8px] text-left font-mono text-[14px] text-[var(--color-ink)]"
                          >
                            <span>{e.titre}</span>
                            {!codex[e.id]?.vu && (
                              <span className="text-[11px] font-bold tracking-[2px] text-[var(--color-accent)]">
                                NOUVEAU
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Écrans 4 (lieu/rencontre — image propre, bandeau plein) et 6 (arc —
    image de l'ACTE, bandeau court). Structure commune : image + bande de
    dissolution, eyebrow, titre Instrument Serif, corps aligné à GAUCHE,
    puis la ligne de provenance — OBLIGATOIRE : c'est elle qui fait du
    Codex un registre des morts du joueur. */
function EntreeFiche({
  entree,
  prov,
}: {
  entree: CodexEntry;
  prov?: { par: string; jour: number };
}) {
  const arc = entree.type === "arc";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={assetUrl(arc ? IMAGE_ACTE_I : (entree.illustration ?? IMAGE_ACTE_I))}
          className={`w-full object-cover ${arc ? "h-[190px]" : "h-[352px]"}`}
          style={{ imageRendering: "pixelated" }}
        />
        {/* ⚠️ La bande de dissolution n'a PAS de background dans le CSS : il
            se pose inline (URL compatible basePath) — sans lui elle est
            invisible, le défaut exact du retour Patrick 21/08. */}
        <div
          className="dissolve-bottom"
          style={{ backgroundImage: assetCss("assets/bande_dissolution_haut.svg") }}
          aria-hidden
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-[16px] pb-[24px]">
        <div className="mt-[14px]">
          <Eyebrow texte={EYEBROW[entree.type]} />
        </div>
        <h2
          className="mt-[6px] text-center text-[28px] leading-[1.15] text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-title)" }}
        >
          {entree.titre}
        </h2>
        <p className="mt-[16px] text-left font-mono text-[13px] leading-[1.55] text-[var(--color-ink)]">
          {entree.corps}
        </p>
        {/* Le vide sous un texte court est normal et voulu (spec). */}
        <p className="mt-[16px] text-left font-mono text-[12px] text-[var(--color-ink)] opacity-50">
          Découvert par {prov?.par || "Sans-Nom"} — Jour {romain(prov?.jour ?? 1)}
        </p>
      </div>
    </div>
  );
}
