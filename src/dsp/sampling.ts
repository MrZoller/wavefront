/**
 * Sampling & aliasing (brief §7, Track D Layer 0). Sampling wraps the spectrum: any frequency above
 * the Nyquist frequency (`fs/2`) masquerades as a lower one — the wagon-wheel effect.
 */

/** The apparent (aliased) frequency a tone at `freq` shows up as when sampled at `sampleRate`,
 *  folded into the observable band [0, fs/2]. Equal to `freq` when below Nyquist. */
export function aliasedFrequency(freq: number, sampleRate: number): number {
  const fs = sampleRate;
  let f = ((freq % fs) + fs) % fs; // wrap into [0, fs)
  if (f > fs / 2) f = fs - f; // fold around Nyquist
  return f;
}
