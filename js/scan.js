/* Forged by Grace v2 — barcode scanner (Open Food Facts) + AI food photo estimate (on-device, free). */
(function () {
  'use strict';
  var App = window.App, S = App.S, FD = App.FD, esc = App.esc, t = App.t, I = App.I, A = App.acts;

  // ---------------- Open Food Facts lookup (free, no key) ----------------
  App.offLookup = function (code) {
    code = String(code || '').replace(/\D/g, '');
    if (code.length < 8) return Promise.reject(new Error(t('A barcode has 8 or 13 digits.')));
    if (S.barcodes[code]) return Promise.resolve(S.barcodes[code]);
    var url = 'https://world.openfoodfacts.org/api/v0/product/' + code + '.json?fields=product_name,product_name_nl,product_name_en,brands,nutriments,serving_quantity,serving_size,quantity,image_front_small_url';
    return fetch(url, { headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok && r.status !== 404) throw new Error(t('Open Food Facts is not reachable right now.'));
      return r.json();
    }).then(function (j) {
      if (!j || j.status !== 1 || !j.product) { var e = new Error(t('Product not found in Open Food Facts.')); e.notFound = true; e.code = code; throw e; }
      var p = j.product, n = p.nutriments || {};
      function v(k) { var x = n[k + '_100g']; return x == null ? null : Math.round(parseFloat(x) * 10) / 10; }
      var kcal = v('energy-kcal'); if (kcal == null && v('energy') != null) kcal = Math.round(v('energy') / 4.184);
      var name = (S.lang === 'nl' && p.product_name_nl) || p.product_name || p.product_name_en || p.product_name_nl || ('#' + code);
      var f = { id: 'bc:' + code, code: code, en: name, nl: p.product_name_nl || name, brand: (p.brands || '').split(',')[0], cat: 'scan',
        kcal: kcal || 0, p: v('proteins') || 0, c: v('carbohydrates') || 0, f: v('fat') || 0, sugar: v('sugars'), fiber: v('fiber'), salt: v('salt'),
        g: Math.round(parseFloat(p.serving_quantity)) || 100, serving: Math.round(parseFloat(p.serving_quantity)) || null, portion: p.serving_size || t('100 g'), img: p.image_front_small_url || '', incomplete: kcal == null };
      S.barcodes[code] = f; App.save(); return f;
    });
  };
  App.showProduct = function (f) {
    var note = (f.img ? '<img src="' + esc(f.img) + '" alt="" style="height:56px;border-radius:8px;float:right;margin-left:8px">' : '') + esc(t('From Open Food Facts · barcode {c}', { c: f.code })) + (f.incomplete ? '<br><b>' + esc(t('Calories missing on this product — check the label.')) + '</b>' : '') + (f.sugar != null ? '<br>' + esc(t('Sugar')) + ' ' + f.sugar + ' g · ' + esc(t('Fibre')) + ' ' + (f.fiber != null ? f.fiber : '—') + ' g ' + esc(t('per 100 g')) : '');
    App.portionSheet(f, { src: 'scan', note: note });
  };
  App.lookupAndShow = function (code, statusEl) {
    if (statusEl) statusEl.innerHTML = '<span class="spin"></span> ' + esc(t('Looking up {c}…', { c: code }));
    return App.offLookup(code).then(function (f) { App.closeSheets(); App.showProduct(f); }).catch(function (e) {
      if (statusEl) statusEl.innerHTML = '<span style="color:var(--warn)">' + esc(e.message) + '</span>' + (e.notFound ? ' <button class="link-btn" id="nf-add">' + esc(t('Add it yourself')) + '</button>' : '');
      var b = statusEl && statusEl.querySelector('#nf-add');
      if (b) b.onclick = function () { App.closeSheets(); App.customFoodSheet({ code: e.code, name: '' }); };
    });
  };

  // ---------------- Barcode sheet ----------------
  var stream = null, raf = null, h5 = null;
  function stopCam() {
    if (raf) cancelAnimationFrame(raf); raf = null;
    if (stream) stream.getTracks().forEach(function (x) { x.stop(); }); stream = null;
    if (h5) { try { h5.stop().catch(function () {}); } catch (e) { /* ignore */ } h5 = null; }
  }
  function loadH5() {
    if (window.Html5Qrcode) return Promise.resolve();
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = 'vendor/html5-qrcode.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  function nativeOK() {
    if (!('BarcodeDetector' in window)) return Promise.resolve(false);
    return window.BarcodeDetector.getSupportedFormats().then(function (f) { return f.indexOf('ean_13') !== -1; }).catch(function () { return false; });
  }
  A.scan = function () {
    var live = App.secure() && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    var recent = Object.keys(S.barcodes).slice(-4).reverse();
    var s = App.sheet(App.sheetHead(t('Scan barcode'), t('Products from Open Food Facts — free, worldwide, strong in NL/EU.')) +
      (live ? '<div class="cam" id="cam"><video id="vid" playsinline muted></video><div id="h5box"></div><div class="cam-frame"></div><button class="btn sm cam-start" id="cam-go">' + I.camera + esc(t('Start camera')) + '</button></div>'
            : '<p class="suggest">' + esc(t('Live camera scanning needs the online (https) version of the app. You can still take a photo of the barcode or type the number.')) + '</p>') +
      '<div class="grid2" style="margin-top:10px"><label class="btn">' + I.camera + esc(t('Photo of barcode')) + '<input type="file" id="bc-file" accept="image/*" capture="environment" hidden></label><button class="btn" id="bc-type">' + I.edit + esc(t('Type number')) + '</button></div>' +
      '<form id="bc-form" class="row" style="margin-top:10px"><input class="input grow" id="bc-num" inputmode="numeric" placeholder="8710398…" aria-label="' + esc(t('Barcode number')) + '"><button class="btn primary">' + esc(t('Look up')) + '</button></form>' +
      '<p class="small" id="bc-status" aria-live="polite"></p>' +
      (recent.length ? '<h3 class="h3" style="margin-top:8px">' + esc(t('Recently scanned')) + '</h3><div class="list">' + recent.map(function (c) { var f = S.barcodes[c]; return '<button class="list-item" data-bc="' + c + '"><div class="grow"><b class="ell">' + esc(App.foodName(f)) + '</b><div class="tiny muted">' + esc(f.brand || '') + ' · ' + f.kcal + ' kcal/100 g</div></div><span class="chev">›</span></button>'; }).join('') + '</div>' : ''),
      { onClose: stopCam });
    var st = s.el.querySelector('#bc-status');
    function found(code) { stopCam(); if (navigator.vibrate) navigator.vibrate(80); s.el.querySelector('#bc-num').value = code; App.lookupAndShow(code, st); }
    s.el.querySelector('#bc-form').onsubmit = function (e) { e.preventDefault(); var c = s.el.querySelector('#bc-num').value.trim(); if (c) App.lookupAndShow(c, st); };
    s.el.querySelector('#bc-type').onclick = function () { s.el.querySelector('#bc-num').focus(); };
    s.el.querySelectorAll('[data-bc]').forEach(function (b) { b.onclick = function () { App.closeSheets(); App.showProduct(S.barcodes[b.dataset.bc]); }; });
    s.el.querySelector('#bc-file').onchange = function (e) {
      var file = e.target.files[0]; if (!file) return;
      st.innerHTML = '<span class="spin"></span> ' + esc(t('Reading barcode…'));
      App.decodeBarcodeImage(file).then(function (code) { if (code) found(code); else st.textContent = t('No barcode found in the photo. Try closer, sharp and well lit — or type the number.'); })
        .catch(function () { st.textContent = t('No barcode found in the photo. Try closer, sharp and well lit — or type the number.'); });
    };
    var go = s.el.querySelector('#cam-go');
    if (go) go.onclick = function () {
      go.hidden = true; st.textContent = t('Point the camera at the barcode…');
      nativeOK().then(function (ok) {
        if (ok) {
          var det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] }), vid = s.el.querySelector('#vid');
          return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function (ms) {
            stream = ms; vid.srcObject = ms; vid.play();
            (function loop() { if (!stream) return; det.detect(vid).then(function (r) { if (r.length) found(r[0].rawValue); else raf = requestAnimationFrame(loop); }).catch(function () { raf = requestAnimationFrame(loop); }); })();
          });
        }
        return loadH5().then(function () {
          s.el.querySelector('#vid').hidden = true;
          h5 = new window.Html5Qrcode('h5box', { formatsToSupport: [9, 10, 14, 15], verbose: false });
          return h5.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 260, height: 120 } }, function (txt) { found(txt); }, function () {});
        });
      }).catch(function (err) { go.hidden = false; st.textContent = t('Camera not available') + ': ' + ((err && err.message) || err) + '. ' + t('Use a photo or type the number.'); });
    };
  };
  App.decodeBarcodeImage = function (file) {
    return nativeOK().then(function (ok) {
      if (ok) return createImageBitmap(file).then(function (bmp) { return new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] }).detect(bmp); }).then(function (r) { return r.length ? r[0].rawValue : null; });
      return loadH5().then(function () {
        var div = document.getElementById('h5file') || Object.assign(document.createElement('div'), { id: 'h5file', hidden: true });
        if (!div.parentNode) document.body.appendChild(div);
        var q = new window.Html5Qrcode('h5file', { formatsToSupport: [9, 10, 14, 15], verbose: false });
        return q.scanFile(file, false).then(function (r) { q.clear(); return r; });
      });
    });
  };

  // ---------------- AI photo estimate ----------------
  // Free on-device model: Swin transformer fine-tuned on Food-101 (ONNX), run in the browser with transformers.js.
  var TJS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/dist/transformers.min.js';
  var MODEL = 'onnx-community/swin-finetuned-food101-ONNX';
  var pipe = null, loading = null;
  App.loadFoodModel = function (onProgress) {
    if (pipe) return Promise.resolve(pipe);
    if (loading) return loading;
    loading = import(TJS).then(function (T) {
      T.env.allowLocalModels = false;
      var files = {};
      return T.pipeline('image-classification', MODEL, { dtype: 'q8', progress_callback: function (p) {
        if (p.status === 'progress' && p.total) { files[p.file] = [p.loaded, p.total]; var a = 0, b = 0; Object.keys(files).forEach(function (k) { a += files[k][0]; b += files[k][1]; }); if (onProgress) onProgress(a / b, b); }
      } });
    }).then(function (p) { pipe = p; S.modelReady = true; App.save(); return p; }).catch(function (e) { loading = null; throw e; });
    return loading;
  };
  App.classifyFood = function (dataUrl) { return App.loadFoodModel().then(function (p) { return p(dataUrl, { top_k: 5 }); }); };
  App.prettyLabel = function (l) { return String(l).replace(/_/g, ' ').replace(/^\w/, function (c) { return c.toUpperCase(); }); };
  App.f101Food = function (label) {
    var m = FD.F101[label]; if (!m) return null;
    return { id: 'f101:' + label, en: App.prettyLabel(label), nl: App.prettyLabel(label), cat: 'meal', kcal: m[0], p: m[1], c: m[2], f: m[3], g: m[4], portion: t('typical plate') };
  };
  A.photo = function () {
    var s = App.sheet(App.sheetHead(t('AI food photo'), t('Snap your plate. The AI guesses the dish, you pick the portion — always an estimate.')) +
      '<label class="photo-drop" id="ph-drop"><input type="file" id="ph-file" accept="image/*" capture="environment" hidden><div id="ph-prev">' + I.camera + '<b>' + esc(t('Take or choose a photo')) + '</b></div></label>' +
      '<div id="ph-out" aria-live="polite"></div>' +
      '<p class="tiny muted" style="margin-top:10px">' + esc(t('Runs on your phone with a free AI model (Food-101, 101 dishes). First use downloads ~90 MB once — use Wi-Fi. Photos are not uploaded anywhere.')) + '</p>');
    var out = s.el.querySelector('#ph-out'), photo = null;
    s.el.querySelector('#ph-file').onchange = function (e) {
      var file = e.target.files[0]; if (!file) return;
      App.resizeImage(file, 384, 0.8).then(function (url) {
        photo = url;
        s.el.querySelector('#ph-prev').innerHTML = '<img src="' + url + '" alt="">';
        out.innerHTML = '<div class="card"><div class="row"><span class="spin"></span><div class="grow"><b id="ph-st">' + esc(S.modelReady ? t('Analysing…') : t('Downloading AI model (one time)…')) + '</b><div class="bar-track" style="margin-top:8px"><div class="bar-fill" id="ph-bar" style="width:3%"></div></div></div></div></div>';
        App.loadFoodModel(function (p) { var b = s.el.querySelector('#ph-bar'); if (b) b.style.width = Math.max(3, p * 100).toFixed(0) + '%'; })
          .then(function () { var st = s.el.querySelector('#ph-st'); if (st) st.textContent = t('Analysing…'); return App.classifyFood(url); })
          .then(function (res) { showGuesses(res); })
          .catch(function (err) { console.warn('food model', err); fallback(t('The AI model could not load here') + ' (' + ((err && err.message) || 'offline') + ').'); });
      });
    };
    function showGuesses(res) {
      var top = res[0] || { score: 0 };
      var conf = top.score >= 0.6 ? ['good', t('fairly sure')] : top.score >= 0.3 ? ['warn', t('not sure')] : ['bad', t('guess')];
      out.innerHTML = '<h3 class="h3" style="margin-top:12px">' + esc(t('Looks like…')) + ' <span class="pill ' + conf[0] + '">' + esc(conf[1]) + '</span></h3><div class="list">' + res.slice(0, 3).map(function (r, i) {
        var f = App.f101Food(r.label); if (!f) return '';
        return '<button class="list-item" data-l="' + esc(r.label) + '"><div class="grow"><b>' + esc(f.en) + '</b><div class="tiny muted">' + Math.round(r.score * 100) + '% · ≈' + Math.round(f.kcal * f.g / 100) + ' kcal ' + esc(t('per typical plate')) + '</div></div><span class="chev">›</span></button>'; }).join('') +
        '<button class="list-item" data-act="ph-db"><div class="grow"><b>' + esc(t('None of these — pick from food list')) + '</b></div><span class="chev">›</span></button></div>';
      out.querySelectorAll('[data-l]').forEach(function (b) { b.onclick = function () { pickPortion(App.f101Food(b.dataset.l), res[0] && res[0].score); }; });
      A['ph-db'] = dbPick;
    }
    function pickPortion(f, score) {
      App.portionSheet(f, { src: 'photo', extra: { photo: photo, est: true }, cta: t('Add estimate to log'),
        note: esc(t('AI estimate: dish recognition + typical macros. Real calories depend on portion, oil and sauce — adjust the grams. Accuracy is roughly ±25-40%.')) });
    }
    function dbPick() { App.foodSearchSheet(function (fd) { App.portionSheet(fd, { src: 'photo', extra: { photo: photo }, note: esc(t('Photo saved with this log entry.')) }); }, t('What is on the plate?')); }
    function fallback(msg) {
      out.innerHTML = '<p class="suggest">' + esc(msg) + ' ' + esc(t('You can still log it: pick the food and portion, the photo is saved with the entry.')) + '</p><button class="btn primary block" id="ph-fb">' + I.search + esc(t('Pick food + portion')) + '</button>';
      out.querySelector('#ph-fb').onclick = dbPick;
    }
  };
})();
