'use strict';

/* ── Lenis smooth scroll ─────────────────────────────────── */
const lenis = new Lenis({
  duration: 1.6,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 0.75,
  touchMultiplier: 1.5,
});

gsap.registerPlugin(ScrollTrigger);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

/* ── Page transition — reveal on load (skip if intro present) */
window.addEventListener('load', () => {
  if (!document.getElementById('intro')) {
    gsap.to('#page-transition', {
      scaleY: 0,
      duration: 0.8,
      ease: 'power3.inOut',
      transformOrigin: 'top',
      delay: 0.1,
    });
  }
});

/* ── Nav reveal ─────────────────────────────────────────── */
let navRevealed = false;

function revealNav() {
  if (!navRevealed) {
    document.querySelector('nav').classList.add('visible');
    navRevealed = true;
  }
}

window.addEventListener('mousemove',  revealNav, { once: true });
window.addEventListener('scroll',     revealNav, { once: true });
window.addEventListener('touchstart', revealNav, { once: true });
setTimeout(revealNav, 3500);

window.addEventListener('scroll', () => {
  document.querySelector('nav').classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── Mobile menu ─────────────────────────────────────────── */
const navToggle  = document.querySelector('.nav-toggle');
const mobileMenu = document.getElementById('mobile-menu');

if (navToggle && mobileMenu) {
  navToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    if (mobileMenu.classList.contains('open')) {
      document.body.style.overflow = 'hidden';
      lenis.stop();
    } else {
      document.body.style.overflow = '';
      lenis.start();
    }
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
      lenis.start();
    });
  });
}

/* ── Page transitions on internal links ─────────────────── */
document.querySelectorAll('a[href]').forEach(link => {
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
  if (link.target === '_blank') return;

  link.addEventListener('click', e => {
    const dest = link.href;
    if (dest === window.location.href) return;
    e.preventDefault();
    gsap.to('#page-transition', {
      scaleY: 1,
      duration: 0.55,
      ease: 'power3.inOut',
      transformOrigin: 'bottom',
      onComplete: () => { window.location.href = dest; },
    });
  });
});

/* ── [data-reveal] scroll animations ────────────────────── */
gsap.utils.toArray('[data-reveal]').forEach(el => {
  gsap.fromTo(el,
    { opacity: 0, y: 22 },
    {
      opacity: 1, y: 0,
      duration: 1.0,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 83%',
        toggleActions: 'play none none none',
      },
    }
  );
});
