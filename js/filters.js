/**
 * Category filtering for skills and projects sections.
 * Toggles visibility of cards based on the selected category tab/button.
 * Maintains section height to prevent parallax/scroll breakage.
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /**
   * Capture the natural height of a grid when all items are visible,
   * then set it as min-height so the section never collapses on filter.
   */
  function lockGridHeight(grid) {
    if (!grid || grid.dataset.heightLocked) return;
    grid.style.minHeight = grid.offsetHeight + 'px';
    grid.dataset.heightLocked = 'true';
  }

  /**
   * Clear GSAP inline styles from a card so CSS takes over cleanly.
   */
  function clearCardStyles(card) {
    if (typeof gsap !== 'undefined') {
      gsap.set(card, { clearProps: 'opacity,transform' });
    }
  }

  // No ScrollTrigger.refresh() needed — section heights are preserved
  // via min-height, so scroll positions remain stable.

  // ── Skill tabs filtering ─────────────────────────────────────────
  const skillTabs = document.querySelector('.skill-tabs');

  if (skillTabs) {
    const skillButtons = skillTabs.querySelectorAll('button');
    const skillCards = document.querySelectorAll('.skill-card');
    const skillsGrid = document.querySelector('.skills-grid');

    // Lock height on first filter interaction
    let skillsHeightLocked = false;

    skillTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const category = btn.getAttribute('data-category');

      // Lock the grid height on first filter click
      if (!skillsHeightLocked) {
        lockGridHeight(skillsGrid);
        skillsHeightLocked = true;
      }

      // Update active button
      skillButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter skill cards
      skillCards.forEach((card) => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
          card.removeAttribute('data-visible');
          clearCardStyles(card);
        } else {
          card.setAttribute('data-visible', 'false');
        }
      });

      // No refresh needed — min-height keeps page height stable
    });
  }

  // ── Project filters ──────────────────────────────────────────────
  const filterButtons = document.querySelector('.filter-buttons');

  if (filterButtons) {
    const projectButtons = filterButtons.querySelectorAll('button');
    const projectCards = document.querySelectorAll('.project-card');
    const projectsGrid = document.querySelector('.projects-grid');

    // Lock height on first filter interaction
    let projectsHeightLocked = false;

    filterButtons.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const filter = btn.getAttribute('data-filter');

      // Lock the grid height on first filter click
      if (!projectsHeightLocked) {
        lockGridHeight(projectsGrid);
        projectsHeightLocked = true;
      }

      // Update active button
      projectButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter project cards
      projectCards.forEach((card) => {
        const cardCategory = card.getAttribute('data-category');
        if (filter === 'all' || cardCategory === filter) {
          card.removeAttribute('data-visible');
          clearCardStyles(card);
        } else {
          card.setAttribute('data-visible', 'false');
        }
      });

      // No refresh needed — min-height keeps page height stable
    });
  }
});
