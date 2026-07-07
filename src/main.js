// Boot: capability check → stage → acts → scroll. Failure of any kind leaves
// the page as readable static content (class `journey-static`).

import { detectQuality } from './core/quality.js';
import { createStage } from './core/stage.js';
import { wireScroll, scrollToSection } from './core/scroll.js';
import { createState } from './core/state.js';
import { buildForm } from './lib/geometry.js';
import { createParticles } from './lib/particles.js';
import { createHeroAct } from './acts/act01-hero.js';
import { createMineAct } from './acts/act02-mine.js';
import { createPurifyAct } from './acts/act03-purify.js';
import { createAlloyAct } from './acts/act04-alloy.js';
import { createCastAct } from './acts/act05-cast.js';

// Dev-only: `?gallery=1` renders every form + a particle kind for eyeballing.
function galleryAct(sectionEl) {
  let scene; let camera; let group; let embers; let t = 0;
  const forms = ['ring', 'pendant', 'chain', 'bracelet', 'earrings'];
  let idx = 0;
  return {
    id: 'gallery',
    sectionEl,
    scene: null,
    camera: null,
    init(ctx) {
      const { THREE, envMap, size } = ctx;
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0c);
      scene.environment = envMap;
      camera = new THREE.PerspectiveCamera(45, size.w / size.h, 0.1, 100);
      camera.position.set(0, 0, 6);
      const key = new THREE.DirectionalLight(0xffffff, 2.5);
      key.position.set(3, 5, 4); scene.add(key);
      this._THREE = THREE;
      this.load('ring');
      embers = createParticles(THREE, { kind: 'embers', count: 200, area: 6, quality: ctx.quality });
      scene.add(embers.points);
      this.scene = scene; this.camera = camera;
      window.addEventListener('keydown', (e) => {
        if (e.key === ' ') { idx = (idx + 1) % forms.length; this.load(forms[idx]); }
      });
    },
    load(form) {
      if (group) scene.remove(group);
      group = buildForm(this._THREE, form, { alloyKey: 'gold-18k-yellow', finish: 'mirror', stoneKey: 'natural-diamond', stoneCarat: 1 });
      scene.add(group);
    },
    update(_p, dt) { t += dt; group.rotation.y = t * 0.6; embers.update(dt); },
  };
}

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

    if (params.get('gallery') === '1') {
      stage.registerAct(galleryAct(sections[0]));
      wireScroll(stage);
      stage.setActive('gallery');
      window.__journey = { stage, state };
      return;
    }

    // Real acts, section by section. Later acts arrive in the next batch and
    // fall back to a placeholder stub until then.
    const builders = [
      (el) => createHeroAct(el),
      (el) => createMineAct(el, state),
      (el) => createPurifyAct(el, state),
      (el) => createAlloyAct(el, state),
      (el) => createCastAct(el, state),
    ];
    const stubColours = [0xf3cb7a, 0xe9e8e4, 0xe7a186, 0x9fd0ff, 0xf3cb7a];
    sections.forEach((el, i) => {
      if (builders[i]) stage.registerAct(builders[i](el));
      else stage.registerAct(makeStubAct('stub-' + i, el, stubColours[i % stubColours.length]));
    });

    wireScroll(stage);
    stage.setActive('hero');

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
