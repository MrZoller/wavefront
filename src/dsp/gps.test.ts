import { describe, it, expect } from 'vitest';
import { prnReceived, acquisitionSurface, acquisitionPeak, codePhaseProfile } from './gps';
import { fftShiftedBin } from './fft';
import { pnCode, processingGainDb } from './waveforms';

const L = 64; // synthetic PRN code length (chips) — also the code-phase axis extent

describe('GPS sub-noise signal model + acquisition search', () => {
  it('returns periods × L complex samples', () => {
    const code = pnCode(L, 1);
    const rx = prnReceived(code, { codePhase: 0, doppler: 0, snrDb: Infinity, periods: 8 });
    expect(rx).toHaveLength(L * 8);
  });

  it('lands the acquisition peak at the true (code phase, Doppler) bin — noiseless', () => {
    const periods = 16;
    const code = pnCode(L, 12345);
    const codePhase = 21;
    const m = 2;
    const doppler = m / (periods * L); // exactly on a Doppler bin (no spectral leakage)
    const rx = prnReceived(code, { codePhase, doppler, snrDb: Infinity, periods });
    const peak = acquisitionPeak(acquisitionSurface(rx, code, periods));
    expect(peak.codePhase).toBe(codePhase);
    expect(peak.dopplerBin).toBe(fftShiftedBin(doppler * L, periods));
  });

  it('places a zero-Doppler (stationary) signal on the centre Doppler row', () => {
    const periods = 16;
    const code = pnCode(L, 7);
    const rx = prnReceived(code, { codePhase: 40, doppler: 0, snrDb: Infinity, periods });
    const peak = acquisitionPeak(acquisitionSurface(rx, code, periods));
    expect(peak.codePhase).toBe(40);
    expect(peak.dopplerBin).toBe(periods / 2); // fftShift puts DC in the middle
  });

  it('separates two code phases — the surface peak tracks where the code lines up', () => {
    const periods = 8;
    const code = pnCode(L, 55);
    const a = acquisitionPeak(
      acquisitionSurface(
        prnReceived(code, { codePhase: 9, doppler: 0, snrDb: Infinity, periods }),
        code,
        periods
      )
    );
    const b = acquisitionPeak(
      acquisitionSurface(
        prnReceived(code, { codePhase: 48, doppler: 0, snrDb: Infinity, periods }),
        code,
        periods
      )
    );
    expect(a.codePhase).toBe(9);
    expect(b.codePhase).toBe(48);
  });
});

describe('despreading = the spread-spectrum processing gain, run to acquire', () => {
  it('one despread code period lifts the peak to Σ|code|² = L, i.e. 10·log10(L) dB of gain', () => {
    const code = pnCode(L, 99);
    const rx = prnReceived(code, { codePhase: 10, doppler: 0, snrDb: Infinity, periods: 1 });
    const profile = codePhaseProfile(rx, code, 0, 1);
    expect(profile.indexOf(Math.max(...profile))).toBe(10);
    expect(profile[10]).toBeCloseTo(L, 6); // every chip lines up: the despread peak is the code energy
    // The dB statement of that gain is exactly the Spread Spectrum module's processing gain.
    expect(processingGainDb(L)).toBeCloseTo(10 * Math.log10(L), 12);
  });

  it('coherent integration over P periods multiplies the despread peak by P', () => {
    const code = pnCode(L, 3);
    const periods = 8;
    const rx = prnReceived(code, { codePhase: 5, doppler: 0, snrDb: Infinity, periods });
    const profile = codePhaseProfile(rx, code, 0, periods);
    expect(profile.indexOf(Math.max(...profile))).toBe(5);
    expect(profile[5]).toBeCloseTo(L * periods, 4); // longer integration ⇒ taller peak ⇒ more gain
  });
});

describe('recovering a signal from below the noise floor', () => {
  const code = pnCode(L, 2024);
  const codePhase = 33;

  it('acquires a signal 15 dB BELOW the noise once enough code periods are integrated', () => {
    // snrDb = −15 ⇒ the noise has ~32× the signal's power: the received samples look like pure noise.
    const rx = prnReceived(code, { codePhase, doppler: 0, snrDb: -15, periods: 16, seed: 2024 });
    const peak = acquisitionPeak(acquisitionSurface(rx, code, 16));
    expect(peak.codePhase).toBe(codePhase);
    expect(peak.dopplerBin).toBe(fftShiftedBin(0, 16)); // stationary ⇒ centre Doppler row
  });

  it('lifts the peak further out of the noise as integration grows (more processing gain)', () => {
    // Peak-to-mean prominence of the surface: the despread peak grows ∝ periods while the noise floor
    // grows only ∝ √periods, so longer integration lifts the peak further above the noise.
    const prominence = (periods: number) => {
      const rx = prnReceived(code, { codePhase, doppler: 0, snrDb: -12, periods, seed: 2024 });
      const surface = acquisitionSurface(rx, code, periods);
      const peak = acquisitionPeak(surface).value;
      let sum = 0;
      let count = 0;
      for (const row of surface) {
        for (const v of row) {
          sum += v;
          count++;
        }
      }
      return peak / (sum / count);
    };
    expect(prominence(16)).toBeGreaterThan(prominence(4));
  });

  it('vanishes below a deep enough negative SNR even at full integration', () => {
    const rx = prnReceived(code, { codePhase, doppler: 0, snrDb: -30, periods: 16, seed: 2024 });
    expect(acquisitionPeak(acquisitionSurface(rx, code, 16)).codePhase).not.toBe(codePhase);
  });
});
