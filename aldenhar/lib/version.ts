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
 */
export const APP_VERSION = "1.13.0";
