/* Forged by Grace v3.12 — "Wat heb je gegeten?": free-text meal estimate (on-device, $0, no API).
   Dish table = typical portion values (NL/EU takeaway & home cooking, averaged from public nutrition tables). */
(function () {
  'use strict';
  var App = window.App, FD = App.FD, A = App.acts, I = App.I || {}, esc = App.esc, t = App.t;

  // id, NL name, EN name, grams per portion, kcal, protein, carbs, fat (per portion), synonyms (space-separated phrases with |)
  var DISHES = [
    ['teriyaki-sandwich', 'Broodje kip teriyaki', 'Chicken teriyaki sandwich', 250, 560, 34, 66, 16, 'chicken teriyaki broodje|broodje chicken teriyaki|kip teriyaki broodje|broodje kip teriyaki|teriyaki broodje|teriyaki sandwich|chicken teriyaki sub|teriyaki sub|chicken teriyaki brood|teriyaki brood|subway teriyaki|teriyaki kip broodje'],
    ['chicken-teriyaki', 'Kip teriyaki met rijst', 'Chicken teriyaki with rice', 400, 620, 38, 82, 13, 'chicken teriyaki|kip teriyaki|teriyaki chicken|teriyaki rijst|teriyaki bowl'],
    ['burger', 'Hamburger (broodje)', 'Burger', 220, 540, 28, 40, 29, 'burger|hamburger|beefburger|cheeseburger|big mac|whopper|quarter pounder|smashburger|broodje hamburger'],
    ['chicken-burger', 'Kipburger', 'Chicken burger', 200, 480, 24, 45, 22, 'kipburger|chicken burger|crispy chicken burger|mcchicken|kip burger'],
    ['veggie-burger', 'Vegaburger', 'Veggie burger', 200, 430, 17, 45, 19, 'vegaburger|veggie burger|vegetarische burger|plant burger'],
    ['fries', 'Friet (middel)', 'Fries (medium)', 150, 470, 5, 62, 22, 'friet|patat|frietjes|frieten|fries|french fries|chips friet|patatje|patat met|friet met'],
    ['fries-mayo', 'Friet met mayo', 'Fries with mayo', 180, 680, 6, 63, 45, 'patatje mayo|friet mayo|patat mayo|friet met mayo|patat met mayo|patatje met'],
    ['kapsalon', 'Kapsalon', 'Kapsalon', 550, 1250, 55, 70, 85, 'kapsalon'],
    ['doner', 'Broodje döner/shoarma', 'Doner kebab sandwich', 300, 650, 35, 60, 29, 'doner|döner|kebab|shoarma|shawarma|broodje shoarma|broodje doner|durum|dürüm|gyros'],
    ['pizza', 'Pizza (hele)', 'Pizza (whole)', 450, 1150, 50, 140, 42, 'pizza|pizza margherita|pizza pepperoni|pizza salami|pizza hawaii|pizza tonno|pizza funghi'],
    ['pizza-slice', 'Pizzapunt', 'Pizza slice', 110, 285, 12, 34, 11, 'pizzapunt|pizza punt|slice pizza|pizza slice|stuk pizza'],
    ['wrap-chicken', 'Wrap met kip', 'Chicken wrap', 230, 500, 30, 48, 20, 'wrap kip|kip wrap|chicken wrap|wrap|tortilla wrap|burrito'],
    ['sub-sandwich', 'Belegd broodje (sub)', 'Sub sandwich', 230, 450, 24, 52, 15, 'sub|subway|baguette|stokbrood belegd|broodje gezond|panini|club sandwich|sandwich|tosti|tosti ham kaas'],
    ['broodje-kip', 'Broodje kip', 'Chicken sandwich', 200, 420, 28, 45, 13, 'broodje kip|kip broodje|broodje kipfilet|chicken sandwich|broodje kipsate|broodje kip kerrie'],
    ['broodje-kaas', 'Broodje kaas', 'Cheese sandwich', 110, 330, 15, 33, 15, 'broodje kaas|kaas broodje|bolletje kaas'],
    ['broodje-kroket', 'Broodje kroket', 'Croquette roll', 140, 390, 11, 45, 18, 'broodje kroket|broodje frikandel'],
    ['boterham', 'Boterham met beleg', 'Slice of bread with topping', 45, 120, 5, 15, 4, 'boterham|boterhammen|sneetje brood|snee brood|toast|brood'],
    ['croissant', 'Croissant', 'Croissant', 60, 245, 5, 26, 13, 'croissant|croissantje'],
    ['nuggets', 'Kipnuggets (6 st.)', 'Chicken nuggets (6)', 100, 280, 15, 17, 17, 'nuggets|kipnuggets|chicken nuggets|mcnuggets'],
    ['wings', 'Kippenvleugels (6 st.)', 'Chicken wings (6)', 180, 520, 40, 6, 37, 'wings|kippenvleugels|chicken wings|kipvleugels|spicy wings'],
    ['kfc-bucket', 'Gefrituurde kip (2 st.)', 'Fried chicken (2 pcs)', 220, 560, 40, 20, 35, 'fried chicken|gefrituurde kip|kfc|krokante kip|crispy chicken'],
    ['shawarma-bowl', 'Shoarmaschotel met rijst', 'Shawarma plate with rice', 450, 850, 45, 85, 35, 'shoarma schotel|shoarmaschotel|doner schotel|kebab schotel|kapsalon light'],
    ['nasi', 'Nasi goreng', 'Fried rice (nasi goreng)', 400, 660, 24, 92, 22, 'nasi|nasi goreng|gebakken rijst|fried rice|bami|bami goreng|mihoen|chow mein'],
    ['sushi', 'Sushi (10 stuks)', 'Sushi (10 pcs)', 300, 450, 18, 82, 5, 'sushi|maki|nigiri|california roll|sushi rolls'],
    ['poke', 'Pokébowl', 'Poke bowl', 450, 650, 32, 80, 20, 'poke|pokebowl|poké bowl|poke bowl|buddha bowl'],
    ['pasta-bolo', 'Spaghetti bolognese', 'Spaghetti bolognese', 450, 680, 32, 85, 22, 'spaghetti|bolognese|spaghetti bolognese|pasta bolognese|pasta gehakt|macaroni|macaroni gehakt'],
    ['pasta-carbo', 'Pasta carbonara', 'Pasta carbonara', 400, 800, 30, 85, 36, 'carbonara|pasta carbonara|pasta roomsaus|pasta pesto|pesto pasta|mac and cheese'],
    ['lasagna', 'Lasagne', 'Lasagna', 400, 560, 30, 44, 28, 'lasagne|lasagna'],
    ['curry-rice', 'Curry met rijst', 'Curry with rice', 450, 700, 32, 85, 24, 'curry|kip curry|chicken curry|butter chicken|tikka masala|korma|thaise curry|rode curry|groene curry|dal|dahl'],
    ['pad-thai', 'Pad thai', 'Pad thai', 400, 650, 27, 85, 22, 'pad thai|noodles|wok noodles|wokgerecht|wok'],
    ['ramen', 'Ramen', 'Ramen', 550, 550, 25, 65, 20, 'ramen|noedelsoep|noodle soup|pho'],
    ['kip-rijst', 'Kip met rijst en groente', 'Chicken, rice & veg', 450, 600, 45, 70, 13, 'kip rijst|kip met rijst|chicken rice|chicken and rice|rijst met kip|kip rijst groente|mealprep'],
    ['aardappel-vlees-groente', 'Aardappelen, vlees & groente', 'Potatoes, meat & veg', 500, 650, 38, 55, 28, 'avg|aardappel vlees groente|aardappels vlees groente|aardappelen met vlees|hollandse pot'],
    ['stamppot', 'Stamppot met rookworst', 'Stamppot with smoked sausage', 450, 720, 25, 55, 44, 'stamppot|hutspot|zuurkool|boerenkool|andijviestamppot|stamppot rookworst'],
    ['salad-chicken', 'Salade met kip', 'Chicken salad', 350, 420, 35, 15, 24, 'salade|salade kip|kipsalade|chicken salad|caesar salad|caesar salade|salade met kip'],
    ['soup', 'Soep (kom)', 'Soup (bowl)', 300, 180, 8, 18, 8, 'soep|tomatensoep|groentesoep|kippensoep|soup|erwtensoep|snert'],
    ['tacos', 'Taco\'s (3 st.)', 'Tacos (3)', 300, 600, 30, 55, 27, 'tacos|taco|nachos|quesadilla|fajita|fajitas'],
    ['steak-fries', 'Steak met friet', 'Steak & fries', 450, 950, 50, 65, 52, 'steak friet|steak met friet|biefstuk friet|biefstuk met friet'],
    ['omelette', 'Omelet (3 eieren)', 'Omelette (3 eggs)', 180, 300, 20, 2, 23, 'omelet|omelette|roerei|scrambled eggs|uitsmijter|gebakken ei|eieren|eitjes'],
    ['pancakes', 'Pannenkoeken (2 st.)', 'Pancakes (2)', 220, 500, 14, 70, 18, 'pannenkoek|pannenkoeken|pancakes|pancake|poffertjes'],
    ['oatmeal', 'Havermout met melk', 'Oatmeal with milk', 300, 380, 16, 55, 10, 'havermout|oatmeal|porridge|overnight oats|pap'],
    ['yogurt-bowl', 'Kwark/yoghurt met fruit', 'Yogurt bowl with fruit', 300, 300, 22, 38, 6, 'kwark met fruit|yoghurt met fruit|yogurt bowl|granola bowl|acai bowl|skyr bowl|kwark'],
    ['shake', 'Eiwitshake (met melk)', 'Protein shake (with milk)', 330, 240, 32, 15, 5, 'eiwitshake|proteine shake|protein shake|shake|whey shake'],
    ['smoothie', 'Smoothie', 'Smoothie', 300, 200, 4, 42, 2, 'smoothie|fruitsmoothie'],
    ['kroket', 'Kroket', 'Croquette', 70, 160, 4, 14, 10, 'kroket|kroketten|bitterballen|bitterbal'],
    ['frikandel', 'Frikandel', 'Frikandel', 70, 170, 8, 5, 13, 'frikandel|frikandellen|frikandel speciaal|frikadel'],
    ['kaassouffle', 'Kaassoufflé', 'Cheese soufflé snack', 70, 210, 6, 18, 13, 'kaassouffle|kaassoufflé'],
    ['loempia', 'Loempia', 'Spring roll', 150, 330, 9, 35, 17, 'loempia|springroll|spring roll|eggroll'],
    ['hotdog', 'Hotdog', 'Hot dog', 150, 380, 13, 32, 22, 'hotdog|hot dog|worstenbroodje|saucijzenbroodje'],
    ['onion-rings', 'Uienringen', 'Onion rings', 120, 400, 5, 43, 23, 'uienringen|onion rings'],
    ['mayo', 'Mayonaise (portie)', 'Mayonnaise (portion)', 25, 170, 0, 1, 19, 'mayo|mayonaise|fritessaus|frietsaus|mayonnaise|aioli|knoflooksaus'],
    ['ketchup', 'Ketchup (portie)', 'Ketchup (portion)', 20, 22, 0, 5, 0, 'ketchup|curry saus|curry ketchup'],
    ['sauce', 'Saus (portie)', 'Sauce (portion)', 30, 90, 1, 8, 6, 'saus|bbq saus|sate saus|satesaus|pindasaus|teriyaki saus|sweet chili|dressing'],
    ['sate', 'Kipsaté met satésaus', 'Chicken satay with sauce', 200, 480, 35, 14, 32, 'sate|saté|kipsate|kipsaté|satay'],
    ['cola', 'Frisdrank (blikje)', 'Soft drink (can)', 330, 140, 0, 35, 0, 'cola|fanta|sprite|frisdrank|ice tea|icetea|soda|7up|sinas|red bull|energydrink'],
    ['cola-zero', 'Frisdrank zero', 'Diet soft drink', 330, 2, 0, 0, 0, 'cola zero|pepsi max|zero|light frisdrank|diet coke|cola light'],
    ['beer', 'Bier (glas)', 'Beer (glass)', 250, 108, 1, 9, 0, 'bier|biertje|pils|beer|heineken'],
    ['wine', 'Wijn (glas)', 'Wine (glass)', 150, 120, 0, 4, 0, 'wijn|wine|rode wijn|witte wijn|rose'],
    ['coffee', 'Koffie met melk', 'Coffee with milk', 200, 50, 3, 5, 2, 'koffie|cappuccino|latte|koffie verkeerd|flat white'],
    ['milkshake', 'Milkshake', 'Milkshake', 350, 420, 11, 65, 13, 'milkshake|mcflurry|frappuccino'],
    ['ice-cream', 'IJs (2 bollen)', 'Ice cream (2 scoops)', 120, 250, 4, 28, 13, 'ijs|ijsje|ice cream|softijs|magnum'],
    ['cake', 'Gebak/taart (punt)', 'Cake (slice)', 100, 380, 5, 45, 20, 'taart|gebak|cake|appeltaart|tompouce|brownie|cheesecake|muffin|donut|koek|koekje|cookie'],
    ['chocolate', 'Chocoladereep', 'Chocolate bar', 50, 260, 3, 30, 14, 'chocolade|reep|snickers|mars|twix|chocoladereep|kitkat'],
    ['chips', 'Chips (zakje)', 'Crisps (bag)', 40, 215, 2.5, 21, 13.5, 'chips|zakje chips|crisps|pringles|doritos'],
    ['nuts', 'Noten (handje)', 'Nuts (handful)', 30, 185, 6, 5, 16, 'noten|nootjes|pinda|pindas|cashew|amandelen|walnoten|nuts'],
    ['fruit', 'Stuk fruit', 'Piece of fruit', 150, 80, 1, 19, 0.3, 'fruit|appel|peer|banaan|sinaasappel|mandarijn|kiwi|apple|banana|orange'],
    ['rice', 'Rijst (portie)', 'Rice (portion)', 200, 260, 5, 56, 0.6, 'rijst|witte rijst|rice|zilvervliesrijst'],
    ['pasta-plain', 'Pasta (portie)', 'Pasta (portion)', 220, 350, 13, 68, 2, 'pasta|penne|fusilli|noedels'],
    ['potatoes', 'Aardappelen (portie)', 'Potatoes (portion)', 250, 215, 4, 45, 0.3, 'aardappel|aardappelen|aardappels|krieltjes|potatoes|puree'],
    ['chicken', 'Kipfilet (portie)', 'Chicken breast (portion)', 150, 250, 46, 0, 5, 'kip|kipfilet|kipdij|chicken|chicken breast|kippenborst'],
    ['meat', 'Vlees (portie)', 'Meat (portion)', 150, 330, 38, 0, 20, 'vlees|gehakt|gehaktbal|slavink|speklap|karbonade|schnitzel|worst|rookworst|meat|steak|biefstuk'],
    ['fish', 'Vis (portie)', 'Fish (portion)', 150, 260, 33, 0, 14, 'vis|zalm|kibbeling|lekkerbek|fish|salmon|tonijn|kabeljauw|fish and chips'],
    ['veg', 'Groente (portie)', 'Vegetables (portion)', 200, 60, 3, 9, 0.5, 'groente|groenten|broccoli|sperziebonen|salade groen|sla|veggies|vegetables|wokgroente'],
    ['egg', 'Ei', 'Egg', 55, 80, 7, 0.4, 5.5, 'ei|egg|gekookt ei']
  ];
  var GENERIC = ['meal-generic', 'Maaltijd (onbekend, schatting)', 'Meal (unknown, estimate)', 350, 600, 25, 60, 25, ''];

  function norm(x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9.,\/ ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function lev(a, b) {
    if (a === b) return 0; var m = a.length, n = b.length; if (!m || !n) return m || n;
    var p = [], c, i, j; for (j = 0; j <= n; j++) p[j] = j;
    for (i = 1; i <= m; i++) { c = [i]; for (j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
    return p[n];
  }
  function tokEq(a, b) {
    if (a === b) return true;
    if (a.length >= 4 && b.length >= 4 && (a.indexOf(b) === 0 || b.indexOf(a) === 0)) return true; // broodje/brood, frietjes/friet
    var L = Math.max(a.length, b.length); return L >= 5 && lev(a, b) <= (L >= 8 ? 2 : 1);
  }
  var STOP = { met: 1, en: 1, de: 1, het: 1, een: 1, van: 1, with: 1, and: 1, the: 1, a: 1, of: 1, 'n': 1, beetje: 1, wat: 1, ik: 1, heb: 1, had: 1, gegeten: 1, at: 1, ate: 1, op: 1, plus: 1 };
  // synonyms → token arrays
  var SYN = [];
  DISHES.forEach(function (d, di) { d[8].split('|').forEach(function (s) { var tk = norm(s).split(' ').filter(function (w) { return !STOP[w]; }); if (tk.length) SYN.push({ d: di, tk: tk }); }); });
  SYN.sort(function (a, b) { return b.tk.length - a.tk.length; });

  var NUMW = { een: 1, 'één': 1, one: 1, twee: 2, two: 2, drie: 3, three: 3, vier: 4, four: 4, vijf: 5, five: 5, zes: 6, six: 6, half: 0.5, halve: 0.5, dubbel: 2, double: 2, paar: 2, couple: 2 };
  var SIZEW = { klein: 0.75, kleine: 0.75, small: 0.75, mini: 0.5, groot: 1.35, grote: 1.35, large: 1.35, big: 1.35, xl: 1.6, xxl: 1.9, middel: 1, medium: 1 };

  // Parse one text into items: [{dish, qty, g, text}]
  function parse(text) {
    var parts = norm(text.replace(/\n/g, ',')).split(/\s*(?:,|;|\+|&|\ben\b|\band\b|\bplus\b)\s*/).filter(Boolean);
    var items = [];
    parts.forEach(function (part) {
      var words = part.split(' ').filter(Boolean);
      // quantity/size/grams
      var qty = 1, mult = 1, grams = null, rest = [];
      words.forEach(function (w, i) {
        var mg = w.match(/^(\d+(?:[.,]\d+)?)(g|gr|gram|ml)$/);
        if (mg) { grams = parseFloat(mg[1].replace(',', '.')); return; }
        if (/^\d+(?:[.,]\d+)?x?$/.test(w)) { var nx = parseFloat(w.replace(',', '.')); if (/^(g|gr|gram|ml)$/.test(words[i + 1] || '')) grams = nx; else qty = nx; return; }
        if (/^(g|gr|gram|ml)$/.test(w) && grams != null) return;
        if (NUMW[w] != null && i <= 1) { qty = NUMW[w]; return; }
        if (SIZEW[w] != null) { mult = SIZEW[w]; return; }
        if (!STOP[w]) rest.push(w);
      });
      // greedy dish matching inside the part (handles "burger met friet", "broodje kip teriyaki")
      var used = rest.map(function () { return false; }), found = [];
      SYN.forEach(function (s) {
        var idx = [];
        for (var k = 0; k < s.tk.length; k++) {
          var hit = -1; for (var r = 0; r < rest.length; r++) if (!used[r] && idx.indexOf(r) === -1 && tokEq(rest[r], s.tk[k])) { hit = r; break; }
          if (hit < 0) return; idx.push(hit);
        }
        if (found.some(function (f) { return f.d === s.d; })) return;
        idx.forEach(function (r) { used[r] = true; }); found.push({ d: s.d, pos: Math.min.apply(null, idx) });
      });
      found.sort(function (a, b) { return a.pos - b.pos; });
      var left = rest.filter(function (w, r) { return !used[r]; });
      found.forEach(function (f, fi) {
        var d = DISHES[f.d];
        items.push({ dish: d, qty: fi === 0 ? qty : 1, g: Math.round(fi === 0 && grams ? grams : d[3] * (fi === 0 ? qty : 1) * mult), text: part, known: true });
      });
      if (!found.length && rest.length) {
        // fall back to the per-100 g food database
        var fdb = dbMatch(rest);
        if (fdb) items.push({ food: fdb, g: Math.round(grams || (fdb.g || 100) * qty * mult), text: part, known: true });
        else items.push({ dish: GENERIC, g: Math.round(grams || GENERIC[3] * qty * mult), text: part, known: false, label: rest.join(' ') });
      }
    });
    return items;
  }
  function dbMatch(words) {
    var best = null, bs = 0;
    (App.allFoods ? App.allFoods() : FD.FOODS).forEach(function (f) {
      var h = norm(f.en + ' ' + f.nl + ' ' + (f.al || '')).split(' ');
      var hit = words.filter(function (w) { return h.some(function (x) { return tokEq(w, x); }); }).length / words.length;
      if (hit > bs) { bs = hit; best = f; }
    });
    return bs >= 0.99 ? best : null;
  }
  function itemFood(it) {
    if (it.food) return it.food;
    var d = it.dish, k = 100 / d[3];
    return { id: 'txt:' + d[0], nl: it.known ? d[1] : d[1] + (it.label ? ' — ' + it.label : ''), en: it.known ? d[2] : d[2] + (it.label ? ' — ' + it.label : ''), cat: 'meal',
      kcal: Math.round(d[4] * k), p: App.r1(d[5] * k), c: App.r1(d[6] * k), f: App.r1(d[7] * k), g: d[3], portion: t('1 portion') };
  }
  App.estimateText = function (text) {
    return parse(text).map(function (it) { var fd = itemFood(it); var x = App.macrosFor(fd, it.g); return { food: fd, g: it.g, known: it.known, text: it.text, kcal: x.kcal, p: x.p, c: x.c, f: x.f }; });
  };

  // ---------- UI ----------
  App.textFoodSheet = function (opts) {
    opts = opts || {};
    var s = App.sheet(App.sheetHead(t('What did you eat?'), t('Type it like you would say it. The app estimates the macros per item — adjust before saving.')) +
      '<textarea class="input" id="tf-q" rows="3" placeholder="' + esc(t('e.g. chicken teriyaki broodje, burger met friet, cola zero')) + '">' + esc(opts.text || '') + '</textarea>' +
      '<button class="btn primary block" id="tf-go" style="margin-top:10px">' + (I.search || '') + esc(t('Estimate macros')) + '</button>' +
      '<div id="tf-out" aria-live="polite"></div>');
    var q = s.el.querySelector('#tf-q'), out = s.el.querySelector('#tf-out'), rows = [];
    function render() {
      if (!rows.length) { out.innerHTML = '<p class="suggest">' + esc(t('Type at least one dish.')) + '</p>'; return; }
      var tot = { kcal: 0, p: 0, c: 0, f: 0 };
      rows.forEach(function (r) { var x = App.macrosFor(r.food, r.g); r.x = x; tot.kcal += x.kcal; tot.p += x.p; tot.c += x.c; tot.f += x.f; });
      out.innerHTML = '<div class="list" style="margin-top:12px">' + rows.map(function (r, i) {
        return '<div class="list-item"><div class="grow"><b>' + esc(App.foodName(r.food)) + '</b>' + (r.known ? '' : ' <span class="pill warn">' + esc(t('not recognised')) + '</span>') +
          '<div class="tiny muted">' + r.x.kcal + ' kcal · P ' + Math.round(r.x.p) + ' C ' + Math.round(r.x.c) + ' F ' + Math.round(r.x.f) + '</div></div>' +
          '<input class="input" style="width:80px" inputmode="decimal" data-i="' + i + '" value="' + r.g + '" aria-label="g"><span class="tiny muted">g</span>' +
          '<button class="icon-btn" data-del="' + i + '" aria-label="' + esc(t('Remove')) + '">' + (I.trash || '×') + '</button></div>'; }).join('') + '</div>' +
        '<div class="card macro-prev"><div class="grid4"><div><b>' + Math.round(tot.kcal) + '</b><span>kcal</span></div><div><b>' + Math.round(tot.p) + '</b><span>' + esc(t('protein')) + '</span></div><div><b>' + Math.round(tot.c) + '</b><span>' + esc(t('carbs')) + '</span></div><div><b>' + Math.round(tot.f) + '</b><span>' + esc(t('fat')) + '</span></div></div></div>' +
        '<label class="field" style="margin-top:10px"><span class="label">' + esc(t('Meal')) + '</span><select class="input" id="tf-m">' + App.MEALS.map(function (m) { return '<option value="' + m[0] + '"' + (m[0] === App.mealNow() ? ' selected' : '') + '>' + esc(t(m[1])) + '</option>'; }).join('') + '</select></label>' +
        '<p class="tiny muted">' + esc(t('Estimate based on typical portions (±20-30%). Change the grams if your portion was bigger or smaller. Unknown dishes get an average meal value.')) + '</p>' +
        '<button class="btn primary lg block" id="tf-add">' + (I.plus || '') + esc(t('Add all to log')) + '</button>';
      out.querySelectorAll('[data-i]').forEach(function (inp) { inp.onchange = function () { rows[+inp.dataset.i].g = Math.max(0, App.num(inp.value)); render(); }; });
      out.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { rows.splice(+b.dataset.del, 1); render(); }; });
      out.querySelector('#tf-add').onclick = function () {
        var meal = out.querySelector('#tf-m').value;
        rows.forEach(function (r, i) { if (r.g > 0) App.logFood(r.food, r.g, meal, opts.src || 'text', Object.assign({ est: true }, i === 0 && opts.photo ? { photo: opts.photo } : {})); });
        App.toast(t('Added')); App.closeSheets(); App.rerender();
      };
    }
    function go() { rows = App.estimateText(q.value); render(); }
    s.el.querySelector('#tf-go').onclick = go;
    if (opts.text) go();
    return s;
  };
  A['food-text'] = function () { App.textFoodSheet(); };

  var NL = { 'What did you eat?': 'Wat heb je gegeten?', 'Type it like you would say it. The app estimates the macros per item — adjust before saving.': 'Typ het zoals je het zou zeggen. De app schat de macro\'s per onderdeel — pas aan vóór je opslaat.',
    'e.g. chicken teriyaki broodje, burger met friet, cola zero': 'bv. chicken teriyaki broodje, burger met friet, cola zero', 'Estimate macros': 'Schat macro\'s', 'Type at least one dish.': 'Typ minstens één gerecht.',
    'not recognised': 'niet herkend', 'Estimate based on typical portions (±20-30%). Change the grams if your portion was bigger or smaller. Unknown dishes get an average meal value.': 'Schatting op basis van gemiddelde porties (±20-30%). Pas de grammen aan als je portie groter of kleiner was. Onbekende gerechten krijgen een gemiddelde maaltijdwaarde.',
    'Add all to log': 'Alles toevoegen', 'Type what you ate': 'Typ wat je at', 'Not right? Describe it:': 'Klopt het niet? Beschrijf het:', 'Describe it & log': 'Beschrijf & log',
    'Or type what is on the plate (e.g. burger met friet)': 'Of typ wat er op je bord ligt (bv. burger met friet)' };
  var ES = { 'What did you eat?': '¿Qué has comido?', 'Type it like you would say it. The app estimates the macros per item — adjust before saving.': 'Escríbelo como lo dirías. La app estima los macros por elemento — ajusta antes de guardar.',
    'e.g. chicken teriyaki broodje, burger met friet, cola zero': 'p. ej. sándwich de pollo teriyaki, hamburguesa con patatas, cola zero', 'Estimate macros': 'Estimar macros', 'Type at least one dish.': 'Escribe al menos un plato.',
    'not recognised': 'no reconocido', 'Estimate based on typical portions (±20-30%). Change the grams if your portion was bigger or smaller. Unknown dishes get an average meal value.': 'Estimación con porciones típicas (±20-30%). Cambia los gramos si tu porción fue mayor o menor. Los platos desconocidos reciben un valor medio.',
    'Add all to log': 'Añadir todo', 'Type what you ate': 'Escribe lo que comiste', 'Not right? Describe it:': '¿No es correcto? Descríbelo:', 'Describe it & log': 'Describir y registrar',
    'Or type what is on the plate (e.g. burger met friet)': 'O escribe lo que hay en el plato (p. ej. hamburguesa con patatas)' };
  window.FBG_I18N = window.FBG_I18N || {};
  window.FBG_I18N.nl = Object.assign(window.FBG_I18N.nl || {}, NL);
  window.FBG_I18N.es = Object.assign(window.FBG_I18N.es || {}, ES);
})();
