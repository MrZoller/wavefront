import { describe, it, expect } from 'vitest';
import type { Complex } from './complex';
import { windowFn } from './window';
import { magnitudeSpectrumDb, magnitudeSpectrumLinear, toDb, spectrogram } from './spectrum';

const tone = (n: number, cyclesPerN: number): Complex[] =>
  Array.from({ length: n }, (_, k) => ({
    re: Math.cos((2 * Math.PI * cyclesPerN * k) / n),
    im: Math.sin((2 * Math.PI * cyclesPerN * k) / n),
  }));

describe('window functions', () => {
  it('hann starts and ends at zero', () => {
    const w = windowFn('hann', 16);
    expect(w[0]).toBeCloseTo(0, 9);
    expect(w[w.length - 1]).toBeCloseTo(0, 9);
  });

  it('rectangular is all ones; blackman peaks near the center', () => {
    expect(windowFn('rectangular', 8).every((v) => v === 1)).toBe(true);
    const b = windowFn('blackman', 65);
    expect(Math.max(...b)).toBeCloseTo(b[32], 9);
  });
});

describe('magnitude spectrum', () => {
  it('peaks at the positive-frequency bin of a tone (0 dB) and is centered', () => {
    const spec = magnitudeSpectrumDb(tone(64, 8), 'rectangular');
    const peakIdx = spec.indexOf(Math.max(...spec));
    const center = spec.length / 2;
    expect(spec[peakIdx]).toBeCloseTo(0, 6); // peak normalized to 0 dB
    expect(peakIdx).toBeGreaterThan(center); // +8 cycles ⇒ right of DC after fftShift
  });
});

describe('shared dB reference', () => {
  it('a shared ref preserves the level difference between two spectra', () => {
    // Same tone at two amplitudes: self-normalized both peak at 0 dB; shared ref shows −6 dB.
    const big = tone(64, 8);
    const small = tone(64, 8).map((c) => ({ re: c.re * 0.5, im: c.im * 0.5 }));
    const bigLin = magnitudeSpectrumLinear(big, 'rectangular');
    const smallLin = magnitudeSpectrumLinear(small, 'rectangular');
    const ref = Math.max(...bigLin);
    expect(Math.max(...toDb(bigLin, -80, ref))).toBeCloseTo(0, 6);
    expect(Math.max(...toDb(smallLin, -80, ref))).toBeCloseTo(-6.02, 1); // 20·log10(0.5)
  });
});

describe('spectrogram', () => {
  it('produces frames of the FFT size with a 0 dB peak', () => {
    const sg = spectrogram(tone(512, 64), 128, 64, 'hann');
    expect(sg.length).toBeGreaterThan(1);
    expect(sg[0]).toHaveLength(128);
    const globalPeak = Math.max(...sg.flat());
    expect(globalPeak).toBeCloseTo(0, 6);
  });
});
