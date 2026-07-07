// Act 5 — Cast. Pick a form; molten metal pours into the mould, the fill rises,
// steam curls off the contact point, the glow fades as it cools, and the solid
// piece is revealed — visibly shrinking ~1.7% the way real castings do.

import { makeScene, makePanel, pillGroup } from './common.js';
import { buildForm } from '../lib/geometry.js';
import { glow } from '../lib/blackbody.js';
import { createParticles } from '../lib/particles.js';

const SHRINK = 0.983; // ~1.7% linear casting shrinkage

const FORMS = [
  { label: 'Ring', value: 'ring' },
  { label: 'Pendant', value: 'pendant' },
  { label: 'Chain', value: 'chain' },
  { label: 'Bracelet', value: 'bracelet' },
  { label: 'Earrings', value: 'earrings' },
];

export function createCastAct(sectionEl, state) {
  let THREE; let scene; let camera; let quality;
  let stream; let fillPlane; let piece; let steam; let shrinkNote;
  let phase = 'idle'; let castT = 0; let currentForm = null;

  function startCast(form) {
    currentForm = form;
    phase = 'pour'; castT = 0;
    state.set({ form });
    if (piece) { scene.remove(piece); piece = null; }
    stream.visible = true;
    fillPlane.scale.set(1, 0.01, 1);
    fillPlane.visible = true;
    shrinkNote.classList.remove('is-shown');
  }

  return {
    id: 'cast',
    sectionEl,
    scene: null,
    camera: null,
    init(ctx) {
      THREE = ctx.THREE; quality = ctx.quality;
      const s = makeScene(THREE, ctx.size, { camZ: 5.5, camY: 0.4, envMap: ctx.envMap });
      scene = s.scene; camera = s.camera;

      // Mould: two dark blocks with a gap.
      const moldMat = new THREE.MeshStandardMaterial({ color: 0x161210, roughness: 0.9, metalness: 0 });
      const left = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, 1.4), moldMat);
      left.position.x = -0.85;
      const right = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, 1.4), moldMat);
      right.position.x = 0.85;
      scene.add(left, right);

      // Pour stream (tapered cylinder, molten emissive).
      stream = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.14, 2.2, 16, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xffb038, emissive: 0xff7a10, emissiveIntensity: 2.4, metalness: 1, roughness: 0.2 }),
      );
      stream.position.y = 1.4;
      stream.visible = false;
      scene.add(stream);

      // Fill rising in the cavity.
      fillPlane = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.6, 1.0),
        new THREE.MeshStandardMaterial({ color: 0xffb038, emissive: 0xff7a10, emissiveIntensity: 2.2, metalness: 1, roughness: 0.25 }),
      );
      fillPlane.position.y = -0.2;
      fillPlane.visible = false;
      scene.add(fillPlane);

      steam = createParticles(THREE, { kind: 'steam', count: 120, area: 1.6, quality });
      steam.points.position.y = 0.4;
      steam.setRate(0);
      scene.add(steam.points);

      const panel = makePanel(sectionEl, 'act-panel--cast');
      panel.appendChild(pillGroup('Choose a form', FORMS, startCast, null));
      shrinkNote = document.createElement('p');
      shrinkNote.className = 'cast-note';
      shrinkNote.textContent = 'The metal shrinks about 1.7% as it cools — we design every mould oversize to land on an exact fit.';
      panel.appendChild(shrinkNote);

      this.scene = scene; this.camera = camera;
      this._st = state;
    },
    enter() {
      const st = this._st.get();
      if (st.form && st.form !== currentForm) startCast(st.form);
    },
    update(_p, dt) {
      if (phase === 'pour') {
        castT += dt;
        steam.setRate(1); steam.update(dt);
        fillPlane.scale.y = Math.min(1, castT / 2);
        fillPlane.position.y = -1 + fillPlane.scale.y * 0.8;
        if (castT >= 2) { phase = 'cool'; castT = 0; stream.visible = false; }
      } else if (phase === 'cool') {
        castT += dt;
        const tC = 1064 - Math.min(1044, castT * 320);
        const g = glow(tC);
        fillPlane.material.emissive.setRGB(g.r / 255, Math.max(0.05, g.g / 255), g.b / 255);
        fillPlane.material.emissiveIntensity = g.intensity * 2.2;
        steam.setRate(Math.max(0, 1 - castT / 3)); steam.update(dt);
        if (castT >= 3) {
          phase = 'reveal'; castT = 0;
          fillPlane.visible = false;
          piece = buildForm(THREE, currentForm, {
            alloyKey: this._st.get().alloy, finish: this._st.get().finish || 'mirror',
          });
          piece.scale.setScalar(0.01);
          scene.add(piece);
        }
      } else if (phase === 'reveal' && piece) {
        castT += dt;
        const target = castT < 1 ? 1.0 : SHRINK; // grow, then settle with shrink
        const cur = piece.scale.x;
        piece.scale.setScalar(cur + (target - cur) * Math.min(1, dt * 4));
        piece.rotation.y += dt * 0.6;
        if (castT > 1.2) shrinkNote.classList.add('is-shown');
      }
    },
    exit() {},
    dispose() {
      steam.dispose();
      if (piece) scene.remove(piece);
      this.scene = null;
    },
  };
}
