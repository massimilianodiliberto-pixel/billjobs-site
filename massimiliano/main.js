'use strict';

/* ── Nav scroll state ──────────────────────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 80);
}, { passive: true });

/* ── Scroll indicator ──────────────────────────────────────── */
const scrollEl = document.getElementById('scrollIndicator');
if (scrollEl) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) scrollEl.classList.add('hidden');
  }, { passive: true, once: true });
}

/* ── Mobile menu ───────────────────────────────────────────── */
const burger     = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');

function openMenu() {
  mobileMenu.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}

if (burger)     burger.addEventListener('click', openMenu);
if (mobileClose) mobileClose.addEventListener('click', closeMenu);

// Close on link tap
document.querySelectorAll('[data-close]').forEach(link => {
  link.addEventListener('click', closeMenu);
});

/* ── Smooth anchor scroll ──────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
