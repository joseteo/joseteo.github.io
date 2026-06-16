(function () {
  const cards = document.querySelectorAll('.hero-card[data-card-anim]');
  if (!cards.length) return;

  function initCanvas(card) {
    const canvas = card.querySelector('.hero-card-canvas');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    function resize() {
      const r = card.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    return { canvas, ctx, resize, w: () => card.offsetWidth, h: () => card.offsetHeight };
  }

  // --- Neural Network (AI & ML Engineer) ---
  function neuralAnim(card) {
    const c = initCanvas(card);
    if (!c) return;
    const nodes = [];
    const layers = [4, 6, 6, 3];
    const color = { r: 186, g: 214, b: 247 };

    function setup() {
      nodes.length = 0;
      const w = c.w(), h = c.h();
      const lx = w / (layers.length + 1);
      layers.forEach((count, li) => {
        const ly = h / (count + 1);
        for (let i = 0; i < count; i++) {
          nodes.push({
            x: lx * (li + 1),
            y: ly * (i + 1),
            layer: li,
            phase: Math.random() * Math.PI * 2,
            r: 2 + Math.random() * 1.5
          });
        }
      });
    }
    setup();

    let raf;
    function draw(t) {
      const w = c.w(), h = c.h();
      c.ctx.clearRect(0, 0, w, h);

      // connections
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          if (b.layer !== a.layer + 1) continue;
          const pulse = (Math.sin(t * 0.002 + a.phase + b.phase) + 1) / 2;
          c.ctx.beginPath();
          c.ctx.moveTo(a.x, a.y);
          c.ctx.lineTo(b.x, b.y);
          c.ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${0.08 + pulse * 0.18})`;
          c.ctx.lineWidth = 0.5 + pulse * 0.5;
          c.ctx.stroke();

          // signal dot traveling along connection
          const prog = ((t * 0.001 + a.phase) % 1);
          const sx = a.x + (b.x - a.x) * prog;
          const sy = a.y + (b.y - a.y) * prog;
          c.ctx.beginPath();
          c.ctx.arc(sx, sy, 1, 0, Math.PI * 2);
          c.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${pulse * 0.5})`;
          c.ctx.fill();
        }
      }

      // nodes
      nodes.forEach(n => {
        const pulse = (Math.sin(t * 0.003 + n.phase) + 1) / 2;
        const radius = n.r + pulse * 1.5;
        c.ctx.beginPath();
        c.ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        c.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${0.3 + pulse * 0.5})`;
        c.ctx.fill();
        // glow
        c.ctx.beginPath();
        c.ctx.arc(n.x, n.y, radius + 3, 0, Math.PI * 2);
        c.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${pulse * 0.1})`;
        c.ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return { resize: () => { c.resize(); setup(); }, destroy: () => cancelAnimationFrame(raf) };
  }

  // --- Agent Chain (AI & LLM Agents) ---
  function agentsAnim(card) {
    const c = initCanvas(card);
    if (!c) return;
    const color = { r: 209, g: 228, b: 250 };
    const nodes = [];
    const particles = [];

    function setup() {
      nodes.length = 0;
      particles.length = 0;
      const w = c.w(), h = c.h();
      const count = 7;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        const rx = w * 0.32, ry = h * 0.32;
        nodes.push({
          x: w / 2 + Math.cos(angle) * rx,
          y: h / 2 + Math.sin(angle) * ry,
          angle,
          idx: i,
          pulse: 0
        });
      }
      // add center hub
      nodes.push({ x: w / 2, y: h / 2, angle: 0, idx: -1, pulse: 0 });
    }
    setup();

    let raf, lastSpawn = 0;
    function draw(t) {
      const w = c.w(), h = c.h();
      c.ctx.clearRect(0, 0, w, h);
      const hub = nodes[nodes.length - 1];

      // connections from hub to outer nodes
      for (let i = 0; i < nodes.length - 1; i++) {
        const n = nodes[i];
        const wave = (Math.sin(t * 0.002 + i * 0.9) + 1) / 2;
        c.ctx.beginPath();
        // curved connection through hub
        const cp1x = hub.x + (n.x - hub.x) * 0.3;
        const cp1y = hub.y + (n.y - hub.y) * 0.1;
        c.ctx.moveTo(hub.x, hub.y);
        c.ctx.quadraticCurveTo(cp1x, cp1y, n.x, n.y);
        c.ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${0.15 + wave * 0.25})`;
        c.ctx.lineWidth = 0.5 + wave * 0.5;
        c.ctx.stroke();
      }

      // outer ring connections
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i];
        const b = nodes[(i + 1) % (nodes.length - 1)];
        const wave = (Math.sin(t * 0.0015 + i * 1.2) + 1) / 2;
        c.ctx.beginPath();
        c.ctx.moveTo(a.x, a.y);
        c.ctx.lineTo(b.x, b.y);
        c.ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${0.1 + wave * 0.18})`;
        c.ctx.lineWidth = 0.5;
        c.ctx.stroke();
      }

      // spawn traveling particles
      if (t - lastSpawn > 400) {
        const srcIdx = Math.floor(Math.random() * (nodes.length - 1));
        const src = nodes[srcIdx];
        const dstIdx = (srcIdx + 1 + Math.floor(Math.random() * (nodes.length - 2))) % (nodes.length - 1);
        const dst = nodes[dstIdx];
        particles.push({ sx: src.x, sy: src.y, dx: dst.x, dy: dst.y, t: 0, speed: 0.005 + Math.random() * 0.005, via: hub });
        lastSpawn = t;
      }

      // update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.t += p.speed;
        if (p.t >= 1) { particles.splice(i, 1); continue; }
        // two-leg path: src -> hub -> dst
        let px, py;
        if (p.t < 0.5) {
          const seg = p.t * 2;
          px = p.sx + (p.via.x - p.sx) * seg;
          py = p.sy + (p.via.y - p.sy) * seg;
        } else {
          const seg = (p.t - 0.5) * 2;
          px = p.via.x + (p.dx - p.via.x) * seg;
          py = p.via.y + (p.dy - p.via.y) * seg;
        }
        const alpha = Math.sin(p.t * Math.PI);
        c.ctx.beginPath();
        c.ctx.arc(px, py, 2, 0, Math.PI * 2);
        c.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha * 0.7})`;
        c.ctx.fill();
        // trail
        c.ctx.beginPath();
        c.ctx.arc(px, py, 4, 0, Math.PI * 2);
        c.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha * 0.15})`;
        c.ctx.fill();
      }

      // draw nodes
      nodes.forEach((n, i) => {
        const isHub = i === nodes.length - 1;
        const pulse = (Math.sin(t * 0.003 + i * 0.8) + 1) / 2;
        const r = isHub ? 4 : 2.5 + pulse;
        c.ctx.beginPath();
        c.ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        c.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${isHub ? 0.7 : 0.4 + pulse * 0.5})`;
        c.ctx.fill();
        if (isHub) {
          c.ctx.beginPath();
          c.ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2);
          c.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${0.08 + pulse * 0.12})`;
          c.ctx.fill();
        }
      });

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return { resize: () => { c.resize(); setup(); }, destroy: () => cancelAnimationFrame(raf) };
  }

  // --- Data Pipeline (Data Engineering) ---
  function pipelineAnim(card) {
    const c = initCanvas(card);
    if (!c) return;
    const color = { r: 52, g: 211, b: 153 };
    const streams = [];
    const particles = [];

    function setup() {
      streams.length = 0;
      particles.length = 0;
      const w = c.w(), h = c.h();
      const count = 5;
      for (let i = 0; i < count; i++) {
        const y = h * (0.15 + (i / (count - 1)) * 0.7);
        const amp = 8 + Math.random() * 12;
        const freq = 0.008 + Math.random() * 0.006;
        const phase = Math.random() * Math.PI * 2;
        streams.push({ y, amp, freq, phase, speed: 0.3 + Math.random() * 0.4 });
      }
    }
    setup();

    let raf;
    function draw(t) {
      const w = c.w(), h = c.h();
      c.ctx.clearRect(0, 0, w, h);

      // draw flowing streams
      streams.forEach((s, si) => {
        c.ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y = s.y + Math.sin(x * s.freq + t * 0.001 * s.speed + s.phase) * s.amp;
          if (x === 0) c.ctx.moveTo(x, y);
          else c.ctx.lineTo(x, y);
        }
        c.ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},0.2)`;
        c.ctx.lineWidth = 1.2;
        c.ctx.stroke();

        // data packets flowing along each stream
        const packetCount = 3;
        for (let p = 0; p < packetCount; p++) {
          const px = ((t * s.speed * 0.5 + p * (w / packetCount)) % (w + 20)) - 10;
          const py = s.y + Math.sin(px * s.freq + t * 0.001 * s.speed + s.phase) * s.amp;
          const alpha = Math.sin((px / w) * Math.PI) * 0.8;
          if (alpha <= 0) continue;
          // packet glow
          c.ctx.beginPath();
          c.ctx.arc(px, py, 5, 0, Math.PI * 2);
          c.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha * 0.1})`;
          c.ctx.fill();
          // packet core
          c.ctx.beginPath();
          c.ctx.arc(px, py, 2, 0, Math.PI * 2);
          c.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha * 0.6})`;
          c.ctx.fill();
        }
      });

      // convergence point on the right
      const cx = w * 0.85, cy = h * 0.5;
      const pulse = (Math.sin(t * 0.003) + 1) / 2;
      c.ctx.beginPath();
      c.ctx.arc(cx, cy, 4 + pulse * 2, 0, Math.PI * 2);
      c.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${0.25 + pulse * 0.3})`;
      c.ctx.fill();
      c.ctx.beginPath();
      c.ctx.arc(cx, cy, 8 + pulse * 4, 0, Math.PI * 2);
      c.ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${0.06 + pulse * 0.08})`;
      c.ctx.fill();

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return { resize: () => { c.resize(); setup(); }, destroy: () => cancelAnimationFrame(raf) };
  }

  // --- Init all cards ---
  const animMap = { neural: neuralAnim, agents: agentsAnim, pipeline: pipelineAnim };
  const instances = [];

  cards.forEach(card => {
    const type = card.dataset.cardAnim;
    if (animMap[type]) instances.push(animMap[type](card));
  });

  window.addEventListener('resize', () => {
    instances.forEach(inst => { if (inst && inst.resize) inst.resize(); });
  });
})();
