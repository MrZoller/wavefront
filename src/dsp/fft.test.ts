import { describe, it, expect } from 'vitest';
import { type Complex, magnitude } from './complex';
import { dft, fft, ifft, fftShift, fftShiftedBin } from './fft';

const randomSignal = (n: number, seed = 1): Complex[] => {
  let a = seed >>> 0;
  const rng = () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 2 ** 32 - 0.5;
  };
  return Array.from({ length: n }, () => ({ re: rng(), im: rng() }));
};

describe('FFT', () => {
  it('agrees with the direct DFT reference', () => {
    const x = randomSignal(64, 7);
    const a = fft(x);
    const b = dft(x);
    for (let k = 0; k < x.length; k++) {
      expect(a[k].re).toBeCloseTo(b[k].re, 9);
      expect(a[k].im).toBeCloseTo(b[k].im, 9);
    }
  });

  it('puts a pure tone in exactly one bin', () => {
    // x[n] = e^{j2π·5·n/N} → all energy in bin 5.
    const N = 32;
    const k0 = 5;
    const x: Complex[] = Array.from({ length: N }, (_, n) => ({
      re: Math.cos((2 * Math.PI * k0 * n) / N),
      im: Math.sin((2 * Math.PI * k0 * n) / N),
    }));
    const X = fft(x);
    expect(magnitude(X[k0])).toBeCloseTo(N, 6);
    for (let k = 0; k < N; k++) if (k !== k0) expect(magnitude(X[k])).toBeLessThan(1e-6);
  });

  it('inverts back to the original signal', () => {
    const x = randomSignal(128, 3);
    const r = ifft(fft(x));
    for (let n = 0; n < x.length; n++) {
      expect(r[n].re).toBeCloseTo(x[n].re, 9);
      expect(r[n].im).toBeCloseTo(x[n].im, 9);
    }
  });

  it('satisfies Parseval (energy is conserved up to 1/N)', () => {
    const x = randomSignal(64, 11);
    const X = fft(x);
    const timeE = x.reduce((s, c) => s + c.re * c.re + c.im * c.im, 0);
    const freqE = X.reduce((s, c) => s + c.re * c.re + c.im * c.im, 0) / x.length;
    expect(freqE).toBeCloseTo(timeE, 6);
  });

  it('rejects non-power-of-two lengths', () => {
    expect(() => fft(randomSignal(20))).toThrow(/power of two/);
  });

  it('fftShift centers the zero-frequency bin', () => {
    expect(fftShift([0, 1, 2, 3])).toEqual([2, 3, 0, 1]);
  });

  it('fftShiftedBin maps a normalized frequency to its centered bin', () => {
    const n = 16;
    expect(fftShiftedBin(0, n)).toBe(n / 2); // DC sits in the middle after fftShift
    expect(fftShiftedBin(1 / n, n)).toBe(n / 2 + 1); // +1 bin up
    expect(fftShiftedBin(-1 / n, n)).toBe(n / 2 - 1); // −1 bin down
    // Reading the centered spectrum back agrees with where fftShift actually moves a pure tone.
    for (const k of [0, 1, 5, 9, 15]) {
      const tone: Complex[] = Array.from({ length: n }, (_, i) => ({
        re: Math.cos((2 * Math.PI * k * i) / n),
        im: Math.sin((2 * Math.PI * k * i) / n),
      }));
      const shifted = fftShift(fft(tone)).map(magnitude);
      expect(shifted.indexOf(Math.max(...shifted))).toBe(fftShiftedBin(k / n, n));
    }
  });
});
