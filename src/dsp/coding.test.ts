import { describe, it, expect } from 'vitest';
import { mulberry32 } from './random';
import {
  CODES,
  codingGainDb,
  hamming74Decode,
  hamming74DecodeBlock,
  hamming74Encode,
  hamming74EncodeBlock,
  hamming74Ber,
  hamming74Syndrome,
  qfunc,
  repetitionBer,
  repetitionDecode,
  repetitionEncode,
  uncodedBer,
} from './coding';

const randomBits = (n: number, seed: number) => {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => (rng() < 0.5 ? 0 : 1));
};

describe('repetition code', () => {
  it('repeats each bit n times', () => {
    expect(repetitionEncode([1, 0, 1], 3)).toEqual([1, 1, 1, 0, 0, 0, 1, 1, 1]);
  });

  it('round-trips with no errors', () => {
    const bits = randomBits(40, 7);
    expect(repetitionDecode(repetitionEncode(bits, 3), 3)).toEqual(bits);
  });

  it('corrects up to ⌊n/2⌋ flips per group by majority vote', () => {
    // One flip in a group of 3 is corrected; two flips overwhelm the vote.
    expect(repetitionDecode([1, 0, 1], 3)).toEqual([1]); // 2 of 3 → 1
    expect(repetitionDecode([1, 0, 0], 3)).toEqual([0]); // 2 of 3 → 0 (decoding error)
    expect(repetitionDecode([1, 1, 0, 0, 0, 1], 3)).toEqual([1, 0]);
  });
});

describe('Hamming(7,4)', () => {
  it('produces a zero syndrome for every valid codeword', () => {
    for (let v = 0; v < 16; v++) {
      const data = [(v >> 3) & 1, (v >> 2) & 1, (v >> 1) & 1, v & 1];
      expect(hamming74Syndrome(hamming74EncodeBlock(data))).toBe(0);
    }
  });

  it('round-trips all 16 data words with no errors', () => {
    for (let v = 0; v < 16; v++) {
      const data = [(v >> 3) & 1, (v >> 2) & 1, (v >> 1) & 1, v & 1];
      expect(hamming74DecodeBlock(hamming74EncodeBlock(data))).toEqual(data);
    }
  });

  it('corrects ANY single-bit error (every data word × every position)', () => {
    for (let v = 0; v < 16; v++) {
      const data = [(v >> 3) & 1, (v >> 2) & 1, (v >> 1) & 1, v & 1];
      const code = hamming74EncodeBlock(data);
      for (let pos = 0; pos < 7; pos++) {
        const corrupted = code.slice();
        corrupted[pos] ^= 1;
        // The syndrome names the 1-indexed flipped position…
        expect(hamming74Syndrome(corrupted)).toBe(pos + 1);
        // …and decoding recovers the original data.
        expect(hamming74DecodeBlock(corrupted)).toEqual(data);
      }
    }
  });

  it('encodes/decodes a stream and zero-pads a trailing partial group', () => {
    const bits = randomBits(4 * 9, 11);
    expect(hamming74Decode(hamming74Encode(bits))).toEqual(bits);
    // 5 bits → two 4-bit blocks (second zero-padded) → 14 coded bits.
    expect(hamming74Encode([1, 0, 1, 1, 1])).toHaveLength(14);
    expect(hamming74Decode(hamming74Encode([1, 0, 1, 1, 1]))).toEqual([1, 0, 1, 1, 1, 0, 0, 0]);
  });

  it('survives a stream with one error per block', () => {
    const bits = randomBits(4 * 8, 3);
    const coded = hamming74Encode(bits);
    for (let b = 0; b < coded.length / 7; b++) coded[b * 7 + (b % 7)] ^= 1; // one flip per block
    expect(hamming74Decode(coded)).toEqual(bits);
  });
});

describe('Q-function', () => {
  it('matches known values', () => {
    expect(qfunc(0)).toBeCloseTo(0.5, 6);
    expect(qfunc(1)).toBeCloseTo(0.158655, 4);
    expect(qfunc(2)).toBeCloseTo(0.02275, 4);
    expect(qfunc(3)).toBeCloseTo(0.001349, 4);
  });

  it('is symmetric: Q(−x) = 1 − Q(x)', () => {
    expect(qfunc(-1)).toBeCloseTo(1 - qfunc(1), 6);
    expect(qfunc(-2.5)).toBeCloseTo(1 - qfunc(2.5), 6);
  });
});

describe('analytic BER curves', () => {
  it('uncoded BPSK is Q(√(2·Eb/N0))', () => {
    // 10 dB → γ = 10 → Q(√20) ≈ 3.87e-6.
    expect(uncodedBer(10)).toBeCloseTo(qfunc(Math.sqrt(20)), 12);
    expect(uncodedBer(10)).toBeLessThan(uncodedBer(4)); // monotone decreasing
  });

  it('Hamming(7,4) beats uncoded at a useful SNR (coding gain) and is monotone', () => {
    // The brief's suggested test: coded BER < uncoded at a given SNR.
    expect(hamming74Ber(10)).toBeLessThan(uncodedBer(10));
    expect(hamming74Ber(8)).toBeLessThan(uncodedBer(8));
    expect(hamming74Ber(12)).toBeLessThan(hamming74Ber(8));
  });

  it('repetition barely helps on AWGN per information-bit energy (honest weak baseline)', () => {
    // Splitting energy across 3 copies makes hard-decision repetition worse than uncoded here.
    expect(repetitionBer(10, 3)).toBeGreaterThan(uncodedBer(10));
  });

  it('quantifies coding gain: positive for Hamming, non-positive for repetition', () => {
    const hammingGain = codingGainDb(CODES.hamming, 1e-5);
    expect(hammingGain).not.toBeNull();
    expect(hammingGain!).toBeGreaterThan(0);
    const repGain = codingGainDb(CODES.repetition, 1e-5);
    expect(repGain).not.toBeNull();
    expect(repGain!).toBeLessThanOrEqual(0);
  });
});

describe('code descriptors', () => {
  it('expose consistent rate = dataBits / codedBits', () => {
    for (const code of Object.values(CODES)) {
      expect(code.rate).toBeCloseTo(code.dataBits / code.codedBits, 12);
    }
  });

  it('encode/decode round-trip cleanly for every code', () => {
    const bits = randomBits(4 * 6, 19); // divisible by 1 and 4
    for (const code of Object.values(CODES)) {
      expect(code.decode(code.encode(bits))).toEqual(bits);
    }
  });
});
