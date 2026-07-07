// Act 6 — Hand finishing. The cast piece takes centre stage. Drag or arrow-keys
// rotate it; finish buttons hot-swap the surface (mirror/satin/brushed/hammered)
// with a brief polishing-wheel touch; an engraving field lasers text onto the band.

import { makeScene, makePanel, pillGroup } from './common.js';
import { buildForm, applyEngraving } from '../lib/geometry.js';
import { makeMetalMaterial } from '../lib/materials.js';
import { createParticles } from '../lib/particles.js';

const FINISHES = [
  { label: 'Mirror', value: 'mirror' },
  { label: 'Satin', value: 'satin' },
  { label: 'Brushed', value: 'brushed' },
  { label: 'Hammered', value: 'hammered' },
];

export function createFinishAct(sectionEl, state) {
  let THREE; let scene; let camera; let quality; let envMap;
  let piece; let wheel; let sparks;
  let rotY = 0.4; let rotX = 0.1; let dragVX = 0.003;
  let dragging = false; let lastX = 0; let lastY = 0;
  let currentFinish = 'mirror';
  let wheelTimer = 0;

  function rebuildPiece() {
    if (piece) scene.remove(piece);
    const st = state.get();
    piece = buildForm(THREE, st.form || 'ring', { alloyKey: st.alloy, finish: currentFinish, stoneKey: st.stone, stoneCarat: st.stoneCarat });
    if (st.engraving) applyEngraving(THREE, piece, st.engraving);
    scene.add(piece);
  }

  function setFinish(finish) {
    currentFinish = finish;
    state.set({ finish });
    // Swap just the metal material so engraving/gem stay intact.
    const st = state.get();
    piece.traverse((o) => {
      if (o.isMesh && o.material === piece.userData.metal) {
        const m = makeMetalMaterial(THREE, { alloyKey: st.alloy, finish });
        o.material = m;
      }
    });
    piece.userData.metal = makeMetalMaterial(THREE, { alloyKey: st.alloy, finish });
    rebuildPiece();
    wheelTimer = 0.8; // polishing-wheel touch
  }

  return {
    id: 'finish',
    sectionEl,
    scene: null,
    camera: null,
    init(ctx) {
      THREE = ctx.THREE; quality = ctx.quality; envMap = ctx.envMap;
      const s = makeScene(THREE, ctx.size, { camZ: 3.6, camY: 1.5, envMap });
      scene = s.scene; camera = s.camera;

      rebuildPiece();

      wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.25, 32),
        new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.6, metalness: 0.3 }),
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(1.6, 0.6, 0);
      wheel.visible = false;
      scene.add(wheel);

      sparks = createParticles(THREE, { kind: 'sparks', count: 60, area: 0.6, quality });
      sparks.points.visible = false;
      scene.add(sparks.points);

      // Controls.
      const panel = makePanel(sectionEl, 'act-panel--finish');
      panel.appendChild(pillGroup('Finish', FINISHES, setFinish, 'mirror'));

      const engrave = document.createElement('div');
      engrave.className = 'engrave-row';
      engrave.innerHTML = `
        <label class="pill-group-label" for="engrave-input">Engraving (max 20)</label>
        <div class="engrave-controls">
          <input id="engrave-input" type="text" maxlength="20" placeholder="e.g. Forever, D & A" class="engrave-input">
          <button type="button" class="engrave-btn">Engrave</button>
        </div>`;
      panel.appendChild(engrave);
      const input = engrave.querySelector('#engrave-input');
      engrave.querySelector('.engrave-btn').addEventListener('click', () => {
        state.set({ engraving: input.value.slice(0, 20) });
        rebuildPiece();
        wheelTimer = 0.8;
      });

      // Drag + keyboard rotate. Canvas has role/tabindex via section controls.
      const el = ctx.renderer.domElement;
      el.addEventListener('pointerdown', (e) => { if (this.scene === scene) { dragging = true; lastX = e.clientX; lastY = e.clientY; } });
      window.addEventListener('pointerup', () => { dragging = false; });
      window.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        rotY += (e.clientX - lastX) * 0.01;
        rotX += (e.clientY - lastY) * 0.01;
        dragVX = (e.clientX - lastX) * 0.001;
        lastX = e.clientX; lastY = e.clientY;
      });
      const rotBtns = document.createElement('div');
      rotBtns.className = 'rotate-hint';
      rotBtns.innerHTML = '<button type="button" class="rot-btn" aria-label="Rotate left">←</button><span>Drag to rotate</span><button type="button" class="rot-btn" aria-label="Rotate right">→</button>';
      panel.appendChild(rotBtns);
      rotBtns.children[0].addEventListener('click', () => { rotY -= 0.4; });
      rotBtns.children[2].addEventListener('click', () => { rotY += 0.4; });

      this.scene = scene; this.camera = camera;
    },
    enter() { rebuildPiece(); },
    update(_p, dt) {
      if (!dragging) { rotY += dragVX; dragVX *= 0.96; }
      if (piece) { piece.rotation.y = rotY; piece.rotation.x = rotX; }
      if (wheelTimer > 0) {
        wheelTimer -= dt;
        wheel.visible = true;
        wheel.rotation.x += dt * 30;
        wheel.position.x = 0.9 + Math.sin(performance.now() * 0.02) * 0.1;
        sparks.points.visible = true;
        sparks.points.position.set(0.6, 0.2, 0.4);
        sparks.update(dt);
      } else {
        wheel.visible = false;
        sparks.points.visible = false;
      }
    },
    exit() {},
    dispose() { sparks.dispose(); if (piece) scene.remove(piece); scene.remove(wheel); this.scene = null; },
  };
}
