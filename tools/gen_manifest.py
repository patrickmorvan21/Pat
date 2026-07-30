#!/usr/bin/env python3
"""
LE MANIFESTE DES ASSETS — l'inventaire de vérité de aldenhar/public/assets/.

Pourquoi il existe (30/07) : plusieurs illustrations ont changé de CONTENU en
gardant le MÊME nom de fichier (la meute grise, la petite fixée…). Rien dans
l'URL ne le signalait, donc ni le navigateur ni le service worker n'avaient de
raison d'aller rechercher l'image — Patrick continuait de voir l'ancienne, et
sur le jeu comme sur les pages d'outillage (le SW a pour portée tout
« /Pat/aldenhar/ », l'atelier et la couverture sont dedans).

Le manifeste donne à chaque fichier un HASH COURT de son contenu. Deux usages,
qu'il ne faut pas confondre :
  • le hash dans l'URL (`scene_x.png?v=a3f2b9c1`) — c'est la CURE : une image
    modifiée change d'URL, donc aucun cache ne peut servir l'ancienne ;
  • le hash affiché sur la vignette — c'est le DIAGNOSTIC : deux vignettes au
    même hash sont le même fichier réutilisé.

⚠️ RÈGLE DE PROCESS qui rend tout ça presque inutile, et qu'il faut tenir
quand même : une image regénérée ne garde JAMAIS son nom, elle prend la lettre
de variante suivante (`_c` → `_d`). Le changement devient alors visible dans
l'historique git au lieu d'être un remplacement silencieux. Le hash n'est que
le filet de sécurité pour les fois où la règle saute.

Deux sorties, un seul calcul (jamais de dérive entre les deux) :
  • aldenhar/lib/assets-manifest.json  — minimal (nom → hash), IMPORTÉ par le
    jeu au build : il faut que `assetUrl()` soit synchrone, donc pas de fetch ;
  • aldenhar/public/assets/manifest.json — complet (taille, date, hash, récent)
    + en-tête de fraîcheur, FETCHÉ par l'atelier et la page de couverture.

Lancé automatiquement avant chaque build (`prebuild` de package.json).
"""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
ASSETS = RACINE / "aldenhar/public/assets"
SORTIE_LIB = RACINE / "aldenhar/lib/assets-manifest.json"
SORTIE_PUB = ASSETS / "manifest.json"

# Nombre de commits regardés en arrière pour le filtre « Nouveautés ».
FENETRE_COMMITS = 10


def git(*args: str) -> str:
    try:
        return subprocess.run(
            ["git", *args], cwd=RACINE, capture_output=True, text=True, check=True
        ).stdout.strip()
    except Exception:
        return ""


def fichiers_recents() -> set[str]:
    """Noms d'assets touchés par l'un des N derniers commits.

    Sert au filtre « Nouveautés » : ce qui a bougé depuis la dernière fois que
    Patrick a regardé. Silencieux si git n'est pas disponible (le filtre est
    alors simplement vide, jamais une erreur)."""
    sortie = git(
        "log", f"-{FENETRE_COMMITS}", "--name-only", "--pretty=format:", "--", "aldenhar/public/assets"
    )
    noms = set()
    for ligne in sortie.splitlines():
        ligne = ligne.strip()
        if ligne.endswith("manifest.json"):
            continue  # le manifeste se réécrit à chaque build : jamais « nouveau »
        if ligne:
            noms.add(Path(ligne).name)
    return noms


def main() -> int:
    if not ASSETS.is_dir():
        print(f"ERREUR : {ASSETS} introuvable", file=sys.stderr)
        return 1

    recents = fichiers_recents()
    commit = git("rev-parse", "--short", "HEAD") or "?"
    fichiers: dict[str, dict] = {}
    hashes: dict[str, str] = {}

    for p in sorted(ASSETS.iterdir()):
        if not p.is_file() or p.name == "manifest.json":
            continue
        octets = p.read_bytes()
        h = hashlib.sha1(octets).hexdigest()[:8]
        hashes[p.name] = h
        fichiers[p.name] = {
            "taille": len(octets),
            "modifie": datetime.fromtimestamp(p.stat().st_mtime, timezone.utc)
            .isoformat(timespec="seconds")
            .replace("+00:00", "Z"),
            "hash": h,
            "recent": p.name in recents,
        }

    # Sortie MINIMALE pour le bundle du jeu : seul le hash sert à `assetUrl()`,
    # inutile d'embarquer tailles et dates dans le JS du joueur.
    SORTIE_LIB.write_text(
        json.dumps(hashes, ensure_ascii=False, indent=0, sort_keys=True) + "\n", encoding="utf-8"
    )

    entete = {
        "genere": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "commit": commit,
        "fenetreCommits": FENETRE_COMMITS,
        "fichiers": fichiers,
    }
    SORTIE_PUB.write_text(json.dumps(entete, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    # Doublons de CONTENU : deux noms différents, mêmes octets. À distinguer
    # d'une image réutilisée par deux scènes (ça, c'est l'affaire des pages
    # d'outillage, qui croisent le manifeste avec le câblage).
    par_hash: dict[str, list[str]] = {}
    for nom, h in hashes.items():
        par_hash.setdefault(h, []).append(nom)
    jumeaux = {h: v for h, v in par_hash.items() if len(v) > 1}

    print(f"{SORTIE_PUB.relative_to(RACINE)} — {len(fichiers)} fichiers · commit {commit}")
    print(f"{SORTIE_LIB.relative_to(RACINE)} — {len(hashes)} hash pour le bundle")
    if recents:
        print(f"   récents (≤ {FENETRE_COMMITS} commits) : {len(recents)}")
    if jumeaux:
        print(f"   ⚠️  {len(jumeaux)} contenus en double sous des noms différents :")
        for h, noms in sorted(jumeaux.items()):
            print("      ", h, "→", ", ".join(sorted(noms)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
