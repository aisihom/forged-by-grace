'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');
var root = path.resolve(__dirname, '..');

function slug(s) {
  return String(s || 'client').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client';
}

var sandbox = { console: console };
sandbox.window = sandbox;
sandbox.window.FBG_I18N = { nl: {} };
sandbox.window.App = {
  S: { lang: 'nl', role: 'coach', me: {} },
  esc: function (s) { return String(s == null ? '' : s); },
  t: function (s) { return s; },
  acts: {},
  views: { client: function () { return ''; } },
  F: { slug: slug, fmtDay: function (d) { return d; } },
  toast: function () {},
  client: function () { return null; }
};
sandbox.App = sandbox.window.App;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/photoguide.js'), 'utf8'), sandbox);
var App = sandbox.window.App;

var failed = 0;
function check(name, fn) {
  try { fn(); console.log('ok  ' + name); }
  catch (e) { failed++; console.error('fail  ' + name + '\n  ' + e.message); }
}

check('photoGroups groups by date and pose, keeps latest filename', function () {
  var g = App.photoGroups([
    'avatar.jpg',
    'ph-2026-11-05-front-aaa.jpg',
    'ph-2026-11-05-front-zzz.jpg',
    'ph-2026-11-05-left-a.jpg',
    'ph-2026-11-05-side-old.jpg',
    'ph-2026-11-04-back-x.jpg',
    'readme.txt'
  ]);
  assert.deepStrictEqual(Object.keys(g).sort(), ['2026-11-04', '2026-11-05']);
  assert.strictEqual(g['2026-11-05'].front, 'ph-2026-11-05-front-zzz.jpg');
  assert.strictEqual(g['2026-11-05'].left, 'ph-2026-11-05-left-a.jpg');
  assert.strictEqual(g['2026-11-05'].side, 'ph-2026-11-05-side-old.jpg');
  assert.strictEqual(g['2026-11-04'].back, 'ph-2026-11-04-back-x.jpg');
  assert.strictEqual(g['2026-11-05'].right, undefined);
});

check('photoFileName slugs client, date and pose', function () {
  assert.strictEqual(App.photoFileName('Stephanie Randt', '2026-11-05', 'front'), 'stephanie-randt-2026-11-05-front.jpg');
  assert.strictEqual(App.photoFileName('José Peña', '2026-11-05T18:00:00Z', 'right'), 'jose-pena-2026-11-05-right.jpg');
  assert.strictEqual(App.photoFileName('', '2026-11-05', 'side'), 'client-2026-11-05-left.jpg');
  assert.strictEqual(App.photoFileName('Mo', '2026-11-01', 'back'), 'mo-2026-11-01-back.jpg');
});

check('saveBlobMode uses share only on iPhone when canShare', function () {
  var iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  var desktop = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  assert.strictEqual(App.saveBlobMode(iphone, true), 'share');
  assert.strictEqual(App.saveBlobMode(iphone, false), 'download');
  assert.strictEqual(App.saveBlobMode(desktop, true), 'download');
  assert.strictEqual(App.saveBlobMode(desktop, false), 'download');
});

check('coach source fetches private blobs, not signed URLs', function () {
  var pg = fs.readFileSync(path.join(root, 'js/photoguide.js'), 'utf8');
  var cloud = fs.readFileSync(path.join(root, 'js/cloud.js'), 'utf8');
  assert.strictEqual(pg.indexOf('createSignedUrl'), -1);
  assert.ok(pg.indexOf('.download(path)') !== -1);
  assert.ok(pg.indexOf('Download this photo') !== -1);
  assert.ok(cloud.indexOf('createSignedUrls') === -1);
});

if (failed) {
  console.error('\n' + failed + ' failed');
  process.exit(1);
}
console.log('\nall tests passed');
