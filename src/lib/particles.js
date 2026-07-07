// One reusable GPU particle system. Kinds differ in blending, colour and motion.

import { softDisc } from './textures.js';

const KINDS = {
  embers: { additive: true, gravity: 0.35, drift: 0.5, size: 0.05, colour: 0xffa030 },
  sparks: { additive: true, gravity: -1.2, drift: 1.4, size: 0.03, colour: 0xffe08a },
  steam: { additive: false, gravity: 0.7, drift: 0.35, size: 0.5, colour: 0xf4efe6 },
  dust: { additive: false, gravity: 0.02, drift: 0.08, size: 0.06, colour: 0xd8cba0 },
};

export function createParticles(THREE, { kind, count, area = 2, colour, quality }) {
  const cfg = KINDS[kind] || KINDS.dust;
  const n = Math.max(8, Math.floor(count * (quality?.particleScale ?? 1)));

  const positions = new Float32Array(n * 3);
  const velocities = new Float32Array(n * 3);
  const life = new Float32Array(n);

  function reset(i, initial) {
    positions[i * 3] = (Math.random() - 0.5) * area;
    positions[i * 3 + 1] = initial ? Math.random() * area : -area * 0.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * area;
    velocities[i * 3] = (Math.random() - 0.5) * cfg.drift;
    velocities[i * 3 + 1] = cfg.gravity * (0.5 + Math.random());
    velocities[i * 3 + 2] = (Math.random() - 0.5) * cfg.drift;
    life[i] = Math.random();
  }
  for (let i = 0; i < n; i++) reset(i, true);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    size: cfg.size,
    map: new THREE.CanvasTexture(softDisc()),
    color: new THREE.Color(colour ?? cfg.colour),
    transparent: true,
    depthWrite: false,
    blending: cfg.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    opacity: cfg.additive ? 0.9 : 0.4,
  });

  const points = new THREE.Points(geo, mat);
  let rate = 1;

  return {
    points,
    setRate(r) { rate = r; },
    update(dt) {
      for (let i = 0; i < n; i++) {
        life[i] -= dt * 0.4;
        positions[i * 3] += velocities[i * 3] * dt * rate;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * dt * rate;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * dt * rate;
        if (life[i] <= 0 || positions[i * 3 + 1] > area) reset(i, false);
      }
      geo.attributes.position.needsUpdate = true;
    },
    dispose() {
      geo.dispose();
      mat.map.dispose();
      mat.dispose();
    },
  };
}
