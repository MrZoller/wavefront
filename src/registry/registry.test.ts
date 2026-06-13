import { describe, it, expect } from 'vitest';
import { TRACKS, TRACK_BY_ID } from './tracks';
import { getModules, getModulesForTrack } from './registry';

describe('track registry', () => {
  it('defines the direction-finding track as the shipping v1 track', () => {
    const df = TRACK_BY_ID['direction-finding'];
    expect(df).toBeDefined();
    expect(df.status).toBe('shipping');
  });

  it('has unique track ids', () => {
    const ids = TRACKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every registered module belongs to a known track', () => {
    const known = new Set(TRACKS.map((t) => t.id));
    for (const m of getModules()) {
      expect(known.has(m.track)).toBe(true);
    }
  });

  it('getModulesForTrack only returns modules for that track', () => {
    for (const track of TRACKS) {
      for (const m of getModulesForTrack(track.id)) {
        expect(m.track).toBe(track.id);
      }
    }
  });
});
