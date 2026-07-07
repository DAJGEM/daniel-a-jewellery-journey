// Procedural canvas textures — no image downloads. Cached by key so repeated
// material builds share one GPU upload.

const cache = new Map();

function make(key, w, h, draw) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  cache.set(key, c);
  return c;
}

// Fine horizontal streaks → brushed-metal anisotropy (as a normal-ish bump).
export function brushedBump() {
  return make('brushed', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const y = Math.random() * h;
      const g = 96 + Math.random() * 64;
      ctx.strokeStyle = `rgb(${g},${g},${g})`;
      ctx.lineWidth = Math.random() < 0.5 ? 1 : 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + (Math.random() - 0.5) * 3);
      ctx.stroke();
    }
  });
}

// Overlapping soft dents → hammered planishing marks.
export function hammeredBump() {
  return make('hammered', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 26 + Math.random() * 26;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(180,180,180,0.9)');
      g.addColorStop(0.7, 'rgba(128,128,128,0.5)');
      g.addColorStop(1, 'rgba(70,70,70,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  });
}

// Soft round alpha sprite for steam/dust points.
export function softDisc() {
  return make('softdisc', 128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}
