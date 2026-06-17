import { describe, it, expect } from 'vitest';
import { BANDS, bandFor, modeLabel } from './bands';

describe('band lookup', () => {
  it('places representative frequencies in the right band', () => {
    expect(bandFor(100e3).abbr).toBe('LF');
    expect(bandFor(1e6).abbr).toBe('MF'); // AM broadcast
    expect(bandFor(10e6).abbr).toBe('HF'); // shortwave
    expect(bandFor(100e6).abbr).toBe('VHF'); // FM radio
    expect(bandFor(900e6).abbr).toBe('UHF'); // cellular
    expect(bandFor(10e9).abbr).toBe('SHF'); // microwave
  });

  it('treats the lower edge as inclusive and the upper as exclusive', () => {
    expect(bandFor(3e6).abbr).toBe('HF'); // 3 MHz is the bottom of HF, not the top of MF
    expect(bandFor(30e6 - 1).abbr).toBe('HF');
    expect(bandFor(30e6).abbr).toBe('VHF');
  });

  it('clamps frequencies that run off either end to the edge bands', () => {
    expect(bandFor(1).abbr).toBe('LF');
    expect(bandFor(1e12).abbr).toBe('SHF');
  });

  it('carries the dominant propagation mode the band is known for', () => {
    expect(bandFor(10e6).mode).toBe('skywave'); // HF → global skywave
    expect(bandFor(100e6).mode).toBe('line-of-sight'); // VHF → local LOS
    expect(bandFor(100e3).mode).toBe('ground-wave'); // LF → ground wave
  });

  it('is a contiguous, ascending ladder (no gaps or overlaps)', () => {
    for (let i = 1; i < BANDS.length; i++) {
      expect(BANDS[i].minHz).toBe(BANDS[i - 1].maxHz);
    }
  });

  it('labels modes in plain language', () => {
    expect(modeLabel('skywave')).toBe('skywave');
    expect(modeLabel('line-of-sight')).toBe('line-of-sight');
    expect(modeLabel('ground-wave')).toBe('ground wave');
  });
});
