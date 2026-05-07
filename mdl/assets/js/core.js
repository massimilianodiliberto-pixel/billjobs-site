'use strict';

/* ── Lenis smooth scroll ───────────────────────────────────── */
const lenis = new Lenis({
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 0.8,
  touchMultiplier: 1.2,
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
    duration: 0.7,
    ease: 'power3.inOut',
    transformOrigin: 'top',
    delay: 0.1,
  });
});

/* ── Nav reveal ────────────────────────────────────────────── */
let navRevealed = false;
const navEl = document.querySelector('nav');

function revealNav() {
  if (!navRevealed && navEl) {
    navEl.classList.add('visible');
    navRevealed = true;
  }
}

window.addEventListener('mousemove', revealNav, { once: true });
window.addEventListener('scroll', revealNav, { once: true });
window.addEventListener('touchstart', revealNav, { once: true });

/* Nav scroll state */
window.addEventListener('scroll', () => {
  if (navEl) navEl.classList.toggle('scrolled', window.scrollY > 80);
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
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power2.out', delay: 0.15 }
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
        duration: 0.55,
        ease: 'power3.inOut',
        transformOrigin: 'bottom',
        onComplete: () => { window.location.href = dest; },
      });
    } else {
      window.location.href = dest;
    }
  });
});

/* ── [data-reveal] scroll animations ────────────────────────── */
const reveals = document.querySelectorAll('[data-reveal]');

if (reveals.length) {
  ScrollTrigger.batch('[data-reveal]', {
    onEnter: batch => {
      gsap.fromTo(batch,
        { opacity: 0, y: 36, x: 0 },
        { opacity: 1, y: 0, x: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, overwrite: 'auto' }
      );
    },
    start: 'top 88%',
  });
}

/* ── [data-reveal-clip] — text clip reveal ──────────────────── */
document.querySelectorAll('[data-reveal-clip]').forEach(el => {
  gsap.fromTo(el,
    { clipPath: 'inset(0 100% 0 0)' },
    {
      clipPath: 'inset(0 0% 0 0)',
      duration: 1.0,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
      },
    }
  );
});

/* ── Custom cursor ───────────────────────────────────────────── */
const cursor = document.getElementById('cursor');
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
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
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
