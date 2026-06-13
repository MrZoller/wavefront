/**
 * Seeded pseudo-random generation — so synthetic example signals (and their screenshots) are
 * reproducible (brief §12: all signals synthetic). A from-scratch Gaussian noise generator is
 * also a listed `dsp/` primitive reused by the channel-model work in later tracks.
 */

/**
 * mulberry32 — a tiny, fast, deterministic 32-bit PRNG. Returns a function yielding uniform
 * floats in [0, 1). Same seed ⇒ same sequence.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Standard-normal samples via the Box–Muller transform:
 *   z = √(−2·ln U₁) · cos(2π·U₂),  with U₁,U₂ ~ Uniform(0,1).
 * Returns `n` samples with mean 0 and standard deviation `sigma`, deterministic for a given seed.
 */
export function gaussianNoise(n: number, sigma = 1, seed = 1): number[] {
  const rng = mulberry32(seed);
  const out: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    // Guard u1 away from 0 so ln() is finite.
    const u1 = Math.max(rng(), Number.EPSILON);
    const u2 = rng();
    out[i] = sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  return out;
}

/** A deterministic bipolar (±1) random sequence — a handy reference signal with a sharp autocorrelation peak. */
export function bipolarSequence(n: number, seed = 1): number[] {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => (rng() < 0.5 ? -1 : 1));
}
