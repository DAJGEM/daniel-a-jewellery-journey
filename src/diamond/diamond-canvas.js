// A 2D-canvas diamond drawn as real facets. Brilliant cuts get the standard
// crown map (1 table, 8 bezel/kite facets, 8 star facets, 16 girdle facets —
// matching gemological fact); step cuts get concentric "steps"; Asscher adds a
// corner windmill. Facets are shaded light/dark by a slowly-drifting light so it
// reads like a real stone — no flashing stars, no bright central blur.

import { SHAPES, CUTS, COLOURS, ENVIRONMENTS } from '../data/diamonds.js';

export function createDiamondCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0; let H = 0; let dpr = 1;
  let shape = 'round'; let cut = 'excellent'; let colour = 'H'; let env = 'showroom';
  let carat = 1; let t = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height || 300;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function radius() { return Math.min(W, H) * 0.34 * (0.82 + Math.min(0.45, Math.cbrt(carat) - 0.62)); }

  // ---------- shape outline (girdle) ----------
  function outline(cx, cy, r) {
    const sh = SHAPES[shape]; const lw = sh.lw;
    const rw = r / Math.sqrt(lw); const rl = rw * lw;
    ctx.beginPath();
    switch (shape) {
      case 'round': ctx.arc(cx, cy, r, 0, Math.PI * 2); break;
      case 'oval': ctx.ellipse(cx, cy, rw, rl, 0, 0, Math.PI * 2); break;
      case 'cushion': roundedRect(cx, cy, rw, rl, rw * 0.42); break;
      case 'princess': roundedRect(cx, cy, rw, rl, rw * 0.06); break;
      case 'radiant': croppedRect(cx, cy, rw, rl, rw * 0.26); break;
      case 'emerald': croppedRect(cx, cy, rw, rl, rw * 0.28); break;
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
    ctx.moveTo(x + rad, y); ctx.arcTo(x + w, y, x + w, y + h, rad); ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad); ctx.arcTo(x, y, x + w, y, rad);
  }
  function croppedRect(cx, cy, rw, rl, c) {
    const x = cx - rw, y = cy - rl, w = rw * 2, h = rl * 2;
    ctx.moveTo(x + c, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h - c);
    ctx.lineTo(x + w - c, y + h); ctx.lineTo(x + c, y + h); ctx.lineTo(x, y + h - c); ctx.lineTo(x, y + c);
  }
  function pear(cx, cy, rw, rl) {
    ctx.moveTo(cx, cy - rl);
    ctx.bezierCurveTo(cx + rw * 1.3, cy - rl * 0.3, cx + rw, cy + rl, cx, cy + rl);
    ctx.bezierCurveTo(cx - rw, cy + rl, cx - rw * 1.3, cy - rl * 0.3, cx, cy - rl);
  }
  function marquise(cx, cy, rw, rl) {
    ctx.moveTo(cx, cy - rl); ctx.quadraticCurveTo(cx + rw * 1.55, cy, cx, cy + rl);
    ctx.quadraticCurveTo(cx - rw * 1.55, cy, cx, cy - rl);
  }
  function heart(cx, cy, rw, rl) {
    ctx.moveTo(cx, cy + rl);
    ctx.bezierCurveTo(cx - rw * 1.5, cy + rl * 0.1, cx - rw * 1.1, cy - rl, cx, cy - rl * 0.32);
    ctx.bezierCurveTo(cx + rw * 1.1, cy - rl, cx + rw * 1.5, cy + rl * 0.1, cx, cy + rl);
  }

  // ---------- colour helpers ----------
  const DARK = [16, 24, 38];
  function parse(h) { const s = h.replace('#', ''); return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; }
  function facetShade(v, e, colTint) {
    // v: 0 (dark facet, away from light) → 1 (bright facet, toward light)
    v = Math.max(0, Math.min(1, v));
    const bright = [
      235 + (colTint[0] - 255) * 0.5 - e.warmth * -10,
      240 + (colTint[1] - 255) * 0.5,
      248 + (colTint[2] - 255) * 0.5 + e.warmth * -18,
    ].map((n) => Math.max(0, Math.min(255, n * (0.7 + e.intensity * 0.35))));
    const r = DARK[0] + (bright[0] - DARK[0]) * v;
    const g = DARK[1] + (bright[1] - DARK[1]) * v;
    const b = DARK[2] + (bright[2] - DARK[2]) * v;
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  function fillFacet(pts, v, e, colTint) {
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
    ctx.fillStyle = facetShade(v, e, colTint); ctx.fill();
    ctx.strokeStyle = 'rgba(10,16,26,0.55)'; ctx.lineWidth = 0.75; ctx.stroke();
  }

  // ---------- facet builders (return {pts, ang}) ----------
  function ell(cx, cy, rw, rl, deg, f) { const a = (deg - 90) * Math.PI / 180; return [cx + Math.cos(a) * rw * f, cy + Math.sin(a) * rl * f]; }

  function brilliantFacets(cx, cy, rw, rl) {
    const N = 8; const facets = [];
    const T = []; const GM = []; const GV = []; const O = []; const OV = [];
    for (let k = 0; k < N; k++) {
      T.push(ell(cx, cy, rw, rl, k * 45, 0.42));       // table octagon
      GM.push(ell(cx, cy, rw, rl, k * 45, 0.9));        // girdle main (kite tips)
      GV.push(ell(cx, cy, rw, rl, k * 45 + 22.5, 0.9)); // girdle valleys
      O.push(ell(cx, cy, rw, rl, k * 45, 1.0));         // outline at mains
      OV.push(ell(cx, cy, rw, rl, k * 45 + 22.5, 1.0)); // outline at valleys
    }
    facets.push({ pts: T, ang: 0, table: true });
    for (let k = 0; k < N; k++) {
      facets.push({ pts: [T[k], GV[(k + 7) % 8], GM[k], GV[k]], ang: k * 45 });                 // bezel/kite (8)
      facets.push({ pts: [T[k], T[(k + 1) % 8], GV[k]], ang: k * 45 + 22.5 });                  // star (8)
      facets.push({ pts: [GM[k], GV[k], OV[k], O[k]], ang: k * 45 + 11 });                       // girdle right (16 total)
      facets.push({ pts: [GM[k], GV[(k + 7) % 8], OV[(k + 7) % 8], O[k]], ang: k * 45 - 11 });    // girdle left
    }
    return facets;
  }

  function stepFacets(cx, cy, r) {
    const sh = SHAPES[shape]; const rw = r / Math.sqrt(sh.lw); const rl = rw * sh.lw; const c = shape === 'asscher' ? 0.34 : 0.28;
    const rings = [1.0, 0.78, 0.56, 0.34]; const facets = [];
    const corner = (f) => [[cx - rw * f + rw * c * f, cy - rl * f], [cx + rw * f - rw * c * f, cy - rl * f], [cx + rw * f, cy - rl * f + rl * c * f],
      [cx + rw * f, cy + rl * f - rl * c * f], [cx + rw * f - rw * c * f, cy + rl * f], [cx - rw * f + rw * c * f, cy + rl * f],
      [cx - rw * f, cy + rl * f - rl * c * f], [cx - rw * f, cy - rl * f + rl * c * f]];
    for (let i = 0; i < rings.length - 1; i++) {
      const a = corner(rings[i]); const b = corner(rings[i + 1]);
      for (let j = 0; j < 8; j++) facets.push({ pts: [a[j], a[(j + 1) % 8], b[(j + 1) % 8], b[j]], ang: j * 45, step: i }); // step bands
    }
    facets.push({ pts: corner(rings[rings.length - 1]), ang: 0, table: true }); // inner table
    if (shape === 'asscher') { // windmill diagonals to corners
      const o = corner(1.0);
      for (let j = 0; j < 8; j += 2) facets.push({ pts: [o[j], o[(j + 1) % 8], [cx, cy]], ang: j * 45 + 20, wind: true });
    }
    return facets;
  }

  function princessFacets(cx, cy, rw, rl) {
    const c = [[cx - rw, cy - rl], [cx + rw, cy - rl], [cx + rw, cy + rl], [cx - rw, cy + rl]]; // corners
    const m = [[cx, cy - rl], [cx + rw, cy], [cx, cy + rl], [cx - rw, cy]]; // edge mids
    const tbl = c.map((p) => [cx + (p[0] - cx) * 0.42, cy + (p[1] - cy) * 0.42]);
    const facets = [{ pts: tbl, ang: 0, table: true }];
    for (let i = 0; i < 4; i++) {
      facets.push({ pts: [tbl[i], c[i], tbl[(i + 1) % 4]], ang: 45 + i * 90 });          // corner chevron
      facets.push({ pts: [tbl[i], m[i], tbl[(i + 3) % 4]], ang: i * 90 });               // edge chevron
      facets.push({ pts: [c[i], m[i], tbl[i]], ang: 22 + i * 90 });                      // fill A
      facets.push({ pts: [c[i], m[(i + 3) % 4], tbl[i]], ang: -22 + i * 90 });           // fill B
    }
    return facets;
  }

  function buildFacets(cx, cy, r) {
    const sh = SHAPES[shape]; const rw = r / Math.sqrt(sh.lw); const rl = rw * sh.lw;
    if (sh.facets === 'step') return stepFacets(cx, cy, r);
    if (shape === 'princess' || shape === 'radiant') return princessFacets(cx, cy, rw, rl);
    return brilliantFacets(cx, cy, rw, rl);
  }

  // ---------- render ----------
  function draw() {
    if (!W || !H) resize();
    if (!W || !H) return;
    const e = ENVIRONMENTS[env]; const c = CUTS[cut]; const colTint = parse('#' + COLOURS[colour].tint.toString(16).padStart(6, '0'));
    ctx.clearRect(0, 0, W, H);
    // backdrop
    const bg = ctx.createRadialGradient(W / 2, H * 0.4, 10, W / 2, H / 2, Math.max(W, H) * 0.7);
    bg.addColorStop(0, shade(e.bg, 1.25)); bg.addColorStop(1, e.bg);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W / 2; const cy = H / 2; const r = radius();
    const light = t * (0.35 + e.sparkle * 0.25);       // slow, smooth — never flashes
    const contrast = 0.35 + c.lightReturn * 1.15;      // ideal → crisp; fair → flat
    const leak = 1 - c.lightReturn;

    ctx.save();
    outline(cx, cy, r); ctx.clip();

    const facets = buildFacets(cx, cy, r);
    for (const f of facets) {
      let v;
      if (f.table) v = 0.62 + 0.12 * Math.cos(light * 0.7);
      else {
        const a = f.ang * Math.PI / 180;
        v = 0.5 + 0.5 * Math.cos(2 * a - light + (f.step || 0) * 1.1 + (f.wind ? 1.6 : 0));
      }
      v = 0.5 + (v - 0.5) * (contrast / 1.5);           // apply cut contrast around mid
      fillFacet(f.pts, v, e, colTint);
    }

    // poor-cut "window": a flat, lifeless centre where light leaks out the back
    if (leak > 0.14) {
      outline(cx, cy, r * 0.5); ctx.fillStyle = `rgba(120,132,150,${leak * 0.55})`; ctx.fill();
    }
    // gentle top-light sheen across the crown (directional, not a central blob)
    const sheen = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    sheen.addColorStop(0, `rgba(255,255,255,${0.10 + e.intensity * 0.08})`);
    sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen; ctx.fillRect(cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
    ctx.restore();

    // rim
    ctx.save(); outline(cx, cy, r); ctx.strokeStyle = `rgba(255,255,255,${0.3 + e.intensity * 0.2})`; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
  }

  let raf; let running = true;
  function loop(now) { raf = requestAnimationFrame(loop); t = (now || 0) / 1000; if (running) draw(); }
  raf = requestAnimationFrame(loop);

  return {
    setShape(v) { shape = v; }, setCut(v) { cut = v; }, setColour(v) { colour = v; },
    setEnv(v) { env = v; }, setCarat(v) { carat = v; }, setRunning(v) { running = v; },
    redraw() { resize(); draw(); },
    destroy() { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); },
  };
}

function shade(hexStr, f) {
  const s = hexStr.replace('#', '');
  const r = parseInt(s.slice(0, 2), 16), g = parseInt(s.slice(2, 4), 16), b = parseInt(s.slice(4, 6), 16);
  return `rgb(${Math.min(255, r * f) | 0},${Math.min(255, g * f) | 0},${Math.min(255, b * f) | 0})`;
}
