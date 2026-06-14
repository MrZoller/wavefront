import { describe, it, expect } from 'vitest';
import { type Complex, magnitude } from './complex';
import { CONSTELLATIONS } from './comms';
import { multipath, channelResponseDb, applyCfo, berVsSnr } from './channel';

const sig = (n: number): Complex[] => Array.from({ length: n }, (_, i) => ({ re: i + 1, im: 0 }));

describe('multipath channel', () => {
  it('a single unit tap at delay 0 passes the signal through unchanged', () => {
    const x = sig(5);
    expect(multipath(x, [{ delay: 0, gain: 1 }])).toEqual(x);
  });

  it('a delayed echo adds a shifted, scaled copy', () => {
    const x = sig(4); // [1,2,3,4]
    const y = multipath(x, [
      { delay: 0, gain: 1 },
      { delay: 1, gain: 0.5 },
    ]);
    expect(y[0].re).toBeCloseTo(1, 9); // 1
    expect(y[1].re).toBeCloseTo(2 + 0.5 * 1, 9); // 2 + 0.5·1
    expect(y[3].re).toBeCloseTo(4 + 0.5 * 3, 9);
  });
});

describe('channel frequency response', () => {
  it('is flat (0 dB) for a single unit tap', () => {
    for (const db of channelResponseDb([{ delay: 0, gain: 1 }], 64)) expect(db).toBeCloseTo(0, 6);
  });

  it('carves a deep notch where a two-tap echo cancels', () => {
    // taps {0:1},{2:1} → H(f)=1+e^{-j2πf·2}, null at f=0.25 (2π·0.25·2 = π).
    const resp = channelResponseDb(
      [
        { delay: 0, gain: 1 },
        { delay: 2, gain: 1 },
      ],
      256
    );
    const idx = Math.round((0.25 + 0.5) * 256); // map f=0.25 to index
    expect(resp[idx]).toBeLessThan(-30); // deep cancellation
    expect(Math.max(...resp)).toBeCloseTo(20 * Math.log10(2), 1); // constructive peak ≈ +6 dB
  });
});

describe('carrier offset', () => {
  it('a pure phase offset rotates without changing magnitude', () => {
    const out = applyCfo([{ re: 1, im: 0 }], 0, Math.PI / 2);
    expect(out[0].re).toBeCloseTo(0, 9);
    expect(out[0].im).toBeCloseTo(1, 9);
  });

  it('a frequency offset accumulates rotation across symbols (spin), preserving amplitude', () => {
    const syms: Complex[] = Array.from({ length: 8 }, () => ({ re: 1, im: 0 }));
    const out = applyCfo(syms, 0.1, 0);
    for (const s of out) expect(magnitude(s)).toBeCloseTo(1, 9);
    // symbol 1 rotated by 2π·0.1.
    expect(Math.atan2(out[1].im, out[1].re)).toBeCloseTo(2 * Math.PI * 0.1, 9);
  });
});

describe('BER vs SNR', () => {
  it('decreases monotonically and is ~0 at high Eb/N0 (QPSK)', () => {
    const pts = berVsSnr(CONSTELLATIONS.QPSK, [0, 4, 8, 12], 3000, 5);
    expect(pts[0].ber).toBeGreaterThan(pts[3].ber);
    expect(pts[3].ber).toBeLessThan(0.001);
  });
});
