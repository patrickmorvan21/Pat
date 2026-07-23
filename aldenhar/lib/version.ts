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
 */
export const APP_VERSION = "1.6.0";
