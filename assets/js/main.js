/* ============================================================
   BILL JOBS PRODUCTION — Main JavaScript
   ============================================================ */

'use strict';

/* ── Custom Cursor ─────────────────────────────────────────── */

const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursorFollower');

let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;
let rafCursor;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});

(function animateCursor() {
  followerX += (mouseX - followerX) * 0.1;
  followerY += (mouseY - followerY) * 0.1;
  cursorFollower.style.left = followerX + 'px';
  cursorFollower.style.top  = followerY + 'px';
  rafCursor = requestAnimationFrame(animateCursor);
})();

/* ── Film Grain ────────────────────────────────────────────── */

const grainCanvas = document.getElementById('grain');
const grainCtx = grainCanvas.getContext('2d');
let grainAnimFrame;

function resizeGrain() {
  grainCanvas.width  = window.innerWidth;
  grainCanvas.height = window.innerHeight;
}

function renderGrain() {
  const w = grainCanvas.width;
  const h = grainCanvas.height;
  const imageData = grainCtx.createImageData(w, h);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    data[i]     = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }

  grainCtx.putImageData(imageData, 0, 0);
  grainAnimFrame = requestAnimationFrame(renderGrain);
}

resizeGrain();
renderGrain();
window.addEventListener('resize', resizeGrain);

/* ── Navigation: scroll state & mobile toggle ──────────────── */

const nav = document.getElementById('nav');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const spans = menuToggle.querySelectorAll('span');
  const isOpen = navLinks.classList.contains('open');
  spans[0].style.transform = isOpen ? 'rotate(45deg) translate(4px, 4px)' : '';
  spans[1].style.opacity   = isOpen ? '0' : '1';
  spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(4px, -4px)' : '';
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuToggle.querySelectorAll('span').forEach(s => {
      s.style.transform = '';
      s.style.opacity   = '';
    });
  });
});

/* ── Intersection Observer: reveal animations ──────────────── */

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal-up, .reveal-fade').forEach(el => {
  revealObserver.observe(el);
});

/* ── Animated counters ─────────────────────────────────────── */

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 2000;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat__number').forEach(el => {
  counterObserver.observe(el);
});

/* ── Smooth parallax hero on scroll ───────────────────────── */

const heroBg = document.querySelector('.hero__bg-gradient');

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  if (heroBg && scrolled < window.innerHeight) {
    heroBg.style.transform = `translateY(${scrolled * 0.3}px)`;
  }
}, { passive: true });

/* ── Contact form ──────────────────────────────────────────── */

const form = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    setTimeout(() => {
      form.reset();
      submitBtn.textContent = 'Send Inquiry';
      submitBtn.disabled = false;
      formSuccess.classList.add('visible');
      setTimeout(() => formSuccess.classList.remove('visible'), 6000);
    }, 1200);
  });
}

/* ── Smooth anchor scrolling ───────────────────────────────── */

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 80;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ── Rotate spinning badge ─────────────────────────────────── */

const reelBadge = document.querySelector('.hero__reel-badge');
if (reelBadge) {
  let currentRotation = 0;
  window.addEventListener('scroll', () => {
    currentRotation = window.scrollY * 0.15;
    reelBadge.style.transform = `rotate(${currentRotation}deg)`;
  }, { passive: true });
}

/* ── Work grid items: subtle parallax on mouse move ────────── */

document.querySelectorAll('.work__item').forEach(item => {
  item.addEventListener('mousemove', (e) => {
    const rect = item.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    const bg = item.querySelector('.work__item-bg');
    if (bg) {
      bg.style.transform = `scale(1.06) translate(${x * 8}px, ${y * 8}px)`;
    }
  });

  item.addEventListener('mouseleave', () => {
    const bg = item.querySelector('.work__item-bg');
    if (bg) {
      bg.style.transform = 'scale(1) translate(0, 0)';
      bg.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    }
  });

  item.addEventListener('mouseenter', () => {
    const bg = item.querySelector('.work__item-bg');
    if (bg) {
      bg.style.transition = 'transform 0.15s ease-out';
    }
  });
});
