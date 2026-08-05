#!/usr/bin/env python3
"""
LE GEÔLIER ANIMÉ — vidéo source → prototypes pixel art comparables.

Entrée : un mp4 du Geôlier (démon charbon sur fond orange plat).
Sorties dans `aldenhar/public/assets/`, préfixées par --nom :

  1. VIDÉO OPTIMISÉE
     <nom>.mp4        — H.264, SANS piste audio, 540 px de large, 12 fps
     <nom>_poster.png — poster statique + repli

  2. SPRITE SHEET CSS
     <nom>_sprite.png  — N frames côte à côte, PNG indexé 2 couleurs
     <nom>_cendres.png — (option --cendres) la nappe de cendres, à part

⚠️ Les DEUX passent par la même réduction pixel : la « version vidéo » n'est
pas une version non-pixel, c'est la même image avec plus de frames.

⚠️⚠️ ÉCART ASSUMÉ AVEC LE PIPELINE DE DITHERING VERROUILLÉ, à connaître :
la source est DÉJÀ dans la palette PACTUM (un rendu Midjourney orange/charbon).
Le pipeline canonique (`tools/dither_batch.py` : luminance → contraste 151 % →
seuil 182) est fait pour DÉVELOPPER une photo en couleurs ; l'appliquer à une
image déjà développée donne un résultat INVERSÉ et cassé — vérifié : le fond
orange a une luminance de 130, donc sous le seuil de 182, il ressort en
CHARBON, et la diffusion d'erreur le fait osciller autour du seuil (damier
50/50 sur tout le fond, silhouette noire à la place du démon).

Ici on projette donc chaque pixel sur l'AXE Charbon→Orange (sa position entre
les deux couleurs, 0..255) et on applique Floyd-Steinberg sur cette valeur, au
seuil médian. Même algorithme de diffusion, même palette stricte, même absence
de dégradé — seule l'entrée change, parce que l'entrée n'est pas de même
nature. Si un jour on trame une vidéo en COULEURS, elle repasse par le
pipeline canonique.

LES CENDRES (--cendres N) reproduisent exactement l'effet de l'accueil actuel
(`components/HeroGeolier.tsx`) : carrés de 1 px charbon qui montent du bas,
ondulent, et se raréfient par PROBABILITÉ DE DESSIN jusqu'à mourir aux 2/3 de
la hauteur — jamais un alpha, jamais un dégradé. La différence : ici elles sont
pré-calculées en N frames EXACTEMENT périodiques, pour tourner en `steps()`
sans JavaScript. Le démon est découpé (--cutout) pour qu'elles passent
réellement DERRIÈRE lui.

Rien n'est traité au RUNTIME : PNG statiques + CSS. Aucune bibliothèque à
ajouter au projet Next.js.

Usage :
    python3 tools/geolier_anim.py <video.mp4> --nom geolier_v2 --cutout --cendres 24
"""

from __future__ import annotations

import argparse
import math
import random
import shutil
import subprocess
import sys
import tempfile
from collections import deque
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow manquant : python3 -m pip install pillow", file=sys.stderr)
    raise SystemExit(1)

RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / "aldenhar/public/assets"

CHARBON = (0x1C, 0x1A, 0x16)
ORANGE = (0xE0, 0x63, 0x2A)
# Grain 2 et non 3 (le défaut des illustrations) : mesuré sur ces sources, le
# grain 3 mange entièrement le VISAGE du Geôlier — museau, crocs, anneaux — et
# il ne reste qu'une silhouette. À 2, tout est lisible et la trame reste
# franchement pixel. Réglable par --grain.
GRAIN_DEFAUT = 2

LARGEUR_SPRITE = 360
LARGEUR_VIDEO = 540


# ──────────────────────────────────────────────────────────────── outils vidéo


def ffmpeg() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        print("ffmpeg introuvable : python3 -m pip install imageio-ffmpeg", file=sys.stderr)
        raise SystemExit(1)


def duree(src: Path) -> float:
    out = subprocess.run([ffmpeg(), "-hide_banner", "-i", str(src)], capture_output=True, text=True).stderr
    for ligne in out.splitlines():
        if "Duration:" in ligne:
            h, m, s = ligne.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    raise SystemExit("durée illisible")


def extraire(src: Path, dossier: Path, n: int, total: float, prefixe: str) -> list[Path]:
    """`n` images réparties RÉGULIÈREMENT sur toute la durée de la vidéo."""
    chemins = []
    for i in range(n):
        # Milieu de chaque tranche plutôt que ses bords : la toute dernière
        # image d'un mp4 est souvent un doublon de l'avant-dernière.
        # ⚠️ Plafonné à 0,2 s avant la fin : au-delà, un `-ss` proche de la
        # durée annoncée fait sortir ffmpeg en SUCCÈS sans écrire de fichier
        # (le conteneur annonce plus long que le dernier paquet décodable) —
        # `check=True` ne le voit pas, et c'est le PNG suivant qui manque.
        t = min(total * (i + 0.5) / n, max(0.0, total - 0.2))
        p = dossier / f"{prefixe}{i:04d}.png"
        subprocess.run(
            [ffmpeg(), "-hide_banner", "-loglevel", "error", "-ss", f"{t:.3f}",
             "-i", str(src), "-frames:v", "1", "-y", str(p)],
            check=True,
        )
        if not p.exists():
            raise SystemExit(f"ffmpeg n'a rien écrit à t={t:.3f}s — vidéo tronquée ?")
        chemins.append(p)
    return chemins


# ───────────────────────────────────────────────────────────────── dithering


def sur_axe(im: Image.Image) -> list[float]:
    """Chaque pixel projeté sur l'axe Charbon→Orange, ramené en 0..255.

    0 = exactement Charbon, 255 = exactement Orange. Les tons intermédiaires
    de la source (le modelé du visage) deviennent des valeurs intermédiaires,
    que Floyd-Steinberg transformera en TEXTURE au lieu de les écraser en
    silhouette — c'est toute la différence avec un « couleur la plus proche »,
    qui perd le museau et les crocs.
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


def floyd(buf: list[float], w: int, h: int, seuil: float = 128.0) -> list[int]:
    """Floyd-Steinberg 7/3/5/1, buffer non clampé — l'ordre du canonique."""
    out = [0] * (w * h)
    for y in range(h):
        row = y * w
        below = row + w
        last = y == h - 1
        for x in range(w):
            old = buf[row + x]
            on = old > seuil
            err = old - (255.0 if on else 0.0)
            out[row + x] = 1 if on else 0
            if x + 1 < w:
                buf[row + x + 1] += err * (7 / 16)
            if not last:
                if x > 0:
                    buf[below + x - 1] += err * (3 / 16)
                buf[below + x] += err * (5 / 16)
                if x + 1 < w:
                    buf[below + x + 1] += err * (1 / 16)
    return out


def fond_connexe(buf: list[float], w: int, h: int, seuil: float = 150.0) -> list[bool]:
    """Le FOND : la région orange connexe aux bords de l'image.

    ⚠️ Calculé sur les valeurs CONTINUES (avant dithering), jamais sur le
    binaire : la trame fait s'interpénétrer fond et figure, un remplissage
    lancé sur l'image tramée fuirait à l'intérieur du démon et le trouerait.
    Sur la valeur continue, la frontière est nette.

    Effet de bord voulu : les reflets orange À L'INTÉRIEUR du démon (yeux,
    museau) ne sont pas connexes au bord, donc ils restent opaques.
    """
    fond = [False] * (w * h)
    q: deque[int] = deque()
    for x in range(w):
        for i in (x, (h - 1) * w + x):
            if not fond[i] and buf[i] > seuil:
                fond[i] = True
                q.append(i)
    for y in range(h):
        for i in (y * w, y * w + w - 1):
            if not fond[i] and buf[i] > seuil:
                fond[i] = True
                q.append(i)
    while q:
        i = q.popleft()
        x, y = i % w, i // w
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                j = ny * w + nx
                if not fond[j] and buf[j] > seuil:
                    fond[j] = True
                    q.append(j)
    return fond


def tramer(src: Image.Image, largeur: int, grain: int, cutout: bool) -> Image.Image:
    """Une frame → RGBA tramée de `largeur` px, en blocs pleins de `grain` px.

    Le dithering se fait sur la grille RÉDUITE puis on ré-agrandit en NEAREST :
    c'est ce qui donne le gros pixel. Lisser après coup détruirait la trame.
    `cutout` rend le fond TRANSPARENT, pour glisser les cendres derrière.
    """
    w, h = src.size
    gw = max(1, largeur // grain)
    gh = max(1, round(gw * h / w))
    petite = src.convert("RGB").resize((gw, gh), Image.BILINEAR)
    buf = sur_axe(petite)
    fond = fond_connexe(list(buf), gw, gh) if cutout else None
    bits = floyd(buf, gw, gh)

    out = Image.new("RGBA", (gw, gh))
    px = out.load()
    for y in range(gh):
        for x in range(gw):
            i = y * gw + x
            if fond is not None and fond[i]:
                px[x, y] = (0, 0, 0, 0)
            else:
                px[x, y] = (*(ORANGE if bits[i] else CHARBON), 255)
    return out.resize((gw * grain, gh * grain), Image.NEAREST)


# ─────────────────────────────────────────────────────────────────── cendres


def cendres(n: int, w: int, h: int, grain: int, densite: int = 2, graine: int = 7) -> list[Image.Image]:
    """`n` frames de cendres EXACTEMENT périodiques (frame n == frame 0).

    Reproduction de `components/HeroGeolier.tsx` : carrés de 1 px charbon qui
    montent du bas, ondulent latéralement, et se raréfient par PROBABILITÉ DE
    DESSIN en approchant des 2/3 de la hauteur — jamais d'alpha.

    ⚠️ CE QUI CHANGE, et c'est tout l'intérêt : là-bas les cendres naissent et
    meurent au hasard, ici il faut que la boucle se referme sans couture. On
    donne donc à chaque cendre une vitesse telle qu'elle parcoure sa course en
    un DIVISEUR ENTIER de n frames ; au bout de n frames, toutes sont revenues
    exactement à leur point de départ. Le hasard reste (position, ondulation,
    scintillement), mais il est le MÊME à chaque tour.
    """
    rnd = random.Random(graine)
    gw, gh = max(1, w // grain), max(1, h // grain)
    plafond = gh / 3.0  # les cendres meurent aux 2/3 de la montée
    course = gh - plafond

    # Population en RÉGIME PERMANENT, calée sur la référence : HeroGeolier
    # ajoute `densite` cendres tous les 90 ms et chacune vit ~318 pas, donc il
    # y en a en permanence ~630 sur un canvas de 360×368 en pixels de 1 px.
    # Ici chaque cendre est un bloc de `grain`² pixels : à surface d'encre
    # égale, il en faut `grain`² fois moins. D'où ~90 par point de densité.
    # (Mesuré : avec la formule d'origine il n'y en avait que 16 — invisibles.)
    particules = []
    for _ in range(max(8, densite * 90 // max(1, grain * grain // 4))):
        tours = rnd.choice((1, 1, 2, 3))
        particules.append(
            {
                "x": rnd.uniform(0, gw),
                "y0": rnd.uniform(0, course),   # décalage initial dans la course
                "v": course * tours / n,        # vitesse → boucle refermée
                "sway": 0.4 + rnd.random() * 0.5,
                "f": 0.1 + rnd.random() * 0.12,
                "seed": rnd.random() * 6.283,
                # scintillement pré-tiré, périodique lui aussi
                "flick": [rnd.random() for _ in range(n)],
            }
        )

    frames = []
    for k in range(n):
        im = Image.new("RGBA", (gw, gh), (0, 0, 0, 0))
        px = im.load()
        for p in particules:
            # position dans la course, modulo : la boucle se referme
            d = (p["y0"] + p["v"] * k) % course
            y = gh - d
            fade = min(1.0, (y - plafond) / max(1.0, course * 0.84))
            if p["flick"][k] > 0.15 + fade * 0.85:
                continue
            x = int(p["x"] + math.sin(k * p["f"] + p["seed"]) * p["sway"] * 3)
            yi = int(y)
            if 0 <= x < gw and 0 <= yi < gh:
                px[x, yi] = (*CHARBON, 255)
        frames.append(im.resize((gw * grain, gh * grain), Image.NEAREST))
    return frames


def planche(frames: list[Image.Image]) -> Image.Image:
    fw, fh = frames[0].size
    out = Image.new("RGBA", (fw * len(frames), fh), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        out.paste(f, (i * fw, 0))
    return out


def ko(p: Path) -> str:
    return f"{p.stat().st_size / 1024:.0f} Ko"


# ────────────────────────────────────────────────────────────────────── main


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("--nom", default="geolier_accueil", help="préfixe des fichiers de sortie")
    ap.add_argument("--frames", type=int, default=16, help="frames du sprite (défaut 16)")
    ap.add_argument("--fps", type=int, default=12, help="images/s de la vidéo (défaut 12)")
    ap.add_argument("--grain", type=int, default=GRAIN_DEFAUT, help=f"bloc pixel (défaut {GRAIN_DEFAUT})")
    ap.add_argument("--cutout", action="store_true", help="fond transparent (cendres derrière)")
    ap.add_argument("--cendres", type=int, default=0, help="frames de la nappe de cendres (0 = aucune)")
    ap.add_argument("--densite", type=int, default=2, help="densité des cendres (comme HeroGeolier)")
    a = ap.parse_args()
    if not a.video.exists():
        raise SystemExit(f"introuvable : {a.video}")

    SORTIE.mkdir(parents=True, exist_ok=True)
    total = duree(a.video)
    print(f"source : {a.video.name}\n  {total:.2f}s · {a.video.stat().st_size / 1024:.0f} Ko")
    ecrits: list[Path] = []

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)

        # ── 2. SPRITE (démon) ────────────────────────────────────────────
        print(f"\nsprite : {a.frames} frames…")
        src = extraire(a.video, tmp, a.frames, total, "s")
        frames = [tramer(Image.open(p), LARGEUR_SPRITE, a.grain, a.cutout) for p in src]
        for p in src:
            p.unlink(missing_ok=True)
        fw, fh = frames[0].size
        sprite = SORTIE / f"{a.nom}_sprite.png"
        planche(frames).save(sprite, optimize=True)
        ecrits.append(sprite)
        print(f"  {sprite.name} — {fw}×{fh}/frame · planche {fw * len(frames)}×{fh}"
              f"{' · fond transparent' if a.cutout else ''} · {ko(sprite)}")

        # Poster / repli : la 1re frame, sur fond orange (le cutout serait
        # illisible en repli — un poster doit se suffire à lui-même).
        poster = SORTIE / f"{a.nom}_poster.png"
        plat = Image.new("RGBA", (fw, fh), (*ORANGE, 255))
        plat.alpha_composite(frames[0])
        plat.convert("RGB").resize((LARGEUR_VIDEO, round(LARGEUR_VIDEO * fh / fw)), Image.NEAREST).save(
            poster, optimize=True
        )
        ecrits.append(poster)
        print(f"  {poster.name} — poster + repli · {ko(poster)}")

        # ── CENDRES (nappe séparée, pour passer DERRIÈRE le démon) ───────
        cendres_sprite = None
        if a.cendres:
            print(f"\ncendres : {a.cendres} frames périodiques…")
            cs = cendres(a.cendres, fw, fh, a.grain, a.densite)
            cendres_sprite = SORTIE / f"{a.nom}_cendres.png"
            planche(cs).save(cendres_sprite, optimize=True)
            ecrits.append(cendres_sprite)
            print(f"  {cendres_sprite.name} — planche {fw * a.cendres}×{fh} · {ko(cendres_sprite)}")

        # ── 1. VIDÉO ─────────────────────────────────────────────────────
        n_video = max(1, int(round(total * a.fps)))
        print(f"\nvidéo : {n_video} frames à {a.fps} fps…")
        # Cendres de la vidéo : même simulation, périodique sur SA longueur.
        # ⚠️ Le H.264 n'a pas de canal alpha : ici tout est APLATI dans l'image.
        # C'est la vraie différence entre les deux prototypes — côté sprite les
        # cendres restent une couche réglable, côté vidéo elles sont cuites.
        cv = cendres(n_video, LARGEUR_VIDEO, round(LARGEUR_VIDEO * fh / fw), a.grain, a.densite) if a.cendres else None
        seq = tmp / "seq"
        seq.mkdir()
        for i, p in enumerate(extraire(a.video, tmp, n_video, total, "v")):
            d = tramer(Image.open(p), LARGEUR_VIDEO, a.grain, a.cutout)
            plan = Image.new("RGBA", d.size, (*ORANGE, 255))
            if cv:
                plan.alpha_composite(cv[i].resize(d.size, Image.NEAREST))
            plan.alpha_composite(d)
            plan.convert("RGB").save(seq / f"f{i:04d}.png")
            p.unlink(missing_ok=True)
        mp4 = SORTIE / f"{a.nom}.mp4"
        subprocess.run(
            [ffmpeg(), "-hide_banner", "-loglevel", "error", "-y",
             "-framerate", str(a.fps), "-i", str(seq / "f%04d.png"),
             "-an",                       # aucune piste audio
             "-c:v", "libx264", "-profile:v", "baseline", "-level", "3.0",
             "-pix_fmt", "yuv420p",       # compatibilité iOS/Safari
             "-crf", "26", "-preset", "veryslow",
             "-movflags", "+faststart",
             "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2",
             str(mp4)],
            check=True,
        )
        ecrits.append(mp4)
        print(f"  {mp4.name} — {LARGEUR_VIDEO} px · {a.fps} fps · sans audio · {ko(mp4)}")

    src_ko = a.video.stat().st_size / 1024
    print("\n─── POIDS ───")
    print(f"  {'source (non utilisée)':<28}{src_ko:>8.0f} Ko")
    for p in ecrits:
        print(f"  {p.name:<28}{p.stat().st_size / 1024:>8.0f} Ko  ({p.stat().st_size / (src_ko * 1024) * 100:.0f} %)")
    if cendres_sprite:
        tot = sum(p.stat().st_size for p in ecrits if p.suffix == ".png") / 1024
        print(f"  {'→ total sprite + cendres':<28}{tot:>8.0f} Ko")
    return 0


if __name__ == "__main__":
    sys.exit(main())
