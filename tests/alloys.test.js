import { describe, it, expect } from 'vitest';
import { ALLOYS, alloyValueCAD } from '../src/data/alloys.js';
import { STONES } from '../src/data/stones.js';

describe('alloys', () => {
  it('18k yellow has correct purity/density/hardness', () => {
    const a = ALLOYS['gold-18k-yellow'];
    expect(a.purity).toBe(0.75);
    expect(a.density).toBeCloseTo(15.5, 1);
    expect(a.vickers).toBe(125);
  });

  it('covers all nine alloy keys with complete entries', () => {
    const keys = [
      'gold-24k-yellow', 'gold-22k-yellow', 'gold-18k-yellow', 'gold-18k-white',
      'gold-18k-rose', 'gold-14k-yellow', 'gold-14k-white', 'gold-14k-rose',
      'platinum-950',
    ];
    for (const k of keys) {
      const a = ALLOYS[k];
      expect(a, k).toBeDefined();
      expect(a.label.length, k).toBeGreaterThan(3);
      expect(a.purity, k).toBeGreaterThan(0.5);
      expect(a.colourHex, k).toBeTypeOf('number');
      expect(a.vickers, k).toBeGreaterThan(10);
      expect(a.density, k).toBeGreaterThan(10);
      expect(a.blurb.length, k).toBeGreaterThan(20);
    }
  });

  it('value: 10g 18k at $2400/oz, 1.37 CAD', () => {
    expect(alloyValueCAD('gold-18k-yellow', 10, 2400, 1.37)).toBeCloseTo(792.85, 0);
  });
});

describe('stones', () => {
  it('has six stones with honest price bands', () => {
    const keys = ['natural-diamond', 'lab-diamond', 'moissanite', 'sapphire', 'ruby', 'emerald'];
    for (const k of keys) {
      const s = STONES[k];
      expect(s, k).toBeDefined();
      const [lo, hi] = s.pricePerCaratCAD;
      expect(lo, k).toBeGreaterThan(0);
      expect(hi, k).toBeGreaterThan(lo);
      expect(s.blurb.length, k).toBeGreaterThan(20);
    }
  });

  it('lab diamond is markedly cheaper than natural', () => {
    expect(STONES['lab-diamond'].pricePerCaratCAD[1]).toBeLessThan(STONES['natural-diamond'].pricePerCaratCAD[0] * 1.2);
  });
});
