/**
 * Spectrum & spectrogram helpers (brief §6/§7) — turning a complex baseband signal into the
 * magnitude spectrum and the time–frequency waterfall that Track C's views render. Built on the
 * from-scratch `fft` and `windowFn`.
 */

import type { Complex } from './complex';
import { fft, fftShift } from './fft';
import { windowFn, type WindowName } from './window';

const nextPow2 = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(1, n)));

/**
 * Centered magnitude spectrum in dB (zero frequency in the middle, −fs/2 … +fs/2). The signal is
 * windowed, zero-padded to a power of two, transformed, and normalized so the peak is 0 dB.
 * `floorDb` clamps the noise floor so the plot has a sensible range.
 */
export function magnitudeSpectrumDb(
  signal: Complex[],
  window: WindowName = 'hann',
  floorDb = -80
): number[] {
  const n = nextPow2(signal.length);
  const w = windowFn(window, signal.length);
  const padded: Complex[] = Array.from({ length: n }, (_, i) =>
    i < signal.length ? { re: signal[i].re * w[i], im: signal[i].im * w[i] } : { re: 0, im: 0 }
  );
  const X = fftShift(fft(padded));
  const mag = X.map((c) => Math.hypot(c.re, c.im));
  const peak = Math.max(1e-12, ...mag);
  return mag.map((m) => Math.max(floorDb, 20 * Math.log10(m / peak)));
}

/**
 * Short-time Fourier transform → a `frames × fftSize` grid of dB magnitudes (each row a centered
 * spectrum), normalized to a global 0 dB peak. `hop` is the step between frames.
 */
export function spectrogram(
  signal: Complex[],
  fftSize = 128,
  hop = 32,
  window: WindowName = 'hann',
  floorDb = -80
): number[][] {
  const w = windowFn(window, fftSize);
  const frames: number[][] = [];
  let peak = 1e-12;
  for (let start = 0; start + fftSize <= signal.length; start += hop) {
    const block: Complex[] = Array.from({ length: fftSize }, (_, i) => ({
      re: signal[start + i].re * w[i],
      im: signal[start + i].im * w[i],
    }));
    const mag = fftShift(fft(block)).map((c) => Math.hypot(c.re, c.im));
    for (const m of mag) if (m > peak) peak = m;
    frames.push(mag);
  }
  return frames.map((row) => row.map((m) => Math.max(floorDb, 20 * Math.log10(m / peak))));
}
