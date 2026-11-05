/* FBG v3.26 — guided 4-angle progress photos (client) + side-by-side compare (coach). Photos: IndexedDB → private bucket checkin-photos/<clientId>/ph-<date>-<pose>-<x>.jpg (RLS). */
(function () {
  'use strict';
  var App = window.App, S = App.S, esc = App.esc, t = App.t, A = App.acts, V = App.views, F = App.F;
  var NL = {
    'Cancel': 'Annuleren', 'Progress photos': 'Voortgangsfoto\u2019s', 'Front': 'Voorkant', 'Left side': 'Linkerkant', 'Right side': 'Rechterkant', 'Rear view': 'Achterkant',
    'Take or upload photo': 'Foto maken of uploaden', 'Retake': 'Opnieuw', 'Next': 'Volgende', 'Back step': 'Terug', 'Skip': 'Overslaan', 'Save check-in': 'Check-in opslaan',
    'Face the camera.': 'Kijk recht naar de camera.', 'Turn so your LEFT side faces the camera.': 'Draai zo dat je LINKERzij naar de camera wijst.', 'Turn so your RIGHT side faces the camera.': 'Draai zo dat je RECHTERzij naar de camera wijst.', 'Turn your back to the camera.': 'Draai je rug naar de camera.',
    'Arms slightly away from your body.': 'Armen iets van je lichaam af.', 'Arms straight forward.': 'Armen recht naar voren.',
    'Same spot & light, neutral background': 'Zelfde plek & licht, neutrale achtergrond', 'Phone at navel height on a stand, or timer at ~2 m': 'Telefoon op navelhoogte op een standaard, of timer op ~2 m', 'Same tight clothing, relaxed natural posture': 'Zelfde strakke kleding, ontspannen natuurlijke houding', 'Ideally in the morning before eating': 'Liefst \u2019s ochtends voor het eten',
    'Your photos may be used for FBG social media / reference:': 'Je foto\u2019s mogen gebruikt worden voor FBG social media / referentie:', 'Private: only you and your coach see these photos.': 'Privé: alleen jij en je coach zien deze foto\u2019s.', 'Change in More → Privacy': 'Wijzigen via More → Privacy',
    'Weight (optional)': 'Gewicht (optioneel)', 'Compare with': 'Vergelijk met', 'No photos yet': 'Nog geen foto\u2019s', 'Photo could not be loaded': 'Foto kon niet geladen worden', 'Check-in saved ✓': 'Check-in opgeslagen ✓', 'Take at least one photo or enter your weight': 'Maak minstens één foto of vul je gewicht in',
    'Download this photo': 'Download deze foto', 'Download all 4 separately': 'Download alle 4 los', 'Tap a photo to open it full size': 'Tik op een foto om hem groot te zien en los te downloaden', 'Downloading…': 'Downloaden…', 'Delete this photo': 'Verwijder deze foto', 'Delete this photo?': 'Deze foto verwijderen?', 'This cannot be undone. You can take a new one afterwards.': 'Dit kan niet ongedaan worden. Je kunt daarna een nieuwe maken.', 'Photo deleted': 'Foto verwijderd', 'Delete': 'Verwijderen'
  };
  Object.keys(NL).forEach(function (k) { if (!window.FBG_I18N.nl[k]) window.FBG_I18N.nl[k] = NL[k]; });
  var P = [['front', 'Front', 'Face the camera.', 'Arms slightly away from your body.'], ['left', 'Left side', 'Turn so your LEFT side faces the camera.', 'Arms straight forward.'],
    ['right', 'Right side', 'Turn so your RIGHT side faces the camera.', 'Arms straight forward.'], ['back', 'Rear view', 'Turn your back to the camera.', 'Arms slightly away from your body.']];
  App.photoPoses = P;
  function icon(k) {
    var g = '#d4af37', b = '<circle cx="50" cy="16" r="9" fill="' + g + '"/>';
    if (k === 'front' || k === 'back') return '<svg viewBox="0 0 100 120" width="70" height="84" aria-hidden="true">' + b + '<path d="M38 30h24l4 38h-8l-2 46h-8l-2-34-2 34h-8l-2-46h-8z" fill="' + g + '"/><path d="M38 32l-14 30M62 32l14 30" stroke="' + g + '" stroke-width="6" stroke-linecap="round"/>' + (k === 'back' ? '<path d="M50 32v30" stroke="#000" stroke-width="2"/>' : '<circle cx="46" cy="15" r="1.5"/><circle cx="54" cy="15" r="1.5"/>') + '</svg>';
    var fl = k === 'right' ? ' transform="translate(100 0) scale(-1 1)"' : '';
    return '<svg viewBox="0 0 100 120" width="70" height="84" aria-hidden="true"><g' + fl + '>' + b + '<path d="M44 30h12l3 38h-5l-1 46h-8l-2-46h-3z" fill="' + g + '"/><path d="M52 36l26 6" stroke="' + g + '" stroke-width="6" stroke-linecap="round"/><circle cx="56" cy="15" r="1.5"/></g></svg>';
  }
  App.poseIcon = icon;
  function consentNote() {
    var c = S.me && S.me.consent, p = c && c.photo, on = p && Object.keys(p).some(function (k) { return p[k]; });
    return '<div class="tiny" style="margin:8px 0;padding:8px;border-radius:8px;border:1px solid rgba(212,175,55,.5)">' + (on ? '📣 ' + esc(t('Your photos may be used for FBG social media / reference:')) + ' <b>' + esc(App.consentText ? App.consentText(p) : '') + '</b>' : '🔒 ' + esc(t('Private: only you and your coach see these photos.'))) + ' <span class="muted">' + esc(t('Change in More → Privacy')) + '</span></div>';
  }
  function me() { return S.me; }
  A['ci-photos'] = function () {
    var ath = me(), picked = {}, i = 0, last = (ath.body || []).filter(function (b) { return b.weight; }).pop() || {};
    var s = App.sheet('<div id="pg"></div>', { label: t('Progress photos') }), root = s.el.querySelector('#pg');
    function tips() { return '<ul class="tiny muted" style="margin:6px 0 0 16px;padding:0">' + ['Same spot & light, neutral background', 'Phone at navel height on a stand, or timer at ~2 m', 'Same tight clothing, relaxed natural posture', 'Ideally in the morning before eating'].map(function (x) { return '<li>' + esc(t(x)) + '</li>'; }).join('') + '</ul>'; }
    function draw() {
      if (i >= P.length) return final();
      var p = P[i], b = picked[p[0]];
      root.innerHTML = '<div class="row between"><b style="color:#d4af37">📸 ' + esc(t('Progress photos')) + '</b><span class="badge" id="pg-step" style="color:#d4af37">' + (i + 1) + '/4</span></div>' +
        '<div style="height:6px;background:#222;border-radius:3px;margin:8px 0"><div style="height:6px;width:' + ((i + 1) * 25) + '%;background:#d4af37;border-radius:3px"></div></div>' +
        '<h2 class="h2" id="pg-title">' + esc(t(p[1])) + '</h2><div class="row" style="gap:12px;align-items:center"><div>' + icon(p[0]) + '</div><div class="small"><b>' + esc(t(p[2])) + '</b><br>' + esc(t(p[3])) + '</div></div>' + tips() + (i === 0 ? consentNote() : '') +
        '<div style="margin:10px 0;text-align:center">' + (b ? '<img id="pg-prev" alt="" src="' + URL.createObjectURL(b) + '" style="max-width:100%;max-height:300px;border-radius:12px;border:1px solid #d4af37">' : '') + '</div>' +
        App.photoBtns('pg') +
        (b ? '<button type="button" class="btn danger block" id="pg-del" style="margin-top:8px">🗑️ ' + esc(t('Delete this photo')) + '</button>' : '') +
        '<div class="grid2" style="margin-top:8px"><button class="btn" id="pg-back">' + (i ? '← ' + esc(t('Back step')) : esc(t('Cancel'))) + '</button><button class="btn ' + (b ? 'primary' : '') + '" id="pg-next">' + esc(t(b ? 'Next' : 'Skip')) + ' →</button></div>';
      function got(f) { App.toast('…'); App.compress(f, 1600, 0.82).then(function (bl) { picked[p[0]] = bl; draw(); }).catch(function (e) { App.toast('⚠️ ' + t('Photo could not be loaded') + (e && e.message ? ': ' + e.message : '')); }); }
      root.querySelector('#pg-cam').onclick = function () { App.pickImage(true, got); };
      root.querySelector('#pg-lib').onclick = function () { App.pickImage(false, got); };
      var del = root.querySelector('#pg-del');
      if (del) del.onclick = function () {
        App.confirm(t('Delete this photo?'), t('This cannot be undone. You can take a new one afterwards.'), t('Delete'), true).then(function (ok) { if (!ok) return; delete picked[p[0]]; draw(); });
      };
      root.querySelector('#pg-back').onclick = function () { if (i) { i--; draw(); } else s.close(); };
      root.querySelector('#pg-next').onclick = function () { i++; draw(); };
    }
    function final() {
      root.innerHTML = '<b style="color:#d4af37">📸 ' + esc(t('Progress photos')) + ' ✓</b><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:10px 0">' + P.map(function (p) { return '<figure style="margin:0;text-align:center" data-jump="' + p[0] + '">' + (picked[p[0]] ? '<img alt="" src="' + URL.createObjectURL(picked[p[0]]) + '" style="width:100%;border-radius:8px">' : '<div style="aspect-ratio:3/4;border:1px dashed #555;border-radius:8px"></div>') + '<figcaption class="tiny">' + esc(t(p[1])) + '</figcaption>' + (picked[p[0]] ? '<button type="button" class="btn danger sm" data-del-pose="' + p[0] + '" style="margin-top:4px">🗑️</button>' : '') + '</figure>'; }).join('') + '</div>' +
        '<label class="field"><span class="label">' + esc(t('Weight (optional)')) + ' (kg)</span><input class="input" id="pg-w" inputmode="decimal" value="' + esc(last.weight || '') + '"></label>' +
        '<div class="grid2" style="margin-top:10px"><button class="btn" id="pg-back">← ' + esc(t('Back step')) + '</button><button class="btn primary" id="pg-save">' + esc(t('Save check-in')) + '</button></div>';
      root.querySelectorAll('[data-del-pose]').forEach(function (btn) {
        btn.onclick = function (ev) { ev.stopPropagation(); App.confirm(t('Delete this photo?'), t('This cannot be undone. You can take a new one afterwards.'), t('Delete'), true).then(function (ok) { if (!ok) return; delete picked[btn.getAttribute('data-del-pose')]; final(); }); };
      });
      root.querySelectorAll('figure[data-jump]').forEach(function (fig) {
        if (picked[fig.getAttribute('data-jump')]) return;
        fig.style.cursor = 'pointer';
        fig.onclick = function () { var k = fig.getAttribute('data-jump'); for (var n = 0; n < P.length; n++) if (P[n][0] === k) { i = n; draw(); } };
      });
      root.querySelector('#pg-back').onclick = function () { i = P.length - 1; draw(); };
      root.querySelector('#pg-save').onclick = function () {
        var w = App.num(root.querySelector('#pg-w').value), iso = App.today(), ks = Object.keys(picked);
        if (!w && !ks.length) return App.toast(t('Take at least one photo or enter your weight'));
        var lg = ath.photoLog = ath.photoLog || [], entry = lg.filter(function (x) { return x.date === iso; })[0];
        if (!entry) { entry = { date: iso, poses: {} }; lg.push(entry); lg.sort(function (a, c) { return a.date < c.date ? -1 : 1; }); }
        if (w) entry.weight = w;
        Promise.all(ks.map(function (k) { var id = 'ph-' + iso + '-' + k + '-' + Date.now().toString(36), old = entry.poses[k]; entry.poses[k] = id; return App.photoPut({ id: id, date: iso, pose: k, blob: picked[k] }).then(function () {
          if (!old || old === id) return;
          if (App.photoDel) App.photoDel(old);
          if (App.markPhotoGone) App.markPhotoGone(old);
          var cid = App.ownStorageId && App.ownStorageId();
          if (cid && App.removeStoredCheckinPhoto) return App.removeStoredCheckinPhoto(cid, old);
        }); })).then(function () {
          if (w) { ath.body = ath.body || []; var bb = ath.body.filter(function (x) { return x.date === iso; })[0]; if (!bb) { bb = { date: iso }; ath.body.push(bb); ath.body.sort(function (a, c) { return a.date < c.date ? -1 : 1; }); } bb.weight = w; if (ath.profile) ath.profile.weight = w; }
          ath.lastMeasure = iso; App.save(); s.close(); App.rerender(); App.toast(t('Check-in saved ✓'));
        }).catch(function (e) { App.toast('⚠️ ' + (e && e.message || e)); });
      };
    }
    draw();
  };
  // ---------- coach: 4 angles side by side per date + compare ----------
  function groups(names) { var g = {}; names.forEach(function (n) { var m = /ph-(\d{4}-\d{2}-\d{2})-(front|left|right|back|side)-/.exec(n); if (!m) return; var d = (g[m[1]] = g[m[1]] || {}); if (!d[m[2]] || n > d[m[2]]) d[m[2]] = n; }); return g; }
  App.photoGroups = groups;
  App.photoFileName = function (clientName, date, pose) {
    var p = pose === 'side' ? 'left' : String(pose || 'photo');
    if (!/^(front|left|right|back|photo)$/.test(p)) p = p.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'photo';
    return F.slug(clientName) + '-' + String(date || '').slice(0, 10) + '-' + p + '.jpg';
  };
  App.isAppleTouch = function () {
    try { return /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
    catch (e) { return false; }
  };
  App.saveBlobMode = function (ua, canShareFiles) {
    var ios = /iP(hone|od|ad)/.test(ua || '');
    return (ios && canShareFiles) ? 'share' : 'download';
  };
  function asFile(blob, filename) {
    try { return new File([blob], filename, { type: (blob && blob.type) || 'image/jpeg' }); } catch (e) { return null; }
  }
  function viaAnchor(blob, filename) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 2000);
  }
  App.saveBlob = function (blob, filename) {
    if (!blob) { App.toast('⚠️ Geen foto'); return Promise.resolve(); }
    filename = filename || 'foto.jpg';
    var file = asFile(blob, filename), can = false;
    try { can = !!(file && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { can = false; }
    if (App.saveBlobMode(typeof navigator !== 'undefined' ? navigator.userAgent : '', can) === 'share') {
      return navigator.share({ files: [file], title: filename }).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        viaAnchor(blob, filename);
      });
    }
    viaAnchor(blob, filename);
    App.toast('📥 ' + filename);
    return Promise.resolve();
  };
  App.saveBlobs = function (items) {
    items = (items || []).filter(function (x) { return x && x.blob && x.name; });
    if (!items.length) { App.toast('⚠️ Geen foto’s'); return Promise.resolve(); }
    var files = items.map(function (x) { return asFile(x.blob, x.name); }).filter(Boolean);
    var can = false;
    try { can = !!(files.length === items.length && navigator.canShare && navigator.canShare({ files: files })); } catch (e) { can = false; }
    if (App.saveBlobMode(typeof navigator !== 'undefined' ? navigator.userAgent : '', can) === 'share') {
      return navigator.share({ files: files, title: items.length + ' foto’s' }).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        items.forEach(function (x, i) { setTimeout(function () { viaAnchor(x.blob, x.name); }, i * 350); });
      });
    }
    items.forEach(function (x, i) { setTimeout(function () { viaAnchor(x.blob, x.name); }, i * 350); });
    App.toast('📥 ' + items.length + ' foto’s');
    return Promise.resolve();
  };
  function poseFile(d, pose) { return (d && (d[pose] || (pose === 'left' && d.side))) || ''; }
  var photoCache = {};
  App.forgetCheckinPhoto = function (path) { delete photoCache[path]; };
  function getCheckinPhoto(sb, path) {
    if (!photoCache[path]) {
      photoCache[path] = sb.storage.from('checkin-photos').download(path).then(function (r) {
        if (r.error || !r.data) throw (r.error || new Error(t('Photo could not be loaded')));
        return { blob: r.data, url: URL.createObjectURL(r.data) };
      });
    }
    return photoCache[path];
  }
  function row(c, date, d) {
    return '<div class="pg-date" style="margin-top:10px"><div class="row between" style="gap:8px;align-items:center;margin-bottom:6px"><div class="small"><b>' + esc(F.fmtDay ? F.fmtDay(date) : date) + '</b></div>' +
      '<button type="button" class="btn sm" data-dl-day="' + esc(date) + '">📥 ' + esc(t('Download all 4 separately')) + '</button></div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">' + P.map(function (p) {
        var n = poseFile(d, p[0]);
        if (!n) return '<div class="ph-t empty"><span>' + esc(t(p[1])) + '</span></div>';
        var path = c.cloudId + '/' + n;
        return '<button type="button" class="ph-t pg-open" data-path="' + esc(path) + '" data-date="' + esc(date) + '" data-pose="' + p[0] + '" aria-label="' + esc(t(p[1])) + '"><img alt="" data-srcpath="' + esc(path) + '"><span>' + esc(t(p[1])) + '</span></button>';
      }).join('') + '</div></div>';
  }
  function openPhoto(c, date, pose, path, g, sb) {
    var labelOf = function (k) { var x = P.filter(function (p) { return p[0] === k; })[0]; return x ? t(x[1]) : k; };
    var s = App.sheet(App.sheetHead((c.name || t('Progress photos')) + ' · ' + (F.fmtDay ? F.fmtDay(date) : date), labelOf(pose)) +
      '<div class="ph-big"><p class="muted small" id="pg-full-wait">…</p></div>' +
      '<div class="seg" id="pg-pose-nav" style="margin:10px 0">' + P.map(function (p) {
        return poseFile(g[date], p[0]) ? '<button type="button" data-pose="' + p[0] + '"' + (p[0] === pose ? ' class="on"' : '') + '>' + esc(t(p[1])) + '</button>' : '';
      }).join('') + '</div>' +
      '<button type="button" class="btn primary lg block" id="pg-dl">📥 ' + esc(t('Download this photo')) + '</button>' +
      '<button type="button" class="btn lg block" id="pg-dla" style="margin-top:8px">📥 ' + esc(t('Download all 4 separately')) + '</button>' +
      '<button type="button" class="btn danger block" id="pg-rm" style="margin-top:8px">🗑️ ' + esc(t('Delete this photo')) + '</button>', { label: t('Progress photos') });
    var cur = { pose: pose, path: path };
    function show(po, pa) {
      cur.pose = po; cur.path = pa;
      var head = s.el.querySelector('.sheet-head p'); if (head) head.textContent = labelOf(po);
      s.el.querySelectorAll('#pg-pose-nav button').forEach(function (b) { b.classList.toggle('on', b.dataset.pose === po); });
      var box = s.el.querySelector('.ph-big'); box.innerHTML = '<p class="muted small">…</p>';
      getCheckinPhoto(sb, pa).then(function (x) {
        box.innerHTML = '<img class="ph-full" alt="' + esc(labelOf(po)) + '">';
        box.querySelector('img').src = x.url;
      }).catch(function (e) {
        box.innerHTML = '<p class="muted">⚠️ ' + esc(t('Photo could not be loaded')) + '</p>';
        App.toast('⚠️ ' + ((e && e.message) || t('Photo could not be loaded')));
      });
    }
    s.el.querySelector('#pg-dl').onclick = function () {
      App.toast(t('Downloading…'));
      getCheckinPhoto(sb, cur.path).then(function (x) { return App.saveBlob(x.blob, App.photoFileName(c.name, date, cur.pose)); }).catch(function (e) { App.toast('⚠️ ' + ((e && e.message) || e)); });
    };
    s.el.querySelector('#pg-dla').onclick = function () { downloadDay(c, date, g[date], sb); };
    s.el.querySelector('#pg-rm').onclick = function () {
      App.confirm(t('Delete this photo?'), t('This cannot be undone. You can take a new one afterwards.'), t('Delete'), true).then(function (ok) {
        if (!ok) return;
        App.deleteCheckinPhoto({ asCoach: true, folderId: c.cloudId, id: App.photoIdFromPath(cur.path), path: cur.path, date: date, pose: cur.pose }).then(function () {
          var name = String(cur.path || '').split('/').pop(), d = g[date] || {};
          Object.keys(d).forEach(function (k) { if (d[k] === name) delete d[k]; });
          if (App.forgetCheckinPhoto) App.forgetCheckinPhoto(cur.path);
          App.toast(t('Photo deleted')); s.close(); coachPhotos(c);
        }).catch(function (err) { App.toast('⚠️ ' + (err && err.message || err)); });
      });
    };
    s.el.querySelectorAll('#pg-pose-nav button').forEach(function (b) {
      b.onclick = function () { var n = poseFile(g[date], b.dataset.pose); if (n) show(b.dataset.pose, c.cloudId + '/' + n); };
    });
    show(pose, path);
  }
  function downloadDay(c, date, d, sb) {
    var jobs = P.map(function (p) {
      var n = poseFile(d, p[0]); if (!n) return null;
      return getCheckinPhoto(sb, c.cloudId + '/' + n).then(function (x) { return { blob: x.blob, name: App.photoFileName(c.name, date, p[0]) }; });
    }).filter(Boolean);
    if (!jobs.length) return App.toast(t('No photos yet'));
    App.toast(t('Downloading…'));
    Promise.all(jobs).then(function (items) { return App.saveBlobs(items); }).catch(function (e) { App.toast('⚠️ ' + ((e && e.message) || e)); });
  }
  function coachPhotos(c) {
    var el = document.getElementById('pg-coach'), sb = App.cloud && App.cloud.sb; if (!el || !sb) return;
    sb.storage.from('checkin-photos').list(c.cloudId, { limit: 400 }).then(function (r) {
      var g = groups((r.data || []).map(function (f) { return f.name; })), dates = Object.keys(g).sort().reverse();
      if (!dates.length) { el.innerHTML = '<p class="small muted">' + esc(t('No photos yet')) + '</p>'; return; }
      function bind(root) {
        root.querySelectorAll('img[data-srcpath]').forEach(function (im) {
          getCheckinPhoto(sb, im.getAttribute('data-srcpath')).then(function (x) { im.src = x.url; }).catch(function () {});
        });
        root.querySelectorAll('.pg-open').forEach(function (btn) {
          btn.onclick = function () { openPhoto(c, btn.getAttribute('data-date'), btn.getAttribute('data-pose'), btn.getAttribute('data-path'), g, sb); };
        });
        root.querySelectorAll('[data-dl-day]').forEach(function (btn) {
          btn.onclick = function () { downloadDay(c, btn.getAttribute('data-dl-day'), g[btn.getAttribute('data-dl-day')], sb); };
        });
      }
      function render(a, b) {
        el.innerHTML = '<p class="tiny muted">' + esc(t('Tap a photo to open it full size')) + '</p>' + row(c, a, g[a]) +
          (dates.length > 1 ? '<label class="small" style="display:block;margin-top:10px">' + esc(t('Compare with')) + ': <select class="input" id="pg-cmp">' + dates.filter(function (d) { return d !== a; }).map(function (d) { return '<option' + (d === b ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select></label>' + (b ? row(c, b, g[b]) : '') : '');
        var sel = el.querySelector('#pg-cmp'); if (sel) sel.onchange = function () { render(a, sel.value); };
        bind(el);
      }
      render(dates[0], dates[1]);
    }).catch(function () { el.innerHTML = '<p class="small muted">⚠️ ' + esc(t('Photo could not be loaded')) + '</p>'; });
  }
  App.coachPhotos = coachPhotos;
  var oClient = V.client; V.client = function (id) { var h = oClient.apply(this, arguments); if (id === 'me' || !h || S.role !== 'coach') return h; var c = App.client(id); if (!c || !c.cloudId) return h;
    var k = c.live && c.live.d && c.live.d.consent, p = k && k.photo, on = p && Object.keys(p).some(function (x) { return p[x]; });
    setTimeout(function () { coachPhotos(c); });
    return h + '<div class="section"><h2 class="h2">📸 ' + esc(t('Progress photos')) + '</h2><p class="tiny" style="color:' + (on ? '#d4af37' : '#aaa') + '">' + (on ? '📣 Social media OK: ' + esc(App.consentText(p)) : '🔒 Privé — niet voor social media') + '</p><div id="pg-coach"><p class="small muted">…</p></div></div>'; };
})();
