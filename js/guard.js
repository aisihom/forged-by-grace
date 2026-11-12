/* Forged by Grace — global error guard. Loaded first. Catches uncaught errors and promise rejections,
   shows one calm toast instead of a broken screen, and logs a short, scrubbed report to Supabase
   (table app_errors: clients can only insert). No personal data, no tokens, max 5 reports per session. */
(function () {
  'use strict';
  var URL_ = 'https://hdcpxmctilthjhdhhixw.supabase.co/rest/v1/app_errors';
  var KEY = 'sb_publishable_oFIIm1osyVtpV-t9PCjFxA_tkkQ9xUg';
  var sent = 0, seen = {}, lastToast = 0, toasts = 0, MAX = 5;
  var IGNORE = /ResizeObserver loop|^Script error\.?$|extension:\/\/|Load failed|Failed to fetch|NetworkError|The network connection was lost|AbortError|cancelled|Non-Error promise rejection/i;
  function scrub(s, n) {
    return String(s == null ? '' : s)
      .replace(/fbgh_[A-Za-z0-9_-]+/g, 'fbgh_***')
      .replace(/sb_(publishable|secret)_[A-Za-z0-9_-]+/g, 'sb_***')
      .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, 'jwt_***')
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '***@***')
      .replace(/([?&#](k|key|token|access_token|refresh_token|code)=)[^&#\s]*/gi, '$1***')
      .slice(0, n || 500);
  }
  function lang() { try { var s = JSON.parse(localStorage.getItem('fbg.state.v2') || '{}'); return s.lang || 'en'; } catch (e) { return 'en'; } }
  function role() { try { return (window.App && App.S && App.S.role) || ''; } catch (e) { return ''; } }
  function toast() {
    var now = Date.now(); if (now - lastToast < 60000 || toasts >= 2 || !document.body) return; lastToast = now; toasts++;
    var l = lang(), msg = l === 'nl' ? 'Er ging even iets mis. De app werkt gewoon door.' : l === 'es' ? 'Algo salió mal. La app sigue funcionando.' : 'Something went wrong. The app keeps working.';
    try { if (window.App && typeof App.toast === 'function') return App.toast(msg); } catch (e) {}
    var el = document.createElement('div'); el.setAttribute('role', 'status'); el.textContent = msg;
    el.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:10001;padding:10px 16px;border-radius:12px;border:1px solid #d4af37;background:#111;color:#f3d27a;font:600 14px system-ui,sans-serif;max-width:90vw';
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2600);
  }
  function report(kind, msg, src, line, col, stack, quiet) {
    try {
      msg = scrub(msg, 500);
      if (!msg || IGNORE.test(msg)) return;
      var sig = kind + '|' + msg + '|' + line; if (seen[sig]) return; seen[sig] = 1;
      window.FBG_ERRORS = window.FBG_ERRORS || []; window.FBG_ERRORS.push({ kind: kind, msg: msg, src: src, line: line });
      if (!quiet) toast();
      if (sent >= MAX || !window.fetch || !/^https:$/.test(location.protocol)) return;
      sent++;
      var body = {
        version: String((window.App && App.VERSION) || '').slice(0, 20), kind: kind, msg: msg,
        src: scrub(String(src || '').replace(/^.*\/forged-by-grace\//, ''), 200), line: +line || null, col: +col || null,
        stack: scrub(stack, 2000), route: scrub((location.hash || '').split('?')[0], 60), role: role(),
        ua: String(navigator.userAgent || '').slice(0, 200), standalone: !!(window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches))
      };
      fetch(URL_, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(body), keepalive: true }).catch(function () {});
    } catch (e) {}
  }
  window.FBG_REPORT = function (err, where, quiet) { report(where || 'caught', err && err.message || err, '', 0, 0, err && err.stack, quiet); };
  window.addEventListener('error', function (e) {
    if (e && e.target && e.target !== window && (e.target.src || e.target.href)) return; // broken image/script tags are handled where they load
    report('error', e && (e.message || (e.error && e.error.message)), e && e.filename, e && e.lineno, e && e.colno, e && e.error && e.error.stack);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    report('promise', r && r.message || r, '', 0, 0, r && r.stack, true); // logged quietly: most are background network hiccups
  });
})();
