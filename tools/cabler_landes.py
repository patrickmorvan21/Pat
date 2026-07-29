#!/usr/bin/env python3
"""
Câble dans le jeu toutes les images des Landes présentes sur le disque.

Le lot du 28/07 est nommé d'après les IDENTIFIANTS D'ÉCRAN de l'atelier
(`monstre_epoux_2_c.png` → écran `epoux-2`), ce qui rend le rattachement
automatique : on rabote le préfixe de catégorie et le suffixe de variante,
on remplace les tirets bas par des tirets, et on cherche l'écran.

Aucune image n'est câblée si son fichier n'est pas RÉELLEMENT sur le disque :
pointer vers un fichier absent afficherait une image cassée en jeu, ce qui est
pire que le manque, et invisible dans l'outil de couverture.

    python3 tools/cabler_landes.py [manifeste]            # dit ce qu'il ferait
    python3 tools/cabler_landes.py [manifeste] --ecrire   # écrit .ts + JSON
"""
from __future__ import annotations
import json, re, sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
ASSETS = RACINE / "aldenhar" / "public" / "assets"
ZONE = RACINE / "data" / "zones" / "landes.json"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from atelier import reporter_dans_ts  # noqa: E402  (même logique d'écriture)

def charger_lot(chemin: Path) -> dict[str, str]:
    """{nom de fichier: id d'écran}. Un manifeste EXPLICITE, pas une heuristique
    sur tout assets/ : le premier essai balayait le dossier entier et rattachait
    des images de réserve par ressemblance de nom (scene_gibet_vide_c écrasait
    le plan rapproché du Gibet Vide, une vue de marche écrasait le Chemin
    Creux). Un lot se déclare, il ne se devine pas."""
    return json.loads(chemin.read_text(encoding="utf-8"))["fichiers"]


def main() -> int:
    ecrire = "--ecrire" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    lot = charger_lot(Path(args[0]) if args else RACINE / "data" / "lots" / "2026-07-28-landes.json")
    d = json.loads(ZONE.read_text(encoding="utf-8"))
    par_id = {s["id"]: s for s in d["scenes"]}

    poses, inchanges, absents = [], 0, []
    for nom, sid in lot.items():
        s = par_id.get(sid)
        if s is None:
            absents.append((nom, f"écran « {sid} » inconnu"))
            continue
        if not (ASSETS / nom).exists():
            absents.append((nom, "fichier pas encore sur le disque"))
            continue
        if (s.get("illustration") or "").rsplit("/", 1)[-1] == nom:
            inchanges += 1
            continue
        poses.append((sid, nom, (s.get("illustration") or "—").rsplit("/", 1)[-1]))
        if ecrire:
            s["illustration"] = nom
            print(f"  {sid:24s} → {nom}   [{reporter_dans_ts(sid, 'illustration', nom)}]")

    # Ce qui est demandé par une scène mais absent du disque : à dire, jamais
    # à laisser passer en silence.
    orphelins: list[tuple[str, str]] = []
    for s in d["scenes"]:
        img = (s.get("illustration") or "").rsplit("/", 1)[-1]
        if img and not (ASSETS / img).exists():
            orphelins.append((s["id"], img))

    if ecrire:
        ZONE.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"\n{len(poses)} image(s) à câbler · {inchanges} déjà en place")
    if absents:
        print(f"⏸ {len(absents)} en attente :")
        for nom, pourquoi in absents:
            print(f"  {nom} — {pourquoi}")
    if not ecrire:
        for sid, neuf, vieux in poses:
            print(f"  {sid:24s} : {vieux}  →  {neuf}")
        print("\n(rien écrit — relancer avec --ecrire)")
    if orphelins:
        print(f"\n⚠ {len(orphelins)} référence(s) vers un fichier ABSENT du disque :")
        for sid, img in orphelins:
            print(f"  {sid} → {img}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
