import { describe, it, expect } from 'vitest';
import { formatFrequency, formatWavelength, formatDistanceKm } from './format';

describe('propagation formatters', () => {
  it('picks a sensible unit for frequency across the bands', () => {
    expect(formatFrequency(150e3)).toBe('150 kHz');
    expect(formatFrequency(1e6)).toBe('1.00 MHz');
    expect(formatFrequency(14.2e6)).toBe('14.2 MHz');
    expect(formatFrequency(2.4e9)).toBe('2.40 GHz');
  });

  it('picks a sensible unit for wavelength across the bands', () => {
    expect(formatWavelength(2000)).toBe('2.00 km');
    expect(formatWavelength(3)).toBe('3.00 m');
    expect(formatWavelength(0.125)).toBe('12.5 cm');
    expect(formatWavelength(0.002)).toBe('2.00 mm');
  });

  it('formats reach/horizon distances with scale-appropriate precision', () => {
    expect(formatDistanceKm(42.4)).toBe('42.4 km');
    expect(formatDistanceKm(350)).toBe('350 km');
    expect(formatDistanceKm(12000)).toBe('12.0 ×10³ km');
  });
});
