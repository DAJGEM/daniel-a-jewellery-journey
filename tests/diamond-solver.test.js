import { describe, it, expect } from 'vitest';
import { diamondMm, diamondPriceCAD, lightPerformanceScore, gemologistNote } from '../src/lib/diamond-solver.js';

describe('diamondMm', () => {
  it('a 1ct round is about 6.5 mm', () => {
    const d = diamondMm('round', 1);
    expect(d.width).toBeGreaterThan(6.2);
    expect(d.width).toBeLessThan(6.8);
    expect(d.length).toBeCloseTo(d.width, 1); // round is 1:1
  });
  it('a marquise is much longer than it is wide', () => {
    const d = diamondMm('marquise', 1);
    expect(d.length / d.width).toBeGreaterThan(1.7);
  });
  it('bigger carat → bigger stone', () => {
    expect(diamondMm('round', 2).width).toBeGreaterThan(diamondMm('round', 1).width);
  });
});

describe('diamondPriceCAD', () => {
  it('rises with carat, cut, colour and clarity', () => {
    const base = diamondPriceCAD('round', 1, 'excellent', 'H', 'VS');
    expect(diamondPriceCAD('round', 2, 'excellent', 'H', 'VS')).toBeGreaterThan(base);
    expect(diamondPriceCAD('round', 1, 'ideal', 'H', 'VS')).toBeGreaterThan(base);
    expect(diamondPriceCAD('round', 1, 'excellent', 'D', 'VS')).toBeGreaterThan(base);
    expect(diamondPriceCAD('round', 1, 'excellent', 'H', 'VVS')).toBeGreaterThan(base);
  });
  it('a fair-cut stone is cheaper than an ideal one', () => {
    expect(diamondPriceCAD('round', 1, 'fair', 'H', 'VS'))
      .toBeLessThan(diamondPriceCAD('round', 1, 'ideal', 'H', 'VS'));
  });
  it('returns a positive number', () => {
    expect(diamondPriceCAD('oval', 1.5, 'ideal', 'F', 'VS')).toBeGreaterThan(0);
  });
});

describe('lightPerformanceScore', () => {
  it('ideal round in sunlight scores higher than fair emerald in office light', () => {
    expect(lightPerformanceScore('round', 'ideal', 'sunlight'))
      .toBeGreaterThan(lightPerformanceScore('emerald', 'fair', 'office'));
  });
  it('is bounded 0–100', () => {
    const s = lightPerformanceScore('round', 'ideal', 'sunlight');
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe('gemologistNote', () => {
  it('warns when a step cut is paired with low clarity', () => {
    const note = gemologistNote({ shape: 'emerald', cut: 'excellent', colour: 'H', clarity: 'SI', env: 'showroom' });
    expect(note.toLowerCase()).toMatch(/clarity|inclusion|clean/);
  });
  it('praises an ideal cut', () => {
    const note = gemologistNote({ shape: 'round', cut: 'ideal', colour: 'F', clarity: 'VS', env: 'showroom' });
    expect(note.length).toBeGreaterThan(10);
  });
});
