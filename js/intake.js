/* Forged by Grace — client mental-coaching intake (works without any server). */
(function () {
  'use strict';
  var F = window.FBG, I = window.FBG_INTAKE_I18N, esc = F.esc;
  var main = document.getElementById('main');
  var coach = F.getCoach();
  var TOTAL = 6;

  var params = new URLSearchParams(location.search);
  var draft = F.store.get('intakeDraft', null) || {};
  var state = {
    lang: I.LANGS.indexOf(params.get('lang')) !== -1 ? params.get('lang') : (draft.lang || 'en'),
    step: draft.step || 0,
    answers: draft.answers || {},
    id: draft.id || F.uid(),
    submitted: F.store.get('intakeLast', null)
  };
  if (state.submitted && state.step !== 7 && !draft.editing) state.step = 7;
  if (state.step === 7 && !state.submitted) state.step = 0;

  function t(key, vars) {
    var s = (I.T[state.lang] || I.T.en)[key] || I.T.en[key] || key;
    vars = vars || {};
    vars.coach = vars.coach || coach.name;
    return s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ''; });
  }
  function opt(key, code) { return F.optLabel(state.lang, key, code); }
  function saveDraft() { F.store.set('intakeDraft', { lang: state.lang, step: state.step, answers: state.answers, id: state.id, editing: draft.editing }); }

  var ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.2A8.5 8.5 0 1 1 20 11.5z"/><path d="M9 9.5c.3 1.8 2.2 4 4.4 4.6l1.1-1.1 1.8.8c-.2 1-1 1.7-2 1.7-3.2 0-6.3-3-6.3-6.2 0-1 .7-1.8 1.7-2l.8 1.8z"/></svg>',
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
    mark: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10.6 3h2.8v5.6h5v2.8h-5V21h-2.8v-9.6h-5V8.6h5z" fill="#1a0b03"/></svg>'
  };

  // ---------- field renderers ----------
  function textField(key, type, required, phKey) {
    var v = state.answers[key] || '';
    return '<label class="field"><span class="label">' + esc(t(key)) + (required ? '' : '<span class="opt">' + esc(t('optional')) + '</span>') + '</span>' +
      '<input class="input" id="f-' + key + '" name="' + key + '" type="' + type + '" value="' + esc(v) + '" placeholder="' + esc(t(phKey || key + 'Ph')) + '"' +
      (type === 'email' ? ' autocomplete="email" inputmode="email"' : type === 'tel' ? ' autocomplete="tel" inputmode="tel"' : key === 'name' ? ' autocomplete="name"' : '') +
      (required ? ' required aria-required="true"' : '') + ' aria-describedby="err-' + key + '"><span class="err" id="err-' + key + '" role="alert"></span></label>';
  }
  function areaField(key, phKey, optional) {
    return '<label class="field"><span class="label">' + esc(t(key)) + (optional ? '<span class="opt">' + esc(t('optional')) + '</span>' : '') + '</span>' +
      '<textarea class="input" name="' + key + '" rows="3" maxlength="1500" placeholder="' + esc(phKey ? t(phKey) : '') + '">' + esc(state.answers[key] || '') + '</textarea></label>';
  }
  function chipsField(key, multi, hintKey, otherKey) {
    var cur = state.answers[key];
    var html = '<fieldset class="field" style="border:0;padding:0;margin:0 0 18px"><legend class="label">' + esc(t(key)) + '</legend>' +
      (hintKey ? '<p class="hint">' + esc(t(hintKey)) + '</p>' : '') + '<div class="chips">';
    I.OPTION_KEYS[key].forEach(function (code) {
      var on = multi ? (cur || []).indexOf(code) !== -1 : cur === code;
      html += '<label class="chip"><input type="' + (multi ? 'checkbox' : 'radio') + '" name="' + key + '" value="' + esc(code) + '"' + (on ? ' checked' : '') + '>' + esc(opt(key, code)) + '</label>';
    });
    html += '</div>';
    if (otherKey) html += '<input class="input" style="margin-top:10px" name="' + otherKey + '" value="' + esc(state.answers[otherKey] || '') + '" placeholder="' + esc(t(otherKey)) + '" aria-label="' + esc(t(otherKey)) + '" maxlength="300">';
    return html + '</fieldset>';
  }
  function rangeField(key) {
    var v = state.answers[key];
    var p = v ? ((v - 1) / 9 * 100) : 44;
    return '<div class="field"><div class="range-wrap"><div class="range-top"><label class="label" for="r-' + key + '" style="margin:0">' + esc(t(key)) + '</label>' +
      '<span class="range-val' + (v ? '' : ' unset') + '" id="rv-' + key + '">' + (v ? v : '–') + '</span></div>' +
      '<input type="range" id="r-' + key + '" name="' + key + '" min="1" max="10" step="1" value="' + (v || 5) + '" style="--p:' + p + '%" aria-valuetext="' + (v ? v + ' / 10' : 'not answered') + '">' +
      '<div class="range-ends"><span>1 · ' + esc(t(key + 'Lo')) + '</span><span>' + esc(t(key + 'Hi')) + ' · 10</span></div></div></div>';
  }

  function header() {
    var langs = I.LANGS.map(function (l) {
      return '<button type="button" data-lang="' + l + '" aria-pressed="' + (l === state.lang) + '" aria-label="' + esc(I.T[l].langName) + '">' + l.toUpperCase() + '</button>';
    }).join('');
    return '<header class="topbar"><div class="brand"><div class="brand-mark">' + ICON.mark + '</div><div><span class="brand-name">Forged by Grace</span><span class="brand-sub">' + esc(coach.name) + '</span></div></div>' +
      '<div class="lang-switch" role="group" aria-label="Language">' + langs + '</div></header>';
  }

  function stepShell(n, body) {
    return header() +
      '<p class="kicker">' + esc(t('stepOf', { n: n, total: TOTAL })) + '</p>' +
      '<h1 class="h1" tabindex="-1" id="step-title">' + esc(t('s' + n)) + '</h1>' +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + TOTAL + '" aria-valuenow="' + n + '"><div style="width:' + (n / TOTAL * 100) + '%"></div></div>' +
      '<form id="step-form" novalidate>' + body +
      '<div class="nav-btns"><button type="button" class="btn ghost" data-act="back">' + esc(t('back')) + '</button>' +
      '<button type="submit" class="btn primary grow">' + esc(n === TOTAL ? t('finish') : t('next')) + '</button></div></form>';
  }

  function render() {
    document.documentElement.lang = state.lang;
    var s = state.step, html;
    if (s === 0) {
      html = header() + '<section class="hero" style="margin-top:6px"><p class="kicker">' + esc(t('kicker')) + '</p><h1 class="h1">' + esc(t('introTitle')) + '</h1>' +
        '<p class="muted" style="position:relative;z-index:1">' + esc(t('introText')) + '</p><div class="row wrap" style="margin:14px 0 4px;position:relative;z-index:1"><span class="pill accent">' + esc(t('introMeta')) + '</span></div></section>' +
        '<p class="small muted" style="margin:16px 4px">🔒 ' + esc(t('introPrivacy')) + '</p>' +
        '<button class="btn primary lg block" data-act="start">' + esc(t('start')) + ' →</button>' +
        '<p class="crisis">' + esc(t('crisis')) + '</p>' +
        '<p class="footer-note">' + esc(t('footer')) + '</p>';
    } else if (s === 1) {
      html = stepShell(1, textField('name', 'text', true) + textField('email', 'email', false) + textField('phone', 'tel', false) +
        '<p class="hint" style="margin-top:-6px">' + esc(t('contactHint')) + '</p><span class="err" id="err-contact" role="alert"></span><div style="height:10px"></div>' +
        chipsField('ageRange', false) + '<p class="small" id="u18" style="color:#fcd57a;' + (state.answers.ageRange === 'u18' ? '' : 'display:none') + '">' + esc(t('u18note')) + '</p>');
    } else if (s === 2) {
      html = stepShell(2, chipsField('focus', true, 'pickAll', 'focusOther') + areaField('change3m', 'change3mPh'));
    } else if (s === 3) {
      html = stepShell(3, '<p class="hint" style="margin-bottom:14px">' + esc(t('scalesHint')) + '</p>' + rangeField('stress') + rangeField('motivation') + rangeField('sleepQuality') + rangeField('confidence') + chipsField('sleepHours', false));
    } else if (s === 4) {
      html = stepShell(4, chipsField('obstacles', true, 'pickAll', 'obstaclesOther') + areaField('whenHard', 'whenHardPh'));
    } else if (s === 5) {
      html = stepShell(5, chipsField('pastExp', false) + areaField('pastWhat', null, true) + chipsField('wants', true, 'pickAll', 'wantsOther') +
        chipsField('format', true) + chipsField('availability', true) + chipsField('proSupport', false) + areaField('extra', 'extraPh', true));
    } else if (s === 6) {
      var rows = F.answerRows({ answers: state.answers, lang: state.lang }, state.lang).filter(function (r) { return r[2]; });
      var stepOf = { name: 1, email: 1, phone: 1, ageRange: 1, focus: 2, change3m: 2, stress: 3, motivation: 3, sleepQuality: 3, confidence: 3, sleepHours: 3, obstacles: 4, whenHard: 4 };
      html = stepShell(6, '<h2 class="h2">' + esc(t('reviewTitle')) + '</h2><div class="card" style="margin-bottom:16px">' +
        rows.map(function (r) {
          return '<div class="qa"><div class="row between"><div class="q grow">' + esc(r[1]) + '</div><button type="button" class="link-btn" data-goto="' + (stepOf[r[0]] || 5) + '">' + esc(t('edit')) + '</button></div><div class="a">' + esc(r[2]) + '</div></div>';
        }).join('') + '</div>' +
        '<label class="check"><input type="checkbox" name="consent"' + (state.answers.consent ? ' checked' : '') + ' aria-describedby="err-consent"><span class="small">' + esc(t('consent')) + '</span></label>' +
        '<span class="err" id="err-consent" role="alert"></span>' +
        '<p class="crisis">' + esc(t('crisis')) + '</p>');
    } else {
      html = thanks();
    }
    main.innerHTML = html;
    var title = document.getElementById('step-title');
    if (title && s > 0) title.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function thanks() {
    var p = state.submitted;
    if (!p) { state.step = 0; return ''; }
    var name = (p.answers.name || '').split(/\s+/)[0];
    var hasEmail = !!coach.email, hasWa = !!coach.whatsapp;
    var btns = '';
    if (hasEmail) btns += '<a class="btn primary lg block" id="send-email" href="' + esc(mailtoHref(p)) + '">' + ICON.mail + esc(t('sendEmail')) + '</a>';
    if (hasWa) btns += '<a class="btn ' + (hasEmail ? '' : 'primary ') + 'lg block" id="send-wa" target="_blank" rel="noopener" href="' + esc(waHref(p)) + '">' + ICON.wa + esc(t('sendWhatsApp')) + '</a>';
    if (navigator.share) btns += '<button class="btn block" data-act="share">' + ICON.share + esc(t('share')) + '</button>';
    btns += '<div class="grid2"><button class="btn" data-act="download">' + ICON.dl + esc(t('download')) + '</button><button class="btn" data-act="copy">' + ICON.copy + '<span>' + esc(t('copy')) + '</span></button></div>';
    return header() +
      '<div class="center" style="margin-top:10px"><div class="success-ring">' + ICON.check + '</div>' +
      '<h1 class="h1" tabindex="-1" id="step-title">' + esc(t('thanksTitle', { name: name })) + '</h1>' +
      '<p class="muted">' + esc(hasEmail || hasWa ? t('thanksText') : t('thanksNoCoach')) + '</p></div>' +
      '<div class="stack" style="margin-top:18px">' + btns + '</div>' +
      '<p class="small dim center" style="margin-top:10px">✓ ' + esc(t('savedLocal')) + '</p>' +
      '<div class="card" style="margin-top:18px"><h2 class="h3">' + esc(t('nextTitle')) + '</h2><p class="muted small" style="margin:0">' + esc(t('nextText')) + '</p></div>' +
      '<details class="card" style="margin-top:12px"><summary class="h3" style="cursor:pointer;margin:0">' + esc(t('reviewTitle')) + '</summary><pre class="summary" style="margin-top:12px">' + esc(F.summaryText(p, { withData: false })) + '</pre></details>' +
      '<div class="row" style="margin-top:16px"><button class="btn ghost grow" data-act="edit">' + esc(t('editAnswers')) + '</button><button class="btn ghost grow" data-act="new">' + esc(t('newForm')) + '</button></div>' +
      '<p class="crisis">' + esc(t('crisis')) + '</p><p class="footer-note">' + esc(t('footer')) + '</p>';
  }

  function emailBody(p) {
    var full = F.coachReportText(p) + '\n\n(Importgegevens voor de app — niet wijzigen)\n' + F.coachReportData(p);
    // Some mail apps limit link length; fall back to the compact data-only version.
    if (encodeURIComponent(full).length > 7500) {
      var tt = I.T[p.lang] || I.T.en;
      return tt.sumTitle + ' — ' + p.answers.name + '\n\n' + tt.dataNote + '\n----- FBG DATA (do not edit) -----\n' + JSON.stringify(p) + '\n----- END FBG DATA -----';
    }
    return full;
  }
  function mailtoHref(p) {
    return 'mailto:' + encodeURIComponent(coach.email).replace(/%40/g, '@') + '?subject=' + encodeURIComponent(t('emailSubject', { name: p.answers.name })) + '&body=' + encodeURIComponent(emailBody(p));
  }
  function waHref(p) {
    return 'https://wa.me/' + String(coach.whatsapp).replace(/\D/g, '') + '?text=' + encodeURIComponent(F.coachReportText(p));
  }
  function fileName(p) { return 'intake-' + F.slug(p.answers.name) + '-' + F.isoDate(new Date(p.submittedAt)) + '.txt'; }

  // ---------- collect + validate ----------
  function collect(form) {
    var fd = new FormData(form);
    var multi = ['focus', 'obstacles', 'wants', 'format', 'availability'];
    var seen = {};
    form.querySelectorAll('[name]').forEach(function (el) { seen[el.name] = true; });
    Object.keys(seen).forEach(function (k) {
      if (k === 'consent') { state.answers.consent = !!form.querySelector('[name=consent]').checked; return; }
      if (multi.indexOf(k) !== -1) { state.answers[k] = fd.getAll(k); return; }
      var el = form.querySelector('[name="' + k + '"]');
      if (el.type === 'range') return; // ranges are stored on interaction only
      var v = fd.get(k);
      state.answers[k] = v == null ? '' : String(v).trim();
    });
    saveDraft();
  }

  function setErr(id, msg, inputName) {
    var el = document.getElementById('err-' + id);
    if (el) { el.textContent = msg || ''; el.classList.toggle('show', !!msg); }
    if (inputName) { var inp = document.querySelector('[name="' + inputName + '"]'); if (inp) { inp.classList.toggle('invalid', !!msg); inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); } }
  }

  function validate(step) {
    var a = state.answers, ok = true, firstBad = null;
    if (step === 1) {
      setErr('name', '', 'name'); setErr('email', '', 'email'); setErr('contact', '');
      if (!a.name) { setErr('name', t('errName'), 'name'); ok = false; firstBad = firstBad || 'name'; }
      if (a.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email)) { setErr('email', t('errEmail'), 'email'); ok = false; firstBad = firstBad || 'email'; }
      if (!a.email && !a.phone) { setErr('contact', t('errContact')); ok = false; firstBad = firstBad || 'email'; }
    }
    if (step === 6) {
      setErr('consent', '');
      if (!a.consent) { setErr('consent', t('errConsent')); ok = false; firstBad = 'consent'; }
    }
    if (firstBad) { var el = document.querySelector('[name="' + firstBad + '"]'); if (el) el.focus(); }
    return ok;
  }

  function submit() {
    var answers = JSON.parse(JSON.stringify(state.answers));
    var payload = F.buildPayload(answers, state.lang, state.id);
    state.submitted = payload;
    F.store.set('intakeLast', payload);
    var list = F.store.get('intakes', []) || [];
    list = list.filter(function (x) { return x.id !== payload.id; });
    list.unshift(payload);
    F.store.set('intakes', list.slice(0, 50));
    draft.editing = false;
    state.step = 7;
    saveDraft();
    render();
  }

  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    el.style.bottom = '20px';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 1800);
  }

  // ---------- events ----------
  main.addEventListener('click', function (e) {
    var langBtn = e.target.closest('[data-lang]');
    if (langBtn) {
      var form = document.getElementById('step-form');
      if (form) collect(form);
      state.lang = langBtn.getAttribute('data-lang');
      saveDraft(); render(); return;
    }
    var go = e.target.closest('[data-goto]');
    if (go) { collect(document.getElementById('step-form')); state.step = +go.getAttribute('data-goto'); saveDraft(); render(); return; }
    var actEl = e.target.closest('[data-act]');
    if (!actEl) return;
    var act = actEl.getAttribute('data-act');
    var p = state.submitted;
    if (act === 'start') { state.step = 1; saveDraft(); render(); }
    else if (act === 'back') { collect(document.getElementById('step-form')); state.step = Math.max(0, state.step - 1); saveDraft(); render(); }
    else if (act === 'download') { F.download(F.coachReportFile(p), F.coachReportHTML(p), 'text/html'); }
    else if (act === 'copy') {
      F.copyText(emailBody(p)).then(function (ok) { if (ok) { toast(t('copied')); } });
    }
    else if (act === 'share') {
      var text = F.coachReportText(p);
      var file = null;
      try { file = new File([F.coachReportHTML(p)], F.coachReportFile(p), { type: 'text/html' }); } catch (err) { file = null; }
      var subj = t('emailSubject', { name: p.answers.name });
      var data = (file && navigator.canShare && navigator.canShare({ files: [file], text: text })) ? { files: [file], title: subj, text: text } : { title: subj, text: emailBody(p) };
      navigator.share(data).catch(function () { /* user cancelled */ });
    }
    else if (act === 'edit') { draft.editing = true; state.answers = JSON.parse(JSON.stringify(p.answers)); state.id = p.id; state.step = 6; saveDraft(); render(); }
    else if (act === 'new') {
      F.store.remove('intakeLast'); F.store.remove('intakeDraft');
      draft = {}; state.submitted = null; state.answers = {}; state.id = F.uid(); state.step = 0; render();
    }
  });

  main.addEventListener('input', function (e) {
    var el = e.target;
    if (el.type === 'range') {
      var v = +el.value;
      state.answers[el.name] = v;
      el.style.setProperty('--p', ((v - 1) / 9 * 100) + '%');
      el.setAttribute('aria-valuetext', v + ' / 10');
      var out = document.getElementById('rv-' + el.name);
      if (out) { out.textContent = v; out.classList.remove('unset'); }
      saveDraft();
    }
  });
  // A tap on the slider without moving still counts as an answer
  main.addEventListener('change', function (e) {
    var el = e.target;
    if (el.type === 'range' && !state.answers[el.name]) { el.dispatchEvent(new Event('input', { bubbles: true })); }
    if (el.name === 'ageRange') { var n = document.getElementById('u18'); if (n) n.style.display = el.value === 'u18' ? '' : 'none'; }
    if (el.name === 'consent') setErr('consent', '');
  });
  main.addEventListener('pointerup', function (e) {
    var el = e.target;
    if (el.type === 'range' && !state.answers[el.name]) el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  main.addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target;
    collect(form);
    if (!validate(state.step)) return;
    if (state.step === TOTAL) { submit(); return; }
    state.step += 1; saveDraft(); render();
  });

  render();
})();
