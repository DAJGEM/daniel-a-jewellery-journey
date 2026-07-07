import { describe, it, expect } from 'vitest';
import { FORM_VOLUMES_CM3, estimateWeightGrams } from '../src/lib/calculator.js';

describe('weight calculator', () => {
  it('ring in 18k yellow ≈ 4 g', () => {
    expect(estimateWeightGrams('ring', 'gold-18k-yellow')).toBeCloseTo(4.03, 1);
  });

  it('scale multiplies volume', () => {
    expect(estimateWeightGrams('chain', 'gold-14k-yellow', 2))
      .toBeCloseTo(FORM_VOLUMES_CM3.chain * 13.6 * 2, 3);
  });

  it('platinum ring outweighs the same ring in 14k', () => {
    expect(estimateWeightGrams('ring', 'platinum-950')).toBeGreaterThan(estimateWeightGrams('ring', 'gold-14k-yellow'));
  });
});
