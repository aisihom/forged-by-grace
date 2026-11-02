/* Forged by Grace — health data import: Apple Health export, Garmin (CSV / FIT / TCX / GPX / export zip), iPhone Shortcut link sync.
   Everything is parsed on the device. Nothing is uploaded. */
(function () {
  'use strict';
  var App = window.App, S = App.S, F = App.F, esc = App.esc, t = App.t, I = App.I, V = App.views, A = App.acts;
  var MAX_DAYS = 730;
  function H() { var m = S.me; if (!m.health) m.health = { days: {}, last: null, sources: {} }; return m.health; }
  function cutoff() { return App.isoAdd(App.today(), -MAX_DAYS); }
  function yieldUI() { return new Promise(function (r) { setTimeout(r, 0); }); }
  function n(v) { var x = parseFloat(String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.')); return isFinite(x) ? x : null; }

  // ---------------- merge ----------------
  // days: { iso: {steps, weight, fat, rhr, kcal} }, workouts: [{start(ms), date, sport, dur(s), dist(km), kcal, hr, src}]
  App.mergeHealth = function (days, workouts, src) {
    var h = H(), ath = S.me, res = { days: 0, weights: 0, workouts: 0 }, cut = cutoff();
    Object.keys(days || {}).forEach(function (iso) {
      if (iso < cut || iso > App.today()) return;
      var d = days[iso], cur = h.days[iso] = h.days[iso] || {};
      ['steps', 'rhr', 'kcal', 'fat', 'weight'].forEach(function (k) { if (d[k] != null && isFinite(d[k])) cur[k] = Math.round(d[k] * 10) / 10; });
      cur.src = src; res.days++;
      if (d.weight) {
        var b = ath.body.filter(function (x) { return x.date === iso; })[0];
        if (!b) { ath.body.push({ date: iso, weight: Math.round(d.weight * 10) / 10, src: src }); res.weights++; }
        else if (!b.weight || b.src) { b.weight = Math.round(d.weight * 10) / 10; b.src = b.src || src; res.weights++; }
        if (d.fat && b) b.fat = d.fat;
      }
    });
    ath.body.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var have = {}; ath.sessions.forEach(function (s) { have[s.id] = 1; });
    (workouts || []).forEach(function (w) {
      if (!w.date || w.date < cut) return;
      var id = 'ext-' + (w.start ? Math.round(w.start / 60000) : w.date + w.sport); // same minute = same workout, across sources
      if (have[id]) return; have[id] = 1;
      ath.sessions.push({ id: id, date: w.date, title: App.sportName(w.sport), type: 'external', dur: Math.round(w.dur || 0), endedAt: (w.start || F.parseISO(w.date).getTime()) + (w.dur || 0) * 1000, items: [], prs: [],
        ext: { sport: w.sport, dist: w.dist ? Math.round(w.dist * 100) / 100 : null, kcal: w.kcal ? Math.round(w.kcal) : null, hr: w.hr ? Math.round(w.hr) : null, src: src } });
      res.workouts++;
    });
    ath.sessions.sort(function (a, b) { return (a.endedAt || 0) - (b.endedAt || 0); });
    h.last = new Date().toISOString(); h.sources[src] = h.last;
    var lw = ath.body.filter(function (b) { return b.weight; }).pop(); if (lw && ath.profile) ath.profile.weight = lw.weight;
    App.save(); return res;
  };
  var SPORTS = { running: 'Run', run: 'Run', cycling: 'Ride', biking: 'Ride', ride: 'Ride', walking: 'Walk', walk: 'Walk', hiking: 'Hike', swimming: 'Swim', pool_swimming: 'Swim', lap_swimming: 'Swim',
    strength_training: 'Strength training', traditionalstrengthtraining: 'Strength training', functionalstrengthtraining: 'Strength training', training: 'Training', fitness_equipment: 'Gym cardio',
    hiit: 'HIIT', highintensityintervaltraining: 'HIIT', yoga: 'Yoga', rowing: 'Rowing', indoor_rowing: 'Rowing', elliptical: 'Elliptical', cardio: 'Cardio', boxing: 'Boxing', kickboxing: 'Boxing', soccer: 'Football', football: 'Football', tennis: 'Tennis', other: 'Workout', generic: 'Workout' };
  App.sportName = function (s) {
    var k = String(s || 'workout').toLowerCase().replace(/^hkworkoutactivitytype/, '').replace(/[\s-]+/g, '_');
    var hit = SPORTS[k] || SPORTS[k.replace(/_/g, '')] || Object.keys(SPORTS).filter(function (x) { return k.indexOf(x) !== -1; }).map(function (x) { return SPORTS[x]; })[0];
    return hit || (k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '));
  };
  App.healthDay = function (iso) { var h = S.me.health; return (h && h.days[iso || App.today()]) || null; };

  // ---------------- Apple Health (export.xml, streamed) ----------------
  var AP = { HKQuantityTypeIdentifierStepCount: 'steps', HKQuantityTypeIdentifierBodyMass: 'weight', HKQuantityTypeIdentifierBodyFatPercentage: 'fat', HKQuantityTypeIdentifierRestingHeartRate: 'rhr', HKQuantityTypeIdentifierActiveEnergyBurned: 'kcal' };
  function attrs(s) { var o = {}, m, re = /(\w+)="([^"]*)"/g; while ((m = re.exec(s))) o[m[1]] = m[2]; return o; }
  function appleParser() {
    var buf = '', cut = cutoff(), sums = {}, last = {}, wk = [], cur = null;
    var reTag = /<(Record|Workout|WorkoutStatistics)\s([^>]*?)\/?>|<\/Workout>/g;
    function date(s) { return String(s || '').slice(0, 10); }
    function ms(s) { var m = String(s).match(/^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d) ([+-]\d\d)(\d\d)/); if (!m) return Date.parse(s) || 0; return Date.parse(m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5] + ':' + m[6] + m[7] + ':' + m[8]); }
    function handle(tag, a, closing) {
      if (closing) { if (cur) { wk.push(cur); cur = null; } return; }
      if (tag === 'Record') {
        var key = AP[a.type]; if (!key) return;
        var d = date(a.startDate); if (d < cut) return;
        var v = n(a.value); if (v == null) return;
        if (key === 'weight' && /lb/.test(a.unit)) v = v * 0.453592;
        if (key === 'fat' && v <= 1) v = v * 100;
        if (key === 'kcal' && /kJ/i.test(a.unit)) v = v / 4.184;
        if (key === 'steps' || key === 'kcal') { var src = a.sourceName || '?'; var s1 = sums[key] = sums[key] || {}; var dd = s1[d] = s1[d] || {}; dd[src] = (dd[src] || 0) + v; }
        else { var l = last[key] = last[key] || {}; var t0 = a.startDate || ''; if (!l[d] || t0 >= l[d][0]) l[d] = [t0, v]; }
      } else if (tag === 'Workout') {
        var dt = date(a.startDate); if (dt < cut) { cur = null; return; }
        var dur = n(a.duration) || 0; if (/min/.test(a.durationUnit || 'min')) dur *= 60; else if (/h/.test(a.durationUnit)) dur *= 3600;
        var dist = n(a.totalDistance); if (dist && /mi/.test(a.totalDistanceUnit || '')) dist *= 1.609; if (dist && a.totalDistanceUnit === 'm') dist /= 1000;
        var kc = n(a.totalEnergyBurned); if (kc && /kJ/i.test(a.totalEnergyBurnedUnit || '')) kc /= 4.184;
        cur = { start: ms(a.startDate), date: dt, sport: a.workoutActivityType, dur: dur, dist: dist, kcal: kc, hr: null };
        if (/\/>\s*$/.test(a._raw || '')) { wk.push(cur); cur = null; }
      } else if (tag === 'WorkoutStatistics' && cur) {
        if (/ActiveEnergyBurned/.test(a.type) && !cur.kcal) { cur.kcal = n(a.sum); if (/kJ/i.test(a.unit || '')) cur.kcal /= 4.184; }
        if (/HeartRate$/.test(a.type)) cur.hr = n(a.average);
        if (/Distance/.test(a.type) && !cur.dist) { cur.dist = n(a.sum); if (/mi/.test(a.unit || '')) cur.dist *= 1.609; if (a.unit === 'm') cur.dist /= 1000; }
      }
    }
    return {
      push: function (text) {
        buf += text;
        var end = buf.lastIndexOf('>'); if (end < 0) return;
        var part = buf.slice(0, end + 1); buf = buf.slice(end + 1);
        reTag.lastIndex = 0; var m;
        while ((m = reTag.exec(part))) {
          if (!m[1]) { handle(null, null, true); continue; }
          if (m[1] === 'Record' && m[2].indexOf('HKQuantityTypeIdentifier') !== -1) { var ty = m[2].match(/type="([^"]+)"/); if (!ty || !AP[ty[1]]) continue; }
          var a = attrs(m[2]); a._raw = m[0]; handle(m[1], a);
        }
      },
      done: function () {
        var days = {};
        function day(d) { return days[d] = days[d] || {}; }
        ['steps', 'kcal'].forEach(function (k) { Object.keys(sums[k] || {}).forEach(function (d) { var bySrc = sums[k][d]; day(d)[k] = Math.max.apply(null, Object.keys(bySrc).map(function (s) { return bySrc[s]; })); }); });
        ['weight', 'fat', 'rhr'].forEach(function (k) { Object.keys(last[k] || {}).forEach(function (d) { day(d)[k] = last[k][d][1]; }); });
        return { days: days, workouts: wk };
      }
    };
  }

  // ---------------- streaming file readers ----------------
  var CHUNK = 2 * 1024 * 1024;
  function readText(file, onText, onProg) {
    var pos = 0, dec = new TextDecoder();
    function step() {
      if (pos >= file.size) { onText(dec.decode()); return Promise.resolve(); }
      return file.slice(pos, pos + CHUNK).arrayBuffer().then(function (ab) {
        pos += ab.byteLength; onText(dec.decode(new Uint8Array(ab), { stream: true })); onProg(pos / file.size); return yieldUI().then(step);
      });
    }
    return step();
  }
  function loadFflate() {
    if (window.fflate) return Promise.resolve();
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = 'vendor/fflate.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  // stream through a zip; handler(name) returns null (skip) or {text: fn(chunk)} or {bytes: true} (collect whole file)
  function readZip(file, pick, onProg) {
    return loadFflate().then(function () {
      var uz = new window.fflate.Unzip(), files = [], err = null;
      uz.register(window.fflate.UnzipInflate);
      uz.onfile = function (f) {
        var h = pick(f.name); if (!h) return;
        var dec = new TextDecoder(), parts = [];
        f.ondata = function (e, chunk, final) {
          if (e) { err = e; return; }
          if (h.text) { h.text(dec.decode(chunk, { stream: !final })); }
          else parts.push(chunk);
          if (final && h.bytes) { var len = parts.reduce(function (a, p) { return a + p.length; }, 0), out = new Uint8Array(len), o = 0; parts.forEach(function (p) { out.set(p, o); o += p.length; }); files.push({ name: f.name, data: out }); }
        };
        f.start();
      };
      var pos = 0;
      function step() {
        if (err) return Promise.reject(err);
        if (pos >= file.size) return Promise.resolve(files);
        return file.slice(pos, pos + CHUNK).arrayBuffer().then(function (ab) {
          pos += ab.byteLength; uz.push(new Uint8Array(ab), pos >= file.size); onProg(pos / file.size); return yieldUI().then(step);
        });
      }
      return step();
    });
  }

  App.importAppleHealth = function (file, onProg) {
    var P = appleParser();
    var isZip = /\.zip$/i.test(file.name) || file.type === 'application/zip';
    var p = isZip ? readZip(file, function (name) { return /(^|\/)export\.xml$/i.test(name) ? { text: P.push } : null; }, onProg) : readText(file, P.push, onProg);
    return p.then(function () { var r = P.done(); return App.mergeHealth(r.days, r.workouts, 'Apple Health'); });
  };

  // ---------------- Garmin ----------------
  function csvRows(text) {
    var rows = [], row = [], f = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows.filter(function (r) { return r.length > 1; });
  }
  function hms(s) { s = String(s || '').trim(); if (!s || s === '--') return 0; var p = s.split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? p[0] * 60 + p[1] : (+s || 0); }
  function num(s) { s = String(s || '').trim(); if (!s || s === '--') return null; if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, ''); else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); return n(s); }
  App.parseGarminCSV = function (text) {
    var rows = csvRows(text.replace(/^\uFEFF/, '')); if (rows.length < 2) throw new Error(t('No activities found in this CSV.'));
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    function col() { var names = [].slice.call(arguments); for (var i = 0; i < head.length; i++) if (names.some(function (nm) { return head[i] === nm || head[i].indexOf(nm) === 0; })) return i; return -1; }
    var cType = col('activity type', 'activiteittype', 'type activiteit', 'tipo de actividad'), cDate = col('date', 'datum', 'fecha'), cTitle = col('title', 'titel', 'título'),
      cDist = col('distance', 'afstand', 'distancia'), cCal = col('calories', 'calorieën', 'calorieen', 'calorías'), cTime = col('time', 'tijd', 'tiempo', 'duration', 'duur'), cHr = col('avg hr', 'gem. hs', 'gemiddelde hartslag', 'fc media');
    if (cDate < 0) throw new Error(t('This does not look like a Garmin activities CSV.'));
    var miles = head[cDist] && /mi/.test(head[cDist]);
    var wk = rows.slice(1).map(function (r) {
      var ds = String(r[cDate] || '').trim(), start = Date.parse(ds.replace(' ', 'T')) || 0;
      var dist = cDist >= 0 ? num(r[cDist]) : null; if (dist && miles) dist *= 1.609; if (dist && dist > 500) dist /= 1000;
      return { start: start, date: ds.slice(0, 10), sport: (cType >= 0 && r[cType]) || (cTitle >= 0 && r[cTitle]) || 'workout', dur: cTime >= 0 ? hms(r[cTime]) : 0, dist: dist, kcal: cCal >= 0 ? num(r[cCal]) : null, hr: cHr >= 0 ? num(r[cHr]) : null };
    }).filter(function (w) { return /^\d{4}-\d\d-\d\d$/.test(w.date); });
    return { days: {}, workouts: wk };
  };
  App.parseTCX = function (text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml'), wk = [];
    [].forEach.call(doc.getElementsByTagName('Activity'), function (a) {
      var id = (a.getElementsByTagName('Id')[0] || {}).textContent, start = Date.parse(id) || 0, dur = 0, dist = 0, kcal = 0, hrs = [];
      [].forEach.call(a.getElementsByTagName('Lap'), function (l) {
        function v(tag) { var e = l.getElementsByTagName(tag)[0]; return e ? +e.textContent : 0; }
        dur += v('TotalTimeSeconds'); dist += v('DistanceMeters'); kcal += v('Calories');
        var ah = l.getElementsByTagName('AverageHeartRateBpm')[0]; if (ah) hrs.push(+ah.getElementsByTagName('Value')[0].textContent);
      });
      wk.push({ start: start, date: F.isoDate(new Date(start)), sport: a.getAttribute('Sport') || 'workout', dur: dur, dist: dist / 1000, kcal: kcal, hr: hrs.length ? hrs.reduce(function (x, y) { return x + y; }) / hrs.length : null });
    });
    if (!wk.length) throw new Error(t('No activity found in this file.'));
    return { days: {}, workouts: wk };
  };
  App.parseGPX = function (text) {
    var doc = new DOMParser().parseFromString(text, 'application/xml'), pts = doc.getElementsByTagName('trkpt');
    if (!pts.length) throw new Error(t('No activity found in this file.'));
    var dist = 0, prev = null, times = [], hrs = [];
    [].forEach.call(pts, function (p) {
      var la = +p.getAttribute('lat'), lo = +p.getAttribute('lon'), tm = p.getElementsByTagName('time')[0];
      if (tm) times.push(Date.parse(tm.textContent));
      var hr = p.getElementsByTagNameNS('*', 'hr')[0]; if (hr) hrs.push(+hr.textContent);
      if (prev) { var R = 6371, dLa = (la - prev[0]) * Math.PI / 180, dLo = (lo - prev[1]) * Math.PI / 180, x = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(prev[0] * Math.PI / 180) * Math.cos(la * Math.PI / 180) * Math.sin(dLo / 2) * Math.sin(dLo / 2); dist += 2 * R * Math.asin(Math.sqrt(x)); }
      prev = [la, lo];
    });
    var ty = doc.getElementsByTagName('type')[0], start = times[0] || 0;
    return { days: {}, workouts: [{ start: start, date: F.isoDate(new Date(start)), sport: ty ? ty.textContent : 'workout', dur: times.length > 1 ? (times[times.length - 1] - times[0]) / 1000 : 0, dist: dist, kcal: null, hr: hrs.length ? hrs.reduce(function (a, b) { return a + b; }) / hrs.length : null }] };
  };
  // Minimal FIT decoder: session (18) and weight_scale (30) messages.
  var FIT_SPORT = { 0: 'workout', 1: 'running', 2: 'cycling', 4: 'fitness_equipment', 5: 'swimming', 10: 'training', 11: 'walking', 15: 'rowing', 17: 'hiking', 62: 'hiit' };
  App.parseFIT = function (bytes) {
    var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var hs = bytes[0]; if (String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) !== '.FIT') throw new Error(t('Not a valid FIT file.'));
    var end = Math.min(bytes.length, hs + dv.getUint32(4, true)), pos = hs, defs = {}, wk = [], days = {}, EPOCH = 631065600000, lastTs = 0;
    function rd(size, le, base) {
      var v; if (size === 1) v = dv.getUint8(pos); else if (size === 2) v = dv.getUint16(pos, le); else if (size === 4) v = dv.getUint32(pos, le); else v = null;
      var inval = (size === 1 && v === 0xFF) || (size === 2 && v === 0xFFFF) || (size === 4 && v === 0xFFFFFFFF); pos += size; return inval ? null : v;
    }
    while (pos < end) {
      var h = bytes[pos++], local, def;
      if (h & 0x80) { local = (h >> 5) & 3; def = defs[local]; }
      else if (h & 0x40) {
        local = h & 0xF; pos++; var le = bytes[pos++] === 0, g = dv.getUint16(pos, le); pos += 2; var nf = bytes[pos++], fields = [];
        for (var i = 0; i < nf; i++) { fields.push([bytes[pos], bytes[pos + 1], bytes[pos + 2]]); pos += 3; }
        var dev = 0; if (h & 0x20) { var nd = bytes[pos++]; for (var j = 0; j < nd; j++) { dev += bytes[pos + 1]; pos += 3; } }
        defs[local] = { g: g, le: le, fields: fields, dev: dev }; continue;
      } else { local = h & 0xF; def = defs[local]; }
      if (!def) throw new Error(t('Not a valid FIT file.'));
      var m = {};
      def.fields.forEach(function (f) { if ([1, 2, 4].indexOf(f[1]) !== -1) m[f[0]] = rd(f[1], def.le); else pos += f[1]; });
      pos += def.dev;
      if (m[253] != null) lastTs = m[253];
      if (def.g === 18) {
        var st = EPOCH + (m[2] != null ? m[2] : lastTs) * 1000;
        wk.push({ start: st, date: F.isoDate(new Date(st)), sport: FIT_SPORT[m[5]] || 'workout', dur: (m[7] != null ? m[7] : m[8] || 0) / 1000, dist: m[9] != null ? m[9] / 100000 : null, kcal: m[11], hr: m[16] });
      } else if (def.g === 30 && m[0] != null) {
        var d = F.isoDate(new Date(EPOCH + (m[253] || lastTs) * 1000)); days[d] = { weight: m[0] / 100 }; if (m[1] != null) days[d].fat = m[1] / 100;
      }
    }
    if (!wk.length && !Object.keys(days).length) throw new Error(t('No activity found in this file.'));
    return { days: days, workouts: wk };
  };
  // Garmin account data export: daily summaries (UDSFile_*.json), activities (*summarizedActivities*.json), weight (*userBioMetrics*.json)
  App.parseGarminJSON = function (name, text, acc) {
    var j; try { j = JSON.parse(text); } catch (e) { return; }
    var arr = Array.isArray(j) ? j : [j];
    arr.forEach(function (o) {
      if (o && o.summarizedActivitiesExport) o.summarizedActivitiesExport.forEach(function (a) {
        var st = a.startTimeLocal || a.beginTimestamp || a.startTimeGmt || 0;
        acc.workouts.push({ start: st, date: F.isoDate(new Date(st)), sport: a.activityType || a.sportType || 'workout', dur: (a.duration || 0) / 1000, dist: a.distance ? a.distance / 100000 : null, kcal: a.calories, hr: a.avgHr });
      });
      if (o && o.calendarDate && (o.totalSteps != null || o.restingHeartRate != null)) {
        var d = String(o.calendarDate).slice(0, 10), x = acc.days[d] = acc.days[d] || {};
        if (o.totalSteps != null) x.steps = o.totalSteps; if (o.restingHeartRate) x.rhr = o.restingHeartRate; if (o.activeKilocalories != null) x.kcal = o.activeKilocalories;
      }
      var w = o && (o.weight && typeof o.weight === 'object' ? o.weight : null);
      var cd = o && ((o.metaData && o.metaData.calendarDate) || o.calendarDate);
      if (w && w.weight && cd) { var dd = String(cd).slice(0, 10), y = acc.days[dd] = acc.days[dd] || {}; y.weight = w.weight > 1000 ? w.weight / 1000 : w.weight; if (w.bodyFat) y.fat = w.bodyFat; }
    });
  };
  App.importGarmin = function (file, onProg) {
    var nm = file.name.toLowerCase();
    function done(r) { return App.mergeHealth(r.days, r.workouts, 'Garmin'); }
    if (/\.fit$/.test(nm)) return file.arrayBuffer().then(function (b) { onProg(1); return done(App.parseFIT(new Uint8Array(b))); });
    if (/\.zip$/.test(nm)) {
      var acc = { days: {}, workouts: [] };
      return readZip(file, function (name) { return /\.(json|fit|tcx|gpx|csv)$/i.test(name) && !/__MACOSX/.test(name) ? { bytes: true } : null; }, onProg).then(function (files) {
        files.forEach(function (f) {
          var lower = f.name.toLowerCase(), txt;
          try {
            if (/\.fit$/.test(lower)) { var r = App.parseFIT(f.data); acc.workouts = acc.workouts.concat(r.workouts); Object.assign(acc.days, r.days); return; }
            txt = new TextDecoder().decode(f.data);
            if (/\.json$/.test(lower)) App.parseGarminJSON(lower, txt, acc);
            else if (/\.tcx$/.test(lower)) acc.workouts = acc.workouts.concat(App.parseTCX(txt).workouts);
            else if (/\.gpx$/.test(lower)) acc.workouts = acc.workouts.concat(App.parseGPX(txt).workouts);
            else if (/\.csv$/.test(lower)) acc.workouts = acc.workouts.concat(App.parseGarminCSV(txt).workouts);
          } catch (e) { /* skip unreadable file */ }
        });
        if (!acc.workouts.length && !Object.keys(acc.days).length) throw new Error(t('Nothing usable found in this zip.'));
        return done(acc);
      });
    }
    return file.text().then(function (txt) {
      onProg(1);
      if (/\.tcx$/.test(nm)) return done(App.parseTCX(txt));
      if (/\.gpx$/.test(nm)) return done(App.parseGPX(txt));
      if (/\.json$/.test(nm)) { var acc2 = { days: {}, workouts: [] }; App.parseGarminJSON(nm, txt, acc2); return done(acc2); }
      return done(App.parseGarminCSV(txt));
    });
  };

  // ---------------- Shortcut link / paste sync ----------------
  App.parseHealthQuery = function (q) {
    q = String(q || '').trim().replace(/^.*?#health\??/, '').replace(/^\?/, '');
    var p = new URLSearchParams(q.replace(/;/g, '&')), d = (p.get('d') || App.today()).slice(0, 10);
    if (!/^\d{4}-\d\d-\d\d$/.test(d)) d = App.today();
    function int(k) { var v = p.get(k); if (v == null || v === '') return null; v = String(v).replace(/[^\d]/g, ''); return v ? +v : null; }
    function dec(k) { var v = p.get(k); if (v == null || v === '') return null; v = String(v).replace(/\s/g, ''); if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, ''); return n(v); }
    var x = {}; var s = int('steps'), w = dec('weight'), r = int('rhr'), k = int('kcal'), f = dec('fat');
    if (s != null) x.steps = s; if (w) x.weight = w > 300 ? w / 1000 : w; if (r) x.rhr = r; if (k != null) x.kcal = k; if (f) x.fat = f <= 1 ? f * 100 : f;
    var days = {}; days[d] = x; return { days: days, d: d, x: x };
  };
  App.applyHealthLink = function (hash) {
    var r = App.parseHealthQuery(hash);
    if (!Object.keys(r.x).length) { App.toast(t('No health values in the link.')); return; }
    if (!S.role) S.role = 'athlete';
    App.mergeHealth(r.days, [], 'Shortcut');
    var x = r.x, bits = [];
    if (x.steps != null) bits.push(x.steps.toLocaleString(S.lang) + ' ' + t('steps')); if (x.weight) bits.push(App.r1(x.weight) + ' kg'); if (x.rhr) bits.push(x.rhr + ' bpm'); if (x.kcal != null) bits.push(x.kcal + ' kcal');
    App._healthSynced = t('Synced') + ': ' + bits.join(' · ');
    history.replaceState(null, '', '#/health'); App.route();
  };

  // ---------------- UI ----------------
  V.health = function () {
    var h = H(), days = Object.keys(h.days).sort(), today = App.healthDay();
    var ext = S.me.sessions.filter(function (s) { return s.type === 'external'; }).length;
    var out = '<div class="row" style="margin-bottom:10px"><a class="icon-btn" href="#/progress" aria-label="' + esc(t('Back')) + '">' + I.back + '</a><div class="grow"><div class="kicker" style="margin:0">' + esc(t('Health data')) + '</div></div></div>';
    out += '<h1 class="h1">' + esc(t('Connect Garmin / Apple Health')) + '</h1><p class="muted small">' + esc(t('Free and private: files are read on this phone, nothing is uploaded.')) + '</p>';
    if (App._healthSynced) { out += '<p class="suggest" id="hsync">' + I.check + ' ' + esc(App._healthSynced) + '</p>'; App._healthSynced = null; }
    out += '<div class="grid3"><div class="stat"><div class="v">' + (today && today.steps != null ? Math.round(today.steps).toLocaleString(S.lang) : '—') + '</div><div class="l">' + esc(t('steps today')) + '</div></div><div class="stat"><div class="v">' + days.length + '</div><div class="l">' + esc(t('days imported')) + '</div></div><div class="stat"><div class="v">' + ext + '</div><div class="l">' + esc(t('workouts imported')) + '</div></div></div>';
    out += '<p class="tiny muted">' + esc(h.last ? t('Last import') + ': ' + F.fmtDate(h.last, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' · ' + Object.keys(h.sources).join(', ') : t('Nothing imported yet.')) + '</p>';
    // shortcut
    out += '<div class="card hcard"><div class="row"><div class="ex-icon">' + I.sparkle + '</div><div class="grow"><b>' + esc(t('iPhone: daily sync with a Shortcut')) + '</b><div class="tiny muted">' + esc(t('Steps, weight, resting heart rate and active calories from Apple Health — one tap or automatic every day.')) + '</div></div></div>' +
      '<div class="grid2" style="margin-top:10px"><button class="btn primary sm" data-act="h-help">' + esc(t('How to set it up')) + '</button><button class="btn sm" data-act="h-paste">' + esc(t('Paste sync text')) + '</button></div></div>';
    // apple export
    out += '<div class="card hcard"><div class="row"><div class="ex-icon">' + I.heart + '</div><div class="grow"><b>' + esc(t('Apple Health export')) + '</b><div class="tiny muted">' + esc(t('All history at once: steps, weight, body fat, resting heart rate, active calories, workouts.')) + '</div></div></div>' +
      '<ol class="plain-list small"><li>' + esc(t('Open the Health app → tap your photo (top right).')) + '</li><li>' + esc(t('Tap “Export All Health Data” → Export. Save to Files.')) + '</li><li>' + esc(t('Choose export.zip below (big files can take a minute).')) + '</li></ol>' +
      '<label class="btn block" style="margin-top:8px">' + I.file + esc(t('Choose export.zip / export.xml')) + '<input type="file" id="h-apple" style="position:absolute;width:1px;height:1px;opacity:0;overflow:hidden"></label></div>';
    // garmin
    out += '<div class="card hcard"><div class="row"><div class="ex-icon">' + I.train + '</div><div class="grow"><b>Garmin Connect</b><div class="tiny muted">' + esc(t('Workouts (type, duration, distance, calories, avg heart rate), daily steps and weight.')) + '</div></div></div>' +
      '<ul class="plain-list small"><li>' + esc(t('Activities list: connect.garmin.com → Activities → All activities → Export CSV.')) + '</li><li>' + esc(t('One activity: open it → ⚙ → Export original (.fit) or Export to TCX/GPX.')) + '</li><li>' + esc(t('Everything: Garmin account → Data management → Export your data (zip, sent by e-mail).')) + '</li></ul>' +
      '<label class="btn block" style="margin-top:8px">' + I.file + esc(t('Choose CSV / FIT / TCX / GPX / zip')) + '<input type="file" id="h-garmin" multiple style="position:absolute;width:1px;height:1px;opacity:0;overflow:hidden"></label></div>';
    out += '<div id="h-prog" aria-live="polite"></div>';
    if (days.length) {
      var bars = []; for (var i = 6; i >= 0; i--) { var d = App.isoAdd(App.today(), -i), x = h.days[d] || {}; bars.push({ l: F.parseISO(d).toLocaleDateString(S.lang, { weekday: 'narrow' }), v: x.steps || 0, hi: i === 0 }); }
      out += '<div class="section"><div class="section-head"><h2 class="h2">' + esc(t('Steps')) + '</h2><span class="tiny muted">' + esc(t('goal')) + ' 8.000</span></div><div class="card">' + App.barChart(bars, 8000) + '</div></div>';
    }
    if (days.length) out += '<button class="btn danger sm block" data-act="h-clear" style="margin-top:14px">' + esc(t('Remove imported health data')) + '</button>';
    setTimeout(bindHealth);
    return out;
  };
  function progress(p, label) { var el = document.getElementById('h-prog'); if (el) el.innerHTML = '<div class="card"><div class="row"><span class="spin"></span><div class="grow"><b>' + esc(label) + ' ' + Math.round(p * 100) + '%</b><div class="bar-track" style="margin-top:8px"><div class="bar-fill" style="width:' + Math.max(2, p * 100).toFixed(0) + '%"></div></div></div></div></div>'; }
  function result(r) { App._healthSynced = t('Imported') + ': ' + r.days + ' ' + t('days') + ' · ' + r.weights + ' ' + t('weights') + ' · ' + r.workouts + ' ' + t('workouts'); App.rerender(); }
  function fail(e) { console.warn('health import', e); var el = document.getElementById('h-prog'); if (el) el.innerHTML = '<p class="suggest" style="color:var(--warn)">' + esc(t('Import failed') + ': ' + ((e && e.message) || e)) + '</p>'; }
  function bindHealth() {
    var a = document.getElementById('h-apple'), g = document.getElementById('h-garmin');
    if (a) a.onchange = function () { var f = a.files[0]; if (!f) return; progress(0, t('Reading Apple Health…')); App.importAppleHealth(f, function (p) { progress(p, t('Reading Apple Health…')); }).then(result).catch(fail); a.value = ''; };
    if (g) g.onchange = function () {
      var fs = [].slice.call(g.files), tot = { days: 0, weights: 0, workouts: 0 }; g.value = '';
      fs.reduce(function (pr, f) { return pr.then(function () { progress(0, f.name); return App.importGarmin(f, function (p) { progress(p, f.name); }).then(function (r) { tot.days += r.days; tot.weights += r.weights; tot.workouts += r.workouts; }); }); }, Promise.resolve()).then(function () { result(tot); }).catch(fail);
    };
  }
  A['h-clear'] = function () { App.confirm(t('Remove imported health data?'), t('Imported steps and workouts are removed. Your own logs stay.'), t('Remove'), true).then(function (ok) { if (!ok) return; S.me.health = null; S.me.sessions = S.me.sessions.filter(function (s) { return s.type !== 'external'; }); S.me.body = S.me.body.filter(function (b) { return !b.src; }); App.save(); App.rerender(); }); };
  A['h-paste'] = function () {
    var s = App.sheet(App.sheetHead(t('Paste sync text'), t('For the home-screen app: the Shortcut copies the sync text, paste it here.')) + '<textarea class="input mono" id="hp" placeholder="d=2026-11-02&steps=8412&weight=84.6&rhr=58&kcal=520"></textarea><div class="grid2" style="margin-top:10px">' + (navigator.clipboard && navigator.clipboard.readText ? '<button class="btn" id="hp-clip">' + esc(t('Paste')) + '</button>' : '<span></span>') + '<button class="btn primary" id="hp-go">' + esc(t('Sync')) + '</button></div>');
    var cb = s.el.querySelector('#hp-clip'); if (cb) cb.onclick = function () { navigator.clipboard.readText().then(function (x) { s.el.querySelector('#hp').value = x; }).catch(function () {}); };
    s.el.querySelector('#hp-go').onclick = function () { var v = s.el.querySelector('#hp').value; s.close(); App.applyHealthLink(v); };
  };
  App.shortcutSteps = function () {
    var url = App.baseUrl() + '#health?d=';
    return [
      ['Open de app Opdrachten → tik op + (nieuwe opdracht). Noem hem “Forged by Grace sync”.'],
      ['Voeg actie toe: “Zoek naar gezondheidsmonsters” (Find Health Samples). Type: Stappen · Startdatum: is vandaag · Limiet: uit.'],
      ['Voeg actie toe: “Bereken statistieken” → Som van de stappen. (Of: “Bereken” met “Som”.) Dit is je totaal aantal stappen van vandaag.'],
      ['Herhaal voor actieve energie: “Zoek naar gezondheidsmonsters” · Type: Actieve energie · Startdatum is vandaag → “Bereken statistieken” → Som.'],
      ['Gewicht: “Zoek naar gezondheidsmonsters” · Type: Gewicht · Sorteer op: Startdatum, nieuwste eerst · Limiet: 1.'],
      ['Rusthartslag: “Zoek naar gezondheidsmonsters” · Type: Hartslag in rust · Sorteer: nieuwste eerst · Limiet: 1.'],
      ['Voeg actie “Formatteer datum” toe: Huidige datum · Notatie: Aangepast · yyyy-MM-dd.'],
      ['Voeg actie “Tekst” toe en zet daarin (tik de variabelen in van de stappen hierboven):', 'd=[Geformatteerde datum]&steps=[Som stappen]&weight=[Gewicht]&rhr=[Rusthartslag]&kcal=[Som actieve energie]'],
      ['Voeg “Kopieer naar klembord” toe (de tekst van stap 8). Zo kun je hem in de app op je beginscherm plakken.'],
      ['Voeg “Codeer URL” toe (URL Encode) met als invoer de Tekst. Zo gaan spaties en komma’s goed.'],
      ['Voeg “Open URL’s” toe met:', url + '[Gecodeerde URL]'],
      ['Tik op ▶ om te testen. Safari opent Forged by Grace en toont “Gesynchroniseerd”. Gebruik je de app vanaf je beginscherm? Open die dan en kies Meer → Gezondheid → “Plak sync-tekst”.'],
      ['Automatisch elke dag: tab Automatisering → + → Tijdstip → 21:00 · Dagelijks → Voer direct uit → kies “Forged by Grace sync”.']
    ];
  };
  A['h-help'] = function () {
    var steps = App.shortcutSteps();
    App.sheet(App.sheetHead(t('Shortcut sync (iPhone)'), t('A web app cannot read Apple Health directly. This free Shortcut sends today’s numbers to the app.')) +
      '<ol class="steps">' + steps.map(function (s) { return '<li>' + esc(s[0]) + (s[1] ? '<code class="codebox">' + esc(s[1]) + '</code>' : '') + '</li>'; }).join('') + '</ol>' +
      '<p class="tiny muted">' + esc(t('Tip: a value that is empty (for example no weight today) is simply skipped. Dutch number format (84,6 / 8.412) is understood.')) + '</p>' +
      '<button class="btn block" id="h-copyurl">' + I.link + esc(t('Copy example link')) + '</button>');
    document.getElementById('h-copyurl').onclick = function () { F.copyText(App.baseUrl() + '#health?d=' + App.today() + '&steps=8412&weight=84.6&rhr=58&kcal=520').then(function () { App.toast(t('Link copied')); }); };
  };

  // NL strings
  Object.assign(window.FBG_I18N.nl, {
    'Health data': 'Gezondheidsdata', 'Connect Garmin / Apple Health': 'Koppel Garmin / Apple Health', 'Free and private: files are read on this phone, nothing is uploaded.': 'Gratis en privé: bestanden worden op deze telefoon gelezen, er wordt niets geüpload.',
    'steps today': 'stappen vandaag', 'days imported': 'dagen geïmporteerd', 'workouts imported': 'trainingen geïmporteerd', 'Last import': 'Laatste import', 'Nothing imported yet.': 'Nog niets geïmporteerd.',
    'iPhone: daily sync with a Shortcut': 'iPhone: dagelijks synchroniseren met een Opdracht', 'Steps, weight, resting heart rate and active calories from Apple Health — one tap or automatic every day.': 'Stappen, gewicht, rusthartslag en actieve calorieën uit Apple Gezondheid — met één tik of elke dag automatisch.',
    'How to set it up': 'Zo stel je het in', 'Paste sync text': 'Plak sync-tekst', 'Apple Health export': 'Apple Gezondheid-export', 'All history at once: steps, weight, body fat, resting heart rate, active calories, workouts.': 'Alle geschiedenis in één keer: stappen, gewicht, vetpercentage, rusthartslag, actieve calorieën, trainingen.',
    'Open the Health app → tap your photo (top right).': 'Open de app Gezondheid → tik op je foto (rechtsboven).', 'Tap “Export All Health Data” → Export. Save to Files.': 'Tik op “Exporteer alle gezondheidsgegevens” → Exporteer. Bewaar in Bestanden.', 'Choose export.zip below (big files can take a minute).': 'Kies hieronder export.zip (grote bestanden kunnen een minuut duren).',
    'Choose export.zip / export.xml': 'Kies export.zip / export.xml', 'Workouts (type, duration, distance, calories, avg heart rate), daily steps and weight.': 'Trainingen (type, duur, afstand, calorieën, gem. hartslag), dagelijkse stappen en gewicht.',
    'Activities list: connect.garmin.com → Activities → All activities → Export CSV.': 'Activiteitenlijst: connect.garmin.com → Activiteiten → Alle activiteiten → CSV exporteren.', 'One activity: open it → ⚙ → Export original (.fit) or Export to TCX/GPX.': 'Eén activiteit: open hem → ⚙ → Origineel exporteren (.fit) of exporteren naar TCX/GPX.',
    'Everything: Garmin account → Data management → Export your data (zip, sent by e-mail).': 'Alles: Garmin-account → Gegevensbeheer → Je gegevens exporteren (zip, per e-mail).', 'Choose CSV / FIT / TCX / GPX / zip': 'Kies CSV / FIT / TCX / GPX / zip',
    'Steps': 'Stappen', 'goal': 'doel', 'Remove imported health data': 'Geïmporteerde gezondheidsdata verwijderen', 'Remove imported health data?': 'Geïmporteerde gezondheidsdata verwijderen?', 'Imported steps and workouts are removed. Your own logs stay.': 'Geïmporteerde stappen en trainingen worden verwijderd. Je eigen logs blijven.',
    'Imported': 'Geïmporteerd', 'days': 'dagen', 'weights': 'gewichten', 'Import failed': 'Import mislukt', 'Reading Apple Health…': 'Apple Gezondheid lezen…', 'For the home-screen app: the Shortcut copies the sync text, paste it here.': 'Voor de app op je beginscherm: de Opdracht kopieert de sync-tekst, plak hem hier.',
    'Paste': 'Plakken', 'Sync': 'Synchroniseren', 'Synced': 'Gesynchroniseerd', 'steps': 'stappen', 'No health values in the link.': 'Geen gezondheidswaarden in de link.', 'Shortcut sync (iPhone)': 'Opdracht-sync (iPhone)',
    'A web app cannot read Apple Health directly. This free Shortcut sends today’s numbers to the app.': 'Een web-app kan Apple Gezondheid niet direct lezen. Deze gratis Opdracht stuurt de cijfers van vandaag naar de app.',
    'Tip: a value that is empty (for example no weight today) is simply skipped. Dutch number format (84,6 / 8.412) is understood.': 'Tip: een lege waarde (bijv. geen gewicht vandaag) wordt overgeslagen. Nederlandse notatie (84,6 / 8.412) wordt begrepen.', 'Copy example link': 'Voorbeeldlink kopiëren',
    'No activities found in this CSV.': 'Geen activiteiten in deze CSV.', 'This does not look like a Garmin activities CSV.': 'Dit lijkt geen Garmin-activiteiten-CSV.', 'No activity found in this file.': 'Geen activiteit in dit bestand.', 'Not a valid FIT file.': 'Geen geldig FIT-bestand.', 'Nothing usable found in this zip.': 'Niets bruikbaars in deze zip.',
    'Run': 'Hardlopen', 'Ride': 'Fietsen', 'Walk': 'Wandelen', 'Hike': 'Wandeltocht', 'Swim': 'Zwemmen', 'Strength training': 'Krachttraining', 'Workout': 'Training', 'Gym cardio': 'Cardio (gym)', 'Rowing': 'Roeien', 'Football': 'Voetbal',
    'Garmin / Apple Health': 'Garmin / Apple Health', 'Connect': 'Koppelen', 'resting HR': 'rusthartslag', 'avg steps': 'gem. stappen', 'body fat': 'vetpercentage', 'Imported workout': 'Geïmporteerde training'
  });
})();
