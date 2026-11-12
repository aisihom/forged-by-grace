'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');
var root = path.resolve(__dirname, '..');

var sandbox = { console: console, window: null };
sandbox.window = sandbox;
sandbox.FBG_FOODS = null;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/foods.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/foods-db.js'), 'utf8'), sandbox);
var coreChicken = sandbox.window.FBG_FOODS.BY_ID['chicken-breast'];
vm.runInContext(fs.readFileSync(path.join(root, 'js/foods-caribbean.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/foods-kippie.js'), 'utf8'), sandbox);
var beforeRb = sandbox.window.FBG_FOODS.FOODS.length;
vm.runInContext(fs.readFileSync(path.join(root, 'js/foods-rasabaru.js'), 'utf8'), sandbox);

var FD = sandbox.window.FBG_FOODS;
var failed = 0, passed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log('ok  ' + name); }
  catch (e) { failed++; console.error('fail  ' + name + '\n  ' + (e && e.message || e)); }
}

function norm(x) {
  return String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function hay(f) {
  return norm(f.en + ' ' + f.nl + ' ' + (f.al || '') + ' ' + (f.brand || '') + ' ' + (f.rgName || '') + ' ' + (f.rg || '') + ' ' + ((FD.REGIONS && FD.REGIONS[f.rg]) || ''));
}
function search(q) {
  q = norm(q).trim();
  var toks = q.split(/\s+/).filter(Boolean);
  return FD.FOODS.filter(function (f) {
    var h = hay(f);
    return toks.every(function (t) { return h.indexOf(t) !== -1; });
  });
}
function isShopRg(rg) {
  return rg === 'kippie' || !!(FD.BRAND_RG && FD.BRAND_RG[rg]);
}
function matchReg(f, reg) {
  if (!reg) return true;
  if (reg === 'latam') return !!f.rg && !isShopRg(f.rg);
  var row = (FD.REGION_FILTERS || []).filter(function (r) { return r[0] === reg; })[0];
  var codes = row ? row[2] : reg;
  if (codes === 'CAR') return (FD.CARIBBEAN_RG || []).indexOf(f.rg) !== -1;
  if (codes === '*') return !!f.rg && !isShopRg(f.rg);
  if (Array.isArray(codes)) return codes.indexOf(f.rg) !== -1;
  return f.rg === codes || f.rg === reg;
}
function atG(f, g) {
  var m = g / 100;
  return { kcal: f.kcal * m, p: f.p * m, c: f.c * m, f: f.f * m };
}
function near(a, b, tol, label) {
  if (Math.abs(a - b) > tol) throw new Error(label + ' ' + a + ' vs ' + b);
}

var rb = FD.FOODS.filter(function (f) { return String(f.id || '').indexOf('rb-') === 0; });
var kip = FD.FOODS.filter(function (f) { return String(f.id || '').indexOf('kip-') === 0; });
var lat = FD.FOODS.filter(function (f) { return String(f.id || '').indexOf('lat-') === 0; });

check('core, Caribbean and Kippie foods still present', function () {
  assert.ok(FD.BY_ID['chicken-breast'], 'chicken-breast missing');
  assert.strictEqual(FD.BY_ID['chicken-breast'].kcal, coreChicken.kcal);
  assert.ok(FD.BY_ID['lat-sopi-piska'], 'caribbean item missing');
  assert.ok(FD.BY_ID['kip-pistolet-kip'], 'kippie item missing');
  assert.ok(lat.length >= 400, 'caribbean count ' + lat.length);
  assert.ok(kip.length >= 200, 'kippie count ' + kip.length);
  assert.strictEqual(beforeRb + rb.length, FD.FOODS.length);
});

check('41 Rasa Baru items with unique rb- ids and no collisions', function () {
  assert.strictEqual(rb.length, 41, 'expected 41, got ' + rb.length);
  var ids = {};
  FD.FOODS.forEach(function (f) {
    if (ids[f.id]) throw new Error('duplicate id ' + f.id);
    ids[f.id] = 1;
  });
  rb.forEach(function (f) {
    assert.ok(f.id.indexOf('rb-') === 0, f.id);
  });
});

check('required fields, Rasa Baru brand/tag, and sane macros', function () {
  rb.forEach(function (f) {
    ['id', 'en', 'nl', 'al', 'cat', 'kcal', 'p', 'c', 'f', 'fib', 'g', 'portion', 'src', 'rg', 'rgName', 'brand'].forEach(function (k) {
      if (f[k] == null || f[k] === '') throw new Error(f.id + ' missing ' + k);
      if (['kcal', 'p', 'c', 'f', 'fib', 'g'].indexOf(k) !== -1 && (typeof f[k] !== 'number' || !isFinite(f[k]))) {
        throw new Error(f.id + ' NaN/non-number ' + k + '=' + f[k]);
      }
    });
    assert.strictEqual(f.brand, 'Rasa Baru', f.id);
    assert.strictEqual(f.rg, 'rasabaru', f.id);
    assert.strictEqual(f.rgName, 'Rasa Baru', f.id);
    assert.ok(/rasa baru/i.test(f.al), f.id + ' alias missing rasa baru');
    assert.ok(/schatting/i.test(f.src), f.id + ' src should say schatting');
    if (!(f.g > 0) || f.kcal < 0 || f.p < 0 || f.c < 0 || f.f < 0) throw new Error('bad macros ' + f.id);
    var atw = 4 * f.p + 4 * f.c + 9 * f.f;
    if (f.kcal > 8 && atw > 0) {
      var dev = Math.abs(f.kcal - atw) / Math.max(f.kcal, atw);
      if (dev > 0.25) throw new Error('atwater ' + f.id + ' kcal=' + f.kcal + ' vs ' + atw.toFixed(1));
    }
  });
});

check('search by "rasa baru" and dish names', function () {
  var byBrand = search('rasa baru');
  assert.ok(byBrand.length >= 41, 'search rasa baru ' + byBrand.length);
  assert.ok(byBrand.every(function (f) { return f.brand === 'Rasa Baru' || /rasa baru/i.test(hay(f)); }));
  function first(q, id) {
    var r = search(q);
    assert.ok(r.some(function (f) { return f.id === id; }), q + ' did not find ' + id + ' (got ' + r.slice(0, 8).map(function (f) { return f.id; }).join(', ') + ')');
  }
  first('rasa baru', 'rb-nasi-goreng');
  first('nasi goreng', 'rb-nasi-goreng');
  first('nasi putih', 'rb-nasi-putih');
  first('nasi koening', 'rb-nasi-koening');
  first('bami goreng', 'rb-bami-goreng');
  first('ajam ketjap', 'rb-ajam-ketjap');
  first('daging rendang', 'rb-daging-rendang');
  first('daging semur', 'rb-daging-semur');
  first('sayur broccoli', 'rb-sayur-broccoli');
  first('satesaus', 'rb-satesaus');
  first('serundeng', 'rb-serundeng');
  first('lemper', 'rb-lemper');
  first('gekookt ei', 'rb-gekookt-ei');
  first('aarons bakje', 'rb-bakje-aaron');
  first('bakje', 'rb-bakje-aaron');
});

check('given per-100 g values for key dishes', function () {
  var ng = FD.BY_ID['rb-nasi-goreng'];
  assert.strictEqual(ng.kcal, 180);
  assert.strictEqual(ng.p, 4);
  assert.strictEqual(ng.c, 29);
  assert.strictEqual(ng.f, 6);
  var np = FD.BY_ID['rb-nasi-putih'];
  assert.strictEqual(np.kcal, 130);
  assert.strictEqual(np.p, 2.7);
  assert.strictEqual(np.c, 28.7);
  assert.strictEqual(np.f, 0.3);
  var ds = FD.BY_ID['rb-daging-semur'];
  assert.strictEqual(ds.kcal, 210);
  assert.strictEqual(ds.p, 20);
  assert.strictEqual(ds.c, 9);
  assert.strictEqual(ds.f, 11);
  var sb = FD.BY_ID['rb-sayur-broccoli'];
  assert.strictEqual(sb.kcal, 65);
  assert.strictEqual(sb.p, 3);
  assert.strictEqual(sb.c, 5);
  assert.strictEqual(sb.f, 4);
});

check('gekookt ei is 53 g at 82 kcal / P6.7 / C0.6 / F5.6', function () {
  var egg = FD.BY_ID['rb-gekookt-ei'];
  assert.ok(egg, 'egg missing');
  assert.strictEqual(egg.g, 53);
  var m = atG(egg, 53);
  near(m.kcal, 82, 0.05, 'egg kcal');
  near(m.p, 6.7, 0.02, 'egg p');
  near(m.c, 0.6, 0.02, 'egg c');
  near(m.f, 5.6, 0.02, 'egg f');
});

check("Aaróns bakje macros match 300 g nasi goreng + 200 g sayur broccoli + 300 g daging semur + 1 ei 53 g", function () {
  var box = FD.BY_ID['rb-bakje-aaron'];
  assert.ok(box, 'combo missing');
  assert.strictEqual(box.g, 853);
  var m = atG(box, 853);
  var ng = atG(FD.BY_ID['rb-nasi-goreng'], 300);
  var sb = atG(FD.BY_ID['rb-sayur-broccoli'], 200);
  var ds = atG(FD.BY_ID['rb-daging-semur'], 300);
  var egg = atG(FD.BY_ID['rb-gekookt-ei'], 53);
  near(m.kcal, ng.kcal + sb.kcal + ds.kcal + egg.kcal, 0.5, 'combo vs parts kcal');
  near(m.p, ng.p + sb.p + ds.p + egg.p, 0.1, 'combo vs parts p');
  near(m.c, ng.c + sb.c + ds.c + egg.c, 0.1, 'combo vs parts c');
  near(m.f, ng.f + sb.f + ds.f + egg.f, 0.1, 'combo vs parts f');
  near(m.kcal, 1382, 1, 'combo kcal');
  near(m.p, 84.7, 0.2, 'combo p');
  near(m.c, 124.6, 0.2, 'combo c');
  near(m.f, 64.6, 0.2, 'combo f');
  assert.ok(/aaron/i.test(norm(box.nl + ' ' + box.en + ' ' + box.al)));
  assert.ok(/ei/.test(norm(box.nl + ' ' + box.portion + ' ' + box.al)), 'combo should mention ei');
});

check('Rasa Baru filter is present and does not leak into Caribbean/LatAm', function () {
  var row = (FD.REGION_FILTERS || []).filter(function (r) { return r[0] === 'rasabaru'; })[0];
  assert.ok(row, 'missing Rasa Baru filter');
  assert.strictEqual(row[1], 'Rasa Baru');
  var rbF = FD.FOODS.filter(function (f) { return matchReg(f, 'rasabaru'); });
  assert.strictEqual(rbF.length, rb.length, 'filter count ' + rbF.length);
  var latam = FD.FOODS.filter(function (f) { return matchReg(f, 'latam'); });
  assert.ok(latam.every(function (f) { return f.rg !== 'rasabaru' && f.rg !== 'kippie'; }), 'latam includes a shop brand');
  var carF = FD.FOODS.filter(function (f) { return matchReg(f, 'car'); });
  assert.ok(carF.every(function (f) { return f.rg !== 'rasabaru'; }));
});

check('required menu dishes are present', function () {
  ['rb-nasi-goreng', 'rb-nasi-putih', 'rb-nasi-koening', 'rb-bami-goreng',
    'rb-ajam-kerrie-jawa', 'rb-ajam-ketjap', 'rb-ajam-pedis', 'rb-sate-pan',
    'rb-daging-rendang', 'rb-daging-bumbu-bali', 'rb-daging-semur', 'rb-bakso-pedis',
    'rb-udang-mix', 'rb-ikan-bali', 'rb-sayur-lodeh', 'rb-sayur-tauge',
    'rb-sayur-broccoli', 'rb-sambal-goreng-buncis', 'rb-tumis-buncis',
    'rb-tempeh-peteh', 'rb-tempeh-goreng', 'rb-orak-arik', 'rb-urap',
    'rb-roti-aardappelen', 'rb-pastei-kip', 'rb-risolles', 'rb-lumpia', 'rb-lemper',
    'rb-satesaus', 'rb-serundeng', 'rb-gekookt-ei', 'rb-bakje-aaron'].forEach(function (id) {
    assert.ok(FD.BY_ID[id], 'missing ' + id);
  });
});

console.log(passed + ' passed, ' + failed + ' failed, ' + rb.length + ' Rasa Baru items, DB ' + FD.FOODS.length);
if (failed) process.exit(1);
