/**
 * Custom canvas particle system for the hero background.
 * Renders floating particles with connecting lines on #particle-canvas.
 * Respects prefers-reduced-motion and pauses when the tab is hidden.
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let particles = [];
  let animationId = null;
  let paused = false;

  const CONNECT_DISTANCE = 150;
  const LINE_MAX_OPACITY = 0.15;
  const PARTICLE_COLOR = '34, 211, 238'; // #22d3ee in RGB

  // ── Resize canvas to fill parent ─────────────────────────────────
  const resizeCanvas = () => {
    canvas.width = canvas.parentElement ? canvas.parentElement.offsetWidth : window.innerWidth;
    canvas.height = canvas.parentElement ? canvas.parentElement.offsetHeight : window.innerHeight;
  };

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvas();
      initParticles();
      if (reducedMotion) drawStatic();
    }, 200);
  });

  // ── Particle class ───────────────────────────────────────────────
  class Particle {
    constructor(w, h) {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.6;
      this.vy = (Math.random() - 0.5) * 0.6;
      this.radius = Math.random() * 2 + 1;
      this.opacity = Math.random() * 0.4 + 0.1;
    }

    update(w, h) {
      this.x = (this.x + this.vx + w) % w;
      this.y = (this.y + this.vy + h) % h;
    }

    draw(context) {
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.fillStyle = 'rgba(' + PARTICLE_COLOR + ', ' + this.opacity + ')';
      context.fill();
    }
  }

  // ── Initialize particles ─────────────────────────────────────────
  const initParticles = () => {
    let count;
    if (reducedMotion) {
      count = 20;
    } else {
      count = window.innerWidth >= 768 ? 70 : 35;
    }

    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }
  };

  // ── Draw connecting lines ────────────────────────────────────────
  const drawLines = () => {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECT_DISTANCE) {
          const opacity = LINE_MAX_OPACITY * (1 - dist / CONNECT_DISTANCE);
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(' + PARTICLE_COLOR + ', ' + opacity + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  };

  // ── Animation loop ───────────────────────────────────────────────
  const animate = () => {
    if (paused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.update(canvas.width, canvas.height);
      p.draw(ctx);
    });

    drawLines();
    animationId = requestAnimationFrame(animate);
  };

  // ── Static draw for reduced motion ───────────────────────────────
  const drawStatic = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => p.draw(ctx));
    drawLines();
  };

  // ── Visibility change: pause/resume ──────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (reducedMotion) return;

    if (document.hidden) {
      paused = true;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    } else {
      paused = false;
      animate();
    }
  });

  // ── Bootstrap ────────────────────────────────────────────────────
  resizeCanvas();
  initParticles();

  if (reducedMotion) {
    drawStatic();
  } else {
    animate();
  }
});
