/**
 * L'URL D'UN ASSET — avec le hash de son contenu (30/07).
 *
 * Le problème qu'on répare : plusieurs illustrations ont changé de CONTENU en
 * gardant le même nom de fichier. Rien dans l'URL ne le signalait, donc ni le
 * navigateur ni le service worker n'allaient rechercher l'image — l'ancienne
 * version restait affichée. Et le SW a pour portée tout « /Pat/aldenhar/ » :
 * l'atelier et la page de couverture sont dedans, elles subissaient le même
 * cache applicatif (stale-while-revalidate), plus tenace qu'un cache HTTP.
 *
 * `assetUrl()` suffixe donc chaque image de son hash court : une image
 * modifiée change d'URL, donc plus aucun cache ne peut servir l'ancienne. Le
 * bénéfice inverse est vrai aussi — une URL qui porte son hash est immuable,
 * donc le SW peut la garder agressivement sans jamais mentir.
 *
 * Le manifeste est IMPORTÉ (pas fetché) pour que la fonction reste synchrone :
 * elle est appelée en plein rendu, un await y serait ingérable. Il est
 * regénéré avant chaque build par `npm run gen:manifest`.
 *
 * ⚠️ À utiliser au moment du RENDU, jamais dans les données : `scene-data.ts`
 * et `besace.ts` gardent des chemins propres et diffables (« assets/x.png »),
 * c'est le composant qui les affiche qui appelle `assetUrl()`.
 */

import manifest from "@/lib/assets-manifest.json";

const HASHES = manifest as Record<string, string>;

/**
 * `assets/scene_x.png` → `assets/scene_x.png?v=a3f2b9c1`
 *
 * Un chemin inconnu du manifeste (asset ajouté sans regénérer, ou URL déjà
 * absolue) ressort INCHANGÉ : mieux vaut une image potentiellement cachée
 * qu'une image cassée.
 */
export function assetUrl(chemin: string): string {
  if (!chemin || chemin.startsWith("data:") || chemin.startsWith("http")) return chemin;
  const [nu, requete] = chemin.split("?");
  if (requete) return chemin; // déjà versionné par l'appelant
  const nom = nu.split("/").pop() ?? "";
  const h = HASHES[nom];
  return h ? `${nu}?v=${h}` : chemin;
}

/** Même chose pour un `background-image` CSS. */
export function assetCss(chemin: string): string {
  return `url("${assetUrl(chemin)}")`;
}
