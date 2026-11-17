// To run: npm install miniflare@4 (in a scratch folder), then node test/v7.test.mjs. Not run by the deploy.
// Les Joutes · the server, version 7: Line Towers records by terrain.
import { Miniflare } from 'miniflare';
import fs from 'node:fs';
const script = fs.readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
const mf = new Miniflare({ modules: true, script, d1Databases: ['DB'], compatibilityDate: '2026-08-01' });
let P = 0, F = 0;
const ck = (n, ok, x) => { if (ok) { P++; console.log('PASS', n); } else { F++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } };
let ipn = 10;
const call = async (path, b) => { const r = await mf.dispatchFetch('http://x' + path, { method: 'POST', headers: { Origin: 'https://lesjoutes.fr', 'Content-Type': 'text/plain;charset=UTF-8', 'CF-Connecting-IP': '9.9.9.' + (ipn++) }, body: JSON.stringify(b) }); let j = {}; try { j = await r.json(); } catch (e) {} return [r.status, j]; };
const K = 'abcdefghijklmnopqrstuvwxyz012345', K2 = 'zbcdefghijklmnopqrstuvwxyz012345';
const base = { n: 'Alice', h: 'cerf', c: 1, u: 'bois' };
const TER = ['nuit', 'riviere', 'champs', 'neige', 'automne', 'desert'];
let [st, r] = await call('/rec', { key: K, ...base, recs: TER.map((t, i) => ({ b: 'lt/' + t, s: 1000 + i, w: 5, t: 1 })) });
ck('six terrain boards accepted', st === 200 && r.ok, [st, r]);
const g = await (await mf.dispatchFetch('http://x/rec', { headers: { Origin: 'https://lesjoutes.fr' } })).json();
ck('GET /rec lists the six boards', TER.every((t, i) => g.boards['lt/' + t] && g.boards['lt/' + t].length === 1 && g.boards['lt/' + t][0][5] === 1000 + i), Object.keys(g.boards || {}));
[st, r] = await call('/rec', { key: K2, ...base, n: 'Bob', recs: [{ b: 'lt/nuit', s: 600000, w: 5, t: 1 }] });
ck('over the cap is refused', st >= 400 || !r.ok, [st, r]);
[st, r] = await call('/rec', { key: K2, ...base, n: 'Bob', recs: [{ b: 'lt/lune', s: 10, w: 1, t: 1 }] });
ck('an unknown terrain is refused', st >= 400 || !r.ok, [st, r]);
const many = [...TER.map(t => ({ b: 'lt/' + t, s: 50, w: 1, t: 1 })), ...['sablier', 'croix', 'lacets', 'etoile'].map(m => ({ b: 'gem/' + m, s: 50, w: 1, t: 1 })), ...['trefle', 'peigne', 'escargot', 'dunes'].map(m => ({ b: 'farm/' + m, s: 50, w: 1, t: 1 })), { b: 'lt/all', s: 50, w: 1, t: 1 }];
[st, r] = await call('/rec', { key: K2, ...base, n: 'Bob', recs: many });
ck('fifteen boards in one post (over the old 16 cap with the défis)', st === 200 && r.ok, [st, r]);
const root = await (await mf.dispatchFetch('http://x/', { headers: { Origin: 'https://lesjoutes.fr' } })).json();
ck('GET / says version 7', root.v === 7, root);
console.log(`${P} pass, ${F} fail`); await mf.dispose(); process.exit(F ? 1 : 0);
