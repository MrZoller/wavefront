/**
 * Convolution & the impulse response (Fundamentals — Systems). The organizing idea under FIR
 * filtering, the matched filter, pulse shaping, and multipath — surfaced here as its own named
 * primitive.
 *
 * The one intuition: a linear, time-invariant system is completely described by **one** thing — its
 * impulse response `h`, i.e. what comes out when you feed in a single unit impulse ("ping it once").
 * Once you know `h`, the output for *any* input `x` is the sum of a shifted, scaled copy of `h` for
 * every input sample. That sum is convolution:
 *
 *   `y[k] = Σ_j x[j]·h[k − j]`   (equivalently `Σ_j h[j]·x[k − j]` — convolution commutes).
 *
 * An FIR filter's taps *are* an impulse response; the matched filter *is* convolution with a flipped
 * copy of the pulse; multipath *is* convolution with a few-tap echo response. Same operation — only
 * `h` differs. Terms with out-of-range indices are treated as 0 (a finite signal padded with zeros).
 */

/**
 * Full linear convolution of `x` with impulse response `h`:
 *   `y[k] = Σ_j x[j]·h[k − j]`,   length `x.length + h.length − 1`.
 *
 * This is the workhorse the FIR / pulse-shaping / matched-filter / multipath code all share (a filter
 * is just its taps convolved with the signal). Skipping zero input samples keeps zero-stuffed
 * (upsampled) streams cheap without changing the result.
 */
export function convolve(x: number[], h: number[]): number[] {
  const out = new Array<number>(x.length + h.length - 1).fill(0);
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    if (xi === 0) continue;
    for (let j = 0; j < h.length; j++) out[i + j] += xi * h[j];
  }
  return out;
}

/**
 * A single output sample `y[k] = Σ_j x[j]·h[k − j]` — the convolution sum evaluated at one slide
 * position `k`, without materializing the whole output. Equivalent to `convolve(x, h)[k]` for any
 * `k` in `[0, x.length + h.length − 1)`, and `0` outside that range. The sliding visualization scrubs
 * `k` and reads out exactly this value, so the "flip · shift · multiply · sum" mechanism is the
 * literal definition rather than a separate gloss.
 */
export function convolveAt(x: number[], h: number[], k: number): number {
  let sum = 0;
  const jStart = Math.max(0, k - (h.length - 1));
  const jEnd = Math.min(x.length - 1, k);
  for (let j = jStart; j <= jEnd; j++) sum += x[j] * h[k - j];
  return sum;
}
