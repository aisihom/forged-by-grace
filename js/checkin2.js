/* Forged by Grace v3.1 — weekly check-in photos (IndexedDB) + weight, compare, share; reminders (banner, notifications, .ics). */
(function () {
  'use strict';
  var App = window.App, S = App.S, F = App.F, esc = App.esc, t = App.t, I = App.I, V = App.views, A = App.acts;
  function me() { return S.me; }
  var POSES = [['front', 'Voorkant'], ['left', 'Linkerkant'], ['right', 'Rechterkant'], ['back', 'Achterkant']];
  // ---------- IndexedDB ----------
  var dbp = null;
  function db() {
    if (!dbp) dbp = new Promise(function (res, rej) { var r = indexedDB.open('fbg-photos', 1); r.onupgradeneeded = function () { r.result.createObjectStore('p', { keyPath: 'id' }); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; });
    return dbp;
  }
  function tx(mode, fn) { return db().then(function (d) { return new Promise(function (res, rej) { var x = d.transaction('p', mode), st = x.objectStore('p'), out = fn(st); x.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); }; x.onerror = function () { rej(x.error); }; }); }); }
  App.photoPut = function (rec) { return tx('readwrite', function (st) { st.put(rec); }); };
  App.photoGet = function (id) { return tx('readonly', function (st) { return st.get(id); }); };
  App.photoDel = function (id) { return tx('readwrite', function (st) { st.delete(id); }); };
  var urls = {};
  App.photoURL = function (id) { if (urls[id]) return Promise.resolve(urls[id]); return App.photoGet(id).then(function (r) { if (!r) return ''; urls[id] = URL.createObjectURL(r.blob); return urls[id]; }); };
  App.photoIdFromPath = function (path) { return String(path || '').split('/').pop().replace(/\.jpg$/i, ''); };
  App.isCheckinPhotoName = function (name) { return /^ph-\d{4}-\d{2}-\d{2}-(front|left|right|back|side)-[A-Za-z0-9]+(\.jpg)?$/i.test(String(name || '').split('/').pop() || ''); };
  App.safeCheckinPath = function (folderId, idOrPath) {
    var id = App.photoIdFromPath(idOrPath);
    if (!folderId || /[\/]/.test(String(folderId)) || !App.isCheckinPhotoName(id)) return '';
    return folderId + '/' + id + '.jpg';
  };
  App.ownStorageId = function () { var st = App.cloud && App.cloud.state && App.cloud.state(); return (st && st.client) || null; };
  App.shouldUploadPhoto = function (id, cloudPh, photoGone) {
    if (!id) return false;
    if (cloudPh && (cloudPh[id] || cloudPh[id + '.jpg'])) return false;
    if (photoGone && (photoGone[id] || photoGone[id + '.jpg'])) return false;
    return true;
  };
  App.markPhotoGone = function (id) {
    id = App.photoIdFromPath(id); if (!id) return;
    var gone = (S.me.photoGone = S.me.photoGone || {}); gone[id] = 1;
  };
  App.applyPhotoGone = function (ath) {
    ath = ath || S.me; var gone = ath.photoGone || {}, changed = false;
    (ath.photoLog || []).forEach(function (e) {
      Object.keys(e.poses || {}).forEach(function (p) {
        var id = e.poses[p];
        if (id && (gone[id] || gone[id + '.jpg'])) {
          delete e.poses[p]; if (App.photoDel) App.photoDel(id);
          if (urls[id]) { try { URL.revokeObjectURL(urls[id]); } catch (err) {} delete urls[id]; }
          changed = true;
        }
      });
    });
    if (changed) ath.photoLog = (ath.photoLog || []).filter(function (e) { return Object.keys(e.poses || {}).length || e.weight; });
    return changed;
  };
  App.removeStoredCheckinPhoto = function (folderId, id) {
    var path = App.safeCheckinPath(folderId, id), store = App.cloud && App.cloud.sb;
    if (!path) return Promise.reject(new Error('Ongeldige foto'));
    if (App.forgetCheckinPhoto) App.forgetCheckinPhoto(path);
    if (!store) return Promise.resolve();
    return store.storage.from('checkin-photos').remove([path]).then(function (r) { if (r.error) throw r.error; });
  };
  App.deleteCheckinPhoto = function (opts) {
    opts = opts || {};
    var id = App.photoIdFromPath(opts.id || opts.path);
    var folderId = opts.folderId;
    if (!id || !App.isCheckinPhotoName(id)) return Promise.reject(new Error('Ongeldige foto'));
    if (opts.asCoach) {
      if (!folderId || !App.safeCheckinPath(folderId, id)) return Promise.reject(new Error('Geen toegang'));
      return App.removeStoredCheckinPhoto(folderId, id);
    }
    var own = App.ownStorageId();
    if (folderId && own && folderId !== own) return Promise.reject(new Error('Geen toegang'));
    folderId = folderId || own;
    App.markPhotoGone(id);
    (S.me.photoLog || []).forEach(function (e) {
      Object.keys(e.poses || {}).forEach(function (k) { if (e.poses[k] === id) delete e.poses[k]; });
    });
    S.me.photoLog = (S.me.photoLog || []).filter(function (e) { return Object.keys(e.poses || {}).length || e.weight; });
    if (urls[id]) { try { URL.revokeObjectURL(urls[id]); } catch (err) {} delete urls[id]; }
    var local = Promise.resolve();
    try { if (App.photoDel) local = Promise.resolve(App.photoDel(id)).catch(function () {}); } catch (e) { local = Promise.resolve(); }
    return local.then(function () { return folderId ? App.removeStoredCheckinPhoto(folderId, id) : null; }).then(function () { App.save(); });
  };
  App.compress = function (file, max, q) {
    max = Math.min(max || 1600, 1600);
    function draw(src, w, h) {
      var k = Math.min(1, max / Math.max(w, h)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
      return new Promise(function (res, rej) { c.toBlob(function (b) { c.width = c.height = 0; b ? res(b) : rej(new Error('Foto omzetten mislukt')); }, 'image/jpeg', q || 0.8); });
    }
    function viaImg() {
      return new Promise(function (res, rej) {
        var u = URL.createObjectURL(file), img = new Image();
        img.onload = function () { draw(img, img.naturalWidth || img.width, img.naturalHeight || img.height).then(function (b) { URL.revokeObjectURL(u); res(b); }, function (e) { URL.revokeObjectURL(u); rej(e); }); };
        img.onerror = function () { URL.revokeObjectURL(u); rej(new Error('Dit fotoformaat kan niet geopend worden')); };
        img.src = u;
      });
    }
    if (!file) return Promise.reject(new Error('Geen foto gekozen'));
    if (window.createImageBitmap) return createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (bm) { return draw(bm, bm.width, bm.height).then(function (b) { if (bm.close) bm.close(); return b; }); }).catch(viaImg);
    return viaImg();
  };
  // iOS-safe picker: input in DOM (visually hidden), capture only for camera, value cleared after pick
  App.pickImage = function (camera, cb) {
    var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,image/heic,image/heif';
    if (camera) i.setAttribute('capture', 'environment');
    i.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0';
    document.body.appendChild(i);
    i.onchange = function () { var f = i.files && i.files[0]; i.value = ''; setTimeout(function () { i.remove(); }, 1000); if (f) cb(f); };
    i.click();
  };
  App.photoBtns = function (pfx) { return '<div class="grid2"><button type="button" class="btn primary" id="' + pfx + '-cam">📷 Camera</button><button type="button" class="btn" id="' + pfx + '-lib">🖼️ Uit foto\u2019s kiezen</button></div>'; };
  function log(ath) { return (ath.photoLog = ath.photoLog || []); }
  function hydrate(root) { root.querySelectorAll('img[data-pid]').forEach(function (im) { App.photoURL(im.dataset.pid).then(function (u) { if (u) im.src = u; }); }); }
  App.hydratePhotos = hydrate;
  // ---------- Check-in sheet: photos + weight ----------
  A['ci-photos'] = function () {
    var ath = me(), last = ath.body.filter(function (b) { return b.weight; }).pop() || {}, picked = {};
    var s = App.sheet(App.sheetHead('Week check-in: foto\u2019s + gewicht', 'Maak 3 foto\u2019s in hetzelfde licht en dezelfde houding. Ze blijven op deze telefoon.') +
      '<div class="grid2"><label class="field"><span class="label">' + esc(t('Weight (kg)')) + '</span><input class="input" id="cw" inputmode="decimal" value="' + esc(last.weight || '') + '"></label><label class="field"><span class="label">' + esc(t('Waist (cm)')) + ' <span class="opt">' + esc(t('optional')) + '</span></span><input class="input" id="cwa" inputmode="decimal"></label></div>' +
      '<div class="ci-poses">' + POSES.map(function (p) { return '<label class="ci-pose" data-pose="' + p[0] + '"><div class="ci-ph"><span>📷</span></div><b>' + p[1] + '</b><input type="file" accept="image/*" data-pose="' + p[0] + '" hidden></label>'; }).join('') + '</div>' +
      '<p class="tiny muted">Tip: tik op een vak \u2192 <b>Take Photo</b> of <b>Photo Library</b>.</p><button class="btn primary lg block" id="ci-save">' + esc(t('Save')) + '</button>');
    s.el.querySelectorAll('input[type=file]').forEach(function (inp) {
      inp.onchange = function () {
        var f = inp.files[0]; inp.value = ''; if (!f) return; var box = inp.parentNode.querySelector('.ci-ph'); box.innerHTML = '<span>…</span>';
        App.compress(f, 1080, 0.8).then(function (b) { picked[inp.dataset.pose] = b; box.innerHTML = '<img alt="" src="' + URL.createObjectURL(b) + '">'; }).catch(function (e) { box.innerHTML = '<span>⚠️</span>'; App.toast('⚠️ Foto kon niet geladen worden: ' + (e && e.message || '')); });
      };
    });
    s.el.querySelector('#ci-save').onclick = function () {
      var w = App.num(s.el.querySelector('#cw').value), wa = App.num(s.el.querySelector('#cwa').value), iso = App.today(), ks = Object.keys(picked);
      if (!w && !ks.length) return App.toast('Vul je gewicht in of maak een foto');
      var entry = log(ath).filter(function (x) { return x.date === iso; })[0];
      if (!entry) { entry = { date: iso, poses: {} }; log(ath).push(entry); log(ath).sort(function (a, b) { return a.date < b.date ? -1 : 1; }); }
      if (w) entry.weight = w;
      Promise.all(ks.map(function (k) { var id = 'ph-' + iso + '-' + k + '-' + Date.now().toString(36); var old = entry.poses[k]; entry.poses[k] = id; return App.photoPut({ id: id, date: iso, pose: k, blob: picked[k] }).then(function () { if (old) return App.photoDel(old); }); })).then(function () {
        if (w || wa) { var b = ath.body.filter(function (x) { return x.date === iso; })[0]; if (!b) { b = { date: iso }; ath.body.push(b); ath.body.sort(function (a, c) { return a.date < c.date ? -1 : 1; }); } if (w) b.weight = w; if (wa) b.waist = wa; if (w && ath.profile) ath.profile.weight = w; }
        ath.lastMeasure = iso; App.save(); s.close(); App.rerender(); App.toast('Check-in opgeslagen ✓');
      }).catch(function (e) { App.toast('Opslaan mislukt: ' + (e && e.message || e)); });
    };
  };
  // include weekly weight/photo info in coach export
  var origBuild = App.buildCheckin;
  App.buildCheckin = function (ath, note, feel) {
    var o = origBuild.apply(this, arguments), lw = ath.body.filter(function (b) { return b.weight; }).pop(), lp = log(ath).slice(-1)[0];
    o.weight = lw ? [lw.date, lw.weight] : null; o.photos = lp ? [lp.date, Object.keys(lp.poses).length] : null;
    return o;
  };
  // ---------- Progress: history + compare + share ----------
  function thumb(id, cls) { return '<img class="' + (cls || '') + '" data-pid="' + esc(id) + '" alt="">'; }
  var origProg = V.progress;
  V.progress = function () {
    var h = origProg.apply(this, arguments), L = log(me());
    var sec = '<div class="section"><div class="section-head"><h2 class="h2">Check-in foto\u2019s</h2><button class="btn sm primary" data-act="ci-photos">📷 Nieuwe check-in</button></div>' +
      (L.length ? '<div class="ph-hist">' + L.slice().reverse().map(function (e) {
        return '<div class="card ph-row"><div class="row between"><b>' + esc(F.fmtDay(e.date)) + '</b><span class="small">' + (e.weight ? e.weight + ' kg' : '') + '</span></div><div class="ph-3">' + POSES.map(function (p) { return e.poses[p[0]] ? '<button class="ph-t" data-act="ph-view" data-id="' + esc(e.poses[p[0]]) + '" data-d="' + e.date + '" data-p="' + p[0] + '">' + thumb(e.poses[p[0]]) + '<span>' + p[1] + '</span></button>' : '<div class="ph-t empty"><span>' + p[1] + '</span></div>'; }).join('') + '</div></div>'; }).join('') + '</div>' +
        (L.length > 1 ? '<button class="btn block" data-act="ph-compare" style="margin-top:10px">↔️ Vergelijk naast elkaar</button>' : '')
        : '<p class="muted small">Nog geen foto\u2019s. Tik op <b>Nieuwe check-in</b> voor voor-, zij- en achterkant.</p>') + '</div>';
    var mk = '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Progress photos'));
    h = h.indexOf(mk) !== -1 ? h.replace(mk, sec + mk) : h + sec;
    setTimeout(function () { var v = document.getElementById('view'); if (v) hydrate(v); });
    return h;
  };
  function shareIds(ids, title) {
    return Promise.all(ids.map(App.photoGet)).then(function (rs) {
      var files = rs.filter(Boolean).map(function (r) { return new File([r.blob], 'forged-by-grace-' + r.date + '-' + r.pose + '.jpg', { type: 'image/jpeg' }); });
      if (navigator.canShare && navigator.canShare({ files: files })) return navigator.share({ files: files, title: title, text: title }).catch(function () {});
      files.forEach(function (f) { var a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); });
      App.toast('Delen niet ondersteund \u2014 foto\u2019s gedownload');
    });
  }
  App.sharePhotos = shareIds;
  A['ph-view'] = function (el) {
    var e = log(me()).filter(function (x) { return x.date === el.dataset.d; })[0];
    var s = App.sheet(App.sheetHead(F.fmtDay(el.dataset.d), (e && e.weight ? e.weight + ' kg' : '')) + '<div class="ph-big">' + thumb(el.dataset.id) + '</div>' +
      '<div class="row" style="margin-top:12px"><button class="btn grow" id="ph-sh1">' + I.share + 'Deel foto</button><button class="btn grow" id="ph-sh3">' + I.share + 'Deel alle 3</button><button class="btn danger sm" id="ph-del">Verwijder</button></div>');
    hydrate(s.el);
    s.el.querySelector('#ph-sh1').onclick = function () { shareIds([el.dataset.id], 'Check-in ' + el.dataset.d); };
    s.el.querySelector('#ph-sh3').onclick = function () { shareIds(Object.keys(e.poses).map(function (k) { return e.poses[k]; }), 'Check-in ' + el.dataset.d); };
    s.el.querySelector('#ph-del').onclick = function () {
      App.confirm('Foto verwijderen?', 'Dit kan niet ongedaan worden. Je kunt daarna een nieuwe maken.', 'Verwijder', true).then(function (ok) {
        if (!ok) return;
        App.deleteCheckinPhoto({ id: el.dataset.id, date: el.dataset.d, pose: el.dataset.p, folderId: App.ownStorageId() }).then(function () {
          App.closeSheets(); App.rerender(); App.toast('Foto verwijderd');
        }).catch(function (err) { App.toast('⚠️ ' + (err && err.message || err)); });
      });
    };
  };
  A['ph-compare'] = function () {
    var L = log(me()), a = L[0], b = L[L.length - 1], pose = 'front';
    function opts(sel) { return L.map(function (e) { return '<option value="' + e.date + '"' + (e.date === sel ? ' selected' : '') + '>' + esc(F.fmtDay(e.date)) + (e.weight ? ' · ' + e.weight + ' kg' : '') + '</option>'; }).join(''); }
    var s = App.sheet(App.sheetHead('Vergelijk', 'Kies twee data en een houding') + '<div class="grid2"><select class="input" id="pc-a">' + opts(a.date) + '</select><select class="input" id="pc-b">' + opts(b.date) + '</select></div>' +
      '<div class="seg" id="pc-p" style="margin:10px 0">' + POSES.map(function (p) { return '<button type="button" data-v="' + p[0] + '"' + (p[0] === pose ? ' class="on"' : '') + '>' + p[1] + '</button>'; }).join('') + '</div><div class="ph-cmp" id="pc-out"></div><button class="btn block" id="pc-share" style="margin-top:10px">' + I.share + 'Deel vergelijking</button>');
    function get(d) { return L.filter(function (e) { return e.date === d; })[0]; }
    function render() {
      var A1 = get(s.el.querySelector('#pc-a').value), B1 = get(s.el.querySelector('#pc-b').value), dw = A1.weight && B1.weight ? Math.round((B1.weight - A1.weight) * 10) / 10 : null;
      s.el.querySelector('#pc-out').innerHTML = [A1, B1].map(function (e) { return '<figure>' + (e.poses[pose] ? thumb(e.poses[pose]) : '<div class="ph-t empty"><span>Geen foto</span></div>') + '<figcaption>' + esc(F.fmtDay(e.date)) + (e.weight ? '<br><b>' + e.weight + ' kg</b>' : '') + '</figcaption></figure>'; }).join('') +
        (dw != null ? '<p class="ph-dw">' + (dw > 0 ? '+' : '') + dw + ' kg</p>' : '');
      hydrate(s.el);
    }
    s.el.querySelector('#pc-a').onchange = render; s.el.querySelector('#pc-b').onchange = render;
    s.el.querySelectorAll('#pc-p button').forEach(function (x) { x.onclick = function () { pose = x.dataset.v; s.el.querySelectorAll('#pc-p button').forEach(function (y) { y.classList.toggle('on', y === x); }); render(); }; });
    s.el.querySelector('#pc-share').onclick = function () { var ids = [get(s.el.querySelector('#pc-a').value), get(s.el.querySelector('#pc-b').value)].map(function (e) { return e.poses[pose]; }).filter(Boolean); if (ids.length) shareIds(ids, 'Vergelijking'); };
    render();
  };

  // ---------- Reminders ----------
  function R() { var ath = me(); return (ath.rem = ath.rem || { macros: true, weekly: true, day: 0, hour: 18 }); }
  function weekDone(ath) { var from = App.isoAdd(App.today(), -6); return log(ath).some(function (e) { return e.date >= from && (e.weight || Object.keys(e.poses).length); }) || ath.body.some(function (b) { return b.date >= from && b.weight; }); }
  App.reminderState = function (now) {
    now = now || new Date();
    var ath = me(); if (!ath || !ath.profile || S.role === 'coach') return [];
    var r = R(), out = [], T = App.athTargets(ath), tot = App.dayTotals(App.foodDay(ath));
    if (r.macros && now.getHours() >= r.hour) {
      var kOk = tot.kcal >= T.kcal * 0.9, pOk = tot.p >= T.p * 0.9;
      if (!kOk || !pOk) out.push({ k: 'macros', title: 'Haal je macro\u2019s vandaag 💪', text: 'Nog te gaan: ' + (kOk ? '' : Math.max(0, Math.round(T.kcal - tot.kcal)) + ' kcal') + (!kOk && !pOk ? ' · ' : '') + (pOk ? '' : Math.max(0, Math.round(T.p - tot.p)) + ' g eiwit') + '.', go: '#/food', btn: 'Eten loggen' });
    }
    if (r.weekly && !weekDone(ath)) {
      var dow = now.getDay(), diff = (dow - r.day + 7) % 7; // 0 = check-in day, 1 = follow-up day
      if (diff === 0 || diff === 1) out.push({ k: 'weekly', title: diff ? 'Herinnering: week check-in 📷' : 'Het is check-in dag 📷', text: 'Weeg jezelf en maak je voor-, zij- en achterkantfoto.', act: 'ci-photos', btn: 'Check-in doen' });
    }
    return out;
  };
  App.reminderBanner = function () {
    var L = App.reminderState(), dis = sessionStorage.getItem('fbg.remDismiss.' + App.today()) || '';
    return L.filter(function (x) { return dis.indexOf(x.k) === -1; }).map(function (x) {
      return '<div class="rem-banner" data-k="' + x.k + '"><div class="grow"><b>' + esc(x.title) + '</b><div class="small">' + esc(x.text) + '</div></div>' +
        (x.go ? '<a class="btn sm primary" href="' + x.go + '">' + esc(x.btn) + '</a>' : '<button class="btn sm primary" data-act="' + x.act + '">' + esc(x.btn) + '</button>') + '<button class="icon-btn sm" data-act="rem-x" data-k="' + x.k + '" aria-label="Sluiten">×</button></div>';
    }).join('');
  };
  A['rem-x'] = function (el) { var k = 'fbg.remDismiss.' + App.today(); sessionStorage.setItem(k, (sessionStorage.getItem(k) || '') + ',' + el.dataset.k); var b = el.closest('.rem-banner'); if (b) b.remove(); };
  var origToday = V.today;
  V.today = function () {
    var h = origToday.apply(this, arguments), ban = App.reminderBanner();
    var ci = '<div class="section"><div class="card row"><div class="grow"><b>📷 Foto\u2019s + gewicht</b><div class="small muted">' + (weekDone(me()) ? 'Deze week gedaan ✓' : 'Nog niet gedaan deze week') + '</div></div><button class="btn sm" data-act="ci-photos">Check-in</button><button class="icon-btn" data-act="rem-settings" aria-label="Herinneringen">⏰</button></div></div>';
    var mk = '<div class="section"><div class="card row"><div class="grow"><b>' + esc(t('Weekly check-in'));
    h = h.indexOf(mk) !== -1 ? h.replace(mk, ci + mk) : h + ci;
    if (ban) { var i = h.indexOf('</header>'); h = i !== -1 ? h.slice(0, i + 9) + ban + h.slice(i + 9) : ban + h; }
    return h;
  };
  // local notification while app/PWA is running (no push server)
  function standalone() { return window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches); }
  function notify() {
    if (!window.Notification || Notification.permission !== 'granted') return;
    var L = App.reminderState(), key = 'fbg.remNotified.' + App.today(), done = localStorage.getItem(key) || '';
    L.forEach(function (x) {
      if (done.indexOf(x.k) !== -1) return; done += ',' + x.k; localStorage.setItem(key, done);
      try { navigator.serviceWorker && navigator.serviceWorker.ready ? navigator.serviceWorker.ready.then(function (r) { r.showNotification(x.title, { body: x.text, tag: 'fbg-' + x.k, icon: 'icons/icon-192.png' }); }) : new Notification(x.title, { body: x.text }); } catch (e) {}
    });
  }
  setInterval(function () { notify(); var v = document.getElementById('view'); if (v && location.hash.replace('#', '') in { '/today': 1, '': 1, '/': 1 } && !document.querySelector('.overlay') && App.reminderState().length !== (v.querySelectorAll('.rem-banner').length)) { /* refresh banner at 18:00 */ } }, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { notify(); } });
  setTimeout(notify, 2500);
  // .ics with recurring reminders
  function ics() {
    var r = R(), now = new Date(), days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'], url = location.href.split('#')[0];
    function dt(off, hh) { var d = new Date(now); d.setDate(d.getDate() + off); return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + 'T' + ('0' + hh).slice(-2) + '0000'; }
    function next(dow) { return (dow - now.getDay() + 7) % 7; }
    function ev(uid, start, rule, sum, desc) { return ['BEGIN:VEVENT', 'UID:' + uid + '@forgedbygrace', 'DTSTAMP:' + dt(0, 0) + 'Z', 'DTSTART;TZID=Europe/Amsterdam:' + start, 'DURATION:PT10M', 'RRULE:' + rule, 'SUMMARY:' + sum, 'DESCRIPTION:' + desc + ' ' + url, 'URL:' + url, 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + sum, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT']; }
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Forged by Grace//Reminders//NL', 'CALSCALE:GREGORIAN'];
    if (r.macros) L = L.concat(ev('macros', dt(0, r.hour), 'FREQ=DAILY', 'Forged by Grace: macro\u2019s gehaald?', 'Check je calorie\u00ebn en eiwit van vandaag in de app.'));
    if (r.weekly) { L = L.concat(ev('weekly', dt(next(r.day), 9), 'FREQ=WEEKLY;BYDAY=' + days[r.day], 'Forged by Grace: week check-in 📷', 'Weeg jezelf en maak je voor-, zij- en achterkantfoto.')); L = L.concat(ev('weekly2', dt(next((r.day + 1) % 7), r.hour), 'FREQ=WEEKLY;BYDAY=' + days[(r.day + 1) % 7], 'Forged by Grace: check-in nog niet gedaan?', 'Als je je check-in al gedaan hebt, kun je deze negeren.')); }
    L.push('END:VCALENDAR'); return L.join('\r\n');
  }
  App.reminderICS = ics;
  A['rem-settings'] = function () {
    var r = R(), dn = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'], perm = window.Notification ? Notification.permission : 'unsupported';
    var s = App.sheet(App.sheetHead('Herinneringen', 'Macro\u2019s om ' + r.hour + ':00 en je wekelijkse check-in') +
      '<label class="row field"><input type="checkbox" id="rm-m"' + (r.macros ? ' checked' : '') + '> <span class="grow">Dagelijks ' + r.hour + ':00: macro\u2019s nog niet gehaald</span></label>' +
      '<label class="row field"><input type="checkbox" id="rm-w"' + (r.weekly ? ' checked' : '') + '> <span class="grow">Wekelijks: gewicht + foto\u2019s (en de dag erna als het nog niet gedaan is)</span></label>' +
      '<label class="field"><span class="label">Check-in dag</span><select class="input" id="rm-d">' + dn.map(function (d, i) { return '<option value="' + i + '"' + (i === r.day ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select></label>' +
      '<h3 class="h3" style="margin-top:14px">Melding op je iPhone</h3>' +
      '<div class="card small"><b>1. Agenda-herinneringen (werkt altijd, gratis)</b><p class="muted" style="margin:4px 0 8px">Download het bestand en tik op <b>Add All</b>. Je iPhone geeft dan elke dag om ' + r.hour + ':00 en op je check-in dag een melding.</p><button class="btn primary block" id="rm-ics">📅 Zet herinneringen in mijn agenda</button></div>' +
      '<div class="card small"><b>2. In de app</b><p class="muted" style="margin:4px 0 0">Open je de app na ' + r.hour + ':00, dan zie je bovenaan een melding als je macro\u2019s nog niet gehaald zijn.</p></div>' +
      '<div class="card small"><b>3. Pushmeldingen</b><p class="muted" style="margin:4px 0 8px">' + (standalone() ? (perm === 'granted' ? 'Aan ✓ \u2014 je krijgt een melding zolang de app open of op de achtergrond actief is.' : 'Tik hieronder om meldingen toe te staan.') : 'Alleen mogelijk als je de app op je beginscherm zet: Safari \u2192 <b>Share</b> \u2192 <b>Add to Home Screen</b> (iOS 16.4+). Ook dan komen meldingen alleen als de app actief is; geplande meldingen op de achtergrond kunnen niet zonder server.') + '</p>' + (standalone() && perm === 'default' ? '<button class="btn block" id="rm-n">🔔 Meldingen toestaan</button>' : '') + '</div>' +
      '<details class="card small"><summary><b>4. Alternatief: iPhone Opdrachten (Shortcuts)</b></summary><ol style="padding-left:18px"><li>Open <b>Shortcuts</b> \u2192 <b>Automation</b> \u2192 <b>+</b> \u2192 <b>Time of Day</b> \u2192 ' + r.hour + ':00, <b>Daily</b>, <b>Run Immediately</b>.</li><li>Kies <b>New Blank Automation</b> \u2192 <b>Add Action</b> \u2192 zoek <b>Show Notification</b> \u2192 tekst: \u201cMacro\u2019s gehaald?\u201d.</li><li>Voeg eventueel <b>Open URLs</b> toe met: ' + esc(location.href.split('#')[0]) + '#/food</li><li>Herhaal met <b>Weekly</b> op je check-in dag voor \u201cWeek check-in: gewicht + foto\u2019s\u201d.</li></ol></details>' +
      '<button class="btn primary lg block" id="rm-save" style="margin-top:12px">' + esc(t('Save')) + '</button>');
    function read() { r.macros = s.el.querySelector('#rm-m').checked; r.weekly = s.el.querySelector('#rm-w').checked; r.day = +s.el.querySelector('#rm-d').value; App.save(); }
    s.el.querySelector('#rm-ics').onclick = function () { read(); var b = new Blob([ics()], { type: 'text/calendar' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'forged-by-grace-herinneringen.ics'; document.body.appendChild(a); a.click(); a.remove(); };
    var nb = s.el.querySelector('#rm-n'); if (nb) nb.onclick = function () { Notification.requestPermission().then(function (p) { App.toast(p === 'granted' ? 'Meldingen aan' : 'Meldingen niet toegestaan'); s.close(); }); };
    s.el.querySelector('#rm-save').onclick = function () { read(); s.close(); App.rerender(); App.toast(t('Saved')); };
  };
  // Reminders entry in More
  var origMore = V.more;
  V.more = function () { var h = origMore.apply(this, arguments); if (S.role === 'coach') return h; return '<div class="card row" style="margin-bottom:12px"><div class="grow"><b>⏰ Herinneringen</b><div class="tiny muted">Macro\u2019s om 18:00 · wekelijkse check-in</div></div><button class="btn sm" data-act="rem-settings">Instellen</button></div>' + h; };
})();
