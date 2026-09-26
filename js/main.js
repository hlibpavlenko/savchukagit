"use strict";

// Highlight the last section whose heading has passed the top reading margin.
const navigationLinks = [...document.querySelectorAll(".main-nav__link")];
const sections = navigationLinks.map(link => document.querySelector(link.hash)).filter(Boolean);
let updatePending = false;

function updateNavigation() {
  updatePending = false;
  let current = null;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 80) current = section.id;
  }
  if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
    current = sections.at(-1)?.id;
  }
  for (const link of navigationLinks) {
    if (link.hash === `#${current}`) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}

function scheduleUpdate() {
  if (!updatePending) {
    updatePending = true;
    window.requestAnimationFrame(updateNavigation);
  }
}

window.addEventListener("scroll", scheduleUpdate, { passive: true });
window.addEventListener("resize", scheduleUpdate);
window.addEventListener("pageshow", scheduleUpdate);
updateNavigation();

// Content and order remain in HTML; JavaScript handles only interactions.
const track = document.querySelector('.team-track');
const controls = [...document.querySelectorAll('[data-direction]')];
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function moveTrack(direction) {
  const distance = track.querySelector('.member').getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
  track.scrollBy({ left: direction * distance, behavior: reducedMotion() ? 'instant' : 'smooth' });
}
function updateControls() {
  controls.forEach(button => {
    button.disabled = Number(button.dataset.direction) < 0 ? track.scrollLeft <= 2 : track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  });
}
controls.forEach(button => button.addEventListener('click', () => moveTrack(Number(button.dataset.direction))));
track.addEventListener('keydown', event => {
  if (event.target !== track) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault(); moveTrack(event.key === 'ArrowRight' ? 1 : -1);
  }
});
track.addEventListener('scroll', updateControls, { passive: true });
window.addEventListener('resize', updateControls);
updateControls();
let drag = null;
track.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('button,a')) return;
  drag = { id: event.pointerId, x: event.clientX, left: track.scrollLeft };
  track.setPointerCapture(event.pointerId);
});
track.addEventListener('pointermove', event => {
  if (!drag) return;
  if (Math.abs(event.clientX - drag.x) > 5) track.classList.add('is-dragging');
  track.scrollLeft = drag.left - (event.clientX - drag.x);
});
function endDrag() { drag = null; track.classList.remove('is-dragging'); }
track.addEventListener('pointerup', endDrag);
track.addEventListener('pointercancel', endDrag);
track.addEventListener('lostpointercapture', endDrag);
track.addEventListener('dragstart', event => event.preventDefault());

const dialog = document.querySelector('#modalBackdrop');
const closeButton = document.querySelector('#modalClose');
const modalImage = document.querySelector('#modalImage');
let returnFocus = null;
let previousOverflow = '';
function openModal(title, tag, text, image) {
  if (!dialog.open) {
    returnFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
  }
  document.querySelector('#modalTitle').textContent = title;
  document.querySelector('#modalTag').textContent = tag || 'СКЛАД ПАРЛАМЕНТУ';
  document.querySelector('#modalBody').textContent = text;
  modalImage.hidden = !image;
  if (image) {
    modalImage.src = image;
    modalImage.alt = `Фото до опису: ${title}`;
  } else {
    modalImage.removeAttribute('src'); modalImage.alt = '';
  }
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  closeButton.focus();
}
function closeModal() { if (dialog.open) dialog.close(); }
document.querySelectorAll('[data-member]').forEach(button => {
  button.addEventListener('click', () => {
    const card = button.closest('.member');
    const detail = card.querySelector('template');
    openModal(card.querySelector('h3').textContent, '', detail.content.textContent, detail.dataset.image);
  });
});
closeButton.addEventListener('click', closeModal);
dialog.addEventListener('close', () => {
  document.body.style.overflow = previousOverflow;
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
});
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) closeModal();
});
dialog.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const elements = [...dialog.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
  const first = elements[0], last = elements.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
window.openModal = openModal;
window.closeModal = closeModal;
