/* Forged by Grace — rule-based food rating (🟢 Heel goed / 👍 Goed / 🟡 Matig / 🔴 Slecht) + sanity checks. $0, no AI. */
(function () {
  'use strict';
  var App = window.App;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function low(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function norm(s) {
    return ' ' + low(s).replace(/['’`]/g, '').replace(/(\d+(?:[.,]\d+)?)\s*(g|gr|gram|ml|cl|l|kg|stuks?|st|x|plakjes?|sneetjes?|el|tl|kop|cups?|pcs?)\b/g, ' ')
      .replace(/\b\d+(?:[.,]\d+)?\b(?!\s*%)/g, ' ').replace(/[^a-z0-9%+ ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }
  function R(x) { return Math.round(x); }
  function R1(x) { return Math.round(x * 10) / 10; }
  var LV = [
    { k: 'hg', e: '🟢', l: 'Heel goed' }, { k: 'g', e: '👍', l: 'Goed' }, { k: 'm', e: '🟡', l: 'Matig' }, { k: 's', e: '🔴', l: 'Slecht' }];
  function lv(s) { return s >= 2 ? LV[0] : s >= 0.3 ? LV[1] : s >= -1.5 ? LV[2] : LV[3]; }
  // ---- DB index ----
  var DB = (window.FBG_NDB || []).map(function (r) {
    return { names: r[0], kcal: r[1], p: r[2], c: r[3], f: r[4], fib: r[5], sug: r[6], sat: r[7], na: r[8], gi: r[9], nova: r[10], cat: r[11] };
  });
  var IDX = [];
  DB.forEach(function (d) { d.names.forEach(function (n) { var k = norm(n).trim(); if (k) IDX.push({ k: k, w: k.split(' '), d: d }); }); });
  App.NDB = DB;
  function lev1(a, b) { // edit distance <= 1 (or 2 for long words)
    if (a === b) return true; var la = a.length, lb = b.length, max = Math.min(la, lb) >= 8 ? 2 : 1;
    if (Math.abs(la - lb) > max || Math.min(la, lb) < 5) return false;
    var d = [], i, j; for (i = 0; i <= la; i++) { d[i] = [i]; } for (j = 0; j <= lb; j++) d[0][j] = j;
    for (i = 1; i <= la; i++) for (j = 1; j <= lb; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[la][lb] <= max;
  }
  var HEAD = / (brood|bread|cake|taart|sap|juice|yoghurt|yogurt|shake|reep|bar|saus|sauce|soep|soup|chips|ijs|muffin|pancake|pannenkoek|smoothie|pizza|burger|wrap|salade|salad|curry|stamppot|pasta|thee|tea|melk|milk|drank|drink) /;
  var CACHE = {};
  // returns { d, conf (0..1), primary }
  function match(name) {
    var n = norm(name); if (CACHE[n] !== undefined) return CACHE[n];
    var prim = n.split(/ (?:met|with|en|and|op|on|zonder|without) /)[0] + ' ';
    var toks = prim.trim().split(' '), best = null, bs = -1;
    IDX.forEach(function (x) {
      var pos = prim.indexOf(' ' + x.k + ' '), fuzzy = false;
      if (pos < 0) { // fuzzy token match
        if (x.w.length > toks.length) return;
        for (var i = 0; i + x.w.length <= toks.length; i++) {
          var ok = true; for (var j = 0; j < x.w.length; j++) if (!lev1(toks[i + j], x.w[j])) { ok = false; break; }
          if (ok) { pos = prim.indexOf(toks[i]); fuzzy = true; break; }
        }
        if (pos < 0) return;
      }
      // more words > longer > later position (head noun) ; exact whole primary best
      var sc = x.w.length * 100 + x.k.length * 2 + pos / 10 + (HEAD.test(' ' + x.k + ' ') ? 30 : 0) + (prim.trim() === x.k ? 500 : 0) - (fuzzy ? 60 : 0);
      if (sc > bs) { bs = sc; best = { d: x.d, k: x.k, fuzzy: fuzzy }; }
    });
    if (!best) {
      // compound Dutch words: 'appelsap', 'kipfiletreepjes' → suffix/prefix match on long keys
      IDX.forEach(function (x) { if (x.k.length < 4 || x.w.length > 1) return; toks.forEach(function (t) {
        if (t.length > x.k.length && (t.slice(-x.k.length) === x.k)) { var sc = x.k.length; if (sc > bs) { bs = sc; best = { d: x.d, k: x.k, comp: 1 }; } }
        else if (t.length > x.k.length + 2 && t.indexOf(x.k) === 0 && x.k.length >= 5) { var sc2 = x.k.length - 3; if (sc2 > bs) { bs = sc2; best = { d: x.d, k: x.k, comp: 2 }; } }
      }); });
    }
    if (best) { var cov = best.k.split(' ').length / toks.length; best.conf = best.comp ? 0.35 : best.fuzzy ? 0.6 * Math.min(1, cov + 0.3) : Math.min(1, cov + 0.4); }
    CACHE[n] = best; return best;
  }
  App.foodMatch = match;
  function per100(e) { var g = +e.g || 0; if (!g) return null; return { kcal: (+e.kcal || 0) * 100 / g, p: (+e.p || 0) * 100 / g, c: (+e.c || 0) * 100 / g, f: (+e.f || 0) * 100 / g }; }
  function off(a, b, absT, relT) { return Math.abs(a - b) > Math.max(absT, b * relT); }
  App.foodSanity = function (e) {
    if (e.rn || e.recipe) return null;
    var m = match(e.name), x = per100(e); if (!m || !x || m.conf < 0.75) return null; var r = m.d;
    if (r.kcal < 5 && x.kcal < 15) return null;
    var bk = off(x.kcal, r.kcal, 50, 0.4), n = 0, bits = [];
    if (off(x.p, r.p, 5, 0.6)) { n++; bits.push('E ' + R(x.p) + '≠' + R(r.p)); }
    if (off(x.c, r.c, 8, 0.6)) { n++; bits.push('K ' + R(x.c) + '≠' + R(r.c)); }
    if (off(x.f, r.f, 5, 0.8)) { n++; bits.push('V ' + R(x.f) + '≠' + R(r.f)); }
    if (!(bk && n >= 1) && n < 2) return null;
    return { msg: '⚠️ Klopt dit? ' + e.name + ' heeft hier ' + R(x.kcal) + ' kcal · E ' + R(x.p) + ' · K ' + R(x.c) + ' · V ' + R(x.f) + ' g per 100 g; normaal ±' + R(r.kcal) + ' kcal · E ' + R(r.p) + ' · K ' + R(r.c) + ' · V ' + R(r.f) + '. Kies het juiste product of pas de waarden aan.', ref: r };
  };
  App.foodCtx = function (owner) {
    var o = owner || {}, P = o.profile || {}, m = o.meal || {};
    var txt = low([m.name, m.principle, P.notes, P.health, P.conditions, P.medical, (o.intake && JSON.stringify(o.intake)) || ''].join(' '));
    var T = P.targetsOverride || (App.calcTargets && App.calcTargets(P)) || m.targets || null;
    var g = low(P.goal || ''), goal = /lean|cut|afval|vet|lose|fat/.test(g) ? 'lean' : /muscle|bulk|spier|gain|aankom/.test(g) ? 'muscle' : g;
    return { diabetes: /diabet/.test(txt), goal: goal, T: T, meals: (m.meals && m.meals.length) || 4, female: /^(f|v|female|vrouw)/.test(low(P.sex || P.gender || '')) };
  };
  var GIV = [0, 40, 60, 80];
  // full nutrient estimate for a logged entry
  function nutr(e) {
    if (e.rn) { // recipe item: ingredient-weighted nutrients, no name matching
      var rn = e.rn, ro = { g: +e.g || 0, kcal: +e.kcal || 0, p: +e.p || 0, c: +e.c || 0, f: +e.f || 0, m: null, d: null, fib: e.fib != null ? +e.fib : null, sug: e.sug != null ? +e.sug : null, sat: rn.sat != null ? +rn.sat : null, na: rn.na != null ? +rn.na : null, gi: rn.gi || 0, nova: rn.nova || null, cat: 'dish', recipe: true };
      ro.gl = ro.c * GIV[ro.gi || 0] / 100 - (ro.fib || 0) * 0.3; if (ro.gl < 0) ro.gl = 0; return ro;
    }
    var g = +e.g || 0, kcal = +e.kcal || 0, p = +e.p || 0, c = +e.c || 0, f = +e.f || 0, m = match(e.name), d = m && m.d;
    var fd = window.FBG_FOODS && e.fid && window.FBG_FOODS.BY_ID[e.fid];
    var sc = g ? g / 100 : 0, o = { g: g, kcal: kcal, p: p, c: c, f: f, m: m, d: d };
    if (d) {
      // scale secondary nutrients by carbs/fat ratio to the logged values (robust when grams differ)
      var kc = d.c > 0 ? c / d.c : sc, kf = d.f > 0 ? f / d.f : sc;
      o.fib = e.fib != null ? +e.fib : d.fib * (kc || sc); o.sug = e.sug != null ? +e.sug : Math.min(c, d.sug * (kc || sc));
      o.sat = Math.min(f, d.sat * (kf || sc)); o.na = d.na * sc; o.gi = d.gi; o.nova = d.nova; o.cat = d.cat;
    } else {
      o.fib = e.fib != null ? +e.fib : fd && fd.fib != null ? fd.fib * sc : null; o.sug = null; o.sat = null; o.na = null; o.gi = c > 3 ? 2 : 0; o.nova = null; o.cat = fd && fd.cat;
    }
    o.gl = c * GIV[o.gi || 0] / 100 - (o.fib || 0) * 0.3; if (o.gl < 0) o.gl = 0;
    return o;
  }
  App.foodNutr = nutr;
  var ALC = /(^| )(bier|beer|pils|heineken|wijn|wine|rose|wodka|vodka|whisky|rum|gin|sterke drank)( |$)/;
  var ZERO_OK = /(^| )(water|spa|thee|tea|koffie|coffee|espresso|bruiswater|mineraalwater)( |$)/;
  App.rateFood = function (e, ctx) {
    ctx = ctx || {}; var o = nutr(e), kcal = o.kcal, p = o.p, c = o.c, f = o.f, s = 0, pro = [], con = [], d = o.d, T = ctx.T, nm = norm(e.name);
    var warn = App.foodSanity(e);
    if (kcal < 8) {
      var zero = ZERO_OK.test(nm) || (d && d.cat === 'drink' && d.nova <= 1);
      if (zero) return { lv: LV[0], s: 2, why: ['✔ 0 kcal, hydratatie — prima'], warn: null, pro: [], con: [], n: o };
      if (d && d.nova === 4) return { lv: LV[1], s: 0.5, why: ['✔ ±0 kcal', '✖ zoetstoffen/bewerkt — beter water'], warn: null, pro: [], con: [], n: o };
      return { lv: LV[1], s: 0.5, why: ['Nauwelijks calorieën.'], warn: null, pro: [], con: [], n: o };
    }
    var pd = p * 4 / kcal, satS = o.sat != null ? o.sat * 9 / kcal : null, sugS = o.sug != null ? o.sug * 4 / kcal : null, fib100 = o.fib != null ? o.fib / kcal * 100 : null;
    var dens = o.g ? kcal / o.g * 100 : null, fatS = f * 9 / kcal;
    // protein density
    if (pd >= 0.4) { s += 2; pro.push(R(p) + ' g eiwit = ' + R(pd * 100) + '% van de kcal'); }
    else if (pd >= 0.25) { s += 1.2; pro.push(R(p) + ' g eiwit (' + R(pd * 100) + '% kcal)'); }
    else if (pd >= 0.15) { s += 0.4; if (p >= 8) pro.push(R(p) + ' g eiwit'); }
    else if (pd < 0.08 && kcal > 120 && !(o.cat === 'fruit' || o.cat === 'veg')) { s -= 0.6; con.push('maar ' + R1(p) + ' g eiwit op ' + R(kcal) + ' kcal'); }
    // fiber
    if (fib100 != null && o.fib >= 1) {
      if (fib100 >= 3) { s += 1; pro.push(R1(o.fib) + ' g vezels (veel per kcal)'); }
      else if (fib100 >= 1.5) { s += 0.5; pro.push(R1(o.fib) + ' g vezels'); }
    } else if (fib100 != null && c > 25 && o.fib < 1.5) { s -= 0.3; con.push('vrijwel geen vezels bij ' + R(c) + ' g koolhydraten'); }
    // sugar
    if (sugS != null && o.sug >= 3) {
      var added = (o.nova || 0) >= 3 || (d && d.cat === 'sweet');
      if (added && sugS >= 0.5) { s -= 2.2; con.push(R(o.sug) + ' g (toegevoegde) suiker = ' + R(sugS * 100) + '% van de kcal'); }
      else if (added && sugS >= 0.2) { s -= 1.1; con.push(R(o.sug) + ' g suiker (' + R(sugS * 100) + '% kcal)'); }
      else if (added && o.sug >= 10) { s -= 0.5; con.push(R(o.sug) + ' g suiker'); }
      else if (!added && o.sug >= 25) { s -= 0.5; con.push(R(o.sug) + ' g (vrucht)suiker in één portie'); }
      if (d && d.cat === 'drink' && added && o.sug >= 10) { s -= 0.8; con.push('vloeibare suiker verzadigt niet'); }
    }
    // fat quality
    if (satS != null) {
      if (satS >= 0.25 && o.sat >= 3) { s -= 1.5; con.push(R1(o.sat) + ' g verzadigd vet = ' + R(satS * 100) + '% van de kcal (max ±10%)'); }
      else if (satS >= 0.14 && o.sat >= 2.5) { s -= 0.7; con.push(R1(o.sat) + ' g verzadigd vet (' + R(satS * 100) + '% kcal)'); }
      else if (fatS >= 0.45 && satS < 0.17 && (o.nova || 4) <= 2) { s += 0.6; pro.push('vooral onverzadigde vetten (' + R(f) + ' g vet, ' + R1(o.sat) + ' g verzadigd)'); }
    } else if (fatS > 0.6 && kcal > 100) { s -= 0.8; con.push(R(fatS * 100) + '% van de kcal uit vet'); }
    // sodium
    if (o.na != null) {
      if (o.na >= 900) { s -= 1.2; con.push(R(o.na) + ' mg natrium (±' + R1(o.na * 2.5 / 1000) + ' g zout) — ' + R(o.na / 24) + '% van je daglimiet'); }
      else if (o.na >= 500) { s -= 0.6; con.push(R(o.na) + ' mg natrium (±' + R1(o.na * 2.5 / 1000) + ' g zout)'); }
    }
    // processing
    if (o.nova === 1) { s += 0.6; pro.push('onbewerkt'); }
    else if (o.nova === 4) { s -= 1; con.push('ultrabewerkt'); }
    // energy density
    if (dens != null && dens > 400 && pd < 0.2 && fatS < 0.9) { var dpen = ctx.goal === 'lean' ? 0.8 : 0.3; s -= dpen; con.push(R(dens) + ' kcal per 100 g — calorierijk' + (ctx.goal === 'lean' ? ' bij afvallen' : '')); }
    if (o.cat === 'fish' && f >= 5 && (o.nova || 2) <= 2) { s += 1; pro.push('vette vis: omega-3 (' + R1(f) + ' g vet)'); }
    if (ALC.test(nm)) { s -= 1.5; con.push('alcohol: lege kcal, remt herstel en vetverbranding'); }
    if (o.cat === 'veg') { s += 0.6; pro.push('groente: micronutriënten, weinig kcal'); }
    else if (o.cat === 'fruit' && (o.nova || 1) <= 2 && !(d && d.sug > 50)) { s += 0.4; pro.push('fruit: vitamines + vezels'); }
    // glycemic load
    var gl = o.gl;
    if (c >= 10) {
      if (ctx.diabetes) {
        if (gl >= 20) { s -= 1.8; con.push('GL ~' + R(gl) + ' hoog → bloedsuikerpiek (diabetes)'); }
        else if (gl >= 11) { s -= 0.6; con.push('GL ~' + R(gl) + ' gemiddeld — combineer met eiwit/vezels'); }
        else { s += 0.5; pro.push('GL ~' + R(gl) + ' laag, rustig voor je bloedsuiker'); }
        if (c > 45) { s -= 1; con.push(R(c) + ' g koolhydraten in één keer — liever max ±40 g per eetmoment'); }
        if (o.gi === 3 && c >= 15) { s -= 0.4; con.push('hoge GI'); }
      } else if (gl >= 25) { s -= 0.4; con.push('GL ~' + R(gl) + ' hoog (snelle energie)'); }
    }
    // portion vs targets
    if (T && T.kcal) {
      var mk = T.kcal / (ctx.meals || 4);
      if (kcal > T.kcal * 0.4) { s -= 1; con.push('grote portie: ' + R(kcal) + ' kcal = ' + R(kcal / T.kcal * 100) + '% van je dagdoel'); }
      else if (kcal > mk * 1.3 && pd < 0.25) { s -= 0.4; con.push(R(kcal) + ' kcal, meer dan een maaltijd (±' + R(mk) + ')'); }
      if (T.p && p >= 25) { s += 0.3; pro.push('dekt ' + R(p / T.p * 100) + '% van je eiwitdoel'); }
    }
    if (ctx.goal === 'muscle' && p >= 25) { s += 0.4; pro.push('helpt spieropbouw'); }
    if (ctx.goal === 'muscle' && c >= 30 && (o.gi || 0) <= 2 && (o.nova || 2) <= 2) { s += 0.2; }
    var why = pro.map(function (x) { return '✔ ' + x; }).concat(con.map(function (x) { return '✖ ' + x; }));
    if (o.recipe) why.push('🍲 recept: berekend uit de ingrediënten'); else if (!d) why.push('ℹ️ product niet in de database, oordeel op macro’s');
    if (!why.length) why.push('Neutraal: past prima binnen je dag.');
    if (warn) { s = Math.min(s, -0.5); why.unshift('✖ waarden lijken niet te kloppen — oordeel onzeker'); }
    return { lv: lv(s), s: s, why: why, warn: warn, pro: pro, con: con, n: o };
  };
  App.rateGroup = function (list, ctx, isDay) {
    if (!list || !list.length) return null; ctx = ctx || {};
    var tk = 0, ws = 0, cnt = { hg: 0, g: 0, m: 0, s: 0 }, why = [], sum = { kcal: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, gl: 0 }, veg = 0, fruit = 0, meals = {};
    list.forEach(function (e) { var r = App.rateFood(e, ctx), k = Math.max(+e.kcal || 0, 20), o = r.n; tk += k; ws += r.s * k; cnt[r.lv.k]++;
      sum.kcal += o.kcal; sum.p += o.p; sum.c += o.c; sum.f += o.f; sum.fib += o.fib || 0; sum.gl += o.gl || 0;
      if (o.sug != null && ((o.nova || 0) >= 3 || o.cat === 'sweet')) sum.sug += o.sug;
      if (o.cat === 'veg') veg += o.g || 80; if (o.cat === 'fruit') fruit += o.g || 100;
      var mk = e.meal || 'x'; meals[mk] = (meals[mk] || 0) + o.p; });
    var s = ws / tk, T = ctx.T;
    if (isDay) {
      if (T && T.p) { if (sum.p >= T.p * 0.9) { s += 0.5; why.push('✔ eiwit ' + R(sum.p) + '/' + T.p + ' g'); } else if (sum.p < T.p * 0.6) { s -= 0.6; why.push('✖ te weinig eiwit: ' + R(sum.p) + '/' + T.p + ' g'); } else why.push('eiwit ' + R(sum.p) + '/' + T.p + ' g'); }
      var pm = Object.keys(meals).filter(function (k) { return meals[k] >= 20; }).length;
      if (Object.keys(meals).length >= 3) { if (pm >= 3) { s += 0.3; why.push('✔ eiwit goed verdeeld (' + pm + ' momenten ≥20 g)'); } else if (pm <= 1) { s -= 0.3; why.push('✖ eiwit slecht verdeeld (' + pm + '× ≥20 g)'); } }
      var fibT = ctx.female ? 25 : 30;
      if (sum.fib >= fibT) { s += 0.4; why.push('✔ ' + R(sum.fib) + ' g vezels'); } else if (sum.kcal > 1000) { if (sum.fib < fibT * 0.5) s -= 0.4; why.push((sum.fib < fibT * 0.5 ? '✖ ' : '') + 'vezels ' + R(sum.fib) + '/' + fibT + ' g'); }
      if (veg >= 250) { s += 0.3; why.push('✔ ' + R(veg) + ' g groente'); } else if (sum.kcal > 1000) { s -= 0.3; why.push('✖ groente ' + R(veg) + '/250 g'); }
      if (fruit >= 150) why.push('✔ ' + R(fruit) + ' g fruit');
      if (sum.sug >= 50) { s -= 0.6; why.push('✖ ' + R(sum.sug) + ' g toegevoegde suiker (max ±50 g)'); }
      if (T && T.kcal) { if (sum.kcal > T.kcal * 1.15) { s -= 0.5; why.push('✖ ' + R(sum.kcal - T.kcal) + ' kcal boven doel'); } else if (sum.kcal >= T.kcal * 0.85) why.push('✔ kcal ' + R(sum.kcal) + '/' + T.kcal); }
      if (ctx.diabetes && T && T.c) { if (sum.c > T.c * 1.15) { s -= 0.5; why.push('✖ koolhydraten ' + R(sum.c) + '/' + T.c + ' g (diabetesgrens)'); } else why.push('✔ koolhydraten ' + R(sum.c) + '/' + T.c + ' g'); }
    } else {
      if (sum.p >= 25) { s += 0.3; why.push('✔ ' + R(sum.p) + ' g eiwit'); } else if (sum.kcal > 300 && sum.p < 15) { s -= 0.3; why.push('✖ maar ' + R(sum.p) + ' g eiwit'); }
      if (sum.fib >= 8) why.push('✔ ' + R(sum.fib) + ' g vezels');
      if (veg > 0) { s += 0.2; why.push('✔ groente erbij'); }
      if (ctx.diabetes && sum.gl >= 25) { s -= 0.5; why.push('✖ maaltijd-GL ~' + R(sum.gl)); }
    }
    why.unshift(cnt.hg + '🟢 ' + cnt.g + '👍 ' + cnt.m + '🟡 ' + cnt.s + '🔴');
    return { lv: lv(s), s: s, cnt: cnt, why: why, sum: sum };
  };
  App.rateBadge = function (r, small) { if (!r) return ''; return '<span class="fr-badge fr-' + r.lv.k + '" title="' + esc(r.lv.l) + '">' + r.lv.e + (small ? '' : ' ' + esc(r.lv.l)) + '</span>'; };
  App.rateWhyHtml = function (r, id) {
    if (!r) return '';
    return '<div class="fr-why">' + App.rateBadge(r) + ' <span>' + esc(r.why.join(' · ')) + '</span>' +
      (r.warn ? '<div class="fr-warn">' + esc(r.warn.msg) + (id ? ' <button class="btn sm" data-act="food-edit" data-id="' + esc(id) + '">✏️ Aanpassen</button>' : '') + '</div>' : '') + '</div>';
  };
  // ---- client: card right after logging ----
  var pend = [], tmr = null;
  function me() { return (window.S && window.S.me) || (App.S && App.S.me) || null; }
  function showCard() {
    var items = pend; pend = []; if (!items.length) return;
    var ctx = App.foodCtx(me()), old = document.querySelector('.fr-card'); if (old) old.remove();
    var el = document.createElement('div'); el.className = 'fr-card'; el.setAttribute('role', 'status');
    el.innerHTML = '<div class="row between"><b style="color:#c9a227">Coach-check van je eten</b><button class="icon-btn fr-x" aria-label="Sluiten">✕</button></div>' +
      items.map(function (x) { var r = App.rateFood(x.e, ctx); return '<div class="fr-item"><b>' + esc(x.e.name) + '</b> <span class="tiny muted">' + x.e.g + ' g · ' + Math.round(x.e.kcal) + ' kcal</span>' + App.rateWhyHtml(r) +
        '<div class="row" style="gap:6px;margin-top:4px"><button class="btn sm" data-fr-edit="' + esc(x.e.id) + '" data-iso="' + x.iso + '">✏️ Aanpassen</button><button class="btn sm" data-fr-swap="' + esc(x.e.id) + '" data-iso="' + x.iso + '">🔄 Ander product</button></div></div>'; }).join('');
    document.body.appendChild(el);
    el.onclick = function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      if (b.classList.contains('fr-x')) return el.remove();
      if (b.dataset.frEdit) { el.remove(); App.editFoodSheet(b.dataset.iso, b.dataset.frEdit); }
      if (b.dataset.frSwap) { el.remove(); App.swapFood(b.dataset.iso, b.dataset.frSwap); }
    };
    clearTimeout(el._t); el._t = setTimeout(function () { if (el.parentNode) el.remove(); }, 15000);
  }
  App.swapFood = function (iso, id) {
    var m = me(), day = (m.food[iso] || []), e = day.filter(function (x) { return x.id === id; })[0]; if (!e) return;
    App.foodSearchSheet(function (fd) {
      App.portionSheet(fd, { cta: 'Vervangen', meal: e.meal, onPick: function (g) {
        var x = App.macrosFor(fd, g); Object.assign(e, { fid: fd.id, name: App.foodName(fd), g: Math.round(g), edited: Date.now() }, x);
        App.save(); App.closeSheets && App.closeSheets(); App.rerender(); pend.push({ e: e, iso: iso }); setTimeout(showCard, 50);
      } });
    }, 'Ander product kiezen');
  };
  var orig = App.logFood;
  if (orig) App.logFood = function (fd, g, meal, src, extra) {
    var r = orig.apply(this, arguments), iso = location.hash.indexOf('#/food') === 0 ? App.foodDate : App.today();
    var day = (me().food[iso] || []), e = day[day.length - 1];
    if (e) { pend.push({ e: e, iso: iso }); clearTimeout(tmr); tmr = setTimeout(showCard, 400); }
    return r;
  };
  // edit sheet: add rating + swap button
  var oEdit = App.editFoodSheet;
  if (oEdit) App.editFoodSheet = function (iso, id) {
    var r = oEdit.apply(this, arguments);
    setTimeout(function () {
      var m = me(), e = (m.food[iso] || []).filter(function (x) { return x.id === id; })[0], sh = document.querySelector('#fe-name'); if (!e || !sh) return;
      var box = document.createElement('div'); box.innerHTML = App.rateWhyHtml(App.rateFood(e, App.foodCtx(m))) + '<button class="btn sm block" style="margin:6px 0" id="fe-swap">🔄 Ander product kiezen</button>';
      var lab = sh.closest('label'); lab.parentNode.insertBefore(box, lab);
      box.querySelector('#fe-swap').onclick = function () { App.closeSheets && App.closeSheets(); App.swapFood(iso, id); };
    }, 30);
    return r;
  };
})();
