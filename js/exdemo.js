/* Forged by Grace v3 — exercise demo: anatomical figure (start ⇄ end), muscle map, Dutch step plan. */
(function () {
  'use strict';
  var App = window.App, D = App.D, esc = App.esc, t = App.t, A = App.acts, XI = window.FBG_EXINFO;
  // muscle map regions: [key, svg]
  function el(cx, cy, rx, ry, rot) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"' + (rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '') + '/>'; }
  function pg(pts) { return '<polygon points="' + pts + '"/>'; }
  var REG = [
    // ---- front (x 0-100) ----
    ['traps', pg('42,23 58,23 67,30 33,30')],
    ['upperchest', pg('36,31 49,31 49,38 34,38') + pg('51,31 64,31 66,38 51,38')],
    ['chest', pg('34,38 49,38 49,49 38,50 33,44') + pg('51,38 66,38 67,44 62,50 51,49')],
    ['frontdelt', el(31, 35, 4.5, 6.5, 20) + el(69, 35, 4.5, 6.5, -20)],
    ['sidedelt', el(26, 37, 3, 6.5, 10) + el(74, 37, 3, 6.5, -10)],
    ['biceps', el(25.5, 53, 4, 9.5, 8) + el(74.5, 53, 4, 9.5, -8)],
    ['forearms', el(21.5, 75, 3.6, 11, 10) + el(78.5, 75, 3.6, 11, -10)],
    ['abs', '<rect x="43.5" y="51" width="13" height="32" rx="4"/>'],
    ['obliques', el(38.5, 66, 4, 13) + el(61.5, 66, 4, 13)],
    ['hipflex', pg('40,84 47,84 47,93') + pg('60,84 53,84 53,93')],
    ['quads', el(40.5, 110, 6.5, 19, 4) + el(59.5, 110, 6.5, 19, -4)],
    ['adductors', el(47, 101, 2.4, 10) + el(53, 101, 2.4, 10)],
    ['calves', el(40.5, 150, 4.2, 14) + el(59.5, 150, 4.2, 14), 'f'],
    // ---- back (x 100-200) ----
    ['traps', pg('150,21 167,31 156,52 150,60 144,52 133,31')],
    ['reardelt', el(129, 36, 4.5, 6.5, 20) + el(171, 36, 4.5, 6.5, -20)],
    ['rhomboids', pg('145,34 155,34 154,48 146,48')],
    ['lats', pg('135,42 145,50 147,72 138,66 134,52') + pg('165,42 155,50 153,72 162,66 166,52')],
    ['triceps', el(125.5, 52, 4, 10, 8) + el(174.5, 52, 4, 10, -8)],
    ['forearms', el(121.5, 75, 3.6, 11, 10) + el(178.5, 75, 3.6, 11, -10)],
    ['erectors', '<rect x="145.3" y="50" width="4" height="34" rx="2"/><rect x="150.7" y="50" width="4" height="34" rx="2"/>'],
    ['glutes', el(143, 93, 7.5, 8.5) + el(157, 93, 7.5, 8.5)],
    ['hams', el(142, 116, 6, 16, 3) + el(158, 116, 6, 16, -3)],
    ['calves', el(141.5, 146, 5, 12) + el(158.5, 146, 5, 12)]
  ];
  function base(cx) { // silhouette
    return '<g class="mm-base">' + el(cx, 13, 7.5, 9) + '<rect x="' + (cx - 4) + '" y="20" width="8" height="6"/>' +
      '<path d="M' + (cx - 19) + ',30 Q' + cx + ',24 ' + (cx + 19) + ',30 L' + (cx + 17) + ',60 L' + (cx + 13) + ',88 L' + (cx - 13) + ',88 L' + (cx - 17) + ',60 Z"/>' +
      el(cx - 24.5, 53, 4.5, 11, 8) + el(cx + 24.5, 53, 4.5, 11, -8) + el(cx - 28.5, 75, 4, 12, 10) + el(cx + 28.5, 75, 4, 12, -10) +
      el(cx - 31, 90, 3, 4) + el(cx + 31, 90, 3, 4) +
      el(cx - 9, 112, 8, 22, 4) + el(cx + 9, 112, 8, 22, -4) + el(cx - 9.5, 150, 5.5, 16) + el(cx + 9.5, 150, 5.5, 16) +
      el(cx - 10, 169, 4, 2.5) + el(cx + 10, 169, 4, 2.5) + '</g>';
  }
  App.muscleMap = function (p, s) {
    var g = REG.map(function (r) {
      var c = p.indexOf(r[0]) !== -1 ? 'mm-p' : s.indexOf(r[0]) !== -1 ? 'mm-s' : 'mm-n';
      return '<g class="' + c + '">' + r[1] + '</g>';
    }).join('');
    return '<svg class="mm" viewBox="0 0 200 176" role="img" aria-label="' + esc('Spierkaart') + '">' + base(50) + base(150) + g +
      '<text x="50" y="175" class="mm-t">voor</text><text x="150" y="175" class="mm-t">achter</text></svg>';
  };
  function names(keys) { return keys.map(function (k) { var m = XI.M[k]; return m ? '<li><b>' + esc(m[0]) + '</b> <span class="muted">— ' + esc(m[1]) + '</span></li>' : ''; }).join(''); }
  App.exDemo = function (ex) {
    if (!ex) return;
    var x = XI.X[ex.id];
    if (!x) return App.sheet(App.sheetHead(ex.name, ex.muscle) + '<ol class="plain-list">' + ex.cues.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ol>');
    var src = 'assets/ex/' + ex.id;
    var h = App.sheetHead(ex.name, ex.muscle) +
      '<div class="exd-fig" data-exd><img class="exd-a" src="' + src + '-a.webp" alt="' + esc(ex.name) + ' — startpositie" loading="lazy" decoding="async"><img class="exd-b" src="' + src + '-b.webp" alt="' + esc(ex.name) + ' — eindpositie" loading="lazy" decoding="async">' +
      '<div class="exd-lbl"><span class="exd-la">Start</span><span class="exd-lb">Eind</span></div><button class="exd-pp" type="button" aria-label="Pauze/afspelen">❚❚</button></div>' +
      '<div class="exd-map">' + App.muscleMap(x.p, x.s) + '<div class="exd-leg"><span><i class="lg-p"></i>Agonist (primair)</span><span><i class="lg-s"></i>Ondersteunend</span></div></div>' +
      '<h3 class="h3 exd-h">Agonisten — deze spieren train je</h3><ul class="plain-list exd-m">' + names(x.p) + '</ul>' +
      (x.s.length ? '<h3 class="h3 exd-h">Ondersteunende spieren (synergisten/stabilisatoren)</h3><ul class="plain-list exd-m small">' + names(x.s) + '</ul>' : '') +
      '<h3 class="h3 exd-h">Stappenplan — hier let je op</h3><ol class="exd-steps">' + x.steps.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ol>' +
      '<p class="tiny muted">De gekleurde spierkaart is leidend; de illustratie toont de beweging van start- naar eindpositie.</p>';
    var s = App.sheet(h, { label: ex.name });
    var fig = s.el.querySelector('[data-exd]'), pp = s.el.querySelector('.exd-pp');
    pp.onclick = function (e) { e.stopPropagation(); var p = fig.classList.toggle('paused'); pp.textContent = p ? '▶' : '❚❚'; };
    return s;
  };
  A['w-info'] = function (elx) { App.exDemo(D.BY_ID[elx.dataset.ex]); };
  A['ex-demo'] = function (elx) { App.exDemo(D.BY_ID[elx.dataset.ex]); };
})();
