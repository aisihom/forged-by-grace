/* Forged by Grace v3 — rest timer with sound, vibration, banner and notification. */
(function () {
  'use strict';
  var App = window.App, esc = App.esc, t = App.t, A = App.acts;
  var ctx = null, T = null, st = null, keepAudio = null, keepUrl = null, wake = null;

  function soundOn() { try { return localStorage.getItem('fbg.restSound') !== 'off'; } catch (e) { return true; } }
  function setSound(on) { try { localStorage.setItem('fbg.restSound', on ? 'on' : 'off'); } catch (e) {} }
  function standalone() { return !!(window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches)); }

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

  // WAV rest track: faint dither so iOS keeps the PWA alive, then the end chime.
  // The chime is in the file itself, so it still plays if JavaScript is frozen behind a locked screen.
  App.makeRestWav = function (sec, withChime) {
    var rate = 22050, pad = withChime ? 1.2 : 0.25, n = Math.max(rate, Math.ceil((sec + pad) * rate));
    var data = new Int16Array(n), i;
    function tone(at, dur, freq, vol) {
      var i0 = Math.max(0, Math.floor(at * rate)), i1 = Math.min(n, Math.floor((at + dur) * rate)), j, env, t, v;
      for (j = i0; j < i1; j++) {
        t = (j - i0) / rate;
        env = Math.min(1, t / 0.02, Math.max(0, (dur - t) / 0.05));
        v = data[j] + Math.round(32767 * vol * env * Math.sin(2 * Math.PI * freq * (j / rate)));
        data[j] = v > 32767 ? 32767 : (v < -32768 ? -32768 : v);
      }
    }
    for (i = 0; i < n; i++) data[i] = ((i * 1103515245 + 12345) >>> 16) % 161 - 80; // deterministic faint dither
    if (withChime) { tone(sec, 0.18, 880, 0.6); tone(sec + 0.25, 0.18, 880, 0.6); tone(sec + 0.5, 0.45, 1320, 0.6); }
    var bytes = data.byteLength, buf = new ArrayBuffer(44 + bytes), v = new DataView(buf);
    function str(o, s) { for (var k = 0; k < s.length; k++) v.setUint8(o + k, s.charCodeAt(k)); }
    str(0, 'RIFF'); v.setUint32(4, 36 + bytes, true); str(8, 'WAVE'); str(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, 'data'); v.setUint32(40, bytes, true);
    new Uint8Array(buf).set(new Uint8Array(data.buffer), 44);
    return new Blob([buf], { type: 'audio/wav' });
  };

  function dropWake() { try { if (wake) wake.release(); } catch (e) {} wake = null; }
  function takeWake() {
    dropWake();
    if (!st || st.done || !navigator.wakeLock || !navigator.wakeLock.request) return;
    try { navigator.wakeLock.request('screen').then(function (g) { wake = g; }).catch(function () {}); } catch (e) {}
  }
  function dropAudio() {
    try { if (keepAudio) { keepAudio.pause(); keepAudio.removeAttribute('src'); keepAudio.load(); } } catch (e) {}
    try { if (keepUrl) URL.revokeObjectURL(keepUrl); } catch (e) {}
    keepUrl = null;
  }
  function armAudio() {
    if (!st || st.done) return;
    var left = Math.max(1, Math.ceil((st.end - Date.now()) / 1000));
    dropAudio();
    try {
      keepUrl = URL.createObjectURL(App.makeRestWav(left, soundOn()));
      if (!keepAudio) {
        keepAudio = new Audio();
        keepAudio.setAttribute('playsinline', '');
        keepAudio.setAttribute('webkit-playsinline', '');
        keepAudio.preload = 'auto';
      }
      keepAudio.src = keepUrl;
      keepAudio.loop = false;
      keepAudio.volume = 1;
      st.audioSec = left;
      var p = keepAudio.play();
      if (p && p.catch) p.catch(function () {});
      if (navigator.mediaSession) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({ title: 'Rust ' + fmt(left), artist: 'Forged by Grace', artwork: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }] });
          navigator.mediaSession.playbackState = 'playing';
        } catch (e) {}
      }
    } catch (e) {}
    takeWake();
  }
  function audioAlreadyChiming() {
    if (!keepAudio || !st) return false;
    try { return keepAudio.ended || (keepAudio.currentTime >= Math.max(0, (st.audioSec || st.total) - 0.05)); } catch (e) { return false; }
  }

  function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function finish() {
    if (!st || st.done) return; st.done = true;
    dropWake();
    if (!audioAlreadyChiming()) App.restSound('end');
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
      if (navigator.mediaSession && navigator.mediaSession.metadata) {
        try { navigator.mediaSession.metadata = new MediaMetadata({ title: 'Rust ' + fmt(left), artist: 'Forged by Grace', artwork: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }] }); } catch (e) {}
      }
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
    armAudio();
    tick(); T = setInterval(tick, 250);
  };
  App.stopRest = function () { clearInterval(T); if (st) clearTimeout(st.auto); st = null; dropWake(); dropAudio(); var b = document.querySelector('.rest-bar'); if (b) b.remove(); };
  A['rest-add'] = function () { if (!st || st.done) return; st.end += 15000; st.total += 15; st.warned = false; armAudio(); tick(); };
  A['rest-skip'] = function () { App.stopRest(); };
  A['rest-sound'] = function (el) {
    var on = !soundOn(); setSound(on); el.textContent = on ? '🔔' : '🔕'; App.unlockAudio();
    if (st && !st.done) armAudio();
    if (on) { App.restSound('warn'); App.toast('Geluid aan'); } else App.toast('Geluid uit');
    if (on && window.Notification && Notification.permission === 'default' && standalone()) { try { Notification.requestPermission(); } catch (e) {} }
  };
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { App.unlockAudio(); takeWake(); tick(); }
  });
  // Unlock audio on any tap in the workout logger (iOS requires a user gesture)
  document.addEventListener('touchend', function () { if (document.getElementById('logger')) App.unlockAudio(); }, { passive: true });
  document.addEventListener('click', function () { if (document.getElementById('logger')) App.unlockAudio(); });
})();
