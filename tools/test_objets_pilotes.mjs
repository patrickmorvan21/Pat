/**
 * PREUVE EN JEU des correctifs 4 et 5 (chantier feedback+fluidité 12/08).
 * Patrick : « ne pas me dire qu'une fonctionnalité est terminée parce qu'un
 * flag fonctionne : je veux voir son effet dans une run ».
 */
import { chromium } from "/home/user/Pat/aldenhar/node_modules/playwright-core/index.mjs";

const URL = "http://127.0.0.1:9012/Pat/aldenhar/index.html?testeur=1";
const ok = [], ko = [];
const dit = (c, m) => (c ? ok : ko).push(m);

function seed(run, mem) {
  return `(() => {
    if (localStorage.getItem("__t")) return;
    localStorage.setItem("__t", "1");
    localStorage.setItem("aldenhar-player", JSON.stringify(${JSON.stringify(mem)}));
    localStorage.setItem("aldenhar-run", JSON.stringify(${JSON.stringify(run)}));
    localStorage.setItem("aldenhar-aide-de", JSON.stringify({off:true}));
  })();`;
}

const MEM = {
  runsStarted: 6, deaths: 3, totalDays: 40, bestDays: 12, relics: [],
  fallen: [], envFlags: {}, bloodDebts: [], zonesCleared: 0,
  chaptersSeen: [], fixations: 0, faits: {}, vus: {}, visitesLieux: {},
  introSeen: true,
};

function baseRun(sceneId, extra = {}) {
  return {
    step: 12, day: 4, health: 1, heroName: "Braise",
    stats: { courage: 4, ruse: 4, instinct: 4, empathie: 4 },
    effects: [], feed: [{ id: 1, kind: "narration", text: "…" }],
    besace: [], looted: [], savoirs: [], fragmentsLus: [], choixFaits: [],
    poiSeen: [], soupcon: 0, soupconSeen: 0, debts: [], rolls: [],
    intrusesVues: [], dropsServis: [], jailerVues: [], journalChoix: [],
    faits: {}, horloge: 3, lieuxEngages: 0, vus: {},
    hameau: { entree: true, serment: "jure", halte: false, sorti: false },
    prologue: { done: true, beat: 99, picks: [] },
    trav: {
      phase: "scene", current: sceneId, visited: ["borne-frontiere", "chemin-creux", "serment-hameau"],
      target: 99, liaisonOpts: null, seed: 7, done: false, credites: [],
    },
    ...extra,
  };
}

async function ecran(page) {
  await page.waitForFunction(() => {
    const b = document.querySelector(".choices-bar");
    return b && getComputedStyle(b).display !== "none" && b.querySelectorAll("button").length;
  }, null, { timeout: 25000 });
  const labels = await page.$$eval(".choices-bar button", (bs) =>
    bs.map((b) => b.textContent.trim()).filter(Boolean));
  const texte = await page.$eval(".scene-text-zone", (e) => e.innerText).catch(() => "");
  return { labels, texte };
}

async function ouvrir(browser, run, mem = MEM) {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.addInitScript(seed(run, mem));
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  // ⚠️ PIÈGE : chercher REPRENDRE juste après `domcontentloaded` rend null
  // (React n'a pas encore rendu l'accueil) — on reste alors sur l'accueil et
  // `.choices-bar` n'apparaît jamais. Il faut ATTENDRE le bouton.
  await page.waitForSelector("button:has-text('REPRENDRE')", { timeout: 15000 });
  await page.click("button:has-text('REPRENDRE')");
  return { page, errs };
}

const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

// ══ 1. La corde : l'objet TRANSFORME la scène au lieu de la faire passer ══
{
  const run = baseRun("puits-condamne", {
    besace: [{ id: "corde-1", name: "Corde coupée", rarity: "rare", kind: "babiole",
               slot: "actif", illustration: "assets/objet_corde_coupee_fille_a.png",
               usage: "…", flavor: "…" }],
  });
  const { page, errs } = await ouvrir(br, run);
  const av = await ecran(page);
  dit(av.labels.some((l) => l.includes("Amarrer la corde")),
      `1a offre de l'outil : ${JSON.stringify(av.labels)}`);
  dit(!av.labels.some((l) => l.includes("Descendre par la corde")),
      "1b la descente n'existe PAS avant l'usage");

  await page.click(".choices-bar button:has-text('Amarrer la corde')");
  const ap = await ecran(page);
  dit(ap.texte.includes("Quelque chose l'a amarrée"),
      "1c la conséquence s'écrit SUR PLACE");
  dit(ap.labels.some((l) => l.includes("Descendre par la corde")),
      `1d la possibilité s'ouvre : ${JSON.stringify(ap.labels)}`);
  dit(!ap.labels.some((l) => l.includes("Coller l'oreille")),
      "1e les options périmées disparaissent (budget tenu)");
  dit(ap.labels.length <= 3, `1f ${ap.labels.length} CTA après usage (≤3)`);

  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("aldenhar-run")));
  dit(st.trav.current === "puits-condamne", `1g on n'a PAS changé d'écran (${st.trav.current})`);
  dit(st.besace.length === 0, "1h l'objet est consommé");
  dit(errs.length === 0, `1i aucune erreur JS (${errs.length})`);
  await page.close();
}

// ══ 2. Le baume : soigner ne saute plus l'écran ══
{
  const run = baseRun("chapelle-des-cordes", {
    health: 0.4,
    effects: [{ id: "entaille", label: "ENTAILLÉ", delta: -2, scenesLeft: 999 }],
    besace: [{ id: "baume-1", name: "Baume de mousse noire", rarity: "commun",
               kind: "soin", slot: "actif", heal: 0.3, cure: true, flavor: "…" }],
  });
  const { page, errs } = await ouvrir(br, run);
  const av = await ecran(page);
  dit(av.labels.some((l) => l.includes("Utiliser")), `2a offre du soin : ${JSON.stringify(av.labels)}`);

  await page.click(".choices-bar button:has-text('Utiliser')");
  const ap = await ecran(page);
  dit(ap.texte.includes("avec ce corps-là"), "2b la conséquence dit ce que ça change pour la suite");
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("aldenhar-run")));
  dit(st.trav.current === "chapelle-des-cordes", `2c même écran (${st.trav.current})`);
  dit(st.health > 0.6, `2d santé remontée (${st.health.toFixed(2)})`);
  dit(!st.effects.some((e) => e.delta < 0), "2e l'entaille est refermée");
  dit(ap.labels.some((l) => l.includes("Monter aux poutres")),
      `2f les options du lieu sont toujours là : ${JSON.stringify(ap.labels)}`);
  dit(errs.length === 0, `2g aucune erreur JS (${errs.length})`);
  await page.close();
}

// ══ 3. La corde se GAGNE réellement à la Chapelle ══
{
  const run = baseRun("chapelle-des-cordes-2", { trav: { ...baseRun("x").trav, current: "chapelle-des-cordes-2" } });
  const { page } = await ouvrir(br, run);
  const av = await ecran(page);
  dit(av.labels.some((l) => l.includes("Prendre la corde coupée")),
      `3a le choix est là : ${JSON.stringify(av.labels)}`);
  await page.close();
}

// ══ 4/5/6. Les trois lecteurs des découvertes orphelines ══
for (const [nom, sceneId, dec, attendu] of [
  ["4 procès", "proces-du-heros", "d.bailli_condamne", "Invoquer le trois cent unième"],
  ["5 toit", "temoin-toit", "d.temoin_nomme", "Ne rien lui donner"],
  ["6 aube", "hameau-halte-4", "d.combles_cloues", "Compter les combles clouées"],
]) {
  // sans la découverte
  {
    const run = baseRun(sceneId, { soupcon: sceneId === "proces-du-heros" ? 6 : 0 });
    run.trav.current = sceneId;
    const { page } = await ouvrir(br, run, { ...MEM, faits: {} });
    const e = await ecran(page);
    dit(!e.labels.some((l) => l.includes(attendu)),
        `${nom} — absent sans la découverte : ${JSON.stringify(e.labels)}`);
    await page.close();
  }
  // avec
  {
    const run = baseRun(sceneId, { soupcon: sceneId === "proces-du-heros" ? 6 : 0 });
    run.trav.current = sceneId;
    const { page, errs } = await ouvrir(br, run, { ...MEM, faits: { [dec]: { id: dec, kind: "discovery", scope: "global_permanent", value: 1, source: "landes" } } });
    const e = await ecran(page);
    dit(e.labels.some((l) => l.includes(attendu)),
        `${nom} — PRÉSENT avec « ${dec} » : ${JSON.stringify(e.labels)}`);
    dit(e.labels.length <= 3, `${nom} — ${e.labels.length} CTA (≤3)`);
    dit(errs.length === 0, `${nom} — aucune erreur JS`);
    await page.close();
  }
}

await br.close();
console.log("\n══ RÉUSSIS ══");
ok.forEach((m) => console.log("  ✓ " + m));
if (ko.length) {
  console.log("\n══ ÉCHECS ══");
  ko.forEach((m) => console.log("  ✗ " + m));
}
console.log(`\n${ok.length}/${ok.length + ko.length}`);
process.exit(ko.length ? 1 : 0);
