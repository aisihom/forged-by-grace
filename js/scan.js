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
      var f = App.offToFood(j.product, code);
      S.barcodes[code] = f; App.save(); return f;
    });
  };

  App.offToFood = function (p, code) {
    code = code || p.code; var n = p.nutriments || {};
    function v(k) { var x = n[k + '_100g']; return x == null || x === '' ? null : Math.round(parseFloat(x) * 10) / 10; }
    var kcal = v('energy-kcal'); if (kcal == null && v('energy') != null) kcal = Math.round(v('energy') / 4.184);
    var lang = S.lang || 'en';
    var name = p['product_name_' + lang] || p.product_name || p.product_name_en || p.product_name_nl || p.generic_name || ('#' + code);
    var sq = Math.round(parseFloat(p.serving_quantity)) || null;
    return { id: 'bc:' + code, code: code, en: name, nl: p.product_name_nl || name, brand: (p.brands || '').split(',')[0].trim(), cat: 'scan',
      kcal: kcal || 0, p: v('proteins') || 0, c: v('carbohydrates') || 0, f: v('fat') || 0, sugar: v('sugars'), fiber: v('fiber'), salt: v('salt'),
      g: sq && sq < 1500 ? sq : 100, serving: sq, portion: p.serving_size || t('100 g'), qty: p.quantity || '', img: p.image_front_small_url || '', incomplete: kcal == null };
  };
  // ---- Online name search: whole Open Food Facts database (millions of products). NL first, then BE/DE (EU), then the world.
  var OFF_STAGES = [['netherlands', 'Netherlands'], ['belgium', 'Belgium'], ['germany', 'Germany'], ['france', 'France'], ['', 'World']];
  var offCache = {};
  var OFF_FIELDS = 'code,product_name,product_name_nl,product_name_en,product_name_es,generic_name,brands,quantity,nutriments,serving_quantity,serving_size,image_front_small_url,countries_tags';
  function offPage(q, stage, page) {
    var key = stage + '|' + page + '|' + q.toLowerCase();
    if (offCache[key]) return Promise.resolve(offCache[key]);
    try { var ss = sessionStorage.getItem('off:' + key); if (ss) return Promise.resolve(offCache[key] = JSON.parse(ss)); } catch (e) {}
    var url = 'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=24&sort_by=unique_scans_n' +
      '&lc=' + (S.lang || 'en') + '&page=' + page + '&fields=' + OFF_FIELDS + '&search_terms=' + encodeURIComponent(q) +
      (stage ? '&tagtype_0=countries&tag_contains_0=contains&tag_0=en:' + stage : '');
    function attempt(n) {
      return fetch(url, { headers: { Accept: 'application/json' } }).then(function (r) {
        if (!r.ok) { var e = new Error(r.status === 429 ? t('Open Food Facts is busy — wait a few seconds and tap again.') : t('Open Food Facts is not reachable right now.')); e.retry = true; throw e; }
        return r.json();
      }).catch(function (e) {
        // OFF returns 503 pages without CORS headers when busy, which shows up as a network error: retry with back-off.
        if (n < 3 && (e.retry || e instanceof TypeError)) return new Promise(function (res) { setTimeout(res, 1500 * (n + 1)); }).then(function () { return attempt(n + 1); });
        throw (e instanceof TypeError ? new Error(t('Open Food Facts is busy — wait a few seconds and tap again.')) : e);
      });
    }
    return attempt(0).then(function (j) {
      var out = { count: +j.count || 0, items: (j.products || []).filter(function (p) { return p.code && p.nutriments && (p.product_name || p.product_name_nl || p.product_name_en); }).map(function (p) { return App.offToFood(p, p.code); }) };
      offCache[key] = out; try { sessionStorage.setItem('off:' + key, JSON.stringify(out)); } catch (e) {}
      return out;
    });
  }
  // Returns a searcher: next() → Promise<{items, stage, done, total}>; dedupes across stages.
  App.offSearcher = function (q) {
    var si = 0, page = 1, seen = {}, total = 0, done = false;
    function next() {
      if (done) return Promise.resolve({ items: [], done: true });
      var st = OFF_STAGES[si];
      return offPage(q, st[0], page).then(function (r) {
        if (page === 1) total += r.count;
        var items = r.items.filter(function (f) { if (seen[f.code]) return false; seen[f.code] = 1; return true; });
        if (r.items.length < 24 || page * 24 >= r.count) { si++; page = 1; if (si >= OFF_STAGES.length) done = true; } else page++;
        var res = { items: items, stage: st[1], done: done, total: total, nextStage: done ? '' : OFF_STAGES[si][1] };
        if (!items.length && !done) return next();
        return res;
      });
    }
    return { next: next, query: q };
  };
  App.rememberOff = function (f) { if (f && f.code) { S.barcodes[f.code] = S.barcodes[f.code] || f; App.save(); } return S.barcodes[f.code] || f; };
  App.showProduct = function (f) {
    var note = (f.img ? '<img src="' + esc(f.img) + '" alt="" style="height:56px;border-radius:8px;float:right;margin-left:8px">' : '') + esc(t('From Open Food Facts · barcode {c}', { c: f.code })) + (f.incomplete ? '<br><b>' + esc(t('Calories missing on this product — check the label.')) + '</b>' : '') + (f.sugar != null ? '<br>' + esc(t('Sugar')) + ' ' + f.sugar + ' g · ' + esc(t('Fibre')) + ' ' + (f.fiber != null ? f.fiber : '—') + ' g ' + esc(t('per 100 g')) : '');
    App.portionSheet(f, { src: 'scan', note: note });
  };
  App.lookupAndShow = function (code, statusEl) {
    if (statusEl) statusEl.innerHTML = '<span class="spin"></span> ' + esc(t('Looking up {c}…', { c: code }));
    return App.offLookup(code).then(function (f) { App.closeSheets(); App.showProduct(f); }).catch(function (e) {
      if (statusEl) statusEl.innerHTML = '<span style="color:var(--warn)">' + esc(e.message) + '</span>' + (e.notFound ? '<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm primary" id="nf-search">' + esc(t('Search by name')) + '</button><button class="btn sm" id="nf-add">' + esc(t('Add it yourself')) + '</button></div>' : '');
      var sb = statusEl && statusEl.querySelector('#nf-search');
      if (sb) sb.onclick = function () { App.stopBarcodeCam && App.stopBarcodeCam(); App.closeSheets(); App.searchFoodsFor(''); };
      var b = statusEl && statusEl.querySelector('#nf-add');
      if (b) b.onclick = function () { App.closeSheets(); App.customFoodSheet({ code: e.code, name: '' }); };
    });
  };

  // ---------------- Barcode engine ----------------
  // 1) native BarcodeDetector (Android Chrome) 2) zxing-wasm (zxing-cpp, vendored, works on iOS Safari).
  var FORMATS = ['EAN13', 'EAN8', 'UPCA', 'UPCE'];
  var zxReady = null;
  function loadZX() {
    if (zxReady) return zxReady;
    zxReady = new Promise(function (res, rej) {
      if (window.ZXingWASM) return res();
      var s = document.createElement('script'); s.src = 'vendor/zxing-reader.js'; s.onload = res; s.onerror = function () { zxReady = null; rej(new Error('zxing load failed')); }; document.head.appendChild(s);
    }).then(function () {
      var wasmUrl = new URL('vendor/zxing_reader.wasm', location.href).href;
      return window.ZXingWASM.prepareZXingModule({ overrides: { locateFile: function (path, prefix) { return path.slice(-5) === '.wasm' ? wasmUrl : prefix + path; } }, fireImmediately: true });
    }).catch(function (e) { zxReady = null; throw e; });
    return zxReady;
  }
  var nativeDet = null;
  function nativeOK() {
    if (!('BarcodeDetector' in window)) return Promise.resolve(false);
    return window.BarcodeDetector.getSupportedFormats().then(function (f) {
      if (f.indexOf('ean_13') === -1) return false;
      nativeDet = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'].filter(function (x) { return f.indexOf(x) !== -1; }) }); return true;
    }).catch(function () { return false; });
  }
  App.barcodeEngine = function () { return nativeOK().then(function (ok) { if (ok) return 'native'; return loadZX().then(function () { return 'zxing'; }); }); };
  function validCode(c) { c = String(c || '').replace(/\D/g, ''); return c.length >= 8 && c.length <= 14 ? c : null; }
  // decode a canvas with the active engine → code or null
  App.decodeCanvas = function (cv, engine, opts) {
    if (engine === 'native') return nativeDet.detect(cv).then(function (r) { return r.length ? validCode(r[0].rawValue) : null; });
    var ctx = cv.getContext('2d', { willReadFrequently: true }), img = ctx.getImageData(0, 0, cv.width, cv.height);
    return window.ZXingWASM.readBarcodes(img, Object.assign({ formats: FORMATS, tryHarder: true, tryRotate: true, tryInvert: true, tryDownscale: true, maxNumberOfSymbols: 1 }, opts || {}))
      .then(function (r) { var hit = r.filter(function (x) { return x.isValid && x.text; })[0]; return hit ? validCode(hit.text) : null; });
  };
  function drawTo(cv, src, sw, sh, crop, maxW) {
    crop = crop || [0, 0, 1, 1];
    var cw = sw * crop[2], ch = sh * crop[3], k = Math.min(1, maxW / cw);
    cv.width = Math.max(1, Math.round(cw * k)); cv.height = Math.max(1, Math.round(ch * k));
    cv.getContext('2d', { willReadFrequently: true }).drawImage(src, sw * crop[0], sh * crop[1], cw, ch, 0, 0, cv.width, cv.height);
    return cv;
  }

  // ---------------- Barcode sheet ----------------
  var stream = null, timer = null, track = null;
  function stopCam() {
    if (timer) clearTimeout(timer); timer = null;
    if (stream) stream.getTracks().forEach(function (x) { x.stop(); }); stream = null; track = null;
  }
  App.stopBarcodeCam = stopCam;
  A.scan = function () {
    var live = App.secure() && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    var recent = Object.keys(S.barcodes).slice(-4).reverse();
    var s = App.sheet(App.sheetHead(t('Scan barcode'), t('Products from Open Food Facts — free, worldwide, strong in NL/EU.')) +
      (live ? '<div class="cam" id="cam"><video id="vid" playsinline webkit-playsinline muted autoplay></video><div class="cam-frame"></div><button class="btn sm cam-start" id="cam-go">' + I.camera + esc(t('Start camera')) + '</button><button class="btn sm cam-torch" id="cam-torch" hidden>🔦</button></div>'
            : '<p class="suggest">' + esc(t('Live camera scanning needs the online (https) version of the app. You can still take a photo of the barcode or type the number.')) + '</p>') +
      '<p class="small cam-status" id="bc-status" aria-live="polite">' + esc(live ? t('Tap “Start camera”, hold the barcode 10–20 cm away, flat and well lit.') : '') + '</p>' +
      '<div class="grid2" style="margin-top:6px"><label class="btn">' + I.camera + esc(t('Photo of barcode')) + '<input type="file" id="bc-file" accept="image/*" capture="environment" hidden></label><button class="btn" id="bc-type">' + I.edit + esc(t('Type number')) + '</button></div>' +
      '<form id="bc-form" class="row" style="margin-top:10px"><input class="input grow" id="bc-num" inputmode="numeric" placeholder="8710398…" aria-label="' + esc(t('Barcode number')) + '"><button class="btn primary">' + esc(t('Look up')) + '</button></form>' +
      (recent.length ? '<h3 class="h3" style="margin-top:12px">' + esc(t('Recently scanned')) + '</h3><div class="list">' + recent.map(function (c) { var f = S.barcodes[c]; return '<button class="list-item" data-bc="' + c + '"><div class="grow"><b class="ell">' + esc(App.foodName(f)) + '</b><div class="tiny muted">' + esc(f.brand || '') + ' · ' + f.kcal + ' kcal/100 g</div></div><span class="chev">›</span></button>'; }).join('') + '</div>' : ''),
      { onClose: stopCam });
    var st = s.el.querySelector('#bc-status');
    function status(msg, warn) { st.innerHTML = (warn ? '<span style="color:var(--warn)">' : '<span>') + msg + '</span>'; }
    var done = false;
    function found(code) { if (done) return; done = true; stopCam(); if (navigator.vibrate) navigator.vibrate(80); s.el.querySelector('#bc-num').value = code; App.lookupAndShow(code, st); }
    s.el.querySelector('#bc-form').onsubmit = function (e) { e.preventDefault(); var c = s.el.querySelector('#bc-num').value.trim(); if (c) { done = true; stopCam(); App.lookupAndShow(c, st); } };
    s.el.querySelector('#bc-type').onclick = function () { s.el.querySelector('#bc-num').focus(); };
    s.el.querySelectorAll('[data-bc]').forEach(function (b) { b.onclick = function () { App.closeSheets(); App.showProduct(S.barcodes[b.dataset.bc]); }; });
    s.el.querySelector('#bc-file').onchange = function (e) {
      var file = e.target.files[0]; if (!file) return; e.target.value = '';
      stopCam(); done = false;
      status('<span class="spin"></span> ' + esc(t('Reading barcode…')));
      App.decodeBarcodeImage(file).then(function (code) { if (code) found(code); else status(esc(t('No barcode found in the photo. Try closer, sharp and well lit — or type the number.')), true); })
        .catch(function (err) { console.warn('barcode photo', err); status(esc(t('No barcode found in the photo. Try closer, sharp and well lit — or type the number.')), true); });
    };
    var go = s.el.querySelector('#cam-go');
    if (go) go.onclick = function () {
      go.hidden = true; done = false; status('<span class="spin"></span> ' + esc(t('Starting camera…')));
      var vid = s.el.querySelector('#vid');
      vid.setAttribute('playsinline', ''); vid.setAttribute('muted', ''); vid.muted = true; vid.autoplay = true;
      var engineP = App.barcodeEngine();
      navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } })
        .then(function (ms) {
          stream = ms; track = ms.getVideoTracks()[0]; vid.srcObject = ms;
          var caps = (track.getCapabilities && track.getCapabilities()) || {};
          var adv = [];
          if (caps.focusMode && caps.focusMode.indexOf('continuous') !== -1) adv.push({ focusMode: 'continuous' });
          if (adv.length) track.applyConstraints({ advanced: adv }).catch(function () {});
          if (caps.torch) { var tb = s.el.querySelector('#cam-torch'), on = false; tb.hidden = false; tb.onclick = function () { on = !on; track.applyConstraints({ advanced: [{ torch: on }] }).catch(function () {}); tb.classList.toggle('on', on); }; }
          return Promise.all([vid.play().catch(function () {}), engineP]);
        })
        .then(function (r) {
          var engine = r[1], cv = document.createElement('canvas'), n = 0, busy = false;
          // alternate: full frame, centre band (zoomed), full frame
          var crops = [[[0, 0, 1, 1], 1280], [[0.1, 0.3, 0.8, 0.4], 1000], [[0, 0, 1, 1], 800], [[0.2, 0.2, 0.6, 0.6], 1000], [[0.1, 0.3, 0.8, 0.4], 640]];
          function loop() {
            if (!stream || done) return;
            if (busy || !vid.videoWidth) { timer = setTimeout(loop, 120); return; }
            busy = true; n++;
            var cr = crops[n % crops.length];
            drawTo(cv, vid, vid.videoWidth, vid.videoHeight, cr[0], cr[1]);
            App.decodeCanvas(cv, engine).then(function (code) {
              busy = false;
              if (code) return found(code);
              if (n % 8 === 0) status('<span class="spin"></span> ' + esc(t('Scanning… hold steady, fill the frame with the barcode')) + ' <span class="tiny dim">(' + vid.videoWidth + '×' + vid.videoHeight + ' · ' + engine + ')</span>');
              timer = setTimeout(loop, 60);
            }).catch(function (err) { busy = false; console.warn('decode', err); timer = setTimeout(loop, 200); });
          }
          status('<span class="spin"></span> ' + esc(t('Scanning… hold steady, fill the frame with the barcode')));
          loop();
        })
        .catch(function (err) { stopCam(); go.hidden = false; status(esc(t('Camera not available') + ': ' + ((err && err.message) || err) + '. ' + t('Use a photo or type the number.')), true); });
    };
  };
  // Photo of a barcode: works for HEIC on iOS (browser decodes to <img>), tries several sizes + crops.
  function loadImage(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { res(img); setTimeout(function () { URL.revokeObjectURL(url); }, 1000); };
      img.onerror = function () { URL.revokeObjectURL(url); if (window.createImageBitmap) createImageBitmap(file).then(res, rej); else rej(new Error('image')); };
      img.src = url;
    });
  }
  App.decodeBarcodeImage = function (file) {
    return Promise.all([loadImage(file), App.barcodeEngine()]).then(function (r) {
      var img = r[0], engine = r[1], w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, cv = document.createElement('canvas');
      var tries = [[[0, 0, 1, 1], 1280], [[0.1, 0.3, 0.8, 0.4], 1000], [[0, 0, 1, 1], 800], [[0.2, 0.2, 0.6, 0.6], 1000], [[0, 0, 1, 1], 1920], [[0.1, 0.25, 0.8, 0.5], 700], [[0, 0, 1, 1], 640], [[0.25, 0.35, 0.5, 0.3], 800]];
      var i = 0;
      function next() {
        if (i >= tries.length) return null;
        var tr = tries[i++];
        drawTo(cv, img, w, h, tr[0], tr[1]);
        return App.decodeCanvas(cv, engine).then(function (c) { return c || next(); }, function () { return next(); });
      }
      return next();
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
