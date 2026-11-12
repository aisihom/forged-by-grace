#!/usr/bin/env node
'use strict';
// One command for everything: `npm test`. Runs every test file; exits 1 if ANY fails.
// Order: fast static checks first, then unit tests, then the headless browser smoke test.
var fs = require('fs'), path = require('path'), cp = require('child_process');
var dir = __dirname;
var FIRST = ['check-syntax.js', 'check-release.js', 'check-data.js'], LAST = ['smoke.js'];
var all = fs.readdirSync(dir).filter(function (n) { return /\.js$/.test(n) && n !== 'run-all.js'; });
var mid = all.filter(function (n) { return FIRST.indexOf(n) === -1 && LAST.indexOf(n) === -1; }).sort();
var order = FIRST.concat(mid, LAST).filter(function (n) { return all.indexOf(n) !== -1; });
var results = [], t0 = Date.now();
order.forEach(function (n) {
  var t = Date.now();
  process.stdout.write('\n=== ' + n + '\n');
  var r = cp.spawnSync(process.execPath, [path.join(dir, n)], { stdio: 'inherit', timeout: 240000 });
  results.push({ n: n, ok: r.status === 0, s: ((Date.now() - t) / 1000).toFixed(1) });
});
var bad = results.filter(function (r) { return !r.ok; });
console.log('\n================ SUMMARY ================');
results.forEach(function (r) { console.log((r.ok ? '  PASS  ' : '  FAIL  ') + r.n + '  (' + r.s + 's)'); });
console.log(bad.length ? '\n✗ ' + bad.length + ' of ' + results.length + ' test files FAILED — do not deploy.' : '\n✓ all ' + results.length + ' test files passed in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
process.exit(bad.length ? 1 : 0);
