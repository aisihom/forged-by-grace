/* FBG v3.25 — terms + explicit health consent + optional photo consent (AVG art. 6/7/9, Auteurswet art. 21). Stored in S.me.consent → cloud kind 'consent'. */
(function () {
  'use strict';
  var App = window.App, S = App.S, esc = App.esc, A = App.acts, V = App.views;
  var VER = '1.0', LINK = 'privacy.html';
  var OPTS = [['face', 'Met gezicht (herkenbaar)'], ['noface', 'Zonder gezicht'], ['anon', 'Anoniem (geen naam)'], ['firstname', 'Met voornaam'], ['beforeafter', 'Voor/na-vergelijking']];
  function cur() { return (S.me && S.me.consent) || null; }
  function needs() { var c = cur(); return S.role === 'athlete' && (!c || c.v !== VER || !c.terms || !c.health); }
  function photoTxt(p) { if (!p || !Object.keys(p).some(function (k) { return p[k]; })) return 'Geen beeldgebruik'; return OPTS.filter(function (o) { return p[o[0]]; }).map(function (o) { return o[1]; }).join(' · '); }
  App.consentText = photoTxt;
  function open(force) {
    var c = cur() || {}, p = c.photo || {};
    var box = function (id, on, txt, req) { return '<label class="row small" style="gap:8px;align-items:flex-start;margin-top:10px"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '><span>' + txt + (req ? ' <b style="color:#d4af37">*</b>' : '') + '</span></label>'; };
    var s = App.sheet('<h2 class="h2" style="color:#d4af37">🔒 Privacy & toestemming</h2><p class="small muted">Versie ' + VER + ' · Aarón Ricardo, handelend onder de naam Forged by Grace</p>' +
      '<p class="small">Lees de <a href="' + LINK + '" target="_blank" rel="noopener" style="color:#d4af37">Algemene voorwaarden & privacyverklaring</a>. Je gegevens staan versleuteld in de EU (Frankfurt), alleen jij en je coach zien ze, en ze worden <b>nooit verkocht of gedeeld met databrokers of adverteerders</b>.</p>' +
      box('cs-t', c.terms, 'Ik ga akkoord met de algemene voorwaarden en privacyverklaring.', 1) +
      box('cs-h', c.health, 'Ik geef <b>uitdrukkelijke toestemming</b> voor het verwerken van mijn gezondheidsgegevens (gewicht, voeding, slaap, blessures, foto\u2019s, check-ins) voor mijn coaching (art. 9 lid 2 sub a AVG).', 1) +
      '<div class="card" style="margin-top:14px;border:1px solid rgba(212,175,55,.5)"><b>📸 Toestemming beeldmateriaal (vrijwillig)</b><p class="tiny muted">Alleen voor social media van FBG en als referentie/testimonial. Nooit verkocht, nooit aan derden. Altijd intrekbaar; verwijdering binnen 30 dagen. Niets aanvinken = geen gebruik. Onder 18: alleen met schriftelijke toestemming ouder/voogd.</p>' +
      OPTS.map(function (o) { return box('cs-p-' + o[0], p[o[0]], o[1]); }).join('') + '</div>' +
      '<p class="tiny" id="cs-m" style="min-height:1em;color:#d4af37"></p><button class="btn primary lg block" id="cs-ok">Opslaan</button>' +
      (c.at ? '<button class="btn ghost block small" id="cs-w" style="margin-top:8px">Beeldtoestemming intrekken</button><p class="tiny muted" style="margin-top:8px">Akkoord gegeven: ' + esc(new Date(c.at).toLocaleString('nl-NL')) + '. Gezondheidstoestemming intrekken of alles laten verwijderen? Laat het je coach weten — de coaching stopt dan en je gegevens worden verwijderd.</p>' : ''),
      { label: 'Privacy', onClose: function () { if (needs() && !force) setTimeout(function () { App.toast('Accepteer de voorwaarden om de app te gebruiken'); }, 0); } });
    var $ = function (q) { return s.el.querySelector(q); };
    function save(photo) {
      var now = new Date().toISOString(), old = cur() || {}, hist = (old.history || []).slice(-20);
      hist.push({ at: now, v: VER, photo: photo });
      S.me.consent = { v: VER, at: old.at && old.v === VER ? old.at : now, updated: now, terms: true, health: true, photo: photo, photoWithdrawnAt: (Object.keys(photo).some(function (k) { return photo[k]; }) ? null : (old.photo && Object.keys(old.photo).some(function (k) { return old.photo[k]; }) ? now : old.photoWithdrawnAt || null)), history: hist };
      App.save(); s.close(); App.toast('✅ Opgeslagen'); if (/^#\/more/.test(location.hash)) App.rerender();
    }
    $('#cs-ok').onclick = function () {
      if (!$('#cs-t').checked || !$('#cs-h').checked) { $('#cs-m').textContent = 'Vink beide verplichte vakjes (*) aan.'; return; }
      var ph = {}; OPTS.forEach(function (o) { if ($('#cs-p-' + o[0]).checked) ph[o[0]] = true; }); save(ph);
    };
    if ($('#cs-w')) $('#cs-w').onclick = function () { if (confirm('Beeldtoestemming intrekken? FBG verwijdert je beelden binnen 30 dagen.')) save({}); };
  }
  A['consent'] = function () { open(true); };
  // prompt on open (first login / existing clients) until accepted
  var oRoute = App.route, shown = 0;
  App.route = function () { var r = oRoute.apply(this, arguments); if (needs() && !document.querySelector('.sheet') && Date.now() - shown > 20000) { shown = Date.now(); setTimeout(function () { if (needs() && !document.querySelector('.sheet')) open(false); }, 600); } return r; };
  // More → Privacy card (client)
  var oMore = V.more; V.more = function () { var h = oMore.apply(this, arguments); if (S.role === 'coach') return h; var c = cur();
    return '<div class="card row" style="margin-bottom:12px;border:1px solid rgba(212,175,55,.5)"><div class="grow"><b>🔒 Privacy & toestemming</b><div class="tiny muted">' + (c && c.terms ? '✓ Akkoord v' + esc(c.v) + ' · 📸 ' + esc(photoTxt(c.photo)) : 'Nog niet geaccepteerd') + '</div></div><button class="btn sm" data-act="consent">Bekijk / wijzig</button></div>' + h; };
  // coach: badge on client page
  var oClient = V.client; V.client = function (id) { var h = oClient.apply(this, arguments); if (id === 'me' || !h || S.role !== 'coach') return h; var c = App.client(id); if (!c || !c.cloudId) return h;
    var k = c.live && c.live.d && c.live.d.consent, ok = k && k.terms && k.health;
    var b = '<div class="card" style="margin:12px 0;border:1px solid ' + (ok ? 'rgba(212,175,55,.6)' : '#a33') + '"><b>🔒 Toestemming</b> <span class="badge" style="background:' + (ok ? '#d4af37;color:#000' : '#a33;color:#fff') + ';border-radius:8px;padding:1px 8px;font-size:12px">' + (ok ? '✓ Akkoord v' + esc(k.v) : '✗ Nog niet') + '</span>' +
      (ok ? '<div class="small" style="margin-top:6px">📸 ' + esc(photoTxt(k.photo)) + (k.photoWithdrawnAt ? ' <span style="color:#e0a030">(ingetrokken ' + esc(new Date(k.photoWithdrawnAt).toLocaleDateString('nl-NL')) + ' — verwijder beelden binnen 30 dagen)</span>' : '') + '</div><div class="tiny muted">Sinds ' + esc(new Date(k.at).toLocaleString('nl-NL')) + '</div>' : '<div class="tiny muted">Klant krijgt het scherm bij de volgende keer openen (nieuwe versie).</div>') + '</div>';
    return h + b; };
})();
