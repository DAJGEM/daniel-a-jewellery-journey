// Adaptive quality: pick a tier once at boot, let every system scale from it.

export function detectQuality() {
  const params = new URLSearchParams(location.search);
  const forced = params.get('tier');

  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  let tier = 'high';
  if (mobile || cores <= 4 || memory <= 4) tier = 'mid';
  if ((mobile && cores <= 4) || memory <= 2) tier = 'low';
  if (forced === 'high' || forced === 'mid' || forced === 'low') tier = forced;

  const dpr = Math.min(
    window.devicePixelRatio || 1,
    tier === 'high' ? 2 : tier === 'mid' ? 1.5 : 1,
  );

  const particleScale = tier === 'high' ? 1 : tier === 'mid' ? 0.5 : 0.25;

  return { tier, dpr, particleScale };
}
