import { describe, it, expect } from 'vitest';
import {
  echoPulses,
  pulseCompress,
  rangeDopplerMap,
  dopplerBin,
  compressionRatio,
  timeBandwidthProduct,
} from './radar';
import { chirp } from './waveforms';

describe('radar echo model + pulse compression', () => {
  it('compresses a single echo to a peak at the target range bin', () => {
    const M = 64;
    const rangeBins = 64;
    const tx = chirp(M, -0.25, 0.25);
    const target = { rangeBin: 21, doppler: 0 };
    const rx = echoPulses(tx, [target], 1, M + rangeBins);
    const profile = pulseCompress(rx[0], tx, rangeBins);
    const peak = profile.indexOf(Math.max(...profile));
    expect(peak).toBe(target.rangeBin);
  });

  it('matched-filter peak magnitude equals the chirp energy Σ|tx|² (≈ M for a unit chirp)', () => {
    const M = 48;
    const tx = chirp(M, -0.3, 0.3);
    const rx = echoPulses(tx, [{ rangeBin: 10, doppler: 0 }], 1, M + 32);
    const profile = pulseCompress(rx[0], tx, 32);
    const energy = tx.reduce((s, v) => s + (v.re * v.re + v.im * v.im), 0);
    expect(Math.max(...profile)).toBeCloseTo(energy, 6);
    expect(energy).toBeCloseTo(M, 6); // unit-magnitude chirp ⇒ energy = sample count
  });

  it('recovers the range bin even at low SNR (matched-filter processing gain)', () => {
    const M = 64;
    const rangeBins = 64;
    const tx = chirp(M, -0.3, 0.3);
    const rx = echoPulses(tx, [{ rangeBin: 40, doppler: 0 }], 1, M + rangeBins, 4.0, 99);
    const profile = pulseCompress(rx[0], tx, rangeBins);
    expect(profile.indexOf(Math.max(...profile))).toBe(40);
  });

  it('superposes two targets at their two range bins', () => {
    const M = 64;
    const rangeBins = 64;
    const tx = chirp(M, -0.3, 0.3);
    const rx = echoPulses(
      tx,
      [
        { rangeBin: 12, doppler: 0, amplitude: 1 },
        { rangeBin: 44, doppler: 0, amplitude: 1 },
      ],
      1,
      M + rangeBins
    );
    const profile = pulseCompress(rx[0], tx, rangeBins);
    // Both bins should clearly exceed the mid-gap floor.
    const gap = profile[28];
    expect(profile[12]).toBeGreaterThan(gap * 4);
    expect(profile[44]).toBeGreaterThan(gap * 4);
  });
});

describe('range-Doppler map assembly', () => {
  it('lands the peak at the target (range, Doppler) bin', () => {
    const M = 48;
    const rangeBins = 64;
    const nPulses = 32;
    const tx = chirp(M, -0.3, 0.3);
    const targetRange = 30;
    const f = 3 / nPulses; // exactly on a Doppler bin (no leakage)
    const rx = echoPulses(tx, [{ rangeBin: targetRange, doppler: f }], nPulses, M + rangeBins);
    const map = rangeDopplerMap(rx, tx, rangeBins); // rangeBins × nPulses

    // 2D argmax.
    let bestR = 0;
    let bestD = 0;
    let bestV = -Infinity;
    for (let r = 0; r < map.length; r++) {
      for (let d = 0; d < map[r].length; d++) {
        if (map[r][d] > bestV) {
          bestV = map[r][d];
          bestR = r;
          bestD = d;
        }
      }
    }
    expect(bestR).toBe(targetRange);
    expect(bestD).toBe(dopplerBin(f, nPulses));
  });

  it('places a stationary target on the zero-Doppler (center) row', () => {
    const nPulses = 16;
    expect(dopplerBin(0, nPulses)).toBe(nPulses / 2);
  });

  it('separates two targets at different velocities, same range', () => {
    const M = 48;
    const rangeBins = 48;
    const nPulses = 32;
    const tx = chirp(M, -0.3, 0.3);
    const r0 = 20;
    const fa = 2 / nPulses;
    const fb = -5 / nPulses;
    const rx = echoPulses(
      tx,
      [
        { rangeBin: r0, doppler: fa },
        { rangeBin: r0, doppler: fb },
      ],
      nPulses,
      M + rangeBins
    );
    const map = rangeDopplerMap(rx, tx, rangeBins);
    const row = map[r0];
    const top = [...row.keys()].sort((a, b) => row[b] - row[a]);
    expect(new Set(top.slice(0, 2))).toEqual(
      new Set([dopplerBin(fa, nPulses), dopplerBin(fb, nPulses)])
    );
  });
});

describe('time-bandwidth product & compression gain', () => {
  it('TBP = duration × swept bandwidth', () => {
    expect(timeBandwidthProduct(256, 0.25)).toBeCloseTo(64, 12);
  });

  it('compression ratio of an LFM ≈ its time-bandwidth product', () => {
    const M = 256;
    const bw = 0.125; // sweep ±0.125 ⇒ swept bandwidth B = 0.25 cyc/sample
    const B = 2 * bw;
    const bins = 32; // an interior peak (bin 16) with room on both sides for the main-lobe width
    const tx = chirp(M, -bw, bw);
    const rx = echoPulses(tx, [{ rangeBin: 16, doppler: 0 }], 1, M + bins);
    const profile = pulseCompress(rx[0], tx, bins);
    const ratio = compressionRatio(profile, M);
    const tbp = timeBandwidthProduct(M, B); // = 64
    // The textbook relation is approximate (the −3 dB main-lobe width ≈ 0.886/B); allow 40%.
    expect(Math.abs(ratio - tbp) / tbp).toBeLessThan(0.4);
  });

  it('a wider sweep (larger TBP) compresses to a higher ratio', () => {
    const M = 256;
    const bins = 32;
    const narrow = chirp(M, -0.06, 0.06);
    const wide = chirp(M, -0.2, 0.2);
    const pn = pulseCompress(
      echoPulses(narrow, [{ rangeBin: 16, doppler: 0 }], 1, M + bins)[0],
      narrow,
      bins
    );
    const pw = pulseCompress(
      echoPulses(wide, [{ rangeBin: 16, doppler: 0 }], 1, M + bins)[0],
      wide,
      bins
    );
    expect(compressionRatio(pw, M)).toBeGreaterThan(compressionRatio(pn, M));
  });
});
