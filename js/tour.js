/* Forged by Grace v3.10 — guided tour for clients (spotlight, NL/EN/ES). Replay: More → Rondleiding. */
(function () {
  'use strict';
  var App = window.App, S = App.S, esc = App.esc, A = App.acts, V = App.views;
  var TX = {
    nl: { t: 'Rondleiding', next: 'Volgende', back: 'Terug', skip: 'Overslaan', done: 'Aan de slag!', steps: [
      ['Welkom! 🔥', 'Op Vandaag zie je je dagelijkse bijbeltekst en wat er vandaag op je plan staat.'],
      ['Trainen 🏋️', 'Open je workout bij Train. Tik op een oefening voor de demo: rood = hoofdspieren, oranje = ondersteunend. Log je sets en vink ze af.'],
      ['Voeding & water 🥗', 'Bij Food zie je je macro’s (eiwit, koolhydraten, vet). Tik op + 0,5 L water en verdien Sweatpoints.'],
      ['Wekelijkse check-in 📸', 'Aan het eind van elke week: weeg jezelf en maak je foto’s bij Progress. Zo zie je (en je coach) je vooruitgang.'],
      ['Je Pet & Sweatpoints 🐑', 'Elke training, maaltijd en glas water levert Sweatpoints op. Verzorg je Pet en wissel punten in voor beloningen.'],
      ['Live met je coach ☁️', 'Je coach ziet je voortgang live. Vragen? Neem contact op met je coach via More. Deze rondleiding vind je terug bij More → Rondleiding.']] },
    en: { t: 'Tour', next: 'Next', back: 'Back', skip: 'Skip', done: 'Let’s go!', steps: [
      ['Welcome! 🔥', 'Today shows your daily verse and what’s on your plan today.'],
      ['Training 🏋️', 'Open your workout in Train. Tap an exercise for the demo: red = main muscles, orange = supporting. Log your sets and tick them off.'],
      ['Food & water 🥗', 'Food shows your macros (protein, carbs, fat). Tap + 0.5 L water to earn Sweatpoints.'],
      ['Weekly check-in 📸', 'At the end of each week: weigh in and take your photos in Progress, so you (and your coach) see your progress.'],
      ['Your Pet & Sweatpoints 🐑', 'Every workout, meal and glass of water earns Sweatpoints. Care for your Pet and redeem points for rewards.'],
      ['Live with your coach ☁️', 'Your coach sees your progress live. Questions? Contact your coach via More. Replay this tour any time: More → Tour.']] },
    es: { t: 'Recorrido', next: 'Siguiente', back: 'Atrás', skip: 'Saltar', done: '¡Vamos!', steps: [
      ['¡Bienvenido! 🔥', 'Hoy muestra tu versículo diario y lo que tienes en tu plan hoy.'],
      ['Entrenar 🏋️', 'Abre tu entrenamiento en Train. Toca un ejercicio para ver la demo: rojo = músculos principales, naranja = de apoyo. Registra tus series.'],
      ['Comida y agua 🥗', 'En Food ves tus macros (proteína, carbohidratos, grasa). Toca + 0,5 L de agua y gana Sweatpoints.'],
      ['Check-in semanal 📸', 'Al final de cada semana: pésate y haz tus fotos en Progress. Así tú (y tu coach) veis tu progreso.'],
      ['Tu Pet y Sweatpoints 🐑', 'Cada entrenamiento, comida y vaso de agua da Sweatpoints. Cuida a tu Pet y canjea puntos por recompensas.'],
      ['En vivo con tu coach ☁️', 'Tu coach ve tu progreso en vivo. ¿Preguntas? Contacta a tu coach en More. Repite el recorrido en More → Recorrido.']] }
  };
  var STEPS = [
    { go: 'today', sel: ['.verse', '#view .card'] },
    { go: 'train', sel: ['[data-act=start-workout]', '[data-act=ex-demo]', '[data-tab=train]'] },
    { go: 'food', sel: ['[data-act=water-add]', '[data-tab=food]'] },
    { go: 'progress', sel: ['[data-act=checkin]', '[data-act=body-add]', '[data-tab=progress]'] },
    { go: 'today', sel: ['.pet-scene', '[href="#/pet"]', '[data-tab=today]'] },
    { go: 'more', sel: ['#cloud-card', '[data-tab=more]'] }
  ];
  function L() { return TX[S.lang] || TX.en; }
  var ov = null, i = 0;
  function vis(el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  function find(sels) { for (var k = 0; k < sels.length; k++) { var el = document.querySelector(sels[k]); if (el && vis(el)) return el; } return null; }
  function close() { if (ov) { ov.remove(); ov = null; } try { localStorage.setItem('fbg.tourDone', '1'); localStorage.removeItem('fbg.tourPending'); } catch (e) {} }
  function show() {
    var st = STEPS[i], tx = L(), s = tx.steps[i];
    if (location.hash !== '#/' + st.go) App.go(st.go);
    setTimeout(function () {
      if (!ov) return;
      var el = find(st.sel), hole = ov.querySelector('.tr-hole'), box = ov.querySelector('.tr-box');
      box.innerHTML = '<div class="tr-dots">' + STEPS.map(function (_, k) { return '<i' + (k === i ? ' class="on"' : '') + '></i>'; }).join('') + '</div><h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) + '</p>' +
        '<div class="tr-row"><button class="tr-skip">' + esc(tx.skip) + '</button><span style="flex:1"></span>' + (i ? '<button class="tr-back">' + esc(tx.back) + '</button>' : '') + '<button class="tr-next">' + esc(i === STEPS.length - 1 ? tx.done : tx.next) + '</button></div>';
      box.querySelector('.tr-skip').onclick = close;
      box.querySelector('.tr-next').onclick = function () { if (i === STEPS.length - 1) { close(); App.go('today'); } else { i++; show(); } };
      var bk = box.querySelector('.tr-back'); if (bk) bk.onclick = function () { i--; show(); };
      if (el) {
        if (!el.closest('.tabbar')) el.scrollIntoView({ block: 'center' });
        var r = el.getBoundingClientRect(), p = 6;
        hole.style.cssText = 'display:block;top:' + (r.top - p) + 'px;left:' + (r.left - p) + 'px;width:' + (r.width + 2 * p) + 'px;height:' + (r.height + 2 * p) + 'px';
        var below = r.top + r.height / 2 < innerHeight / 2;
        box.className = 'tr-box ' + (below ? 'tr-bottom' : 'tr-top');
      } else { hole.style.cssText = 'display:none'; box.className = 'tr-box tr-center'; ov.classList.add('tr-dim'); }
      if (el) ov.classList.remove('tr-dim');
    }, 350);
  }
  App.startTour = function () { if (ov) return; i = 0; ov = document.createElement('div'); ov.className = 'tr-ov'; ov.setAttribute('role', 'dialog'); ov.innerHTML = '<div class="tr-hole"></div><div class="tr-box"></div>'; document.body.appendChild(ov); show(); };
  A['tour'] = function () { App.startTour(); };
  var css = document.createElement('style');
  css.textContent = '.tr-ov{position:fixed;inset:0;z-index:9999}.tr-ov.tr-dim{background:rgba(0,0,0,.72)}.tr-hole{position:fixed;border-radius:14px;box-shadow:0 0 0 9999px rgba(0,0,0,.72),0 0 0 2px #d4af37,0 0 18px rgba(212,175,55,.6);transition:all .25s;pointer-events:none}' +
    '.tr-box{position:fixed;left:14px;right:14px;max-width:460px;margin:0 auto;background:#0b0b0b;border:1px solid #d4af37;border-radius:16px;padding:16px;color:#f5f0e1;box-shadow:0 10px 40px rgba(0,0,0,.6)}.tr-box h3{margin:6px 0;color:#d4af37;font-size:18px}.tr-box p{margin:0 0 12px;font-size:15px;line-height:1.45}' +
    '.tr-top{top:calc(env(safe-area-inset-top) + 16px)}.tr-bottom{bottom:calc(env(safe-area-inset-bottom) + 92px)}.tr-center{top:50%;transform:translateY(-50%)}.tr-row{display:flex;gap:8px;align-items:center}.tr-row button{border-radius:10px;padding:9px 14px;font-weight:700;border:1px solid #d4af37;background:transparent;color:#d4af37}.tr-row .tr-next{background:linear-gradient(135deg,#d4af37,#f0d47a);color:#000}.tr-row .tr-skip{border:0;color:#999;padding-left:0;font-weight:500}' +
    '.tr-dots{display:flex;gap:6px}.tr-dots i{width:7px;height:7px;border-radius:50%;background:#444}.tr-dots i.on{background:#d4af37;width:18px;border-radius:4px}';
  document.head.appendChild(css);
  var oMore = V.more; V.more = function () { var h = oMore.apply(this, arguments); if (S.role !== 'athlete') return h; return h + '<button class="btn block" data-act="tour" style="margin:12px 0;border:1px solid rgba(212,175,55,.6);color:var(--gold,#d4af37)">🧭 ' + esc(L().t) + '</button>'; };
  var oRoute = App.route; App.route = function () {
    var r = oRoute.apply(this, arguments);
    try { if (S.role === 'athlete' && !ov && !localStorage.getItem('fbg.tourDone') && !document.querySelector('.join') && !document.querySelector('.pw-ov')) setTimeout(App.startTour, 600); } catch (e) {}
    return r;
  };
})();
