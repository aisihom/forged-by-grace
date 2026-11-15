/* Forged by Grace v3.31 — access: (1) coach-approval gate, (2) "deleted by your coach" phone wipe.
   Gate: the app is only usable on the coach's own device or by an APPROVED cloud client (has a client id from
   the server). New sign-ups wait on a black/gold screen until the coach taps "Toegang geven". The server enforces
   the same (RLS); this screen is only the friendly face of it.
   Wipe: ONLY when the server explicitly answers `true` to fbg_was_deleted(client id, user id). Errors, offline,
   empty or odd answers never wipe anything. */
(function () {
  'use strict';
  var App = window.App, S = App.S, esc = App.esc, A = App.acts, V = App.views, F = App.F;
  var URL_ = 'https://hdcpxmctilthjhdhhixw.supabase.co', KEY = 'sb_publishable_oFIIm1osyVtpV-t9PCjFxA_tkkQ9xUg';
  function L(n, e) { return S.lang === 'en' ? e : n; }
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  // ---------- coach device: existing coach installs keep working (one-time, before the gate existed) ----------
  if (S.gateV !== 1) { if (S.role === 'coach' || S.me.isCoach) S.me.coachOk = true; S.gateV = 1; App.save(); }

  // ---------- deleted clients (coach side) ----------
  App.isDeletedClient = function (id) { return !!(id && S.deletedCloud && S.deletedCloud[id]); };
  App.applyDeletedClients = function (ids) {
    if (!Array.isArray(ids) || !ids.length) return false;
    var own = App.cloud && App.cloud.selfClientId && App.cloud.selfClientId(), changed = false;
    S.deletedCloud = S.deletedCloud || {};
    ids.forEach(function (id) { if (typeof id === 'string' && id && id !== own && !S.deletedCloud[id]) { S.deletedCloud[id] = Date.now(); changed = true; } });
    var before = S.clients.length;
    S.clients = App.S.clients = S.clients.filter(function (c) { return !(c.cloudId && S.deletedCloud[c.cloudId]) && !S.deletedCloud[c.id]; });
    return changed || S.clients.length !== before;
  };

  // ---------- phone wipe ----------
  function myIds() {
    var cid = S.me && S.me.cid, uid = ls('fbg.uid');
    if (!uid) { try { var a = JSON.parse(ls('fbg.sb.auth') || 'null'); uid = a && a.user && a.user.id; } catch (e) {} }
    return { cid: typeof cid === 'string' ? cid : null, uid: uid || null };
  }
  // strict: only a 200 with the JSON literal true counts
  App.tombstoneSays = function (status, body) { if (status !== 200) return false; try { return JSON.parse(body) === true; } catch (e) { return false; } };
  var lastCheck = 0, wiping = false;
  App.checkDeleted = function (force) {
    var id = myIds(), f = App._fetch || window.fetch;
    if (!id.cid || S.me.coachOk || wiping || !f) return Promise.resolve(false);
    if (!force && Date.now() - lastCheck < 30000) return Promise.resolve(false);
    lastCheck = Date.now();
    var body = JSON.stringify({ p_cid: id.cid, p_uid: id.uid });
    return Promise.resolve().then(function () {
      return f(URL_ + '/rest/v1/rpc/fbg_was_deleted', { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json', Accept: 'application/json' }, body: body, cache: 'no-store' });
    }).then(function (r) { return r.text().then(function (t) { return App.tombstoneSays(r.status, t); }); })
      .then(function (yes) { if (yes) { App.wipeDevice(); return true; } return false; }, function () { return false; });
  };
  App.wipeDevice = function () {
    wiping = true;
    App.save = function () { return true; }; // nothing may be written back while wiping
    try { var C = App.cloud; if (C && C.sb) C.sb.auth.signOut({ scope: 'local' }).catch(function () {}); } catch (e) {}
    var keys = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && /^(fbg|sb-)/i.test(k)) keys.push(k); } keys.forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    var done = function () {
      try { localStorage.setItem('fbg.deletedNotice', '1'); } catch (e) {}
      if (App._noReload) return;
      location.replace(location.pathname + '#/'); location.reload();
    };
    try { if (window.indexedDB) { var rq = indexedDB.deleteDatabase('fbg-photos'); rq.onsuccess = rq.onerror = rq.onblocked = function () { done(); }; setTimeout(done, 2500); } else done(); } catch (e) { done(); }
    return keys.length;
  };
  // after the wipe: one calm message, then the welcome/sign-in screen
  if (ls('fbg.deletedNotice')) {
    try { localStorage.removeItem('fbg.deletedNotice'); } catch (e) {}
    setTimeout(function () {
      var s = App.sheet('<h2 class="h2" style="color:var(--gold,#d4af37)">' + esc(L('Je account is door je coach verwijderd.', 'Your account was deleted by your coach.')) + '</h2><p class="muted">' + esc(L('Al je gegevens zijn van deze telefoon gewist.', 'All your data has been erased from this phone.')) + '</p><button class="btn primary block" data-close style="margin-top:14px">OK</button>');
      void s;
    }, 300);
  }

  // ---------- gate ----------
  var bootAt = Date.now();
  setTimeout(function () { if (App.accessState() !== 'ok' && !document.querySelector('.sheet')) App.route(); }, 8200);
  App.accessState = function () {
    if (S.me.coachOk) return 'ok';
    if (ls('fbg.pending')) return 'pending';
    if (S.me.cid) return 'ok';
    var C = App.cloud, r = C && C.role && C.role();
    if (ls('fbg.sb.auth') && r == null && Date.now() - bootAt < 8000 && !(C && C.state().status === 'offline')) return 'checking';
    return 'login';
  };
  function logo() { return '<div class="logo-xl">' + (App.LOGO || '') + '</div><p class="kicker center">' + esc(S.coach.name) + '</p><h1 class="h1 center">Forged by Grace</h1>'; }
  V.locked = function (st) {
    var gold = 'border:1px solid rgba(212,175,55,.6)', h = '<div class="welcome locked">' + logo();
    if (st === 'pending') {
      h += '<div class="card" style="margin-top:18px;' + gold + '"><h2 class="h2" style="color:var(--gold,#d4af37)">⏳ ' + esc(L('Wacht op goedkeuring van je coach', 'Waiting for your coach to approve you')) + '</h2>' +
        '<p class="muted">' + esc(L('Je account is aangemaakt. Zodra ' + S.coach.name + ' je toegang geeft, opent de app vanzelf.', 'Your account is ready. As soon as ' + S.coach.name + ' gives you access, the app opens by itself.')) + '</p>' +
        '<button class="btn primary block" data-act="acc-recheck" style="margin-top:12px">' + esc(L('Opnieuw controleren', 'Check again')) + '</button>' +
        '<button class="btn ghost block small" data-act="acc-out" style="margin-top:8px">' + esc(L('Uitloggen', 'Sign out')) + '</button></div>';
    } else if (st === 'checking') {
      h += '<p class="center muted" style="margin-top:22px">' + esc(L('Even je account controleren…', 'Checking your account…')) + '</p>';
    } else {
      var C = App.cloud, u = C && C.state && C.state().user;
      h += '<div class="lang-row">' + (App.langSwitch ? App.langSwitch() : '') + '</div>' +
        '<div class="card" style="margin-top:18px;' + gold + '"><p>' + esc(L('Forged by Grace is alleen voor klanten van ' + S.coach.name + '. Log in met je account, of open de uitnodigingslink van je coach.', 'Forged by Grace is only for clients of ' + S.coach.name + '. Sign in with your account, or open the invite link from your coach.')) + '</p>' +
        (u ? '<p class="small" style="color:var(--gold,#d4af37)">' + esc(L('Ingelogd als ' + u + ', maar dit account is nog niet gekoppeld. Vraag je coach om een uitnodigingslink.', 'Signed in as ' + u + ', but this account is not linked yet. Ask your coach for an invite link.')) + '</p>' : '') +
        '<div class="stack" style="margin-top:12px">' +
        (u ? '<button class="btn block" data-act="acc-out">' + esc(L('Uitloggen', 'Sign out')) + '</button>' : '<button class="btn primary lg block" data-act="cloud-in">☁️ ' + esc(L('Inloggen', 'Sign in')) + '</button>') +
        '<button class="btn lg block" data-act="have-code">' + esc(L('Ik heb een code van mijn coach', 'I have a code from my coach')) + '</button></div></div>';
    }
    return h + '</div>';
  };
  A['acc-recheck'] = function () { App.toast('…'); var C = App.cloud; if (C && C.recheck) C.recheck(); };
  A['acc-out'] = function () { var C = App.cloud; try { localStorage.removeItem('fbg.pending'); } catch (e) {} if (C && C.sb) C.sb.auth.signOut().then(function () { App.route(); }); else App.route(); };

  var oRoute = App.route;
  App.route = function () {
    var h = location.hash || '', qs = location.search || '';
    var pass = /^#imp=|^#health/.test(h) || /[?&](client|steps|weight|rhr|kcal|fat)=/.test(qs) || /fbgh_/.test(qs + h) ||
      (ls('fbg.join') && !ls('fbg.joined') && (!S.role || /^#\/join/.test(h)));
    var st = App.accessState();
    if (pass || st === 'ok') return oRoute.apply(this, arguments);
    App.renderTabs(''); var v = document.getElementById('view'); v.innerHTML = V.locked(st); App.bind(v); window.scrollTo(0, 0);
    document.title = 'Forged by Grace';
  };
  // while waiting: look again when the app comes back to the front
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    if (App.accessState() === 'pending' && App.cloud && App.cloud.recheck) App.cloud.recheck();
    App.checkDeleted();
  });
  window.addEventListener('online', function () { App.checkDeleted(true); });
  setTimeout(function () { App.checkDeleted(true); }, 1500);

  // ---------- coach: pending sign-ups on top of the client list ----------
  function pendingCard() {
    var C = App.cloud, p = C && C.pending ? C.pending() : [];
    if (!p.length) return '';
    return '<div class="card" id="acc-pending" style="margin:10px 0;border:1px solid rgba(212,175,55,.9)"><b style="color:var(--gold,#d4af37)">🔐 ' + esc(L('Wachten op toegang', 'Waiting for access')) + ' (' + p.length + ')</b>' +
      p.map(function (c) {
        return '<div class="list-item" style="display:block"><b>' + esc(c.name || c.email || '') + '</b><div class="tiny muted">' + esc(c.email || '') + '</div>' +
          '<div class="grid2" style="margin-top:8px"><button class="btn primary sm" data-act="acc-approve" data-id="' + esc(c.id) + '">' + esc(L('Toegang geven', 'Give access')) + '</button>' +
          '<button class="btn sm gold-line" data-act="acc-reject" data-id="' + esc(c.id) + '" data-name="' + esc(c.name || c.email || '') + '">' + esc(L('Weigeren', 'Refuse')) + '</button></div></div>';
      }).join('') + '</div>';
  }
  var oCl = V.clients; V.clients = function () { var h = oCl.apply(this, arguments), card = pendingCard(); if (!card) return h; var i = h.indexOf('<div class="grid3">'); return i > -1 ? h.slice(0, i) + card + h.slice(i) : card + h; };
  A['acc-approve'] = function (el) {
    el.disabled = true;
    App.cloud.approve(el.dataset.id).then(function () { App.toast('✅ ' + L('Toegang gegeven', 'Access given')); App.rerender(); })
      .catch(function (e) { el.disabled = false; App.toast(L('Lukte niet: ', 'Failed: ') + ((e && e.message) || '')); });
  };
  A['acc-reject'] = function (el) {
    App.deleteSheet({ name: el.dataset.name, cloudId: el.dataset.id, pending: true }, function () { App.rerender(); });
  };

  // ---------- strong delete confirmation (used by coach "Delete client" and "Weigeren") ----------
  App.deleteSheet = function (c, after) {
    var cloud = !!c.cloudId, need = String(c.name || '').trim();
    var txt = cloud
      ? L('Dit wist ALLES van ' + need + ': account, check-ins, foto’s, eten, training en stappen, op de server én op de telefoon van ' + need + '. Dit kan niet ongedaan worden gemaakt.', 'This erases EVERYTHING of ' + need + ': account, check-ins, photos, food, training and steps, on the server AND on ' + need + '’s phone. This cannot be undone.')
      : L('Deze klant staat alleen op dit toestel (geen account). Hij wordt hier verwijderd. Dit kan niet ongedaan worden gemaakt.', 'This client exists only on this device (no account). It is removed here. This cannot be undone.');
    var s = App.sheet('<h2 class="h2" style="color:var(--gold,#d4af37)">⚠️ ' + esc(c.pending ? L('Weigeren en alles wissen?', 'Refuse and erase everything?') : L('Klant definitief verwijderen?', 'Delete client permanently?')) + '</h2>' +
      '<p class="muted">' + esc(txt) + '</p>' +
      (cloud ? '<p class="small" style="margin-top:10px">' + esc(L('De telefoon wordt gewist zodra de app daar weer online opent.', 'The phone is erased the next time the app opens there online.')) + '</p>' : '') +
      '<label class="field" style="margin-top:12px"><span class="label">' + esc(L('Typ de naam om te bevestigen: ', 'Type the name to confirm: ')) + '<b>' + esc(need) + '</b></span><input class="input" id="del-n" autocomplete="off" autocapitalize="off"></label>' +
      '<p class="tiny" id="del-m" style="min-height:1em;color:var(--gold,#d4af37)"></p>' +
      '<div class="row" style="margin-top:12px"><button class="btn ghost grow" data-close>' + esc(L('Annuleren', 'Cancel')) + '</button><button class="btn danger-gold grow" id="del-go" disabled>' + esc(L('Definitief verwijderen', 'Delete permanently')) + '</button></div>');
    var inp = s.el.querySelector('#del-n'), go = s.el.querySelector('#del-go'), m = s.el.querySelector('#del-m');
    var norm = function (x) { return String(x || '').trim().toLowerCase().replace(/\s+/g, ' '); };
    inp.oninput = function () { go.disabled = !need || norm(inp.value) !== norm(need); };
    go.onclick = function () {
      if (go.disabled) return; go.disabled = true; m.textContent = L('Bezig met wissen…', 'Erasing…');
      var p = cloud ? App.cloud.deleteClient(c.cloudId) : Promise.resolve();
      p.then(function () {
        if (c.id) S.clients = App.S.clients = S.clients.filter(function (x) { return x.id !== c.id; });
        App.save(); s.close(); App.toast('🗑️ ' + L(need + ' is verwijderd', need + ' was deleted')); if (after) after();
      }).catch(function (e) {
        go.disabled = false;
        var msg = (e && e.message) || '';
        m.textContent = L('Verwijderen is niet helemaal gelukt. Probeer het opnieuw, dan wordt de rest gewist. ', 'Delete did not fully finish. Try again to erase the rest. ') + (/photos left|list failed/.test(msg) ? L('(foto’s konden niet weg)', '(photos could not be removed)') : msg);
      });
    };
    setTimeout(function () { inp.focus(); }, 50);
  };
})();
