import { describe, it, expect } from 'vitest';
import { type Complex, magnitude } from './complex';
import { ofdmSymbol, ofdmModulate, chirp, pnCode, dsssSpread, processingGainDb } from './waveforms';

describe('OFDM', () => {
  it('cyclic prefix copies the tail of the symbol to the front', () => {
    const carriers: Complex[] = Array.from({ length: 8 }, (_, k) => ({
      re: k === 1 ? 1 : 0,
      im: 0,
    }));
    const cpLen = 2;
    const sym = ofdmSymbol(carriers, cpLen);
    expect(sym).toHaveLength(8 + cpLen);
    for (let i = 0; i < cpLen; i++) {
      expect(sym[i].re).toBeCloseTo(sym[8 + i].re, 9);
      expect(sym[i].im).toBeCloseTo(sym[8 + i].im, 9);
    }
  });

  it('a single active subcarrier yields a constant-amplitude tone in time', () => {
    const carriers: Complex[] = Array.from({ length: 16 }, (_, k) => ({
      re: k === 3 ? 1 : 0,
      im: 0,
    }));
    const sym = ofdmSymbol(carriers, 0);
    for (const s of sym) expect(magnitude(s)).toBeCloseTo(1 / 16, 9);
  });

  it('packs data across subcarriers into a grid', () => {
    const data: Complex[] = Array.from({ length: 20 }, () => ({ re: 1, im: 0 }));
    const { grid } = ofdmModulate(data, 8, 2);
    expect(grid).toHaveLength(3); // ceil(20/8)
    expect(grid[0]).toHaveLength(8);
  });
});

describe('chirp', () => {
  it('is constant-envelope and sweeps frequency', () => {
    const c = chirp(64, 0.01, 0.2);
    for (const s of c) expect(magnitude(s)).toBeCloseTo(1, 9);
    // Instantaneous frequency (phase derivative) rises from start to end.
    const dphi = (a: Complex, b: Complex) =>
      Math.atan2(b.im * a.re - b.re * a.im, a.re * b.re + a.im * b.im);
    expect(dphi(c[1], c[2])).toBeLessThan(dphi(c[62], c[63]));
  });
});

describe('DSSS', () => {
  it('spreads each bit into code-length chips and gives the expected processing gain', () => {
    const code = pnCode(16, 5);
    const chips = dsssSpread([1, 0], code);
    expect(chips).toHaveLength(32);
    expect(chips.slice(0, 16)).toEqual(code); // bit 1 → +code
    expect(chips.slice(16)).toEqual(code.map((c) => -c)); // bit 0 → −code
    expect(processingGainDb(16)).toBeCloseTo(12.04, 2);
  });
});
