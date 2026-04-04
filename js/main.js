/**
 * Main functionality for portfolio website.
 * Handles navbar, scroll progress, navigation, mobile menu,
 * stat counters, smooth scroll, and back-to-top button.
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const navbar = document.getElementById('navbar');
  const scrollProgress = document.getElementById('scroll-progress');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  const backToTop = document.querySelector('.back-to-top');

  // ── Navbar scroll & scroll progress bar ──────────────────────────
  const handleScroll = () => {
    const scrollY = window.scrollY;

    // Navbar background on scroll
    if (navbar) {
      if (scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    // Scroll progress bar
    if (scrollProgress) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      scrollProgress.style.width = percentage + '%';
    }

    // Back-to-top visibility
    if (backToTop) {
      if (scrollY > 500) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  // ── Active nav link via IntersectionObserver ──────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinkAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  if (sections.length > 0 && navLinkAnchors.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('id');
            navLinkAnchors.forEach((link) => {
              link.classList.remove('active');
              if (link.getAttribute('href') === '#' + sectionId) {
                link.classList.add('active');
              }
            });
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  // ── Mobile menu ──────────────────────────────────────────────────
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });

    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
      }
    });
  }

  // ── Stat counter animation ───────────────────────────────────────
  const statNumbers = document.querySelectorAll('.stat-number');

  if (statNumbers.length > 0) {
    const animateCounter = (el) => {
      const target = parseFloat(el.getAttribute('data-target'));
      const isDecimal = String(target).includes('.');
      const duration = 2000;
      let startTime = null;

      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;

        el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = isDecimal ? target.toFixed(1) : target;
        }
      };

      requestAnimationFrame(step);
    };

    const statObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    statNumbers.forEach((num) => statObserver.observe(num));
  }

  // ── Smooth scroll (event delegation) ─────────────────────────────
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href');
    if (targetId === '#') return;

    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      e.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // ── Back-to-top button ───────────────────────────────────────────
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Contact form (Web3Forms) ─────────────────────────────────────
  const contactForm = document.getElementById('contact-form');
  const contactSubmit = document.getElementById('contact-submit');
  const formStatus = document.getElementById('form-status');

  if (contactForm && contactSubmit && formStatus) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      contactSubmit.disabled = true;
      contactSubmit.querySelector('span').textContent = 'Sending...';
      formStatus.className = 'form-status';
      formStatus.textContent = '';

      try {
        const res = await fetch(contactForm.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
        });

        const data = await res.json();

        if (data.success) {
          formStatus.className = 'form-status form-status--success';
          formStatus.textContent = 'Message sent successfully! I\'ll get back to you soon.';
          contactForm.reset();
        } else {
          formStatus.className = 'form-status form-status--error';
          formStatus.textContent = data.message || 'Something went wrong. Please try again.';
        }
      } catch {
        formStatus.className = 'form-status form-status--error';
        formStatus.textContent = 'Network error. Please try again or email me directly.';
      } finally {
        contactSubmit.disabled = false;
        contactSubmit.querySelector('span').textContent = 'Send Message';
      }
    });
  }

  // Fire once on load to set initial state
  handleScroll();

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
