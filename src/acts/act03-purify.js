// Act 3 — Purify: press and hold to heat the crucible. Temperature climbs, the
// nuggets glow along the real black-body curve, and melt happens exactly at
// gold's melting point, 1,064 °C. Then a "99.99% PURE" stamp lands.

import { makeScene, makePanel } from './common.js';
import { glow } from '../lib/blackbody.js';
import { createParticles } from '../lib/particles.js';

const MELT_C = 1064;
const MAX_C = 1120;

export function createPurifyAct(sectionEl, state) {
  let THREE; let scene; let camera; let quality;
  let crucible; let nuggets; let pool; let embers;
  let gaugeFill; let gaugeLabel; let stampEl; let heatBtn;
  let tempC = 20; let heating = false; let melted = false;

  return {
    id: 'purify',
    sectionEl,
    scene: null,
    camera: null,
    init(ctx) {
      THREE = ctx.THREE; quality = ctx.quality;
      const s = makeScene(THREE, ctx.size, { camZ: 5.5, camY: 0.6, envMap: ctx.envMap });
      scene = s.scene; camera = s.camera;

      // Crucible: a dark ceramic bowl (lathe).
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        pts.push(new THREE.Vector2(0.2 + t * 1.1, t * 1.1 - 0.4));
      }
      crucible = new THREE.Mesh(
        new THREE.LatheGeometry(pts, 48),
        new THREE.MeshStandardMaterial({ color: 0x1b1613, roughness: 0.85, metalness: 0.1, side: THREE.DoubleSide }),
      );
      crucible.position.y = -0.6;
      scene.add(crucible);

      // Nuggets clustered in the bowl.
      nuggets = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        const nug = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.16 + Math.random() * 0.08, 0),
          new THREE.MeshStandardMaterial({ color: 0xf3cb7a, metalness: 1, roughness: 0.35, emissive: 0x000000 }),
        );
        nug.position.set((Math.random() - 0.5) * 0.7, -0.35 + Math.random() * 0.15, (Math.random() - 0.5) * 0.7);
        nuggets.add(nug);
      }
      scene.add(nuggets);

      // Molten pool (hidden until melt).
      pool = new THREE.Mesh(
        new THREE.CircleGeometry(0.95, 48),
        new THREE.MeshStandardMaterial({ color: 0xffb038, emissive: 0xff7a10, emissiveIntensity: 2, roughness: 0.25, metalness: 1 }),
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.y = -0.45;
      pool.scale.setScalar(0.01);
      scene.add(pool);

      embers = createParticles(THREE, { kind: 'embers', count: 120, area: 2.2, quality });
      embers.points.position.y = -0.2;
      scene.add(embers.points);
      embers.setRate(0);

      // UI: gauge + heat button + stamp.
      const panel = makePanel(sectionEl, 'act-panel--purify');
      const gauge = document.createElement('div');
      gauge.className = 'temp-gauge';
      gauge.innerHTML = '<div class="temp-track"><div class="temp-fill"></div><span class="temp-melt-line" title="Gold melts at 1064°C">1064°C</span></div>';
      gaugeLabel = document.createElement('output');
      gaugeLabel.className = 'temp-readout';
      gaugeLabel.textContent = '20 °C';
      panel.appendChild(gaugeLabel);
      panel.appendChild(gauge);
      gaugeFill = gauge.querySelector('.temp-fill');

      heatBtn = document.createElement('button');
      heatBtn.type = 'button';
      heatBtn.className = 'heat-btn';
      heatBtn.textContent = 'Hold to heat';
      const on = () => { heating = true; heatBtn.classList.add('is-heating'); };
      const off = () => { heating = false; heatBtn.classList.remove('is-heating'); };
      heatBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); on(); });
      window.addEventListener('pointerup', off);
      heatBtn.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); on(); } });
      heatBtn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') off(); });
      panel.appendChild(heatBtn);

      stampEl = document.createElement('div');
      stampEl.className = 'purity-stamp';
      stampEl.textContent = '99.99% PURE';
      panel.appendChild(stampEl);

      this.scene = scene; this.camera = camera;
    },
    enter() {},
    update(_p, dt) {
      // Heat / cool.
      if (heating && tempC < MAX_C) tempC = Math.min(MAX_C, tempC + dt * 150);
      else if (!heating && tempC > 20) tempC = Math.max(20, tempC - dt * 60);

      const g = glow(tempC);
      const emissive = new THREE.Color(g.r / 255, g.g / 255, g.b / 255);
      nuggets.children.forEach((n) => {
        n.material.emissive.copy(emissive);
        n.material.emissiveIntensity = g.intensity * 2.2;
      });
      embers.setRate(g.intensity);
      if (g.intensity > 0) embers.update(dt);

      gaugeFill.style.height = `${((tempC - 20) / (MAX_C - 20)) * 100}%`;
      gaugeFill.style.background = `rgb(${g.r},${Math.max(40, g.g)},${g.b})`;
      gaugeLabel.textContent = `${Math.round(tempC)} °C`;

      // Melt exactly at 1064.
      if (tempC >= MELT_C && !melted) {
        melted = true;
        state.set({ purified: true });
        stampEl.classList.add('is-shown');
        pool.scale.setScalar(1);
      }
      if (melted) {
        nuggets.children.forEach((n) => { n.scale.multiplyScalar(1 - Math.min(0.06, dt * 1.5)); });
        pool.material.emissiveIntensity = 1.6 + Math.sin(performance.now() * 0.004) * 0.4;
      }
      crucible.rotation.y += dt * 0.1;
    },
    exit() {},
    dispose() {
      embers.dispose();
      scene.remove(crucible, nuggets, pool, embers.points);
      this.scene = null;
    },
  };
}
