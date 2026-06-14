import { describe, it, expect } from 'vitest';
import { firLowpass, firResponseDb } from './filter';

describe('FIR low-pass design', () => {
  it('has unit DC gain and is symmetric', () => {
    const h = firLowpass(0.15, 31);
    expect(h.reduce((s, t) => s + t, 0)).toBeCloseTo(1, 9); // Σh = DC gain = 1
    for (let i = 0; i < h.length; i++) expect(h[i]).toBeCloseTo(h[h.length - 1 - i], 9);
  });

  it('passes DC at 0 dB and rejects the stopband', () => {
    const resp = firResponseDb(firLowpass(0.1, 63), 256);
    const dc = resp[128]; // f = 0 (index nFreqs/2)
    expect(dc).toBeCloseTo(0, 6);
    const farIdx = Math.round((0.4 + 0.5) * 256); // f = 0.4, well into the stopband
    expect(resp[farIdx]).toBeLessThan(-30);
  });
});
