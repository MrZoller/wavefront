/**
 * Up/down-conversion (brief §5, Track B) — moving a complex baseband signal onto a real radio-
 * frequency carrier and back. The transmitter sends a *real* passband waveform; the receiver mixes
 * it back down to recover the I/Q baseband. `fs` is the sample rate, `fc` the carrier, both in the
 * same units (e.g. Hz and samples/s, or normalized cycles/sample with fs = 1).
 */

import type { Complex } from './complex';

/**
 * Upconvert complex baseband to a real passband waveform:
 *   `s(t) = I(t)·cos(2π fc t) − Q(t)·sin(2π fc t)`.
 * This is the physical signal a transmitter radiates — a single real voltage over time.
 */
export function upconvert(baseband: Complex[], fc: number, fs: number): number[] {
  return baseband.map((z, n) => {
    const w = (2 * Math.PI * fc * n) / fs;
    return z.re * Math.cos(w) - z.im * Math.sin(w);
  });
}

/**
 * Downconvert a real passband waveform back toward baseband by mixing with the carrier:
 *   `I' = 2·s(t)·cos(2π fc t)`,  `Q' = −2·s(t)·sin(2π fc t)`.
 * Each product contains the wanted baseband term plus an image at 2·fc that the receiver's low-pass
 * filter removes (`lowpass`). Returns the pre-filter mixer output.
 */
export function downconvert(passband: number[], fc: number, fs: number): Complex[] {
  return passband.map((s, n) => {
    const w = (2 * Math.PI * fc * n) / fs;
    return { re: 2 * s * Math.cos(w), im: -2 * s * Math.sin(w) };
  });
}

/**
 * A simple moving-average low-pass over `width` samples, applied to each I/Q component. Centered so
 * it adds no net delay; used after `downconvert` to strip the 2·fc image and leave baseband.
 */
export function lowpass(signal: Complex[], width: number): Complex[] {
  const w = Math.max(1, Math.round(width));
  const start = Math.floor((w - 1) / 2);
  const n = signal.length;
  return signal.map((_, i) => {
    // Average exactly `width` consecutive samples (away from the edges) so that, when `width` spans
    // a whole number of 2·fc image periods, the image cancels and only baseband survives.
    let re = 0;
    let im = 0;
    let count = 0;
    for (let j = i - start; j < i - start + w; j++) {
      if (j < 0 || j >= n) continue;
      re += signal[j].re;
      im += signal[j].im;
      count++;
    }
    return { re: re / count, im: im / count };
  });
}
