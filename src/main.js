// Boot: capability check → stage → acts → scroll. Failure of any kind leaves
// the page as readable static content (class `journey-static`).

import { detectQuality } from './core/quality.js';
import { createStage } from './core/stage.js';
import { wireScroll, scrollToSection } from './core/scroll.js';
import { createState } from './core/state.js';

function supportsWebGL2() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

function makeStubAct(id, sectionEl, colour) {
  let scene; let camera; let mesh;
  return {
    id,
    sectionEl,
    scene: null,
    camera: null,
    init(ctx) {
      const { THREE, envMap, size } = ctx;
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0c);
      scene.environment = envMap;
      camera = new THREE.PerspectiveCamera(45, size.w / size.h, 0.1, 100);
      camera.position.set(0, 0, 5);
      const geo = id === 'stub-a'
        ? new THREE.TorusGeometry(1.2, 0.4, 48, 96)
        : new THREE.BoxGeometry(1.6, 1.6, 1.6);
      const mat = new THREE.MeshStandardMaterial({ color: colour, metalness: 1, roughness: 0.15 });
      mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      this.scene = scene;
      this.camera = camera;
    },
    update(progress, dt) {
      mesh.rotation.y += dt * 0.6;
      mesh.rotation.x = progress * Math.PI;
    },
    dispose() {
      mesh.geometry.dispose();
      mesh.material.dispose();
      this.scene = null;
    },
  };
}

function boot() {
  const root = document.getElementById('journey-root');
  const holder = document.getElementById('journey-canvas-holder');
  if (!root || !holder) return;

  const params = new URLSearchParams(location.search);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!supportsWebGL2() || reducedMotion || params.get('static') === '1') {
    root.classList.add('journey-static');
    return;
  }

  try {
    const quality = detectQuality();
    const state = createState();
    const stage = createStage(holder, quality);

    const sections = [...root.querySelectorAll('.journey-act')];
    stage.registerAct(makeStubAct('stub-a', sections[0], 0xf3cb7a));
    stage.registerAct(makeStubAct('stub-b', sections[1], 0x3355ff));

    wireScroll(stage);
    stage.setActive('stub-a');

    document.getElementById('begin-journey')?.addEventListener('click', () => {
      scrollToSection(sections[1]);
    });

    window.__journey = { stage, state }; // dev hook, used by verification
  } catch (err) {
    console.error('journey boot failed, falling back to static', err);
    root.classList.add('journey-static');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
