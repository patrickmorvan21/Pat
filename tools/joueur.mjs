/**
 * L'AUTO-JOUEUR DE PACTUM — enregistre des vies réelles sur le build servi.
 *
 * ⚠️ CE FICHIER VIT DANS LE DÉPÔT, ET C'EST DÉLIBÉRÉ. Sa version précédente
 * vivait dans un scratchpad de session : elle n'a pas survécu, et le paquet
 * de playtest s'est retrouvé à promettre des « parties réelles enregistrées »
 * qu'il ne contenait plus. Un outil dont dépend un livrable ne vit pas dans
 * un dossier temporaire.
 *
 * Usage :
 *   node tools/joueur.mjs --url http://127.0.0.1:8941/Pat/aldenhar/ \
 *        --strategie explore --sortie /tmp/vie.md --ecrans 140 [--vierge]
 *
 * Stratégies : premier · dernier · risque (préfère les jets) · explore
 * (préfère les points d'intérêt) · hasard.
 *
 * Par défaut le compte est celui d'un VÉTÉRAN (morts, reliques, lieux déjà
 * traversés) — sans quoi tous les systèmes inter-vies dorment et un
 * relecteur conclut à tort qu'ils n'existent pas (biais mesuré le 9/08).
 * `--vierge` joue une toute première partie, prologue compris.
 */
import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ⚠️ `playwright-core` n'est pas installé à la racine : il vit sous
// aldenhar/node_modules (ou dans le cache npx). Un import nu échoue depuis
// tools/ — on le résout à la main plutôt que d'exiger un cwd particulier.
const RACINE = dirname(dirname(fileURLToPath(import.meta.url)));
const CANDIDATS = [
  join(RACINE, "aldenhar/node_modules/playwright-core/index.mjs"),
  join(RACINE, "node_modules/playwright-core/index.mjs"),
  process.env.PLAYWRIGHT_CORE || "",
].filter(Boolean);
const chemin = CANDIDATS.find((c) => existsSync(c));
if (!chemin) {
  console.error("playwright-core introuvable. Essayé :\n  " + CANDIDATS.join("\n  "));
  process.exit(2);
}
const { chromium } = await import(chemin);

const arg = (n, d = null) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : (process.argv.includes(`--${n}`) ? true : d);
};

const URL_BASE = String(arg("url", "http://127.0.0.1:8941/Pat/aldenhar/"));
const STRAT = String(arg("strategie", "explore"));
const SORTIE = String(arg("sortie", "/tmp/vie-pactum.md"));
const MAX = Number(arg("ecrans", 140));
const VIERGE = Boolean(arg("vierge", false));

/** Un compte qui a vécu : c'est la seule façon de voir la mémoire du monde. */
const MEMOIRE_VETERAN = {
  runsStarted: 6,
  deaths: 3,
  renoncements: 0,
  zonesCleared: 0,
  totalDays: 21,
  bestDays: 11,
  introSeen: true,
  relics: [
    { id: "r1", name: "Œil de lanterne verte", rarity: "rare", relicId: "oeil-lanterne" },
    { id: "r2", name: "Vertèbre gravée", rarity: "commune", relicId: "vertebre-gravee" },
  ],
  fallen: [
    { name: "Suie", days: 11, cause: "pendu au Grand Gibet", place: "colline-aux-gibets" },
    { name: "Le Tardif", days: 6, cause: "noyé à la Mare", place: "mare-aux-regards" },
    { name: "Corbeau", days: 4, cause: "jugé au Petit Tribunal", place: "petit-tribunal" },
  ],
  lastDeath: { day: 4, lieu: "colline-aux-gibets", fixation: false, rarity: "commune", classed: true, acte: 1 },
  envFlags: { "echarde-gibet-prelevee": true },
  // Des lieux déjà traversés : c'est ce qui réveille la familiarité et la
  // mémoire des PNJ (onze personnages la portent).
  visitesLieux: {
    "borne-frontiere": 3, "chemin-creux": 2, "colline-aux-gibets": 2,
    "champ-des-fixes": 2, "marche-muet": 2, "verger-noir": 2,
    "chapelle-des-cordes": 2, "serment-hameau": 2, "campement": 2,
  },
  vus: {},
  faits: {},
  chaptersSeen: [],
  fixations: 0,
  surprises: {},
};

const nettoie = (s) => s.replace(/ /g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

const br = await chromium.launch({
  executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium",
});
const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const erreurs = [];
const echecsReseau = [];
page.on("pageerror", (e) => erreurs.push(String(e)));
page.on("response", (r) => { if (r.status() >= 400) echecsReseau.push(`${r.status()} ${r.url()}`); });

await page.addInitScript(([mem, vierge]) => {
  if (localStorage.getItem("__joueur")) return;
  localStorage.setItem("__joueur", "1");
  localStorage.setItem("aldenhar-settings", JSON.stringify({ music: false, chronosOff: true }));
  localStorage.setItem("aldenhar-aide-de", JSON.stringify({ off: true, ok: true, ko: true }));
  localStorage.setItem("aldenhar-aide-menu", JSON.stringify({ off: true }));
  localStorage.setItem("pactum-de-geste", "1");
  if (!vierge) localStorage.setItem("aldenhar-player", JSON.stringify(mem));
}, [MEMOIRE_VETERAN, VIERGE]);

await page.goto(URL_BASE + "?testeur=1", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);

/* ─── l'accueil ─── */
for (const lib of ["COMMENCER", "REPRENDRE"]) {
  const b = page.locator("button", { hasText: lib });
  if (await b.count()) { await b.first().click(); break; }
}
await page.waitForTimeout(900);

const journal = [];
let n = 0, dernierTexte = "";

/** Le texte de l'écran, sans les boutons ni le chrome. */
async function texteEcran() {
  return page.evaluate(() => {
    const z = document.querySelector(".scene-text-zone") || document.querySelector(".feed");
    if (!z) return document.body.innerText || "";
    return z.innerText || "";
  });
}

async function boutons() {
  return page.evaluate(() =>
    [...document.querySelectorAll(".choices-bar button.choice-btn")].map((b, i) => ({
      i,
      // ⚠️ innerText applique text-transform : on garde le rendu VU.
      label: b.innerText.replace(/\s+/g, " ").trim(),
      // ⚠️ un choix VERROUILLÉ porte aria-disabled, jamais disabled — le
      //   cliquer « marche » mais ne fait qu'afficher un refus en diégèse.
      verrouille: b.getAttribute("aria-disabled") === "true",
    })));
}

async function pretAChoisir() {
  return page.evaluate(() => {
    const b = document.querySelector(".choices-bar");
    return Boolean(b) && getComputedStyle(b).display !== "none";
  });
}

/** Vrai tant qu'un bloc se tape : on n'enregistre jamais un écran à moitié écrit. */
async function enTrainDecrire() {
  return page.evaluate(() => Boolean(document.querySelector(".type-cursor")));
}

async function attendreFinDeFrappe(max = 26) {
  for (let i = 0; i < max; i++) {
    if (!(await enTrainDecrire())) return;
    await page.waitForTimeout(260);
  }
}

/**
 * LE SEUIL (prologue). Ses boutons n'ont aucune classe propre : on prend les
 * `button` de la colonne, en excluant l'icône de menu (aria-label) et le lien
 * « Qu'il choisisse pour moi » — ⚠️ ce dernier ne fait que REMPLIR le champ,
 * le cliquer en boucle bloque le script indéfiniment (piège du 26/07).
 */
async function jouerLeSeuil() {
  for (let tour = 0; tour < 40; tour++) {
    if (await page.locator(".choices-bar").count()) return true; // on est en jeu
    await attendreFinDeFrappe();
    // l'écran du Nom
    const champ = page.locator('input[type="text"]');
    if (await champ.count()) {
      await champ.first().fill("Cendre");
      const sceller = page.locator("button", { hasText: /SCELLER/i });
      if (await sceller.count()) {
        await sceller.first().click();
        await page.waitForTimeout(1200);
        continue;
      }
    }
    const choix = await page.evaluate(() =>
      [...document.querySelectorAll("button")]
        .map((b, i) => ({ i, t: (b.innerText || "").replace(/\s+/g, " ").trim(), aria: b.getAttribute("aria-label") || "" }))
        .filter((b) => b.t && !b.aria && !/choisisse pour moi|SCELLER/i.test(b.t)));
    if (choix.length) {
      await page.locator("button").nth(choix[0].i).click();
      await page.waitForTimeout(900);
    } else {
      await page.mouse.click(195, 560); // beat sans bouton : touche pour continuer
      await page.waitForTimeout(700);
    }
  }
  return false;
}

/** Choisit un bouton selon la stratégie ; jamais un verrouillé, jamais « Observer ». */
function choisir(bs) {
  const jouables = bs.filter((b) => !b.verrouille && !/^Observer les alentours$/i.test(b.label));
  if (!jouables.length) return bs.find((b) => !b.verrouille) ?? bs[0];
  const avecDe = jouables.filter((b) => /(COURAGE|RUSE|INSTINCT|EMPATHIE)/.test(b.label));
  switch (STRAT) {
    case "premier": return jouables[0];
    case "dernier": return jouables[jouables.length - 1];
    case "risque": return avecDe.length ? avecDe[0] : jouables[0];
    case "explore": {
      // les points d'intérêt sont les libellés SANS tag de stat, hors sortie
      const regards = jouables.filter((b) => !/(COURAGE|RUSE|INSTINCT|EMPATHIE)/.test(b.label));
      return regards.length ? regards[0] : jouables[0];
    }
    default: return jouables[Math.floor(Math.random() * jouables.length)];
  }
}

/** Lance le dé s'il est armé, et rend le verdict lu à l'écran. */
async function peutEtreLancerLeDe() {
  const ring = page.locator(".die-ring");
  if (!(await ring.count())) return null;
  const b = await ring.first().boundingBox();
  if (!b) return null;
  // ⚠️ le dé se saisit à ~60px de SON centre ; l'anneau est centré dessus.
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  // ⚠️ ON ATTEND QUE LE VERDICT SOIT RÉELLEMENT AFFICHÉ, jamais un délai fixe.
  // Le noeud `.die-verdict` garde son TEXTE quand la classe `show` retombe :
  // lire après 3,6 s enregistrait donc le mot du jet PRÉCÉDENT dès qu'un jet
  // mettait plus longtemps à se poser (un `highStakes` va jusqu'à ~9 s). C'est
  // ce qui a produit « RÉUSSITE ÉCLATANTE » suivi d'une prose d'échec dans le
  // rapport du 12/08 — 14 jets réels sur ce même choix donnent 0 désaccord.
  // Troisième fois que cette classe d'artefact fait accuser le moteur à tort.
  const verdict = await page
    .waitForFunction(() => {
      const v = document.querySelector(".die-verdict");
      return v && v.classList.contains("show")
        ? v.innerText.replace(/\s+/g, " ").trim()
        : null;
    }, null, { timeout: 15000 })
    .then((h) => h.jsonValue())
    .catch(() => "");
  // congédier l'écran de verdict
  await page.mouse.click(195, 400);
  await page.waitForTimeout(900);
  return verdict || null;
}

// Le Seuil ne se joue qu'en partie neuve ; sinon REPRENDRE tombe droit en jeu.
if (!(await page.locator(".choices-bar").count())) await jouerLeSeuil();

while (n < MAX) {
  // avancer la frappe / les micro-beats jusqu'aux choix
  let tours = 0;
  while (!(await pretAChoisir()) && tours < 14) {
    await attendreFinDeFrappe();
    const t = nettoie(await texteEcran());
    if (t && t !== dernierTexte) {
      n += 1;
      journal.push({ n, texte: t, boutons: [], action: "(touche pour continuer)" });
      dernierTexte = t;
    }
    // ⚠️ y≈560 : au-dessus on tombe DANS l'illustration (haute de ~352px)
    await page.mouse.click(195, 560);
    await page.waitForTimeout(520);
    tours += 1;
    if (await page.locator("button", { hasText: "REPRENDRE" }).count()) break;
  }

  // fin de vie : l'accueil est revenu
  const surAccueil = await page.evaluate(() =>
    Boolean([...document.querySelectorAll("button")].find((b) => /COMMENCER|REPRENDRE/.test(b.innerText))));
  if (surAccueil && n > 5) {
    journal.push({ n: ++n, texte: "— la vie s'achève, retour à l'accueil —", boutons: [], action: "" });
    break;
  }

  if (!(await pretAChoisir())) break;

  const t = nettoie(await texteEcran());
  const bs = await boutons();
  if (!bs.length) break;
  const pick = choisir(bs);
  n += 1;
  journal.push({
    n,
    texte: t !== dernierTexte ? t : "(même écran, choix suivant)",
    boutons: bs.map((b) => b.label + (b.verrouille ? "  [verrouillé]" : "")),
    action: pick.label,
  });
  dernierTexte = t;

  await page.locator(".choices-bar button.choice-btn").nth(pick.i).click();
  await page.waitForTimeout(900);
  const verdict = await peutEtreLancerLeDe();
  if (verdict) journal.push({ n: ++n, texte: `[ dé lancé → ${verdict} ]`, boutons: [], action: "" });
}

/* ─── l'état final, pour situer la vie ─── */
const etat = await page.evaluate(() => {
  const r = JSON.parse(localStorage.getItem("aldenhar-run") || "{}");
  const m = JSON.parse(localStorage.getItem("aldenhar-player") || "{}");
  return {
    jour: r.day, heros: r.heroName, soupcon: r.soupcon,
    lieux: (r.trav?.visited || []).length, morts: m.deaths, tombes: (m.fallen || []).length,
  };
});

const entete = [
  `# PACTUM — une vie enregistrée`,
  ``,
  `*Partie réellement jouée sur le build publié, écran par écran.*`,
  `*Stratégie du joueur automatique : **${STRAT}**${VIERGE ? " · compte VIERGE (première partie)" : " · compte de VÉTÉRAN (3 morts, 2 reliques, des lieux déjà traversés)"}.*`,
  ``,
  `- écrans enregistrés : **${journal.length}**`,
  `- fin de partie : jour ${etat.jour ?? "?"} · ${etat.lieux ?? 0} lieux traversés · soupçon ${etat.soupcon ?? 0}`,
  `- morts du compte à la fin : ${etat.morts ?? "?"}`,
  `- erreurs JavaScript : **${erreurs.length}** · requêtes en échec : **${echecsReseau.length}**`,
  ``,
  `> Ce transcript est la **référence sans dérive** : c'est le vrai moteur, les vrais`,
  `> textes, le vrai dé. La table de jeu Python du paquet est une réplique — quand`,
  `> les deux divergent, c'est le transcript qui dit vrai.`,
  ``,
  `---`,
  ``,
].join("\n");

const corps = journal.map((e) => {
  const l = [`### Écran ${e.n}`, ``, e.texte, ``];
  if (e.boutons.length) l.push(`**Choix proposés :**`, ...e.boutons.map((b) => `- ${b}`), ``);
  if (e.action) l.push(`→ *${e.action}*`, ``);
  return l.join("\n");
}).join("\n");

writeFileSync(SORTIE, entete + corps, "utf8");
console.log(`${SORTIE} — ${journal.length} écrans · jour ${etat.jour} · ${erreurs.length} erreur(s) JS · ${echecsReseau.length} requête(s) en échec`);
if (erreurs.length) console.log("  erreurs :", erreurs.slice(0, 3));
await br.close();
