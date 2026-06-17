import { describe, it, expect } from 'vitest';
import { SPEED_OF_LIGHT_M_S } from './constants';
import { wavelengthM, frequencyHzForWavelength } from './wavelength';

describe('wavelength λ = c / f', () => {
  it('gives 1 m at the frequency whose wavelength is 1 m (c, in Hz)', () => {
    expect(wavelengthM(SPEED_OF_LIGHT_M_S)).toBeCloseTo(1, 12);
  });

  it('matches known textbook points', () => {
    // 1 MHz (the AM band) ≈ 300 m; 100 MHz (the FM band) ≈ 3 m; 1 GHz ≈ 0.3 m.
    expect(wavelengthM(1e6)).toBeCloseTo(299.792458, 6);
    expect(wavelengthM(100e6)).toBeCloseTo(2.99792458, 8);
    expect(wavelengthM(1e9)).toBeCloseTo(0.299792458, 9);
  });

  it('is the exact inverse of frequencyHzForWavelength', () => {
    for (const f of [3e6, 30e6, 146e6, 2.4e9]) {
      expect(frequencyHzForWavelength(wavelengthM(f))).toBeCloseTo(f, 3);
    }
  });

  it('rejects non-positive inputs', () => {
    expect(() => wavelengthM(0)).toThrow();
    expect(() => frequencyHzForWavelength(-1)).toThrow();
  });
});
