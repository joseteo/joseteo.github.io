/* ==========================================================================
   Escena 3D · línea de depuración de un agua residual (EDAR)
   ========================================================================== */

(function () {
  'use strict';

  var E = window.Escena3D;
  if (!E) return;

  var mount = document.getElementById('e3d-medio-ambiente');
  if (!mount) return;

  var box = E.box, cyl = E.cyl, cone = E.cone, sphere = E.sphere, fmt = E.fmt;

  var V_REACTOR = 250; /* m3 de reactor biológico */
  var LIMITE_DBO = 25; /* mg/L de vertido urbano */

  var bars = [];
  [-0.42, -0.14, 0.14, 0.42].forEach(function (z) {
    bars.push(box(-4.0, 0.5, z, 0.07, 0.85, 0.06));
  });

  var tuberias = E.merge([
    cyl(-3.62, 0.25, 0, 0.08, 0.2, 8, 'x'),
    cyl(-2.62, 0.25, 0, 0.08, 0.2, 8, 'x'),
    cyl(-1.0, 0.25, 0, 0.08, 0.3, 8, 'x'),
    cyl(1.0, 0.25, 0, 0.08, 0.3, 8, 'x'),
    cyl(2.7, 0.25, 0, 0.08, 0.3, 8, 'x')
  ]);

  var parts = [
    {
      id: 'reja',
      name: 'Reja de desbaste',
      color: 'steel',
      opacity: 0.24,
      geo: E.merge([box(-4.0, 0.5, 0, 0.6, 1.0, 1.2), E.merge(bars)]),
      hotspot: [-4.0, 1.15, 0],
      note: 'Primera barrera del tren. Retiene sólidos gruesos, trapos y plásticos que atascarían bombas y equipos aguas abajo. No elimina materia orgánica disuelta: solo separa lo que flota o se engancha en las barras. Se limpia con un peine automático.'
    },
    {
      id: 'desarenador',
      name: 'Desarenador',
      color: 'steel',
      opacity: 0.24,
      geo: box(-3.1, 0.5, 0, 0.9, 1.0, 1.4),
      hotspot: [-3.1, 1.15, 0],
      note: 'Cámara donde la velocidad del agua baja lo justo para que la arena y las gravas se depositen, pero no la materia orgánica. Si la velocidad es demasiado baja sedimenta también la orgánica y se pudre; si es alta, la arena pasa al reactor y erosiona los equipos.'
    },
    {
      id: 'primario',
      name: 'Decantador primario',
      color: 'steel',
      opacity: 0.24,
      geo: cyl(-1.85, 0.5, 0, 0.75, 1.0, 24),
      hotspot: [-1.85, 1.15, 0],
      note: 'Deja reposar el agua para que los sólidos en suspensión caigan al fondo por gravedad. Retira entre el 50 y el 60 % de los sólidos y un 25 a 35 % de la DBO. El agua clarificada pasa al tratamiento biológico y el fango del fondo se purga.'
    },
    {
      id: 'reactor',
      name: 'Reactor biológico',
      color: 'steel',
      opacity: 0.24,
      geo: box(0, 0.5, 0, 1.8, 1.0, 1.4),
      hotspot: [0, 1.15, 0],
      note: 'Aquí trabajan las bacterias. La aireación mantiene el oxígeno disuelto y el fango en suspensión, y los microorganismos consumen la materia orgánica. Lo que decide el resultado es el tiempo de retención: si el caudal sube, el agua pasa demasiado rápido y la DBO de salida se dispara.'
    },
    {
      id: 'secundario',
      name: 'Decantador secundario',
      color: 'steel',
      opacity: 0.24,
      geo: cyl(1.85, 0.5, 0, 0.75, 1.0, 24),
      hotspot: [1.85, 1.15, 0],
      note: 'Separa el fango activo del agua tratada. Parte del fango vuelve al reactor para mantener la concentración de bacterias y el resto se purga. Si el manto de fango sube, los sólidos se escapan con el efluente y el rendimiento cae aunque el reactor funcione bien.'
    },
    {
      id: 'salida',
      name: 'Efluente',
      color: 'steel',
      opacity: 0.24,
      geo: box(3.2, 0.35, 0, 0.8, 0.7, 0.8),
      hotspot: [3.2, 0.85, 0],
      note: 'Es el agua que vuelve al cauce o se reutiliza para riego. Se controlan la DBO, los sólidos en suspensión y, en zonas sensibles, el nitrógeno y el fósforo. Para reutilización agrícola se exige además control microbiológico y un plan de uso.'
    },
    {
      id: 'fango',
      name: 'Fango',
      color: 'soil',
      geo: E.merge([
        cone(-1.85, -0.2, 0, 0.12, 0.38, 0.4, 20),
        cone(1.85, -0.2, 0, 0.12, 0.38, 0.4, 20)
      ]),
      hotspot: [-1.85, -0.34, 0],
      note: 'Es el residuo del proceso. Se espesa, se deshidrata y se estabiliza antes de llevarlo a compostaje o a vertedero. Su volumen es pequeño frente al del agua tratada, pero concentra la mayor parte de la contaminación que se ha retirado.'
    },
    /* aguas: sin nombre, solo color; el tono se aclara a lo largo del tren */
    { id: 'w1', name: '', color: '#5d5247', opacity: 1, geo: box(-4.0, 0.24, 0, 0.52, 0.48, 1.1), hotspot: null },
    { id: 'w2', name: '', color: '#75838a', opacity: 1, geo: box(-3.1, 0.24, 0, 0.82, 0.48, 1.3), hotspot: null },
    { id: 'w3', name: '', color: '#7c9dac', opacity: 1, geo: cyl(-1.85, 0.24, 0, 0.68, 0.48, 24), hotspot: null },
    { id: 'w4', name: '', color: '#92b6c5', opacity: 1, geo: box(0, 0.24, 0, 1.72, 0.48, 1.32), hotspot: null },
    { id: 'w5', name: '', color: '#b2d0da', opacity: 1, geo: cyl(1.85, 0.24, 0, 0.68, 0.48, 24), hotspot: null },
    { id: 'w6', name: '', color: '#c9e2e8', opacity: 1, geo: box(3.2, 0.18, 0, 0.72, 0.36, 0.72), hotspot: null },
    { id: 'tub', name: '', color: 'steel', geo: tuberias, hotspot: null },
    /* burbujas de aireación */
    { id: 'b1', name: '', color: 'paper', opacity: 0.9, geo: sphere(-0.6, 0.2, 0.3, 0.055, 8, 5), hotspot: null },
    { id: 'b2', name: '', color: 'paper', opacity: 0.9, geo: sphere(-0.1, 0.5, -0.3, 0.05, 8, 5), hotspot: null },
    { id: 'b3', name: '', color: 'paper', opacity: 0.9, geo: sphere(0.45, 0.35, 0.15, 0.06, 8, 5), hotspot: null },
    { id: 'b4', name: '', color: 'paper', opacity: 0.9, geo: sphere(0.2, 0.7, -0.1, 0.045, 8, 5), hotspot: null },
    /* marco invisible: fija el encuadre */
    { id: 'marco', name: '', color: 'paper', opacity: 0, geo: box(-0.35, 0.2, 0, 8.1, 1.7, 1.7), hotspot: null }
  ];

  /* ------------------------------------------------------------- estado */

  var burbujas = [
    { id: 'b1', x: -0.6, z: 0.3, y: 0.2 },
    { id: 'b2', x: -0.1, z: -0.3, y: 0.5 },
    { id: 'b3', x: 0.45, z: 0.15, y: 0.35 },
    { id: 'b4', x: 0.2, z: -0.1, y: 0.7 }
  ];

  function rendimiento(trh) {
    return 0.98 * (1 - Math.exp(-trh / 0.35));
  }

  E.create(mount, {
    label: 'Línea de depuración de un agua residual',
    parts: parts,
    view: { yaw: -0.75, pitch: 0.42, zoom: 1 },
    views: [
      { label: 'Tren', yaw: -0.75, pitch: 0.42, zoom: 1 },
      { label: 'Planta', yaw: -0.15, pitch: 1.1, zoom: 0.95 },
      { label: 'Reactor', yaw: -0.5, pitch: 0.3, zoom: 1.35 }
    ],
    controls: [
      { id: 'caudal', label: 'Caudal', min: 50, max: 500, step: 10, value: 200, unit: 'm³/d', digits: 0 },
      { id: 'dbo', label: 'DBO₅ de entrada', min: 150, max: 600, step: 10, value: 350, unit: 'mg/L', digits: 0 }
    ],

    readout: function (s) {
      var carga = (s.caudal * s.dbo) / 1000;
      var trh = V_REACTOR / s.caudal;
      var eta = rendimiento(trh);
      var salida = s.dbo * (1 - eta);
      var tone = salida > LIMITE_DBO ? 'bad' : (salida > LIMITE_DBO * 0.8 ? 'warn' : 'ok');
      return [
        { label: 'Carga', value: fmt(carga, 0), unit: 'kg/d' },
        { label: 'Habitantes eq.', value: fmt(carga / 0.06, 0), unit: 'h-e' },
        { label: 'Retención', value: fmt(trh * 24, 0), unit: 'h' },
        { label: 'DBO salida', value: fmt(salida, 0), unit: 'mg/L', tone: tone }
      ];
    },

    tick: function (dt, api, s) {
      var vel = 0.55 * (s.caudal / 200);
      for (var i = 0; i < burbujas.length; i++) {
        var b = burbujas[i];
        b.y += dt * vel;
        if (b.y > 0.88) { b.y = 0.1; }
        var p = api.get(b.id);
        if (p) p.geo = sphere(b.x, b.y, b.z, 0.05, 8, 5);
      }
      return true;
    }
  });
})();
