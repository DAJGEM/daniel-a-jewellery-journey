// Persistent HUD: act progress dots (click to jump), an act label that fades in
// on change, and a "Book a visit" pill that appears after Act 3.

import { scrollToSection } from '../core/scroll.js';

const ACT_LABELS = [
  'The Hero', 'The Mine', 'The Furnace', 'The Alloy', 'The Cast',
  'The Finish', 'The Stones', 'The Microscope', 'The Test', 'Your Piece',
];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export function createHud(root, sections) {
  const hud = document.createElement('div');
  hud.className = 'journey-hud';
  hud.innerHTML = `
    <ol class="hud-dots" role="list" aria-label="Journey chapters"></ol>
    <div class="hud-label" aria-hidden="true"></div>`;
  root.appendChild(hud);

  const dotsEl = hud.querySelector('.hud-dots');
  const labelEl = hud.querySelector('.hud-label');
  const dots = sections.map((sec, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hud-dot';
    b.setAttribute('aria-label', `Act ${ROMAN[i]} — ${ACT_LABELS[i]}`);
    b.addEventListener('click', () => scrollToSection(sec));
    li.appendChild(b);
    dotsEl.appendChild(li);
    return b;
  });

  // "Book a visit" pill, from Act 3 onward, dismissable for the session.
  const pill = document.createElement('a');
  pill.className = 'journey-book-pill';
  pill.href = (window.JOURNEY_CONFIG && window.JOURNEY_CONFIG.contactUrl) || '/contact';
  pill.innerHTML = '<span>Book a visit</span><button type="button" class="pill-x" aria-label="Dismiss">×</button>';
  root.appendChild(pill);
  pill.querySelector('.pill-x').addEventListener('click', (e) => {
    e.preventDefault();
    pill.classList.remove('is-shown');
    sessionStorage.setItem('journey_pill_dismissed', '1');
  });

  let labelTimer;
  return {
    setActive(index) {
      dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
      labelEl.textContent = `Act ${ROMAN[index]} · ${ACT_LABELS[index]}`;
      labelEl.classList.add('is-shown');
      clearTimeout(labelTimer);
      labelTimer = setTimeout(() => labelEl.classList.remove('is-shown'), 2200);
      const dismissed = sessionStorage.getItem('journey_pill_dismissed');
      pill.classList.toggle('is-shown', index >= 2 && !dismissed);
    },
  };
}
