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

/**
 * Comme `assetUrl`, mais ABSOLU depuis la racine du déploiement.
 *
 * ⚠️ `assetUrl` rend un chemin RELATIF (`assets/x.png?v=…`). Dans une balise
 * `<img>` d'un écran servi à la racine (`/Pat/aldenhar/`) c'est correct — mais
 * depuis une page en sous-dossier (`/Pat/aldenhar/minijeux/`) il résout en
 * `…/minijeux/assets/x.png` et tombe en 404. Le défaut est SILENCIEUX : un
 * `new Image()` qui échoue ne déclenche pas `requestfailed` (un 404 est une
 * réponse), donc l'image manque sans qu'aucun test réseau ne le voie.
 *
 * On ne peut pas lire `process.env.PAGES_BASE_PATH` ici : ce module est chargé
 * côté client, et Next n'inline que les `NEXT_PUBLIC_*`. On déduit donc la
 * racine du `<link rel="manifest">` que le layout pose DÉJÀ avec le bon
 * basePath — une source qui ne peut pas diverger de la configuration réelle.
 * Repli sur le chemin relatif si le lien manque (le rendu reste correct à la
 * racine, qui est le cas de tous les écrans du jeu).
 */
export function assetSrc(chemin: string): string {
  const rel = assetUrl(chemin);
  if (typeof document === "undefined" || rel.startsWith("/") || rel.startsWith("http")) return rel;
  const lien = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
  const href = lien?.getAttribute("href");
  if (!href) return rel;
  const racine = href.slice(0, href.lastIndexOf("/") + 1);
  return racine + rel;
}

/**
 * L'asset existe-t-il vraiment ?
 *
 * Sert aux vignettes OPTIONNELLES (icônes d'état, par exemple) : le catalogue
 * peut nommer une image qui n'a pas encore été produite, et l'écran doit alors
 * afficher le nom seul plutôt qu'une image cassée. Le manifeste liste tous les
 * fichiers réellement présents dans `public/assets/`, donc il fait autorité —
 * une liste blanche écrite à la main dans un composant se périme dès qu'un
 * fichier arrive.
 */
export function assetExiste(chemin: string): boolean {
  const nom = (chemin.split("?")[0].split("/").pop() ?? "");
  return Boolean(HASHES[nom]);
}

/** Même chose pour un `background-image` CSS. */
export function assetCss(chemin: string): string {
  return `url("${assetUrl(chemin)}")`;
}
