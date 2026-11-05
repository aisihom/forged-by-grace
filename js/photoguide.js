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
    'Weight (optional)': 'Gewicht (optioneel)', 'Compare with': 'Vergelijk met', 'No photos yet': 'Nog geen foto\u2019s', 'Photo could not be loaded': 'Foto kon niet geladen worden', 'Check-in saved ✓': 'Check-in opgeslagen ✓', 'Take at least one photo or enter your weight': 'Maak minstens één foto of vul je gewicht in'
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
        '<div class="grid2" style="margin-top:8px"><button class="btn" id="pg-back">' + (i ? '← ' + esc(t('Back step')) : esc(t('Cancel'))) + '</button><button class="btn ' + (b ? 'primary' : '') + '" id="pg-next">' + esc(t(b ? 'Next' : 'Skip')) + ' →</button></div>';
      function got(f) { App.toast('…'); App.compress(f, 1600, 0.82).then(function (bl) { picked[p[0]] = bl; draw(); }).catch(function (e) { App.toast('⚠️ ' + t('Photo could not be loaded') + (e && e.message ? ': ' + e.message : '')); }); }
      root.querySelector('#pg-cam').onclick = function () { App.pickImage(true, got); };
      root.querySelector('#pg-lib').onclick = function () { App.pickImage(false, got); };
      root.querySelector('#pg-back').onclick = function () { if (i) { i--; draw(); } else s.close(); };
      root.querySelector('#pg-next').onclick = function () { i++; draw(); };
    }
    function final() {
      root.innerHTML = '<b style="color:#d4af37">📸 ' + esc(t('Progress photos')) + ' ✓</b><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:10px 0">' + P.map(function (p) { return '<figure style="margin:0;text-align:center">' + (picked[p[0]] ? '<img alt="" src="' + URL.createObjectURL(picked[p[0]]) + '" style="width:100%;border-radius:8px">' : '<div style="aspect-ratio:3/4;border:1px dashed #555;border-radius:8px"></div>') + '<figcaption class="tiny">' + esc(t(p[1])) + '</figcaption></figure>'; }).join('') + '</div>' +
        '<label class="field"><span class="label">' + esc(t('Weight (optional)')) + ' (kg)</span><input class="input" id="pg-w" inputmode="decimal" value="' + esc(last.weight || '') + '"></label>' +
        '<div class="grid2" style="margin-top:10px"><button class="btn" id="pg-back">← ' + esc(t('Back step')) + '</button><button class="btn primary" id="pg-save">' + esc(t('Save check-in')) + '</button></div>';
      root.querySelector('#pg-back').onclick = function () { i = P.length - 1; draw(); };
      root.querySelector('#pg-save').onclick = function () {
        var w = App.num(root.querySelector('#pg-w').value), iso = App.today(), ks = Object.keys(picked);
        if (!w && !ks.length) return App.toast(t('Take at least one photo or enter your weight'));
        var lg = ath.photoLog = ath.photoLog || [], entry = lg.filter(function (x) { return x.date === iso; })[0];
        if (!entry) { entry = { date: iso, poses: {} }; lg.push(entry); lg.sort(function (a, c) { return a.date < c.date ? -1 : 1; }); }
        if (w) entry.weight = w;
        Promise.all(ks.map(function (k) { var id = 'ph-' + iso + '-' + k + '-' + Date.now().toString(36), old = entry.poses[k]; entry.poses[k] = id; return App.photoPut({ id: id, date: iso, pose: k, blob: picked[k] }).then(function () { if (old && App.photoDel) return App.photoDel(old); }); })).then(function () {
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
  function row(cid, date, d, urls) { return '<div style="margin-top:8px"><div class="small"><b>' + esc(F.fmtDay ? F.fmtDay(date) : date) + '</b></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">' + P.map(function (p) { var n = d[p[0]] || (p[0] === 'left' && d.side); return '<figure style="margin:0;text-align:center">' + (n && urls[cid + '/' + n] ? '<img alt="" src="' + esc(urls[cid + '/' + n]) + '" style="width:100%;border-radius:8px">' : '<div style="aspect-ratio:3/4;border:1px dashed #444;border-radius:8px"></div>') + '<figcaption class="tiny">' + esc(t(p[1])) + '</figcaption></figure>'; }).join('') + '</div></div>'; }
  function coachPhotos(c) {
    var el = document.getElementById('pg-coach'), sb = App.cloud && App.cloud.sb; if (!el || !sb) return;
    sb.storage.from('checkin-photos').list(c.cloudId, { limit: 400 }).then(function (r) {
      var g = groups((r.data || []).map(function (f) { return f.name; })), dates = Object.keys(g).sort().reverse();
      if (!dates.length) { el.innerHTML = '<p class="small muted">' + esc(t('No photos yet')) + '</p>'; return; }
      function render(a, b) {
        var need = []; [a, b].forEach(function (d) { if (d) Object.keys(g[d]).forEach(function (k) { need.push(c.cloudId + '/' + g[d][k]); }); });
        sb.storage.from('checkin-photos').createSignedUrls(need, 3600).then(function (u) { var urls = {}; (u.data || []).forEach(function (x) { if (x.signedUrl) urls[x.path] = x.signedUrl; });
          el.innerHTML = row(c.cloudId, a, g[a], urls) + (dates.length > 1 ? '<label class="small" style="display:block;margin-top:10px">' + esc(t('Compare with')) + ': <select class="input" id="pg-cmp">' + dates.filter(function (d) { return d !== a; }).map(function (d) { return '<option' + (d === b ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select></label>' + (b ? row(c.cloudId, b, g[b], urls) : '') : '');
          var sel = el.querySelector('#pg-cmp'); if (sel) sel.onchange = function () { render(a, sel.value); };
        });
      }
      render(dates[0], dates[1]);
    }).catch(function () {});
  }
  App.coachPhotos = coachPhotos;
  var oClient = V.client; V.client = function (id) { var h = oClient.apply(this, arguments); if (id === 'me' || !h || S.role !== 'coach') return h; var c = App.client(id); if (!c || !c.cloudId) return h;
    var k = c.live && c.live.d && c.live.d.consent, p = k && k.photo, on = p && Object.keys(p).some(function (x) { return p[x]; });
    setTimeout(function () { coachPhotos(c); });
    return h + '<div class="section"><h2 class="h2">📸 ' + esc(t('Progress photos')) + '</h2><p class="tiny" style="color:' + (on ? '#d4af37' : '#aaa') + '">' + (on ? '📣 Social media OK: ' + esc(App.consentText(p)) : '🔒 Privé — niet voor social media') + '</p><div id="pg-coach"><p class="small muted">…</p></div></div>'; };
})();
