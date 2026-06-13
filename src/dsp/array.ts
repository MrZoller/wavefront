import type { Complex } from './complex';
import { expj, mul, conj, magnitudeSquared } from './complex';

/**
 * Uniform linear array (ULA) math (brief §4, Layer 1).
 *
 * A ULA is N identical sensors in a line, each a distance `d` apart. A plane wave from bearing
 * `θ` (from broadside) arrives at successive elements with a constant per-element phase step
 * `β = 2π·d·sin(θ)/λ` — exactly the two-element phase difference from Layer 0, repeated down the
 * line. Steering and beamforming are just choosing how to phase-combine those elements.
 */

/** Per-element electrical phase step for a wave from bearing `θ`: `β = 2π·d·sin(θ)/λ`. */
export function elementPhaseStep(d: number, thetaRad: number, wavelength: number): number {
  return (2 * Math.PI * d * Math.sin(thetaRad)) / wavelength;
}

/**
 * Steering vector of an N-element ULA pointed at bearing `θ`:
 *   `a(θ) = [1, e^{jβ}, e^{j2β}, …, e^{j(N−1)β}]`,  with `β = 2π·d·sin(θ)/λ`.
 * Each entry is the phase the wave presents at that element relative to the first.
 */
export function steeringVector(
  n: number,
  d: number,
  thetaRad: number,
  wavelength: number
): Complex[] {
  const beta = elementPhaseStep(d, thetaRad, wavelength);
  return Array.from({ length: n }, (_, k) => expj(k * beta));
}

/**
 * Delay-and-sum (conventional) beamformer output power for a snapshot `x` across the elements,
 * steered by weight vector `w`:  `P = |wᴴ x|²`.
 */
export function delayAndSumPower(x: Complex[], w: Complex[]): number {
  let re = 0;
  let im = 0;
  const n = Math.min(x.length, w.length);
  for (let k = 0; k < n; k++) {
    const term = mul(conj(w[k]), x[k]); // wᴴ x, element by element
    re += term.re;
    im += term.im;
  }
  return re * re + im * im;
}

/**
 * Normalized array response: steer an N-element ULA at `steerTheta` while a unit source sits at
 * `sourceTheta`. Returns power in [0, 1] (1 at perfect alignment). This is the visible beam
 * pattern — a mainlobe at the source plus sidelobes:
 *   `P(θ_s) = |a(θ_s)ᴴ a(θ_source)|² / N²`.
 */
export function arrayResponse(
  n: number,
  d: number,
  steerTheta: number,
  sourceTheta: number,
  wavelength: number
): number {
  const source = steeringVector(n, d, sourceTheta, wavelength);
  const steer = steeringVector(n, d, steerTheta, wavelength);
  return delayAndSumPower(source, steer) / (n * n);
}

export interface BeamPattern {
  /** Steering angles in radians, ascending across [−π/2, π/2]. */
  anglesRad: number[];
  /** Normalized linear power in [0, 1] at each angle. */
  power: number[];
}

/**
 * Sample the array response across bearings for a source at `sourceTheta` — the curve the
 * beamforming/array-pattern visual draws.
 */
export function beamPattern(
  n: number,
  d: number,
  sourceTheta: number,
  wavelength: number,
  numAngles = 361
): BeamPattern {
  const anglesRad: number[] = new Array(numAngles);
  const power: number[] = new Array(numAngles);
  for (let i = 0; i < numAngles; i++) {
    const theta = -Math.PI / 2 + (Math.PI * i) / (numAngles - 1);
    anglesRad[i] = theta;
    power[i] = arrayResponse(n, d, theta, sourceTheta, wavelength);
  }
  return { anglesRad, power };
}

/** Convert a linear power ratio to decibels, floored at `floorDb` (for display). */
export function toDb(power: number, floorDb = -40): number {
  if (power <= 0) return floorDb;
  return Math.max(floorDb, 10 * Math.log10(power));
}

/**
 * Bearings of any grating lobes actually visible in [−90°, 90°] when the array is steered to
 * `steerTheta`. A grating lobe is a second full-height mainlobe from spatial aliasing: it occurs
 * where `sin θ_g = sin θ_steer + m · λ/d` for a nonzero integer `m` and `|sin θ_g| ≤ 1`.
 *
 * Returns the (possibly empty) list of grating-lobe bearings in radians. Empty when `d ≤ λ/2`,
 * but also — crucially — for many steering angles just above λ/2 where no grating lobe has yet
 * swung into the visible field, so callers can report aliasing from what is genuinely shown.
 */
export function gratingLobeAngles(d: number, steerTheta: number, wavelength: number): number[] {
  const s0 = Math.sin(steerTheta);
  const mMax = Math.ceil((2 * d) / wavelength) + 1;
  const out: number[] = [];
  for (let m = -mMax; m <= mMax; m++) {
    if (m === 0) continue;
    const s = s0 + (m * wavelength) / d;
    if (s >= -1 && s <= 1) out.push(Math.asin(s));
  }
  return out.sort((a, b) => a - b);
}

// Re-exported for callers that build snapshots from steering vectors.
export { magnitudeSquared };
