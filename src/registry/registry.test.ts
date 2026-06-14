import { describe, it, expect } from 'vitest';
import { TRACKS, TRACK_BY_ID } from './tracks';
import { getModules, getModulesForTrack, getTrackLayers } from './registry';
// Importing the barrel registers every module so the structural checks below see the real data.
import '@/modules';

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

/**
 * The navigation-structure contract: every track that has modules declares exactly one capstone,
 * names every layer it uses, and gives each module a unique, layer-respecting order. Backing it
 * with a test keeps the sidebar/landing structure honest as tracks grow.
 */
describe('track navigation structure', () => {
  const populatedTracks = TRACKS.filter((t) => getModulesForTrack(t.id).length > 0);

  it('has modules registered to assert against', () => {
    expect(populatedTracks.length).toBeGreaterThan(0);
  });

  it('marks exactly one capstone per populated track', () => {
    for (const track of populatedTracks) {
      const capstones = getModulesForTrack(track.id).filter((m) => m.isCapstone);
      expect(
        capstones.map((m) => m.id),
        `track ${track.id}`
      ).toHaveLength(1);
    }
  });

  it('gives every layer a module uses a human-readable name', () => {
    for (const track of populatedTracks) {
      const def = TRACK_BY_ID[track.id];
      for (const m of getModulesForTrack(track.id)) {
        const name = def.layerNames?.[m.layer];
        expect(name, `track ${track.id} layer ${m.layer}`).toBeTruthy();
      }
    }
  });

  it('assigns each module a unique order within its track', () => {
    for (const track of populatedTracks) {
      const orders = getModulesForTrack(track.id).map((m) => m.order);
      expect(new Set(orders).size, `track ${track.id}`).toBe(orders.length);
    }
  });

  it('keeps layers contiguous along the pedagogical order (no interleaving)', () => {
    for (const track of populatedTracks) {
      // getModulesForTrack returns ascending `order`; layer index must be non-decreasing so each
      // stage is a contiguous run (otherwise the layer grouping + step numbers would be ambiguous).
      const layerSeq = getModulesForTrack(track.id).map((m) => m.layer);
      for (let i = 1; i < layerSeq.length; i++) {
        expect(layerSeq[i], `track ${track.id}`).toBeGreaterThanOrEqual(layerSeq[i - 1]);
      }
    }
  });

  it('exposes ascending, named layers with their modules in order via getTrackLayers', () => {
    for (const track of populatedTracks) {
      const layers = getTrackLayers(track.id);
      expect(layers.length).toBeGreaterThan(0);
      const indices = layers.map((l) => l.layer);
      expect(indices).toEqual([...indices].sort((a, b) => a - b));
      for (const layer of layers) {
        expect(layer.name).toBeTruthy();
        const orders = layer.modules.map((m) => m.order);
        expect(orders).toEqual([...orders].sort((a, b) => a - b));
      }
    }
  });
});
