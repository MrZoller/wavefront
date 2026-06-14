/**
 * Quantization — the analog/digital boundary (Track F). An ADC rounds each sample to one of a finite
 * set of levels; the discarded remainder is quantization noise. This is where the IQ samples every
 * other track consumes are actually born.
 *
 * For an `N`-bit converter spanning a symmetric full-scale range, the ideal signal-to-quantization-
 * noise ratio of a full-scale sinusoid is `6.02·N + 1.76` dB — so each added bit buys ≈6 dB of
 * dynamic range (a lower noise floor). Built from scratch; checked in `quantization.test.ts`.
 */

/** Number of output levels for an `N`-bit quantizer. */
export function levels(bits: number): number {
  return 2 ** bits;
}

/** Quantizer step size (one LSB) across the range [−fullScale, +fullScale]. */
export function stepSize(bits: number, fullScale = 1): number {
  return (2 * fullScale) / levels(bits);
}

/** Ideal SQNR (dB) of a full-scale sinusoid through an `N`-bit quantizer: `6.02·N + 1.76`. */
export function idealSqnrDb(bits: number): number {
  return 6.02 * bits + 1.76;
}

export interface QuantizeOptions {
  /** Symmetric input range the converter spans; inputs beyond it clamp to the rails. Default 1. */
  fullScale?: number;
  /** Add ±1 LSB triangular (TPDF) dither before rounding — trades a touch more noise for no
   *  harmonic distortion / no "stuck" quiet tones. Default false. */
  dither?: boolean;
  /** Injectable uniform [0, 1) source so dithered output is deterministic in tests. */
  rand?: () => number;
}

/**
 * Uniform mid-rise quantizer: round `x` to the nearest of `2^bits` levels across
 * [−fullScale, +fullScale], clamping out-of-range inputs to the rails (that clamp *is* clipping —
 * the gain stage explores it). With `dither`, ±1 LSB of triangular noise is added before rounding.
 */
export function quantize(x: number, bits: number, opts: QuantizeOptions = {}): number {
  const { fullScale = 1, dither = false, rand = Math.random } = opts;
  const q = stepSize(bits, fullScale);
  let v = x / q;
  if (dither) v += rand() + rand() - 1; // TPDF over (−1, +1) LSB
  const maxIdx = 2 ** (bits - 1) - 1;
  const minIdx = -(2 ** (bits - 1));
  const idx = Math.max(minIdx, Math.min(maxIdx, Math.round(v)));
  return idx * q;
}

/** Quantize a whole signal (see {@link quantize}). */
export function quantizeSignal(samples: number[], bits: number, opts: QuantizeOptions = {}): number[] {
  return samples.map((s) => quantize(s, bits, opts));
}

/**
 * Measured signal-to-quantization-noise ratio (dB): `10·log10(Σ clean² / Σ error²)`, where the error
 * is `quantized − clean`. Returns `Infinity` for a perfectly recovered signal (no error).
 */
export function sqnrDb(clean: number[], quantized: number[]): number {
  let sig = 0;
  let err = 0;
  for (let i = 0; i < clean.length; i++) {
    sig += clean[i] * clean[i];
    const e = quantized[i] - clean[i];
    err += e * e;
  }
  return err === 0 ? Infinity : 10 * Math.log10(sig / err);
}
