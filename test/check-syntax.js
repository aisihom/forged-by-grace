'use strict';
// Every JS file in the app must parse. Catches typos like a missing comma in config.js (that broke config in v3.30.15).
var fs = require('fs'), path = require('path'), cp = require('child_process');
var T = require('./lib/check'), root = path.resolve(__dirname, '..');
var SKIP = /^(node_modules|vendor|\.git|screenshots)$/;
function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (d) {
    if (SKIP.test(d.name)) return;
    var f = path.join(dir, d.name);
    if (d.isDirectory()) walk(f, out); else if (/\.(js|mjs)$/.test(d.name)) out.push(f);
  });
  return out;
}
var files = walk(root, []);
files.forEach(function (f) {
  var rel = path.relative(root, f);
  T.check('syntax ' + rel, function () {
    var r = cp.spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error((r.stderr || '').split('\n').slice(0, 5).join('\n      '));
  });
});
// Inline <script> blocks in HTML files must parse too.
fs.readdirSync(root).filter(function (n) { return /\.html$/.test(n); }).forEach(function (n) {
  var html = fs.readFileSync(path.join(root, n), 'utf8'), re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g, m, i = 0;
  while ((m = re.exec(html))) {
    var code = m[1], idx = ++i;
    if (!code.trim()) continue;
    T.check('inline script ' + n + ' #' + idx, function () { new Function(code); });
  }
});
// Common sloppy leftovers in app code.
files.filter(function (f) { return /[\\/]js[\\/]|config\.js$|sw\.js$/.test(f); }).forEach(function (f) {
  var rel = path.relative(root, f), src = fs.readFileSync(f, 'utf8');
  T.check('no debugger/merge markers ' + rel, function () {
    if (/^\s*debugger\s*;?\s*$/m.test(src)) throw new Error('debugger statement left in');
    if (/^(<{7}|>{7}|={7})( |$)/m.test(src)) throw new Error('git merge conflict marker');
  });
});
T.check('config.js defines window.FBG_CONFIG', function () {
  var vm = require('vm'), sb = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'config.js'), 'utf8'), sb);
  if (!sb.window.FBG_CONFIG || !sb.window.FBG_CONFIG.coachName) throw new Error('FBG_CONFIG missing or empty');
});
T.done('syntax (' + files.length + ' files)');
