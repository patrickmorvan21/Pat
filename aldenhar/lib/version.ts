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
 */
export const APP_VERSION = "1.17.0";
