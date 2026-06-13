# Geolocation: AoA fix, TDOA, and GDOP

> Source: [`src/dsp/geolocation.ts`](../../src/dsp/geolocation.ts).
> Verified by: [`geolocation.test.ts`](../../src/dsp/geolocation.test.ts).

## The idea (plain language)

A single bearing or time-difference only narrows the emitter to a line or a curve. Cross two or
three of them and you get a position — but how _good_ that position is depends entirely on the
geometry. This page covers the three pieces of Track A, Layer 2.

## AoA cross-fixing

Each DF site gives a line of bearing. Intersecting `N ≥ 2` LOBs is a least-squares solve:

```
each LOB:  nᵀ(x − p) = 0            n = unit normal to the bearing
fix:       (Σ nnᵀ) x = Σ n (nᵀp)             (aoaFix)
```

Weighting each LOB by `1/(rᵢ·σθ)²` (cross-range error grows with range `rᵢ`) gives the position
**covariance**; its eigen-decomposition is the **error ellipse** (`errorEllipse`), which elongates
for distant emitters and shallow crossing angles.

## TDOA multilateration

A measured time difference is a range difference `Δr = c·τ`. The locus of constant range
difference to two receivers is a **hyperbola** (`hyperbolaPoints`, with `rangeDifference` the
defining quantity). Three receivers give intersecting hyperbolas; `tdoaSolve` recovers the
position by Gauss–Newton on the range-difference residuals.

## GDOP

Geometric Dilution of Precision maps measurement error to position error at a point:

```
GDOP = √( trace( (HᵀH)⁻¹ ) )       rows of H = unit line-of-sight to each receiver   (gdop)
```

Small for well-spread receivers; `→ ∞` as they become clustered or collinear (singular `H`).

## What the tests pin down

- Two bearings cross at the expected point; parallel bearings return `null`.
- The error ellipse is isotropic for an orthogonal equal-range crossing and elongates with range.
- Every generated hyperbola point has the prescribed range difference; none when `|Δr| ≥` focal
  separation.
- `tdoaSolve` recovers a known emitter from exact range differences.
- `gdop = √(4/3)` for three receivers 120° apart; small when spread, huge when clustered, `∞` when
  collinear.

## Where it's used

The **AoA Cross-Fixing**, **TDOA Multilateration**, and **GDOP Heatmap** modules — the Track A v1
marquee, all rendered on the shared `WorldMap` viz.
