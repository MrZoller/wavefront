import { describe, it, expect } from 'vitest';
import {
  pathLengthDifference,
  phaseDifference,
  isUnambiguous,
  wrapPhase,
  bearingFromPhase,
} from './phase';

describe('two-element phase geometry', () => {
  it('no extra path or phase at broadside (θ=0)', () => {
    expect(pathLengthDifference(0.5, 0)).toBeCloseTo(0, 12);
    expect(phaseDifference(0.5, 0, 1)).toBeCloseTo(0, 12);
  });

  it('extra path is d·sin(θ)', () => {
    expect(pathLengthDifference(2, Math.PI / 6)).toBeCloseTo(2 * 0.5, 12); // sin30°=0.5
    expect(pathLengthDifference(1, Math.PI / 2)).toBeCloseTo(1, 12); // endfire
  });

  it('half-wavelength baseline at endfire gives Δφ = π', () => {
    // d = λ/2, θ = 90° → Δφ = 2π·(λ/2)·1/λ = π
    expect(phaseDifference(0.5, Math.PI / 2, 1)).toBeCloseTo(Math.PI, 12);
  });

  it('flags ambiguity exactly at the d ≤ λ/2 boundary', () => {
    expect(isUnambiguous(0.5, 1)).toBe(true);
    expect(isUnambiguous(0.5001, 1)).toBe(false);
    expect(isUnambiguous(1, 1)).toBe(false);
  });

  it('wrapPhase maps into (−π, π]', () => {
    expect(wrapPhase(0)).toBeCloseTo(0, 12);
    expect(wrapPhase(Math.PI)).toBeCloseTo(Math.PI, 12);
    expect(wrapPhase(-Math.PI)).toBeCloseTo(Math.PI, 12); // −π wraps to +π
    expect(wrapPhase(1.5 * Math.PI)).toBeCloseTo(-0.5 * Math.PI, 12);
    expect(wrapPhase(3 * Math.PI)).toBeCloseTo(Math.PI, 12);
  });

  it('bearingFromPhase inverts phaseDifference within the unambiguous range', () => {
    const d = 0.5;
    const lambda = 1;
    for (const thetaDeg of [-60, -20, 0, 25, 50]) {
      const theta = (thetaDeg * Math.PI) / 180;
      const dphi = phaseDifference(d, theta, lambda);
      expect(bearingFromPhase(dphi, d, lambda)).toBeCloseTo(theta, 10);
    }
  });

  it('bearingFromPhase returns NaN when the phase implies |sin θ| > 1', () => {
    // d = λ/2: max valid |Δφ| is π. Anything beyond is geometrically impossible.
    expect(Number.isNaN(bearingFromPhase(2 * Math.PI, 0.5, 1))).toBe(true);
  });
});
