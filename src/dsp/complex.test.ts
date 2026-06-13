import { describe, it, expect } from 'vitest';
import {
  complex,
  add,
  sub,
  mul,
  scale,
  conj,
  magnitude,
  magnitudeSquared,
  phase,
  expj,
  fromPolar,
} from './complex';

const TOL = 1e-12;

describe('complex arithmetic', () => {
  it('adds and subtracts like 2D vectors', () => {
    expect(add(complex(1, 2), complex(3, -1))).toEqual({ re: 4, im: 1 });
    expect(sub(complex(1, 2), complex(3, -1))).toEqual({ re: -2, im: 3 });
  });

  it('multiplies via the (ac−bd)+(ad+bc)i rule', () => {
    // (1+2i)(3+4i) = 3 + 4i + 6i + 8i^2 = -5 + 10i
    expect(mul(complex(1, 2), complex(3, 4))).toEqual({ re: -5, im: 10 });
  });

  it('multiplication adds angles and multiplies magnitudes (rotation+scale)', () => {
    const a = fromPolar(2, Math.PI / 6);
    const b = fromPolar(3, Math.PI / 4);
    const p = mul(a, b);
    expect(magnitude(p)).toBeCloseTo(6, 12);
    expect(phase(p)).toBeCloseTo(Math.PI / 6 + Math.PI / 4, 12);
  });

  it('scales by a real factor', () => {
    expect(scale(complex(2, -3), 2)).toEqual({ re: 4, im: -6 });
  });

  it('conjugate mirrors across the real axis', () => {
    expect(conj(complex(2, -3))).toEqual({ re: 2, im: 3 });
  });

  it('|z|^2 equals z * conj(z) (real part)', () => {
    const z = complex(3, 4);
    expect(magnitude(z)).toBeCloseTo(5, 12);
    expect(magnitudeSquared(z)).toBeCloseTo(mul(z, conj(z)).re, 12);
  });
});

describe('Euler / phasor (expj)', () => {
  it('e^{j0} = 1', () => {
    const z = expj(0);
    expect(z.re).toBeCloseTo(1, 12);
    expect(z.im).toBeCloseTo(0, 12);
  });

  it('e^{jπ/2} = j', () => {
    const z = expj(Math.PI / 2);
    expect(z.re).toBeCloseTo(0, 12);
    expect(z.im).toBeCloseTo(1, 12);
  });

  it('e^{jπ} = -1', () => {
    const z = expj(Math.PI);
    expect(z.re).toBeCloseTo(-1, 12);
    expect(z.im).toBeCloseTo(0, 12);
  });

  it('always lands on the unit circle', () => {
    for (let k = 0; k < 16; k++) {
      const theta = (k / 16) * 2 * Math.PI;
      expect(magnitude(expj(theta))).toBeCloseTo(1, 12);
      expect(phase(expj(theta))).toBeCloseTo(Math.atan2(Math.sin(theta), Math.cos(theta)), 12);
    }
  });

  it('fromPolar round-trips through magnitude/phase', () => {
    const z = fromPolar(2.5, 0.7);
    expect(magnitude(z)).toBeCloseTo(2.5, 12);
    expect(phase(z)).toBeCloseTo(0.7, 12);
    expect(Math.abs(magnitudeSquared(z) - 2.5 * 2.5)).toBeLessThan(TOL);
  });
});
