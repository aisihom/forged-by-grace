'use strict';
// Shared tiny test helper: check(name, fn) + done(). Exits 1 if anything failed.
var passed = 0, failed = 0;
exports.check = function (name, fn) {
  try { fn(); passed++; console.log('ok    ' + name); }
  catch (e) { failed++; console.error('FAIL  ' + name + '\n      ' + (e && e.message || e)); }
};
exports.done = function (label) {
  console.log((label ? label + ': ' : '') + passed + ' passed, ' + failed + ' failed');
  if (failed) process.exitCode = 1;
  return failed;
};
