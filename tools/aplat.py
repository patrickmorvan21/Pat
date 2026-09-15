#!/usr/bin/env python3
"""
LE TAUX D'APLAT — trier une sortie Leonardo AVANT de la regarder longtemps.

Ce que ça mesure : la part de pixels dont les quatre voisins orthogonaux ont
la même couleur. Sur une image tramée Floyd-Steinberg, c'est exactement la
part de l'image qui est un APLAT plutôt qu'un nuage de points.

⚠️ CE N'EST PAS UNE NOTE DE BEAUTÉ, et il ne faut pas le lire comme telle.
C'est un détecteur d'un défaut précis : une source en demi-tons, que le
dithering rend en grain gris uniforme au lieu des grandes masses franches des
références de Patrick. Une image peut être très haute en aplat et ratée (un
cadrage plat), ou basse et volontairement texturée. Le chiffre dit « regarde
celle-ci en premier », jamais « jette-la ».

Étalonné le 15/09 sur les 20 images des Salines, et il classe comme l'œil :
  < 70 %  — ça lit gris et sale, la silhouette se perd (entrepôt, bouche,
            radeau, établissement de la Croûte, rive haute)
  70-85 % — lisible mais mou
  > 85 %  — la franchise des références (piqueurs, héron, quai v3, statue,
            terrasses)

Mesuré sur une réduction NEAREST en 300×300 : à la résolution native, un
pixel de trame isolé fait chuter le score de tout le monde et le classement
s'écrase. NEAREST et pas LANCZOS — un rééchantillonnage lissé INVENTE des
couleurs intermédiaires, donc plus aucun voisin n'est « la même couleur ».

    python3 tools/aplat.py aldenhar/public/assets/scene_salines_*.png
"""
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit("aplat : Pillow manquant — python3 -m pip install pillow")

COTE = 300


def aplat(chemin: Path) -> float:
    im = Image.open(chemin).convert("RGB").resize((COTE, COTE), Image.NEAREST)
    px = im.load()
    plein = 0
    for y in range(1, COTE - 1):
        for x in range(1, COTE - 1):
            c = px[x, y]
            if c == px[x - 1, y] and c == px[x + 1, y] and c == px[x, y - 1] and c == px[x, y + 1]:
                plein += 1
    return 100.0 * plein / ((COTE - 2) ** 2)


def main(argv: list[str]) -> int:
    chemins = [Path(a) for a in argv]
    if not chemins:
        raise SystemExit(__doc__.strip().splitlines()[-1].strip())
    mesures = []
    for c in chemins:
        if not c.is_file():
            print(f"  ?? {c} — introuvable")
            continue
        mesures.append((aplat(c), c))
    mesures.sort()
    for v, c in mesures:
        marque = "!!" if v < 70 else ("~ " if v < 85 else "ok")
        print(f"  {marque} {v:5.1f} %  {c.name}")
    if mesures:
        moy = sum(v for v, _ in mesures) / len(mesures)
        bas = sum(1 for v, _ in mesures if v < 70)
        print(f"\n  {len(mesures)} images · moyenne {moy:.1f} % · {bas} sous 70 %")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
