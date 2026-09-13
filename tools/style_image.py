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

CLAUSES_ENVIRONNEMENT = {
    "croute": ("the VALUES ARE INVERTED compared to every other image: the ground is one huge uniform "
               "very bright field filling the lower two thirds of the frame, the sky a flat pure black; "
               "very wide shot, harsh white noon, no shadows at all"),
    "bassins": ("roughly half bright and half black, medium shot, low raking light near the horizon, "
                "the first long shadows"),
    "salines": ("only about a quarter of the frame is bright, the rest deep black, tight cramped framing, "
                "no horizon, one hard light"),
    "saulnes": ("black dominant, the only light in the frame rises from INSIDE the tower and catches "
                "the edges of the leaning town, an orange glow low against a black sky"),
}


def composer_environnement(sujet: str, env: str) -> str:
    """Un sujet des Salines + le ratio de son environnement + la clause canonique."""
    sujet = sujet.strip().rstrip(",; ").strip()
    return f"{sujet}, {PREMIERE_PERSONNE}, {CLAUSES_ENVIRONNEMENT[env]}, {CLAUSE}"
