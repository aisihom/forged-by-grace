'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');
var root = path.resolve(__dirname, '..');

var sandbox = {
  console: console,
  setInterval: function () { return 0; },
  setTimeout: function (fn) { if (typeof fn === 'function') fn(); return 0; },
  clearTimeout: function () {},
  document: {
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {}
  },
  location: { hash: '' }
};
sandbox.window = sandbox;
sandbox.window.FBG_I18N = { nl: { steps: 'stappen', Light: 'Licht', Intense: 'Intensief', Medium: 'Gemiddeld' } };
sandbox.window.App = {
  S: { lang: 'nl', role: 'client', me: { health: { days: {} }, sessions: [], stepGoal: 8000, profile: {} } },
  esc: function (s) { return String(s == null ? '' : s); },
  t: function (s, vars) {
    var L = sandbox.window.FBG_I18N.nl;
    var out = (L && L[s]) || s;
    if (vars) Object.keys(vars).forEach(function (k) { out = out.split('{' + k + '}').join(vars[k]); });
    return out;
  },
  I: { trash: '🗑', edit: '✎', check: '✓', heart: '♥', plus: '+' },
  acts: {},
  views: {
    today: function () { return '<div class="hero"></div>'; },
    plan: function () { return ''; },
    health: function () { return '<div class="grid3"></div>'; },
    progress: function () { return ''; },
    more: function () { return ''; }
  },
  F: { isoDate: function (d) { return '2026-11-10'; }, parseISO: function (s) { return new Date(s + 'T12:00:00'); }, fmtDay: function (d) { return d; }, uid: function () { return 'sid-1'; } },
  toast: function () {},
  save: function () {},
  rerender: function () {},
  today: function () { return '2026-11-10'; },
  isoAdd: function (iso, n) { return '2026-10-11'; },
  num: function (v) { var n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : 0; },
  stepGoal: function () { return 8000; },
  sportLogger: function () { return true; },
  sheet: function () { return { el: { querySelector: function () { return null; }, querySelectorAll: function () { return []; } }, close: function () {} }; },
  sheetHead: function (a, b) { return a + b; }
};
sandbox.App = sandbox.window.App;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/steps.js'), 'utf8'), sandbox);
var App = sandbox.window.App;
var S = App.S;

var failed = 0, passed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log('ok  ' + name); }
  catch (e) { failed++; console.error('fail  ' + name + '\n  ' + (e && e.message || e)); }
}

check('90 min MMA medium is 10800 (≈ 11.000)', function () {
  assert.strictEqual(App.stepLevel(7), 1);
  assert.strictEqual(App.stepSpm('mma', 7), 120);
  assert.strictEqual(App.estSteps('mma', 90, 7), 10800);
});

check('MMA / BJJ / kickboxing / boxing share 90 / 120 / 140', function () {
  ['mma', 'bjj', 'kickboxing', 'boxing'].forEach(function (sp) {
    assert.strictEqual(App.STEP_SPM[sp].join(','), '90,120,140');
    assert.strictEqual(App.estSteps(sp, 90, 3), 8100);
    assert.strictEqual(App.estSteps(sp, 90, 9), 12600);
  });
});

check('cycling matches bike cardio table 130 / 160 / 175', function () {
  assert.strictEqual(App.STEP_SPM.cycling.join(','), '130,160,175');
  assert.strictEqual(App.STEP_SPM.bike.join(','), '130,160,175');
  assert.strictEqual(App.estSteps('cycling', 60, 7), 9600);
  assert.strictEqual(App.estSteps('bike', 20, null, 1), 3200);
});

check('running uses cadence 150 / 165 / 175', function () {
  assert.strictEqual(App.STEP_SPM.running.join(','), '150,165,175');
  assert.strictEqual(App.estSteps('running', 30, 6), 4950);
});

check('RPE bands map to Licht / Medium / Intensief', function () {
  assert.strictEqual(App.stepLevel(1), 0);
  assert.strictEqual(App.stepLevel(4), 0);
  assert.strictEqual(App.stepLevel(5), 1);
  assert.strictEqual(App.stepLevel(7), 1);
  assert.strictEqual(App.stepLevel(8), 2);
  assert.strictEqual(App.stepLevel(10), 2);
  assert.strictEqual(App.stepLevel(), 1);
});

check('stepsOf adds session estSteps on top of synced steps', function () {
  S.me.health = { days: { '2026-11-10': { steps: 2380 } } };
  S.me.sessions = [{ id: 's1', date: '2026-11-10', title: 'MMA', type: 'sport', estSteps: 10800 }];
  var x = App.stepsOf('2026-11-10');
  assert.strictEqual(x.sync, 2380);
  assert.strictEqual(x.estSum, 10800);
  assert.strictEqual(x.total, 13180);
  assert.strictEqual(x.extra, 10800);
});

check('a later Garmin/health_sync max-merge does not overwrite or double-count estSteps', function () {
  var cur = S.me.health.days['2026-11-10'];
  var incoming = 3000;
  cur.steps = Math.max(cur.steps, incoming);
  var x = App.stepsOf('2026-11-10');
  assert.strictEqual(x.sync, 3000);
  assert.strictEqual(S.me.sessions[0].estSteps, 10800);
  assert.strictEqual(x.estSum, 10800);
  assert.strictEqual(x.total, 13800);
});

check('manual extras also survive a steps-only merge', function () {
  S.me.health.days['2026-11-10'].man = 200;
  S.me.health.days['2026-11-10'].steps = 3500;
  var x = App.stepsOf('2026-11-10');
  assert.strictEqual(x.man, 200);
  assert.strictEqual(x.total, 3500 + 200 + 10800);
});

check('deleting the session removes those estimated steps', function () {
  assert.strictEqual(App.removeSession('s1'), true);
  assert.strictEqual(S.me.sessions.length, 0);
  var x = App.stepsOf('2026-11-10');
  assert.strictEqual(x.estSum, 0);
  assert.strictEqual(x.total, 3500 + 200);
});

check('session without the add-to-steps toggle does not change the total', function () {
  S.me.sessions = [{ id: 's2', date: '2026-11-10', title: 'MMA', type: 'sport' }];
  var x = App.stepsOf('2026-11-10');
  assert.strictEqual(x.estSum, 0);
  assert.strictEqual(x.total, 3500 + 200);
});

check('cx cardio and session estimates both count, and unknown sports are 0', function () {
  S.me.sessions = [{ id: 's3', date: '2026-11-10', title: 'MMA', type: 'sport', estSteps: 7200 }];
  S.me.health.days['2026-11-10'].cx = [{ t: 'bike', n: 'Fietsen', min: 20, lvl: 1, v: 3200 }];
  var x = App.stepsOf('2026-11-10');
  assert.strictEqual(x.estSum, 10400);
  assert.strictEqual(x.total, 3500 + 200 + 10400);
  assert.strictEqual(App.estSteps('unknown', 60, 7), 0);
});

console.log(passed + ' of ' + (passed + failed) + ' tests passed');
if (failed) process.exit(1);
