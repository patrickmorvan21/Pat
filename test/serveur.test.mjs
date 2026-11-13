// To run: npm install miniflare@4 (in a scratch folder), then node test/serveur.test.mjs. Not run by the deploy.
// Les Joutes · the server, version 3 (../cf2/src/index.js: the records, and the friends), in Miniflare with a D1 database: its rules before it goes on Patrick's account.
import { Miniflare } from 'miniflare';
import fs from 'node:fs';
import crypto from 'node:crypto';
const SRC = new URL('../src/index.js', import.meta.url);
const mf = new Miniflare({ modules: true, script: fs.readFileSync(SRC, 'utf8'), d1Databases: ['DB'], compatibilityDate: '2026-08-01' });
let P = 0, F = 0;
const ck = (n, ok, x) => { if (ok) { P++; console.log('PASS', n); } else { F++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } };
const O = 'https://patrickmorvan21.github.io';
const day = (k = 0) => { const p = {}; for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(Date.now() + k * 86400000))) p[x.type] = x.value; return `${p.year}-${p.month}-${p.day}`; };
const TODAY = day(0), YDAY = day(-1), TOMORROW = day(1), OLD = day(-3);
const get = async (path = '/rec', origin = O) => { const r = await mf.dispatchFetch('http://x' + path, { headers: { Origin: origin } }); return [r.status, await r.json(), r.headers.get('access-control-allow-origin')]; };
const post = async (b, ip = '1.1.1.1', ct = 'application/json') => { const r = await mf.dispatchFetch('http://x/rec', { method: 'POST', headers: { Origin: O, 'Content-Type': ct, 'CF-Connecting-IP': ip }, body: typeof b === 'string' ? b : JSON.stringify(b) }); return [r.status, await r.json()]; };
const K1 = 'abcdefghijklmnopqrstuvwxyz012345', K2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ678901';
const pidOf = k => crypto.createHash('sha256').update('lj|' + k).digest('hex').slice(0, 16);
const me = (recs, more = {}) => Object.assign({ key: K1, n: 'Patrick', h: 'cerf', c: 1, u: 'bois', recs }, more);

let [st, body, ao] = await get('/');
ck('GET / says who it is', st === 200 && body.ok && body.nom === 'les-joutes' && body.v === 5, body);
[st, body, ao] = await get();
ck('an empty server: the 9 boards of the game and the défis of today and yesterday, empty; the game\'s address allowed',
  st === 200 && Object.keys(body.boards).length === 11 && body.boards['gem/croix'].length === 0 && body.boards['defi/' + TODAY] && body.boards['defi/' + YDAY] && body.jour === TODAY && ao === O, [st, Object.keys(body.boards), body.jour, ao]);
[st, body] = await post(me([{ b: 'gem/croix', s: 8710, w: 14, t: 1000 }, { b: 'lt/all', s: 4200, w: 18, t: 900 }, { b: 'farm/dunes', s: 120000, w: 31, t: 800 }]));
ck('a first post with three records is kept, and gives the player\'s public number (from his key)', st === 200 && body.ok && body.pid === pidOf(K1) && /^[0-9a-f]{16}$/.test(body.pid), [st, body]);
[, body] = await get();
ck('… and shown: [pid, name, House, colour, outfit, score, wave, date]', JSON.stringify(body.boards['gem/croix'][0]) === JSON.stringify([pidOf(K1), 'Patrick', 'cerf', 1, 'bois', 8710, 14, 1000]) && body.boards['lt/all'][0][5] === 4200 && body.boards['farm/dunes'][0][5] === 120000, [body.boards['gem/croix'], body.boards['lt/all']]);
[st] = await post(me([{ b: 'gem/croix', s: 500, w: 3, t: 2000 }], { n: 'Patou', h: 'ours', c: 2, u: 'lg_ours_orage' }));
[, body] = await get(); const r1 = body.boards['gem/croix'][0];
ck('a lower score: the best stays (score, wave, date); the new name, House, colour and outfit follow', st === 200 && r1[1] === 'Patou' && r1[2] === 'ours' && r1[3] === 2 && r1[4] === 'lg_ours_orage' && r1[5] === 8710 && r1[6] === 14 && r1[7] === 1000, r1);
await post(me([{ b: 'gem/croix', s: 9900, w: 16, t: 3000 }]));
[, body] = await get(); const r2 = body.boards['gem/croix'][0];
ck('a better score replaces it, with its wave and date (and the cache of the server does not hide it)', r2[5] === 9900 && r2[6] === 16 && r2[7] === 3000 && r2[1] === 'Patrick', r2);
// the défis
[st, body] = await post(me([{ b: 'defi/' + TODAY, s: 3000, w: 10, t: 4000, h: 'griffon', u: 'or' }, { b: 'defi/' + YDAY, s: 2000, w: 9, t: 3500, h: 'renard' }]));
[, body] = await get();
ck('the défis of today and yesterday, each with its imposed House', st === 200 && body.boards['defi/' + TODAY][0][2] === 'griffon' && body.boards['defi/' + TODAY][0][4] === 'or' && body.boards['defi/' + YDAY][0][2] === 'renard' && body.boards['defi/' + YDAY][0][4] === 'bois', [body.boards['defi/' + TODAY], body.boards['defi/' + YDAY]]);
[st, body] = await post(me([{ b: 'defi/' + TOMORROW, s: 10 }]));
ck('tomorrow\'s défi (a clock a little ahead at midnight) is accepted', st === 200 && body.ok, [st, body]);
[st, body] = await post(me([{ b: 'defi/' + OLD, s: 10 }]));
ck('a défi of three days ago is refused', st === 400 && body.why === 'board', [st, body]);
// what is refused
const bads = [
  [me([{ b: 'gem/croix', s: 0 }]), 'score', 'a score of 0'], [me([{ b: 'gem/croix', s: -5 }]), 'score', 'a negative score'],
  [me([{ b: 'gem/croix', s: 20000001 }]), 'score', 'a score above the cap of Gem TD'], [me([{ b: 'lt/all', s: 500001 }]), 'score', 'a score above the cap of Line Towers'],
  [me([{ b: 'gem/lune', s: 5 }]), 'board', 'an unknown board'], [me([{ b: 'defi/hier', s: 5 }]), 'board', 'a défi without a date'],
  [me([{ b: 'gem/croix', s: 5 }], { key: 'short' }), 'key', 'a bad key'], [me([{ b: 'gem/croix', s: 5 }], { key: K1 + 'x' }), 'key', 'a key too long'],
  [me([]), 'recs', 'no record'], [me([{ b: 'gem/croix', s: 5 }, { b: 'gem/croix', s: 6 }]), 'recs', 'the same board twice'],
  [me(Array.from({ length: 17 }, (_, i) => ({ b: 'gem/croix', s: i + 1 }))), 'recs', 'more than 16 records'],
  ['not json', 'json', 'a body that is not JSON'], ['[1,2]', 'json', 'a list instead of an object'],
];
for (const [bad, why, name] of bads) { const [s2, b2] = await post(bad); ck(`refused: ${name}`, s2 === 400 && b2.why === why, [s2, b2]); }
[st, body] = await post({ key: K2, n: '\u0007<b>Évil</b> plus long​', h: 'dragon', c: 99, u: 'DIAMANT!', recs: [{ b: 'lt/all', s: 120, w: 5000, t: 1 }] });
[, body] = await get(); const r3 = body.boards['lt/all'].find(r => r[0] === pidOf(K2));
ck('an odd post is cleaned: 10 letters, a House, a colour, an outfit, a wave that exist', st === 200 && r3 && r3[1] === '<b>Évil</b' && r3[2] === 'cerf' && r3[3] === 7 && r3[4] === 'bois' && r3[6] === 999, r3);
[st, body] = await post({ key: K2, n: 'Zoé', h: 'renard', c: 5, u: 'or', recs: [{ b: 'gem/croix', s: 9900, w: 16, t: 2500 }] }, '2.2.2.2', 'text/plain;charset=UTF-8');
[, body] = await get();
ck('a post sent as plain text (no question first from the browser) is read too', st === 200, st);
ck('the order: the best score first, the earliest among equals; another key is another player', body.boards['gem/croix'].map(r => r[1]).join(',') === 'Zoé,Patrick' && body.boards['gem/croix'][0][0] === pidOf(K2), body.boards['gem/croix'].map(r => [r[1], r[5], r[7]]));
// at most 90 posts a minute from one address (40 until version 4)
let last = 0; for (let i = 0; i < 91; i++) [last] = await post(me([{ b: 'gem/sablier', s: 100 + i }]), '9.9.9.9');
ck('the 91st post in a minute from one address is refused', last === 429, last);
[st] = await post(me([{ b: 'gem/sablier', s: 100 }]), '8.8.8.8');
ck('… another address still can', st === 200, st);
const pre = await mf.dispatchFetch('http://x/rec', { method: 'OPTIONS', headers: { Origin: 'capacitor://localhost', 'Access-Control-Request-Method': 'POST' } });
ck('the iPhone app\'s address (capacitor://localhost) is allowed, the question before a post answered', pre.status === 204 && pre.headers.get('access-control-allow-methods').includes('POST') && pre.headers.get('access-control-allow-origin') === 'capacitor://localhost');
[, , ao] = await get('/rec', 'https://evil.example');
ck('another site is not allowed to read it from a page (it is told the game\'s own address, lesjoutes.fr)', ao === 'https://lesjoutes.fr', ao);
// version 102 (11/11/2026): the game's address is lesjoutes.fr; the old one still allowed
[, , ao] = await get('/rec', 'https://lesjoutes.fr');
ck('lesjoutes.fr (the game\'s address since version 102) is allowed to read it from a page', ao === 'https://lesjoutes.fr', ao);
[, , ao] = await get('/rec', 'https://www.lesjoutes.fr');
ck('www.lesjoutes.fr is not a page of the game (GitHub sends it to lesjoutes.fr): not allowed', ao === 'https://lesjoutes.fr', ao);
[, , ao] = await get('/rec', 'https://lesjoutes.fr.evil.example');
ck('a look-alike address is not allowed', ao === 'https://lesjoutes.fr', ao);
const preN = await mf.dispatchFetch('http://x/ami', { method: 'OPTIONS', headers: { Origin: 'https://lesjoutes.fr', 'Access-Control-Request-Method': 'POST' } });
ck('the question before a friends post from lesjoutes.fr is answered', preN.status === 204 && preN.headers.get('access-control-allow-origin') === 'https://lesjoutes.fr' && preN.headers.get('access-control-allow-methods').includes('POST'));
[st, body] = await get('/nimporte');
ck('another path: 404', st === 404 && body.why === 'path', [st, body]);
const pu = await mf.dispatchFetch('http://x/rec', { method: 'PUT', headers: { Origin: O } });
ck('another method: 405', pu.status === 405);

// ---- the friends (version 3)
const amiP = async (path, b, ip = '3.3.3.3') => { const r = await mf.dispatchFetch('http://x' + path, { method: 'POST', headers: { Origin: O, 'Content-Type': 'text/plain;charset=UTF-8', 'CF-Connecting-IP': ip }, body: typeof b === 'string' ? b : JSON.stringify(b) }); return [r.status, await r.json()]; };
const K3 = 'zyxwvutsrqponmlkjihgfedcba987654', K4 = 'QWERTYUIOPASDFGHJKLZXCVBNM123456';
const pres = (key, more = {}) => Object.assign({ key, n: 'Patrick', h: 'cerf', c: 0, u: 'bois', lv: 16, st: 'home', m: 'lt' }, more);
let [sa, A] = await amiP('/ami', pres(K3));
ck('a player tells where he is: his friend code (6 signs, no I, O, 0, 1), no friend yet', sa === 200 && A.ok && /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(A.code) && Array.isArray(A.amis) && A.amis.length === 0, [sa, A]);
let [, A2] = await amiP('/ami', pres(K3, { n: 'Pat' }));
ck('… his code is always the same', A2.code === A.code, [A.code, A2.code]);
let [sb, B] = await amiP('/ami', pres(K4, { n: 'Lucas', h: 'ours', c: 1, lv: 7 }));
ck('another player has another code', sb === 200 && B.code !== A.code, [A.code, B.code]);
let [sq, Q] = await amiP('/ami/qui', { key: K3, code: B.code.toLowerCase().slice(0, 3) + ' ' + B.code.slice(3) });
ck('before adding: who has this code (lower case and a space are read too): Lucas, Grand Ours, level 7', sq === 200 && Q.ok && Q.n === 'Lucas' && Q.h === 'ours' && Q.lv === 7 && Q.code === B.code, [sq, Q]);
[sq, Q] = await amiP('/ami/qui', { key: K3, code: A.code });
ck('… one\'s own code: « toi »', sq === 400 && Q.why === 'toi', [sq, Q]);
[sq, Q] = await amiP('/ami/qui', { key: K3, code: 'ZZZZZZ' === A.code || 'ZZZZZZ' === B.code ? 'YYYYYY' : 'ZZZZZZ' });
ck('… a code nobody has: « inconnu »', sq === 404 && Q.why === 'inconnu', [sq, Q]);
[sq, Q] = await amiP('/ami/qui', { key: K3, code: 'AB10' });
ck('… a code that cannot be one: refused', sq === 400 && Q.why === 'code', [sq, Q]);
let [sd, D] = await amiP('/ami/add', { key: K3, code: B.code });
ck('adding Lucas: friends both ways, at once', sd === 200 && D.ok && D.ami.n === 'Lucas' && D.ami.code === B.code, [sd, D]);
[, B] = await amiP('/ami', pres(K4, { n: 'Lucas', h: 'ours', c: 1, lv: 7 }));
ck('… Lucas sees Pat in his friends, at home, just now', B.amis.length === 1 && B.amis[0].n === 'Pat' && B.amis[0].code === A.code && B.amis[0].st === 'home' && B.amis[0].ago <= 2 && B.amis[0].room === '', B.amis);
[, A] = await amiP('/ami', pres(K3, { n: 'Pat', st: 'table', m: 'farm', room: 'k7q4', rn: 4, rk: 2 }));
[, B] = await amiP('/ami', pres(K4, { n: 'Lucas', h: 'ours', c: 1, lv: 7 }));
ck('Pat at his table of Farm TD: Lucas sees the table\'s code, 2 of 4', B.amis[0].st === 'table' && B.amis[0].m === 'farm' && B.amis[0].room === 'k7q4' && B.amis[0].rn === 4 && B.amis[0].rk === 2, B.amis[0]);
[, A] = await amiP('/ami', pres(K3, { n: 'Pat', st: 'table', m: 'farm', room: 'K7Q4!', rn: 4, rk: 2 }));
[, B] = await amiP('/ami', pres(K4, { n: 'Lucas' }));
ck('… a table\'s code that cannot be one: at home, no code given', B.amis[0].st === 'home' && B.amis[0].room === '', B.amis[0]);
[, A] = await amiP('/ami', pres(K3, { n: 'Pat', st: 'game', m: 'gem' }));
[, B] = await amiP('/ami', pres(K4, { n: 'Lucas' }));
ck('… in a game of Gem TD', B.amis[0].st === 'game' && B.amis[0].m === 'gem' && B.amis[0].room === '', B.amis[0]);
const rest = await mf.getD1Database('DB'); await rest.prepare('UPDATE players SET at = at - 80000 WHERE code = ?1').bind(A.code).run();
[, B] = await amiP('/ami', pres(K4, { n: 'Lucas' }));
ck('… silent for 80 s: « off », where he was is no longer said, how long ago is', B.amis[0].st === 'off' && B.amis[0].m === '' && B.amis[0].room === '' && B.amis[0].ago >= 80, B.amis[0]);
[sd, D] = await amiP('/ami/add', { key: K3, code: B.code });
ck('adding him again changes nothing', sd === 200 && D.ok, [sd, D]);
[, A] = await amiP('/ami', pres(K3, { n: 'Pat' }));
ck('… still one friend', A.amis.length === 1 && A.amis[0].n === 'Lucas', A.amis);
[sd, D] = await amiP('/ami/add', { key: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef', code: A.code });
ck('a key that never told where it is cannot add anyone', sd === 400 && D.why === 'moi', [sd, D]);
[sd, D] = await amiP('/ami/del', { key: K4, code: A.code });
[, A] = await amiP('/ami', pres(K3, { n: 'Pat' })); [, B] = await amiP('/ami', pres(K4, { n: 'Lucas' }));
ck('no longer friends, on both sides', sd === 200 && D.ok && A.amis.length === 0 && B.amis.length === 0, [A.amis, B.amis]);
for (const [path, b, why, name] of [['/ami', { key: 'x' }, 'key', 'a bad key'], ['/ami/add', { key: K3 }, 'code', 'no code'], ['/ami', 'nope', 'json', 'not JSON']]) {
  const [s3, b3] = await amiP(path, b); ck(`friends, refused: ${name}`, s3 === 400 && b3.why === why, [s3, b3]);
}
const ga = await mf.dispatchFetch('http://x/ami', { headers: { Origin: O } });
ck('friends: a GET is not allowed', ga.status === 405);
const [, R2] = await get();
ck('the records still answer as before', R2.boards && R2.boards['gem/croix'].length >= 1, Object.keys(R2.boards || {}).length);
await mf.dispose();
console.log(`${P} passed, ${F} failed`);
process.exit(F ? 1 : 0);
