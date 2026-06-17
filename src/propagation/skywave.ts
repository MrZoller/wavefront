/**
 * HF skywave & the ionosphere — kept strictly conceptual (brief §8). None of this is a real
 * ionosphere model; the numbers are illustrative textbook values chosen to make the *ideas* tangible:
 *
 *  - A skywave hop climbs from the ground to a reflecting layer at some **virtual height** and comes
 *    back down — one bounce can span thousands of km.
 *  - Whether the layer reflects the wave or lets it punch through to space is the **MUF** (maximum
 *    usable frequency) idea: below the MUF it reflects, above it the wave escapes.
 *  - Day vs. night changes how strongly the layer is ionised, so it changes the MUF — which is why
 *    the same band behaves differently after dark.
 */

/** Illustrative virtual height of the reflecting layer, in km (F-region order of magnitude). */
export const VIRTUAL_HEIGHT_KM = 300;

/** Illustrative vertical critical frequency by day, in MHz (a stand-in for foF2 — not a real value). */
export const CRITICAL_FREQ_DAY_MHZ = 8;
/** Illustrative vertical critical frequency at night, in MHz — lower, as the layer recombines. */
export const CRITICAL_FREQ_NIGHT_MHZ = 3;

/**
 * Angle of incidence at the reflecting layer (from the vertical), in degrees, for a single hop.
 *
 * Flat-earth geometry: the ray reaches the layer at height `h'` over half the ground range, so
 * `tan(φ) = (D/2) / h'`. Longer hops strike the layer more obliquely (larger φ).
 *
 * @param groundRangeKm total ground distance of the hop, in km
 * @param virtualHeightKm reflecting-layer virtual height, in km
 * @returns incidence angle in degrees, 0…90
 */
export function incidenceAngleDeg(
  groundRangeKm: number,
  virtualHeightKm: number = VIRTUAL_HEIGHT_KM
): number {
  return (Math.atan2(groundRangeKm / 2, virtualHeightKm) * 180) / Math.PI;
}

/**
 * Maximum usable frequency from the **secant law**: `MUF = f_critical · sec(φ)`, where `φ` is the
 * angle of incidence at the layer. Striking the layer obliquely (large φ) lets it reflect higher
 * frequencies than it would straight up, so longer hops support a higher MUF.
 *
 * @param criticalMHz vertical critical frequency, in MHz
 * @param incidenceDeg angle of incidence at the layer, in degrees (0…<90)
 * @returns the MUF in MHz
 */
export function mufMHz(criticalMHz: number, incidenceDeg: number): number {
  const phi = (incidenceDeg * Math.PI) / 180;
  return criticalMHz / Math.cos(phi);
}

/**
 * Whether an HF signal reflects off the layer (skywave) or punches through to space: it reflects
 * while at or below the MUF.
 *
 * @param frequencyMHz operating frequency, in MHz
 * @param mufValueMHz the path's MUF, in MHz
 */
export function reflectsSkywave(frequencyMHz: number, mufValueMHz: number): boolean {
  return frequencyMHz <= mufValueMHz;
}

// ── Cross-link: propagation-aware geolocation ────────────────────────────────
//
// The direction-finding scenes assume a straight line-of-bearing to the emitter (true at VHF and
// up). On HF via skywave, the wave arrives after an ionospheric bounce, and tilts/irregularities in
// the layer deflect its apparent bearing — so a fix built on the straight-line assumption walks off
// the true emitter. The helpers below model that deflection at a fixed, illustrative textbook scale
// (a few degrees); they are NOT a bearing-error prediction.

/** Illustrative skywave bearing error, in degrees — a fixed textbook-scale lateral deflection. */
export const SKYWAVE_BEARING_BIAS_DEG = 7;

/**
 * The apparent line of bearing a skywave signal seems to arrive on: the true bearing rotated by an
 * illustrative skywave deflection. Uniform across sites so the naive cross-fix visibly drifts rather
 * than merely blurring.
 *
 * @param trueBearingRad true bearing to the emitter, in radians (math convention)
 * @param biasDeg deflection in degrees (defaults to {@link SKYWAVE_BEARING_BIAS_DEG})
 * @returns the apparent bearing, in radians
 */
export function skywaveApparentBearingRad(
  trueBearingRad: number,
  biasDeg: number = SKYWAVE_BEARING_BIAS_DEG
): number {
  return trueBearingRad + (biasDeg * Math.PI) / 180;
}

/**
 * Ground projection of a single-hop reflection point: the midpoint of the site→emitter path (where
 * the wave touches the ionosphere). On the flat 2D map this is the average of the two endpoints.
 */
export function reflectionMidpoint(
  siteX: number,
  siteY: number,
  emitterX: number,
  emitterY: number
): { x: number; y: number } {
  return { x: (siteX + emitterX) / 2, y: (siteY + emitterY) / 2 };
}
