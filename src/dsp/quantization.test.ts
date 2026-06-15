import { describe, it, expect } from 'vitest';
import { idealSqnrDb, levels, quantize, quantizeSignal, sqnrDb, stepSize } from './quantization';

const fullScaleSine = (n: number, cycles = 19, amp = 0.99) =>
  Array.from({ length: n }, (_, i) => amp * Math.sin((2 * Math.PI * cycles * i) / n));

describe('quantization', () => {
  it('has 2^bits levels and a matching LSB step', () => {
    expect(levels(8)).toBe(256);
    expect(stepSize(8, 1)).toBeCloseTo(2 / 256, 12);
    expect(stepSize(1, 1)).toBeCloseTo(1, 12);
  });

  it('ideal SQNR follows 6.02·N + 1.76 dB', () => {
    expect(idealSqnrDb(8)).toBeCloseTo(49.92, 6);
    expect(idealSqnrDb(16)).toBeCloseTo(98.08, 6);
  });

  it('snaps to the nearest level and clamps inputs to the rails', () => {
    // 2-bit over [−1, 1): step 0.5, levels at −1, −0.5, 0, 0.5.
    expect(quantize(0.1, 2)).toBeCloseTo(0, 12);
    expect(quantize(0.3, 2)).toBeCloseTo(0.5, 12);
    expect(quantize(5, 2)).toBeCloseTo(0.5, 12); // clamp to the top level
    expect(quantize(-5, 2)).toBeCloseTo(-1, 12); // clamp to the bottom level
  });

  it('keeps in-range error within half an LSB', () => {
    const q = stepSize(6);
    for (let x = -0.9; x < 0.9; x += 0.013) {
      expect(Math.abs(quantize(x, 6) - x)).toBeLessThanOrEqual(q / 2 + 1e-9);
    }
  });

  it('lands a full-scale sine within ~1 dB of the ideal SQNR', () => {
    const clean = fullScaleSine(4096);
    for (const bits of [8, 10, 12]) {
      expect(sqnrDb(clean, quantizeSignal(clean, bits))).toBeGreaterThan(idealSqnrDb(bits) - 1.5);
    }
  });

  it('drops the noise ≈6 dB per added bit (each bit ≈ one more bit of dynamic range)', () => {
    const clean = fullScaleSine(4096);
    const gain = sqnrDb(clean, quantizeSignal(clean, 9)) - sqnrDb(clean, quantizeSignal(clean, 8));
    expect(gain).toBeGreaterThan(5);
    expect(gain).toBeLessThan(7);
  });

  it('is deterministic under an injected dither RNG', () => {
    const seq = [0.1, 0.9, 0.5, 0.5, 0.2, 0.7];
    const rng = () => {
      let i = 0;
      return () => seq[i++ % seq.length];
    };
    expect(quantize(0.31, 8, { dither: true, rand: rng() })).toBeCloseTo(
      quantize(0.31, 8, { dither: true, rand: rng() }),
      12
    );
  });
});
