/* Forged by Grace v2.5 — pet part 3: Sweatpoints engine, pet care, views. */
(function () {
  'use strict';
  var App = window.App, S = App.S, F = App.F, esc = App.esc, t = App.t, I = App.I, V = App.views, A = App.acts, P = App.PET, L = P.L;
  var DAY_CAP = 150, H = 3600e3;
  App.SP_RULES = { checkin: 5, steps6k: 10, steps8k: 10, steps10k: 15, workout: 30, sport: 20, sportMax: 2, foodLog: 10, onTarget: 20, streak7: 50, welcome: 50, dayCap: DAY_CAP, revive: 100 };
  function G() {
    var ath = S.me;
    if (!ath.game) ath.game = { sp: 0, total: 0, start: App.today(), log: [], got: {}, daySp: {}, owned: [], homes: ['pastures'], pet: null };
    var g = ath.game; ['owned', 'homes', 'log'].forEach(function (k) { if (!Array.isArray(g[k])) g[k] = []; });
    g.got = g.got || {}; g.daySp = g.daySp || {}; if (g.homes.indexOf('pastures') === -1) g.homes.unshift('pastures');
    return g;
  }
  App.game = G;
  function logIt(g, day, k, pts, l) { g.log.unshift({ d: day, ts: Date.now(), k: k, pts: pts, l: l }); if (g.log.length > 300) g.log.length = 300; }
  function award(g, key, day, pts, label, noCap) {
    if (g.got[key]) return 0;
    var used = g.daySp[day] || 0, give = noCap ? pts : Math.min(pts, Math.max(0, DAY_CAP - used));
    g.got[key] = 1; if (give <= 0) return 0;
    if (!noCap) g.daySp[day] = used + give;
    g.sp += give; g.total = (g.total || 0) + give; logIt(g, day, key.split(':')[0], give, label);
    return give;
  }
  // Award once per real event, from game start (max 7 days back), with a daily cap.
  App.gameSweep = function () {
    if (S.role !== 'athlete') return 0;
    var g = G(), ath = S.me, today = App.today(), e = 0, R = App.SP_RULES, from = App.isoAdd(today, -7);
    if (g.start > from) from = g.start;
    e += award(g, 'welcome', today, R.welcome, 'Welcome bonus', true);
    e += award(g, 'in:' + today, today, R.checkin, 'Check-in');
    var st = 0; for (var i = 0; i < 400; i++) { if (g.got['in:' + App.isoAdd(today, -i)]) st++; else break; }
    g.streak = st; if (st && st % 7 === 0) e += award(g, 'streak:' + today, today, R.streak7, 'Streak bonus', true);
    var T = App.athTargets(ath), n = {};
    for (var d = from; d <= today; d = App.isoAdd(d, 1)) {
      var hd = App.healthDay && App.healthDay(d), steps = (hd && hd.steps) || 0;
      if (steps >= 6000) e += award(g, 'st6:' + d, d, R.steps6k, '6,000+ steps');
      if (steps >= 8000) e += award(g, 'st8:' + d, d, R.steps8k, '8,000+ steps');
      if (steps >= 10000) e += award(g, 'st10:' + d, d, R.steps10k, '10,000+ steps');
      var fe = (ath.food && ath.food[d]) || [];
      if (fe.length >= 3) e += award(g, 'fl:' + d, d, R.foodLog, 'Food logged');
      if (d < today && fe.length >= 3 && T) { var x = App.dayTotals(fe); if (x.kcal >= T.kcal * 0.9 && x.kcal <= T.kcal * 1.1 && x.p >= T.p * 0.9) e += award(g, 'ft:' + d, d, R.onTarget, 'On target'); }
    }
    (ath.sessions || []).slice().sort(function (a, b) { return (a.endedAt || 0) - (b.endedAt || 0); }).forEach(function (s) {
      if (!s.date || s.date < from || s.date > today) return;
      if (s.type === 'sport' || s.type === 'external') { if (g.got['sid:' + s.id]) return; n[s.date] = (n[s.date] || 0); var k = 0; while (k < R.sportMax && g.got['sp:' + s.date + ':' + k]) k++; if (k >= R.sportMax) return; g.got['sid:' + s.id] = 1; e += award(g, 'sp:' + s.date + ':' + k, s.date, R.sport, 'Sport session'); }
      else e += award(g, 'wk:' + s.date, s.date, R.workout, 'Workout');
    });
    if (e) App.save();
    return e;
  };
  // vitals: food 100→0 in 30 h, drink in 24 h, joy in 48 h; dies 72 h after last food/drink
  function vit(p) {
    var hrs = Math.max(0, (Date.now() - p.ts) / H), since = Math.max(0, (Date.now() - p.care) / H);
    var f = Math.max(0, p.f - hrs * 100 / 30), w = Math.max(0, p.w - hrs * 100 / 24), j = Math.max(0, p.j - hrs * 100 / 48), dead = !!p.dead || since >= 72;
    return { f: Math.round(f), w: Math.round(w), j: Math.round(j), since: since, left: Math.max(1, Math.ceil(72 - since)), dead: dead, st: dead ? 'dead' : (f < 25 || w < 25 || since >= 24) ? 'sad' : (f > 55 && w > 55 && j > 40) ? 'happy' : 'ok' };
  }
  App.petVitals = vit;
  function settle(p) { var v = vit(p); p.f = v.f; p.w = v.w; p.j = v.j; p.ts = Date.now(); if (v.dead) p.dead = true; return v; }
  function nm(p) { return p.name || L(P.PETS[p.type]); }
  function dressed(p, st) { var eq = p.eq || {}; return P.ART[p.type](st) + P.LAYER.map(function (k) { return eq[k] && P.BY[eq[k]] ? P.BY[eq[k]].g() : ''; }).join(''); }
  function scene(p, opts) {
    opts = opts || {}; var se = P.season(), home = P.HBY[opts.home || (p && p.home) || 'pastures'] || P.HOMES[0];
    var sky = home.sky, id = 'k' + Math.random().toString(36).slice(2, 7);
    if (se === 'winter' && !home.night) sky = ['#c9dbe8', '#f4f8fb'];
    var s = '<svg class="pet-scene" viewBox="0 0 360 230" role="img" aria-label="' + esc(p ? nm(p) : L(home)) + '"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient><filter id="f' + id + '"><feColorMatrix type="saturate" values="0.1"/></filter></defs>' +
      '<rect width="360" height="230" fill="url(#' + id + ')"/>' + (se === 'summer' && !home.night ? P.particles('summer') : '') + home.d(P.SEAS[se].g) + P.decor(se);
    if (p) {
      var v = vit(p);
      s += '<g transform="translate(80 26)"' + (v.dead ? ' filter="url(#f' + id + ')" opacity=".7"' : '') + '><g' + (v.dead ? '' : ' class="pet-bob"') + '><ellipse cx="100" cy="188" rx="46" ry="7" fill="#000" opacity=".18"/>' + dressed(p, v.st) + '</g></g>';
      if (v.dead) s += '<g transform="translate(262 186)"><path d="M0 34v-22" stroke="#3f7d2a" stroke-width="3"/>' + [0, 72, 144, 216, 288].map(function (a) { return '<ellipse cx="0" cy="4" rx="4" ry="7" fill="#fff" transform="rotate(' + a + ' 0 11)"/>'; }).join('') + '<circle cx="0" cy="11" r="3" fill="#f0b429"/></g>';
    }
    if (se !== 'summer') s += P.particles(se, opts.still);
    return s + '</svg>';
  }
  function bar(l, v, c) { return '<div class="pet-stat"><div class="row between tiny"><b>' + esc(t(l)) + '</b><span>' + v + '%</span></div><div class="bar-track"><div class="bar-fill" style="width:' + v + '%;background:' + (v < 25 ? 'var(--bad)' : v < 50 ? 'var(--warn)' : c) + '"></div></div></div>'; }
  function status(p, v) {
    if (v.dead) return ['bad', t('has passed away…')];
    if (v.since >= 48) return ['bad', '⚠️ ' + t('is weak! Feed within {h} h or it will pass away.', { h: v.left })];
    if (v.st === 'sad') return ['warn', '🍞 ' + t('is hungry — feed it today!')];
    return ['good', '💛 ' + t('is happy and fed.')];
  }
  function spCard(g, full) {
    var td = g.daySp[App.today()] || 0;
    return '<div class="card sp-card"><div class="row between"><div><div class="kicker">' + esc(t('Sweatpoints')) + '</div><div class="sp-bal">' + g.sp.toLocaleString(S.lang) + ' <span>SP</span></div><div class="tiny muted">' + esc(t('Earned today')) + ': +' + td + ' / ' + DAY_CAP + (g.streak > 1 ? ' · 🔥 ' + g.streak : '') + '</div></div><div class="sp-coin">SP</div></div>' +
      (full && App.rewardsBlock ? App.rewardsBlock() : '') + '</div>';
  }
  function earn(g) {
    var R = App.SP_RULES, rows = [['Daily check-in (open the app)', '+' + R.checkin], ['Steps (6k / 8k / 10k)', '+10 / +20 / +35'], ['Strength workout completed', '+' + R.workout], ['Extra sport session logged (max 2 a day)', '+' + R.sport], ['Food logged (3+ items)', '+' + R.foodLog], ['Day within calories & protein target', '+' + R.onTarget], ['7-day check-in streak', '+' + R.streak7], ['Max per day', DAY_CAP + ' SP']];
    var h = '<div class="card"><b>' + esc(t('How you earn Sweatpoints')) + '</b><div style="margin-top:6px">' + rows.map(function (r) { return '<div class="row between small sp-row"><span>' + esc(t(r[0])) + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('') + '</div><p class="tiny muted" style="margin:8px 0 0">' + esc(t('Each thing counts once.')) + '</p></div>';
    return h + '<div class="section"><h2 class="h2" style="font-size:16px">' + esc(t('History')) + '</h2>' + (g.log.length ? '<div class="list">' + g.log.slice(0, 50).map(function (x) {
      var lab = (x.k === 'buy' || x.k === 'res' || x.k === 'ret' || x.k === 'redeemed') ? x.l : t(x.l); return '<div class="list-item"><div class="grow"><b>' + esc(lab) + '</b><div class="tiny muted">' + esc(F.fmtDay(x.d)) + '</div></div><b class="' + (x.pts < 0 ? 'muted' : 'sp-plus') + '">' + (x.pts > 0 ? '+' : '') + x.pts + '</b></div>'; }).join('') + '</div>' : '<p class="small muted">' + esc(t('No points yet — open the app daily, walk, train and log your food.')) + '</p>') + '</div>';
  }
  function chooser() {
    var h = '<h2 class="h2">' + esc(t('Choose your animal')) + '</h2><p class="small muted">' + esc(t('Every animal has its own Bible verse. Take good care of it!')) + '</p><div class="pet-choose">';
    Object.keys(P.PETS).forEach(function (k) { h += '<button class="pet-opt" data-act="pet-pick" data-k="' + k + '"><svg viewBox="30 10 140 185">' + P.ART[k]('happy') + '</svg><b>' + esc(L(P.PETS[k])) + '</b><span class="tiny muted">' + esc(P.verse(k).ref) + '</span></button>'; });
    return h + '</div>';
  }
  App.petTab = 'care';
  V.pet = function () {
    var g = G(), p = g.pet, h = App.header(t('My Pet'));
    if (!p) return h + spCard(g, true) + chooser();
    var v = vit(p), vs = P.verse(p.type), se = P.season(), stt = status(p, v);
    h += '<div class="pet-card">' + scene(p) + '<div class="pet-name row between"><div><b>' + esc(nm(p)) + '</b><div class="tiny muted">' + esc(L(P.PETS[p.type])) + ' · ' + esc(L(P.HBY[p.home] || P.HOMES[0])) + '</div></div><span class="pill">' + P.SEAS[se].e + ' ' + esc(t(P.SEAS[se].n)) + '</span></div></div>';
    h += '<div class="pet-alert ' + stt[0] + '"><b>' + esc(nm(p)) + '</b> ' + esc(stt[1]) + (v.dead ? '<div class="small" style="margin-top:4px">' + esc(t('Nobody fed it for 3 days. You can revive it, or start again with a new animal.')) + '</div>' : '') + '</div>';
    if (v.dead) return h + '<div class="grid2" style="margin-top:10px"><button class="btn primary" data-act="pet-revive">❤️ ' + esc(t('Revive')) + ' · ' + App.SP_RULES.revive + ' SP</button><button class="btn" data-act="pet-new">' + esc(t('New animal')) + '</button></div>' + spCard(g) + verseBox(vs);
    h += '<div class="card pet-stats">' + bar('Food', v.f, 'var(--good)') + bar('Thirst', v.w, 'var(--info)') + bar('Joy', v.j, 'var(--accent)') + '<p class="tiny muted" style="margin:8px 0 0">' + esc(t('Feed and give water every day. After 3 days without care your animal dies.')) + '</p></div>';
    h += spCard(g, true);
    var tabs = [['care', 'Food & drink'], ['wear', 'Wardrobe'], ['homes', 'Homes'], ['earn', 'Earn']];
    h += '<div class="seg pet-seg">' + tabs.map(function (x) { return '<button type="button" data-act="pet-tab" data-v="' + x[0] + '"' + (App.petTab === x[0] ? ' class="on"' : '') + '>' + esc(t(x[1])) + '</button>'; }).join('') + '</div>';
    if (App.petTab === 'care') {
      h += '<div class="pet-grid">' + P.FOOD.map(function (x) { return '<button class="pet-item" data-act="pet-feed" data-id="' + x.id + '"><span class="pe">' + x.e + '</span><b>' + esc(L(x)) + '</b><span class="tiny muted">' + [x.f ? '+' + x.f + ' ' + t('Food') : '', x.w ? '+' + x.w + ' ' + t('Thirst') : '', x.j ? '+' + x.j + ' ' + t('Joy') : ''].filter(Boolean).map(esc).join(' · ') + '</span><span class="price">' + x.p + ' SP</span></button>'; }).join('') + '</div>';
      h += '<button class="btn block" style="margin-top:10px" data-act="pet-play">🎾 ' + esc(t('Play')) + ' · +15 ' + esc(t('Joy')) + ' (' + esc(t('free')) + ')</button>';
    } else if (App.petTab === 'wear') {
      P.SLOTS.forEach(function (sl) {
        h += '<div class="section"><h2 class="h2" style="font-size:16px">' + esc(t(sl[1])) + '</h2><div class="pet-grid">' + P.ITEMS.filter(function (x) { return x.s === sl[0]; }).map(function (x) {
          var own = g.owned.indexOf(x.id) !== -1, on = (p.eq || {})[x.s] === x.id, vb = x.s === 'hand' ? '128 30 76 162' : (x.s === 'body' || x.s === 'neck') ? '50 104 100 80' : x.s === 'face' ? '55 70 90 40' : '45 0 110 110';
          return '<button class="pet-item' + (on ? ' on' : '') + (own ? ' own' : '') + '" data-act="pet-item" data-id="' + x.id + '"><svg viewBox="' + vb + '" class="pi-svg">' + x.g() + '</svg><b>' + esc(L(x)) + '</b>' + (x.b ? '<span class="tiny muted">' + esc(x.b) + '</span>' : '') + '<span class="price">' + (on ? '✓ ' + esc(t('Take off')) : own ? esc(t('Wear')) : x.p + ' SP') + '</span></button>'; }).join('') + '</div></div>';
      });
    } else if (App.petTab === 'homes') {
      h += '<div class="pet-homes">' + P.HOMES.map(function (x) {
        var own = g.homes.indexOf(x.id) !== -1, on = (p.home || 'pastures') === x.id;
        return '<button class="pet-home' + (on ? ' on' : '') + '" data-act="pet-home" data-id="' + x.id + '">' + scene(null, { home: x.id, still: 1 }) + '<div class="row between ph-meta"><div><b>' + esc(L(x)) + '</b><div class="tiny muted">' + esc(x.b) + '</div></div><span class="price">' + (on ? '✓ ' + esc(t('Living here')) : own ? esc(t('Move in')) : x.p + ' SP') + '</span></div></button>'; }).join('') + '</div>';
    } else h += earn(g);
    h += verseBox(vs) + '<button class="btn sm ghost block" style="margin-top:14px" data-act="pet-new">' + esc(t('Change animal')) + '</button>';
    return h;
  };
  function verseBox(vs) { return '<div class="verse" style="margin-top:14px"><span>' + I.cross + '</span><p>“' + esc(vs.text) + '” <b>' + esc(vs.ref) + ' · ' + vs.tr + '</b></p></div>'; }
  // ---------------- actions ----------------
  function spend(g, n, label) { if (g.sp < n) { App.toast(t('Not enough Sweatpoints') + ' (' + g.sp + ' / ' + n + ' SP)'); return false; } g.sp -= n; logIt(g, App.today(), 'buy', -n, label); return true; }
  A['pet-tab'] = function (el) { App.petTab = el.dataset.v; App.rerender(); };
  A['pet-pick'] = function (el) {
    var k = el.dataset.k, vs = P.verse(k);
    var s = App.sheet(App.sheetHead(L(P.PETS[k]), vs.ref) + '<div style="max-width:200px;margin:0 auto"><svg viewBox="30 10 140 185">' + P.ART[k]('happy') + '</svg></div>' + verseBox(vs) +
      '<label class="field"><span class="label">' + esc(t('Name your animal')) + '</span><input class="input" id="pet-nm" maxlength="20" placeholder="' + esc(L(P.PETS[k])) + '"></label><button class="btn primary lg block" id="pet-ok">' + I.check + esc(t('Adopt')) + '</button>');
    s.el.querySelector('#pet-ok').onclick = function () {
      var g = G(), n = Date.now(), keep = g.keep || {};
      g.pet = { type: k, name: s.el.querySelector('#pet-nm').value.trim().slice(0, 20), born: App.today(), f: 80, w: 80, j: 80, ts: n, care: n, eq: keep.eq || {}, home: keep.home || 'pastures' };
      delete g.keep; App.save(); s.close(); App.petTab = 'care'; App.rerender();
    };
  };
  A['pet-new'] = function () { var g = G(); if (!g.pet) return; App.confirm(t('Start over with a new animal?'), t('Your items and points stay.'), function () { g.keep = { eq: g.pet.eq, home: g.pet.home }; g.pet = null; App.save(); App.rerender(); }); };
  A['pet-revive'] = function () { var g = G(), p = g.pet; if (!p || !spend(g, App.SP_RULES.revive, t('Revive'))) return; var n = Date.now(); p.dead = false; p.f = 60; p.w = 60; p.j = 50; p.ts = n; p.care = n; App.save(); App.rerender(); App.toast('❤️ ' + nm(p)); };
  A['pet-feed'] = function (el) {
    var g = G(), p = g.pet, x = P.FOOD.filter(function (y) { return y.id === el.dataset.id; })[0]; if (!x || !p) return;
    var v = vit(p); if (v.dead) return; if (!spend(g, x.p, L(x))) return;
    settle(p); p.f = Math.min(100, p.f + (x.f || 0)); p.w = Math.min(100, p.w + (x.w || 0)); p.j = Math.min(100, p.j + (x.j || 0)); p.care = Date.now();
    App.save(); App.rerender(); App.toast(x.e + ' ' + t('Yum!') + ' −' + x.p + ' SP');
  };
  A['pet-play'] = function () {
    var g = G(), p = g.pet; if (!p || vit(p).dead) return;
    if (p.played && Date.now() - p.played < 3 * H) { App.toast(t('Rest a bit — play again later.')); return; }
    settle(p); p.j = Math.min(100, p.j + 15); p.played = Date.now(); App.save(); App.rerender(); App.toast('🎾 ' + t('Played together!'));
  };
  A['pet-item'] = function (el) {
    var g = G(), p = g.pet, x = P.BY[el.dataset.id]; if (!x || !p) return; p.eq = p.eq || {};
    if (g.owned.indexOf(x.id) === -1) { if (!spend(g, x.p, L(x))) return; g.owned.push(x.id); settle(p); p.j = Math.min(100, p.j + 10); p.eq[x.s] = x.id; App.toast('✨ ' + t('Bought!')); }
    else p.eq[x.s] = p.eq[x.s] === x.id ? null : x.id;
    App.save(); App.rerender();
  };
  A['pet-home'] = function (el) {
    var g = G(), p = g.pet, x = P.HBY[el.dataset.id]; if (!x || !p) return;
    if (g.homes.indexOf(x.id) === -1) { if (!spend(g, x.p, L(x))) return; g.homes.push(x.id); App.toast('🏡 ' + t('Bought!')); }
    p.home = x.id; App.save(); App.rerender();
  };
  // ---------------- Today card, More link, sweep on every route ----------------
  App.petTodayCard = function () {
    var g = G(), p = g.pet, h = '<div class="section"><a class="card tap pet-today" href="#/pet"><div class="row" style="gap:12px">';
    if (!p) h += '<svg viewBox="30 10 140 185" class="pt-mini">' + P.ART.lamb('happy') + '</svg><div class="grow"><b>' + esc(t('My Pet')) + '</b> <span class="sp-bal sm">' + g.sp + ' <span>SP</span></span><div class="tiny muted">' + esc(t('Choose your animal')) + ' →</div></div>';
    else {
      var v = vit(p), stt = status(p, v);
      h += '<svg viewBox="30 10 140 185" class="pt-mini' + (v.dead ? ' dead' : '') + '">' + dressed(p, v.st) + '</svg><div class="grow"><b>' + esc(nm(p)) + '</b> <span class="sp-bal sm">' + g.sp + ' <span>SP</span></span><div class="tiny ' + (stt[0] === 'good' ? 'muted' : stt[0] + '-t') + '">' + esc(stt[1]) + '</div>' +
        (v.dead ? '' : '<div class="pt-bars"><i style="width:' + v.f + '%;background:var(--good)"></i><i style="width:' + v.w + '%;background:var(--info)"></i><i style="width:' + v.j + '%;background:var(--accent)"></i></div>') + '</div>';
    }
    return h + '<span class="chev">›</span></div></a></div>';
  };
  var oToday = V.today;
  V.today = function () { var h = oToday.apply(this, arguments), c = App.petTodayCard(), i = h.indexOf('<div class="hero'); return i !== -1 ? h.slice(0, i) + c + h.slice(i) : h + c; };
  var oMore = V.more;
  V.more = function () {
    var h = oMore.apply(this, arguments); if (S.role !== 'athlete') return h;
    var c = '<a class="card tap row between" href="#/pet" style="text-decoration:none;color:inherit"><div><b>🐑 ' + esc(t('My Pet')) + ' · ' + esc(t('Sweatpoints')) + '</b><div class="tiny muted">' + G().sp + ' SP</div></div><span class="chev">›</span></a>', i = h.indexOf('<div class="card">');
    return i !== -1 ? h.slice(0, i) + c + h.slice(i) : h + c;
  };
  var oRoute = App.route;
  App.route = function () { var e = 0; try { e = App.gameSweep(); } catch (err) { if (window.console) console.error(err); } oRoute.apply(this, arguments); if (e > 0) setTimeout(function () { App.toast('💪 +' + e + ' Sweatpoints'); }, 350); };
})();
