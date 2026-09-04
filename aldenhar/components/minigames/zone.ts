/**
 * LA ZONE DE JEU DES MINI-JEUX HABILLÉS — géométrie et bords, en un seul endroit.
 *
 * ⚠️ PLEINE LARGEUR (retour Patrick 04/09 : « je veux qu'ils prennent toute la
 * largeur de l'écran »). La zone faisait 360 px de large dans un overlay à
 * `px-[24px]` : le canvas était donc étiré à 342 px par `.minigame-canvas`
 * (`width: 100%`), soit un facteur 0,95 — une mise à l'échelle NON ENTIÈRE qui
 * floute chaque pixel de la trame. C'est le même défaut que le Crochetage à
 * 300×160 corrigé le 30/08, en plus discret. À 390 px natifs dans un overlay
 * sans marge horizontale, le rapport redevient 1:1.
 *
 * Toute image de fond d'un mini-jeu doit donc faire **390 px de large** — pas
 * 360 rééchantillonné : agrandir une image déjà tramée détruit sa trame (leçon
 * du 25/08). Les fonds ont été RALLONGÉS par miroir de leurs colonnes de bord,
 * ce qui préserve exactement la taille des cellules.
 */
export const ZONE_W = 390;
export const ZONE_H = 499;

const CHARBON = "#1c1a16";

/**
 * LES BORDS SE DISSOLVENT EN PIXELS, en haut et en bas (maquette du 04/09).
 *
 * On repeint du charbon par probabilité croissante en approchant du bord : une
 * DENSITÉ qui décroît, jamais une opacité qui baisse (règle DA — zéro dégradé).
 * Le semis est seedé sur la position, donc il ne scintille pas d'une frame à
 * l'autre. Portée depuis `TimingTap` (01/09), où le procédé a été validé sur la
 * porte du Crochetage : une seule définition, sinon les six moteurs
 * divergeraient au premier réglage.
 *
 * À appeler EN DERNIER dans le rendu d'une frame — elle mange ce qui dépasse,
 * y compris le trait que le joueur vient de tracer.
 */
export function dissoudreBords(
  ctx: CanvasRenderingContext2D,
  w = ZONE_W,
  h = ZONE_H,
  bande = 96
): void {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = CHARBON;
  for (let y = 0; y < h; y++) {
    let k: number;
    if (y < bande) k = 1 - y / bande;
    else if (y > h - bande) k = 1 - (h - y) / bande;
    else continue;
    const p = k * k * 1.05; // dense au ras du bord, clairsemé vers le milieu
    for (let x = 0; x < w; x += 1) {
      const n = ((x * 2654435761 + y * 40503) >>> 0) / 4294967296;
      if (n < p) ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.restore();
}
