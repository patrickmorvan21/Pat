# Aldenhar — Prototype scène III

Prototype web du livre-jeu narratif dark fantasy (une scène jouable), reproduction 1:1
de la frame Figma `Test-App` (node `1903:358`), avec le dé d20 tactile 3D intégré.

## Lancer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000 — idéalement en mode responsive 390×848 ou sur un
vrai téléphone (le geste tactile et l'haptique ne s'apprécient que là).

## Ce qui est implémenté

- **La scène Figma** : status bar simulée, en-tête chapitre + menu 3×3, illustration
  tramée pré-faite, narration, 3 choix (risqué avec tag `COURAGE`, neutre, verrouillé
  grisé avec tag `EMPATHIE`), bannière du Geôlier avec bord tramé et réplique statistique.
- **Le dé d20 tactile** (`components/Die3D.tsx`) : moteur repris tel quel de
  `reference/REFERENCE_de_3d_tactile.html` — saisie sur le dé uniquement, roulement
  sous le doigt, lancer à l'élan réel (vélocité sur ~110 ms), rebonds aux bords,
  haptique proportionnelle, rendu Three.js basse résolution upscalé en pixel-art,
  faces tramées en damier, voile pendant le lancer, face gagnante inversée au verdict.
  Seuil branché sur le choix `COURAGE` (12).
- **Sauvegarde locale** (`lib/state.ts`) : l'état de la run est persisté en
  localStorage — fermer l'app ne compte jamais comme une mort.

## Direction artistique

Tokens dans `app/globals.css` : le thème par défaut suit les valeurs exactes du Figma
(`#1c1a16` / `#e0632a` / blanc, Roboto Mono + Inter). La trichromie du brief
(nuit / brique / sable, VT323 + Jacquard 12) est disponible en ajoutant la classe
`theme-brief` sur `<html>`.

## Structure

```
app/            layout (fonts, viewport), page, tokens + animations CSS
components/     Scene, StatusBar, ChoiceButton, JailerBanner, Die3D
lib/            scene-data (contenu + verdicts), state (localStorage)
public/assets/  illustrations tramées pré-faites (extraites du design)
reference/      REFERENCE_de_3d_tactile.html (moteur du dé, source de vérité)
```
