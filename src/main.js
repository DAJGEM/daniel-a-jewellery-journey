// The Melting Pot — boot. Builds the interactive foundry inside its mount and
// wires the service CTAs. Degrades to the static (crawlable) content if the
// browser can't run the workbench.

import { createFoundry } from './melting/foundry.js';

function supportsCanvas() {
  try { return !!document.createElement('canvas').getContext('2d'); } catch { return false; }
}

function boot() {
  const root = document.getElementById('melting-pot-root');
  if (!root) return;
  if (window.__meltingpot) return; // guard against the host running us twice

  const cfg = (window.JOURNEY_CONFIG || window.MELTING_POT_CONFIG || {});
  const contactUrl = cfg.contactUrl || '/contact';

  // Point every service link at the real contact/booking page.
  root.querySelectorAll('a[data-link="contact"]').forEach((a) => a.setAttribute('href', contactUrl));

  const mount = document.getElementById('mp-workbench');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!mount || !supportsCanvas() || reduced) {
    root.classList.add('mp-static');
    return;
  }

  try {
    window.__meltingpot = createFoundry(mount, { contactUrl });
  } catch (err) {
    console.error('Melting Pot failed to start, showing static content', err);
    root.classList.add('mp-static');
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
