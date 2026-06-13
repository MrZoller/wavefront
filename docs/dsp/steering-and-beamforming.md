# Steering vectors & delay-and-sum beamforming

> Source: [`src/dsp/array.ts`](../../src/dsp/array.ts) (and `candidateBearings` in
> [`src/dsp/phase.ts`](../../src/dsp/phase.ts)).
> Verified by: [`array.test.ts`](../../src/dsp/array.test.ts),
> [`candidate-bearings.test.ts`](../../src/dsp/candidate-bearings.test.ts).

## The idea (plain language)

A uniform linear array (ULA) is N identical antennas in a line, spacing `d`. A wave from bearing
`θ` arrives at each element with a constant phase step — the two-element phase difference from
Layer 0, repeated down the line. Phase-combine the elements and you can point a sensitive
&ldquo;beam&rdquo; in a chosen direction.

## The equations

```
β    = 2π · d · sin(θ) / λ                         per-element phase step  (elementPhaseStep)
a(θ) = [1, e^{jβ}, e^{j2β}, …, e^{j(N−1)β}]        steering vector          (steeringVector)
P    = |wᴴ x|²                                     delay-and-sum power      (delayAndSumPower)
P(θ_s) = |a(θ_s)ᴴ a(θ_source)|² / N²              normalized array response (arrayResponse)
```

`beamPattern` samples `arrayResponse` across `[−π/2, π/2]` for the visible gain curve; `toDb`
maps linear power to decibels for display. `candidateBearings` enumerates every bearing
consistent with a wrapped phase — one when `d ≤ λ/2`, several (grating-lobe ambiguity) beyond.

## What the tests pin down

- Steering vector is all-ones at broadside; each element is unit-magnitude with phase `k·β`.
- The pattern peaks (normalized **1**) when steered exactly at the source; matched output power
  equals `N²` unnormalized.
- A known **null**: N=2, d=λ/2, source broadside → response 0 at endfire.
- **Grating-lobe ambiguity** for d>λ/2: a second full-height lobe away from the source.
- `beamPattern`'s peak sits at the source bearing; `toDb(1)=0`, floors non-positive power.
- `candidateBearings` returns one bearing when unambiguous, several (including the truth) when
  not, and every candidate reproduces the same wrapped phase.

## Where it's used

The **Two-Element Interferometer** and **Beamforming / Array Pattern** modules (Track A,
Layer 1), and the foundation for MUSIC super-resolution and the Layer 2 geolocation scenes.
