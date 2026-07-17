---
description: Importe les images Leonardo (dossier ou URLs), applique le dithering canonique PACTUM et range les sorties dans le Drive « 01_En attente »
---

Importer et traiter des illustrations Leonardo pour PACTUM.

Arguments reçus : `$ARGUMENTS`

## Étapes

1. Exécute le script du pipeline depuis la racine du repo :
   - Sans argument : `python3 tools/dither_batch.py` (traite toutes les images de `~/Downloads`).
   - Avec arguments (chemins de fichiers, dossier, ou URLs `cdn.leonardo.ai`) : `python3 tools/dither_batch.py <arguments>`.
     - Si un argument est un DOSSIER, passe-le via `--src <dossier>` sans autre entrée.
     - Les URLs Leonardo sont acceptées telles quelles : le script force lui-même la version HD (`?w=1875`) — ne jamais télécharger une miniature `?w=512` à la main.
2. Le script fait tout le travail déterministe (ne pas le réimplémenter à la main) :
   - recadrage carré centré puis 1000×1000 max (jamais d'upscale) ;
   - dithering canonique verrouillé (Floyd-Steinberg seuil strict 182, contraste 151 % pivot 128, Charbon `#1c1a16` / Orange `#e0632a`, PNG palette) — portage de `generateur_dithering_v4_dispatch_fidele_2.html`, specs dans `.claude/skills/pactum-style/references/dithering.md` ;
   - rangement par préfixe dans `~/Library/CloudStorage/GoogleDrive-patrick.morvan21@gmail.com/Mon Drive/Professionnel/APP/Photos/01_En attente/` :
     `monstre_*` → `1_Rencontres`, `scene_*` → `2_Environnement`, `objet_*` → `3_Objets`, préfixe inconnu → `_a_trier` ;
   - vérification de chaque copie (taille identique + PNG relisible).
3. Si le script échoue avec « Pillow manquant », lance `python3 -m pip install pillow` puis relance-le.
4. Restitue le récapitulatif du script à l'utilisateur tel quel (fichiers OK par dossier, erreurs, copies à revérifier), et signale explicitement :
   - tout fichier parti dans `_a_trier` (renommer avec le préfixe `{categorie}_{sujet}` puis relancer, ou déplacer à la main) ;
   - toute erreur de téléchargement ou de copie.

## Règles

- Ne jamais modifier les paramètres de dithering (seuil, contraste, palette) — ils sont VERROUILLÉS par le skill `pactum-style`.
- Ne pas renommer les fichiers à la place de l'utilisateur : le préfixe fait foi pour le rangement.
- En cas de doute sur le rendu d'une image (silhouette illisible, zones trop bruitées), le dire dans le récapitulatif plutôt que de retoucher l'image.
