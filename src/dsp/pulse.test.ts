import { describe, it, expect } from 'vitest';
import { raisedCosine, rootRaisedCosine, upsample, convolve } from './pulse';

describe('raised cosine (Nyquist ISI-free)', () => {
  it('peaks at 1 in the center and is ~0 at every nonzero integer symbol offset', () => {
    const sps = 8;
    const span = 8;
    const taps = raisedCosine(0.25, span, sps);
    const center = (span * sps) / 2;
    expect(taps[center]).toBeCloseTo(1, 9);
    for (let k = 1; k <= span / 2 - 1; k++) {
      expect(Math.abs(taps[center + k * sps])).toBeLessThan(1e-9);
      expect(Math.abs(taps[center - k * sps])).toBeLessThan(1e-9);
    }
  });
});

describe('root raised cosine', () => {
  it('has unit energy', () => {
    const taps = rootRaisedCosine(0.25, 8, 8);
    const energy = taps.reduce((s, h) => s + h * h, 0);
    expect(energy).toBeCloseTo(1, 9);
  });

  it('RRC ⊛ RRC reproduces a Nyquist (ISI-free) pulse at symbol-spaced samples', () => {
    const sps = 8;
    const span = 8;
    const rrc = rootRaisedCosine(0.25, span, sps);
    const rc = convolve(rrc, rrc); // combined TX+RX response
    const center = (rc.length - 1) / 2;
    const peak = rc[center];
    // ISI-free: combined response is ~0 at nonzero integer symbol offsets relative to its peak.
    for (let k = 1; k <= span / 2 - 1; k++) {
      expect(Math.abs(rc[center + k * sps] / peak)).toBeLessThan(1e-2);
    }
  });

  it('is symmetric', () => {
    const taps = rootRaisedCosine(0.35, 6, 6);
    for (let i = 0; i < taps.length; i++) {
      expect(taps[i]).toBeCloseTo(taps[taps.length - 1 - i], 9);
    }
  });
});

describe('upsample / convolve', () => {
  it('upsample zero-stuffs between symbols', () => {
    expect(upsample([1, -1], 3)).toEqual([1, 0, 0, -1, 0, 0]);
  });

  it('convolve matches a hand calc', () => {
    // [1,2,3] ⊛ [1,1] = [1,3,5,3]
    expect(convolve([1, 2, 3], [1, 1])).toEqual([1, 3, 5, 3]);
  });

  it('a single upsampled impulse reproduces the pulse shape', () => {
    const sps = 4;
    const h = raisedCosine(0.5, 4, sps);
    const wave = convolve(upsample([1], sps), h);
    expect(Math.max(...wave)).toBeCloseTo(1, 9); // peak of the lone RC pulse
  });
});
