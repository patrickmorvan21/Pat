// To run: npm install miniflare@4 (in a scratch folder), then node test/v4.test.mjs. Not run by the deploy.
// Les Joutes · the server, version 4: the profile, the links between devices, the VIPs.
import { Miniflare } from 'miniflare';
import fs from 'node:fs';
const SRC = new URL('../src/index.js', import.meta.url);
const mf = new Miniflare({ modules: true, script: fs.readFileSync(SRC, 'utf8'), d1Databases: ['DB'], compatibilityDate: '2026-08-01' });
let P = 0, F = 0;
const ck = (n, ok, x) => { if (ok) { P++; console.log('PASS', n); } else { F++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } };
const O = 'https://lesjoutes.fr';
let ipn = 10;
const call = async (path, b, ip) => { const r = await mf.dispatchFetch('http://x' + path, { method: 'POST', headers: { Origin: O, 'Content-Type': 'text/plain;charset=UTF-8', 'CF-Connecting-IP': ip || ('10.0.0.' + (ipn++ % 250)) }, body: typeof b === 'string' ? b : JSON.stringify(b) }); return [r.status, await r.json()]; };
// two of Patrick's keys whose public numbers are in ADMINS? No: ADMINS are his real numbers; the tests use other keys, and the admin check is shown refused
const A = 'abcdefghijklmnopqrstuvwxyz012345', B = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ678901', C = 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';
let [st, b] = await call('/profil', { key: A });
ck('a new player: no profile yet, not VIP, not admin', st === 200 && b.ok && b.data === null && b.t === 0 && b.vip === false && b.admin === false, [st, b]);
const data = { 'ddl-nick': 'Pico13', 'ddl-meta': JSON.stringify({ games: 12 }), 'jt-maison': 'griffon', 'farmtd-best': '18318', 'gemtd-tips': '1' };
[st, b] = await call('/profil/save', { key: A, t: 1000, data });
ck('the profile is saved', st === 200 && b.ok && b.t === 1000 && !b.stale, [st, b]);
[st, b] = await call('/profil', { key: A });
ck('… and read back, as it was', st === 200 && b.t === 1000 && JSON.stringify(b.data) === JSON.stringify(data), [st, b]);
[st, b] = await call('/profil/save', { key: A, t: 900, data: { 'ddl-nick': 'Vieux' } });
ck('an older save does not replace it (stale, with the time kept here)', st === 200 && b.ok && b.stale === true && b.t === 1000, [st, b]);
[, b] = await call('/profil', { key: A }); ck('… the profile is unchanged', b.data['ddl-nick'] === 'Pico13', b);
[st, b] = await call('/profil/save', { key: A, t: 2000, data: Object.assign({}, data, { 'ddl-nick': 'Pico' }) });
[, b] = await call('/profil', { key: A }); ck('a newer save replaces it', b.t === 2000 && b.data['ddl-nick'] === 'Pico', b);
[, b] = await call('/profil', { key: B }); ck('another key, another profile', b.data === null, b);
const bads = [
  [{ key: 'short', t: 5, data }, 'key', 'a bad key'], [{ key: A, t: 0, data }, 't', 'no time'], [{ key: A, t: Date.now() + 3 * 86400000, data }, 't', 'a time far ahead'],
  [{ key: A, t: 5, data: [1] }, 'data', 'a list'], [{ key: A, t: 5, data: { 'ddl-rk-test': '1' } }, 'data', 'a test key'], [{ key: A, t: 5, data: { 'autre': '1' } }, 'data', 'a key of another page'],
  [{ key: A, t: 5, data: { 'ddl-nick': 5 } }, 'data', 'a value that is not text'], [{ key: A, t: 5, data: { 'ddl-big': 'x'.repeat(200001) } }, 'big', 'too big'],
];
for (const [x, why, n] of bads) { const [s2, b2] = await call('/profil/save', x); ck('refused: ' + n, s2 >= 400 && b2.why === why, [s2, b2]); }
// the links
[st, b] = await call('/lier/code', { key: A });
ck('a link code: 6 signs, for 10 minutes', st === 200 && /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(b.code) && b.exp > Date.now() + 9 * 60000 && b.exp <= Date.now() + 10 * 60000 + 1000, [st, b]);
const code1 = b.code;
[st, b] = await call('/lier/code', { key: A }); const code2 = b.code;
[st, b] = await call('/lier/prendre', { code: code1 });
ck('a new code replaces the old one (the old one no longer works)', st === 404 && b.why === 'inconnu', [st, b]);
[st, b] = await call('/lier/prendre', { code: code2.slice(0, 3) + ' ' + code2.slice(3).toLowerCase() });
ck('the other device takes the key with the code (spaces and small letters accepted)', st === 200 && b.ok && b.key === A, [st, b]);
[st, b] = await call('/lier/prendre', { code: code2 });
ck('… only once', st === 404 && b.why === 'inconnu', [st, b]);
[st, b] = await call('/lier/prendre', { code: 'O0I1AB' }); ck('a code with signs that do not exist is refused', st === 400 && b.why === 'code', [st, b]);
// the VIPs
[st, b] = await call('/vip', { key: B, code: 'JOUTE' }); ck('no VIP code chosen yet: closed', st === 404 && b.why === 'ferme', [st, b]);
[st, b] = await call('/vip/regler', { key: B, code: 'JOUTE' }); ck('a player who is not Patrick cannot choose the code', st === 403 && b.why === 'admin', [st, b]);
// the admin: the test puts a key's number in ADMINS by a second Worker with the same code
const src2 = fs.readFileSync(SRC, 'utf8').replace("const ADMINS = ['", "const ADMINS = [PID_C, '").replace('const LINK_MS', "const PID_C = '" + (await (async () => { const c = await import('node:crypto'); return c.createHash('sha256').update('lj|' + C).digest('hex').slice(0, 16); })()) + "';\nconst LINK_MS");
const mf2 = new Miniflare({ modules: true, script: src2, d1Databases: ['DB'], compatibilityDate: '2026-08-01' });
const call2 = async (path, x) => { const r = await mf2.dispatchFetch('http://x' + path, { method: 'POST', headers: { Origin: O, 'CF-Connecting-IP': '10.9.' + (ipn++ % 250) + '.1' }, body: JSON.stringify(x) }); return [r.status, await r.json()]; };
[st, b] = await call2('/profil', { key: C }); ck('Patrick (an admin): VIP and admin', b.vip === true && b.admin === true, b);
[st, b] = await call2('/vip/regler', { key: C, code: 'joute-2026' }); ck('Patrick chooses the code', st === 200 && b.ok, [st, b]);
[st, b] = await call2('/vip', { key: A, code: 'MAUVAIS' }); ck('a wrong code is refused', st === 403 && b.why === 'faux', [st, b]);
[, b] = await call2('/profil', { key: A }); ck('… and the player is not VIP', b.vip === false, b);
[st, b] = await call2('/vip', { key: A, code: 'Joute 2026' }); ck('the right code (spaces, small letters) opens it', st === 200 && b.vip === true, [st, b]);
[, b] = await call2('/profil', { key: A }); ck('… VIP for good', b.vip === true && b.admin === false, b);
[st, b] = await call2('/vip/regler', { key: C, code: 'NOUVEAU1' });
[, b] = await call2('/profil', { key: A }); ck('Patrick changes the code: the old VIPs are closed', b.vip === false, b);
[st, b] = await call2('/vip', { key: A, code: 'NOUVEAU1' }); [, b] = await call2('/profil', { key: A }); ck('… until they type the new one', b.vip === true, b);
[st, b] = await call2('/vip', { key: A, code: 'AB' }); ck('a code too short is refused', st === 403 || st === 400, [st, b]);
// the path, the method
[st, b] = await call('/profil', '[1]'); ck('a list instead of an object: refused', st === 400 && b.why === 'json', [st, b]);
const r = await mf.dispatchFetch('http://x/profil', { headers: { Origin: O } }); ck('GET /profil: refused (POST only)', r.status === 405, r.status);
const r2 = await mf.dispatchFetch('http://x/', { headers: { Origin: O } }); const j2 = await r2.json(); ck('GET / says version 4', j2.v === 4, j2);
console.log(`\n${P} passed, ${F} failed`);
await mf.dispose(); await mf2.dispose();
process.exit(F ? 1 : 0);
