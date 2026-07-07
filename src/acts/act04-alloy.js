// Act 4 — Choose the alloy. Karat + colour selectors reshape a test ingot's
// material live, and a side panel reports hardness, durability, maintenance and
// the metal's live market value in CAD (falls back gracefully if prices fail).

import { makeScene, makePanel, pillGroup, fmtCAD } from './common.js';
import { ALLOYS, alloyValueCAD } from '../data/alloys.js';
import { makeMetalMaterial } from '../lib/materials.js';
import { fetchSpotPrices } from '../data/prices.js';

// Shared once across acts that need spot prices.
let pricePromise = null;
export function getPrices() {
  if (!pricePromise) pricePromise = fetchSpotPrices().catch(() => null);
  return pricePromise;
}

const KARATS = [
  { label: '14K', value: '14k' },
  { label: '18K', value: '18k' },
  { label: '22K', value: '22k' },
  { label: '24K', value: '24k' },
];
const COLOURS = [
  { label: 'Yellow', value: 'yellow' },
  { label: 'White', value: 'white' },
  { label: 'Rose', value: 'rose' },
];

function resolveKey(karat, colour) {
  // White/rose only exist at 14K and 18K; 22K/24K are always yellow.
  if (karat === '22k' || karat === '24k') return `gold-${karat}-yellow`;
  return `gold-${karat}-${colour}`;
}

export function createAlloyAct(sectionEl, state) {
  let THREE; let scene; let camera;
  let ingot; let prices = null;
  let karat = '18k'; let colour = 'yellow';
  let valueEl; let hardBar; let durBar; let maintEl; let blurbEl; let colourGroup;

  function currentKey() { return resolveKey(karat, colour); }

  function refresh() {
    const key = currentKey();
    const a = ALLOYS[key];
    state.set({ alloy: key });

    const mat = makeMetalMaterial(THREE, { alloyKey: key, finish: 'mirror' });
    ingot.material.dispose();
    ingot.material = mat;

    hardBar.style.width = `${Math.min(100, (a.vickers / 220) * 100)}%`;
    durBar.style.width = `${Math.min(100, (a.vickers / 220) * 100)}%`;
    maintEl.textContent = a.maintenance;
    blurbEl.textContent = a.blurb;

    // Disable white/rose at 22/24K.
    const highKarat = karat === '22k' || karat === '24k';
    colourGroup.querySelectorAll('.pill').forEach((btn) => {
      const isYellow = btn.textContent === 'Yellow';
      btn.disabled = highKarat && !isYellow;
      btn.title = highKarat && !isYellow ? 'Pure golds above 18K are always yellow' : '';
    });

    const grams = state.get().grams || 10;
    if (prices && prices.gold) {
      valueEl.textContent = `${fmtCAD(alloyValueCAD(key, grams, prices.gold.usdPerOz, prices.usdCad))}`;
      valueEl.nextElementSibling.textContent = `market value of ${grams.toFixed(1)} g of metal — not a retail price`;
    } else {
      valueEl.textContent = '—';
      valueEl.nextElementSibling.textContent = 'Live pricing temporarily unavailable — visit us in store for today’s rates';
    }
  }

  return {
    id: 'alloy',
    sectionEl,
    scene: null,
    camera: null,
    init(ctx) {
      THREE = ctx.THREE;
      const s = makeScene(THREE, ctx.size, { camZ: 4.5, envMap: ctx.envMap });
      scene = s.scene; camera = s.camera;

      ingot = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.7, 1.1, 1, 1, 1),
        makeMetalMaterial(THREE, { alloyKey: currentKey(), finish: 'mirror' }),
      );
      ingot.geometry = new THREE.BoxGeometry(2.4, 0.7, 1.1).toNonIndexed();
      scene.add(ingot);

      const panel = makePanel(sectionEl, 'act-panel--alloy');
      const kGroup = pillGroup('Karat', KARATS, (v) => { karat = v; refresh(); }, '18k');
      colourGroup = pillGroup('Colour', COLOURS, (v) => { colour = v; refresh(); }, 'yellow');
      panel.appendChild(kGroup);
      panel.appendChild(colourGroup);

      const stats = document.createElement('div');
      stats.className = 'alloy-stats';
      stats.innerHTML = `
        <div class="stat-row"><span>Hardness</span><div class="meter"><i class="meter-fill meter-hard"></i></div></div>
        <div class="stat-row"><span>Durability</span><div class="meter"><i class="meter-fill meter-dur"></i></div></div>
        <p class="alloy-maint"></p>
        <p class="alloy-blurb"></p>
        <div class="alloy-value"><strong>—</strong><small></small></div>`;
      panel.appendChild(stats);
      hardBar = stats.querySelector('.meter-hard');
      durBar = stats.querySelector('.meter-dur');
      maintEl = stats.querySelector('.alloy-maint');
      blurbEl = stats.querySelector('.alloy-blurb');
      valueEl = stats.querySelector('.alloy-value strong');

      this.scene = scene; this.camera = camera;
      refresh();
      getPrices().then((p) => { prices = p; refresh(); });
    },
    enter() { refresh(); },
    update(_p, dt) {
      ingot.rotation.y += dt * 0.4;
      ingot.rotation.x = Math.sin(performance.now() * 0.0004) * 0.15;
    },
    exit() {},
    dispose() { scene.remove(ingot); this.scene = null; },
  };
}
