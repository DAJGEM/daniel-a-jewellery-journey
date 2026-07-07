import { describe, it, expect } from 'vitest';
import { fetchSpotPrices, pricePerGramCAD } from '../src/data/prices.js';

function mockFetch(map) {
  return async (url) => {
    for (const [match, value] of Object.entries(map)) {
      if (url.includes(match)) {
        if (value instanceof Error) throw value;
        return { ok: true, json: async () => value };
      }
    }
    throw new Error('unexpected url ' + url);
  };
}

describe('fetchSpotPrices', () => {
  it('returns gold/silver/fx; platinum null when its endpoint fails', async () => {
    const fetchImpl = mockFetch({
      XAU: { price: 2400 },
      XAG: { price: 29 },
      XPT: new Error('down'),
      frankfurter: { rates: { CAD: 1.37 } },
    });
    const p = await fetchSpotPrices(fetchImpl);
    expect(p.gold.usdPerOz).toBe(2400);
    expect(p.silver.usdPerOz).toBe(29);
    expect(p.platinum).toBeNull();
    expect(p.usdCad).toBe(1.37);
    expect(p.fetchedAt).toBeTypeOf('number');
  });

  it('rejects when the gold endpoint fails', async () => {
    const fetchImpl = mockFetch({
      XAU: new Error('down'),
      XAG: { price: 29 },
      XPT: { price: 1000 },
      frankfurter: { rates: { CAD: 1.37 } },
    });
    await expect(fetchSpotPrices(fetchImpl)).rejects.toThrow();
  });

  it('rejects when FX fails', async () => {
    const fetchImpl = mockFetch({
      XAU: { price: 2400 },
      XAG: { price: 29 },
      XPT: { price: 1000 },
      frankfurter: new Error('down'),
    });
    await expect(fetchSpotPrices(fetchImpl)).rejects.toThrow();
  });
});

describe('pricePerGramCAD', () => {
  it('18k gram price at $2400/oz and 1.37', () => {
    expect(pricePerGramCAD(2400, 1.37, 0.75)).toBeCloseTo(79.29, 1);
  });
});
