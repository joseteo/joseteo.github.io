/* Ciencia y tecnología del medio ambiente — page tools */
(function () {
  'use strict';

  var CS = 9.1; /* oxígeno de saturación a 20 °C, mg/L */

  /* ---------------------------------------------------------- carga y h-e */

  Estudio.calculator('ma-carga', function (v) {
    if (![v.q, v.dbo, v.ss, v.pob].every(Number.isFinite)) {
      return [{ label: 'Faltan datos', text: 'Completa todos los campos para calcular.', tone: 'warn', wide: true }];
    }
    if (v.q <= 0 || v.dbo < 0) {
      return [{ label: 'Datos imposibles', text: 'El caudal debe ser mayor que cero.', tone: 'bad', wide: true }];
    }

    var cargaDbo = (v.q * v.dbo) / 1000;
    var cargaSS = (v.q * v.ss) / 1000;
    var he = cargaDbo / 0.06;
    var perCapita = v.pob > 0 ? he / v.pob : NaN;

    var tone = 'ok';
    var text = 'Carga compatible con la población servida';
    if (v.pob > 0 && perCapita > 1.3) {
      tone = 'warn';
      text = 'Carga muy superior a la población: hay industria o ganadería';
    } else if (v.pob > 0 && perCapita < 0.7) {
      tone = 'warn';
      text = 'Carga baja por habitante: revisa infiltración o dilución';
    } else if (v.dbo > 600) {
      tone = 'warn';
      text = 'Agua muy concentrada: el tratamiento biológico se resiente';
    }

    return [
      { label: 'Carga de DBO₅', value: cargaDbo, unit: 'kg/d', digits: 1 },
      { label: 'Carga de SS', value: cargaSS, unit: 'kg/d', digits: 1 },
      { label: 'Habitantes equivalentes', value: he, unit: 'h-e', digits: 0 },
      { label: 'h-e por habitante', value: perCapita, unit: 'h-e/hab', digits: 2 },
      { label: 'Diagnóstico', text: text, tone: tone, wide: true },
    ];
  });

  /* ---------------------------------------------------------- depuración */

  Estudio.calculator('ma-depuracion', function (v) {
    if (![v.ce, v.cs, v.q].every(Number.isFinite)) {
      return [{ label: 'Faltan datos', text: 'Completa todos los campos para calcular.', tone: 'warn', wide: true }];
    }
    if (v.ce <= 0) {
      return [{ label: 'Datos imposibles', text: 'La concentración de entrada debe ser mayor que cero.', tone: 'bad', wide: true }];
    }
    if (v.cs > v.ce) {
      return [{ label: 'Revisa los datos', text: 'La salida no puede ser mayor que la entrada.', tone: 'bad', wide: true }];
    }

    var eta = ((v.ce - v.cs) / v.ce) * 100;
    var kgIn = (v.q * v.ce) / 1000;
    var kgOut = (v.q * v.cs) / 1000;

    var tone = 'ok';
    var text = 'Rendimiento de tratamiento secundario';
    if (eta >= 90) {
      tone = 'ok';
      text = 'Cumple incluso en zona sensible';
    } else if (eta >= 70) {
      tone = 'ok';
      text = 'Cumple el mínimo general del 70 %';
    } else if (eta >= 40) {
      tone = 'warn';
      text = 'Solo tratamiento primario: no alcanza el 70 %';
    } else {
      tone = 'bad';
      text = 'Rendimiento insuficiente para verter';
    }

    return [
      { label: 'Eficiencia', value: eta, unit: '%', digits: 1 },
      { label: 'Carga de entrada', value: kgIn, unit: 'kg/d', digits: 1 },
      { label: 'Carga de salida', value: kgOut, unit: 'kg/d', digits: 1 },
      { label: 'Masa eliminada', value: kgIn - kgOut, unit: 'kg/d', digits: 1 },
      { label: 'Diagnóstico', text: text, tone: tone, wide: true },
    ];
  });

  /* ---------------------------------------------------------- ruido */

  Estudio.calculator('ma-ruido', function (v) {
    if (![v.l1, v.l2, v.l3, v.r].every(Number.isFinite)) {
      return [{ label: 'Faltan datos', text: 'Completa todos los campos para calcular.', tone: 'warn', wide: true }];
    }
    if (v.r <= 0) {
      return [{ label: 'Datos imposibles', text: 'La distancia debe ser mayor que cero.', tone: 'bad', wide: true }];
    }

    var sum = Math.pow(10, v.l1 / 10) + Math.pow(10, v.l2 / 10) + Math.pow(10, v.l3 / 10);
    var total = 10 * Math.log10(sum);
    /* los niveles entran medidos a 1 m: Lp(r) = Lp(1 m) - 20 log10(r) */
    var atDistance = total - 20 * Math.log10(v.r);
    var loudest = Math.max(v.l1, v.l2, v.l3);

    var tone = 'ok';
    var text = 'Por debajo de los límites habituales';
    if (atDistance > 65) {
      tone = 'bad';
      text = 'Supera el límite diurno habitual de 65 dB(A)';
    } else if (atDistance > 55) {
      tone = 'warn';
      text = 'Supera el límite nocturno habitual de 55 dB(A)';
    }

    return [
      { label: 'Nivel total en la fuente', value: total, unit: 'dB(A)', digits: 1 },
      { label: 'A la distancia indicada', value: atDistance, unit: 'dB(A)', digits: 1 },
      { label: 'Foco dominante', value: loudest, unit: 'dB(A)', digits: 0 },
      { label: 'Atenuación', value: total - atDistance, unit: 'dB', digits: 1 },
      { label: 'Diagnóstico', text: text, tone: tone, wide: true },
    ];
  });

  /* ---------------------------------------------------------- huella */

  Estudio.calculator('ma-huella', function (v) {
    if (![v.gas, v.kwh, v.n, v.ha].every(Number.isFinite)) {
      return [{ label: 'Faltan datos', text: 'Completa todos los campos para calcular.', tone: 'warn', wide: true }];
    }
    if (v.ha <= 0) {
      return [{ label: 'Datos imposibles', text: 'La superficie debe ser mayor que cero.', tone: 'bad', wide: true }];
    }

    var gas = v.gas * 2.68;
    var elec = v.kwh * 0.19;
    var fert = v.n * 5.5;
    var total = gas + elec + fert;
    var perHa = total / v.ha;

    var tone = 'ok';
    var text = 'Huella contenida para el tamaño de la explotación';
    if (perHa > 1500) {
      tone = 'warn';
      text = 'Huella alta: revisa fertilización nitrogenada y gasóleo';
    } else if (perHa > 700) {
      tone = 'warn';
      text = 'Rango habitual en cultivo intensivo';
    }

    return [
      { label: 'Gasóleo', value: gas, unit: 'kg CO₂e', digits: 0 },
      { label: 'Electricidad', value: elec, unit: 'kg CO₂e', digits: 0 },
      { label: 'Fertilizante', value: fert, unit: 'kg CO₂e', digits: 0 },
      { label: 'Total', value: total / 1000, unit: 't CO₂e', digits: 2 },
      { label: 'Por hectárea', value: perHa, unit: 'kg CO₂e/ha', digits: 0 },
      { label: 'Diagnóstico', text: text, tone: tone, wide: true },
    ];
  });

  /* ---------------------------------------------------------- curva de oxígeno */

  Estudio.figure('ma-sag', function (root, v) {
    var curve = root.querySelector('[data-fig="curve"]');
    var marker = root.querySelector('[data-fig="marker"]');
    var drop = root.querySelector('[data-fig="drop"]');
    var markerLabel = root.querySelector('[data-fig="marker-label"]');
    var satLine = root.querySelector('[data-fig="sat"]');
    var satLabel = root.querySelector('[data-fig="sat-label"]');
    var lifeLine = root.querySelector('[data-fig="life"]');
    var lifeLabel = root.querySelector('[data-fig="life-label"]');
    var read = root.querySelector('[data-fig="read"]');

    var x0 = 62;
    var x1 = 524;
    var y0 = 216;
    var y1 = 26;
    var maxT = 10;
    var maxDo = 10;

    function px(t) {
      return x0 + (t / maxT) * (x1 - x0);
    }

    function py(doVal) {
      var clamped = Math.min(maxDo, Math.max(0, doVal));
      return y0 - (clamped / maxDo) * (y0 - y1);
    }

    var l0 = Math.max(0.5, v.l0);
    var k1 = Math.max(0.01, v.k1 / 100);
    var k2 = Math.max(0.01, v.k2 / 100);
    var d0 = Math.max(0, v.d0);

    /* the sliders carry hundredths, so the readout needs two decimals */
    var outK1 = root.querySelector('output[data-out="k1"]');
    var outK2 = root.querySelector('output[data-out="k2"]');
    var outD0 = root.querySelector('output[data-out="d0"]');
    if (outK1) outK1.textContent = Estudio.fmt(k1, 2);
    if (outK2) outK2.textContent = Estudio.fmt(k2, 2);
    if (outD0) outD0.textContent = Estudio.fmt(d0, 1);

    function deficit(t) {
      if (Math.abs(k2 - k1) < 1e-4) {
        return k1 * l0 * t * Math.exp(-k1 * t) + d0 * Math.exp(-k1 * t);
      }
      return (
        ((k1 * l0) / (k2 - k1)) * (Math.exp(-k1 * t) - Math.exp(-k2 * t)) +
        d0 * Math.exp(-k2 * t)
      );
    }

    function oxygen(t) {
      return CS - deficit(t);
    }

    satLine.setAttribute('y1', py(CS));
    satLine.setAttribute('y2', py(CS));
    satLabel.setAttribute('y', py(CS) - 6);
    satLabel.textContent = 'saturación ' + Estudio.fmt(CS, 1) + ' mg/L';

    lifeLine.setAttribute('y1', py(4));
    lifeLine.setAttribute('y2', py(4));
    lifeLabel.setAttribute('y', py(4) - 6);

    var d = '';
    var minT = 0;
    var minDo = oxygen(0);
    for (var i = 0; i <= 500; i++) {
      var t = (i / 500) * maxT;
      var doVal = oxygen(t);
      d += (i === 0 ? 'M' : 'L') + px(t).toFixed(1) + ' ' + py(doVal).toFixed(1);
      if (doVal < minDo) {
        minDo = doVal;
        minT = t;
      }
    }
    curve.setAttribute('d', d);

    var mx = px(minT);
    var my = py(minDo);
    marker.setAttribute('cx', mx.toFixed(1));
    marker.setAttribute('cy', my.toFixed(1));
    drop.setAttribute('x1', mx.toFixed(1));
    drop.setAttribute('x2', mx.toFixed(1));
    drop.setAttribute('y1', my.toFixed(1));
    drop.setAttribute('y2', y0);

    markerLabel.setAttribute('x', mx.toFixed(1));
    markerLabel.setAttribute('y', my + 16);
    markerLabel.textContent = Estudio.fmt(minDo, 1) + ' mg/L';

    if (read) {
      var below = '';
      if (minDo < 4) {
        var back = null;
        for (var j = 0; j <= 500; j++) {
          var tj = (j / 500) * maxT;
          if (tj > minT && oxygen(tj) >= 4) {
            back = tj;
            break;
          }
        }
        below =
          back !== null
            ? ' El río vuelve por encima de 4 mg/L hacia el día ' + Estudio.fmt(back, 1) + ': casi ' + Estudio.fmt(back - minT, 1) + ' días con el cauce comprometido.'
            : ' En los diez días representados no se recupera: el vertido es excesivo para este río.';
      } else {
        below = ' El mínimo se queda por encima de 4 mg/L, así que la vida piscícola no entra en riesgo.';
      }
      read.textContent = '';
      var strong = document.createElement('b');
      strong.textContent =
        'Mínimo ' + Estudio.fmt(minDo, 1) + ' mg/L a los ' + Estudio.fmt(minT, 1) + ' días.';
      read.appendChild(strong);
      read.appendChild(
        document.createTextNode(
          below +
            ' Con k₁ = ' +
            Estudio.fmt(k1, 2) +
            ' y k₂ = ' +
            Estudio.fmt(k2, 2) +
            ' d⁻¹, la relación k₂/k₁ es ' +
            Estudio.fmt(k2 / k1, 2) +
            '.'
        )
      );
    }
  });
})();
