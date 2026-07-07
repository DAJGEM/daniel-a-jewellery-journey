// Optional synthesized ambience — a soft filtered "furnace bed" plus milestone
// chimes. Off by default; the toggle persists for the session. Built with
// WebAudio so there are no audio files to download.

export function createAudio(root) {
  let ctx = null; let bed = null; let gain = null;
  let on = sessionStorage.getItem('journey_sound') === 'on';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'journey-sound';
  btn.setAttribute('aria-pressed', String(on));
  btn.setAttribute('aria-label', 'Toggle ambient sound');
  btn.innerHTML = iconFor(on);
  root.appendChild(btn);

  function iconFor(state) {
    return state
      ? '<span aria-hidden="true">♪</span><span class="sound-text">Sound on</span>'
      : '<span aria-hidden="true">♪</span><span class="sound-text">Sound off</span>';
  }

  function start() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    // Brown-noise furnace bed.
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    bed = ctx.createBufferSource();
    bed.buffer = noiseBuf; bed.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 320;
    gain = ctx.createGain(); gain.gain.value = 0;
    bed.connect(lp).connect(gain).connect(ctx.destination);
    bed.start();
  }

  function apply() {
    btn.innerHTML = iconFor(on);
    btn.setAttribute('aria-pressed', String(on));
    if (on) { start(); if (ctx) { ctx.resume(); gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.2); } }
    else if (gain && ctx) gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    sessionStorage.setItem('journey_sound', on ? 'on' : 'off');
  }

  btn.addEventListener('click', () => { on = !on; apply(); });
  if (on) apply();

  return {
    chime() {
      if (!on || !ctx) return;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
      o.connect(g).connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 1.2);
    },
  };
}
