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
  P.ART = {
    sheep: function (st) {
      var d = droop(st);
      return '<defs>' + rg('pa-shf', '#4a3d35', '#1f1915') + lg('pa-shw', '#fbf7ee', '#ddd3c0') + '</defs>' + hoofLegs('#2b231e', '#14100d', 78, 110, 12) +
        '<ellipse cx="100" cy="148" rx="50" ry="34" fill="url(#pa-shw)"/>' + fleece(100, 146, 44, 28, 46, '#f7f2e6', '#d9cfba', 11, 8) +
        '<path d="M70 82q-22 -6 -30 ' + (4 + d) + 'q14 6 32 0z" fill="#2a221d"/><path d="M130 82q22 -6 30 ' + (4 + d) + 'q-14 6 -32 0z" fill="#2a221d"/><path d="M68 84q-16 -2 -22 ' + (5 + d) + 'q10 2 22 -1z" fill="#6b4f45" opacity=".6"/><path d="M132 84q16 -2 22 ' + (5 + d) + 'q-10 2 -22 -1z" fill="#6b4f45" opacity=".6"/>' +
        '<path d="M100 56q28 0 30 32q2 22 -10 38q-8 10 -20 10q-12 0 -20 -10q-12 -16 -10 -38q2 -32 30 -32z" fill="url(#pa-shf)"/>' + fur(100, 92, 24, 34, 40, '#7a6558', 0.35, 5, 4) +
        fleece(100, 60, 26, 9, 12, '#f7f2e6', '#d9cfba', 4, 7) +
        eyes2(st, '#7a5a2a', '#2a221d', 17, 89, 11, 7, 1.5) +
        '<ellipse cx="100" cy="120" rx="14" ry="10" fill="#3d322c"/><path d="M92 116q3 4 6 2M108 116q-3 4 -6 2" stroke="#0e0b09" stroke-width="2.2" fill="none" stroke-linecap="round"/>' + lips(128, '#0e0b09', 6);
    },
    lamb: function (st) {
      var d = droop(st);
      return '<defs>' + rg('pa-lbf', '#fffaf2', '#ecdcc6') + lg('pa-lbw', '#fffdf8', '#e9e0cf') + '</defs>' + hoofLegs('#efe3d2', '#3b2f28', 82, 108, 10) +
        '<ellipse cx="100" cy="150" rx="42" ry="30" fill="url(#pa-lbw)"/>' + fleece(100, 148, 36, 24, 40, '#fffcf6', '#e6dccb', 21, 7) +
        '<path d="M72 84q-24 -4 -30 ' + (8 + d) + 'q16 6 32 -2z" fill="#f2e2cf"/><path d="M70 86q-16 0 -22 ' + (6 + d) + 'q12 2 22 -3z" fill="#f2b8b5" opacity=".75"/><path d="M128 84q24 -4 30 ' + (8 + d) + 'q-16 6 -32 -2z" fill="#f2e2cf"/><path d="M130 86q16 0 22 ' + (6 + d) + 'q-12 2 -22 -3z" fill="#f2b8b5" opacity=".75"/>' +
        '<path d="M100 58q28 0 30 30q1 20 -10 32q-8 10 -20 10q-12 0 -20 -10q-11 -12 -10 -32q2 -30 30 -30z" fill="url(#pa-lbf)"/>' + fur(100, 96, 22, 28, 28, '#c9b49a', 0.35, 9, 3.5) +
        fleece(100, 62, 20, 8, 10, '#fffcf6', '#e6dccb', 8, 7) +
        eyes2(st, '#5a3e22', '#efdfca', 16, 90, 12, 8, 1.5) +
        '<ellipse cx="100" cy="116" rx="11" ry="8" fill="#f2c9c2"/><path d="M93 113q3 4 5 2M107 113q-3 4 -5 2" stroke="#7a4a44" stroke-width="2" fill="none" stroke-linecap="round"/>' + lips(124, '#9a6a60', 5);
    },
    dove: function (st) {
      var wd = st === 'sad' ? 8 : 0;
      return '<defs>' + rg('pa-dvh', '#ffffff', '#d9dee6') + rg('pa-dvb', '#ffffff', '#cfd6e0', 0.5, 0.3) + '<linearGradient id="pa-dvn" x1="0" x2="1"><stop offset="0" stop-color="#b9d8cf"/><stop offset=".5" stop-color="#d6c7e6"/><stop offset="1" stop-color="#b9d8cf"/></linearGradient></defs>' +
        '<path d="M92 178l-3 9M92 178l2 9M92 178l6 7M108 178l3 9M108 178l-2 9M108 178l-6 7" stroke="#d9707a" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M86 170l14 18l14 -18z" fill="#c8cfda"/><ellipse cx="100" cy="146" rx="38" ry="34" fill="url(#pa-dvb)"/>' +
        '<path d="M64 124q-20 ' + (16 + wd) + ' -10 ' + (48 + wd) + 'q20 -6 28 -32z" fill="#e3e8ef" stroke="#bfc7d3"/><path d="M60 140q4 12 12 18M58 152q6 8 14 10" stroke="#aeb7c4" stroke-width="1.2" fill="none"/>' +
        '<path d="M136 124q20 ' + (16 + wd) + ' 10 ' + (48 + wd) + 'q-20 -6 -28 -32z" fill="#e3e8ef" stroke="#bfc7d3"/><path d="M140 140q-4 12 -12 18M142 152q-6 8 -14 10" stroke="#aeb7c4" stroke-width="1.2" fill="none"/>' +
        '<path d="M74 118q26 16 52 0q-4 14 -26 16q-22 -2 -26 -16z" fill="url(#pa-dvn)" opacity=".7"/>' + fur(100, 150, 26, 22, 30, '#b8c1ce', 0.4, 31, 4) +
        '<ellipse cx="100" cy="90" rx="32" ry="31" fill="url(#pa-dvh)"/>' + fur(100, 84, 24, 20, 16, '#c3cbd6', 0.3, 33, 3) +
        eye(80, 88, 10, 9, st, '#c8642a', '#e6eaf0', 0) + eye(120, 88, 10, 9, st, '#c8642a', '#e6eaf0', 0) +
        '<path d="M95 97q5 -4 10 0l-2 3h-6z" fill="#f4f1ec" stroke="#d7d2ca" stroke-width=".8"/><path d="M96 100h8l-4 11z" fill="#3a3436"/><path d="M100 100v9" stroke="#1d191a" stroke-width=".8"/>';
    },
    lion: function (st) {
      var d = droop(st), m = '', r = rnd(17);
      for (var i = 0; i < 34; i++) { var a = i / 34 * Math.PI * 2, x1 = 100 + Math.cos(a) * 30, y1 = 92 + Math.sin(a) * 32, l = 26 + r() * 12, x2 = 100 + Math.cos(a + 0.12) * (30 + l), y2 = 96 + Math.sin(a + 0.12) * (32 + l) * (a > 0.3 && a < 2.8 ? 1.1 : 0.9); m += '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'Q' + (100 + Math.cos(a - 0.1) * (34 + l * 0.6)).toFixed(1) + ' ' + (92 + Math.sin(a - 0.1) * (36 + l * 0.6)).toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="' + (i % 3 === 0 ? '#7a4416' : i % 3 === 1 ? '#a35f22' : '#c07b32') + '" stroke-width="' + (9 - r() * 3).toFixed(1) + '" stroke-linecap="round" fill="none"/>'; }
      return '<defs>' + rg('pa-lnf', '#e9b56a', '#b67a35') + rg('pa-lnm', '#9b5a22', '#5e3311') + lg('pa-lnb', '#d9a35a', '#b07a3a') + '</defs>' +
        '<path d="M140 166q24 4 26 -22" stroke="#c48c48" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M164 146q4 -10 -2 -14q-6 4 -4 14z" fill="#5e3311"/>' +
        '<rect x="76" y="160" width="15" height="24" rx="6" fill="#cf9851"/><rect x="109" y="160" width="15" height="24" rx="6" fill="#cf9851"/><path d="M78 182h11M111 182h11" stroke="#8a5a28" stroke-width="1.5"/>' +
        '<ellipse cx="100" cy="148" rx="40" ry="30" fill="url(#pa-lnb)"/><ellipse cx="100" cy="92" rx="56" ry="58" fill="url(#pa-lnm)"/>' + m +
        '<ellipse cx="72" cy="' + (60 + d / 3) + '" rx="9" ry="8" fill="#c48c48"/><ellipse cx="72" cy="' + (61 + d / 3) + '" rx="5" ry="4.5" fill="#6b3d1a"/><ellipse cx="128" cy="' + (60 + d / 3) + '" rx="9" ry="8" fill="#c48c48"/><ellipse cx="128" cy="' + (61 + d / 3) + '" rx="5" ry="4.5" fill="#6b3d1a"/>' +
        '<path d="M100 56q30 0 32 30q1 18 -8 30q-10 14 -24 14q-14 0 -24 -14q-9 -12 -8 -30q2 -30 32 -30z" fill="url(#pa-lnf)"/>' + fur(100, 86, 26, 26, 30, '#8a5424', 0.3, 19, 4) +
        '<path d="M88 72q12 -4 24 0" stroke="#9a6a35" stroke-width="1.4" fill="none" opacity=".6"/>' +
        eyes2(st, '#c98a1e', '#c99050', 15, 88, 12, 7, 2) + (st !== 'dead' ? '<path d="M80 92q2 6 8 10M120 92q-2 6 -8 10" stroke="#5e3311" stroke-width="1.6" fill="none" opacity=".7"/>' : '') +
        '<path d="M92 100q8 -4 16 0v8q-8 4 -16 0z" fill="#e2b77c"/><ellipse cx="90" cy="114" rx="11" ry="8" fill="#f4e2c4"/><ellipse cx="110" cy="114" rx="11" ry="8" fill="#f4e2c4"/>' +
        '<path d="M92 102q8 -3 16 0q-2 7 -8 9q-6 -2 -8 -9z" fill="#3a221a"/><path d="M94 103q6 -2 12 0" stroke="#7a5046" stroke-width="1.2" fill="none"/>' +
        '<g fill="#6b4a33">' + [[84, 112], [88, 116], [82, 117], [116, 112], [112, 116], [118, 117]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="0.9"/>'; }).join('') + '</g>' +
        '<path d="M100 111v6M100 117q-5 3 -9 2M100 117q5 3 9 2" stroke="#3a221a" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="100" cy="124" rx="8" ry="4" fill="#f1dcbc"/>' +
        '<g stroke="#fff" stroke-width=".7" opacity=".7"><path d="M80 114l-18 -2M80 117l-18 2M120 114l18 -2M120 117l18 2"/></g>';
    },
    donkey: function (st) {
      var d = st === 'sad' ? 1 : 0;
      var ear = function (sx) { var rot = sx * (d ? 48 : 16); return '<g transform="rotate(' + rot + ' ' + (100 + sx * 18) + ' 62)"><path d="M' + (100 + sx * 18) + ' 64q' + (sx * -10) + ' -26 ' + (sx * 2) + ' -50q' + (sx * 12) + ' 22 ' + (sx * 6) + ' 50z" fill="#8e8890"/><path d="M' + (100 + sx * 19) + ' 60q' + (sx * -5) + ' -20 ' + (sx * 1.5) + ' -40q' + (sx * 7) + ' 18 ' + (sx * 3) + ' 40z" fill="#e8dcd8"/><path d="M' + (100 + sx * 20) + ' 14q' + (sx * -4) + ' 6 ' + (sx * -3) + ' 10l' + (sx * 6) + ' -1z" fill="#2d2729"/></g>'; };
      return '<defs>' + rg('pa-dkf', '#a8a2a8', '#6f6870') + lg('pa-dkb', '#9a949a', '#7a737a') + '</defs>' + hoofLegs('#8a838a', '#2d2729', 78, 110, 13) +
        '<ellipse cx="100" cy="148" rx="42" ry="30" fill="url(#pa-dkb)"/><ellipse cx="100" cy="158" rx="22" ry="14" fill="#ddd6d2"/><path d="M100 120v40" stroke="#4a4246" stroke-width="3" opacity=".5"/>' + fur(100, 148, 38, 26, 40, '#5b545a', 0.25, 41, 4) +
        ear(-1) + ear(1) +
        '<path d="M100 56q24 0 26 26q2 16 -4 30q-4 16 -22 18q-18 -2 -22 -18q-6 -14 -4 -30q2 -26 26 -26z" fill="url(#pa-dkf)"/>' + fur(100, 84, 22, 24, 28, '#4f484e', 0.3, 43, 4) +
        '<path d="M92 58q8 -14 16 0q-4 8 -8 10q-4 -2 -8 -10z" fill="#3b3438"/>' +
        '<circle cx="84" cy="88" r="9" fill="#e6dfdc" opacity=".55"/><circle cx="116" cy="88" r="9" fill="#e6dfdc" opacity=".55"/>' + eyes2(st, '#3a2516', '#8e8890', 16, 88, 12, 8, 1.5) +
        '<ellipse cx="100" cy="116" rx="20" ry="15" fill="#e9e2de"/><ellipse cx="100" cy="112" rx="18" ry="8" fill="#f3eeeb" opacity=".6"/><path d="M88 112q3 -3 6 1q-3 2 -6 -1zM112 112q-3 -3 -6 1q3 2 6 -1z" fill="#3d3236"/>' + lips(126, '#5a4d50', 7);
    },
    ox: function (st) {
      var d = droop(st);
      return '<defs>' + rg('pa-oxf', '#9a6534', '#5a3416') + lg('pa-oxb', '#86552a', '#5e3818') + lg('pa-oxh', '#f4ecd8', '#b8a684') + '</defs>' + hoofLegs('#6a4020', '#231812', 74, 110, 16) +
        '<ellipse cx="100" cy="148" rx="48" ry="32" fill="url(#pa-oxb)"/><path d="M80 124q20 30 40 0q-2 24 -20 32q-18 -8 -20 -32z" fill="#4e2e13" opacity=".5"/>' + fur(100, 148, 42, 28, 44, '#3b220e', 0.3, 51, 4) +
        '<path d="M70 70q-26 -4 -32 -28q-2 -6 4 -2q10 14 30 16z" fill="url(#pa-oxh)" stroke="#8f7f60" stroke-width="1"/><path d="M130 70q26 -4 32 -28q2 -6 -4 -2q-10 14 -30 16z" fill="url(#pa-oxh)" stroke="#8f7f60" stroke-width="1"/>' +
        '<path d="M70 84q-20 -4 -26 ' + (6 + d) + 'q14 4 26 -1z" fill="#7a4a22"/><path d="M130 84q20 -4 26 ' + (6 + d) + 'q-14 4 -26 -1z" fill="#7a4a22"/><path d="M68 85q-12 0 -18 ' + (4 + d) + 'q10 1 18 -2z" fill="#d9a88a" opacity=".6"/><path d="M132 85q12 0 18 ' + (4 + d) + 'q-10 1 -18 -2z" fill="#d9a88a" opacity=".6"/>' +
        '<path d="M100 58q32 0 32 30q0 18 -6 28q-6 16 -26 16q-20 0 -26 -16q-6 -10 -6 -28q0 -30 32 -30z" fill="url(#pa-oxf)"/>' + fur(100, 86, 28, 26, 34, '#3b220e', 0.3, 53, 4) +
        fur(100, 64, 16, 7, 14, '#3b220e', 0.6, 55, 6) + '<path d="M94 74q6 -4 12 0q-2 6 -6 8q-4 -2 -6 -8z" fill="#f4ead8" opacity=".9"/>' +
        eyes2(st, '#3a2010', '#6e4220', 18, 90, 12, 8, 1.5) +
        '<path d="M80 112q0 -10 20 -10q20 0 20 10q0 12 -20 14q-20 -2 -20 -14z" fill="#c9958a"/><path d="M84 108q16 -6 32 0" stroke="#e5b9ae" stroke-width="2" fill="none" opacity=".7"/><path d="M88 112q4 -4 7 1q-4 3 -7 -1zM112 112q-4 -4 -7 1q4 3 7 -1z" fill="#3b2420"/>' + lips(124, '#5b3a30', 8);
    },
    eagle: function (st) {
      var wd = st === 'sad' ? 8 : 0, f = '';
      for (var row = 0; row < 4; row++) for (var c = 0; c < 6 - (row % 2); c++) { var x = 70 + c * 12 + (row % 2) * 6, y = 132 + row * 11; f += '<path d="M' + (x - 6) + ' ' + y + 'q6 9 12 0" stroke="#3b230f" stroke-width="1.3" fill="none" opacity=".6"/>'; }
      return '<defs>' + rg('pa-egh', '#ffffff', '#dcd8cf') + lg('pa-egb', '#6a4524', '#3a230f') + lg('pa-egk', '#ffd75a', '#e0a10d') + '</defs>' +
        '<path d="M86 176l-6 10M86 176l0 12M86 176l6 10M114 176l-6 10M114 176l0 12M114 176l6 10" stroke="#e8b223" stroke-width="3.5" stroke-linecap="round"/><path d="M80 186l-2 2M86 188v2M92 186l2 2M108 186l-2 2M114 188v2M120 186l2 2" stroke="#222" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M86 168l14 20l14 -20z" fill="#f2efe8"/><ellipse cx="100" cy="148" rx="38" ry="32" fill="url(#pa-egb)"/>' + f +
        '<path d="M64 122q-34 ' + (6 + wd) + ' -38 ' + (44 + wd) + 'q10 0 16 -6q4 6 10 2q4 4 12 -4q8 -12 12 -30z" fill="#4a2c12" stroke="#2c1a09"/><path d="M136 122q34 ' + (6 + wd) + ' 38 ' + (44 + wd) + 'q-10 0 -16 -6q-4 6 -10 2q-4 4 -12 -4q-8 -12 -12 -30z" fill="#4a2c12" stroke="#2c1a09"/>' +
        '<path d="M68 112q32 22 64 0q-4 18 -32 22q-28 -4 -32 -22z" fill="#efebe3"/>' +
        '<path d="M100 54q32 0 34 30q2 18 -10 30q-10 8 -24 8q-14 0 -24 -8q-12 -12 -10 -30q2 -30 34 -30z" fill="url(#pa-egh)"/>' + fur(100, 86, 28, 26, 40, '#b9b4aa', 0.35, 61, 4) +
        eye(83, 88, 11, 8, st, '#f0c419', '#efebe3', -1) + eye(117, 88, 11, 8, st, '#f0c419', '#efebe3', 1) +
        (st !== 'dead' ? '<path d="M72 82q10 -4 20 0M128 82q-10 -4 -20 0" stroke="#d8d2c6" stroke-width="3" fill="none" stroke-linecap="round"/>' : '') +
        '<path d="M90 96q10 -4 20 0q2 10 -4 18q-3 8 -6 12q-3 -4 -6 -12q-6 -8 -4 -18z" fill="url(#pa-egk)" stroke="#b07a08" stroke-width="1"/><path d="M90 96q10 -4 20 0q0 4 -2 6q-8 -3 -16 0q-2 -2 -2 -6z" fill="#ffe27a"/><path d="M95 101q1 2 3 1M105 101q-1 2 -3 1" stroke="#7a5306" stroke-width="1.2" fill="none"/><path d="M100 108v14" stroke="#b07a08" stroke-width=".9" opacity=".7"/>';
    }
  };
})();
