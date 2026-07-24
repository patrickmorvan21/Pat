# Musique PACTUM — fichiers attendus ici

Déposer les 4 mp3 du Drive `PACTUM/Assets/Musique` sous CES noms exacts :

- `intro.mp3`      ← Intro/intro.mp3 (accueil + prologue, boucle)
- `landes_1.mp3`   ← Acte 1/Les Landes/Landes_1.mp3
- `landes_2.mp3`   ← Acte 1/Les Landes/Landes_2.mp3
- `landes_3.mp3`   ← Acte 1/Les Landes/Landes_3.mp3

Le moteur (lib/audio.ts) est déjà branché : tant que les fichiers manquent,
le jeu reste silencieux sans erreur. Dès qu'ils sont là, rebuild + deploy.

NB : les fichiers n'ont pas pu transiter par le connecteur Drive en session
distante (6-12 Mo > limite du connecteur, et le proxy sandbox bloque
drive.google.com). Les déposer via l'interface web GitHub (branche
claude/3d-tactile-prototype-dhd5mi, dossier aldenhar/public/audio/) ou les
fournir en pièces jointes de message.
