/* Forged by Grace — rule-based food rating (🟢 Heel goed / 👍 Goed / 🟡 Matig / 🔴 Slecht) + sanity checks. $0, no AI. */
(function () {
  'use strict';
  var App = window.App;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function low(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function has(n, list) { for (var i = 0; i < list.length; i++) if (new RegExp('(^|[^a-z])' + list[i]).test(n)) return list[i]; return null; }
  var LV = [
    { k: 'hg', e: '🟢', l: 'Heel goed' }, { k: 'g', e: '👍', l: 'Goed' }, { k: 'm', e: '🟡', l: 'Matig' }, { k: 's', e: '🔴', l: 'Slecht' }];
  function lv(s) { return s >= 2 ? LV[0] : s >= 0 ? LV[1] : s >= -1.5 ? LV[2] : LV[3]; }
  var SUGAR = ['suiker', 'sugar', 'snoep', 'candy', 'cola', 'frisdrank', 'soda', 'fanta', 'sprite', 'red bull', 'energy drink', 'koek', 'cookie', 'biscuit', 'cake', 'taart', 'gebak', 'stroopwafel', 'chocola', 'chocolate', 'hagelslag', 'ijs', 'ice cream', 'donut', 'jam', 'siroop', 'syrup', 'limonade', 'sap', 'juice', 'ontbijtkoek', 'peperkoek', 'nutella', 'pudding', 'vla', 'muffin', 'croissant', 'wafel', 'gummy', 'drop'];
  var FRIED = ['friet', 'fries', 'patat', 'kroket', 'frikandel', 'bitterbal', 'kaassouffle', 'loempia', 'nugget', 'chips', 'crisps', 'pizza', 'burger', 'hamburger', 'kebab', 'shoarma', 'doner', 'worst', 'sausage', 'bacon', 'salami', 'mayo', 'mayonaise', 'snack', 'gefrituurd', 'fried', 'kfc', 'mcdonald', 'hotdog', 'saucijs'];
  var WHOLE = ['groente', 'vegetable', 'broccoli', 'spinazie', 'spinach', 'sla', 'salad', 'salade', 'komkommer', 'tomaat', 'tomato', 'paprika', 'wortel', 'carrot', 'bloemkool', 'courgette', 'boontjes', 'sperziebonen', 'appel', 'apple', 'banaan', 'banana', 'bes', 'berr', 'aardbei', 'strawberr', 'sinaasappel', 'orange', 'peer', 'pear', 'kiwi', 'passievrucht', 'passionfruit', 'mango', 'havermout', 'oat', 'volkoren', 'wholegrain', 'whole grain', 'whole wheat', 'quinoa', 'bonen', 'beans', 'linzen', 'lentil', 'kikkererwt', 'chickpea', 'zoete aardappel', 'sweet potato', 'aardappel', 'potato', 'zilvervlies', 'brown rice', 'noten', 'nuts', 'amandel', 'almond', 'walnoot', 'avocado', 'olijfolie', 'olive oil', 'zalm', 'salmon', 'vis', 'fish', 'kabeljauw', 'cod', 'tonijn', 'tuna', 'kip', 'chicken', 'kalkoen', 'turkey', 'ei', 'egg', 'kwark', 'quark', 'skyr', 'yoghurt', 'yogurt', 'tofu', 'tempeh', 'garnalen', 'shrimp'];
  var GOODFAT = ['noten', 'nuts', 'amandel', 'almond', 'walnoot', 'pinda', 'peanut', 'avocado', 'olijf', 'olive', 'zalm', 'salmon', 'makreel', 'mackerel', 'haring', 'herring', 'ei', 'egg', 'chia', 'lijnzaad', 'flax', 'zaden', 'seeds'];
  var FAST = ['wit brood', 'witbrood', 'white bread', 'witte rijst', 'white rice', 'rijstwafel', 'rice cake', 'cornflakes', 'casino', 'baguette', 'stokbrood', 'pasta wit', 'sap', 'juice', 'honing', 'honey', 'dadel', 'date', 'krentenbol'];
  var LOWGI = ['volkoren', 'wholegrain', 'whole grain', 'havermout', 'oat', 'quinoa', 'bonen', 'beans', 'linzen', 'lentil', 'kikkererwt', 'chickpea', 'zilvervlies', 'brown rice', 'groente', 'vegetable', 'broccoli', 'spinazie', 'spinach', 'bes', 'berr', 'appel', 'apple', 'peer', 'pear', 'noten', 'nuts'];
  // reference per 100 g: keywords, kcal, p, c, f
  var REF = [
    [['banaan', 'banana'], 89, 1.1, 23, 0.3], [['appel', 'apple'], 52, 0.3, 14, 0.2], [['passievrucht', 'passionfruit', 'passion fruit', 'maracuja'], 97, 2.2, 23, 0.7],
    [['sinaasappel', 'orange'], 47, 0.9, 12, 0.1], [['aardbei', 'strawberr'], 32, 0.7, 7.7, 0.3], [['blauwe bes', 'blueberr'], 57, 0.7, 14, 0.3], [['mango'], 60, 0.8, 15, 0.4],
    [['kiwi'], 61, 1.1, 15, 0.5], [['druif', 'grape'], 69, 0.7, 18, 0.2], [['peer', 'pear'], 57, 0.4, 15, 0.1],
    [['spinazie', 'spinach'], 23, 2.9, 3.6, 0.4], [['broccoli'], 34, 2.8, 7, 0.4], [['komkommer', 'cucumber'], 15, 0.7, 3.6, 0.1], [['tomaat', 'tomato'], 18, 0.9, 3.9, 0.2], [['wortel', 'carrot'], 41, 0.9, 10, 0.2], [['paprika', 'bell pepper'], 31, 1, 6, 0.3],
    [['feta'], 264, 14, 4, 21], [['ei', 'egg', 'eieren', 'eggs'], 143, 12.6, 0.7, 9.5], [['kipfilet', 'chicken breast'], 165, 31, 0, 3.6], [['zalm', 'salmon'], 206, 22, 0, 13],
    [['magere kwark', 'quark'], 57, 10, 3.6, 0.2], [['skyr'], 63, 11, 4, 0.2], [['havermout', 'oats', 'oatmeal'], 379, 13, 60, 7], [['volkoren brood', 'volkorenbrood', 'wholegrain bread', 'whole wheat bread'], 247, 13, 41, 3.4],
    [['witte rijst', 'white rice', 'rijst', 'rice'], 130, 2.7, 28, 0.3], [['pasta'], 158, 5.8, 31, 0.9], [['aardappel', 'potato'], 87, 1.9, 20, 0.1], [['avocado'], 160, 2, 9, 15],
    [['pindakaas', 'peanut butter'], 588, 25, 20, 50], [['olijfolie', 'olive oil'], 884, 0, 0, 100], [['melk', 'milk'], 50, 3.4, 4.8, 1.6], [['tonijn', 'tuna'], 116, 26, 0, 1]];
  var NOREF = ['brood', 'bread', 'cake', 'chips', 'shake', 'smoothie', 'sap', 'juice', 'yoghurt', 'yogurt', 'reep', 'bar', 'taart', 'muffin', 'ijs', 'salade', 'salad', 'pindakaas', 'kaas', 'saus', 'sauce', 'gedroogd', 'dried', 'jam', 'olie', 'oil', 'drank', 'drink', 'wrap', 'pizza', 'soep', 'soup', 'mix', 'muesli', 'granola', 'bowl', 'pannenkoek', 'pancake', 'koek', 'melk'];
  function findRef(n) {
    var best = null, bl = 0;
    REF.forEach(function (r) { r[0].forEach(function (k) { if (new RegExp('(^|[^a-z])' + k + '($|[^a-z])').test(n) && k.length > bl) { best = r; bl = k.length; } }); });
    if (!best) return null;
    // compound names (banana bread, appelsap) → skip unless the keyword itself contains the word
    var kw = best[0].join(' ');
    for (var i = 0; i < NOREF.length; i++) if (n.indexOf(NOREF[i]) !== -1 && kw.indexOf(NOREF[i]) === -1) return null;
    return best;
  }
  function per100(e) { var g = +e.g || 0; if (!g) return null; return { kcal: (+e.kcal || 0) * 100 / g, p: (+e.p || 0) * 100 / g, c: (+e.c || 0) * 100 / g, f: (+e.f || 0) * 100 / g }; }
  App.foodSanity = function (e) {
    var n = low(e.name), r = findRef(n), x = per100(e); if (!r || !x) return null;
    var dk = Math.abs(x.kcal - r[1]), df = Math.abs(x.f - r[4]), dc = Math.abs(x.c - r[3]);
    var bad = (dk > Math.max(60, r[1] * 0.45)) || (df > Math.max(8, r[4] * 2.5)) || (dc > Math.max(12, r[3] * 0.8) && r[3] > 5);
    if (!bad) return null;
    return { msg: '⚠️ Klopt dit? De waarden passen niet bij ' + e.name + ' (' + Math.round(x.kcal) + ' kcal · V ' + Math.round(x.f) + ' g · K ' + Math.round(x.c) + ' g per 100 g; normaal ±' + r[1] + ' kcal · V ' + r[4] + ' · K ' + r[3] + '). Kies het juiste product.' };
  };
  // ctx: { diabetes, goal ('lean'|'muscle'|...), T: {kcal,p,c,f} }
  App.foodCtx = function (owner) {
    var o = owner || {}, P = o.profile || {}, m = o.meal || {};
    var txt = low([m.name, m.principle, P.notes, P.health, P.conditions, P.medical, (o.intake && JSON.stringify(o.intake)) || ''].join(' '));
    var T = P.targetsOverride || (App.calcTargets && App.calcTargets(P)) || m.targets || null;
    return { diabetes: /diabet/.test(txt), goal: P.goal || '', T: T };
  };
  App.rateFood = function (e, ctx) {
    ctx = ctx || {}; var n = low(e.name + ' ' + (e.fid || '')), kcal = +e.kcal || 0, p = +e.p || 0, c = +e.c || 0, f = +e.f || 0;
    var s = 0, pro = [], con = [], w;
    var pd = kcal > 0 ? p * 4 / kcal : 0, fd = kcal > 0 ? f * 9 / kcal : 0;
    if (kcal < 5) return { lv: LV[1], s: 0, why: ['Nauwelijks calorieën.'], warn: null };
    if (pd >= 0.4) { s += 2; pro.push('veel eiwit per kcal (' + Math.round(pd * 100) + '% van de kcal)'); }
    else if (pd >= 0.25) { s += 1; pro.push('goede eiwitbron'); }
    else if (pd < 0.08 && kcal > 150) { s -= 0.5; con.push('weinig eiwit'); }
    if ((w = has(n, WHOLE)) && !has(n, FRIED)) { s += 1; pro.push('onbewerkt / natuurlijke voeding met vezels of micronutriënten'); }
    if ((w = has(n, SUGAR))) { s -= 2; con.push('toegevoegde suiker (' + w + ')'); }
    if ((w = has(n, FRIED))) { s -= 2; con.push('gefrituurd/bewerkt (' + w + ')'); }
    if (fd > 0.6 && kcal > 100 && !has(n, GOODFAT)) { s -= 1; con.push('veel (verzadigd) vet: ' + Math.round(fd * 100) + '% van de kcal'); }
    else if (fd > 0.5 && has(n, GOODFAT)) pro.push('gezonde vetten');
    if (ctx.diabetes) {
      if (has(n, SUGAR) || has(n, FAST)) { s -= 1.5; con.push('snelle koolhydraten → bloedsuikerpiek (diabetes)'); }
      else if (has(n, LOWGI)) { s += 0.5; pro.push('lage GI, goed voor je bloedsuiker'); }
      if (c > 45) { s -= 1; con.push(Math.round(c) + ' g koolhydraten in één keer — liever max ±40 g per eetmoment'); }
    }
    var T = ctx.T;
    if (T && T.kcal && kcal > T.kcal * 0.4) { s -= 1; con.push('grote portie: ' + Math.round(kcal / T.kcal * 100) + '% van je dagdoel'); }
    if (ctx.goal === 'lean' && kcal > 0 && e.g && kcal / e.g * 100 > 400 && pd < 0.2) { s -= 0.5; con.push('calorierijk bij afvallen'); }
    if (ctx.goal === 'muscle' && p >= 25) { s += 0.5; pro.push('helpt spieropbouw (' + Math.round(p) + ' g eiwit)'); }
    var warn = App.foodSanity(e);
    var why = pro.map(function (x) { return '✔ ' + x; }).concat(con.map(function (x) { return '✖ ' + x; }));
    if (!why.length) why.push('Neutraal: past prima binnen je dag.');
    if (warn) { s = Math.min(s, -1); why.unshift('✖ waarden lijken niet te kloppen — oordeel onzeker'); }
    return { lv: lv(s), s: s, why: why, warn: warn, pro: pro, con: con };
  };
  App.rateGroup = function (list, ctx, isDay) {
    var tk = 0, ws = 0, cnt = { hg: 0, g: 0, m: 0, s: 0 }, why = [];
    (list || []).forEach(function (e) { var r = App.rateFood(e, ctx), k = Math.max(+e.kcal || 0, 20); tk += k; ws += r.s * k; cnt[r.lv.k]++; });
    if (!list || !list.length) return null;
    var s = ws / tk, T = ctx && ctx.T;
    var sum = { kcal: 0, p: 0, c: 0 }; list.forEach(function (e) { sum.kcal += +e.kcal || 0; sum.p += +e.p || 0; sum.c += +e.c || 0; });
    if (isDay && T) {
      if (T.p && sum.p >= T.p * 0.9) { s += 0.5; why.push('✔ eiwitdoel gehaald (' + Math.round(sum.p) + '/' + T.p + ' g)'); }
      else if (T.p && sum.p < T.p * 0.6) { s -= 0.5; why.push('✖ te weinig eiwit (' + Math.round(sum.p) + '/' + T.p + ' g)'); }
      if (T.kcal && sum.kcal > T.kcal * 1.15) { s -= 0.5; why.push('✖ ' + Math.round(sum.kcal - T.kcal) + ' kcal boven doel'); }
      if (ctx.diabetes && T.c && sum.c > T.c * 1.15) { s -= 0.5; why.push('✖ koolhydraten boven je diabetesgrens (' + Math.round(sum.c) + '/' + T.c + ' g)'); }
    } else if (!isDay && sum.p >= 25) why.push('✔ ' + Math.round(sum.p) + ' g eiwit in deze maaltijd');
    why.unshift(cnt.hg + '🟢 ' + cnt.g + '👍 ' + cnt.m + '🟡 ' + cnt.s + '🔴');
    return { lv: lv(s), s: s, cnt: cnt, why: why };
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
