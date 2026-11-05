'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');
var root = path.resolve(__dirname, '..');

function slug(s) {
  return String(s || 'client').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client';
}

var OWN = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
var OTHER = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
var removed = [];

var sandbox = {
  console: console,
  setInterval: function () { return 0; },
  setTimeout: function (fn) { return 0; },
  clearTimeout: function () {},
  document: { getElementById: function () { return null; }, querySelector: function () { return null; }, querySelectorAll: function () { return []; }, addEventListener: function () {} },
  location: { hash: '' },
  URL: { createObjectURL: function () { return 'blob:mock'; }, revokeObjectURL: function () {} }
};
sandbox.window = sandbox;
sandbox.window.FBG_I18N = { nl: {} };
sandbox.window.App = {
  S: { lang: 'nl', role: 'client', me: { photoLog: [], photoGone: {} } },
  esc: function (s) { return String(s == null ? '' : s); },
  t: function (s) { return s; },
  I: {},
  acts: {},
  views: { client: function () { return ''; }, progress: function () { return ''; } },
  F: { slug: slug, fmtDay: function (d) { return d; } },
  toast: function () {},
  save: function () {},
  client: function () { return null; },
  photoDel: function () { return Promise.resolve(); },
  cloud: {
    state: function () { return { role: 'client', client: OWN }; },
    sb: { storage: { from: function () { return { remove: function (paths) { removed.push(paths.slice()); return Promise.resolve({ error: null }); } }; } } }
  }
};
sandbox.App = sandbox.window.App;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/checkin2.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/photoguide.js'), 'utf8'), sandbox);
var App = sandbox.window.App;
var S = sandbox.window.App.S;
App.photoDel = function () { return Promise.resolve(); };
App.save = function () {};

var failed = 0;
function check(name, fn) {
  var r;
  try { r = fn(); }
  catch (e) { failed++; console.error('fail  ' + name + '\n  ' + e.message); return Promise.resolve(); }
  if (r && typeof r.then === 'function') {
    return r.then(function () { console.log('ok  ' + name); }, function (e) { failed++; console.error('fail  ' + name + '\n  ' + (e && e.message || e)); });
  }
  console.log('ok  ' + name);
  return Promise.resolve();
}

var q = Promise.resolve();
function add(name, fn) { q = q.then(function () { return check(name, fn); }); }

add('photoGroups groups by date and pose, keeps latest filename', function () {
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

add('photoFileName slugs client, date and pose', function () {
  assert.strictEqual(App.photoFileName('Stephanie Randt', '2026-11-05', 'front'), 'stephanie-randt-2026-11-05-front.jpg');
  assert.strictEqual(App.photoFileName('José Peña', '2026-11-05T18:00:00Z', 'right'), 'jose-pena-2026-11-05-right.jpg');
  assert.strictEqual(App.photoFileName('', '2026-11-05', 'side'), 'client-2026-11-05-left.jpg');
  assert.strictEqual(App.photoFileName('Mo', '2026-11-01', 'back'), 'mo-2026-11-01-back.jpg');
});

add('saveBlobMode uses share only on iPhone when canShare', function () {
  var iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  var desktop = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  assert.strictEqual(App.saveBlobMode(iphone, true), 'share');
  assert.strictEqual(App.saveBlobMode(iphone, false), 'download');
  assert.strictEqual(App.saveBlobMode(desktop, true), 'download');
  assert.strictEqual(App.saveBlobMode(desktop, false), 'download');
});

add('coach source fetches private blobs, not signed URLs', function () {
  var pg = fs.readFileSync(path.join(root, 'js/photoguide.js'), 'utf8');
  var cloud = fs.readFileSync(path.join(root, 'js/cloud.js'), 'utf8');
  assert.strictEqual(pg.indexOf('createSignedUrl'), -1);
  assert.ok(pg.indexOf('.download(path)') !== -1);
  assert.ok(pg.indexOf('Download this photo') !== -1);
  assert.ok(pg.indexOf('id="pg-rm"') !== -1);
  assert.ok(pg.indexOf('id="pg-del"') !== -1);
  assert.ok(cloud.indexOf('createSignedUrls') === -1);
  assert.ok(cloud.indexOf('photoGone') !== -1);
});

add('safeCheckinPath accepts only check-in photos in one folder', function () {
  assert.strictEqual(App.safeCheckinPath(OWN, 'ph-2026-11-05-front-abc'), OWN + '/ph-2026-11-05-front-abc.jpg');
  assert.strictEqual(App.safeCheckinPath(OWN, 'ph-2026-11-05-front-abc.jpg'), OWN + '/ph-2026-11-05-front-abc.jpg');
  assert.strictEqual(App.safeCheckinPath(OWN, 'avatar.jpg'), '');
  assert.strictEqual(App.safeCheckinPath(OWN, '../' + OTHER + '/ph-2026-11-05-front-abc'), OWN + '/ph-2026-11-05-front-abc.jpg');
  assert.strictEqual(App.safeCheckinPath(OWN + '/extra', 'ph-2026-11-05-front-abc'), '');
  assert.strictEqual(App.isCheckinPhotoName('avatar.jpg'), false);
  assert.strictEqual(App.isCheckinPhotoName('ph-2026-11-05-front-abc'), true);
});

add('shouldUploadPhoto skips uploaded and tombstoned ids', function () {
  assert.strictEqual(App.shouldUploadPhoto('ph-2026-11-05-front-abc', {}, {}), true);
  assert.strictEqual(App.shouldUploadPhoto('ph-2026-11-05-front-abc', { 'ph-2026-11-05-front-abc': 1 }, {}), false);
  assert.strictEqual(App.shouldUploadPhoto('ph-2026-11-05-front-abc', {}, { 'ph-2026-11-05-front-abc': 1 }), false);
  assert.strictEqual(App.shouldUploadPhoto('', {}, {}), false);
});

add('applyPhotoGone removes only tombstoned poses and keeps others', function () {
  S.me = {
    photoGone: { 'ph-2026-11-05-front-abc': 1 },
    photoLog: [
      { date: '2026-11-05', poses: { front: 'ph-2026-11-05-front-abc', left: 'ph-2026-11-05-left-def' }, weight: 70 },
      { date: '2026-11-01', poses: { front: 'ph-2026-11-05-front-abc' } }
    ]
  };
  assert.strictEqual(App.applyPhotoGone(S.me), true);
  assert.deepStrictEqual(S.me.photoLog[0].poses, { left: 'ph-2026-11-05-left-def' });
  assert.strictEqual(S.me.photoLog.length, 1);
  assert.strictEqual(S.me.photoLog[0].date, '2026-11-05');
});

add('pre-submit picked delete does not touch storage', function () {
  removed.length = 0;
  var picked = { front: { mock: true }, left: { mock: true } };
  delete picked.front;
  assert.deepStrictEqual(Object.keys(picked), ['left']);
  assert.strictEqual(removed.length, 0);
});

add('client cannot delete from another folder', function () {
  removed.length = 0;
  S.me = { photoLog: [{ date: '2026-11-05', poses: { front: 'ph-2026-11-05-front-abc' } }], photoGone: {} };
  return App.deleteCheckinPhoto({ id: 'ph-2026-11-05-front-abc', folderId: OTHER, asCoach: false }).then(function () {
    throw new Error('should reject other client folder');
  }, function (err) {
    assert.ok(err);
    assert.strictEqual(removed.length, 0);
    assert.strictEqual(S.me.photoLog[0].poses.front, 'ph-2026-11-05-front-abc');
  });
});

add('client delete of own mock photo marks gone, drops metadata, removes own path only', function () {
  removed.length = 0;
  S.me = { photoLog: [{ date: '2026-11-05', poses: { front: 'ph-2026-11-05-front-abc', left: 'ph-2026-11-05-left-def' } }], photoGone: {} };
  return App.deleteCheckinPhoto({ id: 'ph-2026-11-05-front-abc', folderId: OWN, asCoach: false }).then(function () {
    assert.strictEqual(JSON.stringify(removed), JSON.stringify([[OWN + '/ph-2026-11-05-front-abc.jpg']]));
    assert.strictEqual(S.me.photoGone['ph-2026-11-05-front-abc'], 1);
    assert.strictEqual(S.me.photoLog[0].poses.front, undefined);
    assert.strictEqual(S.me.photoLog[0].poses.left, 'ph-2026-11-05-left-def');
    assert.strictEqual(App.shouldUploadPhoto('ph-2026-11-05-front-abc', {}, S.me.photoGone), false);
  });
});

add('coach delete of mock photo uses only that client folder', function () {
  removed.length = 0;
  var before = JSON.stringify(S.me);
  return App.deleteCheckinPhoto({ asCoach: true, folderId: OTHER, id: 'ph-2026-11-02-back-zzz' }).then(function () {
    assert.strictEqual(JSON.stringify(removed), JSON.stringify([[OTHER + '/ph-2026-11-02-back-zzz.jpg']]));
    assert.strictEqual(JSON.stringify(S.me), before);
  });
});

add('coach delete rejects avatar and bad names without storage calls', function () {
  removed.length = 0;
  return App.deleteCheckinPhoto({ asCoach: true, folderId: OTHER, id: 'avatar.jpg' }).then(function () {
    throw new Error('should reject avatar');
  }, function () {
    assert.strictEqual(removed.length, 0);
  });
});

q.then(function () {
  if (failed) {
    console.error('\n' + failed + ' failed');
    process.exit(1);
  }
  console.log('\nall tests passed');
});
