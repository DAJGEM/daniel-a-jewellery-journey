// Act 9 — Prove it's real. Six professional authenticity tests run side by side
// on a genuine gold chain and a plated fake, each with a plain-language verdict
// on why fakes fail. Closes into appraisals / gold-buying.

import { makeScene, makePanel } from './common.js';
import { glow } from '../lib/blackbody.js';
import { createParticles } from '../lib/particles.js';

const TESTS = [
  { id: 'flame', label: 'Flame', real: 'Stays bright — pure gold is unreactive and simply glows, then cools unchanged.', fake: 'Darkens and oxidises. Base metals under the plating scorch and discolour.' },
  { id: 'acid', label: 'Acid', real: 'No reaction. Nitric acid can’t dissolve gold at this karat.', fake: 'Fizzes and turns green — the acid attacks the copper and zinc beneath.' },
  { id: 'magnet', label: 'Magnet', real: 'Ignores the magnet. Gold is not magnetic.', fake: 'Jumps to the magnet — a giveaway that there’s steel or nickel inside.' },
  { id: 'density', label: 'Density', real: '19.3 g/cm³ by water displacement — matches solid gold exactly.', fake: '~8.5 g/cm³. Far too light; the volume gives the base metal away.' },
  { id: 'ultrasonic', label: 'Ultrasonic', real: 'Clean, even echo — the metal is solid all the way through.', fake: 'Scattered echo reveals a hollow core or a plating boundary.' },
  { id: 'xrf', label: 'XRF Scanner', real: 'Au 75.0% · Ag 12.5% · Cu 12.5% — reads as genuine 18K.', fake: 'Cu 60% · Zn 37% · Au 0.5% — gold only in the microns-thin plating.' },
];

export function createTestAct(sectionEl, state) {
  let THREE; let scene; let camera; let quality; let envMap;
  let realChain; let fakeChain; let flame; let magnet; let sparks;
  let activeTest = null; let testT = 0;

  function chain(colourHex, roughness) {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ color: colourHex, metalness: 1, roughness });
    for (let i = 0; i < 12; i++) {
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.05, 10, 20), mat);
      link.position.y = 0.9 - i * 0.16;
      link.rotation.y = i % 2 ? Math.PI / 2 : 0;
      g.add(link);
    }
    g.userData.mat = mat;
    return g;
  }

  function runTest(id) {
    activeTest = id; testT = 0;
    flame.visible = id === 'flame';
    magnet.visible = id === 'magnet';
    sparks.points.visible = false;
    // Reset colours.
    realChain.userData.mat.color.setHex(0xf3cb7a);
    fakeChain.userData.mat.color.setHex(0xc9a86a);
    magnet.position.set(2.4, 0.4, 0);
  }

  return {
    id: 'test',
    sectionEl,
    scene: null,
    camera: null,
    init(ctx) {
      THREE = ctx.THREE; quality = ctx.quality; envMap = ctx.envMap;
      const s = makeScene(THREE, ctx.size, { camZ: 5, envMap });
      scene = s.scene; camera = s.camera;

      realChain = chain(0xf3cb7a, 0.25); realChain.position.x = -1.1;
      fakeChain = chain(0xc9a86a, 0.4); fakeChain.position.x = 1.1;
      scene.add(realChain, fakeChain);

      // Labels via sprites.
      [['SOLID GOLD', -1.1], ['SUSPECT', 1.1]].forEach(([txt, x]) => {
        const c = document.createElement('canvas'); c.width = 256; c.height = 64;
        const cx = c.getContext('2d'); cx.fillStyle = '#d8c48a'; cx.font = '28px Montserrat'; cx.textAlign = 'center'; cx.fillText(txt, 128, 40);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
        sp.position.set(x, 1.5, 0); sp.scale.set(1.4, 0.35, 1); scene.add(sp);
      });

      flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.8, 16), new THREE.MeshBasicMaterial({ color: 0x59a0ff, transparent: true, opacity: 0.8 }));
      flame.position.set(-1.1, -0.4, 0.4); flame.visible = false; scene.add(flame);

      magnet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.2), new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: 0.4, roughness: 0.5 }));
      magnet.visible = false; scene.add(magnet);

      sparks = createParticles(THREE, { kind: 'sparks', count: 40, area: 0.4, quality });
      sparks.points.visible = false; scene.add(sparks.points);

      const panel = makePanel(sectionEl, 'act-panel--test');
      const grid = document.createElement('div');
      grid.className = 'test-grid';
      panel.appendChild(grid);
      const verdict = document.createElement('div');
      verdict.className = 'test-verdict';
      panel.appendChild(verdict);

      TESTS.forEach((t) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'test-btn'; b.textContent = t.label;
        b.addEventListener('click', () => {
          runTest(t.id);
          grid.querySelectorAll('.test-btn').forEach((x) => x.classList.remove('is-active'));
          b.classList.add('is-active');
          verdict.innerHTML = `
            <div class="verdict real"><span class="verdict-tag">✓ Genuine</span><p>${t.real}</p></div>
            <div class="verdict fake"><span class="verdict-tag">✕ Fake</span><p>${t.fake}</p></div>`;
        });
        grid.appendChild(b);
      });

      const cta = document.createElement('p');
      cta.className = 'test-cta';
      cta.innerHTML = 'We test every piece we buy or appraise. <a class="journey-link" data-link="contact">Bring yours in →</a>';
      panel.appendChild(cta);

      this.scene = scene; this.camera = camera;
    },
    enter() {},
    update(_p, dt) {
      testT += dt;
      realChain.rotation.y += dt * 0.3; fakeChain.rotation.y += dt * 0.3;
      if (activeTest === 'flame' && flame.visible) {
        flame.scale.y = 1 + Math.sin(testT * 20) * 0.15;
        const g = glow(1000);
        realChain.userData.mat.emissive?.setRGB(g.r / 255, g.g / 255, 0);
        // Fake darkens.
        fakeChain.userData.mat.color.lerp(new THREE.Color(0x4a3a20), Math.min(1, dt * 0.6));
      }
      if (activeTest === 'magnet' && magnet.visible) {
        magnet.position.x = 2.4 - Math.min(1.1, testT * 0.8);
        // Fake chain leans toward magnet.
        fakeChain.rotation.z = -Math.min(0.4, testT * 0.3);
        if (testT > 1.4) { sparks.points.visible = false; }
      }
      if (activeTest === 'acid') {
        if (testT < 1.5) { sparks.points.position.set(1.1, 0, 0.3); sparks.points.visible = true; sparks.update(dt); }
        fakeChain.userData.mat.color.lerp(new THREE.Color(0x2f6a3a), Math.min(1, dt * 0.4));
      }
    },
    exit() {},
    dispose() { sparks.dispose(); scene.remove(realChain, fakeChain, flame, magnet); this.scene = null; },
  };
}
