/* render.js: paints the park.
   Ground first as flat fills, then every solid through a painter's algorithm
   keyed on the front corner of its footprint. Text layout guarantees that no
   two labels ever overlap: the cart tag is the top priority, every stop sign
   is placed around it (or dropped) so the ride stays perfectly legible. */
(function (global) {
  'use strict';

  var Iso = global.Iso, Park = global.Park, Tour = global.Tour;
  var C = Park.C;

  var showLabels = true;

  /* ---- scenery scattered once at load ------------------------------------ */

  var props = null;

  /* Sample every route so props can be kept clear of the roads. */
  function routeSamples() {
    var pts = [];
    Object.keys(Park.routes).forEach(function (k) {
      var r = Park.routes[k];
      for (var d = 0; d <= r.total; d += 1.2) {
        var p = r.at(d);
        pts.push(p);
      }
    });
    return pts;
  }

  function buildProps() {
    var road = routeSamples();
    var out = [];
    var B = Park.BOUNDS;

    function clearOfRoad(x, y, m) {
      for (var i = 0; i < road.length; i++) {
        if (Math.abs(road[i].x - x) < m && Math.abs(road[i].y - y) < m) {
          if (Math.hypot(road[i].x - x, road[i].y - y) < m) return false;
        }
      }
      return true;
    }
    function clearOfLots(x, y, m) {
      for (var i = 0; i < Park.LOTS.length; i++) {
        var L = Park.LOTS[i];
        if (x > L.x - m && x < L.x + L.w + m && y > L.y - m && y < L.y + L.d + m) return false;
      }
      return true;
    }

    /* Sparse planting only: enough to read as parkland without hiding the
       buildings, which are the whole point of the tour. */
    var n = 0;
    for (var gx = B.x0 + 1; gx < B.x1 - 1; gx += 2.2) {
      for (var gy = B.y0 + 1; gy < B.y1 - 1; gy += 2.2) {
        var h = Iso.hash2(Math.round(gx * 3), Math.round(gy * 3), 17);
        if (h > 0.19) continue;
        var x = gx + (Iso.hash2(gx | 0, gy | 0, 5) - 0.5) * 1.4;
        var y = gy + (Iso.hash2(gx | 0, gy | 0, 9) - 0.5) * 1.4;
        if (!clearOfLots(x, y, 1.1) || !clearOfRoad(x, y, 2.4)) continue;
        n++;
        out.push({ kind: h < 0.12 ? 'tree' : 'bush', x: x, y: y, s: 0.8 + Iso.hash2(n, 2, 3) * 0.35 });
      }
    }

    /* Lamp posts follow the roads at a steady spacing, the way park lighting
       actually does, rather than being scattered across open grass. */
    Object.keys(Park.routes).forEach(function (k) {
      var r = Park.routes[k];
      for (var d = 4; d < r.total - 3; d += 11) {
        var p = r.at(d);
        var lx = p.x - p.dy * 1.9, ly = p.y + p.dx * 1.9;
        if (!clearOfLots(lx, ly, 0.5)) continue;
        out.push({ kind: 'lamp', x: lx, y: ly, s: 1 });
      }
    });

    /* benches and lamps facing the plaza in the middle of the ring */
    for (var i = 0; i < 6; i++) {
      out.push({ kind: 'bench', x: 22 + i * 3.4, y: 26.2, s: 1 });
      out.push({ kind: 'bench', x: 22 + i * 3.4, y: 30.2, s: 1 });
    }
    [[20.5, 25.4], [43, 25.4], [20.5, 31], [43, 31]].forEach(function (p) {
      out.push({ kind: 'lamp', x: p[0], y: p[1], s: 1 });
    });
    return out;
  }

  /* ---- ground ------------------------------------------------------------ */

  function drawGround(ctx, cam) {
    var B = Park.GROUND;

    ctx.fillStyle = C.grass;
    Iso.quad(ctx, B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0, 0);

    /* The checker is clipped to what the camera can actually see. Without that
       a ground plate big enough to fill the screen at minimum zoom would cost
       tens of thousands of quads every frame. */
    var vw = ctx.canvas.width / cam.dpr, vh = ctx.canvas.height / cam.dpr;
    var lo = { x: 1e9, y: 1e9 }, hi = { x: -1e9, y: -1e9 };
    [[0, 0], [vw, 0], [0, vh], [vw, vh]].forEach(function (c) {
      var g = Iso.unproject((c[0] - cam.ox) / cam.scale, (c[1] - cam.oy) / cam.scale);
      lo.x = Math.min(lo.x, g.x); hi.x = Math.max(hi.x, g.x);
      lo.y = Math.min(lo.y, g.y); hi.y = Math.max(hi.y, g.y);
    });
    var x0 = Math.max(B.x0, Math.floor((lo.x - 6) / 4) * 4);
    var x1 = Math.min(B.x1, hi.x + 6);
    var y0 = Math.max(B.y0, Math.floor((lo.y - 6) / 4) * 4);
    var y1 = Math.min(B.y1, hi.y + 6);

    /* checker with a subtle per-cell tint variation so the lawn reads as
       mown stripes rather than flat plastic */
    for (var x = x0; x < x1; x += 4) {
      for (var y = y0; y < y1; y += 4) {
        if ((Math.round(x / 4 + y / 4) & 1)) continue;
        var tint = Iso.hash2(x, y, 31) * 0.05 - 0.025;
        ctx.fillStyle = Iso.mix(C.grassAlt, C.grass, 0.5 + tint * 10);
        Iso.quad(ctx, x, y, 4, 4, 0);
      }
    }

    /* paved lots */
    for (var i = 0; i < Park.LOTS.length; i++) {
      var L = Park.LOTS[i];
      ctx.fillStyle = Iso.shade(L.c, 0.86);
      Iso.quad(ctx, L.x - 0.18, L.y - 0.18, L.w + 0.36, L.d + 0.36, 0.001);
      ctx.fillStyle = L.c;
      Iso.quad(ctx, L.x, L.y, L.w, L.d, 0.002);
      /* a fine edge line so lots read as paved slabs */
      ctx.strokeStyle = 'rgba(74,53,32,0.22)';
      ctx.lineWidth = 1;
      Iso.stroke(ctx, [Iso.project(L.x, L.y, 0.003), Iso.project(L.x + L.w, L.y, 0.003),
                       Iso.project(L.x + L.w, L.y + L.d, 0.003), Iso.project(L.x, L.y + L.d, 0.003)], true);
    }

    /* the roads the cart drives */
    Object.keys(Park.routes).forEach(function (k) {
      var r = Park.routes[k];
      ctx.fillStyle = C.pathEdge;
      for (var s = 0; s < r.segs.length; s++) {
        var g = r.segs[s];
        Iso.ribbon(ctx, g.a.x, g.a.y, g.b.x, g.b.y, 2.6, 0.004);
      }
      ctx.fillStyle = C.path;
      for (var s2 = 0; s2 < r.segs.length; s2++) {
        var g2 = r.segs[s2];
        Iso.ribbon(ctx, g2.a.x, g2.a.y, g2.b.x, g2.b.y, 2.2, 0.005);
      }
      /* dashed centre line, like a park tramway */
      ctx.fillStyle = 'rgba(120,96,60,0.35)';
      for (var d = 0; d < r.total; d += 2.6) {
        var p = r.at(d);
        Iso.ribbon(ctx, p.x, p.y, p.x + p.dx * 0.9, p.y + p.dy * 0.9, 0.1, 0.006);
      }
      /* round off the corners so the joins do not show as notches */
      ctx.fillStyle = C.path;
      for (var p2 = 1; p2 < r.pts.length - 1; p2++) Iso.disc(ctx, r.pts[p2].x, r.pts[p2].y, 0.006, 1.1);
    });
  }

  /* A pulsing ring under whichever stop is being explained. */
  function drawFocusRing(ctx, stop, clock, strength) {
    var k = 0.5 + 0.5 * Math.sin(clock * 3);
    ctx.strokeStyle = 'rgba(242,193,78,' + (0.45 + 0.4 * k) * strength + ')';
    ctx.lineWidth = 3 + k * 2;
    Iso.discEdge(ctx, stop.x, stop.y, 0.02, 2.6 + k * 0.3);
    ctx.fillStyle = 'rgba(242,193,78,' + 0.10 * strength + ')';
    Iso.disc(ctx, stop.x, stop.y, 0.015, 2.6);
  }

  /* ---- the cart and its cargo -------------------------------------------- */

  var R = 0.82;          // document radius on the cart

  /* A flat sheet of paper on the cart, with a few text lines. */
  function paperSheet(ctx, x, y, z, c, lines, tilt) {
    Iso.orientedBox(ctx, { x: x, y: y, hx: 1, hy: 0, len: 1.9, wid: 1.35, z: z, h: 0.07,
                           color: c || C.paper });
    var p = Iso.project(x, y, z + 0.09);
    ctx.save();
    if (tilt) { ctx.translate(p.x, p.y); ctx.rotate(Math.sin(tilt) * 0.08); ctx.translate(-p.x, -p.y); }
    ctx.strokeStyle = 'rgba(70,60,45,0.55)';
    ctx.lineWidth = 1.4;
    for (var i = 0; i < lines; i++) {
      var w = 30 - (i % 2) * 8;
      ctx.beginPath();
      ctx.moveTo(p.x - w / 2, p.y - 10 + i * 6);
      ctx.lineTo(p.x - w / 2 + w, p.y - 10 + i * 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* Coloured chunks, the unit everything is retrieved in. */
  function chunkPile(ctx, x, y, z, n, meta) {
    var cols = ['#3f7fd4', '#9a5fd0', '#c9793f', '#3fb5a0', '#c8453a'];
    for (var i = 0; i < n; i++) {
      var cx = x - 0.5 + (i % 2) * 0.5, cy = y - 0.42 + Math.floor(i / 2) * 0.44;
      Iso.box(ctx, { x: cx, y: cy, z: z, w: 0.44, d: 0.38, h: 0.14, color: cols[i % 5] });
      if (meta) {
        Iso.box(ctx, { x: cx + 0.05, y: cy + 0.05, z: z + 0.14, w: 0.2, d: 0.12, h: 0.06, color: C.gold });
      }
    }
  }

  /* Glowing vector dots: the semantic coordinates. */
  function vectorDots(ctx, x, y, z, t, n) {
    n = n || 5;
    for (var i = 0; i < n; i++) {
      var a = i * 1.35 + t * 0.4;
      var dx = Math.cos(a) * 0.34, dy = Math.sin(a) * 0.3;
      ctx.fillStyle = 'rgba(34,211,238,' + (0.55 + 0.45 * Math.sin(t * 3 + i)) + ')';
      Iso.disc(ctx, x + dx, y + dy, z + 0.05, 0.13);
    }
  }

  /* A question bubble. */
  function questionBubble(ctx, x, y, z, t) {
    var p = Iso.project(x, y, z);
    var k = 1 + 0.06 * Math.sin(t * 4);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(k, k);
    ctx.translate(-p.x, -p.y);
    ctx.fillStyle = '#22303f';
    ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, 6.2832); ctx.fill();
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 17px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', p.x, p.y + 1);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  /* The top-k after reranking: a neat row of selected chunks. */
  function topKRow(ctx, x, y, z, t, n) {
    n = n || 5;
    for (var i = 0; i < n; i++) {
      var hgt = 0.16 + (n - i) * 0.05;
      Iso.box(ctx, { x: x - 0.6 + i * 0.32, y: y - 0.16, z: z, w: 0.26, d: 0.32, h: hgt,
                     color: i < 2 ? C.gold : (i < 4 ? '#c9d3dd' : '#a8763f') });
    }
  }

  /* The answer: a sheet with a green check and citation marks. */
  function answerSheet(ctx, x, y, z, t, cited) {
    paperSheet(ctx, x, y, z, '#f4f1e8', 3, t);
    var p = Iso.project(x, y, z + 0.12);
    ctx.fillStyle = cited ? '#34d399' : '#4fd0c0';
    ctx.font = 'bold 11px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(cited ? '\u2713 [1][2][3]' : '\u2713', p.x, p.y - 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  function drawCargo(ctx, x, y, z, s, t) {
    switch (s.cargo) {
      case 'raw':
        paperSheet(ctx, x, y, z, '#e3dcc8', 4, t);
        break;
      case 'parsed':
        paperSheet(ctx, x, y, z, C.paper, 5, t);
        break;
      case 'clean':
        paperSheet(ctx, x, y, z, '#f7f5ee', 3, t);
        break;
      case 'chunks':
        chunkPile(ctx, x, y, z, 4, false);
        break;
      case 'meta':
        chunkPile(ctx, x, y, z, 4, true);
        break;
      case 'unique':
        chunkPile(ctx, x, y, z, 3, true);
        break;
      case 'vectors':
        vectorDots(ctx, x, y, z, t, 5);
        break;
      case 'indexed':
        ctx.fillStyle = '#2f3945';
        Iso.disc(ctx, x, y, z + 0.02, 0.7);
        ctx.fillStyle = '#34d399';
        for (var i = 0; i < 5; i++) {
          var a = i * 1.31;
          Iso.disc(ctx, x + Math.cos(a) * 0.4, y + Math.sin(a) * 0.36, z + 0.06, 0.12);
        }
        break;
      case 'filtered':
        chunkPile(ctx, x, y, z, 3, true);
        break;
      case 'question':
        questionBubble(ctx, x, y, z + 0.05, t);
        break;
      case 'rewritten':
        questionBubble(ctx, x, y, z + 0.05, t * 1.4);
        /* little sparks: the variants */
        for (var v = 0; v < 3; v++) {
          var va = t * 2 + v * 2.1;
          ctx.fillStyle = 'rgba(34,211,238,0.7)';
          Iso.disc(ctx, x + Math.cos(va) * 0.5, y + Math.sin(va) * 0.45, z + 0.02, 0.07);
        }
        break;
      case 'candidates':
        /* two streams: keyword chips + vector dots */
        for (var c = 0; c < 3; c++) {
          Iso.box(ctx, { x: x - 0.55 + c * 0.38, y: y - 0.1, z: z, w: 0.3, d: 0.22, h: 0.1,
                         color: c % 2 ? C.gold : C.violet });
        }
        vectorDots(ctx, x + 0.15, y - 0.1, z + 0.02, t, 3);
        break;
      case 'fused':
        ctx.strokeStyle = 'rgba(242,193,78,0.85)';
        ctx.lineWidth = 1.6;
        for (var rr = 1; rr <= 2; rr++) {
          Iso.discEdge(ctx, x, y, z + 0.05, rr * 0.3);
        }
        Iso.disc(ctx, x, y, z + 0.05, 0.12);
        break;
      case 'topk':
        topKRow(ctx, x, y, z, t, 5);
        break;
      case 'rights':
        topKRow(ctx, x, y, z, t, 3);
        break;
      case 'prompt':
        chunkPile(ctx, x, y, z, 3, true);
        questionBubble(ctx, x + 0.5, y + 0.3, z + 0.1, t);
        break;
      case 'answer':
        answerSheet(ctx, x, y, z, t, false);
        break;
      case 'cited':
        answerSheet(ctx, x, y, z, t, true);
        break;
      case 'safe':
        answerSheet(ctx, x, y, z, t, true);
        /* a small shield */
        var sh = Iso.project(x + 0.55, y - 0.4, z + 0.1);
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y - 7); ctx.lineTo(sh.x + 5, sh.y - 4);
        ctx.lineTo(sh.x + 5, sh.y + 1); ctx.lineTo(sh.x, sh.y + 6);
        ctx.lineTo(sh.x - 5, sh.y + 1); ctx.lineTo(sh.x - 5, sh.y - 4);
        ctx.closePath(); ctx.fill();
        break;
      case 'logged':
        answerSheet(ctx, x, y, z, t, true);
        /* little log bars */
        for (var lg = 0; lg < 3; lg++) {
          ctx.fillStyle = 'rgba(79,208,192,0.8)';
          Iso.ribbon(ctx, x - 0.6, y - 0.5 + lg * 0.18, x + 0.1, y - 0.5 + lg * 0.18, 0.05, z + 0.14);
        }
        break;
      case 'delivered':
        answerSheet(ctx, x, y, z, t, true);
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        var dp = Iso.project(x, y + 0.45, z + 0.1);
        ctx.fillText('SCORES OK', dp.x, dp.y);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        break;
    }
  }

  /* The cart hauls the document round the park; once the answer is logged at
     the audit dock the same drawable becomes the lorry that delivers it.
     Reading the route rather than a flag keeps this correct after any jump. */
  function hauling() {
    var r = Tour.cart.routeName;
    return r === 'deliver' || r === 'ret';
  }

  function drawLorry(ctx, p, s, t) {
    Iso.shadow(ctx, p.x, p.y, 1.7);
    var hx = p.dx || 1, hy = p.dy || 0;
    Park.draw.lorry(ctx, p.x, p.y, p.z, hx, hy, '#3f7fd4');
    var cx = p.x - hx * Park.lorryLoad, cy = p.y - hy * Park.lorryLoad, cz = p.z + Park.lorryBed;
    var pop = 1 + 0.38 * s.flash * s.flash;
    if (pop > 1.001) {
      var a = Iso.project(cx, cy, cz);
      ctx.save();
      ctx.translate(a.x, a.y); ctx.scale(pop, pop); ctx.translate(-a.x, -a.y);
      drawCargo(ctx, cx, cy, cz, s, t);
      ctx.restore();
    } else {
      drawCargo(ctx, cx, cy, cz, s, t);
    }
  }

  function drawCart(ctx, p, s, t) {
    if (hauling()) { drawLorry(ctx, p, s, t); return; }
    Iso.shadow(ctx, p.x, p.y, 1.1);
    var hx = p.dx || 1, hy = p.dy || 0;
    /* chassis and a bright tycoon-yellow body */
    Iso.orientedBox(ctx, { x: p.x, y: p.y, hx: hx, hy: hy, len: 2.7, wid: 1.6, z: p.z, h: 0.18, color: '#2b3038' });
    Iso.orientedBox(ctx, { x: p.x, y: p.y, hx: hx, hy: hy, len: 2.4, wid: 1.4, z: p.z + 0.18, h: 0.32, color: '#e8b23c' });
    Park.draw.guest(ctx, p.x + hx * 0.82, p.y + hy * 0.82, p.z + 0.5, '#3f7fd4', '#ffffff', t * 6);

    /* A short pop as the cargo changes, so the eye is pulled to it at the
       moment the material actually becomes something else. */
    var cx = p.x - hx * 0.38, cy = p.y - hy * 0.38, cz = p.z + 0.5;
    var pop = 1 + 0.38 * s.flash * s.flash;
    if (pop > 1.001) {
      var a = Iso.project(cx, cy, cz);
      ctx.save();
      ctx.translate(a.x, a.y); ctx.scale(pop, pop); ctx.translate(-a.x, -a.y);
      drawCargo(ctx, cx, cy, cz, s, t);
      ctx.restore();
    } else {
      drawCargo(ctx, cx, cy, cz, s, t);
    }
  }

  /* ---- text layout: NO overlapping labels, ever --------------------------- */

  var FONT_LABEL = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
  var FONT_TAG = 'bold 12.5px "Trebuchet MS", Verdana, sans-serif';
  var TAG_PAD = 10;

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /* Compute the screen rectangle the cart tag will occupy. Null when it is
     not drawn (too zoomed out, no cargo label). */
  function cartTagRect(ctx, cam, p, s) {
    var text = Park.cargoLabels[s.cargo];
    if (!text || cam.scale < 0.35) return null;
    if (Park.loopCargo[s.cargo] && s.lap > 0) text += ' · passe ' + s.lap;

    var w = Iso.project(p.x, p.y, p.z + 1.9);
    var sx = w.x * cam.scale + cam.ox;
    var sy = w.y * cam.scale + cam.oy;
    ctx.font = FONT_TAG;
    var tw = ctx.measureText(text).width + 20;

    return {
      x: sx - tw / 2, y: sy - 11, w: tw, h: 22,
      text: text, sx: sx, sy: sy, tw: tw
    };
  }

  /* A name tag riding above the cart. Drawn last, so nothing ever covers it. */
  function drawCartTag(ctx, cam, p, s, tag) {
    if (!tag) return;
    var sx = tag.sx, sy = tag.sy, tw = tag.tw;

    ctx.save();
    ctx.font = FONT_TAG;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    /* plate with a soft drop shadow, gold border and a pointer down */
    ctx.fillStyle = 'rgba(20,16,10,0.4)';
    roundRect(ctx, sx - tw / 2 + 1, sy - 10, tw, 22, 5);
    ctx.fill();
    ctx.fillStyle = '#22303f';
    roundRect(ctx, sx - tw / 2, sy - 11, tw, 22, 5);
    ctx.fill();
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = 2;
    roundRect(ctx, sx - tw / 2, sy - 11, tw, 22, 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx - 5, sy + 11); ctx.lineTo(sx + 5, sy + 11); ctx.lineTo(sx, sy + 17);
    ctx.closePath(); ctx.fillStyle = '#22303f'; ctx.fill();

    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(tag.text, sx, sy + 1);
    ctx.restore();

    if (Renderer._lastLayout) Renderer._lastLayout.tag = { x: tag.x, y: tag.y, w: tag.w, h: tag.h };
  }

  /* Stop signs, greedily placed so nothing overlaps: the cart tag and the
     detail panel are immovable objects, the active stop is placed first,
     every other sign tries its home position then a few nudges, and gives
     up rather than collide. */
  function drawLabels(ctx, cam, activeId, tag, detailBox) {
    if (cam.scale < 0.45) return;
    ctx.save();
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var placed = [];

    /* the cart tag is the top priority obstacle */
    var tagBox = tag ? { x: tag.x - TAG_PAD, y: tag.y - TAG_PAD,
                         w: tag.w + TAG_PAD * 2, h: tag.h + TAG_PAD * 2 } : null;
    function collides(r) {
      if (tagBox && rectsOverlap(r, tagBox)) return true;
      if (detailBox && rectsOverlap(r, detailBox)) return true;
      for (var i = 0; i < placed.length; i++) {
        if (rectsOverlap(r, placed[i])) return true;
      }
      return false;
    }

    var order = Park.stops.map(function (s, i) { return { s: s, i: i }; });
    order.sort(function (a, b) {
      return (b.s.id === activeId ? 1 : 0) - (a.s.id === activeId ? 1 : 0);
    });

    for (var oi = 0; oi < order.length; oi++) {
      var st = order[oi].s, i = order[oi].i;
      var w = Iso.project(st.x, st.y, 0);
      var sx = w.x * cam.scale + cam.ox;
      var sy = w.y * cam.scale + cam.oy - 46 * Math.min(1, cam.scale);
      if (sx < -120 || sy < -40 || sx > ctx.canvas.width / cam.dpr + 120 ||
          sy > ctx.canvas.height / cam.dpr + 40) continue;

      var on = st.id === activeId;
      var text = (i + 1) + '. ' + st.name;
      var tw = ctx.measureText(text).width + 16;

      /* try the home spot, then a few nudges up and down, never overlapping */
      var rect = { x: sx - tw / 2, y: sy - 10, w: tw, h: 20 };
      var dy = 0, placedRect = null;
      var nudges = [0, -26, 26, -52, 52, -78, 78];
      for (var n = 0; n < nudges.length; n++) {
        var tryR = { x: rect.x, y: rect.y + nudges[n], w: rect.w, h: rect.h };
        if (!collides(tryR)) { placedRect = tryR; dy = nudges[n]; break; }
      }
      if (!placedRect) continue;           // give up rather than overlap

      placed.push(placedRect);

      var py = sy + dy;
      ctx.fillStyle = on ? '#f2c14e' : 'rgba(239,224,189,0.94)';
      ctx.strokeStyle = '#4a3520';
      ctx.lineWidth = 2;
      roundRect(ctx, sx - tw / 2, py - 10, tw, 20, 4);
      ctx.fill();
      ctx.stroke();
      /* post down to the ground, drawn short so a nudged sign still reads
         as belonging to its stop */
      ctx.strokeStyle = 'rgba(74,53,32,0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, py + 10);
      ctx.lineTo(sx, py + 10 + 14 * Math.min(1, cam.scale));
      ctx.stroke();

      ctx.fillStyle = '#2f2113';
      ctx.fillText(text, sx, py + 1);
    }
    ctx.restore();
    /* debug: expose the laid-out text boxes so an automated test can prove
       that nothing ever overlaps */
    Renderer._lastLayout = { signs: placed.slice() };
  }

  /* ---- the "inside the document" panel -------------------------------------
     When the cart is stopped at a stop, an XP window floats in the canvas
     showing exactly what happens to the document there: the transformation
     itself, animated. The panel is opaque, so the sign layout treats it as
     an obstacle and no stop label ever slides underneath it. */

  var DETAIL_W = 330, DETAIL_H = 196, DETAIL_TB = 22;

  function detailPanelRect(viewW, viewH) {
    var rightLimit = viewW - 10;
    var g = document.getElementById('guide');
    if (g && !g.classList.contains('hidden')) {
      var gr = g.getBoundingClientRect();
      if (gr.left > 0 && gr.left < viewW && gr.top < viewH * 0.6) {
        rightLimit = gr.left - 10;
      }
    }
    var w = DETAIL_W, h = DETAIL_H;
    var x = Math.max(10, Math.min((viewW - w) / 2, rightLimit - w));
    var y = 58;
    return { x: x, y: y, w: w, h: h };
  }

  function drawDetailPanel(ctx, cam, clock, stop, s) {
    if (!stop || !(s.dwellLeft > 0)) return;
    var viewW = ctx.canvas.width / cam.dpr, viewH = ctx.canvas.height / cam.dpr;
    var r = detailPanelRect(viewW, viewH);
    var x = r.x, y = r.y, w = r.w, h = r.h;

    /* drop shadow */
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x + 3, y + 3, w, h);
    /* XP window body */
    ctx.fillStyle = '#ece9d8';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);

    /* XP title bar */
    var g2 = ctx.createLinearGradient(0, y, 0, y + DETAIL_TB);
    g2.addColorStop(0, '#0997ff'); g2.addColorStop(0.5, '#0050ee'); g2.addColorStop(1, '#003dd7');
    ctx.fillStyle = g2;
    ctx.fillRect(x + 2, y + 2, w - 4, DETAIL_TB - 2);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('\ud83d\udd0d ' + stop.name + ' — dans le document', x + 8, y + DETAIL_TB / 2 + 1);
    /* fake XP window buttons */
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 10px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('_', x + w - 24, y + DETAIL_TB / 2 + 1);
    ctx.fillText('\u25a1', x + w - 15, y + DETAIL_TB / 2 + 1);
    ctx.textAlign = 'left';

    /* animation area, clipped */
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 5, y + DETAIL_TB + 3, w - 10, h - DETAIL_TB - 8);
    ctx.clip();
    ctx.translate(x + 5, y + DETAIL_TB + 3);
    var d = Park.details && Park.details[stop.id];
    var t = (clock % 6);
    if (d) {
      d(ctx, w - 10, h - DETAIL_TB - 8, t, s);
    } else {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(0, 0, w - 10, h - DETAIL_TB - 8);
      ctx.fillStyle = '#3a3a3a';
      ctx.font = 'bold 11px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Park.cargoLabels[s.cargo] || stop.name, (w - 10) / 2, (h - DETAIL_TB - 8) / 2);
      ctx.textAlign = 'left';
    }
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }

  /* ---- frame ------------------------------------------------------------- */

  function draw(canvas, cam, clock, activeId, hoverId) {
    var ctx = canvas.getContext('2d');
    var s = Tour.state;
    if (!props) props = buildProps();

    ctx.setTransform(cam.dpr, 0, 0, cam.dpr, 0, 0);
    ctx.fillStyle = '#3f6b2c';
    ctx.fillRect(0, 0, canvas.width / cam.dpr, canvas.height / cam.dpr);

    ctx.save();
    ctx.translate(cam.ox, cam.oy);
    ctx.scale(cam.scale, cam.scale);

    drawGround(ctx, cam);

    /* highlight the stop being explained, and anything the pointer is over */
    var act = Park.stopById[activeId];
    if (act) drawFocusRing(ctx, act, clock, 1);
    if (hoverId && hoverId !== activeId) {
      var hv = Park.stopById[hoverId];
      if (hv) drawFocusRing(ctx, hv, clock, 0.45);
    }

    /* --- build the depth sorted list --- */
    var items = [];

    for (var i = 0; i < Park.buildings.length; i++) {
      var b = Park.buildings[i];
      items.push({ k: (b.x + b.w) + (b.y + b.d), b: b, kind: 'building' });
    }
    for (var j = 0; j < props.length; j++) {
      var pr = props[j];
      items.push({ k: pr.x + pr.y + 0.4, p: pr, kind: 'prop' });
    }
    for (var g = 0; g < Park.guests.length; g++) {
      var G = Park.guests[g];
      var d = (G.offset + clock * G.speed) % G.route.total;
      var raw = G.route.at(d);
      /* walk the shoulder, not the middle of the road */
      var gp = { x: raw.x - raw.dy * G.side, y: raw.y + raw.dx * G.side };
      items.push({ k: gp.x + gp.y + 0.5, kind: 'guest', gp: gp, G: G, ph: clock * 5 + g });
    }
    var cp = Tour.cartPosition();
    items.push({ k: cp.x + cp.y + 0.6, kind: 'cart', cp: cp });

    items.sort(function (a, b2) { return a.k - b2.k; });

    for (var n = 0; n < items.length; n++) {
      var it = items[n];
      if (it.kind === 'building') it.b.draw(ctx, it.b, clock, s);
      else if (it.kind === 'prop') {
        if (it.p.kind === 'tree') Park.draw.tree(ctx, it.p.x, it.p.y, it.p.s);
        else if (it.p.kind === 'bush') Park.draw.bush(ctx, it.p.x, it.p.y);
        else if (it.p.kind === 'bench') Park.draw.bench(ctx, it.p.x, it.p.y);
        else Park.draw.lamp(ctx, it.p.x, it.p.y);
      } else if (it.kind === 'guest') {
        Park.draw.guest(ctx, it.gp.x, it.gp.y, 0, it.G.shirt, it.G.hat, it.ph);
      } else {
        drawCart(ctx, it.cp, s, clock);
      }
    }

    ctx.restore();

    /* text last, on top of everything, with the cart tag as the immovable
       reference so the two never overlap no matter where the cart goes */
    var tag = cartTagRect(ctx, cam, cp, s);

    /* the "inside the document" panel, if the cart is stopped at a stop:
       its rectangle is an extra obstacle for the stop signs, so no label
       is ever hidden underneath it */
    var viewW = canvas.width / cam.dpr, viewH = canvas.height / cam.dpr;
    var detailBox = null;
    var detailStop = Park.stopById[Tour.state.stage];
    if (detailStop && s.dwellLeft > 0) {
      var dr = detailPanelRect(viewW, viewH);
      detailBox = { x: dr.x - 4, y: dr.y - 4, w: dr.w + 8, h: dr.h + 8 };
    }

    if (showLabels) drawLabels(ctx, cam, activeId, tag, detailBox);
    drawCartTag(ctx, cam, cp, s, tag);
    drawDetailPanel(ctx, cam, clock, detailStop, s);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  global.Renderer = {
    draw: draw,
    setLabels: function (v) { showLabels = v; },
    labels: function () { return showLabels; }
  };
})(window);
