import { EARTH_RADIUS_KM } from './constants';

/**
 * The radio horizon — how far a line-of-sight link reaches before the Earth's curve gets in the way
 * (brief §8). Above HF this is what sets your range, and it's almost all about antenna height.
 *
 * Geometry: an antenna of height `h` can "see" to where its sight line goes tangent to the sphere.
 * With Earth radius `R`, that tangent distance is `d = √(2·R·h + h²) ≈ √(2·R·h)` for `h ≪ R`. Two
 * stations each see to their own tangent point, so the link closes when their horizon circles meet:
 * `d ≈ d(h₁) + d(h₂)`. In convenient units this is the classic `d(km) ≈ 3.57·(√h₁ + √h₂)` with
 * heights in metres — the 3.57 is just `√(2R)` once the units are folded in.
 *
 * This is the *geometric* horizon. Atmospheric refraction bends rays slightly downward, which the
 * textbook captures with an effective `4/3·R` Earth, nudging the constant up to ≈4.12; we use the
 * plain geometric value here and mention the refractive one in the docs.
 */

/**
 * Line-of-sight distance from a single antenna to its horizon, in km, for a height in metres:
 * `d = √(2·R·h)` (the small-height approximation, with R the mean Earth radius).
 *
 * @param heightMeters antenna height above the surface, in metres (≥ 0)
 * @returns horizon distance in km
 */
export function horizonKm(heightMeters: number): number {
  if (heightMeters < 0) throw new Error('horizonKm: height must be non-negative');
  // 2·R in metres, times h in metres, square-rooted to metres, then back to km.
  return Math.sqrt(2 * EARTH_RADIUS_KM * 1000 * heightMeters) / 1000;
}

/**
 * Radio-horizon distance between a transmit and receive antenna, in km: the sum of each antenna's
 * horizon distance, `d ≈ √(2R·h₁) + √(2R·h₂)` ≈ `3.57·(√h₁ + √h₂)` with heights in metres.
 *
 * @param txHeightMeters transmit-antenna height in metres
 * @param rxHeightMeters receive-antenna height in metres
 * @returns the maximum line-of-sight distance in km
 */
export function radioHorizonKm(txHeightMeters: number, rxHeightMeters: number): number {
  return horizonKm(txHeightMeters) + horizonKm(rxHeightMeters);
}

/**
 * The classic coefficient in `d(km) ≈ k·√h(m)` — `√(2R)` in mixed km/m units, ≈ 3.57 for the
 * geometric horizon. Exposed so the UI can show the formula it's evaluating.
 */
export const HORIZON_COEFF_KM_PER_SQRT_M = Math.sqrt(2 * EARTH_RADIUS_KM * 1000) / 1000;
