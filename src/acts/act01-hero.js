// Act 1 — Hero: a full-screen molten-gold shader. Domain-warped FBM noise
// drives a flowing liquid surface; colour follows a black-body-ish ramp with
// bright specular glints. Reacts subtly to pointer. Embers rise over the top.

import { createParticles } from '../lib/particles.js';

const VERT = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uAspect;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
    vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
  }
  float fbm(vec2 p){
    float v=0.0, a=0.5;
    for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5; }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    uv.x *= uAspect;
    vec2 flow = uv*2.4 + vec2(uPointer.x*0.3, uTime*0.05 - uPointer.y*0.3);
    // domain warp
    vec2 q = vec2(fbm(flow), fbm(flow+vec2(5.2,1.3)));
    vec2 r = vec2(fbm(flow+q*1.6+vec2(1.7,9.2)+uTime*0.06),
                  fbm(flow+q*1.6+vec2(8.3,2.8)-uTime*0.04));
    float f = fbm(flow + r*1.4);

    // colour ramp: dark crust -> deep red -> orange -> gold -> white glints
    vec3 col = mix(vec3(0.05,0.01,0.0), vec3(0.5,0.06,0.0), smoothstep(0.15,0.45,f));
    col = mix(col, vec3(0.95,0.42,0.05), smoothstep(0.4,0.62,f));
    col = mix(col, vec3(1.0,0.78,0.30), smoothstep(0.58,0.78,f));
    float glint = smoothstep(0.82,0.92,f);
    col += glint*vec3(1.0,0.95,0.75);

    // subtle heat shimmer vignette
    float vig = smoothstep(1.3,0.2,length(vUv-0.5));
    col *= 0.55 + 0.75*vig;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createHeroAct(sectionEl) {
  let scene; let camera; let quad; let embers; let mat;
  let time = 0; const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let reduced = false;

  function onMove(e) {
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  return {
    id: 'hero',
    sectionEl,
    scene: null,
    camera: null,
    init(ctx) {
      const { THREE, quality, size } = ctx;
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, size.w / size.h, 0.1, 10);
      camera.position.z = 1;

      mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2(0, 0) },
          uAspect: { value: size.w / size.h },
        },
        depthTest: false,
      });
      quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
      quad.frustumCulled = false;
      scene.add(quad);

      embers = createParticles(THREE, { kind: 'embers', count: 260, area: 4, quality });
      embers.points.position.z = 0.2;
      scene.add(embers.points);

      this.scene = scene;
      this.camera = camera;
      this._THREE = THREE;
      window.addEventListener('pointermove', onMove);
    },
    enter() { this._onResize?.(); },
    update(_progress, dt) {
      if (!reduced) time += dt;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      mat.uniforms.uTime.value = reduced ? 3.2 : time;
      mat.uniforms.uPointer.value.set(pointer.x, pointer.y);
      mat.uniforms.uAspect.value = camera.aspect;
      if (!reduced) embers.update(dt);
    },
    exit() {},
    dispose() {
      window.removeEventListener('pointermove', onMove);
      quad.geometry.dispose();
      mat.dispose();
      embers.dispose();
      this.scene = null;
    },
  };
}
