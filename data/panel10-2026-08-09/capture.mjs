// Pilote le VRAI jeu (navigateur) et capture des écrans PNG + le texte.
// Usage : node capture.mjs <dossierSortie> <nbEcrans> [strategie] [neuf|vieux]
//   strategie : premier | risque | observe | dernier
// Écrit : <dossierSortie>/NNN-<scene>.png  et  <dossierSortie>/journal.md
//
// Pièges déjà réglés dedans (ne pas les redécouvrir) :
//  • le dé se saisit par `.die-ring` (rayon de tolérance autour de SON centre) ;
//  • un choix VERROUILLÉ porte aria-disabled, pas disabled — le cliquer ne fait
//    rien et donne l'illusion d'un blocage ;
//  • pour finir la frappe d'un texte il faut cliquer la ZONE DE TEXTE (y≈545),
//    pas l'illustration (haute de ~352 px) ;
//  • ThreadingHTTPServer côté serveur, sinon le flux audio bloque la file.
import { chromium } from '/home/user/Pat/aldenhar/node_modules/playwright-core/index.mjs';
import fs from 'fs';

const [, , OUT = './captures', NMAX = '60', STRAT = 'premier', MEM = 'neuf'] = process.argv;
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:8970/Pat/aldenhar/';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await b.newPage({ viewport: { width: 390, height: 850 }, deviceScaleFactor: 2 });
const jserr = [], http = [];
pg.on('pageerror', e => jserr.push(String(e).slice(0, 200)));
pg.on('response', r => { if (r.status() >= 400) http.push(r.status() + ' ' + r.url().slice(-70)); });

await pg.addInitScript((mem) => {
  if (localStorage.getItem('__cap')) return;
  localStorage.clear();
  localStorage.setItem('__cap', '1');
  if (mem === 'vieux') {
    localStorage.setItem('aldenhar-player', JSON.stringify({
      introSeen: true, runsStarted: 5, deaths: 3, renoncements: 0,
      fallen: [{ name: 'Braise', days: 6, cause: 'la corde', place: 'colline-aux-gibets' },
               { name: 'Suie', days: 3, cause: 'la Bête', place: 'chemin-creux' }],
      relics: [{ name: 'La corde sèche', rarity: 'rare', relicId: 'corde_seche' }],
      lastDeath: { day: 6, lieu: 'colline-aux-gibets', rarity: 'rare', classed: true, acte: 1 },
      envFlags: ['echarde-gibet-prelevee'],
      visitesLieux: { 'colline-aux-gibets': 2, 'champ-des-fixes': 2, 'marche-muet': 2, 'chemin-creux': 2 },
      faits: {}, surprises: {}, fixations: 0, zonesCleared: 0, totalDays: 9, bestDays: 6,
    }));
  }
}, MEM);

await pg.goto(BASE, { waitUntil: 'domcontentloaded' });
await pg.waitForTimeout(1400);

const journal = [];
let n = 0;
const shot = async (tag) => {
  const f = `${OUT}/${String(n).padStart(3, '0')}-${tag}.png`;
  await pg.screenshot({ path: f });
  return f.split('/').pop();
};
const lire = () => pg.evaluate(() => {
  const run = JSON.parse(localStorage.getItem('aldenhar-run') || 'null');
  const btns = [...document.querySelectorAll('.phone-frame button')]
    .filter(x => x.offsetParent !== null && !x.getAttribute('aria-label'))
    .map(x => ({ t: (x.innerText || '').replace(/\s+/g, ' ').trim(),
                 off: x.getAttribute('aria-disabled') === 'true' }));
  return {
    scene: run?.trav?.current ?? null, jour: run?.day ?? null,
    sante: run?.health ?? null, soupcon: run?.soupcon ?? null,
    texte: (document.querySelector('.phone-frame')?.innerText || '').replace(/[ \t]+/g, ' ').trim(),
    images: [...new Set([...document.querySelectorAll('img')]
      .map(i => (i.getAttribute('src') || '').split('?')[0]).filter(s => s.includes('assets/')))],
    boutons: btns,
    de: (() => { const r = document.querySelector('.die-ring');
      return !!r && r.offsetParent !== null && getComputedStyle(r).display !== 'none'; })(),
    frappe: !!document.querySelector('.type-cursor'),
    input: !!document.querySelector('.phone-frame input'),
    choixVisibles: (() => { const c = document.querySelector('.choices-bar');
      return !!c && getComputedStyle(c).display !== 'none'; })(),
  };
});

const lancerDe = async () => {
  const box = await pg.locator('.die-ring').boundingBox().catch(() => null);
  if (!box) return null;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await pg.mouse.move(cx, cy); await pg.mouse.down();
  for (let k = 1; k <= 6; k++) {
    await pg.mouse.move(cx + (Math.random() - .5) * 30, cy - k * 32, { steps: 1 });
    await pg.waitForTimeout(16);
  }
  await pg.mouse.up();
  await pg.waitForSelector('.die-verdict', { timeout: 12000 }).catch(() => {});
  const v = await pg.evaluate(() => document.querySelector('.die-verdict')?.innerText?.replace(/\s+/g, ' ').trim() ?? null);
  await shot('verdict');
  await pg.waitForTimeout(700);
  await pg.mouse.click(195, 545);
  return v;
};

let vuPrec = '';
for (n = 0; n < Number(NMAX); n++) {
  const e = await lire();
  let action = null, verdict = null, img = null;
  const clef = e.texte.slice(0, 100);
  if (clef !== vuPrec) { img = await shot((e.scene || 'ecran').replace(/[^a-z0-9-]/gi, '')); vuPrec = clef; }

  if (e.boutons.some(x => /^(COMMENCER|REPRENDRE)/.test(x.t))) {
    await pg.evaluate(() => [...document.querySelectorAll('button')]
      .find(x => /^(COMMENCER|REPRENDRE)/.test(x.innerText))?.click());
    action = 'accueil';
  } else if (e.input) {
    await pg.locator('.phone-frame button', { hasText: 'choisisse pour moi' }).first().click().catch(() => {});
    await pg.waitForTimeout(300);
    await pg.locator('.phone-frame button', { hasText: 'SCELLER' }).first().click().catch(() => {});
    action = 'sceller';
  } else if (e.de) {
    verdict = await lancerDe(); action = 'lance le dé';
  } else if (e.frappe || !e.choixVisibles) {
    await pg.mouse.click(195, 545); action = 'continue';
  } else {
    const ouverts = e.boutons.filter(x => !x.off);
    let c = null;
    if (STRAT === 'risque') c = ouverts.find(x => /COURAGE|RUSE|INSTINCT|EMPATHIE/.test(x.t)) || ouverts[0];
    else if (STRAT === 'observe') c = ouverts.find(x => /Observer|Examiner|Regarder|Compter|Lire/i.test(x.t)) || ouverts[0];
    else if (STRAT === 'dernier') c = ouverts[ouverts.length - 1];
    else c = ouverts[0];
    if (c) {
      await pg.evaluate((lab) => {
        const norm = s => s.replace(/\s+/g, ' ').trim();
        [...document.querySelectorAll('.phone-frame button')]
          .filter(x => x.offsetParent !== null && x.getAttribute('aria-disabled') !== 'true')
          .find(x => norm(x.innerText) === lab)?.click();
      }, c.t);
      action = 'choix: ' + c.t;
    } else { await pg.mouse.click(195, 545); action = 'continue'; }
  }
  journal.push({ n, ...e, action, verdict, capture: img });
  await pg.waitForTimeout(520);
}

const md = [`# Captures — ${OUT} (${STRAT}, compte ${MEM})`, ''];
for (const e of journal) {
  md.push(`## [${e.n}] ${e.scene ?? '—'}${e.jour ? ` · Jour ${e.jour}` : ''}${e.sante != null ? ` · santé ${e.sante}` : ''}${e.soupcon ? ` · soupçon ${e.soupcon}` : ''}`);
  if (e.capture) md.push(`*capture : ${e.capture}*`);
  if (e.images.length) md.push(`*images : ${e.images.map(x => x.split('/').pop()).join(', ')}*`);
  md.push('', e.texte, '');
  if (e.boutons.length) md.push(`CHOIX : ${e.boutons.map(x => `[${x.t}${x.off ? ' —VERROUILLÉ' : ''}]`).join(' ')}`);
  if (e.verdict) md.push(`DÉ → ${e.verdict}`);
  md.push(`→ ${e.action}`, '');
}
md.push(`\nErreurs JS : ${jserr.length} ${jserr.slice(0, 3).join(' | ')}`);
md.push(`HTTP≥400 : ${http.length} ${http.slice(0, 5).join(' | ')}`);
fs.writeFileSync(`${OUT}/journal.md`, md.join('\n'));
console.log(`${journal.length} écrans · ${fs.readdirSync(OUT).filter(f => f.endsWith('.png')).length} captures · JS:${jserr.length} · HTTP:${http.length}`);
await b.close();
