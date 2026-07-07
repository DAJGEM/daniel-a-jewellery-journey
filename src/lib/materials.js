// PBR materials for metal and gems, driven by the alloy/stone data tables.

import { ALLOYS } from '../data/alloys.js';
import { STONES } from '../data/stones.js';
import { brushedBump, hammeredBump } from './textures.js';

const FINISH_ROUGHNESS = { mirror: 0.06, satin: 0.28, brushed: 0.34, hammered: 0.2 };

export function makeMetalMaterial(THREE, { alloyKey, finish = 'mirror' }) {
  const alloy = ALLOYS[alloyKey] || ALLOYS['gold-18k-yellow'];
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(alloy.colourHex),
    metalness: 1,
    roughness: FINISH_ROUGHNESS[finish] ?? 0.1,
    envMapIntensity: 1.35,
    clearcoat: finish === 'mirror' ? 0.4 : 0,
    clearcoatRoughness: 0.1,
  });

  if (finish === 'brushed' || finish === 'hammered') {
    const tex = new THREE.CanvasTexture(finish === 'brushed' ? brushedBump() : hammeredBump());
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(finish === 'brushed' ? 4 : 2, finish === 'brushed' ? 4 : 2);
    mat.bumpMap = tex;
    mat.bumpScale = finish === 'brushed' ? 0.015 : 0.06;
  }
  return mat;
}

export function makeGemMaterial(THREE, stoneKey) {
  const stone = STONES[stoneKey] || STONES['natural-diamond'];
  const tinted = stone.colourHex !== 0xffffff;
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(stone.colourHex),
    metalness: 0,
    roughness: 0.02,
    transmission: tinted ? 0.75 : 0.95,
    thickness: 1.2,
    ior: stone.ior,
    iridescence: Math.min(1, stone.dispersion * 8), // fire approximation
    iridescenceIOR: 1.6,
    envMapIntensity: 2.4,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    attenuationColor: new THREE.Color(stone.colourHex),
    attenuationDistance: tinted ? 0.6 : 4,
  });
}
