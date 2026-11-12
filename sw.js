/* Forged by Grace service worker — offline support. Bump VERSION after changing files. */
var VERSION = 'fbg-v3.30.16';
var ASSETS = ['./', './index.html', './version.json', './intake.html', './config.js', './js/guard.js', './css/styles.css', './css/app.css', './css/light.css', './js/sports.js', './js/steps.js', './js/exinfo.js', './js/exmedia.js', './js/exdemo.js', './js/rest.js', './js/checkin2.js', './css/checkin2.css', './css/exdemo.css', './js/pet/1-data.js', './js/pet/2-shop.js', './js/pet/3-game.js', './js/pet/4-rewards.js', './js/water.js', './js/clientx.js', './js/cloud.js', './js/join.js', './js/tour.js', './js/healthsync.js', './js/foodtext.js', './js/receipt.js', './js/workoutx.js', './js/pause.js', './js/exnote.js', './js/weekview.js', './js/nutridb.js', './js/foodrate.js', './js/recipes.js', './js/consent.js', './js/photoguide.js', './js/avatar.js', './privacy.html', './css/pet.css', './assets/lands/sinai.webp', './assets/lands/eden.webp', './assets/lands/pastures.webp', './js/data.js', './js/exextra.js', './js/foods.js', './js/foods-db.js', './js/foods-caribbean.js', './js/foods-kippie.js', './js/intake-i18n.js', './js/common.js', './js/i18n.js',
  './js/core.js', './js/views-athlete.js', './js/views-coach.js', './js/scan.js', './js/intake-report.js', './js/intake.js', './js/health.js', './vendor/fflate.min.js', './vendor/zxing-reader.js', './vendor/zxing_reader.wasm', './manifest.webmanifest',
  './icons/icon.svg', './assets/pets/sheep.webp?v=2.7.1', './assets/pets/lamb.webp?v=2.7.1', './assets/pets/dove.webp?v=2.7.1', './assets/pets/lion.webp?v=2.7.1', './assets/pets/donkey.webp?v=2.7.1', './assets/pets/ox.webp?v=2.7.1', './assets/pets/eagle.webp?v=2.7.1', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== VERSION && k !== 'fbg-ocr'; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
// Same-origin only: network first, cache fallback. (AI model files are cached by transformers.js itself.)

var HEALTH_PUSH = 'https://hdcpxmctilthjhdhhixw.supabase.co/rest/v1/rpc/health_push?apikey=sb_publishable_oFIIm1osyVtpV-t9PCjFxA_tkkQ9xUg';
function swHealthPush(href) {
  try {
    var s = String(href || '');
    try { s = decodeURIComponent(s.replace(/\+/g, '%20')); } catch (e) {}
    s = s.replace(/%26/gi, '&').replace(/%3D/gi, '=').replace(/%23/gi, '#').replace(/%3F/gi, '?');
    s = s.replace(/[\r\n\u00a0]+/g, '').replace(/\s*&\s*/g, '&').replace(/\s*=\s*/g, '=');
    s = s.replace(/(&)?k(=)(fbgh_[A-Za-z0-9_-]+)/i, function (_, _a, _b, tok) { return '&k=' + tok; });
    var m = s.match(/[?&#]k=([A-Za-z0-9_-]{20,})/) || s.match(/(fbgh_[A-Za-z0-9_-]{20,})/);
    var tok = m ? String(m[1]).replace(/[^A-Za-z0-9_-]/g, '') : '';
    if (!tok || tok.length < 20) return Promise.resolve();
    function pick(k) { var x = s.match(new RegExp('[?&#]' + k + '=([^&#]*)')); return x ? String(x[1]) : ''; }
    var d = (s.match(/[?&#]d=(\d{4}-\d\d-\d\d)/) || [])[1] || '';
    var steps = pick('steps').replace(/[^\d]/g, ''), kcal = pick('kcal').replace(/[^\d]/g, ''), rhr = pick('rhr').replace(/[^\d]/g, '');
    var weight = pick('weight').replace(/[^\d.,-]/g, ''), fat = pick('fat').replace(/[^\d.,-]/g, '');
    var q = (d ? 'd=' + d : '');
    if (steps) q += '&steps=' + steps; if (kcal) q += '&kcal=' + kcal; if (rhr) q += '&rhr=' + rhr; if (weight) q += '&weight=' + weight; if (fat) q += '&fat=' + fat;
    if (!/steps=|kcal=|weight=|rhr=|fat=/.test(q)) return Promise.resolve();
    var body = JSON.stringify({ p_token: tok, p_q: q });
    return fetch(HEALTH_PUSH, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: body, keepalive: true, mode: 'cors', cache: 'no-store' }).catch(function () {});
  } catch (e) { return Promise.resolve(); }
}
self.addEventListener('fetch', function (e) {
  try {
    if (e.request.method === 'GET' && new URL(e.request.url).origin === location.origin) {
      var us = new URL(e.request.url).search || '';
      if (/[?&](steps|weight|rhr|kcal|fat|k)=/i.test(us) || /%26k%3D/i.test(us) || /fbgh_/.test(us)) e.waitUntil(swHealthPush(e.request.url));
    }
  } catch (err) {}
  // Free OCR engine + language files (Tesseract.js from jsDelivr): cache-first in a cache that survives app updates.
  if (e.request.method === 'GET' && /cdn\.jsdelivr\.net\/npm\/(tesseract|@tesseract)/.test(e.request.url)) {
    e.respondWith(caches.open('fbg-ocr').then(function (c) { return c.match(e.request).then(function (r) { return r || fetch(e.request).then(function (res) { if (res.ok) c.put(e.request, res.clone()); return res; }); }); }));
    return;
  }
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(function (res) {
    var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, copy); }); return res;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('./index.html'); }); }));
});
