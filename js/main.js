(function () {
  'use strict';

  /* Content updates requested by the team. Keeping these here makes the page
     resilient when the card list is edited in the HTML later. */
  var members = Array.prototype.slice.call(document.querySelectorAll('.member'));

  function cardByName(name) {
    return members.find(function (card) {
      var title = card.querySelector('.member__name');
      return title && title.textContent.trim() === name;
    });
  }

  function setCard(card, data) {
    if (!card) return;
    var image = card.querySelector('.member__photo img');
    var tag = card.querySelector('.badge');
    var title = card.querySelector('.member__name');
    var note = card.querySelector('.member__note');
    var button = card.querySelector('[data-modal-title]');

    if (image && data.image) image.src = data.image;
    if (image && data.alt) image.alt = data.alt;
    if (image && data.position) image.style.objectPosition = data.position;
    if (tag && data.tag) tag.textContent = data.tag;
    if (title && data.name) title.textContent = data.name;
    if (note && data.note) note.textContent = data.note;
    if (button) {
      button.dataset.modalTitle = data.name;
      button.dataset.modalTag = data.tag;
      button.dataset.modalText = data.detail;
    }
  }

  var varvara = cardByName('Вінтер Варвара');
  setCard(varvara, {
    name: 'Вінтер Варвара',
    tag: 'Посада 11',
    alt: 'Вінтер Варвара',
    note: 'Ціную творчість, спілкування та нові можливості. Люблю брати участь у шкільному житті та робити його яскравішим.',
    detail: 'Люблю креативність, брати участь у шкільних заходах та допомагати у створенні незабутніх моментів для всіх. Вважаю, що прагнення дізнаватись чогось нового та втілення ідей робить життя цікавішим та насиченішим.'
  });

  var arina = cardByName('Болдирєва Аріна');
  if (arina) {
    var arinaImage = arina.querySelector('.member__photo img');
    if (arinaImage) arinaImage.style.objectPosition = 'center 25%';
  }

  /* Remove the second Yana card and turn its place into Kochерга's card. */
  var yanaCards = members.filter(function (card) {
    var title = card.querySelector('.member__name');
    return title && title.textContent.trim() === 'Савчук Яна';
  });
  if (yanaCards.length > 1) {
    setCard(yanaCards[1], {
      name: 'Кочерга Олександра',
      tag: 'Посада 6',
      alt: 'Кочерга Олександра',
      image: 'images/IMG_9593.png',
      position: 'center 30%',
      note: 'Цілеспрямована, енергійна та креативна. Люблю працювати в команді, знаходити нові ідеї та брати участь у цікавих проєктах. Завжди прагну розвиватися й пробувати щось нове.',
      detail: 'Цілеспрямована, енергійна та креативна. Люблю працювати в команді, знаходити нові ідеї та брати участь у цікавих проєктах. Завжди прагну розвиватися й пробувати щось нове.'
    });
  }

  /* Brighter, more positive palette while retaining good contrast. */
  var palette = document.createElement('style');
  palette.textContent = ':root{--paper:#fffaf7;--white:#ffffff;--ink:#24213a;--ink-surface:#302b4f;--red:#ff4f70;--red-hover:#e63d60;--line:rgba(36,33,58,.12);--line-strong:rgba(36,33,58,.2);--muted:#65627a;--muted-dark:#c9c6d8} .notice__stripe{background:repeating-linear-gradient(135deg,#ff4f70 0 10px,#ffd166 10px 20px,#62d6c7 20px 30px,#ffffff 30px 40px)} .main-nav{box-shadow:inset 0 -3px 0 #ff4f70,0 6px 20px rgba(36,33,58,.14)} .section-heading::after,.page-head__rule{background:#ff4f70;border-color:#ff4f70} .program{border-left-color:#ff4f70} .site-footer{border-top-color:#ff4f70}';
  document.head.appendChild(palette);

  var backdrop = document.getElementById('modalBackdrop');
  var closeBtn = document.getElementById('modalClose');
  var modalTag = document.getElementById('modalTag');
  var modalTtl = document.getElementById('modalTitle');
  var modalBody = document.getElementById('modalBody');
  var lastFocus = null;

  function openModal(title, tag, text) {
    lastFocus = document.activeElement;
    modalTtl.textContent = title;
    modalTag.textContent = tag;
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
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-modal-title]');
    if (trigger) openModal(trigger.dataset.modalTitle, trigger.dataset.modalTag, trigger.dataset.modalText);
  });
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', function (e) {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && backdrop.classList.contains('is-open')) closeModal();
  });

  window.openModal = openModal;
  window.closeModal = closeModal;

  var targets = Array.prototype.slice.call(document.querySelectorAll('section[id], footer[id]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.main-nav__link'));
  var topBtn = document.getElementById('scrollTopBtn');
  var ticking = false;

  function navOffset() {
    var nav = document.querySelector('.main-nav');
    return (nav ? nav.offsetHeight : 64) + 24;
  }

  function update() {
    ticking = false;
    var y = window.scrollY || document.documentElement.scrollTop;
    var offset = navOffset();
    var atEnd = y + window.innerHeight >= document.documentElement.scrollHeight - 2;
    var current = targets.length ? targets[0].id : '';
    if (atEnd) current = targets[targets.length - 1].id;
    else {
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].getBoundingClientRect().top - offset <= 0) current = targets[i].id;
      }
    }
    navLinks.forEach(function (link) {
      if (link.getAttribute('href') === '#' + current) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
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
