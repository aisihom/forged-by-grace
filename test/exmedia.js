'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');
var root = path.resolve(__dirname, '..');

var ctx = { window: {}, console: console };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/exextra.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/exmedia.js'), 'utf8'), ctx);

var EX = ctx.FBG_DATA.EXERCISES;
var EM = ctx.window.FBG_EXMEDIA;
assert.ok(EX && EX.length >= 316, 'at least 316 exercises, got ' + (EX && EX.length));
assert.ok(EM && EM.art && EM.approx, 'FBG_EXMEDIA loaded');

var files = fs.readdirSync(path.join(root, 'assets/ex'));
function has(id) {
  return ['a.jpg', 'b.jpg', 'a.webp', 'b.webp'].every(function (s) { return files.indexOf(id + '-' + s) !== -1; });
}
var miss = EX.filter(function (e) { return !has(e.id); }).map(function (e) { return e.id; });
assert.strictEqual(miss.length, 0, 'missing media: ' + miss.join(','));

var artIds = Object.keys(EM.art);
artIds.forEach(function (id) {
  assert.ok(has(id), 'art set missing files for ' + id);
});

function dim(file) {
  // Pure-Node JPEG size reader (no Python/PIL needed, so it runs the same on the box and in CI).
  var b = fs.readFileSync(file), i = 2;
  while (i < b.length) {
    if (b[i] !== 0xFF) { i++; continue; }
    var m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  throw new Error('no JPEG size in ' + file);
}

// Spot-check dimensions: a photo and an illustration
var photo = dim(path.join(root, 'assets/ex/bench-press-a.jpg'));
assert.deepStrictEqual(photo, [640, 480], 'photo size ' + photo);
var art = dim(path.join(root, 'assets/ex/wall-sit-a.jpg'));
assert.deepStrictEqual(art, [448, 504], 'art size ' + art);
var noph = dim(path.join(root, 'assets/ex/burpee-a.jpg'));
assert.deepStrictEqual(noph, [448, 504], 'existing illustration size ' + noph);

// Approx keys must refer to real exercises
Object.keys(EM.approx).forEach(function (id) {
  assert.ok(EX.some(function (e) { return e.id === id; }), 'approx for unknown id ' + id);
  assert.ok(String(EM.approx[id]).indexOf('Vergelijkbare beweging') === 0, 'approx prefix ' + id);
});

// Service worker must not precache the image set
var sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
assert.ok(sw.indexOf("assets/ex/") === -1 || /assets\/ex\/[^'\"]+/.test(sw) === false, 'sw should not precache assets/ex/*');
assert.ok(sw.indexOf('./js/exmedia.js') !== -1, 'sw precaches exmedia.js');
assert.ok(fs.readFileSync(path.join(root, 'index.html'), 'utf8').indexOf('js/exmedia.js') !== -1, 'index loads exmedia.js');

console.log('exmedia tests ok —', EX.length, 'exercises with complete a/b jpg+webp,', artIds.length, 'illustrations,', Object.keys(EM.approx).length, 'approx notes');
