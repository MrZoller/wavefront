import { describe, expect, it } from 'vitest';
import { AXIS, type AxisLabel, axisAriaLabel, formatAxisLabel } from './axisLabel';

describe('formatAxisLabel', () => {
  it('renders the bare quantity when there is no unit (honest about unitless axes)', () => {
    expect(formatAxisLabel({ quantity: 'Sample' })).toBe('Sample');
    expect(formatAxisLabel({ quantity: 'Amplitude' })).toBe('Amplitude');
  });

  it('appends a real unit in parentheses', () => {
    expect(formatAxisLabel({ quantity: 'Magnitude', unit: 'dB' })).toBe('Magnitude (dB)');
    expect(formatAxisLabel({ quantity: 'Phase', unit: '°' })).toBe('Phase (°)');
  });

  it('treats an empty or whitespace unit as "no unit" — never an empty pair of parens', () => {
    expect(formatAxisLabel({ quantity: 'Sample', unit: '' })).toBe('Sample');
    expect(formatAxisLabel({ quantity: 'Sample', unit: '   ' })).toBe('Sample');
  });

  it('trims surrounding whitespace', () => {
    expect(formatAxisLabel({ quantity: '  Frequency  ', unit: '  Hz  ' })).toBe('Frequency (Hz)');
  });

  // This is the runtime half of the "every axis names what it represents" guarantee: the type
  // system makes `quantity` required, and this rejects an empty/whitespace one (including
  // dynamically-built labels) so a plot can never render a nameless axis.
  it('throws when the quantity is empty or whitespace', () => {
    expect(() => formatAxisLabel({ quantity: '' })).toThrow(/quantity is required/i);
    expect(() => formatAxisLabel({ quantity: '   ' })).toThrow(/quantity is required/i);
  });
});

describe('axisAriaLabel', () => {
  it('reads as "{y} versus {x}" for assistive tech', () => {
    expect(axisAriaLabel(AXIS.magnitudeDb, AXIS.normalizedFrequency)).toBe(
      'Magnitude (dB) versus Normalized frequency (cycles/sample)'
    );
  });
});

describe('AXIS presets', () => {
  it('keep dB and normalized-frequency wording consistent across every spectrum', () => {
    expect(formatAxisLabel(AXIS.magnitudeDb)).toBe('Magnitude (dB)');
    expect(formatAxisLabel(AXIS.normalizedFrequency)).toBe('Normalized frequency (cycles/sample)');
  });

  it('leave genuinely unitless axes without a fabricated unit', () => {
    const unitless: AxisLabel[] = [AXIS.sample, AXIS.time, AXIS.amplitude];
    for (const label of unitless) expect(label.unit).toBeUndefined();
    expect(formatAxisLabel(AXIS.sample)).toBe('Sample');
    expect(formatAxisLabel(AXIS.amplitude)).toBe('Amplitude');
  });
});
