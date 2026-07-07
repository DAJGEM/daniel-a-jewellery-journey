// A 2D-canvas diamond that sparkles. It's an honest teaching simulation, not a
// ray-tracer: a great cut in bright, pointed light throws lots of white sparkle
// and rainbow fire; a poor cut leaks light (dark "windows") and goes flat.

import { SHAPES, CUTS, COLOURS, ENVIRONMENTS } from '../data/diamonds.js';

export function createDiamondCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0; let H = 0; let dpr = 1;
  let shape = 'round'; let cut = 'excellent'; let colour = 'H'; let env = 'showroom';
  let carat = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height || 320;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function radius() { return Math.min(W, H) * 0.32 * (0.8 + Math.min(0.5, Math.cbrt(carat) - 0.6)); }

  // --- Shape outline as a path (centred at cx,cy) ---
  function outline(cx, cy, r) {
    const sh = SHAPES[shape];
    const lw = sh.lw;
    const rw = r / Math.sqrt(lw); // half width
    const rl = rw * lw;           // half length
    ctx.beginPath();
    switch (shape) {
      case 'round':
        ctx.arc(cx, cy, r, 0, Math.PI * 2); break;
      case 'oval':
        ctx.ellipse(cx, cy, rw, rl, 0, 0, Math.PI * 2); break;
      case 'cushion': roundedRect(cx, cy, rw, rl, rw * 0.45); break;
      case 'princess': roundedRect(cx, cy, rw, rl, rw * 0.08); break;
      case 'radiant': croppedRect(cx, cy, rw, rl, rw * 0.28); break;
      case 'emerald': croppedRect(cx, cy, rw, rl, rw * 0.3); break;
      case 'asscher': croppedRect(cx, cy, rw, rl, rw * 0.34); break;
      case 'pear': pear(cx, cy, rw, rl); break;
      case 'marquise': marquise(cx, cy, rw, rl); break;
      case 'heart': heart(cx, cy, rw, rl); break;
      default: ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.closePath();
  }
  function roundedRect(cx, cy, rw, rl, rad) {
    const x = cx - rw, y = cy - rl, w = rw * 2, h = rl * 2;
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
  }
  function croppedRect(cx, cy, rw, rl, c) {
    const x = cx - rw, y = cy - rl, w = rw * 2, h = rl * 2;
    ctx.moveTo(x + c, y);
    ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c);
    ctx.lineTo(x + w, y + h - c); ctx.lineTo(x + w - c, y + h);
    ctx.lineTo(x + c, y + h); ctx.lineTo(x, y + h - c);
    ctx.lineTo(x, y + c);
  }
  function pear(cx, cy, rw, rl) {
    ctx.moveTo(cx, cy - rl);
    ctx.bezierCurveTo(cx + rw * 1.3, cy - rl * 0.3, cx + rw, cy + rl, cx, cy + rl);
    ctx.bezierCurveTo(cx - rw, cy + rl, cx - rw * 1.3, cy - rl * 0.3, cx, cy - rl);
  }
  function marquise(cx, cy, rw, rl) {
    ctx.moveTo(cx, cy - rl);
    ctx.quadraticCurveTo(cx + rw * 1.6, cy, cx, cy + rl);
    ctx.quadraticCurveTo(cx - rw * 1.6, cy, cx, cy - rl);
  }
  function heart(cx, cy, rw, rl) {
    ctx.moveTo(cx, cy + rl);
    ctx.bezierCurveTo(cx - rw * 1.5, cy + rl * 0.1, cx - rw * 1.1, cy - rl, cx, cy - rl * 0.35);
    ctx.bezierCurveTo(cx + rw * 1.1, cy - rl, cx + rw * 1.5, cy + rl * 0.1, cx, cy + rl);
  }

  // Real facet geometry per shape, clipped to the outline. Brilliant cuts get a
  // table + kite + star + girdle-scallop map; step cuts get nested "steps" and
  // corner facets; princess/radiant get the corner-to-centre chevron pattern.
  function line(a, b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  function poly(pts) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke(); }
  function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }

  function brilliantFacets(cx, cy, rw, rl) {
    const N = shape === 'round' ? 8 : shape === 'marquise' || shape === 'pear' ? 6 : 8;
    const g = []; // girdle points on the bounding ellipse
    for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2 - Math.PI / 2; g.push([cx + Math.cos(a) * rw, cy + Math.sin(a) * rl]); }
    const t = g.map((p) => [cx + (p[0] - cx) * 0.5, cy + (p[1] - cy) * 0.5]); // table
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    poly(t);                                             // table outline
    for (let i = 0; i < N; i++) line(t[i], g[i]);        // bezel (kite) facets
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    for (let i = 0; i < N; i++) {                        // star facets
      const m = mid(t[i], t[(i + 1) % N]);
      line(m, g[i]); line(m, g[(i + 1) % N]);
    }
    for (let i = 0; i < N; i++) {                        // upper-girdle scallops
      const gm = mid(g[i], g[(i + 1) % N]);
      line(gm, t[i]); line(gm, t[(i + 1) % N]);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';          // faint culet lines
    for (let i = 0; i < N; i++) line(t[i], [cx, cy]);
  }

  function chevronFacets(cx, cy, rw, rl) {               // princess / radiant
    const c = [[cx - rw, cy - rl], [cx + rw, cy - rl], [cx + rw, cy + rl], [cx - rw, cy + rl]];
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    c.forEach((p) => line(p, [cx, cy]));                 // X to centre
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    [0.32, 0.6, 0.85].forEach((k) => poly(c.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k])));
    // mid-edge chevrons
    for (let i = 0; i < 4; i++) { const m = mid(c[i], c[(i + 1) % 4]); line(m, [cx, cy]); }
  }

  function stepFacets(cx, cy, r) {                        // emerald / asscher
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    for (let i = 1; i <= 5; i++) { outline(cx, cy, r * (i / 5.6)); ctx.stroke(); } // nested steps
    // corner facets / windmill
    const sh = SHAPES[shape]; const rw = r / Math.sqrt(sh.lw); const rl = rw * sh.lw;
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    const c = [[cx - rw, cy - rl], [cx + rw, cy - rl], [cx + rw, cy + rl], [cx - rw, cy + rl]];
    if (shape === 'asscher') c.forEach((p) => line(p, [cx, cy])); // windmill X
    else { line([cx, cy - rl], [cx, cy + rl]); line([cx - rw, cy], [cx + rw, cy]); } // emerald cross
  }

  function drawFacets(cx, cy, r) {
    const sh = SHAPES[shape];
    const rw = r / Math.sqrt(sh.lw); const rl = rw * sh.lw;
    ctx.save();
    outline(cx, cy, r); ctx.clip();
    ctx.lineWidth = 1;
    if (sh.facets === 'step') stepFacets(cx, cy, r);
    else if (shape === 'princess' || shape === 'radiant') chevronFacets(cx, cy, rw, rl);
    else brilliantFacets(cx, cy, rw, rl);
    ctx.restore();
  }

  let sparkles = []; // { x, y, life, size, rainbow }
  function spawnSparkles(cx, cy, r) {
    const c = CUTS[cut]; const e = ENVIRONMENTS[env]; const sh = SHAPES[shape];
    const rate = c.lightReturn * sh.brilliance * e.sparkle;
    const count = sh.facets === 'step' ? 1.2 : 3.4;
    if (Math.random() < rate) {
      for (let i = 0; i < count * rate; i++) {
        // random point inside bounding, kept if inside outline
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.sqrt(Math.random()) * r * 0.95;
        const x = cx + Math.cos(ang) * rad / Math.sqrt(sh.lw);
        const y = cy + Math.sin(ang) * rad * Math.sqrt(sh.lw) * 0.7;
        sparkles.push({ x, y, life: 1, size: (sh.facets === 'step' ? 5 : 3) + Math.random() * 4, rainbow: Math.random() < e.fire * 0.5 });
      }
    }
  }

  function draw() {
    if (!W || !H) resize();        // self-heal if laid out after creation
    if (!W || !H) return;
    const e = ENVIRONMENTS[env]; const c = CUTS[cut]; const col = COLOURS[colour];
    ctx.clearRect(0, 0, W, H);
    // environment backdrop
    const bg = ctx.createRadialGradient(W / 2, H * 0.35, 10, W / 2, H / 2, Math.max(W, H) * 0.7);
    bg.addColorStop(0, shade(e.bg, 1.2)); bg.addColorStop(1, e.bg);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2; const cy = H / 2; const r = radius();

    // stone body — tinted by colour grade, brightened by light intensity
    ctx.save();
    outline(cx, cy, r);
    const body = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.1, cx, cy, r * 1.3);
    body.addColorStop(0, mix('#ffffff', hex(col.tint), 0.25));
    body.addColorStop(0.6, mix(hex(col.tint), '#9fb2c8', 0.5 * (1 - e.intensity * 0.4)));
    body.addColorStop(1, '#20303f');
    ctx.fillStyle = body; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
    ctx.restore();

    drawFacets(cx, cy, r);

    // leakage: poor cuts show a dark "window" in the middle
    const leak = 1 - c.lightReturn;
    if (leak > 0.12) {
      ctx.save(); outline(cx, cy, r * 0.7); ctx.clip();
      ctx.fillStyle = `rgba(10,16,24,${leak * 0.9})`;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
    }

    // sparkle
    spawnSparkles(cx, cy, r);
    ctx.save(); outline(cx, cy, r * 1.02); ctx.clip();
    for (const s of sparkles) {
      const a = s.life;
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
      if (s.rainbow) {
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(0.5, `rgba(${120 + Math.random() * 135 | 0},${200},255,${a * 0.6})`);
        g.addColorStop(1, 'rgba(255,120,200,0)');
      } else {
        const w = warmWhite(e.warmth, a);
        g.addColorStop(0, w); g.addColorStop(1, 'rgba(255,255,255,0)');
      }
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
      // cross glint
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.8})`; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(s.x - s.size, s.y); ctx.lineTo(s.x + s.size, s.y);
      ctx.moveTo(s.x, s.y - s.size); ctx.lineTo(s.x, s.y + s.size); ctx.stroke();
      s.life -= 0.06;
    }
    ctx.restore();
    sparkles = sparkles.filter((s) => s.life > 0);

    // rim highlight
    ctx.save(); outline(cx, cy, r); ctx.strokeStyle = `rgba(255,255,255,${0.25 + e.intensity * 0.2})`; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
  }

  let raf; let running = true;
  function loop() { raf = requestAnimationFrame(loop); if (running) draw(); }
  raf = requestAnimationFrame(loop);

  return {
    setShape(v) { shape = v; },
    setCut(v) { cut = v; },
    setColour(v) { colour = v; },
    setEnv(v) { env = v; },
    setCarat(v) { carat = v; },
    setRunning(v) { running = v; },
    redraw() { resize(); draw(); },
    destroy() { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); },
  };
}

// --- tiny colour helpers ---
function hex(n) { return '#' + n.toString(16).padStart(6, '0'); }
function warmWhite(warmth, a) {
  const r = 255, g = Math.round(255 - Math.max(0, -warmth) * 40), b = Math.round(255 - Math.max(0, warmth) * 70);
  return `rgba(${r},${g},${b},${a})`;
}
function shade(hexStr, f) {
  const { r, g, b } = parse(hexStr);
  return `rgb(${Math.min(255, r * f) | 0},${Math.min(255, g * f) | 0},${Math.min(255, b * f) | 0})`;
}
function mix(a, b, t) {
  const A = parse(a); const B = parse(b);
  return `rgb(${(A.r + (B.r - A.r) * t) | 0},${(A.g + (B.g - A.g) * t) | 0},${(A.b + (B.b - A.b) * t) | 0})`;
}
function parse(h) {
  const s = h.replace('#', '');
  return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
}
