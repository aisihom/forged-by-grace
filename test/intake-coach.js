'use strict';
// v3.31.1 — an intake the client's phone synced (client_data kind 'intake') must show on the coach page
// (Mental coaching section + Mind tab "Briefs"), not only after a manual import.
var fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
var root = path.resolve(__dirname, '..');
var win = { localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} } };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/common.js'), 'utf8'), { window: win, document: undefined, navigator: {}, console: console });
var F = win.FBG, failed = 0;
function t(name, fn) { try { fn(); console.log('ok  ' + name); } catch (e) { failed++; console.error('fail  ' + name + '\n  ' + (e && e.stack || e)); } }
function ik(id, at, name) { return { v: 1, id: id, app: 'fbg', lang: 'nl', type: 'intake', submittedAt: at, answers: { name: name || 'Mo', focus: ['performance'], wants: ['plan'], stress: 4, motivation: 8, sleepQuality: 6, confidence: 7 } }; }

t('latestIntake picks the newest valid entry (array or object)', function () {
  assert.strictEqual(F.latestIntake(null), null);
  assert.strictEqual(F.latestIntake([{ id: 'x' }]), null, 'no answers = not an intake');
  assert.strictEqual(F.latestIntake(ik('a', '2026-11-03T15:08:48Z')).id, 'a');
  assert.strictEqual(F.latestIntake([ik('a', '2026-11-03T00:00:00Z'), ik('b', '2026-11-15T00:00:00Z')]).id, 'b');
});
t('synced intake fills an empty client card with brief', function () {
  var c = { id: 'c1', name: 'Mo' };
  assert.ok(F.syncIntake(c, [ik('a', '2026-11-03T15:08:48Z')]));
  assert.strictEqual(c.intakeId, 'a'); assert.ok(c.brief && Array.isArray(c.brief.themes) && Array.isArray(c.brief.questions));
  assert.ok(!F.syncIntake(c, [ik('a', '2026-11-03T15:08:48Z')]), 'unchanged = no rewrite');
});
t('a newer resubmission replaces the old one; an older one never overwrites', function () {
  var c = { intake: ik('a', '2026-11-03T00:00:00Z'), intakeId: 'a' };
  assert.ok(F.syncIntake(c, [ik('b', '2026-11-15T00:00:00Z')])); assert.strictEqual(c.intakeId, 'b');
  var d = { intake: ik('imp', '2026-11-20T00:00:00Z'), intakeId: 'imp' };
  assert.ok(!F.syncIntake(d, [ik('a', '2026-11-03T00:00:00Z')])); assert.strictEqual(d.intakeId, 'imp');
});
t('cloud merge wires the synced intake into the coach client', function () {
  var cloud = fs.readFileSync(path.join(root, 'js/cloud.js'), 'utf8');
  var m = cloud.slice(cloud.indexOf('function merge('), cloud.indexOf('function subscribe('));
  assert.ok(/F\.syncIntake\(c, live\.intake\)/.test(m));
});
if (failed) { console.error(failed + ' failed'); process.exit(1); }
