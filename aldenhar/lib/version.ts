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
 */
export const APP_VERSION = "1.2.0";
