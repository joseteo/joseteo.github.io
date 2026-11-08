/* Fertirriego — page tools */
(function () {
  'use strict';

  var IONS = {
    N: { pm: 14.0, z: 1 },
    P: { pm: 31.0, z: 1 },
    K: { pm: 39.1, z: 1 },
    Ca: { pm: 40.1, z: 2 },
    Mg: { pm: 24.3, z: 2 },
    Na: { pm: 23.0, z: 1 },
    Cl: { pm: 35.5, z: 1 },
    S: { pm: 32.1, z: 2 },
    Fe: { pm: 55.8, z: 3 },
  };

  /* ---------------------------------------------------------- volumen de riego */

  Estudio.calculator('fert-volume', function (v) {
    var etc = v.kc * v.eto;
    var denom = v.ea * (1 - v.lf);
    if (![v.eto, v.kc, v.ea, v.lf, v.n, v.area].every(Number.isFinite)) {
      return [{ label: 'Faltan datos', text: 'Completa todos los campos para calcular.', tone: 'warn', wide: true }];
    }
    if (denom <= 0) {
      return [{ label: 'Datos imposibles', text: 'La eficiencia o el lavado dejan el volumen sin definir.', tone: 'bad', wide: true }];
    }
    var bruto = etc / denom;
    var m3ha = bruto * 10;
    var total = m3ha * v.area;
    var kgN = (v.n * m3ha) / 1000;

    var tone = 'ok';
    var text = 'Programa coherente';
    if (v.lf > 0.3) {
      tone = 'warn';
      text = 'Lavado alto: revisa la calidad del agua';
    } else if (v.ea < 0.8) {
      tone = 'warn';
      text = 'Eficiencia baja: el sistema pierde agua';
    } else if (bruto > 12) {
      tone = 'warn';
      text = 'Volumen diario muy alto para goteo';
    }

    return [
      { label: 'ETc', value: etc, unit: 'mm/d', digits: 2 },
      { label: 'Volumen bruto', value: bruto, unit: 'mm/d', digits: 2 },
      { label: 'Por hectárea', value: m3ha, unit: 'm³/ha/d', digits: 1 },
      { label: 'Superficie total', value: total, unit: 'm³/d', digits: 1 },
      { label: 'Nitrógeno', value: kgN, unit: 'kg N/ha/d', digits: 2 },
      { label: 'Diagnóstico', text: text, tone: tone, wide: true },
    ];
  });

  /* ---------------------------------------------------------- inyección */

  Estudio.calculator('fert-injection', function (v) {
    if (![v.q, v.r, v.vol, v.target].every(Number.isFinite)) {
      return [{ label: 'Faltan datos', text: 'Completa todos los campos para calcular.', tone: 'warn', wide: true }];
    }
    if (v.r < 1) {
      return [{ label: 'Factor no válido', text: 'La solución madre debe estar concentrada al menos 2 veces.', tone: 'bad', wide: true }];
    }
    var qIny = (v.q * 1000) / v.r;
    var hours = qIny > 0 ? v.vol / qIny : 0;
    var stockPpm = v.target * v.r;

    var tone = 'ok';
    var text = 'Cabe en un turno de riego';
    if (hours > 8) {
      tone = 'warn';
      text = 'No cabe en un turno: reparte o reduce depósito';
    } else if (qIny < 20) {
      tone = 'warn';
      text = 'Caudal muy bajo: el inyector puede perder precisión';
    } else if (hours < 0.5) {
      tone = 'warn';
      text = 'Inyección muy rápida: riesgo de choque salino';
    }

    return [
      { label: 'Caudal de inyección', value: qIny, unit: 'L/h', digits: 1 },
      { label: 'En m³/h', value: qIny / 1000, unit: 'm³/h', digits: 3 },
      { label: 'Duración', value: hours, unit: 'h', digits: 2 },
      { label: 'Madre necesaria', value: stockPpm, unit: 'ppm', digits: 0 },
      { label: 'Equivale a', value: stockPpm / 1000, unit: 'g/L', digits: 1 },
      { label: 'Diagnóstico', text: text, tone: tone, wide: true },
    ];
  });

  /* ---------------------------------------------------------- unidades */

  Estudio.calculator('fert-units', function (v) {
    if (!Number.isFinite(v.ppm)) {
      return [{ label: 'Faltan datos', text: 'Escribe una concentración en ppm.', tone: 'warn', wide: true }];
    }
    var ion = IONS[v.ion] || IONS.N;
    var mmol = v.ppm / ion.pm;
    var meq = mmol * ion.z;

    return [
      { label: 'mmol/L', value: mmol, unit: 'mmol/L', digits: 2 },
      { label: 'meq/L', value: meq, unit: 'meq/L', digits: 2 },
      { label: 'Gramos', value: v.ppm / 1000, unit: 'g/L', digits: 3 },
      { label: 'Valencia', value: ion.z, unit: 'z', digits: 0 },
    ];
  });

  /* ---------------------------------------------------------- curva de dilución */

  Estudio.figure('fert-dilution', function (root, v) {
    var curve = root.querySelector('[data-fig="curve"]');
    var marker = root.querySelector('[data-fig="marker"]');
    var drop = root.querySelector('[data-fig="drop"]');
    var markerLabel = root.querySelector('[data-fig="marker-label"]');
    var targetLine = root.querySelector('[data-fig="target-line"]');
    var targetLabel = root.querySelector('[data-fig="target-label"]');

    var x0 = 62;
    var x1 = 524;
    var y0 = 212;
    var y1 = 30;
    var maxY = 600;
    var maxR = 200;

    function px(r) {
      return x0 + (r / maxR) * (x1 - x0);
    }

    function py(c) {
      return y0 - (Math.min(c, maxY) / maxY) * (y0 - y1);
    }

    var target = Math.max(1, v.target);
    var stock = Math.max(1, v.stock);

    targetLine.setAttribute('y1', py(target));
    targetLine.setAttribute('y2', py(target));
    targetLabel.setAttribute('y', py(target) - 6);
    targetLabel.textContent = 'objetivo ' + Math.round(target) + ' ppm';

    var start = Math.max(0, stock / maxY - 1);
    var d = '';
    var first = true;
    for (var r = start; r <= maxR; r += 2) {
      var c = stock / (r + 1);
      if (c > maxY + 1) continue;
      var x = px(r).toFixed(1);
      var y = py(c).toFixed(1);
      d += (first ? 'M' : 'L') + x + ' ' + y;
      first = false;
    }
    curve.setAttribute('d', d);

    var rStar = stock / target - 1;
    if (rStar >= 0 && rStar <= maxR) {
      var mx = px(rStar);
      var my = py(target);
      marker.setAttribute('cx', mx.toFixed(1));
      marker.setAttribute('cy', my.toFixed(1));
      marker.removeAttribute('opacity');
      drop.setAttribute('x1', mx.toFixed(1));
      drop.setAttribute('x2', mx.toFixed(1));
      drop.setAttribute('y1', my.toFixed(1));
      drop.setAttribute('y2', y0);
      drop.removeAttribute('opacity');
      markerLabel.setAttribute('x', mx.toFixed(1));
      markerLabel.setAttribute('y', my - 10);
      markerLabel.textContent = '1 : ' + Math.round(rStar);
    } else {
      marker.setAttribute('opacity', '0');
      drop.setAttribute('opacity', '0');
      markerLabel.setAttribute('x', x1 - 4);
      markerLabel.setAttribute('y', y0 - 8);
      markerLabel.setAttribute('text-anchor', 'end');
      markerLabel.textContent = '1 : ' + Math.round(rStar) + ' fuera de escala';
    }
  });
})();
