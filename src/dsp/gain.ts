/**
 * Gain & clipping — the other half of the analog/digital boundary (Track F). Before a sample is
 * quantized it passes through an amplifier whose job is to fill the converter's range: too little
 * gain and the signal sits buried in the noise floor (wasting bits); too much and it slams into the
 * rails and **clips**, folding energy into harmonics and spurs. The sweet spot between is why
 * automatic gain control (AGC) exists. Built from scratch; checked in `gain.test.ts`.
 */

/** Convert a voltage gain in decibels to a linear multiplier (`10^(dB/20)`). */
export function dbToLinear(db: number): number {
  return 10 ** (db / 20);
}

/** Hard-limit (saturate) `x` to ±`limit` — the converter's rails. */
export function clip(x: number, limit = 1): number {
  return Math.max(-limit, Math.min(limit, x));
}

/** Apply `gainDb` of gain, then hard-clip to ±`limit`. The whole analog front end in one line. */
export function applyGain(x: number, gainDb: number, limit = 1): number {
  return clip(x * dbToLinear(gainDb), limit);
}

/** Apply gain + clipping to a whole signal (see {@link applyGain}). */
export function applyGainSignal(samples: number[], gainDb: number, limit = 1): number[] {
  return samples.map((s) => applyGain(s, gainDb, limit));
}

/** Fraction of samples sitting exactly on a rail — a simple "am I clipping?" indicator in [0, 1]. */
export function clippedFraction(samples: number[], limit = 1): number {
  if (samples.length === 0) return 0;
  let n = 0;
  for (const s of samples) if (Math.abs(s) >= limit - 1e-9) n++;
  return n / samples.length;
}

/** Peak headroom in dB: how far the loudest sample sits below the rail (`+∞` for silence,
 *  `0` when it just touches, negative once it would clip). */
export function headroomDb(samples: number[], limit = 1): number {
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  return peak === 0 ? Infinity : 20 * Math.log10(limit / peak);
}
