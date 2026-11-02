/* Forged by Grace v2.4 — extra sports / cardio sessions + light/dark theme. */
(function () {
  'use strict';
  var App = window.App, S = App.S, F = App.F, esc = App.esc, t = App.t, I = App.I, V = App.views, A = App.acts;

  // ---------------- i18n (NL) ----------------
  var NL = { 'Extra sports': 'Extra sporten', 'Add sport': 'Sport toevoegen', 'Log session': 'Sessie loggen', 'Log sport session': 'Sportsessie loggen',
    'Sport': 'Sport', 'Days': 'Dagen', 'Duration (min)': 'Duur (min)', 'Intensity (RPE 1-10)': 'Intensiteit (RPE 1-10)', 'Distance (km)': 'Afstand (km)',
    'Notes': 'Notities', 'Estimated calories': 'Geschatte calorieën', 'Name': 'Naam', 'Save': 'Opslaan', 'Delete': 'Verwijderen', 'Light': 'Licht', 'Hard': 'Zwaar', 'Medium': 'Gemiddeld',
    'MMA, kickboxing, running, cycling… next to your strength plan.': 'MMA, kickboksen, hardlopen, fietsen… naast je krachtschema.',
    'No extra sports yet.': 'Nog geen extra sporten.', 'Today: extra sport': 'Vandaag: extra sport', 'Appearance': 'Weergave', 'Dark': 'Donker', 'White background': 'Witte achtergrond',
    'Black with gold is the default. White only changes the background.': 'Zwart met goud is standaard. Wit verandert alleen de achtergrond.',
    'Session logged': 'Sessie opgeslagen', 'Other': 'Overig', 'Match / competition': 'Wedstrijd', 'Team sport': 'Teamsport', 'Running': 'Hardlopen', 'Cycling': 'Fietsen', 'Swimming': 'Zwemmen', 'Walking': 'Wandelen', 'Kickboxing': 'Kickboksen', 'Boxing': 'Boksen',
    'Pick at least one day, or log it as a one-off.': 'Kies minstens één dag, of log het als losse sessie.', 'Weekly': 'Wekelijks', 'One-off session (not planned)': 'Losse sessie (niet gepland)', 'Planned': 'Gepland', 'Log': 'Loggen', 'Edit': 'Bewerken', 'min': 'min' };
  window.FBG_I18N = window.FBG_I18N || {}; window.FBG_I18N.nl = window.FBG_I18N.nl || {};
  Object.keys(NL).forEach(function (k) { if (!window.FBG_I18N.nl[k]) window.FBG_I18N.nl[k] = NL[k]; });

  // ---------------- Sports catalogue ----------------
  // met = MET value at moderate effort
  App.SPORTS = {
    mma: { n: 'MMA', e: '🥊', met: 8.5 }, kickboxing: { n: 'Kickboxing', e: '🦵', met: 7.5 }, boxing: { n: 'Boxing', e: '🥊', met: 7.8 },
    bjj: { n: 'BJJ', e: '🥋', met: 7.5 }, running: { n: 'Running', e: '🏃', met: 9.8, dist: 1 }, cycling: { n: 'Cycling', e: '🚴', met: 7.5, dist: 1 },
    swimming: { n: 'Swimming', e: '🏊', met: 7, dist: 1 }, match: { n: 'Match / competition', e: '🏆', met: 9 }, team: { n: 'Team sport', e: '⚽', met: 7 },
    walking: { n: 'Walking', e: '🚶', met: 3.5, dist: 1 }, other: { n: 'Other', e: '⭐', met: 6 }
  };
  var DAYS = function () { return [t('Mon'), t('Tue'), t('Wed'), t('Thu'), t('Fri'), t('Sat'), t('Sun')]; };
  App.sportName = function (sp) { return sp.name || t((App.SPORTS[sp.type] || App.SPORTS.other).n); };
  App.sportEmoji = function (type) { return (App.SPORTS[type] || App.SPORTS.other).e; };
  // planned sports live in plan.sports (so they are shared with clients) and are mirrored on owner.sports (survive a template change)
  App.sportsOf = function (o) {
    if (!o) return [];
    if (o.plan && Array.isArray(o.plan.sports)) { o.sports = o.plan.sports; return o.plan.sports; }
    if (!Array.isArray(o.sports)) o.sports = [];
    if (o.plan) o.plan.sports = o.sports;
    return o.sports;
  };
  App.sportsOn = function (o, di) { return App.sportsOf(o).filter(function (sp) { return (sp.days || []).indexOf(di) !== -1; }); };
  App.sportKcal = function (type, min, rpe, kg) {
    var m = (App.SPORTS[type] || App.SPORTS.other).met * Math.max(0.5, Math.min(1.4, (rpe || 6) / 6.5));
    return Math.round(m * (kg || 80) * (min || 0) / 60);
  };
  function me() { return S.me; }
  function kg(o) { return (o && o.profile && o.profile.weight) || (S.me.profile && S.me.profile.weight) || 80; }

  // ---------------- Plan a sport (add / edit) ----------------
  App.sportEditor = function (oid, idx) {
    var o = App.owner(oid), list = App.sportsOf(o), cur = idx != null ? App.clone(list[idx]) : { id: F.uid(), type: 'mma', name: '', days: [], dur: 60, rpe: 7 };
    var s = App.sheet(App.sheetHead(idx != null ? t('Edit') : t('Add sport'), t('MMA, kickboxing, running, cycling… next to your strength plan.')) +
      '<div class="sport-grid" id="sp-type">' + Object.keys(App.SPORTS).map(function (k) { var x = App.SPORTS[k]; return '<button type="button" data-k="' + k + '"' + (k === cur.type ? ' class="on"' : '') + '><span class="e">' + x.e + '</span>' + esc(t(x.n)) + '</button>'; }).join('') + '</div>' +
      '<label class="field" id="sp-namef" style="margin-top:12px"><span class="label">' + esc(t('Name')) + ' <span class="opt">' + esc(t('optional')) + '</span></span><input class="input" id="sp-name" placeholder="' + esc(t('e.g. Padel, Muay Thai')) + '" value="' + esc(cur.name || '') + '"></label>' +
      '<div class="field"><span class="label">' + esc(t('Days')) + ' · ' + esc(t('Weekly')) + '</span><div class="day-pick" id="sp-days">' + DAYS().map(function (d, i) { return '<button type="button" data-i="' + i + '"' + (cur.days.indexOf(i) !== -1 ? ' class="on"' : '') + '>' + esc(d) + '</button>'; }).join('') + '</div></div>' +
      '<div class="grid2"><label class="field"><span class="label">' + esc(t('Duration (min)')) + '</span><input class="input" id="sp-dur" inputmode="numeric" value="' + esc(cur.dur) + '"></label><label class="field"><span class="label">' + esc(t('Intensity (RPE 1-10)')) + '</span><input class="input" id="sp-rpe" inputmode="numeric" value="' + esc(cur.rpe) + '"></label></div>' +
      '<button class="btn primary lg block" id="sp-save">' + I.check + esc(t('Save')) + '</button>' + (idx != null ? '<button class="btn danger block sm" style="margin-top:10px" id="sp-del">' + esc(t('Delete')) + '</button>' : ''));
    var el = s.el;
    el.querySelector('#sp-type').onclick = function (e) { var b = e.target.closest('[data-k]'); if (!b) return; cur.type = b.dataset.k; el.querySelectorAll('#sp-type button').forEach(function (x) { x.classList.toggle('on', x === b); }); };
    el.querySelector('#sp-days').onclick = function (e) { var b = e.target.closest('[data-i]'); if (!b) return; var i = +b.dataset.i, p = cur.days.indexOf(i); if (p === -1) cur.days.push(i); else cur.days.splice(p, 1); b.classList.toggle('on', p === -1); };
    el.querySelector('#sp-save').onclick = function () {
      if (!cur.days.length) { App.toast(t('Pick at least one day, or log it as a one-off.')); return; }
      cur.name = el.querySelector('#sp-name').value.trim(); cur.dur = Math.max(5, App.num(el.querySelector('#sp-dur').value) || 60); cur.rpe = Math.max(1, Math.min(10, App.num(el.querySelector('#sp-rpe').value) || 7));
      cur.days.sort();
      if (idx != null) list[idx] = cur; else list.push(cur);
      App.sportsOf(o); App.save(); s.close(); App.rerender(); App.toast(t('Saved'));
    };
    var del = el.querySelector('#sp-del'); if (del) del.onclick = function () { list.splice(idx, 1); App.save(); s.close(); App.rerender(); };
  };
  A['sp-add'] = function (el) { App.sportEditor(el.dataset.o || 'me'); };
  A['sp-edit'] = function (el) { App.sportEditor(el.dataset.o || 'me', +el.dataset.i); };

  // ---------------- Log a session ----------------
  App.sportLogger = function (pre) {
    pre = pre || {}; var ath = me();
    var cur = { type: pre.type || 'mma', name: pre.name || '', dur: pre.dur || 60, rpe: pre.rpe || 7 };
    var s = App.sheet(App.sheetHead(t('Log sport session'), F.fmtDay(App.today())) +
      '<div class="sport-grid" id="sl-type">' + Object.keys(App.SPORTS).map(function (k) { var x = App.SPORTS[k]; return '<button type="button" data-k="' + k + '"' + (k === cur.type ? ' class="on"' : '') + '><span class="e">' + x.e + '</span>' + esc(t(x.n)) + '</button>'; }).join('') + '</div>' +
      '<label class="field" style="margin-top:12px"><span class="label">' + esc(t('Name')) + ' <span class="opt">' + esc(t('optional')) + '</span></span><input class="input" id="sl-name" value="' + esc(cur.name) + '"></label>' +
      '<div class="grid2"><label class="field"><span class="label">' + esc(t('Duration (min)')) + '</span><input class="input" id="sl-dur" inputmode="numeric" value="' + esc(cur.dur) + '"></label><label class="field" id="sl-distf"><span class="label">' + esc(t('Distance (km)')) + ' <span class="opt">' + esc(t('optional')) + '</span></span><input class="input" id="sl-dist" inputmode="decimal"></label></div>' +
      '<div class="field"><span class="label">' + esc(t('Intensity (RPE 1-10)')) + ': <b id="sl-rv">' + cur.rpe + '</b> · <span id="sl-rl"></span></span><input type="range" min="1" max="10" step="1" id="sl-rpe" value="' + cur.rpe + '" style="width:100%;accent-color:var(--accent)"></div>' +
      '<label class="field"><span class="label">' + esc(t('Estimated calories')) + '</span><input class="input" id="sl-kcal" inputmode="numeric"></label>' +
      '<label class="field"><span class="label">' + esc(t('Notes')) + ' <span class="opt">' + esc(t('optional')) + '</span></span><textarea class="input" id="sl-notes" placeholder="' + esc(t('Rounds, sparring, how it felt…')) + '"></textarea></label>' +
      '<button class="btn primary lg block" id="sl-save">' + I.check + esc(t('Save')) + '</button>');
    var el = s.el, kcalTouched = false;
    function lvl(r) { return r <= 4 ? t('Light') : r <= 7 ? t('Medium') : t('Hard'); }
    function upd() {
      var r = +el.querySelector('#sl-rpe').value; el.querySelector('#sl-rv').textContent = r; el.querySelector('#sl-rl').textContent = lvl(r);
      if (!kcalTouched) el.querySelector('#sl-kcal').value = App.sportKcal(cur.type, App.num(el.querySelector('#sl-dur').value), r, kg(ath));
    }
    el.querySelector('#sl-type').onclick = function (e) { var b = e.target.closest('[data-k]'); if (!b) return; cur.type = b.dataset.k; el.querySelectorAll('#sl-type button').forEach(function (x) { x.classList.toggle('on', x === b); }); upd(); };
    el.querySelector('#sl-rpe').oninput = upd; el.querySelector('#sl-dur').oninput = upd;
    el.querySelector('#sl-kcal').oninput = function () { kcalTouched = true; };
    upd();
    el.querySelector('#sl-save').onclick = function () {
      var name = el.querySelector('#sl-name').value.trim(), dur = App.num(el.querySelector('#sl-dur').value), r = +el.querySelector('#sl-rpe').value;
      if (!dur) { App.toast(t('Duration (min)') + '?'); return; }
      var dist = App.num(el.querySelector('#sl-dist').value), kc = Math.round(App.num(el.querySelector('#sl-kcal').value)), notes = el.querySelector('#sl-notes').value.trim();
      var sp = { type: cur.type, name: name };
      ath.sessions.push({ id: F.uid(), date: App.today(), title: App.sportName(sp), type: 'sport', sport: cur.type, dur: Math.round(dur * 60), endedAt: Date.now(), items: [], prs: [],
        rpe: r, notes: notes, ext: { dist: dist || null, kcal: kc || null, src: 'RPE ' + r + ' · ' + lvl(r) } });
      App.save(); s.close(); App.rerender(); App.toast(App.sportEmoji(cur.type) + ' ' + t('Session logged'));
    };
  };
  A['sp-log'] = function (el) {
    var sp = el.dataset.i != null ? App.sportsOf(me())[+el.dataset.i] : null;
    App.sportLogger(sp ? { type: sp.type, name: sp.name, dur: sp.dur, rpe: sp.rpe } : {});
  };

  // ---------------- UI blocks ----------------
  function loggedToday(ath, sp) { var nm = App.sportName(sp); return ath.sessions.some(function (s) { return s.date === App.today() && s.type === 'sport' && s.title === nm; }); }
  App.sportsSection = function (oid, opts) {
    opts = opts || {}; var o = App.owner(oid), list = App.sportsOf(o), DN = DAYS(), canLog = oid === 'me' && S.role !== 'coach';
    var h = '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Extra sports')) + '</h2><button class="btn sm" data-act="sp-add" data-o="' + oid + '">' + I.plus + esc(t('Add sport')) + '</button></div>';
    if (!list.length) h += '<p class="small muted">' + esc(t('MMA, kickboxing, running, cycling… next to your strength plan.')) + '</p>';
    else h += '<div class="list">' + list.map(function (sp, i) {
      return '<div class="list-item"><div class="ex-icon" style="font-size:20px">' + App.sportEmoji(sp.type) + '</div><div class="grow"><b>' + esc(App.sportName(sp)) + '</b><div class="tiny muted">' + esc((sp.days || []).map(function (d) { return DN[d]; }).join(' · ')) + ' · ' + sp.dur + ' ' + esc(t('min')) + ' · RPE ' + sp.rpe + '</div></div>' +
        (canLog ? '<button class="btn sm primary" data-act="sp-log" data-i="' + i + '">' + esc(t('Log')) + '</button>' : '') + '<button class="icon-btn sm" data-act="sp-edit" data-o="' + oid + '" data-i="' + i + '" aria-label="' + esc(t('Edit')) + '">' + I.edit + '</button></div>'; }).join('') + '</div>';
    if (canLog) h += '<button class="btn block" style="margin-top:10px" data-act="sp-log">' + I.plus + esc(t('Log session')) + '</button>';
    return h + '</div>';
  };

  // Train tab
  var origTrain = V.train;
  V.train = function () {
    var h = origTrain.apply(this, arguments), sec = App.sportsSection('me');
    var mk = '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Personal records'));
    if (h.indexOf(mk) !== -1) h = h.replace(mk, sec + mk);
    else { var mh = '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('History')); h = h.indexOf(mh) !== -1 ? h.replace(mh, sec + mh) : h + sec; }
    setTimeout(decorateStrip);
    return h;
  };
  function decorateStrip() {
    var ath = me();
    document.querySelectorAll('.week-strip .wd').forEach(function (b) {
      var i = +b.dataset.i; if (b.querySelector('.sp')) return;
      var sps = App.sportsOn(ath, i), d = document.createElement('div'); d.className = 'sp';
      d.textContent = sps.map(function (s) { return App.sportEmoji(s.type); }).join(''); b.appendChild(d);
    });
  }
  // day sheet: show sports for that day too
  var origDay = A['day-sheet'];
  A['day-sheet'] = function (el) {
    origDay(el);
    var i = +el.dataset.i, sps = App.sportsOn(me(), i), sh = document.querySelector('.overlay:last-of-type .sheet');
    if (!sps.length || !sh) return;
    var all = App.sportsOf(me()), box = document.createElement('div'); box.className = 'section';
    box.innerHTML = '<div class="section-head"><h2 class="h2">' + esc(t('Extra sports')) + '</h2></div><div class="list">' + sps.map(function (sp) { return '<div class="list-item"><div class="ex-icon" style="font-size:20px">' + App.sportEmoji(sp.type) + '</div><div class="grow"><b>' + esc(App.sportName(sp)) + '</b><div class="tiny muted">' + sp.dur + ' ' + esc(t('min')) + ' · RPE ' + sp.rpe + '</div></div><button class="btn sm primary" data-act="sp-log" data-i="' + all.indexOf(sp) + '">' + esc(t('Log')) + '</button></div>'; }).join('') + '</div>';
    sh.appendChild(box);
  };

  // Today tab
  var origToday = V.today;
  V.today = function () {
    var h = origToday.apply(this, arguments), ath = me(), all = App.sportsOf(ath), sps = App.sportsOn(ath, App.dayIndex());
    var sec = '<div class="section">' + (sps.length ? '<p class="kicker" style="margin:0 0 6px">' + esc(t('Today: extra sport')) + '</p><div class="list">' + sps.map(function (sp) {
      var done = loggedToday(ath, sp);
      return '<div class="list-item"><div class="ex-icon" style="font-size:20px">' + App.sportEmoji(sp.type) + '</div><div class="grow"><b>' + esc(App.sportName(sp)) + '</b><div class="tiny muted">' + sp.dur + ' ' + esc(t('min')) + ' · RPE ' + sp.rpe + '</div></div>' + (done ? '<span class="pill good">' + I.check + esc(t('Done')) + '</span>' : '<button class="btn sm primary" data-act="sp-log" data-i="' + all.indexOf(sp) + '">' + esc(t('Log')) + '</button>') + '</div>'; }).join('') + '</div>'
      : '<button class="btn block" data-act="sp-log">' + I.plus + esc(t('Log sport session')) + '</button>') + '</div>';
    var mk = '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Nutrition'));
    return h.indexOf(mk) !== -1 ? h.replace(mk, sec + mk) : h + sec;
  };

  // Coach / self plan editor
  var origPlan = V.plan;
  V.plan = function (oid) {
    var h = origPlan.apply(this, arguments), o = App.owner(oid);
    if (!o || !o.plan) return h;
    var mk = '<div class="grid2" style="margin-top:14px"><button class="btn" data-act="change-plan"';
    var sec = App.sportsSection(oid);
    return h.indexOf(mk) !== -1 ? h.replace(mk, sec + mk) : h + sec;
  };

  // Adherence: planned sports count as planned sessions
  App.adherence = (function (orig) {
    return function (ath, days) {
      var r = orig(ath, days); days = days || 7;
      var plan = ath.plan, planned = 0, done = 0;
      for (var i = 0; i < days; i++) {
        var d = App.addDays(new Date(), -i), iso = F.isoDate(d), di = App.dayIndex(d);
        if (plan) { var pd = plan.days[di]; if (pd && (pd.type === 'strength' || pd.type === 'conditioning')) planned++; }
        planned += App.sportsOn(ath, di).length;
        var ss = ath.sessions.filter(function (s) { return s.date === iso; });
        if (ss.some(function (s) { return s.type !== 'active' && s.type !== 'sport'; })) done++;
        done += ss.filter(function (s) { return s.type === 'sport'; }).length;
      }
      r.planned = planned; r.done = Math.min(done, Math.max(planned, done)); r.train = planned ? Math.min(1, done / planned) : null;
      var parts = [r.train, r.food].filter(function (x) { return x != null; });
      r.overall = parts.length ? parts.reduce(function (a, b) { return a + b; }, 0) / parts.length : null;
      return r;
    };
  })(App.adherence);
  App.trainDays = (function (orig) { return function (plan) { return orig(plan) + (plan && plan.sports ? plan.sports.reduce(function (a, s) { return a + (s.days || []).length; }, 0) : 0); }; })(App.trainDays);

  // ---------------- Theme ----------------
  App.setTheme = function (th) {
    try { localStorage.setItem('fbg.theme', th); } catch (e) {}
    if (th === 'light') document.documentElement.setAttribute('data-theme', 'light'); else document.documentElement.removeAttribute('data-theme');
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', th === 'light' ? '#ffffff' : '#0a0b0d');
  };
  App.theme = function () { try { return localStorage.getItem('fbg.theme') === 'light' ? 'light' : 'dark'; } catch (e) { return 'dark'; } };
  A.theme = function (el) { App.setTheme(el.dataset.v); App.rerender(); };
  var origMore = V.more;
  V.more = function () {
    var h = origMore.apply(this, arguments), th = App.theme();
    var card = '<div class="card"><div class="row between"><div><b>' + esc(t('Appearance')) + '</b><div class="tiny muted">' + esc(t('Black with gold is the default. White only changes the background.')) + '</div></div></div>' +
      '<div class="seg" style="margin-top:10px"><button type="button" data-act="theme" data-v="dark"' + (th === 'dark' ? ' class="on"' : '') + '>⚫ ' + esc(t('Dark')) + '</button><button type="button" data-act="theme" data-v="light"' + (th === 'light' ? ' class="on"' : '') + '>⚪ ' + esc(t('White background')) + '</button></div></div>';
    var mk = '<div class="card"><div class="row between"><div><b>' + esc(t('Mode'));
    return h.indexOf(mk) !== -1 ? h.replace(mk, card + mk) : card + h;
  };
})();
