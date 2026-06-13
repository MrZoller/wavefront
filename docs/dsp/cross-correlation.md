# Cross-correlation (the lag finder)

> Source: [`src/dsp/correlation.ts`](../../src/dsp/correlation.ts).
> Verified by: [`correlation.test.ts`](../../src/dsp/correlation.test.ts).

## The idea (plain language)

Slide one signal past another; at each shift, take their dot product. Where they line up the
dot product spikes. The **lag of the peak** is the delay between the two recordings. Noise mostly
cancels in the sum, so this is a remarkably robust way to measure _when_ a signal arrived — the
engine of TDOA geolocation.

## The equation

```
c[ℓ] = Σ_n  ref[n] · sig[n + ℓ]        (crossCorrelate)
```

with out-of-range indices treated as 0. **Sign convention:** if `sig` is `ref` delayed by `D`
samples (`sig[n] = ref[n − D]`), the peak lands at `ℓ = D`, so `peakLag` reads out the delay
directly. `autoCorrelate(x) = crossCorrelate(x, x)` peaks at lag 0 with value equal to the
signal energy `Σ x²`.

## What the tests pin down

- Autocorrelation peaks at lag 0 with value `Σ x²`.
- A known delay is recovered exactly (`peakLag === shift`), including for a random reference with
  added noise.
- The full lag range is `[−(n−1), m−1]`.
- A hand-computed example: `crossCorrelate([1,2],[3,4]) → values [6, 11, 4]` at lags `[−1,0,1]`.

## Where it's used

The **Cross-Correlation as a Lag Finder** module (Track A, Layer 0), and the basis for **TDOA
multilateration** in Layer 2 (peak lag → time-difference-of-arrival → hyperbola).
