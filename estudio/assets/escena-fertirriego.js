/* ==========================================================================
   Escena 3D · cabezal de fertirriego, línea de goteo y bulbo húmedo
   ========================================================================== */

(function () {
  'use strict';

  var E = window.Escena3D;
  if (!E) return;

  var mount = document.getElementById('e3d-fertirriego');
  if (!mount) return;

  var box = E.box, cyl = E.cyl, coneX = E.coneX, sphere = E.sphere, hemi = E.hemi,
      move = E.move, scale = E.scale, fmt = E.fmt;

  var TANK_X = -3.2;
  var PIPE_Y = 0.42;
  var DRIP_X = 1.35;

  /* ------------------------------------------------------------- modelo */

  var TEXTURAS = {
    franco: { kx: 1.0, ky: 1.0 },
    arenoso: { kx: 0.78, ky: 1.3 },
    arcilloso: { kx: 1.26, ky: 0.76 }
  };

  var DTHETA = 0.1; /* incremento de humedad volumétrica del suelo mojado */

  function bulbo(r, kx, ky) {
    var g = hemi(0, 0, 0, r, 20, 7);
    scale(g, kx, -ky, kx);
    return move(g, DRIP_X, 0.02, 0);
  }

  function geometria(V, t) {
    var vs = (V / 1000) / DTHETA;
    var r = Math.pow((3 * vs) / (2 * Math.PI), 1 / 3);
    return { r: r, rx: r * t.kx, ry: r * t.ky };
  }

  var emisores = [];
  [-1.2, -0.6, 0, 0.6, 1.2].forEach(function (z) {
    emisores.push(cyl(DRIP_X, 0.15, z, 0.065, 0.14, 10));
  });

  var red = E.merge([
    cyl(-0.62, PIPE_Y, 0, 0.075, 3.95, 12, 'x'),
    cyl(DRIP_X, 0.29, 0, 0.055, 0.28, 10),
    cyl(DRIP_X, 0.15, 0, 0.055, 3.0, 12, 'z'),
    E.merge(emisores)
  ]);

  var parts = [
    {
      id: 'deposito',
      name: 'Depósito de agua',
      color: 'paper',
      opacity: 0.45,
      geo: cyl(TANK_X, 0.95, 0, 0.6, 1.9, 24),
      hotspot: [TANK_X, 2.0, 0],
      note: 'Guarda el agua de riego y marca la línea base. Su CE y su pH se miden aquí, antes de inyectar nada, porque son los valores a los que hay que llevar la solución final. Todo lo que se añade después se calcula sobre este agua.'
    },
    {
      id: 'agua',
      name: 'Agua almacenada',
      color: 'water',
      opacity: 0.9,
      geo: cyl(TANK_X, 0.72, 0, 0.53, 1.36, 24),
      hotspot: [TANK_X, 1.2, 0.55],
      note: 'El nivel útil es el que queda por encima de la boca de aspiración. Si la bomba toma aire, la instalación pierde presión y la dosificación se vuelve irregular. Por eso el depósito nunca se vacía del todo.'
    },
    {
      id: 'madre',
      name: 'Depósito de solución madre',
      color: 'accent2',
      opacity: 0.6,
      geo: cyl(TANK_X, 0.5, 1.35, 0.3, 1.0, 18),
      hotspot: [TANK_X, 1.05, 1.35],
      note: 'Se prepara concentrada, 100 o 200 veces, para no transportar agua. Va separada del calcio cuando la fórmula lleva fosfatos o sulfatos, porque precipitan y acaban obstruyendo el gotero. El volumen gastado es el volumen de riego dividido por la relación de dilución.'
    },
    {
      id: 'bomba',
      name: 'Bomba dosificadora',
      color: 'paper',
      geo: E.merge([
        box(-2.2, 0.8, 0, 0.42, 0.5, 0.34),
        cyl(-2.2, 1.12, 0, 0.12, 0.22, 12),
        cyl(-2.2, 0.8, 0.22, 0.05, 0.5, 8, 'z')
      ]),
      hotspot: [-2.2, 1.32, 0],
      note: 'Inyecta la solución madre a caudal proporcional al agua que pasa por la tubería. Es lo que permite controlar la CE de verdad: si el caudal de la red cambia, la bomba reajusta la dosis. Se monta después de los filtros y con válvula antirretorno.'
    },
    {
      id: 'venturi',
      name: 'Inyector Venturi',
      color: 'steel',
      geo: coneX(-1.55, PIPE_Y, 0, 0.17, 0.085, 0.5, 16),
      hotspot: [-1.55, 0.68, 0],
      note: 'Aprovecha la depresión que crea un estrechamiento para succionar la solución madre. No necesita electricidad y es barato, pero es poco preciso y provoca una pérdida de carga del 30 al 40 %. Sirve para superficies pequeñas y para instalaciones sin corriente.'
    },
    {
      id: 'filtro',
      name: 'Filtro de anillas',
      color: 'steel',
      geo: E.merge([
        cyl(-0.8, PIPE_Y, 0, 0.23, 0.55, 18, 'x'),
        cyl(-1.08, PIPE_Y, 0, 0.26, 0.08, 18, 'x'),
        cyl(-0.52, PIPE_Y, 0, 0.26, 0.08, 18, 'x')
      ]),
      hotspot: [-0.8, 0.72, 0],
      note: 'Retiene las partículas que taparían los goteros. En goteo se monta siempre, aunque el agua llegue limpia, porque los propios fertilizantes forman precipitados. Cuando se ensucia, la pérdida de carga sube y el caudal de los goteros del final del ramal cae.'
    },
    {
      id: 'valvula',
      name: 'Válvula y manómetro',
      color: 'accent',
      geo: E.merge([
        cyl(0.02, PIPE_Y, 0, 0.1, 0.34, 12),
        sphere(0.02, 0.8, 0, 0.16, 14, 8)
      ]),
      hotspot: [0.02, 1.02, 0],
      note: 'La válvula abre y cierra el sector; el manómetro mide la presión de trabajo. Con un manómetro antes y otro después del filtro, la diferencia dice cuándo hay que limpiarlo. La presión también fija el caudal de cada gotero: por debajo del rango, el reparto deja de ser uniforme.'
    },
    {
      id: 'goteo',
      name: 'Línea de goteo',
      color: 'dark',
      geo: red,
      hotspot: [DRIP_X, 0.3, 1.45],
      note: 'Es la tubería con los goteros insertados. Cada gotero entrega un caudal fijo, entre 1,6 y 8 L/h, siempre que la presión esté en el rango de trabajo. La separación entre goteros y entre líneas decide qué parte del suelo se moja y si el bulbo cubre la zona radicular.'
    },
    {
      id: 'bulbo',
      name: 'Bulbo húmedo',
      color: 'water',
      opacity: 0.92,
      geo: bulbo(0.34, 1, 1),
      hotspot: [DRIP_X, -0.32, 0],
      note: 'Es el volumen de suelo mojado por un gotero. Su forma depende de la textura: en arena el agua baja y el bulbo sale estrecho y profundo; en arcilla se extiende en horizontal y queda somero. El radio crece con la raíz cúbica del volumen, así que duplicar el tiempo de riego no duplica el bulbo.'
    },
    {
      id: 'suelo',
      name: 'Suelo',
      color: 'soil',
      opacity: 0.12,
      geo: box(DRIP_X, -0.5, 0, 1.9, 1.0, 3.4),
      hotspot: [2.05, -0.2, 0],
      note: 'Solo se moja donde llega el agua. Fuera del bulbo las raíces no encuentran humedad, por eso el marco de plantación y la separación entre goteros tienen que cubrir la zona radicular. Regar por encima de lo que admite el bulbo no moja más: lava sales hacia abajo.'
    },
    /* gotas de agua circulando por la tubería */
    { id: 'fl1', name: '', color: 'water', geo: sphere(-2.6, PIPE_Y, 0, 0.075, 8, 5), hotspot: null },
    { id: 'fl2', name: '', color: 'water', geo: sphere(-1.3, PIPE_Y, 0, 0.075, 8, 5), hotspot: null },
    { id: 'fl3', name: '', color: 'water', geo: sphere(0, PIPE_Y, 0, 0.075, 8, 5), hotspot: null },
    /* marco invisible: fija el encuadre para que no baile al animar */
    {
      id: 'marco',
      name: '',
      color: 'paper',
      opacity: 0,
      geo: box(-0.75, 0.45, 0, 6.1, 2.9, 3.4),
      hotspot: null
    }
  ];

  /* ------------------------------------------------------------- estado */

  var curR = 0.34;
  var flujos = [
    { id: 'fl1', x: -2.6 },
    { id: 'fl2', x: -1.3 },
    { id: 'fl3', x: 0 }
  ];

  E.create(mount, {
    label: 'Cabezal de fertirriego y bulbo húmedo',
    parts: parts,
    view: { yaw: -0.62, pitch: 0.3, zoom: 1 },
    views: [
      { label: 'Cabezal', yaw: -0.72, pitch: 0.22, zoom: 1 },
      { label: 'Bulbo', yaw: -0.28, pitch: 0.5, zoom: 1.05 },
      { label: 'Planta', yaw: 0, pitch: 1.12, zoom: 0.95 }
    ],
    controls: [
      { id: 'caudal', label: 'Caudal del gotero', min: 1, max: 8, step: 0.5, value: 4, unit: 'L/h', digits: 1 },
      { id: 'tiempo', label: 'Tiempo de riego', min: 0.5, max: 6, step: 0.5, value: 2, unit: 'h', digits: 1 },
      {
        id: 'textura',
        type: 'choice',
        label: 'Textura',
        value: 'franco',
        options: [
          { label: 'Franco', value: 'franco' },
          { label: 'Arenoso', value: 'arenoso' },
          { label: 'Arcilloso', value: 'arcilloso' }
        ]
      }
    ],

    readout: function (s) {
      var t = TEXTURAS[s.textura] || TEXTURAS.franco;
      var V = s.caudal * s.tiempo;
      var d = geometria(V, t);
      var rx = d.rx * 100, ry = d.ry * 100;
      var tone = 'ok', diag = 'Correcto';
      if (ry > 50) { tone = 'bad'; diag = 'Lixivia'; }
      else if (rx < 22) { tone = 'warn'; diag = 'Corto'; }
      return [
        { label: 'Volumen', value: fmt(V, 1), unit: 'L' },
        { label: 'Radio', value: fmt(rx, 0), unit: 'cm' },
        { label: 'Profundidad', value: fmt(ry, 0), unit: 'cm' },
        { label: 'Diagnóstico', value: diag, tone: tone }
      ];
    },

    tick: function (dt, api, s) {
      var movido = false;
      var vel = 0.9 * (s.caudal / 4);

      for (var i = 0; i < flujos.length; i++) {
        var f = flujos[i];
        f.x += dt * vel;
        if (f.x > DRIP_X) f.x -= 3.95;
        var pf = api.get(f.id);
        if (pf) { pf.geo = sphere(f.x, PIPE_Y, 0, 0.075, 8, 5); movido = true; }
      }

      var t = TEXTURAS[s.textura] || TEXTURAS.franco;
      var destino = Math.max(0.05, geometria(s.caudal * s.tiempo, t).r);
      if (Math.abs(destino - curR) > 0.0015) {
        curR += (destino - curR) * Math.min(1, dt * 6);
        var pb = api.get('bulbo');
        if (pb) { pb.geo = bulbo(curR, t.kx, t.ky); movido = true; }
      }

      return movido;
    }
  });
})();
