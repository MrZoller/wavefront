/**
 * Channel impairments (brief §5, Track B Layer 2) — what a real radio link does to a signal between
 * transmitter and receiver: multipath echoes (frequency-selective fading), a carrier
 * frequency/phase offset (the constellation spins), and the BER-vs-SNR sweep that summarizes it all.
 */

import { type Complex } from './complex';
import {
  type Constellation,
  awgn,
  bitErrorRate,
  bitsToSymbols,
  noiseSigma,
  symbolsToBits,
} from './comms';
import { mulberry32 } from './random';

/** One multipath component: a copy of the signal delayed by `delay` samples and scaled by `gain`. */
export interface Tap {
  delay: number;
  gain: number;
}

/**
 * Apply a multipath (FIR) channel: `y[n] = Σ gainₖ · x[n − delayₖ]`. Overlapping delayed copies
 * cause inter-symbol interference and frequency-selective fading. Output length matches the input.
 */
export function multipath(signal: Complex[], taps: Tap[]): Complex[] {
  const out: Complex[] = signal.map(() => ({ re: 0, im: 0 }));
  for (const { delay, gain } of taps) {
    for (let n = delay; n < signal.length; n++) {
      out[n].re += gain * signal[n - delay].re;
      out[n].im += gain * signal[n - delay].im;
    }
  }
  return out;
}

/**
 * Channel frequency response magnitude in dB over normalized frequency [−0.5, 0.5):
 * `H(f) = Σ gainₖ · e^{−j2πf·delayₖ}`. Echoes carve notches where the copies cancel — the visible
 * signature of frequency-selective fading.
 */
export function channelResponseDb(taps: Tap[], nFreqs = 256): number[] {
  const out: number[] = new Array(nFreqs);
  for (let i = 0; i < nFreqs; i++) {
    const f = -0.5 + i / nFreqs;
    let re = 0;
    let im = 0;
    for (const { delay, gain } of taps) {
      const ph = -2 * Math.PI * f * delay;
      re += gain * Math.cos(ph);
      im += gain * Math.sin(ph);
    }
    out[i] = 20 * Math.log10(Math.max(1e-6, Math.hypot(re, im)));
  }
  return out;
}

/**
 * Apply a carrier frequency + phase offset to a symbol stream: symbol `i` is rotated by
 * `e^{j(2π·cfo·i + phase)}`. A nonzero `cfo` makes the constellation continuously **spin**; a
 * `phase` offset leaves it statically **rotated** — what happens when the receiver's oscillator
 * isn't locked to the transmitter's (the same physics as Doppler).
 */
export function applyCfo(symbols: Complex[], cfo: number, phase = 0): Complex[] {
  return symbols.map((s, i) => {
    const a = 2 * Math.PI * cfo * i + phase;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    return { re: s.re * c - s.im * sn, im: s.re * sn + s.im * c };
  });
}

/** Sweep BER over a list of Eb/N0 values for a scheme (random data, seeded AWGN, hard decisions). */
export function berVsSnr(
  scheme: Constellation,
  ebN0sDb: number[],
  nSymbols = 2000,
  seed = 1
): Array<{ ebN0: number; ber: number }> {
  const rng = mulberry32(seed);
  const bits = Array.from({ length: nSymbols * scheme.bitsPerSymbol }, () => (rng() < 0.5 ? 0 : 1));
  const tx = bitsToSymbols(bits, scheme);
  return ebN0sDb.map((ebN0, k) => {
    const rx = awgn(tx, noiseSigma(ebN0, scheme.bitsPerSymbol), 1000 + k);
    return { ebN0, ber: bitErrorRate(bits, symbolsToBits(rx, scheme)) };
  });
}
