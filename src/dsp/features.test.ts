import { describe, it, expect } from 'vitest';
import { MODULATORS } from './modulation';
import { extractFeatures, classify, type Features } from './features';

const SPS = 8;
const bits = Array.from({ length: 400 }, (_, i) => (i * 1103515245 + 12345) >>> 16) // cheap LCG
  .map((v) => v & 1);

const prototypes: Record<string, Features> = Object.fromEntries(
  Object.entries(MODULATORS).map(([name, m]) => [
    name,
    extractFeatures(m.modulate(bits, SPS).signal),
  ])
);

describe('modulation features', () => {
  it('BPSK has almost no Q-rail energy; QPSK is balanced', () => {
    expect(prototypes.BPSK.qFraction).toBeLessThan(0.05);
    expect(prototypes.QPSK.qFraction).toBeGreaterThan(0.3);
  });

  it('FSK/MSK are near constant-envelope (low CV); 16-QAM varies more', () => {
    expect(prototypes.FSK.envelopeCv).toBeLessThan(0.05);
    expect(prototypes.MSK.envelopeCv).toBeLessThan(0.05);
    expect(prototypes['16-QAM'].envelopeCv).toBeGreaterThan(prototypes.QPSK.envelopeCv);
  });

  it('classifies each clean scheme as itself', () => {
    for (const [name, m] of Object.entries(MODULATORS)) {
      const f = extractFeatures(m.modulate(bits, SPS).signal);
      expect(classify(f, prototypes)).toBe(name);
    }
  });
});
