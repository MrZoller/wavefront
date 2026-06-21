/**
 * FFT bins, zero-padding, and frequency resolution (Fundamentals, "Sampling & the Frequency
 * Domain"). Two different lengths govern a spectrum, and conflating them is the classic beginner
 * trap that this module exists to dispel:
 *
 *   - **N_real** — how many *true* signal samples you captured. It sets the **resolution**: the
 *     closest two tones a block of `N_real` samples can tell apart is ≈ `fs / N_real` (the DFT
 *     bin-width / Rayleigh limit). This is information you either captured or didn't.
 *   - **N_fft** — how many points you *transform*, after zero-padding the capture up to `N_fft`. It
 *     sets the **bin spacing**, `fs / N_fft`: how finely the (fixed-resolution) spectrum is sampled
 *     for drawing.
 *
 * Zero-padding raises `N_fft`, not `N_real`. It samples the *same* underlying continuous spectrum
 * (the DTFT of the capture) at more points — sinc interpolation — drawing a smoother, finer picture
 * of the same information. It cannot separate two tones the capture was too short to resolve; only a
 * longer capture (larger `N_real`) can. The colocated tests pin exactly this: more zero-padding =
 * more bins at spacing `fs / N_fft` that exactly interpolate the original ones, yet two tones closer
 * than `fs / N_real` stay one peak no matter how much you pad — they split only once `N_real` grows.
 *
 * Built on the from-scratch {@link fft}; nothing here re-implements the transform.
 */

import { type Complex } from './complex';
import { fft, fftFreqs } from './fft';

/** Smallest power of two ≥ `n` — the length the radix-2 {@link fft} needs after zero-padding. */
export function nextPow2(n: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(1, n)));
}

/**
 * A capture of `nReal` real samples of one or more equal-amplitude sinusoids, `Σ_f cos(2πfn/fs)` for
 * `n = 0 … nReal−1`. Real cosines are the textbook "two sine waves" the resolution lesson is about,
 * and their one-sided magnitude spectrum merges into a single lobe exactly when the tones sit closer
 * than `fs / nReal` — unlike summed analytic tones, whose per-tone phase ramps can interfere and
 * carve a false dip between sub-resolution tones.
 */
export function toneCapture(freqsHz: number[], nReal: number, fs: number): Complex[] {
  return Array.from({ length: nReal }, (_, n) => {
    let re = 0;
    for (const f of freqsHz) re += Math.cos((2 * Math.PI * f * n) / fs);
    return { re, im: 0 };
  });
}

/**
 * Zero-pad a capture up to `nFft` points — the extra samples are zeros, which contribute nothing to
 * the transform, so the spectrum is the *same* one sampled more finely. Refuses to "pad" to fewer
 * points than the capture (you can only add samples between, never throw real ones away).
 */
export function zeroPad(signal: Complex[], nFft: number): Complex[] {
  if (nFft < signal.length) {
    throw new Error(
      `cannot zero-pad ${signal.length} samples to ${nFft} points — N_fft must be ≥ the capture length`
    );
  }
  return Array.from({ length: nFft }, (_, i) =>
    i < signal.length ? { re: signal[i].re, im: signal[i].im } : { re: 0, im: 0 }
  );
}

/** Bin spacing `fs / nFft` (Hz): how finely the spectrum is *sampled* — set by the transform size. */
export function binSpacing(fs: number, nFft: number): number {
  return fs / nFft;
}

/**
 * Frequency resolution ≈ `fs / nReal` (Hz): the closest two tones a capture of `nReal` real samples
 * can separate — set by how much signal you captured, *not* by how much you zero-pad it.
 */
export function frequencyResolution(fs: number, nReal: number): number {
  return fs / nReal;
}

/**
 * One-sided magnitude spectrum (`0 … fs/2`) of a capture zero-padded to `nFft` points, with the
 * implicit rectangular window of a bare block (no taper — tapering is the separate Windowing &
 * Leakage lesson). Returned **un-normalized** so that two padding amounts share one reference: every
 * bin of a smaller transform reappears, untouched, among the bins of a larger one.
 * `nFft` must be a power of two ≥ `signal.length`.
 */
export function paddedMagnitudeSpectrum(signal: Complex[], nFft: number): number[] {
  const X = fft(zeroPad(signal, nFft));
  const half = nFft / 2;
  const out: number[] = new Array(half + 1);
  for (let k = 0; k <= half; k++) out[k] = Math.hypot(X[k].re, X[k].im);
  return out;
}

/** The Hz center frequency of each one-sided bin (`0 … fs/2`) of an `nFft`-point transform. */
export function oneSidedBinFreqs(nFft: number, fs: number): number[] {
  return fftFreqs(nFft, fs).slice(0, nFft / 2 + 1);
}

/**
 * Count the *resolved* spectral peaks — how many tones you can actually tell apart. The whole lesson
 * in one number: it tracks the capture length (resolution), not the zero-pad amount, so dragging the
 * bin count never changes it while a too-short capture's two tones stay merged, yet a longer capture
 * flips it to two.
 *
 * Two steps, so a shallow ripple between sub-resolution tones doesn't read as a split:
 *  1. find local maxima at least `floorFrac` of the global peak (the `> left, ≥ right` test counts a
 *     flat top once rather than missing it on an exact tie);
 *  2. treat two maxima as *distinct* only when the valley between them drops below `dipFrac` of the
 *     lower of the two — a genuine notch, not a dimple. Tones merge into one broad lobe with only a
 *     slight dimple right up to the resolution limit, so requiring a real valley is what keeps the
 *     count aligned with the `fs / N_real` rule.
 */
export function prominentPeakCount(mags: number[], floorFrac = 0.5, dipFrac = 0.6): number {
  if (mags.length === 0) return 0;
  const peak = Math.max(...mags);
  if (peak <= 0) return 0;
  const floor = floorFrac * peak;
  const maxima: number[] = [];
  for (let i = 1; i < mags.length - 1; i++) {
    if (mags[i] >= floor && mags[i] > mags[i - 1] && mags[i] >= mags[i + 1]) maxima.push(i);
  }
  if (maxima.length <= 1) return maxima.length;
  let count = 1;
  for (let j = 1; j < maxima.length; j++) {
    let valley = Infinity;
    for (let i = maxima[j - 1]; i <= maxima[j]; i++) valley = Math.min(valley, mags[i]);
    const lower = Math.min(mags[maxima[j - 1]], mags[maxima[j]]);
    if (valley < dipFrac * lower) count++;
  }
  return count;
}
