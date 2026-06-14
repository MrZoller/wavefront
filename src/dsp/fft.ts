/**
 * The DFT/FFT (brief §7, Track D primitive — built here because Track C's spectrum and spectrogram
 * views need it). The transform is a *change of basis*: it projects a signal onto a bank of complex
 * sinusoids, so each output bin is the correlation of the signal with one frequency.
 *
 *   `X[k] = Σ_{n} x[n]·e^{−j2πkn/N}`
 *
 * `dft` is the literal O(N²) definition (the reference the tests check against); `fft` is the
 * O(N log N) radix-2 version for power-of-two lengths.
 */

import { type Complex, add, sub, mul, expj } from './complex';

/** Direct DFT — the literal definition, O(N²). The from-scratch reference for `fft`. */
export function dft(x: Complex[]): Complex[] {
  const N = x.length;
  const out: Complex[] = new Array(N);
  for (let k = 0; k < N; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const w = (-2 * Math.PI * k * n) / N;
      const c = Math.cos(w);
      const s = Math.sin(w);
      re += x[n].re * c - x[n].im * s;
      im += x[n].re * s + x[n].im * c;
    }
    out[k] = { re, im };
  }
  return out;
}

const isPow2 = (n: number) => n > 0 && (n & (n - 1)) === 0;

/** Radix-2 Cooley–Tukey FFT (iterative, in-place on a copy). Requires a power-of-two length. */
export function fft(x: Complex[]): Complex[] {
  const N = x.length;
  if (!isPow2(N)) throw new Error(`fft length must be a power of two, got ${N}`);
  const a = x.map((c) => ({ re: c.re, im: c.im }));

  // Bit-reversal permutation.
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
  }

  // Butterflies, stage by stage.
  for (let len = 2; len <= N; len <<= 1) {
    const half = len >> 1;
    const step = (-2 * Math.PI) / len;
    for (let i = 0; i < N; i += len) {
      for (let k = 0; k < half; k++) {
        const tw = expj(step * k);
        const t = mul(tw, a[i + k + half]);
        a[i + k + half] = sub(a[i + k], t);
        a[i + k] = add(a[i + k], t);
      }
    }
  }
  return a;
}

/** Inverse FFT: `x[n] = (1/N)·Σ X[k]·e^{+j2πkn/N}` (conjugate trick around the forward FFT). */
export function ifft(X: Complex[]): Complex[] {
  const N = X.length;
  const conj = X.map((c) => ({ re: c.re, im: -c.im }));
  const y = fft(conj);
  return y.map((c) => ({ re: c.re / N, im: -c.im / N }));
}

/** Bin center frequencies (Hz) for an N-point transform at sample rate `fs`, ordered 0…N−1. */
export function fftFreqs(n: number, fs: number): number[] {
  return Array.from({ length: n }, (_, k) => (k * fs) / n);
}

/** Reorder a spectrum so the zero frequency sits in the middle (−fs/2 … +fs/2). */
export function fftShift<T>(x: T[]): T[] {
  const h = Math.ceil(x.length / 2);
  return [...x.slice(h), ...x.slice(0, h)];
}
