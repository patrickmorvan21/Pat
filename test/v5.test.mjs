// To run: npm install miniflare@4 (in a scratch folder), then node test/v5.test.mjs. Not run by the deploy.
// Les Joutes · the server, version 5: the anonymous statistics.
import { Miniflare } from 'miniflare';
import fs from 'node:fs';
const SRC = new URL('../src/index.js', import.meta.url);
// in the test, the key of 'zzzz…' is the admin (the real admins' keys are secret)
const script = fs.readFileSync(SRC, 'utf8').replace(/const ADMINS = \[[^\]]*\];/, "const ADMINS = ['48290937040a6aa5'];");
const mf = new Miniflare({ modules: true, script, d1Databases: ['DB'], compatibilityDate: '2026-08-01' });
let P = 0, F = 0;
const ck = (n, ok, x) => { if (ok) { P++; console.log('PASS', n); } else { F++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } };
let ipn = 10;
const call = async (path, b, ip) => { const r = await mf.dispatchFetch('http://x' + path, { method: 'POST', headers: { Origin: 'https://lesjoutes.fr', 'Content-Type': 'text/plain;charset=UTF-8', 'CF-Connecting-IP': ip || ('9.9.9.' + (ipn++)) }, body: JSON.stringify(b) }); return [r.status, await r.json()]; };
const A = 'abcdefghijklmnopqrstuvwxyz012345', C = 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';
let [st, b] = await call('/stat', { sid: 'a1b2c3d4e5', p: 'web', ev: [{ k: 'open' }, { k: 'ping', n: 30 }, { k: 'ping', n: 30 }, { k: 'start', m: 'lt', a: 1, b: 3, w: 'solo' }, { k: 'end', m: 'lt', a: 1, w: 'win', n: 600 }] });
ck('events are taken (5)', st === 200 && b.ok && b.n === 5, [st, b]);
[st, b] = await call('/stat', { sid: 'z9y8x7w6v5', p: 'icone', ev: [{ k: 'open' }, { k: 'ping', n: 30 }, { k: 'table', m: 'gem' }, { k: 'start', m: 'gem', a: 3, b: 0, w: 'table' }, { k: 'join', w: 'code' }, { k: 'bad' }, { k: 'ping', n: 99999 }] });
ck('an unknown kind is dropped, a long ping is clamped (6 kept)', st === 200 && b.n === 6, [st, b]);
[st, b] = await call('/stat', { sid: 'x', ev: [{ k: 'open' }] }); ck('a bad sid is refused', st === 400 && b.why === 'sid', [st, b]);
[st, b] = await call('/stat', { sid: 'a1b2c3d4e5', ev: [] }); ck('no events: nothing stored', st === 200 && b.n === 0, [st, b]);
[st, b] = await call('/stats/resume', { key: A }); ck('a player is refused the summary', st === 403 && b.why === 'admin', [st, b]);
[st, b] = await call('/stats/resume', { key: 'bad' }); ck('a bad key is refused', st === 400, [st, b]);
[st, b] = await call('/stats/resume', { key: C, days: 7 });
ck('the admin reads the summary', st === 200 && b.ok && b.total.sessions === 2, [st, b]);
ck('… time: 60 s + 30 s + 120 s (clamped) = 210 s', b.total.secs === 210, b.total);
ck('… games: one solo with bots, one table of 3', b.byKind.find(r => r.w === 'solo').n === 1 && b.byKind.find(r => r.w === 'table').n === 1 && b.tableSizes[0].a === 3, [b.byKind, b.tableSizes]);
ck('… 2 launches played, 1 on a table, 1 social', b.total.played === 2 && b.total.withTable === 1 && b.total.social === 1, b.total);
ck('… the platforms, the modes, the end, the join', b.plat.length === 2 && b.byMode.length === 2 && b.ends[0].w === 'win' && b.joins[0].w === 'code', [b.plat, b.byMode, b.ends, b.joins]);
ck('… one day with 2 sessions; 5 buckets; 24 hours', b.perDay.length === 1 && b.perDay[0].sessions === 2 && b.buckets.length === 5 && b.hours.length === 24, [b.perDay, b.buckets.length, b.hours.length]);
ck('… nothing identifies a person (no sid in the answer)', !JSON.stringify(b).includes('a1b2c3d4e5'));
let last; for (let i = 0; i < 95; i++) { [st, last] = await call('/stat', { sid: 'rate1234567', ev: [{ k: 'ping', n: 5 }] }, '8.8.8.8'); }
ck('one address is slowed after 90 posts a minute', st === 429, [st, last]);
console.log('\n' + P + ' passed, ' + F + ' failed'); await mf.dispose(); process.exit(F ? 1 : 0);
