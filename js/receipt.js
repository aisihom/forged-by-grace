/* Forged by Grace v3.14 — "🧾 Screenshot bestelling": order screenshot -> free on-device OCR (Tesseract.js, nld+eng) -> text estimator. */
(function () {
  'use strict';
  var App = window.App, A = App.acts, I = App.I || {}, esc = App.esc, t = App.t;
  var TJS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  var CORE = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1';
  var worker = null, loading = null;
  function loadScript(src) { return new Promise(function (ok, bad) { if (window.Tesseract) return ok(); var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { bad(new Error('offline')); }; document.head.appendChild(s); }); }
  App.ocrWorker = function (onProg) {
    if (worker) return Promise.resolve(worker);
    if (loading) return loading;
    loading = loadScript(TJS).then(function () {
      return window.Tesseract.createWorker(['nld', 'eng'], 1, {
        corePath: CORE, workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
        logger: function (m) { if (onProg && m && typeof m.progress === 'number') onProg(m.status, m.progress); }
      });
    }).then(function (w) { worker = w; return w; }).catch(function (e) { loading = null; throw e; });
    return loading;
  };

  // ---- keep only order item lines ----
  var SKIP = /(bezorg|lever|delivery|service ?kost|servicefee|fee|fooi|tip\b|totaal|total|subtotaal|subtotal|btw|vat|korting|discount|voucher|kortingscode|betaal|betaald|paid|ideal|creditcard|paypal|bestelling|bestelnummer|order ?(nr|number|#)|bedankt|thank|bezorgd|onderweg|status|restaurant|adres|address|straat|telefoon|phone|tel\b|e-?mail|www\.|http|\.nl\b|\.com\b|thuisbezorgd|uber ?eats|deliveroo|just ?eat|minuten|min\b|vandaag|today|gisteren|ophalen|pickup|bon|receipt|klant|opmerking|note|afrekenen|checkout|samenvatting|summary|items?\b|artikelen|aantal\b)/i;
  App.receiptLines = function (raw) {
    var out = [];
    String(raw || '').split(/\r?\n/).forEach(function (line) {
      var l = line.replace(/[|_*•·»«]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (!l || SKIP.test(l)) return;
      if (/\b\d{4} ?[A-Z]{2}\b/.test(l)) return;               // NL postcode
      if (/^\+?\d[\d\s-]{6,}$/.test(l)) return;                  // phone
      if (/\b\d{1,2}[:.]\d{2}\b/.test(l) && !/[€$]|\d+,\d{2}/.test(l)) return; // times
      if (/\b(straat|weg|laan|plein|gracht|kade|singel|dijk)\b\s*\d+/i.test(l)) return;
      var hadPrice = /(€|eur|\$)\s*-?\d|\d+[.,]\d{2}\s*$/.test(l);
      l = l.replace(/(€|eur\b|\$)\s*-?\d+(?:[.,]\d{1,2})?/gi, ' ').replace(/-?\d+[.,]\d{2}\b/g, ' ').replace(/[€$]/g, ' ');
      l = l.replace(/^(\d+)\s*[x×X]\s*/, '$1 ').replace(/\s+[x×]\s*(\d+)$/, ' $1').replace(/\s+/g, ' ').trim();
      if (!/[a-zA-Z]{3,}/.test(l)) return;
      if (!hadPrice && !/^\d+ /.test(l) && l.split(' ').length > 6) return; // long sentences without price/qty
      out.push({ l: l, strong: hadPrice || /^\d+ /.test(l) });
    });
    var strong = out.filter(function (o) { return o.strong; });
    return (strong.length ? strong : out).map(function (o) { return o.l; });
  };

  A['food-shot'] = function () {
    var s = App.sheet(App.sheetHead(t('Order screenshot'), t('Choose a screenshot of your order (Thuisbezorgd, Uber Eats, receipt…). The text is read on your phone — nothing is uploaded.')) +
      '<label class="photo-drop" id="rs-drop"><input type="file" id="rs-file" accept="image/*" hidden><div id="rs-prev">🧾<b>' + esc(t('Choose screenshot')) + '</b></div></label>' +
      '<div id="rs-out" aria-live="polite"></div>' +
      '<p class="tiny muted" style="margin-top:10px">' + esc(t('Free on-device text recognition (Tesseract). First use downloads ~15 MB once — use Wi-Fi.')) + '</p>');
    var out = s.el.querySelector('#rs-out'), thumb = null;
    function showText(txt, note) {
      out.innerHTML = (note ? '<p class="suggest">' + esc(note) + '</p>' : '') +
        '<label class="field" style="margin-top:12px"><span class="label">' + esc(t('Recognised items (edit if needed)')) + '</span><textarea class="input" id="rs-txt" rows="6">' + esc(txt) + '</textarea></label>' +
        '<button class="btn primary lg block" id="rs-go">' + (I.search || '') + esc(t('Estimate macros')) + '</button>';
      out.querySelector('#rs-go').onclick = function () { App.textFoodSheet({ text: out.querySelector('#rs-txt').value, photo: thumb, photoAll: true, src: 'screenshot' }); };
    }
    s.el.querySelector('#rs-file').onchange = function (e) {
      var file = e.target.files[0]; if (!file) return;
      App.resizeImage(file, 220, 0.7).then(function (u) { thumb = u; s.el.querySelector('#rs-prev').innerHTML = '<img src="' + u + '" alt="">'; });
      out.innerHTML = '<div class="card"><div class="row"><span class="spin"></span><div class="grow"><b id="rs-st">' + esc(t('Reading text…')) + '</b><div class="bar-track" style="margin-top:8px"><div class="bar-fill" id="rs-bar" style="width:3%"></div></div></div></div></div>';
      var url = URL.createObjectURL(file);
      App.ocrWorker(function (st, p) { var b = s.el.querySelector('#rs-bar'); if (b) b.style.width = Math.max(3, p * 100).toFixed(0) + '%'; })
        .then(function (w) { return w.recognize(url); })
        .then(function (r) {
          var lines = App.receiptLines(r.data.text);
          showText(lines.join('\n'), lines.length ? '' : t('No order items found. Type them below.'));
        })
        .catch(function (err) { console.warn('ocr', err); showText('', t('Text recognition could not load here. Type what you ordered below.')); })
        .then(function () { URL.revokeObjectURL(url); });
    };
  };

  var NL = { 'Order screenshot': 'Screenshot bestelling', 'Choose a screenshot of your order (Thuisbezorgd, Uber Eats, receipt…). The text is read on your phone — nothing is uploaded.': 'Kies een screenshot van je bestelling (Thuisbezorgd, Uber Eats, bon…). De tekst wordt op je telefoon gelezen — er wordt niets geüpload.',
    'Choose screenshot': 'Kies screenshot', 'Free on-device text recognition (Tesseract). First use downloads ~15 MB once — use Wi-Fi.': 'Gratis tekstherkenning op je telefoon (Tesseract). Eerste keer ±15 MB downloaden — gebruik wifi.',
    'Recognised items (edit if needed)': 'Herkende items (pas aan als nodig)', 'Reading text…': 'Tekst lezen…', 'No order items found. Type them below.': 'Geen items gevonden. Typ ze hieronder.', 'Text recognition could not load here. Type what you ordered below.': 'Tekstherkenning kon niet laden. Typ hieronder wat je bestelde.' };
  var ES = { 'Order screenshot': 'Captura del pedido', 'Choose a screenshot of your order (Thuisbezorgd, Uber Eats, receipt…). The text is read on your phone — nothing is uploaded.': 'Elige una captura de tu pedido (Thuisbezorgd, Uber Eats, ticket…). El texto se lee en tu móvil — no se sube nada.',
    'Choose screenshot': 'Elegir captura', 'Free on-device text recognition (Tesseract). First use downloads ~15 MB once — use Wi-Fi.': 'Reconocimiento de texto gratis en el móvil (Tesseract). La primera vez descarga ~15 MB — usa Wi-Fi.',
    'Recognised items (edit if needed)': 'Elementos reconocidos (edita si hace falta)', 'Reading text…': 'Leyendo texto…', 'No order items found. Type them below.': 'No se encontraron elementos. Escríbelos abajo.', 'Text recognition could not load here. Type what you ordered below.': 'No se pudo cargar el reconocimiento. Escribe abajo lo que pediste.' };
  Object.keys(NL).forEach(function (k) { window.FBG_I18N.nl[k] = window.FBG_I18N.nl[k] || NL[k]; });
  window.FBG_I18N.es = window.FBG_I18N.es || {}; Object.keys(ES).forEach(function (k) { window.FBG_I18N.es[k] = window.FBG_I18N.es[k] || ES[k]; });
})();
