/* LA TRAVERSÉE À ÉTAGES — test unitaire du module pur (lib/etages.ts).
   C'est la seule preuve possible tant qu'aucune zone à étages n'est écrite :
   l'enchaînement est inatteignable en jeu (lib/zones.ts, `ecrite`).
   Lancer : node --experimental-strip-types tools/test_etages.mjs            */
import { ouvrirEtage, premierLieu, entrerLieu, prochainPas, cibleTotale, auditerEtages }
  from "../aldenhar/lib/etages.ts";

let ok = 0, ko = 0;
const t = (n, c, i = "") => { c ? ok++ : ko++; console.log(`${c ? "  ✓" : "  ✗"} ${n}${i ? "  — " + i : ""}`); };

// Une zone factice qui a la FORME des Salines : 4 étapes, entrée / pool /
// fin, dont une étape sans entrée (le chantier) et une dernière à deux fins.
const ENVS = [
  { id: "croute",  nom: "La Croûte",  entree: "rive-haute", pool: ["file", "sillages", "barge", "statue", "bouche", "sonde", "radeau"], tirages: [1, 2] },
  { id: "bassins", nom: "Les Bassins", entree: "terrasses", pool: ["passerelle", "perchoir", "lechards", "cuve", "guerite", "noria"], tirages: [1, 2] },
  { id: "salines", nom: "Les Salines",                      pool: ["pesee", "puits", "dortoir", "forge", "cour", "gages"], tirages: [1, 2], fin: ["entrepot"] },
  { id: "saulnes", nom: "Saulnes",    entree: "fosse",      pool: ["porte", "auberge", "belvedere", "maison", "quai"], tirages: [1, 2], fin: ["rues", "tour"] },
];

/** Joue une traversée complète en prenant toujours la 1re option : rend la
    liste des lieux dans l'ordre. */
function jouer(envs, seed, choisir = (o) => o[0]) {
  const visited = [premierLieu(envs, seed)];
  let etage = ouvrirEtage(envs, 0, seed);
  etage = entrerLieu(envs, etage, visited[0]);
  for (let i = 0; i < 40; i++) {
    const r = prochainPas(envs, etage, visited, seed);
    etage = r.etage;
    if (r.pas.type === "descente") return { visited, fini: true };
    const id = r.pas.type === "lieu" ? r.pas.id : choisir(r.pas.options);
    visited.push(id);
    etage = entrerLieu(envs, etage, id);
  }
  return { visited, fini: false };
}

console.log("\nA. La forme de la zone");
t("audit sain sur la zone factice", auditerEtages(ENVS).length === 0, auditerEtages(ENVS).join(" ; "));
t("cible totale = 3 entrées + 8 tirages max + 3 fins = 14", cibleTotale(ENVS) === 14, String(cibleTotale(ENVS)));
t("le premier lieu est l'entrée de la Croûte", premierLieu(ENVS, 1) === "rive-haute");

console.log("\nB. Une traversée, première option partout (graine 7)");
{
  const { visited, fini } = jouer(ENVS, 7);
  t("elle finit", fini, visited.join(" → "));
  const idx = (id) => visited.indexOf(id);
  t("l'ordre des étapes est respecté : rive-haute < terrasses < entrepot < fosse < rues < tour",
    idx("rive-haute") < idx("terrasses") && idx("terrasses") < idx("entrepot") && idx("entrepot") < idx("fosse") && idx("fosse") < idx("rues") && idx("rues") < idx("tour"));
  t("la Tour est le DERNIER lieu", visited[visited.length - 1] === "tour");
  t("les Rues précèdent immédiatement la Tour (fins dans l'ordre)", visited[visited.length - 2] === "rues");
  t("aucun lieu visité deux fois", new Set(visited).size === visited.length);
  const entreCroute = visited.slice(1, idx("terrasses"));
  t("entre la Rive haute et les Terrasses : 1 ou 2 lieux de la Croûte, jamais d'un autre pool",
    entreCroute.length >= 1 && entreCroute.length <= 2 && entreCroute.every((id) => ENVS[0].pool.includes(id)), entreCroute.join(","));
  const entreEntrepot = visited.slice(idx("terrasses") + 1, idx("entrepot"));
  const salinesPool = entreEntrepot.filter((id) => ENVS[2].pool.includes(id));
  t("le chantier (sans entrée) se joue par le pool puis se ferme sur l'Entrepôt",
    salinesPool.length >= 1 && salinesPool.length <= 2 && entreEntrepot.every((id) => ENVS[1].pool.includes(id) || ENVS[2].pool.includes(id)));
  t("longueur totale entre 9 et 14", visited.length >= 9 && visited.length <= 14, String(visited.length));
}

console.log("\nC. Déterminisme et variété");
{
  const a = jouer(ENVS, 42).visited.join(",");
  const b = jouer(ENVS, 42).visited.join(",");
  t("même graine → même traversée", a === b);
  const distinctes = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => jouer(ENVS, s).visited.join(","))).size;
  t("8 graines → plusieurs traversées différentes", distinctes >= 4, `${distinctes} distinctes`);
  // La deuxième option est prise : les Croisées offrent bien deux lieux.
  const deux = jouer(ENVS, 7, (o) => o[o.length - 1]);
  t("prendre l'autre direction finit aussi", deux.fini && deux.visited[deux.visited.length - 1] === "tour");
}

console.log("\nD. Les cas limites");
{
  // Pool plus petit que la cible : on ne bloque jamais.
  const petit = [{ id: "x", nom: "X", entree: "e", pool: ["p1"], tirages: [2, 2], fin: ["f"] }];
  const r = jouer(petit, 3);
  t("pool épuisé avant la cible → on passe aux fins sans bloquer", r.fini && r.visited.join(",") === "e,p1,f", r.visited.join(","));
  // Un seul lieu libre : Croisée à une option.
  const et = entrerLieu(petit, ouvrirEtage(petit, 0, 3), "e");
  const p = prochainPas(petit, et, ["e"], 3).pas;
  t("un seul lieu libre → une Croisée à UNE option", p.type === "croisee" && p.options.length === 1);
  // Une rencontre (id hors étape) ne compte pas.
  const et2 = entrerLieu(ENVS, ouvrirEtage(ENVS, 0, 1), "hesitant-1");
  t("un id hors étape (rencontre) ne fait pas avancer le compte", et2.tires === 0 && et2.fins === 0);
  // Audit : doublon et tirages impossibles sont signalés.
  const mal = [
    { id: "a", nom: "A", entree: "e", pool: ["p", "q"], tirages: [6, 5] },
    { id: "b", nom: "B", pool: ["p"], tirages: [1, 1] },
  ];
  const d = auditerEtages(mal);
  t("l'audit signale min>max, max>pool et le doublon", d.length === 3, d.join(" ; "));
  const vide = [{ id: "v", nom: "V", pool: [], tirages: [0, 0] }];
  t("l'audit signale une étape sans entrée ni pool", auditerEtages(vide).length === 1);
}

console.log(`\n${ok} ✓   ${ko} ✗`);
process.exit(ko ? 1 : 0);
