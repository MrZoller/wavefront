import { describe, it, expect } from 'vitest';
import {
  binSpacing,
  frequencyResolution,
  nextPow2,
  oneSidedBinFreqs,
  paddedMagnitudeSpectrum,
  prominentPeakCount,
  toneCapture,
  zeroPad,
} from './binning';

describe('nextPow2', () => {
  it('rounds up to the next power of two', () => {
    expect(nextPow2(16)).toBe(16);
    expect(nextPow2(17)).toBe(32);
    expect(nextPow2(24)).toBe(32);
    expect(nextPow2(96)).toBe(128);
  });
});

describe('zeroPad', () => {
  it('pads to nFft, keeping the capture and zero-filling the rest', () => {
    const sig = toneCapture([200], 16, 1000);
    const padded = zeroPad(sig, 64);
    expect(padded).toHaveLength(64);
    for (let i = 0; i < 16; i++) {
      expect(padded[i].re).toBe(sig[i].re);
      expect(padded[i].im).toBe(sig[i].im);
    }
    for (let i = 16; i < 64; i++) {
      expect(padded[i]).toEqual({ re: 0, im: 0 });
    }
  });

  it('refuses to "pad" to fewer points than the capture', () => {
    expect(() => zeroPad(toneCapture([200], 64, 1000), 32)).toThrow(/N_fft must be/i);
  });
});

describe('bin spacing vs. resolution — the two different Ns', () => {
  const fs = 1000;

  it('bin spacing is fs/N_fft, and one-sided bins grow with the zero-pad amount (the visible "more dots")', () => {
    expect(binSpacing(fs, 64)).toBeCloseTo(1000 / 64, 9);
    expect(binSpacing(fs, 1024)).toBeCloseTo(1000 / 1024, 9);
    // A one-sided spectrum has N_fft/2 + 1 bins; padding the SAME 16-sample capture draws more of
    // them, evenly spaced by fs/N_fft.
    const sig = toneCapture([200], 16, fs);
    expect(paddedMagnitudeSpectrum(sig, 64)).toHaveLength(33);
    expect(paddedMagnitudeSpectrum(sig, 1024)).toHaveLength(513);
    const freqs = oneSidedBinFreqs(64, fs);
    expect(freqs[0]).toBe(0);
    expect(freqs[1]).toBeCloseTo(binSpacing(fs, 64), 9);
    expect(freqs.at(-1)).toBeCloseTo(fs / 2, 9);
  });

  it('resolution is fs/N_real — a property of the capture, independent of the zero-pad amount', () => {
    expect(frequencyResolution(fs, 32)).toBeCloseTo(1000 / 32, 9);
    expect(frequencyResolution(fs, 128)).toBeCloseTo(1000 / 128, 9);
  });
});

describe('zero-padding interpolates — same spectrum, more dots', () => {
  it('reproduces every original bin exactly and inserts new samples between them', () => {
    // Doubling N_fft samples the SAME underlying DTFT (the zeros add nothing) at twice as many
    // points, so every bin of the smaller transform reappears, untouched, as an even-indexed bin of
    // the larger one. Padding interpolates between existing bins; it can't move or change them.
    const sig = toneCapture([200, 230], 16, 1000);
    const coarse = paddedMagnitudeSpectrum(sig, 256);
    const fine = paddedMagnitudeSpectrum(sig, 512);
    for (let k = 0; k < coarse.length; k++) {
      expect(fine[2 * k]).toBeCloseTo(coarse[k], 9);
    }
  });
});

describe('prominentPeakCount', () => {
  it('counts two lobes only when a real valley separates them', () => {
    expect(prominentPeakCount([0, 1, 0, 0, 0])).toBe(1);
    expect(prominentPeakCount([0, 1, 0, 1, 0])).toBe(2); // deep valley (0) → two
    expect(prominentPeakCount([0, 0.2, 1, 0.1, 1, 0.2, 0])).toBe(2); // notch to 0.1 → two
    expect(prominentPeakCount([0, 0.2, 1, 0.6, 1, 0.2, 0])).toBe(1); // dimple to 0.6 → one broad lobe
  });

  it('ignores sub-threshold ripple and counts a flat top once', () => {
    expect(prominentPeakCount([0, 1, 0.3, 0.45, 0.2, 0])).toBe(1); // the 0.45 bump is below 0.5·peak
    expect(prominentPeakCount([0, 1, 1, 0])).toBe(1);
  });
});

/**
 * The whole point of the module, machine-proved: more zero-padding cannot resolve two close tones —
 * only a longer capture can. Same spirit as the convolution module's cross-link proof.
 */
describe('more bins ≠ more resolution; more data is', () => {
  const fs = 1000;
  const f1 = 200;
  const f2 = 230; // two tones 30 Hz apart
  const sep = f2 - f1;

  const peaksAt = (nReal: number, nFft: number) =>
    prominentPeakCount(paddedMagnitudeSpectrum(toneCapture([f1, f2], nReal, fs), nFft));

  it('leaves a too-close pair merged no matter how far you crank the bins', () => {
    const nReal = 16; // resolution = fs/16 ≈ 62.5 Hz, far wider than the 30 Hz separation → merged
    expect(frequencyResolution(fs, nReal)).toBeGreaterThan(sep);
    for (const nFft of [32, 64, 128, 256, 512, 1024, 2048, 4096]) {
      expect(peaksAt(nReal, nFft), `nFft=${nFft}`).toBe(1);
    }
  });

  it('splits the same pair once the capture is long enough — more data, not more bins', () => {
    const nReal = 64; // resolution = fs/64 ≈ 15.6 Hz < 30 Hz → resolvable
    expect(frequencyResolution(fs, nReal)).toBeLessThan(sep);
    expect(peaksAt(nReal, 4096)).toBe(2); // generously padded → two clean peaks
    // And it was the data, not the padding: even a modest transform already resolves them, because
    // the resolution rode in with the longer capture.
    expect(peaksAt(nReal, 256)).toBe(2);
  });
});
