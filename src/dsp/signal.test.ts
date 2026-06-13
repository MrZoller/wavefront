import { describe, it, expect } from 'vitest';
import { magnitude, phase } from './complex';
import { phasorAt, generateComplexTone, realPart, imagPart } from './signal';

describe('phasorAt', () => {
  it('at t=0 with zero phase sits at 1+0j', () => {
    const z = phasorAt(0, 100);
    expect(z.re).toBeCloseTo(1, 12);
    expect(z.im).toBeCloseTo(0, 12);
  });

  it('completes exactly one revolution after t = 1/f', () => {
    const f = 50;
    const quarter = phasorAt(1 / (4 * f), f); // quarter turn → +j
    expect(quarter.re).toBeCloseTo(0, 12);
    expect(quarter.im).toBeCloseTo(1, 12);

    const full = phasorAt(1 / f, f); // full turn → back to 1
    expect(full.re).toBeCloseTo(1, 12);
    expect(full.im).toBeCloseTo(0, 12);
  });

  it('respects amplitude and starting phase', () => {
    const z = phasorAt(0, 10, Math.PI / 2, 3);
    expect(magnitude(z)).toBeCloseTo(3, 12);
    expect(phase(z)).toBeCloseTo(Math.PI / 2, 12);
  });
});

describe('generateComplexTone', () => {
  it('produces the requested number of unit-magnitude samples', () => {
    const sig = generateComplexTone(440, 8000, 64);
    expect(sig.samples).toHaveLength(64);
    expect(sig.sampleRate).toBe(8000);
    for (const s of sig.samples) {
      expect(magnitude(s)).toBeCloseTo(1, 12);
    }
  });

  it('I and Q are cosine and sine of the advancing angle', () => {
    const f = 100;
    const fs = 1000;
    const sig = generateComplexTone(f, fs, 10);
    const I = realPart(sig);
    const Q = imagPart(sig);
    for (let n = 0; n < 10; n++) {
      const theta = (2 * Math.PI * f * n) / fs;
      expect(I[n]).toBeCloseTo(Math.cos(theta), 12);
      expect(Q[n]).toBeCloseTo(Math.sin(theta), 12);
    }
  });

  it('a tone at fs/N has period exactly N samples', () => {
    const N = 8;
    const fs = 8000;
    const sig = generateComplexTone(fs / N, fs, N + 1);
    // Sample N should equal sample 0 (one full period later).
    expect(sig.samples[N].re).toBeCloseTo(sig.samples[0].re, 10);
    expect(sig.samples[N].im).toBeCloseTo(sig.samples[0].im, 10);
  });
});
