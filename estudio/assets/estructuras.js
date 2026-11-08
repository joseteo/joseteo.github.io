/* Resistencia de materiales y estructuras agrícolas — page tools */
(function () {
  'use strict';

  var PI2 = Math.PI * Math.PI;
  var SIGMA_ADM = 183; /* S275 con coeficiente 1,5, MPa */

  /* ---------------------------------------------------------- viga biapoyada */

  Estudio.calculator('est-viga', function (v) {
    if (![v.l, v.p, v.a, v.b, v.h, v.e].every(Number.isFinite)) {
      return [{ label: 'Faltan datos', text: 'Completa todos los campos para calcular.', tone: 'warn', wide: true }];
    }
    if (v.l <= 0 || v.b <= 0 || v.h <= 0 || v.e <= 0) {
      return [{ label: 'Datos imposibles', text: 'La luz, la sección y el módulo deben ser mayores que cero.', tone: 'bad', wide: true }];
    }
    if (v.a < 0 || v.a > v.l) {
      return [{ label: 'Revisa la posición', text: 'La carga tiene que estar entre los dos apoyos.', tone: 'bad', wide: true }];
    }

    var b = v.l - v.a;
    var inertia = (v.b * Math.pow(v.h, 3)) / 12; /* cm⁴ */
    var wModule = (v.b * Math.pow(v.h, 2)) / 6; /* cm³ */
    var moment = (v.p * v.a * b) / v.l; /* kN·m */
    var sigma = (moment * 1000) / wModule; /* MPa */

    var eKnm2 = v.e * 1e6;
    var iM4 = inertia * 1e-8;
    var delta = (v.p * v.a * v.a * b * b) / (3 * eKnm2 * iM4 * v.l); /* m */
    var deltaMm = delta * 1000;
    var ratio = delta > 0 ? v.l / delta : Infinity;

    var ra = (v.p * b) / v.l;
    var rb = (v.p * v.a) / v.l;

    var flechaTone = delta <= v.l / 300 ? 'ok' : 'bad';
    var flechaText =
      delta <= v.l / 300
        ? 'Flecha admisible para L/300'
        : 'Flecha excesiva: supera L/300';

    var sigmaTone = sigma <= SIGMA_ADM ? 'ok' : 'bad';
    var sigmaText =
      sigma <= SIGMA_ADM
        ? 'Tensión admisible para S275 con CS 1,5'
        : 'Supera los 183 MPa del S275 con CS 1,5';

    return [
      { label: 'Reacción en A', value: ra, unit: 'kN', digits: 1 },
      { label: 'Reacción en B', value: rb, unit: 'kN', digits: 1 },
      { label: 'Momento máximo', value: moment, unit: 'kN·m', digits: 2 },
      { label: 'Tensión de flexión', value: sigma, unit: 'MPa', digits: 1 },
      { label: 'Flecha bajo la carga', value: deltaMm, unit: 'mm', digits: 2 },
      { label: 'Relación L/δ', value: ratio, unit: '', digits: 0 },
      { label: 'Servicio', text: flechaText, tone: flechaTone, wide: true },
      { label: 'Resistencia', text: sigmaText, tone: sigmaTone, wide: true },
    ];
  });

  /* ---------------------------------------------------------- pandeo */

  Estudio.calculator('est-pandeo', function (v) {
    var beta = parseFloat(v.beta);
    if (![v.l, v.e, v.i, v.area, beta].every(Number.isFinite)) {
      return [{ label: 'Faltan datos', text: 'Completa todos los campos para calcular.', tone: 'warn', wide: true }];
    }
    if (v.l <= 0 || v.i <= 0 || v.area <= 0 || beta <= 0) {
      return [{ label: 'Datos imposibles', text: 'Longitud, inercia y área deben ser mayores que cero.', tone: 'bad', wide: true }];
    }

    var lkMm = beta * v.l * 1000;
    var eMpa = v.e * 1000;
    var iMm4 = v.i * 1e4;
    var pcrN = (PI2 * eMpa * iMm4) / (lkMm * lkMm);
    var pcrKn = pcrN / 1000;

    var iCm = Math.sqrt(v.i / v.area);
    var lambda = (beta * v.l * 100) / iCm;
    var sigmaCr = pcrN / (v.area * 100);
    var plastica = v.area * 27.5; /* A · 275 MPa en kN */

    var tone = 'ok';
    var text = 'Pandeo elástico: manda Euler';
    if (lambda < 60) {
      tone = 'warn';
      text = 'Pilar poco esbelto: plastifica antes de pandear';
    } else if (lambda < 100) {
      tone = 'warn';
      text = 'Esbeltez intermedia: usa una curva de pandeo';
    } else if (pcrKn > plastica) {
      tone = 'warn';
      text = 'La carga de Euler supera la plastificación: no gobierna el pandeo';
    }

    return [
      { label: 'Longitud de pandeo', value: beta * v.l, unit: 'm', digits: 2 },
      { label: 'Carga crítica', value: pcrKn, unit: 'kN', digits: 1 },
      { label: 'Esbeltez λ', value: lambda, unit: '', digits: 0 },
      { label: 'Tensión crítica', value: sigmaCr, unit: 'MPa', digits: 1 },
      { label: 'Axil de plastificación', value: plastica, unit: 'kN', digits: 1 },
      { label: 'Diagnóstico', text: text, tone: tone, wide: true },
    ];
  });

  /* ---------------------------------------------------------- sección */

  Estudio.calculator('est-seccion', function (v) {
    if (![v.b, v.h].every(Number.isFinite)) {
      return [{ label: 'Faltan datos', text: 'Escribe el ancho y el canto.', tone: 'warn', wide: true }];
    }
    if (v.b <= 0 || v.h <= 0) {
      return [{ label: 'Datos imposibles', text: 'Las dimensiones deben ser mayores que cero.', tone: 'bad', wide: true }];
    }

    var area = v.b * v.h;
    var inertia = (v.b * Math.pow(v.h, 3)) / 12;
    var wModule = (v.b * Math.pow(v.h, 2)) / 6;
    var iRadio = Math.sqrt(inertia / area);

    return [
      { label: 'Área', value: area, unit: 'cm²', digits: 1 },
      { label: 'Inercia I', value: inertia, unit: 'cm⁴', digits: 0 },
      { label: 'Módulo W', value: wModule, unit: 'cm³', digits: 1 },
      { label: 'Radio de giro i', value: iRadio, unit: 'cm', digits: 2 },
    ];
  });

  /* ---------------------------------------------------------- zapata */

  Estudio.calculator('est-zapata', function (v) {
    if (![v.n, v.m, v.b, v.l, v.sadm].every(Number.isFinite)) {
      return [{ label: 'Faltan datos', text: 'Completa todos los campos para calcular.', tone: 'warn', wide: true }];
    }
    if (v.b <= 0 || v.l <= 0 || v.n <= 0) {
      return [{ label: 'Datos imposibles', text: 'La zapata y el axil deben ser mayores que cero.', tone: 'bad', wide: true }];
    }

    var area = v.b * v.l;
    var wModule = (v.b * v.l * v.l) / 6;
    var media = v.n / area;
    var smax = media + v.m / wModule;
    var smin = media - v.m / wModule;
    var ecc = v.m / v.n;

    var tone = 'ok';
    var text = 'El terreno aguanta y la zapata apoya completa';
    if (smin < 0) {
      tone = 'bad';
      text = 'La resultante sale del tercio central: la zapata despega';
    } else if (smax > v.sadm) {
      tone = 'warn';
      text = 'Supera la tensión admisible del terreno';
    }

    return [
      { label: 'Superficie', value: area, unit: 'm²', digits: 2 },
      { label: 'Tensión máxima', value: smax, unit: 'kN/m²', digits: 1 },
      { label: 'Tensión mínima', value: smin, unit: 'kN/m²', digits: 1 },
      { label: 'Tensión media', value: media, unit: 'kN/m²', digits: 1 },
      { label: 'Excentricidad', value: ecc, unit: 'm', digits: 3 },
      { label: 'Diagnóstico', text: text, tone: tone, wide: true },
    ];
  });

  /* ---------------------------------------------------------- viga en vivo */

  Estudio.figure('est-viga-fig', function (root, v) {
    var loadGroup = root.querySelector('[data-fig="load-group"]');
    var loadLabel = root.querySelector('[data-fig="load-label"]');
    var raText = root.querySelector('[data-fig="ra"]');
    var rbText = root.querySelector('[data-fig="rb"]');
    var defl = root.querySelector('[data-fig="defl"]');
    var marea = root.querySelector('[data-fig="marea"]');
    var mline = root.querySelector('[data-fig="mline"]');
    var mlabel = root.querySelector('[data-fig="mlabel"]');
    var read = root.querySelector('[data-fig="read"]');

    var x0 = 70;
    var x1 = 500;
    var yBeam = 70;
    var yAxis = 210;
    var peakMax = 64;

    var l = Math.max(0.5, v.l);
    var p = Math.max(0, v.p);
    var aPct = Math.min(95, Math.max(5, v.a));
    var ei = Math.max(1, v.ei);

    var a = (l * aPct) / 100;
    var b = l - a;
    var mmax = (p * a * b) / l;
    var ra = (p * b) / l;
    var rb = (p * a) / l;

    function px(x) {
      return x0 + (x / l) * (x1 - x0);
    }

    loadGroup.setAttribute('transform', 'translate(' + px(a).toFixed(1) + ',0)');
    loadLabel.textContent = 'P ' + Estudio.fmt(p, 0) + ' kN';

    raText.textContent = 'RA ' + Estudio.fmt(ra, 1);
    rbText.textContent = 'RB ' + Estudio.fmt(rb, 1);

    /* momento: dos tramos rectos con el vértice bajo la carga */
    if (mmax > 0) {
      var peakY = yAxis + peakMax;
      var mx = px(a).toFixed(1);
      var tri = 'M' + x0 + ' ' + yAxis + 'L' + mx + ' ' + peakY + 'L' + x1 + ' ' + yAxis;
      mline.setAttribute('d', tri);
      marea.setAttribute('d', tri + 'Z');
      mlabel.setAttribute('x', mx);
      mlabel.setAttribute('y', (peakY + 18).toFixed(1));
      mlabel.setAttribute('text-anchor', 'middle');
      mlabel.textContent = Estudio.fmt(mmax, 1) + ' kN·m';
    } else {
      mline.setAttribute('d', 'M' + x0 + ' ' + yAxis + 'L' + x1 + ' ' + yAxis);
      marea.setAttribute('d', '');
      mlabel.textContent = '';
    }

    /* deformada amplificada */
    function deflection(x) {
      if (x <= a) {
        return (p * b * x * (l * l - b * b - x * x)) / (6 * l * ei);
      }
      var r = l - x;
      return (p * a * r * (l * l - a * a - r * r)) / (6 * l * ei);
    }

    var vmax = 0;
    var samples = [];
    for (var i = 0; i <= 40; i++) {
      var x = (i / 40) * l;
      var val = deflection(x);
      samples.push({ x: x, v: val });
      if (val > vmax) vmax = val;
    }

    var d = '';
    samples.forEach(function (s, index) {
      var y = yBeam + (vmax > 0 ? (s.v / vmax) * 22 : 0);
      d += (index === 0 ? 'M' : 'L') + px(s.x).toFixed(1) + ' ' + y.toFixed(1);
    });
    defl.setAttribute('d', d);

    if (read) {
      var mm = vmax * 1000;
      var ratio = vmax > 0 ? l / vmax : Infinity;
      read.textContent = '';
      var strong = document.createElement('b');
      strong.textContent =
        'Máximo ' + Estudio.fmt(mmax, 1) + ' kN·m bajo la carga.';
      read.appendChild(strong);
      read.appendChild(
        document.createTextNode(
          ' Reacciones de ' +
            Estudio.fmt(ra, 1) +
            ' y ' +
            Estudio.fmt(rb, 1) +
            ' kN. Flecha de ' +
            Estudio.fmt(mm, 1) +
            ' mm, es decir L/' +
            Estudio.fmt(ratio, 0) +
            (ratio >= 300 ? ': cumple el límite L/300.' : ': no cumple el límite L/300.')
        )
      );
    }
  });
})();
