/**
 * Channel coding / forward error correction (the Coding & Equalization track, "Error Control").
 *
 * Structured redundancy lets the receiver *correct* flipped bits, not just notice them. Two codes,
 * shortest-to-deepest intuition:
 *
 *  - **Repetition** — send each bit `n` times, decode by majority vote. The simplest idea there is;
 *    it shows what "redundancy" means but, per *information-bit* energy, it barely helps on a noisy
 *    (AWGN) channel because spreading the energy across copies makes each copy noisier.
 *  - **Hamming(7,4)** — 4 data bits + 3 parity bits, single-error-correcting via a 3-bit
 *    **syndrome** that names the flipped position. A real (if tiny) code: it genuinely shifts the
 *    BER-vs-Eb/N0 curve to the left (**coding gain**) for a 4/7 **code rate**.
 *
 * The bit-level encoders/decoders are exact and exhaustively testable; the BER curves are the
 * standard closed-form approximations (so they plot smoothly down to low BER without Monte-Carlo
 * noise). All energies are per *information* bit (Eb/N0), the honest yardstick: a rate-R code spends
 * Ec = R·Eb per transmitted bit, so the rate cost is paid in the noise each coded bit sees.
 */

// ----------------------------------------------------------------------------------------------
// Repetition code (majority vote)
// ----------------------------------------------------------------------------------------------

/** Repeat each bit `n` times: `1 → 1…1`. The rate is 1/n. */
export function repetitionEncode(bits: number[], n: number): number[] {
  const out: number[] = [];
  for (const b of bits) for (let i = 0; i < n; i++) out.push(b);
  return out;
}

/**
 * Majority-vote decode of an `n`-times repetition code: each group of `n` coded bits → the bit value
 * that appears more often. A group survives up to ⌊n/2⌋ flips. (Ties, only possible for even `n`,
 * resolve to 0.)
 */
export function repetitionDecode(coded: number[], n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i + n <= coded.length; i += n) {
    let ones = 0;
    for (let j = 0; j < n; j++) ones += coded[i + j];
    out.push(ones * 2 > n ? 1 : 0);
  }
  return out;
}

// ----------------------------------------------------------------------------------------------
// Hamming(7,4) — single-error-correcting block code
// ----------------------------------------------------------------------------------------------
//
// Classic "syndrome = position" layout over 1-indexed positions 1…7 (stored 0-indexed):
//   parity bits at positions 1, 2, 4 (the powers of two); data bits at 3, 5, 6, 7.
//   Each parity bit p covers the positions whose index has p's bit set, so the syndrome read back
//   out is the *binary number of the flipped position* — 0 means no (detectable) error.

/** Encode one 4-bit data word `[d0,d1,d2,d3]` to a 7-bit Hamming codeword (even parity). */
export function hamming74EncodeBlock(data: number[]): number[] {
  const [d0, d1, d2, d3] = data;
  const c = [0, 0, d0, 0, d1, d2, d3]; // positions 3,5,6,7 carry the data
  c[0] = c[2] ^ c[4] ^ c[6]; // p1 covers 1,3,5,7
  c[1] = c[2] ^ c[5] ^ c[6]; // p2 covers 2,3,6,7
  c[3] = c[4] ^ c[5] ^ c[6]; // p4 covers 4,5,6,7
  return c;
}

/**
 * Syndrome of a 7-bit block: the integer 0…7. `0` = no error detected; otherwise the **1-indexed
 * position** of the single bit to flip (the heart of single-error correction).
 */
export function hamming74Syndrome(block: number[]): number {
  const s1 = block[0] ^ block[2] ^ block[4] ^ block[6];
  const s2 = block[1] ^ block[2] ^ block[5] ^ block[6];
  const s4 = block[3] ^ block[4] ^ block[5] ^ block[6];
  return s1 + 2 * s2 + 4 * s4;
}

/** Correct (at most) one bit error in a 7-bit block and return the 4 data bits. */
export function hamming74DecodeBlock(block: number[]): number[] {
  const s = hamming74Syndrome(block);
  const r = block.slice();
  if (s !== 0) r[s - 1] ^= 1; // flip the position the syndrome names
  return [r[2], r[4], r[5], r[6]];
}

/** Encode a bit stream with Hamming(7,4), zero-padding a trailing partial 4-bit group. */
export function hamming74Encode(bits: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 4) {
    const data = [bits[i] ?? 0, bits[i + 1] ?? 0, bits[i + 2] ?? 0, bits[i + 3] ?? 0];
    out.push(...hamming74EncodeBlock(data));
  }
  return out;
}

/** Decode a Hamming(7,4) stream block-by-block, correcting a single error per 7-bit block. */
export function hamming74Decode(coded: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i + 7 <= coded.length; i += 7) {
    out.push(...hamming74DecodeBlock(coded.slice(i, i + 7)));
  }
  return out;
}

// ----------------------------------------------------------------------------------------------
// Analytic BER over an AWGN channel with BPSK (closed form, per information bit)
// ----------------------------------------------------------------------------------------------

/** Binomial coefficient C(n, k). */
function binom(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let c = 1;
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
  return c;
}

/** erf via the Abramowitz & Stegun 7.1.26 rational approximation (|error| ≲ 1.5e-7). */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

/** The Gaussian tail Q(x) = P(Z > x) = ½·erfc(x/√2) — the workhorse of digital-comms BER. */
export function qfunc(x: number): number {
  return 0.5 * (1 - erf(x / Math.SQRT2));
}

/** Raw BPSK bit-error probability at the given Eb/N0 (dB): `Pb = Q(√(2·Eb/N0))`. */
export function uncodedBer(ebN0dB: number): number {
  const gamma = 10 ** (ebN0dB / 10);
  return qfunc(Math.sqrt(2 * gamma));
}

/**
 * Per-coded-bit crossover probability `p` for a rate-`R` code at information-bit Eb/N0 (dB): each
 * coded bit carries energy `Ec = R·Eb`, so it sees `p = Q(√(2·R·Eb/N0))`.
 */
function crossover(ebN0dB: number, rate: number): number {
  const gamma = 10 ** (ebN0dB / 10);
  return qfunc(Math.sqrt(2 * rate * gamma));
}

/** Decoded BER for an `n`-times (odd) repetition code with hard-decision majority voting. */
export function repetitionBer(ebN0dB: number, n: number): number {
  const p = crossover(ebN0dB, 1 / n);
  // The decoded bit is wrong when more than half of the n copies flipped.
  let pe = 0;
  for (let k = Math.ceil((n + 1) / 2); k <= n; k++) {
    pe += binom(n, k) * p ** k * (1 - p) ** (n - k);
  }
  return pe;
}

/**
 * Decoded BER for Hamming(7,4) with hard-decision (bounded-distance) decoding — the standard
 * textbook approximation `Pb ≈ (1/n)·Σ_{j≥t+1} j·C(n,j)·p^j·(1−p)^{n−j}` with n=7, t=1. The j≥2
 * (∝ p²) leading term is what makes the curve fall *steeper* than uncoded → coding gain at high SNR.
 */
export function hamming74Ber(ebN0dB: number): number {
  const p = crossover(ebN0dB, 4 / 7);
  let pe = 0;
  for (let j = 2; j <= 7; j++) pe += (j * binom(7, j) * p ** j * (1 - p) ** (7 - j)) / 7;
  return pe;
}

// ----------------------------------------------------------------------------------------------
// Code descriptors — one object the UI selects for both the worked example and the BER curve
// ----------------------------------------------------------------------------------------------

export type CodeId = 'none' | 'repetition' | 'hamming';

/** A selectable code: its block geometry, bit-level encode/decode, and analytic BER curve. */
export interface Code {
  id: CodeId;
  name: string;
  /** Information bits per block. */
  dataBits: number;
  /** Transmitted (coded) bits per block. */
  codedBits: number;
  /** Code rate k/n (1 = uncoded). */
  rate: number;
  encode(bits: number[]): number[];
  decode(coded: number[]): number[];
  /** Decoded BER over BPSK/AWGN at this Eb/N0 (dB). */
  ber(ebN0dB: number): number;
}

const REPETITION_N = 3;

export const CODES: Record<CodeId, Code> = {
  none: {
    id: 'none',
    name: 'Uncoded',
    dataBits: 1,
    codedBits: 1,
    rate: 1,
    encode: (bits) => bits.slice(),
    decode: (coded) => coded.slice(),
    ber: uncodedBer,
  },
  repetition: {
    id: 'repetition',
    name: `Repetition (${REPETITION_N}×)`,
    dataBits: 1,
    codedBits: REPETITION_N,
    rate: 1 / REPETITION_N,
    encode: (bits) => repetitionEncode(bits, REPETITION_N),
    decode: (coded) => repetitionDecode(coded, REPETITION_N),
    ber: (ebN0dB) => repetitionBer(ebN0dB, REPETITION_N),
  },
  hamming: {
    id: 'hamming',
    name: 'Hamming(7,4)',
    dataBits: 4,
    codedBits: 7,
    rate: 4 / 7,
    encode: hamming74Encode,
    decode: hamming74Decode,
    ber: hamming74Ber,
  },
};

/**
 * **Coding gain** at a reference BER: how much less Eb/N0 (dB) the code needs to reach `refBer`
 * versus uncoded BPSK. Positive = the coded curve sits to the *left*. Found by bisection on each
 * (monotonically decreasing) BER curve. Returns `null` if a curve never reaches `refBer` in range.
 */
export function codingGainDb(code: Code, refBer = 1e-5): number | null {
  const ebN0AtBer = (ber: (db: number) => number): number | null => {
    let lo = -10;
    let hi = 30;
    if (ber(hi) > refBer) return null; // never gets that good in range
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (ber(mid) > refBer) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const coded = ebN0AtBer(code.ber);
  const uncoded = ebN0AtBer(uncodedBer);
  if (coded === null || uncoded === null) return null;
  return uncoded - coded;
}
