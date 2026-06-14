/**
 * Window functions (brief §7, Track D primitive — needed here for clean spectra/spectrograms). A
 * window tapers a finite block of samples to reduce spectral leakage, trading mainlobe width
 * (resolution) against sidelobe level (leakage). Each returns `n` coefficients.
 */

export type WindowName = 'rectangular' | 'hann' | 'hamming' | 'blackman';

/** Generalized cosine windows. `rectangular` is the no-op (all ones). */
export function windowFn(name: WindowName, n: number): number[] {
  if (n <= 1) return new Array(Math.max(0, n)).fill(1);
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / (n - 1);
    switch (name) {
      case 'hann':
        out[i] = 0.5 - 0.5 * Math.cos(t);
        break;
      case 'hamming':
        out[i] = 0.54 - 0.46 * Math.cos(t);
        break;
      case 'blackman':
        out[i] = 0.42 - 0.5 * Math.cos(t) + 0.08 * Math.cos(2 * t);
        break;
      default:
        out[i] = 1;
    }
  }
  return out;
}
