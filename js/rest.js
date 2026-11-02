/* Forged by Grace v3 — rest timer with sound, vibration, banner and notification. */
(function () {
  'use strict';
  var App = window.App, esc = App.esc, t = App.t, A = App.acts;
  var ctx = null, T = null, st = null;
  function soundOn() { try { return localStorage.getItem('fbg.restSound') !== 'off'; } catch (e) { return true; } }
  function setSound(on) { try { localStorage.setItem('fbg.restSound', on ? 'on' : 'off'); } catch (e) {} }
  App.unlockAudio = function () {
    try {
      var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      if (!ctx) ctx = new C();
      if (ctx.state === 'suspended') ctx.resume();
      var b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); // iOS unlock
    } catch (e) {}
  };
  function beep(freq, start, dur, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + start;
    o.type = 'sine'; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.6, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  App.restSound = function (kind) {
    if (!soundOn() || !ctx) return;
    try { if (ctx.state === 'suspended') ctx.resume(); } catch (e) {}
    try {
      if (kind === 'warn') beep(660, 0, 0.12, 0.35);
      else { beep(880, 0, 0.18); beep(880, 0.25, 0.18); beep(1320, 0.5, 0.45); }
    } catch (e) {}
  };
  function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function finish() {
    if (!st || st.done) return; st.done = true;
    App.restSound('end');
    try { if (navigator.vibrate) navigator.vibrate([300, 120, 300, 120, 500]); } catch (e) {}
    var bar = document.querySelector('.rest-bar');
    if (bar) {
      bar.classList.add('rest-done');
      bar.querySelector('.rest-inner').innerHTML = '<div class="grow"><b>⏱ Rust voorbij!</b><div class="tiny">Tijd voor je volgende set.</div></div><button class="btn sm primary" data-act="rest-skip">OK</button>';
    }
    document.body.classList.add('rest-flash'); setTimeout(function () { document.body.classList.remove('rest-flash'); }, 1600);
    if (document.hidden && window.Notification && Notification.permission === 'granted') {
      try {
        if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(function (r) { r.showNotification('Rust voorbij', { body: 'Tijd voor je volgende set 💪', tag: 'fbg-rest', icon: 'icons/icon-192.png' }); }).catch(function () {});
        else new Notification('Rust voorbij', { body: 'Tijd voor je volgende set 💪' });
      } catch (e) {}
    }
    clearTimeout(st.auto); st.auto = setTimeout(function () { App.stopRest(); }, 8000);
  }
  function tick() {
    if (!st) return;
    var el = document.getElementById('rt'); if (!el && !st.done) return App.stopRest();
    var left = Math.max(0, Math.ceil((st.end - Date.now()) / 1000));
    if (!st.done) {
      el.textContent = fmt(left);
      var pr = document.querySelector('.rest-prog'); if (pr) pr.style.width = (left / st.total * 100) + '%';
      if (left === 3 && !st.warned) { st.warned = true; App.restSound('warn'); }
      if (left <= 0) finish();
    }
  }
  App.restTimer = function (sec) {
    App.stopRest(); App.unlockAudio();
    st = { end: Date.now() + sec * 1000, total: sec, done: false, warned: false };
    var on = soundOn();
    var bar = document.createElement('div'); bar.className = 'rest-bar';
    bar.innerHTML = '<div class="rest-prog" style="width:100%"></div><div class="rest-inner"><div class="grow"><div class="tiny muted">' + esc(t('Rest')) + '</div><div class="timer" id="rt"></div></div>' +
      '<button class="btn sm ghost" data-act="rest-sound" aria-label="Geluid aan/uit" title="Geluid">' + (on ? '🔔' : '🔕') + '</button>' +
      '<button class="btn sm" data-act="rest-add">+15s</button><button class="btn sm primary" data-act="rest-skip">' + esc(t('Skip')) + '</button></div>';
    document.body.appendChild(bar);
    tick(); T = setInterval(tick, 250);
  };
  App.stopRest = function () { clearInterval(T); if (st) clearTimeout(st.auto); st = null; var b = document.querySelector('.rest-bar'); if (b) b.remove(); };
  A['rest-add'] = function () { if (!st || st.done) return; st.end += 15000; st.total += 15; st.warned = false; tick(); };
  A['rest-skip'] = function () { App.stopRest(); };
  A['rest-sound'] = function (el) {
    var on = !soundOn(); setSound(on); el.textContent = on ? '🔔' : '🔕'; App.unlockAudio();
    if (on) { App.restSound('warn'); App.toast('Geluid aan'); } else App.toast('Geluid uit');
    if (on && window.Notification && Notification.permission === 'default' && (window.navigator.standalone || matchMedia('(display-mode: standalone)').matches)) { try { Notification.requestPermission(); } catch (e) {} }
  };
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { App.unlockAudio(); tick(); } });
  // Unlock audio on any tap in the workout logger (iOS requires a user gesture)
  document.addEventListener('touchend', function () { if (document.getElementById('logger')) App.unlockAudio(); }, { passive: true });
  document.addEventListener('click', function () { if (document.getElementById('logger')) App.unlockAudio(); });
})();
