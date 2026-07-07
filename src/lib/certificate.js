// Certificate + photo generation. Both return PNG data URLs.

import { ALLOYS } from '../data/alloys.js';
import { STONES } from '../data/stones.js';
import { estimateWeightGrams } from './calculator.js';
import { alloyValueCAD } from '../data/alloys.js';

export function snapshotPiece(renderer, scene, camera) {
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
}

export function renderCertificate(state, canvas, prices) {
  const ctx = canvas.getContext('2d');
  const W = 1200, H = 1600;
  canvas.width = W; canvas.height = H;

  // Ground.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d0b08');
  bg.addColorStop(1, '#141009');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Gold border.
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.strokeRect(50, 50, W - 100, H - 100);
  ctx.strokeStyle = 'rgba(212,175,55,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(66, 66, W - 132, H - 132);

  const centre = W / 2;
  ctx.textAlign = 'center';

  ctx.fillStyle = '#b8a668';
  ctx.font = '600 26px Montserrat, sans-serif';
  ctx.fillText('D A N I E L   A   J E W E L L E R Y', centre, 170);

  ctx.fillStyle = '#f3cb7a';
  ctx.font = '600 76px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('Certificate of Craft', centre, 270);

  ctx.fillStyle = '#8f8674';
  ctx.font = 'italic 30px "Cormorant Garamond", serif';
  ctx.fillText('The Journey of Gold — From Earth to Forever', centre, 320);

  const name = (state.firstName || '').trim() || 'A Future Heirloom';
  ctx.fillStyle = '#f4efe6';
  ctx.font = 'italic 60px "Cormorant Garamond", serif';
  ctx.fillText(`Crafted by ${name}`, centre, 470);

  // Configuration table.
  const alloy = ALLOYS[state.alloy];
  const grams = estimateWeightGrams(state.form || 'ring', state.alloy);
  const rows = [
    ['Piece', (state.form || 'ring').replace(/^\w/, (c) => c.toUpperCase())],
    ['Metal', alloy?.label || state.alloy],
    ['Finish', (state.finish || 'mirror').replace(/^\w/, (c) => c.toUpperCase())],
    ['Engraving', state.engraving ? `“${state.engraving}”` : '—'],
    ['Stone', state.stone ? `${STONES[state.stone].label}, ${(state.stoneCarat || 1).toFixed(2)} ct` : 'None'],
    ['Est. weight', `${grams.toFixed(1)} g`],
  ];
  if (prices && prices.gold && !state.alloy.startsWith('platinum')) {
    rows.push(['Metal market value', fmt(alloyValueCAD(state.alloy, grams, prices.gold.usdPerOz, prices.usdCad))]);
  }

  let y = 620;
  ctx.font = '30px Montserrat, sans-serif';
  rows.forEach(([k, v]) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8f8674';
    ctx.fillText(k, 200, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f4efe6';
    ctx.fillText(String(v), W - 200, y);
    ctx.strokeStyle = 'rgba(212,175,55,0.18)';
    ctx.beginPath(); ctx.moveTo(200, y + 22); ctx.lineTo(W - 200, y + 22); ctx.stroke();
    y += 90;
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#b8a668';
  ctx.font = '600 24px Montserrat, sans-serif';
  ctx.fillText('London, Ontario · Canada', centre, H - 220);
  ctx.fillStyle = '#8f8674';
  ctx.font = '20px Montserrat, sans-serif';
  ctx.fillText(new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }), centre, H - 180);
  ctx.fillStyle = 'rgba(244,239,230,0.5)';
  ctx.font = 'italic 22px "Cormorant Garamond", serif';
  ctx.fillText('A keepsake of your journey — market values shown are not a retail quote.', centre, H - 130);

  return canvas.toDataURL('image/png');
}

function fmt(n) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
}
