/* Forged by Grace v3 — rest timer with sound, vibration, banner and notification. */
(function () {
  'use strict';
  var App = window.App, esc = App.esc, t = App.t, A = App.acts;
  var ctx = null, T = null, st = null, wake = null;

  function soundOn() { try { return localStorage.getItem('fbg.restSound') !== 'off'; } catch (e) { return true; } }
  function setSound(on) { try { localStorage.setItem('fbg.restSound', on ? 'on' : 'off'); } catch (e) {} }
  function standalone() { return !!(window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches)); }

  // Public VAPID key only (private key is in Supabase vault). Used to subscribe this iPhone for rest-end push.
  var VAPID_PUBLIC = 'BOcamn0OA-NwwX-iZjmdRTbQgKV5FiMP5mvrRwn7kr9ZvVb13-BiQTdGbCu4VLN6OXEf7kdtVbxlbqYhx2g_WXk';
  var SB_URL = 'https://hdcpxmctilthjhdhhixw.supabase.co';
  var SB_KEY = 'sb_publishable_oFIIm1osyVtpV-t9PCjFxA_tkkQ9xUg';
  var alertId = null, alertGen = 0;

  function b64urlToBytes(s) {
    var pad = '===='.slice((s.length % 4) || 4), b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(b64), out = new Uint8Array(raw.length), i;
    for (i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function rpc(name, body, keepalive) {
    return fetch(SB_URL + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      keepalive: !!keepalive
    }).then(function (r) {
      if (!r.ok) return null;
      return r.text().then(function (t) { try { return t ? JSON.parse(t) : true; } catch (e) { return t || true; } });
    }).catch(function () { return null; });
  }
  function subscribePush() {
    if (!standalone() || !soundOn()) return Promise.resolve(null);
    if (!window.Notification || Notification.permission !== 'granted') return Promise.resolve(null);
    if (!navigator.serviceWorker || !window.PushManager) return Promise.resolve(null);
    return navigator.serviceWorker.ready.then(function (reg) {
      if (!reg.pushManager) return null;
      return reg.pushManager.getSubscription().then(function (existing) {
        if (existing) return existing;
        return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64urlToBytes(VAPID_PUBLIC) });
      });
    }).catch(function () { return null; });
  }
  function cancelRestAlert() {
    alertGen++;
    var id = alertId; alertId = null;
    if (id) rpc('rest_alert_cancel', { p_id: id }, true);
  }
  function scheduleRestAlert() {
    if (!st || st.done || !soundOn()) return;
    var gen = ++alertGen, end = st.end;
    subscribePush().then(function (sub) {
      if (!sub || gen !== alertGen || !st || st.done) return;
      var j = sub.toJSON ? sub.toJSON() : sub;
      var keys = j.keys || {};
      return rpc('rest_alert_schedule', {
        p_fire_at: new Date(end).toISOString(),
        p_endpoint: j.endpoint,
        p_p256dh: keys.p256dh,
        p_auth: keys.auth
      }).then(function (id) { if (gen === alertGen && id) alertId = id; });
    });
  }
  function rescheduleRestAlert() {
    if (!st || st.done) return;
    if (!alertId) { scheduleRestAlert(); return; }
    var gen = alertGen, id = alertId, end = st.end;
    rpc('rest_alert_reschedule', { p_id: id, p_fire_at: new Date(end).toISOString() }).then(function (got) {
      if (gen !== alertGen) return;
      if (!got) scheduleRestAlert();
    });
  }

  // Prefer mixing with music already playing (Spotify, Apple Music, etc.).
  // WebKit's audioSession is the iPhone switch that stops a page from taking over Now Playing.
  function preferMix() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) {}
  }

  App.unlockAudio = function () {
    preferMix();
    try {
      var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      if (!ctx) ctx = new C();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
  };

  // Clean sine beep: linear fade in/out, volume well below clipping, context sample rate.
  function beep(freq, start, dur, vol) {
    if (!ctx) return;
    vol = vol == null ? 0.22 : vol;
    var attack = Math.min(0.012, dur / 4), release = Math.min(0.05, dur / 3);
    var o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + start;
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t0);
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.setValueAtTime(vol, t0 + Math.max(attack, dur - release));
    g.gain.linearRampToValueAtTime(0, t0 + dur);
    o.start(t0);
    o.stop(t0 + dur + 0.01);
  }

  App.restSound = function (kind) {
    if (!soundOn()) return;
    preferMix();
    try { if (!ctx) App.unlockAudio(); else if (ctx.state === 'suspended') ctx.resume(); } catch (e) {}
    if (!ctx) return;
    try {
      if (kind === 'warn') beep(660, 0, 0.12, 0.16);
      else { beep(880, 0, 0.16, 0.22); beep(880, 0.22, 0.16, 0.22); beep(1320, 0.44, 0.36, 0.22); }
    } catch (e) {}
  };

  function dropWake() { try { if (wake) wake.release(); } catch (e) {} wake = null; }
  function takeWake() {
    if (!st || st.done || !navigator.wakeLock || !navigator.wakeLock.request) return;
    try {
      navigator.wakeLock.request('screen').then(function (g) { wake = g; }).catch(function () {});
    } catch (e) {}
  }

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
    // If this page is still running, cancel the scheduled push to avoid a duplicate
    // and (when hidden) show a local notification. If iOS already froze the page,
    // finish() never runs and the server push is what arrives.
    cancelRestAlert();
    if (document.hidden && window.Notification && Notification.permission === 'granted') {
      try {
        if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(function (r) { r.showNotification('Rust voorbij!', { body: 'Tijd voor je volgende set 💪', tag: 'fbg-rest', icon: 'icons/icon-192.png' }); }).catch(function () {});
        else new Notification('Rust voorbij!', { body: 'Tijd voor je volgende set 💪' });
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
    App.stopRest();
    preferMix();
    App.unlockAudio();
    st = { end: Date.now() + sec * 1000, total: sec, done: false, warned: false };
    var on = soundOn();
    var bar = document.createElement('div'); bar.className = 'rest-bar';
    bar.innerHTML = '<div class="rest-prog" style="width:100%"></div><div class="rest-inner"><div class="grow"><div class="tiny muted">' + esc(t('Rest')) + '</div><div class="timer" id="rt"></div></div>' +
      '<button class="btn sm ghost" data-act="rest-sound" aria-label="Geluid aan/uit" title="Geluid">' + (on ? '🔔' : '🔕') + '</button>' +
      '<button class="btn sm" data-act="rest-add">+15s</button><button class="btn sm primary" data-act="rest-skip">' + esc(t('Skip')) + '</button></div>';
    document.body.appendChild(bar);
    takeWake();
    scheduleRestAlert();
    tick(); T = setInterval(tick, 250);
  };
  App.stopRest = function () { clearInterval(T); if (st) clearTimeout(st.auto); st = null; dropWake(); cancelRestAlert(); var b = document.querySelector('.rest-bar'); if (b) b.remove(); };
  A['rest-add'] = function () { if (!st || st.done) return; st.end += 15000; st.total += 15; st.warned = false; takeWake(); rescheduleRestAlert(); tick(); };
  A['rest-skip'] = function () { App.stopRest(); };
  A['rest-sound'] = function (el) {
    var on = !soundOn(); setSound(on); el.textContent = on ? '🔔' : '🔕';
    if (on) {
      App.restSound('warn'); App.toast('Geluid aan');
      if (window.Notification && standalone()) {
        var go = function (p) { if (p === 'granted') subscribePush(); };
        if (Notification.permission === 'default') Notification.requestPermission().then(go).catch(function () {});
        else go(Notification.permission);
      }
    } else App.toast('Geluid uit');
  };
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { preferMix(); takeWake(); tick(); }
  });
})();
