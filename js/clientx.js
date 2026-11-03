/* Forged by Grace v3.7 — coach-made client setup: plan notes, meal-plan ideas (eetschema) and coach-only health flags. */
(function () {
  'use strict';
  var App = window.App, S = App.S, esc = App.esc, t = App.t, V = App.views;
  function notesCard(plan) {
    if (!plan || !plan.notes || !plan.notes.length) return '';
    return '<div class="card cx-card"><b>📋 ' + esc(t('Guidelines from your coach')) + '</b><ul class="small" style="margin:8px 0 0;padding-left:18px">' + plan.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>';
  }
  function ideasCard(meal) {
    if (!meal || !meal.ideas) return '';
    var I = meal.ideas, T = meal.targets || {};
    var h = '<div class="card cx-card"><b>🍽️ ' + esc(t('Meal plan from your coach')) + '</b><div class="tiny muted">' + T.kcal + ' kcal · P ' + T.p + ' g · C ' + T.c + ' g · F ' + T.f + ' g</div>';
    if (I.principle) h += '<p class="small" style="margin:8px 0">' + esc(I.principle) + '</p>';
    if (I.split) h += '<p class="tiny muted" style="margin:0 0 6px">' + esc(I.split) + '</p>';
    (I.groups || []).forEach(function (g) { h += '<details class="cx-d"><summary><b>' + esc(g.title) + '</b></summary><ul class="small">' + g.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details>'; });
    if (I.tips && I.tips.length) h += '<details class="cx-d" open><summary><b>' + esc(I.tipsTitle || 'Tips') + '</b></summary><ul class="small">' + I.tips.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details>';
    return h + '</div>';
  }
  App.cxIdeas = ideasCard;
  function insertAfterFirstCard(h, add) { var i = h.indexOf('<div class="grid3 add-row"'); return i === -1 ? h + add : h.slice(0, i) + add + h.slice(i); }
  var oFood = V.food; V.food = function () { var h = oFood.apply(this, arguments); return insertAfterFirstCard(h, ideasCard(S.me.meal)); };
  var oTrain = V.train; V.train = function () { var h = oTrain.apply(this, arguments); var c = notesCard(S.me.plan); if (!c) return h; var i = h.indexOf('<div class="section'); return i === -1 ? h + c : h.slice(0, i) + c + h.slice(i); };
  var oMeal = V.meal; V.meal = function (oid) { var h = oMeal.apply(this, arguments), o = App.owner(oid); return h + ideasCard(o && o.meal); };
  var oClient = V.client; V.client = function (id) {
    var h = oClient.apply(this, arguments), c = App.client(id);
    if (!c || !c.flags || !c.flags.length) return h;
    var f = '<div class="card cx-flags"><b>⚠️ ' + esc(t('Health flags')) + '</b><ul class="small" style="margin:6px 0 0;padding-left:18px">' + c.flags.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    var i = h.indexOf('<div class="section'); return i === -1 ? h + f : h.slice(0, i) + f + h.slice(i);
  };
  var NL = { 'Guidelines from your coach': 'Richtlijnen van je coach', 'Meal plan from your coach': 'Eetschema van je coach', 'Health flags': 'Gezondheid – let op' };
  window.FBG_I18N = window.FBG_I18N || {}; window.FBG_I18N.nl = window.FBG_I18N.nl || {};
  Object.keys(NL).forEach(function (k) { if (!window.FBG_I18N.nl[k]) window.FBG_I18N.nl[k] = NL[k]; });
  var st = document.createElement('style');
  st.textContent = '.cx-card{border:1px solid rgba(212,175,55,.45);margin:12px 0}.cx-d{margin-top:8px}.cx-d summary{cursor:pointer;color:var(--gold,#d4af37)}.cx-d ul{margin:6px 0 0;padding-left:18px}.cx-flags{border:1px solid #d4af37;background:rgba(212,175,55,.08);margin:12px 0}';
  document.head.appendChild(st);
})();
/* v3.7 — device-local password lock for client profiles (no server: protects this phone only). */
(function () {
  'use strict';
  var App = window.App, S = App.S, esc = App.esc, t = App.t, A = App.acts;
  var NL = { 'Create your password': 'Maak je wachtwoord', 'Protects your profile on this phone.': 'Beveiligt je profiel op deze telefoon.', 'Password': 'Wachtwoord', 'Repeat password': 'Herhaal wachtwoord',
    'At least 6 characters.': 'Minimaal 6 tekens.', 'Passwords do not match.': 'Wachtwoorden komen niet overeen.', 'Save password': 'Wachtwoord opslaan', 'Password saved': 'Wachtwoord opgeslagen',
    'Unlock': 'Ontgrendelen', 'Enter your password': 'Voer je wachtwoord in', 'Wrong password.': 'Onjuist wachtwoord.', 'Forgot password?': 'Wachtwoord vergeten?',
    'Ask your coach for a new personal link. Opening it lets you set a new password; your logs on this phone stay.': 'Vraag je coach om een nieuwe persoonlijke link. Open die en je kiest een nieuw wachtwoord; je gegevens op deze telefoon blijven bewaard.' };
  Object.keys(NL).forEach(function (k) { if (!window.FBG_I18N.nl[k]) window.FBG_I18N.nl[k] = NL[k]; });
  function hex(b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function derive(pw, saltHex) {
    var salt = new Uint8Array(saltHex.match(/../g).map(function (h) { return parseInt(h, 16); }));
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: 150000 }, k, 256); }).then(hex);
  }
  function overlay(html) { var o = document.createElement('div'); o.className = 'pw-ov'; o.innerHTML = '<div class="pw-box"><div class="logo-xl">' + App.LOGO + '</div>' + html + '</div>'; document.body.appendChild(o); return o; }
  App.setPassword = function (done) {
    var o = overlay('<h1 class="h1 center">' + esc(t('Create your password')) + '</h1><p class="small muted center">' + esc(t('Protects your profile on this phone.')) + '</p>' +
      '<form id="pwf"><label class="field"><span class="label">' + esc(t('Password')) + '</span><input class="input" type="password" id="pw1" autocomplete="new-password" minlength="6" required></label>' +
      '<label class="field"><span class="label">' + esc(t('Repeat password')) + '</span><input class="input" type="password" id="pw2" autocomplete="new-password" required></label>' +
      '<p class="tiny muted" id="pwm">' + esc(t('At least 6 characters.')) + '</p><button class="btn primary lg block" type="submit">' + esc(t('Save password')) + '</button></form>');
    o.querySelector('#pwf').onsubmit = function (e) {
      e.preventDefault(); var a = o.querySelector('#pw1').value, b = o.querySelector('#pw2').value, m = o.querySelector('#pwm');
      if (a.length < 6) { m.textContent = t('At least 6 characters.'); m.style.color = 'var(--bad,#e66)'; return; }
      if (a !== b) { m.textContent = t('Passwords do not match.'); m.style.color = 'var(--bad,#e66)'; return; }
      var salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      derive(a, salt).then(function (h) { S.me.pw = { salt: salt, hash: h, it: 150000 }; App.save(); try { sessionStorage.setItem('fbg.unlocked', '1'); } catch (x) {} o.remove(); App.toast(t('Password saved')); if (done) done(); });
    };
  };
  App.lockCheck = function () {
    if (!S.me.pw || S.role !== 'athlete' || /[?&]client=/.test(location.search) || /^#imp=/.test(location.hash)) return;
    try { if (sessionStorage.getItem('fbg.unlocked') === '1') return; } catch (x) {}
    if (document.querySelector('.pw-ov')) return;
    var o = overlay('<h1 class="h1 center">' + esc(t('Enter your password')) + '</h1><p class="small muted center">' + esc((S.me.profile && S.me.profile.name) || '') + '</p>' +
      '<form id="pwl"><input class="input" type="password" id="pwi" autocomplete="current-password" required><p class="tiny" id="pwe" style="color:var(--bad,#e66);min-height:1em"></p><button class="btn primary lg block" type="submit">' + esc(t('Unlock')) + '</button></form>' +
      '<details style="margin-top:14px"><summary class="small" style="color:var(--gold,#d4af37);cursor:pointer">' + esc(t('Forgot password?')) + '</summary><p class="small muted">' + esc(t('Ask your coach for a new personal link. Opening it lets you set a new password; your logs on this phone stay.')) + '</p></details>');
    o.querySelector('#pwl').onsubmit = function (e) {
      e.preventDefault();
      derive(o.querySelector('#pwi').value, S.me.pw.salt).then(function (h) {
        if (h !== S.me.pw.hash) { o.querySelector('#pwe').textContent = t('Wrong password.'); return; }
        try { sessionStorage.setItem('fbg.unlocked', '1'); } catch (x) {} o.remove();
      });
    };
  };
  // a coach setup link always (re)starts password creation = "forgot password" reset path
  var oAcc = A['accept-import'];
  A['accept-import'] = function () { var obj = App._pendingImport, setup = obj && obj.setup; if (setup) delete S.me.pw; oAcc.apply(this, arguments); if (setup && window.crypto && crypto.subtle) App.setPassword(); };
  var st = document.createElement('style');
  st.textContent = '.pw-ov{position:fixed;inset:0;z-index:9999;background:#000;display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto}.pw-box{width:100%;max-width:380px}.pw-box .logo-xl{margin:0 auto 12px}';
  document.head.appendChild(st);
  setTimeout(App.lockCheck, 0);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') App.lockCheck(); });
})();
/* v3.7.2 — client "paste your code" + move data Safari → Home Screen app. */
(function () {
  'use strict';
  var App = window.App, S = App.S, esc = App.esc, t = App.t, A = App.acts, V = App.views, F = App.F;
  var NL = { 'I have a code from my coach': 'Ik heb een code van mijn coach', 'Paste your code': 'Plak je code', 'Paste the link or code from your coach (or your export code).': 'Plak de link of code van je coach (of je exportcode).',
    'Open': 'Openen', 'Export to app': 'Exporteer naar app', 'Move your data to the Home Screen app': 'Zet je gegevens over naar de app op je beginscherm',
    'Copy this code, open the app from your Home Screen, tap “I have a code from my coach” and paste it.': 'Kopieer deze code, open de app vanaf je beginscherm, tik op “Ik heb een code van mijn coach” en plak hem.',
    'Copy code': 'Code kopiëren', 'Copied': 'Gekopieerd', 'Your data has been moved': 'Je gegevens zijn overgezet' };
  Object.keys(NL).forEach(function (k) { if (!window.FBG_I18N.nl[k]) window.FBG_I18N.nl[k] = NL[k]; });
  App.decodeMove = function (txt) { return App.decode(String(txt).replace(/\s+/g, '').replace(/^fbg-move:/i, '')); };
  A['have-code'] = function () {
    var s = App.sheet(App.sheetHead(t('Paste your code'), t('Paste the link or code from your coach (or your export code).')) + '<textarea class="input mono" id="hc" rows="5" placeholder="fbg-client:…"></textarea><p class="tiny" id="hce" style="color:var(--bad,#e66);min-height:1em"></p><button class="btn primary lg block" id="hcgo">' + esc(t('Open')) + '</button>');
    s.el.querySelector('#hcgo').onclick = function () {
      var txt = s.el.querySelector('#hc').value, e = s.el.querySelector('#hce'), clean = txt.replace(/\s+/g, '');
      if (/^fbg-all:/i.test(clean)) { App.decode(clean).then(function (o) { s.close(); App.showImport(o); }).catch(function () { e.textContent = t('That is not a Forged by Grace link or code.'); }); return; }
      if (/^fbg-move:/i.test(clean)) {
        App.decodeMove(clean).then(function (o) { if (!o || o.t !== 'move' || !o.me) throw 0; S.me = App.S.me = o.me; S.role = 'athlete'; if (o.lang) S.lang = o.lang; App.save(); try { sessionStorage.setItem('fbg.unlocked', '1'); } catch (x) {} s.close(); location.hash = '#/today'; App.route(); App.toast('✅ ' + t('Your data has been moved')); })
          .catch(function () { e.textContent = t('That is not a Forged by Grace link or code.'); });
        return;
      }
      if (/#imp=/.test(clean) || /^[zj][A-Za-z0-9_-]{40,}$/.test(clean) && !App.parseClientText(clean)) { App.decode(clean).then(function (o) { s.close(); App.showImport(o); }).catch(function () { e.textContent = t('That is not a Forged by Grace link or code.'); }); return; }
      var cl = App.parseClientText(clean); if (!cl) { e.textContent = t('That is not a Forged by Grace link or code.'); return; }
      s.close(); App.openClientFile(cl.slug, false, cl.priv);
    };
  };
  A['export-app'] = function () {
    var me = App.clone(S.me);
    Object.keys(me.food || {}).forEach(function (d) { (me.food[d] || []).forEach(function (x) { delete x.photo; }); });
    (me.body || []).forEach(function (b) { delete b.photo; delete b.photos; });
    (me.checkins || []).forEach(function (c) { delete c.photos; });
    App.encode({ t: 'move', v: 1, lang: S.lang, me: me }).then(function (c) {
      var code = 'fbg-move:' + c;
      var s = App.sheet(App.sheetHead(t('Export to app'), t('Copy this code, open the app from your Home Screen, tap “I have a code from my coach” and paste it.')) + '<textarea class="input mono" rows="5" readonly>' + esc(code) + '</textarea><button class="btn primary lg block" id="exc" style="margin-top:10px">' + esc(t('Copy code')) + '</button>');
      s.el.querySelector('#exc').onclick = function () { F.copyText(code).then(function () { App.toast(t('Copied')); }); };
    });
  };
  var oMore = V.more; V.more = function () {
    var h = oMore.apply(this, arguments); if (S.role === 'coach') return h;
    return '<div class="card row" style="margin-bottom:12px"><div class="grow"><b>📲 ' + esc(t('Export to app')) + '</b><div class="tiny muted">' + esc(t('Move your data to the Home Screen app')) + '</div></div><button class="btn sm" data-act="export-app">' + esc(t('Export to app')) + '</button></div>' +
      '<div class="card row" style="margin-bottom:12px"><div class="grow"><b>🔑 ' + esc(t('I have a code from my coach')) + '</b></div><button class="btn sm" data-act="have-code">' + esc(t('Open')) + '</button></div>' + h;
  };
})();
/* v3.7.3 — full-state export (coach + athlete): "📲 Exporteer alles naar app" → fbg-all: code or .fbg.json file. */
(function () {
  'use strict';
  var App = window.App, S = App.S, esc = App.esc, t = App.t, A = App.acts, V = App.views, F = App.F;
  var NL = { 'Export everything to app': 'Exporteer alles naar app', 'Clients, plans, logs, your own profile and settings → Home Screen app': 'Klanten, schema\u2019s, logs, je eigen profiel en instellingen → app op beginscherm',
    'Download file': 'Bestand downloaden', 'Everything has been moved': 'Alles is overgezet', 'Photos are not included.': 'Foto\u2019s gaan niet mee.',
    'Copy this code, open the app from your Home Screen and paste it: welcome screen → “I have a code from my coach”, or Clients → “Add client via code/link”.': 'Kopieer deze code, open de app vanaf je beginscherm en plak hem: startscherm → “Ik heb een code van mijn coach”, of Klanten → “Klant toevoegen via code/link”.' };
  Object.keys(NL).forEach(function (k) { if (!window.FBG_I18N.nl[k]) window.FBG_I18N.nl[k] = NL[k]; });
  function strip(o) {
    if (Array.isArray(o)) return o.filter(function (x) { return !(typeof x === 'string' && /^data:/.test(x)); }).map(strip);
    if (o && typeof o === 'object') { Object.keys(o).forEach(function (k) { var v = o[k]; if (typeof v === 'string' && /^data:/.test(v) && v.length > 200) delete o[k]; else o[k] = strip(v); }); }
    return o;
  }
  App.exportAll = function () {
    App.save();
    var ls = {};
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('fbg.') === 0 && k.indexOf('fbg.remNotified') !== 0) ls[k] = localStorage.getItem(k); }
    var st = strip(App.clone(S)); ls['fbg.state.v2'] = JSON.stringify(st);
    ['fbg.intakes', 'fbg.intakeDraft'].forEach(function (k) { if (ls[k]) { try { ls[k] = JSON.stringify(strip(JSON.parse(ls[k]))); } catch (e) {} } });
    return { t: 'all', v: 1, at: new Date().toISOString(), ls: ls };
  };
  App.importAll = function (o) {
    Object.keys(o.ls || {}).forEach(function (k) { if (k.indexOf('fbg.') === 0) localStorage.setItem(k, o.ls[k]); });
    try { sessionStorage.setItem('fbg.unlocked', '1'); sessionStorage.setItem('fbg.importedAll', '1'); } catch (e) {}
    var st = JSON.parse(o.ls['fbg.state.v2'] || '{}');
    location.replace(location.pathname + '#/' + (st.role === 'coach' ? 'clients' : 'today')); location.reload();
  };
  var oShow = App.showImport;
  App.showImport = function (obj) {
    if (obj && obj.t === 'all') { App.importAll(obj); return; }
    if (obj && obj.t === 'move' && obj.me) { S.me = App.S.me = obj.me; S.role = 'athlete'; App.save(); location.hash = '#/today'; App.route(); App.toast('✅ ' + t('Your data has been moved')); return; }
    return oShow.apply(this, arguments);
  };
  try { if (sessionStorage.getItem('fbg.importedAll') === '1') { sessionStorage.removeItem('fbg.importedAll'); setTimeout(function () { App.toast('✅ ' + t('Everything has been moved') + ' · ' + S.clients.length + ' ' + (S.lang === 'nl' ? 'klant(en)' : 'client(s)')); }, 600); } } catch (e) {}
  A['export-all'] = function () {
    var obj = App.exportAll();
    App.encode(obj).then(function (c) {
      var code = 'fbg-all:' + c, big = code.length > 60000;
      var s = App.sheet(App.sheetHead(t('Export everything to app'), t('Copy this code, open the app from your Home Screen and paste it: welcome screen → “I have a code from my coach”, or Clients → “Add client via code/link”.')) +
        '<p class="tiny muted">' + S.clients.length + ' clients · ' + Math.round(code.length / 1024) + ' KB · ' + esc(t('Photos are not included.')) + '</p>' +
        '<textarea class="input mono" rows="4" readonly>' + esc(big ? code.slice(0, 300) + '…' : code) + '</textarea>' +
        '<div class="grid2" style="margin-top:10px"><button class="btn primary" id="ea-c">' + esc(t('Copy code')) + '</button><button class="btn" id="ea-f">' + esc(t('Download file')) + '</button></div>');
      s.el.querySelector('#ea-c').onclick = function () { F.copyText(code).then(function () { App.toast(t('Copied')); }); };
      s.el.querySelector('#ea-f').onclick = function () {
        var name = 'forged-by-grace-alles-' + App.today() + '.fbg.json', txt = JSON.stringify(obj);
        try { var file = new File([txt], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).catch(function () {}); return; } } catch (e) {}
        F.download(name, txt, 'application/json');
      };
    });
  };
  var oMore = V.more; V.more = function () {
    var h = oMore.apply(this, arguments);
    return '<div class="card row" style="margin-bottom:12px;border:1px solid rgba(212,175,55,.5)"><div class="grow"><b>📲 ' + esc(t('Export everything to app')) + '</b><div class="tiny muted">' + esc(t('Clients, plans, logs, your own profile and settings → Home Screen app')) + '</div></div><button class="btn sm primary" data-act="export-all">' + esc(S.lang === 'nl' ? 'Exporteer' : 'Export') + '</button></div>' + h;
  };
  // welcome screen: also accept an all-export file
  var oWel = V.welcome; V.welcome = function () { var h = oWel.apply(this, arguments), i = h.lastIndexOf('</div></div>'); return h.slice(0, i) + '<label class="btn ghost block small" style="margin-top:4px">📁 ' + esc(S.lang === 'nl' ? 'Bestand (.fbg.json) openen' : 'Open file (.fbg.json)') + '<input type="file" id="wel-file" accept=".json,application/json" hidden></label>' + h.slice(i); };
  document.addEventListener('change', function (e) { if (e.target && e.target.id === 'wel-file' && e.target.files[0]) e.target.files[0].text().then(function (x) { return App.decode(x); }).then(App.showImport).catch(function () { App.toast(t('That is not a Forged by Grace link or code.')); }); });
})();
