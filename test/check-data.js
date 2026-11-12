'use strict';
// Data integrity for the exercise library, plan templates and food database.
var fs = require('fs'), path = require('path'), vm = require('vm');
var T = require('./lib/check'), root = path.resolve(__dirname, '..');
var sb = { console: console }; sb.window = sb; sb.self = sb; vm.createContext(sb);
['js/data.js', 'js/exextra.js', 'js/exmedia.js', 'js/foods.js', 'js/foods-db.js', 'js/foods-caribbean.js', 'js/foods-kippie.js'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sb, { filename: f });
});
var D = sb.FBG_DATA, FD = sb.FBG_FOODS, EX = D.EXERCISES, FOODS = FD.FOODS;
var media = fs.readdirSync(path.join(root, 'assets/ex'));
function fin(x) { return typeof x === 'number' && isFinite(x); }

// ---- exercises ----
T.check('exercise ids unique, kebab-case, BY_ID complete (' + EX.length + ')', function () {
  var seen = {};
  EX.forEach(function (e) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id || '')) throw new Error('bad id "' + e.id + '"');
    if (seen[e.id]) throw new Error('duplicate id ' + e.id); seen[e.id] = 1;
    if (D.BY_ID[e.id] !== e) throw new Error('BY_ID out of sync for ' + e.id);
  });
});
T.check('every exercise has name, nameNl, muscle, pattern, equip, track, cue', function () {
  var bad = EX.filter(function (e) { return !e.name || !e.nameNl || !e.muscle || !e.pattern || !Array.isArray(e.equip) || !e.equip.length || !/^(weight|reps|time|min)$/.test(e.track) || !(e.cue || (e.cues && e.cues.length)); });
  if (bad.length) throw new Error(bad.slice(0, 8).map(function (e) { return e.id; }).join(', '));
});
T.check('every exercise has a demo (a/b jpg+webp) on disk', function () {
  var miss = EX.filter(function (e) { return ['a.jpg', 'b.jpg', 'a.webp', 'b.webp'].some(function (s) { return media.indexOf(e.id + '-' + s) === -1; }); });
  if (miss.length) throw new Error('missing media: ' + miss.slice(0, 10).map(function (e) { return e.id; }).join(', '));
});
T.check('every exercise has alternatives (2+ others in its body-part group)', function () {
  var by = {}; EX.forEach(function (e) { var g = D.groupOf(e); by[g] = (by[g] || 0) + 1; });
  var lonely = EX.filter(function (e) { return (by[D.groupOf(e)] || 0) < 3; });
  if (lonely.length) throw new Error(lonely.map(function (e) { return e.id + '(' + D.groupOf(e) + ')'; }).join(', '));
});
T.check('every plan slot points at existing exercises', function () {
  Object.keys(D.SLOTS).forEach(function (k) { D.SLOTS[k].forEach(function (id) { if (!D.BY_ID[id]) throw new Error('slot ' + k + ' -> ' + id); }); });
});
T.check('every day uses known slots, every week uses known days', function () {
  Object.keys(D.DAYS).forEach(function (k) { (D.DAYS[k].slots || []).forEach(function (s) { if (!D.SLOTS[s[0]]) throw new Error('day ' + k + ' -> slot ' + s[0]); }); });
  Object.keys(D.WEEKS).forEach(function (k) { D.WEEKS[k].forEach(function (d) { if (!D.DAYS[d]) throw new Error('week ' + k + ' -> day ' + d); }); });
});

// ---- foods ----
T.check('food ids unique and non-empty (' + FOODS.length + ')', function () {
  var seen = {}, dup = [];
  FOODS.forEach(function (f) { if (!f.id) throw new Error('food without id: ' + (f.en || f.nl)); if (seen[f.id]) dup.push(f.id); seen[f.id] = 1; });
  if (dup.length) throw new Error('duplicates: ' + dup.slice(0, 10).join(', '));
  if (Object.keys(FD.BY_ID).length !== FOODS.length) throw new Error('BY_ID size ' + Object.keys(FD.BY_ID).length + ' vs ' + FOODS.length);
});
T.check('every food has a name and a known category', function () {
  var bad = FOODS.filter(function (f) { return !(f.en || f.nl) || !FD.CATS[f.cat]; });
  if (bad.length) throw new Error(bad.slice(0, 8).map(function (f) { return f.id + ':' + f.cat; }).join(', '));
});
T.check('macros are real numbers (no NaN, no negatives, per 100 g sane)', function () {
  var bad = FOODS.filter(function (f) {
    return ['kcal', 'p', 'c', 'f'].some(function (k) { return !fin(f[k]) || f[k] < 0; }) || f.kcal > 910 || f.p + f.c + f.f > 101;
  });
  if (bad.length) throw new Error(bad.slice(0, 8).map(function (f) { return f.id + ' ' + [f.kcal, f.p, f.c, f.f].join('/'); }).join(', '));
});
T.check('kcal fits the macros (4/4/9, fibre and alcohol allowed for)', function () {
  var bad = FOODS.filter(function (f) {
    var hi = 4 * f.p + 4 * f.c + 9 * f.f, lo = 4 * f.p + 4 * Math.max(0, f.c - (f.fib || 0)) + 9 * f.f;
    var alcohol = /alcohol|beer|wine|bier|wijn|rum|liqueur|likeur|whisk|vodka|gin\b|sake|mojito|punch|cocktail|daiquiri|tequila|brandy|cognac|proof/i.test((f.en || '') + ' ' + (f.nl || ''));
    return f.kcal < lo * 0.6 - 40 || (!alcohol && f.kcal > hi * 1.3 + 40);
  });
  if (bad.length) throw new Error(bad.length + ' off: ' + bad.slice(0, 8).map(function (f) { return f.id + ' ' + f.kcal + ' vs ' + Math.round(4 * f.p + 4 * f.c + 9 * f.f); }).join(', '));
});
T.check('portion grams are positive numbers when set', function () {
  var bad = FOODS.filter(function (f) { return f.g != null && !(fin(f.g) && f.g > 0 && f.g <= 3000); });
  if (bad.length) throw new Error(bad.slice(0, 8).map(function (f) { return f.id + ' g=' + f.g; }).join(', '));
});
T.done('data');
