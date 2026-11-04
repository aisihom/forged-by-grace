/* Forged by Grace v3.24 — per-exercise client notes in the workout logger. */
(function () {
  'use strict';
  var App = window.App, S = App.S, A = App.acts, esc = App.esc, t = App.t, D = App.D;
  function name(id) { var e = (App.D || {}).BY_ID && App.D.BY_ID[id]; return e ? e.name : id; }
  function pain(x) { return /pijn|pain|blessure|dolor/i.test(x || ''); }
  App.lastNote = function (exId) {
    var ss = (S.me && S.me.sessions) || [];
    for (var i = ss.length - 1; i >= 0; i--) { var it = (ss[i].items || []).filter(function (x) { return x.ex === exId && x.cnote; })[0]; if (it) return { note: it.cnote, date: ss[i].date }; }
    return null;
  };
  var CHIPS = ['Too heavy', 'Too light', 'Pain', 'Went well'];
  App.exNoteHtml = function (it, ii) {
    var ln = App.lastNote(it.ex), h = '<div class="ex-note" style="margin-top:8px">';
    if (ln) h += '<div class="tiny" style="margin-bottom:4px;color:' + (pain(ln.note) ? '#ffb347' : 'var(--muted,#aaa)') + '">' + esc(t('Last time')) + ' (' + esc(App.F.fmtDay(ln.date)) + '): ' + (pain(ln.note) ? '⚠️ ' : '💬 ') + esc(ln.note) + '</div>';
    h += '<label class="tiny" style="display:block;color:var(--accent);margin-bottom:2px">💬 ' + esc(t('Note')) + '</label>' +
      '<input class="input" style="padding:8px 10px;font-size:14px" data-cn="' + ii + '" value="' + esc(it.cnote || '') + '" placeholder="' + esc(t('How did it go? e.g. too heavy, pain…')) + '">' +
      '<div class="chips" style="margin-top:6px;gap:6px">' + CHIPS.map(function (c) { return '<button class="chip sm" data-act="w-chip" data-i="' + ii + '" data-t="' + esc(t(c)) + '">' + esc(t(c)) + '</button>'; }).join('') + '</div></div>';
    return h;
  };
  A['w-chip'] = function (el) {
    var W = App.getW(); if (!W) return; var it = W.items[+el.dataset.i]; if (!it) return;
    var cur = (it.cnote || '').trim(), add = el.dataset.t;
    if (cur.toLowerCase().indexOf(add.toLowerCase()) === -1) it.cnote = cur ? cur + ', ' + add.toLowerCase() : add;
    var inp = document.querySelector('[data-cn="' + el.dataset.i + '"]'); if (inp) { inp.value = it.cnote; if (/pain|pijn|dolor/i.test(add)) { inp.focus(); } }
    if (App.wipSave) App.wipSave();
  };
  App.sessNotesHtml = function (s) {
    var n = (s.items || []).filter(function (it) { return it.cnote; });
    if (!n.length) return '';
    return n.map(function (it) { return '<div class="tiny" style="margin-top:3px;color:' + (pain(it.cnote) ? '#ffb347' : 'var(--accent)') + '">' + (pain(it.cnote) ? '⚠️ ' : '💬 ') + esc(name(it.ex)) + ': ' + esc(it.cnote) + '</div>'; }).join('');
  };
  var NL = { 'Note': 'Opmerking', 'How did it go? e.g. too heavy, pain…': 'Hoe ging het? bv. te zwaar, pijn…', 'Too heavy': 'Te zwaar', 'Too light': 'Te licht', 'Pain': 'Pijn', 'Went well': 'Goed gegaan', 'Last time': 'Vorige keer' };
  var ES = { 'Note': 'Nota', 'How did it go? e.g. too heavy, pain…': '¿Qué tal? p. ej. muy pesado, dolor…', 'Too heavy': 'Muy pesado', 'Too light': 'Muy ligero', 'Pain': 'Dolor', 'Went well': 'Fue bien', 'Last time': 'La última vez' };
  var I = window.FBG_I18N; I.nl = I.nl || {}; I.es = I.es || {};
  Object.keys(NL).forEach(function (k) { I.nl[k] = I.nl[k] || NL[k]; }); Object.keys(ES).forEach(function (k) { I.es[k] = I.es[k] || ES[k]; });
})();
