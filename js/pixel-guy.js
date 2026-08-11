/* pixel-guy.js — remplace le carré vert du logo (carré blanc + carré vert)
   par le petit bonhomme pixel qui saute toutes les quelques secondes.
   Même sprite que le bonhomme qui marche en bas de la page d'accueil :
   lunettes, hoodie bordeaux. Aucune image, aucun réseau — tout est dessiné.
   Le canvas est volontairement plus grand que le logo et déborde : le saut
   sort du cadre, comme un vrai personnage de jeu. */
(function (global) {
  'use strict';

  var logos = global.document.querySelectorAll('.logo');
  if (!logos.length) return;

  var PAL = { C: '#2f2418', F: '#eab88a', B: '#1a1a1a', H: '#6d1f2c', P: '#2b4a6f', S: '#222222' };

  /* 12 x 14 pixels : marche (2 frames) + saut (jambes repliées) */
  var FRAMES = {
    walk0: [
      '..CCCCCC..', '.CCCCCCCC.', '.CFFFFFFC.', '.CFBFFBFC.', '.CFFFFFFC.',
      '..FFFFFF..', '..HHHHHH..', '.HHHHHHHH.', '..HHHHHH..', '..HHHHHH..',
      '..PP..PP..', '.PP....PP.', '.PP....PP.', '.SS....SS.'
    ],
    walk1: [
      '..CCCCCC..', '.CCCCCCCC.', '.CFFFFFFC.', '.CFBFFBFC.', '.CFFFFFFC.',
      '..FFFFFF..', '..HHHHHH..', '.HHHHHHHH.', '..HHHHHH..', '..HHHHHH..',
      '...PPPP...', '..PP..PP..', '..PP..PP..', '..SS..SS..'
    ],
    jump: [
      '..CCCCCC..', '.CCCCCCCC.', '.CFFFFFFC.', '.CFBFFBFC.', '.CFFFFFFC.',
      '..FFFFFF..', '..HHHHHH..', '.HHHHHHHH.', '..HHHHHH..', '..HHHHHH..',
      '..PP..PP..', '..PP..PP..', '.SS....SS.', '..........'
    ]
  };

  function drawGuy(ctx, gx, gy, frame, px) {
    var rows = FRAMES[frame];
    for (var y = 0; y < rows.length; y++) {
      var row = rows[y];
      for (var x = 0; x < row.length; x++) {
        var c = PAL[row[x]];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(gx + x * px, gy + y * px, px, px);
      }
    }
  }

  logos.forEach(function (host) {
    var cv = global.document.createElement('canvas');
    cv.className = 'guy-canvas';
    host.appendChild(cv);
    var ctx = cv.getContext('2d');

    /* Le canvas est 50 % plus grand que le logo et centré dessous : le saut
       dépasse du cadre. Le sprite fait 12x14 px ; on choisit l'échelle
       entière la plus grande qui tient dans ce canvas agrandi. */
    var pad = 14;   /* px de marge tout autour pour le saut */
    var geo = { px: 2, w: 0, h: 0, ox: 0, oy: 0 };
    function fit() {
      var w = host.clientWidth || 24;
      var h = host.clientHeight || 24;
      var cw = w + pad * 2, ch = h + pad * 2;
      var px = Math.max(1, Math.floor(Math.min(cw / 12, ch / 14)));
      geo.px = px;
      geo.w = cw; geo.h = ch;
      geo.ox = Math.round((cw - 12 * px) / 2);
      geo.oy = Math.round((ch - 14 * px) / 2);
      cv.width = cw; cv.height = ch;
      cv.style.left = (-pad) + 'px';
      cv.style.top = (-pad) + 'px';
    }
    fit();
    global.addEventListener('resize', fit);

    /* le saut : toutes les 3,2 à 4,8 s, un bond d'environ 60 % de la hauteur */
    var interval = 3200 + Math.random() * 1600;
    var t0 = performance.now() + Math.random() * interval;
    var J = 0.55;   /* durée du saut, en fraction de l'intervalle */

    function frame(now) {
      requestAnimationFrame(frame);
      var t = (now - t0) % interval;
      ctx.clearRect(0, 0, cv.width, cv.height);

      var jumpH = 0, frameName = 'walk0';
      if (t / interval < J) {
        var p = (t / interval) / J;
        jumpH = Math.round(Math.sin(Math.PI * p) * geo.px * 6);
        frameName = 'jump';
      } else {
        var w = Math.floor((t - interval * J) / 260) % 2;
        frameName = w === 0 ? 'walk0' : 'walk1';
      }

      drawGuy(ctx, geo.ox, geo.oy - jumpH, frameName, geo.px);
    }
    requestAnimationFrame(frame);
  });
})(window);
