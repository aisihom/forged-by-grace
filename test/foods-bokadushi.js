'use strict';
// Curaçao "kos di boka dushi": items exist, are searchable, have sane & consistent macros.
var fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
var root = path.resolve(__dirname, '..');
var sandbox = { console: console, window: null };
sandbox.window = sandbox; sandbox.FBG_FOODS = null;
vm.createContext(sandbox);
['js/foods.js', 'js/foods-db.js', 'js/foods-caribbean.js', 'js/foods-kippie.js', 'js/foods-rasabaru.js'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox);
});
var before = sandbox.window.FBG_FOODS.FOODS.length;
var src = fs.readFileSync(path.join(root, 'js/foods-bokadushi.js'), 'utf8');
vm.runInContext(src, sandbox);
vm.runInContext(src, sandbox); // loading twice must not duplicate anything
var FD = sandbox.window.FBG_FOODS;
var failed = 0, passed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log('ok  ' + name); }
  catch (e) { failed++; console.error('fail  ' + name + '\n  ' + (e && e.message || e)); }
}
function norm(x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function hay(f) { return norm(f.en + ' ' + f.nl + ' ' + (f.al || '') + ' ' + (f.brand || '') + ' ' + (f.rgName || '') + ' ' + (f.rg || '') + ' ' + ((FD.REGIONS && FD.REGIONS[f.rg]) || '')); }
function search(q) {
  var toks = norm(q).trim().split(/\s+/).filter(Boolean);
  return FD.FOODS.filter(function (f) { var h = hay(f); return toks.every(function (t) { return h.indexOf(t) !== -1; }); });
}
function ids(list) { return list.map(function (f) { return f.id; }); }
var bd = FD.FOODS.filter(function (f) { return String(f.id).indexOf('bd-') === 0; });
var NEW = ['bd-leter-di-pinda', 'bd-koi-lechi', 'bd-koi-lechi-kayente', 'bd-panseiku', 'bd-tentalaria-kashupete', 'bd-kakina',
  'bd-djente-kacho', 'bd-zjozjoli', 'bd-sunchi', 'bd-chupabebe', 'bd-dushi-tamarein', 'bd-tert-di-pruimu', 'bd-bolo-di-kashupete',
  'bd-bolo-di-pinda', 'bd-bolo-di-pistachi', 'bd-pan-bolo', 'bd-bolo-di-maishi', 'bd-bolo-di-banana', 'bd-pandushi-kokolishi', 'bd-konfita-papaya'];
var OLD = ['lat-kokada', 'lat-tentalaria', 'lat-tenten', 'lat-kesio', 'lat-bolo-pretu', 'lat-pan-dushi'];

check('20 new bd- items, added once, no duplicate ids', function () {
  assert.strictEqual(bd.length, NEW.length, 'got ' + bd.length);
  NEW.forEach(function (id) { assert.ok(FD.BY_ID[id], 'missing ' + id); });
  assert.strictEqual(FD.FOODS.length, before + NEW.length);
  var seen = {};
  FD.FOODS.forEach(function (f) { if (seen[f.id]) throw new Error('duplicate id ' + f.id); seen[f.id] = 1; });
});
check('all new items are estimates, Curaçao region, snack category, complete fields', function () {
  bd.forEach(function (f) {
    assert.ok(/\(.*schatting\)$/.test(f.nl), f.id + ' nl label');
    assert.ok(/\(.*estimate\)$/.test(f.en), f.id + ' en label');
    assert.ok(/^Schatting/.test(f.src), f.id + ' src');
    assert.strictEqual(f.rg, 'cw'); assert.strictEqual(f.rgName, 'Curaçao'); assert.strictEqual(f.cat, 'snack');
    assert.ok(f.g > 0 && f.g <= 150 && f.portion, f.id + ' portion');
    ['kcal', 'p', 'c', 'f', 'fib'].forEach(function (k) { assert.ok(typeof f[k] === 'number' && f[k] >= 0, f.id + ' ' + k); });
  });
});
check('macros consistent: kcal ≈ 4P+4C+9F within 5% (new items and patched tentalaria)', function () {
  bd.concat([FD.BY_ID['lat-tentalaria']]).forEach(function (f) {
    var calc = 4 * f.p + 4 * f.c + 9 * f.f;
    assert.ok(Math.abs(calc - f.kcal) / f.kcal <= 0.05, f.id + ' kcal ' + f.kcal + ' vs ' + calc);
    assert.ok(f.p + f.c + f.f + f.fib <= 100, f.id + ' > 100 g per 100 g');
    assert.ok(f.kcal >= 200 && f.kcal <= 560, f.id + ' kcal/100 g out of range ' + f.kcal);
  });
});
check('"boka dushi", "kos di boka dushi", "dushi" find every new and existing sweet', function () {
  ['boka dushi', 'kos di boka dushi', 'dushi', 'ko\'i dushi', 'koi dushi'].forEach(function (q) {
    var hit = ids(search(q));
    NEW.concat(OLD).forEach(function (id) { assert.ok(hit.indexOf(id) !== -1, q + ' misses ' + id); });
  });
  var hit = ids(search('boka dushi'));
  hit.forEach(function (id) { assert.ok(/^bd-/.test(id) || OLD.indexOf(id) !== -1, 'unexpected boka dushi hit ' + id); });
});
check('searchable by Papiamentu names and alternative spellings', function () {
  var Q = { 'leter di pinda': 'bd-leter-di-pinda', 'letter di pinda': 'bd-leter-di-pinda', 'kos di lechi': 'bd-koi-lechi',
    'koi lechi': 'bd-koi-lechi', "ko'i lechi": 'bd-koi-lechi', 'panseiku': 'bd-panseiku', 'tentalaria': 'lat-tentalaria',
    'tentalaria kashupete': 'bd-tentalaria-kashupete', 'kakina': 'bd-kakina', 'kakiña': 'bd-kakina', 'djente kacho': 'bd-djente-kacho',
    'zjozjoli': 'bd-zjozjoli', 'sunchi': 'bd-sunchi', 'chupabebe': 'bd-chupabebe', 'tamarein': 'bd-dushi-tamarein',
    'bolita di tamarein': 'bd-dushi-tamarein', 'tert di pruimu': 'bd-tert-di-pruimu', 'bolo di kashupete': 'bd-bolo-di-kashupete',
    'pudin di pan': 'bd-pan-bolo', 'pan bolo': 'bd-pan-bolo', 'bolo di maishi': 'bd-bolo-di-maishi', 'kokolishi': 'bd-pandushi-kokolishi',
    'dushi di papaya': 'bd-konfita-papaya', 'kokada': 'lat-kokada', 'kos di koko': 'lat-kokada', 'kesio': 'lat-kesio' };
  Object.keys(Q).forEach(function (q) { assert.ok(ids(search(q)).indexOf(Q[q]) !== -1, q + ' -> ' + Q[q]); });
});
check('tentalaria fixed to peanut marzipan; existing items kept, no duplicates of them', function () {
  var t = FD.BY_ID['lat-tentalaria'];
  assert.ok(/pinda/i.test(t.nl) && !/kokos/i.test(t.al), 'tentalaria still coconut');
  assert.strictEqual(t.kcal, 505);
  OLD.forEach(function (id) { assert.ok(FD.BY_ID[id], 'missing ' + id); });
  ['kokada', 'kesio', 'bolo pretu'].forEach(function (n) {
    var dup = bd.filter(function (f) { return norm(f.nl).indexOf(n) === 0; });
    assert.strictEqual(dup.length, 0, 'duplicate of ' + n);
  });
});
check('Curaçao region filter includes the new items', function () {
  var row = FD.REGION_FILTERS.filter(function (r) { return r[0] === 'cw'; })[0];
  bd.forEach(function (f) { assert.ok(row[2].indexOf(f.rg) !== -1, f.id); });
});
check('wired into index.html, service worker and data check', function () {
  assert.ok(/js\/foods-bokadushi\.js/.test(fs.readFileSync(path.join(root, 'index.html'), 'utf8')));
  assert.ok(/foods-bokadushi\.js/.test(fs.readFileSync(path.join(root, 'sw.js'), 'utf8')));
});

console.log(passed + ' passed, ' + failed + ' failed, ' + bd.length + ' boka dushi items, DB ' + FD.FOODS.length);
if (failed) process.exit(1);
