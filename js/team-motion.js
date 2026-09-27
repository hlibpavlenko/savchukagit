"use strict";

// A one-shot entrance, then intersection-driven portrait reveals.
// No scroll locking, libraries, network dependencies or permanent frame loop.
(() => {
  const section = document.querySelector('#team');
  const row = section?.querySelector('.team-track');
  const heading = section?.querySelector('.team-heading');
  const members = [...(row?.querySelectorAll('.member') || [])];
  if (!section || !row || !heading || !members.length || !('IntersectionObserver' in window)) return;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches) return;

  const intro = document.createElement('div');
  intro.className = 'team-intro';
  intro.setAttribute('aria-hidden', 'true');
  intro.innerHTML = '<div class="team-intro__bubbles"></div><div class="team-intro__center"><p class="team-intro__title">СКЛАД ПАРЛАМЕНТУ</p><span class="team-intro__count">0</span><p class="team-intro__caption">УЧАСНИКІВ</p></div><canvas class="team-particles"></canvas>';
  section.prepend(intro);
  const status = document.createElement('p');
  status.className = 'team-status';
  status.setAttribute('role','status');
  section.append(status);
  const counter = intro.querySelector('.team-intro__count');
  const bubbles = intro.querySelector('.team-intro__bubbles');
  const canvas = intro.querySelector('canvas');
  let stage = 'waiting';
  let frame = 0;
  let startedAt = 0;
  let particleStart = 0;
  let particles = [];
  let context = null;
  let failSafe = 0;
  let scrollFrame = 0;

  function setStage(next) { stage = next; section.dataset.teamStage = next; }
  function populateBubbles() {
    members.forEach((card, i) => {
      const angle = (i / members.length) * Math.PI * 2 - Math.PI / 2;
      const bubble = document.createElement('div');
      bubble.className = 'team-bubble';
      bubble.style.setProperty('--x', `${50 + Math.cos(angle) * 42}%`);
      bubble.style.setProperty('--y', `${50 + Math.sin(angle) * 41}%`);
      bubble.style.setProperty('--dx', `${Math.cos(angle) * 55}px`);
      bubble.style.setProperty('--dy', `${Math.sin(angle) * 55}px`);
      bubble.style.setProperty('--delay', `${i * 45}ms`);
      const initials = document.createElement('span');
      initials.textContent = card.querySelector('h3').textContent.trim().split(/\s+/).map(word => word[0]).join('');
      bubble.append(initials);
      const portrait = card.querySelector('.member__photo img');
      if (portrait) {
        const image = document.createElement('img');
        image.alt = '';
        image.decoding = 'async';
        image.src = portrait.getAttribute('src');
        image.style.objectPosition = portrait.style.objectPosition;
        bubble.append(image);
      }
      bubbles.append(bubble);
    });
  }

  // Sample the actual count glyphs and disperse only a small subset of pixels.
  function prepareParticles() {
    const bounds = intro.getBoundingClientRect();
    const glyph = counter.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(bounds.width * pixelRatio);
    canvas.height = Math.round(bounds.height * pixelRatio);
    context = canvas.getContext('2d');
    if (!context) return;
    context.scale(pixelRatio, pixelRatio);
    const sample = document.createElement('canvas');
    sample.width = Math.ceil(glyph.width);
    sample.height = Math.ceil(glyph.height);
    const ink = sample.getContext('2d', { willReadFrequently: true });
    if (!ink) return;
    const style = getComputedStyle(counter);
    ink.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ink.textAlign = 'center';
    ink.textBaseline = 'middle';
    ink.fillText(String(members.length), sample.width / 2, sample.height / 2);
    const pixels = ink.getImageData(0,0,sample.width,sample.height).data;
    const candidates = [];
    for (let y=0; y<sample.height; y+=5) {
      for (let x=0; x<sample.width; x+=5) {
        if (pixels[(y*sample.width+x)*4+3] > 120) candidates.push({x:x+glyph.left-bounds.left,y:y+glyph.top-bounds.top});
      }
    }
    const limit = window.innerWidth < 600 ? 70 : 130;
    const stride = Math.max(1, Math.ceil(candidates.length / limit));
    particles = candidates.filter((_,i)=>i%stride===0).map((point,i)=>({
      ...point, vx: Math.sin(i*2.399)*110, vy: Math.cos(i*2.399)*75-25, size:2+i%3
    }));
    section.dataset.particleCount = String(particles.length);
  }

  function drawParticles(elapsed) {
    if (!context) return;
    const progress = Math.min(1, elapsed/1050);
    context.clearRect(0,0,canvas.width,canvas.height);
    context.fillStyle = '#0c0d0e';
    context.globalAlpha = (1-progress)**1.3;
    for (const dot of particles) {
      const x = dot.x + dot.vx*progress;
      const y = dot.y + dot.vy*progress + 55*progress*progress;
      context.fillRect(x,y,dot.size*(1-progress*.65),dot.size*(1-progress*.65));
    }
  }

  function complete() {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(scrollFrame);
    clearTimeout(failSafe);
    if (stage === 'ready') return;
    setStage('ready');
    row.inert = false;
    heading.inert = false;
    status.textContent = `${members.length} учасників парламенту. Склад доступний для перегляду.`;
    trigger.disconnect();
    window.removeEventListener('scroll', scheduleEntrance);
    document.removeEventListener('visibilitychange', visibilityChanged);
    // Free the canvas backing store after the last frame; CSS fades the overlay.
    canvas.width = 0;
    canvas.height = 0;
    particles = [];
    bubbles.replaceChildren();
  }

  function tick(now) {
    if (!startedAt) startedAt = now;
    const elapsed = now-startedAt;
    const progress = Math.min(1,elapsed/1450);
    counter.textContent = String(Math.round(members.length*(1-(1-progress)**2)));
    if (elapsed >= 1600 && stage === 'counting') setStage('portraits');
    if (elapsed >= 2650 && stage === 'portraits') {
      counter.textContent = String(members.length);
      prepareParticles();
      particleStart = now;
      setStage('burst');
    }
    if (stage === 'burst') drawParticles(now-particleStart);
    if (elapsed >= 3750) { complete(); return; }
    frame = requestAnimationFrame(tick);
  }

  function checkEntrance() {
    scrollFrame = 0;
    if (stage !== 'waiting') return;
    const bounds = heading.getBoundingClientRect();
    if ((window.scrollY > 0 || location.hash === '#team') && bounds.top < window.innerHeight*.75 && bounds.bottom > 0) {
      if (preference.matches) { complete(); return; }
      populateBubbles();
      setStage('counting');
      failSafe = setTimeout(complete,5000);
      frame = requestAnimationFrame(tick);
    }
  }
  function scheduleEntrance() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(checkEntrance);
  }
  function visibilityChanged() { if (document.hidden && stage !== 'waiting') complete(); }
  const trigger = new IntersectionObserver(entries => {
    if (entries.some(entry=>entry.isIntersecting)) checkEntrance();
    else if (stage !== 'waiting' && stage !== 'ready') complete();
  }, { threshold: 0, rootMargin:'0px 0px -10% 0px' });

  // The row itself is the clipping root, so photographs reveal from either side.
  const photoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.style.setProperty('--reveal-x', entry.boundingClientRect.left < (entry.rootBounds?.left || 0) ? '-24px' : '24px');
      entry.target.classList.toggle('is-photo-visible',entry.isIntersecting);
    });
  }, { root:row, threshold:.12 });
  members.forEach(member=>photoObserver.observe(member));
  row.classList.add('has-photo-reveals');
  section.classList.add('is-team-animated');
  row.inert = true;
  heading.inert = true;
  setStage('waiting');
  trigger.observe(heading);
  window.addEventListener('scroll',scheduleEntrance,{passive:true});
  document.addEventListener('visibilitychange',visibilityChanged);
  preference.addEventListener('change',event => {
    if (event.matches) {
      complete();
      photoObserver.disconnect();
      row.classList.remove('has-photo-reveals');
    }
  });
  window.addEventListener('beforeprint',complete);
  checkEntrance();
})();
