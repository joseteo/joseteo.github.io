/* ==========================================================================
   Escena 3D · tractor, apero y reparto de cargas en el enganche
   ========================================================================== */

(function () {
  'use strict';

  var E = window.Escena3D;
  if (!E) return;

  var mount = document.getElementById('e3d-maquinaria');
  if (!mount) return;

  var box = E.box, cyl = E.cyl, cone = E.cone, coneX = E.coneX, sphere = E.sphere,
      merge = E.merge, fmt = E.fmt;

  var M_TRACTOR = 4000;   /* kg */
  var G = 9.81;
  var REPARTO = 0.62;     /* fracción del peso que cae en el eje trasero */
  var V_TRABAJO = 8;      /* km/h */

  var SUELOS = { seco: 0.75, humedo: 0.55, fangoso: 0.35 };

  function flechaAbajo(x, yPunta, z, largo) {
    var cabeza = largo * 0.38, vastago = largo - cabeza;
    return merge([
      cyl(x, yPunta + cabeza + vastago / 2, z, 0.045, vastago, 8),
      cone(x, yPunta + cabeza / 2, z, 0.002, 0.12, cabeza, 12)
    ]);
  }

  function flechaAtras(xPunta, y, z, largo) {
    var cabeza = largo * 0.38, vastago = largo - cabeza;
    return merge([
      cyl(xPunta + cabeza + vastago / 2, y, z, 0.045, vastago, 8, 'x'),
      coneX(xPunta + cabeza / 2, y, z, 0.002, 0.12, cabeza, 12)
    ]);
  }

  function lastre(k) {
    var r = 0.22 + k * 0.2;
    return merge([
      cyl(-0.5, 0.58, 0.76, r, 0.1, 18, 'z'),
      cyl(-0.5, 0.58, -0.76, r, 0.1, 18, 'z')
    ]);
  }

  function apero() {
    var list = [box(-2.05, 0.52, 0, 0.14, 0.14, 1.7)];
    [-0.62, 0, 0.62].forEach(function (z) {
      list.push(box(-2.05, 0.3, z, 0.1, 0.42, 0.1));
      list.push(cone(-2.05, 0.06, z, 0.002, 0.09, 0.18, 10));
    });
    return merge(list);
  }

  var parts = [
    {
      id: 'cuerpo',
      name: 'Tractor',
      color: '#b34f37',
      geo: merge([
        box(0.1, 1.02, 0, 2.0, 0.6, 0.9),
        box(1.05, 0.95, 0, 0.6, 0.34, 0.7),
        cyl(1.0, 1.35, 0.22, 0.05, 0.5, 8)
      ]),
      hotspot: [1.0, 1.32, 0],
      note: 'El tractor aporta peso y potencia, pero lo que tira del apero es el rozamiento entre la rueda y el suelo. Por eso la carga sobre el eje trasero manda más que los caballos: un tractor potente y ligero patina, y uno pesado con menos potencia puede tirar más.'
    },
    {
      id: 'cabina',
      name: 'Cabina',
      color: 'paper',
      opacity: 0.45,
      geo: merge([
        box(-0.5, 1.72, 0, 1.0, 0.8, 0.9),
        box(-0.5, 2.17, 0, 1.1, 0.1, 1.0)
      ]),
      hotspot: [-0.5, 2.35, 0],
      note: 'No es solo confort. La cabina y el bastidor desplazan el centro de gravedad, y su altura decide el riesgo de vuelco lateral en pendiente. En tractores estrechos de viñedo se compensa bajando el centro de gravedad, no ensanchando el eje.'
    },
    {
      id: 'traseras',
      name: 'Ruedas traseras',
      color: 'dark',
      geo: merge([
        cyl(-0.5, 0.58, 0.58, 0.58, 0.28, 22, 'z'),
        cyl(-0.5, 0.58, -0.58, 0.58, 0.28, 22, 'z')
      ]),
      hotspot: [-0.5, 1.22, 0.7],
      note: 'Son las motrices y soportan la mayor parte del peso. Su diámetro da par a baja velocidad y su dibujo decide el agarre. Aquí se coloca el lastre que de verdad aumenta la tracción: peso sobre el eje que empuja.'
    },
    {
      id: 'delanteras',
      name: 'Ruedas delanteras',
      color: 'dark',
      geo: merge([
        cyl(1.15, 0.42, 0.5, 0.42, 0.22, 20, 'z'),
        cyl(1.15, 0.42, -0.5, 0.42, 0.22, 20, 'z'),
        cyl(1.15, 0.42, 0.62, 0.16, 0.04, 14, 'z'),
        cyl(1.15, 0.42, -0.62, 0.16, 0.04, 14, 'z')
      ]),
      hotspot: [1.15, 0.9, 0.6],
      note: 'Solo dirigen, pero necesitan carga para no perder el contacto. Si el apero pesa mucho y el lastre delantero es escaso, la dirección se vuelve imprecisa y el tractor puede encabritarse al arrancar.'
    },
    {
      id: 'lastre',
      name: 'Lastre',
      color: 'metal',
      geo: lastre(0.27),
      hotspot: [-0.5, 0.6, 0.86],
      note: 'Es masa añadida sobre el eje trasero, en forma de discos o de agua en los neumáticos. Aumenta la carga sobre las ruedas motrices y con ella la fuerza de tracción disponible, sin tocar la potencia del motor. Por encima de cierto peso solo compacta el suelo y sube el consumo.'
    },
    {
      id: 'enganche',
      name: 'Enganche',
      color: 'steel',
      geo: merge([
        box(-1.35, 0.62, 0, 0.6, 0.12, 0.12),
        box(-1.62, 0.58, 0, 0.1, 0.22, 0.3)
      ]),
      hotspot: [-1.4, 0.9, 0],
      note: 'Transmite la fuerza de tiro del apero al tractor. La altura del enganche importa: si va muy alto, la fuerza tiende a levantar el eje delantero; si va muy bajo, aumenta la carga vertical sobre el eje trasero y con ella la tracción.'
    },
    {
      id: 'apero',
      name: 'Apero',
      color: 'steel',
      geo: apero(),
      hotspot: [-2.05, 0.78, 0.7],
      note: 'Opone una resistencia que crece con la profundidad, la velocidad y la textura del suelo. Esa resistencia es la fuerza de tiro que el tractor tiene que vencer. La potencia necesaria sale de P = F·v/3,6 con F en kN y v en km/h.'
    },
    {
      id: 'fuerzas',
      name: 'Fuerzas',
      color: 'waterDeep',
      geo: merge([
        flechaAtras(-2.15, 0.75, 0, 1.0),
        flechaAbajo(0.1, 2.25, 0, 0.45)
      ]),
      hotspot: [-1.6, 1.02, 0],
      note: 'La flecha horizontal es la fuerza de tiro que el apero opone al avance; la vertical, el peso. La tracción disponible es el producto del coeficiente de rozamiento por la carga sobre el eje motriz. Si la resistencia supera ese valor, la rueda gira y el tractor no avanza: eso es el patinaje.'
    },
    {
      id: 'marco',
      name: '',
      color: 'paper',
      opacity: 0,
      geo: box(-0.4, 1.32, 0, 4.4, 2.9, 2.2),
      hotspot: null
    }
  ];

  var humos = [
    { id: 'h1', y: 1.7, x: 1.0, z: 0.22 },
    { id: 'h2', y: 1.95, x: 1.04, z: 0.22 },
    { id: 'h3', y: 2.2, x: 1.08, z: 0.22 }
  ];

  var partesHumo = humos.map(function (h) {
    return { id: h.id, name: '', color: 'metal', opacity: 0.5, geo: sphere(h.x, h.y, h.z, 0.07, 8, 5), hotspot: null };
  });

  parts = parts.slice(0, 8).concat(partesHumo).concat(parts.slice(8));

  E.create(mount, {
    label: 'Tractor con apero y reparto de cargas',
    parts: parts,
    view: { yaw: -0.62, pitch: 0.28, zoom: 1 },
    views: [
      { label: 'Conjunto', yaw: -0.62, pitch: 0.28, zoom: 1 },
      { label: 'Lateral', yaw: 0, pitch: 0.1, zoom: 1 },
      { label: 'Enganche', yaw: -0.95, pitch: 0.32, zoom: 1.3 }
    ],
    controls: [
      { id: 'lastre', label: 'Lastre trasero', min: 0, max: 1500, step: 50, value: 400, unit: 'kg', digits: 0 },
      { id: 'resistencia', label: 'Resistencia del apero', min: 2, max: 20, step: 0.5, value: 9, unit: 'kN', digits: 1 },
      {
        id: 'suelo',
        type: 'choice',
        label: 'Suelo',
        value: 'seco',
        options: [
          { label: 'Seco', value: 'seco' },
          { label: 'Húmedo', value: 'humedo' },
          { label: 'Fangoso', value: 'fangoso' }
        ]
      }
    ],

    onState: function (s, api) {
      api.setGeo('lastre', lastre(s.lastre / 1500));
    },

    readout: function (s) {
      var mu = SUELOS[s.suelo] || SUELOS.seco;
      var pesoTotal = (M_TRACTOR + s.lastre) * G / 1000;
      var cargaTrasera = (REPARTO * M_TRACTOR * G + s.lastre * G) / 1000;
      var fMax = mu * cargaTrasera;
      var ratio = s.resistencia / fMax;
      var slip = 4 + 18 * Math.min(ratio, 1.4) * Math.min(ratio, 1.4);
      var potencia = (s.resistencia * V_TRABAJO) / 3.6;
      var tone = ratio > 1 ? 'bad' : (ratio > 0.85 ? 'warn' : 'ok');
      return [
        { label: 'Peso total', value: fmt(pesoTotal, 1), unit: 'kN' },
        { label: 'Eje trasero', value: fmt(cargaTrasera, 1), unit: 'kN' },
        { label: 'Tracción', value: fmt(fMax, 1), unit: 'kN' },
        { label: 'Patinaje', value: ratio > 1 ? 'No tira' : fmt(slip, 0), unit: ratio > 1 ? '' : '%', tone: tone },
        { label: 'Potencia', value: fmt(potencia, 1), unit: 'kW' }
      ];
    },

    tick: function (dt, api) {
      for (var i = 0; i < humos.length; i++) {
        var h = humos[i];
        h.y += dt * 0.32;
        h.x += dt * 0.05;
        if (h.y > 2.4) { h.y = 1.65; h.x = 1.0; }
        var p = api.get(h.id);
        if (p) p.geo = sphere(h.x, h.y, h.z, 0.055 + (h.y - 1.65) * 0.07, 8, 5);
      }
      return true;
    }
  });
})();
