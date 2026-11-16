'use strict';
// Headless smoke test: loads the real app in Chrome, opens every main screen as client and as coach,
// runs the core logic (steps math, health-sync merge, coach->client plan delivery, Sweatpoints gifts)
// against the real code, and fails on ANY console error, page error or guarded render error.
var fs = require('fs'), path = require('path');
var serve = require('./lib/serve'), root = path.resolve(__dirname, '..');
var pw; try { pw = require('playwright-core'); } catch (e) { console.error('FAIL  playwright-core missing: run "npm install" first'); process.exit(1); }

function findChrome() {
  var c = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  for (var i = 0; i < c.length; i++) if (c[i] && fs.existsSync(c[i])) return c[i];
  return null;
}
var passed = 0, failed = 0;
function ok(name) { passed++; console.log('ok    ' + name); }
function bad(name, msg) { failed++; console.error('FAIL  ' + name + '\n      ' + msg); }

(async function main() {
  var exe = findChrome();
  if (!exe) { console.error('FAIL  no Chrome/Chromium found (set CHROME_PATH)'); process.exit(1); }
  var srv = await serve(root);
  var browser = await pw.chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--disable-gpu'] });
  var ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, locale: 'nl-NL', timezoneId: 'Europe/Amsterdam' });
  // No real network: Supabase, CDNs and AI models are cut off so the test is fast, private and repeatable.
  await ctx.route(function (u) { return !/^http:\/\/127\.0\.0\.1:/.test(u.href); }, function (r) { r.abort(); });
  var page = await ctx.newPage(), errors = [];
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error' && !/net::ERR_FAILED|Failed to load resource/.test(m.text())) errors.push('console.error: ' + m.text()); });

  async function step(name, fn) {
    errors.length = 0;
    try {
      var r = await fn();
      var guarded = await page.evaluate(function () { var e = window.FBG_ERRORS || []; window.FBG_ERRORS = []; return e; }).catch(function () { return []; });
      guarded.forEach(function (g) { errors.push('guarded ' + g.kind + ': ' + g.msg); });
      if (errors.length) return bad(name, errors.slice(0, 5).join('\n      '));
      if (r && r.fail) return bad(name, r.fail);
      ok(name);
    } catch (e) { bad(name, (e && e.message || e) + (errors.length ? '\n      ' + errors.join('\n      ') : '')); }
  }
  async function screen(hash, expectSel) {
    await page.evaluate(function (h) { location.hash = h; }, hash);
    await page.waitForTimeout(250);
    return page.evaluate(function (sel) {
      var v = document.getElementById('view'), txt = (v && v.innerText || '').trim();
      if (txt.length < 20) return { fail: 'screen is (almost) empty' };
      if (/undefined|NaN|\[object Object\]/.test(txt)) return { fail: 'screen shows "' + (txt.match(/.{0,30}(undefined|NaN|\[object Object\]).{0,30}/) || [''])[0] + '"' };
      if (/Dit scherm kon even niet laden|This screen could not load/.test(txt)) return { fail: 'render guard fallback shown' };
      if (sel && !document.querySelector(sel)) return { fail: 'missing ' + sel };
      return null;
    }, expectSel || null);
  }

  await step('app boots to the welcome screen', async function () {
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    return page.evaluate(function () { return window.App && App.VERSION && document.querySelector('#view').innerText.length > 20 ? null : { fail: 'App not loaded' }; });
  });
  await step('version in core.js equals version.json', async function () {
    var v = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v;
    var app = await page.evaluate(function () { return App.VERSION; });
    return app === v ? null : { fail: app + ' vs ' + v };
  });

  // ---- seed a realistic client ----
  await step('seed a client with plan, meals, food, sessions, steps', async function () {
    await page.evaluate(function () {
      var S = App.S, today = App.today();
      S.role = 'athlete'; S.lang = 'nl'; S.me.isCoach = true; S.me.coachOk = true; // coach's own device (access gate)
      S.me.profile = { name: 'Test Klant', sex: 'm', age: 35, weight: 90, height: 182, goal: 'lean', activity: 1.55, mode: 'gym', level: 'intermediate', stepGoal: 7500 };
      S.me.plan = App.generatePlan('lean3', { mode: 'gym', level: 'intermediate' }); S.me.plan.start = App.isoAdd(today, -3);
      S.me.meal = App.generateMeal(S.me.profile, 4);
      var fd = App.FD.BY_ID['chicken-breast']; S.me.food = {}; S.me.food[today] = [Object.assign({ id: 'f1', fid: fd.id, name: App.foodName(fd), g: 150, meal: 'lunch', src: 'db', at: Date.now() }, App.macrosFor(fd, 150))];
      S.me.body = [{ date: App.isoAdd(today, -7), weight: 91 }, { date: today, weight: 90 }];
      S.me.health = { days: {}, last: null, sources: {} };
      S.me.health.days[today] = { steps: 4000, man: 500, cx: [{ n: 'Fietsen', min: 20, v: 3200 }] };
      S.me.sessions = [{ id: 's1', date: today, title: 'MMA', type: 'sport', sport: 'mma', dur: 5400, rpe: 7, estSteps: 10800, endedAt: Date.now(), items: [], prs: [] }];
      S.clients = [{ id: 'c1', name: 'Klant Een', created: new Date().toISOString(), checkins: [], profile: { name: 'Klant Een', sex: 'f', age: 60, weight: 70, height: 165, goal: 'lean', stepGoal: 7500 }, plan: App.generatePlan('lean3'), sessions: [], food: {}, body: [] }];
      App.save(); localStorage.setItem('fbg.tourDone', '1');
    });
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(600);
    return null;
  });

  var ATH = [['today', '.tabbar'], ['food'], ['train'], ['progress'], ['more'], ['health'], ['pet'], ['plan/me'], ['meal/me'], ['hlink']];
  for (var i = 0; i < ATH.length; i++) { await step('client screen #/' + ATH[i][0], screen.bind(null, '#/' + ATH[i][0], ATH[i][1])); }

  await step('English screens render too', async function () {
    await page.evaluate(function () { App.S.lang = 'en'; App.save(); });
    for (var k = 0; k < 5; k++) { var r = await screen('#/' + ['today', 'food', 'train', 'progress', 'more'][k]); if (r) return { fail: '[en] ' + r.fail }; }
    await page.evaluate(function () { App.S.lang = 'nl'; App.save(); });
    return null;
  });

  // ---- logic against the real code ----
  await step('step total = sync + manual + sport estimate + cardio, no double counting', async function () {
    return page.evaluate(function () {
      var t = App.today(), s = App.stepsOf(t);
      if (s.total !== 4000 + 500 + 10800 + 3200) return { fail: 'total ' + s.total };
      App.mergeHealth((function () { var o = {}; o[t] = { steps: 6000 }; return o; })(), [], 'Shortcut');
      s = App.stepsOf(t); if (s.sync !== 6000 || s.total !== 6000 + 500 + 10800 + 3200) return { fail: 'after sync ' + JSON.stringify(s) };
      App.mergeHealth((function () { var o = {}; o[t] = { steps: 3000 }; return o; })(), [], 'Shortcut');
      if (App.stepsOf(t).sync !== 6000) return { fail: 'a lower sync lowered the steps' };
      App.mergeHealth((function () { var o = {}; o[t] = { steps: 6000 }; return o; })(), [], 'Shortcut');
      if (App.stepsOf(t).total !== 20500) return { fail: 'same sync twice counted double: ' + App.stepsOf(t).total };
      App.S.me.health.days[t].ov = 9000; if (App.stepsOf(t).total !== 9000) return { fail: 'manual override ignored' };
      delete App.S.me.health.days[t].ov; return null;
    });
  });
  await step('server health row applies once (idempotent) and keeps max', async function () {
    return page.evaluate(function () {
      if (!App.applyHealthSync) return { fail: 'App.applyHealthSync missing' };
      var t = App.today(), y = App.isoAdd(t, -1), days = {}; days[y] = { steps: 8123 }; days[t] = { steps: 7000 };
      var row = { updated_at: new Date().toISOString(), data: { days: days, last: 'x1' } };
      App.applyHealthSync(row); var a = App.stepsOf(y).sync, b = App.stepsOf(t).sync;
      var again = App.applyHealthSync(row);
      if (a !== 8123) return { fail: 'yesterday ' + a };
      if (b !== 7000) return { fail: 'today should rise to 7000, is ' + b };
      if (again) return { fail: 'second apply reported a change' };
      if (App.stepsOf(y).sync !== 8123) return { fail: 'changed on 2nd apply' };
      return null;
    });
  });
  await step('removing a sport session removes its estimated steps', async function () {
    return page.evaluate(function () {
      var t = App.today(), before = App.stepsOf(t).total; App.removeSession('s1');
      var after = App.stepsOf(t).total; return before - after === 10800 ? null : { fail: before + ' -> ' + after };
    });
  });
  await step('coach plan + targets + step goal reach the client (and update later)', async function () {
    return page.evaluate(function () {
      var C = App.cloud && App.cloud._test; if (!C) return { fail: 'cloud test hooks missing' };
      var S = App.S, plan = App.generatePlan('lean3'); plan.id = 'coachplan1'; plan.name = 'Coach plan';
      C.applyPlan({ id: 'cid1', updated_at: '2026-01-01T10:00:00Z', plan: plan, meal: null, profile: { targetsOverride: { kcal: 1700, p: 120, c: 180, f: 55 }, stepGoal: 7500 } });
      if (!S.me.plan || S.me.plan.id !== 'coachplan1') return { fail: 'plan not delivered to My training' };
      if (App.athTargets(S.me).kcal !== 1700) return { fail: 'targets ' + App.athTargets(S.me).kcal };
      if (App.stepGoal(S.me) !== 7500) return { fail: 'step goal ' + App.stepGoal(S.me) };
      var plan2 = App.generatePlan('lean3'); plan2.id = 'coachplan2';
      C.applyPlan({ id: 'cid1', updated_at: '2026-01-02T10:00:00Z', plan: plan2, profile: { targetsOverride: { kcal: 1800, p: 130, c: 190, f: 55 }, stepGoal: 9000 } });
      if (S.me.plan.id !== 'coachplan2') return { fail: 'updated plan not delivered' };
      if (App.athTargets(S.me).kcal !== 1800) return { fail: 'updated targets not delivered' };
      if (App.stepGoal(S.me) !== 9000) return { fail: 'updated step goal not delivered (still ' + App.stepGoal(S.me) + ')' };
      if (S.me.plan.start > App.today()) return { fail: 'plan starts in the future' };
      if (!S.me.meal || S.me.meal.targets.kcal !== 1800) return { fail: 'meal plan targets not updated to coach macros' };
      return null;
    });
  });
  await step('Sweatpoints gift is added exactly once, outside the day cap', async function () {
    return page.evaluate(function () {
      var S = App.S, g = App.game(), before = g.sp;
      S.me.profile.spGifts = [{ id: 'gtest', pts: 1000, label: 'Cadeau' }];
      var n1 = App.applySpGifts(), n2 = App.applySpGifts();
      if (n1 !== 1000 || n2 !== 0) return { fail: 'gift applied ' + n1 + ' then ' + n2 };
      if (App.game().sp - before !== 1000) return { fail: 'sp moved by ' + (App.game().sp - before) };
      return null;
    });
  });
  await step('client screens still render after sync + coach update', async function () {
    var list = ['today', 'train', 'progress', 'food'];
    for (var k = 0; k < list.length; k++) { var r = await screen('#/' + list[k]); if (r) return { fail: list[k] + ': ' + r.fail }; }
    return null;
  });

  // ---- coach mode ----
  await step('switch to Coach mode via the header button', async function () {
    await screen('#/today');
    await page.evaluate(function () { if (App.closeSheets) App.closeSheets(); });
    await page.click('#role-switch', { timeout: 5000 }); await page.waitForTimeout(300);
    var r = await page.evaluate(function () { return App.S.role; });
    return r === 'coach' ? null : { fail: 'role is ' + r };
  });
  var COACH = [['clients', '.tabbar'], ['client/c1'], ['client/me'], ['plans'], ['mind'], ['more'], ['health'], ['hlink'], ['plan/c1'], ['meal/c1']];
  for (var j = 0; j < COACH.length; j++) await step('coach screen #/' + COACH[j][0], screen.bind(null, '#/' + COACH[j][0], COACH[j][1]));

  // ---- v3.31: delete client + approval gate ----
  await step('coach: a deleted client is gone from the list and stays gone', async function () {
    var r = await page.evaluate(function () {
      App.S.clients.push({ id: 'cdel', cloudId: 'del-cloud-1', name: 'Weg Klant', created: new Date().toISOString(), checkins: [], profile: { name: 'Weg Klant' } });
      location.hash = '#/clients'; App.route();
      var before = document.getElementById('view').innerText.indexOf('Weg Klant') !== -1;
      App.applyDeletedClients(['del-cloud-1']); App.route();
      var after = document.getElementById('view').innerText.indexOf('Weg Klant') !== -1;
      return { before: before, after: after, kept: !!App.client('c1') };
    });
    if (!r.before || r.after || !r.kept) return { fail: JSON.stringify(r) };
  });
  await step('coach: pending sign-ups show "Toegang geven" / "Weigeren" on top', async function () {
    var r = await page.evaluate(function () {
      App.cloud._test.setPending([{ id: 'p1', name: 'Nieuw Iemand', email: 'nieuw@example.com', status: 'pending' }]);
      location.hash = '#/clients'; App.route(); var v = document.getElementById('view');
      var ok = !!v.querySelector('[data-act="acc-approve"]') && !!v.querySelector('[data-act="acc-reject"]') && v.innerText.indexOf('Nieuw Iemand') !== -1;
      App.cloud._test.setPending([]); App.route();
      return ok && !document.querySelector('#acc-pending');
    });
    if (!r) return { fail: 'pending card wrong' };
  });
  await step('coach: delete needs the typed name ("Definitief verwijderen")', async function () {
    await page.evaluate(function () { App.S.clients.push({ id: 'cloc', name: 'Lokaal Klant', created: new Date().toISOString(), checkins: [], profile: { name: 'Lokaal Klant' } }); location.hash = '#/client/cloc'; App.route(); });
    await page.waitForTimeout(150);
    await page.click('[data-act="client-del"]'); await page.waitForTimeout(200);
    var d0 = await page.evaluate(function () { var b = document.getElementById('del-go'); return b && b.disabled; });
    await page.fill('#del-n', 'verkeerd'); var d1 = await page.evaluate(function () { return document.getElementById('del-go').disabled; });
    await page.fill('#del-n', 'lokaal klant'); var d2 = await page.evaluate(function () { return document.getElementById('del-go').disabled; });
    await page.click('#del-go'); await page.waitForTimeout(300);
    var gone = await page.evaluate(function () { return !App.client('cloc'); });
    if (!(d0 === true && d1 === true && d2 === false && gone)) return { fail: JSON.stringify([d0, d1, d2, gone]) };
  });
  await step('gate: pending is locked, unknown is locked, approved client works', async function () {
    var r = await page.evaluate(function () {
      var S = App.S, me = S.me, keep = [me.coachOk, me.cid, S.role], v = document.getElementById('view'), out = {};
      me.coachOk = false; me.cid = null; S.role = 'athlete'; localStorage.removeItem('fbg.sb.auth');
      localStorage.setItem('fbg.pending', '1'); location.hash = '#/today'; App.route();
      out.pending = /Wacht op goedkeuring van je coach/.test(v.innerText);
      out.pendingNoFood = !/kcal/.test(v.innerText);
      localStorage.removeItem('fbg.pending'); App.route();
      out.login = /alleen voor klanten/.test(v.innerText) && !!v.querySelector('[data-act="cloud-in"]');
      me.cid = 'approved-cid'; App.route();
      out.approved = !/alleen voor klanten|Wacht op goedkeuring/.test(v.innerText) && v.innerText.length > 50;
      me.coachOk = keep[0]; me.cid = keep[1]; S.role = keep[2]; App.save(); location.hash = '#/clients'; App.route();
      return out;
    });
    if (!r.pending || !r.pendingNoFood || !r.login || !r.approved) return { fail: JSON.stringify(r) };
  });

  await step('sync: a fresh phone restores server data first and never pushes empty over it', async function () {
    var r = await page.evaluate(async function () {
      var S = App.S, keep = S.me, keepRole = S.role, ups = [], mode = 'ok';
      var srv = [{ kind: 'food', updated_at: '2026-11-15T10:00:00+00:00', data: { '2026-11-14': [{ id: 'a', name: 'Pan', kcal: 100, p: 1, c: 20, f: 1 }] } },
        { kind: 'sessions', updated_at: '2026-11-15T10:00:00+00:00', data: [{ id: 's1', date: '2026-11-10', title: 'Push', type: 'plan', dur: 600, endedAt: 1, items: [], prs: [] }] }];
      function q() { var o = { select: function () { return o; }, eq: function () { return o; }, in: function () { return o; }, order: function () { return o; }, limit: function () { return o; },
        maybeSingle: function () { return Promise.resolve({ data: null, error: null }); },
        then: function (a, b) { return Promise.resolve(mode === 'fail' ? { data: null, error: { message: 'offline' } } : { data: srv, error: null }).then(a, b); },
        upsert: function (x) { ups.push(x); return Promise.resolve({ error: null }); } }; return o; }
      var fake = { from: q, rpc: function () { return Promise.resolve({ data: null, error: null }); },
        storage: { from: function () { return { list: function () { return Promise.resolve({ data: [], error: null }); }, upload: function () { return Promise.resolve({ error: null }); }, move: function () { return Promise.resolve({ error: null }); }, remove: function () { return Promise.resolve({ error: null }); } }; } } };
      var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); }, out = {};
      // 1) server read fails -> nothing at all is pushed
      S.me = { cid: 'cid-smoke', profile: null, plan: null, meal: null, sessions: [], food: {}, body: [], habits: {}, checkins: [], coach: null };
      localStorage.removeItem('fbg.syncAt'); mode = 'fail'; App.cloud._test.setClient({ id: 'cid-smoke' }, 'client', fake);
      App.cloud.push(true); await wait(300); out.failPushed = ups.length;
      // 2) server read works -> history restored, then pushed back complete
      mode = 'ok'; App.cloud._test.setClient({ id: 'cid-smoke' }, 'client', fake);
      App.cloud.push(true); await wait(400);
      out.food = !!(S.me.food['2026-11-14'] && S.me.food['2026-11-14'][0].id === 'a'); out.sessions = S.me.sessions.length;
      var rows = [].concat.apply([], ups.map(function (x) { return Array.isArray(x) ? x : [x]; }));
      var food = rows.filter(function (x) { return x.kind === 'food'; })[0];
      out.pushedFood = !!(food && food.data['2026-11-14']);
      out.emptyPushed = rows.filter(function (x) { return (x.kind === 'food' || x.kind === 'sessions') && !Object.keys(x.data || {}).length; }).length;
      App.cloud._test.setClient(null, null, null); S.me = keep; S.role = keepRole; App.save(); localStorage.removeItem('fbg.syncAt');
      location.hash = '#/clients'; App.route();
      return out;
    });
    if (r.failPushed !== 0 || !r.food || r.sessions !== 1 || !r.pushedFood || r.emptyPushed) return { fail: JSON.stringify(r) };
  });

  await step('check-in link: a live client keeps one card (no duplicate) and a locked browser is not turned into a coach', async function () {
    var r = await page.evaluate(function () {
      var S = App.S, n0 = S.clients.length, out = {};
      S.clients.push({ id: 'loc-mo', cloudId: 'cloud-mo', name: 'Mo Test', created: new Date().toISOString(), checkins: [], profile: {} });
      var c = App.importCheckin({ t: 'checkin', cid: 'cloud-mo', name: 'Mo Test', at: '2026-11-16T08:00:00.000Z' });
      out.same = c.id === 'loc-mo'; out.count = S.clients.length - n0;
      S.clients = App.S.clients = S.clients.filter(function (x) { return x.id !== 'loc-mo'; });
      var keep = [S.me.coachOk, S.me.cid, S.role, S.me.isCoach]; S.me.coachOk = false; S.me.isCoach = false; S.me.cid = 'approved-client'; S.role = 'athlete'; localStorage.removeItem('fbg.pending');
      App.showImport({ t: 'checkin', cid: 'cloud-x', name: 'Iemand', at: '2026-11-16T09:00:00.000Z' });
      out.msg = /komt vanzelf binnen/.test(document.getElementById('view').innerText); out.role = S.role; out.noNew = !App.client('cloud-x');
      S.me.coachOk = keep[0]; S.me.cid = keep[1]; S.role = keep[2]; S.me.isCoach = keep[3]; App.save(); location.hash = '#/clients'; App.route();
      return out;
    });
    if (!r.same || r.count !== 1 || !r.msg || r.role !== 'athlete' || !r.noNew) return { fail: JSON.stringify(r) };
  });
  await step('intake via a Safari link is saved straight to the coach (intake_drop), and warns when it cannot be', async function () {
    var p2 = await ctx.newPage(), calls = [];
    await p2.route(/rpc\/intake_drop/, function (rt) { calls.push(JSON.parse(rt.request().postData() || '{}')); rt.fulfill({ status: 200, contentType: 'application/json', body: '"saved"' }); });
    p2.on('pageerror', function (e) { errors.push('intake pageerror: ' + e.message); });
    await p2.goto(srv.url.replace(/\/?$/, '/') + 'intake.html?k=tok123abc&lang=nl', { waitUntil: 'load' });
    var res = await p2.evaluate(async function () {
      var out = {};
      out.saved = await window.FBG_INTAKE_DROP({ id: 'ik-smoke-1', type: 'intake', answers: { name: 'Test', email: 'test@example.com' } });
      return out;
    });
    var call = calls[0] || {};
    // no token at all (plain ?c= link, no join) -> nothing sent, clear warning on the thanks screen
    await p2.evaluate(function () { localStorage.clear(); localStorage.setItem('fbg.intakeLast', JSON.stringify({ id: 'ik-2', type: 'intake', v: 1, lang: 'nl', submittedAt: new Date().toISOString(), answers: { name: 'Test Twee', email: 'x@example.com', consent: true } })); });
    await p2.goto(srv.url.replace(/\/?$/, '/') + 'intake.html?lang=nl', { waitUntil: 'load' }); await p2.waitForTimeout(200);
    var warn = await p2.evaluate(function () { var n = document.getElementById('srv-note'); return n ? n.innerText : ''; });
    await p2.close();
    if (res.saved !== 'saved' || call.p_token !== 'tok123abc' || !call.p_data || call.p_data.id !== 'ik-smoke-1' || !/alleen op deze telefoon/.test(warn)) return { fail: JSON.stringify({ res: res, call: !!call.p_data, warn: warn }) };
  });

  await step('join: an existing account (sign-up gives no session) signs in and links instead of "check your inbox"', async function () {
    var c2 = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, locale: 'nl-NL' });
    await c2.route(function (u) { return !/^http:\/\/127\.0\.0\.1:/.test(u.href); }, function (r) { r.abort(); });
    await c2.addInitScript(function () {
      var cb = null, calls = window.__calls = [];
      function q() { var o = { select: function () { return o; }, eq: function () { return o; }, in: function () { return o; }, maybeSingle: function () { return Promise.resolve({ data: null, error: null }); }, then: function (a, b) { return Promise.resolve({ data: [], error: null }).then(a, b); }, upsert: function () { return Promise.resolve({ error: null }); } }; return o; }
      var fake = { auth: { onAuthStateChange: function (f) { cb = f; }, getSession: function () { return Promise.resolve({ data: { session: null } }); },
          signUp: function () { calls.push('signUp'); return Promise.resolve({ data: { user: { id: 'x' }, session: null }, error: null }); },
          signInWithPassword: function () { calls.push('signIn'); var sess = { user: { id: 'u-join', email: 'a@b.cd' } }; setTimeout(function () { cb && cb('SIGNED_IN', sess); }, 0); return Promise.resolve({ data: { session: sess, user: sess.user }, error: null }); },
          signOut: function () { return Promise.resolve({}); } },
        rpc: function (n) { calls.push(n); return Promise.resolve(n === 'join_coach' ? { data: 'cid-join', error: null } : n === 'my_status' ? { data: { status: 'pending' }, error: null } : { data: null, error: null }); },
        from: q, channel: function () { var c = { on: function () { return c; }, subscribe: function () { return c; } }; return c; }, removeChannel: function () {}, storage: { from: function () { return {}; } } };
      window.supabase = { createClient: function () { return fake; } };
    });
    var p3 = await c2.newPage(), errs = [];
    p3.on('pageerror', function (e) { errs.push(e.message); });
    await p3.goto(srv.url.replace(/\/?$/, '/') + '?join=abc12345', { waitUntil: 'load' });
    await p3.evaluate(function () { localStorage.setItem('fbg.intakes', JSON.stringify([{ id: 'ik', type: 'intake', answers: { name: 'Nieuw', email: 'a@b.cd' } }])); App.route(); });
    await p3.waitForTimeout(200);
    await p3.fill('#jn', 'Nieuw'); await p3.fill('#je', 'a@b.cd'); await p3.fill('#jp', 'geheim123'); await p3.check('#jc');
    await p3.click('#jf button[type=submit]'); await p3.waitForTimeout(800);
    var r = await p3.evaluate(function () { var m = document.getElementById('jm'); return { calls: window.__calls, joined: localStorage.getItem('fbg.joined'), msg: m ? m.textContent : '' }; });
    await c2.close();
    if (errs.length) return { fail: errs.join('; ') };
    if (r.calls.indexOf('signIn') === -1 || r.calls.indexOf('join_coach') === -1 || r.joined !== 'cid-join') return { fail: JSON.stringify(r) };
  });

  // ---- the error guard itself ----
  await step('error guard: a crash shows a calm toast and is recorded, app keeps working', async function () {
    await page.evaluate(function () { setTimeout(function () { throw new Error('smoke-test boom'); }, 0); });
    await page.waitForTimeout(200);
    var r = await page.evaluate(function () {
      var rec = (window.FBG_ERRORS || []).filter(function (e) { return /smoke-test boom/.test(e.msg); }).length;
      window.FBG_ERRORS = []; var toast = document.querySelector('.toast');
      return { rec: rec, toast: toast && toast.textContent };
    });
    errors.length = 0; // the boom is expected
    if (!r.rec) return { fail: 'error not recorded' };
    if (!r.toast) return { fail: 'no toast shown' };
    return null;
  });
  await step('render guard: a broken screen shows a fallback instead of a blank page', async function () {
    var r = await page.evaluate(function () {
      var o = App.views.mind; App.views.mind = function () { throw new Error('smoke-test render'); };
      location.hash = '#/plans'; App.route(); location.hash = '#/mind'; App.route();
      var txt = document.getElementById('view').innerText; App.views.mind = o; window.FBG_ERRORS = [];
      return /kon even niet laden|could not load/.test(txt);
    });
    errors.length = 0;
    return r ? null : { fail: 'no fallback shown' };
  });

  await browser.close(); srv.close();
  console.log('smoke: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error('FAIL  smoke crashed: ' + (e && e.stack || e)); process.exit(1); });
