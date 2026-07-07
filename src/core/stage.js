// Shared WebGL stage: one renderer, one canvas, many lazily-built act scenes.
// Only the active act is updated and rendered; acts more than two sections
// away are disposed to keep GPU memory flat.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function createStage(holderEl, quality) {
  const renderer = new THREE.WebGLRenderer({
    antialias: quality.tier !== 'low',
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(quality.dpr);
  renderer.setSize(holderEl.clientWidth, holderEl.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  holderEl.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const acts = [];
  let active = null;
  let visible = true;
  let lastTime = performance.now();

  const io = new IntersectionObserver(
    (entries) => { visible = entries[0].isIntersecting; },
    { rootMargin: '100px' },
  );
  io.observe(holderEl);

  function size() {
    return { w: holderEl.clientWidth, h: holderEl.clientHeight };
  }

  function ensureInit(act) {
    if (!act._initialized) {
      act.init({ THREE, renderer, envMap, quality, size: size() });
      act._initialized = true;
    }
  }

  function setActive(id) {
    const next = acts.find((a) => a.id === id);
    if (!next || next === active) return;
    if (active) active.exit?.();
    ensureInit(next);
    active = next;
    next.enter?.();

    // Dispose acts far from the current one.
    const idx = acts.indexOf(next);
    acts.forEach((a, i) => {
      if (a._initialized && Math.abs(i - idx) > 2) {
        a.dispose?.();
        a._initialized = false;
      }
    });
  }

  function onResize() {
    const { w, h } = size();
    renderer.setSize(w, h);
    acts.forEach((a) => {
      if (a._initialized && a.camera) {
        a.camera.aspect = w / h;
        a.camera.updateProjectionMatrix();
      }
    });
  }
  window.addEventListener('resize', onResize);

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    if (!visible || document.visibilityState === 'hidden' || !active) return;
    active.update?.(active.progress ?? 0, dt);
    if (active.scene && active.camera) renderer.render(active.scene, active.camera);
  }
  requestAnimationFrame(frame);

  return {
    THREE,
    renderer,
    envMap,
    quality,
    registerAct(act) {
      act.progress = 0;
      acts.push(act);
    },
    setActive,
    getActs: () => acts,
    size,
  };
}
