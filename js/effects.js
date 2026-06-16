/**
 * AuthKit-inspired interactive effects.
 * Cursor spotlight, card tilt, magnetic buttons, and enhanced reveals.
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  // ── Cursor Spotlight ─────────────────────────────────────────────
  const spotlight = document.createElement('div');
  spotlight.classList.add('cursor-spotlight');
  document.body.appendChild(spotlight);

  let spotlightX = -300;
  let spotlightY = -300;
  let currentX = -300;
  let currentY = -300;

  document.addEventListener('mousemove', (e) => {
    spotlightX = e.clientX;
    spotlightY = e.clientY;
  }, { passive: true });

  function updateSpotlight() {
    currentX += (spotlightX - currentX) * 0.08;
    currentY += (spotlightY - currentY) * 0.08;
    spotlight.style.left = currentX + 'px';
    spotlight.style.top = currentY + 'px';
    requestAnimationFrame(updateSpotlight);
  }
  requestAnimationFrame(updateSpotlight);

  document.addEventListener('mouseleave', () => {
    spotlight.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    spotlight.style.opacity = '1';
  });

  // ── AI Neural Cursor Follower ────────────────────────────────────
  const follower = document.createElement('canvas');
  follower.width = 60;
  follower.height = 60;
  follower.style.cssText =
    'position:fixed;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);opacity:0;transition:opacity 0.4s ease;';
  document.body.appendChild(follower);
  const fCtx = follower.getContext('2d');

  let followerX = -100;
  let followerY = -100;
  let fCurX = -100;
  let fCurY = -100;
  let fTime = 0;

  const fNodes = [
    { ox: 0, oy: 0, r: 3 },
    { ox: -12, oy: -14, r: 2 },
    { ox: 14, oy: -10, r: 2 },
    { ox: 10, oy: 14, r: 1.5 },
    { ox: -14, oy: 10, r: 1.5 },
    { ox: -6, oy: -22, r: 1 },
    { ox: 20, oy: 6, r: 1 },
  ];
  const fEdges = [[0,1],[0,2],[0,3],[0,4],[1,2],[1,5],[2,6],[3,4]];

  function drawFollower() {
    fTime += 0.03;
    fCurX += (followerX - fCurX) * 0.12;
    fCurY += (followerY - fCurY) * 0.12;
    follower.style.left = fCurX + 'px';
    follower.style.top = fCurY + 'px';

    fCtx.clearRect(0, 0, 60, 60);
    const cx = 30, cy = 30;

    fEdges.forEach(function(e) {
      var a = fNodes[e[0]], b = fNodes[e[1]];
      var pulse = (Math.sin(fTime * 2 + e[0]) + 1) / 2;
      fCtx.beginPath();
      fCtx.moveTo(cx + a.ox, cy + a.oy);
      fCtx.lineTo(cx + b.ox, cy + b.oy);
      fCtx.strokeStyle = 'rgba(186,214,247,' + (0.15 + pulse * 0.25) + ')';
      fCtx.lineWidth = 0.5;
      fCtx.stroke();
    });

    fNodes.forEach(function(n, i) {
      var pulse = (Math.sin(fTime * 3 + i * 1.2) + 1) / 2;
      var wobbleX = Math.sin(fTime + i * 0.8) * 2;
      var wobbleY = Math.cos(fTime + i * 1.1) * 2;
      var nx = cx + n.ox + wobbleX;
      var ny = cy + n.oy + wobbleY;
      fCtx.beginPath();
      fCtx.arc(nx, ny, n.r + pulse, 0, Math.PI * 2);
      fCtx.fillStyle = 'rgba(186,214,247,' + (0.4 + pulse * 0.5) + ')';
      fCtx.fill();
      if (i === 0) {
        fCtx.beginPath();
        fCtx.arc(nx, ny, n.r + 5, 0, Math.PI * 2);
        fCtx.fillStyle = 'rgba(186,214,247,' + (pulse * 0.1) + ')';
        fCtx.fill();
      }
    });

    requestAnimationFrame(drawFollower);
  }
  requestAnimationFrame(drawFollower);

  document.addEventListener('mousemove', function(e) {
    followerX = e.clientX;
    followerY = e.clientY;
    follower.style.opacity = '0.8';
  }, { passive: true });

  document.addEventListener('mouseleave', function() {
    follower.style.opacity = '0';
  });

  // ── Card Tilt Effect ─────────────────────────────────────────────
  const tiltCards = document.querySelectorAll(
    '.project-card, .hero-card, .cert-card, .edu-card'
  );

  tiltCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;

      card.style.transform =
        'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });

  // ── Card Glow Follow ─────────────────────────────────────────────
  const glowCards = document.querySelectorAll('.project-card, .hero-card');

  glowCards.forEach((card) => {
    const glowEl = document.createElement('div');
    glowEl.style.cssText =
      'position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity 0.3s ease;z-index:1;';
    card.style.position = 'relative';
    card.appendChild(glowEl);

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      glowEl.style.opacity = '1';
      glowEl.style.background =
        'radial-gradient(300px circle at ' + x + 'px ' + y + 'px, rgba(186, 214, 247, 0.08), transparent 60%)';
    });

    card.addEventListener('mouseleave', () => {
      glowEl.style.opacity = '0';
    });
  });

  // ── Magnetic Button Hover ────────────────────────────────────────
  const magneticBtns = document.querySelectorAll('.btn-primary, .btn-outline');

  magneticBtns.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = 'translate(' + x * 0.15 + 'px, ' + y * 0.15 + 'px)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  // ── Stagger Reveal on Scroll ─────────────────────────────────────
  const staggerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const children = entry.target.querySelectorAll('[data-stagger]');
          children.forEach((child, i) => {
            child.style.animationDelay = (i * 0.08) + 's';
            child.classList.add('animate-fade-in-up');
          });
          staggerObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('[data-stagger-parent]').forEach((el) => {
    staggerObserver.observe(el);
  });

  // ── Section Parallax Glow Orbs ───────────────────────────────────
  const hero = document.querySelector('.hero');
  if (hero) {
    const orb1 = document.createElement('div');
    orb1.className = 'glow-orb glow-orb-1';
    orb1.style.cssText = 'top: 10%; left: 5%;';

    const orb2 = document.createElement('div');
    orb2.className = 'glow-orb glow-orb-2';
    orb2.style.cssText = 'top: 60%; right: 10%;';

    hero.appendChild(orb1);
    hero.appendChild(orb2);
  }

  // ── Venture section glow ─────────────────────────────────────────
  const venture = document.querySelector('.venture-section');
  if (venture) {
    const orb3 = document.createElement('div');
    orb3.className = 'glow-orb glow-orb-3';
    orb3.style.cssText = 'top: 20%; right: 15%;';
    venture.appendChild(orb3);
  }

  // ── Skills section glow ──────────────────────────────────────────
  const skillsSection = document.getElementById('skills');
  if (skillsSection) {
    const orb4 = document.createElement('div');
    orb4.className = 'glow-orb glow-orb-1';
    orb4.style.cssText = 'bottom: 10%; left: 10%; opacity: 0.25;';
    skillsSection.style.position = 'relative';
    skillsSection.style.overflow = 'hidden';
    skillsSection.appendChild(orb4);
  }
});
