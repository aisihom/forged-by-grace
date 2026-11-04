/* FBG v3.27 — client profile photo. Square crop + ~400px JPEG client-side. Local copy (localStorage) + private bucket checkin-photos/<clientId>/avatar.jpg (RLS: client + own coach only). Signed URLs only; never for social media. */
(function () {
  'use strict';
  var App = window.App, S = App.S, esc = App.esc, t = App.t, A = App.acts, V = App.views;
  var LK = 'fbg.avatar', G = '#d4af37', cache = {};
  function sb() { return App.cloud && App.cloud.sb; }
  function myCid() { var s = App.cloud && App.cloud.state && App.cloud.state(); return s && s.role === 'client' && s.client; }
  function local() { try { return localStorage.getItem(LK) || ''; } catch (e) { return ''; } }
  function setLocal(v) { try { if (v) localStorage.setItem(LK, v); else localStorage.removeItem(LK); } catch (e) {} }
  function img(src, size) { return '<img alt="" src="' + esc(src) + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block">'; }
  function ring(el) { el.style.overflow = 'hidden'; el.style.padding = '0'; el.style.border = '2px solid ' + G; }
  // signed URL for a client's avatar (coach or client), cached 50 min
  function signed(cid) {
    var c = cache[cid]; if (c && c.at > Date.now() - 3e6) return Promise.resolve(c.url);
    var s = sb(); if (!s || !cid) return Promise.resolve('');
    return s.storage.from('checkin-photos').list(cid, { search: 'avatar' }).then(function (r) {
      var f = (r.data || []).filter(function (x) { return x.name === 'avatar.jpg'; })[0];
      if (!f) { cache[cid] = { at: Date.now(), url: '' }; return ''; }
      return s.storage.from('checkin-photos').createSignedUrl(cid + '/avatar.jpg', 3600).then(function (u) { var url = (u.data && u.data.signedUrl) || ''; if (url) url += '&t=' + encodeURIComponent(f.updated_at || ''); cache[cid] = { at: Date.now(), url: url }; return url; });
    }).catch(function () { return ''; });
  }
  App.avatarUrl = signed;
  function myAvatar() {
    var l = local(); if (l) return Promise.resolve(l);
    var cid = myCid(); if (!cid) return Promise.resolve('');
    return signed(cid).then(function (u) { if (!u) return ''; return fetch(u).then(function (r) { return r.blob(); }).then(toData).then(function (d) { setLocal(d); return d; }).catch(function () { return u; }); });
  }
  function toData(b) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(b); }); }
  function fill(sel, p) { p.then(function (u) { if (!u) return; document.querySelectorAll(sel).forEach(function (el) { ring(el); el.innerHTML = img(u); }); }); }

  // ---------- crop sheet ----------
  function cropSheet(file, onSave) {
    var url = URL.createObjectURL(file), im = new Image();
    im.onerror = function () { App.toast('Foto kon niet geladen worden'); };
    im.onload = function () {
      var z = 1, ox = 0, oy = 0, V0 = 260;
      var s = App.sheet('<b style="color:' + G + '">👤 Profielfoto bijsnijden</b><p class="tiny muted">Sleep om te verschuiven, gebruik de schuif om in te zoomen.</p>' +
        '<div style="display:flex;justify-content:center;margin:10px 0"><canvas id="av-c" width="' + V0 * 2 + '" height="' + V0 * 2 + '" style="width:' + V0 + 'px;height:' + V0 + 'px;border-radius:50%;border:3px solid ' + G + ';touch-action:none;background:#000"></canvas></div>' +
        '<input type="range" id="av-z" min="1" max="4" step="0.01" value="1" style="width:100%;accent-color:' + G + '">' +
        '<p class="tiny muted">🔒 Privé: alleen jij en je coach zien je profielfoto. Nooit voor social media.</p>' +
        '<div class="grid2" style="margin-top:8px"><button class="btn" id="av-x">Annuleren</button><button class="btn primary" id="av-ok">Opslaan</button></div>', { label: 'Profielfoto' });
      var cv = s.el.querySelector('#av-c'), cx = cv.getContext('2d'), base = Math.min(im.width, im.height);
      function clamp() { var side = base / z, mx = (im.width - side) / 2, my = (im.height - side) / 2; ox = Math.max(-mx, Math.min(mx, ox)); oy = Math.max(-my, Math.min(my, oy)); }
      function src() { var side = base / z; return [(im.width - side) / 2 + ox, (im.height - side) / 2 + oy, side]; }
      function draw(ctx, n) { clamp(); var r = src(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, n, n); ctx.drawImage(im, r[0], r[1], r[2], r[2], 0, 0, n, n); }
      draw(cx, cv.width);
      s.el.querySelector('#av-z').oninput = function (e) { z = +e.target.value; draw(cx, cv.width); };
      var drag = null;
      cv.onpointerdown = function (e) { drag = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); };
      cv.onpointermove = function (e) { if (!drag) return; var k = (base / z) / V0; ox -= (e.clientX - drag[0]) * k; oy -= (e.clientY - drag[1]) * k; drag = [e.clientX, e.clientY]; draw(cx, cv.width); };
      cv.onpointerup = cv.onpointercancel = function () { drag = null; };
      s.el.querySelector('#av-x').onclick = function () { URL.revokeObjectURL(url); s.close(); };
      s.el.querySelector('#av-ok').onclick = function () {
        var o = document.createElement('canvas'); o.width = o.height = 400; draw(o.getContext('2d'), 400);
        o.toBlob(function (b) {
          if (!b) return App.toast('⚠️ Opslaan mislukt');
          URL.revokeObjectURL(url); s.close(); (onSave || saveMine)(b);
        }, 'image/jpeg', 0.82);
      };
    };
    im.src = url;
  }
  function saveMine(b) {
    toData(b).then(function (d) {
      setLocal(d); App.rerender(); App.toast('Profielfoto opgeslagen ✓');
      var cid = myCid(), c = sb();
      if (cid && c) c.storage.from('checkin-photos').upload(cid + '/avatar.jpg', b, { upsert: true, contentType: 'image/jpeg', cacheControl: '60' }).then(function (r) { if (r.error) App.toast('⚠️ Upload: ' + r.error.message); else delete cache[cid]; });
    });
  }
  function pick(capture, onSave) {
    var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; if (capture) i.setAttribute('capture', 'user');
    i.onchange = function () { if (i.files[0]) cropSheet(i.files[0], onSave); }; i.click();
  }
  A['avatar-edit'] = function () {
    var has = !!local();
    var s = App.sheet('<b style="color:' + G + '">👤 Profielfoto</b><p class="tiny muted" style="margin:6px 0 12px">🔒 Privé — alleen jij en je coach zien hem. Wordt niet gebruikt voor social media.</p>' +
      '<button class="btn primary lg block" id="av-cam">📷 Foto maken</button><button class="btn lg block" id="av-lib" style="margin-top:8px">🖼️ Kies uit fotobibliotheek</button>' +
      (has ? '<button class="btn danger block" id="av-del" style="margin-top:8px">🗑️ Profielfoto verwijderen</button>' : '') + '<button class="btn ghost block" id="av-cl" style="margin-top:8px">Annuleren</button>', { label: 'Profielfoto' });
    s.el.querySelector('#av-cam').onclick = function () { s.close(); pick(true); };
    s.el.querySelector('#av-lib').onclick = function () { s.close(); pick(false); };
    s.el.querySelector('#av-cl').onclick = function () { s.close(); };
    var d = s.el.querySelector('#av-del'); if (d) d.onclick = function () {
      if (!confirm('Profielfoto verwijderen?')) return;
      setLocal(''); var cid = myCid(), c = sb(); if (cid && c) c.storage.from('checkin-photos').remove([cid + '/avatar.jpg']).then(function () { delete cache[cid]; });
      s.close(); App.rerender(); App.toast('Profielfoto verwijderd');
    };
  };
  function bubble(size) { return '<button class="avatar" data-act="avatar-edit" data-av-me aria-label="Profielfoto" style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;border:2px dashed ' + G + ';background:#111;color:' + G + ';font-size:' + Math.round(size / 2.6) + 'px;display:flex;align-items:center;justify-content:center;flex:none;cursor:pointer">' + esc(App.initials((S.me.profile && S.me.profile.name) || '') || '👤') + '</button>'; }

  // ---------- client: Today header + More card ----------
  var oToday = V.today; V.today = function () {
    var h = oToday.apply(this, arguments), k = h.indexOf('<p class="kicker">'); if (k < 0) return h;
    setTimeout(function () { fill('[data-av-me]', myAvatar()); });
    var e = h.indexOf('</h1>', k); if (e < 0) return h;
    return h.slice(0, k) + '<div class="row" style="gap:12px;align-items:center"><div class="grow">' + h.slice(k, e + 5) + '</div>' + bubble(56) + '</div>' + h.slice(e + 5);
  };
  var oMore = V.more; V.more = function () {
    var h = oMore.apply(this, arguments); if (S.role === 'coach') return h;
    setTimeout(function () { fill('[data-av-me]', myAvatar()); });
    return '<div class="card row" style="margin-bottom:12px;gap:12px;align-items:center">' + bubble(64) + '<div class="grow"><b>👤 Profielfoto</b><div class="tiny muted">Maken, wijzigen of verwijderen · privé</div></div><button class="btn sm" data-act="avatar-edit">' + (local() ? 'Wijzigen' : 'Instellen') + '</button></div>' + h;
  };

  // ---------- coach: list + detail ----------
  function coachFill() {
    document.querySelectorAll('a.client-row').forEach(function (a) {
      var id = (a.getAttribute('href') || '').split('/').pop(), c = App.client && App.client(id), av = a.querySelector('.avatar');
      if (!c || !c.cloudId || !av) return;
      signed(c.cloudId).then(function (u) { if (!u) return; var dot = av.querySelector('.unread'); ring(av); av.style.position = 'relative'; av.innerHTML = img(u) + (dot ? dot.outerHTML : ''); });
    });
  }
  var oClients = V.clients; V.clients = function () { var h = oClients.apply(this, arguments); if (S.role === 'coach') setTimeout(coachFill); return h; };
  var oClient = V.client; V.client = function (id) {
    var h = oClient.apply(this, arguments); if (id === 'me' || !h || S.role !== 'coach') return h;
    var c = App.client && App.client(id); if (!c || !c.cloudId) return h;
    setTimeout(function () { var av = document.querySelector('.avatar.lg'); if (!av) return; signed(c.cloudId).then(function (u) { if (u) { ring(av); av.innerHTML = img(u); } }); });
    return h;
  };

  // ---------- coach photo: private bucket coach-photos/<coachUserId>/avatar.jpg (coach writes; only his linked clients read) ----------
  var CK = 'fbg.coachAvatar', cc = {};
  function coachSigned(uid) {
    var c = cc[uid]; if (c && c.at > Date.now() - 3e6) return Promise.resolve(c.url);
    var s = sb(); if (!s || !uid) return Promise.resolve('');
    return s.storage.from('coach-photos').list(uid).then(function (r) {
      var f = (r.data || []).filter(function (x) { return x.name === 'avatar.jpg'; })[0];
      if (!f) { cc[uid] = { at: Date.now(), url: '' }; return ''; }
      return s.storage.from('coach-photos').createSignedUrl(uid + '/avatar.jpg', 3600).then(function (u) { var url = (u.data && u.data.signedUrl) || ''; if (url) url += '&t=' + encodeURIComponent(f.updated_at || ''); cc[uid] = { at: Date.now(), url: url }; return url; });
    }).catch(function () { return ''; });
  }
  function myCoachUid() { var C = App.cloud; return C && C.role && C.role() === 'coach' && C.user() && C.user().id; }
  function coachLocal() { try { return localStorage.getItem(CK) || ''; } catch (e) { return ''; } }
  function coachSetLocal(v) { try { if (v) localStorage.setItem(CK, v); else localStorage.removeItem(CK); } catch (e) {} }
  function coachMine() { var l = coachLocal(); if (l) return Promise.resolve(l); return coachSigned(myCoachUid()); }
  function saveCoach(b) {
    var uid = myCoachUid(), c = sb();
    if (!uid || !c) return App.toast('Log eerst in als coach (More → Live koppeling)');
    toData(b).then(function (d) { coachSetLocal(d); App.rerender(); });
    c.storage.from('coach-photos').upload(uid + '/avatar.jpg', b, { upsert: true, contentType: 'image/jpeg', cacheControl: '60' }).then(function (r) { if (r.error) App.toast('⚠️ Upload: ' + r.error.message); else { delete cc[uid]; App.toast('Coachfoto opgeslagen ✓'); } });
  }
  A['coach-avatar-edit'] = function () {
    var has = !!coachLocal() || !!(cc[myCoachUid()] && cc[myCoachUid()].url);
    var s = App.sheet('<b style="color:' + G + '">👤 Coachfoto</b><p class="tiny muted" style="margin:6px 0 12px">🔒 Alleen jouw gekoppelde klanten zien deze foto.</p>' +
      '<button class="btn primary lg block" id="ca-cam">📷 Foto maken</button><button class="btn lg block" id="ca-lib" style="margin-top:8px">🖼️ Kies uit fotobibliotheek</button>' +
      (has ? '<button class="btn danger block" id="ca-del" style="margin-top:8px">🗑️ Coachfoto verwijderen</button>' : '') + '<button class="btn ghost block" id="ca-cl" style="margin-top:8px">Annuleren</button>', { label: 'Coachfoto' });
    s.el.querySelector('#ca-cam').onclick = function () { s.close(); pick(true, saveCoach); };
    s.el.querySelector('#ca-lib').onclick = function () { s.close(); pick(false, saveCoach); };
    s.el.querySelector('#ca-cl').onclick = function () { s.close(); };
    var d = s.el.querySelector('#ca-del'); if (d) d.onclick = function () {
      if (!confirm('Coachfoto verwijderen?')) return;
      coachSetLocal(''); var uid = myCoachUid(), c = sb(); if (uid && c) c.storage.from('coach-photos').remove([uid + '/avatar.jpg']).then(function () { delete cc[uid]; });
      s.close(); App.rerender(); App.toast('Coachfoto verwijderd');
    };
  };
  function circ(size, attr, txt, act) { return '<' + (act ? 'button data-act="' + act + '"' : 'div') + ' class="avatar" ' + attr + ' style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;border:2px ' + (act ? 'dashed' : 'solid') + ' ' + G + ';background:#111;color:' + G + ';font-size:' + Math.round(size / 2.6) + 'px;display:flex;align-items:center;justify-content:center;flex:none">' + esc(txt) + '</' + (act ? 'button' : 'div') + '>'; }
  var oMore2 = V.more; V.more = function () {
    var h = oMore2.apply(this, arguments); if (S.role !== 'coach') return h;
    setTimeout(function () { fill('[data-av-coach]', coachMine()); });
    return '<div class="card row" style="margin-bottom:12px;gap:12px;align-items:center">' + circ(64, 'data-av-coach', App.initials(S.coach.name) || '👤', 'coach-avatar-edit') + '<div class="grow"><b>👤 Coachfoto</b><div class="tiny muted">Je klanten zien deze foto in hun app</div></div><button class="btn sm" data-act="coach-avatar-edit">' + (coachLocal() ? 'Wijzigen' : 'Instellen') + '</button></div>' + h;
  };
  var oToday2 = V.today; V.today = function () {
    var h = oToday2.apply(this, arguments), C = App.cloud, uid = C && C.coachId && C.coachId(); if (!uid) return h;
    var nm = (S.me.coach && S.me.coach.name) || 'Je coach';
    setTimeout(function () { fill('[data-av-mycoach]', coachSigned(uid)); });
    var m = h.indexOf('data-av-me'), k = m < 0 ? h.indexOf('</h1>') : h.indexOf('</button></div>', m) + 10; if (k < 10) return h;
    return h.slice(0, k + 5) + '<div class="card row" style="gap:12px;align-items:center;margin:10px 0">' + circ(44, 'data-av-mycoach', App.initials(nm)) + '<div class="grow"><div class="tiny muted">Je coach</div><b>' + esc(nm) + '</b></div></div>' + h.slice(k + 5);
  };
})();
