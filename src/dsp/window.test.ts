import { describe, it, expect } from 'vitest';
import { windowFn, type WindowName } from './window';

const symmetric = (w: number[]) => {
  for (let i = 0; i < w.length; i++) expect(w[i]).toBeCloseTo(w[w.length - 1 - i], 12);
};

describe('window functions', () => {
  it('rectangular is all ones', () => {
    expect(windowFn('rectangular', 8)).toEqual(new Array(8).fill(1));
  });

  // Generalized-cosine endpoints/center, re-derived from the closed forms (n odd ⇒ exact center bin):
  //   Hann     0.5 − 0.5·cos     → ends 0,    center 1
  //   Hamming  0.54 − 0.46·cos   → ends 0.08, center 1
  //   Blackman 0.42 − 0.5·cos + 0.08·cos2 → ends 0, center 1
  const cases: Array<{ name: WindowName; end: number; center: number }> = [
    { name: 'hann', end: 0, center: 1 },
    { name: 'hamming', end: 0.08, center: 1 },
    { name: 'blackman', end: 0, center: 1 },
  ];

  for (const { name, end, center } of cases) {
    it(`${name} has the textbook endpoints (${end}) and unit center, and is symmetric`, () => {
      const n = 65; // odd ⇒ a true center sample at index 32
      const w = windowFn(name, n);
      expect(w[0]).toBeCloseTo(end, 12);
      expect(w[n - 1]).toBeCloseTo(end, 12);
      expect(w[(n - 1) / 2]).toBeCloseTo(center, 12);
      symmetric(w);
      // Tapering windows never exceed their unit center.
      expect(Math.max(...w)).toBeCloseTo(center, 12);
    });
  }

  it('matches the exact Hann coefficients at a small length', () => {
    // n=5: 0.5 − 0.5·cos(2πi/4) → [0, 0.5, 1, 0.5, 0].
    const w = windowFn('hann', 5);
    [0, 0.5, 1, 0.5, 0].forEach((v, i) => expect(w[i]).toBeCloseTo(v, 12));
  });

  it('degenerate lengths return all ones (no divide-by-zero)', () => {
    expect(windowFn('hann', 1)).toEqual([1]);
    expect(windowFn('hann', 0)).toEqual([]);
  });
});
