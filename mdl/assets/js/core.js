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
  const menuVideo = mobileMenu.querySelector('.menu-video');

  navToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    if (mobileMenu.classList.contains('open')) {
      document.body.style.overflow = 'hidden';
      lenis.stop();
      if (menuVideo) menuVideo.play();
    } else {
      document.body.style.overflow = '';
      lenis.start();
      if (menuVideo) menuVideo.pause();
    }
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
      lenis.start();
      if (menuVideo) menuVideo.pause();
    });
  });
}

/* ── MDL logo: clear introSeen and restart from intro ───── */
const navLogo = document.querySelector('.nav-logo');
if (navLogo) {
  navLogo.addEventListener('click', e => {
    e.preventDefault();
    sessionStorage.removeItem('introSeen');
    const homeUrl = navLogo.href;
    if (window.location.href === homeUrl) {
      window.location.reload();
    } else {
      gsap.to('#page-transition', {
        scaleY: 1,
        duration: 0.55,
        ease: 'power3.inOut',
        transformOrigin: 'bottom',
        onComplete: () => { window.location.href = homeUrl; },
      });
    }
  });
}

/* ── Page transitions on internal links ─────────────────── */
document.querySelectorAll('a[href]').forEach(link => {
  if (link.classList.contains('nav-logo')) return;
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

/* ── Asset base path (works from root and subdirectories) ─ */
const _assetBase = (function () {
  const lnk = document.querySelector('link[href*="style.css"]');
  return lnk ? lnk.getAttribute('href').replace('css/style.css', '') : '../assets/';
}());

/* ── SoundSystem ─────────────────────────────────────────── */
class SoundSystem {
  constructor () {
    this.ctx         = null;
    this.buffers     = {};
    this.nodes       = {};
    this.enabled     = false;
    this.initialized = false;
    this._base       = _assetBase + 'sound/';
  }
  async init () {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.initialized = true;
    await this._loadAll();
  }
  async _loadAll () {
    const names = ['hum','drone','pulse','ascend','descend',
                   'power','fade','hiss','woosh','distortion-fade',
                   'tv-static','feedback','feedback-transition'];
    await Promise.allSettled(names.map(n => this._load(n)));
  }
  async _load (name) {
    try {
      const res = await fetch(this._base + name + '.mp3');
      if (!res.ok) return;
      this.buffers[name] = await this.ctx.decodeAudioData(await res.arrayBuffer());
    } catch (_) {}
  }
  play (name, vol = 0.05, fadeIn = 0.3) {
    if (!this.enabled || !this.initialized || !this.buffers[name]) return null;
    const src  = this.ctx.createBufferSource();
    src.buffer = this.buffers[name];
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(Math.min(vol, 0.10), this.ctx.currentTime + fadeIn);
    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.start();
    return { src, gain };
  }
  playShort (name, vol = 0.05, ms = 400) {
    const node = this.play(name, vol, 0.06);
    if (!node) return;
    setTimeout(() => {
      try { node.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.12); } catch (_) {}
    }, ms);
  }
  loop (name, vol = 0.05) {
    if (!this.enabled || !this.initialized || !this.buffers[name] || this.nodes[name]) return;
    const src  = this.ctx.createBufferSource();
    src.buffer = this.buffers[name];
    src.loop   = true;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(Math.min(vol, 0.10), this.ctx.currentTime + 2.5);
    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.start();
    this.nodes[name] = { src, gain };
  }
  stop (name, fadeOut = 1.5) {
    const node = this.nodes[name];
    if (!node) return;
    try {
      node.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeOut);
      node.src.stop(this.ctx.currentTime + fadeOut);
    } catch (_) {}
    delete this.nodes[name];
  }
  stopAll (fadeOut = 1.2) {
    Object.keys(this.nodes).forEach(n => this.stop(n, fadeOut));
  }
  toggle () {
    this.enabled = !this.enabled;
    sessionStorage.setItem('soundEnabled', String(this.enabled));
    if (!this.enabled) {
      this.stopAll();
    } else {
      if (!this.initialized) {
        this.init().then(() => document.dispatchEvent(new CustomEvent('sound:enabled')));
      } else {
        document.dispatchEvent(new CustomEvent('sound:enabled'));
      }
    }
    return this.enabled;
  }
}

window.sound = new SoundSystem();

/* ── Sound toggle button ─────────────────────────────────── */
(function () {
  const btn = document.createElement('button');
  btn.id = 'sound-toggle';
  btn.textContent = 'SOUND ON';
  btn.setAttribute('aria-label', 'Toggle sound');
  document.body.appendChild(btn);
  btn.addEventListener('click', () => {
    const on = window.sound.toggle();
    btn.textContent = on ? 'SOUND OFF' : 'SOUND ON';
    btn.classList.toggle('active', on);
  });
}());

/* ── Page transition video (inside #page-transition) ─────── */
(function () {
  const pt = document.getElementById('page-transition');
  if (!pt) return;
  const vid = document.createElement('video');
  vid.id = 'vid-transition';
  vid.muted = true; vid.playsInline = true; vid.preload = 'none'; vid.loop = true;
  const s = document.createElement('source');
  s.src = _assetBase + 'video/Analog_Transition_3.mp4'; s.type = 'video/mp4';
  vid.appendChild(s); pt.appendChild(vid);
}());

/* ── Mobile menu analog overlay video ────────────────────── */
(function () {
  const mm = document.getElementById('mobile-menu');
  if (!mm) return;
  const av = document.createElement('video');
  av.className = 'menu-vid-analog';
  av.muted = true; av.playsInline = true; av.preload = 'none'; av.loop = true;
  const as = document.createElement('source');
  as.src = _assetBase + 'video/Analog_Overlay_8.mp4'; as.type = 'video/mp4';
  av.appendChild(as); mm.appendChild(av);

  const toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = mm.classList.contains('open');
      window.sound.play('power', 0.07, 0.08);
      if (open) { av.load(); av.play().catch(() => {}); }
      else { av.pause(); }
    });
  }
  mm.querySelectorAll('a').forEach(lnk => {
    lnk.addEventListener('mouseenter', () => window.sound.play('fade', 0.07, 0.18));
    lnk.addEventListener('click', () => av.pause());
  });
}());

/* ── Page transition: start video + sound on internal nav ── */
document.addEventListener('click', e => {
  const link = e.target.closest('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
  if (link.target === '_blank' || link.classList.contains('nav-logo')) return;
  const vid = document.getElementById('vid-transition');
  if (vid) { vid.load(); vid.play().catch(() => {}); }
  window.sound.play('feedback-transition', 0.06, 0.18);
}, true);
