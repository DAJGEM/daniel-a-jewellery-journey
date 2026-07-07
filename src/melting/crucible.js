// The crucible — a 2D-canvas pot. Grain pours in and piles up; Smelt heats it
// through the real black-body colours, melts it into a glowing pool, then cools
// it into a solid button in your alloy's colour. Deliberately light (no WebGL).

import { glow } from '../lib/blackbody.js';
import { METALS } from '../data/metals.js';

export function createCrucible(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0; let H = 0; let dpr = 1;
  const grains = [];        // { x, y, vy, r, colour, settled }
  let phase = 'idle';       // idle | heating | molten | cooling | solid
  let tempC = 20;
  let poolColour = '#f3cb7a';
  let coolTarget = 0xf3cb7a;
  let phaseT = 0;
  let onDone = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const potTop = () => H * 0.30;      // rim height
  const potFloor = () => H * 0.86;
  const potCX = () => W / 2;
  const potHalfW = () => W * 0.30;

  function hex(n) { return '#' + n.toString(16).padStart(6, '0'); }

  // Pour `count` grains of a metal in from the top; they fall and heap up.
  function addGrain(metalKey, count) {
    if (phase !== 'idle') return;
    const colour = hex(METALS[metalKey].colourHex);
    for (let i = 0; i < count; i++) {
      grains.push({
        x: potCX() + (Math.random() - 0.5) * potHalfW() * 1.2,
        y: potTop() - 10 - Math.random() * 30,
        vy: 0,
        r: 2.6 + Math.random() * 1.8,
        colour,
        settled: false,
      });
    }
    if (grains.length > 1400) grains.splice(0, grains.length - 1400); // cap for perf
  }

  function empty() {
    grains.length = 0;
    phase = 'idle';
    tempC = 20; phaseT = 0;
  }

  let watchdog = null;
  function smelt(alloyColourHex, done) {
    if (phase !== 'idle' || grains.length === 0) { done?.(); return; }
    coolTarget = alloyColourHex;
    onDone = done;
    phase = 'heating'; phaseT = 0; tempC = 20;
    // Safety: never let a melt hang. Force-finish if the sequence overruns.
    clearTimeout(watchdog);
    watchdog = setTimeout(() => {
      if (phase !== 'solid' && phase !== 'idle') {
        phase = 'solid'; phaseT = 0; tempC = 20;
        const cb = onDone; onDone = null; cb?.();
      }
    }, 7000);
  }

  // Physics + phase machine
  function step(dt) {
    if (phase === 'idle') {
      // settle falling grain into a heap
      const floor = potFloor();
      for (const gr of grains) {
        if (gr.settled) continue;
        gr.vy += 900 * dt;
        gr.y += gr.vy * dt;
        // heap line rises with grain count
        const heap = floor - Math.min(H * 0.5, grains.length * 0.10) - (Math.random() * 4);
        const dxFromCentre = Math.abs(gr.x - potCX()) / potHalfW();
        const localFloor = heap + dxFromCentre * dxFromCentre * H * 0.06;
        if (gr.y >= localFloor) { gr.y = localFloor; gr.settled = true; gr.vy = 0; }
      }
    } else if (phase === 'heating') {
      phaseT += dt;
      tempC = Math.min(1200, 20 + phaseT * 700);
      if (tempC >= 1064) { phase = 'molten'; phaseT = 0; }
    } else if (phase === 'molten') {
      phaseT += dt;
      if (phaseT > 1.1) { phase = 'cooling'; phaseT = 0; }
    } else if (phase === 'cooling') {
      phaseT += dt;
      tempC = Math.max(20, 1064 - phaseT * 500);
      if (phaseT > 2.0) { phase = 'solid'; phaseT = 0; onDone?.(); onDone = null; }
    }
  }

  function drawPot() {
    ctx.save();
    ctx.beginPath();
    const cx = potCX(); const hw = potHalfW(); const top = potTop(); const floor = potFloor();
    // crucible cup
    ctx.moveTo(cx - hw, top);
    ctx.bezierCurveTo(cx - hw, floor, cx - hw * 0.5, floor + 12, cx, floor + 12);
    ctx.bezierCurveTo(cx + hw * 0.5, floor + 12, cx + hw, floor, cx + hw, top);
    const grad = ctx.createLinearGradient(0, top, 0, floor);
    grad.addColorStop(0, '#242833');
    grad.addColorStop(1, '#0f1116');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(207,214,223,0.28)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawPot();
    const cx = potCX(); const hw = potHalfW(); const floor = potFloor();

    if (phase === 'idle') {
      for (const gr of grains) {
        ctx.beginPath();
        ctx.arc(gr.x, gr.y, gr.r, 0, Math.PI * 2);
        ctx.fillStyle = gr.colour;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 0.5; ctx.stroke();
      }
    } else if (phase === 'heating' || phase === 'molten' || phase === 'cooling') {
      const g = glow(tempC);
      const heat = g.intensity; // 0..1
      // Hot-metal colour ramp: deep ember red → orange → gold-white. Never green.
      const hotCentre = `rgb(255,${Math.round(60 + heat * 180)},${Math.round(heat * 90)})`;
      const hotEdge = `rgb(${Math.round(120 + heat * 135)},${Math.round(20 + heat * 90)},0)`;
      const cooled = phase === 'cooling' && tempC < 520;
      const heapH = Math.min(H * 0.42, grains.length * 0.10) + 14;
      const poolTop = floor - heapH;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, poolTop, hw * 0.92, heapH * 0.5 + 10, 0, 0, Math.PI * 2);
      const em = ctx.createRadialGradient(cx, poolTop, 2, cx, poolTop, hw);
      em.addColorStop(0, cooled ? '#ffffff' : hotCentre);
      em.addColorStop(cooled ? 0.4 : 1, cooled ? hex(coolTarget) : hotEdge);
      if (cooled) em.addColorStop(1, '#00000066');
      ctx.fillStyle = em;
      ctx.shadowColor = hotCentre;
      ctx.shadowBlur = heat * 45;
      ctx.fill();
      ctx.restore();
    } else if (phase === 'solid') {
      // cooled metal button in alloy colour
      const heapH = Math.min(H * 0.30, grains.length * 0.08 + 20);
      const y = floor - heapH * 0.4;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, y, hw * 0.8, heapH * 0.42 + 8, 0, 0, Math.PI * 2);
      const gr = ctx.createLinearGradient(0, y - heapH, 0, y + heapH);
      gr.addColorStop(0, '#ffffff');
      gr.addColorStop(0.35, hex(coolTarget));
      gr.addColorStop(1, '#00000055');
      ctx.fillStyle = gr;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
  }

  let last = performance.now(); let raf;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    step(dt);
    draw();
  }
  raf = requestAnimationFrame(loop);

  return {
    addGrain, empty, smelt,
    getPhase: () => phase,
    destroy() { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); },
  };
}
