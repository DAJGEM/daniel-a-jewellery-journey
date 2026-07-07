// Act 7 — Stone setting. Pick a stone type and carat; drag it (or press Enter)
// into the setting where it snaps magnetically with a sparkle. A live panel
// reports the 4 Cs and an honest indicative price band.

import { makeScene, makePanel, pillGroup, fmtCAD } from './common.js';
import { STONES } from '../data/stones.js';
import { buildForm } from '../lib/geometry.js';
import { makeGemMaterial } from '../lib/materials.js';
import { createParticles } from '../lib/particles.js';

const STONE_OPTS = [
  { label: 'Natural Diamond', value: 'natural-diamond' },
  { label: 'Lab Diamond', value: 'lab-diamond' },
  { label: 'Moissanite', value: 'moissanite' },
  { label: 'Sapphire', value: 'sapphire' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Emerald', value: 'emerald' },
];

const CLARITY = { 'natural-diamond': 'VS1 reference', 'lab-diamond': 'VS1 reference', moissanite: 'Eye-clean', sapphire: 'Eye-clean', ruby: 'Slight inclusions typical', emerald: 'Jardin expected' };
const COLOUR_GRADE = { 'natural-diamond': 'G–H near-colourless', 'lab-diamond': 'G–H near-colourless', moissanite: 'Near-colourless', sapphire: 'Royal blue', ruby: 'Pigeon-blood red', emerald: 'Vivid green' };

export function createStonesAct(sectionEl, state) {
  let THREE; let scene; let camera; let quality; let envMap;
  let piece; let loose; let sparks; const setting = { x: 0, y: 0.45, z: 0 };
  let stoneKey = 'natural-diamond'; let carat = 1.0;
  let placed = false; let panelInfo;
  let dragging = false;

  function rebuildPiece() {
    if (piece) scene.remove(piece);
    const st = state.get();
    piece = buildForm(THREE, st.form || 'ring', { alloyKey: st.alloy, finish: st.finish, stoneKey: placed ? stoneKey : null, stoneCarat: carat });
    scene.add(piece);
  }

  function makeLoose() {
    if (loose) scene.remove(loose);
    const r = 0.18 * Math.cbrt(carat);
    const geo = new THREE.OctahedronGeometry(r, 0);
    loose = new THREE.Mesh(geo, makeGemMaterial(THREE, stoneKey));
    loose.position.set(-1.8, -0.6, 0.5);
    scene.add(loose);
    placed = false;
    rebuildPiece();
  }

  function updateInfo() {
    const s = STONES[stoneKey];
    const [lo, hi] = s.pricePerCaratCAD;
    panelInfo.innerHTML = `
      <div class="gem-stat"><span>Carat</span><strong>${carat.toFixed(2)} ct</strong></div>
      <div class="gem-stat"><span>Cut</span><strong>Round brilliant</strong></div>
      <div class="gem-stat"><span>Colour</span><strong>${COLOUR_GRADE[stoneKey]}</strong></div>
      <div class="gem-stat"><span>Clarity</span><strong>${CLARITY[stoneKey]}</strong></div>
      <div class="gem-stat gem-price"><span>Typical range</span><strong>${fmtCAD(lo * carat)}–${fmtCAD(hi * carat)}</strong></div>
      <p class="gem-blurb">${s.blurb}</p>
      <small>Indicative range for a stone of this size — not a quote.</small>`;
  }

  function placeStone() {
    if (placed) return;
    placed = true;
    state.set({ stone: stoneKey, stoneCarat: carat });
    rebuildPiece();
    if (loose) { loose.visible = false; }
    sparks.points.position.set(0, 0.45, 1.0);
    sparks.points.visible = true;
    sparks._t = 0.9;
  }

  return {
    id: 'stones',
    sectionEl,
    scene: null,
    camera: null,
    init(ctx) {
      THREE = ctx.THREE; quality = ctx.quality; envMap = ctx.envMap;
      const s = makeScene(THREE, ctx.size, { camZ: 3.6, camY: 1.5, envMap });
      scene = s.scene; camera = s.camera;

      rebuildPiece();
      makeLoose();

      sparks = createParticles(THREE, { kind: 'sparks', count: 80, area: 0.5, quality });
      sparks.points.visible = false;
      scene.add(sparks.points);

      const panel = makePanel(sectionEl, 'act-panel--stones');
      panel.appendChild(pillGroup('Stone', STONE_OPTS, (v) => { stoneKey = v; makeLoose(); updateInfo(); }, 'natural-diamond'));

      const caratRow = document.createElement('div');
      caratRow.className = 'carat-row';
      caratRow.innerHTML = `
        <label class="pill-group-label" for="carat">Carat: <span class="carat-val">1.00</span> ct</label>
        <input id="carat" type="range" min="0.5" max="2" step="0.1" value="1" class="carat-slider">`;
      panel.appendChild(caratRow);
      const slider = caratRow.querySelector('#carat');
      slider.addEventListener('input', () => {
        carat = parseFloat(slider.value);
        caratRow.querySelector('.carat-val').textContent = carat.toFixed(2);
        makeLoose(); updateInfo();
      });

      const placeBtn = document.createElement('button');
      placeBtn.type = 'button';
      placeBtn.className = 'place-btn';
      placeBtn.textContent = 'Set the stone';
      placeBtn.addEventListener('click', placeStone);
      panel.appendChild(placeBtn);

      panelInfo = document.createElement('div');
      panelInfo.className = 'gem-info';
      panel.appendChild(panelInfo);
      updateInfo();

      // Drag loose stone toward the setting; snap when close.
      const el = ctx.renderer.domElement;
      const ray = new THREE.Raycaster();
      const ptr = new THREE.Vector2();
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.5);
      const hitPt = new THREE.Vector3();
      el.addEventListener('pointerdown', (e) => {
        if (this.scene !== scene || placed) return;
        const rect = el.getBoundingClientRect();
        ptr.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        ray.setFromCamera(ptr, camera);
        if (ray.intersectObject(loose).length) dragging = true;
      });
      window.addEventListener('pointerup', () => {
        if (dragging && loose && !placed) {
          const d = Math.hypot(loose.position.x - setting.x, loose.position.y - setting.y);
          if (d < 0.6) placeStone();
        }
        dragging = false;
      });
      window.addEventListener('pointermove', (e) => {
        if (!dragging || placed) return;
        const rect = el.getBoundingClientRect();
        ptr.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        ray.setFromCamera(ptr, camera);
        ray.ray.intersectPlane(plane, hitPt);
        loose.position.set(hitPt.x, hitPt.y, 0.5);
        // Magnetic pull when near.
        const d = Math.hypot(loose.position.x - setting.x, loose.position.y - setting.y);
        if (d < 0.6) { loose.position.x += (setting.x - loose.position.x) * 0.3; loose.position.y += (setting.y - loose.position.y) * 0.3; }
      });

      this.scene = scene; this.camera = camera;
    },
    enter() { rebuildPiece(); if (!placed) makeLoose(); },
    update(_p, dt) {
      if (piece) piece.rotation.y += dt * 0.4;
      if (loose && loose.visible) loose.rotation.y += dt * 1.5;
      if (sparks.points.visible) {
        sparks._t -= dt; sparks.update(dt);
        if (sparks._t <= 0) sparks.points.visible = false;
      }
    },
    exit() {},
    dispose() { sparks.dispose(); if (piece) scene.remove(piece); if (loose) scene.remove(loose); this.scene = null; },
  };
}
