// Shared helpers for acts: a lit scene + camera, and a DOM overlay panel that
// lives inside the act's section so copy and controls scroll with it.

export function makeScene(THREE, size, { camZ = 6, camY = 0, envMap = null } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08070a);
  // Metallic PBR reads as black without an environment to reflect.
  if (envMap) scene.environment = envMap;
  const camera = new THREE.PerspectiveCamera(45, size.w / size.h, 0.1, 100);
  camera.position.set(0, camY, camZ);
  camera.lookAt(0, 0, 0);

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 6, 5);
  const fill = new THREE.DirectionalLight(0xafc4ff, 0.6);
  fill.position.set(-5, 1, 2);
  const rim = new THREE.DirectionalLight(0xffd9a0, 1.1);
  rim.position.set(0, 3, -6);
  scene.add(key, fill, rim);

  return { scene, camera, lights: { key, fill, rim } };
}

// Build a controls panel appended to the act's section. Returns the element.
export function makePanel(sectionEl, className = '') {
  const copy = sectionEl.querySelector('.act-copy') || sectionEl;
  const panel = document.createElement('div');
  panel.className = `act-panel ${className}`.trim();
  copy.appendChild(panel);
  return panel;
}

// A labelled group of pill buttons; onPick(value) fires on click/Enter.
export function pillGroup(labelText, options, onPick, initial) {
  const wrap = document.createElement('div');
  wrap.className = 'pill-group';
  if (labelText) {
    const l = document.createElement('span');
    l.className = 'pill-group-label';
    l.textContent = labelText;
    wrap.appendChild(l);
  }
  const row = document.createElement('div');
  row.className = 'pill-row';
  const buttons = new Map();
  options.forEach((opt) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pill';
    b.textContent = opt.label;
    b.setAttribute('aria-pressed', String(opt.value === initial));
    if (opt.value === initial) b.classList.add('is-active');
    b.addEventListener('click', () => {
      buttons.forEach((btn, v) => {
        const on = v === opt.value;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', String(on));
      });
      onPick(opt.value);
    });
    buttons.set(opt.value, b);
    row.appendChild(b);
  });
  wrap.appendChild(row);
  wrap._select = (value) => buttons.get(value)?.click();
  return wrap;
}

export function fmtCAD(n) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
}

// Smooth ease used across acts.
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
