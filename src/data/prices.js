// Live spot prices — same proven free sources as the Gold Market section:
// gold-api.com for metal spot (USD/oz), frankfurter.dev (ECB) for USD→CAD.
// Gold + FX are mandatory (whole call rejects without them, so callers show
// the "temporarily unavailable" message instead of stale numbers); silver and
// platinum are best-effort extras.

import { TROY_OZ_GRAMS } from './alloys.js';

const METAL_URL = (symbol) => `https://api.gold-api.com/price/${symbol}`;
const FX_URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=CAD';

async function getJson(fetchImpl, url) {
  const res = await fetchImpl(url);
  if (res.ok === false) throw new Error(`HTTP error for ${url}`);
  return res.json();
}

export async function fetchSpotPrices(fetchImpl = fetch) {
  const [gold, silver, platinum, palladium, fx] = await Promise.allSettled([
    getJson(fetchImpl, METAL_URL('XAU')),
    getJson(fetchImpl, METAL_URL('XAG')),
    getJson(fetchImpl, METAL_URL('XPT')),
    getJson(fetchImpl, METAL_URL('XPD')),
    getJson(fetchImpl, FX_URL),
  ]);

  if (gold.status === 'rejected') throw new Error('gold spot unavailable');
  if (fx.status === 'rejected') throw new Error('USD/CAD rate unavailable');

  const metal = (settled) =>
    settled.status === 'fulfilled' && typeof settled.value?.price === 'number'
      ? { usdPerOz: settled.value.price }
      : null;

  const goldOut = metal(gold);
  const usdCad = fx.value?.rates?.CAD;
  if (!goldOut || typeof usdCad !== 'number') throw new Error('price data malformed');

  return {
    gold: goldOut,
    silver: metal(silver),
    platinum: metal(platinum),
    palladium: metal(palladium),
    usdCad,
    fetchedAt: Date.now(),
  };
}

export function pricePerGramCAD(usdPerOz, usdCad, purity = 1) {
  return (usdPerOz / TROY_OZ_GRAMS) * usdCad * purity;
}
