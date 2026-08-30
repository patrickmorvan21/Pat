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
