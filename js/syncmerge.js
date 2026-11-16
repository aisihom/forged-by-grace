/* Forged by Grace — merge-safe sync (v3.32). A phone may NEVER overwrite good server data with an empty or
   older copy (e.g. a freshly installed home-screen app). Before the first push of a session, cloud.js pulls the
   client's own rows and merges them in here: server-only items are ADDED, nothing local is removed.
   Rows this device wrote itself (server updated_at <= our last push stamp) are skipped, so local deletes stay deleted.
   Pure functions; also loaded by test/sync-merge.js in node. */
(function (root) {
  'use strict';
  function isObj(v) { return v != null && typeof v === 'object' && !Array.isArray(v); }
  function empty(v) { if (v == null) return true; if (Array.isArray(v)) return !v.length; if (isObj(v)) return !Object.keys(v).length; return v === ''; }
  function keyOf(x, field) { if (x == null) return 'n'; if (typeof x !== 'object') return 'v:' + JSON.stringify(x); return x[field] != null ? 'k:' + x[field] : 'j:' + JSON.stringify(x); }
  function unionBy(local, server, field, sortFn) {
    local = Array.isArray(local) ? local : []; server = Array.isArray(server) ? server : [];
    var seen = {}, out = local.slice(), added = 0;
    local.forEach(function (x) { seen[keyOf(x, field)] = 1; });
    server.forEach(function (x) { var k = keyOf(x, field); if (!seen[k]) { seen[k] = 1; out.push(x); added++; } });
    if (added && sortFn) out.sort(sortFn);
    return { v: out, added: added };
  }
  // object keyed by day ('2026-11-16'): days only on the server are added; a day on both keeps the local value,
  // except list days (food) where server-only entries (by id) are added too.
  function unionDays(local, server, inner) {
    local = isObj(local) ? local : {}; server = isObj(server) ? server : {};
    var out = Object.assign({}, local), added = 0;
    Object.keys(server).forEach(function (d) {
      if (!(d in out)) { out[d] = server[d]; added++; return; }
      if (inner && Array.isArray(out[d]) && Array.isArray(server[d])) { var u = unionBy(out[d], server[d], inner); if (u.added) { out[d] = u.v; added += u.added; } }
    });
    return { v: out, added: added };
  }
  function byDate(a, b) { var x = (a && (a.date || '')) || '', y = (b && (b.date || '')) || ''; return x < y ? -1 : x > y ? 1 : 0; }
  function bySession(a, b) { var x = (a && (a.endedAt || a.date)) || 0, y = (b && (b.endedAt || b.date)) || 0; if (typeof x !== typeof y) { x = String(x); y = String(y); } return x < y ? -1 : x > y ? 1 : 0; }
  function ts(v) { var n = Date.parse(v || ''); return isNaN(n) ? 0 : n; }
  // keys that are device-only or already synced elsewhere: never copied from the server "extra" row
  var NO_EXTRA = ['pw', 'plan', 'meal', 'coach', 'cid', 'cloudPlanAt', 'cloudPh', 'photoGoneV', 'photoGoneLegacy', 'photoTrashQ', 'selfTgtSig', 'syncAt', 'coachOk', 'isCoach', 'gateV', 'hsyncLast', 'wip'];

  // me: S.me (mutated). rows: [{kind,data,updated_at}] of THIS client. stamps: {kind: iso of our last successful push}.
  // io (optional): { getIntakes(), setIntakes(arr), lsGet(k), lsSet(k,v) } for data that lives outside S.me.
  function mergeOwn(me, rows, stamps, io) {
    stamps = stamps || {}; io = io || {};
    var changed = [];
    (rows || []).forEach(function (r) {
      if (!r || !r.kind || empty(r.data)) return;
      if (stamps[r.kind] && ts(r.updated_at) && ts(r.updated_at) <= ts(stamps[r.kind])) return; // our own write: nothing new
      var k = r.kind, d = r.data, u, n = 0;
      if (k === 'profile' && isObj(d)) {
        if (empty(me.profile)) { me.profile = d; n = 1; }
        else Object.keys(d).forEach(function (f) { if (me.profile[f] == null && d[f] != null) { me.profile[f] = d[f]; n++; } });
      } else if (k === 'sessions') { u = unionBy(me.sessions, d, 'id', bySession); if (u.added) { me.sessions = u.v; n = u.added; } }
      else if (k === 'body') { u = unionBy(me.body, d, 'date', byDate); if (u.added) { me.body = u.v; n = u.added; } }
      else if (k === 'food') { u = unionDays(me.food, d, 'id'); if (u.added) { me.food = u.v; n = u.added; } }
      else if (k === 'habits') { u = unionDays(me.habits, d); if (u.added) { me.habits = u.v; n = u.added; } }
      else if (k === 'water') { u = unionDays(me.water, d); if (u.added) { me.water = u.v; n = u.added; } }
      else if (k === 'recipes') { u = unionBy(me.recipes, d, 'id'); if (u.added) { me.recipes = u.v; n = u.added; } }
      else if (k === 'consent' && isObj(d)) { if (empty(me.consent)) { me.consent = d; n = 1; } }
      else if (k === 'checkins' && isObj(d)) {
        u = unionBy(me.checkins, d.list, 'at', function (a, b) { var x = typeof a === 'object' ? a && a.at : a, y = typeof b === 'object' ? b && b.at : b; return String(x) < String(y) ? -1 : 1; });
        if (u.added) { me.checkins = u.v; n += u.added; }
        u = unionBy(me.photoLog, d.photoLog, 'date', byDate); if (u.added) { me.photoLog = u.v; n += u.added; }
      } else if (k === 'intake' && io.getIntakes && io.setIntakes) {
        var cur = io.getIntakes(), arr = Array.isArray(d) ? d : [d];
        if (!Array.isArray(cur)) cur = cur ? [cur] : [];
        u = unionBy(cur, arr, 'id'); if (u.added) { io.setIntakes(u.v); n = u.added; }
      } else if (k === 'extra' && isObj(d)) {
        Object.keys(d).forEach(function (f) { if (NO_EXTRA.indexOf(f) === -1 && me[f] == null && d[f] != null) { me[f] = d[f]; n++; } });
      } else if (k === 'game' && isObj(d)) {
        if (d.game && me.game == null) { me.game = d.game; n++; }
        if (isObj(d.ls) && io.lsGet && io.lsSet) Object.keys(d.ls).forEach(function (key) { if (/^fbg\./.test(key) && io.lsGet(key) == null && d.ls[key] != null) { io.lsSet(key, d.ls[key]); n++; } });
      }
      if (n) changed.push(k);
    });
    return changed;
  }
  // a push may never send an empty kind over data this device has not seen yet (belt and braces next to mergeOwn)
  function blank(kind, v) {
    if (kind === 'checkins') return !v || (empty(v.list) && empty(v.photoLog));
    if (kind === 'game') return !v || (empty(v.ls) && empty(v.game));
    if (kind === 'photoGone') return !v || empty(v.ids);
    return empty(v);
  }
  var api = { mergeOwn: mergeOwn, blank: blank, unionBy: unionBy, unionDays: unionDays, empty: empty };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root && root.App) root.App.syncMerge = api;
})(typeof window !== 'undefined' ? window : this);
