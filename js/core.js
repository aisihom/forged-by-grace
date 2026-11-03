/* Forged by Grace v2 — core: state, i18n, share codec, calculators, plan + meal generators, UI helpers, router. */
(function () {
  'use strict';
  var F = window.FBG, D = window.FBG_DATA, FD = window.FBG_FOODS, esc = F.esc;
  var cfg = window.FBG_CONFIG || {};
  var App = window.App = { views: {} };
  App.F = F; App.D = D; App.FD = FD; App.esc = esc;

  // ---------------- State ----------------
  var KEY = 'state.v2';
  function blankAthlete() {
    return { cid: null, profile: null, plan: null, meal: null, sessions: [], food: {}, body: [], habits: {}, checkins: [], coach: null };
  }
  function defaults() {
    return {
      v: 2, role: null, lang: 'en', verse: true, faithHabit: true,
      coach: { name: cfg.coachName || 'Aarón Ricardo', email: cfg.coachEmail || '', whatsapp: cfg.coachWhatsApp || '' },
      me: blankAthlete(), clients: [], plans: [], customFoods: [], barcodes: {}, intakes: [], recentFoods: []
    };
  }
  var S = F.store.get(KEY, null) || defaults();
  var d0 = defaults();
  Object.keys(d0).forEach(function (k) { if (S[k] === undefined) S[k] = d0[k]; });
  Object.keys(d0.me).forEach(function (k) { if (S.me[k] === undefined) S.me[k] = d0.me[k]; });
  App.S = S;
  App.save = function () { if (!F.store.set(KEY, S)) App.toast(App.t('Storage is full — export a backup and remove old photos.')); };
  App.reset = function () { F.store.remove(KEY); location.hash = ''; location.reload(); };

  // ---------------- i18n (English text is the key) ----------------
  App.t = function (s, vars) {
    var L = window.FBG_I18N && window.FBG_I18N[S.lang];
    var out = (L && L[s]) || s;
    if (vars) Object.keys(vars).forEach(function (k) { out = out.split('{' + k + '}').join(vars[k]); });
    return out;
  };
  var t = App.t;
  App.foodName = function (f) { return f ? ((S.lang === 'nl' && f.nl) ? f.nl : (f.en || f.name || '')) : ''; };

  // ---------------- utils ----------------
  App.today = function () { return F.isoDate(new Date()); };
  App.dayIndex = function (d) { return ((d || new Date()).getDay() + 6) % 7; };
  App.addDays = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  App.isoAdd = function (iso, n) { return F.isoDate(App.addDays(F.parseISO(iso), n)); };
  App.num = function (v) { var n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : 0; };
  App.r0 = function (n) { return Math.round(n); };
  App.r1 = function (n) { return Math.round(n * 10) / 10; };
  App.initials = function (name) { return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase(); };
  App.clone = function (o) { return o == null ? o : JSON.parse(JSON.stringify(o)); };
  App.daysAgo = function (iso) {
    if (!iso) return null;
    var a = new Date(iso); var n = Math.floor((Date.now() - a.getTime()) / 86400000);
    return n;
  };
  App.ago = function (iso) {
    var n = App.daysAgo(iso);
    if (n == null) return t('never');
    if (n <= 0) return t('today'); if (n === 1) return t('yesterday');
    return t('{n} days ago', { n: n });
  };
  App.secure = function () { return !!window.isSecureContext && location.protocol !== 'file:'; };
  App.baseUrl = function () { return location.href.split('#')[0].split('?')[0]; };
  App.isFile = function () { return location.protocol === 'file:'; };

  // ---------------- share codec (URL-safe, compressed when possible) ----------------
  function bytesToB64u(bytes) {
    var bin = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64uToBytes(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function streamBytes(bytes, stream) {
    var w = new Blob([bytes]).stream().pipeThrough(stream);
    return new Response(w).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  App.encode = function (obj) {
    var json = new TextEncoder().encode(JSON.stringify(obj));
    if (typeof CompressionStream === 'function') {
      try { return streamBytes(json, new CompressionStream('deflate-raw')).then(function (b) { return 'z' + bytesToB64u(b); }); }
      catch (e) { /* fall through */ }
    }
    return Promise.resolve('j' + bytesToB64u(json));
  };
  App.decode = function (code) {
    if (/^\s*\{/.test(String(code || ''))) return Promise.resolve(JSON.parse(code));
    code = String(code || '').replace(/\s+/g, '');
    code = code.replace(/^fbg-(all|move):/i, '');
    var m = code.match(/#imp=([A-Za-z0-9_-]+)/); if (m) code = m[1];
    if (/^\s*\{/.test(code)) return Promise.resolve(JSON.parse(code));
    var kind = code[0], body = code.slice(1);
    if (kind === 'j') return Promise.resolve(JSON.parse(new TextDecoder().decode(b64uToBytes(body))));
    if (kind === 'z') {
      if (typeof DecompressionStream !== 'function') return Promise.reject(new Error(t('This browser is too old to open the link. Ask for the file instead.')));
      return streamBytes(b64uToBytes(body), new DecompressionStream('deflate-raw')).then(function (b) { return JSON.parse(new TextDecoder().decode(b)); });
    }
    return Promise.reject(new Error(t('That is not a Forged by Grace link or code.')));
  };
  App.shareLink = function (obj) { return App.encode(obj).then(function (c) { return App.baseUrl() + '#imp=' + c; }); };

  // ---------------- calculators ----------------
  App.ACT = { 1.2: 'Mostly sitting', 1.375: 'Light (1-3 workouts/wk)', 1.55: 'Active (3-5 workouts/wk)', 1.725: 'Very active (physical job + training)' };
  App.GOALS = { lean: 'Get lean (lose fat)', maintain: 'Maintain / recomp', muscle: 'Build muscle' };
  App.calcTargets = function (p) {
    if (!p) return null;
    if (p.targetsOverride && p.targetsOverride.kcal) return p.targetsOverride;
    var w = App.num(p.weight) || 80, h = App.num(p.height) || 178, a = App.num(p.age) || 30;
    var bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === 'f' ? -161 : 5);
    var tdee = bmr * (App.num(p.activity) || 1.55);
    var adj = p.goal === 'lean' ? -(App.num(p.deficit) || 20) / 100 : p.goal === 'muscle' ? 0.1 : 0;
    var kcal = Math.round(tdee * (1 + adj) / 10) * 10;
    kcal = Math.max(kcal, p.sex === 'f' ? 1300 : 1500);
    var ppk = App.num(p.ppk) || (p.goal === 'lean' ? 2.0 : p.goal === 'muscle' ? 1.8 : 1.6);
    var prot = Math.round(ppk * w);
    var fat = Math.round(Math.max(0.8 * w, kcal * 0.22 / 9));
    var carbs = Math.max(50, Math.round((kcal - prot * 4 - fat * 9) / 4));
    return { kcal: kcal, p: prot, c: carbs, f: fat, bmr: Math.round(bmr), tdee: Math.round(tdee) };
  };
  App.macrosFor = function (food, g) {
    var k = g / 100;
    return { kcal: Math.round(food.kcal * k), p: App.r1(food.p * k), c: App.r1(food.c * k), f: App.r1(food.f * k) };
  };
  App.findFood = function (id) {
    if (FD.BY_ID[id]) return FD.BY_ID[id];
    var c = S.customFoods.filter(function (x) { return x.id === id; })[0];
    if (c) return c;
    if (id && id.indexOf('bc:') === 0 && S.barcodes[id.slice(3)]) return S.barcodes[id.slice(3)];
    return null;
  };
  App.allFoods = function () {
    var scanned = Object.keys(S.barcodes).map(function (k) { return S.barcodes[k]; });
    return FD.FOODS.concat(S.customFoods, scanned);
  };

  // ---------------- training templates + generator ----------------
  App.TEMPLATES = {
    lean3:    { name: 'Get Lean · 3 days', goal: 'lean', layout: 3, mode: 'gym', level: 'intermediate', desc: 'Full body ×3 + walks. Strength to keep muscle, finishers to burn.' },
    lean4:    { name: 'Get Lean · 4 days', goal: 'lean', layout: 4, mode: 'gym', level: 'intermediate', desc: 'Upper/lower split with conditioning finishers.' },
    lean5:    { name: 'Get Lean · 5 days', goal: 'lean', layout: 5, mode: 'gym', level: 'advanced', desc: 'Upper/lower + a dedicated conditioning day.' },
    muscle4:  { name: 'Build Muscle · 4 days', goal: 'muscle', layout: 4, mode: 'gym', level: 'intermediate', desc: 'Hypertrophy upper/lower, 8-12 reps, more volume.' },
    strength3:{ name: 'Strength · 3 days', goal: 'strength', layout: 3, mode: 'gym', level: 'intermediate', desc: 'Heavy compounds 5×5, long rests, linear progression.' },
    home3:    { name: 'Home · Dumbbells · 3 days', goal: 'lean', layout: 3, mode: 'home', level: 'intermediate', desc: 'Dumbbells, kettlebell and bands at home.' },
    bw3:      { name: 'Bodyweight · 3 days', goal: 'lean', layout: 3, mode: 'bw', level: 'beginner', desc: 'No equipment. Anywhere, anytime.' },
    beginner3:{ name: 'Beginner Foundation · 3 days', goal: 'lean', layout: 3, mode: 'gym', level: 'beginner', desc: 'Learn the big lifts with fewer sets and easy progression.' }
  };
  App.LEVELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
  App.PROGRESSIONS = {
    double: 'Double progression: hit the top of the rep range on all sets → add 2.5 kg (upper) / 5 kg (lower).',
    linear: 'Linear: add 2.5 kg every session while all reps are completed.',
    rpe: 'RPE-based: pick the weight that matches the target RPE each set.'
  };
  App.allowed = function (ex, mode) { var eq = D.MODES[mode || 'gym'].equip; return ex.equip.some(function (e) { return eq.indexOf(e) !== -1; }); };
  App.pick = function (slot, mode, used) {
    var list = D.SLOTS[slot] || [];
    for (var i = 0; i < list.length; i++) { var ex = D.BY_ID[list[i]]; if (ex && !used[ex.id] && App.allowed(ex, mode)) return ex.id; }
    for (i = 0; i < list.length; i++) { ex = D.BY_ID[list[i]]; if (ex && App.allowed(ex, mode)) return ex.id; }
    return null;
  };
  App.prescribe = function (ex, role, goal, level) {
    var sets = level === 'beginner' ? 2 : level === 'advanced' ? 4 : 3, reps = '8-10', rest = 90, rpe = 8;
    if (role === 'c') {
      if (goal === 'strength') { sets = level === 'beginner' ? 3 : 5; reps = '5'; rest = 180; rpe = 8; }
      else if (goal === 'muscle') { reps = '8-12'; rest = 120; sets = sets + 1; }
      else { reps = '6-10'; rest = 120; }
    } else if (role === 'a') { reps = goal === 'strength' ? '8-10' : '10-15'; rest = 75; rpe = 8; if (goal === 'muscle') sets += 1; }
    else if (role === 'k') { reps = ex.track === 'time' ? '30-45' : '10-15'; rest = 45; rpe = 7; sets = 3; }
    else if (role === 'f') { reps = ex.track === 'time' ? '30' : '12'; rest = 30; rpe = 9; sets = goal === 'strength' ? 2 : 5; }
    else if (role === 's') { reps = ex.track === 'min' ? (ex.pattern === 'mobility' ? '10' : '30') : '10'; rest = 0; rpe = 5; sets = 1; }
    return { ex: ex.id, sets: sets, reps: reps, rest: rest, rpe: rpe };
  };
  App.generatePlan = function (tplKey, opts) {
    opts = opts || {};
    var tp = App.TEMPLATES[tplKey] || App.TEMPLATES.lean3;
    var mode = opts.mode || tp.mode, level = opts.level || tp.level, goal = tp.goal;
    var layout = D.WEEKS[tp.layout];
    var days = layout.map(function (key) {
      var dt = D.DAYS[key], used = {}, items = [];
      dt.slots.forEach(function (s) {
        if (goal === 'strength' && s[1] === 'f') return;
        if (level === 'beginner' && items.length >= 5 && s[1] !== 'f') return;
        var id = App.pick(s[0], mode, used); if (!id) return; used[id] = 1;
        items.push(App.prescribe(D.BY_ID[id], s[1], goal, level));
      });
      return { title: dt.title, type: dt.type, focus: dt.focus, items: items };
    });
    return { id: F.uid(), tpl: tplKey, name: tp.name, goal: goal, mode: mode, level: level, weeks: 8, deload: true,
      progression: goal === 'strength' ? 'linear' : (goal === 'muscle' ? 'double' : 'double'), start: App.today(), days: days };
  };
  App.planWeek = function (plan) {
    if (!plan || !plan.start) return 1;
    var n = Math.floor((Date.now() - F.parseISO(plan.start).getTime()) / (7 * 86400000)) + 1;
    return Math.max(1, n);
  };
  App.isDeload = function (plan) { return plan && plan.deload && App.planWeek(plan) % 5 === 0; };
  App.dayOf = function (plan, idx) {
    if (!plan) return null;
    var d = App.clone(plan.days[idx == null ? App.dayIndex() : idx]);
    if (d && App.isDeload(plan)) d.items.forEach(function (it) { if (it.sets > 2) it.sets -= 1; });
    return d;
  };
  App.trainDays = function (plan) { return plan ? plan.days.filter(function (d) { return d.type === 'strength' || d.type === 'conditioning'; }).length : 0; };

  // ---------------- meal plan generator ----------------
  // role: p = protein source, c = carb source, f = fat source, x = fixed
  var MEAL_TPL = {
    breakfast: { name: 'Breakfast', items: [['quark-low', 'p'], ['oats', 'c'], ['berries', 'x']], swaps: { 'quark-low': ['skyr', 'cottage', 'egg', 'protein-pudding'], oats: ['muesli', 'bread-wholegrain', 'banana'], berries: ['strawberries', 'apple', 'kiwi'] } },
    lunch: { name: 'Lunch', items: [['bread-wholegrain', 'c'], ['chicken-fillet-slices', 'p'], ['cheese-30', 'x'], ['cucumber', 'x'], ['tomato', 'x']], swaps: { 'bread-wholegrain': ['wrap', 'crispbread', 'rice-cake'], 'chicken-fillet-slices': ['tuna-can', 'egg', 'smoked-beef', 'cottage'], 'cheese-30': ['hummus', 'avocado'] } },
    dinner: { name: 'Dinner', items: [['chicken-breast', 'p'], ['rice-brown', 'c'], ['broccoli', 'x'], ['olive-oil', 'f']], swaps: { 'chicken-breast': ['beef-lean-mince', 'salmon', 'cod', 'turkey-breast', 'tofu', 'pork-tenderloin', 'shrimp'], 'rice-brown': ['potato', 'sweet-potato', 'pasta-wholewheat', 'quinoa', 'couscous'], broccoli: ['green-beans', 'stir-fry-veg', 'spinach', 'cauliflower', 'mixed-salad'], 'olive-oil': ['butter', 'avocado'] } },
    snack1: { name: 'Snack', items: [['skyr', 'p'], ['apple', 'x'], ['almonds', 'f']], swaps: { skyr: ['protein-pudding', 'greek-yogurt', 'cottage'], apple: ['banana', 'pear', 'orange'], almonds: ['walnuts', 'peanut-butter', 'dark-chocolate'] } },
    snack2: { name: 'Post-workout', items: [['whey', 'p'], ['banana', 'c']], swaps: { whey: ['skyr', 'protein-bar'], banana: ['rice-cake', 'ontbijtkoek'] } }
  };
  App.MEAL_SLOTS = { 3: ['breakfast', 'lunch', 'dinner'], 4: ['breakfast', 'lunch', 'snack1', 'dinner'], 5: ['breakfast', 'snack2', 'lunch', 'snack1', 'dinner'] };
  App.mealTotals = function (meal) {
    var tot = { kcal: 0, p: 0, c: 0, f: 0 };
    (meal.meals || []).forEach(function (m) { m.items.forEach(function (it) {
      var fd = App.findFood(it.food); if (!fd) return; var x = App.macrosFor(fd, it.g);
      tot.kcal += x.kcal; tot.p += x.p; tot.c += x.c; tot.f += x.f; }); });
    tot.p = App.r0(tot.p); tot.c = App.r0(tot.c); tot.f = App.r0(tot.f);
    return tot;
  };
  App.fitMeal = function (meal) {
    var T = meal.targets;
    for (var iter = 0; iter < 40; iter++) {
      var tot = App.mealTotals(meal);
      var adj = { p: T.p / Math.max(tot.p, 1), c: T.c / Math.max(tot.c, 1), f: T.f / Math.max(tot.f, 1) };
      meal.meals.forEach(function (m) { m.items.forEach(function (it) {
        if (it.role === 'x' || !adj[it.role]) return;
        var fd = App.findFood(it.food); if (!fd) return;
        var g = it.g * (1 + (adj[it.role] - 1) * 0.5);
        g = Math.min(Math.max(g, fd.g * 0.3), fd.g * 3.5);
        it.g = g;
      }); });
    }
    meal.meals.forEach(function (m) { m.items.forEach(function (it) { it.g = Math.max(5, Math.round(it.g / 5) * 5); }); });
    return meal;
  };
  App.generateMeal = function (profile, perDay) {
    perDay = perDay || 4;
    var T = App.calcTargets(profile) || { kcal: 2000, p: 160, c: 180, f: 65 };
    var meal = { id: F.uid(), name: t('Meal plan'), perDay: perDay, targets: { kcal: T.kcal, p: T.p, c: T.c, f: T.f }, meals: [] };
    App.MEAL_SLOTS[perDay].forEach(function (k) {
      var tp = MEAL_TPL[k];
      meal.meals.push({ key: k, name: tp.name, items: tp.items.map(function (x) {
        var fd = FD.BY_ID[x[0]];
        return { food: x[0], g: fd.g, role: x[1], swaps: (tp.swaps[x[0]] || []).slice() };
      }) });
    });
    return App.fitMeal(meal);
  };
  // grams of `alt` that give the same amount of the item's key macro
  App.swapGrams = function (it, altId) {
    var a = App.findFood(it.food), b = App.findFood(altId); if (!a || !b) return it.g;
    var key = it.role === 'p' ? 'p' : it.role === 'c' ? 'c' : it.role === 'f' ? 'f' : 'kcal';
    var amount = a[key] * it.g / 100;
    var g = b[key] > 0.5 ? amount / b[key] * 100 : a.kcal * it.g / Math.max(b.kcal, 1);
    return Math.max(5, Math.round(g / 5) * 5);
  };
  App.groceryList = function (meal, days) {
    days = days || 7; var by = {};
    meal.meals.forEach(function (m) { m.items.forEach(function (it) { by[it.food] = (by[it.food] || 0) + it.g * days; }); });
    var groups = {};
    Object.keys(by).forEach(function (id) { var fd = App.findFood(id); if (!fd) return; var cat = fd.cat || 'custom'; (groups[cat] = groups[cat] || []).push({ food: fd, g: by[id] }); });
    return groups;
  };

  // ---------------- athlete helpers ----------------
  App.foodDay = function (ath, iso) { return (ath.food[iso || App.today()] || []); };
  App.dayTotals = function (entries) {
    var t0 = { kcal: 0, p: 0, c: 0, f: 0 };
    entries.forEach(function (e) { t0.kcal += e.kcal; t0.p += e.p; t0.c += e.c; t0.f += e.f; });
    return { kcal: Math.round(t0.kcal), p: Math.round(t0.p), c: Math.round(t0.c), f: Math.round(t0.f) };
  };
  App.athTargets = function (ath) { return (ath.meal && ath.meal.targets) || App.calcTargets(ath.profile) || { kcal: 2000, p: 150, c: 200, f: 65 }; };
  App.e1rm = function (w, r) { return w > 0 && r > 0 ? w * (1 + Math.min(r, 15) / 30) : 0; };
  App.doneSets = function (it) { return (it.sets || []).filter(function (s) { return s.done; }); };
  App.bestFor = function (ath, exId, beforeTs) {
    var best = null;
    ath.sessions.forEach(function (s) {
      if (beforeTs && s.endedAt >= beforeTs) return;
      s.items.forEach(function (it) { if (it.ex !== exId) return;
        App.doneSets(it).forEach(function (st) { var v = App.e1rm(App.num(st.w), App.num(st.r)) || App.num(st.r);
          if (!best || v > best.v) best = { v: v, w: st.w, r: st.r, date: s.date }; }); });
    });
    return best;
  };
  App.lastFor = function (ath, exId) {
    for (var i = ath.sessions.length - 1; i >= 0; i--) {
      var it = ath.sessions[i].items.filter(function (x) { return x.ex === exId && App.doneSets(x).length; })[0];
      if (it) return it;
    }
    return null;
  };
  App.suggest = function (ath, item, plan) {
    var last = App.lastFor(ath, item.ex), ex = D.BY_ID[item.ex];
    if (!last || !ex || ex.track !== 'weight') return null;
    var top = parseInt(String(item.reps).split('-').pop(), 10) || 10;
    var sets = App.doneSets(last), w = Math.max.apply(null, sets.map(function (s) { return App.num(s.w); }));
    if (!w) return null;
    var lower = ex.muscle === 'Legs' || ex.pattern === 'hinge';
    var allTop = sets.length >= item.sets && sets.every(function (s) { return App.num(s.r) >= top; });
    var prog = (plan && plan.progression) || 'double';
    if (prog === 'linear' || (prog === 'double' && allTop)) return { w: w + (lower ? 5 : 2.5), why: t('Last time you hit all reps — add weight.') };
    return { w: w, why: t('Same weight, aim for more reps than last time.') };
  };
  App.streak = function (ath) {
    var dates = {}; ath.sessions.forEach(function (s) { dates[s.date] = 1; });
    function active(iso) { var h = ath.habits[iso] || {}; return dates[iso] || Object.keys(h).filter(function (k) { return h[k]; }).length >= 3 || (ath.food[iso] || []).length >= 3; }
    var n = 0, d = new Date(); if (!active(F.isoDate(d))) d = App.addDays(d, -1);
    while (active(F.isoDate(d)) && n < 999) { n++; d = App.addDays(d, -1); }
    return n;
  };
  // adherence over last N days: training (done/planned), nutrition (days within ±10% kcal of logged days)
  App.adherence = function (ath, days) {
    days = days || 7; var plan = ath.plan, planned = 0, done = 0, logged = 0, onTarget = 0, T = App.athTargets(ath);
    for (var i = 0; i < days; i++) {
      var d = App.addDays(new Date(), -i), iso = F.isoDate(d);
      if (plan) { var pd = plan.days[App.dayIndex(d)]; if (pd && (pd.type === 'strength' || pd.type === 'conditioning')) planned++; }
      if (ath.sessions.some(function (s) { return s.date === iso && s.type !== 'active'; })) done++;
      var fe = ath.food[iso] || [];
      if (fe.length) { logged++; var k = App.dayTotals(fe).kcal; if (Math.abs(k - T.kcal) <= T.kcal * 0.1) onTarget++; }
    }
    var train = planned ? Math.min(1, done / planned) : null;
    var food = logged ? onTarget / days : null;
    var parts = [train, food].filter(function (x) { return x != null; });
    return { train: train, food: food, logged: logged, done: done, planned: planned, overall: parts.length ? parts.reduce(function (a, b) { return a + b; }, 0) / parts.length : null };
  };
  App.pct = function (x) { return x == null ? '—' : Math.round(x * 100) + '%'; };

  // ---------------- owners (me or a client) ----------------
  App.client = function (id) { return S.clients.filter(function (c) { return c.id === id; })[0] || null; };
  App.owner = function (oid) { return oid === 'me' ? S.me : App.client(oid); };
  App.ownerName = function (oid) { var o = App.owner(oid); return oid === 'me' ? ((S.me.profile && S.me.profile.name) || S.coach.name) + ' (' + t('me') + ')' : (o ? o.name : '?'); };

  // ---------------- UI helpers ----------------
  function ic(path) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>'; }
  App.ic = ic;
  App.I = {
    today: ic('<path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/><circle cx="12" cy="12" r="4"/>'),
    food: ic('<path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8M7 7h4M17 3c-2 2-2.5 5-2.5 8h3V21"/>'),
    train: ic('<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>'),
    progress: ic('<path d="M4 19V5M4 19h16M8 15l3.5-4 3 2.5L20 7"/>'),
    more: ic('<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'),
    users: ic('<circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.3 3-5 6-5s5.4 1.7 6 5"/><path d="M15.5 5.2a3 3 0 0 1 0 5.6M18 14.3c1.6.7 2.6 2.3 3 4.7"/>'),
    plans: ic('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
    heart: ic('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
    plus: ic('<path d="M12 5v14M5 12h14"/>'),
    barcode: ic('<path d="M4 5v14M7 5v14M10 5v14M14 5v14M16 5v14M20 5v14"/>'),
    camera: ic('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
    search: ic('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'),
    share: ic('<path d="M4 12v7h16v-7M12 3v13M7 8l5-5 5 5"/>'),
    check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    x: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
    swap: ic('<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'),
    trash: ic('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    play: ic('<path d="M7 4v16l13-8z"/>'),
    edit: ic('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
    cart: ic('<path d="M3 4h2l2.5 11h11L21 7H7"/><circle cx="9" cy="19" r="1.5"/><circle cx="18" cy="19" r="1.5"/>'),
    mail: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    wa: ic('<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/>'),
    link: ic('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    file: ic('<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/>'),
    trophy: ic('<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 20h8"/>'),
    fire: ic('<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.6 1.2 2.6 2.2 3C10.6 9 11 5.5 12 3z"/>'),
    cross: ic('<path d="M12 3v18M7 8h10"/>'),
    sparkle: ic('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'),
    back: ic('<path d="M15 5l-7 7 7 7"/>'),
    swaprole: ic('<path d="M7 7h11l-3-3M17 17H6l3 3"/>')
  };
  App.LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6l20 7v15c0 14-9 24-20 30C21 52 12 42 12 28V13z" fill="#1a0b03"/><path d="M29.5 17h5v9h8v5h-8v15h-5V31h-8v-5h8z" fill="#f1d08b"/></svg>';

  App.toast = function (msg) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    if (document.querySelector('.rest-bar')) el.style.bottom = '110px';
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2400);
  };
  var stack = [];
  App.sheet = function (html, opts) {
    opts = opts || {};
    var ov = document.createElement('div'); ov.className = 'overlay';
    ov.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(opts.label || 'Details') + '"><div class="sheet-grab" aria-hidden="true"></div>' + html + '</div>';
    document.body.appendChild(ov);
    var api = { el: ov.firstChild, close: function () { if (!ov.parentNode) return; ov.remove(); stack = stack.filter(function (x) { return x !== api; }); if (opts.onClose) opts.onClose(); } };
    stack.push(api);
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('[data-close]')) api.close(); });
    if (opts.onMount) opts.onMount(api);
    return api;
  };
  App.closeSheets = function () { stack.slice().forEach(function (s) { s.close(); }); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && stack.length) stack[stack.length - 1].close(); });
  App.sheetHead = function (title, sub) {
    return '<div class="sheet-head"><div><h2 class="h2" style="margin:0">' + esc(title) + '</h2>' + (sub ? '<p class="small muted" style="margin:4px 0 0">' + esc(sub) + '</p>' : '') + '</div><button class="icon-btn" data-close aria-label="' + esc(t('Close')) + '">' + App.I.x + '</button></div>';
  };
  App.confirm = function (title, text, ok, danger) {
    return new Promise(function (res) {
      var done = false;
      var s = App.sheet('<h2 class="h2">' + esc(title) + '</h2><p class="muted">' + esc(text) + '</p><div class="row" style="margin-top:16px"><button class="btn ghost grow" data-close>' + esc(t('Cancel')) + '</button><button class="btn ' + (danger ? 'danger' : 'primary') + ' grow" data-ok>' + esc(ok || 'OK') + '</button></div>', { onClose: function () { if (!done) res(false); } });
      s.el.querySelector('[data-ok]').onclick = function () { done = true; s.close(); res(true); };
    });
  };
  App.empty = function (icon, title, text, btn) {
    return '<div class="empty"><div class="ico">' + (App.I[icon] || '') + '</div><h3 class="h3">' + esc(title) + '</h3><p>' + esc(text) + '</p>' + (btn || '') + '</div>';
  };
  App.ring = function (val, goal, label, sub) {
    var pc = goal ? Math.min(val / goal, 1.25) : 0, R = 52, C = 2 * Math.PI * R;
    var over = goal && val > goal * 1.1;
    return '<svg viewBox="0 0 128 128" class="ring" role="img" aria-label="' + esc(label) + '"><circle cx="64" cy="64" r="' + R + '" stroke="var(--line)" stroke-width="12" fill="none"/>' +
      '<circle cx="64" cy="64" r="' + R + '" stroke="' + (over ? 'var(--warn)' : 'url(#rg)') + '" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="' + (C * Math.min(pc, 1)).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 64 64)"/>' +
      '<defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#d4a24c"/><stop offset="1" stop-color="#f1d08b"/></linearGradient></defs>' +
      '<text x="64" y="62" text-anchor="middle" class="ring-v">' + esc(label) + '</text><text x="64" y="82" text-anchor="middle" class="ring-l">' + esc(sub || '') + '</text></svg>';
  };
  App.macroBars = function (tot, T) {
    return [['p', t('Protein'), '#60a5fa'], ['c', t('Carbs'), '#d4a24c'], ['f', t('Fat'), '#f472b6']].map(function (m) {
      var v = tot[m[0]], g = T[m[0]], pc = g ? Math.min(100, v / g * 100) : 0;
      return '<div class="mbar"><div class="row between tiny"><span><b>' + esc(m[1]) + '</b></span><span class="muted">' + Math.round(v) + ' / ' + g + ' g</span></div><div class="bar-track"><div class="bar-fill" style="width:' + pc.toFixed(0) + '%;background:' + m[2] + '"></div></div></div>';
    }).join('');
  };
  App.lineChart = function (pts, opts) {
    opts = opts || {};
    if (pts.length < 2) return '<p class="small muted">' + esc(t('Add at least 2 entries to see the chart.')) + '</p>';
    var W = 340, H = 150, pl = 34, pr = 10, pt = 12, pb = 22;
    var xs = pts.map(function (p) { return F.parseISO(p.x).getTime(); }), ys = pts.map(function (p) { return p.y; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs); if (x1 === x0) x1 = x0 + 1;
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), padY = Math.max((y1 - y0) * 0.15, 0.5); y0 -= padY; y1 += padY;
    function X(v) { return pl + (v - x0) / (x1 - x0) * (W - pl - pr); }
    function Y(v) { return pt + (1 - (v - y0) / (y1 - y0)) * (H - pt - pb); }
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(xs[i]).toFixed(1) + ' ' + Y(p.y).toFixed(1); }).join(' ');
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opts.label || 'chart') + '">' +
      [y1 - padY, (y0 + y1) / 2, y0 + padY].map(function (v) { return '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="#262b33"/><text x="2" y="' + (Y(v) + 3).toFixed(1) + '">' + App.r1(v) + '</text>'; }).join('') +
      '<path d="' + d + '" fill="none" stroke="#d4a24c" stroke-width="2.5" stroke-linejoin="round"/>' +
      pts.map(function (p, i) { return '<circle cx="' + X(xs[i]).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="3" fill="#d4a24c"/>'; }).join('') +
      '<text x="' + pl + '" y="' + (H - 4) + '">' + esc(F.fmtDate(pts[0].x, { day: 'numeric', month: 'short' })) + '</text><text x="' + (W - pr) + '" y="' + (H - 4) + '" text-anchor="end">' + esc(F.fmtDate(pts[pts.length - 1].x, { day: 'numeric', month: 'short' })) + '</text></svg>';
  };
  App.barChart = function (bars, goal) {
    var W = 340, H = 140, pb = 20, max = Math.max(goal || 0, Math.max.apply(null, bars.map(function (b) { return b.v; })), 1) * 1.1;
    var bw = (W - 20) / bars.length;
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="bars">' +
      bars.map(function (b, i) { var h = b.v / max * (H - pb - 6), x = 10 + i * bw + bw * 0.18;
        return '<rect x="' + x.toFixed(1) + '" y="' + (H - pb - h).toFixed(1) + '" width="' + (bw * 0.64).toFixed(1) + '" height="' + Math.max(h, 1).toFixed(1) + '" rx="5" fill="' + (b.hi ? '#f1d08b' : '#d4a24c') + '" opacity="' + (b.v ? 1 : .25) + '"/><text x="' + (x + bw * 0.32).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(b.l) + '</text>'; }).join('') +
      (goal ? '<line x1="6" x2="' + (W - 6) + '" y1="' + (H - pb - goal / max * (H - pb - 6)).toFixed(1) + '" y2="' + (H - pb - goal / max * (H - pb - 6)).toFixed(1) + '" stroke="#34d399" stroke-dasharray="4 4"/>' : '') + '</svg>';
  };
  App.verse = function () {
    var V = FD.VERSES, i = Math.floor(Date.now() / 86400000) % V.length;
    return V[i];
  };
  App.resizeImage = function (file, max, q) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () {
        var img = new Image();
        img.onload = function () {
          var k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', q || 0.7));
        };
        img.onerror = rej; img.src = r.result;
      };
      r.onerror = rej; r.readAsDataURL(file);
    });
  };
  App.shareSheet = function (title, sub, obj, opts) {
    opts = opts || {};
    return App.shareLink(obj).then(function (link) {
      var text = (opts.text || '') + '\n' + link;
      var wa = 'https://wa.me/' + (opts.phone ? String(opts.phone).replace(/\D/g, '') : '') + '?text=' + encodeURIComponent(text);
      var mail = 'mailto:' + encodeURIComponent(opts.email || '') + '?subject=' + encodeURIComponent(opts.subject || 'Forged by Grace') + '&body=' + encodeURIComponent(text + (opts.body ? '\n\n' + opts.body : ''));
      var s = App.sheet(App.sheetHead(title, sub) +
        (App.isFile() ? '<p class="suggest">' + esc(t('You opened the app as a file, so this link only works on this device. Put the app online (free, see README) to share real links — or send the file below.')) + '</p>' : '') +
        '<label class="field"><span class="label">' + esc(t('Share link')) + ' <span class="opt">' + link.length + ' ' + esc(t('characters')) + '</span></span><textarea class="input mono" id="share-link" readonly rows="3">' + esc(link) + '</textarea></label>' +
        '<div class="grid2"><button class="btn" id="sh-copy">' + App.I.link + esc(t('Copy link')) + '</button>' +
        '<a class="btn" target="_blank" rel="noopener" href="' + esc(wa) + '" id="sh-wa">' + App.I.wa + 'WhatsApp</a>' +
        '<a class="btn" href="' + esc(mail) + '" id="sh-mail">' + App.I.mail + esc(t('Email')) + '</a>' +
        '<button class="btn" id="sh-file">' + App.I.file + esc(t('Save file')) + '</button></div>' +
        (navigator.share ? '<button class="btn primary block" style="margin-top:10px" id="sh-native">' + App.I.share + esc(t('Share…')) + '</button>' : '') +
        '<p class="tiny muted" style="margin-top:12px">' + esc(t('No server, no account: everything travels inside the link or file. Anyone with the link can read it, so send it only to the right person.')) + '</p>');
      s.el.querySelector('#sh-copy').onclick = function () { F.copyText(link).then(function () { App.toast(t('Link copied')); }); };
      s.el.querySelector('#sh-file').onclick = function () { F.download((opts.filename || 'forged-by-grace') + '.fbg.json', JSON.stringify(obj), 'application/json'); };
      var nat = s.el.querySelector('#sh-native');
      if (nat) nat.onclick = function () { navigator.share({ title: title, text: opts.text || title, url: link }).catch(function () {}); };
      return s;
    });
  };

  // ---------------- router ----------------
  App.coachTabs = [['clients', 'Clients', 'users'], ['plans', 'Plans', 'plans'], ['mind', 'Mind', 'heart'], ['more', 'More', 'more']];
  App.athTabs = [['today', 'Today', 'today'], ['food', 'Food', 'food'], ['train', 'Train', 'train'], ['progress', 'Progress', 'progress'], ['more', 'More', 'more']];
  App.renderTabs = function (cur) {
    var tabs = S.role === 'coach' ? App.coachTabs : App.athTabs;
    var nav = document.querySelector('.tabbar-inner');
    nav.style.gridTemplateColumns = 'repeat(' + tabs.length + ',1fr)';
    nav.innerHTML = tabs.map(function (x) { return '<a class="tab" data-tab="' + x[0] + '" href="#/' + x[0] + '"' + (x[0] === cur ? ' aria-current="page"' : '') + '>' + App.I[x[2]] + esc(t(x[1])) + '</a>'; }).join('');
    document.querySelector('.tabbar').hidden = !S.role;
  };
  App.header = function (title, sub, right) {
    var other = S.role === 'coach' ? t('My training') : t('Coach mode');
    var canSwitch = S.role === 'coach' || S.me.isCoach;
    return '<header class="topbar"><div class="brand"><div class="brand-mark">' + App.LOGO + '</div><div><span class="brand-name">FORGED BY GRACE</span><span class="brand-sub">' + esc(sub || t('Train the body. Guard the heart.')) + '</span></div></div>' +
      '<div class="row" style="gap:6px">' + (right || '') + (canSwitch ? '<button class="btn sm ghost" id="role-switch" title="' + esc(other) + '">' + App.I.swaprole + '<span>' + esc(other) + '</span></button>' : '') + '</div></header>' +
      (title ? '<h1 class="h1">' + esc(title) + '</h1>' : '');
  };
  App.VERSION = '3.17.0';
  App.forceUpdate = function () {
    var jobs = [];
    if (window.caches) jobs.push(caches.keys().then(function (k) { return Promise.all(k.map(function (x) { return caches.delete(x); })); }));
    if (navigator.serviceWorker) jobs.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); }));
    Promise.all(jobs).catch(function () {}).then(function () { location.replace(location.pathname + '?u=' + Date.now() + (location.hash || '')); });
  };
  App.checkVersion = function () {
    if (!App.secure() || !window.fetch) return;
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.v || j.v === App.VERSION || document.getElementById('upd-bar')) return;
      var b = document.createElement('button'); b.id = 'upd-bar';
      b.style.cssText = 'position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top) + 8px);z-index:10000;padding:14px;border-radius:14px;border:1px solid #d4af37;background:#111;color:#f3d27a;font-weight:700;font-size:15px';
      b.textContent = (S.lang === 'nl' ? 'Nieuwe versie (' + j.v + ') beschikbaar — tik om bij te werken' : 'New version (' + j.v + ') available — tap to update');
      b.onclick = App.forceUpdate; document.body.appendChild(b);
    }).catch(function () {});
  };
  App.route = function () {
    var h = location.hash || '';
    if (h.indexOf('#imp=') === 0) { App.views.importLink(h.slice(5)); return; }
    var cm = (location.search || '').match(/[?&]client=([a-z0-9-]{2,40})/);
    if (cm && App.openClientFile) { App.openClientFile(cm[1], /[?&]coach=1/.test(location.search)); return; }
    if (h.indexOf('#health') === 0 && App.applyHealthLink) { App.applyHealthLink(h); return; }
    var qs = location.search || '';
    if (/[?&](steps|weight|rhr|kcal|fat)=/.test(qs) && App.applyHealthLink) { history.replaceState(null, '', location.pathname + '#/health'); App.applyHealthLink(qs); return; }
    var parts = h.replace(/^#\/?/, '').split('/'), name = parts[0], arg = parts.slice(1).join('/');
    var view = document.getElementById('view');
    if (!S.role) { App.renderTabs(''); view.innerHTML = App.views.welcome(); App.bind(view); return; }
    var def = S.role === 'coach' ? 'clients' : 'today';
    var allowed = S.role === 'coach' ? ['clients', 'client', 'plans', 'plan', 'meal', 'mind', 'more', 'health'] : ['today', 'food', 'train', 'progress', 'more', 'plan', 'meal', 'health', 'pet', 'hlink'];
    if (allowed.indexOf(name) === -1 || !App.views[name]) name = def;
    var tab = { client: 'clients', plan: S.role === 'coach' ? 'clients' : 'train', meal: S.role === 'coach' ? 'clients' : 'food', health: S.role === 'coach' ? 'more' : 'progress', pet: 'today', hlink: 'more' }[name] || name;
    App.renderTabs(tab);
    var keep = App._keep; App._keep = false; var y = window.scrollY;
    view.innerHTML = App.views[name](arg);
    App.bind(view);
    window.scrollTo(0, keep ? y : 0);
    document.title = t(name.charAt(0).toUpperCase() + name.slice(1)) + ' · Forged by Grace';
  };
  App.rerender = function () { App._keep = true; App.route(); };
  App.go = function (p) { if (location.hash === '#/' + p) App.route(); else location.hash = '#/' + p; };
  // event delegation: data-act="name" args in data-*
  App.acts = {};
  App.bind = function (root) {
    var rs = root.querySelector('#role-switch');
    if (rs) rs.onclick = function () { S.role = S.role === 'coach' ? 'athlete' : 'coach'; if (S.role === 'athlete') S.me.isCoach = true; App.save(); App.go(S.role === 'coach' ? 'clients' : 'today'); };
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el) return;
    var fn = App.acts[el.getAttribute('data-act')]; if (!fn) return;
    e.preventDefault(); fn(el, e);
  });
  window.addEventListener('hashchange', function () { App.route(); });
  window.addEventListener('DOMContentLoaded', function () {
    document.documentElement.lang = S.lang;
    App.route();
    if ('serviceWorker' in navigator && App.secure()) {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (r) { r.update().catch(function () {}); }).catch(function () {});
      var had = !!navigator.serviceWorker.controller, reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () { if (had && !reloaded && !document.querySelector('.pw-ov,.sheet')) { reloaded = true; location.reload(); } });
    }
    App.checkVersion();
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') App.checkVersion(); });
  });
})();
