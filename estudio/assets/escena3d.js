/* ==========================================================================
   Escena3D · visor tridimensional ligero para los cuadernos de estudio
   Canvas 2D, sin dependencias. Proyección en perspectiva, orden de pintado
   por profundidad, sombreado plano y puntos calientes para explicar piezas.
   ========================================================================== */

(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------ geometría */

  function box(cx, cy, cz, w, h, d) {
    var x = w / 2, y = h / 2, z = d / 2;
    return {
      v: [
        [cx - x, cy - y, cz - z], [cx + x, cy - y, cz - z], [cx + x, cy - y, cz + z], [cx - x, cy - y, cz + z],
        [cx - x, cy + y, cz - z], [cx + x, cy + y, cz - z], [cx + x, cy + y, cz + z], [cx - x, cy + y, cz + z]
      ],
      f: [
        [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]
      ]
    };
  }

  function cylY(cx, cy, cz, r, h, seg) {
    seg = seg || 20;
    var v = [], f = [], i, a, j;
    for (i = 0; i < seg; i++) {
      a = TAU * i / seg;
      v.push([cx + r * Math.cos(a), cy - h / 2, cz + r * Math.sin(a)]);
      v.push([cx + r * Math.cos(a), cy + h / 2, cz + r * Math.sin(a)]);
    }
    for (i = 0; i < seg; i++) {
      j = (i + 1) % seg;
      f.push([i * 2, j * 2, j * 2 + 1, i * 2 + 1]);
    }
    var b = v.length; v.push([cx, cy - h / 2, cz]);
    var t = v.length; v.push([cx, cy + h / 2, cz]);
    for (i = 0; i < seg; i++) {
      j = (i + 1) % seg;
      f.push([b, j * 2, i * 2]);
      f.push([t, i * 2 + 1, j * 2 + 1]);
    }
    return { v: v, f: f };
  }

  function coneY(cx, cy, cz, r1, r2, h, seg) {
    seg = seg || 20;
    var v = [], f = [], i, a, j;
    for (i = 0; i < seg; i++) {
      a = TAU * i / seg;
      v.push([cx + r1 * Math.cos(a), cy - h / 2, cz + r1 * Math.sin(a)]);
      v.push([cx + r2 * Math.cos(a), cy + h / 2, cz + r2 * Math.sin(a)]);
    }
    for (i = 0; i < seg; i++) {
      j = (i + 1) % seg;
      f.push([i * 2, j * 2, j * 2 + 1, i * 2 + 1]);
    }
    if (r1 > 0) {
      var b = v.length; v.push([cx, cy - h / 2, cz]);
      for (i = 0; i < seg; i++) { j = (i + 1) % seg; f.push([b, j * 2, i * 2]); }
    }
    if (r2 > 0) {
      var t = v.length; v.push([cx, cy + h / 2, cz]);
      for (i = 0; i < seg; i++) { j = (i + 1) % seg; f.push([t, i * 2 + 1, j * 2 + 1]); }
    }
    return { v: v, f: f };
  }

  function sphere(cx, cy, cz, r, seg, rings) {
    seg = seg || 18; rings = rings || 10;
    var v = [], f = [], i, j, a, b;
    for (j = 0; j <= rings; j++) {
      b = Math.PI * j / rings;
      for (i = 0; i < seg; i++) {
        a = TAU * i / seg;
        v.push([cx + r * Math.sin(b) * Math.cos(a), cy + r * Math.cos(b), cz + r * Math.sin(b) * Math.sin(a)]);
      }
    }
    for (j = 0; j < rings; j++) {
      for (i = 0; i < seg; i++) {
        var i2 = (i + 1) % seg;
        f.push([j * seg + i, j * seg + i2, (j + 1) * seg + i2, (j + 1) * seg + i]);
      }
    }
    return { v: v, f: f };
  }

  function hemi(cx, cy, cz, r, seg, rings) {
    seg = seg || 18; rings = rings || 6;
    var v = [], f = [], i, j, a, b;
    for (j = 0; j <= rings; j++) {
      b = (Math.PI / 2) * j / rings;
      for (i = 0; i < seg; i++) {
        a = TAU * i / seg;
        v.push([cx + r * Math.sin(b) * Math.cos(a), cy + r * Math.cos(b), cz + r * Math.sin(b) * Math.sin(a)]);
      }
    }
    for (j = 0; j < rings; j++) {
      for (i = 0; i < seg; i++) {
        var i2 = (i + 1) % seg;
        f.push([j * seg + i, j * seg + i2, (j + 1) * seg + i2, (j + 1) * seg + i]);
      }
    }
    return { v: v, f: f };
  }

  function move(g, dx, dy, dz) {
    for (var i = 0; i < g.v.length; i++) {
      g.v[i][0] += dx; g.v[i][1] += dy; g.v[i][2] += dz;
    }
    return g;
  }

  function scaleGeo(g, sx, sy, sz) {
    for (var i = 0; i < g.v.length; i++) {
      g.v[i][0] *= sx; g.v[i][1] *= sy; g.v[i][2] *= sz;
    }
    return g;
  }

  function rotY(g, a) {
    var c = Math.cos(a), s = Math.sin(a);
    for (var i = 0; i < g.v.length; i++) {
      var x = g.v[i][0], z = g.v[i][2];
      g.v[i][0] = x * c + z * s;
      g.v[i][2] = -x * s + z * c;
    }
    return g;
  }

  function rotZ(g, a) {
    var c = Math.cos(a), s = Math.sin(a);
    for (var i = 0; i < g.v.length; i++) {
      var x = g.v[i][0], y = g.v[i][1];
      g.v[i][0] = x * c - y * s;
      g.v[i][1] = x * s + y * c;
    }
    return g;
  }

  function rotX(g, a) {
    var c = Math.cos(a), s = Math.sin(a);
    for (var i = 0; i < g.v.length; i++) {
      var y = g.v[i][1], z = g.v[i][2];
      g.v[i][1] = y * c - z * s;
      g.v[i][2] = y * s + z * c;
    }
    return g;
  }

  function merge(list) {
    var out = { v: [], f: [] };
    for (var k = 0; k < list.length; k++) {
      var off = out.v.length, g = list[k];
      for (var i = 0; i < g.v.length; i++) out.v.push([g.v[i][0], g.v[i][1], g.v[i][2]]);
      for (var j = 0; j < g.f.length; j++) {
        out.f.push(g.f[j].map(function (n) { return n + off; }));
      }
    }
    return out;
  }

  /* ---------------------------------------------------------------- color */

  var PALETTE = {
    paper: '#f1e8db',
    metal: '#c9c0b2',
    ink: '#4a4139',
    accent: '#8a6a3a',
    accent2: '#b07a4a',
    water: '#7fa9bd',
    waterDeep: '#4f7f97',
    soil: '#b28a63',
    green: '#7d9a6a',
    steel: '#9aa3a8',
    dark: '#2f2a25'
  };

  function toRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function shade(rgb, k) {
    return 'rgb(' + Math.min(255, Math.round(rgb[0] * k)) + ',' +
      Math.min(255, Math.round(rgb[1] * k)) + ',' +
      Math.min(255, Math.round(rgb[2] * k)) + ')';
  }

  function fmt(n, d) {
    if (!isFinite(n)) return '—';
    d = d === undefined ? 1 : d;
    return n.toFixed(d).replace('.', ',');
  }

  /* ---------------------------------------------------------------- escena */

  function create(mount, cfg) {
    if (!mount) return null;

    var parts = (cfg.parts || []).map(function (p, i) {
      return {
        id: p.id || 'p' + i,
        name: p.name || '',
        note: p.note || '',
        color: p.color || 'paper',
        opacity: p.opacity === undefined ? 1 : p.opacity,
        geo: p.geo,
        hotspot: p.hotspot || null,
        visible: p.visible !== false,
        hidden: !!p.hidden
      };
    });

    var state = {};
    (cfg.controls || []).forEach(function (c) { state[c.id] = c.value; });

    var view = cfg.view || {};
    var yaw = view.yaw === undefined ? -0.6 : view.yaw;
    var pitch = view.pitch === undefined ? 0.32 : view.pitch;
    var zoom = view.zoom === undefined ? 1 : view.zoom;
    var spin = false;
    var selected = -1;
    var dirty = true;
    var running = false;
    var visible = true;
    var last = 0;

    /* ---- DOM ---- */

    mount.classList.add('e3d');
    mount.innerHTML = '';

    var stage = document.createElement('div');
    stage.className = 'e3d__stage';
    stage.tabIndex = 0;
    stage.setAttribute('role', 'group');
    stage.setAttribute('aria-label', (cfg.label || 'Modelo tridimensional') + '. Arrastra para girar, usa las flechas del teclado.');

    var cv = document.createElement('canvas');
    cv.className = 'e3d__cv';
    cv.setAttribute('aria-hidden', 'true');
    stage.appendChild(cv);

    var hots = document.createElement('div');
    hots.className = 'e3d__hots';
    stage.appendChild(hots);

    var bar = document.createElement('div');
    bar.className = 'e3d__bar';

    if (cfg.views && cfg.views.length) {
      cfg.views.forEach(function (v) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'e3d__btn';
        b.textContent = v.label;
        b.addEventListener('click', function () {
          yaw = v.yaw; pitch = v.pitch; zoom = v.zoom === undefined ? zoom : v.zoom;
          dirty = true;
        });
        bar.appendChild(b);
      });
      var sep = document.createElement('span');
      sep.className = 'e3d__sep';
      bar.appendChild(sep);
    }

    var spinBtn = document.createElement('button');
    spinBtn.type = 'button';
    spinBtn.className = 'e3d__btn';
    spinBtn.textContent = 'Girar';
    spinBtn.setAttribute('aria-pressed', 'false');
    spinBtn.addEventListener('click', function () {
      spin = !spin;
      spinBtn.setAttribute('aria-pressed', spin ? 'true' : 'false');
      spinBtn.classList.toggle('is-on', spin);
      dirty = true;
    });
    bar.appendChild(spinBtn);

    var zo = document.createElement('button');
    zo.type = 'button'; zo.className = 'e3d__btn'; zo.textContent = '−';
    zo.setAttribute('aria-label', 'Alejar');
    zo.addEventListener('click', function () { zoom = clamp(zoom / 1.18, 0.55, 2.6); dirty = true; });
    bar.appendChild(zo);

    var zi = document.createElement('button');
    zi.type = 'button'; zi.className = 'e3d__btn'; zi.textContent = '+';
    zi.setAttribute('aria-label', 'Acercar');
    zi.addEventListener('click', function () { zoom = clamp(zoom * 1.18, 0.55, 2.6); dirty = true; });
    bar.appendChild(zi);

    var hint = document.createElement('span');
    hint.className = 'e3d__hint';
    hint.textContent = 'arrastra para girar';
    bar.appendChild(hint);

    stage.appendChild(bar);
    mount.appendChild(stage);

    /* ---- controles ---- */

    var controlsEl = null;
    if (cfg.controls && cfg.controls.length) {
      controlsEl = document.createElement('div');
      controlsEl.className = 'e3d__controls';
      cfg.controls.forEach(function (c) {
        if (c.type === 'choice') {
          var wrap = document.createElement('div');
          wrap.className = 'e3d__choice';
          var lab = document.createElement('span');
          lab.className = 'e3d__choice-label';
          lab.textContent = c.label;
          wrap.appendChild(lab);
          c.options.forEach(function (o, oi) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'e3d__chip' + (oi === 0 ? ' is-on' : '');
            b.textContent = o.label;
            b.addEventListener('click', function () {
              state[c.id] = o.value;
              Array.prototype.forEach.call(wrap.querySelectorAll('.e3d__chip'), function (x) { x.classList.remove('is-on'); });
              b.classList.add('is-on');
              update();
            });
            wrap.appendChild(b);
          });
          controlsEl.appendChild(wrap);
        } else {
          var field = document.createElement('label');
          field.className = 'e3d__field';
          var name = document.createElement('span');
          name.textContent = c.label;
          field.appendChild(name);
          var inp = document.createElement('input');
          inp.type = 'range';
          inp.min = c.min; inp.max = c.max; inp.step = c.step || 1;
          inp.value = c.value;
          inp.setAttribute('aria-label', c.label);
          field.appendChild(inp);
          var out = document.createElement('output');
          out.textContent = c.value + (c.unit ? ' ' + c.unit : '');
          field.appendChild(out);
          inp.addEventListener('input', function () {
            state[c.id] = parseFloat(inp.value);
            out.textContent = fmt(parseFloat(inp.value), c.digits === undefined ? 0 : c.digits) + (c.unit ? ' ' + c.unit : '');
            update();
          });
          controlsEl.appendChild(field);
        }
      });
      mount.appendChild(controlsEl);
    }

    /* ---- lecturas ---- */

    var outEl = document.createElement('div');
    outEl.className = 'e3d__out';
    mount.appendChild(outEl);

    /* ---- leyenda y ficha ---- */

    var legend = document.createElement('ol');
    legend.className = 'e3d__legend';
    parts.forEach(function (p, i) {
      if (!p.name) return;
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      var dot = document.createElement('span');
      dot.className = 'e3d__dot';
      dot.textContent = String(i + 1);
      b.appendChild(dot);
      var t = document.createElement('span');
      t.textContent = p.name;
      b.appendChild(t);
      b.addEventListener('click', function () { select(selected === i ? -1 : i); });
      li.appendChild(b);
      legend.appendChild(li);
    });
    mount.appendChild(legend);

    var panel = document.createElement('div');
    panel.className = 'e3d__panel';
    panel.setAttribute('aria-live', 'polite');
    mount.appendChild(panel);

    /* ---- estado de la interfaz ---- */

    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

    function select(i) {
      selected = i;
      Array.prototype.forEach.call(legend.querySelectorAll('button'), function (b, bi) {
        b.classList.toggle('is-on', bi === i);
      });
      Array.prototype.forEach.call(hots.querySelectorAll('button'), function (b, bi) {
        b.classList.toggle('is-on', bi === i);
      });
      if (i < 0) {
        panel.innerHTML = '';
        var ph = document.createElement('p');
        ph.className = 'e3d__panel-hint';
        ph.textContent = 'Toca un número sobre el modelo, o un nombre de la lista, para ver qué es cada pieza.';
        panel.appendChild(ph);
      } else {
        panel.innerHTML = '';
        var h = document.createElement('p');
        h.className = 'e3d__panel-name';
        h.textContent = (i + 1) + '. ' + parts[i].name;
        var n = document.createElement('p');
        n.className = 'e3d__panel-note';
        n.textContent = parts[i].note;
        panel.appendChild(h);
        panel.appendChild(n);
      }
      dirty = true;
    }

    /* ---- marcadores ---- */

    var markers = parts.map(function (p, i) {
      if (!p.hotspot) return null;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'e3d__hot';
      b.textContent = i + 1;
      b.setAttribute('aria-label', p.name);
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        select(selected === i ? -1 : i);
      });
      hots.appendChild(b);
      return b;
    });

    /* ---- cámara y dibujo ---- */

    var ctx = cv.getContext('2d');
    var dpr = 1;

    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = w + 'px';
      cv.style.height = h + 'px';
      dirty = true;
    }

    var bounds = { c: [0, 0, 0], r: 1 };

    function measure() {
      var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
      parts.forEach(function (p) {
        p.geo.v.forEach(function (v) {
          for (var k = 0; k < 3; k++) {
            if (v[k] < mn[k]) mn[k] = v[k];
            if (v[k] > mx[k]) mx[k] = v[k];
          }
        });
      });
      bounds.c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
      bounds.h = [(mx[0] - mn[0]) / 2, (mx[1] - mn[1]) / 2, (mx[2] - mn[2]) / 2];
      var r = 0;
      parts.forEach(function (p) {
        p.geo.v.forEach(function (v) {
          var dx = v[0] - bounds.c[0], dy = v[1] - bounds.c[1], dz = v[2] - bounds.c[2];
          var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d > r) r = d;
        });
      });
      bounds.r = r || 1;
      fit = null;
    }

    /* encuadre: extensión proyectada de la caja envolvente sobre todas las
       orientaciones de giro, a la inclinación actual. Así el zoom no cambia al
       girar. La división en perspectiva se aplica aquí para que el tamaño sea
       el real y no el de la caja sin proyectar. */
    var fit = null;
    var PERSP = 4.1;

    function boxCorners(hx, hy, hz, ca, sa, cp, sp, dist, fn) {
      for (var ci = 0; ci < 8; ci++) {
        var x = (ci & 1) ? hx : -hx;
        var y = (ci & 2) ? hy : -hy;
        var z = (ci & 4) ? hz : -hz;
        var xr = x * ca + z * sa;
        var zr = -x * sa + z * ca;
        var yr = y * cp - zr * sp;
        var z2 = -(y * sp + zr * cp);
        var k = dist / (dist + z2);
        fn(xr * k, yr * k);
      }
    }

    function computeFit(p) {
      var cp = Math.cos(p), sp = Math.sin(p);
      var dist = bounds.r * PERSP;
      var hx = bounds.h[0], hy = bounds.h[1], hz = bounds.h[2];
      var x0 = 1e9, x1m = -1e9, y0 = 1e9, y1m = -1e9;
      for (var ai = 0; ai < 16; ai++) {
        var a = TAU * ai / 16;
        boxCorners(hx, hy, hz, Math.cos(a), Math.sin(a), cp, sp, dist, function (px, py) {
          if (px < x0) x0 = px;
          if (px > x1m) x1m = px;
          if (py < y0) y0 = py;
          if (py > y1m) y1m = py;
        });
      }
      return {
        pitch: p,
        x: Math.max((x1m - x0) / 2, 0.0001),
        y: Math.max((y1m - y0) / 2, 0.0001),
      };
    }

    var LIGHT = (function () {
      var l = [-0.42, 0.78, -0.46];
      var m = Math.sqrt(l[0] * l[0] + l[1] * l[1] + l[2] * l[2]);
      return [l[0] / m, l[1] / m, l[2] / m];
    })();

    function render() {
      var W = stage.clientWidth, H = stage.clientHeight;
      if (!W || !H) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      var cyw = Math.cos(yaw), syw = Math.sin(yaw);
      var cp = Math.cos(pitch), sp = Math.sin(pitch);
      var dist = bounds.r * PERSP;
      /* la barra de controles flota sobre el lienzo: se le reserva su franja */
      var barH = bar ? bar.offsetHeight + 12 : 0;
      var Hd = Math.max(H - barH, H * 0.55);

      var proj = [];
      /* envolvente real de los vértices proyectados, en unidades de focal */
      var ex0 = 1e9, ex1 = -1e9, ey0 = 1e9, ey1 = -1e9;

      parts.forEach(function (p) {
        if (p.hidden) { proj.push(null); return; }
        var visible = p.opacity !== 0;
        proj.push(p.geo.v.map(function (v) {
          var x = v[0] - bounds.c[0], y = v[1] - bounds.c[1], z = v[2] - bounds.c[2];
          var x1 = x * cyw + z * syw;
          var z1 = -x * syw + z * cyw;
          var y2 = y * cp - z1 * sp;
          var z2 = -(y * sp + z1 * cp);
          if (visible) {
            var kk = 1 / (dist + z2);
            var px = x1 * kk, py = y2 * kk;
            if (px < ex0) ex0 = px;
            if (px > ex1) ex1 = px;
            if (py < ey0) ey0 = py;
            if (py > ey1) ey1 = py;
          }
          return [x1, y2, z2];
        }));
      });

      /* encuadre estable: no depende del giro, solo de la inclinación */
      if (!fit || Math.abs(pitch - fit.pitch) > 0.02) fit = computeFit(pitch);
      var focal = Math.min((W * 0.48) / fit.x, (Hd * 0.47) / fit.y) * dist * zoom;
      var ox = W / 2, oy = Hd * 0.5;
      if (ex1 > ex0) {
        ox -= ((ex1 + ex0) / 2) * focal;
        oy += ((ey1 + ey0) / 2) * focal;
      }

      var faces = [];

      parts.forEach(function (p, pi) {
        var t = proj[pi];
        if (!t) return;
        var base = toRgb(PALETTE[p.color] || p.color);
        p.geo.f.forEach(function (fc) {
          var pts = [], zsum = 0;
          for (var i = 0; i < fc.length; i++) {
            var q = t[fc[i]];
            var s = focal / (dist + q[2]);
            pts.push([ox + q[0] * s, oy - q[1] * s]);
            zsum += q[2];
          }
          var a = t[fc[0]], b = t[fc[1]], c = t[fc[2]];
          var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
          var vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
          var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          var lam = Math.abs((nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / nl);
          lam = 0.52 + 0.48 * lam;
          faces.push({
            pts: pts,
            z: zsum / fc.length,
            fill: shade(base, lam),
            line: shade(base, lam * 0.82),
            part: pi,
            op: p.opacity
          });
        });
      });

      faces.sort(function (a, b) { return b.z - a.z; });

      faces.forEach(function (f) {
        ctx.beginPath();
        ctx.moveTo(f.pts[0][0], f.pts[0][1]);
        for (var i = 1; i < f.pts.length; i++) ctx.lineTo(f.pts[i][0], f.pts[i][1]);
        ctx.closePath();
        ctx.globalAlpha = f.op;
        ctx.fillStyle = f.fill;
        ctx.fill();
        ctx.globalAlpha = f.op * 0.5;
        ctx.strokeStyle = f.line;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      if (selected >= 0 && proj[selected]) {
        var sp2 = parts[selected];
        ctx.globalAlpha = 1;
        sp2.geo.f.forEach(function (fc) {
          ctx.beginPath();
          for (var i = 0; i < fc.length; i++) {
            var q = proj[selected][fc[i]];
            var s = focal / (dist + q[2]);
            var px = ox + q[0] * s, py = oy - q[1] * s;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.strokeStyle = 'rgba(140, 74, 40, 0.85)';
          ctx.lineWidth = 1.1;
          ctx.stroke();
        });
      }

      /* marcadores */
      parts.forEach(function (p, i) {
        var el = markers[i];
        if (!el) return;
        if (p.hidden || !proj[i]) { el.style.display = 'none'; return; }
        var h = p.hotspot;
        var x = h[0] - bounds.c[0], y = h[1] - bounds.c[1], z = h[2] - bounds.c[2];
        var x1 = x * cyw + z * syw;
        var z1 = -x * syw + z * cyw;
        var y2 = y * cp - z1 * sp;
        var z2 = -(y * sp + z1 * cp);
        var s = focal / (dist + z2);
        el.style.display = 'block';
        el.style.transform = 'translate(' + (ox + x1 * s) + 'px,' + (oy - y2 * s) + 'px)';
      });
    }

    function readout() {
      if (!cfg.readout) return;
      var rows = cfg.readout(state) || [];
      outEl.innerHTML = '';
      rows.forEach(function (r) {
        var d = document.createElement('div');
        d.className = 'e3d__row' + (r.tone ? ' is-' + r.tone : '');
        var l = document.createElement('span');
        l.textContent = r.label;
        var v = document.createElement('b');
        v.textContent = r.value;
        d.appendChild(l);
        d.appendChild(v);
        if (r.unit) {
          var u = document.createElement('i');
          u.textContent = r.unit;
          d.appendChild(u);
        }
        outEl.appendChild(d);
      });
    }

    function update() {
      if (cfg.onState) cfg.onState(state, api);
      measure();
      readout();
      dirty = true;
    }

    /* ---- interacción ---- */

    var drag = null;
    var pointers = {};

    stage.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      stage.setPointerCapture(e.pointerId);
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (Object.keys(pointers).length === 1) {
        drag = { x: e.clientX, y: e.clientY };
        stage.classList.add('is-drag');
      }
    });

    stage.addEventListener('pointermove', function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length >= 2) {
        var a = pointers[ids[0]], b = pointers[ids[1]];
        var d = Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
        if (stage._pinch) zoom = clamp(zoom * (d / stage._pinch), 0.55, 2.6);
        stage._pinch = d;
        dirty = true;
        return;
      }
      if (!drag) return;
      yaw += (e.clientX - drag.x) * 0.008;
      pitch = clamp(pitch + (e.clientY - drag.y) * 0.006, -1.15, 1.15);
      drag = { x: e.clientX, y: e.clientY };
      dirty = true;
    });

    function endPointer(e) {
      delete pointers[e.pointerId];
      if (Object.keys(pointers).length < 2) stage._pinch = 0;
      if (!Object.keys(pointers).length) { drag = null; stage.classList.remove('is-drag'); }
    }
    stage.addEventListener('pointerup', endPointer);
    stage.addEventListener('pointercancel', endPointer);

    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoom = clamp(zoom * Math.exp(-e.deltaY * 0.0014), 0.55, 2.6);
      dirty = true;
    }, { passive: false });

    stage.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowLeft') { yaw -= 0.12; dirty = true; e.preventDefault(); }
      else if (k === 'ArrowRight') { yaw += 0.12; dirty = true; e.preventDefault(); }
      else if (k === 'ArrowUp') { pitch = clamp(pitch - 0.08, -1.15, 1.15); dirty = true; e.preventDefault(); }
      else if (k === 'ArrowDown') { pitch = clamp(pitch + 0.08, -1.15, 1.15); dirty = true; e.preventDefault(); }
      else if (k === '+' || k === '=') { zoom = clamp(zoom * 1.12, 0.55, 2.6); dirty = true; e.preventDefault(); }
      else if (k === '-') { zoom = clamp(zoom / 1.12, 0.55, 2.6); dirty = true; e.preventDefault(); }
      else if (k === '0') { yaw = view.yaw === undefined ? -0.6 : view.yaw; pitch = view.pitch === undefined ? 0.32 : view.pitch; zoom = 1; dirty = true; }
    });

    /* ---- bucle ---- */

    function frame(t) {
      if (!running) return;
      var dt = last ? Math.min((t - last) / 1000, 0.06) : 0.016;
      last = t;
      if (visible) {
        if (spin && !reduced) { yaw += dt * 0.42; dirty = true; }
        if (cfg.tick && cfg.tick(dt, api, state)) dirty = true;
        if (dirty) { render(); dirty = false; }
      }
      requestAnimationFrame(frame);
    }

    var api = {
      state: state,
      select: select,
      touch: function () { dirty = true; },
      refresh: function () { measure(); readout(); dirty = true; },
      setGeo: function (id, g) {
        for (var i = 0; i < parts.length; i++) if (parts[i].id === id) { parts[i].geo = g; break; }
        measure();
        dirty = true;
      },
      show: function (id, on) {
        for (var i = 0; i < parts.length; i++) if (parts[i].id === id) parts[i].hidden = !on;
        dirty = true;
      },
      get: function (id) {
        for (var i = 0; i < parts.length; i++) if (parts[i].id === id) return parts[i];
        return null;
      }
    };

    if (window.ResizeObserver) {
      new ResizeObserver(function () { resize(); }).observe(stage);
    } else {
      window.addEventListener('resize', resize);
    }

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { rootMargin: '120px' }).observe(mount);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; }
      else if (!running) { running = true; last = 0; requestAnimationFrame(frame); }
    });

    resize();
    measure();
    select(-1);
    update();
    running = true;
    requestAnimationFrame(frame);

    return api;
  }

  window.Escena3D = {
    create: create,
    box: box,
    cyl: function (cx, cy, cz, r, h, seg, axis) {
      var g = cylY(0, 0, 0, r, h, seg);
      if (axis === 'x') rotZ(g, Math.PI / 2);
      else if (axis === 'z') rotX(g, Math.PI / 2);
      return move(g, cx, cy, cz);
    },
    cone: coneY,
    coneX: function (cx, cy, cz, r1, r2, h, seg) {
      var g = coneY(0, 0, 0, r1, r2, h, seg);
      rotZ(g, -Math.PI / 2);
      return move(g, cx, cy, cz);
    },
    coneZ: function (cx, cy, cz, r1, r2, h, seg) {
      var g = coneY(0, 0, 0, r1, r2, h, seg);
      rotX(g, Math.PI / 2);
      return move(g, cx, cy, cz);
    },
    beam: function (x1, y1, x2, y2, z, t, d) {
      var dx = x2 - x1, dy = y2 - y1;
      var g = box(0, 0, 0, Math.sqrt(dx * dx + dy * dy), t, d);
      rotZ(g, Math.atan2(dy, dx));
      return move(g, (x1 + x2) / 2, (y1 + y2) / 2, z);
    },
    sphere: sphere,
    hemi: hemi,
    move: move,
    scale: scaleGeo,
    rotY: rotY,
    rotZ: rotZ,
    rotX: rotX,
    merge: merge,
    fmt: fmt
  };
})();
