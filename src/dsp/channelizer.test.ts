import { describe, it, expect } from 'vitest';
import { type Complex, magnitude } from './complex';
import { ddc, bareFftProto, pfbProto, channelize } from './channelizer';

const tone = (n: number, freq: number): Complex[] =>
  Array.from({ length: n }, (_, k) => ({
    re: Math.cos(2 * Math.PI * freq * k),
    im: Math.sin(2 * Math.PI * freq * k),
  }));

const power = (sig: Complex[]) => sig.reduce((s, c) => s + magnitude(c) ** 2, 0) / sig.length;

describe('digital downconverter', () => {
  it('mixes a tuned-to tone down to a steady DC baseband', () => {
    const out = ddc(tone(512, 0.3), 0.3, 4).slice(40); // drop the filter transient
    const meanMag = out.reduce((s, c) => s + magnitude(c), 0) / out.length;
    expect(meanMag).toBeCloseTo(1, 1); // tuned tone → unit-amplitude DC term
  });
});

describe('channelizer prototypes', () => {
  it('bare-FFT prototype is a normalized rectangle; PFB prototype spans the branches', () => {
    expect(bareFftProto(8).reduce((s, t) => s + t, 0)).toBeCloseTo(1, 9);
    expect(pfbProto(8, 6)).toHaveLength(8 * 6);
  });
});

describe('analysis filter bank', () => {
  const nCh = 8;

  it('routes a tone to its own channel', () => {
    const ch = channelize(tone(2048, 2 / nCh), nCh, pfbProto(nCh));
    const p = ch.map(power);
    expect(p.indexOf(Math.max(...p))).toBe(2);
  });

  it('PFB rejects an off-center tone in neighboring channels far better than the bare FFT', () => {
    // Off-center (between bins) is where a rectangular window leaks; on a bin center it wouldn't.
    const sig = tone(2048, 2.35 / nCh);
    const trim = (c: Complex[][]) => c.map((s) => s.slice(12)); // drop transients
    const fft = trim(channelize(sig, nCh, bareFftProto(nCh)));
    const pfb = trim(channelize(sig, nCh, pfbProto(nCh)));
    const leak = (c: Complex[][]) => power(c[3]) / power(c[2]); // neighbor / signal channel
    expect(leak(pfb)).toBeLessThan(leak(fft));
    expect(leak(pfb)).toBeLessThan(0.05); // strong adjacent-channel rejection
  });
});
