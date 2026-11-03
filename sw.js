/* Forged by Grace service worker — offline support. Bump VERSION after changing files. */
var VERSION = 'fbg-v3.9.0';
var ASSETS = ['./', './index.html', './version.json', './intake.html', './config.js', './css/styles.css', './css/app.css', './css/light.css', './js/sports.js', './js/steps.js', './js/exinfo.js', './js/exdemo.js', './js/rest.js', './js/checkin2.js', './css/checkin2.css', './css/exdemo.css', './js/pet/1-data.js', './js/pet/2-shop.js', './js/pet/3-game.js', './js/pet/4-rewards.js', './js/water.js', './js/clientx.js', './js/cloud.js', './js/join.js', './css/pet.css', './assets/lands/sinai.webp', './assets/lands/eden.webp', './assets/lands/pastures.webp', './js/data.js', './js/foods.js', './js/foods-db.js', './js/intake-i18n.js', './js/common.js', './js/i18n.js',
  './js/core.js', './js/views-athlete.js', './js/views-coach.js', './js/scan.js', './js/intake-report.js', './js/intake.js', './js/health.js', './vendor/fflate.min.js', './vendor/zxing-reader.js', './vendor/zxing_reader.wasm', './manifest.webmanifest',
  './icons/icon.svg', './assets/pets/sheep.webp?v=2.7.1', './assets/pets/lamb.webp?v=2.7.1', './assets/pets/dove.webp?v=2.7.1', './assets/pets/lion.webp?v=2.7.1', './assets/pets/donkey.webp?v=2.7.1', './assets/pets/ox.webp?v=2.7.1', './assets/pets/eagle.webp?v=2.7.1', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
// Same-origin only: network first, cache fallback. (AI model files are cached by transformers.js itself.)
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(function (res) {
    var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, copy); }); return res;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('./index.html'); }); }));
});
