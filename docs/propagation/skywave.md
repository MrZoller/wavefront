# Skywave & MUF

> Source: [`src/propagation/skywave.ts`](../../src/propagation/skywave.ts).
> Verified by: [`skywave.test.ts`](../../src/propagation/skywave.test.ts).

## The idea (plain language)

The Sun ionises the upper atmosphere into layers that can act like a mirror for radio. An HF wave
aimed upward bends back down and lands far over the horizon — one **skywave** hop can span a
continent, which is how shortwave reaches around the world. Whether the layer reflects the wave or
lets it punch through to space is the **maximum usable frequency (MUF)** idea. This whole page is
deliberately conceptual — a single layer at a fixed height, illustrative critical frequencies, one
hop. There is no real ionosphere model here.

## The numbers

A single hop reaches the layer (virtual height `h'`) over half the ground range, so it strikes it at
an angle of incidence `φ`:

```
tan φ = (D/2) / h'                                  (incidenceAngleDeg)
```

The secant law turns the layer's vertical **critical frequency** `fc` into the cutoff for that
oblique path:

```
MUF = fc · sec φ                                    (mufMHz)
reflects ⇔ f ≤ MUF                                  (reflectsSkywave)
```

Striking the layer obliquely (a long hop, large `φ`) raises the MUF, so longer hops support higher
frequencies. Night weakens the layer — its critical frequency, and the MUF, drop — so a daytime
frequency that reflected cleanly can punch through after dark.

### The geolocation cross-link

The same physics deflects a **bearing**: on skywave the wave arrives via the ionosphere, so its
apparent direction is tilted a few degrees off the true great-circle bearing. The module models that
as a fixed, illustrative deflection (`SKYWAVE_BEARING_BIAS_DEG`, applied by
`skywaveApparentBearingRad`) — enough to make a straight-ray cross-fix visibly walk off the true
emitter. `reflectionMidpoint` gives the ground point under a single hop. **Not** a bearing-error
prediction.

## What the tests pin down

- `incidenceAngleDeg` is 0° straight up and 45° when `D/2 = h'`, and grows for longer hops.
- `mufMHz` applies the secant law (`MUF = fc` at vertical incidence, `2·fc` at 60°), always raising
  the usable frequency above the vertical critical frequency at oblique incidence.
- `reflectsSkywave` reflects at/below the MUF and penetrates above it.
- The cross-link helpers: `skywaveApparentBearingRad` rotates the bearing by the illustrative bias,
  and `reflectionMidpoint` is the midpoint of the path.

Taught interactively in the conceptual **HF Skywave & the Ionosphere** stub, and applied in the
**AoA cross-fixing** scene's line-of-bearing toggle.
