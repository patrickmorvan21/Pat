Tu es le MODÉRATEUR d'un panel de cinq testeurs qui ont découvert PACTUM (un
livre-dont-vous-êtes-le-héros mobile, dark fantasy) sans aucun contexte. La
question du panel n'est pas « est-ce bien ? » mais « EST-CE QU'ON COMPREND ? »
— l'univers, le lieu, l'histoire, les personnages, les règles, le rythme.

Les cinq rapports sont dans /tmp/panel3/rapports/L1.md … L5.md (L1 lecteur de
romans, L2 joueur mobile pressé, L3 joueur de jeux narratifs, L4 néophyte
total, L5 joueur de roguelike). Les transcripts qu'ils ont lus sont dans
/tmp/panel3/paquet/transcripts/, le contenu du jeu dans /tmp/panel3/paquet/
sources/ (lib/scene-data.ts pour les textes, lib/*.ts pour les règles) —
tu as le droit d'y vérifier une affirmation, et tu DOIS le faire avant de
retenir un constat : quand un testeur dit « le jeu n'explique jamais X »,
vérifie si X est expliqué quelque part et où (écran, fichier). Distingue
« le jeu ne le dit pas » de « le jeu le dit mais trop tard / trop discrètement
/ dans un texte qu'on saute ». Note aussi ce qui vient de la réplique Python
et pas du jeu (le LISEZMOI dit ce qu'elle ne réplique pas).

Fais-les DÉBATTRE : pour chaque axe (OÙ · QUI · QUOI · EUX · RÈGLES · RYTHME),
mets les cinq grilles côte à côte moment par moment, relève où ils
convergent, où ils divergent, et où une divergence s'explique par le profil
(le pressé n'a pas lu, le néophyte ne sait pas ce qu'est un dé, le roguelike
cherche une boucle qui n'est pas dite). Compare les cinq « histoire racontée
à un ami » (section C) : qu'est-ce qui est commun (c'est ce que le jeu
transmet vraiment), qu'est-ce qui est contradictoire (c'est ce que le jeu
laisse deviner), qu'est-ce qui manque chez tous (c'est ce que le jeu ne dit
pas). Fusionne les listes de mots incompris (section D) avec leur fréquence.

Écris /tmp/panel3/DEBAT.md (le débat détaillé, avec citations exactes et tes
vérifications) puis /tmp/panel3/DIAGNOSTIC.md, en français, structuré ainsi :
 1. EN CINQ LIGNES — ce qu'un premier joueur comprend, et ce qu'il ne comprend
    pas, de PACTUM.
 2. AXE PAR AXE (OÙ, QUI, QUOI, EUX, RÈGLES, RYTHME) — note moyenne /10 du
    panel, la courbe (à l'écran 1 → 10 → 25 → village → 70 → fin : quand
    ça s'éclaire, quand ça se brouille), le constat, la citation qui le
    porte, et ta vérification (le jeu le dit-il, où, quand).
 3. L'HISTOIRE TRANSMISE — les 6-8 phrases que les cinq ont en commun ;
    puis ce sur quoi ils se contredisent ; puis ce qu'aucun n'a compris.
 4. LES MOTS — tableau : mot · nb de testeurs qui ne l'ont pas compris ·
    écran de 1re rencontre · le jeu l'explique-t-il (où) ou jamais.
 5. LES MOMENTS PERDUS — les écrans cités par ≥ 2 testeurs, avec ce qu'ils
    ont cru et ce qui les aurait aidés (leurs mots).
 6. LE RYTHME — écrans avant la 1re décision selon le profil, les tunnels de
    lecture, les passages joués sans comprendre.
 7. CE QUI MARCHE — ce que TOUS ont compris sans effort, à ne pas toucher.
 8. LE VOTE — pour chaque testeur, UNE phrase : la seule chose qu'il aurait
    fallu lui dire (ou montrer) plus tôt.
 9. TROIS CHANTIERS, dans l'ordre — chacun en une phrase, avec le levier
    (une ligne de texte / un écran / une règle), et ce qu'il NE faut PAS
    faire (pas d'écran de règles, pas de chiffres, pas de tutoriel qui
    explique — le jeu doit le faire sentir).
Ne fais pas de compliments. Ne propose pas de refonte. Cite.
Termine par une phrase de confirmation que les deux fichiers sont écrits.
