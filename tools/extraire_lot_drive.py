#!/usr/bin/env python3
"""Écrit dans `assets/` les PNG d'un lot Drive, lus dans le transcript de session.

    python3 tools/extraire_lot_drive.py data/lots/2026-09-14-croute.json

POURQUOI CE DÉTOUR. Le connecteur Drive rend le base64 **inline** dans le
résultat d'outil. Le faire retranscrire par le modèle le corrompt de façon
DÉTERMINISTE au-delà de ~5 Ko (leçon du 18/07 : trois tentatives, trois fois
la même taille fausse — réessayer ne sert à rien). Le harnais, lui, écrit
fidèlement chaque résultat d'outil dans le `.jsonl` de session : on lit là,
on décode, et le modèle ne recopie pas un octet.

CE QUI REND LE LOT REPRENABLE, ce n'est pas la liste : c'est le contrôLE de
TAILLE. Chaque fichier est écrit seulement si sa signature PNG est valide ET
si sa longueur vaut exactement celle annoncée par le Drive. On peut donc
télécharger par petits lots, relancer autant de fois qu'on veut, et survivre
à une compaction sans jamais écrire un fichier à moitié décodé.

Le manifeste est un JSON de `data/lots/` : `{"fichiers": [{"nom", "octets"}]}`
(le `fileId` y est pour retélécharger, ce script ne s'en sert pas).
"""
import base64, glob, json, os, re, sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(RACINE, "aldenhar/public/assets")
MOTIF = re.compile(
    r'"content":"(iVBORw0KGgo[^"]+)","id":"[^"]*","mimeType":"image/png","title":"([^"]+)"'
)


def attendus(chemin: str) -> dict[str, int]:
    doc = json.load(open(chemin, encoding="utf-8"))
    return {f["nom"]: f["octets"] for f in doc["fichiers"]}


def blobs_du_transcript() -> dict[str, str]:
    """Le base64 de chaque PNG, indexé par son titre Drive."""
    trouves: dict[str, str] = {}
    fichiers = glob.glob("/tmp/claude-*/**/*.jsonl", recursive=True)
    fichiers += glob.glob(os.path.expanduser("~/.claude/projects/**/*.jsonl"), recursive=True)
    for f in fichiers:
        try:
            txt = open(f, encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        for contenu, titre in MOTIF.findall(txt):
            trouves[titre] = contenu
    return trouves


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__.strip().splitlines()[2].strip())
        return 2
    attendu, blobs = attendus(sys.argv[1]), blobs_du_transcript()
    ok = manque = faux = 0
    for nom, taille in sorted(attendu.items()):
        if nom not in blobs:
            print(f"  .. {nom} : pas encore dans le transcript")
            manque += 1
            continue
        d = base64.b64decode(blobs[nom])
        if not d.startswith(b"\x89PNG\r\n\x1a\n"):
            print(f"  XX {nom} : signature PNG invalide")
            faux += 1
            continue
        if len(d) != taille:
            print(f"  XX {nom} : {len(d)} octets, attendu {taille}")
            faux += 1
            continue
        open(os.path.join(ASSETS, nom), "wb").write(d)
        print(f"  ok {nom} ({len(d)} o)")
        ok += 1
    print(f"\n{ok} écrites, {manque} en attente, {faux} rejetées")
    return 1 if faux else 0


if __name__ == "__main__":
    raise SystemExit(main())
