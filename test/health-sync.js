'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');
var root = path.resolve(__dirname, '..');

var saves = 0, posts = [];
var sandbox = {
  console: console,
  setInterval: function () { return 0; },
  setTimeout: function (fn) { if (typeof fn === 'function') fn(); return 0; },
  clearTimeout: function () {},
  clearInterval: function () {},
  document: {
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {}
  },
  location: { href: 'https://example.com/forged-by-grace/', search: '', hash: '', pathname: '/forged-by-grace/' },
  history: { replaceState: function () {} },
  navigator: { sendBeacon: function () { return true; } },
  fetch: function (url, opts) {
    posts.push({ url: url, body: opts && opts.body, keepalive: !!(opts && opts.keepalive) });
    return Promise.resolve({ ok: true });
  },
  Blob: function (parts, opts) { this.parts = parts; this.type = opts && opts.type; },
  URL: URL,
  URLSearchParams: URLSearchParams,
  Promise: Promise
};
sandbox.window = sandbox;
sandbox.window.FBG_I18N = { nl: { steps: 'stappen' } };
sandbox.window.App = {
  S: { lang: 'nl', role: 'athlete', me: { health: { days: {}, last: null, sources: {} }, sessions: [], body: [], profile: {}, stepGoal: 10000 } },
  esc: function (s) { return String(s == null ? '' : s); },
  t: function (s) { return s; },
  I: { check: '✓', sparkle: '*', heart: 'h', train: 't', file: 'f', back: '<' },
  acts: {},
  views: { health: function () { return ''; }, more: function () { return ''; }, client: function () { return ''; } },
  F: {
    isoDate: function () { return '2026-11-11'; },
    parseISO: function (s) { return new Date(s + 'T12:00:00'); },
    fmtDate: function () { return ''; },
    fmtDay: function (d) { return d; },
    uid: function () { return 'uid' }
  },
  toast: function () {},
  save: function () { saves++; },
  rerender: function () {},
  route: function () {},
  today: function () { return '2026-11-11'; },
  isoAdd: function (iso, n) {
    var d = new Date(iso + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  },
  num: function (v) { var n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : 0; },
  r1: function (n) { return Math.round(n * 10) / 10; },
  stepGoal: function () { return 10000; },
  barChart: function () { return ''; },
  cloud: { user: function () { return null; }, sb: null, state: function () { return {}; } }
};
sandbox.App = sandbox.window.App;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/health.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/steps.js'), 'utf8'), sandbox);
var App = sandbox.window.App;
var S = App.S;

var failed = 0, passed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log('ok  ' + name); }
  catch (e) { failed++; console.error('fail  ' + name + '\n  ' + (e && e.message || e)); }
}
function acheck(name, fn) {
  return Promise.resolve().then(fn).then(function () { passed++; console.log('ok  ' + name); })
    .catch(function (e) { failed++; console.error('fail  ' + name + '\n  ' + (e && e.message || e)); });
}

var TOK = 'fbgh_TESTTOKEN0123456789abcdef9999xxxx';

check('parses a normal shortcut URL with steps and key', function () {
  var r = App.parseHealthQuery('https://aisihom.github.io/forged-by-grace/?steps=8412&k=' + TOK);
  assert.strictEqual(r.x.steps, 8412);
  assert.strictEqual(r.tok, TOK);
  assert.strictEqual(r.d, '2026-11-11');
});

check('parses iOS-encoded %26k%3D after a Magic Variable', function () {
  var r = App.parseHealthQuery('https://aisihom.github.io/forged-by-grace/?steps=1572%26k%3D' + TOK);
  assert.strictEqual(r.x.steps, 1572);
  assert.strictEqual(r.tok, TOK);
});

check('extracts the key from a hash-style #health link', function () {
  var r = App.parseHealthQuery('#health?d=2026-11-10&steps=9.321&k=' + TOK);
  assert.strictEqual(r.d, '2026-11-10');
  assert.strictEqual(r.x.steps, 9321);
  assert.strictEqual(r.tok, TOK);
});

check('mergeHealth keeps the max step count and does not lower it', function () {
  S.me.health = { days: { '2026-11-10': { steps: 5000 } }, last: null, sources: {} };
  saves = 0;
  App.mergeHealth({ '2026-11-10': { steps: 12000 } }, [], 'Shortcut');
  assert.strictEqual(S.me.health.days['2026-11-10'].steps, 12000);
  App.mergeHealth({ '2026-11-10': { steps: 8000 } }, [], 'Shortcut');
  assert.strictEqual(S.me.health.days['2026-11-10'].steps, 12000);
});

check('unchanged merge does not save again', function () {
  var before = saves;
  var last = S.me.health.last;
  App.mergeHealth({ '2026-11-10': { steps: 12000 } }, [], 'Shortcut');
  assert.strictEqual(S.me.health.days['2026-11-10'].steps, 12000);
  assert.strictEqual(saves, before);
  assert.strictEqual(S.me.health.last, last);
});

check('manual extras and estSteps stay apart and are not double-counted', function () {
  S.me.health = { days: { '2026-11-10': { steps: 3500, man: 200 } }, last: null, sources: {} };
  S.me.sessions = [{ id: 's1', date: '2026-11-10', title: 'MMA', type: 'sport', estSteps: 10800 }];
  App.mergeHealth({ '2026-11-10': { steps: 5000 } }, [], 'Shortcut');
  var x = App.stepsOf('2026-11-10');
  assert.strictEqual(x.sync, 5000);
  assert.strictEqual(x.man, 200);
  assert.strictEqual(x.estSum, 10800);
  assert.strictEqual(x.total, 5000 + 200 + 10800);
  assert.strictEqual(S.me.sessions[0].estSteps, 10800);
});

check('placeholder man is cleared when first watch steps are >= man', function () {
  S.me.health = { days: { '2026-11-09': { man: 6000 } }, last: null, sources: {} };
  S.me.sessions = [];
  App.mergeHealth({ '2026-11-09': { steps: 8000 } }, [], 'Shortcut');
  var x = App.stepsOf('2026-11-09');
  assert.strictEqual(x.sync, 8000);
  assert.strictEqual(x.man, 0);
  assert.strictEqual(x.total, 8000);
});

check('index.html boot script posts to health_push before the app loads', function () {
  var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(html.indexOf('rpc/health_push') !== -1);
  assert.ok(html.indexOf('keepalive:true') !== -1);
  assert.ok(html.indexOf('sendBeacon') !== -1);
  var idxBoot = html.indexOf('rpc/health_push');
  var idxApp = html.indexOf('js/core.js');
  assert.ok(idxBoot !== -1 && idxApp !== -1 && idxBoot < idxApp);
});

acheck('postHealthPush uses keepalive and does not put the key in the query string', function () {
  posts = [];
  return App.postHealthPush(TOK, 'd=2026-11-10&steps=111').then(function (ok) {
    assert.strictEqual(ok, true);
    assert.ok(posts.length >= 1);
    assert.strictEqual(posts[0].keepalive, true);
    var body = JSON.parse(posts[0].body);
    assert.strictEqual(body.p_token, TOK);
    assert.ok(body.p_q.indexOf('steps=111') !== -1);
    assert.ok(String(posts[0].url).indexOf(TOK) === -1);
  });
}).then(function () {
  return acheck('service worker parser posts encoded shortcut URLs', function () {
    var swSrc = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    var swPosts = [];
    var sw = {
      Promise: Promise,
      URL: URL,
      URLSearchParams: URLSearchParams,
      addEventListener: function () {},
      fetch: function (url, opts) {
        swPosts.push({ url: url, body: opts && opts.body, keepalive: !!(opts && opts.keepalive) });
        return Promise.resolve({ ok: true });
      },
      caches: {
        open: function () { return Promise.resolve({ addAll: function () { return Promise.resolve(); }, put: function () { return Promise.resolve(); }, match: function () { return Promise.resolve(null); } }); },
        keys: function () { return Promise.resolve([]); }
      },
      location: { origin: 'https://aisihom.github.io' }
    };
    sw.self = sw;
    vm.createContext(sw);
    vm.runInContext(swSrc, sw);
    assert.strictEqual(typeof sw.swHealthPush, 'function');
    return sw.swHealthPush('https://aisihom.github.io/forged-by-grace/?steps=1572%26k%3D' + TOK).then(function () {
      assert.strictEqual(swPosts.length, 1);
      var body = JSON.parse(swPosts[0].body);
      assert.strictEqual(body.p_token, TOK);
      assert.ok(body.p_q.indexOf('steps=1572') !== -1);
      assert.strictEqual(swPosts[0].keepalive, true);
    });
  });
}).then(function () {
  console.log(passed + ' of ' + (passed + failed) + ' tests passed');
  if (failed) process.exit(1);
});

