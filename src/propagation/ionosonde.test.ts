import { describe, it, expect } from 'vitest';
import { SPEED_OF_LIGHT_M_S } from './constants';
import { mufMHz } from './skywave';
import {
  echoDelaySecondsForHeight,
  ionogramTrace,
  LAYER_PEAK_HEIGHT_KM,
  LAYER_SEMI_THICKNESS_KM,
  reflectsVertical,
  virtualHeightKm,
  virtualHeightKmFromDelay,
  type IonoLayer,
} from './ionosonde';

const LAYER: IonoLayer = {
  criticalFreqMHz: 8,
  peakHeightKm: LAYER_PEAK_HEIGHT_KM,
  semiThicknessKm: LAYER_SEMI_THICKNESS_KM,
};
const BASE_KM = LAYER_PEAK_HEIGHT_KM - LAYER_SEMI_THICKNESS_KM;

describe('echo-delay ranging, pointed up (h = c·t/2)', () => {
  it('turns a round-trip delay into a virtual height with h = c·t/2', () => {
    // 2 ms round trip → c·t/2, in km. (The radar echo-delay range primitive, aimed at the sky.)
    const expectedKm = ((SPEED_OF_LIGHT_M_S / 1000) * 0.002) / 2;
    expect(virtualHeightKmFromDelay(0.002)).toBeCloseTo(expectedKm, 9);
    expect(virtualHeightKmFromDelay(0.002)).toBeCloseTo(299.792458, 6);
    expect(virtualHeightKmFromDelay(0)).toBe(0);
  });

  it('round-trips height ↔ delay (the two are inverses)', () => {
    for (const h of [90, 200, 300, 450, 600]) {
      expect(virtualHeightKmFromDelay(echoDelaySecondsForHeight(h))).toBeCloseTo(h, 9);
    }
    // An F-region virtual height of ~300 km returns after ~2 ms, the textbook order of magnitude.
    expect(echoDelaySecondsForHeight(300) * 1000).toBeCloseTo(2.0014, 3);
  });
});

describe('vertical reflect-vs-penetrate (the critical-frequency cutoff)', () => {
  it('reflects below the critical frequency and penetrates at or above it', () => {
    expect(reflectsVertical(5, 8)).toBe(true);
    expect(reflectsVertical(7.9, 8)).toBe(true);
    expect(reflectsVertical(8, 8)).toBe(false); // at foF2 the height is infinite — no echo
    expect(reflectsVertical(12, 8)).toBe(false); // punches through to space
  });
});

describe('virtual height vs frequency (single parabolic layer)', () => {
  it('starts at the layer base at low frequency', () => {
    // As f → 0 the cusp term vanishes, leaving the base of the layer (peak − semiThickness).
    expect(virtualHeightKm(0, LAYER)).toBeCloseTo(BASE_KM, 9);
    expect(virtualHeightKm(0.01, LAYER)).toBeCloseTo(BASE_KM, 2);
    expect(virtualHeightKm(0.01, LAYER)!).toBeGreaterThan(BASE_KM); // already climbing
  });

  it('rises monotonically and runs away (diverges) as the frequency approaches foF2', () => {
    const fc = LAYER.criticalFreqMHz;
    const samples = [1, 2, 3, 4, 5, 6, 7, 7.5, 7.9, 7.99].map((f) => virtualHeightKm(f, LAYER)!);
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThan(samples[i - 1]); // strictly increasing
    }
    // Divergence is logarithmic but unbounded: each tenfold-closer approach to the cutoff climbs
    // higher, well past any fixed multiple of the base height — the ionogram cusp.
    const near = [1e-3, 1e-6, 1e-9, 1e-12].map((d) => virtualHeightKm(fc - d, LAYER)!);
    for (let i = 1; i < near.length; i++) {
      expect(near[i]).toBeGreaterThan(near[i - 1]);
    }
    expect(near[near.length - 1]).toBeGreaterThan(7 * BASE_KM);
  });

  it('returns null at and above the critical frequency (no echo)', () => {
    expect(virtualHeightKm(8, LAYER)).toBeNull();
    expect(virtualHeightKm(8.5, LAYER)).toBeNull();
    expect(virtualHeightKm(20, LAYER)).toBeNull();
  });

  it('shifts the whole trace when the layer peak height moves', () => {
    const higher: IonoLayer = { ...LAYER, peakHeightKm: LAYER.peakHeightKm + 50 };
    expect(virtualHeightKm(4, higher)!).toBeCloseTo(virtualHeightKm(4, LAYER)! + 50, 9);
  });
});

describe('ionogram assembly (the sweep)', () => {
  const trace = ionogramTrace(LAYER, { startMHz: 1, stopMHz: 12, steps: 220 });

  it('sweeps in ascending frequency with virtual height climbing', () => {
    expect(trace.length).toBeGreaterThan(10);
    for (let i = 1; i < trace.length; i++) {
      expect(trace[i].freqMHz).toBeGreaterThan(trace[i - 1].freqMHz);
      expect(trace[i].virtualHeightKm).toBeGreaterThan(trace[i - 1].virtualHeightKm);
    }
  });

  it('cuts the trace off at the critical frequency — no echo at or above foF2', () => {
    expect(trace.every((p) => p.freqMHz < LAYER.criticalFreqMHz)).toBe(true);
    // The last surviving echo sits just below foF2 (the sweep reaches up to the cutoff).
    const last = trace[trace.length - 1];
    expect(last.freqMHz).toBeLessThan(LAYER.criticalFreqMHz);
    expect(LAYER.criticalFreqMHz - last.freqMHz).toBeLessThan(0.1);
  });

  it('recovers a lower cutoff at night (a weaker, lower-foF2 layer)', () => {
    const night = ionogramTrace(
      { ...LAYER, criticalFreqMHz: 3 },
      { startMHz: 1, stopMHz: 12, steps: 220 }
    );
    expect(night.every((p) => p.freqMHz < 3)).toBe(true);
    expect(Math.max(...night.map((p) => p.freqMHz))).toBeLessThan(
      Math.max(...trace.map((p) => p.freqMHz))
    );
  });

  it('trims the runaway tail at a display ceiling', () => {
    // A fine sweep so the grid actually lands on the runaway tail near the cutoff.
    const sweep = { startMHz: 1, stopMHz: 12, steps: 4000 };
    const ceiling = 600;
    const full = ionogramTrace(LAYER, sweep);
    const capped = ionogramTrace(LAYER, { ...sweep, maxHeightKm: ceiling });
    const overCeiling = full.filter((p) => p.virtualHeightKm > ceiling).length;
    expect(overCeiling).toBeGreaterThan(0); // the tail really is sampled at this resolution
    expect(capped.every((p) => p.virtualHeightKm <= ceiling)).toBe(true);
    expect(capped.length).toBe(full.length - overCeiling); // exactly the over-ceiling points dropped
  });
});

describe('closing the loop: foF2 → MUF (reusing the skywave secant law)', () => {
  it('reads foF2 straight off the vertical sounding, and the secant law scales it for an oblique path', () => {
    const fof2 = LAYER.criticalFreqMHz; // the cutoff the ionogram measures
    // Vertical incidence: the MUF is just foF2 — the quantity the ionogram read off directly.
    expect(mufMHz(fof2, 0)).toBeCloseTo(fof2, 9);
    // Oblique: MUF = foF2 · sec φ, consistent with the HF Skywave module's secant law.
    for (const phi of [30, 45, 60]) {
      expect(mufMHz(fof2, phi)).toBeCloseTo(fof2 / Math.cos((phi * Math.PI) / 180), 9);
    }
    expect(mufMHz(fof2, 60)).toBeCloseTo(2 * fof2, 6); // sec 60° = 2
  });
});
