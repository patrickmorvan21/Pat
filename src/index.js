// Les Joutes · le serveur : un Worker Cloudflare et sa base D1 « DB » (la base « joutes », gardée dans l'Union européenne).
// Version 2 du 07/11/2026 ; version 3 du 10/11/2026 : les amis. Patrick, 03/11 (16 h 34) : « je suis d'accord pour les records qui durent, de créer notre propre serveur
// gratuitement sur Cloudflare » ; 07/11 (11 h 06) : « je viens de créer mon compte … créer un serveur et le mettre dans mon jeu ».
//
// GET  /      → { ok, nom, v }                                         pour voir qu'il répond
// GET  /rec   → { v, jour, boards: { 'lt/all': [[pid, n, h, c, u, s, w, t], …], … } }
//               les cent meilleurs de chaque tableau : Line Towers, les quatre cartes de Gem TD, les quatre fermes de Farm TD, le défi
//               du jour et celui de la veille (le jour de la France, de minuit à minuit)
// POST /rec   { key, n, h, c, u, recs: [{ b, s, w, t, h?, u? }, …] }   les meilleurs scores d'un joueur → { ok, pid }
//   - un joueur, c'est une clé secrète (32 lettres et chiffres) que son téléphone garde et ne montre jamais ; son numéro public (pid)
//     en est tiré (16 signes de son empreinte SHA-256) : personne ne peut écrire sous le numéro d'un autre sans sa clé ;
//   - un score doit tenir dans son tableau (les plafonds du jeu) ; le nom est nettoyé (10 lettres au plus) ;
//   - seul un meilleur score remplace le score (avec sa vague et sa date) ; le nom, la Maison, la couleur et la tenue suivent le
//     dernier envoi (sur un défi, la Maison imposée ce jour-là) ;
//   - 40 envois par minute au plus depuis une même adresse (gardée brouillée, quelques minutes seulement).
// Version 3, les amis (Patrick, 10/11, 18 h 42 : « Il manque la liste d'amis en haut à droite. Et il manque l'invitation sur l'écran
// d'accueil quand quelqu'un crée une partie, celui-ci doit être ami avec nous pour qu'on le voit » ; 19 h 46, sur la planche : « je valide
// tout ce que tu as fait ») :
// POST /ami      { key, n, h, c, u, lv, st, m, room, rn, rk }  où j'en suis (toutes les 20 s quand l'accueil ou une table est ouvert)
//                → { ok, code, amis: [{ code, n, h, c, u, lv, st, m, room, rn, rk, ago }, …] }
//   - chaque joueur a un code ami de 6 signes, tiré de son numéro public (32 signes sans I, O, 0 ni 1), toujours le même ;
//   - st : 'home' (l'accueil), 'table' (à sa table, room = le code de sa table, rk joueurs sur rn), 'game' (en partie) ; un ami qui n'a
//     rien dit depuis 75 s est 'off', et le code de sa table n'est jamais donné ; seuls ses amis voient où il est ;
// POST /ami/qui  { key, code }   le joueur de ce code, avant de l'ajouter → { ok, n, h, c, u, lv }
// POST /ami/add  { key, code }   ajouter un ami : amis tous les deux, sans demande à accepter → { ok, ami: { code, n, h, c, u, lv } }
// POST /ami/del  { key, code }   ne plus être amis (des deux côtés) → { ok }
// Version 4 (11/11/2026), après la perte de profil de Patrick : « que ce genre de problème n'arrive plus » ; 16 h 11 : « Le profil sur le
// serveur et « Lier un appareil » : code le tout suite » ; « Prochainement » pour Gem TD et Fusion TD, avec un code VIP à taper :
// POST /profil        { key }                → { ok, t, data | null, vip, admin }   le profil gardé de ce joueur (sa progression, son nom…)
// POST /profil/save   { key, t, data }       → { ok, t } ; s'il y a plus récent ici : { ok, stale: true, t }
//   - data : les clés du jeu (ddl-…, jt-maison, farmtd-…, gemtd-…, gemmes-v1-…) et leurs valeurs, 200 000 signes au plus ; t : l'heure du téléphone ;
// POST /lier/code     { key }                → { ok, code, exp }   un code de 6 signes, valable 10 minutes, une seule fois
// POST /lier/prendre  { code }               → { ok, key }         sur l'autre appareil : la clé du profil (le code est alors effacé)
// POST /vip           { key, code }          → { ok, vip }         le code VIP de Patrick ouvre Gem TD et Fusion TD
// POST /vip/regler    { key, code }          → { ok }              Patrick seul (ses numéros publics) : le code VIP ; le changer ferme les anciens
//   - le code VIP n'est gardé que par son empreinte ; un VIP l'est tant que le code n'a pas changé.
// Version 5 (11/11/2026), Patrick, 18 h 41 : « savoir combien jouent activement, le temps passé, s'ils ont créé une table avec de vrais joueurs ou s'ils jouent seuls avec des bots » :
// POST /stat          { sid, p, ev: [{ k, m?, a?, b?, w?, n? }, …] }   des événements anonymes : sid = un tirage au hasard à chaque ouverture du jeu, jamais lié au profil
//   k : open (ouverture ; p : web, icone, appli) · ping (n secondes passées au jeu) · start (partie lancée ; m le mode, a vrais joueurs, b bots, w solo|table) ·
//       end (partie finie ; w win|lose|quit, n secondes, a vrais joueurs) · table (table créée) · join (table rejointe ; w code|lien|ami)
// POST /stats/resume  { key, days? }   Patrick seul : les totaux et les courbes (aucune fiche individuelle) → { ok, … }
const FIXED = {
  'lt/all': 500000,
  'gem/sablier': 20000000, 'gem/croix': 20000000, 'gem/lacets': 20000000, 'gem/etoile': 20000000,
  'farm/trefle': 50000000, 'farm/peigne': 50000000, 'farm/escargot': 50000000, 'farm/dunes': 50000000,
};
const DEFI_CAP = 50000000;
const HOUSES = ['cerf', 'ours', 'griffon', 'renard'];
const COLOURS = 8;
// lesjoutes.fr, the game's address since version 102 (11/11/2026); the old one (patrickmorvan21.github.io) stays: the old links, and the phones that have not reloaded the game
const ORIGINS = ['https://lesjoutes.fr', 'https://patrickmorvan21.github.io', 'capacitor://localhost', 'http://localhost:8091', 'http://127.0.0.1:8091'];
const TOP = 100, MAX_RECS = 16, PER_MIN = 90, KEEP_DEFI_DAYS = 8, CACHE_MS = 10000;
const KEY = /^[A-Za-z0-9]{32}$/, OUTFIT = /^[a-z0-9_]{1,24}$/, DAY = /^defi\/(\d{4}-\d{2}-\d{2})$/;
const outfitOk = v => typeof v === 'string' && OUTFIT.test(v);
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', CODE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/, ROOM = /^[a-z0-9]{3,8}$/;
const STATES = ['home', 'table', 'game'], MODES = ['lt', 'gem', 'farm'], ONLINE_MS = 75000, MAX_FRIENDS = 100;
// version 4: the profile, the links between devices, the VIPs
const PROF_KEY = /^(ddl-[a-z0-9-]{1,40}|jt-maison|farmtd-[a-z0-9-]{1,40}|gemtd-[a-z0-9-]{1,40}|gemmes-v1-[a-z0-9-]{1,40})$/, PROF_MAX = 200000, PROF_KEYS = 200;
const LINK_MS = 10 * 60000, VIP_CODE = /^[A-Z0-9]{4,16}$/;
// Patrick's public numbers (not secret: drawn from his keys) — he alone chooses the VIP code
const ADMINS = ['112f3a8f77616c5b', '1803e5789722bd41', 'd0a038f9c309cbf1'];
const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS ev (id INTEGER PRIMARY KEY AUTOINCREMENT, d TEXT NOT NULL, t INTEGER NOT NULL, sid TEXT NOT NULL, p TEXT NOT NULL, k TEXT NOT NULL, m TEXT NOT NULL, a INTEGER NOT NULL, b INTEGER NOT NULL, w TEXT NOT NULL, n INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS ev_d ON ev (d, k)',
  'CREATE TABLE IF NOT EXISTS players (pid TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, n TEXT NOT NULL, h TEXT NOT NULL, c INTEGER NOT NULL, u TEXT NOT NULL, lv INTEGER NOT NULL, st TEXT NOT NULL, m TEXT NOT NULL, room TEXT NOT NULL, rn INTEGER NOT NULL, rk INTEGER NOT NULL, at INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS friends (a TEXT NOT NULL, b TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (a, b))',
  'CREATE TABLE IF NOT EXISTS records (b TEXT NOT NULL, pid TEXT NOT NULL, n TEXT NOT NULL, h TEXT NOT NULL, c INTEGER NOT NULL, u TEXT NOT NULL, s INTEGER NOT NULL, w INTEGER NOT NULL, t INTEGER NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (b, pid))',
  'CREATE INDEX IF NOT EXISTS records_best ON records (b, s DESC, t ASC)',
  'CREATE TABLE IF NOT EXISTS hits (ip TEXT NOT NULL, m INTEGER NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (ip, m))',
  'CREATE TABLE IF NOT EXISTS profiles (pid TEXT PRIMARY KEY, data TEXT NOT NULL, t INTEGER NOT NULL, at INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS links (code TEXT PRIMARY KEY, pid TEXT NOT NULL, k TEXT NOT NULL, exp INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS vips (pid TEXT PRIMARY KEY, h TEXT NOT NULL, at INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
];
let ready = false, cache = null;
async function setup(db) { if (ready) return; await db.batch(SCHEMA.map(q => db.prepare(q))); ready = true; }

// ---- the day in France (the défi's day)
const DAY_FMT = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
function parisDay(ms = Date.now()) { const p = {}; for (const x of DAY_FMT.formatToParts(new Date(ms))) p[x.type] = x.value; return `${p.year}-${p.month}-${p.day}`; }
function shiftDay(day, k) { const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); }
const boardsOf = today => Object.keys(FIXED).concat(['defi/' + today, 'defi/' + shiftDay(today, -1)]);
function capOf(b, today) {
  if (Object.prototype.hasOwnProperty.call(FIXED, b)) return FIXED[b];
  const m = DAY.exec(b);
  return m && [shiftDay(today, -1), today, shiftDay(today, 1)].includes(m[1]) ? DEFI_CAP : 0;
}

// ---- answers
function cors(req) {
  const o = req.headers.get('Origin') || '';
  return { 'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0], 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' };
}
function reply(req, body, status = 200, extra = {}) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, cors(req), extra) });
}
const no = (req, why, status = 400, more = {}) => reply(req, Object.assign({ ok: false, why }, more), status);

// ---- the name as the game cleans it: no control or invisible characters, trimmed, 10 characters at most
function cleanName(s) {
  const ok = Array.from(String(s || '')).filter(ch => { const c = ch.codePointAt(0); return !(c < 32 || (c >= 127 && c < 160) || (c >= 0x200b && c <= 0x200f) || (c >= 0x202a && c <= 0x202e) || (c >= 0x2060 && c <= 0x206f) || c === 0xfeff); });
  return Array.from(ok.join('').trim()).slice(0, 10).join('') || 'Joueur';
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, Math.floor(+v) || 0));
async function sha(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, '0')).join('');
}

// ---- the records
async function getAll(db, today) {
  const keys = boardsOf(today);
  const rs = await db.batch(keys.map(b => db.prepare('SELECT pid, n, h, c, u, s, w, t FROM records WHERE b = ?1 ORDER BY s DESC, t ASC, pid ASC LIMIT ?2').bind(b, TOP)));
  const out = {};
  keys.forEach((b, i) => { out[b] = (rs[i].results || []).map(r => [r.pid, r.n, r.h, r.c, r.u, r.s, r.w, r.t]); });
  return out;
}
async function post(req, db) {
  let d; try { d = JSON.parse(await req.text()); } catch (e) { return no(req, 'json'); }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return no(req, 'json');
  const key = String(d.key || '');
  if (!KEY.test(key)) return no(req, 'key');
  const list = Array.isArray(d.recs) ? d.recs : [];
  if (!list.length || list.length > MAX_RECS) return no(req, 'recs');
  const today = parisDay(), now = Math.floor(Date.now() / 1000);
  const who = { n: cleanName(d.n), h: HOUSES.includes(d.h) ? d.h : 'cerf', c: clamp(d.c, 0, COLOURS - 1), u: outfitOk(d.u) ? d.u : 'bois' };
  const recs = [], seen = new Set();
  for (const r of list) {
    if (!r || typeof r !== 'object') return no(req, 'recs');
    const b = String(r.b || ''), cap = capOf(b, today);
    if (!cap) return no(req, 'board', 400, { b });
    if (seen.has(b)) return no(req, 'recs', 400, { b });
    seen.add(b);
    const s = Math.floor(+r.s);
    if (!(s > 0 && s <= cap)) return no(req, 'score', 400, { b });
    recs.push({ b, s, w: clamp(r.w, 0, 999), t: clamp(r.t, 0, now + 86400),
      h: HOUSES.includes(r.h) ? r.h : who.h, u: outfitOk(r.u) ? r.u : who.u });
  }
  // at most PER_MIN posts a minute from one address (kept scrambled with the day, deleted after a few minutes)
  const m = Math.floor(Date.now() / 60000);
  const ip = (await sha((req.headers.get('CF-Connecting-IP') || 'local') + '|' + today)).slice(0, 20);
  const hit = await db.prepare('INSERT INTO hits (ip, m, n) VALUES (?1, ?2, 1) ON CONFLICT (ip, m) DO UPDATE SET n = n + 1 RETURNING n').bind(ip, m).first();
  if (hit && hit.n > PER_MIN) return no(req, 'slow', 429);
  const pid = (await sha('lj|' + key)).slice(0, 16), at = Date.now();
  const q = db.prepare(`INSERT INTO records (b, pid, n, h, c, u, s, w, t, at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
    ON CONFLICT (b, pid) DO UPDATE SET n = excluded.n, h = excluded.h, c = excluded.c, u = excluded.u, at = excluded.at,
      w = CASE WHEN excluded.s > records.s THEN excluded.w ELSE records.w END,
      t = CASE WHEN excluded.s > records.s THEN excluded.t ELSE records.t END,
      s = MAX(records.s, excluded.s)`);
  const stmts = recs.map(r => q.bind(r.b, pid, who.n, r.h, who.c, r.u, r.s, r.w, r.t, at));
  if (Math.random() < 0.02) {
    stmts.push(db.prepare('DELETE FROM hits WHERE m < ?1').bind(m - 5));
    stmts.push(db.prepare("DELETE FROM records WHERE b LIKE 'defi/%' AND b < ?1").bind('defi/' + shiftDay(today, -KEEP_DEFI_DAYS)));
  }
  await db.batch(stmts);
  cache = null;
  return reply(req, { ok: true, pid });
}

// ---- the friends (version 3)
async function slowed(req, db, today) {
  const m = Math.floor(Date.now() / 60000);
  const ip = (await sha((req.headers.get('CF-Connecting-IP') || 'local') + '|' + today)).slice(0, 20);
  const hit = await db.prepare('INSERT INTO hits (ip, m, n) VALUES (?1, ?2, 1) ON CONFLICT (ip, m) DO UPDATE SET n = n + 1 RETURNING n').bind(ip, m).first();
  return !!(hit && hit.n > PER_MIN);
}
async function codeOf(pid, k) {
  const h = await sha('code|' + k + '|' + pid); let v = parseInt(h.slice(0, 8), 16) >>> 2, s = '';
  for (let i = 0; i < 6; i++) { s = ALPHA[v & 31] + s; v >>>= 5; }
  return s;
}
async function body(req) { let d; try { d = JSON.parse(await req.text()); } catch (e) { return null; } return d && typeof d === 'object' && !Array.isArray(d) ? d : null; }
const pub = r => ({ code: r.code, n: r.n, h: r.h, c: r.c, u: r.u, lv: r.lv });
async function amiMe(req, db, d) {
  const key = String(d.key || ''); if (!KEY.test(key)) return no(req, 'key');
  const today = parisDay(); if (await slowed(req, db, today)) return no(req, 'slow', 429);
  const pid = (await sha('lj|' + key)).slice(0, 16), now = Date.now();
  const st = STATES.includes(d.st) ? d.st : 'home', table = st === 'table' && ROOM.test(String(d.room || ''));
  const who = { n: cleanName(d.n), h: HOUSES.includes(d.h) ? d.h : 'cerf', c: clamp(d.c, 0, COLOURS - 1), u: outfitOk(d.u) ? d.u : 'bois', lv: clamp(d.lv, 1, 99),
    st: st === 'table' && !table ? 'home' : st, m: MODES.includes(d.m) ? d.m : 'lt', room: table ? String(d.room) : '', rn: table ? clamp(d.rn, 2, 8) : 0, rk: table ? clamp(d.rk, 1, 8) : 0 };
  const ex = await db.prepare('SELECT code FROM players WHERE pid = ?1').bind(pid).first();
  let code = ex && ex.code;
  for (let k = 0; !code && k < 8; k++) { const c = await codeOf(pid, k); if (!(await db.prepare('SELECT pid FROM players WHERE code = ?1').bind(c).first())) code = c; }
  if (!code) return no(req, 'code', 500);
  await db.prepare(`INSERT INTO players (pid, code, n, h, c, u, lv, st, m, room, rn, rk, at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
    ON CONFLICT (pid) DO UPDATE SET n = excluded.n, h = excluded.h, c = excluded.c, u = excluded.u, lv = excluded.lv, st = excluded.st, m = excluded.m,
      room = excluded.room, rn = excluded.rn, rk = excluded.rk, at = excluded.at`)
    .bind(pid, code, who.n, who.h, who.c, who.u, who.lv, who.st, who.m, who.room, who.rn, who.rk, now).run();
  const rs = await db.prepare('SELECT p.code, p.n, p.h, p.c, p.u, p.lv, p.st, p.m, p.room, p.rn, p.rk, p.at FROM friends f JOIN players p ON p.pid = f.b WHERE f.a = ?1 ORDER BY p.at DESC LIMIT ?2').bind(pid, MAX_FRIENDS).all();
  const amis = (rs.results || []).map(r => {
    const on = now - r.at < ONLINE_MS;
    return Object.assign(pub(r), { st: on ? r.st : 'off', m: on ? r.m : '', room: on && r.st === 'table' ? r.room : '', rn: on && r.st === 'table' ? r.rn : 0, rk: on && r.st === 'table' ? r.rk : 0, ago: Math.max(0, Math.round((now - r.at) / 1000)) });
  });
  return reply(req, { ok: true, code, amis });
}
async function amiCode(req, db, d, what) {
  const key = String(d.key || ''); if (!KEY.test(key)) return no(req, 'key');
  const code = String(d.code || '').toUpperCase().replace(/[\s-]/g, ''); if (!CODE.test(code)) return no(req, 'code');
  const today = parisDay(); if (await slowed(req, db, today)) return no(req, 'slow', 429);
  const pid = (await sha('lj|' + key)).slice(0, 16);
  const other = await db.prepare('SELECT pid, code, n, h, c, u, lv FROM players WHERE code = ?1').bind(code).first();
  if (!other) return no(req, 'inconnu', 404);
  if (other.pid === pid) return no(req, 'toi');
  if (what === 'qui') return reply(req, Object.assign({ ok: true }, pub(other)));
  if (what === 'del') { await db.batch([db.prepare('DELETE FROM friends WHERE a = ?1 AND b = ?2').bind(pid, other.pid), db.prepare('DELETE FROM friends WHERE a = ?1 AND b = ?2').bind(other.pid, pid)]); return reply(req, { ok: true }); }
  if (!(await db.prepare('SELECT pid FROM players WHERE pid = ?1').bind(pid).first())) return no(req, 'moi');
  const n = await db.prepare('SELECT COUNT(*) AS n FROM friends WHERE a = ?1').bind(pid).first();
  if (n && n.n >= MAX_FRIENDS) return no(req, 'plein');
  const at = Date.now();
  await db.batch([db.prepare('INSERT OR IGNORE INTO friends (a, b, at) VALUES (?1, ?2, ?3)').bind(pid, other.pid, at), db.prepare('INSERT OR IGNORE INTO friends (a, b, at) VALUES (?1, ?2, ?3)').bind(other.pid, pid, at)]);
  return reply(req, { ok: true, ami: pub(other) });
}

// ---- version 4: the profile kept on the server, the links between devices, the VIPs
const pidOf = async key => (await sha('lj|' + key)).slice(0, 16);
async function vipOf(db, pid) {
  if (ADMINS.includes(pid)) return true;
  const [cur, me] = await db.batch([db.prepare("SELECT v FROM settings WHERE k = 'vip'"), db.prepare('SELECT h FROM vips WHERE pid = ?1').bind(pid)]);
  const c = cur.results && cur.results[0], m = me.results && me.results[0];
  return !!(c && m && c.v === m.h);
}
async function profGet(req, db, d) {
  const key = String(d.key || ''); if (!KEY.test(key)) return no(req, 'key');
  if (await slowed(req, db, parisDay())) return no(req, 'slow', 429);
  const pid = await pidOf(key);
  const r = await db.prepare('SELECT data, t FROM profiles WHERE pid = ?1').bind(pid).first();
  let data = null; if (r) { try { data = JSON.parse(r.data); } catch (e) { data = null; } }
  return reply(req, { ok: true, t: r ? r.t : 0, data, vip: await vipOf(db, pid), admin: ADMINS.includes(pid) });
}
async function profSave(req, db, d) {
  const key = String(d.key || ''); if (!KEY.test(key)) return no(req, 'key');
  const t = Math.floor(+d.t); if (!(t > 0 && t < Date.now() + 86400000)) return no(req, 't');
  const src = d.data; if (!src || typeof src !== 'object' || Array.isArray(src)) return no(req, 'data');
  const data = {}; let n = 0, size = 0;
  for (const k of Object.keys(src)) {
    const v = src[k];
    if (!PROF_KEY.test(k) || /-test$/.test(k) || typeof v !== 'string') return no(req, 'data', 400, { k: k.slice(0, 50) });
    if (++n > PROF_KEYS) return no(req, 'data', 413);
    size += k.length + v.length; if (size > PROF_MAX) return no(req, 'big', 413);
    data[k] = v;
  }
  if (await slowed(req, db, parisDay())) return no(req, 'slow', 429);
  const pid = await pidOf(key);
  const ex = await db.prepare('SELECT t FROM profiles WHERE pid = ?1').bind(pid).first();
  if (ex && ex.t >= t) return reply(req, { ok: true, stale: true, t: ex.t });
  await db.prepare('INSERT INTO profiles (pid, data, t, at) VALUES (?1, ?2, ?3, ?4) ON CONFLICT (pid) DO UPDATE SET data = excluded.data, t = excluded.t, at = excluded.at')
    .bind(pid, JSON.stringify(data), t, Date.now()).run();
  return reply(req, { ok: true, t });
}
async function linkCode(req, db, d) {
  const key = String(d.key || ''); if (!KEY.test(key)) return no(req, 'key');
  if (await slowed(req, db, parisDay())) return no(req, 'slow', 429);
  const pid = await pidOf(key), now = Date.now(), exp = now + LINK_MS;
  const u = new Uint8Array(6); let code = '';
  for (let tries = 0; tries < 5; tries++) {
    crypto.getRandomValues(u); code = [...u].map(x => ALPHA[x & 31]).join('');
    if (!(await db.prepare('SELECT code FROM links WHERE code = ?1 AND exp > ?2').bind(code, now).first())) break;
  }
  await db.batch([db.prepare('DELETE FROM links WHERE pid = ?1 OR exp < ?2').bind(pid, now),
    db.prepare('INSERT OR REPLACE INTO links (code, pid, k, exp) VALUES (?1, ?2, ?3, ?4)').bind(code, pid, key, exp)]);
  return reply(req, { ok: true, code, exp });
}
async function linkTake(req, db, d) {
  const code = String(d.code || '').toUpperCase().replace(/[\s-]/g, ''); if (!CODE.test(code)) return no(req, 'code');
  if (await slowed(req, db, parisDay())) return no(req, 'slow', 429);
  const now = Date.now();
  const r = await db.prepare('SELECT k, exp FROM links WHERE code = ?1').bind(code).first();
  if (!r || r.exp < now) return no(req, 'inconnu', 404);
  await db.prepare('DELETE FROM links WHERE code = ?1').bind(code).run();
  return reply(req, { ok: true, key: r.k });
}
const vipHash = code => sha('vip|' + code);
async function vipTry(req, db, d) {
  const key = String(d.key || ''); if (!KEY.test(key)) return no(req, 'key');
  const code = String(d.code || '').toUpperCase().replace(/[\s-]/g, ''); if (!VIP_CODE.test(code)) return no(req, 'faux');
  if (await slowed(req, db, parisDay())) return no(req, 'slow', 429);
  const pid = await pidOf(key);
  const cur = await db.prepare("SELECT v FROM settings WHERE k = 'vip'").first();
  if (!cur) return no(req, 'ferme', 404);
  const h = await vipHash(code);
  if (h !== cur.v) return no(req, 'faux', 403);
  await db.prepare('INSERT INTO vips (pid, h, at) VALUES (?1, ?2, ?3) ON CONFLICT (pid) DO UPDATE SET h = excluded.h, at = excluded.at').bind(pid, h, Date.now()).run();
  return reply(req, { ok: true, vip: true });
}
async function vipSet(req, db, d) {
  const key = String(d.key || ''); if (!KEY.test(key)) return no(req, 'key');
  const pid = await pidOf(key); if (!ADMINS.includes(pid)) return no(req, 'admin', 403);
  const code = String(d.code || '').toUpperCase().replace(/[\s-]/g, ''); if (!VIP_CODE.test(code)) return no(req, 'code');
  await db.prepare("INSERT INTO settings (k, v) VALUES ('vip', ?1) ON CONFLICT (k) DO UPDATE SET v = excluded.v").bind(await vipHash(code)).run();
  return reply(req, { ok: true });
}

// ---- version 5: the anonymous statistics
const EV_K = ['open', 'ping', 'start', 'end', 'table', 'join'], EV_P = ['web', 'icone', 'appli'], EV_W = ['', 'solo', 'table', 'win', 'lose', 'quit', 'code', 'lien', 'ami'], SID = /^[a-z0-9]{8,16}$/, KEEP_EV_DAYS = 120;
async function statIn(req, db, d) {
  const sid = String(d.sid || ''); if (!SID.test(sid)) return no(req, 'sid');
  const p = EV_P.includes(d.p) ? d.p : 'web', evs = Array.isArray(d.ev) ? d.ev.slice(0, 20) : [];
  if (!evs.length) return reply(req, { ok: true, n: 0 });
  if (await slowed(req, db, parisDay())) return no(req, 'slow', 429);
  const now = Date.now(), day = parisDay(now), q = db.prepare('INSERT INTO ev (d, t, sid, p, k, m, a, b, w, n) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)'), st = [];
  for (const e of evs) {
    if (!e || !EV_K.includes(e.k)) continue;
    const m = MODES.includes(e.m) ? e.m : '', w = EV_W.includes(e.w) ? e.w : '';
    st.push(q.bind(day, now, sid, p, e.k, m, clamp(e.a, 0, 8), clamp(e.b, 0, 12), w, clamp(e.n, 0, e.k === 'ping' ? 120 : 86400)));
  }
  if (st.length) await db.batch(st);
  if (Math.random() < 0.01) await db.prepare('DELETE FROM ev WHERE d < ?1').bind(shiftDay(parisDay(), -KEEP_EV_DAYS)).run();
  return reply(req, { ok: true, n: st.length });
}
async function statOut(req, db, d) {
  const key = String(d.key || ''); if (!KEY.test(key)) return no(req, 'key');
  const pid = await pidOf(key); if (!ADMINS.includes(pid)) return no(req, 'admin', 403);
  const days = clamp(d.days || 14, 1, 90), today = parisDay(), from = shiftDay(today, -(days - 1)), now = Date.now();
  const all = async (sql, ...a) => (await db.prepare(sql).bind(...a).all()).results || [];
  const one = async (sql, ...a) => (await db.prepare(sql).bind(...a).first()) || {};
  const [perDay, byMode, byKind, tableSizes, secs, ends, joins, plat, usersOnline, reg, bySid, hours] = await Promise.all([
    all("SELECT d, COUNT(DISTINCT sid) AS sessions, SUM(CASE WHEN k='ping' THEN n ELSE 0 END) AS secs, SUM(k='start') AS starts, SUM(k='end') AS ends, SUM(k='table') AS tables, SUM(k='join') AS joins FROM ev WHERE d >= ?1 GROUP BY d ORDER BY d", from),
    all("SELECT m, COUNT(*) AS n FROM ev WHERE k='start' AND d >= ?1 GROUP BY m", from),
    all("SELECT w, COUNT(*) AS n, SUM(a>=2) AS humans, AVG(b) AS bots FROM ev WHERE k='start' AND d >= ?1 GROUP BY w", from),
    all("SELECT a, COUNT(*) AS n FROM ev WHERE k='start' AND w='table' AND d >= ?1 GROUP BY a ORDER BY a", from),
    one("SELECT COUNT(DISTINCT sid) AS sessions, SUM(CASE WHEN k='ping' THEN n ELSE 0 END) AS secs FROM ev WHERE d >= ?1", from),
    all("SELECT w, COUNT(*) AS n, AVG(n) AS secs FROM ev WHERE k='end' AND d >= ?1 GROUP BY w", from),
    all("SELECT w, COUNT(*) AS n FROM ev WHERE k='join' AND d >= ?1 GROUP BY w", from),
    all("SELECT p, COUNT(DISTINCT sid) AS n FROM ev WHERE k='open' AND d >= ?1 GROUP BY p", from),
    one("SELECT COUNT(DISTINCT sid) AS n FROM ev WHERE t > ?1", now - 5 * 60000),
    one("SELECT COUNT(*) AS joueurs, SUM(at > ?1) AS h24, SUM(at > ?2) AS d7, SUM(at > ?3) AS h1 FROM players", now - 86400000, now - 7 * 86400000, now - 3600000),
    all("SELECT sid, SUM(CASE WHEN k='ping' THEN n ELSE 0 END) AS secs, SUM(k='start') AS starts, SUM(k='start' AND w='table') AS tstarts, SUM(k='table' OR k='join') AS social FROM ev WHERE d >= ?1 GROUP BY sid", from),
    all("SELECT CAST(strftime('%H', t / 1000, 'unixepoch', '+1 hour') AS INTEGER) AS h, COUNT(DISTINCT sid) AS n FROM ev WHERE d >= ?1 GROUP BY h", from),
  ]);
  // how long a launch lasts, and what each launch did
  const buckets = [0, 0, 0, 0, 0]; let played = 0, withTable = 0, social = 0;
  for (const r of bySid) {
    const m = (r.secs || 0) / 60;
    buckets[m < 1 ? 0 : m < 5 ? 1 : m < 15 ? 2 : m < 30 ? 3 : 4]++;
    if (r.starts > 0) played++; if (r.tstarts > 0) withTable++; if (r.social > 0) social++;
  }
  const hrs = Array(24).fill(0); for (const r of hours) if (r.h >= 0 && r.h < 24) hrs[r.h] = r.n;
  return reply(req, { ok: true, days, from, today, now: { online: usersOnline.n || 0 }, players: reg,
    total: { sessions: secs.sessions || 0, secs: secs.secs || 0, played, withTable, social }, perDay, byMode, byKind, tableSizes, ends, joins, plat, buckets, hours: hrs });
}
const V4 = { '/profil': profGet, '/profil/save': profSave, '/lier/code': linkCode, '/lier/prendre': linkTake, '/vip': vipTry, '/vip/regler': vipSet, '/stat': statIn, '/stats/resume': statOut };

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    if (url.pathname === '/' && req.method === 'GET') return reply(req, { ok: true, nom: 'les-joutes', v: 5 });
    const AMI = { '/ami': 'me', '/ami/qui': 'qui', '/ami/add': 'add', '/ami/del': 'del' }[url.pathname];
    const F4 = Object.prototype.hasOwnProperty.call(V4, url.pathname) ? V4[url.pathname] : null;
    if (url.pathname !== '/rec' && !AMI && !F4) return no(req, 'path', 404);
    if (!env.DB) return no(req, 'db', 500);
    try {
      await setup(env.DB);
      if (F4) {
        if (req.method !== 'POST') return no(req, 'method', 405);
        const d = await body(req); if (!d) return no(req, 'json');
        return await F4(req, env.DB, d);
      }
      if (AMI) {
        if (req.method !== 'POST') return no(req, 'method', 405);
        const d = await body(req); if (!d) return no(req, 'json');
        return AMI === 'me' ? await amiMe(req, env.DB, d) : await amiCode(req, env.DB, d, AMI);
      }
      if (req.method === 'GET') {
        const today = parisDay();
        if (!cache || cache.day !== today || Date.now() - cache.at > CACHE_MS) cache = { at: Date.now(), day: today, body: JSON.stringify({ v: 2, jour: today, boards: await getAll(env.DB, today) }) };
        return reply(req, cache.body, 200, { 'Cache-Control': 'public, max-age=5' });
      }
      if (req.method === 'POST') return await post(req, env.DB);
      return no(req, 'method', 405);
    } catch (e) { return no(req, 'server', 500); }
  },
};
