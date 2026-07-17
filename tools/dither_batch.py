#!/usr/bin/env python3
"""
dither_batch.py — pipeline d'import Leonardo → assets PACTUM (/leo-import).

Traite des images locales ou des URLs cdn.leonardo.ai :
  1. téléchargement si URL (en forçant ?w=1875 — jamais la miniature 512) ;
  2. recadrage CARRÉ centré, puis 1000×1000 (jamais d'upscale : si la source
     est plus petite, on reste à sa taille native) ;
  3. dithering CANONIQUE (portage fidèle de
     `generateur_dithering_v4_dispatch_fidele_2.html`, voir
     .claude/skills/pactum-style/references/dithering.md) :
       - luminance 0.299 R + 0.587 G + 0.114 B
       - contraste LINÉAIRE pivot 128 : v' = (v-128)*1.51 + 128, clamp [0,255]
         (⚠️ jamais PIL ImageEnhance.Contrast — pivote sur la moyenne)
       - Floyd-Steinberg seuil STRICT : on = v > 182, err = v - (on ? 255 : 0),
         diffusion 7/16 droite, 3/16 bas-gauche, 5/16 bas, 1/16 bas-droite,
         buffer NON clampé pendant la diffusion
       - bit 1 (clair) → Orange #e0632a, bit 0 → Charbon #1c1a16
  4. sortie PNG palette (2 couleurs) ;
  5. rangement par préfixe de nom dans le Drive « 01_En attente » :
       monstre_* → 1_Rencontres, scene_* → 2_Environnement, objet_* → 3_Objets
     (préfixe inconnu → sous-dossier _a_trier), avec vérification de chaque
     copie (taille + PNG relisible) et récapitulatif final.

Usage :
  python3 tools/dither_batch.py                      # toutes les images de ~/Downloads
  python3 tools/dither_batch.py fichier.png URL ...  # entrées explicites
  Options : --src DIR (remplace ~/Downloads) · --dest DIR (remplace le Drive)
            --dry-run (traite mais ne range pas)
"""

import argparse
import shutil
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow manquant — installer avec :  python3 -m pip install pillow")

CHARBON = (0x1C, 0x1A, 0x16)
ORANGE = (0xE0, 0x63, 0x2A)
THRESHOLD = 182
CONTRAST = 1.51
TARGET = 1000  # côté du carré de sortie (jamais d'upscale au-delà du natif)

DEST_DEFAULT = (
    Path.home()
    / "Library/CloudStorage/GoogleDrive-patrick.morvan21@gmail.com"
    / "Mon Drive/Professionnel/APP/Photos/01_En attente"
)
ROUTES = {"monstre": "1_Rencontres", "scene": "2_Environnement", "objet": "3_Objets"}
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def leonardo_hd(url: str) -> str:
    """Force la version HD d'une URL CDN Leonardo (w >= 1875, jamais la miniature)."""
    parts = urllib.parse.urlsplit(url)
    query = urllib.parse.parse_qs(parts.query)
    w = int(query.get("w", ["0"])[0] or 0)
    if 0 < w < 1875:
        query["w"] = ["1875"]
        parts = parts._replace(query=urllib.parse.urlencode(query, doseq=True))
    return urllib.parse.urlunsplit(parts)


def fetch(url: str, tmp: Path) -> Path:
    url = leonardo_hd(url)
    name = Path(urllib.parse.urlsplit(url).path).name or "image.png"
    out = tmp / name
    req = urllib.request.Request(url, headers={"User-Agent": "pactum-leo-import"})
    with urllib.request.urlopen(req, timeout=60) as resp, open(out, "wb") as f:
        shutil.copyfileobj(resp, f)
    return out


def square_1000(im: Image.Image) -> Image.Image:
    """Recadrage carré centré puis 1000px — downsample lissé, jamais d'upscale."""
    im = im.convert("RGB")
    w, h = im.size
    side = min(w, h)
    im = im.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
    if side > TARGET:
        # équivalent canvas drawImage + imageSmoothingEnabled (spec canonique)
        im = im.resize((TARGET, TARGET), Image.BILINEAR)
    return im


def dither(im: Image.Image) -> Image.Image:
    """Floyd-Steinberg canonique — portage fidèle du JS, buffer non clampé."""
    w, h = im.size
    px = im.load()
    # luminance + contraste pivot 128, en float non clampé pour la diffusion
    buf = [0.0] * (w * h)
    for y in range(h):
        row = y * w
        for x in range(w):
            r, g, b = px[x, y]
            v = 0.299 * r + 0.587 * g + 0.114 * b
            v = (v - 128.0) * CONTRAST + 128.0
            buf[row + x] = 255.0 if v > 255.0 else (0.0 if v < 0.0 else v)

    out = Image.new("P", (w, h))
    out.putpalette(list(CHARBON) + list(ORANGE) + [0, 0, 0] * 254)
    opx = out.load()
    for y in range(h):
        row = y * w
        below = row + w
        last_row = y == h - 1
        for x in range(w):
            old = buf[row + x]
            on = old > THRESHOLD
            err = old - (255.0 if on else 0.0)
            opx[x, y] = 1 if on else 0
            if x + 1 < w:
                buf[row + x + 1] += err * (7 / 16)
            if not last_row:
                if x > 0:
                    buf[below + x - 1] += err * (3 / 16)
                buf[below + x] += err * (5 / 16)
                if x + 1 < w:
                    buf[below + x + 1] += err * (1 / 16)
    return out


def route_for(name: str) -> str:
    prefix = name.split("_", 1)[0].lower()
    return ROUTES.get(prefix, "_a_trier")


def main() -> int:
    ap = argparse.ArgumentParser(description="Import Leonardo → dithering PACTUM → Drive")
    ap.add_argument("inputs", nargs="*", help="fichiers ou URLs cdn.leonardo.ai (défaut : images de --src)")
    ap.add_argument("--src", default=str(Path.home() / "Downloads"), help="dossier d'entrée par défaut")
    ap.add_argument("--dest", default=str(DEST_DEFAULT), help="racine de rangement (Drive 01_En attente)")
    ap.add_argument("--dry-run", action="store_true", help="traite sans ranger dans le Drive")
    args = ap.parse_args()

    tmp = Path(tempfile.mkdtemp(prefix="leo-import-"))
    work = tmp / "sorties"
    work.mkdir()

    # --- collecte des entrées ---
    sources: list[Path] = []
    if args.inputs:
        for item in args.inputs:
            if item.startswith("http://") or item.startswith("https://"):
                try:
                    sources.append(fetch(item, tmp))
                except Exception as e:  # noqa: BLE001 — on veut un récap, pas un crash
                    print(f"✗ téléchargement échoué : {item} ({e})")
            else:
                p = Path(item).expanduser()
                if p.is_file():
                    sources.append(p)
                else:
                    print(f"✗ fichier introuvable : {item}")
    else:
        src = Path(args.src).expanduser()
        sources = sorted(p for p in src.iterdir() if p.suffix.lower() in IMAGE_EXTS and p.is_file())
    if not sources:
        print("Aucune image à traiter.")
        return 1

    # --- traitement ---
    done: list[tuple[str, str]] = []  # (nom, destination ou erreur)
    failed: list[tuple[str, str]] = []
    for srcfile in sources:
        name = srcfile.stem + ".png"
        try:
            im = square_1000(Image.open(srcfile))
            print(f"… {srcfile.name} → {im.size[0]}×{im.size[1]}, dithering")
            result = dither(im)
            outfile = work / name
            result.save(outfile, optimize=True)
            done.append((name, str(outfile)))
        except Exception as e:  # noqa: BLE001
            failed.append((srcfile.name, str(e)))

    # --- rangement + vérification ---
    recap: list[tuple[str, str, str]] = []  # (nom, dossier, état)
    if not args.dry_run:
        dest_root = Path(args.dest).expanduser()
        for name, outpath in done:
            sub = route_for(name)
            target_dir = dest_root / sub
            target_dir.mkdir(parents=True, exist_ok=True)
            target = target_dir / name
            shutil.copy2(outpath, target)
            ok = target.is_file() and target.stat().st_size == Path(outpath).stat().st_size
            if ok:
                try:
                    Image.open(target).verify()
                except Exception:  # noqa: BLE001
                    ok = False
            if ok:
                Path(outpath).unlink()
            recap.append((name, sub, "OK" if ok else "ÉCHEC COPIE"))
    else:
        recap = [(name, route_for(name), f"dry-run → {path}") for name, path in done]

    # --- récapitulatif ---
    print("\n=== Récapitulatif /leo-import ===")
    for name, sub, state in recap:
        print(f"  {state:12s} {sub:15s} {name}")
    for name, err in failed:
        print(f"  ERREUR       —               {name} ({err})")
    bad = [r for r in recap if r[2] != "OK" and not args.dry_run]
    print(f"{len(recap)} traité(s), {len(failed)} en erreur, {len(bad)} copie(s) à revérifier.")
    if any(sub == "_a_trier" for _, sub, _ in recap):
        print("⚠️  Préfixe inconnu (ni monstre_/scene_/objet_) → rangé dans _a_trier/.")
    return 0 if not failed and not bad else 1


if __name__ == "__main__":
    sys.exit(main())
