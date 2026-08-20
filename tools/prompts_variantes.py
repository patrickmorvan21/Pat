#!/usr/bin/env python3
"""
Réécrit les prompts d'image des VARIANTES de la zone (data/zones/<zone>.json).

── Le problème que ça corrige ─────────────────────────────────────────────
Chaque variante re-décrivait son sujet en entier (« elderly couple digging
side by side between orchard rows, black twisted branches above them… »).
Un modèle de diffusion à qui on redécrit un couple fabrique un AUTRE couple,
dans un AUTRE verger : deux écrans du même lieu ne raccordent jamais.

── La règle ───────────────────────────────────────────────────────────────
Une variante ne rejoue pas la scène : elle SERRE sur un élément.
  · `pres`     — gros plan, l'objet remplit le cadre. Pas d'horizon, pas de
                 ciel, aucune figure. C'est le cas par défaut.
  · `large`    — le rare cas où le texte demande de RECULER (la croix
                 d'ombres du moulin, l'entrée dans le cercle des potences).
  · `portrait` — la première image d'un personnage : elle établit, donc elle
                 décrit. Il n'y en a QU'UNE par personnage.
  · `geste`    — toute image suivante du même personnage : mains, dos,
                 objet tendu. Le visage n'est jamais revu, donc il ne peut
                 jamais diverger.

── La lumière, aussi ──────────────────────────────────────────────────────
Les gros plans héritaient du « contre-jour extrême, silhouette noire sur
ciel orange » des plans larges. Sur un détail il n'y a pas de ciel : tout
virait au noir plein et la matière disparaissait au dithering (les entailles
des potences, par exemple). Un gros plan est donc éclairé en LUMIÈRE
RASANTE, qui fait lire le relief.
"""
from __future__ import annotations
import json, sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
ZONES = RACINE / "data" / "zones"

STYLE = ("dark fantasy illustration, deep crushed blacks, no fill light, high contrast, "
         "two-tone monochrome-friendly, strong readable shapes, matte painting, "
         "grim medieval rural, square composition, no text, no lettering, no watermark")

CADRES = {
    # Le cadrage porte l'anti-dérive : ce qu'on ne montre pas ne peut pas jurer.
    "pres": ("extreme close-up, the subject filling the frame, no horizon, no sky, "
             "no figure, no face, one single low raking light grazing the surface so "
             "the texture and the cut marks read, background falling to black"),
    "large": ("wide shot, the subject small in the frame, seen from a distance, "
              "extreme backlight, one single light source, near-black silhouettes "
              "against a glowing orange sky"),
    "portrait": ("pitch-black background, subject emerging from darkness, one single "
                 "light source, this is the reference image of this character"),
    "geste": ("tight crop on the gesture only — hands, arms, or the back of the "
              "figure — the head out of frame, the face never visible, so nothing "
              "has to match another image, one single light source raking across "
              "the gesture, everything behind it falling away to black"),
}

# ── Les sujets, un par FICHIER (pas par écran : plusieurs écrans partagent
#    la même image, et deux prompts pour un même fichier sont un piège). ────
SUJETS: dict[str, tuple[str, str]] = {
 # ---- La Borne Frontière ----
 "scene_borne_gravures_a_d.png": ("pres",
   "weathered granite boundary stone surface covered in shallow crowded carvings, "
   "names scratched over older names, a flat human hand resting against the stone"),
 "scene_borne_eclat_a_b.png": ("pres",
   "broken-off corner of a granite boundary stone at ground level, the fracture "
   "clean and chisel-cut, the raw pale inner stone against the weathered outer face"),
 # ---- Le Chemin Creux ----
 "scene_chemin_charrette_a_c.png": ("pres",
   "wheel hub and axle of a cart long sunk in a rut, green shoots growing out of "
   "the wood of the hub, the side rail worn smooth by hands"),
 "scene_chemin_talus_a_c.png": ("pres",
   "loose turned earth on a steep bank, a line of bare footprints pressed into it "
   "going the wrong way, grass torn at the edges"),
 "monstre_bete_chemins_creux_a.png": ("portrait",
   "long low beast built to run between two earth walls, no visible jaw, only a "
   "forward mass of matted hide, half detached from the bank of a sunken lane"),
 "monstre_marcheur_a_rebours_d.png": ("portrait",
   "man walking backwards along a sunken lane with a sure step, heels finding the "
   "ground like eyes, body turned away from his direction of travel"),
 # ---- La Colline aux Gibets ----
 "scene_colline_potences_cercle_a_c.png": ("large",
   "ring of weathered gallows posts on a bare hill crest seen from inside the ring, "
   "shallow notches and a date cut at the foot of each post, wind-flattened heather"),
 "scene_colline_gibet_vide_a_b.png": ("pres",
   "the noose of a great gallows seen from directly beneath, looking up, the knot "
   "huge and close, the crossbeam cutting the top of the frame"),
 "monstre_corbeaux_du_compte_b.png": ("portrait",
   "row of crows perched shoulder to shoulder along a gallows crossbeam, none of "
   "them looking at the viewer, all of them looking down at the rope"),
 "monstre_pendu_qui_parle_a.png": ("portrait",
   "hanged magistrate on a low gallows at head height, chain of office at his neck "
   "under the rope, a seal ring on his fist, eyes open and alive"),
 # ---- Le Champ des Fixés ----
 "scene_champ_rangees_a_d.png": ("pres",
   "packed earth path between two rows of stakes, the ground trodden smooth by "
   "regular tending, the foot of a stake and its bindings close in the frame"),
 "scene_champ_poteaux_vierges_a_a.png": ("pres",
   "bare unused stakes driven into the earth, no rope on them yet, the wood still "
   "pale where it has not weathered"),
 "scene_champ_tombe_manquante_a_c.png": ("pres",
   "gap in a full row of stakes, the socket hole left in the earth still open, its "
   "rim crumbling, like a pulled tooth"),
 "monstre_fossoyeur_poteaux_a.png": ("portrait",
   "old gravedigger straightening a leaning stake with a gardener's care, not "
   "interrupting his work, a mallet hanging from his hand"),
 "monstre_pendu_mal_fixe_a.png": ("portrait",
   "hanged man standing upright on his own feet, his rope still knotted at his "
   "neck and trailing behind him, a snapped stake on the ground beside him"),
 # ---- Le Moulin Arrêté (doctrine 18/08 : les ailes SONT là, immobiles) ----
 "scene_moulin_croix_ombres_a_d.png": ("large",
   "old windmill with four latticed sails frozen in a perfect cross, their long "
   "cross-shaped shadow lying rigid on wind-flattened heather, seen from across "
   "a low wall"),
 "scene_moulin_lucarne_a_b.png": ("pres",
   "small dark loft opening high in rough stonework, its frame splintered, nothing "
   "visible inside it"),
 "scene_moulin_interieur_a_d.png": ("pres",
   "inside of a disused mill, a millstone shoved aside and bedding laid on the "
   "floor beside it, a hand pushing a plank door open into the dark"),
 # ---- La Mare aux Regards ----
 "scene_mare_berge_a_c.png": ("pres",
   "trodden bank at the edge of still water, the mud packed hard as a doorstep, "
   "the last footprints stopping exactly at the waterline"),
 "scene_mare_miroir_a_b.png": ("pres",
   "cracked pocket mirror caught among black reeds at the water's edge, its "
   "backing tarnished, the reeds bending without breaking"),
 # ---- Le Verger Noir ----
 "scene_verger_fruits_a_c.png": ("pres",
   "single hanging fruit close in the frame, its skin ashen and split, dry grey "
   "dust spilling from the split, black branch above it"),
 "scene_verger_souche_a_c.png": ("pres",
   "knee-high sawn stump at the end of an orchard row, the cut face flat and grey, "
   "the saw marks still legible across it"),
 "monstre_epoux_verger_a.png": ("portrait",
   "elderly couple sharing one spade between orchard rows, taking turns without "
   "speaking, the settled rhythm of people who have done this together for decades"),
 # ---- Le Hameau : ruelle, croix, grange ----
 "scene_landes_hameau_ruelle_b.png": ("large",
   "narrow village lane of low stone houses, every shutter closed, no one in the "
   "street, chalk cross on the first door"),
 "scene_hameau_croix_craie_a_a.png": ("pres",
   "chalk cross drawn at eye height on a plank door, the white powder still "
   "loose and fresh on the doorstep below it"),
 "scene_hameau_grange_poutres_a_d.png": ("pres",
   "underside of barn roof beams seen by lamplight from below, rows of tally "
   "notches cut along one beam, the wood black with age"),
 "scene_landes_hameau_grange_a.png": ("pres",
   "clean straw and a used blanket laid on a barn floor, a short-wicked lamp set "
   "down beside them, the barn door shut in the background"),
 "scene_hameau_dense_b.png": ("large",
   "village seen from its southern gate at dawn, roofs packed low behind a stone "
   "wall, the gate standing open"),
 "scene_hameau_dense_c.png": ("large",
   "low stone field wall on open moor at night, a bedroll pressed against its "
   "north side, no shelter of any kind"),
 "monstre_juge_de_cendre_c.png": ("portrait",
   "three villagers standing across a lane, unarmed — a walking staff, a pitchfork "
   "leaning on a wall within reach — the eldest at the centre doing the talking"),
 "monstre_doyenne_b.png": ("geste",
   "an old open palm held out flat and empty, offered to be looked at rather than "
   "shaken"),
 "monstre_femme_au_seuil_b.png": ("portrait",
   "woman standing motionless in a doorway, not taking the air but standing guard, "
   "arms at her sides"),
 # ---- Le Petit Tribunal ----
 "scene_tribunal_ordonnance_a_c.png": ("pres",
   "thick yellowed sheet of paper nailed at its four corners to a stone wall, the "
   "nails driven deep, the edges of the paper curling"),
 "scene_tribunal_chaire_a_c.png": ("pres",
   "high wooden pulpit desk seen from its single step, a heavy ledger left open on "
   "it, the wood worn pale where hands gripped the edge"),
 "scene_tribunal_bancs_a_c.png": ("pres",
   "three rows of rough wooden benches in an empty stone hall, the front bench "
   "polished smooth by use, the others barely worn"),
 "monstre_ecrivain_public_d.png": ("portrait",
   "small dry man frozen in a doorway holding a quill and inkpot clutched to his "
   "chest, caught seeing something he should not have seen"),
 # ---- Le Puits Condamné / Le Marché Muet / La Maison du Bailli ----
 "monstre_mains_du_puits_a.png": ("geste",
   "hands forcing up from under the nailed planks of a sealed well, fingers "
   "through the gap, a padlock jumping on its ring"),
 "monstre_colporteur_b.png": ("portrait",
   "hunched pedlar behind a stall of goods that belong nowhere near a moor, one "
   "hand raised in greeting, a wide fixed smile of recognition"),
 "monstre_chien_du_bailli_b.png": ("portrait",
   "large grey dog rising from a doorstep without barking, coat worn bare where a "
   "harness used to sit, blocking the way"),
 # ---- La Chapelle des Cordes ----
 "scene_chapelle_mur_cordes_a_d.png": ("pres",
   "old hemp ropes hanging close together down a stone wall from ceiling to floor, "
   "greasy with age, each one ending in a finished knot"),
 "scene_chapelle_autel_a_c.png": ("pres",
   "block of altar stone lying on its side on a flagstone floor, never righted and "
   "never taken away, dust settled along its upper edge"),
 "scene_chapelle_ouvrage_a_d.png": ("pres",
   "a chair turned to face a wall, a half-plaited rope laid across its seat with "
   "the work stopped mid-braid"),
 "monstre_veuve_cordes_a.png": ("geste",
   "a woman's hands endlessly retying the same knot in her lap, black sleeves, the "
   "rope worn shiny at that one spot"),
 # ---- La Palissade Sud ----
 "scene_palissade_rondins_a_c.png": ("pres",
   "line of log palisade tops seen from directly below, every point sharpened and "
   "angled inward, toward the inside of the wall"),
 "scene_palissade_portillon_a_b.png": ("pres",
   "small plank gate in a log wall, a hand flat on the wood, deep claw scratches "
   "raked down the boards on the inner face"),
 "objet_lanterne_rouillee_guerite.png": ("pres",
   "rusted lantern standing on the floor of a narrow plank sentry box, the only "
   "light source, a bowl of cold soup set down far from it"),
 "objet_lanterne_rouillee.png": ("geste",
   "a weathered hand holding out a rusted lantern by its ring, half offered, the "
   "wick visible through the glass"),
 "monstre_appele_descente.png": ("portrait",
   "man walking away down a road, seen from behind, no baggage, never turning "
   "round, an even unhurried step"),
 # ---- Errants ----
 "monstre_meute_grise_c.png": ("portrait",
   "six lean grey dogs the colour of dead heather, standing still and evenly "
   "spaced, already surrounding the viewer"),
 "monstre_hesitant_b.png": ("portrait",
   "man standing alone facing south on open moor, back to the viewer, not turning "
   "round though he has heard the footsteps"),
}

# ── Beats SUIVANTS d'une même rencontre ────────────────────────────────────
# Ces écrans partagent aujourd'hui le portrait du premier beat. Le jour où
# on leur fait une image propre, elle ne doit PAS rejouer le personnage : le
# portrait existe déjà, et un deuxième portrait du même homme en fabrique un
# autre. Ils passent donc tous en `geste` — mains, dos, objet tendu — et leur
# prompt est écrit d'avance dans ce sens. (C'est exactement ce que Patrick a
# préparé côté Drive : « mains_tendues », « dos ».)
SUJETS_BEATS: dict[str, tuple[str, str]] = {
 "hesitant-2": ("geste",
   "a man's chin lifted toward a boundary stone he refuses to look at, seen from "
   "the side, cropped at the jaw"),
 "hesitant-3": ("large",
   "a boundary stone standing alone in the middle of an empty plateau, nobody "
   "beside it, the moor running flat to the horizon"),
 "marcheur-2": ("geste",
   "a pair of heels finding the ground behind their owner, boots walking backwards "
   "along a sunken lane, legs only"),
 "marcheur-3": ("geste",
   "two fingers raised toward the viewer at the mouth of a sunken lane, the arm "
   "half swallowed by the earth bank, a count rather than a farewell"),
 "femme-seuil-2": ("geste",
   "a woman's hands drawing something small and closed out from under a shawl, "
   "held tight, offered without opening"),
 "femme-seuil-3": ("large",
   "a woman back in place on her doorstep at the end of a village street, seen "
   "from far down the road, looking south, nothing about her showing that she "
   "spoke to anyone"),
 "epoux-2": ("geste",
   "two old hands held out open toward the viewer, palms up, begging without "
   "words for anything brought from outside"),
 "epoux-3": ("geste",
   "the backs of two old people bent to their work between orchard rows, seen "
   "from behind as one walks away from them, heads never turning"),
 "pendu-qui-parle-2": ("geste",
   "a rope creaking taut on its beam, close on the knot and the chain of office "
   "beneath it, the head out of frame"),
 "meute-grise-2": ("portrait",
   "grey dogs regrouped at blade's distance in a crescent, more cautious than "
   "before, the leader one step ahead of the others"),
 "verger-noir-2": ("pres",
   "a single fallen fruit lying in the dirt of an orchard row, picked up in a bare "
   "hand, its skin ashen and still warm"),
 "veilleur-3": ("geste",
   "a hand chalking a mark onto a plank board inside a sentry box, a row of "
   "earlier marks beside it"),
}

# Écrans encore SANS image : le prompt est écrit d'avance, à la même grammaire.
SUJETS_A_CREER: dict[str, tuple[str, str]] = {
 "pierres-rangees": ("pres",
   "long neat stack of dressed stones at the foot of a tower, laid course by "
   "course, every carved face turned down against the earth, one stone tipped over "
   "to show a fragment of an engraved name"),
 "escalier-vers-rien": ("pres",
   "last surviving step of a stone stair inside a broken tower, the tread hollowed "
   "in its middle by daily use, the stonework breaking off clean onto open sky"),
 "meurtriere-sud": ("pres",
   "narrow arrow slit in thick stonework at chest height, its sill worn smooth "
   "like a handrail, hundreds of tally notches in groups of five cut into the "
   "embrasure, a single-lens copper spyglass wedged in a crack"),
 "poteau-pendu": ("portrait",
   "hanged old man on an isolated low gibbet, a magistrate's chain at his neck and "
   "a seal ring on his fist, head lifted and eyes open, unmistakably alive"),
 "eau-reflet": ("pres",
   "still black water filling the frame, a single reflected silhouette in it that "
   "does not quite match the movement above, ripples starting a beat too late"),
 "homme-guerite": ("portrait",
   "night watchman sitting in a narrow plank sentry box built against a log wall, "
   "his lantern on the ground at his feet as the only light, watching the viewer "
   "with the patience of someone who saw them coming long ago"),
}


def compose(cadre: str, sujet: str) -> str:
    return f"{sujet}. {CADRES[cadre]}, {STYLE}"


def main() -> int:
    zone = sys.argv[1] if len(sys.argv) > 1 else "landes"
    chemin = ZONES / f"{zone}.json"
    d = json.loads(chemin.read_text(encoding="utf-8"))

    # L'image PRINCIPALE d'un LIEU garde son prompt : c'est elle qui établit le
    # décor, et toutes les variantes doivent raccorder AVEC elle.
    # ⚠️ Ce n'est PAS « toute scène de type arrivee » : le premier beat d'une
    # rencontre est aussi une arrivée, et son portrait doit bien passer par la
    # grammaire (il établit un personnage, pas le décor du lieu). On protège
    # donc exactement les images qui portent une carte de lieu sur la carte —
    # celle du lieu, sinon celle de sa première scène d'arrivée.
    # ⚠️ Les LIEUX portent « assets/xxx.png », les SCÈNES « xxx.png ». Sans ce
    # rabotage, aucune image de lieu n'est reconnue et on réécrit les 15 plans
    # larges qui font justement office de référence.
    nom = lambda f: f.rsplit("/", 1)[-1] if f else f
    principales: set[str] = set()
    for lieu in d.get("lieux", []):
        img = nom(lieu.get("illustration"))
        if not img:
            arr = next((s for s in d["scenes"]
                        if s.get("lieu") == lieu["id"] and s.get("type") == "arrivee"
                        and s.get("illustration")), None)
            img = nom(arr["illustration"]) if arr else None
        if img:
            principales.add(img)

    ecrits, inconnus, sautes = 0, [], 0
    par_fichier: dict[str, list[dict]] = {}
    for s in d["scenes"]:
        f = s.get("illustration")
        if f:
            par_fichier.setdefault(f, []).append(s)

    for f, scenes in par_fichier.items():
        if f in principales:
            sautes += 1
            continue
        if f not in SUJETS:
            inconnus.append(f)
            continue
        cadre, sujet = SUJETS[f]
        p = compose(cadre, sujet)
        for s in scenes:
            s["prompt_image"] = p
        ecrits += 1

    # Les beats suivants passent APRÈS l'écriture par fichier : ils doivent
    # écraser le portrait hérité du premier beat, jamais l'inverse.
    for sid, (cadre, sujet) in {**SUJETS_BEATS, **SUJETS_A_CREER}.items():
        s = next((x for x in d["scenes"] if x["id"] == sid), None)
        if s is None:
            inconnus.append(sid)
            continue
        s["prompt_image"] = compose(cadre, sujet)
        ecrits += 1

    chemin.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"✓ {ecrits} prompts de variante réécrits · {sautes} images principales laissées telles quelles")
    if inconnus:
        print(f"⚠ sans sujet écrit ({len(inconnus)}) : {', '.join(inconnus)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
