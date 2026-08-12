/**
 * BANC DE MESURE DE LA BOUCLE — les cinq métriques du chantier.
 *
 * Mesure, lieu par lieu, en jouant réellement :
 *   1. proportion d'écrans qui offrent une décision
 *   2. taps moyens de lecture avant chaque décision
 *   3. nombre d'actions visibles à l'ARRIVÉE
 *   4. nombre de points d'intérêt / observations consultés par visite
 *   5. sous-menus ouverts
 *
 * ⚠️ POURQUOI CE BANC EXISTE : `tools/joueur.mjs` EXCLUT « Observer les
 * alentours » de ses choix. Les transcripts qu'il produit sont donc
 * inutilisables comme mesure AVANT du chantier — ils n'ouvrent jamais le
 * sous-menu qu'on veut supprimer. Ici, le profil CURIEUX l'ouvre et vide la
 * liste, exactement comme le joueur que le chantier décrit.
 *
 * Usage :
 *   node tools/mesure_boucle.mjs --url <base> --sortie /tmp/x.json
 *        [--lieux serment-hameau,campement,colline-aux-gibets]
 */
import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RACINE = dirname(dirname(fileURLToPath(import.meta.url)));
const pw = [
  join(RACINE, "aldenhar/node_modules/playwright-core/index.mjs"),
  join(RACINE, "node_modules/playwright-core/index.mjs"),
].find((c) => existsSync(c));
if (!pw) { console.error("playwright-core introuvable"); process.exit(2); }
const { chromium } = await import(pw);

const arg = (n, d = null) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const URL_BASE = arg("url", "http://127.0.0.1:8941/Pat/aldenhar/");
const SORTIE = arg("sortie", "/tmp/mesure.json");
const LIEUX = String(arg("lieux", "serment-hameau,campement,colline-aux-gibets")).split(",");

const OBSERVER = "Observer les alentours";
const FERMER = "Ne rien regarder de plus";
const STAT = /(COURAGE|RUSE|INSTINCT|EMPATHIE)/;

const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const resultat = {};

/** Le compte de vétéran : sans lui les systèmes inter-vies dorment. */
const MEM = {
  runsStarted: 6, deaths: 3, renoncements: 0, zonesCleared: 0, totalDays: 21, bestDays: 11,
  introSeen: true, relics: [], fallen: [
    { name: "Suie", days: 11, cause: "pendu au Grand Gibet", place: "colline-aux-gibets" },
    { name: "Le Tardif", days: 6, cause: "noyé à la Mare", place: "mare-aux-regards" },
    { name: "Corbeau", days: 4, cause: "jugé au Petit Tribunal", place: "petit-tribunal" },
  ],
  lastDeath: { day: 4, lieu: "colline-aux-gibets", fixation: false, rarity: "commune", classed: true, acte: 1 },
  envFlags: {}, visitesLieux: {}, vus: {}, faits: {}, chaptersSeen: [], fixations: 0, surprises: {},
};

async function mesurer(lieu, profil) {
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.addInitScript(([mem, dep]) => {
    if (localStorage.getItem("__m")) return;
    localStorage.setItem("__m", "1");
    localStorage.setItem("aldenhar-run", JSON.stringify({
      step: 9, day: 2, health: 1, feed: [{ id: "x", kind: "narration", text: "seed" }],
      besace: [], effects: [], soupcon: 1, soupconSeen: 1, prologue: { done: true },
      heroName: "Braise",
      // ⚠️ MINUSCULES. `RunStats` est {courage, ruse, instinct, empathie} ;
      // avec des capitales, `migrateStats` ne reconnaît rien et tire un
      // profil ALÉATOIRE — la mesure porte alors sur un héros inconnu, et
      // AVANT/APRÈS ne sont plus comparables. Défaut trouvé le 12/08 après
      // une première campagne de mesure, qui est donc à refaire.
      stats: { courage: 3, ruse: 4, instinct: 4, empathie: 4 },
      hameau: { entree: false, serment: null },
      trav: { phase: "scene", current: dep, visited: ["chemin-creux"], target: 14,
              liaisonOpts: null, seed: 5, done: false },
    }));
    localStorage.setItem("aldenhar-player", JSON.stringify(mem));
    localStorage.setItem("aldenhar-settings", JSON.stringify({ music: false, chronosOff: true }));
    localStorage.setItem("aldenhar-aide-de", JSON.stringify({ off: true, ok: true, ko: true }));
    localStorage.setItem("aldenhar-aide-menu", JSON.stringify({ off: true }));
    localStorage.setItem("pactum-de-geste", "1");
  }, [MEM, lieu]);
  await p.goto(URL_BASE + "?testeur=1", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1300);
  const rep = p.locator("button", { hasText: "REPRENDRE" });
  if (await rep.count()) await rep.first().click();

  const pret = () => p.evaluate(() => {
    const b = document.querySelector(".choices-bar");
    return Boolean(b) && getComputedStyle(b).display !== "none";
  });
  const tape = () => p.evaluate(() => Boolean(document.querySelector(".type-cursor")));
  const boutons = () => p.evaluate(() =>
    [...document.querySelectorAll(".choices-bar button.choice-btn")].map((b) => ({
      t: b.innerText.replace(/\s+/g, " ").trim(),
      verrou: b.getAttribute("aria-disabled") === "true",
    })));
  const sceneId = () => p.evaluate(() => {
    try { return JSON.parse(localStorage.getItem("aldenhar-run")).trav?.current || ""; }
    catch { return ""; }
  });

  const racine = (s) => String(s).replace(/-\d+$/, "");
  const cible = racine(lieu);
  const log = [];
  let tapsLecture = 0, ecransLecture = 0, ecransDecision = 0;
  let sousMenus = 0, poiConsultes = 0, actionsArrivee = null, jets = 0;
  let sorti = false;

  for (let tour = 0; tour < 90 && !sorti; tour++) {
    // finir la frappe puis avancer jusqu'aux choix
    let garde = 0;
    while (!(await pret()) && garde < 16) {
      for (let w = 0; w < 24 && (await tape()); w++) await p.waitForTimeout(250);
      if (await pret()) break;
      await p.mouse.click(195, 560);
      tapsLecture += 1; ecransLecture += 1;
      await p.waitForTimeout(450);
      garde += 1;
    }
    if (!(await pret())) break;

    const bs = await boutons();
    if (!bs.length) break;
    ecransDecision += 1;

    const enSousMenu = bs.some((b) => b.t === FERMER);
    if (actionsArrivee === null && !enSousMenu) actionsArrivee = bs.length;

    const jouables = bs.filter((b) => !b.verrou);
    let pick;
    if (profil === "curieuse") {
      // ouvre le sous-menu s'il existe, puis vide la liste, puis sort
      pick = jouables.find((b) => b.t === OBSERVER)
        ?? jouables.find((b) => b.t !== FERMER && !STAT.test(b.t))
        ?? jouables.find((b) => b.t !== FERMER)
        ?? jouables[0];
    } else {
      // pressée : une action à dé, sinon la première qui n'est pas de la contemplation
      pick = jouables.find((b) => STAT.test(b.t))
        ?? jouables.find((b) => b.t !== OBSERVER && b.t !== FERMER)
        ?? jouables[0];
    }
    if (pick.t === OBSERVER) sousMenus += 1;
    if (enSousMenu && pick.t !== FERMER) poiConsultes += 1;
    log.push({ boutons: bs.map((b) => b.t), pris: pick.t, sousMenu: enSousMenu });

    const idx = bs.findIndex((b) => b.t === pick.t);
    await p.locator(".choices-bar button.choice-btn").nth(idx).click();
    await p.waitForTimeout(850);

    // le dé, s'il s'arme
    const ring = p.locator(".die-ring");
    if (await ring.count()) {
      const bb = await ring.first().boundingBox();
      if (bb) {
        await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
        jets += 1;
        await p.waitForTimeout(3400);
        await p.mouse.click(195, 400);
        await p.waitForTimeout(800);
      }
    }
    const cur = await sceneId();
    if (cur && !racine(cur).startsWith(cible) && !String(cur).startsWith("liaison:")) {
      // on a changé de lieu (rencontre rattachée exclue par le préfixe)
      if (!["femme-seuil", "gamin-murets", "hameau-entree", "hameau-accueil"].some((x) => String(cur).startsWith(x))) sorti = true;
    }
    if (String(cur).startsWith("liaison:")) sorti = true;
  }

  const ecrans = ecransLecture + ecransDecision;
  await ctx.close();
  return {
    ecrans, ecransDecision, ecransLecture,
    partDecision: ecrans ? ecransDecision / ecrans : 0,
    tapsAvantDecision: ecransDecision ? tapsLecture / ecransDecision : 0,
    actionsArrivee, sousMenus, poiConsultes, jets,
    taps: tapsLecture + ecransDecision,
    erreurs: errs.length, log,
  };
}

for (const lieu of LIEUX) {
  resultat[lieu] = {};
  for (const profil of ["curieuse", "pressee"]) {
    const r = await mesurer(lieu, profil);
    resultat[lieu][profil] = r;
    console.log(
      `${lieu.padEnd(20)} ${profil.padEnd(9)} ` +
      `écrans ${String(r.ecrans).padStart(2)} · décision ${String(r.ecransDecision).padStart(2)} ` +
      `(${(r.partDecision * 100).toFixed(0)}%) · ${r.tapsAvantDecision.toFixed(1)} tap/déc · ` +
      `arrivée ${r.actionsArrivee ?? "?"} · sous-menus ${r.sousMenus} · POI ${r.poiConsultes} · jets ${r.jets}` +
      (r.erreurs ? ` · ⚠️ ${r.erreurs} erreur(s) JS` : ""));
  }
}

// synthèse
const tous = Object.values(resultat).flatMap((o) => Object.values(o));
const moy = (f) => tous.reduce((a, r) => a + f(r), 0) / tous.length;
console.log(
  `\nSYNTHÈSE — part d'écrans à décision ${(moy((r) => r.partDecision) * 100).toFixed(0)} % · ` +
  `${moy((r) => r.tapsAvantDecision).toFixed(2)} tap(s) de lecture avant décision · ` +
  `${moy((r) => r.sousMenus).toFixed(1)} sous-menu(s)/visite · ` +
  `${moy((r) => r.poiConsultes).toFixed(1)} observation(s)/visite`);

writeFileSync(SORTIE, JSON.stringify(resultat, null, 1), "utf8");
console.log(`écrit : ${SORTIE}`);
await br.close();
