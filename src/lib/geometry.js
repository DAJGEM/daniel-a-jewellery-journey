// Procedural jewellery geometry. Every form is a THREE.Group built from
// primitives so nothing has to be downloaded. The metal material is shared;
// gems get their own. group.userData.engraveTarget points at the band mesh so
// Act 6 can paint an engraving texture onto it.

import { makeMetalMaterial, makeGemMaterial } from './materials.js';

function gemMesh(THREE, stoneKey, carat) {
  // Round-brilliant-ish: a shallow cone crown on a deeper pavilion cone.
  const r = 0.16 * Math.cbrt(carat / 1.0);
  const crown = new THREE.ConeGeometry(r, r * 0.5, 16);
  crown.translate(0, r * 0.25, 0);
  const pav = new THREE.ConeGeometry(r, r * 1.1, 16);
  pav.rotateX(Math.PI);
  pav.translate(0, -r * 0.55, 0);
  const mat = makeGemMaterial(THREE, stoneKey);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(crown, mat), new THREE.Mesh(pav, mat));
  g.userData.gemRadius = r;
  return g;
}

function prongs(THREE, metal, r) {
  const grp = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, r * 1.6, 8), metal);
    p.position.set(Math.cos(a) * r * 0.7, r * 0.4, Math.sin(a) * r * 0.7);
    grp.add(p);
  }
  return grp;
}

function buildRing(THREE, opts, metal) {
  const g = new THREE.Group();
  // Band lies flat (hole facing up); the stone is seated on the front of the
  // band at the 12-o'clock position so it rides with the ring as it turns.
  const band = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 24, 96), metal);
  band.rotation.x = Math.PI / 2;
  g.add(band);
  g.userData.engraveTarget = band;
  if (opts.stoneKey) {
    const gem = gemMesh(THREE, opts.stoneKey, opts.stoneCarat || 1);
    const seat = gem.userData.gemRadius * 0.9;
    gem.position.set(0, 0.12 + seat, 1.0);
    const p = prongs(THREE, metal, gem.userData.gemRadius);
    p.position.set(0, 0.12, 1.0);
    g.add(gem, p);
  }
  return g;
}

function buildPendant(THREE, opts, metal) {
  const g = new THREE.Group();
  // Teardrop via lathe.
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push(new THREE.Vector2(Math.sin(t * Math.PI) * 0.6 * (1 - t * 0.2), t * 1.6 - 0.8));
  }
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), metal);
  const bail = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 12, 32), metal);
  bail.position.y = 0.92;
  g.add(body, bail);
  g.userData.engraveTarget = body;
  if (opts.stoneKey) {
    const gem = gemMesh(THREE, opts.stoneKey, opts.stoneCarat || 1);
    gem.position.set(0, 0.1, 0.42);
    g.add(gem);
  }
  return g;
}

function linkChain(THREE, metal, count, radius, tube, spread) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, 24), metal);
    const t = i / (count - 1);
    // Gentle catenary drape.
    link.position.set((t - 0.5) * spread, -Math.sin(t * Math.PI) * spread * 0.28, 0);
    link.rotation.y = i % 2 ? Math.PI / 2 : 0;
    g.add(link);
  }
  g.userData.engraveTarget = g.children[Math.floor(count / 2)];
  return g;
}

function buildChain(THREE, _opts, metal) {
  return linkChain(THREE, metal, 26, 0.13, 0.045, 3.4);
}

function buildBracelet(THREE, _opts, metal) {
  const g = new THREE.Group();
  const count = 14, R = 1.1;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 12, 28), metal);
    link.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
    link.rotation.set(Math.PI / 2, 0, a);
    g.add(link);
  }
  g.userData.engraveTarget = g.children[0];
  return g;
}

function buildEarrings(THREE, opts, metal) {
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const one = buildPendant(THREE, opts, metal);
    one.scale.setScalar(0.6);
    one.position.x = side * 0.9;
    g.add(one);
  }
  g.userData.engraveTarget = g.children[0].userData.engraveTarget;
  return g;
}

const BUILDERS = {
  ring: buildRing,
  pendant: buildPendant,
  chain: buildChain,
  bracelet: buildBracelet,
  earrings: buildEarrings,
};

export function buildForm(THREE, form, opts = {}) {
  const metal = makeMetalMaterial(THREE, { alloyKey: opts.alloyKey, finish: opts.finish });
  const group = (BUILDERS[form] || buildRing)(THREE, opts, metal);
  group.userData.metal = metal;
  group.userData.form = form;
  return group;
}

// Paint an engraving onto the band's inner face.
export function applyEngraving(THREE, group, text) {
  const target = group.userData.engraveTarget;
  if (!target || !text) return;
  const c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000'; ctx.globalAlpha = 0; ctx.fillRect(0, 0, 512, 64);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.font = 'italic 30px "Cormorant Garamond", serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text.slice(0, 20), 256, 34);
  const tex = new THREE.CanvasTexture(c);
  const mat = target.material.clone();
  mat.roughnessMap = tex;
  mat.roughness = Math.min(1, (mat.roughness || 0.1) + 0.4);
  mat.needsUpdate = true;
  target.material = mat;
  group.userData.engravingText = text.slice(0, 20);
}
