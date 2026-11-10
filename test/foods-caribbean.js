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
vm.runInContext(fs.readFileSync(path.join(root, 'js/foods-caribbean.js'), 'utf8'), sandbox);

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
  return norm(f.en + ' ' + f.nl + ' ' + (f.al || '') + ' ' + (f.rgName || '') + ' ' + (f.rg || '') + ' ' + ((FD.REGIONS && FD.REGIONS[f.rg]) || ''));
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
  if (reg === 'latam') return !!f.rg;
  var row = (FD.REGION_FILTERS || []).filter(function (r) { return r[0] === reg; })[0];
  var codes = row ? row[2] : reg;
  if (codes === 'CAR') return (FD.CARIBBEAN_RG || []).indexOf(f.rg) !== -1;
  if (codes === '*') return !!f.rg;
  if (Array.isArray(codes)) return codes.indexOf(f.rg) !== -1;
  return f.rg === codes || f.rg === reg;
}

var lat = FD.FOODS.filter(function (f) { return String(f.id || '').indexOf('lat-') === 0; });
var car = lat.filter(function (f) { return (FD.CARIBBEAN_RG || []).indexOf(f.rg) !== -1; });
var soups = lat.filter(function (f) { return f.cat === 'soup'; });

check('core foods still present', function () {
  assert.ok(FD.BY_ID['chicken-breast'], 'chicken-breast missing');
  assert.ok(FD.BY_ID['erwtensoep'], 'erwtensoep missing');
  assert.ok(FD.FOODS.length > 2000, 'expected large combined DB, got ' + FD.FOODS.length);
});

check('400+ latam/caribbean items, 200+ Caribbean, 60+ soups', function () {
  assert.ok(lat.length >= 400, 'items ' + lat.length);
  assert.ok(car.length >= 200, 'caribbean ' + car.length);
  assert.ok(soups.length >= 60, 'soups ' + soups.length);
});

check('unique ids and no collision with built-in staples', function () {
  var ids = {};
  FD.FOODS.forEach(function (f) {
    if (ids[f.id]) throw new Error('duplicate id ' + f.id);
    ids[f.id] = 1;
  });
  lat.forEach(function (f) {
    assert.ok(f.id.indexOf('lat-') === 0, f.id);
    assert.notStrictEqual(f.id, 'chicken-breast');
  });
});

check('required fields and sane macros', function () {
  lat.forEach(function (f) {
    ['id', 'en', 'nl', 'al', 'cat', 'kcal', 'p', 'c', 'f', 'g', 'portion', 'src', 'rg', 'rgName'].forEach(function (k) {
      if (f[k] == null || f[k] === '') throw new Error(f.id + ' missing ' + k);
    });
    if (!(f.g > 0) || f.kcal < 0 || f.p < 0 || f.c < 0 || f.f < 0) throw new Error('bad macros ' + f.id);
    var at = 4 * f.p + 4 * f.c + 9 * f.f;
    if (f.src.indexOf('alcohol') === -1 && f.kcal > 8 && at > 0) {
      var dev = Math.abs(f.kcal - at) / Math.max(f.kcal, at);
      if (dev > 0.25) throw new Error('atwater ' + f.id + ' kcal=' + f.kcal + ' vs ' + at.toFixed(1));
    }
  });
});

check('search by Papiamentu plate names', function () {
  function first(q, id) {
    var r = search(q);
    assert.ok(r.some(function (f) { return f.id === id; }), q + ' did not find ' + id + ' (got ' + r.slice(0, 5).map(function (f) { return f.id; }).join(', ') + ')');
  }
  first('karni stoba ku aros', 'lat-karni-stoba-aros');
  first('funchi ku yambo', 'lat-funchi-yambo');
  first('galina stoba ku funchi', 'lat-galina-stoba-funchi');
  first('kabritu stoba ku aros moro', 'lat-kabritu-stoba-moro');
  first('piska kora hasi ku funchi', 'lat-piska-kora-funchi');
  first('bestia chiki stoba', 'lat-bestia-chiki-stoba');
  first('keshi yena ku aros', 'lat-keshi-yena-aros');
  first('sopi mondongo ku pan', 'lat-sopi-mondongo-pan');
  first('giambo', 'lat-yambo');
  first('tutu', 'lat-tutu');
  first('aros moro', 'lat-aros-moro');
  first('batata dushi hasi', 'lat-batata-dushi-hasi');
  first('bakiou', 'lat-bakiou-stoba');
  first('sopi di pampuna', 'lat-sopi-pampuna');
  first('kadushi', 'lat-sopi-kadushi');
  first('arepa di pampuna', 'lat-arepa-pampuna');
  first('pan bati', 'lat-pan-bati');
  first('pastechi', 'lat-pastechi-karni');
  first('pika', 'lat-pika');
  first('salsa di pinda', 'lat-salsa-pinda');
});

check('search by country / region name', function () {
  assert.ok(search('curacao').length >= 20, 'curacao ' + search('curacao').length);
  assert.ok(search('curaçao').length >= 20, 'curaçao ' + search('curaçao').length);
  assert.ok(search('aruba').some(function (f) { return /aruba/i.test(hay(f)); }));
  assert.ok(search('bonaire').length >= 1);
  assert.ok(search('sint maarten').length >= 3);
  assert.ok(search('jamaica').some(function (f) { return f.id === 'lat-ackee-saltfish' || f.id === 'lat-jerk-chicken-plate'; }));
  assert.ok(search('cuba').some(function (f) { return f.id.indexOf('ropa-vieja') !== -1; }));
  assert.ok(search('suriname').some(function (f) { return f.id === 'lat-moksi-alesi' || f.id === 'lat-pom'; }));
});

check('other island combo plates are present', function () {
  ['lat-la-bandera', 'lat-arroz-gandules-pernil', 'lat-ropa-vieja-plato', 'lat-moros',
    'lat-ackee-saltfish', 'lat-jerk-chicken-plate', 'lat-doubles', 'lat-pelau',
    'lat-griot-diri', 'lat-johnny-saltfish', 'lat-moksi-alesi', 'lat-pom', 'lat-roti-kip-sr'].forEach(function (id) {
    assert.ok(FD.BY_ID[id], 'missing ' + id);
  });
});

check('region filters', function () {
  var cw = lat.filter(function (f) { return matchReg(f, 'cw'); });
  var abc = lat.filter(function (f) { return matchReg(f, 'abc'); });
  var carF = lat.filter(function (f) { return matchReg(f, 'car'); });
  var all = lat.filter(function (f) { return matchReg(f, 'latam'); });
  assert.ok(cw.length >= 80, 'cw ' + cw.length);
  assert.ok(abc.length >= cw.length, 'abc ' + abc.length);
  assert.strictEqual(carF.length, car.length);
  assert.strictEqual(all.length, lat.length);
  assert.ok(lat.filter(function (f) { return matchReg(f, 'sx'); }).length >= 10, 'sx');
  assert.ok(lat.filter(function (f) { return matchReg(f, 'jm'); }).length >= 8, 'jm');
});

check('soup category and key soups', function () {
  assert.strictEqual(FD.CATS.soup, 'Soups');
  ['lat-sopi-piska', 'lat-sopi-mondongo', 'lat-sopi-yuana', 'lat-sopi-kadushi', 'lat-sopi-pampuna',
    'lat-yambo', 'lat-soup-joumou', 'lat-sancocho-do', 'lat-ajiaco-co', 'lat-pozole-rojo',
    'lat-callaloo-soup-tt', 'lat-pindasoep-sr', 'lat-goat-water-ms'].forEach(function (id) {
    assert.ok(FD.BY_ID[id], 'missing ' + id);
    assert.strictEqual(FD.BY_ID[id].cat, 'soup', id + ' not soup');
  });
});

check('staple macros in expected ranges', function () {
  var funchi = FD.BY_ID['lat-funchi'];
  assert.ok(funchi.kcal >= 70 && funchi.kcal <= 110, 'funchi kcal ' + funchi.kcal);
  var ky = FD.BY_ID['lat-keshi-yena'];
  assert.ok(ky.kcal >= 200 && ky.f >= 12, 'keshi yena ' + ky.kcal + '/' + ky.f);
  var soup = FD.BY_ID['lat-sopi-mondongo'];
  assert.ok(soup.kcal >= 35 && soup.kcal <= 120, 'mondongo kcal ' + soup.kcal);
  var joumou = FD.BY_ID['lat-soup-joumou'];
  assert.ok(joumou.kcal >= 40 && joumou.kcal <= 120, 'joumou ' + joumou.kcal);
});

console.log(passed + ' passed, ' + failed + ' failed; ' + lat.length + ' items, ' + car.length + ' Caribbean, ' + soups.length + ' soups');
if (failed) process.exit(1);
