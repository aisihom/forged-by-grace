/* Forged by Grace — Week overzicht (coach): logged workouts + food per week, coach comments (manual or rule-based "AI" summary), synced via clients.coach_feedback. */
(function () {
  'use strict';
  var App = window.App, esc = App.esc, A = App.acts;
  var DB = (window.FBG_DATA && window.FBG_DATA.BY_ID) || {};
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = String(s).slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function monday(s) { var d = parse(s), w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return iso(d); }
  function addD(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  var DN = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'], MN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  function fmt(s) { var d = parse(s); return DN[(d.getDay() + 6) % 7] + ' ' + d.getDate() + ' ' + MN[d.getMonth()]; }
  function exName(id) { var e = DB[id]; return (e && (e.name || e.n)) || String(id).replace(/-/g, ' '); }
  function r0(x) { return Math.round(x); }
  function sets(it) { var s = it.sets || []; var d = s.filter(function (x) { return x.done; }); return d.length ? d : s.filter(function (x) { return x.done !== false; }); }
  function vol(s) { var v = 0; (s.items || []).forEach(function (it) { sets(it).forEach(function (x) { v += (+x.w || 0) * (+x.r || 0); }); }); return v; }
  function nsets(s) { var n = 0; (s.items || []).forEach(function (it) { n += sets(it).length; }); return n; }
  function ftot(list) { var t = { kcal: 0, p: 0, c: 0, f: 0 }; (list || []).forEach(function (e) { t.kcal += +e.kcal || 0; t.p += +e.p || 0; t.c += +e.c || 0; t.f += +e.f || 0; }); return t; }

  function weekData(c, wk) {
    var d = (c.live && c.live.d) || {}, end = addD(wk, 6);
    var all = (d.sessions || c.sessions || []).slice(), wp = d.extra && d.extra.wip;
    if (wp && wp.date && wp.items && !all.some(function (s) { return s.id === wp.id; })) all.push({ id: wp.id, date: wp.date, title: '⏸ Onvoltooid · ' + (wp.title || 'Training'), type: wp.type, wip: true, dur: Math.round(((wp.pausedAt || wp.savedAt || Date.now()) - wp.startedAt - (wp.pausedMs || 0)) / 1000), items: wp.items.map(function (it) { return { ex: it.ex, sets: it.sets.filter(function (x) { return x.done; }).map(function (x) { return { w: +x.w || 0, r: +x.r || 0, done: true }; }) }; }) });
    var ss = all.filter(function (s) { return s.date >= wk && s.date <= end; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var food = d.food || {}, days = [];
    for (var i = 0; i < 7; i++) { var k = addD(wk, i); if (food[k] && food[k].length) days.push([k, ftot(food[k]), food[k]]); }
    return { wk: wk, end: end, ss: ss, days: days };
  }
  function weeks(c) {
    var d = (c.live && c.live.d) || {}, set = {};
    set[monday(iso(new Date()))] = 1;
    (d.sessions || []).forEach(function (s) { if (s.date) set[monday(s.date)] = 1; });
    Object.keys(d.food || {}).forEach(function (k) { if ((d.food[k] || []).length) set[monday(k)] = 1; });
    Object.keys(d.water || {}).forEach(function (k) { set[monday(k)] = 1; });
    return Object.keys(set).sort().reverse().slice(0, 8);
  }


  var MEAL = { breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Avondeten', snack: 'Snack', snacks: 'Snack', pre: 'Pre-workout', post: 'Post-workout' };
  function mealName(m) { return MEAL[m] || (m ? String(m) : 'Overig'); }
  function hm(ts) { if (!ts) return ''; var d = new Date(+ts || ts); return isNaN(d) ? '' : pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function n1(x) { return Math.round((+x || 0) * 10) / 10; }
  function dash(v, suf) { return v == null || v === '' ? '—' : v + (suf || ''); }
  function hdays(d) { var a = (d.health && d.health.days) || {}, b = (d.health_sync && d.health_sync.days) || {}; return [a, b]; }
  function dayInfo(c, d, k) {
    var food = (d.food || {})[k] || [], H = hdays(d), h = H[0][k] || {}, hs = H[1][k] || {};
    var wp0 = d.extra && d.extra.wip, ss = (d.sessions || c.sessions || []).filter(function (s) { return s.date === k; });
    if (wp0 && wp0.date === k && wp0.items && !ss.some(function (s) { return s.id === wp0.id; })) ss.push({ id: wp0.id, date: k, title: '⏸ Onvoltooid · ' + (wp0.title || 'Training'), type: wp0.type, wip: true, items: wp0.items.map(function (it) { return { ex: it.ex, sets: it.sets.filter(function (x) { return x.done; }).map(function (x) { return { w: +x.w || 0, r: +x.r || 0, done: true }; }) }; }) });
    var est = 0; ss.forEach(function (s) { if (s.estSteps > 0) est += s.estSteps; });
    var sync = h.steps != null ? h.steps : (hs.steps != null ? hs.steps : null), steps = null;
    if (h.ov != null) steps = h.ov; else if (sync != null || h.man || est) steps = (sync || 0) + (h.man || 0) + est;
    var hab = (d.habits || {})[k] || {};
    var sleep = h.sleep != null ? h.sleep : (hs.sleep != null ? hs.sleep : null);
    var water = d.water && d.water[k] != null ? +d.water[k] : null;
    return { k: k, food: food, t: ftot(food), water: water, steps: steps, stepsSync: sync, sleep: sleep, sleepHab: !!hab.sleep, hab: hab, ss: ss, kcalBurn: hs.kcal != null ? hs.kcal : (h.kcal != null ? h.kcal : null), rhr: h.rhr || hs.rhr || null };
  }
  function tgt(c) { var P = c.profile || {}; return P.targetsOverride || (App.calcTargets && App.calcTargets(P)) || (c.meal && c.meal.targets) || null; }
  function wGoal(c, d) { return (d.extra && d.extra.waterGoal) || c.waterGoal || 3000; }
  function weekStats(c, W) {
    var d = (c.live && c.live.d) || {}, D = [], A = { fd: 0, kcal: 0, p: 0, c: 0, f: 0, wd: 0, w: 0, sd: 0, s: 0, ld: 0, l: 0, sh: 0, n: W.ss.length };
    for (var i = 0; i < 7; i++) { var x = dayInfo(c, d, addD(W.wk, i)); D.push(x);
      if (x.food.length) { A.fd++; A.kcal += x.t.kcal; A.p += x.t.p; A.c += x.t.c; A.f += x.t.f; }
      if (x.water != null) { A.wd++; A.w += x.water; } if (x.steps != null) { A.sd++; A.s += x.steps; } if (x.sleep != null) { A.ld++; A.l += +x.sleep; } if (x.sleepHab) A.sh++; }
    function av(t, n) { return n ? r0(t / n) : null; }
    return { D: D, A: A, avg: { kcal: av(A.kcal, A.fd), p: av(A.p, A.fd), c: av(A.c, A.fd), f: av(A.f, A.fd), w: av(A.w, A.wd), s: av(A.s, A.sd), l: A.ld ? n1(A.l / A.ld) : null }, T: tgt(c), WG: wGoal(c, d) };
  }
  function pct(v, t) { return v != null && t ? ' <span class="muted">(' + r0(v / t * 100) + '%)</span>' : ''; }
  function sessLine(s) {
    var e = s.ext || {}, bits = [r0((s.dur || 0) / 60) + ' min'];
    if (s.type === 'sport' || s.type === 'external' || s.type === 'cardio') { if (e.dist) bits.push(e.dist + ' km'); if (e.kcal) bits.push(e.kcal + ' kcal'); if (s.rpe) bits.push('RPE ' + s.rpe); }
    else { bits.push(nsets(s) + ' sets'); bits.push(r0(vol(s)).toLocaleString('nl-NL') + ' kg'); }
    var icon = s.type === 'sport' ? ((App.sportEmoji && App.sportEmoji(s.sport)) || '🥊') : s.type === 'external' ? '⌚' : s.type === 'cardio' ? '🏃' : '🏋️';
    return icon + ' ' + esc(s.title || (s.type === 'sport' ? 'Sport' : 'Training')) + ' · ' + bits.join(' · ') + (s.notes ? ' · 📝 ' + esc(s.notes) : '');
  }
  var CTX = {};
  function rb(r, sm) { return App.rateBadge ? App.rateBadge(r, sm) : ''; }
  function ateLine(food) {
    var g = {}, order = []; (food || []).slice().sort(function (a, b) { return (a.at || 0) - (b.at || 0); }).forEach(function (e) { var m = e.meal || 'other'; if (!g[m]) { g[m] = []; order.push(m); } g[m].push(e); });
    return order.map(function (m) { return mealName(m) + ': ' + g[m].map(function (e) { return String(e.name || e.fid || 'item').replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase(); }).join(', '); }).join(' · ');
  }
  App.ateLine = ateLine;
  function dayHtml(x, T, WG) {
    var ctxd = Object.assign({}, CTX, { T: T || CTX.T }), dr = App.rateGroup && x.food.length ? App.rateGroup(x.food, ctxd, true) : null;
    var has = x.food.length || x.water != null || x.steps != null || x.sleep != null || x.sleepHab || x.ss.length;
    var h = '<details class="card" style="margin-top:8px;border-color:#3a3222"' + '><summary style="cursor:pointer;display:block"><div class="row between"><b>' + esc(fmt(x.k)) + (dr ? ' ' + rb(dr, true) : '') + '</b><span class="tiny muted">' +
      (x.food.length ? r0(x.t.kcal) + ' kcal' : '— kcal') + ' · 💧 ' + (x.water != null ? (x.water / 1000).toFixed(1).replace('.', ',') + ' L' : '—') + ' · 👣 ' + (x.steps != null ? r0(x.steps).toLocaleString('nl-NL') : '—') + ' · 😴 ' + (x.sleep != null ? n1(x.sleep) + ' u' : x.sleepHab ? '7u+ ✓' : '—') + ' · 🏋️ ' + x.ss.length + '</span></div>' + (x.food.length ? '<div class="tiny" style="color:#e8d9a8;margin-top:3px;line-height:1.4">🍽️ ' + esc(ateLine(x.food)) + '</div>' : '') + '</summary>';
    if (!has) return h + '<p class="tiny muted">Niets gelogd.</p></details>';
    // food per meal
    h += '<div style="margin-top:8px"><span class="label" style="color:#c9a227">🍽️ Voeding</span>';
    if (!x.food.length) h += '<p class="tiny muted">—</p>';
    else {
      var g = {}, order = []; x.food.slice().sort(function (a, b) { return (a.at || 0) - (b.at || 0); }).forEach(function (e) { var m = e.meal || 'other'; if (!g[m]) { g[m] = []; order.push(m); } g[m].push(e); });
      order.forEach(function (m) { var mt = ftot(g[m]);
        h += '<div class="tiny" style="margin:6px 0 2px;color:#c9a227"><b>' + esc(mealName(m)) + '</b> ' + (App.rateGroup ? rb(App.rateGroup(g[m], ctxd), true) + ' ' : '') + '· ' + r0(mt.kcal) + ' kcal · E ' + r0(mt.p) + ' · K ' + r0(mt.c) + ' · V ' + r0(mt.f) + '</div>';
        g[m].forEach(function (e) { var img = e.photo || e.img || e.thumb, fr = App.rateFood ? App.rateFood(e, ctxd) : null;
          h += '<div class="tiny" style="display:flex;gap:6px;align-items:center;padding:2px 0;border-bottom:1px solid #2a2418">' + (img && /^(data:image|https:)/.test(img) ? '<img src="' + esc(img) + '" style="width:32px;height:32px;object-fit:cover;border-radius:6px" alt="">' : '') +
            '<span style="flex:1"><b style="font-size:15px;color:#f3e6c0">' + esc(e.name || e.fid || 'Item') + '</b> ' + (fr ? rb(fr, true) : '') + '<br><span class="muted">' + (e.g ? r0(e.g) + ' g' : e.qty ? esc(e.qty) : '') + (hm(e.at) ? ' · ' + hm(e.at) : '') + ' · ' + r0(e.kcal) + ' kcal · E ' + n1(e.p) + ' K ' + n1(e.c) + ' V ' + n1(e.f) + '</span>' + (e.recipe && e.recipe.parts ? '<br><span class="muted">🍲 recept: ' + esc(e.recipe.parts.map(function (q) { return q[1] + ' g ' + q[0]; }).join(' · ')) + '</span>' : '') + (fr ? '<br><span class="muted">' + esc(fr.lv.l + ': ' + fr.why.join(' · ')) + '</span>' + (fr.warn ? '<br><span style="color:#e0a030">' + esc(fr.warn.msg) + '</span>' : '') : '') + '</span></div>'; }); });
      h += '<div class="tiny" style="margin-top:4px"><b>Totaal:</b> ' + r0(x.t.kcal) + (T ? '/' + T.kcal : '') + ' kcal' + pct(x.t.kcal, T && T.kcal) + ' · E ' + r0(x.t.p) + (T ? '/' + T.p : '') + ' g · K ' + r0(x.t.c) + (T ? '/' + T.c : '') + ' g · V ' + r0(x.t.f) + (T ? '/' + T.f : '') + ' g</div>' + (dr ? '<div class="tiny" style="margin-top:2px"><b>Dagoordeel:</b> ' + rb(dr) + ' <span class="muted">' + esc(dr.why.join(' · ')) + '</span></div>' : '');
    }
    h += '</div><div class="tiny" style="margin-top:8px;line-height:1.7"><b style="color:#c9a227">💧 Water:</b> ' + (x.water != null ? r0(x.water) + ' / ' + WG + ' ml' + pct(x.water, WG) : '—') +
      '<br><b style="color:#c9a227">😴 Slaap:</b> ' + (x.sleep != null ? n1(x.sleep) + ' uur' : x.sleepHab ? '7u+ afgevinkt' : '—') +
      '<br><b style="color:#c9a227">👣 Stappen:</b> ' + (x.steps != null ? r0(x.steps).toLocaleString('nl-NL') + (x.stepsSync != null && x.stepsSync !== x.steps ? ' <span class="muted">(waarvan ' + r0(x.stepsSync).toLocaleString('nl-NL') + ' gesynct)</span>' : x.stepsSync != null ? ' <span class="muted">(gesynct)</span>' : '') : '—') +
      (x.kcalBurn != null ? '<br><b style="color:#c9a227">🔥 Actief verbrand:</b> ' + r0(x.kcalBurn) + ' kcal' : '') + (x.rhr ? ' · ❤️ ' + x.rhr + ' bpm' : '') +
      '<br><b style="color:#c9a227">🏋️ Trainingen:</b> ' + (x.ss.length ? x.ss.map(sessLine).join('<br>') : '—');
    var hb = Object.keys(x.hab).filter(function (k) { return x.hab[k]; }); if (hb.length) h += '<br><b style="color:#c9a227">✔️ Gewoontes:</b> ' + esc(hb.join(', '));
    return h + '</div></details>';
  }
  function totalsHtml(S, W) {
    var a = S.avg, A = S.A, T = S.T;
    function cell(v, l) { return '<div class="stat"><div class="v" style="color:#c9a227">' + v + '</div><div class="l">' + l + '</div></div>'; }
    var adh = T && A.fd ? S.D.filter(function (x) { return x.food.length && Math.abs(x.t.kcal - T.kcal) <= T.kcal * 0.1; }).length + '/' + A.fd : '—';
    return '<div class="grid3" style="margin-top:8px">' + cell(dash(a.kcal), 'gem. kcal' + (T ? ' (doel ' + T.kcal + ')' : '')) + cell(dash(a.p, ' g'), 'gem. eiwit' + (T ? ' (' + T.p + ')' : '')) + cell(A.fd + '/7', 'dagen eten gelogd') +
      cell(a.w != null ? (a.w / 1000).toFixed(1).replace('.', ',') + ' L' : '—', 'gem. water (' + (S.WG / 1000).toFixed(1).replace('.', ',') + ' L)') + cell(a.l != null ? a.l + ' u' : (A.sh ? A.sh + '× 7u+' : '—'), 'gem. slaap') + cell(a.s != null ? a.s.toLocaleString('nl-NL') : '—', 'gem. stappen') +
      cell(A.n, 'trainingen') + cell(dash(a.c, ' g') + ' / ' + dash(a.f, ' g'), 'gem. K / V') + cell(adh, 'dagen ±10% kcal') + '</div>';
  }

  // ---- rule-based Dutch weekly summary ----
  App.weekSummary = function (c, W) {
    var T = App.calcTargets(c.profile || {}) || (c.meal && c.meal.targets) || null;
    var planned = App.trainDays(c.plan) || 0, first = String(c.name || '').split(' ')[0] || '';
    var L = [], good = [], better = []; CTX = App.foodCtx ? App.foodCtx(c) : {};
    var tv = 0, tm = 0, ts = 0;
    W.ss.forEach(function (s) { tv += vol(s); tm += (s.dur || 0) / 60; ts += nsets(s); });
    L.push('Weekoverzicht ' + fmt(W.wk) + ' – ' + fmt(W.end) + (first ? ' · ' + first : ''));
    L.push('');
    L.push('🏋️ Training: ' + W.ss.length + (planned ? '/' + planned : '') + ' trainingen · ' + r0(tm) + ' min · ' + ts + ' sets · ' + r0(tv).toLocaleString('nl-NL') + ' kg volume.');
    W.ss.forEach(function (s) {
      var top = [];
      (s.items || []).forEach(function (it) { var b = 0, br = 0; sets(it).forEach(function (x) { if ((+x.w || 0) > b) { b = +x.w; br = x.r; } }); if (b) top.push(exName(it.ex) + ' ' + b + ' kg × ' + br); });
      L.push('• ' + fmt(s.date) + ' – ' + (s.title || 'Training') + ' (' + r0((s.dur || 0) / 60) + ' min): ' + (top.slice(0, 4).join(', ') || nsets(s) + ' sets'));
      (s.prs || []).length && good.push('PR(s) gehaald op ' + fmt(s.date));
      var miss = (s.items || []).filter(function (it) { return !sets(it).length; }).map(function (it) { return exName(it.ex); });
      if (miss.length) better.push('Niet afgerond op ' + fmt(s.date) + ': ' + miss.join(', ') + '.');
    });
    if (planned) {
      if (W.ss.length >= planned) good.push('Alle ' + planned + ' geplande trainingen gedaan — top consistentie.');
      else if (W.ss.length) better.push('Nog ' + (planned - W.ss.length) + ' training(en) te gaan om je schema van ' + planned + '×/week te halen.');
      else better.push('Geen trainingen gelogd deze week — plan je trainingen vast in je agenda.');
    }
    if (W.ss.length) good.push('Goede inzet in de gym: ' + r0(tv).toLocaleString('nl-NL') + ' kg totaal volume.');
    L.push('');
    if (W.days.length) {
      var a = { kcal: 0, p: 0, c: 0, f: 0 }; W.days.forEach(function (x) { a.kcal += x[1].kcal; a.p += x[1].p; a.c += x[1].c; a.f += x[1].f; });
      var n = W.days.length; Object.keys(a).forEach(function (k) { a[k] = r0(a[k] / n); });
      L.push('🍽️ Voeding: ' + n + '/7 dagen gelogd · gem. ' + a.kcal + ' kcal · E ' + a.p + ' g · K ' + a.c + ' g · V ' + a.f + ' g' + (T ? ' (doel ' + T.kcal + ' kcal · E ' + T.p + ' · K ' + T.c + ' · V ' + T.f + ')' : '') + '.');
      var RC = { hg: 0, g: 0, m: 0, s: 0 }, warns = [], worst = [];
      W.days.forEach(function (x) { var dr = App.rateGroup ? App.rateGroup(x[2] || [], Object.assign({}, CTX, { T: T || CTX.T }), true) : null;
        L.push('• ' + fmt(x[0]) + (dr ? ' ' + dr.lv.e : '') + ': ' + r0(x[1].kcal) + ' kcal · E ' + r0(x[1].p) + ' · K ' + r0(x[1].c) + ' · V ' + r0(x[1].f) + ' — ' + (App.ateLine ? App.ateLine(x[2]) : ''));
        (x[2] || []).forEach(function (e) { if (!App.rateFood) return; var r = App.rateFood(e, Object.assign({}, CTX, { T: T })); RC[r.lv.k]++; if (r.warn) warns.push(e.name); if (r.lv.k === 's') worst.push(e.name); }); });
      if (App.rateFood) { L.push('🍽️ Voedingsoordeel items: ' + RC.hg + '× 🟢 heel goed · ' + RC.g + '× 👍 goed · ' + RC.m + '× 🟡 matig · ' + RC.s + '× 🔴 slecht.');
        var tot = RC.hg + RC.g + RC.m + RC.s; if (tot && (RC.hg + RC.g) / tot >= 0.75) good.push('Voedingskeuzes vooral goed (' + (RC.hg + RC.g) + '/' + tot + ' items 🟢/👍).');
        if (worst.length) better.push('Minder vaak: ' + worst.filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 4).join(', ') + ' (🔴).');
        if (warns.length) better.push('Check je logs: waarden van ' + warns.filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') + ' kloppen niet — kies het juiste product.'); }
      if (T) {
        var hit = W.days.filter(function (x) { return Math.abs(x[1].kcal - T.kcal) <= T.kcal * 0.1; }).length;
        L.push('Binnen ±10% van je caloriedoel: ' + hit + '/' + n + ' dagen.');
        var dk = a.kcal - T.kcal;
        if (Math.abs(dk) <= T.kcal * 0.1) good.push('Calorieën netjes rond je doel.');
        else if (dk < 0) better.push('Gemiddeld ' + (-dk) + ' kcal onder je doel — voeg een extra maaltijd of snack toe.');
        else better.push('Gemiddeld ' + dk + ' kcal boven je doel — let op porties en snacks.');
        if (a.p >= T.p * 0.9) good.push('Eiwit op niveau (' + a.p + ' g gem.).'); else better.push('Eiwit te laag: ' + a.p + ' g i.p.v. ' + T.p + ' g — eiwit bij elke maaltijd.');
        if (a.c > T.c * 1.15) better.push('Koolhydraten boven doel (' + a.c + ' g vs ' + T.c + ' g).');
        if (a.f > T.f * 1.2) better.push('Vet boven doel (' + a.f + ' g vs ' + T.f + ' g).');
      }
      if (n < 5) better.push('Log je eten op minimaal 5 dagen, dan kan ik je beter bijsturen.');
      else good.push('Voeding goed bijgehouden (' + n + '/7 dagen).');
    } else { L.push('🍽️ Voeding: niets gelogd deze week.'); better.push('Begin met je eten loggen (foto, tekst of screenshot) — minimaal 5 dagen per week.'); }
    L.push('');
    (function () { var X = weekStats(c, W), a = X.avg, A = X.A;
      L.push('💧 Water: ' + (a.w != null ? 'gem. ' + a.w + ' ml/dag (' + A.wd + ' dagen gelogd, doel ' + X.WG + ' ml).' : 'niet gelogd.'));
      if (a.w != null) { if (a.w >= X.WG * 0.9) good.push('Goed gedronken: gem. ' + (a.w / 1000).toFixed(1) + ' L per dag.'); else better.push('Drink meer water: gem. ' + (a.w / 1000).toFixed(1) + ' L i.p.v. ' + (X.WG / 1000).toFixed(1) + ' L.'); } else better.push('Log je water elke dag (tik +0,5 L).');
      L.push('😴 Slaap: ' + (a.l != null ? 'gem. ' + a.l + ' uur (' + A.ld + ' nachten).' : A.sh ? A.sh + '× 7u+ afgevinkt.' : 'niet gelogd.'));
      if (a.l != null) { if (a.l >= 7) good.push('Slaap op orde (gem. ' + a.l + ' u).'); else better.push('Meer slaap: gem. ' + a.l + ' u — mik op 7–9 uur.'); }
      L.push('👣 Stappen: ' + (a.s != null ? 'gem. ' + a.s.toLocaleString('nl-NL') + ' per dag (' + A.sd + ' dagen).' : 'niet gelogd/gesynct.'));
      if (a.s != null) { if (a.s >= 8000) good.push('Lekker actief: gem. ' + a.s.toLocaleString('nl-NL') + ' stappen.'); else better.push('Meer bewegen: gem. ' + a.s.toLocaleString('nl-NL') + ' stappen — doel 8.000+.'); }
      var sp = W.ss.filter(function (s) { return s.type && s.type !== 'strength'; }); if (sp.length) L.push('🥊 Sport/cardio: ' + sp.map(function (s) { return (s.title || s.type) + ' ' + r0((s.dur || 0) / 60) + ' min'; }).join(', ') + '.');
      L.push(''); })();
    L.push('✅ Wat ging goed:'); (good.length ? good : ['Je bent bezig — dat is de eerste stap.']).forEach(function (x) { L.push('• ' + x); });
    L.push('🎯 Verbeterpunten:'); (better.length ? better : ['Zo doorgaan en volgende week iets zwaarder of een herhaling meer.']).forEach(function (x) { L.push('• ' + x); });
    L.push('');
    L.push('Coach-oordeel: ' + (better.length <= 1 ? 'Sterke week! Houd dit vast en bouw progressief op. 💪' : better.length <= 3 ? 'Goede basis — pak de verbeterpunten één voor één aan.' : 'Er is ruimte voor groei; focus deze week op consistent trainen en loggen.'));
    return L.join('\n');
  };

  function sessionHtml(c, s, fb) {
    var h = '<details class="card" style="margin-top:8px"><summary class="row between" style="cursor:pointer"><b>' + esc(fmt(s.date) + ' · ' + (s.title || 'Training')) + '</b><span class="tiny muted">' + r0((s.dur || 0) / 60) + ' min · ' + nsets(s) + ' sets · ' + r0(vol(s)).toLocaleString('nl-NL') + ' kg</span></summary>';
    (s.items || []).forEach(function (it) {
      var all = it.sets || [];
      h += '<div style="margin-top:8px"><b class="small">' + esc(exName(it.ex)) + '</b>' + (it.note ? ' <span class="tiny muted">' + esc(it.note) + '</span>' : '') + '<div class="tiny">' +
        all.map(function (x, i) { return '<span style="display:inline-block;margin:2px 8px 2px 0;' + (x.done === false ? 'opacity:.45' : '') + '">' + (i + 1) + ') ' + (+x.w ? x.w + ' kg × ' : '') + (x.r != null ? x.r : '—') + (x.rpe ? ' @RPE ' + x.rpe : '') + (x.note ? ' · ' + esc(x.note) : '') + (x.done === false ? ' (niet gedaan)' : '') + '</span>'; }).join('') + '</div></div>';
    });
    var sc = ((fb.sessions || {})[s.id] || {}).text || '';
    h += '<label class="field" style="margin-top:10px"><span class="label">Opmerking bij deze training</span><textarea class="input" rows="2" id="wv-s-' + esc(s.id) + '">' + esc(sc) + '</textarea></label><button class="btn sm" data-act="wv-save-s" data-c="' + esc(c.id) + '" data-s="' + esc(s.id) + '">Opslaan</button></details>';
    return h;
  }

  App.weekOverview = function (c) {
    CTX = App.foodCtx ? App.foodCtx(c) : {};
    var fb = c.coachFb || {}, h = '<div class="section"><div class="section-head"><h2 class="h2">Week overzicht</h2></div>';
    var tdF = (((c.live && c.live.d) || {}).food || {})[App.today()] || [];
    if (tdF.length) { var tr = App.rateGroup ? App.rateGroup(tdF, CTX, true) : null, tt = ftot(tdF); h += '<div class="card" style="border-color:#c9a227"><b style="color:#c9a227">🍽️ Vandaag gegeten</b> ' + rb(tr) + ' <span class="tiny muted">' + r0(tt.kcal) + ' kcal · E ' + r0(tt.p) + ' g</span><div style="margin-top:4px;font-weight:600">' + esc(ateLine(tdF)) + '</div></div>'; }
    if (!c.live) h += '<p class="small muted">Zodra de klant live gekoppeld is, zie je hier elke gelogde training en voeding.</p>';
    weeks(c).forEach(function (wk) {
      var W = weekData(c, wk), tv = 0, tm = 0; W.ss.forEach(function (s) { tv += vol(s); tm += (s.dur || 0) / 60; });
      var wc = (fb.weeks || {})[wk] || {};
      h += '<div class="card" style="margin-top:10px;border-color:#c9a227"><div class="row between"><b>Week ' + esc(fmt(wk)) + ' – ' + esc(fmt(W.end)) + '</b><span class="tiny muted">' + W.ss.length + ' trainingen · ' + r0(tm) + ' min · ' + r0(tv).toLocaleString('nl-NL') + ' kg</span></div>';
      if (!W.ss.length) h += '<p class="tiny muted">Geen trainingen gelogd.</p>';
      W.ss.forEach(function (s) { h += sessionHtml(c, s, fb); });
      var X = weekStats(c, W); h += '<div style="margin-top:10px"><span class="label" style="color:#c9a227">📊 Weektotaal / gemiddeld</span>' + totalsHtml(X, W) + '</div><div style="margin-top:10px"><span class="label" style="color:#c9a227">📅 Per dag</span>' + X.D.map(function (x) { return dayHtml(x, X.T, X.WG); }).join('') + '</div>';
      h += '<div style="margin-top:10px"><span class="label">Opmerking voor de week</span><div class="grid2" style="margin:6px 0"><button class="btn sm" data-act="wv-manual" data-w="' + wk + '">✍️ Handmatig</button><button class="btn sm primary" data-act="wv-ai" data-c="' + esc(c.id) + '" data-w="' + wk + '">✨ AI samenvatting</button></div>' +
        '<textarea class="input" rows="' + (wc.text ? 8 : 3) + '" id="wv-w-' + wk + '" placeholder="Schrijf je opmerking of tik op AI samenvatting en pas aan…">' + esc(wc.text || '') + '</textarea>' +
        '<button class="btn primary block" style="margin-top:6px" data-act="wv-save-w" data-c="' + esc(c.id) + '" data-w="' + wk + '">Opslaan &amp; naar klant</button>' + (wc.at ? '<p class="tiny muted">Opgeslagen ' + esc(App.ago ? App.ago(wc.at) : wc.at) + '</p>' : '') + '</div></div>';
    });
    return h + '</div>';
  };

  function save(cid, mut) {
    var c = App.client(cid), sb = App.cloud && App.cloud.sb;
    if (!c || !c.cloudId || !sb) { App.toast('Klant is niet live gekoppeld'); return; }
    sb.from('clients').select('coach_feedback').eq('id', c.cloudId).single().then(function (r) {
      if (r.error) throw r.error;
      var fb = r.data.coach_feedback || {}; fb.weeks = fb.weeks || {}; fb.sessions = fb.sessions || {}; mut(fb);
      return sb.from('clients').update({ coach_feedback: fb }).eq('id', c.cloudId).then(function (u) { if (u.error) throw u.error; c.coachFb = fb; App.save(); App.toast('Opgeslagen ✓ — klant ziet het'); });
    }).catch(function (e) { App.toast('Opslaan mislukt: ' + (e.message || e)); });
  }
  A['wv-manual'] = function (el) { var ta = document.getElementById('wv-w-' + el.dataset.w); if (ta) { ta.rows = 6; ta.focus(); } };
  A['wv-ai'] = function (el) { var c = App.client(el.dataset.c), ta = document.getElementById('wv-w-' + el.dataset.w); if (!c || !ta) return; ta.value = App.weekSummary(c, weekData(c, el.dataset.w)); ta.rows = 16; ta.focus(); App.toast('Concept klaar — pas aan en tik Opslaan'); };
  A['wv-save-w'] = function (el) { var w = el.dataset.w, v = document.getElementById('wv-w-' + w).value.trim(); save(el.dataset.c, function (fb) { if (v) fb.weeks[w] = { text: v, at: new Date().toISOString() }; else delete fb.weeks[w]; }); };
  A['wv-save-s'] = function (el) { var s = el.dataset.s, v = document.getElementById('wv-s-' + s).value.trim(); save(el.dataset.c, function (fb) { if (v) fb.sessions[s] = { text: v, at: new Date().toISOString() }; else delete fb.sessions[s]; }); };

  // ---- client side: "Opmerking van je coach" ----
  App.coachFbCard = function (ath) {
    var fb = App.cloud && App.cloud.myFeedback && App.cloud.myFeedback(); if (!fb) return '';
    var cut = addD(monday(iso(new Date())), -7), items = [];
    Object.keys(fb.weeks || {}).filter(function (k) { return k >= cut; }).sort().reverse().forEach(function (k) { items.push('<p class="tiny muted" style="margin:8px 0 2px">Week ' + esc(fmt(k)) + ' – ' + esc(fmt(addD(k, 6))) + '</p><div class="small" style="white-space:pre-wrap">' + esc(fb.weeks[k].text) + '</div>'); });
    var ss = (ath && ath.sessions) || [];
    Object.keys(fb.sessions || {}).forEach(function (id) {
      var s = ss.filter(function (x) { return x.id === id; })[0]; if (s && s.date < cut) return;
      items.push('<p class="tiny muted" style="margin:8px 0 2px">' + esc(s ? fmt(s.date) + ' · ' + (s.title || 'Training') : 'Training') + '</p><div class="small" style="white-space:pre-wrap">' + esc(fb.sessions[id].text) + '</div>');
    });
    if (!items.length) return '';
    return '<div class="card" style="margin:12px 0;border:1px solid #c9a227"><b style="color:#c9a227">💬 Opmerking van je coach</b>' + items.join('') + '</div>';
  };
})();
