/* Motores y maquinaria agrícola — page tools */
(function () {
  'use strict';

  var G = 9.81;
  var CV = 0.7355;
  var HP = 0.7457;

  /* ---------------------------------------------------------- motor */

  Estudio.calculator('maq-motor', function (v) {
    if (![v.m, v.n, v.ce, v.rho].every(Number.isFinite)) {
      return [{ label: 'Faltan datos', text: 'Completa todos los campos para calcular.', tone: 'warn', wide: true }];
    }
    if (v.m <= 0 || v.n <= 0) {
      return [{ label: 'Datos imposibles', text: 'El par y el régimen deben ser mayores que cero.', tone: 'bad', wide: true }];
    }
    if (v.rho <= 0.5 || v.ce <= 0) {
      return [{ label: 'Revisa el combustible', text: 'La densidad debe rondar 0,84 kg/L y el consumo específico ser positivo.', tone: 'bad', wide: true }];
    }

    var kw = (v.m * v.n) / 9549;
    var cv = kw / CV;
    var hp = kw / HP;
    var omega = (2 * Math.PI * v.n) / 60;
    var liters = (kw * v.ce) / (1000 * v.rho);
    var gramsPerHour = liters * v.rho * 1000;

    var tone = 'ok';
    var text = 'Consumo específico de motor agrícola moderno';
    if (v.ce > 280) {
      tone = 'bad';
      text = 'Consumo propio de un motor atmosférico muy gastador';
    } else if (v.ce > 255) {
      tone = 'warn';
      text = 'Consumo alto: tecnología antigua o motor a media carga';
    } else if (v.ce < 190) {
      tone = 'warn';
      text = 'Por debajo de 190 g/kWh no es creíble en un motor agrícola';
    }

    return [
      { label: 'Potencia', value: kw, unit: 'kW', digits: 1 },
      { label: 'Potencia', value: cv, unit: 'CV', digits: 1 },
      { label: 'Potencia', value: hp, unit: 'hp', digits: 1 },
      { label: 'Velocidad angular', value: omega, unit: 'rad/s', digits: 1 },
      { label: 'Consumo horario', value: liters, unit: 'L/h', digits: 2 },
      { label: 'Combustible', value: gramsPerHour / 1000, unit: 'kg/h', digits: 2 },
      { label: 'Eficiencia', text: text, tone: tone, wide: true },
    ];
  });

  /* ---------------------------------------------------------- apero */

  Estudio.calculator('maq-apero', function (v) {
    if (![v.b, v.a, v.k, v.v, v.eta, v.pmotor].every(Number.isFinite)) {
      return [{ label: 'Faltan datos', text: 'Completa todos los campos para calcular.', tone: 'warn', wide: true }];
    }
    if (v.b <= 0 || v.a <= 0 || v.k <= 0 || v.v <= 0) {
      return [{ label: 'Datos imposibles', text: 'Ancho, profundidad, resistencia y velocidad deben ser mayores que cero.', tone: 'bad', wide: true }];
    }
    if (v.eta <= 0 || v.eta > 1) {
      return [{ label: 'Revisa el rendimiento', text: 'El rendimiento global es una fracción entre 0,3 y 1.', tone: 'bad', wide: true }];
    }

    var force = v.k * v.a * v.b; /* kN */
    var drawbar = (force * v.v) / 3.6; /* kW */
    var engine = drawbar / v.eta; /* kW */
    var engineCv = engine / CV;
    var ratio = v.pmotor > 0 ? engineCv / v.pmotor : Infinity;

    var tone = 'ok';
    var text = 'El tractor va sobrado para este apero';
    if (ratio > 1.1) {
      tone = 'bad';
      text = 'El tractor no puede con el apero: reduce ancho, profundidad o velocidad';
    } else if (ratio > 1) {
      tone = 'warn';
      text = 'Se queda corto: solo aguantará en suelo blando y a poca profundidad';
    } else if (ratio > 0.9) {
      tone = 'warn';
      text = 'Muy justo: sin margen para zonas duras ni para subir la velocidad';
    }

    return [
      { label: 'Fuerza de tiro', value: force, unit: 'kN', digits: 1 },
      { label: 'Potencia de tiro', value: drawbar, unit: 'kW', digits: 1 },
      { label: 'Potencia al motor', value: engine, unit: 'kW', digits: 1 },
      { label: 'Potencia al motor', value: engineCv, unit: 'CV', digits: 0 },
      { label: 'Uso del tractor', value: ratio * 100, unit: '%', digits: 0 },
      { label: 'Diagnóstico', text: text, tone: tone, wide: true },
    ];
  });

  /* ---------------------------------------------------------- capacidad */

  Estudio.calculator('maq-capacidad', function (v) {
    if (![v.b, v.v, v.eta, v.q, v.precio].every(Number.isFinite)) {
      return [{ label: 'Faltan datos', text: 'Completa todos los campos para calcular.', tone: 'warn', wide: true }];
    }
    if (v.b <= 0 || v.v <= 0) {
      return [{ label: 'Datos imposibles', text: 'El ancho y la velocidad deben ser mayores que cero.', tone: 'bad', wide: true }];
    }
    if (v.eta <= 0 || v.eta > 1) {
      return [{ label: 'Revisa la eficiencia', text: 'La eficiencia de campo es una fracción entre 0,3 y 1.', tone: 'bad', wide: true }];
    }

    var theoretical = (v.b * v.v) / 10;
    var effective = theoretical * v.eta;
    var hoursPerHa = effective > 0 ? 1 / effective : Infinity;
    var litersPerHa = effective > 0 ? v.q / effective : Infinity;
    var costPerHa = litersPerHa * v.precio;
    var haPerHour = effective;

    var tone = 'ok';
    var text = 'Eficiencia de campo realista para parcelas grandes';
    if (v.eta < 0.6) {
      tone = 'warn';
      text = 'Eficiencia muy baja: propia de parcelas pequeñas o de muchos giros';
    } else if (v.eta > 0.9) {
      tone = 'warn';
      text = 'Por encima de 0,9 solo en parcelas largas y sin obstáculos';
    }

    return [
      { label: 'Capacidad teórica', value: theoretical, unit: 'ha/h', digits: 2 },
      { label: 'Capacidad efectiva', value: haPerHour, unit: 'ha/h', digits: 2 },
      { label: 'Tiempo por ha', value: hoursPerHa, unit: 'h/ha', digits: 2 },
      { label: 'Consumo por hectárea', value: litersPerHa, unit: 'L/ha', digits: 1 },
      { label: 'Coste de gasóleo', value: costPerHa, unit: '€/ha', digits: 2 },
      { label: 'Eficiencia', text: text, tone: tone, wide: true },
    ];
  });

  /* ---------------------------------------------------------- tracción */

  Estudio.calculator('maq-traccion', function (v) {
    if (![v.masa, v.mu, v.freq, v.v, v.s].every(Number.isFinite)) {
      return [{ label: 'Faltan datos', text: 'Completa todos los campos para calcular.', tone: 'warn', wide: true }];
    }
    if (v.masa <= 0 || v.mu <= 0) {
      return [{ label: 'Datos imposibles', text: 'La masa y la adherencia deben ser mayores que cero.', tone: 'bad', wide: true }];
    }
    if (v.mu > 1) {
      return [{ label: 'Revisa la adherencia', text: 'El coeficiente neumático-suelo no pasa de 0,9 ni en asfalto seco.', tone: 'bad', wide: true }];
    }

    var available = (v.masa * G * v.mu) / 1000; /* kN */
    var ratio = v.freq > 0 ? available / v.freq : Infinity;
    var power = (v.freq * v.v) / 3.6; /* kW */
    var slip = Math.min(100, Math.max(0, v.s));
    var lost = (slip / 100) * v.v; /* km/h perdidos */

    var tone = 'ok';
    var text = 'Adherencia suficiente para la fuerza que pide el apero';
    if (ratio < 0.85) {
      tone = 'bad';
      text = 'Falta lastre: el tractor patinará antes de mover el apero';
    } else if (ratio < 1) {
      tone = 'warn';
      text = 'Al límite: aguantará en seco y patinará en cuanto el suelo se humedezca';
    }

    var slipTone = 'ok';
    var slipText = 'Patinaje en el rango óptimo del 8 al 15 %';
    if (slip > 20) {
      slipTone = 'bad';
      slipText = 'Patinaje excesivo: hay que lastrar o reducir el apero';
    } else if (slip > 15) {
      slipTone = 'warn';
      slipText = 'Algo por encima del óptimo: añade lastre poco a poco';
    } else if (slip < 8) {
      slipTone = 'warn';
      slipText = 'Patinaje bajo: sobra lastre y se compacta el suelo sin ganar tracción';
    }

    return [
      { label: 'Fuerza disponible', value: available, unit: 'kN', digits: 1 },
      { label: 'Fuerza requerida', value: v.freq, unit: 'kN', digits: 1 },
      { label: 'Margen de tracción', value: ratio * 100, unit: '%', digits: 0 },
      { label: 'Potencia de tiro', value: power, unit: 'kW', digits: 1 },
      { label: 'Velocidad perdida', value: lost, unit: 'km/h', digits: 2 },
      { label: 'Tracción', text: text, tone: tone, wide: true },
      { label: 'Patinaje', text: slipText, tone: slipTone, wide: true },
    ];
  });

  /* ---------------------------------------------------------- curvas */

  Estudio.figure('maq-curvas', function (root, v) {
    var torquePath = root.querySelector('[data-fig="torque"]');
    var powerPath = root.querySelector('[data-fig="power"]');
    var tmark = root.querySelector('[data-fig="tmark"]');
    var pmark = root.querySelector('[data-fig="pmark"]');
    var tlabel = root.querySelector('[data-fig="tlabel"]');
    var plabel = root.querySelector('[data-fig="plabel"]');
    var read = root.querySelector('[data-fig="read"]');

    var mmax = Math.max(100, v.mmax || 800);
    var nt = Math.max(600, v.nt || 1400);
    var nn = Math.max(nt + 100, v.nn || 2200);

    var x0 = 70;
    var x1 = 500;
    var yTop = 30;
    var yBase = 212;
    var rpmMin = 600;
    var rpmMax = 2400;

    /* Par: sube del ralentí al máximo y cae en recta hasta el régimen nominal,
       con la pendiente elegida para que la potencia máxima caiga justo en nn. */
    var span = Math.max(50, nn - nt);
    var slope = span / (2 * nn - nt);

    function torque(rpm) {
      if (rpm <= nt) return mmax * (0.55 + 0.45 * (rpm / nt));
      var t = (rpm - nt) / span;
      return Math.max(0, mmax * (1 - slope * t));
    }

    function power(rpm) {
      return (torque(rpm) * rpm) / 9549;
    }

    /* barrido para localizar el máximo de potencia */
    var pmax = 0;
    var rpmPmax = nt;
    for (var r = rpmMin; r <= rpmMax; r += 5) {
      var p = power(r);
      if (p > pmax) {
        pmax = p;
        rpmPmax = r;
      }
    }

    var torqueAxis = mmax * 1.1;
    var powerAxis = pmax * 1.1;

    function px(rpm) {
      return x0 + ((rpm - rpmMin) / (rpmMax - rpmMin)) * (x1 - x0);
    }
    function pyT(value) {
      return yBase - (value / torqueAxis) * (yBase - yTop);
    }
    function pyP(value) {
      return yBase - (value / powerAxis) * (yBase - yTop);
    }

    function roundTo(value, step) {
      return Math.round(value / step) * step;
    }

    function setTick(key, value) {
      var node = root.querySelector('[data-fig="' + key + '"]');
      if (node) node.textContent = Estudio.fmt(value, 0);
    }

    setTick('tick-t1', roundTo(torqueAxis * 0.25, 10));
    setTick('tick-t2', roundTo(torqueAxis * 0.5, 10));
    setTick('tick-t3', roundTo(torqueAxis * 0.75, 10));
    setTick('tick-p1', roundTo(powerAxis * 0.25, 5));
    setTick('tick-p2', roundTo(powerAxis * 0.5, 5));
    setTick('tick-p3', roundTo(powerAxis * 0.75, 5));

    var dTorque = '';
    var dPower = '';
    var first = true;
    for (var rpm = rpmMin; rpm <= rpmMax; rpm += 20) {
      var x = px(rpm).toFixed(1);
      var yt = pyT(torque(rpm)).toFixed(1);
      var yp = pyP(power(rpm)).toFixed(1);
      dTorque += (first ? 'M' : 'L') + x + ' ' + yt;
      dPower += (first ? 'M' : 'L') + x + ' ' + yp;
      first = false;
    }
    torquePath.setAttribute('d', dTorque);
    powerPath.setAttribute('d', dPower);

    var tx = px(nt);
    var ty = pyT(mmax);
    tmark.setAttribute('cx', tx.toFixed(1));
    tmark.setAttribute('cy', ty.toFixed(1));
    tlabel.setAttribute('x', tx.toFixed(1));
    tlabel.setAttribute('y', (ty - 10).toFixed(1));
    tlabel.textContent = Estudio.fmt(mmax, 0) + ' N·m';

    var pxm = px(rpmPmax);
    var pym = pyP(pmax);
    pmark.setAttribute('cx', pxm.toFixed(1));
    pmark.setAttribute('cy', pym.toFixed(1));
    plabel.setAttribute('x', pxm.toFixed(1));
    plabel.setAttribute('y', (pym - 10).toFixed(1));
    plabel.textContent = Estudio.fmt(pmax, 0) + ' kW';

    if (read) {
      var nominal = torque(nn);
      var reserve = nominal > 0 ? (mmax / nominal - 1) * 100 : 0;
      read.textContent = '';
      var strong = document.createElement('b');
      strong.textContent =
        'Par máximo ' + Estudio.fmt(mmax, 0) + ' N·m a ' + Estudio.fmt(nt, 0) + ' rpm.';
      read.appendChild(strong);
      read.appendChild(
        document.createTextNode(
          ' Potencia máxima ' +
            Estudio.fmt(pmax, 1) +
            ' kW (' +
            Estudio.fmt(pmax / CV, 0) +
            ' CV) a ' +
            Estudio.fmt(rpmPmax, 0) +
            ' rpm. Reserva de par del ' +
            Estudio.fmt(reserve, 0) +
            ' %: ' +
            (reserve >= 25
              ? 'el motor aguanta bien una sobrecarga sin reducir marcha.'
              : 'margen escaso, el motor se calará con facilidad en zonas duras.')
        )
      );
    }
  });
})();
