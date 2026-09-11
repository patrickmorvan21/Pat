"use client";

import { useEffect, useRef, useState } from "react";
import { CloseX, HomeCta } from "@/components/Home";
import { track } from "@/lib/analytics";
import { APP_VERSION } from "@/lib/version";

/**
 * DONNER SON AVIS — le questionnaire de trois minutes (Patrick, 10/09, pour
 * la démo). Plein cadre, par-dessus l'écran qui l'ouvre (Options, Inventaire,
 * la carte de la deuxième mort). Les réponses partent dans PostHog comme UN
 * événement `avis_envoye` : pas de formulaire externe, pas de compte à créer,
 * rien à héberger — et les réponses se croisent avec ce que la personne a
 * réellement joué (même identité anonyme que les autres événements).
 *
 * Pourquoi ces huit questions, et pas d'autres : chacune répond à UNE
 * décision que Patrick doit prendre —
 *   1. envie de relancer  → le jeu accroche-t-il ? (la seule question qui
 *                            compte si on n'en garde qu'une)
 *   2. compréhension      → le monde se lit-il sans qu'on l'explique ?
 *   3. quantité de texte  → le grief historique (« trop de lecture »)
 *   4. difficulté         → le curseur du barème physique
 *   5. le dé              → le geste central, frustrant ou satisfaisant ?
 *   6. meilleur moment    → ce qu'il faut garder à tout prix
 *   7. moment confus      → ce qu'il faut corriger en premier
 *   8. habitude de jeu    → lire 1-7 selon le profil (un habitué du roguelite
 *                            ne juge pas la difficulté comme un néophyte)
 * plus un champ libre FACULTATIF sur l'écran d'envoi.
 *
 * ⚠️ Le champ libre est une SAISIE DE TEXTE — la règle du jeu l'interdit
 * partout (« aucune saisie de texte libre »), et c'est une exception assumée :
 * ce n'est pas du gameplay, c'est hors fiction, et « une chose à changer »
 * dite avec ses mots vaut plus que dix cases. Il n'est jamais obligatoire.
 *
 * Les jauges sont CINQ CARRÉS pleins (la grammaire des points de l'intro et
 * des étapes du Seuil) — jamais un curseur, jamais un chiffre affiché.
 *
 * Une fois par compte : `pactum-avis` retient la date d'envoi. Rouvrir le
 * questionnaire montre alors un remerciement, avec la possibilité de
 * répondre à nouveau (une seconde vie change parfois l'avis).
 */

export type SourceAvis = "options" | "inventaire" | "mort" | "accueil";

const CLE = "pactum-avis";

type Jauge = 1 | 2 | 3 | 4 | 5;

type Reponses = {
  relancer?: Jauge;
  comprehension?: Jauge;
  texte?: "trop_peu" | "juste" | "trop";
  difficulte?: "trop_facile" | "juste" | "trop_dure";
  de?: Jauge;
  meilleur?: string;
  confus?: string;
  habitue?: "oui" | "non";
  libre?: string;
};

const MOMENTS: { v: string; label: string }[] = [
  { v: "borne", label: "La Borne, au tout début" },
  { v: "hameau", label: "Le Hameau et son Serment" },
  { v: "colline", label: "La Colline aux Gibets" },
  { v: "combat", label: "Un combat" },
  { v: "falaise", label: "La Falaise et la descente" },
  { v: "geolier", label: "Le Geôlier qui parle" },
  { v: "mort", label: "Ma mort" },
  { v: "objet", label: "Un objet trouvé" },
  { v: "aucun", label: "Aucun en particulier" },
];

type Etape =
  | { kind: "jauge"; id: "relancer" | "comprehension" | "de"; q: string; bas: string; haut: string }
  | { kind: "choix"; id: "texte" | "difficulte" | "habitue" | "meilleur" | "confus"; q: string; options: { v: string; label: string }[] };

const ETAPES: Etape[] = [
  { kind: "jauge", id: "relancer", q: "Là, tout de suite : envie de relancer une partie ?", bas: "Pas du tout", haut: "Tout de suite" },
  { kind: "jauge", id: "comprehension", q: "Tu as compris où tu étais, et ce qu'on attendait de toi ?", bas: "Perdu", haut: "Tout à fait" },
  { kind: "choix", id: "texte", q: "La quantité de texte à lire ?", options: [{ v: "trop_peu", label: "Trop peu" }, { v: "juste", label: "Juste ce qu'il faut" }, { v: "trop", label: "Trop" }] },
  { kind: "choix", id: "difficulte", q: "La difficulté ?", options: [{ v: "trop_facile", label: "Trop facile" }, { v: "juste", label: "Juste" }, { v: "trop_dure", label: "Trop dure" }] },
  { kind: "jauge", id: "de", q: "Lancer le dé, c'était…", bas: "Frustrant", haut: "Satisfaisant" },
  { kind: "choix", id: "meilleur", q: "Le meilleur moment ?", options: MOMENTS },
  { kind: "choix", id: "confus", q: "Le moment le plus confus ?", options: MOMENTS },
  { kind: "choix", id: "habitue", q: "Tu joues souvent à des jeux narratifs ou roguelite ?", options: [{ v: "oui", label: "Oui, souvent" }, { v: "non", label: "Non, rarement" }] },
];

function appareil(): string {
  try {
    const ua = navigator.userAgent;
    const pwa =
      (navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    const os = /iPhone|iPad|iPod/.test(ua) ? "ios" : /Android/.test(ua) ? "android" : "desktop";
    return pwa ? `${os}-pwa` : os;
  } catch {
    return "inconnu";
  }
}

export function avisDejaDonne(): boolean {
  try {
    return !!window.localStorage.getItem(CLE);
  } catch {
    return false;
  }
}

export default function Avis({ source, onClose }: { source: SourceAvis; onClose: () => void }) {
  // Lu à la construction (le composant ne se monte que sur un geste, jamais
  // au prérendu) : un effet différé laissait une frame où la question 1
  // s'affichait avant le remerciement.
  const [deja, setDeja] = useState(() => typeof window !== "undefined" && avisDejaDonne());
  const [i, setI] = useState(0);
  const [rep, setRep] = useState<Reponses>({});
  const [envoye, setEnvoye] = useState(false);
  const debut = useRef<number>(0);

  useEffect(() => {
    debut.current = Date.now();
    track("avis_ouvert", { source });
  }, [source]);

  const fin = i >= ETAPES.length;
  const etape = fin ? null : ETAPES[i];

  function fermer() {
    if (!envoye) track("avis_ferme", { source, question: fin ? "envoi" : i + 1 });
    onClose();
  }

  function repondre<K extends keyof Reponses>(k: K, v: Reponses[K]) {
    setRep((r) => ({ ...r, [k]: v }));
    // On avance tout seul : une question, une réponse, l'écran suivant. Le
    // lien « Précédent » rattrape une erreur.
    window.setTimeout(() => setI((n) => n + 1), 140);
  }

  function envoyer() {
    const duree_s = Math.round((Date.now() - debut.current) / 1000);
    track(
      "avis_envoye",
      {
        source,
        version: APP_VERSION,
        appareil: appareil(),
        duree_s,
        relancer: rep.relancer,
        comprehension: rep.comprehension,
        texte: rep.texte,
        difficulte: rep.difficulte,
        de: rep.de,
        meilleur: rep.meilleur,
        confus: rep.confus,
        habitue: rep.habitue,
        libre: rep.libre?.trim().slice(0, 280) || undefined,
      },
      { instant: true }
    );
    try {
      window.localStorage.setItem(CLE, new Date().toISOString());
    } catch {}
    setEnvoye(true);
  }

  return (
    <div className="absolute inset-0 z-[9] flex flex-col bg-[var(--color-bg)]" data-avis>
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+11px)] right-[10px] z-[1]">
        <CloseX onClose={fermer} />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-[30px] pt-[64px] pb-[30px]">
        {envoye ? (
          <Merci onClose={onClose} />
        ) : deja && i === 0 && Object.keys(rep).length === 0 ? (
          <DejaRepondu onEncore={() => setDeja(false)} onClose={onClose} />
        ) : etape ? (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[2px] text-[var(--color-ink)] opacity-50">
              Ton avis · 3 minutes
            </p>
            <h2 className="mt-[14px] font-serif text-[26px] leading-[1.15] text-[var(--color-accent)]" style={{ textWrap: "balance" }}>
              {etape.q}
            </h2>

            <div className="mt-[28px]">
              {etape.kind === "jauge" ? (
                <JaugeCarres
                  value={rep[etape.id]}
                  bas={etape.bas}
                  haut={etape.haut}
                  onChange={(v) => repondre(etape.id, v)}
                />
              ) : (
                <div className="flex flex-col gap-[8px]">
                  {etape.options.map((o) => (
                    <OptionAvis
                      key={o.v}
                      label={o.label}
                      selected={rep[etape.id] === o.v}
                      onClick={() => repondre(etape.id, o.v as never)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-auto flex items-end justify-between pt-[24px]">
              {i > 0 ? (
                <button type="button" onClick={() => setI(i - 1)} className="font-mono text-[12px] text-[var(--color-ink)] opacity-50 underline">
                  Précédent
                </button>
              ) : (
                <span />
              )}
              <Etapes n={ETAPES.length} actif={i} />
            </div>
          </>
        ) : (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[2px] text-[var(--color-ink)] opacity-50">
              Dernière chose · facultatif
            </p>
            <h2 className="mt-[14px] font-serif text-[26px] leading-[1.15] text-[var(--color-accent)]">
              Une chose à changer ?
            </h2>
            {/* La seule saisie de texte libre du jeu — hors fiction, jamais
                obligatoire (voir l'en-tête du fichier). */}
            <textarea
              value={rep.libre ?? ""}
              onChange={(e) => setRep((r) => ({ ...r, libre: e.target.value }))}
              maxLength={280}
              rows={4}
              placeholder="Avec tes mots. Une phrase suffit."
              data-avis-libre
              className="mt-[20px] w-full resize-none border border-solid border-white/30 bg-transparent p-[10px] font-mono text-[13px] leading-[1.5] text-[var(--color-ink)] placeholder:text-white/30 focus:border-[var(--color-accent)] focus:outline-none"
            />
            <div className="mt-auto flex flex-col gap-[14px] pt-[24px]">
              <HomeCta label="Envoyer" onClick={envoyer} />
              <div className="flex items-end justify-between">
                <button type="button" onClick={() => setI(i - 1)} className="font-mono text-[12px] text-[var(--color-ink)] opacity-50 underline">
                  Précédent
                </button>
                <Etapes n={ETAPES.length} actif={ETAPES.length} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Cinq carrés pleins — jamais un curseur (grammaire des points de l'intro). */
function JaugeCarres({ value, bas, haut, onChange }: { value?: Jauge; bas: string; haut: string; onChange: (v: Jauge) => void }) {
  return (
    <div data-jauge>
      <div className="flex items-center justify-between">
        {([1, 2, 3, 4, 5] as Jauge[]).map((v) => (
          <button
            key={v}
            type="button"
            aria-label={`${v} sur 5`}
            onClick={() => onChange(v)}
            data-jauge-v={v}
            className="flex size-[52px] cursor-pointer items-center justify-center border-none bg-transparent"
          >
            <span
              className={`block size-[22px] border border-solid border-[var(--color-accent)] ${
                value !== undefined && v <= value ? "bg-[var(--color-accent)]" : "bg-transparent"
              }`}
            />
          </button>
        ))}
      </div>
      <div className="mt-[6px] flex justify-between font-mono text-[11px] text-[var(--color-ink)] opacity-50">
        <span>{bas}</span>
        <span>{haut}</span>
      </div>
    </div>
  );
}

/** Une option : cadre blanc fin ; choisie = plein orange, texte charbon
    (l'inversion des CTA de choix). */
function OptionAvis({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative min-h-[44px] w-full cursor-pointer border border-solid px-[14px] text-left font-mono text-[13px] leading-[1.3] ${
        selected
          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-bg)]"
          : "border-white/30 bg-transparent text-[var(--color-ink)]"
      }`}
    >
      {label}
    </button>
  );
}

/** Les étapes en carrés (la grammaire du Seuil) : plein = fait, creux = à venir. */
function Etapes({ n, actif }: { n: number; actif: number }) {
  return (
    <div className="flex gap-[6px]" aria-hidden>
      {Array.from({ length: n }, (_, k) => (
        <span
          key={k}
          className={`block size-[6px] border border-solid border-[var(--color-ink)] ${
            k < actif ? "bg-[var(--color-ink)]" : k === actif ? "bg-[var(--color-accent)] border-[var(--color-accent)]" : "bg-transparent opacity-50"
          }`}
        />
      ))}
    </div>
  );
}

function Merci({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col" data-avis-merci>
      <h2 className="mt-[40px] font-serif text-[34px] leading-[1.1] text-[var(--color-accent)]">C&apos;est noté.</h2>
      <p className="mt-[16px] font-mono text-[13px] leading-[1.5] text-[var(--color-ink)]">
        Le Geôlier lit tout. Il ne remercie jamais — alors je le fais pour lui : merci.
      </p>
      <div className="mt-auto">
        <HomeCta label="Revenir" onClick={onClose} />
      </div>
    </div>
  );
}

function DejaRepondu({ onEncore, onClose }: { onEncore: () => void; onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col" data-avis-deja>
      <h2 className="mt-[40px] font-serif text-[34px] leading-[1.1] text-[var(--color-accent)]">Tu as déjà parlé.</h2>
      <p className="mt-[16px] font-mono text-[13px] leading-[1.5] text-[var(--color-ink)]">
        Ton avis est arrivé. Si une autre vie l&apos;a changé, tu peux le redire.
      </p>
      <div className="mt-auto flex flex-col gap-[14px]">
        <HomeCta label="Répondre à nouveau" secondary onClick={onEncore} />
        <HomeCta label="Revenir" onClick={onClose} />
      </div>
    </div>
  );
}
