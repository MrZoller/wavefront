/**
 * Complex numbers — the atom of DSP (brief §3.1).
 *
 * For a software engineer: a complex number is just a 2D vector `(re, im)`. An "IQ sample"
 * is exactly this — `re` is the in-phase (I) component, `im` is the quadrature (Q) component.
 * A signal is an array of these. Everything else in the `dsp/` core is built on these ops.
 *
 * We use a plain `{ re, im }` object rather than a class so values are cheap, immutable-by-
 * convention, and trivially serializable. Small problem sizes; clarity beats cleverness.
 */
export interface Complex {
  re: number;
  im: number;
}

/** Construct a complex number. */
export const complex = (re: number, im = 0): Complex => ({ re, im });

/** Sum: `(a + b)`. Vector addition. */
export const add = (a: Complex, b: Complex): Complex => ({
  re: a.re + b.re,
  im: a.im + b.im,
});

/** Difference: `(a - b)`. */
export const sub = (a: Complex, b: Complex): Complex => ({
  re: a.re - b.re,
  im: a.im - b.im,
});

/**
 * Product: `(a · b)`. The key fact for DSP: multiplying complex numbers
 * **adds their angles and multiplies their magnitudes** — i.e. multiplication is rotation+scale.
 * `(a+bi)(c+di) = (ac − bd) + (ad + bc)i`.
 */
export const mul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

/** Scale by a real factor. */
export const scale = (a: Complex, k: number): Complex => ({ re: a.re * k, im: a.im * k });

/** Complex conjugate: `(re − im·i)`. Mirror across the real axis. */
export const conj = (a: Complex): Complex => ({ re: a.re, im: -a.im });

/** Magnitude (modulus): the vector's length, `√(re² + im²)`. */
export const magnitude = (a: Complex): number => Math.hypot(a.re, a.im);

/** Squared magnitude — `re² + im²`. Cheaper when you don't need the sqrt (e.g. power). */
export const magnitudeSquared = (a: Complex): number => a.re * a.re + a.im * a.im;

/** Phase (argument): the vector's angle in radians, in `(−π, π]`. */
export const phase = (a: Complex): number => Math.atan2(a.im, a.re);

/**
 * Unit phasor `e^{jθ} = cos θ + j·sin θ` — a point on the unit circle at angle θ (Euler's
 * formula). This single function is the seed of every tone, steering vector, and mixer in DSP:
 * "spinning" a phasor over time is what makes a signal.
 */
export const expj = (theta: number): Complex => ({ re: Math.cos(theta), im: Math.sin(theta) });

/** Construct from polar form: magnitude `r` at angle `theta`. */
export const fromPolar = (r: number, theta: number): Complex => scale(expj(theta), r);
