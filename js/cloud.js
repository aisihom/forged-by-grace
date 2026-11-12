/* Forged by Grace v3.8 — live sync (Supabase, EU/Frankfurt). Local-first: the app keeps working offline;
   when signed in, client data is pushed up and the coach dashboard updates live. Public anon key only. */
(function () {
  'use strict';
  var App = window.App, S = App.S, esc = App.esc, t = App.t, A = App.acts, V = App.views, F = App.F;
  var URL_ = 'https://hdcpxmctilthjhdhhixw.supabase.co';
  var KEY = 'sb_publishable_oFIIm1osyVtpV-t9PCjFxA_tkkQ9xUg';
  var CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
  var NL = {
    'Live sync': 'Live koppeling', 'Not signed in': 'Niet ingelogd', 'Signed in as': 'Ingelogd als', 'Sign in': 'Inloggen', 'Sign out': 'Uitloggen',
    'Create account': 'Account aanmaken', 'Email': 'E-mail', 'Password (min. 6)': 'Wachtwoord (min. 6)', 'Send login link instead': 'Stuur mij een inloglink',
    'Your data syncs live with your coach.': 'Je gegevens gaan live naar je coach.', 'Clients appear here live.': 'Je klanten verschijnen hier live.',
    'I agree that my training, food, body and check-in data (including photos) are stored securely in the EU and shared only with my coach.': 'Ik ga akkoord dat mijn trainings-, voedings-, lichaams- en check-in-gegevens (ook foto\u2019s) veilig in de EU worden bewaard en alleen met mijn coach worden gedeeld.',
    'Please tick the consent box.': 'Vink eerst het akkoord-vakje aan.', 'Check your inbox for the login link.': 'Kijk in je inbox voor de inloglink.',
    'Synced': 'Gesynchroniseerd', 'Offline — will sync later': 'Offline — synct later', 'Invite for live sync': 'Uitnodigen voor live koppeling',
    'Client email': 'E-mail van klant', 'Invite saved. Send the client this message:': 'Uitnodiging klaar. Stuur je klant dit bericht:', 'Live data': 'Live gegevens',
    'This account is not linked to a coach yet. Ask your coach to invite this email.': 'Dit account is nog niet aan een coach gekoppeld. Vraag je coach dit e-mailadres uit te nodigen.',
    'Privacy': 'Privacy', 'weight': 'gewicht', 'Waiting for first login': 'Wacht op eerste login', 'last update': 'laatste update', 'Account created — you can sign in now.': 'Account aangemaakt — je kunt nu inloggen.'
  };
  Object.keys(NL).forEach(function (k) { if (!window.FBG_I18N.nl[k]) window.FBG_I18N.nl[k] = NL[k]; });
  var PRIV_NL = 'Privacy: Forged by Grace (Aarón Ricardo) bewaart je gegevens bij Supabase in Frankfurt (EU), versleuteld en alleen zichtbaar voor jou en je coach. We gebruiken ze uitsluitend om je te coachen, nooit voor reclame en we verkopen niets door. Je kunt altijd inzage, correctie of verwijdering vragen via ' + (S.coach.email || 'je coach') + ' (AVG). Intrekken = uitloggen en vragen om verwijdering.';
  var PRIV_EN = 'Privacy: Forged by Grace (Aarón Ricardo) stores your data with Supabase in Frankfurt (EU), encrypted and visible only to you and your coach. It is used only to coach you, never for ads or resale. You can request access, correction or deletion at any time via ' + (S.coach.email || 'your coach') + ' (GDPR).';

  var sb = null, user = null, role = null, myClient = null, loading = null, status = '', chan = null;
  var C = App.cloud = { state: function () { return { user: user && user.email, role: role, client: myClient && myClient.id, status: status }; }, myFeedback: function () { return (myClient && myClient.coach_feedback) || null; } };
  C._test = { applyPlan: function (r) { return applyPlan(r); }, selfTargets: function (r) { return selfTargets(r); } }; // used by test/smoke.js only
  C.restart = function () { role = null; myClient = null; return start(); };
  C.user = function () { return user; }; C.coachId = function () { return myClient && myClient.coach_id; }; C.role = function () { return role; };

  function load() {
    if (loading) return loading;
    loading = new Promise(function (res, rej) {
      if (window.supabase) return res();
      var s = document.createElement('script'); s.src = CDN; s.onload = res; s.onerror = function () { loading = null; rej(new Error('offline')); }; document.head.appendChild(s);
    }).then(function () {
      sb = window.supabase.createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'fbg.sb.auth' } });
      C.sb = sb;
      sb.auth.onAuthStateChange(function (ev, sess) { var u = sess && sess.user; if ((u && u.id) !== (user && user.id)) { user = u || null; if (user) start(); else stop(); } });
      return sb.auth.getSession();
    }).then(function (r) { user = r.data.session && r.data.session.user; if (user) return start(); });
    return loading;
  }
  C.load = load;

  function stop() { role = null; myClient = null; if (chan) { sb.removeChannel(chan); chan = null; } rer(); }
  // coach: never re-render under the reader's eyes — show a gold pill; tap = refresh keeping scroll + open sections
  function pill() {
    if (!/^#\/(more|clients|client)/.test(location.hash)) return;
    if (window.scrollY < 40 && !document.querySelector('.sheet, details[open], input:focus, textarea:focus, select:focus')) return keepRer();
    if (document.getElementById('fbg-new')) return;
    var b = document.createElement('button'); b.id = 'fbg-new'; b.textContent = '🔄 Nieuwe data — tik om te verversen';
    b.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);left:50%;transform:translateX(-50%);z-index:9999;background:#d4af37;color:#000;border:0;border-radius:999px;padding:8px 14px;font-weight:700;font-size:13px;box-shadow:0 4px 14px rgba(0,0,0,.5)';
    b.onclick = function () { b.remove(); keepRer(); }; document.body.appendChild(b);
  }
  function keepRer() {
    if (document.querySelector('.sheet')) return;
    var y = window.scrollY, open = [].map.call(document.querySelectorAll('#view details'), function (d) { return d.open; });
    App.rerender();
    var fix = function () { [].forEach.call(document.querySelectorAll('#view details'), function (d, i) { if (open[i] != null) d.open = open[i]; }); window.scrollTo(0, y); };
    fix(); setTimeout(fix, 60); setTimeout(fix, 400); setTimeout(fix, 1200);
    var p = document.getElementById('fbg-new'); if (p) p.remove();
  }
  function rer() { var h = location.hash; if (/^#\/(more|clients|client)/.test(h) && !document.querySelector('.sheet')) App.rerender(); }

  function start() {
    return sb.from('coaches').select('user_id').eq('user_id', user.id).maybeSingle().then(function (r) {
      if (r.data) { role = 'coach'; return sb.from('clients').select('*').eq('user_id', user.id).maybeSingle().then(function (me) { myClient = me.data || null; if (myClient) selfTargets(myClient); return coachPull().then(function () { return myClient && App.healthSyncPull ? App.healthSyncPull() : null; }).then(function () { return myClient && App.healthFlush ? App.healthFlush() : null; }).then(function () { if (myClient) push(true); subscribe(); }); }); }
      return sb.from('clients').select('*').eq('user_id', user.id).maybeSingle().then(function (r2) {
        myClient = r2.data || null; role = myClient ? 'client' : 'none';
        if (myClient) {
          if (localStorage.getItem('fbg.consent') && !myClient.consent_at) sb.rpc('give_consent').then(function () {});
          applyPlan(myClient);
          return (App.healthSyncPull ? App.healthSyncPull() : Promise.resolve()).then(function () { return App.healthFlush ? App.healthFlush() : null; }).then(function () { push(true); subscribe(); rer(); });
        }
        rer();
      });
    }).catch(function () { status = 'offline'; });
  }

  // ---------- client side ----------
  // coach's own record: apply coach-set targets, step goal and plan to his own athlete data (once per change)
  function selfTargets(row) {
    var P = row.profile || {}, me = S.me, k = JSON.stringify([P.targetsOverride || null, P.stepGoal || null, P.bodyToday || null, P.spGifts || null, row.plan && (row.plan.id || row.updated_at) || null]);
    if (me.selfTgtSig === k) return; me.selfTgtSig = k; me.profile = me.profile || {};
    if (P.targetsOverride && P.targetsOverride.kcal) { me.profile.targetsOverride = P.targetsOverride; if (me.meal) me.meal.targets = Object.assign({}, me.meal.targets || {}, P.targetsOverride); }
    if (P.spGifts && P.spGifts.length) me.profile.spGifts = P.spGifts;
    if (P.stepGoal) me.stepGoal = P.stepGoal;
    if (row.plan) { me.plan = row.plan; if (!me.plan.id) me.plan.id = F.uid(); if (!me.plan.start || me.plan.start > App.today()) me.plan.start = App.today(); }
    var bt = P.bodyToday; if (bt && bt.date && bt.weight) { me.body = me.body || []; var bb = me.body.filter(function (x) { return x.date === bt.date; })[0]; if (!bb) { bb = { date: bt.date }; me.body.push(bb); me.body.sort(function (a, c) { return a.date < c.date ? -1 : 1; }); } bb.weight = bt.weight; me.profile.weight = bt.weight; }
    var gN = App.applySpGifts ? App.applySpGifts() : 0;
    rawSave(); if (gN > 0) setTimeout(function () { App.toast('💪 +' + gN + ' Sweatpoints'); }, 350);
    setTimeout(function () { if (!document.querySelector('.sheet')) App.rerender(); }, 0);
  }
  function applyPlan(row) {
    var me = S.me, stamp = row.updated_at || '';
    if (me.cloudPlanAt === stamp) return;
    if (row.plan && true) { me.plan = row.plan; if (!me.plan.id) me.plan.id = F.uid(); if (!me.plan.start || me.plan.start > App.today()) me.plan.start = App.today(); }
    if (row.meal && true) me.meal = row.meal;
    if (row.profile && row.profile.targetsOverride && row.profile.targetsOverride.kcal && me.meal) me.meal.targets = Object.assign({}, me.meal.targets || {}, row.profile.targetsOverride); // coach macros always show
    if (row.profile) me.profile = Object.assign({}, row.profile, me.profile || {}, { targetsOverride: (row.profile.targetsOverride || (me.profile || {}).targetsOverride), spGifts: (row.profile.spGifts || (me.profile || {}).spGifts), stepGoal: (row.profile.stepGoal || (me.profile || {}).stepGoal) });
    if (row.profile && row.profile.stepGoal) me.stepGoal = row.profile.stepGoal; // coach-set goal always wins
    if (!me.coach) me.coach = { name: S.coach.name, email: S.coach.email, whatsapp: S.coach.whatsapp };
    me.cid = row.id; me.cloudPlanAt = stamp;
    var gN = App.applySpGifts ? App.applySpGifts() : 0;
    var was = S.role; if (S.role !== 'coach') S.role = 'athlete';
    rawSave(); if (gN > 0) setTimeout(function () { App.toast('💪 +' + gN + ' Sweatpoints'); }, 350);
    if (!was) { location.hash = '#/today'; App.route(); }
  }
  function strip(o) { return JSON.parse(JSON.stringify(o == null ? null : o, function (k, v) { return typeof v === 'string' && /^data:/.test(v) && v.length > 200 ? undefined : v; })); }
  function snapshot() {
    var me = S.me, ls = {};
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && /^fbg\.(pet|game|water|steps|sp)/i.test(k)) ls[k] = localStorage.getItem(k); }
    var intakes = F.store.get('intakes', null) || F.store.get('intakeLast', null);
    var ci = null; try { ci = App.buildCheckin(me, '', 0); } catch (e) {}
    var known = ['profile', 'sessions', 'food', 'body', 'habits', 'checkins', 'water', 'steps', 'health', 'recipes', 'consent', 'photoGone'], extra = {};
    Object.keys(me).forEach(function (k) { if (known.indexOf(k) === -1 && ['pw', 'plan', 'meal', 'coach', 'cid', 'cloudPlanAt', 'cloudPh'].indexOf(k) === -1) extra[k] = me[k]; });
    return { profile: me.profile, sessions: me.sessions, food: me.food, body: me.body, habits: me.habits, checkins: { list: me.checkins, summary: ci, photoLog: me.photoLog || [] },
      water: me.water || me.waterLog || null, steps: me.steps || null, health: me.health || null, recipes: me.recipes || null, consent: me.consent || null, photoGone: me.photoGone || {}, intake: intakes, game: { ls: ls, game: me.game || me.pet || null }, extra: extra };
  }
  var last = {}, timer = null, retryT = null;
  function push(now) {
    if ((role !== 'client' && role !== 'coach') || !myClient) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      var snap = strip(snapshot()), rows = [];
      Object.keys(snap).forEach(function (k) { var j = JSON.stringify(snap[k]); if (snap[k] != null && last[k] !== j) rows.push({ client_id: myClient.id, kind: k, data: snap[k], updated_at: new Date().toISOString(), _j: j }); });
      if (!rows.length) return;
      sb.from('client_data').upsert(rows.map(function (r) { return { client_id: r.client_id, kind: r.kind, data: r.data, updated_at: r.updated_at }; })).then(function (r) {
        if (r.error) {
          // one bad row must never block the rest: retry each kind on its own
          status = 'error'; clearTimeout(retryT); retryT = setTimeout(function () { push(true); }, 60000);
          return Promise.all(rows.map(function (x) { return sb.from('client_data').upsert({ client_id: x.client_id, kind: x.kind, data: x.data, updated_at: x.updated_at }).then(function (q) { if (!q.error) last[x.kind] = x._j; }); }));
        }
        rows.forEach(function (x) { last[x.kind] = x._j; }); status = 'ok';
      }, function () { status = 'offline'; });
      photos();
    }, now ? 50 : 800);
  }
  C.push = push;
  C.patchClientProfile = function (id, patch) {
    if (!sb || !id || !patch) return Promise.reject(new Error('offline'));
    return sb.from('clients').select('profile').eq('id', id).maybeSingle().then(function (r) {
      if (r.error) throw r.error;
      var P = Object.assign({}, (r.data && r.data.profile) || {});
      if (patch.spGifts) P.spGifts = patch.spGifts;
      if (patch.targetsOverride) P.targetsOverride = patch.targetsOverride;
      return sb.from('clients').update({ profile: P, updated_at: new Date().toISOString() }).eq('id', id);
    });
  };
  function photos() {
    if (!App.photoGet || !myClient) return;
    var up = S.me.cloudPh = S.me.cloudPh || {}, gone = S.me.photoGone || {};
    if (App.applyPhotoGone) App.applyPhotoGone(S.me);
    Object.keys(gone).forEach(function (id) {
      var clean = App.photoIdFromPath ? App.photoIdFromPath(id) : id;
      if (App.isCheckinPhotoName && App.isCheckinPhotoName(clean) && App.removeStoredCheckinPhoto) App.removeStoredCheckinPhoto(myClient.id, clean).catch(function () {});
    });
    (S.me.photoLog || []).forEach(function (e) { Object.keys(e.poses || {}).forEach(function (p) { var id = e.poses[p];
      if (App.shouldUploadPhoto ? !App.shouldUploadPhoto(id, up, gone) : (up[id] || gone[id])) return;
      App.photoGet(id).then(function (rec) { if (!rec || !rec.blob) return; return sb.storage.from('checkin-photos').upload(myClient.id + '/' + id + '.jpg', rec.blob, { upsert: true, contentType: rec.blob.type || 'image/jpeg' }); })
        .then(function (r) { if (r && !r.error) { up[id] = Date.now(); rawSave(); } }).catch(function () {}); }); });
  }
  function mergeRemoteGone() {
    if (!sb || !myClient) return Promise.resolve();
    return sb.from('client_data').select('data').eq('client_id', myClient.id).eq('kind', 'photoGone').maybeSingle().then(function (r) {
      var remote = (r.data && r.data.data) || {};
      S.me.photoGone = Object.assign({}, remote, S.me.photoGone || {});
      if (App.applyPhotoGone && App.applyPhotoGone(S.me)) rawSave();
    }).catch(function () {});
  }
  function reconcilePhotos() {
    if (!sb || !myClient || !(S.me.photoLog || []).length) return Promise.resolve();
    return sb.storage.from('checkin-photos').list(myClient.id, { limit: 400 }).then(function (r) {
      var names = {}, up = S.me.cloudPh || {}, gone = S.me.photoGone = S.me.photoGone || {}, changed = false, now = Date.now();
      (r.data || []).forEach(function (f) { if (f && f.name) { names[f.name] = 1; names[f.name.replace(/\.jpg$/i, '')] = 1; } });
      (S.me.photoLog || []).forEach(function (e) {
        Object.keys(e.poses || {}).forEach(function (p) {
          var id = e.poses[p], stamped = up[id];
          if (!id || !stamped) return;
          if (typeof stamped === 'number' && stamped > 1 && (now - stamped) < 60000) return;
          if (names[id] || names[id + '.jpg']) return;
          gone[id] = 1; delete e.poses[p]; if (App.photoDel) App.photoDel(id); changed = true;
        });
      });
      if (changed) { S.me.photoLog = (S.me.photoLog || []).filter(function (e) { return Object.keys(e.poses || {}).length || e.weight; }); rawSave(); }
    }).catch(function () {});
  }
  var rawSave = App.save;
  App.save = function () { var r = rawSave.apply(this, arguments); if (role === 'client') push(); if (role === 'coach') { planPush(); if (myClient) push(); } return r; };
  window.addEventListener('online', function () { push(true); });
  document.addEventListener('visibilitychange', function () {
    if (!sb || !user) return;
    if (document.visibilityState === 'visible') {
      var p = role === 'coach' ? coachPull(true).catch(function () {}) : Promise.resolve();
      if ((role === 'client' || myClient) && App.healthSyncPull) p = p.then(function () { return App.healthSyncPull(); }).then(function () { return App.healthFlush ? App.healthFlush() : null; }).catch(function () {});
      p.then(function () { if (role === 'client' || (role === 'coach' && myClient)) push(true); if (myClient) mergeRemoteGone().then(reconcilePhotos); });
    } else if (role === 'client' || (role === 'coach' && myClient)) push(true);
  });
  window.addEventListener('pagehide', function () { if (role === 'client' || myClient) push(true); });
  setInterval(function () { if (role === 'coach' && document.visibilityState === 'visible') coachPull(true).catch(function () {}); }, 120000);

  // ---------- coach side ----------
  var rows = {}, data = {};
  var sig = '';
  function selfHealth() { var d = myClient && data[myClient.id]; if (d && d.health_sync && App.applyHealthSync) App.applyHealthSync(d.health_sync); }
  C.selfClientId = function () { return role === 'coach' && myClient ? myClient.id : null; };
  function coachPull(silent) {
    return Promise.all([sb.from('clients').select('*'), sb.from('client_data').select('*')]).then(function (r) {
      var ns = (r[0].data || []).map(function (c) { return c.id + c.updated_at; }).join() + '|' + (r[1].data || []).map(function (d) { return d.client_id + d.kind + d.updated_at; }).sort().join();
      if (silent && ns === sig) return; // nothing new: do nothing at all
      sig = ns;
      (r[0].data || []).forEach(function (c) { rows[c.id] = c; });
      (r[1].data || []).forEach(function (d) { (data[d.client_id] = data[d.client_id] || {})[d.kind] = d; });
      Object.keys(rows).forEach(merge); selfHealth(); rawSave(); status = 'ok'; if (silent) pill(); else rer();
    });
  }
  function merge(id) {
    var row = rows[id]; if (!row) return; var d = data[id] || {};
    var c = S.clients.filter(function (x) { return x.cloudId === id || (row.slug && x.setupSlug === row.slug) || x.id === id; })[0];
    if (!c) { c = { id: id, name: row.name, created: row.created_at, checkins: [], profile: row.profile || {} }; S.clients.push(c); }
    c.cloudId = id; c.coachFb = row.coach_feedback || {}; c.email = row.email; c.cloudNotes = row.notes || ''; c.cloudStatus = row.status; c.name = row.name || c.name;
    var dirty = c._pj && JSON.stringify([c.plan || null, c.meal || null]) !== c._pj;
    if (!dirty && (!c._cat || (row.updated_at || '') > c._cat)) { if (row.plan) c.plan = row.plan; if (row.meal) c.meal = row.meal; }
    else { if (!c.plan && row.plan) c.plan = row.plan; if (!c.meal && row.meal) c.meal = row.meal; }
    c._cat = row.updated_at || c._cat;
    c._pj = JSON.stringify([c.plan || null, c.meal || null]);
    var live = {}; Object.keys(d).forEach(function (k) { live[k] = d[k].data; });
    c.live = { at: Object.keys(d).reduce(function (a, k) { return d[k].updated_at > a ? d[k].updated_at : a; }, ''), d: live };
    if (live.profile) c.profile = Object.assign({}, c.profile || {}, live.profile);
    if (row.profile && (row.profile.targetsOverride || row.profile.spGifts)) c.profile = Object.assign({}, c.profile || {}, { targetsOverride: row.profile.targetsOverride || (c.profile || {}).targetsOverride, spGifts: row.profile.spGifts || (c.profile || {}).spGifts });
    var sum = live.checkins && live.checkins.summary;
    if (App.overlayHealthSync) App.overlayHealthSync(c, live, sum);
    if (sum) { sum.live = true; sum.at = c.live.at || sum.at; c.checkins = (c.checkins || []).filter(function (x) { return !x.live; }); c.checkins.push(sum); c.checkins.sort(function (a, b) { return a.at < b.at ? -1 : 1; }); if (c.lastCheckin !== sum.at) { c.lastCheckin = sum.at; c.unread = true; } }
  }
  function subscribe() {
    if (chan) return;
    chan = sb.channel('fbg-live').on('postgres_changes', { event: '*', schema: 'public', table: 'client_data' }, function (p) {
      var d = p.new && p.new.client_id ? p.new : null; if (!d) return;
      if (role === 'coach') { (data[d.client_id] = data[d.client_id] || {})[d.kind] = d; if (!rows[d.client_id]) return coachPull(true); merge(d.client_id); if (myClient && d.client_id === myClient.id) { if (d.kind === 'health_sync') selfHealth(); rawSave(); return; } rawSave(); pill(); }
      else if (myClient && d.client_id === myClient.id && d.kind === 'photoGone') { S.me.photoGone = Object.assign({}, d.data || {}, S.me.photoGone || {}); if (App.applyPhotoGone) App.applyPhotoGone(S.me); rawSave(); if (App.rerender) App.rerender(); }
      else if (myClient && d.client_id === myClient.id && d.kind === 'health_sync' && App.applyHealthSync) App.applyHealthSync(d);
    }).on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, function (p) {
      var r = p.new; if (!r || !r.id) return;
      if (role === 'coach') { rows[r.id] = r; if (myClient && r.id === myClient.id) { myClient = r; selfTargets(r); } merge(r.id); rawSave(); pill(); }
      else if (myClient && r.id === myClient.id) { myClient = r; applyPlan(r); App.rerender(); }
    }).subscribe();
  }
  var pt = null;
  function planPush() {
    clearTimeout(pt); pt = setTimeout(function () {
      S.clients.forEach(function (c) { if (!c.cloudId) return; var j = JSON.stringify([c.plan || null, c.meal || null]); if (j === c._pj) return; c._pj = j;
        sb.from('clients').update({ plan: c.plan || null, meal: c.meal || null, updated_at: new Date().toISOString() }).eq('id', c.cloudId).then(function () {}); });
    }, 2000);
  }
  A['cloud-invite'] = function (el) {
    var c = App.client(el.dataset.id); if (!c) return;
    var s = App.sheet(App.sheetHead(t('Invite for live sync')) + '<input class="input" id="ci-em" type="email" placeholder="' + esc(t('Client email')) + '" value="' + esc(c.email || '') + '"><button class="btn primary lg block" id="ci-go" style="margin-top:12px">' + esc(t('Invite for live sync')) + '</button><div id="ci-out"></div>');
    s.el.querySelector('#ci-go').onclick = function () {
      var em = s.el.querySelector('#ci-em').value.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(em)) return;
      var done = function (id) {
        c.cloudId = id; c.email = em; rawSave();
        var msg = (S.lang === 'nl' ? 'Hoi ' + c.name + ', open ' + App.baseUrl() + ' op je iPhone in Safari → More → ☁️ Live koppeling → Account aanmaken met ' + em + '. Daarna staat je plan klaar en zie ik je voortgang live. Groet, ' + S.coach.name
          : 'Hi ' + c.name + ', open ' + App.baseUrl() + ' in Safari → More → ☁️ Live sync → Create account with ' + em + '. Your plan will be ready and I see your progress live. ' + S.coach.name);
        s.el.querySelector('#ci-out').innerHTML = '<p class="small" style="margin-top:12px">' + esc(t('Invite saved. Send the client this message:')) + '</p><textarea class="input" rows="5" readonly>' + esc(msg) + '</textarea><button class="btn block" id="ci-cp">' + esc(t('Copy code')) + '</button>';
        s.el.querySelector('#ci-cp').onclick = function () { F.copyText(msg).then(function () { App.toast(t('Copied')); }); };
      };
      if (c.cloudId) { sb.from('clients').update({ email: em }).eq('id', c.cloudId).then(function (r) { if (r.error) App.toast(r.error.message); else done(c.cloudId); }); return; }
      sb.from('clients').insert({ coach_id: user.id, email: em, name: c.name, slug: c.setupSlug || null, plan: c.plan || null, meal: c.meal || null, profile: c.profile || null }).select('id').single()
        .then(function (r) { if (r.error) App.toast(r.error.message); else { rows[r.data.id] = { id: r.data.id }; done(r.data.id); } });
    };
  };

  // ---------- UI ----------
  function card() {
    var on = !!user, sub = !on ? t('Not signed in') : t('Signed in as') + ' ' + user.email + (role === 'coach' ? ' · coach' : '');
    if (on && role === 'none') sub += ' — ' + t('This account is not linked to a coach yet. Ask your coach to invite this email.');
    var st = on && status ? ' · ' + (status === 'ok' ? '✓ ' + t('Synced') : t('Offline — will sync later')) : '';
    return '<div class="card row" id="cloud-card" style="margin-bottom:12px;border:1px solid rgba(212,175,55,.5)"><div class="grow"><b>☁️ ' + esc(t('Live sync')) + '</b><div class="tiny muted">' + esc(sub + st) + '</div></div>' +
      (on ? '<button class="btn sm" data-act="cloud-out">' + esc(t('Sign out')) + '</button>' : '<button class="btn sm primary" data-act="cloud-in">' + esc(t('Sign in')) + '</button>') + '</div>';
  }
  var oMore = V.more; V.more = function () { return card() + oMore.apply(this, arguments); };
  A['cloud-out'] = function () { sb && sb.auth.signOut().then(function () { user = null; stop(); }); };
  A['cloud-in'] = function () {
    var nl = S.lang === 'nl';
    var s = App.sheet(App.sheetHead(t('Live sync'), S.role === 'coach' ? t('Clients appear here live.') : t('Your data syncs live with your coach.')) +
      '<form id="cl-f"><input class="input" id="cl-e" type="email" autocomplete="username" placeholder="' + esc(t('Email')) + '" required>' +
      '<input class="input" id="cl-p" type="password" autocomplete="current-password" placeholder="' + esc(t('Password (min. 6)')) + '" style="margin-top:8px">' +
      '<label class="row small" style="gap:8px;margin-top:12px;align-items:flex-start"><input type="checkbox" id="cl-c"' + (localStorage.getItem('fbg.consent') ? ' checked' : '') + '><span>' + esc(t('I agree that my training, food, body and check-in data (including photos) are stored securely in the EU and shared only with my coach.')) + '</span></label>' +
      '<details class="tiny muted" style="margin-top:6px"><summary>' + esc(t('Privacy')) + '</summary><p>' + esc(nl ? PRIV_NL : PRIV_EN) + '</p><p>' + esc(nl ? PRIV_EN : PRIV_NL) + '</p></details>' +
      '<p class="tiny" id="cl-m" style="min-height:1em;color:var(--gold,#d4af37)"></p>' +
      '<div class="grid2"><button class="btn primary" type="submit" id="cl-in">' + esc(t('Sign in')) + '</button><button class="btn" type="button" id="cl-up">' + esc(t('Create account')) + '</button></div>' +
      '<button class="btn ghost block small" type="button" id="cl-ml" style="margin-top:8px">✉️ ' + esc(t('Send login link instead')) + '</button></form>');
    var $ = function (q) { return s.el.querySelector(q); }, msg = function (m) { $('#cl-m').textContent = m; };
    function ok() { if (!$('#cl-c').checked) { msg(t('Please tick the consent box.')); return false; } localStorage.setItem('fbg.consent', new Date().toISOString()); return true; }
    load().then(function () {
      $('#cl-f').onsubmit = function (e) { e.preventDefault(); if (!ok()) return; msg('…');
        sb.auth.signInWithPassword({ email: $('#cl-e').value.trim(), password: $('#cl-p').value }).then(function (r) { if (r.error) msg(r.error.message); else { s.close(); App.toast('✅ ' + t('Synced')); } }); };
      $('#cl-up').onclick = function () { if (!ok()) return; msg('…');
        sb.auth.signUp({ email: $('#cl-e').value.trim(), password: $('#cl-p').value, options: { emailRedirectTo: App.baseUrl() } }).then(function (r) {
          if (r.error) msg(r.error.message); else if (r.data.session) { s.close(); App.toast('✅ ' + t('Synced')); } else msg(t('Check your inbox for the login link.')); }); };
      $('#cl-ml').onclick = function () { if (!ok()) return; msg('…');
        sb.auth.signInWithOtp({ email: $('#cl-e').value.trim(), options: { emailRedirectTo: App.baseUrl(), shouldCreateUser: true } }).then(function (r) { msg(r.error ? r.error.message : t('Check your inbox for the login link.')); }); };
    }).catch(function () { msg(t('Offline — will sync later')); });
  };
  // coach client page: live block + invite button
  var oClient = V.client; V.client = function (id) {
    var h = oClient.apply(this, arguments); if (id === 'me' || !h) return h; var c = App.client(id); if (!c) return h;
    var b = '<div class="section"><div class="section-head"><h2 class="h2">☁️ ' + esc(t('Live data')) + '</h2>' + (c.live && c.live.at ? '<span class="small muted">' + esc(t('last update')) + ': ' + esc(F.fmtDate(c.live.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</span>' : '') + '</div>';
    if (c.live && c.live.d && Object.keys(c.live.d).length) {
      var d = c.live.d, body = (d.body || []).filter(function (x) { return x.weight; }), w = body.length ? body[body.length - 1].weight : null, today = App.today();
      var fe = (d.food || {})[today] || [], tot = fe.length ? App.dayTotals(fe) : null, ses = (d.sessions || []).slice(-1)[0], sum = d.checkins && d.checkins.summary;
      b += '<div class="grid3"><div class="stat"><div class="v">' + (w ? w + ' kg' : '—') + '</div><div class="l">' + esc(t('weight')) + '</div></div><div class="stat"><div class="v">' + (tot ? Math.round(tot.kcal) : '—') + '</div><div class="l">kcal ' + esc(t('today')) + '</div></div><div class="stat"><div class="v">' + (sum && sum.adh ? App.pct(sum.adh.overall) : '—') + '</div><div class="l">' + esc(t('adherence')) + '</div></div></div>' +
        (ses ? '<p class="small muted" style="margin-top:8px">🏋️ ' + esc(ses.title || '') + ' · ' + esc(ses.date || '') + '</p>' : '') + '<div id="cl-ph" class="ph-3" style="margin-top:8px" data-cid="' + esc(c.cloudId) + '"></div>';
      setTimeout(function () { showPhotos(c); });
    } else b += '<p class="small muted">' + esc(c.cloudId ? (c.email || '') + ' · ' + t('Waiting for first login') : t('Clients appear here live.')) + '</p>';
    if (user && role === 'coach') b += '<button class="btn block" data-act="cloud-invite" data-id="' + esc(c.id) + '" style="margin-top:8px">✉️ ' + esc(t('Invite for live sync')) + '</button>';
    else if (!user) b += '<button class="btn block" data-act="cloud-in" style="margin-top:8px">☁️ ' + esc(t('Sign in')) + '</button>';
    return h + b + '</div>';
  };
  function showPhotos(c) {
    var el = document.getElementById('cl-ph'); if (el) { el.innerHTML = ''; el.style.display = 'none'; }
  }
  var oWel = V.welcome; V.welcome = function () { var h = oWel.apply(this, arguments), i = h.lastIndexOf('</div></div>'); return h.slice(0, i) + '<button class="btn ghost block small" data-act="cloud-in" style="margin-top:4px">☁️ ' + esc(S.lang === 'nl' ? 'Inloggen (live koppeling met coach)' : 'Sign in (live sync with coach)') + '</button>' + h.slice(i); };
  // start in the background if a session exists
  try { if (localStorage.getItem('fbg.sb.auth') || /access_token=|code=/.test(location.href)) load().catch(function () {}); } catch (e) {}
})();
