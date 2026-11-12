'use strict';
// Version + cache consistency: one version everywhere, every file the app loads exists and is in the offline cache.
var fs = require('fs'), path = require('path');
var T = require('./lib/check'), root = path.resolve(__dirname, '..');
function read(f) { return fs.readFileSync(path.join(root, f), 'utf8'); }
var V = JSON.parse(read('version.json')).v;
var sw = read('sw.js'), core = read('js/core.js'), pkg = JSON.parse(read('package.json'));
var htmls = fs.readdirSync(root).filter(function (n) { return /\.html$/.test(n); });

T.check('version.json is x.y.z (' + V + ')', function () { if (!/^\d+\.\d+\.\d+$/.test(V)) throw new Error(V); });
T.check('sw.js VERSION matches', function () {
  var m = sw.match(/var VERSION = 'fbg-v([^']+)'/); if (!m || m[1] !== V) throw new Error('sw.js has ' + (m && m[1]));
});
T.check('core.js App.VERSION matches', function () {
  var m = core.match(/App\.VERSION = '([^']+)'/); if (!m || m[1] !== V) throw new Error('core.js has ' + (m && m[1]));
});
T.check('package.json version matches', function () { if (pkg.version !== V) throw new Error('package.json has ' + pkg.version); });
htmls.forEach(function (n) {
  T.check(n + ': every ?v= equals ' + V, function () {
    var bad = []; read(n).replace(/\?v=([0-9.]+)/g, function (a, v) { if (v !== V) bad.push(a); });
    if (bad.length) throw new Error(bad.length + ' stale: ' + bad.slice(0, 4).join(', '));
  });
  T.check(n + ': every local script/css has ?v= and exists', function () {
    var probs = [], re = /<(?:script|link)[^>]+(?:src|href)="([^"]+\.(?:js|css))(\?[^"]*)?"/g, m, html = read(n);
    while ((m = re.exec(html))) {
      if (/^https?:/.test(m[1])) continue;
      if (!fs.existsSync(path.join(root, m[1]))) probs.push('missing ' + m[1]);
      if (!/\?v=/.test(m[2] || '') && m[1] !== 'config.js') probs.push('no ?v= on ' + m[1]);
    }
    if (probs.length) throw new Error(probs.join(', '));
  });
});
var assets = (sw.match(/var ASSETS = \[([\s\S]*?)\];/) || [])[1] || '';
var list = []; assets.replace(/'([^']+)'/g, function (a, s) { list.push(s); });
T.check('sw.js ASSETS all exist (' + list.length + ')', function () {
  var miss = list.filter(function (a) { var f = a.replace(/^\.\//, '').split('?')[0]; return f && !fs.existsSync(path.join(root, f)); });
  if (miss.length) throw new Error('missing: ' + miss.join(', '));
});
T.check('every script/css in index.html is in the offline cache', function () {
  var miss = [], re = /<(?:script|link)[^>]+(?:src|href)="([^"]+\.(?:js|css))(?:\?[^"]*)?"/g, m, html = read('index.html');
  while ((m = re.exec(html))) if (!/^https?:/.test(m[1]) && list.indexOf('./' + m[1]) === -1) miss.push(m[1]);
  if (miss.length) throw new Error('not cached offline: ' + miss.join(', '));
});
T.check('no duplicate entries in sw.js ASSETS', function () {
  var seen = {}, d = list.filter(function (a) { if (seen[a]) return true; seen[a] = 1; });
  if (d.length) throw new Error(d.join(', '));
});
T.check('manifest.webmanifest is valid JSON with icons that exist', function () {
  var m = JSON.parse(read('manifest.webmanifest'));
  (m.icons || []).forEach(function (i) { if (!fs.existsSync(path.join(root, i.src.split('?')[0]))) throw new Error('missing icon ' + i.src); });
});
T.check('no test pins a hard-coded app version', function () {
  fs.readdirSync(__dirname).filter(function (n) { return /\.js$/.test(n) && n !== 'check-release.js'; }).forEach(function (n) {
    if (read('test/' + n).indexOf("'" + V + "'") !== -1) throw new Error(n + ' hard-codes ' + V + ' (read version.json instead)');
  });
});
T.done('release consistency v' + V);
