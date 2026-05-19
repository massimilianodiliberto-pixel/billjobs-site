'use strict';

/* ── Lenis smooth scroll ─────────────────────────────────── */
const lenis = new Lenis({
  duration: 1.4,
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

/* ── Navigation gate helpers ─────────────────────────────── */

function waitForVideo(el, maxMs) {
  return new Promise(resolve => {
    if (!el || el.readyState >= 3 || el.getAttribute('preload') === 'none') return resolve();
    const t = setTimeout(resolve, maxMs);
    el.addEventListener('canplaythrough', () => { clearTimeout(t); resolve(); }, { once: true });
  });
}

function waitForAboveFoldImages(maxMs) {
  return new Promise(resolve => {
    const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
      if (img.complete) return false;
      const r = img.getBoundingClientRect();
      return r.top < window.innerHeight * 1.3;
    });
    if (!imgs.length) return resolve();
    let done = 0;
    const t = setTimeout(resolve, maxMs);
    const tick = () => { if (++done >= imgs.length) { clearTimeout(t); resolve(); } };
    imgs.forEach(img => {
      img.addEventListener('load',  tick, { once: true });
      img.addEventListener('error', tick, { once: true });
    });
  });
}

/* Destination page: hold #page-transition until content is ready */
window.addEventListener('load', async () => {
  if (document.getElementById('intro')) return;
  const primaryVid = document.querySelector('#system-vid-bg, #author-vid-texture');
  if (primaryVid) await waitForVideo(primaryVid, 2500);
  await waitForAboveFoldImages(2500);
  gsap.to('#page-transition', { autoAlpha: 0, duration: 0.7, ease: 'power2.out', delay: 0.15 });
});

/* Source page: instant black gate + navigate */
function gateAndNavigate(url) {
  const gate = document.createElement('div');
  gate.id = 'nav-gate';
  document.body.appendChild(gate);
  window.sound.play('feedback-transition', 0.06, 0.18);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.location.href = url; }));
}

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
      gateAndNavigate(homeUrl);
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
    gateAndNavigate(dest);
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
    this.enabled     = sessionStorage.getItem('soundEnabled') !== 'false';
    this.initialized = false;
    this._base       = _assetBase + 'sound/';
  }
  async init () {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    await this.ctx.resume();
    console.log('[Sound] AudioContext state after resume:', this.ctx.state);
    this.initialized = true;
    await this._loadAll();
    console.log('[Sound] buffers loaded:', Object.keys(this.buffers));
  }
  async _loadAll () {
    const names = ['hum','drone','pulse','ascend','descend',
                   'power','fade','hiss','woosh','distortion-fade',
                   'tv-static','feedback','feedback-transition'];
    await Promise.allSettled(names.map(n => this._load(n)));
  }
  async _load (name) {
    const fileMap = { 'distortion-fade': 'DistortionFade', 'feedback-transition': 'feedback-Transtion' };
    const filename = fileMap[name] || name;
    const url = this._base + filename + '.mp3';
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[SoundSystem] HTTP ${res.status} — "${name}" not found at ${url}`);
        return;
      }
      this.buffers[name] = await this.ctx.decodeAudioData(await res.arrayBuffer());
      console.log('[Sound] loaded:', name);
    } catch (e) {
      console.warn(`[SoundSystem] Failed to load "${name}" from ${url}:`, e);
    }
  }
  play (name, vol = 0.05, fadeIn = 0.3) {
    if (!this.enabled || !this.initialized || !this.buffers[name]) {
      if (this.enabled && this.initialized && !this.buffers[name]) {
        console.warn(`[SoundSystem] Buffer missing: "${name}"`);
      }
      return null;
    }
    console.log('[Sound] play:', name, 'vol:', vol);
    const src  = this.ctx.createBufferSource();
    src.buffer = this.buffers[name];
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(Math.min(vol, 0.20), this.ctx.currentTime + fadeIn);
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
    console.log('[Sound] loop:', name, 'vol:', vol);
    const src  = this.ctx.createBufferSource();
    src.buffer = this.buffers[name];
    src.loop   = true;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(Math.min(vol, 0.20), this.ctx.currentTime + 2.5);
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
    console.log('[Sound] toggle → enabled:', this.enabled);
    sessionStorage.setItem('soundEnabled', String(this.enabled));
    if (!this.enabled) {
      this.stopAll();
    } else {
      if (!this.initialized) {
        this.init()
          .then(() => document.dispatchEvent(new CustomEvent('sound:enabled')))
          .catch(e => { console.warn('[Sound] init failed:', e); this.enabled = false; });
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
  var btn = document.createElement('button');
  btn.id = 'sound-toggle';
  btn.setAttribute('aria-label', 'Toggle sound');
  document.body.appendChild(btn);

  function syncBtn () {
    btn.textContent = window.sound.enabled ? 'SOUND OFF' : 'SOUND ON';
    btn.classList.toggle('active', window.sound.enabled);
  }

  function enable () {
    window.sound.enabled = true;
    sessionStorage.setItem('soundEnabled', 'true');
    syncBtn();
    window.sound.init()
      .then(function () { document.dispatchEvent(new CustomEvent('sound:enabled')); syncBtn(); })
      .catch(function (e) {
        console.warn('[Sound] init failed:', e);
        window.sound.enabled = false;
        sessionStorage.setItem('soundEnabled', 'false');
        syncBtn();
      });
  }

  function disable () {
    window.sound.enabled = false;
    sessionStorage.setItem('soundEnabled', 'false');
    window.sound.stopAll();
    syncBtn();
  }

  btn.addEventListener('click', function () {
    if (window.sound.enabled) { disable(); } else { enable(); }
  });

  /* Robust audio unlock — retries on any user gesture.
     scroll is NOT a valid AudioContext gesture on iOS/Chrome mobile;
     pointer/touch/key events are. Flag prevents overlapping init calls. */
  if (window.sound.enabled) {
    var _unlockBusy = false;
    var _UNLOCK_EVENTS = ['click', 'pointerdown', 'touchstart', 'touchend', 'keydown'];
    function tryUnlock (e) {
      if (window.sound.initialized || _unlockBusy) return;
      if (e && e.target === btn) return;
      _unlockBusy = true;
      window.sound.init()
        .then(function () {
          _unlockBusy = false;
          document.dispatchEvent(new CustomEvent('sound:enabled'));
          syncBtn();
          _UNLOCK_EVENTS.forEach(function (ev) {
            document.removeEventListener(ev, tryUnlock, true);
          });
        })
        .catch(function () { _unlockBusy = false; });
    }
    _UNLOCK_EVENTS.forEach(function (ev) {
      document.addEventListener(ev, tryUnlock, { capture: true, passive: true });
    });
    /* Try immediately — works in desktop Chrome without needing a gesture */
    setTimeout(function () { tryUnlock(null); }, 200);
  }

  syncBtn();
}());


/* ── Mobile menu analog overlay video ────────────────────── */
(function () {
  const mm = document.getElementById('mobile-menu');
  if (!mm) return;
  const av = document.createElement('video');
  av.className = 'menu-vid-analog';
  av.muted = true; av.playsInline = true; av.preload = 'none'; av.loop = true;
  const as = document.createElement('source');
  as.src = _assetBase + 'video/Analog%20Transition%201.mp4'; as.type = 'video/mp4';
  av.appendChild(as); mm.appendChild(av);

  const toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = mm.classList.contains('open');
      window.sound.play('feedback-transition', 0.12, 0.10);
      if (open) {
        av.load(); av.play().catch(() => {});
        window.sound.loop('hum', 0.15);
        console.log('[Sound] menu open → hum loop');
      } else {
        av.pause();
        window.sound.stop('hum');
        console.log('[Sound] menu close → hum stopped');
      }
    });
  }
  mm.querySelectorAll('a').forEach(lnk => {
    lnk.addEventListener('click', () => { av.pause(); window.sound.stop('hum'); });
  });
}());

