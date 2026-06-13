/**
 * Two-element phase-difference geometry (brief §4, Layer 0 → Layer 1).
 *
 * When a plane wave arrives at a pair of sensors separated by a baseline `d` from a bearing
 * `θ` (measured from broadside, i.e. the array normal), it reaches the far sensor after
 * travelling an extra distance — and that extra path turns into a measurable phase difference.
 * This is the seed of all angle-of-arrival direction finding.
 *
 * All lengths here are in the SAME units (e.g. metres, or multiples of the wavelength λ).
 */

/**
 * Extra path length the wave travels to the second sensor: `Δr = d · sin(θ)`.
 * (θ in radians, measured from broadside.)
 */
export function pathLengthDifference(d: number, thetaRad: number): number {
  return d * Math.sin(thetaRad);
}

/**
 * Phase difference between the two sensors:
 *   `Δφ = 2π · d · sin(θ) / λ`   (radians)
 * This is the core relation of the interferometer.
 */
export function phaseDifference(d: number, thetaRad: number, wavelength: number): number {
  return (2 * Math.PI * d * Math.sin(thetaRad)) / wavelength;
}

/**
 * Spatial sampling is unambiguous (a measured phase maps to a single bearing) only when the
 * baseline is at most half a wavelength: `d ≤ λ/2`. Beyond that, `Δφ` wraps past ±π and
 * multiple bearings produce the same phase — the classic grating/aliasing ambiguity.
 */
export function isUnambiguous(d: number, wavelength: number): boolean {
  return d <= wavelength / 2;
}

/** Wrap a phase to the principal interval (−π, π]. */
export function wrapPhase(phi: number): number {
  const twoPi = 2 * Math.PI;
  let p = (((phi + Math.PI) % twoPi) + twoPi) % twoPi; // → [0, 2π)
  if (p === 0) p = twoPi; // map exact 0 to 2π so result is (−π, π]
  return p - Math.PI;
}

/**
 * Invert the relation to recover bearing from a (wrapped) phase difference:
 *   `θ = asin( Δφ · λ / (2π · d) )`.
 * Returns the principal bearing in radians, or `NaN` if the phase implies |sin θ| > 1.
 */
export function bearingFromPhase(deltaPhi: number, d: number, wavelength: number): number {
  const sinTheta = (deltaPhi * wavelength) / (2 * Math.PI * d);
  if (sinTheta < -1 || sinTheta > 1) return NaN;
  return Math.asin(sinTheta);
}
