import { describe, it, expect } from 'vitest';
import { crossCorrelate, autoCorrelate, peakLag } from './correlation';
import { bipolarSequence } from './random';

describe('cross-correlation', () => {
  it('autocorrelation peaks at lag 0 with value = signal energy', () => {
    const x = [1, 2, 3];
    const c = autoCorrelate(x);
    expect(peakLag(c)).toBe(0);
    const zeroIdx = c.lags.indexOf(0);
    expect(c.values[zeroIdx]).toBeCloseTo(1 + 4 + 9, 12); // Σ x²
  });

  it('detects a known delay: peak lag equals the shift', () => {
    const ref = [1, 2, 3, 0, 0];
    const delay = 2;
    // sig = ref delayed by `delay` samples.
    const sig = [0, 0, 1, 2, 3];
    const c = crossCorrelate(ref, sig);
    expect(peakLag(c)).toBe(delay);
  });

  it('recovers delay for a random reference even with added noise', () => {
    const N = 64;
    const ref = bipolarSequence(N, 42);
    const delay = 9;
    // Build a delayed copy with small noise.
    const sig = new Array(N).fill(0);
    for (let n = 0; n < N; n++) {
      const src = n - delay;
      sig[n] = (src >= 0 && src < N ? ref[src] : 0) + 0.2 * Math.sin(n);
    }
    const c = crossCorrelate(ref, sig);
    expect(peakLag(c)).toBe(delay);
  });

  it('produces the full lag range', () => {
    const c = crossCorrelate([1, 2, 3], [4, 5, 6, 7]);
    expect(c.lags[0]).toBe(-2); // −(n−1)
    expect(c.lags[c.lags.length - 1]).toBe(3); // m−1
    expect(c.lags.length).toBe(c.values.length);
  });

  it('matches a hand-computed cross-correlation', () => {
    // ref=[1,2], sig=[3,4]; c[ℓ]=Σ ref[n]·sig[n+ℓ]
    // ℓ=-1: ref[1]*sig[0]=2*3=6 ; ℓ=0: 1*3+2*4=11 ; ℓ=1: ref[0]*sig[1]=1*4=4
    const c = crossCorrelate([1, 2], [3, 4]);
    expect(c.lags).toEqual([-1, 0, 1]);
    expect(c.values).toEqual([6, 11, 4]);
  });
});
