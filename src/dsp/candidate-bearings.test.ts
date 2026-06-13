import { describe, it, expect } from 'vitest';
import { phaseDifference, wrapPhase, candidateBearings } from './phase';

const deg = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

describe('candidateBearings (ambiguity resolution)', () => {
  it('returns a single bearing when d ≤ λ/2 (unambiguous)', () => {
    const d = 0.5;
    const lambda = 1;
    const theta = deg(35);
    const wrapped = wrapPhase(phaseDifference(d, theta, lambda));
    const cands = candidateBearings(wrapped, d, lambda);
    expect(cands).toHaveLength(1);
    expect(toDeg(cands[0])).toBeCloseTo(35, 6);
  });

  it('includes the true bearing among several candidates when d > λ/2', () => {
    const d = 1.5; // > λ/2 → ambiguous
    const lambda = 1;
    const theta = deg(10);
    const wrapped = wrapPhase(phaseDifference(d, theta, lambda));
    const cands = candidateBearings(wrapped, d, lambda).map(toDeg);
    expect(cands.length).toBeGreaterThan(1);
    expect(cands.some((c) => Math.abs(c - 10) < 1e-6)).toBe(true);
  });

  it('every returned candidate reproduces the same wrapped phase', () => {
    const d = 2;
    const lambda = 1;
    const wrapped = wrapPhase(phaseDifference(d, deg(-22), lambda));
    for (const theta of candidateBearings(wrapped, d, lambda)) {
      expect(wrapPhase(phaseDifference(d, theta, lambda))).toBeCloseTo(wrapped, 9);
    }
  });
});
