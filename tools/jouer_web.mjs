/**
 * JOUER AU VRAI JEU, une commande à la fois.
 *
 * Pourquoi cet outil existe : la réplique hors navigateur (`tools/pactum.py`)
 * porte le contenu et les mécaniques, mais pas l'écran — ni les images, ni le
 * geste du dé, ni le rythme réel. Or les deux panels de testeurs précédents
 * ont perdu la moitié de leur valeur à juger la réplique en croyant juger le
 * jeu. Ici, c'est le VRAI build qui tourne : le même bundle que le joueur.
 *
 * Le problème à résoudre était la persistance : un testeur qui décide écran
 * par écran ne peut pas garder un navigateur ouvert entre deux commandes.
 * Solution : tout l'état du jeu vit dans `localStorage`, donc on le sauve dans
 * un fichier entre chaque appel et on le restaure au suivant. Une commande =
 * un lancement de navigateur, ~4 s, et l'illusion d'une session continue.
 *
 * USAGE (depuis un dossier de travail à soi) :
 *   node jouer_web.mjs neuf            — efface tout et repart d'une vie neuve
 *   node jouer_web.mjs regarde         — réaffiche l'écran courant
 *   node jouer_web.mjs 2               — prend le 2e choix offert
 *   node jouer_web.mjs continuer       — tape l'écran (pour avancer un texte)
 *   node jouer_web.mjs de              — lance le dé quand il est armé
 *   node jouer_web.mjs photo <nom>     — capture l'écran en PNG
 *   node jouer_web.mjs coulisses       — l'état caché (santé, soupçon…)
 *
 * Options d'environnement :
 *   PACTUM_URL   racine du build servi (défaut http://127.0.0.1:8990/Pat/aldenhar/)
 *   PACTUM_ETAT  fichier d'état (défaut ./etat.json dans le dossier courant)
 */

import { chromium } from "/home/user/Pat/aldenhar/node_modules/playwright-core/index.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const URL_BASE = process.env.PACTUM_URL ?? "http://127.0.0.1:8990/Pat/aldenhar/";
const FICHIER = resolve(process.env.PACTUM_ETAT ?? "etat.json");
const CLES = ["aldenhar-run", "aldenhar-player", "aldenhar-settings", "aldenhar-aide-de", "aldenhar-aide-menu", "pactum-de-geste", "pactum-music-last-intro", "pactum-music-last-landes"];

// Plusieurs commandes en un seul appel : c'est ce qui rend l'outil tenable.
// Lancer un navigateur coûte ~10 s ; enchaîner « 1 continuer 2 de » dans la
// MÊME session ramène ce coût à une fois pour quatre écrans, sans rien retirer
// au testeur — il voit toujours chaque écran, dans l'ordre, avant le suivant.
const CMDS = process.argv.slice(2).map((x) => x.toLowerCase());
if (!CMDS.length) CMDS.push("regarde");
const cmd = CMDS[0];

function etatSauve() {
  if (CMDS.includes("neuf") || !existsSync(FICHIER)) return {};
  try {
    return JSON.parse(readFileSync(FICHIER, "utf8"));
  } catch {
    return {};
  }
}

const navigateur = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await navigateur.newPage({ viewport: { width: 390, height: 850 } });
const erreurs = [];
page.on("pageerror", (e) => erreurs.push(String(e).slice(0, 160)));
page.on("requestfailed", (r) => {
  if (!/google|fonts|\.mp3/.test(r.url())) erreurs.push("réseau: " + r.url().split("/").pop());
});

const sauve = etatSauve();
await page.addInitScript((s) => {
  localStorage.clear();
  for (const [k, v] of Object.entries(s)) if (v != null) localStorage.setItem(k, v);
  // Le geste du dé demande une vraie vélocité : le mode testeur accepte un tap.
  // Rien d'autre ne change — le tirage reste la physique réelle du jeu.
}, sauve);

await page.goto(URL_BASE + "?testeur=1", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1400);

/** Les boutons réellement offerts (hors icône de menu). */
const lireBoutons = () =>
  page.evaluate(() =>
    [...document.querySelectorAll(".phone-frame button")]
      .filter((x) => x.offsetParent !== null && !x.getAttribute("aria-label"))
      .map((x) => ({
        texte: (x.innerText || "").replace(/\s+/g, " ").trim(),
        ferme: x.getAttribute("aria-disabled") === "true",
      }))
  );

const lireEcran = () =>
  page.evaluate(() => {
    const cadre = document.querySelector(".phone-frame");
    const img = document.querySelector(".illustration-frame img, img.image-swap");
    // Le texte du cadre inclut les libellés des boutons : on les retire, ils
    // sont listés à part (sinon le testeur lit chaque choix deux fois).
    const barre = document.querySelector(".choices-bar");
    let brut = cadre?.innerText || "";
    if (barre) for (const l of (barre.innerText || "").split("\n")) {
      const t = l.trim();
      if (t.length > 2) brut = brut.split(t).join("");
    }
    return {
      texte: brut.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(),
      image: img ? (img.getAttribute("src") || "").split("/").pop().split("?")[0] : null,
      choixPrets: (() => {
        const c = document.querySelector(".choices-bar");
        return !!c && getComputedStyle(c).display !== "none" && !document.querySelector(".type-cursor");
      })(),
      deArme: !!document.querySelector(".die-ring:not(.hidden)"),
      verdict: document.querySelector(".die-verdict")?.innerText?.replace(/\s+/g, " ").trim() ?? null,
    };
  });

/** Sur l'accueil : reprendre la partie en cours, sinon en commencer une. */
async function entrerDansLeJeu() {
  for (let i = 0; i < 3; i++) {
    const bs = await lireBoutons();
    const rep = bs.find((b) => /^REPRENDRE/.test(b.texte));
    const dep = bs.find((b) => /^COMMENCER/.test(b.texte));
    const cible = rep ?? dep;
    if (!cible) return;
    await cliquer(cible.texte);
    await page.waitForTimeout(1200);
    // Intro (4 clauses) et Seuil : on tape pour traverser ce qui n'attend
    // qu'un toucher, mais on S'ARRÊTE dès qu'un vrai choix est offert.
    for (let k = 0; k < 30; k++) {
      const e = await lireEcran();
      const bs2 = await lireBoutons();
      if (e.deArme) return;
      if (bs2.length && e.choixPrets) return;
      await page.mouse.click(195, 700);
      await page.waitForTimeout(500);
    }
    return;
  }
}

const cliquer = (libelle) =>
  page.evaluate((l) => {
    const n = (s) => (s || "").replace(/\s+/g, " ").trim();
    const b = [...document.querySelectorAll(".phone-frame button")].find(
      (x) => x.offsetParent !== null && n(x.innerText) === l
    );
    b?.click();
    return !!b;
  }, libelle);

/** Attend que l'écran se stabilise (frappe finie, choix offerts). */
async function stabiliser(maxTaps = 0) {
  for (let i = 0; i < 26; i++) {
    const e = await lireEcran();
    if (e.deArme || e.verdict) return e;
    if (e.choixPrets && (await lireBoutons()).length) return e;
    if (maxTaps-- > 0) {
      await page.mouse.click(195, 700);
      await page.waitForTimeout(420);
    } else {
      await page.waitForTimeout(420);
    }
  }
  return lireEcran();
}

await entrerDansLeJeu();

// ── exécution : une commande, un écran, dans l'ordre ──────────────────────
async function montrer(ecran) {
  console.log("─".repeat(64));
  if (ecran.image) console.log("[image : " + ecran.image + "]");
  console.log(ecran.texte);
  const bs = await lireBoutons();
  if (ecran.deArme) {
    console.log("\n>>> le dé est armé — commande : de");
  } else if (bs.length) {
    console.log("");
    bs.forEach((b, i) => console.log(`  ${i + 1}. ${b.texte}${b.ferme ? "   (fermé)" : ""}`));
  } else {
    console.log("\n>>> rien à choisir — commande : continuer");
  }
  console.log("─".repeat(64));
}

for (const c of CMDS) {
  if (c === "neuf" || c === "regarde") {
    await montrer(await stabiliser(0));
    continue;
  }
  if (c === "continuer") {
    await page.mouse.click(195, 700);
    await page.waitForTimeout(700);
    await montrer(await stabiliser(0));
    continue;
  }
  if (/^\d+$/.test(c)) {
    const bs = await lireBoutons();
    const cible = bs[Number(c) - 1];
    if (!cible) {
      console.log(`(pas de choix n°${c} — il y en a ${bs.length})`);
      continue;
    }
    console.log("\n› " + cible.texte);
    await cliquer(cible.texte);
    await page.waitForTimeout(cible.ferme ? 700 : 1100);
    await montrer(await stabiliser(0));
    continue;
  }
  if (c === "de") {
    const boite = await page.locator(".die-ring").boundingBox().catch(() => null);
    if (!boite) {
      console.log("(le dé n'est pas armé)");
      continue;
    }
    const cx = boite.x + boite.width / 2,
      cy = boite.y + boite.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let k = 1; k <= 6; k++) {
      await page.mouse.move(cx + (Math.random() - 0.5) * 30, cy - k * 32);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await page.waitForSelector(".die-verdict", { timeout: 14000 }).catch(() => {});
    await page.waitForTimeout(900);
    const v = await page.evaluate(
      () => document.querySelector(".die-verdict")?.innerText?.replace(/\s+/g, " ").trim() ?? ""
    );
    console.log("\nVERDICT : " + v);
    await page.mouse.click(195, 700);
    await page.waitForTimeout(1000);
    await montrer(await stabiliser(0));
    continue;
  }
  if (c.startsWith("photo")) {
    const nom = (c.split(":")[1] || "ecran") + ".png";
    await page.screenshot({ path: nom });
    console.log("capture écrite : " + nom);
    continue;
  }
  if (c === "coulisses") {
    const info = await page.evaluate(() => {
      const r = JSON.parse(localStorage.getItem("aldenhar-run") || "{}");
      const m = JSON.parse(localStorage.getItem("aldenhar-player") || "{}");
      return {
        heros: r.heroName, jour: r.day, sante: r.health, soupcon: r.soupcon,
        scene: r.trav?.current, phase: r.trav?.phase,
        lieuxVisites: r.trav?.visited?.length, cible: r.trav?.target,
        stats: r.stats, besace: (r.besace || []).map((i) => i.name),
        etats: Object.keys(r.faits || {}), des: (r.rolls || []).length,
        mortsDuCompte: m.deaths, viesLancees: m.runsStarted,
        reliques: (m.relics || []).length,
      };
    });
    console.log(JSON.stringify(info, null, 1));
    continue;
  }
  console.log("(commande inconnue : " + c + ")");
}

if (erreurs.length) console.log("⚠️ ERREURS : " + [...new Set(erreurs)].join(" | "));

// sauvegarde de l'état pour la commande suivante
const dump = await page.evaluate((cles) => {
  const o = {};
  for (const k of cles) o[k] = localStorage.getItem(k);
  return o;
}, CLES);
writeFileSync(FICHIER, JSON.stringify(dump), "utf8");
await navigateur.close();
