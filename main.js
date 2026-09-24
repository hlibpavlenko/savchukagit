(function () {
  'use strict';
  var backdrop  = document.getElementById('modalBackdrop');
  var closeBtn  = document.getElementById('modalClose');
  var modalTag  = document.getElementById('modalTag');
  var modalTtl  = document.getElementById('modalTitle');
  var modalBody = document.getElementById('modalBody');
  var lastFocus = null;

  function openModal(title, tag, text) {
    lastFocus = document.activeElement;
    modalTtl.textContent  = title;
    modalTag.textContent  = tag;
    modalBody.textContent = text;
    backdrop.classList.remove('is-open');
    void backdrop.offsetWidth;
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) { lastFocus.focus(); }
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-modal-title]');
    if (trigger) {
      openModal(trigger.dataset.modalTitle, trigger.dataset.modalTag, trigger.dataset.modalText);
    }
  });

  closeBtn.addEventListener('click', closeModal);

  backdrop.addEventListener('click', function (e) {
    if (e.target === backdrop) { closeModal(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && backdrop.classList.contains('is-open')) { closeModal(); }
  });

  window.openModal  = openModal;
  window.closeModal = closeModal;

  var targets  = Array.prototype.slice.call(document.querySelectorAll('section[id], footer[id]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.main-nav__link'));
  var topBtn   = document.getElementById('scrollTopBtn');
  var ticking  = false;


  function navOffset() {
    var nav = document.querySelector('.main-nav');
    return (nav ? nav.offsetHeight : 64) + 24;
  }

  function update() {
    ticking = false;
    var y       = window.scrollY || document.documentElement.scrollTop;
    var offset  = navOffset();
    var atEnd   = y + window.innerHeight >= document.documentElement.scrollHeight - 2;
    var current = targets.length ? targets[0].id : '';

    if (atEnd) {
      current = targets[targets.length - 1].id;
    } else {
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].getBoundingClientRect().top - offset <= 0) { current = targets[i].id; }
      }
    }

    navLinks.forEach(function (link) {
      if (link.getAttribute('href') === '#' + current) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    topBtn.classList.toggle('is-visible', y > 300);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  topBtn.addEventListener('click', function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
})();
