/**
 * Custom typing animation for the hero section.
 * Types and deletes phrases in a continuous loop on #typed-output.
 * Respects prefers-reduced-motion by showing a static phrase.
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const output = document.getElementById('typed-output');
  if (!output) return;

  const phrases = [
    'build LLM Agent systems',
    'architect data pipelines',
    'lead AI engineering teams',
    'design RAG architectures',
    'deploy models to production'
  ];

  const TYPE_SPEED = 80;
  const DELETE_SPEED = 40;
  const PAUSE_AFTER_TYPING = 2000;

  // Reduced motion: show first phrase statically and stop
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    output.textContent = phrases[0];
    return;
  }

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const typeLoop = () => {
    const currentPhrase = phrases[phraseIndex];

    if (!isDeleting) {
      // Typing forward
      charIndex++;
      output.textContent = currentPhrase.substring(0, charIndex);

      if (charIndex === currentPhrase.length) {
        // Finished typing, pause then start deleting
        isDeleting = true;
        setTimeout(typeLoop, PAUSE_AFTER_TYPING);
        return;
      }

      setTimeout(typeLoop, TYPE_SPEED);
    } else {
      // Deleting backward
      charIndex--;
      output.textContent = currentPhrase.substring(0, charIndex);

      if (charIndex === 0) {
        // Finished deleting, move to next phrase
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(typeLoop, TYPE_SPEED);
        return;
      }

      setTimeout(typeLoop, DELETE_SPEED);
    }
  };

  typeLoop();
});
