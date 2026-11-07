// Les Joutes · le serveur : un Worker Cloudflare et sa base D1 « DB » (la base « joutes », gardée dans l'Union européenne).
// Version 2 du 07/11/2026. Patrick, 03/11 (16 h 34) : « je suis d'accord pour les records qui durent, de créer notre propre serveur
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
const FIXED = {
  'lt/all': 500000,
  'gem/sablier': 20000000, 'gem/croix': 20000000, 'gem/lacets': 20000000, 'gem/etoile': 20000000,
  'farm/trefle': 50000000, 'farm/peigne': 50000000, 'farm/escargot': 50000000, 'farm/dunes': 50000000,
};
const DEFI_CAP = 50000000;
const HOUSES = ['cerf', 'ours', 'griffon', 'renard'];
const COLOURS = 7;
const ORIGINS = ['https://patrickmorvan21.github.io', 'capacitor://localhost', 'http://localhost:8091', 'http://127.0.0.1:8091'];
const TOP = 100, MAX_RECS = 16, PER_MIN = 40, KEEP_DEFI_DAYS = 8, CACHE_MS = 10000;
const KEY = /^[A-Za-z0-9]{32}$/, OUTFIT = /^[a-z0-9_]{1,24}$/, DAY = /^defi\/(\d{4}-\d{2}-\d{2})$/;
const outfitOk = v => typeof v === 'string' && OUTFIT.test(v);
const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS records (b TEXT NOT NULL, pid TEXT NOT NULL, n TEXT NOT NULL, h TEXT NOT NULL, c INTEGER NOT NULL, u TEXT NOT NULL, s INTEGER NOT NULL, w INTEGER NOT NULL, t INTEGER NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (b, pid))',
  'CREATE INDEX IF NOT EXISTS records_best ON records (b, s DESC, t ASC)',
  'CREATE TABLE IF NOT EXISTS hits (ip TEXT NOT NULL, m INTEGER NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (ip, m))',
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

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    if (url.pathname === '/' && req.method === 'GET') return reply(req, { ok: true, nom: 'les-joutes', v: 2 });
    if (url.pathname !== '/rec') return no(req, 'path', 404);
    if (!env.DB) return no(req, 'db', 500);
    try {
      await setup(env.DB);
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
