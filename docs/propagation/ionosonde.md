# Ionosonde & the ionogram

> Source: [`src/propagation/ionosonde.ts`](../../src/propagation/ionosonde.ts).
> Verified by: [`ionosonde.test.ts`](../../src/propagation/ionosonde.test.ts).

## The idea (plain language)

An **ionosonde** is the radar echo trick aimed straight up. Transmit a pulse; if the ionosphere
turns it back, it returns after a round trip, and the delay is a height — `h' = c·t/2`, exactly the
round-trip-delay ranging the [radar](../dsp/radar.md) scene uses for a target. It is a **virtual**
height because it assumes the pulse travelled at the speed of light the whole way; the real
reflection is a little lower, since the wave slows in the plasma before it turns (noted, not
modelled).

Raise the probe frequency and the wave needs denser plasma to turn it back, so it reflects from
higher up and the echo takes longer — the virtual height climbs. Above a cutoff, the **critical
frequency** (foF2 for the F-layer), the wave punches straight through and never returns. Plotting
virtual height against frequency draws the **ionogram**: a trace that rises, cusps up toward the
cutoff, and then stops. Where the echo disappears _is_ foF2 — the number the
[Skywave & MUF](./skywave.md) rule simply asserts. This page is deliberately conceptual: a single
parabolic layer, illustrative critical frequencies, vertical sounding only. There is no real
ionosphere model here.

## The numbers

Echo-delay ranging, pointed up — the radar primitive, in physical units:

```
h' = c·t/2                                          (virtualHeightKmFromDelay)
t  = 2·h'/c                                         (echoDelaySecondsForHeight)
```

A single parabolic layer (peak at `h_m`, half-thickness `y_m`, base `h₀ = h_m − y_m`) gives the
virtual height as a function of the probe frequency `f`, for `f` below the critical frequency `fc`:

```
h'(f) = h₀ + (y_m/2)·(f/fc)·ln((fc + f)/(fc − f))   (virtualHeightKm)
reflects ⇔ f < fc                                   (reflectsVertical)
```

`h'` starts at the layer base `h₀` at low frequency and runs away to infinity (logarithmically) as
`f → fc` — the canonical cusp. At or above `fc` the wave penetrates and there is no echo, so
`virtualHeightKm` returns `null`. `ionogramTrace` sweeps the probe frequency and collects the
reflecting points, so the assembled trace **cuts off at foF2** exactly as a real ionogram does (an
optional `maxHeightKm` ceiling trims the runaway tail).

Vertical sounding reads foF2 straight off that cutoff; the secant law the
[skywave](./skywave.md) rule already uses turns it into the maximum usable frequency for an oblique
path:

```
MUF = foF2 · sec φ                                  (reuses skywave's mufMHz)
```

So at vertical incidence the MUF _is_ foF2 — the ionogram measures the quantity the skywave story
takes as given — and a long, glancing hop (large `φ`) reflects higher frequencies.

## What the tests pin down

- `virtualHeightKmFromDelay` is `c·t/2` (a 2 ms round trip → ~300 km), and inverts
  `echoDelaySecondsForHeight` — an F-region ~300 km echo returns after ~2 ms.
- The virtual height starts at the layer base, rises monotonically with frequency, and diverges as
  `f → foF2`; it shifts rigidly when the layer peak height moves.
- `reflectsVertical` / `virtualHeightKm` recover the cutoff: **no echo at or above foF2**.
- `ionogramTrace` is ascending in frequency with climbing height, cuts off just below foF2, recovers
  a **lower** cutoff at night (a weaker, lower-foF2 layer), and trims the tail at a display ceiling.
- The foF2 → MUF step matches the skywave secant law: `MUF = foF2` at vertical incidence, `foF2·sec φ`
  obliquely (`2·foF2` at 60°).

Taught interactively in the **The Ionosonde & the Ionogram** synthesis scene, which completes the
**HF Skywave & the Ionosphere** story by _measuring_ the critical frequency it asserts.
