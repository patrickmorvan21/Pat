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
    "extreme two-value contrast, large uniform very bright fields such as open sky or pools "
    "of light, read against deep pure black silhouettes, almost no mid-greys, the subject "
    "reading as a flat black shape on a flat bright ground; "
    "vintage engraving feel, grainy etching texture, single low dramatic light source, "
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
    sujet = sujet.strip().rstrip(",; ").strip()
    return f"{sujet}, {CLAUSE_OBJET}" if sujet else CLAUSE_OBJET


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
    "saulnes": ("black dominant, the only light in the frame rises from INSIDE the tower and catches "
                "the edges of the leaning town, an orange glow low against a black sky"),
}

# Le cadrage par DÉFAUT d'un environnement — celui d'un paysage. Un écran qui
# regarde autre chose (le pont d'une barge, une inscription) passe le sien.
CADRAGES_ENVIRONNEMENT = {
    "croute": "very wide shot",
    "bassins": "medium shot",
    "salines": "tight cramped framing, no horizon",
    # La bible dit : « vue de loin comme une masse noire sur l'orange, la tour au
    # sommet ; la ville penche vers sa tour ». Ce cadrage n'existait pas dans
    # l'ancienne chaîne (elle ne disait que la lumière) — il vient du JSON.
    "saulnes": ("seen from far off, the island a black mass against the orange, the tower at its "
                "summit, the whole town leaning toward that tower"),
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
    "croute": "harsh white noon, no shadows at all",
    "bassins": "low raking light near the horizon, the first long shadows",
    "salines": "one hard light",
    "saulnes": "lit only from inside the tower",
}

# Conservée telle quelle : c'est ce que la bible visuelle imprime en clair sous
# chaque environnement, et ce que `composer_environnement` assemble.
CLAUSES_ENVIRONNEMENT = {
    e: f"{RATIOS_ENVIRONNEMENT[e]}; {CADRAGES_ENVIRONNEMENT[e]}, {LUMIERES_ENVIRONNEMENT[e]}"
    for e in RATIOS_ENVIRONNEMENT
}

# Les cadrages nommés, pour un écran qui ne regarde pas un paysage.
CADRAGE_DETAIL = "close-up, the subject filling the frame, nothing else in shot, no horizon"
CADRAGE_SUR_PLACE = "medium shot from where you stand, the place close around you, no horizon"


def composer_portrait(sujet: str) -> str:
    """Un PORTRAIT de rencontre : fond noir, une source, le sujet émerge.

    ⚠️ Un portrait ne prend PAS la clause de cadrage de son environnement
    (`CLAUSES_ENVIRONNEMENT`) — trouvé le 14/09 en relisant les prompts
    générés : les cinq portraits d'origine disaient à la fois « pitch-black
    background, one single light source » ET « very wide shot, harsh white
    noon, no shadows at all », c'est-à-dire l'exact contraire. Un modèle de
    diffusion à qui l'on demande les deux rend n'importe laquelle des deux.
    Le cadrage d'un environnement décrit un PAYSAGE ; un portrait a le sien.

    Ce qui reste : le sujet ne montre jamais le héros, et la clause de style
    canonique (aplat à deux valeurs, époque, gravure) — c'est elle qui fait
    tenir le portrait à côté des paysages de la même zone.
    """
    sujet = sujet.strip().rstrip(",; ").strip()
    return (f"{sujet}, pitch-black background, the subject emerging from darkness, "
            f"one single low light source, this is the reference image of this character, "
            f"no protagonist in frame, {CLAUSE}")


def composer_environnement(sujet: str, env: str) -> str:
    """Un sujet des Salines + le ratio de son environnement + la clause canonique."""
    sujet = sujet.strip().rstrip(",; ").strip()
    return f"{sujet}, {PREMIERE_PERSONNE}, {CLAUSES_ENVIRONNEMENT[env]}, {CLAUSE}"


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
            f"{RATIOS_HORS_PAYSAGE[env]}, {CLAUSE}")
