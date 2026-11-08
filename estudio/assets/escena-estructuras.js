/* ==========================================================================
   Escena 3D · pórtico de nave agrícola, carga y flecha
   ========================================================================== */

(function () {
  'use strict';

  var E = window.Escena3D;
  if (!E) return;

  var mount = document.getElementById('e3d-estructuras');
  if (!mount) return;

  var box = E.box, cyl = E.cyl, cone = E.cone, beam = E.beam, merge = E.merge, fmt = E.fmt;

  var LUZ = 4.4;      /* unidades de modelo */
  var LUZ_M = 12;     /* metros reales */
  var ALTO = 2.4;
  var LIMITE = 250;   /* L/250 */

  var PERFILES = {
    '300': { I: 8356e-8, W: 557e-6, nombre: 'IPE 300' },
    '240': { I: 3892e-8, W: 324e-6, nombre: 'IPE 240' },
    '200': { I: 1943e-8, W: 194e-6, nombre: 'IPE 200' }
  };

  function curva(x, sag) {
    var t = (x + LUZ / 2) / LUZ;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return ALTO - sag * Math.sin(Math.PI * t);
  }

  function haz(sag) {
    var seg = 10, list = [], i, x1, x2;
    for (i = 0; i < seg; i++) {
      x1 = -LUZ / 2 + (LUZ * i) / seg;
      x2 = -LUZ / 2 + (LUZ * (i + 1)) / seg;
      list.push(beam(x1, curva(x1, sag), x2, curva(x2, sag), 0, 0.3, 0.24));
    }
    return merge(list);
  }

  function techo(sag) {
    var seg = 12, list = [], i, x1, x2;
    for (i = 0; i < seg; i++) {
      x1 = -2.35 + (4.7 * i) / seg;
      x2 = -2.35 + (4.7 * (i + 1)) / seg;
      list.push(beam(x1, curva(x1, sag) + 0.19, x2, curva(x2, sag) + 0.19, -0.62, 0.08, 1.1));
    }
    return merge(list);
  }

  function flecha(x, yPunta, largo, z) {
    var cabeza = largo * 0.36;
    var vastago = largo - cabeza;
    return merge([
      cyl(x, yPunta + cabeza + vastago / 2, z, 0.05, vastago, 8),
      cone(x, yPunta + cabeza / 2, z, 0.002, 0.13, cabeza, 12)
    ]);
  }

  function cargas(sag, q) {
    var largo = 0.45 + q * 0.11;
    var xs = [-1.8, -0.9, 0, 0.9, 1.8];
    var list = [];
    for (var i = 0; i < xs.length; i++) {
      list.push(flecha(xs[i], curva(xs[i], sag) + 0.23, largo, 0.92));
    }
    return merge(list);
  }

  function fantasma() {
    var list = [], n = 14, i, x, L = LUZ * 0.86;
    for (i = 0; i < n; i++) {
      x = -L / 2 + (L * (i + 0.5)) / n;
      list.push(box(x, ALTO + 0.2, 1.05, (L / n) * 0.6, 0.05, 0.05));
    }
    return merge(list);
  }

  var SAG = 0.076;

  var parts = [
    {
      id: 'terreno',
      name: 'Terreno',
      color: 'soil',
      opacity: 0.4,
      geo: box(0, -0.12, 0, 6.2, 0.24, 2.4),
      hotspot: [2.7, -0.12, 0.9],
      note: 'El terreno solo cuenta si trabaja a compresión y no se hunde. La zapata reparte la carga del pilar en una superficie mayor para no superar la tensión admisible del suelo. Si el suelo es blando, lo que dimensiona la cimentación es el suelo, no el acero.'
    },
    {
      id: 'zapatas',
      name: 'Zapatas',
      color: 'metal',
      geo: merge([
        box(-2.2, 0.05, 0, 0.8, 0.3, 0.8),
        box(2.2, 0.05, 0, 0.8, 0.3, 0.8)
      ]),
      hotspot: [-2.2, 0.25, 0.45],
      note: 'Reciben el pilar y transmiten la carga al terreno. Su tamaño sale de la tensión admisible del suelo, pero en naves agrícolas abiertas suele gobernarlas el viento y el momento de vuelco, no el peso vertical. El arranque de la placa de anclaje también se calcula aquí.'
    },
    {
      id: 'pilares',
      name: 'Pilares',
      color: 'steel',
      geo: merge([
        box(-2.2, 1.3, 0, 0.24, 2.2, 0.24),
        box(2.2, 1.3, 0, 0.24, 2.2, 0.24)
      ]),
      hotspot: [-2.2, 1.9, 0],
      note: 'Trabajan a compresión y a flexión. Su esbeltez decide si pandean antes de romper: cuanto más altos y más finos, más baja la carga crítica de Euler, que va con el inverso del cuadrado de la longitud. En una nave abierta, el viento transversal es lo que dimensiona el pilar.'
    },
    {
      id: 'dintel',
      name: 'Dintel',
      color: 'accent',
      geo: haz(SAG),
      hotspot: [0, 2.62, 0],
      note: 'Es la viga que salva la luz. Con carga uniforme el momento máximo vale qL²/8 en el centro y la flecha 5qL⁴/(384EI). La sección se elige por el mayor de los dos criterios, tensión o flecha. En luces grandes casi siempre manda la flecha, y por eso el perfil sale más canto de lo que pediría la resistencia.'
    },
    {
      id: 'cubierta',
      name: 'Cubierta',
      color: 'paper',
      opacity: 0.55,
      geo: techo(SAG),
      hotspot: [1.5, 2.85, 0.55],
      note: 'Aporta la carga permanente y recoge la nieve y el viento. Su peso se da en kN/m² y se convierte en carga lineal sobre el dintel multiplicando por el ancho tributario. Una cubierta de chapa pesa del orden de 0,15 kN/m²; la nieve de la zona se suma aparte según la altitud.'
    },
    {
      id: 'fantasma',
      name: 'Posición sin deformar',
      color: 'ink',
      opacity: 0.5,
      geo: fantasma(),
      hotspot: [1.7, ALTO + 0.2, 1.05],
      note: 'Marca la recta que ocuparía el dintel sin carga. La separación entre esa línea y la viga curvada es la flecha. Se compara siempre con un límite normativo, L/250 o L/300, nunca con una impresión visual: lo que parece poco puede estar fuera de norma.'
    },
    {
      id: 'carga',
      name: 'Carga repartida',
      color: '#b0472f',
      geo: cargas(SAG, 2),
      hotspot: [0, 3.3, 0],
      note: 'Cada flecha es la parte de carga que baja por la cubierta, expresada en kN/m a lo largo del dintel. Si la carga se duplica, el momento y la tensión se duplican, pero la flecha se multiplica por ocho: depende de la carga y de la luz elevada a la cuarta.'
    },
    {
      id: 'marco',
      name: '',
      color: 'paper',
      opacity: 0,
      geo: box(0, 1.5, 0, 6.2, 3.6, 2.6),
      hotspot: null
    }
  ];

  E.create(mount, {
    label: 'Pórtico de nave agrícola con carga y flecha',
    parts: parts,
    view: { yaw: -0.5, pitch: 0.26, zoom: 1 },
    views: [
      { label: 'Alzado', yaw: 0, pitch: 0.08, zoom: 1 },
      { label: 'Perspectiva', yaw: -0.5, pitch: 0.26, zoom: 1 },
      { label: 'Planta', yaw: -0.2, pitch: 1.1, zoom: 0.95 }
    ],
    controls: [
      { id: 'carga', label: 'Carga repartida', min: 0.5, max: 6, step: 0.1, value: 2, unit: 'kN/m', digits: 1 },
      {
        id: 'perfil',
        type: 'choice',
        label: 'Perfil',
        value: '300',
        options: [
          { label: 'IPE 300', value: '300' },
          { label: 'IPE 240', value: '240' },
          { label: 'IPE 200', value: '200' }
        ]
      }
    ],

    onState: function (s, api) {
      var sag = 0.02 + s.carga * 0.028;
      api.setGeo('dintel', haz(sag));
      api.setGeo('cubierta', techo(sag));
      api.setGeo('carga', cargas(sag, s.carga));
    },

    readout: function (s) {
      var p = PERFILES[s.perfil] || PERFILES['300'];
      var q = s.carga;
      var M = (q * LUZ_M * LUZ_M) / 8;
      var sigma = M * 1000 / p.W / 1e6;
      var delta = (5 * q * 1000 * Math.pow(LUZ_M, 4)) / (384 * 210e9 * p.I) * 1000;
      var tope = (LUZ_M * 1000) / LIMITE;
      return [
        { label: 'Momento', value: fmt(M, 1), unit: 'kN·m' },
        { label: 'Tensión', value: fmt(sigma, 0), unit: 'MPa', tone: sigma > 235 ? 'bad' : (sigma > 200 ? 'warn' : 'ok') },
        { label: 'Flecha', value: fmt(delta, 1), unit: 'mm', tone: delta > tope ? 'bad' : (delta > tope * 0.8 ? 'warn' : 'ok') },
        { label: 'Límite L/250', value: fmt(tope, 0), unit: 'mm' }
      ];
    }
  });
})();
