import { describe, it, expect } from 'vitest';
import { complex, magnitude } from './complex';
import { fft } from './fft';
import { applyGain, applyGainSignal, clip, clippedFraction, dbToLinear, headroomDb } from './gain';

describe('gain & clipping', () => {
  it('converts dB to a linear multiplier (0 dB = ×1, 20 dB = ×10, 6.02 dB ≈ ×2)', () => {
    expect(dbToLinear(0)).toBeCloseTo(1, 12);
    expect(dbToLinear(20)).toBeCloseTo(10, 9);
    expect(dbToLinear(6.0206)).toBeCloseTo(2, 4);
  });

  it('clip saturates at ±limit', () => {
    expect(clip(0.5)).toBeCloseTo(0.5, 12);
    expect(clip(2)).toBeCloseTo(1, 12);
    expect(clip(-2)).toBeCloseTo(-1, 12);
    expect(clip(3, 0.5)).toBeCloseTo(0.5, 12);
  });

  it('amplifies then saturates', () => {
    expect(applyGain(0.1, 0)).toBeCloseTo(0.1, 12);
    expect(applyGain(0.5, 20)).toBeCloseTo(1, 12); // ×10 = 5 → clips to the rail
  });

  it('reports the clipped fraction and the headroom to the rail', () => {
    expect(clippedFraction([0, 0.5, 1, -1])).toBeCloseTo(0.5, 12);
    expect(headroomDb([0.5, -0.5])).toBeCloseTo(20 * Math.log10(2), 9); // ≈ 6.02 dB below the rail
    expect(headroomDb([1])).toBeCloseTo(0, 9); // peak just touches the rail
  });

  it('grows odd harmonics, not even ones, when a sine clips hard', () => {
    const N = 1024;
    const f = 8; // a clean bin
    const sine = Array.from({ length: N }, (_, n) => Math.sin((2 * Math.PI * f * n) / N));
    const clipped = applyGainSignal(sine, 30); // heavy gain → near-square wave
    const X = fft(clipped.map((v) => complex(v)));
    const rel = (k: number) => magnitude(X[k]) / magnitude(X[f]);
    // Odd harmonics (3f, 5f) are substantial...
    expect(rel(3 * f)).toBeGreaterThan(0.1);
    expect(rel(5 * f)).toBeGreaterThan(0.05);
    // ...even harmonics (2f, 4f) are essentially absent (the nonlinearity is odd-symmetric).
    expect(rel(2 * f)).toBeLessThan(0.01);
    expect(rel(4 * f)).toBeLessThan(0.01);
  });
});
