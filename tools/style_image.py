#!/usr/bin/env python3
"""
LA RECETTE D'IMAGE DE PACTUM — source unique de la clause de style.

⚠️ Toute la fin d'un prompt Leonardo se compose ICI. Si la clause vit en double
quelque part, les deux divergent au premier correctif et une moitié du lot sort
dans un autre style.

DEUX CLAUSES AJOUTÉES LE 30/08, sur retour de Patrick devant ses images de
référence :

1. L'APLAT. Ce qui rend ses images uniques, c'est qu'on y trouve de grandes
   zones d'orange PLEIN, sans dégradé dedans — un ciel uni, une silhouette
   noire franche. Le dithering ne fabrique pas cet aplat : il le PRÉSERVE
   quand la source est déjà à deux valeurs. C'est donc la SOURCE qu'il faut
   demander en contraste extrême, avec très peu de demi-tons — d'où le
   vocabulaire « large uniform bright fields » / « deep pure black silhouettes ».
   « very high contrast » ne suffisait pas : il autorise une image entièrement
   en demi-tons contrastés, qui ressort en trame grise partout.

2. LE MOYEN ÂGE. Les maisons et les vêtements sortaient régulièrement en
   XIXᵉ (redingotes, hauts-de-forme, façades de brique, fenêtres à guillotine).
   L'ancienne clause disait « vintage », un mot qui ne date rien. On date
   explicitement, et on nomme ce qu'on refuse : un modèle de diffusion ignore
   plus facilement une interdiction vague qu'une liste concrète.
"""

CLAUSE = (
    "medieval dark fantasy, strictly 12th-15th century Europe: coarse homespun wool, "
    "hooded cloaks, hand-forged iron, timber frames, rubble stone and thatch, "
    "no 18th or 19th century elements, no frock coats, no top hats, no brick townhouses, "
    "no sash windows, no lamp posts, no industrial chimneys; "
    "extreme two-value contrast, large uniform very bright fields read against deep pure "
    "black silhouettes, almost no mid-greys, the subject reading as a flat black shape "
    "on a flat bright ground; "
    "vintage engraving feel, grainy etching texture, one dominant light source, "
    "dark vignette at the edges, monochrome, mystical and eerie atmosphere, "
    "no text, no lettering, no watermark"
)

# L'ancre des prompts d'avant le 30/08 : tout ce qui suit est de la clause.
ANCRE = "dark fantasy vintage engraving style"


def sujet_de(prompt: str) -> str:
    """Ne garde que la partie qui décrit la SCÈNE, sans la clause de style."""
    i = prompt.find(ANCRE)
    if i < 0:
        i = prompt.find(CLAUSE[:40])
    sujet = (prompt[:i] if i >= 0 else prompt).strip()
    return sujet.rstrip(",; ").strip()


def composer(sujet: str) -> str:
    """Un sujet + la clause canonique = le prompt à coller dans Leonardo."""
    sujet = sujet.strip().rstrip(",; ").strip()
    return f"{sujet}, {CLAUSE}" if sujet else CLAUSE


# ---------------------------------------------------------------------------
# LES ICÔNES D'OBJET n'ont pas la même grammaire qu'un décor : un seul sujet,
# aucun horizon, aucun sol, et surtout le rapport de valeurs est INVERSÉ —
# l'objet est la zone claire, le fond est l'aplat noir. C'est ce qui les rend
# lisibles en petit, dans une case d'inventaire de 92 pixels.
CLAUSE_OBJET = (
    "single isolated object centred on a pure black background, nothing else in frame, "
    "no ground, no horizon, no hands, no table; "
    "medieval dark fantasy, strictly 12th-15th century Europe, hand-made and worn, "
    "no 18th or 19th century manufacture, no machine finish, no printed labels; "
    "extreme two-value contrast, the object lit as a large uniform very bright shape "
    "against flat pure black, almost no mid-greys, crisp readable silhouette; "
    "vintage engraving feel, grainy etching texture, single hard raking light from the left, "
    "monochrome, museum plate composition, no text, no lettering, no watermark"
)


def composer_objet(sujet: str) -> str:
    """Une ICÔNE d'inventaire : l'objet est la zone claire, le fond l'aplat noir.

    ⚠️ Elle ne prend JAMAIS le ratio ni la lumière d'une zone (`composer_environnement`).
    Une icône se lit dans une case de 92 px, donc ses valeurs sont les mêmes
    partout — même pour un objet des Salines, dont la zone a pourtant des
    valeurs inversées. C'est la lisibilité qui commande ici, pas l'appartenance.
    `SANS_DEGRADE` s'applique quand même : le dithering est le même pour tous.
    """
    sujet = sujet.strip().rstrip(",; ").strip()
    return f"{sujet}, {SANS_DEGRADE}, {CLAUSE_OBJET}" if sujet else CLAUSE_OBJET


# ---------------------------------------------------------------------------
# LE RATIO DE TRAME PAR ENVIRONNEMENT (Salines, décision Patrick 13/09) : il
# s'obtient PAR LE PROMPT, jamais par un seuil de dithering — les réglages du
# pipeline sont verrouillés (skill pactum-style), et c'est la SOURCE qui doit
# porter l'aplat. Chaque clause dit la part d'orange, la valeur du ciel et du
# sol, le plan et la lumière — les trois invariants viennent du sujet.
# Règle de zone : vue à la première personne, le héros n'est jamais dans l'image.
PREMIERE_PERSONNE = "first-person view from the ground, no protagonist in frame, what is far away is other people"

# ⚠️ TROIS CHOSES SÉPARÉES, et il faut qu'elles le restent (14/09).
# Elles vivaient dans une seule chaîne, donc un gros plan héritait forcément du
# cadrage du paysage : un prompt de macro sur une inscription disait « very wide
# shot ». C'est le défaut EXACT trouvé le matin même sur les portraits (fond
# noir + plein soleil dans la même phrase) ; un modèle de diffusion à qui l'on
# demande les deux rend n'importe laquelle des deux.
#   — le RATIO dit les VALEURS. C'est lui qui fait tenir une zone ensemble :
#     il entre dans TOUTES ses images, quel que soit le cadrage.
#   — la LUMIÈRE est l'identité du lieu (la Croûte, c'est midi sans une ombre).
#     Elle ne varie pas non plus : la changer pour un gros plan ferait sortir
#     l'image de sa zone.
#   — seul le CADRAGE varie, et c'est le seul paramètre de `composer_cadre`.
RATIOS_ENVIRONNEMENT = {
    "croute": ("the VALUES ARE INVERTED compared to every other image: the ground is one huge uniform "
               "very bright field filling the lower two thirds of the frame, the sky a flat pure black"),
    "bassins": "roughly half bright and half black",
    "salines": "only about a quarter of the frame is bright, the rest deep black",
    "saulnes": "black dominant",
}

# Le cadrage par DÉFAUT d'un environnement — celui d'un paysage. Un écran qui
# regarde autre chose (le pont d'une barge, une inscription) passe le sien.
CADRAGES_ENVIRONNEMENT = {
    "croute": "very wide shot, the horizon line low so the eye sits at salt level",
    "bassins": "medium shot",
    "salines": "tight cramped framing, no horizon",
    # ⚠️ SAULNES N'A PAS DE CADRAGE DE ZONE, et lui en donner un était une
    # erreur de ma part (14/09). Le champ `plan` du JSON — « vue de loin comme
    # une masse noire sur l'orange » — décrit la vue d'ÉTABLISSEMENT, pas une
    # règle de la zone : trois de ses quatre images sont un intérieur de tour,
    # une ruelle et un quai, que « vue de loin » contredit frontalement. Une
    # chaîne vide = chaque sujet porte son propre cadrage, ce qui était le
    # comportement d'origine.
    "saulnes": "",
}

# ⚠️ LE RATIO D'UN PAYSAGE PARLE DE SOL ET DE CIEL — et une macro n'a ni l'un
# ni l'autre (trouvé en relisant les prompts générés, 14/09 : un gros plan
# d'inscription se voyait demander « the ground fills the lower two thirds of
# the frame, the sky a flat pure black »). Ce qui doit survivre hors paysage,
# c'est le RAPPORT DE VALEURS seul — il est ce qui rattache l'image à sa zone.
RATIOS_HORS_PAYSAGE = {
    "croute": ("the VALUES ARE INVERTED compared to every other image: the salt fills the frame as one "
               "huge uniform very bright field, and everything resting on it reads as deep pure black"),
    "bassins": "roughly half bright and half black",
    "salines": "only about a quarter of the frame is bright, the rest deep black",
    "saulnes": "black dominant, one orange glow as the only light",
}

# Hors paysage, « ce qui est loin, ce sont d'autres gens » ne veut plus rien
# dire : il n'y a plus de lointain. Seule la règle de zone survit — le héros
# n'est jamais dans l'image.
PREMIERE_PERSONNE_PROCHE = "first-person view, no protagonist in frame"

LUMIERES_ENVIRONNEMENT = {
    "croute": ("blinding white noon, the sun a hard white disc punched into the black sky above the "
               "horizon; the salt floor blazes so evenly that NOTHING casts a shadow — everything "
               "standing on the crust is a flat black cut-out with no shadow under it at all"),
    "bassins": "low raking light near the horizon, the first long shadows",
    "salines": "one hard light",
    "saulnes": ("the only light in the frame rises from INSIDE the tower and catches the edges of "
                "the leaning town, an orange glow low against a black sky"),
}

# Conservée telle quelle : c'est ce que la bible visuelle imprime en clair sous
# chaque environnement, et ce que `composer_environnement` assemble.
CLAUSES_ENVIRONNEMENT = {
    e: "; ".join(x for x in (
        RATIOS_ENVIRONNEMENT[e],
        ", ".join(y for y in (CADRAGES_ENVIRONNEMENT[e], LUMIERES_ENVIRONNEMENT[e]) if y),
    ) if x)
    for e in RATIOS_ENVIRONNEMENT
}

# ⚠️ CE QUI FAIT LE « WOW » EST LA COMPOSITION, PAS LA MATIÈRE (15/09).
# Mesuré sur les 20 images de la zone : le taux d'APLAT (pixels dont les quatre
# voisins sont de la même couleur) classe exactement comme l'œil — 53-68 % sur
# les cinq images qui lisent gris et plat, 85-90 % sur celles qui ont la
# franchise des références de Patrick. Une image sous ~70 % est du grain, pas
# un dessin à deux couleurs. `tools/aplat.py` mesure, avant même de regarder.
#
# Les références (rouge/noir) partagent toutes quatre traits, et AUCUN n'était
# demandé : une figure géométrique qui porte le cadre · une source de lumière
# VISIBLE où le regard se pose · tout ce qui est devant elle en aplat noir sans
# détail · une échelle écrasante. Ce sont des règles, pas un goût.
COMPOSITION = (
    "poster composition: the whole shot built on ONE bold geometric figure filling the frame — "
    "a circle, an arch, converging lines, a hard symmetry; the light source itself visible in "
    "frame; everything in front of it a flat black cut-out with no interior detail; crushing "
    "scale, whatever gives scale tiny and low in the frame; it must read at thumbnail size"
)

# ⚠️ LE DÉGRADÉ EST CE QUE NOTRE PIPELINE TUE — vérifié en passant deux images
# de synthèse dans le dithering canonique : un halo dégradé ressort en nuage de
# points sale (78,8 % d'aplat, la silhouette s'y perd), les MÊMES cercles en
# anneaux francs ressortent nets et spectaculaires (88,5 %). La beauté des
# références tient donc à leur structure, jamais à leur atmosphère : on demande
# des FORMES de lumière, pas de la brume.
SANS_DEGRADE = (
    "light is shaped, never atmospheric — hard-edged rings, bands and shafts with clean borders, "
    "any glow cut off sharply; no soft halo, no haze, no mist, no volumetric fog, no god rays, "
    "no smooth gradient anywhere"
)

# ⚠️ LA CONTRADICTION EST LE DÉFAUT QUI COÛTE UN LOT ENTIER, et il a été
# trouvé À LA MAIN trois fois : le 30/08 (« bright fields such as open sky »
# dans CLAUSE contre « the sky a flat pure black » du ratio de la Croûte), le
# 14/09 (les portraits demandaient « pitch-black background » ET « harsh white
# noon » dans la même phrase), le 15/09 (« one short hard shadow » contre une
# prose qui dit « plein jour, pas une ombre », puis « no glow » contre la
# lueur de tour de Saulnes). À chaque fois un modèle de diffusion à qui l'on
# demande deux choses opposées en rend une au hasard, et tout le lot sort
# décalé sans qu'aucun garde ne bronche.
# Un prompt se compose de cinq sources (sujet, composition, ratio, lumière,
# clause) écrites à des dates différentes : personne ne les relit ensemble.
# Ce contrôle les relit. Il n'a pas d'avis sur le goût — il ne dit qu'une
# chose : ces deux morceaux ne peuvent pas être vrais en même temps.
CONTRADICTIONS: tuple[tuple[str, tuple[str, ...], tuple[str, ...]], ...] = (
    ("ciel noir contre ciel clair",
     ("sky a flat pure black", "black sky", "against a black sky"),
     ("bright fields such as open sky", "bright sky", "luminous sky", "white sky")),
    ("aucune ombre contre une ombre",
     ("nothing casts a shadow", "no shadow", "without a shadow"),
     ("cast shadow", "casts a long", "long shadow", "hard shadow", "shadow pooling",
      "casting shadows", "shadows stretch")),
    ("fond noir contre plein jour",
     ("pitch-black background", "pitch black background", "pure black background"),
     ("noon", "open sky", "to the horizon", "very wide shot", "bright field")),
    ("vue du sol contre vue aérienne",
     ("first-person view from the ground", "first-person view"),
     ("seen from above", "aerial", "bird's eye", "top-down", "overhead")),
    ("pas de dégradé contre de l'atmosphère",
     ("no smooth gradient",),
     ("soft halo", "hazy", "misty", "volumetric", "god rays", "soft gradient", "gentle gradient")),
)


# ⚠️ LA NÉGATION EST LE FAUX AMI DE CE GARDE, et il a tiré sur lui-même au
# premier essai : la clause anti-dégradé DIT « no soft halo », donc chercher
# « soft halo » en sous-chaîne la trouve dans sa propre interdiction. Même
# famille que l'homonyme « porte » du 10/08. Un côté ne compte donc que s'il
# est affirmé — jamais précédé d'un mot de négation.
NEGATIONS = ("no ", "not ", "never ", "without ", "nothing ", "none ")


def _affirme(bas: str, phrase: str) -> bool:
    i = bas.find(phrase)
    while i >= 0:
        avant = bas[max(0, i - 24):i]
        if not any(n in avant for n in NEGATIONS):
            return True
        i = bas.find(phrase, i + 1)
    return False


def contradictions(prompt: str) -> list[str]:
    """Les couples de morceaux qui ne peuvent pas être vrais dans la même image.

    Le côté GAUCHE est la règle (souvent une interdiction : « nothing casts a
    shadow ») et se cherche telle quelle ; le côté DROIT est ce qui la viole,
    et ne compte que s'il est AFFIRMÉ.
    """
    bas = prompt.lower()
    trouve = []
    for nom, gauche, droite in CONTRADICTIONS:
        g = next((x for x in gauche if x in bas), None)
        d = next((x for x in droite if _affirme(bas, x)), None)
        if g and d:
            trouve.append(f"{nom} — « {g} » et « {d} » dans le même prompt")
    return trouve


# Les cadrages nommés, pour un écran qui ne regarde pas un paysage.
CADRAGE_DETAIL = "close-up, the subject filling the frame, nothing else in shot, no horizon"
CADRAGE_SUR_PLACE = "medium shot from where you stand, the place close around you, no horizon"
# ⚠️ UNE RENCONTRE N'EST PAS UN PORTRAIT SUR FOND NOIR (14/09, mesuré : 8 sur 8
# des sujets de rencontre décrivaient un sol ou un décor — la croûte sous les
# pattes, les rails, le bassin derrière — que « pitch-black background » efface).
# Les Gisants en sont la preuve : des corps COUCHÉS dans le sel, servis sur un
# fond noir où il n'y a pas de sel ; le modèle les a redressés à la verticale,
# ce qui était la seule sortie possible.
# Et sur la Croûte le fond noir est en plus l'exact contraire de la zone, dont
# la signature est un sol ÉCLATANT. Une rencontre se cadre donc serré sur la
# créature, dans les valeurs et la lumière de son environnement.
CADRAGE_RENCONTRE = ("close on the creature, filling most of the frame, just enough ground under it "
                     "to stand or lie on and a bare strip of horizon behind")


# ⚠️ IL N'Y A PAS DE RECETTE DE PORTRAIT ICI, et c'est voulu (15/09).
# `composer_portrait` (fond noir, une source, « reference image of this
# character ») a été supprimée : plus aucun appelant depuis le 14/09 — les
# rencontres passent par `composer_cadre`, donc dans les VALEURS et la LUMIÈRE
# de leur zone — et `contradictions()` la trouve en conflit avec sa propre
# queue de style (« pitch-black background » contre « large uniform very
# bright fields »). La garder, c'était laisser à portée de main la recette qui
# a produit le défaut du 14/09. Une planche d'objet sur fond noir se fait avec
# `composer_objet`, qui a sa propre clause cohérente.

def composer_environnement(sujet: str, env: str) -> str:
    """Un PAYSAGE des Salines : sujet + composition + valeurs de la zone + clause.

    ⚠️ `COMPOSITION` n'entre QUE par ici (15/09). Elle demande une figure
    géométrique qui remplit le cadre, trois plans de profondeur et une échelle
    écrasante : ça n'a de sens que pour un plan large. La coller sur un gros
    plan d'inscription ou sur une créature cadrée serré demanderait au modèle
    deux images à la fois — le défaut exact des portraits du 14/09.
    `SANS_DEGRADE`, lui, vaut pour tout ce que le dithering traverse.
    """
    sujet = sujet.strip().rstrip(",; ").strip()
    return (f"{sujet}, {COMPOSITION}, {PREMIERE_PERSONNE}, {CLAUSES_ENVIRONNEMENT[env]}, "
            f"{SANS_DEGRADE}, {CLAUSE}")


def composer_cadre(sujet: str, env: str, cadrage: str) -> str:
    """Un écran qui ne regarde PAS un paysage : on ne change que le cadrage.

    Le ratio de valeurs et la lumière de la zone restent — c'est ce qui fait
    qu'un gros plan reste manifestement une image de cet environnement-là.
    Et on ne force PAS les trois invariants : on ne met pas des rails qui
    sortent du sel dans une macro d'une inscription (l'appelant les ajoute au
    sujet quand ils ont un sens).
    """
    sujet = sujet.strip().rstrip(",; ").strip()
    return (f"{sujet}, {cadrage}, {LUMIERES_ENVIRONNEMENT[env]}, {PREMIERE_PERSONNE_PROCHE}, "
            f"{RATIOS_HORS_PAYSAGE[env]}, {SANS_DEGRADE}, {CLAUSE}")


# ---------------------------------------------------------------------------
# LA RECETTE « AFFICHE » (26/09, Landes) — sur la planche de références de
# Patrick : « elles sont tellement belles qu'on pourrait les mettre en fond
# d'écran… une couleur dominante et le noir ». Son grief sur les Landes : « trop
# génériques, trop réalistes, ça se voit que ce sont des photos passées au
# pixel ; on oublie le côté fantaisie ».
#
# Ce que CLAUSE demandait et qui fabriquait ce défaut : « vintage engraving
# feel, grainy etching texture » — une matière de GRAVURE PHOTOGRAPHIQUE, dont
# le grain devient du bruit une fois tramé. Les références n'ont aucun grain :
# ce sont des AFFICHES — des formes plates, une teinte, du noir, une géométrie.
#
# Six traits relevés sur les seize références (tous absents des prompts des
# Landes) : une teinte dominante lumineuse + noir, rien d'autre · une figure
# géométrique qui porte le cadre (disque, arche, colonnes, anneaux, symétrie)
# · la source de lumière DANS l'image · tout ce qui est devant en aplat noir
# sans détail · une échelle écrasante · presque toujours UNE silhouette
# minuscule, de dos, qui donne l'échelle et fait l'histoire. Et un septième,
# le plus important pour « la fantaisie » : quelque chose d'IMPOSSIBLE — une
# porte dans un monolithe au milieu d'un champ, une éclipse au-dessus d'une
# forêt de colonnes. Ce trait-là, c'est le SUJET qui le porte, pas la clause.
#
# ⚠️ LA TEINTE DOIT ÊTRE LUMINEUSE, et ce n'est pas un goût : notre tramage
# coupe à un seuil de luminosité. Un rouge sang franc (180,20,20) sort à 14 %
# d'orange — du gris moucheté. Soit on demande une teinte CLAIRE (orange
# ardent, presque or au plus chaud), soit on trame avec `--canal max`
# (dither_batch.py), qui lit la source sur sa valeur la plus forte.
# ⚠️ COMPACTE À DESSEIN : Leonardo coupe vers 1 500 caractères, et la queue de
# style ne doit pas manger la place du SUJET, qui porte l'impossible. Chaque
# morceau ci-dessous tient en une ligne ; `LIMITE_PROMPT` est contrôlée par le
# générateur.
LIMITE_PROMPT = 1400

PALETTE_AFFICHE = ("only two tones: one bright blazing ember orange-red laid in large flat fields, "
                   "and pure black; no third hue, no grey")

COMPOSITION_AFFICHE = ("poster composition built on one bold geometric figure filling the frame, "
                       "the light source visible in frame, everything in front of it a flat black "
                       "cut-out, crushing scale")

SANS_DEGRADE_AFFICHE = "light shaped in hard-edged bands and rings, no haze, no fog, no soft gradient"

CLAUSE_AFFICHE = ("medieval dark fantasy, 12th-15th century Europe, bold graphic poster illustration, "
                  "flat simplified shapes, mythic and surreal, not a photograph, no photorealism, "
                  "no grain, no text, no watermark")

# La silhouette d'échelle. Hors des Salines, le héros PEUT être dans l'image
# — minuscule, de dos, jamais un visage — parce que c'est ce qui fait l'échelle
# de TOUTES les références. (Les Salines gardent leur vue à la première
# personne : `PREMIERE_PERSONNE`, décision du 13/09.)
ECHELLE_AFFICHE = "one tiny hooded silhouette seen from behind for scale, no face"

# Une RENCONTRE est une affiche aussi, mais c'est la créature qui est la figure.
COMPOSITION_RENCONTRE = ("poster composition: the creature is the bold central shape, a flat black "
                         "cut-out against one hard geometric field of light, crushing scale")


def composer_affiche(sujet: str, echelle: bool = True) -> str:
    """Un LIEU des Landes en affiche : sujet (qui porte l'impossible) +
    composition + silhouette d'échelle + palette + sans dégradé + clause."""
    sujet = sujet.strip().rstrip(",; ").strip()
    morceaux = [sujet, COMPOSITION_AFFICHE]
    if echelle:
        morceaux.append(ECHELLE_AFFICHE)
    morceaux += [PALETTE_AFFICHE, SANS_DEGRADE_AFFICHE, CLAUSE_AFFICHE]
    return ", ".join(morceaux)


def composer_affiche_rencontre(sujet: str) -> str:
    """Une RENCONTRE des Landes en affiche : la créature est la figure."""
    sujet = sujet.strip().rstrip(",; ").strip()
    return ", ".join([sujet, COMPOSITION_RENCONTRE, PALETTE_AFFICHE, SANS_DEGRADE_AFFICHE, CLAUSE_AFFICHE])
