'use strict';
// v3.30.19 — check-in photos may never be wiped by sync. Would have caught the Nov 2026 loss (Stephanie, twice).
var fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
var root = path.resolve(__dirname, '..');
var OWN = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
var calls = [], events = [], listing = { main: [], trash: [] }, moveErr = null, ls = {};
function storage() {
  return {
    remove: function (p) { calls.push(['remove', p.slice()]); return Promise.resolve({ error: null }); },
    move: function (a, b) { calls.push(['move', a, b]); var e = moveErr; return Promise.resolve({ error: e }); },
    list: function (prefix) { calls.push(['list', prefix]); return Promise.resolve({ error: null, data: /\/trash$/.test(prefix) ? listing.trash : listing.main }); }
  };
}
var sb = {
  console: console, setInterval: function () { return 0; }, setTimeout: function () { return 0; }, clearTimeout: function () {},
  document: { getElementById: function () { return null; }, querySelector: function () { return null; }, querySelectorAll: function () { return []; }, addEventListener: function () {} },
  location: { hash: '' }, URL: { createObjectURL: function () { return 'blob:x'; }, revokeObjectURL: function () {} },
  localStorage: { getItem: function (k) { return ls[k] || null; }, setItem: function (k, v) { ls[k] = String(v); } }
};
sb.window = sb; sb.FBG_I18N = { nl: {} };
sb.FBG_LOG = function (k, m) { events.push([k, m]); };
sb.App = {
  S: { lang: 'nl', role: 'athlete', me: { photoLog: [], photoGone: { 'ph-2026-11-05-front-old1': 1, 'ph-2026-11-09-back-old2': 1, junk: 1 } } },
  esc: String, t: function (s) { return s; }, I: {}, acts: {}, views: { client: function () { return ''; }, progress: function () { return ''; } },
  F: { slug: function (s) { return s; }, fmtDay: function (d) { return d; } }, toast: function () {}, save: function () {}, client: function () { return null; },
  cloud: { state: function () { return { role: 'client', client: OWN }; }, sb: { storage: { from: storage } } }
};
vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(root, 'js/checkin2.js'), 'utf8'), sb);
vm.runInContext(fs.readFileSync(path.join(root, 'js/photoguide.js'), 'utf8'), sb);
var App = sb.App, S = App.S;
App.photoDel = function () { return Promise.resolve(); };

var failed = 0, q = Promise.resolve();
function add(name, fn) { q = q.then(function () { return Promise.resolve().then(fn).then(function () { console.log('ok  ' + name); }, function (e) { failed++; console.error('fail  ' + name + '\n  ' + (e && e.stack || e)); }); }); }
function body(src, name) { var a = src.indexOf('function ' + name + '('); assert.ok(a !== -1, name + ' exists'); var b = src.indexOf('\n  }\n', a); return src.slice(a, b); }
var cloud = fs.readFileSync(path.join(root, 'js/cloud.js'), 'utf8');

add('upgrade parks an old (v1) photoGone list: nothing in it is acted on', function () {
  assert.strictEqual(S.me.photoGoneV, 2);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(S.me.photoGone)), {});
  assert.deepStrictEqual(Object.keys(S.me.photoGoneLegacy).sort(), ['ph-2026-11-05-front-old1', 'ph-2026-11-09-back-old2']);
  assert.ok(events.some(function (e) { return e[0] === 'photo:legacy-parked'; }));
  assert.strictEqual(App.migratePhotoGone(S.me), false, 'runs once');
});

add('sync loop never deletes: photos() sends only queued explicit deletes, no remove() at all', function () {
  var p = body(cloud, 'photos');
  assert.strictEqual(p.indexOf('.remove('), -1);
  assert.strictEqual(p.indexOf('removeStoredCheckinPhoto'), -1);
  assert.strictEqual(p.indexOf('Object.keys(gone)'), -1);
  assert.ok(p.indexOf('flushTrash') !== -1);
});

add('reconcile heals, never destroys: no photoDel/remove, checks list errors', function () {
  var r = body(cloud, 'reconcilePhotos');
  assert.strictEqual(r.indexOf('photoDel'), -1);
  assert.strictEqual(r.indexOf('.remove('), -1);
  assert.ok(r.indexOf('r.error') !== -1 && r.indexOf('Array.isArray') !== -1);
  assert.ok(r.indexOf("'trash-found'") !== -1);
});

add('remote photoGone: old flat v1 lists ignored, v2 merged', function () {
  var m = body(cloud, 'mergeGoneData');
  assert.ok(m.indexOf('d.v !== 2') !== -1);
  assert.ok(cloud.indexOf("photoGone: { v: 2, ids: me.photoGone || {} }") !== -1);
});

add('every kind the app syncs is allowed by the client_data check constraint', function () {
  var sql = fs.readFileSync(path.join(root, 'supabase/photo_safety.sql'), 'utf8');
  var allowed = /array\[([^\]]+)\]/.exec(sql)[1].match(/'([^']+)'/g).map(function (x) { return x.slice(1, -1); });
  var snap = body(cloud, 'snapshot'), ret = snap.slice(snap.indexOf('return {'));
  var kinds = (ret.match(/[{,]\s*([a-zA-Z_]+):/g) || []).map(function (x) { return x.replace(/[{,:\s]/g, ''); });
  var top = ['profile', 'sessions', 'food', 'body', 'habits', 'checkins', 'water', 'steps', 'health', 'recipes', 'consent', 'photoGone', 'intake', 'game', 'extra'];
  top.forEach(function (k) { assert.ok(kinds.indexOf(k) !== -1, 'snapshot sends ' + k); assert.ok(allowed.indexOf(k) !== -1, 'constraint allows ' + k); });
});

add('photosMissing: only stamped, older than 60s; empty listing flagged', function () {
  var now = 1800000000000, ath = { cloudPh: { 'ph-2026-11-09-front-a': now - 120000, 'ph-2026-11-09-back-a': now - 1000 },
    photoLog: [{ date: '2026-11-09', poses: { front: 'ph-2026-11-09-front-a', back: 'ph-2026-11-09-back-a', left: 'ph-2026-11-09-left-a' } }] };
  var r = App.photosMissing(ath, [{ name: 'avatar.jpg' }, { name: 'trash' }], now);
  assert.strictEqual(JSON.stringify(r.missing), JSON.stringify(['ph-2026-11-09-front-a']));
  assert.strictEqual(r.empty, true);
  var r2 = App.photosMissing(ath, [{ name: 'ph-2026-11-09-front-a.jpg' }], now);
  assert.strictEqual(JSON.stringify(r2.missing), JSON.stringify([])); assert.strictEqual(r2.empty, false);
});

add('reconcileDecide: trash = explicit delete elsewhere, else re-upload; empty listing never re-uploads', function () {
  var d = App.reconcileDecide(['ph-2026-11-09-front-a', 'ph-2026-11-09-back-a'], [{ name: '1794000000000__ph-2026-11-09-front-a.jpg' }], false);
  assert.strictEqual(JSON.stringify(d.gone), JSON.stringify(['ph-2026-11-09-front-a']));
  assert.strictEqual(JSON.stringify(d.reupload), JSON.stringify(['ph-2026-11-09-back-a']));
  var e = App.reconcileDecide(['ph-2026-11-09-back-a'], [], true);
  assert.strictEqual(JSON.stringify(e.gone), JSON.stringify([])); assert.strictEqual(JSON.stringify(e.reupload), JSON.stringify([]));
});

add('markPhotoGone stores + logs the reason, ignores non-photo names', function () {
  events.length = 0;
  assert.strictEqual(App.markPhotoGone('ph-2026-11-10-left-z', 'retake'), true);
  assert.strictEqual(S.me.photoGone['ph-2026-11-10-left-z'].why, 'retake');
  assert.ok(events.some(function (e) { return e[0] === 'photo:gone' && /retake ph-2026-11-10-left-z/.test(e[1]); }));
  assert.strictEqual(App.markPhotoGone('avatar.jpg', 'x'), false);
  assert.strictEqual(App.markPhotoGone('ph-2026-11-10-left-z', 'again'), false, 'no duplicate');
});

add('explicit delete = move to own trash, never remove(); offline delete is queued and sent once', function () {
  calls.length = 0; moveErr = { message: 'Failed to fetch' };
  S.me.photoLog = [{ date: '2026-11-10', poses: { front: 'ph-2026-11-10-front-q' } }];
  return App.deleteCheckinPhoto({ id: 'ph-2026-11-10-front-q', folderId: OWN }).then(function () {
    assert.ok(S.me.photoTrashQ['ph-2026-11-10-front-q'], 'queued while offline');
    assert.strictEqual(calls.filter(function (c) { return c[0] === 'remove'; }).length, 0);
    moveErr = null; calls.length = 0;
    return App.flushTrash(OWN);
  }).then(function (n) {
    assert.strictEqual(n, 1);
    assert.deepStrictEqual(Object.keys(S.me.photoTrashQ), []);
    assert.strictEqual(calls[0][0], 'move'); assert.ok(calls[0][2].indexOf(OWN + '/trash/') === 0);
    calls.length = 0;
    return App.flushTrash(OWN);
  }).then(function (n) {
    assert.strictEqual(n, 0); assert.strictEqual(calls.length, 0, 'completed delete is never sent again');
  });
});

add('already-gone file counts as done (not found)', function () {
  moveErr = { message: 'Object not found' }; S.me.photoTrashQ = { 'ph-2026-11-10-back-q': { at: 1, n: 0 } };
  return App.flushTrash(OWN).then(function (n) { moveErr = null; assert.strictEqual(n, 1); assert.deepStrictEqual(Object.keys(S.me.photoTrashQ), []); });
});

add('trash cleanup removes only trash files older than 30 days, once per day', function () {
  var now = Date.UTC(2026, 11, 20); calls.length = 0;
  listing.trash = [{ name: (now - 31 * 864e5) + '__ph-2026-11-01-front-a.jpg' }, { name: (now - 5 * 864e5) + '__ph-2026-11-15-front-b.jpg' }, { name: 'random.jpg' }];
  return App.cleanPhotoTrash(OWN, now).then(function (n) {
    assert.strictEqual(n, 1);
    var rm = calls.filter(function (c) { return c[0] === 'remove'; });
    assert.strictEqual(rm.length, 1);
    assert.deepStrictEqual(rm[0][1], [OWN + '/trash/' + (now - 31 * 864e5) + '__ph-2026-11-01-front-a.jpg']);
    calls.length = 0;
    return App.cleanPhotoTrash(OWN, now);
  }).then(function (n) { assert.strictEqual(n, 0); assert.strictEqual(calls.length, 0); });
});

add('only explicit UI paths can delete: every deleteCheckinPhoto call sits behind App.confirm', function () {
  ['js/checkin2.js', 'js/photoguide.js'].forEach(function (f) {
    var s = fs.readFileSync(path.join(root, f), 'utf8'), re = /App\.deleteCheckinPhoto\(\{/g, m;
    while ((m = re.exec(s))) { var before = s.slice(Math.max(0, m.index - 400), m.index); assert.ok(/App\.confirm\(/.test(before) && /if \(!ok\) return;/.test(before), f + ' delete without confirm'); }
  });
  var all = ['js/cloud.js', 'js/checkin2.js', 'js/photoguide.js'].map(function (f) { return fs.readFileSync(path.join(root, f), 'utf8'); }).join('\n');
  assert.strictEqual((all.match(/storage\.from\([^)]*\)\.remove\(/g) || []).length, 1, 'the only remove() is the 30-day trash cleanup');
});

q.then(function () { if (failed) { console.error('\n' + failed + ' failed'); process.exit(1); } console.log('\nall tests passed'); });
