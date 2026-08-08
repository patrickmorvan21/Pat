/**
 * Version du jeu — SOURCE UNIQUE DE VÉRITÉ.
 *
 * Affichée en bas à droite de l'accueil (blanc, opacité 50 %). Sert aussi de
 * repère pour vérifier d'un coup d'œil qu'un déploiement a bien pris (si le
 * numéro affiché ne bouge pas après une mise à jour, c'est un cache, pas le
 * code).
 *
 * ⚠️ À CHAQUE déploiement, bumper selon la GRANDEUR du changement (semver) :
 *   • PATCH (x.y.Z) : correctif, retouche, copy, un seul bug, tweak visuel.
 *   • MINOR (x.Y.0) : nouveau contenu notable, nouvel écran, nouvelle
 *     mécanique, refonte d'une zone (ex. la réécriture Les Landes).
 *   • MAJOR (X.0.0) : bouleversement structurel (nouveau modèle de jeu,
 *     nouvel acte, refonte de navigation).
 *
 * Et TOUJOURS incrémenter `CACHE_VERSION` dans public/sw.js en parallèle,
 * sinon le service worker garde l'ancien bundle malgré le nouveau numéro.
 *
 * Historique récent :
 *   1.2.0 — Les Landes : le jeu ne joue plus que cette zone (17 scènes
 *           réelles), + numéro de version visible + SW réseau-d'abord.
 *   1.3.0 — Retours playtest 21/07 (vague 1) : physique du dé (la face lue à
 *           l'arrêt = le résultat), overlay de texte long (panneau qui monte
 *           sur l'illustration, trame de pixels), courbe d'entrée invisible,
 *           jalon de première mort (Geôlier qui accueille + fragment fort).
 *   1.4.0 — Retours playtest 21/07 (vague 2) : TRAVERSÉE & liaisons — on ne
 *           passe plus d'une scène à l'autre sans déplacement joué. Entre les
 *           lieux, une scène de liaison (marche + choix d'orientation) ; une
 *           traversée ne visite que 3-4 lieux puis débouche sur la Descente
 *           (fin sèche « Acte II à venir »).
 *   1.5.0 — Retours playtest 21/07 (vague 3) : OBJETS 2 types — passifs (effet
 *           permanent tant que porté) / actifs (usage unique, consommés au
 *           choix). Besace = 2 slots actifs + 2 passifs. Actif utilisable via
 *           le menu (Utiliser) ET en 4e choix contextuel quand pertinent. Plus
 *           aucune consommation automatique.
 *   1.6.0 — Écran OPTIONS (Figma 2137:406) : Apparition (vitesse de frappe) /
 *           Taille du texte / Animations (complètes·réduites) / Vibrations /
 *           Réafficher les aides / Effacer la progression — tous fonctionnels.
 *           Musique + Lecture à haute voix grisées (pas encore construites).
 *   1.6.1 — Retouches 22/07 : libellés de CTA raccourcis (ne débordent plus),
 *           fondu de pixels du texte long remplacé par un rétrécissement propre
 *           de l'illustration, interrupteur Musique (glissière), bloc Geôlier
 *           en 11px/interligne 120 %, inventaire limité à 3 reliques.
 *   1.7.0 — Illustrations Les Landes : les 30 images validées du pipeline
 *           (Drive « 03_Validé ») intégrées dans public/assets/ ; 12 scènes
 *           câblées sur leur vraie illustration (colline, champ, chapelle,
 *           puits, tribunal, marché, moulin/camp + rencontres pendus/chien/
 *           meute) — fini le placeholder portail sur ces scènes.
 *   1.7.1 — Suite illustrations : 3 scènes de plus câblées sur leur vraie
 *           image (borne-frontière, Bête des Chemins Creux, serment/Juge de
 *           Cendre) + 23 icônes d'objet des Landes déposées dans assets/
 *           (prêtes à câbler sur les objets de Besace).
 *   1.8.0 — Lot 23/07 vague 1 (chantier n°1 : objets réels & usure) : objets
 *           RÉELS des Landes obtenables (loot de lieu à l'arrivée + gain sur
 *           choix d'examen réussi), icônes tramées propres partout ; soin
 *           générique raréfié (22 % → 12 %) ; un échec dur hors combat coûte
 *           un JOUR (visible) ; dernier tiers de la traversée durci d'un cran.
 *   1.9.0 — Lot 23/07 vague 2 (chantiers n°2 + n°6) : CHAPITRES GARANTIS — une
 *           traversée = un chapitre du Bailli (Le Procès / Le Registre / La
 *           Fille / Le Gibet Vide) en 3 beats à moments fixes (amorce à la 1re
 *           liaison, développement dans un lieu garanti aux orientations,
 *           résolution partielle avant la Descente), rotation par compte ; +
 *           SIGNATURE GARANTIE — la Colline aux Gibets offerte à chaque
 *           liaison tant que non visitée.
 *   1.10.0 — Lot 23/07 vague 3 (chantier n°3) : LE SOUPÇON — l'histoire devient
 *           la menace de la zone. 0..6, jamais affiché, lu dans le monde par
 *           paliers (mots comptés → conversation pliée → Doyenne → croix à la
 *           craie → trois hommes → procès). Monte : refuser/tricher le
 *           Serment, parler au Pendu, potences, Rebouteux, échec social.
 *           Baisse : jurer, dénoncer un autre (jamais suggéré, le village
 *           s'en souvient). Palier 6 = procès du héros — mort par fixation
 *           (première mort purement sociale) ou relaxe qui fait retomber le
 *           Soupçon. Le hameau se souvient des fixations par-delà les runs.
 *   1.11.0 — Lot 23/07 vague 4 (chantier n°4) : LIAISONS CONTEXTUELLES — 30
 *           ambiances de marche indexées provenance × destination × état
 *           (santé, Soupçon, chapitre en cours, objets portés), la plus
 *           spécifique éligible gagne, génériques en secours. Déterministe à
 *           la reprise.
 *   1.12.0 — Lot 23/07 vague 5 (chantier n°5) : PROFONDEUR PAR SCÈNE — les 9
 *           lieux majeurs + 2 rencontres joués en SÉQUENCE (arrivée
 *           sensorielle avec examens optionnels → événement via chainNext),
 *           ~double de beats par traversée sans un seul élément de pool
 *           ajouté. Les états ne s'usent qu'une fois par lieu complet.
 *   1.13.0 — Lot 24/07 : ÉCRAN DU NOM du prologue — le Geôlier demande
 *           « comment on t'appelait », signature Instrument Serif sur trait
 *           tramé, SCELLER LE PACTE (segments décalés, inerte < 2 car.),
 *           « Qu'il choisisse pour moi » (8 noms validés), note du Registre
 *           (3 premières runs), max 16 caractères → heroName. Clôture
 *           automatique 4 s après la frappe (plus de tap). Affordance
 *           « Touche pour continuer » sur l'amorce (3 premières runs).
 *   1.14.0 — MUSIQUE (moteur) : lib/audio.ts — intro.mp3 en boucle sur
 *           accueil + prologue, rotation landes_1/2/3 en jeu, fondu au
 *           changement, autoplay débloqué au premier geste, silencieux si
 *           les fichiers manquent. Options : interrupteur Musique réel +
 *           volume à 8 crans. ⚠️ Les mp3 restent à déposer dans
 *           public/audio/ (voir README) — trop lourds pour le connecteur.
 *   1.16.0 — Lot 24/07 suite (3e playtest) vague 1 — POINTS D'INTÉRÊT : le
 *           diagnostic n'est plus la longueur des beats mais la LINÉARITÉ. Un
 *           lieu n'est plus un nœud : arrivée qui MONTRE les points à distance
 *           → marche (approche) → examen en plan rapproché (crop de l'image du
 *           lieu) → événement → sortie. On ne se téléporte jamais sur un point.
 *           Les 4 lieux garantis (Colline, Tribunal, Chapelle, Champ) réécrits
 *           d'après les scripts Notion, 3 points chacun.
 *   1.17.0 — Lot 24/07 suite vague 2 — LE HAMEAU, halte scriptée HORS TIRAGE :
 *           on ne « visite » pas le Hameau des Renonçants, on y fait halte.
 *           Deux séquences garanties encadrent la traversée. ENTRÉE en 5 beats
 *           (approche au loin → seuil et croix à la craie → barrage des trois
 *           hommes → le Serment imposé, jamais proposé → entrée). HALTE en
 *           5 beats à la fin de la traversée (le vieux te trouve → la grange et
 *           sa barre posée DEHORS → la nuit → l'aube → l'escorte au portillon),
 *           ou beat unique « nuit dehors » si le Serment a été refusé : aucune
 *           porte ne s'ouvre à qui n'a pas juré. Le Serment est mémorisé
 *           (juré / du bout des lèvres / refusé) et pèse sur la sortie de zone.
 *   1.18.0 — Lot 24/07 suite vague 3 — LIEUX EXTÉRIEURS & RENCONTRES EN BEATS :
 *           la Borne, le Chemin Creux, le Moulin et la Palissade passent au
 *           format à points d'intérêt (voir de loin → marcher → examiner en
 *           plan rapproché) ; deux lieux s'ajoutent au pool, la Mare aux
 *           Regards (le reflet en retard) et le Verger Noir (onze vergers, des
 *           fruits de cendre). Quatre rencontres écrites au format obligatoire
 *           approche → échange → enjeu → résolution — la Femme au Seuil,
 *           l'Hésitant, le Marcheur à rebours, les Époux du Verger, le
 *           Veilleur de la Palissade — ouvertes par un point d'intérêt et
 *           refusables : elles ne surgissent jamais, on va vers elles.
 *           Cinq objets de plus (grelot, pierre de retour, miroir fêlé, fruit
 *           de cendre, mèche nouée).
 *   1.15.1 — Retours playtest 24/07 (2e vague) : écran du Nom refait FIDÈLE à
 *           la maquette Figma 2167:203 (champ bordé « Ton Nom » mono aligné à
 *           gauche + bouton plein SCELLER LE PACTE + lien centré souligné, plus
 *           de signature Instrument Serif ni de note Registre) ; amorce du
 *           prologue centrée 300px + « Touche pour continuer » en bas (maquette
 *           1997:523) ; musique d'intro tentée dès l'ouverture (sans attendre
 *           un clic) ; OPTIONS cliquable sur l'accueil (overlay plein cadre).
 *   1.15.0 — Retours playtest 24/07 (immersion) : traversée ×3 (9-11 lieux
 *           avant la Descente) ; VRAIES transitions — la marche a son visuel
 *           (une des 4 vues génériques des Landes en liaison, plus le portail
 *           figé) + phrase d'APPROCHE à l'arrivée (on voit le lieu se dresser
 *           et on y marche) ; image qui S'ADAPTE au beat (le personnage qui
 *           apparaît a son visuel sur l'écran-événement : Marcheur, Doyenne,
 *           Colporteur, Écrivain, Mains du Puits).
 *   1.14.1 — Musique ACTIVE : les 4 mp3 de Patrick (PJ) intégrés dans
 *           public/audio/ — intro à l'accueil/prologue, boucles Landes en jeu.
 *   1.18.1 — Lot d'illustrations Drive du 25/07 : re-vérification complète des
 *           trois dossiers « 03_Validé » contre public/assets (les images déjà
 *           en jeu correspondent octet pour octet, sauf le Champ des Fixés,
 *           remplacé par sa version à jour). Le Hameau des Renonçants a enfin
 *           sa vraie vue d'ensemble (et trois variantes qui servent de vue de
 *           marche quand on va vers lui), la maison murée du Bailli, la ruelle
 *           et la grange de la halte, le Chemin Creux, les Époux du Verger, le
 *           fossoyeur du Champ et la Veuve de la chapelle. La marche entre deux
 *           lieux prend l'image du chemin qu'on emprunte (creux, sud, hameau)
 *           au lieu d'une vue tirée au hasard.
 *   1.18.2 — Re-synchro Drive du 25/07 (2e passe) : deux images déjà en jeu
 *           mises à jour (meute grise = 6 chiens à contre-jour, petite fixée
 *           dédupliquée) ; 13 nouveaux fichiers récupérés et vérifiés mais
 *           volontairement pas câblés (rencontres/chapitres/liaisons pas
 *           encore écrits côté code) — voir CLAUDE.md pour le détail.
 *   1.19.0 — Retours playtest 25/07 : la bande de dissolution est l'export
 *           fidèle du composant Figma et n'est plus étirée (pleine largeur sur
 *           tout écran) ; le Hameau devient un vrai intérieur — on n'y entre
 *           que par sa séquence, ses lieux ne sont plus tirables avant, et on
 *           y marche dans des ruelles (vues du village, ambiances dédiées) ;
 *           les descriptions passent derrière un CTA « Observer les alentours »
 *           pour revenir à 3 choix par écran ; la musique tourne réellement sur
 *           les 3 boucles des Landes et démarre au premier geste, où qu'il soit.
 *   1.19.1 — Plans rapprochés : 4 points d'intérêt (l'Hésitant, la Femme au
 *           Seuil, le Marcheur à rebours, les Époux du Verger) utilisent enfin
 *           le portrait déjà validé du personnage au lieu d'un crop de l'image
 *           du lieu — et c'est la même image que la rencontre qui suit.
 *   1.23.1 — Plus de plan rapproché par crop (retour Patrick 26/07 : « ça ne
 *           rend pas bien »). Observer un élément n'est plus un zoom dans
 *           l'image du lieu : le héros se déplace, et l'écran montre l'élément
 *           lui-même via son image dédiée. Sans image dédiée, l'écran garde la
 *           vue du lieu — c'est un asset à produire, pas un effet à simuler.
 *   1.24.0 — Lot Notion 26/07, vague 1 : l'écran du Grand Registre (les cent
 *           places, la première verrouillée et illisible, l'onglet « Tes
 *           morts ») et l'affordance « Touche pour … » devenue une règle
 *           globale — 50 px du bas, clignotement saccadé, partout.
 *   1.25.0 — Lot Notion 26/07, vague 2 : la SÉQUENCE DE MORT en six écrans
 *           (beat fatal → mort → fragment → Registre → relique → relève). La
 *           mort arrive dans la scène : le mot MORT tombe sec, l'écran tremble,
 *           puis les CTA et le texte sont mangés pixel par pixel — chaque pixel
 *           mangé libère une braise orange qui monte. Le bilan chiffré est le
 *           seul endroit du jeu où des nombres bruts sont montrés.
 *   1.26.0 — Lot Notion 26/07, vague 3 : LES CORBEAUX DU COMPTE reviennent —
 *           point d'intérêt de la Colline dont l'examen ajoute une ligne
 *           calculée sur la mémoire de compte (les corbeaux sont exactement
 *           aussi nombreux que tes morts, dit en prose, jamais en chiffre).
 *           + 2 illustrations du lot du 26/07 : l'Appelé vu de dos sur la
 *           Palissade (dernière scène de la zone qui n'avait AUCUNE image) et
 *           la guérite du Veilleur.
 *   1.27.0 — LA TOUR DE GUET EFFONDRÉE : le sixième lieu du Hameau, le seul
 *           qui n'avait aucune scène écrite. Deux écrans (le tertre et ses
 *           trois points d'intérêt, puis le Guetteur sans tour), un Savoir
 *           (`savoir_guet` — la tour surveillait le grand gibet, pas les
 *           Landes) qui ouvre une question au beat suivant, et un objet
 *           passif rare, la Lunette du guetteur.
 *           + FlammeTramee : flamme pixel art procédurale (automate de
 *           chaleur + seuillage de Bayer), deux couleurs, aucun asset.
 *   1.27.1 — Nouvelle image des Potences du cercle (Colline aux Gibets) :
 *           plan rapproché sous les mâts, nœuds coulants visibles. L'ancienne
 *           était une vue large, sans une seule corde — alors que le texte
 *           fait entrer le héros DANS le cercle.
 *   1.29.3 — Options : « Aperçu de l'écran de mort » (retour Patrick 30/07 :
 *           voir la séquence sans avoir à mourir en vrai). Rejoue combustion →
 *           bilan → fragment → Registre → relique à partir de la run/mémoire
 *           réelles, mais ne persiste rien (pas de `recordDeath`, pas de
 *           `resetRun`) — se referme sur place. `bilanDeMort` déplacé dans
 *           DeathScreen.tsx (exporté) pour être partagé sans dupliquer.
 *   1.29.4 — Séquence de mort, retours 30/07 : le cadre occupe toute la
 *           hauteur du téléphone (plus de bande noire sous le lit de braises
 *           sur un device plus haut que 800 px) ; foyer triplé (48 → 144 px),
 *           les flammes montent à ~170 px au lieu de couver ; l'éclat de
 *           cendres de la relique part du bord du cadre, passe DEVANT elle et
 *           traverse tout l'écran (onde + éclats lourds + cendres qui montent).
 *   1.29.5 — Le feu est FERRÉ au bas de l'écran : les dernières rangées
 *           restaient tramées (69-77 % de remplissage) et laissaient voir le
 *           charbon — c'était ça, le « bloc noir en bas » qui subsistait une
 *           fois le cadre déjà collé au device. Socle de 9 px plein, bord
 *           supérieur rongé, + lit incandescent mis à l'échelle du foyer.
 *   1.30.0 — LE MANIFESTE DES ASSETS. Plusieurs illustrations avaient changé
 *           de contenu SOUS LE MÊME NOM : rien dans l'URL ne le signalait, et
 *           le service worker (portée : tout /Pat/aldenhar/, donc l'atelier et
 *           la couverture aussi) servait le cache avant le réseau. Chaque
 *           image porte désormais le hash de son contenu dans son URL — une
 *           image modifiée change d'URL, aucun cache ne peut plus mentir. Les
 *           deux pages d'outillage affichent ce hash (deux vignettes au même
 *           hash = même fichier), un bandeau de fraîcheur (date + commit), et
 *           trois filtres : Doublons · Nouveautés · Introuvable.
 *   1.39.0 — LES ACCUEILS DU HAMEAU. Le 3e beat de l'entrée devient un SLOT :
 *           six accueils s'ajoutent au barrage des trois hommes, tirés une
 *           fois par vie, jamais celui de la vie précédente. Deux sont
 *           conditionnels (le mur de craie à partir de la 2e mort, le départ
 *           des familles si un Serment a déjà été trahi). Le Serment reste
 *           imposé : tout finit au muret. + 14 vignettes de vie du village
 *           sur les liaisons intérieures, dont deux qui dépendent du Serment.
 */
export const APP_VERSION = "1.55.0";
