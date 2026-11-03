/* Forged by Grace v2 — athlete side: welcome, import, Today, Food, Train (+ logger), Progress. */
(function () {
  'use strict';
  var App = window.App, S = App.S, F = App.F, D = App.D, FD = App.FD, esc = App.esc, t = App.t, I = App.I;
  var V = App.views, A = App.acts;
  function me() { return S.me; }

  // ---------------- Welcome / onboarding ----------------
  V.welcome = function () {
    return '<div class="welcome"><div class="logo-xl">' + App.LOGO + '</div>' +
      '<p class="kicker center">' + esc(S.coach.name) + '</p><h1 class="h1 center">Forged by Grace</h1>' +
      '<p class="center muted">' + esc(t('Train the body. Guard the heart.')) + '</p>' +
      '<div class="lang-row">' + App.langSwitch() + '</div>' +
      '<div class="stack" style="margin-top:22px">' +
      '<button class="btn primary lg block" data-act="start-coach">' + I.users + esc(t("I'm the coach")) + '</button>' +
      '<button class="btn lg block" data-act="start-client">' + I.train + esc(t("I'm a client")) + '</button>' +
      '<button class="btn lg block" data-act="have-code">' + I.link + esc(t('I have a code from my coach')) + '</button>' +
      '<p class="tiny muted center">' + esc(t('Got a link from your coach? Just open it — your plan loads automatically.')) + '</p></div></div>';
  };
  App.langSwitch = function () {
    return '<div class="lang-switch" role="group" aria-label="Language">' + [['en', 'EN'], ['nl', 'NL'], ['es', 'ES']].map(function (l) {
      return '<button data-act="lang" data-v="' + l[0] + '" aria-pressed="' + (S.lang === l[0]) + '">' + l[1] + '</button>'; }).join('') + '</div>';
  };
  A.lang = function (el) { S.lang = el.dataset.v; document.documentElement.lang = S.lang; App.save(); App.rerender(); };
  A['start-coach'] = function () { S.role = 'coach'; S.me.isCoach = true; App.save(); App.profileSheet('me', function () { App.go('clients'); }); };
  A['start-client'] = function () { S.role = 'athlete'; App.save(); App.profileSheet('me', function () { App.go('today'); }); };

  // ---------------- Profile sheet (used for me + clients) ----------------
  App.profileSheet = function (oid, done, isNew) {
    var o = oid === 'new' ? { profile: {} } : App.owner(oid);
    var p = Object.assign({ name: oid === 'me' ? S.coach.name : '', sex: 'm', age: 30, height: 178, weight: 85, activity: 1.55, goal: 'lean', deficit: 20, level: 'intermediate', mode: 'gym', days: 4 }, (o && o.profile) || {});
    if (oid === 'me' && S.role !== 'coach' && !(o.profile)) p.name = '';
    function opt(map, cur) { return Object.keys(map).map(function (k) { return '<option value="' + k + '"' + (String(k) === String(cur) ? ' selected' : '') + '>' + esc(t(map[k])) + '</option>'; }).join(''); }
    var s = App.sheet(App.sheetHead(oid === 'new' ? t('New client') : t('Profile'), t('Used to calculate calories, macros and the plan.')) +
      '<form id="pf">' +
      '<label class="field"><span class="label">' + esc(t('Name')) + '</span><input class="input" name="name" required value="' + esc(p.name) + '" autocomplete="off"></label>' +
      (oid !== 'me' ? '<div class="grid2"><label class="field"><span class="label">' + esc(t('Email')) + ' <span class="opt">' + esc(t('optional')) + '</span></span><input class="input" name="email" type="email" value="' + esc(o.email || '') + '"></label><label class="field"><span class="label">WhatsApp <span class="opt">' + esc(t('optional')) + '</span></span><input class="input" name="phone" inputmode="tel" placeholder="316…" value="' + esc(o.phone || '') + '"></label></div>' : '') +
      '<div class="grid2"><label class="field"><span class="label">' + esc(t('Sex')) + '</span><select class="input" name="sex">' + opt({ m: 'Male', f: 'Female' }, p.sex) + '</select></label>' +
      '<label class="field"><span class="label">' + esc(t('Age')) + '</span><input class="input" name="age" inputmode="numeric" value="' + esc(p.age) + '"></label></div>' +
      '<div class="grid2"><label class="field"><span class="label">' + esc(t('Height (cm)')) + '</span><input class="input" name="height" inputmode="decimal" value="' + esc(p.height) + '"></label>' +
      '<label class="field"><span class="label">' + esc(t('Weight (kg)')) + '</span><input class="input" name="weight" inputmode="decimal" value="' + esc(p.weight) + '"></label></div>' +
      '<label class="field"><span class="label">' + esc(t('Goal')) + '</span><select class="input" name="goal">' + opt(App.GOALS, p.goal) + '</select></label>' +
      '<label class="field"><span class="label">' + esc(t('Daily activity')) + '</span><select class="input" name="activity">' + opt(App.ACT, p.activity) + '</select></label>' +
      '<div class="grid2"><label class="field"><span class="label">' + esc(t('Level')) + '</span><select class="input" name="level">' + opt(App.LEVELS, p.level) + '</select></label>' +
      '<label class="field"><span class="label">' + esc(t('Training at')) + '</span><select class="input" name="mode">' + opt({ gym: 'Full gym', home: 'Home (dumbbells / bands)', bw: 'Bodyweight only' }, p.mode) + '</select></label></div>' +
      '<button class="btn primary lg block" type="submit">' + esc(t('Save')) + '</button></form>');
    s.el.querySelector('#pf').onsubmit = function (e) {
      e.preventDefault();
      var fd = new FormData(e.target), np = {};
      ['name', 'sex', 'age', 'height', 'weight', 'goal', 'activity', 'level', 'mode'].forEach(function (k) { np[k] = fd.get(k); });
      ['age', 'height', 'weight', 'activity'].forEach(function (k) { np[k] = App.num(np[k]); });
      np.name = String(np.name).trim(); if (!np.name) return;
      var target = o;
      if (oid === 'new') {
        target = { id: F.uid(), name: np.name, created: new Date().toISOString(), checkins: [], notes: '' };
        S.clients.push(target);
      }
      target.profile = Object.assign({}, target.profile || {}, np);
      if (oid !== 'me') { target.name = np.name; target.email = String(fd.get('email') || '').trim(); target.phone = String(fd.get('phone') || '').replace(/[^\d]/g, ''); }
      if (oid === 'me' && !target.profile.weightLogged) { target.body.push({ date: App.today(), weight: np.weight, src: 'profile' }); target.profile.weightLogged = true; }
      if (target.meal) { var T = App.calcTargets(target.profile); target.meal.targets = { kcal: T.kcal, p: T.p, c: T.c, f: T.f }; App.fitMeal(target.meal); }
      App.save(); s.close(); if (done) done(target); else App.rerender();
    };
    return s;
  };

  // ---------------- Import from link ----------------
  V.importLink = function (code) {
    var view = document.getElementById('view');
    App.renderTabs(''); document.querySelector('.tabbar').hidden = true;
    view.innerHTML = '<div class="welcome"><div class="logo-xl">' + App.LOGO + '</div><p class="center muted">' + esc(t('Opening…')) + '</p></div>';
    App.decode(code).then(function (obj) { App.showImport(obj); }).catch(function (err) {
      view.innerHTML = '<div class="welcome">' + App.empty('x', t('Could not open this link'), (err && err.message) || '', '<a class="btn" href="#/">' + esc(t('Go to app')) + '</a>') + '</div>';
    });
  };
  App.showImport = function (obj) {
    var view = document.getElementById('view');
    if (obj.t === 'assign') {
      view.innerHTML = '<div class="welcome"><div class="logo-xl">' + App.LOGO + '</div><p class="kicker center">' + esc(t('From your coach')) + ' · ' + esc(obj.coach && obj.coach.name) + '</p>' +
        '<h1 class="h1 center">' + esc(t('Hi {n}, your plan is ready', { n: String(obj.client.name).split(' ')[0] })) + '</h1>' +
        (obj.msg ? '<div class="card"><p style="margin:0;white-space:pre-wrap">' + esc(obj.msg) + '</p></div>' : '') +
        '<div class="card">' + (obj.plan ? '<div class="row">' + '<div class="ex-icon">' + I.train + '</div><div class="grow"><b>' + esc(obj.plan.name) + '</b><div class="small muted">' + App.trainDays(obj.plan) + ' ' + esc(t('training days / week')) + '</div></div></div>' : '') +
        (obj.meal ? '<div class="row" style="margin-top:12px"><div class="ex-icon">' + I.food + '</div><div class="grow"><b>' + esc(t('Meal plan')) + '</b><div class="small muted">' + obj.meal.targets.kcal + ' kcal · P ' + obj.meal.targets.p + ' · C ' + obj.meal.targets.c + ' · F ' + obj.meal.targets.f + '</div></div></div>' : '') + '</div>' +
        '<button class="btn primary lg block" data-act="accept-import" style="margin-top:16px">' + I.check + esc(t('Start my plan')) + '</button>' +
        '<p class="tiny muted center" style="margin-top:10px">' + esc(t('Your logs stay on this phone. You send progress to your coach with one tap.')) + '</p></div>';
      App._pendingImport = obj;
    } else if (obj.t === 'checkin') {
      var c = App.importCheckin(obj);
      history.replaceState(null, '', '#/client/' + c.id);
      App.toast(t('Check-in from {n} saved', { n: c.name }));
      App.route();
    } else if (obj.t === 'backup') {
      App.toast(t('Use More → Restore backup for backup files.')); location.hash = '#/';
    } else { location.hash = '#/'; }
  };
  App.importCheckin = function (obj) {
    if (S.role !== 'coach') { S.role = 'coach'; }
    var c = App.client(obj.cid);
    if (!c) { c = { id: obj.cid || F.uid(), name: obj.name || 'Client', created: new Date().toISOString(), checkins: [], profile: obj.profile || {} }; S.clients.push(c); }
    c.checkins = (c.checkins || []).filter(function (x) { return x.at !== obj.at; });
    c.checkins.push(obj); c.checkins.sort(function (a, b) { return a.at < b.at ? -1 : 1; });
    c.lastCheckin = obj.at; c.unread = true;
    App.save(); return c;
  };
  // ---------------- client setup files (clients/<slug>.json, made from an intake) ----------------
  // ?client=<slug>          → client's phone: "Start my plan" (same as an assign link)
  // ?client=<slug>&coach=1  → coach's phone: adds/updates the client in the coach list
  // parse a pasted link / code: full link, or "fbg:<slug>:<privcode>"
  App.parseClientText = function (txt) {
    txt = String(txt || '').replace(/\s+/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
    if (!txt || /#imp=/.test(txt)) return null;
    var coach = /coach=1/.test(txt) || /^fbg:/i.test(txt), slug = null, priv = null, m;
    if ((m = txt.match(/[?&]client=([a-z0-9-]{2,40})/i))) { slug = m[1]; m = txt.match(/[#&]p=([A-Za-z0-9_-]+)/); priv = m ? m[1] : null; }
    else if ((m = txt.match(/^fbg(?:-client|-coach)?:([a-z0-9-]{2,40})(?::([A-Za-z0-9_-]+))?$/i))) { slug = m[1]; priv = m[2] || null; if (/^fbg-client:/i.test(txt)) coach = false; }
    else if (/^[zj][A-Za-z0-9_-]{40,}$/.test(txt)) { priv = txt; }
    else return null;
    return { slug: slug ? slug.toLowerCase() : null, priv: priv, coach: coach };
  };
  App.openClientFile = function (slug, asCoach, privCode) {
    var view = document.getElementById('view');
    App.renderTabs(''); var tb = document.querySelector('.tabbar'); if (tb) tb.hidden = true;
    view.innerHTML = '<div class="welcome"><div class="logo-xl">' + App.LOGO + '</div><p class="center muted">' + esc(t('Opening…')) + '</p></div>';
    // private part (weight, health notes) travels only in the link's #p= hash — never stored in the public repo
    var pm = privCode ? [0, privCode] : (location.hash || '').match(/[#&]p=([A-Za-z0-9_-]+)/), priv = {};
    history.replaceState(null, '', location.pathname + '#/');
    (pm ? App.decode('z' === pm[1][0] || 'j' === pm[1][0] ? pm[1] : pm[1]).catch(function () { return {}; }) : Promise.resolve({})).then(function (p) { priv = p || {}; slug = slug || priv.slug; if (!slug) throw new Error(t('That is not a Forged by Grace link or code.')); return fetch('clients/' + slug + '.json?t=' + Date.now(), { cache: 'no-store' }); }).then(function (r) { if (!r.ok) throw new Error(t('Could not open this link')); return r.json(); }).then(function (obj) {
      obj.client.profile = Object.assign({}, obj.client.profile || {}, priv.profile || {});
      if (priv.msg) obj.msg = (obj.msg ? obj.msg + '\n\n' : '') + priv.msg;
      if (priv.coachNotes) obj.coachNotes = priv.coachNotes;
      if (priv.flags) obj.flags = priv.flags;
      if (priv.planNotes && obj.plan) obj.plan.notes = (obj.plan.notes || []).concat(priv.planNotes);
      if (priv.mealTips && obj.meal && obj.meal.ideas) { obj.meal.ideas.tips = (obj.meal.ideas.tips || []).concat(priv.mealTips); if (priv.tipsTitle) obj.meal.ideas.tipsTitle = priv.tipsTitle; }
      obj.t = 'assign';
      obj.coach = obj.coach || { name: S.coach.name, email: S.coach.email, whatsapp: S.coach.whatsapp };
      if (obj.plan && !obj.plan.id) obj.plan.id = F.uid();
      if (!asCoach) { App.showImport(obj); return; }
      S.role = 'coach'; S.me.isCoach = true;
      var c = App.client(obj.client.id);
      if (!c) { c = { id: obj.client.id, name: obj.client.name, created: new Date().toISOString(), checkins: [] }; S.clients.push(c); }
      c.name = obj.client.name; c.profile = Object.assign({}, c.profile || {}, obj.client.profile || {});
      if (obj.plan) c.plan = App.clone(obj.plan);
      if (obj.meal) c.meal = App.clone(obj.meal);
      if (obj.coachNotes && (c.notes || '').indexOf(obj.coachNotes.slice(0, 40)) === -1) c.notes = obj.coachNotes + (c.notes ? '\n\n' + c.notes : '');
      if (obj.flags) c.flags = obj.flags.slice();
      c.setupSlug = slug; c.sharedAt = c.sharedAt || new Date().toISOString();
      App.save(); App.toast('✅ ' + t('Client added: {n}', { n: c.name })); if (tb) tb.hidden = false;
      location.hash = '#/client/' + c.id; App.route();
    }).catch(function (err) {
      view.innerHTML = '<div class="welcome">' + App.empty('x', t('Could not open this link'), (err && err.message) || '', '<a class="btn" href="./">' + esc(t('Go to app')) + '</a>') + '</div>';
    });
  };
  A['accept-import'] = function () {
    var obj = App._pendingImport; if (!obj) return;
    var ath = S.me;
    ath.cid = obj.client.id; ath.coach = obj.coach;
    ath.profile = Object.assign({}, ath.profile || {}, obj.client.profile || {}, { name: obj.client.name });
    if (obj.plan) { ath.plan = obj.plan; if (!ath.plan.start) ath.plan.start = App.today(); }
    if (obj.meal) ath.meal = obj.meal;
    if (!ath.body.length && ath.profile.weight) ath.body.push({ date: App.today(), weight: ath.profile.weight });
    if (S.role !== 'coach') S.role = 'athlete'; else S.role = 'athlete';
    App._pendingImport = null; App.save();
    history.replaceState(null, '', '#/today'); App.route(); App.toast(t('Plan loaded. Let’s go!'));
  };

  // ---------------- Today ----------------
  V.today = function () {
    var ath = me(), p = ath.profile || {}, plan = ath.plan, T = App.athTargets(ath), tot = App.dayTotals(App.foodDay(ath));
    var day = App.dayOf(plan), wk = App.planWeek(plan), streak = App.streak(ath);
    var first = String(p.name || '').split(' ')[0];
    var h = App.header('', ath.coach && ath.coach.name ? t('Coached by {n}', { n: ath.coach.name }) : '');
    h += '<p class="kicker">' + esc(new Date().toLocaleDateString(S.lang, { weekday: 'long', day: 'numeric', month: 'long' })) + '</p><h1 class="h1">' + esc(first ? t('Hi {n}', { n: first }) : t('Today')) + '</h1>';
    if (S.verse) { var v = App.verse(); h += '<div class="verse"><span>' + I.cross + '</span><p>“' + esc(v[1]) + '” <b>' + esc(v[0]) + '</b></p></div>'; }
    // workout hero
    if (!plan) h += '<div class="hero"><p class="kicker">' + esc(t('Training')) + '</p><h2 class="h2">' + esc(t('No training plan yet')) + '</h2><p class="small muted">' + esc(t('Pick a template — you can tweak every exercise.')) + '</p><a class="btn primary" href="#/train">' + esc(t('Choose a plan')) + '</a></div>';
    else {
      var doneToday = ath.sessions.some(function (s) { return s.date === App.today() && s.type !== 'sport'; });
      var rest = day.type === 'rest' || day.type === 'active';
      h += '<div class="hero' + (rest ? ' rest' : '') + '"><div class="row between"><p class="kicker" style="margin:0">' + esc(t('Week {w}', { w: wk })) + (App.isDeload(plan) ? ' · ' + esc(t('Deload')) : '') + '</p>' + (doneToday ? '<span class="pill good">' + I.check + esc(t('Done')) + '</span>' : '') + '</div>' +
        '<h2 class="h2" style="margin-top:6px">' + esc(t(day.title)) + '</h2><p class="small muted">' + esc(t(day.focus || '')) + (day.items.length ? ' · ' + day.items.length + ' ' + esc(t('exercises')) : '') + '</p>' +
        (day.items.length ? '<button class="btn primary lg block" data-act="start-workout" data-day="' + App.dayIndex() + '">' + I.play + esc(doneToday ? t('Train again') : t('Start workout')) + '</button>' : '') + '</div>';
    }
    // nutrition
    h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Nutrition')) + '</h2><a class="link-btn" href="#/food">' + esc(t('Open')) + '</a></div>' +
      '<div class="card"><div class="row" style="gap:16px">' + '<div style="width:118px;flex:none">' + App.ring(tot.kcal, T.kcal, String(Math.max(0, T.kcal - tot.kcal)), t('kcal left')) + '</div><div class="grow">' + App.macroBars(tot, T) + '</div></div>' +
      '<div class="grid3" style="margin-top:12px"><button class="btn sm" data-act="food-add">' + I.search + esc(t('Search')) + '</button><button class="btn sm" data-act="scan">' + I.barcode + esc(t('Scan')) + '</button><button class="btn sm" data-act="photo">' + I.camera + esc(t('Photo')) + '</button></div><button class="btn sm primary block" data-act="food-text" style="margin-top:8px">✍️ ' + esc(t('What did you eat?')) + '</button></div></div>';
    // health
    var hd0 = App.healthDay && App.healthDay();
    h += '<div class="section"><a class="card tap row health-today" href="#/health"><div class="ex-icon">' + I.heart + '</div><div class="grow"><b>' + (hd0 && hd0.steps != null ? Math.round(hd0.steps).toLocaleString(S.lang) + ' ' + esc(t('steps')) : esc(t('Garmin / Apple Health'))) + '</b><div class="tiny muted">' + (hd0 ? [hd0.rhr ? hd0.rhr + ' bpm ' + esc(t('resting HR')) : '', hd0.kcal != null ? hd0.kcal + ' kcal ' + esc(t('active')) : ''].filter(Boolean).join(' · ') || esc(t('Synced')) : esc(t('Connect')) + ' →') + '</div>' + (hd0 && hd0.steps != null ? '<div class="bar-track" style="margin-top:6px"><div class="bar-fill" style="width:' + Math.min(100, hd0.steps / 80) + '%"></div></div>' : '') + '</div><span class="chev">›</span></a></div>';
    // habits
    h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Daily habits')) + '</h2><span class="pill accent">' + I.fire + streak + ' ' + esc(t('day streak')) + '</span></div><div class="habits">' + App.habitList(ath).map(function (x) {
      var hd = App.healthDay && App.healthDay(), on = (ath.habits[App.today()] || {})[x[0]] || (x[0] === 'steps' && hd && hd.steps >= 8000);
      return '<button class="habit' + (on ? ' on' : '') + '" data-act="habit" data-k="' + x[0] + '" aria-pressed="' + !!on + '"><span class="hc">' + (on ? I.check : '') + '</span>' + esc(t(x[1])) + '</button>'; }).join('') + '</div></div>';
    // check-in
    h += '<div class="section"><div class="card row"><div class="grow"><b>' + esc(t('Weekly check-in')) + '</b><div class="small muted">' + esc(ath.checkins.length ? t('Last sent') + ': ' + App.ago(ath.checkins[ath.checkins.length - 1]) : t('Send your progress to your coach')) + '</div></div><button class="btn primary sm" data-act="checkin">' + I.share + esc(t('Send')) + '</button></div></div>';
    return h;
  };
  App.habitList = function (ath) {
    var T = App.athTargets(ath);
    var L = [['water', 'Water 2 L+'], ['steps', '8,000+ steps'], ['sleep', '7h+ sleep'], ['protein', 'Protein {p} g', T.p], ['veg', '2 portions of veg']];
    if (S.faithHabit) L.push(['quiet', 'Quiet time / prayer']);
    return L.map(function (x) { return [x[0], x[2] ? t(x[1]).replace('{p}', x[2]) : x[1]]; });
  };
  A.habit = function (el) { var d = App.today(), h = me().habits[d] = me().habits[d] || {}; h[el.dataset.k] = !h[el.dataset.k]; App.save(); App.rerender(); };

  // ---------------- Check-in (client → coach) ----------------
  App.buildCheckin = function (ath, note, feel) {
    var from = App.isoAdd(App.today(), -13), ad = App.adherence(ath, 7), days = [];
    for (var i = 13; i >= 0; i--) { var iso = App.isoAdd(App.today(), -i), fe = ath.food[iso] || []; if (fe.length) { var x = App.dayTotals(fe); days.push([iso, x.kcal, x.p, x.c, x.f]); } }
    return { t: 'checkin', v: 2, cid: ath.cid || ('self-' + F.uid()), name: (ath.profile && ath.profile.name) || 'Client', at: new Date().toISOString(), from: from,
      note: note || '', feel: feel || 0, profile: ath.profile,
      body: ath.body.slice(-12).map(function (b) { return [b.date, b.weight || null, b.waist || null]; }),
      workouts: ath.sessions.filter(function (s) { return s.date >= from; }).map(function (s) { return [s.date, s.title, App.doneSetsCount(s), Math.round(s.dur / 60), (s.prs || []).length]; }),
      food: days, habits: Object.keys(ath.habits).filter(function (d) { return d >= from; }).map(function (d) { var h = ath.habits[d]; return [d, Object.keys(h).filter(function (k) { return h[k]; }).length]; }),
      health: Object.keys((ath.health && ath.health.days) || {}).filter(function (d) { return d >= from; }).sort().map(function (d) { var x = App.healthDay(d) || {}; return [d, x.steps == null ? null : Math.round(x.steps), x.rhr || null, x.kcal == null ? null : Math.round(x.kcal)]; }),
      adh: { train: ad.train, food: ad.food, overall: ad.overall, done: ad.done, planned: ad.planned, logged: ad.logged }, streak: App.streak(ath) };
  };
  App.doneSetsCount = function (s) { return s.items.reduce(function (a, it) { return a + App.doneSets(it).length; }, 0); };
  A.checkin = function () {
    var ath = me();
    var s = App.sheet(App.sheetHead(t('Weekly check-in'), t('Your coach gets your weight, workouts, food totals and habits of the last 2 weeks.')) +
      '<label class="field"><span class="label">' + esc(t('How did this week feel?')) + '</span><div class="seg" id="feel">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-v="' + n + '"' + (n === 4 ? ' class="on"' : '') + '>' + ['😣', '😕', '🙂', '😀', '🔥'][n - 1] + '</button>'; }).join('') + '</div></label>' +
      '<label class="field"><span class="label">' + esc(t('Message to your coach')) + ' <span class="opt">' + esc(t('optional')) + '</span></span><textarea class="input" id="ci-note" placeholder="' + esc(t('Wins, struggles, questions…')) + '"></textarea></label>' +
      '<button class="btn primary lg block" id="ci-go">' + I.share + esc(t('Create check-in')) + '</button>');
    var feel = 4;
    s.el.querySelectorAll('#feel button').forEach(function (b) { b.onclick = function () { feel = +b.dataset.v; s.el.querySelectorAll('#feel button').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    s.el.querySelector('#ci-go').onclick = function () {
      var obj = App.buildCheckin(ath, s.el.querySelector('#ci-note').value.trim(), feel);
      ath.checkins.push(obj.at); App.save(); s.close();
      var c = ath.coach || S.coach;
      var w = ath.body.length ? ath.body[ath.body.length - 1].weight : '';
      var text = t('Check-in from {n}', { n: obj.name }) + ' — ' + (w ? w + ' kg · ' : '') + t('training') + ' ' + App.pct(obj.adh.train) + ' · ' + t('nutrition') + ' ' + App.pct(obj.adh.food) + (obj.note ? '\n“' + obj.note + '”' : '') + '\n' + t('Open in Forged by Grace:');
      App.shareSheet(t('Send to your coach'), t('Tap WhatsApp or Email — your coach opens the link and sees everything.'), obj, { text: text, phone: c.whatsapp, email: c.email, subject: 'Check-in · ' + obj.name, filename: 'checkin-' + F.slug(obj.name) });
      App.rerender();
    };
  };

  // ---------------- Food ----------------
  App.foodDate = App.today();
  App.MEALS = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snack', 'Snacks']];
  App.mealNow = function () { var h = new Date().getHours(); return h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 17 ? 'snack' : h < 21 ? 'dinner' : 'snack'; };
  V.food = function () {
    var ath = me(), iso = App.foodDate, entries = App.foodDay(ath, iso), T = App.athTargets(ath), tot = App.dayTotals(entries);
    var h = App.header(t('Food'));
    h += '<div class="row between date-nav"><button class="icon-btn" data-act="food-day" data-d="-1" aria-label="prev">' + I.back + '</button><b>' + esc(iso === App.today() ? t('Today') : F.fmtDay(iso)) + '</b><button class="icon-btn flip" data-act="food-day" data-d="1" aria-label="next"' + (iso >= App.today() ? ' disabled' : '') + '>' + I.back + '</button></div>';
    h += '<div class="card"><div class="row" style="gap:16px"><div style="width:118px;flex:none">' + App.ring(tot.kcal, T.kcal, String(tot.kcal), '/ ' + T.kcal + ' kcal') + '</div><div class="grow">' + App.macroBars(tot, T) + '</div></div></div>';
    h += '<div class="grid3 add-row"><button class="btn" data-act="food-add">' + I.search + esc(t('Search')) + '</button><button class="btn" data-act="scan">' + I.barcode + esc(t('Barcode')) + '</button><button class="btn" data-act="photo">' + I.camera + esc(t('AI photo')) + '</button></div>';
    h += '<div class="grid2" style="margin-top:8px"><button class="btn primary" data-act="food-text">✍️ ' + esc(t('What did you eat?')) + '</button><button class="btn" data-act="food-shot">🧾 ' + esc(t('Order screenshot')) + '</button></div>';
    App.MEALS.forEach(function (m) {
      var list = entries.filter(function (e) { return e.meal === m[0]; }), mt = App.dayTotals(list);
      h += '<div class="section meal-sec"><div class="section-head"><h3 class="h3">' + esc(t(m[1])) + '</h3><span class="small muted">' + mt.kcal + ' kcal</span></div>';
      if (list.length) h += '<div class="list">' + list.map(function (e) {
        return '<div class="list-item tap" data-act="food-edit" data-id="' + e.id + '" role="button" style="cursor:pointer">' + (e.photo ? '<img class="thumb" src="' + esc(e.photo) + '" alt="">' : '<div class="ex-icon">' + (e.src === 'scan' ? I.barcode : e.src === 'screenshot' ? '🧾' : e.src === 'photo' ? I.camera : I.food) + '</div>') +
          '<div class="grow"><div class="ell"><b>' + esc(e.name) + '</b>' + (e.est ? ' <span class="pill warn">' + esc(t('estimate')) + '</span>' : '') + '</div><div class="tiny muted">' + e.g + ' g · ' + Math.round(e.kcal) + ' kcal · P ' + Math.round(e.p) + ' C ' + Math.round(e.c) + ' F ' + Math.round(e.f) + '</div></div>' +
          '<button class="icon-btn" data-act="food-del" data-id="' + e.id + '" aria-label="' + esc(t('Remove')) + '">' + I.trash + '</button></div>'; }).join('') + '</div>';
      // planned meal quick-log
      var pm = ath.meal && App.planMealFor(ath.meal, m[0]);
      if (pm && !list.length) h += '<button class="card tap planned" data-act="log-planned" data-k="' + m[0] + '"><div class="row"><div class="grow"><div class="tiny kicker" style="margin:0">' + esc(t('From your meal plan')) + '</div><div class="small">' + esc(pm.items.map(function (it) { return it.g + 'g ' + App.foodName(App.findFood(it.food)); }).join(' · ')) + '</div></div><span class="pill accent">' + I.check + esc(t('Eaten')) + '</span></div></button>';
      else if (!list.length) h += '<p class="tiny muted">' + esc(t('Nothing logged yet.')) + '</p>';
      h += '</div>';
    });
    // week chart
    var bars = [], sumP = 0, n = 0;
    for (var i = 6; i >= 0; i--) { var d = App.isoAdd(App.today(), -i), x = App.dayTotals(ath.food[d] || []); bars.push({ l: F.parseISO(d).toLocaleDateString(S.lang, { weekday: 'narrow' }), v: x.kcal, hi: d === iso }); if (x.kcal) { sumP += x.p; n++; } }
    h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('This week')) + '</h2><span class="small muted">' + esc(t('avg protein')) + ' ' + (n ? Math.round(sumP / n) : 0) + ' g</span></div><div class="card">' + App.barChart(bars, T.kcal) + '<p class="tiny muted" style="margin:6px 0 0">' + esc(t('Green line = your daily calorie target.')) + '</p></div></div>';
    h += '<div class="section"><div class="grid2"><a class="btn" href="#/meal/me">' + I.plans + esc(t('My meal plan')) + '</a><button class="btn" data-act="custom-food">' + I.plus + esc(t('Custom food')) + '</button></div></div>';
    return h;
  };
  App.planMealFor = function (meal, key) {
    var map = { breakfast: ['breakfast'], lunch: ['lunch'], dinner: ['dinner'], snack: ['snack1', 'snack2'] };
    var ms = meal.meals.filter(function (m) { return map[key].indexOf(m.key) !== -1 || (!m.key && key === 'snack'); });
    if (!ms.length) return null;
    return { items: ms.reduce(function (a, m) { return a.concat(m.items); }, []) };
  };
  A['food-day'] = function (el) { App.foodDate = App.isoAdd(App.foodDate, +el.dataset.d); if (App.foodDate > App.today()) App.foodDate = App.today(); App.rerender(); };
  A['food-del'] = function (el) { var iso = App.foodDate; me().food[iso] = (me().food[iso] || []).filter(function (e) { return e.id !== el.dataset.id; }); App.save(); App.rerender(); };
  A['log-planned'] = function (el) {
    var pm = App.planMealFor(me().meal, el.dataset.k);
    pm.items.forEach(function (it) { var fd = App.findFood(it.food); if (fd) App.logFood(fd, it.g, el.dataset.k, 'plan'); });
    App.toast(t('Logged as planned')); App.rerender();
  };
  App.logFood = function (fd, g, meal, src, extra) {
    var iso = location.hash.indexOf('#/food') === 0 ? App.foodDate : App.today();
    var x = App.macrosFor(fd, g), e = Object.assign({ id: F.uid(), fid: fd.id, name: App.foodName(fd), g: Math.round(g), meal: meal || App.mealNow(), src: src || 'db', at: Date.now() }, x, extra || {});
    (me().food[iso] = me().food[iso] || []).push(e);
    S.recentFoods = [fd.id].concat(S.recentFoods.filter(function (x) { return x !== fd.id; })).slice(0, 12);
    App.save(); return e;
  };
  // portion picker (shared by search, scan, photo)
  App.portionSheet = function (fd, opts) {
    opts = opts || {};
    var g = opts.g || fd.g || 100;
    var chips = [[fd.g, fd.portion || t('1 portion')]];
    if (fd.serving && fd.serving !== fd.g) chips.unshift([fd.serving, t('1 serving')]);
    [50, 100, 150, 200].forEach(function (x) { if (!chips.some(function (c) { return c[0] === x; })) chips.push([x, x + ' g']); });
    var s = App.sheet(App.sheetHead(App.foodName(fd), (fd.brand ? fd.brand + ' · ' : '') + fd.kcal + ' kcal · P ' + fd.p + ' · C ' + fd.c + ' · F ' + fd.f + ' ' + t('per 100 g')) +
      (opts.note ? '<p class="suggest">' + opts.note + '</p>' : '') +
      '<div class="chips" id="pchips">' + chips.map(function (c) { return '<button class="chip' + (c[0] === g ? ' on' : '') + '" data-g="' + c[0] + '">' + esc(c[1]) + (String(c[1]).indexOf(' g') === -1 ? ' · ' + c[0] + ' g' : '') + '</button>'; }).join('') + '</div>' +
      '<div class="grid2" style="margin-top:12px"><label class="field"><span class="label">' + esc(t('Amount (g)')) + '</span><input class="input" id="pg" inputmode="decimal" value="' + g + '"></label>' +
      '<label class="field"><span class="label">' + esc(t('Meal')) + '</span><select class="input" id="pm">' + App.MEALS.map(function (m) { return '<option value="' + m[0] + '"' + (m[0] === (opts.meal || App.mealNow()) ? ' selected' : '') + '>' + esc(t(m[1])) + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="card macro-prev" id="pprev"></div>' +
      '<button class="btn primary lg block" id="padd" style="margin-top:12px">' + I.plus + esc(opts.cta || t('Add to log')) + '</button>');
    var inp = s.el.querySelector('#pg');
    function upd() { var x = App.macrosFor(fd, App.num(inp.value)); s.el.querySelector('#pprev').innerHTML = '<div class="grid4"><div><b>' + x.kcal + '</b><span>kcal</span></div><div><b>' + x.p + '</b><span>' + esc(t('protein')) + '</span></div><div><b>' + x.c + '</b><span>' + esc(t('carbs')) + '</span></div><div><b>' + x.f + '</b><span>' + esc(t('fat')) + '</span></div></div>'; }
    s.el.querySelectorAll('#pchips .chip').forEach(function (b) { b.onclick = function () { inp.value = b.dataset.g; s.el.querySelectorAll('#pchips .chip').forEach(function (x) { x.classList.toggle('on', x === b); }); upd(); }; });
    inp.oninput = upd; upd();
    s.el.querySelector('#padd').onclick = function () {
      var gg = App.num(inp.value); if (!gg) return;
      if (opts.onPick) opts.onPick(gg, s.el.querySelector('#pm').value);
      else { App.logFood(fd, gg, s.el.querySelector('#pm').value, opts.src, opts.extra); App.toast(t('Added')); }
      App.closeSheets(); App.rerender();
    };
    return s;
  };
  App.foodSearchSheet = function (onPick, title) {
    var s = App.sheet(App.sheetHead(title || t('Add food')) +
      '<input class="input" id="fq" type="search" enterkeyhint="search" placeholder="' + esc(t('Search millions of foods & brands, e.g. kwark, AH pindakaas')) + '" autocomplete="off">' +
      '<div class="chips" id="fcats" style="margin:10px 0">' + Object.keys(FD.CATS).map(function (k) { return '<button class="chip sm" data-c="' + k + '">' + esc(t(FD.CATS[k])) + '</button>'; }).join('') + '</div>' +
      '<div id="fonl"></div><div class="list" id="fres"></div>');
    var cat = '', timer = null, searcher = null, onlineItems = [], onlineState = '', lastQ = '';
    function norm(x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    function hay(f) { return f._h || (f._h = norm(f.en + ' ' + f.nl + ' ' + (f.al || '') + ' ' + (f.brand || ''))); }
    function row(f, online) {
      return '<button class="list-item" data-fid="' + esc(f.id) + '"' + (online ? ' data-on="1"' : '') + '>' + (online && f.img ? '<img src="' + esc(f.img) + '" alt="" loading="lazy" class="offimg">' : '') + '<div class="grow"><div class="ell"><b>' + esc(App.foodName(f)) + '</b></div><div class="tiny muted ell">' + (f.brand ? esc(f.brand) + ' · ' : '') + (f.qty ? esc(f.qty) + ' · ' : '') + f.kcal + ' kcal · P ' + f.p + ' · C ' + f.c + ' · F ' + f.f + ' /100 g</div></div><span class="chev">›</span></button>';
    }
    function local(q) {
      var all = App.allFoods();
      if (!q && !cat) { var r = S.recentFoods.map(App.findFood).filter(Boolean); return r.length < 8 ? r.concat(all.slice(0, 12).filter(function (f) { return r.indexOf(f) === -1; })) : r; }
      var toks = q.split(/\s+/).filter(Boolean), out = [];
      all.forEach(function (f) {
        if (cat && f.cat !== cat) return; if (!toks.length) { out.push([0, f]); return; }
        var h = hay(f); for (var i = 0; i < toks.length; i++) if (h.indexOf(toks[i]) === -1) return;
        var nm = norm(App.foodName(f)), sc = (nm.indexOf(q) === 0 ? 0 : (' ' + nm).indexOf(' ' + toks[0]) !== -1 ? 10 : 20) + (f.x ? 5 : 0) + nm.length / 40;
        out.push([sc, f]);
      });
      return out.sort(function (a, b) { return a[0] - b[0]; }).map(function (x) { return x[1]; });
    }
    function renderOnline() {
      var el = s.el.querySelector('#fonl'), q = s.el.querySelector('#fq').value.trim();
      if (q.length < 2) { el.innerHTML = ''; return; }
      var h = '<div class="offbox"><div class="row"><b class="grow">' + I.search + ' ' + esc(t('Open Food Facts — millions of products')) + '</b>' + (onlineState === 'loading' ? '<span class="spin"></span>' : '') + '</div>';
      if (onlineState === 'idle') h += '<button class="btn sm primary block" id="fgo">' + esc(t('Search online for “{q}”', { q: q })) + '</button>';
      if (onlineItems.length) h += '<div class="list">' + onlineItems.map(function (f) { return row(f, true); }).join('') + '</div>';
      if (onlineState === 'more') h += '<button class="btn sm block" id="fmore">' + esc(t('Load more')) + (searcher && searcher.nextStage ? ' · ' + esc(t(searcher.nextStage)) : '') + '</button>';
      if (onlineState === 'none') h += '<p class="tiny muted">' + esc(t('Nothing online either. Try a shorter word or the brand name.')) + '</p>';
      if (onlineState === 'end') h += '<p class="tiny muted">' + esc(t('That is everything Open Food Facts has.')) + '</p>';
      if (onlineState && onlineState.indexOf('err:') === 0) h += '<p class="tiny" style="color:var(--warn)">' + esc(onlineState.slice(4)) + '</p><button class="btn sm block" id="fmore">' + esc(t('Try again')) + '</button>';
      h += '<p class="tiny muted">' + esc(t('Netherlands first, then Belgium, Germany, France and the rest of the world.')) + '</p></div>';
      el.innerHTML = h;
      var go = el.querySelector('#fgo'); if (go) go.onclick = function () { startOnline(true); };
      var m = el.querySelector('#fmore'); if (m) m.onclick = more;
    }
    function more() {
      if (!searcher) return; var q0 = searcher.query; onlineState = 'loading'; renderOnline();
      searcher.next().then(function (r) {
        if (!searcher || searcher.query !== q0) return;
        onlineItems = onlineItems.concat(r.items); searcher.nextStage = r.nextStage;
        onlineState = r.done ? (onlineItems.length ? 'end' : 'none') : 'more'; renderOnline();
      }).catch(function (e) { if (searcher && searcher.query === q0) { onlineState = 'err:' + ((e && e.message) || t('Open Food Facts is not reachable right now.')); renderOnline(); } });
    }
    function startOnline(force) {
      var q = s.el.querySelector('#fq').value.trim();
      if (q.length < 2 || (!force && q === lastQ)) return; lastQ = q;
      searcher = App.offSearcher(q); onlineItems = []; more();
    }
    function render() {
      var q = norm(s.el.querySelector('#fq').value.trim()), res = local(q);
      s.el.querySelector('#fres').innerHTML = (q ? '<h3 class="h3 tiny muted" style="margin:10px 0 4px">' + esc(t('In the app')) + ' · ' + res.length + '</h3>' : '') + (res.slice(0, q ? 25 : 40).map(function (f) { return row(f); }).join('') || '<p class="small muted" style="padding:14px">' + esc(t('No match in the app — see the online results above, or add a custom food.')) + '</p>');
      clearTimeout(timer);
      if (q.length >= 3) { onlineState = onlineState === 'loading' ? 'loading' : (s.el.querySelector('#fq').value.trim() === lastQ ? onlineState : 'idle'); timer = setTimeout(function () { startOnline(false); }, 900); }
      else { searcher = null; onlineItems = []; onlineState = q.length >= 2 ? 'idle' : ''; lastQ = ''; }
      renderOnline();
    }
    var fq = s.el.querySelector('#fq');
    fq.oninput = render;
    fq.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); startOnline(true); fq.blur(); } };
    s.el.querySelectorAll('#fcats .chip').forEach(function (b) { b.onclick = function () { cat = cat === b.dataset.c ? '' : b.dataset.c; s.el.querySelectorAll('#fcats .chip').forEach(function (x) { x.classList.toggle('on', x.dataset.c === cat); }); render(); }; });
    s.el.onclick = function (e) {
      var b = e.target.closest('[data-fid]'); if (!b) return;
      var fd = b.dataset.on ? App.rememberOff(onlineItems.filter(function (f) { return f.id === b.dataset.fid; })[0]) : App.findFood(b.dataset.fid);
      if (!fd) return;
      if (onPick) { s.close(); onPick(fd); } else if (b.dataset.on) App.showProduct(fd); else App.portionSheet(fd);
    };
    if (App._prefillSearch) { fq.value = App._prefillSearch; App._prefillSearch = ''; render(); startOnline(true); } else render();
    setTimeout(function () { var q = s.el.querySelector('#fq'); if (q) q.focus(); }, 60);
    return s;
  };
  App.searchFoodsFor = function (q) { App._prefillSearch = q || ''; return App.foodSearchSheet(); };
  A['food-add'] = function () { App.foodSearchSheet(); };
  A['custom-food'] = function () { App.customFoodSheet(); };
  App.customFoodSheet = function (pre, done) {
    pre = pre || {};
    var s = App.sheet(App.sheetHead(t('Custom food'), t('Values per 100 g — copy them from the label.')) +
      '<form id="cf"><label class="field"><span class="label">' + esc(t('Name')) + '</span><input class="input" name="name" required value="' + esc(pre.name || '') + '"></label>' +
      '<div class="grid2">' + [['kcal', 'kcal'], ['p', t('Protein (g)')], ['c', t('Carbs (g)')], ['f', t('Fat (g)')]].map(function (x) { return '<label class="field"><span class="label">' + esc(x[1]) + '</span><input class="input" name="' + x[0] + '" inputmode="decimal" required value="' + esc(pre[x[0]] != null ? pre[x[0]] : '') + '"></label>'; }).join('') + '</div>' +
      '<label class="field"><span class="label">' + esc(t('Usual portion (g)')) + '</span><input class="input" name="g" inputmode="decimal" value="' + esc(pre.g || 100) + '"></label>' +
      '<button class="btn primary lg block">' + esc(t('Save food')) + '</button></form>');
    s.el.querySelector('#cf').onsubmit = function (e) {
      e.preventDefault(); var fd = new FormData(e.target);
      var f = { id: pre.id || 'c-' + F.uid(), en: String(fd.get('name')), nl: String(fd.get('name')), cat: pre.cat || 'custom', kcal: App.num(fd.get('kcal')), p: App.num(fd.get('p')), c: App.num(fd.get('c')), f: App.num(fd.get('f')), g: App.num(fd.get('g')) || 100, portion: t('1 portion') };
      if (pre.code) { f.code = pre.code; f.id = 'bc:' + pre.code; f.cat = 'scan'; S.barcodes[pre.code] = f; } else S.customFoods.push(f);
      App.save(); s.close(); if (done) done(f); else App.portionSheet(f);
    };
  };

  // ---------------- Train ----------------
  V.train = function () {
    var ath = me(), plan = ath.plan;
    var h = App.header(t('Train'));
    if (!plan) return h + App.templatePicker('me') + App.historyHtml(ath);
    var wk = App.planWeek(plan), ti = App.dayIndex();
    h += '<div class="card"><div class="row between"><div><p class="kicker" style="margin:0">' + esc(t('Week {w} of {n}', { w: Math.min(wk, plan.weeks), n: plan.weeks })) + '</p><h2 class="h2" style="margin:4px 0 0">' + esc(plan.name) + '</h2></div><a class="btn sm" href="#/plan/me">' + I.edit + esc(t('Edit')) + '</a></div>' +
      '<p class="tiny muted" style="margin:8px 0 0">' + esc(t(App.PROGRESSIONS[plan.progression] || '')) + '</p></div>';
    var dates = {}; ath.sessions.forEach(function (s) { dates[s.date] = 1; });
    var mon = App.addDays(new Date(), -ti);
    h += '<div class="week-strip" style="margin-top:14px">' + plan.days.map(function (d, i) {
      var iso = F.isoDate(App.addDays(mon, i));
      return '<button class="wd ' + d.type + (i === ti ? ' today' : '') + (dates[iso] ? ' done' : '') + '" data-act="day-sheet" data-i="' + i + '"><div class="d">' + esc(App.addDays(mon, i).toLocaleDateString(S.lang, { weekday: 'short' })) + '</div><div class="m">' + (dates[iso] ? '✓' : App.addDays(mon, i).getDate()) + '</div><div class="t">' + esc(d.type === 'rest' ? t('REST') : d.type === 'active' ? t('WALK') : (t(d.title).split(' ').pop() || '').slice(0, 5).toUpperCase()) + '</div></button>'; }).join('') + '</div>';
    h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('This week')) + '</h2></div><div class="list">' + plan.days.map(function (d, i) {
      if (d.type === 'rest') return '';
      return '<button class="list-item" data-act="day-sheet" data-i="' + i + '"><div class="ex-icon">' + esc(App.addDays(mon, i).toLocaleDateString(S.lang, { weekday: 'short' }).slice(0, 3).toUpperCase()) + '</div><div class="grow"><b>' + esc(t(d.title)) + '</b><div class="tiny muted">' + esc(t(d.focus || '')) + ' · ' + d.items.length + ' ' + esc(t('exercises')) + '</div></div><span class="chev">›</span></button>'; }).join('') + '</div></div>';
    // PRs
    var prs = App.prList(ath);
    h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Personal records')) + '</h2></div>' + (prs.length ? '<div class="list">' + prs.slice(0, 8).map(function (p) { return '<div class="list-item"><div class="ex-icon">' + I.trophy + '</div><div class="grow"><b>' + esc(p.name) + '</b><div class="tiny muted">' + esc(F.fmtDay(p.date)) + '</div></div><b>' + p.w + ' kg × ' + p.r + '</b></div>'; }).join('') + '</div>' : '<p class="small muted">' + esc(t('Finish a workout and your best lifts show up here.')) + '</p>') + '</div>';
    h += '<div class="section"><div class="grid2"><button class="btn" data-act="ex-library">' + I.search + esc(t('Exercise library')) + '</button><button class="btn" data-act="change-plan" data-o="me">' + I.plans + esc(t('Change plan')) + '</button></div></div>';
    if (ath.sessions.length) h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('History')) + '</h2></div><div class="list">' + ath.sessions.slice(-6).reverse().map(function (s) { return '<div class="list-item"><div class="grow"><b>' + esc(t(s.title)) + '</b><div class="tiny muted">' + esc(F.fmtDay(s.date)) + ' · ' + Math.round(s.dur / 60) + ' min · ' + (s.ext ? [s.ext.dist ? s.ext.dist + ' km' : '', s.ext.kcal ? s.ext.kcal + ' kcal' : '', s.ext.hr ? s.ext.hr + ' bpm' : '', s.ext.src].filter(Boolean).join(' / ') : App.doneSetsCount(s) + ' ' + esc(t('sets'))) + '</div></div>' + ((s.prs || []).length ? '<span class="pill accent">' + I.trophy + s.prs.length + ' PR</span>' : '') + '</div>'; }).join('') + '</div></div>';
    return h;
  };
  App.historyHtml = function (ath) {
    if (!ath.sessions.length) return '';
    return '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('History')) + '</h2></div><div class="list">' + ath.sessions.slice(-8).reverse().map(function (s) { return '<div class="list-item"><div class="grow"><b>' + esc(t(s.title)) + '</b><div class="tiny muted">' + esc(F.fmtDay(s.date)) + ' · ' + Math.round(s.dur / 60) + ' min · ' + (s.ext ? [s.ext.dist ? s.ext.dist + ' km' : '', s.ext.kcal ? s.ext.kcal + ' kcal' : '', s.ext.hr ? s.ext.hr + ' bpm' : '', s.ext.src].filter(Boolean).join(' · ') : App.doneSetsCount(s) + ' ' + esc(t('sets'))) + '</div></div>' + ((s.prs || []).length ? '<span class="pill accent">' + I.trophy + s.prs.length + ' PR</span>' : '') + '</div>'; }).join('') + '</div></div>';
  };
  App.prList = function (ath) {
    var best = {};
    ath.sessions.forEach(function (s) { s.items.forEach(function (it) { var ex = D.BY_ID[it.ex]; if (!ex || ex.track !== 'weight') return;
      App.doneSets(it).forEach(function (st) { var v = App.e1rm(App.num(st.w), App.num(st.r)); if (v && (!best[it.ex] || v > best[it.ex].v)) best[it.ex] = { v: v, w: st.w, r: st.r, date: s.date, name: ex.name }; }); }); });
    return Object.keys(best).map(function (k) { return best[k]; }).sort(function (a, b) { return b.v - a.v; });
  };
  App.templatePicker = function (oid) {
    return '<p class="muted">' + esc(t('Pick a template. Every exercise, set and rep can be changed afterwards.')) + '</p><div class="tpl-grid">' + Object.keys(App.TEMPLATES).map(function (k) {
      var tp = App.TEMPLATES[k];
      return '<button class="card tap tpl" data-act="use-tpl" data-k="' + k + '" data-o="' + oid + '"><div class="row between"><b>' + esc(t(tp.name)) + '</b><span class="pill">' + esc(t(App.LEVELS[tp.level])) + '</span></div><p class="small muted" style="margin:6px 0 0">' + esc(t(tp.desc)) + '</p></button>'; }).join('') + '</div>';
  };
  A['use-tpl'] = function (el) {
    var o = App.owner(el.dataset.o), p = (o && o.profile) || {};
    var tp = App.TEMPLATES[el.dataset.k];
    var plan = App.generatePlan(el.dataset.k, { mode: tp.mode === 'gym' ? (p.mode || 'gym') : tp.mode, level: tp.level === 'intermediate' ? (p.level || tp.level) : tp.level });
    o.plan = plan; App.save(); App.closeSheets(); App.toast(t('Plan ready: {n}', { n: t(plan.name) }));
    App.go('plan/' + el.dataset.o);
  };
  A['change-plan'] = function (el) { App.sheet(App.sheetHead(t('Choose a plan')) + App.templatePicker(el.dataset.o)); };
  A['day-sheet'] = function (el) {
    var i = +el.dataset.i, d = App.dayOf(me().plan, i);
    App.sheet(App.sheetHead(t(d.title), t(d.focus || '')) + (d.items.length ? '<div class="list">' + d.items.map(function (it) { var ex = D.BY_ID[it.ex]; return '<div class="list-item"><div class="grow"><b>' + esc(ex ? ex.name : it.ex) + '</b><div class="tiny muted">' + it.sets + ' × ' + esc(it.reps) + (ex && ex.track === 'time' ? ' s' : ex && ex.track === 'min' ? ' min' : '') + ' · ' + esc(t('rest')) + ' ' + it.rest + 's · RPE ' + it.rpe + (it.note ? '<br>📝 ' + esc(it.note) : '') + '</div></div><button class="icon-btn" data-act="ex-demo" data-ex="' + it.ex + '" aria-label="Uitleg">?</button></div>'; }).join('') + '</div><button class="btn primary lg block" style="margin-top:14px" data-act="start-workout" data-day="' + i + '">' + I.play + esc(t('Start workout')) + '</button>' : '<p class="muted">' + esc(t('Rest, walk, sleep, eat your protein.')) + '</p>'));
  };
  A['ex-library'] = function () { App.exercisePicker(null); };
  App.exercisePicker = function (onPick) {
    var s = App.sheet(App.sheetHead(t('Exercise library'), D.EXERCISES.length + ' ' + t('exercises with coaching cues')) + '<input class="input" id="exq" type="search" placeholder="' + esc(t('Search exercise or muscle')) + '"><div class="list" id="exres" style="margin-top:10px"></div>');
    function render() {
      var q = s.el.querySelector('#exq').value.toLowerCase();
      s.el.querySelector('#exres').innerHTML = D.EXERCISES.filter(function (e) { return !q || (e.name + ' ' + e.muscle + ' ' + e.equip.join(' ')).toLowerCase().indexOf(q) !== -1; }).map(function (e) {
        return '<button class="list-item" data-id="' + e.id + '"><div class="grow"><b>' + esc(e.name) + '</b><div class="tiny muted">' + esc(e.muscle) + ' · ' + esc(e.equip.join(', ')) + '</div></div><span class="chev">' + (onPick ? '+' : '›') + '</span></button>'; }).join('');
    }
    s.el.querySelector('#exq').oninput = render; render();
    s.el.querySelector('#exres').onclick = function (e) {
      var b = e.target.closest('[data-id]'); if (!b) return; var ex = D.BY_ID[b.dataset.id];
      if (onPick) { s.close(); onPick(ex); return; }
      App.exDemo(ex);
    };
  };

  // ---------------- Workout logger ----------------
  var W = null, restT = null;
  App.getW = function () { return W; };
  A['start-workout'] = function (el) {
    App.closeSheets();
    var ath = me(), i = +el.dataset.day, d = App.dayOf(ath.plan, i);
    W = { id: F.uid(), date: App.today(), day: i, title: d.title, type: d.type, startedAt: Date.now(), items: d.items.map(function (it, pi) {
      var sug = App.suggest(ath, it, ath.plan), last = App.lastFor(ath, it.ex), ex = D.BY_ID[it.ex] || {};
      var reps = parseInt(String(it.reps).split('-')[0], 10) || 10;
      return { ex: it.ex, pi: pi, target: it, sug: sug, sets: Array.from({ length: it.sets }, function (_, k) {
        var ls = last && last.sets[k];
        return { w: sug ? sug.w : (ls ? ls.w : ''), r: ex.track === 'weight' || ex.track === 'reps' ? '' : reps, ph: ls ? ls.r : reps, done: false }; }) };
    }) };
    App.renderLogger();
  };
  App.renderLogger = function () {
    var sc = document.getElementById('logger');
    if (!sc) { sc = document.createElement('div'); sc.id = 'logger'; sc.className = 'screen'; document.body.appendChild(sc); }
    var done = W.items.reduce(function (a, it) { return a + it.sets.filter(function (s) { return s.done; }).length; }, 0), all = W.items.reduce(function (a, it) { return a + it.sets.length; }, 0);
    sc.innerHTML = '<div class="log-head"><div class="app row between"><button class="btn sm ghost" data-act="w-cancel">' + esc(t('Cancel')) + '</button><div class="center"><b>' + esc(t(W.title)) + '</b><div class="timer" id="wclock">0:00</div></div><button class="btn sm primary" data-act="w-finish">' + esc(t('Finish')) + '</button></div><div class="progress" style="margin:0"><div style="width:' + (all ? done / all * 100 : 0) + '%"></div></div></div><div class="app">' +
      W.items.map(function (it, ii) {
        var ex = D.BY_ID[it.ex] || { name: it.ex, track: 'weight' }, tw = ex.track === 'weight', unit = ex.track === 'time' ? 's' : ex.track === 'min' ? 'min' : t('reps');
        var complete = it.sets.every(function (s) { return s.done; });
        return '<div class="ex-card' + (complete ? ' complete' : '') + '"><div class="row between"><div><b>' + esc(ex.name) + '</b><div class="tiny muted">' + it.target.sets + ' × ' + esc(it.target.reps) + ' ' + esc(unit) + ' · RPE ' + it.target.rpe + ' · ' + esc(t('rest')) + ' ' + it.target.rest + 's</div></div><div class="row" style="gap:6px"><button class="btn sm" data-act="w-swap" data-i="' + ii + '">🔄 ' + esc(t('Swap exercise')) + '</button><button class="icon-btn" data-act="w-info" data-ex="' + it.ex + '" aria-label="info">?</button></div></div>' +
          (it.target && it.target.note ? '<div class="tiny" style="color:var(--accent);margin-top:4px">📝 ' + esc(it.target.note) + '</div>' : '') +
          (it.sug ? '<div class="suggest">' + esc(t('Try')) + ' <b>' + it.sug.w + ' kg</b> — ' + esc(it.sug.why) + '</div>' : '') +
          '<div class="set-head' + (tw ? '' : ' two') + '"><span>' + esc(t('Set')) + '</span>' + (tw ? '<span>kg</span>' : '') + '<span>' + esc(unit) + '</span>' + (tw ? '<span>' + esc(t('Last')) + '</span>' : '') + '<span></span><span></span></div>' +
          it.sets.map(function (s, si) {
            return '<div class="set-row' + (tw ? '' : ' two') + (s.done ? ' done' : '') + '"><span class="n">' + (si + 1) + '</span>' + (tw ? '<input inputmode="decimal" aria-label="kg" data-w="' + ii + ':' + si + '" value="' + esc(s.w) + '">' : '') + '<input inputmode="numeric" aria-label="' + esc(unit) + '" data-r="' + ii + ':' + si + '" value="' + esc(s.r) + '" placeholder="' + esc(s.ph) + '">' + (tw ? '<span class="prev">' + esc(s.ph || '—') + '</span>' : '') + '<button class="tick" data-act="w-tick" data-k="' + ii + ':' + si + '" aria-label="' + esc(t('Done')) + '">' + I.check + '</button><button class="icon-btn set-del" data-act="w-delset" data-k="' + ii + ':' + si + '" aria-label="' + esc(t('Remove set')) + '">' + I.trash + '</button></div>'; }).join('') +
          '<button class="link-btn" data-act="w-addset" data-i="' + ii + '">+ ' + esc(t('Add set')) + '</button></div>';
      }).join('') + '<button class="btn block" style="margin-top:14px" data-act="w-addex">' + I.plus + esc(t('Add exercise')) + '</button></div>';
    sc.oninput = function (e) {
      var k = e.target.dataset.w || e.target.dataset.r; if (!k) return; var p = k.split(':'), st = W.items[+p[0]].sets[+p[1]];
      if (e.target.dataset.w) st.w = e.target.value; else st.r = e.target.value;
    };
    clearInterval(App._clock);
    App._clock = setInterval(function () { var c = document.getElementById('wclock'); if (!c || !W) return clearInterval(App._clock); var s = Math.round((Date.now() - W.startedAt) / 1000); c.textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }, 1000);
  };
  A['w-tick'] = function (el) {
    var p = el.dataset.k.split(':'), it = W.items[+p[0]], st = it.sets[+p[1]];
    if (!st.done && !st.r) st.r = st.ph || '';
    st.done = !st.done; App.renderLogger();
    if (st.done && it.target.rest) App.restTimer(it.target.rest);
  };
  A['w-addset'] = function (el) { var it = W.items[+el.dataset.i], l = it.sets[it.sets.length - 1] || {}; it.sets.push({ w: l.w || '', r: '', ph: l.r || l.ph || '', done: false }); App.renderLogger(); };
  A['w-addex'] = function () { App.exercisePicker(function (ex) { W.items.push({ ex: ex.id, target: { sets: 3, reps: '10', rest: 90, rpe: 8 }, sets: [0, 1, 2].map(function () { return { w: '', r: '', ph: '10', done: false }; }) }); App.renderLogger(); }); };
  A['w-info'] = function (el) { var ex = D.BY_ID[el.dataset.ex]; if (ex) App.sheet(App.sheetHead(ex.name, ex.muscle) + '<ol class="plain-list">' + ex.cues.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ol><p class="suggest">' + esc(t('Common mistake')) + ': ' + esc(ex.mistake) + '</p>'); };
  A['w-cancel'] = function () { App.confirm(t('Discard workout?'), t('Sets you logged in this session will be lost.'), t('Discard'), true).then(function (ok) { if (ok) App.closeLogger(); }); };
  App.closeLogger = function () { W = null; clearInterval(App._clock); App.stopRest(); var sc = document.getElementById('logger'); if (sc) sc.remove(); App.rerender(); };
  A['w-finish'] = function () {
    var ath = me();
    var sess = { id: W.id, date: W.date, title: W.title, type: W.type, dur: Math.round((Date.now() - W.startedAt) / 1000), endedAt: Date.now(),
      items: W.items.filter(function (it) { return it.sets.length; }).map(function (it) { return { ex: it.ex, sets: it.sets.map(function (s) { return { w: App.num(s.w), r: App.num(s.r), done: s.done }; }) }; }) };
    var prs = [];
    sess.items.forEach(function (it) {
      var ex = D.BY_ID[it.ex]; if (!ex || ex.track !== 'weight') return;
      var prev = App.bestFor(ath, it.ex);
      App.doneSets(it).forEach(function (st) { var v = App.e1rm(st.w, st.r); if (prev && v > prev.v && prs.indexOf(ex.name) === -1) prs.push(ex.name); });
    });
    sess.prs = prs; ath.sessions.push(sess); App.save();
    var vol = sess.items.reduce(function (a, it) { return a + App.doneSets(it).reduce(function (b, s) { return b + s.w * s.r; }, 0); }, 0);
    App.closeLogger();
    App.sheet('<div class="center"><div class="success-ring">' + I.check + '</div><h2 class="h2">' + esc(t('Workout done')) + '</h2><p class="muted">' + Math.round(sess.dur / 60) + ' min · ' + App.doneSetsCount(sess) + ' ' + esc(t('sets')) + ' · ' + Math.round(vol) + ' kg ' + esc(t('volume')) + '</p>' +
      (prs.length ? '<p class="pill accent">' + I.trophy + esc(t('New PR')) + ': ' + esc(prs.join(', ')) + '</p>' : '') + '<p class="small muted" style="margin-top:12px">“' + esc(App.verse()[1]) + '”</p><button class="btn primary block" data-close>' + esc(t('Amen, done')) + '</button></div>');
  };
  App.restTimer = function (sec) {
    App.stopRest();
    var bar = document.createElement('div'); bar.className = 'rest-bar'; var end = Date.now() + sec * 1000;
    bar.innerHTML = '<div class="rest-prog" style="width:100%"></div><div class="rest-inner"><div class="grow"><div class="tiny muted">' + esc(t('Rest')) + '</div><div class="timer" id="rt"></div></div><button class="btn sm" data-act="rest-add">+15s</button><button class="btn sm primary" data-act="rest-skip">' + esc(t('Skip')) + '</button></div>';
    document.body.appendChild(bar);
    function tick() { var left = Math.max(0, Math.round((end - Date.now()) / 1000)); var el = document.getElementById('rt'); if (!el) return App.stopRest(); el.textContent = Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2); bar.querySelector('.rest-prog').style.width = (left / sec * 100) + '%'; if (left <= 0) { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); App.stopRest(); } }
    A['rest-add'] = function () { end += 15000; sec += 15; tick(); };
    tick(); restT = setInterval(tick, 1000);
  };
  App.stopRest = function () { clearInterval(restT); var b = document.querySelector('.rest-bar'); if (b) b.remove(); };
  A['rest-skip'] = function () { App.stopRest(); };

  // ---------------- Progress ----------------
  V.progress = function () {
    var ath = me(), body = ath.body.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var h = App.header(t('Progress'));
    var ws = body.filter(function (b) { return b.weight; }), first = ws[0], last = ws[ws.length - 1];
    var delta = first && last ? App.r1(last.weight - first.weight) : 0;
    h += '<div class="grid3"><div class="stat"><div class="v">' + (last ? last.weight : '—') + '</div><div class="l">' + esc(t('kg now')) + '</div></div><div class="stat"><div class="v" style="color:' + (delta <= 0 ? 'var(--good)' : 'var(--warn)') + '">' + (delta > 0 ? '+' : '') + delta + '</div><div class="l">' + esc(t('kg change')) + '</div></div><div class="stat"><div class="v">' + App.streak(ath) + '</div><div class="l">' + esc(t('day streak')) + '</div></div></div>';
    h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Weight')) + '</h2><button class="btn sm primary" data-act="body-add">' + I.plus + esc(t('Log')) + '</button></div><div class="card">' + App.lineChart(ws.map(function (b) { return { x: b.date, y: b.weight }; }), { label: 'weight' }) + '</div></div>';
    var wa = body.filter(function (b) { return b.waist; });
    if (wa.length) h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Waist')) + '</h2></div><div class="card">' + App.lineChart(wa.map(function (b) { return { x: b.date, y: b.waist }; })) + '</div></div>';
    var ad = App.adherence(ath, 7);
    h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Last 7 days')) + '</h2></div><div class="grid3"><div class="stat"><div class="v">' + ad.done + '/' + ad.planned + '</div><div class="l">' + esc(t('workouts')) + '</div></div><div class="stat"><div class="v">' + ad.logged + '/7</div><div class="l">' + esc(t('days food logged')) + '</div></div><div class="stat"><div class="v">' + App.pct(ad.overall) + '</div><div class="l">' + esc(t('adherence')) + '</div></div></div></div>';
    var hh = (ath.health && ath.health.days) || {}, sb = [], ssum = 0, sn = 0, rh = [];
    for (var si = 6; si >= 0; si--) { var sd = App.isoAdd(App.today(), -si), sx = App.healthDay(sd) || {}; sb.push({ l: F.parseISO(sd).toLocaleDateString(S.lang, { weekday: 'narrow' }), v: sx.steps || 0, hi: si === 0 }); if (sx.steps) { ssum += sx.steps; sn++; } }
    Object.keys(hh).sort().slice(-30).forEach(function (d) { if (hh[d].rhr) rh.push({ x: d, y: hh[d].rhr }); });
    h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Steps')) + '</h2><a class="btn sm" href="#/health">' + I.heart + esc(t('Garmin / Apple Health')) + '</a></div>' + (sn ? '<div class="card">' + App.barChart(sb, 8000) + '<p class="tiny muted" style="margin:6px 0 0">' + esc(t('avg steps')) + ': ' + Math.round(ssum / sn).toLocaleString(S.lang) + '</p></div>' : '<p class="small muted">' + esc(t('Steps, weight, resting heart rate and active calories from Apple Health — one tap or automatic every day.')) + '</p>') + '</div>';
    if (rh.length > 1) h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('resting HR')) + '</h2></div><div class="card">' + App.lineChart(rh) + '</div></div>';
    var photos = body.filter(function (b) { return b.photo; });
    h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Progress photos')) + '</h2><span class="tiny muted">' + esc(t('optional · stay on this phone')) + '</span></div>' + (photos.length ? '<div class="photo-grid">' + photos.slice(-6).map(function (b) { return '<figure><img src="' + esc(b.photo) + '" alt=""><figcaption>' + esc(F.fmtDate(b.date, { day: 'numeric', month: 'short' })) + '</figcaption></figure>'; }).join('') + '</div>' : '<p class="small muted">' + esc(t('Add a photo when you log your weight to see the change over time.')) + '</p>') + '</div>';
    if (body.length) h += '<div class="section"><div class="list">' + body.slice(-8).reverse().map(function (b) { return '<div class="list-item"><div class="grow"><b>' + esc(F.fmtDay(b.date)) + '</b></div><span class="small">' + (b.weight ? b.weight + ' kg' : '') + (b.waist ? ' · ' + b.waist + ' cm' : '') + '</span></div>'; }).join('') + '</div></div>';
    return h;
  };
  A['body-add'] = function () {
    var last = me().body[me().body.length - 1] || {};
    var s = App.sheet(App.sheetHead(t('Log measurements')) + '<div class="grid2"><label class="field"><span class="label">' + esc(t('Weight (kg)')) + '</span><input class="input" id="bw" inputmode="decimal" value="' + esc(last.weight || '') + '"></label><label class="field"><span class="label">' + esc(t('Waist (cm)')) + ' <span class="opt">' + esc(t('optional')) + '</span></span><input class="input" id="bwa" inputmode="decimal"></label></div>' +
      '<label class="field"><span class="label">' + esc(t('Photo')) + ' <span class="opt">' + esc(t('optional')) + '</span></span><input class="input" id="bph" type="file" accept="image/*"></label><button class="btn primary lg block" id="bsave">' + esc(t('Save')) + '</button>');
    s.el.querySelector('#bsave').onclick = function () {
      var w = App.num(s.el.querySelector('#bw').value), wa = App.num(s.el.querySelector('#bwa').value), f = s.el.querySelector('#bph').files[0];
      if (!w && !wa && !f) return;
      (f ? App.resizeImage(f, 480, 0.7) : Promise.resolve(null)).then(function (ph) {
        var ath = me(), iso = App.today();
        ath.body = ath.body.filter(function (b) { return b.date !== iso; });
        var e = { date: iso }; if (w) e.weight = w; if (wa) e.waist = wa; if (ph) e.photo = ph;
        ath.body.push(e); if (w && ath.profile) ath.profile.weight = w; App.save(); s.close(); App.rerender(); App.toast(t('Saved'));
      });
    };
  };
})();
