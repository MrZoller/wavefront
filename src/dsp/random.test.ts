import { describe, it, expect } from 'vitest';
import { mulberry32, gaussianNoise, bipolarSequence } from './random';

describe('seeded PRNG', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });

  it('produces different streams for different seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it('stays within [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('gaussianNoise', () => {
  it('has approximately zero mean and the requested standard deviation', () => {
    const n = 20000;
    const sigma = 2;
    const x = gaussianNoise(n, sigma, 99);
    const mean = x.reduce((s, v) => s + v, 0) / n;
    const variance = x.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    expect(Math.abs(mean)).toBeLessThan(0.05);
    expect(Math.sqrt(variance)).toBeCloseTo(sigma, 1);
  });

  it('is deterministic for a given seed', () => {
    expect(gaussianNoise(16, 1, 5)).toEqual(gaussianNoise(16, 1, 5));
  });
});

describe('bipolarSequence', () => {
  it('contains only ±1 and is deterministic', () => {
    const x = bipolarSequence(50, 3);
    expect(x.every((v) => v === 1 || v === -1)).toBe(true);
    expect(x).toEqual(bipolarSequence(50, 3));
  });
});
