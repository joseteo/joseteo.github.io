/**
 * GSAP ScrollTrigger animations for portfolio sections.
 * Gracefully exits if GSAP or ScrollTrigger is not loaded,
 * or if the user prefers reduced motion.
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  // ── Hero parallax ────────────────────────────────────────────────
  gsap.to('.hero-content', {
    y: 200,
    opacity: 0,
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });

  // ── Section headers: fade in from bottom ─────────────────────────
  gsap.utils.toArray('.section-header').forEach((header) => {
    gsap.from(header, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      scrollTrigger: {
        trigger: header,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });

  // ── Timeline items: alternate from left/right ────────────────────
  gsap.utils.toArray('.timeline-item').forEach((item, i) => {
    gsap.from(item, {
      x: i % 2 === 0 ? -80 : 80,
      opacity: 0,
      duration: 0.8,
      scrollTrigger: {
        trigger: item,
        start: 'top 85%'
      }
    });
  });

  // ── Skill cards: staggered entrance ──────────────────────────────
  gsap.utils.toArray('.skill-card').forEach((card, i) => {
    gsap.from(card, {
      y: 30,
      opacity: 0,
      duration: 0.5,
      delay: (i % 8) * 0.05,
      scrollTrigger: {
        trigger: card,
        start: 'top 90%'
      }
    });
  });

  // ── Skill bars: fill to data-level percentage ────────────────────
  gsap.utils.toArray('.skill-fill').forEach((bar) => {
    gsap.to(bar, {
      width: bar.dataset.level + '%',
      duration: 1.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: bar,
        start: 'top 90%'
      }
    });
  });

  // ── Project cards: staggered entrance ────────────────────────────
  gsap.utils.toArray('.project-card').forEach((card, i) => {
    gsap.from(card, {
      y: 40,
      opacity: 0,
      duration: 0.6,
      delay: (i % 3) * 0.15,
      scrollTrigger: {
        trigger: card,
        start: 'top 90%'
      }
    });
  });

  // ── Certification cards: staggered ───────────────────────────────
  gsap.utils.toArray('.cert-card').forEach((card, i) => {
    gsap.from(card, {
      y: 30,
      opacity: 0,
      duration: 0.5,
      delay: i * 0.1,
      scrollTrigger: {
        trigger: card,
        start: 'top 90%'
      }
    });
  });

  // ── Education cards ──────────────────────────────────────────────
  gsap.utils.toArray('.edu-card').forEach((card, i) => {
    gsap.from(card, {
      y: 30,
      opacity: 0,
      duration: 0.5,
      delay: i * 0.15,
      scrollTrigger: {
        trigger: card,
        start: 'top 90%'
      }
    });
  });

  // ── About section: photo and text slide in ───────────────────────
  gsap.from('.about-photo-wrapper', {
    x: -50,
    opacity: 0,
    duration: 0.8,
    scrollTrigger: {
      trigger: '.about-grid',
      start: 'top 80%'
    }
  });

  gsap.from('.about-text', {
    x: 50,
    opacity: 0,
    duration: 0.8,
    scrollTrigger: {
      trigger: '.about-grid',
      start: 'top 80%'
    }
  });

  // ── Stats row ────────────────────────────────────────────────────
  gsap.utils.toArray('.stat').forEach((stat, i) => {
    gsap.from(stat, {
      y: 20,
      opacity: 0,
      duration: 0.5,
      delay: i * 0.1,
      scrollTrigger: {
        trigger: '.stats-row',
        start: 'top 85%'
      }
    });
  });
});
