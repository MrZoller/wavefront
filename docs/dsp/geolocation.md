# Geolocation: AoA fix, TDOA, GDOP, and FDOA

> Source: [`src/dsp/geolocation.ts`](../../src/dsp/geolocation.ts),
> [`src/dsp/contour.ts`](../../src/dsp/contour.ts).
> Verified by: [`geolocation.test.ts`](../../src/dsp/geolocation.test.ts),
> [`contour.test.ts`](../../src/dsp/contour.test.ts).

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
defining quantity). Three receivers give intersecting hyperbolas, but those can meet at two points
in 2D; a fourth receiver removes that ambiguity. `tdoaSolve` recovers the position by Gauss–Newton
on the range-difference residuals, searching from a grid of seeds so it finds the true intersection
rather than a nearby local minimum.

## GDOP

Geometric Dilution of Precision maps measurement error to position error at a point. Because TDOA
only observes range _differences_, the geometry matrix uses _differenced_ line-of-sight rows
relative to a reference receiver (`receivers[0]`):

```
GDOP = √( trace( (HᵀH)⁻¹ ) )       rows of H = uᵢ − u₀  (i ≥ 1)   (gdop)
```

Small for well-spread receivers; `→ ∞` as they become clustered or collinear (singular `H`). This
differenced form (vs. a raw range Jacobian) correctly penalizes layouts that are poor specifically
for time-difference positioning, matching the TDOA module it follows. Needs ≥3 receivers.

## FDOA (Doppler difference)

A receiver _in motion_ sees the emitter's carrier Doppler-shifted by its velocity along the line of
sight, `(f₀/c)·(v·û)` (`radialRate` returns the `v·û` part). Two platforms can't know the emitter's
true frequency, but the **difference** of their shifts is observable:

```
Δf = (f₀/c) · (v_rx·û_rx − v_ref·û_ref)        (fdoa)
```

The locus of emitter positions with a constant `Δf` is an **isodoppler curve** — not a conic like a
TDOA hyperbola, so it's traced numerically by marching squares (`isoContour`, a field-agnostic level
-set extractor) rather than a closed form. It's the frequency-domain twin of TDOA and underpins
single-pass geolocation from a moving platform.

## What the tests pin down

- Two bearings cross at the expected point; parallel bearings return `null`.
- The error ellipse is isotropic for an orthogonal equal-range crossing and elongates with range.
- Every generated hyperbola point has the prescribed range difference; none when `|Δr| ≥` focal
  separation.
- `tdoaSolve` recovers a known emitter from exact range differences.
- `gdop = √(8/9)` for three receivers 120° apart; small when spread, huge when clustered, `∞` when
  collinear.
- `radialRate` is `+|v|` closing, `−|v|` opening, `0` across the line of sight; `fdoa` scales the
  rate difference by `f₀/c` and vanishes on the symmetry axis of mirror-image platforms.
- `isoContour` traces a circle for `x²+y²` and a straight line for `x`, and is empty off-level.

## Where it's used

The **AoA Cross-Fixing**, **TDOA Multilateration**, **GDOP Heatmap**, and **FDOA** modules — the
Track A geolocation scenes, all rendered on the shared `WorldMap` viz.
