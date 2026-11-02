/* Forged by Grace — shared helpers: storage, formatting, intake file format, coaching brief. */
(function (root) {
  'use strict';

  var PREFIX = 'fbg.';
  var memory = {};

  var store = {
    get: function (key, fallback) {
      try {
        var raw = root.localStorage.getItem(PREFIX + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) {
        return key in memory ? memory[key] : fallback;
      }
    },
    set: function (key, value) {
      memory[key] = value;
      try { root.localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    remove: function (key) {
      delete memory[key];
      try { root.localStorage.removeItem(PREFIX + key); } catch (e) { /* ignore */ }
    }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDate(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseISO(s) { var p = String(s).slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtDate(s, opts) {
    try { return new Date(s).toLocaleDateString(undefined, opts || { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return String(s).slice(0, 10); }
  }
  function fmtDay(iso) { return parseISO(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  function copyText(text) {
    if (navigator.clipboard && root.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  function b64urlEncode(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function slug(s) {
    return String(s || 'client').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client';
  }

  // ---------- Coach contact details ----------
  // Priority: link parameter (?c=...) → this device's settings → config.js
  function getCoach() {
    var cfg = root.FBG_CONFIG || {};
    var settings = store.get('settings', {}) || {};
    var coach = {
      name: settings.coachName || cfg.coachName || 'Aarón Ricardo',
      email: settings.coachEmail || cfg.coachEmail || '',
      whatsapp: settings.coachWhatsApp || cfg.coachWhatsApp || ''
    };
    try {
      var c = new URLSearchParams(root.location.search).get('c');
      if (c) {
        var fromLink = JSON.parse(b64urlDecode(c));
        if (fromLink.n) coach.name = String(fromLink.n).slice(0, 80);
        if (fromLink.e) coach.email = String(fromLink.e).slice(0, 120);
        if (fromLink.w) coach.whatsapp = String(fromLink.w).replace(/\D/g, '').slice(0, 20);
      }
    } catch (e) { /* bad link parameter: ignore */ }
    return coach;
  }

  function coachLinkParam(coach) {
    var o = {};
    if (coach.name) o.n = coach.name;
    if (coach.email) o.e = coach.email;
    if (coach.whatsapp) o.w = String(coach.whatsapp).replace(/\D/g, '');
    return b64urlEncode(JSON.stringify(o));
  }

  // ---------- Intake file format ----------
  var DATA_START = '----- FBG DATA (do not edit) -----';
  var DATA_END = '----- END FBG DATA -----';

  function buildPayload(answers, lang, id) {
    return { app: 'fbg', type: 'intake', v: 1, id: id || uid(), submittedAt: new Date().toISOString(), lang: lang || 'en', answers: answers };
  }

  function optLabel(lang, key, code) {
    var I = root.FBG_INTAKE_I18N;
    var o = (I.O[lang] || I.O.en)[key] || {};
    return o[code] || (I.O.en[key] || {})[code] || code;
  }

  // Ordered list of [questionKey, answerText] for display
  function answerRows(payload, lang) {
    var I = root.FBG_INTAKE_I18N;
    lang = lang || payload.lang || 'en';
    var t = I.T[lang] || I.T.en;
    var a = payload.answers || {};
    function list(key, otherKey) {
      var arr = (a[key] || []).map(function (c) { return optLabel(lang, key, c); });
      if (otherKey && a[otherKey]) arr.push(a[otherKey]);
      return arr.join(', ');
    }
    function one(key) { return a[key] ? optLabel(lang, key, a[key]) : ''; }
    function scale(key) { return a[key] ? a[key] + '/10' : ''; }
    return [
      ['name', t.name, a.name || ''],
      ['email', t.email, a.email || ''],
      ['phone', t.phone, a.phone || ''],
      ['ageRange', t.ageRange, one('ageRange')],
      ['focus', t.focus, list('focus', 'focusOther')],
      ['change3m', t.change3m, a.change3m || ''],
      ['stress', t.stress, scale('stress')],
      ['motivation', t.motivation, scale('motivation')],
      ['sleepQuality', t.sleepQuality, scale('sleepQuality')],
      ['confidence', t.confidence, scale('confidence')],
      ['sleepHours', t.sleepHours, one('sleepHours')],
      ['obstacles', t.obstacles, list('obstacles', 'obstaclesOther')],
      ['whenHard', t.whenHard, a.whenHard || ''],
      ['pastExp', t.pastExp, one('pastExp') + (a.pastWhat ? ' — ' + a.pastWhat : '')],
      ['wants', t.wants, list('wants', 'wantsOther')],
      ['format', t.format, list('format')],
      ['availability', t.availability, list('availability')],
      ['proSupport', t.proSupport, one('proSupport')],
      ['extra', t.extra, a.extra || '']
    ];
  }

  function summaryText(payload, opts) {
    opts = opts || {};
    var I = root.FBG_INTAKE_I18N;
    var lang = payload.lang || 'en';
    var t = I.T[lang] || I.T.en;
    var lines = [t.sumTitle, (payload.answers.name || ''), t.sumSubmitted + ': ' + fmtDate(payload.submittedAt, { dateStyle: 'medium', timeStyle: 'short' }), ''];
    answerRows(payload, lang).forEach(function (r) {
      if (r[0] === 'name') return;
      lines.push('• ' + r[1]);
      lines.push('  ' + (r[2] || t.notAnswered));
    });
    if (opts.withData !== false) {
      lines.push('', t.dataNote, DATA_START, JSON.stringify(payload), DATA_END);
    }
    return lines.join('\n');
  }

  function validatePayload(p) {
    if (!p || typeof p !== 'object') throw new Error('Not a Forged by Grace intake.');
    if (p.type !== 'intake' || !p.answers || typeof p.answers !== 'object') throw new Error('This file is not a Forged by Grace client intake.');
    if (!p.answers.name) throw new Error('The intake has no client name.');
    if (!p.id) p.id = uid();
    if (!p.submittedAt) p.submittedAt = new Date().toISOString();
    return p;
  }

  // Accepts: raw JSON, the downloaded .txt, or a pasted email (even quoted with "> ")
  function parseIntake(text) {
    text = String(text || '').replace(/^\uFEFF/, '').trim();
    if (!text) throw new Error('Nothing to import — paste the message or choose a file.');
    var candidates = [];
    var s = text.indexOf(DATA_START), e = text.indexOf(DATA_END);
    if (s !== -1) {
      var block = text.slice(s + DATA_START.length, e > s ? e : undefined);
      block = block.split(/\r?\n/).map(function (l) { return l.replace(/^\s*(>\s*)+/, ''); }).join('\n').trim();
      candidates.push(block, block.replace(/\r?\n/g, ' '), block.replace(/\r?\n/g, ''));
    }
    candidates.push(text);
    var first = text.indexOf('{'), last = text.lastIndexOf('}');
    if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));
    var lastErr = null;
    for (var i = 0; i < candidates.length; i++) {
      try {
        var obj = JSON.parse(candidates[i]);
        if (Array.isArray(obj)) obj = obj[0];
        return validatePayload(obj);
      } catch (err) { lastErr = err; }
    }
    if (lastErr && /Forged by Grace|client/.test(lastErr.message)) throw lastErr;
    throw new Error("Couldn't find client answers in that text. Paste the whole email or choose the downloaded file.");
  }

  // ---------- Rule-based mental coaching brief ----------
  var THEMES = {
    selfbelief: {
      label: 'Self-belief & inner voice',
      focus: { title: 'Build evidence-based confidence', actions: [
        "Start a daily 'evidence log': 3 things done well, however small.",
        'Catch & reframe: write down the harshest self-talk, then what a good coach would say instead.',
        "Set process goals they fully control (e.g. 'show up 3× this week') so wins stack up fast."] },
      question: 'When did you last feel really confident? What was different then?'
    },
    stress: {
      label: 'Stress & nerves',
      focus: { title: 'Calm the system & handle pressure', actions: [
        'Teach a 2-minute downshift (physiological sigh or 4-4-4-4 box breathing) before training, big moments or sleep.',
        "Use a 10-minute daily 'worry window' to park overthinking outside of it.",
        "Sort stressors into can control / can influence / can't control — act on the first two."] },
      question: 'What are the 2–3 biggest sources of pressure for you right now?'
    },
    consistency: {
      label: 'Consistency & follow-through',
      focus: { title: 'Make consistency easy', actions: [
        'Agree a minimum version of each habit for bad days (e.g. a 10-minute workout) — never zero.',
        "Use if-then plans: 'If it's Monday 07:00, then I put my training clothes on.'",
        'Weekly 10-minute check-in: what worked, what did not, one small tweak.'] },
      question: "What does a 'bad day' usually look like — and what happens right before it?"
    },
    perfectionism: {
      label: 'Perfectionism & pressure to perform',
      focus: { title: 'Swap perfect for progress', actions: [
        "Define 'good enough' for each goal before starting.",
        'Praise effort and process daily; review outcomes only once a week.',
        "Practise a deliberate 'B-grade' session to lower the stakes."] },
      question: "What would 'good enough' look like for you this month?"
    },
    energy: {
      label: 'Energy, sleep & recovery',
      focus: { title: 'Restore energy & sleep', actions: [
        'Same wake-up time 7 days a week plus a 30-minute screen-free wind-down.',
        'Caffeine cut-off about 8 hours before bed; 10 minutes of daylight in the morning.',
        'Match training to sleep: after a short night, train lighter — not harder.'] },
      question: 'Walk me through your evening and the last hour before bed.'
    },
    performance: {
      label: 'Performance mindset & focus',
      focus: { title: 'Sharpen the performance mindset', actions: [
        'Build a short pre-performance routine: breath, cue word, first action.',
        'Five minutes of visualisation of key moments — including handling a mistake.',
        "Pick 1–2 cue words to reset after an error ('next play')."] },
      question: 'What goes through your head in the moment right before you perform?'
    },
    body: {
      label: 'Food & body relationship',
      focus: { title: 'A calmer relationship with food & body', actions: [
        'Track non-scale progress (energy, strength, mood) alongside any body goal.',
        'Notice the trigger → feeling → eating pattern without judgement; keep a short log.',
        "Avoid strict rules and 'good/bad food' talk; bring in a dietitian if needed."] },
      question: 'How do you feel about your body on a good day versus a bad day?'
    },
    comeback: {
      label: 'Setbacks & comebacks',
      focus: { title: 'Rebuild after a setback', actions: [
        'Separate what happened from what it says about them as a person.',
        'Set small, graded milestones back to full training and celebrate each one.',
        "Talk through fear of re-injury; build up gradually with their physio's guidance."] },
      question: 'What worries you most about coming back?'
    },
    balance: {
      label: 'Life balance',
      focus: { title: 'Design a sustainable week', actions: [
        'Map a real week (work, sleep, training, social) and find the fixed anchors.',
        'Choose 2–3 non-negotiables; let everything else flex.',
        'Schedule recovery and social time like training sessions.'] },
      question: 'If your week had one extra hour, where would it go?'
    }
  };

  var CRISIS_WORDS = ['suicid', 'suïcid', 'kill myself', 'end my life', 'end it all', 'want to die', 'self-harm', 'self harm', 'selfharm', 'hurt myself', 'harm myself', 'zelfmoord', 'mezelf iets aan', 'dood willen', 'niet meer leven', 'quitarme la vida', 'hacerme daño', 'autolesi', 'no quiero vivir', 'quiero morir'];
  var ED_WORDS = ['eating disorder', 'anorex', 'bulimi', 'binge', 'purg', 'eetstoornis', 'eetbui', 'trastorno alimentario', 'atracón', 'atracon', 'vomit'];
  var MH_WORDS = ['depress', 'depresi', 'panic', 'paniek', 'pánico', 'panico', 'anxiety disorder', 'angststoornis', 'burn-out', 'burnout', 'trauma'];

  function hasAny(text, words) {
    text = text.toLowerCase();
    return words.some(function (w) { return text.indexOf(w) !== -1; });
  }

  function brief(payload) {
    var a = payload.answers || {};
    var focus = a.focus || [], obs = a.obstacles || [], wants = a.wants || [];
    var stress = +a.stress || 0, mot = +a.motivation || 0, sq = +a.sleepQuality || 0, conf = +a.confidence || 0;
    var score = {};
    Object.keys(THEMES).forEach(function (k) { score[k] = 0; });
    function add(k, n) { score[k] += n; }
    function f(code) { return focus.indexOf(code) !== -1; }
    function o(code) { return obs.indexOf(code) !== -1; }

    if (f('confidence')) add('selfbelief', 3);
    if (o('selfdoubt')) add('selfbelief', 2);
    if (o('selftalk')) add('selfbelief', 2);
    if (o('fearfail')) { add('selfbelief', 1); add('perfectionism', 1.5); }
    if (conf && conf <= 4) add('selfbelief', 2); else if (conf && conf <= 6) add('selfbelief', 1);

    if (f('stress')) add('stress', 3);
    if (o('overthinking')) { add('stress', 2); add('performance', 0.5); }
    if (o('pressure')) { add('stress', 1); add('perfectionism', 1.5); }
    if (stress >= 8) add('stress', 3); else if (stress >= 6) add('stress', 1.5);
    if (wants.indexOf('tools') !== -1) add('stress', 1);

    if (f('motivation')) add('consistency', 3);
    if (f('habits')) add('consistency', 2);
    if (o('procrastination')) add('consistency', 2);
    if (o('allornothing')) { add('consistency', 1.5); add('perfectionism', 1); }
    if (o('structure')) { add('consistency', 1); add('balance', 1.5); }
    if (o('distraction')) { add('consistency', 1); add('performance', 1); }
    if (mot && mot <= 4) add('consistency', 2);
    if (wants.indexOf('accountability') !== -1 || wants.indexOf('habits') !== -1 || wants.indexOf('plan') !== -1) add('consistency', 1);

    if (o('perfectionism')) add('perfectionism', 3);

    if (o('energy')) add('energy', 2);
    if (a.sleepHours === 'lt5') add('energy', 3); else if (a.sleepHours === '5-6') add('energy', 2);
    if (sq && sq <= 4) add('energy', 2);

    if (f('performance')) add('performance', 3);
    if (f('focus')) add('performance', 2.5);
    if (wants.indexOf('mindset') !== -1) add('performance', 1);

    if (f('body')) add('body', 3);
    if (o('emoeating')) add('body', 2.5);

    if (f('comeback')) add('comeback', 4);
    if (f('balance')) add('balance', 3);

    var ranked = Object.keys(score).filter(function (k) { return score[k] > 0; }).sort(function (x, y) { return score[y] - score[x]; });
    if (ranked.length < 3) {
      ['consistency', 'selfbelief', 'stress', 'energy'].forEach(function (k) { if (ranked.length < 3 && ranked.indexOf(k) === -1) ranked.push(k); });
    }
    var top = ranked.slice(0, 3);

    // Flags — careful, supportive wording
    var flags = [];
    var freeText = [a.change3m, a.focusOther, a.obstaclesOther, a.whenHard, a.pastWhat, a.wantsOther, a.extra].filter(Boolean).join(' \n ');
    if (freeText && hasAny(freeText, CRISIS_WORDS)) {
      flags.push({ level: 'high', text: 'Their written answers mention self-harm or not wanting to live. Contact them personally and promptly, take it seriously, and point them to 112 (emergency), 113 / 0800-0113 (NL) or 024 (ES). Do not handle this alone — this needs professional help.' });
    }
    if (stress >= 9) flags.push({ level: 'high', text: 'Very high stress (' + stress + '/10). Ask how it affects daily life and what support they have. If it is ongoing or overwhelming, encourage them to talk to their GP (huisarts) or a psychologist.' });
    else if (stress >= 7) flags.push({ level: 'watch', text: 'Elevated stress (' + stress + '/10). Keep early goals light and check in on workload.' });
    if (a.sleepHours === 'lt5') flags.push({ level: 'high', text: 'Very little sleep (under 5 hours). Make sleep an early topic; if it has been like this for weeks, suggest they see their GP.' });
    else if (a.sleepHours === '5-6' || (sq && sq <= 3)) flags.push({ level: 'watch', text: 'Short or poor sleep. It affects mood, motivation and fat loss — avoid stacking hard goals on top.' });
    if (mot && conf && mot <= 3 && conf <= 3 && (stress >= 7 || (sq && sq <= 3))) {
      flags.push({ level: 'high', text: 'Low motivation, low confidence and high stress / poor sleep together. Gently ask about overall mood. If you notice signs of depression or hopelessness, refer to a GP or psychologist — that is beyond coaching.' });
    }
    if (f('body') || o('emoeating') || (freeText && hasAny(freeText, ED_WORDS))) {
      flags.push({ level: 'watch', text: 'Food or body-image topics came up. Avoid weight-focused language and strict diet rules; if you notice signs of disordered eating, refer to a GP, dietitian or psychologist.' });
    }
    if (freeText && hasAny(freeText, MH_WORDS)) flags.push({ level: 'watch', text: 'They mention a mental-health topic (e.g. anxiety, depression, burnout or trauma). Ask with care whether they have professional support and stay within coaching scope.' });
    if (a.proSupport === 'yes') flags.push({ level: 'info', text: 'Currently in professional support. Coaching should complement it — with their permission, align with their professional.' });
    if (a.ageRange === 'u18') flags.push({ level: 'watch', text: 'Under 18: get parent/guardian consent and involve them where appropriate.' });

    var strengths = [];
    if (mot >= 8) strengths.push('Highly motivated (' + mot + '/10) — channel it into a clear, simple plan.');
    if (conf >= 7) strengths.push('Good self-confidence (' + conf + '/10) to build on.');
    if ((a.sleepHours === '7-8' || a.sleepHours === 'gt8') && sq >= 7) strengths.push('Sleep is a strength — protect it.');
    if (stress && stress <= 3) strengths.push('Low stress right now — good capacity for new habits.');
    if (a.pastExp === 'lots') strengths.push('Experienced with coaching — ask what worked before and build on it.');
    if (a.change3m && a.change3m.length > 40) strengths.push('Clear picture of what they want to change.');

    var first = String(a.name || '').trim().split(/\s+/)[0] || '';
    var questions = ['What made you decide to start now?'].concat(top.map(function (k) { return THEMES[k].question; })).concat(['What would make our first month a success for you?']);

    var level = flags.some(function (x) { return x.level === 'high'; }) ? 'high' : (flags.some(function (x) { return x.level === 'watch'; }) ? 'watch' : 'ok');

    return {
      first: first,
      themes: top.map(function (k) { return { key: k, label: THEMES[k].label, score: score[k] }; }),
      allThemes: ranked.map(function (k) { return THEMES[k].label; }),
      focusAreas: top.map(function (k) { return THEMES[k].focus; }),
      flags: flags,
      strengths: strengths,
      questions: questions,
      level: level,
      scores: { stress: stress, motivation: mot, sleepQuality: sq, confidence: conf }
    };
  }

  function replyDraft(payload, coachName) {
    var a = payload.answers || {};
    var lang = payload.lang || 'en';
    var first = String(a.name || '').trim().split(/\s+/)[0] || '';
    var topic = (a.focus && a.focus[0]) ? optLabel(lang, 'focus', a.focus[0]).toLowerCase() : '';
    var coachFirst = String(coachName || '').split(/\s+/)[0];
    if (lang === 'es') {
      return 'Hola ' + first + ', gracias por rellenar el cuestionario. Ya he leído tus respuestas con calma.' + (topic ? ' Me gustaría que empezáramos por: ' + topic + '.' : '') + ' ¿Cuándo te viene bien una primera conversación de 30 minutos esta semana?\n\nUn abrazo,\n' + coachFirst;
    }
    if (lang === 'nl') {
      return 'Hoi ' + first + ', bedankt voor het invullen van de intake. Ik heb je antwoorden rustig doorgelezen.' + (topic ? ' Ik wil graag beginnen met: ' + topic + '.' : '') + ' Wanneer past een eerste gesprek van 30 minuten jou deze week?\n\nGroet,\n' + coachFirst;
    }
    return 'Hi ' + first + ', thanks for filling in the intake — I have read your answers properly.' + (topic ? " I'd like us to start with: " + topic + '.' : '') + ' When would a first 30-minute conversation suit you this week?\n\nSpeak soon,\n' + coachFirst;
  }

  root.FBG = {
    store: store, esc: esc, uid: uid, isoDate: isoDate, parseISO: parseISO, fmtDate: fmtDate, fmtDay: fmtDay,
    download: download, copyText: copyText, slug: slug, b64urlEncode: b64urlEncode, b64urlDecode: b64urlDecode,
    getCoach: getCoach, coachLinkParam: coachLinkParam,
    buildPayload: buildPayload, summaryText: summaryText, answerRows: answerRows, parseIntake: parseIntake, optLabel: optLabel,
    brief: brief, replyDraft: replyDraft, THEMES: THEMES
  };
})(typeof window !== 'undefined' ? window : this);
