/* Forged by Grace v3.9 — coach invite link (?join=<token>): install tip → intake → account → auto-linked to coach. */
(function () {
  'use strict';
  var App = window.App, S = App.S, esc = App.esc, t = App.t, A = App.acts, V = App.views, C = App.cloud;
  var FB = window.FBG, nl = function () { return S.lang !== 'en'; };
  var BASE = 'https://aisihom.github.io/forged-by-grace/';
  function L(n, e) { return nl() ? n : e; }
  function tok() { try { return localStorage.getItem('fbg.join') || ''; } catch (e) { return ''; } }
  function pending() { return !!tok() && !localStorage.getItem('fbg.joined') && S.role !== 'coach'; }
  var m = (location.search || '').match(/[?&]join=([a-z0-9]{6,12})/i);
  if (m) { try { localStorage.setItem('fbg.join', m[1].toLowerCase()); } catch (e) {} if (!S.role) { S.lang = 'nl'; App.save(); } if (!location.hash) history.replaceState(null, '', location.pathname + location.search + '#/join'); }
  App.startJoin = function (code) { localStorage.setItem('fbg.join', String(code).toLowerCase()); localStorage.removeItem('fbg.joined'); location.hash = '#/join'; App.route(); };
  function intake() { var l = FB.store.get('intakes', null); return (l && l[0]) || FB.store.get('intakeLast', null); }
  function ios() { return /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone; }
  var PRIV = 'Privacy: Forged by Grace (Aarón Ricardo) bewaart je gegevens bij Supabase in Frankfurt (EU), versleuteld en alleen zichtbaar voor jou en je coach. We gebruiken ze uitsluitend om je te coachen, nooit voor reclame en we verkopen niets door. Je kunt altijd inzage, correctie of verwijdering vragen bij je coach (AVG). Intrekken = uitloggen en vragen om verwijdering.';

  function view() {
    var k = tok(), p = intake(), gold = 'border:1px solid rgba(212,175,55,.55)';
    var h = '<div class="join" style="padding:8px 2px 40px"><div class="center" style="margin:18px 0"><div style="font-size:42px">🔥</div><h1 class="h1" style="color:var(--gold,#d4af37)">' + esc(L('Welkom bij Forged by Grace', 'Welcome to Forged by Grace')) + '</h1><p class="muted">' + esc(L('Je coach Aarón Ricardo heeft je uitgenodigd. 3 korte stappen en je bent gekoppeld.', 'Your coach Aarón Ricardo invited you. 3 short steps and you are linked.')) + '</p></div>';
    if (ios()) h += '<div class="card" style="margin-bottom:12px;' + gold + '"><b>📲 ' + esc(L('Eerst: zet de app op je beginscherm', 'First: add the app to your Home Screen')) + '</b><ol class="small" style="margin:8px 0 8px 18px;padding:0"><li>' + esc(L('Tik onderaan in Safari op het deel-icoon (vierkant met pijl).', 'Tap the Share icon at the bottom of Safari.')) + '</li><li>' + esc(L('Kies Add to Home Screen → Add.', 'Choose Add to Home Screen → Add.')) + '</li><li>' + esc(L('Open de app via het icoon en tik op “Ik heb een code van mijn coach”. Plak deze code:', 'Open the app from the icon and tap “I have a code from my coach”. Paste this code:')) + '</li></ol>' +
      '<div class="row"><code class="grow mono" style="font-size:20px;letter-spacing:2px;color:var(--gold,#d4af37)">JOIN-' + esc(k) + '</code><button class="btn sm" data-act="join-copy">' + esc(L('Kopieer', 'Copy')) + '</button></div><p class="tiny muted" style="margin-top:6px">' + esc(L('Of ga hieronder gewoon verder in Safari.', 'Or just continue below in Safari.')) + '</p></div>';
    h += '<div class="card" style="margin-bottom:12px;' + gold + '"><b>1. ' + esc(L('Intake-vragenlijst', 'Intake questionnaire')) + (p ? ' ✓' : '') + '</b><p class="small muted">' + esc(p ? L('Ingevuld. Je antwoorden gaan mee naar je coach.', 'Done. Your answers go to your coach.') : L('Een paar vragen zodat je coach je goed kan helpen (±5 min).', 'A few questions so your coach can help you (±5 min).')) + '</p>' +
      '<a class="btn ' + (p ? '' : 'primary ') + 'block" href="intake.html?join=' + esc(k) + '&lang=' + (nl() ? 'nl' : 'en') + '">' + esc(p ? L('Antwoorden aanpassen', 'Edit answers') : L('Start vragenlijst', 'Start questionnaire')) + '</a></div>';
    var a = (p && p.answers) || {};
    h += '<div class="card" style="' + gold + (p ? '' : ';opacity:.55') + '"><b>2. ' + esc(L('Account aanmaken', 'Create account')) + '</b>' +
      '<form id="jf" style="margin-top:8px"><input class="input" id="jn" placeholder="' + esc(L('Naam', 'Name')) + '" value="' + esc(a.name || '') + '" required>' +
      '<input class="input" id="je" type="email" autocomplete="username" placeholder="E-mail" value="' + esc(a.email || '') + '" required style="margin-top:8px">' +
      '<input class="input" id="jp" type="password" autocomplete="new-password" minlength="6" placeholder="' + esc(L('Kies een wachtwoord (min. 6)', 'Choose a password (min. 6)')) + '" required style="margin-top:8px">' +
      '<label class="row small" style="gap:8px;margin-top:12px;align-items:flex-start"><input type="checkbox" id="jc"><span>' + esc(L('Ik ga akkoord dat mijn trainings-, voedings-, lichaams- en check-in-gegevens (ook foto’s) veilig in de EU worden bewaard en alleen met mijn coach worden gedeeld.', 'I agree that my training, food, body and check-in data (including photos) are stored securely in the EU and shared only with my coach.')) + '</span></label>' +
      '<details class="tiny muted" style="margin-top:6px"><summary>Privacy</summary><p>' + esc(PRIV) + '</p></details>' +
      '<p class="tiny" id="jm" style="min-height:1em;color:var(--gold,#d4af37)"></p><button class="btn primary lg block" type="submit"' + (p ? '' : ' disabled') + '>' + esc(L('Account aanmaken & koppelen', 'Create account & link')) + '</button>' +
      '<p class="tiny muted center" style="margin-top:8px">' + esc(L('Al een account? Vul hetzelfde e-mailadres en wachtwoord in.', 'Already have an account? Use the same email and password.')) + '</p></form></div></div>';
    return h;
  }
  A['join-copy'] = function () { App.F.copyText('JOIN-' + tok()).then(function () { App.toast(L('Gekopieerd', 'Copied')); }); };

  function bindForm() {
    var f = document.getElementById('jf'); if (!f) return;
    var $ = function (q) { return document.querySelector(q); }, msg = function (x) { $('#jm').textContent = x; };
    f.onsubmit = function (e) {
      e.preventDefault(); if (!$('#jc').checked) return msg(L('Vink eerst het akkoord-vakje aan.', 'Please tick the consent box.'));
      var em = $('#je').value.trim().toLowerCase(), pw = $('#jp').value, nm = $('#jn').value.trim(), p = intake();
      localStorage.setItem('fbg.consent', new Date().toISOString()); msg('…');
      C.load().then(function () {
        var sb = C.sb;
        return sb.auth.signUp({ email: em, password: pw, options: { emailRedirectTo: BASE } }).then(function (r) {
          if (r.error && /registered|exists/i.test(r.error.message)) return sb.auth.signInWithPassword({ email: em, password: pw });
          return r;
        }).then(function (r) {
          if (r.error) throw r.error; if (!r.data.session) throw new Error(L('Kijk in je inbox om je e-mail te bevestigen.', 'Check your inbox to confirm your email.'));
          var prof = Object.assign({}, S.me.profile || {}, { name: nm }); 
          return sb.rpc('join_coach', { p_token: tok(), p_name: nm, p_profile: prof });
        }).then(function (r) {
          if (r.error) throw r.error;
          localStorage.setItem('fbg.joined', r.data);
          S.me.profile = Object.assign({}, S.me.profile || {}, { name: nm }); S.role = 'athlete'; App.save();
          return C.restart();
        });
      }).then(function () { App.toast('✅ ' + L('Gekoppeld aan je coach!', 'Linked to your coach!')); location.hash = '#/today'; App.route(); })
        .catch(function (err) { msg((err && err.message) || L('Offline — probeer het later opnieuw.', 'Offline — try again later.')); });
    };
  }
  var oRoute = App.route;
  App.route = function () {
    if (pending() && (!S.role || location.hash === '#/join')) { App.renderTabs(''); var v = document.getElementById('view'); v.innerHTML = view(); App.bind(v); bindForm(); window.scrollTo(0, 0); return; }
    return oRoute.apply(this, arguments);
  };

  // ---------- coach: invite link ----------
  var myTok = null;
  function getTok() {
    if (myTok) return Promise.resolve(myTok);
    return C.load().then(function () { var u = C.user(); if (!u) throw new Error('signin');
      return C.sb.from('coaches').select('invite_token').eq('user_id', u.id).maybeSingle(); }).then(function (r) { if (!r.data || !r.data.invite_token) throw new Error('signin'); return (myTok = r.data.invite_token); });
  }
  App.inviteLink = function (k) { return BASE + '?join=' + k; };
  A['coach-invite'] = function () {
    var s = App.sheet(App.sheetHead('🔗 ' + L('Uitnodigingslink', 'Invite link'), L('Stuur deze link naar elke nieuwe klant. Na de intake en het account staat hij automatisch in jouw dossier.', 'Send this link to any new client. After intake and sign-up they appear in your dashboard automatically.')) + '<div id="ivo"><p class="small muted">…</p></div>');
    getTok().then(function (k) {
      var link = App.inviteLink(k), msg = 'Hoi! Welkom bij Forged by Grace 💪\n\n1. Open deze link op je iPhone in Safari: ' + link + '\n2. Zet de app op je beginscherm (deel-icoon → Add to Home Screen) en plak de code JOIN-' + k + ' als daarom gevraagd wordt.\n3. Vul de intake in en maak je account aan.\n\nDaarna zie ik je gegevens direct en maak ik je plan. Groet, Aarón';
      s.el.querySelector('#ivo').innerHTML = '<input class="input mono" readonly value="' + esc(link) + '"><button class="btn primary block" id="iv1" style="margin-top:8px">' + esc(L('Kopieer link', 'Copy link')) + '</button>' +
        '<p class="small" style="margin-top:14px"><b>' + esc(L('Bericht om te sturen', 'Message to send')) + '</b></p><textarea class="input" rows="8" readonly>' + esc(msg) + '</textarea><button class="btn block" id="iv2" style="margin-top:8px">' + esc(L('Kopieer bericht', 'Copy message')) + '</button>' +
        (navigator.share ? '<button class="btn ghost block" id="iv3" style="margin-top:8px">' + esc(L('Delen…', 'Share…')) + '</button>' : '');
      s.el.querySelector('#iv1').onclick = function () { App.F.copyText(link).then(function () { App.toast(L('Link gekopieerd', 'Link copied')); }); };
      s.el.querySelector('#iv2').onclick = function () { App.F.copyText(msg).then(function () { App.toast(L('Bericht gekopieerd', 'Message copied')); }); };
      var b3 = s.el.querySelector('#iv3'); if (b3) b3.onclick = function () { navigator.share({ text: msg }).catch(function () {}); };
    }).catch(function () { s.el.querySelector('#ivo').innerHTML = '<p class="small">' + esc(L('Log eerst in als coach: More → ☁️ Live koppeling → Inloggen.', 'Sign in as coach first: More → ☁️ Live sync → Sign in.')) + '</p>'; });
  };
  function btn() { return '<button class="btn block" data-act="coach-invite" style="margin:10px 0;border:1px solid rgba(212,175,55,.6);color:var(--gold,#d4af37)">🔗 ' + esc(L('Uitnodigingslink', 'Invite link')) + '</button>'; }
  function notice() {
    var n = S.clients.filter(function (c) { return /uitnodigingslink/i.test(c.cloudNotes || '') && !c.plan; });
    if (!n.length) return '';
    return '<div class="card" style="margin:10px 0;border:1px solid rgba(212,175,55,.8)"><b style="color:var(--gold,#d4af37)">🆕 ' + esc(L('Nieuwe klant(en) via uitnodiging', 'New client(s) via invite')) + '</b>' + n.map(function (c) { return '<a class="list-item" href="#/client/' + esc(c.id) + '"><div class="grow"><b>' + esc(c.name) + '</b><div class="tiny muted">' + esc(L('Intake binnen · heeft nog een plan nodig', 'Intake received · needs a plan')) + '</div></div><span class="chev">›</span></a>'; }).join('') + '</div>';
  }
  var oCl = V.clients; V.clients = function () { var h = oCl.apply(this, arguments), i = h.indexOf('<div class="row" style="margin:14px 0">'); var add = notice() + btn(); return i > -1 ? h.slice(0, i) + add + h.slice(i) : h + add; };
  var oMore = V.more; V.more = function () { var h = oMore.apply(this, arguments); return S.role === 'coach' ? btn() + h : h; };
  // coach client page: show intake answers
  var oC = V.client; V.client = function (id) {
    var h = oC.apply(this, arguments), c = id !== 'me' && App.client(id); if (!c || !c.live || !c.live.d || !c.live.d.intake) return h;
    var ik = c.live.d.intake; ik = Array.isArray(ik) ? ik[0] : ik; if (!ik || !ik.answers) return h;
    var txt = ''; try { txt = FB.summaryText(ik, { withData: false }); } catch (e) { txt = JSON.stringify(ik.answers, null, 1); }
    return h + '<details class="card" open style="margin-top:12px;border:1px solid rgba(212,175,55,.5)"><summary class="h3">📝 ' + esc(L('Intake-antwoorden', 'Intake answers')) + '</summary><pre class="summary" style="white-space:pre-wrap;margin-top:10px">' + esc(txt) + '</pre></details>';
  };
})();
