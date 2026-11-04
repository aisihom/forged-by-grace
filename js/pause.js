/* Forged by Grace v3.23 — pause / resume workouts. In-progress workout is auto-saved to S.me.wip (localStorage + cloud "extra"). */
(function () {
  'use strict';
  var App = window.App, S = App.S, A = App.acts, V = App.views, esc = App.esc, t = App.t;
  function me() { return S.me || {}; }
  var tmr = null;
  App.wipSave = function (debounce) {
    var W = App.getW(); if (!W) return;
    clearTimeout(tmr);
    var go = function () { var w = App.getW(); if (!w) return; var m = me(); m.wip = JSON.parse(JSON.stringify(w)); m.wip.savedAt = Date.now(); App.save(); };
    if (debounce) tmr = setTimeout(go, 700); else go();
  };
  App.wipClear = function () { clearTimeout(tmr); if (me().wip) { delete me().wip; App.save(); } };
  function stats(w) {
    var ex = w.items.length, exDone = w.items.filter(function (it) { return it.sets.length && it.sets.some(function (s) { return s.done; }); }).length;
    var sets = 0, setsDone = 0; w.items.forEach(function (it) { sets += it.sets.length; setsDone += it.sets.filter(function (s) { return s.done; }).length; });
    return { ex: ex, exDone: exDone, sets: sets, setsDone: setsDone };
  }
  function hm(ts) { var d = new Date(ts); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function pauseNow() {
    var W = App.getW(); if (!W) return;
    W.pausedAt = Date.now(); App.wipSave();
    App.setW(null); clearInterval(App._clock); App.stopRest();
    var sc = document.getElementById('logger'); if (sc) sc.remove();
  }
  A['w-pause'] = function () { pauseNow(); App.rerender(); App.toast(t('Workout paused — resume any time')); };
  // safety: save when app goes to background / closes
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') App.wipSave(); });
  window.addEventListener('pagehide', function () { App.wipSave(); });
  function load() {
    var w = JSON.parse(JSON.stringify(me().wip));
    var p = w.pausedAt || w.savedAt || Date.now(); // accidental close: count from last save
    w.pausedAt = p; return w;
  }
  A['w-resume'] = function () {
    if (!me().wip) return; var w = load();
    w.pausedMs = (w.pausedMs || 0) + Math.max(0, Date.now() - w.pausedAt); w.pausedAt = null;
    App.setW(w); App.renderLogger();
  };
  A['w-wipfinish'] = function () {
    if (!me().wip) return;
    App.confirm(t('Finish workout?'), t('Only the sets you ticked are saved.'), t('Finish'), false).then(function (ok) {
      if (!ok) return; var w = load(); App.setW(w); A['w-finish']();
    });
  };
  A['w-wipdiscard'] = function () {
    App.confirm(t('Discard workout?'), t('Sets you logged in this session will be lost.'), t('Discard'), true).then(function (ok) { if (ok) { App.wipClear(); App.rerender(); } });
  };
  var origStart = A['start-workout'];
  A['start-workout'] = function (el) {
    if (!me().wip || App.getW()) return origStart(el);
    App.closeSheets && App.closeSheets();
    App.confirm(t('You have a paused workout'), t('Resume it, or discard it and start a new one?'), t('Discard & start new'), true).then(function (ok) { if (ok) { App.wipClear(); origStart(el); } else A['w-resume'](); });
  };
  App.wipCard = function () {
    var w = me().wip; if (!w || !w.items || App.getW()) return '';
    var st = stats(w), p = w.pausedAt || w.savedAt, prev = w.date !== App.today();
    var el = Math.max(0, Math.round(((p || Date.now()) - w.startedAt - (w.pausedMs || 0)) / 60000));
    return '<div class="hero" style="border:1px solid var(--accent);margin:14px 0"><p class="kicker" style="margin:0">⏸ ' + esc(t('Paused workout')) + (prev ? ' · ' + esc(F_day(w.date)) : '') + '</p>' +
      '<h2 class="h2" style="margin-top:6px">' + esc(t(w.title || 'Workout')) + '</h2>' +
      '<p class="small muted">' + st.exDone + '/' + st.ex + ' ' + esc(t('exercises')) + ' · ' + st.setsDone + '/' + st.sets + ' ' + esc(t('sets')) + ' · ' + el + ' min' + (p ? ' · ' + esc(t('paused at {t}', { t: hm(p) })) : '') + '</p>' +
      '<div class="progress" style="margin:8px 0 12px"><div style="width:' + (st.sets ? st.setsDone / st.sets * 100 : 0) + '%"></div></div>' +
      '<button class="btn primary lg block" data-act="w-resume">▶ ' + esc(t('Resume workout')) + '</button>' +
      '<div class="grid2" style="margin-top:8px"><button class="btn sm" data-act="w-wipfinish">✓ ' + esc(t('Finish as is')) + '</button><button class="btn sm ghost" data-act="w-wipdiscard">' + esc(t('Discard')) + '</button></div></div>';
  };
  function F_day(d) { try { return App.F.fmtDay(d); } catch (e) { return d; } }
  function wrap(name, marker) {
    var o = V && V[name]; if (!o) return;
    V[name] = function () { var h = o.apply(this, arguments), c = App.wipCard(); if (!c) return h; var i = h.indexOf(marker); return i === -1 ? c + h : h.slice(0, i) + c + h.slice(i); };
  }
  wrap('today', '<div class="hero'); wrap('train', '<div class="card">');
  var NL = { 'Pause': 'Pauzeer', 'Workout paused — resume any time': 'Training gepauzeerd — ga verder wanneer je wilt', 'Finish workout?': 'Training afronden?', 'Only the sets you ticked are saved.': 'Alleen de afgevinkte sets worden opgeslagen.',
    'You have a paused workout': 'Je hebt een gepauzeerde training', 'Resume it, or discard it and start a new one?': 'Ga verder, of verwijder hem en start een nieuwe?', 'Discard & start new': 'Verwijderen & nieuwe starten',
    'Paused workout': 'Gepauzeerde training', 'paused at {t}': 'gepauzeerd om {t}', 'Resume workout': 'Doorgaan met workout', 'Finish as is': 'Afronden zoals het is' };
  var ES = { 'Pause': 'Pausar', 'Workout paused — resume any time': 'Entreno en pausa — sigue cuando quieras', 'Finish workout?': '¿Terminar entreno?', 'Only the sets you ticked are saved.': 'Solo se guardan las series marcadas.',
    'You have a paused workout': 'Tienes un entreno en pausa', 'Resume it, or discard it and start a new one?': '¿Continuar, o descartarlo y empezar otro?', 'Discard & start new': 'Descartar y empezar nuevo',
    'Paused workout': 'Entreno en pausa', 'paused at {t}': 'pausado a las {t}', 'Resume workout': 'Continuar entreno', 'Finish as is': 'Terminar así' };
  var I18 = window.FBG_I18N; I18.nl = I18.nl || {}; I18.es = I18.es || {};
  Object.keys(NL).forEach(function (k) { I18.nl[k] = I18.nl[k] || NL[k]; }); Object.keys(ES).forEach(function (k) { I18.es[k] = I18.es[k] || ES[k]; });
})();
