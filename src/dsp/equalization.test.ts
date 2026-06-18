import { describe, it, expect } from 'vitest';
import { type Complex, magnitude, sub } from './complex';
import { awgn } from './comms';
import { mulberry32 } from './random';
import {
  applyChannelCircular,
  applyChannelLinear,
  channelFreqResponse,
  equalize,
  estimateChannelLS,
  evm,
  firFilter,
  lmsEqualizer,
} from './equalization';

/** Random QPSK-ish unit-energy symbols. */
const qpsk = (n: number, seed: number): Complex[] => {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => ({
    re: (rng() < 0.5 ? -1 : 1) / Math.SQRT2,
    im: (rng() < 0.5 ? -1 : 1) / Math.SQRT2,
  }));
};

const tapError = (a: Complex[], b: Complex[]): number =>
  a.reduce((s, c, i) => s + magnitude(sub(c, b[i] ?? { re: 0, im: 0 })), 0);

describe('channel as convolution', () => {
  it('a single unit tap passes the signal through unchanged (linear and circular)', () => {
    const x = qpsk(16, 1);
    const unit: Complex[] = [{ re: 1, im: 0 }];
    expect(applyChannelLinear(x, unit)).toEqual(x);
    const circ = applyChannelCircular(x, unit);
    circ.forEach((c, i) => {
      expect(c.re).toBeCloseTo(x[i].re, 9);
      expect(c.im).toBeCloseTo(x[i].im, 9);
    });
  });

  it('frequency response of a unit tap is flat at magnitude 1', () => {
    for (const h of channelFreqResponse([{ re: 1, im: 0 }], 32))
      expect(magnitude(h)).toBeCloseTo(1, 9);
  });
});

describe('pilot-based least-squares channel estimation', () => {
  const trueTaps: Complex[] = [
    { re: 1, im: 0 },
    { re: 0.6, im: -0.25 },
  ];

  it('recovers the channel exactly with no noise', () => {
    const pilots = qpsk(64, 5);
    const rx = applyChannelLinear(pilots, trueTaps);
    const est = estimateChannelLS(pilots, rx, 2);
    expect(tapError(est, trueTaps)).toBeLessThan(1e-9);
  });

  it('converges to truth as the pilot count grows', () => {
    const noisy = (m: number) => {
      const pilots = qpsk(m, 9);
      const rx = awgn(applyChannelLinear(pilots, trueTaps), 0.2, 42);
      return tapError(estimateChannelLS(pilots, rx, 2), trueTaps);
    };
    expect(noisy(400)).toBeLessThan(noisy(20));
  });

  it('converges to truth as SNR improves (less noise)', () => {
    const pilots = qpsk(128, 13);
    const clean = applyChannelLinear(pilots, trueTaps);
    const errAt = (sigma: number) =>
      tapError(estimateChannelLS(pilots, awgn(clean, sigma, 7), 2), trueTaps);
    expect(errAt(0.05)).toBeLessThan(errAt(0.4));
  });
});

describe('zero-forcing / MMSE equalizer', () => {
  const taps: Complex[] = [
    { re: 1, im: 0 },
    { re: 0.5, im: 0 },
  ];

  it('zero-forcing inverts the channel exactly (no noise)', () => {
    const x = qpsk(64, 3);
    const rx = applyChannelCircular(x, taps);
    const eq = equalize(rx, taps, 'zf');
    eq.forEach((c, i) => {
      expect(c.re).toBeCloseTo(x[i].re, 6);
      expect(c.im).toBeCloseTo(x[i].im, 6);
    });
  });

  it('drops the constellation EVM well below the distorted input', () => {
    const x = qpsk(64, 8);
    const rx = awgn(applyChannelCircular(x, taps), 0.05, 21);
    const before = evm(rx, x);
    const after = evm(equalize(rx, taps, 'mmse', 400), x);
    expect(after).toBeLessThan(before);
    expect(after).toBeLessThan(0.15); // re-clustered tightly
  });
});

describe('EVM', () => {
  it('is zero for a perfect match and positive otherwise', () => {
    const x = qpsk(8, 2);
    expect(evm(x, x)).toBe(0);
    const off = x.map((c) => ({ re: c.re + 0.3, im: c.im }));
    expect(evm(off, x)).toBeGreaterThan(0);
  });
});

describe('adaptive LMS equalizer', () => {
  // A mild minimum-phase channel whose causal inverse is [1, −0.5, 0.25, …].
  const channel: Complex[] = [
    { re: 1, im: 0 },
    { re: 0.5, im: 0 },
  ];

  const run = () => {
    const sym = qpsk(256, 17);
    const rx = awgn(applyChannelLinear(sym, channel), 0.02, 99);
    return { sym, rx, result: lmsEqualizer(rx, sym, 8, 0.05, { epochs: 4 }) };
  };

  it('drives the squared error down (in the mean)', () => {
    const { result } = run();
    const h = result.history;
    const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
    const first = mean(h.slice(0, 50).map((s) => s.errorSq));
    const last = mean(h.slice(-50).map((s) => s.errorSq));
    expect(last).toBeLessThan(first * 0.2);
  });

  it('learns weights that approximate the channel inverse', () => {
    const { result } = run();
    // 1/(1 + 0.5·z⁻¹) ≈ [1, −0.5, 0.25, …]
    expect(result.weights[0].re).toBeCloseTo(1, 1);
    expect(result.weights[1].re).toBeCloseTo(-0.5, 1);
  });

  it('the learned filter recovers the transmitted symbols end-to-end', () => {
    const { sym, rx, result } = run();
    const eq = firFilter(rx, result.weights);
    // Skip the warm-up transient, then compare.
    let mse = 0;
    let count = 0;
    for (let n = 20; n < sym.length; n++, count++) mse += magnitude(sub(eq[n], sym[n])) ** 2;
    expect(mse / count).toBeLessThan(0.02);
  });
});
