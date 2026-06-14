/**
 * Waveform-level systems (brief §6) — compositions built on the primitives, not peers of QPSK:
 * OFDM (many QAM subcarriers through an IFFT + cyclic prefix), LFM chirp (a swept tone), and DSSS
 * (spreading data with a fast pseudo-noise code).
 */

import { type Complex } from './complex';
import { ifft } from './fft';
import { mulberry32 } from './random';

/**
 * One OFDM symbol: place complex `carriers` on the subcarriers, IFFT to the time domain, and prepend
 * a cyclic prefix (the last `cpLen` samples copied to the front). The CP turns multipath's linear
 * convolution into a circular one, so a one-tap-per-subcarrier equalizer can undo the channel.
 */
export function ofdmSymbol(carriers: Complex[], cpLen: number): Complex[] {
  const time = ifft(carriers);
  const cp = time.slice(time.length - cpLen);
  return [...cp, ...time];
}

/**
 * Build a full OFDM waveform: pack `data` symbols across `nSub` subcarriers per OFDM symbol (unused
 * subcarriers left empty), IFFT each, and add a cyclic prefix of length `cpLen`. Returns the
 * concatenated time-domain signal plus the per-symbol resource grid (subcarrier × OFDM-symbol).
 */
export function ofdmModulate(
  data: Complex[],
  nSub: number,
  cpLen: number
): { signal: Complex[]; grid: Complex[][] } {
  const signal: Complex[] = [];
  const grid: Complex[][] = [];
  for (let i = 0; i < data.length; i += nSub) {
    const carriers: Complex[] = Array.from({ length: nSub }, (_, k) =>
      i + k < data.length ? data[i + k] : { re: 0, im: 0 }
    );
    grid.push(carriers);
    signal.push(...ofdmSymbol(carriers, cpLen));
  }
  return { signal, grid };
}

/**
 * Linear FM (chirp): a tone whose frequency sweeps linearly from `f0` to `f1` (cycles/sample) over
 * `n` samples. Its spectrogram is the signature diagonal; the basis of pulse-compression radar.
 */
export function chirp(n: number, f0: number, f1: number): Complex[] {
  const out: Complex[] = new Array(n);
  let phase = 0;
  for (let k = 0; k < n; k++) {
    const f = f0 + ((f1 - f0) * k) / (n - 1); // instantaneous frequency
    phase += 2 * Math.PI * f;
    out[k] = { re: Math.cos(phase), im: Math.sin(phase) };
  }
  return out;
}

/** A deterministic ±1 pseudo-noise spreading code. */
export function pnCode(length: number, seed = 1): number[] {
  const rng = mulberry32(seed);
  return Array.from({ length }, () => (rng() < 0.5 ? -1 : 1));
}

/**
 * Direct-sequence spread spectrum: each BPSK data bit (0/1 → +1/−1) is multiplied by the full
 * `code`, producing `code.length` chips per bit. The spectrum widens by the spreading factor; the
 * processing gain (`10·log10(L)` dB) is what lets the signal hide under the noise floor.
 */
export function dsssSpread(bits: number[], code: number[]): number[] {
  const chips: number[] = [];
  for (const b of bits) {
    const sym = b ? 1 : -1;
    for (const c of code) chips.push(sym * c);
  }
  return chips;
}

/** Processing gain in dB for a spreading factor `L`. */
export const processingGainDb = (L: number): number => 10 * Math.log10(L);
