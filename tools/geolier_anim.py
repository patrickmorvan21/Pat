#!/usr/bin/env python3
"""
LE GEÔLIER ANIMÉ — vidéo source → deux prototypes pixel art comparables.

Entrée : un mp4 (la vidéo du Geôlier, 1080×1136, ~4 Mo).
Sorties, toutes dans `aldenhar/public/assets/` :

  1. VIDÉO OPTIMISÉE
     geolier_accueil.mp4   — H.264, SANS piste audio, 540 px de large, 12 fps
     geolier_accueil.jpg   — poster statique (première image)

  2. SPRITE SHEET CSS
     geolier_sprite.png    — 16 frames côte à côte, PNG indexé 2 couleurs
     (le poster ci-dessus sert aussi de repli statique)

⚠️ Les DEUX passent par la même réduction pixel : la « version vidéo » n'est
pas une version non-pixel, c'est la même image avec plus de frames. C'est ça
qu'il faut comparer.

⚠️⚠️ ÉCART ASSUMÉ AVEC LE PIPELINE DE DITHERING VERROUILLÉ, à connaître :
la source de cette vidéo est DÉJÀ dans la palette PACTUM (un rendu Midjourney
orange/charbon, avec son propre grain). Le pipeline canonique
(`tools/dither_batch.py` : luminance → contraste 151 % → seuil 182) est fait
pour DÉVELOPPER une photo en couleurs ; l'appliquer à une image déjà
développée donne un résultat INVERSÉ et cassé — vérifié : le fond orange a une
luminance de 130, donc sous le seuil de 182, il ressort en CHARBON, et la
diffusion d'erreur le fait osciller autour du seuil (damier 50/50 sur tout le
fond, silhouette noire à la place du démon).

Ici on projette donc chaque pixel sur l'AXE Charbon→Orange (sa position entre
les deux couleurs, 0..255) et on applique Floyd-Steinberg sur cette valeur, au
seuil médian. Même algorithme de diffusion, même palette stricte, même absence
de dégradé — seule l'entrée change, parce que l'entrée n'est pas de même
nature. À rediscuter avec Patrick si un jour on trame une vidéo en couleurs :
celle-là devrait repasser par le pipeline canonique.

Rien n'est traité au RUNTIME : le sprite est un PNG statique, l'animation est
du CSS pur. Aucune bibliothèque à ajouter au projet Next.js.

Usage :
    python3 tools/geolier_anim.py <video.mp4> [--frames 16] [--fps 12]
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow manquant : python3 -m pip install pillow", file=sys.stderr)
    raise SystemExit(1)

RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / "aldenhar/public/assets"

# ─── constantes VERROUILLÉES par le skill pactum-style (references/dithering.md)
CHARBON = (0x1C, 0x1A, 0x16)
ORANGE = (0xE0, 0x63, 0x2A)
# Grain 2 et non 3 (le défaut des illustrations) : mesuré sur cette source,
# le grain 3 mange entièrement le VISAGE du Geôlier — museau, crocs, anneaux —
# et il ne reste qu'une silhouette. À 2, tout est lisible et la trame reste
# franchement pixel. Réglable par --grain.
GRAIN_DEFAUT = 2

LARGEUR_SPRITE = 360  # largeur d'une frame du sprite, en px d'affichage
LARGEUR_VIDEO = 540  # largeur de la vidéo optimisée


def ffmpeg() -> str:
    """ffmpeg système, sinon le binaire statique fourni par imageio-ffmpeg."""
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        print(
            "ffmpeg introuvable. Installe-le, ou : python3 -m pip install imageio-ffmpeg",
            file=sys.stderr,
        )
        raise SystemExit(1)


def duree(src: Path) -> float:
    out = subprocess.run(
        [ffmpeg(), "-hide_banner", "-i", str(src)], capture_output=True, text=True
    ).stderr
    for ligne in out.splitlines():
        if "Duration:" in ligne:
            h, m, s = ligne.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    raise SystemExit("durée illisible")


def sur_axe(im: Image.Image) -> list[float]:
    """Chaque pixel projeté sur l'axe Charbon→Orange, ramené en 0..255.

    0 = exactement Charbon, 255 = exactement Orange. Les tons intermédiaires
    de la source (le modelé du visage) deviennent des valeurs intermédiaires,
    que Floyd-Steinberg transformera en TEXTURE au lieu de les écraser en
    silhouette — c'est toute la différence avec un simple « couleur la plus
    proche », qui perd le museau et les crocs.
    """
    w, h = im.size
    px = im.convert("RGB").load()
    d = [ORANGE[i] - CHARBON[i] for i in range(3)]
    n = float(sum(v * v for v in d))
    buf = [0.0] * (w * h)
    for y in range(h):
        row = y * w
        for x in range(w):
            r, g, b = px[x, y]
            t = ((r - CHARBON[0]) * d[0] + (g - CHARBON[1]) * d[1] + (b - CHARBON[2]) * d[2]) / n
            buf[row + x] = (0.0 if t < 0 else (1.0 if t > 1 else t)) * 255.0
    return buf


def dither(im: Image.Image) -> Image.Image:
    """Floyd-Steinberg sur l'axe Charbon→Orange, seuil médian.

    L'ordre de diffusion (7/3/5/1 sur 16) et le buffer non clampé sont ceux du
    pipeline canonique — seule l'entrée diffère (voir l'avertissement en tête
    de fichier).
    """
    w, h = im.size
    buf = sur_axe(im)
    SEUIL = 128.0

    out = Image.new("P", (w, h))
    out.putpalette(list(CHARBON) + list(ORANGE) + [0, 0, 0] * 254)
    opx = out.load()
    for y in range(h):
        row = y * w
        below = row + w
        last_row = y == h - 1
        for x in range(w):
            old = buf[row + x]
            on = old > SEUIL
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


def tramer(src: Image.Image, largeur: int, grain: int) -> Image.Image:
    """Une frame → image tramée de `largeur` px, en blocs pleins de GRAIN px.

    Le dithering se fait sur la grille RÉDUITE (largeur // GRAIN) puis on
    ré-agrandit en NEAREST : c'est ce qui donne le gros pixel. Lisser après
    coup détruirait la trame — l'ordre compte.
    """
    w, h = src.size
    gw = max(1, largeur // grain)
    gh = max(1, round(gw * h / w))
    petite = src.convert("RGB").resize((gw, gh), Image.BILINEAR)
    return dither(petite).resize((gw * grain, gh * grain), Image.NEAREST)


def extraire(src: Path, dossier: Path, n: int, total: float) -> list[Path]:
    """`n` images réparties RÉGULIÈREMENT sur toute la durée de la vidéo."""
    chemins = []
    for i in range(n):
        # Décalage d'une demi-fenêtre : on échantillonne le milieu de chaque
        # tranche plutôt que ses bords (la toute dernière image d'un mp4 est
        # souvent identique à l'avant-dernière).
        t = total * (i + 0.5) / n
        p = dossier / f"src{i:03d}.png"
        subprocess.run(
            [ffmpeg(), "-hide_banner", "-loglevel", "error", "-ss", f"{t:.3f}",
             "-i", str(src), "-frames:v", "1", "-y", str(p)],
            check=True,
        )
        chemins.append(p)
    return chemins


def ko(p: Path) -> str:
    return f"{p.stat().st_size / 1024:.0f} Ko"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("--frames", type=int, default=16, help="frames du sprite (défaut 16)")
    ap.add_argument("--fps", type=int, default=12, help="images/s de la vidéo (défaut 12)")
    ap.add_argument("--grain", type=int, default=GRAIN_DEFAUT,
                    help=f"taille du bloc pixel (défaut {GRAIN_DEFAUT} — 3 mange le visage sur cette source)")
    a = ap.parse_args()
    if not a.video.exists():
        raise SystemExit(f"introuvable : {a.video}")

    SORTIE.mkdir(parents=True, exist_ok=True)
    total = duree(a.video)
    print(f"source : {a.video.name} · {total:.2f}s · {a.video.stat().st_size / 1024:.0f} Ko")

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)

        # ─────────────────────────────────── 2. SPRITE SHEET (16 frames)
        print(f"\nsprite : extraction de {a.frames} frames…")
        frames = [tramer(Image.open(p), LARGEUR_SPRITE, a.grain) for p in extraire(a.video, tmp, a.frames, total)]
        fw, fh = frames[0].size
        planche = Image.new("P", (fw * len(frames), fh))
        planche.putpalette(list(CHARBON) + list(ORANGE) + [0, 0, 0] * 254)
        for i, f in enumerate(frames):
            planche.paste(f, (i * fw, 0))
        sprite = SORTIE / "geolier_sprite.png"
        # bits=1 : la planche n'a que 2 couleurs, 1 bit par pixel suffit —
        # ça divise le poids par ~4 avant même la compression PNG.
        planche.save(sprite, optimize=True, bits=1)
        print(f"  {sprite.name} — {fw}×{fh} par frame · planche {planche.size[0]}×{planche.size[1]} · {ko(sprite)}")

        # Poster / repli statique : la première frame.
        # ⚠️ PNG, jamais JPEG : le JPEG lisse les blocs de 3 px et introduit
        # des couleurs intermédiaires — sur du bicolore tramé, il est à la fois
        # plus lourd ET plus laid (mesuré : 81 Ko en JPEG contre 4 en PNG).
        poster = SORTIE / "geolier_accueil.png"
        frames[0].resize((LARGEUR_VIDEO, round(LARGEUR_VIDEO * fh / fw)), Image.NEAREST).save(
            poster, optimize=True, bits=1
        )
        print(f"  {poster.name} — poster + repli · {ko(poster)}")

        # ─────────────────────────────────── 1. VIDÉO OPTIMISÉE
        n_video = max(1, int(round(total * a.fps)))
        print(f"\nvidéo : {n_video} frames tramées à {a.fps} fps…")
        seq = tmp / "seq"
        seq.mkdir()
        for i, p in enumerate(extraire(a.video, tmp / "v" if False else tmp, n_video, total)):
            tramer(Image.open(p), LARGEUR_VIDEO, a.grain).convert("RGB").save(seq / f"f{i:04d}.png")
            p.unlink(missing_ok=True)
        mp4 = SORTIE / "geolier_accueil.mp4"
        subprocess.run(
            [ffmpeg(), "-hide_banner", "-loglevel", "error", "-y",
             "-framerate", str(a.fps), "-i", str(seq / "f%04d.png"),
             "-an",                      # aucune piste audio
             "-c:v", "libx264", "-profile:v", "baseline", "-level", "3.0",
             "-pix_fmt", "yuv420p",      # compatibilité iOS/Safari
             "-crf", "26", "-preset", "veryslow",
             "-movflags", "+faststart",  # lecture avant fin de téléchargement
             "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2",
             str(mp4)],
            check=True,
        )
        print(f"  {mp4.name} — {LARGEUR_VIDEO} px · {a.fps} fps · sans audio · {ko(mp4)}")

    src_ko = a.video.stat().st_size / 1024
    print("\n─── POIDS ───")
    print(f"  source                  {src_ko:>8.0f} Ko")
    for p in (SORTIE / "geolier_accueil.mp4", SORTIE / "geolier_sprite.png", SORTIE / "geolier_accueil.png"):
        print(f"  {p.name:<22}  {p.stat().st_size / 1024:>8.0f} Ko  ({p.stat().st_size / (src_ko * 1024) * 100:.0f} % de la source)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
