/**
 * GPS acquisition synthesis — pulling a spreading-code signal out from under the noise floor, and
 * reading range off the correlation peak's position.
 *
 * The whole point is that GPS acquisition is primitives the learner has already built, recombined:
 *   - each satellite transmits a known pseudo-random (**PRN**) **spreading code** (the Spread Spectrum
 *     module's `pnCode`);
 *   - the received samples are that code **delayed by a code phase** (the signal's travel time, which
 *     reads out as a **pseudorange**) and **Doppler-shifted** by the relative motion, buried in noise
 *     at **negative SNR** — visually indistinguishable from noise;
 *   - **correlating against the known code** applies the spread-spectrum **processing gain** in reverse
 *     (the despreader, used to acquire) and lifts a sharp peak out of the noise — and *where* that peak
 *     sits on the code-phase axis is the pseudorange;
 *   - you don't know the code phase **or** the Doppler, so **acquisition** searches both at once: a
 *     **code-phase × Doppler** correlation surface. That surface is the sibling of the radar
 *     range-Doppler map — per-period correlation in place of per-pulse pulse compression, an FFT across
 *     code periods in place of across pulses.
 *
 * Everything is synthetic and illustrative: a synthetic PRN code, normalized units only — code phase
 * in chips, Doppler in cycles per code period. No real PRN assignments, frequencies, or ephemeris.
 * This models the **open civilian** (C/A-style) spreading-code acquisition only. Built from-scratch and
 * tested (`gps.test.ts`), reusing the `pnCode`, `fft`/`fftShift`, and Gaussian-noise primitives.
 */

import { type Complex, magnitude } from './complex';
import { fft, fftShift } from './fft';
import { gaussianNoise } from './random';

export interface PrnSignalParams {
  /** True code phase in chips (the code's cyclic delay, 0 … L−1) — what reads out as the pseudorange. */
  codePhase: number;
  /** Doppler in cycles per sample (chip). Small: the phase it advances from one code period to the
   *  next is the slow-time frequency the acquisition search resolves on the Doppler axis. */
  doppler: number;
  /** Signal-to-noise ratio in dB. Drive it negative so the signal genuinely sits below the noise. */
  snrDb: number;
  /** Coherent integration length in whole code periods (≥ 1). Longer integration → more gain. */
  periods: number;
  /** Seed for the deterministic noise (so example signals and screenshots reproduce). */
  seed?: number;
}

/**
 * Synthesize the received samples for `periods` whole repetitions of the length-L PRN `code`: the code
 * cyclically delayed by `codePhase` chips, multiplied by the Doppler carrier `e^{j2π·doppler·n}`, and
 * buried in complex AWGN. The clean signal has unit power per sample, so the per-sample noise σ is
 * `10^(−snrDb/20)` — a **negative** `snrDb` puts the signal under the noise floor. Deterministic for a
 * given `seed`.
 *
 *   rx[n] = code[(k − codePhase) mod L] · e^{j2π·doppler·n} + noise,   k = n mod L
 */
export function prnReceived(code: number[], p: PrnSignalParams): Complex[] {
  const L = code.length;
  const periods = Math.max(1, Math.floor(p.periods));
  const N = L * periods;
  const sigma = Math.pow(10, -p.snrDb / 20); // signal power = 1 ⇒ σ sets the SNR
  // Two real Gaussian streams (I, Q), each σ/√2 so the complex sample's total σ is `sigma`.
  const seed = p.seed ?? 1;
  const nI = sigma > 0 ? gaussianNoise(N, sigma / Math.SQRT2, seed) : null;
  const nQ = sigma > 0 ? gaussianNoise(N, sigma / Math.SQRT2, (seed ^ 0x9e3779b9) >>> 0) : null;

  const cp = ((Math.round(p.codePhase) % L) + L) % L;
  const out: Complex[] = new Array(N);
  for (let n = 0; n < N; n++) {
    const k = n % L;
    const chip = code[(((k - cp) % L) + L) % L];
    const theta = 2 * Math.PI * p.doppler * n;
    let re = chip * Math.cos(theta);
    let im = chip * Math.sin(theta);
    if (nI && nQ) {
      re += nI[n];
      im += nQ[n];
    }
    out[n] = { re, im };
  }
  return out;
}

/**
 * Circular cross-correlation of one length-L code period `seg` against the local `code`, evaluated at
 * every code-phase shift `c`:
 *
 *   corr[c] = Σ_k  seg[k] · code[(k − c) mod L]      (the code is real ±1, so it is its own conjugate)
 *
 * The magnitude peaks at the shift where the local code lines up with the buried one — the despread
 * peak. Circular (not linear) because the spreading code repeats, so the delay wraps within a period.
 */
function periodCorrelation(seg: Complex[], code: number[]): Complex[] {
  const L = code.length;
  const out: Complex[] = new Array(L);
  for (let c = 0; c < L; c++) {
    let re = 0;
    let im = 0;
    for (let k = 0; k < L; k++) {
      const chip = code[(((k - c) % L) + L) % L];
      re += seg[k].re * chip;
      im += seg[k].im * chip;
    }
    out[c] = { re, im };
  }
  return out;
}

/**
 * The 1-D code-phase correlation after removing a Doppler estimate `doppler`: wipe the carrier off the
 * received samples, circular-correlate each code period against the local code, and **coherently sum**
 * across periods. Returns a length-L magnitude profile whose peak sits at the true code phase — the
 * despread peak the processing gain lifts out of the noise as SNR or integration grows. This is the
 * despreader the Spread Spectrum module showed, run to acquire (step 2 → 3 of the intuition arc).
 */
export function codePhaseProfile(
  received: Complex[],
  code: number[],
  doppler: number,
  periods: number
): number[] {
  const L = code.length;
  const acc: Complex[] = Array.from({ length: L }, () => ({ re: 0, im: 0 }));
  for (let p = 0; p < periods; p++) {
    const seg: Complex[] = new Array(L);
    for (let k = 0; k < L; k++) {
      const n = p * L + k;
      const theta = -2 * Math.PI * doppler * n; // Doppler wipe-off
      const s = received[n];
      const cw = Math.cos(theta);
      const sw = Math.sin(theta);
      seg[k] = { re: s.re * cw - s.im * sw, im: s.re * sw + s.im * cw };
    }
    const corr = periodCorrelation(seg, code);
    for (let c = 0; c < L; c++) {
      acc[c].re += corr[c].re;
      acc[c].im += corr[c].im;
    }
  }
  return acc.map(magnitude);
}

/**
 * Assemble the **acquisition surface**: circular-correlate every code period against the local code
 * (the code-phase axis), then take an FFT of that complex correlation across periods at each code-phase
 * shift (the Doppler axis), `fftShift`ed so zero Doppler — a stationary signal — sits on the centre row.
 * Returns a `L × periods` grid of magnitudes (`surface[codePhase][dopplerBin]`); the bright peak sits at
 * the signal's (code phase, Doppler), and its position on the code-phase axis is the pseudorange.
 *
 * `periods` (the number of code periods in `received`) must be a power of two — the FFT requirement.
 * This is structurally the radar `rangeDopplerMap`: a 2-D correlation search → peak → measurement.
 */
export function acquisitionSurface(
  received: Complex[],
  code: number[],
  periods: number
): number[][] {
  const L = code.length;
  // Per-period code-phase correlation profiles: periods × L (complex).
  const profiles: Complex[][] = [];
  for (let p = 0; p < periods; p++) {
    profiles.push(periodCorrelation(received.slice(p * L, (p + 1) * L), code));
  }
  const surface: number[][] = [];
  for (let c = 0; c < L; c++) {
    const slowTime: Complex[] = profiles.map((prof) => prof[c]); // length = periods
    surface.push(fftShift(fft(slowTime)).map(magnitude)); // Doppler spectrum for this code phase
  }
  return surface;
}

/** A detected acquisition peak: the (code phase, Doppler bin) of the surface's maximum. */
export interface AcquisitionPeak {
  codePhase: number;
  dopplerBin: number;
  value: number;
}

/** The 2-D argmax of an acquisition surface — the detected (code phase, Doppler bin). */
export function acquisitionPeak(surface: number[][]): AcquisitionPeak {
  let codePhase = 0;
  let dopplerBin = 0;
  let value = -Infinity;
  for (let c = 0; c < surface.length; c++) {
    for (let d = 0; d < surface[c].length; d++) {
      if (surface[c][d] > value) {
        value = surface[c][d];
        codePhase = c;
        dopplerBin = d;
      }
    }
  }
  return { codePhase, dopplerBin, value };
}
