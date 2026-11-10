/* Forged by Grace v2.9 — manual step editing + step estimates for combat sports without a watch.
   Synced steps (Shortcut / Garmin / Apple Health) stay in days[d].steps. Extras are stored apart:
   days[d].man = manual extra steps, days[d].ov = manual total override, session.estSteps = estimate from a logged sport session (toggle in Log sport session).
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
    'Combat sessions without a watch can add estimated steps when you log them (Train → Log session).': 'Vechtsport zonder horloge? Bij het loggen (Train → Sessie loggen) kun je geschatte stappen toevoegen.',
    'Add to my steps': 'Tel op bij mijn stappen', '≈ {n} steps': '≈ {n} stappen', 'Intense': 'Intensief',
    'Delete session': 'Sessie verwijderen', 'This also removes the estimated steps from that day.': 'De geschatte stappen van die dag gaan er ook af.',
    'Session removed': 'Sessie verwijderd' };
  window.FBG_I18N = window.FBG_I18N || {}; window.FBG_I18N.nl = window.FBG_I18N.nl || {};
  Object.keys(NL).forEach(function (k) { if (!window.FBG_I18N.nl[k]) window.FBG_I18N.nl[k] = NL[k]; });

  // Step-equivalents per minute at Licht / Medium / Intensief.
  // Combat and similar sports use ~90 / 120 / 140 (90 min MMA medium ≈ 10.800).
  // Cycling uses the same table as the cardio converter. Running follows cadence (~150 / 165 / 175).
  App.STEP_SPM = {
    mma: [90, 120, 140], bjj: [90, 120, 140], kickboxing: [90, 120, 140], boxing: [90, 120, 140],
    cycling: [130, 160, 175], bike: [130, 160, 175],
    running: [150, 165, 175], walking: [100, 115, 130],
    swimming: [90, 120, 150], team: [90, 120, 140], match: [100, 130, 150], other: [80, 110, 130],
    cross: [160, 180, 200], row: [140, 160, 180]
  };
  App.STEP_RATES = App.STEP_SPM; // alias so older calls still resolve a sport
  App.stepLevel = function (rpe) { var r = +rpe || 7; return r <= 4 ? 0 : r <= 7 ? 1 : 2; };
  App.stepSpm = function (type, rpe, level) {
    var rates = App.STEP_SPM[type]; if (!rates) return 0;
    var lv = level == null ? App.stepLevel(rpe) : Math.max(0, Math.min(2, +level));
    return rates[lv];
  };
  App.estSteps = function (type, min, rpe, level) {
    var spm = App.stepSpm(type, rpe, level); if (!spm) return 0;
    return Math.round(spm * (min || 0) / 50) * 50;
  };
  function H() { var m = S.me; if (!m.health) m.health = { days: {}, last: null, sources: {} }; if (!m.health.days) m.health.days = {}; return m.health; }
  function fmt(n) { return Math.round(n || 0).toLocaleString(S.lang); }

  App.stepsOf = function (d, ath) {
    ath = ath || S.me; d = d || App.today();
    var raw = (ath.health && ath.health.days && ath.health.days[d]) || {}, est = [], estSum = 0;
    (ath.sessions || []).forEach(function (s) { if (s.date === d && s.estSteps > 0) { est.push({ n: s.title, v: s.estSteps, sid: s.id }); estSum += s.estSteps; } });
    (raw.cx || []).forEach(function (x, i) { est.push({ n: x.n + ' ' + x.min + ' min', v: x.v, cx: 1, i: i }); estSum += x.v; });
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
        x.est.map(function (e) { return '<div class="row between"><span class="small muted">' + esc(e.n) + ' (' + esc(t('est.')) + ')</span><span><b>+' + fmt(e.v) + '</b> <button class="icon-btn sm" data-act="est-del" data-d="' + d + '"' + (e.sid ? ' data-sid="' + esc(e.sid) + '"' : ' data-cx="' + e.i + '"') + ' aria-label="' + esc(t('Delete')) + '">' + I.trash + '</button></span></div>'; }).join('') +
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

  // ---------- sport logger: date, intensity, live step estimate, add-to-total toggle ----------
  function lvlName(i) { return [t('Light'), 'Medium', t('Intense')][i]; }
  App.removeSession = function (id) {
    var ath = S.me, i = -1;
    (ath.sessions || []).forEach(function (s, k) { if (s.id === id) i = k; });
    if (i < 0) return false;
    ath.sessions.splice(i, 1);
    App.save(); if (App.gameSweep) App.gameSweep(); App.rerender();
    return true;
  };
  App.sessExtra = function (s) { return s && s.estSteps > 0 ? ' · +' + fmt(s.estSteps) + ' ' + t('steps') : ''; };
  App.sessActions = function (s) {
    if (!s || (s.type !== 'sport' && !(s.estSteps > 0))) return '';
    return '<button class="icon-btn sm" data-act="sess-del" data-id="' + esc(s.id) + '" aria-label="' + esc(t('Delete session')) + '">' + I.trash + '</button>';
  };
  A['sess-del'] = function (el) {
    var id = el && el.dataset && el.dataset.id;
    App.confirm(t('Delete session'), t('This also removes the estimated steps from that day.'), t('Delete'), true).then(function (ok) {
      if (ok && App.removeSession(id)) App.toast(t('Session removed'));
    });
  };
  A['est-del'] = function (el) {
    var d = el.dataset.d, sid = el.dataset.sid, cxi = el.dataset.cx;
    App.confirm(t('Delete session'), t('This also removes the estimated steps from that day.'), t('Delete'), true).then(function (ok) {
      if (!ok) return;
      if (sid) {
        if (App.removeSession(sid)) App.toast(t('Session removed'));
        return;
      }
      var h = H(), cur = h.days[d]; if (!cur || !cur.cx) return;
      cur.cx.splice(+cxi, 1); if (!cur.cx.length) delete cur.cx;
      if (!Object.keys(cur).length) delete h.days[d];
      App.save(); if (App.gameSweep) App.gameSweep(); App.rerender(); App.toast(t('Session removed'));
    });
  };
  var oLog = App.sportLogger;
  App.sportLogger = function (pre) {
    var r = oLog.apply(this, arguments), sh = document.querySelector('.overlay:last-of-type .sheet'); if (!sh) return r;
    var save = sh.querySelector('#sl-save'), sub = sh.querySelector('.sheet-head p');
    var box = document.createElement('div');
    box.innerHTML = '<label class="field"><span class="label">' + esc(t('Date')) + '</span><input class="input" type="date" id="sl-date" min="' + App.isoAdd(App.today(), -30) + '" max="' + App.today() + '" value="' + App.today() + '"></label>' +
      '<div class="row" id="sl-lv" style="gap:6px;margin:8px 0;flex-wrap:wrap"></div>' +
      '<p class="small" id="sl-estline" style="margin:4px 0 8px"></p>' +
      '<label class="row" id="sl-addrow" style="gap:10px;margin:4px 0 12px;align-items:center"><input type="checkbox" id="sl-addsteps" checked style="width:22px;height:22px;accent-color:var(--accent)"><span>' + esc(t('Add to my steps')) + '</span></label>';
    save.parentNode.insertBefore(box, save);
    var typ = (pre && pre.type) || 'mma', dt = sh.querySelector('#sl-date'), addEl = sh.querySelector('#sl-addsteps'), rpeEl = sh.querySelector('#sl-rpe'), durEl = sh.querySelector('#sl-dur');
    function mins() { return App.num(durEl.value); }
    function rpe() { return +rpeEl.value || 7; }
    function drawLv() {
      var lv = App.stepLevel(rpe());
      sh.querySelector('#sl-lv').innerHTML = [0, 1, 2].map(function (i) {
        var spm = App.stepSpm(typ, null, i);
        return '<button type="button" class="btn sm' + (i === lv ? ' primary' : '') + '" data-lv="' + i + '">' + esc(lvlName(i)) + (spm ? ' (' + spm + '/min)' : '') + '</button>';
      }).join('');
      sh.querySelectorAll('#sl-lv [data-lv]').forEach(function (b) {
        b.onclick = function () { rpeEl.value = [3, 6, 9][ +b.dataset.lv ]; rpeEl.dispatchEvent(new Event('input', { bubbles: true })); upd(); };
      });
    }
    function upd() {
      var on = !!App.stepSpm(typ, 7), n = App.estSteps(typ, mins(), rpe());
      sh.querySelector('#sl-addrow').style.display = on ? '' : 'none';
      sh.querySelector('#sl-estline').style.display = on ? '' : 'none';
      if (on) sh.querySelector('#sl-estline').innerHTML = t('≈ {n} steps', { n: fmt(n) }).replace(fmt(n), '<b style="color:#d4af37">' + fmt(n) + '</b>') +
        '<span class="tiny muted"> · ' + App.stepSpm(typ, rpe()) + '/min</span>';
      drawLv();
    }
    sh.querySelectorAll('#sl-type button').forEach(function (b) { b.addEventListener('click', function () { typ = b.dataset.k; setTimeout(upd); }); });
    durEl.addEventListener('input', upd); rpeEl.addEventListener('input', upd);
    dt.onchange = function () { if (sub) sub.textContent = F.fmtDay(dt.value || App.today()); };
    var oSave = save.onclick;
    save.onclick = function () {
      var ath = S.me, n0 = ath.sessions.length, d = dt.value && dt.value <= App.today() ? dt.value : App.today();
      var add = App.stepSpm(typ, rpe()) && addEl.checked ? Math.min(30000, App.estSteps(typ, mins(), rpe())) : 0;
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

  // v3.29: own step goal — only for the coach's own account (clients' goals stay coach-set)
  function ownAcct() { var C = App.cloud; return S.role === 'coach' || S.me.isCoach || (C && C.role && C.role() === 'coach'); }
  A['step-goal'] = function () {
    if (!ownAcct()) return;
    var s = App.sheet('<b style="color:#d4af37">👣 Mijn stappendoel</b><p class="tiny muted">Alleen voor jouw eigen account.</p><input class="input" id="sg-v" inputmode="numeric" value="' + App.stepGoal(S.me) + '"><div class="row" style="gap:6px;margin:8px 0;flex-wrap:wrap">' + [5000, 6000, 7000, 8000, 10000, 12000].map(function (n) { return '<button class="btn sm" data-sg="' + n + '">' + n.toLocaleString('nl-NL') + '</button>'; }).join('') + '</div><button class="btn primary block" id="sg-ok">Opslaan</button>', { label: 'Stappendoel' });
    s.el.querySelectorAll('[data-sg]').forEach(function (b) { b.onclick = function () { s.el.querySelector('#sg-v').value = b.dataset.sg; }; });
    s.el.querySelector('#sg-ok').onclick = function () { var v = Math.round(App.num(s.el.querySelector('#sg-v').value)); if (!(v >= 1000 && v <= 50000)) return App.toast('Kies tussen 1.000 en 50.000'); S.me.stepGoal = v; App.save(); s.close(); App.rerender(); App.toast('Stappendoel: ' + v.toLocaleString('nl-NL') + ' ✓'); };
  };
  var oMoreSG = V.more; V.more = function () { var h = oMoreSG.apply(this, arguments); if (!ownAcct()) return h;
    return '<div class="card row" style="margin-bottom:12px"><div class="grow"><b>👣 Mijn stappendoel</b><div class="tiny muted">' + App.stepGoal(S.me).toLocaleString('nl-NL') + ' per dag · alleen jouw account</div></div><button class="btn sm" data-act="step-goal">Wijzigen</button></div>' + h; };

  // v3.30: prominent steps card on Today + cardio → step-equivalents (stored per day in health.days[d].cx, never touched by Shortcut sync)
  var CX = { bike: ['🚴', 'Fietsen', App.STEP_SPM.cycling], cross: ['🏃', 'Crosstrainer', App.STEP_SPM.cross], row: ['🚣', 'Roeien', App.STEP_SPM.row] }, LV = [t('Light'), 'Medium', t('Intense')];
  function stepsCard() {
    var x = App.stepsOf(), g = App.stepGoal(S.me), tot = Math.round(x.total || 0), pc = Math.min(100, Math.round(tot / g * 100)), left = Math.max(0, g - tot);
    var cx = x.est.filter(function (e) { return e.cx; }).reduce(function (a, e) { return a + e.v; }, 0), other = x.estSum - cx + (x.man || 0);
    return '<div class="card" id="steps-card" style="border:1px solid #d4af37;margin:12px 0;cursor:pointer" data-act="go" data-p="health">' +
      '<div class="row between"><b style="color:#d4af37">👣 Stappen vandaag</b><span class="tiny muted">doel ' + fmt(g) + '</span></div>' +
      '<div style="font-size:34px;font-weight:800;margin:4px 0">' + fmt(tot) + '</div>' +
      '<div style="height:10px;background:#222;border-radius:5px;overflow:hidden"><div style="height:10px;width:' + pc + '%;background:linear-gradient(90deg,#b8932e,#f1d27a)"></div></div>' +
      '<div class="row between" style="margin-top:6px"><span class="small">' + (left ? 'Nog <b style="color:#d4af37">' + fmt(left) + '</b> stappen' : '🏆 Doel gehaald!') + '</span><span class="tiny muted">' + pc + '%</span></div>' +
      '<div class="tiny muted" style="margin-top:4px">⌚ Horloge/telefoon ' + (x.sync != null ? fmt(x.sync) : '—') + ' · 🚴 Omgerekend cardio ' + fmt(cx) + (other ? ' · ✍️ Overig ' + fmt(other) : '') + (x.ov != null ? ' · (handmatig ingesteld)' : '') + '</div>' +
      '<button class="btn sm primary" data-act="cx-add" style="margin-top:10px">🚴 Fietsen toevoegen</button></div>';
  }
  App.stepsCard = stepsCard;
  A['cx-add'] = function (el, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    var typ = 'bike', lv = 1;
    var s = App.sheet('<div id="cxs"></div>', { label: 'Cardio toevoegen' }), root = s.el.querySelector('#cxs');
    function draw() {
      var spm = CX[typ][2][lv], mins = App.num((root.querySelector('#cx-m') || {}).value) || 20;
      root.innerHTML = '<b style="color:#d4af37">' + CX[typ][0] + ' Cardio → stappen</b><div class="row" style="gap:6px;margin:10px 0;flex-wrap:wrap">' + Object.keys(CX).map(function (k) { return '<button class="btn sm ' + (k === typ ? 'primary' : '') + '" data-t="' + k + '">' + CX[k][0] + ' ' + CX[k][1] + '</button>'; }).join('') + '</div>' +
        '<label class="field"><span class="label">Minuten</span><input class="input" id="cx-m" inputmode="numeric" value="' + mins + '"></label>' +
        '<div class="row" style="gap:6px;margin:10px 0">' + LV.map(function (n, i) { return '<button class="btn sm ' + (i === lv ? 'primary' : '') + '" data-l="' + i + '">' + n + ' (' + CX[typ][2][i] + '/min)</button>'; }).join('') + '</div>' +
        '<p class="small" id="cx-r">= <b style="color:#d4af37">' + fmt(mins * spm) + '</b> stappen</p><button class="btn primary block" id="cx-ok">Toevoegen</button>';
      root.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { typ = b.dataset.t; draw(); }; });
      root.querySelectorAll('[data-l]').forEach(function (b) { b.onclick = function () { lv = +b.dataset.l; draw(); }; });
      root.querySelector('#cx-m').oninput = function () { root.querySelector('#cx-r').innerHTML = '= <b style="color:#d4af37">' + fmt((App.num(this.value) || 0) * CX[typ][2][lv]) + '</b> stappen'; };
      root.querySelector('#cx-ok').onclick = function () {
        var m = Math.round(App.num(root.querySelector('#cx-m').value)); if (!(m > 0 && m <= 300)) return App.toast('Vul 1–300 minuten in');
        var h = H(), d = App.today(), cur = h.days[d] = h.days[d] || {}; cur.cx = cur.cx || [];
        cur.cx.push({ t: typ, n: CX[typ][1], min: m, lvl: lv, v: m * CX[typ][2][lv], at: Date.now() });
        App.save(); if (App.gameSweep) App.gameSweep(); s.close(); App.rerender(); App.toast('+' + fmt(m * CX[typ][2][lv]) + ' stappen ✓');
      };
    }
    draw();
  };
  var oTodayC = V.today; V.today = function () {
    var h = oTodayC.apply(this, arguments), k = h.indexOf('<div class="hero');
    return k < 0 ? stepsCard() + h : h.slice(0, k) + stepsCard() + h.slice(k);
  };
})();
