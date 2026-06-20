/**
 * Cross-correlation — a sliding dot product (brief §4, Layer 0).
 *
 * For a software engineer: slide one signal past another and, at each shift, take their dot
 * product. Where the two line up, the dot product spikes. That peak tells you *how far* you had
 * to slide to align them — i.e. the time delay between them. This is the engine of TDOA.
 */

import { type Complex, magnitude } from './complex';

export interface Correlation {
  /** Integer lags, ascending, one per value. */
  lags: number[];
  /** Correlation value at each lag. */
  values: number[];
}

/**
 * Cross-correlation of `ref` against `sig`:
 *   `c[ℓ] = Σ_n ref[n] · sig[n + ℓ]`   (terms with out-of-range indices treated as 0).
 *
 * Sign convention: if `sig` is `ref` delayed by `D` samples (`sig[n] = ref[n − D]`), the peak
 * lands at lag `ℓ = D`, so the argmax lag reads out the delay directly.
 */
export function crossCorrelate(ref: number[], sig: number[]): Correlation {
  const n = ref.length;
  const m = sig.length;
  const lags: number[] = [];
  const values: number[] = [];
  for (let lag = -(n - 1); lag <= m - 1; lag++) {
    let sum = 0;
    // Valid n: 0 ≤ n < n  and  0 ≤ n+lag < m.
    const nStart = Math.max(0, -lag);
    const nEnd = Math.min(n, m - lag);
    for (let i = nStart; i < nEnd; i++) {
      sum += ref[i] * sig[i + lag];
    }
    lags.push(lag);
    values.push(sum);
  }
  return { lags, values };
}

/** Autocorrelation: a signal correlated with itself (peaks at lag 0). */
export function autoCorrelate(sig: number[]): Correlation {
  return crossCorrelate(sig, sig);
}

/** The lag at which the correlation is maximal — the detected delay. */
export function peakLag(c: Correlation): number {
  let best = 0;
  let bestVal = -Infinity;
  for (let i = 0; i < c.values.length; i++) {
    if (c.values[i] > bestVal) {
      bestVal = c.values[i];
      best = c.lags[i];
    }
  }
  return best;
}

/** Cross-correlation of two complex (I/Q) signals — same shape as {@link Correlation}, complex values. */
export interface ComplexCorrelation {
  /** Integer lags, ascending, one per value. */
  lags: number[];
  /** Complex correlation value at each lag. */
  values: Complex[];
}

/**
 * Complex cross-correlation / matched filter:
 *   `c[ℓ] = Σ_n conj(ref[n]) · sig[n + ℓ]`   (terms with out-of-range indices treated as 0).
 *
 * Conjugating the reference is what turns cross-correlation into the **matched filter** for complex
 * (I/Q) waveforms: at the aligning lag every term becomes `|ref[n]|²`, a real positive sum, so the
 * magnitude peaks there. It reduces exactly to {@link crossCorrelate} for real inputs (conjugation is
 * a no-op on reals), and keeps the same sign convention: if `sig[n] = ref[n − D]`, the peak magnitude
 * lands at `ℓ = D`. This is the engine behind radar pulse compression (matched-filtering an LFM echo).
 */
export function crossCorrelateComplex(ref: Complex[], sig: Complex[]): ComplexCorrelation {
  const n = ref.length;
  const m = sig.length;
  const lags: number[] = [];
  const values: Complex[] = [];
  for (let lag = -(n - 1); lag <= m - 1; lag++) {
    let re = 0;
    let im = 0;
    const nStart = Math.max(0, -lag);
    const nEnd = Math.min(n, m - lag);
    for (let i = nStart; i < nEnd; i++) {
      const r = ref[i];
      const s = sig[i + lag];
      // conj(r) · s = (r.re − j·r.im)(s.re + j·s.im)
      re += r.re * s.re + r.im * s.im;
      im += r.re * s.im - r.im * s.re;
    }
    lags.push(lag);
    values.push({ re, im });
  }
  return { lags, values };
}

/** The lag at which a complex correlation's **magnitude** is maximal — the detected delay. */
export function peakLagComplex(c: ComplexCorrelation): number {
  let best = 0;
  let bestVal = -Infinity;
  for (let i = 0; i < c.values.length; i++) {
    const v = magnitude(c.values[i]);
    if (v > bestVal) {
      bestVal = v;
      best = c.lags[i];
    }
  }
  return best;
}
