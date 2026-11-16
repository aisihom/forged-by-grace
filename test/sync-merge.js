'use strict';
// v3.32 — a fresh/empty phone may never wipe server data. Would have caught "Esther is weer bij nul".
var path = require('path'), assert = require('assert');
var M = require(path.join(__dirname, '..', 'js', 'syncmerge.js'));
var T = require('./lib/check');

var server = [
  { kind: 'food', updated_at: '2026-11-15T10:00:00+00:00', data: { '2026-11-14': [{ id: 'a', name: 'Pan' }], '2026-11-15': [{ id: 'b', name: 'Rijst' }] } },
  { kind: 'sessions', updated_at: '2026-11-15T10:00:00+00:00', data: [{ id: 's1', date: '2026-11-10', endedAt: 1 }, { id: 's2', date: '2026-11-12', endedAt: 2 }] },
  { kind: 'body', updated_at: '2026-11-15T10:00:00+00:00', data: [{ date: '2026-11-02', weight: 95 }] },
  { kind: 'checkins', updated_at: '2026-11-15T10:00:00+00:00', data: { list: ['2026-11-09T08:00:00Z'], summary: { x: 1 }, photoLog: [{ date: '2026-11-09', poses: { front: 'ph-1' } }] } },
  { kind: 'habits', updated_at: '2026-11-15T10:00:00+00:00', data: { '2026-11-14': { water: true } } },
  { kind: 'water', updated_at: '2026-11-15T10:00:00+00:00', data: { '2026-11-14': 1500 } },
  { kind: 'profile', updated_at: '2026-11-15T10:00:00+00:00', data: { name: 'Esther', goal: 'lean', height: 165 } },
  { kind: 'intake', updated_at: '2026-11-15T10:00:00+00:00', data: [{ id: 'ik1', answers: {} }] },
  { kind: 'game', updated_at: '2026-11-15T10:00:00+00:00', data: { ls: { 'fbg.sp': '120', 'evil.key': 'x' }, game: { lvl: 3 } } },
  { kind: 'extra', updated_at: '2026-11-15T10:00:00+00:00', data: { sports: ['run'], pw: 'nope', cloudPh: { a: 1 }, coachOk: true, isCoach: true } }
];
function freshMe() { return { cid: null, profile: null, plan: null, meal: null, sessions: [], food: {}, body: [], habits: {}, checkins: [], coach: null }; }

T.check('fresh device gets everything back from the server', function () {
  var me = freshMe(), ik = null, ls = {};
  var ch = M.mergeOwn(me, server, {}, { getIntakes: function () { return ik; }, setIntakes: function (a) { ik = a; }, lsGet: function (k) { return k in ls ? ls[k] : null; }, lsSet: function (k, v) { ls[k] = v; } });
  assert.strictEqual(me.food['2026-11-14'][0].id, 'a'); assert.strictEqual(me.sessions.length, 2); assert.strictEqual(me.body.length, 1);
  assert.strictEqual(me.checkins.length, 1); assert.strictEqual(me.photoLog.length, 1); assert.strictEqual(me.profile.name, 'Esther');
  assert.strictEqual(me.water['2026-11-14'], 1500); assert.ok(me.habits['2026-11-14'].water); assert.strictEqual(ik[0].id, 'ik1');
  assert.strictEqual(ls['fbg.sp'], '120'); assert.ok(!('evil.key' in ls), 'only fbg.* localStorage keys'); assert.strictEqual(me.game.lvl, 3);
  assert.deepStrictEqual(me.sports, ['run']); assert.ok(!me.pw && !me.cloudPh && !me.coachOk && !me.isCoach, 'device-only and coach keys never copied');
  assert.ok(ch.indexOf('food') !== -1 && ch.indexOf('sessions') !== -1);
});
T.check('a meal logged on the new phone before sync is kept AND the history comes back', function () {
  var me = freshMe(); me.food['2026-11-16'] = [{ id: 'new', name: 'Ei' }]; me.food['2026-11-15'] = [{ id: 'c', name: 'Kip' }];
  M.mergeOwn(me, server, {});
  assert.deepStrictEqual(Object.keys(me.food).sort(), ['2026-11-14', '2026-11-15', '2026-11-16']);
  assert.deepStrictEqual(me.food['2026-11-15'].map(function (x) { return x.id; }).sort(), ['b', 'c']);
});
T.check('local data always wins on the same item; nothing local is removed', function () {
  var me = freshMe(); me.sessions = [{ id: 's1', date: '2026-11-10', endedAt: 1, title: 'mine' }, { id: 's9', date: '2026-11-16', endedAt: 9 }];
  me.profile = { name: 'Esther R', goal: 'build' }; me.water = { '2026-11-14': 500 };
  M.mergeOwn(me, server, {});
  assert.strictEqual(me.sessions.length, 3); assert.strictEqual(me.sessions.filter(function (x) { return x.id === 's1'; })[0].title, 'mine');
  assert.strictEqual(me.profile.name, 'Esther R'); assert.strictEqual(me.profile.goal, 'build'); assert.strictEqual(me.profile.height, 165);
  assert.strictEqual(me.water['2026-11-14'], 500);
  assert.deepStrictEqual(me.sessions.map(function (x) { return x.id; }), ['s1', 's2', 's9'], 'sorted by time');
});
T.check('rows this phone pushed itself are skipped, so a local delete stays deleted', function () {
  var me = freshMe(); me.sessions = [{ id: 's1', date: '2026-11-10', endedAt: 1 }]; // s2 was deleted here and pushed
  var ch = M.mergeOwn(me, server, { sessions: '2026-11-15T10:00:00.000Z' });
  assert.strictEqual(me.sessions.length, 1); assert.ok(ch.indexOf('sessions') === -1);
  M.mergeOwn(me, server, { sessions: '2026-11-15T09:00:00.000Z' }); // newer on server = another device -> merged
  assert.strictEqual(me.sessions.length, 2);
});
T.check('empty or missing server rows change nothing', function () {
  var me = freshMe(); me.food = { '2026-11-16': [{ id: 'x' }] };
  var ch = M.mergeOwn(me, [{ kind: 'food', data: {} }, { kind: 'sessions', data: null }, null], {});
  assert.deepStrictEqual(ch, []); assert.strictEqual(Object.keys(me.food).length, 1);
});
T.check('blank() recognises empty kinds (never pushed over server data)', function () {
  assert.ok(M.blank('food', {})); assert.ok(M.blank('sessions', [])); assert.ok(M.blank('checkins', { list: [], summary: { a: 1 }, photoLog: [] }));
  assert.ok(M.blank('game', { ls: {}, game: null })); assert.ok(M.blank('photoGone', { v: 2, ids: {} }));
  assert.ok(!M.blank('food', { '2026-11-16': [] })); assert.ok(!M.blank('checkins', { list: ['x'], photoLog: [] }));
});
T.check('cloud.js: nothing is pushed before our own rows were read and merged', function () {
  var src = require('fs').readFileSync(path.join(__dirname, '..', 'js', 'cloud.js'), 'utf8');
  var a = src.indexOf('function push(now)'), b = src.indexOf('timer = setTimeout', a);
  assert.ok(/restored !== myClient\.id/.test(src.slice(a, b)), 'push waits for restoreOwn');
  assert.ok(/srvFull\[k\] && M\.blank/.test(src), 'empty kinds are never sent over server data');
});
T.done('sync-merge');
T.check('server nets are in the repo (keep_nonempty trigger, intake_drop)', function () {
  var fs = require('fs'), a = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'keep_nonempty.sql'), 'utf8'), b = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'intake_drop.sql'), 'utf8');
  assert.ok(/before update on public\.client_data/.test(a) && /new\.data := old\.data/.test(a));
  assert.ok(/invite_token/.test(b) && /status in \('active', 'pending'\)/.test(b) && /grant execute .* to anon/.test(b));
});
T.done('sync-merge (server)');
