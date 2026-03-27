/**
 * Minimal script for project detail pages.
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Smooth scroll for anchor links
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const targetEl = document.querySelector(anchor.getAttribute('href'));
    if (targetEl) {
      e.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
