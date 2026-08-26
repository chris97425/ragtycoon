/* ui.js: the guide panel, the HUD and the transport controls. */
(function (global) {
  'use strict';

  var Park = global.Park, Tour = global.Tour, Renderer = global.Renderer;

  var el = {};
  var pinned = null;          // a stop the viewer clicked, held until they clear it
  var flyTo = null;
  var lastPainted = null;

  function $(id) { return document.getElementById(id); }

  function init() {
    ['chip', 'name', 'short', 'body', 'tip', 'dwell', 'dwellBar', 'dwellHint',
     'hudStop', 'hudLayer', 'hudBatch', 'hudNote', 'stopList', 'playGlyph',
     'progressBar', 'pinNote'].forEach(function (k) { el[k] = $('ui-' + k); });

    buildStopList();

    $('btn-play').addEventListener('click', function () { Tour.toggle(); paint(true); });
    $('btn-step').addEventListener('click', function () { Tour.step(); });
    $('btn-restart').addEventListener('click', function () { resetAll(); });
    $('btn-unpin').addEventListener('click', function () { unpin(); });

    var speed = $('speed');
    speed.addEventListener('input', function () {
      Tour.state.speed = parseFloat(speed.value);
      $('v-speed').textContent = Tour.state.speed.toFixed(1) + '\u00d7';
    });

    var labels = $('labels');
    labels.addEventListener('change', function () { Renderer.setLabels(labels.checked); });

    $('btn-about').addEventListener('click', function () { $('about').hidden = false; });
    $('about-close').addEventListener('click', function () { $('about').hidden = true; });
    $('about').addEventListener('click', function (e) {
      if (e.target === $('about')) $('about').hidden = true;
    });

    /* The phone sheet: collapsed shows just the stop head, expanded shows the
       full explanation and the route list. */
    var sheet = $('sheet-handle');
    sheet.addEventListener('click', function () {
      var g = $('guide');
      var open = !g.classList.contains('open');
      g.classList.toggle('open', open);
      sheet.setAttribute('aria-expanded', String(open));
      sheet.querySelector('.sheet-label').textContent = open ? 'Montrer moins' : 'Lire la suite';
      if (open) g.scrollTop = 0;
    });

    var pbtn = $('btn-panel');
    pbtn.addEventListener('click', function () {
      var p = $('guide');
      var hide = !p.classList.contains('hidden');
      p.classList.toggle('hidden', hide);
      pbtn.textContent = hide ? 'Montrer le guide' : 'Masquer le guide';
      pbtn.setAttribute('aria-expanded', String(!hide));
    });

    Tour.on(function (name, id) {
      if (name === 'stage' && !pinned) showStop(Park.stopById[id], false);
      if (name === 'reset') { pinned = null; lastPainted = null; }
    });
  }

  function buildStopList() {
    var host = el.stopList;
    host.innerHTML = '';
    Park.stops.forEach(function (s, i) {
      var b = document.createElement('button');
      b.className = 'stop-chip act' + s.act;
      b.dataset.id = s.id;
      b.innerHTML = '<i>' + (i + 1) + '</i>' + s.name;
      b.addEventListener('click', function () {
        pinned = null;
        Tour.jumpTo(s.id);
        flyTo = { x: s.x, y: s.y };
        collapseSheet();   /* on a phone, get out of the way of the ride */
      });
      host.appendChild(b);
    });
  }

  /* No-op unless the sheet layout is active, since the handle is display:none
     on wider screens where nothing is collapsed in the first place. */
  function collapseSheet() {
    var g = $('guide'), h = $('sheet-handle');
    if (!g || !h || !h.offsetParent) return;
    g.classList.remove('open');
    h.setAttribute('aria-expanded', 'false');
    h.querySelector('.sheet-label').textContent = 'Lire la suite';
  }

  function showStop(stop, isPin) {
    if (!stop) return;
    pinned = isPin ? stop : pinned;
    render(stop);
    el.pinNote.hidden = !isPin;
  }

  /* Noms d'actes : le chapitre peut fournir Park.ACT_NAMES (ex. ch2 socle technique) ;
     sinon, fallback sur les noms du chapitre 1 (rétrocompatible). */
  var ACT_NAME = (Park && Park.ACT_NAMES) || { 1: 'Acte 1 · Du document brut aux chunks', 2: 'Acte 2 · L\u2019indexation',
                   3: 'Acte 3 · La boucle de recherche', 4: 'Acte 4 · La génération',
                   5: 'Acte 5 · Livraison et évaluation' };

  function render(stop) {
    if (lastPainted === stop.id && !pinned) return;
    lastPainted = stop.id;
    var n = Park.stops.indexOf(stop) + 1;
    el.chip.textContent = 'Arrêt ' + n + ' sur ' + Park.stops.length;
    el.chip.className = 'chip act' + stop.act;
    el.name.textContent = stop.name;
    el.short.textContent = stop.short;
    el.body.textContent = stop.body;
    el.tip.innerHTML = '<b>Astuce Tycoon :</b> ' + stop.tip;
    el.hudNote.textContent = ACT_NAME[stop.act] || '';

    /* 🛠 outillage open source + 📚 sources, spécifiques à l'arrêt.
       TECHNOS est fourni par le chapitre (technos.js) ; sans lui, on
       n'affiche rien et le guide reste inchangé. */
    renderTech(stop);

    var chips = el.stopList.children;
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('on', chips[i].dataset.id === stop.id);
      chips[i].classList.toggle('seen', Tour.seen(chips[i].dataset.id));
    }
  }

  function renderTech(stop) {
    var sec = $('ui-toolsSec'), refsSec = $('ui-refsSec');
    if (!sec || !global.TECHNOS) return;
    var d = global.TECHNOS[stop.id];
    if (!d) { sec.hidden = true; refsSec.hidden = true; return; }

    var ul = $('ui-tools');
    ul.innerHTML = '';
    (d.tools || []).forEach(function (t) {
      var li = document.createElement('li');
      var b = document.createElement('b');
      b.textContent = t.n;
      li.appendChild(b);
      if (t.u) {
        var a = document.createElement('a');
        a.href = t.u; a.target = '_blank'; a.rel = 'noopener';
        a.textContent = '↗ ' + t.u.replace(/^https?:\/\/(www\.)?/, '');
        li.appendChild(a);
      }
      if (t.d) {
        var dd = document.createElement('span');
        dd.className = 'd'; dd.textContent = t.d;
        li.appendChild(dd);
      }
      ul.appendChild(li);
    });
    sec.hidden = !(d.tools && d.tools.length);

    var ur = $('ui-refs');
    ur.innerHTML = '';
    (d.refs || []).forEach(function (r) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = r.u; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = '↗ ' + r.t;
      li.appendChild(a);
      if (r.d) {
        var dd = document.createElement('span');
        dd.className = 'd'; dd.textContent = r.d;
        li.appendChild(dd);
      }
      ur.appendChild(li);
    });
    refsSec.hidden = !(d.refs && d.refs.length);
  }

  function unpin() {
    pinned = null;
    el.pinNote.hidden = true;
    lastPainted = null;
    if (Tour.state.stage) render(Park.stopById[Tour.state.stage] || Park.stops[0]);
  }

  function resetAll() {
    Tour.reset(true);
    lastPainted = null;
    render(Park.stops[0]);
    Tour.play();
    paint(true);
  }

  /* ---- per frame --------------------------------------------------------- */

  function paint(force) {
    var s = Tour.state;

    el.playGlyph.textContent = s.paused ? '\u25b6' : '\u275a\u275a';

    var pct = s.dwellTotal > 0 ? (1 - s.dwellLeft / s.dwellTotal) : 1;
    el.dwell.hidden = !(s.dwellTotal > 0 && s.dwellLeft > 0);
    el.dwellBar.style.width = (pct * 100).toFixed(1) + '%';
    el.dwellHint.textContent = s.reading
      ? 'lecture en cours · Espace pour rester ici'
      : 'on avance';

    el.hudStop.textContent = s.seenCount + ' / ' + Park.stops.length;
    el.hudLayer.textContent = s.lap + ' sur ' + s.laps + ' passes';
    el.hudBatch.textContent = '#' + s.batch;
    el.progressBar.style.width = (Tour.progress() * 100).toFixed(1) + '%';

    if (s.tourDone && !s.reading) {
      el.hudNote.textContent = 'Tous les arrêts expliqués · vitesse de croisière';
    }
  }

  global.UI = {
    init: init,
    paint: paint,
    showStop: showStop,
    unpin: unpin,
    resetAll: resetAll,
    activeStop: function () { return pinned ? pinned.id : Tour.state.stage; },
    isPinned: function () { return !!pinned; },
    takeFlyTo: function () { var f = flyTo; flyTo = null; return f; },
    boot: function () { render(Park.stops[0]); paint(true); }
  };
})(window);
