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
  },
  {
    id: 'playing-a-radio-signal',
    title: 'Playing a Radio Signal',
    description: 'What actually happens when you send data over the air, end to end?',
    status: 'shipping',
  },
  {
    id: 'modulations-and-waveforms',
    title: 'Modulations & Waveforms',
    description: 'Every modulation scheme has a fingerprint — see them side by side.',
    status: 'planned',
  },
  {
    id: 'fundamentals',
    title: 'Fundamentals',
    description: 'Why does any of this work? Sampling, filtering, the FFT, and channelization.',
    status: 'planned',
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
