/* LE GARDE DES ÉTAGES — la traversée déclarée (lib/zones-salines.ts) et la
   matière de production (data/zones/salines.json) disent-elles la MÊME zone ?
   Et la déclaration passe-t-elle `auditerEtages` (doublons, tirages
   impossibles, étape sans entrée ni pool) ?

   Pourquoi un garde de BUILD : les deux sources ont déjà divergé une fois
   (13/09, avant même la première scène — le tri 33 → 29 s'était fait dans le
   JSON pendant que la table TS restait à écrire). Le graphe des Salines se
   génère depuis le JSON, le moteur lira le TS : un écart entre les deux
   ferait mentir la carte sur ce que le jeu joue.

   Lancer : node --experimental-strip-types tools/verifier_etages.mjs
   (depuis n'importe quel cwd — les chemins partent de ce fichier).          */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { auditerEtages, cibleTotale } from "../aldenhar/lib/etages.ts";
import { SALINES_ENVIRONNEMENTS } from "../aldenhar/lib/zones-salines.ts";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const z = JSON.parse(readFileSync(join(RACINE, "data/zones/salines.json"), "utf8"));
const erreurs = [];
const sceneId = (id) => id.replace(/_/g, "-");   // rive_haute → rive-haute

// ── 1. la déclaration est saine pour le moteur
for (const e of auditerEtages(SALINES_ENVIRONNEMENTS)) erreurs.push("auditerEtages : " + e);

// ── 2. étape par étape, dans l'ordre, le TS = le JSON
const envsJ = [...z.environnements].sort((a, b) => a.ordre - b.ordre);
if (envsJ.length !== SALINES_ENVIRONNEMENTS.length)
  erreurs.push(`${envsJ.length} étapes dans le JSON, ${SALINES_ENVIRONNEMENTS.length} dans le TS`);
const JOUES = new Set(["entree", "pool", "fin"]);
const lieuxJ = z.lieux.filter((l) => JOUES.has(l.role));
for (let i = 0; i < Math.min(envsJ.length, SALINES_ENVIRONNEMENTS.length); i++) {
  const j = envsJ[i], t = SALINES_ENVIRONNEMENTS[i];
  const ou = `étape ${i + 1} (${t.id})`;
  if (j.id !== t.id) erreurs.push(`${ou} : le JSON dit « ${j.id} »`);
  const entreeJ = j.entree ? sceneId(j.entree) : undefined;
  if (entreeJ !== t.entree) erreurs.push(`${ou} : entrée « ${t.entree ?? "—"} » (TS) ≠ « ${entreeJ ?? "—"} » (JSON)`);
  const poolJ = lieuxJ.filter((l) => l.environnement === j.id && l.role === "pool").map((l) => sceneId(l.id)).sort();
  const poolT = [...t.pool].sort();
  if (poolJ.join() !== poolT.join()) erreurs.push(`${ou} : pool (TS) [${poolT}] ≠ (JSON) [${poolJ}]`);
  const finJ = (j.fin || []).map(sceneId);
  if (finJ.join() !== (t.fin || []).join()) erreurs.push(`${ou} : fins (TS) [${t.fin || []}] ≠ (JSON) [${finJ}] — l'ORDRE compte`);
  if ((j.tirages || []).join() !== t.tirages.join()) erreurs.push(`${ou} : tirages (TS) ${t.tirages} ≠ (JSON) ${j.tirages}`);
}
// ── 3. aucun lieu joué du JSON hors de la déclaration, et réciproquement
const dansTS = new Set(SALINES_ENVIRONNEMENTS.flatMap((e) => [e.entree, ...e.pool, ...(e.fin || [])].filter(Boolean)));
for (const l of lieuxJ) if (!dansTS.has(sceneId(l.id))) erreurs.push(`lieu joué « ${l.id} » absent de la déclaration TS`);
const dansJ = new Set(lieuxJ.map((l) => sceneId(l.id)));
for (const id of dansTS) if (!dansJ.has(id)) erreurs.push(`« ${id} » déclaré dans le TS sans lieu joué dans le JSON`);

const cible = cibleTotale(SALINES_ENVIRONNEMENTS);
console.log(`verifier_etages — ${SALINES_ENVIRONNEMENTS.length} étapes · ${dansTS.size} lieux déclarés · cible totale ${cible}`);
for (const e of erreurs) console.log("  ✗ " + e);
console.log(erreurs.length ? `  ${erreurs.length} erreur(s)` : "  ✓ la déclaration TS et salines.json disent la même zone, auditerEtages sain");
process.exit(erreurs.length ? 1 : 0);
