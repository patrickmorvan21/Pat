"use client";

import { REFERENCE_GAMES, CATALOGUE_GAMES, type MiniGameEntry } from "@/lib/minigames-data";
import { SURPRISES } from "@/lib/surprises-data";
import MiniGamePlayer from "./MiniGamePlayer";
import SurprisePreview from "@/components/surprises/SurprisePreview";

const CATEGORIES: MiniGameEntry["category"][] = ["Ruse", "Courage", "Instinct", "Empathie", "Mixte"];

/**
 * Galerie de revue — pas un écran du jeu : une page à part pour que Patrick
 * teste chaque mini-jeu et surprise en isolation et donne son feedback par
 * numéro de catalogue, sans avoir à déclencher les événements en jouant.
 */
export default function MiniGamesGallery() {
  return (
    <main className="minijeux-page">
      <header className="minijeux-header">
        <h1>PACTUM — Mini-jeux &amp; Surprises</h1>
        <p>
          Galerie de revue (11/07/2026). Chaque carte est indépendante et rejouable — bascule le palier de
          stat pour voir « la stat module la difficulté » en action. Réfère-toi au numéro de catalogue
          (#01…#21, réf. pour les 4 fondateurs) dans tes retours.
        </p>
      </header>

      <section className="minijeux-section">
        <h2>Les 4 références validées</h2>
        <div className="minijeux-grid">
          {REFERENCE_GAMES.map((entry) => (
            <MiniGamePlayer key={entry.id} entry={entry} />
          ))}
        </div>
      </section>

      {CATEGORIES.map((cat) => {
        const items = CATALOGUE_GAMES.filter((e) => e.category === cat);
        if (items.length === 0) return null;
        return (
          <section className="minijeux-section" key={cat}>
            <h2>{cat}</h2>
            <div className="minijeux-grid">
              {items.map((entry) => (
                <MiniGamePlayer key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        );
      })}

      <section className="minijeux-section">
        <h2>Éléments de surprise (11)</h2>
        <div className="minijeux-grid">
          {SURPRISES.map((entry) => (
            <SurprisePreview key={entry.id} entry={entry} />
          ))}
        </div>
      </section>

      <footer className="minijeux-footer">
        <a href="../">← Retour au jeu</a>
      </footer>
    </main>
  );
}
