/**
 * Ionospheric sounding — the ionosonde and the ionogram (a synthesis of two ideas the learner
 * already has). An **ionosonde is radar pointed straight up**: ping the sky, time the echo off the
 * ionosphere, and the round-trip delay is a height. Sweep the frequency and the heights trace out an
 * **ionogram**, whose cusp marks the **critical frequency** the HF Skywave stub only asserts.
 *
 * Two reused ideas, one new model:
 *   - **Echo-delay ranging** (the radar module's round-trip-delay → range primitive), here pointed up
 *     so delay → **virtual height** `h' = c·t/2` ({@link virtualHeightKmFromDelay}).
 *   - **Reflect-vs-penetrate** (the HF Skywave stub): a vertical wave turns back while it is below
 *     the layer's critical frequency `foF2`, and punches through above it ({@link reflectsVertical}).
 *   - **New here:** a single-layer reflection model giving the virtual height as a function of probe
 *     frequency ({@link virtualHeightKm}), and the {@link ionogramTrace} sweep that assembles the
 *     canonical height-vs-frequency curve and cuts it off at `foF2`.
 *
 * Everything is illustrative textbook physics, exactly like the skywave stub it completes: a single
 * parabolic layer, stand-in critical frequencies, no o/x splitting, no multi-layer profile, no
 * true-height inversion, no real station data. Real ranging math (`h' = c·t/2`, the secant law) fed
 * illustrative inputs. From-scratch and tested (`ionosonde.test.ts`); the foF2 → MUF step reuses the
 * skywave module's `mufMHz` secant law wholesale.
 */

import { SPEED_OF_LIGHT_M_S } from './constants';
import { VIRTUAL_HEIGHT_KM } from './skywave';

/** Speed of light in km/s — the units the virtual-height ranging works in. */
const SPEED_OF_LIGHT_KM_S = SPEED_OF_LIGHT_M_S / 1000;

/**
 * Illustrative height of the reflecting layer's ionization peak, in km. Reuses the skywave stub's
 * {@link VIRTUAL_HEIGHT_KM} (~300 km, F-region order of magnitude) so the two conceptual scenes share
 * one stand-in height rather than drifting apart.
 */
export const LAYER_PEAK_HEIGHT_KM = VIRTUAL_HEIGHT_KM;

/**
 * Illustrative half-thickness of the parabolic layer, in km. The base of the layer — where the
 * lowest-frequency echoes turn back — sits this far below the peak, so the ionogram trace starts near
 * `peakHeight − semiThickness` and climbs from there.
 */
export const LAYER_SEMI_THICKNESS_KM = 100;

/** A synthetic single reflecting layer. Illustrative — not a real electron-density profile. */
export interface IonoLayer {
  /** Vertical critical frequency `foF2` (MHz): the cutoff where the straight-up echo disappears. */
  criticalFreqMHz: number;
  /** Height of the layer's ionization peak (km). */
  peakHeightKm: number;
  /** Half-thickness of the parabolic layer (km); its base sits at `peakHeightKm − semiThicknessKm`. */
  semiThicknessKm: number;
}

/**
 * Virtual height from a round-trip echo delay: `h' = c·t/2` — the radar echo-delay range, pointed up.
 * "Virtual" because it assumes the pulse travels at `c` the whole way; the real reflection is lower,
 * since the wave slows down in the plasma before it turns (noted, deliberately not modelled).
 *
 * @param roundTripSeconds round-trip echo delay, in seconds
 * @returns virtual height, in km
 */
export function virtualHeightKmFromDelay(roundTripSeconds: number): number {
  return (SPEED_OF_LIGHT_KM_S * roundTripSeconds) / 2;
}

/**
 * The inverse: the round-trip delay an echo returning from virtual height `h'` arrives after,
 * `t = 2·h'/c`. Used to place the echo on the single-ping time axis.
 *
 * @param virtualHeightKm virtual height, in km
 * @returns round-trip delay, in seconds
 */
export function echoDelaySecondsForHeight(virtualHeightKm: number): number {
  return (2 * virtualHeightKm) / SPEED_OF_LIGHT_KM_S;
}

/**
 * Whether a vertical-incidence wave at `freqMHz` reflects off the layer (turns back as an echo) or
 * penetrates to space. Straight up, the layer turns the wave back only *below* its critical
 * frequency; at and above `foF2` the virtual height runs away to infinity and no echo returns. (The
 * skywave stub's oblique `reflectsSkywave` reflects *at* its boundary — here the boundary is the
 * vertical critical frequency itself, the asymptote, so it is exclusive.)
 *
 * @param freqMHz probe frequency, in MHz
 * @param criticalFreqMHz the layer's vertical critical frequency `foF2`, in MHz
 */
export function reflectsVertical(freqMHz: number, criticalFreqMHz: number): boolean {
  return freqMHz < criticalFreqMHz;
}

/**
 * Virtual height of the vertical echo at probe frequency `freqMHz`, or `null` when the wave reaches
 * or exceeds the critical frequency and penetrates (no echo).
 *
 * Single parabolic-layer model (Davies/Budden, textbook): for a layer whose plasma frequency rises
 * parabolically from its base to `foF2` at the peak, the virtual height is
 *
 *   h'(f) = h₀ + (yₘ/2)·(f/fc)·ln((fc + f)/(fc − f)),   h₀ = peak − semiThickness
 *
 * which starts at the layer base `h₀` at low frequency and runs away to infinity as `f → foF2` — the
 * canonical ionogram cusp. Above the wave's own slow-down isn't modelled; the height is "virtual"
 * (assumes propagation at `c`), so it exceeds the true peak height near the cutoff.
 *
 * @param freqMHz probe frequency, in MHz
 * @param layer the reflecting layer
 * @returns virtual height in km, or `null` if the wave penetrates (`freqMHz ≥ foF2`)
 */
export function virtualHeightKm(freqMHz: number, layer: IonoLayer): number | null {
  const { criticalFreqMHz: fc, peakHeightKm, semiThicknessKm } = layer;
  if (freqMHz >= fc) return null; // penetrates — no echo
  const baseKm = peakHeightKm - semiThicknessKm;
  if (freqMHz <= 0) return baseKm; // DC limit: the layer base
  return (
    baseKm + (semiThicknessKm / 2) * (freqMHz / fc) * Math.log((fc + freqMHz) / (fc - freqMHz))
  );
}

/** One point on the ionogram trace: a probe frequency and the virtual height its echo came from. */
export interface IonogramPoint {
  freqMHz: number;
  virtualHeightKm: number;
}

/** How to sweep the sounder when assembling an ionogram. */
export interface IonogramOptions {
  /** First (lowest) probe frequency in the sweep, in MHz. */
  startMHz: number;
  /** Last (highest) probe frequency in the sweep, in MHz. */
  stopMHz: number;
  /** Number of evenly spaced probe frequencies across the sweep. */
  steps: number;
  /**
   * Display ceiling, in km: drop points whose virtual height exceeds it. The trace runs away to
   * infinity at the cutoff, so this trims the runaway tail (the cusp is still implied by the trace
   * climbing toward it). Omit to keep every reflecting point.
   */
  maxHeightKm?: number;
}

/**
 * Assemble the ionogram: sweep the probe frequency from `startMHz` to `stopMHz` and collect the
 * `(frequency, virtual height)` of every echo. Frequencies at or above the critical frequency
 * penetrate and contribute no point, so the trace **cuts off at `foF2`** exactly as a real ionogram
 * does — that cutoff is the measurement. An optional `maxHeightKm` ceiling drops the runaway tail
 * near the cutoff.
 *
 * @param layer the reflecting layer
 * @param opts the sweep
 * @returns the ionogram trace, ascending in frequency
 */
export function ionogramTrace(layer: IonoLayer, opts: IonogramOptions): IonogramPoint[] {
  const { startMHz, stopMHz, steps, maxHeightKm } = opts;
  const out: IonogramPoint[] = [];
  for (let i = 0; i < steps; i++) {
    const f = steps <= 1 ? startMHz : startMHz + ((stopMHz - startMHz) * i) / (steps - 1);
    const h = virtualHeightKm(f, layer);
    if (h == null) continue; // penetrated — the echo has vanished
    if (maxHeightKm != null && h > maxHeightKm) continue; // beyond the display ceiling
    out.push({ freqMHz: f, virtualHeightKm: h });
  }
  return out;
}
