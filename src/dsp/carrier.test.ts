import { describe, it, expect } from 'vitest';
import type { Complex } from './complex';
import { upconvert, downconvert, lowpass } from './carrier';

describe('up/down-conversion', () => {
  it('upconvert produces a pure tone for a constant baseband', () => {
    // Baseband I=1, Q=0 ⇒ passband is exactly cos(2π fc n/fs).
    const fs = 64;
    const fc = 8;
    const baseband: Complex[] = Array.from({ length: fs }, () => ({ re: 1, im: 0 }));
    const pass = upconvert(baseband, fc, fs);
    for (let n = 0; n < pass.length; n++) {
      expect(pass[n]).toBeCloseTo(Math.cos((2 * Math.PI * fc * n) / fs), 9);
    }
  });

  it('round-trips constant I/Q through up → down → lowpass', () => {
    const fs = 200;
    const fc = 20; // fs ≫ fc so a one-carrier-period average cleanly removes the 2·fc image
    const I = 0.6;
    const Q = -0.3;
    const baseband: Complex[] = Array.from({ length: fs }, () => ({ re: I, im: Q }));
    const recovered = lowpass(downconvert(upconvert(baseband, fc, fs), fc, fs), fs / fc);
    // Check the steady-state middle (edges are affected by the truncated average).
    for (let n = 50; n < 150; n++) {
      expect(recovered[n].re).toBeCloseTo(I, 2);
      expect(recovered[n].im).toBeCloseTo(Q, 2);
    }
  });

  it('lowpass leaves a constant signal unchanged', () => {
    const sig: Complex[] = Array.from({ length: 20 }, () => ({ re: 2, im: -1 }));
    for (const z of lowpass(sig, 5)) {
      expect(z.re).toBeCloseTo(2, 9);
      expect(z.im).toBeCloseTo(-1, 9);
    }
  });
});
