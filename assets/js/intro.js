/* ============================================================
   BILL JOBS PRODUCTION — Cinematic 3D Intro
   Three.js r160 · ES Module
   ============================================================
   Sequence (16 s total):
   0.00–0.20  The Void — dark space, camera drifts forward
   0.20–0.50  Particle Cloud — volumetric light, gold dust
   0.50–0.65  Microscopic — biotech rings, dense micro-world
   0.65–0.78  Universe Opens — flash → rapid pullback → stars
   0.78–0.92  Cosmos — nebula, starfield, settling camera
   0.92–1.00  Logo materialises → fade to site
   ============================================================ */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }     from 'three/addons/postprocessing/OutputPass.js';

/* ── Bail out gracefully if intro div missing ─────────────── */
const introEl = document.getElementById('intro');
if (!introEl) throw new Error('no intro');

/* ── Detect low-power devices ─────────────────────────────── */
const LOW = window.innerWidth < 768 || navigator.maxTouchPoints > 1;

/* ── Renderer ─────────────────────────────────────────────── */
const renderer = new THREE.WebGLRenderer({ antialias: !LOW, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, LOW ? 1 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
introEl.appendChild(renderer.domElement);

/* ── Scene & Camera ───────────────────────────────────────── */
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 2000);
camera.position.set(0, 0, 12);

/* ── Fog ──────────────────────────────────────────────────── */
scene.fog = new THREE.FogExp2(0x000000, 0.035);

/* ── Canvas texture helpers ───────────────────────────────── */
function glowTex(size = 128, inner = 'rgba(255,255,255,1)') {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0,   inner);
  g.addColorStop(0.35, inner.replace('1)', '0.55)'));
  g.addColorStop(1,   inner.replace(/,[^,]+\)$/, ',0)'));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function ringTex(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.strokeStyle = 'rgba(201,168,76,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 4, 0, Math.PI * 2);
  ctx.stroke();
  return new THREE.CanvasTexture(c);
}

function shaftTex() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0,   'rgba(0,0,0,0)');
  g.addColorStop(0.5, 'rgba(220,180,90,1)');
  g.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);
  return new THREE.CanvasTexture(c);
}

function nebulaTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  // Deep purple-blue cloud
  const g1 = ctx.createRadialGradient(260, 200, 0, 260, 200, 220);
  g1.addColorStop(0,   'rgba(80,40,180,0.5)');
  g1.addColorStop(0.5, 'rgba(40,20,100,0.25)');
  g1.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, 512, 512);
  // Gold core
  const g2 = ctx.createRadialGradient(280, 230, 0, 280, 230, 80);
  g2.addColorStop(0,   'rgba(201,168,76,0.4)');
  g2.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, 512, 512);
  return new THREE.CanvasTexture(c);
}

/* ── Shared vertex/fragment shader chunks ─────────────────── */
const VERT_POINT = /* glsl */`
  attribute float size;
  attribute vec3  color;
  varying   vec3  vColor;
  uniform   float uTime;
  uniform   float uScale;
  uniform   float uFocus;   // world-space focus distance (positive)

  float rnd(float n){ return fract(sin(n)*43758.5453); }

  void main(){
    vColor = color;
    vec3 pos = position * uScale;
    float id  = float(gl_VertexID);
    pos.x += sin(uTime * 0.4 + rnd(id)       * 6.28) * 0.03 * uScale;
    pos.y += cos(uTime * 0.3 + rnd(id + 1.0) * 6.28) * 0.03 * uScale;
    pos.z += sin(uTime * 0.2 + rnd(id + 2.0) * 6.28) * 0.02 * uScale;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float depth   = -mv.z;
    float blur    = clamp(abs(depth - uFocus) / max(uFocus, 1.0), 0.0, 2.5);
    float ptSize  = (size * uScale) * (1.0 + blur * 1.2) * (380.0 / depth);
    gl_PointSize  = clamp(ptSize, 1.0, 120.0);
    gl_Position   = projectionMatrix * mv;
  }
`;

const FRAG_POINT_SOFT = /* glsl */`
  uniform float uOpacity;
  varying vec3  vColor;

  void main(){
    float d = distance(gl_PointCoord, vec2(0.5));
    float a = (1.0 - smoothstep(0.28, 0.5, d)) * uOpacity;
    gl_FragColor = vec4(vColor, a);
  }
`;

const FRAG_POINT_SHARP = /* glsl */`
  uniform float uOpacity;
  varying vec3  vColor;

  void main(){
    float d = distance(gl_PointCoord, vec2(0.5));
    float a = (1.0 - smoothstep(0.15, 0.5, d)) * uOpacity;
    gl_FragColor = vec4(vColor, a);
  }
`;

/* ── Particle system factory ──────────────────────────────── */
function makePoints(count, config) {
  const { spread, concentratePow, zOffset, sizeRange, colorPalette, vert, frag, focusDist } = config;
  const pos    = new Float32Array(count * 3);
  const sizes  = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const r  = Math.pow(Math.random(), concentratePow ?? 0.5) * spread;
    pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
    pos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
    pos[i*3+2] = r * Math.cos(ph) + (zOffset ?? 0);
    sizes[i]   = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
    const col  = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i*3]   = col.r;
    colors[i*3+1] = col.g;
    colors[i*3+2] = col.b;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geom.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));
  geom.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:    { value: 0 },
      uOpacity: { value: 0 },
      uScale:   { value: 1 },
      uFocus:   { value: focusDist ?? 8 },
    },
    vertexShader:   vert   ?? VERT_POINT,
    fragmentShader: frag   ?? FRAG_POINT_SOFT,
    transparent:  true,
    blending:     THREE.AdditiveBlending,
    depthWrite:   false,
  });

  return new THREE.Points(geom, mat);
}

/* ── Colour palettes ──────────────────────────────────────── */
const PAL_GOLD  = [0xC9A84C, 0xE8D5A0, 0xA07830, 0xF5F0EB, 0xFFEA80].map(h => new THREE.Color(h));
const PAL_MICRO = [0x4CE8C9, 0xC9A84C, 0xE8A44C, 0xFFFFFF, 0x80C9FF].map(h => new THREE.Color(h));
const PAL_STAR  = [0xFFFFFF, 0xC9E8FF, 0xFFE4C9, 0xFFD0D0, 0xD0FFE4].map(h => new THREE.Color(h));

/* ── Build particle systems ───────────────────────────────── */
const DC = LOW ? 180 : 350;
const MC = LOW ? 3000 : 7000;
const SC = LOW ? 8000 : 20000;

const dustSystem  = makePoints(DC, { spread: 14, concentratePow: 0.8, zOffset: -4,  sizeRange: [0.4, 3.0], colorPalette: PAL_GOLD,  focusDist: 8,  frag: FRAG_POINT_SOFT });
const microSystem = makePoints(MC, { spread: 3,  concentratePow: 0.4, zOffset: -1,  sizeRange: [0.05, 0.5], colorPalette: PAL_MICRO, focusDist: 3,  frag: FRAG_POINT_SOFT });
const starSystem  = makePoints(SC, { spread: 400, concentratePow: 0.3, zOffset: 0,  sizeRange: [0.4, 2.5], colorPalette: PAL_STAR,  focusDist: 60, frag: FRAG_POINT_SHARP });

scene.add(dustSystem, microSystem, starSystem);

/* Store raw velocities for dust drift */
const dustVel = Array.from({ length: DC }, () => ({
  x: (Math.random() - 0.5) * 0.0015,
  y: (Math.random() - 0.5) * 0.0012 + 0.0004,
  z: (Math.random() - 0.5) * 0.0008,
}));

/* ── Light shafts ─────────────────────────────────────────── */
const shaftT = shaftTex();
const shafts = Array.from({ length: LOW ? 3 : 6 }, (_, i) => {
  const geom = new THREE.PlaneGeometry(1.2 + Math.random() * 0.8, 14 + Math.random() * 6);
  const mat  = new THREE.MeshBasicMaterial({
    map: shaftT, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(3 + (Math.random()-0.5)*4, 2.5 + (Math.random()-0.5)*2, -2 + (Math.random()-0.5)*4);
  mesh.rotation.set((Math.random()-0.5)*0.2, (Math.random()-0.5)*0.3, -0.25 + (Math.random()-0.5)*0.2);
  scene.add(mesh);
  return { mesh, base: 0.016 + Math.random() * 0.018, phase: Math.random() * Math.PI * 2 };
});

/* ── Ambient glow sprite ──────────────────────────────────── */
const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex(256, 'rgba(201,168,76,0.9)'),
  blending: THREE.AdditiveBlending, transparent: true, opacity: 0,
}));
glowSprite.position.set(4, 3, -8);
glowSprite.scale.set(16, 16, 1);
scene.add(glowSprite);

/* ── Flash sprite (universe reveal) ──────────────────────── */
const flashSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex(256, 'rgba(255,255,255,1)'),
  blending: THREE.AdditiveBlending, transparent: true, opacity: 0,
}));
flashSprite.scale.set(400, 400, 1);
scene.add(flashSprite);

/* ── Expanding ring (shockwave) ───────────────────────────── */
const ringSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: ringTex(256),
  blending: THREE.AdditiveBlending, transparent: true, opacity: 0,
}));
scene.add(ringSprite);

/* ── Nebula cloud (universe phase) ───────────────────────── */
const nebulaSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: nebulaTex(),
  blending: THREE.AdditiveBlending, transparent: true, opacity: 0,
}));
nebulaSprite.position.set(30, 20, -120);
nebulaSprite.scale.set(280, 280, 1);
scene.add(nebulaSprite);

/* ── Biotech rings (microscopic phase) ───────────────────── */
const bioRings = [
  { r: 1.5, rot: new THREE.Euler(0.3, 0, 0), pos: new THREE.Vector3(0, 0, -1.5) },
  { r: 2.2, rot: new THREE.Euler(1.1, 0.4, 0.2), pos: new THREE.Vector3(0.3, 0, -2) },
  { r: 0.9, rot: new THREE.Euler(-0.5, 0.8, 0.1), pos: new THREE.Vector3(-0.2, 0.1, -1) },
].map(({ r, rot, pos }) => {
  const geom = new THREE.TorusGeometry(r, 0.008, 6, 96);
  const mat  = new THREE.MeshBasicMaterial({
    color: 0xC9A84C, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.copy(rot);
  mesh.position.copy(pos);
  scene.add(mesh);
  return { mesh, mat };
});

/* ── Post processing ──────────────────────────────────────── */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  LOW ? 1.2 : 1.8,   // strength
  0.6,                // radius
  0.08                // threshold
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ── Easing helpers ───────────────────────────────────────── */
const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const remap   = (v, a, b, c, d) => c + (d - c) * clamp((v - a) / (b - a), 0, 1);
const easeIO3 = t => t < 0.5 ? 4*t*t*t : 1 - (-2*t+2)**3/2;
const easeO3  = t => 1 - (1-t)**3;
const easeI3  = t => t*t*t;

/* ── UI elements ──────────────────────────────────────────── */
const logoEl     = document.getElementById('intro-logo');
const skipEl     = document.getElementById('intro-skip');
const progressEl = document.getElementById('intro-progress');

/* ── Animation state ─────────────────────────────────────── */
const DURATION = 16;
let   elapsed  = 0;
let   rafId;
let   completed = false;
const clock     = new THREE.Clock();

/* ── Main update ──────────────────────────────────────────── */
function update(t) {
  const time = elapsed;

  /* -- Dust particles -- */
  dustSystem.material.uniforms.uTime.value    = time;
  dustSystem.material.uniforms.uOpacity.value = remap(t, 0, 0.08, 0, 1) * remap(t, 0.68, 0.82, 1, 0);
  dustSystem.material.uniforms.uFocus.value   = remap(t, 0, 0.5, 12, 4);

  const dp = dustSystem.geometry.attributes.position.array;
  for (let i = 0; i < DC; i++) {
    dp[i*3]   += dustVel[i].x;
    dp[i*3+1] += dustVel[i].y;
    dp[i*3+2] += dustVel[i].z;
    if (Math.abs(dp[i*3])   > 14) dustVel[i].x *= -1;
    if (Math.abs(dp[i*3+1]) > 14) dustVel[i].y *= -1;
    if (Math.abs(dp[i*3+2]) > 14) dustVel[i].z *= -1;
  }
  dustSystem.geometry.attributes.position.needsUpdate = true;

  /* -- Micro particles -- */
  const microOp = remap(t, 0.28, 0.46, 0, 1) * remap(t, 0.63, 0.78, 1, 0);
  microSystem.material.uniforms.uTime.value    = time;
  microSystem.material.uniforms.uOpacity.value = microOp;
  microSystem.material.uniforms.uScale.value   = 1.0 + remap(t, 0.5, 0.66, 0, 4);
  microSystem.material.uniforms.uFocus.value   = remap(t, 0.3, 0.65, 6, 1);

  /* -- Stars -- */
  starSystem.material.uniforms.uTime.value    = time;
  starSystem.material.uniforms.uOpacity.value = remap(t, 0.72, 0.84, 0, 1) * remap(t, 0.97, 1.0, 1, 0);
  starSystem.material.uniforms.uFocus.value   = 80;

  /* -- Light shafts -- */
  const shaftEnv = remap(t, 0.1, 0.28, 0, 1) * remap(t, 0.62, 0.75, 1, 0);
  shafts.forEach(s => {
    s.mesh.material.opacity = s.base * shaftEnv * (0.65 + 0.35 * Math.sin(time * 0.9 + s.phase));
  });

  /* -- Glow sprite -- */
  glowSprite.material.opacity = remap(t, 0.1, 0.32, 0, 0.55) * remap(t, 0.60, 0.74, 1, 0);

  /* -- Biotech rings -- */
  const ringEnv = remap(t, 0.40, 0.55, 0, 1) * remap(t, 0.62, 0.74, 1, 0);
  bioRings.forEach(({ mesh, mat }, i) => {
    mat.opacity = ringEnv * (0.3 + 0.1 * i);
    mesh.rotation.y = time * (0.2 + i * 0.07);
    mesh.rotation.z = time * (0.1 - i * 0.04);
  });

  /* -- Flash & shockwave at universe reveal -- */
  if (t >= 0.64 && t <= 0.76) {
    const ft   = remap(t, 0.64, 0.68, 0, 1) * remap(t, 0.68, 0.76, 1, 0);
    flashSprite.material.opacity = easeO3(remap(t, 0.64, 0.68, 0, 1)) * remap(t, 0.68, 0.76, 1, 0) * 0.85;

    const rt   = remap(t, 0.65, 0.74, 0, 1);
    const rs   = 2 + rt * 90;
    ringSprite.scale.set(rs, rs, 1);
    ringSprite.material.opacity = (1 - rt) * 0.7;
    ringSprite.position.copy(camera.position).addScaledVector(camera.getWorldDirection(new THREE.Vector3()), 5);

    bloom.strength = LOW ? 1.2 : 1.8 + easeO3(remap(t, 0.64, 0.68, 0, 1)) * 4.5;
  } else {
    flashSprite.material.opacity = 0;
    ringSprite.material.opacity  = 0;
    bloom.strength = LOW ? 1.2 : 1.8;
  }

  /* -- Nebula -- */
  nebulaSprite.material.opacity = remap(t, 0.76, 0.88, 0, 0.18) * remap(t, 0.97, 1.0, 1, 0);

  /* -- Camera path -- */
  let cx = 0, cy = 0, cz = 12;

  if (t < 0.22) {
    const p = easeO3(t / 0.22);
    cz = 12 - p * 5.5;
    cx = p * 0.25;
    cy = Math.sin(t * Math.PI * 5) * 0.12;

  } else if (t < 0.52) {
    const p = easeIO3((t - 0.22) / 0.30);
    cz = 6.5 - p * 7.8;
    cx = 0.25 * (1 - p);
    cy = Math.sin(t * Math.PI * 4) * 0.08;

  } else if (t < 0.65) {
    const p = easeIO3((t - 0.52) / 0.13);
    cz = -1.3 - p * 1.7;
    cy = -p * 0.18;

  } else if (t < 0.78) {
    // Rapid pullback — universe reveal
    const p = easeIO3((t - 0.65) / 0.13);
    cz = -3 - p * 72;
    cy = -0.18 + p * 0.24;

  } else if (t < 0.92) {
    const p = easeO3((t - 0.78) / 0.14);
    cz = -75 + p * 16;
    cy = 0.06 - p * 0.06;

  } else {
    cz = -59;
  }

  camera.position.set(cx, cy, cz);
  camera.lookAt(cx * 0.4, cy * 0.4, cz - 20);

  /* -- Fog -- */
  scene.fog.density = t < 0.65
    ? remap(t, 0, 0.5, 0.03, 0.055)
    : remap(t, 0.65, 0.82, 0.055, 0.001);

  /* -- Logo reveal -- */
  if (logoEl) {
    const lo = remap(t, 0.87, 0.96, 0, 1) * remap(t, 0.99, 1.0, 1, 0);
    const ly = (1 - remap(t, 0.87, 0.96, 0, 1)) * 28;
    logoEl.style.opacity   = lo;
    logoEl.style.transform = `translate(-50%, calc(50% + ${ly}px))`;
  }

  /* -- Skip button fade -- */
  if (skipEl) skipEl.style.opacity = remap(t, 0.04, 0.14, 0, 1);

  /* -- Progress bar -- */
  if (progressEl) progressEl.style.width = (t * 100) + '%';
}

/* ── Completion ───────────────────────────────────────────── */
function complete() {
  if (completed) return;
  completed = true;
  cancelAnimationFrame(rafId);

  introEl.classList.add('fade-out');
  setTimeout(() => {
    introEl.remove();
    window.dispatchEvent(new Event('introComplete'));
  }, 1400);
}

/* ── Render loop ──────────────────────────────────────────── */
(function loop() {
  rafId  = requestAnimationFrame(loop);
  elapsed += clock.getDelta();
  const t = Math.min(elapsed / DURATION, 1);
  update(t);
  composer.render();
  if (t >= 1) complete();
})();

/* ── Skip ─────────────────────────────────────────────────── */
if (skipEl) {
  skipEl.addEventListener('click', () => {
    elapsed = DURATION;
    update(1);
    complete();
  });
}

/* ── Resize ───────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
