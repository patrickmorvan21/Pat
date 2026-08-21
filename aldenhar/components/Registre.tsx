"use client";

/**
 * L'ÉCRAN DU GRAND REGISTRE — maquette Figma 2265:24560, journal Notion 26/07.
 *
 * Géométrie relevée sur la maquette (cadre 390 de large) :
 *   illustration 390×390 + bande de dissolution 42px · bloc de tête x=15 y=325
 *   (titre 26px, sous-titre à +46, onglets 175×34 à +92, gouttière 11) ·
 *   en-têtes de colonnes y=481 (x=15 « rang », x=77 « nom ») · liste x=15
 *   y=511, une ligne toutes les 50px, rang 15px medium tracking 3, nom 13px
 *   capitales, cause 11px à 50 % · ligne du joueur = bande pleine largeur 47px
 *   avec un liseré orange de 4px au bord gauche · croix 32×32 à x=348 y=11.
 *
 * Colonne JOURS à droite (en-tête x=337, valeurs alignées à droite) : elle est
 * arrivée dans la maquette le 26/07, après une première passe où elle manquait.
 * La ligne verrouillée n'en a pas — ses onze mille jours sont dans son
 * sous-titre, précisément parce qu'ils ne se comparent à rien.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { loadMemory } from "@/lib/player-memory";
import { buildLesCent, mesMorts, type RegistreEntry } from "@/lib/registre-data";
import { assetUrl, assetCss } from "@/lib/assets";

const PAGE = 12;

/**
 * Le nom de la première place, GRATTÉ (§1 : « rendu gratté, pas un blanc »).
 * Un semis de pixels orange en forme de ligne de texte : on voit qu'il y avait
 * un nom, on ne peut pas le lire. Tiré une fois, jamais réanimé — c'est une
 * rature dans un livre, pas un effet.
 */
export function NomGratte() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const W = 190;
    const H = 13;
    cv.width = W;
    cv.height = H;
    const x = cv.getContext("2d");
    if (!x) return;
    x.clearRect(0, 0, W, H);
    // Générateur seedé : la rature est la même à chaque ouverture.
    let s = 0x5f3a;
    const rnd = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    // Des blocs de largeur de lettre, remplis de pixels au hasard : la densité
    // dessine des « mots » sans qu'aucune forme ne soit lisible.
    let px = 0;
    while (px < W - 6) {
      const larg = 5 + Math.floor(rnd() * 7);
      const densite = 0.3 + rnd() * 0.4;
      for (let i = 0; i < larg; i++) {
        for (let j = 1; j < H - 1; j++) {
          if (rnd() > densite) continue;
          x.fillStyle = rnd() < 0.75 ? "#e0632a" : "rgba(224,99,42,.45)";
          x.fillRect(px + i, j, 1, 1);
        }
      }
      px += larg + 2 + Math.floor(rnd() * 3);
    }
  }, []);
  return (
    <canvas
      ref={ref}
      className="block h-[13px] w-[190px]"
      style={{ imageRendering: "pixelated" }}
      aria-label="un nom illisible"
    />
  );
}

function Onglet({
  label,
  actif,
  onClick,
}: {
  label: string;
  actif: boolean;
  onClick: () => void;
}) {
  // Même structure que les CTA du jeu : fond + bordure en calques enfants,
  // entailles de coin par-dessus au ras de l'angle (jamais une bordure CSS sur
  // le bouton lui-même, qui décalerait les entailles d'un pixel).
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-[34px] flex-1 cursor-pointer border-none bg-transparent font-mono text-[12px] tracking-[2.4px] ${
        actif ? "text-[var(--color-ink)]" : "text-[var(--color-ink)] opacity-50"
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-0 border border-solid ${
          actif ? "border-[var(--color-ink)]" : "border-[var(--color-ink)]/30"
        }`}
      />
      <span className="pointer-events-none absolute top-0 left-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="pointer-events-none absolute bottom-0 left-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="pointer-events-none absolute top-0 right-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="pointer-events-none absolute bottom-0 right-0 size-[2px] bg-[var(--color-bg)]" aria-hidden />
      <span className="relative">{label}</span>
    </button>
  );
}

/** Une ligne du classement : rang à gauche, nom + cause à 64px. */
function Ligne({ e }: { e: RegistreEntry }) {
  const accent = e.locked;
  return (
    <div className="relative">
      {/* Ligne du joueur : bande pleine largeur qui déborde des marges du
          contenu, avec le liseré orange collé au bord gauche du cadre. */}
      {e.isPlayer && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute top-[-11px] bottom-[-11px] left-[-15px] right-[-15px]"
            style={{ background: "color-mix(in srgb, var(--color-accent) 16%, transparent)" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-[-11px] bottom-[-11px] left-[-15px] w-[4px] bg-[var(--color-accent)]"
          />
        </>
      )}
      <div className="relative flex items-start">
        <span
          className={`w-[64px] shrink-0 font-mono text-[15px] font-medium tracking-[3px] ${
            accent ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"
          }`}
        >
          {e.rank}
        </span>
        {/* Pas de couleur spéciale sur le nom du joueur : la maquette le repère
            par le LISERÉ, « pas de badge » — et pas davantage par une exception
            de couleur. */}
        <span className="min-w-0 flex-1">
          {e.locked ? (
            <NomGratte />
          ) : (
            <span className="block font-mono text-[13px] uppercase text-[var(--color-ink)]">
              {e.name}
            </span>
          )}
          <span
            className={`mt-[8px] block font-mono text-[11px] ${
              accent ? "text-[var(--color-accent)]" : "text-[var(--color-ink)] opacity-50"
            }`}
          >
            {e.locked ? `${e.days.toLocaleString("fr-FR")} ${e.cause}` : e.cause}
          </span>
        </span>
        {/* La ligne verrouillée n'a pas de valeur ici : ses jours sont dans son
            sous-titre, parce qu'ils ne se comparent à rien. */}
        {/* LE STATUT DU SURVIVANT (14/08). Les Cent classent par jours
            survécus : le nombre EST le sujet, donc c'est lui qui porte le
            statut. Un héros revenu vivant a ses jours en accent — pas de
            badge, pas de couleur neuve, et ça se lit dans une liste où tout
            le reste est un mort. */}
        {!e.locked && (
          <span
            className={`w-[42px] shrink-0 text-right font-mono text-[15px] font-medium ${
              e.destin === "traversee" ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"
            }`}
          >
            {e.days}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Registre({
  heroName,
  playerDays,
  onClose,
}: {
  heroName: string;
  playerDays: number;
  onClose: () => void;
}) {
  const [onglet, setOnglet] = useState<"cent" | "morts">("cent");
  const [vus, setVus] = useState(PAGE);

  const mem = useMemo(() => loadMemory(), []);
  const cent = useMemo(
    () => buildLesCent(mem, heroName, playerDays),
    [mem, heroName, playerDays]
  );
  const morts = useMemo(() => mesMorts(mem), [mem]);

  const listeCent = cent.slice(0, vus);
  const reste = cent.length - listeCent.length;

  return (
    <div className="absolute inset-0 z-[9] flex flex-col overflow-y-auto bg-[var(--color-bg)]">
      {/* Croix de fermeture : posée comme l'icône de menu du jeu (11/10), et
          fixe — la liste défile dessous, on doit pouvoir sortir à tout moment. */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="fixed z-[11] block size-[32px] cursor-pointer border-none bg-transparent p-0"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 11px)", right: "max(10px, calc(50vw - 185px))" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={assetUrl("assets/croix_menu.png")} className="block size-full" style={{ imageRendering: "pixelated" }} />
      </button>

      <div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- rendu pixelated, jamais optimisé par next/image */}
        <img
          src={assetUrl("assets/objet_grand_registre_d.png")}
          alt=""
          className="block h-[390px] w-[390px] object-cover"
          style={{ imageRendering: "pixelated" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[42px]"
          style={{
            backgroundImage: assetCss("assets/bande_dissolution_haut.svg"),
            backgroundSize: "390px 41px",
            backgroundRepeat: "repeat-x",
            transform: "scaleY(-1)",
          }}
        />
      </div>

      {/* Bloc de tête : il MONTE sur le bas de l'illustration (y=325 dans la
          maquette), dont la matière est déjà dissoute à cette hauteur. */}
      <div className="relative z-[1] mt-[-65px] shrink-0 px-[15px]">
        <h1
          className="text-center text-[27px] leading-[1] text-[var(--color-accent)]"
          style={{ fontFamily: "var(--font-title)" }}
        >
          Le Registre
        </h1>
        <p className="mt-[20px] text-center font-mono text-[11px] leading-[1.6] text-[var(--color-ink)]">
          Douze mille avant toi ont poussé cette porte.
          <br />
          Cent tiennent encore dans ce livre.
        </p>
        <div className="mt-[20px] flex gap-[11px]">
          <Onglet label="LES 100" actif={onglet === "cent"} onClick={() => setOnglet("cent")} />
          <Onglet label="TES MORTS" actif={onglet === "morts"} onClick={() => setOnglet("morts")} />
        </div>
      </div>

      {onglet === "cent" ? (
        <div className="shrink-0 px-[15px] pt-[30px] pb-[40px]">
          <div className="flex font-mono text-[9px] uppercase tracking-[1.5px] text-[var(--color-ink)] opacity-50">
            <span className="w-[64px] shrink-0">rang</span>
            <span className="flex-1">nom</span>
            <span>jours</span>
          </div>
          <div className="mt-[22px] flex flex-col gap-[25px]">
            {listeCent.map((e) => (
              <Ligne key={`${e.rank}-${e.name}`} e={e} />
            ))}
          </div>
          {reste > 0 && (
            <button
              type="button"
              onClick={() => setVus((n) => n + PAGE)}
              className="mt-[28px] block w-full cursor-pointer border-none bg-transparent text-center font-mono text-[11px] text-[var(--color-ink)] opacity-50 underline underline-offset-[3px]"
            >
              Descendre dans le Registre
            </button>
          )}
          <p className="mt-[34px] text-center font-mono text-[11px] leading-[1.6] text-[var(--color-ink)] opacity-50">
            Quatre-vingt-dix-neuf places sont prenables.
            <br />
            La première, non.
          </p>
        </div>
      ) : (
        <div className="shrink-0 px-[15px] pt-[30px] pb-[40px]">
          {morts.length === 0 ? (
            <p className="font-mono text-[11px] leading-[1.6] text-[var(--color-ink)] opacity-50">
              Aucun mort à ton nom. Ça viendra.
            </p>
          ) : (
            <div className="flex flex-col gap-[25px]">
              {morts.map((m, i) => (
                <div key={`${m.name}-${i}`} className="relative">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-[-11px] bottom-[-11px] left-[-15px] w-[4px] bg-[var(--color-accent)]"
                  />
                  <div className="flex items-start">
                    <span className="w-[64px] shrink-0 font-mono text-[15px] font-medium tracking-[3px] text-[var(--color-accent)]">
                      J{m.days}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[13px] uppercase text-[var(--color-ink)]">
                        {m.name}
                      </span>
                      <span className="mt-[8px] block font-mono text-[11px] text-[var(--color-ink)] opacity-50">
                        {m.cause}
                      </span>
                      {m.relic && (
                        <span className="mt-[4px] block font-mono text-[11px] text-[var(--color-accent)]">
                          {m.relic}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
