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
    var ss = (d.sessions || c.sessions || []).filter(function (s) { return s.date >= wk && s.date <= end; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var food = d.food || {}, days = [];
    for (var i = 0; i < 7; i++) { var k = addD(wk, i); if (food[k] && food[k].length) days.push([k, ftot(food[k])]); }
    return { wk: wk, end: end, ss: ss, days: days };
  }
  function weeks(c) {
    var d = (c.live && c.live.d) || {}, set = {};
    set[monday(iso(new Date()))] = 1;
    (d.sessions || []).forEach(function (s) { if (s.date) set[monday(s.date)] = 1; });
    Object.keys(d.food || {}).forEach(function (k) { if ((d.food[k] || []).length) set[monday(k)] = 1; });
    return Object.keys(set).sort().reverse().slice(0, 8);
  }

  // ---- rule-based Dutch weekly summary ----
  App.weekSummary = function (c, W) {
    var T = App.calcTargets(c.profile || {}) || (c.meal && c.meal.targets) || null;
    var planned = App.trainDays(c.plan) || 0, first = String(c.name || '').split(' ')[0] || '';
    var L = [], good = [], better = [];
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
      W.days.forEach(function (x) { L.push('• ' + fmt(x[0]) + ': ' + r0(x[1].kcal) + ' kcal · E ' + r0(x[1].p) + ' · K ' + r0(x[1].c) + ' · V ' + r0(x[1].f)); });
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
    var fb = c.coachFb || {}, h = '<div class="section"><div class="section-head"><h2 class="h2">Week overzicht</h2></div>';
    if (!c.live) h += '<p class="small muted">Zodra de klant live gekoppeld is, zie je hier elke gelogde training en voeding.</p>';
    weeks(c).forEach(function (wk) {
      var W = weekData(c, wk), tv = 0, tm = 0; W.ss.forEach(function (s) { tv += vol(s); tm += (s.dur || 0) / 60; });
      var wc = (fb.weeks || {})[wk] || {};
      h += '<div class="card" style="margin-top:10px;border-color:#c9a227"><div class="row between"><b>Week ' + esc(fmt(wk)) + ' – ' + esc(fmt(W.end)) + '</b><span class="tiny muted">' + W.ss.length + ' trainingen · ' + r0(tm) + ' min · ' + r0(tv).toLocaleString('nl-NL') + ' kg</span></div>';
      if (!W.ss.length) h += '<p class="tiny muted">Geen trainingen gelogd.</p>';
      W.ss.forEach(function (s) { h += sessionHtml(c, s, fb); });
      if (W.days.length) h += '<div class="tiny" style="margin-top:8px"><b>Voeding</b> · ' + W.days.map(function (x) { return esc(fmt(x[0])) + ': ' + r0(x[1].kcal) + ' kcal (E' + r0(x[1].p) + ' K' + r0(x[1].c) + ' V' + r0(x[1].f) + ')'; }).join(' · ') + '</div>';
      else h += '<p class="tiny muted" style="margin-top:8px">Geen voeding gelogd.</p>';
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
