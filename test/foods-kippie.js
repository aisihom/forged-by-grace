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
var before = sandbox.window.FBG_FOODS.FOODS.length;
var coreChicken = sandbox.window.FBG_FOODS.BY_ID['chicken-breast'];
vm.runInContext(fs.readFileSync(path.join(root, 'js/foods-caribbean.js'), 'utf8'), sandbox);
var afterCar = sandbox.window.FBG_FOODS.FOODS.length;
vm.runInContext(fs.readFileSync(path.join(root, 'js/foods-kippie.js'), 'utf8'), sandbox);

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
function matchReg(f, reg) {
  if (!reg) return true;
  if (reg === 'latam') return !!f.rg && f.rg !== 'kippie';
  var row = (FD.REGION_FILTERS || []).filter(function (r) { return r[0] === reg; })[0];
  var codes = row ? row[2] : reg;
  if (codes === 'CAR') return (FD.CARIBBEAN_RG || []).indexOf(f.rg) !== -1;
  if (codes === '*') return !!f.rg && f.rg !== 'kippie';
  if (Array.isArray(codes)) return codes.indexOf(f.rg) !== -1;
  return f.rg === codes || f.rg === reg;
}

var kip = FD.FOODS.filter(function (f) { return String(f.id || '').indexOf('kip-') === 0; });
var lat = FD.FOODS.filter(function (f) { return String(f.id || '').indexOf('lat-') === 0; });

check('core and Caribbean foods still present', function () {
  assert.ok(FD.BY_ID['chicken-breast'], 'chicken-breast missing');
  assert.strictEqual(FD.BY_ID['chicken-breast'].kcal, coreChicken.kcal);
  assert.ok(FD.BY_ID['erwtensoep'], 'erwtensoep missing');
  assert.ok(FD.BY_ID['lat-sopi-piska'], 'caribbean item missing');
  assert.ok(lat.length >= 400, 'caribbean count ' + lat.length);
  assert.ok(FD.FOODS.length > before + 400, 'combined DB too small: ' + FD.FOODS.length);
  assert.strictEqual(afterCar + kip.length, FD.FOODS.length);
});

check('200+ Kippie items with unique kip- ids and no collisions', function () {
  assert.ok(kip.length >= 200, 'items ' + kip.length);
  var ids = {};
  FD.FOODS.forEach(function (f) {
    if (ids[f.id]) throw new Error('duplicate id ' + f.id);
    ids[f.id] = 1;
  });
  kip.forEach(function (f) {
    assert.ok(f.id.indexOf('kip-') === 0, f.id);
    assert.notStrictEqual(f.id, 'chicken-breast');
  });
});

check('required fields, Kippie brand/tag, and sane macros', function () {
  kip.forEach(function (f) {
    ['id', 'en', 'nl', 'al', 'cat', 'kcal', 'p', 'c', 'f', 'g', 'portion', 'src', 'rg', 'rgName', 'brand'].forEach(function (k) {
      if (f[k] == null || f[k] === '') throw new Error(f.id + ' missing ' + k);
    });
    assert.strictEqual(f.brand, 'Kippie', f.id);
    assert.strictEqual(f.rg, 'kippie', f.id);
    assert.strictEqual(f.rgName, 'Kippie', f.id);
    assert.ok(/\bkippie\b/i.test(f.al), f.id + ' alias missing kippie');
    if (!(f.g > 0) || f.kcal < 0 || f.p < 0 || f.c < 0 || f.f < 0) throw new Error('bad macros ' + f.id);
    var at = 4 * f.p + 4 * f.c + 9 * f.f;
    if (f.src.indexOf('alcohol') === -1 && f.kcal > 8 && at > 0) {
      var dev = Math.abs(f.kcal - at) / Math.max(f.kcal, at);
      if (dev > 0.25) throw new Error('atwater ' + f.id + ' kcal=' + f.kcal + ' vs ' + at.toFixed(1));
    }
  });
});

check('search by Kippie and product names', function () {
  var byBrand = search('Kippie');
  assert.ok(byBrand.length >= 200, 'search Kippie ' + byBrand.length);
  assert.ok(byBrand.every(function (f) { return f.brand === 'Kippie' || /kippie/i.test(hay(f)); }));
  function first(q, id) {
    var r = search(q);
    assert.ok(r.some(function (f) { return f.id === id; }), q + ' did not find ' + id + ' (got ' + r.slice(0, 8).map(function (f) { return f.id; }).join(', ') + ')');
  }
  first('pistolet kip', 'kip-pistolet-kip');
  first('pistolet kippeling', 'kip-pistolet-kippeling');
  first('pistolet gehaktbal', 'kip-pistolet-gehaktbal');
  first('pistolet grillworst kaas', 'kip-pistolet-grillworst-kaas');
  first('stokbrood kip', 'kip-stokbrood-kip');
  first('broodje kipdöner', 'kip-broodje-kipdoner');
  first('broodje kipkroket', 'kip-broodje-kipkroket');
  first('wrap kippeling', 'kip-wrap-kippeling');
  first('hele kip', 'kip-hele-kip');
  first('drumsticks', 'kip-drumsticks');
  first('kippenpoot pittig', 'kip-kippenpoot-pittig');
  first('kluifjes zoet', 'kip-kluifjes-zoet');
  first('kipsaté pindasaus', 'kip-kipsate-pindasaus');
  first('nasi 300', 'kip-nasi');
  first('kip in ketjapsaus', 'kip-ketjapsaus');
  first('piripirisaus', 'kip-piripirisaus');
  first('knoflooksaus', 'kip-knoflooksaus');
  first('snackpan xxl', 'kip-snackpan-xxl');
});

check('Kippie filter is present and does not leak into Caribbean/LatAm', function () {
  var row = (FD.REGION_FILTERS || []).filter(function (r) { return r[0] === 'kippie'; })[0];
  assert.ok(row, 'missing Kippie filter');
  assert.strictEqual(row[1], 'Kippie');
  var kipF = FD.FOODS.filter(function (f) { return matchReg(f, 'kippie'); });
  assert.strictEqual(kipF.length, kip.length, 'filter count ' + kipF.length);
  var latam = FD.FOODS.filter(function (f) { return matchReg(f, 'latam'); });
  assert.ok(latam.every(function (f) { return f.rg !== 'kippie'; }), 'latam includes Kippie');
  assert.strictEqual(latam.length, lat.length);
  var carF = FD.FOODS.filter(function (f) { return matchReg(f, 'car'); });
  assert.ok(carF.every(function (f) { return f.rg !== 'kippie'; }));
});

check('key menu groups are present', function () {
  var byCat = {};
  kip.forEach(function (f) { byCat[f.cat] = (byCat[f.cat] || 0) + 1; });
  assert.ok(byCat.meal >= 20, 'meals ' + byCat.meal);
  assert.ok(byCat.protein >= 15, 'protein ' + byCat.protein);
  assert.ok(byCat.drink >= 10, 'drinks ' + byCat.drink);
  assert.ok(byCat.fat >= 5, 'sauces ' + byCat.fat);
  assert.ok(byCat.snack >= 8, 'snacks ' + byCat.snack);
  ['kip-pistolet-kip', 'kip-stokbrood-kip', 'kip-broodje-kipdoner', 'kip-hele-kip',
    'kip-drumsticks', 'kip-calzone-kip', 'kip-rotirol', 'kip-loempia-kip',
    'kip-komkommersalade', 'kip-piripirisaus', 'kip-coca-cola-blik'].forEach(function (id) {
    assert.ok(FD.BY_ID[id], 'missing ' + id);
  });
});

check('official values vs estimates are flagged', function () {
  var off = kip.filter(function (f) { return /officiële waarde/i.test(f.src); });
  var est = kip.filter(function (f) { return /schatting/i.test(f.src); });
  assert.ok(off.length >= 15, 'official ' + off.length);
  assert.ok(est.length >= 150, 'estimates ' + est.length);
  assert.strictEqual(off.length + est.length, kip.length, 'unclassified src');
  assert.ok(/Open Food Facts/i.test(FD.BY_ID['kip-piripirisaus'].src));
  assert.ok(/Open Food Facts/i.test(FD.BY_ID['kip-knoflooksaus'].src));
  assert.ok(/Fabrikant/i.test(FD.BY_ID['kip-coca-cola-blik'].src));
  assert.strictEqual(FD.BY_ID['kip-piripirisaus'].kcal, 194);
  assert.strictEqual(FD.BY_ID['kip-knoflooksaus'].kcal, 268);
});

check('no merchandise, gift cards or expired lunchdeal SKU', function () {
  kip.forEach(function (f) {
    var h = hay(f);
    if (/nike|cadeaubon|lunchdeal/.test(h)) throw new Error('non-food ' + f.id);
  });
});

console.log(passed + ' passed, ' + failed + ' failed, ' + kip.length + ' Kippie items, DB ' + FD.FOODS.length);
if (failed) process.exit(1);
