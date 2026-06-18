/**
 * Channel estimation & equalization (the Coding & Equalization track, "Undoing the Channel").
 *
 * A multipath channel smears symbols into each other (inter-symbol interference) — it convolves the
 * transmitted stream with a short impulse response `h`. To undo it you must first *measure* it, then
 * *invert* it:
 *
 *  - **Pilot-based estimation** ({@link estimateChannelLS}) — send known symbols, solve the
 *    least-squares system for the taps that best explain what came back.
 *  - **Linear equalizers** ({@link equalize}) — in the frequency domain, divide the spectrum by the
 *    channel: **zero-forcing** `W = 1/H` inverts exactly but amplifies noise in the channel's nulls;
 *    **MMSE** `W = conj(H)/(|H|² + 1/SNR)` backs off there, trading a little residual ISI for noise.
 *  - **Adaptive LMS** ({@link lmsEqualizer}) — an FIR filter that *learns* the inverse from its own
 *    error, one gradient step per sample: `w ← w + μ·e·x*`. The conceptual ancestor of a learned
 *    (neural) equalizer.
 *
 * Symbols live in the shared complex/IQ plane. The block model is circular convolution (an FFT bin
 * per "subcarrier"), the same algebra that makes equalization trivial inside OFDM.
 */

import { type Complex, add, conj, magnitude, magnitudeSquared, mul, scale, sub } from './complex';
import { fft, ifft } from './fft';

const ZERO: Complex = { re: 0, im: 0 };

/** Complex division a / b. */
function cdiv(a: Complex, b: Complex): Complex {
  const d = magnitudeSquared(b);
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
}

// ----------------------------------------------------------------------------------------------
// The channel as convolution
// ----------------------------------------------------------------------------------------------

/** Causal linear FIR channel: `y[n] = Σ_l h[l]·x[n−l]`, truncated to the input length. */
export function applyChannelLinear(x: Complex[], taps: Complex[]): Complex[] {
  return x.map((_, n) => {
    let acc = ZERO;
    for (let l = 0; l < taps.length; l++) {
      if (n - l >= 0) acc = add(acc, mul(taps[l], x[n - l]));
    }
    return acc;
  });
}

/** Channel frequency response `H[k] = FFT(h)` over `n` bins (taps zero-padded to `n`, a power of 2). */
export function channelFreqResponse(taps: Complex[], n: number): Complex[] {
  const padded: Complex[] = Array.from({ length: n }, (_, i) => taps[i] ?? ZERO);
  return fft(padded);
}

/** Magnitude of a complex frequency response in dB — the overlay used for "estimate vs. truth". */
export function responseDb(H: Complex[]): number[] {
  return H.map((h) => 20 * Math.log10(Math.max(1e-6, magnitude(h))));
}

/** Circular-convolution channel (block / OFDM model): `y = IFFT(FFT(x)·H)`. Length must be a power of 2. */
export function applyChannelCircular(x: Complex[], taps: Complex[]): Complex[] {
  const H = channelFreqResponse(taps, x.length);
  const X = fft(x);
  return ifft(X.map((Xk, k) => mul(Xk, H[k])));
}

// ----------------------------------------------------------------------------------------------
// Pilot-based least-squares channel estimation
// ----------------------------------------------------------------------------------------------

/** Solve the small complex linear system `A·x = b` by Gaussian elimination with partial pivoting. */
function solveComplex(A: Complex[][], b: Complex[]): Complex[] {
  const n = b.length;
  const M = A.map((row, i) => [...row.map((c) => ({ ...c })), { ...b[i] }]); // augmented copy
  for (let col = 0; col < n; col++) {
    // Pivot on the largest-magnitude entry in this column.
    let piv = col;
    for (let r = col + 1; r < n; r++) {
      if (magnitudeSquared(M[r][col]) > magnitudeSquared(M[piv][col])) piv = r;
    }
    [M[col], M[piv]] = [M[piv], M[col]];
    const diag = M[col][col];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = cdiv(M[r][col], diag);
      for (let c = col; c <= n; c++) M[r][c] = sub(M[r][c], mul(f, M[col][c]));
    }
  }
  return M.map((row, i) => cdiv(row[n], M[i][i]));
}

/**
 * Least-squares estimate of a length-`numTaps` complex channel from known **pilot** symbols and the
 * received samples (model `y = A·h + noise`, with `A` the convolution matrix of the pilots). Solves
 * the normal equations `(AᴴA)·ĥ = AᴴY`. With no noise it recovers the channel exactly; the estimate's
 * variance falls as the pilot count grows and the noise shrinks — so the estimate converges to truth.
 */
export function estimateChannelLS(
  pilots: Complex[],
  received: Complex[],
  numTaps: number
): Complex[] {
  const M = Math.min(pilots.length, received.length);
  // Normal-equations matrix AᴴA (numTaps × numTaps) and right-hand side AᴴY.
  const AhA: Complex[][] = Array.from({ length: numTaps }, () =>
    Array.from({ length: numTaps }, () => ({ ...ZERO }))
  );
  const AhY: Complex[] = Array.from({ length: numTaps }, () => ({ ...ZERO }));
  for (let n = 0; n < M; n++) {
    for (let i = 0; i < numTaps; i++) {
      if (n - i < 0) continue;
      const ai = pilots[n - i]; // A[n][i]
      AhY[i] = add(AhY[i], mul(conj(ai), received[n]));
      for (let j = 0; j < numTaps; j++) {
        if (n - j < 0) continue;
        AhA[i][j] = add(AhA[i][j], mul(conj(ai), pilots[n - j]));
      }
    }
  }
  return solveComplex(AhA, AhY);
}

// ----------------------------------------------------------------------------------------------
// Linear (zero-forcing / MMSE) equalizer
// ----------------------------------------------------------------------------------------------

export type EqMode = 'zf' | 'mmse';

/**
 * Frequency-domain linear equalizer: invert the channel block by block.
 *  - **zf**:   `W = 1/H` — exact inverse, but blows noise up wherever `|H|` is small (its nulls).
 *  - **mmse**: `W = conj(H)/(|H|² + 1/SNR)` — backs off in the nulls (needs the linear SNR).
 *
 * `received` length must be a power of 2 (it's the FFT block).
 */
export function equalize(
  received: Complex[],
  channelTaps: Complex[],
  mode: EqMode,
  snrLinear = 100
): Complex[] {
  const N = received.length;
  const H = channelFreqResponse(channelTaps, N);
  const Y = fft(received);
  const Xhat = Y.map((Yk, k) => {
    const Hk = H[k];
    if (mode === 'zf') {
      const denom = magnitudeSquared(Hk);
      return denom < 1e-12 ? scale(Yk, 0) : mul(Yk, cdiv(conj(Hk), { re: denom, im: 0 }));
    }
    // MMSE: H* / (|H|² + 1/SNR)
    const denom = magnitudeSquared(Hk) + 1 / snrLinear;
    return mul(Yk, scale(conj(Hk), 1 / denom));
  });
  return ifft(Xhat);
}

// ----------------------------------------------------------------------------------------------
// Error Vector Magnitude — the constellation-quality readout
// ----------------------------------------------------------------------------------------------

/**
 * EVM: RMS distance from each received symbol to its ideal point, normalized by the RMS ideal
 * amplitude (returned as a fraction; ×100 for a percentage). The number that drops when the
 * equalizer re-clusters the constellation.
 */
export function evm(received: Complex[], ideal: Complex[]): number {
  const n = Math.min(received.length, ideal.length);
  if (n === 0) return 0;
  let err = 0;
  let ref = 0;
  for (let i = 0; i < n; i++) {
    err += magnitudeSquared(sub(received[i], ideal[i]));
    ref += magnitudeSquared(ideal[i]);
  }
  return ref > 0 ? Math.sqrt(err / ref) : 0;
}

// ----------------------------------------------------------------------------------------------
// Adaptive LMS equalizer
// ----------------------------------------------------------------------------------------------

/** A snapshot of the adaptive filter at one training step. */
export interface LmsSnapshot {
  /** Tap weights at this step (a copy — safe to retain for animation). */
  weights: Complex[];
  /** Instantaneous squared error |e|² — the convergence curve, falling toward the noise floor. */
  errorSq: number;
}

export interface LmsRun {
  /** Final converged tap weights. */
  weights: Complex[];
  /** Per-step history (weights + error) for the live "watch it converge" view. */
  history: LmsSnapshot[];
}

/** Apply a complex FIR filter (the learned equalizer): `y[n] = Σ_k w[k]·x[n−k]`. */
export function firFilter(x: Complex[], weights: Complex[]): Complex[] {
  return x.map((_, n) => {
    let acc = ZERO;
    for (let k = 0; k < weights.length; k++) {
      if (n - k >= 0) acc = add(acc, mul(weights[k], x[n - k]));
    }
    return acc;
  });
}

/**
 * Least-mean-squares adaptive equalizer. The filter output is `y[n] = Σ_k w_k·x[n−k]`; against the
 * known training symbol `d[n−delay]` it forms the error `e = d − y` and takes one gradient step
 * `w_k ← w_k + μ·e·x[n−k]*` per sample. Over the training stream the weights climb to the channel's
 * inverse and `|e|²` falls (in the mean) toward the noise floor — gradient descent on error, the
 * idea a neural equalizer generalizes.
 *
 * @param received the channel output (the filter input `x`)
 * @param desired  the known transmitted symbols `d`
 * @param numTaps  equalizer length
 * @param mu       step size (too large diverges; too small crawls)
 * @param opts.delay  alignment delay between `d` and the equalizer output
 * @param opts.epochs passes over the training data (to converge on a short sequence)
 */
export function lmsEqualizer(
  received: Complex[],
  desired: Complex[],
  numTaps: number,
  mu: number,
  opts: { delay?: number; epochs?: number } = {}
): LmsRun {
  const delay = opts.delay ?? 0;
  const epochs = opts.epochs ?? 1;
  const w: Complex[] = Array.from({ length: numTaps }, () => ({ ...ZERO }));
  const history: LmsSnapshot[] = [];
  const N = received.length;

  for (let epoch = 0; epoch < epochs; epoch++) {
    for (let n = delay; n < N; n++) {
      if (n - delay >= desired.length) break;
      // Filter output over the tap-delay line.
      let y = ZERO;
      for (let k = 0; k < numTaps; k++) {
        if (n - k >= 0) y = add(y, mul(w[k], received[n - k]));
      }
      const e = sub(desired[n - delay], y);
      for (let k = 0; k < numTaps; k++) {
        if (n - k >= 0) w[k] = add(w[k], scale(mul(e, conj(received[n - k])), mu));
      }
      history.push({ weights: w.map((c) => ({ ...c })), errorSq: magnitudeSquared(e) });
    }
  }

  return { weights: w.map((c) => ({ ...c })), history };
}
