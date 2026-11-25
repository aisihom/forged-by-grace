'use strict';
// Rest timer: the end chime lives in a WAV so a locked iPhone can still hear it; rest.js must be the only timer.
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

function fakeWindow() {
  var els = {}, bars = [], hidden = false, audio = null;

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
    if (sel === '#rt' || sel === 'rt') return els.rt || null;
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
    return node.prototype, (function () { body.children.push(c); if (c.id) els[c.id] = c; if (c._html) fill(c); return c; }());
  };

  function Audio() {
    audio = this;
    this.src = ''; this.loop = false; this.volume = 1; this.ended = false; this.currentTime = 0; this.preload = '';
    this.setAttribute = function () {};
    this.removeAttribute = function () {};
    this.play = function () { return Promise.resolve(); };
    this.pause = function () {};
    this.load = function () {};
  }

  var ctx = {
    window: null,
    document: document,
    localStorage: { getItem: function () { return null; }, setItem: function () {} },
    Notification: { permission: 'default', requestPermission: function () { return Promise.resolve('granted'); } },
    navigator: {
      vibrate: function () {},
      serviceWorker: { ready: Promise.resolve({ showNotification: function () { return Promise.resolve(); } }) },
      wakeLock: null,
      standalone: true,
      mediaSession: null
    },
    matchMedia: function () { return { matches: true }; },
    Audio: Audio,
    AudioContext: function () {
      this.state = 'running'; this.currentTime = 0; this.destination = {};
      this.resume = function () { return Promise.resolve(); };
      this.createBuffer = function () { return {}; };
      this.createBufferSource = function () { return { connect: function () {}, start: function () {}, buffer: null }; };
      this.createOscillator = function () { return { connect: function () {}, start: function () {}, stop: function () {}, frequency: { value: 0 }, type: 'sine' }; };
      this.createGain = function () { return { connect: function () {}, gain: { setValueAtTime: function () {}, exponentialRampToValueAtTime: function () {} } }; };
    },
    URL: { createObjectURL: function () { return 'blob:rest'; }, revokeObjectURL: function () {} },
    Blob: Blob,
    ArrayBuffer: ArrayBuffer,
    Int16Array: Int16Array,
    Uint8Array: Uint8Array,
    DataView: DataView,
    MediaMetadata: function (o) { this.title = o.title; this.artist = o.artist; },
    setTimeout: setTimeout,
    setInterval: setInterval,
    clearTimeout: clearTimeout,
    clearInterval: clearInterval,
    Date: Date,
    Math: Math,
    Promise: Promise,
    console: console,
    App: { esc: function (s) { return String(s); }, t: function (s) { return s; }, acts: {}, toast: function () {} }
  };
  ctx.window = ctx;
  ctx.webkitAudioContext = ctx.AudioContext;
  Object.defineProperty(ctx, '_audio', { get: function () { return audio; } });
  Object.defineProperty(ctx, '_bars', { get: function () { return bars; } });
  return ctx;
}

function loadRest(ctx) {
  vm.runInNewContext(restSrc, ctx);
  return ctx.App;
}

var jobs = [];

jobs.push(Promise.resolve().then(function () {
  var ctx = fakeWindow();
  var App = loadRest(ctx);
  var blob = App.makeRestWav(5, true);
  assert.ok(blob && blob.size > 44);
  return blob.arrayBuffer().then(function (buf) {
    var u8 = new Uint8Array(buf), v = new DataView(buf);
    assert.strictEqual(String.fromCharCode(u8[0], u8[1], u8[2], u8[3]), 'RIFF');
    assert.strictEqual(String.fromCharCode(u8[8], u8[9], u8[10], u8[11]), 'WAVE');
    var rate = v.getUint32(24, true), n = (buf.byteLength - 44) / 2;
    assert.strictEqual(rate, 22050);
    var sec = n / rate;
    assert.ok(sec > 6 && sec < 6.5, 'duration ' + sec);
    var samples = new Int16Array(buf, 44);
    function peak(fromSec, toSec) {
      var a = Math.floor(fromSec * rate), b = Math.min(samples.length, Math.floor(toSec * rate)), m = 0, i;
      for (i = a; i < b; i++) { var x = Math.abs(samples[i]); if (x > m) m = x; }
      return m;
    }
    assert.ok(peak(0, 4.5) < 500, 'body stays faint, got ' + peak(0, 4.5));
    assert.ok(peak(5, 6.1) > 10000, 'chime is loud at t=5s, got ' + peak(5, 6.1));
    console.log('ok    makeRestWav is a valid WAV whose chime starts at the rest length');
  });
}));

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
  assert.ok(ctx._audio && ctx._audio.src, 'keepalive audio starts on the user gesture');
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      try {
        assert.ok(ctx.document.querySelector('.rest-bar.rest-done'), 'done banner is shown');
        return Promise.resolve(ctx.navigator.serviceWorker.ready).then(function () {
          // showNotification is chained on ready; give the then() a tick
          return new Promise(function (ok) { setTimeout(ok, 20); });
        }).then(function () {
          assert.strictEqual(shown.length, 1, 'notification count ' + shown.length);
          assert.strictEqual(shown[0].title, 'Rust voorbij');
          App.stopRest();
          console.log('ok    when the rest ends in the background, a notification is shown');
          resolve();
        });
      } catch (e) { reject(e); }
    }, 1400);
  });
}));

T.done('rest-timer (sync)');

Promise.all(jobs).then(function () {
  console.log('rest-timer (async): 2 passed, 0 failed');
}).catch(function (e) {
  console.error('FAIL  rest-timer (async)\n      ' + (e && e.stack || e));
  process.exitCode = 1;
});
