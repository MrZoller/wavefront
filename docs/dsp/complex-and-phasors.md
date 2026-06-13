# Complex numbers & phasors

> The atom of DSP. Source: [`src/dsp/complex.ts`](../../src/dsp/complex.ts),
> [`src/dsp/signal.ts`](../../src/dsp/signal.ts).
> Verified by: [`complex.test.ts`](../../src/dsp/complex.test.ts),
> [`signal.test.ts`](../../src/dsp/signal.test.ts).

## The idea (plain language)

A complex number is just a 2D vector `(re, im)`. In radio, that's an **IQ sample**: `re` is the
in-phase (I) component, `im` is the quadrature (Q) component. A signal is an array of these.

The one fact that makes everything else work: **multiplying complex numbers adds their angles
and multiplies their magnitudes.** Multiplication _is_ rotation-and-scale.

## The equations

**Euler's formula** — a unit phasor at angle θ:

```
e^{jθ} = cos θ + j·sin θ          (implemented as expj)
```

**A complex tone** — a phasor whose angle advances linearly with time:

```
x(t) = A · e^{j(2π f t + φ)}      (implemented as phasorAt / generateComplexTone)
       = A·cos(2π f t + φ)  +  j·A·sin(2π f t + φ)
         └────── I ──────┘      └────── Q ──────┘
```

At `f` Hz the phasor completes `f` full turns of the complex plane per second. Sampling at
`fs` Hz takes sample `n` at time `t = n/fs`.

## What the tests pin down

- `e^{j0} = 1`, `e^{jπ/2} = j`, `e^{jπ} = −1`, and every `expj(θ)` lands on the unit circle.
- Multiplication adds angles and multiplies magnitudes (rotation+scale).
- `|z|² = z · conj(z)` (real part).
- A tone's I/Q equal `cos`/`sin` of the advancing angle at every sample.
- A tone at `fs/N` has period exactly `N` samples.

## Where it's used

This is the foundation of the **Rotating Phasor / IQ** module (Track A, Layer 0) and of every
later primitive — steering vectors, mixers, the FFT — all of which are built from spinning and
combining phasors.
