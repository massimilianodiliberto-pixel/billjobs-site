'use strict';

/* ── Lenis smooth scroll — cinematic pacing ────────────────── */
const lenis = new Lenis({
  duration: 1.6,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 0.75,
  touchMultiplier: 1.0,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

/* ── Page transition — reveal on load ─────────────────────── */
window.addEventListener('load', () => {
  gsap.to('#page-transition', {
    scaleY: 0,
    duration: 0.9,
    ease: 'power3.inOut',
    transformOrigin: 'top',
    delay: 0.05,
  });
});

/* ── Nav reveal ────────────────────────────────────────────── */
let navRevealed = false;
const navEl = document.querySelector('nav');

function revealNav() {
  if (!navRevealed && navEl) {
    gsap.to(navEl, { opacity: 1, duration: 0.8, ease: 'power2.out' });
    navEl.classList.add('visible');
    navRevealed = true;
  }
}

window.addEventListener('mousemove', revealNav, { once: true });
window.addEventListener('scroll',    revealNav, { once: true });
window.addEventListener('touchstart', revealNav, { once: true });

/* Nav scroll state */
window.addEventListener('scroll', () => {
  if (navEl) navEl.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── Mobile menu ───────────────────────────────────────────── */
const burger      = document.getElementById('navBurger');
const mobileMenu  = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');
const mobileLinks = document.querySelectorAll('[data-close]');

function openMenu() {
  if (!mobileMenu) return;
  mobileMenu.classList.add('open');
  document.body.style.overflow = 'hidden';
  lenis.stop();

  gsap.fromTo('.mobile-menu__link',
    { y: 32, opacity: 0 },
    { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: 'power3.out', delay: 0.12 }
  );
}

function closeMenu() {
  if (!mobileMenu) return;
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
  lenis.start();
}

if (burger)      burger.addEventListener('click', openMenu);
if (mobileClose) mobileClose.addEventListener('click', closeMenu);
mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

/* ── Page transitions on internal links ─────────────────────── */
const transition = document.getElementById('page-transition');

document.querySelectorAll('a[href]').forEach(link => {
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
  if (link.target === '_blank') return;

  link.addEventListener('click', e => {
    e.preventDefault();
    const dest = link.href;

    if (transition) {
      gsap.to(transition, {
        scaleY: 1,
        duration: 0.65,
        ease: 'power3.inOut',
        transformOrigin: 'bottom',
        onComplete: () => { window.location.href = dest; },
      });
    } else {
      window.location.href = dest;
    }
  });
});

/* ── [data-reveal] scroll animations — slow, cinematic ──────── */
if (document.querySelectorAll('[data-reveal]').length) {
  ScrollTrigger.batch('[data-reveal]', {
    onEnter: batch => {
      gsap.fromTo(batch,
        { opacity: 0, y: 44, filter: 'blur(4px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 1.2,
          ease: 'power3.out',
          stagger: 0.14,
          overwrite: 'auto',
        }
      );
    },
    start: 'top 88%',
  });
}

/* ── Hero media parallax (entry page only) ──────────────────── */
const heroMedia = document.querySelector('.entry-hero__media');
if (heroMedia) {
  gsap.to(heroMedia, {
    yPercent: 22,
    ease: 'none',
    scrollTrigger: {
      trigger: '.entry-hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 2.5,
    },
  });
}

/* ── Featured work items — subtle parallax on scroll ────────── */
document.querySelectorAll('.featured-work__media').forEach(media => {
  gsap.to(media, {
    yPercent: 8,
    ease: 'none',
    scrollTrigger: {
      trigger: media.closest('.featured-work__item'),
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.8,
    },
  });
});

/* ── Work grid media — parallax on scroll ───────────────────── */
document.querySelectorAll('.work-grid__media').forEach(media => {
  gsap.to(media, {
    yPercent: 10,
    ease: 'none',
    scrollTrigger: {
      trigger: media.closest('.work-grid__item'),
      start: 'top bottom',
      end: 'bottom top',
      scrub: 2,
    },
  });
});

/* ── Custom cursor ───────────────────────────────────────────── */
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');

if (cursor && cursorRing && window.matchMedia('(pointer: fine)').matches) {
  let mx = 0, my = 0;
  let rx = 0, ry = 0;

  window.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    gsap.to(cursor, { x: mx, y: my, duration: 0, overwrite: true });
  });

  gsap.ticker.add(() => {
    rx += (mx - rx) * 0.10;
    ry += (my - ry) * 0.10;
    gsap.set(cursorRing, { x: rx, y: ry });
  });

  document.querySelectorAll('a, button, [data-cursor-hover]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hover');
      cursorRing.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hover');
      cursorRing.classList.remove('hover');
    });
  });
}
