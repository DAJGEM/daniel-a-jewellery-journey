// Act 10 — Your piece. The finished, configured item on a reflective pedestal
// under showroom lighting, slowly turning. Download photo & certificate, share,
// start a custom order (carrying the configuration), book an appointment; plus a
// live metal ticker and weight calculator.

import { makeScene, makePanel, fmtCAD } from './common.js';
import { buildForm, applyEngraving } from '../lib/geometry.js';
import { estimateWeightGrams } from '../lib/calculator.js';
import { pricePerGramCAD } from '../data/prices.js';
import { ALLOYS } from '../data/alloys.js';
import { createParticles } from '../lib/particles.js';
import { renderCertificate, snapshotPiece } from '../lib/certificate.js';
import { getPrices } from './act04-alloy.js';

function contactUrl(extra) {
  const base = (window.JOURNEY_CONFIG && window.JOURNEY_CONFIG.contactUrl) || '/contact';
  return base + (extra ? (base.includes('?') ? '&' : '?') + extra : '');
}

export function createShowroomAct(sectionEl, state) {
  let THREE; let scene; let camera; let renderer; let quality; let envMap;
  let piece; let pedestal; let floor; let dust; let turntable = true;
  let prices = null;

  function buildPiece() {
    if (piece) scene.remove(piece);
    const st = state.get();
    piece = buildForm(THREE, st.form || 'ring', { alloyKey: st.alloy, finish: st.finish, stoneKey: st.stone, stoneCarat: st.stoneCarat });
    if (st.engraving) applyEngraving(THREE, piece, st.engraving);
    piece.position.y = 0.4;
    scene.add(piece);
  }

  return {
    id: 'showroom',
    sectionEl,
    scene: null,
    camera: null,
    init(ctx) {
      THREE = ctx.THREE; renderer = ctx.renderer; quality = ctx.quality; envMap = ctx.envMap;
      const s = makeScene(THREE, ctx.size, { camZ: 4.2, camY: 1.3, envMap });
      scene = s.scene; camera = s.camera;
      scene.background = new THREE.Color(0x050505);

      floor = new THREE.Mesh(
        new THREE.CircleGeometry(6, 64),
        new THREE.MeshPhysicalMaterial({ color: 0x0a0a0a, roughness: 0.15, metalness: 0.6, clearcoat: 1 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.6;
      scene.add(floor);

      pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.9, 0.5, 48),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.2 }),
      );
      pedestal.position.y = -0.35;
      scene.add(pedestal);

      // Bright key spotlight for showroom sparkle.
      const spot = new THREE.SpotLight(0xffffff, 40, 12, Math.PI / 6, 0.4);
      spot.position.set(2, 5, 3);
      scene.add(spot, spot.target);

      dust = createParticles(THREE, { kind: 'dust', count: 120, area: 5, quality });
      scene.add(dust.points);

      buildPiece();

      // ---- Conversion panel ----
      const panel = makePanel(sectionEl, 'act-panel--showroom');

      const nameRow = document.createElement('div');
      nameRow.className = 'name-row';
      nameRow.innerHTML = `
        <label class="pill-group-label" for="first-name">Your first name (for the certificate)</label>
        <input id="first-name" type="text" maxlength="24" class="engrave-input" placeholder="e.g. Daniel">`;
      panel.appendChild(nameRow);
      nameRow.querySelector('#first-name').addEventListener('input', (e) => state.set({ firstName: e.target.value }));

      const actions = document.createElement('div');
      actions.className = 'showroom-actions';
      actions.innerHTML = `
        <button type="button" class="sr-btn sr-primary" data-a="photo">Download Photo</button>
        <button type="button" class="sr-btn sr-primary" data-a="cert">Download Certificate</button>
        <button type="button" class="sr-btn" data-a="share">Share</button>
        <button type="button" class="sr-btn sr-cta" data-a="order">Start Custom Order</button>
        <button type="button" class="sr-btn sr-cta" data-a="book">Book Appointment</button>
        <button type="button" class="sr-btn sr-ghost" data-a="spin">Pause spin</button>`;
      panel.appendChild(actions);

      actions.addEventListener('click', (e) => {
        const a = e.target.getAttribute('data-a');
        if (!a) return;
        if (a === 'photo') download('my-journey-of-gold.png', snapshotPiece(renderer, scene, camera));
        if (a === 'cert') {
          const c = document.createElement('canvas');
          download('certificate-of-craft.png', renderCertificate(state.get(), c, prices));
        }
        if (a === 'share') doShare();
        if (a === 'order') window.open(contactUrl('subject=' + encodeURIComponent(configSummary())), '_blank');
        if (a === 'book') window.open(contactUrl('subject=Book%20an%20appointment'), '_blank');
        if (a === 'spin') { turntable = !turntable; e.target.textContent = turntable ? 'Pause spin' : 'Resume spin'; }
      });

      // ---- Live ticker + calculator ----
      const tools = document.createElement('div');
      tools.className = 'showroom-tools';
      tools.innerHTML = `
        <div class="ticker"><span class="ticker-label">Live metal (per gram, CAD)</span><div class="ticker-values">Loading live prices…</div></div>
        <div class="calc">
          <span class="pill-group-label">Metal weight calculator</span>
          <div class="calc-readout"><strong class="calc-grams">—</strong><span class="calc-value"></span></div>
        </div>`;
      panel.appendChild(tools);

      getPrices().then((p) => {
        prices = p;
        const tv = tools.querySelector('.ticker-values');
        if (p && p.gold) {
          const parts = [`Gold ${fmtCAD(pricePerGramCAD(p.gold.usdPerOz, p.usdCad, 1))}`];
          if (p.silver) parts.push(`Silver ${fmtCAD(pricePerGramCAD(p.silver.usdPerOz, p.usdCad, 1))}`);
          if (p.platinum) parts.push(`Platinum ${fmtCAD(pricePerGramCAD(p.platinum.usdPerOz, p.usdCad, 1))}`);
          tv.textContent = parts.join('  ·  ');
        } else {
          tv.textContent = 'Live pricing temporarily unavailable — visit us in store for today’s rates.';
        }
        updateCalc();
      });

      function updateCalc() {
        const st = state.get();
        const grams = estimateWeightGrams(st.form || 'ring', st.alloy);
        tools.querySelector('.calc-grams').textContent = `${grams.toFixed(1)} g`;
        const alloy = ALLOYS[st.alloy];
        if (prices && prices.gold && !st.alloy.startsWith('platinum')) {
          const val = grams * alloy.purity * (prices.gold.usdPerOz / 31.1035) * prices.usdCad;
          tools.querySelector('.calc-value').textContent = `≈ ${fmtCAD(val)} in metal · not a retail price`;
        } else {
          tools.querySelector('.calc-value').textContent = '';
        }
      }
      this._updateCalc = updateCalc;

      function configSummary() {
        const st = state.get();
        return `Custom order — ${(st.form || 'ring')}, ${ALLOYS[st.alloy]?.label}, ${st.finish} finish${st.stone ? ', ' + st.stone + ' ' + (st.stoneCarat || 1).toFixed(2) + 'ct' : ''}${st.engraving ? ', engraved "' + st.engraving + '"' : ''}`;
      }
      this._configSummary = configSummary;

      this.scene = scene; this.camera = camera;
    },
    enter() { buildPiece(); this._updateCalc?.(); },
    update(_p, dt) {
      if (piece && turntable) piece.rotation.y += dt * 0.35;
      dust.update(dt);
    },
    exit() {},
    dispose() { dust.dispose(); if (piece) scene.remove(piece); this.scene = null; },
  };

  function download(filename, dataUrl) {
    const a = document.createElement('a');
    a.href = dataUrl; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }

  function doShare() {
    const url = location.href;
    if (navigator.share) navigator.share({ title: 'The Journey of Gold', text: 'I just forged my own piece of fine jewellery.', url }).catch(() => {});
    else navigator.clipboard?.writeText(url);
  }
}
