/**
 * Cross-correlation — a sliding dot product (brief §4, Layer 0).
 *
 * For a software engineer: slide one signal past another and, at each shift, take their dot
 * product. Where the two line up, the dot product spikes. That peak tells you *how far* you had
 * to slide to align them — i.e. the time delay between them. This is the engine of TDOA.
 */

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
