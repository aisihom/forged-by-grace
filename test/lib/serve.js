'use strict';
// Tiny static file server for tests (no dependencies).
var http = require('http'), fs = require('fs'), path = require('path');
var TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.wasm': 'application/wasm' };
module.exports = function serve(root) {
  return new Promise(function (resolve) {
    var srv = http.createServer(function (req, res) {
      var p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
      if (p.endsWith('/')) p += 'index.html';
      var f = path.join(root, p);
      if (f.indexOf(root) !== 0) { res.writeHead(403); return res.end(); }
      fs.readFile(f, function (err, buf) {
        if (err) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(buf);
      });
    });
    srv.listen(0, '127.0.0.1', function () { resolve({ url: 'http://127.0.0.1:' + srv.address().port + '/', close: function () { srv.close(); } }); });
  });
};
