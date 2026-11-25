'use strict';
// Rest timer: short Web Audio beep only, never steals the iPhone music session.
var fs = require('fs'), path = require('path'), assert = require('assert'), vm = require('vm');
var T = require('./lib/check');
var root = path.join(__dirname, '..');
var restSrc = fs.readFileSync(path.join(root, 'js/rest.js'), 'utf8');

T.check('index.html loads rest.js after views-athlete.js', function () {
  var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  var a = html.indexOf('js/views-athlete.js'), b = html.indexOf('js/rest.js');
  assert.ok(a !== -1 && b !== -1 && a < b);
});

T.check('views-athlete.js no longer defines a silent restTimer of its own', function () {
  var src = fs.readFileSync(path.join(root, 'js/views-athlete.js'), 'utf8');
  assert.ok(src.indexOf('App.restTimer =') === -1);
  assert.ok(src.indexOf('App.stopRest =') === -1);
  assert.ok(/App\.restTimer\(it\.target\.rest\)/.test(src));
});

T.check('core.js does not auto-reload a new service worker during a workout or rest', function () {
  var src = fs.readFileSync(path.join(root, 'js/core.js'), 'utf8');
  assert.ok(/controllerchange[\s\S]*#logger,\.rest-bar/.test(src));
});

T.check('service worker focuses the app when a rest notification is tapped', function () {
  var src = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.ok(/addEventListener\('notificationclick'/.test(src));
  assert.ok(/clients\.openWindow/.test(src));
});

T.check('rest.js does not use HTML audio, Media Session, or a background WAV', function () {
  assert.ok(!/\bnew Audio\b/.test(restSrc));
  assert.ok(!/mediaSession/.test(restSrc));
  assert.ok(!/MediaMetadata/.test(restSrc));
  assert.ok(!/makeRestWav/.test(restSrc));
  assert.ok(!/createObjectURL/.test(restSrc));
  assert.ok(!/audio\/wav/.test(restSrc));
  assert.ok(!/keepAudio/.test(restSrc));
  assert.ok(/audioSession\.type = 'ambient'/.test(restSrc));
  assert.ok(/wakeLock\.request\('screen'\)/.test(restSrc));
  assert.ok(/createOscillator/.test(restSrc));
  assert.ok(/linearRampToValueAtTime/.test(restSrc));
  assert.ok(/o\.type = 'sine'/.test(restSrc));
});

T.check('rest.js schedules and cancels a server-side web push, and never embeds a private VAPID key', function () {
  assert.ok(/rest_alert_schedule/.test(restSrc));
  assert.ok(/rest_alert_cancel/.test(restSrc));
  assert.ok(/pushManager\.subscribe/.test(restSrc));
  assert.ok(/userVisibleOnly: true/.test(restSrc));
  assert.ok(/VAPID_PUBLIC/.test(restSrc));
  assert.ok(!/privateJwk|private_key|BEGIN EC PRIVATE|\\"d\":/.test(restSrc));
  assert.ok(/Notification\.requestPermission/.test(restSrc));
  // Permission is only requested when the bell is turned on, not when a rest starts.
  var start = restSrc.indexOf('App.restTimer =');
  var bell = restSrc.indexOf("A['rest-sound']");
  assert.ok(start !== -1 && bell !== -1);
  assert.ok(!/requestPermission/.test(restSrc.slice(start, bell)));
  assert.ok(/requestPermission/.test(restSrc.slice(bell)));
});

T.check('service worker shows Rust voorbij! from a push event', function () {
  var src = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.ok(/addEventListener\('push'/.test(src));
  assert.ok(/Rust voorbij/.test(src));
  assert.ok(/addEventListener\('notificationclick'/.test(src));
});

T.check('rest_alerts.sql is locked down and has no private key', function () {
  var src = fs.readFileSync(path.join(root, 'supabase/rest_alerts.sql'), 'utf8');
  assert.ok(/enable row level security/.test(src));
  assert.ok(/revoke all on private\.rest_alerts from public, anon, authenticated/.test(src));
  assert.ok(/grant execute on function public\.rest_alert_claim\(\) to service_role/.test(src));
  assert.ok(/auth\.role\(\) is distinct from 'service_role'/.test(src));
  assert.ok(/cron\.schedule\('fbg-rest-alerts'/.test(src));
  assert.ok(/private\.rest_alert_tick/.test(src));
  assert.ok(!/BEGIN EC PRIVATE|privateJwk|"kty":"EC"/.test(src));
});

function fakeWindow() {
  var els = {}, bars = [], hidden = false, audioBuilt = 0, tones = [], wakes = 0, sessionType = 'auto', fetches = [];

  function node(tag) {
    var self = {
      tagName: String(tag).toUpperCase(),
      id: '',
      className: '',
      style: {},
      _html: '',
      children: [],
      classList: {
        add: function (c) { self.className = (self.className + ' ' + c).trim(); },
        remove: function (c) { self.className = self.className.split(/\s+/).filter(function (x) { return x && x !== c; }).join(' '); }
      },
      setAttribute: function () {},
      removeAttribute: function () {},
      getElementById: gid,
      querySelector: function (sel) { return find(self, sel); },
      appendChild: function (c) { self.children.push(c); if (c.id) els[c.id] = c; return c; },
      remove: function () {
        if (self.id) delete els[self.id];
        bars = bars.filter(function (b) { return b !== self; });
        if (self.id === 'rt') delete els.rt;
      }
    };
    Object.defineProperty(self, 'innerHTML', {
      configurable: true,
      get: function () { return self._html; },
      set: function (v) { self._html = String(v); fill(self); }
    });
    Object.defineProperty(self, 'textContent', {
      configurable: true,
      get: function () { return self._text || ''; },
      set: function (v) { self._text = String(v); }
    });
    return self;
  }

  function fill(el) {
    el.children = [];
    var html = el._html || '';
    if (/rest-prog/.test(html) || el.className.indexOf('rest-bar') !== -1) {
      var prog = node('div'); prog.className = 'rest-prog'; prog.style = { width: '100%' };
      var inner = node('div'); inner.className = 'rest-inner';
      if (/id="rt"/.test(html)) { var rt = node('div'); rt.id = 'rt'; els.rt = rt; inner.appendChild(rt); }
      el.children.push(prog, inner);
    }
  }

  function walk(n, acc) { acc.push(n); (n.children || []).forEach(function (c) { walk(c, acc); }); return acc; }
  function find(root, sel) {
    var all = walk(root, []);
    if (sel === '.rest-bar') return all.filter(function (e) { return /\brest-bar\b/.test(e.className); })[0] || null;
    if (sel === '.rest-bar.rest-done') return all.filter(function (e) { return /\brest-bar\b/.test(e.className) && /\brest-done\b/.test(e.className); })[0] || null;
    if (sel === '.rest-prog') return all.filter(function (e) { return /\brest-prog\b/.test(e.className); })[0] || null;
    if (sel === '.rest-inner') return all.filter(function (e) { return /\brest-inner\b/.test(e.className); })[0] || null;
    return null;
  }
  function gid(id) { return els[id] || null; }

  var body = node('body');
  var document = {
    body: body,
    getElementById: gid,
    querySelector: function (sel) {
      if (sel === '.rest-bar') return bars[0] || null;
      if (sel === '.rest-bar.rest-done') return bars.filter(function (b) { return /\brest-done\b/.test(b.className); })[0] || null;
      if (sel === '.rest-prog') return bars[0] ? find(bars[0], '.rest-prog') : null;
      return find(body, sel);
    },
    createElement: function (tag) { return node(tag); },
    addEventListener: function () {}
  };
  Object.defineProperty(document, 'hidden', { get: function () { return hidden; }, set: function (v) { hidden = v; }, configurable: true });
  body.appendChild = function (c) {
    if (/\brest-bar\b/.test(c.className) && bars.indexOf(c) === -1) bars.push(c);
    body.children.push(c); if (c.id) els[c.id] = c; if (c._html) fill(c); return c;
  };

  function Audio() { audioBuilt++; throw new Error('HTML Audio must not be used'); }

  var now = 0;
  function AudioContext() {
    this.state = 'running';
    this.sampleRate = 44100;
    this.destination = {};
    this.resume = function () { this.state = 'running'; return Promise.resolve(); };
    this.createOscillator = function () {
      var tone = { type: '', freq: 0, started: false, stopped: false, _g: null };
      var osc = {
        type: 'sine',
        frequency: { value: 0, setValueAtTime: function (v) { tone.freq = v; osc.frequency.value = v; } },
        connect: function (g) { tone._g = g; },
        start: function (t) { tone.started = true; tone.at = t; tone.type = osc.type; tones.push(tone); },
        stop: function (t) { tone.stopped = true; tone.stopAt = t; }
      };
      return osc;
    };
    this.createGain = function () {
      var ramps = [];
      return {
        ramps: ramps,
        connect: function () {},
        gain: {
          setValueAtTime: function (v, t) { ramps.push({ op: 'set', v: v, t: t }); },
          linearRampToValueAtTime: function (v, t) { ramps.push({ op: 'lin', v: v, t: t }); },
          exponentialRampToValueAtTime: function () { throw new Error('exponential ramps can click or whistle; use linear fades'); }
        }
      };
    };
  }
  Object.defineProperty(AudioContext.prototype, 'currentTime', { get: function () { return now; } });

  var ctx = {
    window: null,
    document: document,
    localStorage: { getItem: function () { return null; }, setItem: function () {} },
    Notification: { permission: 'default', requestPermission: function () { return Promise.resolve('granted'); } },
    navigator: {
      vibrate: function () {},
      wakeLock: { request: function (type) { assert.strictEqual(type, 'screen'); wakes++; return Promise.resolve({ release: function () { return Promise.resolve(); } }); } },
      standalone: true,
      audioSession: { get type() { return sessionType; }, set type(v) { sessionType = v; } },
      serviceWorker: {
        ready: Promise.resolve({
          showNotification: function () { return Promise.resolve(); },
          pushManager: {
            getSubscription: function () { return Promise.resolve(null); },
            subscribe: function (opts) {
              assert.strictEqual(opts.userVisibleOnly, true);
              assert.ok(opts.applicationServerKey);
              return Promise.resolve({
                endpoint: 'https://web.push.apple.com/fbg-test',
                toJSON: function () { return { endpoint: 'https://web.push.apple.com/fbg-test', keys: { p256dh: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', auth: 'BBBBBBBBBBBBBBBBBBBBBB' } }; }
              });
            }
          }
        })
      },
    },
    PushManager: function () {},
    matchMedia: function () { return { matches: true }; },
    Audio: Audio,
    AudioContext: AudioContext,
    setTimeout: setTimeout,
    setInterval: setInterval,
    clearTimeout: clearTimeout,
    clearInterval: clearInterval,
    Date: Date,
    Math: Math,
    Promise: Promise,
    console: console,
    App: { esc: function (s) { return String(s); }, t: function (s) { return s; }, acts: {}, toast: function () {} },
    fetch: function (url, opts) {
      var body = {};
      try { body = JSON.parse(opts && opts.body || '{}'); } catch (e) {}
      fetches.push({ url: String(url), body: body, keepalive: !!(opts && opts.keepalive) });
      var name = String(url);
      var ret = name.indexOf('rest_alert_schedule') !== -1 ? 'alert-1' : (name.indexOf('rest_alert_reschedule') !== -1 ? 'alert-1' : true);
      return Promise.resolve({ ok: true, json: function () { return Promise.resolve(ret); }, text: function () { return Promise.resolve(JSON.stringify(ret)); } });
    }
  };
  ctx.window = ctx;
  ctx.webkitAudioContext = ctx.AudioContext;
  var builtins = {
    JSON: JSON, atob: atob, btoa: btoa, Uint8Array: Uint8Array, Int16Array: Int16Array,
    ArrayBuffer: ArrayBuffer, URL: URL, TextEncoder: TextEncoder, Number: Number, String: String,
    Boolean: Boolean, Array: Array, Object: Object, parseInt: parseInt, parseFloat: parseFloat,
    isNaN: isNaN, encodeURIComponent: encodeURIComponent, decodeURIComponent: decodeURIComponent,
    Infinity: Infinity, NaN: NaN
  };
  Object.keys(builtins).forEach(function (k) { ctx[k] = builtins[k]; });
  Object.defineProperty(ctx, '_audioBuilt', { get: function () { return audioBuilt; } });
  Object.defineProperty(ctx, '_tones', { get: function () { return tones; } });
  Object.defineProperty(ctx, '_wakes', { get: function () { return wakes; } });
  Object.defineProperty(ctx, '_sessionType', { get: function () { return sessionType; } });
  Object.defineProperty(ctx, '_fetches', { get: function () { return fetches; } });
  return ctx;
}

function loadRest(ctx) {
  vm.runInNewContext(restSrc, ctx);
  return ctx.App;
}

T.check('starting a rest timer does not take over audio or play a sound', function () {
  var ctx = fakeWindow();
  var App = loadRest(ctx);
  App.restTimer(90);
  assert.ok(ctx.document.getElementById('rt'), 'rest bar is on screen');
  assert.strictEqual(ctx._audioBuilt, 0, 'no HTML Audio element');
  assert.strictEqual(ctx._tones.length, 0, 'no beep at timer start');
  assert.ok(ctx._wakes >= 1, 'screen wake lock requested');
  assert.strictEqual(ctx._sessionType, 'ambient', 'mixes with other music');
  App.stopRest();
});

T.check('the end beep is a clean, faded sine via Web Audio', function () {
  var ctx = fakeWindow();
  var App = loadRest(ctx);
  App.restSound('end');
  assert.strictEqual(ctx._audioBuilt, 0);
  assert.strictEqual(ctx._tones.length, 3);
  assert.deepStrictEqual(ctx._tones.map(function (x) { return x.freq; }), [880, 880, 1320]);
  ctx._tones.forEach(function (tone) {
    assert.strictEqual(tone.type, 'sine');
    assert.ok(tone.started && tone.stopped);
    var ramps = tone._g.ramps;
    assert.ok(ramps.length >= 3, 'fade envelope present');
    assert.strictEqual(ramps[0].op, 'set');
    assert.strictEqual(ramps[0].v, 0);
    assert.ok(ramps.some(function (r) { return r.op === 'lin' && r.v > 0 && r.v <= 0.3; }), 'peaks at a modest volume');
    assert.strictEqual(ramps[ramps.length - 1].op, 'lin');
    assert.strictEqual(ramps[ramps.length - 1].v, 0);
  });
  assert.strictEqual(ctx._sessionType, 'ambient');
});

var jobs = [];
jobs.push(Promise.resolve().then(function () {
  var ctx = fakeWindow();
  var shown = [];
  ctx.Notification.permission = 'granted';
  ctx.document.hidden = true;
  ctx.navigator.serviceWorker.ready = Promise.resolve({
    showNotification: function (title, opts) { shown.push({ title: title, opts: opts }); return Promise.resolve(); }
  });
  var App = loadRest(ctx);
  App.restTimer(1);
  assert.ok(ctx.document.getElementById('rt'), 'rest bar is on screen');
  assert.strictEqual(ctx._audioBuilt, 0);
  assert.strictEqual(ctx._tones.length, 0, 'still silent at the start of a 1s rest');
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      try {
        assert.ok(ctx.document.querySelector('.rest-bar.rest-done'), 'done banner is shown');
        assert.ok(ctx._tones.length >= 3, 'end chime played through Web Audio');
        return Promise.resolve(ctx.navigator.serviceWorker.ready).then(function () {
          return new Promise(function (ok) { setTimeout(ok, 20); });
        }).then(function () {
          assert.strictEqual(shown.length, 1, 'notification count ' + shown.length);
          assert.strictEqual(shown[0].title, 'Rust voorbij!');
          App.stopRest();
          console.log('ok    when the rest ends in the background, a notification is shown');
          resolve();
        });
      } catch (e) { reject(e); }
    }, 1400);
  });
}));


jobs.push(Promise.resolve().then(function () {
  var ctx = fakeWindow();
  ctx.Notification.permission = 'granted';
  var App = loadRest(ctx);
  App.restTimer(90);
  assert.strictEqual(ctx._audioBuilt, 0);
  assert.strictEqual(ctx._tones.length, 0);
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      try {
        var sched = ctx._fetches.filter(function (f) { return /rest_alert_schedule/.test(f.url); });
        assert.strictEqual(sched.length, 1, 'one schedule call, got ' + ctx._fetches.map(function (f) { return f.url; }).join(','));
        assert.ok(sched[0].body.p_fire_at);
        assert.strictEqual(sched[0].body.p_endpoint, 'https://web.push.apple.com/fbg-test');
        assert.ok(sched[0].body.p_p256dh && sched[0].body.p_auth);
        App.stopRest();
        setTimeout(function () {
          try {
            var cancels = ctx._fetches.filter(function (f) { return /rest_alert_cancel/.test(f.url); });
            assert.ok(cancels.length >= 1, 'skip/stop cancels the scheduled push');
            assert.strictEqual(cancels[0].body.p_id, 'alert-1');
            console.log('ok    rest start schedules a web push and skip cancels it');
            resolve();
          } catch (e) { reject(e); }
        }, 30);
      } catch (e) { reject(e); }
    }, 40);
  });
}));

T.done('rest-timer (sync)');

Promise.all(jobs).then(function () {
  console.log('rest-timer (async): ' + jobs.length + ' passed, 0 failed');
}).catch(function (e) {
  console.error('FAIL  rest-timer (async)\n      ' + (e && e.stack || e));
  process.exitCode = 1;
});
