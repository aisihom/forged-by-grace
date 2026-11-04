/* Forged by Grace — Recepten / Meal prep: client builds a recipe from ingredients (grams), optional cooked pot weight + portions,
   logs a scooped amount; macros/nutrients are proportional to every ingredient. Synced as client_data kind 'recipes'. */
(function () {
  'use strict';
  var App = window.App, S = App.S, F = App.F, esc = App.esc, A = App.acts, FD = window.FBG_FOODS;
  function me() { return S.me; }
  function num(v) { return App.num ? App.num(v) : parseFloat(String(v).replace(',', '.')) || 0; }
  function r0(x) { return Math.round(x || 0); }
  function r1(x) { return Math.round((x || 0) * 10) / 10; }
  // ---- extra raw / ongekookt ingredients (per 100 g; USDA/NEVO-style averages): id, nl, en, kcal,p,c,f, fib,sug,sat,na,gi,nova
  var RAW = [
    ['r-rice-raw', 'Witte rijst (ongekookt)', 'White rice (uncooked)', 360, 7, 79, 0.6, 1.3, 0.1, 0.2, 5, 3, 1],
    ['r-brownrice-raw', 'Zilvervliesrijst (ongekookt)', 'Brown rice (uncooked)', 362, 7.5, 76, 2.7, 3.5, 0.7, 0.5, 7, 2, 1],
    ['r-pasta-raw', 'Pasta (ongekookt)', 'Pasta (uncooked)', 357, 12.5, 72, 1.5, 3, 3, 0.3, 6, 2, 1],
    ['r-wwpasta-raw', 'Volkoren pasta (ongekookt)', 'Wholewheat pasta (uncooked)', 348, 13, 65, 2.5, 8, 3, 0.4, 8, 1, 1],
    ['r-couscous-raw', 'Couscous (ongekookt)', 'Couscous (uncooked)', 376, 13, 77, 0.6, 5, 0.5, 0.1, 10, 2, 1],
    ['r-chicken-raw', 'Kipfilet (rauw)', 'Chicken breast (raw)', 110, 23, 0, 1.5, 0, 0, 0.4, 60, 0, 1],
    ['r-thigh-raw', 'Kippendijfilet (rauw)', 'Chicken thigh (raw)', 145, 19, 0, 7.5, 0, 0, 2, 85, 0, 1],
    ['r-mince-raw', 'Rundergehakt (rauw)', 'Beef mince (raw)', 230, 18.5, 0, 17.5, 0, 0, 7, 70, 0, 1],
    ['r-leanmince-raw', 'Rundergehakt mager 5% (rauw)', 'Lean beef mince 5% (raw)', 137, 21, 0, 5, 0, 0, 2.2, 66, 0, 1],
    ['r-hoh-raw', 'Half-om-half gehakt (rauw)', 'Pork/beef mince (raw)', 255, 17, 0, 21, 0, 0, 8, 70, 0, 1],
    ['r-chmince-raw', 'Kipgehakt (rauw)', 'Chicken mince (raw)', 143, 17, 0, 8, 0, 0, 2.3, 60, 0, 1],
    ['r-tompuree', 'Tomatenpuree', 'Tomato paste', 82, 4.3, 19, 0.5, 4.1, 12, 0.1, 59, 1, 2],
    ['r-tomtin', 'Tomatenblokjes (blik)', 'Chopped tomatoes (tin)', 21, 1, 3.5, 0.2, 1, 3, 0, 130, 1, 2],
    ['r-corn-tin', 'Mais (blik, uitgelekt)', 'Sweetcorn (tin, drained)', 80, 2.6, 15, 1.2, 2.5, 4.5, 0.2, 200, 2, 3],
    ['r-kidney-tin', 'Kidneybonen (blik, uitgelekt)', 'Kidney beans (tin, drained)', 100, 7, 13, 0.5, 6.5, 0.3, 0.1, 250, 1, 3],
    ['r-blackbeans', 'Zwarte bonen (blik, uitgelekt)', 'Black beans (tin, drained)', 110, 7, 15, 0.5, 7, 0.3, 0.1, 230, 1, 3],
    ['r-chickpea', 'Kikkererwten (blik, uitgelekt)', 'Chickpeas (tin, drained)', 120, 7, 14, 2.5, 6, 0.5, 0.3, 240, 1, 3],
    ['r-chilipowder', 'Chilipoeder / kruidenmix', 'Chili powder / spice mix', 282, 13, 50, 14, 35, 7, 2.5, 1000, 1, 2],
    ['r-garlic', 'Knoflook', 'Garlic', 149, 6.4, 33, 0.5, 2.1, 1, 0.1, 17, 1, 1],
    ['r-redpepper', 'Rode peper', 'Chili pepper', 40, 1.9, 9, 0.4, 1.5, 5, 0, 9, 1, 1],
    ['r-potato-raw', 'Aardappel (rauw)', 'Potato (raw)', 77, 2, 17, 0.1, 2.2, 0.8, 0, 6, 3, 1],
    ['r-sweetpot-raw', 'Zoete aardappel (rauw)', 'Sweet potato (raw)', 86, 1.6, 20, 0.1, 3, 4.2, 0, 55, 2, 1],
    ['r-oil', 'Olijfolie', 'Olive oil', 884, 0, 0, 100, 0, 0, 14, 2, 0, 2],
    ['r-cooking-cream', 'Kookroom', 'Cooking cream', 175, 2.5, 4, 17, 0, 4, 11, 40, 1, 2]
  ];
  var RAWN = {};
  if (FD) RAW.forEach(function (r) {
    if (FD.BY_ID[r[0]]) return;
    var f = { id: r[0], nl: r[1], en: r[2], cat: 'carb', kcal: r[3], p: r[4], c: r[5], f: r[6], g: 100, portion: '100 g', x: 0 };
    FD.FOODS.push(f); FD.BY_ID[r[0]] = f;
    RAWN[r[0]] = { kcal: r[3], p: r[4], c: r[5], f: r[6], fib: r[7], sug: r[8], sat: r[9], na: r[10], gi: r[11], nova: r[12] };
  });
  // full nutrients per 100 g for a food item
  function per100(fd) {
    if (RAWN[fd.id]) return Object.assign({}, RAWN[fd.id]);
    var o = App.foodNutr ? App.foodNutr({ name: App.foodName(fd), fid: fd.id, g: 100, kcal: +fd.kcal || 0, p: +fd.p || 0, c: +fd.c || 0, f: +fd.f || 0, fib: fd.fib }) : {};
    return { kcal: +fd.kcal || 0, p: +fd.p || 0, c: +fd.c || 0, f: +fd.f || 0, fib: o.fib != null ? r1(o.fib) : null, sug: o.sug != null ? r1(o.sug) : null, sat: o.sat != null ? r1(o.sat) : null, na: o.na != null ? r0(o.na) : null, gi: o.gi || 0, nova: o.nova || null };
  }
  var KEYS = ['kcal', 'p', 'c', 'f', 'fib', 'sug', 'sat', 'na'];
  // pure math (exposed for tests)
  function calc(rec) {
    var T = { raw: 0 }, gic = 0, cc = 0, nv = 0, nvk = 0; KEYS.forEach(function (k) { T[k] = 0; });
    (rec.ing || []).forEach(function (i) { var g = +i.g || 0, n = i.n || {}; T.raw += g;
      KEYS.forEach(function (k) { T[k] += (+n[k] || 0) * g / 100; });
      var c = (+n.c || 0) * g / 100; gic += c * (n.gi || 0); cc += c; if (n.nova) { var kc = (+n.kcal || 0) * g / 100; nv += n.nova * kc; nvk += kc; } });
    T.weight = +rec.cooked > 0 ? +rec.cooked : T.raw; T.gi = cc ? Math.round(gic / cc) : 0; T.nova = nvk ? Math.round(nv / nvk) : null;
    T.p100 = {}; KEYS.forEach(function (k) { T.p100[k] = T.weight ? T[k] * 100 / T.weight : 0; });
    T.portions = +rec.portions > 0 ? +rec.portions : 0; T.portionG = T.portions ? T.weight / T.portions : 0;
    return T;
  }
  function scoop(rec, g) {
    var T = calc(rec), k = T.weight ? g / T.weight : 0, o = { g: g, factor: k, gi: T.gi, nova: T.nova };
    KEYS.forEach(function (x) { o[x] = T[x] * k; });
    o.parts = (rec.ing || []).map(function (i) { return { name: i.name, g: (+i.g || 0) * k }; });
    return o;
  }
  App.recipeCalc = calc; App.recipeScoop = scoop;
  function list() { var m = me(); if (!m.recipes) m.recipes = []; return m.recipes; }
  function find(id) { return list().filter(function (r) { return r.id === id; })[0]; }
  function macroLine(o) { return r0(o.kcal) + ' kcal · E ' + r1(o.p) + ' · K ' + r1(o.c) + ' · V ' + r1(o.f); }
  App.recipeLogEntry = function (rec, g, meal) {
    var s = scoop(rec, g);
    return { id: F.uid(), fid: 'recipe:' + rec.id, name: rec.name + ' (' + r0(g) + ' g)', g: r0(g), meal: meal || App.mealNow(), src: 'recipe', at: Date.now(),
      kcal: r0(s.kcal), p: r1(s.p), c: r1(s.c), f: r1(s.f), fib: r1(s.fib), sug: r1(s.sug),
      rn: { sat: r1(s.sat), na: r0(s.na), gi: s.gi, nova: s.nova }, recipe: { id: rec.id, name: rec.name, parts: s.parts.map(function (p) { return [p.name, r0(p.g)]; }) } };
  };

  // ---------------- UI ----------------
  A.recipes = function () { listSheet(); };
  function listSheet() {
    var L = list();
    var s = App.sheet(App.sheetHead('🍲 Recepten / Meal prep', 'Maak je meal prep één keer aan, en log daarna gewoon hoeveel gram je schept.') +
      '<button class="btn primary block" id="rc-new">＋ Nieuw recept</button>' +
      '<div class="list" style="margin-top:12px">' + (L.length ? L.map(function (r) { var T = calc(r);
        return '<div class="list-item" style="display:block"><div class="row between"><b>' + esc(r.name) + '</b><span class="tiny muted">' + r0(T.weight) + ' g pan</span></div>' +
          '<div class="tiny muted">' + r0(T.p100.kcal) + ' kcal · E ' + r1(T.p100.p) + ' · K ' + r1(T.p100.c) + ' · V ' + r1(T.p100.f) + ' per 100 g' + (T.portions ? ' · ' + T.portions + ' porties à ' + r0(T.portionG) + ' g' : '') + '</div>' +
          '<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><button class="btn sm primary" data-rl="' + r.id + '">🍽️ Eten loggen</button><button class="btn sm" data-re="' + r.id + '">✏️ Bewerken</button><button class="btn sm" data-rd="' + r.id + '">⧉ Dupliceren</button><button class="btn sm" data-rx="' + r.id + '">🗑️</button></div></div>'; }).join('')
        : '<p class="small muted" style="padding:10px">Nog geen recepten. Voorbeeld: 1000 g kipfilet, 600 g rijst, 800 g broccoli.</p>') + '</div>');
    s.el.querySelector('#rc-new').onclick = function () { s.close(); editSheet(null); };
    s.el.onclick = function (e) {
      var b = e.target.closest('[data-rl],[data-re],[data-rd],[data-rx]'); if (!b) return;
      if (b.dataset.rl) { s.close(); logSheet(find(b.dataset.rl)); }
      else if (b.dataset.re) { s.close(); editSheet(find(b.dataset.re)); }
      else if (b.dataset.rd) { var o = JSON.parse(JSON.stringify(find(b.dataset.rd))); o.id = 'rc-' + F.uid(); o.name += ' (kopie)'; o.created = Date.now(); list().push(o); App.save(); s.close(); listSheet(); }
      else if (b.dataset.rx) { var r = find(b.dataset.rx); (App.confirm ? App.confirm('Recept verwijderen?', r.name, 'Verwijderen', true) : Promise.resolve(confirm('Verwijderen?'))).then(function (ok) { if (!ok) return; me().recipes = list().filter(function (x) { return x.id !== r.id; }); App.save(); s.close(); listSheet(); }); }
    };
  }
  function editSheet(orig) {
    var rec = orig ? JSON.parse(JSON.stringify(orig)) : { id: 'rc-' + F.uid(), name: '', ing: [], cooked: '', portions: '', created: Date.now() };
    var s = App.sheet(App.sheetHead(orig ? 'Recept bewerken' : 'Nieuw recept', 'Vul alle ingrediënten in met grammen, zoals je ze in de pan doet.') +
      '<label class="field"><span class="label">Naam</span><input class="input" id="rc-name" placeholder="bv. Chili con carne" value="' + esc(rec.name) + '"></label>' +
      '<div id="rc-ing"></div>' +
      '<div class="grid2" style="margin-top:8px"><button class="btn" id="rc-add">＋ Ingrediënt</button><button class="btn" id="rc-own">✍️ Eigen product</button></div>' +
      '<p class="tiny muted" style="margin:8px 0">Rijst/pasta: kies <b>ongekookt</b> als je het droog afweegt, <b>gekookt</b> als je het na het koken weegt. Vlees: kies <b>rauw</b> als je het voor het bakken weegt.</p>' +
      '<div class="grid2"><label class="field"><span class="label">Gewicht hele pan, gaar (g) — optioneel</span><input class="input" id="rc-cooked" inputmode="decimal" value="' + esc(rec.cooked || '') + '"></label>' +
      '<label class="field"><span class="label">Aantal porties — optioneel</span><input class="input" id="rc-port" inputmode="decimal" value="' + esc(rec.portions || '') + '"></label></div>' +
      '<p class="tiny" style="color:#c9a227;margin:4px 0 8px">⚖️ Weeg de hele pan voor de meest precieze berekening. Tijdens het koken verdampt water (of rijst/pasta neemt water op), dus gaar gewicht ≠ rauw gewicht. Zonder pan-gewicht rekent de app met de som van de ingrediënten.</p>' +
      '<div class="card" id="rc-sum"></div>' +
      '<button class="btn primary lg block" id="rc-save" style="margin-top:12px">💾 Recept opslaan</button>');
    var q = function (x) { return s.el.querySelector(x); };
    function draw() {
      q('#rc-ing').innerHTML = rec.ing.length ? '<div class="list">' + rec.ing.map(function (i, ix) {
        return '<div class="list-item"><div class="grow"><b>' + esc(i.name) + '</b><div class="tiny muted">' + macroLine({ kcal: i.n.kcal * i.g / 100, p: i.n.p * i.g / 100, c: i.n.c * i.g / 100, f: i.n.f * i.g / 100 }) + '</div></div>' +
          '<input class="input" style="width:84px" inputmode="decimal" data-ig="' + ix + '" value="' + i.g + '"><span class="tiny">g</span><button class="icon-btn" data-ix="' + ix + '" aria-label="weg">✕</button></div>'; }).join('') + '</div>' : '<p class="small muted">Nog geen ingrediënten.</p>';
      sum();
    }
    function sum() {
      rec.cooked = num(q('#rc-cooked').value) || ''; rec.portions = num(q('#rc-port').value) || '';
      var T = calc(rec);
      q('#rc-sum').innerHTML = '<div class="tiny"><b style="color:#c9a227">Totaal pan</b> (' + r0(T.raw) + ' g rauw' + (rec.cooked ? ' → ' + r0(rec.cooked) + ' g gaar' : '') + '): ' + macroLine(T) +
        '<br><b style="color:#c9a227">Per 100 g</b>: ' + macroLine(T.p100) + (T.portions ? '<br><b style="color:#c9a227">Per portie</b> (' + r0(T.portionG) + ' g): ' + macroLine({ kcal: T.kcal / T.portions, p: T.p / T.portions, c: T.c / T.portions, f: T.f / T.portions }) : '') + '</div>';
    }
    q('#rc-ing').addEventListener('input', function (e) { var ix = e.target.dataset.ig; if (ix == null) return; rec.ing[+ix].g = num(e.target.value); sum(); });
    q('#rc-ing').addEventListener('click', function (e) { var b = e.target.closest('[data-ix]'); if (!b) return; rec.ing.splice(+b.dataset.ix, 1); draw(); });
    q('#rc-cooked').oninput = sum; q('#rc-port').oninput = sum;
    function addFood(fd) { if (!fd) return;
      var gs = App.sheet(App.sheetHead(App.foodName(fd), fd.kcal + ' kcal · E ' + fd.p + ' · K ' + fd.c + ' · V ' + fd.f + ' per 100 g') +
        '<label class="field"><span class="label">Hoeveel gram gaat er in de pan?</span><input class="input" id="ig-g" inputmode="decimal" value=""></label><button class="btn primary lg block" id="ig-ok">Toevoegen</button>');
      var inp = gs.el.querySelector('#ig-g'); setTimeout(function () { inp.focus(); }, 50);
      gs.el.querySelector('#ig-ok').onclick = function () { var g = num(inp.value); if (!g) return; rec.ing.push({ fid: fd.id, name: App.foodName(fd), g: g, n: per100(fd) }); gs.close(); draw(); };
    }
    q('#rc-add').onclick = function () { App.foodSearchSheet(addFood, 'Ingrediënt zoeken'); };
    q('#rc-own').onclick = function () { App.customFoodSheet({}, addFood); };
    q('#rc-save').onclick = function () {
      rec.name = q('#rc-name').value.trim(); if (!rec.name) { App.toast('Geef je recept een naam'); return; }
      if (!rec.ing.length) { App.toast('Voeg minstens één ingrediënt toe'); return; }
      sum(); rec.updated = Date.now();
      var L = list(), ix = L.findIndex(function (r) { return r.id === rec.id; }); if (ix >= 0) L[ix] = rec; else L.push(rec);
      App.save(); s.close(); App.toast('Recept opgeslagen'); listSheet();
    };
    draw();
  }
  App.recipeEdit = editSheet;
  function logSheet(rec) {
    if (!rec) return; var T = calc(rec), mode = 'g';
    var s = App.sheet(App.sheetHead('🍽️ ' + rec.name, 'Pan ' + r0(T.weight) + ' g · ' + macroLine(T.p100) + ' per 100 g') +
      '<div class="chips" id="lg-mode"><button class="chip on" data-m="g">Gram geschept</button>' + (T.portions ? '<button class="chip" data-m="p">Porties</button>' : '') + '</div>' +
      '<div class="grid2" style="margin-top:10px"><label class="field"><span class="label" id="lg-lab">Gram op je bord</span><input class="input" id="lg-v" inputmode="decimal" value="' + (T.portions ? r0(T.portionG) : 300) + '"></label>' +
      '<label class="field"><span class="label">Maaltijd</span><select class="input" id="lg-m">' + App.MEALS.map(function (m) { return '<option value="' + m[0] + '"' + (m[0] === App.mealNow() ? ' selected' : '') + '>' + esc(App.t(m[1])) + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="card" id="lg-prev"></div><button class="btn primary lg block" id="lg-ok" style="margin-top:12px">＋ Toevoegen aan log</button>');
    var q = function (x) { return s.el.querySelector(x); };
    function grams() { var v = num(q('#lg-v').value); return mode === 'p' ? v * T.portionG : v; }
    function upd() { var g = grams(), o = scoop(rec, g);
      q('#lg-prev').innerHTML = '<div class="grid4"><div><b>' + r0(o.kcal) + '</b><span>kcal</span></div><div><b>' + r1(o.p) + '</b><span>eiwit</span></div><div><b>' + r1(o.c) + '</b><span>koolh.</span></div><div><b>' + r1(o.f) + '</b><span>vet</span></div></div>' +
        '<p class="tiny muted" style="margin:8px 0 0">Vezels ' + r1(o.fib) + ' g · suiker ' + r1(o.sug) + ' g · zout ' + r1(o.na * 2.5 / 1000) + ' g</p>' +
        '<p class="tiny" style="margin:8px 0 0"><b style="color:#c9a227">' + r0(g) + ' g = ' + (T.weight ? r1(g / T.weight * 100) : 0) + '% van de pan:</b><br>' + o.parts.map(function (p) { return r0(p.g) + ' g ' + esc(p.name); }).join(' · ') + '</p>' +
        '<p class="tiny muted">Ingrediënten in rauw/ingevoerd gewicht.</p>'; }
    q('#lg-mode').onclick = function (e) { var b = e.target.closest('[data-m]'); if (!b) return; mode = b.dataset.m; s.el.querySelectorAll('#lg-mode .chip').forEach(function (x) { x.classList.toggle('on', x === b); });
      q('#lg-lab').textContent = mode === 'p' ? 'Aantal porties' : 'Gram op je bord'; q('#lg-v').value = mode === 'p' ? 1 : r0(T.portionG || 300); upd(); };
    q('#lg-v').oninput = upd; upd();
    q('#lg-ok').onclick = function () { var g = grams(); if (!g) return;
      var iso = location.hash.indexOf('#/food') === 0 ? App.foodDate : App.today(), e = App.recipeLogEntry(rec, g, q('#lg-m').value);
      (me().food[iso] = me().food[iso] || []).push(e); App.save(); s.close(); App.toast('Toegevoegd: ' + e.name); App.rerender(); };
  }
  App.recipeLog = logSheet;
})();
