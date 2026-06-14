/**
 * Modulation feature extractors (brief §6 classification capstone). A few cheap, interpretable
 * statistics that separate the common schemes — the kind of hand-built features a classifier (or a
 * neural net, à la RadioML) learns. Used by a nearest-prototype classifier.
 */

import { type Complex, magnitude } from './complex';
import { fft } from './fft';

export interface Features {
  /** Envelope coefficient of variation std(|s|)/mean(|s|): ~0 for constant-envelope, high for QAM. */
  envelopeCv: number;
  /** Spectral flatness (Wiener entropy) of the power spectrum, 0…1: high = noise-like/wideband. */
  spectralFlatness: number;
  /** Fraction of energy on the Q rail: ~0 for BPSK (real only), ~0.5 for QPSK/QAM/FSK. */
  qFraction: number;
}

const nextPow2 = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(1, n)));

/** Extract the three discriminating features from a complex baseband signal. */
export function extractFeatures(signal: Complex[]): Features {
  const n = signal.length;
  const mags = signal.map(magnitude);
  const meanMag = mags.reduce((s, m) => s + m, 0) / n;
  const varMag = mags.reduce((s, m) => s + (m - meanMag) ** 2, 0) / n;
  const envelopeCv = meanMag > 1e-9 ? Math.sqrt(varMag) / meanMag : 0;

  let qE = 0;
  let totE = 0;
  for (const s of signal) {
    qE += s.im * s.im;
    totE += s.re * s.re + s.im * s.im;
  }
  const qFraction = totE > 1e-12 ? qE / totE : 0;

  const N = nextPow2(n);
  const padded: Complex[] = Array.from({ length: N }, (_, i) =>
    i < n ? signal[i] : { re: 0, im: 0 }
  );
  const power = fft(padded).map((c) => c.re * c.re + c.im * c.im + 1e-12);
  const logMean = power.reduce((s, p) => s + Math.log(p), 0) / N;
  const arithMean = power.reduce((s, p) => s + p, 0) / N;
  const spectralFlatness = Math.exp(logMean) / arithMean;

  return { envelopeCv, spectralFlatness, qFraction };
}

/** Nearest-prototype classifier: the scheme whose feature vector is closest (Euclidean). */
export function classify(f: Features, prototypes: Record<string, Features>): string {
  let best = '';
  let bestD = Infinity;
  for (const [name, p] of Object.entries(prototypes)) {
    const d =
      (f.envelopeCv - p.envelopeCv) ** 2 +
      (f.spectralFlatness - p.spectralFlatness) ** 2 +
      (f.qFraction - p.qFraction) ** 2;
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return best;
}
