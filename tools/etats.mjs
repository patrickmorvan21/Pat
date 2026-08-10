/**
 * 7e GARDE DE BUILD — la couverture minimale des états.
 *
 * `lib/etats.ts` affirmait en tête de fichier que « auditEtats() le vérifie
 * par script ». La relecture par agents du 10/08 a établi qu'AUCUN script ne
 * l'appelait — ni prebuild, ni tools/. Un garde que tout le monde croit
 * branché est pire que pas de garde du tout : plus personne ne revérifie à la
 * main. La phrase est maintenant vraie.
 *
 * Exécute la VRAIE fonction du jeu (jamais une copie qui divergerait).
 * Usage : node --experimental-strip-types --import ./tools/etats-hook.mjs tools/etats.mjs [--strict]
 */
const { auditEtats, ETATS } = await import("../aldenhar/lib/etats.ts");
const manquants = auditEtats();
const strict = process.argv.includes("--strict");
if (manquants.length === 0) {
  console.log(`COUVERTURE DES ÉTATS — ${ETATS.length} états, couverture minimale tenue.`);
  process.exit(0);
}
console.log(`COUVERTURE DES ÉTATS — ${manquants.length} état(s) incomplet(s) :`);
for (const m of manquants) console.log(`  • ${m.id} — manque : ${m.manques.join(", ")}`);
console.log(
  "\nUn état sans cette couverture n'est pas livrable (règle en tête de\n" +
    "lib/etats.ts) : 1 source · 1 manifestation · 2 réactions du monde ·\n" +
    "1 choix ou jet modifié · 1 manière de le perdre."
);
process.exit(strict ? 1 : 0);
