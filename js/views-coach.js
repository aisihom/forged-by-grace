/* Forged by Grace v2 — coach side: dashboard, client page, plan builder, meal builder, plans, mind (intake), more. */
(function () {
  'use strict';
  var App = window.App, S = App.S, F = App.F, D = App.D, FD = App.FD, esc = App.esc, t = App.t, I = App.I;
  var V = App.views, A = App.acts;

  function lastCI(c) { return c.checkins && c.checkins.length ? c.checkins[c.checkins.length - 1] : null; }
  function status(c) {
    var ci = lastCI(c), n = ci ? App.daysAgo(ci.at) : null;
    var start = c.sharedAt || (c.cloudId && c.created);
    if (!start) return ['info', t('Not shared yet')];
    if (n == null) {
      var due = new Date(new Date(start).getTime() + 7 * 864e5);
      if (Date.now() < due.getTime()) return ['wait', t('First check-in: {d}', { d: due.toLocaleDateString(S.lang === 'nl' ? 'nl-NL' : S.lang === 'es' ? 'es-ES' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) })];
      return ['warn', t('Waiting for first check-in')];
    }
    if (n > 10) return ['bad', t('No check-in for {n} days', { n: n })];
    if (ci.adh && ci.adh.overall != null && ci.adh.overall < 0.5) return ['warn', t('Low adherence')];
    return ['good', t('On track')];
  }
  App.clientStatus = status;

  // ---------------- Dashboard ----------------
  V.clients = function () {
    var cl = S.clients, week = cl.filter(function (c) { var ci = lastCI(c); return ci && App.daysAgo(ci.at) <= 7; }).length;
    var attn = cl.filter(function (c) { var s = status(c)[0]; return s === 'bad' || s === 'warn'; }).length;
    var h = App.header(t('Clients'), t('Coach dashboard'));
    h += '<div class="grid3"><div class="stat"><div class="v">' + cl.length + '</div><div class="l">' + esc(t('clients')) + '</div></div><div class="stat"><div class="v">' + week + '</div><div class="l">' + esc(t('checked in (7d)')) + '</div></div><div class="stat"><div class="v" style="color:' + (attn ? 'var(--warn)' : 'var(--good)') + '">' + attn + '</div><div class="l">' + esc(t('need attention')) + '</div></div></div>';
    h += '<div class="row" style="margin:14px 0"><input class="input grow" id="cq" type="search" placeholder="' + esc(t('Search clients')) + '"><button class="btn primary" data-act="client-new">' + I.plus + esc(t('Client')) + '</button></div>';
    h += '<div class="card tap row me-card" data-act="go" data-p="client/me"><div class="avatar">' + esc(App.initials(S.coach.name)) + '</div><div class="grow"><b>' + esc(App.ownerName('me')) + '</b><div class="tiny muted">' + esc(S.me.plan ? t(S.me.plan.name) : t('No plan yet')) + ' · ' + esc(t('you are your own first client')) + '</div></div><span class="chev">›</span></div>';
    if (!cl.length) h += App.empty('users', t('No clients yet'), t('Add a client, pick a training plan and meal plan, then share it with one link. Room for as many clients as you like.'), '<button class="btn primary" data-act="client-new">' + I.plus + esc(t('Add first client')) + '</button>');
    else h += '<div class="list" id="clist" style="margin-top:12px">' + cl.slice().sort(function (a, b) { return (b.lastCheckin || b.created || '') > (a.lastCheckin || a.created || '') ? 1 : -1; }).map(function (c) {
      var ci = lastCI(c), st = status(c), w = ci && ci.body && ci.body.length ? ci.body[ci.body.length - 1][1] : (c.profile && c.profile.weight);
      var fw = ci && ci.body && ci.body.length > 1 ? ci.body[0][1] : null, dl = fw && w ? App.r1(w - fw) : null;
      return '<a class="list-item client-row" href="#/client/' + c.id + '" data-name="' + esc(c.name.toLowerCase()) + '"><div class="avatar">' + esc(App.initials(c.name)) + (c.unread ? '<i class="unread"></i>' : '') + '</div><div class="grow"><div class="row between"><b class="ell">' + esc(c.name) + '</b><span class="pill ' + st[0] + '">' + (ci && ci.adh ? App.pct(ci.adh.overall) : '—') + '</span></div>' +
        '<div class="tiny muted ell"><span class="dot ' + st[0] + '"></span> ' + esc(st[1]) + ' · ' + esc(t('check-in')) + ': ' + esc(ci ? App.ago(ci.at) : t('never')) + (w ? ' · ' + w + ' kg' : '') + (dl != null ? ' (' + (dl > 0 ? '+' : '') + dl + ')' : '') + '</div></div></a>'; }).join('') + '</div>';
    h += '<div class="section"><button class="btn block" data-act="client-code" style="margin-bottom:8px">' + I.link + esc(t('Add client via code/link')) + '</button><button class="btn block" data-act="paste-import">' + I.link + esc(t('Open a check-in (paste link or file)')) + '</button></div>';
    setTimeout(function () { var q = document.getElementById('cq'); if (q) q.oninput = function () { var v = q.value.toLowerCase(); document.querySelectorAll('.client-row').forEach(function (r) { r.hidden = r.dataset.name.indexOf(v) === -1; }); }; });
    return h;
  };
  A.go = function (el) { App.go(el.dataset.p); };
  A['client-new'] = function () {
    var s = App.sheet(App.sheetHead(t('New client')) + '<button class="btn primary lg block" id="cn-code">' + I.link + esc(t('Add client via code/link')) + '</button><button class="btn lg block" id="cn-man" style="margin-top:10px">' + I.plus + esc(t('Enter manually')) + '</button>');
    s.el.querySelector('#cn-code').onclick = function () { s.close(); A['client-code'](); };
    s.el.querySelector('#cn-man').onclick = function () { s.close(); App.profileSheet('new', function (c) { App.go('client/' + c.id); }); };
  };
  A['client-code'] = function () {
    var s = App.sheet(App.sheetHead(t('Add client via code/link'), t('Paste the code or link you received from your assistant.')) + '<textarea class="input mono" id="cc" rows="5" placeholder="fbg:…"></textarea><button class="btn primary lg block" id="ccgo" style="margin-top:12px">' + esc(t('Add client')) + '</button>');
    s.el.querySelector('#ccgo').onclick = function () { var raw = s.el.querySelector('#cc').value.replace(/\s+/g, ''); if (/^fbg-(all|move):/i.test(raw)) { s.close(); App.decode(raw).then(App.showImport).catch(function () { App.toast(t('That is not a Forged by Grace link or code.')); }); return; } var cl = App.parseClientText(s.el.querySelector('#cc').value); if (!cl) { App.toast(t('That is not a Forged by Grace link or code.')); return; } s.close(); App.openClientFile(cl.slug, true, cl.priv); };
  };
  A['paste-import'] = function () {
    var s = App.sheet(App.sheetHead(t('Open link or file'), t('Paste a Forged by Grace link/code, or choose a .fbg.json file.')) + '<textarea class="input mono" id="pi" placeholder="https://…#imp=…"></textarea><input type="file" class="input" id="pif" accept=".json,.txt,application/json" style="margin-top:10px"><button class="btn primary lg block" id="pigo" style="margin-top:12px">' + esc(t('Open')) + '</button>');
    s.el.querySelector('#pigo').onclick = function () {
      var f = s.el.querySelector('#pif').files[0];
      (f ? f.text() : Promise.resolve(s.el.querySelector('#pi').value)).then(function (txt) { var cl = App.parseClientText && App.parseClientText(txt); if (cl) { s.close(); App.openClientFile(cl.slug, S.role === 'coach' || cl.coach, cl.priv); throw { handled: 1 }; } return App.decode(txt); }).then(function (obj) { s.close(); App.showImport(obj); }).catch(function (e) { if (e && e.handled) return; App.toast(e.message || t('Could not read that.')); });
    };
  };

  // ---------------- Client page ----------------
  V.client = function (id) {
    var self = id === 'me', c = App.owner(id);
    if (!c) { setTimeout(function () { App.go('clients'); }); return ''; }
    if (c.unread) { c.unread = false; App.save(); }
    var p = c.profile || {}, T = App.calcTargets(p), name = self ? App.ownerName('me') : c.name;
    var h = '<div class="row" style="margin-bottom:10px"><a class="icon-btn" href="#/clients" aria-label="' + esc(t('Back')) + '">' + I.back + '</a><div class="grow"></div>' + (self ? '<button class="btn sm" id="role-switch">' + I.swaprole + esc(t('My training')) + '</button>' : '<button class="btn sm danger" data-act="client-del" data-id="' + c.id + '">' + I.trash + '</button>') + '</div>';
    h += '<div class="row"><div class="avatar lg">' + esc(App.initials(name)) + '</div><div class="grow"><h1 class="h1" style="margin:0">' + esc(name) + '</h1><div class="small muted">' + esc(t(App.GOALS[p.goal] || '')) + (p.weight ? ' · ' + p.weight + ' kg' : '') + (p.age ? ' · ' + p.age + ' ' + t('yrs') : '') + '</div></div><button class="btn sm" data-act="edit-profile" data-o="' + id + '">' + I.edit + '</button></div>';
    if (T) h += '<div class="card targets" style="margin-top:14px"><div class="row between"><b>' + esc(t('Daily targets')) + '</b><span class="tiny muted">BMR ' + (T.bmr || '—') + ' · TDEE ' + (T.tdee || '—') + '</span></div><div class="grid4"><div><b>' + T.kcal + '</b><span>kcal</span></div><div><b>' + T.p + '</b><span>' + esc(t('protein')) + '</span></div><div><b>' + T.c + '</b><span>' + esc(t('carbs')) + '</span></div><div><b>' + T.f + '</b><span>' + esc(t('fat')) + '</span></div></div></div>';
    // plans
    h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Program')) + '</h2></div>' +
      '<div class="card row"><div class="ex-icon">' + I.train + '</div><div class="grow"><b>' + esc(c.plan ? t(c.plan.name) : t('No training plan')) + '</b><div class="tiny muted">' + (c.plan ? App.trainDays(c.plan) + ' ' + esc(t('days/week')) + ' · ' + c.plan.weeks + ' ' + esc(t('weeks')) : esc(t('Choose a template'))) + '</div></div>' + (c.plan ? '<a class="btn sm" href="#/plan/' + id + '">' + esc(t('Edit')) + '</a>' : '<button class="btn sm primary" data-act="change-plan" data-o="' + id + '">' + esc(t('Choose')) + '</button>') + '</div>' +
      '<div class="card row"><div class="ex-icon">' + I.food + '</div><div class="grow"><b>' + esc(c.meal ? t('Meal plan') : t('No meal plan')) + '</b><div class="tiny muted">' + (c.meal ? c.meal.targets.kcal + ' kcal · ' + c.meal.meals.length + ' ' + esc(t('meals/day')) : esc(t('Auto-built from targets'))) + '</div></div>' + (c.meal ? '<a class="btn sm" href="#/meal/' + id + '">' + esc(t('Edit')) + '</a>' : '<button class="btn sm primary" data-act="meal-gen" data-o="' + id + '">' + esc(t('Create')) + '</button>') + '</div>';
    if (!self) h += '<button class="btn primary lg block" style="margin-top:12px" data-act="share-client" data-id="' + id + '"' + (c.plan || c.meal ? '' : ' disabled') + '>' + I.share + esc(c.sharedAt ? t('Share update with client') : t('Send plan to client')) + '</button>' + (c.sharedAt ? '<p class="tiny muted center">' + esc(t('Last shared')) + ': ' + esc(App.ago(c.sharedAt)) + '</p>' : '');
    h += '</div>';
    // check-ins
    if (self) {
      var ad = App.adherence(S.me, 7);
      h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Your week')) + '</h2></div><div class="grid3"><div class="stat"><div class="v">' + ad.done + '/' + ad.planned + '</div><div class="l">' + esc(t('workouts')) + '</div></div><div class="stat"><div class="v">' + ad.logged + '/7</div><div class="l">' + esc(t('food days')) + '</div></div><div class="stat"><div class="v">' + App.pct(ad.overall) + '</div><div class="l">' + esc(t('adherence')) + '</div></div></div></div>';
    } else {
      var cis = c.checkins || [], ci = cis[cis.length - 1];
      h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Check-ins')) + '</h2><span class="small muted">' + cis.length + '</span></div>';
      if (!ci) h += '<p class="small muted">' + esc(t('When the client taps “Send” in their app, you get a link. Open it and it lands here.')) + '</p>';
      else {
        var body = ci.body.filter(function (b) { return b[1]; });
        h += '<div class="card"><div class="row between"><b>' + esc(F.fmtDate(ci.at, { weekday: 'short', day: 'numeric', month: 'short' })) + '</b><span>' + ['', '😣', '😕', '🙂', '😀', '🔥'][ci.feel || 0] + '</span></div>' +
          (ci.note ? '<p class="quote">“' + esc(ci.note) + '”</p>' : '') +
          '<div class="grid3" style="margin-top:10px"><div class="stat"><div class="v">' + App.pct(ci.adh.train) + '</div><div class="l">' + esc(t('training')) + ' (' + ci.adh.done + '/' + ci.adh.planned + ')</div></div><div class="stat"><div class="v">' + App.pct(ci.adh.food) + '</div><div class="l">' + esc(t('nutrition')) + '</div></div><div class="stat"><div class="v">' + (ci.streak || 0) + '</div><div class="l">' + esc(t('day streak')) + '</div></div></div>' +
          (body.length ? '<h3 class="h3" style="margin-top:14px">' + esc(t('Weight')) + '</h3>' + App.lineChart(body.map(function (b) { return { x: b[0], y: b[1] }; })) : '') +
          (ci.food.length ? '<h3 class="h3" style="margin-top:14px">' + esc(t('Calories vs target')) + '</h3>' + App.barChart(last7(ci).map(function (d) { return { l: F.parseISO(d[0]).toLocaleDateString(S.lang, { weekday: 'narrow' }), v: d[1] }; }), c.meal ? c.meal.targets.kcal : (T && T.kcal)) +
            '<p class="tiny muted">' + esc(t('Avg')) + ': ' + Math.round(avg(ci.food, 1)) + ' kcal · P ' + Math.round(avg(ci.food, 2)) + ' g · C ' + Math.round(avg(ci.food, 3)) + ' g · F ' + Math.round(avg(ci.food, 4)) + ' g</p>' : '') +
          (ci.health && ci.health.some(function (x) { return x[1] != null; }) ? (function () { var st = ci.health.filter(function (x) { return x[1] != null; }), rr = ci.health.filter(function (x) { return x[2]; }); return '<h3 class="h3" style="margin-top:14px">' + esc(t('Steps')) + '</h3>' + App.barChart(st.slice(-7).map(function (x) { return { l: F.parseISO(x[0]).toLocaleDateString(S.lang, { weekday: 'narrow' }), v: x[1] }; }), 8000) + '<p class="tiny muted">' + esc(t('avg steps')) + ': ' + Math.round(avg(st, 1)).toLocaleString(S.lang) + (rr.length ? ' · ' + esc(t('resting HR')) + ' ' + Math.round(avg(rr, 2)) + ' bpm' : '') + '</p>'; })() : '') +
          (ci.workouts.length ? '<h3 class="h3" style="margin-top:14px">' + esc(t('Workouts')) + '</h3><div class="list">' + ci.workouts.slice(-6).reverse().map(function (w) { return '<div class="list-item"><div class="grow"><b>' + esc(t(w[1])) + '</b><div class="tiny muted">' + esc(F.fmtDay(w[0])) + ' · ' + w[2] + ' ' + esc(t('sets')) + ' · ' + w[3] + ' min</div></div>' + (w[4] ? '<span class="pill accent">' + w[4] + ' PR</span>' : '') + '</div>'; }).join('') + '</div>' : '') + '</div>';
        if (c.phone || c.email) h += '<div class="grid2" style="margin-top:10px">' + (c.phone ? '<a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + esc(c.phone) + '?text=' + encodeURIComponent(t('Hi {n}, thanks for your check-in!', { n: c.name.split(' ')[0] })) + '">' + I.wa + esc(t('Reply')) + '</a>' : '') + (c.email ? '<a class="btn" href="mailto:' + esc(c.email) + '?subject=' + encodeURIComponent('Check-in') + '">' + I.mail + esc(t('Email')) + '</a>' : '') + '</div>';
      }
      h += '</div>';
      // mental coaching brief
      h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Mental coaching')) + '</h2></div>' + (c.intake ? App.briefHtml(c) : '<p class="small muted">' + esc(t('Send the intake questionnaire from the Mind tab. Answers turn into a coaching brief here.')) + '</p><a class="btn" href="#/mind">' + I.heart + esc(t('Mind tab')) + '</a>') + '</div>';
      h += '<div class="section"><label class="field"><span class="label">' + esc(t('Coach notes')) + ' <span class="opt">' + esc(t('private')) + '</span></span><textarea class="input" data-notes="' + c.id + '">' + esc(c.notes || '') + '</textarea></label></div>';
      setTimeout(function () { var n = document.querySelector('[data-notes]'); if (n) n.onchange = function () { c.notes = n.value; App.save(); App.toast(t('Saved')); }; });
    }
    return h;
  };
  function last7(ci) { var end = F.isoDate(new Date(ci.at)), by = {}; ci.food.forEach(function (d) { by[d[0]] = d[1]; }); var out = []; for (var i = 6; i >= 0; i--) { var iso = App.isoAdd(end, -i); out.push([iso, by[iso] || 0]); } return out; }
  function avg(rows, i) { return rows.length ? rows.reduce(function (a, r) { return a + r[i]; }, 0) / rows.length : 0; }
  A['edit-profile'] = function (el) { App.profileSheet(el.dataset.o); };
  A['client-del'] = function (el) { App.confirm(t('Delete client?'), t('This removes the client and their check-ins from this device.'), t('Delete'), true).then(function (ok) { if (!ok) return; S.clients = App.S.clients = S.clients.filter(function (c) { return c.id !== el.dataset.id; }); App.S.clients = S.clients; App.save(); App.go('clients'); }); };
  A['meal-gen'] = function (el) { var o = App.owner(el.dataset.o); o.meal = App.generateMeal(o.profile || {}, 4); App.save(); App.go('meal/' + el.dataset.o); };
  A['share-client'] = function (el) {
    var c = App.client(el.dataset.id);
    var obj = { t: 'assign', v: 2, coach: { name: S.coach.name, email: S.coach.email, whatsapp: S.coach.whatsapp }, client: { id: c.id, name: c.name, profile: c.profile }, plan: c.plan, meal: c.meal };
    var first = c.name.split(' ')[0];
    c.sharedAt = new Date().toISOString(); App.save();
    App.shareSheet(t('Send to {n}', { n: first }), t('{n} opens the link on their phone and the plan loads. No app store, no account.', { n: first }), obj, {
      text: t('Hi {n}! Here is your Forged by Grace plan. Open this link on your phone:', { n: first }), phone: c.phone, email: c.email, subject: 'Forged by Grace · ' + t('your plan'), filename: 'plan-' + F.slug(c.name) });
  };

  // ---------------- Plan builder ----------------
  V.plan = function (oid) {
    var o = App.owner(oid); if (!o) return '';
    var plan = o.plan;
    var back = S.role === 'coach' ? '#/client/' + oid : '#/train';
    var h = '<div class="row" style="margin-bottom:10px"><a class="icon-btn" href="' + back + '" aria-label="' + esc(t('Back')) + '">' + I.back + '</a><div class="grow"><div class="kicker" style="margin:0">' + esc(t('Training plan')) + ' · ' + esc(App.ownerName(oid)) + '</div></div></div>';
    if (!plan) return h + App.templatePicker(oid);
    h += '<label class="field"><span class="label">' + esc(t('Plan name')) + '</span><input class="input" data-pf="name" value="' + esc(t(plan.name)) + '"></label>' +
      '<div class="grid2"><label class="field"><span class="label">' + esc(t('Weeks')) + '</span><input class="input" data-pf="weeks" inputmode="numeric" value="' + plan.weeks + '"></label><label class="field"><span class="label">' + esc(t('Progression')) + '</span><select class="input" data-pf="progression">' + Object.keys(App.PROGRESSIONS).map(function (k) { return '<option value="' + k + '"' + (k === plan.progression ? ' selected' : '') + '>' + esc({ double: t('Double progression'), linear: t('Linear'), rpe: t('RPE-based') }[k]) + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="check"><input type="checkbox" data-pf="deload"' + (plan.deload ? ' checked' : '') + '><span><b>' + esc(t('Deload every 5th week')) + '</b><br><span class="small muted">' + esc(t('One set less on every exercise to recover.')) + '</span></span></label>' +
      '<p class="tiny muted">' + esc(t(App.PROGRESSIONS[plan.progression])) + '</p>';
    var DN = [t('Mon'), t('Tue'), t('Wed'), t('Thu'), t('Fri'), t('Sat'), t('Sun')];
    plan.days.forEach(function (d, di) {
      h += '<div class="card day-card"><div class="row between"><div class="row"><span class="pill">' + DN[di] + '</span><input class="input inline" data-df="' + di + '" value="' + esc(t(d.title)) + '"></div><select class="input inline sm" data-dt="' + di + '">' + ['strength', 'conditioning', 'active', 'rest'].map(function (x) { return '<option value="' + x + '"' + (x === d.type ? ' selected' : '') + '>' + esc(t({ strength: 'Strength', conditioning: 'Conditioning', active: 'Active', rest: 'Rest' }[x])) + '</option>'; }).join('') + '</select></div>';
      if (d.type !== 'rest') {
        h += d.items.map(function (it, ii) {
          var ex = D.BY_ID[it.ex] || { name: it.ex };
          return '<div class="pb-item"><div class="row between"><b class="ell">' + esc(ex.name) + '</b><div class="row" style="gap:4px"><button class="icon-btn sm" data-act="pb-up" data-k="' + di + ':' + ii + '" aria-label="up">↑</button><button class="icon-btn sm" data-act="pb-swap" data-k="' + di + ':' + ii + '" aria-label="swap">' + I.swap + '</button><button class="icon-btn sm" data-act="pb-del" data-k="' + di + ':' + ii + '" aria-label="remove">' + I.trash + '</button></div></div>' +
            '<div class="grid4 pb-fields">' + [['sets', t('Sets')], ['reps', t('Reps')], ['rest', t('Rest s')], ['rpe', 'RPE']].map(function (f) { return '<label><span>' + esc(f[1]) + '</span><input class="input" data-it="' + di + ':' + ii + ':' + f[0] + '" value="' + esc(it[f[0]]) + '"></label>'; }).join('') + '</div></div>'; }).join('') +
          '<button class="link-btn" data-act="pb-add" data-d="' + di + '">+ ' + esc(t('Add exercise')) + '</button>';
      }
      h += '</div>';
    });
    h += '<div class="grid2" style="margin-top:14px"><button class="btn" data-act="change-plan" data-o="' + oid + '">' + I.plans + esc(t('Other template')) + '</button><button class="btn" data-act="pb-save-tpl" data-o="' + oid + '">' + I.file + esc(t('Save as template')) + '</button></div>';
    if (S.role === 'coach' && oid !== 'me') h += '<button class="btn primary lg block" style="margin-top:10px" data-act="share-client" data-id="' + oid + '">' + I.share + esc(t('Send to client')) + '</button>';
    else h += '<a class="btn primary lg block" style="margin-top:10px" href="' + back + '">' + I.check + esc(t('Done')) + '</a>';
    App._pbOwner = oid;
    setTimeout(bindPlan);
    return h;
  };
  function curPlan() { return App.owner(App._pbOwner).plan; }
  function bindPlan() {
    var v = document.getElementById('view');
    v.onchange = function (e) {
      var el = e.target, plan = App._pbOwner && App.owner(App._pbOwner) && curPlan(); if (!plan) return;
      if (el.dataset.pf) { var k = el.dataset.pf; plan[k] = k === 'deload' ? el.checked : k === 'weeks' ? Math.max(1, App.num(el.value)) : el.value; if (k === 'progression') { App.save(); App.rerender(); return; } }
      else if (el.dataset.df) plan.days[+el.dataset.df].title = el.value;
      else if (el.dataset.dt) { plan.days[+el.dataset.dt].type = el.value; App.save(); App.rerender(); return; }
      else if (el.dataset.it) { var p = el.dataset.it.split(':'), it = plan.days[+p[0]].items[+p[1]]; it[p[2]] = p[2] === 'reps' ? el.value : App.num(el.value); }
      else return;
      App.save();
    };
  }
  function kk(el) { var p = el.dataset.k.split(':'); return [+p[0], +p[1]]; }
  A['pb-del'] = function (el) { var k = kk(el); curPlan().days[k[0]].items.splice(k[1], 1); App.save(); App.rerender(); };
  A['pb-up'] = function (el) { var k = kk(el), its = curPlan().days[k[0]].items; if (k[1] > 0) { var x = its.splice(k[1], 1)[0]; its.splice(k[1] - 1, 0, x); App.save(); App.rerender(); } };
  A['pb-add'] = function (el) { var di = +el.dataset.d; App.exercisePicker(function (ex) { var pl = curPlan(); pl.days[di].items.push(App.prescribe(ex, ex.kind === 'compound' ? 'c' : ex.kind === 'core' ? 'k' : ex.kind === 'conditioning' ? 'f' : 'a', pl.goal, pl.level)); App.save(); App.rerender(); }); };
  A['pb-swap'] = function (el) { var k = kk(el); App.exercisePicker(function (ex) { curPlan().days[k[0]].items[k[1]].ex = ex.id; App.save(); App.rerender(); }); };
  A['pb-save-tpl'] = function (el) { var pl = App.clone(App.owner(el.dataset.o).plan); pl.id = F.uid(); S.plans.push(pl); App.save(); App.toast(t('Saved to your plans')); };

  // ---------------- Meal builder ----------------
  V.meal = function (oid) {
    var o = App.owner(oid); if (!o) return '';
    var back = S.role === 'coach' ? '#/client/' + oid : '#/food';
    var h = '<div class="row" style="margin-bottom:10px"><a class="icon-btn" href="' + back + '" aria-label="' + esc(t('Back')) + '">' + I.back + '</a><div class="grow"><div class="kicker" style="margin:0">' + esc(t('Meal plan')) + ' · ' + esc(App.ownerName(oid)) + '</div></div></div>';
    if (!o.meal) return h + App.empty('food', t('No meal plan yet'), t('Built automatically from weight, height, age, activity and goal. Every food and gram can be changed.'), '<button class="btn primary" data-act="meal-gen" data-o="' + oid + '">' + esc(t('Create meal plan')) + '</button>');
    var m = o.meal, T = m.targets, tot = App.mealTotals(m);
    h += '<div class="card"><div class="row" style="gap:16px"><div style="width:118px;flex:none">' + App.ring(tot.kcal, T.kcal, String(tot.kcal), '/ ' + T.kcal + ' kcal') + '</div><div class="grow">' + App.macroBars(tot, T) + '</div></div>' +
      '<div class="row between" style="margin-top:12px"><div class="seg sm" role="group" aria-label="meals per day">' + [3, 4, 5].map(function (n) { return '<button data-act="mb-per" data-n="' + n + '" data-o="' + oid + '"' + (m.perDay === n ? ' class="on"' : '') + '>' + n + ' ' + esc(t('meals')) + '</button>'; }).join('') + '</div><button class="btn sm" data-act="mb-targets" data-o="' + oid + '">' + I.edit + esc(t('Targets')) + '</button></div></div>';
    m.meals.forEach(function (ml, mi) {
      var mt = App.mealTotals({ meals: [ml] });
      h += '<div class="section"><div class="section-head"><h3 class="h3">' + esc(t(ml.name)) + '</h3><span class="small muted">' + mt.kcal + ' kcal · P ' + mt.p + '</span></div><div class="list">' + ml.items.map(function (it, ii) {
        var fd = App.findFood(it.food) || { en: it.food, kcal: 0, p: 0, c: 0, f: 0 }, x = App.macrosFor(fd, it.g);
        return '<div class="list-item mb-item"><div class="grow"><b class="ell">' + esc(App.foodName(fd)) + '</b><div class="tiny muted">' + x.kcal + ' kcal · P ' + x.p + ' · C ' + x.c + ' · F ' + x.f + '</div></div><input class="input g-in" inputmode="numeric" data-mg="' + mi + ':' + ii + '" value="' + it.g + '" aria-label="grams"><span class="tiny muted">g</span>' +
          '<button class="icon-btn sm" data-act="mb-swap" data-k="' + mi + ':' + ii + '" aria-label="' + esc(t('Swap')) + '">' + I.swap + '</button><button class="icon-btn sm" data-act="mb-del" data-k="' + mi + ':' + ii + '" aria-label="' + esc(t('Remove')) + '">' + I.trash + '</button></div>'; }).join('') +
        '<button class="list-item add-li" data-act="mb-add" data-m="' + mi + '">' + I.plus + esc(t('Add food')) + '</button></div></div>';
    });
    h += '<div class="grid2" style="margin-top:16px"><button class="btn" data-act="mb-fit" data-o="' + oid + '">' + I.sparkle + esc(t('Auto-fit to targets')) + '</button><button class="btn" data-act="mb-grocery" data-o="' + oid + '">' + I.cart + esc(t('Grocery list')) + '</button></div>';
    if (S.role === 'coach' && oid !== 'me') h += '<button class="btn primary lg block" style="margin-top:10px" data-act="share-client" data-id="' + oid + '">' + I.share + esc(t('Send to client')) + '</button>';
    App._mbOwner = oid;
    setTimeout(function () { document.getElementById('view').onchange = function (e) { var k = e.target.dataset.mg; if (!k) return; var p = k.split(':'); App.owner(App._mbOwner).meal.meals[+p[0]].items[+p[1]].g = Math.max(0, App.num(e.target.value)); App.save(); App.rerender(); }; });
    return h;
  };
  function curMeal() { return App.owner(App._mbOwner).meal; }
  A['mb-per'] = function (el) { var o = App.owner(el.dataset.o); var T = o.meal.targets; o.meal = App.generateMeal(o.profile || {}, +el.dataset.n); o.meal.targets = T; App.fitMeal(o.meal); App.save(); App.rerender(); };
  A['mb-fit'] = function () { var m = curMeal(); m.meals.forEach(function (ml) { ml.items.forEach(function (it) { if (!it.role) it.role = 'x'; }); }); App.fitMeal(m); App.save(); App.rerender(); App.toast(t('Portions adjusted to the targets')); };
  A['mb-del'] = function (el) { var k = kk(el); curMeal().meals[k[0]].items.splice(k[1], 1); App.save(); App.rerender(); };
  A['mb-add'] = function (el) { var mi = +el.dataset.m; App.foodSearchSheet(function (fd) { App.portionSheet(fd, { cta: t('Add to meal plan'), onPick: function (g) { var c = fd.cat; curMeal().meals[mi].items.push({ food: fd.id, g: g, role: c === 'protein' ? 'p' : c === 'carb' ? 'c' : c === 'fat' ? 'f' : 'x', swaps: [] }); App.save(); } }); }, t('Add to meal plan')); };
  A['mb-swap'] = function (el) {
    var k = kk(el), it = curMeal().meals[k[0]].items[k[1]], cur = App.findFood(it.food);
    var alts = (it.swaps && it.swaps.length ? it.swaps : []).concat(FD.FOODS.filter(function (f) { return !f.x && cur && f.cat === cur.cat && f.id !== cur.id; }).map(function (f) { return f.id; }));
    alts = alts.filter(function (x, i) { return alts.indexOf(x) === i && x !== it.food; }).slice(0, 14);
    var key = it.role === 'p' ? t('protein') : it.role === 'c' ? t('carbs') : it.role === 'f' ? t('fat') : 'kcal';
    var s = App.sheet(App.sheetHead(t('Swap {n}', { n: App.foodName(cur) }), t('Same amount of {k}, portion recalculated.', { k: key })) + '<div class="list">' + alts.map(function (id) {
      var fd = App.findFood(id); if (!fd) return ''; var g = App.swapGrams(it, id), x = App.macrosFor(fd, g);
      return '<button class="list-item" data-alt="' + id + '" data-g="' + g + '"><div class="grow"><b>' + esc(App.foodName(fd)) + '</b><div class="tiny muted">' + g + ' g · ' + x.kcal + ' kcal · P ' + x.p + ' · C ' + x.c + ' · F ' + x.f + '</div></div><span class="chev">' + I.swap + '</span></button>'; }).join('') + '</div>');
    s.el.onclick = function (e) { var b = e.target.closest('[data-alt]'); if (!b) return; var old = it.food; it.food = b.dataset.alt; it.g = +b.dataset.g; it.swaps = [old].concat((it.swaps || []).filter(function (x) { return x !== b.dataset.alt; })); App.save(); s.close(); App.rerender(); };
  };
  A['mb-targets'] = function (el) {
    var o = App.owner(el.dataset.o), m = o.meal, auto = App.calcTargets(Object.assign({}, o.profile, { targetsOverride: null }));
    var s = App.sheet(App.sheetHead(t('Daily targets'), t('Auto: {k} kcal · P {p} · C {c} · F {f} (Mifflin-St Jeor, activity, goal)', { k: auto.kcal, p: auto.p, c: auto.c, f: auto.f })) +
      '<div class="grid2">' + [['kcal', 'kcal'], ['p', t('Protein (g)')], ['c', t('Carbs (g)')], ['f', t('Fat (g)')]].map(function (x) { return '<label class="field"><span class="label">' + esc(x[1]) + '</span><input class="input" id="tg-' + x[0] + '" inputmode="numeric" value="' + m.targets[x[0]] + '"></label>'; }).join('') + '</div>' +
      '<div class="grid2"><button class="btn" id="tg-auto">' + esc(t('Use auto')) + '</button><button class="btn primary" id="tg-save">' + esc(t('Save + fit')) + '</button></div>');
    s.el.querySelector('#tg-auto').onclick = function () { ['kcal', 'p', 'c', 'f'].forEach(function (k) { s.el.querySelector('#tg-' + k).value = auto[k]; }); };
    s.el.querySelector('#tg-save').onclick = function () { ['kcal', 'p', 'c', 'f'].forEach(function (k) { m.targets[k] = App.num(s.el.querySelector('#tg-' + k).value); }); App.fitMeal(m); App.save(); s.close(); App.rerender(); };
  };
  A['mb-grocery'] = function (el) {
    var m = App.owner(el.dataset.o).meal, g = App.groceryList(m, 7), lines = [t('Grocery list (7 days)') + ' — Forged by Grace'];
    var html = Object.keys(g).map(function (cat) {
      lines.push('', (t(FD.CATS[cat] || cat)).toUpperCase());
      return '<h3 class="h3" style="margin-top:12px">' + esc(t(FD.CATS[cat] || cat)) + '</h3>' + g[cat].map(function (x) {
        var amt = x.g >= 1000 ? App.r1(x.g / 1000) + ' kg' : Math.round(x.g) + ' g', pcs = x.food.g ? Math.ceil(x.g / x.food.g) : 0;
        lines.push('☐ ' + App.foodName(x.food) + ' — ' + amt + (pcs ? ' (≈' + pcs + '× ' + (x.food.portion || '') + ')' : ''));
        return '<label class="check gl"><input type="checkbox"><span><b>' + esc(App.foodName(x.food)) + '</b> <span class="muted small">' + amt + (pcs ? ' · ≈' + pcs + '× ' + esc(x.food.portion || '') : '') + '</span></span></label>'; }).join('');
    }).join('');
    var s = App.sheet(App.sheetHead(t('Grocery list'), t('For 7 days of this meal plan')) + html + '<div class="grid2" style="margin-top:14px"><button class="btn" id="gl-copy">' + I.link + esc(t('Copy')) + '</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(lines.join('\n')) + '">' + I.wa + 'WhatsApp</a></div>');
    s.el.querySelector('#gl-copy').onclick = function () { F.copyText(lines.join('\n')).then(function () { App.toast(t('Copied')); }); };
  };

  // ---------------- Plans tab (templates + saved) ----------------
  V.plans = function () {
    var h = App.header(t('Plans'), t('Templates & your saved plans'));
    h += '<p class="muted small">' + esc(t('Templates are a starting point. Assign one to a client from their page and adjust it there.')) + '</p>';
    h += '<div class="tpl-grid">' + Object.keys(App.TEMPLATES).map(function (k) { var tp = App.TEMPLATES[k], pl = App.generatePlan(k);
      return '<div class="card tpl"><div class="row between"><b>' + esc(t(tp.name)) + '</b><span class="pill">' + esc(t(App.LEVELS[tp.level])) + '</span></div><p class="small muted" style="margin:6px 0">' + esc(t(tp.desc)) + '</p><div class="tiny dim">' + pl.days.filter(function (d) { return d.items.length && d.type !== 'active'; }).map(function (d) { return esc(t(d.title)); }).join(' · ') + '</div><button class="btn sm" style="margin-top:10px" data-act="tpl-assign" data-k="' + k + '">' + esc(t('Assign to…')) + '</button></div>'; }).join('') + '</div>';
    if (S.plans.length) h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Saved plans')) + '</h2></div><div class="list">' + S.plans.map(function (p, i) { return '<div class="list-item"><div class="grow"><b>' + esc(t(p.name)) + '</b><div class="tiny muted">' + App.trainDays(p) + ' ' + esc(t('days/week')) + '</div></div><button class="btn sm" data-act="tpl-assign" data-saved="' + i + '">' + esc(t('Assign')) + '</button><button class="icon-btn sm" data-act="plan-del" data-i="' + i + '">' + I.trash + '</button></div>'; }).join('') + '</div></div>';
    h += '<div class="section"><div class="card"><b>' + esc(t('Food database')) + '</b><p class="small muted">' + FD.FOODS.length + ' ' + esc(t('built-in foods')) + ' · ' + S.customFoods.length + ' ' + esc(t('custom')) + ' · ' + Object.keys(S.barcodes).length + ' ' + esc(t('scanned')) + '</p><button class="btn sm" data-act="food-add">' + I.search + esc(t('Browse')) + '</button> <button class="btn sm" data-act="custom-food">' + I.plus + esc(t('Custom food')) + '</button></div></div>';
    return h;
  };
  A['plan-del'] = function (el) { S.plans.splice(+el.dataset.i, 1); App.save(); App.rerender(); };
  A['tpl-assign'] = function (el) {
    var opts = [['me', App.ownerName('me')]].concat(S.clients.map(function (c) { return [c.id, c.name]; }));
    var s = App.sheet(App.sheetHead(t('Assign to…')) + '<div class="list">' + opts.map(function (o) { return '<button class="list-item" data-o="' + o[0] + '"><div class="avatar">' + esc(App.initials(o[1])) + '</div><div class="grow"><b>' + esc(o[1]) + '</b></div></button>'; }).join('') + '</div>');
    s.el.onclick = function (e) {
      var b = e.target.closest('[data-o]'); if (!b) return; var o = App.owner(b.dataset.o), p = o.profile || {};
      if (el.dataset.saved != null) { o.plan = App.clone(S.plans[+el.dataset.saved]); o.plan.id = F.uid(); o.plan.start = App.today(); }
      else { var tp = App.TEMPLATES[el.dataset.k]; o.plan = App.generatePlan(el.dataset.k, { mode: tp.mode === 'gym' ? (p.mode || 'gym') : tp.mode, level: tp.level === 'intermediate' ? (p.level || tp.level) : tp.level }); }
      App.save(); s.close(); App.go('plan/' + b.dataset.o);
    };
  };

  // ---------------- Mind (mental coaching intake) ----------------
  V.mind = function () {
    var coach = { name: S.coach.name, email: S.coach.email, whatsapp: S.coach.whatsapp };
    var link = App.baseUrl().replace(/index\.html$/, '').replace(/[^/]*$/, '') + 'intake.html?c=' + F.coachLinkParam(coach);
    var withIntake = S.clients.filter(function (c) { return c.intake; });
    var h = App.header(t('Mind'), t('Mental coaching'));
    h += '<div class="hero"><p class="kicker">' + esc(t('Intake questionnaire')) + '</p><h2 class="h2">' + esc(t('Know the heart behind the goal')) + '</h2><p class="small muted">' + esc(t('Clients answer ~12 short questions (EN / ES / NL). You get a coaching brief: themes, watch-outs, focus areas and first-session questions.')) + '</p>' +
      '<div class="grid2"><button class="btn primary" data-act="intake-share">' + I.share + esc(t('Send intake')) + '</button><a class="btn" href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(t('Preview')) + '</a></div></div>';
    h += '<div class="section"><button class="btn block" data-act="intake-import">' + I.file + esc(t('Import answers (paste email or file)')) + '</button></div>';
    h += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Briefs')) + '</h2></div>' + (withIntake.length ? '<div class="list">' + withIntake.map(function (c) { var b = c.brief || {}; return '<a class="list-item" href="#/client/' + c.id + '"><div class="avatar">' + esc(App.initials(c.name)) + '</div><div class="grow"><b>' + esc(c.name) + '</b><div class="tiny muted">' + esc((b.themes || []).map(function (x) { return x.label; }).join(' · ')) + '</div></div><span class="pill ' + (b.level === 'high' ? 'bad' : b.level === 'watch' ? 'warn' : 'good') + '">' + esc(b.level === 'high' ? t('urgent') : b.level === 'watch' ? t('watch') : 'ok') + '</span></a>'; }).join('') + '</div>' : '<p class="small muted">' + esc(t('No answers imported yet.')) + '</p>') + '</div>';
    h += '<p class="disclaimer" style="margin-top:16px">' + esc(t('Coaching support, not therapy or medical care. If a client is in crisis: 112, or 113 Zelfmoordpreventie (0800-0113).')) + '</p>';
    App._intakeLink = link;
    return h;
  };
  A['intake-share'] = function () {
    var link = App._intakeLink, text = t('Hi! Before we start, could you answer a few questions? It takes about 5 minutes:') + '\n' + link;
    var s = App.sheet(App.sheetHead(t('Send intake')) + '<textarea class="input mono" readonly>' + esc(link) + '</textarea><div class="grid2" style="margin-top:10px"><button class="btn" id="il-copy">' + I.link + esc(t('Copy link')) + '</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(text) + '">' + I.wa + 'WhatsApp</a></div>');
    s.el.querySelector('#il-copy').onclick = function () { F.copyText(link).then(function () { App.toast(t('Link copied')); }); };
  };
  A['intake-import'] = function () {
    var s = App.sheet(App.sheetHead(t('Import intake answers'), t('Paste the whole email or WhatsApp message, or choose the file.')) + '<textarea class="input" id="ii" rows="6"></textarea><input type="file" class="input" id="iif" accept=".txt,.json,.html,.htm" style="margin-top:10px"><button class="btn primary lg block" id="iigo" style="margin-top:12px">' + esc(t('Import')) + '</button>');
    s.el.querySelector('#iigo').onclick = function () {
      var f = s.el.querySelector('#iif').files[0];
      (f ? f.text() : Promise.resolve(s.el.querySelector('#ii').value)).then(function (txt) {
        var p = F.parseIntake(txt), name = p.answers.name;
        var c = S.clients.filter(function (x) { return x.intakeId === p.id || x.name.toLowerCase() === String(name).toLowerCase(); })[0];
        if (!c) { c = { id: F.uid(), name: name, created: new Date().toISOString(), checkins: [], profile: { name: name, goal: 'lean' } }; S.clients.push(c); }
        c.intake = p; c.intakeId = p.id; c.brief = F.brief(p); if (p.answers.email && !c.email) c.email = p.answers.email;
        App.save(); s.close(); App.toast(t('Brief ready for {n}', { n: name })); App.go('client/' + c.id);
      }).catch(function (e) { App.toast(e.message); });
    };
  };
  App.briefHtml = function (c) {
    var b = c.brief || F.brief(c.intake);
    return '<div class="card">' + (b.flags.length ? b.flags.map(function (f) { return '<div class="flag ' + f.level + '"><span class="fi">' + (f.level === 'high' ? '!!' : f.level === 'watch' ? '!' : 'i') + '</span><span>' + esc(f.text) + '</span></div>'; }).join('') : '<p class="small" style="color:var(--good)">✓ ' + esc(t('No risk flags from the answers.')) + '</p>') +
      '<div class="grid4 scores">' + [['stress', t('Stress')], ['motivation', t('Motivation')], ['sleepQuality', t('Sleep')], ['confidence', t('Confidence')]].map(function (x) { return '<div><b>' + (b.scores[x[0]] != null ? b.scores[x[0]] : '—') + '</b><span>' + esc(x[1]) + '</span></div>'; }).join('') + '</div>' +
      '<h3 class="h3" style="margin-top:12px">' + esc(t('Key themes')) + '</h3><div class="chips">' + b.themes.map(function (x) { return '<span class="chip on">' + esc(x.label) + '</span>'; }).join('') + '</div>' +
      b.focusAreas.map(function (fa) { return '<div class="focus-area"><b>' + esc(fa.title) + '</b><ul>' + fa.actions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></div>'; }).join('') +
      '<h3 class="h3">' + esc(t('First-session questions')) + '</h3><ol class="plain-list">' + b.questions.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ol>' +
      '<button class="btn sm" style="margin-top:10px" data-act="intake-reply" data-id="' + c.id + '">' + I.mail + esc(t('Reply draft')) + '</button></div>';
  };
  A['intake-reply'] = function (el) { var c = App.client(el.dataset.id), txt = F.replyDraft(c.intake, S.coach.name); var s = App.sheet(App.sheetHead(t('Reply draft')) + '<textarea class="input" rows="7">' + esc(txt) + '</textarea><div class="grid2" style="margin-top:10px"><button class="btn" id="rd-c">' + esc(t('Copy')) + '</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + esc(c.phone || '') + '?text=' + encodeURIComponent(txt) + '">WhatsApp</a></div>'); s.el.querySelector('#rd-c').onclick = function () { F.copyText(txt).then(function () { App.toast(t('Copied')); }); }; };

  // ---------------- More / settings ----------------
  V.more = function () {
    var h = App.header(t('More'));
    h += '<div class="card"><div class="row between"><b>' + esc(t('Language')) + '</b>' + App.langSwitch() + '</div></div>';
    h += '<div class="card"><div class="row between"><div><b>' + esc(t('Mode')) + '</b><div class="tiny muted">' + esc(S.role === 'coach' ? t('Coach: clients, plans, check-ins') : t('Athlete: today, food, training, progress')) + '</div></div><button class="btn sm" data-act="set-role">' + I.swaprole + esc(S.role === 'coach' ? t('My training') : t('Coach mode')) + '</button></div></div>';
    h += '<div class="card"><label class="check" style="border:0;padding:0;background:none"><input type="checkbox" data-set="verse"' + (S.verse ? ' checked' : '') + '><span><b>' + esc(t('Verse of the day')) + '</b><br><span class="small muted">' + esc(t('A short Bible verse on the Today screen.')) + '</span></span></label><label class="check" style="border:0;padding:0;background:none;margin-top:12px"><input type="checkbox" data-set="faithHabit"' + (S.faithHabit ? ' checked' : '') + '><span><b>' + esc(t('Quiet time habit')) + '</b><br><span class="small muted">' + esc(t('Adds “Quiet time / prayer” to daily habits.')) + '</span></span></label></div>';
    h += '<div class="card"><b>' + esc(t('My profile')) + '</b><p class="small muted">' + esc(S.me.profile ? S.me.profile.name + ' · ' + S.me.profile.weight + ' kg · ' + t(App.GOALS[S.me.profile.goal] || '') : t('Not set')) + '</p><button class="btn sm" data-act="edit-profile" data-o="me">' + I.edit + esc(t('Edit profile')) + '</button></div>';
    if (S.role === 'coach' || S.me.isCoach) h += '<div class="card"><b>' + esc(t('Coach details')) + '</b><p class="tiny muted">' + esc(t('Clients send check-ins and intake answers here.')) + '</p><label class="field"><span class="label">' + esc(t('Name')) + '</span><input class="input" data-coach="name" value="' + esc(S.coach.name) + '"></label><label class="field"><span class="label">' + esc(t('Email')) + '</span><input class="input" type="email" data-coach="email" value="' + esc(S.coach.email) + '"></label><label class="field"><span class="label">WhatsApp</span><input class="input" data-coach="whatsapp" inputmode="tel" placeholder="31612345678" value="' + esc(S.coach.whatsapp) + '"></label></div>';
    h += '<a class="card tap row" href="#/health"><div class="ex-icon">' + I.heart + '</div><div class="grow"><b>' + esc(t('Connect Garmin / Apple Health')) + '</b><div class="tiny muted">' + esc(t('Steps, weight, resting heart rate and active calories from Apple Health — one tap or automatic every day.')) + '</div></div><span class="chev">›</span></a>';
    h += '<div class="card"><b>' + esc(t('Backup')) + '</b><p class="small muted">' + esc(t('All data lives on this device only. Export a backup now and then.')) + '</p><div class="grid2"><button class="btn" data-act="backup">' + I.file + esc(t('Export backup')) + '</button><label class="btn">' + esc(t('Restore')) + '<input type="file" id="restore" accept=".json" hidden></label></div></div>';
    h += '<div class="card"><b>' + esc(t('Camera features')) + '</b><p class="small muted">' + esc(App.secure() ? t('Live barcode camera available (secure https connection).') : t('Live barcode camera needs the online https version. Until then: take a photo of the barcode, or type the number.')) + '</p></div>';
    h += '<p class="footer-note">Forged by Grace v2 · ' + esc(S.coach.name) + '<br>“' + esc(App.FD.VERSES[1][1]) + '” — Proverbs 4:23</p>';
    h += '<button class="btn danger block sm" data-act="reset" style="margin-top:10px">' + esc(t('Erase all data on this device')) + '</button>';
    setTimeout(function () {
      var v = document.getElementById('view');
      v.querySelectorAll('[data-set]').forEach(function (c) { c.onchange = function () { S[c.dataset.set] = c.checked; App.save(); }; });
      v.querySelectorAll('[data-coach]').forEach(function (c) { c.onchange = function () { S.coach[c.dataset.coach] = c.value.trim(); var st = F.store.get('settings', {}) || {}; st['coach' + c.dataset.coach.charAt(0).toUpperCase() + c.dataset.coach.slice(1).replace('whatsapp', 'WhatsApp')] = S.coach[c.dataset.coach]; F.store.set('settings', st); App.save(); App.toast(t('Saved')); }; });
      var r = document.getElementById('restore'); if (r) r.onchange = function () { r.files[0].text().then(function (txt) { var o = JSON.parse(txt); if (o.t === 'backup' && o.state) { F.store.set('state.v2', o.state); location.reload(); } else App.toast(t('Not a backup file')); }).catch(function () { App.toast(t('Not a backup file')); }); };
    });
    return h;
  };
  A['set-role'] = function () { S.role = S.role === 'coach' ? 'athlete' : 'coach'; S.me.isCoach = S.me.isCoach || S.role === 'coach'; App.save(); App.go(S.role === 'coach' ? 'clients' : 'today'); };
  A.backup = function () { F.download('forged-by-grace-backup-' + App.today() + '.json', JSON.stringify({ t: 'backup', v: 2, at: new Date().toISOString(), state: S }), 'application/json'); };
  A.reset = function () { App.confirm(t('Erase everything?'), t('All clients, plans and logs on this device are deleted. Export a backup first.'), t('Erase'), true).then(function (ok) { if (ok) App.reset(); }); };
})();
