'use strict';
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var root = path.resolve(__dirname, '..');

var failed = 0, passed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log('ok  ' + name); }
  catch (e) { failed++; console.error('fail  ' + name + '\n  ' + (e && e.message || e)); }
}

var core = fs.readFileSync(path.join(root, 'js/core.js'), 'utf8');
var hs = fs.readFileSync(path.join(root, 'js/healthsync.js'), 'utf8');
var health = fs.readFileSync(path.join(root, 'js/health.js'), 'utf8');
var cfg = fs.readFileSync(path.join(root, 'config.js'), 'utf8');

check('coaches may open the #/hlink install page', function () {
  var m = core.match(/S\.role === 'coach' \? \[([^\]]+)\]/);
  assert.ok(m, 'coach allow list missing');
  assert.ok(m[1].indexOf("'hlink'") !== -1);
});

check('More menu shows Install step sync for coaches too', function () {
  assert.ok(hs.indexOf("if (S.role === 'coach') return h") === -1);
  assert.ok(hs.indexOf('Install step sync') !== -1);
});

check('iOS wizard tells people not to use Open URLs', function () {
  assert.ok(hs.indexOf('Do not use Open URLs') !== -1);
  assert.ok(hs.indexOf('Get Contents of URL') !== -1);
});

check('How to set it up goes to the silent wizard, not a Safari Open URL recipe', function () {
  assert.ok(health.indexOf("location.hash = '#/hlink/ios'") !== -1);
  var help = health.slice(health.indexOf("A['h-help']"), health.indexOf("A['h-help']") + 200);
  assert.ok(help.indexOf('Open URL') === -1);
});

check('config can hold an iCloud shortcut URL later', function () {
  assert.ok(cfg.indexOf('iosShortcut') !== -1);
  assert.ok(hs.indexOf('FBG_CONFIG.iosShortcut') !== -1);
});

check('version.json holds a valid version (consistency is checked in check-release.js)', function () {
  var v = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
  assert.ok(/^\d+\.\d+\.\d+$/.test(v.v), v.v);
});

console.log(passed + ' of ' + (passed + failed) + ' tests passed');
if (failed) process.exit(1);
