/**
 * Physical constants for the RF-propagation helpers (brief §8, §10).
 *
 * This module is **RF physics, not DSP** — it never touches the from-scratch `dsp/` core. It models
 * how energy crosses a medium *before* it becomes samples (bands, horizons, ray paths), so it lives
 * in its own `propagation/` boundary. Everything here is textbook-level and illustrative; none of it
 * is a real ionosphere/atmosphere model.
 */

/** Speed of light in a vacuum, in metres per second (exact, by SI definition). */
export const SPEED_OF_LIGHT_M_S = 299_792_458;

/** Mean Earth radius, in kilometres — the textbook 6371 km sphere used for the horizon geometry. */
export const EARTH_RADIUS_KM = 6371;
