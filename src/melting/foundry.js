// The foundry: builds the whole workbench inside a mount element and wires the
// mix state → crucible + live scale → Smelt → solver → result card.

import { METALS, METAL_ORDER } from '../data/metals.js';
import { RECIPES } from '../data/recipes.js';
import { solveAlloy, meltValueCAD } from '../lib/alloy-solver.js';
import { fetchSpotPrices } from '../data/prices.js';
import { createCrucible } from './crucible.js';

const MAX_G = 250;
const GRAINS_PER_G = 5; // visual grains per gram

function fmtCAD(n) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 }).format(n);
}
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

export function createFoundry(mount, config = {}) {
  const mix = {};                 // { metalKey: grams }
  let prices = null;
  const contactUrl = config.contactUrl || '/contact';

  mount.innerHTML = `
    <div class="mp-rack" role="group" aria-label="Raw metal stock — press and hold to pour"></div>
    <div class="mp-stage">
      <div class="mp-crucible-wrap">
        <canvas class="mp-crucible" aria-hidden="true"></canvas>
        <p class="mp-hint">Press &amp; hold a jar to pour · tap for a 2&nbsp;g pinch</p>
      </div>
      <div class="mp-scale">
        <div class="mp-scale-head">On the scale</div>
        <div class="mp-weight"><strong class="mp-grams">0</strong><span> g / ${MAX_G} g</span></div>
        <div class="mp-live"><span class="mp-karat">—</span><span class="mp-value">$0.00</span></div>
        <div class="mp-value-note">Live melt value of the precious metal · market spot, not a buying rate</div>
        <div class="mp-actions">
          <button type="button" class="mp-smelt" disabled>Smelt</button>
          <button type="button" class="mp-empty">Empty tray</button>
        </div>
      </div>
    </div>
    <div class="mp-result" hidden aria-live="polite"></div>
    <div class="mp-classics">
      <div class="mp-classics-label">Or load a bench classic — famous alloys, poured for you</div>
      <div class="mp-chips"></div>
    </div>`;

  const rackEl = mount.querySelector('.mp-rack');
  const canvas = mount.querySelector('.mp-crucible');
  const gramsEl = mount.querySelector('.mp-grams');
  const karatEl = mount.querySelector('.mp-karat');
  const valueEl = mount.querySelector('.mp-value');
  const smeltBtn = mount.querySelector('.mp-smelt');
  const emptyBtn = mount.querySelector('.mp-empty');
  const resultEl = mount.querySelector('.mp-result');
  const chipsEl = mount.querySelector('.mp-chips');

  const crucible = createCrucible(canvas);

  function totalGrams() { return Object.values(mix).reduce((a, b) => a + b, 0); }

  function pour(metalKey, grams) {
    if (crucible.getPhase() !== 'idle') return;
    const room = MAX_G - totalGrams();
    grams = Math.min(grams, room);
    if (grams <= 0) return;
    mix[metalKey] = (mix[metalKey] || 0) + grams;
    crucible.addGrain(metalKey, Math.round(grams * GRAINS_PER_G));
    resultEl.hidden = true;
    refresh();
  }

  function refresh() {
    const total = totalGrams();
    gramsEl.textContent = Math.round(total);
    const r = solveAlloy(mix);
    karatEl.textContent = r.family === 'gold' ? `${r.karat}K ${r.colour.toLowerCase()}` : (r.family === 'empty' ? '—' : r.colour);
    valueEl.textContent = prices ? fmtCAD(meltValueCAD(mix, prices)) : '—';
    smeltBtn.disabled = total <= 0 || crucible.getPhase() !== 'idle';
  }

  // ---- Jar rack ----
  METAL_ORDER.forEach((key) => {
    const m = METALS[key];
    const jar = el('button', 'mp-jar');
    jar.type = 'button';
    jar.setAttribute('aria-label', `${m.name} — hold to pour, tap for 2 grams`);
    jar.innerHTML = `
      <span class="mp-jar-grain" style="--grain:#${m.colourHex.toString(16).padStart(6, '0')}"></span>
      <span class="mp-jar-name">${m.name}</span>
      <span class="mp-jar-meta">${m.symbol} · melts ${m.meltC}°C</span>`;

    // Press-and-hold pours continuously; a quick tap drops a 2 g pinch.
    let holdTimer = null; let poured = 0; let held = false;
    const start = (e) => {
      e.preventDefault();
      held = false; poured = 0;
      holdTimer = setInterval(() => { held = true; pour(key, 3); poured += 3; }, 90);
    };
    const end = () => {
      if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
      if (!held && poured === 0) pour(key, 2); // tap = pinch
    };
    jar.addEventListener('pointerdown', start);
    jar.addEventListener('pointerup', end);
    jar.addEventListener('pointerleave', () => { if (holdTimer) { clearInterval(holdTimer); holdTimer = null; } });
    jar.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pour(key, 5); } });
    rackEl.appendChild(jar);
  });

  // ---- Smelt / Empty ----
  smeltBtn.addEventListener('click', () => {
    if (totalGrams() <= 0) return;
    const r = solveAlloy(mix);
    smeltBtn.disabled = true; emptyBtn.disabled = true;
    crucible.smelt(r.colourHex, () => {
      showResult(r);
      emptyBtn.disabled = false;
    });
  });
  emptyBtn.addEventListener('click', () => {
    for (const k of Object.keys(mix)) delete mix[k];
    crucible.empty();
    resultEl.hidden = true;
    refresh();
  });

  // ---- Bench classics ----
  RECIPES.forEach((recipe) => {
    const chip = el('button', 'mp-chip', recipe.name);
    chip.type = 'button';
    chip.addEventListener('click', () => {
      emptyBtn.click();
      // Pour ~60 g total in the recipe's proportions.
      const scale = 60 / 100;
      for (const [k, p] of Object.entries(recipe.mix)) pour(k, +(p * scale).toFixed(1));
    });
    chipsEl.appendChild(chip);
  });

  // ---- Result card ----
  function showResult(r) {
    const value = prices ? meltValueCAD(mix, prices) : null;
    const swatch = '#' + r.colourHex.toString(16).padStart(6, '0');
    resultEl.innerHTML = `
      <div class="mp-result-card">
        <div class="mp-result-top">
          <span class="mp-swatch" style="background:${swatch}"></span>
          <div>
            <div class="mp-result-kicker">${r.recognized ? 'You poured a recognised alloy' : 'Out of the crucible'}</div>
            <h3 class="mp-result-title">${r.title}</h3>
          </div>
        </div>
        <div class="mp-result-grid">
          ${r.karat ? `<div><span>Karat</span><strong>${r.karat}K · ${Math.round(r.pct.au || 0)}% gold</strong></div>` : ''}
          <div><span>Colour</span><strong>${r.colour}</strong></div>
          <div><span>Hardness</span><strong>${r.hardness}</strong></div>
          <div><span>Wearable</span><strong>${r.wearable ? 'Yes' : 'Not really'}</strong></div>
          <div><span>Weight</span><strong>${Math.round(r.total)} g</strong></div>
          ${value != null ? `<div><span>Melt value</span><strong>${fmtCAD(value)}</strong></div>` : ''}
        </div>
        <div class="mp-verdict"><span class="mp-verdict-by">Daniel’s verdict</span><p>${r.verdict}</p></div>
        <div class="mp-science"><span class="mp-science-by">The science</span><p>${r.bio}</p></div>
        ${r.facts.map((f) => `<p class="mp-fact">${f}</p>`).join('')}
        <a class="mp-cta" href="${contactUrl}">Have Daniel cast this for real →</a>
      </div>`;
    resultEl.hidden = false;
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    refresh();
  }

  // ---- Live prices ----
  fetchSpotPrices().then((p) => { prices = p; refresh(); }).catch(() => { prices = null; refresh(); });

  refresh();
  return { destroy() { crucible.destroy(); } };
}
