# Phase difference (two-element geometry)

> Source: [`src/dsp/phase.ts`](../../src/dsp/phase.ts).
> Verified by: [`phase.test.ts`](../../src/dsp/phase.test.ts).

## The idea (plain language)

Two antennas a distance `d` apart hear the same wave at slightly different moments — the wave
reaches the near one first. That tiny delay shows up as a **phase difference** on the carrier,
and the phase difference encodes the wave's **bearing**. This is the seed of all angle-of-arrival
direction finding.

## The equations

For a plane wave at bearing `θ` (from broadside) on a baseline `d`, wavelength `λ`:

```
Δr = d · sin(θ)                  extra path to the far sensor   (pathLengthDifference)
Δφ = 2π · d · sin(θ) / λ         that path as a carrier phase   (phaseDifference)
θ  = asin( Δφ · λ / (2π · d) )   invert phase → bearing         (bearingFromPhase)
```

Spatial sampling is **unambiguous** only when `d ≤ λ/2` (`isUnambiguous`). Beyond that, `Δφ`
wraps past ±π and multiple bearings map to the same measured phase. `wrapPhase` folds a phase
into the principal interval `(−π, π]`.

## What the tests pin down

- Zero extra path / phase at broadside; `Δr = d·sin θ`; `d=λ/2` at endfire gives `Δφ = π`.
- The ambiguity flag flips exactly at `d = λ/2`.
- `wrapPhase` maps `−π → +π`, `1.5π → −0.5π`, etc.
- `bearingFromPhase` inverts `phaseDifference` across the unambiguous range, and returns `NaN`
  when the phase implies `|sin θ| > 1`.

## Where it's used

The **Phase Difference** module (Track A, Layer 0), and the foundation for the **interferometer**
and **beamforming** modules in Layer 1.
