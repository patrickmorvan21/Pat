// Lancer : node --experimental-strip-types tools/simuler_salines.mjs
// (depuis la racine du dépôt). Les configurations comparées sont celles de
// data/salines-routage.md — la D est la proposition.
// Simule des traversées des Salines avec le VRAI moteur (lib/etages.ts) sur une
// configuration de routage proposée, et mesure : lieux/run, combats/run,
// fragments lisibles/run, part des runs qui liraient les six.
import { ouvrirEtage, premierLieu, entrerLieu, prochainPas } from "../aldenhar/lib/etages.ts";
import { readFileSync } from "node:fs";
const Z = JSON.parse(readFileSync(new URL("../data/zones/salines.json", import.meta.url), "utf8"));
const L = Object.fromEntries(Z.lieux.map(l => [l.id, l]));

const configs = {
  "D · Fossé = beat d'arrivée des Rues (plus un lieu) ; fins Saulnes = Rues, Quai, Tour ; F2 aux Terrasses ; Barge exclusive (F1 OU F4)": {
    exclus: ["sonde", "broyeuse", "bassin_comble", "fosse"], oblig_extra: ["quai_de_l_ile"], sansEntreeSaulnes: true,
    f2Terrasses: true, bargeExclusive: true,
    tirages: { croute: [1,2], bassins: [1,2], salines: [1,1], saulnes: [0,1] } },
  "E · D mais Croûte 2 tirages fixes": {
    exclus: ["sonde", "broyeuse", "bassin_comble", "fosse"], oblig_extra: ["quai_de_l_ile"], sansEntreeSaulnes: true,
    f2Terrasses: true, bargeExclusive: true,
    tirages: { croute: [2,2], bassins: [1,2], salines: [1,1], saulnes: [0,1] } },
  "A · bible telle quelle (33 lieux, tirages 1-2 partout)": {
    exclus: [], oblig_extra: [], tirages: { croute: [1,2], bassins: [1,2], salines: [1,2], saulnes: [1,2] } },
  "B · proposition (30 lieux : −sonde, broyeuse→forge, comble→passerelle ; quai obligatoire ; Saulnes 1 tirage)": {
    exclus: ["sonde", "broyeuse", "bassin_comble"], oblig_extra: ["quai_de_l_ile"],
    tirages: { croute: [1,2], bassins: [1,2], salines: [1,2], saulnes: [1,1] } },
  "C · B mais Croûte 2 tirages fixes (le danger d'abord)": {
    exclus: ["sonde", "broyeuse", "bassin_comble"], oblig_extra: ["quai_de_l_ile"],
    tirages: { croute: [2,2], bassins: [1,2], salines: [1,1], saulnes: [1,1] } },
};

function envsDe(cfg) {
  return Z.environnements.map(e => {
    const fin = [...e.fin];
    if (e.id === "saulnes" && cfg.oblig_extra.includes("quai_de_l_ile")) fin.splice(1, 0, "quai_de_l_ile");
    const pool = Z.lieux.filter(l => l.environnement === e.id && l.role === "pool"
      && !cfg.exclus.includes(l.id) && !cfg.oblig_extra.includes(l.id)).map(l => l.id);
    const entree = (e.id === "saulnes" && cfg.sansEntreeSaulnes) ? undefined : (e.entree ?? undefined);
    return { id: e.id, nom: e.nom, entree, pool, tirages: cfg.tirages[e.id], fin };
  });
}
function jouer(envs, seed, choisir) {
  const visited = [premierLieu(envs, seed)];
  let et = entrerLieu(envs, ouvrirEtage(envs, 0, seed), visited[0]);
  for (let i = 0; i < 60; i++) {
    const r = prochainPas(envs, et, visited, seed + i * 977); et = r.etage;
    if (r.pas.type === "descente") return visited;
    const id = r.pas.type === "lieu" ? r.pas.id : choisir(r.pas.options, seed + i);
    visited.push(id); et = entrerLieu(envs, et, id);
  }
  return visited;
}
const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor((s.length - 1) * p)]; };

for (const [nom, cfg] of Object.entries(configs)) {
  const envs = envsDe(cfg);
  const total = envs.reduce((n, e) => n + (e.entree ? 1 : 0) + e.pool.length + e.fin.length, 0);
  const lieux = [], combats = [], frags = [], six = [], cinq = [];
  let f2ok = 0, perchoirAvecF2 = 0;
  for (let s = 1; s <= 600; s++) {
    const v = jouer(envs, s, (o, k) => o[(k * 7919 + s) % o.length]);
    lieux.push(v.length);
    combats.push(v.reduce((n, id) => n + (L[id].combats.length ? 1 : 0), 0));
    const fr = new Set(v.flatMap(id => {
      let f = L[id].fragments;
      if (cfg.bargeExclusive && id === "barge_echouee") f = [f[(s % 2)]];
      if (cfg.f2Terrasses && id === "terrasses") f = [...f, "f2_le_heron_s_envole"];
      return f; }));
    frags.push(fr.size); six.push(fr.size >= 6 ? 1 : 0); cinq.push(fr.size >= 5 ? 1 : 0);
    if (fr.has("f2_le_heron_s_envole")) { f2ok++; if (v.includes("perchoir_du_heron")) perchoirAvecF2++; }
  }
  console.log(`\n${nom}\n  lieux dans la zone : ${total} · lieux/run : min ${q(lieux,0)} · médiane ${q(lieux,.5)} · max ${q(lieux,1)}`
    + `\n  combats/run : min ${q(combats,0)} · médiane ${q(combats,.5)} · max ${q(combats,1)}`
    + `\n  fragments lisibles/run : min ${q(frags,0)} · médiane ${q(frags,.5)} · max ${q(frags,1)} · runs qui liraient LES SIX : ${(100*six.reduce((a,b)=>a+b,0)/600).toFixed(1)} % · ≥5 : ${(100*cinq.reduce((a,b)=>a+b,0)/600).toFixed(1)} %`
    + `\n  F2 offert (Radeau ou Guérite visité) : ${(100*f2ok/600).toFixed(0)} % des runs · dont Perchoir aussi visité : ${(100*perchoirAvecF2/Math.max(1,f2ok)).toFixed(0)} %`);
}
