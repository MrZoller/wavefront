/**
 * Radar synthesis — the round-trip echo model and the range-Doppler assembly.
 *
 * The whole point of this module is that radar's core signal processing is primitives the learner has
 * already built, **aimed outward**:
 *   - an **echo** is the transmitted LFM chirp delayed by the round-trip time-of-flight (range) and
 *     phase-advanced across pulses by the target's motion (Doppler);
 *   - **pulse compression** is the **matched filter** (`crossCorrelateComplex` against the chirp)
 *     collapsing that long echo into a sharp peak at the target's range — the correlation peak the
 *     cross-correlation module already teaches;
 *   - **Doppler processing** is the **FFT** taken across pulses (slow-time);
 *   - stacking the two gives the **range-Doppler map**.
 *
 * Everything here is synthetic and illustrative: normalized units only — range in fast-time samples
 * ("range bins"), Doppler in cycles per pulse. No real waveforms, PRFs, frequencies, or system
 * parameters. Built from-scratch and tested (`radar.test.ts`), reusing the `chirp`, matched-filter
 * `crossCorrelateComplex`, `fft`, and Gaussian-noise primitives wholesale.
 */

import { type Complex, magnitude } from './complex';
import { crossCorrelateComplex } from './correlation';
import { fft, fftShift } from './fft';
import { gaussianNoise } from './random';

/** One synthetic point target in the scene. */
export interface RadarTarget {
  /** Round-trip delay in fast-time samples — the target's range bin (≥ 0). */
  rangeBin: number;
  /** Doppler shift in cycles per pulse (slow-time frequency) from the target's radial velocity. */
  doppler: number;
  /** Echo amplitude (linear); defaults to 1. */
  amplitude?: number;
}

/**
 * Synthesize the received echo for one coherent pulse train: `nPulses` rows of `windowLen` fast-time
 * samples. Each target contributes the transmitted chirp `tx` delayed by its `rangeBin` and advanced
 * in phase by `2π·doppler·p` across pulse index `p` (slow-time); complex AWGN with total per-sample
 * standard deviation `noiseSigma` is added. Deterministic for a given `seed`.
 *
 *   rx[p][n] = Σ_targets  aₖ · tx[n − rangeBinₖ] · e^{j·2π·dopplerₖ·p}  +  noise
 */
export function echoPulses(
  tx: Complex[],
  targets: RadarTarget[],
  nPulses: number,
  windowLen: number,
  noiseSigma = 0,
  seed = 1
): Complex[][] {
  const M = tx.length;
  // Two real Gaussian streams (I, Q), each σ = noiseSigma/√2 so the complex sample's σ is noiseSigma.
  const total = nPulses * windowLen;
  const nI = noiseSigma > 0 ? gaussianNoise(total, noiseSigma / Math.SQRT2, seed) : null;
  const nQ =
    noiseSigma > 0
      ? gaussianNoise(total, noiseSigma / Math.SQRT2, (seed ^ 0x9e3779b9) >>> 0)
      : null;

  const out: Complex[][] = [];
  for (let p = 0; p < nPulses; p++) {
    const row: Complex[] = Array.from({ length: windowLen }, () => ({ re: 0, im: 0 }));
    for (const t of targets) {
      const a = t.amplitude ?? 1;
      const theta = 2 * Math.PI * t.doppler * p;
      const dr = Math.cos(theta);
      const di = Math.sin(theta);
      for (let n = 0; n < M; n++) {
        const idx = n + t.rangeBin;
        if (idx < 0 || idx >= windowLen) continue;
        // a · tx[n] · e^{jθ}
        const xr = tx[n].re;
        const xi = tx[n].im;
        row[idx].re += a * (xr * dr - xi * di);
        row[idx].im += a * (xr * di + xi * dr);
      }
    }
    if (nI && nQ) {
      for (let n = 0; n < windowLen; n++) {
        const k = p * windowLen + n;
        row[n].re += nI[k];
        row[n].im += nQ[k];
      }
    }
    out.push(row);
  }
  return out;
}

/** Complex matched-filter range profile of one pulse over bins `0 … rangeBins−1`. */
function rangeProfileComplex(rxPulse: Complex[], tx: Complex[], rangeBins: number): Complex[] {
  const c = crossCorrelateComplex(tx, rxPulse); // values at lags −(M−1) … L−1
  const zero = tx.length - 1; // index of lag 0 in c.values
  return Array.from({ length: rangeBins }, (_, r) => c.values[zero + r] ?? { re: 0, im: 0 });
}

/**
 * Pulse-compress one received pulse: matched-filter it against the transmitted chirp and return the
 * magnitude range profile over bins `0 … rangeBins−1`. The compressed peak lands at the target's
 * range bin — the long, low-power echo collapsed to one sharp spike.
 */
export function pulseCompress(rxPulse: Complex[], tx: Complex[], rangeBins: number): number[] {
  return rangeProfileComplex(rxPulse, tx, rangeBins).map(magnitude);
}

/**
 * Assemble the range-Doppler map: pulse-compress every pulse (fast-time → range), then FFT the
 * compressed value across pulses at each range bin (slow-time → Doppler), `fftShift`ed so zero
 * Doppler — a stationary target — sits in the middle. Returns a `rangeBins × nPulses` grid of linear
 * magnitudes (`map[range][dopplerBin]`); the peak sits at the target's (range, Doppler).
 *
 * `nPulses` (the length of `rx`) must be a power of two — the FFT requirement.
 */
export function rangeDopplerMap(rx: Complex[][], tx: Complex[], rangeBins: number): number[][] {
  const profiles = rx.map((pulse) => rangeProfileComplex(pulse, tx, rangeBins)); // nPulses × rangeBins
  const map: number[][] = [];
  for (let r = 0; r < rangeBins; r++) {
    const slowTime: Complex[] = profiles.map((prof) => prof[r]); // length nPulses
    map.push(fftShift(fft(slowTime)).map(magnitude)); // Doppler spectrum for this range bin
  }
  return map;
}

/**
 * The `fftShift`ed bin index a normalized Doppler `f` (cycles/pulse) lands in for an `n`-pulse FFT.
 * Zero Doppler maps to the centre bin `⌈n/2⌉`; the inverse of the `fftShift` reordering.
 */
export function dopplerBin(f: number, n: number): number {
  const k = ((Math.round(f * n) % n) + n) % n; // raw FFT bin
  const h = Math.ceil(n / 2);
  return k >= h ? k - h : k + (n - h);
}

/** Time-bandwidth product of an LFM chirp: duration (samples) × swept bandwidth (cycles/sample). */
export function timeBandwidthProduct(chirpLen: number, bandwidth: number): number {
  return chirpLen * bandwidth;
}

/**
 * Pulse-compression ratio of a compressed magnitude profile: the input chirp length divided by the
 * −3 dB main-lobe width of the compressed peak (sub-sample interpolated). For an LFM chirp this ≈ the
 * time-bandwidth product — the textbook statement that compression buys range resolution ∝ T·B (a
 * long, gentle pulse on transmit; a sharp one after the matched filter).
 */
export function compressionRatio(profileMag: number[], chirpLen: number): number {
  const n = profileMag.length;
  if (n === 0) return 0;
  let peak = 0;
  let peakVal = -Infinity;
  for (let i = 0; i < n; i++) {
    if (profileMag[i] > peakVal) {
      peakVal = profileMag[i];
      peak = i;
    }
  }
  const half = peakVal / Math.SQRT2; // −3 dB in amplitude
  // Walk outward to the half-power crossing, linearly interpolating between the straddling samples.
  const cross = (dir: number): number => {
    let i = peak;
    for (;;) {
      const next = i + dir;
      if (next < 0 || next >= n) return i; // ran off the array — use the last in-bounds sample
      if (profileMag[next] < half) {
        const a = profileMag[i];
        const b = profileMag[next];
        const frac = a === b ? 0 : (a - half) / (a - b);
        return i + dir * frac;
      }
      i = next;
    }
  };
  const width = cross(1) - cross(-1);
  return width > 0 ? chirpLen / width : chirpLen;
}
