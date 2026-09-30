"use strict";
(() => {
  const cards = document.querySelectorAll('#program-title, .initiative, .site-footer');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12 });
  cards.forEach(card => { card.classList.add('has-motion'); observer.observe(card); });
})();
