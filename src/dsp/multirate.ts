/**
 * Multirate (brief §7, Track D Layer 1) — changing the sample rate. Decimation drops samples after a
 * low-pass (to avoid aliasing); interpolation inserts zeros then low-passes (to remove images). The
 * economic motive for channelization: a narrowband signal doesn't need a high sample rate.
 */

import { type Complex } from './complex';
import { firLowpass } from './filter';

const convReal = (x: number[], h: number[]): number[] => {
  const out = new Array<number>(x.length).fill(0);
  for (let i = 0; i < x.length; i++) {
    let acc = 0;
    for (let k = 0; k < h.length; k++) {
      const j = i - k + ((h.length - 1) >> 1); // centered so group delay ≈ 0
      if (j >= 0 && j < x.length) acc += h[k] * x[j];
    }
    out[i] = acc;
  }
  return out;
};

/** Complex FIR filter (real taps applied to each rail), centered to keep group delay ≈ 0. */
export function filterComplex(signal: Complex[], taps: number[]): Complex[] {
  const re = convReal(
    signal.map((s) => s.re),
    taps
  );
  const im = convReal(
    signal.map((s) => s.im),
    taps
  );
  return re.map((r, i) => ({ re: r, im: im[i] }));
}

/**
 * Decimate by `factor`: low-pass to the new Nyquist (cutoff `0.5/factor`) to prevent aliasing, then
 * keep every `factor`-th sample. Pass `antiAlias: false` to *skip* the filter and watch aliasing bite.
 */
export function decimate(signal: Complex[], factor: number, antiAlias = true): Complex[] {
  const filtered = antiAlias
    ? filterComplex(signal, firLowpass(0.5 / factor, 8 * factor + 1))
    : signal;
  const out: Complex[] = [];
  for (let i = 0; i < filtered.length; i += factor) out.push(filtered[i]);
  return out;
}

/**
 * Interpolate by `factor`: insert `factor − 1` zeros between samples, then low-pass (gain `factor`)
 * to remove the spectral images the zero-stuffing creates.
 */
export function interpolate(signal: Complex[], factor: number, antiImage = true): Complex[] {
  const up: Complex[] = new Array(signal.length * factor);
  for (let i = 0; i < up.length; i++)
    up[i] = i % factor === 0 ? signal[i / factor] : { re: 0, im: 0 };
  return antiImage ? filterComplex(up, firLowpass(0.5 / factor, 8 * factor + 1, factor)) : up;
}
