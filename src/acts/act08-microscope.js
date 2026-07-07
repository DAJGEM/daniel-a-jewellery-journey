// Act 8 — Under the microscope. A zoom slider (1×–1000×) dollies the camera into
// the band; as thresholds pass, reveal layers appear inside the microscope
// reticle — hallmark, laser inscription, grain structure and (if set) an
// inclusion. Builds trust: this is the magnification we actually inspect at.

import { makeScene, makePanel } from './common.js';
import { buildForm } from '../lib/geometry.js';
import { ALLOYS } from '../data/alloys.js';

function hallmarkFor(alloyKey) {
  if (alloyKey.startsWith('platinum')) return 'PT950';
  const purity = ALLOYS[alloyKey]?.purity || 0.75;
  return String(Math.round(purity * 1000)); // 750, 585, 916, 999
}

export function createMicroscopeAct(sectionEl, state) {
  let THREE; let scene; let camera; let envMap;
  let piece; let reticle; let layerEls = [];
  let zoom = 1; let targetZoom = 1;

  // Reveal layers rendered as crisp DOM inside the reticle so the fine detail
  // stays legible at any zoom (3D decals get clipped as the camera dollies in).
  function buildLayers() {
    layerEls.forEach((l) => l.el.remove());
    layerEls = [];
    const st = state.get();

    const add = (at, html, cls) => {
      const el = document.createElement('div');
      el.className = `micro-layer ${cls}`;
      el.innerHTML = html;
      reticle.appendChild(el);
      layerEls.push({ el, at });
    };

    add(10, `<span class="micro-hallmark">&#9672; ${hallmarkFor(st.alloy)}</span><small>maker's hallmark &amp; purity stamp</small>`, 'layer-hallmark');
    add(90, `<span class="micro-inscription">${st.engraving || 'Daniel A Jewellery'}</span><small>laser inscription</small>`, 'layer-inscription');
    add(350, `<span class="micro-grain"></span><small>grain structure of the alloy</small>`, 'layer-grain');
    if (st.stone) add(700, `<span class="micro-inclusion"></span><small>a natural inclusion inside the stone</small>`, 'layer-inclusion');
  }

  return {
    id: 'microscope',
    sectionEl,
    scene: null,
    camera: null,
    init(ctx) {
      THREE = ctx.THREE; envMap = ctx.envMap;
      const s = makeScene(THREE, ctx.size, { camZ: 4, envMap });
      scene = s.scene; camera = s.camera;

      const st = state.get();
      piece = buildForm(THREE, st.form || 'ring', { alloyKey: st.alloy, finish: st.finish, stoneKey: st.stone, stoneCarat: st.stoneCarat });
      scene.add(piece);

      reticle = document.createElement('div');
      reticle.className = 'microscope-reticle';
      reticle.style.display = 'none'; // only visible while this act is on stage
      sectionEl.appendChild(reticle);
      buildLayers();

      const panel = makePanel(sectionEl, 'act-panel--micro');
      const row = document.createElement('div');
      row.innerHTML = `
        <label class="pill-group-label" for="zoom">Magnification: <span class="zoom-val">1×</span></label>
        <input id="zoom" type="range" min="0" max="1" step="0.001" value="0" class="zoom-slider">
        <p class="micro-caption">This is the magnification we inspect every piece at.</p>`;
      panel.appendChild(row);
      const slider = row.querySelector('#zoom');
      slider.addEventListener('input', () => {
        const v = parseFloat(slider.value);
        targetZoom = Math.pow(10, v * 3); // 1 → 1000 (log)
        row.querySelector('.zoom-val').textContent = Math.round(targetZoom) + '×';
      });

      this.scene = scene; this.camera = camera;
    },
    enter() { buildLayers(); if (reticle) reticle.style.display = 'flex'; },
    update(_p, dt) {
      zoom += (targetZoom - zoom) * Math.min(1, dt * 4);
      // Dolly camera toward the band: 4 units at 1×, ~1.25 at 1000×.
      const z = 4 / (1 + Math.log10(Math.max(1, zoom)) * 0.9);
      camera.position.z = Math.max(1.25, z);
      piece.rotation.y += dt * 0.12;
      // Only the most-magnified matching layer is shown, so they don't stack.
      let topShown = -1;
      layerEls.forEach((l, i) => { if (zoom >= l.at) topShown = i; });
      layerEls.forEach((l, i) => l.el.classList.toggle('is-shown', i === topShown));
    },
    exit() { if (reticle) reticle.style.display = 'none'; },
    dispose() { layerEls.forEach((l) => l.el.remove()); if (piece) scene.remove(piece); reticle?.remove(); this.scene = null; },
  };
}
