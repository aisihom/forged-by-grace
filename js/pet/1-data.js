/* Forged by Grace v2.5 — Sweatpoints + Bible-animal pet. Part 1: i18n, animals, verses, art. */
(function () {
  'use strict';
  var App = window.App, S = App.S;
  var NL = {
    'My Pet': 'Mijn dier', 'Sweatpoints': 'Sweatpoints', 'Rewards coming soon': 'Beloningen komen binnenkort',
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

  // ---- Art: 200x200, head centre (100,90), head top y≈48 ----
  function eyes(st, dark) {
    if (st === 'dead') return '<path d="M78 90q6 5 12 0M110 90q6 5 12 0" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>';
    var e = dark ? '<circle cx="84" cy="90" r="8" fill="#fff"/><circle cx="116" cy="90" r="8" fill="#fff"/>' : '';
    e += '<circle cx="84" cy="91" r="5.5" fill="#1d1712"/><circle cx="116" cy="91" r="5.5" fill="#1d1712"/><circle cx="86" cy="89" r="1.8" fill="#fff"/><circle cx="118" cy="89" r="1.8" fill="#fff"/>';
    if (st === 'sad') e += '<path d="M76 80l12 4M124 80l-12 4" stroke="#1d1712" stroke-width="2.5" stroke-linecap="round"/>';
    return e;
  }
  function mouth(st, y, c) {
    c = c || '#5a2e22';
    if (st === 'happy') return '<path d="M92 ' + y + 'q8 8 16 0" stroke="' + c + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
    if (st === 'sad' || st === 'dead') return '<path d="M92 ' + (y + 5) + 'q8 -6 16 0" stroke="' + c + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
    return '<path d="M93 ' + (y + 3) + 'h14" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/>';
  }
  var blush = '<ellipse cx="72" cy="104" rx="7" ry="4" fill="#ff9aa8" opacity=".55"/><ellipse cx="128" cy="104" rx="7" ry="4" fill="#ff9aa8" opacity=".55"/>';
  function wool(cx, cy, pts, fill, stroke) { return pts.map(function (p) { return '<circle cx="' + (cx + p[0]) + '" cy="' + (cy + p[1]) + '" r="' + p[2] + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2"/>'; }).join(''); }
  P.wool = wool;
  P.ART = {
    sheep: function (st) {
      return '<rect x="78" y="164" width="11" height="22" rx="5" fill="#3b302a"/><rect x="111" y="164" width="11" height="22" rx="5" fill="#3b302a"/>' +
        wool(100, 150, [[-32, 0, 22], [0, -10, 28], [32, 0, 22], [-16, 14, 20], [16, 14, 20], [0, 8, 24]], '#f8f4ea', '#e3d9c4') +
        '<ellipse cx="56" cy="86" rx="15" ry="8" fill="#3b302a" transform="rotate(-20 56 86)"/><ellipse cx="144" cy="86" rx="15" ry="8" fill="#3b302a" transform="rotate(20 144 86)"/>' +
        '<ellipse cx="100" cy="94" rx="33" ry="37" fill="#3b302a"/>' + wool(100, 56, [[-20, 2, 14], [0, -4, 17], [20, 2, 14]], '#f8f4ea', '#e3d9c4') + eyes(st, true) + mouth(st, 110, '#d8c7b8');
    },
    lamb: function (st) {
      return '<rect x="80" y="166" width="10" height="20" rx="5" fill="#e9d4b8"/><rect x="110" y="166" width="10" height="20" rx="5" fill="#e9d4b8"/>' +
        wool(100, 152, [[-26, 0, 20], [0, -8, 25], [26, 0, 20], [-12, 12, 18], [12, 12, 18]], '#fffdf7', '#efe6d4') +
        '<ellipse cx="58" cy="90" rx="15" ry="8" fill="#f3dcc0" transform="rotate(-25 58 90)"/><ellipse cx="58" cy="90" rx="9" ry="4" fill="#ffb8c2" transform="rotate(-25 58 90)"/><ellipse cx="142" cy="90" rx="15" ry="8" fill="#f3dcc0" transform="rotate(25 142 90)"/><ellipse cx="142" cy="90" rx="9" ry="4" fill="#ffb8c2" transform="rotate(25 142 90)"/>' +
        '<ellipse cx="100" cy="94" rx="32" ry="35" fill="#f6e4ca"/>' + wool(100, 58, [[-16, 2, 12], [0, -4, 15], [16, 2, 12]], '#fffdf7', '#efe6d4') + eyes(st) + blush + mouth(st, 110);
    },
    dove: function (st) {
      return '<path d="M88 176l-4 10M88 176l3 10M112 176l-3 10M112 176l4 10" stroke="#f08a3c" stroke-width="3.5" stroke-linecap="round"/>' +
        '<path d="M100 172l-26 16h52z" fill="#e8edf5"/><ellipse cx="100" cy="148" rx="40" ry="32" fill="#fbfdff" stroke="#dfe6f0" stroke-width="2"/>' +
        '<path d="M62 132q-26 10 -22 38q22 -4 30 -22z" fill="#eef3fa" stroke="#d5deea" stroke-width="2"/><path d="M138 132q26 10 22 38q-22 -4 -30 -22z" fill="#eef3fa" stroke="#d5deea" stroke-width="2"/>' +
        '<circle cx="100" cy="90" r="38" fill="#fbfdff" stroke="#dfe6f0" stroke-width="2"/>' + eyes(st) + blush + '<path d="M94 102l6 9l6-9z" fill="#f08a3c"/>';
    },
    lion: function (st) {
      var m = ''; for (var i = 0; i < 14; i++) { var a = i / 14 * Math.PI * 2; m += '<circle cx="' + (100 + Math.cos(a) * 46).toFixed(1) + '" cy="' + (90 + Math.sin(a) * 46).toFixed(1) + '" r="17" fill="' + (i % 2 ? '#b4621f' : '#c9772b') + '"/>'; }
      return '<path d="M136 168q30 4 28 -26" stroke="#e3a947" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="164" cy="140" r="8" fill="#b4621f"/>' +
        '<rect x="78" y="164" width="13" height="22" rx="6" fill="#e3a947"/><rect x="109" y="164" width="13" height="22" rx="6" fill="#e3a947"/><ellipse cx="100" cy="150" rx="38" ry="30" fill="#eab650"/><ellipse cx="100" cy="158" rx="22" ry="18" fill="#f6d898"/>' +
        m + '<circle cx="70" cy="56" r="10" fill="#eab650"/><circle cx="130" cy="56" r="10" fill="#eab650"/><circle cx="100" cy="92" r="38" fill="#eab650"/>' + eyes(st) +
        '<ellipse cx="100" cy="108" rx="18" ry="13" fill="#f9e3b0"/><path d="M94 100h12l-6 7z" fill="#5a2e22"/>' + mouth(st, 112) + blush;
    },
    donkey: function (st) {
      return '<rect x="78" y="164" width="12" height="22" rx="5" fill="#8b8b92"/><rect x="110" y="164" width="12" height="22" rx="5" fill="#8b8b92"/><ellipse cx="100" cy="150" rx="38" ry="30" fill="#a3a3aa"/><ellipse cx="100" cy="158" rx="22" ry="16" fill="#e7e3dc"/>' +
        '<ellipse cx="76" cy="40" rx="11" ry="30" fill="#a3a3aa" transform="rotate(-18 76 40)"/><ellipse cx="76" cy="40" rx="5" ry="22" fill="#f1b8bf" transform="rotate(-18 76 40)"/><ellipse cx="124" cy="40" rx="11" ry="30" fill="#a3a3aa" transform="rotate(18 124 40)"/><ellipse cx="124" cy="40" rx="5" ry="22" fill="#f1b8bf" transform="rotate(18 124 40)"/>' +
        '<ellipse cx="100" cy="90" rx="33" ry="40" fill="#a3a3aa"/><path d="M92 52q8 -10 16 0q-8 6 -16 0z" fill="#4a4a50"/>' + eyes(st) + '<ellipse cx="100" cy="114" rx="24" ry="16" fill="#e7e3dc"/><circle cx="92" cy="112" r="2.6" fill="#555"/><circle cx="108" cy="112" r="2.6" fill="#555"/>' + mouth(st, 119);
    },
    ox: function (st) {
      return '<rect x="76" y="164" width="14" height="22" rx="5" fill="#6d4321"/><rect x="110" y="164" width="14" height="22" rx="5" fill="#6d4321"/><ellipse cx="100" cy="150" rx="42" ry="31" fill="#8b5a2b"/><ellipse cx="100" cy="158" rx="22" ry="16" fill="#c99b6b"/>' +
        '<path d="M66 66q-24 -6 -26 -30q12 18 32 18z" fill="#f2e6cc" stroke="#d8c8a6" stroke-width="2"/><path d="M134 66q24 -6 26 -30q-12 18 -32 18z" fill="#f2e6cc" stroke="#d8c8a6" stroke-width="2"/>' +
        '<ellipse cx="56" cy="84" rx="14" ry="7" fill="#7a4c24" transform="rotate(-15 56 84)"/><ellipse cx="144" cy="84" rx="14" ry="7" fill="#7a4c24" transform="rotate(15 144 84)"/>' +
        '<ellipse cx="100" cy="90" rx="36" ry="38" fill="#8b5a2b"/><path d="M90 56q10 8 20 0q-2 10 -10 12q-8 -2 -10 -12z" fill="#fff6e6"/>' + eyes(st) + '<ellipse cx="100" cy="114" rx="26" ry="15" fill="#e9b9a2"/><ellipse cx="91" cy="113" rx="3.5" ry="2.6" fill="#7a4038"/><ellipse cx="109" cy="113" rx="3.5" ry="2.6" fill="#7a4038"/>' + mouth(st, 120, '#7a4038');
    },
    eagle: function (st) {
      return '<path d="M88 176l-5 10M88 176l1 11M88 176l6 9M112 176l-6 9M112 176l-1 11M112 176l5 10" stroke="#f0b429" stroke-width="3.5" stroke-linecap="round"/>' +
        '<path d="M100 172l-20 16h40z" fill="#f4f1ea"/><ellipse cx="100" cy="148" rx="38" ry="32" fill="#6b4423"/><ellipse cx="100" cy="154" rx="20" ry="18" fill="#8a5a30"/>' +
        '<path d="M64 124q-34 4 -38 40q24 2 42 -18z" fill="#583619"/><path d="M136 124q34 4 38 40q-24 2 -42 -18z" fill="#583619"/>' +
        '<circle cx="100" cy="88" r="38" fill="#fbfaf6" stroke="#e5e0d4" stroke-width="2"/>' + eyes(st) + (st !== 'dead' ? '<path d="M74 80l18 5M126 80l-18 5" stroke="#6b4423" stroke-width="3" stroke-linecap="round"/>' : '') +
        '<path d="M90 100q10 -6 20 0q0 12 -10 18q-4 -6 -10 -8z" fill="#f0b429" stroke="#c98a12" stroke-width="1.5"/>';
    }
  };
})();
