/* Forged by Grace v2.9 — manual step editing + step estimates for combat sports without a watch.
   Synced steps (Shortcut / Garmin / Apple Health) stay in days[d].steps. Extras are stored apart:
   days[d].man = manual extra steps, days[d].ov = manual total override, session.estSteps = estimate for a session without watch.
   Total = ov (if set) else synced + man + sum(estSteps). A new sync only rewrites .steps, so extras survive. */
(function () {
  'use strict';
  var App = window.App, S = App.S, F = App.F, esc = App.esc, t = App.t, I = App.I, V = App.views, A = App.acts;
  var NL = { 'Adjust steps': 'Stappen aanpassen', 'Day': 'Dag', 'Synced (watch / phone)': 'Gesynchroniseerd (horloge / telefoon)', 'Extra steps (added by hand)': 'Extra stappen (handmatig erbij)',
    'Set total instead (optional)': 'Of zet het totaal (optioneel)', 'Leave empty to use synced + extra.': 'Laat leeg om gesynchroniseerd + extra te gebruiken.', 'Estimated from sessions': 'Geschat uit sessies',
    'Total': 'Totaal', 'Steps saved': 'Stappen opgeslagen', 'Reset extras': 'Extra’s wissen', 'manual': 'handmatig', 'est.': 'geschat', 'Watch': 'Horloge', 'set by hand': 'handmatig ingesteld',
    'Watch not worn — add estimated steps': 'Horloge niet gedragen — geschatte stappen toevoegen', 'Estimated steps': 'Geschatte stappen', 'Date': 'Datum',
    'Estimate: {r} steps/min × minutes, adjusted for intensity. You can change it.': 'Schatting: {r} stappen/min × minuten, aangepast aan intensiteit. Je kunt het aanpassen.',
    'Steps added by hand / estimated': 'Stappen handmatig / geschat', 'Today': 'Vandaag', 'Yesterday': 'Gisteren', 'A sync never removes your extra steps.': 'Een sync wist je extra stappen nooit.',
    'Combat sessions without a watch can add estimated steps when you log them (Train → Log session).': 'Vechtsport zonder horloge? Bij het loggen (Train → Sessie loggen) kun je geschatte stappen toevoegen.' };
  window.FBG_I18N = window.FBG_I18N || {}; window.FBG_I18N.nl = window.FBG_I18N.nl || {};
  Object.keys(NL).forEach(function (k) { if (!window.FBG_I18N.nl[k]) window.FBG_I18N.nl[k] = NL[k]; });

  // Real footwork steps per minute (what a wrist tracker would roughly have counted), at RPE 7.
  // Not the "step-equivalent" charts (130–290/min, based on calories) — those would inflate the daily total.
  // BJJ: ~2,000–2,500 tracker steps per 2 h class (practitioner Fitbit data) ≈ 20/min.
  App.STEP_RATES = { boxing: 60, kickboxing: 55, mma: 45, bjj: 20 };
  App.estSteps = function (type, min, rpe) {
    var r = App.STEP_RATES[type]; if (!r) return 0;
    var f = Math.max(0.7, Math.min(1.3, (rpe || 7) / 7));
    return Math.round(r * f * (min || 0) / 50) * 50;
  };
  function H() { var m = S.me; if (!m.health) m.health = { days: {}, last: null, sources: {} }; if (!m.health.days) m.health.days = {}; return m.health; }
  function fmt(n) { return Math.round(n || 0).toLocaleString(S.lang); }

  App.stepsOf = function (d, ath) {
    ath = ath || S.me; d = d || App.today();
    var raw = (ath.health && ath.health.days && ath.health.days[d]) || {}, est = [], estSum = 0;
    (ath.sessions || []).forEach(function (s) { if (s.date === d && s.estSteps > 0) { est.push({ n: s.title, v: s.estSteps }); estSum += s.estSteps; } });
    var sync = raw.steps != null ? raw.steps : null, man = raw.man || 0, ov = raw.ov != null ? raw.ov : null;
    var any = sync != null || man || estSum || ov != null;
    return { any: any, sync: sync, man: man, est: est, estSum: estSum, ov: ov, extra: ov != null ? Math.max(0, ov - (sync || 0)) : man + estSum, total: ov != null ? ov : (sync || 0) + man + estSum };
  };
  App.stepsLine = function (d) {
    var x = App.stepsOf(d); if (!x.any) return '';
    if (x.ov != null) return fmt(x.ov) + ' (' + t('set by hand') + (x.sync != null ? ' · ' + t('Watch') + ' ' + fmt(x.sync) : '') + ')';
    var p = []; if (x.sync != null) p.push(t('Watch') + ' ' + fmt(x.sync));
    x.est.forEach(function (e) { p.push(e.n + ' ' + t('est.') + ' ' + fmt(e.v)); });
    if (x.man) p.push(t('manual') + ' ' + fmt(x.man));
    return p.length > 1 ? p.join(' + ') + ' = ' + fmt(x.total) : '';
  };
  // Everything that reads steps (today card, habits, charts, Sweatpoints, coach export) goes through healthDay → total
  App.healthDay = function (iso) {
    iso = iso || App.today();
    var h = S.me.health, raw = (h && h.days && h.days[iso]) || null, x = App.stepsOf(iso);
    if (!raw && !x.any) return null;
    var o = {}; Object.keys(raw || {}).forEach(function (k) { o[k] = raw[k]; });
    o.syncSteps = x.sync; o.extraSteps = x.extra; if (x.any) o.steps = x.total;
    return o;
  };

  // ---------- editor sheet ----------
  App.stepEditor = function (day) {
    day = day || App.today();
    var min = App.isoAdd(App.today(), -30);
    var s = App.sheet(App.sheetHead(t('Adjust steps'), t('A sync never removes your extra steps.')) +
      '<label class="field"><span class="label">' + esc(t('Day')) + '</span><input class="input" type="date" id="se-d" min="' + min + '" max="' + App.today() + '" value="' + day + '"></label>' +
      '<div class="grid2" style="margin:0 0 10px"><button class="btn sm" data-q="0">' + esc(t('Today')) + '</button><button class="btn sm" data-q="-1">' + esc(t('Yesterday')) + '</button></div>' +
      '<div class="card" id="se-info"></div>' +
      '<label class="field" style="margin-top:12px"><span class="label">' + esc(t('Extra steps (added by hand)')) + '</span><input class="input" id="se-man" inputmode="numeric" placeholder="0"></label>' +
      '<label class="field"><span class="label">' + esc(t('Set total instead (optional)')) + '</span><input class="input" id="se-ov" inputmode="numeric" placeholder="—"><span class="tiny muted">' + esc(t('Leave empty to use synced + extra.')) + '</span></label>' +
      '<p class="tiny muted">' + esc(t('Combat sessions without a watch can add estimated steps when you log them (Train → Log session).')) + '</p>' +
      '<div class="grid2"><button class="btn" id="se-clr">' + esc(t('Reset extras')) + '</button><button class="btn primary" id="se-save">' + I.check + esc(t('Save')) + '</button></div>');
    var el = s.el, di = el.querySelector('#se-d'), mi = el.querySelector('#se-man'), oi = el.querySelector('#se-ov');
    function load() {
      var d = di.value || App.today(), x = App.stepsOf(d);
      mi.value = x.man || ''; oi.value = x.ov != null ? x.ov : ''; info();
    }
    function info() {
      var d = di.value || App.today(), x = App.stepsOf(d), man = App.num(mi.value), ov = oi.value.trim() === '' ? null : App.num(oi.value);
      var tot = ov != null ? ov : (x.sync || 0) + man + x.estSum;
      el.querySelector('#se-info').innerHTML = '<div class="row between"><span class="small muted">' + esc(t('Synced (watch / phone)')) + '</span><b>' + (x.sync != null ? fmt(x.sync) : '—') + '</b></div>' +
        x.est.map(function (e) { return '<div class="row between"><span class="small muted">' + esc(e.n) + ' (' + esc(t('est.')) + ')</span><b>+' + fmt(e.v) + '</b></div>'; }).join('') +
        '<div class="row between"><span class="small muted">' + esc(t('manual')) + '</span><b>+' + fmt(man) + '</b></div>' +
        '<div class="row between" style="margin-top:6px;border-top:1px solid var(--line,#333);padding-top:6px"><span>' + esc(t('Total')) + (ov != null ? ' (' + esc(t('set by hand')) + ')' : '') + '</span><b id="se-tot">' + fmt(tot) + '</b></div>';
    }
    di.onchange = load; mi.oninput = info; oi.oninput = info;
    el.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { di.value = App.isoAdd(App.today(), +b.dataset.q); load(); }; });
    function store(man, ov) {
      var d = di.value || App.today(); if (d > App.today() || d < min) { App.toast(t('Day') + '?'); return false; }
      var h = H(), cur = h.days[d] = h.days[d] || {};
      if (man > 0) cur.man = Math.min(60000, Math.round(man)); else delete cur.man;
      if (ov != null && ov >= 0) cur.ov = Math.min(100000, Math.round(ov)); else delete cur.ov;
      if (!Object.keys(cur).length) delete h.days[d];
      App.save(); if (App.gameSweep) App.gameSweep(); s.close(); App.rerender(); App.toast(t('Steps saved') + ': ' + fmt(App.stepsOf(d).total));
      return true;
    }
    el.querySelector('#se-save').onclick = function () { store(App.num(mi.value), oi.value.trim() === '' ? null : App.num(oi.value)); };
    el.querySelector('#se-clr').onclick = function () { store(0, null); };
    load();
  };
  A['steps-edit'] = function (el) { App.stepEditor(el && el.dataset && el.dataset.d); };
  function btn(d, cls) { return '<button class="btn sm ' + (cls || '') + '" data-act="steps-edit"' + (d ? ' data-d="' + d + '"' : '') + '>' + I.edit + esc(t('Adjust steps')) + '</button>'; }
  App.stepsAdjustBtn = btn;
  function block() {
    var line = App.stepsLine();
    return '<div class="section steps-adj"><div class="row between" style="gap:8px"><span class="tiny muted grow">' + esc(line) + '</span>' + btn() + '</div></div>';
  }

  // ---------- hook views ----------
  var oToday = V.today;
  V.today = function () {
    var h = oToday.apply(this, arguments);
    var mk = '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Daily habits'));
    return h.indexOf(mk) !== -1 ? h.replace(mk, block() + mk) : h + block();
  };
  var oPlan = V.plan;
  V.plan = function (oid) {
    var h = oPlan.apply(this, arguments), o = App.owner && App.owner(oid);
    if (o && o !== S.me && oid !== 'me') return h; // client steps live on the client's phone
    var mk = '<div class="grid2" style="margin-top:14px"><button class="btn" data-act="change-plan"';
    var sec = '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Steps')) + '</h2>' + btn('', 'primary') + '</div><p class="tiny muted">' + esc(App.stepsLine() || (fmt(App.stepsOf().total) + ' ' + t('steps'))) + '</p></div>';
    return h.indexOf(mk) !== -1 ? h.replace(mk, sec + mk) : h + sec;
  };
  var oHealth = V.health;
  if (oHealth) V.health = function () { var h = oHealth.apply(this, arguments); return h.replace('<div class="grid3">', block() + '<div class="grid3">'); };
  if (V.progress) { var oProg = V.progress; V.progress = function () { var h = oProg.apply(this, arguments); var mk = '<a class="btn sm" href="#/health">' + I.heart + esc(t('Garmin / Apple Health')) + '</a>'; return h.replace(mk, btn() + mk); }; }

  // ---------- sport logger: date + watch-not-worn estimate ----------
  var oLog = App.sportLogger;
  App.sportLogger = function (pre) {
    var r = oLog.apply(this, arguments), sh = document.querySelector('.overlay:last-of-type .sheet'); if (!sh) return r;
    var save = sh.querySelector('#sl-save'), sub = sh.querySelector('.sheet-head p');
    var box = document.createElement('div');
    box.innerHTML = '<label class="field"><span class="label">' + esc(t('Date')) + '</span><input class="input" type="date" id="sl-date" min="' + App.isoAdd(App.today(), -30) + '" max="' + App.today() + '" value="' + App.today() + '"></label>' +
      '<div id="sl-wbox" style="display:none"><label class="row" style="gap:10px;margin:4px 0 8px"><input type="checkbox" id="sl-nowatch" style="width:22px;height:22px;accent-color:var(--accent)"><span>' + esc(t('Watch not worn — add estimated steps')) + '</span></label>' +
      '<label class="field" id="sl-estf" style="display:none"><span class="label">' + esc(t('Estimated steps')) + '</span><input class="input" id="sl-est" inputmode="numeric"><span class="tiny muted" id="sl-esth"></span></label></div>';
    save.parentNode.insertBefore(box, save);
    var typ = (pre && pre.type) || 'mma', touched = false, nw = sh.querySelector('#sl-nowatch'), est = sh.querySelector('#sl-est'), dt = sh.querySelector('#sl-date');
    function upd() {
      var on = !!App.STEP_RATES[typ]; sh.querySelector('#sl-wbox').style.display = on ? '' : 'none';
      sh.querySelector('#sl-estf').style.display = on && nw.checked ? '' : 'none';
      if (on) sh.querySelector('#sl-esth').textContent = t('Estimate: {r} steps/min × minutes, adjusted for intensity. You can change it.', { r: App.STEP_RATES[typ] });
      if (on && !touched) est.value = App.estSteps(typ, App.num(sh.querySelector('#sl-dur').value), +sh.querySelector('#sl-rpe').value);
    }
    sh.querySelectorAll('#sl-type button').forEach(function (b) { b.addEventListener('click', function () { typ = b.dataset.k; setTimeout(upd); }); });
    sh.querySelector('#sl-dur').addEventListener('input', upd); sh.querySelector('#sl-rpe').addEventListener('input', upd);
    nw.onchange = upd; est.oninput = function () { touched = true; };
    dt.onchange = function () { if (sub) sub.textContent = F.fmtDay(dt.value || App.today()); };
    var oSave = save.onclick;
    save.onclick = function () {
      var ath = S.me, n0 = ath.sessions.length, d = dt.value && dt.value <= App.today() ? dt.value : App.today(), add = App.STEP_RATES[typ] && nw.checked ? Math.min(30000, Math.round(App.num(est.value))) : 0;
      oSave.apply(this, arguments);
      if (ath.sessions.length > n0) {
        var s = ath.sessions[ath.sessions.length - 1];
        if (d !== App.today()) { s.date = d; s.endedAt = F.parseISO(d).getTime() + 20 * 3600e3; ath.sessions.sort(function (a, b) { return (a.endedAt || 0) - (b.endedAt || 0); }); }
        if (add > 0) s.estSteps = add;
        App.save(); if (App.gameSweep) App.gameSweep(); App.rerender();
        if (add > 0) App.toast('+' + fmt(add) + ' ' + t('steps') + ' (' + t('est.') + ')');
      }
    };
    upd();
    return r;
  };
})();
