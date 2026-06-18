/**
 * The radio bands and their dominant propagation behaviour (brief §8).
 *
 * A deliberately small, **illustrative** lookup — the textbook LF…SHF ladder with the one
 * propagation mode that characterises each band, plus a rough reach for the picture. These are
 * teaching bands, *not* precise predictions: real reach depends on power, antennas, terrain, and the
 * ionosphere on the day. The point is the qualitative "aha": low bands hug the ground or bounce off
 * the sky and travel far; high bands go line-of-sight and stay local.
 */

/** The propagation mode that dominates a band at textbook level. */
export type PropagationMode = 'ground-wave' | 'skywave' | 'line-of-sight';

export interface Band {
  /** URL-safe id. */
  id: string;
  /** Abbreviation (LF, MF, HF, VHF, UHF, SHF). */
  abbr: string;
  /** Spelled-out name. */
  name: string;
  /** Lower edge of the band, inclusive, in Hz. */
  minHz: number;
  /** Upper edge of the band, exclusive, in Hz. */
  maxHz: number;
  /** The propagation mode that characterises the band (illustrative). */
  mode: PropagationMode;
  /** A rough illustrative reach in km — for the schematic only, never a prediction. */
  reachKm: number;
  /** One-line reach description, written for the picture's caption. */
  reach: string;
  /** A familiar everyday user of the band, to anchor the intuition. */
  example: string;
}

/**
 * The band table, ascending in frequency. Edges follow the standard decade boundaries
 * (LF 30–300 kHz, MF 0.3–3 MHz, HF 3–30 MHz, VHF 30–300 MHz, UHF 0.3–3 GHz, SHF 3–30 GHz).
 * Modes and reaches are the textbook headline for each band.
 */
export const BANDS: readonly Band[] = [
  {
    id: 'lf',
    abbr: 'LF',
    name: 'Low Frequency',
    minHz: 30e3,
    maxHz: 300e3,
    mode: 'ground-wave',
    reachKm: 1500,
    reach: 'ground wave hugs the curve of the Earth — hundreds to a couple thousand km',
    example: 'longwave time & navigation signals',
  },
  {
    id: 'mf',
    abbr: 'MF',
    name: 'Medium Frequency',
    minHz: 300e3,
    maxHz: 3e6,
    mode: 'ground-wave',
    reachKm: 600,
    reach: 'ground wave by day (regional); skywave at night carries it much farther',
    example: 'AM broadcast — local by day, distant after dark',
  },
  {
    id: 'hf',
    abbr: 'HF',
    name: 'High Frequency',
    minHz: 3e6,
    maxHz: 30e6,
    mode: 'skywave',
    reachKm: 12000,
    reach: 'skywave bounces off the ionosphere — can reach around the world',
    example: 'shortwave & amateur radio',
  },
  {
    id: 'vhf',
    abbr: 'VHF',
    name: 'Very High Frequency',
    minHz: 30e6,
    maxHz: 300e6,
    mode: 'line-of-sight',
    reachKm: 60,
    reach: 'line-of-sight — roughly to the radio horizon, so it stays local',
    example: 'FM radio & broadcast TV',
  },
  {
    id: 'uhf',
    abbr: 'UHF',
    name: 'Ultra High Frequency',
    minHz: 300e6,
    maxHz: 3e9,
    mode: 'line-of-sight',
    reachKm: 40,
    reach: 'line-of-sight, short range — a clear path to the antenna matters',
    example: 'cellular, Wi-Fi & GPS',
  },
  {
    id: 'shf',
    abbr: 'SHF',
    name: 'Super High Frequency',
    minHz: 3e9,
    maxHz: 30e9,
    mode: 'line-of-sight',
    reachKm: 30,
    reach: 'tight line-of-sight beams — easily blocked by terrain or rain',
    example: 'microwave links, radar & satellite',
  },
] as const;

/**
 * The band containing a frequency. Frequencies below the lowest band clamp to it and frequencies at
 * or above the highest clamp to that, so a slider that runs off either end still names a band.
 *
 * @param frequencyHz frequency in Hz
 * @returns the matching {@link Band}
 */
export function bandFor(frequencyHz: number): Band {
  if (frequencyHz < BANDS[0].minHz) return BANDS[0];
  for (const b of BANDS) {
    if (frequencyHz >= b.minHz && frequencyHz < b.maxHz) return b;
  }
  return BANDS[BANDS.length - 1];
}

/** Human label for a propagation mode (for readouts/captions). */
export function modeLabel(mode: PropagationMode): string {
  switch (mode) {
    case 'ground-wave':
      return 'ground wave';
    case 'skywave':
      return 'skywave';
    case 'line-of-sight':
      return 'line-of-sight';
  }
}
