/**
 * Digital communications primitives (brief §5, Track B "Playing a Radio Signal") — the transmit and
 * receive chain in plain 2D I/Q: map bits to constellation symbols, push them through an AWGN
 * channel, and slice them back to bits.
 *
 * Symbols live in the same complex plane as the rest of the toolkit (`Complex`, re = I, im = Q).
 * Every constellation is normalized to unit *average symbol energy*, so the Eb/N0 ↔ noise mapping
 * (`noiseSigma`) is honest across schemes.
 */

import { type Complex, magnitudeSquared, sub } from './complex';
import { mulberry32 } from './random';
import { qfunc } from './coding';

/** A digital modulation scheme: an energy-normalized set of `2^bitsPerSymbol` I/Q points. */
export interface Constellation {
  name: string;
  /** Bits carried per symbol (1 = BPSK, 2 = QPSK, 4 = 16-QAM). */
  bitsPerSymbol: number;
  /** Points indexed by the integer value of their bit group (MSB first), Gray-coded so physical
   *  neighbors differ by exactly one bit. Normalized to unit average energy. */
  points: Complex[];
}

/** Scale a raw point set to unit average symbol energy (so schemes compare fairly under Eb/N0). */
function normalizeEnergy(points: Complex[]): Complex[] {
  const meanE = points.reduce((s, p) => s + magnitudeSquared(p), 0) / points.length;
  const k = meanE > 0 ? 1 / Math.sqrt(meanE) : 1;
  return points.map((p) => ({ re: p.re * k, im: p.im * k }));
}

// A 2-bit Gray axis: integer value → amplitude level, ordered so adjacent levels differ by one bit.
// bits 00→-3, 01→-1, 11→+1, 10→+3.
const GRAY_LEVEL_4 = [-3, -1, 3, 1];

/** BPSK: bit 0 → +1, bit 1 → −1 (already unit energy). */
export const BPSK: Constellation = {
  name: 'BPSK',
  bitsPerSymbol: 1,
  points: normalizeEnergy([
    { re: 1, im: 0 },
    { re: -1, im: 0 },
  ]),
};

/** QPSK: one Gray-coded quadrant per 2-bit group. */
export const QPSK: Constellation = {
  name: 'QPSK',
  bitsPerSymbol: 2,
  points: normalizeEnergy([
    { re: 1, im: 1 }, // 00
    { re: -1, im: 1 }, // 01
    { re: 1, im: -1 }, // 10
    { re: -1, im: -1 }, // 11
  ]),
};

/** 16-QAM: a 4×4 grid, each axis Gray-coded from a 2-bit half of the symbol. */
export const QAM16: Constellation = {
  name: '16-QAM',
  bitsPerSymbol: 4,
  points: normalizeEnergy(
    Array.from({ length: 16 }, (_, v) => ({
      re: GRAY_LEVEL_4[(v >> 2) & 3], // high 2 bits → I
      im: GRAY_LEVEL_4[v & 3], // low 2 bits → Q
    }))
  ),
};

export const CONSTELLATIONS: Record<string, Constellation> = { BPSK, QPSK, QAM16 };

/**
 * Map a bit array to constellation symbols. Bits are grouped `bitsPerSymbol` at a time (MSB first);
 * a trailing partial group is zero-padded so the last symbol is still well-defined.
 */
export function bitsToSymbols(bits: number[], c: Constellation): Complex[] {
  const k = c.bitsPerSymbol;
  const out: Complex[] = [];
  for (let i = 0; i < bits.length; i += k) {
    let v = 0;
    for (let j = 0; j < k; j++) v = (v << 1) | (bits[i + j] ?? 0);
    out.push(c.points[v]);
  }
  return out;
}

/** The index of the nearest constellation point to `z` (minimum Euclidean distance). */
export function nearestSymbol(z: Complex, c: Constellation): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < c.points.length; i++) {
    const d = magnitudeSquared(sub(z, c.points[i]));
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** Hard-decide received symbols back to bits: nearest point → its bit group (MSB first). */
export function symbolsToBits(symbols: Complex[], c: Constellation): number[] {
  const k = c.bitsPerSymbol;
  const out: number[] = [];
  for (const z of symbols) {
    const v = nearestSymbol(z, c);
    for (let j = k - 1; j >= 0; j--) out.push((v >> j) & 1);
  }
  return out;
}

/**
 * Per-component noise standard deviation for a target Eb/N0 (dB), given unit average symbol energy.
 * Eb = Es / k = 1 / k; the complex noise has total variance N0 split as N0/2 per I/Q axis, so
 * `σ = √(N0 / 2)` with `N0 = Eb / (Eb/N0)`.
 */
export function noiseSigma(ebN0dB: number, bitsPerSymbol: number): number {
  const ebN0 = 10 ** (ebN0dB / 10);
  const eb = 1 / bitsPerSymbol;
  const n0 = eb / ebN0;
  return Math.sqrt(n0 / 2);
}

/**
 * Add complex AWGN of per-component std `sigma` to each symbol (deterministic for a given `seed`).
 * Box–Muller produces both I and Q noise from each uniform pair.
 */
export function awgn(symbols: Complex[], sigma: number, seed = 1): Complex[] {
  const rng = mulberry32(seed);
  return symbols.map((s) => {
    const u1 = Math.max(rng(), Number.EPSILON);
    const u2 = rng();
    const r = sigma * Math.sqrt(-2 * Math.log(u1));
    return { re: s.re + r * Math.cos(2 * Math.PI * u2), im: s.im + r * Math.sin(2 * Math.PI * u2) };
  });
}

/**
 * Closed-form bit-error rate for a constellation over AWGN at the given Eb/N0 (dB) — the analytic
 * curve the from-scratch `awgn` + `symbolsToBits` Monte-Carlo simulation is expected to track.
 *
 * BPSK and Gray-coded QPSK are exact: `Pb = Q(√(2·Eb/N0))`. Square Gray QAM uses the standard
 * approximation `Pb ≈ (4/k)(1 − 1/√M)·Q(√(3k/(M−1)·Eb/N0))` (k = bits/symbol, M = 2^k), which is
 * tight at the SNRs of interest and reduces exactly to `Q(√(2·Eb/N0))` for QPSK.
 */
export function analyticBer(c: Constellation, ebN0dB: number): number {
  const gamma = 10 ** (ebN0dB / 10);
  const k = c.bitsPerSymbol;
  // BPSK (k=1) and Gray QPSK (k=2) share the per-bit BER Q(√(2·Eb/N0)); BPSK is not square QAM,
  // so it must be handled here rather than by the M-QAM formula.
  if (k <= 2) return qfunc(Math.sqrt(2 * gamma));
  const M = 2 ** k;
  return (4 / k) * (1 - 1 / Math.sqrt(M)) * qfunc(Math.sqrt(((3 * k) / (M - 1)) * gamma));
}

/** Fraction of differing bits between two equal-length bit arrays (BER). */
export function bitErrorRate(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let errors = 0;
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) errors++;
  return errors / n;
}

/** Encode text as a bit stream: its UTF-8 bytes, 8 bits MSB-first (so any Unicode survives). */
export function textToBits(text: string): number[] {
  const bytes = new TextEncoder().encode(text);
  const bits: number[] = [];
  for (const byte of bytes) {
    for (let b = 7; b >= 0; b--) bits.push((byte >> b) & 1);
  }
  return bits;
}

/** Decode a UTF-8 bit stream back to text (inverse of `textToBits`); a trailing partial byte is
 *  dropped, and bytes corrupted by the channel become the Unicode replacement character. */
export function bitsToText(bits: number[]): string {
  const n = Math.floor(bits.length / 8);
  const bytes = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    let code = 0;
    for (let b = 0; b < 8; b++) code = (code << 1) | bits[i * 8 + b];
    bytes[i] = code;
  }
  return new TextDecoder().decode(bytes);
}
