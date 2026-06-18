import { describe, it, expect } from 'vitest';
import { horizonKm, radioHorizonKm, HORIZON_COEFF_KM_PER_SQRT_M } from './horizon';

describe('radio horizon', () => {
  it('matches the closed form d = √(2·R·h) for a single antenna', () => {
    const R = 6371e3; // metres
    for (const h of [1, 10, 100, 1000]) {
      const expected = Math.sqrt(2 * R * h) / 1000; // km
      expect(horizonKm(h)).toBeCloseTo(expected, 9);
    }
  });

  it('reproduces the classic d ≈ 3.57·√h coefficient', () => {
    expect(HORIZON_COEFF_KM_PER_SQRT_M).toBeCloseTo(3.57, 2);
    // A 100 m mast sees ≈ 35.7 km.
    expect(horizonKm(100)).toBeCloseTo(35.69, 1);
  });

  it('adds the two antennas: d ≈ 3.57·(√h₁ + √h₂)', () => {
    expect(radioHorizonKm(100, 100)).toBeCloseTo(2 * horizonKm(100), 12);
    // Two 9 m antennas: 3.57·(3 + 3) ≈ 21.4 km.
    expect(radioHorizonKm(9, 9)).toBeCloseTo(HORIZON_COEFF_KM_PER_SQRT_M * 6, 6);
  });

  it('raising one antenna extends the reach (monotonic)', () => {
    expect(radioHorizonKm(50, 10)).toBeGreaterThan(radioHorizonKm(10, 10));
  });

  it('is zero at the surface and rejects negative heights', () => {
    expect(radioHorizonKm(0, 0)).toBe(0);
    expect(() => horizonKm(-1)).toThrow();
  });
});
