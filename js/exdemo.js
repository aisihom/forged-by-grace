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
    ['midtraps', pg('141,33 159,33 156,50 150,62 144,50')],
    ['cuff', el(138.5, 42, 4.2, 5.5, -15) + el(161.5, 42, 4.2, 5.5, 15)],
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

  function ytwSvg() {
    var B = '#d9d2c5', L = '#a99f8f', P = '#e8462c', S = '#f0a35a';
    function arm(sx, sy, ex, ey, hx, hy, side) { // upper arm + forearm + thumb-up fist
      var dx = hx - ex, dy = hy - ey, n = Math.sqrt(dx * dx + dy * dy) || 1;
      return '<path d="M' + sx + ',' + sy + ' L' + ex + ',' + ey + '" stroke="' + B + '" stroke-width="15" stroke-linecap="round" fill="none"/>' +
        '<path d="M' + ex + ',' + ey + ' L' + hx + ',' + hy + '" stroke="' + B + '" stroke-width="11" stroke-linecap="round" fill="none"/>' +
        '<path d="M' + sx + ',' + sy + ' L' + ex + ',' + ey + '" stroke="' + L + '" stroke-width="1" fill="none" opacity=".7"/>' +
        '<circle cx="' + (hx + dx / n * 6) + '" cy="' + (hy + dy / n * 6) + '" r="7" fill="' + B + '" stroke="' + L + '"/>' +
        '<circle cx="' + (hx + dx / n * 6) + '" cy="' + (hy + dy / n * 6 - 2) + '" r="2.6" fill="#fff" stroke="' + L + '" stroke-width=".8"/>';
    }
    function pair(e, h) { // e,h = left elbow & hand; mirrored to right
      return arm(122, 96, e[0], e[1], h[0], h[1]) + arm(178, 96, 300 - e[0], e[1], 300 - h[0], h[1]);
    }
    function back(sq) { // scapulae + muscles; sq = shoulder-blade retraction (px)
      var r = sq || 0;
      return '<g>' +
        // upper traps (not trained: neutral)
        '<path d="M150,72 L128,90 L172,90 Z" fill="#c9c1b3"/>' +
        // rotator cuff over scapula (secondary)
        '<ellipse cx="' + (134 + r) + '" cy="112" rx="10" ry="13" fill="' + S + '" opacity=".85"/><ellipse cx="' + (166 - r) + '" cy="112" rx="10" ry="13" fill="' + S + '" opacity=".85"/>' +
        // middle + lower traps (primary)
        '<path d="M150,88 L' + (126 + r) + ',94 L' + (138 + r) + ',104 L150,100 L' + (162 - r) + ',104 L' + (174 - r) + ',94 Z" fill="' + P + '" opacity=".95"/>' +
        '<path d="M144,104 L156,104 L153,150 L150,160 L147,150 Z" fill="' + P + '"/>' +
        // rhomboids (primary)
        '<path d="M146,96 L' + (134 + r) + ',100 L' + (136 + r) + ',128 L148,138 Z" fill="#c2301c" stroke="#ff8a6a" stroke-width="1" stroke-dasharray="2 1.5"/><path d="M154,96 L' + (166 - r) + ',100 L' + (164 - r) + ',128 L152,138 Z" fill="#c2301c" stroke="#ff8a6a" stroke-width="1" stroke-dasharray="2 1.5"/>' +
        // rear delts (primary)
        '<ellipse cx="120" cy="97" rx="9" ry="8" fill="' + P + '"/><ellipse cx="180" cy="97" rx="9" ry="8" fill="' + P + '"/>' +
        '<path d="M150,90 L150,190" stroke="' + L + '" stroke-width="1.2"/></g>';
    }
    var body = '<rect x="8" y="8" width="284" height="434" rx="14" fill="#1a1c20" stroke="#2c2f35"/>' + // floor mat
      '<path d="M128,92 Q150,84 172,92 L176,140 L166,196 L134,196 L124,140 Z" fill="' + B + '" stroke="' + L + '"/>' + // torso (back)
      '<path d="M134,196 L166,196 L170,222 L130,222 Z" fill="' + B + '" stroke="' + L + '"/>' + // pelvis/glutes
      '<path d="M150,206 L150,222" stroke="' + L + '"/>' +
      '<path d="M132,220 L148,220 L146,330 L144,410 L134,410 L132,330 Z" fill="' + B + '" stroke="' + L + '"/>' + // legs straight
      '<path d="M152,220 L168,220 L168,330 L166,410 L156,410 L154,330 Z" fill="' + B + '" stroke="' + L + '"/>' +
      '<ellipse cx="139" cy="416" rx="6" ry="8" fill="' + B + '" stroke="' + L + '"/><ellipse cx="161" cy="416" rx="6" ry="8" fill="' + B + '" stroke="' + L + '"/>' +
      '<rect x="144" y="66" width="12" height="16" fill="' + B + '"/>' +
      '<ellipse cx="150" cy="60" rx="15" ry="17" fill="' + B + '" stroke="' + L + '"/>' + // back of head, forehead on mat
      '<path d="M138,52 Q150,46 162,52" stroke="' + L + '" fill="none"/>';
    var fr = [
      ['Y', pair([86, 58], [56, 22]), 0],        // ~135° overhead
      ['T', pair([80, 96], [40, 96]), 0],        // 90° straight out
      ['W', pair([112, 140], [92, 104]), 6]      // elbows to ribs, blades squeezed
    ];
    return '<svg class="ytw" viewBox="0 0 300 450" role="img" aria-label="Prone Y-T-W van bovenaf">' + body +
      fr.map(function (f, i) { return '<g class="ytw-f ytw-' + (i + 1) + '">' + f[1] + back(f[2]) + '</g>'; }).join('') +
      '</svg>';
  }
  var FR3 = { 'prone-ytw': ['Y-positie', 'T-positie', 'W-positie'] };
  var FIXED = {}; 'prone-ytw calf-raise pallof-press mountain-climber incline-walk brisk-walk push-up overhead-press bench-dip hip-thrust dead-bug'.split(' ').forEach(function (k) { FIXED[k] = 1; });
  App.exDemo = function (ex) {
    if (!ex) return;
    var x = XI.X[ex.id];
    if (!x) return App.sheet(App.sheetHead(ex.name, ex.muscle) + '<ol class="plain-list">' + ex.cues.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ol>');
    var src = 'assets/ex/' + ex.id;
    var h = App.sheetHead(ex.name, ex.muscle) +
      '<div class="exd-fig' + (FR3[ex.id] ? ' exd-3' : '') + '" data-exd>' + (ex.id === 'prone-ytw' ? [ytwSvg()] : []).concat(ex.id === 'prone-ytw' ? [] : ['a', 'b']).map(function (k) { return k.length > 1 ? k : null; }).filter(Boolean).join('') + (ex.id === 'prone-ytw' ? [] : ['a', 'b']).map(function (k, i) { var lb = FR3[ex.id] ? FR3[ex.id][i] : (k === 'a' ? 'startpositie' : 'eindpositie'); return '<picture><source type="image/webp" srcset="' + src + '-' + k + '.webp?v=3.2.1"><img class="exd-' + k + '" src="' + src + '-' + k + '.jpg?v=3.2.1" width="448" height="504" alt="' + esc(ex.name) + ' — ' + lb + '"></picture>'; }).join('') +
      (FR3[ex.id] ? '<div class="exd-lbl"><span class="exd-l1">Y · 135°</span><span class="exd-l2">T · 90°</span><span class="exd-l3">W · knijpen</span></div>' : '<div class="exd-lbl"><span class="exd-la">Start</span><span class="exd-lb">Eind</span></div>') + '<button class="exd-pp" type="button" aria-label="Pauze/afspelen">❚❚</button></div>' +
      '<div class="exd-map">' + App.muscleMap(x.p, x.s) + '<div class="exd-leg"><span><i class="lg-p"></i>Agonist (primair)</span><span><i class="lg-s"></i>Ondersteunend</span></div></div>' +
      '<h3 class="h3 exd-h">Agonisten — deze spieren train je</h3><ul class="plain-list exd-m">' + names(x.p) + '</ul>' +
      (x.s.length ? '<h3 class="h3 exd-h">Ondersteunende spieren (synergisten/stabilisatoren)</h3><ul class="plain-list exd-m small">' + names(x.s) + '</ul>' : '') +
      '<h3 class="h3 exd-h">Stappenplan — hier let je op</h3><ol class="exd-steps">' + x.steps.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ol>' +
      (FIXED[ex.id] ? '' : '<p class="tiny muted">De gekleurde spierkaart is leidend; de illustratie toont de beweging van start- naar eindpositie.</p>');
    var s = App.sheet(h, { label: ex.name });
    s.el.querySelectorAll('.exd-fig img').forEach(function (im) { im.onerror = function () { if (!im.dataset.retry) { im.dataset.retry = 1; im.src = im.src.split('?')[0] + '?r=' + Date.now(); } }; });
    var fig = s.el.querySelector('[data-exd]'), pp = s.el.querySelector('.exd-pp');
    pp.onclick = function (e) { e.stopPropagation(); var p = fig.classList.toggle('paused'); pp.textContent = p ? '▶' : '❚❚'; };
    return s;
  };
  A['w-info'] = function (elx) { App.exDemo(D.BY_ID[elx.dataset.ex]); };
  A['ex-demo'] = function (elx) { App.exDemo(D.BY_ID[elx.dataset.ex]); };
})();
