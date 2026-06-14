/**
 * FIR filters (brief §7, Track D Layer 1) — filtering as a sliding dot product. A filter is just an
 * array of tap weights convolved with the signal; its impulse response and frequency response are
 * the same object in two domains.
 */

/** Normalized sinc, sin(πx)/(πx), with sinc(0) = 1. */
const sinc = (x: number): number => (x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));

/** Generalized-cosine window coefficient (Hann) — kept local so the FIR design is self-contained. */
const hann = (i: number, n: number): number => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));

/**
 * Windowed-sinc low-pass FIR design: an ideal brick-wall (`sinc`) truncated to `numTaps` and tapered
 * by a Hann window to tame ringing. `cutoff` is the −6 dB point in cycles/sample (0…0.5). Taps are
 * normalized to unit DC gain, so the passband sits at 0 dB.
 */
export function firLowpass(cutoff: number, numTaps: number, scale = 1): number[] {
  const mid = (numTaps - 1) / 2;
  const taps = new Array<number>(numTaps);
  for (let i = 0; i < numTaps; i++) {
    const x = i - mid;
    taps[i] = 2 * cutoff * sinc(2 * cutoff * x) * hann(i, numTaps);
  }
  const sum = taps.reduce((s, t) => s + t, 0);
  return taps.map((t) => (t / sum) * scale);
}

/**
 * Magnitude frequency response of an FIR filter in dB over normalized frequency [−0.5, 0.5):
 * `H(f) = Σ h[n]·e^{−j2πf·n}`. Unit-DC-gain taps give a 0 dB passband.
 */
export function firResponseDb(taps: number[], nFreqs = 256, floorDb = -90): number[] {
  const out = new Array<number>(nFreqs);
  for (let i = 0; i < nFreqs; i++) {
    const f = -0.5 + i / nFreqs;
    let re = 0;
    let im = 0;
    for (let n = 0; n < taps.length; n++) {
      const ph = -2 * Math.PI * f * n;
      re += taps[n] * Math.cos(ph);
      im += taps[n] * Math.sin(ph);
    }
    out[i] = Math.max(floorDb, 20 * Math.log10(Math.max(1e-12, Math.hypot(re, im))));
  }
  return out;
}
