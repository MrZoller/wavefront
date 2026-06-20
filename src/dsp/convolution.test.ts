import { describe, it, expect } from 'vitest';
import { convolve, convolveAt } from './convolution';
import { crossCorrelate } from './correlation';

describe('convolve (linear convolution)', () => {
  it('identity: convolving with a unit impulse returns the input unchanged', () => {
    expect(convolve([2, -3, 5, 0.5], [1])).toEqual([2, -3, 5, 0.5]);
  });

  it('a shifted unit impulse delays the input (h = [0,1] → shift by one)', () => {
    expect(convolve([2, -3, 5], [0, 1])).toEqual([0, 2, -3, 5]);
  });

  it('output length is len(x) + len(h) − 1', () => {
    const x = [1, 2, 3, 4, 5];
    const h = [1, 0, -1];
    expect(convolve(x, h).length).toBe(x.length + h.length - 1);
  });

  it('commutes: convolve(x, h) === convolve(h, x)', () => {
    const x = [1, -2, 0.5, 3];
    const h = [0.25, 1, -0.5];
    const a = convolve(x, h);
    const b = convolve(h, x);
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) expect(a[i]).toBeCloseTo(b[i], 12);
  });

  it('matches small worked-by-hand examples', () => {
    // [1,2,3] ⊛ [1,1] = [1,3,5,3]
    expect(convolve([1, 2, 3], [1, 1])).toEqual([1, 3, 5, 3]);
    // [1,2,3] ⊛ [0,1,0.5] = [0,1,2.5,4,1.5]
    expect(convolve([1, 2, 3], [0, 1, 0.5])).toEqual([0, 1, 2.5, 4, 1.5]);
  });
});

describe('convolveAt (one output sample at slide position k)', () => {
  it('agrees with convolve at every k, and is 0 outside the support', () => {
    const x = [1, -2, 0.5, 3, 0, -1];
    const h = [0.5, 1, -0.25, 2];
    const full = convolve(x, h);
    for (let k = 0; k < full.length; k++) expect(convolveAt(x, h, k)).toBeCloseTo(full[k], 12);
    expect(convolveAt(x, h, -1)).toBe(0);
    expect(convolveAt(x, h, full.length)).toBe(0);
  });
});

describe('cross-link correctness: convolving with a flipped pulse is the matched filter', () => {
  // The matched filter for a known pulse is cross-correlation against that pulse, and cross-correlation
  // is convolution with a *time-reversed* copy. Proving they agree numerically is what lets the module
  // claim "the matched filter is the same operation, with h = the flipped pulse".
  it('convolve(sig, reverse(pulse)) equals crossCorrelate(pulse, sig)', () => {
    const pulse = [1, 0.6, 0.35, 0.15];
    const sig = [0, 0, 1, 0.6, 0.35, 0.15, 0, -0.4, 0];
    const flipped = [...pulse].reverse();
    const conv = convolve(sig, flipped);
    const corr = crossCorrelate(pulse, sig).values;
    expect(conv.length).toBe(corr.length);
    for (let i = 0; i < conv.length; i++) expect(conv[i]).toBeCloseTo(corr[i], 12);
  });
});
