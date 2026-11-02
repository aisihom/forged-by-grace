/* Forged by Grace v2.6 — Rewards: coach-approved Sweatpoints redemption (no server). */
(function () {
  'use strict';
  var App = window.App, S = App.S, F = App.F, esc = App.esc, t = App.t, I = App.I, A = App.acts, V = App.views;
  var NL = {
    'Rewards': 'Beloningen', 'Redeem': 'Inwisselen', 'Redemptions': 'Inwisselingen', 'Pending': 'In afwachting', 'Approved': 'Goedgekeurd', 'Rejected': 'Afgewezen', 'Done': 'Afgerond', 'Cancelled': 'Geannuleerd',
    'How it works': 'Zo werkt het', 'Rewards are approved by your coach.': 'Beloningen worden goedgekeurd door je coach.',
    '1. Tap Redeem — your points are reserved. 2. Send the request to your coach. 3. Your coach checks it and gives you an approval code. 4. Enter the code here — done!': '1. Tik op Inwisselen — je punten worden gereserveerd. 2. Stuur de aanvraag naar je coach. 3. Je coach controleert hem en geeft je een goedkeuringscode. 4. Vul de code hier in — klaar!',
    'Redeem this reward?': 'Deze beloning inwisselen?', '{n} SP will be reserved until your coach approves.': '{n} SP worden gereserveerd tot je coach goedkeurt.',
    'Send to coach': 'Stuur naar coach', 'Enter approval code': 'Goedkeuringscode invullen', 'Cancel request': 'Aanvraag annuleren', 'Approval code': 'Goedkeuringscode',
    'Wrong code — check with your coach.': 'Verkeerde code — vraag het na bij je coach.', 'Reward redeemed!': 'Beloning ingewisseld!', 'Points returned': 'Punten teruggezet',
    'Cancel this request? Your points come back.': 'Deze aanvraag annuleren? Je punten komen terug.', 'Reserved': 'Gereserveerd', 'Redeemed': 'Ingewisseld', 'Returned': 'Teruggezet',
    'Reward request': 'Beloningsaanvraag', 'Send this to your coach. Your coach checks it and replies with an approval code.': 'Stuur dit naar je coach. Je coach controleert het en stuurt een goedkeuringscode terug.',
    'My requests': 'Mijn aanvragen', 'Manage rewards': 'Beloningen beheren', 'Add reward': 'Beloning toevoegen', 'Name': 'Naam', 'Price (SP)': 'Prijs (SP)', 'Description (optional)': 'Omschrijving (optioneel)', 'Remove': 'Verwijderen', 'Save': 'Opslaan', 'Edit': 'Bewerken',
    'Examples — tap Edit to change them into your own products.': 'Voorbeelden — tik op Bewerken om ze te veranderen in je eigen producten.',
    'Rewards & redemptions': 'Beloningen & inwisselingen', 'Check a request (paste link or code)': 'Aanvraag controleren (plak link of code)',
    'Checksum OK — the request was not changed.': 'Controlecode klopt — de aanvraag is niet veranderd.', 'Checksum does NOT match — the request or the points history was changed.': 'Controlecode klopt NIET — de aanvraag of puntengeschiedenis is veranderd.',
    'Looks plausible': 'Ziet er geloofwaardig uit', 'Check carefully': 'Goed controleren', 'Approve': 'Goedkeuren', 'Reject': 'Afwijzen',
    'Give this approval code to {n}:': 'Geef deze goedkeuringscode aan {n}:', 'Tell {n} the request is rejected. They tap “Cancel request” and get their points back.': 'Laat {n} weten dat de aanvraag is afgewezen. Ze tikken op “Aanvraag annuleren” en krijgen hun punten terug.',
    'Paste the request the client sent you.': 'Plak de aanvraag die je klant stuurde.', 'Open': 'Openen', 'No requests yet.': 'Nog geen aanvragen.', 'Not enough Sweatpoints': 'Niet genoeg Sweatpoints',
    'You already have a pending request.': 'Je hebt al een aanvraag in afwachting.', 'Coach checks: points history, daily max 150 SP, activity behind every point.': 'Coach controleert: puntengeschiedenis, max 150 SP per dag, activiteit achter elk punt.',
    'Clients redeem Sweatpoints for these. You approve every redemption yourself.': 'Klanten wisselen hier Sweatpoints voor in. Jij keurt elke inwisseling zelf goed.', 'Copy code': 'Code kopiëren', 'Copied': 'Gekopieerd'
  };
  window.FBG_I18N = window.FBG_I18N || {}; window.FBG_I18N.nl = window.FBG_I18N.nl || {};
  Object.keys(NL).forEach(function (k) { if (!window.FBG_I18N.nl[k]) window.FBG_I18N.nl[k] = NL[k]; });
  var CAP = 150, NOCAP = { welcome: 1, streak: 1 }, MAXONE = { in: 5, st6: 10, st8: 10, st10: 15, wk: 30, sp: 20, fl: 10, ft: 20, welcome: 50, streak: 50 };
  var DEF = [
    { id: 'r1', n: 'FBG shaker bottle', p: 1500, d: 'Example — edit name & price' },
    { id: 'r2', n: 'Protein bar box', p: 2500, d: 'Example' },
    { id: 'r3', n: '1 free PT session', p: 6000, d: 'Example' },
    { id: 'r4', n: 'FBG T-shirt', p: 4000, d: 'Example' }
  ];
  App.rewards = function () { if (!Array.isArray(S.rewards)) S.rewards = DEF.map(function (x) { return Object.assign({}, x); }); return S.rewards; };
  // cyrb53-style hash → base36
  function hash(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0; i < str.length; i++) { var ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36).toUpperCase();
  }
  function sumOf(r) { return hash('FBG-SP|' + JSON.stringify(r.ledger) + '|' + r.id + '|' + r.amt + '|' + r.total + '|' + r.bal + '|' + r.rn).slice(0, 10); }
  function approvalOf(id, amt, sum) { return hash('FBG-OK|' + id + '|' + amt + '|' + sum).slice(-6).padStart(6, '7'); }
  App.spHash = { sum: sumOf, ok: approvalOf };
  function G() { var g = App.game(); if (!Array.isArray(g.redeem)) g.redeem = []; return g; }
  function lg(g, k, pts, l) { g.log.unshift({ d: App.today(), ts: Date.now(), k: k, pts: pts, l: l }); if (g.log.length > 300) g.log.length = 300; }
  function activity(ath, from) {
    var a = { st: {}, sx: {}, wk: {}, sp: {}, fl: {} };
    for (var d = from; d <= App.today(); d = App.isoAdd(d, 1)) { var hd = App.healthDay && App.healthDay(d); if (hd && hd.steps) { a.st[d] = hd.steps; if (hd.extraSteps) a.sx[d] = hd.extraSteps; } var fe = (ath.food && ath.food[d]) || []; if (fe.length) a.fl[d] = fe.length; }
    (ath.sessions || []).forEach(function (s) { if (!s.date || s.date < from) return; var k = (s.type === 'sport' || s.type === 'external') ? 'sp' : 'wk'; a[k][s.date] = (a[k][s.date] || 0) + 1; });
    return a;
  }
  function buildReq(g, rw) {
    var ledger = g.log.filter(function (x) { return x.pts > 0 && x.k !== 'ret'; }).map(function (x) { return [x.d, x.k, x.pts]; });
    var from = ledger.length ? ledger.reduce(function (m, x) { return x[0] < m ? x[0] : m; }, App.today()) : App.today();
    var id = Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
    var r = { t: 'redeem', v: 1, id: id, code: 'FBG-' + id.slice(-6), name: (S.me.profile && S.me.profile.name) || 'Client', rid: rw.id, rn: rw.n, amt: rw.p, at: new Date().toISOString(), bal: g.sp, total: g.total || 0, start: g.start, ledger: ledger, act: activity(S.me, from),
      hist: g.redeem.map(function (x) { return [x.id, x.status]; }) };
    r.sum = sumOf(r); return r;
  }
  // ---- coach verification ----
  App.verifyRedeem = function (r) {
    var w = [], ok = sumOf(r) === r.sum;
    var day = {}, earned = 0;
    (r.ledger || []).forEach(function (x) {
      earned += x[2];
      if (!NOCAP[x[1]]) day[x[0]] = (day[x[0]] || 0) + x[2];
      if (MAXONE[x[1]] != null && x[2] > MAXONE[x[1]]) w.push('Entry too large: ' + x[1] + ' +' + x[2] + ' on ' + x[0]);
      if (MAXONE[x[1]] == null) w.push('Unknown entry type: ' + x[1]);
      var a = r.act || {};
      if (/^st/.test(x[1])) { var need = { st6: 6000, st8: 8000, st10: 10000 }[x[1]]; if (!a.st || (a.st[x[0]] || 0) < need) w.push('Steps points on ' + x[0] + ' but only ' + ((a.st && a.st[x[0]]) || 0) + ' steps logged'); }
      if (x[1] === 'wk' && !(a.wk && a.wk[x[0]])) w.push('Workout points on ' + x[0] + ' without a logged workout');
      if (x[1] === 'sp' && !(a.sp && a.sp[x[0]])) w.push('Sport points on ' + x[0] + ' without a logged session');
      if ((x[1] === 'fl' || x[1] === 'ft') && !(a.fl && (a.fl[x[0]] || 0) >= 3)) w.push('Food points on ' + x[0] + ' without 3+ food logs');
      if (x[0] > r.at.slice(0, 10)) w.push('Points dated in the future: ' + x[0]);
    });
    Object.keys(day).forEach(function (d) { if (day[d] > CAP) w.push('Over the daily cap on ' + d + ': ' + day[d] + ' SP (max ' + CAP + ')'); });
    if (r.total < earned) w.push('Total earned (' + r.total + ') is lower than the history (' + earned + ')');
    if (r.bal > r.total) w.push('Balance (' + r.bal + ') is higher than everything ever earned (' + r.total + ')');
    var days = Math.max(1, Math.round((Date.parse(r.at.slice(0, 10)) - Date.parse(r.start || r.at.slice(0, 10))) / 864e5) + 1);
    if (r.total > days * CAP + 50 + Math.floor(days / 7) * 50) w.push('Too many points for ' + days + ' days in the app (' + r.total + ' SP)');
    if (r.amt <= 0) w.push('Invalid amount');
    (S.redemptions || []).forEach(function (x) { if (x.status === 'approved' && x.name === r.name) { var h = (r.hist || []).filter(function (y) { return y[0] === x.id; })[0]; if (h && h[1] === 'cancelled') w.push('Earlier approved request ' + x.code + ' was cancelled on the phone (points taken back)'); } });
    var dup = (S.redemptions || []).filter(function (x) { return x.id === r.id; })[0];
    var notes = Object.keys((r.act && r.act.sx) || {}).sort().map(function (d) { return d + ': ' + r.act.st[d] + ' steps, of which ' + r.act.sx[d] + ' manual/estimated (no watch)'; });
    return { ok: ok, warn: w, earned: earned, days: days, dup: dup, notes: notes };
  };
  // ---- client UI: Rewards section inside Sweatpoints card ----
  function stLabel(s) { return { pending: 'Pending', done: 'Done', cancelled: 'Cancelled' }[s] || s; }
  App.rewardsBlock = function () {
    var g = G(), rw = App.rewards();
    var h = '<div class="rw"><div class="row between"><b>🎁 ' + esc(t('Rewards')) + '</b><button class="btn sm ghost" data-act="rw-how">' + esc(t('How it works')) + '</button></div><p class="tiny muted" style="margin:4px 0 8px">' + esc(t('Rewards are approved by your coach.')) + '</p><div class="rw-list">';
    h += rw.map(function (x) { var can = g.sp >= x.p; return '<div class="rw-item"><div class="grow"><b>' + esc(x.n) + '</b>' + (x.d ? '<div class="tiny muted">' + esc(x.d) + '</div>' : '') + '</div><div class="rw-r"><span class="price">' + x.p.toLocaleString(S.lang) + ' SP</span><button class="btn sm ' + (can ? 'primary' : '') + '" data-act="rw-redeem" data-id="' + esc(x.id) + '"' + (can ? '' : ' disabled') + '>' + esc(t('Redeem')) + '</button></div></div>'; }).join('');
    h += '</div>';
    if (g.redeem.length) h += '<div class="tiny kicker" style="margin-top:10px">' + esc(t('My requests')) + '</div>' + g.redeem.slice(0, 8).map(function (x) {
      return '<div class="rw-req"><div class="grow"><b>' + esc(x.rn) + '</b> <span class="pill ' + (x.status === 'done' ? 'good' : x.status === 'pending' ? 'warn' : '') + '">' + esc(t(stLabel(x.status))) + '</span><div class="tiny muted mono">' + esc(x.code) + ' · ' + x.amt + ' SP</div></div>' +
        (x.status === 'pending' ? '<div class="rw-acts"><button class="btn sm" data-act="rw-send" data-id="' + x.id + '">' + esc(t('Send to coach')) + '</button><button class="btn sm primary" data-act="rw-code" data-id="' + x.id + '">' + esc(t('Enter approval code')) + '</button><button class="btn sm ghost" data-act="rw-cancel" data-id="' + x.id + '">' + esc(t('Cancel request')) + '</button></div>' : '') + '</div>'; }).join('');
    return h + '</div>';
  };
  A['rw-how'] = function () { App.sheet(App.sheetHead(t('How it works'), t('Rewards are approved by your coach.')) + '<p>' + esc(t('1. Tap Redeem — your points are reserved. 2. Send the request to your coach. 3. Your coach checks it and gives you an approval code. 4. Enter the code here — done!')).replace(/ (\d\.)/g, '<br>$1') + '</p><p class="small muted">' + esc(t('Coach checks: points history, daily max 150 SP, activity behind every point.')) + '</p>'); };
  A['rw-redeem'] = function (el) {
    var g = G(), rw = App.rewards().filter(function (x) { return x.id === el.dataset.id; })[0]; if (!rw) return;
    if (g.sp < rw.p) { App.toast(t('Not enough Sweatpoints')); return; }
    App.confirm(t('Redeem this reward?'), rw.n + ' — ' + t('{n} SP will be reserved until your coach approves.', { n: rw.p }), t('Redeem')).then(function (ok) {
      if (!ok) return;
      var r = buildReq(g, rw);
      g.sp -= rw.p; lg(g, 'res', -rw.p, t('Reserved') + ': ' + rw.n);
      g.redeem.unshift({ id: r.id, code: r.code, rid: rw.id, rn: rw.n, amt: rw.p, at: r.at, sum: r.sum, status: 'pending', req: r });
      App.save(); App.rerender(); sendReq(r);
    });
  };
  function sendReq(r) {
    App.shareSheet(t('Reward request') + ' ' + r.code, t('Send this to your coach. Your coach checks it and replies with an approval code.'), r, { text: t('Reward request') + ' ' + r.code + ' · ' + r.rn + ' · ' + r.amt + ' SP', phone: S.coach.whatsapp, email: S.coach.email, subject: 'Forged by Grace · ' + r.code, filename: 'redeem-' + r.code });
  }
  function find(id) { return G().redeem.filter(function (x) { return x.id === id; })[0]; }
  A['rw-send'] = function (el) { var x = find(el.dataset.id); if (x) sendReq(x.req); };
  A['rw-cancel'] = function (el) {
    var g = G(), x = find(el.dataset.id); if (!x || x.status !== 'pending') return;
    App.confirm(t('Cancel request'), t('Cancel this request? Your points come back.'), t('Cancel request'), true).then(function (ok) { if (!ok) return; x.status = 'cancelled'; g.sp += x.amt; lg(g, 'ret', x.amt, t('Returned') + ': ' + x.rn); App.save(); App.rerender(); App.toast(t('Points returned') + ' +' + x.amt); });
  };
  A['rw-code'] = function (el) {
    var g = G(), x = find(el.dataset.id); if (!x) return;
    var s = App.sheet(App.sheetHead(t('Enter approval code'), x.code + ' · ' + x.rn) + '<input class="input mono" id="rw-ac" maxlength="8" autocomplete="off" placeholder="123ABC" style="text-transform:uppercase;font-size:22px;text-align:center"><button class="btn primary lg block" id="rw-go" style="margin-top:12px">' + I.check + esc(t('Redeem')) + '</button>');
    s.el.querySelector('#rw-go').onclick = function () {
      var v = s.el.querySelector('#rw-ac').value.trim().toUpperCase();
      if (v !== approvalOf(x.id, x.amt, x.sum)) { App.toast(t('Wrong code — check with your coach.')); return; }
      x.status = 'done'; x.doneAt = new Date().toISOString(); lg(g, 'redeemed', 0, t('Redeemed') + ': ' + x.rn + ' (' + x.amt + ' SP)');
      App.save(); s.close(); App.rerender(); App.toast('🎉 ' + t('Reward redeemed!'));
    };
  };
  // ---- coach UI ----
  function coachList() {
    var R = S.redemptions || [];
    return R.length ? '<div class="list">' + R.slice(0, 40).map(function (x) { return '<div class="list-item"><div class="grow"><b>' + esc(x.name) + ' · ' + esc(x.rn) + '</b><div class="tiny muted mono">' + esc(x.code) + ' · ' + x.amt + ' SP · ' + esc(App.ago(x.at)) + (x.approval ? ' · ✔ ' + esc(x.approval) : '') + '</div></div><span class="pill ' + (x.status === 'approved' ? 'good' : x.status === 'rejected' ? 'bad' : 'warn') + '">' + esc(t(x.status === 'approved' ? 'Approved' : x.status === 'rejected' ? 'Rejected' : 'Pending')) + '</span></div>'; }).join('') + '</div>' : '<p class="small muted">' + esc(t('No requests yet.')) + '</p>';
  }
  App.redemptionsSheet = function () {
    var s = App.sheet(App.sheetHead(t('Redemptions'), t('Clients redeem Sweatpoints for these. You approve every redemption yourself.')) +
      '<button class="btn primary block" id="rw-check">' + I.link + esc(t('Check a request (paste link or code)')) + '</button><button class="btn block" id="rw-man" style="margin-top:8px">🎁 ' + esc(t('Manage rewards')) + '</button><div class="section">' + coachList() + '</div>');
    s.el.querySelector('#rw-check').onclick = function () { s.close(); pasteReq(); };
    s.el.querySelector('#rw-man').onclick = function () { s.close(); manage(); };
  };
  function pasteReq() {
    var s = App.sheet(App.sheetHead(t('Check a request (paste link or code)'), t('Paste the request the client sent you.')) + '<textarea class="input mono" id="rw-pi" rows="4" placeholder="https://…#imp=…"></textarea><input type="file" class="input" id="rw-pf" accept=".json,.txt,application/json" style="margin-top:10px"><button class="btn primary lg block" id="rw-po" style="margin-top:12px">' + esc(t('Open')) + '</button>');
    s.el.querySelector('#rw-po').onclick = function () { var f = s.el.querySelector('#rw-pf').files[0]; (f ? f.text() : Promise.resolve(s.el.querySelector('#rw-pi').value)).then(App.decode).then(function (o) { s.close(); App.showImport(o); }).catch(function (e) { App.toast(e.message || 'Could not read that.'); }); };
  }
  App.reviewRedeem = function (r) {
    var v = App.verifyRedeem(r), good = v.ok && !v.warn.length, first = String(r.name).split(' ')[0];
    var rec = v.dup || { id: r.id, code: r.code, name: r.name, rn: r.rn, amt: r.amt, at: r.at, sum: r.sum, status: 'pending' };
    if (!v.dup) { S.redemptions = S.redemptions || []; S.redemptions.unshift(rec); App.save(); }
    var h = App.sheetHead(t('Reward request') + ' ' + r.code, r.name + ' · ' + r.rn + ' · ' + r.amt + ' SP');
    h += '<div class="pet-alert ' + (v.ok ? 'good' : 'bad') + '">' + (v.ok ? '✅ ' : '⛔ ') + esc(t(v.ok ? 'Checksum OK — the request was not changed.' : 'Checksum does NOT match — the request or the points history was changed.')) + '</div>';
    h += '<div class="pet-alert ' + (good ? 'good' : 'warn') + '" style="margin-top:8px"><b>' + (good ? '👍 ' + esc(t('Looks plausible')) : '⚠️ ' + esc(t('Check carefully'))) + '</b><div class="tiny" style="margin-top:4px">' + v.days + ' days · ' + r.total + ' SP earned · ' + r.ledger.length + ' history entries · balance ' + r.bal + ' SP</div>' + (v.warn.length ? '<ul class="small" style="margin:6px 0 0;padding-left:18px">' + v.warn.slice(0, 8).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + '</div>' + (v.notes && v.notes.length ? '<div class="pet-alert" style="margin-top:8px"><b>👣 ' + esc(t('Steps added by hand / estimated')) + '</b><ul class="small" style="margin:6px 0 0;padding-left:18px">' + v.notes.slice(0, 8).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '');
    if (rec.status === 'approved') h += '<div class="card center" style="margin-top:10px"><div class="tiny muted">' + esc(t('Approval code')) + '</div><div class="rw-code">' + esc(rec.approval) + '</div></div>';
    else if (rec.status !== 'rejected') h += '<div class="grid2" style="margin-top:12px"><button class="btn danger" id="rw-rej">' + esc(t('Reject')) + '</button><button class="btn primary" id="rw-ok">' + I.check + esc(t('Approve')) + '</button></div>';
    else h += '<p class="small muted">' + esc(t('Rejected')) + '</p>';
    var s = App.sheet(h);
    var ok = s.el.querySelector('#rw-ok'), rj = s.el.querySelector('#rw-rej');
    if (ok) ok.onclick = function () {
      rec.status = 'approved'; rec.approval = approvalOf(r.id, r.amt, r.sum); rec.decidedAt = new Date().toISOString(); App.save(); s.close();
      var s2 = App.sheet(App.sheetHead(t('Approved'), r.code + ' · ' + r.rn) + '<p>' + esc(t('Give this approval code to {n}:', { n: first })) + '</p><div class="rw-code">' + esc(rec.approval) + '</div><button class="btn block" id="rw-cp">' + esc(t('Copy code')) + '</button>');
      s2.el.querySelector('#rw-cp').onclick = function () { F.copyText(rec.approval).then(function () { App.toast(t('Copied')); }); };
      App.rerender();
    };
    if (rj) rj.onclick = function () { rec.status = 'rejected'; rec.decidedAt = new Date().toISOString(); App.save(); s.close(); App.sheet(App.sheetHead(t('Rejected'), r.code) + '<p>' + esc(t('Tell {n} the request is rejected. They tap “Cancel request” and get their points back.', { n: first })) + '</p>'); App.rerender(); };
  };
  function manage() {
    var rw = App.rewards();
    var s = App.sheet(App.sheetHead(t('Manage rewards'), t('Examples — tap Edit to change them into your own products.')) + '<div class="list">' + rw.map(function (x) { return '<div class="list-item"><div class="grow"><b>' + esc(x.n) + '</b><div class="tiny muted">' + x.p + ' SP' + (x.d ? ' · ' + esc(x.d) : '') + '</div></div><button class="btn sm" data-ed="' + esc(x.id) + '">' + esc(t('Edit')) + '</button></div>'; }).join('') + '</div><button class="btn primary block" style="margin-top:10px" data-ed="">' + I.plus + esc(t('Add reward')) + '</button>');
    s.el.querySelectorAll('[data-ed]').forEach(function (b) { b.onclick = function () { s.close(); editR(b.dataset.ed); }; });
  }
  function editR(id) {
    var rw = App.rewards(), x = rw.filter(function (y) { return y.id === id; })[0] || { id: 'r' + Date.now().toString(36), n: '', p: 1000, d: '' }, isNew = !id;
    var s = App.sheet(App.sheetHead(isNew ? t('Add reward') : t('Edit')) + '<label class="field"><span class="label">' + esc(t('Name')) + '</span><input class="input" id="re-n" maxlength="40" value="' + esc(x.n) + '"></label><label class="field"><span class="label">' + esc(t('Price (SP)')) + '</span><input class="input" id="re-p" type="number" inputmode="numeric" min="1" value="' + x.p + '"></label><label class="field"><span class="label">' + esc(t('Description (optional)')) + '</span><input class="input" id="re-d" maxlength="80" value="' + esc(x.d || '') + '"></label><div class="grid2">' + (isNew ? '<span></span>' : '<button class="btn danger" id="re-x">' + esc(t('Remove')) + '</button>') + '<button class="btn primary" id="re-s">' + esc(t('Save')) + '</button></div>');
    s.el.querySelector('#re-s').onclick = function () { var n = s.el.querySelector('#re-n').value.trim(), p = parseInt(s.el.querySelector('#re-p').value, 10); if (!n || !(p > 0)) return; x.n = n; x.p = p; x.d = s.el.querySelector('#re-d').value.trim(); if (isNew) rw.push(x); App.save(); s.close(); manage(); App.rerender(); };
    var del = s.el.querySelector('#re-x'); if (del) del.onclick = function () { S.rewards = rw.filter(function (y) { return y.id !== x.id; }); App.save(); s.close(); manage(); App.rerender(); };
  }
  A['rw-coach'] = function () { App.redemptionsSheet(); };
  // ---- hooks ----
  var oShow = App.showImport;
  App.showImport = function (obj) {
    if (obj && obj.t === 'redeem') { if (S.role !== 'coach' && !S.me.isCoach) { App.toast('This is a reward request for your coach.'); return; } if (S.role !== 'coach') { S.role = 'coach'; App.save(); } history.replaceState(null, '', '#/clients'); App.route(); App.reviewRedeem(obj); return; }
    if (obj && obj.t === 'assign' && Array.isArray(obj.rewards) && S.role !== 'coach') { S.rewards = obj.rewards; App.save(); }
    return oShow.apply(this, arguments);
  };
  var oLink = App.shareLink;
  App.shareLink = function (obj) { if (obj && obj.t === 'assign') obj.rewards = App.rewards(); return oLink.call(this, obj); };
  var oMore = V.more;
  V.more = function () {
    var h = oMore.apply(this, arguments); if (S.role !== 'coach') return h;
    var n = (S.redemptions || []).filter(function (x) { return x.status === 'pending'; }).length;
    var c = '<div class="card tap row between" data-act="rw-coach"><div><b>🎁 ' + esc(t('Rewards & redemptions')) + '</b><div class="tiny muted">' + App.rewards().length + ' ' + esc(t('Rewards')).toLowerCase() + (n ? ' · ' + n + ' ' + esc(t('Pending')).toLowerCase() : '') + '</div></div><span class="chev">›</span></div>', i = h.indexOf('<div class="card">');
    return i !== -1 ? h.slice(0, i) + c + h.slice(i) : h + c;
  };
  var oCl = V.clients;
  V.clients = function () { var h = oCl.apply(this, arguments); return h + '<div class="section"><button class="btn block" data-act="rw-coach">🎁 ' + esc(t('Redemptions')) + '</button></div>'; };
})();
