# Dithering PACTUM — algorithme canonique

Référence absolue : `generateur_dithering_v4_dispatch_fidele_2.html`.
Port Python validé : `dither_v4.py`. Toute nouvelle implémentation doit
reproduire l'algorithme JS **exactement** puis être validée visuellement
côte à côte contre l'outil HTML sur la même image source.

## Paramètres verrouillés

| Paramètre   | Valeur | Note |
|-------------|--------|------|
| Algorithme  | Floyd-Steinberg | dispatch d'erreur classique 7/16, 3/16, 5/16, 1/16 |
| Pixel size  | 3 (pipeline `/leo-import`) | voir note ci-dessous — 1 dans l'outil HTML canonique d'origine |
| Threshold   | 182 | |
| Contraste   | 151% | formule linéaire pivot 128, voir ci-dessous |
| Inversion   | non | |
| MAXDIM      | 1170 px | = 3× la résolution d'affichage (390px) |
| Couleurs    | Charbon #1c1a16 / Orange #e0632a | bicolore strict |

## Ordre des opérations

1. Redimensionner l'image source : plus grande dimension = 1170 px
   (conserver le ratio).
2. Conversion en niveaux de gris (luminance).
3. **Contraste** — formule linéaire à pivot 128, appliquée par pixel :

   ```
   v' = (v − 128) × 1.51 + 128
   ```

   clampé [0, 255]. ⚠️ **PIÈGE CONNU** : `PIL ImageEnhance.Contrast(1.51)`
   utilise la luminance moyenne de l'image comme pivot, pas 128 —
   le résultat est visuellement différent. Ne jamais l'utiliser.
4. Floyd-Steinberg avec threshold 182 : pixel < 182 → Charbon,
   sinon → Orange (pas d'inversion). Dispatch d'erreur standard :
   droite 7/16, bas-gauche 3/16, bas 5/16, bas-droite 1/16.
5. Sortie PNG bicolore, nommage `{categorie}_{sujet}.png`
   (`scene_`, `monstre_`, `objet_`).

## Note — pixel size du pipeline `/leo-import` (18/07)

Retour Patrick : le rendu 1:1 (grain FS sur toute la résolution de travail,
1170px = 3× l'affichage 390px) était **trop net/lisse** une fois affiché —
le grain n'était visible qu'en zoomant. `tools/dither_batch.py` dithère
maintenant sur une grille réduite (`TARGET // pixel_size`, défaut
`pixel_size=3`) puis ré-agrandit chaque cellule en bloc plein via NEAREST
(pas de lissage) — même logique que le canvas basse-résolution du dé 3D
upscalé en `pixelated`. Seuil/contraste/FS restent identiques à la
référence HTML ; seule la résolution de travail change. Ajustable via
`--pixel-size` si Patrick veut plus/moins de grain après un prochain lot.

## Validation obligatoire

Après toute modification du pipeline (script batch, nouveau port,
changement de lib) :

1. Traiter 2–3 images de référence avec le nouvel outil ET l'outil HTML
   canonique, mêmes paramètres.
2. Comparer côte à côte (page HTML de comparaison, ou diff de screenshots
   via playwright-mcp si disponible).
3. Le moindre écart de trame visible = régression. Corriger avant d'intégrer.

## Contexte d'affichage

- Canvas d'affichage : `image-rendering: pixelated`.
- L'image dithérée est servie à 3× et affichée à taille écran —
  jamais de resize navigateur flou (pas de lissage).
