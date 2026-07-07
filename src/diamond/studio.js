// The Diamond Studio — Chapter Two. Choose a shape, watch it perform under
// different lighting, compare cut grades, set it and read the specs, with the
// bench gemologist explaining every step.

import {
  SHAPES, SHAPE_ORDER, CUTS, CUT_ORDER, COLOURS, COLOUR_ORDER,
  CLARITIES, CLARITY_ORDER, ENVIRONMENTS, ENV_ORDER, SETTINGS, SETTING_ORDER,
} from '../data/diamonds.js';
import { diamondMm, diamondPriceCAD, lightPerformanceScore, gemologistNote, settingBlurb } from '../lib/diamond-solver.js';
import { createDiamondCanvas } from './diamond-canvas.js';

const fmtCAD = (n) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

export function createStudio(mount, config = {}) {
  const contactUrl = config.contactUrl || '/contact';
  const state = { shape: 'round', cut: 'ideal', colour: 'F', clarity: 'VS', env: 'showroom', carat: 1.0, setting: 'solitaire' };

  mount.innerHTML = `
    <div class="ds-shapes" role="group" aria-label="Choose a diamond shape"></div>
    <div class="ds-stage">
      <div class="ds-viewer">
        <canvas class="ds-canvas" aria-hidden="true"></canvas>
        <div class="ds-env-label"></div>
        <div class="ds-envs" role="group" aria-label="Lighting environment"></div>
      </div>
      <div class="ds-panel">
        <div class="ds-title-row"><h3 class="ds-shape-name">Round Brilliant</h3><span class="ds-score" title="Light performance">—</span></div>
        <div class="ds-specs"></div>
        <div class="ds-controls"></div>
        <div class="ds-gem"><span class="ds-gem-by">The bench gemologist</span><p></p></div>
        <a class="ds-cta" data-link="contact" href="${contactUrl}">Have Daniel source &amp; set this stone →</a>
      </div>
    </div>
    <div class="ds-compare">
      <div class="ds-compare-label">Why cut matters — the same diamond, five cut grades, live</div>
      <div class="ds-compare-row"></div>
    </div>`;

  const shapesEl = mount.querySelector('.ds-shapes');
  const canvas = mount.querySelector('.ds-canvas');
  const envsEl = mount.querySelector('.ds-envs');
  const envLabel = mount.querySelector('.ds-env-label');
  const shapeName = mount.querySelector('.ds-shape-name');
  const scoreEl = mount.querySelector('.ds-score');
  const specsEl = mount.querySelector('.ds-specs');
  const controlsEl = mount.querySelector('.ds-controls');
  const gemEl = mount.querySelector('.ds-gem p');
  const compareRow = mount.querySelector('.ds-compare-row');

  const view = createDiamondCanvas(canvas);
  const thumbs = [];

  // --- shape tiles ---
  SHAPE_ORDER.forEach((id) => {
    const b = el('button', 'ds-shape'); b.type = 'button';
    b.setAttribute('aria-label', SHAPES[id].name);
    const mini = document.createElement('canvas'); mini.className = 'ds-shape-mini'; mini.width = 76; mini.height = 76;
    b.appendChild(mini);
    b.appendChild(el('span', 'ds-shape-label', SHAPES[id].name));
    b.addEventListener('click', () => { state.shape = id; refresh(); });
    shapesEl.appendChild(b);
    // A little live diamond of each shape — self-heals its size once laid out.
    const mc = createDiamondCanvas(mini); mc.setShape(id); mc.setEnv('showroom'); mc.setCut('ideal');
    thumbs.push(mc);
  });

  // --- lighting chips ---
  ENV_ORDER.forEach((id) => {
    const b = el('button', 'ds-env', ENVIRONMENTS[id].name); b.type = 'button';
    b.addEventListener('click', () => { state.env = id; refresh(); });
    b.dataset.id = id;
    envsEl.appendChild(b);
  });

  // --- cut comparison (5 fixed mini viewers) ---
  const compareViews = CUT_ORDER.map((cutId) => {
    const cell = el('div', 'ds-cmp-cell');
    const cvs = document.createElement('canvas'); cvs.className = 'ds-cmp-canvas';
    cell.appendChild(cvs);
    cell.appendChild(el('span', 'ds-cmp-name', CUTS[cutId].name));
    compareRow.appendChild(cell);
    const v = createDiamondCanvas(cvs); v.setCut(cutId); v.setShape('round'); v.setEnv('showroom');
    return { v, cutId };
  });

  // --- controls (cut / colour / clarity / carat / setting) ---
  function pillRow(label, ids, table, key) {
    const wrap = el('div', 'ds-pillgroup');
    wrap.appendChild(el('span', 'ds-pilllabel', label));
    const row = el('div', 'ds-pillrow');
    ids.forEach((id) => {
      const b = el('button', 'ds-pill', table[id].name); b.type = 'button'; b.dataset.id = id;
      b.addEventListener('click', () => { state[key] = id; refresh(); });
      row.appendChild(b);
    });
    wrap.appendChild(row); wrap._row = row;
    return wrap;
  }
  const cutCtl = pillRow('Cut', CUT_ORDER, CUTS, 'cut');
  const colourCtl = pillRow('Colour', COLOUR_ORDER, COLOURS, 'colour');
  const clarityCtl = pillRow('Clarity', CLARITY_ORDER, CLARITIES, 'clarity');
  const settingCtl = pillRow('Setting', SETTING_ORDER, SETTINGS, 'setting');
  const caratWrap = el('div', 'ds-pillgroup');
  caratWrap.innerHTML = `<span class="ds-pilllabel">Carat: <b class="ds-caratval">1.00</b> ct</span>
    <input type="range" class="ds-carat" min="0.3" max="3" step="0.1" value="1">`;
  controlsEl.append(cutCtl, colourCtl, clarityCtl, caratWrap, settingCtl);
  const caratSlider = caratWrap.querySelector('.ds-carat');
  caratSlider.addEventListener('input', () => { state.carat = parseFloat(caratSlider.value); caratWrap.querySelector('.ds-caratval').textContent = state.carat.toFixed(2); refresh(); });

  function markActive() {
    shapesEl.querySelectorAll('.ds-shape').forEach((b) => b.classList.toggle('is-active', b.getAttribute('aria-label') === SHAPES[state.shape].name));
    envsEl.querySelectorAll('.ds-env').forEach((b) => b.classList.toggle('is-active', b.dataset.id === state.env));
    [cutCtl, colourCtl, clarityCtl, settingCtl].forEach((ctl, i) => {
      const key = ['cut', 'colour', 'clarity', 'setting'][i];
      ctl._row.querySelectorAll('.ds-pill').forEach((b) => b.classList.toggle('is-active', b.dataset.id === state[key]));
    });
  }

  function refresh() {
    view.setShape(state.shape); view.setCut(state.cut); view.setColour(state.colour); view.setEnv(state.env); view.setCarat(state.carat);
    compareViews.forEach(({ v }) => { v.setEnv(state.env); v.setColour(state.colour); v.setCarat(1); });

    const mm = diamondMm(state.shape, state.carat);
    const price = diamondPriceCAD(state.shape, state.carat, state.cut, state.colour, state.clarity);
    const score = lightPerformanceScore(state.shape, state.cut, state.env);

    shapeName.textContent = SHAPES[state.shape].name;
    scoreEl.textContent = `${score}`;
    scoreEl.style.setProperty('--score', score);
    envLabel.textContent = ENVIRONMENTS[state.env].name;

    specsEl.innerHTML = `
      <div><span>Carat</span><strong>${state.carat.toFixed(2)} ct</strong></div>
      <div><span>Cut</span><strong>${CUTS[state.cut].name}</strong></div>
      <div><span>Colour</span><strong>${COLOURS[state.colour].name}</strong></div>
      <div><span>Clarity</span><strong>${CLARITIES[state.clarity].name}</strong></div>
      <div><span>Measurements</span><strong>${mm.length} × ${mm.width} mm</strong></div>
      <div><span>Light performance</span><strong>${score}/100</strong></div>
      <div class="ds-price"><span>Typical value</span><strong>${fmtCAD(price * 0.85)}–${fmtCAD(price * 1.15)}</strong></div>`;

    gemEl.textContent = gemologistNote(state);
    markActive();
  }

  // sensible defaults active
  refresh();

  return { destroy() { view.destroy(); compareViews.forEach(({ v }) => v.destroy()); } };
}
