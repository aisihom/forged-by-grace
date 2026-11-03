/* Forged by Grace v3.5 — water tracker + water Sweatpoints. */
(function () {
  'use strict';
  var App = window.App, S = App.S, esc = App.esc, t = App.t, V = App.views, A = App.acts;
  var NL = { 'Water': 'Water', 'Daily goal': 'Dagdoel', 'Goal reached! 💧': 'Doel gehaald! 💧', 'Change goal': 'Doel aanpassen', 'Daily water goal (liters)': 'Dagelijks waterdoel (liters)', 'Save': 'Opslaan',
    'Water: +0.5 L (max 4× a day)': 'Water: +0,5 L (max 4× per dag)', 'Daily water goal reached': 'Dagelijks waterdoel gehaald', 'Water logged': 'Water gedronken', 'Water goal': 'Waterdoel',
    'Limited offer – while stocks last': 'Tijdelijke aanbieding – op=op', '+5 SP per 0.5 L (max 4×) · +10 SP at your goal': '+5 SP per 0,5 L (max 4×) · +10 SP bij je doel' };
  window.FBG_I18N = window.FBG_I18N || {}; window.FBG_I18N.nl = window.FBG_I18N.nl || {};
  Object.keys(NL).forEach(function (k) { if (!window.FBG_I18N.nl[k]) window.FBG_I18N.nl[k] = NL[k]; });
  var STEP = 500, TAP_PTS = 5, TAP_MAX = 4, GOAL_PTS = 10, CAP = 150;
  App.WATER = { step: STEP, tapPts: TAP_PTS, tapMax: TAP_MAX, goalPts: GOAL_PTS };
  function me() { return S.me; }
  function goal(a) { return a.waterGoal || 3000; }
  function L(ml) { return (ml / 1000).toLocaleString(S.lang === 'en' ? 'en' : 'nl', { maximumFractionDigits: 1 }) + ' L'; }
  function gm() { return S.role === 'athlete' && App.game ? App.game() : null; }
  function give(g, key, day, pts, label) {
    if (g.got[key]) return 0; var used = g.daySp[day] || 0, n = Math.min(pts, Math.max(0, CAP - used)); g.got[key] = n || -1; if (n <= 0) return 0;
    g.daySp[day] = used + n; g.sp += n; g.total = (g.total || 0) + n; g.log.unshift({ d: day, ts: Date.now(), k: key.split(':')[0], pts: n, l: label, wk: key }); if (g.log.length > 300) g.log.length = 300; return n;
  }
  function take(g, key, day) {
    var v = g.got[key]; if (!v) return 0; delete g.got[key]; if (v < 0) return 0;
    var i = g.log.findIndex(function (x) { return x.wk === key; }); if (i !== -1) g.log.splice(i, 1);
    g.sp = Math.max(0, g.sp - v); g.total = Math.max(0, (g.total || 0) - v); g.daySp[day] = Math.max(0, (g.daySp[day] || 0) - v); return v;
  }
  App.waterSync = function (day) {
    var a = me(), g = gm(); if (!g) return 0; var ml = (a.water && a.water[day]) || 0, taps = Math.min(TAP_MAX, Math.floor(ml / STEP)), d = 0;
    for (var k = 0; k < TAP_MAX; k++) { var key = 'wa:' + day + ':' + k; if (k < taps) d += give(g, key, day, TAP_PTS, 'Water logged'); else d -= take(g, key, day); }
    if (ml >= goal(a)) d += give(g, 'wg:' + day, day, GOAL_PTS, 'Water goal'); else d -= take(g, 'wg:' + day, day);
    return d;
  };
  function card() {
    var a = me(), iso = App.foodDate || App.today(), ml = (a.water && a.water[iso]) || 0, G = goal(a), pc = Math.min(100, Math.round(ml / G * 100));
    return '<div class="card water-card"><div class="row between"><div><div class="kicker">💧 ' + esc(t('Water')) + '</div><div class="wt-tot"><b>' + L(ml) + '</b> <span class="muted">/ ' + L(G) + '</span></div></div>' +
      '<button class="btn sm ghost" data-act="water-goal">' + esc(t('Change goal')) + '</button></div>' +
      '<div class="bar-track" style="margin:8px 0"><div class="bar-fill" style="width:' + pc + '%;background:var(--gold,#d4af37)"></div></div>' +
      (ml >= G ? '<div class="small" style="color:var(--gold,#d4af37)">' + esc(t('Goal reached! 💧')) + '</div>' : '') +
      '<div class="row" style="gap:8px;margin-top:8px"><button class="btn ghost" data-act="water-sub" style="flex:1"' + (ml ? '' : ' disabled') + '>− 0,5 L</button><button class="btn primary lg" data-act="water-add" style="flex:2">+ 0,5 L</button></div>' +
      (S.role === 'athlete' ? '<p class="tiny muted" style="margin:6px 0 0">' + esc(t('+5 SP per 0.5 L (max 4×) · +10 SP at your goal')) + '</p>' : '') + '</div>';
  }
  var oFood = V.food;
  V.food = function () { var h = oFood.apply(this, arguments), i = h.indexOf('<div class="grid3 add-row"'); return i === -1 ? h + card() : h.slice(0, i) + card() + h.slice(i); };
  function chg(n) { var a = me(), iso = App.foodDate || App.today(); a.water = a.water || {}; a.water[iso] = Math.max(0, (a.water[iso] || 0) + n); if (!a.water[iso]) delete a.water[iso];
    var d = App.waterSync(iso); App.save(); App.rerender(); App.toast((n > 0 ? '💧 +0,5 L' : '−0,5 L') + (d ? ' · ' + (d > 0 ? '+' : '') + d + ' SP' : '')); }
  A['water-add'] = function () { chg(STEP); };
  A['water-sub'] = function () { chg(-STEP); };
  A['water-goal'] = function () {
    var s = App.sheet(App.sheetHead(t('Water goal'), '') + '<label class="field"><span class="label">' + esc(t('Daily water goal (liters)')) + '</span><input class="input" id="wg-in" type="number" step="0.5" min="1" max="8" inputmode="decimal" value="' + goal(me()) / 1000 + '"></label><button class="btn primary lg block" id="wg-ok">' + esc(t('Save')) + '</button>');
    document.getElementById('wg-ok').onclick = function () { var v = parseFloat(String(document.getElementById('wg-in').value).replace(',', '.')); if (!(v >= 1 && v <= 8)) return; me().waterGoal = Math.round(v * 2) * 500; App.waterSync(App.foodDate || App.today()); App.save(); s.close(); App.rerender(); };
  };
})();
