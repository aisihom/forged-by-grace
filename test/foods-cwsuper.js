'use strict';
// Curaçao supermarket products: present once, searchable by product and store, consistent macros, filter works.
var fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
var root = path.resolve(__dirname, '..');
var sandbox = { console: console, window: null };
sandbox.window = sandbox; sandbox.FBG_FOODS = null;
vm.createContext(sandbox);
['js/foods.js', 'js/foods-db.js', 'js/foods-caribbean.js', 'js/foods-kippie.js', 'js/foods-rasabaru.js', 'js/foods-bokadushi.js'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox);
});
var before = sandbox.window.FBG_FOODS.FOODS.length;
var src = fs.readFileSync(path.join(root, 'js/foods-cwsuper.js'), 'utf8');
vm.runInContext(src, sandbox); vm.runInContext(src, sandbox);
var FD = sandbox.window.FBG_FOODS;
var failed = 0, passed = 0;
function check(name, fn) { try { fn(); passed++; console.log('ok  ' + name); } catch (e) { failed++; console.error('fail  ' + name + '\n  ' + (e && e.message || e)); } }
function norm(x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function hay(f) { return norm(f.en + ' ' + f.nl + ' ' + (f.al || '') + ' ' + (f.brand || '') + ' ' + (f.rgName || '') + ' ' + (f.rg || '') + ' ' + ((FD.REGIONS && FD.REGIONS[f.rg]) || '')); }
function search(q) { var t = norm(q).trim().split(/\s+/); return FD.FOODS.filter(function (f) { var h = hay(f); return t.every(function (x) { return h.indexOf(x) !== -1; }); }); }
function ids(l) { return l.map(function (f) { return f.id; }); }
var cs = FD.FOODS.filter(function (f) { return /^cs-/.test(f.id); });

check('35 cs- items added once, unique ids', function () {
  assert.strictEqual(cs.length, 35, 'got ' + cs.length);
  assert.strictEqual(FD.FOODS.length, before + 35);
  var seen = {}; FD.FOODS.forEach(function (f) { if (seen[f.id]) throw new Error('dup ' + f.id); seen[f.id] = 1; });
});
check('all estimates, complete fields, known stores, Curaçao supermarket region', function () {
  cs.forEach(function (f) {
    assert.ok(/schatting\)$/.test(f.nl) && /estimate\)$/.test(f.en), f.id + ' label');
    assert.ok(/^Schatting/.test(f.src), f.id);
    assert.strictEqual(f.rg, 'cwsuper'); assert.ok(f.brand, f.id + ' brand');
    assert.ok(FD.CATS[f.cat], f.id + ' cat ' + f.cat);
    assert.ok(f.g > 0 && f.portion, f.id);
    String(f.stores).split(' ').forEach(function (s) { assert.ok(FD.CW_STORES[s], f.id + ' store ' + s); });
  });
});
check('macros consistent (kcal ≈ 4P+4C+9F within 5%; alcohol drinks above that)', function () {
  cs.forEach(function (f) {
    var calc = 4 * f.p + 4 * f.c + 9 * f.f;
    if (/amstel|blue-curacao/.test(f.id)) assert.ok(f.kcal > calc, f.id);
    else assert.ok(Math.abs(calc - f.kcal) <= Math.max(1, 0.05 * f.kcal), f.id + ' ' + f.kcal + ' vs ' + calc);
    assert.ok(f.p + f.c + f.f + f.fib <= 100.5, f.id);
  });
});
check('every store name finds products', function () {
  var need = { esperamos: 4, 'bon bini': 4, mangusa: 15, centrum: 6, 'van den tweel': 4, goisco: 10, 'best buy': 4, vreugdenhil: 3 };
  Object.keys(need).forEach(function (q) {
    var n = search(q).filter(function (f) { return /^cs-/.test(f.id); }).length;
    assert.ok(n >= need[q], q + ' only ' + n);
  });
  assert.ok(ids(search('mangusa malta')).indexOf('cs-regional-malta') !== -1);
  assert.ok(ids(search('esperamos pastechi')).indexOf('lat-pastechi-keshi') !== -1, 'existing pastechi not tagged');
  assert.ok(ids(search('bon bini pan dushi')).indexOf('lat-pan-dushi') !== -1);
});
check('searchable by product name', function () {
  var Q = { 'amstel bright': 'cs-amstel-bright', 'harina pan': 'cs-harina-pan', 'funchi fresku': 'cs-funchi-fresku', 'pan di maishi': 'cs-pan-di-maishi',
    'saltin': 'cs-noel-saltin', 'peter pan': 'cs-peter-pan-pb', 'chicken melt': 'cs-vdt-chicken-melt', 'cordon bleu': 'cs-centrum-cordon-bleu',
    'kabritu korta': 'cs-centrum-kabritu-korta', 'blue curacao': 'cs-blue-curacao', 'power malt': 'cs-power-malt', 'magdalenas': 'cs-dulcesol-magdalenas' };
  Object.keys(Q).forEach(function (q) { assert.ok(ids(search(q)).indexOf(Q[q]) !== -1, q); });
});
check('no new item duplicates an existing generic item name', function () {
  var old = {}; FD.FOODS.forEach(function (f) { if (!/^cs-/.test(f.id)) old[norm(f.nl).replace(/\s*\(.*$/, '')] = f.id; });
  cs.forEach(function (f) { var k = norm(f.nl).replace(/\s*\(.*$/, ''); assert.ok(!old[k], f.id + ' duplicates ' + old[k]); });
});
check('"Curaçao supermarkten" filter exists and is a shop filter (not in Latin America "all")', function () {
  var row = FD.REGION_FILTERS.filter(function (r) { return r[0] === 'cwsuper'; })[0];
  assert.ok(row && row[2].indexOf('cwsuper') !== -1);
  assert.ok(FD.BRAND_RG.cwsuper);
  assert.ok(/foods-cwsuper\.js/.test(fs.readFileSync(path.join(root, 'index.html'), 'utf8')));
  assert.ok(/foods-cwsuper\.js/.test(fs.readFileSync(path.join(root, 'sw.js'), 'utf8')));
});
console.log(passed + ' passed, ' + failed + ' failed, ' + cs.length + ' supermarket items, DB ' + FD.FOODS.length);
if (failed) process.exit(1);
