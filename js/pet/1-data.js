/* Forged by Grace v2.5 — Sweatpoints + Bible-animal pet. Part 1: i18n, animals, verses, art. */
(function () {
  'use strict';
  var App = window.App, S = App.S;
  var NL = {
    'My Pet': 'Mijn dier', 'Sweatpoints': 'Sweatpoints', 
    'Save your Sweatpoints — later you may be able to swap them for real products.': 'Spaar je Sweatpoints — later kun je ze misschien inwisselen voor echte producten.',
    'Choose your animal': 'Kies je dier', 'Every animal has its own Bible verse. Take good care of it!': 'Elk dier heeft een eigen Bijbeltekst. Zorg er goed voor!',
    'Name your animal': 'Geef je dier een naam', 'Adopt': 'Adopteren', 'Sheep': 'Schaap', 'Lamb': 'Lam', 'Dove': 'Duif', 'Lion': 'Leeuw', 'Donkey': 'Ezel', 'Ox': 'Os', 'Eagle': 'Arend',
    'Food': 'Eten', 'Thirst': 'Drinken', 'Joy': 'Blijdschap', 'Play': 'Spelen', 'Wardrobe': 'Kledingkast', 'Homes': 'Huizen', 'Earn': 'Verdienen', 'History': 'Geschiedenis',
    'Food & drink': 'Eten & drinken', 'Wear': 'Aantrekken', 'Take off': 'Uittrekken', 'Move in': 'Verhuizen', 'Living here': 'Woont hier',
    'Not enough Sweatpoints': 'Niet genoeg Sweatpoints', 'Bought!': 'Gekocht!', 'Yum!': 'Smakelijk!', 'Hats': 'Hoeden & petjes', 'Hair & manes': 'Haar & manen', 'Glasses & face': 'Brillen & gezicht', 'Clothing': 'Kleding', 'Neck & belt': 'Nek & riem', 'In hand': 'In de hand',
    'How you earn Sweatpoints': 'Zo verdien je Sweatpoints', 'Daily check-in (open the app)': 'Dagelijkse check-in (app openen)', 'Steps (6k / 8k / 10k)': 'Stappen (6k / 8k / 10k)', 'Strength workout completed': 'Krachttraining afgerond', 'Extra sport session logged (max 2 a day)': 'Extra sportsessie gelogd (max 2 per dag)',
    'Food logged (3+ items)': 'Eten gelogd (3+ items)', 'Day within calories & protein target': 'Dag binnen calorie- & eiwitdoel', '7-day check-in streak': '7 dagen op rij check-in', 'Max per day': 'Max per dag', 'Each thing counts once.': 'Alles telt maar één keer.',
    'No points yet — open the app daily, walk, train and log your food.': 'Nog geen punten — open de app elke dag, wandel, train en log je eten.', 'Welcome bonus': 'Welkomstbonus',
    'Check-in': 'Check-in', 'Workout': 'Training', 'Sport session': 'Sportsessie', 'Food logged': 'Eten gelogd', 'On target': 'Binnen je doel', 'Streak bonus': 'Streak-bonus', 'Revive': 'Tot leven wekken',
    '6,000+ steps': '6.000+ stappen', '8,000+ steps': '8.000+ stappen', '10,000+ steps': '10.000+ stappen',
    'is hungry — feed it today!': 'heeft honger — voer je dier vandaag!', 'is weak! Feed within {h} h or it will pass away.': 'is zwak! Voer binnen {h} uur, anders overlijdt je dier.',
    'is happy and fed.': 'is blij en heeft gegeten.', 'has passed away…': 'is overleden…', 'Nobody fed it for 3 days. You can revive it, or start again with a new animal.': 'Niemand heeft het 3 dagen gevoerd. Je kunt het weer tot leven wekken, of opnieuw beginnen met een nieuw dier.',
    'New animal': 'Nieuw dier', 'Played together!': 'Samen gespeeld!', 'Rest a bit — play again later.': 'Even rusten — straks weer spelen.', 'free': 'gratis',
    'Winter': 'Winter', 'Spring': 'Lente', 'Summer': 'Zomer', 'Autumn': 'Herfst', 'Your items and points stay.': 'Je spullen en punten blijven.', 'Start over with a new animal?': 'Opnieuw beginnen met een nieuw dier?',
    'Change animal': 'Ander dier', 'Feed and give water every day. After 3 days without care your animal dies.': 'Geef elke dag eten en drinken. Na 3 dagen zonder zorg overlijdt je dier.', 'Earned today': 'Vandaag verdiend'
  };
  window.FBG_I18N = window.FBG_I18N || {}; window.FBG_I18N.nl = window.FBG_I18N.nl || {};
  Object.keys(NL).forEach(function (k) { if (!window.FBG_I18N.nl[k]) window.FBG_I18N.nl[k] = NL[k]; });
  var P = App.PET = {};
  P.nl = function () { return S.lang === 'nl'; };
  P.L = function (o) { return P.nl() ? o.nl : o.en; };
  // Verses verified against bible-api.com (KJV) and api.getbible.net (Statenvertaling), Nov 2026.
  P.PETS = {
    sheep: { en: 'Sheep', nl: 'Schaap', ref: ['John 10:27', 'Johannes 10:27'], v: ['My sheep hear my voice, and I know them, and they follow me:', 'Mijn schapen horen Mijn stem, en Ik ken dezelve, en zij volgen Mij.'] },
    lamb: { en: 'Lamb', nl: 'Lam', ref: ['John 1:29', 'Johannes 1:29'], v: ['The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world.', 'Des anderen daags zag Johannes Jezus tot zich komende, en zeide: Zie het Lam Gods, Dat de zonde der wereld wegneemt!'] },
    dove: { en: 'Dove', nl: 'Duif', ref: ['Matthew 3:16', 'Mattheüs 3:16'], v: ['And Jesus, when he was baptized, went up straightway out of the water: and, lo, the heavens were opened unto him, and he saw the Spirit of God descending like a dove, and lighting upon him:', 'En Jezus, gedoopt zijnde, is terstond opgeklommen uit het water; en ziet, de hemelen werden Hem geopend, en hij zag den Geest Gods nederdalen, gelijk een duive, en op Hem komen.'] },
    lion: { en: 'Lion', nl: 'Leeuw', ref: ['Proverbs 28:1', 'Spreuken 28:1'], v: ['The wicked flee when no man pursueth: but the righteous are bold as a lion.', 'De goddelozen vlieden, waar geen vervolger is; maar elk rechtvaardige is moedig, als een jonge leeuw.'] },
    donkey: { en: 'Donkey', nl: 'Ezel', ref: ['Zechariah 9:9', 'Zacharia 9:9'], v: ['Rejoice greatly, O daughter of Zion; shout, O daughter of Jerusalem: behold, thy King cometh unto thee: he is just, and having salvation; lowly, and riding upon an ass, and upon a colt the foal of an ass.', 'Verheug u zeer, gij dochter Sions! juich, gij dochter Jeruzalems! Ziet, uw Koning zal u komen, rechtvaardig, en Hij is een Heiland; arm, en rijdende op een ezel, en op een veulen, een jong der ezelinnen.'] },
    ox: { en: 'Ox', nl: 'Os', ref: ['Proverbs 14:4', 'Spreuken 14:4'], v: ['Where no oxen are, the crib is clean: but much increase is by the strength of the ox.', 'Als er geen ossen zijn, zo is de krib rein; maar door de kracht van den os is der inkomsten veel.'] },
    eagle: { en: 'Eagle', nl: 'Arend', ref: ['Isaiah 40:31', 'Jesaja 40:31'], v: ['But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.', 'Maar dien den HEERE verwachten, zullen de kracht vernieuwen; zij zullen opvaren met vleugelen, gelijk de arenden; zij zullen lopen, en niet moede worden; zij zullen wandelen, en niet mat worden.'] }
  };
  P.verse = function (k) { var p = P.PETS[k], i = P.nl() ? 1 : 0; return { ref: p.ref[i], text: p.v[i], tr: i ? 'Statenvertaling' : 'KJV' }; };

  // ---- Art v2.6: natural-looking animals. 200x200, head centre (100,90), head top y≈50, eyes y≈88 ----
  function wool(cx, cy, pts, fill, stroke) { return pts.map(function (p) { return '<circle cx="' + (cx + p[0]) + '" cy="' + (cy + p[1]) + '" r="' + p[2] + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2"/>'; }).join(''); }
  P.wool = wool;
  function rnd(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function rg(id, c1, c2, cx, cy) { return '<radialGradient id="' + id + '" cx="' + (cx || 0.42) + '" cy="' + (cy || 0.35) + '" r="0.75"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></radialGradient>'; }
  function lg(id, c1, c2) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>'; }
  // short hair strokes inside an ellipse
  function fur(cx, cy, rx, ry, n, c, op, seed, len) {
    var r = rnd(seed || 7), s = '<g stroke="' + c + '" stroke-width="1.1" stroke-linecap="round" fill="none" opacity="' + (op || 0.35) + '">'; len = len || 5;
    for (var i = 0; i < n; i++) { var a = r() * Math.PI * 2, d = Math.sqrt(r()), x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d, dx = (x - cx) / (rx || 1) * 2, dy = len; s += '<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'q' + (dx).toFixed(1) + ' ' + (dy / 2).toFixed(1) + ' ' + (dx * 1.5).toFixed(1) + ' ' + dy + '"/>'; }
    return s + '</g>';
  }
  // curly wool: clusters of small circles with shading
  function fleece(cx, cy, rx, ry, n, c1, c2, seed, rr) {
    var r = rnd(seed || 3), s = ''; rr = rr || 7;
    for (var i = 0; i < n; i++) { var a = r() * Math.PI * 2, d = Math.sqrt(r()), x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d, k = rr * (0.75 + r() * 0.5); s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + k.toFixed(1) + '" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="1.2"/><path d="M' + (x - k * 0.5).toFixed(1) + ' ' + (y + k * 0.1).toFixed(1) + 'a' + (k * 0.5).toFixed(1) + ' ' + (k * 0.5).toFixed(1) + ' 0 0 1 ' + k.toFixed(1) + ' 0" stroke="' + c2 + '" stroke-width="1" fill="none" opacity=".7"/>'; }
    return s;
  }
  // natural almond eye; st: happy/ok open, sad = heavy lid, dead = closed
  function eye(x, y, w, h, st, iris, lid, side) {
    w *= 1.22; h *= 1.22; var hw = w / 2, hh = h / 2, tilt = side || 0;
    if (st === 'dead') return '<path d="M' + (x - hw) + ' ' + y + 'q' + hw + ' ' + (hh * 0.9) + ' ' + w + ' 0" stroke="#2a1d14" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    var almond = 'M' + (x - hw) + ' ' + (y + tilt) + 'Q' + x + ' ' + (y - hh * 1.3) + ' ' + (x + hw) + ' ' + (y - tilt) + 'Q' + x + ' ' + (y + hh * 1.25) + ' ' + (x - hw) + ' ' + (y + tilt) + 'z';
    var s = '<path d="' + almond + '" fill="#160f0a"/>' + '<circle cx="' + x + '" cy="' + y + '" r="' + (hh * 0.95).toFixed(1) + '" fill="' + iris + '"/><ellipse cx="' + x + '" cy="' + y + '" rx="' + (hh * 0.42).toFixed(1) + '" ry="' + (hh * 0.7).toFixed(1) + '" fill="#0a0705"/>' +
      '<circle cx="' + (x + hw * 0.25).toFixed(1) + '" cy="' + (y - hh * 0.35).toFixed(1) + '" r="' + Math.max(1.2, hh * 0.32).toFixed(1) + '" fill="#fff" opacity=".9"/><circle cx="' + (x - hw * 0.25).toFixed(1) + '" cy="' + (y + hh * 0.4).toFixed(1) + '" r="' + Math.max(0.6, hh * 0.14).toFixed(1) + '" fill="#fff" opacity=".6"/>' +
      '<path d="' + almond + '" fill="none" stroke="#0d0906" stroke-width="1.4"/>';
    if (st === 'sad') s += '<path d="M' + (x - hw - 1) + ' ' + (y + tilt - 1) + 'Q' + x + ' ' + (y - hh * 1.5) + ' ' + (x + hw + 1) + ' ' + (y - tilt - 1) + 'L' + (x + hw + 1) + ' ' + (y + 0.5) + 'Q' + x + ' ' + (y - hh * 0.1) + ' ' + (x - hw - 1) + ' ' + (y + 0.5) + 'z" fill="' + lid + '"/><path d="M' + (x - hw) + ' ' + (y + 0.5) + 'Q' + x + ' ' + (y - hh * 0.1) + ' ' + (x + hw) + ' ' + (y + 0.5) + '" stroke="#0d0906" stroke-width="1.2" fill="none"/>';
    return s;
  }
  function eyes2(st, iris, lid, dx, y, w, h, tilt) { return eye(100 - dx, y, w, h, st, iris, lid, tilt) + eye(100 + dx, y, w, h, st, iris, lid, -(tilt || 0)); }
  function shadow() { return ''; }
  // neutral closed mouth (no smile): small philtrum + gentle lines
  function lips(y, c, w) { w = w || 7; return '<path d="M100 ' + (y - 6) + 'v6M100 ' + y + 'q-' + (w * 0.6) + ' 3 -' + w + ' 1.5M100 ' + y + 'q' + (w * 0.6) + ' 3 ' + w + ' 1.5" stroke="' + c + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>'; }
  function hoofLegs(c, h, x1, x2, w) { return '<rect x="' + x1 + '" y="164" width="' + w + '" height="20" rx="3" fill="' + c + '"/><rect x="' + x2 + '" y="164" width="' + w + '" height="20" rx="3" fill="' + c + '"/><rect x="' + x1 + '" y="180" width="' + w + '" height="7" rx="2" fill="' + h + '"/><rect x="' + x2 + '" y="180" width="' + w + '" height="7" rx="2" fill="' + h + '"/>'; }
  function droop(st) { return st === 'sad' ? 18 : 0; }
  /* v2.7: realistic photo-style animals (assets/pets/*.webp, 1024px source coords) with per-animal wardrobe anchors. */
  var IMG = { x: 25, y: 50, w: 150 }, K = IMG.w / 1024;
  function px(x) { return IMG.x + x * K; } function py(y) { return IMG.y + y * K; }
  // head: crown centre x, hat line y, head width; eye: mid x, y, distance; chest: x, y, width (source px)
  P.ANCH = {
    sheep:  { h: [395, 150, 190], e: [392, 209, 143], c: [400, 360, 190] },
    lamb:   { h: [442, 165, 215], e: [442, 242, 155], c: [450, 400, 200] },
    dove:   { h: [466, 130, 150], e: [466, 168, 95],  c: [455, 300, 210] },
    lion:   { h: [420, 200, 200], e: [421, 269, 108], c: [430, 480, 230] },
    donkey: { h: [437, 225, 180], e: [437, 311, 119], c: [450, 490, 190] },
    ox:     { h: [571, 160, 190], e: [571, 232, 159], c: [565, 430, 200] },
    eagle:  { h: [519, 110, 230], e: [519, 162, 112], c: [520, 300, 260] }
  };
  function tf(ax, ay, aw, t) { var s = (t[2] * K) / aw; return 'translate(' + (px(t[0]) - ax * s).toFixed(2) + ' ' + (py(t[1]) - ay * s).toFixed(2) + ') scale(' + s.toFixed(3) + ')'; }
  // Canonical item frames: head brim (100,64) w80, eyes (100,90) d30, chest (100,120) w72. Hand items stay at the side.
  P.slotTf = function (type, slot) {
    var a = P.ANCH[type]; if (!a) return '';
    if (slot === 'head' || slot === 'hair') return tf(100, 64, 80, a.h);
    if (slot === 'face') return tf(100, 90, 30, a.e);
    if (slot === 'neck' || slot === 'body') return tf(100, 120, 72, a.c);
    return '';
  };
  function photo(k, st) {
    var sad = st === 'sad', f = sad ? 'saturate(.55) brightness(.88)' : st === 'dead' ? 'grayscale(1)' : '';
    return '<image href="assets/pets/' + k + '.webp" x="' + IMG.x + '" y="' + IMG.y + '" width="' + IMG.w + '" height="' + IMG.w + '" preserveAspectRatio="xMidYMid meet"' + (f ? ' style="filter:' + f + '"' : '') + (sad ? ' transform="rotate(4 100 190) translate(0 3)"' : '') + '/>' +
      (sad ? '<g fill="#7fb7e6" opacity=".85"><path d="M' + (px(P.ANCH[k].e[0] - P.ANCH[k].e[2] / 2) + 1).toFixed(1) + ' ' + (py(P.ANCH[k].e[1]) + 4).toFixed(1) + 'q-2 4 0 6q2 -2 0 -6z"/></g>' : '');
  }
  P.ART = {};
  ['sheep', 'lamb', 'dove', 'lion', 'donkey', 'ox', 'eagle'].forEach(function (k) { P.ART[k] = function (st) { return photo(k, st); }; });
})();
