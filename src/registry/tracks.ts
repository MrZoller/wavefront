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
    layerNames: { 0: 'Modulation Schemes', 1: 'Classification', 2: 'Synthesis' },
  },
  {
    id: 'fundamentals',
    title: 'Fundamentals',
    description: 'Why does any of this work? Sampling, filtering, the FFT, and channelization.',
    status: 'shipping',
    layerNames: {
      0: 'Sampling & the Frequency Domain',
      1: 'Filtering & Multirate',
      2: 'Channelization',
    },
  },
  {
    id: 'signal-chain-sdr',
    title: 'Signal Chain & SDR',
    description:
      'Where do the IQ samples come from? The analog↔digital boundary, and how a real radio maps to the math.',
    status: 'shipping',
    layerNames: {
      0: 'The Analog/Digital Boundary',
      1: 'Architecture & Orientation',
    },
  },
  {
    id: 'propagation-and-bands',
    title: 'Propagation & Bands',
    description:
      'The RF physics around the signal: bands, line-of-sight, HF skywave, and sounding the ionosphere.',
    status: 'shipping',
    layerNames: { 0: 'Bands & Reach', 1: 'Synthesis' },
  },
  {
    id: 'coding-and-equalization',
    title: 'Coding & Equalization',
    description:
      'Make the link survive a real channel: correct flipped bits with coding, then measure and undo what the channel did to the waveform.',
    status: 'shipping',
    layerNames: { 0: 'Error Control', 1: 'Undoing the Channel' },
  },
];

export const TRACK_BY_ID: Record<TrackId, TrackDef> = Object.fromEntries(
  TRACKS.map((t) => [t.id, t])
) as Record<TrackId, TrackDef>;
