import type { TrackDef, TrackId } from './types';

/**
 * Track definitions (brief §4–§8). Order here is the canonical display order.
 *
 * v1 ships `direction-finding`; the rest are specced and registered so the
 * navigation shell can show the full roadmap with honest status badges.
 */
export const TRACKS: TrackDef[] = [
  {
    id: 'direction-finding',
    title: 'Direction Finding & Geolocation',
    description: 'How do you find where a transmitter is? From phasors up to a live GDOP map.',
    status: 'shipping',
    layerNames: { 0: 'Foundations', 1: 'Angle of Arrival', 2: 'Geolocation' },
  },
  {
    id: 'playing-a-radio-signal',
    title: 'Playing a Radio Signal',
    description: 'What actually happens when you send data over the air, end to end?',
    status: 'shipping',
    layerNames: { 0: 'The Transmit Chain', 1: 'The Channel & Receiver', 2: 'End to End' },
  },
  {
    id: 'modulations-and-waveforms',
    title: 'Modulations & Waveforms',
    description: 'Every modulation scheme has a fingerprint — see them side by side.',
    status: 'shipping',
    layerNames: { 0: 'Modulation Schemes', 1: 'Classification' },
  },
  {
    id: 'fundamentals',
    title: 'Fundamentals',
    description: 'Why does any of this work? Sampling, filtering, the FFT, and channelization.',
    status: 'building',
    layerNames: {
      0: 'Sampling & the Frequency Domain',
      1: 'Filtering & Multirate',
      2: 'Channelization',
    },
  },
  {
    id: 'propagation-and-bands',
    title: 'Propagation & Bands',
    description: 'The RF physics around the signal: bands, line-of-sight, and HF skywave.',
    status: 'planned',
  },
  {
    id: 'coding-and-equalization',
    title: 'Coding & Equalization',
    description: 'Channel coding, adaptive equalizers, and synchronization loops. (Planned.)',
    status: 'planned',
  },
];

export const TRACK_BY_ID: Record<TrackId, TrackDef> = Object.fromEntries(
  TRACKS.map((t) => [t.id, t])
) as Record<TrackId, TrackDef>;
