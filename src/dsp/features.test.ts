import { describe, it, expect } from 'vitest';
import type { Complex } from './complex';
import { MODULATORS } from './modulation';
import { gaussianNoise } from './random';
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

const addNoise = (signal: Complex[], seed: number): Complex[] => {
  const sigma = signal.reduce((s, c) => s + Math.hypot(c.re, c.im), 0) / signal.length / 14;
  const ni = gaussianNoise(signal.length, sigma, seed);
  const nq = gaussianNoise(signal.length, sigma, seed + 1);
  return signal.map((s, i) => ({ re: s.re + ni[i], im: s.im + nq[i] }));
};

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

  it('noise-matched prototypes classify noisy schemes (incl. MSK vs FSK)', () => {
    // Prototypes averaged over noisy realizations, as the classifier module does.
    const noisyProto: Record<string, Features> = Object.fromEntries(
      Object.entries(MODULATORS).map(([name, m]) => {
        const sig = m.modulate(bits, SPS).signal;
        const reps = Array.from({ length: 6 }, (_, k) =>
          extractFeatures(addNoise(sig, 1000 + k * 13))
        );
        const mean = (sel: (f: Features) => number) =>
          reps.reduce((s, f) => s + sel(f), 0) / reps.length;
        return [
          name,
          {
            envelopeCv: mean((f) => f.envelopeCv),
            spectralSpread: mean((f) => f.spectralSpread),
            qFraction: mean((f) => f.qFraction),
          },
        ];
      })
    );
    // Every scheme, across several noisy realizations, classifies as itself.
    for (const [name, m] of Object.entries(MODULATORS)) {
      const sig = m.modulate(bits, SPS).signal;
      for (let seed = 1; seed <= 5; seed++) {
        expect(classify(extractFeatures(addNoise(sig, seed * 7)), noisyProto)).toBe(name);
      }
    }
  });
});
