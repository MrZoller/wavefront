import { describe, it, expect } from 'vitest';
import {
  incidenceAngleDeg,
  mufMHz,
  reflectsSkywave,
  skywaveApparentBearingRad,
  reflectionMidpoint,
  SKYWAVE_BEARING_BIAS_DEG,
} from './skywave';

describe('skywave / MUF (conceptual)', () => {
  it('strikes the layer more obliquely for longer hops', () => {
    expect(incidenceAngleDeg(0, 300)).toBeCloseTo(0, 9); // straight up
    expect(incidenceAngleDeg(600, 300)).toBeCloseTo(45, 9); // D/2 = h' → 45°
    expect(incidenceAngleDeg(2000, 300)).toBeGreaterThan(45);
  });

  it('applies the secant law MUF = f_c · sec(φ)', () => {
    expect(mufMHz(8, 0)).toBeCloseTo(8, 9); // vertical: MUF = critical
    expect(mufMHz(8, 60)).toBeCloseTo(16, 6); // sec 60° = 2
    // Oblique incidence always raises the MUF above the vertical critical frequency.
    expect(mufMHz(5, 45)).toBeGreaterThan(5);
  });

  it('reflects at/below the MUF and penetrates above it', () => {
    expect(reflectsSkywave(10, 14)).toBe(true);
    expect(reflectsSkywave(14, 14)).toBe(true); // boundary reflects
    expect(reflectsSkywave(20, 14)).toBe(false); // punches through to space
  });
});

describe('skywave cross-link (illustrative bearing error)', () => {
  it('rotates the apparent bearing by the illustrative bias', () => {
    const bias = (SKYWAVE_BEARING_BIAS_DEG * Math.PI) / 180;
    expect(skywaveApparentBearingRad(0)).toBeCloseTo(bias, 12);
    expect(skywaveApparentBearingRad(1, 0)).toBeCloseTo(1, 12); // zero bias = no change
  });

  it('puts the reflection point at the midpoint of the path', () => {
    expect(reflectionMidpoint(0, 0, 10, 20)).toEqual({ x: 5, y: 10 });
    expect(reflectionMidpoint(-30, -20, 10, 40)).toEqual({ x: -10, y: 10 });
  });
});
