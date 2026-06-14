import { describe, it, expect } from 'vitest';
import { type Complex } from './complex';
import { filterComplex, decimate, interpolate } from './multirate';
import { aliasedFrequency } from './sampling';

const constSig = (n: number, v = 1): Complex[] =>
  Array.from({ length: n }, () => ({ re: v, im: 0 }));

describe('multirate', () => {
  it('filterComplex of an impulse returns the (centered) taps', () => {
    const N = 9;
    const impulse: Complex[] = Array.from({ length: N }, (_, i) => ({
      re: i === 4 ? 1 : 0,
      im: 0,
    }));
    const taps = [0.25, 0.5, 0.25];
    const y = filterComplex(impulse, taps);
    expect(y[3].re).toBeCloseTo(0.25, 9);
    expect(y[4].re).toBeCloseTo(0.5, 9);
    expect(y[5].re).toBeCloseTo(0.25, 9);
  });

  it('decimate reduces the rate and preserves a DC signal', () => {
    const y = decimate(constSig(64), 4);
    expect(y.length).toBe(16);
    expect(y[8].re).toBeCloseTo(1, 2); // steady-state DC passes through
  });

  it('interpolate raises the rate and fills the gaps for a DC signal', () => {
    const y = interpolate(constSig(32), 4);
    expect(y.length).toBe(128);
    expect(y[60].re).toBeCloseTo(1, 2); // steady-state interpolated value ≈ DC
  });
});

describe('aliasing', () => {
  it('leaves sub-Nyquist tones alone and folds the rest', () => {
    expect(aliasedFrequency(30, 100)).toBeCloseTo(30, 9);
    expect(aliasedFrequency(70, 100)).toBeCloseTo(30, 9); // 70 > 50 ⇒ folds to 30
    expect(aliasedFrequency(120, 100)).toBeCloseTo(20, 9); // wraps then folds
  });
});
