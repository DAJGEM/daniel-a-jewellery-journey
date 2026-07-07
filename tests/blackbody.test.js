import { describe, it, expect } from 'vitest';
import { glow } from '../src/lib/blackbody.js';

describe('black-body glow', () => {
  it('room temperature: no glow', () => {
    expect(glow(20).intensity).toBe(0);
  });

  it('melting point: full intensity, red saturated', () => {
    const g = glow(1064);
    expect(g.intensity).toBe(1);
    expect(g.r).toBe(255);
    expect(g.g).toBeGreaterThan(60);
    expect(g.b).toBe(0);
  });

  it('900°C is dimmer and redder than 1064°C', () => {
    expect(glow(900).intensity).toBeLessThan(1);
    expect(glow(900).g).toBeLessThan(glow(1064).g);
  });

  it('intensity rises monotonically through the working range', () => {
    let prev = -1;
    for (const c of [500, 650, 800, 950, 1064, 1120]) {
      const { intensity } = glow(c);
      expect(intensity).toBeGreaterThanOrEqual(prev);
      prev = intensity;
    }
  });
});
