import type { Complex } from './complex';
import { expj, scale } from './complex';

/** A block of complex (IQ) samples plus the rate they were sampled at. */
export interface ComplexSignal {
  /** In-phase + quadrature samples. */
  samples: Complex[];
  /** Samples per second (Hz). */
  sampleRate: number;
}

/**
 * The phasor value of a complex tone at continuous time `t`:
 *
 *   `x(t) = A · e^{j(2π f t + φ)}`
 *
 * This is *the* equation of the rotating-phasor module: a complex exponential whose angle
 * advances linearly with time. At `f` Hz it completes `f` full turns of the complex plane
 * per second. (Real part = I = `A·cos(2πft+φ)`, imaginary part = Q = `A·sin(2πft+φ)`.)
 */
export function phasorAt(t: number, frequency: number, phase = 0, amplitude = 1): Complex {
  return scale(expj(2 * Math.PI * frequency * t + phase), amplitude);
}

/**
 * Generate `numSamples` of a complex tone at `frequency` Hz, sampled at `sampleRate` Hz.
 * Returns the IQ sample block. Sample `n` is taken at time `t = n / sampleRate`.
 */
export function generateComplexTone(
  frequency: number,
  sampleRate: number,
  numSamples: number,
  phase = 0,
  amplitude = 1
): ComplexSignal {
  const samples: Complex[] = new Array(numSamples);
  for (let n = 0; n < numSamples; n++) {
    samples[n] = phasorAt(n / sampleRate, frequency, phase, amplitude);
  }
  return { samples, sampleRate };
}

/** Pull the in-phase (I) component out of a signal as a plain number array (for plotting). */
export const realPart = (sig: ComplexSignal): number[] => sig.samples.map((s) => s.re);

/** Pull the quadrature (Q) component out of a signal as a plain number array (for plotting). */
export const imagPart = (sig: ComplexSignal): number[] => sig.samples.map((s) => s.im);
