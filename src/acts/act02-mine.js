// Act 2 — Mine: a dark rock face threaded with gold veins. Click/tap/Enter a
// vein to fracture its chunk; nuggets tumble to a ledge and the gram counter
// climbs. Six veins → ~15 g. Keyboard-first: veins are real buttons.

import { makeScene, makePanel } from './common.js';

const VEIN_COUNT = 6;

export function createMineAct(sectionEl, state) {
  let THREE; let scene; let camera; let quality;
  const chunks = [];
  const nuggets = [];
  let counterEl; let promptEl; let factWrap;
  let grams = 0; let mined = 0; let displayGrams = 0;

  const FACTS = [
    'All the gold ever mined would fit in a cube about 22 m on each side.',
    'A tonne of gold ore typically yields around one gram of gold.',
    'Gold is so dense a cubic foot weighs over half a tonne.',
    'Nearly all gold on Earth arrived via asteroid impacts ~4 billion years ago.',
    'Gold never rusts or tarnishes — the ring you make could outlast cities.',
    'About 30% of new gold each year is recycled from older jewellery.',
  ];

  function rockMaterial() {
    return new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.95, metalness: 0.0, flatShading: true });
  }
  function goldMaterial() {
    return new THREE.MeshStandardMaterial({ color: 0xf3cb7a, roughness: 0.3, metalness: 1, emissive: 0x3a2600, emissiveIntensity: 0.4 });
  }

  function mineVein(i) {
    const chunk = chunks[i];
    if (!chunk || chunk.userData.mined) return;
    chunk.userData.mined = true;

    // Fracture: shards fly out.
    chunk.userData.shards.forEach((s) => {
      s.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2 + 1, Math.random() * 2 + 1);
      s.userData.spin = new THREE.Vector3(Math.random(), Math.random(), Math.random());
    });

    // Drop 2-3 nuggets.
    const n = 2 + Math.floor(Math.random() * 2);
    for (let k = 0; k < n; k++) {
      const nug = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12 + Math.random() * 0.06, 0), goldMaterial());
      nug.position.copy(chunk.position).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0, 0.3));
      nug.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.5, Math.random());
      nug.userData.rest = -1.6 + Math.random() * 0.1;
      scene.add(nug);
      nuggets.push(nug);
    }
    const add = 2 + Math.random() * 1.2;
    grams += add;

    mined++;
    if (factWrap.children[mined - 1]) factWrap.children[mined - 1].classList.add('is-shown');
    if (mined >= VEIN_COUNT) promptEl.classList.add('is-shown');
  }

  return {
    id: 'mine',
    sectionEl,
    scene: null,
    camera: null,
    init(ctx) {
      THREE = ctx.THREE; quality = ctx.quality;
      const s = makeScene(THREE, ctx.size, { camZ: 6, envMap: ctx.envMap });
      scene = s.scene; camera = s.camera;
      scene.background = new THREE.Color(0x0b0908);

      // Rock face: scattered flat-shaded chunks; six carry a glowing vein.
      const veinButtons = [];
      const panel = makePanel(sectionEl, 'act-panel--mine');
      counterEl = document.createElement('output');
      counterEl.className = 'gram-counter';
      counterEl.textContent = '0.00 g';
      panel.appendChild(counterEl);

      const btnRow = document.createElement('div');
      btnRow.className = 'vein-buttons';
      btnRow.setAttribute('role', 'group');
      btnRow.setAttribute('aria-label', 'Gold veins — activate to mine');
      panel.appendChild(btnRow);

      for (let i = 0; i < VEIN_COUNT; i++) {
        const chunk = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 + Math.random() * 0.3, 0), rockMaterial());
        const ang = (i / VEIN_COUNT) * Math.PI * 2;
        chunk.position.set(Math.cos(ang) * 2.2, Math.sin(ang) * 1.4, 0);
        chunk.rotation.set(Math.random() * 3, Math.random() * 3, 0);

        const vein = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.09), goldMaterial());
        vein.position.set(0, 0, 0.75);
        vein.rotation.z = Math.random() * Math.PI;
        chunk.add(vein);
        chunk.userData.vein = vein;

        // Precompute shards for the fracture.
        chunk.userData.shards = [];
        for (let sIdx = 0; sIdx < 6; sIdx++) {
          const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(0.28), rockMaterial());
          shard.visible = false;
          chunk.add(shard);
          chunk.userData.shards.push(shard);
        }
        scene.add(chunk);
        chunks.push(chunk);

        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'vein-btn';
        b.textContent = `Strike vein ${i + 1}`;
        b.addEventListener('click', () => { mineVein(i); b.disabled = true; b.textContent = `Vein ${i + 1} ✓`; });
        btnRow.appendChild(b);
        veinButtons.push(b);
      }

      factWrap = document.createElement('div');
      factWrap.className = 'mine-facts';
      FACTS.forEach((f) => {
        const p = document.createElement('p');
        p.className = 'mine-fact';
        p.textContent = f;
        factWrap.appendChild(p);
      });
      panel.appendChild(factWrap);

      promptEl = document.createElement('p');
      promptEl.className = 'act-prompt';
      promptEl.textContent = 'Carry your gold to the furnace ↓';
      panel.appendChild(promptEl);

      // Click veins directly in the 3D scene too.
      const ray = new THREE.Raycaster();
      const ptr = new THREE.Vector2();
      ctx.renderer.domElement.addEventListener('pointerdown', (e) => {
        if (this.scene !== scene) return;
        const rect = ctx.renderer.domElement.getBoundingClientRect();
        ptr.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        ray.setFromCamera(ptr, camera);
        const hit = ray.intersectObjects(chunks, true)[0];
        if (hit) {
          const idx = chunks.indexOf(hit.object.parent) >= 0 ? chunks.indexOf(hit.object.parent) : chunks.indexOf(hit.object);
          if (idx >= 0 && !veinButtons[idx].disabled) veinButtons[idx].click();
        }
      });

      this.scene = scene; this.camera = camera;
    },
    enter() {},
    update(_p, dt) {
      const t = performance.now() * 0.003;
      chunks.forEach((c) => {
        if (!c.userData.mined) {
          c.userData.vein.material.emissiveIntensity = 0.35 + Math.sin(t + c.position.x) * 0.25;
        } else {
          c.userData.shards.forEach((s) => {
            if (s.userData.vel) {
              s.visible = true;
              s.userData.vel.y -= dt * 4;
              s.position.addScaledVector(s.userData.vel, dt);
              s.rotation.x += s.userData.spin.x * dt * 3;
              s.rotation.y += s.userData.spin.y * dt * 3;
            }
          });
        }
      });
      nuggets.forEach((n) => {
        if (n.position.y > n.userData.rest) {
          n.userData.vel.y -= dt * 5;
          n.position.addScaledVector(n.userData.vel, dt);
          n.rotation.x += dt; n.rotation.y += dt * 1.3;
          if (n.position.y <= n.userData.rest) { n.position.y = n.userData.rest; n.userData.vel.set(0, 0, 0); }
        }
      });
      // Smooth counter.
      displayGrams += (grams - displayGrams) * Math.min(1, dt * 6);
      counterEl.textContent = displayGrams.toFixed(2) + ' g';
      state.set({ grams: Math.round(grams * 100) / 100 });
    },
    exit() {},
    dispose() {
      chunks.forEach((c) => scene.remove(c));
      nuggets.forEach((n) => scene.remove(n));
      chunks.length = 0; nuggets.length = 0;
      this.scene = null;
    },
  };
}
