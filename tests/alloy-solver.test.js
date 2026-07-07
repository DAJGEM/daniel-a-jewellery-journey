import { describe, it, expect } from 'vitest';
import { solveAlloy, meltValueCAD } from '../src/lib/alloy-solver.js';
import { RECIPE_BY_ID } from '../src/data/recipes.js';

const g = (mix) => solveAlloy(mix);

describe('solveAlloy — gold colours & karat', () => {
  it('18K yellow: 75/12.5/12.5 → 18K, yellow, recognised', () => {
    const r = g({ au: 75, ag: 12.5, cu: 12.5 });
    expect(r.family).toBe('gold');
    expect(r.karat).toBe(18);
    expect(r.colour).toBe('Yellow gold');
    expect(r.recognized?.id).toBe('18k-yellow');
  });

  it('18K rose: copper-heavy → rose gold', () => {
    const r = g({ au: 75, cu: 22.5, ag: 2.5 });
    expect(r.karat).toBe(18);
    expect(r.colour).toBe('Rose gold');
  });

  it('18K white with palladium → white gold', () => {
    const r = g({ au: 75, pd: 25 });
    expect(r.karat).toBe(18);
    expect(r.colour).toBe('White gold');
  });

  it('pure gold → 24K', () => {
    expect(g({ au: 100 }).karat).toBe(24);
  });

  it('purple gold: gold + aluminium → purple, not wearable as a ring', () => {
    const r = g({ au: 79, al: 21 });
    expect(r.colour).toBe('Purple gold');
    expect(r.wearable).toBe(false);
  });
});

describe('solveAlloy — non-gold families', () => {
  it('sterling silver 925 recognised', () => {
    const r = g({ ag: 92.5, cu: 7.5 });
    expect(r.family).toBe('silver');
    expect(r.recognized?.id).toBe('sterling');
  });

  it('yellow brass: copper + zinc, no gold', () => {
    const r = g({ cu: 65, zn: 35 });
    expect(r.family).toBe('brass');
    expect(r.karat).toBeNull();
    expect(r.colour.toLowerCase()).toContain('brass');
  });

  it('bronze: copper + tin', () => {
    expect(g({ cu: 88, sn: 12 }).family).toBe('bronze');
  });

  it('platinum 950', () => {
    const r = g({ pt: 95, pd: 5 });
    expect(r.family).toBe('platinum');
  });

  it('lead flags a toxicity warning', () => {
    const r = g({ pb: 100 });
    expect(r.verdict.toLowerCase()).toMatch(/toxic|never|not/);
  });

  it('empty crucible', () => {
    expect(g({}).family).toBe('empty');
  });
});

describe('recognises every bench classic it can produce', () => {
  for (const id of ['fine-gold', '18k-yellow', '18k-rose', 'sterling', 'yellow-brass', 'bronze', 'pt950']) {
    it(`round-trips ${id}`, () => {
      const r = solveAlloy(RECIPE_BY_ID[id].mix);
      expect(r.recognized?.id).toBe(id);
    });
  }
});

describe('meltValueCAD', () => {
  it('values only the priced metals', () => {
    const prices = { gold: { usdPerOz: 2400 }, silver: { usdPerOz: 30 }, platinum: null, palladium: null, usdCad: 1.4 };
    // 10 g of pure gold
    const v = meltValueCAD({ au: 10 }, prices);
    expect(v).toBeCloseTo(10 * (2400 / 31.1035) * 1.4, 0);
  });
  it('base metals contribute ~nothing', () => {
    const prices = { gold: { usdPerOz: 2400 }, silver: null, platinum: null, palladium: null, usdCad: 1.4 };
    expect(meltValueCAD({ cu: 50, zn: 50 }, prices)).toBe(0);
  });
});
