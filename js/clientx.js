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
