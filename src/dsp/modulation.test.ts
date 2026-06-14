import { describe, it, expect } from 'vitest';
import { magnitude } from './complex';
import { bitsToSymbols, CONSTELLATIONS } from './comms';
import { MODULATORS, am, fm, pm } from './modulation';

describe('modulators', () => {
  it('linear schemes expose constellation symbols matching the bit mapping', () => {
    const bits = [0, 1, 1, 0, 1, 0, 0, 1];
    const { symbols } = MODULATORS.QPSK.modulate(bits, 4);
    expect(symbols).toEqual(bitsToSymbols(bits, CONSTELLATIONS.QPSK));
  });

  it('FSK and MSK are constant-envelope (|signal| ≈ 1) with no constellation', () => {
    for (const name of ['FSK', 'MSK']) {
      const m = MODULATORS[name];
      expect(m.hasConstellation).toBe(false);
      const { signal } = m.modulate([1, 0, 1, 1, 0], 8);
      for (const s of signal) expect(magnitude(s)).toBeCloseTo(1, 9);
    }
  });

  it('MSK accumulates a quarter-cycle of phase per bit period (h = 0.5)', () => {
    const sps = 16;
    const { signal } = MODULATORS.MSK.modulate([1], sps);
    const endPhase = Math.atan2(signal[sps - 1].im, signal[sps - 1].re);
    // h = 0.5 ⇒ exactly π/2 of phase advance over one bit period.
    expect(endPhase).toBeCloseTo(Math.PI / 2, 6);
  });
});

describe('analog modulation', () => {
  const msg = Array.from({ length: 64 }, (_, n) => Math.sin((2 * Math.PI * 3 * n) / 64));

  it('AM amplitude tracks the message; FM and PM are constant-envelope', () => {
    const a = am(msg, 0.5);
    expect(a[0].re).toBeCloseTo(1 + 0.5 * msg[0], 9);
    for (const s of fm(msg, 0.05)) expect(magnitude(s)).toBeCloseTo(1, 9);
    for (const s of pm(msg)) expect(magnitude(s)).toBeCloseTo(1, 9);
  });
});
