/**
 * Pluggable modulators (brief §5 design note, §6) — a common interface so the *same* bitstream can
 * flow through the *same* channel and views regardless of scheme. This is what makes Track C's
 * side-by-side comparisons free: add a strategy, not a lesson.
 *
 * Every modulator returns complex baseband samples (`re` = I, `im` = Q). Linear/memoryless schemes
 * (PSK/QAM) also return their decision-point `symbols` for the constellation/eye views; constant-
 * envelope schemes (FSK/MSK) carry information in phase/frequency and have no useful constellation.
 */

import { type Complex } from './complex';
import { CONSTELLATIONS, bitsToSymbols, type Constellation } from './comms';
import { convolve, rootRaisedCosine, upsample } from './pulse';

export interface ModResult {
  /** Complex baseband samples. */
  signal: Complex[];
  /** Decision-point symbols (linear schemes only) — for the constellation and eye views. */
  symbols?: Complex[];
  /** Samples per symbol of the generated waveform. */
  sps: number;
}

export interface Modulator {
  name: string;
  family: 'analog' | 'digital' | 'waveform';
  bitsPerSymbol: number;
  /** True if a constellation diagram is meaningful (linear schemes). */
  hasConstellation: boolean;
  modulate(bits: number[], sps: number): ModResult;
}

const BETA = 0.35; // pulse-shaping roll-off shared across linear schemes
const SPAN = 6;

/** A linear (PSK/QAM) modulator: map bits to constellation symbols, then RRC pulse-shape each rail. */
function linear(c: Constellation): Modulator {
  return {
    name: c.name,
    family: 'digital',
    bitsPerSymbol: c.bitsPerSymbol,
    hasConstellation: true,
    modulate(bits, sps) {
      const symbols = bitsToSymbols(bits, c);
      const rrc = rootRaisedCosine(BETA, SPAN, sps);
      const I = convolve(
        upsample(
          symbols.map((s) => s.re),
          sps
        ),
        rrc
      );
      const Q = convolve(
        upsample(
          symbols.map((s) => s.im),
          sps
        ),
        rrc
      );
      const signal = I.map((re, i) => ({ re, im: Q[i] }));
      return { signal, symbols, sps };
    },
  };
}

/**
 * Continuous-phase frequency-shift keying. Each bit steers the instantaneous frequency to
 * ±h/(2·sps) cycles/sample; the phase is integrated so the envelope stays constant (no spectral
 * splatter). Modulation index `h = 0.5` is MSK — the most compact CPFSK.
 */
function cpfsk(name: string, h: number): Modulator {
  return {
    name,
    family: 'digital',
    bitsPerSymbol: 1,
    hasConstellation: false,
    modulate(bits, sps) {
      const signal: Complex[] = [];
      let phase = 0;
      const dphi = (Math.PI * h) / sps; // per-sample phase step magnitude
      for (const b of bits) {
        const dir = b ? 1 : -1;
        for (let n = 0; n < sps; n++) {
          phase += dir * dphi;
          signal.push({ re: Math.cos(phase), im: Math.sin(phase) });
        }
      }
      return { signal, sps };
    },
  };
}

/** The schemes offered in the Modulation Zoo, keyed by name. */
export const MODULATORS: Record<string, Modulator> = {
  BPSK: linear(CONSTELLATIONS.BPSK),
  QPSK: linear(CONSTELLATIONS.QPSK),
  '16-QAM': linear(CONSTELLATIONS.QAM16),
  FSK: cpfsk('FSK', 0.8),
  MSK: cpfsk('MSK', 0.5),
};

// ── Analog modulation (operates on a real message, not bits) ──────────────────

/** AM: complex baseband `(1 + μ·m)` — a carrier whose amplitude follows the message. */
export function am(message: number[], mu = 0.8): Complex[] {
  return message.map((m) => ({ re: 1 + mu * m, im: 0 }));
}

/** FM: constant-envelope `e^{jθ}` with instantaneous frequency proportional to the message;
 *  `dev` is the peak frequency deviation in cycles/sample. */
export function fm(message: number[], dev = 0.05): Complex[] {
  let phase = 0;
  return message.map((m) => {
    phase += 2 * Math.PI * dev * m;
    return { re: Math.cos(phase), im: Math.sin(phase) };
  });
}

/** PM: constant-envelope `e^{j·kp·m}` — phase follows the message directly. */
export function pm(message: number[], kp = Math.PI / 2): Complex[] {
  return message.map((m) => ({ re: Math.cos(kp * m), im: Math.sin(kp * m) }));
}
