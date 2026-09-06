"use client";

/**
 * LE RETOUR — l'ouverture des vies 2 et suivantes.
 *
 * Le Pacte n'est signé qu'UNE FOIS (brief V2 du 06/09) : si chaque vie
 * resignait, la signature perdrait immédiatement son caractère irréversible.
 * Une réincarnation ne rejoue donc ni le contrat, ni la marque, ni la moindre
 * création de personnage. Elle dit trois choses et rend la main :
 *
 *   1. il te reconnaît ;
 *   2. le contrat court toujours ;
 *   3. tu n'es pas le même.
 *
 * ⚠️ ET ELLE RACCOURCIT AVEC LES VIES. C'est une exigence du brief (§11) et
 * c'est ce qui rend un roguelite tenable : la deuxième vie prend cinq à dix
 * secondes, les suivantes une phrase. Le jeu doit devenir plus rapide à
 * recommencer à mesure qu'on comprend sa structure.
 *
 * Le fond reste NOIR : on n'a pas encore de lieu, et le carton d'acte ne se
 * rejoue pas — c'est le même acte, la même descente, un autre corps.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import TypedText from "@/components/TypedText";
import TouchHint from "@/components/TouchHint";
import { loadMemory } from "@/lib/player-memory";

/**
 * CE QU'IL DIT EN TE REVOYANT — indexé sur la mort précédente, jamais tiré au
 * hasard. Il tient le Registre : il sait comment celui d'avant s'est arrêté.
 */
function accueilDuRetour(): string {
  const m = loadMemory();
  const d = m.lastDeath;
  if (m.derniereFinTraversee) return "Tu es ressorti. Et te revoilà à l'entrée.";
  if (d?.fixation) return "Le hameau a fini par te donner raison. À sa manière.";
  if (typeof d?.day === "number" && d.day <= 1) return "Déjà.";
  if (typeof d?.day === "number" && d.day >= 5) return "Je t'avais cru capable d'aller plus loin. J'avais presque raison.";
  return "Te revoilà.";
}

/** Les beats, du plus bavard au plus sec. Vie 2 : deux. Vie 5+ : un mot. */
function beatsDuRetour(morts: number): string[] {
  if (morts <= 1) return [accueilDuRetour(), "Le Pacte tient encore. Il ne t'a jamais concerné, toi."];
  if (morts <= 3) return [accueilDuRetour(), "Le Pacte tient."];
  return ["Encore."];
}

export default function Retour({ onDone }: { onDone: () => void }) {
  const [beats] = useState<string[]>(() => beatsDuRetour(loadMemory().deaths));
  const [n, setN] = useState(0);
  const [lu, setLu] = useState(false);
  const [skip, setSkip] = useState(0);
  /** ⚠️ Le retour ne doit JAMAIS retenir le joueur : au bout d'un temps de
      lecture, il s'en va tout seul. Le tap n'est qu'un raccourci. */
  const fini = useRef(false);

  const suivant = useCallback(() => {
    if (fini.current) return;
    if (n + 1 < beats.length) {
      setN((k) => k + 1);
      setLu(false);
      return;
    }
    fini.current = true;
    onDone();
  }, [n, beats.length, onDone]);

  useEffect(() => {
    if (!lu) return;
    const t = setTimeout(suivant, 1500);
    return () => clearTimeout(t);
  }, [lu, suivant]);

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div
        className="phone-frame relative flex h-[848px] max-h-[100dvh] w-[390px] shrink-0 flex-col overflow-clip bg-[var(--color-bg)]"
        onClick={() => (lu ? suivant() : setSkip((k) => k + 1))}
      >
        <div className="flex flex-1 items-center justify-center px-[42px]">
          <p className="w-[306px] text-center font-mono text-[13px] leading-[1.6] text-[var(--color-ink)]">
            <TypedText
              key={n}
              text={beats[n]}
              typed
              msPerChar={42}
              skip={skip}
              onDone={() => setLu(true)}
            />
          </p>
        </div>
        {lu && <TouchHint />}
      </div>
    </main>
  );
}
