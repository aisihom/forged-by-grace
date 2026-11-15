'use strict';
// v3.31 — coach "Delete client" wipes server + phone; coach approval gate. Unit + static checks (no network).
// Live check with throwaway accounts: tools/e2e-delete-live.js (not part of npm test).
var fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
var root = path.resolve(__dirname, '..');
var sql = fs.readFileSync(path.join(root, 'supabase/client_delete_approval.sql'), 'utf8');
var cloud = fs.readFileSync(path.join(root, 'js/cloud.js'), 'utf8');
var failed = 0, q = Promise.resolve();
function add(name, fn) { q = q.then(function () { return Promise.resolve().then(fn).then(function () { console.log('ok  ' + name); }, function (e) { failed++; console.error('fail  ' + name + '\n  ' + (e && e.stack || e)); }); }); }
function fnSql(name) { var a = sql.indexOf('function ' + name + '('); assert.ok(a !== -1, name + ' in SQL'); return sql.slice(a, sql.indexOf('$$;', a) + 3); }

// ---------- server: permission logic ----------
add('delete RPC: only a coach, only his own client, never himself, never anon', function () {
  var f = fnSql('public.coach_delete_client');
  assert.ok(/security definer/.test(f));
  assert.ok(/auth\.uid\(\)/.test(f) && /not signed in/.test(f));
  assert.ok(/from public\.coaches where user_id = v_uid/.test(f), 'must be a coach');
  assert.ok(/r\.coach_id is distinct from v_uid then raise exception 'not your client'/.test(f), 'own client only');
  assert.ok(/r\.user_id = v_uid then raise exception 'cannot delete yourself'/.test(f));
  assert.ok(/revoke all on function public\.coach_delete_client\(uuid\)[^;]*from public, anon/.test(sql));
});
add('delete RPC removes everything and leaves a tombstone first', function () {
  var f = fnSql('public.coach_delete_client');
  ['insert into private.deleted_clients', 'delete from private.health_tokens', 'delete from public.client_data', 'delete from public.clients', 'delete from auth.users'].forEach(function (x) { assert.ok(f.indexOf(x) !== -1, x); });
  assert.ok(f.indexOf('insert into private.deleted_clients') < f.indexOf('delete from public.clients'));
  assert.ok(/storage\.objects[\s\S]*photos left/.test(f), 'refuses while photos are left (storage needs the Storage API)');
  assert.ok(/not exists \(select 1 from public\.coaches where user_id = r\.user_id\)/.test(f), 'never deletes a coach login');
});
add('tombstone RPC: explicit boolean, needs the client id', function () {
  var f = fnSql('public.fbg_was_deleted');
  assert.ok(/returns boolean/.test(f) && /client_id = p_cid/.test(f));
});
add('approval: everyone existing stays approved; new sign-ups are pending', function () {
  assert.ok(/update public\.clients set status = 'active' where status is distinct from 'active' and user_id is not null/.test(sql));
  assert.ok(/'invited','pending','active'/.test(sql), 'status check allows pending');
  assert.ok(/status = 'pending'/.test(fnSql('private.link_user')));
  assert.ok(/'pending', now\(\)/.test(fnSql('private.join_coach')));
});
add('approval enforced by the server: pending cannot read own row/plan or write data/photos/health', function () {
  assert.ok(/create policy clients_select[\s\S]{0,200}user_id = \(select auth\.uid\(\)\) and status = 'active'/.test(sql));
  assert.ok(/create policy data_insert[\s\S]{0,120}my_active_client_ids/.test(sql));
  assert.ok(/create policy data_update[\s\S]{0,200}my_active_client_ids[\s\S]{0,80}my_active_client_ids/.test(sql));
  assert.ok(/create policy photos_ins[\s\S]{0,200}my_active_client_ids/.test(sql));
  assert.ok(/status = 'active'/.test(fnSql('private.my_active_client_ids')) && /status = 'active'/.test(fnSql('private.my_client_ids')));
  assert.ok(/status = 'active'/.test(fnSql('private.my_health_token')));
  assert.ok(/client not approved/.test(fnSql('private.health_ok')));
  assert.ok(/p_kind not in \('intake', 'consent'\)/.test(fnSql('public.pending_push')), 'pending may only send intake/consent');
});

// ---------- phone: wipe ONLY on an explicit true ----------
function makeApp(opts) {
  var store = Object.assign({}, opts.ls || {}), wiped = { n: 0 }, fetches = [];
  var localStorage = { getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; }, key: function (i) { return Object.keys(store)[i]; } };
  Object.defineProperty(localStorage, 'length', { get: function () { return Object.keys(store).length; } });
  var sb = { console: console, localStorage: localStorage, sessionStorage: { clear: function () {} }, setTimeout: function () { return 0; },
    document: { addEventListener: function () {}, querySelector: function () { return null; }, getElementById: function () { return null; } },
    addEventListener: function () {}, location: { hash: '', search: '', pathname: '/', replace: function () {}, reload: function () {} }, indexedDB: null };
  sb.window = sb;
  sb.App = { S: { lang: 'nl', role: opts.role || 'athlete', gateV: opts.gateV == null ? 1 : opts.gateV, coach: { name: 'Aarón' }, me: Object.assign({}, opts.me || {}), clients: opts.clients || [] },
    esc: String, acts: {}, views: { clients: function () { return '<div class="grid3"></div>'; } }, F: {}, save: function () {}, route: function () {}, toast: function () {}, sheet: function () { return { el: {} }; },
    cloud: { selfClientId: function () { return opts.own || null; }, role: function () { return null; }, state: function () { return {}; } } };
  sb.App._noReload = true;
  sb.App._fetch = function (u, o) { fetches.push([u, o]); return opts.fetch(); };
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/access.js'), 'utf8'), sb);
  var real = sb.App.wipeDevice; sb.App.wipeDevice = function () { wiped.n++; return real(); };
  return { App: sb.App, store: store, wiped: wiped, fetches: fetches };
}
function resp(status, body) { return function () { return Promise.resolve({ status: status, text: function () { return Promise.resolve(body); } }); }; }
var CID = '11111111-2222-3333-4444-555555555555';
[['network error', function () { return Promise.reject(new Error('offline')); }], ['HTTP 500', resp(500, 'true')], ['HTTP 401', resp(401, 'true')], ['answer false', resp(200, 'false')],
 ['empty body', resp(200, '')], ['empty list', resp(200, '[]')], ['null', resp(200, 'null')], ['string "true"', resp(200, '"true"')], ['object', resp(200, '{"ok":true}')], ['html page', resp(200, '<html>true</html>')]
].forEach(function (c) {
  add('phone never wipes on ' + c[0], function () {
    var t = makeApp({ me: { cid: CID }, ls: { 'fbg.state.v2': '{}', 'fbg.uid': 'u1' }, fetch: c[1] });
    return t.App.checkDeleted(true).then(function (r) { assert.strictEqual(r, false); assert.strictEqual(t.wiped.n, 0); assert.ok(t.store['fbg.state.v2'], 'state kept'); assert.strictEqual(t.fetches.length, 1); });
  });
});
add('phone wipes on an explicit true: all fbg.* + session gone, notice set', function () {
  var t = makeApp({ me: { cid: CID }, ls: { 'fbg.state.v2': '{}', 'fbg.uid': 'u1', 'fbg.sb.auth': '{"user":{"id":"u1"}}', 'fbg.pet': '1', 'other.app': 'keep' }, fetch: resp(200, 'true') });
  return t.App.checkDeleted(true).then(function (r) {
    assert.strictEqual(r, true); assert.strictEqual(t.wiped.n, 1);
    assert.deepStrictEqual(Object.keys(t.store).sort(), ['fbg.deletedNotice', 'other.app']);
    var b = JSON.parse(t.fetches[0][1].body); assert.strictEqual(b.p_cid, CID); assert.strictEqual(b.p_uid, 'u1');
  });
});
add('no client id or coach device: never even asks', function () {
  var a = makeApp({ me: {}, fetch: resp(200, 'true') }), b = makeApp({ me: { cid: CID, coachOk: true }, fetch: resp(200, 'true') });
  return Promise.all([a.App.checkDeleted(true), b.App.checkDeleted(true)]).then(function (r) { assert.deepStrictEqual(r, [false, false]); assert.strictEqual(a.fetches.length + b.fetches.length, 0); });
});

// ---------- coach list ----------
add('deleted client leaves the coach list and cannot come back via merge; own record is never dropped', function () {
  var t = makeApp({ role: 'coach', me: { coachOk: true }, own: 'own-id', fetch: resp(200, 'false'),
    clients: [{ id: 'a', name: 'Weg', cloudId: 'del-1' }, { id: 'b', name: 'Blijft', cloudId: 'keep-1' }, { id: 'c', name: 'Lokaal' }] });
  assert.strictEqual(t.App.applyDeletedClients(['del-1', 'own-id']), true);
  assert.deepStrictEqual(t.App.S.clients.map(function (c) { return c.name; }), ['Blijft', 'Lokaal']);
  assert.ok(t.App.isDeletedClient('del-1') && !t.App.isDeletedClient('own-id'));
  assert.strictEqual(t.App.applyDeletedClients([]), false, 'empty answer changes nothing');
  assert.ok(/App\.isDeletedClient && App\.isDeletedClient\(id\)\)\) return;/.test(cloud), 'merge() skips deleted ids');
  assert.ok(/rows = \{\}; data = \{\}; pendingRows = \[\];/.test(cloud), 'coachPull rebuilds from the server answer');
  assert.ok(/if \(r\[0\]\.error \|\| r\[1\]\.error \|\| !Array\.isArray\(r\[0\]\.data\)\) return;/.test(cloud), 'failed pull changes nothing');
});

// ---------- gate ----------
add('gate: coach device ok, approved client ok, pending locked, unknown locked', function () {
  var f = resp(200, 'false');
  assert.strictEqual(makeApp({ me: { coachOk: true }, fetch: f }).App.accessState(), 'ok');
  assert.strictEqual(makeApp({ me: { cid: CID }, fetch: f }).App.accessState(), 'ok');
  assert.strictEqual(makeApp({ me: {}, ls: { 'fbg.pending': '1' }, fetch: f }).App.accessState(), 'pending');
  assert.strictEqual(makeApp({ me: { cid: CID }, ls: { 'fbg.pending': '1' }, fetch: f }).App.accessState(), 'pending');
  assert.strictEqual(makeApp({ me: {}, fetch: f }).App.accessState(), 'login');
});
add('existing coach installs keep working after the update (one-time migration); new strangers do not', function () {
  var f = resp(200, 'false');
  assert.strictEqual(makeApp({ me: { isCoach: true }, gateV: 0, fetch: f }).App.accessState(), 'ok');
  assert.strictEqual(makeApp({ role: 'coach', me: {}, gateV: 0, fetch: f }).App.accessState(), 'ok');
  var later = makeApp({ me: { isCoach: true }, fetch: f }); // picked "I'm the coach" after the gate existed: needs a coach login
  assert.strictEqual(later.App.accessState(), 'login');
});

q.then(function () { console.log(failed ? '\n' + failed + ' failed' : '\nall tests passed'); process.exit(failed ? 1 : 0); });
