import { describe, it, expect } from 'vitest';
import {
  crossCorrelate,
  autoCorrelate,
  peakLag,
  crossCorrelateComplex,
  peakLagComplex,
} from './correlation';
import { bipolarSequence } from './random';
import { type Complex, magnitude } from './complex';

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

const re = (x: number[]): Complex[] => x.map((v) => ({ re: v, im: 0 }));

describe('complex cross-correlation (matched filter)', () => {
  it('matches a hand-computed conjugated correlation', () => {
    // ref=[1, j], sig=[1, j]; c[ℓ]=Σ conj(ref[n])·sig[n+ℓ]
    // ℓ=-1: conj(j)·1 = −j ; ℓ=0: conj(1)·1 + conj(j)·j = 1 + 1 = 2 ; ℓ=1: conj(1)·j = j
    const ref: Complex[] = [
      { re: 1, im: 0 },
      { re: 0, im: 1 },
    ];
    const c = crossCorrelateComplex(ref, ref);
    expect(c.lags).toEqual([-1, 0, 1]);
    expect(c.values[0]).toEqual({ re: 0, im: -1 });
    expect(c.values[1]).toEqual({ re: 2, im: 0 }); // peak = Σ|ref|² (real, positive)
    expect(c.values[2]).toEqual({ re: 0, im: 1 });
    expect(peakLagComplex(c)).toBe(0);
  });

  it('reduces to the real cross-correlation for real inputs', () => {
    const ref = [1, 2, -1];
    const sig = [3, 4, 0, -2];
    const real = crossCorrelate(ref, sig);
    const cplx = crossCorrelateComplex(re(ref), re(sig));
    expect(cplx.lags).toEqual(real.lags);
    cplx.values.forEach((v, i) => {
      expect(v.re).toBeCloseTo(real.values[i], 12);
      expect(v.im).toBeCloseTo(0, 12);
    });
  });

  it('peaks (in magnitude) at the lag where a complex signal is delayed', () => {
    const ref: Complex[] = Array.from({ length: 8 }, (_, k) => ({
      re: Math.cos(0.7 * k),
      im: Math.sin(0.7 * k),
    }));
    const delay = 3;
    const sig: Complex[] = new Array(ref.length + delay).fill(0).map(() => ({ re: 0, im: 0 }));
    for (let i = 0; i < ref.length; i++) sig[i + delay] = ref[i];
    const c = crossCorrelateComplex(ref, sig);
    expect(peakLagComplex(c)).toBe(delay);
    // The peak magnitude equals the reference energy Σ|ref|².
    const energy = ref.reduce((s, v) => s + magnitude(v) ** 2, 0);
    const peakIdx = c.lags.indexOf(delay);
    expect(magnitude(c.values[peakIdx])).toBeCloseTo(energy, 10);
  });
});
