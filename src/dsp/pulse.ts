/**
 * Pulse shaping (brief §5, Track B) — turning discrete symbols into a band-limited continuous
 * waveform, and the matched filter that recovers them. Everything here is real-valued and applied
 * per I/Q component; `sps` is samples per symbol (the oversampling factor of the waveform).
 */

/** Normalized sinc, sinc(x) = sin(πx)/(πx), with sinc(0) = 1. */
const sinc = (x: number): number => (x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));

/**
 * Raised-cosine pulse taps sampled at `sps` samples/symbol over ±`span/2` symbols. The RC pulse is
 * the Nyquist ISI-free shape: it is exactly zero at every nonzero integer symbol offset, so a stream
 * of RC pulses doesn't interfere with its neighbors at the sampling instants. `beta` ∈ [0,1] is the
 * roll-off (0 = brick-wall sinc, 1 = widest/gentlest). Peak-normalized to 1 at the center.
 */
export function raisedCosine(beta: number, span = 8, sps = 8): number[] {
  const n = span * sps;
  const taps: number[] = new Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const t = (i - n / 2) / sps; // time in symbols
    const denom = 1 - (2 * beta * t) ** 2;
    let g: number;
    if (Math.abs(denom) < 1e-9) {
      // Removable singularity at t = ±1/(2β).
      g = (Math.PI / 4) * sinc(1 / (2 * beta));
    } else {
      g = (sinc(t) * Math.cos(Math.PI * beta * t)) / denom;
    }
    taps[i] = g;
  }
  return taps;
}

/**
 * Root-raised-cosine pulse taps (the same RC split across transmitter and receiver, so that an RRC
 * shaping filter followed by an RRC matched filter equals one RC pulse — ISI-free and maximum-SNR).
 * Normalized to unit energy (Σh² = 1), so the matched-filter autocorrelation peaks at 1.
 */
export function rootRaisedCosine(beta: number, span = 8, sps = 8): number[] {
  const n = span * sps;
  const taps: number[] = new Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const t = (i - n / 2) / sps;
    let h: number;
    if (t === 0) {
      h = 1 - beta + (4 * beta) / Math.PI;
    } else if (beta > 0 && Math.abs(Math.abs(t) - 1 / (4 * beta)) < 1e-9) {
      const a = Math.PI / (4 * beta);
      h = (beta / Math.SQRT2) * ((1 + 2 / Math.PI) * Math.sin(a) + (1 - 2 / Math.PI) * Math.cos(a));
    } else {
      const num =
        Math.sin(Math.PI * t * (1 - beta)) + 4 * beta * t * Math.cos(Math.PI * t * (1 + beta));
      h = num / (Math.PI * t * (1 - (4 * beta * t) ** 2));
    }
    taps[i] = h;
  }
  // Unit-energy normalization.
  const energy = Math.sqrt(taps.reduce((s, h) => s + h * h, 0));
  return taps.map((h) => h / energy);
}

/** Insert `sps − 1` zeros after each symbol (zero-stuffing to the waveform sample rate). */
export function upsample(symbols: number[], sps: number): number[] {
  const out = new Array(symbols.length * sps).fill(0);
  for (let i = 0; i < symbols.length; i++) out[i * sps] = symbols[i];
  return out;
}

/** Full linear convolution of `x` with FIR taps `h` (length `x.length + h.length − 1`). */
export function convolve(x: number[], h: number[]): number[] {
  const out = new Array(x.length + h.length - 1).fill(0);
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    if (xi === 0) continue;
    for (let j = 0; j < h.length; j++) out[i + j] += xi * h[j];
  }
  return out;
}
