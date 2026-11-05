/* Forged by Grace v3.11 — "Koppel Health & horloge" wizard.
   iPhone: an Apple Shortcut posts today's Health numbers to Supabase (rpc health_push) with a personal sync key.
   Android: Health Connect → free Life Dashboard Companion webhook (rpc health_webhook, header x-fbg-token).
   The key only lets someone WRITE health numbers for this one client; it cannot read anything. */
(function () {
  'use strict';
  var App = window.App, S = App.S, F = App.F, esc = App.esc, t = App.t, I = App.I, V = App.views, A = App.acts;
  var BASE = 'https://hdcpxmctilthjhdhhixw.supabase.co/rest/v1/rpc/', KEY = 'sb_publishable_oFIIm1osyVtpV-t9PCjFxA_tkkQ9xUg';
  var URL_IOS = BASE + 'health_push?apikey=' + KEY, URL_AND = BASE + 'health_webhook?apikey=' + KEY;
  function nl() { return S.lang === 'nl'; }
  function L(a, b) { return nl() ? a : b; }
  function C() { return App.cloud; }
  function isClient() { return C() && C().role && (C().role() === 'client' || !!(C().selfClientId && C().selfClientId())); }
  function fmtAt(iso) { return iso ? F.fmtDate(iso, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''; }

  // ---------- data in: client side ----------
  App.applyHealthSync = function (row) {
    if (!row || !row.data || !row.data.days) return false;
    var last = row.data.last || row.updated_at;
    var days = row.data.days, h, before = JSON.stringify((S.me.health && S.me.health.days) || {});
    App.mergeHealth(days, [], 'Shortcut (auto)');
    h = S.me.health;
    Object.keys(days).forEach(function (d) { var x = days[d]; if (h.days[d] && x.sleep != null) h.days[d].sleep = x.sleep; if (h.days[d] && x.wmin != null) h.days[d].wmin = x.wmin; });
    var changed = before !== JSON.stringify(h.days || {});
    if (S.me.hsyncLast === last && !changed) return false;
    S.me.hsyncLast = last; App.save();
    if (changed && /^#\/(hlink|health|today|progress)?$/.test(location.hash || '#/today') && !document.querySelector('.sheet')) App.rerender();
    else if (changed && /^#\/(hlink|health|today|progress)/.test(location.hash) && !document.querySelector('.sheet')) App.rerender();
    return changed;
  };
  App.healthSyncPull = function () {
    var c = C(); if (!c || !c.sb) return Promise.resolve();
    // athlete client OR coach's own "Ik" client record
    var cid = (c.state && c.state().client) || (c.selfClientId && c.selfClientId());
    if (!cid) return Promise.resolve();
    return c.sb.from('client_data').select('data,updated_at').eq('client_id', cid).eq('kind', 'health_sync').maybeSingle()
      .then(function (r) { if (r.data) App.applyHealthSync(r.data); return r.data; });
  };
  // Pull server steps on open / focus so Today shows the higher of local vs server
  if (!window.__fbgHealthFocus) {
    window.__fbgHealthFocus = 1;
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && App.healthSyncPull) App.healthSyncPull().catch(function () {});
    });
    window.addEventListener('focus', function () { if (App.healthSyncPull) App.healthSyncPull().catch(function () {}); });
    setTimeout(function () { if (App.healthSyncPull) App.healthSyncPull().catch(function () {}); }, 1200);
  }
  function token(reset) {
    var c = C(); if (!isClient()) return Promise.reject(new Error('login'));
    if (S.me.hTok && !reset) return Promise.resolve(S.me.hTok);
    return c.sb.rpc('my_health_token', { p_reset: !!reset }).then(function (r) { if (r.error) throw r.error; S.me.hTok = r.data; App.save(); return r.data; });
  }

  // ---------- data in: coach side (overlay synced days onto the client's steps chart) ----------
  App.overlayHealthSync = function (c, live, sum) {
    var hs = live.health_sync; c.healthSyncAt = hs ? hs.last : null; if (!hs || !hs.days) return;
    c.healthSyncDays = hs.days;
    if (!sum) return;
    var m = {}; (sum.health || []).forEach(function (x) { m[x[0]] = x; });
    var cut = App.isoAdd(App.today(), -30);
    Object.keys(hs.days).forEach(function (d) { if (d < cut) return; var x = hs.days[d], r = m[d] || (m[d] = [d, null, null, null]);
      if (r[1] == null && x.steps != null) r[1] = x.steps; if (!r[2] && x.rhr) r[2] = x.rhr; if (r[3] == null && x.kcal != null) r[3] = x.kcal; });
    sum.health = Object.keys(m).sort().map(function (d) { return m[d]; });
  };
  var oClient = V.client;
  if (oClient) V.client = function (id) {
    var h = oClient.apply(this, arguments), c = App.client && App.client(id);
    if (!c || !c.healthSyncAt) return h;
    var days = c.healthSyncDays || {}, ks = Object.keys(days).sort(), x = ks.length ? days[ks[ks.length - 1]] : {};
    var bits = []; if (x.steps != null) bits.push(Math.round(x.steps).toLocaleString(S.lang) + ' ' + t('steps')); if (x.kcal != null) bits.push(x.kcal + ' kcal'); if (x.weight) bits.push(x.weight + ' kg'); if (x.rhr) bits.push(x.rhr + ' bpm'); if (x.sleep) bits.push(x.sleep + ' u slaap');
    return h + '<div class="card"><b>⌚ ' + esc(L('Health & horloge', 'Health & watch')) + '</b><p class="small muted" style="margin:4px 0 0">' + esc(L('Laatst gesynchroniseerd', 'Last synced') + ': ' + fmtAt(c.healthSyncAt)) + (ks.length ? '<br>' + esc(F.fmtDay(ks[ks.length - 1]) + ': ' + bits.join(' · ')) : '') + '</p></div>';
  };

  // ---------- wizard ----------
  function head(sub) {
    return '<div class="row" style="margin-bottom:10px"><a class="icon-btn" href="' + (sub ? '#/hlink' : '#/more') + '" aria-label="' + esc(t('Back')) + '">' + I.back + '</a><div class="grow"><div class="kicker" style="margin:0">⌚ ' + esc(L('Koppel Health & horloge', 'Connect Health & watch')) + '</div></div></div>';
  }
  function status() {
    var h = S.me.health, at = S.me.hsyncLast || (h && h.last), d = App.healthDay && App.healthDay();
    return '<div class="card" id="hl-status"><div class="row between"><div><b>' + esc(L('Status', 'Status')) + '</b><div class="tiny muted">' + esc(at ? L('Laatst gesynchroniseerd', 'Last synced') + ': ' + fmtAt(at) : L('Nog niet gesynchroniseerd', 'Not synced yet')) + (d && d.steps != null ? ' · ' + Math.round(d.steps).toLocaleString(S.lang) + ' ' + esc(t('steps')) : '') + '</div></div>' +
      (isClient() ? '<button class="btn sm" data-act="hl-refresh">' + esc(L('Vernieuwen', 'Refresh')) + '</button>' : '') + '</div></div>';
  }
  function step(n, title, body) { return '<div class="card"><div class="row" style="align-items:flex-start"><div class="ex-icon" style="font-weight:800;color:var(--gold,#d4af37)">' + n + '</div><div class="grow"><b>' + esc(title) + '</b><div class="small" style="margin-top:4px">' + body + '</div></div></div></div>'; }
  function copyBtn(id, label) { return '<button class="btn sm" data-act="hl-copy" data-k="' + id + '" style="margin:6px 6px 0 0">' + I.link + esc(label) + '</button>'; }
  function needLogin() {
    return '<div class="card" style="border:1px solid rgba(212,175,55,.6)"><b>☁️ ' + esc(L('Eerst Live sync aanzetten', 'Turn on Live sync first')) + '</b><p class="small muted">' + esc(L('Je persoonlijke sync-sleutel hoort bij je account. Log in via More → ☁️ Live sync, en kom dan terug.', 'Your personal sync key belongs to your account. Sign in via More → ☁️ Live sync, then come back.')) + '</p><a class="btn primary sm" href="#/more">' + esc(L('Naar Live sync', 'Go to Live sync')) + '</a></div>';
  }
  function keyCard() {
    return '<p class="tiny muted" style="margin:6px 0 0">' + esc(L('Je sleutel', 'Your key')) + ': <code id="hl-tok" class="mono">' + esc(S.me.hTok ? S.me.hTok.slice(0, 12) + '…' : L('laden…', 'loading…')) + '</code></p>';
  }
  V.hlink = function (dev) {
    var o = head(dev);
    if (!dev) {
      o += '<h1 class="h1">' + esc(L('Alles in één keer koppelen', 'Connect everything at once')) + '</h1><p class="muted small">' + esc(L('Gratis. Je horloge zet zijn data in Apple Health of Health Connect; wij halen het daar elke dag automatisch op. Je coach ziet het live.', 'Free. Your watch writes into Apple Health or Health Connect; we pick it up there every day, automatically. Your coach sees it live.')) + '</p>';
      o += status();
      o += '<a class="card tap row" style="text-decoration:none;color:inherit" href="#/hlink/ios"><div class="ex-icon" style="font-size:22px">📱</div><div class="grow"><b>iPhone · Apple Health</b><div class="tiny muted">' + esc(L('Ook Apple Watch, Garmin, Polar, Oura, Withings, weegschaal', 'Also Apple Watch, Garmin, Polar, Oura, Withings, scales')) + '</div></div><span class="chev">›</span></a>';
      o += '<a class="card tap row" style="text-decoration:none;color:inherit" href="#/hlink/android"><div class="ex-icon" style="font-size:22px">🤖</div><div class="grow"><b>Android · Health Connect / Samsung Health</b><div class="tiny muted">' + esc(L('Ook Galaxy Watch, Garmin, Fitbit, Pixel Watch', 'Also Galaxy Watch, Garmin, Fitbit, Pixel Watch')) + '</div></div><span class="chev">›</span></a>';
      o += '<a class="card tap row" style="text-decoration:none;color:inherit" href="#/hlink/watch"><div class="ex-icon" style="font-size:22px">⌚</div><div class="grow"><b>' + esc(L('Ik heb een sporthorloge', 'I have a sports watch')) + '</b><div class="tiny muted">' + esc(L('Garmin, Polar, Fitbit, Samsung, Apple Watch: eerst 1 schakelaar', 'Garmin, Polar, Fitbit, Samsung, Apple Watch: one switch first')) + '</div></div><span class="chev">›</span></a>';
      o += '<p class="tiny muted">' + esc(L('Geen tijd? Losse bestanden (Apple Health-export, Garmin CSV/FIT) kan nog steeds:', 'No time? File import (Apple Health export, Garmin CSV/FIT) still works:')) + ' <a href="#/health">' + esc(L('Bestanden importeren', 'Import files')) + '</a></p>';
      return o;
    }
    if (dev === 'watch') {
      var W = nl() ? [
        ['Apple Watch', 'Niets te doen: hij schrijft vanzelf in Apple Health. Ga verder met iPhone.'],
        ['Garmin', 'Garmin Connect-app → More (☰) → Settings → Connected Apps → Apple Health (iPhone) of Health Connect (Android) → alles aan.'],
        ['Polar', 'Polar Flow-app → Settings → General → Apple Health / Health Connect → aan.'],
        ['Samsung Galaxy Watch', 'Samsung Health → ⋮ → Settings → Health Connect → aan (alle gegevens toestaan).'],
        ['Fitbit / Pixel Watch', 'Android: Fitbit-app → Profiel → Health Connect → aan. iPhone: Fitbit schrijft niet naar Apple Health — gebruik dan Stappen aanpassen in de app.'],
        ['Oura / Withings / Whoop', 'In hun app: Settings → Apple Health of Health Connect → aan.']
      ] : [
        ['Apple Watch', 'Nothing to do: it writes into Apple Health by itself. Continue with iPhone.'],
        ['Garmin', 'Garmin Connect app → More (☰) → Settings → Connected Apps → Apple Health (iPhone) or Health Connect (Android) → turn everything on.'],
        ['Polar', 'Polar Flow app → Settings → General → Apple Health / Health Connect → on.'],
        ['Samsung Galaxy Watch', 'Samsung Health → ⋮ → Settings → Health Connect → on (allow all).'],
        ['Fitbit / Pixel Watch', 'Android: Fitbit app → Profile → Health Connect → on. iPhone: Fitbit does not write to Apple Health — use Adjust steps in the app instead.'],
        ['Oura / Withings / Whoop', 'In their app: Settings → Apple Health or Health Connect → on.']
      ];
      o += '<h1 class="h1">' + esc(L('Stap 1: horloge → telefoon', 'Step 1: watch → phone')) + '</h1><p class="muted small">' + esc(L('Zet één schakelaar aan in de app van je horloge. Daarna kies je je telefoon.', 'Turn on one switch in your watch app. Then pick your phone.')) + '</p>';
      o += '<div class="list">' + W.map(function (w) { return '<div class="list-item"><div class="grow"><b>' + esc(w[0]) + '</b><div class="small muted">' + esc(w[1]) + '</div></div></div>'; }).join('') + '</div>';
      o += '<div class="grid2" style="margin-top:12px"><a class="btn primary" href="#/hlink/ios">iPhone →</a><a class="btn primary" href="#/hlink/android">Android →</a></div>';
      return o;
    }
    var login = isClient();
    if (dev === 'ios') {
      o += '<h1 class="h1">iPhone · Apple Health</h1><p class="muted small">' + esc(L('Eén keer instellen (±5 min). Daarna gaat het elke avond vanzelf, ook als de app dicht is.', 'Set up once (±5 min). After that it runs every evening by itself, even with the app closed.')) + '</p>';
      o += status();
      if (!login) return o + needLogin();
      o += step(1, L('Kopieer je 2 codes', 'Copy your 2 codes'), esc(L('Je hebt ze zo nodig in stap 3. Kopieer ze één voor één wanneer je ze plakt.', 'You need them in step 3. Copy them one at a time when you paste.')) + '<br>' + copyBtn('url-ios', L('Kopieer adres (URL)', 'Copy address (URL)')) + copyBtn('tok', L('Kopieer sleutel', 'Copy key')) + keyCard());
      o += step(2, L('Maak de Opdracht (Shortcut)', 'Build the Shortcut'), '<ol class="plain-list small">' + [
          'Open <b>Shortcuts</b> → tap <b>+</b>. ' + L('Naam', 'Name') + ': <b>FBG Sync</b>.',
          'Tap <b>Add Action</b> → search <b>Find Health Samples</b>. ' + L('Zet', 'Set') + ': <b>Type: Steps</b>. Tap <b>Add Filter</b> → <b>Start Date</b> <b>is today</b>. <b style="color:#d4af37">' + L('GEEN Source-filter, Limit UIT, Sort by: niets.', 'NO Source filter, Limit OFF, no Sort.') + '</b>',
          L('Daaronder', 'Below it') + ': <b>Calculate Statistics</b> → <b>Sum</b> of <b>Health Samples</b>. ' + L('(Telt álle kleine Garmin/iPhone-stukjes op.)', '(Adds up all the small Garmin/iPhone samples.)'),
          L('Nog eens', 'Again') + ' <b>Find Health Samples</b>: <b>Steps</b>, <b>Start Date</b> <b>is yesterday</b>, Limit OFF → <b>Calculate Statistics</b> → <b>Sum</b>. ' + L('(Gisteren, als back-up.)', '(Yesterday, as a backfill.)'),
          L('Optioneel', 'Optional') + ': <b>Find Health Samples</b> → <b>Active Energy</b>, is today → <b>Calculate Statistics</b> → <b>Sum</b>.'
        ].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>');
      o += step(3, L('Laat hem versturen', 'Make it send'), '<ol class="plain-list small">' + [
          L('Voeg', 'Add') + ' <b>Get Contents of URL</b> ' + L('toe en plak het <b>adres</b> uit stap 1.', 'and paste the <b>address</b> from step 1.'),
          L('Tik op', 'Tap') + ' <b>›</b> (Show More): Method <b>POST</b>, Request Body <b>JSON</b>.',
          'Tap <b>Add new field → Text</b>: key <code>p_token</code>, value = ' + L('plak je <b>sleutel</b>', 'paste your <b>key</b>') + '.',
          'Tap <b>Add new field → Number</b>: key <code>steps</code>, value = ' + L('de <b>1e Statistics</b> (vandaag)', 'the <b>1st Statistics</b> (today)') + '.',
          'Tap <b>Add new field → Number</b>: key <code>ysteps</code>, value = ' + L('de <b>2e Statistics</b> (gisteren)', 'the <b>2nd Statistics</b> (yesterday)') + '.',
          L('Optioneel', 'Optional') + ': <b>Number</b> <code>kcal</code> = Active Energy Sum.',
          L('Voeg als laatste', 'Last, add') + ' <b>Show Result</b> → <b>Contents of URL</b>. ' + L('Bij ▶ moet je zien', 'When you tap ▶ you should see') + ' <code>"ok": true</code> ' + L('met je echte stappen.', 'with your real steps.')
        ].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol><p class="tiny muted">' + esc(L('Zie je maar een paar stappen (bijv. 20)? Dan pakt de actie één monster: zet Limit uit en verwijder elke Source-filter. Zie je niets met "ok"? Dan ontbreekt Get Contents of URL of is de sleutel fout.', 'Only a few steps (e.g. 20)? The action is taking one sample: turn Limit off and remove any Source filter. No "ok"? Get Contents of URL is missing or the key is wrong.')) + '</p>');
      o += step(4, L('Test en zet automatisch aan', 'Test and automate'), '<ol class="plain-list small">' + (nl() ? [
          'Tik op <b>▶</b>. Sta Health toe (<b>Allow</b>). Je ziet <code>"ok": true</code>.',
          'Kom terug hier en tik op <b>Vernieuwen</b>: status = Laatst gesynchroniseerd.',
          'Tab <b>Automation</b> → <b>+</b> → <b>Time of Day</b> → <b>23:00</b>, <b>Daily</b> → <b>Run Immediately</b> → kies <b>FBG Sync</b> → <b>Done</b>.'
        ] : [
          'Tap <b>▶</b>. Allow Health access (<b>Allow</b>). You see <code>"ok": true</code>.',
          'Come back here and tap <b>Refresh</b>: status = Last synced.',
          'Tab <b>Automation</b> → <b>+</b> → <b>Time of Day</b> → <b>23:00</b>, <b>Daily</b> → <b>Run Immediately</b> → pick <b>FBG Sync</b> → <b>Done</b>.'
        ]).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>');
    } else {
      o += '<h1 class="h1">Android · Health Connect</h1><p class="muted small">' + esc(L('Eén keer instellen (±5 min) met de gratis app Life Dashboard Companion. Daarna synct hij vanzelf.', 'Set up once (±5 min) with the free app Life Dashboard Companion. Then it syncs by itself.')) + '</p>';
      o += status();
      if (!login) return o + needLogin();
      o += step(1, L('Horloge/Samsung Health → Health Connect', 'Watch/Samsung Health → Health Connect'), esc(L('Samsung Health → ⋮ → Settings → Health Connect → aan. Garmin/Fitbit: zie “Ik heb een sporthorloge”.', 'Samsung Health → ⋮ → Settings → Health Connect → on. Garmin/Fitbit: see “I have a sports watch”.')) + ' <a href="#/hlink/watch">⌚</a>');
      o += step(2, L('Installeer de gratis app', 'Install the free app'), esc(L('Life Dashboard Companion, gratis via F-Droid of GitHub (de Play Store-versie kost geld, die heb je niet nodig).', 'Life Dashboard Companion, free via F-Droid or GitHub (the Play Store version is paid, you do not need it).')) + '<br><a class="btn sm" style="margin-top:6px" target="_blank" rel="noopener" href="https://owen282000.com/life-dashboard/android/">' + esc(L('Open downloadpagina', 'Open download page')) + '</a>');
      o += step(3, L('Plak je adres en sleutel', 'Paste your address and key'), '<ol class="plain-list small">' + (nl() ? [
          'Tab <b>Health</b> → <b>Webhook</b> → plak het <b>adres</b> → tik op <b>+</b>.',
          'Tik op het adres → <b>Webhook headers</b> → naam <code>x-fbg-token</code>, waarde = je <b>sleutel</b> → <b>Save Changes</b>.',
          'Geef toegang tot <b>Steps</b> en <b>Active calories</b> → <b>Sync Now</b>. Kies een dagelijkse planning.'
        ] : [
          'Tab <b>Health</b> → <b>Webhook</b> → paste the <b>address</b> → tap <b>+</b>.',
          'Tap the address → <b>Webhook headers</b> → name <code>x-fbg-token</code>, value = your <b>key</b> → <b>Save Changes</b>.',
          'Allow <b>Steps</b> and <b>Active calories</b> → <b>Sync Now</b>. Pick a daily schedule.'
        ]).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>' + copyBtn('url-and', L('Kopieer adres', 'Copy address')) + copyBtn('tok', L('Kopieer sleutel', 'Copy key')) + keyCard());
      o += step(4, L('Controleer', 'Check'), esc(L('Tik hier op Vernieuwen. Lukt het niet? Stappen kun je altijd met de hand aanpassen bij Gezondheid.', 'Tap Refresh here. Not working? You can always adjust steps by hand under Health.')));
    }
    o += '<p class="tiny muted">🔒 ' + esc(L('Je sleutel kan alleen jouw gezondheidscijfers toevoegen, niets lezen. Gelekt? ', 'Your key can only add your health numbers, never read anything. Leaked? ')) + '<button class="btn sm" data-act="hl-reset" style="padding:2px 8px">' + esc(L('Maak een nieuwe sleutel', 'Make a new key')) + '</button></p>';
    setTimeout(function () { token().then(function (k) { var el = document.getElementById('hl-tok'); if (el) el.textContent = k.slice(0, 12) + '…'; }).catch(function () {}); App.healthSyncPull(); });
    return o;
  };
  A['hl-copy'] = function (el) {
    var k = el.dataset.k;
    var p = k === 'tok' ? token() : Promise.resolve(k === 'url-ios' ? URL_IOS : URL_AND);
    p.then(function (v) { return F.copyText(v); }).then(function () { App.toast(t('Copied')); }).catch(function () { App.toast(L('Log eerst in bij Live sync', 'Sign in to Live sync first')); });
  };
  A['hl-refresh'] = function () { App.healthSyncPull().then(function (d) { App.toast(d ? L('Bijgewerkt', 'Updated') : L('Nog geen data ontvangen', 'No data received yet')); App.rerender(); }).catch(function () { App.toast(t('Offline — will sync later')); }); };
  A['hl-reset'] = function () { App.confirm(L('Nieuwe sleutel maken?', 'Make a new key?'), L('De oude sleutel werkt dan niet meer. Plak de nieuwe in je Opdracht / app.', 'The old key stops working. Paste the new one in your Shortcut / app.'), L('Nieuwe sleutel', 'New key')).then(function (ok) { if (ok) token(true).then(function () { App.toast(L('Nieuwe sleutel klaar', 'New key ready')); App.rerender(); }); }); };

  // entry points: More (athlete) + top of the Health page
  var oMore = V.more; V.more = function () { var h = oMore.apply(this, arguments); if (S.role === 'coach') return h;
    var card = '<a class="card tap row" href="#/hlink" id="hl-card" style="border:1px solid rgba(212,175,55,.6)"><div class="ex-icon">⌚</div><div class="grow"><b>' + esc(L('Koppel Health & horloge', 'Connect Health & watch')) + '</b><div class="tiny muted">' + esc(L('Apple Health, Health Connect, Garmin, Apple Watch… elke dag automatisch', 'Apple Health, Health Connect, Garmin, Apple Watch… automatic every day')) + '</div></div><span class="chev">›</span></a>';
    var i = h.indexOf('<a class="card tap row" href="#/health">'); return i === -1 ? card + h : h.slice(0, i) + card + h.slice(i); };
  var oHealth = V.health; V.health = function () { var h = oHealth.apply(this, arguments);
    var card = '<a class="card tap row" href="#/hlink" style="border:1px solid rgba(212,175,55,.6)"><div class="ex-icon">⌚</div><div class="grow"><b>' + esc(L('Automatisch koppelen (aanbevolen)', 'Connect automatically (recommended)')) + '</b><div class="tiny muted">' + esc(L('Stap-voor-stap: iPhone, Android of sporthorloge', 'Step by step: iPhone, Android or sports watch')) + '</div></div><span class="chev">›</span></a>';
    var i = h.indexOf('<div class="grid3">'); return i === -1 ? card + h : h.slice(0, i) + card + h.slice(i); };
})();
