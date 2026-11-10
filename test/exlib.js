'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');
var root = path.resolve(__dirname, '..');

var sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), sandbox);
var before = sandbox.FBG_DATA.EXERCISES.map(function (e) { return { id: e.id, name: e.name, muscle: e.muscle, pattern: e.pattern }; });
vm.runInContext(fs.readFileSync(path.join(root, 'js/exextra.js'), 'utf8'), sandbox);
var D = sandbox.FBG_DATA;
var E = D.EXERCISES;

var failed = 0, passed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log('ok  ' + name); }
  catch (e) { failed++; console.error('fail  ' + name + '\n  ' + (e && e.message || e)); }
}

check('at least 250 exercises', function () {
  assert.ok(E.length >= 250, 'only ' + E.length);
});

check('original 77 ids and names unchanged', function () {
  assert.strictEqual(before.length, 77);
  before.forEach(function (o) {
    var e = D.BY_ID[o.id];
    assert.ok(e, 'missing ' + o.id);
    assert.strictEqual(e.name, o.name, 'renamed ' + o.id);
    assert.strictEqual(e.muscle, o.muscle, 'muscle changed ' + o.id);
    assert.strictEqual(e.pattern, o.pattern, 'pattern changed ' + o.id);
  });
});

check('all ids unique and BY_ID complete', function () {
  var seen = {};
  E.forEach(function (e) {
    assert.ok(e.id, 'empty id');
    assert.ok(!seen[e.id], 'duplicate ' + e.id);
    seen[e.id] = 1;
    assert.strictEqual(D.BY_ID[e.id], e);
  });
  assert.strictEqual(Object.keys(D.BY_ID).length, E.length);
});

check('required fields on every exercise', function () {
  var tracks = { weight: 1, reps: 1, time: 1, min: 1 };
  var kinds = { compound: 1, isolation: 1, core: 1, conditioning: 1 };
  var levels = { beginner: 1, intermediate: 1, advanced: 1 };
  E.forEach(function (e) {
    assert.ok(e.name, e.id + ' name');
    assert.ok(e.muscle, e.id + ' muscle');
    assert.ok(e.pattern, e.id + ' pattern');
    assert.ok(Array.isArray(e.equip) && e.equip.length, e.id + ' equip');
    assert.ok(kinds[e.kind], e.id + ' kind ' + e.kind);
    assert.ok(tracks[e.track], e.id + ' track ' + e.track);
    assert.ok(Array.isArray(e.cues) && e.cues.length, e.id + ' cues');
    assert.ok(e.mistake, e.id + ' mistake');
    assert.ok(levels[e.level], e.id + ' level ' + e.level);
    assert.ok(e.cue, e.id + ' cue');
    assert.ok(D.GROUP_OF[e.muscle], e.id + ' unmapped muscle ' + e.muscle);
  });
});

check('coverage per body part', function () {
  var min = {
    chest: 20, back: 20, shoulders: 12, 'rear-delts': 6,
    biceps: 10, triceps: 10, forearms: 6,
    quads: 20, hamstrings: 12, glutes: 15, calves: 6, adductors: 6,
    core: 20, 'lower-back': 5, conditioning: 12
  };
  var counts = {};
  E.forEach(function (e) { var g = D.groupOf(e); counts[g] = (counts[g] || 0) + 1; });
  Object.keys(min).forEach(function (g) {
    assert.ok((counts[g] || 0) >= min[g], g + ' has ' + (counts[g] || 0) + ', need ' + min[g]);
  });
});

check('addExercises does not overwrite existing ids or names', function () {
  var name = D.BY_ID['bench-press'].name;
  D.addExercises([{ id: 'bench-press', name: 'SHOULD NOT REPLACE', muscle: 'Chest', pattern: 'hpush', equip: ['barbell'], kind: 'compound', track: 'weight', cues: ['x'], mistake: 'x' }]);
  assert.strictEqual(D.BY_ID['bench-press'].name, name);
  var n = E.length;
  D.addExercises([{ id: '__tmp_ex__', name: 'Tmp', muscle: 'Chest', pattern: 'hpush', equip: ['dumbbell'], kind: 'isolation', track: 'reps', cues: ['c'], mistake: 'm', level: 'beginner', cue: 'c' }]);
  assert.strictEqual(E.length, n + 1);
  assert.ok(D.BY_ID['__tmp_ex__']);
  E.pop();
  delete D.BY_ID['__tmp_ex__'];
});

check('groupOf maps related muscles together', function () {
  assert.strictEqual(D.groupOf(D.BY_ID['bench-press']), 'chest');
  assert.strictEqual(D.groupOf(D.BY_ID['incline-db-press']), 'chest');
  assert.strictEqual(D.groupOf(D.BY_ID['incline-bench-press']), 'chest');
  assert.strictEqual(D.groupOf(D.BY_ID['face-pull']), 'rear-delts');
  assert.strictEqual(D.groupOf(D.BY_ID['back-squat']), 'quads');
  assert.strictEqual(D.groupOf(D.BY_ID['romanian-deadlift']), 'hamstrings');
  assert.strictEqual(D.groupOf(D.BY_ID['deadlift']), 'full-body');
  assert.strictEqual(D.groupOf(D.BY_ID['wrist-curl']), 'forearms');
  assert.strictEqual(D.groupOf(D.BY_ID['superman-hold']), 'lower-back');
});

check('searchBlob finds Dutch names and cues', function () {
  var fly = D.BY_ID['cable-fly'];
  assert.ok(D.searchBlob(fly).indexOf('kabel fly') !== -1);
  var squat = D.BY_ID['back-squat'];
  assert.ok(D.searchBlob(squat).indexOf('bovenrug') !== -1 || D.searchBlob(squat).indexOf('heupen') !== -1);
});

check('alternatives for bench press are mostly chest / same pattern', function () {
  var cur = D.BY_ID['bench-press'];
  var alts = E.filter(function (e) { return e.id !== cur.id && D.groupOf(e) === D.groupOf(cur); });
  assert.ok(alts.length >= 15, 'chest alts ' + alts.length);
  var samePat = alts.filter(function (e) { return e.pattern === cur.pattern; });
  assert.ok(samePat.length >= 8, 'hpush alts ' + samePat.length);
  assert.ok(alts.some(function (e) { return e.id === 'db-bench-press'; }));
  assert.ok(alts.some(function (e) { return e.id === 'incline-bench-press'; }));
});

check('slots still resolve to existing exercises', function () {
  Object.keys(D.SLOTS).forEach(function (slot) {
    D.SLOTS[slot].forEach(function (id) {
      assert.ok(D.BY_ID[id], 'slot ' + slot + ' missing ' + id);
    });
    assert.ok(D.BY_ID[D.SLOTS[slot][0]], 'empty slot ' + slot);
  });
});

check('gym mode includes smith, new smith exercises are allowed', function () {
  assert.ok(D.MODES.gym.equip.indexOf('smith') !== -1);
  var smith = E.filter(function (e) { return e.equip.indexOf('smith') !== -1; });
  assert.ok(smith.length >= 6, 'smith variants ' + smith.length);
  smith.forEach(function (e) {
    assert.ok(e.equip.some(function (q) { return D.MODES.gym.equip.indexOf(q) !== -1; }), e.id + ' not in gym mode');
  });
});

check('GROUP_CHIPS match groupOf keys in use', function () {
  var keys = D.GROUP_CHIPS.map(function (c) { return c[0]; });
  var used = {};
  E.forEach(function (e) { used[D.groupOf(e)] = 1; });
  Object.keys(used).forEach(function (g) {
    assert.ok(keys.indexOf(g) !== -1, 'chip missing for ' + g);
  });
});

console.log(passed + ' passed, ' + failed + ' failed, total ' + E.length + ' exercises');
process.exit(failed ? 1 : 0);
