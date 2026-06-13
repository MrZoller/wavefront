import { describe, it, expect } from 'vitest';
import { magnitude } from './complex';
import {
  elementPhaseStep,
  steeringVector,
  delayAndSumPower,
  arrayResponse,
  beamPattern,
  toDb,
} from './array';

const deg = (d: number) => (d * Math.PI) / 180;

describe('ULA steering vector', () => {
  it('is all-ones at broadside (β = 0)', () => {
    const a = steeringVector(4, 0.5, 0, 1);
    for (const z of a) {
      expect(z.re).toBeCloseTo(1, 12);
      expect(z.im).toBeCloseTo(0, 12);
    }
  });

  it('every element is unit magnitude with phase = k·β', () => {
    const n = 5;
    const d = 0.5;
    const lambda = 1;
    const theta = deg(20);
    const beta = elementPhaseStep(d, theta, lambda);
    const a = steeringVector(n, d, theta, lambda);
    for (let k = 0; k < n; k++) {
      expect(magnitude(a[k])).toBeCloseTo(1, 12);
      expect(a[k].re).toBeCloseTo(Math.cos(k * beta), 12);
      expect(a[k].im).toBeCloseTo(Math.sin(k * beta), 12);
    }
  });
});

describe('delay-and-sum beam pattern', () => {
  it('peaks (= 1 normalized) when steered exactly at the source', () => {
    for (const srcDeg of [-40, -10, 0, 25, 55]) {
      const r = arrayResponse(8, 0.5, deg(srcDeg), deg(srcDeg), 1);
      expect(r).toBeCloseTo(1, 10);
    }
  });

  it('full-power output equals N² when matched (unnormalized)', () => {
    const n = 6;
    const a = steeringVector(n, 0.5, deg(15), 1);
    // Snapshot = the source steering vector; steer at the same angle.
    expect(delayAndSumPower(a, a)).toBeCloseTo(n * n, 8);
  });

  it('has a null where the array factor vanishes (N=2, d=λ/2, source broadside → null at endfire)', () => {
    // P(θ) = |1 + e^{-jβ}|²/4, β at 90° = π → response = 0.
    const r = arrayResponse(2, 0.5, deg(90), deg(0), 1);
    expect(r).toBeCloseTo(0, 10);
  });

  it('two closely matched angles give nearly full response (broad mainlobe)', () => {
    const r = arrayResponse(4, 0.5, deg(2), deg(0), 1);
    expect(r).toBeGreaterThan(0.9);
  });

  it('ambiguity returns for d > λ/2: a grating lobe reaches full power away from the source', () => {
    // N=2, d=λ, source broadside. Grating lobe at endfire (sinθ=±1): full response again.
    const main = arrayResponse(2, 1.0, deg(0), deg(0), 1);
    const grating = arrayResponse(2, 1.0, deg(90), deg(0), 1);
    expect(main).toBeCloseTo(1, 10);
    expect(grating).toBeCloseTo(1, 8);
  });
});

describe('beamPattern sampling', () => {
  it('spans broadside-symmetric angles and is maximal at the source', () => {
    const { anglesRad, power } = beamPattern(8, 0.5, deg(30), 1, 181);
    expect(anglesRad[0]).toBeCloseTo(-Math.PI / 2, 12);
    expect(anglesRad[anglesRad.length - 1]).toBeCloseTo(Math.PI / 2, 12);
    // Angle of the peak should be ~30°.
    let peakIdx = 0;
    for (let i = 1; i < power.length; i++) if (power[i] > power[peakIdx]) peakIdx = i;
    expect((anglesRad[peakIdx] * 180) / Math.PI).toBeCloseTo(30, 0);
  });
});

describe('toDb', () => {
  it('maps 1 → 0 dB and floors non-positive power', () => {
    expect(toDb(1)).toBeCloseTo(0, 12);
    expect(toDb(0.1)).toBeCloseTo(-10, 12);
    expect(toDb(0, -40)).toBe(-40);
  });
});
