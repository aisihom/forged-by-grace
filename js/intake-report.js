/* Forged by Grace — coach-friendly intake report (Dutch), plain text + HTML */
(function (root) {
  var F = root.FBG;
  var NA = '— niet ingevuld';
  function L(key, code) { return code ? F.optLabel('nl', key, code) : ''; }
  function list(a, key, other) {
    var arr = (a[key] || []).map(function (c) { return L(key, c); });
    if (other && a[other]) arr.push(a[other]);
    return arr;
  }
  function val(v) { return (Array.isArray(v) ? v.join(', ') : v) || NA; }
  function scoreEmoji(key, n) {
    if (!n) return '⚪';
    var good = key === 'stress' ? n <= 4 : n >= 7;
    var bad = key === 'stress' ? n >= 7 : n <= 4;
    return good ? '🟢' : (bad ? '🔴' : '🟡');
  }
  function bar(n) { n = +n || 0; return '■'.repeat(n) + '□'.repeat(10 - n); }
  function model(p) {
    var a = p.answers || {};
    var flags = [];
    var st = +a.stress || 0;
    if (st >= 7) flags.push('Stress hoog (' + st + '/10)');
    if (a.sleepHours === 'lt5' || a.sleepHours === '5-6') flags.push('Slaapt minder dan 6 uur');
    if (a.sleepQuality && +a.sleepQuality <= 4) flags.push('Slechte slaapkwaliteit (' + a.sleepQuality + '/10)');
    if (a.motivation && +a.motivation <= 4) flags.push('Lage motivatie (' + a.motivation + '/10)');
    if (a.confidence && +a.confidence <= 4) flags.push('Laag zelfvertrouwen (' + a.confidence + '/10)');
    if (a.proSupport === 'yes') flags.push('Krijgt al professionele hulp');
    var past = L('pastExp', a.pastExp);
    if (a.pastWhat) past = (past ? past + ' — ' : '') + a.pastWhat;
    return {
      a: a, flags: flags, brief: F.brief(p),
      date: F.fmtDate(p.submittedAt, { dateStyle: 'long', timeStyle: 'short' }),
      scores: [['stress', 'Stress'], ['motivation', 'Motivatie'], ['sleepQuality', 'Slaapkwaliteit'], ['confidence', 'Zelfvertrouwen']]
        .map(function (s) { return { key: s[0], label: s[1], n: +a[s[0]] || 0 }; }),
      sections: [
        ['🎯 Doelen', [['Wil hulp bij', list(a, 'focus', 'focusOther')], ['Over 3 maanden anders', a.change3m]]],
        ['🧱 Obstakels', [['Grootste obstakels', list(a, 'obstacles', 'obstaclesOther')], ['Als het moeilijk wordt', a.whenHard]]],
        ['🤝 Coaching-wensen', [['Wil van de coach', list(a, 'wants', 'wantsOther')], ['Eerdere ervaring', past]]],
        ['📅 Praktisch', [['Contact via', list(a, 'format')], ['Beschikbaar', list(a, 'availability')]]],
        ['🩺 Gezondheid / support', [['Professionele hulp nu', L('proSupport', a.proSupport)], ['Verder nog', a.extra]]]
      ]
    };
  }
  function text(p) {
    var m = model(p), a = m.a, out = [], SEP = '━━━━━━━━━━━━━━━━━━';
    out.push('FORGED BY GRACE · INTAKE', (a.name || ''), SEP);
    out.push('👤 ' + val(a.name), '✉️ ' + val(a.email), '📱 ' + val(a.phone), '🎂 Leeftijd: ' + val(L('ageRange', a.ageRange)), '🗓️ ' + m.date, '');
    out.push(m.flags.length ? '⚠️ Let op: ' + m.flags.join(' · ') : '✅ Geen aandachtspunten', '', SEP, '📊 SCORES');
    m.scores.forEach(function (s) { out.push(scoreEmoji(s.key, s.n) + ' ' + s.label + ': ' + (s.n ? s.n + '/10' : NA)); });
    out.push('😴 Slaap per nacht: ' + val(L('sleepHours', a.sleepHours)));
    m.sections.forEach(function (sec) {
      out.push('', SEP, sec[0].toUpperCase());
      sec[1].forEach(function (r) { out.push('▸ ' + r[0] + ':', '   ' + val(r[1])); });
    });
    var b = m.brief;
    out.push('', SEP, '🧠 MENTAL COACHING BRIEF');
    if (b.themes.length) out.push('Thema\'s: ' + b.themes.map(function (x) { return x.label; }).join(', '));
    if (b.focusAreas.length) { out.push('', 'Focus:'); b.focusAreas.forEach(function (x) { out.push('• ' + x.title); (x.actions || []).forEach(function (y) { out.push('   – ' + y); }); }); }
    if (b.strengths.length) { out.push('', 'Sterke punten:'); b.strengths.forEach(function (x) { out.push('• ' + x); }); }
    if (b.flags.length) { out.push('', 'Signalen:'); b.flags.forEach(function (x) { out.push('• ' + x.text); }); }
    out.push('', 'Vragen voor het eerste gesprek:'); b.questions.forEach(function (x) { out.push('• ' + x); });
    return out.join('\n');
  }
  function h(s) { return F.esc(String(s == null ? '' : s)); }
  function html(p) {
    var m = model(p), a = m.a, b = m.brief;
    var G = '#d4af37';
    function v(x) { var s = val(x); return s === NA ? '<span style="color:#777">' + NA + '</span>' : h(s); }
    function link(href, s) { return s ? '<a href="' + h(href) + '" style="color:' + G + '">' + h(s) + '</a>' : '<span style="color:#777">' + NA + '</span>'; }
    var phone = String(a.phone || '').replace(/[^\d+]/g, '');
    var card = 'background:#141414;border:1px solid #3a3220;border-radius:14px;padding:16px 18px;margin:0 0 14px';
    var hd = 'margin:0 0 10px;color:' + G + ';font-size:15px;letter-spacing:.5px';
    var o = '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Intake — ' + h(a.name) + '</title></head>' +
      '<body style="margin:0;background:#0a0a0a;color:#eee;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5">' +
      '<div style="max-width:620px;margin:0 auto;padding:20px 14px">' +
      '<div style="text-align:center;padding:8px 0 16px;border-bottom:2px solid ' + G + ';margin-bottom:16px"><div style="color:' + G + ';font-size:12px;letter-spacing:3px">FORGED BY GRACE</div><div style="font-size:22px;font-weight:700;margin-top:4px">Mental coaching intake</div></div>' +
      '<div style="' + card + ';border-color:' + G + '"><div style="font-size:20px;font-weight:700;color:#fff">' + v(a.name) + '</div>' +
      '<table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:14px">' +
      '<tr><td style="color:#999;padding:3px 0;width:110px">E-mail</td><td>' + link('mailto:' + (a.email || ''), a.email) + '</td></tr>' +
      '<tr><td style="color:#999;padding:3px 0">Telefoon</td><td>' + link('tel:' + phone, a.phone) + (phone ? ' · ' + link('https://wa.me/' + phone.replace('+', ''), 'WhatsApp') : '') + '</td></tr>' +
      '<tr><td style="color:#999;padding:3px 0">Leeftijd</td><td>' + v(L('ageRange', a.ageRange)) + '</td></tr>' +
      '<tr><td style="color:#999;padding:3px 0">Ingevuld</td><td>' + h(m.date) + '</td></tr></table>' +
      '<div style="margin-top:10px;padding:8px 10px;border-radius:8px;' + (m.flags.length ? 'background:#3a1414;color:#ffb3a8">⚠️ ' + h(m.flags.join(' · ')) : 'background:#14301c;color:#9fe0b0">✅ Geen aandachtspunten') + '</div></div>';
    o += '<div style="' + card + '"><h2 style="' + hd + '">📊 SCORES</h2>';
    m.scores.forEach(function (s) {
      var pct = s.n * 10, col = scoreEmoji(s.key, s.n) === '🟢' ? '#4caf50' : (scoreEmoji(s.key, s.n) === '🔴' ? '#e5533d' : G);
      o += '<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:14px"><span>' + s.label + '</span><b>' + (s.n ? s.n + '/10' : '<span style="color:#777">' + NA + '</span>') + '</b></div>' +
        '<div style="background:#2a2a2a;border-radius:6px;height:8px;overflow:hidden"><div style="width:' + pct + '%;height:8px;background:' + col + '"></div></div></div>';
    });
    o += '<div style="margin-top:8px;font-size:14px">😴 Slaap per nacht: <b>' + v(L('sleepHours', a.sleepHours)) + '</b></div></div>';
    m.sections.forEach(function (sec) {
      o += '<div style="' + card + '"><h2 style="' + hd + '">' + h(sec[0].toUpperCase()) + '</h2>';
      sec[1].forEach(function (r) { o += '<div style="margin:0 0 8px"><div style="color:#999;font-size:13px">' + h(r[0]) + '</div><div>' + v(r[1]) + '</div></div>'; });
      o += '</div>';
    });
    function ul(t, arr) { return arr.length ? '<div style="color:#999;font-size:13px;margin-top:8px">' + t + '</div><ul style="margin:4px 0 0;padding-left:20px">' + arr.map(function (x) { return '<li>' + h(x) + '</li>'; }).join('') + '</ul>' : ''; }
    o += '<div style="' + card + ';border-color:' + G + '"><h2 style="' + hd + '">🧠 MENTAL COACHING BRIEF</h2>' +
      (b.themes.length ? '<div>Thema\'s: <b>' + h(b.themes.map(function (x) { return x.label; }).join(', ')) + '</b></div>' : '') +
      ul('Focus', b.focusAreas.map(function (x) { return x.title + ((x.actions || []).length ? ': ' + x.actions.join(' · ') : ''); })) + ul('Sterke punten', b.strengths) + ul('Signalen', b.flags.map(function (x) { return x.text; })) + ul('Vragen voor het eerste gesprek', b.questions) + '</div>';
    o += '<p style="text-align:center;color:#666;font-size:12px">Forged by Grace · vertrouwelijk</p></div>' +
      '<script type="application/json" id="fbg-data">\n' + DATA(p).replace(/</g, '\\u003c') + '\n</script></body></html>';
    return o;
  }
  function DATA(p) { return F.summaryText(p).split('\n').slice(-3).join('\n'); }
  F.coachReportData = DATA;
  F.coachReportText = text;
  F.coachReportHTML = html;
  F.coachReportFile = function (p) { return 'intake-' + F.slug(p.answers.name) + '-' + F.isoDate(new Date(p.submittedAt)) + '.html'; };
})(window);
