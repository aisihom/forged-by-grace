/* Forged by Grace v3.15 — workout logger: remove sets (with undo) + "🔄 Wissel oefening" (swap exercise, session or plan). */
(function () {
  'use strict';
  var App = window.App, S = App.S, D = App.D || window.FBG_DATA, A = App.acts, I = App.I || {}, esc = App.esc, t = App.t;
  function lib() { return (App.D || window.FBG_DATA || {}); }

  // ---- remove a set (planned or logged) with undo ----
  var undoT = null;
  A['w-delset'] = function (el) {
    var W = App.getW(); if (!W) return;
    var p = el.dataset.k.split(':'), ii = +p[0], si = +p[1], it = W.items[ii]; if (!it) return;
    var removed = it.sets.splice(si, 1)[0]; App.renderLogger();
    var bar = document.querySelector('.undo-bar'); if (bar) bar.remove(); clearTimeout(undoT);
    bar = document.createElement('div'); bar.className = 'undo-bar';
    bar.innerHTML = '<span>' + esc(t('Set removed')) + '</span><button id="undo-set">' + esc(t('Undo')) + '</button>';
    document.body.appendChild(bar);
    bar.querySelector('#undo-set').onclick = function () { var w = App.getW(); if (w && w.items[ii] === it) { it.sets.splice(si, 0, removed); App.renderLogger(); } bar.remove(); };
    undoT = setTimeout(function () { bar.remove(); }, 5000);
  };

  // ---- restrictions from coach notes / flags / plan.avoid ----
  App.exRestrictions = function () {
    var me = S.me || {}, plan = me.plan || {}, txt = JSON.stringify([plan.notes || [], plan.flags || [], (me.profile || {}).flags || [], (me.profile || {}).notes || '', (me.profile || {}).injuries || '']).toLowerCase();
    var avoid = (plan.avoid || []).slice(), pats = [];
    if (/(geen|no|niet|sin)\s+(\w+\s+)?squat/.test(txt)) { pats.push('squat'); avoid.push('bulgarian-split-squat'); }
    if (/(geen|no|niet)\s+(zware\s+|heavy\s+)?deadlift/.test(txt)) avoid.push('deadlift');
    return { ids: avoid, patterns: pats };
  };
  App.exAllowed = function (ex, R) { R = R || App.exRestrictions(); return R.ids.indexOf(ex.id) === -1 && R.patterns.indexOf(ex.pattern) === -1; };

  A['w-swap'] = function (el) {
    var W = App.getW(); if (!W) return;
    var ub = document.querySelector('.undo-bar'); if (ub) ub.remove();
    var ii = +el.dataset.i, it = W.items[ii], DD = lib(), cur = DD.BY_ID[it.ex] || {}, R = App.exRestrictions();
    var mode = ((S.me || {}).profile || {}).mode, equip = DD.MODES && DD.MODES[mode] ? DD.MODES[mode].equip : null;
    var muscles = []; DD.EXERCISES.forEach(function (e) { if (muscles.indexOf(e.muscle) === -1) muscles.push(e.muscle); });
    var s = App.sheet(App.sheetHead(t('Swap exercise'), t('Replace {n}. Alternatives for the same movement are shown first.', { n: cur.name || it.ex })) +
      '<input class="input" id="swq" type="search" placeholder="' + esc(t('Search exercise or muscle')) + '">' +
      '<div class="chips" id="swm" style="margin:10px 0"><button class="chip sm on" data-m="">' + esc(t('All')) + '</button>' + muscles.map(function (m) { return '<button class="chip sm" data-m="' + esc(m) + '">' + esc(t(m)) + '</button>'; }).join('') + '</div>' +
      (R.ids.length || R.patterns.length ? '<p class="tiny muted">⚠️ ' + esc(t('Exercises your coach ruled out are hidden.')) + '</p>' : '') +
      '<div id="swres"></div>');
    var m = '';
    function score(e) { return (e.pattern === cur.pattern ? 0 : e.muscle === cur.muscle ? 1 : 2) + (equip && !e.equip.some(function (q) { return equip.indexOf(q) !== -1; }) ? 3 : 0); }
    function render() {
      var q = s.el.querySelector('#swq').value.toLowerCase();
      var list = DD.EXERCISES.filter(function (e) { return e.id !== it.ex && App.exAllowed(e, R) && (!m || e.muscle === m) && (!q || (e.name + ' ' + e.muscle + ' ' + t(e.muscle) + ' ' + e.equip.join(' ')).toLowerCase().indexOf(q) !== -1); })
        .sort(function (a, b) { return score(a) - score(b) || a.name.localeCompare(b.name); });
      var h = '', last = -1;
      list.forEach(function (e) {
        var sc = Math.min(score(e), 2);
        if (!q && !m && sc !== last) { h += '<div class="sw-sec">' + esc(t(sc === 0 ? 'Best alternatives' : sc === 1 ? 'Same muscle group' : 'Other exercises')) + '</div>'; last = sc; }
        h += '<button class="list-item" data-id="' + e.id + '"><div class="grow"><b>' + esc(e.name) + '</b><div class="tiny muted">' + esc(t(e.muscle)) + ' · ' + esc(e.equip.join(', ')) + '</div></div><span class="chev">›</span></button>';
      });
      s.el.querySelector('#swres').innerHTML = '<div class="list">' + (h || '<p class="small muted">' + esc(t('No exercises found.')) + '</p>') + '</div>';
    }
    s.el.querySelector('#swq').oninput = render;
    s.el.querySelector('#swm').onclick = function (e) { var b = e.target.closest('[data-m]'); if (!b) return; m = b.dataset.m; s.el.querySelectorAll('#swm .chip').forEach(function (x) { x.classList.toggle('on', x === b); }); render(); };
    s.el.querySelector('#swres').onclick = function (e) { var b = e.target.closest('[data-id]'); if (!b) return; choose(DD.BY_ID[b.dataset.id]); };
    render();
    function choose(nx) {
      var done = it.sets.filter(function (x) { return x.done; }).length;
      var c = App.sheet(App.sheetHead(t('Swap to {n}?', { n: nx.name })) +
        (done ? '<p class="suggest">' + esc(t('Your {d} logged set(s) stay saved under {o}. The remaining sets move to {n}.', { d: done, o: cur.name || it.ex, n: nx.name })) + '</p>' : '') +
        '<button class="btn primary lg block" id="sw-once">' + esc(t('This workout only')) + '</button>' +
        (it.pi != null ? '<button class="btn lg block" id="sw-plan" style="margin-top:8px">' + esc(t('Also in my plan (permanent)')) + '</button>' : ''));
      function apply(perm) {
        var W2 = App.getW(), reps = parseInt(String(it.target.reps).split('-')[0], 10) || 10, track = nx.track;
        var left = it.sets.filter(function (x) { return !x.done; }).length || (done ? 0 : it.target.sets);
        var last = App.lastFor ? App.lastFor(S.me, nx.id) : null;
        var nsets = Array.from({ length: Math.max(left, done ? 1 : 1) }, function (_, k) { var ls = last && last.sets[k]; return { w: ls ? ls.w : '', r: track === 'weight' || track === 'reps' ? '' : reps, ph: ls ? ls.r : reps, done: false }; });
        var nItem = { ex: nx.id, pi: it.pi, target: Object.assign({}, it.target, { ex: nx.id }), sug: null, sets: nsets, swappedFrom: it.ex };
        if (done) { it.sets = it.sets.filter(function (x) { return x.done; }); it.pi = null; W2.items.splice(ii + 1, 0, nItem); }
        else W2.items[ii] = nItem;
        if (perm && S.me.plan && S.me.plan.days[W2.day] && S.me.plan.days[W2.day].items[nItem.pi]) { S.me.plan.days[W2.day].items[nItem.pi].ex = nx.id; App.save(); App.toast(t('Plan updated')); }
        else App.toast(t('Swapped for this workout'));
        App.closeSheets(); App.renderLogger();
      }
      c.el.querySelector('#sw-once').onclick = function () { apply(false); };
      var pb = c.el.querySelector('#sw-plan'); if (pb) pb.onclick = function () { apply(true); };
    }
  };

  var NL = { 'Swap exercise': 'Wissel oefening', 'Replace {n}. Alternatives for the same movement are shown first.': 'Vervang {n}. Alternatieven voor dezelfde beweging staan bovenaan.', 'All': 'Alle', 'Exercises your coach ruled out are hidden.': 'Oefeningen die je coach heeft uitgesloten worden niet getoond.',
    'Best alternatives': 'Beste alternatieven', 'Same muscle group': 'Zelfde spiergroep', 'Other exercises': 'Overige oefeningen', 'No exercises found.': 'Geen oefeningen gevonden.', 'Swap to {n}?': 'Wisselen naar {n}?',
    'Your {d} logged set(s) stay saved under {o}. The remaining sets move to {n}.': 'Je {d} gelogde set(s) blijven bewaard onder {o}. De overige sets gaan naar {n}.', 'This workout only': 'Alleen deze training', 'Also in my plan (permanent)': 'Ook in mijn schema (blijvend)',
    'Plan updated': 'Schema aangepast', 'Swapped for this workout': 'Gewisseld voor deze training', 'Set removed': 'Set verwijderd', 'Undo': 'Ongedaan maken', 'Remove set': 'Set verwijderen',
    Legs: 'Benen', Back: 'Rug', Chest: 'Borst', Shoulders: 'Schouders', Biceps: 'Biceps', Triceps: 'Triceps', Core: 'Core', Glutes: 'Billen', Hamstrings: 'Hamstrings', Quads: 'Quadriceps', Calves: 'Kuiten', Conditioning: 'Conditie', Mobility: 'Mobiliteit', Obliques: 'Schuine buikspieren' };
  var ES = { 'Swap exercise': 'Cambiar ejercicio', 'Replace {n}. Alternatives for the same movement are shown first.': 'Sustituye {n}. Primero las alternativas del mismo movimiento.', 'All': 'Todos', 'Exercises your coach ruled out are hidden.': 'Los ejercicios que tu entrenador excluyó están ocultos.',
    'Best alternatives': 'Mejores alternativas', 'Same muscle group': 'Mismo grupo muscular', 'Other exercises': 'Otros ejercicios', 'No exercises found.': 'No se encontraron ejercicios.', 'Swap to {n}?': '¿Cambiar a {n}?',
    'Your {d} logged set(s) stay saved under {o}. The remaining sets move to {n}.': 'Tus {d} serie(s) registradas se quedan en {o}. Las demás pasan a {n}.', 'This workout only': 'Solo este entrenamiento', 'Also in my plan (permanent)': 'También en mi plan (permanente)',
    'Plan updated': 'Plan actualizado', 'Swapped for this workout': 'Cambiado para este entrenamiento', 'Set removed': 'Serie eliminada', 'Undo': 'Deshacer', 'Remove set': 'Eliminar serie',
    Legs: 'Piernas', Back: 'Espalda', Chest: 'Pecho', Shoulders: 'Hombros', Core: 'Core', Glutes: 'Glúteos', Calves: 'Gemelos', Conditioning: 'Acondicionamiento', Mobility: 'Movilidad', Obliques: 'Oblicuos', Quads: 'Cuádriceps', Hamstrings: 'Isquiotibiales' };
  Object.keys(NL).forEach(function (k) { window.FBG_I18N.nl[k] = window.FBG_I18N.nl[k] || NL[k]; });
  window.FBG_I18N.es = window.FBG_I18N.es || {}; Object.keys(ES).forEach(function (k) { window.FBG_I18N.es[k] = window.FBG_I18N.es[k] || ES[k]; });
})();
