import { describe, it, expect } from 'vitest';
import { magnitudeSquared } from './complex';
import { mulberry32 } from './random';
import {
  BPSK,
  QPSK,
  QAM16,
  type Constellation,
  bitsToSymbols,
  symbolsToBits,
  nearestSymbol,
  noiseSigma,
  awgn,
  bitErrorRate,
} from './comms';

const SCHEMES = [BPSK, QPSK, QAM16];

const popcount = (x: number) => x.toString(2).replace(/0/g, '').length;
const randomBits = (n: number, seed: number) => {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => (rng() < 0.5 ? 0 : 1));
};

describe('constellations', () => {
  it.each(SCHEMES)('$name is normalized to unit average symbol energy', (c) => {
    const meanE = c.points.reduce((s, p) => s + magnitudeSquared(p), 0) / c.points.length;
    expect(meanE).toBeCloseTo(1, 9);
    expect(c.points).toHaveLength(2 ** c.bitsPerSymbol);
  });

  it.each(SCHEMES)('$name is Gray-coded: nearest neighbors differ by one bit', (c) => {
    for (let i = 0; i < c.points.length; i++) {
      let dmin = Infinity;
      for (let j = 0; j < c.points.length; j++) {
        if (j === i) continue;
        dmin = Math.min(
          dmin,
          magnitudeSquared({
            re: c.points[i].re - c.points[j].re,
            im: c.points[i].im - c.points[j].im,
          })
        );
      }
      for (let j = 0; j < c.points.length; j++) {
        if (j === i) continue;
        const d = magnitudeSquared({
          re: c.points[i].re - c.points[j].re,
          im: c.points[i].im - c.points[j].im,
        });
        if (Math.abs(d - dmin) < 1e-9) expect(popcount(i ^ j)).toBe(1);
      }
    }
  });
});

describe('bit ↔ symbol mapping', () => {
  it.each(SCHEMES)('$name round-trips bits with no noise', (c: Constellation) => {
    const bits = randomBits(c.bitsPerSymbol * 50, 7);
    const recovered = symbolsToBits(bitsToSymbols(bits, c), c);
    expect(recovered).toEqual(bits);
  });

  it('zero-pads a trailing partial symbol group', () => {
    // 3 bits into 16-QAM (4 bits/symbol) → one symbol; nearestSymbol of it is the 3 bits + a 0.
    const syms = bitsToSymbols([1, 0, 1], QAM16);
    expect(syms).toHaveLength(1);
    expect(nearestSymbol(syms[0], QAM16)).toBe(0b1010);
  });
});

describe('AWGN channel', () => {
  it('noiseSigma decreases with Eb/N0 and matches the closed form', () => {
    // QPSK (k=2) at 0 dB: N0 = Eb = 1/2, σ = √(N0/2) = 1/2.
    expect(noiseSigma(0, 2)).toBeCloseTo(0.5, 12);
    expect(noiseSigma(10, 2)).toBeLessThan(noiseSigma(0, 2));
  });

  it('is deterministic for a seed and roughly zero-mean at the set sigma', () => {
    const n = 4000;
    const clean = Array.from({ length: n }, () => ({ re: 0, im: 0 }));
    const a = awgn(clean, 0.3, 42);
    const b = awgn(clean, 0.3, 42);
    expect(a).toEqual(b); // same seed ⇒ identical
    const meanI = a.reduce((s, z) => s + z.re, 0) / n;
    const measuredStd = Math.sqrt(a.reduce((s, z) => s + z.re * z.re, 0) / n);
    expect(Math.abs(meanI)).toBeLessThan(0.02);
    expect(measuredStd).toBeCloseTo(0.3, 1);
  });
});

describe('end-to-end BER', () => {
  it('is ~0 at high Eb/N0 and worse at low Eb/N0 (QPSK)', () => {
    const bits = randomBits(QPSK.bitsPerSymbol * 2000, 3);
    const tx = bitsToSymbols(bits, QPSK);
    const ber = (dB: number) =>
      bitErrorRate(bits, symbolsToBits(awgn(tx, noiseSigma(dB, QPSK.bitsPerSymbol), 9), QPSK));
    expect(ber(12)).toBeLessThan(0.001);
    expect(ber(0)).toBeGreaterThan(ber(12));
  });

  it('bitErrorRate counts differing bits', () => {
    expect(bitErrorRate([0, 1, 0, 1], [0, 1, 1, 1])).toBeCloseTo(0.25, 12);
    expect(bitErrorRate([], [])).toBe(0);
  });
});
